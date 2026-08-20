import { useCallback, useEffect, useRef, useState } from 'react';
import { useStandardFieldOptionAssignments } from 'src/js/service/hooks/assignments/useStandardFieldOptionAssignments';

export interface UseLocationItemsArgs {
  timeForEntityId?: string;
  customerId?: string;
  projectId?: string;
  searchText?: string;
  assignmentFilters?: {
    assigned?: boolean | null;
  };
}

export interface LocationItem {
  id: string;
  name: string;
  assigned: boolean;
  active: boolean;
  fullName?: string;
  parentId?: string | null;
  level?: number | null;
  numberOfChildren?: number;
}

export interface UseLocationItemsResult {
  locationItems: LocationItem[];
  loading: boolean;
  error: string | null;
  loadLocationItems: (args?: UseLocationItemsArgs) => void;
  refetch: (args?: UseLocationItemsArgs) => void;
  refetchWithSearch: (searchText: string | null) => void;
  loadMore: () => void;
  hasMore: boolean;
}

export interface UseLocationItemsOptions {
  pageSize?: number;
  enableLoadMore?: boolean;
  /** When provided, use these options and skip SFO fetch (parent owns the data). */
  preloadedOptions?: LocationItem[] | null;
  /** When using preloadedOptions, parent can provide pagination for infinite scroll */
  hasMoreFromParent?: boolean;
  loadMoreFromParent?: () => void;
  /** When preloadedOptions not provided: context for internal SFO fetch */
  timeForEntityId?: string;
  customerId?: string;
  projectId?: string;
  assignmentFilters?: {
    assigned?: boolean | null;
  };
}

const PAGE_SIZE = 100;

/**
 * Map SFO API result (StandardFieldOptionAssignment) to LocationItem shape.
 */
function mapToLocationItems(data: any[]): LocationItem[] {
  if (!data?.length) return [];
  return data.map((node: any) => {
    const { standardFieldLabel, ...rest } = node;
    return rest as LocationItem;
  });
}

/**
 * Hook for QuickFind location dropdown.
 * - When preloadedOptions is provided: uses that data and optional parent pagination.
 * - When preloadedOptions is not provided: fetches via SFO assignment API (timeForEntityId, customerId, projectId, assignmentFilters).
 */
export const useLocationItems = (
  options: UseLocationItemsOptions = {},
): UseLocationItemsResult => {
  const {
    preloadedOptions,
    hasMoreFromParent = false,
    loadMoreFromParent,
    timeForEntityId,
    customerId,
    projectId,
    assignmentFilters,
    pageSize = PAGE_SIZE,
    enableLoadMore = true,
  } = options;

  const [allItems, setAllItems] = useState<LocationItem[]>([]);
  const lastLoadArgsRef = useRef<{
    input: any;
    filter: { assigned: boolean | null; active: boolean };
    first: number;
  } | null>(null);
  // Counter of load-more dispatches whose responses we still expect to append.
  // Tracked as a counter (not a boolean) so multiple in-flight load-mores or
  // intermediate Apollo emissions (cache + network) do not cause the next
  // response to be treated as a fresh "replace".
  const pendingLoadMoreRef = useRef(0);
  const lastSignatureRef = useRef<string | null>(null);
  const lastRequestSignatureRef = useRef<string | null>(null);

  const {
    loading: sfoLoading,
    data: sfoData,
    error: sfoError,
    loadStandardFieldOptionAssignments: loadSfo,
    pageInfo,
  } = useStandardFieldOptionAssignments();

  // Field enabled → assigned null (show all options); field disabled → assigned true (only assigned options)
  const assignedFilter =
    assignmentFilters?.assigned !== undefined
      ? assignmentFilters.assigned
      : true;

  const loadLocationItems = useCallback(
    (args?: UseLocationItemsArgs) => {
      const workerId = args?.timeForEntityId ?? timeForEntityId;
      const custId = args?.customerId ?? customerId;
      const projId = args?.projectId ?? projectId;
      const assigned =
        args?.assignmentFilters?.assigned !== undefined
          ? args.assignmentFilters.assigned
          : assignedFilter;

      if (!workerId) {
        setAllItems([]);
        return;
      }

      const input = {
        standardFieldLabel: 'LOCATION' as const,
        timeForEntityId: workerId,
        customerId: custId || undefined,
        projectId: projId || undefined,
      };
      const filter = { assigned, active: true };
      const loadArgs = { input, filter, first: pageSize };
      lastLoadArgsRef.current = loadArgs;
      // Fresh full load — drop pending load-more bookkeeping.
      pendingLoadMoreRef.current = 0;
      const requestSignature = `${workerId}:${custId ?? ''}:${
        projId ?? ''
      }:${String(assigned)}`;
      lastRequestSignatureRef.current = requestSignature;
      loadSfo(loadArgs);
    },
    [timeForEntityId, customerId, projectId, assignedFilter, pageSize, loadSfo],
  );

  const refetchWithSearch = useCallback(
    (searchText: string | null) => {
      const args = lastLoadArgsRef.current;
      if (!args) return;
      const nextArgs = {
        ...args,
        filter: { ...args.filter, searchText: searchText?.trim() || null },
      };
      lastLoadArgsRef.current = nextArgs;
      // Search is a fresh result set, not a continuation.
      pendingLoadMoreRef.current = 0;
      loadSfo(nextArgs);
    },
    [loadSfo],
  );

  const loadMore = useCallback(() => {
    const args = lastLoadArgsRef.current;
    const endCursor = pageInfo?.endCursor;
    if (!args || !endCursor || !pageInfo?.hasNextPage) return;
    pendingLoadMoreRef.current += 1;
    loadSfo({ ...args, after: endCursor });
  }, [loadSfo, pageInfo?.endCursor, pageInfo?.hasNextPage]);

  useEffect(() => {
    if (preloadedOptions !== undefined) return;
    if (!timeForEntityId) return;

    const signature = `${timeForEntityId}:${customerId ?? ''}:${
      projectId ?? ''
    }:${String(assignedFilter)}`;
    if (signature === lastSignatureRef.current) return;
    lastSignatureRef.current = signature;
    lastRequestSignatureRef.current = signature;
    setAllItems([]);

    loadLocationItems({
      timeForEntityId,
      customerId,
      projectId,
      assignmentFilters,
    });
  }, [
    preloadedOptions,
    timeForEntityId,
    customerId,
    projectId,
    assignedFilter,
    loadLocationItems,
    assignmentFilters,
  ]);

  useEffect(() => {
    if (preloadedOptions !== undefined) return;
    if (sfoData == null) return;
    // Apollo `cache-and-network` can emit an interim empty `data` between a
    // request being dispatched and the network response arriving. Ignore it —
    // otherwise a load-more would decrement its counter on this empty
    // emission and the real (non-empty) page-N response would then be
    // mistaken for a "replace" and wipe the accumulated list.
    if (sfoLoading) return;
    if (sfoData.length === 0 && pendingLoadMoreRef.current > 0) return;

    if (pendingLoadMoreRef.current > 0) {
      pendingLoadMoreRef.current -= 1;
      setAllItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const mapped = mapToLocationItems(sfoData);
        const newItems = mapped.filter((i) => !existingIds.has(i.id));
        return [...prev, ...newItems];
      });
    } else {
      // Initial load / refetch / search — replace the list.
      setAllItems(mapToLocationItems(sfoData));
    }
  }, [
    preloadedOptions,
    sfoData,
    sfoLoading,
    timeForEntityId,
    customerId,
    projectId,
    assignedFilter,
  ]);

  const refetch = useCallback(
    (args?: UseLocationItemsArgs) => {
      if (preloadedOptions !== undefined) return;
      loadLocationItems(args);
    },
    [preloadedOptions, loadLocationItems],
  );

  const noOp = useCallback(() => {}, []);
  const noOpSearch = useCallback((_searchText: string | null) => {}, []);

  const usePreloaded = preloadedOptions !== undefined;

  if (usePreloaded) {
    const locationItems = preloadedOptions ?? [];
    const useParentPagination =
      preloadedOptions !== undefined && loadMoreFromParent != null;
    return {
      locationItems,
      loading: false,
      error: null,
      loadLocationItems: noOp,
      refetch: noOp,
      refetchWithSearch: noOpSearch,
      loadMore: useParentPagination ? loadMoreFromParent : noOp,
      hasMore: useParentPagination ? hasMoreFromParent ?? false : false,
    };
  }

  return {
    locationItems: allItems,
    loading: sfoLoading,
    error: sfoError,
    loadLocationItems,
    refetch,
    refetchWithSearch,
    loadMore: enableLoadMore ? loadMore : noOp,
    hasMore: enableLoadMore ? pageInfo?.hasNextPage ?? false : false,
  };
};
