import { useCallback } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  useTimeTrackingUnifiedUserSettingsLazyQuery,
  TimeTrackingUnifiedUserSettingsQueryVariables,
  TimeTrackingUnifiedUserSettingsQuery,
} from 'src/__generated__/timeTracking/graphql';
import { mapError } from 'src/js/service/utils/mapError';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

export interface UseGetUnifiedUserSettingsArgs {
  /** Optional callback when settings are successfully fetched */
  onSuccess?: (data: TimeTrackingUnifiedUserSettingsQuery) => void;
  /** Optional callback when fetch fails */
  onError?: (error: string) => void;
}

export interface UseGetUnifiedUserSettingsResult {
  data?: TimeTrackingUnifiedUserSettingsQuery;
  loading: boolean;
  error?: string;
  loadUnifiedUserSettings: (
    input: TimeTrackingUnifiedUserSettingsQueryVariables['input'],
  ) => Promise<void>;
}

/**
 * Hook to fetch unified user settings for a worker
 * Reusable across widgets - uses Apollo's built-in state management
 *
 * Callbacks are passed at hook initialization (following useGetEffectiveUserSettings pattern)
 *
 * @example
 * const { loadUnifiedUserSettings, loading } = useGetUnifiedUserSettings({
 *   onSuccess: (data) => dispatch(resetLocationState(data)),
 *   onError: (error) => dispatch(setLocationError(error)),
 * });
 *
 * loadUnifiedUserSettings({ settingsFor: { id, timeForType } });
 */
export const useGetUnifiedUserSettings = ({
  onSuccess,
  onError,
}: UseGetUnifiedUserSettingsArgs = {}): UseGetUnifiedUserSettingsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = (
    responseData: TimeTrackingUnifiedUserSettingsQuery,
  ) => {
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.USER_UNIFIED_SETTINGS_READ,
    );
    onSuccess?.(responseData);
  };

  const handleError = (err: ApolloError) => {
    const errorMessage = mapError({
      sourceComponent: 'useGetUnifiedUserSettings',
      sandbox,
      intl,
      error: err,
    });

    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.USER_UNIFIED_SETTINGS_READ,
      'QUERY_ERROR',
      { message: err.message },
    );

    onError?.(errorMessage ?? 'Unknown error');
  };

  const [loadQuery, { data, loading, error }] =
    useTimeTrackingUnifiedUserSettingsLazyQuery({
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
      onCompleted: (responseData) => {
        if (responseData) {
          handleSuccess(responseData);
        }
      },
      onError: handleError,
    });

  const loadUnifiedUserSettings = useCallback(
    (
      input: TimeTrackingUnifiedUserSettingsQueryVariables['input'],
    ): Promise<any> => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.USER_UNIFIED_SETTINGS_READ,
      );
      return loadQuery({
        variables: { input },
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.USER_UNIFIED_SETTINGS_READ,
          ),
        },
      });
    },
    [sandbox, loadQuery],
  );

  return {
    data,
    loading,
    error: error
      ? mapError({
          sourceComponent: 'useGetUnifiedUserSettings',
          sandbox,
          intl,
          error,
        })
      : undefined,
    loadUnifiedUserSettings,
  };
};
