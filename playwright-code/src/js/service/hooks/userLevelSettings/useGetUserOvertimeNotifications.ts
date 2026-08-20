import { useCallback } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import {
  ApolloError,
  useLazyQuery,
  type WatchQueryFetchPolicy,
} from '@apollo/client';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { GET_USER_OVERTIME_NOTIFICATIONS } from 'src/js/service/queries/userSettingsQueries';
import {
  TimeTrackingUnifiedUserSettingsQueryVariables,
  TimeTracking_OvertimeNotificationSettings,
} from 'src/__generated__/timeTracking/graphql';
import { mapError } from 'src/js/service/utils/mapError';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

/** Result shape for {@link GET_USER_OVERTIME_NOTIFICATIONS} (overtime branch only). */
export type GetUserOvertimeNotificationsQuery = {
  timeTrackingUnifiedUserSettings?: {
    __typename?: 'TimeTracking_UnifiedUserSettings';
    overtimeNotifications?: TimeTracking_OvertimeNotificationSettings | null;
  } | null;
};

export interface UseGetUserOvertimeNotificationsArgs {
  onSuccess?: (data: GetUserOvertimeNotificationsQuery) => void;
  onError?: (error: string) => void;
  customerInteraction?: TimeCustomerInteraction;
}

export interface LoadUserOvertimeNotificationsOptions {
  fetchPolicy?: WatchQueryFetchPolicy;
}

export interface UseGetUserOvertimeNotificationsResult {
  data?: GetUserOvertimeNotificationsQuery;
  loading: boolean;
  error?: string;
  loadUserOvertimeNotifications: (
    input: TimeTrackingUnifiedUserSettingsQueryVariables['input'],
    options?: LoadUserOvertimeNotificationsOptions,
  ) => Promise<void>;
}

/**
 * Fetches overtime notification rules via {@link GET_USER_OVERTIME_NOTIFICATIONS}.
 * Does not use {@link useGetUnifiedUserSettings} (location-only unified query on the wire).
 */
export const useGetUserOvertimeNotifications = ({
  onSuccess,
  onError,
  customerInteraction = TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
}: UseGetUserOvertimeNotificationsArgs = {}): UseGetUserOvertimeNotificationsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = (responseData: GetUserOvertimeNotificationsQuery) => {
    endInteractionWithSuccess(sandbox, customerInteraction);
    onSuccess?.(responseData);
  };

  const handleError = (err: ApolloError) => {
    const errorMessage = mapError({
      sourceComponent: 'useGetUserOvertimeNotifications',
      sandbox,
      intl,
      error: err,
    });

    endInteractionWithFailure(sandbox, customerInteraction, 'QUERY_ERROR', {
      message: err.message,
    });

    onError?.(errorMessage ?? 'Unknown error');
  };

  const [loadQuery, { data, loading, error }] = useLazyQuery<
    GetUserOvertimeNotificationsQuery,
    TimeTrackingUnifiedUserSettingsQueryVariables
  >(GET_USER_OVERTIME_NOTIFICATIONS, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    onCompleted: (responseData) => {
      if (responseData) {
        handleSuccess(responseData);
      }
    },
    onError: handleError,
  });

  const loadUserOvertimeNotifications = useCallback(
    (
      input: TimeTrackingUnifiedUserSettingsQueryVariables['input'],
      options?: LoadUserOvertimeNotificationsOptions,
    ): Promise<void> => {
      createCustomerInteraction(sandbox, customerInteraction);
      loadQuery({
        variables: { input },
        ...(options?.fetchPolicy && { fetchPolicy: options.fetchPolicy }),
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            customerInteraction,
          ),
        },
      });
      return Promise.resolve();
    },
    [sandbox, loadQuery, customerInteraction],
  );

  return {
    data,
    loading,
    error: error
      ? mapError({
          sourceComponent: 'useGetUserOvertimeNotifications',
          sandbox,
          intl,
          error,
        })
      : undefined,
    loadUserOvertimeNotifications,
  };
};
