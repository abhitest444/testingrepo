import { Environment } from '@appfabric/sandbox-spec';
import { NeoApiClient } from 'src/js/service/rest/NeoApiClient';
import {
  buildHeaders,
  getEnvFromSandbox,
} from 'src/js/service/ApolloClientBuilderUtils';

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  buildHeaders: jest.fn(),
  getEnvFromSandbox: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

describe('NeoApiClient', () => {
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
            getGatewayNeoServiceUrl: jest.fn(),
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
  });

  it('should fetch data successfully', async () => {
    const endpoint = 'preferences?minorversion=74';
    const baseURL = 'https://e2e.api.intuit.com/v3/company/realmId';
    const API_URL = `${baseURL}/${endpoint}`;
    const responseData = { data: 'test data' };

    (
      sandbox.extensions.qbo.serviceURLs.getGatewayNeoServiceUrl as jest.Mock
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

    const result = await NeoApiClient(endpoint, sandbox);

    expect(
      sandbox.extensions.qbo.serviceURLs.getGatewayNeoServiceUrl,
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
      `Component: NeoApiClient Endpoint ${API_URL} API responded status=200 intuit_tid: 123e4567-e89b-12d3-a456-426614174000`,
    );
    expect(result).toEqual(responseData);
  });

  it('should handle API error response', async () => {
    const endpoint = 'preferences?minorversion=74';
    const baseURL = 'https://e2e.api.intuit.com/v3/company/realmId';
    const API_URL = `${baseURL}/${endpoint}`;

    (
      sandbox.extensions.qbo.serviceURLs.getGatewayNeoServiceUrl as jest.Mock
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

    await expect(NeoApiClient(endpoint, sandbox)).rejects.toThrow(
      'Bad Request',
    );

    expect(
      sandbox.extensions.qbo.serviceURLs.getGatewayNeoServiceUrl,
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
      `Component: NeoApiClient Endpoint ${API_URL} API error=Bad Request intuit_tid: 123e4567-e89b-12d3-a456-426614174000`,
    );
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      `Component: NeoApiClient Endpoint ${API_URL} call failed intuit_tid: 123e4567-e89b-12d3-a456-426614174000 error: Error: Bad Request`,
    );
  });
  it('should handle network error', async () => {
    const endpoint = 'preferences?minorversion=74';
    const baseURL = 'https://e2e.api.intuit.com/v3/company/realmId';
    const API_URL = `${baseURL}/${endpoint}`;

    (
      sandbox.extensions.qbo.serviceURLs.getGatewayNeoServiceUrl as jest.Mock
    ).mockReturnValue(API_URL);
    (buildHeaders as jest.Mock).mockReturnValue({
      Authorization: 'Bearer token',
    });

    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network Error')),
    ) as jest.Mock;

    await expect(NeoApiClient(endpoint, sandbox)).rejects.toThrow(
      'Network Error',
    );

    expect(
      sandbox.extensions.qbo.serviceURLs.getGatewayNeoServiceUrl,
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
      `Component: NeoApiClient Endpoint ${API_URL} call failed intuit_tid: 123e4567-e89b-12d3-a456-426614174000 error: Error: Network Error`,
    );
  });
});

describe('NeoApiClient - WFS Support', () => {
  let sandbox: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset fetch mock
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'some data' }),
      } as Response),
    );
  });

  describe('getAPIUrl fallback for WFS', () => {
    it('should use getGatewayNeoServiceUrl when available (QBO)', async () => {
      const endpoint = 'preferences?minorversion=74';
      const mockUrl =
        'https://qbo.intuit.com/api/neo/v1/company/123/preferences?minorversion=74';

      sandbox = {
        logger: { info: jest.fn(), error: jest.fn() },
        extensions: {
          qbo: {
            serviceURLs: {
              getGatewayNeoServiceUrl: jest.fn().mockReturnValue(mockUrl),
            },
          },
        },
      };

      (buildHeaders as jest.Mock).mockReturnValue({
        Authorization: 'Bearer token',
      });

      await NeoApiClient(endpoint, sandbox);

      expect(
        sandbox.extensions.qbo.serviceURLs.getGatewayNeoServiceUrl,
      ).toHaveBeenCalledWith(endpoint);
      expect(global.fetch).toHaveBeenCalledWith(
        mockUrl,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should construct URL manually for WFS in PROD', async () => {
      const endpoint = 'preferences?minorversion=74';
      const realmId = '123456789';

      sandbox = {
        logger: { info: jest.fn(), error: jest.fn() },
        extensions: undefined,
        appContext: {
          getRealmInfo: jest.fn().mockReturnValue({ realmId }),
        },
      };

      (buildHeaders as jest.Mock).mockReturnValue({
        Authorization: 'Bearer token',
      });
      (getEnvFromSandbox as jest.Mock).mockReturnValue(Environment.PROD);

      await NeoApiClient(endpoint, sandbox);

      const expectedUrl = `https://qbo.intuit.com/api/neo/v1/company/${realmId}/${endpoint}`;
      expect(global.fetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should construct URL manually for WFS in E2E', async () => {
      const endpoint = 'preferences';
      const realmId = '987654321';

      sandbox = {
        logger: { info: jest.fn(), error: jest.fn() },
        extensions: undefined,
        appContext: {
          getRealmInfo: jest.fn().mockReturnValue({ realmId }),
        },
      };

      (buildHeaders as jest.Mock).mockReturnValue({
        Authorization: 'Bearer token',
      });
      (getEnvFromSandbox as jest.Mock).mockReturnValue(Environment.E2E);

      await NeoApiClient(endpoint, sandbox);

      const expectedUrl = `https://e2e.qbo.intuit.com/api/neo/v1/company/${realmId}/${endpoint}`;
      expect(global.fetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should construct URL manually for WFS in QA', async () => {
      const endpoint = 'settings';
      const realmId = '111222333';

      sandbox = {
        logger: { info: jest.fn(), error: jest.fn() },
        extensions: undefined,
        appContext: {
          getRealmInfo: jest.fn().mockReturnValue({ realmId }),
        },
      };

      (buildHeaders as jest.Mock).mockReturnValue({
        Authorization: 'Bearer token',
      });
      (getEnvFromSandbox as jest.Mock).mockReturnValue(Environment.QA);

      await NeoApiClient(endpoint, sandbox);

      const expectedUrl = `https://qal.qbo.intuit.com/api/neo/v1/company/${realmId}/${endpoint}`;
      expect(global.fetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should construct URL manually for WFS in PERF', async () => {
      const endpoint = 'data';
      const realmId = '444555666';

      sandbox = {
        logger: { info: jest.fn(), error: jest.fn() },
        extensions: undefined,
        appContext: {
          getRealmInfo: jest.fn().mockReturnValue({ realmId }),
        },
      };

      (buildHeaders as jest.Mock).mockReturnValue({
        Authorization: 'Bearer token',
      });
      (getEnvFromSandbox as jest.Mock).mockReturnValue(Environment.PERF);

      await NeoApiClient(endpoint, sandbox);

      const expectedUrl = `https://prf.qbo.intuit.com/api/neo/v1/company/${realmId}/${endpoint}`;
      expect(global.fetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should use default E2E URL for unknown environment', async () => {
      const endpoint = 'test';
      const realmId = '777888999';

      sandbox = {
        logger: { info: jest.fn(), error: jest.fn() },
        extensions: undefined,
        appContext: {
          getRealmInfo: jest.fn().mockReturnValue({ realmId }),
        },
      };

      (buildHeaders as jest.Mock).mockReturnValue({
        Authorization: 'Bearer token',
      });
      (getEnvFromSandbox as jest.Mock).mockReturnValue('UNKNOWN' as any);

      await NeoApiClient(endpoint, sandbox);

      const expectedUrl = `https://e2e.qbo.intuit.com/api/neo/v1/company/${realmId}/${endpoint}`;
      expect(global.fetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should get realmId from appContext for WFS', async () => {
      const endpoint = 'preferences';
      const realmId = 'WFS_REALM_ID';
      const getRealmInfoMock = jest.fn().mockReturnValue({ realmId });

      sandbox = {
        logger: { info: jest.fn(), error: jest.fn() },
        extensions: undefined,
        appContext: {
          getRealmInfo: getRealmInfoMock,
        },
      };

      (buildHeaders as jest.Mock).mockReturnValue({
        Authorization: 'Bearer token',
      });
      (getEnvFromSandbox as jest.Mock).mockReturnValue(Environment.E2E);

      await NeoApiClient(endpoint, sandbox);

      expect(getRealmInfoMock).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(realmId),
        expect.any(Object),
      );
    });

    it('should use DEFAULT_REALM when realmId is unavailable', async () => {
      const endpoint = 'preferences';

      sandbox = {
        logger: { info: jest.fn(), error: jest.fn() },
        extensions: undefined,
        appContext: {
          getRealmInfo: jest.fn().mockReturnValue(undefined),
        },
      };

      (buildHeaders as jest.Mock).mockReturnValue({
        Authorization: 'Bearer token',
      });
      (getEnvFromSandbox as jest.Mock).mockReturnValue(Environment.E2E);

      await NeoApiClient(endpoint, sandbox);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('DEFAULT_REALM'),
        expect.any(Object),
      );
    });
  });
});
