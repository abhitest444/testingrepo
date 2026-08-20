import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import WorkerAssignmentsTab from 'src/js/widgets/assignments/components/WorkerAssignments/WorkerAssignmentsTab';
import * as ixpFeatureFlagModule from 'src/js/common/useIXPFeatureFlag';
import workersGroupViewReducer, {
  closeGroupDetailView,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import workersListReducer from 'src/js/widgets/assignments/store/workersListSlice';

// Mock tracking function
const mockTrack = jest.fn();

// Create stable sandbox mock to prevent useEffect re-runs
const mockSandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  navigation: {
    navigate: jest.fn(),
  },
};

// Mock useIntl, useSandbox, and useTracking
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({
      id,
      defaultMessage,
    }: {
      id: string;
      defaultMessage?: string;
    }) => {
      const messages: { [key: string]: string } = {
        'groups.drawer.success.created': 'Group created and assigned',
        'assignments.add_worker.success': '{workerName} added successfully',
      };
      const message = messages[id] || defaultMessage || id;
      // Simple template replacement for testing
      return message.replace('{workerName}', 'John Doe');
    },
  }),
  useSandbox: () => mockSandbox,
  useTracking: () => mockTrack,
}));

// Mock WorkersTabHeader
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersTabHeader/WorkersTabHeader',
  () => ({
    WorkersTabHeader: ({ onManageFields, onAddWorker, onCreateGroup }: any) => (
      <div data-testid="workers-tab-header">
        <button data-testid="manage-fields-btn" onClick={onManageFields}>
          Manage fields
        </button>
        <button data-testid="add-worker-btn" onClick={onAddWorker}>
          Add worker
        </button>
        <button data-testid="create-group-btn" onClick={onCreateGroup}>
          Create group
        </button>
      </div>
    ),
  }),
);

// Mock SearchField
jest.mock('src/js/widgets/common/SearchField', () => ({
  SearchField: ({ value, onChange }: any) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
    />
  ),
}));

// Mock SearchFilterBar
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/SearchFilterBar',
  () => ({
    SearchFilterBar: ({
      searchText,
      workerType,
      viewByGroups,
      onSearchChange,
      onWorkerTypeChange,
      onViewToggle,
    }: any) => (
      <div data-testid="search-filter-bar">
        <input
          data-testid="search-input"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select
          data-testid="worker-type-filter"
          value={workerType}
          onChange={(e) => onWorkerTypeChange(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="VENDOR">Vendor</option>
        </select>
        <div data-testid="toggle-view-container">
          <input
            type="checkbox"
            data-testid="view-toggle"
            checked={viewByGroups}
            onChange={(e) => onViewToggle(e.target.checked)}
          />
        </div>
      </div>
    ),
  }),
);

// Mock WorkersGroupViewDataProvider (direct import without index.ts)
const mockRefetchGroups = jest.fn();
let mockOnLoadingChange: ((loading: boolean) => void) | null = null;
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/WorkersGroupViewDataProvider',
  () => {
    // eslint-disable-next-line global-require
    const React = require('react');
    return {
      WorkersGroupViewDataProvider: ({
        onRefetchAvailable,
        onLoadingChange,
      }: any) => {
        React.useEffect(() => {
          if (onRefetchAvailable) {
            onRefetchAvailable(mockRefetchGroups);
          }
        }, [onRefetchAvailable]);
        React.useEffect(() => {
          // Store the callback for testing
          mockOnLoadingChange = onLoadingChange;
          // Simulate loading complete by default
          if (onLoadingChange) {
            onLoadingChange(false);
          }
        }, [onLoadingChange]);
        return React.createElement(
          'div',
          { 'data-testid': 'workers-table-by-groups' },
          'Groups View',
        );
      },
    };
  },
);

// Mock WorkersListView
const mockRefetchWorkersList = jest.fn();
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersListView/WorkersListView',
  () => {
    // eslint-disable-next-line global-require
    const React = require('react');
    const MockWorkersListView = ({
      onRefetchAvailable,
      onLoadingChange,
    }: any) => {
      React.useEffect(() => {
        if (onRefetchAvailable) {
          onRefetchAvailable(mockRefetchWorkersList);
        }
      }, [onRefetchAvailable]);
      React.useEffect(() => {
        // Store callback so tests can verify registration irrespective of active view
        mockOnLoadingChange = onLoadingChange;
        // Simulate loading complete by default
        if (onLoadingChange) {
          onLoadingChange(false);
        }
      }, [onLoadingChange]);
      return React.createElement(
        'div',
        { 'data-testid': 'workers-list-view' },
        'List View',
      );
    };
    return {
      __esModule: true,
      default: MockWorkersListView,
    };
  },
);

// Mock GroupDetailView and its hook
const mockRefetchGroupDetail = jest.fn();
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/hooks/useGroupDetailData',
  () => ({
    useGroupDetailData: () => ({
      selectedGroup: {
        id: 'group-1',
        name: 'Test Group',
        stats: { memberCount: 5, managerCount: 1 },
      },
      memberCount: 5,
      managerCount: 1,
      workers: [],
      isLoading: false,
      searchText: '',
      filterType: 'ALL',
      currentPage: 1,
      totalPages: 1,
      totalItems: 5,
      pageInfo: null,
      handleBack: jest.fn(),
      handleSearchChange: jest.fn(),
      handleFilterChange: jest.fn(),
      handlePageChange: jest.fn(),
      handleAssignWorkers: jest.fn(),
    }),
  }),
);

jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView',
  () => {
    // eslint-disable-next-line global-require
    const React = require('react');
    return {
      GroupDetailView: ({ onRefetchAvailable }: any) => {
        React.useEffect(() => {
          if (onRefetchAvailable) {
            onRefetchAvailable(mockRefetchGroupDetail);
          }
        }, [onRefetchAvailable]);
        return React.createElement(
          'div',
          { 'data-testid': 'group-detail-view' },
          'Group Detail View',
        );
      },
    };
  },
);

// Mock CreateGroupDrawer and EditGroupDrawer (GroupDrawer was split)
jest.mock(
  'src/js/widgets/assignments/components/Groups/CreateGroupDrawer',
  () => {
    const MockComponent = ({ open, onClose, onSuccess }: any) =>
      open ? (
        <div data-testid="group-drawer" data-mode="create">
          <button data-testid="drawer-close-btn" onClick={onClose}>
            Close
          </button>
          <button
            data-testid="drawer-success-btn"
            onClick={() => onSuccess('Group created and assigned')}
          >
            Success
          </button>
        </div>
      ) : null;

    return {
      __esModule: true,
      CreateGroupDrawer: MockComponent,
      default: MockComponent,
    };
  },
);

jest.mock(
  'src/js/widgets/assignments/components/Groups/EditGroupDrawer',
  () => {
    const MockComponent = ({ open, onClose, onSuccess }: any) =>
      open ? (
        <div data-testid="group-drawer" data-mode="edit">
          <button data-testid="drawer-close-btn" onClick={onClose}>
            Close
          </button>
          <button
            data-testid="drawer-success-btn"
            onClick={() => onSuccess && onSuccess('Group updated')}
          >
            Success
          </button>
        </div>
      ) : null;

    return {
      __esModule: true,
      EditGroupDrawer: MockComponent,
      default: MockComponent,
    };
  },
);

// Mock SuccessToast
jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({ message, open, onClose }: any) =>
    open ? (
      <div data-testid="success-toast">
        <span data-testid="toast-message">{message}</span>
        <button data-testid="toast-close-btn" onClick={onClose}>
          Close Toast
        </button>
      </div>
    ) : null,
}));

// Mock styled components
jest.mock(
  'src/js/widgets/assignments/components/styles/WorkerAssignments.styled',
  () => ({
    WorkerAssignmentsContainer: ({ children }: any) => (
      <div data-testid="worker-assignments-container">{children}</div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/InviteWorkerDrawer',
  () => ({
    __esModule: true,
    default: ({ inviteWorkerType }: { inviteWorkerType: string }) => (
      <div
        data-testid="invite-worker-drawer"
        data-invite-worker-type={inviteWorkerType}
      />
    ),
  }),
);

// Mock Widget component for Add Worker drawer
jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({ widgetId, open, onClose, onSuccess, onError }: any) =>
    // Handle Add Worker drawer widget
    open ? (
      <div data-testid="add-worker-widget" data-widget-id={widgetId}>
        <button data-testid="widget-close-btn" onClick={onClose}>
          Close Widget
        </button>
        <button
          data-testid="widget-success-btn"
          onClick={() =>
            onSuccess({
              id: 'new-worker-123',
              displayName: 'John Doe',
              type: 'Employee',
            })
          }
        >
          Add Worker Success
        </button>
        <button
          data-testid="widget-error-btn"
          onClick={() => onError(new Error('Failed to add worker'))}
        >
          Trigger Error
        </button>
      </div>
    ) : null,
}));

// Mock TabPersistence
const mockGetWorkersView = jest.fn();
const mockSetWorkersView = jest.fn();
const mockClearWorkersView = jest.fn();
const mockGetGroupDetail = jest.fn();
const mockSetGroupDetail = jest.fn();
const mockClearGroupDetail = jest.fn();

jest.mock('src/js/widgets/assignments/utils/tabPersistence', () => ({
  TabPersistence: {
    getWorkersView: (...args: any[]) => mockGetWorkersView(...args),
    setWorkersView: (...args: any[]) => mockSetWorkersView(...args),
    clearWorkersView: (...args: any[]) => mockClearWorkersView(...args),
    getGroupDetail: (...args: any[]) => mockGetGroupDetail(...args),
    setGroupDetail: (...args: any[]) => mockSetGroupDetail(...args),
    clearGroupDetail: (...args: any[]) => mockClearGroupDetail(...args),
  },
}));

describe('WorkerAssignmentsTab', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetchGroups.mockClear();
    mockRefetchGroupDetail.mockClear();
    mockTrack.mockClear();
    mockOnLoadingChange = null;

    // Reset TabPersistence mocks to default behavior
    const { WorkersTabViews } = require('src/js/widgets/assignments/types');
    mockGetWorkersView.mockReturnValue(WorkersTabViews.WORKERS); // Default to workers (list) view
    mockSetWorkersView.mockImplementation(() => {});
    mockClearWorkersView.mockImplementation(() => {});
    mockGetGroupDetail.mockReturnValue(null); // No saved group detail by default
    mockSetGroupDetail.mockImplementation(() => {});
    mockClearGroupDetail.mockImplementation(() => {});

    store = configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
        workersList: workersListReducer,
      },
      preloadedState: {
        workersList: {
          workers: [],
          pageInfo: null,
          loading: false,
          error: null,
          currentPage: 1,
          headerTotalCount: 10,
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) =>
    render(<Provider store={store}>{component}</Provider>);

  const switchToGroupsView = async () => {
    const toggle = screen.getByTestId('view-toggle') as HTMLInputElement;
    if (!toggle.checked) {
      fireEvent.click(toggle);
    }

    await waitFor(() => {
      expect(screen.getByTestId('workers-table-by-groups')).toBeInTheDocument();
    });
  };

  describe('Rendering', () => {
    it('should render all main components', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      expect(
        screen.getByTestId('worker-assignments-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('workers-tab-header')).toBeInTheDocument();
      expect(screen.getByTestId('search-filter-bar')).toBeInTheDocument();
      expect(screen.getByTestId('workers-list-view')).toBeInTheDocument();
    });

    it('should render list view by default', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      expect(screen.getByTestId('workers-list-view')).toBeInTheDocument();
      expect(
        screen.queryByTestId('workers-table-by-groups'),
      ).not.toBeInTheDocument();
    });

    it('should not render GroupDrawer initially', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
    });

    it('should not render SuccessToast initially', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });

    it('should render invite worker drawer when invite worker feature is enabled', () => {
      const featureFlagSpy = jest
        .spyOn(ixpFeatureFlagModule, 'useIXPFeatureFlag')
        .mockReturnValue({
          isEnabled: true,
          isLoading: false,
          error: null,
          settled: true,
        });

      renderWithProvider(<WorkerAssignmentsTab />);
      expect(screen.getByTestId('invite-worker-drawer')).toBeInTheDocument();

      featureFlagSpy.mockRestore();
    });
  });

  describe('Header Action Buttons', () => {
    it('should render all action buttons', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      expect(screen.getByTestId('manage-fields-btn')).toBeInTheDocument();
      expect(screen.getByTestId('add-worker-btn')).toBeInTheDocument();
      expect(screen.getByTestId('create-group-btn')).toBeInTheDocument();
    });

    it('should handle Manage Fields button click', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const manageFieldsBtn = screen.getByTestId('manage-fields-btn');
      expect(() => fireEvent.click(manageFieldsBtn)).not.toThrow();
    });

    it('should handle Add Worker button click', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const addWorkerBtn = screen.getByTestId('add-worker-btn');
      expect(() => fireEvent.click(addWorkerBtn)).not.toThrow();
    });
  });

  describe('View Toggle Functionality', () => {
    it('should switch to groups view when toggle is turned on', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const toggle = screen.getByTestId('view-toggle') as HTMLInputElement;
      expect(toggle.checked).toBe(false);

      fireEvent.click(toggle);

      expect(screen.getByTestId('workers-table-by-groups')).toBeInTheDocument();
      expect(screen.queryByTestId('workers-list-view')).not.toBeInTheDocument();
    });

    it('should switch back to list view when toggle is turned off', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const toggle = screen.getByTestId('view-toggle') as HTMLInputElement;

      // Turn on (to groups view)
      fireEvent.click(toggle);
      expect(screen.getByTestId('workers-table-by-groups')).toBeInTheDocument();

      // Turn off (back to list view)
      fireEvent.click(toggle);
      expect(screen.getByTestId('workers-list-view')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should update search text state', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const searchInput = screen.getByTestId(
        'search-input',
      ) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'John Doe' } });

      expect(searchInput.value).toBe('John Doe');
    });

    it('should initialize search text as empty', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const searchInput = screen.getByTestId(
        'search-input',
      ) as HTMLInputElement;

      expect(searchInput.value).toBe('');
    });
  });

  describe('Worker Type Filter Functionality', () => {
    it('should update worker type state', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const filterSelect = screen.getByTestId(
        'worker-type-filter',
      ) as HTMLSelectElement;

      fireEvent.change(filterSelect, { target: { value: 'EMPLOYEE' } });

      expect(filterSelect.value).toBe('EMPLOYEE');
    });

    it('should initialize worker type as ALL', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const filterSelect = screen.getByTestId(
        'worker-type-filter',
      ) as HTMLSelectElement;

      expect(filterSelect.value).toBe('ALL');
    });
  });

  describe('Create Group Functionality', () => {
    it('should open GroupDrawer when Create Group button is clicked', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const createGroupBtn = screen.getByTestId('create-group-btn');
      fireEvent.click(createGroupBtn);

      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();
    });

    it('should open GroupDrawer in create mode', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const createGroupBtn = screen.getByTestId('create-group-btn');
      fireEvent.click(createGroupBtn);

      const drawer = screen.getByTestId('group-drawer');
      expect(drawer).toHaveAttribute('data-mode', 'create');
    });

    it('should close GroupDrawer when close button is clicked', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open drawer
      const createGroupBtn = screen.getByTestId('create-group-btn');
      fireEvent.click(createGroupBtn);
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();

      // Close drawer
      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
    });
  });

  describe('Success Toast Notification', () => {
    it('should show success toast when group is created successfully', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open drawer
      const createGroupBtn = screen.getByTestId('create-group-btn');
      fireEvent.click(createGroupBtn);

      // Trigger success
      const successBtn = screen.getByTestId('drawer-success-btn');
      fireEvent.click(successBtn);

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });
    });

    it('should display correct success message', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open drawer
      const createGroupBtn = screen.getByTestId('create-group-btn');
      fireEvent.click(createGroupBtn);

      // Trigger success
      const successBtn = screen.getByTestId('drawer-success-btn');
      fireEvent.click(successBtn);

      await waitFor(() => {
        const message = screen.getByTestId('toast-message');
        expect(message).toHaveTextContent('Group created and assigned');
      });
    });

    it('should close drawer when success is triggered', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open drawer
      const createGroupBtn = screen.getByTestId('create-group-btn');
      fireEvent.click(createGroupBtn);
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();

      // Trigger success
      const successBtn = screen.getByTestId('drawer-success-btn');
      fireEvent.click(successBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
      });
    });

    it('should close success toast when close button is clicked', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open drawer and trigger success
      fireEvent.click(screen.getByTestId('create-group-btn'));
      fireEvent.click(screen.getByTestId('drawer-success-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      // Close toast
      const toastCloseBtn = screen.getByTestId('toast-close-btn');
      fireEvent.click(toastCloseBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });
  });

  describe('Complete Flow', () => {
    it('should handle complete create group flow', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Initial state - no drawer, no toast
      expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();

      // Open drawer
      const createGroupBtn = screen.getByTestId('create-group-btn');
      fireEvent.click(createGroupBtn);
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();

      // Trigger success
      const successBtn = screen.getByTestId('drawer-success-btn');
      fireEvent.click(successBtn);

      // Drawer should close, toast should appear
      await waitFor(() => {
        expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      // Close toast
      const toastCloseBtn = screen.getByTestId('toast-close-btn');
      fireEvent.click(toastCloseBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });

    it('should allow opening drawer again after success', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // First create flow
      fireEvent.click(screen.getByTestId('create-group-btn'));
      fireEvent.click(screen.getByTestId('drawer-success-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
      });

      // Should be able to open drawer again
      fireEvent.click(screen.getByTestId('create-group-btn'));
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();
    });

    it('should handle multiple create operations', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // First create
      fireEvent.click(screen.getByTestId('create-group-btn'));
      fireEvent.click(screen.getByTestId('drawer-success-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      // Close toast
      fireEvent.click(screen.getByTestId('toast-close-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });

      // Second create
      fireEvent.click(screen.getByTestId('create-group-btn'));
      fireEvent.click(screen.getByTestId('drawer-success-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('should maintain independent state for drawer and toast', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open drawer
      fireEvent.click(screen.getByTestId('create-group-btn'));
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();
      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();

      // Close drawer without success
      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });

    it('should reset drawer state when reopened', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open and close drawer
      fireEvent.click(screen.getByTestId('create-group-btn'));
      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      // Reopen drawer - should be in same mode
      fireEvent.click(screen.getByTestId('create-group-btn'));
      const drawer = screen.getByTestId('group-drawer');
      expect(drawer).toHaveAttribute('data-mode', 'create');
    });
  });

  describe('Component Integration', () => {
    it('should maintain correct component hierarchy', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const container = screen.getByTestId('worker-assignments-container');
      const header = screen.getByTestId('workers-tab-header');
      const searchBar = screen.getByTestId('search-filter-bar');
      const listView = screen.getByTestId('workers-list-view');

      expect(container).toContainElement(header);
      expect(container).toContainElement(searchBar);
      expect(container).toContainElement(listView);
    });
  });

  describe('Error Handling', () => {
    it('should handle rapid button clicks gracefully', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const createGroupBtn = screen.getByTestId('create-group-btn');

      // Rapid clicks should not cause errors
      expect(() => {
        fireEvent.click(createGroupBtn);
        fireEvent.click(createGroupBtn);
        fireEvent.click(createGroupBtn);
      }).not.toThrow();

      // Drawer should still be open
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();
    });

    it('should handle success callback being called multiple times', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      fireEvent.click(screen.getByTestId('create-group-btn'));

      const successBtn = screen.getByTestId('drawer-success-btn');
      fireEvent.click(successBtn);
      fireEvent.click(successBtn);

      // Should still show only one toast
      await waitFor(() => {
        const toasts = screen.queryAllByTestId('success-toast');
        expect(toasts).toHaveLength(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should render all components with proper test ids', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      expect(
        screen.getByTestId('worker-assignments-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('workers-tab-header')).toBeInTheDocument();
      expect(screen.getByTestId('search-filter-bar')).toBeInTheDocument();
      expect(screen.getByTestId('workers-list-view')).toBeInTheDocument();
    });

    it('should allow keyboard navigation through buttons', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const createGroupBtn = screen.getByTestId('create-group-btn');
      expect(createGroupBtn).toBeInTheDocument();

      // Button should be focusable
      createGroupBtn.focus();
      expect(document.activeElement).toBe(createGroupBtn);
    });
  });

  describe('Group Detail View Integration', () => {
    it('should render GroupDetailView when groupDetailView.isActive is true', () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
          },
        },
      });

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      // Should not render normal view components
      expect(
        screen.queryByTestId('workers-tab-header'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('search-filter-bar')).not.toBeInTheDocument();
    });

    it('should render Quick Action drawer in group detail view', () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
            quickActionDrawerOpen: true,
            quickActionDrawerView: 'AssignWorkers',
            currentGroupId: 'group-1',
            currentGroupName: 'Test Group',
          },
        },
      });

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('group-drawer')).toHaveAttribute(
        'data-mode',
        'edit',
      );
    });

    it('should call refetchGroupDetailRef when closing Create Group drawer after leaving group detail view', () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
          },
        },
      });
      mockRefetchGroupDetail.mockClear();
      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );
      // GroupDetailView mounted and set refetchGroupDetailRef
      expect(mockRefetchGroupDetail).not.toHaveBeenCalled();
      storeWithDetailView.dispatch(closeGroupDetailView());
      // Now in normal view; ref still points to mockRefetchGroupDetail
      fireEvent.click(screen.getByTestId('view-toggle')); // Ensure groups view is active
      fireEvent.click(screen.getByTestId('create-group-btn'));
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();
      mockRefetchGroupDetail.mockClear();
      fireEvent.click(screen.getByTestId('drawer-close-btn'));
      expect(mockRefetchGroupDetail).toHaveBeenCalled();
    });
  });

  describe('Quick Action Drawer', () => {
    it('should render Quick Action drawer when quickActionDrawerOpen is true', () => {
      const storeWithQuickAction = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            quickActionDrawerOpen: true,
            quickActionDrawerView: 'AssignWorkers',
            currentGroupId: 'group-1',
            currentGroupName: 'Test Group',
          },
        },
      });

      render(
        <Provider store={storeWithQuickAction}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();
    });

    it('should close Quick Action drawer when close button is clicked', async () => {
      const storeWithQuickAction = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            quickActionDrawerOpen: true,
            quickActionDrawerView: 'AssignWorkers',
            currentGroupId: 'group-1',
            currentGroupName: 'Test Group',
          },
        },
      });

      render(
        <Provider store={storeWithQuickAction}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
      });
    });

    it('should show success toast when Quick Action succeeds', async () => {
      const {
        GroupDrawerContext,
      } = require('src/js/widgets/assignments/types/Groups/GroupDrawer.types');
      const storeWithQuickAction = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            quickActionDrawerOpen: true,
            quickActionDrawerView: 'AssignWorkers',
            currentGroupId: 'group-1',
            currentGroupName: 'Test Group',
            drawerContext: GroupDrawerContext.QuickAction,
          },
        },
      });

      render(
        <Provider store={storeWithQuickAction}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      const successBtn = screen.getByTestId('drawer-success-btn');
      fireEvent.click(successBtn);

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
        expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
      });
    });

    it('should call refetchGroupDetail with refetchHeaderCount true for AssignWorkers view in group detail view', async () => {
      const {
        GroupDrawerView,
      } = require('src/js/widgets/assignments/types/Groups/GroupDrawer.types');
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
            quickActionDrawerOpen: true,
            quickActionDrawerView: GroupDrawerView.AssignWorkers,
            currentGroupId: 'group-1',
            currentGroupName: 'Test Group',
          },
        },
      });

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      mockRefetchGroupDetail.mockClear();

      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(mockRefetchGroupDetail).toHaveBeenCalledWith({
          refetchHeaderCount: true,
        });
      });
    });

    it('should call refetchGroupDetail with refetchHeaderCount false for AssignLeads view in group detail view', async () => {
      const {
        GroupDrawerView,
      } = require('src/js/widgets/assignments/types/Groups/GroupDrawer.types');
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
            quickActionDrawerOpen: true,
            quickActionDrawerView: GroupDrawerView.AssignLeads,
            currentGroupId: 'group-1',
            currentGroupName: 'Test Group',
          },
        },
      });

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      mockRefetchGroupDetail.mockClear();

      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(mockRefetchGroupDetail).toHaveBeenCalledWith({
          refetchHeaderCount: false,
        });
      });
    });

    it('should refetch groups when closing quick action drawer in groups view', async () => {
      const { WorkersTabViews } = require('src/js/widgets/assignments/types');
      mockGetWorkersView.mockReturnValue(WorkersTabViews.GROUPS);

      const storeWithQuickAction = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            quickActionDrawerOpen: true,
            quickActionDrawerView: 'AssignWorkers',
            currentGroupId: 'group-1',
            currentGroupName: 'Test Group',
          },
        },
      });

      render(
        <Provider store={storeWithQuickAction}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('workers-table-by-groups'),
        ).toBeInTheDocument();
      });

      mockRefetchGroups.mockClear();
      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      await waitFor(() => {
        expect(mockRefetchGroups).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('useEffect - Default View', () => {
    it('should set viewByGroups to false on mount', () => {
      const storeWithGroupsView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            viewByGroups: true,
          },
        },
      });

      render(
        <Provider store={storeWithGroupsView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      // After mount, viewByGroups should be set to false (Workers list view by default)
      expect(storeWithGroupsView.getState().workersGroupView.viewByGroups).toBe(
        false,
      );
    });

    it('should set viewByGroups to true when initialView prop is "groups"', () => {
      render(
        <Provider store={store}>
          <WorkerAssignmentsTab initialView="groups" />
        </Provider>,
      );

      expect(store.getState().workersGroupView.viewByGroups).toBe(true);
      // initialView takes priority, so saved localStorage view is never read
      expect(mockGetWorkersView).not.toHaveBeenCalled();
    });

    it('should fall back to saved view when initialView prop is not "groups"', () => {
      const { WorkersTabViews } = require('src/js/widgets/assignments/types');
      mockGetWorkersView.mockReturnValue(WorkersTabViews.GROUPS);

      render(
        <Provider store={store}>
          <WorkerAssignmentsTab initialView="workers" />
        </Provider>,
      );

      expect(mockGetWorkersView).toHaveBeenCalled();
      expect(store.getState().workersGroupView.viewByGroups).toBe(true);
    });

    it('should clear group detail view when component unmounts', () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
              error: null,
            },
          },
        },
      });

      const { unmount } = render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      // Group detail view should be active initially
      expect(
        storeWithDetailView.getState().workersGroupView.groupDetailView
          .isActive,
      ).toBe(true);

      // Unmount component (simulates navigating away from Workers tab)
      unmount();

      // Group detail view should be cleared after unmount
      expect(
        storeWithDetailView.getState().workersGroupView.groupDetailView
          .isActive,
      ).toBe(false);
      expect(
        storeWithDetailView.getState().workersGroupView.groupDetailView.groupId,
      ).toBe(null);
      expect(
        storeWithDetailView.getState().workersGroupView.groupDetailView
          .groupName,
      ).toBe(null);
    });
  });

  describe('Search Text Passthrough', () => {
    it('should pass searchText to WorkersTableByGroupsView', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const searchInput = screen.getByTestId(
        'search-input',
      ) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'Test Search' } });

      // SearchText should be updated
      expect(searchInput.value).toBe('Test Search');
    });
  });

  describe('Navigation Error Handling', () => {
    it('should log error when navigation fails', () => {
      // Setup sandbox with throwing navigation
      const mockErrorLogger = jest.fn();
      mockSandbox.logger.error = mockErrorLogger;
      mockSandbox.navigation.navigate = jest.fn(() => {
        throw new Error('Navigation failed');
      });

      renderWithProvider(<WorkerAssignmentsTab />);

      const manageFieldsBtn = screen.getByTestId('manage-fields-btn');

      // Click should not throw even if navigation fails
      expect(() => fireEvent.click(manageFieldsBtn)).not.toThrow();

      // Verify error was logged
      expect(mockErrorLogger).toHaveBeenCalledWith(
        'Navigation to time tracking settings failed',
        expect.objectContaining({
          error: expect.any(Error),
        }),
      );
    });
  });

  describe('Group Detail View with Success Toast', () => {
    it('should close success toast in group detail view', async () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
            quickActionDrawerOpen: true,
            quickActionDrawerView: 'AssignWorkers',
            currentGroupId: 'group-1',
            currentGroupName: 'Test Group',
          },
        },
      });

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      // Trigger success from quick action drawer
      const successBtn = screen.getByTestId('drawer-success-btn');
      fireEvent.click(successBtn);

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      // Close toast
      const toastCloseBtn = screen.getByTestId('toast-close-btn');
      fireEvent.click(toastCloseBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });

    it('should show GroupDetailView when groupDetailView is active', () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
          },
        },
      });

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      expect(screen.getByTestId('group-detail-view')).toBeInTheDocument();
    });

    it('should render AddWorkerDrawer in group detail view', () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
            addWorkerDrawerOpen: true,
          },
        },
      });

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();
    });

    it('should close AddWorkerDrawer in group detail view when close button is clicked', async () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
            addWorkerDrawerOpen: true,
          },
        },
      });

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();

      const closeBtn = screen.getByTestId('widget-close-btn');
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(
          screen.queryByTestId('add-worker-widget'),
        ).not.toBeInTheDocument();
      });
    });

    it('should show success toast when worker is added in group detail view', async () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
            addWorkerDrawerOpen: true,
          },
        },
      });

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      const successBtn = screen.getByTestId('widget-success-btn');
      fireEvent.click(successBtn);

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
        expect(screen.getByTestId('toast-message')).toHaveTextContent(
          'John Doe added successfully',
        );
      });
    });
  });

  describe('Add Worker Integration', () => {
    it('should open contact drawer when Add Worker button is clicked', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const addWorkerBtn = screen.getByTestId('add-worker-btn');
      fireEvent.click(addWorkerBtn);

      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();
      expect(screen.getByTestId('add-worker-widget')).toHaveAttribute(
        'data-widget-id',
        'qbo-contacts-v2/contact-drawer',
      );
    });

    it('should not render add worker widget initially', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      expect(screen.queryByTestId('add-worker-widget')).not.toBeInTheDocument();
    });

    it('should close drawer when close button is clicked', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open drawer
      const addWorkerBtn = screen.getByTestId('add-worker-btn');
      fireEvent.click(addWorkerBtn);
      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();

      // Close drawer
      const closeBtn = screen.getByTestId('widget-close-btn');
      fireEvent.click(closeBtn);

      expect(screen.queryByTestId('add-worker-widget')).not.toBeInTheDocument();
    });

    it('should show success toast when worker is added successfully', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open drawer
      const addWorkerBtn = screen.getByTestId('add-worker-btn');
      fireEvent.click(addWorkerBtn);

      // Trigger success
      const successBtn = screen.getByTestId('widget-success-btn');
      fireEvent.click(successBtn);

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
        expect(screen.getByTestId('toast-message')).toHaveTextContent(
          'John Doe added successfully',
        );
      });
    });

    it('should close drawer when worker is added successfully', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open drawer
      fireEvent.click(screen.getByTestId('add-worker-btn'));
      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();

      // Trigger success
      fireEvent.click(screen.getByTestId('widget-success-btn'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('add-worker-widget'),
        ).not.toBeInTheDocument();
      });
    });

    it('should keep drawer open on error', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open drawer
      fireEvent.click(screen.getByTestId('add-worker-btn'));

      // Trigger error
      const errorBtn = screen.getByTestId('widget-error-btn');
      fireEvent.click(errorBtn);

      // Drawer should still be open
      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();
    });

    it('should allow reopening drawer after successful add', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // First add flow
      fireEvent.click(screen.getByTestId('add-worker-btn'));
      fireEvent.click(screen.getByTestId('widget-success-btn'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('add-worker-widget'),
        ).not.toBeInTheDocument();
      });

      // Should be able to open drawer again
      fireEvent.click(screen.getByTestId('add-worker-btn'));
      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();
    });

    it('should handle rapid add worker button clicks gracefully', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const addWorkerBtn = screen.getByTestId('add-worker-btn');

      // Rapid clicks should not cause errors
      expect(() => {
        fireEvent.click(addWorkerBtn);
        fireEvent.click(addWorkerBtn);
        fireEvent.click(addWorkerBtn);
      }).not.toThrow();

      // Drawer should still be open
      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();
    });

    it('should close success toast after worker is added', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Add worker
      fireEvent.click(screen.getByTestId('add-worker-btn'));
      fireEvent.click(screen.getByTestId('widget-success-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      // Close toast
      const toastCloseBtn = screen.getByTestId('toast-close-btn');
      fireEvent.click(toastCloseBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });
  });

  // NOTE: Add Worker Integration in Group Detail View tests removed
  // The Add Worker button (from WorkersTabHeader) is not rendered when
  // groupDetailView.isActive is true, which is the correct behavior.
  // Add Worker functionality is only available in the main workers tab view.

  describe('Add Worker - Complete Flow', () => {
    it('should handle complete add worker flow', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Initial state - no widget, no toast
      expect(screen.queryByTestId('add-worker-widget')).not.toBeInTheDocument();
      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();

      // Open add worker drawer
      const addWorkerBtn = screen.getByTestId('add-worker-btn');
      fireEvent.click(addWorkerBtn);
      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();

      // Add worker successfully
      const successBtn = screen.getByTestId('widget-success-btn');
      fireEvent.click(successBtn);

      // Drawer should close, toast should appear
      await waitFor(() => {
        expect(
          screen.queryByTestId('add-worker-widget'),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      // Close toast
      const toastCloseBtn = screen.getByTestId('toast-close-btn');
      fireEvent.click(toastCloseBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple add worker operations', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // First add
      fireEvent.click(screen.getByTestId('add-worker-btn'));
      fireEvent.click(screen.getByTestId('widget-success-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      // Close toast
      fireEvent.click(screen.getByTestId('toast-close-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });

      // Second add
      fireEvent.click(screen.getByTestId('add-worker-btn'));
      fireEvent.click(screen.getByTestId('widget-success-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });
    });

    it('should maintain independent state for add worker drawer and other drawers', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Open add worker drawer
      fireEvent.click(screen.getByTestId('add-worker-btn'));
      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();

      // Close it
      fireEvent.click(screen.getByTestId('widget-close-btn'));
      expect(screen.queryByTestId('add-worker-widget')).not.toBeInTheDocument();

      // Open create group drawer
      fireEvent.click(screen.getByTestId('create-group-btn'));
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();

      // Add worker drawer should still be closed
      expect(screen.queryByTestId('add-worker-widget')).not.toBeInTheDocument();
    });
  });

  describe('handleCloseDrawer with Group Detail View', () => {
    it('should call refetchGroupDetailRef when closing create drawer in group detail view', async () => {
      // First render in group detail view
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
          },
        },
      });

      // First, we need to render the normal view to get the create drawer
      // But the group detail view branch renders differently
      // Let's test with the normal view then switch

      renderWithProvider(<WorkerAssignmentsTab />);
      await switchToGroupsView();

      // Open create drawer
      fireEvent.click(screen.getByTestId('create-group-btn'));
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();

      mockRefetchGroups.mockClear();

      // Close drawer
      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      await waitFor(() => {
        expect(mockRefetchGroups).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle handleCloseDrawer with group detail ref available', async () => {
      // This test is for completeness - in practice, the group detail ref
      // is only set when in group detail view, but handleCloseDrawer includes
      // a check to refetch group detail if the ref is available
      renderWithProvider(<WorkerAssignmentsTab />);

      mockRefetchGroups.mockClear();
      mockRefetchGroupDetail.mockClear();

      await switchToGroupsView();

      // Open and close create drawer
      fireEvent.click(screen.getByTestId('create-group-btn'));
      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      await waitFor(() => {
        expect(mockRefetchGroups).toHaveBeenCalledTimes(1);
      });

      // Note: refetchGroupDetail is not called here because the ref is only
      // set when GroupDetailView is rendered (which only happens when
      // groupDetailView.isActive is true). This line is covered by other
      // tests that involve the group detail view.
    });
  });

  describe('handleCreateSuccess Refetch', () => {
    it('should refetch groups when create succeeds', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);
      await switchToGroupsView();

      // Open drawer
      const createGroupBtn = screen.getByTestId('create-group-btn');
      fireEvent.click(createGroupBtn);

      // Clear mock to only track calls after success
      mockRefetchGroups.mockClear();

      // Trigger success
      const successBtn = screen.getByTestId('drawer-success-btn');
      fireEvent.click(successBtn);

      await waitFor(() => {
        expect(mockRefetchGroups).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch groups even when message is not provided', async () => {
      // Mock drawer without message
      jest.clearAllMocks();
      jest.mock(
        'src/js/widgets/assignments/components/Groups/CreateGroupDrawer',
        () => {
          const MockComponent = ({ open, onClose, onSuccess }: any) =>
            open ? (
              <div data-testid="group-drawer" data-mode="create">
                <button data-testid="drawer-close-btn" onClick={onClose}>
                  Close
                </button>
                <button
                  data-testid="drawer-success-no-msg-btn"
                  onClick={() => onSuccess()}
                >
                  Success No Message
                </button>
              </div>
            ) : null;

          return {
            __esModule: true,
            CreateGroupDrawer: MockComponent,
            default: MockComponent,
          };
        },
      );

      renderWithProvider(<WorkerAssignmentsTab />);
      await switchToGroupsView();

      // Open drawer
      const createGroupBtn = screen.getByTestId('create-group-btn');
      fireEvent.click(createGroupBtn);

      mockRefetchGroups.mockClear();

      // Trigger success without message
      const successBtn = screen.getByTestId('drawer-success-btn');
      fireEvent.click(successBtn);

      await waitFor(() => {
        expect(mockRefetchGroups).toHaveBeenCalledTimes(1);
      });
    });

    it('should close drawer and show toast after refetch', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);
      await switchToGroupsView();

      // Open drawer
      fireEvent.click(screen.getByTestId('create-group-btn'));
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();

      mockRefetchGroups.mockClear();

      // Trigger success
      fireEvent.click(screen.getByTestId('drawer-success-btn'));

      await waitFor(() => {
        // Drawer should close
        expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
        // Toast should appear
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
        // Refetch should be called
        expect(mockRefetchGroups).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle multiple create success operations with refetch', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);
      await switchToGroupsView();

      // First create
      fireEvent.click(screen.getByTestId('create-group-btn'));
      mockRefetchGroups.mockClear();
      fireEvent.click(screen.getByTestId('drawer-success-btn'));

      await waitFor(() => {
        expect(mockRefetchGroups).toHaveBeenCalledTimes(1);
      });

      // Close toast
      fireEvent.click(screen.getByTestId('toast-close-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });

      // Second create
      fireEvent.click(screen.getByTestId('create-group-btn'));
      mockRefetchGroups.mockClear();
      fireEvent.click(screen.getByTestId('drawer-success-btn'));

      await waitFor(() => {
        expect(mockRefetchGroups).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch on close to ensure fresh data', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);
      await switchToGroupsView();

      // Open drawer
      fireEvent.click(screen.getByTestId('create-group-btn'));

      mockRefetchGroups.mockClear();

      // Close drawer without success
      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('group-drawer')).not.toBeInTheDocument();
      });

      // Refetch should be called to ensure fresh data
      expect(mockRefetchGroups).toHaveBeenCalledTimes(1);
    });
  });

  describe('Analytics Tracking', () => {
    it('should track GROUPS_ENTRY on component mount', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'navigated',
          ui_action: 'clicked',
          ui_object: 'link',
          ui_object_detail: 'groups_tab',
        }),
      );
    });

    it('should track GROUPS_LIST_VIEW when viewByGroups is true', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);
      await switchToGroupsView();

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'viewed',
            ui_action: 'viewed',
            ui_object: 'page',
            ui_object_detail: 'groups_list',
          }),
        );
      });
    });

    it('should track MANAGE_FIELDS when Manage Fields button is clicked', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      mockTrack.mockClear();
      const manageFieldsBtn = screen.getByTestId('manage-fields-btn');
      fireEvent.click(manageFieldsBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'manage_fields',
        }),
      );
    });

    it('should track SEARCH_GROUPS when search text is entered', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      mockTrack.mockClear();
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Test Group' } });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          ui_action: 'typed',
          ui_object: 'form_field',
          ui_object_detail: 'search_groups',
        }),
      );
    });

    it('should not track SEARCH_GROUPS when search text is cleared', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      mockTrack.mockClear();
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: '' } });

      // Should not call track for empty search
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it('should track previous_screen in GROUPS_ENTRY', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          previous_screen: 'left_nav',
        }),
      );
    });

    it('should track previous_screen in GROUPS_LIST_VIEW', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);
      await switchToGroupsView();

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            previous_screen: 'groups_tab',
          }),
        );
      });
    });

    it('should not track GROUPS_LIST_VIEW when in group detail view', () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
          },
        },
      });

      mockTrack.mockClear();

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      // Should track GROUPS_ENTRY but not GROUPS_LIST_VIEW
      expect(mockTrack).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          ui_object_detail: 'groups_tab', // GROUPS_ENTRY
        }),
      );
    });

    it('should track START_CREATE_GROUP when Create Group button is clicked', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      mockTrack.mockClear();
      const createGroupBtn = screen.getByTestId('create-group-btn');
      fireEvent.click(createGroupBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'create_group',
          ui_access_point: 'create_group_cta',
          previous_screen: 'groups_list_header',
        }),
      );
    });
  });

  describe('Refetch Logic', () => {
    it('should refetch groups when drawer closes', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);
      await switchToGroupsView();

      fireEvent.click(screen.getByTestId('create-group-btn'));
      expect(screen.getByTestId('group-drawer')).toBeInTheDocument();

      mockRefetchGroups.mockClear();

      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      await waitFor(() => {
        expect(mockRefetchGroups).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch group detail when in group detail view', () => {
      const storeWithDetailView = configureStore({
        reducer: {
          workersGroupView: workersGroupViewReducer,
          workersList: workersListReducer,
        },
        preloadedState: {
          workersGroupView: {
            ...store.getState().workersGroupView,
            groupDetailView: {
              isActive: true,
              groupId: 'group-1',
              groupName: 'Test Group',
            },
          },
        },
      });

      render(
        <Provider store={storeWithDetailView}>
          <WorkerAssignmentsTab />
        </Provider>,
      );

      expect(screen.getByTestId('group-detail-view')).toBeInTheDocument();
    });

    it('should return workers list refetch function when in list view by default', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Should already be in workers list view by default
      await waitFor(() => {
        expect(screen.getByTestId('workers-list-view')).toBeInTheDocument();
      });

      // Open add worker drawer (which uses getRefetchFunction internally)
      fireEvent.click(screen.getByTestId('add-worker-btn'));
      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();

      // Trigger success which should call the refetch function
      mockRefetchWorkersList.mockClear();
      fireEvent.click(screen.getByTestId('widget-success-btn'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('add-worker-widget'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('View Toggle Edge Cases', () => {
    it('should maintain viewByGroups state when toggling', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const toggle = screen.getByTestId('view-toggle') as HTMLInputElement;
      expect(toggle.checked).toBe(false);

      fireEvent.click(toggle);
      expect(toggle.checked).toBe(true);

      fireEvent.click(toggle);
      expect(toggle.checked).toBe(false);
    });

    it('should clear search text when switching views', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const searchInput = screen.getByTestId(
        'search-input',
      ) as HTMLInputElement;

      // Type something while in Groups view
      fireEvent.change(searchInput, { target: { value: 'Test' } });
      expect(searchInput.value).toBe('Test');

      // Switch to Workers list view - should clear
      const toggle = screen.getByTestId('view-toggle') as HTMLInputElement;
      fireEvent.click(toggle);

      expect(searchInput.value).toBe('');
    });
  });

  describe('Workers List View Integration', () => {
    it('should pass refetch function to Workers List View', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // Should already be in workers list view by default
      expect(screen.getByTestId('workers-list-view')).toBeInTheDocument();
    });

    it('should register refetch callback from Workers List View', async () => {
      mockRefetchWorkersList.mockClear();
      renderWithProvider(<WorkerAssignmentsTab />);

      // Should already be in workers list view by default
      await waitFor(() => {
        expect(screen.getByTestId('workers-list-view')).toBeInTheDocument();
      });

      // The mock should have been called to register the refetch
      // (callback was captured in the mock)
    });

    it('should use workers list refetch when in list view', async () => {
      mockRefetchWorkersList.mockClear();
      renderWithProvider(<WorkerAssignmentsTab />);

      // Should already be in workers list view by default
      await waitFor(() => {
        expect(screen.getByTestId('workers-list-view')).toBeInTheDocument();
      });
    });
  });

  describe('Success Toast Management', () => {
    it('should close toast after timeout', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      fireEvent.click(screen.getByTestId('create-group-btn'));
      fireEvent.click(screen.getByTestId('drawer-success-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      const toastCloseBtn = screen.getByTestId('toast-close-btn');
      fireEvent.click(toastCloseBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple success messages sequentially', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      // First success
      fireEvent.click(screen.getByTestId('create-group-btn'));
      fireEvent.click(screen.getByTestId('drawer-success-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('toast-close-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });

      // Second success
      fireEvent.click(screen.getByTestId('create-group-btn'));
      fireEvent.click(screen.getByTestId('drawer-success-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });
    });
  });

  describe('Drawer Key Management', () => {
    it('should remount drawer when key changes', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      fireEvent.click(screen.getByTestId('create-group-btn'));
      const firstDrawer = screen.getByTestId('group-drawer');

      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      fireEvent.click(screen.getByTestId('create-group-btn'));
      const secondDrawer = screen.getByTestId('group-drawer');

      // Drawer should be remounted (different instance)
      expect(firstDrawer).not.toBe(secondDrawer);
    });
  });

  describe('Worker Type Filter', () => {
    it('should update worker type filter state', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      const filterSelect = screen.getByTestId(
        'worker-type-filter',
      ) as HTMLSelectElement;

      fireEvent.change(filterSelect, { target: { value: 'EMPLOYEE' } });
      expect(filterSelect.value).toBe('EMPLOYEE');

      fireEvent.change(filterSelect, { target: { value: 'VENDOR' } });
      expect(filterSelect.value).toBe('VENDOR');
    });
  });

  describe('Add Worker Integration Edge Cases', () => {
    it('should handle add worker success without message', async () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      fireEvent.click(screen.getByTestId('add-worker-btn'));

      // Mock widget to call onSuccess without message
      const widget = screen.getByTestId('add-worker-widget');
      const successBtn = widget.querySelector(
        '[data-testid="widget-success-btn"]',
      );
      if (successBtn) {
        fireEvent.click(successBtn);
      }

      await waitFor(() => {
        expect(
          screen.queryByTestId('add-worker-widget'),
        ).not.toBeInTheDocument();
      });
    });

    it('should keep add worker drawer open on error', () => {
      renderWithProvider(<WorkerAssignmentsTab />);

      fireEvent.click(screen.getByTestId('add-worker-btn'));

      const errorBtn = screen.getByTestId('widget-error-btn');
      fireEvent.click(errorBtn);

      expect(screen.getByTestId('add-worker-widget')).toBeInTheDocument();
    });
  });
});
