// Types for group creation with parallel assignment orchestration
// Used by useGroupWithAssignments hook for creating groups with members and/or managers

import { TimeTracking_TimeForInput } from 'src/__generated__/timeTracking/graphql';
import {
  AssignmentFailure,
  ManagerAssignmentFailure,
} from 'src/js/service/hooks/groups';
import { ErrorSource } from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';

/**
 * Input parameters for creating a group with optional member and lead assignments
 */
export interface CreateGroupWithAssignmentsInput {
  /** Name of the group to create */
  groupName: string;
  /** Optional array of members to assign to the group */
  members?: TimeTracking_TimeForInput[];
  /** Optional array of leads/managers to assign to the group */
  leads?: TimeTracking_TimeForInput[];
}

/**
 * Result of the group creation with assignments operation
 * Includes details about the created group and assignment outcomes
 */
export interface CreateGroupWithAssignmentsResult {
  /** Whether the overall operation was successful */
  success: boolean;
  /** ID of the created group */
  groupId?: string;
  /** Name of the created group */
  groupName?: string;
  /** Error details if any operation failed */
  errors?: {
    /** Error message from group creation */
    createError?: string;
    /** Error code from group creation */
    createErrorCode?: string;
    /** Error message from member assignment */
    membersError?: string;
    /** Error code from member assignment */
    membersErrorCode?: string;
    /** Error message from managers assignment */
    managersError?: string;
    /** Error code from managers assignment */
    managersErrorCode?: string;
  };
  /** Details about member assignment results */
  memberAssignments?: {
    /** Number of members successfully assigned */
    membersAssigned: number;
    /** Number of members that failed assignment */
    membersFailed: number;
    /** Whether some members succeeded and others failed */
    partialSuccess?: boolean;
    /** Array of individual assignment failures */
    failures?: AssignmentFailure[];
  };
  /** Details about lead/manager assignment results */
  leadAssignments?: {
    /** Number of leads successfully assigned */
    leadsAssigned: number;
    /** Number of leads that failed assignment */
    leadsFailed: number;
    /** Whether some leads succeeded and others failed */
    partialSuccess?: boolean;
    /** Array of individual assignment failures */
    failures?: ManagerAssignmentFailure[];
  };
}

/**
 * Configuration options for useGroupWithAssignments hook
 * Both callbacks are required for proper error and success handling
 */
export interface UseGroupWithAssignmentsArgs {
  /** Callback invoked when the entire operation completes successfully */
  onSuccess: (result: CreateGroupWithAssignmentsResult) => void;
  /** Callback invoked when any operation fails (includes errorCode and source) */
  onError: (error: string, errorCode?: string, source?: ErrorSource) => void;
}
