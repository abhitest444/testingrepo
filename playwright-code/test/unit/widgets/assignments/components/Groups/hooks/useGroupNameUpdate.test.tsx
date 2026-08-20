import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useGroupNameUpdate } from 'src/js/widgets/assignments/components/Groups/hooks/useGroupNameUpdate';
import { useUpdateGroup } from 'src/js/service/hooks/groups/useUpdateGroup';
import { ErrorSource } from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id, defaultMessage }: any, values?: any) => {
      if (values?.groupName) {
        return `Group "${values.groupName}" updated successfully`;
      }
      return defaultMessage || id;
    },
  }),
  useSandbox: () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  }),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useStore: jest.fn(() => ({
    getState: jest.fn(() => ({
      workersGroupView: {
        groups: {
          ids: ['group-123'],
          entities: {
            'group-123': {
              id: 'group-123',
              name: 'Test Group',
              meta: { version: 1 },
            },
          },
        },
      },
    })),
  })),
}));

jest.mock('src/js/service/hooks/groups/useUpdateGroup');

jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn().mockReturnValue({
    getTracePropagationHeaders: jest.fn().mockReturnValue({}),
  }),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
}));

jest.mock('src/js/widgets/assignments/store/workersGroupViewSlice', () => ({
  groupsSelectors: {
    selectById: jest.fn((groups, id) => groups.entities[id]),
  },
}));

describe('useGroupNameUpdate', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const mockOnClose = jest.fn();
  const mockUpdateGroup = jest.fn();

  const defaultProps = {
    groupId: 'group-123',
    initialGroupName: 'Test Group',
    onSuccess: mockOnSuccess,
    onError: mockOnError,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUpdateGroup as jest.Mock).mockReturnValue([
      mockUpdateGroup,
      { loading: false },
    ]);
  });

  describe('Initialization', () => {
    it('should expose handleSaveGroupName function', () => {
      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      expect(typeof result.current.handleSaveGroupName).toBe('function');
    });

    it('should expose updatingGroup loading state', () => {
      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      expect(result.current.updatingGroup).toBe(false);
    });
  });

  describe('handleSaveGroupName', () => {
    it('should close drawer without updating when name unchanged', async () => {
      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      await act(async () => {
        await result.current.handleSaveGroupName('Test Group');
      });

      expect(mockUpdateGroup).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should show error when group name is empty', async () => {
      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      await act(async () => {
        await result.current.handleSaveGroupName('');
      });

      expect(mockUpdateGroup).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledWith(
        'Group name is required',
        undefined,
        ErrorSource.UpdateGroup,
      );
    });

    it('should show error when group name is only whitespace', async () => {
      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      await act(async () => {
        await result.current.handleSaveGroupName('   ');
      });

      expect(mockUpdateGroup).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledWith(
        'Group name is required',
        undefined,
        ErrorSource.UpdateGroup,
      );
    });

    it('should call updateGroup with correct parameters', async () => {
      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      await act(async () => {
        await result.current.handleSaveGroupName('New Group Name');
      });

      expect(mockUpdateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              id: 'group-123',
              name: 'New Group Name',
              version: 1,
            },
          },
        }),
      );
    });

    it('should trim whitespace from group name', async () => {
      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      await act(async () => {
        await result.current.handleSaveGroupName('  New Group Name  ');
      });

      expect(mockUpdateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              id: 'group-123',
              name: 'New Group Name',
              version: 1,
            },
          },
        }),
      );
    });

    it('should handle update errors gracefully', async () => {
      mockUpdateGroup.mockRejectedValue(new Error('Update failed'));
      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      await act(async () => {
        await result.current.handleSaveGroupName('New Group Name');
      });

      // Should not throw error
      expect(mockUpdateGroup).toHaveBeenCalled();
    });
  });

  describe('useUpdateGroup success callback', () => {
    it('should call onSuccess with formatted message', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Updated Group',
        meta: { version: 2 },
      };

      (useUpdateGroup as jest.Mock).mockImplementation(({ onSuccess }: any) => {
        setTimeout(() => onSuccess(mockGroup), 0);
        return [mockUpdateGroup, { loading: false }];
      });

      renderHook(() => useGroupNameUpdate(defaultProps));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          'Group "Updated Group" updated successfully',
        );
      });
    });

    it('should call onClose after successful update', async () => {
      jest.clearAllMocks();

      const mockGroup = {
        id: 'group-123',
        name: 'Updated Group',
        meta: { version: 2 },
      };

      (useUpdateGroup as jest.Mock).mockImplementation(({ onSuccess }: any) => {
        setTimeout(() => onSuccess(mockGroup), 0);
        return [mockUpdateGroup, { loading: false }];
      });

      renderHook(() => useGroupNameUpdate(defaultProps));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('useUpdateGroup error callback', () => {
    it('should call onError with UpdateGroup source', async () => {
      const errorMessage = 'Update failed';
      const errorCode = 'UPDATE_ERROR';

      (useUpdateGroup as jest.Mock).mockImplementation(({ onError }: any) => {
        setTimeout(() => onError(errorMessage, errorCode), 0);
        return [mockUpdateGroup, { loading: false }];
      });

      renderHook(() => useGroupNameUpdate(defaultProps));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          errorMessage,
          errorCode,
          ErrorSource.UpdateGroup,
        );
      });
    });
  });

  describe('Coverage gaps', () => {
    it('should use version 1 when currentGroup is not found in Redux state', async () => {
      // Override useStore to return a state where selectById returns undefined
      const { useStore } = jest.requireMock('react-redux');
      useStore.mockReturnValueOnce({
        getState: jest.fn(() => ({
          workersGroupView: {
            groups: {
              ids: [],
              entities: {},
            },
          },
        })),
      });

      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      await act(async () => {
        await result.current.handleSaveGroupName('New Group Name');
      });

      // updateGroup should still be called, using version 1 as fallback
      expect(mockUpdateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              id: 'group-123',
              name: 'New Group Name',
              version: 1,
            },
          },
        }),
      );
    });
  });

  describe('Loading state', () => {
    it('should reflect loading state from useUpdateGroup', () => {
      (useUpdateGroup as jest.Mock).mockReturnValue([
        mockUpdateGroup,
        { loading: true },
      ]);

      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      expect(result.current.updatingGroup).toBe(true);
    });

    it('should reflect not loading state', () => {
      (useUpdateGroup as jest.Mock).mockReturnValue([
        mockUpdateGroup,
        { loading: false },
      ]);

      const { result } = renderHook(() => useGroupNameUpdate(defaultProps));

      expect(result.current.updatingGroup).toBe(false);
    });
  });
});
