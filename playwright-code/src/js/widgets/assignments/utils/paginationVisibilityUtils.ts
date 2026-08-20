import { WORKERS_PAGE_SIZE } from './constants';

/**
 * Parameters for calculating pagination visibility
 */
export interface PaginationVisibilityParams {
  // Mode flags
  isEditMode: boolean;
  isLoading: boolean;

  // Search and sort state
  searchTerm: string;
  isSorted: boolean;

  // Current pagination state
  currentPageNumber: number;

  // Edit mode data
  drawerWorkersCount: number;

  // Create mode data
  totalPagesForSelected: number;

  // API pagination info
  pageInfo?: {
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

/**
 * Result of pagination visibility calculation
 */
export interface PaginationVisibilityResult {
  canGoPrevious: boolean;
  canGoNext: boolean;
  showPagination: boolean;
}

/**
 * Calculate if "Previous" button should be visible
 *
 * @param currentPageNumber - Current page number (1-indexed)
 * @param isLoading - Whether data is currently loading
 * @returns true if Previous button should be shown
 */
function calculateCanGoPrevious(
  currentPageNumber: number,
  isLoading: boolean,
): boolean {
  return currentPageNumber > 1 && !isLoading;
}

/**
 * Calculate if "Next" button should be visible for Edit Mode
 *
 * @param params - Edit mode specific parameters
 * @returns true if Next button should be shown
 */
function calculateEditModeCanGoNext(params: {
  searchTerm: string;
  isSorted: boolean;
  currentPageNumber: number;
  drawerWorkersCount: number;
  hasNextPage: boolean;
}): boolean {
  const {
    searchTerm,
    isSorted,
    currentPageNumber,
    drawerWorkersCount,
    hasNextPage,
  } = params;

  // Search mode: Use API pagination
  if (searchTerm.trim()) {
    return hasNextPage;
  }

  // Sort mode: Use API pagination
  if (isSorted) {
    return hasNextPage;
  }

  // Default mode: Use client-side pagination from Redux
  const totalPages = Math.ceil(drawerWorkersCount / WORKERS_PAGE_SIZE);
  return currentPageNumber < totalPages;
}

/**
 * Calculate if "Next" button should be visible for Create Mode
 *
 * @param params - Create mode specific parameters
 * @returns true if Next button should be shown
 */
function calculateCreateModeCanGoNext(params: {
  currentPageNumber: number;
  totalPagesForSelected: number;
  hasNextPage: boolean;
}): boolean {
  const { currentPageNumber, totalPagesForSelected, hasNextPage } = params;

  // Hybrid pagination: selected workers (client-side) + unselected workers (server-side)
  return (
    currentPageNumber < totalPagesForSelected || // More selected pages exist
    (currentPageNumber >= totalPagesForSelected && hasNextPage) // On/past selected pages and API has more
  );
}

/**
 * Calculate pagination button visibility based on mode and state
 *
 * This function encapsulates all pagination visibility logic for both Edit and Create modes.
 * It determines whether Previous/Next buttons should be shown based on:
 * - Current mode (Edit vs Create)
 * - Current state (searching, sorting, default)
 * - Available data (Redux, API)
 * - Loading state
 *
 * @param params - Pagination visibility parameters
 * @returns Object containing visibility flags for pagination controls
 *
 * @example
 * ```typescript
 * const { canGoPrevious, canGoNext, showPagination } = calculatePaginationVisibility({
 *   isEditMode: true,
 *   isLoading: false,
 *   searchTerm: '',
 *   isSorted: false,
 *   currentPageNumber: 2,
 *   drawerWorkersCount: 150,
 *   totalPagesForSelected: 0,
 *   pageInfo: { hasNextPage: true },
 * });
 * ```
 */
export function calculatePaginationVisibility(
  params: PaginationVisibilityParams,
): PaginationVisibilityResult {
  const {
    isEditMode,
    isLoading,
    searchTerm,
    isSorted,
    currentPageNumber,
    drawerWorkersCount,
    totalPagesForSelected,
    pageInfo,
  } = params;

  // Calculate Previous button visibility (same for all modes)
  const canGoPrevious = calculateCanGoPrevious(currentPageNumber, isLoading);

  // Calculate Next button visibility based on mode
  let canGoNext = false;

  if (!isLoading) {
    if (isEditMode) {
      // EDIT MODE: Different logic for search/sort/default
      canGoNext = calculateEditModeCanGoNext({
        searchTerm,
        isSorted,
        currentPageNumber,
        drawerWorkersCount,
        hasNextPage: pageInfo?.hasNextPage || false,
      });
    } else {
      // CREATE MODE: Hybrid pagination
      canGoNext = calculateCreateModeCanGoNext({
        currentPageNumber,
        totalPagesForSelected,
        hasNextPage: pageInfo?.hasNextPage || false,
      });
    }
  }

  // Show pagination controls only when at least one button is enabled and clickable
  // Hide pagination when both Previous and Next buttons would be disabled
  const showPagination = canGoPrevious || canGoNext;

  return {
    canGoPrevious,
    canGoNext,
    showPagination,
  };
}

/**
 * Get user-friendly pagination state description (for debugging/logging)
 *
 * @param params - Pagination visibility parameters
 * @returns Human-readable description of current pagination state
 */
export function getPaginationStateDescription(
  params: PaginationVisibilityParams,
): string {
  const { isEditMode, searchTerm, isSorted, currentPageNumber } = params;

  const mode = isEditMode ? 'Edit' : 'Create';

  // Determine state without nested ternary
  let state = 'Default';
  if (searchTerm.trim()) {
    state = 'Searching';
  } else if (isSorted) {
    state = 'Sorted';
  }

  return `${mode} Mode | ${state} | Page ${currentPageNumber}`;
}
