import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { buildSandbox, MockQuicksandProvider } from '@payroll/quicksand';
import { Sandbox } from 'src/js/common/sandbox';
import {
  useCurrencySymbol,
  useCurrencyFormat,
  useHasAdminAccess,
  fetchSettingsAccess,
  useSandboxNavigate,
  useFeatureFlag,
  getlookupIntervalForCopyLastTimesheet,
  getJobs,
  isPayrollFirstCompany,
  getListType,
  canEditPreference,
  isTimeTrackingOnlyRole,
  isWorkforceEnvironment,
  getLocalizationInfo,
} from 'src/js/service/utils/sandboxUtils';
import {
  TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE,
  LOOKUP_INTERVAL_FOR_COPY_LAST_TIMESHEET_IN_MONTHS,
  QUICKBOOKS_JOB_GROUP,
  ENTITLEMENTS,
} from 'src/js/common/constants';
import { getDecision } from '__mocks__/@core-app/variability-sync-sdk';

jest.mock('__mocks__/@core-app/variability-sync-sdk', () => ({
  getDecision: jest.fn(),
}));

const mockGetDecision = getDecision as jest.MockedFunction<typeof getDecision>;

describe('useCurrencySymbol', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      // @ts-ignore
      authorization: {
        isAuthorized: jest.fn().mockResolvedValue({
          isAuthorized: true,
          obligations: [
            {
              permit: ['company_prefs:update'],
            },
          ],
        }),
      },
      extensions: {
        qbo: {
          // @ts-ignore
          context: {
            getCompanyL10nInfo: jest.fn().mockReturnValue({
              currencySymbol: '$',
            }),
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const AllTheProviders = ({ children }: any) => (
    <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
  );

  it('should return the correct currency symbol', () => {
    const { result } = renderHook(() => useCurrencySymbol(), {
      wrapper: AllTheProviders,
    });
    expect(result.current).toBe('$');
  });

  it('should return a different currency symbol when sandbox is configured differently', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({
        currencySymbol: '€',
      });

    const { result } = renderHook(() => useCurrencySymbol(), {
      wrapper: AllTheProviders,
    });
    expect(result.current).toBe('€');
  });

  it('should return £ for QBO UK company', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({
        currencySymbol: '£',
        locale: 'en-GB',
        currencyIsoCode: 'GBP',
        region: 'GB',
      });

    const { result } = renderHook(() => useCurrencySymbol(), {
      wrapper: AllTheProviders,
    });
    expect(result.current).toBe('£');
  });
});

describe('useCurrencyFormat', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      extensions: {
        qbo: {
          // @ts-ignore
          context: {
            getCompanyL10nInfo: jest.fn().mockReturnValue({
              locale: 'en-US',
              currencyIsoCode: 'USD',
            }),
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const AllTheProviders = ({ children }: any) => (
    <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
  );

  it('should return the correct currency symbol', () => {
    const amount = 1234.56;
    const { result } = renderHook(() => useCurrencyFormat(amount), {
      wrapper: AllTheProviders,
    });
    expect(result.current).toBe('$1,234.56');
  });

  it('should return a different currency symbol when sandbox is configured differently', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({
        locale: 'en-gb',
        currencyIsoCode: 'GBP',
      });

    const amount = 1234.56;
    const { result } = renderHook(() => useCurrencyFormat(amount), {
      wrapper: AllTheProviders,
    });
    expect(result.current).toBe('£1,234.56');
  });
});

describe('fetchSettingsAccess', () => {
  let sandbox: Sandbox;
  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      // @ts-ignore
      authorization: {
        isAuthorized: jest.fn().mockResolvedValue({
          isAuthorized: true,
          obligations: [
            {
              permit: ['company_prefs:update'],
            },
          ],
        }),
      },
      extensions: {
        qbo: {
          // @ts-ignore
          context: {
            getAuthInfo: jest.fn().mockReturnValue({
              isAdmin: true,
            }),
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const AllTheProviders = ({ children }: any) => (
    <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
  );
  it('should return true when isAuthorized and obligations conditions are met', async () => {
    sandbox.authorization.isAuthorized = jest.fn().mockResolvedValue({
      isAuthorized: true,
      obligations: [{ permit: ['company_prefs:update'] }],
    });

    // @ts-ignore
    const result = await fetchSettingsAccess(sandbox);
    expect(result).toBe(true);
  });

  it('should return false when isAuthorized condition is not met', async () => {
    sandbox.authorization.isAuthorized = jest.fn().mockResolvedValue({
      isAuthorized: false,
      obligations: [{ permit: ['company_prefs:update'] }],
    });

    // @ts-ignore
    const result = await fetchSettingsAccess(sandbox);
    expect(result).toBe(false);
  });

  it('should return false when isAuthorized condition is not met', async () => {
    sandbox.authorization.isAuthorized = jest.fn().mockResolvedValue({
      isAuthorized: false,
      obligations: [{ permit: ['company_prefs:update'] }],
    });

    // @ts-ignore
    const result = await fetchSettingsAccess(sandbox);
    expect(result).toBe(false);
  });

  it("should return false when obligations' permit is missing the required value", async () => {
    sandbox.authorization.isAuthorized = jest.fn().mockResolvedValue({
      isAuthorized: true,
      obligations: [{ permit: [] }],
    });

    // @ts-ignore
    const result = await fetchSettingsAccess(sandbox);
    expect(result).toBe(false);
  });

  it('should return false when obligations is empty', async () => {
    sandbox.authorization.isAuthorized = jest.fn().mockResolvedValue({
      isAuthorized: true,
      obligations: [],
    });

    // @ts-ignore
    const result = await fetchSettingsAccess(sandbox);
    expect(result).toBe(false);
  });

  it('should return false when null is passed', async () => {
    // @ts-ignore
    const result = await fetchSettingsAccess(null);
    expect(result).toBe(false);
  });
});

describe('useHasAdminAccess', () => {
  let sandbox: Sandbox;
  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
        fatal: jest.fn(),
        logException: jest.fn(),
        isLevelDebug: jest.fn().mockReturnValue(false),
        isLevelInfo: jest.fn().mockReturnValue(false),
        isLevelWarn: jest.fn().mockReturnValue(false),
        isLevelError: jest.fn().mockReturnValue(false),
        isLevelFatal: jest.fn().mockReturnValue(false),
        isLevelLog: jest.fn().mockReturnValue(false),
        on: jest.fn(),
        off: jest.fn(),
      },
      extensions: {
        qbo: {
          // @ts-ignore
          context: {
            getCompanyL10nInfo: jest.fn().mockReturnValue({
              currencySymbol: '$',
              locale: 'en-US',
              currencyIsoCode: 'USD',
              region: 'US',
            }),
            getAuthInfo: jest.fn().mockReturnValue({
              isAdmin: true,
            }),
          },
          jobs: {
            hasJobGroup: jest.fn().mockReturnValue(false),
            hasTask: jest.fn().mockReturnValue(false),
            getTasks: jest.fn().mockReturnValue([]),
            isJobActivated: jest.fn().mockReturnValue(false),
            getActivatedJobs: jest.fn().mockReturnValue([]),
            getAllJobs: jest.fn().mockReturnValue([]),
            activateJob: jest.fn(),
            deactivateJob: jest.fn(),
            updateJobsActivationStatus: jest.fn(),
            isJobsEnabled: jest.fn().mockReturnValue(true),
            isRouteEnabled: jest.fn().mockReturnValue(true),
            isRouteEnabledAsync: jest.fn().mockResolvedValue(true),
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const AllTheProviders = ({ children }: any) => (
    <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
  );

  it('should return isAdmin as true', () => {
    const { result } = renderHook(() => useHasAdminAccess(), {
      wrapper: AllTheProviders,
    });
    expect(result.current).toBe(true);
  });

  it('should return isAdmin as false when sandbox is configured differently', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      isAdmin: false,
    });

    const { result } = renderHook(() => useHasAdminAccess(), {
      wrapper: AllTheProviders,
    });
    expect(result.current).toBe(false);
  });

  test('getJobs returns jobs object', () => {
    const result = getJobs(sandbox);
    expect(result).toBe(sandbox.extensions.qbo.jobs);
  });

  test('isPayrollFirstCompany returns false for non-payroll-first company', () => {
    const result = isPayrollFirstCompany(sandbox);
    expect(result).toBe(true);
  });

  it('isPayrollFirstCompany should return true if no QUICKBOOKS_JOB_GROUP', () => {
    const result = isPayrollFirstCompany(sandbox);
    expect(result).toBe(true);
  });

  it('getListType should return TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US for US region', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: 'US' });
    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST);
  });

  it('getListType should return TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA for CA region', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: 'CA' });
    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA);
  });

  it('getListType should return TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK for GB region', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: 'GB' });
    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK);
  });

  it('getListType should return TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US when region is undefined', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: undefined });
    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST);
  });

  it('getListType should return TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US when getCompanyL10nInfo returns undefined', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue(undefined);
    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST);
  });

  it('getListType should return TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US for other regions (e.g., AU)', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: 'AU' });
    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST);
  });

  it('getListType should return TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US for other regions (e.g., DE)', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: 'DE' });
    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST);
  });
});

describe('useSandboxNavigate', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      navigation: {
        navigate: jest.fn(),
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const AllTheProviders = ({ children }: any) => (
    <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
  );

  it('should return the correct navigator object', () => {
    const { result } = renderHook(() => useSandboxNavigate(), {
      wrapper: AllTheProviders,
    });
    expect(result.current).toBe(sandbox.navigation);
  });

  it('should call navigate method on navigator object', () => {
    const { result } = renderHook(() => useSandboxNavigate(), {
      wrapper: AllTheProviders,
    });
    result.current.navigate('/some-path');
    expect(sandbox.navigation.navigate).toHaveBeenCalledWith('/some-path');
  });
});

describe('useFeatureFlag', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      featureFlags: {
        isFeatureEnabled: jest.fn(),
        getAllFlags: jest.fn().mockReturnValue({}),
        evaluateBooleanVariation: jest.fn().mockResolvedValue(false),
        evaluateStringVariation: jest.fn().mockResolvedValue(''),
        evaluateIntVariation: jest.fn().mockResolvedValue(0),
        evaluateDoubleVariation: jest.fn().mockResolvedValue(0),
        evaluateJsonVariation: jest.fn().mockResolvedValue({}),
        evaluateFeatureFlags: jest.fn().mockResolvedValue({}),
        getAllRemoteFlags: jest.fn().mockResolvedValue({}),
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const AllTheProviders = ({ children }: any) => (
    <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
  );

  it('should return true when the feature flag is enabled', () => {
    sandbox.featureFlags.isFeatureEnabled = jest.fn().mockReturnValue(true);

    const { result } = renderHook(() => useFeatureFlag('some-feature'), {
      wrapper: AllTheProviders,
    });
    expect(result.current).toBe(true);
  });

  it('should return false when the feature flag is disabled', () => {
    sandbox.featureFlags.isFeatureEnabled = jest.fn().mockReturnValue(false);

    const { result } = renderHook(() => useFeatureFlag('some-feature'), {
      wrapper: AllTheProviders,
    });
    expect(result.current).toBe(false);
  });
});

describe('getlookupIntervalForCopyLastTimesheet', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      pluginConfig: {
        extendedProperties: {
          lastTimeEntryLookupIntervalInMonths: '3',
        },
        hasLayers: false,
        manifestVersion: '3',
        id: '',
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the value from extendedProperties if it exists', () => {
    const result = getlookupIntervalForCopyLastTimesheet(sandbox);
    expect(result).toBe(3);
  });

  it('should return the default value if extendedProperties is undefined', () => {
    sandbox.pluginConfig.extendedProperties = undefined;
    const result = getlookupIntervalForCopyLastTimesheet(sandbox);
    expect(result).toBe(LOOKUP_INTERVAL_FOR_COPY_LAST_TIMESHEET_IN_MONTHS);
  });

  it('should return the default value if lastTimeEntryLookupIntervalInMonths is undefined', () => {
    if (sandbox.pluginConfig.extendedProperties) {
      sandbox.pluginConfig.extendedProperties.lastTimeEntryLookupIntervalInMonths =
        undefined;
    }
    const result = getlookupIntervalForCopyLastTimesheet(sandbox);
    expect(result).toBe(LOOKUP_INTERVAL_FOR_COPY_LAST_TIMESHEET_IN_MONTHS);
  });
});

describe('canEditPreference', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      extensions: {
        qbo: {
          // @ts-ignore
          context: {
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
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when companyPrefs permission is ALL', () => {
    const result = canEditPreference(sandbox);
    expect(result).toBe(true);
  });

  it('should return true when companyPrefs permission is EDIT', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      legacyPermissions: {
        features: {
          companyPrefs: 'EDIT',
        },
      },
    });

    const result = canEditPreference(sandbox);
    expect(result).toBe(true);
  });

  it('should return false when companyPrefs permission is READ', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      legacyPermissions: {
        features: {
          companyPrefs: 'READ',
        },
      },
    });

    const result = canEditPreference(sandbox);
    expect(result).toBe(false);
  });

  it('should return false when companyPrefs permission is undefined', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      legacyPermissions: {
        features: {
          companyPrefs: undefined,
        },
      },
    });

    const result = canEditPreference(sandbox);
    expect(result).toBe(false);
  });

  it('should return false when legacyPermissions is undefined', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      legacyPermissions: undefined,
    });

    const result = canEditPreference(sandbox);
    expect(result).toBe(false);
  });

  it('should return false when getAuthInfo returns undefined', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest
      .fn()
      .mockReturnValue(undefined);

    const result = canEditPreference(sandbox);
    expect(result).toBe(false);
  });

  it('should return false when sandbox is null', () => {
    const result = canEditPreference(null as any);
    expect(result).toBe(false);
  });
});

describe('isTimeTrackingOnlyRole', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
        fatal: jest.fn(),
        logException: jest.fn(),
        isLevelDebug: jest.fn().mockReturnValue(false),
        isLevelInfo: jest.fn().mockReturnValue(false),
        isLevelWarn: jest.fn().mockReturnValue(false),
        isLevelError: jest.fn().mockReturnValue(false),
        isLevelFatal: jest.fn().mockReturnValue(false),
        isLevelLog: jest.fn().mockReturnValue(false),
        on: jest.fn(),
        off: jest.fn(),
      },
      extensions: {
        qbo: {
          // @ts-ignore
          context: {
            getAuthInfo: jest.fn().mockReturnValue({
              legacyRoles: {
                roleType: 'TIME_ENTRY',
              },
            }),
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when roleType is TIME_ENTRY', () => {
    const result = isTimeTrackingOnlyRole(sandbox);
    expect(result).toBe(true);
  });

  it('should return false when roleType is ADMIN', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      legacyRoles: {
        roleType: 'ADMIN',
      },
    });

    const result = isTimeTrackingOnlyRole(sandbox);
    expect(result).toBe(false);
  });

  it('should return false when roleType is USER', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      legacyRoles: {
        roleType: 'USER',
      },
    });

    const result = isTimeTrackingOnlyRole(sandbox);
    expect(result).toBe(false);
  });

  it('should return false when roleType is undefined', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      legacyRoles: {
        roleType: undefined,
      },
    });

    const result = isTimeTrackingOnlyRole(sandbox);
    expect(result).toBe(false);
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      'isTimeTrackingOnlyRole: unable to determine legacy role type from sandbox',
    );
  });

  it('should return false when legacyRoles is undefined', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      legacyRoles: undefined,
    });

    const result = isTimeTrackingOnlyRole(sandbox);
    expect(result).toBe(false);
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      'isTimeTrackingOnlyRole: unable to determine legacy role type from sandbox',
    );
  });

  it('should return false when getAuthInfo returns undefined', () => {
    sandbox.extensions.qbo.context.getAuthInfo = jest
      .fn()
      .mockReturnValue(undefined);

    const result = isTimeTrackingOnlyRole(sandbox);
    expect(result).toBe(false);
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      'isTimeTrackingOnlyRole: unable to determine legacy role type from sandbox',
    );
  });

  it('should return false when sandbox is null', () => {
    expect(() => isTimeTrackingOnlyRole(null as any)).toThrow();
  });

  it('should return false when sandbox extensions are undefined', () => {
    sandbox.extensions = undefined as any;

    const result = isTimeTrackingOnlyRole(sandbox);
    expect(result).toBe(false);
  });

  it('should return false when qbo context is undefined', () => {
    sandbox.extensions.qbo.context = undefined as any;

    const result = isTimeTrackingOnlyRole(sandbox);
    expect(result).toBe(false);
  });
});

describe('isPayrollFirstCompany', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      extensions: {
        qbo: {
          // @ts-ignore
          context: {
            getCompanyL10nInfo: jest.fn().mockReturnValue({
              currencySymbol: '$',
              locale: 'en-US',
              currencyIsoCode: 'USD',
              region: 'US',
            }),
            getAuthInfo: jest.fn().mockReturnValue({
              isAdmin: true,
            }),
          },
          jobs: {
            hasJobGroup: jest.fn().mockReturnValue(false),
            hasTask: jest.fn().mockReturnValue(false),
            getTasks: jest.fn().mockReturnValue([]),
            isJobActivated: jest.fn().mockReturnValue(false),
            getActivatedJobs: jest.fn().mockReturnValue([]),
            getAllJobs: jest.fn().mockReturnValue([]),
            activateJob: jest.fn(),
            deactivateJob: jest.fn(),
            updateJobsActivationStatus: jest.fn(),
            isJobsEnabled: jest.fn().mockReturnValue(true),
            isRouteEnabled: jest.fn().mockReturnValue(true),
            isRouteEnabledAsync: jest.fn().mockResolvedValue(true),
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when hasJobGroup returns false (payroll-first company)', () => {
    sandbox.extensions.qbo.jobs.hasJobGroup = jest.fn().mockReturnValue(false);
    const result = isPayrollFirstCompany(sandbox);
    expect(result).toBe(true);
  });

  it('should return false when hasJobGroup returns true (non-payroll-first company)', () => {
    sandbox.extensions.qbo.jobs.hasJobGroup = jest.fn().mockReturnValue(true);
    const result = isPayrollFirstCompany(sandbox);
    expect(result).toBe(false);
  });

  it('should call hasJobGroup with QUICKBOOKS_JOB_GROUP', () => {
    isPayrollFirstCompany(sandbox);
    expect(sandbox.extensions.qbo.jobs.hasJobGroup).toHaveBeenCalledWith(
      QUICKBOOKS_JOB_GROUP,
    );
  });
});

describe('getListType with payroll scenarios', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {
      ...buildSandbox(),
      extensions: {
        qbo: {
          // @ts-ignore
          context: {
            getCompanyL10nInfo: jest.fn().mockReturnValue({
              currencySymbol: '$',
              locale: 'en-US',
              currencyIsoCode: 'USD',
              region: 'US',
            }),
            getAuthInfo: jest.fn().mockReturnValue({
              isAdmin: true,
            }),
          },
          jobs: {
            hasJobGroup: jest.fn().mockReturnValue(false),
            hasTask: jest.fn().mockReturnValue(false),
            getTasks: jest.fn().mockReturnValue([]),
            isJobActivated: jest.fn().mockReturnValue(false),
            getActivatedJobs: jest.fn().mockReturnValue([]),
            getAllJobs: jest.fn().mockReturnValue([]),
            activateJob: jest.fn(),
            deactivateJob: jest.fn(),
            updateJobsActivationStatus: jest.fn(),
            isJobsEnabled: jest.fn().mockReturnValue(true),
            isRouteEnabled: jest.fn().mockReturnValue(true),
            isRouteEnabledAsync: jest.fn().mockResolvedValue(true),
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return PAYROLL_FIRST for US region when isPayrollFirstCompany returns true', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: 'US' });
    sandbox.extensions.qbo.jobs.hasJobGroup = jest.fn().mockReturnValue(false);

    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST);
  });

  it('should return US for US region when isPayrollFirstCompany returns false', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: 'US' });
    sandbox.extensions.qbo.jobs.hasJobGroup = jest.fn().mockReturnValue(true);

    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US);
  });

  it('should return PAYROLL_FIRST for undefined region when isPayrollFirstCompany returns true', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: undefined });
    sandbox.extensions.qbo.jobs.hasJobGroup = jest.fn().mockReturnValue(false);

    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST);
  });

  it('should return US for undefined region when isPayrollFirstCompany returns false', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: undefined });
    sandbox.extensions.qbo.jobs.hasJobGroup = jest.fn().mockReturnValue(true);

    const result = getListType(sandbox);
    expect(result).toBe(TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US);
  });
});

describe('isWorkforceEnvironment', () => {
  it('should return true for Workforce environment (payroll-employee-portal-experience)', () => {
    const workforceSandbox = {
      ...buildSandbox(),
      appContext: {
        ...buildSandbox().appContext,
        getAppInfo: jest.fn().mockReturnValue({
          appId: 'payroll-employee-portal-experience',
        }),
      },
    } as any;

    const result = isWorkforceEnvironment(workforceSandbox);

    expect(result).toBe(true);
  });

  it('should return false for QBO environment (time-tracking-ui)', () => {
    const qboSandbox = {
      ...buildSandbox(),
      appContext: {
        ...buildSandbox().appContext,
        getAppInfo: jest.fn().mockReturnValue({
          appId: 'time-tracking-ui',
        }),
      },
    } as any;

    const result = isWorkforceEnvironment(qboSandbox);

    expect(result).toBe(false);
  });

  it('should return false when appId is undefined', () => {
    const sandbox = {
      ...buildSandbox(),
      appContext: {
        ...buildSandbox().appContext,
        getAppInfo: jest.fn().mockReturnValue({
          appId: undefined,
        }),
      },
    } as any;

    const result = isWorkforceEnvironment(sandbox);

    expect(result).toBe(false);
  });

  it('should return false when getAppInfo returns undefined', () => {
    const sandbox = {
      ...buildSandbox(),
      appContext: {
        ...buildSandbox().appContext,
        getAppInfo: jest.fn().mockReturnValue(undefined),
      },
    } as any;

    const result = isWorkforceEnvironment(sandbox);

    expect(result).toBe(false);
  });

  it('should handle missing appContext gracefully', () => {
    const sandbox = {
      ...buildSandbox(),
      appContext: undefined,
    } as any;

    const result = isWorkforceEnvironment(sandbox);

    expect(result).toBe(false);
  });
});

describe('getLocalizationInfo', () => {
  it('should return QBO L10n info when available', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: {
        qbo: {
          context: {
            getCompanyL10nInfo: jest.fn().mockReturnValue({
              locale: 'en-US',
              currencyIsoCode: 'USD',
              currencySymbol: '$',
              region: 'US',
            }),
          },
        },
      },
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result).toEqual({
      locale: 'en-US',
      currencyIsoCode: 'USD',
      currencySymbol: '$',
      region: 'US',
    });
  });

  it('should derive currency from locale in AppFabric (WFS)', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'en-CA',
        }),
      },
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result).toEqual({
      locale: 'en-CA',
      currencyIsoCode: 'CAD',
      currencySymbol: '$',
      region: 'CA',
    });
  });

  it('should return USD for en-us locale', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'en-US',
        }),
      },
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result.currencyIsoCode).toBe('USD');
    expect(result.currencySymbol).toBe('$');
    expect(result.region).toBe('US');
  });

  it('should return CAD for fr-ca locale', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'fr-CA',
        }),
      },
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result.currencyIsoCode).toBe('CAD');
    expect(result.region).toBe('CA');
  });

  it('should return GBP for en-gb locale', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'en-GB',
        }),
      },
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result.currencyIsoCode).toBe('GBP');
    expect(result.currencySymbol).toBe('£');
    expect(result.region).toBe('GB');
  });

  it('should return default USD for unknown locale', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'de-DE',
        }),
      },
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result.currencyIsoCode).toBe('USD');
    expect(result.currencySymbol).toBe('$');
    expect(result.region).toBe('US');
  });

  it('should handle missing getLocalizationInfo gracefully', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: undefined,
      },
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result).toEqual({
      locale: 'en-US',
      currencyIsoCode: 'USD',
      currencySymbol: '$',
      region: 'US',
    });
  });

  it('should handle missing locale in localizationInfo', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({}),
      },
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result.locale).toBe('en-US');
  });

  it('should normalize locale to lowercase', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'EN-GB',
        }),
      },
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result.currencyIsoCode).toBe('GBP');
  });

  it('should return default fallback when both APIs unavailable', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: undefined,
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result).toEqual({
      locale: 'en-US',
      currencyIsoCode: 'USD',
      currencySymbol: '$',
      region: 'US',
    });
  });

  it('should include all required properties', () => {
    const sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'en-CA',
        }),
      },
    } as any;

    const result = getLocalizationInfo(sandbox);

    expect(result).toHaveProperty('locale');
    expect(result).toHaveProperty('currencyIsoCode');
    expect(result).toHaveProperty('currencySymbol');
    expect(result).toHaveProperty('region');
  });
});

describe('useCurrencySymbol with WFS', () => {
  let sandbox: Sandbox;

  const AllTheProviders = ({ children }: any) => (
    <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return currency symbol from WFS environment', () => {
    sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'en-CA',
        }),
      },
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
        fatal: jest.fn(),
        logException: jest.fn(),
        isLevelDebug: jest.fn().mockReturnValue(false),
        isLevelInfo: jest.fn().mockReturnValue(false),
        isLevelWarn: jest.fn().mockReturnValue(false),
        isLevelError: jest.fn().mockReturnValue(false),
        isLevelFatal: jest.fn().mockReturnValue(false),
        isLevelLog: jest.fn().mockReturnValue(false),
        on: jest.fn(),
        off: jest.fn(),
      },
    } as any;

    const { result } = renderHook(() => useCurrencySymbol(), {
      wrapper: AllTheProviders,
    });

    expect(result.current).toBe('$');
  });

  it('should fallback to derived currency when QBO extension unavailable', () => {
    sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'en-GB',
        }),
      },
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
        fatal: jest.fn(),
        logException: jest.fn(),
        isLevelDebug: jest.fn().mockReturnValue(false),
        isLevelInfo: jest.fn().mockReturnValue(false),
        isLevelWarn: jest.fn().mockReturnValue(false),
        isLevelError: jest.fn().mockReturnValue(false),
        isLevelFatal: jest.fn().mockReturnValue(false),
        isLevelLog: jest.fn().mockReturnValue(false),
        on: jest.fn(),
        off: jest.fn(),
      },
    } as any;

    const { result } = renderHook(() => useCurrencySymbol(), {
      wrapper: AllTheProviders,
    });

    expect(result.current).toBe('£');
  });
});

describe('useCurrencyFormat with WFS', () => {
  let sandbox: Sandbox;

  const AllTheProviders = ({ children }: any) => (
    <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should format currency in WFS environment', () => {
    sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'en-CA',
        }),
      },
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
        fatal: jest.fn(),
        logException: jest.fn(),
        isLevelDebug: jest.fn().mockReturnValue(false),
        isLevelInfo: jest.fn().mockReturnValue(false),
        isLevelWarn: jest.fn().mockReturnValue(false),
        isLevelError: jest.fn().mockReturnValue(false),
        isLevelFatal: jest.fn().mockReturnValue(false),
        isLevelLog: jest.fn().mockReturnValue(false),
        on: jest.fn(),
        off: jest.fn(),
      },
    } as any;

    const amount = 1234.56;
    const { result } = renderHook(() => useCurrencyFormat(amount), {
      wrapper: AllTheProviders,
    });

    expect(result.current).toContain('$');
    expect(result.current).toContain('1,234.56');
  });

  it('should use derived locale and currency code for WFS', () => {
    sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      appContext: {
        ...buildSandbox().appContext,
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'en-GB',
        }),
      },
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
        fatal: jest.fn(),
        logException: jest.fn(),
        isLevelDebug: jest.fn().mockReturnValue(false),
        isLevelInfo: jest.fn().mockReturnValue(false),
        isLevelWarn: jest.fn().mockReturnValue(false),
        isLevelError: jest.fn().mockReturnValue(false),
        isLevelFatal: jest.fn().mockReturnValue(false),
        isLevelLog: jest.fn().mockReturnValue(false),
        on: jest.fn(),
        off: jest.fn(),
      },
    } as any;

    const amount = 1234.56;
    const { result } = renderHook(() => useCurrencyFormat(amount), {
      wrapper: AllTheProviders,
    });

    expect(result.current).toContain('£');
  });
});

describe('useHasAdminAccess with WFS', () => {
  let sandbox: Sandbox;

  const AllTheProviders = ({ children }: any) => (
    <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false when QBO context unavailable (WFS)', () => {
    sandbox = {
      ...buildSandbox(),
      extensions: undefined,
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
        fatal: jest.fn(),
        logException: jest.fn(),
        isLevelDebug: jest.fn().mockReturnValue(false),
        isLevelInfo: jest.fn().mockReturnValue(false),
        isLevelWarn: jest.fn().mockReturnValue(false),
        isLevelError: jest.fn().mockReturnValue(false),
        isLevelFatal: jest.fn().mockReturnValue(false),
        isLevelLog: jest.fn().mockReturnValue(false),
        on: jest.fn(),
        off: jest.fn(),
      },
    } as any;

    const { result } = renderHook(() => useHasAdminAccess(), {
      wrapper: AllTheProviders,
    });

    expect(result.current).toBe(false);
  });

  it('should return false when sandbox.extensions.qbo is undefined', () => {
    sandbox = {
      ...buildSandbox(),
      extensions: { qbo: undefined } as any,
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
        fatal: jest.fn(),
        logException: jest.fn(),
        isLevelDebug: jest.fn().mockReturnValue(false),
        isLevelInfo: jest.fn().mockReturnValue(false),
        isLevelWarn: jest.fn().mockReturnValue(false),
        isLevelError: jest.fn().mockReturnValue(false),
        isLevelFatal: jest.fn().mockReturnValue(false),
        isLevelLog: jest.fn().mockReturnValue(false),
        on: jest.fn(),
        off: jest.fn(),
      },
    } as any;

    const { result } = renderHook(() => useHasAdminAccess(), {
      wrapper: AllTheProviders,
    });

    expect(result.current).toBe(false);
  });
});
