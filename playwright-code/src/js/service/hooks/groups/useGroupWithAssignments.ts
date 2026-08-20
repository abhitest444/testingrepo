import { useCallback, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  TimeTracking_TimeForInput,
  TimeTracking_Group,
} from 'src/__generated__/timeTracking/graphql';
import {
  createCustomerInteraction,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  ErrorSource,
  OperationType,
} from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';
import { parseAssignmentResponse } from 'src/js/widgets/assignments/utils/helpers';
import {
  CreateGroupWithAssignmentsInput,
  CreateGroupWithAssignmentsResult,
  UseGroupWithAssignmentsArgs,
} from 'src/js/service/types/groupOrchestrationTypes';
import { useCreateGroup } from './useCreateGroup';
import {
  useAssignGroupMembers,
  AssignGroupMembersResult,
} from './useAssignGroupMembers';
import {
  useAssignGroupManagers,
  AssignGroupManagersResult,
} from './useAssignGroupManagers';

/**
 * Custom hook for creating a group with assignments (members and/or managers)
 *
 * Orchestrates mutations with mixed serial/parallel execution:
 * 1. Create Group (serial - must succeed first)
 * 2. Assign Members & Assign Managers (parallel - only if create succeeds and provided)
 *
 * Features:
 * - Mixed execution strategy (serial group creation, parallel assignments)
 * - Comprehensive error handling for all operations
 * - Partial success support for both assignments
 * - Customer interaction tracking
 * - Logging for all stages
 * - Error state tracking
 *
 * QUANTA-5494 (UI-018): Mutation Orchestration with Parallel Assignments
 *
 * @param options - Required callbacks for success and error handling (onSuccess and onError are mandatory)
 * @returns Object with createGroupWithAssignments function, loading state, and error state
 *
 * @example
 * ```typescript
 * const { createGroupWithAssignments, loading, error } = useGroupWithAssignments({
 *   onSuccess: (result) => {
 *     if (result.memberAssignments?.membersFailed) {
 *       console.log(`Partial success: ${result.memberAssignments.membersAssigned} assigned`);
 *     } else {
 *       console.log('All assignments successful!');
 *     }
 *   },
 *   onError: (error, errorCode, source) => console.error('Failed:', error, errorCode, source),
 * });
 *
 * await createGroupWithAssignments({
 *   groupName: 'Midwest Team',
 *   members: [
 *     { id: 'worker-1', timeForType: 'EMPLOYEE' },
 *     { id: 'worker-2', timeForType: 'CONTRACTOR' },
 *   ],
 *   leads: [{ id: 'worker-3', timeForType: 'EMPLOYEE' }], // Future use
 * });
 * ```
 */
export const useGroupWithAssignments = ({
  onSuccess,
  onError,
}: UseGroupWithAssignmentsArgs) => {
  const sandbox = useSandbox();

  // Store input data for use in onSuccess callback
  // (needed because useCreateGroup callbacks are configured at hook level, not per-call)
  const inputDataRef = useRef<{
    members: TimeTracking_TimeForInput[];
    leads: TimeTracking_TimeForInput[];
  } | null>(null);

  // Set up the assign members mutation with logging-only callbacks
  const [assignMembersMutation, { loading: assigningMembers }] =
    useAssignGroupMembers({
      onSuccess: (result: AssignGroupMembersResult) => {
        sandbox.logger.info(
          'Component=useGroupWithAssignments Event=Members assigned successfully',
          { result },
        );
      },
      onError: (errorMsg: string, errorCode?: string) => {
        sandbox.logger.error(
          'Component=useGroupWithAssignments Event=Error assigning members',
          { error: errorMsg, errorCode },
        );
      },
    });

  // Set up the assign managers mutation with logging-only callbacks
  const [assignManagersMutation, { loading: assigningManagers }] =
    useAssignGroupManagers({
      onSuccess: (result: AssignGroupManagersResult) => {
        sandbox.logger.info(
          'Component=useGroupWithAssignments Event=Managers assigned successfully',
          { result },
        );
      },
      onError: (errorMsg: string, errorCode?: string) => {
        sandbox.logger.error(
          'Component=useGroupWithAssignments Event=Error assigning managers',
          { error: errorMsg, errorCode },
        );
      },
    });

  // Handle successful group creation and trigger assignments
  const handleGroupCreated = useCallback(
    async (group: TimeTracking_Group) => {
      sandbox.logger.info(
        'Component=useGroupWithAssignments Event=Group created successfully',
        { groupId: group.id, groupName: group.name },
      );

      const { id: groupId, name: createdGroupName } = group;
      const { members = [], leads = [] } = inputDataRef.current || {};

      const hasMembers = members.length > 0;
      const hasLeads = leads.length > 0;

      // No assignments to make - return success
      if (!hasMembers && !hasLeads) {
        const result: CreateGroupWithAssignmentsResult = {
          success: true,
          groupId,
          groupName: createdGroupName,
        };

        onSuccess(result);
        return;
      }

      // ===== STEP 2: Assign Members & Managers (in parallel) =====
      if (hasMembers) {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        );
      }

      if (hasLeads) {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
        );
      }

      // Execute assignments in parallel using destructuring pattern
      const [membersResult, managersResult] = await Promise.allSettled([
        hasMembers
          ? assignMembersMutation({
              variables: { input: { groupId, members } },
            })
          : Promise.resolve(null),
        hasLeads
          ? assignManagersMutation({
              variables: { input: { groupId, managers: leads } },
            })
          : Promise.resolve(null),
      ]);

      // ===== STEP 3: Process Results from Promise.allSettled =====
      // Process member assignment result
      let memberAssignments: CreateGroupWithAssignmentsResult['memberAssignments'];
      if (hasMembers) {
        if (membersResult.status === 'rejected') {
          // Mutation was rejected (network/Apollo error)
          const error = membersResult.reason;
          const errorMsg =
            error instanceof Error ? error.message : 'Failed to assign members';
          onError(errorMsg, undefined, ErrorSource.AssignMembers);
          return;
        }
        if (membersResult.value) {
          // Mutation fulfilled - parse the response
          const membersAssignmentResponse = parseAssignmentResponse(
            membersResult.value,
            'timeTrackingAssignGroupMembers',
            OperationType.Members,
          );

          if ('error' in membersAssignmentResponse) {
            // GraphQL-level error (e.g., WORKER_VALIDATION_FAILED)
            onError(
              membersAssignmentResponse.error,
              membersAssignmentResponse.errorCode,
              ErrorSource.AssignMembers,
            );
            return;
          }
          // Success or partial success
          memberAssignments = {
            membersAssigned: membersAssignmentResponse.assignedCount,
            membersFailed: membersAssignmentResponse.failedCount,
            partialSuccess: membersAssignmentResponse.partialSuccess,
            failures: membersAssignmentResponse.failures,
          };
        }
      }

      // Process manager assignment result
      let leadAssignments: CreateGroupWithAssignmentsResult['leadAssignments'];
      if (hasLeads) {
        if (managersResult.status === 'rejected') {
          // Mutation was rejected (network/Apollo error)
          const error = managersResult.reason;
          const errorMsg =
            error instanceof Error
              ? error.message
              : 'Failed to assign managers';
          onError(errorMsg, undefined, ErrorSource.AssignManagers);
          return;
        }
        if (managersResult.value) {
          // Mutation fulfilled - parse the response
          const managersAssignmentResponse = parseAssignmentResponse(
            managersResult.value,
            'timeTrackingAssignGroupManagers',
            OperationType.Managers,
          );

          if ('error' in managersAssignmentResponse) {
            // GraphQL-level error (e.g., WORKER_VALIDATION_FAILED)
            onError(
              managersAssignmentResponse.error,
              managersAssignmentResponse.errorCode,
              ErrorSource.AssignManagers,
            );
            return;
          }
          // Success or partial success
          leadAssignments = {
            leadsAssigned: managersAssignmentResponse.assignedCount,
            leadsFailed: managersAssignmentResponse.failedCount,
            partialSuccess: managersAssignmentResponse.partialSuccess,
            failures: managersAssignmentResponse.failures,
          };
        }
      }

      const result: CreateGroupWithAssignmentsResult = {
        success: true,
        groupId,
        groupName: createdGroupName,
        memberAssignments,
        leadAssignments,
      };

      sandbox.logger.info(
        'Component=useGroupWithAssignments Event=Group created with assignments complete',
        { groupId, memberAssignments, leadAssignments },
      );

      onSuccess(result);
    },
    [assignMembersMutation, assignManagersMutation, onSuccess, onError],
  );

  // Set up the create group mutation - assignments handled in onSuccess
  const [createGroupMutation, { loading: creatingGroup }] = useCreateGroup({
    onSuccess: handleGroupCreated,
    onError: (errorMsg: string, errorCode?: string) => {
      sandbox.logger.error(
        'Component=useGroupWithAssignments Event=Error creating group',
        { error: errorMsg, errorCode },
      );
      onError(errorMsg, errorCode, ErrorSource.CreateGroup);
    },
  });

  /**
   * Main orchestration function
   * Stores input data and triggers group creation
   * Assignments are handled in the onSuccess callback
   */
  const createGroupWithAssignments = useCallback(
    async (input: CreateGroupWithAssignmentsInput): Promise<void> => {
      const { groupName, members = [], leads = [] } = input;

      // Store input data for use in onSuccess callback
      inputDataRef.current = { members, leads };

      try {
        // ===== STEP 1: Create Group =====
        // Capture trace headers immediately from the CI return value so they
        // can be passed per-call. getCustomerInteractionPropagationHeaders
        // cannot be used inside useCreateGroup's hook options because the CI
        // doesn't exist yet at render time.
        const createGroupCI = createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.GROUP_CREATE,
        );
        const traceHeaders = createGroupCI?.getTracePropagationHeaders() ?? {};

        // Create the group - assignments handled in onSuccess callback
        await createGroupMutation({
          variables: {
            input: { name: groupName.trim() },
          },
          context: {
            headers: traceHeaders,
          },
        });
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';

        sandbox.logger.error(
          'Component=useGroupWithAssignments Event=Unexpected error',
          { error, errorMsg },
        );

        // Don't pass source for unexpected errors
        onError(errorMsg);
      }
    },
    [createGroupMutation, onError],
  );

  return {
    createGroupWithAssignments,
    loading: creatingGroup || assigningMembers || assigningManagers,
  };
};
