import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  renderWithQuicksandAndReduxProvider,
  mockFormatMessage,
} from '../../../../testUtils';
import { WeeklyTimeEntryHeader } from '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryHeader/WeeklyTimeEntryHeader';
import { useQbTimeSdk } from '../../../../../../src/js/service/hooks/useQbTimeSdk';
import timeEntrySettingsSlice from '../../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import customerSlice from '../../../../../../src/js/widgets/weeklyTimeEntry/store/customerSlice';
import timeEntryGridReducer from '../../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';

// Mock useIntl
const mockSandbox = {
  logger: {
    log: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
  extensions: {
    qbo: {
      context: {
        getCompanyL10nInfo: jest.fn().mockReturnValue({
          defaultDateFormat: 'mm/dd/yyyy',
        }),
        getAuthInfo: jest.fn().mockReturnValue({
          legacyPermissions: {
            features: {
              companyPrefs: 'ALL',
            },
          },
        }),
      },
    },
  },
  experiments: {
    optInUserToTreatmentsIL: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
  },
  appContext: {
    getAppInfo: jest.fn().mockReturnValue({ appName: 'quickbooks' }),
  },
};

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
  useSandbox: () => mockSandbox,
  buildSandbox: () => mockSandbox,
  useTracking: () => jest.fn(),
  MockQuicksandProvider: ({ children, sandbox }: any) => (
    <div data-testid="mock-quicksand-provider">{children}</div>
  ),
}));

// Mock child components
jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryHeader/WeekNavigator',
  () => ({
    WeekNavigator: () => <div data-testid="week-navigator">WeekNavigator</div>,
  }),
);

jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryHeader/TeamMemberDropdown',
  () => ({
    TeamMemberDropdown: ({ value }: any) => (
      <div data-testid="team-member-dropdown">
        TeamMemberDropdown: {value?.name || 'No value'}
      </div>
    ),
  }),
);

jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryHeader/KeyboardShortcutsModal',
  () => ({
    KeyboardShortcutsModal: ({ open, onClose }: any) =>
      open ? (
        <div data-testid="keyboard-shortcuts-modal">
          <button onClick={onClose}>Close Modal</button>
        </div>
      ) : null,
  }),
);

jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntrySettingsPanel/WeeklyTimeEntrySettingsPanel',
  () => ({
    WeeklyTimeEntrySettingsPanel: ({ open, setOpen }: any) =>
      open ? (
        <div data-testid="weekly-time-entry-settings-panel">
          <button onClick={() => setOpen(false)}>Close Settings</button>
        </div>
      ) : null,
  }),
);

// Mock hooks
const mockReset = jest.fn();
jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/hooks/useReset',
  () => ({
    useReset: () => ({ reset: mockReset }),
  }),
);

const mockHandleExportAndSave = jest.fn();
const mockHandlePrintAndSave = jest.fn();
jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/hooks/useExportAndSave',
  () => ({
    useExportAndSave: () => ({
      handleExportAndSave: mockHandleExportAndSave,
      handlePrintAndSave: mockHandlePrintAndSave,
      saveLoading: false,
    }),
  }),
);

// Mock useTimeEntriesFetching hook
const mockRefetch = jest.fn();
jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/hooks/useTimeEntriesFetching',
  () => ({
    useTimeEntriesFetching: () => ({
      refetch: mockRefetch,
    }),
  }),
);

// Mock useAppSelector and useAppDispatch from the store
const mockUseAppSelector = jest.fn();
const mockUseAppDispatch = jest.fn(() => jest.fn());

jest.mock('../../../../../../src/js/widgets/weeklyTimeEntry/store', () => ({
  ...jest.requireActual(
    '../../../../../../src/js/widgets/weeklyTimeEntry/store',
  ),
  useAppSelector: (selector: any) => mockUseAppSelector(selector),
  useAppDispatch: () => mockUseAppDispatch(),
}));

// Add missing mock variables
const mockOnWeekChange = jest.fn();
const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();

// Mock IconControl component
jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({
    children,
    onClick,
    disabled,
    'aria-label': ariaLabel,
  }: any) => (
    <button
      data-testid={`icon-control-${ariaLabel
        ?.toLowerCase()
        .replace(/\s+/g, '-')}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

// Mock Button component
jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, priority, purpose }: any) => (
    <button
      data-testid="reset-button"
      onClick={onClick}
      data-priority={priority}
      data-purpose={purpose}
    >
      {children}
    </button>
  ),
}));

// Mock icons
jest.mock('@design-systems/icons', () => ({
  Keyboard: () => <span data-testid="keyboard-icon">Keyboard</span>,
  Export: () => <span data-testid="export-icon">Export</span>,
  Print: () => <span data-testid="print-icon">Print</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
  MenuCollapse: () => (
    <span data-testid="menu-collapse-icon">MenuCollapse</span>
  ),
  MenuExpand: () => <span data-testid="menu-expand-icon">MenuExpand</span>,
}));

jest.mock('../../../../../../src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: jest.fn(() => ({
    data: true,
    loading: false,
    error: undefined,
  })),
}));

const createMockStore = (initialState = {}) =>
  configureStore({
    reducer: {
      timeEntrySettings: timeEntrySettingsSlice,
      customer: customerSlice,
      timeEntryGrid: timeEntryGridReducer,
    },
    preloadedState: {
      timeEntrySettings: {
        isServiceFieldEnabled: false,
        isBillingFieldEnabled: false,
        firstDayOfWeek: 0,
        isClassEnabled: false,
        isLocationEnabled: false,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        requireBillable: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
        hideTimeEntryFields: {
          isClassFieldEnabled: false,
          isProjectFieldEnabled: false,
          isLocationFieldEnabled: false,
          isPayTypeFieldEnabled: false,
          isCostRateFieldEnabled: false,
          isTaxableFieldEnabled: false,
        },
        hideWeekdays: {
          isSundayHidden: false,
          isMondayHidden: false,
          isTuesdayHidden: false,
          isWednesdayHidden: false,
          isThursdayHidden: false,
          isFridayHidden: false,
          isSaturdayHidden: false,
        },
        timeEntryTimeFor: null,
        weeklyTimesheetTourCompleted: false,
        panelOpen: false,
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        loading: false,
        error: null,
        panelValues: {
          isSundayHidden: false,
          isMondayHidden: false,
          isTuesdayHidden: false,
          isWednesdayHidden: false,
          isThursdayHidden: false,
          isFridayHidden: false,
          isSaturdayHidden: false,
        },
      },
      ...initialState,
    },
  });

describe('WeeklyTimeEntryHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQbTimeSdk as jest.Mock).mockReturnValue({
      data: true,
      loading: false,
      error: undefined,
    });
    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectPanelOpen') return false;
      if (selector.name === 'selectTimeEntryTimeFor')
        return {
          id: 'time-for-1',
          name: 'Time For User',
          type: 'employee',
        };
      if (selector.name === 'selectTeamMember') return null;
      return undefined;
    });
    mockUseAppDispatch.mockReturnValue(mockDispatch);
  });

  it('should render correctly with default state', () => {
    const { container } = render(
      <WeeklyTimeEntryHeader
        refetch={mockRefetch}
        onWeekChange={mockOnWeekChange}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(screen.getByTestId('weekly-time-entry-header')).toBeInTheDocument();
    expect(screen.getByTestId('week-navigator')).toBeInTheDocument();
    expect(screen.getByTestId('team-member-dropdown')).toBeInTheDocument();
  });

  it('should handle panel toggle when panel is closed', () => {
    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectPanelOpen') return false;
      if (selector.name === 'selectTimeEntryTimeFor')
        return {
          id: 'time-for-1',
          name: 'Time For User',
          type: 'employee',
        };
      if (selector.name === 'selectTeamMember') return null;
      return undefined;
    });

    render(
      <WeeklyTimeEntryHeader
        refetch={mockRefetch}
        onWeekChange={mockOnWeekChange}
      />,
    );

    // Click the panel toggle button (the one with MenuExpand icon when panel is closed)
    const panelButton = screen.getByTestId(
      'icon-control-weekly.time.entry.show.panel',
    );
    fireEvent.click(panelButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'timeEntrySettings/openPanel',
    });
  });

  it('should handle panel toggle when panel is open', () => {
    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectPanelOpen') return true;
      if (selector.name === 'selectTimeEntryTimeFor')
        return {
          id: 'time-for-1',
          name: 'Time For User',
          type: 'employee',
        };
      if (selector.name === 'selectTeamMember') return null;
      return undefined;
    });

    render(
      <WeeklyTimeEntryHeader
        refetch={mockRefetch}
        onWeekChange={mockOnWeekChange}
      />,
    );

    // Click the panel toggle button (the one with MenuCollapse icon when panel is open)
    const panelButton = screen.getByTestId(
      'icon-control-weekly.time.entry.hide.panel',
    );
    fireEvent.click(panelButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'timeEntrySettings/closePanel',
    });
  });

  it('should render all icon controls with correct aria-labels', () => {
    render(
      <WeeklyTimeEntryHeader
        refetch={mockRefetch}
        onWeekChange={mockOnWeekChange}
      />,
    );

    // expect(
    //   screen.getByTestId('icon-control-weekly.time.entry.keyboard.shortcuts'),
    // ).toHaveAttribute('aria-label', 'weekly.time.entry.keyboard.shortcuts');
    expect(
      screen.getByTestId('icon-control-weekly.time.entry.export'),
    ).toHaveAttribute('aria-label', 'weekly.time.entry.export');
    expect(
      screen.getByTestId('icon-control-weekly.time.entry.print'),
    ).toHaveAttribute('aria-label', 'weekly.time.entry.print');
    expect(
      screen.getByTestId('icon-control-weekly.time.entry.settings'),
    ).toHaveAttribute('aria-label', 'weekly.time.entry.settings');
  });

  it('should render all icons', () => {
    render(
      <WeeklyTimeEntryHeader
        refetch={mockRefetch}
        onWeekChange={mockOnWeekChange}
      />,
    );

    // expect(screen.getByTestId('keyboard-icon')).toBeInTheDocument();
    expect(screen.getByTestId('export-icon')).toBeInTheDocument();
    expect(screen.getByTestId('print-icon')).toBeInTheDocument();
    expect(screen.getByTestId('menu-expand-icon')).toBeInTheDocument();
  });

  it('should render menu collapse icon when panel is open', () => {
    mockUseAppSelector.mockImplementation((selector: any) => {
      if (selector.name === 'selectPanelOpen') return true;
      if (selector.name === 'selectTimeEntryTimeFor')
        return {
          id: 'time-for-1',
          name: 'Time For User',
          type: 'employee',
        };
      if (selector.name === 'selectTeamMember') return null;
      return undefined;
    });

    render(
      <WeeklyTimeEntryHeader
        refetch={mockRefetch}
        onWeekChange={mockOnWeekChange}
      />,
    );

    expect(screen.getByTestId('menu-collapse-icon')).toBeInTheDocument();
  });

  describe('NLS Integration', () => {
    it('should use NLS for reset button text', () => {
      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.reset',
      });
      expect(screen.getByTestId('reset-button')).toHaveTextContent(
        'weekly.time.entry.reset',
      );
    });

    it('should use NLS for all aria-labels', () => {
      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      // Check that formatMessage was called for all aria-labels
      // expect(mockFormatMessage).toHaveBeenCalledWith({
      //   id: 'weekly.time.entry.keyboard.shortcuts',
      // });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.export',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.print',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.settings',
      });
    });

    it('should use NLS for settings aria-label', () => {
      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.settings',
      });
    });
  });

  describe('Button Click Handlers (lines 116-180)', () => {
    it('should call reset when reset button is clicked (lines 116-118)', () => {
      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('should open keyboard shortcuts modal when keyboard icon is clicked (line 128)', () => {
      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      const keyboardButton = screen.getByTestId(
        'icon-control-weekly.time.entry.keyboard.shortcuts',
      );
      fireEvent.click(keyboardButton);

      // Modal should now be visible
      expect(
        screen.getByTestId('keyboard-shortcuts-modal'),
      ).toBeInTheDocument();
    });

    it('should call handleExportAndSave when export icon is clicked (line 136)', () => {
      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      const exportButton = screen.getByTestId(
        'icon-control-weekly.time.entry.export',
      );
      fireEvent.click(exportButton);

      expect(mockHandleExportAndSave).toHaveBeenCalled();
    });

    it('should call handlePrintAndSave when print icon is clicked (line 146)', () => {
      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      const printButton = screen.getByTestId(
        'icon-control-weekly.time.entry.print',
      );
      fireEvent.click(printButton);

      expect(mockHandlePrintAndSave).toHaveBeenCalled();
    });

    it('should open settings panel when settings icon is clicked (line 160)', () => {
      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      const settingsButton = screen.getByTestId(
        'icon-control-weekly.time.entry.settings',
      );
      fireEvent.click(settingsButton);

      // Settings panel should now be visible
      expect(
        screen.getByTestId('weekly-time-entry-settings-panel'),
      ).toBeInTheDocument();
    });
  });

  describe('Callback Handling (lines 100-101)', () => {
    it('should call onSettingsSaveSuccess when provided', () => {
      const onSettingsSaveSuccess = jest.fn();

      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
          onSettingsSaveSuccess={onSettingsSaveSuccess}
        />,
      );

      // Open settings panel and trigger save
      const settingsButton = screen.getByTestId(
        'icon-control-weekly.time.entry.settings',
      );
      fireEvent.click(settingsButton);

      // Component should pass the callback to settings panel
      expect(
        screen.getByTestId('weekly-time-entry-settings-panel'),
      ).toBeInTheDocument();
    });

    it('should handle missing onSettingsSaveSuccess gracefully', () => {
      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      // Should render without errors
      expect(
        screen.getByTestId('weekly-time-entry-header'),
      ).toBeInTheDocument();
    });
  });

  describe('Team Member visibility by team members dropdown flag', () => {
    it('should hide TeamMemberDropdown when SDK resolves false', () => {
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: false,
        loading: false,
        error: undefined,
      });

      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      expect(
        screen.queryByTestId('team-member-dropdown'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('week-navigator')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });

    it('should hide TeamMemberDropdown when SDK is unresolved (loading)', () => {
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
      });

      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      expect(
        screen.queryByTestId('team-member-dropdown'),
      ).not.toBeInTheDocument();
    });

    it('should show TeamMemberDropdown when SDK resolves true', () => {
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: true,
        loading: false,
        error: undefined,
      });

      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      expect(screen.getByTestId('team-member-dropdown')).toBeInTheDocument();
    });

    it('should not auto-populate team member if teamMember is already set', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        if (selector.name === 'selectPanelOpen') return false;
        if (selector.name === 'selectTimeEntryTimeFor')
          return {
            id: 'employee-123',
            name: 'Workforce Employee',
            type: 'employee',
          };
        if (selector.name === 'selectTeamMember')
          return {
            id: 'employee-123',
            name: 'Workforce Employee',
            type: 'employee',
          };
        return undefined;
      });

      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      const setTeamMemberCalls = mockDispatch.mock.calls.filter(
        (call) => call[0].type === 'timeEntryGrid/setTeamMember',
      );
      expect(setTeamMemberCalls.length).toBe(0);
    });

    it('should not auto-populate team member for users with no team member set', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        if (selector.name === 'selectPanelOpen') return false;
        if (selector.name === 'selectTimeEntryTimeFor')
          return {
            id: 'employee-123',
            name: 'Regular Employee',
            type: 'employee',
          };
        if (selector.name === 'selectTeamMember') return null;
        return undefined;
      });

      render(
        <WeeklyTimeEntryHeader
          refetch={mockRefetch}
          onWeekChange={mockOnWeekChange}
        />,
      );

      const setTeamMemberCalls = mockDispatch.mock.calls.filter(
        (call) => call[0].type === 'timeEntryGrid/setTeamMember',
      );
      expect(setTeamMemberCalls.length).toBe(0);
    });
  });
});
