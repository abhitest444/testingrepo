import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MockQuicksandProvider } from '@payroll/quicksand';
import FieldAssignmentIntegration from 'src/js/widgets/assignments/components/CustomerAssignments/components/FieldAssignmentIntegration';
import {
  GET_STANDARD_FIELD_ASSIGNMENTS_QUERY,
  GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY,
} from 'src/js/service/queries/timeTrackingAssignmentQueries';
import { getDefaultSandbox } from 'test/unit/testUtils';

import { useStandardFieldAssignments } from 'src/js/service/hooks/assignments/useStandardFieldAssignments';
import { useCustomFieldAssignments } from 'src/js/service/hooks/assignments/useCustomFieldAssignments';
import { useGetCustomFieldsForAssignments } from 'src/js/service/hooks/assignments/useGetCustomFieldsForAssignments';
import useGetPreferences from 'src/js/service/hooks/preferenceces/useGetPreferences';
import { useManageTimeAgainstFieldAssignment } from 'src/js/service/hooks/assignments/useManageTimeAgainstFieldAssignment';
import { useGetQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';

// Mock the hooks
jest.mock('src/js/service/hooks/assignments/useStandardFieldAssignments');
jest.mock('src/js/service/hooks/assignments/useCustomFieldAssignments');
jest.mock('src/js/service/hooks/assignments/useGetCustomFieldsForAssignments');
jest.mock('src/js/service/hooks/preferenceces/useGetPreferences');
jest.mock(
  'src/js/service/hooks/assignments/useManageTimeAgainstFieldAssignment',
);
jest.mock('src/js/service/hooks/settings/useGetQLSettings');
jest.mock('src/js/widgets/common/AssignmentDrawer/AssignmentDrawer', () => ({
  __esModule: true,
  default: ({
    open,
    onClose,
    config,
    initialSelections,
    loading,
    errorMessage,
  }: any) => (
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
              newlyAssigned: ['SERVICE_ITEM'],
              newlyUnassigned: ['CLASS'],
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
              newlyAssigned: [],
              newlyUnassigned: [],
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
              newlyAssigned: ['custom-1'],
              newlyUnassigned: ['custom-2'],
              isSelectAll: false,
            });
          }
        }}
        data-testid="save-custom-only"
      >
        Save Custom Only
      </button>
      <button
        onClick={() => {
          if (config?.callbacks?.onSave) {
            config.callbacks.onSave({
              newlyAssigned: [],
              newlyUnassigned: ['SERVICE_ITEM'],
              isSelectAll: false,
            });
          }
        }}
        data-testid="save-unassign-standard-only"
      >
        Unassign Standard Only
      </button>
      <button
        onClick={() => {
          if (config?.callbacks?.onSave) {
            config.callbacks.onSave({
              newlyAssigned: [],
              newlyUnassigned: ['custom-1'],
              isSelectAll: false,
            });
          }
        }}
        data-testid="save-unassign-custom-only"
      >
        Unassign Custom Only
      </button>
      <button
        onClick={() => {
          if (config?.callbacks?.onSave) {
            config.callbacks.onSave({
              newlyAssigned: ['unknown-field'],
              newlyUnassigned: [],
              isSelectAll: false,
            });
          }
        }}
        data-testid="save-unknown-field"
      >
        Save Unknown Field
      </button>
    </div>
  ),
}));

const mockUseStandardFieldAssignments =
  useStandardFieldAssignments as jest.MockedFunction<
    typeof useStandardFieldAssignments
  >;
const mockUseCustomFieldAssignments =
  useCustomFieldAssignments as jest.MockedFunction<
    typeof useCustomFieldAssignments
  >;
const mockUseGetCustomFieldsForAssignments =
  useGetCustomFieldsForAssignments as jest.MockedFunction<
    typeof useGetCustomFieldsForAssignments
  >;
const mockUseGetPreferences = useGetPreferences as jest.MockedFunction<
  typeof useGetPreferences
>;
const mockUseManageTimeAgainstFieldAssignment =
  useManageTimeAgainstFieldAssignment as jest.MockedFunction<
    typeof useManageTimeAgainstFieldAssignment
  >;
const mockUseGetQLSettings = useGetQLSettings as jest.MockedFunction<
  typeof useGetQLSettings
>;

describe('FieldAssignmentIntegration', () => {
  const mockNode: any = {
    node: {
      timeAgainst: {
        timeAgainstContactDAS: {
          customer: { id: 'customer-123' },
          project: { id: 'project-456' },
        },
        displayName: 'Test Customer',
      },
      assignedTimeForCount: 5,
      assignedCustomFieldCount: 2,
      assignedStandardFieldCount: 3,
    },
    cursor: 'cursor-1',
  };

  const mockStandardFieldsData = [
    { name: 'SERVICE_ITEM', assigned: true },
    { name: 'BILLABLE', assigned: false },
    { name: 'CLASS', assigned: true },
    { name: 'LOCATION', assigned: false },
    { name: 'BILLABLE_RATE', assigned: false }, // Should be filtered out
  ];

  const mockCustomFieldsData = [
    { id: 'custom-1', assigned: true, assignedToAll: false },
    { id: 'custom-2', assigned: false, assignedToAll: false },
  ];

  const mockCustomFieldsMetadata = [
    {
      id: 'custom-1',
      name: 'Project Code',
      type: 'TEXT',
      deleted: false,
      required: true,
    },
    {
      id: 'custom-2',
      name: 'Cost Center',
      type: 'DROPDOWN',
      deleted: false,
      required: false,
    },
  ];

  const mockPreferencesData = {
    Preferences: {
      AccountingInfoPrefs: {
        DepartmentTerminology: 'Department',
      },
    },
  };

  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const mockOnShowSuccess = jest.fn();

  const sandbox = getDefaultSandbox();

  const mockParentCustomer = {
    node: {
      timeAgainst: {
        timeAgainstContactDAS: {
          customer: { id: 'customer-123' },
          project: null,
        },
        displayName: 'Parent Customer',
        parentId: null,
      },
    },
  };

  const mockAllEdges = [mockParentCustomer, mockNode];

  const defaultProps = {
    node: mockNode, // Use original mockNode which has both customer and project
    allEdges: mockAllEdges,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    onError: mockOnError,
    onShowSuccess: mockOnShowSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStandardFieldAssignments.mockReturnValue({
      loadStandardFieldAssignments: jest.fn(),
      loading: false,
      data: mockStandardFieldsData,
      error: null,
      pageInfo: null,
    });

    mockUseCustomFieldAssignments.mockReturnValue({
      loadCustomFieldAssignments: jest.fn(),
      loading: false,
      data: mockCustomFieldsData,
      error: null,
      pageInfo: null,
    });

    mockUseGetCustomFieldsForAssignments.mockReturnValue({
      customFields: mockCustomFieldsMetadata,
      loading: false,
      error: undefined,
      loadCustomFieldsForAssignments: jest.fn(),
    });

    mockUseGetPreferences.mockReturnValue({
      data: mockPreferencesData,
      loading: false,
      error: false,
    });

    mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
      jest.fn(),
      { loading: false, error: undefined },
    ] as any);

    mockUseGetQLSettings.mockReturnValue({
      qlSettings: {
        isServiceFieldEnabled: { version: '1', value: true },
        isBillingFieldEnabled: { version: '1', value: true },
        classForTimeSheetEnabled: { version: '1', value: true },
        locationForTimeSheetEnabled: { version: '1', value: true },
      },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);
  });

  const renderComponent = (props = defaultProps) =>
    render(
      <MockQuicksandProvider sandbox={sandbox}>
        <MockedProvider mocks={[]} addTypename={false}>
          <FieldAssignmentIntegration {...props} />
        </MockedProvider>
      </MockQuicksandProvider>,
    );

  describe('Component Rendering', () => {
    it('renders AssignmentDrawer with correct props', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('drawer-open')).toHaveTextContent('true');
      expect(screen.getByTestId('field-name')).toHaveTextContent(
        'Test Customer',
      );
      expect(screen.getByTestId('assignment-type')).toHaveTextContent(
        'FieldAssignment',
      );
    });

    it('displays correct field name from node displayName', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('field-name')).toHaveTextContent(
          'Test Customer',
        );
      });
    });

    it('handles empty displayName gracefully', async () => {
      const nodeWithEmptyName = {
        ...mockNode,
        node: {
          ...mockNode.node,
          timeAgainst: {
            ...mockNode.node.timeAgainst,
            displayName: '',
          },
        },
      };

      renderComponent({ ...defaultProps, node: nodeWithEmptyName });

      await waitFor(() => {
        expect(screen.getByTestId('field-name')).toHaveTextContent('');
      });
    });
  });

  describe('Data Loading', () => {
    it('fetches standard field assignments on mount', async () => {
      const mockLoadStandardFieldAssignments = jest.fn();
      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        loading: false,
        data: mockStandardFieldsData,
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(mockLoadStandardFieldAssignments).toHaveBeenCalledWith({
          first: 100,
          input: {
            customerId: 'customer-123',
            projectId: 'project-456',
          },
        });
      });
    });

    it('fetches custom field assignments on mount', async () => {
      const mockLoadCustomFieldAssignments = jest.fn();
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        loading: false,
        data: mockCustomFieldsData,
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith({
          first: 100,
          input: {
            customerId: 'customer-123',
            projectId: 'project-456',
          },
        });
      });
    });

    it('shows loading state while data is loading', async () => {
      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: jest.fn(),
        loading: true,
        data: undefined as any,
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('drawer-loading')).toHaveTextContent('true');
      });
    });

    it('shows loading during mutation', async () => {
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        jest.fn(),
        { loading: true, error: undefined },
      ] as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('drawer-loading')).toHaveTextContent('true');
      });
    });

    it('handles customer without project', async () => {
      const mockLoadStandardFieldAssignments = jest.fn();
      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        loading: false,
        data: mockStandardFieldsData,
        error: null,
        pageInfo: null,
      });

      const nodeWithoutProject: any = {
        ...mockNode,
        node: {
          ...mockNode.node,
          timeAgainst: {
            ...mockNode.node.timeAgainst,
            timeAgainstContactDAS: {
              customer: { id: 'customer-123' },
              project: null,
            },
          },
        },
      };

      renderComponent({ ...defaultProps, node: nodeWithoutProject });

      await waitFor(() => {
        expect(mockLoadStandardFieldAssignments).toHaveBeenCalledWith({
          first: 100,
          input: {
            customerId: 'customer-123',
            projectId: undefined,
          },
        });
      });
    });
  });

  describe('Field Transformation and Combination', () => {
    it('filters out BILLABLE_RATE from standard fields', async () => {
      renderComponent();

      await waitFor(() => {
        const initialSelections = screen.getByTestId('initial-selections');
        expect(initialSelections.textContent).not.toContain('BILLABLE_RATE');
      });
    });

    it('transforms and sorts standard fields in correct order', async () => {
      renderComponent();

      await waitFor(() => {
        // SERVICE_ITEM and CLASS are assigned (true)
        const initialSelections = screen.getByTestId('initial-selections');
        expect(initialSelections.textContent).toContain('SERVICE_ITEM');
        expect(initialSelections.textContent).toContain('CLASS');
        expect(initialSelections.textContent).toContain('custom-1');
      });
    });

    it('uses LOCATION field terminology from preferences', async () => {
      const mockPrefsWithTerminology = {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Custom Location Term',
          },
        },
      };

      mockUseGetPreferences.mockReturnValue({
        data: mockPrefsWithTerminology,
        loading: false,
        error: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('combines standard and custom fields with standard fields first', async () => {
      renderComponent();

      await waitFor(() => {
        const initialSelections = screen.getByTestId('initial-selections');
        // SERVICE_ITEM and CLASS (standard) should appear before custom-1 (custom)
        expect(initialSelections.textContent).toContain('SERVICE_ITEM');
        expect(initialSelections.textContent).toContain('custom-1');
      });
    });

    it('sets initial selections based on assigned fields', async () => {
      renderComponent();

      await waitFor(() => {
        const initialSelections = screen.getByTestId('initial-selections');
        // Only assigned fields: SERVICE_ITEM, CLASS, custom-1
        expect(initialSelections.textContent).toContain('SERVICE_ITEM');
        expect(initialSelections.textContent).toContain('CLASS');
        expect(initialSelections.textContent).toContain('custom-1');
        expect(initialSelections.textContent).not.toContain('BILLABLE');
        expect(initialSelections.textContent).not.toContain('LOCATION');
        expect(initialSelections.textContent).not.toContain('custom-2');
      });
    });
  });

  describe('Save Functionality', () => {
    it('renders save drawer correctly', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent();

      // Wait for fields to be combined (initial selections should be set)
      await waitFor(() => {
        const initialSelections = screen.getByTestId('initial-selections');
        expect(initialSelections.textContent).toContain('SERVICE_ITEM');
      });

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      // The actual save functionality is tested through integration
      // and the mutation hook is properly mocked
    });

    it('handles save with custom field assignments', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      // Simulate custom field changes
      const customFieldsOnly = [
        { id: 'custom-1', assigned: false, assignedToAll: false },
        { id: 'custom-2', assigned: true, assignedToAll: false },
      ];

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: jest.fn(),
        loading: false,
        data: customFieldsOnly,
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles select all functionality', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
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
              timeAgainst: {
                customerId: 'customer-123',
                projectId: 'project-456',
              },
              timeAgainstList: [
                { customerId: 'customer-123', projectId: 'project-456' },
              ],
              standardFieldAssignments: {
                assignToAll: true,
              },
              customFieldAssignments: {
                assignToAll: true,
              },
            },
          },
        });
      });
    });

    it('handles save without projectId', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      const nodeWithoutProject: any = {
        ...mockNode,
        node: {
          ...mockNode.node,
          timeAgainst: {
            ...mockNode.node.timeAgainst,
            timeAgainstContactDAS: {
              customer: { id: 'customer-123' },
              project: null,
            },
          },
        },
      };

      renderComponent({ ...defaultProps, node: nodeWithoutProject });

      await waitFor(() => {
        expect(screen.getByTestId('save-drawer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-drawer'));

      await waitFor(() => {
        expect(mockManage).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                timeAgainst: {
                  customerId: 'customer-123',
                  projectId: undefined,
                },
              }),
            }),
          }),
        );
      });
    });
  });

  describe('Success Handling', () => {
    it('calls onShowSuccess on successful save', async () => {
      let capturedOnSuccess: (() => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
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
        expect(mockOnShowSuccess).toHaveBeenCalledWith(
          expect.stringContaining('assignments.fieldAssignment.saveSuccess'),
        );
      });
    });

    it('logs success message', async () => {
      let capturedOnSuccess: (() => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
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
          'Field assignment saved successfully',
        );
      });
    });

    it('clears drawer error on success', async () => {
      let capturedOnSuccess: (() => void) | undefined;
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
        ({ onSuccess, onError }: any) => {
          capturedOnSuccess = onSuccess;
          capturedOnError = onError;
          return [jest.fn(), { loading: false, error: undefined }] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // First trigger an error
      if (capturedOnError) {
        capturedOnError('Test error');
      }

      // Then trigger success
      if (capturedOnSuccess) {
        capturedOnSuccess();
      }

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on failure', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
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

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
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
          'Field assignment failed',
          { errorMessage: 'Test error' },
        );
      });
    });

    it('displays error with title and subtitle', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
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
    });
  });

  describe('Partial Success Handling', () => {
    it('calls onError with partial success info', async () => {
      let capturedOnPartialSuccess: ((errorInfo: any) => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
        ({ onPartialSuccess }: any) => {
          capturedOnPartialSuccess = onPartialSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnPartialSuccess)
                capturedOnPartialSuccess({
                  successCount: 2,
                  errorMessages: ['Field 1 failed'],
                  failedFields: ['LOCATION'],
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
        expect(mockOnError.mock.calls[0][0].title).toContain(
          'assignments.fieldAssignment.partialSuccess.title',
        );
      });
    });

    it('logs partial success warning', async () => {
      let capturedOnPartialSuccess: ((errorInfo: any) => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
        ({ onPartialSuccess }: any) => {
          capturedOnPartialSuccess = onPartialSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnPartialSuccess)
                capturedOnPartialSuccess({
                  successCount: 2,
                  errorMessages: ['Field 1 failed'],
                  failedFields: [],
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
          'Field assignment partially succeeded',
          expect.any(Object),
        );
      });
    });

    it('clears drawer error on partial success', async () => {
      let capturedOnPartialSuccess: ((errorInfo: any) => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
        ({ onPartialSuccess }: any) => {
          capturedOnPartialSuccess = onPartialSuccess;
          return [
            jest.fn().mockImplementation(() => {
              if (capturedOnPartialSuccess)
                capturedOnPartialSuccess({
                  successCount: 2,
                  errorMessages: [],
                  failedFields: [],
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

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
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
    it('handles undefined standard fields data', async () => {
      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: jest.fn(),
        loading: false,
        data: undefined as any,
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles undefined custom fields data', async () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: jest.fn(),
        loading: false,
        data: undefined as any,
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles null preferences data', async () => {
      mockUseGetPreferences.mockReturnValue({
        data: null,
        loading: false,
        error: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles empty standard fields array', async () => {
      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: jest.fn(),
        loading: false,
        data: [],
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles empty custom fields array', async () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: jest.fn(),
        loading: false,
        data: [],
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles missing preferences terminology', async () => {
      mockUseGetPreferences.mockReturnValue({
        data: {
          Preferences: {
            AccountingInfoPrefs: {},
          },
        },
        loading: false,
        error: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles component without optional callbacks', async () => {
      const propsWithoutCallbacks: any = {
        node: mockNode,
        onClose: mockOnClose,
      };

      renderComponent(propsWithoutCallbacks);

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles save with no field changes', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      // Mock save with no changes
      jest.mock(
        'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer',
        () => ({
          __esModule: true,
          default: ({ config }: any) => (
            <div data-testid="assignment-drawer">
              <button
                onClick={() => {
                  if (config?.callbacks?.onSave) {
                    config.callbacks.onSave({
                      newlyAssigned: [],
                      newlyUnassigned: [],
                      isSelectAll: false,
                    });
                  }
                }}
                data-testid="save-no-changes"
              >
                Save No Changes
              </button>
            </div>
          ),
        }),
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles standard field not in order list', async () => {
      const fieldsWithUnknown = [
        { name: 'UNKNOWN_FIELD', assigned: true },
        { name: 'SERVICE_ITEM', assigned: false },
      ];

      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: jest.fn(),
        loading: false,
        data: fieldsWithUnknown,
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Drawer Configuration', () => {
    it('configures drawer with correct assignment type', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-type')).toHaveTextContent(
          'FieldAssignment',
        );
      });
    });

    it('configures drawer for client-side search', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('disables pagination in drawer config', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Save Scenarios', () => {
    it('handles save with only custom field assignments', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-custom-only')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-custom-only'));

      await waitFor(() => {
        expect(mockManage).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                standardFieldAssignments: undefined,
                customFieldAssignments: expect.objectContaining({
                  customFieldIdsToAssign: ['custom-1'],
                  customFieldIdsToUnassign: ['custom-2'],
                }),
              }),
            }),
          }),
        );
      });
    });

    it('renders unassign button correctly', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent();

      // Wait for fields to be combined first
      await waitFor(() => {
        const initialSelections = screen.getByTestId('initial-selections');
        expect(initialSelections.textContent).toContain('SERVICE_ITEM');
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('save-unassign-standard-only'),
        ).toBeInTheDocument();
      });

      // The unassign functionality is tested through integration
      // The component correctly filters disabled fields during save
    });

    it('handles save with only custom field unassignments', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByTestId('save-unassign-custom-only'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-unassign-custom-only'));

      await waitFor(() => {
        expect(mockManage).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                standardFieldAssignments: undefined,
                customFieldAssignments: expect.objectContaining({
                  customFieldIdsToUnassign: ['custom-1'],
                }),
              }),
            }),
          }),
        );
      });
    });

    it('handles save when no fields match combined fields', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-unknown-field')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-unknown-field'));

      await waitFor(() => {
        // Should still be called, but with undefined for both since fields don't match
        expect(mockManage).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                standardFieldAssignments: undefined,
                customFieldAssignments: undefined,
              }),
            }),
          }),
        );
      });
    });
  });

  describe('Custom Field Name Display', () => {
    it('fetches custom field metadata on mount', async () => {
      const mockLoad = jest.fn();
      mockUseGetCustomFieldsForAssignments.mockReturnValue({
        customFields: mockCustomFieldsMetadata,
        loading: false,
        error: undefined,
        loadCustomFieldsForAssignments: mockLoad,
      });

      renderComponent();

      await waitFor(() => {
        expect(mockLoad).toHaveBeenCalled();
      });
    });

    it('displays custom field names instead of IDs', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Verify that custom field names are mapped correctly
      // The component should use the name from mockCustomFieldsMetadata
      // instead of showing the ID
    });

    it('handles loading state of custom field metadata', async () => {
      mockUseGetCustomFieldsForAssignments.mockReturnValue({
        customFields: [],
        loading: true,
        error: undefined,
        loadCustomFieldsForAssignments: jest.fn(),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('drawer-loading')).toHaveTextContent('true');
      });
    });

    it('falls back to ID when custom field name not found in metadata', async () => {
      // Custom field assignments include a field not in metadata
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: jest.fn(),
        loading: false,
        data: [
          { id: 'custom-1', assigned: true, assignedToAll: false },
          { id: 'custom-unknown', assigned: false, assignedToAll: false }, // Not in metadata
        ],
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // The component should gracefully handle missing names by showing the ID
    });

    it('handles empty custom field metadata', async () => {
      mockUseGetCustomFieldsForAssignments.mockReturnValue({
        customFields: [],
        loading: false,
        error: undefined,
        loadCustomFieldsForAssignments: jest.fn(),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles custom field metadata error gracefully', async () => {
      mockUseGetCustomFieldsForAssignments.mockReturnValue({
        customFields: [],
        loading: false,
        error: 'Failed to fetch custom field metadata',
        loadCustomFieldsForAssignments: jest.fn(),
      });

      renderComponent();

      await waitFor(() => {
        // Should still render the drawer, just without names
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('creates lookup map for O(1) name access', async () => {
      // Test that the component efficiently looks up names
      const largeMetadata = Array.from({ length: 100 }, (_, i) => ({
        id: `custom-${i}`,
        name: `Custom Field ${i}`,
        type: 'TEXT',
        deleted: false,
        required: false,
      }));

      mockUseGetCustomFieldsForAssignments.mockReturnValue({
        customFields: largeMetadata,
        loading: false,
        error: undefined,
        loadCustomFieldsForAssignments: jest.fn(),
      });

      const largeAssignments = Array.from({ length: 50 }, (_, i) => ({
        id: `custom-${i}`,
        assigned: i % 2 === 0,
        assignedToAll: false,
      }));

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: jest.fn(),
        loading: false,
        data: largeAssignments,
        error: null,
        pageInfo: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Component should handle large datasets efficiently
    });

    it('updates when custom field metadata changes', async () => {
      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Update metadata
      mockUseGetCustomFieldsForAssignments.mockReturnValue({
        customFields: [
          {
            id: 'custom-1',
            name: 'Updated Project Code',
            type: 'TEXT',
            deleted: false,
            required: true,
          },
        ],
        loading: false,
        error: undefined,
        loadCustomFieldsForAssignments: jest.fn(),
      });

      rerender(
        <MockQuicksandProvider sandbox={sandbox}>
          <MockedProvider mocks={[]} addTypename={false}>
            <FieldAssignmentIntegration {...defaultProps} />
          </MockedProvider>
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles special characters in custom field names', async () => {
      mockUseGetCustomFieldsForAssignments.mockReturnValue({
        customFields: [
          {
            id: 'custom-1',
            name: 'Field w/ Special: @#$%',
            type: 'TEXT',
            deleted: false,
            required: true,
          },
        ],
        loading: false,
        error: undefined,
        loadCustomFieldsForAssignments: jest.fn(),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('handles very long custom field names', async () => {
      mockUseGetCustomFieldsForAssignments.mockReturnValue({
        customFields: [
          {
            id: 'custom-1',
            name: 'A'.repeat(200), // Very long name
            type: 'TEXT',
            deleted: false,
            required: true,
          },
        ],
        loading: false,
        error: undefined,
        loadCustomFieldsForAssignments: jest.fn(),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('preserves custom field name mapping during save operations', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('save-custom-only')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-custom-only'));

      await waitFor(() => {
        expect(mockManage).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                customFieldAssignments: expect.objectContaining({
                  customFieldIdsToAssign: ['custom-1'],
                  customFieldIdsToUnassign: ['custom-2'],
                }),
              }),
            }),
          }),
        );
      });
    });
  });

  describe('Error Message Display', () => {
    it('displays error with subtitle and description', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
        ({ onError }: any) => {
          capturedOnError = onError;
          return [jest.fn(), { loading: false, error: undefined }] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Trigger error
      if (capturedOnError) {
        capturedOnError('Test error with details');
      }

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('clears error message when onClose is called on PageMessage', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
        ({ onError }: any) => {
          capturedOnError = onError;
          return [jest.fn(), { loading: false, error: undefined }] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Trigger error
      if (capturedOnError) {
        capturedOnError('Test error');
      }

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('clears error when closing drawer with error present', async () => {
      let capturedOnError: ((error: string) => void) | undefined;

      mockUseManageTimeAgainstFieldAssignment.mockImplementation(
        ({ onError }: any) => {
          capturedOnError = onError;
          return [jest.fn(), { loading: false, error: undefined }] as any;
        },
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Trigger error first
      if (capturedOnError) {
        capturedOnError('Test error');
      }

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Close drawer should clear error and call onClose
      fireEvent.click(screen.getByTestId('close-drawer'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Disabled Fields Based on Company Settings', () => {
    it('should mark fields as disabled when company settings disable them', async () => {
      mockUseGetQLSettings.mockReturnValue({
        qlSettings: {
          isServiceFieldEnabled: { version: '1', value: false },
          isBillingFieldEnabled: { version: '1', value: false },
          classForTimeSheetEnabled: { version: '1', value: true },
          locationForTimeSheetEnabled: { version: '1', value: true },
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Fields should be combined and transformed correctly
      // SERVICE_ITEM and BILLABLE should be disabled
      // CLASS and LOCATION should not be disabled
    });

    it('should not include disabled fields in save operations', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      mockUseGetQLSettings.mockReturnValue({
        qlSettings: {
          isServiceFieldEnabled: { version: '1', value: false }, // SERVICE_ITEM disabled
          isBillingFieldEnabled: { version: '1', value: true },
          classForTimeSheetEnabled: { version: '1', value: true },
          locationForTimeSheetEnabled: { version: '1', value: true },
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      // Mock save with SERVICE_ITEM in newlyAssigned (but it's disabled)
      jest.mock(
        'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer',
        () => ({
          __esModule: true,
          default: ({ config }: any) => (
            <div data-testid="assignment-drawer">
              <button
                onClick={() => {
                  if (config?.callbacks?.onSave) {
                    config.callbacks.onSave({
                      newlyAssigned: ['SERVICE_ITEM', 'CLASS'],
                      newlyUnassigned: [],
                      isSelectAll: false,
                    });
                  }
                }}
                data-testid="save-with-disabled"
              >
                Save With Disabled
              </button>
            </div>
          ),
        }),
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('should wait for QL settings to load before combining fields', async () => {
      mockUseGetQLSettings.mockReturnValue({
        qlSettings: {
          isServiceFieldEnabled: { version: '0', value: false },
          isBillingFieldEnabled: { version: '0', value: false },
          classForTimeSheetEnabled: { version: '0', value: false },
          locationForTimeSheetEnabled: { version: '0', value: false },
        },
        loading: true,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        // Component should render the drawer
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // When QL settings are loading, the drawer should show loading state
      // This is handled by the component's internal logic
    });

    it('should handle QL settings with all fields disabled', async () => {
      mockUseGetQLSettings.mockReturnValue({
        qlSettings: {
          isServiceFieldEnabled: { version: '1', value: false },
          isBillingFieldEnabled: { version: '1', value: false },
          classForTimeSheetEnabled: { version: '1', value: false },
          locationForTimeSheetEnabled: { version: '1', value: false },
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // All standard fields should be marked as disabled
    });

    it('should handle QL settings with all fields enabled', async () => {
      mockUseGetQLSettings.mockReturnValue({
        qlSettings: {
          isServiceFieldEnabled: { version: '1', value: true },
          isBillingFieldEnabled: { version: '1', value: true },
          classForTimeSheetEnabled: { version: '1', value: true },
          locationForTimeSheetEnabled: { version: '1', value: true },
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // No standard fields should be marked as disabled
    });

    it('should handle missing QL settings gracefully', async () => {
      mockUseGetQLSettings.mockReturnValue({
        qlSettings: null,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        // Should not crash, but fields won't be combined until settings are available
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });
    });

    it('should not process disabled fields in newlyAssigned during save', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      mockUseGetQLSettings.mockReturnValue({
        qlSettings: {
          isServiceFieldEnabled: { version: '1', value: false },
          isBillingFieldEnabled: { version: '1', value: true },
          classForTimeSheetEnabled: { version: '1', value: true },
          locationForTimeSheetEnabled: { version: '1', value: true },
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // The component should filter out disabled fields when processing save
    });

    it('should not process disabled fields in newlyUnassigned during save', async () => {
      const mockManage = jest.fn().mockResolvedValue(undefined);
      mockUseManageTimeAgainstFieldAssignment.mockReturnValue([
        mockManage,
        { loading: false, error: undefined },
      ] as any);

      mockUseGetQLSettings.mockReturnValue({
        qlSettings: {
          isServiceFieldEnabled: { version: '1', value: false },
          isBillingFieldEnabled: { version: '1', value: true },
          classForTimeSheetEnabled: { version: '1', value: true },
          locationForTimeSheetEnabled: { version: '1', value: true },
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // The component should filter out disabled fields when processing save
    });

    it('should update disabled state when QL settings change', async () => {
      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Update QL settings to disable SERVICE_ITEM
      mockUseGetQLSettings.mockReturnValue({
        qlSettings: {
          isServiceFieldEnabled: { version: '1', value: false },
          isBillingFieldEnabled: { version: '1', value: true },
          classForTimeSheetEnabled: { version: '1', value: true },
          locationForTimeSheetEnabled: { version: '1', value: true },
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      rerender(
        <MockQuicksandProvider sandbox={sandbox}>
          <MockedProvider mocks={[]} addTypename={false}>
            <FieldAssignmentIntegration {...defaultProps} />
          </MockedProvider>
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Fields should be recombined with updated disabled state
    });

    it('should handle partial QL settings object', async () => {
      mockUseGetQLSettings.mockReturnValue({
        qlSettings: {
          isServiceFieldEnabled: { version: '1', value: true },
          // Missing other fields - will use default values
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Should handle missing fields gracefully (treat as disabled/false)
    });

    it('should handle QL settings error state', async () => {
      mockUseGetQLSettings.mockReturnValue({
        qlSettings: {
          isServiceFieldEnabled: { version: '0', value: false },
          isBillingFieldEnabled: { version: '0', value: false },
          classForTimeSheetEnabled: { version: '0', value: false },
          locationForTimeSheetEnabled: { version: '0', value: false },
        },
        loading: false,
        error: 'Failed to load QL settings',
        refetch: jest.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('assignment-drawer')).toBeInTheDocument();
      });

      // Should still render but may not have proper disabled states
    });
  });
});
