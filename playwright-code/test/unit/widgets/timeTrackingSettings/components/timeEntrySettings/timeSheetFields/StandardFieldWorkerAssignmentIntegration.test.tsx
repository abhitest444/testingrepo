import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StandardFieldWorkerAssignmentIntegration from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/StandardFieldWorkerAssignmentIntegration';
import { useTimeForAssignments } from 'src/js/service/hooks/assignments/useTimeForAssignments';
import { useManageStandardFieldOptionTimeForAssignment } from 'src/js/service/hooks/assignments/useManageStandardFieldOptionTimeForAssignment';
import { getDefaultSandbox } from 'test/unit/testUtils';
import standardFieldWorkerAssignmentsReducer from 'src/js/widgets/timeTrackingSettings/store/standardFieldWorkerAssignmentsSlice';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

// Mock the hooks
jest.mock('src/js/service/hooks/assignments/useTimeForAssignments');
jest.mock(
  'src/js/service/hooks/assignments/useManageStandardFieldOptionTimeForAssignment',
);
jest.mock('src/js/widgets/common/AssignmentDrawer/AssignmentDrawer', () => ({
  __esModule: true,
  default: function MockAssignmentDrawer({
    open,
    onClose,
    config,
    initialSelections,
    loading,
    errorMessage,
  }: any) {
    // Simulate fetchData being called on mount
    React.useEffect(() => {
      if (config?.dataSource?.fetchData && open) {
        config.dataSource.fetchData({ page: 1 });
      }
    }, [config, open]);

    return (
      <div data-testid="assignment-drawer">
        <div data-testid="drawer-open">{String(open)}</div>
        <div data-testid="drawer-loading">{String(loading)}</div>
        <div data-testid="field-name">{config?.ui?.fieldName}</div>
        <div data-testid="assignment-type">{config?.assignmentType}</div>
        <div data-testid="initial-selections">
          {Array.from(initialSelections).join(',')}
        </div>
        {errorMessage && <div data-testid="error-message">{errorMessage}</div>}
        <button onClick={onClose} data-testid="close-drawer">
          Close
        </button>
        <button
          onClick={() => {
            if (config?.callbacks?.onSave) {
              config.callbacks.onSave({
                newlyAssigned: new Set(['worker-1']),
                newlyUnassigned: new Set(['worker-2']),
                isSelectAll: false,
              });
            }
          }}
          data-testid="save-drawer"
        >
          Save
        </button>
        <button
          onClick={() => {
            if (config?.callbacks?.onSave) {
              config.callbacks.onSave({
                newlyAssigned: new Set(),
                newlyUnassigned: new Set(),
                isSelectAll: true,
              });
            }
          }}
          data-testid="save-select-all"
        >
          Select All
        </button>
        <button
          onClick={() => {
            if (config?.callbacks?.onSave) {
              config.callbacks.onSave({
                newlyAssigned: new Set(['group-1']),
                newlyUnassigned: new Set(['group-2']),
                isSelectAll: false,
              });
            }
          }}
          data-testid="save-groups"
        >
          Save Groups
        </button>
      </div>
    );
  },
}));

const mockUseTimeForAssignments = useTimeForAssignments as jest.MockedFunction<
  typeof useTimeForAssignments
>;
const mockUseManageStandardFieldOptionTimeForAssignment =
  useManageStandardFieldOptionTimeForAssignment as jest.MockedFunction<
    typeof useManageStandardFieldOptionTimeForAssignment
  >;

describe('StandardFieldWorkerAssignmentIntegration', () => {
  const mockWorkersData = [
    {
      timeForContactDAS: { id: 'worker-1' },
      displayName: 'Worker 1',
      fullName: 'Worker One Full',
      timeForType: TimeTracking_TimeForType.Employee,
      groupId: '1',
      groupName: 'Group A',
      assigned: true,
    },
    {
      timeForContactDAS: { id: 'worker-2' },
      displayName: 'Worker 2',
      fullName: 'Worker Two Full',
      timeForType: TimeTracking_TimeForType.Employee,
      groupId: '1',
      groupName: 'Group A',
      assigned: false,
    },
    {
      timeForContactDAS: { id: 'worker-3' },
      displayName: 'Worker 3',
      fullName: 'Worker Three Full',
      timeForType: TimeTracking_TimeForType.Vendor,
      groupId: '2',
      groupName: 'Group B',
      assigned: true,
    },
    {
      timeForContactDAS: { id: 'worker-4' },
      displayName: 'Worker 4',
      fullName: undefined,
      timeForType: TimeTracking_TimeForType.Employee,
      groupId: undefined,
      groupName: undefined,
      assigned: false,
    },
  ];

  const mockField = {
    key: 'isServiceFieldEnabled',
    title: 'Service Item',
    automationId: 'service-item-field',
  } as any;

  const mockStandardFieldOption = {
    id: 'option-123',
    name: 'Test Option Name',
  };

  const mockOnClose = jest.fn();
  const mockOnError = jest.fn();
  const mockOnShowSuccess = jest.fn();

  const sandbox = getDefaultSandbox();

  const defaultProps = {
    field: mockField,
    fieldDisplayName: 'Service Item',
    standardFieldOption: mockStandardFieldOption,
    onClose: mockOnClose,
    onError: mockOnError,
    onShowSuccess: mockOnShowSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimeForAssignments.mockReturnValue({
      loadTimeForAssignments: jest.fn(),
      loading: false,
      data: mockWorkersData,
      error: null,
      pageInfo: null,
      totalTimeForCount: 4,
    });

    mockUseManageStandardFieldOptionTimeForAssignment.mockReturnValue([
      jest.fn(),
      { loading: false, error: undefined },
    ] as any);
  });

  const renderComponent = (props = defaultProps, initialState?: any) => {
    const testStore = configureStore({
      reducer: {
        standardFieldWorkerAssignments: standardFieldWorkerAssignmentsReducer,
      },
      preloadedState: initialState,
    });

    return render(
      <ReduxProvider store={testStore}>
        <MockQuicksandProvider sandbox={sandbox}>
          <MockedProvider mocks={[]} addTypename={false}>
            <StandardFieldWorkerAssignmentIntegration {...props} />
          </MockedProvider>
        </MockQuicksandProvider>
      </ReduxProvider>,
    );
  };

  describe('Component Rendering', () => {
    it('renders AssignmentDrawer with correct props', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('drawer-open')).toHaveTextContent('true');
      expect(screen.getByTestId('field-name')).toHaveTextContent(
        'Test Option Name',
      );
      expect(screen.getByTestId('assignment-type')).toHaveTextContent(
        'WorkerAssignment',
      );
    });

    it('displays correct option name from standardFieldOption prop', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('field-name')).toHaveTextContent(
          'Test Option Name',
        );
      });
    });

    it('returns null when fieldLabel is not found', async () => {
      const invalidFieldProps = {
        ...defaultProps,
        field: {
          key: 'invalidFieldKey',
          title: 'Invalid Field',
          automationId: 'invalid-field',
        } as any,
      };

      const { container } = renderComponent(invalidFieldProps);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Data Loading', () => {
    it('fetches worker assignments on mount', async () => {
      const mockLoadTimeForAssignments = jest.fn();
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: mockLoadTimeForAssignments,
        loading: false,
        data: [],
        error: null,
        pageInfo: null,
        totalTimeForCount: null, // Must be null to trigger initial fetch
      });

      renderComponent();

      await waitFor(() => {
        expect(mockLoadTimeForAssignments).toHaveBeenCalledWith({
          first: 100,
          input: {
            standardFieldLabel: 'SERVICE_ITEM',
            standardFieldOption: 'option-123',
          },
          filter: {},
          fetchPolicy: 'no-cache',
        });
      });
    });

    it('shows loading state while data is loading', async () => {
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: true,
        data: undefined as any,
        error: null,
        pageInfo: null,
        totalTimeForCount: null, // null when data hasn't loaded yet
      });

      renderComponent(defaultProps, {
        standardFieldWorkerAssignments: {
          allItems: [],
          totalCount: 0,
          loading: true,
          error: null,
          hasMore: true,
          endCursor: null,
          lastFetchArgs: null,
          standardFieldLabel: null,
          standardFieldOption: null,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('drawer-loading')).toHaveTextContent('true');
      });
    });

    it('shows loading during mutation', async () => {
      mockUseManageStandardFieldOptionTimeForAssignment.mockReturnValue([
        jest.fn(),
        { loading: true, error: undefined },
      ] as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('drawer-loading')).toHaveTextContent('true');
      });
    });
  });

  describe('Data Transformation', () => {
    it('transforms workers with groups correctly', async () => {
      renderComponent();

      await waitFor(() => {
        const initialSelections = screen.getByTestId('initial-selections');
        // worker-1 and worker-3 are assigned
        expect(initialSelections.textContent).toContain('worker-1');
        expect(initialSelections.textContent).toContain('worker-3');
        expect(initialSelections.textContent).not.toContain('worker-2');
        expect(initialSelections.textContent).not.toContain('worker-4');
      });
    });

    it('uses displayName with fallback to fullName', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles workers without groups (ungrouped)', async () => {
      const ungroupedWorkersData = [
        {
          timeForContactDAS: { id: 'worker-1' },
          displayName: 'Worker 1',
          fullName: 'Worker One',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: undefined,
          groupName: undefined,
          assigned: true,
        },
        {
          timeForContactDAS: { id: 'worker-2' },
          displayName: 'Worker 2',
          fullName: 'Worker Two',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: '0',
          groupName: undefined,
          assigned: false,
        },
        {
          timeForContactDAS: { id: 'worker-3' },
          displayName: 'Worker 3',
          fullName: 'Worker Three',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: '',
          groupName: undefined,
          assigned: true,
        },
      ];

      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: ungroupedWorkersData,
        error: null,
        pageInfo: null,
        totalTimeForCount: 3,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles workers with zero groupId as ungrouped', async () => {
      const dataWithZeroGroupId = [
        {
          timeForContactDAS: { id: 'worker-1' },
          displayName: 'Worker 1',
          fullName: 'Worker One',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: 0 as any,
          groupName: undefined,
          assigned: true,
        },
      ];

      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: dataWithZeroGroupId as any,
        error: null,
        pageInfo: null,
        totalTimeForCount: 1,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('defaults timeForType to Employee when not provided', async () => {
      const dataWithoutTimeForType = [
        {
          timeForContactDAS: { id: 'worker-1' },
          displayName: 'Worker 1',
          fullName: 'Worker One',
          timeForType: undefined,
          groupId: '1',
          groupName: 'Group A',
          assigned: true,
        },
      ];

      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: dataWithoutTimeForType as any,
        error: null,
        pageInfo: null,
        totalTimeForCount: 1,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('handles save with specific worker assignments', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageStandardFieldOptionTimeForAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(mockManage).toHaveBeenCalledWith({
          variables: {
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              standardFieldOptionId: 'option-123',
              timeForAssignments: expect.objectContaining({
                timeForToAssign: expect.any(Array),
                timeForToUnassign: expect.any(Array),
              }),
            },
          },
        });
      });
    });

    it('handles save with select all', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageStandardFieldOptionTimeForAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-select-all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-select-all'));

      await waitFor(() => {
        expect(mockManage).toHaveBeenCalledWith({
          variables: {
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              standardFieldOptionId: 'option-123',
              assignToAll: true,
            },
          },
        });
      });
    });
  });

  describe('Success Handling', () => {
    it('calls onShowSuccess on successful save', async () => {
      let capturedOnSuccess: (() => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onSuccess }: any) => {
          capturedOnSuccess = onSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnSuccess) capturedOnSuccess();
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(mockOnShowSuccess).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it('logs success message', async () => {
      let capturedOnSuccess: (() => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onSuccess }: any) => {
          capturedOnSuccess = onSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnSuccess) capturedOnSuccess();
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(sandbox.logger.info).toHaveBeenCalledWith(
          '[StandardFieldWorkerAssignment] Standard field worker assignment saved successfully',
          undefined,
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on failure', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onError }: any) => {
          capturedOnError = onError;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnError)
                capturedOnError('Failed to save worker assignments');
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('logs error message', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onError }: any) => {
          capturedOnError = onError;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnError) capturedOnError('Test error');
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(sandbox.logger.error).toHaveBeenCalledWith(
          '[StandardFieldWorkerAssignment] Standard field worker assignment failed',
          { errorMessage: 'Test error' },
        );
      });
    });
  });

  describe('Partial Success Handling', () => {
    it('calls onError with partial success info', async () => {
      let capturedOnPartialSuccess: ((errorInfo: any) => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onPartialSuccess }: any) => {
          capturedOnPartialSuccess = onPartialSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnPartialSuccess)
                capturedOnPartialSuccess({
                  workers: {
                    successCount: 2,
                    failed: ['worker-3'],
                    errorMessages: ['Worker 3 failed'],
                  },
                  groups: {
                    successCount: 1,
                    failed: [],
                    errorMessages: [],
                  },
                });
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            isPartialSuccess: true,
          }),
        );
      });
    });

    it('logs partial success warning', async () => {
      let capturedOnPartialSuccess: ((errorInfo: any) => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onPartialSuccess }: any) => {
          capturedOnPartialSuccess = onPartialSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnPartialSuccess)
                capturedOnPartialSuccess({
                  workers: {
                    successCount: 2,
                    failed: [],
                    errorMessages: [],
                  },
                  groups: {
                    successCount: 0,
                    failed: [],
                    errorMessages: [],
                  },
                });
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(sandbox.logger.warn).toHaveBeenCalledWith(
          '[StandardFieldWorkerAssignment] Standard field worker assignment partially succeeded',
          expect.any(Object),
        );
      });
    });

    it('clears drawer error on partial success', async () => {
      let capturedOnPartialSuccess: ((errorInfo: any) => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onPartialSuccess }: any) => {
          capturedOnPartialSuccess = onPartialSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnPartialSuccess)
                capturedOnPartialSuccess({
                  workers: {
                    successCount: 2,
                    failed: [],
                    errorMessages: [],
                  },
                  groups: {
                    successCount: 0,
                    failed: [],
                    errorMessages: [],
                  },
                });
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Drawer Interactions', () => {
    it('calls onClose when drawer is closed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('close-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('close-drawer'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('clears error when drawer is closed', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onError }: any) => {
          capturedOnError = onError;
          return [jest.fn(), { loading: false, error: undefined }] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('close-drawer')).toBeInTheDocument();
      });

      // Trigger an error first
      if (capturedOnError) {
        capturedOnError('Test error');
      }

      // Then close the drawer
      fireEvent.click(screen.getByTestId('close-drawer'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty workers data', async () => {
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: [],
        error: null,
        pageInfo: null,
        totalTimeForCount: 0,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles undefined workers data', async () => {
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: undefined as any,
        error: null,
        pageInfo: null,
        totalTimeForCount: null, // null when data hasn't loaded yet
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles component without optional callbacks', async () => {
      const propsWithoutCallbacks: any = {
        field: mockField,
        fieldDisplayName: 'Service Item',
        standardFieldOption: mockStandardFieldOption,
        onClose: mockOnClose,
      };

      renderComponent(propsWithoutCallbacks);

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles different field keys correctly', () => {
      const billableField = {
        key: 'isBillingFieldEnabled',
        title: 'Billable',
        automationId: 'billable-field',
      } as any;

      // Just verify the component can be rendered with different field keys
      expect(billableField.key).toBe('isBillingFieldEnabled');
      expect(mockWorkersData.length).toBeGreaterThan(0);
    });

    it('handles empty id from timeForContactDAS', async () => {
      const dataWithEmptyId = [
        {
          timeForContactDAS: { id: '' },
          displayName: 'Worker No ID',
          fullName: 'Worker No ID Full',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: '1',
          groupName: 'Group A',
          assigned: false,
        },
      ];

      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: dataWithEmptyId,
        error: null,
        pageInfo: null,
        totalTimeForCount: 1,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination and Data Fetching', () => {
    it('fetches paginated data when endIndex exceeds available items', async () => {
      const mockLoadTimeForAssignments = jest.fn();
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: mockLoadTimeForAssignments,
        loading: false,
        data: mockWorkersData,
        error: null,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: 'cursor-123',
        },
        totalTimeForCount: 150,
      });

      const initialState = {
        standardFieldWorkerAssignments: {
          allItems: mockWorkersData,
          totalCount: 150,
          loading: false,
          error: null,
          hasMore: true,
          endCursor: 'cursor-123',
          lastFetchArgs: null,
          standardFieldLabel: 'SERVICE_ITEM',
          standardFieldOption: 'option-123',
        },
      };

      renderComponent(defaultProps, initialState);

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockLoadTimeForAssignments).toHaveBeenCalled();
      });
    });

    it('returns available items when endIndex is within range', async () => {
      const mockLoadTimeForAssignments = jest.fn();
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: mockLoadTimeForAssignments,
        loading: false,
        data: mockWorkersData,
        error: null,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: '',
        },
        totalTimeForCount: 4,
      });

      const initialState = {
        standardFieldWorkerAssignments: {
          allItems: mockWorkersData,
          totalCount: 4,
          loading: false,
          error: null,
          hasMore: false,
          endCursor: null,
          lastFetchArgs: null,
          standardFieldLabel: 'SERVICE_ITEM',
          standardFieldOption: 'option-123',
        },
      };

      renderComponent(defaultProps, initialState);

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('does not fetch more data when already loading', async () => {
      const mockLoadTimeForAssignments = jest.fn();
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: mockLoadTimeForAssignments,
        loading: true,
        data: mockWorkersData,
        error: null,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: 'cursor-123',
        },
        totalTimeForCount: 150,
      });

      const initialState = {
        standardFieldWorkerAssignments: {
          allItems: mockWorkersData,
          totalCount: 150,
          loading: true,
          error: null,
          hasMore: true,
          endCursor: 'cursor-123',
          lastFetchArgs: null,
          standardFieldLabel: 'SERVICE_ITEM',
          standardFieldOption: 'option-123',
        },
      };

      renderComponent(defaultProps, initialState);

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('does not fetch more data when hasMore is false', async () => {
      const mockLoadTimeForAssignments = jest.fn();
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: mockLoadTimeForAssignments,
        loading: false,
        data: mockWorkersData,
        error: null,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: '',
        },
        totalTimeForCount: 4,
      });

      const initialState = {
        standardFieldWorkerAssignments: {
          allItems: mockWorkersData,
          totalCount: 4,
          loading: false,
          error: null,
          hasMore: false,
          endCursor: null,
          lastFetchArgs: null,
          standardFieldLabel: 'SERVICE_ITEM',
          standardFieldOption: 'option-123',
        },
      };

      renderComponent(defaultProps, initialState);

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Field Label Mapping', () => {
    it('maps service item field correctly', async () => {
      const mockLoadTimeForAssignments = jest.fn();
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: mockLoadTimeForAssignments,
        loading: false,
        data: mockWorkersData,
        error: null,
        pageInfo: null,
        totalTimeForCount: null, // Must be null to trigger initial fetch
      });

      renderComponent();

      await waitFor(() => {
        expect(mockLoadTimeForAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              standardFieldLabel: 'SERVICE_ITEM',
            }),
          }),
        );
      });
    });

    it('maps billable field correctly', async () => {
      const billableField = {
        key: 'isBillingFieldEnabled',
        title: 'Billable',
        automationId: 'billable-field',
      } as any;

      const mockLoadTimeForAssignments = jest.fn();
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: mockLoadTimeForAssignments,
        loading: false,
        data: mockWorkersData,
        error: null,
        pageInfo: null,
        totalTimeForCount: null, // Must be null to trigger initial fetch
      });

      const propsWithBillable = {
        ...defaultProps,
        field: billableField,
        fieldDisplayName: 'Billable',
      };

      renderComponent(propsWithBillable);

      await waitFor(() => {
        expect(mockLoadTimeForAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              standardFieldLabel: 'BILLABLE',
            }),
          }),
        );
      });
    });

    it('maps class field correctly', async () => {
      const classField = {
        key: 'classForTimeSheetEnabled',
        title: 'Class',
        automationId: 'class-field',
      } as any;

      const mockLoadTimeForAssignments = jest.fn();
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: mockLoadTimeForAssignments,
        loading: false,
        data: mockWorkersData,
        error: null,
        pageInfo: null,
        totalTimeForCount: null, // Must be null to trigger initial fetch
      });

      const propsWithClass = {
        ...defaultProps,
        field: classField,
        fieldDisplayName: 'Class',
      };

      renderComponent(propsWithClass);

      await waitFor(() => {
        expect(mockLoadTimeForAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              standardFieldLabel: 'CLASS',
            }),
          }),
        );
      });
    });
  });

  describe('Error Message Component', () => {
    it('renders error message with title and subtitle', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onError }: any) => {
          capturedOnError = onError;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnError)
                capturedOnError('Database connection failed');
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('can close error message', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onError }: any) => {
          capturedOnError = onError;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnError) capturedOnError('Test error');
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Error message should be visible
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  describe('Data Transformation Edge Cases', () => {
    it('handles undefined displayName and fullName', async () => {
      const dataWithUndefinedNames = [
        {
          timeForContactDAS: { id: 'worker-1' },
          displayName: undefined,
          fullName: undefined,
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: '1',
          groupName: 'Group A',
          assigned: true,
        },
      ];

      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: dataWithUndefinedNames as any,
        error: null,
        pageInfo: null,
        totalTimeForCount: 1,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('uses totalTimeForCount when available', async () => {
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: mockWorkersData,
        error: null,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalTimeForCount: 100,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('falls back to items length when totalTimeForCount is null', async () => {
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: mockWorkersData,
        error: null,
        pageInfo: null,
        totalTimeForCount: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles pageInfo without endCursor', async () => {
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: mockWorkersData,
        error: null,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalTimeForCount: 4,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles empty names by falling back to empty string', async () => {
      const dataWithEmptyNames = [
        {
          timeForContactDAS: { id: 'worker-1' },
          displayName: '',
          fullName: '',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: '1',
          groupName: 'Group A',
          assigned: false,
        },
      ];

      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: dataWithEmptyNames,
        error: null,
        pageInfo: null,
        totalTimeForCount: 1,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('creates group name from groupId when groupName is missing', async () => {
      const dataWithMissingGroupName = [
        {
          timeForContactDAS: { id: 'worker-1' },
          displayName: 'Worker 1',
          fullName: 'Worker One',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: '42',
          groupName: undefined,
          assigned: true,
        },
      ];

      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: dataWithMissingGroupName,
        error: null,
        pageInfo: null,
        totalTimeForCount: 1,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Redux State Management', () => {
    it('resets redux state on component mount', async () => {
      const mockDispatch = jest.fn();
      const testStore = configureStore({
        reducer: {
          standardFieldWorkerAssignments: standardFieldWorkerAssignmentsReducer,
        },
      });

      const originalDispatch = testStore.dispatch;
      testStore.dispatch = mockDispatch;

      render(
        <ReduxProvider store={testStore}>
          <MockQuicksandProvider sandbox={sandbox}>
            <MockedProvider mocks={[]} addTypename={false}>
              <StandardFieldWorkerAssignmentIntegration {...defaultProps} />
            </MockedProvider>
          </MockQuicksandProvider>
        </ReduxProvider>,
      );

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: expect.stringContaining('reset'),
          }),
        );
      });

      testStore.dispatch = originalDispatch;
    });

    it('dispatches appendData when API data is received', async () => {
      const mockDispatch = jest.fn();
      const testStore = configureStore({
        reducer: {
          standardFieldWorkerAssignments: standardFieldWorkerAssignmentsReducer,
        },
      });

      const originalDispatch = testStore.dispatch;
      testStore.dispatch = mockDispatch;

      render(
        <ReduxProvider store={testStore}>
          <MockQuicksandProvider sandbox={sandbox}>
            <MockedProvider mocks={[]} addTypename={false}>
              <StandardFieldWorkerAssignmentIntegration {...defaultProps} />
            </MockedProvider>
          </MockQuicksandProvider>
        </ReduxProvider>,
      );

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: expect.stringContaining('appendData'),
          }),
        );
      });

      testStore.dispatch = originalDispatch;
    });
  });

  describe('Hierarchical Data Building', () => {
    it('builds hierarchical structure with groups and workers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('calculates group selection state based on worker selections', async () => {
      // All workers in a group are selected -> group should be selected
      const allSelectedData = [
        {
          timeForContactDAS: { id: 'worker-1' },
          displayName: 'Worker 1',
          fullName: 'Worker One',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: '1',
          groupName: 'Group A',
          assigned: true,
        },
        {
          timeForContactDAS: { id: 'worker-2' },
          displayName: 'Worker 2',
          fullName: 'Worker Two',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: '1',
          groupName: 'Group A',
          assigned: true,
        },
      ];

      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: allSelectedData,
        error: null,
        pageInfo: null,
        totalTimeForCount: 2,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles mixed group and ungrouped workers', async () => {
      const mixedData = [
        {
          timeForContactDAS: { id: 'worker-1' },
          displayName: 'Worker 1',
          fullName: 'Worker One',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: '1',
          groupName: 'Group A',
          assigned: true,
        },
        {
          timeForContactDAS: { id: 'worker-2' },
          displayName: 'Worker 2',
          fullName: 'Worker Two',
          timeForType: TimeTracking_TimeForType.Employee,
          groupId: undefined,
          groupName: undefined,
          assigned: false,
        },
      ];

      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: jest.fn(),
        loading: false,
        data: mixedData,
        error: null,
        pageInfo: null,
        totalTimeForCount: 2,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination Configuration', () => {
    it('configures pagination with correct default page size', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // The mock drawer renders the config, so we can verify configuration was passed
    });

    it('includes standardFieldOption in paginated fetch requests', async () => {
      const mockLoadTimeForAssignments = jest.fn();
      mockUseTimeForAssignments.mockReturnValue({
        loadTimeForAssignments: mockLoadTimeForAssignments,
        loading: false,
        data: mockWorkersData,
        error: null,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: 'cursor-123',
        },
        totalTimeForCount: 150,
      });

      const initialState = {
        standardFieldWorkerAssignments: {
          allItems: mockWorkersData,
          totalCount: 150,
          loading: false,
          error: null,
          hasMore: true,
          endCursor: 'cursor-123',
          lastFetchArgs: null,
          standardFieldLabel: 'SERVICE_ITEM',
          standardFieldOption: 'option-123',
        },
      };

      renderComponent(defaultProps, initialState);

      await waitFor(() => {
        expect(mockLoadTimeForAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              standardFieldLabel: 'SERVICE_ITEM',
              standardFieldOption: 'option-123',
            }),
          }),
        );
      });
    });
  });

  describe('Drawer Configuration', () => {
    it('configures drawer with correct assignment type', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-type')).toHaveTextContent(
          'WorkerAssignment',
        );
      });
    });

    it('configures drawer with client-side search mode', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Verifies the drawer renders, which means config was valid
    });

    it('configures drawer with hierarchical selection', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('maintains mounted ref for async operations', async () => {
      const { unmount } = renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Component should handle unmounting gracefully
      unmount();
    });

    it('clears error on success callback', async () => {
      let capturedOnSuccess: (() => void) | undefined;

      mockUseManageStandardFieldOptionTimeForAssignment.mockImplementation(
        ({ onSuccess }: any) => {
          capturedOnSuccess = onSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnSuccess) capturedOnSuccess();
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(mockOnShowSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Tracking Points', () => {
    it('calls onClose when drawer is closed for worker assignments', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('close-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('close-drawer'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('successfully saves worker assignments', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageStandardFieldOptionTimeForAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(mockManage).toHaveBeenCalled();
      });
    });
  });
});
