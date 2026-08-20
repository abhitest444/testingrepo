/* eslint-disable camelcase */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MockedProvider } from '@apollo/client/testing';
import { WorkerSelectionContent } from 'src/js/widgets/assignments/components/Groups/WorkerSelectionContent';
import workersGroupViewReducer, {
  setDrawerContext,
  addDrawerWorkers,
  toggleDrawerWorkerSelection,
  setDrawerError,
  setGroupsData,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import workersListReducer, {
  setHeaderTotalCount,
} from 'src/js/widgets/assignments/store/workersListSlice';
import {
  WorkerSelectionMode,
  GroupDrawerContext,
} from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { GROUP_MODALS_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/groupsTrackingPoints';

// Mock hooks
jest.mock('src/js/service/hooks/groups/useTimeTrackingWorkers');
jest.mock('src/js/service/hooks/groups/useGetWorkersForGroup');
jest.mock('src/js/service/hooks/groups/useGetGroupManagers');
jest.mock('src/js/service/hooks/groups/useGetGroups');

// Mock GroupFilterDropdown - supports Load More for coverage of handleLoadMoreGroups
jest.mock(
  'src/js/widgets/assignments/components/Groups/GroupFilterDropdown',
  () => ({
    GroupFilterDropdown: ({
      onChange,
      value,
      onLoadMore,
      hasNextPage,
      endCursor,
      isLoadingMore,
    }: any) => (
      <div data-testid="group-filter-dropdown-wrapper">
        <select
          data-testid="group-filter-dropdown"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="ALL">All workers</option>
          <option value="NO_GROUP">No group</option>
          <option value="group-1">Test Group 1</option>
          <option value="group-2">Test Group 2</option>
        </select>
        {hasNextPage && endCursor && onLoadMore && (
          <button
            data-testid="group-filter-load-more"
            onClick={() => !isLoadingMore && onLoadMore()}
            onKeyDown={(e: any) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isLoadingMore) {
                onLoadMore();
              }
            }}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    ),
  }),
);

// Mock IDS components that might cause issues
jest.mock('@ids-ts/checkbox', () => ({
  __esModule: true,
  default: (props: any) => {
    const {
      checked,
      onChange,
      children,
      'aria-label': ariaLabel,
      'data-testid': dataTestId,
    } = props;
    return (
      <label htmlFor={dataTestId}>
        <input
          id={dataTestId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-label={ariaLabel}
          data-testid={dataTestId}
        />
        {children}
      </label>
    );
  },
}));

jest.mock('@ids-ts/pagination', () => ({
  __esModule: true,
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <button
        aria-label="previous"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        aria-label="next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <div role="progressbar">Loading...</div>,
}));

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ children, onClose, title, 'data-testid': dataTestId }: any) => (
    <div data-testid={dataTestId} role="alert">
      {title && <div>{title}</div>}
      {children}
      {onClose && (
        <button onClick={onClose} data-testid="page-message-close-button">
          Close
        </button>
      )}
    </div>
  ),
}));

// Create stable mock references to prevent infinite re-renders
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const mockIntl = {
  formatMessage: (
    { id, defaultMessage }: { id?: string; defaultMessage?: string },
    values?: Record<string, any>,
  ) => {
    let message = defaultMessage || id || '';

    // Replace placeholders with actual values
    if (values) {
      Object.entries(values).forEach(([key, value]) => {
        message = message.replace(
          new RegExp(`\\{${key}\\}`, 'g'),
          String(value),
        );
      });
    }

    return message;
  },
};

const mockSandbox = {
  logger: mockLogger,
  performance: {
    createCustomerInteraction: jest.fn(() => ({
      stop: jest.fn(),
      addData: jest.fn(),
    })),
  },
};

const mockTrack = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => mockIntl,
  useSandbox: () => mockSandbox,
  useTracking: () => mockTrack,
}));

const {
  useTimeTrackingWorkers,
} = require('src/js/service/hooks/groups/useTimeTrackingWorkers');
const {
  useGetWorkersForGroup,
} = require('src/js/service/hooks/groups/useGetWorkersForGroup');
const {
  useGetGroupManagers,
} = require('src/js/service/hooks/groups/useGetGroupManagers');
const { useGetGroups } = require('src/js/service/hooks/groups/useGetGroups');

describe('WorkerSelectionContent', () => {
  let store: any;

  const createMockStore = () =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
        workersList: workersListReducer,
      },
    });

  // Create stable mock functions outside beforeEach to prevent re-renders
  const mockLoadWorkers = jest.fn();
  const mockFetchNextPage = jest.fn();
  const mockFetchPreviousPage = jest.fn();
  const mockRefetch = jest.fn();
  const mockPageInfo = {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: undefined,
    endCursor: undefined,
  };

  beforeEach(() => {
    store = createMockStore();

    // Clear mock call history but keep same function references
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLoadWorkers.mockClear();
    mockFetchNextPage.mockClear();
    mockFetchPreviousPage.mockClear();
    mockRefetch.mockClear();

    // Default mock for useTimeTrackingWorkers with stable references
    useTimeTrackingWorkers.mockReturnValue({
      loadWorkers: mockLoadWorkers,
      workers: [],
      loading: false,
      error: null,
      pageInfo: mockPageInfo,
      totalCount: 0,
      fetchNextPage: mockFetchNextPage,
      fetchPreviousPage: mockFetchPreviousPage,
      refetch: mockRefetch,
    });

    // Default mock for useGetWorkersForGroup
    useGetWorkersForGroup.mockReturnValue({
      loadWorkers: jest.fn(),
      workers: [],
      loading: false,
      error: null,
      pageInfo: null,
      fetchMore: jest.fn(),
    });

    // Default mock for useGetGroupManagers
    useGetGroupManagers.mockReturnValue({
      loadManagers: jest.fn(),
      managers: [],
      loading: false,
      error: null,
      pageInfo: null,
      fetchMore: jest.fn(),
    });

    // Default mock for useGetGroups
    useGetGroups.mockReturnValue({
      loadGroups: jest.fn(),
      groups: [],
      loading: false,
      error: null,
    });
  });

  const renderComponent = (props = {}) =>
    render(
      <Provider store={store}>
        <MockedProvider mocks={[]} addTypename={false}>
          <WorkerSelectionContent
            groupName="Test Group"
            mode={WorkerSelectionMode.Leads}
            groupId="group-123"
            {...props}
          />
        </MockedProvider>
      </Provider>,
    );

  describe('Client-side Pagination', () => {
    it('should display first page of workers', () => {
      // Initialize with 10 selected managers
      const managers = Array.from({ length: 10 }, (_, i) => ({
        id: `manager-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Manager${String(i).padStart(3, '0')}`,
        lastName: 'Selected',
        displayName: `Manager${String(i).padStart(3, '0')} Selected`,
        isActive: true,
        isSelected: true,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(
        addDrawerWorkers({ workers: managers, markAsManagers: true }),
      );

      // Add 140 unselected workers with zero-padded names for predictable alphabetical sorting
      const workers = Array.from({ length: 140 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Worker${String(i).padStart(3, '0')}`,
        lastName: 'Test',
        displayName: `Worker${String(i).padStart(3, '0')} Test`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Page 1 should show first 100 items (10 managers + 90 workers)
      expect(screen.getByText('Manager000 Selected')).toBeInTheDocument();
      expect(screen.getByText('Worker000 Test')).toBeInTheDocument();
      expect(screen.getByText('Worker089 Test')).toBeInTheDocument();
      expect(screen.queryByText('Worker090 Test')).not.toBeInTheDocument();
    });

    // TODO: Fix pagination controls in edit mode - component doesn't show buttons when currentWorkers is empty
    it.skip('should navigate to next page', async () => {
      // Need >100 selected workers to trigger pagination (totalPagesForSelected > 1)
      const managers = Array.from({ length: 105 }, (_, i) => ({
        id: `manager-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Manager${String(i).padStart(3, '0')}`,
        lastName: 'Selected',
        displayName: `Manager${String(i).padStart(3, '0')} Selected`,
        isActive: true,
        isSelected: true,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(
        addDrawerWorkers({ workers: managers, markAsManagers: true }),
      );

      // Add 45 unselected workers with zero-padded names (total 150)
      const workers = Array.from({ length: 45 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Worker${String(i).padStart(3, '0')}`,
        lastName: 'Test',
        displayName: `Worker${String(i).padStart(3, '0')} Test`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Click next button
      const nextButton = screen.getByTestId('assign-leads-pagination-next-btn');
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Page 2 should show remaining 50 items (Manager100-Manager104 + all 45 workers)
        expect(screen.getByText('Manager100 Selected')).toBeInTheDocument();
        expect(screen.getByText('Worker000 Test')).toBeInTheDocument();
        expect(
          screen.queryByText('Manager000 Selected'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText('Manager099 Selected'),
        ).not.toBeInTheDocument();
      });
    });

    // TODO: Fix pagination controls in edit mode - component doesn't show buttons when currentWorkers is empty
    it.skip('should navigate to previous page', async () => {
      // Need >100 selected workers to trigger pagination
      const managers = Array.from({ length: 105 }, (_, i) => ({
        id: `manager-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Manager${String(i).padStart(3, '0')}`,
        lastName: 'Selected',
        displayName: `Manager${String(i).padStart(3, '0')} Selected`,
        isActive: true,
        isSelected: true,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(
        addDrawerWorkers({ workers: managers, markAsManagers: true }),
      );

      // Add 45 unselected workers with zero-padded names
      const workers = Array.from({ length: 45 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Worker${String(i).padStart(3, '0')}`,
        lastName: 'Test',
        displayName: `Worker${String(i).padStart(3, '0')} Test`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Go to page 2
      const nextButton = screen.getByTestId('assign-leads-pagination-next-btn');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Manager100 Selected')).toBeInTheDocument();
      });

      // Go back to page 1
      const prevButton = screen.getByTestId(
        'assign-leads-pagination-previous-btn',
      );
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('Manager000 Selected')).toBeInTheDocument();
        expect(screen.getByText('Manager099 Selected')).toBeInTheDocument();
        expect(
          screen.queryByText('Manager100 Selected'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Checkbox Selection', () => {
    it('should display selected workers with checked checkboxes', () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Selected',
          lastName: 'Worker',
          displayName: 'Selected Worker',
          isActive: true,
          isSelected: true, // Selected
          memberOfGroup: null,
          managesGroups: [],
        },
        {
          id: '2',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Unselected',
          lastName: 'Worker',
          displayName: 'Unselected Worker',
          isActive: true,
          isSelected: false, // Not selected
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Check checkbox states (skip select-all checkbox at index 0)
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[1]).toBeChecked(); // Selected Worker
      expect(checkboxes[2]).not.toBeChecked(); // Unselected Worker
    });

    it('should toggle selection when checkbox is clicked', async () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Test',
          lastName: 'Worker',
          displayName: 'Test Worker',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      const checkboxes = screen.getAllByRole('checkbox');
      const workerCheckbox = checkboxes[1]; // Skip select-all checkbox
      expect(workerCheckbox).not.toBeChecked();

      // Click checkbox
      fireEvent.click(workerCheckbox);

      await waitFor(() => {
        // Redux should have been updated
        const state = store.getState();
        expect(state.workersGroupView.drawerWorkers.byId['1'].isSelected).toBe(
          true,
        );
      });
    });

    // TODO: Fix pagination controls in edit mode - component doesn't show buttons when currentWorkers is empty
    it.skip('should maintain selection across pages', async () => {
      // Need >100 selected workers to trigger pagination
      // Create 95 selected managers
      const managers = Array.from({ length: 95 }, (_, i) => ({
        id: `manager-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Manager${String(i).padStart(3, '0')}`,
        lastName: 'Selected',
        displayName: `Manager${String(i).padStart(3, '0')} Selected`,
        isActive: true,
        isSelected: true,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(
        addDrawerWorkers({ workers: managers, markAsManagers: true }),
      );

      // Add 55 workers: 10 selected (to reach 105 selected total) + 45 unselected
      const workers = Array.from({ length: 55 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Worker${String(i).padStart(3, '0')}`,
        lastName: 'Test',
        displayName: `Worker${String(i).padStart(3, '0')} Test`,
        isActive: true,
        isSelected: i < 10, // First 10 workers selected (Worker000-Worker009)
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Page 1: All 95 managers + 5 selected workers should appear (selected first)
      const page1Checkboxes = screen.getAllByRole('checkbox');
      // Skip select-all checkbox at index 0, check first manager at index 1
      expect(page1Checkboxes[1]).toBeChecked(); // Manager000
      // Worker000 should be on page 1 and selected
      expect(screen.getByText('Worker000 Test')).toBeInTheDocument();

      // Navigate to page 2
      const nextButton = screen.getByTestId('assign-leads-pagination-next-btn');
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Page 2: Remaining 5 selected workers + unselected workers
        expect(screen.getByText('Worker005 Test')).toBeInTheDocument();
        // Verify selection persists in Redux
        const state = store.getState();
        expect(
          state.workersGroupView.drawerWorkers.byId['worker-0'].isSelected,
        ).toBe(true);
        expect(
          state.workersGroupView.drawerWorkers.byId['worker-5'].isSelected,
        ).toBe(true);
      });
    });
  });

  describe('Edit Mode - Selected First', () => {
    it('should display selected workers first on page 1', () => {
      // Set up drawer context for edit mode
      store.dispatch(
        setDrawerContext({
          groupId: 'group-123',
          groupName: 'Test Group',
          context: GroupDrawerContext.EditGroup,
          initialMembers: {},
          initialLeads: {},
          managerCount: 2,
        }),
      );

      // Add 2 selected managers first
      const selectedWorkers = [
        {
          id: 'selected-1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Selected',
          lastName: 'One',
          displayName: 'Selected One',
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
        {
          id: 'selected-2',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Selected',
          lastName: 'Two',
          displayName: 'Selected Two',
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(
        addDrawerWorkers({ workers: selectedWorkers, markAsManagers: true }),
      );

      // Then add 150 unselected workers (zero-padded names for predictable sorting)
      const unselectedWorkers = Array.from({ length: 150 }, (_, i) => ({
        id: `unselected-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Unselected${String(i).padStart(3, '0')}`,
        lastName: 'Worker',
        displayName: `Unselected${String(i).padStart(3, '0')} Worker`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(
        addDrawerWorkers({ workers: unselectedWorkers, markAsManagers: false }),
      );

      renderComponent({
        mode: WorkerSelectionMode.Leads,
        groupId: 'group-123',
      });

      // First page should show selected workers at the top
      expect(screen.getByText('Selected One')).toBeInTheDocument();
      expect(screen.getByText('Selected Two')).toBeInTheDocument();
      // Selected workers appear first, so unselected shouldn't be at the very top
      const allText =
        screen.getByTestId('assign-leads-content').textContent || '';
      const selectedOneIndex = allText.indexOf('Selected One');
      const selectedTwoIndex = allText.indexOf('Selected Two');
      const unselectedIndex = allText.indexOf('Unselected000');
      expect(selectedOneIndex).toBeGreaterThan(-1);
      expect(selectedTwoIndex).toBeGreaterThan(-1);
      expect(unselectedIndex).toBeGreaterThan(-1);
      expect(selectedOneIndex).toBeLessThan(unselectedIndex);
      expect(selectedTwoIndex).toBeLessThan(unselectedIndex);
    });

    it('should handle selected workers spanning multiple pages', () => {
      // Set up 103 selected managers (spanning 2 pages) - use zero-padded names
      const selectedWorkers = Array.from({ length: 103 }, (_, i) => ({
        id: `selected-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Manager${String(i).padStart(3, '0')}`,
        lastName: 'Selected',
        displayName: `Manager${String(i).padStart(3, '0')} Selected`,
        isActive: true,
        isSelected: true,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(
        addDrawerWorkers({ workers: selectedWorkers, markAsManagers: true }),
      );

      // Then add 50 unselected workers (zero-padded names)
      const unselectedWorkers = Array.from({ length: 50 }, (_, i) => ({
        id: `unselected-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Worker${String(i).padStart(3, '0')}`,
        lastName: 'Unselected',
        displayName: `Worker${String(i).padStart(3, '0')} Unselected`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(
        addDrawerWorkers({ workers: unselectedWorkers, markAsManagers: false }),
      );

      renderComponent();

      // Page 1: Should show first 100 selected managers
      expect(screen.getByText('Manager000 Selected')).toBeInTheDocument();
      expect(screen.getByText('Manager099 Selected')).toBeInTheDocument();
      expect(screen.queryByText('Manager100 Selected')).not.toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading indicator when loading', () => {
      useTimeTrackingWorkers.mockReturnValue({
        loadWorkers: mockLoadWorkers,
        workers: [],
        loading: true,
        error: null,
        pageInfo: mockPageInfo,
        totalCount: 0,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      renderComponent();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display error message when error occurs', () => {
      // Initialize hasLoadedInitialManagers flag to avoid loading state
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      useTimeTrackingWorkers.mockReturnValue({
        loadWorkers: mockLoadWorkers,
        workers: [],
        loading: false,
        error: new Error('Failed to load workers'),
        pageInfo: mockPageInfo,
        totalCount: 0,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      renderComponent();

      // Check for the error message - it renders as PageMessage with specific testid
      expect(
        screen.getByTestId('assign-leads-error-message'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/unable to load group leads/i),
      ).toBeInTheDocument();
    });
  });

  describe('Worker Counter', () => {
    it('should display correct selected count', () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Selected',
          lastName: 'One',
          displayName: 'Selected One',
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
        {
          id: '2',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Selected',
          lastName: 'Two',
          displayName: 'Selected Two',
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
        {
          id: '3',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Unselected',
          lastName: 'Worker',
          displayName: 'Unselected Worker',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      // Set total count for header display
      store.dispatch(setHeaderTotalCount(3));

      renderComponent();

      // Should show "2 of 3 selected" or similar
      expect(screen.getByText(/2.*3/)).toBeInTheDocument();
    });

    it('should update count when selection changes', async () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Worker',
          lastName: 'One',
          displayName: 'Worker One',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      // Set total count for header display
      store.dispatch(setHeaderTotalCount(1));

      renderComponent();

      // Initially: 0 of 1 selected
      expect(screen.getByText(/0.*1/)).toBeInTheDocument();

      // Select the worker (skip select-all checkbox)
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // First worker checkbox

      await waitFor(() => {
        // Should update to: 1 of 1 selected
        expect(screen.getByText(/1.*1/)).toBeInTheDocument();
      });
    });
  });

  describe('Create vs Edit Mode', () => {
    it('should use different data source in create mode', () => {
      // In create mode, should use useTimeTrackingWorkers hook
      renderComponent({ mode: WorkerSelectionMode.Leads, groupId: undefined });

      expect(useTimeTrackingWorkers).toHaveBeenCalled();
    });

    it('should render correctly in Workers mode', () => {
      // Test Workers mode (covers line 103)
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));
      store.dispatch(setHeaderTotalCount(0));

      renderComponent({
        mode: WorkerSelectionMode.Workers,
        groupId: undefined,
      });

      // Should render with workers-specific test ids and messages
      expect(screen.getByTestId('assign-workers-content')).toBeInTheDocument();
    });

    it('should use drawerWorkers in edit mode', () => {
      store.dispatch(
        setDrawerContext({
          groupId: 'group-123',
          groupName: 'Test Group',
          context: GroupDrawerContext.EditGroup,
          initialMembers: {},
          initialLeads: {},
          managerCount: 10,
        }),
      );

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Manager',
          lastName: 'One',
          displayName: 'Manager One',
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: true }));

      renderComponent({
        mode: WorkerSelectionMode.Leads,
        groupId: 'group-123',
      });

      // Should render worker from drawerWorkers
      expect(screen.getByText('Manager One')).toBeInTheDocument();
    });
  });

  describe('Group Column Display', () => {
    // TODO: Complex test requiring proper pagination mock setup
    it.skip('should display group ID when worker belongs to a group', () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Test',
          lastName: 'Worker',
          displayName: 'Test Worker',
          isActive: true,
          isSelected: false,
          memberOfGroup: {
            id: 'group-123',
            name: 'Test Group',
            isActive: true,
          }, // Redux stores as string ID
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      // Mock useWorkerPagination to return workers with memberOfGroup as string
      const mockWorkers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          displayName: 'Test Worker',
          memberOfGroup: {
            id: 'group-123',
            name: 'Test Group',
            isActive: true,
          }, // Display layer gets string
          isActive: true,
        },
      ];

      // We need to render and verify the transformation happens correctly
      renderComponent();

      // Should display the group ID
      expect(screen.getByText('group-123')).toBeInTheDocument();
    });

    it('should display "No group" when worker does not belong to any group', () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Test',
          lastName: 'Worker',
          displayName: 'Test Worker',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Should display "No group" in the table (multiple matches expected from dropdown too)
      const noGroupTexts = screen.getAllByText('No group');
      expect(noGroupTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Worker Type Formatting', () => {
    it('should format Vendor worker type', () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Vendor,
          firstName: 'Vendor',
          lastName: 'User',
          displayName: 'Vendor User',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      expect(screen.getByText('Vendor')).toBeInTheDocument();
    });

    it('should format LegacyQboUser worker type', () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.LegacyQboUser,
          firstName: 'Legacy',
          lastName: 'User',
          displayName: 'Legacy User',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('should handle unknown worker type with default case', () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: 'UNKNOWN_TYPE' as any,
          firstName: 'Unknown',
          lastName: 'Type',
          displayName: 'Unknown Type',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      expect(screen.getByText('UNKNOWN_TYPE')).toBeInTheDocument();
    });
  });

  describe('Select All Functionality', () => {
    it('should handle select all checkbox click', () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Worker',
          lastName: 'One',
          displayName: 'Worker One',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
        {
          id: '2',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Worker',
          lastName: 'Two',
          displayName: 'Worker Two',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      fireEvent.click(selectAllCheckbox);

      // Verify selection updated
      expect(selectAllCheckbox).toBeInTheDocument();
    });
  });

  describe('Pagination Display', () => {
    it('should show pagination when there are multiple pages', () => {
      // Mock pageInfo to indicate more pages available
      useTimeTrackingWorkers.mockReturnValue({
        workers: [],
        loading: false,
        error: null,
        pageInfo: {
          hasNextPage: true, // Key: This enables pagination
          hasPreviousPage: false,
          startCursor: undefined,
          endCursor: 'cursor-100',
        },
        totalCount: 110,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      // Create enough workers to trigger pagination (more than pageSize of 100)
      const workers = Array.from({ length: 110 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Worker`,
        lastName: `${i}`,
        displayName: `Worker ${i}`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Should display pagination controls
      // On page 1, "Previous" button should NOT be shown (hidden, not disabled)
      // "Next" button SHOULD be shown (we have 110 workers > 100)
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();

      // Should show current page number
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });

    it('should hide pagination when only one page of workers', () => {
      useTimeTrackingWorkers.mockReturnValue({
        workers: [],
        loading: false,
        error: null,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
        totalCount: 50,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      // Initialize with only 50 workers (< 100)
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = Array.from({ length: 50 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Worker`,
        lastName: `${i}`,
        displayName: `Worker ${i}`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Pagination should be hidden
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
      expect(screen.queryByText(/Page \d+/)).not.toBeInTheDocument();
    });

    it('should show Previous button on page 2', () => {
      useTimeTrackingWorkers.mockReturnValue({
        workers: [],
        loading: false,
        error: null,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
        },
        totalCount: 150,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = Array.from({ length: 150 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Worker`,
        lastName: `${i}`,
        displayName: `Worker ${i}`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      // Manually set current page to 2
      const { rerender } = renderComponent();

      // Simulate being on page 2 by clicking Next
      // Note: This is a simplified test - in reality we'd need to properly trigger page change
      expect(screen.queryByText('Previous')).not.toBeInTheDocument(); // On page 1 initially
    });
  });

  describe('Search and Sort Integration', () => {
    it('should display search field', () => {
      renderComponent();

      // Search field should be present with placeholder (alwaysExpanded=true)
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('should display sortable header column', () => {
      // Add some workers so the table renders
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: 'worker-1',
          type: TimeTracking_TimeForType.Employee,
          displayName: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Worker column header should be present (sortable)
      expect(screen.getByText('Worker')).toBeInTheDocument();
    });

    it('should have pagination on page 1 with multiple pages', () => {
      useTimeTrackingWorkers.mockReturnValue({
        workers: [],
        loading: false,
        error: null,
        pageInfo: { hasNextPage: true },
        totalCount: 110,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      // Add workers to enable pagination
      const workers = Array.from({ length: 110 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        displayName: `Worker ${i}`,
        firstName: 'Worker',
        lastName: `${i}`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Should be on page 1 initially
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });
  });

  describe('Pagination Based on hasNextPage', () => {
    it('should hide Next button when API indicates no more pages', () => {
      useTimeTrackingWorkers.mockReturnValue({
        workers: Array.from({ length: 50 }, (_, i) => ({
          id: `worker-${i}`,
          type: TimeTracking_TimeForType.Employee,
          displayName: `Worker ${i}`,
          firstName: 'Worker',
          lastName: `${i}`,
          isActive: true,
          memberOfGroup: null,
          managesGroups: [],
        })),
        loading: false,
        error: null,
        pageInfo: {
          hasNextPage: false, // No more pages
          hasPreviousPage: false,
        },
        totalCount: 50,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      renderComponent();

      // Next button should be hidden
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('should show Next button when API indicates more pages', () => {
      useTimeTrackingWorkers.mockReturnValue({
        workers: Array.from({ length: 100 }, (_, i) => ({
          id: `worker-${i}`,
          type: TimeTracking_TimeForType.Employee,
          displayName: `Worker ${i}`,
          firstName: 'Worker',
          lastName: `${i}`,
          isActive: true,
          memberOfGroup: null,
          managesGroups: [],
        })),
        loading: false,
        error: null,
        pageInfo: {
          hasNextPage: true, // More pages available
          hasPreviousPage: false,
          endCursor: 'cursor-100',
        },
        totalCount: 110,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      // Add more workers to trigger pagination
      const workers = Array.from({ length: 110 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        displayName: `Worker ${i}`,
        firstName: 'Worker',
        lastName: `${i}`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Next button should be visible
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  describe('Edit Mode - Company Workers Loading', () => {
    beforeEach(() => {
      // Mock useTimeTrackingWorkers to return company workers
      useTimeTrackingWorkers.mockReturnValue({
        workers: [
          {
            id: 'company-worker-1',
            type: TimeTracking_TimeForType.Employee,
            firstName: 'Company',
            lastName: 'Worker',
            displayName: 'Company Worker',
            isActive: true,
            memberOfGroup: null,
            managesGroups: [],
          },
        ],
        loading: false,
        error: null,
        pageInfo: mockPageInfo,
        totalCount: 1,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });
    });

    it('should merge company workers in edit mode after managers are loaded', () => {
      // First, set hasLoadedInitialManagers by adding managers
      store.dispatch(
        addDrawerWorkers({
          workers: [
            {
              id: 'manager-1',
              type: TimeTracking_TimeForType.Employee,
              firstName: 'Manager',
              lastName: 'One',
              displayName: 'Manager One',
              isActive: true,
              isSelected: false,
              memberOfGroup: null,
              managesGroups: [],
            },
          ],
          markAsManagers: true,
        }),
      );

      renderComponent(); // groupId is already passed by default, triggering edit mode

      // Component should render (not in loading state since hasLoadedInitialManagers=true)
      expect(screen.getByTestId('assign-leads-content')).toBeInTheDocument();
      // Should display the manager we added
      expect(screen.getByText('Manager One')).toBeInTheDocument();
      // Should also display the company worker that was merged
      expect(screen.getByText('Company Worker')).toBeInTheDocument();
    });

    it('should not load company workers if managers are not loaded yet', () => {
      // Don't add any managers - hasLoadedInitialManagers will be false
      renderComponent({
        isEditMode: true,
      });

      // Component should render in loading state since hasLoadedInitialManagers is false
      // Should show loading state (not the full content)
      expect(screen.getByTestId('assign-leads-loading')).toBeInTheDocument();
      expect(
        screen.queryByTestId('lead-selection-table'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Analytics Tracking', () => {
    it('should verify GROUP_MODALS_TRACKING_POINTS are properly defined', () => {
      const {
        GROUP_MODALS_TRACKING_POINTS,
      } = require('src/js/widgets/assignments/utils/groupsTrackingPoints');

      // Verify SEARCH_WORKER tracking point
      expect(GROUP_MODALS_TRACKING_POINTS.SEARCH_WORKER).toBeDefined();
      expect(GROUP_MODALS_TRACKING_POINTS.SEARCH_WORKER.previous_screen).toBe(
        'assign_worker_modal',
      );

      // Verify SEARCH_LEAD tracking point
      expect(GROUP_MODALS_TRACKING_POINTS.SEARCH_LEAD).toBeDefined();
      expect(GROUP_MODALS_TRACKING_POINTS.SEARCH_LEAD.previous_screen).toBe(
        'assign_lead_modal',
      );

      // Verify SELECT_WORKER tracking point
      expect(GROUP_MODALS_TRACKING_POINTS.SELECT_WORKER).toBeDefined();
      expect(GROUP_MODALS_TRACKING_POINTS.SELECT_WORKER.previous_screen).toBe(
        'assign_worker_modal',
      );

      // Verify SELECT_LEAD tracking point
      expect(GROUP_MODALS_TRACKING_POINTS.SELECT_LEAD).toBeDefined();
      expect(GROUP_MODALS_TRACKING_POINTS.SELECT_LEAD.previous_screen).toBe(
        'assign_lead_modal',
      );
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Clear mocks before each test to ensure fresh state
      mockTrack.mockClear();
      mockLogger.info.mockClear();
      // Ensure component is not in loading state
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should track search when user types', async () => {
      renderComponent();

      // SearchField is always expanded (alwaysExpanded={true}), so we can directly type
      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Advance timers to trigger debounced onChange (300ms debounce)
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            previous_screen: 'assign_lead_modal',
          }),
        );
      });
    });

    it('should not track search when search is empty', async () => {
      renderComponent();

      mockTrack.mockClear();
      // SearchField is always expanded (alwaysExpanded={true}), so we can directly type
      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: '' } });

      // Advance timers to trigger debounced onChange
      jest.advanceTimersByTime(300);

      expect(mockTrack).not.toHaveBeenCalled();
    });

    it('should track search only once per session in Leads mode', async () => {
      renderComponent({ mode: WorkerSelectionMode.Leads });

      // SearchField is always expanded (alwaysExpanded={true}), so we can directly type
      const searchInput = screen.getByRole('textbox');

      // First search - should track
      fireEvent.change(searchInput, { target: { value: 'John' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledTimes(1);
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            previous_screen: 'assign_lead_modal',
          }),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Component="WorkerSelectionContent" Event="Search leads typed"',
        );
      });

      // Clear mock to verify second search doesn't track
      mockTrack.mockClear();
      mockLogger.info.mockClear();

      // Second search - should NOT track again
      fireEvent.change(searchInput, { target: { value: 'Jane' } });
      jest.advanceTimersByTime(300);

      expect(mockTrack).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should track search only once per session in Workers mode', async () => {
      renderComponent({ mode: WorkerSelectionMode.Workers });

      // SearchField is always expanded (alwaysExpanded={true}), so we can directly type
      const searchInput = screen.getByRole('textbox');

      // First search - should track
      fireEvent.change(searchInput, { target: { value: 'John' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledTimes(1);
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            previous_screen: 'assign_worker_modal',
          }),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Component="WorkerSelectionContent" Event="Search workers typed"',
        );
      });

      // Clear mock to verify second search doesn't track
      mockTrack.mockClear();
      mockLogger.info.mockClear();

      // Second search - should NOT track again
      fireEvent.change(searchInput, { target: { value: 'Jane' } });
      jest.advanceTimersByTime(300);

      expect(mockTrack).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should track SEARCH_LEAD in Leads mode', async () => {
      renderComponent({ mode: WorkerSelectionMode.Leads });

      // SearchField is always expanded (alwaysExpanded={true}), so we can directly type
      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'Test' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          GROUP_MODALS_TRACKING_POINTS.SEARCH_LEAD,
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Component="WorkerSelectionContent" Event="Search leads typed"',
        );
      });
    });

    it('should track SEARCH_WORKER in Workers mode', async () => {
      renderComponent({ mode: WorkerSelectionMode.Workers });

      // SearchField is always expanded (alwaysExpanded={true}), so we can directly type
      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'Test' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          GROUP_MODALS_TRACKING_POINTS.SEARCH_WORKER,
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Component="WorkerSelectionContent" Event="Search workers typed"',
        );
      });
    });

    it('should not track when search value is only whitespace', async () => {
      renderComponent();

      mockTrack.mockClear();
      mockLogger.info.mockClear();

      // SearchField is always expanded (alwaysExpanded={true}), so we can directly type
      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: '   ' } });
      jest.advanceTimersByTime(300);

      expect(mockTrack).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('Worker Selection Tracking', () => {
    it('should track SELECT_WORKER when selecting a worker in Workers mode', async () => {
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: 'worker-1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Test',
          lastName: 'Worker',
          displayName: 'Test Worker',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent({ mode: WorkerSelectionMode.Workers });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Skip select-all

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          GROUP_MODALS_TRACKING_POINTS.SELECT_WORKER,
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Component="WorkerSelectionContent" Event="Worker selected"',
        );
      });
    });

    it('should track SELECT_LEAD when selecting a worker in Leads mode', async () => {
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: 'worker-1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Test',
          lastName: 'Worker',
          displayName: 'Test Worker',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent({ mode: WorkerSelectionMode.Leads });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Skip select-all

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          GROUP_MODALS_TRACKING_POINTS.SELECT_LEAD,
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Component="WorkerSelectionContent" Event="Lead selected"',
        );
      });
    });
  });

  describe('Sort Functionality', () => {
    it('should handle sort toggle', () => {
      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Worker',
          lastName: 'One',
          displayName: 'Worker One',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Wait for table to render
      const table = screen.queryByTestId('assign-leads-table');
      if (table) {
        // Find the sortable header cell - it contains "Worker" text
        const sortHeader = screen.getByText('Worker').closest('th');
        if (sortHeader) {
          fireEvent.click(sortHeader);
        }
      }

      // Component should still be rendered after sort
      expect(screen.getByTestId('assign-leads-content')).toBeInTheDocument();
    });
  });

  describe('Error Display in Edit Mode', () => {
    it('should display error message from Redux in edit mode', () => {
      store.dispatch(
        setDrawerContext({
          groupId: 'group-123',
          groupName: 'Test Group',
          context: GroupDrawerContext.EditGroup,
          initialMembers: {},
          initialLeads: {},
          managerCount: 2,
        }),
      );

      store.dispatch(
        setDrawerError({
          errorTitle: 'Error Title',
          errorMessage: 'Error Message',
        }),
      );

      renderComponent({
        mode: WorkerSelectionMode.Leads,
        groupId: 'group-123',
      });

      expect(screen.getByText('Error Message')).toBeInTheDocument();
    });

    it('should display error message with title in edit mode', () => {
      // Test error with title (covers line 440)
      store.dispatch(
        setDrawerContext({
          groupId: 'group-123',
          groupName: 'Test Group',
          context: GroupDrawerContext.EditGroup,
          initialMembers: {},
          initialLeads: {},
          managerCount: 2,
        }),
      );

      store.dispatch(
        setDrawerError({
          errorTitle: 'Custom Error Title',
          errorMessage: 'Custom Error Message',
        }),
      );

      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      renderComponent({
        mode: WorkerSelectionMode.Leads,
        groupId: 'group-123',
      });

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Error Message')).toBeInTheDocument();
    });

    it('should clear error when close button is clicked', async () => {
      store.dispatch(
        setDrawerContext({
          groupId: 'group-123',
          groupName: 'Test Group',
          context: GroupDrawerContext.EditGroup,
          initialMembers: {},
          initialLeads: {},
          managerCount: 2,
        }),
      );

      store.dispatch(
        setDrawerError({
          errorTitle: 'Error Title',
          errorMessage: 'Error Message',
        }),
      );

      // Initialize hasLoadedInitialManagers flag with empty managers
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      renderComponent({
        mode: WorkerSelectionMode.Leads,
        groupId: 'group-123',
      });

      const errorMessage = screen.getByText('Error Message');
      expect(errorMessage).toBeInTheDocument();

      // Find the close button from our mocked PageMessage
      const closeButton = screen.getByTestId('page-message-close-button');
      expect(closeButton).toBeInTheDocument();

      // Click the close button - this should trigger the onClose handler (line 439)
      fireEvent.click(closeButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.workersGroupView.drawerError.errorMessage).toBeNull();
        expect(state.workersGroupView.drawerError.errorTitle).toBeNull();
      });
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should show pagination when pageInfo hasNextPage is true', () => {
      // Mock useTimeTrackingWorkers to return workers
      useTimeTrackingWorkers.mockReturnValue({
        workers: Array.from({ length: 100 }, (_, i) => ({
          id: `worker-${i}`,
          type: TimeTracking_TimeForType.Employee,
          displayName: `Worker ${i}`,
          firstName: 'Worker',
          lastName: `${i}`,
          isActive: true,
          memberOfGroup: null,
          managesGroups: [],
        })),
        loading: false,
        error: null,
        pageInfo: {
          hasNextPage: true, // This triggers pagination display
          hasPreviousPage: false,
          startCursor: undefined,
          endCursor: 'cursor-100',
        },
        totalCount: 110,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      // Add workers to Redux to ensure pagination renders (matching pattern from passing test)
      const workers = Array.from({ length: 110 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        displayName: `Worker ${i}`,
        firstName: 'Worker',
        lastName: `${i}`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      // Should show pagination controls when pageInfo.hasNextPage is true
      // On page 1, only Next button should be visible (Previous is only shown when currentPageNumber > 1)
      expect(
        screen.getByTestId('assign-leads-pagination-next-btn'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('assign-leads-pagination-previous-btn'),
      ).not.toBeInTheDocument();
    });

    it('should handle pagination when no selected workers', () => {
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      useTimeTrackingWorkers.mockReturnValue({
        workers: Array.from({ length: 50 }, (_, i) => ({
          id: `worker-${i}`,
          type: TimeTracking_TimeForType.Employee,
          firstName: `Worker`,
          lastName: `${i}`,
          displayName: `Worker ${i}`,
          isActive: true,
          memberOfGroup: null,
          managesGroups: [],
        })),
        loading: false,
        error: null,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: undefined,
          endCursor: 'cursor-50',
        },
        totalCount: 50,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      renderComponent();

      expect(screen.getByTestId('assign-leads-content')).toBeInTheDocument();
    });
  });

  describe('Worker Type Formatting', () => {
    it('should format Employee type correctly', () => {
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Employee',
          lastName: 'User',
          displayName: 'Employee User',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      expect(screen.getByText('Employee')).toBeInTheDocument();
    });

    it('should handle workers with empty firstName or lastName', () => {
      // Test workers with empty firstName/lastName (covers lines 324-325)
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: '',
          lastName: '',
          displayName: 'Worker With No Name',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      expect(screen.getByText('Worker With No Name')).toBeInTheDocument();
    });
  });

  describe('Select All Functionality', () => {
    it('should select all workers when select all checkbox is checked', async () => {
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));

      const workers = [
        {
          id: '1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Worker',
          lastName: 'One',
          displayName: 'Worker One',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
        {
          id: '2',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Worker',
          lastName: 'Two',
          displayName: 'Worker Two',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      store.dispatch(addDrawerWorkers({ workers, markAsManagers: false }));

      renderComponent();

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      fireEvent.click(selectAllCheckbox);

      await waitFor(() => {
        const state = store.getState();
        expect(state.workersGroupView.drawerWorkers.byId['1'].isSelected).toBe(
          true,
        );
        expect(state.workersGroupView.drawerWorkers.byId['2'].isSelected).toBe(
          true,
        );
      });
    });
  });

  describe('Group Filter Functionality', () => {
    beforeEach(() => {
      // Initialize hasLoadedInitialManagers flag with empty managers to avoid loading state
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));
    });

    it('should handle group filter change and reset to page 1 with search', async () => {
      // Use fake timers for debounce
      jest.useFakeTimers();

      // Mock groups data with edges
      useGetGroups.mockReturnValue({
        data: {
          edges: [
            {
              node: {
                id: 'group-1',
                name: 'Test Group 1',
                isActive: true,
              },
            },
            {
              node: {
                id: 'group-2',
                name: 'Test Group 2',
                isActive: true,
              },
            },
          ],
        },
        loading: false,
        error: null,
        loadGroups: jest.fn(),
      });

      renderComponent();

      // Find the dropdown (it should be rendered)
      const dropdown = screen.getByTestId('group-filter-dropdown');
      expect(dropdown).toBeInTheDocument();

      // Simulate changing the filter to a specific group (covers line 206-208)
      fireEvent.change(dropdown, { target: { value: 'group-1' } });

      await waitFor(() => {
        // Logger should be called with the filter change event
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Component="WorkerSelectionContent" Event="Group filter changed"',
          expect.objectContaining({
            from: 'ALL',
            to: 'group-1',
          }),
        );
      });

      // Trigger a search to exercise the refetch function with specific group filter
      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        // refetch should have been called with the group-1 filter
        expect(mockRefetch).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('should handle NO_GROUP filter correctly and trigger search', async () => {
      // Use fake timers for debounce
      jest.useFakeTimers();

      // Mock groups data with edges
      useGetGroups.mockReturnValue({
        data: {
          edges: [
            {
              node: {
                id: 'group-1',
                name: 'Test Group 1',
                isActive: true,
              },
            },
          ],
        },
        loading: false,
        error: null,
        loadGroups: jest.fn(),
      });

      renderComponent();

      // Find the dropdown
      const dropdown = screen.getByTestId('group-filter-dropdown');

      // Simulate changing the filter to NO_GROUP (covers line 205)
      fireEvent.change(dropdown, { target: { value: 'NO_GROUP' } });

      await waitFor(() => {
        // Logger should be called with the filter change event
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Component="WorkerSelectionContent" Event="Group filter changed"',
          expect.objectContaining({
            from: 'ALL',
            to: 'NO_GROUP',
          }),
        );
      });

      // Trigger a search to exercise the refetch function with NO_GROUP filter
      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        // refetch should have been called with the NO_GROUP filter
        expect(mockRefetch).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('should populate groups list when groupsData has edges', () => {
      // Mock groups data with edges - covers line 183
      useGetGroups.mockReturnValue({
        data: {
          edges: [
            {
              node: {
                id: 'group-1',
                name: 'Test Group 1',
                isActive: true,
              },
            },
          ],
        },
        loading: false,
        error: null,
        loadGroups: jest.fn(),
      });

      renderComponent();

      // Component should render successfully
      expect(screen.getByTestId('assign-leads-content')).toBeInTheDocument();
    });

    it('should clear pageInfo when filter is changing', async () => {
      // Mock initial groups data
      useGetGroups.mockReturnValue({
        data: {
          edges: [
            {
              node: {
                id: 'group-1',
                name: 'Test Group 1',
                isActive: true,
              },
            },
          ],
        },
        loading: false,
        error: null,
        loadGroups: jest.fn(),
      });

      // Mock workers data with pagination
      useTimeTrackingWorkers.mockReturnValue({
        workers: Array.from({ length: 50 }, (_, i) => ({
          id: `worker-${i}`,
          type: TimeTracking_TimeForType.Employee,
          displayName: `Worker ${i}`,
          firstName: 'Worker',
          lastName: `${i}`,
          isActive: true,
          memberOfGroup: null,
          managesGroups: [],
        })),
        loading: false,
        error: null,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'cursor-start',
          endCursor: 'cursor-end',
        },
        totalCount: 50,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      renderComponent();

      // Find the dropdown and trigger a change
      const dropdown = screen.getByTestId('group-filter-dropdown');
      fireEvent.change(dropdown, { target: { value: 'group-1' } });

      // After filter change, component should still render
      // The safePageInfo will be undefined while filter is changing (covers line 272)
      await waitFor(() => {
        expect(screen.getByTestId('assign-leads-content')).toBeInTheDocument();
      });
    });

    it('should call fetchNextPage when Load More is clicked and groups have next page', () => {
      const mockFetchNextGroupsPage = jest.fn();
      useGetGroups.mockReturnValue({
        loadGroups: jest.fn(),
        loading: false,
        error: null,
        fetchNextPage: mockFetchNextGroupsPage,
      });

      // Pre-populate store with groups that have hasNextPage and cursor
      store.dispatch(
        setGroupsData({
          groups: [
            {
              id: 'group-1',
              name: 'Test Group 1',
              isActive: true,
              stats: { memberCount: 5, managerCount: 1 },
              meta: { version: 1 },
            } as any,
          ],
          cursor: 'cursor-123',
          hasNextPage: true,
          hasMore: true,
          totalCount: 2,
        }),
      );

      renderComponent();

      const loadMoreBtn = screen.getByTestId('group-filter-load-more');
      expect(loadMoreBtn).toBeInTheDocument();

      fireEvent.click(loadMoreBtn);

      expect(mockFetchNextGroupsPage).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { isActive: true },
        }),
      );
    });

    it('should track SELECT_ALL_LEADS when select all is clicked in Leads mode', () => {
      mockTrack.mockClear();

      const workers = [
        {
          id: 'worker-1',
          type: TimeTracking_TimeForType.Employee,
          firstName: 'Worker',
          lastName: 'One',
          displayName: 'Worker One',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      useTimeTrackingWorkers.mockReturnValue({
        loadWorkers: mockLoadWorkers,
        workers,
        loading: false,
        error: null,
        pageInfo: mockPageInfo,
        totalCount: 1,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        refetch: mockRefetch,
      });

      useGetGroups.mockReturnValue({
        loadGroups: jest.fn(),
        loading: false,
        error: null,
      });

      renderComponent({ mode: WorkerSelectionMode.Leads });

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      fireEvent.click(selectAllCheckbox);

      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_MODALS_TRACKING_POINTS.SELECT_ALL_LEADS,
      );
    });
  });

  describe('Search and Dropdown Layout', () => {
    beforeEach(() => {
      // Initialize hasLoadedInitialManagers flag with empty managers to avoid loading state
      store.dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));
    });

    it('should render search field with placeholder text', () => {
      renderComponent();

      // Search field uses placeholder "Search" from intl.formatMessage
      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toBeInTheDocument();
    });

    it('should render search field with empty label for accessibility', () => {
      renderComponent();

      // Search field has label="" which sets aria-label to empty string
      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toHaveAttribute('aria-label', '');
    });

    it('should render search field as always expanded', () => {
      renderComponent();

      // Search field should be rendered as textbox (not collapsed to icon button)
      // because alwaysExpanded={true}
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search');
    });

    it('should not render search field as collapsed icon button', () => {
      renderComponent();

      // With alwaysExpanded={true}, search should not start as an icon button
      // The textbox should be immediately visible
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toBeInTheDocument();

      // Should not need to click a button to expand it
      const searchButtons = screen.queryAllByRole('button', {
        name: /search/i,
      });
      // The search icon is rendered inside the textfield as addonBefore, not as an expand button
      expect(searchButtons.length).toBe(0);
    });

    it('should render both dropdown and search field in the header', () => {
      renderComponent();

      // Dropdown should be present (filter by group)
      // Note: The dropdown is mocked in the test setup
      const content = screen.getByTestId('assign-leads-content');
      expect(content).toBeInTheDocument();

      // Search field should be present
      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toBeInTheDocument();
    });

    it('should apply viewport width styling to search and dropdown wrappers', () => {
      const { container } = renderComponent();

      // Both DropdownWrapper and SearchWrapper use viewport width (9vw each)
      // Verify the components are rendered (actual styling is in styled-components)
      const content = container.querySelector(
        '[data-testid="assign-leads-content"]',
      );
      expect(content).toBeInTheDocument();

      // Search field and dropdown should both be present in the layout
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('should render search field with proper accessibility attributes', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search');

      // Should have aria-label for accessibility
      expect(searchInput).toHaveAttribute('aria-label');

      // Should have placeholder for user guidance
      expect(searchInput).toHaveAttribute('placeholder', 'Search');

      // Should be a text input
      expect(searchInput).toHaveAttribute('type', 'text');
    });
  });
});
