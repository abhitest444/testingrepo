import { TimeProjectRow, TimeProjectStatus, WorkProjectEdge } from '../types';
import { extractQboLocalId } from './projectIdUtils';

interface MapperOptions {
  // When true (QBOA) the Workflow API `Open` status maps to `TODO`.
  // When false (QBO) it maps to `NOT_STARTED` so the row badge matches the
  // "Not started" label shown in the QBO filter dropdown.
  // Omitting this option (OIGQL path) keeps the historic `TODO` default.
  isAccountant?: boolean;
  // Called instead of console.warn when an unrecognised status string is
  // encountered. Allows the call site to route the warning through the
  // project's structured logger (Splunk) rather than silently dropping it
  // in production. Falls back to console.warn when omitted.
  onUnknownStatus?: (status: string) => void;
}

export const mapStatusToProjectStatus = (
  status: string,
  options?: MapperOptions,
): TimeProjectStatus => {
  // OIGQL (`dataAccessWorkProjects`) returns human-readable strings.
  // Workflow API returns ProperCase enum key names that mirror
  // projects-plugin's `ProjectStatus` enum keys (e.g. `'Inprogress'`).
  // ALL_CAPS variants are kept as a safety net for any supergraph that
  // normalises the values server-side.
  //
  // Workflow API `Open` is the single "unstarted" state, but the filter
  // dropdown shows different labels for it depending on user type:
  //   QBOA → "To do"        → badge should show TODO
  //   QBO  → "Not started"  → badge should show NOT_STARTED
  // `options.isAccountant` carries this context from the call site.
  const openStatus: TimeProjectStatus =
    options?.isAccountant === false ? 'NOT_STARTED' : 'TODO';

  const statusMap: Record<string, TimeProjectStatus> = {
    // OIGQL human-readable values
    'In progress': 'IN_PROGRESS',
    Completed: 'COMPLETED',
    'Not started': 'NOT_STARTED',
    'To do': 'TODO',
    Canceled: 'CANCELLED',
    Cancelled: 'CANCELLED',
    // 'on_hold' is a legacy OIGQL status with no Workflow API equivalent.
    // ALL_PROJECT_STATUSES excludes it so OIGQL queries never request it,
    // but a project may transiently carry this status mid-flight.  Map it
    // to NOT_STARTED (closest semantically: paused, not yet in progress).
    on_hold: 'NOT_STARTED',
    // Workflow API ProperCase enum key names
    Inprogress: 'IN_PROGRESS',
    Complete: 'COMPLETED',
    Open: openStatus,
    Todo: 'TODO',
    // Workflow API returns 'Blocked' for QBA users only; QBO queries never
    // produce it, but handle it defensively to avoid a console.warn.
    Blocked: 'IN_PROGRESS',
    // ALL_CAPS safety-net (in case a supergraph normalises values server-side)
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETE: 'COMPLETED',
    OPEN: openStatus,
    TODO: 'TODO',
    CANCELLED: 'CANCELLED',
    BLOCKED: 'IN_PROGRESS',
  };
  const mapped = statusMap[status];
  if (!mapped) {
    if (options?.onUnknownStatus) {
      options.onUnknownStatus(status);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `[projectRowMapper] Unknown project status "${status}" — defaulting to NOT_STARTED. Update statusMap if the Workflow API has introduced a new status value.`,
      );
    }
    return 'NOT_STARTED';
  }
  return mapped;
};

export const mapResponseToRows = (
  edges: WorkProjectEdge[],
  options?: MapperOptions,
): TimeProjectRow[] =>
  edges.map((edge, index) => {
    const { node } = edge;
    // Workflow API returns global IDs (e.g. `djQuMTo5...:793400145`);
    // OIGQL returns bare numeric local IDs (e.g. `793400145`). Normalise
    // to the local ID in both cases so downstream lookups (estimatesMap
    // and contacts join) use a consistent key format. `extractQboLocalId`
    // is a no-op for IDs that contain no colon (already local).
    const localProjectId = extractQboLocalId(node.id) || node.id;
    return {
      rowIndex: index,
      uniqueId: localProjectId,
      projectId: localProjectId,
      projectName: node.name || '',
      // Customer ID resolution priority:
      //   1. node.customer?.id   — OIGQL with-customers query: inline customer block
      //   2. node.customerId     — OIGQL without-customers query: top-level field
      //   3. extractQboLocalId(node.client?.id)
      //        — Workflow API: client.id is a global ID (e.g. `djQuMTo5...:12345`)
      //          decoded to the numeric QBO local ID via the `<base64>:<localId>`
      //          colon-split.  This local ID is the same value OIGQL carries in
      //          `dataAccessContacts.parentId`, so the contacts round-trip resolves
      //          correctly on the Workflow path.
      //   4. '' — project has no customer (intentionally empty; contacts query
      //          skips it via the `.filter(id => !!id)` guard in fetching hook)
      //
      // Why TSheets-native / non-QBO projects are not a concern:
      //   Every Workflow API query includes `inServiceToType in ('CONTACT')`, which
      //   limits results to projects whose client is a QBO-realm CONTACT.
      //   TSheets-native projects (which link by an internal customer_id rather than
      //   a QBO realm id) are excluded by that filter at the API level and therefore
      //   never reach this mapper on the Workflow path.
      customerId:
        node.customer?.id ||
        node.customerId ||
        extractQboLocalId(node.client?.id) ||
        '',
      customerName: node.customer?.displayName || node.customer?.fullName || '',
      status: mapStatusToProjectStatus(node.status, options),
      deadline: node.dueDate || '',
      deadlineLabel: node.dueDate || '',
      budget: '',
      // Default to the `-1` "unestimated" sentinel so a row whose
      // estimate hasn't come back yet (or has no estimate at all)
      // renders as "—" / "Create estimate" — NOT as a real "0h"
      // estimate. Once `useProjectEstimates` resolves, the estimates
      // map override (`estimate?.budgetHoursTotal ?? row.budgetHoursTotal`)
      // replaces this fallback with the live value from the supergraph.
      budgetHoursTotal: -1,
      budgetHoursRemaining: -1,
      startDate: node.startDate || '',
      completedDate: node.completedDate || '',
      active: node.active ?? true,
      description: node.description || '',
      customer: node.customer
        ? {
            id: node.customer.id || '',
            companyId: node.customer.companyId || '',
            fullName: node.customer.fullName || '',
            firstName: node.customer.firstName || '',
            lastName: node.customer.lastName || '',
            displayName: node.customer.displayName || '',
          }
        : null,
    };
  });
