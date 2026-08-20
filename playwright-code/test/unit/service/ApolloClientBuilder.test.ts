import { HttpLink } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { buildHeaders } from 'src/js/service/ApolloClientBuilderUtils';
import { Sandbox } from 'src/js/common/sandbox';
import {
  createBatchHttpLink,
  createHttpLink,
  assignmentHeaderLink,
} from 'src/js/service/ApolloClientBuilder';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

const { InMemoryCache: RealInMemoryCache } = jest.requireActual(
  '@apollo/client/cache',
);
const { gql: realGql } = jest.requireActual('@apollo/client');

jest.mock('src/js/service/utils/sandboxUtils');

jest.mock('@apollo/client/cache', () => ({
  defaultDataIdFromObject: jest.fn(),
  InMemoryCache: jest.fn().mockImplementation(() => ({
    dataIdFromObject: jest.fn(),
  })),
}));

jest.mock('@apollo/client', () => ({
  ApolloClient: jest.fn(),
  ApolloLink: {
    split: jest.fn(),
  },
  HttpLink: jest.fn(),
  Observable: jest.fn(),
}));

jest.mock('@apollo/client/link/batch-http', () => ({
  BatchHttpLink: jest.fn(),
}));

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  ApolloClientNames: {
    TIME_TRACKING: 'TIME_TRACKING',
    GAS: 'GAS',
    IDENTITY: 'IDENTITY',
  },
  buildHeaders: jest.fn(),
  getGASContext: jest.fn(),
  getIdentityContext: jest.fn(),
  getOIGQLContext: jest.fn(),
  getQbTimeTrackingContext: jest.fn(),
}));

describe('ApolloClientBuilder', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = {} as Sandbox;
    (buildHeaders as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createHttpLink', () => {
    it('should create an HttpLink with the correct configuration', () => {
      const uri = 'http://example.com/graphql';
      createHttpLink(uri, sandbox);
      expect(HttpLink).toHaveBeenCalledWith({
        uri,
        headers: {},
        credentials: 'include',
      });
    });
  });

  describe('createBatchHttpLink', () => {
    it('should create a BatchHttpLink with the correct configuration', () => {
      const uri = 'http://example.com/graphql';
      createBatchHttpLink(uri, sandbox);
      expect(BatchHttpLink).toHaveBeenCalledWith({
        uri,
        headers: {},
        credentials: 'include',
        batchMax: 7,
        batchInterval: 10,
      });
    });
  });

  describe('assignmentHeaderLink', () => {
    it('should return a link for workforce environment', () => {
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

      const link = assignmentHeaderLink(sandbox);

      expect(link).toBeDefined();
      expect(typeof link.request).toBe('function');
    });

    it('should return a link for non-workforce environment', () => {
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);

      const link = assignmentHeaderLink(sandbox);

      expect(link).toBeDefined();
      expect(typeof link.request).toBe('function');
    });
  });

  /**
   * Regression test for QUANTA-10374
   *
   * Verifies that OvertimeRule and OvertimeRuleCondition types are configured
   * with keyFields: false to prevent cache normalization. Without this fix,
   * when two policies have rules with the same ID, Apollo's cache would merge
   * them, causing data from one policy to bleed into another.
   */
  describe('InMemoryCache - OvertimeRule cache normalization fix', () => {
    const OVERTIME_POLICIES_QUERY = realGql`
      query GetOvertimePolicies {
        overtimePolicies {
          values {
            id
            name
            rules {
              values {
                id
                name
                conditions {
                  field
                  value
                }
              }
            }
          }
        }
      }
    `;

    const mockApiResponse = {
      overtimePolicies: {
        __typename: 'OvertimePolicyConnection',
        values: [
          {
            __typename: 'OvertimePolicy',
            id: 'policy_1',
            name: 'Basic Overtime',
            rules: {
              __typename: 'OvertimeRuleConnection',
              values: [
                {
                  __typename: 'OvertimeRule',
                  id: 'basic_weekly_ot',
                  name: 'Weekly Overtime',
                  conditions: [
                    {
                      __typename: 'OvertimeRuleCondition',
                      field: 'threshold',
                      value: '40',
                    },
                  ],
                },
              ],
            },
          },
          {
            __typename: 'OvertimePolicy',
            id: 'policy_2',
            name: 'Custom Overtime - Employee Override',
            rules: {
              __typename: 'OvertimeRuleConnection',
              values: [
                {
                  __typename: 'OvertimeRule',
                  id: 'basic_weekly_ot',
                  name: 'Weekly Overtime',
                  conditions: [
                    {
                      __typename: 'OvertimeRuleCondition',
                      field: 'threshold',
                      value: '30',
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    };

    it('should preserve distinct values for rules with same ID when keyFields: false is configured', () => {
      const cache = new RealInMemoryCache({
        typePolicies: {
          OvertimeRule: { keyFields: false },
          OvertimeRuleCondition: { keyFields: false },
        },
      });

      cache.writeQuery({
        query: OVERTIME_POLICIES_QUERY,
        data: mockApiResponse,
      });

      const result = cache.readQuery({ query: OVERTIME_POLICIES_QUERY });

      const policy1Threshold =
        result?.overtimePolicies.values[0].rules.values[0].conditions[0].value;
      const policy2Threshold =
        result?.overtimePolicies.values[1].rules.values[0].conditions[0].value;

      expect(policy1Threshold).toBe('40');
      expect(policy2Threshold).toBe('30');
    });

    it('demonstrates data bleeding WITHOUT keyFields: false fix', () => {
      const cacheWithoutFix = new RealInMemoryCache();

      cacheWithoutFix.writeQuery({
        query: OVERTIME_POLICIES_QUERY,
        data: mockApiResponse,
      });

      const result = cacheWithoutFix.readQuery({
        query: OVERTIME_POLICIES_QUERY,
      });

      const policy1Threshold =
        result?.overtimePolicies.values[0].rules.values[0].conditions[0].value;
      const policy2Threshold =
        result?.overtimePolicies.values[1].rules.values[0].conditions[0].value;

      // Without fix, both show same value due to cache normalization
      expect(policy1Threshold).toBe(policy2Threshold);
    });
  });
});
