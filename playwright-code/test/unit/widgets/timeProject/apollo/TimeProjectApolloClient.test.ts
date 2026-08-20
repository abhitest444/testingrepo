import { Observable } from '@apollo/client';
import gql from 'graphql-tag';
import {
  createTimeProjectApolloClient,
  getTimeProjectApolloClient,
  resetTimeProjectApolloClient,
} from 'src/js/widgets/timeProject/apollo/TimeProjectApolloClient';

let capturedOperation: any = null;

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  getOIGQLContext: jest.fn(
    () => 'https://sbseggraphqlorch-qal.api.intuit.com/graphql',
  ),
  getIdentityContext: jest.fn(
    () => 'https://identity-qal.api.intuit.com/v2/graphql',
  ),
  getWorkflowContext: jest.fn(
    () => 'https://accountantworkflow-qal.api.intuit.com/v4/graphql',
  ),
  ApolloClientNames: {
    GAS: 0,
    OIGQL: 1,
    TIME_TRACKING: 2,
    IDENTITY: 3,
    CUSTOM_EXTENSIONS: 4,
    TSHEETS: 5,
    WORKFLOW: 6,
  },
}));

const capturedUris: string[] = [];

jest.mock('src/js/service/ApolloClientBuilder', () => ({
  createHttpLink: jest.fn(
    (uri: string) =>
      new (require('@apollo/client').ApolloLink)((operation: any) => {
        capturedOperation = operation;
        capturedUris.push(uri);
        return new Observable((observer: any) => {
          observer.next({ data: {} });
          observer.complete();
        });
      }),
  ),
}));

const mockSandbox = {
  appContext: {
    getEnvironment: jest.fn(() => 'QA'),
    getRealmInfo: jest.fn(() => ({ realmId: 'test-realm' })),
    getUserAuthInfo: jest.fn(() => ({ authId: 'test-auth' })),
  },
  extensions: {
    qbo: {
      context: {
        getEnvironmentInfo: jest.fn(() => ({ xCsrfToken: 'test-token' })),
        getCompanyL10nInfo: jest.fn(() => ({ region: 'US' })),
      },
    },
  },
  pluginConfig: {
    extendedProperties: {
      appSecret: 'test-secret',
    },
  },
} as any;

describe('TimeProjectApolloClient', () => {
  beforeEach(() => {
    resetTimeProjectApolloClient();
    capturedOperation = null;
    capturedUris.length = 0;
  });

  describe('createTimeProjectApolloClient', () => {
    it('should create an Apollo client', () => {
      const client = createTimeProjectApolloClient(mockSandbox);
      expect(client).toBeTruthy();
      expect(client.cache).toBeTruthy();
    });

    it('should configure cache with addTypename: false', () => {
      const client = createTimeProjectApolloClient(mockSandbox);
      const cacheConfig = (client.cache as any).config;
      expect(cacheConfig.addTypename).toBe(false);
    });
  });

  describe('getTimeProjectApolloClient', () => {
    it('should create client on first call', () => {
      const client = getTimeProjectApolloClient(mockSandbox);
      expect(client).toBeTruthy();
    });

    it('should return same client on subsequent calls', () => {
      const client1 = getTimeProjectApolloClient(mockSandbox);
      const client2 = getTimeProjectApolloClient(mockSandbox);
      expect(client1).toBe(client2);
    });
  });

  describe('resetTimeProjectApolloClient', () => {
    it('should reset the client so a new one is created', () => {
      const client1 = getTimeProjectApolloClient(mockSandbox);
      resetTimeProjectApolloClient();
      const client2 = getTimeProjectApolloClient(mockSandbox);
      expect(client1).not.toBe(client2);
    });
  });

  describe('__typename removal link', () => {
    it('should strip __typename fields from queries', async () => {
      const client = createTimeProjectApolloClient(mockSandbox);

      const TEST_QUERY = gql`
        query TestQuery {
          someData {
            id
            name
            __typename
          }
        }
      `;

      await client.query({ query: TEST_QUERY }).catch(() => {});

      expect(capturedOperation).toBeTruthy();
      const queryStr = require('graphql').print(capturedOperation.query);
      expect(queryStr).not.toContain('__typename');
      expect(queryStr).toContain('id');
      expect(queryStr).toContain('name');
    });

    it('routes Identity operations to the identity HTTP link via clientName context', async () => {
      const client = createTimeProjectApolloClient(mockSandbox);
      const TEST_QUERY = gql`
        query GetIdentityProfile {
          profile {
            personInfo {
              name {
                givenName
              }
            }
          }
        }
      `;

      // Default routing -> OIGQL link
      await client.query({ query: TEST_QUERY }).catch(() => {});
      expect(capturedUris[capturedUris.length - 1]).toBe(
        'https://sbseggraphqlorch-qal.api.intuit.com/graphql',
      );

      // Tagged with IDENTITY -> identity link
      await client
        .query({
          query: TEST_QUERY,
          context: { clientName: 3 },
        })
        .catch(() => {});
      expect(capturedUris[capturedUris.length - 1]).toBe(
        'https://identity-qal.api.intuit.com/v2/graphql',
      );
    });

    it('routes Workflow operations to the workflow HTTP link via WORKFLOW clientName', async () => {
      const client = createTimeProjectApolloClient(mockSandbox);
      const TEST_QUERY = gql`
        query GetWorkflowProjects {
          company {
            projects {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        }
      `;

      await client
        .query({
          query: TEST_QUERY,
          context: { clientName: 6 }, // ApolloClientNames.WORKFLOW
        })
        .catch(() => {});

      expect(capturedUris[capturedUris.length - 1]).toBe(
        'https://accountantworkflow-qal.api.intuit.com/v4/graphql',
      );
    });

    it('routes non-Identity non-Workflow operations to the OIGQL fallback', async () => {
      const client = createTimeProjectApolloClient(mockSandbox);
      const TEST_QUERY = gql`
        query GetProjects {
          dataAccessWorkProjects {
            edges {
              node {
                id
              }
            }
          }
        }
      `;

      // No clientName context → falls through both splits to OIGQL
      await client.query({ query: TEST_QUERY }).catch(() => {});

      expect(capturedUris[capturedUris.length - 1]).toBe(
        'https://sbseggraphqlorch-qal.api.intuit.com/graphql',
      );
    });

    it('createHttpLink is called with the workflow URL during client creation', () => {
      const { createHttpLink } = require('src/js/service/ApolloClientBuilder');
      createHttpLink.mockClear();

      createTimeProjectApolloClient(mockSandbox);

      const calledUris = createHttpLink.mock.calls.map(
        (call: any[]) => call[0],
      );
      expect(calledUris).toContain(
        'https://accountantworkflow-qal.api.intuit.com/v4/graphql',
      );
    });

    it('should preserve non-__typename fields', async () => {
      const client = createTimeProjectApolloClient(mockSandbox);

      const TEST_QUERY = gql`
        query TestQuery {
          someData {
            id
            displayName
          }
        }
      `;

      await client.query({ query: TEST_QUERY }).catch(() => {});

      expect(capturedOperation).toBeTruthy();
      const queryStr = require('graphql').print(capturedOperation.query);
      expect(queryStr).toContain('id');
      expect(queryStr).toContain('displayName');
    });
  });
});
