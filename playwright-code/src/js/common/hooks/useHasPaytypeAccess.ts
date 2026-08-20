import { useState, useEffect } from 'react';
import { Sandbox } from 'src/js/common/sandbox';

interface UseHasPaytypeAccessOptions {
  enabled?: boolean;
}

interface UseHasPaytypeAccessResult {
  hasPaytypeAccess: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to check if user has paytype access.
 * Checks if the user has HR manager (Intuit.sb.qb.hrAdmin) or
 * Payroll manager (Intuit.sb.payroll.manage) role on
 * Intuit.iam.identity.accountv2 resource.
 *
 * @param sandbox - The sandbox instance
 * @param options - Configuration options
 * @param options.enabled - Whether to perform the check (default: true)
 * @returns Object containing hasPaytypeAccess, isLoading, and error states
 */
export const useHasPaytypeAccess = (
  sandbox: Sandbox,
  options: UseHasPaytypeAccessOptions = {},
): UseHasPaytypeAccessResult => {
  const { enabled = true } = options;

  const [hasPaytypeAccess, setHasPaytypeAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!enabled) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
      const checkAuthorization = async () => {
        try {
          const resource = { id: 'Intuit.iam.identity.accountv2' };

          // Check for HR manager and Payroll manager roles
          const [isHrAdminResult, payrollManageAccessResult] =
            await Promise.all([
              // HR manager role check
              sandbox?.authorization.isAuthorized(resource, {
                id: 'Intuit.sb.qb.hrAdmin',
              }),
              // Payroll manager role check
              sandbox?.authorization.isAuthorized(resource, {
                id: 'Intuit.sb.payroll.manage',
              }),
            ]);

          if (isMounted) {
            const hasAccess =
              (isHrAdminResult?.isAuthorized ?? false) ||
              (payrollManageAccessResult?.isAuthorized ?? false);
            setHasPaytypeAccess(hasAccess);
          }
        } catch (err) {
          if (isMounted) {
            const errorObj =
              err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            sandbox?.logger?.error(
              'Plugin=time-tracking-ui Error=PAYTYPE_ACCESS_CHECK_FAILED',
              { error: errorObj.message },
            );
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      checkAuthorization();
    }

    return () => {
      isMounted = false;
    };
  }, [sandbox, enabled]);

  return { hasPaytypeAccess, isLoading, error };
};

export default useHasPaytypeAccess;
