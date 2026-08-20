import { useEffect, useState } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useGetQbTimeSdk } from './useGetQbTimeSdk';

/**
 * Returns whether the current worker can manage their own timesheets, per the
 * QbTime SDK `permissions.canManageMyTimesheets()` ACL check.
 *
 * The ACL check is gated behind the `QB_TIME_SHOW_PERMISSIONS_IN_USER_SETTINGS`
 * IXP flag: only when the flag is enabled do we run the SDK permission check.
 * When the flag is off, the permissions feature is not live for the company, so
 * we short-circuit to `true` (worker can manage — no lock is applied).
 *
 * Resolves the SDK instance via `useGetQbTimeSdk` and evaluates the permission
 * once the flag has settled (and whenever the SDK instance changes). Returns
 * `null` until the flag settles and the check resolves.
 */
export const useCanManageMyTimesheets = (): boolean | null => {
  const sdk = useGetQbTimeSdk();
  const sandbox = useSandbox();
  const { isEnabled: isPermissionsCheckEnabled, isLoading: isFlagLoading } =
    useIXPFeatureFlag({
      flagName: FEATURE_FLAGS.QB_TIME_SHOW_PERMISSIONS_IN_USER_SETTINGS,
      defaultValue: false,
    });
  const [canManageMyTimesheets, setCanManageMyTimesheets] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    // Wait for the flag to settle before deciding so we don't briefly apply
    // (or skip) the lock based on the default value.
    if (isFlagLoading) {
      return () => {};
    }

    // Permissions feature is off for this company — skip the ACL check and
    // treat the worker as able to manage their timesheets.
    if (!isPermissionsCheckEnabled) {
      setCanManageMyTimesheets(true);
      return () => {};
    }

    let isActive = true;
    const resolvePermission = async () => {
      try {
        sandbox.logger.info(
          'Component=useCanManageMyTimesheets Event=Resolving canManageMyTimesheets permission',
        );
        const result = await sdk.permissions.canManageMyTimesheets();
        if (isActive) {
          setCanManageMyTimesheets(result);
        }
        sandbox.logger.info(
          'Component=useCanManageMyTimesheets Event=Resolved canManageMyTimesheets permission',
          {
            canManageMyTimesheets: result,
          },
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        sandbox.logger.error(
          'Component=useCanManageMyTimesheets Event=Failed to resolve canManageMyTimesheets permission',
          {
            error: errorMessage,
          },
        );
        if (isActive) {
          setCanManageMyTimesheets(false);
        }
      }
    };
    resolvePermission();
    return () => {
      isActive = false;
    };
  }, [sdk, sandbox, isPermissionsCheckEnabled, isFlagLoading]);

  return canManageMyTimesheets;
};
