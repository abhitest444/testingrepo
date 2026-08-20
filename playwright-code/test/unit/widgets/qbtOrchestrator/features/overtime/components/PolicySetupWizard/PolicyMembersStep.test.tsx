import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { Provider } from 'react-redux';
import { MockQuicksandProvider } from '@payroll/quicksand';
import {
  getDefaultSandbox,
  renderWithQuicksandProvider,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import PolicyMembersStep from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/PolicyMembersStep';
import type { SelectableWorker } from 'src/js/widgets/common/WorkerSelection/components/WorkerSelectionTable.types';
import {
  TimeTracking_TimeForType,
  TimeTracking_WorkerOrderBy,
} from 'src/__generated__/timeTracking/graphql';

// Mock useTimeTrackingWorkers hook
const mockLoadWorkers = jest.fn();
const mockFetchNextPage = jest.fn().mockResolvedValue(undefined);
const mockFetchPreviousPage = jest.fn().mockResolvedValue(undefined);

const createMockWorker = (id: string): SelectableWorker => ({
  id,
  type: TimeTracking_TimeForType.Employee,
  isActive: true,
  firstName: `First-${id}`,
  lastName: `Last-${id}`,
  displayName: `Worker ${id}`,
  memberOfGroup: null,
});

const mockWorkers = [
  createMockWorker('worker-1'),
  createMockWorker('worker-2'),
  createMockWorker('worker-3'),
];

jest.mock('src/js/service/hooks/groups/useTimeTrackingWorkers', () => ({
  useTimeTrackingWorkers: () => ({
    workers: mockWorkers,
    loading: false,
    error: null,
    totalCount: 3,
    pageInfo: {
      hasNextPage: true,
      hasPreviousPage: false,
      endCursor: 'cursor1',
      startCursor: null,
    },
    loadWorkers: mockLoadWorkers,
    fetchNextPage: mockFetchNextPage,
    fetchPreviousPage: mockFetchPreviousPage,
  }),
}));

// Mock the wizard members data hook to avoid Redux dispatch loops
const mockOnNextPage = jest.fn();
const mockOnPreviousPage = jest.fn();

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useWizardMembersData',
  () => ({
    useWizardMembersData: jest.fn(() => ({
      groups: [],
      groupsLoading: false,
      workers: mockWorkers,
      workersLoading: false,
      workersError: undefined,
      totalWorkerCount: 3,
      pagination: {
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: mockOnNextPage,
        onPreviousPage: mockOnPreviousPage,
        isLoading: false,
      },
    })),
  }),
);

// Mock the adapter hook
const mockOnSelectionChange = jest.fn();
const mockOnSelectAllChange = jest.fn();

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/hooks/usePolicyWorkerSelectionAdapter',
  () => ({
    usePolicyWorkerSelectionAdapter: jest.fn(() => ({
      selectedIds: new Set<string>(),
      allSelected: false,
      someSelected: false,
      onSelectionChange: mockOnSelectionChange,
      onSelectAllChange: mockOnSelectAllChange,
      selectedCount: 0,
      isEditMode: false,
    })),
  }),
);

// Mock GraphQL queries
jest.mock('src/__generated__/timeTracking/graphql', () => {
  const actual = jest.requireActual('src/__generated__/timeTracking/graphql');
  return {
    ...actual,
    useGetTimeTrackingGroupsLazyQuery: () => [
      jest.fn(),
      {
        data: { timeTrackingGroups: { edges: [] } },
        loading: false,
      },
    ],
  };
});

// Mock IDS components
jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@ids-ts/cards', () => ({
  __esModule: true,
  Card: ({ children, size }: any) => (
    <div data-testid="ids-card" data-size={size}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

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

jest.mock('@design-systems/icons', () => ({
  ChevronUp: () => <span data-testid="chevron-up">▲</span>,
  ChevronDown: () => <span data-testid="chevron-down">▼</span>,
}));

// Mock SearchField
jest.mock('src/js/widgets/common/SearchField', () => ({
  SearchField: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="search-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

// Mock GroupFilterDropdown
jest.mock(
  'src/js/widgets/assignments/components/Groups/GroupFilterDropdown',
  () => ({
    GroupFilterDropdown: ({ value, onChange }: any) => (
      <select
        data-testid="group-filter-dropdown"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="ALL">All</option>
        <option value="NO_GROUP">No Group</option>
        <option value="group-123">Group 123</option>
      </select>
    ),
  }),
);

describe('PolicyMembersStep', () => {
  const mockSandbox = getDefaultSandbox();
  let store: ReturnType<typeof createQbtOrchestratorStore>;

  const defaultProps = {
    policyName: 'Overtime Policy 1',
  };

  const renderComponent = (props = {}) => {
    store = createQbtOrchestratorStore();
    return render(
      <Provider store={store}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <PolicyMembersStep {...defaultProps} {...props} />
        </MockQuicksandProvider>
      </Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render the IDS Card wrapper', () => {
      renderComponent();
      expect(screen.getByTestId('ids-card')).toBeInTheDocument();
    });

    it('should render the title', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.members.title/i),
      ).toBeInTheDocument();
    });

    it('should render the counter showing selected workers', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.members.counter/i),
      ).toBeInTheDocument();
    });

    it('should render the search field', () => {
      renderComponent();
      expect(screen.getByTestId('search-field')).toBeInTheDocument();
    });

    it('should render the group filter dropdown', () => {
      renderComponent();
      expect(screen.getByTestId('group-filter-dropdown')).toBeInTheDocument();
    });
  });

  describe('WorkerSelectionTable Integration', () => {
    it('should render the worker selection table', () => {
      renderComponent();
      expect(screen.getByTestId('policy-members-table')).toBeInTheDocument();
    });

    it('should render workers with correct test IDs', () => {
      renderComponent();
      expect(
        screen.getByTestId('policy-members-row-worker-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('policy-members-row-worker-2'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('policy-members-row-worker-3'),
      ).toBeInTheDocument();
    });

    it('should render select-all checkbox', () => {
      renderComponent();
      expect(
        screen.getByTestId('policy-members-select-all'),
      ).toBeInTheDocument();
    });

    it('should render worker names', () => {
      renderComponent();
      expect(screen.getByText('Worker worker-1')).toBeInTheDocument();
      expect(screen.getByText('Worker worker-2')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls', () => {
      renderComponent();
      expect(
        screen.getByTestId('policy-members-pagination'),
      ).toBeInTheDocument();
    });

    it('should render Previous and Next buttons', () => {
      renderComponent();
      expect(screen.getByTestId('policy-members-prev-btn')).toBeInTheDocument();
      expect(screen.getByTestId('policy-members-next-btn')).toBeInTheDocument();
    });

    it('should call onNextPage when Next button is clicked', async () => {
      renderComponent();

      const nextBtn = screen.getByTestId('policy-members-next-btn');
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(mockOnNextPage).toHaveBeenCalled();
      });
    });
  });

  describe('Selection Callbacks', () => {
    it('should call onSelectionChange when worker checkbox is clicked', () => {
      renderComponent();

      const checkbox = screen.getByTestId('policy-members-checkbox-worker-1');
      fireEvent.click(checkbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith('worker-1', true);
    });

    it('should call onSelectAllChange when select-all checkbox is clicked', () => {
      renderComponent();

      const selectAll = screen.getByTestId('policy-members-select-all');
      fireEvent.click(selectAll);

      expect(mockOnSelectAllChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Create vs Edit Mode', () => {
    it('should render in create mode when policyId is not provided', () => {
      const {
        usePolicyWorkerSelectionAdapter,
      } = require('src/js/widgets/qbtOrchestrator/features/overtime/hooks/usePolicyWorkerSelectionAdapter');

      renderComponent();

      expect(usePolicyWorkerSelectionAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          policyId: undefined,
          initialWorkerIds: undefined,
        }),
      );
    });

    it('should render in edit mode when policyId is provided', () => {
      const {
        usePolicyWorkerSelectionAdapter,
      } = require('src/js/widgets/qbtOrchestrator/features/overtime/hooks/usePolicyWorkerSelectionAdapter');

      renderComponent({
        policyId: 'policy-123',
        initialWorkerIds: ['worker-1'],
      });

      expect(usePolicyWorkerSelectionAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          policyId: 'policy-123',
          initialWorkerIds: ['worker-1'],
        }),
      );
    });
  });

  describe('Search and Filter', () => {
    it('should update search term when typing in search field', () => {
      renderComponent();

      const searchField = screen.getByTestId('search-field');
      fireEvent.change(searchField, { target: { value: 'John' } });

      expect(searchField).toHaveValue('John');
    });

    it('should update group filter when selecting from dropdown', () => {
      renderComponent();

      const dropdown = screen.getByTestId('group-filter-dropdown');
      fireEvent.change(dropdown, { target: { value: 'NO_GROUP' } });

      expect(dropdown).toHaveValue('NO_GROUP');
    });

    it('should handle specific group filter selection', () => {
      renderComponent();

      const dropdown = screen.getByTestId('group-filter-dropdown');
      fireEvent.change(dropdown, { target: { value: 'group-123' } });

      // Verify the dropdown state updated correctly
      expect(dropdown).toHaveValue('group-123');
    });
  });

  describe('Sort Functionality', () => {
    it('should render worker column header', () => {
      renderComponent();
      // Verify the Worker column header exists
      expect(
        screen.getByText(/NLS overtime.wizard.members.column.worker/i),
      ).toBeInTheDocument();
    });
  });
});
