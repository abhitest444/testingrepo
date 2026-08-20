import { FetchResult } from '@apollo/client';
import { CreateGroupWithAssignmentsResult } from 'src/js/service/hooks/groups';
import {
  TimeTracking_TimeForType,
  TimeTracking_TimeForInput,
} from 'src/__generated__/timeTracking/graphql';
import {
  ErrorSource,
  GroupDrawerContext,
  OperationType,
  OperationAction,
  WorkerSelectionMode,
} from '../types/Groups/GroupDrawer.types';
import { WorkerType } from '../components/WorkerAssignments/SearchFilterBar/types';
import { ErrorCodes, WorkersEmptyStateContext } from '../types';
import { TSHEETS_STRING } from './constants';
import {
  areAllInactiveWorkerErrors,
  buildInactiveWorkersErrorMessage,
  buildCombinedInactiveWorkersErrorMessage,
  buildCombinedAssignRemoveInactiveErrorMessage,
} from './errorHelpers';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Worker information needed for navigation
 */
export interface NavigationWorkerInfo {
  id: string;
  displayName?: string;
  name?: string;
  type?: string | TimeTracking_TimeForType;
  role?: string | TimeTracking_TimeForType;
}

/**
 * Encrypts a worker ID for use in URL path parameters
 * Uses base64 encoding (URL-safe) for encryption
 * Note: This can be replaced with more secure encryption (e.g., AES) if needed
 *
 * @param workerId - The worker ID to encrypt
 * @returns Encrypted worker ID string (URL-safe)
 */
export const encryptWorkerId = (workerId: string): string => {
  try {
    // Use base64 encoding with URL-safe characters
    // This provides basic obfuscation while remaining URL-safe
    // Can be replaced with AES encryption if stronger security is required
    return btoa(encodeURIComponent(workerId))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (error) {
    throw new Error(
      `Failed to encrypt worker ID: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

/**
 * Navigates to user settings page with worker context via path parameters
 * Shared helper to ensure consistent navigation across all worker views
 * Worker ID is encrypted before being included in the URL
 *
 * @param worker - Worker information (supports both displayName and name fields)
 * @param sandbox - QuickBooks Online sandbox instance (uses 'any' for compatibility)
 * @param componentName - Name of the calling component for logging (optional)
 *
 * @example
 * navigateToWorkerSettings(worker, sandbox, 'WorkersListView');
 */
export const navigateToWorkerSettings = (
  worker: NavigationWorkerInfo,
  sandbox: any,
  componentName?: string,
): void => {
  try {
    // Support both displayName and name fields for compatibility
    const workerDisplayName = worker.displayName || worker.name || 'Worker';

    // Encrypt worker ID before navigation
    const encryptedWorkerId = encryptWorkerId(worker.id);
    const workerType = encodeURIComponent(
      (worker.type || worker.role)?.toString() ?? 'EMPLOYEE',
    );
    const workerName = encodeURIComponent(workerDisplayName);

    sandbox.navigation.navigate(
      `/app/userSettings/${encryptedWorkerId}/${workerType}/${workerName}`,
    );

    const logContext = componentName ? `Component="${componentName}" ` : '';
    sandbox.logger.info(`${logContext}Event="Navigating to worker settings"`, {
      workerId: worker.id,
      workerType: worker.type || worker.role,
      workerName: workerDisplayName,
    });
  } catch (error) {
    const logContext = componentName ? `Component="${componentName}" ` : '';
    sandbox.logger.error(
      `${logContext}Event="Navigation to worker settings failed"`,
      {
        error,
        workerId: worker.id,
        workerName: worker.displayName || worker.name,
        workerType: worker.type || worker.role,
      },
    );
  }
};

export interface ErrorResult {
  errorTitle?: string;
  errorMessage: string;
}

/**
 * Converts a WorkerType filter value to an array of TimeTracking_TimeForType enum values
 * Used for filtering workers by type in API queries
 *
 * @param filterType - The worker type filter value (ALL, EMPLOYEE, LEGACY_QBO_USER, VENDOR)
 * @returns Array of TimeTracking_TimeForType enum values, or undefined for ALL
 *
 * @example
 * convertWorkerTypeToApiTypes(WorkerType.ALL) // Returns: undefined
 * convertWorkerTypeToApiTypes(WorkerType.EMPLOYEE) // Returns: [TimeTracking_TimeForType.Employee]
 * convertWorkerTypeToApiTypes(WorkerType.LEGACY_QBO_USER) // Returns: [TimeTracking_TimeForType.LegacyQboUser]
 * convertWorkerTypeToApiTypes(WorkerType.VENDOR) // Returns: [TimeTracking_TimeForType.Vendor]
 */
export const convertWorkerTypeToApiTypes = (
  filterType: WorkerType | string,
): TimeTracking_TimeForType[] | undefined => {
  switch (filterType) {
    case WorkerType.ALL:
      return undefined;
    case WorkerType.EMPLOYEE:
      return [TimeTracking_TimeForType.Employee];
    case WorkerType.LEGACY_QBO_USER:
      return [TimeTracking_TimeForType.LegacyQboUser];
    case WorkerType.VENDOR:
      return [TimeTracking_TimeForType.Vendor];
    default:
      return undefined;
  }
};

/**
 * Formats WorkerType enum to display-friendly text
 * @param filterType - The WorkerType enum value
 * @returns The formatted display text
 */
const formatWorkerTypeForDisplay = (filterType: WorkerType): string => {
  switch (filterType) {
    case WorkerType.EMPLOYEE:
      return 'employee';
    case WorkerType.LEGACY_QBO_USER:
      return 'user';
    case WorkerType.VENDOR:
      return 'vendor';
    default:
      return filterType.toLowerCase();
  }
};

const WORKERS_EMPTY_STATE_MESSAGE_IDS: Record<
  WorkersEmptyStateContext,
  { default: string; withSearchFilter: string; withWorkerTypeFilter: string }
> = {
  [WorkersEmptyStateContext.WORKERS_LIST]: {
    default: 'workers.list.empty.title',
    withSearchFilter: 'workers.list.empty.noSearchResultsTitle',
    withWorkerTypeFilter: 'workers.list.empty.noWorkersByTypeTitle',
  },
  [WorkersEmptyStateContext.GROUP_DETAIL]: {
    default: 'groups.detail.noWorkers',
    withSearchFilter: 'groups.detail.noSearchResults',
    withWorkerTypeFilter: 'groups.detail.noWorkersByType',
  },
};

/**
 * Shared empty state title/message for workers list and group detail views.
 * Use when there are no workers: picks message by search text, filter type, and context.
 * @param context - WorkersEmptyStateContext.WORKERS_LIST or WorkersEmptyStateContext.GROUP_DETAIL
 * @param searchText - Current search query
 * @param filterType - Current worker type filter (e.g. ALL, EMPLOYEE, VENDOR)
 * @param intl - The internationalization object
 * @returns The formatted empty state message
 */
export const getWorkersEmptyStateTitle = (
  context: WorkersEmptyStateContext,
  searchText: string,
  filterType: WorkerType,
  intl: any,
): string => {
  const emptyStateMessageIds = WORKERS_EMPTY_STATE_MESSAGE_IDS[context];
  if (searchText.trim()) {
    return intl.formatMessage(
      { id: emptyStateMessageIds.withSearchFilter },
      { searchText },
    );
  }
  if (filterType && filterType !== WorkerType.ALL) {
    return intl.formatMessage(
      { id: emptyStateMessageIds.withWorkerTypeFilter },
      { filterType: formatWorkerTypeForDisplay(filterType) },
    );
  }
  return intl.formatMessage({ id: emptyStateMessageIds.default });
};

/**
 * Base interface for group operation results (assign/remove members/managers)
 * Contains common properties shared by all operation types
 */
export interface BaseOperationResult {
  success: boolean;
  partialSuccess?: boolean;
  failedCount: number;
  failures?: Array<{
    workerId: string;
    errorCode: string | null;
    errorMessage: string | null;
  }>;
}

/**
 * Result type for assignment operations (assign members or managers)
 */
export interface AssignmentOperationResult extends BaseOperationResult {
  assignedCount: number;
}

/**
 * Result type for removal operations (remove members or managers)
 */
export interface RemovalOperationResult extends BaseOperationResult {
  removedCount: number;
}

/**
 * Generic error type for group operations (assign/remove members/managers)
 */
export interface GroupOperationError {
  error: string;
  errorCode?: string;
}

/**
 * Generic helper function to parse assignment mutation responses (members or managers)
 * Handles success, partial success, and error scenarios
 *
 * @param result - The GraphQL mutation result
 * @param responseFieldName - The field name to extract from the mutation result
 *   (e.g., 'timeTrackingAssignGroupMembers' or 'timeTrackingAssignGroupManagers')
 * @param operationType - Description of the operation for error messages (OperationType enum)
 * @returns AssignmentOperationResult for success/partial success, or AssignmentOperationError for errors
 *
 * @example
 * @ const parsed = parseResponse(
 *   mutationResult,
 *   'timeTrackingAssignGroupMembers',
 *   OperationType.Members
 * );
 * if ('error' in parsed) {
 *   // Handle error
 * } else {
 *   // Handle success
 * }
 */
export const parseAssignmentResponse = (
  result: FetchResult<any>,
  responseFieldName: string,
  operationType: OperationType,
): AssignmentOperationResult | GroupOperationError => {
  const response = result.data?.[responseFieldName];

  if (!response) {
    return {
      error: `Null response from ${
        operationType === OperationType.Members
          ? OperationType.Members
          : WorkerSelectionMode.Leads
      } assignment`,
    };
  }

  // Type guard: Check if response is an error
  if ('errorCode' in response && typeof response.errorCode === 'string') {
    return {
      error:
        response.message ||
        `Failed to assign ${
          operationType === OperationType.Members
            ? OperationType.Members
            : WorkerSelectionMode.Leads
        }`,
      errorCode: response.errorCode,
    };
  }

  // Type guard: Check if response is success
  if ('successCode' in response && 'assignmentResults' in response) {
    const { successCode, assignmentResults } = response;

    // Type guards for individual results
    const isError = (r: any): boolean => 'workerId' in r;
    const isSuccess = (r: any): boolean => 'worker' in r;

    const successfulAssignments = assignmentResults.filter(isSuccess);
    const failedAssignments = assignmentResults.filter(isError);

    const assignedCount = successfulAssignments.length;
    const failedCount = failedAssignments.length;
    const isPartialSuccess = successCode === 'PARTIAL_SUCCESS';
    const isFailure = successCode === 'FAILURE';

    if (isFailure) {
      return {
        error: `Try saving your change again. Failed to assign ${
          operationType === OperationType.Members
            ? OperationType.Members
            : WorkerSelectionMode.Leads
        }`,
      };
    }

    if (isPartialSuccess) {
      const failures = failedAssignments.map((f: any) => ({
        workerId: f.workerId,
        errorCode: f.errorCode || null,
        errorMessage: f.errorMessage || null,
      }));

      return {
        success: true,
        partialSuccess: true,
        assignedCount,
        failedCount,
        failures,
      };
    }

    return {
      success: true,
      partialSuccess: false,
      assignedCount,
      failedCount: 0,
      failures: [],
    };
  }

  return {
    error: `Unexpected response format from ${operationType} assignment`,
  };
};

/**
 * Generic helper function to parse removal mutation responses (members or managers)
 * Handles success, partial success, and error scenarios
 *
 * @param result - The GraphQL mutation result
 * @param responseFieldName - The field name to extract from the mutation result
 *   (e.g., 'timeTrackingRemoveGroupMembers' or 'timeTrackingRemoveGroupManagers')
 * @param operationType - Description of the operation for error messages (OperationType enum)
 * @returns RemovalOperationResult for success/partial success, or RemovalOperationError for errors
 *
 * @example
 * const parsed = parseRemovalResponse(
 *   mutationResult,
 *   'timeTrackingRemoveGroupMembers',
 *   OperationType.Members
 * );
 * if ('error' in parsed) {
 *   // Handle error
 * } else {
 *   // Handle success
 * }
 */
export const parseRemovalResponse = (
  result: FetchResult<any>,
  responseFieldName: string,
  operationType: OperationType,
): RemovalOperationResult | GroupOperationError => {
  const response = result.data?.[responseFieldName];

  if (!response) {
    return {
      error: `Null response from ${operationType} removal`,
    };
  }

  // Type guard: Check if response is an error
  if ('errorCode' in response && typeof response.errorCode === 'string') {
    return {
      error: response.message || `Failed to remove ${operationType}`,
      errorCode: response.errorCode,
    };
  }

  // Type guard: Check if response is success
  if ('successCode' in response && 'removalResults' in response) {
    const { successCode, removalResults } = response;

    // Type guards for individual results
    const isError = (r: any): boolean => 'workerId' in r;
    const isSuccess = (r: any): boolean => 'worker' in r;

    const successfulRemovals = removalResults.filter(isSuccess);
    const failedRemovals = removalResults.filter(isError);

    const removedCount = successfulRemovals.length;
    const failedCount = failedRemovals.length;
    const isPartialSuccess = successCode === 'PARTIAL_SUCCESS';

    if (isPartialSuccess) {
      const failures = failedRemovals.map((f: any) => ({
        workerId: f.workerId,
        errorCode: f.errorCode || null,
        errorMessage: f.errorMessage || null,
      }));

      return {
        success: true,
        partialSuccess: true,
        removedCount,
        failedCount,
        failures,
      };
    }

    return {
      success: true,
      partialSuccess: false,
      removedCount,
      failedCount: 0,
      failures: [],
    };
  }

  return {
    error: `Unexpected response format from ${operationType} removal`,
  };
};

/**
 * Validates a group name according to business rules
 * @param groupName - The group name to validate
 * @param intl - The internationalization object for formatting messages
 * @returns ValidationResult with isValid flag and optional formatted errorMessage
 */
export const validateGroupName = (
  groupName: string,
  intl: any,
): ValidationResult => {
  // Required validation
  if (!groupName.trim()) {
    return {
      isValid: false,
      errorMessage: intl.formatMessage({
        id: 'groups.drawer.error.required',
        defaultMessage: 'Group name is required',
      }),
    };
  }

  return { isValid: true };
};

/**
 * Builds a success message for group creation with assignments
 * Handles full success scenarios only (partialSuccess === false)
 *
 * @param result - The result object from group creation with assignments
 * @param intl - The internationalization object for formatting messages
 * @returns Formatted success message based on assignment results
 *
 * @example
 * // Group created with members and leads
 * buildGroupCreationSuccessMessage(result, intl)
 * // Returns: "Group 'Team Alpha' created with 5 members and 2 leads assigned"
 *
 * @example
 * // Group created with members only
 * buildGroupCreationSuccessMessage(result, intl)
 * // Returns: "Group 'Team Alpha' created with 5 members assigned"
 *
 * @example
 * // Group created without assignments
 * buildGroupCreationSuccessMessage(result, intl)
 * // Returns: "Group 'Team Alpha' created successfully"
 */
export const buildGroupCreationSuccessMessage = (
  result: CreateGroupWithAssignmentsResult,
  intl: any,
): string => {
  const { groupName, memberAssignments, leadAssignments } = result;

  // Determine if full success for members (no partial success)
  const hasMembersAssigned =
    memberAssignments &&
    memberAssignments.membersAssigned > 0 &&
    !memberAssignments.partialSuccess;

  // Determine if full success for leads (no partial success)
  const hasLeadsAssigned =
    leadAssignments &&
    leadAssignments.leadsAssigned > 0 &&
    !leadAssignments.partialSuccess;

  if (hasMembersAssigned && hasLeadsAssigned) {
    // Both members and leads assigned
    return intl.formatMessage(
      { id: 'groups.drawer.success.created_with_members_and_leads' },
      {
        name: groupName || '',
        membersCount: memberAssignments.membersAssigned,
        leadsCount: leadAssignments.leadsAssigned,
      },
    );
  }
  if (hasMembersAssigned) {
    // Only members assigned
    return intl.formatMessage(
      { id: 'groups.drawer.success.created_with_members' },
      {
        name: groupName || '',
        count: memberAssignments.membersAssigned,
      },
    );
  }
  if (hasLeadsAssigned) {
    // Only leads assigned
    return intl.formatMessage(
      { id: 'groups.drawer.success.created_with_leads' },
      {
        name: groupName || '',
        count: leadAssignments.leadsAssigned,
      },
    );
  }
  // No assignments (only group created)
  return intl.formatMessage(
    { id: 'groups.drawer.success.created' },
    { name: groupName || '' },
  );
};

/**
 * Generic helper to build success messages for assign or remove operations (full success only)
 * Works for both members and managers
 *
 * @param result - The result object from assign or remove operation
 * @param action - OperationAction enum (Assign or Remove)
 * @param operationType - OperationType enum (Members or Managers)
 * @param groupName - The name of the group
 * @param intl - The internationalization object for formatting messages
 * @returns Formatted success message
 *
 * @example
 * buildOperationMessage(result, OperationAction.Assign, OperationType.Members, 'Team Alpha', intl)
 * // Returns: "5 worker(s) assigned to Team Alpha"
 *
 * @example
 * buildOperationMessage(result, OperationAction.Remove, OperationType.Members, 'Team Alpha', intl)
 * // Returns: "5 worker(s) removed from Team Alpha"
 */
export const buildOperationMessage = (
  result: AssignmentOperationResult | RemovalOperationResult,
  action: OperationAction,
  operationType: OperationType,
  groupName: string,
  intl: any,
): string => {
  const count =
    action === OperationAction.Assign
      ? (result as AssignmentOperationResult).assignedCount
      : (result as RemovalOperationResult).removedCount;

  return intl.formatMessage(
    { id: `groups.${action}_${operationType}.success` },
    {
      count,
      groupName,
    },
  );
};

/**
 * Generic helper to build combined assign+remove success messages
 * Works for both members and managers
 *
 * @param assignResult - The result object from assign operation (optional)
 * @param removeResult - The result object from remove operation (optional)
 * @param operationType - OperationType enum (Members or Managers)
 * @param groupName - The name of the group
 * @param intl - The internationalization object for formatting messages
 * @returns Formatted success message
 *
 * @example
 * // Both operations succeeded
 * buildCombinedAssignRemoveMessage(assignResult, removeResult, OperationType.Members, 'Team Alpha', intl)
 * // Returns: "5 worker(s) assigned to and 3 worker(s) removed from Team Alpha"
 */
export const buildCombinedAssignRemoveMessage = (
  assignResult: AssignmentOperationResult | null,
  removeResult: RemovalOperationResult | null,
  operationType: OperationType,
  groupName: string,
  intl: any,
): string => {
  const assignedCount = assignResult?.assignedCount || 0;
  const removedCount = removeResult?.removedCount || 0;

  return intl.formatMessage(
    { id: `groups.assign_remove_${operationType}.success` },
    {
      assignedCount,
      removedCount,
      groupName,
    },
  );
};

/**
 * Builds an error title and message for group operations
 * Handles specific error scenarios: duplicate group names, assignment failures, and general errors
 *
 * @param error - The error message
 * @param errorCode - Optional error code from the API
 * @param source - Source of the error (ErrorSource enum)
 * @param intl - The internationalization object for formatting messages
 * @returns ErrorResult with errorTitle (optional) and errorMessage
 *
 * @example
 * // Duplicate group name error
 * buildGroupErrorResult(error, errorCode, ErrorSource.CreateGroup, intl)
 * // Returns: { errorTitle: "Group Already Exists", errorMessage: "A group with name 'Team Alpha' already exists" }
 *
 * @example
 * // Member assignment validation error
 * buildGroupErrorResult(error, 'WORKER_VALIDATION_FAILED', ErrorSource.AssignMembers, intl)
 * // Returns: { errorTitle: "Group was created but members assignment failed", errorMessage: error }
 *
 * @example
 * // General error
 * buildGroupErrorResult(error, undefined, undefined, intl)
 * // Returns: { errorTitle: "We couldn't save your recent change", errorMessage: error || "Try saving your change again." }
 */
/**
 * Map of simple error codes to their message configuration
 */
const SIMPLE_ERROR_CONFIG = new Map<
  ErrorCodes,
  {
    titleId: string;
    messageId: string;
    defaultTitle: string;
    defaultMessage: string;
  }
>([
  [
    ErrorCodes.GROUP_NAME_ALREADY_EXISTS,
    {
      titleId: 'groups.drawer.error.duplicate.title',
      messageId: 'groups.drawer.error.duplicate.message',
      defaultTitle: 'Group Already Exists',
      defaultMessage: 'A group with this name already exists in the company',
    },
  ],
  [
    ErrorCodes.OPTIMISTIC_LOCK_FAILURE,
    {
      titleId: 'groups.drawer.error.version_conflict.title',
      messageId: 'groups.drawer.error.version_conflict.message',
      defaultTitle: 'Group Was Modified',
      defaultMessage:
        'This group was modified by another user. Please refresh and try again.',
    },
  ],
  [
    ErrorCodes.INSUFFICIENT_PERMISSIONS,
    {
      titleId: 'groups.drawer.error.insufficient_permissions.title',
      messageId: 'groups.drawer.error.insufficient_permissions.message',
      defaultTitle: 'Insufficient Permissions',
      defaultMessage: 'You do not have permission to perform this action.',
    },
  ],
]);

/**
 * Map of worker validation error message configuration
 * Key format: `${groupDrawerContext}|${source}` or `default` for generic fallback
 */
const WORKER_VALIDATION_MESSAGES = new Map<
  string,
  { messageId: string; defaultMessage: string }
>([
  [
    `${GroupDrawerContext.CreateGroup}|${ErrorSource.AssignMembers}`,
    {
      messageId: 'groups.drawer.error.members_assignment_failed.title',
      defaultMessage: 'Group was created but members assignment failed',
    },
  ],
  [
    `${GroupDrawerContext.CreateGroup}|${ErrorSource.AssignManagers}`,
    {
      messageId: 'groups.drawer.error.managers_assignment_failed.title',
      defaultMessage: 'Group was created but leads assignment failed',
    },
  ],
  [
    `default|${ErrorSource.AssignMembers}`,
    {
      messageId: 'groups.assign_members.error',
      defaultMessage: 'Failed to assign members',
    },
  ],
  [
    `default|${ErrorSource.AssignManagers}`,
    {
      messageId: 'groups.assign_managers.error',
      defaultMessage: 'Failed to assign leads',
    },
  ],
  [
    `default|${ErrorSource.RemoveMembers}`,
    {
      messageId: 'groups.remove_members.error',
      defaultMessage: 'Failed to remove members',
    },
  ],
  [
    `default|${ErrorSource.RemoveManagers}`,
    {
      messageId: 'groups.remove_managers.error',
      defaultMessage: 'Failed to remove leads',
    },
  ],
  // Generic fallback for any context when source doesn't match (maintains previous behavior)
  [
    'default',
    {
      messageId: 'groups.drawer.error.assignment_failed.title',
      defaultMessage: 'Group was created but assignment failed',
    },
  ],
]);

export const buildGroupErrorResult = (
  error: string,
  errorCode?: string,
  source?: ErrorSource,
  intl?: any,
  groupDrawerContext?: GroupDrawerContext,
): ErrorResult => {
  // Handle partial success errors with pre-built title and message
  if (errorCode === 'PARTIAL_SUCCESS') {
    try {
      const decoded = JSON.parse(error) as {
        errorTitle: string;
        errorMessage: string;
      };
      return {
        errorTitle: decoded.errorTitle,
        errorMessage: decoded.errorMessage,
      };
    } catch (e) {
      // If JSON parsing fails, fall through to default error handling
    }
  }

  // Handle simple error codes using Map
  if (errorCode) {
    const config = SIMPLE_ERROR_CONFIG.get(errorCode as ErrorCodes);
    if (config) {
      return {
        errorTitle: intl.formatMessage({
          id: config.titleId,
          defaultMessage: config.defaultTitle,
        }),
        errorMessage: intl.formatMessage({
          id: config.messageId,
          defaultMessage: config.defaultMessage,
        }),
      };
    }
  }

  // Handle worker validation errors using Map
  if (errorCode === ErrorCodes.WORKER_VALIDATION_FAILED) {
    const contextKey =
      groupDrawerContext === GroupDrawerContext.CreateGroup
        ? GroupDrawerContext.CreateGroup
        : 'default';
    const sourceKey = source || 'default';

    // Try specific context|source combination first, then fallback to generic
    const messageConfig =
      WORKER_VALIDATION_MESSAGES.get(`${contextKey}|${sourceKey}`) ||
      WORKER_VALIDATION_MESSAGES.get('default');

    if (messageConfig) {
      return {
        errorTitle: intl.formatMessage({
          id: messageConfig.messageId,
          defaultMessage: messageConfig.defaultMessage,
        }),
        errorMessage: error,
      };
    }
  }

  // General error
  return {
    errorTitle: intl.formatMessage({
      id: 'groups.drawer.error.general.title',
      defaultMessage: "We couldn't save your recent change",
    }),
    errorMessage:
      error ||
      intl.formatMessage({
        id: 'groups.drawer.error.general.message',
        defaultMessage: 'Try saving your change again.',
      }),
  };
};

/**
 * Check if there are unsaved changes in Create Group mode
 */
export const hasUnsavedChangesInCreateMode = (
  groupName: string,
  selectedMembers: Record<string, TimeTracking_TimeForInput>,
  selectedLeads: Record<string, TimeTracking_TimeForInput>,
): boolean =>
  groupName.trim().length > 0 ||
  Object.keys(selectedMembers).length > 0 ||
  Object.keys(selectedLeads).length > 0;

/**
 * Check if there are unsaved changes in Quick Action mode
 * Only checks the relevant selection based on mode
 *
 * @param initialSelection - Initial selection state (members or leads based on mode)
 * @param currentSelection - Current selection state (members or leads based on mode)
 * @returns true if there are changes, false otherwise
 */
export const hasUnsavedChangesInWorkersOrLeadsSelections = (
  initialSelection: Record<string, TimeTracking_TimeForInput>,
  currentSelection: Record<string, TimeTracking_TimeForInput>,
): boolean => {
  const initialIds = new Set(Object.keys(initialSelection));
  const currentIds = new Set(Object.keys(currentSelection));

  if (initialIds.size !== currentIds.size) return true;

  if (Array.from(currentIds).some((id) => !initialIds.has(id))) return true;

  if (Array.from(initialIds).some((id) => !currentIds.has(id))) return true;

  return false;
};

/**
 * Partial success error result
 * Partial Success Handling for Group Assignments
 */
export interface PartialSuccessError {
  errorTitle: string;
  errorMessage: string;
}

/**
 * Builds error notification for partial success scenarios
 * Handles two cases:
 * 1. All failures are inactive workers - shows bulleted list of worker names
 * 2. Mixed error types - shows failed count
 *
 * Partial Success Handling for Group Assignments
 *
 * @param successfulCount - Number of workers successfully assigned/removed
 * @param failedCount - Number of workers that failed
 * @param failures - Array of failure objects with errorCode and errorMessage
 * @param operationType - 'assign' or 'remove'
 * @param workerType - 'workers' or 'leads' - specifies the type being processed
 * @param intl - Internationalization object
 * @returns PartialSuccessError with errorTitle and errorMessage
 *
 * @example
 * // All inactive workers
 * const failures = [
 *   { errorCode: 'WORKER_VALIDATION_FAILED', errorMessage: "Worker 'John' is inactive" }
 * ];
 * buildPartialSuccessError(8, 2, failures, 'assign', 'workers', intl);
 * // Returns: {
 * //   errorTitle: "We could only assign 8 workers. Try saving your change again.",
 * //   errorMessage: "We could not assign the following workers:\n- John\n- Jane"
 * // }
 *
 * @example
 * // Inactive leads
 * buildPartialSuccessError(2, 1, failures, 'assign', 'leads', intl);
 * // Returns: {
 * //   errorTitle: "We could only assign 2 workers. Try saving your change again.",
 * //   errorMessage: "We could not assign the following leads:\n- Lead Manager"
 * // }
 */
export const buildPartialSuccessError = (
  successfulCount: number,
  failedCount: number,
  failures: Array<{ errorCode: string | null; errorMessage: string | null }>,
  operationType: OperationAction,
  workerType: WorkerSelectionMode,
  intl: any,
): PartialSuccessError => {
  // Build NLS key suffix based on workerType
  const typeSuffix =
    workerType === WorkerSelectionMode.Workers ? '_workers' : '_leads';

  // Check if ALL failures are inactive worker errors
  if (areAllInactiveWorkerErrors(failures)) {
    return {
      errorTitle: intl.formatMessage(
        { id: `groups.errors.partial_inactive_title${typeSuffix}` },
        {
          count: successfulCount,
          operation: operationType,
        },
      ),
      errorMessage: buildInactiveWorkersErrorMessage(
        failures,
        operationType,
        workerType,
      ),
    };
  }

  // Other types of errors
  return {
    errorTitle: intl.formatMessage(
      { id: `groups.errors.partial_other_title${typeSuffix}` },
      {
        count: successfulCount,
        operation: operationType,
      },
    ),
    errorMessage: intl.formatMessage(
      { id: `groups.errors.partial_other_message${typeSuffix}` },
      {
        count: failedCount,
        operation: operationType,
      },
    ),
  };
};

/**
 * Builds error notification for combined partial success (both members and leads)
 * For Create Group when both have partial success
 *
 * @param successfulWorkersCount - Number of workers successfully assigned
 * @param successfulLeadsCount - Number of leads successfully assigned
 * @param memberFailures - Array of member failure objects
 * @param leadFailures - Array of lead failure objects
 * @param operationType - 'assign' or 'remove'
 * @param intl - Internationalization object
 * @returns PartialSuccessError with combined title and message
 */
export const buildCombinedPartialSuccessError = (
  successfulWorkersCount: number,
  successfulLeadsCount: number,
  memberFailures: Array<{
    errorCode: string | null;
    errorMessage: string | null;
  }>,
  leadFailures: Array<{
    errorCode: string | null;
    errorMessage: string | null;
  }>,
  operationType: OperationAction,
  intl: any,
): PartialSuccessError => {
  const allMembersInactive = areAllInactiveWorkerErrors(memberFailures);
  const allLeadsInactive = areAllInactiveWorkerErrors(leadFailures);

  // Build error title
  const errorTitle = intl.formatMessage(
    { id: 'groups.errors.combined_partial_title' },
    {
      workersCount: successfulWorkersCount,
      leadsCount: successfulLeadsCount,
      operation: operationType,
    },
  );

  // Build error message based on error types
  let errorMessage: string;

  if (allMembersInactive && allLeadsInactive) {
    // Both are inactive worker errors - show detailed names
    errorMessage = buildCombinedInactiveWorkersErrorMessage(
      memberFailures,
      leadFailures,
      operationType,
    );
  } else {
    // Mixed error types or other errors - show counts
    const memberFailedCount = memberFailures.length;
    const leadFailedCount = leadFailures.length;

    errorMessage = intl.formatMessage(
      { id: 'groups.errors.combined_partial_message' },
      {
        memberCount: memberFailedCount,
        leadCount: leadFailedCount,
        operation: operationType,
      },
    );
  }

  return {
    errorTitle,
    errorMessage,
  };
};

/**
 * Builds error notification for combined assign+remove partial success
 * For Edit Group when both assign and remove have partial success
 *
 * @param assignSuccessCount - Number of workers successfully assigned
 * @param assignFailedCount - Number of workers that failed to assign
 * @param removeSuccessCount - Number of workers successfully removed
 * @param removeFailedCount - Number of workers that failed to remove
 * @param assignFailures - Array of assign failure objects
 * @param removeFailures - Array of remove failure objects
 * @param workerType - 'workers' or 'leads'
 * @param intl - Internationalization object
 * @returns PartialSuccessError with combined title and message
 */
export const buildCombinedAssignRemovePartialSuccessError = (
  assignSuccessCount: number,
  assignFailedCount: number,
  removeSuccessCount: number,
  removeFailedCount: number,
  assignFailures: Array<{
    errorCode: string | null;
    errorMessage: string | null;
  }>,
  removeFailures: Array<{
    errorCode: string | null;
    errorMessage: string | null;
  }>,
  workerType: WorkerSelectionMode,
  intl: any,
): PartialSuccessError => {
  const allAssignInactive = areAllInactiveWorkerErrors(assignFailures);
  const allRemoveInactive = areAllInactiveWorkerErrors(removeFailures);

  // Build error title
  const errorTitle = intl.formatMessage(
    { id: 'groups.errors.combined_assign_remove_title' },
    {
      assignCount: assignSuccessCount,
      removeCount: removeSuccessCount,
      workerType,
    },
  );

  // Build error message based on error types
  let errorMessage: string;

  if (allAssignInactive && allRemoveInactive) {
    // Both are inactive worker errors - show detailed names
    errorMessage = buildCombinedAssignRemoveInactiveErrorMessage(
      assignFailures,
      removeFailures,
      workerType,
    );
  } else {
    // Mixed error types or other errors - show counts
    errorMessage = intl.formatMessage(
      { id: 'groups.errors.combined_assign_remove_message' },
      {
        assignFailedCount,
        removeFailedCount,
        workerType,
      },
    );
  }

  return {
    errorTitle,
    errorMessage,
  };
};

/**
 * Result of checking for partial success in group creation
 */
export interface PartialSuccessCheckResult {
  /** Whether partial success was detected */
  hasPartialSuccess: boolean;
  /** Error details if partial success occurred */
  error?: PartialSuccessError;
  /** Logging details for tracking */
  logDetails?: {
    scenario: 'both' | 'members' | 'leads';
    membersAssigned?: number;
    membersFailed?: number;
    leadsAssigned?: number;
    leadsFailed?: number;
    memberFailures?: Array<{
      errorCode: string | null;
      errorMessage: string | null;
    }>;
    leadFailures?: Array<{
      errorCode: string | null;
      errorMessage: string | null;
    }>;
  };
}

/**
 * Checks for partial success in group creation and builds appropriate error
 * Extracts partial success handling logic for reusability
 *
 * @param result - Result from group creation with assignments
 * @param intl - Internationalization object
 * @returns PartialSuccessCheckResult with detection flag, error details, and log info
 *
 * @example
 * Both members and leads partial success
 * const check = handleGroupCreationPartialSuccess(result, intl);
 * if (check.hasPartialSuccess) {
 *   dispatch(setDrawerError(check.error));
 *   logger.warn('Partial success', check.logDetails);
 * }
 */
export const handleGroupCreationPartialSuccess = (
  result: CreateGroupWithAssignmentsResult,
  intl: any,
): PartialSuccessCheckResult => {
  const membersPartialSuccess = result.memberAssignments?.partialSuccess;
  const leadsPartialSuccess = result.leadAssignments?.partialSuccess;

  if (!membersPartialSuccess && !leadsPartialSuccess) {
    return { hasPartialSuccess: false };
  }

  if (membersPartialSuccess && leadsPartialSuccess) {
    // CASE 1: Both members and leads have partial success
    const successfulWorkersCount =
      result.memberAssignments?.membersAssigned || 0;
    const successfulLeadsCount = result.leadAssignments?.leadsAssigned || 0;
    const memberFailures = result.memberAssignments?.failures || [];
    const leadFailures = result.leadAssignments?.failures || [];

    const error = buildCombinedPartialSuccessError(
      successfulWorkersCount,
      successfulLeadsCount,
      memberFailures,
      leadFailures,
      OperationAction.Assign,
      intl,
    );

    return {
      hasPartialSuccess: true,
      error,
      logDetails: {
        scenario: 'both',
        membersAssigned: successfulWorkersCount,
        membersFailed: memberFailures.length,
        leadsAssigned: successfulLeadsCount,
        leadsFailed: leadFailures.length,
        memberFailures,
        leadFailures,
      },
    };
  }
  if (membersPartialSuccess) {
    // CASE 2: Only members have partial success
    const successfulCount = result.memberAssignments?.membersAssigned || 0;
    const failedCount = result.memberAssignments?.membersFailed || 0;
    const failures = result.memberAssignments?.failures || [];

    const error = buildPartialSuccessError(
      successfulCount,
      failedCount,
      failures,
      OperationAction.Assign,
      WorkerSelectionMode.Workers,
      intl,
    );

    return {
      hasPartialSuccess: true,
      error,
      logDetails: {
        scenario: 'members',
        membersAssigned: successfulCount,
        membersFailed: failedCount,
        memberFailures: failures,
      },
    };
  }
  // CASE 3: Only leads have partial success
  const successfulCount = result.leadAssignments?.leadsAssigned || 0;
  const failedCount = result.leadAssignments?.leadsFailed || 0;
  const failures = result.leadAssignments?.failures || [];

  const error = buildPartialSuccessError(
    successfulCount,
    failedCount,
    failures,
    OperationAction.Assign,
    WorkerSelectionMode.Leads,
    intl,
  );

  return {
    hasPartialSuccess: true,
    error,
    logDetails: {
      scenario: 'leads',
      leadsAssigned: successfulCount,
      leadsFailed: failedCount,
      leadFailures: failures,
    },
  };
};

/**
 * Sanitizes error messages before displaying to users
 * Can be enhanced later to handle more specific error messages
 *
 * @param error - The error object or string to clean
 * @returns The cleaned error, or the original error if not applicable
 */
export const sanitizeErrorMessage = (error: any): any => {
  if (!error) return error;

  // If error is a string and specifies error is originating from TSheets
  if (typeof error === 'string') {
    return error.replace(TSHEETS_STRING, '');
  }

  return error;
};
