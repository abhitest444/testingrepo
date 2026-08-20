import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostThreadDrawer from 'src/js/widgets/timeProject/components/posts/PostThreadDrawer';
import { Post } from 'src/js/widgets/timeProject/types/posts';

const mockFetchReplies = jest.fn();
const mockRefetch = jest.fn();
const mockLoadMore = jest.fn();
const mockCreatePost = jest.fn();
const mockUpdatePost = jest.fn();
const mockDispatch = jest.fn();
const mockTrack = jest.fn();

let mockRepliesState: any;
let mockSaving = false;
let mockEditingReply: Post | null = null;

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }, values?: Record<string, any>) =>
      values ? `${id}:${JSON.stringify(values)}` : id,
  }),
  useTracking: () => mockTrack,
}));

jest.mock('src/js/widgets/timeProject/hooks/usePostsTrackingPoints', () => {
  const { POSTS_TRACKING_POINTS } = jest.requireActual(
    'src/js/widgets/timeProject/utils/timeProjectTrackingPoints',
  );
  return { usePostsTrackingPoints: () => POSTS_TRACKING_POINTS };
});

// Stub the @-mention rich editor with a plain controlled textarea exposing the
// same ref handle (the editor itself is covered by its own tests). With no
// mentions in these fixtures, the save form equals the display text.
jest.mock(
  'src/js/widgets/timeProject/components/posts/mentions/MentionEditor',
  () => {
    const ReactMod = jest.requireActual('react');
    const MockEditor = ReactMod.forwardRef(
      (
        {
          initialContent,
          onChange,
          disabled,
          errorText,
          'data-testid': testId,
        }: any,
        ref: any,
      ) => {
        const [val, setVal] = ReactMod.useState(initialContent ?? '');
        ReactMod.useImperativeHandle(ref, () => ({
          getSaveContent: () => val,
          getDisplayContent: () => val,
          focus: () => {},
          clear: () => {
            setVal('');
            onChange?.('');
          },
        }));
        ReactMod.useEffect(() => {
          onChange?.(initialContent ?? '');
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [initialContent]);
        return ReactMod.createElement(
          'div',
          null,
          ReactMod.createElement('textarea', {
            'data-testid': testId,
            value: val,
            disabled,
            onChange: (e: any) => {
              setVal(e.target.value);
              onChange?.(e.target.value);
            },
          }),
          errorText
            ? ReactMod.createElement(
                'span',
                { 'data-testid': 'reply-error' },
                errorText,
              )
            : null,
        );
      },
    );
    return { __esModule: true, default: MockEditor };
  },
);

jest.mock('src/js/widgets/timeProject/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) =>
    selector({ postsUi: { editingReply: mockEditingReply } }),
}));

jest.mock('src/js/widgets/timeProject/store/postsUiSlice', () => ({
  openEditReply: (reply: Post) => ({
    type: 'postsUi/openEditReply',
    payload: reply,
  }),
  cancelEditReply: () => ({ type: 'postsUi/cancelEditReply' }),
}));

jest.mock('src/js/widgets/timeProject/hooks/usePostReplies', () => ({
  usePostReplies: () => mockRepliesState,
}));

jest.mock('src/js/widgets/timeProject/hooks/useManagePost', () => ({
  useManagePost: () => ({
    saving: mockSaving,
    createPost: mockCreatePost,
    updatePost: mockUpdatePost,
  }),
}));

jest.mock('@ids-ts/drawer', () => ({
  Drawer: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  DrawerHeader: ({ title, onClose, children }: any) => (
    <div>
      <span data-testid="drawer-title">{title}</span>
      {children}
      <button type="button" data-testid="drawer-close" onClick={onClose}>
        x
      </button>
    </div>
  ),
  DrawerContent: ({ children }: any) => <div>{children}</div>,
  DrawerFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock(
  '@ids-ts/button',
  () =>
    ({ onClick, disabled, 'data-testid': testId, children }: any) =>
      (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          data-testid={testId}
        >
          {children}
        </button>
      ),
);

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ title, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{title}</div>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: ({ 'data-testid': testId }: any) => (
    <div data-testid={testId || 'loader'}>loading</div>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  B3: ({ children, 'data-testid': testId }: any) => (
    <span data-testid={testId}>{children}</span>
  ),
}));

jest.mock(
  'src/js/widgets/timeProject/components/posts/PostCard',
  () =>
    ({
      post,
      replies,
      onRepliesScrollEnd,
      repliesLoadingMore,
      onReplyEdit,
      onReplyDelete,
      editingReplyId,
      onReplyEditSaved,
    }: any) =>
      (
        <div data-testid={`card-${post.id}`}>
          {post.content}
          {onRepliesScrollEnd && (
            <button
              type="button"
              data-testid="replies-scroll-end"
              onClick={onRepliesScrollEnd}
            >
              scroll-end
            </button>
          )}
          {repliesLoadingMore && <span data-testid="replies-loading-more" />}
          {(replies ?? []).map((r: any) => (
            <div key={r.id} data-testid={`card-${r.id}`}>
              {editingReplyId === r.id ? (
                <button
                  type="button"
                  data-testid={`inline-edit-saved-${r.id}`}
                  onClick={() => onReplyEditSaved?.()}
                >
                  saved
                </button>
              ) : (
                <>
                  {r.content}
                  {onReplyEdit && (
                    <button
                      type="button"
                      data-testid={`reply-edit-${r.id}`}
                      onClick={() => onReplyEdit(r)}
                    >
                      edit
                    </button>
                  )}
                  {onReplyDelete && (
                    <button
                      type="button"
                      data-testid={`reply-delete-${r.id}`}
                      onClick={() => onReplyDelete(r)}
                    >
                      delete
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ),
);

jest.mock(
  'src/js/widgets/timeProject/components/posts/PostAttachmentsThumbnails',
  () => ({
    __esModule: true,
    default: ({ post }: any) => (
      <div data-testid={`post-attachments-mock-${post.id}`} />
    ),
    postHasAttachments: (post: any) =>
      (post.attachments ?? []).some((a: any) => !!a.documentId),
  }),
);

const parent: Post = {
  id: 'p-1',
  author: { id: '6', displayName: 'Garrett Stone' },
  content: 'parent post',
  replyCount: 2,
  unreadReplyCount: 0,
  attachments: [],
  mentions: [],
  createdAt: '',
  updatedAt: '',
};

const reply = (id: string): Post => ({
  ...parent,
  id,
  parentPostId: 'p-1',
  content: `reply ${id}`,
  replyCount: 0,
});

const onClose = jest.fn();
const onReplied = jest.fn();
const onReplyEdited = jest.fn();
const onDeleteReply = jest.fn();
const onRegisterRefetchReplies = jest.fn();

const baseReplies = {
  replies: [] as Post[],
  loading: false,
  loadingMore: false,
  error: false,
  loadMoreError: false,
  hasNextPage: false,
  refetch: mockRefetch,
  fetchReplies: mockFetchReplies,
  loadMore: mockLoadMore,
};

const renderDrawer = () =>
  render(
    <PostThreadDrawer
      post={parent}
      projectId="p1"
      customerId="c1"
      workerId="6"
      workerType="employee"
      onClose={onClose}
      onReplied={onReplied}
      onReplyEdited={onReplyEdited}
      onDeleteReply={onDeleteReply}
      onRegisterRefetchReplies={onRegisterRefetchReplies}
    />,
  );

const type = (value: string) =>
  fireEvent.change(screen.getByTestId('post-thread-reply-textarea'), {
    target: { value },
  });

describe('PostThreadDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepliesState = { ...baseReplies };
    mockSaving = false;
    mockEditingReply = null;
  });

  it('renders the drawer titled "Project post" with the parent card', () => {
    renderDrawer();
    expect(screen.getByTestId('post-thread-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-title')).toHaveTextContent(
      'timeProject.posts.thread.title',
    );
    expect(screen.getByTestId('card-p-1')).toBeInTheDocument();
  });

  it('registers the hook refetch function with the parent', () => {
    renderDrawer();
    expect(onRegisterRefetchReplies).toHaveBeenCalledWith(mockRefetch);
  });

  it('renders reply cards', () => {
    mockRepliesState = { ...baseReplies, replies: [reply('r1'), reply('r2')] };
    renderDrawer();
    expect(screen.getByTestId('card-r1')).toBeInTheDocument();
    expect(screen.getByTestId('card-r2')).toBeInTheDocument();
  });

  it('shows a loader while replies load', () => {
    mockRepliesState = { ...baseReplies, loading: true };
    renderDrawer();
    expect(screen.getByTestId('post-thread-loader')).toBeInTheDocument();
  });

  it('shows the replies error state', () => {
    mockRepliesState = { ...baseReplies, error: true };
    renderDrawer();
    expect(screen.getByTestId('post-thread-replies-error')).toBeInTheDocument();
  });

  it('disables Post reply when empty and enables it with text', () => {
    renderDrawer();
    expect(screen.getByTestId('post-thread-reply-btn')).toBeDisabled();
    type('a reply');
    expect(screen.getByTestId('post-thread-reply-btn')).not.toBeDisabled();
  });

  it('shows the over-limit error and disables Post reply', () => {
    renderDrawer();
    type('a'.repeat(2001));
    expect(screen.getByTestId('reply-error')).toBeInTheDocument();
    expect(screen.getByTestId('post-thread-reply-btn')).toBeDisabled();
  });

  it('posts a reply with parentPostId and closes on success', async () => {
    mockCreatePost.mockResolvedValueOnce({ success: true });
    renderDrawer();
    type('great idea');
    fireEvent.click(screen.getByTestId('post-thread-reply-btn'));

    expect(mockCreatePost).toHaveBeenCalledWith({
      projectId: 'p1',
      customerId: 'c1',
      parentPostId: 'p-1',
      content: 'great idea',
      workerId: '6',
      workerType: 'employee',
    });
    await waitFor(() => expect(onReplied).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the drawer open and shows an error on reply failure', async () => {
    mockCreatePost.mockResolvedValueOnce({ success: false });
    renderDrawer();
    type('great idea');
    fireEvent.click(screen.getByTestId('post-thread-reply-btn'));

    await waitFor(() =>
      expect(screen.getByTestId('post-thread-error')).toHaveTextContent(
        'timeProject.posts.thread.replyError',
      ),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('dispatches openEditReply when a reply edit action is triggered', () => {
    mockRepliesState = { ...baseReplies, replies: [reply('r1')] };
    renderDrawer();
    fireEvent.click(screen.getByTestId('reply-edit-r1'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'postsUi/openEditReply',
      payload: expect.objectContaining({ id: 'r1' }),
    });
  });

  it('calls onDeleteReply when a reply delete action is triggered', () => {
    mockRepliesState = { ...baseReplies, replies: [reply('r1')] };
    renderDrawer();
    fireEvent.click(screen.getByTestId('reply-delete-r1'));
    expect(onDeleteReply).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r1' }),
    );
  });

  it('refetches replies and notifies parent when onReplyEditSaved fires', () => {
    mockEditingReply = reply('r1');
    mockRepliesState = { ...baseReplies, replies: [reply('r1')] };
    renderDrawer();

    fireEvent.click(screen.getByTestId('inline-edit-saved-r1'));

    expect(onReplyEdited).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('loads more replies on infinite scroll when there is a next page', () => {
    mockRepliesState = {
      ...baseReplies,
      replies: [reply('r1')],
      hasNextPage: true,
    };
    renderDrawer();
    fireEvent.click(screen.getByTestId('replies-scroll-end'));
    expect(mockLoadMore).toHaveBeenCalled();
  });

  it('does not wire infinite scroll when there is no next page', () => {
    mockRepliesState = {
      ...baseReplies,
      replies: [reply('r1')],
      hasNextPage: false,
    };
    renderDrawer();
    expect(screen.queryByTestId('replies-scroll-end')).not.toBeInTheDocument();
  });

  it('shows the loading-more indicator while appending replies', () => {
    mockRepliesState = {
      ...baseReplies,
      replies: [reply('r1')],
      hasNextPage: true,
      loadingMore: true,
    };
    renderDrawer();
    expect(screen.getByTestId('replies-loading-more')).toBeInTheDocument();
  });

  it('shows loadMoreError banner when pagination of replies fails', () => {
    mockRepliesState = {
      ...baseReplies,
      replies: [reply('r1')],
      loadMoreError: true,
    };
    renderDrawer();
    expect(
      screen.getByTestId('post-replies-load-more-error'),
    ).toBeInTheDocument();
  });

  it('does not show loadMoreError banner when loadMoreError is false', () => {
    mockRepliesState = {
      ...baseReplies,
      replies: [reply('r1')],
      loadMoreError: false,
    };
    renderDrawer();
    expect(
      screen.queryByTestId('post-replies-load-more-error'),
    ).not.toBeInTheDocument();
  });

  it('disables reply textarea and submit button when a reply is being edited', () => {
    mockEditingReply = reply('r1');
    mockRepliesState = { ...baseReplies, replies: [reply('r1')] };
    renderDrawer();
    expect(screen.getByTestId('post-thread-reply-textarea')).toBeDisabled();
    expect(screen.getByTestId('post-thread-reply-btn')).toBeDisabled();
  });

  it('preserves draft text after inline edit completes', () => {
    mockRepliesState = { ...baseReplies, replies: [reply('r1')] };
    const { rerender } = render(
      <PostThreadDrawer
        post={parent}
        projectId="p1"
        customerId="c1"
        workerId="6"
        workerType="employee"
        onClose={onClose}
        onReplied={onReplied}
        onReplyEdited={onReplyEdited}
        onDeleteReply={onDeleteReply}
        onRegisterRefetchReplies={onRegisterRefetchReplies}
      />,
    );
    type('draft text');
    expect(screen.getByTestId('post-thread-reply-textarea')).toHaveValue(
      'draft text',
    );

    // Simulate entering edit mode
    mockEditingReply = reply('r1');
    rerender(
      <PostThreadDrawer
        post={parent}
        projectId="p1"
        customerId="c1"
        workerId="6"
        workerType="employee"
        onClose={onClose}
        onReplied={onReplied}
        onReplyEdited={onReplyEdited}
        onDeleteReply={onDeleteReply}
        onRegisterRefetchReplies={onRegisterRefetchReplies}
      />,
    );
    expect(screen.getByTestId('post-thread-reply-textarea')).toBeDisabled();

    // Simulate exiting edit mode — draft text is preserved
    mockEditingReply = null;
    rerender(
      <PostThreadDrawer
        post={parent}
        projectId="p1"
        customerId="c1"
        workerId="6"
        workerType="employee"
        onClose={onClose}
        onReplied={onReplied}
        onReplyEdited={onReplyEdited}
        onDeleteReply={onDeleteReply}
        onRegisterRefetchReplies={onRegisterRefetchReplies}
      />,
    );
    expect(screen.getByTestId('post-thread-reply-textarea')).not.toBeDisabled();
    expect(screen.getByTestId('post-thread-reply-textarea')).toHaveValue(
      'draft text',
    );
  });

  it('closes via the header close button', () => {
    renderDrawer();
    fireEvent.click(screen.getByTestId('drawer-close'));
    expect(onClose).toHaveBeenCalled();
  });
});
