import { DueDateRange } from '../utils/dateFilterUtils';

export type { DueDateRange };

// ---------------------------------------------------------------------------
// Branded ID types
//
// Three non-interchangeable ID encodings flow through this widget.  Branding
// them makes swapping them a compile-time error at zero runtime cost.
//
// WorkflowGlobalId  — Workflow API global entity ID, e.g. `djQuMTo5...:767655383`
// OigqlProjectUrn   — OIGQL path-style URN, e.g. `/work/Project; djQu...:767655383`
// QboLocalId        — bare numeric QBO local ID, e.g. `767655383`
//
// Use `as WorkflowGlobalId` / `as OigqlProjectUrn` / `as QboLocalId` at API
// response boundaries where the provenance of the raw string is known.
// ---------------------------------------------------------------------------
type Brand<T, B> = T & { readonly __brand: B };
export type WorkflowGlobalId = Brand<string, 'WorkflowGlobalId'>;
export type OigqlProjectUrn = Brand<string, 'OigqlProjectUrn'>;
export type QboLocalId = Brand<string, 'QboLocalId'>;

export interface TimeProjectCustomer {
  id: string;
  companyId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export interface TimeProjectRow {
  rowIndex: number;
  uniqueId: string;
  projectId: string;
  projectName: string;
  customerId: string;
  customerName: string;
  status: TimeProjectStatus;
  deadline: string;
  deadlineLabel: string;
  budget: string;
  budgetHoursTotal: number;
  budgetHoursRemaining: number;
  startDate: string;
  completedDate: string;
  active: boolean;
  description: string;
  customer: TimeProjectCustomer | null;
}

export type TimeProjectStatus =
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NOT_STARTED'
  | 'TODO'
  | 'CANCELLED';

export type BadgeStatus =
  | 'info'
  | 'success'
  | 'pending'
  | 'warning'
  | 'error'
  | 'draft'
  | 'new'
  | 'beta';

export interface WorkProjectNode {
  id: string;
  name: string | null;
  status: string;
  customerId: string | null;
  dueDate: string | null;
  startDate: string | null;
  completedDate: string | null;
  active: boolean | null;
  description: string | null;
  customer?: TimeProjectCustomer | null;
  // Workflow API returns the customer relationship as `client { id }`
  // rather than the OIGQL `customer` block / `customerId` field.
  // The global ID (`djQuMTo5...`) is decoded to the numeric QBO local ID
  // via `util.GlobalId.convertToLocalId` which matches the OIGQL contacts
  // `parentId` format.
  client?: { id: string } | null;
}

export interface WorkProjectEdge {
  cursor: string;
  node: WorkProjectNode;
}

export interface WorkProjectsResponse {
  edges: WorkProjectEdge[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
  totalCount: number;
}

export interface ProjectsPaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface CachedFilterResult {
  rows: TimeProjectRow[];
  totalCount: number;
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface CustomerOption {
  customerId: string;
  displayName: string;
}

/**
 * One `(projectId, customerId)` pair, where `customerId` is the OIGQL
 * `dataAccessContacts.id` for the project's parent contact.
 *
 * Source of truth for "what is the customer for this project?" — the
 * `customer` block returned inline by `dataAccessWorkProjects` can be
 * partially populated, so we re-derive customerId via the contacts
 * lookup (`useProjectCustomerLookup`) and persist the mapping here.
 *
 * Downstream calls that previously took a bare `projectId` (project
 * estimates, assignment save, worker time summary) will move to
 * passing this `ProjectRef` so the supergraph can honor the
 * (project, customer) tuple consistently.
 */
export interface ProjectRef {
  projectId: string;
  customerId: string;
}

export interface ProjectsSliceState {
  rows: TimeProjectRow[];
  filteredRows: TimeProjectRow[];
  pagination: ProjectsPaginationState;
  cachedResults: Record<string, CachedFilterResult>;
  uniqueCustomers: CustomerOption[];
  estimatesMap: Record<string, ProjectEstimateData>;
  estimatesLoading: boolean;
  // Populated by `useProjectEstimates` when the GetProjectEstimates
  // query fails. Drives the dedicated "We were not able to fetch
  // estimates for the projects" error state on the listing page —
  // surfaced via `useAppSelector` in `TimeProject.tsx`.
  estimatesError: string | null;
  // Map of projectId -> customerId resolved from the OIGQL
  // `dataAccessContacts` follow-up call. Cleared on every fresh
  // listing query (filter / refresh / page change) so a stale entry
  // can never leak across filter contexts.
  projectRefs: Record<string, ProjectRef>;
  // Map of projectId -> parent customer id (the OIGQL contact id of
  // the project's PARENT customer, distinct from the project's own
  // contact id stored in `projectRefs[].customerId`). Read ONLY by
  // the assignment-save flow to build a hierarchical
  // `timeAgainstList` (project entry + ancestor customer entry),
  // matching the shape the Customer Assignments widget produces via
  // `buildHierarchicalTimeAgainstList`. Cleared alongside
  // `projectRefs` on every fresh listing fetch.
  projectParents: Record<string, string>;
}

export interface ServiceItemDAS {
  id: string;
  fullName: string | null;
}

export interface ProjectEstimateItemNode {
  fieldOptionId: string;
  estimatedSeconds: number;
  elapsedSeconds: number;
  serviceItemDAS: ServiceItemDAS | null;
}

export interface ProjectEstimateItemEdge {
  cursor: string;
  node: ProjectEstimateItemNode;
}

export interface ProjectEstimateItemsResponse {
  edges: ProjectEstimateItemEdge[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

export interface ProjectEstimateNode {
  id: string;
  projectId: string;
  projectEstimateType: string;
  projectElapsedSeconds: number;
  totalEstimatedSeconds: number;
  fieldType: string | null;
  fieldRef: string | null;
  projectEstimateItems?: ProjectEstimateItemsResponse;
}

export interface ProjectEstimateEdge {
  cursor: string;
  node: ProjectEstimateNode;
}

export interface ProjectEstimatesResponse {
  edges: ProjectEstimateEdge[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

export interface EstimateItemData {
  fieldOptionId: string;
  estimatedHours: number;
  elapsedSeconds: number;
  serviceItemName: string;
}

export interface ProjectEstimateData {
  budgetHoursTotal: number;
  budgetHoursRemaining: number;
  elapsedSeconds: number;
  totalEstimatedSeconds: number;
  projectEstimateType: string;
  fieldType?: string | null;
  fieldRef?: string | null;
  estimateItems?: EstimateItemData[];
}

export interface TimeForContactDAS {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  fullName: string | null;
  type: string | null;
  contractor?: boolean;
}

export interface TimeForLegacyQboUser {
  id: string;
}

export interface WorkerTimeSummaryNode {
  totalRegularSeconds: number;
  timeForType: string;
  timeForContactDAS: TimeForContactDAS | null;
  // Union resolver for `timeFor`. The supergraph only fills `id` when the
  // member is `TimeTracking_LegacyQboUser`; otherwise it comes back as an
  // empty object. We rely on this id to drive the Identity profile lookup
  // in `useLegacyQboUserNames`.
  timeFor?: TimeForLegacyQboUser | null;
}

export interface WorkerTimeSummaryEdge {
  node: WorkerTimeSummaryNode;
  cursor: string;
}

export interface WorkerTimeSummaryResponse {
  timeTrackingWorkerTimeSummary?: {
    edges: WorkerTimeSummaryEdge[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
}

export interface WorkerRow {
  id: string;
  displayName: string;
  hoursWorked: number;
  // Echoes `timeForType` from the time summary so we can branch the
  // downstream name-resolution path: LEGACY_QBO_USER rows are enriched
  // via the Identity profile lookup, everything else uses the DAS-stitched
  // displayName as-is.
  timeForType?: string;
}

export interface WorkerSummarySliceState {
  workers: WorkerRow[];
  loading: boolean;
  error: boolean;
  page: number;
  hasNextPage: boolean;
}

export type TimeProjectSortOrder = 'NAME_ASC' | 'NAME_DESC';

export interface FiltersSliceState {
  searchText: string;
  statusFilter: string;
  customerFilter: string;
  sortOrder: TimeProjectSortOrder;
  // Resolved Workflow global IDs from the OIGQL contacts name search.
  // Set on Enter-to-filter; null means no active ID-based filter (full list shown).
  // These are WorkflowGlobalId values — NOT QboLocalId values — because they
  // come directly from extractWorkflowIdFromUrn / ProjectNameSearchResult.projectId
  // and are passed straight into the Workflow API `id in (...)` filter string.
  searchProjectIds: WorkflowGlobalId[] | null;
  // Due date range filter — only applied on the Workflow API path when the
  // user is an accountant (QBOA). Null means no due-date filter is active.
  dueDateRange: DueDateRange | null;
}

export interface SettingsSliceState {
  timezone: string;
  qboTimezone: string;
  firstDayOfWeek: number;
  settingsLoading: boolean;
  settingsReady: boolean;
  settingsError: string | null;
}

export interface UISliceState {
  loading: boolean;
  error: string | null;
}

export enum EstimateType {
  TOTAL_HOURS = 'TOTAL_HOURS',
  BY_SERVICE_ITEM = 'BY_SERVICE_ITEM',
}

export interface ServiceItem {
  id: string;
  name: string;
  fullName?: string;
}

export interface ServiceItemEstimateRow {
  serviceItemId: string;
  serviceItemName: string;
  estimatedHours: number;
}

export interface EstimateDrawerSliceState {
  drawerOpen: boolean;
  drawerProject: TimeProjectRow | null;
  isEdit: boolean;
  saving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  hoursValue: string;
  inputError: string | null;
  estimateType: EstimateType;
  originalEstimateType: EstimateType | null;
  originalHoursValue: string;
  originalServiceItemRows: ServiceItemEstimateRow[];
  serviceItemRows: ServiceItemEstimateRow[];
  selectedServiceItemId: string;
  serviceItemHoursValue: string;
  serviceItemInputError: string | null;
  serviceItems: ServiceItem[];
  serviceItemsLoading: boolean;
  serviceItemsHasMore: boolean;
  serviceItemsEndCursor: string | null;
  serviceItemsSearchText: string;
}
