import { useCallback } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError, useMutation } from '@apollo/client';
import { ManageUserOvertimeNotificationsDocument } from 'src/js/service/queries/userSettingsQueries';
import {
  TimeTracking_ManageUnifiedUserSettingsError,
  TimeTracking_ManageUnifiedUserSettingsInput,
  TimeTracking_ManageUnifiedUserSettingsPayload,
  TimeTrackingManageUnifiedUserSettingsMutation,
  TimeTrackingManageUnifiedUserSettingsMutationVariables,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
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

export interface UseManageUserOvertimeNotificationsArgs {
  onSuccess: (data: TimeTracking_ManageUnifiedUserSettingsPayload) => void;
  onError: (error: string) => void;
  interaction?: TimeCustomerInteraction;
}

export interface UseManageUserOvertimeNotificationsResult {
  /** Resolves to true only when the mutation payload is a success payload (not an error code). */
  saveUserOvertimeNotifications: (
    input: TimeTracking_ManageUnifiedUserSettingsInput,
  ) => Promise<boolean>;
  loading: boolean;
}

/**
 * Saves overtime notification rules via {@link ManageUserOvertimeNotificationsDocument}.
 * Does not use {@link useManageUnifiedUserSettings} (location-only mutation selection on the wire).
 */
export const useManageUserOvertimeNotifications = ({
  onSuccess,
  onError,
  interaction,
}: UseManageUserOvertimeNotificationsArgs): UseManageUserOvertimeNotificationsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = useCallback(
    (payload: TimeTracking_ManageUnifiedUserSettingsPayload) => {
      sandbox.logger.info(
        'Component=useManageUserOvertimeNotifications Event=Successfully saved overtime notifications',
      );
      if (interaction) {
        endInteractionWithSuccess(sandbox, interaction);
      }
      onSuccess(payload);
    },
    [sandbox, interaction, onSuccess],
  );

  const handleApolloError = (error: ApolloError) => {
    handleError(error);
  };

  const handleError = useCallback(
    (
      errorCode: string | ApolloError | undefined,
      message = '',
      details = '',
      subCode = '',
    ) => {
      sandbox.logger.error(
        `Component=useManageUserOvertimeNotifications Event=Error saving overtime notifications: ${errorCode}`,
        { message, details },
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

      const customErrorHandler = (error: string) => {
        if (
          (error === 'GENERAL_V3_ERROR' || error === 'GENERAL_V1_ERROR') &&
          subCode.trim()?.length > 0
        ) {
          return `${message} ${details}`;
        }
        return mapTimeTrackingMutationError(intl, error);
      };

      const mappedError = mapError({
        sourceComponent: 'useManageUserOvertimeNotifications',
        sandbox,
        intl,
        error: errorCode,
        customErrorHandler,
      });

      if (mappedError) {
        onError(mappedError);
      }
    },
    [sandbox, intl, interaction, onError],
  );

  const handleCompleted = useCallback(
    (result: TimeTrackingManageUnifiedUserSettingsMutation) => {
      if (!result.timeTrackingManageUnifiedUserSettings) {
        handleError('Null Response');
        return;
      }

      const response = result.timeTrackingManageUnifiedUserSettings;

      if (
        response.__typename === 'TimeTracking_ManageUnifiedUserSettingsError'
      ) {
        const err = response as TimeTracking_ManageUnifiedUserSettingsError;
        handleError(
          err.errorCode,
          err.message ?? '',
          err.details ?? '',
          err.subCode ?? '',
        );
      } else if (
        response.__typename === 'TimeTracking_ManageUnifiedUserSettingsPayload'
      ) {
        handleSuccess(
          response as TimeTracking_ManageUnifiedUserSettingsPayload,
        );
      } else {
        handleError('Unexpected response type');
      }
    },
    [handleError, handleSuccess],
  );

  const [mutate, { loading }] = useMutation<
    TimeTrackingManageUnifiedUserSettingsMutation,
    TimeTrackingManageUnifiedUserSettingsMutationVariables
  >(ManageUserOvertimeNotificationsDocument, {
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });

  const saveUserOvertimeNotifications = useCallback(
    async (input: TimeTracking_ManageUnifiedUserSettingsInput) => {
      if (interaction) {
        createCustomerInteraction(sandbox, interaction);
      }

      try {
        const result = await mutate({
          variables: { input },
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
        const root = result.data?.timeTrackingManageUnifiedUserSettings;
        if (
          root?.__typename === 'TimeTracking_ManageUnifiedUserSettingsError'
        ) {
          return false;
        }
        return (
          root?.__typename === 'TimeTracking_ManageUnifiedUserSettingsPayload'
        );
      } catch (err) {
        sandbox.logger.error(
          'Component=useManageUserOvertimeNotifications Event=Unexpected error during mutation',
          { error: err },
        );
        return false;
      }
    },
    [mutate, sandbox, interaction],
  );

  return {
    saveUserOvertimeNotifications,
    loading,
  };
};
