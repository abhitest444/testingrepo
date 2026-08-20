import { useSandbox } from '@payroll/quicksand';
import { useCallback } from 'react';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  TimeTracking_WorkersQueryFilter,
  TimeTracking_WorkerOrderBy,
  useGetUnassignedWorkersLazyQuery,
  GetUnassignedWorkersQuery,
} from 'src/__generated__/timeTracking/graphql';

export interface UseGetUnassignedWorkersArgs {
  first?: number;
  after?: string;
  filter?: TimeTracking_WorkersQueryFilter;
  orderBy?: TimeTracking_WorkerOrderBy[];
}

export interface UseGetUnassignedWorkersResult {
  loading: boolean;
  data: GetUnassignedWorkersQuery['timeTrackingWorkers'] | null;
  error: string | null;
  loadUnassignedWorkers: (args?: UseGetUnassignedWorkersArgs) => void;
}

/**
 * Custom hook to fetch workers who are not assigned to any group
 * Used for displaying "No Group" section in Workers Table
 *
 * QUANTA-5010: Workers Table View by Groups - Custom React Hooks
 */
export const useGetUnassignedWorkers = (): UseGetUnassignedWorkersResult => {
  const sandbox = useSandbox();

  const [loadQuery, { data, loading, error }] =
    useGetUnassignedWorkersLazyQuery({
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
      onCompleted: () => {
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.UNASSIGNED_WORKERS_READ,
        );
      },
      onError: (err) => {
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.UNASSIGNED_WORKERS_READ,
          err.message,
          err,
        );
      },
    });

  const loadUnassignedWorkers = useCallback(
    ({
      first = 50,
      after,
      filter = { hasGroup: false },
      orderBy = [TimeTracking_WorkerOrderBy.DisplayNameAsc],
    }: UseGetUnassignedWorkersArgs = {}) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.UNASSIGNED_WORKERS_READ,
      );
      loadQuery({
        variables: { first, after, filter, orderBy },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.UNASSIGNED_WORKERS_READ,
          ),
        },
      });
    },
    [sandbox, loadQuery],
  );

  return {
    loading,
    data: data?.timeTrackingWorkers || null,
    error: error?.message || null,
    loadUnassignedWorkers,
  };
};
