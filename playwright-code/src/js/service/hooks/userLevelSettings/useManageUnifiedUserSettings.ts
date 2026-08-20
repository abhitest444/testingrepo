import { useCallback } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  TimeTracking_ManageUnifiedUserSettingsPayload,
  TimeTracking_TimeForInput,
  TimeTracking_UserLocationTrackingType,
  TimeTrackingManageUnifiedUserSettingsMutation,
  useTimeTrackingManageUnifiedUserSettingsMutation,
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

/**
 * Input for location tracking update
 */
export interface LocationTrackingInput {
  value: TimeTracking_UserLocationTrackingType;
  version?: string;
}

/**
 * Hook arguments
 */
export interface UseManageUnifiedUserSettingsArgs {
  onSuccess: (data: TimeTracking_ManageUnifiedUserSettingsPayload) => void;
  onError: (error: string) => void;
  interaction?: TimeCustomerInteraction;
}

/**
 * Hook return type
 */
export interface UseManageUnifiedUserSettingsResult {
  saveLocationSettings: (
    settingsFor: TimeTracking_TimeForInput,
    locationTracking: LocationTrackingInput,
  ) => Promise<void>;
  loading: boolean;
}

/**
 * Hook for managing unified user settings (location tracking)
 *
 * This hook follows the same pattern as useManageUserSettings.
 * It handles the mutation for saving user location tracking preferences.
 *
 * @example
 * ```typescript
 * const { saveLocationSettings, loading } = useManageUnifiedUserSettings({
 *   onSuccess: (data) => dispatch(saveLocationSettings(data)),
 *   onError: (error) => setError(error),
 *   interaction: TimeCustomerInteraction.USER_LOCATION_SETTINGS_SAVE,
 * });
 *
 * await saveLocationSettings(
 *   { id: '10', timeForType: 'EMPLOYEE' },
 *   { value: 'OPTIONAL', version: '1121' }
 * );
 * ```
 */
export const useManageUnifiedUserSettings = ({
  onSuccess,
  onError,
  interaction,
}: UseManageUnifiedUserSettingsArgs): UseManageUnifiedUserSettingsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = useCallback(
    (payload: TimeTracking_ManageUnifiedUserSettingsPayload) => {
      sandbox.logger.info(
        'Component=useManageUnifiedUserSettings Event=Successfully saved unified user settings',
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
    ) => {
      sandbox.logger.error(
        `Component=useManageUnifiedUserSettings Event=Error saving unified user settings: ${errorCode}`,
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

      const mappedError = mapError({
        sourceComponent: 'useManageUnifiedUserSettings',
        sandbox,
        intl,
        error: errorCode,
        customErrorHandler: (error: string) =>
          mapTimeTrackingMutationError(intl, error),
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
        handleError(response.errorCode, response.message, response.details);
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

  const [mutate, { loading }] =
    useTimeTrackingManageUnifiedUserSettingsMutation({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
      },
      onCompleted: handleCompleted,
      onError: handleApolloError,
    });

  const saveLocationSettings = useCallback(
    async (
      settingsFor: TimeTracking_TimeForInput,
      locationTracking: LocationTrackingInput,
    ): Promise<void> => {
      // Create customer interaction for tracking
      if (interaction) {
        createCustomerInteraction(sandbox, interaction);
      }

      try {
        await mutate({
          variables: {
            input: {
              settingsFor,
              locationTracking,
            },
          },
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
        // Apollo errors are handled by onError callback
        sandbox.logger.error(
          'Component=useManageUnifiedUserSettings Event=Unexpected error during mutation',
          { error },
        );
      }
    },
    [mutate, sandbox, interaction],
  );

  return {
    saveLocationSettings,
    loading,
  };
};
