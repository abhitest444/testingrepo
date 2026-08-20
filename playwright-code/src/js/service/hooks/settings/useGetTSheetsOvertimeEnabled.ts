import { useCallback, useEffect, useState, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { GET_TSHEETS_OVERTIME_ENABLED } from 'src/js/service/queries/tsheetsQueries';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { isIXPFeatureFlagEnabled } from 'src/js/service/utils/featureFlags';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

/**
 * Response interface for TSheets overtime settings query
 */
interface TSheetsOvertimeSettingsResponse {
  timeTrackingSettings: {
    overtimeSettings: {
      addonEnabled: boolean;
    };
  };
}

/**
 * Hook result interface
 */
export interface UseGetTSheetsOvertimeEnabledResult {
  /**
   * Whether overtime addon is enabled in TSheets company settings
   */
  overtimeEnabled: boolean;
  /**
   * Whether the API call is in progress
   */
  loading: boolean;
  /**
   * Error message if the API call failed
   */
  error?: string;
  /**
   * Function to manually refetch the overtime enabled status
   */
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch TSheets company settings to check if overtime is enabled.
 *
 * This hook queries the TSheets GraphQL API to determine if the overtime addon
 * is enabled for the current company. It's used as a pre-check before making
 * expensive IXP feature flag calls.
 *
 * @returns Object containing overtimeEnabled status, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { overtimeEnabled, loading, error } = useGetTSheetsOvertimeEnabled();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *
 *   if (overtimeEnabled) {
 *     return <OvertimeFeatures />;
 *   }
 *
 *   return <StandardFeatures />;
 * };
 * ```
 */
export const useGetTSheetsOvertimeEnabled =
  (): UseGetTSheetsOvertimeEnabledResult => {
    const sandbox = useSandbox();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>(undefined);
    const [overtimeEnabled, setOvertimeEnabled] = useState<boolean>(false);

    const fetchOvertimeEnabled = useCallback(async () => {
      const interactionType = TimeCustomerInteraction.OVERTIME_SETTINGS_GET;
      setLoading(true);
      setError(undefined);
      createCustomerInteraction(sandbox, interactionType);

      try {
        sandbox.logger.info(
          'Component=useGetTSheetsOvertimeEnabled Event=Fetching overtime enabled status',
        );

        const client = getApolloClientInstance(sandbox);
        if (!client) {
          throw new Error('Apollo client not initialized');
        }

        const result = await client.query<TSheetsOvertimeSettingsResponse>({
          query: GET_TSHEETS_OVERTIME_ENABLED,
          context: {
            clientName: ApolloClientNames.TSHEETS,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              interactionType,
            ),
          },
          fetchPolicy: 'cache-first',
        });

        if (result.errors?.length) {
          const errMsg = result.errors.map((e) => e.message).join('; ');
          throw new Error(errMsg);
        }

        const enabled =
          result.data?.timeTrackingSettings?.overtimeSettings?.addonEnabled ??
          false;

        setOvertimeEnabled(enabled);
        endInteractionWithSuccess(sandbox, interactionType);

        sandbox.logger.info(
          'Component=useGetTSheetsOvertimeEnabled Event=Overtime enabled status fetched successfully',
          {
            overtimeEnabled: enabled,
          },
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setOvertimeEnabled(false); // Default to false on error
        endInteractionWithFailure(sandbox, interactionType, errorMessage, err);

        sandbox.logger.error(
          'Component=useGetTSheetsOvertimeEnabled Event=Failed to fetch overtime enabled status',
          {
            error: errorMessage,
          },
        );
      } finally {
        setLoading(false);
      }
    }, [sandbox]);

    useEffect(() => {
      fetchOvertimeEnabled();
    }, [fetchOvertimeEnabled]);

    return {
      overtimeEnabled,
      loading,
      error,
      refetch: fetchOvertimeEnabled,
    };
  };

/**
 * Result interface for useOvertimeFeatureFlag hook
 */
export interface UseOvertimeFeatureFlagResult {
  /**
   * Whether the overtime feature is enabled (TSheets addon + IXP flag)
   */
  isEnabled: boolean;
  /**
   * Whether any checks are still in progress
   */
  isLoading: boolean;
  /**
   * Whether the final value has been determined (true when all checks are complete)
   * Use this instead of !isLoading to avoid race conditions
   */
  settled: boolean;
}

/**
 * Custom hook to check if overtime feature is enabled.
 *
 * Combines TSheets company settings check (overtimeSettings.addonEnabled)
 * with IXP feature flag check. The IXP API call is only made when TSheets
 * addon is enabled, avoiding unnecessary network requests.
 *
 * @returns Object containing isEnabled status and loading state
 *
 * @example
 * ```tsx
 * const { isEnabled, isLoading } = useOvertimeFeatureFlag();
 * if (isLoading) return <Spinner />;
 * return isEnabled ? <OvertimeFeatures /> : <StandardFeatures />;
 * ```
 */
export const useOvertimeFeatureFlag = (): UseOvertimeFeatureFlagResult => {
  const sandbox = useSandbox();
  const {
    overtimeEnabled: isTSheetsOvertimeEnabled,
    loading: isTSheetsOvertimeLoading,
  } = useGetTSheetsOvertimeEnabled();

  const [isIXPEnabled, setIsIXPEnabled] = useState<boolean>(false);
  const [isIXPLoading, setIsIXPLoading] = useState<boolean>(false);
  const [settled, setSettled] = useState<boolean>(false);
  const hasCheckedIXP = useRef(false);

  useEffect(() => {
    const checkIXPFlag = async () => {
      // Wait for TSheets loading to complete before making decisions
      if (isTSheetsOvertimeLoading) return;

      if (!isTSheetsOvertimeEnabled) {
        setIsIXPEnabled(false);
        setIsIXPLoading(false);
        setSettled(true);
        hasCheckedIXP.current = false;
        return;
      }

      if (hasCheckedIXP.current) return;
      hasCheckedIXP.current = true;

      try {
        setIsIXPLoading(true);
        setSettled(false);
        const enabled = await isIXPFeatureFlagEnabled(
          sandbox,
          FEATURE_FLAGS.QB_OVERTIME_SETTINGS_UI,
        );
        setIsIXPEnabled(enabled);
        setSettled(true);
        sandbox.logger.log(
          `Event=Evaluation result for feature flag - ${FEATURE_FLAGS.QB_OVERTIME_SETTINGS_UI} Result=${enabled}`,
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        sandbox.logger.error('Failed to check overtime IXP feature flag:', {
          flagName: FEATURE_FLAGS.QB_OVERTIME_SETTINGS_UI,
          error: errorMessage,
        });
        setIsIXPEnabled(false);
        setSettled(true);
      } finally {
        setIsIXPLoading(false);
      }
    };

    checkIXPFlag();
  }, [sandbox, isTSheetsOvertimeEnabled, isTSheetsOvertimeLoading]);

  return {
    isEnabled: isTSheetsOvertimeEnabled && isIXPEnabled,
    isLoading: isTSheetsOvertimeLoading || isIXPLoading,
    settled,
  };
};
