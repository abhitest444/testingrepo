import { useState, useEffect, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { isIXPFeatureFlagEnabled } from 'src/js/service/utils/featureFlags';
import {
  isPayrollFirstCompany,
  isWorkforceEnvironment,
} from 'src/js/service/utils/sandboxUtils';
import { FEATURE_FLAGS } from './constants';

interface UseIXPFeatureFlagOptions {
  flagName: string;
  defaultValue?: boolean;
  settled?: boolean;
  checkIESMasterFlag?: boolean; // NEW: Opt-in IES master flag check
  excludePayrollFirst?: boolean; // NEW: Exclude PayrollFirst customers
}

export const useIXPFeatureFlag = ({
  flagName,
  defaultValue = false,
  checkIESMasterFlag = false,
  excludePayrollFirst = false,
}: UseIXPFeatureFlagOptions) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(defaultValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [settled, setSettled] = useState<boolean>(false);
  const sandbox = useSandbox();
  const hasChecked = useRef(false);

  useEffect(() => {
    const completeCheck = (value: boolean, logMessage?: string) => {
      if (logMessage) sandbox.logger.log(logMessage);
      setIsEnabled(value);
      hasChecked.current = true;
      setIsLoading(false);
      setSettled(true);
    };

    const checkFeatureFlag = async () => {
      if (hasChecked.current) return;

      try {
        setIsLoading(true);
        setError(null);
        const isWorkforce = isWorkforceEnvironment(sandbox);

        // Check 1: Exclude PayrollFirst customers
        const shouldExcludePayrollFirst = !(await isIXPFeatureFlagEnabled(
          sandbox,
          FEATURE_FLAGS.FEATURE_FLAG_PAYROLL_FIRST_ENABLED,
        ));

        sandbox.logger.log(
          `Event=Checking PayrollFirst exclusion - should exclude: ${shouldExcludePayrollFirst} | isPayrollFirstEntitlement: ${isPayrollFirstCompany(
            sandbox,
          )}`,
        );

        if (
          !isWorkforce &&
          shouldExcludePayrollFirst &&
          isPayrollFirstCompany(sandbox)
        ) {
          completeCheck(
            false,
            `Event=Feature flag ${flagName} disabled for PayrollFirst customer`,
          );
          return;
        }

        // Evaluate the actual feature flag
        const enabled = await isIXPFeatureFlagEnabled(sandbox, flagName);
        completeCheck(
          enabled,
          `Event=Evaluation result for feature flag - ${flagName} Result=${enabled}`,
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsEnabled(defaultValue);
        hasChecked.current = true;
        sandbox.logger.error('Failed to check feature flag:', {
          flagName,
          error: errorMessage,
        });
      } finally {
        setIsLoading(false);
        setSettled(true);
      }
    };

    checkFeatureFlag();
  }, [
    sandbox,
    flagName,
    defaultValue,
    checkIESMasterFlag,
    excludePayrollFirst,
  ]);

  return {
    isEnabled,
    isLoading,
    error,
    settled,
  };
};
