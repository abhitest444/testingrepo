import { useEffect } from 'react';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import { WORKERS_PAGE_SIZE } from '../utils/constants';

/**
 * Parameters for initial data loader
 */
export interface UseInitialDataLoaderParams {
  // Current page state
  currentPageNumber: number;
  searchTerm: string;
  sortOrder: TimeTracking_WorkerOrderBy;

  // Mode
  isEditMode: boolean;

  // Edit mode data
  drawerWorkersLength: number;

  // Create mode data
  currentWorkersCount: number;
  totalPagesForSelected: number;

  // Data loading callback
  loadWorkers: (params: {
    first: number;
    filter?: {
      isActive?: boolean;
      searchText?: string;
      groupId?: string;
      hasGroup?: boolean;
    };
    orderBy: TimeTracking_WorkerOrderBy[];
  }) => void;

  // 🆕 Group filter
  groupFilter?: string;
}

/**
 * Custom hook to handle initial data loading on mount.
 *
 * Loads workers from API when component first renders (page 1).
 * Handles different loading strategies for edit vs create mode.
 *
 * **EDIT MODE:**
 * - Always fetches company workers to populate subsequent pages
 * - Even if page 1 is full with managers, we need workers for pages 2, 3, etc.
 *
 * **CREATE MODE:**
 * - Calculates how many workers needed based on selected workers
 * - If page 1 has selected workers, only fetch enough to fill the page
 * - Otherwise fetch full page size
 *
 * @param params - Initial data loader parameters
 */
export function useInitialDataLoader(params: UseInitialDataLoaderParams): void {
  const {
    currentPageNumber,
    searchTerm,
    sortOrder,
    isEditMode,
    drawerWorkersLength,
    currentWorkersCount,
    totalPagesForSelected,
    loadWorkers,
    groupFilter,
  } = params;

  useEffect(() => {
    // Only load on first page
    if (currentPageNumber !== 1) return;

    // Build filter with group filter included
    const filter: any = {
      isActive: true,
      ...(searchTerm.trim() && { searchText: searchTerm.trim() }),
      ...(groupFilter === 'NO_GROUP' && { hasGroup: false }),
      ...(groupFilter &&
        groupFilter !== 'ALL' &&
        groupFilter !== 'NO_GROUP' && { groupId: groupFilter }),
    };

    // Edit mode: Fetch company workers for all pages
    if (isEditMode) {
      // Always fetch company workers to populate subsequent pages
      // Even if page 1 is full with managers, we need workers for pages 2, 3, etc.
      loadWorkers({
        first: WORKERS_PAGE_SIZE,
        filter,
        orderBy: [sortOrder],
      });

      return;
    }

    // Create mode: Hybrid pagination based on selected workers
    const selectedCount = currentWorkersCount;

    // Calculate how many workers we need from API for page 1
    let fetchCount = WORKERS_PAGE_SIZE;

    // If we have selected workers, and page 1 is not entirely selected
    if (selectedCount > 0 && selectedCount < WORKERS_PAGE_SIZE) {
      // Page 1 will be partial selected + partial unselected
      fetchCount = WORKERS_PAGE_SIZE - selectedCount;
    }

    loadWorkers({
      first: fetchCount,
      filter,
      orderBy: [sortOrder],
    });
  }, [
    currentPageNumber,
    searchTerm,
    sortOrder,
    currentWorkersCount,
    totalPagesForSelected,
    isEditMode,
    drawerWorkersLength,
    loadWorkers,
    groupFilter, // 🆕 Re-load when group filter changes
  ]);
}
