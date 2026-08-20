import {
  isIXPFeatureFlagEnabled,
  FEATURE_FLAG_IDENT_TYPE,
  FeatureFlagData,
} from 'src/js/service/utils/featureFlags';

describe('FEATURE_FLAG_IDENT_TYPE', () => {
  it('should have the correct enum values', () => {
    expect(FEATURE_FLAG_IDENT_TYPE.REALM_OR_COMPANY_ID).toBe(
      'REALM_OR_COMPANY_ID',
    );
    expect(FEATURE_FLAG_IDENT_TYPE.AUTH_ID).toBe('AUTH_ID');
    expect(FEATURE_FLAG_IDENT_TYPE.IVID).toBe('IVID');
  });
});

describe('isIXPFeatureFlagEnabled', () => {
  let mockSandbox: any;

  beforeEach(() => {
    mockSandbox = {
      featureFlags: {
        evaluateBooleanVariation: jest.fn(),
      },
      appContext: {
        getRealmInfo: jest.fn().mockReturnValue({ realmId: 'test-realm-id' }),
        getAppInfo: jest.fn().mockReturnValue({ appId: 'test-app-id' }),
        getEnvironment: jest.fn().mockReturnValue('prod'),
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should evaluate feature flag with correct parameters', async () => {
    const mockEvaluateBooleanVariation = jest.fn().mockResolvedValue(true);
    mockSandbox.featureFlags.evaluateBooleanVariation =
      mockEvaluateBooleanVariation;

    const result = await isIXPFeatureFlagEnabled(mockSandbox, 'test-flag');

    expect(mockEvaluateBooleanVariation).toHaveBeenCalledWith({
      entityID: {
        REALM_OR_COMPANY_ID: 'test-realm-id',
        ns: 'test-app-id',
      },
      subEnvironment: 'prod',
      flagKey: 'test-flag',
      defaultFlagValue: false,
      context: {},
      dedupPrefix: '',
      userOptions: { includeCredentials: false },
    });
    expect(result).toBe(true);
  });

  it('should handle different environments correctly', async () => {
    mockSandbox.appContext.getEnvironment = jest.fn().mockReturnValue('qa');
    const mockEvaluateBooleanVariation = jest.fn().mockResolvedValue(false);
    mockSandbox.featureFlags.evaluateBooleanVariation =
      mockEvaluateBooleanVariation;

    await isIXPFeatureFlagEnabled(mockSandbox, 'test-flag');

    expect(mockEvaluateBooleanVariation).toHaveBeenCalledWith(
      expect.objectContaining({
        subEnvironment: 'qa',
      }),
    );
  });

  it('should handle missing realm info gracefully', async () => {
    mockSandbox.appContext.getRealmInfo = jest.fn().mockReturnValue(null);
    const mockEvaluateBooleanVariation = jest.fn().mockResolvedValue(false);
    mockSandbox.featureFlags.evaluateBooleanVariation =
      mockEvaluateBooleanVariation;

    await isIXPFeatureFlagEnabled(mockSandbox, 'test-flag');

    expect(mockEvaluateBooleanVariation).toHaveBeenCalledWith(
      expect.objectContaining({
        entityID: {
          REALM_OR_COMPANY_ID: undefined,
          ns: 'test-app-id',
        },
      }),
    );
  });
});

describe('FeatureFlagData interface', () => {
  it('should have the correct structure', () => {
    const featureFlagData: FeatureFlagData = {
      isFlagEnabled: true,
      hasFlagLoaded: true,
    };

    expect(featureFlagData.isFlagEnabled).toBe(true);
    expect(featureFlagData.hasFlagLoaded).toBe(true);
  });
});
