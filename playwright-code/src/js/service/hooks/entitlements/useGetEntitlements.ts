import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { useAppContext, useIntl, useSandbox } from '@payroll/quicksand';
import { getDecision } from '@core-app/variability-sync-sdk';
import {
  AccountType,
  GetBulkAccountEntitlementGrantsQuery_Query,
  Identity_EntitlementGrant,
  useGetBulkAccountEntitlementGrantsQuery,
} from 'src/__generated__/oigql/graphql';
import { ENTITLEMENTS } from 'src/js/common/constants';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';

export const PAYROLL_OFFERING_ID = 'Intuit.ems.iop';
const TSHEETS_FEATURE_SET_ID: RegExp = /TSHEETS/;
export const TSHEETS_OFFERING_ID = 'Intuit.qbshared.tsheets';

export interface UseGetEntitlementsResult {
  data: Identity_EntitlementGrant[];
  error?: string;
  loading: boolean;
}

interface UseGetEntitlementsOptions {
  client?: ApolloClient<NormalizedCacheObject>;
  skip?: boolean;
}

export const PAYROLL_FLAVOR_WITH_TIME = ['PR_ELITE', 'PR_PREMIUM'];

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
};

const mapEntitlements = (
  data?: GetBulkAccountEntitlementGrantsQuery_Query,
): Identity_EntitlementGrant[] =>
  data?.identityBulkLookupAccountEntitlementGrants?.edges?.flatMap(
    (edge) => edge?.node?.entitlementGrants || [],
  ) || [];

export const useGetEntitlements = (
  options?: UseGetEntitlementsOptions,
): UseGetEntitlementsResult => {
  const { realmId } = useAppContext();
  const sandbox = useSandbox();
  const intl = useIntl();

  const { loading, data, error } = useGetBulkAccountEntitlementGrantsQuery({
    client: options?.client,
    skip: options?.skip ?? false,
    variables: {
      filterBy: {
        accountIds: [realmId!],
        accountType: AccountType.Organization,
      },
    },
    context: {
      // both ApolloClientNames.IDENTITY and ApolloClientNames.OIGQL use the same schema
      // but have to call the Identity endpoint for now
      clientName: ApolloClientNames.IDENTITY,
    },
    fetchPolicy: 'cache-and-network',
  });

  const mappedError = mapError({
    sourceComponent: 'useGetEntitlements',
    sandbox,
    intl,
    error,
  });

  return {
    loading,
    data: mapEntitlements(data), // can respond with 'error' data ?
    error: mappedError,
  };
};

export const computeHasPayroll = (
  entitlementGrants: Identity_EntitlementGrant[],
): boolean =>
  entitlementGrants.some(
    (entitlementGrant) =>
      entitlementGrant.entitlementGrantProductOffering?.offeringId ===
      PAYROLL_OFFERING_ID,
  );

export const computeHasTSheets = (
  entitlementGrants: Identity_EntitlementGrant[],
): boolean =>
  entitlementGrants.some(
    (entitlementGrant) =>
      !!entitlementGrant &&
      entitlementGrant.featureSet?.some(
        (feature) => feature != null && TSHEETS_FEATURE_SET_ID.test(feature),
      ) &&
      entitlementGrant.status === SUBSCRIPTION_STATUS.ACTIVE,
  );

// Check if the company has Time Elite features
// TimeElite is enabled for companies having payroll elite or tsheet elite subscriptions
export const computeHasTimeElite = (
  entitlementGrants: Identity_EntitlementGrant[],
): boolean => {
  const hasTimeEliteEntitlement = entitlementGrants.some((entitlementGrant) =>
    entitlementGrant.featureSet?.some(
      (feature) =>
        feature === ENTITLEMENTS.PR_ELITE ||
        feature === ENTITLEMENTS.QB_TSHEETS_ELITE,
    ),
  );

  const hasTimeElite = getDecision('isTimeElite', {
    defaultValue: hasTimeEliteEntitlement,
  });
  return hasTimeElite;
};

export const computeHasPayrollWithTSheet = (
  entitlementGrants: Identity_EntitlementGrant[],
): boolean =>
  entitlementGrants.some(
    (entitlementGrant) =>
      entitlementGrant.entitlementGrantProductOffering?.offeringId ===
        PAYROLL_OFFERING_ID &&
      entitlementGrant.entitlementGrantProductOffering.flavor &&
      PAYROLL_FLAVOR_WITH_TIME.includes(
        entitlementGrant.entitlementGrantProductOffering?.flavor,
      ) &&
      entitlementGrant.status === SUBSCRIPTION_STATUS.ACTIVE,
  );

export const computeHasTSheet = (
  entitlementGrants: Identity_EntitlementGrant[],
): boolean =>
  entitlementGrants.some(
    (entitlementGrant) =>
      entitlementGrant.entitlementGrantProductOffering?.offeringId ===
        TSHEETS_OFFERING_ID &&
      entitlementGrant.status === SUBSCRIPTION_STATUS.ACTIVE,
  );
