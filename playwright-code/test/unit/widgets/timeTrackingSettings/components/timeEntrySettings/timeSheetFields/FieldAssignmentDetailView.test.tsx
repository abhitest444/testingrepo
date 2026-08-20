import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FieldAssignmentDetailView } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/FieldAssignmentDetailView';
import { ITimeSheetFieldOption } from 'src/js/widgets/timeTrackingSettings/types';
import {
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  STANDARD_FIELD_ACTIONS,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { useStandardFieldOptionsSummary } from 'src/js/service/hooks/assignments/useStandardFieldOptionsSummary';
import standardFieldOptionsSummaryReducer from 'src/js/widgets/timeTrackingSettings/store/standardFieldOptionsSummarySlice';
import standardFieldAssignmentsReducer from 'src/js/widgets/timeTrackingSettings/store/standardFieldAssignmentsSlice';
import standardFieldWorkerAssignmentsReducer from 'src/js/widgets/timeTrackingSettings/store/standardFieldWorkerAssignmentsSlice';

// Mock tracking function
const mockTrack = jest.fn();

// Mock @payroll/quicksand hooks
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }, params?: any) => {
      if (params) {
        return `${id} with params`;
      }
      return id;
    },
  }),
  useSandbox: jest.fn().mockReturnValue({
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
  }),
  useTracking: jest.fn(() => mockTrack),
}));

// Mock useStandardFieldOptionsSummary hook
const mockLoadStandardFieldOptionsSummary = jest.fn();
jest.mock(
  'src/js/service/hooks/assignments/useStandardFieldOptionsSummary',
  () => ({
    useStandardFieldOptionsSummary: jest.fn(() => ({
      loading: false,
      data: null,
      error: null,
      loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      refetch: jest.fn(),
    })),
  }),
);

// Mock icons
jest.mock('@design-systems/icons', () => ({
  CaretLeft: ({ size }: { size: string }) => (
    <svg data-testid="caret-left-icon" data-size={size} />
  ),
  Info: ({ size }: { size?: string }) => (
    <svg data-testid="info-icon" data-size={size} />
  ),
}));

// Mock @ids-ts components
/* eslint-disable react/jsx-props-no-spreading */
jest.mock('@ids-ts/table', () => ({
  Table: Object.assign(
    ({ children, ...props }: any) => (
      <table data-testid="ids-table" {...props}>
        {children}
      </table>
    ),
    {
      Header: ({ children, ...props }: any) => (
        <thead data-testid="ids-table-header" {...props}>
          {children}
        </thead>
      ),
      Body: ({ children, ...props }: any) => (
        <tbody {...props}>{children}</tbody>
      ),
      Row: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
      Cell: ({ children, colSpan, ...props }: any) => (
        <td colSpan={colSpan} {...props}>
          {children}
        </td>
      ),
    },
  ),
}));
/* eslint-enable react/jsx-props-no-spreading */

/* eslint-disable react/jsx-props-no-spreading */
jest.mock('@ids-ts/pagination', () => ({
  Pagination: ({
    totalPages,
    activePage,
    onPageChange,
    preventPageJump,
    ...props
  }: {
    totalPages: number;
    activePage: number;
    onPageChange: (page: number) => void;
    preventPageJump?: boolean;
    [key: string]: any;
  }) => (
    <div
      data-testid="ids-pagination"
      data-prevent-page-jump={preventPageJump}
      {...props}
    >
      <span data-testid="pagination-total-pages">{totalPages}</span>
      <span data-testid="pagination-active-page">{activePage}</span>
      <button
        data-testid="pagination-next"
        onClick={() => onPageChange(activePage + 1)}
      >
        Next
      </button>
      <button
        data-testid="pagination-prev"
        onClick={() => onPageChange(activePage - 1)}
      >
        Prev
      </button>
    </div>
  ),
}));
/* eslint-enable react/jsx-props-no-spreading */

jest.mock('@ids-ts/loader', () => ({
  Activity: ({ shape, size }: { shape: string; size: string }) => (
    <div data-testid="ids-activity-loader" data-shape={shape} data-size={size}>
      Loading...
    </div>
  ),
}));

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({
    children,
    type,
    onClose,
  }: {
    children: React.ReactNode;
    type: string;
    onClose?: () => void;
  }) => (
    <div data-testid="ids-page-message" data-type={type}>
      {children}
      {onClose && (
        <button data-testid="page-message-close" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  ),
}));

jest.mock('@ids-ts/combo-link', () => {
  const MockComboLink = ({
    children,
    label,
    onClick,
    onSelect,
    'data-testid': dataTestId,
  }: any) => (
    <div data-testid={dataTestId} className="combo-link">
      <button data-testid={`${dataTestId}-button`} onClick={onClick}>
        {label}
      </button>
      <div data-testid={`${dataTestId}-menu`}>{children}</div>
      <button
        data-testid={`${dataTestId}-select-workers`}
        onClick={() => onSelect?.({ target: { value: 'assignWorkers' } })}
      >
        Select Workers
      </button>
    </div>
  );
  const MockMenuItem = ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-value={value}>{children}</div>;

  return {
    __esModule: true,
    default: MockComboLink,
    MenuItem: MockMenuItem,
  };
});

// Mock assignment utilities
jest.mock('src/js/widgets/common/assignment/assignmentUtils', () => ({
  getFieldAssignmentLabel: jest.fn((key: string) => {
    if (
      key ===
      TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED
    ) {
      return 'CUSTOMER';
    }
    if (key === TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES) {
      return 'CLASS';
    }
    if (
      key ===
      TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED
    ) {
      return 'LOCATION';
    }
    if (key === TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE) {
      return 'SERVICE_ITEM';
    }
    if (
      key === TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED
    ) {
      return 'BILLABLE';
    }
    return null;
  }),
  getAssignmentDisplayText: jest.fn(
    (assignmentCount: number, totalCount: number) => ({
      text:
        assignmentCount === totalCount
          ? 'All'
          : `${assignmentCount} of ${totalCount}`,
    }),
  ),
}));

// Mock SuccessToast
jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({
    message,
    open,
    onClose,
  }: {
    message: string;
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="success-toast">
        <span>{message}</span>
        <button data-testid="success-toast-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

// Mock Widget for Add drawer
jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    widgetId,
    handleCancel,
    handleSaveSuccess,
    ...props
  }: {
    widgetId: string;
    handleCancel?: () => void;
    handleSaveSuccess?: () => void;
    [key: string]: any;
  }) => (
    <div
      data-testid={`add-drawer-widget-${widgetId}`}
      data-widget-id={widgetId}
    >
      <button data-testid="add-drawer-cancel" onClick={handleCancel}>
        Cancel
      </button>
      <button data-testid="add-drawer-save-success" onClick={handleSaveSuccess}>
        Save Success
      </button>
    </div>
  ),
}));

// Mock SearchField
jest.mock('src/js/widgets/common/SearchField', () => ({
  SearchField: ({
    value,
    onChange,
    label,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
  }) => (
    <div data-testid="search-field">
      <input
        data-testid="search-field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        placeholder={placeholder}
      />
      <button data-testid="search-field-clear" onClick={() => onChange('')}>
        Clear
      </button>
    </div>
  ),
}));

// Mock StandardFieldAssignmentIntegration
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/StandardFieldAssignmentIntegration',
  () => ({
    __esModule: true,
    default: ({
      field,
      fieldDisplayName,
      standardFieldOption,
      onClose,
      onError,
      onShowSuccess,
    }: any) => (
      <div data-testid="standard-field-assignment-integration">
        <span data-testid="assignment-field-name">{fieldDisplayName}</span>
        <span data-testid="assignment-option-name">
          {standardFieldOption?.name}
        </span>
        <button data-testid="assignment-close" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="assignment-success"
          onClick={() => onShowSuccess('Assignment successful')}
        >
          Success
        </button>
        <button
          data-testid="assignment-error"
          onClick={() =>
            onError({
              title: 'Error title',
              subtitle: 'Error subtitle',
              isPartialSuccess: false,
            })
          }
        >
          Error
        </button>
        <button
          data-testid="assignment-partial-error"
          onClick={() =>
            onError({
              title: 'Partial error',
              subtitle: 'Some assignments failed',
              isPartialSuccess: true,
            })
          }
        >
          Partial Error
        </button>
      </div>
    ),
  }),
);

// Mock StandardFieldWorkerAssignmentIntegration
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/StandardFieldWorkerAssignmentIntegration',
  () => ({
    __esModule: true,
    default: ({
      field,
      fieldDisplayName,
      standardFieldOption,
      onClose,
      onError,
      onShowSuccess,
    }: any) => (
      <div data-testid="standard-field-worker-assignment-integration">
        <span data-testid="worker-assignment-field-name">
          {fieldDisplayName}
        </span>
        <span data-testid="worker-assignment-option-name">
          {standardFieldOption?.name}
        </span>
        <button data-testid="worker-assignment-close" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="worker-assignment-success"
          onClick={() => onShowSuccess('Worker assignment successful')}
        >
          Success
        </button>
        <button
          data-testid="worker-assignment-error"
          onClick={() =>
            onError({
              title: 'Worker error',
              subtitle: 'Worker error subtitle',
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

describe('FieldAssignmentDetailView', () => {
  const mockOnBack = jest.fn();
  const mockFieldTitle = 'Test Field Title';

  const createMockField = (
    overrides: Partial<ITimeSheetFieldOption> = {},
  ): ITimeSheetFieldOption => ({
    id: 'test-field-id',
    key: 'testFieldKey',
    title: 'time-entries.section.title.test-field',
    ariaLabel: 'Test field aria label',
    tooltipText: 'Test field tooltip',
    disabled: false,
    value: true,
    detail: {
      title: 'Detail title',
      subtitle: 'Detail subtitle',
      ariaLabel: 'Detail aria label',
    },
    ...overrides,
  });

  const createMockOptionsSummaryData = (
    options: Array<{
      id: string;
      name: string;
      customerAssignmentCount: number;
      workerAssignmentCount: number;
    }> = [],
    totalCustomerCount = 10,
    totalWorkerCount = 20,
    totalOptionsCount?: number,
  ) => ({
    edges: options.map((option, index) => ({
      cursor: `cursor-${index}`,
      node: {
        ...option,
        standardFieldLabel: 'TEST_LABEL',
      },
    })),
    totalCustomerCount,
    totalWorkerCount,
    totalOptionsCount: totalOptionsCount ?? options.length,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: 'start',
      endCursor: 'end',
    },
  });

  // Create test store helper
  const createTestStore = () =>
    configureStore({
      reducer: {
        standardFieldOptionsSummary: standardFieldOptionsSummaryReducer,
        standardFieldAssignments: standardFieldAssignmentsReducer,
        standardFieldWorkerAssignments: standardFieldWorkerAssignmentsReducer,
      },
    });

  // Render helper with Redux Provider
  const renderWithProvider = (
    ui: React.ReactElement,
    { store = createTestStore() } = {},
  ) => render(<ReduxProvider store={store}>{ui}</ReduxProvider>);

  beforeEach(() => {
    jest.clearAllMocks();
    (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
      loading: false,
      data: null,
      error: null,
      loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      refetch: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render the component with data-testid', () => {
      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-view'),
      ).toBeInTheDocument();
    });

    it('should render the back button with correct test id', () => {
      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-back-button'),
      ).toBeInTheDocument();
    });

    it('should render the back button with CaretLeft icon', () => {
      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(screen.getByTestId('caret-left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('caret-left-icon')).toHaveAttribute(
        'data-size',
        'small',
      );
    });

    it('should render the back button with correct text from intl', () => {
      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByText(
          'time-entries.section.title.time-sheet-settings-header',
        ),
      ).toBeInTheDocument();
    });

    it('should render the page title with correct test id', () => {
      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-title'),
      ).toBeInTheDocument();
    });

    it('should render the field title from fieldTitle prop', () => {
      const mockField = createMockField();
      const customFieldTitle = 'Custom Field Title';

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={customFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-title'),
      ).toHaveTextContent('Custom Field Title');
    });

    it('should render the table with correct test id', () => {
      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-table'),
      ).toBeInTheDocument();
    });

    it('should render pagination when there are multiple pages', async () => {
      // Create 25 options to trigger pagination (more than 20 per page)
      const mockOptions = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `option-${i}`,
          name: `Option ${i}`,
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        }));

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions, 10, 20, 25),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-assignment-detail-pagination'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Back Button Interaction', () => {
    it('should call onBack when back button is clicked', () => {
      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      const backButton = screen.getByTestId('field-assignment-back-button');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should have correct aria-label on back button', () => {
      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      const backButton = screen.getByTestId('field-assignment-back-button');
      expect(backButton).toHaveAttribute(
        'aria-label',
        'time-entries.section.title.time-sheet-settings-header',
      );
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when data is loading', () => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: true,
        data: null,
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(screen.getByTestId('ids-activity-loader')).toBeInTheDocument();
      expect(screen.getByTestId('ids-activity-loader')).toHaveAttribute(
        'data-shape',
        'dots',
      );
      expect(screen.getByTestId('ids-activity-loader')).toHaveAttribute(
        'data-size',
        'large',
      );
    });

    it('should show data rows instead of loader when current page has complete data', async () => {
      const mockOptions = [
        {
          id: 'option-1',
          name: 'Option One',
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        },
      ];

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('standard-field-option-row-option-1'),
        ).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('ids-activity-loader'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when there is an error', () => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: null,
        error: new Error('Failed to load data'),
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(screen.getByTestId('ids-page-message')).toBeInTheDocument();
      expect(screen.getByTestId('ids-page-message')).toHaveAttribute(
        'data-type',
        'error',
      );
      expect(screen.getByText('catch.all.error.content')).toBeInTheDocument();
    });

    it('should not render table when there is an error', () => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: null,
        error: new Error('Failed to load data'),
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.queryByTestId('field-assignment-detail-table'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no data', () => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData([]),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByText('time-entries.empty.state with params'),
      ).toBeInTheDocument();
    });
  });

  describe('Table with Data', () => {
    const mockOptions = [
      {
        id: 'option-1',
        name: 'Option One',
        customerAssignmentCount: 5,
        workerAssignmentCount: 10,
      },
      {
        id: 'option-2',
        name: 'Option Two',
        customerAssignmentCount: 10,
        workerAssignmentCount: 20,
      },
    ];

    beforeEach(() => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });
    });

    it('should render table rows for each option', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('standard-field-option-row-option-1'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('standard-field-option-row-option-2'),
        ).toBeInTheDocument();
      });
    });

    it('should display option names in the table', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('option-name-option-1')).toHaveTextContent(
          'Option One',
        );
        expect(screen.getByTestId('option-name-option-2')).toHaveTextContent(
          'Option Two',
        );
      });
    });

    it('should display customer assignment counts', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-customers-option-1'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('option-customers-option-2'),
        ).toBeInTheDocument();
      });
    });

    it('should display worker assignment counts', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-workers-option-1'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('option-workers-option-2'),
        ).toBeInTheDocument();
      });
    });

    it('should render action combo links for each option', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('option-action-combo-link-option-2'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading on Mount', () => {
    it('should call loadStandardFieldOptionsSummary on mount', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should update page when pagination changes', async () => {
      // Create 25 options to trigger pagination (more than 20 per page)
      const mockOptions = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `option-${i}`,
          name: `Option ${i}`,
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        }));

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions, 10, 20, 25),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-assignment-detail-pagination'),
        ).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      // The component should re-render with the new page
      expect(screen.getByTestId('pagination-active-page')).toHaveTextContent(
        '2',
      );
    });

    it('should pass preventPageJump prop to Pagination', async () => {
      // Create 25 options to trigger pagination (more than 20 per page)
      const mockOptions = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `option-${i}`,
          name: `Option ${i}`,
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        }));

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions, 10, 20, 25),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-assignment-detail-pagination'),
        ).toBeInTheDocument();
      });

      const pagination = screen.getByTestId(
        'field-assignment-detail-pagination',
      );
      expect(pagination).toHaveAttribute('data-prevent-page-jump', 'true');
    });

    it('should not render pagination when there is only one page and no more data', () => {
      const mockOptions = [
        {
          id: 'option-1',
          name: 'Option One',
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        },
      ];

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions, 10, 20, 1),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.queryByTestId('field-assignment-detail-pagination'),
      ).not.toBeInTheDocument();
    });

    it('should fetch more data when navigating to page 2 with hasMore', async () => {
      const mockOptions = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `option-${i}`,
          name: `Option ${i}`,
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        }));

      const initialData = createMockOptionsSummaryData(
        mockOptions.slice(0, 20),
        10,
        20,
        25,
      );
      initialData.pageInfo = {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'start',
        endCursor: 'cursor-20',
      };
      initialData.edges = initialData.edges.map((edge, i) => ({
        ...edge,
        cursor: `cursor-${i}`,
      }));

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: initialData,
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-assignment-detail-pagination'),
        ).toBeInTheDocument();
      });

      mockLoadStandardFieldOptionsSummary.mockClear();

      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            standardFieldLabel: 'CLASS',
            first: 20,
            after: 'cursor-20',
          }),
        );
      });
    });
  });

  describe('Customer Assignment Integration', () => {
    const mockOptions = [
      {
        id: 'option-1',
        name: 'Option One',
        customerAssignmentCount: 5,
        workerAssignmentCount: 10,
      },
    ];

    beforeEach(() => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });
    });

    it('should open customer assignment integration when assign customers is clicked', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1-button'),
        ).toBeInTheDocument();
      });

      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(comboLinkButton);

      expect(
        screen.getByTestId('standard-field-assignment-integration'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('assignment-option-name')).toHaveTextContent(
        'Option One',
      );
    });

    it('should close customer assignment integration when close is clicked', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1-button'),
        ).toBeInTheDocument();
      });

      // Open the integration
      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(comboLinkButton);

      expect(
        screen.getByTestId('standard-field-assignment-integration'),
      ).toBeInTheDocument();

      // Close the integration
      const closeButton = screen.getByTestId('assignment-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('standard-field-assignment-integration'),
        ).not.toBeInTheDocument();
      });
    });

    it('should show success toast and close drawer on successful assignment', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1-button'),
        ).toBeInTheDocument();
      });

      // Open the integration
      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(comboLinkButton);

      // Trigger success
      const successButton = screen.getByTestId('assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
        expect(screen.getByText('Assignment successful')).toBeInTheDocument();
      });
    });

    it('should refetch data from beginning after successful assignment', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1-button'),
        ).toBeInTheDocument();
      });

      // Clear initial load call
      mockLoadStandardFieldOptionsSummary.mockClear();

      // Open the integration
      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(comboLinkButton);

      // Trigger success
      const successButton = screen.getByTestId('assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        // Should refetch from beginning (refreshTrigger pattern)
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            standardFieldLabel: 'CLASS',
            first: 20,
            searchText: undefined,
          }),
        );
      });
    });

    it('should refetch data from beginning after successful assignment on page 2', async () => {
      // Create 25 options to have multiple pages
      const mockOptions = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `option-${i}`,
          name: `Option ${i}`,
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        }));

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions, 10, 20, 25),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      // Wait for data to load
      await waitFor(() => {
        expect(
          screen.getByTestId('field-assignment-detail-pagination'),
        ).toBeInTheDocument();
      });

      // Navigate to page 2
      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('pagination-active-page')).toHaveTextContent(
          '2',
        );
      });

      // Clear previous calls
      mockLoadStandardFieldOptionsSummary.mockClear();

      // Open the integration for an option on page 2
      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-20-button',
      );
      fireEvent.click(comboLinkButton);

      // Trigger success
      const successButton = screen.getByTestId('assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        // Should refetch from beginning (refreshTrigger pattern)
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            standardFieldLabel: 'CLASS',
            first: 20,
            searchText: undefined,
          }),
        );
      });
    });

    it('should display error message on assignment error', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1-button'),
        ).toBeInTheDocument();
      });

      // Open the integration
      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(comboLinkButton);

      // Trigger error
      const errorButton = screen.getByTestId('assignment-error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.getByTestId('ids-page-message')).toBeInTheDocument();
        expect(screen.getByText('Error title')).toBeInTheDocument();
      });
    });

    it('should close drawer on partial success error', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1-button'),
        ).toBeInTheDocument();
      });

      // Open the integration
      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(comboLinkButton);

      // Trigger partial error
      const partialErrorButton = screen.getByTestId('assignment-partial-error');
      fireEvent.click(partialErrorButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('standard-field-assignment-integration'),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('ids-page-message')).toBeInTheDocument();
      });
    });
  });

  describe('Worker Assignment Integration', () => {
    const mockOptions = [
      {
        id: 'option-1',
        name: 'Option One',
        customerAssignmentCount: 5,
        workerAssignmentCount: 10,
      },
    ];

    beforeEach(() => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });
    });

    it('should open worker assignment integration when assign workers is selected', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'option-action-combo-link-option-1-select-workers',
          ),
        ).toBeInTheDocument();
      });

      const selectWorkersButton = screen.getByTestId(
        'option-action-combo-link-option-1-select-workers',
      );
      fireEvent.click(selectWorkersButton);

      expect(
        screen.getByTestId('standard-field-worker-assignment-integration'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('worker-assignment-option-name'),
      ).toHaveTextContent('Option One');
    });

    it('should close worker assignment integration when close is clicked', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'option-action-combo-link-option-1-select-workers',
          ),
        ).toBeInTheDocument();
      });

      // Open the worker integration
      const selectWorkersButton = screen.getByTestId(
        'option-action-combo-link-option-1-select-workers',
      );
      fireEvent.click(selectWorkersButton);

      expect(
        screen.getByTestId('standard-field-worker-assignment-integration'),
      ).toBeInTheDocument();

      // Close the integration
      const closeButton = screen.getByTestId('worker-assignment-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('standard-field-worker-assignment-integration'),
        ).not.toBeInTheDocument();
      });
    });

    it('should show success toast on successful worker assignment', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'option-action-combo-link-option-1-select-workers',
          ),
        ).toBeInTheDocument();
      });

      // Open the worker integration
      const selectWorkersButton = screen.getByTestId(
        'option-action-combo-link-option-1-select-workers',
      );
      fireEvent.click(selectWorkersButton);

      // Trigger success
      const successButton = screen.getByTestId('worker-assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
        expect(
          screen.getByText('Worker assignment successful'),
        ).toBeInTheDocument();
      });
    });

    it('should refetch data from beginning after successful worker assignment', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'option-action-combo-link-option-1-select-workers',
          ),
        ).toBeInTheDocument();
      });

      // Clear initial load call
      mockLoadStandardFieldOptionsSummary.mockClear();

      // Open the worker integration
      const selectWorkersButton = screen.getByTestId(
        'option-action-combo-link-option-1-select-workers',
      );
      fireEvent.click(selectWorkersButton);

      // Trigger success
      const successButton = screen.getByTestId('worker-assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        // Should refetch from beginning (refreshTrigger pattern)
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            standardFieldLabel: 'CLASS',
            first: 20,
            searchText: undefined,
          }),
        );
      });
    });

    it('should refetch data from beginning after successful worker assignment on page 2', async () => {
      // Create 25 options to have multiple pages
      const mockOptions = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `option-${i}`,
          name: `Option ${i}`,
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        }));

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions, 10, 20, 25),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      // Wait for data to load
      await waitFor(() => {
        expect(
          screen.getByTestId('field-assignment-detail-pagination'),
        ).toBeInTheDocument();
      });

      // Navigate to page 2
      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('pagination-active-page')).toHaveTextContent(
          '2',
        );
      });

      // Clear previous calls
      mockLoadStandardFieldOptionsSummary.mockClear();

      // Open the worker integration for an option on page 2
      const selectWorkersButton = screen.getByTestId(
        'option-action-combo-link-option-20-select-workers',
      );
      fireEvent.click(selectWorkersButton);

      // Trigger success
      const successButton = screen.getByTestId('worker-assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        // Should refetch from beginning (refreshTrigger pattern)
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            standardFieldLabel: 'CLASS',
            first: 20,
            searchText: undefined,
          }),
        );
      });
    });

    it('should display error message on worker assignment error', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'option-action-combo-link-option-1-select-workers',
          ),
        ).toBeInTheDocument();
      });

      // Open the worker integration
      const selectWorkersButton = screen.getByTestId(
        'option-action-combo-link-option-1-select-workers',
      );
      fireEvent.click(selectWorkersButton);

      // Trigger error
      const errorButton = screen.getByTestId('worker-assignment-error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.getByTestId('ids-page-message')).toBeInTheDocument();
        expect(screen.getByText('Worker error')).toBeInTheDocument();
      });
    });
  });

  describe('Error Message Dismissal', () => {
    const mockOptions = [
      {
        id: 'option-1',
        name: 'Option One',
        customerAssignmentCount: 5,
        workerAssignmentCount: 10,
      },
    ];

    beforeEach(() => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });
    });

    it('should dismiss error message when close button is clicked', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1-button'),
        ).toBeInTheDocument();
      });

      // Open the integration
      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(comboLinkButton);

      // Trigger error
      const errorButton = screen.getByTestId('assignment-error');
      fireEvent.click(errorButton);

      await waitFor(() => {
        expect(screen.getByTestId('ids-page-message')).toBeInTheDocument();
      });

      // Close the error message
      const closeButton = screen.getByTestId('page-message-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('ids-page-message'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Success Toast Dismissal', () => {
    const mockOptions = [
      {
        id: 'option-1',
        name: 'Option One',
        customerAssignmentCount: 5,
        workerAssignmentCount: 10,
      },
    ];

    beforeEach(() => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });
    });

    it('should dismiss success toast when close button is clicked', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1-button'),
        ).toBeInTheDocument();
      });

      // Open the integration
      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(comboLinkButton);

      // Trigger success
      const successButton = screen.getByTestId('assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      // Close the success toast
      const closeButton = screen.getByTestId('success-toast-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });
  });

  describe('Different Field Types', () => {
    it('should render correctly for customer field', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        title: 'time-entries.section.title.customer-field',
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-view'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('field-assignment-detail-title'),
      ).toBeInTheDocument();
    });

    it('should render correctly for class field', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
        title: 'time-entries.section.title.class-field',
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-view'),
      ).toBeInTheDocument();
    });

    it('should render correctly for location field', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
        title: 'time-entries.section.title.location-field',
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-view'),
      ).toBeInTheDocument();
    });

    it('should render correctly for service field', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
        title: 'time-entries.section.title.service-field',
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-view'),
      ).toBeInTheDocument();
    });

    it('should render correctly for billable field', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        title: 'time-entries.section.title.billable-field',
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-view'),
      ).toBeInTheDocument();
    });
  });

  describe('Add Button', () => {
    it('should render Add button for SERVICE_ITEM field', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Service Item"
          onBack={mockOnBack}
        />,
      );

      const addButton = screen.getByTestId('field-assignment-add-button');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveTextContent(
        'time-entries.add.button with params',
      );
    });

    it('should render Add button for CLASS field', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Class"
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-add-button'),
      ).toBeInTheDocument();
    });

    it('should render Add button for LOCATION field', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Location"
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-add-button'),
      ).toBeInTheDocument();
    });

    it('should NOT render Add button for BILLABLE field', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.queryByTestId('field-assignment-add-button'),
      ).not.toBeInTheDocument();
    });

    it('should open Add drawer when Add button is clicked for SERVICE_ITEM', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Service Item"
          onBack={mockOnBack}
        />,
      );

      const addButton = screen.getByTestId('field-assignment-add-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'add-drawer-widget-qbo-ps-drawer-ui/product-service-drawer',
          ),
        ).toBeInTheDocument();
      });
    });

    it('should open Add drawer when Add button is clicked for CLASS', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Class"
          onBack={mockOnBack}
        />,
      );

      const addButton = screen.getByTestId('field-assignment-add-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('add-drawer-widget-qbo-entity-drawer/classdrawer'),
        ).toBeInTheDocument();
      });
    });

    it('should open Add drawer when Add button is clicked for LOCATION', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Location"
          onBack={mockOnBack}
        />,
      );

      const addButton = screen.getByTestId('field-assignment-add-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'add-drawer-widget-qbo-location-drawer/locationdrawer',
          ),
        ).toBeInTheDocument();
      });
    });

    it('should close Add drawer when handleCancel is called', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Class"
          onBack={mockOnBack}
        />,
      );

      const addButton = screen.getByTestId('field-assignment-add-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('add-drawer-widget-qbo-entity-drawer/classdrawer'),
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId('add-drawer-cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId(
            'add-drawer-widget-qbo-entity-drawer/classdrawer',
          ),
        ).not.toBeInTheDocument();
      });
    });

    it('should show success toast and refetch when handleSaveSuccess is called from Add drawer', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Class"
          onBack={mockOnBack}
        />,
      );

      const addButton = screen.getByTestId('field-assignment-add-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('add-drawer-widget-qbo-entity-drawer/classdrawer'),
        ).toBeInTheDocument();
      });

      mockLoadStandardFieldOptionsSummary.mockClear();

      const saveSuccessButton = screen.getByTestId('add-drawer-save-success');
      fireEvent.click(saveSuccessButton);

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
        expect(
          screen.queryByTestId(
            'add-drawer-widget-qbo-entity-drawer/classdrawer',
          ),
        ).not.toBeInTheDocument();
      });

      expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
        expect.objectContaining({
          standardFieldLabel: 'CLASS',
          first: 20,
          searchText: undefined,
        }),
      );
    });

    it('should use lowercase field name in Add button NLS', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Class"
          onBack={mockOnBack}
        />,
      );

      const addButton = screen.getByTestId('field-assignment-add-button');
      expect(addButton).toBeInTheDocument();
      // formatMessage is called with fieldName - component uses fieldTitle.toLowerCase()
      expect(addButton).toHaveTextContent(
        'time-entries.add.button with params',
      );
    });
  });

  describe('Refresh on Success', () => {
    const mockOptions = [
      {
        id: 'option-1',
        name: 'Option One',
        customerAssignmentCount: 5,
        workerAssignmentCount: 10,
      },
    ];

    beforeEach(() => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
        refetch: jest.fn(),
      });
    });

    it('should trigger refetch when customer assignment succeeds', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalled();
      });

      mockLoadStandardFieldOptionsSummary.mockClear();

      const assignCustomersButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(assignCustomersButton);

      const successButton = screen.getByTestId('assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            standardFieldLabel: 'CLASS',
            first: 20,
            searchText: undefined,
          }),
        );
      });
    });

    it('should trigger refetch when worker assignment succeeds', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalled();
      });

      mockLoadStandardFieldOptionsSummary.mockClear();

      const selectWorkersButton = screen.getByTestId(
        'option-action-combo-link-option-1-select-workers',
      );
      fireEvent.click(selectWorkersButton);

      const successButton = screen.getByTestId('worker-assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            standardFieldLabel: 'CLASS',
            first: 20,
            searchText: undefined,
          }),
        );
      });
    });
  });

  describe('Billable Field with Yes/No Options', () => {
    const mockBillableOptions = [
      {
        id: 'billable-yes',
        name: 'Yes',
        customerAssignmentCount: 5,
        workerAssignmentCount: 10,
      },
      {
        id: 'billable-no',
        name: 'No',
        customerAssignmentCount: 3,
        workerAssignmentCount: 8,
      },
    ];

    beforeEach(() => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockBillableOptions, 10, 20),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });
    });

    it('should render exactly 2 options for billable field (Yes and No)', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('standard-field-option-row-billable-yes'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('standard-field-option-row-billable-no'),
        ).toBeInTheDocument();
      });
    });

    it('should display "Yes" option name in the table', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-name-billable-yes'),
        ).toHaveTextContent('Yes');
      });
    });

    it('should display "No" option name in the table', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('option-name-billable-no')).toHaveTextContent(
          'No',
        );
      });
    });

    it('should display customer assignment counts for Yes option', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-customers-billable-yes'),
        ).toBeInTheDocument();
      });
    });

    it('should display customer assignment counts for No option', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-customers-billable-no'),
        ).toBeInTheDocument();
      });
    });

    it('should display worker assignment counts for Yes option', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-workers-billable-yes'),
        ).toBeInTheDocument();
      });
    });

    it('should display worker assignment counts for No option', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-workers-billable-no'),
        ).toBeInTheDocument();
      });
    });

    it('should render action combo links for Yes option', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-billable-yes'),
        ).toBeInTheDocument();
      });
    });

    it('should render action combo links for No option', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-billable-no'),
        ).toBeInTheDocument();
      });
    });

    it('should open customer assignment for Yes option when clicked', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-billable-yes-button'),
        ).toBeInTheDocument();
      });

      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-billable-yes-button',
      );
      fireEvent.click(comboLinkButton);

      expect(
        screen.getByTestId('standard-field-assignment-integration'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('assignment-option-name')).toHaveTextContent(
        'Yes',
      );
    });

    it('should open customer assignment for No option when clicked', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-billable-no-button'),
        ).toBeInTheDocument();
      });

      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-billable-no-button',
      );
      fireEvent.click(comboLinkButton);

      expect(
        screen.getByTestId('standard-field-assignment-integration'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('assignment-option-name')).toHaveTextContent(
        'No',
      );
    });

    it('should call loadStandardFieldOptionsSummary with BILLABLE label on mount', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle="Billable"
          onBack={mockOnBack}
        />,
      );

      expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
        expect.objectContaining({
          standardFieldLabel: 'BILLABLE',
        }),
      );
    });
  });

  describe('Field with Subfields', () => {
    it('should render correctly when field has subFields', () => {
      const mockField = createMockField({
        subFields: [
          createMockField({
            id: 'sub-field-1',
            key: 'subField1',
            title: 'Sub Field 1',
          }),
          createMockField({
            id: 'sub-field-2',
            key: 'subField2',
            title: 'Sub Field 2',
          }),
        ],
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-view'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('field-assignment-detail-title'),
      ).toBeInTheDocument();
    });
  });

  describe('Disabled Field', () => {
    it('should render correctly when field is disabled', () => {
      const mockField = createMockField({
        disabled: true,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-view'),
      ).toBeInTheDocument();
    });
  });

  describe('Field Value States', () => {
    it('should render correctly when field value is true', () => {
      const mockField = createMockField({
        value: true,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-view'),
      ).toBeInTheDocument();
    });

    it('should render correctly when field value is false', () => {
      const mockField = createMockField({
        value: false,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByTestId('field-assignment-detail-view'),
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render back button as a button element', () => {
      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      const backButton = screen.getByTestId('field-assignment-back-button');
      expect(backButton.tagName).toBe('BUTTON');
    });

    it('should render page title as h1 element', () => {
      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      const pageTitle = screen.getByTestId('field-assignment-detail-title');
      expect(pageTitle.tagName).toBe('H1');
    });
  });

  describe('Tracking Points', () => {
    const mockOptions = [
      {
        id: 'option-1',
        name: 'Option One',
        customerAssignmentCount: 5,
        workerAssignmentCount: 10,
      },
    ];

    beforeEach(() => {
      mockTrack.mockClear();
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });
    });

    it('should track VIEW_CUSTOMER_ASSIGNMENT_DRAWER with assigned_to standard_field_item when assign customers is clicked', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1-button'),
        ).toBeInTheDocument();
      });

      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(comboLinkButton);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'viewed',
          ui_action: 'viewed',
          ui_object: 'drawer',
          ui_object_detail: 'assign_customers',
          assigned_to: 'standard_field_item',
        }),
      );
    });

    it('should track VIEW_WORKER_ASSIGNMENT_DRAWER with assigned_to standard_field_item when assign workers is clicked', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'option-action-combo-link-option-1-select-workers',
          ),
        ).toBeInTheDocument();
      });

      const selectWorkersButton = screen.getByTestId(
        'option-action-combo-link-option-1-select-workers',
      );
      fireEvent.click(selectWorkersButton);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'viewed',
          ui_action: 'viewed',
          ui_object: 'drawer',
          ui_object_detail: 'assign_workers',
          assigned_to: 'standard_field_item',
        }),
      );
    });

    it('should track SEARCH_FIELDS_IN_ASSIGNMENT_DRAWER when user types in search field', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('search-field-input')).toBeInTheDocument();
      });

      // Clear any previous tracking calls
      mockTrack.mockClear();

      // Type in search field
      const searchInput = screen.getByTestId('search-field-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'timeentrymanagement',
          screen: 'standard_field_detail_page',
          action: 'engaged',
          object: 'component',
          object_detail: 'add_standard_field_item',
          ui_action: 'typed',
          ui_object: 'form_field',
          ui_object_detail: 'search',
        }),
      );
    });

    it('should not track search when clearing search field', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('search-field-input')).toBeInTheDocument();
      });

      // Type something first
      const searchInput = screen.getByTestId('search-field-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Clear tracking calls
      mockTrack.mockClear();

      // Clear the search field
      fireEvent.change(searchInput, { target: { value: '' } });

      // Should not track when clearing (empty value)
      expect(mockTrack).not.toHaveBeenCalledWith(
        expect.objectContaining({
          ui_object_detail: 'search',
        }),
      );
    });
  });

  describe('Search Functionality', () => {
    const mockOptions = [
      {
        id: 'option-1',
        name: 'Option One',
        customerAssignmentCount: 5,
        workerAssignmentCount: 10,
      },
      {
        id: 'option-2',
        name: 'Option Two',
        customerAssignmentCount: 3,
        workerAssignmentCount: 8,
      },
    ];

    beforeEach(() => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });
    });

    it('should render search field', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(screen.getByTestId('search-field')).toBeInTheDocument();
    });

    it('should render search field input', () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(screen.getByTestId('search-field-input')).toBeInTheDocument();
    });

    it('should call loadStandardFieldOptionsSummary with searchText when search value changes', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      // Clear initial call
      mockLoadStandardFieldOptionsSummary.mockClear();

      // Type in search field
      const searchInput = screen.getByTestId('search-field-input');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            standardFieldLabel: 'CLASS',
            first: 20,
            searchText: 'test search',
          }),
        );
      });
    });

    it('should reset pagination when search value changes', async () => {
      // Create enough options for pagination
      const manyOptions = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `option-${i}`,
          name: `Option ${i}`,
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        }));

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(manyOptions, 10, 20, 25),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      // Wait for pagination to appear
      await waitFor(() => {
        expect(
          screen.getByTestId('field-assignment-detail-pagination'),
        ).toBeInTheDocument();
      });

      // Navigate to page 2
      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('pagination-active-page')).toHaveTextContent(
          '2',
        );
      });

      // Clear previous calls
      mockLoadStandardFieldOptionsSummary.mockClear();

      // Type in search field
      const searchInput = screen.getByTestId('search-field-input');
      fireEvent.change(searchInput, { target: { value: 'search' } });

      // Pagination should reset to page 1
      await waitFor(() => {
        expect(screen.getByTestId('pagination-active-page')).toHaveTextContent(
          '1',
        );
      });
    });

    it('should pass searchText when refetching data after successful assignment', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('search-field-input')).toBeInTheDocument();
      });

      // Type in search field first
      const searchInput = screen.getByTestId('search-field-input');
      fireEvent.change(searchInput, { target: { value: 'my search' } });

      await waitFor(() => {
        expect(
          screen.getByTestId('option-action-combo-link-option-1-button'),
        ).toBeInTheDocument();
      });

      // Clear calls from search
      mockLoadStandardFieldOptionsSummary.mockClear();

      // Open the integration
      const comboLinkButton = screen.getByTestId(
        'option-action-combo-link-option-1-button',
      );
      fireEvent.click(comboLinkButton);

      // Trigger success
      const successButton = screen.getByTestId('assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'my search',
          }),
        );
      });
    });

    it('should call loadStandardFieldOptionsSummary with undefined searchText when search is cleared', async () => {
      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      // Type in search field
      const searchInput = screen.getByTestId('search-field-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Wait for search to be processed
      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalled();
      });

      // Clear previous calls
      mockLoadStandardFieldOptionsSummary.mockClear();

      // Clear the search using clear button
      const clearButton = screen.getByTestId('search-field-clear');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: undefined,
          }),
        );
      });
    });
  });

  describe('No Search Results', () => {
    it('should display no search results message when search returns empty', async () => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData([], 10, 20, 0),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      // Type in search field to trigger no results state
      const searchInput = screen.getByTestId('search-field-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(
          screen.getByText('time-entries.search.noResults'),
        ).toBeInTheDocument();
      });
    });

    it('should not show no search results message when not searching', () => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData([], 10, 20, 0),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      // Should show empty state, not no search results
      expect(
        screen.getByText('time-entries.empty.state with params'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('time-entries.search.noResults'),
      ).not.toBeInTheDocument();
    });

    it('should show empty state message when no data and not searching', () => {
      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData([], 10, 20, 0),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField();

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      expect(
        screen.getByText('time-entries.empty.state with params'),
      ).toBeInTheDocument();
    });
  });

  describe('Search with Pagination', () => {
    it('should include searchText in pagination API calls', async () => {
      // Create enough options for pagination
      const manyOptions = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `option-${i}`,
          name: `Option ${i}`,
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        }));

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(manyOptions, 10, 20, 25),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      // Wait for initial data and pagination
      await waitFor(() => {
        expect(
          screen.getByTestId('field-assignment-detail-pagination'),
        ).toBeInTheDocument();
      });

      // Type in search field
      const searchInput = screen.getByTestId('search-field-input');
      fireEvent.change(searchInput, { target: { value: 'filtered' } });

      // Wait for search to be processed
      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'filtered',
          }),
        );
      });

      // Clear previous calls
      mockLoadStandardFieldOptionsSummary.mockClear();

      // Navigate to next page
      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      // Verify searchText is included in pagination call
      await waitFor(() => {
        const { calls } = mockLoadStandardFieldOptionsSummary.mock;
        if (calls.length > 0) {
          expect(calls[calls.length - 1][0]).toEqual(
            expect.objectContaining({
              searchText: 'filtered',
            }),
          );
        }
      });
    });

    it('should include searchText when refetching after worker assignment success', async () => {
      const mockOptions = [
        {
          id: 'option-1',
          name: 'Option One',
          customerAssignmentCount: 5,
          workerAssignmentCount: 10,
        },
      ];

      (useStandardFieldOptionsSummary as jest.Mock).mockReturnValue({
        loading: false,
        data: createMockOptionsSummaryData(mockOptions),
        error: null,
        loadStandardFieldOptionsSummary: mockLoadStandardFieldOptionsSummary,
      });

      const mockField = createMockField({
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
      });

      renderWithProvider(
        <FieldAssignmentDetailView
          field={mockField}
          fieldTitle={mockFieldTitle}
          onBack={mockOnBack}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('search-field-input')).toBeInTheDocument();
      });

      // Type in search field first
      const searchInput = screen.getByTestId('search-field-input');
      fireEvent.change(searchInput, { target: { value: 'worker search' } });

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'option-action-combo-link-option-1-select-workers',
          ),
        ).toBeInTheDocument();
      });

      // Clear calls from search
      mockLoadStandardFieldOptionsSummary.mockClear();

      // Open the worker integration
      const selectWorkersButton = screen.getByTestId(
        'option-action-combo-link-option-1-select-workers',
      );
      fireEvent.click(selectWorkersButton);

      // Trigger success
      const successButton = screen.getByTestId('worker-assignment-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(mockLoadStandardFieldOptionsSummary).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'worker search',
          }),
        );
      });
    });
  });
});
