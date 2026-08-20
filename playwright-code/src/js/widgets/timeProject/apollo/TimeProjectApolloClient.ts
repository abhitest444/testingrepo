import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { removeTypenameFromVariables } from '@apollo/client/link/remove-typename';
import { visit } from 'graphql';
import { Sandbox } from 'src/js/common/sandbox';
import {
  ApolloClientNames,
  getIdentityContext,
  getOIGQLContext,
  getWorkflowContext,
} from 'src/js/service/ApolloClientBuilderUtils';
import { createHttpLink } from 'src/js/service/ApolloClientBuilder';

const createRemoveTypenameFromQueryLink = () =>
  new ApolloLink((operation, forward) => {
    if (operation.query) {
      operation.query = visit(operation.query, {
        Field(node) {
          if (node.name.value === '__typename') {
            return null;
          }
          return node;
        },
      });
    }
    return forward(operation);
  });

let timeProjectApolloClient: ApolloClient<any> | null = null;

export const createTimeProjectApolloClient = (sandbox: Sandbox) => {
  const oigqlHttpLink = createHttpLink(getOIGQLContext(sandbox), sandbox);
  // Identity service is needed for LEGACY_QBO_USER name resolution. The
  // worker time summary returns `timeForContactDAS: null` for those rows
  // because DAS can't stitch the persona id, so we hop over to Identity to
  // pull `givenName` / `familyName` (or fall back to email).
  const identityHttpLink = createHttpLink(getIdentityContext(sandbox), sandbox);
  const workflowHttpLink = createHttpLink(getWorkflowContext(sandbox), sandbox);
  const removeTypenameFromQueryLink = createRemoveTypenameFromQueryLink();
  const removeTypenameLink = removeTypenameFromVariables();

  // Per-operation routing: callers tag their query with
  // `context: { clientName: ApolloClientNames.IDENTITY }` to hit Identity,
  // `context: { clientName: ApolloClientNames.WORKFLOW }` to hit the
  // accountantworkflow endpoint; every other operation falls through to OIGQL.
  const directionalLink = ApolloLink.split(
    (operation) =>
      operation.getContext().clientName === ApolloClientNames.IDENTITY,
    identityHttpLink,
    ApolloLink.split(
      (operation) =>
        operation.getContext().clientName === ApolloClientNames.WORKFLOW,
      workflowHttpLink,
      oigqlHttpLink,
    ),
  );

  timeProjectApolloClient = new ApolloClient({
    cache: new InMemoryCache({
      addTypename: false,
    }),
    link: ApolloLink.from([
      removeTypenameFromQueryLink,
      removeTypenameLink,
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

  return timeProjectApolloClient;
};

export const getTimeProjectApolloClient = (sandbox: Sandbox) => {
  if (!timeProjectApolloClient) {
    createTimeProjectApolloClient(sandbox);
  }
  return timeProjectApolloClient;
};

export const resetTimeProjectApolloClient = () => {
  timeProjectApolloClient = null;
};
