import { useIntl, useSandbox } from '@payroll/quicksand';
import {
  TimeTracking_ManageCustomFieldsInput,
  useTimeTrackingManageCustomFieldsMutation,
} from 'src/__generated__/timeTracking/graphql';
import { mapError } from 'src/js/service/utils/mapError';
import {
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';

export interface UseManageCustomFieldsArgs {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface UseManageCustomFieldsResult {
  manageCustomFields: (
    input: TimeTracking_ManageCustomFieldsInput,
    interactionName?: string,
  ) => Promise<void>;
  loading: boolean;
  error?: string;
}

export const useManageCustomFields = ({
  onSuccess,
  onError,
}: UseManageCustomFieldsArgs = {}): UseManageCustomFieldsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const [manageCustomFieldsMutation, { loading, error }] =
    useTimeTrackingManageCustomFieldsMutation({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
      },
    });

  const manageCustomFields = async (
    input: TimeTracking_ManageCustomFieldsInput,
    interactionName?: string,
  ) => {
    try {
      const result = await manageCustomFieldsMutation({
        variables: {
          input,
        },
        ...(interactionName && {
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              interactionName,
            ),
          },
        }),
      });

      if (
        result.data?.timeTrackingManageCustomFields?.__typename ===
        'TimeTracking_ManageCustomFieldsPayload'
      ) {
        if (interactionName) {
          endInteractionWithSuccess(sandbox, interactionName);
        }
        onSuccess?.();
      } else if (
        result.data?.timeTrackingManageCustomFields?.__typename ===
        'TimeTracking_ManageCustomFieldsError'
      ) {
        const errorMessage =
          result.data.timeTrackingManageCustomFields.message ||
          'Failed to mark custom field as required';
        if (interactionName) {
          endInteractionWithFailure(sandbox, interactionName, errorMessage);
        }
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        'An unexpected error occurred while modifying custom fields';
      if (interactionName) {
        endInteractionWithFailure(sandbox, interactionName, errorMessage);
      }
      onError?.(errorMessage);
    }
  };

  const mappedError = mapError({
    sourceComponent: 'useManageCustomFields',
    sandbox,
    intl,
    error,
  });

  return {
    manageCustomFields,
    loading,
    error: mappedError,
  };
};
