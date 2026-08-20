import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity } from '@ids-ts/loader';
import Button from '@ids-ts/button';
import PageMessage from '@ids-ts/page-message';
import { B3 } from '@ids-ts/typography';
import { Pagination } from '@ids-ts/pagination';
import { CircleExclamationFill } from '@design-systems/icons';
import { useIntl, useTracking } from '@payroll/quicksand';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import { DEFAULT_PAGE_SIZE } from '../../constants';
import { usePostsFeed } from '../../hooks/usePostsFeed';
import { useCurrentWorker } from '../../hooks/useCurrentWorker';
import { useDeletePost } from '../../hooks/useDeletePost';
import { useMarkPostsRead } from '../../hooks/useMarkPostsRead';
import { usePostsTrackingPoints } from '../../hooks/usePostsTrackingPoints';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  openComposer,
  closeComposer,
  openEditComposer,
  openThread,
  closeThread,
  openDeleteConfirm,
  closeDeleteConfirm,
  setDeleteModalError,
  setFeedError,
  cancelEditReply,
  setUnreadCount,
} from '../../store/postsUiSlice';
import { Post } from '../../types/posts';
import PostsEmptyState from '../PostsEmptyState';
import PostCard from './PostCard';
import PostComposerDrawer from './PostComposerDrawer';
import PostThreadDrawer from './PostThreadDrawer';
import {
  FeedContainer,
  FeedToolbar,
  PostsList,
  PaginationFooter,
  LoaderContainer,
  DeleteModalBadge,
} from './PostsFeed.styled';

interface PostsFeedProps {
  projectId: string;
  customerId?: string;
  /**
   * Optional shell-provided worker id seed. The feed resolves the logged-in
   * worker itself (id + type) on mount — i.e. the worker-id call fires once
   * when the Posts tab opens, not on every ProjectSummary render.
   */
  workerId?: string | null;
  /** Company QB timezone string (from the settings slice). */
  qbTimezone?: string;
}

const PostsFeed: React.FC<PostsFeedProps> = ({
  projectId,
  customerId,
  workerId,
  qbTimezone,
}) => {
  const intl = useIntl();
  const text = useCallback((id: string) => intl.formatMessage({ id }), [intl]);
  const track = useTracking();
  const trackingPoints = usePostsTrackingPoints();
  const dispatch = useAppDispatch();
  const composerOpen = useAppSelector((state) => state.postsUi.composerOpen);
  const editingPost = useAppSelector((state) => state.postsUi.editingPost);
  const editingReply = useAppSelector((state) => state.postsUi.editingReply);
  const openThreadPost = useAppSelector(
    (state) => state.postsUi.openThreadPost,
  );
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const deleteTarget = useAppSelector(
    (state) => state.postsUi.deleteTargetPost,
  );
  const deleteModalError = useAppSelector(
    (state) => state.postsUi.deleteModalError,
  );
  const feedError = useAppSelector((state) => state.postsUi.feedError);
  const refetchRepliesRef = useRef<(() => void) | null>(null);

  const { inProgress: deleteInProgress, deletePost } = useDeletePost();
  const { markPostsRead } = useMarkPostsRead();

  const {
    workerId: currentWorkerId,
    workerType: currentWorkerType,
    loading: workerLoading,
  } = useCurrentWorker(workerId);

  const {
    posts,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    fetchFeed,
    refetchCurrentPage,
    goToNextPage,
    goToPrevPage,
  } = usePostsFeed();

  useEffect(() => {
    if (!currentWorkerId || !projectId) return;
    fetchFeed({ projectId, customerId, workerId: currentWorkerId });
    if (currentWorkerType) {
      markPostsRead({
        projectId,
        workerId: currentWorkerId,
        workerType: currentWorkerType,
      }).then((result) => {
        if (result.success) {
          dispatch(setUnreadCount(0));
        }
      });
    }
  }, [
    fetchFeed,
    markPostsRead,
    dispatch,
    projectId,
    customerId,
    currentWorkerId,
    currentWorkerType,
  ]);

  // Surface pagination errors as a feed-level banner when posts are already
  // on screen (the full-page error state handles the initial-load case).
  useEffect(() => {
    if (error && posts.length > 0) {
      dispatch(setFeedError(text('timeProject.posts.paginationError')));
    }
  }, [error, posts.length, dispatch, text]);

  useEffect(
    () => () => {
      dispatch(closeDeleteConfirm());
      dispatch(setFeedError(null));
    },
    [dispatch],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < page) {
        goToPrevPage();
      } else if (newPage > page) {
        goToNextPage();
      }
    },
    [page, goToPrevPage, goToNextPage],
  );

  const handleOpenComposer = useCallback(() => {
    dispatch(openComposer());
  }, [dispatch]);

  const handleNewPostClick = useCallback(() => {
    track(trackingPoints.NEW_POST_BUTTON);
    handleOpenComposer();
  }, [track, trackingPoints, handleOpenComposer]);

  const handleCreatePostClick = useCallback(() => {
    track(trackingPoints.CREATE_POST_BUTTON);
    handleOpenComposer();
  }, [track, trackingPoints, handleOpenComposer]);

  const handleCloseComposer = useCallback(() => {
    dispatch(closeComposer());
  }, [dispatch]);

  const handleOpenThread = useCallback(
    (post: Post) => {
      dispatch(openThread(post));
    },
    [dispatch],
  );

  const handleSeeRepliesClick = useCallback(
    (post: Post) => {
      track(trackingPoints.SEE_REPLIES);
      handleOpenThread(post);
    },
    [track, trackingPoints, handleOpenThread],
  );

  const handleCloseThread = useCallback(() => {
    dispatch(closeThread());
  }, [dispatch]);

  const refetchFeed = useCallback(() => {
    if (currentWorkerId) {
      fetchFeed({ projectId, customerId, workerId: currentWorkerId });
    }
  }, [currentWorkerId, fetchFeed, projectId, customerId]);

  const handlePosted = useCallback(() => {
    const msg = editingPost
      ? text('timeProject.posts.composer.editSuccess')
      : text('timeProject.posts.composer.saveSuccess');
    setToastMessage(msg);
    setShowToast(true);
    if (editingPost) {
      refetchCurrentPage();
    } else {
      refetchFeed();
    }
  }, [text, refetchFeed, refetchCurrentPage, editingPost]);

  const handleReplied = useCallback(() => {
    setToastMessage(text('timeProject.posts.thread.replySuccess'));
    setShowToast(true);
    refetchFeed();
  }, [text, refetchFeed]);

  const handleReplyEdited = useCallback(() => {
    setToastMessage(text('timeProject.posts.thread.editSuccess'));
    setShowToast(true);
    refetchFeed();
  }, [text, refetchFeed]);

  const handleRegisterRefetchReplies = useCallback(
    (fn: (() => void) | null) => {
      refetchRepliesRef.current = fn;
    },
    [],
  );

  const handleDeleteReply = useCallback(
    (reply: Post) => {
      track(trackingPoints.DELETE_POST);
      dispatch(openDeleteConfirm(reply));
    },
    [dispatch, track, trackingPoints],
  );

  // ---- Edit handlers ----

  const handleEditPost = useCallback(
    (post: Post) => {
      track(trackingPoints.EDIT_POST);
      dispatch(openEditComposer(post));
    },
    [dispatch, track, trackingPoints],
  );

  const handleDeletePost = useCallback(
    (post: Post) => {
      track(trackingPoints.DELETE_POST);
      dispatch(openDeleteConfirm(post));
    },
    [dispatch, track, trackingPoints],
  );

  const handleCancelDelete = useCallback(() => {
    track(trackingPoints.CANCEL_POST_DELETION);
    dispatch(closeDeleteConfirm());
  }, [dispatch, track, trackingPoints]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || !currentWorkerId || !currentWorkerType) {
      return;
    }
    track(trackingPoints.DELETE_POST_CONFIRM);
    if (!customerId) {
      dispatch(closeDeleteConfirm());
      dispatch(setFeedError(text('timeProject.posts.unavailableError')));
      return;
    }

    const result = await deletePost({
      postId: deleteTarget.id,
      projectId,
      customerId,
      workerId: currentWorkerId,
      workerType: currentWorkerType,
    });

    if (result.success) {
      const isReplyDelete = !!deleteTarget.parentPostId;
      const deletedPostId = deleteTarget.id;
      dispatch(closeDeleteConfirm());
      dispatch(setFeedError(null));
      if (isReplyDelete) {
        refetchRepliesRef.current?.();
        if (editingReply?.id === deletedPostId) {
          dispatch(cancelEditReply());
        }
      }
      setToastMessage(
        text(
          isReplyDelete
            ? 'timeProject.posts.delete.replySuccess'
            : 'timeProject.posts.delete.success',
        ),
      );
      setShowToast(true);
      refetchFeed();
      return;
    }

    if (result.errorCode === 'HAS_ACTIVE_REPLIES') {
      dispatch(
        setDeleteModalError(text('timeProject.posts.delete.hasRepliesError')),
      );
      return;
    }

    dispatch(closeDeleteConfirm());
    dispatch(setFeedError(text('timeProject.posts.delete.error')));
  }, [
    deleteTarget,
    currentWorkerId,
    customerId,
    currentWorkerType,
    deletePost,
    dispatch,
    projectId,
    text,
    refetchFeed,
    editingReply,
    track,
    trackingPoints,
  ]);

  const drawersAndToast = (
    <>
      {composerOpen && (
        <PostComposerDrawer
          projectId={projectId}
          customerId={customerId}
          workerId={workerId}
          onClose={handleCloseComposer}
          onPosted={handlePosted}
          postToEdit={editingPost}
        />
      )}
      {openThreadPost && currentWorkerId && (
        <PostThreadDrawer
          post={openThreadPost}
          projectId={projectId}
          customerId={customerId}
          workerId={currentWorkerId}
          workerType={currentWorkerType ?? ''}
          qbTimezone={qbTimezone}
          onClose={handleCloseThread}
          onReplied={handleReplied}
          onReplyEdited={handleReplyEdited}
          onDeleteReply={handleDeleteReply}
          onRegisterRefetchReplies={handleRegisterRefetchReplies}
        />
      )}
      <SuccessToast
        message={toastMessage}
        open={showToast}
        onClose={() => setShowToast(false)}
      />
      <ConfirmationModal
        image={
          <DeleteModalBadge shape="round" status="warning" aria-label="Warning">
            <CircleExclamationFill />
          </DeleteModalBadge>
        }
        open={deleteTarget !== null}
        setOpen={(open) => {
          if (!open) handleCancelDelete();
        }}
        title={text(
          deleteTarget?.parentPostId
            ? 'timeProject.posts.delete.replyConfirmTitle'
            : 'timeProject.posts.delete.confirmTitle',
        )}
        size="small"
        headerAlignment="center"
        contentAlignment="center"
        actionAlignment="center"
        showSectionDivider={false}
        yesButtonLabel={text(
          deleteTarget?.parentPostId
            ? 'timeProject.posts.delete.replyConfirmButton'
            : 'timeProject.posts.delete.confirmButton',
        )}
        noButtonLabel={text('timeProject.posts.delete.cancelButton')}
        onYesClick={handleConfirmDelete}
        onNoClick={handleCancelDelete}
        isLoading={deleteInProgress}
        dismissible
      >
        <>
          <B3>
            {text(
              deleteTarget?.parentPostId
                ? 'timeProject.posts.delete.replyConfirmBody'
                : 'timeProject.posts.delete.confirmBody',
            )}
          </B3>
          {deleteModalError && (
            <PageMessage
              type="error"
              title={deleteModalError}
              data-testid="delete-post-modal-error"
            />
          )}
        </>
      </ConfirmationModal>
    </>
  );

  if ((workerLoading || loading) && posts.length === 0) {
    return (
      <FeedContainer data-testid="project-posts-feed">
        <LoaderContainer>
          <Activity
            shape="dots"
            size="large"
            data-testid="project-posts-loader"
          />
        </LoaderContainer>
        {drawersAndToast}
      </FeedContainer>
    );
  }

  // Required IDs failed to resolve — posts cannot load at all.
  if (!workerLoading && (!projectId || !currentWorkerId)) {
    return (
      <FeedContainer data-testid="project-posts-feed">
        <PageMessage
          type="error"
          title={text('timeProject.posts.unavailableError')}
          data-testid="project-posts-unavailable"
        />
      </FeedContainer>
    );
  }

  if (error && posts.length === 0) {
    return (
      <FeedContainer data-testid="project-posts-feed">
        <B3 data-testid="project-posts-error">
          {text('timeProject.posts.error')}
        </B3>
        {drawersAndToast}
      </FeedContainer>
    );
  }

  if (posts.length === 0) {
    return (
      <div data-testid="project-posts-feed">
        <PostsEmptyState onCreatePost={handleCreatePostClick} />
        {drawersAndToast}
      </div>
    );
  }

  return (
    <FeedContainer data-testid="project-posts-feed">
      {feedError && (
        <PageMessage
          type="error"
          title={feedError}
          data-testid="project-posts-feed-error"
        />
      )}
      <FeedToolbar>
        <Button
          priority="secondary"
          purpose="standard"
          onClick={handleNewPostClick}
          disabled={!customerId}
          data-testid="project-posts-new-post-btn"
        >
          {text('timeProject.posts.newPost')}
        </Button>
      </FeedToolbar>

      <PostsList>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            qbTimezone={qbTimezone}
            onClick={handleOpenThread}
            onRepliesClick={handleSeeRepliesClick}
            showActions
            isAuthor={post.author.id === currentWorkerId}
            onEdit={() => handleEditPost(post)}
            canDelete={post.replyCount === 0}
            onDelete={() => handleDeletePost(post)}
          />
        ))}
      </PostsList>

      {totalPages > 1 && (
        <PaginationFooter data-testid="project-posts-pagination">
          <Pagination
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={DEFAULT_PAGE_SIZE}
            activePage={page}
            preventPageJump
            labels={{
              summaryItems: text('timeProject.posts.paginationItems'),
            }}
            onPageChange={handlePageChange}
          />
        </PaginationFooter>
      )}
      {drawersAndToast}
    </FeedContainer>
  );
};

export default PostsFeed;
