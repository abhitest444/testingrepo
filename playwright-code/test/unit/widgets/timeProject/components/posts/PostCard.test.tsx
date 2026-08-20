import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PostCard from 'src/js/widgets/timeProject/components/posts/PostCard';
import { Post } from 'src/js/widgets/timeProject/types/posts';

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

const mockDispatch = jest.fn();
const mockUpdatePost = jest.fn();
let mockSaving = false;

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  useHasAdminAccess: () => false,
}));

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }, values?: Record<string, any>) =>
      values ? `${id}:${JSON.stringify(values)}` : id,
  }),
}));

// The inline reply editor uses the @-mention rich editor (covered by its own
// tests); stub it so PostCard tests don't pull in the contenteditable /
// assignments / IDS-badge machinery.
jest.mock(
  'src/js/widgets/timeProject/components/posts/mentions/MentionEditor',
  () => {
    const ReactMod = jest.requireActual('react');
    const MockEditor = ReactMod.forwardRef(
      ({ initialContent, onChange, 'data-testid': testId }: any, ref: any) => {
        const [val, setVal] = ReactMod.useState(initialContent ?? '');
        ReactMod.useImperativeHandle(ref, () => ({
          getSaveContent: () => val,
          getDisplayContent: () => val,
          focus: () => {},
          clear: () => setVal(''),
        }));
        return ReactMod.createElement('textarea', {
          'data-testid': testId,
          value: val,
          onChange: (e: any) => {
            setVal(e.target.value);
            onChange?.(e.target.value);
          },
        });
      },
    );
    return { __esModule: true, default: MockEditor };
  },
);

jest.mock('src/js/widgets/timeProject/store', () => ({
  useAppDispatch: () => mockDispatch,
}));

jest.mock('src/js/widgets/timeProject/store/postsUiSlice', () => ({
  cancelEditReply: () => ({ type: 'postsUi/cancelEditReply' }),
}));

jest.mock('src/js/widgets/timeProject/hooks/useManagePost', () => ({
  useManagePost: () => ({
    saving: mockSaving,
    updatePost: mockUpdatePost,
  }),
}));

jest.mock('@ids-ts/cards', () => ({
  Card: ({ children, onClick, disableCardClick, automationId }: any) => (
    <div
      data-testid={automationId}
      data-disabled={String(disableCardClick)}
      onClick={onClick}
    >
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@ids-ts/typography', () => ({
  B2: ({ children }: any) => <span>{children}</span>,
  B3: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({
    onClick,
    'aria-label': ariaLabel,
    'aria-haspopup': ariaHaspopup,
    'aria-expanded': ariaExpanded,
    'data-testid': dataTestid,
    children,
  }: any) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      data-testid={dataTestid}
    >
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/menu', () => ({
  Menu: ({ children, open, anchorElement }: any) => (
    <div data-testid="ids-menu">
      {anchorElement}
      {open && children}
    </div>
  ),
  MenuItem: ({ onClick, 'data-testid': dataTestid, children }: any) => (
    <button onClick={onClick} data-testid={dataTestid}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ onClick, disabled, 'data-testid': testId, children }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid={testId}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <span data-testid="loader" />,
}));

jest.mock('@design-systems/icons', () => ({
  OverflowWeb: () => <span data-testid="overflow-icon" />,
}));

const basePost: Post = {
  id: '53493126',
  parentPostId: null,
  projectId: '429610453',
  customerId: '5',
  author: {
    id: '6',
    type: 'EMPLOYEE',
    firstName: 'test admin',
    lastName: 'admin',
    displayName: 'test admin admin',
    isActive: true,
  },
  content: 'test post 1 <EMPLOYEE_6>',
  replyCount: 2,
  unreadReplyCount: 1,
  attachments: [],
  mentions: [
    {
      workerId: '6',
      displayName: 'test admin admin',
      token: '<EMPLOYEE_6>',
      active: true,
    },
  ],
  createdAt: '2026-06-16T06:45:46.000Z',
  updatedAt: '2026-06-16T06:50:00.000Z',
};

describe('PostCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaving = false;
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renders the author display name', () => {
    render(<PostCard post={{ ...basePost, content: 'hi', mentions: [] }} />);
    expect(screen.getByText('test admin admin')).toBeInTheDocument();
  });

  it('resolves mention tokens in the content to display names', () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByTestId('post-content-53493126')).toHaveTextContent(
      'test post 1 test admin admin',
    );
  });

  it('renders @-mentions as highlighted segments', () => {
    render(<PostCard post={basePost} />);
    const mention = screen.getByTestId('post-mention');
    expect(mention).toHaveTextContent('test admin admin');
  });

  it('renders plain content with no mention segments', () => {
    render(
      <PostCard post={{ ...basePost, content: 'just text', mentions: [] }} />,
    );
    expect(screen.getByTestId('post-content-53493126')).toHaveTextContent(
      'just text',
    );
    expect(screen.queryByTestId('post-mention')).not.toBeInTheDocument();
  });

  it('renders an http(s) link as an anchor opening in a new tab', () => {
    render(
      <PostCard
        post={{
          ...basePost,
          content: 'see https://intuit.com',
          mentions: [],
        }}
      />,
    );
    const link = screen.getByTestId('post-link');
    expect(link).toHaveAttribute('href', 'https://intuit.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the plural replies label from replyCount', () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByTestId('post-replies-53493126')).toHaveTextContent(
      'timeProject.posts.replies',
    );
  });

  it('renders the singular replies label when replyCount is 1', () => {
    render(<PostCard post={{ ...basePost, replyCount: 1 }} />);
    expect(screen.getByTestId('post-replies-53493126')).toHaveTextContent(
      'timeProject.posts.oneReply',
    );
  });

  it('renders the no-replies label when replyCount is 0', () => {
    render(<PostCard post={{ ...basePost, replyCount: 0 }} />);
    expect(screen.getByTestId('post-replies-53493126')).toHaveTextContent(
      'timeProject.posts.noReplies',
    );
  });

  it('renders an em-dash when the author has no display name', () => {
    render(
      <PostCard post={{ ...basePost, author: { id: '6', displayName: '' } }} />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calls onClick with the post and enables card click', () => {
    const onClick = jest.fn();
    render(<PostCard post={basePost} onClick={onClick} />);
    const card = screen.getByTestId('post-card-53493126');
    expect(card).toHaveAttribute('data-disabled', 'false');
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledWith(basePost);
  });

  it('disables card click when no onClick handler is provided', () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByTestId('post-card-53493126')).toHaveAttribute(
      'data-disabled',
      'true',
    );
  });

  describe('edited label', () => {
    it('shows the edited label when createdAt differs from updatedAt', () => {
      render(<PostCard post={basePost} showActions isAuthor />);
      expect(
        screen.getByTestId(`post-edited-${basePost.id}`),
      ).toBeInTheDocument();
    });

    it('does not show the edited label when createdAt equals updatedAt', () => {
      render(
        <PostCard
          post={{
            ...basePost,
            createdAt: '2026-06-16T06:45:46.000Z',
            updatedAt: '2026-06-16T06:45:46.000Z',
          }}
        />,
      );
      expect(
        screen.queryByTestId(`post-edited-${basePost.id}`),
      ).not.toBeInTheDocument();
    });
  });

  describe('action menu', () => {
    it('shows the action menu trigger when showActions and isAuthor', () => {
      render(<PostCard post={basePost} showActions isAuthor />);
      expect(
        screen.getByTestId(`post-actions-${basePost.id}`),
      ).toBeInTheDocument();
    });

    it('does not show the action menu when showActions is false', () => {
      render(<PostCard post={basePost} isAuthor />);
      expect(
        screen.queryByTestId(`post-actions-${basePost.id}`),
      ).not.toBeInTheDocument();
    });

    it('does not show the action menu when isAuthor is false', () => {
      render(<PostCard post={basePost} showActions />);
      expect(
        screen.queryByTestId(`post-actions-${basePost.id}`),
      ).not.toBeInTheDocument();
    });

    it('opens the menu on action button click and calls onEdit', () => {
      const onEdit = jest.fn();
      render(<PostCard post={basePost} showActions isAuthor onEdit={onEdit} />);
      fireEvent.click(screen.getByTestId(`post-actions-${basePost.id}`));
      fireEvent.click(screen.getByTestId(`post-action-edit-${basePost.id}`));
      expect(onEdit).toHaveBeenCalled();
    });

    it('shows delete when canDelete is true and calls onDelete', () => {
      const onDelete = jest.fn();
      render(
        <PostCard
          post={{ ...basePost, replyCount: 0 }}
          showActions
          isAuthor
          canDelete
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByTestId(`post-actions-${basePost.id}`));
      fireEvent.click(screen.getByTestId(`post-action-delete-${basePost.id}`));
      expect(onDelete).toHaveBeenCalled();
    });

    it('hides delete when canDelete is false', () => {
      render(
        <PostCard
          post={basePost}
          showActions
          isAuthor
          canDelete={false}
          onDelete={jest.fn()}
        />,
      );
      fireEvent.click(screen.getByTestId(`post-actions-${basePost.id}`));
      expect(
        screen.queryByTestId(`post-action-delete-${basePost.id}`),
      ).not.toBeInTheDocument();
    });
  });

  describe('thread mode (replies provided)', () => {
    const reply = (id: string): Post => ({
      ...basePost,
      id,
      parentPostId: basePost.id,
      content: `reply ${id}`,
      mentions: [],
      replyCount: 0,
    });

    it('renders replies inline in the same card (no "N replies" link)', () => {
      render(<PostCard post={basePost} replies={[reply('r1'), reply('r2')]} />);
      expect(screen.getByTestId('post-reply-r1')).toBeInTheDocument();
      expect(screen.getByTestId('post-reply-r2')).toBeInTheDocument();
      expect(
        screen.queryByTestId('post-replies-53493126'),
      ).not.toBeInTheDocument();
    });

    it('renders just the parent with an empty replies array', () => {
      render(<PostCard post={basePost} replies={[]} />);
      expect(screen.getByTestId('post-content-53493126')).toBeInTheDocument();
      expect(
        screen.queryByTestId('post-replies-53493126'),
      ).not.toBeInTheDocument();
    });

    it('renders the scroll region in thread mode even without onRepliesScrollEnd', () => {
      render(<PostCard post={basePost} replies={[reply('r1')]} />);
      expect(screen.getByTestId('post-replies-scroll')).toBeInTheDocument();
    });

    it('renders the scroll region whenever more replies can load', () => {
      render(
        <PostCard
          post={basePost}
          replies={[reply('r1')]}
          onRepliesScrollEnd={jest.fn()}
        />,
      );
      expect(screen.getByTestId('post-replies-scroll')).toBeInTheDocument();
    });

    it('auto-loads the next page when replies do not overflow the viewport', () => {
      const onRepliesScrollEnd = jest.fn();
      render(
        <PostCard
          post={basePost}
          replies={[reply('r1')]}
          onRepliesScrollEnd={onRepliesScrollEnd}
        />,
      );
      expect(onRepliesScrollEnd).toHaveBeenCalled();
    });

    it('does not auto-load while a page is already being appended', () => {
      const onRepliesScrollEnd = jest.fn();
      render(
        <PostCard
          post={basePost}
          replies={[reply('r1')]}
          onRepliesScrollEnd={onRepliesScrollEnd}
          repliesLoadingMore
        />,
      );
      expect(onRepliesScrollEnd).not.toHaveBeenCalled();
    });

    it('shows reply action menu for the reply author', () => {
      const onReplyEdit = jest.fn();
      const onReplyDelete = jest.fn();
      render(
        <PostCard
          post={basePost}
          replies={[reply('r1')]}
          currentWorkerId="6"
          onReplyEdit={onReplyEdit}
          onReplyDelete={onReplyDelete}
        />,
      );
      fireEvent.click(screen.getByTestId('post-actions-r1'));
      fireEvent.click(screen.getByTestId('post-action-edit-r1'));
      expect(onReplyEdit).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'r1' }),
      );
    });

    it('calls onReplyDelete when delete is chosen on a reply', () => {
      const onReplyDelete = jest.fn();
      render(
        <PostCard
          post={basePost}
          replies={[reply('r1')]}
          currentWorkerId="6"
          onReplyDelete={onReplyDelete}
        />,
      );
      fireEvent.click(screen.getByTestId('post-actions-r1'));
      fireEvent.click(screen.getByTestId('post-action-delete-r1'));
      expect(onReplyDelete).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'r1' }),
      );
    });

    it('does not show reply actions for non-authors', () => {
      render(
        <PostCard
          post={basePost}
          replies={[reply('r1')]}
          currentWorkerId="99"
          onReplyEdit={jest.fn()}
          onReplyDelete={jest.fn()}
        />,
      );
      expect(screen.queryByTestId('post-actions-r1')).not.toBeInTheDocument();
    });
  });

  describe('InlineReplyEdit', () => {
    const editContext = {
      projectId: 'proj-1',
      customerId: 'cust-1',
      workerId: '6',
      workerType: 'EMPLOYEE',
    };

    const editableReply: Post = {
      ...basePost,
      id: 'reply-edit-1',
      parentPostId: basePost.id,
      content: 'original reply',
      mentions: [],
      replyCount: 0,
    };

    it('renders the inline editor when editingReplyId matches a reply', () => {
      render(
        <PostCard
          post={basePost}
          replies={[editableReply]}
          editingReplyId="reply-edit-1"
          editContext={editContext}
        />,
      );
      expect(
        screen.getByTestId('inline-edit-textarea-reply-edit-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('inline-edit-cancel-reply-edit-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('inline-edit-save-reply-edit-1'),
      ).toBeInTheDocument();
    });

    it('dispatches cancelEditReply when cancel is clicked', () => {
      render(
        <PostCard
          post={basePost}
          replies={[editableReply]}
          editingReplyId="reply-edit-1"
          editContext={editContext}
        />,
      );
      fireEvent.click(screen.getByTestId('inline-edit-cancel-reply-edit-1'));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'postsUi/cancelEditReply',
      });
    });

    it('disables save when content has not changed', () => {
      render(
        <PostCard
          post={basePost}
          replies={[editableReply]}
          editingReplyId="reply-edit-1"
          editContext={editContext}
        />,
      );
      const saveBtn = screen.getByTestId('inline-edit-save-reply-edit-1');
      expect(saveBtn).toBeDisabled();
    });

    it('enables save when content is modified', () => {
      render(
        <PostCard
          post={basePost}
          replies={[editableReply]}
          editingReplyId="reply-edit-1"
          editContext={editContext}
        />,
      );
      const textarea = screen.getByTestId('inline-edit-textarea-reply-edit-1');
      fireEvent.change(textarea, { target: { value: 'updated reply text' } });
      const saveBtn = screen.getByTestId('inline-edit-save-reply-edit-1');
      expect(saveBtn).not.toBeDisabled();
    });

    it('calls updatePost and dispatches cancel on successful save', async () => {
      mockUpdatePost.mockResolvedValue({ success: true });
      render(
        <PostCard
          post={basePost}
          replies={[editableReply]}
          editingReplyId="reply-edit-1"
          editContext={editContext}
          onReplyEditSaved={jest.fn()}
        />,
      );
      const textarea = screen.getByTestId('inline-edit-textarea-reply-edit-1');
      fireEvent.change(textarea, { target: { value: 'new content' } });
      fireEvent.click(screen.getByTestId('inline-edit-save-reply-edit-1'));

      await screen.findByTestId('inline-edit-save-reply-edit-1');
      expect(mockUpdatePost).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          customerId: 'cust-1',
          workerId: '6',
          workerType: 'EMPLOYEE',
          postId: 'reply-edit-1',
        }),
      );
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'postsUi/cancelEditReply',
      });
    });

    it('does not dispatch cancel when save fails', async () => {
      mockUpdatePost.mockResolvedValue({ success: false });
      render(
        <PostCard
          post={basePost}
          replies={[editableReply]}
          editingReplyId="reply-edit-1"
          editContext={editContext}
        />,
      );
      const textarea = screen.getByTestId('inline-edit-textarea-reply-edit-1');
      fireEvent.change(textarea, { target: { value: 'new content' } });
      fireEvent.click(screen.getByTestId('inline-edit-save-reply-edit-1'));

      await screen.findByTestId('inline-edit-save-reply-edit-1');
      expect(mockUpdatePost).toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: 'postsUi/cancelEditReply',
      });
    });

    it('disables save when content is empty', () => {
      render(
        <PostCard
          post={basePost}
          replies={[editableReply]}
          editingReplyId="reply-edit-1"
          editContext={editContext}
        />,
      );
      const textarea = screen.getByTestId('inline-edit-textarea-reply-edit-1');
      fireEvent.change(textarea, { target: { value: '   ' } });
      const saveBtn = screen.getByTestId('inline-edit-save-reply-edit-1');
      expect(saveBtn).toBeDisabled();
    });
  });
});
