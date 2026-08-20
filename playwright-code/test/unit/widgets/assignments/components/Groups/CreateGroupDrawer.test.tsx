import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MockedProvider } from '@apollo/client/testing';
import CreateGroupDrawer from 'src/js/widgets/assignments/components/Groups/CreateGroupDrawer';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import {
  GroupDrawerView,
  ErrorSource,
} from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';

// Mock hooks
jest.mock('src/js/service/hooks/groups/useGroupWithAssignments');

// Mock useNttfEligibility - default to showing group leads
const mockUseNttfEligibility = jest.fn(() => ({
  isNttfEligible: false,
  shouldShowGroupLeads: true,
  loading: false,
}));
jest.mock('src/js/service/hooks/nttf/useNttfEligibility', () => ({
  useNttfEligibility: () => mockUseNttfEligibility(),
}));

// Mock CenteredContainer from WorkersTableByGroupsView.styled
jest.mock(
  'src/js/widgets/assignments/components/styles/WorkersTableByGroupsView.styled',
  () => ({
    CenteredContainer: ({ children }: any) => (
      <div data-testid="centered-container">{children}</div>
    ),
  }),
);

// Mock tracking function
const mockTrack = jest.fn();

// Create stable sandbox mock to prevent useEffect infinite loops
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const mockSandbox = {
  logger: mockLogger,
};

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: jest.fn(({ id }) => id),
  }),
  useSandbox: () => mockSandbox,
  useTracking: () => mockTrack,
}));

// Mock styled components
jest.mock(
  'src/js/widgets/assignments/styles/Groups/GroupDrawer.styled',
  () => ({
    StyledDrawerHeader: ({ children }: any) => (
      <div data-testid="drawer-header">{children}</div>
    ),
    StyledDrawerFooter: ({ children }: any) => (
      <div data-testid="drawer-footer">{children}</div>
    ),
    StyledDrawerContent: ({ children }: any) => (
      <div data-testid="drawer-content">{children}</div>
    ),
    FooterButtonsContainer: ({ children }: any) => (
      <div data-testid="footer-buttons">{children}</div>
    ),
    ModalMessage: ({ children }: any) => (
      <div data-testid="modal-message">{children}</div>
    ),
  }),
);

// Mock IDS components
jest.mock('@ids-ts/drawer', () => ({
  Drawer: ({ children, open }: any) =>
    open ? <div data-testid="drawer">{children}</div> : null,
  IDSDrawerHeader: ({ children }: any) => <div>{children}</div>,
  IDSDrawerBody: ({ children }: any) => <div>{children}</div>,
  IDSDrawerFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: (props: any) => {
    const { children, onClick, disabled, 'data-testid': dataTestId } = props;
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        data-testid={dataTestId || 'button'}
      >
        {children}
      </button>
    );
  },
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <div data-testid="loader">Loading...</div>,
}));

jest.mock('src/js/widgets/common/ConfirmationModal', () => ({
  ConfirmationModal: ({
    open,
    setOpen,
    title,
    children,
    onYesClick,
    onNoClick,
    yesButtonLabel,
    noButtonLabel,
    isLoading,
  }: any) =>
    open ? (
      <div data-testid="confirmation-modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
        <button
          data-testid="modal-yes-btn"
          onClick={onYesClick}
          disabled={isLoading}
        >
          {yesButtonLabel}
        </button>
        <button
          data-testid="modal-no-btn"
          onClick={onNoClick}
          disabled={isLoading}
        >
          {noButtonLabel}
        </button>
        <button data-testid="modal-close-btn" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    ) : null,
}));

// Mock child components
jest.mock(
  'src/js/widgets/assignments/components/Groups/GroupDetailsContent',
  () => {
    const React = require('react');
    const { useSelector } = require('react-redux');
    const {
      selectDrawerErrorTitle,
      selectDrawerErrorMessage,
    } = require('src/js/widgets/assignments/store/workersGroupViewSlice');
    return {
      GroupDetailsContent: ({
        groupName,
        onGroupNameChange,
        onKeyDown,
        onAssignWorkers,
        onAssignLeads,
        onClearError,
      }: any) => {
        const errorTitle = useSelector(selectDrawerErrorTitle);
        const errorMessage = useSelector(selectDrawerErrorMessage);
        return (
          <div data-testid="group-details">
            <input
              data-testid="group-name-input"
              value={groupName}
              onChange={(e) => onGroupNameChange(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button data-testid="assign-workers-btn" onClick={onAssignWorkers}>
              Assign Workers
            </button>
            <button data-testid="assign-leads-btn" onClick={onAssignLeads}>
              Assign Leads
            </button>
            {errorMessage && (
              <div data-testid="group-drawer-error-message">
                {errorTitle && <span>{errorTitle}: </span>}
                {errorMessage}
                <button data-testid="clear-error-btn" onClick={onClearError}>
                  Clear
                </button>
              </div>
            )}
          </div>
        );
      },
    };
  },
);

jest.mock(
  'src/js/widgets/assignments/components/Groups/WorkerAssignmentController',
  () => ({
    WorkerAssignmentController: () => (
      <div data-testid="worker-assignment">Worker Assignment</div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/assignments/components/Groups/ManagerAssignmentController',
  () => ({
    ManagerAssignmentController: () => (
      <div data-testid="manager-assignment">Manager Assignment</div>
    ),
  }),
);

describe('CreateGroupDrawer', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockCreateGroupWithAssignments = jest.fn();

  const {
    useGroupWithAssignments,
  } = require('src/js/service/hooks/groups/useGroupWithAssignments');

  const createStore = (preloadedState = {}) =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
      },
      preloadedState: {
        workersGroupView: {
          selectedMembers: {},
          selectedLeads: {},
          drawerWorkers: { byId: {}, allIds: [], totalFetched: 0 },
          currentMemberWorkers: [],
          currentLeadWorkers: [],
          hasLoadedInitialManagers: false,
          drawerError: {
            errorTitle: null,
            errorMessage: null,
          },
          unsavedChangesModal: {
            open: false,
          },
          ...preloadedState,
        } as any,
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
    mockSandbox.logger.info.mockClear();
    mockSandbox.logger.error.mockClear();
    mockSandbox.logger.warn.mockClear();

    useGroupWithAssignments.mockReturnValue({
      createGroupWithAssignments: mockCreateGroupWithAssignments,
      loading: false,
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    const store = createStore();
    return render(
      <Provider store={store}>
        <MockedProvider mocks={[]} addTypename={false}>
          {ui}
        </MockedProvider>
      </Provider>,
    );
  };

  describe('Basic Rendering', () => {
    it('should not render when closed', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    it('should render Details view by default', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByTestId('group-details')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should render when createGroup is loading', () => {
      useGroupWithAssignments.mockReturnValue({
        createGroupWithAssignments: mockCreateGroupWithAssignments,
        loading: true,
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByTestId('drawer')).toBeInTheDocument();
      const submitBtn = screen.getByTestId('create-group-drawer-submit-btn');
      expect(submitBtn).toBeDisabled();
    });

    it('should show centered loading when NTTF eligibility is loading', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        shouldShowGroupLeads: true,
        loading: true, // NTTF loading
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Should show the loading container
      expect(screen.getByTestId('centered-container')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();

      // Content should not be visible during NTTF loading
      expect(screen.queryByTestId('group-name-input')).not.toBeInTheDocument();
    });

    it('should show content when NTTF eligibility loading completes', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        shouldShowGroupLeads: true,
        loading: false, // NTTF not loading
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Should not show loading
      expect(
        screen.queryByTestId('centered-container'),
      ).not.toBeInTheDocument();

      // Content should be visible
      expect(screen.getByTestId('group-name-input')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render with open prop changes', () => {
      const { rerender } = renderWithProviders(
        <CreateGroupDrawer
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();

      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    it('should handle open prop changes', () => {
      const { rerender } = renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByTestId('drawer')).toBeInTheDocument();

      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open={false}
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined callbacks', () => {
      expect(() => {
        renderWithProviders(
          <CreateGroupDrawer open onClose={jest.fn()} onSuccess={jest.fn()} />,
        );
      }).not.toThrow();
    });

    it('should handle multiple open/close cycles', () => {
      const { rerender } = renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );
      expect(screen.getByTestId('drawer')).toBeInTheDocument();

      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open={false}
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );
      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();

      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle group name input changes', async () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const input = screen.getByTestId('group-name-input');
      const user = userEvent.setup();

      await user.type(input, 'Test Group');
      expect(input).toHaveValue('Test Group');
    });

    it('should navigate to AssignWorkers view', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const assignWorkersBtn = screen.getByTestId('assign-workers-btn');
      fireEvent.click(assignWorkersBtn);

      expect(screen.getByTestId('worker-assignment')).toBeInTheDocument();
      expect(screen.queryByTestId('group-details')).not.toBeInTheDocument();
    });

    it('should navigate to AssignLeads view', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      fireEvent.click(assignLeadsBtn);

      expect(screen.getByTestId('manager-assignment')).toBeInTheDocument();
      expect(screen.queryByTestId('group-details')).not.toBeInTheDocument();
    });

    it('should handle cancel button click', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const cancelBtn = screen.getByTestId('create-group-drawer-cancel-btn');
      fireEvent.click(cancelBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle Enter key press to create group', async () => {
      mockCreateGroupWithAssignments.mockResolvedValue({});

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const input = screen.getByTestId('group-name-input');
      const user = userEvent.setup();

      await user.type(input, 'New Group');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockCreateGroupWithAssignments).toHaveBeenCalled();
      });
    });

    it('should not handle Enter key when loading', async () => {
      useGroupWithAssignments.mockReturnValue({
        createGroupWithAssignments: mockCreateGroupWithAssignments,
        loading: true,
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const input = screen.getByTestId('group-name-input');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockCreateGroupWithAssignments).not.toHaveBeenCalled();
    });
  });

  describe('View Navigation', () => {
    it('should render save button in AssignWorkers view', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const assignWorkersBtn = screen.getByTestId('assign-workers-btn');
      fireEvent.click(assignWorkersBtn);

      expect(screen.getByTestId('save-workers-btn')).toBeInTheDocument();
    });

    it('should return to Details view when saving workers', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate to workers view
      fireEvent.click(screen.getByTestId('assign-workers-btn'));
      expect(screen.getByTestId('worker-assignment')).toBeInTheDocument();

      // Save and return
      fireEvent.click(screen.getByTestId('save-workers-btn'));
      expect(screen.getByTestId('group-details')).toBeInTheDocument();
    });

    it('should render save button in AssignLeads view', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      fireEvent.click(assignLeadsBtn);

      expect(screen.getByTestId('save-leads-btn')).toBeInTheDocument();
    });

    it('should return to Details view when saving leads', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate to leads view
      fireEvent.click(screen.getByTestId('assign-leads-btn'));
      expect(screen.getByTestId('manager-assignment')).toBeInTheDocument();

      // Save and return
      fireEvent.click(screen.getByTestId('save-leads-btn'));
      expect(screen.getByTestId('group-details')).toBeInTheDocument();
    });
  });

  describe('Form Validation and Submission', () => {
    it('should create group with valid name', async () => {
      mockCreateGroupWithAssignments.mockResolvedValue({});

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const input = screen.getByTestId('group-name-input');
      const user = userEvent.setup();

      await user.type(input, 'Valid Group Name');

      const submitBtn = screen.getByTestId('create-group-drawer-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateGroupWithAssignments).toHaveBeenCalledWith({
          groupName: 'Valid Group Name',
          members: [],
          leads: [],
        });
      });
    });

    it('should trim group name before submission', async () => {
      mockCreateGroupWithAssignments.mockResolvedValue({});

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const input = screen.getByTestId('group-name-input');
      const user = userEvent.setup();

      await user.type(input, '  Trimmed Group  ');

      const submitBtn = screen.getByTestId('create-group-drawer-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateGroupWithAssignments).toHaveBeenCalledWith({
          groupName: 'Trimmed Group',
          members: [],
          leads: [],
        });
      });
    });

    it('should handle validation error for empty group name', async () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const submitBtn = screen.getByTestId('create-group-drawer-submit-btn');
      fireEvent.click(submitBtn);

      // Should not call create when validation fails
      expect(mockCreateGroupWithAssignments).not.toHaveBeenCalled();
    });

    it('should include selected members in submission', async () => {
      mockCreateGroupWithAssignments.mockResolvedValue({});

      const storeWithMembers = createStore({
        selectedMembers: {
          'worker-1': { id: 'worker-1', name: 'Worker 1' },
          'worker-2': { id: 'worker-2', name: 'Worker 2' },
        },
      });

      render(
        <Provider store={storeWithMembers}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      const input = screen.getByTestId('group-name-input');
      const user = userEvent.setup();

      await user.type(input, 'Group With Members');

      const submitBtn = screen.getByTestId('create-group-drawer-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateGroupWithAssignments).toHaveBeenCalledWith({
          groupName: 'Group With Members',
          members: [
            { id: 'worker-1', name: 'Worker 1' },
            { id: 'worker-2', name: 'Worker 2' },
          ],
          leads: [],
        });
      });
    });

    it('should include selected leads in submission', async () => {
      mockCreateGroupWithAssignments.mockResolvedValue({});

      const storeWithLeads = createStore({
        selectedLeads: {
          'lead-1': { id: 'lead-1', name: 'Lead 1' },
        },
      });

      render(
        <Provider store={storeWithLeads}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      const input = screen.getByTestId('group-name-input');
      const user = userEvent.setup();

      await user.type(input, 'Group With Leads');

      const submitBtn = screen.getByTestId('create-group-drawer-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateGroupWithAssignments).toHaveBeenCalledWith({
          groupName: 'Group With Leads',
          members: [],
          leads: [{ id: 'lead-1', name: 'Lead 1' }],
        });
      });
    });
  });

  describe('Success Callback Handling', () => {
    it('should call onSuccess and onClose after successful creation', async () => {
      mockCreateGroupWithAssignments.mockResolvedValue({});

      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Trigger success callback
      capturedCallbacks.onSuccess({
        groupId: 'new-group-123',
        groupName: 'New Test Group',
        memberAssignments: {
          membersAssigned: 10,
          membersFailed: 0,
        },
        leadAssignments: {
          leadsAssigned: 2,
          leadsFailed: 0,
        },
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call success callback with partial assignment results', () => {
      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      capturedCallbacks.onSuccess({
        groupId: 'new-group-456',
        groupName: 'Partial Success Group',
        memberAssignments: {
          membersAssigned: 5,
          membersFailed: 2,
        },
        leadAssignments: {
          leadsAssigned: 1,
          leadsFailed: 1,
        },
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call success callback without assignment data', () => {
      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      capturedCallbacks.onSuccess({
        groupId: 'new-group-789',
        groupName: 'Basic Group',
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onSuccess or onClose when partial success in both members and leads', async () => {
      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      await act(async () => {
        capturedCallbacks.onSuccess({
          groupId: 'new-group-partial-both',
          groupName: 'Partial Both',
          memberAssignments: {
            partialSuccess: true,
            membersAssigned: 3,
            membersFailed: 1,
            failures: [
              {
                workerId: 'w1',
                errorCode: 'ALREADY_IN_GROUP',
                errorMessage: 'Already in group',
              },
            ],
          },
          leadAssignments: {
            partialSuccess: true,
            leadsAssigned: 1,
            leadsFailed: 1,
            failures: [
              {
                workerId: 'w2',
                errorCode: 'WORKER_VALIDATION_FAILED',
                errorMessage: 'Inactive',
              },
            ],
          },
        });
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Component="CreateGroupDrawer" Event="Partial success in both members and leads"',
        expect.any(Object),
      );
      expect(
        screen.getByTestId('group-drawer-error-message'),
      ).toBeInTheDocument();
    });

    it('should not call onSuccess or onClose when partial success in members only', async () => {
      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      await act(async () => {
        capturedCallbacks.onSuccess({
          groupId: 'new-group-partial-members',
          groupName: 'Partial Members',
          memberAssignments: {
            partialSuccess: true,
            membersAssigned: 2,
            membersFailed: 1,
            failures: [
              {
                workerId: 'w1',
                errorCode: 'ALREADY_IN_GROUP',
                errorMessage: 'Already in group',
              },
            ],
          },
          leadAssignments: {
            leadsAssigned: 0,
            leadsFailed: 0,
          },
        });
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Component="CreateGroupDrawer" Event="Partial success in members"',
        expect.any(Object),
      );
      expect(
        screen.getByTestId('group-drawer-error-message'),
      ).toBeInTheDocument();
    });

    it('should not call onSuccess or onClose when partial success in leads only', async () => {
      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      await act(async () => {
        capturedCallbacks.onSuccess({
          groupId: 'new-group-partial-leads',
          groupName: 'Partial Leads',
          memberAssignments: {
            membersAssigned: 0,
            membersFailed: 0,
          },
          leadAssignments: {
            partialSuccess: true,
            leadsAssigned: 1,
            leadsFailed: 1,
            failures: [
              {
                workerId: 'w2',
                errorCode: 'WORKER_VALIDATION_FAILED',
                errorMessage: 'Inactive',
              },
            ],
          },
        });
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Component="CreateGroupDrawer" Event="Partial success in leads"',
        expect.any(Object),
      );
      expect(
        screen.getByTestId('group-drawer-error-message'),
      ).toBeInTheDocument();
    });
  });

  describe('Error Callback Handling', () => {
    it('should display error when error callback is triggered', () => {
      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Trigger error callback
      capturedCallbacks.onError('Network error', 'NETWORK_ERROR');

      expect(
        screen.getByTestId('group-drawer-error-message'),
      ).toBeInTheDocument();
    });

    it('should handle error with error code and source', () => {
      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      capturedCallbacks.onError(
        'Permission denied',
        'PERMISSION_ERROR',
        ErrorSource.CreateGroup,
      );

      expect(
        screen.getByTestId('group-drawer-error-message'),
      ).toBeInTheDocument();
    });

    it('should clear error message', () => {
      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Trigger error
      capturedCallbacks.onError('Test error');
      expect(
        screen.getByTestId('group-drawer-error-message'),
      ).toBeInTheDocument();

      // Clear error
      const clearBtn = screen.getByTestId('clear-error-btn');
      fireEvent.click(clearBtn);

      expect(
        screen.queryByTestId('group-drawer-error-message'),
      ).not.toBeInTheDocument();
    });

    it('should clear error when typing in group name', async () => {
      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Trigger error
      capturedCallbacks.onError('Test error');
      expect(
        screen.getByTestId('group-drawer-error-message'),
      ).toBeInTheDocument();

      // Type in input to clear error
      const input = screen.getByTestId('group-name-input');
      const user = userEvent.setup();
      await user.type(input, 'A');

      expect(
        screen.queryByTestId('group-drawer-error-message'),
      ).not.toBeInTheDocument();
    });

    it('should handle exception during mutation', async () => {
      mockCreateGroupWithAssignments.mockRejectedValue(
        new Error('Mutation failed'),
      );

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const input = screen.getByTestId('group-name-input');
      const user = userEvent.setup();

      await user.type(input, 'Test Group');

      const submitBtn = screen.getByTestId('create-group-drawer-submit-btn');
      fireEvent.click(submitBtn);

      // Should handle exception gracefully
      await waitFor(() => {
        expect(mockCreateGroupWithAssignments).toHaveBeenCalled();
      });
    });
  });

  describe('Drawer Close Behavior', () => {
    it('should close drawer from Details view', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByTestId('group-details')).toBeInTheDocument();
    });

    it('should navigate back to Details view when in AssignWorkers and drawer is closed', () => {
      // Need to create a custom mock for Drawer to test the onClose callback
      const DrawerMock = require('@ids-ts/drawer');
      const originalDrawer = DrawerMock.Drawer;

      let drawerOnClose: any;
      DrawerMock.Drawer = ({ onClose, open, children }: any) => {
        drawerOnClose = onClose;
        return open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;
      };

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate to workers view
      fireEvent.click(screen.getByTestId('assign-workers-btn'));
      expect(screen.getByTestId('worker-assignment')).toBeInTheDocument();

      // Close from workers view - should go back to Details, not close drawer
      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      // Should return to Details view
      expect(screen.getByTestId('group-details')).toBeInTheDocument();

      // Restore original mock
      DrawerMock.Drawer = originalDrawer;
    });

    it('should navigate back to Details view when in AssignLeads and drawer is closed', () => {
      const DrawerMock = require('@ids-ts/drawer');
      const originalDrawer = DrawerMock.Drawer;

      let drawerOnClose: any;
      DrawerMock.Drawer = ({ onClose, open, children }: any) => {
        drawerOnClose = onClose;
        return open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;
      };

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate to leads view
      fireEvent.click(screen.getByTestId('assign-leads-btn'));
      expect(screen.getByTestId('manager-assignment')).toBeInTheDocument();

      // Close from leads view - should go back to Details, not close drawer
      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      // Should return to Details view
      expect(screen.getByTestId('group-details')).toBeInTheDocument();

      // Restore original mock
      DrawerMock.Drawer = originalDrawer;
    });

    it('should call onClose from Details view', () => {
      const DrawerMock = require('@ids-ts/drawer');
      const originalDrawer = DrawerMock.Drawer;

      DrawerMock.Drawer = ({ onClose, open, children }: any) =>
        open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByTestId('group-details')).toBeInTheDocument();

      // Close from Details view - should call onClose
      fireEvent.click(screen.getByTestId('drawer-close-btn'));

      expect(mockOnClose).toHaveBeenCalled();

      // Restore original mock
      DrawerMock.Drawer = originalDrawer;
    });
  });

  describe('State Reset on Open/Close', () => {
    it('should reset state when drawer closes', () => {
      const { rerender } = renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Set some state
      const input = screen.getByTestId('group-name-input');
      fireEvent.change(input, { target: { value: 'Test' } });

      // Close drawer
      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open={false}
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      // Reopen drawer
      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      // State should be reset
      const newInput = screen.getByTestId('group-name-input');
      expect(newInput).toHaveValue('');
    });

    it('should reset view to Details when opening drawer', () => {
      const { rerender } = renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate away from Details
      fireEvent.click(screen.getByTestId('assign-workers-btn'));
      expect(screen.getByTestId('worker-assignment')).toBeInTheDocument();

      // Close and reopen
      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open={false}
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      // Should be back to Details view
      expect(screen.getByTestId('group-details')).toBeInTheDocument();
    });

    it('should clear errors when drawer opens', () => {
      let capturedCallbacks: any;
      useGroupWithAssignments.mockImplementation((callbacks: any) => {
        capturedCallbacks = callbacks;
        return {
          createGroupWithAssignments: mockCreateGroupWithAssignments,
          loading: false,
        };
      });

      const { rerender } = renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Set error
      capturedCallbacks.onError('Test error');
      expect(
        screen.getByTestId('group-drawer-error-message'),
      ).toBeInTheDocument();

      // Close and reopen
      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open={false}
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      // Error should be cleared
      expect(
        screen.queryByTestId('group-drawer-error-message'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Analytics Tracking', () => {
    it('should track VIEW_CREATE_DRAWER when drawer opens', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'viewed',
          ui_action: 'viewed',
          ui_object: 'drawer',
          ui_object_detail: 'create_group_drawer',
          previous_screen: 'create_group_cta',
        }),
      );
    });

    it('should track TYPE_GROUP_NAME on first character typed', async () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear(); // Clear the VIEW_CREATE_DRAWER tracking

      const input = screen.getByTestId('group-name-input');

      // Type first character
      fireEvent.change(input, { target: { value: 'T' } });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          ui_action: 'typed',
          ui_object: 'form_field',
          ui_object_detail: 'group_name_field',
          previous_screen: 'create_group_drawer',
        }),
      );
    });

    it('should only track TYPE_GROUP_NAME once per session', async () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear(); // Clear the VIEW_CREATE_DRAWER tracking

      const input = screen.getByTestId('group-name-input');

      // Type first character
      fireEvent.change(input, { target: { value: 'T' } });
      expect(mockTrack).toHaveBeenCalledTimes(1);

      // Type more characters
      fireEvent.change(input, { target: { value: 'Te' } });
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.change(input, { target: { value: 'Test Group' } });

      // Should still be called only once
      expect(mockTrack).toHaveBeenCalledTimes(1);
    });

    it('should track CLICK_ASSIGN_WORKERS when assign workers button is clicked', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear(); // Clear the VIEW_CREATE_DRAWER tracking

      const assignWorkersBtn = screen.getByTestId('assign-workers-btn');
      fireEvent.click(assignWorkersBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'assign_workers',
          previous_screen: 'create_group_drawer',
        }),
      );
    });

    it('should track CLICK_ASSIGN_LEADS when assign leads button is clicked', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear(); // Clear the VIEW_CREATE_DRAWER tracking

      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      fireEvent.click(assignLeadsBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'assign_leads',
          previous_screen: 'create_group_drawer',
        }),
      );
    });

    it('should track SAVE_GROUP when create button is clicked', async () => {
      mockCreateGroupWithAssignments.mockResolvedValueOnce({});

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear(); // Clear the VIEW_CREATE_DRAWER tracking

      // Enter group name
      const input = screen.getByTestId('group-name-input');
      fireEvent.change(input, { target: { value: 'Test Group' } });

      mockTrack.mockClear(); // Clear the TYPE_GROUP_NAME tracking

      // Click create button
      const createBtn = screen.getByTestId('create-group-drawer-submit-btn');
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'engaged',
            ui_action: 'clicked',
            ui_object: 'button',
            ui_object_detail: 'save_group',
            previous_screen: 'create_group_drawer',
          }),
        );
      });
    });

    it('should track CANCEL_GROUP when cancel button is clicked', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear(); // Clear the VIEW_CREATE_DRAWER tracking

      const cancelBtn = screen.getByTestId('create-group-drawer-cancel-btn');
      fireEvent.click(cancelBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'cancel_group',
          previous_screen: 'create_group_drawer',
        }),
      );
    });

    it('should track CLOSE_CREATE_GROUP_DRAWER when X button is clicked', () => {
      const DrawerMock = require('@ids-ts/drawer');
      const originalDrawer = DrawerMock.Drawer;

      DrawerMock.Drawer = ({ children, open, onClose }: any) =>
        open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              X
            </button>
            {children}
          </div>
        ) : null;

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear(); // Clear the VIEW_CREATE_DRAWER tracking

      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'engaged',
          object: 'component',
          object_detail: 'create_group_drawer',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'close_button',
          ui_access_point: 'center',
        }),
      );

      // Restore original mock
      DrawerMock.Drawer = originalDrawer;
    });

    it('should reset hasTrackedTyping when drawer closes and opens again', () => {
      const { rerender } = renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear();

      // Type first character
      const input = screen.getByTestId('group-name-input');
      fireEvent.change(input, { target: { value: 'T' } });
      expect(mockTrack).toHaveBeenCalledTimes(1);

      // Close drawer
      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open={false}
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      mockTrack.mockClear();

      // Reopen drawer
      rerender(
        <Provider store={createStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      // Should track VIEW_CREATE_DRAWER again
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'viewed',
          ui_object: 'drawer',
        }),
      );

      mockTrack.mockClear();

      // Type should be trackable again
      const newInput = screen.getByTestId('group-name-input');
      fireEvent.change(newInput, { target: { value: 'A' } });
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          ui_action: 'typed',
          ui_object: 'form_field',
        }),
      );
    });

    it('should verify all tracking points have correct previous_screen field', () => {
      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // All tracking calls should have previous_screen
      mockTrack.mock.calls.forEach((call) => {
        expect(call[0]).toHaveProperty('previous_screen');
        expect(typeof call[0].previous_screen).toBe('string');
      });
    });
  });

  describe('Group Modals Analytics Tracking', () => {
    beforeEach(() => {
      mockTrack.mockClear();
      mockLogger.info.mockClear();
    });

    it('should track VIEW_WORKER_MODAL when AssignWorkers view is opened', () => {
      const {
        GROUP_MODALS_TRACKING_POINTS,
      } = require('src/js/widgets/assignments/utils/groupsTrackingPoints');

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear();
      mockLogger.info.mockClear();

      // Click assign workers button
      const assignWorkersBtn = screen.getByTestId('assign-workers-btn');
      fireEvent.click(assignWorkersBtn);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="CreateGroupDrawer" Event="Assign workers modal viewed"',
      );
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_MODALS_TRACKING_POINTS.VIEW_WORKER_MODAL,
      );
      expect(
        GROUP_MODALS_TRACKING_POINTS.VIEW_WORKER_MODAL.previous_screen,
      ).toBe('group_action_menu');
    });

    it('should track VIEW_LEAD_MODAL when AssignLeads view is opened', () => {
      const {
        GROUP_MODALS_TRACKING_POINTS,
      } = require('src/js/widgets/assignments/utils/groupsTrackingPoints');

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear();
      mockLogger.info.mockClear();

      // Click assign leads button
      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      fireEvent.click(assignLeadsBtn);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="CreateGroupDrawer" Event="Assign leads modal viewed"',
      );
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_MODALS_TRACKING_POINTS.VIEW_LEAD_MODAL,
      );
      expect(GROUP_MODALS_TRACKING_POINTS.VIEW_LEAD_MODAL.previous_screen).toBe(
        'group_action_menu',
      );
    });

    it('should track SAVE_WORKER when save workers button is clicked', () => {
      const {
        GROUP_MODALS_TRACKING_POINTS,
      } = require('src/js/widgets/assignments/utils/groupsTrackingPoints');

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate to AssignWorkers view
      const assignWorkersBtn = screen.getByTestId('assign-workers-btn');
      fireEvent.click(assignWorkersBtn);

      mockTrack.mockClear();
      mockLogger.info.mockClear();

      // Click save button
      const saveBtn = screen.getByTestId('save-workers-btn');
      fireEvent.click(saveBtn);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="CreateGroupDrawer" Event="Save assign workers clicked"',
      );
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_MODALS_TRACKING_POINTS.SAVE_WORKER,
      );
      expect(GROUP_MODALS_TRACKING_POINTS.SAVE_WORKER.previous_screen).toBe(
        'assign_worker_modal',
      );
    });

    it('should track SAVE_LEAD when save leads button is clicked', () => {
      const {
        GROUP_MODALS_TRACKING_POINTS,
      } = require('src/js/widgets/assignments/utils/groupsTrackingPoints');

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate to AssignLeads view
      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      fireEvent.click(assignLeadsBtn);

      mockTrack.mockClear();
      mockLogger.info.mockClear();

      // Click save button
      const saveBtn = screen.getByTestId('save-leads-btn');
      fireEvent.click(saveBtn);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="CreateGroupDrawer" Event="Save assign leads clicked"',
      );
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_MODALS_TRACKING_POINTS.SAVE_LEAD,
      );
      expect(GROUP_MODALS_TRACKING_POINTS.SAVE_LEAD.previous_screen).toBe(
        'assign_lead_modal',
      );
    });

    it('should track CLOSE_WORKER_MODAL when drawer is closed from AssignWorkers view', () => {
      const {
        GROUP_MODALS_TRACKING_POINTS,
      } = require('src/js/widgets/assignments/utils/groupsTrackingPoints');

      const mockDrawer = require('@ids-ts/drawer');
      let capturedDrawerOnClose: any;
      mockDrawer.Drawer = ({ children, open, onClose }: any) => {
        capturedDrawerOnClose = onClose;
        return open ? <div data-testid="drawer">{children}</div> : null;
      };

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate to AssignWorkers view
      const assignWorkersBtn = screen.getByTestId('assign-workers-btn');
      fireEvent.click(assignWorkersBtn);

      mockTrack.mockClear();
      mockLogger.info.mockClear();

      // Close drawer
      capturedDrawerOnClose?.();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="CreateGroupDrawer" Event="Close assign workers modal clicked"',
      );
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_MODALS_TRACKING_POINTS.CLOSE_WORKER_MODAL,
      );
      expect(
        GROUP_MODALS_TRACKING_POINTS.CLOSE_WORKER_MODAL.previous_screen,
      ).toBe('assign_worker_modal');
    });

    it('should track CLOSE_LEAD_MODAL when drawer is closed from AssignLeads view', () => {
      const {
        GROUP_MODALS_TRACKING_POINTS,
      } = require('src/js/widgets/assignments/utils/groupsTrackingPoints');

      const mockDrawer = require('@ids-ts/drawer');
      let capturedDrawerOnClose: any;
      mockDrawer.Drawer = ({ children, open, onClose }: any) => {
        capturedDrawerOnClose = onClose;
        return open ? <div data-testid="drawer">{children}</div> : null;
      };

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate to AssignLeads view
      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      fireEvent.click(assignLeadsBtn);

      mockTrack.mockClear();
      mockLogger.info.mockClear();

      // Close drawer
      capturedDrawerOnClose?.();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component="CreateGroupDrawer" Event="Close assign leads modal clicked"',
      );
      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_MODALS_TRACKING_POINTS.CLOSE_LEAD_MODAL,
      );
      expect(
        GROUP_MODALS_TRACKING_POINTS.CLOSE_LEAD_MODAL.previous_screen,
      ).toBe('assign_lead_modal');
    });

    it('should not track close modal when closing from Details view', () => {
      const mockDrawer = require('@ids-ts/drawer');
      let capturedDrawerOnClose: any;
      mockDrawer.Drawer = ({ children, open, onClose }: any) => {
        capturedDrawerOnClose = onClose;
        return open ? <div data-testid="drawer">{children}</div> : null;
      };

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      mockTrack.mockClear();
      mockLogger.info.mockClear();

      // Close drawer from Details view
      capturedDrawerOnClose?.();

      // Should not track CLOSE_WORKER_MODAL or CLOSE_LEAD_MODAL
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Close assign'),
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Unsaved Changes Modal', () => {
    it('should show unsaved changes modal when closing drawer with unsaved changes in Details view', () => {
      const DrawerMock = require('@ids-ts/drawer');
      let capturedOnClose: any;
      DrawerMock.Drawer = ({ children, open, onClose }: any) => {
        capturedOnClose = onClose;
        return open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;
      };

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Add unsaved changes: type group name
      const input = screen.getByTestId('group-name-input');
      fireEvent.change(input, { target: { value: 'Test Group' } });

      // Try to close drawer
      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      // Modal should be open
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not show unsaved changes modal when closing drawer without unsaved changes', () => {
      const DrawerMock = require('@ids-ts/drawer');
      let capturedOnClose: any;
      DrawerMock.Drawer = ({ children, open, onClose }: any) => {
        capturedOnClose = onClose;
        return open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;
      };

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // No changes made, try to close
      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      // Modal should not be open, drawer should close
      expect(
        screen.queryByTestId('confirmation-modal'),
      ).not.toBeInTheDocument();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should save changes when clicking Save in unsaved changes modal', async () => {
      mockCreateGroupWithAssignments.mockResolvedValue({});

      const DrawerMock = require('@ids-ts/drawer');
      DrawerMock.Drawer = ({ children, open, onClose }: any) =>
        open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Add unsaved changes
      const input = screen.getByTestId('group-name-input');
      fireEvent.change(input, { target: { value: 'Test Group' } });

      // Try to close drawer
      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      // Click Save in modal
      const saveBtn = screen.getByTestId('modal-yes-btn');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockCreateGroupWithAssignments).toHaveBeenCalled();
      });
    });

    it('should discard changes when clicking Dont Save in unsaved changes modal', () => {
      const DrawerMock = require('@ids-ts/drawer');
      DrawerMock.Drawer = ({ children, open, onClose }: any) =>
        open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Add unsaved changes
      const input = screen.getByTestId('group-name-input');
      fireEvent.change(input, { target: { value: 'Test Group' } });

      // Try to close drawer
      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      // Click Don't Save in modal
      const dontSaveBtn = screen.getByTestId('modal-no-btn');
      fireEvent.click(dontSaveBtn);

      // Drawer should close without saving
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockCreateGroupWithAssignments).not.toHaveBeenCalled();
    });

    it('should close modal when clicking X button', () => {
      const DrawerMock = require('@ids-ts/drawer');
      DrawerMock.Drawer = ({ children, open, onClose }: any) =>
        open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Add unsaved changes
      const input = screen.getByTestId('group-name-input');
      fireEvent.change(input, { target: { value: 'Test Group' } });

      // Try to close drawer
      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      // Click X button to close modal
      const closeModalBtn = screen.getByTestId('modal-close-btn');
      fireEvent.click(closeModalBtn);

      // Modal should close, drawer should remain open
      expect(
        screen.queryByTestId('confirmation-modal'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not show unsaved changes modal when in AssignWorkers view', () => {
      const DrawerMock = require('@ids-ts/drawer');
      DrawerMock.Drawer = ({ children, open, onClose }: any) =>
        open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate to AssignWorkers view
      fireEvent.click(screen.getByTestId('assign-workers-btn'));
      expect(screen.getByTestId('worker-assignment')).toBeInTheDocument();

      // Try to close drawer
      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      // Should navigate back to Details, not show modal
      expect(
        screen.queryByTestId('confirmation-modal'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('group-details')).toBeInTheDocument();
    });

    it('should not show unsaved changes modal when in AssignLeads view', () => {
      const DrawerMock = require('@ids-ts/drawer');
      DrawerMock.Drawer = ({ children, open, onClose }: any) =>
        open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;

      renderWithProviders(
        <CreateGroupDrawer
          open
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Navigate to AssignLeads view
      fireEvent.click(screen.getByTestId('assign-leads-btn'));
      expect(screen.getByTestId('manager-assignment')).toBeInTheDocument();

      // Try to close drawer
      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      // Should navigate back to Details, not show modal
      expect(
        screen.queryByTestId('confirmation-modal'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('group-details')).toBeInTheDocument();
    });

    it('should detect unsaved changes from selected members', () => {
      const DrawerMock = require('@ids-ts/drawer');
      DrawerMock.Drawer = ({ children, open, onClose }: any) =>
        open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;

      const storeWithMembers = createStore({
        selectedMembers: {
          'worker-1': { id: 'worker-1', name: 'Worker 1' },
        },
      });

      render(
        <Provider store={storeWithMembers}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      // Try to close drawer
      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      // Modal should be open
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });

    it('should detect unsaved changes from selected leads', () => {
      const DrawerMock = require('@ids-ts/drawer');
      DrawerMock.Drawer = ({ children, open, onClose }: any) =>
        open ? (
          <div data-testid="drawer">
            <button data-testid="drawer-close-btn" onClick={onClose}>
              Close
            </button>
            {children}
          </div>
        ) : null;

      const storeWithLeads = createStore({
        selectedLeads: {
          'lead-1': { id: 'lead-1', name: 'Lead 1' },
        },
      });

      render(
        <Provider store={storeWithLeads}>
          <MockedProvider mocks={[]} addTypename={false}>
            <CreateGroupDrawer
              open
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          </MockedProvider>
        </Provider>,
      );

      // Try to close drawer
      const closeBtn = screen.getByTestId('drawer-close-btn');
      fireEvent.click(closeBtn);

      // Modal should be open
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });
  });

  describe('NTTF - shouldShowGroupLeads', () => {
    beforeEach(() => {
      useGroupWithAssignments.mockReturnValue({
        createGroupWithAssignments: mockCreateGroupWithAssignments,
        loading: false,
      });
    });

    it('should hide ManagerAssignmentController when NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: true,
        shouldShowGroupLeads: false,
        loading: false,
      });

      const store = createStore();

      render(
        <Provider store={store}>
          <CreateGroupDrawer
            open
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </Provider>,
      );

      // ManagerAssignmentController should not be in the DOM
      expect(
        screen.queryByTestId('manager-assignment'),
      ).not.toBeInTheDocument();
    });

    it('should hide leads footer when NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: true,
        shouldShowGroupLeads: false,
        loading: false,
      });

      const store = createStore();

      render(
        <Provider store={store}>
          <CreateGroupDrawer
            open
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </Provider>,
      );

      expect(screen.queryByTestId('save-leads-btn')).not.toBeInTheDocument();
    });

    it('should prevent navigation to AssignLeads view when NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: true,
        shouldShowGroupLeads: false,
        loading: false,
      });

      const store = createStore();

      render(
        <Provider store={store}>
          <CreateGroupDrawer
            open
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </Provider>,
      );

      // Click assign leads - should be guarded
      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      fireEvent.click(assignLeadsBtn);

      // Should stay on details view, ManagerAssignment should not appear
      expect(
        screen.queryByTestId('manager-assignment'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('group-details')).toBeInTheDocument();
    });

    it('should show ManagerAssignmentController when not NTTF eligible', () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: false,
        shouldShowGroupLeads: true,
        loading: false,
      });

      const store = createStore();

      render(
        <Provider store={store}>
          <CreateGroupDrawer
            open
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </Provider>,
      );

      // Navigate to assign leads
      const assignLeadsBtn = screen.getByTestId('assign-leads-btn');
      fireEvent.click(assignLeadsBtn);

      expect(screen.getByTestId('manager-assignment')).toBeInTheDocument();
    });

    it('should pass empty leads array when creating group as NTTF eligible', async () => {
      mockUseNttfEligibility.mockReturnValue({
        isNttfEligible: true,
        shouldShowGroupLeads: false,
        loading: false,
      });

      mockCreateGroupWithAssignments.mockResolvedValueOnce({
        groupId: 'new-group-id',
        groupName: 'Test Group',
      });

      const store = createStore();

      render(
        <Provider store={store}>
          <CreateGroupDrawer
            open
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </Provider>,
      );

      // Type group name
      const input = screen.getByTestId('group-name-input');
      fireEvent.change(input, { target: { value: 'Test Group' } });

      // Submit
      const submitBtn = screen.getByTestId('create-group-drawer-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateGroupWithAssignments).toHaveBeenCalledWith(
          expect.objectContaining({
            leads: [],
          }),
        );
      });
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
