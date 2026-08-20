import type { Identity_EntitlementGrant } from 'src/__generated__/oigql/graphql';
import { Sandbox } from 'src/js/common/sandbox';
import { getLocalizationInfo } from 'src/js/service/utils/sandboxUtils';
import { QualtricsActiveEmployer } from 'src/js/widgets/common/feedbackSurvey/QualtricsSurveyWidget';

const REGION_TO_PRODUCT: Record<string, string> = {
  US: 'US-Online',
  CA: 'CA-Online',
  GB: 'GB-Online',
};

const getProductFromRegion = (region?: string): string => {
  if (!region) {
    return REGION_TO_PRODUCT.US;
  }

  return REGION_TO_PRODUCT[region.toUpperCase()] || REGION_TO_PRODUCT.US;
};

export interface ProfileCompanyAndRolesMetadata {
  companyName?: string;
  userRoles?: QualtricsActiveEmployer['userRoles'];
}

export const getQualtricsSurveyActiveEmployer = (
  sandbox: Sandbox,
  entitlementGrants: Identity_EntitlementGrant[] = [],
  metadata: ProfileCompanyAndRolesMetadata = {},
): QualtricsActiveEmployer => {
  const employerId = sandbox.appContext?.getRealmInfo?.()?.realmId;
  const region = getLocalizationInfo(sandbox)?.region;
  const product = getProductFromRegion(region);
  const companyName = metadata.companyName || '';
  return {
    employerId,
    product,
    companyName,
    employerName: companyName,
    ...(metadata.userRoles ? { userRoles: metadata.userRoles } : {}),
    entitlementGrants,
  };
};
