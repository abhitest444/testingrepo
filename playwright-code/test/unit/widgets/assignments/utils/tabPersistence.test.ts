import {
  TabPersistence,
  GroupDetailState,
} from 'src/js/widgets/assignments/utils/tabPersistence';
import {
  AssignmentsMainTabs,
  WorkersTabViews,
} from 'src/js/widgets/assignments/types';
import { Sandbox } from 'src/js/common/sandbox';

describe('TabPersistence', () => {
  let mockSandbox: Sandbox;
  let mockSetItemByPersonaId: jest.Mock;
  let mockGetItemByPersonaId: jest.Mock;
  let mockRemoveItemByPersonaId: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSetItemByPersonaId = jest.fn();
    mockGetItemByPersonaId = jest.fn();
    mockRemoveItemByPersonaId = jest.fn();

    mockSandbox = {
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
      },
      extensions: {
        qbo: {
          webStorage: {
            session: jest.fn().mockReturnValue({
              setItemByPersonaId: mockSetItemByPersonaId,
              getItemByPersonaId: mockGetItemByPersonaId,
              removeItemByPersonaId: mockRemoveItemByPersonaId,
            }),
          },
        },
      },
    } as unknown as Sandbox;
  });

  describe('getMainTab', () => {
    it('should return saved main tab when valid', () => {
      mockGetItemByPersonaId.mockReturnValue(AssignmentsMainTabs.WORKERS);

      const result = TabPersistence.getMainTab(mockSandbox);

      expect(result).toBe(AssignmentsMainTabs.WORKERS);
      expect(mockGetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_main_tab',
      );
    });

    it('should return CUSTOMERS as default when no saved value', () => {
      mockGetItemByPersonaId.mockReturnValue(undefined);

      const result = TabPersistence.getMainTab(mockSandbox);

      expect(result).toBe(AssignmentsMainTabs.CUSTOMERS);
    });

    it('should return CUSTOMERS as default when saved value is null', () => {
      mockGetItemByPersonaId.mockReturnValue(null);

      const result = TabPersistence.getMainTab(mockSandbox);

      expect(result).toBe(AssignmentsMainTabs.CUSTOMERS);
    });

    it('should return CUSTOMERS as default when saved value is not a string', () => {
      mockGetItemByPersonaId.mockReturnValue(123 as any);

      const result = TabPersistence.getMainTab(mockSandbox);

      expect(result).toBe(AssignmentsMainTabs.CUSTOMERS);
    });

    it('should return CUSTOMERS as default when saved value is invalid', () => {
      mockGetItemByPersonaId.mockReturnValue('INVALID_TAB');

      const result = TabPersistence.getMainTab(mockSandbox);

      expect(result).toBe(AssignmentsMainTabs.CUSTOMERS);
    });

    it('should return CUSTOMERS when value is empty string', () => {
      mockGetItemByPersonaId.mockReturnValue('');

      const result = TabPersistence.getMainTab(mockSandbox);

      expect(result).toBe(AssignmentsMainTabs.CUSTOMERS);
    });

    it('should handle error and return default with logging', () => {
      mockGetItemByPersonaId.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = TabPersistence.getMainTab(mockSandbox);

      expect(result).toBe(AssignmentsMainTabs.CUSTOMERS);
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Failed to read main tab from storage',
        { error: 'Error: Storage error' },
      );
    });

    it('should return CUSTOMERS tab from enum', () => {
      mockGetItemByPersonaId.mockReturnValue(AssignmentsMainTabs.CUSTOMERS);

      const result = TabPersistence.getMainTab(mockSandbox);

      expect(result).toBe(AssignmentsMainTabs.CUSTOMERS);
    });
  });

  describe('setMainTab', () => {
    it('should save valid main tab', () => {
      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.WORKERS);

      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_main_tab',
        AssignmentsMainTabs.WORKERS,
      );
    });

    it('should save CUSTOMERS tab', () => {
      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.CUSTOMERS);

      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_main_tab',
        AssignmentsMainTabs.CUSTOMERS,
      );
    });

    it('should not save invalid tab value', () => {
      TabPersistence.setMainTab(mockSandbox, 'INVALID' as any);

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
    });

    it('should handle error when saving with logging', () => {
      mockSetItemByPersonaId.mockImplementation(() => {
        throw new Error('Storage full');
      });

      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.WORKERS);

      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Failed to save main tab to storage',
        { error: 'Error: Storage full' },
      );
    });

    it('should validate tab before saving', () => {
      TabPersistence.setMainTab(mockSandbox, 'RANDOM_STRING' as any);

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
    });
  });

  describe('clearMainTab', () => {
    it('should clear main tab from storage', () => {
      TabPersistence.clearMainTab(mockSandbox);

      expect(mockRemoveItemByPersonaId).toHaveBeenCalledWith(
        'assignments_main_tab',
      );
    });

    it('should handle error when clearing with logging', () => {
      mockRemoveItemByPersonaId.mockImplementation(() => {
        throw new Error('Clear failed');
      });

      TabPersistence.clearMainTab(mockSandbox);

      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Failed to clear main tab from storage',
        { error: 'Error: Clear failed' },
      );
    });
  });

  describe('getWorkersView', () => {
    it('should return saved workers view when valid', () => {
      mockGetItemByPersonaId.mockReturnValue(WorkersTabViews.WORKERS);

      const result = TabPersistence.getWorkersView(mockSandbox);

      expect(result).toBe(WorkersTabViews.WORKERS);
      expect(mockGetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_workers_view',
      );
    });

    it('should return WORKERS as default when no saved value', () => {
      mockGetItemByPersonaId.mockReturnValue(undefined);

      const result = TabPersistence.getWorkersView(mockSandbox);

      expect(result).toBe(WorkersTabViews.WORKERS);
    });

    it('should return WORKERS as default when saved value is null', () => {
      mockGetItemByPersonaId.mockReturnValue(null);

      const result = TabPersistence.getWorkersView(mockSandbox);

      expect(result).toBe(WorkersTabViews.WORKERS);
    });

    it('should return WORKERS as default when saved value is not a string', () => {
      mockGetItemByPersonaId.mockReturnValue(true as any);

      const result = TabPersistence.getWorkersView(mockSandbox);

      expect(result).toBe(WorkersTabViews.WORKERS);
    });

    it('should return WORKERS as default when saved value is invalid', () => {
      mockGetItemByPersonaId.mockReturnValue('invalid_view');

      const result = TabPersistence.getWorkersView(mockSandbox);

      expect(result).toBe(WorkersTabViews.WORKERS);
    });

    it('should return GROUPS view from enum', () => {
      mockGetItemByPersonaId.mockReturnValue(WorkersTabViews.GROUPS);

      const result = TabPersistence.getWorkersView(mockSandbox);

      expect(result).toBe(WorkersTabViews.GROUPS);
    });

    it('should handle error and return default with logging', () => {
      mockGetItemByPersonaId.mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = TabPersistence.getWorkersView(mockSandbox);

      expect(result).toBe(WorkersTabViews.WORKERS);
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Failed to read workers view from storage',
        { error: 'Error: Read error' },
      );
    });
  });

  describe('setWorkersView', () => {
    it('should save valid workers view GROUPS', () => {
      TabPersistence.setWorkersView(mockSandbox, WorkersTabViews.GROUPS);

      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_workers_view',
        WorkersTabViews.GROUPS,
      );
    });

    it('should save valid workers view WORKERS', () => {
      TabPersistence.setWorkersView(mockSandbox, WorkersTabViews.WORKERS);

      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_workers_view',
        WorkersTabViews.WORKERS,
      );
    });

    it('should not save invalid view value', () => {
      TabPersistence.setWorkersView(mockSandbox, 'invalid' as any);

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
    });

    it('should handle error when saving with logging', () => {
      mockSetItemByPersonaId.mockImplementation(() => {
        throw new Error('Write error');
      });

      TabPersistence.setWorkersView(mockSandbox, WorkersTabViews.GROUPS);

      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Failed to save workers view to storage',
        { error: 'Error: Write error' },
      );
    });
  });

  describe('clearWorkersView', () => {
    it('should clear workers view from storage', () => {
      TabPersistence.clearWorkersView(mockSandbox);

      expect(mockRemoveItemByPersonaId).toHaveBeenCalledWith(
        'assignments_workers_view',
      );
    });

    it('should handle error when clearing with logging', () => {
      mockRemoveItemByPersonaId.mockImplementation(() => {
        throw new Error('Remove failed');
      });

      TabPersistence.clearWorkersView(mockSandbox);

      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Failed to clear workers view from storage',
        { error: 'Error: Remove failed' },
      );
    });
  });

  describe('getGroupDetail', () => {
    it('should return saved group detail when valid', () => {
      const groupDetail = {
        groupId: 'group-1',
        groupName: 'Engineering Team',
      };
      mockGetItemByPersonaId.mockReturnValue(JSON.stringify(groupDetail));

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toEqual(groupDetail);
      expect(mockGetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_group_detail',
      );
    });

    it('should return null when no saved value', () => {
      mockGetItemByPersonaId.mockReturnValue(undefined);

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when saved value is null', () => {
      mockGetItemByPersonaId.mockReturnValue(null);

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when saved value is not a string', () => {
      mockGetItemByPersonaId.mockReturnValue(123 as any);

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when JSON parsing fails', () => {
      mockGetItemByPersonaId.mockReturnValue('invalid json');

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Failed to read group detail from storage',
        expect.objectContaining({
          error: expect.stringContaining('SyntaxError'),
        }),
      );
    });

    it('should return null when parsed value is not an object', () => {
      mockGetItemByPersonaId.mockReturnValue(JSON.stringify('string'));

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when groupId is missing', () => {
      mockGetItemByPersonaId.mockReturnValue(
        JSON.stringify({ groupName: 'Test Group' }),
      );

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when groupName is missing', () => {
      mockGetItemByPersonaId.mockReturnValue(
        JSON.stringify({ groupId: 'group-1' }),
      );

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when groupId is not a string', () => {
      mockGetItemByPersonaId.mockReturnValue(
        JSON.stringify({ groupId: 123, groupName: 'Test' }),
      );

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when groupName is not a string', () => {
      mockGetItemByPersonaId.mockReturnValue(
        JSON.stringify({ groupId: 'group-1', groupName: 456 }),
      );

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when groupId is empty string', () => {
      mockGetItemByPersonaId.mockReturnValue(
        JSON.stringify({ groupId: '', groupName: 'Test' }),
      );

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when groupName is empty string', () => {
      mockGetItemByPersonaId.mockReturnValue(
        JSON.stringify({ groupId: 'group-1', groupName: '' }),
      );

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when groupId is whitespace only', () => {
      mockGetItemByPersonaId.mockReturnValue(
        JSON.stringify({ groupId: '   ', groupName: 'Test' }),
      );

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should return null when groupName is whitespace only', () => {
      mockGetItemByPersonaId.mockReturnValue(
        JSON.stringify({ groupId: 'group-1', groupName: '   ' }),
      );

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });

    it('should handle error when reading from storage', () => {
      mockGetItemByPersonaId.mockImplementation(() => {
        throw new Error('Storage read error');
      });

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Failed to read group detail from storage',
        { error: 'Error: Storage read error' },
      );
    });

    it('should return valid group detail with special characters', () => {
      const groupDetail = {
        groupId: 'group@123',
        groupName: "José's Team",
      };
      mockGetItemByPersonaId.mockReturnValue(JSON.stringify(groupDetail));

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toEqual(groupDetail);
    });

    it('should return null for parsed value that is null', () => {
      mockGetItemByPersonaId.mockReturnValue('null');

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
    });
  });

  describe('setGroupDetail', () => {
    it('should save valid group detail', () => {
      const groupDetail: GroupDetailState = {
        groupId: 'group-1',
        groupName: 'Engineering Team',
      };

      TabPersistence.setGroupDetail(
        mockSandbox,
        groupDetail.groupId,
        groupDetail.groupName,
      );

      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_group_detail',
        JSON.stringify(groupDetail),
      );
    });

    it('should not save when groupId is empty', () => {
      TabPersistence.setGroupDetail(mockSandbox, '', 'Test Group');

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Invalid group detail values',
        { groupId: '', groupName: 'Test Group' },
      );
    });

    it('should not save when groupName is empty', () => {
      TabPersistence.setGroupDetail(mockSandbox, 'group-1', '');

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Invalid group detail values',
        { groupId: 'group-1', groupName: '' },
      );
    });

    it('should not save when groupId is whitespace only', () => {
      TabPersistence.setGroupDetail(mockSandbox, '   ', 'Test Group');

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Invalid group detail values',
        { groupId: '   ', groupName: 'Test Group' },
      );
    });

    it('should not save when groupName is whitespace only', () => {
      TabPersistence.setGroupDetail(mockSandbox, 'group-1', '   ');

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Invalid group detail values',
        { groupId: 'group-1', groupName: '   ' },
      );
    });

    it('should not save when groupId is not a string', () => {
      TabPersistence.setGroupDetail(mockSandbox, 123 as any, 'Test Group');

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Invalid group detail values',
        { groupId: 123, groupName: 'Test Group' },
      );
    });

    it('should not save when groupName is not a string', () => {
      TabPersistence.setGroupDetail(mockSandbox, 'group-1', 456 as any);

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Invalid group detail values',
        { groupId: 'group-1', groupName: 456 },
      );
    });

    it('should handle error when saving with logging', () => {
      mockSetItemByPersonaId.mockImplementation(() => {
        throw new Error('Save failed');
      });

      TabPersistence.setGroupDetail(mockSandbox, 'group-1', 'Test Group');

      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Failed to save group detail to storage',
        { error: 'Error: Save failed' },
      );
    });

    it('should save group detail with special characters', () => {
      TabPersistence.setGroupDetail(mockSandbox, 'group@123', "José's Team");

      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_group_detail',
        JSON.stringify({ groupId: 'group@123', groupName: "José's Team" }),
      );
    });

    it('should save group detail with long names', () => {
      const longName =
        'This is a very long group name that exceeds normal length';

      TabPersistence.setGroupDetail(mockSandbox, 'group-1', longName);

      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_group_detail',
        JSON.stringify({ groupId: 'group-1', groupName: longName }),
      );
    });

    it('should not save when both values are empty', () => {
      TabPersistence.setGroupDetail(mockSandbox, '', '');

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
      expect(mockSandbox.logger.warn).toHaveBeenCalled();
    });

    it('should not save when both values are whitespace', () => {
      TabPersistence.setGroupDetail(mockSandbox, '   ', '   ');

      expect(mockSetItemByPersonaId).not.toHaveBeenCalled();
      expect(mockSandbox.logger.warn).toHaveBeenCalled();
    });
  });

  describe('clearGroupDetail', () => {
    it('should clear group detail from storage', () => {
      TabPersistence.clearGroupDetail(mockSandbox);

      expect(mockRemoveItemByPersonaId).toHaveBeenCalledWith(
        'assignments_group_detail',
      );
    });

    it('should handle error when clearing with logging', () => {
      mockRemoveItemByPersonaId.mockImplementation(() => {
        throw new Error('Remove error');
      });

      TabPersistence.clearGroupDetail(mockSandbox);

      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        '[Assignments] Failed to clear group detail from storage',
        { error: 'Error: Remove error' },
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete main tab persistence flow', () => {
      // Save tab
      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.WORKERS);
      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_main_tab',
        AssignmentsMainTabs.WORKERS,
      );

      // Read tab
      mockGetItemByPersonaId.mockReturnValue(AssignmentsMainTabs.WORKERS);
      const result = TabPersistence.getMainTab(mockSandbox);
      expect(result).toBe(AssignmentsMainTabs.WORKERS);

      // Clear tab
      TabPersistence.clearMainTab(mockSandbox);
      expect(mockRemoveItemByPersonaId).toHaveBeenCalledWith(
        'assignments_main_tab',
      );
    });

    it('should handle complete workers view persistence flow', () => {
      // Save view
      TabPersistence.setWorkersView(mockSandbox, WorkersTabViews.WORKERS);
      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_workers_view',
        WorkersTabViews.WORKERS,
      );

      // Read view
      mockGetItemByPersonaId.mockReturnValue(WorkersTabViews.WORKERS);
      const result = TabPersistence.getWorkersView(mockSandbox);
      expect(result).toBe(WorkersTabViews.WORKERS);

      // Clear view
      TabPersistence.clearWorkersView(mockSandbox);
      expect(mockRemoveItemByPersonaId).toHaveBeenCalledWith(
        'assignments_workers_view',
      );
    });

    it('should handle complete group detail persistence flow', () => {
      // Save group detail
      TabPersistence.setGroupDetail(mockSandbox, 'group-1', 'Test Group');
      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_group_detail',
        JSON.stringify({ groupId: 'group-1', groupName: 'Test Group' }),
      );

      // Read group detail
      mockGetItemByPersonaId.mockReturnValue(
        JSON.stringify({ groupId: 'group-1', groupName: 'Test Group' }),
      );
      const result = TabPersistence.getGroupDetail(mockSandbox);
      expect(result).toEqual({ groupId: 'group-1', groupName: 'Test Group' });

      // Clear group detail
      TabPersistence.clearGroupDetail(mockSandbox);
      expect(mockRemoveItemByPersonaId).toHaveBeenCalledWith(
        'assignments_group_detail',
      );
    });

    it('should handle multiple rapid tab changes', () => {
      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.CUSTOMERS);
      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.WORKERS);
      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.CUSTOMERS);

      expect(mockSetItemByPersonaId).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple view toggles', () => {
      TabPersistence.setWorkersView(mockSandbox, WorkersTabViews.GROUPS);
      TabPersistence.setWorkersView(mockSandbox, WorkersTabViews.WORKERS);
      TabPersistence.setWorkersView(mockSandbox, WorkersTabViews.GROUPS);

      expect(mockSetItemByPersonaId).toHaveBeenCalledTimes(3);
    });

    it('should handle storage operations with different sandboxes', () => {
      const sandbox2 = { ...mockSandbox } as Sandbox;

      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.WORKERS);
      TabPersistence.setMainTab(sandbox2, AssignmentsMainTabs.CUSTOMERS);

      expect(mockSetItemByPersonaId).toHaveBeenCalledTimes(2);
      expect(mockSetItemByPersonaId).toHaveBeenNthCalledWith(
        1,
        'assignments_main_tab',
        AssignmentsMainTabs.WORKERS,
      );
      expect(mockSetItemByPersonaId).toHaveBeenNthCalledWith(
        2,
        'assignments_main_tab',
        AssignmentsMainTabs.CUSTOMERS,
      );
    });
  });

  describe('Error Resilience', () => {
    it('should continue working after error in getMainTab', () => {
      mockGetItemByPersonaId.mockImplementationOnce(() => {
        throw new Error('Read error');
      });

      const result1 = TabPersistence.getMainTab(mockSandbox);
      expect(result1).toBe(AssignmentsMainTabs.CUSTOMERS);

      mockGetItemByPersonaId.mockReturnValue(AssignmentsMainTabs.WORKERS);
      const result2 = TabPersistence.getMainTab(mockSandbox);
      expect(result2).toBe(AssignmentsMainTabs.WORKERS);
    });

    it('should continue working after error in setMainTab', () => {
      mockSetItemByPersonaId.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.WORKERS);
      expect(mockSandbox.logger.warn).toHaveBeenCalled();

      mockSetItemByPersonaId.mockImplementation(() => {});
      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.CUSTOMERS);
      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'assignments_main_tab',
        AssignmentsMainTabs.CUSTOMERS,
      );
    });

    it('should return null after JSON parse error in getGroupDetail', () => {
      mockGetItemByPersonaId.mockReturnValue('{invalid json');

      const result = TabPersistence.getGroupDetail(mockSandbox);

      expect(result).toBeNull();
      expect(mockSandbox.logger.warn).toHaveBeenCalled();
    });
  });

  describe('Type Safety', () => {
    it('should only accept valid AssignmentsMainTabs enum values', () => {
      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.CUSTOMERS);
      TabPersistence.setMainTab(mockSandbox, AssignmentsMainTabs.WORKERS);

      expect(mockSetItemByPersonaId).toHaveBeenCalledTimes(2);
    });

    it('should only accept valid WorkersTabViews enum values', () => {
      TabPersistence.setWorkersView(mockSandbox, WorkersTabViews.GROUPS);
      TabPersistence.setWorkersView(mockSandbox, WorkersTabViews.WORKERS);

      expect(mockSetItemByPersonaId).toHaveBeenCalledTimes(2);
    });

    it('should validate enum values strictly', () => {
      mockGetItemByPersonaId.mockReturnValue('workers'); // valid lowercase value

      const result = TabPersistence.getWorkersView(mockSandbox);

      expect(result).toBe(WorkersTabViews.WORKERS);
    });
  });
});
