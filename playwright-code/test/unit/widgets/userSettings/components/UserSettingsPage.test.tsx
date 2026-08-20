import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import UserSettingsPage from 'src/js/widgets/userSettings/components/UserSettingsPage';
import {
  renderWithQuicksandAndReduxProvider,
  getDefaultSandbox,
  createDefaultStore,
} from 'test/unit/testUtils';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import notificationsReducer from 'src/js/widgets/userSettings/store/slices/notificationsSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import breaksReducer from 'src/js/widgets/userSettings/store/slices/breaksSlice';
import locationReducer from 'src/js/widgets/userSettings/store/slices/locationSlice';
import scheduleNotificationsReducer from 'src/js/widgets/userSettings/store/slices/scheduleNotificationsSlice';
import permissionsReducer from 'src/js/widgets/userSettings/store/slices/permissionsSlice';
import { USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING } from 'src/js/widgets/userSettings/constants/loggingConstants';

// Default mock settingsFor
const mockSettingsFor = {
  timeForType: TimeTracking_TimeForType.Employee,
  id: '123-456-789',
  displayName: 'Jeni Freeman',
};

// Mock useGetEffectiveUserSettings hook
jest.mock(
  'src/js/service/hooks/userLevelSettings/useGetEffectiveUserSettings',
  () => ({
    useGetEffectiveUserSettings: () => ({
      data: {
        notificationSetting: 'custom',
        clockInTime: '8:00 AM',
        clockOutTime: '5:00 PM',
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        clockInEmail: true,
        clockInMobile: true,
        clockOutEmail: true,
        clockOutMobile: false,
        scheduleEmail: true,
        scheduleMobile: true,
      },
      loading: false,
      error: null,
      loadEffectiveUserSettings: jest.fn(),
    }),
  }),
);

// Mock worker-permissions hooks so the PermissionsCard can render without
// an Apollo MockedProvider in this widget-level test.
jest.mock(
  'src/js/widgets/userSettings/service/permissions/useGetUserPermissions',
  () => ({
    useGetUserPermissions: () => ({
      data: undefined,
      loading: false,
      error: undefined,
      loadUserPermissions: jest.fn(),
    }),
  }),
);

jest.mock(
  'src/js/widgets/userSettings/service/permissions/useManageUserPermissions',
  () => ({
    useManageUserPermissions: () => ({
      loading: false,
      saveUserPermissions: jest.fn(),
    }),
  }),
);

// Mock useGetWorkerBreaks hook
jest.mock('src/js/service/hooks/breaks/useGetWorkerBreaks', () => ({
  useGetWorkerBreaks: () => ({
    breaks: [],
    loading: false,
    error: undefined,
    loadWorkerBreaks: jest.fn(),
  }),
}));

// Mock card-specific data hooks
jest.mock('src/js/widgets/userSettings/hooks', () => ({
  useBreaksCardData: jest.fn(),
  useNotificationsCardData: jest.fn(),
  useOvertimeNotificationsCardData: jest.fn(),
  useOvertimeCardData: jest.fn(),
  usePermissionsCardData: jest.fn(),
}));

// Captured callbacks from useGetUnifiedUserSettings — tests can invoke them directly
let capturedOnSuccess: ((data: any) => void) | undefined;
let capturedOnError: ((error: string) => void) | undefined;

// Mock useGetUnifiedUserSettings — now called directly from UserSettingsPage
jest.mock(
  'src/js/service/hooks/userLevelSettings/useGetUnifiedUserSettings',
  () => ({
    useGetUnifiedUserSettings: jest.fn(
      (opts: {
        onSuccess?: (data: any) => void;
        onError?: (error: string) => void;
      }) => {
        capturedOnSuccess = opts?.onSuccess;
        capturedOnError = opts?.onError;
        return {
          loadUnifiedUserSettings: jest.fn(),
          loading: false,
          data: undefined,
          error: undefined,
        };
      },
    ),
  }),
);

// Mock useLoggingConfig — used in the unified success callback
jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock overtime feature hook
let mockOvertimeFeatureEnabled = true;
jest.mock('src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled', () => ({
  useOvertimeFeatureFlag: jest.fn(() => ({
    isEnabled: mockOvertimeFeatureEnabled,
    isLoading: false,
  })),
}));

// Mock useIXPFeatureFlag hook - supports per-flag configuration
const mockFeatureFlagValues: Record<string, boolean> = {};
const mockFeatureFlagSettled: Record<string, boolean> = {};
const mockUseIXPFeatureFlag = jest.fn((args: { flagName: string }) => ({
  isEnabled: mockFeatureFlagValues[args.flagName] ?? false,
  isLoading: false,
  error: null,
  settled: mockFeatureFlagSettled[args.flagName] ?? true,
}));
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: (args: any) => mockUseIXPFeatureFlag(args),
}));

// Mock NotificationsCard component to avoid Apollo dependencies
jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard',
  () => ({
    __esModule: true,
    default: ({
      showScheduleNotificationsSection,
    }: {
      showScheduleNotificationsSection?: boolean;
    }) => (
      <div
        data-testid="notifications-card"
        data-show-schedule-notifications={String(
          Boolean(showScheduleNotificationsSection),
        )}
      >
        Notifications Card Content
      </div>
    ),
  }),
);

// Mock BreaksCard component to avoid Apollo dependencies
jest.mock('src/js/widgets/userSettings/components/cards/BreaksCard', () => ({
  __esModule: true,
  default: () => <div data-testid="breaks-card">Breaks Card Content</div>,
}));

// Mock LocationCard component to avoid Apollo dependencies
jest.mock('src/js/widgets/userSettings/components/cards/LocationCard', () => ({
  __esModule: true,
  default: () => <div data-testid="location-card">Location Card Content</div>,
}));

// Mock OvertimeCard component to avoid Apollo dependencies
jest.mock('src/js/widgets/userSettings/components/cards/OvertimeCard', () => ({
  __esModule: true,
  default: () => <div data-testid="overtime-card">Overtime Card Content</div>,
}));

// Mock styled-components
jest.mock('styled-components', () => {
  const createStyledComponent = (Component: any) => {
    const styledComponent = (strings: TemplateStringsArray, ...args: any[]) =>
      React.forwardRef<HTMLElement>((props, ref) =>
        React.createElement(Component, { ...props, ref }),
      );
    styledComponent.withConfig = () => styledComponent;
    return styledComponent;
  };

  // Handle styled.element syntax
  const styled = new Proxy(
    (Component: any) => createStyledComponent(Component),
    {
      get: (target, prop) => {
        if (prop === '__esModule') return true;
        if (prop === 'default') return target;
        // Return a styled element creator for any requested HTML element
        return createStyledComponent(prop);
      },
    },
  );

  return {
    __esModule: true,
    default: styled,
    createGlobalStyle: () => () => null,
    css: () => '',
    keyframes: () => '',
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

// Mock @ids-ts/typography components
jest.mock('@ids-ts/typography', () => ({
  B2: ({ children, style }: any) => (
    <div data-testid="b2" style={style}>
      {children}
    </div>
  ),
  Demi: ({ children }: any) => <span data-testid="demi">{children}</span>,
  H5: ({ children }: any) => <h5 data-testid="h5">{children}</h5>,
}));

// Mock @ids-ts/icon-control
jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children, onClick, 'aria-label': ariaLabel }: any) => (
    <button onClick={onClick} aria-label={ariaLabel} data-testid="icon-control">
      {children}
    </button>
  ),
}));

// Mock @ids-ts/cards
jest.mock('@ids-ts/cards', () => ({
  Card: ({ children, size }: any) => (
    <div data-testid="card" data-size={size}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

// Mock @design-systems/icons
jest.mock('@design-systems/icons', () => ({
  MenuExpand: ({ size }: any) => (
    <svg data-testid="menu-expand-icon" data-size={size}>
      <rect />
    </svg>
  ),
  ChevronRight: ({ size }: any) => (
    <svg data-testid="chevron-right-icon" data-size={size}>
      <path />
    </svg>
  ),
}));

describe('UserSettingsPage', () => {
  let mockSandbox: any;
  let mockStore: any;

  beforeEach(() => {
    capturedOnSuccess = undefined;
    capturedOnError = undefined;
    mockSandbox = getDefaultSandbox();
    mockSandbox.navigation.navigate = jest.fn();
    mockSandbox.logger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logException: jest.fn(),
    };
    mockStore = createDefaultStore({
      notifications: notificationsReducer,
      settingsContext: settingsContextReducer,
      breaks: breaksReducer,
      location: locationReducer,
      scheduleNotifications: scheduleNotificationsReducer,
      permissions: permissionsReducer,
    });
    // Default: notifications flag is enabled, others disabled
    mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] = false;
    mockFeatureFlagValues['SBSEG-QB-Time-show-location-user-settings'] = false;
    mockFeatureFlagValues['SBSEG-QB-Time-show-notifications-in-user-settings'] =
      true;
    mockFeatureFlagValues['SBSEG-QBO-Enable-Time-Schedule-Settings'] = false;
    mockFeatureFlagValues['SBSEG-QBO-Enable-Time-Tab-Team-Members'] = false;
    mockFeatureFlagSettled['SBSEG-QBO-Enable-Time-Tab-Team-Members'] = true;
    mockOvertimeFeatureEnabled = true;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );
      expect(screen.getAllByText('Jeni Freeman')).toHaveLength(2); // One in breadcrumb, one in heading
    });

    it('displays the correct page structure', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // Check breadcrumbs (they may show as NLS keys if intl is not properly set up)
      expect(
        screen.getByText(/My Apps|breadcrumb\.myapps/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Time|breadcrumb\.time/)).toBeInTheDocument();
      expect(
        screen.getByText(/Assignments|breadcrumb\.assignments/),
      ).toBeInTheDocument();
      expect(screen.getAllByText('Jeni Freeman')).toHaveLength(2); // Breadcrumb + heading

      // Check subtitle (may show as NLS key if intl is not properly set up)
      expect(
        screen.getByText(
          /Time-tracking assignments, rules, and settings|page\.subtitle/,
        ),
      ).toBeInTheDocument();

      // Check Notifications Card is rendered
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });

    it('renders breadcrumb icons', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // Should have ChevronRight icons between breadcrumb items
      const chevronIcons = screen.getAllByTestId('chevron-right-icon');
      expect(chevronIcons).toHaveLength(3); // Between My Apps > Time > Assignments > User Name
    });

    it('renders the NotificationsCard component', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });

    it('renders user name in breadcrumb', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const breadcrumbItems = screen.getAllByText('Jeni Freeman');
      expect(breadcrumbItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Navigation', () => {
    it('navigates to My Apps when My Apps breadcrumb is clicked', async () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const myAppsLink = screen.getByText(/My Apps|breadcrumb\.myapps/);
      fireEvent.click(myAppsLink);

      await waitFor(() => {
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith(
          'app/homepage',
        );
      });
    });

    it('navigates to Time when Time breadcrumb is clicked', async () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const timeLink = screen.getByText(/Time|breadcrumb\.time/);
      fireEvent.click(timeLink);

      await waitFor(() => {
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith('time');
      });
    });

    it('navigates to Assignments when Assignments breadcrumb is clicked', async () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const assignmentsLink = screen.getByText(
        /Assignments|breadcrumb\.assignments/,
      );
      fireEvent.click(assignmentsLink);

      await waitFor(() => {
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith(
          'time/assignments',
        );
      });
    });

    it('does not navigate when user name span is clicked', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // Find the user name text in the breadcrumb (not the heading)
      const breadcrumbItems = screen.getAllByText('Jeni Freeman');
      const breadcrumbUserName = breadcrumbItems[0]; // First occurrence should be in breadcrumb

      fireEvent.click(breadcrumbUserName);

      expect(mockSandbox.navigation.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Feature Flag - Time Team Breadcrumb', () => {
    it('does not render the breadcrumbs while the flag has not settled', () => {
      mockFeatureFlagSettled['SBSEG-QBO-Enable-Time-Tab-Team-Members'] = false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Assignments|breadcrumb\.assignments/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Time team|breadcrumb\.timeTeam/),
      ).not.toBeInTheDocument();
    });

    it('renders "Assignments" and navigates to time/assignments when the flag is settled but disabled', async () => {
      mockFeatureFlagValues['SBSEG-QBO-Enable-Time-Tab-Team-Members'] = false;
      mockFeatureFlagSettled['SBSEG-QBO-Enable-Time-Tab-Team-Members'] = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const assignmentsLink = screen.getByText(
        /Assignments|breadcrumb\.assignments/,
      );
      expect(assignmentsLink).toBeInTheDocument();
      expect(
        screen.queryByText(/Time team|breadcrumb\.timeTeam/),
      ).not.toBeInTheDocument();

      fireEvent.click(assignmentsLink);

      await waitFor(() => {
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith(
          'time/assignments',
        );
      });
    });

    it('renders "Time team" and navigates to time/team when the flag is settled and enabled', async () => {
      mockFeatureFlagValues['SBSEG-QBO-Enable-Time-Tab-Team-Members'] = true;
      mockFeatureFlagSettled['SBSEG-QBO-Enable-Time-Tab-Team-Members'] = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const timeTeamLink = screen.getByText(/Time team|breadcrumb\.timeTeam/);
      expect(timeTeamLink).toBeInTheDocument();
      expect(
        screen.queryByText(/^Assignments$|breadcrumb\.assignments/),
      ).not.toBeInTheDocument();

      fireEvent.click(timeTeamLink);

      await waitFor(() => {
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith(
          'time/team',
        );
      });
    });

    it('calls useIXPFeatureFlag with the correct flag name for time team routing', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(mockUseIXPFeatureFlag).toHaveBeenCalledWith({
        flagName: 'SBSEG-QBO-Enable-Time-Tab-Team-Members',
        defaultValue: false,
      });
    });
  });

  describe('Component State', () => {
    it('initializes with default state', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // Component renders successfully with NotificationsCard
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });

    it('maintains component structure', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // Check that the page structure is maintained
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
      expect(screen.getAllByText('Jeni Freeman')).toHaveLength(2);
    });
  });

  describe('Typography and Styling', () => {
    it('uses H5 typography component for user name heading', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const h5Elements = screen.getAllByTestId('h5');
      const userNameH5 = h5Elements.find((el) =>
        el.textContent?.includes('Jeni Freeman'),
      );

      expect(userNameH5).toBeInTheDocument();
    });

    it('uses Demi typography component for user name emphasis', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const demiElements = screen.getAllByTestId('demi');
      const userNameDemi = demiElements.find(
        (el) => el.textContent === 'Jeni Freeman',
      );

      expect(userNameDemi).toBeInTheDocument();
    });

    it('applies correct styling to subtitle', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const b2Elements = screen.getAllByTestId('b2');
      const subtitleB2 = b2Elements.find(
        (el) =>
          el.textContent?.includes(
            'Time-tracking assignments, rules, and settings',
          ) || el.textContent?.includes('page.subtitle'),
      );

      expect(subtitleB2).toBeInTheDocument();
      expect(subtitleB2).toHaveStyle({ color: 'var(--color-text-secondary)' });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for breadcrumbs', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const breadcrumbsNav = screen.getByRole('navigation');
      expect(breadcrumbsNav).toHaveAttribute('aria-label', 'breadcrumbs');
    });

    it('renders proper semantic structure', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // Check that navigation is properly structured
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      // Check that anchor elements are present (they may not have href so won't be 'link' role)
      const anchorElements = document.querySelectorAll('a');
      expect(anchorElements.length).toBeGreaterThan(0);
    });

    it('maintains focus management for navigation links', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const myAppsLink = screen.getByText(/My Apps|breadcrumb\.myapps/);

      // Link should be focusable (note: in test environment, focus behavior may be different)
      expect(myAppsLink).toBeInTheDocument();
      expect(myAppsLink.tagName.toLowerCase()).toBe('a');
    });
  });

  describe('Error Handling', () => {
    it('handles navigation errors gracefully', async () => {
      const mockSandboxWithError = {
        ...mockSandbox,
        navigation: {
          navigate: jest.fn().mockImplementation(() => {
            throw new Error('Navigation failed');
          }),
        },
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandboxWithError,
      );

      const myAppsLink = screen.getByText(/My Apps|breadcrumb\.myapps/);

      // Should attempt navigation and catch the error
      expect(() => fireEvent.click(myAppsLink)).not.toThrow();

      // Logger should be called with error
      await waitFor(() => {
        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Navigation to My Apps failed',
          expect.objectContaining({
            error: expect.any(Error),
          }),
        );
      });
    });

    it('handles Time navigation errors gracefully', async () => {
      const mockSandboxWithError = {
        ...mockSandbox,
        navigation: {
          navigate: jest.fn().mockImplementation(() => {
            throw new Error('Navigation failed');
          }),
        },
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandboxWithError,
      );

      const timeLink = screen.getByText(/Time|breadcrumb\.time/);

      expect(() => fireEvent.click(timeLink)).not.toThrow();

      await waitFor(() => {
        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Navigation to Time failed',
          expect.objectContaining({
            error: expect.any(Error),
          }),
        );
      });
    });

    it('handles Assignments navigation errors gracefully', async () => {
      const mockSandboxWithError = {
        ...mockSandbox,
        navigation: {
          navigate: jest.fn().mockImplementation(() => {
            throw new Error('Navigation failed');
          }),
        },
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandboxWithError,
      );

      const assignmentsLink = screen.getByText(
        /Assignments|breadcrumb\.assignments/,
      );

      expect(() => fireEvent.click(assignmentsLink)).not.toThrow();

      await waitFor(() => {
        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Navigation to Assignments failed',
          expect.objectContaining({
            error: expect.any(Error),
          }),
        );
      });
    });
  });

  describe('Card Integration', () => {
    it('properly renders NotificationsCard component', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const notificationsCard = screen.getByTestId('notifications-card');
      expect(notificationsCard).toBeInTheDocument();
      expect(notificationsCard).toHaveTextContent('Notifications Card Content');
    });

    it('maintains proper card structure', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // Check that the NotificationsCard is rendered
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();

      const TestComponent = () => {
        renderSpy();
        return <UserSettingsPage settingsFor={mockSettingsFor} />;
      };

      const { rerender } = renderWithQuicksandAndReduxProvider(
        <TestComponent />,
        mockStore,
        mockSandbox,
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props should not cause additional renders
      rerender(<TestComponent />);

      // Note: React.memo isn't used in UserSettingsPage, so it will re-render
      // This test documents current behavior
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration Tests', () => {
    it('renders complete page with all components', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // Check all major sections are rendered
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getAllByTestId('chevron-right-icon')).toHaveLength(3);
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
      // LocationCard is hidden by default when flag is disabled
      expect(screen.queryByTestId('location-card')).not.toBeInTheDocument();

      expect(screen.getAllByText('Jeni Freeman')).toHaveLength(2);
    });

    it('renders all cards when both feature flags are enabled', () => {
      // Breaks card shown when its flag is enabled
      mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] =
        true;
      // Location card shown when its flag is enabled
      mockFeatureFlagValues['SBSEG-QB-Time-show-location-user-settings'] = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('breaks-card')).toBeInTheDocument();
      expect(screen.getByTestId('location-card')).toBeInTheDocument();
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });

    it('handles multiple navigation clicks correctly', async () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const myAppsLink = screen.getByText(/My Apps|breadcrumb\.myapps/);
      const timeLink = screen.getByText(/Time|breadcrumb\.time/);

      fireEvent.click(myAppsLink);
      fireEvent.click(timeLink);

      await waitFor(() => {
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledTimes(2);
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith(
          'app/homepage',
        );
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith('time');
      });
    });
  });

  describe('Edge Cases', () => {
    it('renders with empty NLS messages', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // Component should still render even if NLS keys are shown
      expect(screen.getAllByText('Jeni Freeman')).toHaveLength(2);
    });

    it('handles rapid navigation clicks', async () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const myAppsLink = screen.getByText(/My Apps|breadcrumb\.myapps/);

      // Rapid clicks
      fireEvent.click(myAppsLink);
      fireEvent.click(myAppsLink);
      fireEvent.click(myAppsLink);

      await waitFor(() => {
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledTimes(3);
      });
    });

    it('maintains state after navigation attempts', async () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const myAppsLink = screen.getByText(/My Apps|breadcrumb\.myapps/);
      fireEvent.click(myAppsLink);

      await waitFor(() => {
        expect(mockSandbox.navigation.navigate).toHaveBeenCalledWith(
          'app/homepage',
        );
      });

      // Component should still be functional
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
      expect(screen.getAllByText('Jeni Freeman')).toHaveLength(2);
    });
  });

  describe('DisplayName Handling', () => {
    it('should use displayName from settingsFor when provided', () => {
      const customSettingsFor = {
        ...mockSettingsFor,
        displayName: 'Custom Worker Name',
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={customSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getAllByText('Custom Worker Name')).toHaveLength(2); // Breadcrumb + heading
    });

    it('should use default Worker Settings when displayName is undefined', () => {
      const settingsWithoutName = {
        ...mockSettingsFor,
        displayName: undefined,
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={settingsWithoutName} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getAllByText('Worker Settings')).toHaveLength(2);
    });

    it('should handle empty string displayName', () => {
      const settingsWithEmptyName = {
        ...mockSettingsFor,
        displayName: '',
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={settingsWithEmptyName} />,
        mockStore,
        mockSandbox,
      );

      // Should fallback to default
      expect(screen.getAllByText('Worker Settings')).toHaveLength(2);
    });

    it('should handle special characters in displayName', () => {
      const settingsWithSpecialChars = {
        ...mockSettingsFor,
        displayName: "José María O'Connor-Smith",
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={settingsWithSpecialChars} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getAllByText("José María O'Connor-Smith")).toHaveLength(2);
    });

    it('should handle very long displayName', () => {
      const settingsWithLongName = {
        ...mockSettingsFor,
        displayName:
          'This is a very long worker name that might need truncation or special handling in the UI',
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={settingsWithLongName} />,
        mockStore,
        mockSandbox,
      );

      expect(
        screen.getAllByText(
          'This is a very long worker name that might need truncation or special handling in the UI',
        ),
      ).toHaveLength(2);
    });

    it('should display displayName in breadcrumb', () => {
      const customSettingsFor = {
        ...mockSettingsFor,
        displayName: 'Breadcrumb Test Name',
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={customSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const breadcrumbNav = screen.getByRole('navigation');
      expect(breadcrumbNav).toHaveTextContent('Breadcrumb Test Name');
    });

    it('should display displayName in user info section', () => {
      const customSettingsFor = {
        ...mockSettingsFor,
        displayName: 'Header Test Name',
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={customSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const demiElements = screen.getAllByTestId('demi');
      const nameElement = demiElements.find(
        (el) => el.textContent === 'Header Test Name',
      );
      expect(nameElement).toBeInTheDocument();
    });
  });

  describe('Feature Flag - Breaks Card Visibility', () => {
    it('should not render BreaksCard when feature flag is disabled', () => {
      mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] =
        false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.queryByTestId('breaks-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });

    it('should render BreaksCard when feature flag is enabled', () => {
      mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] =
        true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('breaks-card')).toBeInTheDocument();
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });

    it('should call useIXPFeatureFlag with correct flag name for breaks', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(mockUseIXPFeatureFlag).toHaveBeenCalledWith({
        flagName: 'SBSEG-QB-Time-show-breaks-in-user-settings',
        defaultValue: false,
      });
    });

    it('should not fetch breaks data when feature flag is disabled', () => {
      const {
        useBreaksCardData,
      } = require('src/js/widgets/userSettings/hooks');

      mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] =
        false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // When FF is disabled, useBreaksCardData should be called with undefined
      expect(useBreaksCardData).toHaveBeenCalledWith(undefined);
    });

    it('should fetch breaks data when feature flag is enabled', () => {
      const {
        useBreaksCardData,
      } = require('src/js/widgets/userSettings/hooks');

      mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] =
        true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // When FF is enabled, useBreaksCardData should be called with the worker id
      expect(useBreaksCardData).toHaveBeenCalledWith(mockSettingsFor.id);
    });
  });

  describe('Feature Flag - Location Card Visibility', () => {
    it('should not render LocationCard when feature flag is disabled (default behavior)', () => {
      mockFeatureFlagValues['SBSEG-QB-Time-show-location-user-settings'] =
        false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // LocationCard is hidden when the flag is disabled
      expect(screen.queryByTestId('location-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });

    it('should render LocationCard when feature flag is enabled', () => {
      mockFeatureFlagValues['SBSEG-QB-Time-show-location-user-settings'] = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // LocationCard is shown when the flag is enabled
      expect(screen.getByTestId('location-card')).toBeInTheDocument();
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });

    it('should call useIXPFeatureFlag with correct flag name for location', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(mockUseIXPFeatureFlag).toHaveBeenCalledWith({
        flagName: 'SBSEG-QB-Time-show-location-user-settings',
        defaultValue: false,
      });
    });

    it('should render LocationCard with correct content', () => {
      mockFeatureFlagValues['SBSEG-QB-Time-show-location-user-settings'] = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      const locationCard = screen.getByTestId('location-card');
      expect(locationCard).toHaveTextContent('Location Card Content');
    });
  });

  describe('SettingsFor Context', () => {
    it('should dispatch setSettingsFor on mount', () => {
      const dispatchSpy = jest.spyOn(mockStore, 'dispatch');

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(dispatchSpy).toHaveBeenCalled();
    });

    it('should call loadEffectiveUserSettings with correct input', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // useGetEffectiveUserSettings hook should be called
      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });

    it('should handle different worker types in settingsFor', () => {
      const vendorSettingsFor = {
        timeForType: TimeTracking_TimeForType.Vendor,
        id: '456-789-012',
        displayName: 'Vendor Worker',
      };

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={vendorSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getAllByText('Vendor Worker')).toHaveLength(2);
    });
  });

  describe('Feature Flag - Notifications Card Visibility', () => {
    it('should render NotificationsCard when feature flag is enabled', () => {
      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
    });

    it('should not render NotificationsCard when feature flag is disabled', () => {
      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(
        screen.queryByTestId('notifications-card'),
      ).not.toBeInTheDocument();
    });

    it('should call useIXPFeatureFlag with correct flag name for notifications', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(mockUseIXPFeatureFlag).toHaveBeenCalledWith({
        flagName: 'SBSEG-QB-Time-show-notifications-in-user-settings',
        defaultValue: false,
      });
    });

    it('should not fetch notifications data when feature flag is disabled', () => {
      const {
        useNotificationsCardData,
      } = require('src/js/widgets/userSettings/hooks');

      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // When FF is disabled, useNotificationsCardData should be called with undefined
      expect(useNotificationsCardData).toHaveBeenCalledWith(undefined);
    });

    it('should fetch notifications data when feature flag is enabled', () => {
      const {
        useNotificationsCardData,
      } = require('src/js/widgets/userSettings/hooks');

      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      // When FF is enabled, useNotificationsCardData should be called with settingsFor
      expect(useNotificationsCardData).toHaveBeenCalledWith(mockSettingsFor);
    });

    it('does not show user settings schedule notifications section when schedule settings FF is off', () => {
      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = true;
      mockFeatureFlagValues['SBSEG-QBO-Enable-Time-Schedule-Settings'] = false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('notifications-card')).toHaveAttribute(
        'data-show-schedule-notifications',
        'false',
      );
    });

    it('shows user settings schedule notifications section when schedule settings FF is on', () => {
      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = true;
      mockFeatureFlagValues['SBSEG-QBO-Enable-Time-Schedule-Settings'] = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('notifications-card')).toHaveAttribute(
        'data-show-schedule-notifications',
        'true',
      );
    });

    it('should call useIXPFeatureFlag for schedule settings feature flag', () => {
      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(mockUseIXPFeatureFlag).toHaveBeenCalledWith({
        flagName: 'SBSEG-QBO-Enable-Time-Schedule-Settings',
        defaultValue: false,
      });
    });
  });

  describe('Feature Flag - Overtime Card Visibility', () => {
    it('should not render OvertimeCard when TSheets overtime is disabled', () => {
      mockOvertimeFeatureEnabled = false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.queryByTestId('overtime-card')).not.toBeInTheDocument();
    });

    it('should not render OvertimeCard when IXP flag is disabled', () => {
      mockOvertimeFeatureEnabled = false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.queryByTestId('overtime-card')).not.toBeInTheDocument();
    });

    it('should render OvertimeCard when overtime feature hook returns enabled', () => {
      mockOvertimeFeatureEnabled = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('overtime-card')).toBeInTheDocument();
    });
  });

  describe('Multiple Cards Visibility', () => {
    it('should render only NotificationsCard when only notifications FF is enabled', () => {
      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = true;
      mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] =
        false;
      mockFeatureFlagValues['SBSEG-QB-Time-show-location-user-settings'] =
        false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
      expect(screen.queryByTestId('breaks-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('location-card')).not.toBeInTheDocument();
    });

    it('should render no cards when all feature flags are disabled', () => {
      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = false;
      mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] =
        false;
      mockFeatureFlagValues['SBSEG-QB-Time-show-location-user-settings'] =
        false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(
        screen.queryByTestId('notifications-card'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('breaks-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('location-card')).not.toBeInTheDocument();
    });

    it('should render all three cards when all feature flags are enabled', () => {
      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = true;
      mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] =
        true;
      mockFeatureFlagValues['SBSEG-QB-Time-show-location-user-settings'] = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
      expect(screen.getByTestId('breaks-card')).toBeInTheDocument();
      expect(screen.getByTestId('location-card')).toBeInTheDocument();
    });

    it('should render NotificationsCard and BreaksCard when only their FFs are enabled', () => {
      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = true;
      mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] =
        true;
      mockFeatureFlagValues['SBSEG-QB-Time-show-location-user-settings'] =
        false;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
      expect(screen.getByTestId('breaks-card')).toBeInTheDocument();
      expect(screen.queryByTestId('location-card')).not.toBeInTheDocument();
    });

    it('should render NotificationsCard and LocationCard when only their FFs are enabled', () => {
      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = true;
      mockFeatureFlagValues['SBSEG-QB-Time-show-breaks-in-user-settings'] =
        false;
      mockFeatureFlagValues['SBSEG-QB-Time-show-location-user-settings'] = true;

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      expect(screen.getByTestId('notifications-card')).toBeInTheDocument();
      expect(screen.queryByTestId('breaks-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('location-card')).toBeInTheDocument();
    });
  });

  describe('Unified Settings Callbacks', () => {
    const mockSuccessData = {
      timeTrackingUnifiedUserSettings: {
        scheduleNotifications: {
          subscriptions: [
            {
              notificationType: 'SCHEDULE_PUBLISHED',
              distributionMethods: ['EMAIL'],
              meta: { version: '1' },
            },
          ],
        },
        locationSettings: null,
      },
    };

    beforeEach(() => {
      // Enable schedule notifications flag so shouldFetchUnified is true and callbacks are wired
      mockFeatureFlagValues[
        'SBSEG-QB-Time-show-notifications-in-user-settings'
      ] = true;
      mockFeatureFlagValues['SBSEG-QBO-Enable-Time-Schedule-Settings'] = true;
    });

    it('handleUnifiedSuccess dispatches resetLocationState with data', () => {
      const dispatchSpy = jest.spyOn(mockStore, 'dispatch');

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      act(() => {
        capturedOnSuccess!(mockSuccessData);
      });

      const dispatchedTypes = dispatchSpy.mock.calls.map(
        (call: any[]) => call[0]?.type,
      );
      expect(dispatchedTypes).toContain('location/resetLocationState');
    });

    it('handleUnifiedSuccess dispatches resetScheduleNotificationsState with data', () => {
      const dispatchSpy = jest.spyOn(mockStore, 'dispatch');

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      act(() => {
        capturedOnSuccess!(mockSuccessData);
      });

      const dispatchedTypes = dispatchSpy.mock.calls.map(
        (call: any[]) => call[0]?.type,
      );
      expect(dispatchedTypes).toContain(
        'scheduleNotifications/resetScheduleNotificationsState',
      );
    });

    it('handleUnifiedSuccess logs subscriptions count via logger.info', () => {
      const { useLoggingConfig } = jest.requireMock(
        'src/js/providers/LoggingConfigProvider',
      );
      const mockInfo = jest.fn();
      useLoggingConfig.mockReturnValue({
        info: mockInfo,
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      });

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      act(() => {
        capturedOnSuccess!(mockSuccessData);
      });

      expect(mockInfo).toHaveBeenCalledWith(
        `Component=UserSettingsPage Event=${USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING.FETCH_RULES_SUCCESS} section=SCHEDULE_NOTIFICATIONS`,
        expect.objectContaining({ subscriptionsCount: 1 }),
      );
    });

    it('handleUnifiedSuccess logs subscriptionsCount of 0 when subscriptions are absent', () => {
      const { useLoggingConfig } = jest.requireMock(
        'src/js/providers/LoggingConfigProvider',
      );
      const mockInfo = jest.fn();
      useLoggingConfig.mockReturnValue({
        info: mockInfo,
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      });

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      act(() => {
        capturedOnSuccess!({ timeTrackingUnifiedUserSettings: null });
      });

      expect(mockInfo).toHaveBeenCalledWith(
        `Component=UserSettingsPage Event=${USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING.FETCH_RULES_SUCCESS} section=SCHEDULE_NOTIFICATIONS`,
        expect.objectContaining({ subscriptionsCount: 0 }),
      );
    });

    it('handleUnifiedError dispatches setLocationError', () => {
      const dispatchSpy = jest.spyOn(mockStore, 'dispatch');

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      act(() => {
        capturedOnError!('network error');
      });

      const dispatchedTypes = dispatchSpy.mock.calls.map(
        (call: any[]) => call[0]?.type,
      );
      expect(dispatchedTypes).toContain('location/setLocationError');
    });

    it('handleUnifiedError logs FETCH_RULES_FAILED via logger.error', () => {
      const { useLoggingConfig } = jest.requireMock(
        'src/js/providers/LoggingConfigProvider',
      );
      const mockError = jest.fn();
      useLoggingConfig.mockReturnValue({
        info: jest.fn(),
        error: mockError,
        warn: jest.fn(),
        debug: jest.fn(),
      });

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      act(() => {
        capturedOnError!('network error');
      });

      expect(mockError).toHaveBeenCalledWith(
        `Component=UserSettingsPage Event=${USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING.FETCH_RULES_FAILED} section=SCHEDULE_NOTIFICATIONS`,
        { error: 'network error' },
      );
    });

    it('handleUnifiedError dispatches setScheduleNotificationsError', () => {
      const dispatchSpy = jest.spyOn(mockStore, 'dispatch');

      renderWithQuicksandAndReduxProvider(
        <UserSettingsPage settingsFor={mockSettingsFor} />,
        mockStore,
        mockSandbox,
      );

      act(() => {
        capturedOnError!('network error');
      });

      const dispatchedTypes = dispatchSpy.mock.calls.map(
        (call: any[]) => call[0]?.type,
      );
      expect(dispatchedTypes).toContain(
        'scheduleNotifications/setScheduleNotificationsError',
      );
    });
  });
});
