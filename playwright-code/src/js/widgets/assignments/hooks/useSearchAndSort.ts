import { useState, useCallback, useEffect, useRef } from 'react';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import { WORKERS_PAGE_SIZE } from '../utils/constants';

/**
 * Parameters for search and sort hook
 */
export interface UseSearchAndSortParams {
  // Callback to reset pagination when search/sort changes
  setCurrentPageNumber: (page: number) => void;

  // Refetch function from GraphQL hook
  refetch: (params: {
    first: number;
    filter?: { searchText: string };
    orderBy: TimeTracking_WorkerOrderBy[];
  }) => void;

  // Optional: skip API call for client-side only sort
  skipApiCall?: boolean;
}

/**
 * Result from search and sort hook
 */
export interface UseSearchAndSortResult {
  // Search state
  searchTerm: string;
  handleSearchChange: (value: string) => void;

  // Sort state
  sortOrder: TimeTracking_WorkerOrderBy;
  handleSorting: (skipApiCall?: boolean) => void;
  isSorted: boolean; // Track if user has actively clicked sort
}

/**
 * Custom hook to handle search and sort functionality.
 *
 * Manages:
 * - Search term state
 * - Sort order state (ascending/descending)
 * - Search change handler (triggers API refetch)
 * - Sort toggle handler (triggers API refetch)
 * - Auto-reset to page 1 when search/sort changes
 *
 * **Search Behavior:**
 * - Server-side filtering using API's searchText filter
 * - Searches across firstName, lastName, and displayName
 * - Debounced in component (SearchField handles debouncing)
 * - Clears filter when search is empty
 *
 * **Sort Behavior:**
 * - Server-side sorting by display name
 * - Toggle between ascending and descending order
 * - Preserves search filter when sorting
 *
 * **Usage:**
 * ```typescript
 * const {
 *   searchTerm,
 *   handleSearchChange,
 *   sortOrder,
 *   handleSorting,
 * } = useSearchAndSort({
 *   setCurrentPageNumber,
 *   refetch,
 * });
 * ```
 *
 * @param params - Search and sort parameters
 * @returns Search and sort utilities and state
 */
export function useSearchAndSort(
  params: UseSearchAndSortParams,
): UseSearchAndSortResult {
  const { setCurrentPageNumber, refetch } = params;

  // Keep refetch function reference fresh to avoid stale closures
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state (default: ascending by display name)
  const [sortOrder, setSortOrder] = useState<TimeTracking_WorkerOrderBy>(
    TimeTracking_WorkerOrderBy.DisplayNameAsc,
  );

  // Track if user has actively clicked sort (vs default state)
  const [isSorted, setIsSorted] = useState(false);

  /**
   * Reset to first page when search or sort changes.
   * This ensures users always start from page 1 when filtering/sorting.
   */
  useEffect(() => {
    setCurrentPageNumber(1);
  }, [searchTerm, sortOrder, setCurrentPageNumber]);

  /**
   * Handle search term change.
   * Triggers API refetch with search filter.
   *
   * If search term is empty, clears the filter.
   * Preserves current sort order.
   */
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);

      // Use refetchRef.current to get the latest refetch function
      if (value.trim()) {
        refetchRef.current({
          first: WORKERS_PAGE_SIZE,
          filter: { searchText: value.trim() },
          orderBy: [sortOrder],
        });
      } else {
        // Clear filter when search is empty
        refetchRef.current({
          first: WORKERS_PAGE_SIZE,
          orderBy: [sortOrder],
        });
      }
    },
    [sortOrder],
  );

  /**
   * Toggle sort order between ascending and descending.
   * Triggers API refetch with new sort order (unless skipApiCall is true).
   *
   * Preserves current search filter.
   */
  const handleSorting = useCallback(
    (skipApiCall?: boolean) => {
      const newSortOrder =
        sortOrder === TimeTracking_WorkerOrderBy.DisplayNameAsc
          ? TimeTracking_WorkerOrderBy.DisplayNameDesc
          : TimeTracking_WorkerOrderBy.DisplayNameAsc;

      setSortOrder(newSortOrder);
      setIsSorted(true); // Mark that user has actively sorted

      // Skip API call for client-side sorting
      if (skipApiCall) {
        return;
      }

      // Use refetchRef.current to get the latest refetch function
      refetchRef.current({
        first: WORKERS_PAGE_SIZE,
        filter: searchTerm.trim()
          ? { searchText: searchTerm.trim() }
          : undefined,
        orderBy: [newSortOrder],
      });
    },
    [sortOrder, searchTerm],
  );

  return {
    searchTerm,
    handleSearchChange,
    sortOrder,
    handleSorting,
    isSorted,
  };
}
