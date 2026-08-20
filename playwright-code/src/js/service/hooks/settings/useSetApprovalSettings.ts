import { useIntl, useSandbox } from '@payroll/quicksand';
import { useCallback } from 'react';
import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';
import {
  useTimeTrackingUpdateApprovalSettingsMutation,
  TimeTracking_UpdateApprovalSettingsInput,
  TimeTracking_UpdateApprovalSettingsPayload,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { mapError } from 'src/js/service/utils/mapError';
import { mapTimeTrackingMutationError } from 'src/js/service/errors/timeTrackingErrors';

interface UseSetApprovalSettingsOptions {
  onSuccess?: (result: TimeTracking_UpdateApprovalSettingsPayload) => void;
  onError?: (error: string) => void;
}

export const useSetApprovalSettings = ({
  onSuccess,
  onError,
}: UseSetApprovalSettingsOptions = {}) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const [updateApprovalSettingsMutation, { loading }] =
    useTimeTrackingUpdateApprovalSettingsMutation({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
      },
    });

  const handleMappedError = useCallback(
    (error: string | ApolloError | GraphQLError | undefined) => {
      const mappedError = mapError({
        sourceComponent: 'updateApprovalSettings',
        sandbox,
        intl,
        error,
        customErrorHandler: (error) =>
          mapTimeTrackingMutationError(intl, error),
      });

      if (mappedError) {
        onError?.(mappedError);
      }
    },
    [sandbox, intl, onError],
  );

  const updateApprovalSettings = useCallback(
    async (input: TimeTracking_UpdateApprovalSettingsInput) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.UPDATE_APPROVAL_SETTINGS,
      );

      try {
        const response = await updateApprovalSettingsMutation({
          variables: { input },
          context: {
            clientName: ApolloClientNames.TIME_TRACKING,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.UPDATE_APPROVAL_SETTINGS,
            ),
          },
        });

        if (response.errors) {
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.UPDATE_APPROVAL_SETTINGS,
            response.errors[0]?.message || 'Unknown error',
            response.errors[0],
          );
          handleMappedError(response.errors[0]);
          return;
        }

        const result = response.data?.timeTrackingUpdateApprovalSettings;

        if (result?.__typename === 'TimeTracking_UpdateApprovalSettingsError') {
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.UPDATE_APPROVAL_SETTINGS,
            result.message || 'Update failed',
            result,
          );
          handleMappedError(result.errorCode || result.message);
          return;
        }

        if (
          result?.__typename === 'TimeTracking_UpdateApprovalSettingsPayload'
        ) {
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.UPDATE_APPROVAL_SETTINGS,
          );
          onSuccess?.(result);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.UPDATE_APPROVAL_SETTINGS,
          errorMessage,
          error,
        );
        handleMappedError(error as ApolloError);
      }
    },
    [sandbox, updateApprovalSettingsMutation, onSuccess, handleMappedError],
  );

  return [updateApprovalSettings, { loading }] as const;
};
