import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WorkersTableByGroupsViewContent } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/WorkersTableByGroupsViewContent';
import type { GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode } from 'src/__generated__/timeTracking/graphql';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { WorkerNameType } from 'src/js/widgets/assignments/types';

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn(({ id }: any) => id),
  })),
  useSandbox: jest.fn(() => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  })),
  useTracking: jest.fn(() => jest.fn()),
}));

// Mock useDeleteGroup hook
jest.mock('src/js/service/hooks/groups/useDeleteGroup', () => ({
  useDeleteGroup: jest.fn(() => ({
    deleteGroup: jest.fn(),
    isDeleting: false,
  })),
}));

// Mock useNttfEligibility hook
jest.mock('src/js/service/hooks/nttf/useNttfEligibility', () => ({
  useNttfEligibility: jest.fn(() => ({
    isNttfEligible: false,
    loading: false, // Default to not loading for existing tests
    refetch: jest.fn(),
  })),
}));

// Mock IDS components
jest.mock('@ids-ts/table', () => {
  const MockTable: any = ({ children }: any) => (
    <table data-testid="table">{children}</table>
  );
  MockTable.Header = ({ children }: any) => (
    <thead data-testid="table-header">{children}</thead>
  );
  MockTable.Body = ({ children }: any) => (
    <tbody data-testid="table-body">{children}</tbody>
  );
  MockTable.Row = ({ children }: any) => (
    <tr data-testid="table-row">{children}</tr>
  );
  MockTable.HeaderCell = ({ children }: any) => (
    <th data-testid="header-cell">{children}</th>
  );
  MockTable.Cell = ({ children, colSpan }: any) => (
    <td data-testid="table-cell" colSpan={colSpan}>
      {children}
    </td>
  );

  return {
    Table: MockTable,
  };
});

jest.mock('@ids-ts/loader', () => ({
  Activity: ({ shape, size }: any) => (
    <div data-testid="activity-loader" data-shape={shape} data-size={size}>
      Loading...
    </div>
  ),
}));

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="page-message">{children}</div>
  ),
}));

jest.mock('@ids-ts/pagination', () => ({
  Pagination: () => <div data-testid="pagination">Pagination</div>,
}));

// Mock GroupRow component
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/GroupRow',
  () => ({
    GroupRow: ({ group }: any) => (
      <tr data-testid={`group-row-${group.id}`}>
        <td>{group.name}</td>
      </tr>
    ),
  }),
);

// Mock TabPersistence
jest.mock('src/js/widgets/assignments/utils/tabPersistence', () => ({
  TabPersistence: {
    getGroupDetail: jest.fn().mockReturnValue(null),
    clearGroupDetail: jest.fn(),
  },
}));

// Mock SuccessToast
jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: () => null,
}));

// Mock ConfirmationModal
jest.mock('src/js/widgets/common/ConfirmationModal', () => ({
  ConfirmationModal: () => null,
}));

const mockGroup: QueryGroupNode = {
  id: '1',
  name: 'Test Group',
  isActive: true,
  stats: {
    memberCount: 5,
    managerCount: 2,
  },
  meta: {
    version: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: 'user1',
    updatedBy: 'user1',
  },
};

const createMockStore = () =>
  configureStore({
    reducer: {
      workersGroupView: workersGroupViewReducer,
    },
    preloadedState: {
      workersGroupView: {
        groups: {
          ids: [],
          entities: {},
          loading: false,
          error: null,
          cursor: null,
          hasMore: false,
          isLoadingMore: false,
          totalCount: 0,
          headerCount: 0,
          hasNextPage: false,
        },
        selectedMembers: {},
        selectedLeads: {},
        workersByGroup: {},
        expandedGroupIds: [],
        currentGroupId: null,
        currentGroupName: null,
        drawerContext: null,
        initialMembers: {},
        initialLeads: {},
        currentMemberWorkers: [],
        currentLeadWorkers: [],
        drawerWorkers: {
          byId: {},
          allIds: [],
          totalFetched: 0,
          hasLoadedInitialManagers: false,
        },
        quickActionDrawerOpen: false,
        quickActionDrawerView: null,
        deleteModal: {
          open: false,
          groupId: null,
          groupName: null,
          version: null,
        },
        groupDetailView: {
          isActive: false,
          groupId: null,
          groupName: null,
          error: null,
        },
        viewByGroups: true,
        addWorkerDrawerOpen: false,
        addWorkerDrawerNameType: WorkerNameType.EMPLOYEE,
        createGroupDrawerOpen: false,
        drawerError: {
          errorTitle: null,
          errorMessage: null,
        },
        unsavedChangesModal: {
          open: false,
        },
      },
    },
  });

describe('WorkersTableByGroupsViewContent - Loader Behavior', () => {
  const mockRefetch = jest.fn();
  const mockOnPageChange = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should show loader during initial load with empty groups', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={[]}
            groupsCount={0}
            isLoading
            error={null}
            refetch={mockRefetch}
            currentPage={1}
            pageSize={50}
            totalCount={0}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // Loader should be visible
      const loader = screen.getByTestId('activity-loader');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-shape', 'dots');
      expect(loader).toHaveAttribute('data-size', 'large');
    });

    it('should show loader during pagination (forward)', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={[mockGroup]}
            groupsCount={1}
            isLoading
            error={null}
            refetch={mockRefetch}
            currentPage={2}
            pageSize={50}
            totalCount={100}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // Loader should be visible even with existing groups
      const loader = screen.getByTestId('activity-loader');
      expect(loader).toBeInTheDocument();
    });

    it('should show loader during pagination (backward)', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={[mockGroup]}
            groupsCount={1}
            isLoading
            error={null}
            refetch={mockRefetch}
            currentPage={1}
            pageSize={50}
            totalCount={100}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // Loader should be visible
      const loader = screen.getByTestId('activity-loader');
      expect(loader).toBeInTheDocument();
    });

    it('should show loader during pagination with existing groups', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={[mockGroup]}
            groupsCount={1}
            isLoading
            error={null}
            refetch={mockRefetch}
            currentPage={1}
            pageSize={50}
            totalCount={1}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // Loader should be visible even with groups
      const loader = screen.getByTestId('activity-loader');
      expect(loader).toBeInTheDocument();
    });

    it('should not show loader when not loading', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={[mockGroup]}
            groupsCount={1}
            isLoading={false}
            error={null}
            refetch={mockRefetch}
            currentPage={1}
            pageSize={50}
            totalCount={1}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // Loader should not be visible
      expect(screen.queryByTestId('activity-loader')).not.toBeInTheDocument();

      // Group row should be visible
      expect(screen.getByTestId('group-row-1')).toBeInTheDocument();
    });
  });

  describe('Loader Styling', () => {
    it('should render loader with proper styling', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={[]}
            groupsCount={0}
            isLoading
            error={null}
            refetch={mockRefetch}
            currentPage={1}
            pageSize={50}
            totalCount={0}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // Loader should be present and centered
      const loader = screen.getByTestId('activity-loader');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-shape', 'dots');
      expect(loader).toHaveAttribute('data-size', 'large');
    });
  });

  describe('Content Display After Loading', () => {
    it('should display groups after loading completes', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={[mockGroup]}
            groupsCount={1}
            isLoading={false}
            error={null}
            refetch={mockRefetch}
            currentPage={1}
            pageSize={50}
            totalCount={1}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // Group should be visible
      expect(screen.getByTestId('group-row-1')).toBeInTheDocument();
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    it('should display multiple groups after loading', () => {
      const store = createMockStore();
      const groups = [
        { ...mockGroup, id: '1', name: 'Group 1' },
        { ...mockGroup, id: '2', name: 'Group 2' },
        { ...mockGroup, id: '3', name: 'Group 3' },
      ];

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={groups}
            groupsCount={3}
            isLoading={false}
            error={null}
            refetch={mockRefetch}
            currentPage={1}
            pageSize={50}
            totalCount={3}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // All groups should be visible
      expect(screen.getByTestId('group-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('group-row-2')).toBeInTheDocument();
      expect(screen.getByTestId('group-row-3')).toBeInTheDocument();
    });
  });

  describe('NTTF Loading Behavior', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should show loader when NTTF is loading', () => {
      // Mock NTTF hook to return loading state
      const mockUseNttfEligibility = require('src/js/service/hooks/nttf/useNttfEligibility');
      mockUseNttfEligibility.useNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        loading: true, // NTTF loading
        refetch: jest.fn(),
      });

      const store = createMockStore();

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={[mockGroup]}
            groupsCount={1}
            isLoading={false} // Groups not loading
            error={null}
            refetch={mockRefetch}
            currentPage={1}
            pageSize={50}
            totalCount={1}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // Loader should be visible due to NTTF loading
      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();

      // Groups should not be visible
      expect(screen.queryByTestId('group-row-1')).not.toBeInTheDocument();
    });

    it('should show loader when both groups and NTTF are loading', () => {
      // Mock NTTF hook to return loading state
      const mockUseNttfEligibility = require('src/js/service/hooks/nttf/useNttfEligibility');
      mockUseNttfEligibility.useNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        loading: true, // NTTF loading
        refetch: jest.fn(),
      });

      const store = createMockStore();

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={[]}
            groupsCount={0}
            isLoading // Groups also loading
            error={null}
            refetch={mockRefetch}
            currentPage={1}
            pageSize={50}
            totalCount={0}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // Loader should be visible
      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
    });

    it('should not show loader when NTTF loading completes', () => {
      // Mock NTTF hook to return non-loading state
      const mockUseNttfEligibility = require('src/js/service/hooks/nttf/useNttfEligibility');
      mockUseNttfEligibility.useNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        loading: false, // NTTF not loading
        refetch: jest.fn(),
      });

      const store = createMockStore();

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            groups={[mockGroup]}
            groupsCount={1}
            isLoading={false} // Groups not loading
            error={null}
            refetch={mockRefetch}
            currentPage={1}
            pageSize={50}
            totalCount={1}
            onPageChange={mockOnPageChange}
          />
        </Provider>,
      );

      // Loader should not be visible
      expect(screen.queryByTestId('activity-loader')).not.toBeInTheDocument();

      // Groups should be visible
      expect(screen.getByTestId('group-row-1')).toBeInTheDocument();
    });
  });
});
