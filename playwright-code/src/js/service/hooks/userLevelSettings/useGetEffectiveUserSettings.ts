import { useCallback } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  useTimeTrackingEffectiveUserSettingsLazyQuery,
  TimeTrackingEffectiveUserSettingsQueryVariables,
  TimeTrackingEffectiveUserSettingsQuery,
} from 'src/__generated__/timeTracking/graphql';
import { mapError } from 'src/js/service/utils/mapError';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

export interface UseGetEffectiveUserSettingsArgs {
  /** Optional callback when settings are successfully fetched */
  onSuccess?: (data: TimeTrackingEffectiveUserSettingsQuery) => void;
  /** Optional callback when fetch fails */
  onError?: (error: string) => void;
}

export interface UseGetEffectiveUserSettingsResult {
  data?: TimeTrackingEffectiveUserSettingsQuery;
  loading: boolean;
  error?: string;
  loadEffectiveUserSettings: (
    input: TimeTrackingEffectiveUserSettingsQueryVariables['input'],
  ) => Promise<void>;
}

/**
 * Hook to fetch effective user settings for a worker
 * Reusable across widgets - uses Apollo's built-in state management
 *
 * Callbacks are passed at hook initialization (following useManageCustomFieldAssignment pattern)
 *
 * @example
 * const { loadEffectiveUserSettings, loading } = useGetEffectiveUserSettings({
 *   onSuccess: (data) => dispatch(resetState(data)),
 *   onError: (error) => dispatch(setNotificationsError(error)),
 * });
 *
 * loadEffectiveUserSettings({ settingsFor: { id, timeForType } });
 */
export const useGetEffectiveUserSettings = ({
  onSuccess,
  onError,
}: UseGetEffectiveUserSettingsArgs = {}): UseGetEffectiveUserSettingsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = (
    responseData: TimeTrackingEffectiveUserSettingsQuery,
  ) => {
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
    );
    onSuccess?.(responseData);
  };

  const handleError = (err: any) => {
    const errorMessage = mapError({
      sourceComponent: 'useGetEffectiveUserSettings',
      sandbox,
      intl,
      error: err,
    });

    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
      'QUERY_ERROR',
      { message: err.message },
    );

    onError?.(errorMessage ?? 'Unknown error');
  };

  const [loadQuery, { data, loading, error }] =
    useTimeTrackingEffectiveUserSettingsLazyQuery({
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
      onCompleted: (responseData) => {
        if (responseData) {
          handleSuccess(responseData);
        }
      },
      onError: handleError,
    });

  const loadEffectiveUserSettings = useCallback(
    (
      input: TimeTrackingEffectiveUserSettingsQueryVariables['input'],
    ): Promise<any> => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
      );
      return loadQuery({
        variables: { input },
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
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
          sourceComponent: 'useGetEffectiveUserSettings',
          sandbox,
          intl,
          error,
        })
      : undefined,
    loadEffectiveUserSettings,
  };
};
