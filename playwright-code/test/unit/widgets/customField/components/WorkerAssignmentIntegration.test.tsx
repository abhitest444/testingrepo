import React from 'react';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import WorkerAssignmentIntegration from 'src/js/widgets/customField/components/WorkerAssignmentIntegration';
import workerAssignmentsReducer from 'src/js/widgets/customField/store/workerAssignmentsSlice';
import { CustomFieldOption } from 'src/js/widgets/customField/store/customFieldsSlice';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import {
  renderWithQuicksandAndReduxProvider,
  getDefaultSandbox,
} from '../../../testUtils';

// Mock data and functions
const mockLoadTimeForAssignments = jest.fn();
const mockManageCustomFieldOptionAssignment = jest.fn().mockResolvedValue({});
let mockApiData: any[] = [];
let mockApiPageInfo: any = { hasNextPage: false, endCursor: null };
let mockTotalTimeForCount = 0;
let mockMutationLoading = false;
let mockMutationCallbacks: any = {};

// Mock hooks
jest.mock('src/js/service/hooks/assignments/useTimeForAssignments', () => ({
  useTimeForAssignments: () => ({
    loadTimeForAssignments: mockLoadTimeForAssignments,
    data: mockApiData,
    pageInfo: mockApiPageInfo,
    totalTimeForCount: mockTotalTimeForCount,
  }),
}));

jest.mock(
  'src/js/service/hooks/assignments/useManageCustomFieldOptionAssignment',
  () => ({
    useManageCustomFieldOptionAssignment: (callbacks: any) => {
      mockMutationCallbacks = callbacks || {};
      return [
        mockManageCustomFieldOptionAssignment,
        { loading: mockMutationLoading },
      ];
    },
  }),
);

// Mock PageMessage
jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ children, title, onClose }: any) => (
    <div data-testid="page-message">
      <div data-testid="page-message-title">{title}</div>
      <div>{children}</div>
      {onClose && (
        <button data-testid="close-message" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  ),
}));

// Mock Typography
jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children, variant }: any) => (
    <div data-testid={`typography-${variant}`}>{children}</div>
  ),
}));

// Mock AssignmentDrawer
let mockDrawerConfig: any = null;
let mockDrawerOpen = false;
let mockDrawerOnClose: any = null;
let mockDrawerInitialSelections: Set<string | number> = new Set();
let mockDrawerLoading = false;
let mockDrawerErrorMessage: any = null;

jest.mock('src/js/widgets/common/AssignmentDrawer/AssignmentDrawer', () => ({
  __esModule: true,
  default: ({
    open,
    onClose,
    config,
    initialSelections,
    loading,
    errorMessage,
  }: any) => {
    mockDrawerConfig = config;
    mockDrawerOpen = open;
    mockDrawerOnClose = onClose;
    mockDrawerInitialSelections = initialSelections;
    mockDrawerLoading = loading;
    mockDrawerErrorMessage = errorMessage;

    return open ? (
      <div data-testid="assignment-drawer">
        <div data-testid="drawer-field-name">{config?.ui?.fieldName}</div>
        <div data-testid="drawer-loading">
          {loading ? 'Loading' : 'Not Loading'}
        </div>
        <button data-testid="drawer-close-button" onClick={onClose}>
          Close
        </button>
        {errorMessage && <div data-testid="drawer-error">{errorMessage}</div>}
      </div>
    ) : null;
  },
}));

describe('WorkerAssignmentIntegration', () => {
  const mockOnClose = jest.fn();
  const mockOnError = jest.fn();
  const mockOnShowSuccess = jest.fn();

  const defaultProps = {
    customFieldId: 'udcf_123',
    customFieldOption: {
      id: 'udcf_123_1',
      name: 'Option 1',
      deleted: false,
      workerAssignmentCount: 5,
    } as CustomFieldOption,
    onClose: mockOnClose,
    onError: mockOnError,
    onShowSuccess: mockOnShowSuccess,
  };

  const mockWorkers = [
    {
      timeForContactDAS: { id: 'worker-1' },
      assigned: true,
      displayName: 'Worker 1',
      fullName: 'Worker One',
      contractor: false,
      groupId: 'group-1',
      groupName: 'Group 1',
      timeForType: TimeTracking_TimeForType.Employee,
    },
    {
      timeForContactDAS: { id: 'worker-2' },
      assigned: false,
      displayName: 'Worker 2',
      fullName: 'Worker Two',
      contractor: false,
      groupId: 'group-1',
      groupName: 'Group 1',
      timeForType: TimeTracking_TimeForType.Employee,
    },
    {
      timeForContactDAS: { id: 'worker-3' },
      assigned: false,
      displayName: 'Worker 3',
      fullName: 'Worker Three',
      contractor: false,
      groupId: null,
      groupName: null,
      timeForType: TimeTracking_TimeForType.Vendor,
    },
  ];

  const createStore = () =>
    configureStore({
      reducer: {
        workerAssignments: workerAssignmentsReducer,
      },
    });

  beforeEach(() => {
    mockApiData = [];
    mockApiPageInfo = { hasNextPage: false, endCursor: null };
    mockTotalTimeForCount = 0;
    mockMutationLoading = false;
    mockMutationCallbacks = {};
    mockDrawerConfig = null;
    mockDrawerOpen = false;
    mockDrawerOnClose = null;
    mockManageCustomFieldOptionAssignment.mockReset().mockResolvedValue({});
    mockLoadTimeForAssignments.mockReset();
  });

  afterEach(async () => {
    // Cleanup any pending promises
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render AssignmentDrawer when component mounts', () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
    });

    it('should display field name in drawer', () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('drawer-field-name')).toHaveTextContent(
        'Option 1',
      );
    });

    it('should return null when customFieldOption id is missing', () => {
      const store = createStore();
      const propsWithoutId = {
        ...defaultProps,
        customFieldOption: {
          ...defaultProps.customFieldOption,
          id: undefined,
        } as any,
      };

      const { container } = renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...propsWithoutId} />,
        store,
        getDefaultSandbox(),
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Data Loading', () => {
    it('should initialize worker assignments state', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments).toBeDefined();
        expect(state.workerAssignments.allItems).toEqual([]);
      });
    });

    it('should load worker data and process into hierarchical structure', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CustomFieldOptionId Handling', () => {
    it('should send customFieldOptionId as is without prefix removal', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      // Call the save handler
      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(['worker-1']),
          newlyUnassigned: new Set(),
          finalAssigned: new Set(['worker-1']),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 10,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              customFieldId: 'udcf_123',
              customFieldOptionId: 'udcf_123_1', // Should send as is
            }),
          }),
        }),
      );
    });

    it('should handle customFieldId without udcf_ prefix', async () => {
      const store = createStore();
      const propsWithoutPrefix = {
        ...defaultProps,
        customFieldId: '123',
        customFieldOption: {
          ...defaultProps.customFieldOption,
          id: '123_1',
        },
      };

      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...propsWithoutPrefix} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(['worker-1']),
          newlyUnassigned: new Set(),
          finalAssigned: new Set(['worker-1']),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 10,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              customFieldId: '123',
              customFieldOptionId: '123_1', // Should send as is
            }),
          }),
        }),
      );
    });
  });

  describe('Save Functionality with Select All', () => {
    it('should handle assignToAll when select all is used', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: true,
          newlyAssigned: new Set(),
          newlyUnassigned: new Set(),
          finalAssigned: new Set(['worker-1', 'worker-2']),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 2,
          hasChanges: true,
          changeCount: 0,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              assignToAll: true,
            }),
          }),
        }),
      );
    });

    it('should handle worker assignments when not select all', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(['worker-2']),
          newlyUnassigned: new Set(['worker-1']),
          finalAssigned: new Set(['worker-2']),
          finalUnassigned: new Set(['worker-1']),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 2,
        });
      });

      // Both worker-1 and worker-2 are from group-1
      // Unassigning worker-1 and assigning worker-2 means only worker-2 is selected
      // Not all workers in group are selected -> sends individual worker IDs
      // Unassigning worker-1 from group -> sends group ID + worker ID
      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              timeForAssignments: expect.objectContaining({
                groupIdsToAssign: [], // Not all workers selected -> no group optimization
                timeForToAssign: [expect.objectContaining({ id: 'worker-2' })], // Individual worker
                groupIdsToUnassign: ['group-1'], // Unassigning worker from group
                timeForToUnassign: expect.arrayContaining([
                  expect.objectContaining({ id: 'worker-1' }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it('should handle group assignments', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(['group-group-1']),
          newlyUnassigned: new Set(),
          finalAssigned: new Set(['group-group-1']),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              timeForAssignments: expect.objectContaining({
                groupIdsToAssign: expect.arrayContaining(['group-1']),
              }),
            }),
          }),
        }),
      );
    });

    it('should handle no-group workers', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(['no-group']),
          newlyUnassigned: new Set(),
          finalAssigned: new Set(['no-group']),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalled();
    });
  });

  describe('Success and Error Handling', () => {
    it('should call onShowSuccess on successful mutation', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      // Trigger success callback
      await act(async () => {
        await mockMutationCallbacks.onSuccess?.();
      });

      expect(mockOnShowSuccess).toHaveBeenCalled();
    });

    it('should call onError on mutation error', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      // Trigger error callback
      await act(async () => {
        await mockMutationCallbacks.onError?.('Test error message');
      });

      await waitFor(() => {
        expect(screen.getByTestId('page-message')).toBeInTheDocument();
      });
    });

    it('should call onError with partial success info', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      const partialSuccessInfo = {
        workers: { successCount: 5, failureCount: 2 },
        groups: { successCount: 1, failureCount: 0 },
      };

      await act(async () => {
        await mockMutationCallbacks.onPartialSuccess?.(partialSuccessInfo);
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('6'),
          isPartialSuccess: true,
        }),
      );
    });
  });

  describe('New Worker Assignment Logic', () => {
    it('should only send group ID when assigning a group (no workers)', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(['group-group-1']),
          newlyUnassigned: new Set(),
          finalAssigned: new Set(),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              timeForAssignments: expect.objectContaining({
                groupIdsToAssign: ['group-1'],
                timeForToAssign: [], // Should be empty
              }),
            }),
          }),
        }),
      );
    });

    it('should send group ID and all workers when unassigning a group', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(),
          newlyUnassigned: new Set(['group-group-1']),
          finalAssigned: new Set(),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              timeForAssignments: expect.objectContaining({
                groupIdsToUnassign: ['group-1'],
                timeForToUnassign: expect.arrayContaining([
                  expect.objectContaining({ id: 'worker-1' }),
                  expect.objectContaining({ id: 'worker-2' }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it('should send group ID when all workers of a group are selected individually', async () => {
      const workersAllFromGroup = [
        {
          timeForContactDAS: { id: 'worker-a' },
          assigned: true,
          displayName: 'Worker A',
          groupId: 'group-x',
          groupName: 'Group X',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        {
          timeForContactDAS: { id: 'worker-b' },
          assigned: true,
          displayName: 'Worker B',
          groupId: 'group-x',
          groupName: 'Group X',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        {
          timeForContactDAS: { id: 'worker-c' },
          assigned: false,
          displayName: 'Worker C',
          groupId: 'group-x',
          groupName: 'Group X',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      ];

      mockApiData = workersAllFromGroup;
      mockTotalTimeForCount = workersAllFromGroup.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      // Assigning worker-c should trigger group assignment
      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(['worker-c']),
          newlyUnassigned: new Set(),
          finalAssigned: new Set(['worker-a', 'worker-b', 'worker-c']),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              timeForAssignments: expect.objectContaining({
                groupIdsToAssign: ['group-x'],
                timeForToAssign: [], // Should be empty - group assignment instead
              }),
            }),
          }),
        }),
      );
    });

    it('should send group ID and worker ID when unassigning individual worker from group', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(),
          newlyUnassigned: new Set(['worker-1']), // worker-1 belongs to group-1
          finalAssigned: new Set(),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              timeForAssignments: expect.objectContaining({
                groupIdsToUnassign: ['group-1'],
                timeForToUnassign: expect.arrayContaining([
                  expect.objectContaining({ id: 'worker-1' }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it('should deduplicate group IDs when multiple workers from same group are unassigned', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(),
          newlyUnassigned: new Set(['worker-1', 'worker-2']), // Both from group-1
          finalAssigned: new Set(),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 2,
        });
      });

      const call = mockManageCustomFieldOptionAssignment.mock.calls[0][0];
      const { groupIdsToUnassign } = call.variables.input.timeForAssignments;

      // Should only have one instance of 'group-1' (deduplicated)
      expect(groupIdsToUnassign).toEqual(['group-1']);
      expect(groupIdsToUnassign.length).toBe(1);
    });

    it('should not send timeForAssignments when assignToAll is true', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: true,
          newlyAssigned: new Set(),
          newlyUnassigned: new Set(),
          finalAssigned: new Set(),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 0,
        });
      });

      const call = mockManageCustomFieldOptionAssignment.mock.calls[0][0];
      expect(call.variables.input.assignToAll).toBe(true);
      expect(call.variables.input.timeForAssignments).toBeUndefined();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when drawer is closed', () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      const closeButton = screen.getByTestId('drawer-close-button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Fetch Data Callback', () => {
    it('should return empty when no items loaded yet', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      const result = await mockDrawerConfig.dataSource.fetchData({ page: 1 });
      expect(result.items).toEqual([]);
    });

    it('should fetch more data when pagination is needed', async () => {
      mockApiData = mockWorkers;
      mockApiPageInfo = { hasNextPage: true, endCursor: 'cursor123' };
      mockTotalTimeForCount = 50;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      mockLoadTimeForAssignments.mockClear();

      // Request a page that requires more data
      await act(async () => {
        await mockDrawerConfig.dataSource.fetchData({ page: 2 });
      });

      await waitFor(() => {
        expect(mockLoadTimeForAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            after: 'cursor123',
          }),
        );
      });
    });
  });

  describe('Initial Data Fetch Behavior', () => {
    it('should trigger initial fetch when totalTimeForCount is null', async () => {
      mockApiData = [];
      mockTotalTimeForCount = null as any; // null indicates data hasn't been fetched yet

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      // Call fetchData which should trigger the initial load
      await act(async () => {
        await mockDrawerConfig.dataSource.fetchData({ page: 1 });
      });

      expect(mockLoadTimeForAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          first: 100,
          input: {
            customFieldId: 'udcf_123',
            customFieldOptionId: 'udcf_123_1',
          },
          filter: {},
          fetchPolicy: 'no-cache',
        }),
      );
    });

    it('should NOT trigger initial fetch when totalTimeForCount is 0 (data already fetched but empty)', async () => {
      mockApiData = [];
      mockTotalTimeForCount = 0; // 0 indicates fetch completed with no results

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      mockLoadTimeForAssignments.mockClear();

      // Call fetchData - should NOT trigger load since totalTimeForCount is not null
      await act(async () => {
        await mockDrawerConfig.dataSource.fetchData({ page: 1 });
      });

      // Should not have been called since totalTimeForCount is 0 (not null)
      expect(mockLoadTimeForAssignments).not.toHaveBeenCalled();
    });

    it('should NOT trigger initial fetch when totalTimeForCount has a positive value', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = 3; // Data already loaded

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      mockLoadTimeForAssignments.mockClear();

      // Call fetchData for page 1 - should NOT trigger new load
      await act(async () => {
        const result = await mockDrawerConfig.dataSource.fetchData({ page: 1 });
        // Should return data from already loaded items
        expect(result.items.length).toBeGreaterThan(0);
      });

      expect(mockLoadTimeForAssignments).not.toHaveBeenCalled();
    });

    it('should set loading to false when totalTimeForCount is not null and apiData is empty', async () => {
      mockApiData = [];
      mockTotalTimeForCount = 0; // Indicates fetch completed

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        // Loading should be false when data is empty but fetch completed
        expect(state.workerAssignments.loading).toBe(false);
      });
    });

    it('should include customFieldId and customFieldOptionId in initial fetch', async () => {
      mockApiData = [];
      mockTotalTimeForCount = null as any;

      const customProps = {
        ...defaultProps,
        customFieldId: 'custom_field_abc',
        customFieldOption: {
          ...defaultProps.customFieldOption,
          id: 'option_xyz',
        },
      };

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...customProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      await act(async () => {
        await mockDrawerConfig.dataSource.fetchData({ page: 1 });
      });

      expect(mockLoadTimeForAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            customFieldId: 'custom_field_abc',
            customFieldOptionId: 'option_xyz',
          },
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty worker list', () => {
      mockApiData = [];
      mockTotalTimeForCount = 0;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
    });

    it('should handle workers without groupId', async () => {
      mockApiData = [
        {
          ...mockWorkers[0],
          groupId: 0,
        },
      ];
      mockTotalTimeForCount = 1;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });
    });

    it('should handle workers with empty string groupId', async () => {
      mockApiData = [
        {
          ...mockWorkers[0],
          groupId: '',
        },
      ];
      mockTotalTimeForCount = 1;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state from mutation', () => {
      mockMutationLoading = true;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('drawer-loading')).toHaveTextContent('Loading');
    });

    it('should show not loading state', () => {
      mockMutationLoading = false;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('drawer-loading')).toHaveTextContent(
        'Not Loading',
      );
    });

    it('should show both redux and mutation loading', () => {
      mockMutationLoading = true;

      const store = createStore();
      const state = store.getState();

      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('drawer-loading')).toHaveTextContent('Loading');
    });
  });

  describe('Additional Edge Cases', () => {
    it('should handle workers with undefined timeForType', async () => {
      mockApiData = [
        {
          ...mockWorkers[0],
          timeForType: undefined,
        },
      ];
      mockTotalTimeForCount = 1;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });
    });

    it('should handle workers without displayName or fullName', async () => {
      mockApiData = [
        {
          timeForContactDAS: { id: 'worker-1' },
          assigned: false,
          displayName: '',
          fullName: '',
          contractor: false,
          groupId: null,
          groupName: null,
          timeForType: TimeTracking_TimeForType.Employee,
        },
      ];
      mockTotalTimeForCount = 1;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
        const item = state.workerAssignments.allItems[0];
        expect(item.name).toBe('');
      });
    });

    it('should handle workers with only fullName (no displayName)', async () => {
      mockApiData = [
        {
          timeForContactDAS: { id: 'worker-1' },
          assigned: false,
          displayName: null,
          fullName: 'John Doe',
          contractor: false,
          groupId: null,
          groupName: null,
          timeForType: TimeTracking_TimeForType.Employee,
        },
      ];
      mockTotalTimeForCount = 1;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
        const item = state.workerAssignments.allItems[0];
        expect(item.name).toBe('John Doe');
      });
    });

    it('should handle workers without id', async () => {
      mockApiData = [
        {
          timeForContactDAS: { id: '' },
          assigned: false,
          displayName: 'Worker 1',
          fullName: 'Worker One',
          contractor: false,
          groupId: null,
          groupName: null,
          timeForType: TimeTracking_TimeForType.Employee,
        },
      ];
      mockTotalTimeForCount = 1;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });
    });

    it('should handle saving with empty changes', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(),
          newlyUnassigned: new Set(),
          finalAssigned: new Set(),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 0,
          hasChanges: false,
          changeCount: 0,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalled();
    });

    it('should handle workers in nested groups', async () => {
      mockApiData = [
        {
          timeForContactDAS: { id: 'worker-1' },
          assigned: true,
          displayName: 'Worker 1',
          fullName: 'Worker One',
          contractor: false,
          groupId: 'group-1',
          groupName: 'Group 1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        {
          timeForContactDAS: { id: 'worker-2' },
          assigned: false,
          displayName: 'Worker 2',
          fullName: 'Worker Two',
          contractor: false,
          groupId: 'group-1',
          groupName: 'Group 1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      ];
      mockTotalTimeForCount = 2;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });
    });

    it('should handle mixed assigned and unassigned workers in same group', async () => {
      mockApiData = [
        {
          timeForContactDAS: { id: 'worker-1' },
          assigned: true,
          displayName: 'Worker 1',
          fullName: 'Worker One',
          contractor: false,
          groupId: 'group-1',
          groupName: 'Group 1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        {
          timeForContactDAS: { id: 'worker-2' },
          assigned: false,
          displayName: 'Worker 2',
          fullName: 'Worker Two',
          contractor: false,
          groupId: 'group-1',
          groupName: 'Group 1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      ];
      mockTotalTimeForCount = 2;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });
    });

    it('should handle group unassignment', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(),
          newlyUnassigned: new Set(['group-group-1']),
          finalAssigned: new Set(),
          finalUnassigned: new Set(['group-group-1']),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              timeForAssignments: expect.objectContaining({
                groupIdsToUnassign: expect.arrayContaining(['group-1']),
              }),
            }),
          }),
        }),
      );
    });

    it('should handle no-group unassignment', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(),
          newlyUnassigned: new Set(['no-group']),
          finalAssigned: new Set(),
          finalUnassigned: new Set(['no-group']),
          currentSelections: new Set(),
          totalItems: 3,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalled();
    });

    it('should clear drawer error on close', () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      const closeButton = screen.getByTestId('drawer-close-button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle complex pagination scenario', async () => {
      mockApiData = Array.from({ length: 20 }, (_, i) => ({
        timeForContactDAS: { id: `worker-${i}` },
        assigned: i % 2 === 0,
        displayName: `Worker ${i}`,
        fullName: `Worker Number ${i}`,
        contractor: false,
        groupId: `group-${Math.floor(i / 5)}`,
        groupName: `Group ${Math.floor(i / 5)}`,
        timeForType: TimeTracking_TimeForType.Employee,
      }));
      mockApiPageInfo = { hasNextPage: true, endCursor: 'cursor-page-1' };
      mockTotalTimeForCount = 50;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      // Request a page beyond what's loaded
      mockLoadTimeForAssignments.mockClear();

      await act(async () => {
        const result = await mockDrawerConfig.dataSource.fetchData({ page: 3 });
        expect(result).toBeDefined();
      });
    });

    it('should handle groups without groupName', async () => {
      mockApiData = [
        {
          timeForContactDAS: { id: 'worker-1' },
          assigned: false,
          displayName: 'Worker 1',
          fullName: 'Worker One',
          contractor: false,
          groupId: 'group-x',
          groupName: null,
          timeForType: TimeTracking_TimeForType.Employee,
        },
      ];
      mockTotalTimeForCount = 1;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
        // Should use fallback group name
        const item = state.workerAssignments.allItems[0];
        expect(item.metadata).toBeDefined();
      });
    });

    it('should handle component unmount during mutation', async () => {
      const store = createStore();
      const { unmount } = renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      // Unmount component
      unmount();

      // This should not cause any errors even if mutation callbacks are triggered
      await act(async () => {
        await mockMutationCallbacks.onSuccess?.();
      });
    });

    it('should clear error when success callback is triggered', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      // First trigger an error
      await act(async () => {
        await mockMutationCallbacks.onError?.('Test error');
      });

      await waitFor(() => {
        expect(screen.getByTestId('page-message')).toBeInTheDocument();
      });

      // Then trigger success - should clear error
      await act(async () => {
        await mockMutationCallbacks.onSuccess?.();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('page-message')).not.toBeInTheDocument();
      });
    });

    it('should clear error when partial success callback is triggered', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      // First trigger an error
      await act(async () => {
        await mockMutationCallbacks.onError?.('Test error');
      });

      await waitFor(() => {
        expect(screen.getByTestId('page-message')).toBeInTheDocument();
      });

      // Then trigger partial success - should clear drawer error
      const partialSuccessInfo = {
        workers: { successCount: 3, failureCount: 1 },
        groups: { successCount: 0, failureCount: 0 },
      };

      await act(async () => {
        await mockMutationCallbacks.onPartialSuccess?.(partialSuccessInfo);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('page-message')).not.toBeInTheDocument();
      });
    });

    it('should handle fetchData when already loading', async () => {
      mockApiData = mockWorkers;
      mockTotalTimeForCount = mockWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      // Set loading state
      store.dispatch({ type: 'workerAssignments/setLoading', payload: true });

      // Try to fetch data while loading - should not trigger another load
      const initialCallCount = mockLoadTimeForAssignments.mock.calls.length;

      await act(async () => {
        await mockDrawerConfig.dataSource.fetchData({ page: 2 });
      });

      // Should not have made another call since already loading
      expect(mockLoadTimeForAssignments.mock.calls.length).toBe(
        initialCallCount,
      );
    });

    it('should handle save with only workers (no groups)', async () => {
      mockApiData = [mockWorkers[2]]; // Worker 3 has no group
      mockTotalTimeForCount = 1;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await mockDrawerConfig.callbacks.onSave({
          isSelectAll: false,
          newlyAssigned: new Set(['worker-3']),
          newlyUnassigned: new Set(),
          finalAssigned: new Set(['worker-3']),
          finalUnassigned: new Set(),
          currentSelections: new Set(),
          totalItems: 1,
          hasChanges: true,
          changeCount: 1,
        });
      });

      expect(mockManageCustomFieldOptionAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              timeForAssignments: expect.objectContaining({
                timeForToAssign: expect.arrayContaining([
                  expect.objectContaining({ id: 'worker-3' }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it('should return paginated items with their parent groups', async () => {
      // Create multiple workers across different groups to test pagination logic
      const multipleWorkers = [
        {
          timeForContactDAS: { id: 'worker-1' },
          assigned: true,
          displayName: 'Worker 1',
          fullName: 'Worker One',
          contractor: false,
          groupId: 'group-1',
          groupName: 'Group 1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        {
          timeForContactDAS: { id: 'worker-2' },
          assigned: false,
          displayName: 'Worker 2',
          fullName: 'Worker Two',
          contractor: false,
          groupId: 'group-1',
          groupName: 'Group 1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        {
          timeForContactDAS: { id: 'worker-3' },
          assigned: false,
          displayName: 'Worker 3',
          fullName: 'Worker Three',
          contractor: false,
          groupId: 'group-2',
          groupName: 'Group 2',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        {
          timeForContactDAS: { id: 'worker-4' },
          assigned: false,
          displayName: 'Worker 4',
          fullName: 'Worker Four',
          contractor: false,
          groupId: 'group-2',
          groupName: 'Group 2',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      ];

      mockApiData = multipleWorkers;
      mockTotalTimeForCount = multipleWorkers.length;

      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
        const state = store.getState();
        expect(state.workerAssignments.allItems.length).toBeGreaterThan(0);
      });

      // Request page 1 - should include workers and their parent groups
      await act(async () => {
        const result = await mockDrawerConfig.dataSource.fetchData({ page: 1 });
        expect(result).toBeDefined();
        expect(result.items.length).toBeGreaterThan(0);
        // Should include parent groups and their children
        const hasParents = result.items.some((item: any) => item.level === 0);
        const hasWorkers = result.items.some((item: any) => item.level === 1);
        expect(hasParents).toBe(true);
        expect(hasWorkers).toBe(true);
      });
    });

    it('should handle error message with subtitle', async () => {
      const store = createStore();
      renderWithQuicksandAndReduxProvider(
        <WorkerAssignmentIntegration {...defaultProps} />,
        store,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockDrawerConfig).toBeDefined();
      });

      // Trigger error callback which creates error with subtitle
      await act(async () => {
        await mockMutationCallbacks.onError?.('Test error message');
      });

      await waitFor(() => {
        const pageMessage = screen.getByTestId('page-message');
        expect(pageMessage).toBeInTheDocument();
        // Should have subtitle
        const subtitle = screen.getByTestId('typography-body-3');
        expect(subtitle).toBeInTheDocument();
      });
    });
  });
});
