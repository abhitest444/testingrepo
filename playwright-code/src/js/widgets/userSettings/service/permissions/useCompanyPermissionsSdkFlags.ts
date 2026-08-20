import {
  PERMISSION_AUTHZ_POLICIES,
  QB_TIME_PERMISSIONS,
} from '@work-timecapture/qbtime-sdk';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';

interface CompanyPermissionsSdkFlags {
  canUseCompanyMobile: boolean;
  canCompanyManageMyTimesheets: boolean;
}

/** Company ACL policies only — PermissionsService also batches `admin` and returns true for admins. */
const COMPANY_LEVEL_AUTHZ_POLICIES = [
  PERMISSION_AUTHZ_POLICIES[QB_TIME_PERMISSIONS.COMPANY_MOBILE],
  PERMISSION_AUTHZ_POLICIES[QB_TIME_PERMISSIONS.COMPANY_MANAGE_MY_TIMESHEETS],
];

const isPermitted = (decision: { isAuthorized: boolean } | undefined) =>
  decision?.isAuthorized === true;

/** Reads company-level mobile + manage-my-timesheets grants; fails closed to `false`. */
export const useCompanyPermissionsSdkFlags = () => {
  const { data, error } = useQbTimeSdk<CompanyPermissionsSdkFlags>(
    (sdk) => async () => {
      const [mobileDecision, manageMyTimesheetsDecision] =
        await sdk.batchAuthorize(COMPANY_LEVEL_AUTHZ_POLICIES);

      return {
        canUseCompanyMobile: isPermitted(mobileDecision),
        canCompanyManageMyTimesheets: isPermitted(manageMyTimesheetsDecision),
      };
    },
    { executeOnMount: true },
  );

  const isLoading = data === undefined && error === undefined;

  return {
    canUseCompanyMobile: data?.canUseCompanyMobile ?? false,
    canCompanyManageMyTimesheets: data?.canCompanyManageMyTimesheets ?? false,
    isLoading,
  };
};

export default useCompanyPermissionsSdkFlags;
