import { ApolloClient, InMemoryCache } from '@apollo/client';
import { Sandbox } from 'src/js/common/sandbox';
import { createHttpLink } from 'src/js/service/ApolloClientBuilder';
import { getOIGQLContext } from 'src/js/service/ApolloClientBuilderUtils';

let weeklyTimeEntryApolloClient: ApolloClient<any> | null = null;

export const createWeeklyTimeEntryApolloClient = (
  sandbox: Sandbox,
): ApolloClient<any> => {
  const oigqlHttpLink = createHttpLink(getOIGQLContext(sandbox), sandbox);
  const cache = new InMemoryCache();

  weeklyTimeEntryApolloClient = new ApolloClient({
    cache,
    link: oigqlHttpLink,
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });

  return weeklyTimeEntryApolloClient;
};

export const getWeeklyTimeEntryApolloClient = (
  sandbox: Sandbox,
): ApolloClient<any> => {
  if (!weeklyTimeEntryApolloClient) {
    return createWeeklyTimeEntryApolloClient(sandbox);
  }
  return weeklyTimeEntryApolloClient;
};

export const resetWeeklyTimeEntryApolloClient = (): void => {
  weeklyTimeEntryApolloClient = null;
};
