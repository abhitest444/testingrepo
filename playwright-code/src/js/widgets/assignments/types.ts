/**
 * Detailed error information for field assignments
 * Used for displaying error messages with optional subtitle and description
 */
export interface DetailedErrorInfo {
  title: string;
  subtitle?: string;
  description?: string;
  isPartialSuccess?: boolean; // True for partial success, false/undefined for pure failure
}

/**
 * Error codes for group with assignments operations
 */
export enum ErrorCodes {
  GROUP_NAME_ALREADY_EXISTS = 'GROUP_NAME_ALREADY_EXISTS',
  OPTIMISTIC_LOCK_FAILURE = 'OPTIMISTIC_LOCK_FAILURE',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  WORKER_VALIDATION_FAILED = 'WORKER_VALIDATION_FAILED',
}

/**
 * Main tab values for Assignments widget
 */
export enum AssignmentsMainTabs {
  CUSTOMERS = 'CUSTOMERS',
  WORKERS = 'WORKERS',
}

/**
 * Workers tab view modes
 */
export enum WorkersTabViews {
  GROUPS = 'groups',
  WORKERS = 'workers',
}

/**
 * Worker name types for QBO contacts drawer
 * Used when adding workers via the Add Worker drawer
 */
export enum WorkerNameType {
  EMPLOYEE = 'employee',
  CONTRACTOR = 'vendor',
}

/**
 * Context for workers empty state message (workers list vs group detail)
 */
export enum WorkersEmptyStateContext {
  WORKERS_LIST = 'workersList',
  GROUP_DETAIL = 'groupDetail',
}
