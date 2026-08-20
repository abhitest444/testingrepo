import * as Quicksand from '@payroll/quicksand';
import { buildSandbox } from '@payroll/quicksand';
import { Decision } from '@appfabric/sandbox-spec';
import {
  computeCanEditSettings,
  computeTimeTrackingOnlyUser,
  getDefaultAuthState,
  getDefaultDecision,
  useTimeTrackingBatchAuthorization,
} from 'src/js/service/utils/useTimeTrackingAuthorization';
import { Sandbox } from 'src/js/common/sandbox';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';

describe('useTimeTrackingBatchAuthorization', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    const defaultAuthState = getDefaultAuthState();
    sandbox = Quicksand.buildSandbox({
      authorizationBatchDecisions: Array.from(
        { length: Object.keys(defaultAuthState).length },
        () => getDefaultDecision(),
      ),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initially load', () => {
    const { result } = renderHookWithQuicksandProvider(
      () => useTimeTrackingBatchAuthorization(),
      sandbox,
    );

    expect(result.current.loading).toEqual(true);
  });

  test('should return default authorization state when no decisions are made', () => {
    const { result } = renderHookWithQuicksandProvider(
      () => useTimeTrackingBatchAuthorization(),
      sandbox,
    );

    expect(result.current.data).toEqual(getDefaultAuthState());
  });

  test('should handle errors correctly', () => {
    jest.spyOn(Quicksand, 'useBatchAuthorization').mockReturnValue({
      loading: undefined,
      error: new Error('Test error'),
      decisions: undefined,
    });

    const { result } = renderHookWithQuicksandProvider(() =>
      useTimeTrackingBatchAuthorization(),
    );

    expect(result.current.error).toBeDefined();
    expect(result.current.error).toEqual(
      'NLS catch.all.error.content undefined',
    );
  });
});

describe('computeTimeTrackingOnlyUser', () => {
  const testCases = [
    {
      description:
        'should return undefined when canCreateEmployee is undefined',
      authState: {},
      expected: undefined,
    },
    {
      description: 'should return undefined when obligations is undefined',
      authState: {
        canCreateEmployee: {} as Decision,
      },
      expected: undefined,
    },
    {
      description: 'should return undefined when obligations is an empty array',
      authState: {
        canCreateEmployee: { obligations: [] } as unknown as Decision,
      },
      expected: undefined,
    },
    {
      description: 'should return undefined when obligations[0] is undefined',
      authState: {
        canCreateEmployee: { obligations: [undefined] } as unknown as Decision,
      },
      expected: undefined,
    },
    {
      description:
        'should return undefined when constraint-TIME_TRACK.NAME_ID is undefined',
      authState: {
        canCreateEmployee: { obligations: [{}] } as Decision,
      },
      expected: undefined,
    },
    {
      description: 'should return the NAME_ID when it is present',
      authState: {
        canCreateEmployee: {
          obligations: [{ 'constraint-TIME_TRACK.NAME_ID': 'employee123' }],
        } as unknown as Decision,
      },
      expected: 'employee123',
    },
  ];

  test.each(testCases)('$description', ({ authState, expected }) => {
    const result = computeTimeTrackingOnlyUser(authState as any);
    expect(result).toBe(expected);
  });
});

// ============================================================================
// NEW TESTS FOR QUANTA-8403 - Workforce Support
// ============================================================================

describe('computeCanEditSettings', () => {
  describe('QBO Environment', () => {
    it('should return true when QBO user has ALL permission', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: {
          qbo: {
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
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(true);
    });

    it('should return true when QBO user has EDIT permission', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: {
          qbo: {
            context: {
              getAuthInfo: jest.fn().mockReturnValue({
                legacyPermissions: {
                  features: {
                    companyPrefs: 'EDIT',
                  },
                },
              }),
            },
          },
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(true);
    });

    it('should return false when QBO user has READ permission', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: {
          qbo: {
            context: {
              getAuthInfo: jest.fn().mockReturnValue({
                legacyPermissions: {
                  features: {
                    companyPrefs: 'READ',
                  },
                },
              }),
            },
          },
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(false);
    });

    it('should return false when companyPrefs permission is NONE', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: {
          qbo: {
            context: {
              getAuthInfo: jest.fn().mockReturnValue({
                legacyPermissions: {
                  features: {
                    companyPrefs: 'NONE',
                  },
                },
              }),
            },
          },
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(false);
    });
  });

  describe('WFS Environment (Workforce)', () => {
    it('should call sandbox.authorization.isAuthorized for WFS user', async () => {
      const isAuthorizedMock = jest.fn().mockResolvedValue({
        isAuthorized: true,
        obligations: [{ permit: ['company_prefs:update'] }],
      });

      const sandbox = {
        ...buildSandbox(),
        extensions: undefined,
        authorization: {
          isAuthorized: isAuthorizedMock,
        },
      } as any as Sandbox;

      await computeCanEditSettings(sandbox);

      expect(isAuthorizedMock).toHaveBeenCalledWith(
        { id: 'irn:intuit::platform:settings:v4' },
        { id: 'update' },
      );
    });

    it('should return true when WFS user is authorized with company_prefs:update', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: undefined,
        authorization: {
          isAuthorized: jest.fn().mockResolvedValue({
            isAuthorized: true,
            obligations: [{ permit: ['company_prefs:update'] }],
          }),
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(true);
    });

    it('should return false when WFS user authorization fails', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: undefined,
        authorization: {
          isAuthorized: jest.fn().mockResolvedValue({
            isAuthorized: false,
            obligations: [],
          }),
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(false);
    });

    it('should return false when WFS authorization result is undefined', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: undefined,
        authorization: {
          isAuthorized: jest.fn().mockResolvedValue(undefined),
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(false);
    });

    it('should return true when isAuthorized is true (obligations array is empty)', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: undefined,
        authorization: {
          isAuthorized: jest.fn().mockResolvedValue({
            isAuthorized: true,
            obligations: [],
          }),
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(true);
    });

    it('should return true when isAuthorized is true (obligations[0].permit is undefined)', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: undefined,
        authorization: {
          isAuthorized: jest.fn().mockResolvedValue({
            isAuthorized: true,
            obligations: [{ permit: undefined }],
          }),
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(true);
    });

    it('should return true when isAuthorized is true (permit does not include company_prefs:update)', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: undefined,
        authorization: {
          isAuthorized: jest.fn().mockResolvedValue({
            isAuthorized: true,
            obligations: [{ permit: ['company_prefs:read'] }],
          }),
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(true);
    });

    it('should return true when isAuthorized is true (obligations is undefined)', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: undefined,
        authorization: {
          isAuthorized: jest.fn().mockResolvedValue({
            isAuthorized: true,
            obligations: undefined,
          }),
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing sandbox.extensions.qbo gracefully', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: { qbo: undefined } as any,
        authorization: {
          isAuthorized: jest.fn().mockResolvedValue({
            isAuthorized: true,
            obligations: [{ permit: ['company_prefs:update'] }],
          }),
        },
      } as any as Sandbox;

      const result = await computeCanEditSettings(sandbox);

      expect(result).toBe(true);
    });

    it('should handle error from isAuthorized gracefully', async () => {
      const sandbox = {
        ...buildSandbox(),
        extensions: undefined,
        authorization: {
          isAuthorized: jest.fn().mockRejectedValue(new Error('Auth failed')),
        },
      } as any as Sandbox;

      await expect(computeCanEditSettings(sandbox)).rejects.toThrow(
        'Auth failed',
      );
    });
  });
});
