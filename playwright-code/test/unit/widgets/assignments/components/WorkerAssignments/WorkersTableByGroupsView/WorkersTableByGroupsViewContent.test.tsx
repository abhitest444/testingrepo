import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WorkersTableByGroupsViewContent } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/WorkersTableByGroupsViewContent';
import type { GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode } from 'src/__generated__/timeTracking/graphql';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { WorkerNameType } from 'src/js/widgets/assignments/types';

// Mock @payroll/quicksand
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const mockTrack = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn(({ id }: any) => id),
  })),
  useSandbox: jest.fn(() => ({
    logger: mockLogger,
  })),
  useTracking: jest.fn(() => mockTrack),
}));

// Mock useDeleteGroup hook with callback capture
let mockDeleteGroupCallbacks: any = {};
const mockDeleteGroupFn = jest.fn();

jest.mock('src/js/service/hooks/groups/useDeleteGroup', () => ({
  useDeleteGroup: jest.fn((callbacks: any) => {
    mockDeleteGroupCallbacks = callbacks;
    return {
      deleteGroup: mockDeleteGroupFn,
      isDeleting: false,
    };
  }),
}));

// Mock IDS components
jest.mock('@ids-ts/table', () => {
  const MockTable: any = ({
    children,
    divider,
    responsive,
    hover,
    summary,
    density,
  }: any) => (
    <table
      data-testid="table"
      data-divider={divider}
      data-responsive={responsive}
      data-hover={hover}
      data-summary={summary}
      data-density={density}
    >
      {children}
    </table>
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
  default: ({ children, onClose, onActionClick }: any) => (
    <div data-testid="page-message">
      {children}
      {onClose && (
        <button data-testid="page-message-close" onClick={onClose}>
          Close
        </button>
      )}
      {onActionClick && (
        <button data-testid="page-message-action" onClick={onActionClick}>
          Retry
        </button>
      )}
    </div>
  ),
}));

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
      <button
        data-testid="page-change"
        onClick={() => onPageChange(activePage + 1)}
      >
        Next
      </button>
    </div>
  ),
}));

// Mock styled components
jest.mock(
  'src/js/widgets/assignments/components/styles/WorkersTableByGroupsView.styled',
  () => ({
    HeaderTable: ({
      children,
      divider,
      responsive,
      hover,
      summary,
      density,
      'data-testid': dataTestId,
    }: any) => (
      <table
        data-testid={dataTestId || 'header-table'}
        data-divider={divider}
        data-responsive={responsive}
        data-hover={hover}
        data-summary={summary}
        data-density={density}
      >
        {children}
      </table>
    ),
    TableContainer: ({ children }: any) => (
      <div data-testid="table-container">{children}</div>
    ),
    PaginationContainer: ({ children }: any) => (
      <div data-testid="pagination-container">{children}</div>
    ),
    CenteredContainer: ({ children }: any) => (
      <div data-testid="centered-container">{children}</div>
    ),
    LoadingRow: ({ children }: any) => (
      <tr data-testid="loading-row">{children}</tr>
    ),
    EmptyStateContainer: ({ children }: any) => (
      <div data-testid="empty-state-container">{children}</div>
    ),
    GroupsViewContainer: ({ children }: any) => (
      <div data-testid="groups-view-container">{children}</div>
    ),
  }),
);

// Mock useNttfEligibility - default to showing group leads
const mockUseNttfEligibility = jest.fn(() => ({
  isNttfEligible: false,
  loading: false,
}));
jest.mock('src/js/service/hooks/nttf/useNttfEligibility', () => ({
  useNttfEligibility: () => mockUseNttfEligibility(),
}));

// Mock GroupRow component
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/GroupRow',
  () => ({
    GroupRow: ({ group, shouldShowGroupLeads }: any) => (
      <tr
        data-testid={`group-row-${group.id}`}
        data-should-show-group-leads={String(shouldShowGroupLeads)}
      >
        <td>{group.name}</td>
      </tr>
    ),
  }),
);

// Mock ConfirmationModal
jest.mock('src/js/widgets/common/ConfirmationModal', () => ({
  ConfirmationModal: ({ open, onYesClick, setOpen, children }: any) =>
    open ? (
      <div data-testid="confirmation-modal">
        {children}
        <button data-testid="confirm-delete" onClick={onYesClick}>
          Confirm
        </button>
        <button data-testid="cancel-delete" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    ) : null,
}));

// Mock SuccessToast
jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({ message, open, onClose }: any) =>
    open ? (
      <div data-testid="success-toast">
        <span data-testid="toast-message">{message}</span>
        <button data-testid="toast-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

// Mock TabPersistence
const mockGetGroupDetail = jest.fn();
const mockClearGroupDetail = jest.fn();
jest.mock('src/js/widgets/assignments/utils/tabPersistence', () => ({
  TabPersistence: {
    getGroupDetail: (...args: any[]) => mockGetGroupDetail(...args),
    clearGroupDetail: (...args: any[]) => mockClearGroupDetail(...args),
  },
}));

describe('WorkersTableByGroupsViewContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteGroupCallbacks = {};
    mockDeleteGroupFn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.info.mockClear();
    mockTrack.mockClear();
    mockGetGroupDetail.mockReturnValue(null); // Default: no saved group detail
    mockClearGroupDetail.mockImplementation(() => {});
  });

  const mockGroup1: QueryGroupNode = {
    __typename: 'TimeTracking_Group',
    id: 'group-1',
    name: 'Engineering Team',
    isActive: true,
    stats: {
      __typename: 'TimeTracking_GroupStats',
      memberCount: 10,
      managerCount: 2,
    },
    meta: {
      __typename: 'TimeTracking_GroupMeta',
      version: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      createdBy: 'user-1',
      updatedBy: 'user-1',
    },
  };

  const mockGroup2: QueryGroupNode = {
    __typename: 'TimeTracking_Group',
    id: 'group-2',
    name: 'Design Team',
    isActive: true,
    stats: {
      __typename: 'TimeTracking_GroupStats',
      memberCount: 5,
      managerCount: 1,
    },
    meta: {
      __typename: 'TimeTracking_GroupMeta',
      version: 1,
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
      createdBy: 'user-2',
      updatedBy: 'user-2',
    },
  };

  const mockPageChange = jest.fn();
  const mockRefetch = jest.fn();

  const defaultProps = {
    groups: [mockGroup1, mockGroup2],
    groupsCount: 2,
    isLoading: false,
    error: null,
    currentPage: 1,
    pageSize: 7,
    totalCount: 100,
    onPageChange: mockPageChange,
    refetch: mockRefetch,
  };

  const createMockStore = () =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
      },
    });

  const renderWithStore = (props: any) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <WorkersTableByGroupsViewContent {...props} />
      </Provider>,
    );
  };

  describe('Loading States', () => {
    it('should render loading state when isLoading is true and no groups', () => {
      renderWithStore({
        ...defaultProps,
        groups: [],
        isLoading: true,
      });

      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
      expect(screen.getByTestId('activity-loader')).toHaveAttribute(
        'data-shape',
        'dots',
      );
    });

    it('should render loading row when isLoading is true even with groups', () => {
      renderWithStore({
        ...defaultProps,
        isLoading: true,
      });

      // Should show the loader in the table body for pagination loading
      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('loading-row')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should render error message when error is present', () => {
      renderWithStore({
        ...defaultProps,
        error: 'Failed to load groups',
      });

      expect(screen.getByTestId('page-message')).toBeInTheDocument();
      expect(screen.getByText('Failed to load groups')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should render empty state when no groups and not loading', () => {
      renderWithStore({
        ...defaultProps,
        groups: [],
        groupsCount: 0,
        totalCount: 0,
      });

      // The component uses intl.formatMessage which returns the key
      expect(screen.getByText('groups.empty.description')).toBeInTheDocument();
    });

    it('should open create group drawer when empty state Create group button is clicked', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            {...defaultProps}
            groups={[]}
            groupsCount={0}
            totalCount={0}
          />
        </Provider>,
      );
      const btn = screen.getByTestId('groups-empty-create-group-btn');
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(store.getState().workersGroupView.createGroupDrawerOpen).toBe(
        true,
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="WorkersTableByGroupsViewContent" Event="Create group button clicked (empty state)"',
      );
      expect(mockTrack).toHaveBeenCalled();
    });
  });

  describe('Table Rendering', () => {
    it('should render table with groups', () => {
      renderWithStore(defaultProps);

      expect(screen.getByTestId('groups-list-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-header')).toBeInTheDocument();
      expect(screen.getByTestId('table-body')).toBeInTheDocument();
    });

    it('should render correct number of group rows', () => {
      renderWithStore(defaultProps);

      expect(screen.getByTestId('group-row-group-1')).toBeInTheDocument();
      expect(screen.getByTestId('group-row-group-2')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      renderWithStore(defaultProps);

      const headers = screen.getAllByTestId('table-cell');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination', () => {
    it('should render pagination when totalPages > 1', () => {
      renderWithStore({
        ...defaultProps,
        totalCount: 100,
        pageSize: 7,
      });

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('should not render pagination when totalPages <= 1', () => {
      renderWithStore({
        ...defaultProps,
        totalCount: 5,
        pageSize: 7,
        groupsCount: 5,
      });

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should pass correct props to Pagination component', () => {
      renderWithStore({
        ...defaultProps,
        currentPage: 2,
        pageSize: 7,
        totalCount: 100,
      });

      expect(screen.getByTestId('active-page')).toHaveTextContent('2');
      expect(screen.getByTestId('page-size')).toHaveTextContent('7');
      expect(screen.getByTestId('total-items')).toHaveTextContent('100');
    });

    it('should call onPageChange when pagination is clicked', () => {
      renderWithStore(defaultProps);

      const pageChangeButton = screen.getByTestId('page-change');
      pageChangeButton.click();

      expect(mockPageChange).toHaveBeenCalled();
    });

    it('should track PAGINATION when page change is clicked', () => {
      renderWithStore(defaultProps);

      mockTrack.mockClear();
      const pageChangeButton = screen.getByTestId('page-change');
      pageChangeButton.click();

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'groups_pagination',
        }),
      );
    });
  });

  describe('Table Props', () => {
    it('should pass correct props to HeaderTable', () => {
      renderWithStore(defaultProps);

      const table = screen.getByTestId('groups-list-table');
      expect(table).toHaveAttribute('data-divider', 'horizontal');
      expect(table).toHaveAttribute('data-responsive', 'elevate');
      expect(table).toHaveAttribute('data-hover', 'row');
      expect(table).toHaveAttribute('data-density', 'roomy');
    });
  });

  describe('Delete Modal', () => {
    it('should not render delete modal when not open', () => {
      renderWithStore(defaultProps);

      expect(
        screen.queryByTestId('confirmation-modal'),
      ).not.toBeInTheDocument();
    });

    it('should render delete modal when Redux state has deleteModal open', () => {
      const storeWithModal = configureStore({
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
            groupDetailView: {
              isActive: false,
              groupId: null,
              groupName: null,
              error: null,
            },
            viewByGroups: true,
            currentGroupId: null,
            currentGroupName: null,
            drawerContext: null,
            quickActionDrawerOpen: false,
            quickActionDrawerView: null,
            selectedMembers: {},
            selectedLeads: {},
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
            deleteModal: {
              open: true,
              groupId: 'group-1',
              groupName: 'Engineering Team',
              version: 1,
            },
            workersByGroup: {},
            expandedGroupIds: [],
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

      render(
        <Provider store={storeWithModal}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });

    it('should handle delete modal with missing version', () => {
      // Test the handleConfirmDelete branch when version is null
      const mockDeleteGroup = jest.fn();
      require('src/js/service/hooks/groups/useDeleteGroup').useDeleteGroup.mockReturnValue(
        {
          deleteGroup: mockDeleteGroup,
          isDeleting: false,
        },
      );

      const storeWithModal = configureStore({
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
              hasNextPage: false,
              headerCount: 0,
            },
            groupDetailView: {
              isActive: false,
              groupId: null,
              groupName: null,
              error: null,
            },
            viewByGroups: true,
            currentGroupId: null,
            currentGroupName: null,
            drawerContext: null,
            quickActionDrawerOpen: false,
            quickActionDrawerView: null,
            selectedMembers: {},
            selectedLeads: {},
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
            addWorkerDrawerNameType: WorkerNameType.EMPLOYEE,
            createGroupDrawerOpen: false,
            deleteModal: {
              open: true,
              groupId: 'group-1',
              groupName: 'Engineering Team',
              version: null, // null version
            },
            workersByGroup: {},
            expandedGroupIds: [],
            addWorkerDrawerOpen: false,
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

      render(
        <Provider store={storeWithModal}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      const confirmButton = screen.getByTestId('confirm-delete');
      confirmButton.click();

      // deleteGroup should NOT be called when version is null
      expect(mockDeleteGroup).not.toHaveBeenCalled();
    });

    it('should handle delete modal with missing groupId', () => {
      // Test the handleConfirmDelete branch when groupId is null
      const storeWithModal = configureStore({
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
              hasNextPage: false,
              headerCount: 0,
            },
            groupDetailView: {
              isActive: false,
              groupId: null,
              groupName: null,
              error: null,
            },
            viewByGroups: true,
            currentGroupId: null,
            currentGroupName: null,
            drawerContext: null,
            quickActionDrawerOpen: false,
            quickActionDrawerView: null,
            selectedMembers: {},
            selectedLeads: {},
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
            deleteModal: {
              open: true,
              groupId: null, // null groupId
              groupName: 'Engineering Team',
              version: 1,
            },
            workersByGroup: {},
            expandedGroupIds: [],
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

      render(
        <Provider store={storeWithModal}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      const confirmButton = screen.getByTestId('confirm-delete');
      confirmButton.click();

      // deleteGroup should NOT be called when groupId is null
      expect(mockDeleteGroupFn).not.toHaveBeenCalled();
    });

    it('should call deleteGroup on confirm when groupId and version are present', () => {
      const mockDeleteGroup = jest.fn();
      const useDeleteGroupMock =
        require('src/js/service/hooks/groups/useDeleteGroup').useDeleteGroup;

      // Reset mock to ensure clean state
      useDeleteGroupMock.mockClear();
      useDeleteGroupMock.mockImplementation((callbacks: any) => {
        mockDeleteGroupCallbacks = callbacks;
        return {
          deleteGroup: mockDeleteGroup,
          isDeleting: false,
        };
      });

      const storeWithModal = configureStore({
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
              hasNextPage: false,
              headerCount: 0,
            },
            groupDetailView: {
              isActive: false,
              groupId: null,
              groupName: null,
              error: null,
            },
            viewByGroups: true,
            currentGroupId: null,
            currentGroupName: null,
            drawerContext: null,
            quickActionDrawerOpen: false,
            quickActionDrawerView: null,
            selectedMembers: {},
            selectedLeads: {},
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
            deleteModal: {
              open: true,
              groupId: 'group-1',
              groupName: 'Engineering Team',
              version: 1,
            },
            workersByGroup: {},
            expandedGroupIds: [],
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

      render(
        <Provider store={storeWithModal}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      const confirmButton = screen.getByTestId('confirm-delete');
      confirmButton.click();

      expect(mockDeleteGroup).toHaveBeenCalledWith({
        groupId: 'group-1',
        version: 1,
      });
    });

    it('should close modal on cancel', () => {
      const storeWithModal = configureStore({
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
              hasNextPage: false,
              headerCount: 0,
            },
            groupDetailView: {
              isActive: false,
              groupId: null,
              groupName: null,
              error: null,
            },
            viewByGroups: true,
            currentGroupId: null,
            currentGroupName: null,
            drawerContext: null,
            quickActionDrawerOpen: false,
            quickActionDrawerView: null,
            selectedMembers: {},
            selectedLeads: {},
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
            deleteModal: {
              open: true,
              groupId: 'group-1',
              groupName: 'Engineering Team',
              version: 1,
            },
            workersByGroup: {},
            expandedGroupIds: [],
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

      const store = storeWithModal;
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      const cancelButton = screen.getByTestId('cancel-delete');
      cancelButton.click();

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/closeDeleteModal',
        }),
      );
    });

    it('should handle delete success callback', () => {
      const mockDeleteGroup = jest.fn();
      const storeWithModal = configureStore({
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
              hasNextPage: false,
              headerCount: 0,
            },
            groupDetailView: {
              isActive: false,
              groupId: null,
              groupName: null,
              error: null,
            },
            viewByGroups: true,
            currentGroupId: null,
            currentGroupName: null,
            drawerContext: null,
            quickActionDrawerOpen: false,
            quickActionDrawerView: null,
            selectedMembers: {},
            selectedLeads: {},
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
            deleteModal: {
              open: true,
              groupId: 'group-1',
              groupName: 'Engineering Team',
              version: 1,
            },
            workersByGroup: {},
            expandedGroupIds: [],
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

      const store = storeWithModal;
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const useDeleteGroupMock =
        require('src/js/service/hooks/groups/useDeleteGroup').useDeleteGroup;
      useDeleteGroupMock.mockImplementation((callbacks: any) => {
        mockDeleteGroupCallbacks = callbacks;
        return {
          deleteGroup: mockDeleteGroup,
          isDeleting: false,
        };
      });

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      // Simulate success callback - callbacks are captured during render
      if (mockDeleteGroupCallbacks.onSuccess) {
        mockDeleteGroupCallbacks.onSuccess({} as any);
      }

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/closeDeleteModal',
        }),
      );
    });

    it('should handle delete error callback', () => {
      const mockDeleteGroup = jest.fn();
      const mockError = new Error('Delete failed');
      const storeWithModal = configureStore({
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
              hasNextPage: false,
              headerCount: 0,
            },
            groupDetailView: {
              isActive: false,
              groupId: null,
              groupName: null,
              error: null,
            },
            viewByGroups: true,
            currentGroupId: null,
            currentGroupName: null,
            drawerContext: null,
            quickActionDrawerOpen: false,
            quickActionDrawerView: null,
            selectedMembers: {},
            selectedLeads: {},
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
            deleteModal: {
              open: true,
              groupId: 'group-1',
              groupName: 'Engineering Team',
              version: 1,
            },
            workersByGroup: {},
            expandedGroupIds: [],
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

      const store = storeWithModal;
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const useDeleteGroupMock =
        require('src/js/service/hooks/groups/useDeleteGroup').useDeleteGroup;
      useDeleteGroupMock.mockImplementation((callbacks: any) => {
        mockDeleteGroupCallbacks = callbacks;
        return {
          deleteGroup: mockDeleteGroup,
          isDeleting: false,
        };
      });

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      // Simulate error callback - callbacks are captured during render
      if (mockDeleteGroupCallbacks.onError) {
        mockDeleteGroupCallbacks.onError('Delete failed', 'ERROR_CODE');
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component="WorkersTableByGroupsView" Event="Delete failed"',
        {
          error: 'Delete failed',
          errorCode: 'ERROR_CODE',
        },
      );
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/closeDeleteModal',
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle single group', () => {
      renderWithStore({
        ...defaultProps,
        groups: [mockGroup1],
        groupsCount: 1,
      });

      expect(screen.getByTestId('group-row-group-1')).toBeInTheDocument();
      expect(screen.queryByTestId('group-row-group-2')).not.toBeInTheDocument();
    });

    it('should handle large number of groups', () => {
      const manyGroups = Array.from({ length: 50 }, (_, i) => ({
        ...mockGroup1,
        id: `group-${i}`,
        name: `Group ${i}`,
      }));

      renderWithStore({
        ...defaultProps,
        groups: manyGroups,
        groupsCount: 50,
      });

      expect(screen.getAllByTestId(/group-row-/)).toHaveLength(50);
    });

    it('should handle zero totalCount', () => {
      renderWithStore({
        ...defaultProps,
        groups: [],
        groupsCount: 0,
        totalCount: 0,
      });

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });
  });

  describe('Group Detail Restoration', () => {
    it('should restore group detail view when saved detail exists', () => {
      const savedGroupDetail = {
        groupId: 'group-1',
        groupName: 'Engineering Team',
      };
      mockGetGroupDetail.mockReturnValue(savedGroupDetail);

      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      expect(mockGetGroupDetail).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="WorkersTableByGroupsViewContent" Event="Restoring saved group detail view"',
        {
          groupId: 'group-1',
          groupName: 'Engineering Team',
        },
      );
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/openGroupDetailView',
          payload: {
            groupId: 'group-1',
            groupName: 'Engineering Team',
          },
        }),
      );
      expect(mockClearGroupDetail).toHaveBeenCalled();
    });

    it('should not restore group detail view when no saved detail exists', () => {
      mockGetGroupDetail.mockReturnValue(null);

      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      expect(mockGetGroupDetail).toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Restoring saved group detail view'),
        expect.anything(),
      );
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/openGroupDetailView',
        }),
      );
      expect(mockClearGroupDetail).not.toHaveBeenCalled();
    });

    it('should not restore group detail view when isLoading is true', () => {
      const savedGroupDetail = {
        groupId: 'group-1',
        groupName: 'Engineering Team',
      };
      mockGetGroupDetail.mockReturnValue(savedGroupDetail);

      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} isLoading />
        </Provider>,
      );

      // Should not attempt to restore when loading
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Restoring saved group detail view'),
        expect.anything(),
      );
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/openGroupDetailView',
        }),
      );
    });

    it('should not restore group detail view when error exists', () => {
      const savedGroupDetail = {
        groupId: 'group-1',
        groupName: 'Engineering Team',
      };
      mockGetGroupDetail.mockReturnValue(savedGroupDetail);

      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            {...defaultProps}
            error="Failed to load groups"
          />
        </Provider>,
      );

      // Should not attempt to restore when there's an error
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Restoring saved group detail view'),
        expect.anything(),
      );
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/openGroupDetailView',
        }),
      );
    });

    it('should not restore group detail view when groups array is empty', () => {
      const savedGroupDetail = {
        groupId: 'group-1',
        groupName: 'Engineering Team',
      };
      mockGetGroupDetail.mockReturnValue(savedGroupDetail);

      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent
            {...defaultProps}
            groups={[]}
            groupsCount={0}
          />
        </Provider>,
      );

      // Should not attempt to restore when no groups
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Restoring saved group detail view'),
        expect.anything(),
      );
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/openGroupDetailView',
        }),
      );
    });

    it('should only restore group detail view once', () => {
      const savedGroupDetail = {
        groupId: 'group-1',
        groupName: 'Engineering Team',
      };
      mockGetGroupDetail.mockReturnValue(savedGroupDetail);

      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { rerender } = render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      expect(dispatchSpy).toHaveBeenCalledTimes(1);

      dispatchSpy.mockClear();
      mockLogger.info.mockClear();

      // Rerender with same props
      rerender(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      // Should NOT restore again (hasRestoredGroupDetail ref prevents it)
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Restoring saved group detail view'),
        expect.anything(),
      );
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Delete Error Handling', () => {
    it('should display delete error message when delete fails', () => {
      const store = createMockStore();

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      // Trigger delete error through callback
      if (mockDeleteGroupCallbacks.onError) {
        mockDeleteGroupCallbacks.onError('Delete failed', 'ERROR_CODE');
      }

      expect(screen.getByTestId('page-message')).toBeInTheDocument();
      expect(screen.getByText('Delete failed')).toBeInTheDocument();
    });

    it('should close delete error message when onClose is called', () => {
      const store = createMockStore();

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      // Trigger delete error
      if (mockDeleteGroupCallbacks.onError) {
        mockDeleteGroupCallbacks.onError('Delete failed', 'ERROR_CODE');
      }

      expect(screen.getByTestId('page-message')).toBeInTheDocument();

      // Find and click close button (need to update PageMessage mock)
      const closeButton = screen.getByTestId('page-message-close');
      closeButton.click();

      expect(screen.queryByTestId('page-message')).not.toBeInTheDocument();
    });
  });

  describe('Success Toast', () => {
    it('should display success toast when delete succeeds', () => {
      const store = createMockStore();

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      // Trigger delete success
      if (mockDeleteGroupCallbacks.onSuccess) {
        mockDeleteGroupCallbacks.onSuccess({
          id: 'group-1',
          name: 'Engineering Team',
        });
      }

      expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      expect(screen.getByTestId('toast-message')).toHaveTextContent(
        'groups.delete.success.message',
      );
    });

    it('should close success toast when onClose is called', () => {
      const store = createMockStore();

      render(
        <Provider store={store}>
          <WorkersTableByGroupsViewContent {...defaultProps} />
        </Provider>,
      );

      // Trigger delete success
      if (mockDeleteGroupCallbacks.onSuccess) {
        mockDeleteGroupCallbacks.onSuccess({
          id: 'group-1',
          name: 'Engineering Team',
        });
      }

      expect(screen.getByTestId('success-toast')).toBeInTheDocument();

      // Close toast
      const closeButton = screen.getByTestId('toast-close');
      closeButton.click();

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });
  });

  describe('NTTF - shouldShowGroupLeads', () => {
    it('should hide Leads column header when NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: true,
        loading: false,
      });

      renderWithStore(defaultProps);

      // The "groups.header.groupLeads" header cell should not be rendered
      const headerCells = screen.getAllByTestId('table-cell');
      const headerTexts = headerCells.map((cell) => cell.textContent);
      expect(headerTexts).not.toContain('groups.header.groupLeads');
    });

    it('should pass shouldShowGroupLeads=false to GroupRow when NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: true,
        loading: false,
      });

      renderWithStore(defaultProps);

      const groupRow = screen.getByTestId('group-row-group-1');
      expect(groupRow).toHaveAttribute('data-should-show-group-leads', 'false');
    });

    it('should show Leads column header when not NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        loading: false,
      });

      renderWithStore(defaultProps);

      const headerCells = screen.getAllByTestId('table-cell');
      const headerTexts = headerCells.map((cell) => cell.textContent);
      expect(headerTexts).toContain('groups.header.groupLeads');
    });

    it('should pass shouldShowGroupLeads=true to GroupRow when not NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        loading: false,
      });

      renderWithStore(defaultProps);

      const groupRow = screen.getByTestId('group-row-group-1');
      expect(groupRow).toHaveAttribute('data-should-show-group-leads', 'true');
    });

    it('should use 3-column colspan for loading row when NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: true,
        loading: false,
      });

      renderWithStore({
        ...defaultProps,
        isLoading: true,
      });

      // Loading row cell colSpan should be 3 (without leads column)
      const loadingCell = screen.getByTestId('activity-loader').closest('td');
      expect(loadingCell).toHaveAttribute('colSpan', '3');
    });

    afterEach(() => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        loading: false,
      });
    });
  });
});
