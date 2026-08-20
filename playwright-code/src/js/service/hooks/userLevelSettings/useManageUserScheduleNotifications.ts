import { useCallback } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError, useMutation } from '@apollo/client';
import { ManageUserScheduleNotificationsDocument } from 'src/js/service/queries/userSettingsQueries';
import {
  TimeTracking_ManageUnifiedUserSettingsError,
  TimeTracking_ManageUnifiedUserSettingsInput,
  TimeTracking_ManageUnifiedUserSettingsPayload,
  ManageUserScheduleNotificationsMutation,
  ManageUserScheduleNotificationsMutationVariables,
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
import { USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING } from 'src/js/widgets/userSettings/constants/loggingConstants';

export interface UseManageUserScheduleNotificationsArgs {
  onSuccess: (data: TimeTracking_ManageUnifiedUserSettingsPayload) => void;
  onError: (error: string) => void;
  interaction?: TimeCustomerInteraction;
}

export interface UseManageUserScheduleNotificationsResult {
  saveUserScheduleNotifications: (
    input: TimeTracking_ManageUnifiedUserSettingsInput,
  ) => Promise<boolean>;
  loading: boolean;
}

export const useManageUserScheduleNotifications = ({
  onSuccess,
  onError,
  interaction,
}: UseManageUserScheduleNotificationsArgs): UseManageUserScheduleNotificationsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = useCallback(
    (payload: TimeTracking_ManageUnifiedUserSettingsPayload) => {
      sandbox.logger.info(
        `Component=useManageUserScheduleNotifications Event=${USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING.SAVE_SUCCESS} section=SCHEDULE_NOTIFICATIONS`,
      );
      if (interaction) {
        endInteractionWithSuccess(sandbox, interaction);
      }
      onSuccess(payload);
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
        `Component=useManageUserScheduleNotifications Event=${USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING.SAVE_FAILED} section=SCHEDULE_NOTIFICATIONS`,
        {
          errorCode:
            errorCode instanceof ApolloError ? errorCode.message : errorCode,
          message,
          details,
        },
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
        sourceComponent: 'useManageUserScheduleNotifications',
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
    (result: ManageUserScheduleNotificationsMutation) => {
      if (!result.timeTrackingManageUnifiedUserSettings) {
        handleError('Null Response');
        return;
      }

      const response = result.timeTrackingManageUnifiedUserSettings;

      if (
        response.__typename === 'TimeTracking_ManageUnifiedUserSettingsError'
      ) {
        const err = response as TimeTracking_ManageUnifiedUserSettingsError;
        handleError(err.errorCode, err.message ?? '', err.details ?? '');
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
    ManageUserScheduleNotificationsMutation,
    ManageUserScheduleNotificationsMutationVariables
  >(ManageUserScheduleNotificationsDocument, {
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: (err) => handleError(err),
  });

  const saveUserScheduleNotifications = useCallback(
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
          'Component=useManageUserScheduleNotifications Event=Unexpected error during mutation',
          { error: err },
        );
        return false;
      }
    },
    [mutate, sandbox, interaction],
  );

  return {
    saveUserScheduleNotifications,
    loading,
  };
};
