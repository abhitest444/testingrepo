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
import { ConfirmationModal } from '../../../common/ConfirmationModal';
import { useCurrentWorker } from '../../hooks/useCurrentWorker';
import { useManagePost } from '../../hooks/useManagePost';
import { useManageAttachments } from '../../hooks/useManageAttachments';
import { usePostsTrackingPoints } from '../../hooks/usePostsTrackingPoints';
import { Post, PostAttachment } from '../../types/posts';
import { POST_CONTENT_MAX_LENGTH } from '../../constants';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setSessionAttachments,
  addExcludedDocumentIds,
  resetPostAttachments,
  selectUploadedAttachments,
  selectRemovedAttachmentIds,
  selectExcludedDocumentIds,
} from '../../store/postAttachmentsSlice';
import { openDeleteConfirm } from '../../store/postsUiSlice';
import PostAttachmentUploader from './PostAttachmentUploader';
import MentionEditor, { MentionEditorHandle } from './mentions/MentionEditor';
import { hydrateMentions } from './mentions/mentionUtils';
import {
  ContentWrapper,
  ComposerSubtitle,
  ComposerBody,
  CharCount,
  ErrorContainer,
  FooterActions,
  LoadingOverlay,
} from './PostComposerDrawer.styled';

interface PostComposerDrawerProps {
  projectId: string;
  customerId?: string;
  /** Shell-provided worker id seed; the composer resolves id + type itself. */
  workerId?: string | null;
  onClose: () => void;
  /** Fired after a successful create/update so the parent can refetch the feed. */
  onPosted: () => void;
  /** When present, the drawer opens in edit mode with the post's content pre-filled. */
  postToEdit?: Post | null;
}

const PostComposerDrawer: React.FC<PostComposerDrawerProps> = ({
  projectId,
  customerId,
  workerId,
  onClose,
  onPosted,
  postToEdit,
}) => {
  const intl = useIntl();
  const text = useCallback(
    (id: string, values?: Record<string, any>) =>
      intl.formatMessage({ id }, values),
    [intl],
  );

  const isEditMode = !!postToEdit;

  const track = useTracking();
  const trackingPoints = usePostsTrackingPoints();

  const {
    workerId: currentWorkerId,
    workerType,
    ready: workerReady,
  } = useCurrentWorker(workerId);
  const { saving, createPost, updatePost } = useManagePost();
  const {
    saving: attachmentsSaving,
    createAttachments,
    deleteAttachments,
  } = useManageAttachments();

  const dispatch = useAppDispatch();
  const uploaded = useAppSelector(selectUploadedAttachments);
  const removedIds = useAppSelector(selectRemovedAttachmentIds);
  const excludedDocumentIds = useAppSelector(selectExcludedDocumentIds);

  // `content` holds the human-readable display text ("@Name", not tokens),
  // driven by the editor's onChange. Used for char count + dirty detection;
  // the save form (with "<TYPE_ID>" tokens) is read from the editor on submit.
  const [content, setContent] = useState('');
  const [showError, setShowError] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const editorRef = useRef<MentionEditorHandle>(null);

  const busy = saving || attachmentsSaving;

  // Pre-existing attachments (edit mode). The displayed list is these (minus
  // any removed this session) plus the newly uploaded ones from Redux.
  const original = useMemo(() => postToEdit?.attachments ?? [], [postToEdit]);

  // Edit-mode display text (saved tokens resolved to "@Name"), used as the
  // dirty-detection baseline so opening a post for edit isn't seen as changed.
  const initialContent = useMemo(
    () =>
      postToEdit
        ? hydrateMentions(postToEdit.content, postToEdit.mentions).text
        : '',
    [postToEdit],
  );

  // Reset the per-session attachment tracking whenever the composer target
  // changes (open create vs. open a specific post for edit). The editor seeds
  // its own content from initialContent/initialMentions props.
  useEffect(() => {
    dispatch(resetPostAttachments());
    setContent(initialContent);
  }, [postToEdit, dispatch, initialContent]);

  const displayAttachments = useMemo(() => {
    const removed = new Set(removedIds);
    const kept = original.filter((a) => !removed.has(a.id));
    const keptIds = new Set(kept.map((a) => a.id));
    return [...kept, ...uploaded.filter((a) => !keptIds.has(a.id))];
  }, [original, uploaded, removedIds]);

  // Uploader is controlled by `displayAttachments`; translate its changes into
  // the session's uploaded / removed sets. New uploads are linked at save time.
  // Deletions, however, are persisted immediately (see below) because the
  // list-documents widget already removed the file from the document service,
  // so we must keep the post in sync even if the user closes without saving.
  const handleAttachmentsChange = useCallback(
    (next: PostAttachment[]) => {
      const originalIds = new Set(original.map((a) => a.id));
      const nextIds = new Set(next.map((a) => a.id));
      const newUploaded = next.filter((a) => !originalIds.has(a.id));
      const newRemovedIds = original
        .filter((a) => !nextIds.has(a.id))
        .map((a) => a.id);

      // Freshly-uploaded (unsaved) attachments the user just removed. Track
      // their documentIds permanently for this session — not just by
      // dropping them from `uploaded` — so a delayed/re-emitted upload
      // event for the same document can't silently re-add it before save.
      const newlyExcluded = uploaded
        .filter((a) => !nextIds.has(a.id))
        .map((a) => a.documentId || a.id)
        .filter((id): id is string => !!id);
      if (newlyExcluded.length > 0) {
        dispatch(addExcludedDocumentIds(newlyExcluded));
      }

      // Existing (saved) attachments that were just removed this interaction.
      // Fire the delete-attachments mutation right away so the post doesn't
      // keep a dangling reference to a document that no longer exists.
      const justRemoved = newRemovedIds.filter(
        (id) => !removedIds.includes(id),
      );
      if (isEditMode && postToEdit && justRemoved.length > 0) {
        deleteAttachments({
          postId: postToEdit.id,
          attachmentIds: justRemoved,
        });
      }

      dispatch(
        setSessionAttachments({
          uploaded: newUploaded,
          removedIds: newRemovedIds,
        }),
      );
    },
    [
      original,
      uploaded,
      dispatch,
      removedIds,
      isEditMode,
      postToEdit,
      deleteAttachments,
    ],
  );

  const overLimit = content.length > POST_CONTENT_MAX_LENGTH;
  // A post is postable with text OR at least one attachment — an
  // attachment-only post (no body) is allowed. `displayAttachments` is the
  // list currently shown (kept pre-existing minus removed, plus new uploads).
  // Strip zero-width spaces (U+200B) that browsers insert in empty
  // contenteditable elements — they're invisible but survive trim().
  const normalizedContent = content.replace(/\u200B/g, '');
  const hasText = normalizedContent.trim().length > 0;
  const hasAttachment = displayAttachments.length > 0;
  const isEmpty = !hasText && !hasAttachment;
  // Compare against the hydrated ("@Name") draft, not the saved "<TYPE_ID>"
  // tokens, so simply opening a post with mentions for edit isn't seen as dirty.
  const contentChanged =
    normalizedContent.trim() !== initialContent.replace(/\u200B/g, '').trim();
  // Attachments are considered "changed" when new ones were uploaded OR existing
  // ones were removed. Removals are persisted immediately, but we still count
  // them as dirty so the Save button remains enabled (it closes the drawer).
  const attachmentsChanged = uploaded.length > 0 || removedIds.length > 0;
  const hasChanged = isEditMode ? contentChanged || attachmentsChanged : true;
  // In edit mode, if all content and attachments are gone the save action will
  // delete the post — allow the button to remain enabled for that case.
  const shouldDeletePost = isEditMode && isEmpty && !busy;
  const canPost =
    (!isEmpty && !overLimit && !busy && hasChanged) || shouldDeletePost;

  // The editor emits its display text ("@Name") on every edit; mirror it into
  // `content` for char count / dirty, and clear any inline error on resume.
  const handleEditorChange = useCallback(
    (displayText: string) => {
      setContent(displayText);
      if (showError) setShowError(false);
    },
    [showError],
  );

  // Unsaved progress = text changed or a new attachment was added. Deletions
  // are already persisted, so they aren't "unsaved progress".
  const isDirty = contentChanged || uploaded.length > 0;

  // Close without confirmation, clearing the session attachment state.
  const closeAndReset = useCallback(() => {
    dispatch(resetPostAttachments());
    onClose();
  }, [dispatch, onClose]);

  // Intercept the drawer close: confirm first when there are unsaved changes.
  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    closeAndReset();
  }, [isDirty, closeAndReset]);

  // "Continue" (leave): discard the unsaved changes and close. (Cleanup of
  // orphaned uploaded docs is intentionally not done for now.)
  const handleConfirmLeave = useCallback(() => {
    setShowLeaveConfirm(false);
    closeAndReset();
  }, [closeAndReset]);

  const charCountLabel = useMemo(
    () =>
      text('timeProject.posts.composer.charCount', { count: content.length }),
    [text, content.length],
  );

  const handlePost = useCallback(async () => {
    if (!currentWorkerId || !customerId || !workerType) return;
    if (!canPost) return;
    setShowError(false);

    // Read the save form (display "@Name" → "<TYPE_ID>" tokens) from the editor.
    const contentToSave = editorRef.current?.getSaveContent() ?? content;

    // Newly uploaded attachments → create-attachments payload.
    const newAttachmentInputs = uploaded
      .filter((a) => a.documentId)
      .map((a) => ({
        documentId: a.documentId as string,
        name: a.fileName || (a.documentId as string),
        ...(a.orientationDegree != null
          ? { orientationDegree: a.orientationDegree }
          : {}),
      }));

    if (isEditMode && postToEdit) {
      const postId = postToEdit.id;

      // If all attachments are removed and content is empty, show the delete
      // confirmation modal instead of saving an empty post.
      if (shouldDeletePost) {
        dispatch(resetPostAttachments());
        dispatch(openDeleteConfirm(postToEdit));
        onClose();
        return;
      }

      // 1) Post body — only when the text actually changed.
      if (contentChanged) {
        const result = await updatePost({
          postId,
          projectId,
          customerId,
          content: contentToSave,
          workerId: currentWorkerId,
          workerType,
        });
        if (!result.success) {
          setShowError(true);
          return;
        }
      }

      // 2) Attachment creations. Deletions are intentionally NOT handled here —
      // they're persisted immediately when the file is removed, so we don't
      // re-call the delete mutation on save.
      if (newAttachmentInputs.length > 0) {
        const created = await createAttachments({
          postId,
          attachments: newAttachmentInputs,
        });
        if (!created.success) {
          setShowError(true);
          return;
        }
      }

      onPosted();
      onClose();
      return;
    }

    // Create: post first, then link any uploaded attachments to the new post.
    track(trackingPoints.CLICK_POST);
    const result = await createPost({
      projectId,
      customerId,
      content: contentToSave,
      workerId: currentWorkerId,
      workerType,
    });

    if (!result.success) {
      setShowError(true);
      return;
    }

    // Link uploaded attachments to the freshly created post. Requires the
    // returned post id; without it we can't associate the documents.
    if (newAttachmentInputs.length > 0) {
      if (!result.postId) {
        setShowError(true);
        return;
      }
      const created = await createAttachments({
        postId: result.postId,
        attachments: newAttachmentInputs,
      });
      if (!created.success) {
        setShowError(true);
        return;
      }
    }

    onPosted();
    onClose();
  }, [
    canPost,
    currentWorkerId,
    isEditMode,
    postToEdit,
    contentChanged,
    createPost,
    updatePost,
    createAttachments,
    projectId,
    customerId,
    content,
    workerType,
    uploaded,
    onPosted,
    onClose,
    track,
    trackingPoints,
    shouldDeletePost,
    dispatch,
  ]);

  const drawerTitle = isEditMode
    ? text('timeProject.posts.composer.editTitle')
    : text('timeProject.posts.composer.title');

  const submitLabel = isEditMode
    ? text('timeProject.posts.composer.editSave')
    : text('timeProject.posts.composer.post');

  return (
    <Drawer
      open
      onClose={handleRequestClose}
      size="medium"
      autoFocus={false}
      restoreFocus
      data-testid="post-composer-drawer"
    >
      <DrawerHeader title={drawerTitle} onClose={handleRequestClose} />
      <DrawerContent>
        <ContentWrapper>
          {busy && (
            <LoadingOverlay data-testid="post-composer-overlay">
              <Activity shape="dots" size="large" />
            </LoadingOverlay>
          )}
          <ComposerSubtitle data-testid="post-composer-subtitle">
            <B3>{text('timeProject.posts.composer.subtitle')}</B3>
          </ComposerSubtitle>
          {showError && (
            <ErrorContainer>
              <PageMessage
                type="error"
                title={text('timeProject.posts.composer.error')}
                data-testid="post-composer-error"
              />
            </ErrorContainer>
          )}
          <ComposerBody>
            <MentionEditor
              ref={editorRef}
              initialContent={postToEdit?.content}
              initialMentions={postToEdit?.mentions}
              onChange={handleEditorChange}
              placeholder={text('timeProject.posts.composer.placeholder')}
              width="100%"
              maxLength={POST_CONTENT_MAX_LENGTH}
              errorText={
                overLimit
                  ? text('timeProject.posts.composer.charError')
                  : undefined
              }
              disabled={busy}
              projectId={projectId}
              customerId={customerId}
              data-testid="post-composer-textarea"
            />
            <CharCount
              $error={overLimit}
              data-testid="post-composer-char-count"
            >
              <B3>{charCountLabel}</B3>
            </CharCount>
            {/* Always rendered so the button is visible immediately;
                disabled until the worker resolves to prevent premature uploads. */}
            <PostAttachmentUploader
              attachments={displayAttachments}
              onChange={handleAttachmentsChange}
              excludedDocumentIds={excludedDocumentIds}
              projectId={projectId}
              workerId={currentWorkerId ?? ''}
              workerType={workerType ?? ''}
              disabled={busy || !workerReady}
            />
          </ComposerBody>
        </ContentWrapper>
      </DrawerContent>
      <DrawerFooter>
        <FooterActions>
          <Button
            priority="primary"
            purpose="standard"
            disabled={!canPost}
            isLoading={busy}
            onClick={handlePost}
            data-testid="post-composer-post-btn"
          >
            {submitLabel}
          </Button>
        </FooterActions>
      </DrawerFooter>
      <ConfirmationModal
        open={showLeaveConfirm}
        setOpen={setShowLeaveConfirm}
        title={text('timeProject.posts.composer.leaveTitle')}
        yesButtonLabel={text('timeProject.posts.composer.leaveContinue')}
        noButtonLabel={text('timeProject.posts.composer.leaveCancel')}
        onYesClick={handleConfirmLeave}
        dismissible
      >
        <B3>{text('timeProject.posts.composer.leaveBody')}</B3>
      </ConfirmationModal>
    </Drawer>
  );
};

export default PostComposerDrawer;
