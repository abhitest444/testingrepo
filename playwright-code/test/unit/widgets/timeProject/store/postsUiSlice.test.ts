import reducer, {
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
  PostsUiSliceState,
} from 'src/js/widgets/timeProject/store/postsUiSlice';
import { Post } from 'src/js/widgets/timeProject/types/posts';

const samplePost = {
  id: 'p-1',
  author: { id: '6' },
  content: 'hi',
  replyCount: 0,
  unreadReplyCount: 0,
  attachments: [],
  mentions: [],
  createdAt: '',
  updatedAt: '',
} as Post;

describe('postsUiSlice', () => {
  const initial: PostsUiSliceState = {
    composerOpen: false,
    openThreadPost: null,
    editingPost: null,
    deleteTargetPost: null,
    deleteModalError: null,
    feedError: null,
    editingReply: null,
    unreadCount: 0,
  };

  it('returns the initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initial);
  });

  it('opens the composer and clears editingPost', () => {
    expect(reducer(initial, openComposer())).toEqual({
      ...initial,
      composerOpen: true,
    });
  });

  it('closes the composer and clears editingPost', () => {
    expect(
      reducer(
        { ...initial, composerOpen: true, editingPost: samplePost },
        closeComposer(),
      ),
    ).toEqual(initial);
  });

  it('opens the edit composer with the given post', () => {
    expect(reducer(initial, openEditComposer(samplePost))).toEqual({
      ...initial,
      composerOpen: true,
      editingPost: samplePost,
    });
  });

  it('openEditComposer closes any open thread', () => {
    const state: PostsUiSliceState = {
      ...initial,
      openThreadPost: samplePost,
    };
    expect(reducer(state, openEditComposer(samplePost))).toEqual({
      ...initial,
      composerOpen: true,
      editingPost: samplePost,
    });
  });

  it('opens a thread with the given post and clears editingReply', () => {
    const state: PostsUiSliceState = {
      ...initial,
      editingReply: samplePost,
    };
    expect(reducer(state, openThread(samplePost))).toEqual({
      ...initial,
      openThreadPost: samplePost,
    });
  });

  it('closes the thread and clears editingReply', () => {
    expect(
      reducer(
        {
          ...initial,
          openThreadPost: samplePost,
          editingReply: samplePost,
        },
        closeThread(),
      ),
    ).toEqual(initial);
  });

  it('opens delete confirm with the target post and clears prior modal error', () => {
    const state: PostsUiSliceState = {
      ...initial,
      deleteModalError: 'stale error',
    };
    const result = reducer(state, openDeleteConfirm(samplePost));
    expect(result.deleteTargetPost).toEqual(samplePost);
    expect(result.deleteModalError).toBeNull();
  });

  it('closes delete confirm and clears modal error', () => {
    const state: PostsUiSliceState = {
      ...initial,
      deleteTargetPost: samplePost,
      deleteModalError: 'some error',
    };
    const result = reducer(state, closeDeleteConfirm());
    expect(result.deleteTargetPost).toBeNull();
    expect(result.deleteModalError).toBeNull();
  });

  it('sets delete modal error', () => {
    const result = reducer(initial, setDeleteModalError('has replies'));
    expect(result.deleteModalError).toBe('has replies');
  });

  it('sets feed error', () => {
    const result = reducer(initial, setFeedError('delete failed'));
    expect(result.feedError).toBe('delete failed');
  });

  it('clears feed error when set to null', () => {
    const state: PostsUiSliceState = {
      ...initial,
      feedError: 'old error',
    };
    const result = reducer(state, setFeedError(null));
    expect(result.feedError).toBeNull();
  });

  it('opens and cancels reply edit', () => {
    expect(reducer(initial, openEditReply(samplePost))).toEqual({
      ...initial,
      editingReply: samplePost,
    });
    expect(
      reducer({ ...initial, editingReply: samplePost }, cancelEditReply()),
    ).toEqual(initial);
  });

  it('opens delete confirm with the target post and clears prior modal error', () => {
    const state: PostsUiSliceState = {
      ...initial,
      deleteModalError: 'stale error',
    };
    const result = reducer(state, openDeleteConfirm(samplePost));
    expect(result.deleteTargetPost).toEqual(samplePost);
    expect(result.deleteModalError).toBeNull();
  });

  it('closes delete confirm and clears modal error', () => {
    const state: PostsUiSliceState = {
      ...initial,
      deleteTargetPost: samplePost,
      deleteModalError: 'some error',
    };
    const result = reducer(state, closeDeleteConfirm());
    expect(result.deleteTargetPost).toBeNull();
    expect(result.deleteModalError).toBeNull();
  });

  it('sets delete modal error', () => {
    const result = reducer(initial, setDeleteModalError('has replies'));
    expect(result.deleteModalError).toBe('has replies');
  });

  it('sets feed error', () => {
    const result = reducer(initial, setFeedError('delete failed'));
    expect(result.feedError).toBe('delete failed');
  });

  it('clears feed error when set to null', () => {
    const state: PostsUiSliceState = {
      ...initial,
      feedError: 'old error',
    };
    const result = reducer(state, setFeedError(null));
    expect(result.feedError).toBeNull();
  });

  it('sets unread count', () => {
    const result = reducer(initial, setUnreadCount(5));
    expect(result.unreadCount).toBe(5);
  });

  it('resets unread count to zero', () => {
    const state: PostsUiSliceState = { ...initial, unreadCount: 3 };
    const result = reducer(state, setUnreadCount(0));
    expect(result.unreadCount).toBe(0);
  });
});
