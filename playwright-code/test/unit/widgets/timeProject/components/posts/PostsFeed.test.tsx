import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PostsFeed from 'src/js/widgets/timeProject/components/posts/PostsFeed';

const mockFetchFeed = jest.fn();
const mockGoToNextPage = jest.fn();
const mockGoToPrevPage = jest.fn();
const mockDispatch = jest.fn();
const mockDeletePost = jest.fn();
const mockTrack = jest.fn();
let mockDeleteInProgress = false;

let mockFeedState: any;
let mockWorkerState: any;
let mockComposerOpen = false;
let mockOpenThreadPost: any = null;
let mockEditingPost: any = null;
let mockDeleteTargetPost: any = null;
let mockDeleteModalError: string | null = null;
let mockFeedError: string | null = null;
let mockEditingReply: any = null;

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: () => mockTrack,
}));

jest.mock('src/js/widgets/timeProject/hooks/usePostsTrackingPoints', () => {
  const { POSTS_TRACKING_POINTS } = jest.requireActual(
    'src/js/widgets/timeProject/utils/timeProjectTrackingPoints',
  );
  return { usePostsTrackingPoints: () => POSTS_TRACKING_POINTS };
});

jest.mock('src/js/widgets/timeProject/hooks/usePostsFeed', () => ({
  usePostsFeed: () => mockFeedState,
}));

jest.mock('src/js/widgets/timeProject/hooks/useCurrentWorker', () => ({
  useCurrentWorker: (...args: any[]) => mockWorkerState(...args),
}));

jest.mock('src/js/widgets/timeProject/hooks/useDeletePost', () => ({
  useDeletePost: () => ({
    inProgress: mockDeleteInProgress,
    deletePost: mockDeletePost,
  }),
}));

const mockMarkPostsRead = jest.fn().mockResolvedValue({ success: true });
jest.mock('src/js/widgets/timeProject/hooks/useMarkPostsRead', () => ({
  useMarkPostsRead: () => ({
    markPostsRead: mockMarkPostsRead,
  }),
}));

jest.mock('src/js/widgets/timeProject/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) =>
    selector({
      postsUi: {
        composerOpen: mockComposerOpen,
        openThreadPost: mockOpenThreadPost,
        editingPost: mockEditingPost,
        deleteTargetPost: mockDeleteTargetPost,
        deleteModalError: mockDeleteModalError,
        feedError: mockFeedError,
        editingReply: mockEditingReply,
        unreadCount: 0,
      },
    }),
}));

jest.mock('src/js/widgets/timeProject/store/postsUiSlice', () => ({
  openComposer: () => ({ type: 'postsUi/openComposer' }),
  closeComposer: () => ({ type: 'postsUi/closeComposer' }),
  openEditComposer: (post: any) => ({
    type: 'postsUi/openEditComposer',
    payload: post,
  }),
  openThread: (post: any) => ({ type: 'postsUi/openThread', payload: post }),
  closeThread: () => ({ type: 'postsUi/closeThread' }),
  openDeleteConfirm: (post: any) => ({
    type: 'postsUi/openDeleteConfirm',
    payload: post,
  }),
  closeDeleteConfirm: () => ({ type: 'postsUi/closeDeleteConfirm' }),
  setDeleteModalError: (msg: string) => ({
    type: 'postsUi/setDeleteModalError',
    payload: msg,
  }),
  setFeedError: (msg: string | null) => ({
    type: 'postsUi/setFeedError',
    payload: msg,
  }),
  cancelEditReply: () => ({ type: 'postsUi/cancelEditReply' }),
  setUnreadCount: (count: number) => ({
    type: 'postsUi/setUnreadCount',
    payload: count,
  }),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  useHasAdminAccess: () => false,
}));

jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({ open, message }: any) =>
    open ? <div data-testid="success-toast">{message}</div> : null,
}));

jest.mock('src/js/widgets/common/ConfirmationModal', () => ({
  ConfirmationModal: ({
    open,
    onYesClick,
    onNoClick,
    isLoading,
    children,
  }: any) =>
    open ? (
      <div data-testid="delete-post-modal">
        <button
          type="button"
          data-testid="delete-post-confirm"
          onClick={onYesClick}
          disabled={isLoading}
        >
          confirm
        </button>
        <button
          type="button"
          data-testid="delete-post-cancel"
          onClick={onNoClick}
          disabled={isLoading}
        >
          cancel
        </button>
        {children}
      </div>
    ) : null,
}));

jest.mock(
  'src/js/widgets/timeProject/components/posts/PostComposerDrawer',
  () =>
    ({ onClose, onPosted, postToEdit }: any) =>
      (
        <div data-testid="post-composer-drawer">
          {postToEdit && (
            <span data-testid="composer-editing-post-id">{postToEdit.id}</span>
          )}
          <button type="button" data-testid="composer-close" onClick={onClose}>
            close
          </button>
          <button
            type="button"
            data-testid="composer-posted"
            onClick={onPosted}
          >
            posted
          </button>
        </div>
      ),
);

jest.mock(
  'src/js/widgets/timeProject/components/posts/PostThreadDrawer',
  () =>
    ({
      post,
      onClose,
      onReplied,
      onReplyEdited,
      onDeleteReply,
      onRegisterRefetchReplies,
    }: any) => {
      React.useEffect(() => {
        onRegisterRefetchReplies?.(() => {});
      }, [onRegisterRefetchReplies]);
      return (
        <div data-testid="post-thread-drawer">
          <span data-testid="thread-post-id">{post.id}</span>
          <button type="button" data-testid="thread-close" onClick={onClose}>
            close
          </button>
          <button
            type="button"
            data-testid="thread-replied"
            onClick={onReplied}
          >
            replied
          </button>
          <button
            type="button"
            data-testid="thread-reply-edited"
            onClick={onReplyEdited}
          >
            edited
          </button>
          <button
            type="button"
            data-testid="thread-delete-reply"
            onClick={() =>
              onDeleteReply?.({
                id: 'r1',
                parentPostId: post.id,
                author: { id: '6' },
              })
            }
          >
            delete-reply
          </button>
        </div>
      );
    },
);

jest.mock('@ids-ts/loader', () => ({
  Activity: ({ 'data-testid': testId }: any) => (
    <div data-testid={testId}>loading</div>
  ),
}));

jest.mock(
  '@ids-ts/button',
  () =>
    ({ onClick, disabled, isLoading, 'data-testid': testId, children }: any) =>
      (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          data-testid={testId}
          data-loading={String(!!isLoading)}
        >
          {children}
        </button>
      ),
);

jest.mock('@ids-ts/typography', () => ({
  B3: ({ children, 'data-testid': testId }: any) => (
    <span data-testid={testId}>{children}</span>
  ),
}));

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ title, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{title}</div>
  ),
}));

jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  ModalTitle: ({ title }: any) => <div>{title}</div>,
  ModalContent: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  ModalActions: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  ModalImage: ({ image }: any) => <div>{image}</div>,
}));

jest.mock('@ids-ts/badge', () => ({
  __esModule: true,
  default: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
}));

jest.mock('@design-systems/icons', () => ({
  CircleExclamationFill: () => <span>icon</span>,
}));

jest.mock('@ids-ts/pagination', () => ({
  Pagination: ({ activePage, onPageChange }: any) => (
    <div data-testid="pagination">
      <button
        type="button"
        data-testid="pagination-next"
        onClick={() => onPageChange(activePage + 1)}
      >
        next
      </button>
      <button
        type="button"
        data-testid="pagination-prev"
        onClick={() => onPageChange(activePage - 1)}
      >
        prev
      </button>
    </div>
  ),
}));

jest.mock(
  'src/js/widgets/timeProject/components/PostsEmptyState',
  () =>
    ({ onCreatePost }: any) =>
      (
        <button
          type="button"
          data-testid="empty-state-create"
          onClick={onCreatePost}
        >
          empty
        </button>
      ),
);

jest.mock(
  'src/js/widgets/timeProject/components/posts/PostCard',
  () =>
    ({
      post,
      onClick,
      onRepliesClick,
      onEdit,
      onDelete,
      showActions,
      canDelete,
    }: any) =>
      (
        <div>
          <button
            type="button"
            data-testid={`card-${post.id}`}
            onClick={() => onClick?.(post)}
          >
            {post.content}
          </button>
          <button
            type="button"
            data-testid={`card-replies-${post.id}`}
            onClick={() => onRepliesClick?.(post)}
          >
            replies
          </button>
          {showActions && onEdit && (
            <button
              type="button"
              data-testid={`card-edit-${post.id}`}
              onClick={onEdit}
            >
              edit
            </button>
          )}
          {showActions && onDelete && canDelete && (
            <button
              type="button"
              data-testid={`card-delete-${post.id}`}
              onClick={onDelete}
            >
              delete
            </button>
          )}
        </div>
      ),
);

const post = (id: string) => ({
  id,
  content: `post ${id}`,
  replyCount: 0,
  author: { id: '6', displayName: 'x' },
  mentions: [],
  attachments: [],
  createdAt: '',
  updatedAt: '',
  unreadReplyCount: 0,
});

const baseFeed = {
  posts: [],
  loading: false,
  error: false,
  page: 1,
  totalPages: 1,
  fetchFeed: mockFetchFeed,
  goToNextPage: mockGoToNextPage,
  goToPrevPage: mockGoToPrevPage,
};

const renderFeed = (props = {}) =>
  render(<PostsFeed projectId="p1" customerId="c1" workerId="6" {...props} />);

describe('PostsFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFeedState = { ...baseFeed };
    mockWorkerState = jest.fn(() => ({
      workerId: '6',
      workerType: 'employee',
      loading: false,
    }));
    mockComposerOpen = false;
    mockOpenThreadPost = null;
    mockEditingPost = null;
    mockEditingReply = null;
    mockDeleteInProgress = false;
    mockDeleteTargetPost = null;
    mockDeleteModalError = null;
    mockFeedError = null;
    mockDeletePost.mockResolvedValue({ success: true });
    mockMarkPostsRead.mockResolvedValue({ success: true });
  });

  it('fetches the feed once the worker id resolves', () => {
    renderFeed();
    expect(mockFetchFeed).toHaveBeenCalledWith({
      projectId: 'p1',
      customerId: 'c1',
      workerId: '6',
    });
  });

  it('does not fetch until the worker id is available', () => {
    mockWorkerState = jest.fn(() => ({ workerId: null, loading: true }));
    mockFeedState = { ...baseFeed, loading: false };
    renderFeed();
    expect(mockFetchFeed).not.toHaveBeenCalled();
  });

  it('shows a loader during worker resolution', () => {
    mockWorkerState = jest.fn(() => ({ workerId: null, loading: true }));
    renderFeed();
    expect(screen.getByTestId('project-posts-loader')).toBeInTheDocument();
  });

  it('shows a loader during the initial feed fetch', () => {
    mockFeedState = { ...baseFeed, loading: true };
    renderFeed();
    expect(screen.getByTestId('project-posts-loader')).toBeInTheDocument();
  });

  it('shows the error state when the feed fails', () => {
    mockFeedState = { ...baseFeed, error: true };
    renderFeed();
    expect(screen.getByTestId('project-posts-error')).toBeInTheDocument();
  });

  it('shows unavailable error when workerId fails to resolve', () => {
    mockWorkerState = jest.fn(() => ({
      workerId: null,
      workerType: null,
      loading: false,
    }));
    mockFeedState = { ...baseFeed };
    renderFeed();
    expect(screen.getByTestId('project-posts-unavailable')).toBeInTheDocument();
  });

  it('shows pagination error banner when error occurs with posts on screen', () => {
    mockFeedState = { ...baseFeed, posts: [post('1')], error: true };
    renderFeed();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/setFeedError',
      payload: 'timeProject.posts.paginationError',
    });
  });

  it('disables New Post button when customerId is not provided', () => {
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed({ customerId: undefined });
    expect(screen.getByTestId('project-posts-new-post-btn')).toBeDisabled();
  });

  it('dispatches feedError on delete when customerId is missing', async () => {
    mockDeleteTargetPost = post('1');
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed({ customerId: undefined });
    fireEvent.click(screen.getByTestId('delete-post-confirm'));

    await new Promise((r) => setTimeout(r, 0));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/setFeedError',
      payload: 'timeProject.posts.unavailableError',
    });
  });

  it('shows the empty state when there are no posts', () => {
    renderFeed();
    expect(screen.getByTestId('empty-state-create')).toBeInTheDocument();
  });

  it('opens the composer from the empty-state create button', () => {
    renderFeed();
    fireEvent.click(screen.getByTestId('empty-state-create'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/openComposer',
    });
  });

  it('renders post cards and the New post button when posts exist', () => {
    mockFeedState = { ...baseFeed, posts: [post('1'), post('2')] };
    renderFeed();
    expect(
      screen.getByTestId('project-posts-new-post-btn'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('card-1')).toBeInTheDocument();
    expect(screen.getByTestId('card-2')).toBeInTheDocument();
  });

  it('opens the composer from the New post button', () => {
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed();
    fireEvent.click(screen.getByTestId('project-posts-new-post-btn'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/openComposer',
    });
  });

  it('renders the composer drawer when composerOpen is true', () => {
    mockComposerOpen = true;
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed();
    expect(screen.getByTestId('post-composer-drawer')).toBeInTheDocument();
  });

  it('does not render the composer drawer when composerOpen is false', () => {
    mockComposerOpen = false;
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed();
    expect(
      screen.queryByTestId('post-composer-drawer'),
    ).not.toBeInTheDocument();
  });

  it('dispatches closeComposer when the composer closes', () => {
    mockComposerOpen = true;
    renderFeed();
    fireEvent.click(screen.getByTestId('composer-close'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/closeComposer',
    });
  });

  it('refetches the feed and shows a toast after a successful post', () => {
    mockComposerOpen = true;
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed();
    mockFetchFeed.mockClear();
    fireEvent.click(screen.getByTestId('composer-posted'));
    expect(mockFetchFeed).toHaveBeenCalledWith({
      projectId: 'p1',
      customerId: 'c1',
      workerId: '6',
    });
    expect(screen.getByTestId('success-toast')).toBeInTheDocument();
  });

  it('opens the thread when a post card is clicked', () => {
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed();
    fireEvent.click(screen.getByTestId('card-1'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/openThread',
      payload: expect.objectContaining({ id: '1' }),
    });
  });

  it('opens the thread from the "N replies" link', () => {
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed();
    fireEvent.click(screen.getByTestId('card-replies-1'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/openThread',
      payload: expect.objectContaining({ id: '1' }),
    });
  });

  it('renders the thread drawer when a thread is open', () => {
    mockOpenThreadPost = post('1');
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed();
    expect(screen.getByTestId('post-thread-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('thread-post-id')).toHaveTextContent('1');
  });

  it('dispatches closeThread when the thread drawer closes', () => {
    mockOpenThreadPost = post('1');
    renderFeed();
    fireEvent.click(screen.getByTestId('thread-close'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/closeThread',
    });
  });

  it('refetches the feed and shows a toast after a successful reply', () => {
    mockOpenThreadPost = post('1');
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed();
    mockFetchFeed.mockClear();
    fireEvent.click(screen.getByTestId('thread-replied'));
    expect(mockFetchFeed).toHaveBeenCalledWith({
      projectId: 'p1',
      customerId: 'c1',
      workerId: '6',
    });
    expect(screen.getByTestId('success-toast')).toBeInTheDocument();
  });

  it('refetches the feed and shows a toast after a successful reply edit', () => {
    mockOpenThreadPost = post('1');
    mockFeedState = { ...baseFeed, posts: [post('1')] };
    renderFeed();
    mockFetchFeed.mockClear();
    fireEvent.click(screen.getByTestId('thread-reply-edited'));
    expect(mockFetchFeed).toHaveBeenCalledWith({
      projectId: 'p1',
      customerId: 'c1',
      workerId: '6',
    });
    expect(screen.getByTestId('success-toast')).toHaveTextContent(
      'timeProject.posts.thread.editSuccess',
    );
    expect(screen.getByTestId('post-thread-drawer')).toBeInTheDocument();
  });

  it('renders pagination and pages forward / backward', () => {
    mockFeedState = {
      ...baseFeed,
      posts: [post('1')],
      page: 2,
      totalPages: 3,
    };
    renderFeed();
    expect(screen.getByTestId('project-posts-pagination')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pagination-next'));
    expect(mockGoToNextPage).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('pagination-prev'));
    expect(mockGoToPrevPage).toHaveBeenCalled();
  });

  it('hides pagination when there is only one page', () => {
    mockFeedState = { ...baseFeed, posts: [post('1')], totalPages: 1 };
    renderFeed();
    expect(
      screen.queryByTestId('project-posts-pagination'),
    ).not.toBeInTheDocument();
  });

  describe('edit flow', () => {
    it('dispatches openEditComposer when the edit action is clicked', () => {
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      fireEvent.click(screen.getByTestId('card-edit-1'));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'postsUi/openEditComposer',
        payload: expect.objectContaining({ id: '1' }),
      });
    });

    it('passes editingPost to the composer drawer', () => {
      const editPost = post('42');
      mockEditingPost = editPost;
      mockComposerOpen = true;
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      expect(screen.getByTestId('composer-editing-post-id')).toHaveTextContent(
        '42',
      );
    });
  });

  describe('delete flow', () => {
    it('dispatches openDeleteConfirm when delete is clicked', () => {
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      fireEvent.click(screen.getByTestId('card-delete-1'));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'postsUi/openDeleteConfirm',
        payload: expect.objectContaining({ id: '1' }),
      });
    });

    it('renders the delete modal when deleteTargetPost is set', () => {
      mockDeleteTargetPost = post('1');
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      expect(screen.getByTestId('delete-post-modal')).toBeInTheDocument();
    });

    it('calls deletePost and refetches on confirm', async () => {
      mockDeleteTargetPost = post('1');
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      fireEvent.click(screen.getByTestId('delete-post-confirm'));

      await screen.findByTestId('success-toast');
      expect(mockDeletePost).toHaveBeenCalledWith({
        postId: '1',
        projectId: 'p1',
        customerId: 'c1',
        workerId: '6',
        workerType: 'employee',
      });
      expect(mockFetchFeed).toHaveBeenCalled();
    });

    it('dispatches setDeleteModalError on HAS_ACTIVE_REPLIES', async () => {
      mockDeletePost.mockResolvedValueOnce({
        success: false,
        errorCode: 'HAS_ACTIVE_REPLIES',
      });
      mockDeleteTargetPost = post('1');
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      fireEvent.click(screen.getByTestId('delete-post-confirm'));

      await new Promise((r) => setTimeout(r, 0));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'postsUi/setDeleteModalError',
        payload: 'timeProject.posts.delete.hasRepliesError',
      });
    });

    it('renders the modal error when deleteModalError is set', () => {
      mockDeleteTargetPost = post('1');
      mockDeleteModalError = 'timeProject.posts.delete.hasRepliesError';
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      expect(screen.getByTestId('delete-post-modal-error')).toHaveTextContent(
        'timeProject.posts.delete.hasRepliesError',
      );
      expect(screen.getByTestId('delete-post-modal')).toBeInTheDocument();
    });

    it('dispatches setFeedError on generic delete failure', async () => {
      mockDeletePost.mockResolvedValueOnce({ success: false });
      mockDeleteTargetPost = post('1');
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      fireEvent.click(screen.getByTestId('delete-post-confirm'));

      await new Promise((r) => setTimeout(r, 0));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'postsUi/setFeedError',
        payload: 'timeProject.posts.delete.error',
      });
    });

    it('renders feed-level error when feedError is set', () => {
      mockFeedError = 'timeProject.posts.delete.error';
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      expect(screen.getByTestId('project-posts-feed-error')).toHaveTextContent(
        'timeProject.posts.delete.error',
      );
    });

    it('dispatches closeDeleteConfirm on cancel', () => {
      mockDeleteTargetPost = post('1');
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      fireEvent.click(screen.getByTestId('delete-post-cancel'));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'postsUi/closeDeleteConfirm',
      });
    });

    it('clears delete state on unmount', () => {
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      const { unmount } = renderFeed();
      mockDispatch.mockClear();
      unmount();
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'postsUi/closeDeleteConfirm',
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'postsUi/setFeedError',
        payload: null,
      });
    });

    it('keeps the thread open and shows reply delete toast on reply delete', async () => {
      mockOpenThreadPost = post('1');
      mockDeleteTargetPost = {
        id: 'r1',
        parentPostId: '1',
        author: { id: '6' },
      };
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      fireEvent.click(screen.getByTestId('delete-post-confirm'));

      await screen.findByTestId('success-toast');
      expect(screen.getByTestId('success-toast')).toHaveTextContent(
        'timeProject.posts.delete.replySuccess',
      );
      expect(screen.getByTestId('post-thread-drawer')).toBeInTheDocument();
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: 'postsUi/closeThread',
      });
      expect(mockDeletePost).toHaveBeenCalledWith({
        postId: 'r1',
        projectId: 'p1',
        customerId: 'c1',
        workerId: '6',
        workerType: 'employee',
      });
    });

    it('cancels reply edit when the deleted reply was being edited', async () => {
      mockEditingReply = {
        id: 'r1',
        parentPostId: '1',
        content: 'editing',
      };
      mockDeleteTargetPost = {
        id: 'r1',
        parentPostId: '1',
        author: { id: '6' },
      };
      mockOpenThreadPost = post('1');
      mockFeedState = { ...baseFeed, posts: [post('1')] };
      renderFeed();
      fireEvent.click(screen.getByTestId('delete-post-confirm'));

      await screen.findByTestId('success-toast');
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'postsUi/cancelEditReply',
      });
    });
  });
});
