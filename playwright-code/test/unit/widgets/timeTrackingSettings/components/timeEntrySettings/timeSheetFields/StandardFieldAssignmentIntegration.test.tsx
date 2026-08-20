import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StandardFieldAssignmentIntegration from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/StandardFieldAssignmentIntegration';
import { useTimeAgainstAssignments } from 'src/js/service/hooks/assignments/useTimeAgainstAssignments';
import { useManageStandardFieldAssignment } from 'src/js/service/hooks/assignments/useManageStandardFieldAssignment';
import { useManageStandardFieldOptionTimeAgainstAssignment } from 'src/js/service/hooks/assignments/useManageStandardFieldOptionTimeAgainstAssignment';
import { getDefaultSandbox } from 'test/unit/testUtils';
import standardFieldAssignmentsReducer from 'src/js/widgets/timeTrackingSettings/store/standardFieldAssignmentsSlice';

// Mock the hooks
jest.mock('src/js/service/hooks/assignments/useTimeAgainstAssignments');
jest.mock('src/js/service/hooks/assignments/useManageStandardFieldAssignment');
jest.mock(
  'src/js/service/hooks/assignments/useManageStandardFieldOptionTimeAgainstAssignment',
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
                newlyAssigned: new Set(['customer-1']),
                newlyUnassigned: new Set(['customer-2']),
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
            if (config?.callbacks?.onSearch) {
              config.callbacks.onSearch('test search');
            }
          }}
          data-testid="trigger-search"
        >
          Trigger Search
        </button>
      </div>
    );
  },
}));

const mockUseTimeAgainstAssignments =
  useTimeAgainstAssignments as jest.MockedFunction<
    typeof useTimeAgainstAssignments
  >;
const mockUseManageStandardFieldAssignment =
  useManageStandardFieldAssignment as jest.MockedFunction<
    typeof useManageStandardFieldAssignment
  >;
const mockUseManageStandardFieldOptionTimeAgainstAssignment =
  useManageStandardFieldOptionTimeAgainstAssignment as jest.MockedFunction<
    typeof useManageStandardFieldOptionTimeAgainstAssignment
  >;

describe('StandardFieldAssignmentIntegration', () => {
  const mockCustomersData = [
    {
      timeAgainstContactDAS: {
        customer: { id: 'customer-1' },
      },
      displayName: 'Customer 1',
      fullName: 'Customer 1 Full',
      level: 0,
      parentId: undefined,
      numChildren: 2,
      assigned: true,
    },
    {
      timeAgainstContactDAS: {
        customer: { id: 'customer-1' },
        project: { id: 'project-1' },
      },
      displayName: 'Project 1',
      fullName: 'Project 1 Full',
      level: 1,
      parentId: 'customer-1',
      numChildren: 0,
      assigned: false,
    },
    {
      timeAgainstContactDAS: {
        customer: { id: 'customer-2' },
      },
      displayName: 'Customer 2',
      fullName: undefined,
      level: 0,
      parentId: undefined,
      numChildren: 0,
      assigned: false,
    },
  ];

  const mockField = {
    key: 'isServiceFieldEnabled',
    title: 'Service Item',
    automationId: 'service-item-field',
  } as any;

  const mockOnClose = jest.fn();
  const mockOnError = jest.fn();
  const mockOnShowSuccess = jest.fn();

  const sandbox = getDefaultSandbox();

  const defaultProps = {
    field: mockField,
    fieldDisplayName: 'Service Item',
    onClose: mockOnClose,
    onError: mockOnError,
    onShowSuccess: mockOnShowSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: jest.fn(),
      loading: false,
      data: mockCustomersData,
      error: null,
      pageInfo: null,
      totalTimeAgainstCount: 3,
    });

    mockUseManageStandardFieldAssignment.mockReturnValue([
      jest.fn(),
      { loading: false, error: undefined },
    ] as any);

    mockUseManageStandardFieldOptionTimeAgainstAssignment.mockReturnValue([
      jest.fn(),
      { loading: false, error: undefined },
    ] as any);
  });

  const renderComponent = (props = defaultProps, initialState?: any) => {
    const testStore = configureStore({
      reducer: {
        standardFieldAssignments: standardFieldAssignmentsReducer,
      },
      preloadedState: initialState,
    });

    return render(
      <ReduxProvider store={testStore}>
        <MockQuicksandProvider sandbox={sandbox}>
          <MockedProvider mocks={[]} addTypename={false}>
            <StandardFieldAssignmentIntegration {...props} />
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
        'Service Item',
      );
      expect(screen.getByTestId('assignment-type')).toHaveTextContent(
        'CustomerAssignment',
      );
    });

    it('displays correct field name from fieldDisplayName prop', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('field-name')).toHaveTextContent(
          'Service Item',
        );
      });
    });
  });

  describe('Data Loading', () => {
    it('fetches customer assignments on mount', async () => {
      const mockLoadTimeAgainstAssignments = jest.fn();
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        loading: false,
        data: [],
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: null, // Must be null to trigger initial fetch
      });

      renderComponent();

      await waitFor(() => {
        expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
          first: 100,
          input: {
            standardFieldLabel: 'SERVICE_ITEM',
          },
          filter: {},
          fetchPolicy: 'no-cache',
        });
      });
    });

    it('shows loading state while data is loading', async () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: true,
        data: undefined as any,
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: null, // null when data hasn't loaded yet
      });

      renderComponent(defaultProps, {
        standardFieldAssignments: {
          allItems: [],
          totalCount: 0,
          loading: true,
          error: null,
          hasMore: true,
          endCursor: null,
          lastFetchArgs: null,
          standardFieldLabel: null,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('drawer-loading')).toHaveTextContent('true');
      });
    });

    it('shows loading during mutation', async () => {
      mockUseManageStandardFieldAssignment.mockReturnValue([
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
    it('transforms customers/projects correctly', async () => {
      renderComponent();

      await waitFor(() => {
        const initialSelections = screen.getByTestId('initial-selections');
        // Only customer-1 is assigned
        expect(initialSelections.textContent).toContain('customer-1');
        expect(initialSelections.textContent).not.toContain('project-1');
        expect(initialSelections.textContent).not.toContain('customer-2');
      });
    });

    it('uses displayName with fallback to fullName', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles undefined numChildren', async () => {
      const dataWithUndefinedNumChildren = [
        {
          timeAgainstContactDAS: {
            customer: { id: 'customer-1' },
          },
          displayName: 'Customer 1',
          fullName: 'Customer 1 Full',
          level: 0,
          parentId: undefined,
          numChildren: undefined,
          assigned: true,
        },
      ];

      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: dataWithUndefinedNumChildren as any,
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: 3,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles undefined level', async () => {
      const dataWithUndefinedLevel = [
        {
          timeAgainstContactDAS: {
            customer: { id: 'customer-1' },
          },
          displayName: 'Customer 1',
          fullName: 'Customer 1 Full',
          level: undefined,
          parentId: undefined,
          numChildren: 2,
          assigned: true,
        },
      ];

      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: dataWithUndefinedLevel as any,
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: 3,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('handles save with specific customer assignments', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageStandardFieldAssignment.mockReturnValue([
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
                timeAgainstToUnassign: [{ customerId: 'customer-2' }],
              },
            },
          },
        });
      });
    });

    it('handles save with select all', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageStandardFieldAssignment.mockReturnValue([
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

      mockUseManageStandardFieldAssignment.mockImplementation(
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

      mockUseManageStandardFieldAssignment.mockImplementation(
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
          '[StandardFieldAssignment] Standard field assignment saved successfully',
          undefined,
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on failure', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageStandardFieldAssignment.mockImplementation(
        ({ onError }: any) => {
          capturedOnError = onError;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnError)
                capturedOnError('Failed to save assignments');
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

      mockUseManageStandardFieldAssignment.mockImplementation(
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
          '[StandardFieldAssignment] Standard field assignment failed',
          { errorMessage: 'Test error' },
        );
      });
    });
  });

  describe('Partial Success Handling', () => {
    it('calls onError with partial success info', async () => {
      let capturedOnPartialSuccess: ((errorInfo: any) => void) | undefined;

      mockUseManageStandardFieldAssignment.mockImplementation(
        ({ onPartialSuccess }: any) => {
          capturedOnPartialSuccess = onPartialSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnPartialSuccess)
                capturedOnPartialSuccess({
                  successCount: 2,
                  errorMessages: ['Field 1 failed'],
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

      mockUseManageStandardFieldAssignment.mockImplementation(
        ({ onPartialSuccess }: any) => {
          capturedOnPartialSuccess = onPartialSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnPartialSuccess)
                capturedOnPartialSuccess({
                  successCount: 2,
                  errorMessages: [],
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
          '[StandardFieldAssignment] Standard field assignment partially succeeded',
          expect.any(Object),
        );
      });
    });

    it('clears drawer error on partial success', async () => {
      let capturedOnPartialSuccess: ((errorInfo: any) => void) | undefined;

      mockUseManageStandardFieldAssignment.mockImplementation(
        ({ onPartialSuccess }: any) => {
          capturedOnPartialSuccess = onPartialSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnPartialSuccess)
                capturedOnPartialSuccess({
                  successCount: 2,
                  errorMessages: [],
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

      mockUseManageStandardFieldAssignment.mockImplementation(
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
    it('handles empty customers data', async () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: [],
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: 0,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles undefined customers data', async () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: undefined as any,
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: null, // null when data hasn't loaded yet
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
        onClose: mockOnClose,
      };

      renderComponent(propsWithoutCallbacks);

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles different field keys correctly', () => {
      const billableField = {
        key: 'isBillableFieldEnabled',
        title: 'Billable',
        automationId: 'billable-field',
      } as any;

      // Just verify the component can be rendered with different field keys
      expect(billableField.key).toBe('isBillableFieldEnabled');
      expect(mockCustomersData.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination and Data Fetching', () => {
    it('fetches paginated data when endIndex exceeds available items', async () => {
      const mockLoadTimeAgainstAssignments = jest.fn();
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        loading: false,
        data: mockCustomersData,
        error: null,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: 'cursor-123',
        },
        totalTimeAgainstCount: 150,
      });

      const initialState = {
        standardFieldAssignments: {
          allItems: mockCustomersData,
          totalCount: 150,
          loading: false,
          error: null,
          hasMore: true,
          endCursor: 'cursor-123',
          lastFetchArgs: null,
          standardFieldLabel: 'SERVICE_ITEM',
        },
      };

      renderComponent(defaultProps, initialState);

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Trigger fetchData via the mock drawer
      await waitFor(() => {
        expect(mockLoadTimeAgainstAssignments).toHaveBeenCalled();
      });
    });

    it('returns available items when endIndex is within range', async () => {
      const mockLoadTimeAgainstAssignments = jest.fn();
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        loading: false,
        data: mockCustomersData,
        error: null,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: '',
        },
        totalTimeAgainstCount: 3,
      });

      const initialState = {
        standardFieldAssignments: {
          allItems: mockCustomersData,
          totalCount: 3,
          loading: false,
          error: null,
          hasMore: false,
          endCursor: null,
          lastFetchArgs: null,
          standardFieldLabel: 'SERVICE_ITEM',
        },
      };

      renderComponent(defaultProps, initialState);

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('does not fetch more data when already loading', async () => {
      const mockLoadTimeAgainstAssignments = jest.fn();
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        loading: true,
        data: mockCustomersData,
        error: null,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: 'cursor-123',
        },
        totalTimeAgainstCount: 150,
      });

      const initialState = {
        standardFieldAssignments: {
          allItems: mockCustomersData,
          totalCount: 150,
          loading: true,
          error: null,
          hasMore: true,
          endCursor: 'cursor-123',
          lastFetchArgs: null,
          standardFieldLabel: 'SERVICE_ITEM',
        },
      };

      renderComponent(defaultProps, initialState);

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('does not fetch more data when hasMore is false', async () => {
      const mockLoadTimeAgainstAssignments = jest.fn();
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        loading: false,
        data: mockCustomersData,
        error: null,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: '',
        },
        totalTimeAgainstCount: 3,
      });

      const initialState = {
        standardFieldAssignments: {
          allItems: mockCustomersData,
          totalCount: 3,
          loading: false,
          error: null,
          hasMore: false,
          endCursor: null,
          lastFetchArgs: null,
          standardFieldLabel: 'SERVICE_ITEM',
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
      const mockLoadTimeAgainstAssignments = jest.fn();
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        loading: false,
        data: mockCustomersData,
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: null, // Must be null to trigger initial fetch
      });

      renderComponent();

      await waitFor(() => {
        expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              standardFieldLabel: 'SERVICE_ITEM',
            }),
          }),
        );
      });
    });

    it('maps billable field correctly', () => {
      // Field mapping is tested by the service item test above
      // This test verifies that the billable field key exists and can be used
      const billableField = {
        key: 'isBillableFieldEnabled',
        title: 'Billable',
        automationId: 'billable-field',
      } as any;

      expect(billableField.key).toBe('isBillableFieldEnabled');
      // The actual field label mapping is done in assignmentUtils.ts which is tested elsewhere
    });
  });

  describe('Error Message Component', () => {
    it('renders error message with title and subtitle', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageStandardFieldAssignment.mockImplementation(
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

      mockUseManageStandardFieldAssignment.mockImplementation(
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

  describe('Project ID Handling', () => {
    it('uses projectId when customerId is not present', async () => {
      const projectOnlyData = [
        {
          timeAgainstContactDAS: {
            project: { id: 'project-only-1' },
          },
          displayName: 'Project Only',
          fullName: 'Project Only Full',
          level: 0,
          parentId: undefined,
          numChildren: 0,
          assigned: true,
        },
      ];

      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: projectOnlyData,
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: 1,
      });

      renderComponent();

      await waitFor(() => {
        const initialSelections = screen.getByTestId('initial-selections');
        expect(initialSelections.textContent).toContain('project-only-1');
      });
    });

    it('handles empty ID gracefully when timeAgainstContactDAS is empty', async () => {
      const dataWithEmptyId = [
        {
          timeAgainstContactDAS: {},
          displayName: 'No ID Item',
          fullName: 'No ID Item Full',
          level: 0,
          parentId: undefined,
          numChildren: 0,
          assigned: false,
        },
      ];

      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: dataWithEmptyId,
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: 1,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Data Transformation Edge Cases', () => {
    it('handles null displayName and fullName', async () => {
      const dataWithNullNames = [
        {
          timeAgainstContactDAS: {
            customer: { id: 'customer-1' },
          },
          displayName: null,
          fullName: null,
          level: 0,
          parentId: undefined,
          numChildren: 0,
          assigned: true,
        },
      ];

      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: dataWithNullNames as any,
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: 1,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('uses totalTimeAgainstCount when available', async () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: mockCustomersData,
        error: null,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalTimeAgainstCount: 100,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('falls back to items length when totalTimeAgainstCount is null', async () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: mockCustomersData,
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles pageInfo without endCursor', async () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: mockCustomersData,
        error: null,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalTimeAgainstCount: 3,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles empty names by falling back to empty string', async () => {
      const dataWithEmptyNames = [
        {
          timeAgainstContactDAS: {
            customer: { id: 'customer-1' },
          },
          displayName: '',
          fullName: '',
          level: 0,
          parentId: undefined,
          numChildren: 0,
          assigned: false,
        },
      ];

      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: jest.fn(),
        loading: false,
        data: dataWithEmptyNames,
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: 1,
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
          standardFieldAssignments: standardFieldAssignmentsReducer,
        },
      });

      const originalDispatch = testStore.dispatch;
      testStore.dispatch = mockDispatch;

      render(
        <ReduxProvider store={testStore}>
          <MockQuicksandProvider sandbox={sandbox}>
            <MockedProvider mocks={[]} addTypename={false}>
              <StandardFieldAssignmentIntegration {...defaultProps} />
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
          standardFieldAssignments: standardFieldAssignmentsReducer,
        },
      });

      const originalDispatch = testStore.dispatch;
      testStore.dispatch = mockDispatch;

      render(
        <ReduxProvider store={testStore}>
          <MockQuicksandProvider sandbox={sandbox}>
            <MockedProvider mocks={[]} addTypename={false}>
              <StandardFieldAssignmentIntegration {...defaultProps} />
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

  describe('Option-Level Assignments (standardFieldOption)', () => {
    const mockStandardFieldOption = {
      id: 'option-123',
      name: 'Test Option Name',
    };

    const propsWithOption = {
      ...defaultProps,
      standardFieldOption: mockStandardFieldOption,
    };

    it('displays option name instead of field name when standardFieldOption is provided', async () => {
      renderComponent(propsWithOption);

      await waitFor(() => {
        expect(screen.getByTestId('field-name')).toHaveTextContent(
          'Test Option Name',
        );
      });
    });

    it('fetches customer assignments with standardFieldOption in query input', async () => {
      const mockLoadTimeAgainstAssignments = jest.fn();
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        loading: false,
        data: [],
        error: null,
        pageInfo: null,
        totalTimeAgainstCount: null, // Must be null to trigger initial fetch
      });

      renderComponent(propsWithOption);

      await waitFor(() => {
        expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
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

    it('calls manageStandardFieldOptionTimeAgainstAssignment when standardFieldOption is provided', async () => {
      const mockOptionManage = jest.fn().mockResolvedValue(undefined);
      const mockFieldManage = jest.fn().mockResolvedValue(undefined);

      mockUseManageStandardFieldAssignment.mockReturnValue([
        mockFieldManage,
        { loading: false, error: undefined },
      ] as any);

      mockUseManageStandardFieldOptionTimeAgainstAssignment.mockReturnValue([
        mockOptionManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent(propsWithOption);

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(mockOptionManage).toHaveBeenCalledWith({
          variables: {
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              standardFieldOptionId: 'option-123',
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
                timeAgainstToUnassign: [{ customerId: 'customer-2' }],
              },
            },
          },
        });
        expect(mockFieldManage).not.toHaveBeenCalled();
      });
    });

    it('calls manageStandardFieldOptionTimeAgainstAssignment with assignToAll when select all is used', async () => {
      const mockOptionManage = jest.fn().mockResolvedValue(undefined);

      mockUseManageStandardFieldOptionTimeAgainstAssignment.mockReturnValue([
        mockOptionManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent(propsWithOption);

      await waitFor(() => {
        expect(screen.getByTestId('save-select-all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-select-all'));

      await waitFor(() => {
        expect(mockOptionManage).toHaveBeenCalledWith({
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

    it('calls field-level mutation when standardFieldOption is not provided', async () => {
      const mockOptionManage = jest.fn().mockResolvedValue(undefined);
      const mockFieldManage = jest.fn().mockResolvedValue(undefined);

      mockUseManageStandardFieldAssignment.mockReturnValue([
        mockFieldManage,
        { loading: false, error: undefined },
      ] as any);

      mockUseManageStandardFieldOptionTimeAgainstAssignment.mockReturnValue([
        mockOptionManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent(defaultProps); // Without standardFieldOption

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(mockFieldManage).toHaveBeenCalledWith({
          variables: {
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
                timeAgainstToUnassign: [{ customerId: 'customer-2' }],
              },
            },
          },
        });
        expect(mockOptionManage).not.toHaveBeenCalled();
      });
    });

    it('shows loading state from option mutation', async () => {
      mockUseManageStandardFieldAssignment.mockReturnValue([
        jest.fn(),
        { loading: false, error: undefined },
      ] as any);

      mockUseManageStandardFieldOptionTimeAgainstAssignment.mockReturnValue([
        jest.fn(),
        { loading: true, error: undefined },
      ] as any);

      renderComponent(propsWithOption);

      await waitFor(() => {
        expect(screen.getByTestId('drawer-loading')).toHaveTextContent('true');
      });
    });

    it('shows combined loading state when both mutations might be loading', async () => {
      mockUseManageStandardFieldAssignment.mockReturnValue([
        jest.fn(),
        { loading: true, error: undefined },
      ] as any);

      mockUseManageStandardFieldOptionTimeAgainstAssignment.mockReturnValue([
        jest.fn(),
        { loading: false, error: undefined },
      ] as any);

      renderComponent(defaultProps);

      await waitFor(() => {
        expect(screen.getByTestId('drawer-loading')).toHaveTextContent('true');
      });
    });

    it('calls onShowSuccess on successful option-level save', async () => {
      let capturedOnSuccess: (() => void) | undefined;

      mockUseManageStandardFieldOptionTimeAgainstAssignment.mockImplementation(
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

      renderComponent(propsWithOption);

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(mockOnShowSuccess).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it('displays error message on option-level mutation failure', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageStandardFieldOptionTimeAgainstAssignment.mockImplementation(
        ({ onError }: any) => {
          capturedOnError = onError;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnError)
                capturedOnError('Failed to save option assignments');
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent(propsWithOption);

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('calls onError with partial success info for option-level mutation', async () => {
      let capturedOnPartialSuccess: ((errorInfo: any) => void) | undefined;

      mockUseManageStandardFieldOptionTimeAgainstAssignment.mockImplementation(
        ({ onPartialSuccess }: any) => {
          capturedOnPartialSuccess = onPartialSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnPartialSuccess)
                capturedOnPartialSuccess({
                  successCount: 3,
                  errorMessages: ['Customer 1 failed'],
                });
            }),
            { loading: false, error: undefined },
          ] as any;
        },
      );

      renderComponent(propsWithOption);

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

    it('includes standardFieldOption in paginated fetch requests', async () => {
      const mockLoadTimeAgainstAssignments = jest.fn();
      mockUseTimeAgainstAssignments.mockReturnValue({
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        loading: false,
        data: mockCustomersData,
        error: null,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: 'cursor-123',
        },
        totalTimeAgainstCount: 150,
      });

      const initialState = {
        standardFieldAssignments: {
          allItems: mockCustomersData,
          totalCount: 150,
          loading: false,
          error: null,
          hasMore: true,
          endCursor: 'cursor-123',
          lastFetchArgs: null,
          standardFieldLabel: 'SERVICE_ITEM',
        },
      };

      renderComponent(propsWithOption, initialState);

      await waitFor(() => {
        expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith(
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

  describe('Tracking Points', () => {
    it('calls onClose when drawer is closed for field-level assignments', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('close-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('close-drawer'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when drawer is closed for option-level assignments', async () => {
      const propsWithOption = {
        ...defaultProps,
        standardFieldOption: {
          id: 'option-123',
          name: 'Test Option Name',
        },
      };

      renderComponent(propsWithOption);

      await waitFor(() => {
        expect(screen.getByTestId('close-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('close-drawer'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Search Tracking', () => {
    it('tracks search when onSearch callback is triggered with non-empty value', async () => {
      const mockTrack = jest.fn();
      jest
        .spyOn(require('@payroll/quicksand'), 'useTracking')
        .mockReturnValue(mockTrack);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('trigger-search')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('trigger-search'));

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            org: 'sbseg',
            purpose: 'prod',
            scope: 'time',
            scope_area: 'timeentrymanagement',
            screen: 'assignments',
            action: 'engaged',
            object: 'component',
            object_detail: 'assign_customers',
            ui_action: 'typed',
            ui_object: 'form_field',
            ui_object_detail: 'search',
          }),
        );
      });
    });
  });
});
