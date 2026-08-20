import { useCallback } from 'react';
import {
  useGetActiveGroupsTotalCountLazyQuery,
  TimeTracking_GroupFilter,
} from 'src/__generated__/timeTracking/graphql';

export interface UseActiveGroupsTotalCountOptions {
  filter?: TimeTracking_GroupFilter;
}

export interface UseActiveGroupsTotalCountResult {
  totalActiveGroupCount: number;
  loading: boolean;
  error: string | null;
  executeQuery: () => void;
}

/**
 * Custom hook to fetch only totalActiveGroupCount
 * Optimized for header display - doesn't fetch group data
 * Used in GroupDetailView header
 */
export const useActiveGroupsTotalCount = (
  options: UseActiveGroupsTotalCountOptions = {},
): UseActiveGroupsTotalCountResult => {
  const [executeQuery, { data, loading, error }] =
    useGetActiveGroupsTotalCountLazyQuery({
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
    totalActiveGroupCount: data?.timeTrackingGroups?.totalActiveGroupCount ?? 0,
    loading,
    error: error?.message || null,
    executeQuery: executeQueryWithFilter,
  };
};
