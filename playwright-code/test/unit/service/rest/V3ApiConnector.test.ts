import { v4 as uuidv4 } from 'uuid';
import { V3ApiConnector } from 'src/js/service/rest/V3ApiConnector';
import {
  buildHeaders,
  getEnvFromSandbox,
  getQBOV3BaseUrl,
} from 'src/js/service/ApolloClientBuilderUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  buildHeaders: jest.fn(),
  getEnvFromSandbox: jest.fn(() => 'e2e'),
  getQBOV3BaseUrl: jest.fn(() => 'https://e2e.qbo.intuit.com/api/v3'),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

describe('V3ApiConnector', () => {
  let sandbox: any;

  beforeEach(() => {
    sandbox = {
      logger: {
        info: jest.fn(),
        error: jest.fn(),
      },
      extensions: {
        qbo: {
          serviceURLs: {
            getGatewayV3ServiceUrl: jest.fn(),
          },
        },
      },
    };

    // Reset fetch mock before each test
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'some data' }),
      } as Response),
    );

    // Default to QBO environment (not Workforce)
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
  });

  it('should fetch data successfully', async () => {
    const endpoint = 'preferences?minorversion=74';
    const baseURL = 'https://e2e.api.intuit.com/v3/company/realmId';
    const API_URL = `${baseURL}/${endpoint}`;
    const responseData = { data: 'test data' };

    (
      sandbox.extensions.qbo.serviceURLs.getGatewayV3ServiceUrl as jest.Mock
    ).mockReturnValue(API_URL);
    (buildHeaders as jest.Mock).mockReturnValue({
      Authorization: 'Bearer token',
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseData),
      }),
    ) as jest.Mock;

    const result = await V3ApiConnector(endpoint, sandbox);

    expect(
      sandbox.extensions.qbo.serviceURLs.getGatewayV3ServiceUrl,
    ).toHaveBeenCalledWith(endpoint);
    expect(buildHeaders).toHaveBeenCalledWith(sandbox);
    expect(global.fetch).toHaveBeenCalledWith(API_URL, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
        intuit_tid: '123e4567-e89b-12d3-a456-426614174000',
      },
      credentials: 'include',
    });
    expect(sandbox.logger.info).toHaveBeenCalledWith(
      `API is called=${API_URL}`,
    );
    expect(sandbox.logger.info).toHaveBeenCalledWith(
      `Component: V3ApiConnector Endpoint ${API_URL} API responded status=200 intuit_tid: 123e4567-e89b-12d3-a456-426614174000`,
    );
    expect(result).toEqual(responseData);
  });

  it('should handle API error response', async () => {
    const endpoint = 'preferences?minorversion=74';
    const baseURL = 'https://e2e.api.intuit.com/v3/company/realmId';
    const API_URL = `${baseURL}/${endpoint}`;

    (
      sandbox.extensions.qbo.serviceURLs.getGatewayV3ServiceUrl as jest.Mock
    ).mockReturnValue(API_URL);
    (buildHeaders as jest.Mock).mockReturnValue({
      Authorization: 'Bearer token',
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      }),
    ) as jest.Mock;

    await expect(V3ApiConnector(endpoint, sandbox)).rejects.toThrow(
      'Bad Request',
    );

    expect(
      sandbox.extensions.qbo.serviceURLs.getGatewayV3ServiceUrl,
    ).toHaveBeenCalledWith(endpoint);
    expect(buildHeaders).toHaveBeenCalledWith(sandbox);
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
        intuit_tid: '123e4567-e89b-12d3-a456-426614174000',
      },
      credentials: 'include',
    });
    expect(sandbox.logger.info).toHaveBeenNthCalledWith(
      1,
      `API is called=${API_URL}`,
    );
    expect(sandbox.logger.info).toHaveBeenNthCalledWith(
      2,
      `Component: V3ApiConnector Endpoint ${API_URL} API error=Bad Request intuit_tid: 123e4567-e89b-12d3-a456-426614174000`,
    );
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      `Component: V3ApiConnector Endpoint ${API_URL} call failed intuit_tid: 123e4567-e89b-12d3-a456-426614174000 error: Error: Bad Request`,
    );
  });
  it('should handle network error', async () => {
    const endpoint = 'preferences?minorversion=74';
    const baseURL = 'https://e2e.api.intuit.com/v3/company/realmId';
    const API_URL = `${baseURL}/${endpoint}`;

    (
      sandbox.extensions.qbo.serviceURLs.getGatewayV3ServiceUrl as jest.Mock
    ).mockReturnValue(API_URL);
    (buildHeaders as jest.Mock).mockReturnValue({
      Authorization: 'Bearer token',
    });

    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network Error')),
    ) as jest.Mock;

    await expect(V3ApiConnector(endpoint, sandbox)).rejects.toThrow(
      'Network Error',
    );

    expect(
      sandbox.extensions.qbo.serviceURLs.getGatewayV3ServiceUrl,
    ).toHaveBeenCalledWith(endpoint);
    expect(buildHeaders).toHaveBeenCalledWith(sandbox);
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
        intuit_tid: '123e4567-e89b-12d3-a456-426614174000',
      },
      credentials: 'include',
    });
    expect(sandbox.logger.info).toHaveBeenCalledWith(
      `API is called=${API_URL}`,
    );
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      `Component: V3ApiConnector Endpoint ${API_URL} call failed intuit_tid: 123e4567-e89b-12d3-a456-426614174000 error: Error: Network Error`,
    );
  });

  it('should use WFS fallback URL construction when QBO extension is not available', async () => {
    const endpoint = 'preferences?minorversion=74';
    const expectedBaseUrl = 'https://e2e.qbo.intuit.com/api/v3';
    const expectedRealmId = 'testRealmId';
    const expectedApiUrl = `${expectedBaseUrl}/company/${expectedRealmId}/${endpoint}`;
    const responseData = { data: 'wfs data' };

    // Mock Workforce environment
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

    // Simulate WFS environment where qbo extension is not available
    const wfsSandbox = {
      logger: {
        info: jest.fn(),
        error: jest.fn(),
      },
      extensions: {
        qbo: undefined,
      },
      appContext: {
        getRealmInfo: jest.fn().mockReturnValue({ realmId: expectedRealmId }),
        getEnvironment: jest.fn().mockReturnValue('e2e'),
        getAppInfo: jest
          .fn()
          .mockReturnValue({ appId: 'payroll-employee-portal-experience' }),
      },
    };

    (buildHeaders as jest.Mock).mockReturnValue({
      Authorization: 'Bearer token',
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseData),
      }),
    ) as jest.Mock;

    const result = await V3ApiConnector(endpoint, wfsSandbox);

    expect(wfsSandbox.appContext.getRealmInfo).toHaveBeenCalled();
    expect(buildHeaders).toHaveBeenCalledWith(wfsSandbox);
    expect(global.fetch).toHaveBeenCalledWith(expectedApiUrl, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
        intuit_tid: '123e4567-e89b-12d3-a456-426614174000',
      },
      credentials: 'include',
    });
    expect(wfsSandbox.logger.info).toHaveBeenCalledWith(
      `API is called=${expectedApiUrl}`,
    );
    expect(wfsSandbox.logger.info).toHaveBeenCalledWith(
      `Component: V3ApiConnector Endpoint ${expectedApiUrl} API responded status=200 intuit_tid: 123e4567-e89b-12d3-a456-426614174000`,
    );
    expect(result).toEqual(responseData);
  });

  it('should use default realmId if appContext.getRealmInfo() is null in WFS', async () => {
    const endpoint = 'preferences?minorversion=74';
    const expectedBaseUrl = 'https://e2e.qbo.intuit.com/api/v3';
    const expectedRealmId = 'DEFAULT_REALM';
    const expectedApiUrl = `${expectedBaseUrl}/company/${expectedRealmId}/${endpoint}`;
    const responseData = { data: 'wfs data' };

    // Mock Workforce environment
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

    // Simulate WFS environment with no realm info
    const wfsSandbox = {
      logger: {
        info: jest.fn(),
        error: jest.fn(),
      },
      extensions: {
        qbo: undefined,
      },
      appContext: {
        getRealmInfo: jest.fn().mockReturnValue(null),
        getEnvironment: jest.fn().mockReturnValue('e2e'),
        getAppInfo: jest
          .fn()
          .mockReturnValue({ appId: 'payroll-employee-portal-experience' }),
      },
    };

    (buildHeaders as jest.Mock).mockReturnValue({
      Authorization: 'Bearer token',
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseData),
      }),
    ) as jest.Mock;

    const result = await V3ApiConnector(endpoint, wfsSandbox);

    expect(wfsSandbox.appContext.getRealmInfo).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      expectedApiUrl,
      expect.any(Object),
    );
    expect(result).toEqual(responseData);
  });

  it('should handle API error response in WFS fallback', async () => {
    const endpoint = 'preferences?minorversion=74';
    const expectedBaseUrl = 'https://e2e.qbo.intuit.com/api/v3';
    const expectedRealmId = 'testRealmId';
    const expectedApiUrl = `${expectedBaseUrl}/company/${expectedRealmId}/${endpoint}`;

    // Mock Workforce environment
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

    // Simulate WFS environment with API error
    const wfsSandbox = {
      logger: {
        info: jest.fn(),
        error: jest.fn(),
      },
      extensions: {
        qbo: undefined,
      },
      appContext: {
        getRealmInfo: jest.fn().mockReturnValue({ realmId: expectedRealmId }),
        getEnvironment: jest.fn().mockReturnValue('e2e'),
        getAppInfo: jest
          .fn()
          .mockReturnValue({ appId: 'payroll-employee-portal-experience' }),
      },
    };

    (buildHeaders as jest.Mock).mockReturnValue({
      Authorization: 'Bearer token',
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'WFS Bad Request',
      }),
    ) as jest.Mock;

    await expect(V3ApiConnector(endpoint, wfsSandbox)).rejects.toThrow(
      'WFS Bad Request',
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expectedApiUrl,
      expect.any(Object),
    );
    expect(wfsSandbox.logger.error).toHaveBeenCalledWith(
      `Component: V3ApiConnector Endpoint ${expectedApiUrl} call failed intuit_tid: 123e4567-e89b-12d3-a456-426614174000 error: Error: WFS Bad Request`,
    );
  });

  it.each([
    ['prod', 'https://qbo.intuit.com/api/v3'],
    ['qa', 'https://qal.qbo.intuit.com/api/v3'],
    ['perf', 'https://prf.qbo.intuit.com/api/v3'],
  ])(
    'should use correct URL for %s environment in WFS',
    async (env, expectedBaseUrl) => {
      const endpoint = 'preferences?minorversion=74';
      const expectedRealmId = 'testRealmId';
      const expectedApiUrl = `${expectedBaseUrl}/company/${expectedRealmId}/${endpoint}`;

      // Mock Workforce environment
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
      (getEnvFromSandbox as jest.Mock).mockReturnValueOnce(env);
      (getQBOV3BaseUrl as jest.Mock).mockReturnValueOnce(expectedBaseUrl);

      const wfsSandbox = {
        logger: {
          info: jest.fn(),
          error: jest.fn(),
        },
        extensions: {
          qbo: undefined,
        },
        appContext: {
          getRealmInfo: jest.fn().mockReturnValue({ realmId: expectedRealmId }),
          getEnvironment: jest.fn().mockReturnValue(env),
          getAppInfo: jest
            .fn()
            .mockReturnValue({ appId: 'payroll-employee-portal-experience' }),
        },
      };

      (buildHeaders as jest.Mock).mockReturnValue({
        Authorization: 'Bearer token',
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: `${env} data` }),
        }),
      ) as jest.Mock;

      await V3ApiConnector(endpoint, wfsSandbox);

      expect(global.fetch).toHaveBeenCalledWith(
        expectedApiUrl,
        expect.any(Object),
      );
    },
  );
});
