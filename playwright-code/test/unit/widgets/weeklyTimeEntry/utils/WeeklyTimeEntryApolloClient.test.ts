import { ApolloClient, InMemoryCache } from '@apollo/client';
import { Sandbox } from 'src/js/common/sandbox';
import {
  createWeeklyTimeEntryApolloClient,
  getWeeklyTimeEntryApolloClient,
  resetWeeklyTimeEntryApolloClient,
} from '../../../../../src/js/widgets/weeklyTimeEntry/utils/WeeklyTimeEntryApolloClient';

// Mock dependencies
jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  getOIGQLContext: jest.fn(() => 'https://test-api.example.com/graphql'),
}));

jest.mock('../../../../../src/js/service/ApolloClientBuilder', () => ({
  createHttpLink: jest.fn(() => ({
    uri: 'https://test-api.example.com/graphql',
    headers: {},
    credentials: 'include',
  })),
}));

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  ApolloClient: jest.fn().mockImplementation((config) => ({
    cache: config.cache,
    link: config.link,
    defaultOptions: config.defaultOptions,
    query: jest.fn(),
    mutate: jest.fn(),
  })),
  InMemoryCache: jest.fn().mockImplementation(() => ({
    restore: jest.fn(),
    extract: jest.fn(),
  })),
}));

const mockSandbox: Sandbox = {
  appContext: {
    getEnvironment: jest.fn(() => 'PROD'),
    getRealmInfo: jest.fn(() => ({ realmId: 'test-realm' })),
    getUserAuthInfo: jest.fn(() => ({ authId: 'test-auth' })),
  },
  pluginConfig: {
    extendedProperties: {
      appSecret: 'test-secret',
    },
  },
  extensions: {
    qbo: {
      context: {
        getEnvironmentInfo: jest.fn(() => ({ xCsrfToken: 'test-token' })),
        getCompanyL10nInfo: jest.fn(() => ({ region: 'US' })),
      },
    },
  },
} as any;

describe('WeeklyTimeEntryApolloClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetWeeklyTimeEntryApolloClient();
    (ApolloClient as jest.Mock).mockClear();
    (InMemoryCache as jest.Mock).mockClear();
  });

  describe('createWeeklyTimeEntryApolloClient', () => {
    it('should create a new Apollo client with correct configuration', () => {
      const client = createWeeklyTimeEntryApolloClient(mockSandbox);

      expect(ApolloClient).toHaveBeenCalledWith({
        cache: expect.any(Object),
        link: expect.any(Object),
        defaultOptions: {
          watchQuery: {
            errorPolicy: 'all',
          },
          query: {
            errorPolicy: 'all',
          },
        },
      });

      expect(InMemoryCache).toHaveBeenCalled();
      expect(client).toBeDefined();
    });

    it('should call getOIGQLContext with the sandbox', () => {
      const { getOIGQLContext } = jest.requireMock(
        'src/js/service/ApolloClientBuilderUtils',
      );

      createWeeklyTimeEntryApolloClient(mockSandbox);

      expect(getOIGQLContext).toHaveBeenCalledWith(mockSandbox);
    });

    it('should call createHttpLink with correct parameters', () => {
      const { createHttpLink } = jest.requireMock(
        '../../../../../src/js/service/ApolloClientBuilder',
      );

      createWeeklyTimeEntryApolloClient(mockSandbox);

      expect(createHttpLink).toHaveBeenCalledWith(
        'https://test-api.example.com/graphql',
        mockSandbox,
      );
    });

    it('should return the created Apollo client', () => {
      const client = createWeeklyTimeEntryApolloClient(mockSandbox);

      expect(client).toEqual(
        expect.objectContaining({
          cache: expect.any(Object),
          link: expect.any(Object),
          defaultOptions: expect.any(Object),
        }),
      );
    });
  });

  describe('getWeeklyTimeEntryApolloClient', () => {
    it('should return existing client if one exists', () => {
      // First call creates the client
      const firstClient = getWeeklyTimeEntryApolloClient(mockSandbox);

      // Second call should return the same client
      const secondClient = getWeeklyTimeEntryApolloClient(mockSandbox);

      expect(firstClient).toBe(secondClient);
      expect(ApolloClient).toHaveBeenCalledTimes(1); // Should only be called once
    });

    it('should create a new client if none exists', () => {
      const client = getWeeklyTimeEntryApolloClient(mockSandbox);

      expect(ApolloClient).toHaveBeenCalledTimes(1);
      expect(client).toBeDefined();
    });

    it('should create a new client after reset', () => {
      // Create first client
      const firstClient = getWeeklyTimeEntryApolloClient(mockSandbox);

      // Reset
      resetWeeklyTimeEntryApolloClient();

      // Create second client
      const secondClient = getWeeklyTimeEntryApolloClient(mockSandbox);

      expect(firstClient).not.toBe(secondClient);
      expect(ApolloClient).toHaveBeenCalledTimes(2);
    });

    it('should call createWeeklyTimeEntryApolloClient when no client exists', () => {
      const spy = jest.spyOn(
        require('../../../../../src/js/widgets/weeklyTimeEntry/utils/WeeklyTimeEntryApolloClient'),
        'createWeeklyTimeEntryApolloClient',
      );

      getWeeklyTimeEntryApolloClient(mockSandbox);

      expect(spy).toHaveBeenCalledWith(mockSandbox);
    });
  });

  describe('resetWeeklyTimeEntryApolloClient', () => {
    it('should reset the client to null', () => {
      // Create a client first
      getWeeklyTimeEntryApolloClient(mockSandbox);

      // Reset should clear the client
      resetWeeklyTimeEntryApolloClient();

      // Getting client again should create a new one
      getWeeklyTimeEntryApolloClient(mockSandbox);

      expect(ApolloClient).toHaveBeenCalledTimes(2);
    });

    it('should allow creating a new client after reset', () => {
      // Create first client
      const firstClient = getWeeklyTimeEntryApolloClient(mockSandbox);

      // Reset
      resetWeeklyTimeEntryApolloClient();

      // Create new client
      const secondClient = getWeeklyTimeEntryApolloClient(mockSandbox);

      expect(firstClient).toBeDefined();
      expect(secondClient).toBeDefined();
      expect(firstClient).not.toBe(secondClient);
    });

    it('should not throw error when called multiple times', () => {
      expect(() => {
        resetWeeklyTimeEntryApolloClient();
        resetWeeklyTimeEntryApolloClient();
        resetWeeklyTimeEntryApolloClient();
      }).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle errors from getOIGQLContext', () => {
      const { getOIGQLContext } = jest.requireMock(
        'src/js/service/ApolloClientBuilderUtils',
      );
      getOIGQLContext.mockImplementation(() => {
        throw new Error('Failed to get context');
      });

      expect(() => createWeeklyTimeEntryApolloClient(mockSandbox)).toThrow(
        'Failed to get context',
      );
    });

    it('should handle errors from createHttpLink', () => {
      const { createHttpLink } = jest.requireMock(
        '../../../../../src/js/service/ApolloClientBuilder',
      );
      const { getOIGQLContext } = jest.requireMock(
        'src/js/service/ApolloClientBuilderUtils',
      );

      // Reset getOIGQLContext to work normally
      getOIGQLContext.mockImplementation(
        () => 'https://test-api.example.com/graphql',
      );

      createHttpLink.mockImplementation(() => {
        throw new Error('Failed to create link');
      });

      expect(() => createWeeklyTimeEntryApolloClient(mockSandbox)).toThrow(
        'Failed to create link',
      );
    });

    it('should handle errors from ApolloClient constructor', () => {
      const { getOIGQLContext } = jest.requireMock(
        'src/js/service/ApolloClientBuilderUtils',
      );
      const { createHttpLink } = jest.requireMock(
        '../../../../../src/js/service/ApolloClientBuilder',
      );

      // Reset mocks to work normally
      getOIGQLContext.mockImplementation(
        () => 'https://test-api.example.com/graphql',
      );
      createHttpLink.mockImplementation(() => ({
        uri: 'test',
        headers: {},
        credentials: 'include',
      }));

      (ApolloClient as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to create Apollo client');
      });

      expect(() => createWeeklyTimeEntryApolloClient(mockSandbox)).toThrow(
        'Failed to create Apollo client',
      );
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      // Reset all mocks for integration tests
      const { getOIGQLContext } = jest.requireMock(
        'src/js/service/ApolloClientBuilderUtils',
      );
      const { createHttpLink } = jest.requireMock(
        '../../../../../src/js/service/ApolloClientBuilder',
      );

      getOIGQLContext.mockImplementation(
        () => 'https://test-api.example.com/graphql',
      );
      createHttpLink.mockImplementation(() => ({
        uri: 'test',
        headers: {},
        credentials: 'include',
      }));
      (ApolloClient as jest.Mock).mockImplementation(() => ({
        cache: { restore: jest.fn() },
        link: { uri: 'test' },
        defaultOptions: {
          watchQuery: { errorPolicy: 'all' },
          query: { errorPolicy: 'all' },
        },
      }));
    });

    it('should maintain singleton pattern across multiple calls', () => {
      const client1 = getWeeklyTimeEntryApolloClient(mockSandbox);
      const client2 = getWeeklyTimeEntryApolloClient(mockSandbox);
      const client3 = getWeeklyTimeEntryApolloClient(mockSandbox);

      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
      expect(ApolloClient).toHaveBeenCalledTimes(1);
    });

    it('should create new instances after reset', () => {
      const clients = [];

      // Create, reset, create cycle multiple times
      for (let i = 0; i < 3; i += 1) {
        clients.push(getWeeklyTimeEntryApolloClient(mockSandbox));
        resetWeeklyTimeEntryApolloClient();
      }

      // All clients should be different
      expect(clients[0]).not.toBe(clients[1]);
      expect(clients[1]).not.toBe(clients[2]);
      expect(clients[0]).not.toBe(clients[2]);
      expect(ApolloClient).toHaveBeenCalledTimes(3);
    });
  });
});
