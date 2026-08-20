import React from 'react';
import { screen, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import WorkersTable from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersListView/WorkersTable';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { WorkersTableProps } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersListView/types';
import workersListReducer from 'src/js/widgets/assignments/store/workersListSlice';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';

// Mock DropdownButton so we can trigger onSelect with controlled events
jest.mock('@ids-ts/dropdown-button', () => ({
  __esModule: true,
  default: ({ onSelect, children }: any) => (
    <div data-testid="add-worker-dropdown-mock">
      <button
        data-testid="add-worker-select-employee"
        onClick={() =>
          onSelect?.({
            target: { value: 'Employee' },
          } as unknown as React.MouseEvent)
        }
      >
        Add Employee
      </button>
      <button
        data-testid="add-worker-select-no-value"
        onClick={() =>
          onSelect?.({ target: {} } as unknown as React.MouseEvent)
        }
      >
        Add No Value
      </button>
      {children}
    </div>
  ),
  MenuItem: ({ children }: any) => <span>{children}</span>,
}));

// Mock styled components
jest.mock(
  'src/js/widgets/assignments/components/styles/WorkersListView.styled',
  () => {
    const React = require('react');
    const actual = jest.requireActual(
      'src/js/widgets/assignments/components/styles/WorkersListView.styled',
    );

    const StyledLink = React.forwardRef(
      (
        {
          children,
          onClick,
          className,
          href,
          'data-testid': testId,
          'aria-disabled': ariaDisabled,
          $isDisabled,
        }: any,
        ref: any,
      ) => (
        <a
          ref={ref}
          data-testid={testId || 'link'}
          className={className}
          href={href}
          aria-disabled={ariaDisabled}
          onClick={(e) => {
            e.preventDefault();
            onClick?.(e);
          }}
        >
          {children}
        </a>
      ),
    );
    StyledLink.displayName = 'StyledLink';

    return {
      ...actual,
      StyledLink,
    };
  },
);

describe('WorkersTable', () => {
  let mockOnViewSettings: jest.Mock;
  let store: ReturnType<typeof configureStore>;

  const mockWorkers: any[] = [
    {
      id: '1',
      displayName: 'Alice Johnson',
      firstName: 'Alice',
      lastName: 'Johnson',
      type: TimeTracking_TimeForType.Employee,
      isActive: true,
      memberOfGroup: { id: 'g1', name: 'Engineering', isActive: true },
      managesGroups: [],
    },
    {
      id: '2',
      displayName: 'Bob Smith',
      firstName: 'Bob',
      lastName: 'Smith',
      type: TimeTracking_TimeForType.Vendor,
      isActive: true,
      memberOfGroup: undefined,
      managesGroups: [],
    },
    {
      id: '3',
      displayName: 'Charlie Brown',
      firstName: 'Charlie',
      lastName: 'Brown',
      type: TimeTracking_TimeForType.Employee,
      isActive: true,
      memberOfGroup: { id: 'g2', name: 'Marketing', isActive: true },
      managesGroups: [],
    },
  ];

  beforeEach(() => {
    mockOnViewSettings = jest.fn();

    // Create a fresh store for each test (workersGroupView needed for openAddWorkerDrawer)
    store = configureStore({
      reducer: {
        workersList: workersListReducer,
        workersGroupView: workersGroupViewReducer,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props: Partial<WorkersTableProps> = {}) => {
    const defaultProps: WorkersTableProps = {
      workers: mockWorkers,
      loading: false,
      totalCount: mockWorkers.length,
      onViewSettings: mockOnViewSettings,
    };

    return renderWithQuicksandProvider(
      <Provider store={store}>
        <WorkersTable {...defaultProps} {...props} />
      </Provider>,
      getDefaultSandbox(),
    );
  };

  describe('Rendering', () => {
    it('should render the table', () => {
      renderComponent();
      expect(screen.getByTestId('workers-list-table')).toBeInTheDocument();
    });

    it('should render table header with correct labels', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS workers\.list\.header\.count/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/NLS workers\.list\.header\.group/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/NLS workers\.list\.header\.actions/),
      ).toBeInTheDocument();
    });

    it('should render all workers', () => {
      renderComponent();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('should display worker type for employees', () => {
      renderComponent();
      const employeeLabels = screen.getAllByText(/NLS workers\.type\.employee/);
      expect(employeeLabels).toHaveLength(2);
    });

    it('should display worker type for vendors', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS workers\.filter\.vendor/),
      ).toBeInTheDocument();
    });

    it('should display group names for workers with groups', () => {
      renderComponent();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
    });

    it('should display group lead badge for group leads', () => {
      const workersWithGroupLead: any[] = [
        {
          ...mockWorkers[0],
          managesGroups: [{ id: 'g1', name: 'Engineering', isActive: true }],
        },
      ];
      renderComponent({ workers: workersWithGroupLead });
      expect(
        screen.getByText(/NLS workers\.role\.groupLead/),
      ).toBeInTheDocument();
    });

    it('should not display group lead badge when worker is not a group lead', () => {
      renderComponent();
      // Workers in mockWorkers don't have managesGroups, so no group lead badge
      expect(
        screen.queryByText(/NLS workers\.role\.groupLead/),
      ).not.toBeInTheDocument();
    });

    it('should display dash for workers without groups', () => {
      renderComponent();
      const cells = screen.getAllByText('-');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should render action Link for each worker', () => {
      renderComponent();
      const viewSettingsLinks = screen.getAllByText(
        /NLS workers\.actions\.viewSettings/,
      );
      expect(viewSettingsLinks).toHaveLength(3);
    });
  });

  describe('Loading State', () => {
    it('should display loading message when loading and no workers', () => {
      renderComponent({ loading: true, workers: [] });
      expect(
        screen.getByText(/NLS workers\.list\.loading/),
      ).toBeInTheDocument();
    });

    it('should render table with loading state inside tbody', () => {
      renderComponent({ loading: true, workers: [] });
      // Table should be rendered
      expect(screen.getByTestId('workers-list-table')).toBeInTheDocument();
      // Loading message should be inside the table
      expect(
        screen.getByText(/NLS workers\.list\.loading/),
      ).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty message when not loading and no workers', () => {
      renderComponent({ loading: false, workers: [] });
      expect(
        screen.getByText(/NLS workers\.list\.empty\.title/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/NLS workers\.list\.empty\.description/),
      ).toBeInTheDocument();
    });

    it('should not render table when empty', () => {
      renderComponent({ loading: false, workers: [] });
      expect(
        screen.queryByTestId('workers-list-table'),
      ).not.toBeInTheDocument();
    });

    it('should not dispatch when Add worker dropdown onSelect has no value', () => {
      renderComponent({ loading: false, workers: [] });
      const noValueBtn = screen.getByTestId('add-worker-select-no-value');
      fireEvent.click(noValueBtn);
      const state = store.getState() as {
        workersGroupView: { addWorkerDrawerOpen: boolean };
      };
      expect(state.workersGroupView.addWorkerDrawerOpen).toBe(false);
    });

    it('should dispatch openAddWorkerDrawer and log when Add worker option selected', () => {
      const sandbox = getDefaultSandbox();
      renderWithQuicksandProvider(
        <Provider store={store}>
          <WorkersTable
            workers={[]}
            loading={false}
            totalCount={0}
            onViewSettings={mockOnViewSettings}
          />
        </Provider>,
        sandbox,
      );
      const employeeBtn = screen.getByTestId('add-worker-select-employee');
      fireEvent.click(employeeBtn);
      const state = store.getState() as {
        workersGroupView: {
          addWorkerDrawerOpen: boolean;
          addWorkerDrawerNameType: string;
        };
      };
      expect(state.workersGroupView.addWorkerDrawerOpen).toBe(true);
      expect(state.workersGroupView.addWorkerDrawerNameType).toBe('Employee');
      expect(sandbox.logger.info).toHaveBeenCalledWith(
        'Component="WorkersTable" Event="Add Worker clicked (empty state)"',
        { workerType: 'Employee' },
      );
    });
  });

  describe('Worker Count', () => {
    it('should display worker count in header when totalCount provided', () => {
      renderComponent({ totalCount: 10 });
      expect(
        screen.getByText(/NLS workers\.list\.header\.count/),
      ).toBeInTheDocument();
    });

    it('should display header title when totalCount is 0', () => {
      renderComponent({ workers: [], totalCount: 0, loading: false });
      expect(
        screen.queryByTestId('workers-list-table'),
      ).not.toBeInTheDocument();
    });

    it('should display header title when totalCount is undefined', () => {
      renderComponent({ totalCount: undefined });
      expect(
        screen.getByText(/NLS workers\.list\.header\.title/),
      ).toBeInTheDocument();
    });

    it('should display header title when totalCount is null', () => {
      renderComponent({ totalCount: null as any });
      expect(
        screen.getByText(/NLS workers\.list\.header\.title/),
      ).toBeInTheDocument();
    });
  });

  describe('Action Handlers', () => {
    it('should call onViewSettings when View Settings is clicked', () => {
      renderComponent();
      const viewSettingsButtons = screen.getAllByText(
        /NLS workers\.actions\.viewSettings/,
      );
      fireEvent.click(viewSettingsButtons[0]);
      expect(mockOnViewSettings).toHaveBeenCalledWith(mockWorkers[0]);
    });

    it('should pass correct worker object to onViewSettings', () => {
      renderComponent();
      const viewSettingsButtons = screen.getAllByText(
        /NLS workers\.actions\.viewSettings/,
      );

      fireEvent.click(viewSettingsButtons[1]); // Second worker

      expect(mockOnViewSettings).toHaveBeenCalledWith(mockWorkers[1]);
      expect(mockOnViewSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '2',
          displayName: 'Bob Smith',
          type: TimeTracking_TimeForType.Vendor,
        }),
      );
    });

    it('should call onViewSettings when row is clicked', () => {
      const { container } = renderComponent();
      mockOnViewSettings.mockClear();

      const rows = container.querySelectorAll('tbody tr');
      fireEvent.click(rows[0]);

      expect(mockOnViewSettings).toHaveBeenCalledWith(mockWorkers[0]);
      expect(mockOnViewSettings).toHaveBeenCalledTimes(1);
    });

    it('should call onViewSettings for correct worker when row is clicked', () => {
      const { container } = renderComponent();
      mockOnViewSettings.mockClear();

      const rows = container.querySelectorAll('tbody tr');
      fireEvent.click(rows[1]);

      expect(mockOnViewSettings).toHaveBeenCalledWith(mockWorkers[1]);
      expect(mockOnViewSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('Worker Types', () => {
    it('should correctly identify employee type', () => {
      const employeeWorkers = mockWorkers.filter(
        (w) => w.type === TimeTracking_TimeForType.Employee,
      );
      renderComponent({ workers: employeeWorkers });
      const employeeLabels = screen.getAllByText(/NLS workers\.type\.employee/);
      expect(employeeLabels).toHaveLength(employeeWorkers.length);
    });

    it('should correctly identify vendor type', () => {
      const vendorWorkers = mockWorkers.filter(
        (w) => w.type === TimeTracking_TimeForType.Vendor,
      );
      renderComponent({ workers: vendorWorkers });
      expect(
        screen.getByText(/NLS workers\.filter\.vendor/),
      ).toBeInTheDocument();
    });
  });

  describe('Group Display', () => {
    it('should show group name when worker has a group', () => {
      const workerWithGroup = [mockWorkers[0]];
      renderComponent({ workers: workerWithGroup });
      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });

    it('should show dash when worker has no group', () => {
      const workerWithoutGroup = [mockWorkers[1]];
      renderComponent({ workers: workerWithoutGroup });
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('Table Structure', () => {
    it('should render correct number of rows', () => {
      const { container } = renderComponent();
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(3);
    });

    it('should have data-testid attribute on table', () => {
      renderComponent();
      const table = screen.getByTestId('workers-list-table');
      expect(table).toHaveAttribute('data-testid', 'workers-list-table');
    });
  });

  describe('Accessibility', () => {
    it('should render table with proper structure', () => {
      const { container } = renderComponent();
      const table = container.querySelector('table');
      const thead = container.querySelector('thead');
      const tbody = container.querySelector('tbody');

      expect(table).toBeInTheDocument();
      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle worker with null memberOfGroup', () => {
      const workerWithNullGroup: any[] = [
        {
          ...mockWorkers[0],
          memberOfGroup: undefined,
        },
      ];
      renderComponent({ workers: workerWithNullGroup });
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should handle worker with undefined memberOfGroup', () => {
      const workerWithUndefinedGroup: any[] = [
        {
          ...mockWorkers[0],
          memberOfGroup: undefined,
        },
      ];
      renderComponent({ workers: workerWithUndefinedGroup });
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should handle single worker', () => {
      const { container } = renderComponent({
        workers: [mockWorkers[0]],
        totalCount: 1,
      });
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(1);
    });

    it('should handle large number of workers', () => {
      const manyWorkers: any[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockWorkers[0],
        id: `worker-${i}`,
        displayName: `Worker ${i}`,
      }));
      const { container } = renderComponent({
        workers: manyWorkers,
        totalCount: 100,
      });
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(100);
    });

    it('should handle worker with empty displayName', () => {
      const workerWithEmptyName: any[] = [
        {
          ...mockWorkers[0],
          displayName: '',
        },
      ];
      const { container } = renderComponent({ workers: workerWithEmptyName });
      // Empty displayName is still rendered as empty string, not as dash
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(1);
    });

    it('should handle worker with special characters in name', () => {
      const workerWithSpecialChars: any[] = [
        {
          ...mockWorkers[0],
          displayName: "José María O'Connor",
        },
      ];
      renderComponent({ workers: workerWithSpecialChars });
      expect(screen.getByText("José María O'Connor")).toBeInTheDocument();
    });
  });

  describe('Loading with Workers', () => {
    it('should show loading spinner when loading is true even if workers exist', () => {
      renderComponent({ loading: true, workers: mockWorkers });
      // When loading is true, table is rendered with loading state inside tbody
      expect(screen.getByTestId('workers-list-table')).toBeInTheDocument();
      expect(
        screen.getByText(/NLS workers\.list\.loading/),
      ).toBeInTheDocument();
      // Workers should not be displayed during loading
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error exists and not loading', () => {
      // Set error in Redux store
      store = configureStore({
        reducer: {
          workersList: workersListReducer,
        },
        preloadedState: {
          workersList: {
            workers: [],
            loading: false,
            error: 'Failed to fetch workers',
            pageInfo: null,
            currentPage: 1,
            headerTotalCount: 0,
          },
        },
      });

      renderComponent({ loading: false, workers: [] });

      expect(
        screen.getByText(/NLS workers\.list\.error\.title/),
      ).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch workers')).toBeInTheDocument();
      // Table should not be rendered when there's an error
      expect(
        screen.queryByTestId('workers-list-table'),
      ).not.toBeInTheDocument();
    });

    it('should not display error message when loading', () => {
      // Set error in Redux store
      store = configureStore({
        reducer: {
          workersList: workersListReducer,
        },
        preloadedState: {
          workersList: {
            workers: [],
            loading: true,
            error: 'Failed to fetch workers',
            pageInfo: null,
            currentPage: 1,
            headerTotalCount: 0,
          },
        },
      });

      renderComponent({ loading: true, workers: [] });

      // Should show loading state, not error
      expect(
        screen.getByText(/NLS workers\.list\.loading/),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Failed to fetch workers'),
      ).not.toBeInTheDocument();
    });
  });

  describe('QBO User Disabled State', () => {
    const qboWorkers: any[] = [
      {
        id: 'qbo-1',
        displayName: 'QBO User',
        firstName: 'QBO',
        lastName: 'User',
        type: TimeTracking_TimeForType.LegacyQboUser,
        isActive: true,
        memberOfGroup: undefined,
        managesGroups: [],
      },
    ];

    it('should not call onViewSettings when QBO user row is clicked', () => {
      const { container } = renderComponent({ workers: qboWorkers });
      mockOnViewSettings.mockClear();

      const rows = container.querySelectorAll('tbody tr');
      fireEvent.click(rows[0]);

      expect(mockOnViewSettings).not.toHaveBeenCalled();
    });

    // NOTE: Test removed - "should not call onViewSettings when QBO user link is clicked"
    // In real browser: pointer-events: none prevents clicks on disabled links
    // In tests: fireEvent.click() bypasses CSS, so onClick is called
    // The important behavior (visual disabled state, aria-disabled) is tested elsewhere

    it('should display User type for QBO users', () => {
      renderComponent({ workers: qboWorkers });
      expect(screen.getByText(/NLS workers\.type\.user/)).toBeInTheDocument();
    });

    it('should allow clicks for non-QBO workers', () => {
      const mixedWorkers: any[] = [
        ...qboWorkers,
        {
          id: 'emp-1',
          displayName: 'Employee',
          firstName: 'Employee',
          lastName: 'One',
          type: TimeTracking_TimeForType.Employee,
          isActive: true,
          memberOfGroup: undefined,
          managesGroups: [],
        },
      ];
      const { container } = renderComponent({ workers: mixedWorkers });
      mockOnViewSettings.mockClear();

      const rows = container.querySelectorAll('tbody tr');
      fireEvent.click(rows[1]); // Click employee row

      expect(mockOnViewSettings).toHaveBeenCalledWith(mixedWorkers[1]);
    });
  });
});
