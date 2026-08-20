import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Card, CardContent } from '@ids-ts/cards';
import Button from '@ids-ts/button';
import { B3 } from '@ids-ts/typography';
import { Activity } from '@ids-ts/loader';
import { useIntl } from '@payroll/quicksand';
import { useAppDispatch } from '../../store';
import { cancelEditReply } from '../../store/postsUiSlice';
import { useManagePost } from '../../hooks/useManagePost';
import { POST_CONTENT_MAX_LENGTH } from '../../constants';
import { Post } from '../../types/posts';
import PostContentBlock from './PostContentBlock';
import PostAttachmentsThumbnails, {
  postHasAttachments,
} from './PostAttachmentsThumbnails';
import MentionEditor, { MentionEditorHandle } from './mentions/MentionEditor';
import { hydrateMentions } from './mentions/mentionUtils';
import {
  CardWrapper,
  PostDivider,
  PostRepliesLink,
  ReplyRow,
  RepliesScroll,
  RepliesLoadingMore,
} from './PostsFeed.styled';
import {
  ReplyComposer,
  ReplyCharCount,
  FooterActions,
} from './PostThreadDrawer.styled';

// Infinite scroll fires when the user scrolls within this many px of the
// bottom of the replies region.
const SCROLL_THRESHOLD_PX = 48;

interface PostCardProps {
  post: Post;
  /** Company QB timezone string (from the settings slice). */
  qbTimezone?: string;
  /** Opens the post thread when the card is clicked (feed only). */
  onClick?: (post: Post) => void;
  /** Opens the post thread when the "N replies" link is clicked (feed only). */
  onRepliesClick?: (post: Post) => void;
  /** Render the full content (no 2-line clamp) — used inside the thread. */
  fullContent?: boolean;
  /**
   * Thread mode: when provided, the replies render inline inside this same
   * card (under a divider) instead of the "N replies" footer link. An empty
   * array still switches to thread mode (parent shown, no footer link).
   */
  replies?: Post[];
  /** Thread mode: fired when the replies list is scrolled near the bottom
   * (infinite scroll). */
  onRepliesScrollEnd?: () => void;
  /** Thread mode: a next page of replies is currently being appended. */
  repliesLoadingMore?: boolean;
  /** Show the action menu (edit / delete). Feed view only. */
  showActions?: boolean;
  /** Whether the current user is the post author. */
  isAuthor?: boolean;
  onEdit?: () => void;
  /** Show delete in the action menu (posts with no replies only). */
  canDelete?: boolean;
  onDelete?: () => void;
  /** Thread mode: logged-in worker id for reply-row author checks. */
  currentWorkerId?: string;
  /** Thread mode: edit a reply row (author only). */
  onReplyEdit?: (reply: Post) => void;
  /** Thread mode: delete a reply row (author only). */
  onReplyDelete?: (reply: Post) => void;
  /** The id of the reply currently being edited inline. */
  editingReplyId?: string;
  /** Context needed by InlineReplyEdit for the update API call. */
  editContext?: {
    projectId: string;
    customerId?: string;
    workerId: string;
    workerType: string;
  };
  /** Fired after a successful inline reply edit (refetch + toast). */
  onReplyEditSaved?: () => void;
}

type IntlValues = Record<string, string | number | boolean>;

const InlineReplyEdit: React.FC<{
  reply: Post;
  qbTimezone?: string;
  text: (id: string, values?: IntlValues) => string;
  editContext: {
    projectId: string;
    customerId?: string;
    workerId: string;
    workerType: string;
  };
  onSaved?: () => void;
}> = ({ reply, qbTimezone, text, editContext, onSaved }) => {
  const dispatch = useAppDispatch();
  const { saving, updatePost } = useManagePost();
  // `content` holds the editor display text ("@Name") for char count / dirty;
  // the save form is read from the editor ref.
  const [content, setContent] = useState('');
  const editorRef = useRef<MentionEditorHandle>(null);

  // The saved tokens resolved to "@Name", used as the dirty-detection baseline
  // so opening a reply for edit isn't seen as changed. The editor seeds itself
  // from reply.content/reply.mentions via its initial* props.
  const initialContent = useMemo(
    () => hydrateMentions(reply.content, reply.mentions).text,
    [reply.content, reply.mentions],
  );

  const overLimit = content.length > POST_CONTENT_MAX_LENGTH;
  const isEmpty = content.trim().length === 0;
  const hasChanged = content !== initialContent;
  const canSave = !isEmpty && !overLimit && !saving && hasChanged;

  const handleCancel = useCallback(() => {
    dispatch(cancelEditReply());
  }, [dispatch]);

  const handleEditorChange = useCallback(
    (displayText: string) => setContent(displayText),
    [],
  );

  const handleSave = useCallback(async () => {
    const { projectId, customerId, workerId, workerType } = editContext;
    const result = await updatePost({
      projectId,
      customerId: customerId ?? '',
      workerId,
      workerType,
      postId: reply.id,
      // Read the save form ("@Name" → "<TYPE_ID>" tokens) from the editor.
      content: editorRef.current?.getSaveContent() ?? content,
    });
    if (result.success) {
      dispatch(cancelEditReply());
      onSaved?.();
    }
  }, [editContext, updatePost, reply.id, content, dispatch, onSaved]);

  return (
    <>
      <PostContentBlock
        post={reply}
        qbTimezone={qbTimezone}
        fullContent
        compact
        hideBody
      />
      <ReplyComposer>
        <MentionEditor
          ref={editorRef}
          initialContent={reply.content}
          initialMentions={reply.mentions}
          onChange={handleEditorChange}
          placeholder={text('timeProject.posts.thread.editPlaceholder')}
          width="100%"
          maxLength={POST_CONTENT_MAX_LENGTH}
          errorText={
            overLimit ? text('timeProject.posts.composer.charError') : ''
          }
          disabled={saving}
          projectId={editContext.projectId}
          customerId={editContext.customerId}
          data-testid={`inline-edit-textarea-${reply.id}`}
        />
        <FooterActions>
          <ReplyCharCount $error={overLimit}>
            <B3>
              {text('timeProject.posts.composer.charCount', {
                count: content.length,
              })}
            </B3>
          </ReplyCharCount>
          <Button
            priority="secondary"
            purpose="standard"
            disabled={saving}
            onClick={handleCancel}
            data-testid={`inline-edit-cancel-${reply.id}`}
          >
            {text('timeProject.posts.thread.cancelEdit')}
          </Button>
          <Button
            priority="primary"
            purpose="standard"
            disabled={!canSave}
            isLoading={saving}
            onClick={handleSave}
            data-testid={`inline-edit-save-${reply.id}`}
          >
            {text('timeProject.posts.composer.editSave')}
          </Button>
        </FooterActions>
      </ReplyComposer>
    </>
  );
};

/**
 * One post card. Two shapes, driven by `replies`:
 *  - Feed mode (no `replies`): clamped preview + clickable "N replies" link.
 *  - Thread mode (`replies` provided): full parent post + each reply rendered
 *    inline in the SAME card (reusing PostContentBlock), no footer link.
 */
const PostCard: React.FC<PostCardProps> = ({
  post,
  qbTimezone,
  onClick,
  onRepliesClick,
  fullContent = false,
  replies,
  onRepliesScrollEnd,
  repliesLoadingMore = false,
  showActions = false,
  isAuthor = false,
  onEdit,
  canDelete = false,
  onDelete,
  currentWorkerId,
  onReplyEdit,
  onReplyDelete,
  editingReplyId,
  editContext,
  onReplyEditSaved,
}) => {
  const intl = useIntl();
  const text = useCallback(
    (id: string, values?: IntlValues) => intl.formatMessage({ id }, values),
    [intl],
  );

  const isThread = replies !== undefined;
  const canLoadMore = !!onRepliesScrollEnd;
  // Always enable scroll in thread mode so the container height stays
  // consistent regardless of pagination state (prevents a height jump when
  // the last page loads and hasNextPage becomes false).
  const scrollReplies = isThread;

  const repliesScrollRef = useRef<HTMLDivElement | null>(null);

  const handleRepliesScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onRepliesScrollEnd) return;
      const el = e.currentTarget;
      if (
        el.scrollHeight - el.scrollTop - el.clientHeight <=
        SCROLL_THRESHOLD_PX
      ) {
        onRepliesScrollEnd();
      }
    },
    [onRepliesScrollEnd],
  );

  // Safety net for the "no overflow" case: if there's a next page but the
  // current replies don't fill (overflow) the fixed-height viewport, the
  // user can't scroll to trigger loadMore — so auto-fetch the next page.
  // Re-runs as replies grow until it overflows or hasNextPage goes false
  // (then `onRepliesScrollEnd` becomes undefined and this no-ops).
  useLayoutEffect(() => {
    if (!onRepliesScrollEnd || repliesLoadingMore) return;
    const el = repliesScrollRef.current;
    if (!el) return;
    // No vertical overflow yet → no scrollbar → fetch more to fill it.
    if (el.scrollHeight <= el.clientHeight) {
      onRepliesScrollEnd();
    }
  }, [onRepliesScrollEnd, repliesLoadingMore, replies]);

  useLayoutEffect(() => {
    if (!editingReplyId) return;
    const el = repliesScrollRef.current;
    if (!el) return;
    const row = el.querySelector(
      `[data-testid="post-reply-${editingReplyId}"]`,
    ) as HTMLElement | null;
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [editingReplyId]);

  const repliesLabel = useMemo(() => {
    if (post.replyCount <= 0) return text('timeProject.posts.noReplies');
    if (post.replyCount === 1) return text('timeProject.posts.oneReply');
    return text('timeProject.posts.replies', { count: post.replyCount });
  }, [post.replyCount, text]);

  return (
    <CardWrapper>
      <Card
        size="none"
        disableCardClick={!onClick}
        onClick={onClick ? () => onClick(post) : undefined}
        automationId={`post-card-${post.id}`}
      >
        <CardContent>
          {/* Parent post — full content in thread mode, clamped in feed mode. */}
          <PostContentBlock
            post={post}
            qbTimezone={qbTimezone}
            fullContent={fullContent || isThread}
            showActions={showActions}
            isAuthor={isAuthor}
            onEdit={onEdit}
            canDelete={canDelete}
            onDelete={onDelete}
          />

          {/* "View N attachment(s)" link — under the post body, above the
              divider — in both feed and thread modes. Renders nothing when the
              post has no attachments. */}
          {postHasAttachments(post) && (
            <PostAttachmentsThumbnails post={post} />
          )}

          {isThread && replies && replies.length > 0 && (
            <>
              {/* Divider between the parent post and its replies. */}
              <PostDivider data-testid="post-thread-divider" />
              <RepliesScroll
                ref={repliesScrollRef}
                $scroll={scrollReplies}
                onScroll={canLoadMore ? handleRepliesScroll : undefined}
                data-testid="post-replies-scroll"
              >
                {replies.map((r) => (
                  <ReplyRow key={r.id} data-testid={`post-reply-${r.id}`}>
                    {editingReplyId === r.id && editContext ? (
                      <InlineReplyEdit
                        reply={r}
                        qbTimezone={qbTimezone}
                        text={text}
                        editContext={editContext}
                        onSaved={onReplyEditSaved}
                      />
                    ) : (
                      <PostContentBlock
                        post={r}
                        qbTimezone={qbTimezone}
                        fullContent
                        compact
                        showActions={!!onReplyEdit || !!onReplyDelete}
                        isAuthor={r.author.id === currentWorkerId}
                        onEdit={onReplyEdit ? () => onReplyEdit(r) : undefined}
                        canDelete={r.replyCount === 0}
                        onDelete={
                          onReplyDelete ? () => onReplyDelete(r) : undefined
                        }
                      />
                    )}
                  </ReplyRow>
                ))}
                {repliesLoadingMore && (
                  <RepliesLoadingMore>
                    <Activity
                      shape="dots"
                      size="small"
                      data-testid="post-replies-loading-more"
                    />
                  </RepliesLoadingMore>
                )}
              </RepliesScroll>
            </>
          )}

          {!isThread && (
            <>
              <PostDivider />
              <PostRepliesLink
                type="button"
                onClick={
                  onRepliesClick
                    ? (e) => {
                        // Don't also trigger the card's onClick.
                        e.stopPropagation();
                        onRepliesClick(post);
                      }
                    : undefined
                }
                $clickable={!!onRepliesClick}
                data-testid={`post-replies-${post.id}`}
              >
                <B3 weight="demi">{repliesLabel}</B3>
              </PostRepliesLink>
            </>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  );
};

export default PostCard;
