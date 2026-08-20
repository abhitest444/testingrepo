/* eslint-disable camelcase */
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ENTITLEMENTS_QUERY } from 'src/js/service/queries/oigqlQueries';
import {
  computeHasPayroll,
  computeHasPayrollWithTSheet,
  computeHasTSheet,
  computeHasTSheets,
  computeHasTimeElite,
  PAYROLL_OFFERING_ID,
  SUBSCRIPTION_STATUS,
  TSHEETS_OFFERING_ID,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import {
  AccountType,
  Identity_EntitlementGrant,
} from 'src/__generated__/oigql/graphql';
import * as OigqlGraphql from 'src/__generated__/oigql/graphql';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { ENTITLEMENTS } from 'src/js/common/constants';

// Mock getDecision from variability-sync-sdk
jest.mock('@core-app/variability-sync-sdk', () => ({
  getDecision: jest.fn(
    (key: string, options: { defaultValue: boolean }) => options.defaultValue,
  ),
}));

const mocks = [
  {
    request: {
      query: ENTITLEMENTS_QUERY,
      variables: {
        filterBy: {
          accountType: AccountType.Organization,
          accountIds: ['123456'],
        },
      },
    },
    result: {
      data: {
        identityBulkLookupAccountEntitlementGrants: {
          edges: [
            {
              node: {
                accountId: '123',
                entitlementGrants: [
                  {
                    accountId: '123',
                    accountType: 'type1',
                    billingAccountId: 'billing123',
                    entitlementGrantProductOffering: {
                      assetId: 'asset123',
                      flavor: 'flavor1',
                      offeringId: 'offering123',
                      releaseNumber: '1.0',
                      versionNumber: '1.0',
                    },
                    entitlementGrantType: 'type1',
                    entitlementInfo: {
                      name: 'infoName',
                      value: 'infoValue',
                    },
                    featureSet: 'featureSet1',
                    featureSetDetails: {
                      featureSetCode: 'code1',
                      featureSetDetails: {
                        featureSetCode: 'code2',
                        optionalFeatures: [
                          {
                            code: 'featureCode1',
                            readOnlyStatus: 'readOnly',
                            serviceStatus: 'active',
                            status: 'enabled',
                          },
                        ],
                      },
                    },
                    grantId: 'grant123',
                    licenseNumber: 'license123',
                    readOnlyStatus: 'readOnly',
                    serviceStatus: 'active',
                    status: 'enabled',
                  },
                ],
              },
            },
          ],
        },
      },
    },
  },
];

describe('useEntitlementsQuery', () => {
  it('should return entitlement grants data', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetEntitlements(),
      mocks,
    );

    await waitForNextUpdate();

    expect(result.current.data).toEqual(
      mocks[0].result.data.identityBulkLookupAccountEntitlementGrants.edges[0]
        .node.entitlementGrants,
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should forward client option to entitlement query hook', () => {
    const client = {} as ApolloClient<NormalizedCacheObject>;
    const useQuerySpy = jest
      .spyOn(OigqlGraphql, 'useGetBulkAccountEntitlementGrantsQuery')
      .mockReturnValue({
        loading: false,
        data: undefined,
        error: undefined,
      } as never);

    renderHookWithApolloProvider(() => useGetEntitlements({ client }), mocks);

    expect(useQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({ client }),
    );

    useQuerySpy.mockRestore();
  });
});

describe('computeHasPayroll', () => {
  test.each([
    // Test case: Empty array should return false
    { entitlementGrants: [], expected: false },

    // Test case: No matching offeringId should return false
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: { offeringId: 'SomeOtherId' },
        },
      ],
      expected: false,
    },

    // Test case: Matching offeringId should return true
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: { offeringId: PAYROLL_OFFERING_ID },
        },
      ],
      expected: true,
    },

    // Test case: Multiple grants with one matching offeringId should return true
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: { offeringId: 'SomeOtherId' },
        },
        {
          entitlementGrantProductOffering: { offeringId: PAYROLL_OFFERING_ID },
        },
      ],
      expected: true,
    },

    // Test case: Null entitlementGrantProductOffering should be handled gracefully
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: null,
        },
      ],
      expected: false,
    },

    // Test case: Undefined entitlementGrantProductOffering should be handled gracefully
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: undefined,
        },
      ],
      expected: false,
    },
  ])(
    'should return $expected when entitlementGrants is $entitlementGrants',
    ({ entitlementGrants, expected }) => {
      const result = computeHasPayroll(
        entitlementGrants as Identity_EntitlementGrant[],
      );
      expect(result).toBe(expected);
    },
  );
});

describe('computeHasTSheets', () => {
  test.each([
    // Test case: Empty array of entitlement grants
    {
      description:
        'should return false for an empty array of entitlement grants',
      entitlementGrants: [],
      expected: false,
    },
    // Test case: No feature sets in entitlement grants
    {
      description: 'should return false when no feature sets are present',
      entitlementGrants: [
        { featureSet: null },
        { featureSet: undefined },
        { featureSet: [] },
      ],
      expected: false,
    },
    // Test case: Feature set without TSheets
    {
      description:
        'should return false when feature sets do not contain TSheets',
      entitlementGrants: [
        { featureSet: ['FEATURE_A', 'FEATURE_B'] },
        { featureSet: ['FEATURE_C'] },
      ],
      expected: false,
    },
    // Test case: Feature set with TSheets and ACTIVE status
    {
      description:
        'should return true when at least one grant has TSheets feature and ACTIVE status',
      entitlementGrants: [
        {
          featureSet: ['FEATURE_A', 'TSHEETS'],
          status: SUBSCRIPTION_STATUS.ACTIVE,
        },
        { featureSet: ['FEATURE_B'] },
      ],
      expected: true,
    },
    // Test case: Multiple feature sets with TSheets and ACTIVE
    {
      description:
        'should return true when multiple grants have TSheets feature and ACTIVE status',
      entitlementGrants: [
        { featureSet: ['TSHEETS'], status: SUBSCRIPTION_STATUS.ACTIVE },
        {
          featureSet: ['TSHEETS', 'FEATURE_B'],
          status: SUBSCRIPTION_STATUS.ACTIVE,
        },
      ],
      expected: true,
    },
    // Test case: TSheets feature but subscription not active
    {
      description:
        'should return false when TSheets feature is present but status is not ACTIVE',
      entitlementGrants: [{ featureSet: ['TSHEETS'], status: 'INACTIVE' }],
      expected: false,
    },
  ])('$description', ({ entitlementGrants, expected }) => {
    const result = computeHasTSheets(
      entitlementGrants as Identity_EntitlementGrant[],
    );
    expect(result).toBe(expected);
  });
});

describe('computeHasTSheet', () => {
  test.each([
    // Test case: Empty array should return false
    { entitlementGrants: [], expected: false, status: true },

    // Test case: No matching offeringId should return false
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: { offeringId: 'SomeOtherId' },
        },
      ],
      expected: false,
      status: true,
    },

    // Test case: Matching offeringId should return true
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: { offeringId: TSHEETS_OFFERING_ID },
          status: 'ACTIVE',
        },
      ],
      expected: true,
      status: true,
    },

    // Test case: Multiple grants with one matching offeringId should return true
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: { offeringId: 'SomeOtherId' },
        },
        {
          entitlementGrantProductOffering: { offeringId: TSHEETS_OFFERING_ID },
          status: 'ACTIVE',
        },
      ],
      expected: true,
      status: true,
    },
    // Test case: Matching offering/flavor but inactive status should return false
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: {
            offeringId: PAYROLL_OFFERING_ID,
            flavor: 'PR_PREMIUM',
          },
          status: 'INACTIVE',
        },
      ],
      expected: false,
      status: true,
    },

    // Test case: Null entitlementGrantProductOffering should be handled gracefully
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: null,
        },
      ],
      expected: false,
      status: true,
    },

    // Test case: Undefined entitlementGrantProductOffering should be handled gracefully
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: undefined,
        },
      ],
      expected: false,
      status: true,
    },
  ])(
    'should return $expected when entitlementGrants is $entitlementGrants',
    ({ entitlementGrants, expected }) => {
      const result = computeHasTSheet(
        entitlementGrants as Identity_EntitlementGrant[],
      );
      expect(result).toBe(expected);
    },
  );
});

describe('computeHasPayrollWithTSheet', () => {
  test.each([
    // Test case: Empty array should return false
    { entitlementGrants: [], expected: false, status: true },

    // Test case: No matching offeringId should return false
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: {
            offeringId: 'SomeOtherId',
            flavor: 'PR_ELITE',
          },
        },
      ],
      expected: false,
      status: true,
    },

    // Test case: Matching offeringId should return true
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: {
            offeringId: PAYROLL_OFFERING_ID,
            flavor: 'PR_ELITE',
          },
          status: 'ACTIVE',
        },
      ],
      expected: true,
      status: true,
    },

    // Test case: Multiple grants with one matching offeringId should return true
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: {
            offeringId: 'SomeOtherId',
            flavor: 'PR_ELITE',
          },
        },
        {
          entitlementGrantProductOffering: {
            offeringId: PAYROLL_OFFERING_ID,
            flavor: 'PR_ELITE',
          },
          status: 'ACTIVE',
        },
      ],
      expected: true,
      status: true,
    },

    // Test case: Null entitlementGrantProductOffering should be handled gracefully
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: null,
        },
      ],
      expected: false,
      status: true,
    },

    // Test case: Undefined entitlementGrantProductOffering should be handled gracefully
    {
      entitlementGrants: [
        {
          entitlementGrantProductOffering: undefined,
        },
      ],
      expected: false,
      status: true,
    },
  ])(
    'should return $expected when entitlementGrants is $entitlementGrants',
    ({ entitlementGrants, expected }) => {
      const result = computeHasPayrollWithTSheet(
        entitlementGrants as Identity_EntitlementGrant[],
      );
      expect(result).toBe(expected);
    },
  );
});

describe('computeHasTimeElite', () => {
  test.each([
    // Test case: Empty array of entitlement grants
    {
      description:
        'should return false for an empty array of entitlement grants',
      entitlementGrants: [],
      expected: false,
    },
    // Test case: No feature sets in entitlement grants
    {
      description: 'should return false when no feature sets are present',
      entitlementGrants: [
        { featureSet: null },
        { featureSet: undefined },
        { featureSet: [] },
      ],
      expected: false,
    },
    // Test case: Feature set without PR_ELITE or QB_TSHEETS_ELITE
    {
      description:
        'should return false when feature sets do not contain PR_ELITE or QB_TSHEETS_ELITE',
      entitlementGrants: [
        { featureSet: ['FEATURE_A', 'FEATURE_B'] },
        { featureSet: ['PR_PREMIUM', 'SOME_OTHER_FEATURE'] },
      ],
      expected: false,
    },
    // Test case: Feature set with PR_ELITE only
    {
      description:
        'should return true when at least one feature set contains PR_ELITE',
      entitlementGrants: [
        { featureSet: ['FEATURE_A', ENTITLEMENTS.PR_ELITE] },
        { featureSet: ['FEATURE_B'] },
      ],
      expected: true,
    },
    // Test case: Feature set with QB_TSHEETS_ELITE only
    {
      description:
        'should return true when at least one feature set contains QB_TSHEETS_ELITE',
      entitlementGrants: [
        { featureSet: ['FEATURE_A'] },
        { featureSet: [ENTITLEMENTS.QB_TSHEETS_ELITE, 'FEATURE_B'] },
      ],
      expected: true,
    },
    // Test case: Feature set with both PR_ELITE and QB_TSHEETS_ELITE
    {
      description:
        'should return true when feature set contains both PR_ELITE and QB_TSHEETS_ELITE',
      entitlementGrants: [
        {
          featureSet: [
            ENTITLEMENTS.PR_ELITE,
            ENTITLEMENTS.QB_TSHEETS_ELITE,
            'FEATURE_C',
          ],
        },
      ],
      expected: true,
    },
    // Test case: Multiple feature sets with PR_ELITE
    {
      description:
        'should return true when multiple feature sets contain PR_ELITE',
      entitlementGrants: [
        { featureSet: [ENTITLEMENTS.PR_ELITE] },
        { featureSet: [ENTITLEMENTS.PR_ELITE, 'FEATURE_B'] },
      ],
      expected: true,
    },
    // Test case: Multiple feature sets with QB_TSHEETS_ELITE
    {
      description:
        'should return true when multiple feature sets contain QB_TSHEETS_ELITE',
      entitlementGrants: [
        { featureSet: [ENTITLEMENTS.QB_TSHEETS_ELITE] },
        { featureSet: ['FEATURE_A', ENTITLEMENTS.QB_TSHEETS_ELITE] },
      ],
      expected: true,
    },
    // Test case: Mix of grants, only one has PR_ELITE
    {
      description:
        'should return true when at least one grant has PR_ELITE among multiple grants',
      entitlementGrants: [
        { featureSet: ['FEATURE_A'] },
        { featureSet: null },
        { featureSet: [ENTITLEMENTS.PR_ELITE] },
        { featureSet: ['FEATURE_B'] },
      ],
      expected: true,
    },
    // Test case: Mix of grants, only one has QB_TSHEETS_ELITE
    {
      description:
        'should return true when at least one grant has QB_TSHEETS_ELITE among multiple grants',
      entitlementGrants: [
        { featureSet: ['FEATURE_A'] },
        { featureSet: [] },
        { featureSet: [ENTITLEMENTS.QB_TSHEETS_ELITE] },
        { featureSet: undefined },
      ],
      expected: true,
    },
    // Test case: PR_ELITE as single feature
    {
      description: 'should return true when PR_ELITE is the only feature',
      entitlementGrants: [{ featureSet: [ENTITLEMENTS.PR_ELITE] }],
      expected: true,
    },
    // Test case: QB_TSHEETS_ELITE as single feature
    {
      description:
        'should return true when QB_TSHEETS_ELITE is the only feature',
      entitlementGrants: [{ featureSet: [ENTITLEMENTS.QB_TSHEETS_ELITE] }],
      expected: true,
    },
  ])('$description', ({ entitlementGrants, expected }) => {
    const result = computeHasTimeElite(
      entitlementGrants as Identity_EntitlementGrant[],
    );
    expect(result).toBe(expected);
  });
});
