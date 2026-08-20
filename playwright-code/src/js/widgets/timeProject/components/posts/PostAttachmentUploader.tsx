import React, { useCallback, useRef, useState } from 'react';
import HOCWidget from 'web-shell-core/widgets/HOCWidget';
import Button from '@ids-ts/button';
import PageMessage from '@ids-ts/page-message';
import { B3 } from '@ids-ts/typography';
import { Activity } from '@ids-ts/loader';
import { Attach } from '@design-systems/icons';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { getAppSecret } from 'src/js/service/ApolloClientBuilderUtils';
import { usePostsTrackingPoints } from '../../hooks/usePostsTrackingPoints';
import { PostAttachment } from '../../types/posts';
import {
  DOCUMENT_TYPE,
  RESOURCE_ID,
  TTL_DURATION,
  OFFERING_ID,
  FILE_TYPE,
} from './postAttachmentConstants';
import {
  AttachRow,
  AttachLabel,
  AttachHint,
} from './PostComposerDrawer.styled';
import {
  UploaderContainer,
  UploaderError,
  StyledListContainer,
} from './PostsFeed.styled';

// API the upload-documents widget exposes via setPublicApi.
type BoundAPIFunc = (methodName: string, params: any) => Promise<any>;

// The smartdocs upload widget builds its allowed-types regex as
// `^.*.(${accept.join('|')})$` tested against the file NAME, so each entry
// must be a bare extension (no leading dot, no MIME type).
const ACCEPTED_EXTENSIONS = [
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
];
// For the native <input accept> we use dotted extensions + MIME types.
const NATIVE_ACCEPT = [
  '.pdf,.jpg,.jpeg,.png,.ppt,.pptx,.xlsx,.xls,.docx,.doc',
  'application/pdf,image/jpeg,image/png',
  'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
].join(',');

// Max attachments allowed per post (mirrors the attach-hint copy).
const MAX_ATTACHMENTS = 8;

// Event types emitted by the smartdocs upload-documents / list-documents
// widgets via their `onEvent` callbacks.
const SMARTDOCS_EVENT = {
  UPLOADS_FINISHED: 'EVENT_UPLOADS_FINISHED',
  FOLDER_LOAD_SUCCESS: 'FOLDER_LOAD_SUCCESS',
  DELETE_ITEMS_SUCCESS: 'DELETE_ITEMS_SUCCESS',
} as const;

// Per-document upload statuses on an EVENT_UPLOADS_FINISHED payload.
const UPLOAD_STATUS = {
  SUCCESS: 'UPLOAD_SUCCESS',
  FAILURE: 'UPLOAD_FAILURE',
} as const;

interface PostAttachmentUploaderProps {
  /** Current uploaded attachments (controlled by the composer). */
  attachments: PostAttachment[];
  /** Fired whenever the uploaded-attachment list changes. */
  onChange: (attachments: PostAttachment[]) => void;
  /**
   * documentIds that must never be re-added, even if the upload widget
   * re-emits (or reports cumulatively) an EVENT_UPLOADS_FINISHED success for
   * one of them — e.g. after the user deleted a freshly-uploaded file and
   * then uploaded another one in the same session.
   */
  excludedDocumentIds?: string[];
  /** Project id (entityId) — tagged onto the uploaded document for RBAC. */
  projectId: string;
  /** Logged-in worker id — tagged onto the uploaded document for RBAC. */
  workerId: string;
  /** Worker type (EMPLOYEE | VENDOR | LEGACY_QBO_USER) for RBAC. */
  workerType: string;
  /** Disable interaction (e.g. while the post is saving). */
  disabled?: boolean;
}

// EVENT_UPLOADS_FINISHED helpers — mirror the import-agent contract.
const isUploadEvent = (evt: any) =>
  evt?.type === SMARTDOCS_EVENT.UPLOADS_FINISHED;
const getEventDocs = (evt: any): any[] => {
  const data = evt?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
};

/**
 * Post-attachment uploader. The smartdocs `upload-documents` widget is
 * API-only (no UI of its own), so it's mounted hidden and driven via its
 * public API: the visible "Add attachment" button opens a native file
 * picker, the chosen files are pushed to the widget (`uploadFiles`), and on
 * success the uploaded documents render in a `list-documents` widget below.
 * Captured `documentId`s flow up via `onChange`.
 */
const PostAttachmentUploader: React.FC<PostAttachmentUploaderProps> = ({
  attachments,
  onChange,
  excludedDocumentIds = [],
  projectId,
  workerId,
  workerType,
  disabled = false,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const trackingPoints = usePostsTrackingPoints();
  const text = useCallback((id: string) => intl.formatMessage({ id }), [intl]);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const widgetApiRef = useRef<BoundAPIFunc | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const companyRealmId = sandbox.appContext?.getRealmInfo()?.realmId || '';

  const serviceOnboardConfig = {
    intuitApiKey: getAppSecret(sandbox),
    offeringId: OFFERING_ID,
    assetId: '8506191389517858617',
    is7216: false,
  };

  const customHeaders = { Accept: 'application/json;version=2.0.0' };

  // Document metadata for the smartdocs upload. `postId` is intentionally
  // omitted — the post doesn't exist at upload time; the composer links the
  // uploaded documents to the post afterwards via timeTrackingCreateAttachments.
  const documentCommonAttributes = {
    documentType: DOCUMENT_TYPE,
    is7216: 'false',
    companyRealmId,
    ttlDuration: TTL_DURATION,
    offeringAttributes: [
      {
        offeringId: OFFERING_ID,
        nameValues: [{ name: 'fileType', value: FILE_TYPE }],
      },
    ],
  };

  const authorizationAttributes = {
    resourceId: RESOURCE_ID,
    resourceAttributes: [
      { name: 'projectId', value: projectId },
      { name: 'workerId', value: workerId },
      { name: 'workerType', value: workerType },
    ],
  };

  // configProps for the list-documents widget (API_KEY / OFFERING_ID / is7216).
  const listConfigProps = {
    API_KEY: getAppSecret(sandbox),
    OFFERING_ID,
    is7216: false,
  };

  const setPublicApi = useCallback((boundApi: BoundAPIFunc) => {
    widgetApiRef.current = boundApi;
  }, []);

  const handleUploadEvents = useCallback(
    (event: any) => {
      if (!isUploadEvent(event)) return;
      // Upload is finished (success or failure) — stop the spinner.
      setUploading(false);
      const docs = getEventDocs(event);

      const failed = docs.some((d: any) => d.status === UPLOAD_STATUS.FAILURE);
      if (failed) {
        const failedDoc = docs.find(
          (d: any) => d.status === UPLOAD_STATUS.FAILURE,
        );
        setUploadError(
          failedDoc?.error?.message ||
            failedDoc?.error ||
            text('timeProject.posts.composer.uploadError'),
        );
        return;
      }

      const uploaded: PostAttachment[] = docs
        .filter((d: any) => d.status === UPLOAD_STATUS.SUCCESS)
        .map((d: any) => ({
          id: d.systemAttributes?.id,
          documentId: d.systemAttributes?.id,
          fileName:
            d.commonAttributes?.name ||
            d.fileName ||
            d.name ||
            d.systemAttributes?.fileName,
        }))
        .filter((a: PostAttachment) => a.id);

      if (uploaded.length === 0) return;

      setUploadError(null);
      // De-dupe by documentId so re-emitted events don't double-add, and
      // permanently ignore documents the user already deleted this session
      // — the upload widget can re-report a prior success (e.g. alongside a
      // later batch), which would otherwise silently resurrect a deleted
      // attachment right before save.
      const excluded = new Set(excludedDocumentIds);
      const existing = new Set(attachments.map((a) => a.id));
      const merged = [
        ...attachments,
        ...uploaded.filter((a) => !existing.has(a.id) && !excluded.has(a.id)),
      ];
      onChange(merged);
    },
    [attachments, excludedDocumentIds, onChange, text],
  );

  const handleWidgetError = useCallback(() => {
    setUploading(false);
    setUploadError(text('timeProject.posts.composer.uploadError'));
  }, [text]);

  // "Add attachment" → open the native file picker (the widget has no UI).
  const handleAddClick = useCallback(() => {
    track(trackingPoints.ADD_ATTACHMENT);
    fileInputRef.current?.click();
  }, [track, trackingPoints]);

  const handleFilesSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      // Reset so selecting the same file again re-triggers change.
      e.target.value = '';
      if (!files.length || !widgetApiRef.current) return;

      const remaining = MAX_ATTACHMENTS - attachments.length;
      if (remaining <= 0) return;

      // Reject the entire selection if it exceeds available slots — don't
      // silently drop arbitrary files from the batch.
      if (files.length > remaining) {
        setUploadError(text('timeProject.posts.composer.attachLimitError'));
        return;
      }

      setUploadError(null);
      setUploading(true);
      widgetApiRef.current('uploadFiles', files);
    },
    [attachments.length, text],
  );

  // Sync events from the list-documents widget back into state.
  const handleListViewEvent = useCallback(
    (event: any) => {
      if (event?.type === SMARTDOCS_EVENT.FOLDER_LOAD_SUCCESS) {
        return;
      }
      if (event?.type !== SMARTDOCS_EVENT.DELETE_ITEMS_SUCCESS) return;
      track(trackingPoints.DELETE_ATTACHMENT);
      let deleted: any[] = [];
      if (Array.isArray(event.data)) {
        deleted = event.data;
      } else if (event.data) {
        deleted = [event.data];
      }
      // The list widget identifies docs by their IDX documentId. Match on
      // documentId (with id as a fallback for freshly-uploaded items where
      // id === documentId) so existing attachments are correctly removed and
      // their post-attachment id can be sent to the delete mutation.
      const deletedIds = new Set(
        deleted.map((d: any) => d.systemAttributes?.id || d.id),
      );
      onChange(
        attachments.filter(
          (a) =>
            !(a.documentId && deletedIds.has(a.documentId)) &&
            !deletedIds.has(a.id),
        ),
      );
    },
    [attachments, onChange, track, trackingPoints],
  );

  const documentIds = attachments
    .map((a) => a.documentId)
    .filter((id): id is string => !!id);

  const atMaxAttachments = attachments.length >= MAX_ATTACHMENTS;

  return (
    <UploaderContainer data-testid="post-attachment-uploader">
      {/* API-only upload widget — mounted only once auth attributes are
          available so it never initialises with empty workerId/workerType. */}
      {workerId && workerType && (
        <div style={{ display: 'none' }}>
          <HOCWidget
            widgetId="smartdocs-web-platform/upload-documents"
            sandbox={sandbox}
            serviceOnboardConfig={serviceOnboardConfig}
            documentCommonAttributes={documentCommonAttributes}
            authorizationAttributes={authorizationAttributes}
            hideHeader
            hideFooter
            hideOnUploadSuccess={false}
            customHeaders={customHeaders}
            autoCreateFolder
            onEvent={handleUploadEvents}
            onError={handleWidgetError}
            setPublicApi={setPublicApi}
            syncExtraction={false}
            extractionNotRequired
            maxFileSizeLimit={10}
            hideContainer
            renderProgressList={false}
            accept={ACCEPTED_EXTENSIONS}
          />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={NATIVE_ACCEPT}
        style={{ display: 'none' }}
        onChange={handleFilesSelected}
        data-testid="post-attachment-file-input"
      />

      <AttachRow>
        <Button
          priority="secondary"
          purpose="standard"
          size="medium"
          onClick={handleAddClick}
          disabled={disabled || uploading || atMaxAttachments}
          data-testid="post-composer-attach-btn"
        >
          <AttachLabel>
            {uploading ? (
              <Activity
                shape="dots"
                size="small"
                aria-label={text('timeProject.posts.composer.uploading')}
              />
            ) : (
              <Attach aria-hidden="true" />
            )}
            {text('timeProject.posts.composer.attach')}
          </AttachLabel>
        </Button>
        <AttachHint data-testid="post-composer-attach-hint">
          <B3>{text('timeProject.posts.composer.attachHint')}</B3>
        </AttachHint>
      </AttachRow>

      {uploadError && (
        <UploaderError>
          <PageMessage
            type="error"
            title={uploadError}
            dismissible
            onClose={() => setUploadError(null)}
            open
            data-testid="post-attachment-error"
          />
        </UploaderError>
      )}

      {attachments.length > 0 && (
        <StyledListContainer>
          <HOCWidget
            widgetId="smartdocs-web-platform/list-documents"
            sandbox={sandbox}
            configProps={listConfigProps}
            columns={['document', 'actions']}
            fileActions={[{ id: 'download' }, { id: 'delete' }]}
            offeringFilters={{ documentIds }}
            enableDocPreview={false}
            enableZeroState={false}
            pageSize={10}
            onEvent={handleListViewEvent}
            data-testid="post-attached-files"
            authorizationAttributes={authorizationAttributes}
          />
        </StyledListContainer>
      )}
    </UploaderContainer>
  );
};

export default PostAttachmentUploader;
