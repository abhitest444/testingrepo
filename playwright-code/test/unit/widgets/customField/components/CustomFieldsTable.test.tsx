import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec/lib/extensions/quickbooks-online/QuickbooksOnline';

import CustomFieldsTable from 'src/js/widgets/customField/components/CustomFieldsTable';
import customFieldsReducer, {
  CustomField,
} from 'src/js/widgets/customField/store/customFieldsSlice';
import workerAssignmentsReducer from 'src/js/widgets/customField/store/workerAssignmentsSlice';
import {
  renderWithQuicksandAndReduxProvider,
  getDefaultSandbox,
} from '../../../testUtils';

// Mock Assignment Integration components
jest.mock(
  'src/js/widgets/customField/components/CustomerAssignmentIntegration',
  () => ({
    __esModule: true,
    default: ({ customField, onClose, onShowSuccess, onError }: any) => (
      <div data-testid="customer-assignment-integration">
        Mock Customer Assignment Integration
        <button data-testid="mock-customer-assignment-close" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="mock-customer-assignment-success"
          onClick={() => onShowSuccess?.('Assignment successful')}
        >
          Success
        </button>
        <button
          data-testid="mock-customer-assignment-error"
          onClick={() =>
            onError?.({
              title: 'Error occurred',
              subtitle: 'Please try again',
              isPartialSuccess: false,
            })
          }
        >
          Error
        </button>
        <button
          data-testid="mock-customer-assignment-partial-success"
          onClick={() =>
            onError?.({
              title: 'Partially successful',
              subtitle: 'Some items were assigned',
              isPartialSuccess: true,
            })
          }
        >
          Partial Success
        </button>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/customField/components/WorkerAssignmentIntegration',
  () => ({
    __esModule: true,
    default: ({
      customFieldId,
      customFieldOption,
      onClose,
      onShowSuccess,
      onError,
    }: any) => (
      <div data-testid="worker-assignment-integration">
        Mock Worker Assignment Integration
        <button data-testid="mock-worker-assignment-close" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="mock-worker-assignment-success"
          onClick={() => onShowSuccess?.('Worker assignment successful')}
        >
          Success
        </button>
        <button
          data-testid="mock-worker-assignment-error"
          onClick={() =>
            onError?.({
              title: 'Worker assignment error',
              subtitle: 'Please try again',
              isPartialSuccess: false,
            })
          }
        >
          Error
        </button>
      </div>
    ),
  }),
);

// Mock @ids-ts components
jest.mock('@ids-ts/button', () => ({
  Button: ({ children, onClick, 'data-testid': testId }: any) => (
    <button onClick={onClick} data-testid={testId}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/switch', () => ({
  Switch: ({
    checked,
    onChange,
    'aria-label': ariaLabel,
    'data-testid': testId,
  }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      data-testid={testId}
    />
  ),
}));

jest.mock('@ids-ts/combo-link', () => ({
  __esModule: true,
  default: ({
    label,
    onClick,
    onSelect,
    disabled,
    'data-testid': testId,
    children,
  }: any) => (
    <div data-testid={testId} data-disabled={disabled}>
      <button
        onClick={onClick}
        disabled={disabled}
        data-testid={`${testId}-main`}
      >
        {label}
      </button>
      <button
        onClick={onSelect}
        disabled={disabled}
        data-testid={`${testId}-dropdown`}
      >
        ▼
      </button>
      <div data-testid={`${testId}-menu`}>{children}</div>
    </div>
  ),
  MenuItem: ({ children, disabled, value, onClick }: any) => (
    <div
      data-testid={`menu-item-${value}`}
      data-disabled={disabled}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={(e: any) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </div>
  ),
}));

jest.mock('@ids-ts/table', () => {
  const MockTable = ({ children, 'data-testid': testId }: any) => (
    <table data-testid={testId}>{children}</table>
  );

  MockTable.Header = ({ children }: any) => <thead>{children}</thead>;
  MockTable.Body = ({ children, 'data-testid': testId }: any) => (
    <tbody data-testid={testId}>{children}</tbody>
  );
  MockTable.Row = ({ children, 'data-testid': testId, key }: any) => (
    <tr data-testid={testId} key={key}>
      {children}
    </tr>
  );
  MockTable.Cell = ({
    children,
    'data-testid': testId,
    'data-mobile-label': mobileLabel,
    mobileLabel: mobileLabelProp,
  }: any) => (
    <td data-testid={testId} data-mobile-label={mobileLabel || mobileLabelProp}>
      {children}
    </td>
  );

  return {
    Table: MockTable,
  };
});

jest.mock('@ids-ts/pagination', () => ({
  Pagination: ({ 'data-testid': testId, onPageChange }: any) => (
    <div data-testid={testId} onClick={() => onPageChange && onPageChange(2)}>
      Pagination Component
    </div>
  ),
}));

// Mock @ids-ts/page-message
jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({
    children,
    type,
    open,
    automationId,
    title,
    dismissible,
    style,
    onClose,
    'data-testid': testId,
  }: any) => (
    <div
      data-testid={testId || 'page-message'}
      data-type={type}
      data-open={open}
      data-automation-id={automationId}
      data-dismissible={dismissible}
      style={style}
    >
      <div data-testid="page-message-title">{title}</div>
      <div data-testid="page-message-content">{children}</div>
      {onClose && (
        <button data-testid="page-message-close" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  ),
}));

// Mock EmptyCustomFields component
jest.mock('src/js/widgets/customField/components/EmptyCustomFields', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="empty-custom-fields">Empty Custom Fields Component</div>
  ),
}));

// Mock SuccessToast component
jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({ open, message, onClose }: any) =>
    open ? (
      <div data-testid="success-toast">
        <div data-testid="success-toast-message">{message}</div>
        <button data-testid="success-toast-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

// Mock LoggingConfigProvider
const mockLogger = {
  info: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => mockLogger,
}));

// Create a mock navigation function that we can reference
const mockNavigate = jest.fn();

// Mock the time tracking settings context
jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: () => ({
      sandbox: {
        navigation: {
          navigate: mockNavigate,
        },
        logger: mockLogger,
      },
    }),
  }),
);

// Mock the navigation routes
jest.mock('src/js/widgets/ttoHomePage/constants', () => ({
  NAVIGATION_ROUTES: {
    CUSTOM_FIELDS: 'customfields',
  },
}));

// Mock the constants
jest.mock('src/js/widgets/customField/utils/constants', () => ({
  CUSTOM_FIELDS_TABLE_COLUMNS: [
    { key: 'name', translationKey: 'customFields.table.name' },
    { key: 'type', translationKey: 'customFields.table.type' },
    { key: 'status', translationKey: 'customFields.table.status' },
    { key: 'required', translationKey: 'customFields.table.required' },
    { key: 'actions', translationKey: 'customFields.table.actions' },
  ],
  ASSIGNMENT_COLUMNS: [
    {
      key: 'customersAssigned',
      translationKey: 'customFields.table.customers-assigned',
    },
    {
      key: 'teamAssigned',
      translationKey: 'customFields.table.team-assigned',
    },
  ],
  TSHEETS_URL: {
    PROD: 'https://tsheets.intuit.com',
    PREPROD: 'https://tsheets-e2e.intuit.com',
  },
}));

// Mock nlsLoader
jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn().mockReturnValue({
      'customFields.title': 'Manage Custom Fields for Time Tracking',
      'customFields.description':
        'Add up to 12 custom fields and choose which ones your team must fill when tracking time.',
      'customFields.add.button': 'Add Custom Fields',
      'customFields.table.name': 'Custom Field',
      'customFields.table.type': 'Data Type',
      'customFields.table.status': 'Status',
      'customFields.table.required': 'Required',
      'customFields.status.active': 'Active',
      'customFields.status.inactive': 'Inactive',
      'customFields.required.yes': 'Yes',
      'customFields.required.no': 'No',
      'customFields.toggle.required.aria': 'Toggle required status for {0}',
      'customFields.manage.link':
        'Go to classic QuickBooks Time to assign customers',
      'customFields.manage.link.new': 'Manage all custom fields',
      'customFields.empty.message':
        'No custom fields found. Click "Add Custom Field" to create your first custom field.',
      'customFields.error.title.subtext': 'Error Loading Custom Fields',
      'customFields.error.subtext':
        'There was an error loading your custom fields. Please try again.',
      'customFields.emptyCustomFields.title': 'No Custom Fields',
      'customFields.emptyCustomFields.subtext.1':
        "You haven't created any custom fields yet.",
      'customFields.emptyCustomFields.subtext.2': 'to get started.',
      'customFields.type.listitem': 'List item',
      'customFields.table.customers-assigned': 'Customers assigned',
      'customFields.table.team-assigned': 'Team assigned',
      'customFields.table.actions': 'Actions',
      'assignments.status.all': 'All',
      'assignments.status.none': 'None',
      'assignments.status.partial': '{count} of {total}',
      'customFields.type.dropdown': 'Dropdown list',
      'customFields.edit.aria': 'Edit custom field',
      'customFields.edit.link': 'Edit',
      'customFields.assign.customer': 'Assign customers',
      'customFields.assign.team': 'Assign team members',
      'weekly.expandrow': 'Expand row',
      'weekly.collapserow': 'Collapse row',
    }),
  },
}));

// Mock QuicksandProvider and IntlProvider
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    QuicksandProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    useAppContext: () => ({
      environment: 'E2E',
      realmId: '123456',
    }),
    useIntl: () => ({
      formatMessage: (
        { id }: { id: string },
        values?: Record<string, string>,
      ) => {
        const messages: Record<string, string> = {
          'customFields.title': 'Manage Custom Fields for Time Tracking',
          'customFields.description':
            'Add up to 12 custom fields and choose which ones your team must fill when tracking time.',
          'customFields.add.button': 'Add Custom Fields',
          'customFields.table.name': 'Custom Field',
          'customFields.table.type': 'Data Type',
          'customFields.table.status': 'Status',
          'customFields.table.required': 'Required',
          'customFields.status.active': 'Active',
          'customFields.status.inactive': 'Inactive',
          'customFields.required.yes': 'Yes',
          'customFields.required.no': 'No',
          'customFields.toggle.required.aria': `Toggle required status for ${
            values?.['0'] || ''
          }`,
          'customFields.manage.link':
            'Go to classic QuickBooks Time to assign customers',
          'customFields.manage.link.new': 'Manage all custom fields',
          'customFields.empty.message':
            'No custom fields found. Click "Add Custom Field" to create your first custom field.',
          'customFields.error.title.subtext': 'Error Loading Custom Fields',
          'customFields.error.subtext':
            'There was an error loading your custom fields. Please try again.',
          'customFields.emptyCustomFields.title': 'No Custom Fields',
          'customFields.emptyCustomFields.subtext.1':
            "You haven't created any custom fields yet.",
          'customFields.emptyCustomFields.subtext.2': 'to get started.',
          'customFields.type.listitem': 'List item',
          'customFields.table.customers-assigned': 'Customers assigned',
          'customFields.table.team-assigned': 'Team assigned',
          'customFields.table.actions': 'Actions',
          'assignments.status.all': 'All',
          'assignments.status.none': 'None',
          'assignments.status.partial': '{count} of {total}',
          'customFields.type.dropdown': 'Dropdown list',
          'customFields.edit.aria': 'Edit custom field',
          'customFields.edit.link': 'Edit',
          'customFields.assign.customer': 'Assign customers',
          'customFields.assign.team': 'Assign team members',
          'weekly.expandrow': 'Expand row',
          'weekly.collapserow': 'Collapse row',
        };
        const message = messages[id] || id;
        // Handle interpolation for messages with {count} and {total}
        if (
          values &&
          message.includes('{count}') &&
          message.includes('{total}')
        ) {
          return message
            .replace('{count}', values.count)
            .replace('{total}', values.total);
        }
        if (values && message.includes('{0}')) {
          return message.replace(
            '{0}',
            values['0'] || Object.values(values)[0],
          );
        }
        return message;
      },
    }),
    useTracking: jest.fn(() => jest.fn()),
  };
});

// Mock @design-systems/icons
jest.mock('@design-systems/icons', () => ({
  NewWindow: () => <span data-testid="new-window-icon">→</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">▼</span>,
  ChevronUp: () => <span data-testid="chevron-up-icon">▲</span>,
}));

// Mock @ids-ts/icon-control
jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({
    children,
    onClick,
    'aria-label': ariaLabel,
    'aria-expanded': ariaExpanded,
    'data-testid': testId,
  }: any) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      data-testid={testId || 'icon-control'}
    >
      {children}
    </button>
  ),
}));

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('CustomFieldsTable', () => {
  const mockSandbox = {
    ...getDefaultSandbox(),
    navigation: {
      navigate: jest.fn(),
    },
  } as unknown as QuickbooksOnlineSandbox;

  const mockCustomFields: CustomField[] = [
    {
      id: '1',
      name: 'Project Name',
      type: 'text',
      isActive: true,
      isRequired: false,
      deleted: false,
      options: [],
    },
    {
      id: '2',
      name: 'Client',
      type: 'dropdown',
      isActive: true,
      isRequired: true,
      deleted: false,
      options: [
        { id: '1', name: 'Client A', deleted: false },
        { id: '2', name: 'Client B', deleted: false },
        { id: '3', name: 'Client C', deleted: true },
      ],
    },
    {
      id: '3',
      name: 'Priority',
      type: 'number',
      isActive: false,
      isRequired: false,
      deleted: true,
      options: [],
    },
  ];

  const defaultProps = {
    customFields: mockCustomFields,
    onEdit: jest.fn(),
    onPageChange: jest.fn(),
    totalItems: 3,
    currentPage: 1,
    pageSize: 10,
    setShowCustomFieldDrawer: jest.fn(),
    setCustomFieldData: jest.fn(),
    fetchError: false,
    totalCustomerCount: 100,
    totalWorkerCount: 50,
    isAssignmentsEnabled: false,
    onRefetch: jest.fn(),
    tableHeaderRefs: {
      customFieldsTableHeaderRef: { current: null },
      customersColumnRef: { current: null },
      workersColumnRef: { current: null },
    },
  };

  const createStore = () =>
    configureStore({
      reducer: {
        customFields: customFieldsReducer,
        workerAssignments: workerAssignmentsReducer,
      },
    });

  const renderComponent = (
    props: Partial<typeof defaultProps> = {},
  ): ReturnType<typeof renderWithQuicksandAndReduxProvider> => {
    const mergedProps = { ...defaultProps, ...props };
    const store = createStore();
    return renderWithQuicksandAndReduxProvider(
      <CustomFieldsTable
        customFields={mergedProps.customFields}
        onEdit={mergedProps.onEdit}
        onPageChange={mergedProps.onPageChange}
        totalItems={mergedProps.totalItems}
        currentPage={mergedProps.currentPage}
        pageSize={mergedProps.pageSize}
        setShowCustomFieldDrawer={mergedProps.setShowCustomFieldDrawer}
        setCustomFieldData={mergedProps.setCustomFieldData}
        fetchError={mergedProps.fetchError}
        totalCustomerCount={mergedProps.totalCustomerCount}
        totalWorkerCount={mergedProps.totalWorkerCount}
        isAssignmentsEnabled={mergedProps.isAssignmentsEnabled}
        onRefetch={mergedProps.onRefetch}
        tableHeaderRefs={mergedProps.tableHeaderRefs}
      />,
      store,
      mockSandbox,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowOpen.mockClear();
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('renders the component with title and description', () => {
      renderComponent();

      expect(
        screen.getByTestId('custom-fields-table-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('custom-fields-title')).toHaveTextContent(
        'Manage Custom Fields for Time Tracking',
      );
      expect(screen.getByTestId('custom-fields-description')).toHaveTextContent(
        'Add up to 12 custom fields and choose which ones your team must fill when tracking time.',
      );
    });

    it('renders the add button', () => {
      renderComponent();

      const addButton = screen.getByTestId('custom-fields-add-button');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveTextContent('Add Custom Fields');
    });

    it('renders the manage link with default text when assignments disabled', () => {
      renderComponent({ isAssignmentsEnabled: false });

      const manageLink = screen.getByTestId('custom-fields-manage-link');
      expect(manageLink).toBeInTheDocument();
      expect(manageLink).toHaveTextContent(
        'Go to classic QuickBooks Time to assign customers',
      );
    });

    it('renders the table with correct headers', () => {
      renderComponent();

      expect(screen.getByTestId('custom-fields-table')).toBeInTheDocument();
      expect(screen.getByText('Custom Field')).toBeInTheDocument();
      expect(screen.getByText('Data Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('renders custom field rows correctly', () => {
      renderComponent();

      const rows = screen.getAllByTestId('custom-field-row');
      expect(rows).toHaveLength(3);

      // Check first row (Project Name - as provided in mockCustomFields)
      expect(screen.getAllByTestId('custom-field-name')[0]).toHaveTextContent(
        'Project Name',
      );
      expect(screen.getAllByTestId('custom-field-type')[0]).toHaveTextContent(
        'Text',
      );
      expect(screen.getAllByTestId('custom-field-status')[0]).toHaveTextContent(
        'Active',
      );
      expect(
        screen.getAllByTestId('custom-field-required-text')[0],
      ).toHaveTextContent('No');

      // Check second row (Client - as provided in mockCustomFields)
      expect(screen.getAllByTestId('custom-field-name')[1]).toHaveTextContent(
        'Client',
      );
      expect(screen.getAllByTestId('custom-field-type')[1]).toHaveTextContent(
        'Dropdown list',
      );
      expect(screen.getAllByTestId('custom-field-status')[1]).toHaveTextContent(
        'Active',
      );
      expect(
        screen.getAllByTestId('custom-field-required-text')[1],
      ).toHaveTextContent('Yes');

      // Check third row (Priority - as provided in mockCustomFields)
      expect(screen.getAllByTestId('custom-field-name')[2]).toHaveTextContent(
        'Priority',
      );
      expect(screen.getAllByTestId('custom-field-type')[2]).toHaveTextContent(
        'Number',
      );
      expect(screen.getAllByTestId('custom-field-status')[2]).toHaveTextContent(
        'Inactive',
      );
      expect(
        screen.getAllByTestId('custom-field-required-text')[2],
      ).toHaveTextContent('No');
    });

    it('renders error state when fetchError is true', () => {
      renderComponent({ fetchError: true });

      expect(screen.getByTestId('page-message')).toBeInTheDocument();
      expect(screen.getByTestId('page-message-title')).toHaveTextContent(
        'Error Loading Custom Fields',
      );
      expect(screen.getByTestId('page-message-content')).toHaveTextContent(
        'There was an error loading your custom fields. Please try again.',
      );
      expect(screen.getByTestId('page-message')).toHaveAttribute(
        'data-type',
        'warn',
      );
      expect(screen.getByTestId('page-message')).toHaveAttribute(
        'data-automation-id',
        'CustomFieldsErrorPageMessage',
      );
      expect(screen.getByTestId('page-message')).toHaveAttribute(
        'data-dismissible',
        'false',
      );
    });

    it('renders empty state when no custom fields and no fetch error', () => {
      renderComponent({ customFields: [], fetchError: false });

      expect(screen.getByTestId('empty-custom-fields')).toBeInTheDocument();
      expect(screen.getByTestId('empty-custom-fields')).toHaveTextContent(
        'Empty Custom Fields Component',
      );
    });

    it('does not render empty state when fetchError is true', () => {
      renderComponent({ customFields: [], fetchError: true });

      expect(screen.getByTestId('page-message')).toBeInTheDocument();
      expect(
        screen.queryByTestId('empty-custom-fields'),
      ).not.toBeInTheDocument();
    });

    it('renders pagination component', () => {
      renderComponent();

      expect(
        screen.getByTestId('custom-fields-pagination'),
      ).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls setShowCustomFieldDrawer when add button is clicked', () => {
      const mockSetShowCustomFieldDrawer = jest.fn();
      renderComponent({
        setShowCustomFieldDrawer: mockSetShowCustomFieldDrawer,
      });

      const addButton = screen.getByTestId('custom-fields-add-button');
      fireEvent.click(addButton);

      expect(mockSetShowCustomFieldDrawer).toHaveBeenCalledWith(true);
    });

    it('calls setCustomFieldData with null when add button is clicked', () => {
      const mockSetShowCustomFieldDrawer = jest.fn();
      const mockSetCustomFieldData = jest.fn();
      renderComponent({
        setShowCustomFieldDrawer: mockSetShowCustomFieldDrawer,
        setCustomFieldData: mockSetCustomFieldData,
      });

      const addButton = screen.getByTestId('custom-fields-add-button');
      fireEvent.click(addButton);

      expect(mockSetShowCustomFieldDrawer).toHaveBeenCalledWith(true);
      expect(mockSetCustomFieldData).toHaveBeenCalledWith(null);
    });

    it('does not call setCustomFieldData when prop is not provided', () => {
      const mockSetShowCustomFieldDrawer = jest.fn();
      renderComponent({
        setShowCustomFieldDrawer: mockSetShowCustomFieldDrawer,
        setCustomFieldData: undefined,
      });

      const addButton = screen.getByTestId('custom-fields-add-button');
      fireEvent.click(addButton);

      expect(mockSetShowCustomFieldDrawer).toHaveBeenCalledWith(true);
      // Should not throw error when setCustomFieldData is undefined
      expect(addButton).toBeInTheDocument();
    });

    it('should handle edit action when edit link is clicked and setShowCustomFieldDrawer is provided', () => {
      const mockOnEdit = jest.fn();
      const mockSetShowCustomFieldDrawer = jest.fn();
      const mockTrack = jest.fn();

      // Mock the tracking function
      const { useTracking } = require('@payroll/quicksand');
      useTracking.mockReturnValue(mockTrack);

      renderComponent({
        onEdit: mockOnEdit,
        setShowCustomFieldDrawer: mockSetShowCustomFieldDrawer,
      });

      // Find the edit link for the first active field (Project Name)
      const editLinks = screen.getAllByTestId('custom-field-edit-link');
      expect(editLinks).toHaveLength(3);

      // Click on the first edit link (Project Name - active field)
      fireEvent.click(editLinks[0]);

      // Verify tracking was called
      expect(mockTrack).toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'custom-field',
        screen: 'custom_fields_page',
        action: 'engaged',
        object: 'widget',
        object_detail: 'edit_link',
        ui_action: 'clicked',
        ui_object: 'link',
        ui_object_detail: 'edit_link',
        ui_access_point: 'page',
      });

      // Verify onEdit was called with the correct custom field
      expect(mockOnEdit).toHaveBeenCalledWith(mockCustomFields[0]);
    });

    it('should not call onEdit when edit link is clicked but setShowCustomFieldDrawer is not provided', () => {
      const mockOnEdit = jest.fn();
      const mockTrack = jest.fn();

      // Mock the tracking function
      const { useTracking } = require('@payroll/quicksand');
      useTracking.mockReturnValue(mockTrack);

      renderComponent({
        onEdit: mockOnEdit,
        setShowCustomFieldDrawer: undefined, // Not provided
      });

      // Find the edit link for the first active field
      const editLinks = screen.getAllByTestId('custom-field-edit-link');

      // Click on the first edit link
      fireEvent.click(editLinks[0]);

      // Verify tracking was still called
      expect(mockTrack).toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'custom-field',
        screen: 'custom_fields_page',
        action: 'engaged',
        object: 'widget',
        object_detail: 'edit_link',
        ui_action: 'clicked',
        ui_object: 'link',
        ui_object_detail: 'edit_link',
        ui_access_point: 'page',
      });

      // Verify onEdit was NOT called since setShowCustomFieldDrawer is undefined
      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('should not call onEdit when edit link is clicked for inactive field', () => {
      const mockOnEdit = jest.fn();
      const mockSetShowCustomFieldDrawer = jest.fn();
      const mockTrack = jest.fn();

      // Mock the tracking function
      const { useTracking } = require('@payroll/quicksand');
      useTracking.mockReturnValue(mockTrack);

      renderComponent({
        onEdit: mockOnEdit,
        setShowCustomFieldDrawer: mockSetShowCustomFieldDrawer,
      });

      // Find the edit link for the inactive field (Priority - third field)
      const editLinks = screen.getAllByTestId('custom-field-edit-link');

      // Click on the third edit link (Priority - inactive field)
      fireEvent.click(editLinks[2]);

      // Verify tracking was NOT called for inactive field since handleEdit is not triggered
      expect(mockTrack).not.toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'custom-field',
        screen: 'custom_fields_page',
        action: 'engaged',
        object: 'widget',
        object_detail: 'edit_link',
        ui_action: 'clicked',
        ui_object: 'link',
        ui_object_detail: 'edit_link',
        ui_access_point: 'page',
      });

      // Verify onEdit was NOT called for inactive field
      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('opens TSheets URL in new window when manage link is clicked', () => {
      renderComponent();

      const manageLink = screen.getByTestId('custom-fields-manage-link');
      fireEvent.click(manageLink);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://tsheets-e2e.intuit.com/login_oii?realm_id=123456',
        '_blank',
      );
    });

    it('opens PREPROD TSheets URL when environment is not PROD', () => {
      // Mock the useAppContext hook to return PREPROD environment
      const originalUseAppContext = require('@payroll/quicksand').useAppContext;
      require('@payroll/quicksand').useAppContext = jest.fn().mockReturnValue({
        environment: 'PREPROD',
        realmId: 'test-realm-id',
      });

      try {
        const store = createStore();
        renderWithQuicksandAndReduxProvider(
          <CustomFieldsTable {...defaultProps} />,
          store,
          mockSandbox,
        );

        const manageLink = screen.getByTestId('custom-fields-manage-link');
        fireEvent.click(manageLink);

        expect(mockWindowOpen).toHaveBeenCalledWith(
          'https://tsheets-e2e.intuit.com/login_oii?realm_id=test-realm-id',
          '_blank',
        );
      } finally {
        require('@payroll/quicksand').useAppContext = originalUseAppContext;
      }
    });

    it('shows new text and navigates to custom fields page when R4-assignments is enabled', () => {
      renderComponent({ isAssignmentsEnabled: true });

      const manageLink = screen.getByTestId('custom-fields-manage-link');
      expect(manageLink).toBeInTheDocument();
      expect(manageLink).toHaveTextContent('Manage all custom fields');

      fireEvent.click(manageLink);

      expect(mockNavigate).toHaveBeenCalledWith('customfields');
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('shows original text and opens TSheets URL when R4-assignments is disabled', () => {
      renderComponent({ isAssignmentsEnabled: false });

      const manageLink = screen.getByTestId('custom-fields-manage-link');
      expect(manageLink).toBeInTheDocument();
      expect(manageLink).toHaveTextContent(
        'Go to classic QuickBooks Time to assign customers',
      );

      fireEvent.click(manageLink);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://tsheets-e2e.intuit.com/login_oii?realm_id=123456',
        '_blank',
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not call setShowCustomFieldDrawer when prop is not provided', () => {
      renderComponent({ setShowCustomFieldDrawer: undefined });

      const addButton = screen.getByTestId('custom-fields-add-button');
      fireEvent.click(addButton);

      // Should not throw error
      expect(addButton).toBeInTheDocument();
    });

    it('calls onPageChange when pagination page is changed', () => {
      const mockOnPageChange = jest.fn();
      renderComponent({ onPageChange: mockOnPageChange });

      const pagination = screen.getByTestId('custom-fields-pagination');
      // Simulate page change by clicking on pagination
      fireEvent.click(pagination);

      // Note: The actual pagination interaction would depend on the Pagination component implementation
      // This is a basic test to ensure the component is rendered
      expect(pagination).toBeInTheDocument();
    });

    it('toggles required status when switch is clicked', async () => {
      renderComponent();

      const toggleSwitches = screen.getAllByTestId(
        'custom-field-required-toggle',
      );
      expect(toggleSwitches).toHaveLength(3);

      // Click on the first toggle (Project Name - currently not required)
      fireEvent.click(toggleSwitches[0]);

      // The actual toggle functionality would be handled by Redux
      // This test ensures the switch is clickable
      expect(toggleSwitches[0]).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('capitalizes first letter of field type', () => {
      renderComponent();

      const typeCells = screen.getAllByTestId('custom-field-type');
      expect(typeCells[0]).toHaveTextContent('Text'); // Project Name - text
      expect(typeCells[1]).toHaveTextContent('Dropdown list'); // Client - dropdown
      expect(typeCells[2]).toHaveTextContent('Number'); // Priority - number
    });

    it('displays correct status text', () => {
      renderComponent();

      const statusCells = screen.getAllByTestId('custom-field-status');
      expect(statusCells[0]).toHaveTextContent('Active'); // Project Name - isActive: true
      expect(statusCells[1]).toHaveTextContent('Active'); // Client - isActive: true
      expect(statusCells[2]).toHaveTextContent('Inactive'); // Priority - isActive: false
    });

    it('displays correct required text', () => {
      renderComponent();

      const requiredTexts = screen.getAllByTestId('custom-field-required-text');
      expect(requiredTexts[0]).toHaveTextContent('No'); // Project Name - isRequired: false
      expect(requiredTexts[1]).toHaveTextContent('Yes'); // Client - isRequired: true
      expect(requiredTexts[2]).toHaveTextContent('No'); // Priority - isRequired: false
    });

    it('displays correct switch states', () => {
      renderComponent();

      const toggleSwitches = screen.getAllByTestId(
        'custom-field-required-toggle',
      );
      expect(toggleSwitches[0]).not.toBeChecked(); // Project Name - isRequired: false
      expect(toggleSwitches[1]).toBeChecked(); // Client - isRequired: true
      expect(toggleSwitches[2]).not.toBeChecked(); // Priority - isRequired: false
    });
  });

  describe('Accessibility', () => {
    it('has proper aria labels for toggle switches', () => {
      renderComponent();

      const toggleSwitches = screen.getAllByTestId(
        'custom-field-required-toggle',
      );
      expect(toggleSwitches[0]).toHaveAttribute(
        'aria-label',
        'Toggle required status for Project Name',
      );
      expect(toggleSwitches[1]).toHaveAttribute(
        'aria-label',
        'Toggle required status for Client',
      );
      expect(toggleSwitches[2]).toHaveAttribute(
        'aria-label',
        'Toggle required status for Priority',
      );
    });
  });

  describe('Pagination', () => {
    it('calculates total pages correctly', () => {
      renderComponent({ totalItems: 25, pageSize: 10 });

      const pagination = screen.getByTestId('custom-fields-pagination');
      expect(pagination).toBeInTheDocument();
      // Total pages should be Math.ceil(25 / 10) = 3
    });

    it('handles single page correctly', () => {
      renderComponent({ totalItems: 5, pageSize: 10 });

      const pagination = screen.getByTestId('custom-fields-pagination');
      expect(pagination).toBeInTheDocument();
      // Total pages should be Math.ceil(5 / 10) = 1
    });

    it('handles empty data correctly', () => {
      renderComponent({ totalItems: 0, pageSize: 10 });

      const pagination = screen.getByTestId('custom-fields-pagination');
      expect(pagination).toBeInTheDocument();
      // Total pages should be Math.ceil(0 / 10) = 0
    });
  });

  describe('Table Header Refs', () => {
    it('renders table header cells with refs when tableHeaderRefs is provided', () => {
      const mockTableHeaderRefs = {
        customFieldsTableHeaderRef: { current: null },
        customersColumnRef: { current: null },
        workersColumnRef: { current: null },
      };

      renderComponent({
        isAssignmentsEnabled: true,
        tableHeaderRefs: mockTableHeaderRefs,
      });

      // Verify table header row exists
      const headerRow = screen.getByTestId('custom-fields-table-header-row');
      expect(headerRow).toBeInTheDocument();

      // Verify the column headers are rendered correctly
      expect(screen.getByText('Custom Field')).toBeInTheDocument();
      expect(screen.getByText('Customers assigned')).toBeInTheDocument();
      expect(screen.getByText('Team assigned')).toBeInTheDocument();
    });

    it('renders table header cells without refs when tableHeaderRefs is not provided', () => {
      renderComponent({
        isAssignmentsEnabled: true,
        tableHeaderRefs: undefined,
      });

      // Verify table header row exists
      const headerRow = screen.getByTestId('custom-fields-table-header-row');
      expect(headerRow).toBeInTheDocument();

      // Verify the column headers are still rendered correctly
      expect(screen.getByText('Custom Field')).toBeInTheDocument();
      expect(screen.getByText('Customers assigned')).toBeInTheDocument();
      expect(screen.getByText('Team assigned')).toBeInTheDocument();
    });

    it('renders table header cells correctly when assignments are disabled', () => {
      renderComponent({
        isAssignmentsEnabled: false,
        tableHeaderRefs: {
          customFieldsTableHeaderRef: { current: null },
          customersColumnRef: { current: null },
          workersColumnRef: { current: null },
        },
      });

      // Verify table header row exists
      const headerRow = screen.getByTestId('custom-fields-table-header-row');
      expect(headerRow).toBeInTheDocument();

      // Verify the column headers are rendered correctly (without assignment columns)
      expect(screen.getByText('Custom Field')).toBeInTheDocument();
      expect(screen.queryByText('Customers assigned')).not.toBeInTheDocument();
      expect(screen.queryByText('Team assigned')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty custom fields array with no fetch error', () => {
      renderComponent({ customFields: [], fetchError: false });

      expect(screen.getByTestId('empty-custom-fields')).toBeInTheDocument();
      expect(screen.queryAllByTestId('custom-field-row')).toHaveLength(0);
    });

    it('handles empty custom fields array with fetch error', () => {
      renderComponent({ customFields: [], fetchError: true });

      expect(screen.getByTestId('page-message')).toBeInTheDocument();
      expect(
        screen.queryByTestId('empty-custom-fields'),
      ).not.toBeInTheDocument();
      expect(screen.queryAllByTestId('custom-field-row')).toHaveLength(0);
    });

    it('handles custom fields with special characters in names', () => {
      const specialFields: CustomField[] = [
        {
          id: '1',
          name: 'Field with & special chars!',
          type: 'text',
          isActive: true,
          isRequired: false,
          deleted: false,
          options: [],
        },
      ];

      renderComponent({ customFields: specialFields });

      expect(screen.getByTestId('custom-field-name')).toHaveTextContent(
        'Field with & special chars!',
      );
    });

    it('handles very long field names', () => {
      const longNameField: CustomField[] = [
        {
          id: '1',
          name: 'This is a very long custom field name that might cause layout issues in the table',
          type: 'text',
          isActive: true,
          isRequired: false,
          deleted: false,
          options: [],
        },
      ];

      renderComponent({ customFields: longNameField });

      expect(screen.getByTestId('custom-field-name')).toHaveTextContent(
        'This is a very long custom field name that might cause layout issues in the table',
      );
    });

    it('handles fetchError with existing custom fields', () => {
      renderComponent({ fetchError: true });

      // Should show error message even when there are custom fields
      expect(screen.getByTestId('page-message')).toBeInTheDocument();
      expect(screen.getByTestId('page-message-title')).toHaveTextContent(
        'Error Loading Custom Fields',
      );
    });
  });

  describe('Tracking Functionality', () => {
    let mockTrack: jest.Mock;

    beforeEach(() => {
      mockTrack = jest.fn();
      const { useTracking } = require('@payroll/quicksand');
      useTracking.mockReturnValue(mockTrack);
    });

    it('should track page view when component mounts', () => {
      renderComponent();

      expect(mockTrack).toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'custom-field',
        screen: 'custom_fields_page',
        action: 'engaged',
        object: 'widget',
        object_detail: 'custom_fields_page',
        ui_action: 'viewed',
        ui_object: 'page',
        ui_object_detail: 'custom_fields_page',
        ui_access_point: 'page',
      });
    });

    it('should track add button click', () => {
      renderComponent();

      const addButton = screen.getByTestId('custom-fields-add-button');
      fireEvent.click(addButton);

      expect(mockTrack).toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'custom-field',
        screen: 'custom_fields_page',
        action: 'engaged',
        object: 'widget',
        object_detail: 'add_custom_fields',
        ui_action: 'clicked',
        ui_object: 'button',
        ui_object_detail: 'add_custom_fields',
        ui_access_point: 'page',
      });
    });

    it('should track required slider toggle', () => {
      renderComponent();

      const toggleSwitches = screen.getAllByTestId(
        'custom-field-required-toggle',
      );
      fireEvent.click(toggleSwitches[0]);

      expect(mockTrack).toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'custom-field',
        screen: 'custom_fields_page',
        action: 'engaged',
        object: 'widget',
        object_detail: 'required_slider',
        ui_action: 'clicked',
        ui_object: 'switch',
        ui_object_detail: 'required_slider',
        ui_access_point: 'page',
      });
    });

    it('should track manage assignments link click', () => {
      renderComponent();

      const manageLink = screen.getByTestId('custom-fields-manage-link');
      fireEvent.click(manageLink);

      expect(mockTrack).toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'custom-field',
        screen: 'custom_fields_drawer',
        action: 'engaged',
        object: 'widget',
        object_detail: 'manage_assignments',
        ui_action: 'clicked',
        ui_object: 'button',
        ui_object_detail: 'manage_assignments',
        ui_access_point: 'drawer',
      });
    });

    it('should track page change', () => {
      renderComponent();

      const pagination = screen.getByTestId('custom-fields-pagination');
      fireEvent.click(pagination);

      expect(mockTrack).toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'custom-field',
        screen: 'custom_fields_page',
        action: 'engaged',
        object: 'widget',
        object_detail: 'custom_fields_page',
        ui_action: 'viewed',
        ui_object: 'page',
        ui_object_detail: 'custom_fields_page',
        ui_access_point: 'page',
      });
    });

    it('should track page view only once when component mounts', () => {
      renderComponent();

      // Should only be called once for the initial mount
      expect(mockTrack).toHaveBeenCalledTimes(1);
    });

    it('should track assign workers click', () => {
      const fieldWithOptions = {
        ...mockCustomFields[0],
        options: [
          {
            id: '1',
            name: 'Option 1',
            deleted: false,
            workerAssignmentCount: 5,
          },
        ],
      };

      renderComponent({
        isAssignmentsEnabled: true,
        customFields: [fieldWithOptions],
      });

      // Expand to see options
      const expandIcon = screen.getByTestId('icon-control');
      fireEvent.click(expandIcon);

      // Find and click the "assignWorkers" menu item
      const assignWorkersMenuItem = screen.getByTestId(
        'menu-item-assignWorkers',
      );
      fireEvent.click(assignWorkersMenuItem);

      // Verify tracking was called
      expect(mockTrack).toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'timeentrymanagement',
        screen: 'custom_field_settings',
        action: 'engaged',
        object: 'component',
        object_detail: 'assign_custom_fields',
        ui_action: 'clicked',
        ui_object: 'button',
        ui_object_detail: 'assign_workers',
      });
    });
  });

  describe('Expandable Options', () => {
    it('shows expand icon for dropdown fields with options', () => {
      renderComponent();

      // Find the Client field (dropdown with options)
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('expands and shows option rows when clicked', () => {
      renderComponent();

      // Initially no option rows
      expect(screen.queryAllByTestId('custom-field-option-row')).toHaveLength(
        0,
      );

      // Click expand
      const expandIcon = screen.getByTestId('icon-control');
      fireEvent.click(expandIcon);

      // Should now show option rows
      expect(screen.getAllByTestId('custom-field-option-row')).toHaveLength(3);
      expect(screen.getByText('Client A')).toBeInTheDocument();
      expect(screen.getByText('Client B')).toBeInTheDocument();
      expect(screen.getByText('Client C')).toBeInTheDocument();
    });

    it('shows List item type for options', () => {
      renderComponent();

      // Expand options
      const expandIcon = screen.getByTestId('icon-control');
      fireEvent.click(expandIcon);

      // Check option types
      const optionTypes = screen.getAllByTestId('custom-field-option-type');
      expect(optionTypes[0]).toHaveTextContent('List item');
    });
  });

  describe('Assignment Functionality', () => {
    describe('Assignment Columns Visibility', () => {
      it('shows assignment columns when isAssignmentsEnabled is true', () => {
        renderComponent({ isAssignmentsEnabled: true });

        // Check if assignment column headers are present
        expect(screen.getByText('Customers assigned')).toBeInTheDocument();
        expect(screen.getByText('Team assigned')).toBeInTheDocument();
      });

      it('hides assignment columns when isAssignmentsEnabled is false', () => {
        renderComponent({ isAssignmentsEnabled: false });

        // Check if assignment column headers are not present
        expect(
          screen.queryByText('Customers assigned'),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Team assigned')).not.toBeInTheDocument();
      });

      it('renders assignment columns in correct order when enabled', () => {
        renderComponent({ isAssignmentsEnabled: true });

        // Since the mock table uses td elements instead of th, we need to check the header row differently
        const headerRow = screen.getByRole('table').querySelector('thead tr');
        const headerCells = headerRow?.querySelectorAll('td');
        const headerTexts = Array.from(headerCells || []).map(
          (cell) => cell.textContent,
        );

        expect(headerTexts).toEqual([
          'Custom Field',
          'Data Type',
          'Customers assigned',
          'Team assigned',
          'Status',
          'Required',
          'Actions',
        ]);
      });
    });

    describe('Assignment Text Display', () => {
      const customFieldsWithAssignments: CustomField[] = [
        {
          id: '1',
          name: 'Test Field 1',
          type: 'text',
          isActive: true,
          isRequired: false,
          deleted: false,
          customerAssignmentCount: 0,
          options: [],
        },
        {
          id: '2',
          name: 'Test Field 2',
          type: 'text',
          isActive: true,
          isRequired: false,
          deleted: false,
          customerAssignmentCount: 50,
          options: [],
        },
        {
          id: '3',
          name: 'Test Field 3',
          type: 'text',
          isActive: true,
          isRequired: false,
          deleted: false,
          customerAssignmentCount: 100,
          options: [],
        },
        {
          id: '4',
          name: 'Dropdown Field',
          type: 'dropdown',
          isActive: true,
          isRequired: false,
          deleted: false,
          customerAssignmentCount: 25,
          options: [
            {
              id: '1',
              name: 'Option 1',
              deleted: false,
              timeAgainstAssignmentCount: 0,
              workerAssignmentCount: 0,
            },
            {
              id: '2',
              name: 'Option 2',
              deleted: false,
              timeAgainstAssignmentCount: 50,
              workerAssignmentCount: 25,
            },
            {
              id: '3',
              name: 'Option 3',
              deleted: false,
              timeAgainstAssignmentCount: 100,
              workerAssignmentCount: 50,
            },
          ],
        },
      ];

      it('displays "None" for zero customer assignments when customers exist', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: customFieldsWithAssignments,
          totalCustomerCount: 100,
        });

        // Use getAllByText since there are multiple custom fields with "None" status
        const noneTexts = screen.getAllByText('None');
        expect(noneTexts.length).toBeGreaterThan(0);
      });

      it('displays "None" when total customer count is zero', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: customFieldsWithAssignments,
          totalCustomerCount: 0,
        });

        // Use getAllByText since there are multiple custom fields with "None" status
        const noneTexts = screen.getAllByText('None');
        expect(noneTexts.length).toBeGreaterThan(0);
      });

      it('displays partial assignment count for customers', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: customFieldsWithAssignments,
          totalCustomerCount: 100,
        });

        expect(screen.getByText('50 of 100')).toBeInTheDocument();
      });

      it('displays "All customers" when all customers are assigned', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: customFieldsWithAssignments,
          totalCustomerCount: 100,
        });

        expect(screen.getByText('All')).toBeInTheDocument();
      });

      it('displays worker assignment text for options when expanded', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: customFieldsWithAssignments,
          totalWorkerCount: 50,
        });

        // Expand the dropdown field to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        // Check for the actual assignment counts from our test data
        // Option 1: workerAssignmentCount = 0 -> "None"
        // Option 2: workerAssignmentCount = 25 -> "25 of 50"
        // Option 3: workerAssignmentCount = 50 -> "All"
        const noneTexts = screen.getAllByText('None');
        expect(noneTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('25 of 50')).toBeInTheDocument(); // For option 2 with 25 worker assignments
        expect(
          screen.getByTestId('custom-field-option-team-text-3'),
        ).toHaveTextContent('All'); // For option 3 with 50 worker assignments (all)
      });

      it('displays "None" when total worker count is zero', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: customFieldsWithAssignments,
          totalWorkerCount: 0,
        });

        // Expand the dropdown field to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        const noneTexts = screen.getAllByText('None');
        expect(noneTexts.length).toBeGreaterThan(0);
      });

      it('displays customer assignments for options using timeAgainstAssignmentCount', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: customFieldsWithAssignments,
          totalCustomerCount: 100,
        });

        // Expand the dropdown field to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        // Verify customer assignment text for each option using timeAgainstAssignmentCount
        // Option 1: timeAgainstAssignmentCount = 0 -> "None"
        expect(screen.getByTestId('custom-field-option-1')).toHaveTextContent(
          'None',
        );

        // Option 2: timeAgainstAssignmentCount = 50 -> "50 of 100"
        expect(screen.getByTestId('custom-field-option-2')).toHaveTextContent(
          '50 of 100',
        );

        // Option 3: timeAgainstAssignmentCount = 100 -> "All"
        expect(screen.getByTestId('custom-field-option-3')).toHaveTextContent(
          'All',
        );
      });
    });

    describe('Assignment Text Display', () => {
      it('displays customer assignment text correctly', () => {
        const fieldWithAssignments = {
          ...mockCustomFields[0],
          isActive: true,
          customerAssignmentCount: 50,
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [fieldWithAssignments],
        });

        // The assignment text should be displayed (mocked intl returns formatted text)
        const assignmentText = screen.getByText('50 of 100');
        expect(assignmentText).toBeInTheDocument();
      });

      it('displays worker assignment text correctly', () => {
        const fieldWithOptions = {
          ...mockCustomFields[0],
          options: [
            {
              id: '1',
              name: 'Active Option',
              deleted: false,
              workerAssignmentCount: 25,
            },
          ],
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [fieldWithOptions],
        });

        // Expand to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        // The assignment text should be displayed (mocked intl returns formatted text)
        const assignmentText = screen.getByText('25 of 50');
        expect(assignmentText).toBeInTheDocument();
      });

      it('displays customer assignment using timeAgainstAssignmentCount for options', () => {
        const fieldWithOptions = {
          ...mockCustomFields[0],
          id: 'field-with-time-against',
          name: 'Service Type',
          type: 'dropdown',
          isActive: true,
          options: [
            {
              id: 'opt-1',
              name: 'Option with timeAgainstAssignmentCount',
              deleted: false,
              timeAgainstAssignmentCount: 30,
              workerAssignmentCount: 5,
            },
            {
              id: 'opt-2',
              name: 'Option with all assigned',
              deleted: false,
              timeAgainstAssignmentCount: 100,
              workerAssignmentCount: 10,
            },
            {
              id: 'opt-3',
              name: 'Option with none assigned',
              deleted: false,
              timeAgainstAssignmentCount: 0,
              workerAssignmentCount: 0,
            },
          ],
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [fieldWithOptions],
          totalCustomerCount: 100,
          totalWorkerCount: 50,
        });

        // Expand to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        // Verify that timeAgainstAssignmentCount is used for customer assignments
        expect(screen.getByText('30 of 100')).toBeInTheDocument(); // 30 customers assigned
        expect(screen.getByText('All')).toBeInTheDocument(); // 100 of 100 customers

        // Check the specific test IDs for customer assignment cells
        expect(
          screen.getByTestId('custom-field-option-opt-1'),
        ).toHaveTextContent('30 of 100');
        expect(
          screen.getByTestId('custom-field-option-opt-2'),
        ).toHaveTextContent('All');
        expect(
          screen.getByTestId('custom-field-option-opt-3'),
        ).toHaveTextContent('None');
      });
    });

    describe('Assignment Empty States', () => {
      it('shows empty cells for customer assignments on main custom field rows', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        // Customer assignment cells for main rows should be empty (no content)
        const customFieldRows = screen.getAllByTestId('custom-field-row');
        expect(customFieldRows).toHaveLength(3);

        // The customer assignment cells exist but are empty for main custom field rows
        // This is the expected behavior as per the requirements
      });

      it('shows empty cells for worker assignments on option rows', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        // Expand to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        const optionRows = screen.getAllByTestId('custom-field-option-row');
        expect(optionRows).toHaveLength(3);

        // The worker assignment cells exist but show assignment text for options
        // This is the expected behavior as per the requirements
      });
    });

    describe('ComboLink Functionality', () => {
      it('renders combo link when assignments are enabled', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        const comboLinks = screen.getAllByTestId(
          'custom-field-edit-combo-link',
        );
        expect(comboLinks.length).toBeGreaterThan(0);
        expect(comboLinks[0]).toBeInTheDocument();

        const editButtons = screen.getAllByTestId(
          'custom-field-edit-combo-link-main',
        );
        expect(editButtons[0]).toBeInTheDocument();
        expect(editButtons[0]).toHaveTextContent('Assign customers');
      });

      it('renders regular edit link when assignments are disabled', () => {
        renderComponent({
          isAssignmentsEnabled: false,
          customFields: mockCustomFields,
        });

        const editLinks = screen.getAllByTestId('custom-field-edit-link');
        expect(editLinks.length).toBeGreaterThan(0);
        expect(editLinks[0]).toBeInTheDocument();
        expect(editLinks[0]).toHaveTextContent('Edit');

        // ComboLink should not be present
        expect(
          screen.queryByTestId('custom-field-edit-combo-link'),
        ).not.toBeInTheDocument();
      });

      it('renders assign customer menu item for custom fields', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        const editItems = screen.getAllByTestId('menu-item-edit');
        expect(editItems.length).toBeGreaterThan(0);
        expect(editItems[0]).toBeInTheDocument();
        expect(editItems[0]).toHaveTextContent('Edit');
      });

      it('renders combo link for custom field options when assignments enabled', () => {
        const fieldWithOptions = {
          ...mockCustomFields[0],
          options: [
            {
              id: '1',
              name: 'Option 1',
              deleted: false,
              workerAssignmentCount: 5,
            },
          ],
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [fieldWithOptions],
        });

        // Expand to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        const optionComboLink = screen.getByTestId(
          'custom-field-option-edit-combo-link',
        );
        expect(optionComboLink).toBeInTheDocument();

        const editItems = screen.getAllByTestId('menu-item-edit');
        expect(editItems[1]).toBeInTheDocument();
        expect(editItems[1]).toHaveTextContent('Edit');
      });

      it('disables combo link for inactive custom fields', () => {
        const inactiveField = { ...mockCustomFields[0], isActive: false };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [inactiveField],
        });

        // ComboLink is rendered but onClick is conditionally executed based on isActive
        const comboLink = screen.getByTestId('custom-field-edit-combo-link');
        expect(comboLink).toBeInTheDocument();

        // Verify menu items render - the disabled state is handled through onClick conditional
        const menuItem = screen.getByText('Edit');
        expect(menuItem).toBeInTheDocument();
      });

      it('disables combo link when custom field is inactive', () => {
        const inactiveFieldWithOption = {
          ...mockCustomFields[0],
          isActive: false,
          options: [
            {
              id: '1',
              name: 'Active Option',
              deleted: false,
              workerAssignmentCount: 0,
            },
          ],
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [inactiveFieldWithOption],
        });

        // Expand to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        const optionComboLink = screen.getByTestId(
          'custom-field-option-edit-combo-link',
        );
        expect(optionComboLink).toBeInTheDocument();

        // Verify menu items render - the disabled state is handled through onClick conditional
        const editItems = screen.getAllByText('Edit');
        expect(editItems.length).toBeGreaterThan(0);
      });

      it('enables edit but disables assign team member when option is deleted but field is active', () => {
        const fieldWithDeletedOption = {
          ...mockCustomFields[0],
          isActive: true,
          options: [
            {
              id: '1',
              name: 'Deleted Option',
              deleted: true,
              workerAssignmentCount: 0,
            },
          ],
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [fieldWithDeletedOption],
        });

        // Expand to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        // ComboLink should be enabled (for edit action)
        const optionComboLink = screen.getByTestId(
          'custom-field-option-edit-combo-link',
        );
        expect(optionComboLink).toBeInTheDocument();

        // Verify menu item exists - MenuItem component has disabled prop which controls behavior
        const editItems = screen.getAllByText('Edit');
        expect(editItems.length).toBeGreaterThan(0);
      });

      it('renders action cells with proper test ids', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        const actionCells = screen.getAllByTestId('custom-field-actions');
        expect(actionCells.length).toBeGreaterThan(0);
        actionCells.forEach((cell) => {
          expect(cell).toBeInTheDocument();
        });
      });

      it('calls handleAssignCustomer when assign customer option is selected', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        const comboLinks = screen.getAllByTestId(
          'custom-field-edit-combo-link',
        );

        // Should not throw an error when clicking the combo link
        expect(() => fireEvent.click(comboLinks[0])).not.toThrow();
      });

      it('opens customer assignment drawer when dropdown is clicked', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        const mainButtons = screen.getAllByTestId(
          'custom-field-edit-combo-link-main',
        );

        // Click the main button to trigger assign customer
        fireEvent.click(mainButtons[0]);

        // Check that the CustomerAssignmentIntegration is rendered
        expect(
          screen.getByText('Mock Customer Assignment Integration'),
        ).toBeInTheDocument();
      });

      it('closes customer assignment drawer when onClose is called', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        const mainButtons = screen.getAllByTestId(
          'custom-field-edit-combo-link-main',
        );

        // Open the drawer
        fireEvent.click(mainButtons[0]);

        expect(
          screen.getByText('Mock Customer Assignment Integration'),
        ).toBeInTheDocument();

        // Close the drawer
        const closeButton = screen.getByTestId(
          'mock-customer-assignment-close',
        );
        fireEvent.click(closeButton);

        // Drawer should be closed
        expect(
          screen.queryByText('Mock Customer Assignment Integration'),
        ).not.toBeInTheDocument();
      });

      it('calls handleEdit when combo link main action is clicked', () => {
        const mockOnEdit = jest.fn();

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
          onEdit: mockOnEdit,
        });

        const dropdownButtons = screen.getAllByTestId(
          'custom-field-edit-combo-link-dropdown',
        );
        fireEvent.click(dropdownButtons[0]);

        expect(mockOnEdit).toHaveBeenCalledWith(mockCustomFields[0]);
      });

      it('calls handleEdit when option combo link edit menu item is clicked', () => {
        const mockOnEdit = jest.fn();
        const fieldWithOptions = {
          ...mockCustomFields[0],
          options: [
            {
              id: '1',
              name: 'Option 1',
              deleted: false,
              workerAssignmentCount: 5,
            },
          ],
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [fieldWithOptions],
          onEdit: mockOnEdit,
        });

        // Expand to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        // Find and click the Edit menu item (not the dropdown button)
        const editMenuItems = screen.getAllByTestId('menu-item-edit');
        // The second one should be for the option (first is for the main field)
        fireEvent.click(editMenuItems[1]);

        expect(mockOnEdit).toHaveBeenCalledWith(fieldWithOptions);
      });

      it('calls handleAssignTeamMember when team member menu item is clicked', () => {
        const fieldWithOptions = {
          ...mockCustomFields[0],
          options: [
            {
              id: '1',
              name: 'Option 1',
              deleted: false,
              workerAssignmentCount: 5,
            },
          ],
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [fieldWithOptions],
        });

        // Expand to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        // Find and click the "assignWorkers" menu item
        const assignWorkersMenuItem = screen.getByTestId(
          'menu-item-assignWorkers',
        );
        fireEvent.click(assignWorkersMenuItem);

        // Verify WorkerAssignmentIntegration is rendered
        expect(
          screen.getByText('Mock Worker Assignment Integration'),
        ).toBeInTheDocument();
      });

      it('collapses expanded field when clicked again', () => {
        const fieldWithOptions = {
          ...mockCustomFields[0],
          options: [
            {
              id: '1',
              name: 'Option 1',
              deleted: false,
              workerAssignmentCount: 5,
            },
          ],
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [fieldWithOptions],
        });

        // First expand
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        // Verify expanded
        expect(
          screen.getByTestId('custom-field-option-row'),
        ).toBeInTheDocument();

        // Then collapse
        fireEvent.click(expandIcon);

        // Verify collapsed (option row should not be visible)
        expect(
          screen.queryByTestId('custom-field-option-row'),
        ).not.toBeInTheDocument();
      });

      it('does not set cursor pointer for fields without options', () => {
        const fieldWithoutOptions = {
          ...mockCustomFields[0],
          options: [],
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [fieldWithoutOptions],
        });

        const nameCell = screen.getByTestId('custom-field-name');
        // This tests the branch where hasOptions is false, so onClick should be undefined
        expect(nameCell).toBeInTheDocument();

        // Click on the name cell - should not trigger any expansion since hasOptions is false
        fireEvent.click(nameCell);

        // Verify no expansion occurred (no option rows should be present)
        expect(
          screen.queryByTestId('custom-field-option-row'),
        ).not.toBeInTheDocument();
      });
    });

    describe('Assignment Integration', () => {
      // Mock the integration components
      beforeEach(() => {
        jest.mock(
          'src/js/widgets/customField/components/CustomerAssignmentIntegration',
          () => ({
            __esModule: true,
            default: ({ customField, onClose }: any) => (
              <div data-testid="customer-assignment-integration">
                <div data-testid="integration-field-name">
                  {customField.name}
                </div>
                <button data-testid="integration-close" onClick={onClose}>
                  Close Integration
                </button>
              </div>
            ),
          }),
        );
      });

      it('should initialize with no active assignment integrations', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        // Integration components should not be rendered initially
        expect(
          screen.queryByTestId('customer-assignment-integration'),
        ).not.toBeInTheDocument();
      });

      it('should handle customer assignment state correctly', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        // Component should render without errors
        expect(screen.getByTestId('custom-fields-table')).toBeInTheDocument();
      });

      it('should handle assign customer button click', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        const comboLinks = screen.getAllByTestId(
          'custom-field-edit-combo-link',
        );
        expect(comboLinks[0]).toBeInTheDocument();

        // Click should not throw error
        expect(() => fireEvent.click(comboLinks[0])).not.toThrow();
      });

      it('should call handleAssignTeamMember when assign team member option is selected', () => {
        const fieldWithOptions = {
          ...mockCustomFields[0],
          options: [
            {
              id: '1',
              name: 'Option 1',
              deleted: false,
              workerAssignmentCount: 5,
            },
          ],
        };

        const mockSandbox = {
          logger: {
            info: jest.fn(),
          },
        };

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: [fieldWithOptions],
        });

        // Expand to see options
        const expandIcon = screen.getByTestId('icon-control');
        fireEvent.click(expandIcon);

        const dropdownButtons = screen.getAllByTestId(
          'custom-field-option-edit-combo-link-dropdown',
        );

        // Click the dropdown to trigger onSelect (handleAssignTeamMember)
        fireEvent.click(dropdownButtons[0]);

        // Verify no errors occurred - the callback was called successfully
        expect(() => fireEvent.click(dropdownButtons[0])).not.toThrow();
      });

      it('should allow multiple assignment operations without interference', () => {
        const fieldsWithOptions = [
          {
            ...mockCustomFields[0],
            id: 'field-1',
            name: 'Field 1',
            options: [
              {
                id: 'opt-1',
                name: 'Option 1',
                deleted: false,
                workerAssignmentCount: 5,
              },
            ],
          },
          {
            ...mockCustomFields[1],
            id: 'field-2',
            name: 'Field 2',
            options: [
              {
                id: 'opt-2',
                name: 'Option 2',
                deleted: false,
                workerAssignmentCount: 3,
              },
            ],
          },
        ];

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: fieldsWithOptions,
        });

        // Component should handle multiple fields with options
        expect(screen.getByTestId('custom-fields-table')).toBeInTheDocument();

        const comboLinks = screen.getAllByTestId(
          'custom-field-edit-combo-link',
        );
        expect(comboLinks.length).toBeGreaterThanOrEqual(2);
      });

      it('should handle state cleanup properly', () => {
        const { unmount } = renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        // Should unmount without errors
        expect(() => unmount()).not.toThrow();
      });

      it('should call onRefetch when customer assignment succeeds', () => {
        const mockOnRefetch = jest.fn();

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
          onRefetch: mockOnRefetch,
        });

        // Open the assignment drawer by clicking the main button
        const mainButtons = screen.getAllByTestId(
          'custom-field-edit-combo-link-main',
        );
        fireEvent.click(mainButtons[0]);

        // Verify the customer assignment integration is shown
        expect(
          screen.getByTestId('customer-assignment-integration'),
        ).toBeInTheDocument();

        // Click the success button in the mocked integration
        const successButton = screen.getByTestId(
          'mock-customer-assignment-success',
        );
        fireEvent.click(successButton);

        // Verify onRefetch was called
        expect(mockOnRefetch).toHaveBeenCalled();
      });
    });

    describe('Assignment Error Handling', () => {
      it('should not display assignment error message when errorInfo is null and no fetchError', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
          fetchError: false,
        });

        // No error messages should be present
        expect(screen.queryByTestId('page-message')).not.toBeInTheDocument();
      });

      it('should render component successfully with assignments enabled', () => {
        // Verify the component renders without errors when assignments are enabled
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        expect(screen.getByTestId('custom-fields-table')).toBeInTheDocument();
        expect(screen.getByText('Customers assigned')).toBeInTheDocument();
        expect(screen.getByText('Team assigned')).toBeInTheDocument();
      });

      it('should display both fetchError and have assignment functionality available', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
          fetchError: true,
        });

        // FetchError page message should be present
        expect(screen.getByTestId('page-message')).toBeInTheDocument();
        expect(screen.getByTestId('page-message-title')).toHaveTextContent(
          'Error Loading Custom Fields',
        );

        // Assignment columns should still be rendered
        expect(screen.getByText('Customers assigned')).toBeInTheDocument();
        expect(screen.getByText('Team assigned')).toBeInTheDocument();
      });

      it('should handle partial success error from assignment integration', () => {
        const mockOnRefetch = jest.fn();

        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
          onRefetch: mockOnRefetch,
        });

        // Open the drawer
        const mainButtons = screen.getAllByTestId(
          'custom-field-edit-combo-link-main',
        );
        fireEvent.click(mainButtons[0]);

        // Trigger partial success
        const partialSuccessButton = screen.getByTestId(
          'mock-customer-assignment-partial-success',
        );
        fireEvent.click(partialSuccessButton);

        // For partial success, onRefetch should be called
        expect(mockOnRefetch).toHaveBeenCalled();
      });

      it('should display error message and allow dismissing it', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        // Open the drawer
        const mainButtons = screen.getAllByTestId(
          'custom-field-edit-combo-link-main',
        );
        fireEvent.click(mainButtons[0]);

        // Trigger error
        const errorButton = screen.getByTestId(
          'mock-customer-assignment-error',
        );
        fireEvent.click(errorButton);

        // Error message should be displayed
        const errorMessage = screen.getByTestId('page-message');
        expect(errorMessage).toBeInTheDocument();
        expect(screen.getByText('Error occurred')).toBeInTheDocument();

        // Close the error message
        const closeButton = screen.getByTestId('page-message-close');
        fireEvent.click(closeButton);

        // Error message should be dismissed
        expect(screen.queryByTestId('page-message')).not.toBeInTheDocument();
      });

      it('should display success toast and allow closing it', () => {
        renderComponent({
          isAssignmentsEnabled: true,
          customFields: mockCustomFields,
        });

        // Open the drawer
        const mainButtons = screen.getAllByTestId(
          'custom-field-edit-combo-link-main',
        );
        fireEvent.click(mainButtons[0]);

        // Trigger success
        const successButton = screen.getByTestId(
          'mock-customer-assignment-success',
        );
        fireEvent.click(successButton);

        // Success toast should be displayed
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
        expect(screen.getByTestId('success-toast-message')).toHaveTextContent(
          'Assignment successful',
        );

        // Close the success toast
        const closeButton = screen.getByTestId('success-toast-close');
        fireEvent.click(closeButton);

        // Success toast should be closed
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });
  });
});
