import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  TimeTrackingManageUserSettingsMutation,
  TimeTracking_ManageUserSettingsPayload,
  useTimeTrackingManageUserSettingsMutation,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import {
  endInteractionWithFailure,
  endInteractionWithSuccess,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  isExpectedError,
  mapTimeTrackingMutationError,
} from 'src/js/service/errors/timeTrackingErrors';

export interface UseManageUserSettingsArgs {
  onSuccess: (data: TimeTracking_ManageUserSettingsPayload) => void;
  onError: (error: string) => void;
  // Interaction to trace the result to or undefined to not track an interaction
  interaction?: TimeCustomerInteraction;
}

export const useManageUserSettings = ({
  onSuccess,
  onError,
  interaction,
}: UseManageUserSettingsArgs) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = (payload: TimeTracking_ManageUserSettingsPayload) => {
    sandbox.logger.info(
      'Component=useManageUserSettings Event=Successfully saved user settings',
    );
    if (interaction) {
      endInteractionWithSuccess(sandbox, interaction);
    }
    onSuccess(payload);
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(error);
  };

  const handleError = (
    errorCode: string | ApolloError | undefined,
    message = '',
    details = '',
    subCode = '',
  ) => {
    sandbox.logger.error(
      `Component=useManageUserSettings Event=Error saving user settings: ${errorCode}`,
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
      // if subCode is not present it might not be a general error where customer has to take any action
      if (
        (error === 'GENERAL_V3_ERROR' || error === 'GENERAL_V1_ERROR') &&
        subCode.trim()?.length > 0
      ) {
        return `${message} ${details}`;
      }
      return mapTimeTrackingMutationError(intl, error);
    };

    const mappedError = mapError({
      sourceComponent: 'useManageUserSettings',
      sandbox,
      intl,
      error: errorCode,
      customErrorHandler,
    });

    if (mappedError) {
      onError(mappedError);
    }
  };

  const handleCompleted = (result: TimeTrackingManageUserSettingsMutation) => {
    if (!result.timeTrackingManageUserSettings) {
      handleError('Null Response');
      return;
    }
    if (
      result.timeTrackingManageUserSettings.__typename ===
      'TimeTracking_ManageUserSettingsError'
    ) {
      handleError(
        result.timeTrackingManageUserSettings.errorCode,
        result.timeTrackingManageUserSettings.message,
        result.timeTrackingManageUserSettings.details,
        result.timeTrackingManageUserSettings.subCode,
      );
    } else if (
      result.timeTrackingManageUserSettings.__typename ===
      'TimeTracking_ManageUserSettingsPayload'
    ) {
      handleSuccess(
        result.timeTrackingManageUserSettings as TimeTracking_ManageUserSettingsPayload,
      );
    } else {
      handleError('Unexpected response type');
    }
  };

  return useTimeTrackingManageUserSettingsMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });
};
