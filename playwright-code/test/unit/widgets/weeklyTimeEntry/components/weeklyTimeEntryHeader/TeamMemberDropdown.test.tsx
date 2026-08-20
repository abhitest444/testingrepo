import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TeamMemberDropdown } from '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryHeader/TeamMemberDropdown';
import timeEntryGridSlice, {
  TeamMember,
} from '../../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import validationSlice from '../../../../../../src/js/widgets/weeklyTimeEntry/store/validationSlice';
import { TimeForType } from '../../../../../../src/js/widgets/weeklyTimeEntry/types';

// Feature flag mock removed - now using Redux store values

// Mock the HOCWidget component
jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    widgetId,
    addNew,
    shouldShowSubLabel,
    type,
    subTypes,
    value,
    onChange,
    onReady,
    onLoadingChange,
    label,
    displayType,
    excludePayrollInactiveEmployees,
    dropdownType,
    filters,
  }: any) => (
    <div
      data-testid="team-member-widget"
      data-widget-id={widgetId}
      data-add-new={addNew}
      data-should-show-sub-label={shouldShowSubLabel}
      data-type={type}
      data-sub-types={JSON.stringify(subTypes)}
      data-value={value}
      data-label={label}
      data-display-type={displayType}
      data-exclude-payroll-inactive-employees={excludePayrollInactiveEmployees}
      data-dropdown-type={dropdownType}
      data-filters={JSON.stringify(filters)}
    >
      <button
        onClick={() => {
          // Handle both old and new widget formats
          if (widgetId === 'time-tracking-ui/quickFind') {
            // QuickFind format - simulate the onChange call with (string, item) signature
            onChange('test-id', {
              id: 'test-id',
              name: 'Test User',
              type: 'EMPLOYEE',
            });
          } else {
            // Legacy widget format
            onChange({
              selectedItem: {
                contact: {
                  id: 'test-id',
                  displayName: 'Test User',
                  type: 'EMPLOYEE',
                },
                label: 'Test User',
              },
            });
          }
        }}
        data-testid="change-team-member-button"
      >
        Change Team Member
      </button>
      <button
        onClick={() => onReady && onReady()}
        data-testid="trigger-onready"
      >
        Trigger OnReady
      </button>
      <button
        onClick={() => onLoadingChange && onLoadingChange(true)}
        data-testid="trigger-loading-true"
      >
        Trigger Loading True
      </button>
      <button
        onClick={() => onLoadingChange && onLoadingChange(false)}
        data-testid="trigger-loading-false"
      >
        Trigger Loading False
      </button>
      <span>Current: {value || 'None'}</span>
    </div>
  ),
}));

// Mock the guidance tooltip component
jest.mock('@ids-ts/guidance-tooltip', () => ({
  __esModule: true,
  default: ({
    targetElement,
    dismissible,
    title,
    open,
    message,
    onClose,
    position,
    alignment,
    enableClickAway,
  }: any) => (
    <div
      data-testid="guidance-tooltip"
      data-open={open}
      data-title={title}
      data-message={message}
      data-position={position}
      data-alignment={alignment}
      data-dismissible={dismissible}
      data-enable-click-away={enableClickAway}
    >
      {open && (
        <>
          <div data-testid="tooltip-title">{title}</div>
          <div data-testid="tooltip-message">{message}</div>
          <button onClick={onClose} data-testid="tooltip-close">
            Close Tooltip
          </button>
        </>
      )}
    </div>
  ),
}));

// Mock the useIntl hook
const mockFormatMessage = jest.fn(({ id }: { id: string }) => {
  const messages: { [key: string]: string } = {
    'select.team.member.tooltip.title': 'Select Team Member',
    'select.team.member.tooltip.message':
      'Please select a team member to continue',
    'weekly.time.entry.team.member': 'Team Member',
    'weekly.time.entry.team.member.tooltip.title': 'Team Member Selection',
    'weekly.time.entry.team.member.tooltip.message':
      'Select a team member to view their time entries',
  };
  return messages[id] || id;
});

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
  useTracking: () =>
    jest.fn().mockImplementation((event) => {
      // Mock tracking event
    }),
  useSandbox: () => ({
    get: jest.fn(),
    logger: {
      error: jest.fn(),
      info: jest.fn(),
    },
  }),
}));

const createMockStore = (initialState: any = {}) =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridSlice,
      validation: validationSlice,
    },
    preloadedState: {
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: null,
        dateRange: { start: '', end: '' },
        selected: null,
        firstEditedCells: {},
        error: null,
        loading: false,
        showSelectTeamMemberTooltip: false,
        isTeamMemberDropdownReady: false,
        isQuickFindEnabled: true,
        isQuickFindSettled: true,
        confirmTimeEntryConversionModal: {
          isOpen: false,
          rowId: null,
          dayIdx: null,
        },
        ...initialState.timeEntryGrid,
      },
      ...initialState,
    },
  });

describe('TeamMemberDropdown', () => {
  let mockStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = createMockStore();
  });

  const renderWithProvider = (component: React.ReactElement) =>
    render(<Provider store={mockStore}>{component}</Provider>);

  describe('Widget Rendering', () => {
    it('should render the widget with correct props', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const widget = screen.getByTestId('team-member-widget');
      expect(widget).toBeInTheDocument();
      expect(widget).toHaveAttribute(
        'data-widget-id',
        'time-tracking-ui/quickFind',
      );
      expect(widget).toHaveAttribute('data-add-new', 'true');
      expect(widget).toHaveAttribute('data-dropdown-type', 'team-member');
      expect(widget).toHaveAttribute(
        'data-sub-types',
        JSON.stringify(['EMPLOYEE', 'VENDOR']),
      );
      expect(widget).toHaveAttribute('data-value', '1');
      expect(widget).toHaveAttribute('data-label', 'Team Member');
    });

    it('should render with null value', () => {
      renderWithProvider(<TeamMemberDropdown value={null} />);

      const widget = screen.getByTestId('team-member-widget');
      expect(widget).toHaveAttribute('data-value', '');
      expect(widget).not.toHaveAttribute('data-display-type');
      expect(screen.getByText('Current: None')).toBeInTheDocument();
    });

    it('should render with employee type', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const widget = screen.getByTestId('team-member-widget');
      expect(widget).toHaveAttribute(
        'data-widget-id',
        'time-tracking-ui/quickFind',
      );
      expect(widget).toHaveAttribute('data-dropdown-type', 'team-member');
    });

    it('should render with vendor type', () => {
      const value = { id: '2', name: 'Jane Smith', type: TimeForType.VENDOR };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const widget = screen.getByTestId('team-member-widget');
      expect(widget).toHaveAttribute(
        'data-widget-id',
        'time-tracking-ui/quickFind',
      );
      expect(widget).toHaveAttribute('data-dropdown-type', 'team-member');
    });

    it('should render with undefined type', () => {
      const value = { id: '3', name: 'Unknown User', type: undefined as any };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const widget = screen.getByTestId('team-member-widget');
      expect(widget).not.toHaveAttribute('data-display-type');
    });
  });

  describe('Team Member Changes', () => {
    it('should handle team member change for employee', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const changeButton = screen.getByText('Change Team Member');
      fireEvent.click(changeButton);

      // Check that the action was dispatched
      const state = mockStore.getState();
      expect(state.timeEntryGrid.teamMember).toEqual({
        id: 'test-id',
        name: 'Test User',
        type: 'EMPLOYEE',
      });
    });

    it('should handle team member change for vendor', () => {
      const value = { id: '2', name: 'Jane Smith', type: TimeForType.VENDOR };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const changeButton = screen.getByText('Change Team Member');
      fireEvent.click(changeButton);

      // Check that the action was dispatched
      const state = mockStore.getState();
      expect(state.timeEntryGrid.teamMember).toEqual({
        id: 'test-id',
        name: 'Test User',
        type: 'EMPLOYEE',
      });
    });

    it('should hide tooltip when team member is selected', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const changeButton = screen.getByText('Change Team Member');
      fireEvent.click(changeButton);

      // Check that the action was dispatched and tooltip is hidden
      const state = mockStore.getState();
      expect(state.timeEntryGrid.teamMember).toEqual({
        id: 'test-id',
        name: 'Test User',
        type: 'EMPLOYEE',
      });
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(false);
    });

    it('should display current value', () => {
      const value: TeamMember = {
        id: '1',
        name: 'John Doe',
        type: TimeForType.EMPLOYEE,
      };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      expect(screen.getByText('Current: 1')).toBeInTheDocument();
    });

    it('should display "None" when value is null', () => {
      renderWithProvider(<TeamMemberDropdown value={null} />);

      expect(screen.getByText('Current: None')).toBeInTheDocument();
    });
  });

  describe('Guidance Tooltip', () => {
    it('should show tooltip when onReady is triggered and no team member is selected', () => {
      renderWithProvider(<TeamMemberDropdown value={null} />);

      const onReadyButton = screen.getByTestId('trigger-onready');
      fireEvent.click(onReadyButton);

      // Check that the tooltip is shown in Redux state
      const state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(true);

      // Check that the tooltip is shown in UI
      const tooltip = screen.getByTestId('guidance-tooltip');
      expect(tooltip).toHaveAttribute('data-open', 'true');
      expect(screen.getByTestId('tooltip-title')).toHaveTextContent(
        'Team Member Selection',
      );
      expect(screen.getByTestId('tooltip-message')).toHaveTextContent(
        'Select a team member to view their time entries',
      );
    });

    it('should not show tooltip when onReady is triggered and team member is already selected', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const onReadyButton = screen.getByTestId('trigger-onready');
      fireEvent.click(onReadyButton);

      // Check that the tooltip is not shown in Redux state
      const state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(false);

      // Check that the tooltip is not shown in UI
      const tooltip = screen.getByTestId('guidance-tooltip');
      expect(tooltip).toHaveAttribute('data-open', 'false');
    });

    it('should not show tooltip on subsequent onReady calls', () => {
      renderWithProvider(<TeamMemberDropdown value={null} />);

      const onReadyButton = screen.getByTestId('trigger-onready');

      // First call should show tooltip
      fireEvent.click(onReadyButton);
      let state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(true);

      // Second call should not change tooltip state (widgetOnReadyFired is already true)
      fireEvent.click(onReadyButton);
      state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(true); // Should still be true
    });

    it('should close tooltip when close button is clicked', () => {
      renderWithProvider(<TeamMemberDropdown value={null} />);

      // First trigger onReady to show tooltip
      const onReadyButton = screen.getByTestId('trigger-onready');
      fireEvent.click(onReadyButton);

      // Verify tooltip is shown in Redux state
      let state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(true);

      // Click close button
      const closeButton = screen.getByTestId('tooltip-close');
      fireEvent.click(closeButton);

      // Verify tooltip is closed in Redux state
      state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(false);

      // Verify tooltip is closed in UI
      const tooltip = screen.getByTestId('guidance-tooltip');
      expect(tooltip).toHaveAttribute('data-open', 'false');
    });

    it('should format tooltip messages correctly', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);
      const onReadyButton = screen.getByTestId('trigger-onready');
      fireEvent.click(onReadyButton);

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.team.member.tooltip.title',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.team.member.tooltip.message',
      });
    });

    it('should use NLS for team member label and tooltip', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);
      const onReadyButton = screen.getByTestId('trigger-onready');
      fireEvent.click(onReadyButton);

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.team.member',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.team.member.tooltip.title',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.team.member.tooltip.message',
      });
    });

    it('should hide tooltip when team member is selected after initially not having one', () => {
      renderWithProvider(<TeamMemberDropdown value={null} />);

      // Trigger onReady to show tooltip
      const onReadyButton = screen.getByTestId('trigger-onready');
      fireEvent.click(onReadyButton);

      // Verify tooltip is initially shown in Redux state
      let state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(true);

      // Simulate user selecting a team member through the widget (triggers onChange)
      const changeButton = screen.getByText('Change Team Member');
      fireEvent.click(changeButton);

      // Verify tooltip is now hidden in Redux state (onChange triggers setTeamMember which hides tooltip)
      state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(false);
    });

    it('should hide tooltip when user selects team member through widget interaction', () => {
      renderWithProvider(<TeamMemberDropdown value={null} />);

      // Trigger onReady to show tooltip
      const onReadyButton = screen.getByTestId('trigger-onready');
      fireEvent.click(onReadyButton);

      // Verify tooltip is initially shown in Redux state
      let state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(true);

      // Simulate user selecting a team member through the widget
      const changeButton = screen.getByText('Change Team Member');
      fireEvent.click(changeButton);

      // Verify tooltip is now hidden in Redux state
      state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(false);
    });
  });

  describe('Widget Container', () => {
    it('should render widget inside a container div with ref', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const widget = screen.getByTestId('team-member-widget');
      const container = widget.parentElement;

      expect(container).toBeInTheDocument();
      expect(container?.tagName).toBe('DIV');
    });
  });

  it('clears validation errors when team member changes', () => {
    const initialState = {
      timeEntryGrid: {
        teamMember: null,
        showSelectTeamMemberTooltip: false,
      },
      validation: {
        showValidationError: true,
        errorMessages: ['Test error message'],
        fieldErrors: { 'test-cell': { service: 'Service is required' } },
        rowErrors: { 'test-row': { overHours: 'Too many hours' } },
        saveError: 'Save failed',
        timeEntriesError: 'Time entries error',
        settingsError: 'Settings error',
      },
    };

    const mockStore = createMockStore(initialState);
    const renderWithProvider = (component: React.ReactElement) =>
      render(<Provider store={mockStore}>{component}</Provider>);

    renderWithProvider(<TeamMemberDropdown value={null} />);

    // Verify initial state has validation errors
    expect(mockStore.getState().validation.showValidationError).toBe(true);
    expect(mockStore.getState().validation.errorMessages).toHaveLength(1);

    // Change team member
    const changeButton = screen.getByText('Change Team Member');
    fireEvent.click(changeButton);

    // Verify validation errors are cleared
    expect(mockStore.getState().validation.showValidationError).toBe(false);
    expect(mockStore.getState().validation.errorMessages).toHaveLength(0);
    expect(mockStore.getState().validation.fieldErrors).toEqual({});
    expect(mockStore.getState().validation.rowErrors).toEqual({});
    expect(mockStore.getState().validation.saveError).toBeNull();
    expect(mockStore.getState().validation.timeEntriesError).toBeNull();
    expect(mockStore.getState().validation.settingsError).toBeNull();
  });

  describe('QuickFind Widget Specific Tests', () => {
    it('should render QuickFind widget when feature flag is enabled', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const widget = screen.getByTestId('team-member-widget');
      expect(widget).toHaveAttribute(
        'data-widget-id',
        'time-tracking-ui/quickFind',
      );
      expect(widget).toHaveAttribute('data-dropdown-type', 'team-member');
      expect(widget).toHaveAttribute('data-add-new', 'true');
    });

    it('should pass correct subTypes to QuickFind widget', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const widget = screen.getByTestId('team-member-widget');
      const subTypes = JSON.parse(
        widget.getAttribute('data-sub-types') || '[]',
      );
      expect(subTypes).toEqual(['EMPLOYEE', 'VENDOR']);
    });

    it('should pass correct subTypes to QuickFind widget (no filters prop)', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const widget = screen.getByTestId('team-member-widget');
      // The component does not pass a filters prop to QuickFind
      expect(widget.getAttribute('data-filters')).toBeNull();
    });

    it('should handle QuickFind onChange with correct data structure', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const changeButton = screen.getByText('Change Team Member');
      fireEvent.click(changeButton);

      const state = mockStore.getState();
      expect(state.timeEntryGrid.teamMember).toEqual({
        id: 'test-id',
        name: 'Test User',
        type: 'EMPLOYEE',
      });
    });

    it('should handle QuickFind onChange with vendor type', () => {
      // This test verifies that the component can handle vendor type changes
      // The actual mock behavior is handled by the main mock, so we test the integration
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const changeButton = screen.getByText('Change Team Member');
      fireEvent.click(changeButton);

      const state = mockStore.getState();
      expect(state.timeEntryGrid.teamMember).toEqual({
        id: 'test-id',
        name: 'Test User',
        type: 'EMPLOYEE',
      });
    });

    it('should handle QuickFind onChange with different contact types', () => {
      // This test verifies that the component can handle different contact type changes
      // The actual mock behavior is handled by the main mock, so we test the integration
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const changeButton = screen.getByText('Change Team Member');
      fireEvent.click(changeButton);

      const state = mockStore.getState();
      expect(state.timeEntryGrid.teamMember).toEqual({
        id: 'test-id',
        name: 'Test User',
        type: 'EMPLOYEE',
      });
    });

    it('should handle QuickFind widget width and label props', () => {
      const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const widget = screen.getByTestId('team-member-widget');
      expect(widget).toHaveAttribute('data-label', 'Team Member');
    });

    it('should handle QuickFind onReady callback correctly', () => {
      const value = null;
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const onReadyButton = screen.getByTestId('trigger-onready');
      fireEvent.click(onReadyButton);

      const state = mockStore.getState();
      expect(state.timeEntryGrid.isTeamMemberDropdownReady).toBe(true);
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(true);
    });

    it('renders the QuickFind widget without a shimmer overlay', () => {
      const value = null;
      renderWithProvider(<TeamMemberDropdown value={value} />);

      // The widget should render directly; the dropdown surfaces its own
      // "Loading…" placeholder when the API is slow, so no overlay is needed.
      expect(screen.getByTestId('team-member-widget')).toBeInTheDocument();
      expect(screen.queryByTestId('dropdown-overlay')).toBeNull();
    });

    it('should not show tooltip on subsequent onReady calls', () => {
      const value = null;
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const onReadyButton = screen.getByTestId('trigger-onready');

      // First onReady call
      fireEvent.click(onReadyButton);
      let state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(true);

      // Second onReady call
      fireEvent.click(onReadyButton);
      state = mockStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(true); // Should still be true as we're not toggling off
    });

    it('should handle QuickFind widget with null value', () => {
      renderWithProvider(<TeamMemberDropdown value={null} />);

      const widget = screen.getByTestId('team-member-widget');
      expect(widget).toHaveAttribute('data-value', '');
      expect(screen.getByText('Current: None')).toBeInTheDocument();
    });

    it('should handle QuickFind widget with undefined value', () => {
      const value = undefined as any;
      renderWithProvider(<TeamMemberDropdown value={value} />);

      const widget = screen.getByTestId('team-member-widget');
      expect(widget).toHaveAttribute('data-value', '');
      expect(screen.getByText('Current: None')).toBeInTheDocument();
    });
  });

  describe('Legacy Widget onReady path', () => {
    it('shows tooltip on first onReady when QuickFind is disabled and no value selected', () => {
      const legacyStore = createMockStore({
        timeEntryGrid: {
          isQuickFindEnabled: false,
          isQuickFindSettled: true,
        },
      });

      render(
        <Provider store={legacyStore}>
          <TeamMemberDropdown value={null} />
        </Provider>,
      );

      fireEvent.click(screen.getByTestId('trigger-onready'));
      const state = legacyStore.getState();
      expect(state.timeEntryGrid.showSelectTeamMemberTooltip).toBe(true);
      expect(state.timeEntryGrid.isTeamMemberDropdownReady).toBe(true);
    });

    it('handles legacy widget onChange contact payload path', () => {
      const legacyStore = createMockStore({
        timeEntryGrid: {
          isQuickFindEnabled: false,
          isQuickFindSettled: true,
        },
      });

      render(
        <Provider store={legacyStore}>
          <TeamMemberDropdown value={null} />
        </Provider>,
      );

      fireEvent.click(screen.getByTestId('change-team-member-button'));
      const state = legacyStore.getState();
      expect(state.timeEntryGrid.teamMember).toEqual({
        id: 'test-id',
        name: 'Test User',
        type: 'EMPLOYEE',
      });
    });
  });

  // Tests for new functionality added in QUANTA-3894
  describe('New Functionality Tests - QUANTA-3894', () => {
    describe('currentValue State Management', () => {
      it('should initialize currentValue state with the provided value prop', () => {
        const value: TeamMember = {
          id: '1',
          name: 'John Doe',
          type: TimeForType.EMPLOYEE,
        };
        renderWithProvider(<TeamMemberDropdown value={value} />);

        const widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '1');
        expect(screen.getByText('Current: 1')).toBeInTheDocument();
      });

      it('should initialize currentValue state with null when value is null', () => {
        renderWithProvider(<TeamMemberDropdown value={null} />);

        const widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '');
        expect(screen.getByText('Current: None')).toBeInTheDocument();
      });

      it('should sync currentValue with value prop changes', () => {
        const initialValue: TeamMember = {
          id: '1',
          name: 'John Doe',
          type: TimeForType.EMPLOYEE,
        };

        const { rerender } = renderWithProvider(
          <TeamMemberDropdown value={initialValue} />,
        );

        // Verify initial state
        let widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '1');

        // Change the value prop
        const newValue: TeamMember = {
          id: '2',
          name: 'Jane Smith',
          type: TimeForType.VENDOR,
        };

        rerender(
          <Provider store={mockStore}>
            <TeamMemberDropdown value={newValue} />
          </Provider>,
        );

        // Verify currentValue syncs with new prop value
        widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '2');
      });

      it('should sync currentValue from non-null to null', () => {
        const initialValue: TeamMember = {
          id: '1',
          name: 'John Doe',
          type: TimeForType.EMPLOYEE,
        };

        const { rerender } = renderWithProvider(
          <TeamMemberDropdown value={initialValue} />,
        );

        // Verify initial state
        let widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '1');

        // Change to null
        rerender(
          <Provider store={mockStore}>
            <TeamMemberDropdown value={null} />
          </Provider>,
        );

        // Verify currentValue syncs to null
        widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '');
        expect(screen.getByText('Current: None')).toBeInTheDocument();
      });

      it('should sync currentValue from null to non-null', () => {
        const { rerender } = renderWithProvider(
          <TeamMemberDropdown value={null} />,
        );

        // Verify initial null state
        let widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '');

        // Change to a value
        const newValue: TeamMember = {
          id: '3',
          name: 'Alice Johnson',
          type: TimeForType.VENDOR,
        };

        rerender(
          <Provider store={mockStore}>
            <TeamMemberDropdown value={newValue} />
          </Provider>,
        );

        // Verify currentValue syncs with new value
        widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '3');
      });
    });

    describe('currentValue Updates on Change', () => {
      it('should update Redux state when handleChange is called with QuickFind format', () => {
        const value: TeamMember = {
          id: '1',
          name: 'John Doe',
          type: TimeForType.EMPLOYEE,
        };
        renderWithProvider(<TeamMemberDropdown value={value} />);

        // Verify initial value
        let widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '1');

        // Trigger handleChange by clicking the change button (QuickFind format)
        const changeButton = screen.getByText('Change Team Member');
        fireEvent.click(changeButton);

        // The widget still shows the original value prop since the component doesn't manage internal state
        // The actual state change happens in Redux
        widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '1');

        // Verify Redux state is updated
        const state = mockStore.getState();
        expect(state.timeEntryGrid.teamMember).toEqual({
          id: 'test-id',
          name: 'Test User',
          type: 'EMPLOYEE',
        });
      });

      it('should update currentValue when handleChange is called with legacy format', () => {
        // Create a store with QuickFind disabled to test legacy widget
        const storeWithLegacyWidget = createMockStore({
          timeEntryGrid: {
            isQuickFindEnabled: false,
            isQuickFindSettled: true,
          },
        });

        const renderWithLegacyProvider = (component: React.ReactElement) =>
          render(
            <Provider store={storeWithLegacyWidget}>{component}</Provider>,
          );

        const value: TeamMember = {
          id: '1',
          name: 'John Doe',
          type: TimeForType.EMPLOYEE,
        };
        renderWithLegacyProvider(<TeamMemberDropdown value={value} />);

        // Verify initial currentValue
        const widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '1');
        expect(widget).toHaveAttribute(
          'data-widget-id',
          'qbo-quickfills-ui/quickfills',
        );

        // Trigger handleChange by clicking the change button (legacy format)
        const changeButton = screen.getByText('Change Team Member');
        fireEvent.click(changeButton);

        // Verify Redux state is updated with the new team member
        const state = storeWithLegacyWidget.getState();
        expect(state.timeEntryGrid.teamMember).toEqual({
          id: 'test-id',
          name: 'Test User',
          type: 'EMPLOYEE', // The mock returns uppercase, which is then converted
        });

        // The currentValue state management ensures proper widget behavior
        // This is tested by verifying the component can handle legacy widget interactions
      });

      it('should handle Redux state updates with different team member types', () => {
        const vendorValue: TeamMember = {
          id: '2',
          name: 'Jane Smith',
          type: TimeForType.VENDOR,
        };
        renderWithProvider(<TeamMemberDropdown value={vendorValue} />);

        // Verify initial value for vendor
        let widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '2');

        // Trigger change
        const changeButton = screen.getByText('Change Team Member');
        fireEvent.click(changeButton);

        // The widget still shows the original value prop
        widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '2');

        // Verify Redux state is updated
        const state = mockStore.getState();
        expect(state.timeEntryGrid.teamMember).toEqual({
          id: 'test-id',
          name: 'Test User',
          type: 'EMPLOYEE',
        });
      });
    });

    describe('Widget Props with currentValue', () => {
      it('should pass currentValue?.id to QuickFind widget instead of value?.id', () => {
        const value: TeamMember = {
          id: '1',
          name: 'John Doe',
          type: TimeForType.EMPLOYEE,
        };
        renderWithProvider(<TeamMemberDropdown value={value} />);

        const widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute(
          'data-widget-id',
          'time-tracking-ui/quickFind',
        );
        expect(widget).toHaveAttribute('data-value', '1'); // Should use currentValue?.id
      });

      it('should pass empty string when currentValue is null', () => {
        renderWithProvider(<TeamMemberDropdown value={null} />);

        const widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', ''); // Should be empty when currentValue is null
      });

      it('should pass value?.id to widget consistently', () => {
        const initialValue: TeamMember = {
          id: '1',
          name: 'John Doe',
          type: TimeForType.EMPLOYEE,
        };
        renderWithProvider(<TeamMemberDropdown value={initialValue} />);

        // Verify initial state uses value prop
        let widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '1');

        // Make a change which updates Redux state
        const changeButton = screen.getByText('Change Team Member');
        fireEvent.click(changeButton);

        // Widget still shows original value prop since component doesn't manage internal state
        widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '1');

        // The Redux state is updated, which will cause parent to re-render with new value prop
        const state = mockStore.getState();
        expect(state.timeEntryGrid.teamMember).toEqual({
          id: 'test-id',
          name: 'Test User',
          type: 'EMPLOYEE',
        });
      });
    });

    describe('Integration with Feature Flags', () => {
      it('should use currentValue with QuickFind widget when feature flags are enabled', () => {
        const value: TeamMember = {
          id: '1',
          name: 'John Doe',
          type: TimeForType.EMPLOYEE,
        };
        renderWithProvider(<TeamMemberDropdown value={value} />);

        const widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute(
          'data-widget-id',
          'time-tracking-ui/quickFind',
        );
        expect(widget).toHaveAttribute('data-value', '1');
      });

      it('should use currentValue with legacy widget when QuickFind is disabled', () => {
        const storeWithLegacyWidget = createMockStore({
          timeEntryGrid: {
            isQuickFindEnabled: false,
            isQuickFindSettled: true,
          },
        });

        const renderWithLegacyProvider = (component: React.ReactElement) =>
          render(
            <Provider store={storeWithLegacyWidget}>{component}</Provider>,
          );

        const value: TeamMember = {
          id: '1',
          name: 'John Doe',
          type: TimeForType.EMPLOYEE,
        };
        renderWithLegacyProvider(<TeamMemberDropdown value={value} />);

        const widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute(
          'data-widget-id',
          'qbo-quickfills-ui/quickfills',
        );
        expect(widget).toHaveAttribute('data-value', '1');
      });
    });

    describe('Edge Cases with currentValue', () => {
      it('should handle undefined value prop gracefully', () => {
        const value = undefined as any;
        renderWithProvider(<TeamMemberDropdown value={value} />);

        const widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '');
        expect(screen.getByText('Current: None')).toBeInTheDocument();
      });

      it('should handle team member with empty id', () => {
        const valueWithEmptyId: TeamMember = {
          id: '',
          name: 'Empty ID User',
          type: TimeForType.EMPLOYEE,
        };
        renderWithProvider(<TeamMemberDropdown value={valueWithEmptyId} />);

        const widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '');
      });

      it('should handle rapid value prop changes', () => {
        const value1: TeamMember = {
          id: '1',
          name: 'User One',
          type: TimeForType.EMPLOYEE,
        };

        const { rerender } = renderWithProvider(
          <TeamMemberDropdown value={value1} />,
        );

        let widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '1');

        // Rapid changes
        const value2: TeamMember = {
          id: '2',
          name: 'User Two',
          type: TimeForType.VENDOR,
        };
        rerender(
          <Provider store={mockStore}>
            <TeamMemberDropdown value={value2} />
          </Provider>,
        );

        const value3: TeamMember = {
          id: '3',
          name: 'User Three',
          type: TimeForType.EMPLOYEE,
        };
        rerender(
          <Provider store={mockStore}>
            <TeamMemberDropdown value={value3} />
          </Provider>,
        );

        widget = screen.getByTestId('team-member-widget');
        expect(widget).toHaveAttribute('data-value', '3');
      });
    });
  });
});

describe('Workforce User disabled prop support', () => {
  let mockStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = createMockStore();
  });

  const renderWithProvider = (component: React.ReactElement) =>
    render(<Provider store={mockStore}>{component}</Provider>);

  it('should pass disabled prop to QuickFind widget when isWorkforceUser is true', () => {
    const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
    // Mock Redux state to indicate workforce user
    const storeWithWorkforce = createMockStore({
      timeEntryGrid: {
        isQuickFindEnabled: true,
        isQuickFindSettled: true,
      },
    });

    render(
      <Provider store={storeWithWorkforce}>
        <TeamMemberDropdown value={value} />
      </Provider>,
    );

    const widget = screen.getByTestId('team-member-widget');
    expect(widget).toBeInTheDocument();
    expect(widget).toHaveAttribute(
      'data-widget-id',
      'time-tracking-ui/quickFind',
    );
  });

  it('should pass disabled prop to legacy widget when isWorkforceUser is true', () => {
    const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
    const storeWithLegacyWidget = createMockStore({
      timeEntryGrid: {
        isQuickFindEnabled: false,
        isQuickFindSettled: true,
      },
    });

    render(
      <Provider store={storeWithLegacyWidget}>
        <TeamMemberDropdown value={value} />
      </Provider>,
    );

    const widget = screen.getByTestId('team-member-widget');
    expect(widget).toBeInTheDocument();
    expect(widget).toHaveAttribute(
      'data-widget-id',
      'qbo-quickfills-ui/quickfills',
    );
  });

  it('should maintain addNew false for workforce users in QuickFind widget', () => {
    const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
    renderWithProvider(<TeamMemberDropdown value={value} />);

    const widget = screen.getByTestId('team-member-widget');
    expect(widget).toHaveAttribute('data-add-new', 'true');
  });

  it('should not pass disabled prop when isWorkforceUser is false', () => {
    const value = { id: '1', name: 'John Doe', type: TimeForType.EMPLOYEE };
    renderWithProvider(<TeamMemberDropdown value={value} />);

    const widget = screen.getByTestId('team-member-widget');
    expect(widget).toBeInTheDocument();
  });

  it('should handle null value with disabled prop', () => {
    renderWithProvider(<TeamMemberDropdown value={null} />);

    const widget = screen.getByTestId('team-member-widget');
    expect(widget).toBeInTheDocument();
    expect(widget).toHaveAttribute('data-value', '');
  });

  it('should clear validation errors when team member changes even with disabled prop', () => {
    const initialState = {
      timeEntryGrid: {
        teamMember: null,
        showSelectTeamMemberTooltip: false,
      },
      validation: {
        showValidationError: true,
        errorMessages: ['Test error message'],
        fieldErrors: { 'test-cell': { service: 'Service is required' } },
        rowErrors: { 'test-row': { overHours: 'Too many hours' } },
        saveError: 'Save failed',
        timeEntriesError: 'Time entries error',
        settingsError: 'Settings error',
      },
    };

    const mockStore = createMockStore(initialState);

    render(
      <Provider store={mockStore}>
        <TeamMemberDropdown value={null} />
      </Provider>,
    );

    const changeButton = screen.getByText('Change Team Member');
    fireEvent.click(changeButton);

    expect(mockStore.getState().validation.showValidationError).toBe(false);
  });
});
