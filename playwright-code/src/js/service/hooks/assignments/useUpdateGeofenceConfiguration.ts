import { useCallback, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  useUpdateGeofenceConfigurationMutation,
  UpdateGeofenceConfigurationMutation,
} from 'src/__generated__/timeTracking/graphql';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';

export interface UseUpdateGeofenceConfigurationArgs {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook to update geofence configuration for a customer or project.
 *
 * Wraps the generated `useUpdateGeofenceConfigurationMutation` with:
 * - CustomerInteraction lifecycle tracking
 * - Structured logging
 *
 * Callers may optionally pass `onSuccess`/`onError` callbacks, or handle
 * results directly via the returned mutation Promise.
 *
 * @example
 * const [updateGeofenceConfiguration] = useUpdateGeofenceConfiguration({
 *   onSuccess: () => refetch(),
 *   onError: (msg) => showError(msg),
 * });
 *
 * updateGeofenceConfiguration({
 *   variables: {
 *     input: {
 *       timeAgainst: { customerId: 'cust-123' },
 *       geofenceEnabled: { value: false, version: '...' },
 *     },
 *   },
 * });
 */
export const useUpdateGeofenceConfiguration = ({
  onSuccess,
  onError,
}: UseUpdateGeofenceConfigurationArgs = {}) => {
  const sandbox = useSandbox();

  const assignmentClient = useMemo(
    () => getAssignmentApolloClient(sandbox),
    [sandbox],
  );

  const handleError = useCallback(
    (errorMessage: string, error?: unknown) => {
      sandbox.logger.error(
        `Component=useUpdateGeofenceConfiguration Event=Error updating geofence configuration: ${errorMessage}`,
        { error },
      );
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.GEOFENCE_CONFIGURATION_UPDATE,
        errorMessage,
      );
      onError?.(errorMessage);
    },
    [sandbox, onError],
  );

  const handleSuccess = useCallback(() => {
    sandbox.logger.info(
      'Component=useUpdateGeofenceConfiguration Event=Successfully updated geofence configuration',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.GEOFENCE_CONFIGURATION_UPDATE,
    );
    onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSuccess]);

  const handleCompleted = useCallback(
    (result: UpdateGeofenceConfigurationMutation) => {
      const response = result.timeTrackingUpdateGeofenceConfiguration;

      if (!response) {
        handleError('Failed to update geofence configuration');
        return;
      }

      // The Apollo client uses addTypename: false, so __typename is not available.
      // Discriminate the union by checking for 'errorCode' which only exists on
      // the error type.
      if ('errorCode' in response) {
        sandbox.logger.error(
          'Component=useUpdateGeofenceConfiguration Event=Full error response',
          { errorResponse: JSON.stringify(response) },
        );
        handleError(
          response.message ?? 'Failed to update geofence configuration',
        );
        return;
      }

      handleSuccess();
    },
    [sandbox, handleError, handleSuccess],
  );

  const handleApolloError = useCallback(
    (error: ApolloError) => {
      handleError(
        error.message || 'Failed to update geofence configuration',
        error,
      );
    },
    [handleError],
  );

  const [mutationFunction, mutationResult] =
    useUpdateGeofenceConfigurationMutation({
      client: assignmentClient ?? undefined,
      onCompleted: handleCompleted,
      onError: handleApolloError,
    });

  const wrappedMutationFunction: typeof mutationFunction = useCallback(
    (options?: Parameters<typeof mutationFunction>[0]) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.GEOFENCE_CONFIGURATION_UPDATE,
      );

      if (options) {
        return mutationFunction({
          ...options,
          context: {
            ...options.context,
            headers: {
              ...options.context?.headers,
              ...getCustomerInteractionPropagationHeaders(
                sandbox,
                TimeCustomerInteraction.GEOFENCE_CONFIGURATION_UPDATE,
              ),
            },
          },
        });
      }

      return mutationFunction();
    },
    [mutationFunction, sandbox],
  );

  return [wrappedMutationFunction, mutationResult] as [
    typeof mutationFunction,
    typeof mutationResult,
  ];
};
