import { OigqlProjectUrn, WorkflowGlobalId, QboLocalId } from '../types';

/**
 * Escapes single quotes in a value before interpolating it into a
 * Workflow API filter string (e.g. `status='…'`, `id='…'`).  All
 * values in filter strings are server-origin (API IDs, a fixed status
 * map) so real injection risk is near-zero, but a malformed upstream
 * value containing a bare `'` would break the filter syntax without
 * this guard.
 */
export const escapeFilterValue = (value: string): string =>
  value.replace(/'/g, "\\'");

/**
 * Extracts the Workflow API global entity ID from an OIGQL
 * `DataAccess_Project.projectId` path-style URN.
 *
 * OIGQL returns URNs in the form:
 *   `/work/Project; djQuMTo5...:767655383`
 * The segment after the semicolon IS the Workflow API global `id`
 * (e.g. `djQuMTo5...:767655383`), suitable for use in
 * `id in ('djQuMTo5...:767655383')` Workflow API filter strings.
 */
export const extractWorkflowIdFromUrn = (
  urn: OigqlProjectUrn | string | null | undefined,
): WorkflowGlobalId => {
  if (!urn) return '' as WorkflowGlobalId;
  const semiIdx = urn.indexOf(';');
  if (semiIdx === -1) return urn.trim() as WorkflowGlobalId;
  return urn.slice(semiIdx + 1).trim() as WorkflowGlobalId;
};

// Converts a Workflow API global client ID (e.g. `djQuMTo5...:12345678`)
// to the numeric QBO local ID that OIGQL's `dataAccessContacts` expects
// as `parentId`. This mirrors `util.GlobalId.convertToLocalId` from
// `ui-data-layer` (used in projects-plugin's WorkflowDataTransformer):
// the global ID format is `<base64encodedContext>:<localId>`, so the local
// ID is the segment after the FIRST (and only) colon.
//
// Why "first colon" equals "only colon": the base64 context prefix encodes
// a colon-separated internal string (e.g. `v4.1:9:0.1:<realm>:<hash>`), but
// standard base64 uses only A–Z / a–z / 0–9 / + / /, none of which are `:`.
// The base64-ENCODED output is therefore colon-free, and the assembled
// global ID contains exactly one colon — the `<base64>:<localId>` separator.
//
// `client.externalIds` is NOT populated by the Workflow API so decoding
// the global ID is the only reliable source.
export const extractQboLocalId = (
  globalClientId?: string | null,
): QboLocalId => {
  if (!globalClientId) return '' as QboLocalId;
  // Base64 encoding never produces colons, so a single colon here separates
  // the base64-encoded context from the localId (see block comment above).
  const colonIdx = globalClientId.indexOf(':');
  if (colonIdx === -1) return globalClientId as QboLocalId; // already a local ID
  let localId = globalClientId.slice(colonIdx + 1);
  // Some IDs carry a type prefix separated by `_` (e.g. `Customer_12345`).
  const underscoreIdx = localId.indexOf('_');
  if (underscoreIdx !== -1) {
    localId = localId.slice(underscoreIdx + 1);
  }
  return localId as QboLocalId;
};
