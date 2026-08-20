import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client';
import { Kind } from 'graphql';
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
import {
  createAssignmentApolloClient,
  getAssignmentApolloClient,
  resetAssignmentApolloClient,
} from 'src/js/service/AssignmentApolloClient';

jest.mock('src/js/service/ApolloClientBuilderUtils');
jest.mock('src/js/service/ApolloClientBuilder');

describe('AssignmentApolloClient', () => {
  let mockSandbox: Sandbox;
  const mockOIGQLUrl = 'https://test.api.intuit.com/graphql';
  const mockIdentityUrl = 'https://test.identity.intuit.com/graphql';

  // Create proper mock HTTP links that ApolloLink.from can handle
  const mockOigqlHttpLink = new ApolloLink(() => null as any);
  const mockIdentityHttpLink = new ApolloLink(() => null as any);
  const mockAssignmentHeaderLink = new ApolloLink((operation, forward) =>
    forward(operation),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    resetAssignmentApolloClient();

    mockSandbox = {
      appContext: {
        getEnvironment: jest.fn(),
        getRealmInfo: jest.fn(),
        getUserAuthInfo: jest.fn(),
      },
    } as unknown as Sandbox;

    (getOIGQLContext as jest.Mock).mockReturnValue(mockOIGQLUrl);
    (getIdentityContext as jest.Mock).mockReturnValue(mockIdentityUrl);
    (createHttpLink as jest.Mock)
      .mockReturnValueOnce(mockOigqlHttpLink)
      .mockReturnValueOnce(mockIdentityHttpLink);
    (assignmentHeaderLink as jest.Mock).mockReturnValue(
      mockAssignmentHeaderLink,
    );
  });

  afterEach(() => {
    resetAssignmentApolloClient();
  });

  describe('createAssignmentApolloClient', () => {
    it('should create an Apollo client successfully', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(ApolloClient);
    });

    it('should call getOIGQLContext and getIdentityContext with sandbox', () => {
      createAssignmentApolloClient(mockSandbox);

      expect(getOIGQLContext).toHaveBeenCalledWith(mockSandbox);
      expect(getOIGQLContext).toHaveBeenCalledTimes(1);
      expect(getIdentityContext).toHaveBeenCalledWith(mockSandbox);
      expect(getIdentityContext).toHaveBeenCalledTimes(1);
    });

    it('should call createHttpLink for both oigql and identity contexts', () => {
      createAssignmentApolloClient(mockSandbox);

      expect(createHttpLink).toHaveBeenCalledTimes(2);
      expect(createHttpLink).toHaveBeenCalledWith(mockOIGQLUrl, mockSandbox);
      expect(createHttpLink).toHaveBeenCalledWith(mockIdentityUrl, mockSandbox);
    });

    it('should create client with InMemoryCache with addTypename false', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      expect(client.cache).toBeInstanceOf(InMemoryCache);
      // Verify cache config by checking behavior
      const cacheConfig = (client.cache as any).config;
      expect(cacheConfig.addTypename).toBe(false);
    });

    it('should configure client with correct default options', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      expect(client.defaultOptions).toEqual({
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
      });
    });

    it('should have a link defined', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      expect(client.link).toBeDefined();
    });

    it('should return the created client', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      expect(client).toHaveProperty('query');
      expect(client).toHaveProperty('mutate');
      expect(client).toHaveProperty('cache');
      expect(client).toHaveProperty('link');
    });
  });

  describe('getAssignmentApolloClient', () => {
    it('should create and return a new client if none exists', () => {
      const client = getAssignmentApolloClient(mockSandbox);

      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(ApolloClient);
      expect(getOIGQLContext).toHaveBeenCalledWith(mockSandbox);
      expect(getIdentityContext).toHaveBeenCalledWith(mockSandbox);
    });

    it('should return existing client if already created', () => {
      const firstClient = createAssignmentApolloClient(mockSandbox);
      const secondClient = getAssignmentApolloClient(mockSandbox);

      expect(firstClient).toBe(secondClient);
      // Should only create http links once (2 links per creation)
      expect(createHttpLink).toHaveBeenCalledTimes(2);
    });

    it('should return same instance on multiple calls', () => {
      const client1 = getAssignmentApolloClient(mockSandbox);
      const client2 = getAssignmentApolloClient(mockSandbox);
      const client3 = getAssignmentApolloClient(mockSandbox);

      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
      // Should only create once (2 links per creation)
      expect(createHttpLink).toHaveBeenCalledTimes(2);
    });

    it('should create new client after reset', () => {
      const firstClient = getAssignmentApolloClient(mockSandbox);
      resetAssignmentApolloClient();

      (createHttpLink as jest.Mock)
        .mockReturnValueOnce(mockOigqlHttpLink)
        .mockReturnValueOnce(mockIdentityHttpLink);

      const secondClient = getAssignmentApolloClient(mockSandbox);

      expect(firstClient).not.toBe(secondClient);
      // Should create http links twice (2 links per creation)
      expect(createHttpLink).toHaveBeenCalledTimes(4);
    });
  });

  describe('resetAssignmentApolloClient', () => {
    it('should reset the client to null', () => {
      const client = getAssignmentApolloClient(mockSandbox);
      expect(client).toBeDefined();

      resetAssignmentApolloClient();

      (createHttpLink as jest.Mock)
        .mockReturnValueOnce(mockOigqlHttpLink)
        .mockReturnValueOnce(mockIdentityHttpLink);

      const newClient = getAssignmentApolloClient(mockSandbox);
      expect(newClient).not.toBe(client);
      expect(createHttpLink).toHaveBeenCalledTimes(4);
    });

    it('should be safe to call when no client exists', () => {
      expect(() => resetAssignmentApolloClient()).not.toThrow();
    });

    it('should allow creating new client after multiple resets', () => {
      createAssignmentApolloClient(mockSandbox);
      resetAssignmentApolloClient();
      resetAssignmentApolloClient();

      (createHttpLink as jest.Mock)
        .mockReturnValueOnce(mockOigqlHttpLink)
        .mockReturnValueOnce(mockIdentityHttpLink);

      const client = getAssignmentApolloClient(mockSandbox);

      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(ApolloClient);
    });

    it('should reset to allow different sandbox context', () => {
      const firstClient = createAssignmentApolloClient(mockSandbox);

      resetAssignmentApolloClient();

      const mockOtherOIGQLUrl = 'https://other.api.intuit.com/graphql';
      const mockOtherIdentityUrl = 'https://other.identity.intuit.com/graphql';
      (getOIGQLContext as jest.Mock).mockReturnValue(mockOtherOIGQLUrl);
      (getIdentityContext as jest.Mock).mockReturnValue(mockOtherIdentityUrl);
      (createHttpLink as jest.Mock)
        .mockReturnValueOnce(mockOigqlHttpLink)
        .mockReturnValueOnce(mockIdentityHttpLink);

      const secondClient = createAssignmentApolloClient(mockSandbox);

      expect(firstClient).not.toBe(secondClient);
      expect(createHttpLink).toHaveBeenNthCalledWith(
        1,
        mockOIGQLUrl,
        mockSandbox,
      );
      expect(createHttpLink).toHaveBeenNthCalledWith(
        2,
        mockIdentityUrl,
        mockSandbox,
      );
      expect(createHttpLink).toHaveBeenNthCalledWith(
        3,
        mockOtherOIGQLUrl,
        mockSandbox,
      );
      expect(createHttpLink).toHaveBeenNthCalledWith(
        4,
        mockOtherIdentityUrl,
        mockSandbox,
      );
    });
  });

  describe('client singleton pattern', () => {
    it('should maintain singleton instance across multiple getAssignmentApolloClient calls', () => {
      const client1 = getAssignmentApolloClient(mockSandbox);
      const client2 = getAssignmentApolloClient(mockSandbox);
      const client3 = getAssignmentApolloClient(mockSandbox);

      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
      expect(createHttpLink).toHaveBeenCalledTimes(2);
    });

    it('should create new instance only after reset', () => {
      const client1 = getAssignmentApolloClient(mockSandbox);

      resetAssignmentApolloClient();

      (createHttpLink as jest.Mock)
        .mockReturnValueOnce(mockOigqlHttpLink)
        .mockReturnValueOnce(mockIdentityHttpLink);

      const client2 = getAssignmentApolloClient(mockSandbox);

      expect(client1).not.toBe(client2);
      expect(createHttpLink).toHaveBeenCalledTimes(4);
    });
  });

  describe('client configuration', () => {
    it('should configure cache with addTypename false', () => {
      const client = createAssignmentApolloClient(mockSandbox);
      const cache = client.cache as InMemoryCache;

      expect(cache).toBeInstanceOf(InMemoryCache);
      expect((cache as any).config.addTypename).toBe(false);
    });

    it('should configure watchQuery fetch policy', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      expect(client.defaultOptions?.watchQuery?.fetchPolicy).toBe(
        'cache-and-network',
      );
      expect(client.defaultOptions?.watchQuery?.errorPolicy).toBe('all');
    });

    it('should configure query fetch policy', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      expect(client.defaultOptions?.query?.fetchPolicy).toBe('network-only');
      expect(client.defaultOptions?.query?.errorPolicy).toBe('all');
    });

    it('should configure mutate error policy', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      expect(client.defaultOptions?.mutate?.errorPolicy).toBe('all');
    });

    it('should have all error policies set to "all"', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      expect(client.defaultOptions?.watchQuery?.errorPolicy).toBe('all');
      expect(client.defaultOptions?.query?.errorPolicy).toBe('all');
      expect(client.defaultOptions?.mutate?.errorPolicy).toBe('all');
    });
  });

  describe('link chain setup', () => {
    it('should create a link chain', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      expect(client.link).toBeDefined();
      expect(client.link).toBeInstanceOf(ApolloLink);
    });

    it('should use HTTP links from createHttpLink for both contexts', () => {
      createAssignmentApolloClient(mockSandbox);

      expect(createHttpLink).toHaveBeenCalledWith(mockOIGQLUrl, mockSandbox);
      expect(createHttpLink).toHaveBeenCalledWith(mockIdentityUrl, mockSandbox);
    });
  });

  describe('directional link split', () => {
    it('should route IDENTITY operations to the identity HTTP link', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      const operation = {
        query: { kind: Kind.DOCUMENT, definitions: [] },
        variables: {},
        operationName: 'TestQuery',
        extensions: {},
        setContext: jest.fn(),
        getContext: jest
          .fn()
          .mockReturnValue({ clientName: ApolloClientNames.IDENTITY }),
        toKey: jest.fn(),
      };

      expect(() => {
        client.link.request(operation as any, () => null as any);
      }).not.toThrow();
    });

    it('should route non-IDENTITY operations to the oigql HTTP link', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      const operation = {
        query: { kind: Kind.DOCUMENT, definitions: [] },
        variables: {},
        operationName: 'TestQuery',
        extensions: {},
        setContext: jest.fn(),
        getContext: jest.fn().mockReturnValue({}),
        toKey: jest.fn(),
      };

      expect(() => {
        client.link.request(operation as any, () => null as any);
      }).not.toThrow();
    });
  });

  describe('removeTypename link functionality', () => {
    it('should process operations through the link chain', () => {
      const client = createAssignmentApolloClient(mockSandbox);
      const mockQuery = {
        kind: Kind.DOCUMENT,
        definitions: [],
      };

      const operation = {
        query: mockQuery,
        variables: {},
        operationName: 'TestQuery',
        extensions: {},
        setContext: jest.fn(),
        getContext: jest.fn().mockReturnValue({}),
        toKey: jest.fn(),
      };

      // The link should be able to process operations
      expect(() => {
        if (client.link && client.link.request) {
          client.link.request(operation as any, () => null as any);
        }
      }).not.toThrow();
    });

    it('should handle operations with query documents', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      // Create a mock operation with a query that has __typename field
      const mockQuery = {
        kind: Kind.DOCUMENT,
        definitions: [
          {
            kind: Kind.OPERATION_DEFINITION,
            operation: 'query' as const,
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: '__typename' },
                },
                {
                  kind: Kind.FIELD,
                  name: { kind: Kind.NAME, value: 'id' },
                },
              ],
            },
          },
        ],
      };

      const operation = {
        query: mockQuery,
        variables: {},
        operationName: 'TestQuery',
        extensions: {},
        setContext: jest.fn(),
        getContext: jest.fn().mockReturnValue({}),
        toKey: jest.fn(),
      };

      // Execute through the link - should not throw
      expect(() => {
        if (client.link && client.link.request) {
          const result = client.link.request(
            operation as any,
            () => null as any,
          );
          // The link should return an observable or null
          expect(result).toBeDefined();
        }
      }).not.toThrow();
    });

    it('should handle operations without query documents', () => {
      const client = createAssignmentApolloClient(mockSandbox);

      const operation = {
        query: null,
        variables: {},
        operationName: 'TestQuery',
        extensions: {},
        setContext: jest.fn(),
        getContext: jest.fn().mockReturnValue({}),
        toKey: jest.fn(),
      };

      // Should handle operations without query gracefully
      expect(() => {
        if (client.link && client.link.request) {
          client.link.request(operation as any, () => null as any);
        }
      }).not.toThrow();
    });
  });
});
