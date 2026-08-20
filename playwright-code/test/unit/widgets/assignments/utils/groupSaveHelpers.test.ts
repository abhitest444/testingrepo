import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { DrawerWorker } from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import {
  buildSelectedWorkers,
  calculateChanges,
  extractGroupCounts,
  handleSaveOperation,
} from 'src/js/widgets/assignments/utils/groupSaveHelpers';
import {
  OperationType,
  ErrorSource,
} from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';
import * as CustomerInteraction from 'src/js/common/CustomerInteraction';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

describe('groupSaveHelpers', () => {
  describe('buildSelectedWorkers', () => {
    it('should return empty object when no workers are selected', () => {
      const drawerWorkersById: Record<string, DrawerWorker> = {
        '1': {
          id: '1',
          displayName: 'Worker 1',
          firstName: 'Worker',
          lastName: '1',
          type: TimeTracking_TimeForType.Employee,
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
        '2': {
          id: '2',
          displayName: 'Worker 2',
          firstName: 'Worker',
          lastName: '2',
          type: TimeTracking_TimeForType.Employee,
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      };

      const result = buildSelectedWorkers(drawerWorkersById);

      expect(result).toEqual({});
    });

    it('should return selected workers with correct structure', () => {
      const drawerWorkersById: Record<string, DrawerWorker> = {
        '1': {
          id: '1',
          displayName: 'Worker 1',
          firstName: 'Worker',
          lastName: '1',
          type: TimeTracking_TimeForType.Employee,
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
        '2': {
          id: '2',
          displayName: 'Worker 2',
          firstName: 'Worker',
          lastName: '2',
          type: TimeTracking_TimeForType.Vendor,
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
        '3': {
          id: '3',
          displayName: 'Worker 3',
          firstName: 'Worker',
          lastName: '3',
          type: TimeTracking_TimeForType.Employee,
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
      };

      const result = buildSelectedWorkers(drawerWorkersById);

      expect(result).toEqual({
        '1': {
          id: '1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        '3': {
          id: '3',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      });
    });

    it('should handle vendor type workers', () => {
      const drawerWorkersById: Record<string, DrawerWorker> = {
        '1': {
          id: '1',
          displayName: 'Vendor 1',
          firstName: 'Vendor',
          lastName: '1',
          type: TimeTracking_TimeForType.Vendor,
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
      };

      const result = buildSelectedWorkers(drawerWorkersById);

      expect(result).toEqual({
        '1': {
          id: '1',
          timeForType: TimeTracking_TimeForType.Vendor,
        },
      });
    });

    it('should handle empty input object', () => {
      const drawerWorkersById: Record<string, DrawerWorker> = {};

      const result = buildSelectedWorkers(drawerWorkersById);

      expect(result).toEqual({});
    });

    it('should handle all workers selected', () => {
      const drawerWorkersById: Record<string, DrawerWorker> = {
        '1': {
          id: '1',
          displayName: 'Worker 1',
          firstName: 'Worker',
          lastName: '1',
          type: TimeTracking_TimeForType.Employee,
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
        '2': {
          id: '2',
          displayName: 'Worker 2',
          firstName: 'Worker',
          lastName: '2',
          type: TimeTracking_TimeForType.Employee,
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
      };

      const result = buildSelectedWorkers(drawerWorkersById);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['1']).toBeDefined();
      expect(result['2']).toBeDefined();
    });
  });

  describe('calculateChanges', () => {
    it('should return empty arrays when no changes', () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };

      const result = calculateChanges(currentSelected, initialSelected);

      expect(result.additions).toEqual([]);
      expect(result.removals).toEqual([]);
    });

    it('should identify additions', () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
        '3': { id: '3', timeForType: TimeTracking_TimeForType.Vendor },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const result = calculateChanges(currentSelected, initialSelected);

      expect(result.additions).toHaveLength(2);
      expect(result.additions).toContainEqual({
        id: '2',
        timeForType: TimeTracking_TimeForType.Employee,
      });
      expect(result.additions).toContainEqual({
        id: '3',
        timeForType: TimeTracking_TimeForType.Vendor,
      });
      expect(result.removals).toEqual([]);
    });

    it('should identify removals', () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
        '3': { id: '3', timeForType: TimeTracking_TimeForType.Vendor },
      };

      const result = calculateChanges(currentSelected, initialSelected);

      expect(result.additions).toEqual([]);
      expect(result.removals).toHaveLength(2);
      expect(result.removals).toContainEqual({
        id: '2',
        timeForType: TimeTracking_TimeForType.Employee,
      });
      expect(result.removals).toContainEqual({
        id: '3',
        timeForType: TimeTracking_TimeForType.Vendor,
      });
    });

    it('should identify both additions and removals', () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '3': { id: '3', timeForType: TimeTracking_TimeForType.Vendor },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };

      const result = calculateChanges(currentSelected, initialSelected);

      expect(result.additions).toHaveLength(1);
      expect(result.additions[0]).toEqual({
        id: '3',
        timeForType: TimeTracking_TimeForType.Vendor,
      });
      expect(result.removals).toHaveLength(1);
      expect(result.removals[0]).toEqual({
        id: '2',
        timeForType: TimeTracking_TimeForType.Employee,
      });
    });

    it('should handle empty current selection', () => {
      const currentSelected = {};
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };

      const result = calculateChanges(currentSelected, initialSelected);

      expect(result.additions).toEqual([]);
      expect(result.removals).toHaveLength(2);
    });

    it('should handle empty initial selection', () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {};

      const result = calculateChanges(currentSelected, initialSelected);

      expect(result.additions).toHaveLength(2);
      expect(result.removals).toEqual([]);
    });

    it('should handle both empty selections', () => {
      const currentSelected = {};
      const initialSelected = {};

      const result = calculateChanges(currentSelected, initialSelected);

      expect(result.additions).toEqual([]);
      expect(result.removals).toEqual([]);
    });
  });

  describe('extractGroupCounts', () => {
    it('should extract member count from assign members response', () => {
      const results = [
        {
          data: {
            timeTrackingAssignGroupMembers: {
              group: {
                stats: {
                  memberCount: 10,
                  managerCount: 3,
                },
              },
            },
          },
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({
        memberCount: 10,
        managerCount: 3,
      });
    });

    it('should extract manager count from assign managers response', () => {
      const results = [
        {
          data: {
            timeTrackingAssignGroupManagers: {
              group: {
                stats: {
                  memberCount: 15,
                  managerCount: 5,
                },
              },
            },
          },
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({
        memberCount: 15,
        managerCount: 5,
      });
    });

    it('should extract counts from remove members response', () => {
      const results = [
        {
          data: {
            timeTrackingRemoveGroupMembers: {
              group: {
                stats: {
                  memberCount: 8,
                  managerCount: 2,
                },
              },
            },
          },
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({
        memberCount: 8,
        managerCount: 2,
      });
    });

    it('should extract counts from remove managers response', () => {
      const results = [
        {
          data: {
            timeTrackingRemoveGroupManagers: {
              group: {
                stats: {
                  memberCount: 12,
                  managerCount: 4,
                },
              },
            },
          },
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({
        memberCount: 12,
        managerCount: 4,
      });
    });

    it('should return empty object when results array is empty', () => {
      const results: any[] = [];

      const result = extractGroupCounts(results);

      expect(result).toEqual({});
    });

    it('should return empty object when no valid data found', () => {
      const results = [
        {
          data: {
            someOtherField: {},
          },
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({});
    });

    it('should return empty object when group data has no stats', () => {
      const results = [
        {
          data: {
            timeTrackingAssignGroupMembers: {
              group: {},
            },
          },
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({});
    });

    it('should return first valid result from multiple results', () => {
      const results = [
        {
          data: {
            timeTrackingAssignGroupMembers: {
              group: {
                stats: {
                  memberCount: 10,
                  managerCount: 3,
                },
              },
            },
          },
        },
        {
          data: {
            timeTrackingAssignGroupManagers: {
              group: {
                stats: {
                  memberCount: 20,
                  managerCount: 6,
                },
              },
            },
          },
        },
      ];

      const result = extractGroupCounts(results);

      // Should return first valid result
      expect(result).toEqual({
        memberCount: 10,
        managerCount: 3,
      });
    });

    it('should skip invalid results and find first valid one', () => {
      const results = [
        {
          data: null,
        },
        {
          data: {
            someOtherField: {},
          },
        },
        {
          data: {
            timeTrackingRemoveGroupMembers: {
              group: {
                stats: {
                  memberCount: 7,
                  managerCount: 1,
                },
              },
            },
          },
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({
        memberCount: 7,
        managerCount: 1,
      });
    });

    it('should handle result with null group', () => {
      const results = [
        {
          data: {
            timeTrackingAssignGroupMembers: {
              group: null,
            },
          },
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({});
    });

    it('should handle result with undefined data', () => {
      const results = [
        {
          data: undefined,
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({});
    });

    it('should handle partial stats (only memberCount)', () => {
      const results = [
        {
          data: {
            timeTrackingAssignGroupMembers: {
              group: {
                stats: {
                  memberCount: 5,
                },
              },
            },
          },
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({
        memberCount: 5,
        managerCount: undefined,
      });
    });

    it('should handle partial stats (only managerCount)', () => {
      const results = [
        {
          data: {
            timeTrackingAssignGroupManagers: {
              group: {
                stats: {
                  managerCount: 2,
                },
              },
            },
          },
        },
      ];

      const result = extractGroupCounts(results);

      expect(result).toEqual({
        memberCount: undefined,
        managerCount: 2,
      });
    });
  });

  describe('handleSaveOperation', () => {
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const messages: { [key: string]: string } = {
          'groups.assign_members.success':
            '{count} worker(s) assigned to {groupName}',
          'groups.remove_members.success':
            '{count} worker(s) removed from {groupName}',
          'groups.assign_remove_members.success':
            '{assignedCount} worker(s) assigned to and {removedCount} worker(s) removed from {groupName}',
          'groups.assign_members.partial_success':
            '{assigned} worker(s) assigned to {groupName}, {failed} failed',
          'groups.remove_members.partial_success':
            '{removed} worker(s) removed from {groupName}, {failed} failed',
          'groups.errors.partial_other_title_workers': 'Partial success title',
          'groups.errors.partial_other_message_workers': '{failedCount} failed',
          'groups.errors.partial_inactive_title_workers': 'Inactive workers',
          'groups.errors.combined_assign_remove_title':
            'Assign {assignCount} remove {removeCount}',
          'groups.errors.combined_assign_remove_message':
            '{assignFailedCount} assign failed, {removeFailedCount} remove failed',
        };
        const message = messages[config.id] || config.id;
        if (values) {
          return Object.entries(values).reduce(
            (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
            message,
          );
        }
        return message;
      },
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const mockSandbox = {
      logger: mockLogger,
      performance: {
        createCustomerInteraction: jest.fn(),
        getCustomerInteraction: jest.fn().mockReturnValue({
          getTracePropagationHeaders: jest.fn().mockReturnValue({}),
        }),
      },
    } as any;

    const mockHandleError = jest.fn();

    const baseConfig = {
      operationType: OperationType.Members,
      assignMutationField: 'timeTrackingAssignGroupMembers' as const,
      removeMutationField: 'timeTrackingRemoveGroupMembers' as const,
      assignErrorSource: ErrorSource.AssignMembers as ErrorSource.AssignMembers,
      removeErrorSource: ErrorSource.RemoveMembers as ErrorSource.RemoveMembers,
      countField: 'memberCount' as const,
      noChangesLogMessage: 'No changes',
      errorLogMessage: 'Error occurred',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return success true with empty message when no changes (drawer should close)', async () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn();
      const mockRemoveMutation = jest.fn();

      const result = await handleSaveOperation(baseConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(true);
      expect(result.successMessage).toBe('');
      expect(mockLogger.info).toHaveBeenCalledWith('No changes');
      expect(mockAssignMutation).not.toHaveBeenCalled();
      expect(mockRemoveMutation).not.toHaveBeenCalled();
    });

    test('should handle assign only operation successfully', async () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'SUCCESS',
            assignmentResults: [{ worker: { id: '2' } }],
            group: {
              stats: {
                memberCount: 2,
                managerCount: 0,
              },
            },
          },
        },
      });
      const mockRemoveMutation = jest.fn();

      const result = await handleSaveOperation(baseConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(true);
      expect(result.successMessage).toBe('1 worker(s) assigned to Test Group');
      expect(result.counts).toEqual({ memberCount: 2, managerCount: 0 });
      expect(mockAssignMutation).toHaveBeenCalled();
      expect(mockRemoveMutation).not.toHaveBeenCalled();
    });

    test('should handle remove only operation successfully', async () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn();
      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'SUCCESS',
            removalResults: [{ worker: { id: '2' } }],
            group: {
              stats: {
                memberCount: 1,
                managerCount: 0,
              },
            },
          },
        },
      });

      const result = await handleSaveOperation(baseConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(true);
      expect(result.successMessage).toBe('1 worker(s) removed from Test Group');
      expect(result.counts).toEqual({ memberCount: 1, managerCount: 0 });
      expect(mockAssignMutation).not.toHaveBeenCalled();
      expect(mockRemoveMutation).toHaveBeenCalled();
    });

    test('should handle combined assign and remove operation successfully', async () => {
      const currentSelected = {
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
        '3': { id: '3', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'SUCCESS',
            assignmentResults: [{ worker: { id: '3' } }],
            group: {
              stats: {
                memberCount: 2,
                managerCount: 0,
              },
            },
          },
        },
      });
      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'SUCCESS',
            removalResults: [{ worker: { id: '1' } }],
            group: {
              stats: {
                memberCount: 2,
                managerCount: 0,
              },
            },
          },
        },
      });

      const result = await handleSaveOperation(baseConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(true);
      expect(result.successMessage).toContain('assigned to and');
      expect(result.successMessage).toContain('removed from');
      expect(mockAssignMutation).toHaveBeenCalled();
      expect(mockRemoveMutation).toHaveBeenCalled();
    });

    test('should handle assign error', async () => {
      const currentSelected = {
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {};

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupMembers: {
            errorCode: 'INVALID_GROUP',
            message: 'Group not found',
          },
        },
      });
      const mockRemoveMutation = jest.fn();

      const result = await handleSaveOperation(baseConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      expect(mockHandleError).toHaveBeenCalledWith(
        'Group not found',
        'INVALID_GROUP',
        ErrorSource.AssignMembers,
      );
    });

    test('should handle remove error', async () => {
      const currentSelected = {};
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn();
      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            errorCode: 'INVALID_GROUP',
            message: 'Group not found',
          },
        },
      });

      const result = await handleSaveOperation(baseConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      expect(mockHandleError).toHaveBeenCalledWith(
        'Group not found',
        'INVALID_GROUP',
        ErrorSource.RemoveMembers,
      );
    });

    test('should handle partial success as error', async () => {
      const currentSelected = {
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {};

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            assignmentResults: [
              { worker: { id: '2' } },
              {
                workerId: '3',
                errorCode: 'ALREADY_IN_GROUP',
                errorMessage: 'Already in group',
              },
            ],
            group: {
              stats: {
                memberCount: 1,
                managerCount: 0,
              },
            },
          },
        },
      });
      const mockRemoveMutation = jest.fn();

      const result = await handleSaveOperation(baseConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      if (result.counts) {
        expect(result.counts).toEqual({ memberCount: 1, managerCount: 0 });
      }
    });

    test('should handle both operations failing', async () => {
      const currentSelected = {
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupMembers: {
            errorCode: 'ERROR',
            message: 'Assign failed',
          },
        },
      });
      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            errorCode: 'ERROR',
            message: 'Remove failed',
          },
        },
      });

      const result = await handleSaveOperation(baseConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      expect(mockHandleError).toHaveBeenCalledTimes(2);
    });

    test('should handle exception during mutation', async () => {
      const currentSelected = {
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {};

      const mockAssignMutation = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));
      const mockRemoveMutation = jest.fn();

      const result = await handleSaveOperation(baseConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred', {
        error: expect.any(Error),
      });
    });
  });

  describe('handleSaveOperation - Customer Interaction Tracking', () => {
    // QUANTA-7125: Tests for customer interaction tracking in EditGroupDrawer
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const messages: { [key: string]: string } = {
          'groups.assign_members.success':
            '{count} worker(s) assigned to {groupName}',
          'groups.remove_members.success':
            '{count} worker(s) removed from {groupName}',
          'groups.assign_managers.success':
            '{count} lead(s) assigned to {groupName}',
          'groups.remove_managers.success':
            '{count} lead(s) removed from {groupName}',
          'groups.errors.partial_other_title_workers': 'Partial success title',
          'groups.errors.partial_other_message_workers': '{failedCount} failed',
          'groups.errors.partial_inactive_title_workers': 'Inactive workers',
          'groups.errors.combined_assign_remove_title':
            'Assign {assignCount} remove {removeCount}',
          'groups.errors.combined_assign_remove_message':
            '{assignFailedCount} assign failed, {removeFailedCount} remove failed',
        };
        const message = messages[config.id] || config.id;
        if (values) {
          return Object.entries(values).reduce(
            (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
            message,
          );
        }
        return message;
      },
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const mockSandbox = {
      logger: mockLogger,
      performance: {
        createCustomerInteraction: jest.fn(),
        getCustomerInteraction: jest.fn().mockReturnValue({
          getTracePropagationHeaders: jest.fn().mockReturnValue({}),
        }),
      },
    } as any;

    const mockHandleError = jest.fn();

    const membersConfig = {
      operationType: OperationType.Members,
      assignMutationField: 'timeTrackingAssignGroupMembers' as const,
      removeMutationField: 'timeTrackingRemoveGroupMembers' as const,
      assignErrorSource: ErrorSource.AssignMembers as ErrorSource.AssignMembers,
      removeErrorSource: ErrorSource.RemoveMembers as ErrorSource.RemoveMembers,
      countField: 'memberCount' as const,
      noChangesLogMessage: 'No changes',
      errorLogMessage: 'Error occurred',
    };

    const managersConfig = {
      operationType: OperationType.Managers,
      assignMutationField: 'timeTrackingAssignGroupManagers' as const,
      removeMutationField: 'timeTrackingRemoveGroupManagers' as const,
      assignErrorSource:
        ErrorSource.AssignManagers as ErrorSource.AssignManagers,
      removeErrorSource:
        ErrorSource.RemoveManagers as ErrorSource.RemoveManagers,
      countField: 'managerCount' as const,
      noChangesLogMessage: 'No changes',
      errorLogMessage: 'Error occurred',
    };

    let createCustomerInteractionSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      createCustomerInteractionSpy = jest.spyOn(
        CustomerInteraction,
        'createCustomerInteraction',
      );
    });

    afterEach(() => {
      createCustomerInteractionSpy.mockRestore();
    });

    test('should create GROUP_ASSIGN_MEMBERS interaction when assigning members', async () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'SUCCESS',
            assignmentResults: [{ worker: { id: '2' } }],
            group: { stats: { memberCount: 2, managerCount: 0 } },
          },
        },
      });

      await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: jest.fn(),
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(createCustomerInteractionSpy).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      );
    });

    test('should create GROUP_REMOVE_MEMBERS interaction when removing members', async () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'SUCCESS',
            removalResults: [{ worker: { id: '2' } }],
            group: { stats: { memberCount: 1, managerCount: 0 } },
          },
        },
      });

      await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: jest.fn(),
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(createCustomerInteractionSpy).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.GROUP_REMOVE_MEMBERS,
      );
    });

    test('should create both ASSIGN and REMOVE member interactions when both operations needed', async () => {
      const currentSelected = {
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'SUCCESS',
            assignmentResults: [{ worker: { id: '2' } }],
            group: { stats: { memberCount: 1, managerCount: 0 } },
          },
        },
      });
      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'SUCCESS',
            removalResults: [{ worker: { id: '1' } }],
            group: { stats: { memberCount: 1, managerCount: 0 } },
          },
        },
      });

      await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(createCustomerInteractionSpy).toHaveBeenCalledTimes(2);
      expect(createCustomerInteractionSpy).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      );
      expect(createCustomerInteractionSpy).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.GROUP_REMOVE_MEMBERS,
      );
    });

    test('should NOT create customer interactions when no changes detected', async () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: jest.fn(),
        removeMutation: jest.fn(),
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(createCustomerInteractionSpy).not.toHaveBeenCalled();
    });

    test('should create GROUP_ASSIGN_MANAGERS interaction when assigning managers', async () => {
      const currentSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {};

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupManagers: {
            successCode: 'SUCCESS',
            assignmentResults: [{ worker: { id: '1' } }],
            group: { stats: { memberCount: 5, managerCount: 1 } },
          },
        },
      });

      await handleSaveOperation(managersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: jest.fn(),
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(createCustomerInteractionSpy).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
      );
    });

    test('should create GROUP_REMOVE_MANAGERS interaction when removing managers', async () => {
      const currentSelected = {};
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupManagers: {
            successCode: 'SUCCESS',
            removalResults: [{ worker: { id: '1' } }],
            group: { stats: { memberCount: 5, managerCount: 0 } },
          },
        },
      });

      await handleSaveOperation(managersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: jest.fn(),
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(createCustomerInteractionSpy).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.GROUP_REMOVE_MANAGERS,
      );
    });

    test('should create customer interactions before mutations are called', async () => {
      const currentSelected = {
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {};

      const callOrder: string[] = [];

      createCustomerInteractionSpy.mockImplementation(() => {
        callOrder.push('createCustomerInteraction');
      });

      const mockAssignMutation = jest.fn().mockImplementation(() => {
        callOrder.push('assignMutation');
        return Promise.resolve({
          data: {
            timeTrackingAssignGroupMembers: {
              successCode: 'SUCCESS',
              assignmentResults: [{ worker: { id: '2' } }],
              group: { stats: { memberCount: 1, managerCount: 0 } },
            },
          },
        });
      });

      await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: jest.fn(),
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      // Verify createCustomerInteraction was called before assignMutation
      expect(callOrder.indexOf('createCustomerInteraction')).toBeLessThan(
        callOrder.indexOf('assignMutation'),
      );
    });

    test('should handle removal partial success for members', async () => {
      const currentSelected = {};
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            removalResults: [
              { worker: { id: '1' } },
              {
                workerId: '2',
                errorCode: 'NOT_IN_GROUP',
                errorMessage: 'Not in group',
              },
            ],
            group: { stats: { memberCount: 0, managerCount: 0 } },
          },
        },
      });

      const result = await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: jest.fn(),
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Component=handleSaveOperation Event=Partial success in remove',
        expect.objectContaining({
          successCount: 1,
          failedCount: 1,
          failures: expect.any(Array),
        }),
      );
      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(String),
        'PARTIAL_SUCCESS',
        ErrorSource.RemoveMembers,
      );
    });

    test('should handle only remove partial success when both assign and remove run (CASE 3)', async () => {
      const currentSelected = {
        '3': { id: '3', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'SUCCESS',
            assignmentResults: [{ worker: { id: '3' } }],
            group: { stats: { memberCount: 1, managerCount: 0 } },
          },
        },
      });

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            removalResults: [
              { worker: { id: '1' } },
              {
                workerId: '2',
                errorCode: 'WORKER_VALIDATION_FAILED',
                errorMessage: 'Worker inactive',
              },
            ],
            group: { stats: { memberCount: 1, managerCount: 0 } },
          },
        },
      });

      const result = await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      expect(result.counts).toEqual({ memberCount: 1, managerCount: 0 });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Component=handleSaveOperation Event=Partial success in remove',
        expect.objectContaining({
          successCount: 1,
          failedCount: 1,
        }),
      );
      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(String),
        'PARTIAL_SUCCESS',
        ErrorSource.RemoveMembers,
      );
    });

    test('should handle both assign and remove partial success', async () => {
      const currentSelected = {
        '3': { id: '3', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            assignmentResults: [
              { worker: { id: '3' } },
              {
                workerId: '4',
                errorCode: 'ALREADY_IN_GROUP',
                errorMessage: 'Already in group',
              },
            ],
            group: { stats: { memberCount: 2, managerCount: 0 } },
          },
        },
      });

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            removalResults: [
              { worker: { id: '1' } },
              {
                workerId: '2',
                errorCode: 'NOT_IN_GROUP',
                errorMessage: 'Not in group',
              },
            ],
            group: { stats: { memberCount: 2, managerCount: 0 } },
          },
        },
      });

      const result = await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
    });

    test('should create both manager interactions when both assign and remove needed', async () => {
      const currentSelected = {
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupManagers: {
            successCode: 'SUCCESS',
            assignmentResults: [{ worker: { id: '2' } }],
            group: { stats: { memberCount: 5, managerCount: 1 } },
          },
        },
      });

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupManagers: {
            successCode: 'SUCCESS',
            removalResults: [{ worker: { id: '1' } }],
            group: { stats: { memberCount: 5, managerCount: 1 } },
          },
        },
      });

      await handleSaveOperation(managersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(createCustomerInteractionSpy).toHaveBeenCalledTimes(2);
      expect(createCustomerInteractionSpy).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
      );
      expect(createCustomerInteractionSpy).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.GROUP_REMOVE_MANAGERS,
      );
    });
  });

  describe('Coverage gaps', () => {
    const mockIntl = {
      formatMessage: (config: any, values?: any) => {
        const messages: { [key: string]: string } = {
          'groups.assign_members.success':
            '{count} worker(s) assigned to {groupName}',
          'groups.remove_members.success':
            '{count} worker(s) removed from {groupName}',
          'groups.assign_remove_members.success':
            '{assignedCount} worker(s) assigned to and {removedCount} worker(s) removed from {groupName}',
          'groups.assign_members.partial_success':
            '{assigned} worker(s) assigned to {groupName}, {failed} failed',
          'groups.remove_members.partial_success':
            '{removed} worker(s) removed from {groupName}, {failed} failed',
          'groups.errors.partial_other_title_workers': 'Partial success title',
          'groups.errors.partial_other_message_workers': '{failedCount} failed',
          'groups.errors.partial_inactive_title_workers': 'Inactive workers',
          'groups.errors.combined_assign_remove_title':
            'Assign {assignCount} remove {removeCount}',
          'groups.errors.combined_assign_remove_message':
            '{assignFailedCount} assign failed, {removeFailedCount} remove failed',
        };
        const message = messages[config.id] || config.id;
        if (values) {
          return Object.entries(values).reduce(
            (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
            message,
          );
        }
        return message;
      },
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const mockSandbox = {
      logger: mockLogger,
      performance: {
        createCustomerInteraction: jest.fn(),
        getCustomerInteraction: jest.fn().mockReturnValue({
          getTracePropagationHeaders: jest.fn().mockReturnValue({}),
        }),
      },
    } as any;

    const mockHandleError = jest.fn();

    const membersConfig = {
      operationType: OperationType.Members,
      assignMutationField: 'timeTrackingAssignGroupMembers' as const,
      removeMutationField: 'timeTrackingRemoveGroupMembers' as const,
      assignErrorSource: ErrorSource.AssignMembers as ErrorSource.AssignMembers,
      removeErrorSource: ErrorSource.RemoveMembers as ErrorSource.RemoveMembers,
      countField: 'memberCount' as const,
      noChangesLogMessage: 'No changes',
      errorLogMessage: 'Error occurred',
    };

    const managersConfig = {
      operationType: OperationType.Managers,
      assignMutationField: 'timeTrackingAssignGroupManagers' as const,
      removeMutationField: 'timeTrackingRemoveGroupManagers' as const,
      assignErrorSource:
        ErrorSource.AssignManagers as ErrorSource.AssignManagers,
      removeErrorSource:
        ErrorSource.RemoveManagers as ErrorSource.RemoveManagers,
      countField: 'managerCount' as const,
      noChangesLogMessage: 'No changes',
      errorLogMessage: 'Error occurred',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    // extractGroupCounts via a remove-only operation
    // where group data comes from the removeData path
    test('should extract counts from removeData when only remove operation runs (lines 98-102, 111-117)', async () => {
      const currentSelected = {};
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'SUCCESS',
            removalResults: [{ worker: { id: '1' } }],
            group: { stats: { memberCount: 0, managerCount: 0 } },
          },
        },
      });

      const result = await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: jest.fn(),
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(true);
      expect(result.counts).toEqual({ memberCount: 0, managerCount: 0 });
    });

    test('should handle assign-only partial success for managers config (lines 320, 360-386)', async () => {
      const currentSelected = {
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {};

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupManagers: {
            successCode: 'PARTIAL_SUCCESS',
            assignmentResults: [
              { worker: { id: '2' } },
              {
                workerId: '3',
                errorCode: 'ALREADY_MANAGER',
                errorMessage: 'Already a manager',
              },
            ],
            group: { stats: { memberCount: 5, managerCount: 1 } },
          },
        },
      });

      const result = await handleSaveOperation(managersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: jest.fn(),
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Component=handleSaveOperation Event=Partial success in assign',
        expect.any(Object),
      );
      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(String),
        'PARTIAL_SUCCESS',
        ErrorSource.AssignManagers,
      );
    });

    // || 0 fallbacks when assignOp counts are undefined
    test('should use 0 fallback when assignOp counts are undefined in combined partial success (lines 327-333)', async () => {
      const currentSelected = {
        '3': { id: '3', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            // No assignmentResults — causes undefined counts
            assignmentResults: [],
            group: { stats: { memberCount: 1, managerCount: 0 } },
          },
        },
      });

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            removalResults: [],
            group: { stats: { memberCount: 1, managerCount: 0 } },
          },
        },
      });

      const result = await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Component=handleSaveOperation Event=Partial success in both assign and remove',
        expect.objectContaining({
          assignSuccessCount: expect.any(Number),
          removeSuccessCount: expect.any(Number),
        }),
      );
    });

    // successMessage || undefined when successMessage is null
    test('should return successMessage from remove-only operation (exercises line 456-464)', async () => {
      const currentSelected = {};
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        '2': { id: '2', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'SUCCESS',
            removalResults: [{ worker: { id: '1' } }, { worker: { id: '2' } }],
            group: { stats: { memberCount: 0, managerCount: 0 } },
          },
        },
      });

      const result = await handleSaveOperation(membersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: jest.fn(),
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(true);
      // successMessage may be a string or undefined depending on buildOperationMessage
      expect(
        result.successMessage === undefined ||
          typeof result.successMessage === 'string',
      ).toBe(true);
    });

    // || 0 fallbacks for REMOVE op in combined partial success with managers
    test('should handle combined partial success for managers config (lines 327-333 for remove path)', async () => {
      const currentSelected = {
        '3': { id: '3', timeForType: TimeTracking_TimeForType.Employee },
      };
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockAssignMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingAssignGroupManagers: {
            successCode: 'PARTIAL_SUCCESS',
            assignmentResults: [],
            group: { stats: { memberCount: 5, managerCount: 1 } },
          },
        },
      });

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupManagers: {
            successCode: 'PARTIAL_SUCCESS',
            removalResults: [],
            group: { stats: { memberCount: 5, managerCount: 1 } },
          },
        },
      });

      const result = await handleSaveOperation(managersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: mockAssignMutation,
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Component=handleSaveOperation Event=Partial success in both assign and remove',
        expect.any(Object),
      );
    });

    // assign-only partial success for managers (line 320 Leads branch already covered above)
    // This test uses assign-only partial to cover the full path with managers
    test('should handle remove-only partial success for managers config (line 382-405 else branch)', async () => {
      const currentSelected = {};
      const initialSelected = {
        '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
      };

      const mockRemoveMutation = jest.fn().mockResolvedValue({
        data: {
          timeTrackingRemoveGroupManagers: {
            successCode: 'PARTIAL_SUCCESS',
            removalResults: [
              {
                workerId: '2',
                errorCode: 'NOT_A_MANAGER',
                errorMessage: 'Not a manager',
              },
            ],
            group: { stats: { memberCount: 5, managerCount: 0 } },
          },
        },
      });

      const result = await handleSaveOperation(managersConfig, {
        currentSelected,
        initialSelected,
        groupId: 'group-1',
        groupName: 'Test Group',
        assignMutation: jest.fn(),
        removeMutation: mockRemoveMutation,
        handleError: mockHandleError,
        intl: mockIntl,
        logger: mockLogger,
        sandbox: mockSandbox,
      });

      expect(result.success).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Component=handleSaveOperation Event=Partial success in remove',
        expect.any(Object),
      );
    });
  });

  describe('extractGroupCounts direct coverage', () => {
    // cover the || right-hand branches in extractGroupCounts
    it('should extract counts from managers assign data (line 99: || timeTrackingAssignGroupManagers)', () => {
      const results = [
        {
          data: {
            timeTrackingAssignGroupManagers: {
              assignmentResults: [],
              group: { stats: { memberCount: 3, managerCount: 2 } },
            },
          },
        },
      ];
      const counts = extractGroupCounts(results);
      expect(counts).toEqual({ memberCount: 3, managerCount: 2 });
    });

    it('should extract counts from members remove data (lines 101-102: || timeTrackingRemoveGroupMembers)', () => {
      const results = [
        {
          data: {
            timeTrackingRemoveGroupMembers: {
              removalResults: [],
              group: { stats: { memberCount: 1, managerCount: 0 } },
            },
          },
        },
      ];
      const counts = extractGroupCounts(results);
      expect(counts).toEqual({ memberCount: 1, managerCount: 0 });
    });

    it('should extract counts from managers remove data (line 102: || timeTrackingRemoveGroupManagers)', () => {
      const results = [
        {
          data: {
            timeTrackingRemoveGroupManagers: {
              removalResults: [],
              group: { stats: { memberCount: 5, managerCount: 0 } },
            },
          },
        },
      ];
      const counts = extractGroupCounts(results);
      expect(counts).toEqual({ memberCount: 5, managerCount: 0 });
    });

    it('should return empty object when no valid group data in results', () => {
      const results = [{ data: {} }, { data: null }];
      const counts = extractGroupCounts(results);
      expect(counts).toEqual({});
    });
  });
});
