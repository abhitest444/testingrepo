import { useState, useCallback, useRef, useEffect } from 'react';
import {
  useWhoIsWorking,
  WHO_IS_WORKING_PAGE_SIZE,
  WhoIsWorkingFilter,
  WhoIsWorkingOrderBy,
  WhoIsWorkingWorker,
  WhoIsWorkingSummary,
} from 'src/js/service/hooks/whosWorking/useWhoIsWorking';

/** Worker node type from WhoIsWorking query result */
export type WhoIsWorkingWorkerNode = WhoIsWorkingWorker;

export interface UseWhoIsWorkingLoadMoreOptions {
  pageSize?: number;
  filter?: WhoIsWorkingFilter;
  orderBy?: WhoIsWorkingOrderBy[];
}

export interface UseWhoIsWorkingLoadMoreResult {
  workers: WhoIsWorkingWorkerNode[];
  loading: boolean;
  /** True when loading the first page (initial load, filter change, refetch) */
  isInitialLoading: boolean;
  error: string | null;
  summary: WhoIsWorkingSummary | null;
  loadWhoIsWorking: (
    filter: WhoIsWorkingFilter,
    orderBy?: WhoIsWorkingOrderBy[],
  ) => void;
  loadMore: () => void;
  hasMore: boolean;
  refetch: (
    filter: WhoIsWorkingFilter,
    orderBy?: WhoIsWorkingOrderBy[],
  ) => void;
}

/**
 * Wrapper around useWhoIsWorking that adds infinite scroll/load more pagination support.
 * Accumulates workers across pages and handles cursor-based pagination.
 *
 * Features:
 * - Page size of 20 (configurable)
 * - Accumulates workers across pages
 * - Deduplicates by worker ID
 * - Resets pagination on filter/search changes
 *
 * QUANTA-6283: Who's Working API Integration
 */
export const useWhoIsWorkingLoadMore = (
  options?: UseWhoIsWorkingLoadMoreOptions,
): UseWhoIsWorkingLoadMoreResult => {
  const {
    pageSize = WHO_IS_WORKING_PAGE_SIZE,
    filter: initialFilter,
    orderBy: initialOrderBy,
  } = options || {};

  const [allWorkers, setAllWorkers] = useState<WhoIsWorkingWorkerNode[]>([]);
  const [cachedSummary, setCachedSummary] =
    useState<WhoIsWorkingSummary | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const isInitialLoadRef = useRef(true);
  const currentFilterRef = useRef<WhoIsWorkingFilter | undefined>(
    initialFilter,
  );
  const currentOrderByRef = useRef<WhoIsWorkingOrderBy[] | undefined>(
    initialOrderBy,
  );

  const {
    loading,
    workers,
    pageInfo,
    summary,
    error,
    loadWhoIsWorking: loadWhoIsWorkingBase,
  } = useWhoIsWorking();

  /**
   * Load workers with a new filter - resets pagination
   * Sets isInitialLoading to show loader during first page fetch
   */
  const loadWhoIsWorking = useCallback(
    (filter: WhoIsWorkingFilter, orderBy?: WhoIsWorkingOrderBy[]) => {
      currentFilterRef.current = filter;
      currentOrderByRef.current = orderBy;
      isInitialLoadRef.current = true;
      setIsInitialLoading(true);
      setEndCursor(null);
      setHasMore(false);

      loadWhoIsWorkingBase({
        first: pageSize,
        after: undefined,
        filter,
        orderBy,
      });
    },
    [loadWhoIsWorkingBase, pageSize],
  );

  /**
   * Load more workers - appends to existing list
   */
  const loadMore = useCallback(() => {
    if (!hasMore || !endCursor || loading) {
      return;
    }

    if (!currentFilterRef.current) {
      return;
    }

    isInitialLoadRef.current = false;

    loadWhoIsWorkingBase({
      first: pageSize,
      after: endCursor,
      filter: currentFilterRef.current,
      orderBy: currentOrderByRef.current,
    });
  }, [hasMore, endCursor, loading, loadWhoIsWorkingBase, pageSize]);

  /**
   * Refetch workers - resets to first page
   */
  const refetch = useCallback(
    (filter: WhoIsWorkingFilter, orderBy?: WhoIsWorkingOrderBy[]) => {
      loadWhoIsWorking(filter, orderBy);
    },
    [loadWhoIsWorking],
  );

  // Handle data accumulation for load more
  useEffect(() => {
    // Skip if loading - this prevents clearing data while fetching
    // This is why workers stay on screen during loading: allWorkers state is preserved
    if (loading) {
      return;
    }

    // Update cached summary when we have new data
    // This prevents summary from going null during loading
    if (summary) {
      setCachedSummary(summary);
    }

    if (isInitialLoadRef.current) {
      // Initial load or refetch - replace all items (even if empty for no results)
      setAllWorkers(workers);
      isInitialLoadRef.current = false;
      setIsInitialLoading(false);
    } else if (workers.length > 0) {
      // Subsequent loads (load more) - append items with deduplication
      setAllWorkers((prev) => {
        const existingIds = new Set(
          prev.map((worker) => worker.timeForContactDAS?.id),
        );
        const uniqueNewWorkers = workers.filter(
          (worker) => !existingIds.has(worker.timeForContactDAS?.id),
        );
        return [...prev, ...uniqueNewWorkers];
      });
    }

    setHasMore(pageInfo?.hasNextPage || false);
    setEndCursor(pageInfo?.endCursor || null);
  }, [workers, pageInfo, summary, loading]);

  return {
    workers: allWorkers,
    loading,
    isInitialLoading,
    error,
    summary: cachedSummary,
    loadWhoIsWorking,
    loadMore,
    hasMore,
    refetch,
  };
};

// Re-export types for convenience
export type { WhoIsWorkingFilter, WhoIsWorkingOrderBy, WhoIsWorkingSummary };
