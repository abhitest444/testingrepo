import { useCallback, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  setInteractionDegraded,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { PageInfo } from 'src/js/service/types/assignmentTypes';
import { useGetGeofenceConfigurationLazyQuery } from 'src/__generated__/timeTracking/graphql';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';

export interface GeofenceConfigurationNode {
  timeAgainstContactDAS?: {
    project?: { id: string };
    customer?: { id: string };
  };
  geofenceEnabled?: {
    meta?: { version?: string };
    value?: boolean;
  };
  geofenceLocation?: {
    meta?: { version?: string };
    latitude?: number;
    longitude?: number;
    geofenceRadiusInMeter: number;
  };
}

export interface UseGeofenceConfigurationArgs {
  input: {
    timeAgainstList: Array<{
      projectId?: string;
      customerId?: string;
    }>;
  };
}

export interface UseGeofenceConfigurationResult {
  loading: boolean;
  data: GeofenceConfigurationNode[];
  error: string | null;
  loadGeofenceConfiguration: (args: UseGeofenceConfigurationArgs) => void;
  pageInfo: PageInfo | null;
}

export const useGeofenceConfiguration = (): UseGeofenceConfigurationResult => {
  const sandbox = useSandbox();

  const assignmentClient = useMemo(
    () => getAssignmentApolloClient(sandbox),
    [sandbox],
  );

  const [loadQuery, { data, loading, error }] =
    useGetGeofenceConfigurationLazyQuery({
      client: assignmentClient ?? undefined,
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
      onCompleted: () => {
        sandbox.logger.info(
          'Component=useGeofenceConfiguration Event=Successfully fetched geofence configuration',
        );
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.GEOFENCE_CONFIGURATION_READ,
        );
      },
      onError: (err) => {
        const errorCode = err?.message ?? 'Unknown degraded error';

        sandbox.logger.error(
          'Component=useGeofenceConfiguration Event=Error fetching geofence configuration (degraded: user can still edit in drawer)',
          { error: err.message, errorCode },
        );

        setInteractionDegraded(
          sandbox,
          TimeCustomerInteraction.GEOFENCE_CONFIGURATION_READ,
          errorCode,
        );
      },
    });

  const loadGeofenceConfiguration = useCallback(
    ({ input }: UseGeofenceConfigurationArgs): void => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.GEOFENCE_CONFIGURATION_READ,
      );

      loadQuery({
        variables: { input },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.GEOFENCE_CONFIGURATION_READ,
          ),
        },
      });
    },
    [sandbox, loadQuery],
  );

  const transformedData = useMemo(() => {
    if (!data?.timeTrackingGeofenceConfiguration?.edges) {
      return [];
    }

    return data.timeTrackingGeofenceConfiguration.edges.map(
      (edge) => edge.node,
    );
  }, [data]);

  const pageInfo = useMemo(() => {
    if (!data?.timeTrackingGeofenceConfiguration?.pageInfo) {
      return null;
    }

    return {
      hasNextPage:
        data.timeTrackingGeofenceConfiguration.pageInfo.hasNextPage || false,
      hasPreviousPage:
        data.timeTrackingGeofenceConfiguration.pageInfo.hasPreviousPage ||
        false,
      startCursor:
        data.timeTrackingGeofenceConfiguration.pageInfo.startCursor ||
        undefined,
      endCursor:
        data.timeTrackingGeofenceConfiguration.pageInfo.endCursor || undefined,
    };
  }, [data]);

  return {
    loading,
    data: transformedData,
    error: error?.message || null,
    loadGeofenceConfiguration,
    pageInfo,
  };
};
