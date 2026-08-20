import { defaultDataIdFromObject, InMemoryCache } from '@apollo/client/cache';
import { ApolloClient, ApolloLink, HttpLink } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { setContext } from '@apollo/client/link/context';

import {
  ApolloClientNames,
  buildHeaders,
  getGASContext,
  getIdentityContext,
  getOIGQLContext,
  getQbTimeTrackingContext,
  getTSheetsContext,
  INTUIT_WEB_APP,
  WEB_APP_QBO,
  INTUIT_QBTIME_WORKER,
  getRegion,
} from 'src/js/service/ApolloClientBuilderUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { Sandbox } from 'src/js/common/sandbox';

/**
 * The Apollo client for time-tracking-ui
 *
 * Do not use Quicksand here, use the sandbox directly
 *
 */

let apolloClient: ApolloClient<any> | null;

const cache = new InMemoryCache({
  dataIdFromObject: (object) => {
    switch (object.__typename) {
      case 'TimeTracking_Timesheet':
        return `TimeTracking_Timesheet:${object.id}`;
      case 'Employee':
        return `Employee:${object.id}`;
      default:
        return defaultDataIdFromObject(object);
    }
  },
  // Add type policies to control caching behavior
  typePolicies: {
    Query: {
      fields: {
        // Allow disabling cache for timeTrackingTimeEntries based on operation context
        timeTrackingTimeEntries: {
          read(existing, { args, fieldName, storeFieldName, variables }) {
            // Check if this is a weekly time entry query by checking variables
            // We'll use a specific pattern in the input to identify weekly time entry queries
            const input = variables?.input;
            if (
              input &&
              typeof input === 'object' &&
              'timeEntryFilter' in input
            ) {
              // This is likely a weekly time entry query, disable cache
              return undefined; // Force fresh data
            }
            return existing; // Use cached data for other queries
          },
        },
      },
    },
    // Disable normalization for overtime types - rules with same ID
    // can have different data across different policies
    OvertimeRule: {
      keyFields: false,
    },
    OvertimeRuleCondition: {
      keyFields: false,
    },
  },
});

export const createHttpLink = (uri: string, sandbox: Sandbox) =>
  new HttpLink({
    uri,
    headers: buildHeaders(sandbox),
    credentials: 'include',
  });

export const createBatchHttpLink = (uri: string, sandbox: Sandbox) =>
  new BatchHttpLink({
    uri,
    headers: buildHeaders(sandbox),
    credentials: 'include',
    batchMax: 7, // Maximum number of operations per batch
    batchInterval: 10, // Wait time in milliseconds to collect batched operations
  });

export const gasHeaderLink = (sandbox: Sandbox) =>
  setContext((_, previousContext) => {
    const { headers, hasPayroll } = previousContext;

    // Access region information directly from sandbox
    const region = getRegion(sandbox); // Will be 'US', 'CA', 'GB', etc.

    if (hasPayroll && region !== 'AU') {
      return previousContext;
    }

    return {
      ...previousContext,
      headers: {
        ...headers,
        // when making GAS request for a non-Payroll company to retrieve employee data this will skip IOP, and query EMS only
        [INTUIT_WEB_APP]: WEB_APP_QBO,
      },
    };
  });

export const assignmentHeaderLink = (sandbox: Sandbox) =>
  setContext((_, previousContext) => {
    const { headers } = previousContext;

    if (!isWorkforceEnvironment(sandbox)) {
      return previousContext;
    }

    return {
      ...previousContext,
      headers: {
        ...headers,
        [INTUIT_QBTIME_WORKER]: 'true',
      },
    };
  });

export const initApolloClient = (sandbox: Sandbox) => {
  const gasHttpLink = createHttpLink(getGASContext(sandbox), sandbox);
  const timeTrackingHttpLink = createHttpLink(
    getQbTimeTrackingContext(sandbox),
    sandbox,
  );
  const oigqlHttpLink = createHttpLink(getOIGQLContext(sandbox), sandbox);
  const identityHttpLink = createHttpLink(getIdentityContext(sandbox), sandbox);
  const tsheetsHttpLink = createHttpLink(getTSheetsContext(sandbox), sandbox);

  // split incoming request between terminating HttpLinks
  const directionalLink_timeAndGraphqls = ApolloLink.split(
    // if time tracking
    (operation) =>
      operation.getContext().clientName === ApolloClientNames.TIME_TRACKING,
    oigqlHttpLink,

    // else
    ApolloLink.split(
      // if gas
      (operation) =>
        operation.getContext().clientName === ApolloClientNames.GAS,
      ApolloLink.from([gasHeaderLink(sandbox), gasHttpLink]),

      // else
      ApolloLink.split(
        // if identity
        (operation) =>
          operation.getContext().clientName === ApolloClientNames.IDENTITY,
        identityHttpLink,

        // else
        ApolloLink.split(
          // if tsheets
          (operation) =>
            operation.getContext().clientName === ApolloClientNames.TSHEETS,
          tsheetsHttpLink,

          // else
          oigqlHttpLink,
        ),
      ),
    ),
  );

  apolloClient = new ApolloClient({
    cache,
    link: directionalLink_timeAndGraphqls,
  });

  return apolloClient;
};

export const getApolloClientInstance = (sandbox: Sandbox) => {
  if (!apolloClient) {
    initApolloClient(sandbox);
  }
  return apolloClient;
};
