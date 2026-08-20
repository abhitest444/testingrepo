import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkerSelectionTable } from 'src/js/widgets/common/WorkerSelection/components/WorkerSelectionTable';
import type {
  SelectableWorker,
  WorkerSelectionTableLabels,
  PaginationProps,
} from 'src/js/widgets/common/WorkerSelection/components/WorkerSelectionTable.types';
import {
  TimeTracking_WorkerOrderBy,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import { createMockWorker } from 'test/unit/fixtures/workerFixtures';

// Mock IDS components
jest.mock('@ids-ts/table', () => ({
  Table: Object.assign(
    // eslint-disable-next-line react/jsx-props-no-spreading
    ({ children, ...props }: any) => <table {...props}>{children}</table>,
    {
      Header: ({ children }: any) => <thead>{children}</thead>,
      Body: ({ children }: any) => <tbody>{children}</tbody>,
      // eslint-disable-next-line react/jsx-props-no-spreading
      Row: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
      // eslint-disable-next-line react/jsx-props-no-spreading
      Cell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
    },
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: ({ size }: any) => (
    <div role="progressbar" data-size={size}>
      Loading...
    </div>
  ),
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, ...props }: any) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@ids-ts/checkbox', () => ({
  __esModule: true,
  default: ({
    checked,
    indeterminate,
    onChange,
    'aria-label': ariaLabel,
    'data-testid': testId,
  }: any) => (
    <input
      type="checkbox"
      checked={checked}
      data-indeterminate={indeterminate}
      onChange={onChange}
      aria-label={ariaLabel}
      data-testid={testId}
    />
  ),
}));

jest.mock('@design-systems/icons', () => ({
  ChevronUp: () => <span data-testid="chevron-up">▲</span>,
  ChevronDown: () => <span data-testid="chevron-down">▼</span>,
}));

describe('WorkerSelectionTable', () => {
  // Default labels
  const defaultLabels: WorkerSelectionTableLabels = {
    nameColumnHeader: 'Team Member',
    groupColumnHeader: 'Group',
    selectAllLabel: 'Select all team members',
    selectWorkerLabel: (name) => `Select ${name}`,
    emptyStateMessage: 'No team members found',
    loadingMessage: 'Loading team members...',
    noGroupText: 'No group',
    previousPageLabel: 'Previous',
    nextPageLabel: 'Next',
  };

  const mockWorkers: SelectableWorker[] = [
    createMockWorker('worker-1', {
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      memberOfGroup: { id: 'group-1', name: 'Engineering', isActive: true },
    }),
    createMockWorker('worker-2', {
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'Jane Smith',
      memberOfGroup: null,
    }),
  ];

  // Mock callbacks
  const mockOnSelectionChange = jest.fn();
  const mockOnSelectAllChange = jest.fn();
  const mockOnSortChange = jest.fn();

  const defaultProps = {
    workers: mockWorkers,
    selectedIds: new Set<string>(),
    onSelectionChange: mockOnSelectionChange,
    onSelectAllChange: mockOnSelectAllChange,
    allSelected: false,
    someSelected: false,
    sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
    onSortChange: mockOnSortChange,
    isLoading: false,
    labels: defaultLabels,
    testIdPrefix: 'worker-selection',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading state when isLoading is true and workers is empty', () => {
      render(<WorkerSelectionTable {...defaultProps} workers={[]} isLoading />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading team members...')).toBeInTheDocument();
      expect(
        screen.getByTestId('worker-selection-loading'),
      ).toBeInTheDocument();
    });

    it('does not render loading state when workers are present', () => {
      render(<WorkerSelectionTable {...defaultProps} isLoading />);

      expect(
        screen.queryByTestId('worker-selection-loading'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('worker-selection-table')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when isLoading is false and workers is empty', () => {
      render(
        <WorkerSelectionTable
          {...defaultProps}
          workers={[]}
          isLoading={false}
        />,
      );

      expect(screen.getByText('No team members found')).toBeInTheDocument();
      expect(screen.getByTestId('worker-selection-empty')).toBeInTheDocument();
    });
  });

  describe('Table Rendering', () => {
    it('renders table with workers when workers are provided', () => {
      render(<WorkerSelectionTable {...defaultProps} />);

      expect(screen.getByTestId('worker-selection-table')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('No group')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<WorkerSelectionTable {...defaultProps} />);

      expect(screen.getByText('Team Member')).toBeInTheDocument();
      expect(screen.getByText('Group')).toBeInTheDocument();
    });

    it('renders worker rows with correct test IDs', () => {
      render(<WorkerSelectionTable {...defaultProps} />);

      expect(
        screen.getByTestId('worker-selection-row-worker-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('worker-selection-row-worker-2'),
      ).toBeInTheDocument();
    });

    it('shows checkboxes as checked for selected workers', () => {
      const selectedIds = new Set(['worker-1']);
      render(
        <WorkerSelectionTable {...defaultProps} selectedIds={selectedIds} />,
      );

      const checkbox1 = screen.getByTestId(
        'worker-selection-checkbox-worker-1',
      );
      const checkbox2 = screen.getByTestId(
        'worker-selection-checkbox-worker-2',
      );

      expect(checkbox1).toBeChecked();
      expect(checkbox2).not.toBeChecked();
    });
  });

  describe('Selection Callbacks', () => {
    it('calls onSelectionChange when individual checkbox is clicked', () => {
      render(<WorkerSelectionTable {...defaultProps} />);

      const checkbox = screen.getByTestId('worker-selection-checkbox-worker-1');
      fireEvent.click(checkbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith('worker-1', true);
    });

    it('calls onSelectionChange with false when selected checkbox is clicked', () => {
      const selectedIds = new Set(['worker-1']);
      render(
        <WorkerSelectionTable {...defaultProps} selectedIds={selectedIds} />,
      );

      const checkbox = screen.getByTestId('worker-selection-checkbox-worker-1');
      fireEvent.click(checkbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith('worker-1', false);
    });

    it('calls onSelectAllChange when select-all checkbox is clicked', () => {
      render(<WorkerSelectionTable {...defaultProps} />);

      const selectAll = screen.getByTestId('worker-selection-select-all');
      fireEvent.click(selectAll);

      expect(mockOnSelectAllChange).toHaveBeenCalledWith(true);
    });

    it('renders select-all as indeterminate when someSelected is true', () => {
      render(<WorkerSelectionTable {...defaultProps} someSelected />);

      const selectAll = screen.getByTestId('worker-selection-select-all');
      expect(selectAll).toHaveAttribute('data-indeterminate', 'true');
    });

    it('renders select-all as checked when allSelected is true', () => {
      render(<WorkerSelectionTable {...defaultProps} allSelected />);

      const selectAll = screen.getByTestId('worker-selection-select-all');
      expect(selectAll).toBeChecked();
    });
  });

  describe('Sorting', () => {
    it('calls onSortChange when sort header is clicked', () => {
      render(<WorkerSelectionTable {...defaultProps} />);

      const sortHeader = screen.getByText('Team Member').closest('td');
      fireEvent.click(sortHeader!);

      expect(mockOnSortChange).toHaveBeenCalledWith(
        TimeTracking_WorkerOrderBy.DisplayNameDesc,
      );
    });

    it('calls onSortChange with Asc when current order is Desc', () => {
      render(
        <WorkerSelectionTable
          {...defaultProps}
          sortOrder={TimeTracking_WorkerOrderBy.DisplayNameDesc}
        />,
      );

      const sortHeader = screen.getByText('Team Member').closest('td');
      fireEvent.click(sortHeader!);

      expect(mockOnSortChange).toHaveBeenCalledWith(
        TimeTracking_WorkerOrderBy.DisplayNameAsc,
      );
    });

    it.each([
      {
        description: 'ascending',
        sortOrder: undefined,
        iconTestId: 'chevron-up',
      },
      {
        description: 'descending',
        sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc,
        iconTestId: 'chevron-down',
      },
    ])('shows $description sort icon', ({ sortOrder, iconTestId }) => {
      render(
        <WorkerSelectionTable
          {...defaultProps}
          {...(sortOrder && { sortOrder })}
        />,
      );

      expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    const mockPagination: PaginationProps = {
      hasNextPage: true,
      hasPreviousPage: true,
      onNextPage: jest.fn(),
      onPreviousPage: jest.fn(),
      isLoading: false,
    };

    it('renders pagination controls when pagination prop is provided', () => {
      render(
        <WorkerSelectionTable {...defaultProps} pagination={mockPagination} />,
      );

      expect(
        screen.getByTestId('worker-selection-pagination'),
      ).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('does not render pagination when pagination prop is not provided', () => {
      render(<WorkerSelectionTable {...defaultProps} />);

      expect(
        screen.queryByTestId('worker-selection-pagination'),
      ).not.toBeInTheDocument();
    });

    it.each([
      {
        description: 'Previous',
        pageOverride: { hasPreviousPage: false },
        btnTestId: 'worker-selection-prev-btn',
      },
      {
        description: 'Next',
        pageOverride: { hasNextPage: false },
        btnTestId: 'worker-selection-next-btn',
      },
    ])(
      'disables $description button when its page flag is false',
      ({ pageOverride, btnTestId }) => {
        render(
          <WorkerSelectionTable
            {...defaultProps}
            pagination={{ ...mockPagination, ...pageOverride }}
          />,
        );

        expect(screen.getByTestId(btnTestId)).toBeDisabled();
      },
    );

    it('disables both buttons when pagination isLoading is true', () => {
      render(
        <WorkerSelectionTable
          {...defaultProps}
          pagination={{ ...mockPagination, isLoading: true }}
        />,
      );

      expect(screen.getByTestId('worker-selection-prev-btn')).toBeDisabled();
      expect(screen.getByTestId('worker-selection-next-btn')).toBeDisabled();
    });

    it.each([
      {
        description: 'Next',
        btnTestId: 'worker-selection-next-btn',
        callbackKey: 'onNextPage' as const,
      },
      {
        description: 'Previous',
        btnTestId: 'worker-selection-prev-btn',
        callbackKey: 'onPreviousPage' as const,
      },
    ])(
      'calls $callbackKey when $description button is clicked',
      ({ btnTestId, callbackKey }) => {
        render(
          <WorkerSelectionTable
            {...defaultProps}
            pagination={mockPagination}
          />,
        );

        fireEvent.click(screen.getByTestId(btnTestId));

        expect(mockPagination[callbackKey]).toHaveBeenCalled();
      },
    );

    it('does not render pagination when both hasNextPage and hasPreviousPage are false', () => {
      render(
        <WorkerSelectionTable
          {...defaultProps}
          pagination={{
            ...mockPagination,
            hasNextPage: false,
            hasPreviousPage: false,
          }}
        />,
      );

      expect(
        screen.queryByTestId('worker-selection-pagination'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Display Name Fallback', () => {
    it('displays firstName + lastName when displayName is not available', () => {
      const workers: SelectableWorker[] = [
        {
          id: 'worker-no-display',
          type: TimeTracking_TimeForType.Employee,
          isActive: true,
          firstName: 'Bob',
          lastName: 'Builder',
          displayName: null,
          memberOfGroup: null,
        },
      ];

      render(<WorkerSelectionTable {...defaultProps} workers={workers} />);

      expect(screen.getByText('Bob Builder')).toBeInTheDocument();
    });

    it('displays worker ID when no name is available', () => {
      const workers: SelectableWorker[] = [
        {
          id: 'worker-fallback-id',
          type: TimeTracking_TimeForType.Employee,
          isActive: true,
          firstName: null,
          lastName: null,
          displayName: null,
          memberOfGroup: null,
        },
      ];

      render(<WorkerSelectionTable {...defaultProps} workers={workers} />);

      expect(screen.getByText('worker-fallback-id')).toBeInTheDocument();
    });
  });
});
