// @ts-ignore
import { getApolloClient } from '@appfabric/ui-data-layer/apollo';
import {
  getV4ApolloClient,
  resetApolloQboClient,
} from '../../../src/js/service/V4ApolloClientBuilder';
import { Sandbox } from '../../../src/js/common/sandbox';

jest.mock('@appfabric/ui-data-layer/apollo', () => ({
  getApolloClient: jest.fn().mockReturnValue({}),
}));

describe('getV4ApolloClient', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {
      /* mock sandbox object */
    } as Sandbox;
    (getApolloClient as jest.Mock).mockClear();
  });

  afterEach(() => {
    resetApolloQboClient();
  });

  it('should return a new Apollo client instance when called for the first time', () => {
    const client = getV4ApolloClient(sandbox);
    expect(getApolloClient).toHaveBeenCalledTimes(1);
    expect(getApolloClient).toHaveBeenCalledWith(sandbox, {
      domain: 'qbo',
      pluginId: 'time-tracking-ui',
      customHeaders: {
        accept: 'application/json;charset=UTF-8;version=2.1.6',
        'content-type': 'application/json;version=2.1.6;charset=utf-8',
      },
      cache: expect.any(Object),
    });
    expect(client).toBeDefined();
  });

  it('should return the existing Apollo client instance when called subsequently', () => {
    const client1 = getV4ApolloClient(sandbox);
    const client2 = getV4ApolloClient(sandbox);
    expect(getApolloClient).toHaveBeenCalledTimes(1);
    expect(client1).toBe(client2);
  });

  it('should correctly configure the Apollo client with the specified headers and cache', () => {
    getV4ApolloClient(sandbox);
    const clientConfig = (getApolloClient as jest.Mock).mock.calls[0][1];
    expect(clientConfig.customHeaders.accept).toBe(
      'application/json;charset=UTF-8;version=2.1.6',
    );
    expect(clientConfig.customHeaders['content-type']).toBe(
      'application/json;version=2.1.6;charset=utf-8',
    );
    expect(clientConfig.cache).toBeDefined();
  });
});
