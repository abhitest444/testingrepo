/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { GroupDetailView } from 'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/GroupDetailView';
import { useGroupDetailData } from 'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/hooks/useGroupDetailData';
import { WorkerType } from 'src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/types';
import {
  renderWithQuicksandAndReduxProvider,
  getDefaultSandbox,
  createDefaultStore,
} from 'test/unit/testUtils';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';

// Mock the dataloader hook
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/hooks/useGroupDetailData',
);

// Mock useNttfEligibility - default to showing group leads
const mockUseNttfEligibility = jest.fn(() => ({
  isNttfEligible: false,
  shouldShowGroupLeads: true,
  loading: false,
}));
jest.mock('src/js/service/hooks/nttf/useNttfEligibility', () => ({
  useNttfEligibility: () => mockUseNttfEligibility(),
}));

// Mock child components
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/components/GroupDetailHeader',
  () => ({
    GroupDetailHeader: ({
      groupName,
      memberCount,
      managerCount,
      onBack,
      shouldShowGroupLeads,
    }: any) => (
      <div
        data-testid="group-detail-header"
        data-should-show-group-leads={String(shouldShowGroupLeads)}
      >
        <h1>{groupName}</h1>
        <span data-testid="member-count">{memberCount}</span>
        <span data-testid="manager-count">{managerCount ?? 'undefined'}</span>
        <button data-testid="back-button" onClick={onBack}>
          Back
        </button>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/components/GroupDetailFilterBar',
  () => ({
    GroupDetailFilterBar: ({
      searchText,
      filterType,
      onSearchChange,
      onFilterChange,
      onAssignWorkers,
      onAssignLeads,
      shouldShowGroupLeads,
    }: any) => (
      <div
        data-testid="group-detail-filter-bar"
        data-should-show-group-leads={String(shouldShowGroupLeads)}
      >
        <input
          data-testid="search-input"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select
          data-testid="filter-select"
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
        <button data-testid="assign-workers-button" onClick={onAssignWorkers}>
          Assign Workers
        </button>
        <button data-testid="assign-leads-button" onClick={onAssignLeads}>
          Assign Leads
        </button>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/components/GroupDetailWorkersTable',
  () => ({
    GroupDetailWorkersTable: ({
      workers,
      isLoading,
      searchText,
      filterType,
    }: any) => (
      <div data-testid="group-detail-workers-table">
        {isLoading ? (
          <div data-testid="loading">Loading...</div>
        ) : (
          <div data-testid="workers-list">
            {workers.map((worker: any) => (
              <div key={worker.id} data-testid={`worker-${worker.id}`}>
                {worker.displayName}
              </div>
            ))}
          </div>
        )}
        <div data-testid="search-text">{searchText}</div>
        <div data-testid="filter-type">{filterType}</div>
      </div>
    ),
  }),
);

jest.mock('@ids-ts/pagination', () => ({
  Pagination: ({
    totalPages,
    totalItems,
    pageSize,
    activePage,
    onPageChange,
  }: any) => (
    <div data-testid="pagination">
      <span data-testid="total-pages">{totalPages}</span>
      <span data-testid="total-items">{totalItems}</span>
      <span data-testid="page-size">{pageSize}</span>
      <span data-testid="active-page">{activePage}</span>
      <button data-testid="page-change" onClick={() => onPageChange(2)}>
        Page 2
      </button>
    </div>
  ),
}));

describe('GroupDetailView', () => {
  const mockHandleBack = jest.fn();
  const mockHandleSearchChange = jest.fn();
  const mockHandleFilterChange = jest.fn();
  const mockHandlePageChange = jest.fn();
  const mockHandleAssignWorkers = jest.fn();
  const mockHandleAssignLeads = jest.fn();

  const createMockStore = () =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
      },
    });

  const defaultMockData = {
    selectedGroup: {
      id: 'group-1',
      name: 'Engineering Team',
      stats: {
        memberCount: 150,
        managerCount: 5,
      },
    },
    memberCount: 150,
    managerCount: 5,
    workers: [
      {
        id: 'worker-1',
        displayName: 'John Doe',
        type: 'EMPLOYEE',
        isGroupLead: false,
      },
      {
        id: 'worker-2',
        displayName: 'Jane Manager',
        type: 'EMPLOYEE',
        isGroupLead: true,
      },
    ],
    isLoading: false,
    searchText: '',
    filterType: WorkerType.ALL,
    currentPage: 1,
    totalPages: 2,
    totalItems: 150,
    pageInfo: {
      hasNextPage: true,
      hasPreviousPage: false,
    },
    handleBack: mockHandleBack,
    handleSearchChange: mockHandleSearchChange,
    handleFilterChange: mockHandleFilterChange,
    handlePageChange: mockHandlePageChange,
    handleAssignWorkers: mockHandleAssignWorkers,
    handleAssignLeads: mockHandleAssignLeads,
    refetchWorkers: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGroupDetailData as jest.Mock).mockReturnValue(defaultMockData);
  });

  describe('Component Integration', () => {
    it('should render all main components when group is selected', () => {
      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('group-detail-header')).toBeInTheDocument();
      expect(screen.getByTestId('group-detail-filter-bar')).toBeInTheDocument();
      expect(
        screen.getByTestId('group-detail-workers-table'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('should render null when no group is selected', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        selectedGroup: null,
      });

      const { container } = renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );
      expect(container.firstChild).toBeNull();
    });

    it('should pass correct props to GroupDetailHeader', () => {
      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByTestId('member-count')).toHaveTextContent('150');
      expect(screen.getByTestId('manager-count')).toHaveTextContent('5');
    });

    it('should pass handlers to child components', () => {
      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('back-button')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('filter-select')).toBeInTheDocument();
      expect(screen.getByTestId('assign-workers-button')).toBeInTheDocument();
      expect(screen.getByTestId('assign-leads-button')).toBeInTheDocument();
      expect(screen.getByTestId('page-change')).toBeInTheDocument();
    });
  });

  describe('Data Flow', () => {
    it('should pass workers data to GroupDetailWorkersTable', () => {
      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('worker-worker-1')).toHaveTextContent(
        'John Doe',
      );
      expect(screen.getByTestId('worker-worker-2')).toHaveTextContent(
        'Jane Manager',
      );
    });

    it('should pass loading state to GroupDetailWorkersTable', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        isLoading: true,
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should pass search text to GroupDetailWorkersTable', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        searchText: 'test search',
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('search-text')).toHaveTextContent(
        'test search',
      );
    });

    it('should pass filter type to GroupDetailWorkersTable', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        filterType: WorkerType.EMPLOYEE,
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('filter-type')).toHaveTextContent('EMPLOYEE');
    });
  });

  describe('Pagination', () => {
    it('should render pagination when hasNextPage is true', () => {
      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByTestId('total-pages')).toHaveTextContent('2');
      expect(screen.getByTestId('total-items')).toHaveTextContent('150');
      expect(screen.getByTestId('active-page')).toHaveTextContent('1');
    });

    it('should render pagination when hasPreviousPage is true', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
        },
        currentPage: 2,
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByTestId('active-page')).toHaveTextContent('2');
    });

    it('should not render pagination when both hasNextPage and hasPreviousPage are false', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
        totalPages: 1,
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should not render pagination when pageInfo is null', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        pageInfo: null,
        totalPages: 1,
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should handle undefined pageInfo properties', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        pageInfo: {},
        totalPages: 1,
      });

      const { container } = renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(
        container.querySelector('[data-testid="pagination"]'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should call useGroupDetailData hook', () => {
      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(useGroupDetailData).toHaveBeenCalled();
    });

    it('should use all data from hook', () => {
      const customData = {
        ...defaultMockData,
        selectedGroup: {
          id: 'custom-group',
          name: 'Custom Group',
          stats: {
            memberCount: 99,
            managerCount: 3,
          },
        },
        memberCount: 99,
        managerCount: 3,
      };

      (useGroupDetailData as jest.Mock).mockReturnValue(customData);

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByText('Custom Group')).toBeInTheDocument();
      expect(screen.getByTestId('member-count')).toHaveTextContent('99');
      expect(screen.getByTestId('manager-count')).toHaveTextContent('3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty workers array', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        workers: [],
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('workers-list')).toBeInTheDocument();
      expect(screen.queryByTestId('worker-worker-1')).not.toBeInTheDocument();
    });

    it('should handle missing group stats', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        selectedGroup: {
          id: 'group-1',
          name: 'Test Group',
          stats: undefined,
        },
        memberCount: 0,
        managerCount: 0,
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByTestId('member-count')).toHaveTextContent('0');
      expect(screen.getByTestId('manager-count')).toHaveTextContent('0');
    });

    it('should handle null pageInfo gracefully', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        pageInfo: null,
        totalPages: 1,
      });

      const { container } = renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(
        container.querySelector('[data-testid="pagination"]'),
      ).not.toBeInTheDocument();
    });

    it('should render with minimum required data', () => {
      (useGroupDetailData as jest.Mock).mockReturnValue({
        selectedGroup: {
          id: 'min-group',
          name: 'Minimum Group',
        },
        memberCount: 0,
        managerCount: 0,
        workers: [],
        isLoading: false,
        searchText: '',
        filterType: WorkerType.ALL,
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageInfo: null,
        handleBack: jest.fn(),
        handleSearchChange: jest.fn(),
        handleFilterChange: jest.fn(),
        handlePageChange: jest.fn(),
        handleAssignWorkers: jest.fn(),
        handleAssignLeads: jest.fn(),
        refetchWorkers: jest.fn(),
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(screen.getByText('Minimum Group')).toBeInTheDocument();
    });
  });

  describe('onRefetchAvailable', () => {
    it('should call onRefetchAvailable with refetchWorkers when provided', () => {
      const mockOnRefetchAvailable = jest.fn();
      const mockRefetchWorkers = jest.fn();

      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        refetchWorkers: mockRefetchWorkers,
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView onRefetchAvailable={mockOnRefetchAvailable} />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(mockOnRefetchAvailable).toHaveBeenCalledWith(mockRefetchWorkers);
    });

    it('should not call onRefetchAvailable when not provided', () => {
      const mockOnRefetchAvailable = jest.fn();

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(mockOnRefetchAvailable).not.toHaveBeenCalled();
    });

    it('should update onRefetchAvailable when refetchWorkers changes', () => {
      const mockOnRefetchAvailable = jest.fn();
      const mockRefetchWorkers1 = jest.fn();
      const mockRefetchWorkers2 = jest.fn();

      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        refetchWorkers: mockRefetchWorkers1,
      });

      const { rerender } = renderWithQuicksandAndReduxProvider(
        <GroupDetailView onRefetchAvailable={mockOnRefetchAvailable} />,
        createMockStore(),
        getDefaultSandbox(),
      );

      expect(mockOnRefetchAvailable).toHaveBeenCalledWith(mockRefetchWorkers1);
      expect(mockOnRefetchAvailable).toHaveBeenCalledTimes(1);

      // Update refetchWorkers
      (useGroupDetailData as jest.Mock).mockReturnValue({
        ...defaultMockData,
        refetchWorkers: mockRefetchWorkers2,
      });

      rerender(<GroupDetailView onRefetchAvailable={mockOnRefetchAvailable} />);

      expect(mockOnRefetchAvailable).toHaveBeenCalledWith(mockRefetchWorkers2);
      expect(mockOnRefetchAvailable).toHaveBeenCalledTimes(2);
    });
  });

  describe('NTTF - shouldShowGroupLeads', () => {
    it('should pass shouldShowGroupLeads=false to children when NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: true,
        shouldShowGroupLeads: false,
        loading: false,
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      const header = screen.getByTestId('group-detail-header');
      expect(header).toHaveAttribute('data-should-show-group-leads', 'false');

      const filterBar = screen.getByTestId('group-detail-filter-bar');
      expect(filterBar).toHaveAttribute(
        'data-should-show-group-leads',
        'false',
      );
    });

    it('should pass undefined managerCount to header when NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: true,
        shouldShowGroupLeads: false,
        loading: false,
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      const managerCount = screen.getByTestId('manager-count');
      expect(managerCount).toHaveTextContent('undefined');
    });

    it('should pass shouldShowGroupLeads=true to children when not NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        shouldShowGroupLeads: true,
        loading: false,
      });

      renderWithQuicksandAndReduxProvider(
        <GroupDetailView />,
        createMockStore(),
        getDefaultSandbox(),
      );

      const header = screen.getByTestId('group-detail-header');
      expect(header).toHaveAttribute('data-should-show-group-leads', 'true');

      const managerCount = screen.getByTestId('manager-count');
      expect(managerCount).toHaveTextContent('5');
    });

    afterEach(() => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        shouldShowGroupLeads: true,
        loading: false,
      });
    });
  });
});
