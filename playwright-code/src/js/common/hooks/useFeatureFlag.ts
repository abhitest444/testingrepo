import { useState, useEffect, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { isIXPFeatureFlagEnabled } from 'src/js/service/utils/featureFlags';

/**
 * Generic custom hook to check if a feature flag is enabled
 * Only checks once per component instance to avoid unnecessary API calls
 *
 * @param featureFlag - The feature flag to check
 * @param defaultValue - Default value if the feature flag check fails (defaults to false)
 * @returns boolean indicating if the feature flag is enabled
 */
export const useFeatureFlag = (
  featureFlag: string,
  defaultValue: boolean = false,
) => {
  const [isEnabled, setIsEnabled] = useState(defaultValue);
  const hasInitializedRef = useRef(false);
  const sandbox = useSandbox();

  useEffect(() => {
    const checkFeatureFlag = async () => {
      if (!hasInitializedRef.current) {
        try {
          const enabled = await isIXPFeatureFlagEnabled(sandbox, featureFlag);
          sandbox.logger.log(
            `Event=Evaluation result for feature flag - ${featureFlag} Result=${enabled}`,
          );
          setIsEnabled(enabled);
          hasInitializedRef.current = true;
        } catch (error) {
          sandbox.logger.error(`Failed to check feature flag: ${featureFlag}`, {
            error: error?.toString(),
          });
          setIsEnabled(defaultValue);
          hasInitializedRef.current = true; // Mark as initialized even on error
        }
      }
    };

    checkFeatureFlag();
    // Only depend on sandbox - featureFlag and defaultValue should not change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sandbox]);

  return isEnabled;
};
