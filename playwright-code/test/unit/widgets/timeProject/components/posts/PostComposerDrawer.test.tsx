import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import PostComposerDrawer from 'src/js/widgets/timeProject/components/posts/PostComposerDrawer';
import store from 'src/js/widgets/timeProject/store';
import { resetPostAttachments } from 'src/js/widgets/timeProject/store/postAttachmentsSlice';
import { closeDeleteConfirm } from 'src/js/widgets/timeProject/store/postsUiSlice';
import { Post, PostAttachment } from 'src/js/widgets/timeProject/types/posts';

const mockCreatePost = jest.fn();
const mockUpdatePost = jest.fn();
const mockCreateAttachments = jest.fn();
const mockDeleteAttachments = jest.fn();
const mockTrack = jest.fn();
let mockSaving = false;
let mockAttachmentsSaving = false;
let mockWorker = { workerId: '6', workerType: 'employee', ready: true };

// Captures the uploader props so tests can drive its onChange callback.
let mockUploaderProps: any = null;

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

// The @-mention rich editor is exercised in its own tests (MentionEditor /
// editorSerialize). Here, stub it with a plain controlled textarea that
// implements the same ref handle, so the composer's own behavior (char count,
// dirty, save) is testable without the contenteditable/assignments machinery.
// With no mentions in these fixtures, the save form equals the display text.
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
                { 'data-testid': 'textarea-error' },
                errorText,
              )
            : null,
        );
      },
    );
    return { __esModule: true, default: MockEditor };
  },
);

jest.mock('src/js/widgets/timeProject/hooks/useCurrentWorker', () => ({
  useCurrentWorker: () => mockWorker,
}));

jest.mock('src/js/widgets/timeProject/hooks/useManagePost', () => ({
  useManagePost: () => ({
    saving: mockSaving,
    createPost: mockCreatePost,
    updatePost: mockUpdatePost,
  }),
}));

jest.mock('src/js/widgets/timeProject/hooks/useManageAttachments', () => ({
  useManageAttachments: () => ({
    saving: mockAttachmentsSaving,
    createAttachments: mockCreateAttachments,
    deleteAttachments: mockDeleteAttachments,
  }),
}));

jest.mock('@design-systems/icons', () => ({
  Attach: () => <span>attach</span>,
}));

jest.mock(
  'src/js/widgets/timeProject/components/posts/PostAttachmentUploader',
  () => (props: any) => {
    mockUploaderProps = props;
    return <div data-testid="post-attachment-uploader" />;
  },
);

jest.mock('src/js/widgets/common/ConfirmationModal', () => ({
  ConfirmationModal: ({
    open,
    title,
    yesButtonLabel,
    noButtonLabel,
    onYesClick,
    setOpen,
    children,
  }: any) =>
    open ? (
      <div data-testid="leave-confirm-modal">
        <span data-testid="leave-confirm-title">{title}</span>
        <div>{children}</div>
        <button
          type="button"
          data-testid="leave-confirm-yes"
          onClick={onYesClick}
        >
          {yesButtonLabel}
        </button>
        <button
          type="button"
          data-testid="leave-confirm-no"
          onClick={() => setOpen(false)}
        >
          {noButtonLabel}
        </button>
      </div>
    ) : null,
}));

jest.mock('@ids-ts/drawer', () => ({
  Drawer: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  DrawerHeader: ({ title, onClose }: any) => (
    <div>
      <span data-testid="drawer-title">{title}</span>
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

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ title, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{title}</div>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <div data-testid="loader">loading</div>,
}));

jest.mock('@ids-ts/typography', () => ({
  B3: ({ children }: any) => <span>{children}</span>,
}));

const onClose = jest.fn();
const onPosted = jest.fn();

const basePost: Post = {
  id: 'post-42',
  parentPostId: null,
  projectId: 'p1',
  customerId: 'c1',
  author: {
    id: '6',
    type: 'EMPLOYEE',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    isActive: true,
  },
  content: 'Original content',
  replyCount: 0,
  unreadReplyCount: 0,
  attachments: [],
  mentions: [],
  createdAt: '2026-06-16T06:45:46.000Z',
  updatedAt: '2026-06-16T06:50:00.000Z',
};

const samplePost: Post = basePost;
const postWithAttachment: Post = {
  ...basePost,
  attachments: [{ id: 'att-1', documentId: 'doc-1', fileName: 'a.png' }],
};

const renderDrawer = (
  postToEdit?: Post | null,
  customerId: string | undefined = 'c1',
) =>
  render(
    <Provider store={store}>
      <PostComposerDrawer
        projectId="p1"
        customerId={customerId}
        workerId="6"
        onClose={onClose}
        onPosted={onPosted}
        postToEdit={postToEdit}
      />
    </Provider>,
  );

const type = (value: string) =>
  fireEvent.change(screen.getByTestId('post-composer-textarea'), {
    target: { value },
  });

const newUpload: PostAttachment = {
  id: 'doc-9',
  documentId: 'doc-9',
  fileName: 'x.png',
};

const emitAttachments = (attachments: PostAttachment[]) =>
  act(() => {
    mockUploaderProps.onChange(attachments);
  });

describe('PostComposerDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaving = false;
    mockAttachmentsSaving = false;
    mockWorker = { workerId: '6', workerType: 'employee', ready: true };
    mockUploaderProps = null;
    mockDeleteAttachments.mockResolvedValue({ success: true });
    store.dispatch(resetPostAttachments());
    store.dispatch(closeDeleteConfirm());
  });

  describe('create mode', () => {
    it('renders the drawer with title, subtitle, textarea and uploader', () => {
      renderDrawer();
      expect(screen.getByTestId('post-composer-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-title')).toHaveTextContent(
        'timeProject.posts.composer.title',
      );
      expect(screen.getByTestId('post-composer-subtitle')).toHaveTextContent(
        'timeProject.posts.composer.subtitle',
      );
      expect(screen.getByTestId('post-composer-textarea')).toBeInTheDocument();
      expect(
        screen.getByTestId('post-attachment-uploader'),
      ).toBeInTheDocument();
    });

    it('shows a full-drawer spinner and disables Post while saving', () => {
      mockSaving = true;
      renderDrawer();
      expect(screen.getByTestId('post-composer-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('post-composer-post-btn')).toBeDisabled();
    });

    it('shows the overlay while attachments are saving', () => {
      mockAttachmentsSaving = true;
      renderDrawer();
      expect(screen.getByTestId('post-composer-overlay')).toBeInTheDocument();
    });

    it('disables the uploader until the worker resolves', () => {
      mockWorker = { workerId: '6', workerType: 'employee', ready: false };
      renderDrawer();
      expect(mockUploaderProps.disabled).toBe(true);
    });

    it('disables Post when the textarea is empty', () => {
      renderDrawer();
      expect(screen.getByTestId('post-composer-post-btn')).toBeDisabled();
    });

    it('disables Post when content is only whitespace', () => {
      renderDrawer();
      type('   ');
      expect(screen.getByTestId('post-composer-post-btn')).toBeDisabled();
    });

    it('enables Post when valid content is typed', () => {
      renderDrawer();
      type('Hello team');
      expect(screen.getByTestId('post-composer-post-btn')).not.toBeDisabled();
    });

    it('enables Post for an attachment-only post (no text)', () => {
      renderDrawer();
      // No text typed; only an uploaded attachment present.
      emitAttachments([newUpload]);
      expect(screen.getByTestId('post-composer-post-btn')).not.toBeDisabled();
    });

    it('shows the character count', () => {
      renderDrawer();
      type('abc');
      expect(screen.getByTestId('post-composer-char-count')).toHaveTextContent(
        '"count":3',
      );
    });

    it('shows the error state and disables Post when over 2000 characters', () => {
      renderDrawer();
      type('a'.repeat(2001));
      expect(screen.getByTestId('textarea-error')).toBeInTheDocument();
      expect(screen.getByTestId('post-composer-post-btn')).toBeDisabled();
    });

    it('posts and closes on success', async () => {
      mockCreatePost.mockResolvedValueOnce({ success: true });
      renderDrawer();
      type('Hello team');
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      expect(mockCreatePost).toHaveBeenCalledWith({
        projectId: 'p1',
        customerId: 'c1',
        content: 'Hello team',
        workerId: '6',
        workerType: 'employee',
      });
      await waitFor(() => expect(onPosted).toHaveBeenCalled());
      expect(onClose).toHaveBeenCalled();
      expect(mockCreateAttachments).not.toHaveBeenCalled();
    });

    it('creates the post then links uploaded attachments', async () => {
      mockCreatePost.mockResolvedValueOnce({ success: true, postId: 'new-1' });
      mockCreateAttachments.mockResolvedValueOnce({ success: true });
      renderDrawer();
      type('With files');
      emitAttachments([newUpload]);
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      await waitFor(() =>
        expect(mockCreateAttachments).toHaveBeenCalledWith({
          postId: 'new-1',
          attachments: [{ documentId: 'doc-9', name: 'x.png' }],
        }),
      );
      await waitFor(() => expect(onPosted).toHaveBeenCalled());
    });

    it('errors when the created post has attachments but no returned id', async () => {
      mockCreatePost.mockResolvedValueOnce({ success: true });
      renderDrawer();
      type('With files');
      emitAttachments([newUpload]);
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      await waitFor(() =>
        expect(screen.getByTestId('post-composer-error')).toBeInTheDocument(),
      );
      expect(mockCreateAttachments).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('errors when linking attachments fails after create', async () => {
      mockCreatePost.mockResolvedValueOnce({ success: true, postId: 'new-1' });
      mockCreateAttachments.mockResolvedValueOnce({ success: false });
      renderDrawer();
      type('With files');
      emitAttachments([newUpload]);
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      await waitFor(() =>
        expect(screen.getByTestId('post-composer-error')).toBeInTheDocument(),
      );
      expect(onClose).not.toHaveBeenCalled();
    });

    it('keeps the drawer open and shows a generic error on failure', async () => {
      mockCreatePost.mockResolvedValueOnce({ success: false });
      renderDrawer();
      type('Hello team');
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      await waitFor(() =>
        expect(screen.getByTestId('post-composer-error')).toHaveTextContent(
          'timeProject.posts.composer.error',
        ),
      );
      expect(onClose).not.toHaveBeenCalled();
    });

    it('clears the error message when the user edits the text again', async () => {
      mockCreatePost.mockResolvedValueOnce({ success: false });
      renderDrawer();
      type('Hello team');
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));
      await waitFor(() =>
        expect(screen.getByTestId('post-composer-error')).toBeInTheDocument(),
      );
      type('Hello team again');
      expect(
        screen.queryByTestId('post-composer-error'),
      ).not.toBeInTheDocument();
    });

    it('does not submit when required worker/customer data is missing', () => {
      render(
        <Provider store={store}>
          <PostComposerDrawer
            projectId="p1"
            workerId="6"
            onClose={onClose}
            onPosted={onPosted}
            postToEdit={null}
          />
        </Provider>,
      );
      type('Hello team');
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));
      expect(mockCreatePost).not.toHaveBeenCalled();
    });

    it('closes directly via the drawer close button when not dirty', () => {
      renderDrawer();
      fireEvent.click(screen.getByTestId('drawer-close'));
      expect(onClose).toHaveBeenCalled();
      expect(
        screen.queryByTestId('leave-confirm-modal'),
      ).not.toBeInTheDocument();
    });

    it('confirms before closing when there are unsaved changes', () => {
      renderDrawer();
      type('Hello team');
      fireEvent.click(screen.getByTestId('drawer-close'));
      expect(screen.getByTestId('leave-confirm-modal')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('keeps the drawer open when the confirm modal is cancelled', () => {
      renderDrawer();
      type('Hello team');
      fireEvent.click(screen.getByTestId('drawer-close'));
      fireEvent.click(screen.getByTestId('leave-confirm-no'));
      expect(
        screen.queryByTestId('leave-confirm-modal'),
      ).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes the drawer when the confirm modal is continued', () => {
      renderDrawer();
      type('Hello team');
      fireEvent.click(screen.getByTestId('drawer-close'));
      fireEvent.click(screen.getByTestId('leave-confirm-yes'));
      expect(onClose).toHaveBeenCalled();
    });

    it('treats a newly uploaded attachment as unsaved progress', () => {
      renderDrawer();
      emitAttachments([newUpload]);
      fireEvent.click(screen.getByTestId('drawer-close'));
      expect(screen.getByTestId('leave-confirm-modal')).toBeInTheDocument();
    });

    it('permanently excludes a freshly-uploaded attachment once removed, so a re-emitted upload event cannot resurrect it', async () => {
      mockCreatePost.mockResolvedValueOnce({ success: true, postId: 'new-1' });
      mockCreateAttachments.mockResolvedValueOnce({ success: true });
      renderDrawer();
      type('With files');

      // Upload doc-9, then delete it before it's saved.
      emitAttachments([newUpload]);
      emitAttachments([]);
      expect(mockUploaderProps.excludedDocumentIds).toEqual(['doc-9']);

      // A later batch's re-emitted event still reports doc-9 as uploaded
      // alongside a genuinely new doc-10 — simulate the uploader re-adding
      // both (as the widget would) and confirm the composer only saves the
      // new one, honoring the exclusion.
      const secondUpload: PostAttachment = {
        id: 'doc-10',
        documentId: 'doc-10',
        fileName: 'y.png',
      };
      emitAttachments([secondUpload]);
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      await waitFor(() =>
        expect(mockCreateAttachments).toHaveBeenCalledWith({
          postId: 'new-1',
          attachments: [{ documentId: 'doc-10', name: 'y.png' }],
        }),
      );
    });
  });

  describe('edit mode', () => {
    it('shows the edit drawer title', () => {
      renderDrawer(samplePost);
      expect(screen.getByTestId('drawer-title')).toHaveTextContent(
        'timeProject.posts.composer.editTitle',
      );
    });

    it('shows "Save" instead of "Post" on the submit button', () => {
      renderDrawer(samplePost);
      expect(screen.getByTestId('post-composer-post-btn')).toHaveTextContent(
        'timeProject.posts.composer.editSave',
      );
    });

    it('pre-fills the textarea with the post content', () => {
      renderDrawer(samplePost);
      expect(screen.getByTestId('post-composer-textarea')).toHaveValue(
        'Original content',
      );
    });

    it('shows the attachment uploader in edit mode', () => {
      renderDrawer(samplePost);
      expect(
        screen.getByTestId('post-attachment-uploader'),
      ).toBeInTheDocument();
    });

    it('disables Save when content has not changed', () => {
      renderDrawer(samplePost);
      expect(screen.getByTestId('post-composer-post-btn')).toBeDisabled();
    });

    it('enables Save when content is modified', () => {
      renderDrawer(samplePost);
      type('Modified content');
      expect(screen.getByTestId('post-composer-post-btn')).not.toBeDisabled();
    });

    it('calls updatePost (not createPost) on submit', async () => {
      mockUpdatePost.mockResolvedValueOnce({ success: true });
      renderDrawer(samplePost);
      type('Modified content');
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      expect(mockUpdatePost).toHaveBeenCalledWith({
        postId: 'post-42',
        projectId: 'p1',
        customerId: 'c1',
        content: 'Modified content',
        workerId: '6',
        workerType: 'employee',
      });
      expect(mockCreatePost).not.toHaveBeenCalled();
      await waitFor(() => expect(onPosted).toHaveBeenCalled());
      expect(onClose).toHaveBeenCalled();
    });

    it('shows error on update failure and keeps drawer open', async () => {
      mockUpdatePost.mockResolvedValueOnce({
        success: false,
        errorMessage: 'Update failed',
      });
      renderDrawer(samplePost);
      type('Modified content');
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      await waitFor(() =>
        expect(screen.getByTestId('post-composer-error')).toHaveTextContent(
          'timeProject.posts.composer.error',
        ),
      );
      expect(onClose).not.toHaveBeenCalled();
    });

    it('enables Save when a new attachment is added without text change', () => {
      renderDrawer(postWithAttachment);
      emitAttachments([postWithAttachment.attachments[0], newUpload]);
      expect(screen.getByTestId('post-composer-post-btn')).not.toBeDisabled();
    });

    it('creates attachments without updating the post when only attachments change', async () => {
      mockCreateAttachments.mockResolvedValueOnce({ success: true });
      renderDrawer(postWithAttachment);
      emitAttachments([postWithAttachment.attachments[0], newUpload]);
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      await waitFor(() =>
        expect(mockCreateAttachments).toHaveBeenCalledWith({
          postId: 'post-42',
          attachments: [{ documentId: 'doc-9', name: 'x.png' }],
        }),
      );
      expect(mockUpdatePost).not.toHaveBeenCalled();
    });

    it('deletes a removed attachment immediately and enables Save', () => {
      renderDrawer(postWithAttachment);
      emitAttachments([]); // removed the only existing attachment

      expect(mockDeleteAttachments).toHaveBeenCalledWith({
        postId: 'post-42',
        attachmentIds: ['att-1'],
      });
      // Removal enables Save so the user can close/confirm the edit.
      expect(screen.getByTestId('post-composer-post-btn')).not.toBeDisabled();
    });

    it('does not re-call delete for an already-removed attachment', () => {
      renderDrawer(postWithAttachment);
      emitAttachments([]);
      expect(mockDeleteAttachments).toHaveBeenCalledTimes(1);
      // Emitting the same (already-removed) state again should not re-delete.
      emitAttachments([]);
      expect(mockDeleteAttachments).toHaveBeenCalledTimes(1);
    });

    it('opens the delete confirmation when saving an empty post (all attachments removed)', () => {
      const attachmentOnlyPost: Post = {
        ...basePost,
        content: '',
        attachments: [{ id: 'att-1', documentId: 'doc-1', fileName: 'a.png' }],
      };
      renderDrawer(attachmentOnlyPost);
      // Remove the only attachment → post is now empty.
      emitAttachments([]);
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      // Should dispatch openDeleteConfirm and close the drawer.
      expect(store.getState().postsUi.deleteTargetPost).toEqual(
        attachmentOnlyPost,
      );
      expect(onClose).toHaveBeenCalled();
      expect(mockUpdatePost).not.toHaveBeenCalled();
    });

    it('opens the delete confirmation when all content is cleared in edit mode', () => {
      renderDrawer(samplePost);
      type(''); // clear all content
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));

      expect(store.getState().postsUi.deleteTargetPost).toEqual(samplePost);
      expect(onClose).toHaveBeenCalled();
      expect(mockUpdatePost).not.toHaveBeenCalled();
    });

    it('enables Save when an existing attachment is removed (content still present)', () => {
      const postWithContent: Post = {
        ...basePost,
        content: 'Some text',
        attachments: [{ id: 'att-1', documentId: 'doc-1', fileName: 'a.png' }],
      };
      renderDrawer(postWithContent);
      emitAttachments([]); // remove the attachment
      // Save should be enabled because an attachment was removed.
      expect(screen.getByTestId('post-composer-post-btn')).not.toBeDisabled();
      // Clicking Save should close (no delete since content exists).
      fireEvent.click(screen.getByTestId('post-composer-post-btn'));
      expect(store.getState().postsUi.deleteTargetPost).toBeNull();
    });
  });
});
