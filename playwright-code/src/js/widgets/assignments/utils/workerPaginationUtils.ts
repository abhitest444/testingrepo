import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import { DrawerWorker } from '../store/workersGroupViewSlice';
import { WORKERS_PAGE_SIZE } from './constants';

/**
 * Worker object shape from API
 */
export interface WorkerFromAPI {
  id: string;
  type: string;
  displayName: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  memberOfGroup?: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
  managesGroups?: Array<{ id: string; name: string }>;
}

/**
 * Parameters for calculating paginated workers
 */
export interface WorkerPaginationParams {
  isEditMode: boolean;
  currentPageNumber: number;
  searchTerm?: string; // When searching, use API data instead of Redux
  sortOrder?: TimeTracking_WorkerOrderBy; // Sort order for client-side sorting
  isSorted?: boolean; // Track if user has actively sorted (vs default state)

  // Edit mode: Redux drawer workers
  drawerWorkersAllIds: string[];
  drawerWorkersById: Record<string, DrawerWorker>;

  // Create mode: API workers + selected workers
  currentWorkers: any[];
  allCompanyWorkers: any[];
  selectedWorkerIds: Set<string>;

  // Pagination calculations
  totalSelectedWorkers: number;
  fullPagesOfSelected: number;
  transitionPageNumber: number;
  totalPagesForSelected: number;
  remainingSelected: number;

  // 🆕 Group filter (when active, show only API results)
  groupFilter?: string;
}

/**
 * Calculate which workers to display on the current page based on mode and pagination state.
 *
 * **EDIT MODE:**
 * - When searching: Uses API results directly (allCompanyWorkers)
 * - When not searching: Uses drawer workers from Redux (pre-loaded managers + members)
 * - Simple client-side pagination by slicing drawerWorkersAllIds
 *
 * **CREATE MODE:**
 * - Currently uses simple API pagination (all workers from API)
 * - Hybrid pagination logic (selected + unselected) exists but is unused since:
 *   - currentWorkers is always empty
 *   - totalSelectedWorkers is always 0
 *   - Always falls through to CASE 3
 *
 * @param params - Pagination parameters
 * @returns Array of workers to display on current page
 */
export function calculatePageWorkers(
  params: WorkerPaginationParams,
): WorkerFromAPI[] {
  const {
    isEditMode,
    currentPageNumber,
    searchTerm,
    sortOrder,
    isSorted = false,
    drawerWorkersAllIds,
    drawerWorkersById,
    currentWorkers,
    allCompanyWorkers,
    selectedWorkerIds,
    fullPagesOfSelected,
    transitionPageNumber,
    totalPagesForSelected,
    remainingSelected,
    groupFilter,
  } = params;

  // 🆕 When group filter is active (not "ALL"), show ONLY API results
  // This applies to both Edit and Create modes
  if (groupFilter && groupFilter !== 'ALL') {
    return allCompanyWorkers;
  }

  // Edit mode with search: Use API results directly (no "selected first" for search)
  if (isEditMode && searchTerm && searchTerm.trim()) {
    return allCompanyWorkers;
  }

  // Edit mode without search: Use drawer workers from Redux
  if (isEditMode) {
    let sortedIds = drawerWorkersAllIds;

    // Apply different sorting based on whether user has actively sorted
    if (isSorted && sortOrder) {
      // User has clicked sort: Respect sort order ONLY (no "selected first")
      sortedIds = [...drawerWorkersAllIds].sort((aId, bId) => {
        const aWorker = drawerWorkersById[aId];
        const bWorker = drawerWorkersById[bId];

        if (!aWorker || !bWorker) return 0;

        const aName = aWorker.displayName?.toLowerCase() || '';
        const bName = bWorker.displayName?.toLowerCase() || '';

        if (sortOrder === TimeTracking_WorkerOrderBy.DisplayNameAsc) {
          return aName.localeCompare(bName);
        }
        return bName.localeCompare(aName);
      });
    } else {
      // Default state (no sort clicked): Show "selected first"
      // No sorting needed - drawerWorkersAllIds already has "selected first" from Redux
      sortedIds = drawerWorkersAllIds;
    }

    const pageIndex = currentPageNumber - 1;
    const startIdx = pageIndex * WORKERS_PAGE_SIZE;
    const endIdx = startIdx + WORKERS_PAGE_SIZE;

    // Map from drawer workers IDs to full worker objects
    const pageWorkers = sortedIds.slice(startIdx, endIdx).map((id) => {
      const dw = drawerWorkersById[id];
      return {
        id: dw.id,
        type: dw.type,
        displayName: dw.displayName,
        isActive: dw.isActive,
        firstName: dw.firstName,
        lastName: dw.lastName,
        memberOfGroup: dw.memberOfGroup || null, // Already rich object, just pass through
        managesGroups: dw.managesGroups,
      };
    });

    return pageWorkers;
  }

  // Create mode: Simple server-side pagination
  // Just return all workers from API (already paginated by server)
  return allCompanyWorkers;
}

/**
 * Navigation action types
 */
export enum NavigationAction {
  /** Just change page number (no API call needed) */
  CHANGE_PAGE = 'CHANGE_PAGE',
  /** Fetch more data from API then change page */
  FETCH_THEN_CHANGE = 'FETCH_THEN_CHANGE',
  /** Do nothing (no more pages available) */
  DO_NOTHING = 'DO_NOTHING',
}

/**
 * Result of pagination navigation calculation
 */
export interface NavigationResult {
  action: NavigationAction;
  /** New page number to navigate to */
  nextPageNumber: number;
}

/**
 * Parameters for next page navigation calculation
 */
export interface NextPageNavigationParams {
  currentPageNumber: number;
  isEditMode: boolean;

  // Edit mode parameters
  drawerWorkersLength: number;
  hasNextPage?: boolean;

  // Create mode parameters
  fullPagesOfSelected: number;
  transitionPageNumber: number;
}

/**
 * Calculate what action to take when navigating to next page.
 * Returns the action type and target page number.
 *
 * **EDIT MODE:**
 * - If next page is already in Redux: CHANGE_PAGE
 * - If next page needs fetching: FETCH_THEN_CHANGE
 *
 * **CREATE MODE:**
 * - If within selected pages: CHANGE_PAGE
 * - If on transition page: CHANGE_PAGE
 * - If needs more data: FETCH_THEN_CHANGE
 * - If no more pages: DO_NOTHING
 */
export function calculateNextPageNavigation(
  params: NextPageNavigationParams,
): NavigationResult {
  const {
    currentPageNumber,
    isEditMode,
    drawerWorkersLength,
    hasNextPage,
    fullPagesOfSelected,
    transitionPageNumber,
  } = params;

  const nextPageNumber = currentPageNumber + 1;

  // Edit mode: Simple client-side pagination
  if (isEditMode) {
    const totalWorkers = drawerWorkersLength;
    const nextPageStartIdx = nextPageNumber * WORKERS_PAGE_SIZE;

    // Check if we need to fetch more workers
    if (nextPageStartIdx >= totalWorkers && hasNextPage) {
      return { action: NavigationAction.FETCH_THEN_CHANGE, nextPageNumber };
    }

    return { action: NavigationAction.CHANGE_PAGE, nextPageNumber };
  }

  // Create mode: Simple server-side pagination
  if (!hasNextPage) {
    return { action: NavigationAction.DO_NOTHING, nextPageNumber };
  }

  return { action: NavigationAction.FETCH_THEN_CHANGE, nextPageNumber };
}

/**
 * Parameters for previous page navigation calculation
 */
export interface PreviousPageNavigationParams {
  currentPageNumber: number;
  isEditMode: boolean;

  // Create mode parameters
  fullPagesOfSelected: number;
  totalPagesForSelected: number;
  hasPreviousPage?: boolean;
}

/**
 * Calculate what action to take when navigating to previous page.
 * Returns the action type and target page number.
 *
 * **EDIT MODE:**
 * - Always CHANGE_PAGE (data already in Redux)
 *
 * **CREATE MODE:**
 * - If within selected/transition pages: CHANGE_PAGE
 * - If need to fetch previous page: FETCH_THEN_CHANGE
 * - If no previous page: DO_NOTHING
 */
export function calculatePreviousPageNavigation(
  params: PreviousPageNavigationParams,
): NavigationResult {
  const {
    currentPageNumber,
    isEditMode,
    fullPagesOfSelected,
    totalPagesForSelected,
    hasPreviousPage,
  } = params;

  // Guard: Can't go before page 1
  if (currentPageNumber <= 1) {
    return {
      action: NavigationAction.DO_NOTHING,
      nextPageNumber: currentPageNumber,
    };
  }

  const prevPageNumber = currentPageNumber - 1;

  // Edit mode: Simple client-side pagination
  if (isEditMode) {
    return {
      action: NavigationAction.CHANGE_PAGE,
      nextPageNumber: prevPageNumber,
    };
  }

  // Create mode: Simple server-side pagination
  if (!hasPreviousPage) {
    return {
      action: NavigationAction.DO_NOTHING,
      nextPageNumber: prevPageNumber,
    };
  }

  return {
    action: NavigationAction.FETCH_THEN_CHANGE,
    nextPageNumber: prevPageNumber,
  };
}
