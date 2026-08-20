import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { removeTypenameFromVariables } from '@apollo/client/link/remove-typename';
import { visit } from 'graphql';
import { Sandbox } from 'src/js/common/sandbox';
import {
  ApolloClientNames,
  getIdentityContext,
  getOIGQLContext,
} from 'src/js/service/ApolloClientBuilderUtils';
import {
  createHttpLink,
  assignmentHeaderLink,
} from 'src/js/service/ApolloClientBuilder';

/**
 * Custom link to remove __typename from query documents
 * This prevents the backend from auto-stitching data from DAS
 */
const createRemoveTypenameFromQueryLink = () =>
  new ApolloLink((operation, forward) => {
    if (operation.query) {
      operation.query = visit(operation.query, {
        Field(node) {
          if (node.name.value === '__typename') {
            return null; // Remove __typename field
          }
          return node;
        },
      });
    }
    return forward(operation);
  });

/**
 * Dedicated Apollo Client for Assignments
 *
 * This client is configured to prevent __typename from being sent in requests
 * to avoid backend auto-stitching issues with DAS service that can cause
 * API failures when values are null.
 *
 * Key configurations:
 * - addTypename: false in cache config
 * - Custom link to strip __typename from query documents
 * - removeTypenameFromVariables link
 * - errorPolicy: 'all' for graceful error handling
 */
let assignmentApolloClient: ApolloClient<any> | null = null;

export const createAssignmentApolloClient = (sandbox: Sandbox) => {
  const oigqlHttpLink = createHttpLink(getOIGQLContext(sandbox), sandbox);
  const identityHttpLink = createHttpLink(getIdentityContext(sandbox), sandbox);

  // Link chain to remove __typename at all levels
  const removeTypenameFromQueryLink = createRemoveTypenameFromQueryLink();
  const removeTypenameLink = removeTypenameFromVariables();

  const directionalLink = ApolloLink.split(
    (operation) =>
      operation.getContext().clientName === ApolloClientNames.IDENTITY,
    identityHttpLink,
    oigqlHttpLink,
  );

  assignmentApolloClient = new ApolloClient({
    cache: new InMemoryCache({
      addTypename: false,
    }),
    link: ApolloLink.from([
      removeTypenameFromQueryLink,
      removeTypenameLink,
      assignmentHeaderLink(sandbox), // Add intuit-qbtime-worker for workforce
      directionalLink,
    ]),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });

  return assignmentApolloClient;
};

export const getAssignmentApolloClient = (sandbox: Sandbox) => {
  if (!assignmentApolloClient) {
    createAssignmentApolloClient(sandbox);
  }
  return assignmentApolloClient;
};

export const resetAssignmentApolloClient = () => {
  assignmentApolloClient = null;
};
