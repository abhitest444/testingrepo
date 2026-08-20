import { useCallback } from 'react';
import { ApolloError } from '@apollo/client';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  TimeTracking_TimeForType,
  TimeTrackingUpdateWorkerPermissionsMutation,
  useTimeTrackingUpdateWorkerPermissionsMutation,
} from 'src/__generated__/timeTracking/graphql';
import { mapError } from 'src/js/service/utils/mapError';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  isExpectedError,
  mapTimeTrackingMutationError,
} from 'src/js/service/errors/timeTrackingErrors';
import { PermissionsSettings } from '../../components/cards/PermissionsCard/constants';
import { mapGqlToPermissionsSettings } from '../../store/slices/permissionsSlice';
import { buildUpdateWorkerPermissionsInput } from './permissionsMapper';

export interface ManageUserPermissionsInput {
  settingsFor: {
    id: string;
    timeForType: TimeTracking_TimeForType;
  };
  /** New (draft) permissions the user is trying to save. */
  permissions: PermissionsSettings;
  /** Last server-truth permissions; used to derive a sparse diff. */
  previousPermissions: PermissionsSettings;
}

export interface ManageUserPermissionsResponse {
  permissions: PermissionsSettings;
}

export interface UseManageUserPermissionsArgs {
  onSuccess?: (data: ManageUserPermissionsResponse) => void;
  onError?: (error: string) => void;
  /** FCI to trace this save to. Defaults to `USER_PERMISSIONS_SAVE`. */
  interaction?: TimeCustomerInteraction;
}

export interface UseManageUserPermissionsResult {
  loading: boolean;
  saveUserPermissions: (input: ManageUserPermissionsInput) => Promise<void>;
}

/** Mutation hook for `timeTrackingUpdateWorkerPermissions`; mirrors `useManageUnifiedUserSettings`. */
export const useManageUserPermissions = ({
  onSuccess,
  onError,
  interaction = TimeCustomerInteraction.USER_PERMISSIONS_SAVE,
}: UseManageUserPermissionsArgs = {}): UseManageUserPermissionsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = useCallback(
    (payload: ManageUserPermissionsResponse) => {
      sandbox.logger.info(
        'Component=useManageUserPermissions Event=Successfully saved permissions',
      );
      if (interaction) {
        endInteractionWithSuccess(sandbox, interaction);
      }
      onSuccess?.(payload);
    },
    [sandbox, interaction, onSuccess],
  );

  const handleError = useCallback(
    (
      errorCode: string | ApolloError | undefined,
      message = '',
      details = '',
      subCode = '',
    ) => {
      sandbox.logger.error(
        `Component=useManageUserPermissions Event=Error saving permissions: ${errorCode}`,
      );

      if (interaction && errorCode) {
        if (isExpectedError(errorCode)) {
          endInteractionWithSuccess(sandbox, interaction);
        } else {
          endInteractionWithFailure(
            sandbox,
            interaction,
            (errorCode instanceof ApolloError
              ? errorCode.message
              : errorCode) as string,
          );
        }
      }

      const customErrorHandler = (raw: string) => {
        if (
          (raw === 'GENERAL_V3_ERROR' || raw === 'GENERAL_V1_ERROR') &&
          subCode.trim()?.length > 0
        ) {
          return `${message} ${details}`;
        }
        return mapTimeTrackingMutationError(intl, raw, subCode);
      };

      const mappedError = mapError({
        sourceComponent: 'useManageUserPermissions',
        sandbox,
        intl,
        error: errorCode,
        customErrorHandler,
      });

      if (mappedError) {
        onError?.(mappedError);
      }
    },
    [sandbox, intl, interaction, onError],
  );

  const handleApolloError = (error: ApolloError) => {
    handleError(error);
  };

  const handleCompleted = useCallback(
    (result: TimeTrackingUpdateWorkerPermissionsMutation) => {
      const payload = result.timeTrackingUpdateWorkerPermissions;
      if (!payload) {
        handleError('Null Response');
        return;
      }

      if (payload.__typename === 'TimeTracking_UpdateWorkerPermissionsError') {
        handleError(
          payload.errorCode,
          payload.message ?? '',
          payload.details ?? '',
          payload.subCode ?? '',
        );
        return;
      }

      if (
        payload.__typename === 'TimeTracking_UpdateWorkerPermissionsPayload'
      ) {
        const updated = payload.workerPermissions;
        if (!updated) {
          handleError('Null Response');
          return;
        }
        handleSuccess({ permissions: mapGqlToPermissionsSettings(updated) });
        return;
      }

      handleError('Unexpected response type');
    },
    [handleError, handleSuccess],
  );

  const [mutate, { loading }] = useTimeTrackingUpdateWorkerPermissionsMutation({
    context: { clientName: ApolloClientNames.TIME_TRACKING },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });

  const saveUserPermissions = useCallback(
    async (input: ManageUserPermissionsInput): Promise<void> => {
      if (interaction) {
        createCustomerInteraction(sandbox, interaction);
      }

      const updateInput = buildUpdateWorkerPermissionsInput({
        workerId: input.settingsFor.id,
        workerType: input.settingsFor.timeForType,
        next: input.permissions,
        previous: input.previousPermissions,
      });

      try {
        await mutate({
          variables: { input: updateInput },
          context: {
            clientName: ApolloClientNames.TIME_TRACKING,
            ...(interaction && {
              headers: getCustomerInteractionPropagationHeaders(
                sandbox,
                interaction,
              ),
            }),
          },
        });
      } catch (error) {
        // Defensive: Apollo's onError handles GraphQL/network errors; this catches sync link failures.
        sandbox.logger.error(
          'Component=useManageUserPermissions Event=Unexpected error during mutation',
          { error },
        );
      }
    },
    [mutate, sandbox, interaction],
  );

  return { loading, saveUserPermissions };
};
