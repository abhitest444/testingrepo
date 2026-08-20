import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { buildSandbox } from '@payroll/quicksand';
import WorkersListView from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersListView/WorkersListView';
import workersListReducer from 'src/js/widgets/assignments/store/workersListSlice';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { WorkerType } from 'src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/types';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';

// Mock the hooks
jest.mock('src/js/service/hooks/groups/useTimeTrackingWorkers');
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersListView/useWorkersListData',
);
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: jest.fn(),
}));

// Mock Pagination component
jest.mock('@ids-ts/pagination', () => ({
  Pagination: ({ activePage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <span>
        Page {activePage} of {totalPages}
      </span>
      <button
        data-testid="prev-page"
        onClick={() => onPageChange(activePage - 1)}
        disabled={activePage === 1}
      >
        Previous
      </button>
      <button
        data-testid="next-page"
        onClick={() => onPageChange(activePage + 1)}
        disabled={activePage === totalPages}
      >
        Next
      </button>
    </div>
  ),
}));

// Mock WorkersTable component
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersListView/WorkersTable',
  () => ({
    __esModule: true,
    default: ({ workers, loading, totalCount, onViewSettings }: any) => (
      <div data-testid="workers-table">
        {loading && <div>Loading...</div>}
        {!loading && <div>Workers: {totalCount}</div>}
        {workers.map((worker: any) => (
          <div key={worker.id} data-testid={`worker-${worker.id}`}>
            {worker.displayName}
            <button onClick={() => onViewSettings(worker)}>View</button>
          </div>
        ))}
      </div>
    ),
  }),
);

const { useSandbox } = require('@payroll/quicksand');
const {
  useTimeTrackingWorkers,
} = require('src/js/service/hooks/groups/useTimeTrackingWorkers');
const {
  useWorkersListData,
} = require('src/js/widgets/assignments/components/WorkerAssignments/WorkersListView/useWorkersListData');

describe('WorkersListView', () => {
  let store: ReturnType<typeof configureStore>;
  let mockSandbox: any;
  let mockLoadWorkers: jest.Mock;
  let mockFetchNextPage: jest.Mock;
  let mockFetchPreviousPage: jest.Mock;
  let mockHandlePageChange: jest.Mock;
  let mockHandleViewSettings: jest.Mock;

  const mockWorkers = [
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
      memberOfGroup: null,
      managesGroups: [],
    },
  ];

  const mockPageInfo = {
    hasNextPage: true,
    hasPreviousPage: false,
    startCursor: 'cursor-start',
    endCursor: 'cursor-end',
  };

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        workersList: workersListReducer,
      },
    });

    // Mock sandbox
    mockSandbox = buildSandbox();
    mockSandbox.logger = {
      info: jest.fn(),
      error: jest.fn(),
    };
    useSandbox.mockReturnValue(mockSandbox);

    // Mock pagination functions
    mockLoadWorkers = jest.fn().mockResolvedValue(undefined);
    mockFetchNextPage = jest.fn().mockResolvedValue(undefined);
    mockFetchPreviousPage = jest.fn().mockResolvedValue(undefined);
    mockHandlePageChange = jest.fn();
    mockHandleViewSettings = jest.fn();

    // Mock useTimeTrackingWorkers hook
    useTimeTrackingWorkers.mockReturnValue({
      workers: mockWorkers,
      loading: false,
      error: null,
      pageInfo: mockPageInfo,
      loadWorkers: mockLoadWorkers,
      fetchNextPage: mockFetchNextPage,
      fetchPreviousPage: mockFetchPreviousPage,
      fetchMore: jest.fn(),
      refetch: jest.fn(),
    });

    // Mock useWorkersListData hook
    useWorkersListData.mockReturnValue({
      workers: mockWorkers,
      loading: false,
      pageInfo: mockPageInfo,
      currentPage: 1,
      totalPages: 1,
      totalItems: 100,
      headerTotalCount: 150,
      handlePageChange: mockHandlePageChange,
      handleViewSettings: mockHandleViewSettings,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) =>
    renderWithQuicksandProvider(
      <Provider store={store}>
        <WorkersListView searchText="" workerType={WorkerType.ALL} {...props} />
      </Provider>,
      getDefaultSandbox(),
    );

  describe('Rendering', () => {
    it('should render the workers list view container', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render WorkersTable component', () => {
      renderComponent();
      expect(screen.getByTestId('workers-table')).toBeInTheDocument();
    });

    it('should display workers when data is loaded', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      });
    });

    it('should use default props when not provided', () => {
      // Test default values: searchText = '', workerType = WorkerType.ALL
      renderWithQuicksandProvider(
        <Provider store={store}>
          <WorkersListView />
        </Provider>,
        getDefaultSandbox(),
      );

      expect(useWorkersListData).toHaveBeenCalledWith('', WorkerType.ALL);
    });

    it('should call onLoadingChange when loading state is available', () => {
      const onLoadingChange = jest.fn();
      renderComponent({ onLoadingChange });
      expect(onLoadingChange).toHaveBeenCalledWith(false);
    });

    it('should call onLoadingChange with true when data is loading', () => {
      const onLoadingChange = jest.fn();
      useWorkersListData.mockReturnValue({
        workers: [],
        loading: true,
        pageInfo: mockPageInfo,
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        headerTotalCount: 0,
        handlePageChange: mockHandlePageChange,
        handleViewSettings: mockHandleViewSettings,
      });
      renderComponent({ onLoadingChange });
      expect(onLoadingChange).toHaveBeenCalledWith(true);
    });

    it('should pass custom props to useWorkersListData', () => {
      renderComponent({ searchText: 'John', workerType: WorkerType.EMPLOYEE });

      expect(useWorkersListData).toHaveBeenCalledWith(
        'John',
        WorkerType.EMPLOYEE,
      );
    });
  });

  describe('Loading State', () => {
    it('should display loading state', () => {
      useWorkersListData.mockReturnValue({
        workers: [],
        loading: true,
        pageInfo: null,
        currentPage: 1,
        totalPages: 1,
        totalItems: 100,
        headerTotalCount: 150,
        handlePageChange: mockHandlePageChange,
        handleViewSettings: mockHandleViewSettings,
      });

      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should pass empty workers array to table when no data', () => {
      useWorkersListData.mockReturnValue({
        workers: [],
        loading: false,
        pageInfo: null,
        currentPage: 1,
        totalPages: 1,
        totalItems: 100,
        headerTotalCount: 0,
        handlePageChange: mockHandlePageChange,
        handleViewSettings: mockHandleViewSettings,
      });

      renderComponent();
      expect(screen.getByText('Workers: 0')).toBeInTheDocument();
    });
  });

  describe('Pagination Rendering', () => {
    it('should not render pagination when no next or previous page available', () => {
      // pageInfo with no next/previous pages -> pagination should NOT render
      useWorkersListData.mockReturnValue({
        workers: mockWorkers,
        loading: false,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'cursor-start',
          endCursor: 'cursor-end',
        },
        currentPage: 1,
        totalPages: 1,
        totalItems: 100,
        headerTotalCount: 150,
        handlePageChange: mockHandlePageChange,
        handleViewSettings: mockHandleViewSettings,
      });

      renderComponent();
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should not render pagination when totalPages is 1 or less', () => {
      // totalPages <= 1 -> pagination should NOT render
      useWorkersListData.mockReturnValue({
        workers: [],
        loading: true,
        pageInfo: null,
        currentPage: 1,
        totalPages: 1,
        totalItems: 100,
        headerTotalCount: 150,
        handlePageChange: mockHandlePageChange,
        handleViewSettings: mockHandleViewSettings,
      });

      renderComponent();
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should render pagination when hasNextPage is true', () => {
      // pageInfo with hasNextPage = true -> pagination SHOULD render
      useWorkersListData.mockReturnValue({
        workers: mockWorkers,
        loading: false,
        pageInfo: {
          ...mockPageInfo,
          hasNextPage: true,
          hasPreviousPage: false,
        },
        currentPage: 1,
        totalPages: 5,
        totalItems: 500,
        headerTotalCount: 150,
        handlePageChange: mockHandlePageChange,
        handleViewSettings: mockHandleViewSettings,
      });

      renderComponent();
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    });

    it('should render pagination when hasPreviousPage is true', () => {
      // pageInfo with hasPreviousPage = true -> pagination SHOULD render
      useWorkersListData.mockReturnValue({
        workers: mockWorkers,
        loading: false,
        pageInfo: {
          ...mockPageInfo,
          hasNextPage: false,
          hasPreviousPage: true,
        },
        currentPage: 2,
        totalPages: 5,
        totalItems: 500,
        headerTotalCount: 150,
        handlePageChange: mockHandlePageChange,
        handleViewSettings: mockHandleViewSettings,
      });

      renderComponent();
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    });

    it('should pass correct props to Pagination component', () => {
      useWorkersListData.mockReturnValue({
        workers: mockWorkers,
        loading: false,
        pageInfo: mockPageInfo,
        currentPage: 2,
        totalPages: 3,
        totalItems: 300,
        headerTotalCount: 150,
        handlePageChange: mockHandlePageChange,
        handleViewSettings: mockHandleViewSettings,
      });

      renderComponent();
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to child components', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      });

      // Verify action handlers are passed to WorkersTable
      const viewButton = screen.getAllByText('View')[0];
      expect(viewButton).toBeInTheDocument();
    });

    it('should call onRefetchAvailable when refetch is available', () => {
      const mockOnRefetchAvailable = jest.fn();
      useWorkersListData.mockReturnValue({
        workers: mockWorkers,
        loading: false,
        pageInfo: mockPageInfo,
        currentPage: 1,
        totalPages: 1,
        totalItems: 100,
        headerTotalCount: 150,
        handlePageChange: mockHandlePageChange,
        handleViewSettings: mockHandleViewSettings,
        refetch: jest.fn(),
      });

      renderComponent({ onRefetchAvailable: mockOnRefetchAvailable });

      expect(mockOnRefetchAvailable).toHaveBeenCalled();
    });
  });
});
