import { Environment } from '@appfabric/sandbox-spec';
import { buildSandbox } from '@payroll/quicksand';
import {
  buildAuthHeader,
  buildHeaders,
  getAppSecret,
  getCsrfHeader,
  getEnvFromSandbox,
  getGASContext,
  getQbTimeTrackingContext,
  getRegion,
  getRegionHeader,
  userAndCompanyIdHeader,
} from 'src/js/service/ApolloClientBuilderUtils';
import { Sandbox } from '../../../src/js/common/sandbox';

describe('Header and Context Utilities', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = buildSandbox();
    sandbox = {
      ...sandbox,
      pluginConfig: {
        extendedProperties: {
          appSecret: 'test-secret',
        },
      },
    } as unknown as Sandbox;
  });

  test('getEnvFromSandbox should return the environment PROD', () => {
    sandbox.appContext.getEnvironment = jest
      .fn()
      .mockReturnValue(Environment.PROD);
    expect(getEnvFromSandbox(sandbox)).toBe(Environment.PROD);
  });

  test('buildAuthHeader should return the correct authorization header', () => {
    const expectedHeader = {
      Authorization:
        'Intuit_APIKey intuit_apikey=test-secret,intuit_apikey_version=1.0',
    };
    expect(buildAuthHeader(sandbox)).toEqual(expectedHeader);
  });

  test('buildHeaders should return the correct headers', () => {
    const expectedHeaders = {
      Authorization:
        'Intuit_APIKey intuit_apikey=test-secret,intuit_apikey_version=1.0',
      'content-type': 'application/json;charset=UTF-8',
      accept: 'application/json;charset=UTF-8',
      'intuit-user-id': '123456',
      'intuit-company-id': '123456',
      intuit_country: 'US',
      'x-csrf-token': 'fake-sandbox',
      'intuit-plugin-id': 'time-tracking-ui',
    };
    expect(buildHeaders(sandbox)).toEqual(expectedHeaders);
  });

  test('getRegionHeader should return the correct region header', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: 'CA' });
    expect(getRegionHeader(sandbox)).toEqual({ intuit_country: 'CA' });
  });

  test('userAndCompanyIdHeader should return the correct user and company ID headers', () => {
    sandbox.appContext.getRealmInfo = jest
      .fn()
      .mockReturnValue({ realmId: 'realm-id' });
    sandbox.appContext.getUserAuthInfo = jest
      .fn()
      .mockReturnValue({ authId: 'auth-id' });
    expect(userAndCompanyIdHeader(sandbox)).toEqual({
      'intuit-user-id': 'auth-id',
      'intuit-company-id': 'realm-id',
    });
  });

  test('getCsrfHeader should return the CSRF token from the sandbox', () => {
    sandbox.extensions.qbo.context.getEnvironmentInfo = jest
      .fn()
      .mockReturnValue({ xCsrfToken: 'testCsrfToken' });
    expect(getCsrfHeader(sandbox)).toEqual({
      'x-csrf-token': 'testCsrfToken',
    });

    // ensure an undefined value is handled OK
    sandbox.extensions.qbo.context.getEnvironmentInfo = jest
      .fn()
      .mockReturnValue({ someOtherKey: 'someOtherValue' });
    expect(getCsrfHeader(sandbox)).toEqual({
      'x-csrf-token': '',
    });
  });

  test('getRegion should return the correct region', () => {
    sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
      .fn()
      .mockReturnValue({ region: 'CA' });
    expect(getRegion(sandbox)).toBe('CA');
  });

  test('getQbTimeTrackingContext should return the correct URL based on environment', () => {
    sandbox.appContext.getEnvironment = jest
      .fn()
      .mockReturnValue(Environment.PROD);
    expect(getQbTimeTrackingContext(sandbox)).toBe(
      'https://qb-time-tracking.api.intuit.com/graphql',
    );
  });

  test('getGASContext should return the correct URL based on environment', () => {
    sandbox.appContext.getEnvironment = jest
      .fn()
      .mockReturnValue(Environment.PROD);
    expect(getGASContext(sandbox)).toBe(
      'https://api.qbo.onlinepayroll.intuit.com/graphql',
    );
  });

  test('getAppSecret should return the app secret', () => {
    expect(getAppSecret(sandbox)).toBe('test-secret');
  });

  it('should handle different environment configurations correctly prod', () => {
    const sandboxMock = buildSandbox();
    sandboxMock.appContext.getEnvironment = () => Environment.QA;
    expect(buildAuthHeader(sandboxMock)).toBeDefined();
  });

  it('should handle different environment configurations correctly prod', () => {
    const sandboxMock = buildSandbox();
    sandboxMock.appContext.getEnvironment = () => Environment.E2E;
    expect(buildAuthHeader(sandboxMock)).toBeDefined();
  });
});
