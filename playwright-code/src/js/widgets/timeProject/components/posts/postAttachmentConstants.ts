// Shared smartdocs / RBAC config for Project Post attachments. Both the
// uploader (PostAttachmentUploader) and the read-only thumbnail popover
// (PostAttachmentsThumbnails) target the same documents, so these MUST stay in
// sync — keeping them here is the single source of truth.

// Offering the documents belong to.
export const OFFERING_ID = 'Intuit.work.timecapture.timetrackingui';

// Asset id used by the list-documents widget config.
export const ASSET_ID = '8506191389517858617';

// Resource the post documents are authorized against. The thumbnail/list views
// must pass this same value the uploader used when the documents were created,
// or the authorization read fails.
export const RESOURCE_ID = 'irn:intuit:v1:timecapture:post';

// Document classification + lifecycle for uploads. Operations: Upload /
// Download / Soft-delete (TTL) / Thumbnails. No extraction, classification,
// content moderation, or 7216.
export const DOCUMENT_TYPE = 'payroll::timesheet';
export const TTL_DURATION = '2560d';
export const FILE_TYPE = 'ATTACHMENT';
