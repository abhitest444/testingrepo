import { useCallback } from 'react';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import {
  calculateNextPageNavigation,
  calculatePreviousPageNavigation,
  NavigationAction,
} from '../utils/workerPaginationUtils';
import { WORKERS_PAGE_SIZE } from '../utils/constants';

/**
 * Parameters for pagination handlers
 */
export interface UsePaginationHandlersParams {
  // Current state
  loading: boolean;
  currentPageNumber: number;
  searchTerm: string;
  sortOrder: TimeTracking_WorkerOrderBy;

  // Mode
  isEditMode: boolean;

  // Edit mode data
  drawerWorkersLength: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;

  // Create mode data
  fullPagesOfSelected: number;
  transitionPageNumber: number;
  totalPagesForSelected: number;

  // Callbacks
  setCurrentPageNumber: (page: number) => void;
  fetchNextPage: (params: {
    first: number;
    filter?: {
      isActive?: boolean;
      searchText?: string;
      groupId?: string;
      hasGroup?: boolean;
    };
    orderBy: TimeTracking_WorkerOrderBy[];
  }) => Promise<void>;
  fetchPreviousPage: (params: {
    first: number;
    filter?: {
      isActive?: boolean;
      searchText?: string;
      groupId?: string;
      hasGroup?: boolean;
    };
    orderBy: TimeTracking_WorkerOrderBy[];
  }) => Promise<void>;

  // 🆕 Group filter state
  groupFilter?: string;
}

/**
 * Custom hook to handle pagination navigation (next/previous page).
 *
 * Encapsulates the logic for:
 * - Calculating navigation actions (using utility functions)
 * - Executing side effects (API calls, state updates)
 * - Managing loading states
 *
 * This separates pagination orchestration from the UI component.
 *
 * @param params - Pagination handler parameters
 * @returns Object with handleNextPage and handlePreviousPage callbacks
 */
export function usePaginationHandlers(params: UsePaginationHandlersParams) {
  const {
    loading,
    currentPageNumber,
    searchTerm,
    sortOrder,
    isEditMode,
    drawerWorkersLength,
    hasNextPage,
    hasPreviousPage,
    fullPagesOfSelected,
    transitionPageNumber,
    totalPagesForSelected,
    setCurrentPageNumber,
    fetchNextPage,
    fetchPreviousPage,
    groupFilter,
  } = params;

  /**
   * Handle navigation to next page.
   * Uses utility to calculate action, then executes side effects.
   */
  const handleNextPage = useCallback(async () => {
    if (loading) return;

    // Calculate what action to take using utility function
    const navigationResult = calculateNextPageNavigation({
      currentPageNumber,
      isEditMode,
      drawerWorkersLength,
      hasNextPage,
      fullPagesOfSelected,
      transitionPageNumber,
    });

    // Execute the action
    switch (navigationResult.action) {
      case NavigationAction.DO_NOTHING:
        return;

      case NavigationAction.FETCH_THEN_CHANGE:
        await fetchNextPage({
          first: WORKERS_PAGE_SIZE,
          filter: {
            isActive: true,
            ...(searchTerm.trim() && { searchText: searchTerm.trim() }),
            ...(groupFilter === 'NO_GROUP' && { hasGroup: false }),
            ...(groupFilter &&
              groupFilter !== 'ALL' &&
              groupFilter !== 'NO_GROUP' && { groupId: groupFilter }),
          },
          orderBy: [sortOrder],
        });
        setCurrentPageNumber(navigationResult.nextPageNumber);
        break;

      case NavigationAction.CHANGE_PAGE:
        setCurrentPageNumber(navigationResult.nextPageNumber);
        break;

      default:
        // All NavigationAction cases handled above
        break;
    }
  }, [
    loading,
    currentPageNumber,
    isEditMode,
    drawerWorkersLength,
    hasNextPage,
    fetchNextPage,
    searchTerm,
    sortOrder,
    groupFilter,
    fullPagesOfSelected,
    transitionPageNumber,
    setCurrentPageNumber,
  ]);

  /**
   * Handle navigation to previous page.
   * Uses utility to calculate action, then executes side effects.
   */
  const handlePreviousPage = useCallback(async () => {
    if (loading) return;

    // Calculate what action to take using utility function
    const navigationResult = calculatePreviousPageNavigation({
      currentPageNumber,
      isEditMode,
      fullPagesOfSelected,
      totalPagesForSelected,
      hasPreviousPage,
    });

    // Execute the action
    switch (navigationResult.action) {
      case NavigationAction.DO_NOTHING:
        return;

      case NavigationAction.FETCH_THEN_CHANGE:
        await fetchPreviousPage({
          first: WORKERS_PAGE_SIZE,
          filter: {
            isActive: true,
            ...(searchTerm.trim() && { searchText: searchTerm.trim() }),
            ...(groupFilter === 'NO_GROUP' && { hasGroup: false }),
            ...(groupFilter &&
              groupFilter !== 'ALL' &&
              groupFilter !== 'NO_GROUP' && { groupId: groupFilter }),
          },
          orderBy: [sortOrder],
        });
        setCurrentPageNumber(navigationResult.nextPageNumber);
        break;

      case NavigationAction.CHANGE_PAGE:
        setCurrentPageNumber(navigationResult.nextPageNumber);
        break;

      default:
        // All NavigationAction cases handled above
        break;
    }
  }, [
    loading,
    currentPageNumber,
    isEditMode,
    fullPagesOfSelected,
    totalPagesForSelected,
    hasPreviousPage,
    fetchPreviousPage,
    searchTerm,
    sortOrder,
    groupFilter,
    setCurrentPageNumber,
  ]);

  return {
    handleNextPage,
    handlePreviousPage,
  };
}
