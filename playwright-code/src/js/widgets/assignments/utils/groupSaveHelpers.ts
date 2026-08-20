/**
 * Helper functions for Edit Group Drawer save operations
 * Extracted to reduce code duplication and improve maintainability
 */

import { FetchResult } from '@apollo/client';
import {
  TimeTracking_TimeForInput,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import { Sandbox } from 'src/js/common/sandbox';
import {
  createCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { DrawerWorker } from '../store/workersGroupViewSlice';
import {
  ErrorSource,
  OperationType,
  OperationAction,
  WorkerSelectionMode,
} from '../types/Groups/GroupDrawer.types';
import {
  parseAssignmentResponse,
  parseRemovalResponse,
  AssignmentOperationResult,
  RemovalOperationResult,
  buildOperationMessage,
  buildCombinedAssignRemoveMessage,
  buildPartialSuccessError,
  buildCombinedAssignRemovePartialSuccessError,
} from './helpers';

/**
 * Helper to check if a result has partial success
 */
const hasPartialSuccess = (
  result: AssignmentOperationResult | RemovalOperationResult | null,
): boolean =>
  result !== null &&
  'partialSuccess' in result &&
  typeof result.partialSuccess === 'boolean' &&
  result.partialSuccess === true;

/**
 * Build list of selected workers from drawer state
 */
export function buildSelectedWorkers(
  drawerWorkersById: Record<string, DrawerWorker>,
): Record<string, TimeTracking_TimeForInput> {
  const selected: Record<string, TimeTracking_TimeForInput> = {};

  Object.values(drawerWorkersById).forEach((worker) => {
    if (worker.isSelected) {
      selected[worker.id] = {
        id: worker.id,
        timeForType: worker.type as TimeTracking_TimeForType,
      };
    }
  });

  return selected;
}

/**
 * Calculate additions and removals by comparing current vs initial state
 */
export function calculateChanges(
  currentSelected: Record<string, TimeTracking_TimeForInput>,
  initialSelected: Record<string, TimeTracking_TimeForInput>,
): {
  additions: TimeTracking_TimeForInput[];
  removals: TimeTracking_TimeForInput[];
} {
  const additionIds = Object.keys(currentSelected).filter(
    (id) => !(id in initialSelected),
  );
  const additions = additionIds.map((id) => currentSelected[id]);

  const removalIds = Object.keys(initialSelected).filter(
    (id) => !(id in currentSelected),
  );
  const removals = removalIds.map((id) => initialSelected[id]);

  return { additions, removals };
}

/**
 * Extract group counts from API response
 */
export function extractGroupCounts(results: any[]): {
  memberCount?: number;
  managerCount?: number;
} {
  const validResult = results.find((result) => {
    const assignData =
      result?.data?.timeTrackingAssignGroupMembers ||
      result?.data?.timeTrackingAssignGroupManagers;
    const removeData =
      result?.data?.timeTrackingRemoveGroupMembers ||
      result?.data?.timeTrackingRemoveGroupManagers;

    const groupData = assignData?.group || removeData?.group;

    return groupData?.stats;
  });

  if (validResult) {
    const assignData =
      validResult?.data?.timeTrackingAssignGroupMembers ||
      validResult?.data?.timeTrackingAssignGroupManagers;
    const removeData =
      validResult?.data?.timeTrackingRemoveGroupMembers ||
      validResult?.data?.timeTrackingRemoveGroupManagers;

    const groupData = assignData?.group || removeData?.group;

    return {
      memberCount: groupData.stats.memberCount,
      managerCount: groupData.stats.managerCount,
    };
  }

  return {};
}

/**
 * Configuration for save operation
 */
export interface SaveOperationConfig {
  operationType: OperationType;
  assignMutationField:
    | 'timeTrackingAssignGroupMembers'
    | 'timeTrackingAssignGroupManagers';
  removeMutationField:
    | 'timeTrackingRemoveGroupMembers'
    | 'timeTrackingRemoveGroupManagers';
  assignErrorSource: ErrorSource.AssignMembers | ErrorSource.AssignManagers;
  removeErrorSource: ErrorSource.RemoveMembers | ErrorSource.RemoveManagers;
  countField: 'memberCount' | 'managerCount';
  noChangesLogMessage: string;
  errorLogMessage: string;
}

/**
 * Result of save operation
 */
export interface SaveOperationResult {
  success: boolean;
  successMessage?: string;
  counts?: {
    memberCount?: number;
    managerCount?: number;
  };
}

/**
 * Generic function to handle save operations for both members and managers
 * Executes assign and/or remove mutations, parses results, and builds success messages
 *
 * @param config - Configuration for the operation (members vs managers)
 * @param params - Parameters including current state, mutations, and callbacks
 * @returns Promise resolving to SaveOperationResult
 */
export async function handleSaveOperation(
  config: SaveOperationConfig,
  params: {
    currentSelected: Record<string, TimeTracking_TimeForInput>;
    initialSelected: Record<string, TimeTracking_TimeForInput>;
    groupId: string;
    groupName: string;
    assignMutation: (variables: any) => Promise<FetchResult<any>>;
    removeMutation: (variables: any) => Promise<FetchResult<any>>;
    handleError: (
      error: string,
      errorCode?: string,
      source?: ErrorSource,
    ) => void;
    intl: any;
    logger: any;
    sandbox: Sandbox;
  },
): Promise<SaveOperationResult> {
  const {
    currentSelected,
    initialSelected,
    groupId,
    groupName,
    assignMutation,
    removeMutation,
    handleError,
    intl,
    logger,
    sandbox,
  } = params;

  const { additions, removals } = calculateChanges(
    currentSelected,
    initialSelected,
  );

  if (additions.length === 0 && removals.length === 0) {
    logger.info(config.noChangesLogMessage);
    // Return success: true with empty message so drawer closes without showing success toast
    return { success: true, successMessage: '' };
  }

  const promises: Promise<FetchResult<any>>[] = [];
  const promiseTypes: OperationAction[] = [];

  if (additions.length > 0) {
    // Create customer interaction before mutation for proper tracking lifecycle
    const assignInteraction =
      config.operationType === 'members'
        ? TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS
        : TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS;
    createCustomerInteraction(sandbox, assignInteraction);

    const inputField = config.operationType; // 'members' or 'managers'
    promises.push(
      assignMutation({
        variables: {
          input: {
            groupId,
            [inputField]: additions,
          },
        },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            assignInteraction,
          ),
        },
      }),
    );
    promiseTypes.push(OperationAction.Assign);
  }

  if (removals.length > 0) {
    // Create customer interaction before mutation for proper tracking lifecycle
    const removeInteraction =
      config.operationType === 'members'
        ? TimeCustomerInteraction.GROUP_REMOVE_MEMBERS
        : TimeCustomerInteraction.GROUP_REMOVE_MANAGERS;
    createCustomerInteraction(sandbox, removeInteraction);

    const inputField = config.operationType; // 'members' or 'managers'
    promises.push(
      removeMutation({
        variables: {
          input: {
            groupId,
            [inputField]: removals,
          },
        },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            removeInteraction,
          ),
        },
      }),
    );
    promiseTypes.push(OperationAction.Remove);
  }

  try {
    const results = await Promise.all(promises);

    // Parse results
    let assignResult: AssignmentOperationResult | null = null;
    let removeResult: RemovalOperationResult | null = null;

    results.forEach((result, index) => {
      const type = promiseTypes[index];
      if (type === OperationAction.Assign) {
        const parsed = parseAssignmentResponse(
          result,
          config.assignMutationField,
          config.operationType,
        );
        if ('error' in parsed) {
          handleError(parsed.error, parsed.errorCode, config.assignErrorSource);
          return;
        }
        assignResult = parsed;
      } else if (type === OperationAction.Remove) {
        const parsed = parseRemovalResponse(
          result,
          config.removeMutationField,
          config.operationType,
        );
        if ('error' in parsed) {
          handleError(parsed.error, parsed.errorCode, config.removeErrorSource);
          return;
        }
        removeResult = parsed;
      }
    });

    // If any operation failed, don't show success message
    if (!assignResult && !removeResult) {
      return { success: false };
    }

    // Check for partial success - handle assign and remove separately
    const assignPartialSuccess = hasPartialSuccess(assignResult);
    const removePartialSuccess = hasPartialSuccess(removeResult);

    if (assignPartialSuccess || removePartialSuccess) {
      // Type assertion to help TypeScript understand these are non-null after the early return check
      const assignOp = assignResult as AssignmentOperationResult | null;
      const removeOp = removeResult as RemovalOperationResult | null;

      // Determine worker type based on config.operationType
      // 'members' -> 'workers', 'managers' -> 'leads'
      const workerType: WorkerSelectionMode =
        config.operationType === 'members'
          ? WorkerSelectionMode.Workers
          : WorkerSelectionMode.Leads;

      let partialSuccessError: { errorTitle: string; errorMessage: string };

      if (assignPartialSuccess && removePartialSuccess) {
        // CASE 1: Both assign and remove have partial success
        const assignSuccessCount = assignOp?.assignedCount || 0;
        const assignFailedCount = assignOp?.failedCount || 0;
        const assignFailures = assignOp?.failures || [];

        const removeSuccessCount = removeOp?.removedCount || 0;
        const removeFailedCount = removeOp?.failedCount || 0;
        const removeFailures = removeOp?.failures || [];

        partialSuccessError = buildCombinedAssignRemovePartialSuccessError(
          assignSuccessCount,
          assignFailedCount,
          removeSuccessCount,
          removeFailedCount,
          assignFailures,
          removeFailures,
          workerType,
          intl,
        );

        // Log combined partial success
        logger.warn(
          'Component=handleSaveOperation Event=Partial success in both assign and remove',
          {
            assignSuccessCount,
            assignFailedCount,
            removeSuccessCount,
            removeFailedCount,
            assignFailures,
            removeFailures,
          },
        );
      } else if (assignPartialSuccess) {
        // CASE 2: Only assign has partial success
        const successCount = assignOp?.assignedCount || 0;
        const failedCount = assignOp?.failedCount || 0;
        const failures = assignOp?.failures || [];

        partialSuccessError = buildPartialSuccessError(
          successCount,
          failedCount,
          failures,
          OperationAction.Assign,
          workerType,
          intl,
        );

        // Log assign partial success
        logger.warn(
          'Component=handleSaveOperation Event=Partial success in assign',
          {
            successCount,
            failedCount,
            failures,
          },
        );
      } else {
        // CASE 3: Only remove has partial success
        const successCount = removeOp?.removedCount || 0;
        const failedCount = removeOp?.failedCount || 0;
        const failures = removeOp?.failures || [];

        partialSuccessError = buildPartialSuccessError(
          successCount,
          failedCount,
          failures,
          OperationAction.Remove,
          workerType,
          intl,
        );

        // Log remove partial success
        logger.warn(
          'Component=handleSaveOperation Event=Partial success in remove',
          {
            successCount,
            failedCount,
            failures,
          },
        );
      }

      // Extract counts even on partial success (some operations succeeded)
      const counts = extractGroupCounts(results);

      // Encode the error details as JSON string to pass through handleError
      // This allows us to pass both errorTitle and errorMessage through the existing error flow
      const errorPayload = JSON.stringify({
        errorTitle: partialSuccessError.errorTitle,
        errorMessage: partialSuccessError.errorMessage,
      });

      // Call handleError with special PARTIAL_SUCCESS error code
      // buildGroupErrorResult will detect this and decode the JSON payload
      handleError(
        errorPayload,
        'PARTIAL_SUCCESS',
        assignPartialSuccess
          ? config.assignErrorSource
          : config.removeErrorSource,
      );

      // Return counts so they can be updated even on partial success
      return { success: false, counts };
    }

    // Extract counts from raw GraphQL responses (not parsed results)
    const counts = extractGroupCounts(results);

    // Build success message based on results (full success only)
    let successMessage: string | null = null;

    if (assignResult && removeResult) {
      // Combined assign and remove operations
      successMessage = buildCombinedAssignRemoveMessage(
        assignResult,
        removeResult,
        config.operationType,
        groupName,
        intl,
      );
    } else if (assignResult) {
      // Assign operation only
      successMessage = buildOperationMessage(
        assignResult,
        OperationAction.Assign,
        config.operationType,
        groupName,
        intl,
      );
    } else if (removeResult) {
      // Remove operation only
      successMessage = buildOperationMessage(
        removeResult,
        OperationAction.Remove,
        config.operationType,
        groupName,
        intl,
      );
    }

    return {
      success: true,
      successMessage: successMessage || undefined,
      counts,
    };
  } catch (error) {
    logger.error(config.errorLogMessage, { error });
    return { success: false };
  }
}
