import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Post } from '../types/posts';

export interface PostsUiSliceState {
  /** Whether the post composer drawer is open (create or edit). */
  composerOpen: boolean;
  /**
   * The post whose thread (replies) drawer is open, or null when closed.
   * We keep the whole Post so the thread drawer can render the parent card
   * without an extra single-post fetch.
   */
  openThreadPost: Post | null;
  /**
   * The post currently being edited in the composer drawer, or null when
   * the composer is in create mode. Follows the estimateDrawerSlice
   * pattern (`drawerProject` + `isEdit`).
   */
  editingPost: Post | null;
  /** The post targeted for deletion (drives the confirmation modal). */
  deleteTargetPost: Post | null;
  /** Error shown inside the delete confirmation modal (e.g. has-replies). */
  deleteModalError: string | null;
  /** Page-level error banner shown on the feed (e.g. delete failed). */
  feedError: string | null;
  /**
   * The reply currently being edited in the thread drawer composer, or
   * null when the composer is in "new reply" mode.
   */
  editingReply: Post | null;
  /** Unread posts badge count on the Posts tab. */
  unreadCount: number;
}

const initialState: PostsUiSliceState = {
  composerOpen: false,
  openThreadPost: null,
  editingPost: null,
  deleteTargetPost: null,
  deleteModalError: null,
  feedError: null,
  editingReply: null,
  unreadCount: 0,
};

const postsUiSlice = createSlice({
  name: 'postsUi',
  initialState,
  reducers: {
    openComposer(state) {
      state.composerOpen = true;
      state.editingPost = null;
    },
    closeComposer(state) {
      state.composerOpen = false;
      state.editingPost = null;
    },
    openEditComposer(state, action: PayloadAction<Post>) {
      state.editingPost = action.payload;
      state.composerOpen = true;
      state.openThreadPost = null;
    },
    openThread(state, action: PayloadAction<Post>) {
      state.openThreadPost = action.payload;
      state.editingReply = null;
    },
    closeThread(state) {
      state.openThreadPost = null;
      state.editingReply = null;
    },
    openEditReply(state, action: PayloadAction<Post>) {
      state.editingReply = action.payload;
    },
    cancelEditReply(state) {
      state.editingReply = null;
    },
    openDeleteConfirm(state, action: PayloadAction<Post>) {
      state.deleteTargetPost = action.payload;
      state.deleteModalError = null;
    },
    closeDeleteConfirm(state) {
      state.deleteTargetPost = null;
      state.deleteModalError = null;
    },
    setDeleteModalError(state, action: PayloadAction<string>) {
      state.deleteModalError = action.payload;
    },
    setFeedError(state, action: PayloadAction<string | null>) {
      state.feedError = action.payload;
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
  },
});

export const {
  openComposer,
  closeComposer,
  openEditComposer,
  openThread,
  closeThread,
  openDeleteConfirm,
  closeDeleteConfirm,
  setDeleteModalError,
  setFeedError,
  openEditReply,
  cancelEditReply,
  setUnreadCount,
} = postsUiSlice.actions;

export default postsUiSlice.reducer;
