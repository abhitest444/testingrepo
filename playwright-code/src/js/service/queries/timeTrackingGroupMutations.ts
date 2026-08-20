/* eslint-disable no-unused-expressions */

import gql from 'graphql-tag';

/**
 * CREATE_GROUP_MUTATION
 *
 * Creates a new group in the time tracking system.
 *
 * @input TimeTracking_CreateGroupInput - Contains the group name
 * @returns Union type: TimeTracking_CreateGroupPayload | TimeTracking_CreateGroupError
 *
 * Success Response:
 * - successCode: Success status code
 * - group: Created group with id, name, isActive, and metadata
 *
 * Error Codes:
 * - GENERAL_ERROR: A general error occurred
 * - GROUP_NAME_ALREADY_EXISTS: Group name must be unique within company
 * - INVALID_GROUP_NAME: Name is empty, too long (>60 chars), or invalid characters
 */
export const CREATE_GROUP_MUTATION = gql`
  mutation createGroup($input: TimeTracking_CreateGroupInput!) {
    timeTrackingCreateGroup(input: $input) {
      ... on TimeTracking_CreateGroupPayload {
        successCode
        group {
          id
          name
          isActive
          meta {
            createdAt
            updatedAt
            version
          }
        }
      }
      ... on TimeTracking_CreateGroupError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

/**
 * ASSIGN_GROUP_MEMBERS_MUTATION
 *
 * Assigns members to a group. Supports bulk operations with partial success reporting.
 *
 * **Key Business Rule:** Workers can only be members of ONE active group at a time.
 * If a worker is already a member of another active group, that assignment must be removed first.
 *
 * @input TimeTracking_AssignGroupMembersInput
 *   - groupId: Unique identifier of the group
 *   - members: List of workers to assign (TimeTracking_TimeForInput[])
 *
 * @returns Union type TimeTracking_AssignGroupMembersResult with two possible types:
 *   - TimeTracking_AssignGroupMembersPayload: Success (successCode: SUCCESS or PARTIAL_SUCCESS)
 *     - SUCCESS: All members assigned successfully
 *     - PARTIAL_SUCCESS: Some members assigned, some failed (check assignmentResults for details)
 *   - TimeTracking_AssignGroupMembersError: Complete failure
 *
 * Payload Response:
 * - successCode: SUCCESS or PARTIAL_SUCCESS
 * - group: Updated group with id, name, version, memberCount
 * - assignmentResults: Array of individual assignment results (Success or Error per worker)
 *
 * Each assignmentResult is a union of:
 * - TimeTracking_GroupMemberAssignmentSuccess: Contains worker info
 * - TimeTracking_GroupMemberAssignmentError: Contains workerId, errorCode, message
 *
 * Error Response:
 * - message: Human-readable error message
 * - errorCode: Machine-readable error code (GENERAL_ERROR, GROUP_NOT_FOUND, etc.)
 */
export const ASSIGN_GROUP_MEMBERS_MUTATION = gql`
  mutation AssignGroupMembers($input: TimeTracking_AssignGroupMembersInput!) {
    timeTrackingAssignGroupMembers(input: $input) {
      ... on TimeTracking_AssignGroupMembersPayload {
        __typename
        successCode
        group {
          id
          name
          meta {
            version
          }
          stats {
            memberCount
          }
        }
        assignmentResults {
          ... on TimeTracking_GroupMemberAssignmentSuccess {
            __typename
            worker {
              id
              displayName
              type
            }
          }
          ... on TimeTracking_GroupMemberAssignmentError {
            __typename
            workerId
            errorCode
            errorMessage
          }
        }
      }
      ... on TimeTracking_AssignGroupMembersError {
        __typename
        message
        errorCode
      }
    }
  }
`;

/**
 * ASSIGN_GROUP_MANAGERS_MUTATION
 *
 * Assigns managers to a group. Supports bulk operations with partial success reporting.
 *
 * **Key Business Rule:** A worker can manage MULTIPLE groups simultaneously.
 * Managers do NOT need to be members of the group they manage.
 *
 * @input TimeTracking_AssignGroupManagersInput
 *   - groupId: Unique identifier of the group
 *   - managers: List of workers to assign as managers (TimeTracking_TimeForInput[])
 *
 * @returns Union type TimeTracking_AssignGroupManagersResult with two possible types:
 *   - TimeTracking_AssignGroupManagersPayload: Success (successCode: SUCCESS or PARTIAL_SUCCESS)
 *     - SUCCESS: All managers assigned successfully
 *     - PARTIAL_SUCCESS: Some managers assigned, some failed (check managerAssignResults for details)
 *   - TimeTracking_AssignGroupManagersError: Complete failure
 *
 * Payload Response:
 * - successCode: SUCCESS or PARTIAL_SUCCESS
 * - group: Updated group with id, name, stats (memberCount, managerCount)
 * - managerAssignResults: Array of individual assignment results (Success or Error per worker)
 *
 * Each managerAssignResult is a union of:
 * - TimeTracking_AssignedGroupManager: Contains worker info
 * - TimeTracking_GroupManagerAssignmentError: Contains workerId, errorCode, errorMessage
 *
 * Error Response:
 * - errorMessage: Human-readable error message
 * - errorCode: Machine-readable error code (GENERAL_ERROR, GROUP_NOT_FOUND, etc.)
 */
export const ASSIGN_GROUP_MANAGERS_MUTATION = gql`
  mutation assignGroupManagers($input: TimeTracking_AssignGroupManagersInput!) {
    timeTrackingAssignGroupManagers(input: $input) {
      __typename
      ... on TimeTracking_AssignGroupManagersPayload {
        successCode
        group {
          id
          name
          isActive
          stats {
            memberCount
            managerCount
          }
        }
        assignmentResults {
          __typename
          ... on TimeTracking_GroupManagerAssignmentSuccess {
            worker {
              id
              type
              isActive
              firstName
              lastName
              displayName
              identityAuthId
              intuitProfileId
            }
          }
          ... on TimeTracking_GroupManagerAssignmentError {
            workerId
            errorCode
            errorMessage
          }
        }
      }
      ... on TimeTracking_AssignGroupManagersError {
        errorCode
        message
      }
    }
  }
`;

/**
 * REMOVE_GROUP_MEMBERS_MUTATION
 *
 * Removes members from a group. Supports bulk operations with partial success reporting.
 *
 * **Key Business Rule:** Workers can only be members of ONE active group at a time.
 * Removing a member frees them up to be assigned to another group.
 *
 * @input TimeTracking_RemoveGroupMembersInput
 *   - groupId: Unique identifier of the group
 *   - members: List of workers to remove from the group (TimeTracking_TimeForInput[])
 *
 * @returns Union type TimeTracking_RemoveGroupMembersResult with two possible types:
 *   - TimeTracking_RemoveGroupMembersPayload: Success (successCode: SUCCESS or PARTIAL_SUCCESS)
 *     - SUCCESS: All members removed successfully
 *     - PARTIAL_SUCCESS: Some members removed, some failed (check removalResults for details)
 *   - TimeTracking_RemoveGroupMembersError: Complete failure
 *
 * Payload Response:
 * - successCode: SUCCESS or PARTIAL_SUCCESS
 * - group: Updated group with id, name, version, memberCount
 * - removalResults: Array of individual removal results (Success or Error per worker)
 *
 * Each removalResult is a union of:
 * - TimeTracking_GroupMemberRemovalSuccess: Contains worker info
 * - TimeTracking_GroupMemberRemovalError: Contains workerId, errorCode, errorMessage
 *
 * Error Response:
 * - message: Human-readable error message
 * - errorCode: Machine-readable error code (GENERAL_ERROR, GROUP_NOT_FOUND, etc.)
 */
export const REMOVE_GROUP_MEMBERS_MUTATION = gql`
  mutation RemoveGroupMembers($input: TimeTracking_RemoveGroupMembersInput!) {
    timeTrackingRemoveGroupMembers(input: $input) {
      __typename
      ... on TimeTracking_RemoveGroupMembersPayload {
        successCode
        group {
          id
          name
          meta {
            version
          }
          stats {
            memberCount
          }
        }
        removalResults {
          __typename
          ... on TimeTracking_GroupMemberRemovalSuccess {
            worker {
              id
              type
              isActive
              firstName
              lastName
              displayName
            }
          }
          ... on TimeTracking_GroupMemberRemovalError {
            workerId
            errorCode
            errorMessage
          }
        }
      }
      ... on TimeTracking_RemoveGroupMembersError {
        __typename
        errorCode
        message
      }
    }
  }
`;

/**
 * REMOVE_GROUP_MANAGERS_MUTATION
 *
 * Removes managers from a group. Supports bulk operations with partial success reporting.
 *
 * **Key Business Rule:** Removing manager permissions does NOT affect the worker's
 * membership in the group (if they are also a member).
 *
 * @input TimeTracking_RemoveGroupManagersInput
 *   - groupId: Unique identifier of the group
 *   - managers: List of workers to remove as managers (TimeTracking_TimeForInput[])
 *
 * @returns Union type TimeTracking_RemoveGroupManagersResult with two possible types:
 *   - TimeTracking_RemoveGroupManagersPayload: Success (successCode: SUCCESS or PARTIAL_SUCCESS)
 *     - SUCCESS: All managers removed successfully
 *     - PARTIAL_SUCCESS: Some managers removed, some failed (check managerRemovalResults for details)
 *   - TimeTracking_RemoveGroupManagersError: Complete failure
 *
 * Payload Response:
 * - successCode: SUCCESS or PARTIAL_SUCCESS
 * - group: Updated group with id, name, stats (memberCount, managerCount)
 * - managerRemovalResults: Array of individual removal results (Success or Error per worker)
 *
 * Each managerRemovalResult is a union of:
 * - TimeTracking_RemovedGroupManager: Contains worker info
 * - TimeTracking_GroupManagerRemovalError: Contains workerId, errorCode, errorMessage
 *
 * Error Response:
 * - errorMessage: Human-readable error message
 * - errorCode: Machine-readable error code (GENERAL_ERROR, GROUP_NOT_FOUND, etc.)
 */
export const REMOVE_GROUP_MANAGERS_MUTATION = gql`
  mutation removeGroupManagers($input: TimeTracking_RemoveGroupManagersInput!) {
    timeTrackingRemoveGroupManagers(input: $input) {
      __typename
      ... on TimeTracking_RemoveGroupManagersPayload {
        successCode
        group {
          id
          name
          isActive
          stats {
            memberCount
            managerCount
          }
        }
        removalResults {
          __typename
          ... on TimeTracking_GroupManagerRemovalSuccess {
            worker {
              id
              type
              isActive
              firstName
              lastName
              displayName
              identityAuthId
              intuitProfileId
            }
          }
          ... on TimeTracking_GroupManagerRemovalError {
            workerId
            errorCode
            errorMessage
          }
        }
      }
      ... on TimeTracking_RemoveGroupManagersError {
        errorCode
        message
      }
    }
  }
`;

/**
 * DELETE_GROUP_MUTATION
 *
 * Soft-deletes a group by setting isActive to false.
 *
 * **Key Business Rules:**
 * - This is a soft delete - the group is marked inactive but not removed from the database
 * - Deleted groups are excluded from default queries
 * - Requires version number for optimistic concurrency control
 * - All member and manager assignments are automatically removed when a group is deleted
 *
 * @input TimeTracking_DeleteGroupInput
 *   - id: Unique identifier of the group to delete
 *   - version: Version of the group being deleted (for optimistic locking)
 *
 * @returns Union type TimeTracking_DeleteGroupResult with two possible types:
 *   - TimeTracking_DeleteGroupPayload: Success (successCode: SUCCESS)
 *   - TimeTracking_DeleteGroupError: Failure
 *
 * Success Response:
 * - successCode: SUCCESS - The group was deleted successfully
 * - group: Deleted group with id, name, isActive=false, and updated metadata
 *
 * Error Codes:
 * - GENERAL_ERROR: A general error occurred
 * - GROUP_NOT_FOUND: The specified group does not exist or is already deleted
 * - VERSION_MISMATCH: The provided version doesn't match the current version (optimistic lock failure)
 */
export const DELETE_GROUP_MUTATION = gql`
  mutation deleteGroup($input: TimeTracking_DeleteGroupInput!) {
    timeTrackingDeleteGroup(input: $input) {
      __typename
      ... on TimeTracking_DeleteGroupPayload {
        successCode
        group {
          id
          name
          isActive
          meta {
            createdAt
            updatedAt
            version
          }
        }
      }
      ... on TimeTracking_DeleteGroupError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

/**
 * Mutation to update group properties
 * Primarily used for updating group name
 * Uses optimistic locking with version field to prevent concurrent modifications
 *
 * QUANTA-5495 (UI-019): Update Group Mutation & Custom Hook
 */
export const UPDATE_GROUP_MUTATION = gql`
  mutation UpdateGroup($input: TimeTracking_UpdateGroupInput!) {
    timeTrackingUpdateGroup(input: $input) {
      __typename
      ... on TimeTracking_UpdateGroupPayload {
        successCode
        group {
          id
          name
          isActive
          meta {
            version
          }
          stats {
            memberCount
            managerCount
          }
        }
      }
      ... on TimeTracking_UpdateGroupError {
        errorCode
        message
      }
    }
  }
`;
