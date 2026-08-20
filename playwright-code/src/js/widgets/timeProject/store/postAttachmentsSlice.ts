import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PostAttachment } from '../types/posts';

/**
 * Tracks attachment changes made in the post composer for the current
 * session. Uploaded files are saved here on upload success so the composer
 * can build the `timeTrackingCreateAttachments` payload at save time; ids of
 * removed pre-existing (edit-mode) attachments are tracked for
 * `timeTrackingDeleteAttachments`.
 */
export interface PostAttachmentsSliceState {
  /** Newly uploaded attachments in the current composer session. */
  uploaded: PostAttachment[];
  /** Ids of pre-existing attachments removed in the current session. */
  removedIds: string[];
  /**
   * documentIds of freshly-uploaded (unsaved) attachments the user has
   * deleted this session. The upload widget can re-emit
   * EVENT_UPLOADS_FINISHED for a document already reported once (e.g. when
   * a later batch is uploaded in the same session), so this set is checked
   * permanently — not just against the current attachment list — to stop a
   * deleted document from silently reappearing and being linked on save.
   */
  excludedDocumentIds: string[];
}

const initialState: PostAttachmentsSliceState = {
  uploaded: [],
  removedIds: [],
  excludedDocumentIds: [],
};

const postAttachmentsSlice = createSlice({
  name: 'postAttachments',
  initialState,
  reducers: {
    setSessionAttachments(
      state,
      action: PayloadAction<{
        uploaded: PostAttachment[];
        removedIds: string[];
      }>,
    ) {
      state.uploaded = action.payload.uploaded;
      state.removedIds = action.payload.removedIds;
    },
    addExcludedDocumentIds(state, action: PayloadAction<string[]>) {
      const merged = new Set([...state.excludedDocumentIds, ...action.payload]);
      state.excludedDocumentIds = Array.from(merged);
    },
    resetPostAttachments() {
      return initialState;
    },
  },
});

export const {
  setSessionAttachments,
  addExcludedDocumentIds,
  resetPostAttachments,
} = postAttachmentsSlice.actions;

export const selectUploadedAttachments = (state: {
  postAttachments: PostAttachmentsSliceState;
}): PostAttachment[] => state.postAttachments.uploaded;

export const selectRemovedAttachmentIds = (state: {
  postAttachments: PostAttachmentsSliceState;
}): string[] => state.postAttachments.removedIds;

export const selectExcludedDocumentIds = (state: {
  postAttachments: PostAttachmentsSliceState;
}): string[] => state.postAttachments.excludedDocumentIds;

export default postAttachmentsSlice.reducer;
