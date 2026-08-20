import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Drawer,
  DrawerHeader,
  DrawerContent,
  DrawerFooter,
} from '@ids-ts/drawer';
import Button from '@ids-ts/button';
import PageMessage from '@ids-ts/page-message';
import { Activity } from '@ids-ts/loader';
import { B3 } from '@ids-ts/typography';
import { useIntl, useTracking } from '@payroll/quicksand';
import { POST_CONTENT_MAX_LENGTH } from '../../constants';
import { usePostReplies } from '../../hooks/usePostReplies';
import { useManagePost } from '../../hooks/useManagePost';
import { usePostsTrackingPoints } from '../../hooks/usePostsTrackingPoints';
import { useAppDispatch, useAppSelector } from '../../store';
import { openEditReply } from '../../store/postsUiSlice';
import { Post } from '../../types/posts';
import PostCard from './PostCard';
import MentionEditor, { MentionEditorHandle } from './mentions/MentionEditor';
import {
  ContentWrapper,
  ThreadBody,
  ReplyComposer,
  ReplyCharCount,
  ErrorContainer,
  FooterActions,
  LoadingOverlay,
} from './PostThreadDrawer.styled';
import { LoaderContainer } from './PostsFeed.styled';

interface PostThreadDrawerProps {
  post: Post;
  projectId: string;
  customerId?: string;
  /** Resolved logged-in worker id (required by the replies query/mutation). */
  workerId: string;
  /** Worker type for the reply mutation. */
  workerType: string;
  /** Company QB timezone string (from the settings slice). */
  qbTimezone?: string;
  /** Whether the current user is an admin (admins can delete any post). */
  isAdmin?: boolean;
  onClose: () => void;
  /** Fired after a successful new reply so the parent can refetch the feed. */
  onReplied: () => void;
  /** Fired after a successful reply edit (thread stays open). */
  onReplyEdited: () => void;
  /** Opens the shared delete-confirmation modal for a reply. */
  onDeleteReply: (reply: Post) => void;
  /** Registers a refetch function the parent can call after reply delete. */
  onRegisterRefetchReplies: (fn: (() => void) | null) => void;
}

const PostThreadDrawer: React.FC<PostThreadDrawerProps> = ({
  post,
  projectId,
  customerId,
  workerId,
  workerType,
  qbTimezone,
  onClose,
  onReplied,
  onReplyEdited,
  onDeleteReply,
  onRegisterRefetchReplies,
}) => {
  const intl = useIntl();
  const text = useCallback(
    (id: string, values?: Record<string, string | number | boolean>) =>
      intl.formatMessage({ id }, values),
    [intl],
  );
  const track = useTracking();
  const trackingPoints = usePostsTrackingPoints();
  const dispatch = useAppDispatch();
  const editingReply = useAppSelector((state) => state.postsUi.editingReply);

  const repliesFilter =
    workerId && post.id
      ? { projectId, customerId, workerId, parentPostId: post.id }
      : undefined;

  const {
    replies,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasNextPage,
    refetch,
    loadMore,
  } = usePostReplies(repliesFilter);
  const { saving, createPost } = useManagePost();

  // `content` holds the editor's display text ("@Name", not tokens) for char
  // count / submit-enable; the save form is read from the editor ref.
  const [content, setContent] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const editorRef = useRef<MentionEditorHandle>(null);

  useEffect(() => {
    onRegisterRefetchReplies(refetch);
    return () => onRegisterRefetchReplies(null);
  }, [onRegisterRefetchReplies, refetch]);

  useEffect(() => {
    if (!editingReply) {
      setShowError(false);
      setErrorMessage('');
    }
  }, [editingReply]);

  const overLimit = content.length > POST_CONTENT_MAX_LENGTH;
  const isEmpty = content.trim().length === 0;
  const canSubmit = !isEmpty && !overLimit && !saving;

  const charCountLabel = useMemo(
    () =>
      text('timeProject.posts.composer.charCount', { count: content.length }),
    [text, content.length],
  );

  // The editor emits its display text on every edit; mirror it into `content`
  // for char count / submit-enable, and clear any inline error on resume.
  const handleEditorChange = useCallback(
    (displayText: string) => {
      setContent(displayText);
      if (showError) setShowError(false);
    },
    [showError],
  );

  const handleEditReply = useCallback(
    (reply: Post) => {
      track(trackingPoints.EDIT_POST);
      dispatch(openEditReply(reply));
    },
    [dispatch, track, trackingPoints],
  );

  const handleReplyEditSaved = useCallback(() => {
    refetch();
    onReplyEdited();
  }, [refetch, onReplyEdited]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    track(trackingPoints.POST_REPLY_BUTTON);
    setShowError(false);
    setErrorMessage('');

    const result = await createPost({
      projectId,
      customerId: customerId ?? '',
      parentPostId: post.id,
      // Read the save form ("@Name" → "<TYPE_ID>" tokens) from the editor.
      content: editorRef.current?.getSaveContent() ?? content,
      workerId,
      workerType,
    });

    if (result.success) {
      editorRef.current?.clear();
      setContent('');
      onReplied();
      onClose();
      return;
    }
    setErrorMessage(
      result.errorMessage || text('timeProject.posts.thread.replyError'),
    );
    setShowError(true);
  }, [
    canSubmit,
    createPost,
    projectId,
    customerId,
    content,
    workerId,
    workerType,
    post.id,
    onReplied,
    onClose,
    text,
    track,
    trackingPoints,
  ]);

  const submitLabel = text('timeProject.posts.thread.postReply');
  const placeholder = text('timeProject.posts.thread.replyPlaceholder');

  // Thread body — the parent post and its replies render in ONE card
  // (`PostCard` with `replies`). The replies region infinite-scrolls via
  // `loadMore`. While replies load (and none yet) show a loader; on load
  // failure show the parent card alone + an inline error.
  let threadContent: React.ReactNode;
  if (loading && replies.length === 0) {
    threadContent = (
      <LoaderContainer>
        <Activity shape="dots" size="large" data-testid="post-thread-loader" />
      </LoaderContainer>
    );
  } else if (error && replies.length === 0) {
    threadContent = (
      <>
        <PostCard post={post} qbTimezone={qbTimezone} replies={[]} />
        <PageMessage
          type="error"
          title={text('timeProject.posts.thread.loadError')}
          data-testid="post-thread-replies-error"
        />
      </>
    );
  } else {
    threadContent = (
      <>
        <PostCard
          post={post}
          qbTimezone={qbTimezone}
          replies={replies}
          onRepliesScrollEnd={hasNextPage ? loadMore : undefined}
          repliesLoadingMore={loadingMore}
          currentWorkerId={workerId}
          onReplyEdit={handleEditReply}
          onReplyDelete={onDeleteReply}
          editingReplyId={editingReply?.id}
          editContext={{ projectId, customerId, workerId, workerType }}
          onReplyEditSaved={handleReplyEditSaved}
        />
        {loadMoreError && (
          <PageMessage
            type="error"
            title={text('timeProject.posts.thread.loadMoreError')}
            data-testid="post-replies-load-more-error"
          />
        )}
      </>
    );
  }

  return (
    <Drawer
      open
      onClose={onClose}
      size="medium"
      autoFocus={false}
      restoreFocus
      data-testid="post-thread-drawer"
    >
      <DrawerHeader
        title={text('timeProject.posts.thread.title')}
        onClose={onClose}
      />
      <DrawerContent>
        <ContentWrapper>
          {saving && (
            <LoadingOverlay data-testid="post-thread-overlay">
              <Activity shape="dots" size="large" />
            </LoadingOverlay>
          )}
          {showError && (
            <ErrorContainer>
              <PageMessage
                type="error"
                title={errorMessage}
                data-testid="post-thread-error"
              />
            </ErrorContainer>
          )}
          <ThreadBody>
            {threadContent}
            <ReplyComposer>
              <MentionEditor
                ref={editorRef}
                onChange={handleEditorChange}
                placeholder={placeholder}
                width="100%"
                maxLength={POST_CONTENT_MAX_LENGTH}
                errorText={
                  overLimit
                    ? text('timeProject.posts.composer.charError')
                    : undefined
                }
                disabled={saving || !!editingReply}
                projectId={projectId}
                customerId={customerId}
                data-testid="post-thread-reply-textarea"
              />
              <ReplyCharCount
                $error={overLimit}
                data-testid="post-thread-char-count"
              >
                <B3>{charCountLabel}</B3>
              </ReplyCharCount>
            </ReplyComposer>
          </ThreadBody>
        </ContentWrapper>
      </DrawerContent>
      <DrawerFooter>
        <FooterActions>
          <Button
            priority="primary"
            purpose="standard"
            disabled={!canSubmit || !!editingReply}
            isLoading={saving}
            onClick={handleSubmit}
            data-testid="post-thread-reply-btn"
          >
            {submitLabel}
          </Button>
        </FooterActions>
      </DrawerFooter>
    </Drawer>
  );
};

export default PostThreadDrawer;
