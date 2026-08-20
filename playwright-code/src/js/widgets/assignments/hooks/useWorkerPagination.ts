import { useMemo } from 'react';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import { useInitialDataLoader } from './useInitialDataLoader';
import { usePaginationHandlers } from './usePaginationHandlers';
import { calculatePageWorkers } from '../utils/workerPaginationUtils';
import { WORKERS_PAGE_SIZE } from '../utils/constants';

/**
 * Parameters for the composed worker pagination hook
 */
export interface UseWorkerPaginationParams {
  // Mode
  isEditMode: boolean;

  // Current state
  currentPageNumber: number;
  setCurrentPageNumber: (page: number) => void;
  searchTerm: string;
  sortOrder: TimeTracking_WorkerOrderBy;
  isSorted: boolean; // Track if user has actively sorted
  loading: boolean;

  // Edit mode data (from Redux)
  drawerWorkersAllIds: string[];
  drawerWorkersById: Record<string, any>;
  drawerWorkersSelectedCount: number;

  // Create mode data (local state)
  currentWorkers: any[];
  selectedWorkerIds: Set<string>;

  // API data
  allCompanyWorkers: any[];
  pageInfo?: {
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };

  // API callbacks
  loadWorkers: (params: {
    first: number;
    filter?: { isActive?: boolean; searchText?: string };
    orderBy: TimeTracking_WorkerOrderBy[];
  }) => void;
  fetchNextPage: (params: {
    first: number;
    filter?: { isActive?: boolean; searchText?: string };
    orderBy: TimeTracking_WorkerOrderBy[];
  }) => Promise<void>;
  fetchPreviousPage: (params: {
    first: number;
    filter?: { isActive?: boolean; searchText?: string };
    orderBy: TimeTracking_WorkerOrderBy[];
  }) => Promise<void>;

  // 🆕 Group filter state
  groupFilter?: string;
}

/**
 * Result from the composed worker pagination hook
 */
export interface UseWorkerPaginationResult {
  // Paginated workers for current page
  workers: any[];

  // Pagination handlers
  handleNextPage: () => Promise<void>;
  handlePreviousPage: () => Promise<void>;

  // Pagination metadata
  totalPagesForSelected: number;
  fullPagesOfSelected: number;
  transitionPageNumber: number;
  remainingSelected: number;
}

/**
 * Master composition hook that orchestrates all worker pagination logic.
 *
 * This hook brings together:
 * - Initial data loading (useInitialDataLoader)
 * - Pagination navigation (usePaginationHandlers)
 * - Worker page calculation (calculatePageWorkers utility)
 *
 * **Purpose:**
 * Provides a single, cohesive API for pagination instead of managing multiple hooks.
 *
 * **Usage:**
 * ```typescript
 * const {
 *   workers,
 *   handleNextPage,
 *   handlePreviousPage
 * } = useWorkerPagination({
 *   isEditMode,
 *   currentPageNumber,
 *   setCurrentPageNumber,
 *   // ... other params
 * });
 * ```
 *
 * **Architecture:**
 * - Composes smaller, focused hooks
 * - Encapsulates all pagination complexity
 * - Single source of truth for pagination
 *
 * @param params - Worker pagination parameters
 * @returns Paginated workers and pagination handlers
 */
export function useWorkerPagination(
  params: UseWorkerPaginationParams,
): UseWorkerPaginationResult {
  const {
    isEditMode,
    currentPageNumber,
    setCurrentPageNumber,
    searchTerm,
    sortOrder,
    isSorted,
    loading,
    drawerWorkersAllIds,
    drawerWorkersById,
    drawerWorkersSelectedCount,
    currentWorkers,
    selectedWorkerIds,
    allCompanyWorkers,
    pageInfo,
    loadWorkers,
    fetchNextPage,
    fetchPreviousPage,
    groupFilter,
  } = params;

  // Calculate pagination metadata (for create mode)
  const totalSelectedWorkers = currentWorkers.length;
  const fullPagesOfSelected = Math.floor(
    totalSelectedWorkers / WORKERS_PAGE_SIZE,
  );
  const remainingSelected = totalSelectedWorkers % WORKERS_PAGE_SIZE;
  const transitionPageNumber =
    remainingSelected > 0 ? fullPagesOfSelected + 1 : 0;
  const totalPagesForSelected = Math.ceil(
    totalSelectedWorkers / WORKERS_PAGE_SIZE,
  );

  // Hook 1: Initial data loading on mount
  useInitialDataLoader({
    currentPageNumber,
    searchTerm,
    sortOrder,
    isEditMode,
    drawerWorkersLength: drawerWorkersAllIds.length,
    currentWorkersCount: currentWorkers.length,
    totalPagesForSelected,
    loadWorkers,
    groupFilter, // 🆕 Pass group filter
  });

  // Hook 2: Pagination navigation handlers
  const { handleNextPage, handlePreviousPage } = usePaginationHandlers({
    loading,
    currentPageNumber,
    searchTerm,
    sortOrder,
    isEditMode,
    drawerWorkersLength: drawerWorkersAllIds.length,
    hasNextPage: pageInfo?.hasNextPage,
    hasPreviousPage: pageInfo?.hasPreviousPage,
    fullPagesOfSelected,
    transitionPageNumber,
    totalPagesForSelected,
    setCurrentPageNumber,
    fetchNextPage,
    fetchPreviousPage,
    groupFilter, // 🆕 Pass group filter
  });

  // Calculate paginated workers for current page
  const workers = useMemo(
    () =>
      calculatePageWorkers({
        isEditMode,
        currentPageNumber,
        searchTerm,
        sortOrder,
        isSorted,
        drawerWorkersAllIds,
        drawerWorkersById,
        currentWorkers,
        allCompanyWorkers,
        selectedWorkerIds,
        totalSelectedWorkers,
        fullPagesOfSelected,
        transitionPageNumber,
        totalPagesForSelected,
        remainingSelected,
        groupFilter, // 🆕 Pass group filter to control display logic
      }),
    [
      isEditMode,
      currentPageNumber,
      searchTerm,
      sortOrder,
      isSorted,
      drawerWorkersAllIds,
      drawerWorkersById,
      currentWorkers,
      allCompanyWorkers,
      selectedWorkerIds,
      totalSelectedWorkers,
      fullPagesOfSelected,
      transitionPageNumber,
      totalPagesForSelected,
      remainingSelected,
      groupFilter, // 🆕 Re-calculate when group filter changes
    ],
  );

  return {
    workers,
    handleNextPage,
    handlePreviousPage,
    totalPagesForSelected,
    fullPagesOfSelected,
    transitionPageNumber,
    remainingSelected,
  };
}
