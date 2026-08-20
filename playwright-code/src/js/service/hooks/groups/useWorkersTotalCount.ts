import { useCallback } from 'react';
import {
  useGetWorkersTotalCountLazyQuery,
  TimeTracking_WorkersQueryFilter,
} from 'src/__generated__/timeTracking/graphql';

export interface UseWorkersTotalCountOptions {
  filter?: TimeTracking_WorkersQueryFilter;
}

export interface UseWorkersTotalCountResult {
  totalCount: number;
  loading: boolean;
  error: string | null;
  executeQuery: () => void;
}

/**
 * Custom hook to fetch only totalCount of workers matching filter criteria
 * Optimized for header display - doesn't fetch worker data
 * Used in WorkersListView header
 */
export const useWorkersTotalCount = (
  options: UseWorkersTotalCountOptions = {},
): UseWorkersTotalCountResult => {
  const [executeQuery, { data, loading, error }] =
    useGetWorkersTotalCountLazyQuery({
      fetchPolicy: 'cache-and-network',
    });

  const executeQueryWithFilter = useCallback(() => {
    executeQuery({
      variables: {
        filter: options.filter,
      },
    });
  }, [executeQuery, options.filter]);

  return {
    totalCount: data?.timeTrackingWorkers?.totalCount ?? 0,
    loading,
    error: error?.message || null,
    executeQuery: executeQueryWithFilter,
  };
};
