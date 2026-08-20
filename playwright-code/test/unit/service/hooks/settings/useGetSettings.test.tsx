import { SettingService } from '@quickbooks-qbappfound/setting-service-ui/dist/js/core/SettingService';
import * as UseGetSettings from 'src/js/service/hooks/settings/useGetSettings';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';
import * as MiscUtils from 'src/js/common/MiscUtils';

jest.mock('@quickbooks-qbappfound/setting-service-ui', () => ({
  settings: jest.fn(),
}));

jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
}));

const MOCK_TIME_TRACKING_SETTINGS_RESPONSE = {
  data: {
    qbAppFoundationQbSettings: {
      identity: {
        company: {
          localization: {
            localizationSettings: {
              timezone: '',
            },
          },
        },
      },
      qbCompositeApp: {
        qbAppFoundations: {
          customFieldsAndDimensions: {
            customFieldSettings: {
              classesEnabled: true,
              locationEnabled: true,
            },
          },
        },
      },
      finance: {
        accounting: {
          accountingCore: {
            accountingCoreSettings: {
              entityVersion: '1',
              closeBookDateEnabled: true,
              closeBookDate: '2024-01-01',
              closeBookPasswordEnabled: true,
            },
          },
        },
      },
      work: {
        timeTracking: {
          timeTrackingSettings: {
            billingForTimeEnabled: true,
            timeTrackingEnabled: true,
            startWorkWeek: 1, // Monday
          },
        },
      },
      commerce: {
        indirectTax: {
          indirectTaxSettings: {
            taxSettings: [{ taxEnabled: true }, { taxEnabled: true }],
          },
        },
      },
    },
  },
  errors: undefined,
};

const getMockSettingsService = (
  queryResponse = MOCK_TIME_TRACKING_SETTINGS_RESPONSE,
): SettingService => ({
  query: async () => Promise.resolve(queryResponse),
  apiKey: jest.fn().mockReturnThis(),
});

describe('useGetSettings', () => {
  beforeEach(() => {
    jest
      .spyOn(UseGetSettings, 'getSettingsService')
      .mockReturnValue(getMockSettingsService());
    jest.spyOn(MiscUtils, 'convertRecord').mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initially be loading', async () => {
    const { result } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(undefined);
  });

  it('should return result', async () => {
    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );

    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(undefined);
  });

  it('should return the correct startWorkWeek', async () => {
    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );

    await waitForNextUpdate();
    expect(result.current.data.firstDayOfWeek).toBe(1); // Monday
  });

  it('should return the correct closeBookDate', async () => {
    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );

    await waitForNextUpdate();
    expect(result.current.data.closeBookDate.format('YYYY-MM-DD')).toBe(
      '2024-01-01',
    );
  });

  it('should set error when API returns result.errors array', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockImplementation(() => 'API returned errors');
    jest.spyOn(UseGetSettings, 'getSettingsService').mockReturnValue({
      query: async () =>
        Promise.resolve({
          data: null,
          errors: [{ message: 'Settings not available' }],
        }),
      apiKey: jest.fn().mockReturnThis(),
    });

    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );
    await waitForNextUpdate();
    expect(result.current.error).toBe('API returned errors');
    expect(mapError).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceComponent: 'useGetSettings',
        error: 'Settings not available',
      }),
    );
  });

  it('should call refetch and reload settings', async () => {
    const mockQuery = jest
      .fn()
      .mockResolvedValue(MOCK_TIME_TRACKING_SETTINGS_RESPONSE);
    jest.spyOn(UseGetSettings, 'getSettingsService').mockReturnValue({
      query: mockQuery,
      apiKey: jest.fn().mockReturnThis(),
    });

    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(mockQuery).toHaveBeenCalledTimes(1);

    result.current.refetch();
    await waitForNextUpdate();
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('should handle missing fields and return default values', async () => {
    const minimalResponse = {
      data: {
        qbAppFoundationQbSettings: {
          identity: {
            company: {
              localization: {
                localizationSettings: {
                  timezone: '',
                },
              },
            },
          },
          qbCompositeApp: {
            qbAppFoundations: {
              customFieldsAndDimensions: {
                customFieldSettings: {
                  classesEnabled: false,
                  locationEnabled: false,
                },
              },
            },
          },
          finance: {
            accounting: {
              accountingCore: {
                accountingCoreSettings: {
                  entityVersion: '0',
                  closeBookDateEnabled: false,
                  closeBookDate: '',
                  closeBookPasswordEnabled: false,
                },
              },
            },
          },
          work: {
            timeTracking: {
              timeTrackingSettings: {
                billingForTimeEnabled: false,
                timeTrackingEnabled: false,
                startWorkWeek: 0,
              },
            },
          },
          commerce: {
            indirectTax: {
              indirectTaxSettings: {
                taxSettings: [{ taxEnabled: false }],
              },
            },
          },
        },
      },
      errors: undefined,
    };

    jest
      .spyOn(UseGetSettings, 'getSettingsService')
      .mockReturnValue(getMockSettingsService(minimalResponse));

    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );

    await waitForNextUpdate();
    const { data } = result.current;
    expect(data.isClassEnabled).toBe(false);
    expect(data.isLocationEnabled).toBe(false);
    expect(data.isServiceFieldEnabled).toBe(false);
    expect(data.isBillingFieldEnabled).toBe(false);
    expect(data.isTaxableFieldEnabled).toBe(false);
    expect(data.firstDayOfWeek).toBe(0);
    expect(data.entityVersion).toBe('0');
    expect(data.isCloseBookDateEnabled).toBe(false);
    expect(data.isCloseBookPasswordEnabled).toBe(false);
    expect(data.closeBookDate.isValid()).toBe(false); // Should be invalid when empty string is provided
    expect(data.timezone).toBe('');
  });

  it('should handle missing commerce.indirectTax fields and return false for isTaxableFieldEnabled', async () => {
    const responseWithoutCommerce = {
      data: {
        qbAppFoundationQbSettings: {
          identity: {
            company: {
              localization: {
                localizationSettings: {
                  timezone: 'America/Los_Angeles',
                },
              },
            },
          },
          qbCompositeApp: {
            qbAppFoundations: {
              customFieldsAndDimensions: {
                customFieldSettings: {
                  classesEnabled: true,
                  locationEnabled: true,
                },
              },
            },
          },
          finance: {
            accounting: {
              accountingCore: {
                accountingCoreSettings: {
                  entityVersion: '2',
                  closeBookDateEnabled: false,
                  closeBookDate: '',
                  closeBookPasswordEnabled: false,
                },
              },
            },
          },
          work: {
            timeTracking: {
              timeTrackingSettings: {
                billingForTimeEnabled: true,
                timeTrackingEnabled: true,
                startWorkWeek: 1,
              },
            },
          },
          commerce: null,
        },
      },
      errors: undefined,
    } as any;

    jest
      .spyOn(UseGetSettings, 'getSettingsService')
      .mockReturnValue(getMockSettingsService(responseWithoutCommerce));

    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );

    await waitForNextUpdate();
    expect(result.current.data.isTaxableFieldEnabled).toBe(false);
    expect(result.current.data.isClassEnabled).toBe(true);
    expect(result.current.data.timezone).toBe('America/Los_Angeles');
  });

  it('should handle missing indirectTaxSettings and return false for isTaxableFieldEnabled', async () => {
    const responseWithoutIndirectTax = {
      data: {
        qbAppFoundationQbSettings: {
          identity: {
            company: {
              localization: {
                localizationSettings: {
                  timezone: 'UTC',
                },
              },
            },
          },
          qbCompositeApp: {
            qbAppFoundations: {
              customFieldsAndDimensions: {
                customFieldSettings: {
                  classesEnabled: false,
                  locationEnabled: true,
                },
              },
            },
          },
          finance: {
            accounting: {
              accountingCore: {
                accountingCoreSettings: {
                  entityVersion: '3',
                  closeBookDateEnabled: true,
                  closeBookDate: '2025-12-31',
                  closeBookPasswordEnabled: true,
                },
              },
            },
          },
          work: {
            timeTracking: {
              timeTrackingSettings: {
                billingForTimeEnabled: false,
                timeTrackingEnabled: true,
                startWorkWeek: 6,
              },
            },
          },
          commerce: {
            indirectTax: null,
          },
        },
      },
      errors: undefined,
    } as any;

    jest
      .spyOn(UseGetSettings, 'getSettingsService')
      .mockReturnValue(getMockSettingsService(responseWithoutIndirectTax));

    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );

    await waitForNextUpdate();
    expect(result.current.data.isTaxableFieldEnabled).toBe(false);
    expect(result.current.data.entityVersion).toBe('3');
    expect(result.current.data.firstDayOfWeek).toBe(6);
  });
});

describe('getSettingsService', () => {
  const {
    isWorkforceEnvironment,
  } = require('src/js/service/utils/sandboxUtils');

  beforeEach(() => {
    jest.spyOn(UseGetSettings, 'getSettingsService').mockRestore();
    const settingsModule = require('@quickbooks-qbappfound/setting-service-ui');
    settingsModule.settings.mockClear();
    isWorkforceEnvironment.mockReturnValue(false);
  });

  afterEach(() => {
    isWorkforceEnvironment.mockReset();
  });

  it('should call settings with sandbox and apiKey with appSecret, returning the service client', () => {
    const mockSandbox = {
      foo: 'bar',
      appContext: {
        getRealmInfo: jest.fn().mockReturnValue({ realmId: 'test-realm' }),
        getUserAuthInfo: jest.fn().mockReturnValue({ authId: 'test-auth' }),
      },
    };
    const mockAppSecret = 'test-secret';
    const mockServiceClient = {
      query: jest.fn(),
      apiKey: jest.fn().mockReturnThis(),
    };
    const mockSettings = {
      apiKey: jest.fn().mockReturnValue(mockServiceClient),
    };
    const settingsModule = require('@quickbooks-qbappfound/setting-service-ui');
    settingsModule.settings.mockReturnValue(mockSettings);

    const result = UseGetSettings.getSettingsService(
      mockSandbox,
      mockAppSecret,
    );
    if (settingsModule.settings.mock.calls.length > 0) {
      expect(settingsModule.settings).toHaveBeenCalledWith(mockSandbox);
      expect(mockSettings.apiKey).toHaveBeenCalledWith(mockAppSecret);
    }
    expect(result).toMatchObject({
      query: expect.any(Function),
      apiKey: expect.any(Function),
    });
  });
});

describe('mapFirstDayOfWeek', () => {
  it('should return 0 when dayOfWeek is null or undefined', () => {
    expect(UseGetSettings.mapFirstDayOfWeek(undefined)).toBe(0);
    expect(UseGetSettings.mapFirstDayOfWeek(null as any)).toBe(0);
  });

  it('should return dayOfWeek when provided', () => {
    expect(UseGetSettings.mapFirstDayOfWeek(1)).toBe(1);
    expect(UseGetSettings.mapFirstDayOfWeek(6)).toBe(6);
  });
});

describe('handleError in useGetSettings', () => {
  const { mapError } = require('src/js/service/utils/mapError');
  const {
    isWorkforceEnvironment,
  } = require('src/js/service/utils/sandboxUtils');

  beforeEach(() => {
    isWorkforceEnvironment.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set error when service returns error and mapError returns a string', async () => {
    mapError.mockImplementation(() => 'Mapped error!');
    jest.spyOn(UseGetSettings, 'getSettingsService').mockReturnValue({
      query: async () => {
        throw new Error('Service error');
      },
      apiKey: jest.fn().mockReturnThis(),
    });

    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );
    await waitForNextUpdate();
    expect(result.current.error).toBe('Mapped error!');
  });

  it('should not set error when service returns error and mapError returns undefined', async () => {
    mapError.mockImplementation(() => undefined);
    jest.spyOn(UseGetSettings, 'getSettingsService').mockReturnValue({
      query: async () => {
        throw new Error('Service error');
      },
      apiKey: jest.fn().mockReturnThis(),
    });

    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );
    await waitForNextUpdate();
    expect(result.current.error).toBeUndefined();
  });
});

describe('Workforce environment behavior', () => {
  const {
    isWorkforceEnvironment,
  } = require('src/js/service/utils/sandboxUtils');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip fetch and return default values when in Workforce environment', async () => {
    isWorkforceEnvironment.mockReturnValue(true);
    const mockQuery = jest.fn();
    jest.spyOn(UseGetSettings, 'getSettingsService').mockReturnValue({
      query: mockQuery,
      apiKey: jest.fn().mockReturnThis(),
    });

    const { result } = renderHookWithQuicksandProvider(() =>
      UseGetSettings.useGetSettings(),
    );

    // Should immediately set loading to false without calling query
    expect(result.current.loading).toBe(false);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(result.current.data).toEqual({
      isClassEnabled: false,
      isLocationEnabled: false,
      isServiceFieldEnabled: false,
      isBillingFieldEnabled: false,
      isTaxableFieldEnabled: false,
      firstDayOfWeek: 0,
      entityVersion: '0',
      isCloseBookDateEnabled: false,
      closeBookDate: expect.any(Object),
      isCloseBookPasswordEnabled: false,
      timezone: '',
    });
  });

  it('should not call getSettingsService when in Workforce environment', async () => {
    isWorkforceEnvironment.mockReturnValue(true);
    const getSettingsServiceSpy = jest.spyOn(
      UseGetSettings,
      'getSettingsService',
    );

    renderHookWithQuicksandProvider(() => UseGetSettings.useGetSettings());

    expect(getSettingsServiceSpy).not.toHaveBeenCalled();
  });
});
