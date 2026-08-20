/**
 * Test suite for Workers Table Helpers
 * Unit tests for validation and utility functions
 */

import {
  validateGroupName,
  buildGroupCreationSuccessMessage,
  buildGroupErrorResult,
  parseAssignmentResponse,
  parseRemovalResponse,
  buildOperationMessage,
  buildCombinedAssignRemoveMessage,
  getWorkersEmptyStateTitle,
  convertWorkerTypeToApiTypes,
  hasUnsavedChangesInCreateMode,
  hasUnsavedChangesInWorkersOrLeadsSelections,
  encryptWorkerId,
  navigateToWorkerSettings,
  sanitizeErrorMessage,
  buildPartialSuccessError,
  buildCombinedPartialSuccessError,
  buildCombinedAssignRemovePartialSuccessError,
  handleGroupCreationPartialSuccess,
} from 'src/js/widgets/assignments/utils/helpers';
import {
  ErrorSource,
  OperationType,
  OperationAction,
  GroupDrawerContext,
  WorkerSelectionMode,
} from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';
import { WorkersEmptyStateContext } from 'src/js/widgets/assignments/types';
import { WorkerType } from 'src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/types';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

describe('Workers Table Helpers', () => {
  describe('validateGroupName', () => {
    const mockIntl = {
      formatMessage: (config: any) => config.defaultMessage || config.id,
    };

    test.each([
      {
        description: 'validates required field for empty string',
        input: '',
        expected: { isValid: false, errorMessage: 'Group name is required' },
      },
      {
        description: 'accepts valid group name',
        input: 'Engineering Team',
        expected: { isValid: true, errorMessage: undefined },
      },
      {
        description: 'trims whitespace for required validation',
        input: '   ',
        expected: { isValid: false, errorMessage: 'Group name is required' },
      },
    ])('$description', ({ input, expected }) => {
      const result = validateGroupName(input, mockIntl);
      expect(result.isValid).toBe(expected.isValid);
      if (expected.errorMessage !== undefined) {
        expect(result.errorMessage).toBe(expected.errorMessage);
      } else {
        expect(result.errorMessage).toBeUndefined();
      }
    });
  });

  describe('buildGroupCreationSuccessMessage', () => {
    const mockIntl = {
      formatMessage: (config: any, values: any) => {
        const messages: { [key: string]: string } = {
          'groups.drawer.success.created': `Group "${
            values?.name || ''
          }" created successfully`,
          'groups.drawer.success.created_with_members': `Group "${
            values?.name || ''
          }" created with ${values?.count} members assigned`,
          'groups.drawer.success.created_with_leads': `Group "${
            values?.name || ''
          }" created with ${values?.count} leads assigned`,
          'groups.drawer.success.created_with_members_and_leads': `Group "${
            values?.name || ''
          }" created with ${values?.membersCount} members and ${
            values?.leadsCount
          } leads assigned`,
        };
        return messages[config.id] || config.id;
      },
    };

    test('returns message for group created without assignments', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "Test Group" created successfully');
    });

    test('returns message for group created with members only (full success)', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
        memberAssignments: {
          membersAssigned: 5,
          membersFailed: 0,
          partialSuccess: false,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe(
        'Group "Test Group" created with 5 members assigned',
      );
    });

    test('returns message for group created with leads only (full success)', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
        leadAssignments: {
          leadsAssigned: 3,
          leadsFailed: 0,
          partialSuccess: false,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "Test Group" created with 3 leads assigned');
    });

    test('returns message for group created with both members and leads (full success)', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
        memberAssignments: {
          membersAssigned: 5,
          membersFailed: 0,
          partialSuccess: false,
        },
        leadAssignments: {
          leadsAssigned: 3,
          leadsFailed: 0,
          partialSuccess: false,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe(
        'Group "Test Group" created with 5 members and 3 leads assigned',
      );
    });

    test('returns message for group created with both members and leads with empty group name', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: '',
        memberAssignments: {
          membersAssigned: 5,
          membersFailed: 0,
          partialSuccess: false,
        },
        leadAssignments: {
          leadsAssigned: 3,
          leadsFailed: 0,
          partialSuccess: false,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe(
        'Group "" created with 5 members and 3 leads assigned',
      );
    });

    test('returns message for group created with members only with empty group name', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: '',
        memberAssignments: {
          membersAssigned: 5,
          membersFailed: 0,
          partialSuccess: false,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "" created with 5 members assigned');
    });

    test('returns message for group created with leads only with empty group name', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: '',
        leadAssignments: {
          leadsAssigned: 3,
          leadsFailed: 0,
          partialSuccess: false,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "" created with 3 leads assigned');
    });

    test('returns basic message when member assignment has partial success', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
        memberAssignments: {
          membersAssigned: 3,
          membersFailed: 2,
          partialSuccess: true,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "Test Group" created successfully');
    });

    test('returns basic message when lead assignment has partial success', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
        leadAssignments: {
          leadsAssigned: 2,
          leadsFailed: 1,
          partialSuccess: true,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "Test Group" created successfully');
    });

    test('returns message with leads only when member assignment is partial success', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
        memberAssignments: {
          membersAssigned: 3,
          membersFailed: 2,
          partialSuccess: true,
        },
        leadAssignments: {
          leadsAssigned: 2,
          leadsFailed: 0,
          partialSuccess: false,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "Test Group" created with 2 leads assigned');
    });

    test('returns message with members only when lead assignment is partial success', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
        memberAssignments: {
          membersAssigned: 5,
          membersFailed: 0,
          partialSuccess: false,
        },
        leadAssignments: {
          leadsAssigned: 1,
          leadsFailed: 1,
          partialSuccess: true,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe(
        'Group "Test Group" created with 5 members assigned',
      );
    });

    test('returns basic message when both assignments are partial success', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
        memberAssignments: {
          membersAssigned: 3,
          membersFailed: 2,
          partialSuccess: true,
        },
        leadAssignments: {
          leadsAssigned: 1,
          leadsFailed: 1,
          partialSuccess: true,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "Test Group" created successfully');
    });

    test('returns basic message when members assigned is 0', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
        memberAssignments: {
          membersAssigned: 0,
          membersFailed: 5,
          partialSuccess: false,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "Test Group" created successfully');
    });

    test('returns basic message when leads assigned is 0', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: 'Test Group',
        leadAssignments: {
          leadsAssigned: 0,
          leadsFailed: 3,
          partialSuccess: false,
        },
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "Test Group" created successfully');
    });

    test('handles empty group name', () => {
      const result = {
        success: true,
        groupId: '123',
        groupName: '',
      };

      const message = buildGroupCreationSuccessMessage(result, mockIntl);
      expect(message).toBe('Group "" created successfully');
    });
  });

  describe('buildGroupErrorResult', () => {
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const messages: { [key: string]: string } = {
          'groups.drawer.error.duplicate.title': 'Group Already Exists',
          'groups.drawer.error.duplicate.message':
            'A group with this name already exists in the company',
          'groups.drawer.error.version_conflict.title': 'Group Was Modified',
          'groups.drawer.error.version_conflict.message':
            'This group was modified by another user. Please refresh and try again.',
          'groups.drawer.error.insufficient_permissions.title':
            'Insufficient Permissions',
          'groups.drawer.error.insufficient_permissions.message':
            'You do not have permission to perform this action.',
          'groups.drawer.error.members_assignment_failed.title':
            'Group was created but members assignment failed',
          'groups.drawer.error.managers_assignment_failed.title':
            'Group was created but leads assignment failed',
          'groups.drawer.error.assignment_failed.title':
            'Group was created but assignment failed',
          'groups.assign_members.error': 'Failed to assign members',
          'groups.assign_managers.error': 'Failed to assign leads',
          'groups.remove_members.error': 'Failed to remove members',
          'groups.remove_managers.error': 'Failed to remove leads',
          'groups.drawer.error.general.title':
            "We couldn't save your recent change",
          'groups.drawer.error.general.message':
            'Try saving your change again.',
        };
        return messages[config.id] || config.defaultMessage || config.id;
      },
    };

    describe('Duplicate group name errors', () => {
      test('handles GROUP_NAME_ALREADY_EXISTS error code', () => {
        const error = 'A group with this name already exists';
        const { ErrorCodes } = require('src/js/widgets/assignments/types');
        const result = buildGroupErrorResult(
          error,
          ErrorCodes.GROUP_NAME_ALREADY_EXISTS,
          undefined,
          mockIntl,
        );

        expect(result.errorTitle).toBe('Group Already Exists');
        expect(result.errorMessage).toBe(
          'A group with this name already exists in the company',
        );
      });
    });

    describe('WORKER_VALIDATION_FAILED errors', () => {
      test('handles member assignment failure with source', () => {
        const error = 'Worker validation failed for member assignment';
        const errorCode = 'WORKER_VALIDATION_FAILED';
        const result = buildGroupErrorResult(
          error,
          errorCode,
          ErrorSource.AssignMembers,
          mockIntl,
          GroupDrawerContext.CreateGroup,
        );

        expect(result.errorTitle).toBe(
          'Group was created but members assignment failed',
        );
        expect(result.errorMessage).toBe(error);
      });

      test('handles manager assignment failure with source', () => {
        const error = 'Worker validation failed for manager assignment';
        const errorCode = 'WORKER_VALIDATION_FAILED';
        const result = buildGroupErrorResult(
          error,
          errorCode,
          ErrorSource.AssignManagers,
          mockIntl,
          GroupDrawerContext.CreateGroup,
        );

        expect(result.errorTitle).toBe(
          'Group was created but leads assignment failed',
        );
        expect(result.errorMessage).toBe(error);
      });

      test('handles assignment failure without source', () => {
        const error = 'Worker validation failed';
        const errorCode = 'WORKER_VALIDATION_FAILED';
        const result = buildGroupErrorResult(
          error,
          errorCode,
          undefined,
          mockIntl,
        );

        expect(result.errorTitle).toBe(
          'Group was created but assignment failed',
        );
        expect(result.errorMessage).toBe(error);
      });

      test('handles WORKER_VALIDATION_FAILED with createGroup source', () => {
        const error = 'Worker validation failed';
        const errorCode = 'WORKER_VALIDATION_FAILED';
        const result = buildGroupErrorResult(
          error,
          errorCode,
          ErrorSource.CreateGroup,
          mockIntl,
        );

        expect(result.errorTitle).toBe(
          'Group was created but assignment failed',
        );
        expect(result.errorMessage).toBe(error);
      });
    });

    describe('General errors', () => {
      test('handles general error with error message', () => {
        const error = 'Network timeout occurred';
        const result = buildGroupErrorResult(
          error,
          undefined,
          undefined,
          mockIntl,
        );

        expect(result.errorTitle).toBe("We couldn't save your recent change");
        expect(result.errorMessage).toBe('Network timeout occurred');
      });

      test('uses fallback message when error is empty', () => {
        const error = '';
        const result = buildGroupErrorResult(
          error,
          undefined,
          undefined,
          mockIntl,
        );

        expect(result.errorTitle).toBe("We couldn't save your recent change");
        expect(result.errorMessage).toBe('Try saving your change again.');
      });

      test('handles general error with different errorCode', () => {
        const error = 'Something went wrong';
        const errorCode = 'UNKNOWN_ERROR';
        const result = buildGroupErrorResult(
          error,
          errorCode,
          undefined,
          mockIntl,
        );

        expect(result.errorTitle).toBe("We couldn't save your recent change");
        expect(result.errorMessage).toBe('Something went wrong');
      });

      test('handles general error with source', () => {
        const error = 'Database connection failed';
        const result = buildGroupErrorResult(
          error,
          undefined,
          ErrorSource.CreateGroup,
          mockIntl,
        );

        expect(result.errorTitle).toBe("We couldn't save your recent change");
        expect(result.errorMessage).toBe('Database connection failed');
      });
    });

    describe('Version conflict errors', () => {
      test('handles OPTIMISTIC_LOCK_FAILURE error code', () => {
        const error = 'Version conflict';
        const errorCode = 'OPTIMISTIC_LOCK_FAILURE';
        const result = buildGroupErrorResult(
          error,
          errorCode,
          undefined,
          mockIntl,
        );

        expect(result.errorTitle).toBe('Group Was Modified');
        expect(result.errorMessage).toBe(
          'This group was modified by another user. Please refresh and try again.',
        );
      });
    });

    describe('Insufficient permissions errors', () => {
      test('handles INSUFFICIENT_PERMISSIONS error code', () => {
        const error = 'Permission denied';
        const errorCode = 'INSUFFICIENT_PERMISSIONS';
        const result = buildGroupErrorResult(
          error,
          errorCode,
          undefined,
          mockIntl,
        );

        expect(result.errorTitle).toBe('Insufficient Permissions');
        expect(result.errorMessage).toBe(
          'You do not have permission to perform this action.',
        );
      });
    });

    describe('WORKER_VALIDATION_FAILED errors in Edit Group context', () => {
      test('handles RemoveMembers error source', () => {
        const error = 'Worker validation failed for member removal';
        const errorCode = 'WORKER_VALIDATION_FAILED';
        const result = buildGroupErrorResult(
          error,
          errorCode,
          ErrorSource.RemoveMembers,
          mockIntl,
          GroupDrawerContext.EditGroup,
        );

        expect(result.errorTitle).toBe('Failed to remove members');
        expect(result.errorMessage).toBe(error);
      });

      test('handles RemoveManagers error source', () => {
        const error = 'Worker validation failed for manager removal';
        const errorCode = 'WORKER_VALIDATION_FAILED';
        const result = buildGroupErrorResult(
          error,
          errorCode,
          ErrorSource.RemoveManagers,
          mockIntl,
          GroupDrawerContext.EditGroup,
        );

        expect(result.errorTitle).toBe('Failed to remove leads');
        expect(result.errorMessage).toBe(error);
      });
    });

    describe('Edge cases', () => {
      test('handles error with empty intl', () => {
        const error = 'Network error';
        const emptyIntl = {
          formatMessage: (config: any) => config.defaultMessage || config.id,
        };
        const result = buildGroupErrorResult(
          error,
          undefined,
          undefined,
          emptyIntl,
        );

        expect(result.errorTitle).toBe("We couldn't save your recent change");
        expect(result.errorMessage).toBe('Network error');
      });
    });

    describe('PARTIAL_SUCCESS error code', () => {
      test('decodes valid JSON payload and returns errorTitle and errorMessage', () => {
        const errorPayload = JSON.stringify({
          errorTitle: 'Partial success title',
          errorMessage: 'Some workers could not be assigned',
        });
        const result = buildGroupErrorResult(
          errorPayload,
          'PARTIAL_SUCCESS',
          undefined,
          mockIntl,
        );
        expect(result.errorTitle).toBe('Partial success title');
        expect(result.errorMessage).toBe('Some workers could not be assigned');
      });

      test('falls through to general error when PARTIAL_SUCCESS payload is invalid JSON', () => {
        const result = buildGroupErrorResult(
          'not valid json',
          'PARTIAL_SUCCESS',
          undefined,
          mockIntl,
        );
        expect(result.errorTitle).toBe("We couldn't save your recent change");
        expect(result.errorMessage).toBe('not valid json');
      });
    });
  });

  describe('parseAssignmentResponse', () => {
    describe('Success scenarios', () => {
      test('should parse complete success for members', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupMembers: {
              successCode: 'SUCCESS',
              assignmentResults: [
                { worker: { id: 'worker-1' } },
                { worker: { id: 'worker-2' } },
              ],
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: false,
          assignedCount: 2,
          failedCount: 0,
          failures: [],
        });
        expect('error' in result).toBe(false);
      });

      test('should parse complete success for managers', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupManagers: {
              successCode: 'SUCCESS',
              assignmentResults: [
                { worker: { id: 'manager-1' } },
                { worker: { id: 'manager-2' } },
                { worker: { id: 'manager-3' } },
              ],
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: false,
          assignedCount: 3,
          failedCount: 0,
          failures: [],
        });
        expect('error' in result).toBe(false);
      });
    });

    describe('Failure scenarios', () => {
      test('should parse FAILURE successCode for members', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupMembers: {
              successCode: 'FAILURE',
              assignmentResults: [
                {
                  workerId: 'worker-1',
                  errorCode: 'ERROR',
                  errorMessage: 'Failed',
                },
              ],
            },
          },
        };
        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupMembers',
          OperationType.Members,
        );
        expect(result).toEqual({
          error: 'Try saving your change again. Failed to assign members',
        });
        expect('success' in result).toBe(false);
      });

      test('should parse FAILURE successCode for managers', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupManagers: {
              successCode: 'FAILURE',
              assignmentResults: [
                {
                  workerId: 'm1',
                  errorCode: 'ERROR',
                  errorMessage: 'Failed',
                },
              ],
            },
          },
        };
        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupManagers',
          OperationType.Managers,
        );
        expect(result).toEqual({
          error: 'Try saving your change again. Failed to assign leads',
        });
        expect('success' in result).toBe(false);
      });
    });

    describe('Partial success scenarios', () => {
      test('should parse partial success for members with failures', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupMembers: {
              successCode: 'PARTIAL_SUCCESS',
              assignmentResults: [
                { worker: { id: 'worker-1' } },
                { worker: { id: 'worker-2' } },
                {
                  workerId: 'worker-3',
                  errorCode: 'ALREADY_IN_GROUP',
                  errorMessage: 'Worker is already in another group',
                },
                {
                  workerId: 'worker-4',
                  errorCode: 'INACTIVE_WORKER',
                  errorMessage: 'Worker is inactive',
                },
              ],
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: true,
          assignedCount: 2,
          failedCount: 2,
          failures: [
            {
              workerId: 'worker-3',
              errorCode: 'ALREADY_IN_GROUP',
              errorMessage: 'Worker is already in another group',
            },
            {
              workerId: 'worker-4',
              errorCode: 'INACTIVE_WORKER',
              errorMessage: 'Worker is inactive',
            },
          ],
        });
        expect('error' in result).toBe(false);
      });

      test('should parse partial success for managers with failures', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupManagers: {
              successCode: 'PARTIAL_SUCCESS',
              assignmentResults: [
                { worker: { id: 'manager-1' } },
                {
                  workerId: 'manager-2',
                  errorCode: 'INVALID_PERMISSIONS',
                  errorMessage: 'Manager lacks required permissions',
                },
              ],
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: true,
          assignedCount: 1,
          failedCount: 1,
          failures: [
            {
              workerId: 'manager-2',
              errorCode: 'INVALID_PERMISSIONS',
              errorMessage: 'Manager lacks required permissions',
            },
          ],
        });
        expect('error' in result).toBe(false);
      });

      test('should handle failures with null errorCode and errorMessage', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupMembers: {
              successCode: 'PARTIAL_SUCCESS',
              assignmentResults: [
                { worker: { id: 'worker-1' } },
                {
                  workerId: 'worker-2',
                  errorCode: null,
                  errorMessage: null,
                },
              ],
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: true,
          assignedCount: 1,
          failedCount: 1,
          failures: [
            {
              workerId: 'worker-2',
              errorCode: null,
              errorMessage: null,
            },
          ],
        });
        expect('error' in result).toBe(false);
      });

      test('should handle failures with null errorCode and errorMessage for managers', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupManagers: {
              successCode: 'PARTIAL_SUCCESS',
              assignmentResults: [
                { worker: { id: 'manager-1' } },
                {
                  workerId: 'manager-2',
                  errorCode: null,
                  errorMessage: null,
                },
              ],
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: true,
          assignedCount: 1,
          failedCount: 1,
          failures: [
            {
              workerId: 'manager-2',
              errorCode: null,
              errorMessage: null,
            },
          ],
        });
        expect('error' in result).toBe(false);
      });
    });

    describe('Error scenarios', () => {
      test('should parse GraphQL error response for members', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupMembers: {
              errorCode: 'WORKER_VALIDATION_FAILED',
              message: 'One or more workers failed validation',
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          error: 'One or more workers failed validation',
          errorCode: 'WORKER_VALIDATION_FAILED',
        });
        expect('success' in result).toBe(false);
      });

      test('should parse GraphQL error response for managers', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupManagers: {
              errorCode: 'INVALID_GROUP',
              message: 'Group does not exist',
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          error: 'Group does not exist',
          errorCode: 'INVALID_GROUP',
        });
        expect('success' in result).toBe(false);
      });

      test('should use default error message when message is missing', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupMembers: {
              errorCode: 'UNKNOWN_ERROR',
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          error: 'Failed to assign members',
          errorCode: 'UNKNOWN_ERROR',
        });
        expect('success' in result).toBe(false);
      });

      test('should handle null response data for members', () => {
        const mockResult = {
          data: null,
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          error: 'Null response from members assignment',
        });
        expect('success' in result).toBe(false);
      });

      test('should handle missing response field for managers', () => {
        const mockResult = {
          data: {},
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          error: 'Null response from leads assignment',
        });
        expect('success' in result).toBe(false);
      });

      test('should handle unexpected response format for members', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupMembers: {
              unexpectedField: 'value',
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          error: 'Unexpected response format from members assignment',
        });
        expect('success' in result).toBe(false);
      });

      test('should handle unexpected response format for managers', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupManagers: {
              unexpectedField: 'value',
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          error: 'Unexpected response format from managers assignment',
        });
        expect('success' in result).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('should handle empty assignmentResults array', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupMembers: {
              successCode: 'SUCCESS',
              assignmentResults: [],
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: false,
          assignedCount: 0,
          failedCount: 0,
          failures: [],
        });
        expect('error' in result).toBe(false);
      });

      test('should handle all failures (none successful)', () => {
        const mockResult = {
          data: {
            timeTrackingAssignGroupManagers: {
              successCode: 'PARTIAL_SUCCESS',
              assignmentResults: [
                {
                  workerId: 'manager-1',
                  errorCode: 'ERROR_1',
                  errorMessage: 'Error 1',
                },
                {
                  workerId: 'manager-2',
                  errorCode: 'ERROR_2',
                  errorMessage: 'Error 2',
                },
              ],
            },
          },
        };

        const result = parseAssignmentResponse(
          mockResult,
          'timeTrackingAssignGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: true,
          assignedCount: 0,
          failedCount: 2,
          failures: [
            {
              workerId: 'manager-1',
              errorCode: 'ERROR_1',
              errorMessage: 'Error 1',
            },
            {
              workerId: 'manager-2',
              errorCode: 'ERROR_2',
              errorMessage: 'Error 2',
            },
          ],
        });
        expect('error' in result).toBe(false);
      });
    });
  });

  describe('convertWorkerTypeToApiTypes', () => {
    describe('Valid WorkerType conversions', () => {
      test.each([
        {
          description: 'should return undefined for ALL filter type',
          input: WorkerType.ALL,
          expected: undefined,
        },
        {
          description: 'should return Employee type for EMPLOYEE filter',
          input: WorkerType.EMPLOYEE,
          expected: [TimeTracking_TimeForType.Employee],
        },
        {
          description:
            'should return LegacyQboUser type for LEGACY_QBO_USER filter',
          input: WorkerType.LEGACY_QBO_USER,
          expected: [TimeTracking_TimeForType.LegacyQboUser],
        },
        {
          description: 'should return Vendor type for VENDOR filter',
          input: WorkerType.VENDOR,
          expected: [TimeTracking_TimeForType.Vendor],
        },
      ])('$description', ({ input, expected }) => {
        const result = convertWorkerTypeToApiTypes(input);
        if (expected !== undefined) {
          expect(result).toEqual(expected);
        } else {
          expect(result).toBeUndefined();
        }
      });
    });

    describe('String input conversions', () => {
      test.each([
        {
          description: 'should handle string "ALL" input',
          input: 'ALL',
          expected: undefined,
        },
        {
          description: 'should handle string "EMPLOYEE" input',
          input: 'EMPLOYEE',
          expected: [TimeTracking_TimeForType.Employee],
        },
        {
          description: 'should handle string "LEGACY_QBO_USER" input',
          input: 'LEGACY_QBO_USER',
          expected: [TimeTracking_TimeForType.LegacyQboUser],
        },
        {
          description: 'should handle string "VENDOR" input',
          input: 'VENDOR',
          expected: [TimeTracking_TimeForType.Vendor],
        },
      ])('$description', ({ input, expected }) => {
        const result = convertWorkerTypeToApiTypes(input);
        if (expected !== undefined) {
          expect(result).toEqual(expected);
        } else {
          expect(result).toBeUndefined();
        }
      });
    });

    describe('Edge cases and invalid inputs', () => {
      test.each([
        {
          description: 'should return undefined for unknown filter type',
          input: 'UNKNOWN_TYPE',
        },
        {
          description: 'should return undefined for empty string',
          input: '',
        },
        {
          description: 'should return undefined for null-like string',
          input: 'null',
        },
        {
          description: 'should handle case-sensitive input (lowercase)',
          input: 'employee',
        },
        {
          description: 'should handle mixed case input',
          input: 'Employee',
        },
      ])('$description', ({ input }) => {
        const result = convertWorkerTypeToApiTypes(input);
        expect(result).toBeUndefined();
      });
    });

    describe('Return value verification', () => {
      test.each([
        {
          description: 'should return array for EMPLOYEE type',
          input: WorkerType.EMPLOYEE,
        },
        {
          description: 'should return array for LEGACY_QBO_USER type',
          input: WorkerType.LEGACY_QBO_USER,
        },
        {
          description: 'should return array for VENDOR type',
          input: WorkerType.VENDOR,
        },
      ])('$description', ({ input }) => {
        const result = convertWorkerTypeToApiTypes(input);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
      });

      test('should return exactly undefined (not null) for ALL', () => {
        const result = convertWorkerTypeToApiTypes(WorkerType.ALL);
        expect(result).toBe(undefined);
        expect(result).not.toBe(null);
      });
    });
  });

  describe('encryptWorkerId', () => {
    describe('Successful encryption', () => {
      test('should encrypt a simple worker ID', () => {
        const workerId = 'worker-123';
        const encrypted = encryptWorkerId(workerId);

        expect(encrypted).toBeTruthy();
        expect(typeof encrypted).toBe('string');
        expect(encrypted).not.toBe(workerId);
        expect(encrypted).not.toContain('+');
        expect(encrypted).not.toContain('/');
        expect(encrypted).not.toContain('=');
      });

      test('should encrypt worker ID with special characters', () => {
        const workerId = 'worker@special#chars';
        const encrypted = encryptWorkerId(workerId);

        expect(encrypted).toBeTruthy();
        expect(encrypted).not.toContain('+');
        expect(encrypted).not.toContain('/');
        expect(encrypted).not.toContain('=');
      });

      test('should encrypt worker ID with spaces', () => {
        const workerId = 'worker with spaces';
        const encrypted = encryptWorkerId(workerId);

        expect(encrypted).toBeTruthy();
        expect(encrypted).not.toContain(' ');
      });

      test('should encrypt empty string', () => {
        const workerId = '';
        const encrypted = encryptWorkerId(workerId);

        expect(typeof encrypted).toBe('string');
        // Empty string encrypts to empty string (valid base64)
        expect(encrypted).toBe('');
      });

      test('should produce URL-safe output', () => {
        const workerId = 'worker-123';
        const encrypted = encryptWorkerId(workerId);

        // Should not contain base64 characters that need URL encoding
        expect(encrypted).not.toContain('+');
        expect(encrypted).not.toContain('/');
        expect(encrypted).not.toContain('=');
      });

      test('should produce consistent output for same input', () => {
        const workerId = 'worker-123';
        const encrypted1 = encryptWorkerId(workerId);
        const encrypted2 = encryptWorkerId(workerId);

        expect(encrypted1).toBe(encrypted2);
      });
    });

    describe('Error handling', () => {
      test('should throw error when encryption fails', () => {
        // Mock btoa to throw an error
        const originalBtoa = global.btoa;
        global.btoa = jest.fn(() => {
          throw new Error('btoa failed');
        });

        const workerId = 'worker-123';

        // Should throw error instead of falling back
        expect(() => encryptWorkerId(workerId)).toThrow(
          'Failed to encrypt worker ID: btoa failed',
        );

        global.btoa = originalBtoa;
      });

      test('should throw error with proper message when encryption fails', () => {
        // Mock btoa to throw an error
        const originalBtoa = global.btoa;
        global.btoa = jest.fn(() => {
          throw new Error('Encoding error');
        });

        const workerId = 'worker-123';

        expect(() => encryptWorkerId(workerId)).toThrow(
          'Failed to encrypt worker ID: Encoding error',
        );

        global.btoa = originalBtoa;
      });
    });
  });

  describe('navigateToWorkerSettings', () => {
    let mockSandbox: any;

    beforeEach(() => {
      mockSandbox = {
        navigation: {
          navigate: jest.fn(),
        },
        logger: {
          info: jest.fn(),
          error: jest.fn(),
        },
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('Navigation with displayName', () => {
      test('should navigate to user settings with encrypted worker ID', () => {
        const worker = {
          id: 'worker-123',
          displayName: 'John Doe',
          type: TimeTracking_TimeForType.Employee,
        };

        navigateToWorkerSettings(worker, mockSandbox, 'TestComponent');

        // Verify navigation was called
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledTimes(1);

        // Get the URL that was navigated to
        const navigateCall = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(navigateCall).toContain('/app/userSettings/');
        expect(navigateCall).toContain(encodeURIComponent(worker.type));
        expect(navigateCall).toContain(encodeURIComponent('John Doe'));

        // Verify worker ID is encrypted (not plain text)
        const urlParts = navigateCall.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
        expect(encryptedWorkerId).not.toContain('+');
        expect(encryptedWorkerId).not.toContain('/');
        expect(encryptedWorkerId).not.toContain('=');
      });

      test('should log info with component name', () => {
        const worker = {
          id: 'worker-123',
          displayName: 'John Doe',
          type: TimeTracking_TimeForType.Employee,
        };

        const {
          navigateToWorkerSettings,
        } = require('src/js/widgets/assignments/utils/helpers');
        navigateToWorkerSettings(worker, mockSandbox, 'TestComponent');

        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          'Component="TestComponent" Event="Navigating to worker settings"',
          {
            workerId: worker.id,
            workerType: worker.type,
            workerName: 'John Doe',
          },
        );
      });
    });

    describe('Navigation with name field', () => {
      test('should navigate to user settings with name field and encrypted ID', () => {
        const worker = {
          id: 'worker-456',
          name: 'Jane Smith',
          role: TimeTracking_TimeForType.Vendor,
        };

        navigateToWorkerSettings(worker, mockSandbox, 'WorkerRow');

        const navigateCall = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(navigateCall).toContain('/app/userSettings/');
        expect(navigateCall).toContain(
          encodeURIComponent(TimeTracking_TimeForType.Vendor),
        );
        expect(navigateCall).toContain(encodeURIComponent('Jane Smith'));

        // Verify worker ID is encrypted
        const urlParts = navigateCall.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
      });

      test('should log info with worker name from name field', () => {
        const worker = {
          id: 'worker-456',
          name: 'Jane Smith',
          role: TimeTracking_TimeForType.Vendor,
        };

        const {
          navigateToWorkerSettings,
        } = require('src/js/widgets/assignments/utils/helpers');
        navigateToWorkerSettings(worker, mockSandbox);

        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          'Event="Navigating to worker settings"',
          expect.objectContaining({
            workerId: worker.id,
            workerName: 'Jane Smith',
          }),
        );
      });
    });

    describe('Default values', () => {
      test('should use "Worker" as default when displayName and name are missing', () => {
        const worker = {
          id: 'worker-789',
          type: TimeTracking_TimeForType.Employee,
        };

        navigateToWorkerSettings(worker, mockSandbox);

        const navigateCall = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(navigateCall).toContain('/app/userSettings/');
        expect(navigateCall).toContain(encodeURIComponent(worker.type));
        expect(navigateCall).toContain(encodeURIComponent('Worker'));

        // Verify worker ID is encrypted
        const urlParts = navigateCall.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
      });

      test('should use "Worker" when displayName is empty string', () => {
        const worker = {
          id: 'worker-empty',
          displayName: '',
          type: TimeTracking_TimeForType.Employee,
        };

        const {
          navigateToWorkerSettings,
        } = require('src/js/widgets/assignments/utils/helpers');
        navigateToWorkerSettings(worker, mockSandbox);

        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith(
          expect.stringContaining(encodeURIComponent('Worker')),
        );
      });

      test('should use EMPLOYEE as default workerType when type and role are missing', () => {
        const worker = {
          id: 'worker-no-type',
          displayName: 'Test Worker',
          type: '',
        };

        const {
          navigateToWorkerSettings,
        } = require('src/js/widgets/assignments/utils/helpers');
        navigateToWorkerSettings(worker, mockSandbox);

        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith(
          expect.stringContaining(encodeURIComponent('EMPLOYEE')),
        );
      });
    });

    describe('URL encoding', () => {
      test('should encode special characters in worker name and encrypt ID', () => {
        const worker = {
          id: 'worker-special',
          displayName: "José María O'Connor",
          type: TimeTracking_TimeForType.Employee,
        };

        navigateToWorkerSettings(worker, mockSandbox);

        const call = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(call).toContain('/app/userSettings/');
        expect(call).toContain(encodeURIComponent("José María O'Connor"));

        // Verify worker ID is encrypted
        const urlParts = call.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
      });

      test('should encrypt worker ID with special characters', () => {
        const worker = {
          id: 'worker@special#chars',
          displayName: 'Test Worker',
          type: TimeTracking_TimeForType.Employee,
        };

        navigateToWorkerSettings(worker, mockSandbox);

        const navigateCall = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(navigateCall).toContain('/app/userSettings/');

        // Verify worker ID is encrypted (not plain text)
        const urlParts = navigateCall.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
        expect(encryptedWorkerId).not.toContain('@');
        expect(encryptedWorkerId).not.toContain('#');
      });

      test('should handle spaces in worker name', () => {
        const worker = {
          id: 'worker-1',
          displayName: 'John Middle Doe',
          type: TimeTracking_TimeForType.Employee,
        };

        const {
          navigateToWorkerSettings,
        } = require('src/js/widgets/assignments/utils/helpers');
        navigateToWorkerSettings(worker, mockSandbox);

        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith(
          expect.stringContaining(encodeURIComponent('John Middle Doe')),
        );
      });
    });

    describe('Worker type handling', () => {
      test('should handle Employee type with encrypted ID', () => {
        const worker = {
          id: 'employee-1',
          displayName: 'Employee Name',
          type: TimeTracking_TimeForType.Employee,
        };

        navigateToWorkerSettings(worker, mockSandbox);

        const navigateCall = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(navigateCall).toContain(
          encodeURIComponent(TimeTracking_TimeForType.Employee),
        );

        // Verify worker ID is encrypted
        const urlParts = navigateCall.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
      });

      test('should handle Vendor/Contractor type', () => {
        const worker = {
          id: 'vendor-1',
          displayName: 'Contractor Name',
          type: TimeTracking_TimeForType.Vendor,
        };

        const {
          navigateToWorkerSettings,
        } = require('src/js/widgets/assignments/utils/helpers');
        navigateToWorkerSettings(worker, mockSandbox);

        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith(
          expect.stringContaining(
            encodeURIComponent(TimeTracking_TimeForType.Vendor),
          ),
        );
      });

      test('should prefer type over role when both are present and encrypt ID', () => {
        const worker = {
          id: 'worker-1',
          displayName: 'Test Worker',
          type: TimeTracking_TimeForType.Employee,
          role: TimeTracking_TimeForType.Vendor,
        };

        navigateToWorkerSettings(worker, mockSandbox);

        const navigateCall = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(navigateCall).toContain(
          encodeURIComponent(TimeTracking_TimeForType.Employee),
        );

        // Verify worker ID is encrypted
        const urlParts = navigateCall.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
      });

      test('should use role when type is not provided and encrypt ID', () => {
        const worker = {
          id: 'worker-1',
          displayName: 'Test Worker',
          type: '',
          role: TimeTracking_TimeForType.Vendor,
        };

        navigateToWorkerSettings(worker, mockSandbox);

        const navigateCall = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(navigateCall).toContain(
          encodeURIComponent(TimeTracking_TimeForType.Vendor),
        );

        // Verify worker ID is encrypted
        const urlParts = navigateCall.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
      });
    });

    describe('Error handling', () => {
      test('should log error when navigation fails', () => {
        const navigationError = new Error('Navigation failed');
        mockSandbox.navigation.navigate.mockImplementation(() => {
          throw navigationError;
        });

        const worker = {
          id: 'worker-error',
          displayName: 'Test Worker',
          type: TimeTracking_TimeForType.Employee,
        };

        navigateToWorkerSettings(worker, mockSandbox, 'TestComponent');

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Component="TestComponent" Event="Navigation to worker settings failed"',
          {
            error: navigationError,
            workerId: worker.id,
            workerName: worker.displayName,
            workerType: worker.type,
          },
        );
      });

      test('should use worker.name when displayName is missing in error handler', () => {
        const navigationError = new Error('Navigation failed');
        mockSandbox.navigation.navigate.mockImplementation(() => {
          throw navigationError;
        });

        const worker = {
          id: 'worker-error',
          name: 'Worker Name',
          type: TimeTracking_TimeForType.Employee,
        };

        navigateToWorkerSettings(worker, mockSandbox, 'TestComponent');

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Component="TestComponent" Event="Navigation to worker settings failed"',
          {
            error: navigationError,
            workerId: worker.id,
            workerName: worker.name,
            workerType: worker.type,
          },
        );
      });

      test('should use worker.role when type is missing in error handler', () => {
        const navigationError = new Error('Navigation failed');
        mockSandbox.navigation.navigate.mockImplementation(() => {
          throw navigationError;
        });

        const worker = {
          id: 'worker-error',
          displayName: 'Test Worker',
          role: TimeTracking_TimeForType.Vendor,
        };

        navigateToWorkerSettings(worker, mockSandbox, 'TestComponent');

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Component="TestComponent" Event="Navigation to worker settings failed"',
          {
            error: navigationError,
            workerId: worker.id,
            workerName: worker.displayName,
            workerType: worker.role,
          },
        );
      });

      test('should log error when encryption fails', () => {
        // Mock encryptWorkerId to throw an error
        const originalBtoa = global.btoa;
        global.btoa = jest.fn(() => {
          throw new Error('Encryption failed');
        });

        const worker = {
          id: 'worker-1',
          displayName: 'Test Worker',
          type: TimeTracking_TimeForType.Employee,
        };

        navigateToWorkerSettings(worker, mockSandbox, 'TestComponent');

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Component="TestComponent" Event="Navigation to worker settings failed"',
          expect.objectContaining({
            error: expect.any(Error),
            workerId: worker.id,
            workerName: worker.displayName,
            workerType: worker.type,
          }),
        );

        // Verify navigation was not called due to encryption failure
        expect(mockSandbox.navigation.navigate).not.toHaveBeenCalled();

        global.btoa = originalBtoa;
      });

      test('should not throw when navigation fails', () => {
        mockSandbox.navigation.navigate.mockImplementation(() => {
          throw new Error('Navigation failed');
        });

        const worker = {
          id: 'worker-1',
          displayName: 'Test Worker',
          type: TimeTracking_TimeForType.Employee,
        };

        expect(() =>
          navigateToWorkerSettings(worker, mockSandbox),
        ).not.toThrow();
      });
    });

    describe('Backward compatibility', () => {
      test('should prioritize displayName over name and encrypt ID', () => {
        const worker = {
          id: 'worker-1',
          displayName: 'Display Name',
          name: 'Regular Name',
          type: TimeTracking_TimeForType.Employee,
        };

        navigateToWorkerSettings(worker, mockSandbox);

        const navigateCall = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(navigateCall).toContain(encodeURIComponent('Display Name'));

        // Verify worker ID is encrypted
        const urlParts = navigateCall.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
      });

      test('should fall back to name when displayName is empty and encrypt ID', () => {
        const worker = {
          id: 'worker-1',
          displayName: '',
          name: 'Regular Name',
          type: TimeTracking_TimeForType.Employee,
        };

        navigateToWorkerSettings(worker, mockSandbox);

        const navigateCall = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(navigateCall).toContain(encodeURIComponent('Regular Name'));

        // Verify worker ID is encrypted
        const urlParts = navigateCall.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
      });

      test('should support role field for workerType and encrypt ID', () => {
        const worker = {
          id: 'worker-1',
          displayName: 'Test Worker',
          type: '',
          role: TimeTracking_TimeForType.Vendor,
        };

        navigateToWorkerSettings(worker, mockSandbox);

        const navigateCall = mockSandbox.navigation.navigate.mock.calls[0][0];
        expect(navigateCall).toContain(
          encodeURIComponent(TimeTracking_TimeForType.Vendor),
        );

        // Verify worker ID is encrypted
        const urlParts = navigateCall.split('/');
        const encryptedWorkerId = urlParts[urlParts.length - 3];
        expect(encryptedWorkerId).not.toBe(worker.id);
      });
    });
  });

  describe('parseRemovalResponse', () => {
    describe('Success scenarios', () => {
      test('should parse complete success for members', () => {
        const mockResult = {
          data: {
            timeTrackingRemoveGroupMembers: {
              successCode: 'SUCCESS',
              removalResults: [
                { worker: { id: 'worker-1' } },
                { worker: { id: 'worker-2' } },
              ],
            },
          },
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: false,
          removedCount: 2,
          failedCount: 0,
          failures: [],
        });
        expect('error' in result).toBe(false);
      });

      test('should parse complete success for managers', () => {
        const mockResult = {
          data: {
            timeTrackingRemoveGroupManagers: {
              successCode: 'SUCCESS',
              removalResults: [
                { worker: { id: 'manager-1' } },
                { worker: { id: 'manager-2' } },
                { worker: { id: 'manager-3' } },
              ],
            },
          },
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: false,
          removedCount: 3,
          failedCount: 0,
          failures: [],
        });
        expect('error' in result).toBe(false);
      });
    });

    describe('Partial success scenarios', () => {
      test('should parse partial success for members with failures', () => {
        const mockResult = {
          data: {
            timeTrackingRemoveGroupMembers: {
              successCode: 'PARTIAL_SUCCESS',
              removalResults: [
                { worker: { id: 'worker-1' } },
                { worker: { id: 'worker-2' } },
                {
                  workerId: 'worker-3',
                  errorCode: 'NOT_IN_GROUP',
                  errorMessage: 'Worker is not in this group',
                },
                {
                  workerId: 'worker-4',
                  errorCode: 'INACTIVE_WORKER',
                  errorMessage: 'Worker is inactive',
                },
              ],
            },
          },
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: true,
          removedCount: 2,
          failedCount: 2,
          failures: [
            {
              workerId: 'worker-3',
              errorCode: 'NOT_IN_GROUP',
              errorMessage: 'Worker is not in this group',
            },
            {
              workerId: 'worker-4',
              errorCode: 'INACTIVE_WORKER',
              errorMessage: 'Worker is inactive',
            },
          ],
        });
        expect('error' in result).toBe(false);
      });

      test('should parse partial success for managers with failures', () => {
        const mockResult = {
          data: {
            timeTrackingRemoveGroupManagers: {
              successCode: 'PARTIAL_SUCCESS',
              removalResults: [
                { worker: { id: 'manager-1' } },
                {
                  workerId: 'manager-2',
                  errorCode: 'INVALID_PERMISSIONS',
                  errorMessage: 'Manager removal failed',
                },
              ],
            },
          },
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: true,
          removedCount: 1,
          failedCount: 1,
          failures: [
            {
              workerId: 'manager-2',
              errorCode: 'INVALID_PERMISSIONS',
              errorMessage: 'Manager removal failed',
            },
          ],
        });
        expect('error' in result).toBe(false);
      });

      test('should handle failures with null errorCode and errorMessage for members removal', () => {
        const mockResult = {
          data: {
            timeTrackingRemoveGroupMembers: {
              successCode: 'PARTIAL_SUCCESS',
              removalResults: [
                { worker: { id: 'worker-1' } },
                {
                  workerId: 'worker-2',
                  errorCode: null,
                  errorMessage: null,
                },
              ],
            },
          },
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: true,
          removedCount: 1,
          failedCount: 1,
          failures: [
            {
              workerId: 'worker-2',
              errorCode: null,
              errorMessage: null,
            },
          ],
        });
        expect('error' in result).toBe(false);
      });

      test('should handle failures with null errorCode and errorMessage for managers removal', () => {
        const mockResult = {
          data: {
            timeTrackingRemoveGroupManagers: {
              successCode: 'PARTIAL_SUCCESS',
              removalResults: [
                { worker: { id: 'manager-1' } },
                {
                  workerId: 'manager-2',
                  errorCode: null,
                  errorMessage: null,
                },
              ],
            },
          },
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          success: true,
          partialSuccess: true,
          removedCount: 1,
          failedCount: 1,
          failures: [
            {
              workerId: 'manager-2',
              errorCode: null,
              errorMessage: null,
            },
          ],
        });
        expect('error' in result).toBe(false);
      });
    });

    describe('Error scenarios', () => {
      test('should parse GraphQL error response for members', () => {
        const mockResult = {
          data: {
            timeTrackingRemoveGroupMembers: {
              errorCode: 'INVALID_GROUP',
              message: 'Group does not exist',
            },
          },
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          error: 'Group does not exist',
          errorCode: 'INVALID_GROUP',
        });
        expect('success' in result).toBe(false);
      });

      test('should use fallback error message when message is missing for members removal', () => {
        const mockResult = {
          data: {
            timeTrackingRemoveGroupMembers: {
              errorCode: 'UNKNOWN_ERROR',
            },
          },
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          error: 'Failed to remove members',
          errorCode: 'UNKNOWN_ERROR',
        });
        expect('success' in result).toBe(false);
      });

      test('should use fallback error message when message is missing for managers removal', () => {
        const mockResult = {
          data: {
            timeTrackingRemoveGroupManagers: {
              errorCode: 'UNKNOWN_ERROR',
            },
          },
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          error: 'Failed to remove managers',
          errorCode: 'UNKNOWN_ERROR',
        });
        expect('success' in result).toBe(false);
      });

      test('should handle null response data', () => {
        const mockResult = {
          data: null,
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          error: 'Null response from members removal',
        });
        expect('success' in result).toBe(false);
      });

      test('should handle missing response field', () => {
        const mockResult = {
          data: {},
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupManagers',
          OperationType.Managers,
        );

        expect(result).toEqual({
          error: 'Null response from managers removal',
        });
        expect('success' in result).toBe(false);
      });

      test('should handle unexpected response format', () => {
        const mockResult = {
          data: {
            timeTrackingRemoveGroupMembers: {
              unexpectedField: 'value',
            },
          },
        };

        const result = parseRemovalResponse(
          mockResult,
          'timeTrackingRemoveGroupMembers',
          OperationType.Members,
        );

        expect(result).toEqual({
          error: 'Unexpected response format from members removal',
        });
        expect('success' in result).toBe(false);
      });
    });
  });

  describe('buildOperationMessage', () => {
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const messages: { [key: string]: string } = {
          'groups.assign_members.success':
            '{count} worker(s) assigned to {groupName}',
          'groups.remove_members.success':
            '{count} worker(s) removed from {groupName}',
          'groups.assign_managers.success':
            '{count} worker(s) assigned as group leads to {groupName}',
          'groups.remove_managers.success':
            '{count} worker(s) removed as group leads from {groupName}',
        };
        const message = messages[config.id] || config.id;
        if (values) {
          return message
            .replace('{count}', String(values.count))
            .replace('{groupName}', values.groupName);
        }
        return message;
      },
    };

    test('should build assign members message', () => {
      const result: any = {
        success: true,
        assignedCount: 5,
        failedCount: 0,
      };

      const message = buildOperationMessage(
        result,
        OperationAction.Assign,
        OperationType.Members,
        'Test Group',
        mockIntl,
      );

      expect(message).toBe('5 worker(s) assigned to Test Group');
    });

    test('should build remove members message', () => {
      const result: any = {
        success: true,
        removedCount: 3,
        failedCount: 0,
      };

      const message = buildOperationMessage(
        result,
        OperationAction.Remove,
        OperationType.Members,
        'Test Group',
        mockIntl,
      );

      expect(message).toBe('3 worker(s) removed from Test Group');
    });

    test('should build assign managers message', () => {
      const result: any = {
        success: true,
        assignedCount: 2,
        failedCount: 0,
      };

      const message = buildOperationMessage(
        result,
        OperationAction.Assign,
        OperationType.Managers,
        'Test Group',
        mockIntl,
      );

      expect(message).toBe('2 worker(s) assigned as group leads to Test Group');
    });

    test('should build remove managers message', () => {
      const result: any = {
        success: true,
        removedCount: 1,
        failedCount: 0,
      };

      const message = buildOperationMessage(
        result,
        OperationAction.Remove,
        OperationType.Managers,
        'Test Group',
        mockIntl,
      );

      expect(message).toBe(
        '1 worker(s) removed as group leads from Test Group',
      );
    });
  });

  describe('buildCombinedAssignRemoveMessage', () => {
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const messages: { [key: string]: string } = {
          'groups.assign_remove_members.success':
            '{assignedCount} worker(s) assigned to and {removedCount} worker(s) removed from {groupName}',
          'groups.assign_remove_managers.success':
            '{assignedCount} worker(s) assigned and {removedCount} worker(s) removed as group leads from {groupName}',
        };
        const message = messages[config.id] || config.id;
        if (values) {
          return message
            .replace('{assignedCount}', String(values.assignedCount))
            .replace('{removedCount}', String(values.removedCount))
            .replace('{groupName}', values.groupName);
        }
        return message;
      },
    };

    test('should build combined assign and remove message for members', () => {
      const assignResult: any = {
        success: true,
        assignedCount: 5,
        failedCount: 0,
      };
      const removeResult: any = {
        success: true,
        removedCount: 3,
        failedCount: 0,
      };

      const message = buildCombinedAssignRemoveMessage(
        assignResult,
        removeResult,
        OperationType.Members,
        'Test Group',
        mockIntl,
      );

      expect(message).toBe(
        '5 worker(s) assigned to and 3 worker(s) removed from Test Group',
      );
    });

    test('should build combined assign and remove message for managers', () => {
      const assignResult: any = {
        success: true,
        assignedCount: 2,
        failedCount: 0,
      };
      const removeResult: any = {
        success: true,
        removedCount: 1,
        failedCount: 0,
      };

      const message = buildCombinedAssignRemoveMessage(
        assignResult,
        removeResult,
        OperationType.Managers,
        'Test Group',
        mockIntl,
      );

      expect(message).toBe(
        '2 worker(s) assigned and 1 worker(s) removed as group leads from Test Group',
      );
    });

    test('should handle null assign result', () => {
      const removeResult: any = {
        success: true,
        removedCount: 3,
        failedCount: 0,
      };

      const message = buildCombinedAssignRemoveMessage(
        null,
        removeResult,
        OperationType.Members,
        'Test Group',
        mockIntl,
      );

      expect(message).toBe(
        '0 worker(s) assigned to and 3 worker(s) removed from Test Group',
      );
    });

    test('should handle null remove result', () => {
      const assignResult: any = {
        success: true,
        assignedCount: 5,
        failedCount: 0,
      };

      const message = buildCombinedAssignRemoveMessage(
        assignResult,
        null,
        OperationType.Members,
        'Test Group',
        mockIntl,
      );

      expect(message).toBe(
        '5 worker(s) assigned to and 0 worker(s) removed from Test Group',
      );
    });

    test('should handle both null results', () => {
      const message = buildCombinedAssignRemoveMessage(
        null,
        null,
        OperationType.Members,
        'Test Group',
        mockIntl,
      );

      expect(message).toBe(
        '0 worker(s) assigned to and 0 worker(s) removed from Test Group',
      );
    });
  });

  describe('getWorkersEmptyStateTitle', () => {
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const messages: { [key: string]: string } = {
          'groups.detail.noSearchResults':
            'No workers found matching "{searchText}"',
          'groups.detail.noWorkersByType':
            'No workers of type "{filterType}" in this group',
          'groups.detail.noWorkers': 'No workers in this group',
          'workers.list.empty.title': 'No workers yet',
          'workers.list.empty.noSearchResultsTitle':
            'No workers matching "{searchText}" yet',
          'workers.list.empty.noWorkersByTypeTitle':
            'No workers of type "{filterType}" yet',
        };
        const message =
          messages[config.id] || config.defaultMessage || config.id;
        if (values) {
          return message
            .replace('{searchText}', values.searchText || '')
            .replace('{filterType}', values.filterType || '');
        }
        return message;
      },
    };

    describe('group detail context', () => {
      test('should return search results message when search text is provided', () => {
        const message = getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.GROUP_DETAIL,
          'John',
          WorkerType.ALL,
          mockIntl,
        );
        expect(message).toBe('No workers found matching "John"');
      });

      test('should return type filter message when filter type is not ALL', () => {
        const message = getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.GROUP_DETAIL,
          '',
          WorkerType.EMPLOYEE,
          mockIntl,
        );
        expect(message).toBe('No workers of type "employee" in this group');
      });

      test('should return "user" for LEGACY_QBO_USER filter type', () => {
        const message = getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.GROUP_DETAIL,
          '',
          WorkerType.LEGACY_QBO_USER,
          mockIntl,
        );
        expect(message).toBe('No workers of type "user" in this group');
      });

      test('should return "vendor" for VENDOR filter type', () => {
        const message = getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.GROUP_DETAIL,
          '',
          WorkerType.VENDOR,
          mockIntl,
        );
        expect(message).toBe('No workers of type "vendor" in this group');
      });

      test('should return default message when no search and filter is ALL', () => {
        const message = getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.GROUP_DETAIL,
          '',
          WorkerType.ALL,
          mockIntl,
        );
        expect(message).toBe('No workers in this group');
      });

      test('should prioritize search text over filter type', () => {
        const message = getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.GROUP_DETAIL,
          'John',
          WorkerType.EMPLOYEE,
          mockIntl,
        );
        expect(message).toBe('No workers found matching "John"');
      });
    });

    describe('workers list context', () => {
      test('should return default title when no search and filter is ALL', () => {
        const message = getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.WORKERS_LIST,
          '',
          WorkerType.ALL,
          mockIntl,
        );
        expect(message).toBe('No workers yet');
      });

      test('should return noSearchResultsTitle when search text is provided', () => {
        const message = getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.WORKERS_LIST,
          'test',
          WorkerType.ALL,
          mockIntl,
        );
        expect(message).toBe('No workers matching "test" yet');
      });

      test('should return noWorkersByTypeTitle when filter type is not ALL', () => {
        const message = getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.WORKERS_LIST,
          '',
          WorkerType.EMPLOYEE,
          mockIntl,
        );
        expect(message).toBe('No workers of type "employee" yet');
      });

      test('should use default formatWorkerTypeForDisplay for unknown filter type', () => {
        const message = getWorkersEmptyStateTitle(
          WorkersEmptyStateContext.WORKERS_LIST,
          '',
          'OTHER' as WorkerType,
          mockIntl,
        );
        expect(message).toBe('No workers of type "other" yet');
      });
    });
  });

  describe('buildPartialSuccessError', () => {
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const key = config.id || '';
        const map: Record<string, string> = {
          'groups.errors.partial_inactive_title_workers': 'Inactive workers',
          'groups.errors.partial_other_title_workers': 'Partial title',
          'groups.errors.partial_other_message_workers': '{failedCount} failed',
        };
        let msg = map[key] || key;
        if (values?.count != null) {
          msg = msg.replace('{failedCount}', String(values.count));
        }
        return msg;
      },
    };

    test('returns inactive title and message when all failures are inactive worker errors', () => {
      const failures = [
        {
          errorCode: 'WORKER_VALIDATION_FAILED',
          errorMessage: "Worker 'John' is inactive",
        },
      ];
      const result = buildPartialSuccessError(
        1,
        1,
        failures,
        OperationAction.Assign,
        WorkerSelectionMode.Workers,
        mockIntl,
      );
      expect(result.errorTitle).toBe('Inactive workers');
      expect(result.errorMessage).toContain('John');
    });

    test('returns other title and message when not all failures are inactive', () => {
      const failures = [
        {
          errorCode: 'ALREADY_IN_GROUP',
          errorMessage: 'Already in group',
        },
      ];
      const result = buildPartialSuccessError(
        1,
        1,
        failures,
        OperationAction.Remove,
        WorkerSelectionMode.Workers,
        mockIntl,
      );
      expect(result.errorTitle).toBe('Partial title');
      expect(result.errorMessage).toBe('1 failed');
    });
  });

  describe('buildCombinedPartialSuccessError', () => {
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const map: Record<string, string> = {
          'groups.errors.combined_partial_title': 'Combined partial',
          'groups.errors.combined_partial_message':
            '{memberCount} members, {leadCount} leads failed',
        };
        let msg = map[config.id] || config.id;
        if (values) {
          Object.entries(values).forEach(([k, v]) => {
            msg = msg.replace(`{${k}}`, String(v));
          });
        }
        return msg;
      },
    };

    test('returns combined inactive message when both members and leads are all inactive', () => {
      const memberFailures = [
        {
          errorCode: 'WORKER_VALIDATION_FAILED',
          errorMessage: "Worker 'A' is inactive",
        },
      ];
      const leadFailures = [
        {
          errorCode: 'WORKER_VALIDATION_FAILED',
          errorMessage: "Worker 'B' is inactive",
        },
      ];
      const result = buildCombinedPartialSuccessError(
        1,
        1,
        memberFailures,
        leadFailures,
        OperationAction.Assign,
        mockIntl,
      );
      expect(result.errorTitle).toBe('Combined partial');
      expect(result.errorMessage).toContain('A');
      expect(result.errorMessage).toContain('B');
    });

    test('returns counts message when mixed error types', () => {
      const memberFailures = [
        { errorCode: 'ALREADY_IN_GROUP', errorMessage: 'Already in group' },
      ];
      const leadFailures = [{ errorCode: 'OTHER', errorMessage: 'Other' }];
      const result = buildCombinedPartialSuccessError(
        0,
        0,
        memberFailures,
        leadFailures,
        OperationAction.Assign,
        mockIntl,
      );
      expect(result.errorTitle).toBe('Combined partial');
      expect(result.errorMessage).toContain('1');
      expect(result.errorMessage).toContain('leads failed');
    });
  });

  describe('buildCombinedAssignRemovePartialSuccessError', () => {
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const map: Record<string, string> = {
          'groups.errors.combined_assign_remove_title': 'Assign/Remove title',
          'groups.errors.combined_assign_remove_message':
            '{assignFailedCount} assign, {removeFailedCount} remove failed',
        };
        let msg = map[config.id] || config.id;
        if (values) {
          Object.entries(values).forEach(([k, v]) => {
            msg = msg.replace(`{${k}}`, String(v));
          });
        }
        return msg;
      },
    };

    test('returns inactive message when both assign and remove are all inactive', () => {
      const assignFailures = [
        {
          errorCode: 'WORKER_VALIDATION_FAILED',
          errorMessage: "Worker 'X' is inactive",
        },
      ];
      const removeFailures = [
        {
          errorCode: 'WORKER_VALIDATION_FAILED',
          errorMessage: "Worker 'Y' is inactive",
        },
      ];
      const result = buildCombinedAssignRemovePartialSuccessError(
        1,
        1,
        1,
        1,
        assignFailures,
        removeFailures,
        WorkerSelectionMode.Workers,
        mockIntl,
      );
      expect(result.errorTitle).toBe('Assign/Remove title');
      expect(result.errorMessage).toContain('X');
      expect(result.errorMessage).toContain('Y');
    });

    test('returns counts message when mixed error types', () => {
      const assignFailures = [{ errorCode: 'OTHER', errorMessage: 'Other' }];
      const removeFailures: Array<{
        errorCode: string | null;
        errorMessage: string | null;
      }> = [];
      const result = buildCombinedAssignRemovePartialSuccessError(
        0,
        1,
        0,
        0,
        assignFailures,
        removeFailures,
        WorkerSelectionMode.Leads,
        mockIntl,
      );
      expect(result.errorTitle).toBe('Assign/Remove title');
      expect(result.errorMessage).toContain('1 assign');
    });
  });

  describe('handleGroupCreationPartialSuccess', () => {
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const map: Record<string, string> = {
          'groups.errors.partial_inactive_title_workers': 'Inactive',
          'groups.errors.partial_other_title_workers': 'Partial',
          'groups.errors.partial_other_message_workers': 'Failed',
          'groups.errors.combined_partial_title': 'Combined',
          'groups.errors.combined_partial_message': 'Members and leads failed',
        };
        return map[config.id] || config.id;
      },
    };

    test('returns hasPartialSuccess false when neither members nor leads partial', () => {
      const result = handleGroupCreationPartialSuccess(
        { memberAssignments: {}, leadAssignments: {} } as any,
        mockIntl,
      );
      expect(result.hasPartialSuccess).toBe(false);
    });

    test('returns both scenario when members and leads have partial success', () => {
      const result = handleGroupCreationPartialSuccess(
        {
          memberAssignments: {
            partialSuccess: true,
            membersAssigned: 2,
            membersFailed: 1,
            failures: [{ errorCode: 'X', errorMessage: 'Y' }],
          },
          leadAssignments: {
            partialSuccess: true,
            leadsAssigned: 1,
            leadsFailed: 1,
            failures: [{ errorCode: 'Z', errorMessage: 'W' }],
          },
        } as any,
        mockIntl,
      );
      expect(result.hasPartialSuccess).toBe(true);
      expect(result.error).toBeDefined();
      expect(result.logDetails?.scenario).toBe('both');
    });

    test('returns members scenario when only members have partial success', () => {
      const result = handleGroupCreationPartialSuccess(
        {
          memberAssignments: {
            partialSuccess: true,
            membersAssigned: 1,
            membersFailed: 1,
            failures: [],
          },
          leadAssignments: {},
        } as any,
        mockIntl,
      );
      expect(result.hasPartialSuccess).toBe(true);
      expect(result.logDetails?.scenario).toBe('members');
    });

    test('returns leads scenario when only leads have partial success', () => {
      const result = handleGroupCreationPartialSuccess(
        {
          memberAssignments: {},
          leadAssignments: {
            partialSuccess: true,
            leadsAssigned: 0,
            leadsFailed: 2,
            failures: [],
          },
        } as any,
        mockIntl,
      );
      expect(result.hasPartialSuccess).toBe(true);
      expect(result.logDetails?.scenario).toBe('leads');
    });
  });

  describe('hasUnsavedChangesInCreateMode', () => {
    test('should return true when group name has content', () => {
      const result = hasUnsavedChangesInCreateMode('Test Group', {}, {});
      expect(result).toBe(true);
    });

    test('should return true when group name has whitespace only', () => {
      const result = hasUnsavedChangesInCreateMode('   ', {}, {});
      expect(result).toBe(false); // trim() makes it empty
    });

    test('should return true when selectedMembers has entries', () => {
      const members = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInCreateMode('', members, {});
      expect(result).toBe(true);
    });

    test('should return true when selectedLeads has entries', () => {
      const leads = {
        'lead-1': {
          id: 'lead-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInCreateMode('', {}, leads);
      expect(result).toBe(true);
    });

    test('should return true when both members and leads have entries', () => {
      const members = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const leads = {
        'lead-1': {
          id: 'lead-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInCreateMode('', members, leads);
      expect(result).toBe(true);
    });

    test('should return false when all inputs are empty', () => {
      const result = hasUnsavedChangesInCreateMode('', {}, {});
      expect(result).toBe(false);
    });

    test('should return true when group name has content even if selections are empty', () => {
      const result = hasUnsavedChangesInCreateMode('New Group', {}, {});
      expect(result).toBe(true);
    });
  });

  describe('hasUnsavedChangesInWorkersOrLeadsSelections', () => {
    test('should return false when selections are identical', () => {
      const initial = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const current = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections(
        initial,
        current,
      );
      expect(result).toBe(false);
    });

    test('should return true when current has more items', () => {
      const initial = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const current = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        'worker-2': {
          id: 'worker-2',
          timeForType: TimeTracking_TimeForType.Vendor,
        },
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections(
        initial,
        current,
      );
      expect(result).toBe(true);
    });

    test('should return true when current has fewer items', () => {
      const initial = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        'worker-2': {
          id: 'worker-2',
          timeForType: TimeTracking_TimeForType.Vendor,
        },
      };
      const current = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections(
        initial,
        current,
      );
      expect(result).toBe(true);
    });

    test('should return true when items are completely different', () => {
      const initial = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const current = {
        'worker-2': {
          id: 'worker-2',
          timeForType: TimeTracking_TimeForType.Vendor,
        },
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections(
        initial,
        current,
      );
      expect(result).toBe(true);
    });

    test('should return false when both are empty', () => {
      const result = hasUnsavedChangesInWorkersOrLeadsSelections({}, {});
      expect(result).toBe(false);
    });

    test('should return true when initial has more items than current', () => {
      const initial = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        'worker-2': {
          id: 'worker-2',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const current = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections(
        initial,
        current,
      );
      expect(result).toBe(true);
    });

    test('should return true when initial is empty but current has items', () => {
      const current = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections({}, current);
      expect(result).toBe(true);
    });

    test('should return true when current is empty but initial has items', () => {
      const initial = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections(initial, {});
      expect(result).toBe(true);
    });

    test('should return true when initial has items not in current', () => {
      const initial = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        'worker-2': {
          id: 'worker-2',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const current = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections(
        initial,
        current,
      );
      expect(result).toBe(true);
    });

    test('should return true when current has items not in initial (different sets)', () => {
      const initial = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const current = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        'worker-2': {
          id: 'worker-2',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections(
        initial,
        current,
      );
      expect(result).toBe(true);
    });

    test('should return true when initial has items not in current (different sets)', () => {
      const initial = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        'worker-3': {
          id: 'worker-3',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const current = {
        'worker-2': {
          id: 'worker-2',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        'worker-4': {
          id: 'worker-4',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections(
        initial,
        current,
      );
      expect(result).toBe(true);
    });

    test('should handle large selections correctly', () => {
      const initial: Record<string, any> = {};
      const current: Record<string, any> = {};
      Array.from({ length: 100 }, (_, i) => i + 1).forEach((i) => {
        const workerId = `worker-${i}`;
        initial[workerId] = {
          id: workerId,
          timeForType: TimeTracking_TimeForType.Employee,
        };
        current[workerId] = {
          id: workerId,
          timeForType: TimeTracking_TimeForType.Employee,
        };
      });
      // Add one more to current
      current['worker-101'] = {
        id: 'worker-101',
        timeForType: TimeTracking_TimeForType.Employee,
      };
      const result = hasUnsavedChangesInWorkersOrLeadsSelections(
        initial,
        current,
      );
      expect(result).toBe(true);
    });
  });

  describe('sanitizeErrorMessage', () => {
    const TSHEETS_STRING = ' from TSheets';

    describe('String errors', () => {
      test.each([
        {
          description: 'should remove TSheets string from error message',
          input: 'An error occurred from TSheets while processing request',
          expected: 'An error occurred while processing request',
        },
        {
          description:
            'should remove TSheets string when it appears at the end',
          input: 'Worker validation failed from TSheets',
          expected: 'Worker validation failed',
        },
        {
          description:
            'should remove TSheets string when it appears in the middle',
          input: 'Error from TSheets during sync process',
          expected: 'Error during sync process',
        },
        {
          description:
            'should return error unchanged when TSheets string is not present',
          input: 'An error occurred while processing request',
          expected: 'An error occurred while processing request',
        },
        {
          description: 'should handle empty string',
          input: '',
          expected: '',
        },
        {
          description: 'should handle error with only TSheets string',
          input: ' from TSheets',
          expected: '',
        },
        {
          description: 'should handle error with special characters',
          input: 'Worker@123 validation failed from TSheets!',
          expected: 'Worker@123 validation failed!',
        },
        {
          description:
            'should handle error with whitespace around TSheets string',
          input: 'Error   from TSheets   occurred',
          expected: 'Error     occurred',
        },
        {
          description: 'should handle long error messages with TSheets string',
          input:
            'A very long error message occurred from TSheets during the processing of worker assignments',
          expected:
            'A very long error message occurred during the processing of worker assignments',
        },
        {
          description:
            'should handle error with TSheets string at the beginning',
          input: ' from TSheets: Worker validation failed',
          expected: ': Worker validation failed',
        },
      ])('$description', ({ input, expected }) => {
        const result = sanitizeErrorMessage(input);
        expect(result).toBe(expected);
      });
    });

    describe('Non-string errors', () => {
      test('should return object errors unchanged', () => {
        const error = {
          message: 'An error occurred from TSheets',
          code: 'ERROR_CODE',
        };
        const result = sanitizeErrorMessage(error);
        expect(result).toEqual(error);
        expect(result).toBe(error); // Same reference
      });

      test('should return Error instance unchanged', () => {
        const error = new Error('Error from TSheets occurred');
        const result = sanitizeErrorMessage(error);
        expect(result).toBe(error);
        expect(result.message).toBe('Error from TSheets occurred');
      });

      test('should return error object with message property unchanged', () => {
        const error = {
          message: 'Error from TSheets',
          errorCode: 'ERROR_CODE',
        };
        const result = sanitizeErrorMessage(error);
        expect(result).toEqual(error);
      });

      test('should return error object with errorMessage property unchanged', () => {
        const error = {
          errorMessage: 'Validation failed from TSheets',
          errorCode: 'VALIDATION_FAILED',
        };
        const result = sanitizeErrorMessage(error);
        expect(result).toEqual(error);
      });

      test('should return complex error objects unchanged', () => {
        const error = {
          message: 'Request failed from TSheets',
          errorMessage: 'Worker not found from TSheets',
          errorCode: 'NOT_FOUND',
          statusCode: 404,
          details: { key: 'value' },
        };
        const result = sanitizeErrorMessage(error);
        expect(result).toEqual(error);
        expect(result).toBe(error);
      });

      test('should return array unchanged', () => {
        const error = ['error1 from TSheets', 'error2'];
        const result = sanitizeErrorMessage(error);
        expect(result).toEqual(error);
        expect(result).toBe(error);
      });

      test('should return number unchanged', () => {
        const result = sanitizeErrorMessage(123);
        expect(result).toBe(123);
      });

      test('should return boolean unchanged', () => {
        const result1 = sanitizeErrorMessage(true);
        const result2 = sanitizeErrorMessage(false);
        expect(result1).toBe(true);
        expect(result2).toBe(false);
      });
    });

    describe('Null and undefined handling', () => {
      test('should return null when error is null', () => {
        const result = sanitizeErrorMessage(null);
        expect(result).toBeNull();
      });

      test('should return undefined when error is undefined', () => {
        const result = sanitizeErrorMessage(undefined);
        expect(result).toBeUndefined();
      });

      test('should handle falsy values', () => {
        expect(sanitizeErrorMessage(0)).toBe(0);
        expect(sanitizeErrorMessage(false)).toBe(false);
        expect(sanitizeErrorMessage('')).toBe('');
        expect(sanitizeErrorMessage(null)).toBeNull();
        expect(sanitizeErrorMessage(undefined)).toBeUndefined();
      });
    });

    describe('Real-world scenarios', () => {
      test('should sanitize worker validation error string', () => {
        const error = 'Worker validation failed from TSheets';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Worker validation failed');
      });

      test('should sanitize group creation error string', () => {
        const error =
          'Group with name already exists from TSheets for company 123';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Group with name already exists for company 123');
      });

      test('should sanitize assignment error string', () => {
        const error = 'Failed to assign workers from TSheets to group';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Failed to assign workers to group');
      });

      test('should sanitize removal error string', () => {
        const error = 'Failed to remove workers from TSheets from group';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Failed to remove workers from group');
      });

      test('should handle network timeout error string', () => {
        const error = 'Network timeout occurred from TSheets';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Network timeout occurred');
      });

      test('should leave non-TSheets errors unchanged', () => {
        const error = 'Network error occurred during processing';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe(error);
      });

      test('should handle error objects that are typically used (return unchanged)', () => {
        const error = {
          message: 'GraphQL error from TSheets',
          locations: [{ line: 1, column: 1 }],
          path: ['query', 'workers'],
        };
        const result = sanitizeErrorMessage(error);
        expect(result).toEqual(error);
        expect(result).toBe(error);
      });
    });

    describe('Edge cases and special scenarios', () => {
      test('should handle string with multiple spaces', () => {
        const error = 'Error     from TSheets     occurred';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Error         occurred');
      });

      test('should handle unicode characters in error string', () => {
        const error = 'Errör öccurred from TSheets with spëcial chars';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Errör öccurred with spëcial chars');
      });

      test('should handle very long error strings', () => {
        const longError = `${'Error '.repeat(100)} from TSheets occurred`;
        const result = sanitizeErrorMessage(longError);
        expect(result).toBe(`${'Error '.repeat(100)} occurred`);
      });

      test('should handle error string with newlines', () => {
        const error = 'Error occurred from TSheets\nDetails: Some details';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Error occurred\nDetails: Some details');
      });

      test('should handle error string with tabs', () => {
        const error = 'Error\toccurred from TSheets\twith tabs';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Error\toccurred\twith tabs');
      });

      test('should handle partial TSheets string (not exact match)', () => {
        const error = 'Error from TSheet';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Error from TSheet'); // Unchanged
      });

      test('should handle TSheets as part of another word', () => {
        const error = 'Error fromTSheets occurred';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Error fromTSheets occurred'); // Unchanged
      });

      test('should remove only first occurrence when TSheets string appears 3+ times', () => {
        const error = 'Error from TSheets from TSheets from TSheets occurred';
        const result = sanitizeErrorMessage(error);
        expect(result).toBe('Error from TSheets from TSheets occurred');
      });
    });
  });
});
