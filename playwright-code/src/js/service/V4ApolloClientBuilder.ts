// @ts-ignore
import { getApolloClient } from '@appfabric/ui-data-layer/apollo';
import { InMemoryCache } from '@apollo/client/cache';
import { ApolloClient } from '@apollo/client';
import { Sandbox } from 'src/js/common/sandbox';

const APOLLO_VERSION = '2.1.6';

let apolloQboClient: ApolloClient<any> | null;
const cache = new InMemoryCache();

export const getV4ApolloClient = (sandbox: Sandbox): ApolloClient<any> => {
  if (!apolloQboClient) {
    apolloQboClient = getApolloClient(sandbox, {
      domain: 'qbo',
      pluginId: 'time-tracking-ui',
      customHeaders: {
        accept: `application/json;charset=UTF-8;version=${APOLLO_VERSION}`,
        'content-type': `application/json;version=${APOLLO_VERSION};charset=utf-8`,
      },
      cache,
    });
  }
  return apolloQboClient!;
};

export const resetApolloQboClient = () => {
  apolloQboClient = null;
};
