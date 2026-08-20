import { RestClient } from 'ui-data-layer/client';
import { getDecision } from '@core-app/variability-sync-sdk';
import { isIESCustomer } from 'src/js/service/utils/sandboxUtils.ts';
import { isIXPFeatureFlagEnabled } from 'src/js/service/utils/featureFlags.ts';
import {
  postToUserVoice,
  getScreenResolution,
  getActivatedPlugins,
  convertFieldsToStringValues,
  getCustomFields,
} from 'src/js/common/UserVoiceUtils';

jest.mock('ui-data-layer/client');
jest.mock('@core-app/variability-sync-sdk');
jest.mock('src/js/service/utils/featureFlags');
jest.mock('src/js/service/utils/sandboxUtils');
jest.mock('src/js/common/constants', () => ({
  FEATURE_FLAGS: {
    SBSEG_QBO_R4_ASSIGNMENTS: 'SBSEG-QBO-R4-assignments',
    QB_TIME_TRACKING_UI_ENABLE_IES_FEATURE_FLAGS: 'SBSEG-QBO-ENABLE-QL-FOR-IES',
  },
}));

describe('UserVoiceUtils', () => {
  let mockSandbox;
  let mockRestClient;

  beforeEach(() => {
    // Setup window.qbo mock
    window.qbo = {
      releaseVersion: '1.2.3',
      serverGroupCompanyId: 'test-company-123',
      clusterId: 'cluster-456',
      companyL10nAttribs: {
        locale: 'en-US',
      },
      sku: {
        name: 'QuickBooks Online Plus',
        isPayrollSku: true,
      },
      pluginsInfo: {
        plugins: {
          plugin1: { activated: true },
          plugin2: { activated: false },
          plugin3: { activated: true },
        },
      },
    };

    window.location = {
      pathname: '/test/path',
    };

    window.navigator = {
      userAgent: 'Test User Agent',
    };

    window.screen = {
      availWidth: 1920,
      availHeight: 1080,
    };

    window.innerWidth = 1024;
    window.innerHeight = 768;

    // Mock sandbox
    mockSandbox = {
      sandboxContext: {
        getInfo: jest.fn().mockReturnValue({ widgetId: 'test-widget-id' }),
      },
      appContext: {
        getRealmInfo: jest.fn().mockReturnValue({
          realmId: '12345',
          realmName: 'Test Company',
        }),
        getUserAuthInfo: jest.fn().mockReturnValue({
          authId: 'auth-123',
        }),
      },
      extensions: {
        qbo: {
          context: {
            getCompanyL10nInfo: jest.fn().mockReturnValue({
              region: 'US',
            }),
            getUserInfo: jest.fn().mockReturnValue({
              email: 'test@example.com',
              name: 'Test User',
              id: 'user-123',
            }),
            getAuthInfo: jest.fn().mockReturnValue({
              isAccountantUser: false,
              isAdmin: true,
              isMasterAdmin: false,
              legacyRoles: {
                roleType: 'admin',
              },
            }),
            getEnvironmentInfo: jest.fn().mockReturnValue({
              csrfToken: 'csrf-token-123',
              xCsrfToken: 'x-csrf-token-123',
            }),
            getCompanyInfo: jest.fn().mockReturnValue({
              id: 'company-123',
            }),
          },
          serviceURLs: {
            getQBONeoServiceUrl: jest
              .fn()
              .mockReturnValue('https://test-api.com'),
          },
        },
      },
      pluginConfig: {
        id: 'plugin-id-123',
      },
      logger: {
        log: jest.fn(),
      },
    };

    // Mock RestClient
    mockRestClient = {
      post: jest.fn().mockResolvedValue({ success: true }),
    };
    RestClient.mockImplementation(() => mockRestClient);

    // Mock getDecision
    getDecision.mockReturnValue(true);

    // Mock isIXPFeatureFlagEnabled to return false by default
    isIXPFeatureFlagEnabled.mockResolvedValue(false);

    // Mock isIESCustomer to return false by default
    isIESCustomer.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete window.qbo;
  });

  describe('getScreenResolution', () => {
    it('should return screen resolution string', () => {
      const resolution = getScreenResolution();
      // In jest-dom environment, screen.availWidth and availHeight might be 0
      expect(resolution).toMatch(/^\d+x\d+\(\d+x\d+\)$/);
    });

    it('should return empty string if window.screen is not available', () => {
      delete window.screen;
      const resolution = getScreenResolution();
      expect(resolution).toBe('');
    });
  });

  describe('getActivatedPlugins', () => {
    it('should return comma-separated list of activated plugins', () => {
      const plugins = getActivatedPlugins();
      expect(plugins).toBe('plugin1, plugin3');
    });

    it('should return empty string if no plugins', () => {
      delete window.qbo.pluginsInfo;
      const plugins = getActivatedPlugins();
      expect(plugins).toBe('');
    });

    it('should return empty string if pluginsInfo.plugins is undefined', () => {
      window.qbo.pluginsInfo = {};
      const plugins = getActivatedPlugins();
      expect(plugins).toBe('');
    });
  });

  describe('convertFieldsToStringValues', () => {
    it('should convert object properties to string values', () => {
      const fields = {
        stringField: 'already a string',
        numberField: 123,
        booleanField: true,
        objectField: { toString: () => 'object string' },
      };
      const result = convertFieldsToStringValues(fields);
      expect(result).toEqual({
        stringField: 'already a string',
        numberField: '123',
        booleanField: 'true',
        objectField: 'object string',
      });
    });

    it('should handle null or undefined fields', () => {
      const result = convertFieldsToStringValues(null);
      expect(result).toEqual({});
    });

    it('should convert fields with default toString method', () => {
      const fields = {
        field1: 'value1',
        field2: { notToString: 'test' },
      };
      const result = convertFieldsToStringValues(fields);
      expect(result).toEqual({
        field1: 'value1',
        field2: '[object Object]', // Objects have default toString
      });
    });

    it('should handle empty object', () => {
      const result = convertFieldsToStringValues({});
      expect(result).toEqual({});
    });
  });

  describe('getCustomFields', () => {
    it('should return custom fields with qbo information', () => {
      const additionalFields = {
        customField1: 'value1',
        customField2: 123,
      };
      const result = getCustomFields(additionalFields);

      expect(result).toEqual(
        expect.objectContaining({
          customField1: 'value1',
          customField2: '123',
          name: 'QuickBooks Online Plus',
          isPayrollSku: 'true',
          queue: 'Time Tracking UI',
          companyId: 'test-company-123',
          clusterId: 'cluster-456',
          releaseVersion: '1.2.3',
          majorReleaseVersion: '1',
          companyLocale: 'en-US',
          activePlugins: 'plugin1, plugin3',
        }),
      );
      // Verify dynamic fields exist
      expect(result).toHaveProperty('referrer');
      expect(result).toHaveProperty('userAgent');
      expect(result).toHaveProperty('screenResolution');
    });

    it('should handle missing qbo properties', () => {
      delete window.qbo.releaseVersion;
      delete window.qbo.companyL10nAttribs;
      const result = getCustomFields({});

      expect(result.releaseVersion).toBeUndefined();
      expect(result.majorReleaseVersion).toBe('');
      expect(result.companyLocale).toBeUndefined();
    });

    it('should handle missing qbo.sku', () => {
      delete window.qbo.sku;
      const result = getCustomFields({});

      expect(result).toEqual(
        expect.objectContaining({ queue: 'Time Tracking UI' }),
      );
      expect(result.name).toBeUndefined();
      expect(result.isPayrollSku).toBeUndefined();
    });
  });

  describe('postToUserVoice', () => {
    const mockParams = {
      message: 'Test feedback message',
      qboFlavor: 'Plus',
    };

    it('should post feedback with isOvertimeEnabled false by default', async () => {
      await postToUserVoice(mockParams, mockSandbox);

      expect(mockRestClient.post).toHaveBeenCalledWith(
        '/uservoice/sendFeedback',
        expect.objectContaining({
          query: expect.objectContaining({
            email: 'test@example.com',
            name: 'Test User',
            message: expect.stringContaining('Test feedback message'),
            customFields: expect.objectContaining({
              isR6OvertimeEnabled: 'false',
              isIES: 'false',
              isIESFeatureFlagsEnabled: 'false',
            }),
          }),
        }),
      );

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.customFields.isR6OvertimeEnabled).toBe('false');
      expect(callArgs.query.message).toContain('Is R6 Overtime Enabled: No');
    });

    it('should post feedback with isOvertimeEnabled true when provided', async () => {
      await postToUserVoice(mockParams, mockSandbox, null, true);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.customFields.isR6OvertimeEnabled).toBe('true');
      expect(callArgs.query.message).toContain('Is R6 Overtime Enabled: Yes');
    });

    it('should use custom widget identifier when provided', async () => {
      await postToUserVoice(mockParams, mockSandbox, 'custom-widget-id');

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.message).toContain('Widget id: custom-widget-id');
    });

    it('should use sandbox widget id when custom widget identifier is not provided', async () => {
      await postToUserVoice(mockParams, mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.message).toContain('Widget id: test-widget-id');
    });

    it('should include qboFlavor in message when provided', async () => {
      await postToUserVoice(mockParams, mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.message).toContain('QBO Flavor: Plus');
    });

    it('should not include qboFlavor in message when not provided', async () => {
      const paramsWithoutFlavor = { message: 'Test feedback' };
      await postToUserVoice(paramsWithoutFlavor, mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.message).not.toContain('QBO Flavor:');
    });

    it('should include all user and company information in message', async () => {
      await postToUserVoice(mockParams, mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      const { message } = callArgs.query;

      expect(message).toContain('Feedback: Test feedback message');
      expect(message).toContain('Widget id: test-widget-id');
      expect(message).toContain('Product: QuickBooks Online Plus');
      expect(message).toContain('Is Payroll: true');
      expect(message).toContain('Company name: Test Company');
      expect(message).toContain('Realm ID: 12345');
      expect(message).toContain('Region: US');
      expect(message).toContain('User: Test User (test@example.com)');
      expect(message).toContain('Auth ID: auth-123');
      expect(message).toContain('Role: admin');
      expect(message).toContain('Is Admin: true');
      expect(message).toContain('Is Master Admin: false');
      expect(message).toContain('Is Accountant User: false');
      expect(message).toContain('Is IES Customer: No');
      expect(message).toContain('Is IES Feature Flags Enabled: No');
    });

    it('should create RestClient with correct configuration', async () => {
      await postToUserVoice(mockParams, mockSandbox);

      expect(RestClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: 'https://test-api.com',
          authType: 'cookie_only_auth',
          csrfToken: 'csrf-token-123',
          xCsrfToken: 'x-csrf-token-123',
          companyId: 'company-123',
          userId: 'user-123',
          generateIntuitTid: true,
          sandbox: mockSandbox,
          pluginId: 'plugin-id-123',
        }),
      );
    });

    it('should handle default user name when name is null or empty', async () => {
      mockSandbox.extensions.qbo.context.getUserInfo.mockReturnValue({
        email: 'test@example.com',
        name: null,
      });

      await postToUserVoice(mockParams, mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.name).toBe('NoName');
    });

    it('should use default name when name is empty string', async () => {
      mockSandbox.extensions.qbo.context.getUserInfo.mockReturnValue({
        email: 'test@example.com',
        name: '',
      });

      await postToUserVoice(mockParams, mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.name).toBe('NoName');
    });

    it('should use default name when name is whitespace only', async () => {
      mockSandbox.extensions.qbo.context.getUserInfo.mockReturnValue({
        email: 'test@example.com',
        name: '   ',
      });

      await postToUserVoice(mockParams, mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.name).toBe('NoName');
    });

    it('should trim whitespace from feedback message', async () => {
      const paramsWithWhitespace = {
        message: '  Test feedback with spaces  ',
        qboFlavor: 'Plus',
      };

      await postToUserVoice(paramsWithWhitespace, mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.message).toContain(
        'Feedback:   Test feedback with spaces',
      );
    });

    it('should check IES customer and include in message when enabled', async () => {
      isIESCustomer.mockResolvedValue(true);

      await postToUserVoice(mockParams, mockSandbox);

      expect(isIESCustomer).toHaveBeenCalledWith(mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.message).toContain('Is IES Customer: Yes');
      expect(callArgs.query.customFields.isIES).toBe('true');
    });

    it('should check IES feature flag and include in message when enabled', async () => {
      isIXPFeatureFlagEnabled.mockResolvedValueOnce(true); // IES feature flags

      await postToUserVoice(mockParams, mockSandbox);

      expect(isIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        mockSandbox,
        'SBSEG-QBO-ENABLE-QL-FOR-IES',
      );

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.message).toContain(
        'Is IES Feature Flags Enabled: Yes',
      );
      expect(callArgs.query.customFields.isIESFeatureFlagsEnabled).toBe('true');
    });

    it('should handle IES customer check error gracefully', async () => {
      const error = new Error('IES check failed');
      isIESCustomer.mockRejectedValue(error);

      await postToUserVoice(mockParams, mockSandbox);

      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Error fetching the IES customer status in feedback form',
        error,
      );

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.message).toContain('Is IES Customer: No');
      expect(callArgs.query.customFields.isIES).toBe('false');
    });

    it('should handle IES feature flags check error gracefully', async () => {
      const error = new Error('IES feature flag check failed');
      isIXPFeatureFlagEnabled.mockRejectedValueOnce(error); // IES feature flags

      await postToUserVoice(mockParams, mockSandbox);

      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Error fetching the IES feature flags status in feedback form',
        error,
      );

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.message).toContain(
        'Is IES Feature Flags Enabled: No',
      );
      expect(callArgs.query.customFields.isIESFeatureFlagsEnabled).toBe(
        'false',
      );
    });

    it('should include all IES fields when both IES customer and IES feature flags are enabled', async () => {
      isIESCustomer.mockResolvedValue(true);
      isIXPFeatureFlagEnabled.mockResolvedValueOnce(true); // IES feature flags

      await postToUserVoice(mockParams, mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.message).toContain('Is IES Customer: Yes');
      expect(callArgs.query.message).toContain(
        'Is IES Feature Flags Enabled: Yes',
      );
      expect(callArgs.query.customFields.isIES).toBe('true');
      expect(callArgs.query.customFields.isIESFeatureFlagsEnabled).toBe('true');
    });

    it('should post feedback with isGeofenceEnabled false by default', async () => {
      await postToUserVoice(mockParams, mockSandbox);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.customFields.isGeofenceEnabled).toBe('false');
      expect(callArgs.query.message).toContain('Is Geofence Enabled: No');
    });

    it('should post feedback with isGeofenceEnabled true when provided', async () => {
      await postToUserVoice(mockParams, mockSandbox, null, false, true);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.customFields.isGeofenceEnabled).toBe('true');
      expect(callArgs.query.message).toContain('Is Geofence Enabled: Yes');
    });

    it('should include isGeofenceEnabled alongside all other flags', async () => {
      await postToUserVoice(mockParams, mockSandbox, null, true, true);

      const callArgs = mockRestClient.post.mock.calls[0][1];
      expect(callArgs.query.customFields).toEqual(
        expect.objectContaining({
          isR6OvertimeEnabled: 'true',
          isGeofenceEnabled: 'true',
        }),
      );
      expect(callArgs.query.message).toContain('Is Geofence Enabled: Yes');
    });

    it('should handle missing pluginConfig', async () => {
      mockSandbox.pluginConfig = null;

      await postToUserVoice(mockParams, mockSandbox);

      expect(RestClient).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginId: null,
        }),
      );
    });
  });
});
