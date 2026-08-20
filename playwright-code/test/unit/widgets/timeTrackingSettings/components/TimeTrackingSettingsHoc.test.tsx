import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, cleanup, waitFor, act } from '@testing-library/react';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';
import { TimeTrackingSettingsProvider } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { TimeTrackingSettingsHOC } from 'src/js/widgets/timeTrackingSettings/components/TimeTrackingSettingsHOC';
import { TimeTrackingSettingsForm } from 'src/js/widgets/timeTrackingSettings/components/TimeTrackingSettingsForm';
import { useIsSettingsFlyoutV2Enabled } from 'src/js/service/hooks/ixp/useIsSettingsFlyoutV2Enabled';
import {
  computeHasPayrollWithTSheet,
  computeHasTSheet,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { isSimpleStartCompany } from 'src/js/service/utils/sandboxUtils';
import { useFeatureFlag } from 'src/js/common/hooks/useFeatureFlag';

// ---------------------------------------------------------------------------
// Component mocks
// ---------------------------------------------------------------------------

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeTrackingSettingsForm',
  () => ({
    TimeTrackingSettingsForm: jest.fn(() => (
      <div data-testid="time-tracking-settings-form" />
    )),
  }),
);

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/SettingsFlyoutV2',
  () => ({
    SettingsFlyoutV2: () => <div data-testid="settings-flyout-v2" />,
  }),
);

jest.mock('src/js/common/components/MaintenancePage/MaintenancePage', () => ({
  __esModule: true,
  default: () => <div data-testid="maintenance-page" />,
}));

// ---------------------------------------------------------------------------
// Hook / utility mocks
// ---------------------------------------------------------------------------

jest.mock('src/js/service/hooks/ixp/useIsSettingsFlyoutV2Enabled', () => ({
  useIsSettingsFlyoutV2Enabled: jest.fn(),
}));

jest.mock('src/js/service/hooks/entitlements/useGetEntitlements', () => ({
  computeHasTSheet: jest.fn(),
  computeHasPayrollWithTSheet: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => {
  const original = jest.requireActual('src/js/service/utils/sandboxUtils');
  return {
    ...original,
    getListType: jest.fn().mockReturnValue('US'),
    isSimpleStartCompany: jest.fn().mockResolvedValue(false),
  };
});

jest.mock('src/js/common/hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn().mockReturnValue(false),
}));

// ---------------------------------------------------------------------------
// Context mock
// ---------------------------------------------------------------------------

// Mock LoggingConfigProvider
jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => ({
    info: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  }),
}));

// Mock useInitializeItmTasks hook
jest.mock('src/js/widgets/qbtOrchestrator/features/overview/hooks', () => ({
  useInitializeItmTasks: () => ({
    tasks: [],
    isLoading: false,
    error: null,
    isFeatureEnabled: false,
  }),
}));

// Mock the context values
const mockContextValue = {
  isQLSettingsLoading: false,
  entitlementsLoading: false,
  sandbox: {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
    appContext: {
      getEnvironment: jest.fn().mockReturnValue('e2e'),
      getRealmInfo: jest.fn().mockReturnValue({
        realmId: 'exampleRealmId',
      }),
      getUserAuthInfo: jest.fn().mockReturnValue({
        authId: 'exampleAuthId',
      }),
    },
    pluginConfig: {
      extendedProperties: {
        appSecret: 'exampleAppSecret',
      },
    },
    featureFlags: {
      isFeatureEnabled: jest.fn(),
    },
    authorization: {
      isAuthorized: jest.fn(),
    },
    extensions: {
      qbo: {
        context: {
          getEnvironmentInfo: jest.fn().mockReturnValue({
            xCsrfToken: 'exampleCsrfToken',
          }),
          getCompanyL10nInfo: jest.fn().mockReturnValue({
            region: 'US',
          }),
        },
        jobs: {
          hasJobGroup: jest.fn().mockReturnValue(true),
        },
      },
    },
  },
  isRenderTimeEntry: false,
  QLData: {},
  QLSettingsError: undefined,
  v3PreferencesData: {},
  v3PreferencesLoading: false,
  v3PreferencesError: false,
  QLSettingsRefetch: jest.fn(),
  text: jest.fn((id) => id),
  entitlements: [],
  isFormEditable: true,
  errorMessage: '',
  reRenderTimeEntrySetting: jest.fn(),
  updateErrorMessage: jest.fn(),
};

jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    TimeTrackingSettingsProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <div>{children}</div>,
    useTimeTrackingSettingsContext: () => mockContextValue,
  }),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderWithProviders = (ui: React.ReactElement) =>
  renderWithQuicksandProvider(
    <TimeTrackingSettingsProvider>{ui}</TimeTrackingSettingsProvider>,
    getDefaultSandbox(),
  );

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockContextValue.isQLSettingsLoading = false;
  mockContextValue.entitlementsLoading = false;
  mockContextValue.isRenderTimeEntry = false;
  mockContextValue.entitlements = [];

  // Default: experiment settled but disabled → renders existing form
  (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
    isSettingsFlyoutV2Enabled: false,
    settled: true,
  });
  (computeHasTSheet as jest.Mock).mockReturnValue(false);
  (computeHasPayrollWithTSheet as jest.Mock).mockReturnValue(false);
  (isSimpleStartCompany as jest.Mock).mockResolvedValue(false);
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Existing behaviour tests
// ---------------------------------------------------------------------------

describe('TimeTrackingSettingsHOC Component', () => {
  test('renders loading state when entitlements are loading', async () => {
    mockContextValue.entitlementsLoading = true;
    renderWithProviders(<TimeTrackingSettingsHOC />);
    await act(async () => {});
  });

  test('renders loading state when QLSettings are loading and not initial render', async () => {
    mockContextValue.isQLSettingsLoading = true;
    mockContextValue.isRenderTimeEntry = false;
    renderWithProviders(<TimeTrackingSettingsHOC />);
    await act(async () => {});
  });

  test('renders form when not loading', async () => {
    renderWithProviders(<TimeTrackingSettingsHOC />);
    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
  });

  test('renders form when QLSettings loading but is initial render', async () => {
    mockContextValue.isQLSettingsLoading = true;
    mockContextValue.entitlementsLoading = false;
    mockContextValue.isRenderTimeEntry = true;
    renderWithProviders(<TimeTrackingSettingsHOC />);
    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
  });

  test('renders correctly for US region', async () => {
    mockContextValue.sandbox.extensions.qbo.context.getCompanyL10nInfo.mockReturnValue(
      { region: 'US' },
    );
    renderWithProviders(<TimeTrackingSettingsHOC />);
    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
  });

  test('renders correctly for CA region', async () => {
    mockContextValue.sandbox.extensions.qbo.context.getCompanyL10nInfo.mockReturnValue(
      { region: 'CA' },
    );
    renderWithProviders(<TimeTrackingSettingsHOC />);
    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
  });

  test('renders form even when QL settings loading', async () => {
    mockContextValue.isQLSettingsLoading = true;
    mockContextValue.isRenderTimeEntry = false;
    renderWithProviders(<TimeTrackingSettingsHOC />);
    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
  });

  test('renders TimeTrackingForm with correct styling', async () => {
    const { container } = renderWithProviders(<TimeTrackingSettingsHOC />);
    await screen.findByTestId('time-tracking-settings-form');
    const formContainer = container.querySelector('div[class*="sc-"]');
    expect(formContainer).toHaveStyle({ padding: '25px' });
  });
});

// ---------------------------------------------------------------------------
// SettingsFlyoutV2 conditional rendering tests
// ---------------------------------------------------------------------------

describe('TimeTrackingSettingsHOC — SettingsFlyoutV2 conditional', () => {
  test('renders nothing while IXP experiment has not settled', async () => {
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: true,
      settled: false,
    });
    (isSimpleStartCompany as jest.Mock).mockResolvedValue(true);

    renderWithProviders(<TimeTrackingSettingsHOC />);
    await act(async () => {});

    expect(screen.queryByTestId('settings-flyout-v2')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('time-tracking-settings-form'),
    ).not.toBeInTheDocument();
  });

  test('renders SettingsFlyoutV2 when experiment enabled, SimpleStart company, and no QBTime entitlement', async () => {
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: true,
      settled: true,
    });
    (isSimpleStartCompany as jest.Mock).mockResolvedValue(true);
    (computeHasTSheet as jest.Mock).mockReturnValue(false);

    renderWithProviders(<TimeTrackingSettingsHOC />);

    expect(await screen.findByTestId('settings-flyout-v2')).toBeInTheDocument();
    expect(
      screen.queryByTestId('time-tracking-settings-form'),
    ).not.toBeInTheDocument();
  });

  test('renders existing form when experiment is disabled', async () => {
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: false,
      settled: true,
    });
    (isSimpleStartCompany as jest.Mock).mockResolvedValue(true);

    renderWithProviders(<TimeTrackingSettingsHOC />);

    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('settings-flyout-v2')).not.toBeInTheDocument();
  });

  test('renders existing form when company is not SimpleStart', async () => {
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: true,
      settled: true,
    });
    (isSimpleStartCompany as jest.Mock).mockResolvedValue(false);
    (computeHasTSheet as jest.Mock).mockReturnValue(false);

    renderWithProviders(<TimeTrackingSettingsHOC />);

    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('settings-flyout-v2')).not.toBeInTheDocument();
  });

  test('renders existing form when company has QBTime entitlement', async () => {
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: true,
      settled: true,
    });
    (isSimpleStartCompany as jest.Mock).mockResolvedValue(true);
    (computeHasTSheet as jest.Mock).mockReturnValue(true);

    renderWithProviders(<TimeTrackingSettingsHOC />);

    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('settings-flyout-v2')).not.toBeInTheDocument();
  });

  test('renders existing form when SimpleStart has Payroll Premium/Elite with time (no QBTime)', async () => {
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: true,
      settled: true,
    });
    (isSimpleStartCompany as jest.Mock).mockResolvedValue(true);
    (computeHasTSheet as jest.Mock).mockReturnValue(false);
    (computeHasPayrollWithTSheet as jest.Mock).mockReturnValue(true);

    renderWithProviders(<TimeTrackingSettingsHOC />);

    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('settings-flyout-v2')).not.toBeInTheDocument();
    expect(computeHasPayrollWithTSheet).toHaveBeenCalledWith(
      mockContextValue.entitlements,
    );
  });

  test('renders existing form when all three conditions are required together', async () => {
    // All three must be true simultaneously; missing any one falls back to form
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: true,
      settled: true,
    });
    (isSimpleStartCompany as jest.Mock).mockResolvedValue(false); // fails condition
    (computeHasTSheet as jest.Mock).mockReturnValue(true); // also fails

    renderWithProviders(<TimeTrackingSettingsHOC />);

    await waitFor(() => {
      expect(
        screen.queryByTestId('settings-flyout-v2'),
      ).not.toBeInTheDocument();
    });
    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Maintenance page feature flag tests
// ---------------------------------------------------------------------------

describe('TimeTrackingSettingsHOC — Maintenance Page', () => {
  test('renders maintenance page when feature flag is enabled', async () => {
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: false,
      settled: true,
    });

    renderWithProviders(<TimeTrackingSettingsHOC />);

    expect(await screen.findByTestId('maintenance-page')).toBeInTheDocument();
    expect(
      screen.queryByTestId('time-tracking-settings-form'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings-flyout-v2')).not.toBeInTheDocument();
  });

  test('renders normal form when feature flag is disabled', async () => {
    (useFeatureFlag as jest.Mock).mockReturnValue(false);
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: false,
      settled: true,
    });

    renderWithProviders(<TimeTrackingSettingsHOC />);

    expect(
      await screen.findByTestId('time-tracking-settings-form'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('maintenance-page')).not.toBeInTheDocument();
  });

  test('maintenance page takes precedence over SettingsFlyoutV2', async () => {
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: true,
      settled: true,
    });
    (isSimpleStartCompany as jest.Mock).mockResolvedValue(true);
    (computeHasTSheet as jest.Mock).mockReturnValue(false);

    renderWithProviders(<TimeTrackingSettingsHOC />);

    expect(await screen.findByTestId('maintenance-page')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-flyout-v2')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('time-tracking-settings-form'),
    ).not.toBeInTheDocument();
  });

  test('maintenance page waits for async checks before showing', async () => {
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: false,
      settled: false, // Not yet settled
    });
    (isSimpleStartCompany as jest.Mock).mockResolvedValue(false);

    renderWithProviders(<TimeTrackingSettingsHOC />);

    // Nothing should render while waiting for async checks (settled=false)
    // The component returns null
    expect(screen.queryByTestId('maintenance-page')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('time-tracking-settings-form'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings-flyout-v2')).not.toBeInTheDocument();
  });

  test('maintenance page shows after async checks are complete', async () => {
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    (useIsSettingsFlyoutV2Enabled as jest.Mock).mockReturnValue({
      isSettingsFlyoutV2Enabled: false,
      settled: true, // settled = true
    });
    (isSimpleStartCompany as jest.Mock).mockResolvedValue(false);

    renderWithProviders(<TimeTrackingSettingsHOC />);

    // Maintenance page should appear after async checks complete
    expect(await screen.findByTestId('maintenance-page')).toBeInTheDocument();
  });

  test('calls useFeatureFlag with correct feature flag constant', async () => {
    const mockUseFeatureFlag = useFeatureFlag as jest.Mock;
    mockUseFeatureFlag.mockReturnValue(false);

    renderWithProviders(<TimeTrackingSettingsHOC />);

    await screen.findByTestId('time-tracking-settings-form');

    // Verify useFeatureFlag was called with the maintenance feature flag
    expect(mockUseFeatureFlag).toHaveBeenCalledWith(
      'SBSEG-QBO-SBSEG-QBO-QBTIME-MAINTENANCE-FULL-PAGE',
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// Standalone trowser entry point (trowserKey / onClose) passthrough
// ---------------------------------------------------------------------------

describe('TimeTrackingSettingsHOC — standalone trowser entry point', () => {
  test('forwards trowserKey and onClose to TimeTrackingSettingsForm', async () => {
    const onClose = jest.fn();

    renderWithProviders(
      <TimeTrackingSettingsHOC
        trowserKey="timesheet-settings"
        onClose={onClose}
      />,
    );

    await screen.findByTestId('time-tracking-settings-form');

    expect(TimeTrackingSettingsForm).toHaveBeenCalledWith(
      expect.objectContaining({
        trowserKey: 'timesheet-settings',
        onClose,
      }),
      expect.anything(),
    );
  });

  test('leaves trowserKey and onClose undefined when not provided', async () => {
    renderWithProviders(<TimeTrackingSettingsHOC />);

    await screen.findByTestId('time-tracking-settings-form');

    expect(TimeTrackingSettingsForm).toHaveBeenCalledWith(
      expect.objectContaining({
        trowserKey: undefined,
        onClose: undefined,
      }),
      expect.anything(),
    );
  });
});
