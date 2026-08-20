import { TimeProjectStatus, BadgeStatus } from './types';

export const TIME_PROJECT_LOGGING_CONSTANTS = {
  NAVIGATION: {
    TIME_PROJECT_WIDGET_MOUNTED:
      'Component=Widget Event=TimeProject Widget Mounted',
    PROJECT_DETAILS_VIEWED:
      'Component=TimeProject Event=Project Details Viewed',
    PROJECT_LIST_VIEWED: 'Component=TimeProject Event=Project List Viewed',
    ESTIMATE_DRAWER_OPENED:
      'Component=TimeProject Event=Estimate Drawer Opened',
    ASSIGN_WORKERS_DRAWER_OPENED:
      'Component=TimeProject Event=Assign Workers Drawer Opened',
  },
  API_ERRORS: {
    APOLLO_CLIENT_NOT_INITIALIZED:
      'Component=Widget Error=Apollo Client Not Initialized',
    POST_ESTIMATE_SAVE_REFETCH_FAILURE:
      'Component=TimeProject Error=Post Estimate Save Refetch Failure',
  },
  READS: {
    PROJECT_LIST_FETCH_START:
      'Component=useTimeProjectsFetching Event=Project List Fetch Started',
    PROJECT_LIST_FETCH_SUCCESS:
      'Component=useTimeProjectsFetching Event=Project List Fetch Success',
    PROJECT_LIST_FETCH_FAILURE:
      'Component=useTimeProjectsFetching Event=Project List Fetch Failure',
    ESTIMATES_FETCH_START:
      'Component=useProjectEstimates Event=Estimates Fetch Started',
    ESTIMATES_FETCH_SUCCESS:
      'Component=useProjectEstimates Event=Estimates Fetch Success',
    ESTIMATES_FETCH_FAILURE:
      'Component=useProjectEstimates Event=Estimates Fetch Failure',
    WORKER_TIME_SUMMARY_FETCH_START:
      'Component=useWorkerTimeSummary Event=Worker Time Summary Fetch Started',
    WORKER_TIME_SUMMARY_FETCH_SUCCESS:
      'Component=useWorkerTimeSummary Event=Worker Time Summary Fetch Success',
    WORKER_TIME_SUMMARY_FETCH_FAILURE:
      'Component=useWorkerTimeSummary Event=Worker Time Summary Fetch Failure',
    SERVICE_ITEMS_FETCH_START:
      'Component=useServiceItemsList Event=Service Items Fetch Started',
    SERVICE_ITEMS_FETCH_SUCCESS:
      'Component=useServiceItemsList Event=Service Items Fetch Success',
    SERVICE_ITEMS_FETCH_FAILURE:
      'Component=useServiceItemsList Event=Service Items Fetch Failure',
    POSTS_UNREAD_COUNT_FETCH_START:
      'Component=useUnreadPostsCount Event=Unread Count Fetch Started',
    POSTS_UNREAD_COUNT_FETCH_SUCCESS:
      'Component=useUnreadPostsCount Event=Unread Count Fetch Success',
    POSTS_UNREAD_COUNT_FETCH_FAILURE:
      'Component=useUnreadPostsCount Event=Unread Count Fetch Failure',
    FETCH_PROJECT_BY_ID_START:
      'Component=useFetchProjectById Event=Fetch Project By Id Started',
    FETCH_PROJECT_BY_ID_SUCCESS:
      'Component=useFetchProjectById Event=Fetch Project By Id Success',
    FETCH_PROJECT_BY_ID_FAILURE:
      'Component=useFetchProjectById Event=Fetch Project By Id Failure',
    PROJECT_LIST_RESPONSE_SHAPE_INVALID:
      'Component=useTimeProjectsFetching Event=Project List Response Shape Invalid',
    PROJECT_SEARCH_START:
      'Component=useProjectNameSearch Event=Project Name Search Started',
    PROJECT_SEARCH_SUCCESS:
      'Component=useProjectNameSearch Event=Project Name Search Success',
    PROJECT_SEARCH_FAILURE:
      'Component=useProjectNameSearch Event=Project Name Search Failure',
    // Posts feed read — Splunk alert source (success/failure carry `projectId`).
    POSTS_FEED_FETCH_START:
      'Component=usePostsFeed Event=Posts Feed Fetch Started',
    POSTS_FEED_FETCH_SUCCESS:
      'Component=usePostsFeed Event=Posts Feed Fetch Success',
    POSTS_FEED_FETCH_FAILURE:
      'Component=usePostsFeed Event=Posts Feed Fetch Failed',
    // Post replies read — Splunk alert source (carry `projectId` + `parentPostId`).
    POST_REPLIES_FETCH_START:
      'Component=usePostReplies Event=Post Replies Fetch Started',
    POST_REPLIES_FETCH_SUCCESS:
      'Component=usePostReplies Event=Post Replies Fetch Success',
    POST_REPLIES_FETCH_FAILURE:
      'Component=usePostReplies Event=Post Replies Fetch Failed',
  },
  MUTATIONS: {
    ESTIMATE_CREATE_START:
      'Component=useCreateEstimate Event=Estimate Create Started',
    ESTIMATE_CREATE_SUCCESS:
      'Component=useCreateEstimate Event=Estimate Create Success',
    ESTIMATE_CREATE_FAILURE:
      'Component=useCreateEstimate Event=Estimate Create Failure',
    ESTIMATE_UPDATE_START:
      'Component=useUpdateEstimate Event=Estimate Update Started',
    ESTIMATE_UPDATE_SUCCESS:
      'Component=useUpdateEstimate Event=Estimate Update Success',
    ESTIMATE_UPDATE_FAILURE:
      'Component=useUpdateEstimate Event=Estimate Update Failure',
    ESTIMATE_DELETE_START:
      'Component=useDeleteEstimate Event=Estimate Delete Started',
    ESTIMATE_DELETE_SUCCESS:
      'Component=useDeleteEstimate Event=Estimate Delete Success',
    ESTIMATE_DELETE_FAILURE:
      'Component=useDeleteEstimate Event=Estimate Delete Failure',
    POST_UPDATE_START: 'Component=useManagePost Event=Post Update Started',
    POST_UPDATE_SUCCESS: 'Component=useManagePost Event=Post Update Success',
    POST_UPDATE_FAILURE: 'Component=useManagePost Event=Post Update Failed',
    POST_DELETE_START: 'Component=useDeletePost Event=Post Delete Started',
    POST_DELETE_SUCCESS: 'Component=useDeletePost Event=Post Delete Success',
    POST_DELETE_FAILURE: 'Component=useDeletePost Event=Post Delete Failed',
    // Top-level post create.
    POST_CREATE_START: 'Component=useManagePost Event=Post Create Started',
    POST_CREATE_SUCCESS: 'Component=useManagePost Event=Post Create Success',
    POST_CREATE_FAILURE: 'Component=useManagePost Event=Post Create Failed',
    // Reply create — distinct event so a Splunk alert can target replies-write
    // specifically (separate from top-level post creates). Carries `projectId`.
    REPLY_CREATE_START: 'Component=useManagePost Event=Reply Create Started',
    REPLY_CREATE_SUCCESS: 'Component=useManagePost Event=Reply Create Success',
    REPLY_CREATE_FAILURE: 'Component=useManagePost Event=Reply Create Failed',
    MARK_POSTS_READ_START:
      'Component=useMarkPostsRead Event=Mark Posts Read Started',
    MARK_POSTS_READ_SUCCESS:
      'Component=useMarkPostsRead Event=Mark Posts Read Success',
    MARK_POSTS_READ_FAILURE:
      'Component=useMarkPostsRead Event=Mark Posts Read Failed',
  },
  ASSIGNMENTS: {
    ASSIGNMENT_SUMMARY_FETCH_START:
      'Component=useAssignmentSummary Event=Assignment Summary Fetch Started',
    ASSIGNMENT_SUMMARY_FETCH_SUCCESS:
      'Component=useAssignmentSummary Event=Assignment Summary Fetch Success',
    ASSIGNMENT_SUMMARY_FETCH_FAILURE:
      'Component=useAssignmentSummary Event=Assignment Summary Fetch Failure',
  },
} as const;

export const NAVIGATION_ROUTES = {
  MANAGE_PROJECTS: '/app/projects',
  TIME_PROJECTS: 'time/timeprojects',
} as const;

// QBO project details page (used to add or edit start / end dates - we
// don't currently host a date editor inside this widget, so the date
// card's "Add / Edit dates" link deep-links over to the QBO surface).
// `sandbox.navigation.navigate` prefixes the env-specific QBO host.
//
// `tab=project_details` lands the user directly on the Project details
// tab inside the QBO project page (rather than the default landing tab),
// which is what the analytics request from product asks for.
export const buildQboProjectDetailsRoute = (projectId: string): string =>
  `/app/projects/projectdetails?id=${encodeURIComponent(
    projectId,
  )}&tab=project_details`;

// QBO customer / job details page. Used by the project summary's
// customer name link so users can jump straight from a project to the
// customer it belongs to. The QBO surface keys this page off `nameId`,
// which is the customer record id (QBO's "Name List" models customers
// and jobs as the same entity type, distinguished only by parentage).
export const buildQboCustomerDetailsRoute = (customerId: string): string =>
  `/app/customerdetail?nameId=${encodeURIComponent(customerId)}`;

export const DEFAULT_PAGE_SIZE = 10;

export const SEARCH_DEBOUNCE_MS = 300;

// Filter values are the human-readable strings the backend's
// `dataAccessWorkProjects` filter accepts via `status.matchesAny`. Adding
// a new status here means it will be included in the default "no filter
// selected" query and made selectable from the StatusFilterDropdown.
export const ALL_PROJECT_STATUSES = [
  'In progress',
  'Completed',
  'Not started',
  'To do',
  'Canceled',
] as const;

export const STATUS_FILTER_OPTIONS: { value: string; nlsKey: string }[] = [
  { value: 'ALL', nlsKey: 'timeProject.filter.allStatuses' },
  { value: 'In progress', nlsKey: 'timeProject.status.inProgress' },
  { value: 'Completed', nlsKey: 'timeProject.status.completed' },
  { value: 'Not started', nlsKey: 'timeProject.status.notStarted' },
  { value: 'To do', nlsKey: 'timeProject.status.todo' },
  { value: 'Canceled', nlsKey: 'timeProject.status.canceled' },
];

// On the Workflow API path the "Not started" / "To do" split is collapsed into
// a single option whose label depends on the user type, mirroring projects-plugin
// (QbaStatus vs QboStatus + resolveStatusLabelId). Both options map to the same
// broadened Workflow filter `status in ('Todo', 'Open')` — see
// `buildWorkflowFilterString`.
//
// QBOA users see "To do" (accountant context — "To do" is the accountant label
// for an open/unstarted project). "Not started" is hidden.
export const WORKFLOW_STATUS_FILTER_OPTIONS = STATUS_FILTER_OPTIONS.filter(
  (opt) => opt.value !== 'Not started',
);

// QBO users see "Not started" (non-accountant context). "To do" is hidden.
export const QBO_WORKFLOW_STATUS_FILTER_OPTIONS = STATUS_FILTER_OPTIONS.filter(
  (opt) => opt.value !== 'To do',
);

export const STATUS_BADGE_MAP: Record<
  TimeProjectStatus,
  { nlsKey: string; status: BadgeStatus; bgColor: string }
> = {
  IN_PROGRESS: {
    nlsKey: 'timeProject.status.inProgress',
    status: 'info',
    bgColor: '#E0EDFF',
  },
  COMPLETED: {
    nlsKey: 'timeProject.status.completed',
    status: 'success',
    bgColor: '#D8FFDB',
  },
  NOT_STARTED: {
    nlsKey: 'timeProject.status.notStarted',
    status: 'draft',
    bgColor: '#F8FAFB',
  },
  // "To do" is a backend-distinct queue for prioritized work the user
  // intends to start soon. It used to collapse into NOT_STARTED in the
  // UI; we now render it with the `pending` badge variant on a soft
  // amber background to differentiate the two.
  TODO: {
    nlsKey: 'timeProject.status.todo',
    status: 'pending',
    bgColor: '#FFF4D5',
  },
  CANCELLED: {
    nlsKey: 'timeProject.status.canceled',
    status: 'error',
    bgColor: '#FFEAC7',
  },
};

export const PROJECT_ACTIONS = {
  CREATE_ESTIMATE: 'create-estimate',
  ASSIGN_WORKERS: 'assign-workers',
  EDIT: 'edit',
} as const;

// A project that has been Cancelled or Completed is no longer an
// active work target — no new worker assignments should be created
// against it. Surfaced here (rather than inlined at every call site)
// so the rule is enforced consistently across the listing combo-link,
// the project summary header, AND the parent page's click handler.
// The page-level guard is the load-bearing one: even if a stale UI
// state somehow surfaces an assign affordance, the parent will still
// refuse to open the drawer.
export const ASSIGNMENT_BLOCKED_STATUSES: ReadonlySet<TimeProjectStatus> =
  new Set<TimeProjectStatus>(['CANCELLED', 'COMPLETED']);

export const canAssignWorkersToProject = (status: TimeProjectStatus): boolean =>
  !ASSIGNMENT_BLOCKED_STATUSES.has(status);

export const SUMMARY_ACTIONS = {
  EDIT_ESTIMATE: 'edit-estimate',
} as const;

export const SUMMARY_SEGMENTS = {
  ESTIMATES: 'estimates',
  USERS: 'users',
} as const;

// Top-level tabs on the Project Summary page. Distinct from
// `SUMMARY_SEGMENTS` (the inner Estimates/Users toggle that lives inside
// the Summary tab). The Posts tab is gated behind the
// `SBSEG-QBO-SHOW-PROJECT-POST` IXP flag.
export const PROJECT_TABS = {
  SUMMARY: 'summary',
  POSTS: 'posts',
} as const;

// Max characters allowed in a post / reply body.
export const POST_CONTENT_MAX_LENGTH = 2000;

// How many worker suggestions to fetch / show in the @-mention menu. Capped so
// the list fits without a scroll region (the menu renders all results).
export const MENTION_MENU_PAGE_SIZE = 5;

// Upper bound on the query length we treat as an active @-mention trigger.
// Beyond this the user is almost certainly typing prose, not a name, so we
// stop showing the menu rather than firing searches for long strings.
export const MENTION_MAX_QUERY_LENGTH = 30;

/**
 * Maximum hours a single project / service-item estimate can hold.
 * Backend stores estimates as `seconds` in a 32-bit signed int, so the
 * largest valid value is `floor(MAX_INT / 3600 * 100) / 100` =
 * `1193046.47` hours. Anything above this overflows server-side, so we
 * block it client-side too.
 */
export const MAX_ESTIMATE_HOURS = 1193046.47;

export const PROJECT_SORT_ORDER = {
  NAME_ASC: 'NAME_ASC',
  NAME_DESC: 'NAME_DESC',
} as const;
