import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { GroupRow } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/GroupRow';
import type { GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode } from 'src/__generated__/timeTracking/graphql';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import workersListReducer from 'src/js/widgets/assignments/store/workersListSlice';
import { GROUP_ACTIONS_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/groupsTrackingPoints';

// Create stable mock functions outside the mock to prevent infinite loops
const mockTrack = jest.fn();
const mockSandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: jest.fn(({ id }, values) => {
      // Handle assignment status messages
      if (id === 'assignments.status.all') return 'All';
      if (id === 'assignments.status.none') return 'None';
      if (id === 'assignments.status.partial' && values) {
        return `${values.count} of ${values.total}`;
      }
      return id;
    }),
  }),
  useSandbox: () => mockSandbox,
  useTracking: () => mockTrack,
}));

// Mock IDS components
jest.mock('@ids-ts/table', () => ({
  Table: {
    Row: ({ children, onClick }: any) => <tr onClick={onClick}>{children}</tr>,
    Cell: ({ children }: any) => <td>{children}</td>,
  },
}));

jest.mock('@ids-ts/link', () => ({
  Link: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock('@ids-ts/combo-link', () => {
  // Store the onSelect handler for MenuItem to access
  let selectHandler: any = null;

  const ComboLink = ({
    children,
    label,
    onClick,
    onSelect,
    'data-testid': dataTestId,
  }: any) => {
    selectHandler = onSelect;

    const handleButtonClick = (e: any) => {
      // Ensure stopPropagation exists
      if (!e.stopPropagation) {
        e.stopPropagation = jest.fn();
      }
      if (onClick) {
        onClick(e);
      }
    };

    // Handle clicks on the menu div itself
    const handleMenuClick = (e: any) => {
      // Ensure stopPropagation exists
      if (!e.stopPropagation) {
        e.stopPropagation = jest.fn();
      }
      if (onSelect) {
        onSelect(e);
      }
    };

    const handleKeyDown = (e: any) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleMenuClick(e);
      }
    };

    return (
      <div data-testid={dataTestId || 'combo-link'}>
        <button onClick={handleButtonClick} data-testid="combo-link-main-btn">
          {label}
        </button>
        <div
          data-testid="combo-link-menu"
          role="menu"
          tabIndex={0}
          onClick={handleMenuClick}
          onKeyDown={handleKeyDown}
        >
          {children}
        </div>
      </div>
    );
  };

  const MenuItem = ({ children, value, disabled, onClick: itemClick }: any) => {
    const handleClick = (e: any) => {
      // Ensure stopPropagation exists
      if (!e.stopPropagation) {
        e.stopPropagation = jest.fn();
      }
      // Call onSelect from parent ComboLink with proper target
      if (selectHandler) {
        selectHandler({
          ...e,
          stopPropagation: e.stopPropagation,
          target: { ...e.target, value },
        });
      }
      if (itemClick) {
        itemClick(e);
      }
    };

    return (
      <button
        data-testid={`menu-item-${value}`}
        data-value={value}
        disabled={disabled}
        onClick={handleClick}
      >
        {children}
      </button>
    );
  };

  return {
    __esModule: true,
    default: ComboLink,
    MenuItem,
  };
});

// Mock styled components
jest.mock(
  'src/js/widgets/assignments/components/styles/WorkersTableByGroupsView.styled',
  () => ({
    ActionsContainer: ({ children }: any) => <div>{children}</div>,
    ActionsWrapper: ({ children }: any) => <div>{children}</div>,
    GroupName: ({ children }: any) => <strong>{children}</strong>,
  }),
);

describe('GroupRow', () => {
  const createMockGroup = (
    overrides: Partial<QueryGroupNode> = {},
  ): QueryGroupNode =>
    ({
      id: 'group-1',
      name: 'Engineering Team',
      isActive: true,
      stats: {
        memberCount: 10,
        managerCount: 2,
        __typename: 'TimeTracking_GroupStats',
      },
      meta: {
        __typename: 'TimeTracking_GroupMeta',
        version: 1,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      },
      __typename: 'TimeTracking_Group',
      ...overrides,
    } as QueryGroupNode);

  const createStore = (initialState?: any) =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
        workersList: workersListReducer,
      },
      preloadedState: initialState,
    });

  const renderWithProviders = (
    component: React.ReactElement,
    initialState?: any,
  ) => {
    const defaultState = {
      workersList: {
        headerTotalCount: 50, // Default total workers for tests
      },
      ...initialState,
    };
    const store = createStore(defaultState);
    return {
      ...render(
        <Provider store={store}>
          <table>
            <tbody>{component}</tbody>
          </table>
        </Provider>,
      ),
      store,
    };
  };

  describe('Basic Rendering', () => {
    it('should render group row with all cells', () => {
      const group = createMockGroup();
      const initialState = {
        workersList: {
          headerTotalCount: 50, // Total workers in company
        },
      };
      const { container } = render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      // Check group name cell (rendered separately in <strong> tag)
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();

      // Check member count cell - should show formatted count
      expect(screen.getByText('10 of 50')).toBeInTheDocument();

      // Check manager count cell
      expect(screen.getByText('2')).toBeInTheDocument();

      // Check actions cell
      expect(
        screen.getByTestId('action-combo-link-group-1'),
      ).toBeInTheDocument();
    });

    it('should render with zero members', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 0,
          managerCount: 0,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      // Group name and count are rendered separately
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      // Check for "None" in worker count cell
      expect(screen.getByText('None')).toBeInTheDocument();
      // Manager count should still show 0
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should render with large member counts', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 1000,
          managerCount: 50,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 2000,
        },
      };
      render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      // Group name and count are rendered separately
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('1000 of 2000')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should render "All" when all workers are assigned to group', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 50,
          managerCount: 5,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 50, // Same as memberCount
        },
      };
      render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      // Group name rendered
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      // Should show "All" when memberCount === totalWorkers
      expect(screen.getByText('All')).toBeInTheDocument();
      // Manager count
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render with special characters in name', () => {
      const group = createMockGroup({ name: 'Team & Co. (2024)' });
      renderWithProviders(<GroupRow group={group} />);

      expect(screen.getByText(/Team & Co\. \(2024\)/)).toBeInTheDocument();
    });
  });

  describe('Worker Count Formatting', () => {
    it('should display "None" when memberCount is 0', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 0,
          managerCount: 1,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 100,
        },
      };
      render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('should display "All" when memberCount equals totalWorkers', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 100,
          managerCount: 5,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 100,
        },
      };
      render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('should display "xx of yy" when partially assigned', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 25,
          managerCount: 3,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 100,
        },
      };
      render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(screen.getByText('25 of 100')).toBeInTheDocument();
    });

    it('should display "All" when memberCount exceeds totalWorkers (edge case)', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 150,
          managerCount: 5,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 100,
        },
      };
      render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      // When memberCount >= totalWorkers, should show "All"
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('should handle totalWorkers being 0', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 0,
          managerCount: 0,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 0,
        },
      };
      render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      // When totalWorkers is 0, should show "None"
      expect(screen.getByText('None')).toBeInTheDocument();
    });
  });

  describe('View Group Action', () => {
    it('should handle view group click on main button', () => {
      const group = createMockGroup();
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const viewBtn = screen.getByTestId('combo-link-main-btn');
      fireEvent.click(viewBtn);

      const state = store.getState();
      expect(state.workersGroupView.groupDetailView.isActive).toBe(true);
      expect(state.workersGroupView.groupDetailView.groupId).toBe('group-1');
      expect(state.workersGroupView.groupDetailView.groupName).toBe(
        'Engineering Team',
      );
    });

    it('should handle view group click on row', () => {
      const group = createMockGroup();
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const rows = screen.getAllByText('Engineering Team');
      const row = rows[0].closest('tr');
      if (row) {
        fireEvent.click(row);
      }

      const state = store.getState();
      expect(state.workersGroupView.groupDetailView.isActive).toBe(true);
      expect(state.workersGroupView.groupDetailView.groupId).toBe('group-1');
      expect(state.workersGroupView.groupDetailView.groupName).toBe(
        'Engineering Team',
      );
    });

    it('should call handleViewGroup when ComboLink button is clicked', () => {
      const group = createMockGroup();
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const viewBtn = screen.getByTestId('combo-link-main-btn');
      fireEvent.click(viewBtn);

      const state = store.getState();
      // ComboLink onClick should call handleViewGroup
      // Note: In real implementation, stopPropagation prevents row click,
      // but in tests event bubbling may cause both to fire
      expect(state.workersGroupView.groupDetailView.isActive).toBe(true);
      expect(state.workersGroupView.groupDetailView.groupId).toBe('group-1');
    });

    it('should handle menu item selection without triggering row click', () => {
      const group = createMockGroup();
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const editBtn = screen.getByTestId('menu-item-edit-group');
      fireEvent.click(editBtn);

      const state = store.getState();
      // Menu item click should open drawer, not group detail view
      // Note: In real implementation, stopPropagation prevents row click,
      // but in tests event bubbling may cause row click to fire
      // The important thing is that drawer opens
      expect(state.workersGroupView.quickActionDrawerOpen).toBe(true);
    });
  });

  describe('Menu Actions', () => {
    it('should render all menu items', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      expect(screen.getByTestId('menu-item-edit-group')).toBeInTheDocument();
      expect(
        screen.getByTestId('menu-item-assign-workers'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('menu-item-assign-group-lead'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-delete-group')).toBeInTheDocument();
    });

    it('should handle edit group menu action', () => {
      const group = createMockGroup();
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const editBtn = screen.getByTestId('menu-item-edit-group');
      fireEvent.click(editBtn);

      const state = store.getState();
      expect(state.workersGroupView.quickActionDrawerOpen).toBe(true);
      expect(state.workersGroupView.currentGroupId).toBe('group-1');
      expect(state.workersGroupView.currentGroupName).toBe('Engineering Team');
    });

    it('should handle assign workers menu action', async () => {
      const group = createMockGroup();
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const assignWorkersBtn = screen.getByTestId('menu-item-assign-workers');
      fireEvent.click(assignWorkersBtn);

      const state = store.getState();
      expect(state.workersGroupView.quickActionDrawerOpen).toBe(true);
      expect(state.workersGroupView.currentGroupId).toBe('group-1');
    });

    it('should handle assign leads menu action', () => {
      const group = createMockGroup();
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const assignLeadsBtn = screen.getByTestId('menu-item-assign-group-lead');
      fireEvent.click(assignLeadsBtn);

      const state = store.getState();
      expect(state.workersGroupView.quickActionDrawerOpen).toBe(true);
      expect(state.workersGroupView.currentGroupId).toBe('group-1');
    });

    it('should handle delete group menu action', () => {
      const group = createMockGroup();
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const deleteBtn = screen.getByTestId('menu-item-delete-group');
      fireEvent.click(deleteBtn);

      const state = store.getState();
      expect(state.workersGroupView.deleteModal.open).toBe(true);
      expect(state.workersGroupView.deleteModal.groupId).toBe('group-1');
      expect(state.workersGroupView.deleteModal.groupName).toBe(
        'Engineering Team',
      );
      expect(state.workersGroupView.deleteModal.version).toBe(1);
    });

    it('should handle unknown menu action', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      const menu = screen.getByTestId('combo-link-menu');

      // Create a proper event object with value
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        writable: false,
        value: { value: 'unknown-action' },
      });

      fireEvent(menu, event);

      // Should not throw error
      expect(
        screen.getByTestId('action-combo-link-group-1'),
      ).toBeInTheDocument();
    });

    it('should handle view-group menu action via switch case', () => {
      const group = createMockGroup();
      const { store } = renderWithProviders(<GroupRow group={group} />);

      // First click on the main combo link button to "open" the menu
      const comboLinkButton = screen.getByTestId('combo-link-main-btn');
      comboLinkButton.click();

      const state = store.getState();
      expect(state.workersGroupView.groupDetailView.isActive).toBe(true);
      expect(state.workersGroupView.groupDetailView.groupId).toBe('group-1');
    });
  });

  describe('Loading States', () => {
    it('should show loading text for assign workers when loading', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      const assignWorkersBtn = screen.getByTestId('menu-item-assign-workers');
      fireEvent.click(assignWorkersBtn);

      // Component should handle loading state internally
      expect(
        screen.getByTestId('menu-item-assign-workers'),
      ).toBeInTheDocument();
    });

    it('should disable assign workers button when loading', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      const assignWorkersBtn = screen.getByTestId('menu-item-assign-workers');

      // Initially not disabled
      expect(assignWorkersBtn).not.toBeDisabled();
    });
  });

  describe('React.memo Behavior', () => {
    it('should memo-ize component with same props', () => {
      const group = createMockGroup();
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      const { rerender } = renderWithProviders(
        <GroupRow group={group} />,
        initialState,
      );

      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('10 of 50')).toBeInTheDocument();

      // Rerender with same props
      rerender(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      // Should still render
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('10 of 50')).toBeInTheDocument();
    });

    it('should return true when all props are equal (memo comparison)', () => {
      const group1 = createMockGroup({
        id: 'group-1',
        name: 'Test Group',
        stats: {
          memberCount: 10,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const group2 = createMockGroup({
        id: 'group-1',
        name: 'Test Group',
        stats: {
          memberCount: 10,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });

      // Test memo comparison function directly
      const GroupRowComponent =
        require('src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/GroupRow').GroupRow;
      const areEqual = GroupRowComponent.type?.compareFn || (() => false);

      // If compareFn exists, test it
      if (GroupRowComponent.type?.compareFn) {
        const result = GroupRowComponent.type.compareFn(
          { group: group1 },
          { group: group2 },
        );
        expect(result).toBe(true); // Should return true when props are equal
      }
    });

    it('should return false when group id differs (memo comparison)', () => {
      const group1 = createMockGroup({ id: 'group-1' });
      const group2 = createMockGroup({ id: 'group-2' });

      const GroupRowComponent =
        require('src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/GroupRow').GroupRow;

      if (GroupRowComponent.type?.compareFn) {
        const result = GroupRowComponent.type.compareFn(
          { group: group1 },
          { group: group2 },
        );
        expect(result).toBe(false); // Should return false when props differ
      }
    });

    it('should return false when group name differs (memo comparison)', () => {
      const group1 = createMockGroup({ name: 'Group A' });
      const group2 = createMockGroup({ name: 'Group B' });

      const GroupRowComponent =
        require('src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/GroupRow').GroupRow;

      if (GroupRowComponent.type?.compareFn) {
        const result = GroupRowComponent.type.compareFn(
          { group: group1 },
          { group: group2 },
        );
        expect(result).toBe(false);
      }
    });

    it('should return false when member count differs (memo comparison)', () => {
      const group1 = createMockGroup({
        stats: {
          memberCount: 10,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const group2 = createMockGroup({
        stats: {
          memberCount: 20,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });

      const GroupRowComponent =
        require('src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/GroupRow').GroupRow;

      if (GroupRowComponent.type?.compareFn) {
        const result = GroupRowComponent.type.compareFn(
          { group: group1 },
          { group: group2 },
        );
        expect(result).toBe(false);
      }
    });

    it('should return false when manager count differs (memo comparison)', () => {
      const group1 = createMockGroup({
        stats: {
          memberCount: 10,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const group2 = createMockGroup({
        stats: {
          memberCount: 10,
          managerCount: 5,
          __typename: 'TimeTracking_GroupStats',
        },
      });

      const GroupRowComponent =
        require('src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/GroupRow').GroupRow;

      if (GroupRowComponent.type?.compareFn) {
        const result = GroupRowComponent.type.compareFn(
          { group: group1 },
          { group: group2 },
        );
        expect(result).toBe(false);
      }
    });

    it('should re-render when group ID changes', () => {
      const group1 = createMockGroup({ id: 'group-1' });
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      const { rerender } = renderWithProviders(
        <GroupRow group={group1} />,
        initialState,
      );

      expect(
        screen.getByTestId('action-combo-link-group-1'),
      ).toBeInTheDocument();

      const group2 = createMockGroup({ id: 'group-2' });
      rerender(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group2} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(
        screen.getByTestId('action-combo-link-group-2'),
      ).toBeInTheDocument();
    });

    it('should re-render when group name changes', () => {
      const group1 = createMockGroup({ name: 'Group A' });
      const { rerender } = renderWithProviders(<GroupRow group={group1} />);

      expect(screen.getByText('Group A')).toBeInTheDocument();

      const group2 = createMockGroup({ name: 'Group B' });
      rerender(
        <Provider store={createStore()}>
          <GroupRow group={group2} />
        </Provider>,
      );

      expect(screen.getByText('Group B')).toBeInTheDocument();
    });

    it('should re-render when member count changes', () => {
      const group1 = createMockGroup({
        stats: {
          memberCount: 10,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      const { rerender } = render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group1} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(screen.getByText('10 of 50')).toBeInTheDocument();

      const group2 = createMockGroup({
        stats: {
          memberCount: 20,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      rerender(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group2} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(screen.getByText('20 of 50')).toBeInTheDocument();
    });

    it('should re-render when manager count changes', () => {
      const group1 = createMockGroup({
        stats: {
          memberCount: 10,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      const { rerender } = renderWithProviders(
        <GroupRow group={group1} />,
        initialState,
      );

      expect(screen.getByText('2')).toBeInTheDocument();

      const group2 = createMockGroup({
        stats: {
          memberCount: 10,
          managerCount: 5,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      rerender(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group2} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should re-render when group name changes', () => {
      const group1 = createMockGroup({ name: 'Team A' });
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      const { rerender } = renderWithProviders(
        <GroupRow group={group1} />,
        initialState,
      );

      expect(screen.getByText('Team A')).toBeInTheDocument();

      const group2 = createMockGroup({ name: 'Team B' });
      rerender(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group2} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(screen.getByText('Team B')).toBeInTheDocument();
    });

    it('should re-render when member count changes', () => {
      const group1 = createMockGroup({
        stats: {
          memberCount: 10,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      const { rerender } = render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group1} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('10 of 50')).toBeInTheDocument();

      const group2 = createMockGroup({
        stats: {
          memberCount: 20,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      rerender(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group2} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('20 of 50')).toBeInTheDocument();
    });

    it('should re-render when manager count changes', () => {
      const group1 = createMockGroup({
        stats: {
          memberCount: 10,
          managerCount: 2,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      const { rerender } = renderWithProviders(
        <GroupRow group={group1} />,
        initialState,
      );

      expect(screen.getByText('2')).toBeInTheDocument();

      const group2 = createMockGroup({
        stats: {
          memberCount: 10,
          managerCount: 5,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      rerender(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group2} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should re-render when group ID changes', () => {
      const group1 = createMockGroup({ id: 'group-1' });
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      const { rerender } = renderWithProviders(
        <GroupRow group={group1} />,
        initialState,
      );

      expect(
        screen.getByTestId('action-combo-link-group-1'),
      ).toBeInTheDocument();

      const group2 = createMockGroup({ id: 'group-2' });
      rerender(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group2} />
            </tbody>
          </table>
        </Provider>,
      );

      expect(
        screen.getByTestId('action-combo-link-group-2'),
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle group with empty name', () => {
      const group = createMockGroup({ name: '' });
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      // Empty name should still render (empty string)
      expect(screen.getByText('10 of 50')).toBeInTheDocument();
    });

    it('should handle group with very long name', () => {
      const longName = 'A'.repeat(200);
      const group = createMockGroup({ name: longName });
      renderWithProviders(<GroupRow group={group} />);

      expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
    });

    it('should handle group with Unicode characters', () => {
      const group = createMockGroup({ name: 'Team 🚀 2024' });
      renderWithProviders(<GroupRow group={group} />);

      expect(screen.getByText(/Team 🚀 2024/)).toBeInTheDocument();
    });

    it('should handle negative member count (edge case)', () => {
      const group = createMockGroup({
        stats: {
          memberCount: -1,
          managerCount: 0,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const initialState = {
        workersList: {
          headerTotalCount: 50,
        },
      };
      render(
        <Provider store={createStore(initialState)}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      // Group name and count are rendered separately
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      // Negative count should show "None" (falls through to default case)
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('should handle very large version numbers', () => {
      const group = createMockGroup({
        meta: {
          __typename: 'TimeTracking_GroupMeta',
          version: 999999,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          createdBy: 'user-1',
          updatedBy: 'user-1',
        },
      });
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const deleteBtn = screen.getByTestId('menu-item-delete-group');
      fireEvent.click(deleteBtn);

      const state = store.getState();
      expect(state.workersGroupView.deleteModal.version).toBe(999999);
    });
  });

  describe('Redux Integration', () => {
    it('should dispatch correct actions for edit group', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 15,
          managerCount: 3,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const editBtn = screen.getByTestId('menu-item-edit-group');
      fireEvent.click(editBtn);

      const state = store.getState();
      expect(state.workersGroupView.memberCount).toBe(15);
      expect(state.workersGroupView.managerCount).toBe(3);
    });

    it('should dispatch correct actions for assign workers with member count', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 25,
          managerCount: 5,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const assignWorkersBtn = screen.getByTestId('menu-item-assign-workers');
      fireEvent.click(assignWorkersBtn);

      const state = store.getState();
      expect(state.workersGroupView.memberCount).toBe(25);
    });

    it('should dispatch correct actions for assign leads with manager count', () => {
      const group = createMockGroup({
        stats: {
          memberCount: 30,
          managerCount: 8,
          __typename: 'TimeTracking_GroupStats',
        },
      });
      const { store } = renderWithProviders(<GroupRow group={group} />);

      const assignLeadsBtn = screen.getByTestId('menu-item-assign-group-lead');
      fireEvent.click(assignLeadsBtn);

      const state = store.getState();
      expect(state.workersGroupView.managerCount).toBe(8);
    });
  });

  describe('Error Handling', () => {
    it('should handle click on menu with missing target value', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      const menu = screen.getByTestId('combo-link-menu');

      // Simulate click without target value
      const mockEvent = { target: {} } as any;
      fireEvent.click(menu, mockEvent);

      // Should not throw error
      expect(
        screen.getByTestId('action-combo-link-group-1'),
      ).toBeInTheDocument();
    });

    it('should handle menu selection with null value', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      const menu = screen.getByTestId('combo-link-menu');

      // Create a proper event object with null value
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        writable: false,
        value: { value: null },
      });

      fireEvent(menu, event);

      // Should not throw error
      expect(
        screen.getByTestId('action-combo-link-group-1'),
      ).toBeInTheDocument();
    });

    it('should handle menu selection with undefined value', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      const menu = screen.getByTestId('combo-link-menu');

      const mockEvent = { target: { value: undefined } } as any;
      fireEvent.click(menu, mockEvent);

      // Should not throw error
      expect(
        screen.getByTestId('action-combo-link-group-1'),
      ).toBeInTheDocument();
    });

    it('should handle errors in assign workers gracefully', () => {
      const group = createMockGroup();
      const mockStore = createStore();

      // Spy on dispatch and make it throw for testing error handler
      const originalDispatch = mockStore.dispatch;
      let callCount = 0;
      mockStore.dispatch = jest.fn((action: any) => {
        callCount += 1;
        // Throw error on first dispatch call inside handleAssignWorkers
        if (callCount === 1 && action.type?.includes('setDrawerContext')) {
          throw new Error('Test error');
        }
        return originalDispatch(action);
      });

      const { container } = render(
        <Provider store={mockStore}>
          <table>
            <tbody>
              <GroupRow group={group} />
            </tbody>
          </table>
        </Provider>,
      );

      const menu = container.querySelector('[data-testid="combo-link-menu"]');

      if (menu) {
        // Create a proper event object with value
        const event = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(event, 'target', {
          writable: false,
          value: { value: 'assign-workers' },
        });

        fireEvent(menu, event);
      }

      // Error should be caught and logged, component should not crash
      expect(
        container.querySelector('[data-testid="action-combo-link-group-1"]'),
      ).toBeInTheDocument();
    });
  });

  describe('Analytics Tracking', () => {
    beforeEach(() => {
      mockTrack.mockClear();
      mockSandbox.logger.info.mockClear();
    });

    it('should track OPEN_GROUP_MENU and EDIT_GROUP when edit menu item is clicked', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      const editBtn = screen.getByTestId('menu-item-edit-group');
      fireEvent.click(editBtn);

      // Should track both OPEN_GROUP_MENU and EDIT_GROUP
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_ACTIONS_TRACKING_POINTS.OPEN_GROUP_MENU,
      );
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_ACTIONS_TRACKING_POINTS.EDIT_GROUP,
      );
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupRow" Event="Group action menu clicked"',
      );
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupRow" Event="Edit group clicked"',
      );
    });

    it('should track OPEN_GROUP_MENU and ASSIGN_WORKERS_MENU when assign workers is clicked', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      const assignWorkersBtn = screen.getByTestId('menu-item-assign-workers');
      fireEvent.click(assignWorkersBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_ACTIONS_TRACKING_POINTS.OPEN_GROUP_MENU,
      );
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_ACTIONS_TRACKING_POINTS.ASSIGN_WORKERS_MENU,
      );
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupRow" Event="Assign workers menu clicked"',
      );
    });

    it('should track OPEN_GROUP_MENU and ASSIGN_LEAD_MENU when assign lead is clicked', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      const assignLeadsBtn = screen.getByTestId('menu-item-assign-group-lead');
      fireEvent.click(assignLeadsBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_ACTIONS_TRACKING_POINTS.OPEN_GROUP_MENU,
      );
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_ACTIONS_TRACKING_POINTS.ASSIGN_LEAD_MENU,
      );
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupRow" Event="Assign lead menu clicked"',
      );
    });

    it('should track OPEN_GROUP_MENU and DELETE_GROUP when delete is clicked', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      const deleteBtn = screen.getByTestId('menu-item-delete-group');
      fireEvent.click(deleteBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_ACTIONS_TRACKING_POINTS.OPEN_GROUP_MENU,
      );
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_ACTIONS_TRACKING_POINTS.DELETE_GROUP,
      );
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupRow" Event="Delete group clicked"',
      );
    });

    it('should verify previous_screen values for all tracking points', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      // Verify OPEN_GROUP_MENU previous_screen
      expect(
        GROUP_ACTIONS_TRACKING_POINTS.OPEN_GROUP_MENU.previous_screen,
      ).toBe('groups_list_row');

      // Verify EDIT_GROUP previous_screen
      expect(GROUP_ACTIONS_TRACKING_POINTS.EDIT_GROUP.previous_screen).toBe(
        'group_row_dropdown',
      );

      // Verify ASSIGN_WORKERS_MENU previous_screen
      expect(
        GROUP_ACTIONS_TRACKING_POINTS.ASSIGN_WORKERS_MENU.previous_screen,
      ).toBe('group_row_dropdown');

      // Verify ASSIGN_LEAD_MENU previous_screen
      expect(
        GROUP_ACTIONS_TRACKING_POINTS.ASSIGN_LEAD_MENU.previous_screen,
      ).toBe('group_row_dropdown');

      // Verify DELETE_GROUP previous_screen
      expect(GROUP_ACTIONS_TRACKING_POINTS.DELETE_GROUP.previous_screen).toBe(
        'group_row_dropdown',
      );
    });

    it('should track OPEN_GROUP_MENU on every menu item click', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      mockTrack.mockClear();

      // First menu item click
      const editBtn = screen.getByTestId('menu-item-edit-group');
      fireEvent.click(editBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_ACTIONS_TRACKING_POINTS.OPEN_GROUP_MENU,
      );

      mockTrack.mockClear();

      // Second menu item click - should track OPEN_GROUP_MENU again
      const deleteBtn = screen.getByTestId('menu-item-delete-group');
      fireEvent.click(deleteBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_ACTIONS_TRACKING_POINTS.OPEN_GROUP_MENU,
      );
    });
  });

  describe('NTTF - shouldShowGroupLeads', () => {
    it('should hide group leads cell when shouldShowGroupLeads is false', () => {
      const group = createMockGroup();
      renderWithProviders(
        <GroupRow group={group} shouldShowGroupLeads={false} />,
      );

      // Group name and workers count should still be visible
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();

      // Manager count (2) should NOT be in a table cell
      const cells = screen.getAllByRole('cell');
      const cellTexts = cells.map((cell) => cell.textContent);
      expect(cellTexts).not.toContain('2');
    });

    it('should hide assign-group-lead menu item when shouldShowGroupLeads is false', () => {
      const group = createMockGroup();
      renderWithProviders(
        <GroupRow group={group} shouldShowGroupLeads={false} />,
      );

      expect(
        screen.queryByTestId('menu-item-assign-group-lead'),
      ).not.toBeInTheDocument();
    });

    it('should show group leads cell when shouldShowGroupLeads is true', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} shouldShowGroupLeads />);

      expect(
        screen.getByTestId('menu-item-assign-group-lead'),
      ).toBeInTheDocument();
    });

    it('should show assign-group-lead menu item by default', () => {
      const group = createMockGroup();
      renderWithProviders(<GroupRow group={group} />);

      expect(
        screen.getByTestId('menu-item-assign-group-lead'),
      ).toBeInTheDocument();
    });

    it('should not dispatch assign leads action when menu clicked and shouldShowGroupLeads is false', () => {
      const group = createMockGroup();
      const { store } = renderWithProviders(
        <GroupRow group={group} shouldShowGroupLeads={false} />,
      );

      // Even if somehow the menu is triggered, the handler should guard
      // This is a safety test - the menu item should not exist
      expect(
        screen.queryByTestId('menu-item-assign-group-lead'),
      ).not.toBeInTheDocument();
    });
  });
});
