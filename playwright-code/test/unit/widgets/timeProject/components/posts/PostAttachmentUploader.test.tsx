import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PostAttachmentUploader from 'src/js/widgets/timeProject/components/posts/PostAttachmentUploader';
import { PostAttachment } from 'src/js/widgets/timeProject/types/posts';

const UPLOAD_WIDGET = 'smartdocs-web-platform/upload-documents';
const LIST_WIDGET = 'smartdocs-web-platform/list-documents';

// Capture each HOCWidget's props by widgetId so tests can drive onEvent /
// onError / setPublicApi for both the upload and list widgets.
let widgetPropsById: Record<string, any> = {};
jest.mock('web-shell-core/widgets/HOCWidget', () => (props: any) => {
  widgetPropsById[props.widgetId] = props;
  return <div data-testid={`hoc-${props.widgetId}`} />;
});

const mockTrack = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useSandbox: () => ({
    appContext: { getRealmInfo: () => ({ realmId: 'realm-123' }) },
  }),
  useTracking: () => mockTrack,
}));

jest.mock('src/js/widgets/timeProject/hooks/usePostsTrackingPoints', () => {
  const { POSTS_TRACKING_POINTS } = jest.requireActual(
    'src/js/widgets/timeProject/utils/timeProjectTrackingPoints',
  );
  return { usePostsTrackingPoints: () => POSTS_TRACKING_POINTS };
});

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  getAppSecret: () => 'test-secret',
}));

jest.mock('@design-systems/icons', () => ({
  Attach: () => <span data-testid="attach-icon">attach</span>,
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: ({ 'aria-label': ariaLabel }: any) => (
    <span data-testid="activity">{ariaLabel}</span>
  ),
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
  default: ({ title, onClose, 'data-testid': testId }: any) => (
    <div data-testid={testId}>
      <span>{title}</span>
      <button type="button" data-testid="page-message-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  B3: ({ children }: any) => <span>{children}</span>,
}));

const uploadProps = () => widgetPropsById[UPLOAD_WIDGET];
const listProps = () => widgetPropsById[LIST_WIDGET];

const uploadSuccessEvent = (docs: { id?: string; fileName?: string }[]) => ({
  type: 'EVENT_UPLOADS_FINISHED',
  data: docs.map((d) => ({
    status: 'UPLOAD_SUCCESS',
    fileName: d.fileName,
    systemAttributes: d.id ? { id: d.id } : undefined,
  })),
});

const renderUploader = (
  props: Partial<React.ComponentProps<typeof PostAttachmentUploader>> = {},
) => {
  const onChange = props.onChange ?? jest.fn();
  const utils = render(
    <PostAttachmentUploader
      attachments={props.attachments ?? []}
      onChange={onChange}
      excludedDocumentIds={props.excludedDocumentIds}
      projectId={props.projectId ?? 'proj-1'}
      workerId={props.workerId ?? '6'}
      workerType={props.workerType ?? 'EMPLOYEE'}
      disabled={props.disabled}
    />,
  );
  return { ...utils, onChange };
};

const makeFile = (name: string) => new File(['x'], name, { type: 'image/png' });

describe('PostAttachmentUploader', () => {
  beforeEach(() => {
    widgetPropsById = {};
  });

  describe('rendering', () => {
    it('renders the container, attach button and hint', () => {
      renderUploader();
      expect(
        screen.getByTestId('post-attachment-uploader'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('post-composer-attach-btn'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('post-composer-attach-hint'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('attach-icon')).toBeInTheDocument();
    });

    it('mounts the upload widget with document attributes (no postId at upload)', () => {
      renderUploader();
      expect(screen.getByTestId(`hoc-${UPLOAD_WIDGET}`)).toBeInTheDocument();
      expect(uploadProps().documentCommonAttributes).toMatchObject({
        documentType: 'payroll::timesheet',
        is7216: 'false',
        companyRealmId: 'realm-123',
        ttlDuration: '2560d',
      });
      expect(
        uploadProps().documentCommonAttributes.offeringAttributes[0].offeringId,
      ).toBe('Intuit.work.timecapture.timetrackingui');
      expect(uploadProps().serviceOnboardConfig.intuitApiKey).toBe(
        'test-secret',
      );
      // The upload widget validates by building a regex from the accept
      // list tested against the file NAME, so entries must be bare
      // extensions (no leading dot, no MIME type).
      expect(uploadProps().accept).toEqual([
        'pdf',
        'jpg',
        'jpeg',
        'png',
        'ppt',
        'pptx',
        'xlsx',
        'xls',
        'docx',
        'doc',
      ]);
    });

    it('mounts the list widget with documentIds from current attachments', () => {
      renderUploader({
        attachments: [
          { id: 'doc-1', documentId: 'doc-1', fileName: 'a.png' },
          { id: 'doc-2', documentId: 'doc-2', fileName: 'b.png' },
          // no documentId -> excluded from offering filter
          { id: 'doc-3', fileName: 'c.png' } as PostAttachment,
        ],
      });
      expect(screen.getByTestId(`hoc-${LIST_WIDGET}`)).toBeInTheDocument();
      expect(listProps().offeringFilters.documentIds).toEqual([
        'doc-1',
        'doc-2',
      ]);
    });

    it('does not mount the upload widget until worker attributes are present', () => {
      renderUploader({
        workerType: '',
        attachments: [{ id: 'doc-1', documentId: 'doc-1', fileName: 'a.png' }],
      });
      expect(
        screen.queryByTestId(`hoc-${UPLOAD_WIDGET}`),
      ).not.toBeInTheDocument();
      // list widget's visibility is gated by having attachments, not by
      // worker presence, so it still renders here.
      expect(screen.getByTestId(`hoc-${LIST_WIDGET}`)).toBeInTheDocument();
    });

    it('does not mount the list widget when there are no attachments', () => {
      renderUploader({ attachments: [] });
      expect(
        screen.queryByTestId(`hoc-${LIST_WIDGET}`),
      ).not.toBeInTheDocument();
    });

    it('disables the attach button when disabled prop is set', () => {
      renderUploader({ disabled: true });
      expect(screen.getByTestId('post-composer-attach-btn')).toBeDisabled();
    });

    it('disables the attach button at the attachment limit', () => {
      const attachments: PostAttachment[] = Array.from(
        { length: 8 },
        (_, i) => ({
          id: `doc-${i}`,
          documentId: `doc-${i}`,
          fileName: `f-${i}.png`,
        }),
      );
      renderUploader({ attachments });
      expect(screen.getByTestId('post-composer-attach-btn')).toBeDisabled();
    });
  });

  describe('upload events', () => {
    it('captures uploaded documentIds on UPLOAD_SUCCESS', () => {
      const { onChange } = renderUploader();
      act(() => {
        uploadProps().onEvent(
          uploadSuccessEvent([{ id: 'doc-1', fileName: 'photo1.jpg' }]),
        );
      });
      expect(onChange).toHaveBeenCalledWith([
        { id: 'doc-1', documentId: 'doc-1', fileName: 'photo1.jpg' },
      ]);
    });

    it('de-dupes already-captured documents and appends new ones', () => {
      const { onChange } = renderUploader({
        attachments: [
          { id: 'doc-1', documentId: 'doc-1', fileName: 'photo1.jpg' },
        ],
      });
      act(() => {
        uploadProps().onEvent(
          uploadSuccessEvent([
            { id: 'doc-1', fileName: 'photo1.jpg' },
            { id: 'doc-2', fileName: 'photo2.png' },
          ]),
        );
      });
      expect(onChange).toHaveBeenCalledWith([
        { id: 'doc-1', documentId: 'doc-1', fileName: 'photo1.jpg' },
        { id: 'doc-2', documentId: 'doc-2', fileName: 'photo2.png' },
      ]);
    });

    it('handles a single-object (non-array) success payload', () => {
      const { onChange } = renderUploader();
      act(() => {
        uploadProps().onEvent({
          type: 'EVENT_UPLOADS_FINISHED',
          data: {
            status: 'UPLOAD_SUCCESS',
            fileName: 'solo.png',
            systemAttributes: { id: 'doc-solo' },
          },
        });
      });
      expect(onChange).toHaveBeenCalledWith([
        { id: 'doc-solo', documentId: 'doc-solo', fileName: 'solo.png' },
      ]);
    });

    it('ignores a re-emitted success for a documentId already excluded (deleted this session)', () => {
      // Simulates: upload doc-1, delete it, then a later batch's finished
      // event still reports doc-1 as UPLOAD_SUCCESS alongside the new doc-2.
      const { onChange } = renderUploader({
        attachments: [],
        excludedDocumentIds: ['doc-1'],
      });
      act(() => {
        uploadProps().onEvent(
          uploadSuccessEvent([
            { id: 'doc-1', fileName: 'deleted.png' },
            { id: 'doc-2', fileName: 'new.png' },
          ]),
        );
      });
      expect(onChange).toHaveBeenCalledWith([
        { id: 'doc-2', documentId: 'doc-2', fileName: 'new.png' },
      ]);
    });

    it('handles an upload event with no documents', () => {
      const { onChange } = renderUploader();
      act(() => {
        uploadProps().onEvent({ type: 'EVENT_UPLOADS_FINISHED' });
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('derives the file name from commonAttributes when fileName is absent', () => {
      const { onChange } = renderUploader();
      act(() => {
        uploadProps().onEvent({
          type: 'EVENT_UPLOADS_FINISHED',
          data: [
            {
              status: 'UPLOAD_SUCCESS',
              commonAttributes: { name: 'from-common.png' },
              systemAttributes: { id: 'doc-x' },
            },
          ],
        });
      });
      expect(onChange).toHaveBeenCalledWith([
        { id: 'doc-x', documentId: 'doc-x', fileName: 'from-common.png' },
      ]);
    });

    it('derives the file name from the d.name fallback', () => {
      const { onChange } = renderUploader();
      act(() => {
        uploadProps().onEvent({
          type: 'EVENT_UPLOADS_FINISHED',
          data: [
            {
              status: 'UPLOAD_SUCCESS',
              name: 'from-name.png',
              systemAttributes: { id: 'doc-y' },
            },
          ],
        });
      });
      expect(onChange).toHaveBeenCalledWith([
        { id: 'doc-y', documentId: 'doc-y', fileName: 'from-name.png' },
      ]);
    });

    it('derives the file name from systemAttributes.fileName fallback', () => {
      const { onChange } = renderUploader();
      act(() => {
        uploadProps().onEvent({
          type: 'EVENT_UPLOADS_FINISHED',
          data: [
            {
              status: 'UPLOAD_SUCCESS',
              systemAttributes: { id: 'doc-z', fileName: 'from-sys.png' },
            },
          ],
        });
      });
      expect(onChange).toHaveBeenCalledWith([
        { id: 'doc-z', documentId: 'doc-z', fileName: 'from-sys.png' },
      ]);
    });

    it('uses a string error message on failure', () => {
      renderUploader();
      act(() => {
        uploadProps().onEvent({
          type: 'EVENT_UPLOADS_FINISHED',
          data: [{ status: 'UPLOAD_FAILURE', error: 'plain string error' }],
        });
      });
      expect(screen.getByTestId('post-attachment-error')).toHaveTextContent(
        'plain string error',
      );
    });

    it('ignores non-upload events', () => {
      const { onChange } = renderUploader();
      act(() => {
        uploadProps().onEvent({ type: 'SOMETHING_ELSE' });
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when no successful doc has an id', () => {
      const { onChange } = renderUploader();
      act(() => {
        uploadProps().onEvent(uploadSuccessEvent([{ fileName: 'no-id.png' }]));
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('shows the failure message on UPLOAD_FAILURE and does not capture', () => {
      const { onChange } = renderUploader();
      act(() => {
        uploadProps().onEvent({
          type: 'EVENT_UPLOADS_FINISHED',
          data: [{ status: 'UPLOAD_FAILURE', error: { message: 'too big' } }],
        });
      });
      expect(screen.getByTestId('post-attachment-error')).toHaveTextContent(
        'too big',
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('falls back to a generic message when failure has no error detail', () => {
      renderUploader();
      act(() => {
        uploadProps().onEvent({
          type: 'EVENT_UPLOADS_FINISHED',
          data: [{ status: 'UPLOAD_FAILURE' }],
        });
      });
      expect(screen.getByTestId('post-attachment-error')).toHaveTextContent(
        'timeProject.posts.composer.uploadError',
      );
    });

    it('shows a generic error when the widget itself errors', () => {
      renderUploader();
      act(() => {
        uploadProps().onError();
      });
      expect(screen.getByTestId('post-attachment-error')).toHaveTextContent(
        'timeProject.posts.composer.uploadError',
      );
    });

    it('dismisses the error message via the page-message close', () => {
      renderUploader();
      act(() => {
        uploadProps().onError();
      });
      expect(screen.getByTestId('post-attachment-error')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('page-message-close'));
      expect(
        screen.queryByTestId('post-attachment-error'),
      ).not.toBeInTheDocument();
    });
  });

  describe('file selection', () => {
    const setApi = (api: jest.Mock) => {
      act(() => {
        uploadProps().setPublicApi(api);
      });
    };

    it('opens the file picker when the attach button is clicked', () => {
      const clickSpy = jest.spyOn(HTMLInputElement.prototype, 'click');
      renderUploader();
      fireEvent.click(screen.getByTestId('post-composer-attach-btn'));
      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('pushes selected files to the widget and shows the uploading spinner', () => {
      const api = jest.fn();
      renderUploader();
      setApi(api);
      const input = screen.getByTestId('post-attachment-file-input');
      const file = makeFile('a.png');
      fireEvent.change(input, { target: { files: [file] } });
      expect(api).toHaveBeenCalledWith('uploadFiles', [file]);
      expect(screen.getByTestId('activity')).toHaveTextContent(
        'timeProject.posts.composer.uploading',
      );
    });

    it('rejects the entire selection when it exceeds remaining slots', () => {
      const api = jest.fn();
      const attachments: PostAttachment[] = Array.from(
        { length: 6 },
        (_, i) => ({
          id: `doc-${i}`,
          documentId: `doc-${i}`,
          fileName: `f-${i}.png`,
        }),
      );
      renderUploader({ attachments });
      setApi(api);
      const input = screen.getByTestId('post-attachment-file-input');
      const files = [makeFile('a.png'), makeFile('b.png'), makeFile('c.png')];
      fireEvent.change(input, { target: { files } });
      // remaining = 8 - 6 = 2, but 3 files selected → reject all
      expect(api).not.toHaveBeenCalled();
      expect(screen.getByTestId('post-attachment-error')).toHaveTextContent(
        'timeProject.posts.composer.attachLimitError',
      );
    });

    it('does nothing when no files are selected', () => {
      const api = jest.fn();
      renderUploader();
      setApi(api);
      const input = screen.getByTestId('post-attachment-file-input');
      fireEvent.change(input, { target: { files: [] } });
      expect(api).not.toHaveBeenCalled();
    });

    it('does nothing when the file input has no files property', () => {
      const api = jest.fn();
      renderUploader();
      setApi(api);
      const input = screen.getByTestId('post-attachment-file-input');
      fireEvent.change(input, { target: { files: null } });
      expect(api).not.toHaveBeenCalled();
    });

    it('does nothing when the widget api is not ready', () => {
      const { onChange } = renderUploader();
      // no setPublicApi called -> widgetApiRef is null
      const input = screen.getByTestId('post-attachment-file-input');
      fireEvent.change(input, { target: { files: [makeFile('a.png')] } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does nothing when already at the attachment limit', () => {
      const api = jest.fn();
      const attachments: PostAttachment[] = Array.from(
        { length: 8 },
        (_, i) => ({
          id: `doc-${i}`,
          documentId: `doc-${i}`,
          fileName: `f-${i}.png`,
        }),
      );
      renderUploader({ attachments });
      setApi(api);
      const input = screen.getByTestId('post-attachment-file-input');
      fireEvent.change(input, { target: { files: [makeFile('a.png')] } });
      expect(api).not.toHaveBeenCalled();
    });
  });

  describe('list (delete) events', () => {
    it('removes an attachment matched by documentId on DELETE_ITEMS_SUCCESS', () => {
      const { onChange } = renderUploader({
        attachments: [
          { id: 'att-1', documentId: 'doc-1', fileName: 'a.png' },
          { id: 'att-2', documentId: 'doc-2', fileName: 'b.png' },
        ],
      });
      act(() => {
        listProps().onEvent({
          type: 'DELETE_ITEMS_SUCCESS',
          data: [{ systemAttributes: { id: 'doc-1' } }],
        });
      });
      expect(onChange).toHaveBeenCalledWith([
        { id: 'att-2', documentId: 'doc-2', fileName: 'b.png' },
      ]);
    });

    it('removes an attachment matched by id (single object payload)', () => {
      const { onChange } = renderUploader({
        attachments: [{ id: 'doc-1', documentId: 'doc-1', fileName: 'a.png' }],
      });
      act(() => {
        listProps().onEvent({
          type: 'DELETE_ITEMS_SUCCESS',
          data: { id: 'doc-1' },
        });
      });
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('ignores FOLDER_LOAD_SUCCESS events', () => {
      const { onChange } = renderUploader({
        attachments: [{ id: 'doc-1', documentId: 'doc-1', fileName: 'a.png' }],
      });
      act(() => {
        listProps().onEvent({ type: 'FOLDER_LOAD_SUCCESS' });
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores unrelated list events', () => {
      const { onChange } = renderUploader({
        attachments: [{ id: 'doc-1', documentId: 'doc-1', fileName: 'a.png' }],
      });
      act(() => {
        listProps().onEvent({ type: 'SOME_OTHER_EVENT' });
      });
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
