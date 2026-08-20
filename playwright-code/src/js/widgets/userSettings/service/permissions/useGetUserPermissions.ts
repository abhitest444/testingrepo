import { useCallback } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  TimeTracking_TimeForType,
  TimeTrackingWorkerPermissionsQueryVariables,
  useTimeTrackingWorkerPermissionsLazyQuery,
} from 'src/__generated__/timeTracking/graphql';
import { mapError } from 'src/js/service/utils/mapError';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { PermissionsSettings } from '../../components/cards/PermissionsCard/constants';
import { mapGqlToPermissionsSettings } from '../../store/slices/permissionsSlice';

export interface GetUserPermissionsInput {
  settingsFor: {
    id: string;
    timeForType: TimeTracking_TimeForType;
  };
}

/** Card-facing response shape (mapped view-model, no Apollo specifics). */
export interface GetUserPermissionsResponse {
  permissions: PermissionsSettings;
}

export interface UseGetUserPermissionsArgs {
  /** Optional callback invoked when permissions are successfully fetched. */
  onSuccess?: (data: GetUserPermissionsResponse) => void;
  /** Optional callback invoked when fetch fails. */
  onError?: (error: string) => void;
}

export interface UseGetUserPermissionsResult {
  data?: GetUserPermissionsResponse;
  loading: boolean;
  error?: string;
  loadUserPermissions: (input: GetUserPermissionsInput) => Promise<void>;
}

/** Lazy-query hook for `timeTrackingWorkerPermissions`; mirrors `useGetEffectiveUserSettings`. */
export const useGetUserPermissions = ({
  onSuccess,
  onError,
}: UseGetUserPermissionsArgs = {}): UseGetUserPermissionsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleMissingPermissions = useCallback(() => {
    const errorMessage =
      intl.formatMessage({ id: 'permissions.card.error.state.message' }) ||
      intl.formatMessage({ id: 'permissions.error.load' });

    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.USER_PERMISSIONS_READ,
      'EMPTY_RESPONSE',
      { message: 'timeTrackingWorkerPermissions returned null' },
    );

    onError?.(errorMessage);
  }, [intl, onError, sandbox]);

  const handleError = useCallback(
    (err: any) => {
      const errorMessage =
        mapError({
          sourceComponent: 'useGetUserPermissions',
          sandbox,
          intl,
          error: err,
        }) ??
        intl.formatMessage({ id: 'permissions.card.error.state.message' });

      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.USER_PERMISSIONS_READ,
        'QUERY_ERROR',
        { message: err?.message ?? String(err) },
      );

      onError?.(errorMessage);
    },
    [intl, onError, sandbox],
  );

  const [loadQuery, { data, loading, error }] =
    useTimeTrackingWorkerPermissionsLazyQuery({
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    });

  const loadUserPermissions = useCallback(
    (input: GetUserPermissionsInput): Promise<any> => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.USER_PERMISSIONS_READ,
      );

      const variables: TimeTrackingWorkerPermissionsQueryVariables = {
        input: {
          workerId: input.settingsFor.id,
          workerType: input.settingsFor.timeForType,
        },
      };

      return loadQuery({
        variables,
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.USER_PERMISSIONS_READ,
          ),
        },
      }).then((result) => {
        if (result.error) {
          handleError(result.error);
          return result;
        }

        const raw = result.data?.timeTrackingWorkerPermissions;
        if (raw) {
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.USER_PERMISSIONS_READ,
          );
          onSuccess?.({ permissions: mapGqlToPermissionsSettings(raw) });
        } else if (!result.loading) {
          handleMissingPermissions();
        }

        return result;
      });
    },
    [sandbox, loadQuery, onSuccess, handleMissingPermissions, handleError],
  );

  return {
    data: data?.timeTrackingWorkerPermissions
      ? {
          permissions: mapGqlToPermissionsSettings(
            data.timeTrackingWorkerPermissions,
          ),
        }
      : undefined,
    loading,
    error: error
      ? mapError({
          sourceComponent: 'useGetUserPermissions',
          sandbox,
          intl,
          error,
        })
      : undefined,
    loadUserPermissions,
  };
};
