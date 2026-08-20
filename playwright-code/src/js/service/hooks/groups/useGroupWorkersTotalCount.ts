import { useCallback } from 'react';
import {
  useGetGroupWorkersTotalCountLazyQuery,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';

export interface UseGroupWorkersTotalCountOptions {
  groupId: string;
  searchText?: string;
  types?: TimeTracking_TimeForType[];
}

export interface UseGroupWorkersTotalCountResult {
  totalCount: number;
  loading: boolean;
  error: string | null;
  executeQuery: () => void;
}

/**
 * Custom hook to fetch only totalCount of workers in a given group
 * Optimized for header display - doesn't fetch worker data
 * Used in GroupDetailView header to show member count
 */
export const useGroupWorkersTotalCount = (
  options: UseGroupWorkersTotalCountOptions,
): UseGroupWorkersTotalCountResult => {
  const [executeQuery, { data, loading, error }] =
    useGetGroupWorkersTotalCountLazyQuery({
      fetchPolicy: 'cache-and-network',
    });

  const executeQueryWithFilter = useCallback(() => {
    executeQuery({
      variables: {
        groupId: options.groupId,
        searchText: options.searchText,
        types: options.types,
      },
    });
  }, [executeQuery, options.groupId, options.searchText, options.types]);

  return {
    totalCount: data?.members?.totalCount ?? 0,
    loading,
    error: error?.message || null,
    executeQuery: executeQueryWithFilter,
  };
};
