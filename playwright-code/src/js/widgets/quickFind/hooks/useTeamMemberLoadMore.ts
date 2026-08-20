import { useState, useCallback, useRef, useEffect } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useTimeTrackingWorkers } from 'src/js/service/hooks/groups/useTimeTrackingWorkers';
import {
  TimeTracking_WorkersQueryFilter,
  TimeTracking_WorkerOrderBy,
} from 'src/__generated__/timeTracking/graphql';

export interface UseTeamMemberLoadMoreOptions {
  pageSize?: number;
  enableLoadMore?: boolean;
  filter?: TimeTracking_WorkersQueryFilter;
  orderBy?: TimeTracking_WorkerOrderBy[];
}

export interface UseTeamMemberLoadMoreResult {
  workers: any[];
  loading: boolean;
  error: string | null;
  loadWorkers: (filter?: TimeTracking_WorkersQueryFilter) => void;
  loadMore: () => void;
  hasMore: boolean;
  refetch: (filter?: TimeTracking_WorkersQueryFilter) => void;
}

/**
 * Wrapper around useTimeTrackingWorkers that adds "Load More" pagination support
 * When enableLoadMore is true, accumulates workers across pages
 * When false, behaves like the original hook (replaces data on each load)
 */
export const useTeamMemberLoadMore = (
  options?: UseTeamMemberLoadMoreOptions,
): UseTeamMemberLoadMoreResult => {
  const {
    pageSize = 100,
    enableLoadMore = false,
    filter: initialFilter,
    orderBy = [TimeTracking_WorkerOrderBy.DisplayNameAsc],
  } = options || {};

  const sandbox = useSandbox();
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const currentFilterRef = useRef<TimeTracking_WorkersQueryFilter | undefined>(
    initialFilter,
  );

  const {
    loading,
    workers,
    pageInfo,
    error,
    loadWorkers: loadWorkersBase,
    refetch: refetchBase,
  } = useTimeTrackingWorkers();

  const loadWorkers = useCallback(
    (filter?: TimeTracking_WorkersQueryFilter) => {
      currentFilterRef.current = filter;
      isInitialLoadRef.current = true;
      setAllWorkers([]);

      loadWorkersBase({
        first: pageSize,
        after: undefined,
        filter,
        orderBy,
      });
    },
    [loadWorkersBase, pageSize, orderBy],
  );

  const loadMore = useCallback(() => {
    if (!enableLoadMore || !hasMore || !endCursor || loading) {
      return;
    }

    loadWorkersBase({
      first: pageSize,
      after: endCursor,
      filter: currentFilterRef.current,
      orderBy,
    });
  }, [
    enableLoadMore,
    hasMore,
    endCursor,
    loading,
    loadWorkersBase,
    pageSize,
    orderBy,
  ]);

  const refetch = useCallback(
    (filter?: TimeTracking_WorkersQueryFilter) => {
      loadWorkers(filter);
    },
    [loadWorkers],
  );

  // Handle data accumulation for load more
  useEffect(() => {
    if (!workers || workers.length === 0) {
      if (isInitialLoadRef.current && enableLoadMore) {
        setAllWorkers([]);
      }
      return;
    }

    if (enableLoadMore) {
      if (isInitialLoadRef.current) {
        // Initial load - replace all items
        setAllWorkers(workers);
        isInitialLoadRef.current = false;
      } else {
        // Subsequent loads - append items
        setAllWorkers((prev) => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map((item: any) => item.id));
          const uniqueNewItems = workers.filter(
            (item: any) => !existingIds.has(item.id),
          );
          return [...prev, ...uniqueNewItems];
        });
      }

      setHasMore(pageInfo?.hasNextPage || false);
      setEndCursor(pageInfo?.endCursor || null);
    } else {
      // Without load more, just use the workers from the hook
      setAllWorkers(workers);
    }
  }, [workers, pageInfo, enableLoadMore]);

  return {
    workers: allWorkers,
    loading,
    error,
    loadWorkers,
    loadMore,
    hasMore: enableLoadMore ? hasMore : false,
    refetch,
  };
};
