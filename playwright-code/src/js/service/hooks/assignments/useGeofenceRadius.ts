import { useCallback, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  setInteractionDegraded,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { useGetGeofenceRadiusLazyQuery } from 'src/__generated__/timeTracking/graphql';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';

export interface GeofenceRadiusResult {
  placeId: string;
  geofenceRadiusInMeter: number;
}

export interface UseGeofenceRadiusArgs {
  input: {
    placeId: string;
  };
}

export interface UseGeofenceRadiusResult {
  loading: boolean;
  data: GeofenceRadiusResult | null;
  error: string | null;
  loadGeofenceRadius: (args: UseGeofenceRadiusArgs) => void;
}

export const useGeofenceRadius = (): UseGeofenceRadiusResult => {
  const sandbox = useSandbox();

  const assignmentClient = useMemo(
    () => getAssignmentApolloClient(sandbox),
    [sandbox],
  );

  const [loadQuery, { data, loading, error }] = useGetGeofenceRadiusLazyQuery({
    client: assignmentClient ?? undefined,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    onCompleted: () => {
      sandbox.logger.info(
        'Component=useGeofenceRadius Event=Successfully fetched geofence radius',
      );
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.GEOFENCE_RADIUS_READ,
      );
    },
    onError: (err) => {
      const errorCode = err?.message ?? 'Unknown degraded error';

      sandbox.logger.error(
        'Component=useGeofenceRadius Event=Error fetching geofence radius (degraded: user can still set radius manually)',
        { error: err.message, errorCode },
      );

      setInteractionDegraded(
        sandbox,
        TimeCustomerInteraction.GEOFENCE_RADIUS_READ,
        errorCode,
      );
    },
  });

  const loadGeofenceRadius = useCallback(
    ({ input }: UseGeofenceRadiusArgs): void => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.GEOFENCE_RADIUS_READ,
      );

      loadQuery({
        variables: { input },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.GEOFENCE_RADIUS_READ,
          ),
        },
      });
    },
    [sandbox, loadQuery],
  );

  const transformedData = useMemo(() => {
    if (!data?.timeTrackingGeofenceRadius) {
      return null;
    }

    return {
      placeId: data.timeTrackingGeofenceRadius.placeId,
      geofenceRadiusInMeter:
        data.timeTrackingGeofenceRadius.geofenceRadiusInMeter,
    };
  }, [data]);

  return {
    loading,
    data: transformedData,
    error: error?.message || null,
    loadGeofenceRadius,
  };
};
