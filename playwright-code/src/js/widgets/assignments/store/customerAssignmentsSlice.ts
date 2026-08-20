import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { TimeAgainstAssignmentSummaryEdge } from 'src/js/service/types/assignmentTypes';
import type { RootState } from './index';

export const CUSTOMER_ASSIGNMENT_PAGE_SIZE = 20;

interface CustomerAssignmentsState {
  // All fetched customer edges (accumulated across pages)
  allItems: TimeAgainstAssignmentSummaryEdge[];

  // Total count from API
  totalCount: number;

  // Loading state
  loading: boolean;

  // Error state
  error: string | null;

  // Pagination cursor info
  hasMore: boolean;
  endCursor: string | null;

  // Summary stats (from first API response)
  totalTimeForAssignments: number;
  totalCustomFieldAssignments: number;
  totalStandardFieldAssignments: number;

  // Track pagination state before search
  pageBeforeSearch: number;
}

const initialState: CustomerAssignmentsState = {
  allItems: [],
  totalCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  endCursor: null,
  totalTimeForAssignments: 0,
  totalCustomFieldAssignments: 0,
  totalStandardFieldAssignments: 0,
  pageBeforeSearch: 1,
};

const customerAssignmentsSlice = createSlice({
  name: 'customerAssignments',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Initial data load (first page)
    setInitialData: (
      state,
      action: PayloadAction<{
        edges: TimeAgainstAssignmentSummaryEdge[];
        totalCount: number;
        hasNextPage: boolean;
        endCursor: string | null;
        totalTimeForAssignments: number;
        totalCustomFieldAssignments: number;
        totalStandardFieldAssignments: number;
      }>,
    ) => {
      state.allItems = action.payload.edges;
      state.totalCount = action.payload.totalCount;
      state.hasMore = action.payload.hasNextPage;
      state.endCursor = action.payload.endCursor;
      state.totalTimeForAssignments = action.payload.totalTimeForAssignments;
      state.totalCustomFieldAssignments =
        action.payload.totalCustomFieldAssignments;
      state.totalStandardFieldAssignments =
        action.payload.totalStandardFieldAssignments;
      state.loading = false;
      state.error = null;
    },

    // Append more data (next page)
    appendData: (
      state,
      action: PayloadAction<{
        edges: TimeAgainstAssignmentSummaryEdge[];
        hasNextPage: boolean;
        endCursor: string | null;
        totalCount?: number; // Optional: update totalCount if provided (for search results)
      }>,
    ) => {
      // Create a map of existing items by ID for quick lookup
      const existingItemsMap = new Map<string, number>();
      state.allItems.forEach((edge, index) => {
        const { project, customer } =
          edge.node.timeAgainst.timeAgainstContactDAS;
        const id = project?.id || customer?.id || '';
        if (id) {
          existingItemsMap.set(id, index);
        }
      });

      action.payload.edges.forEach((edge) => {
        const { project, customer } =
          edge.node.timeAgainst.timeAgainstContactDAS;
        const id = project?.id || customer?.id || '';
        if (id) {
          const existingIndex = existingItemsMap.get(id);
          if (existingIndex !== undefined) {
            // Replace existing item with updated data
            state.allItems[existingIndex] = edge;
          } else {
            // Add new item
            state.allItems.push(edge);
            existingItemsMap.set(id, state.allItems.length - 1);
          }
        }
      });

      state.hasMore = action.payload.hasNextPage;
      state.endCursor = action.payload.endCursor;
      // Update totalCount if provided (for search results pagination)
      if (action.payload.totalCount !== undefined) {
        state.totalCount = action.payload.totalCount;
      }
      state.loading = false;
    },

    // Refresh current page data in-place (upserts by ID, preserves cursor/hasMore)
    refreshPageData: (
      state,
      action: PayloadAction<{
        edges: TimeAgainstAssignmentSummaryEdge[];
        totalCount: number;
        totalTimeForAssignments: number;
        totalCustomFieldAssignments: number;
        totalStandardFieldAssignments: number;
      }>,
    ) => {
      const existingItemsMap = new Map<string, number>();
      state.allItems.forEach((edge, index) => {
        const { project, customer } =
          edge.node.timeAgainst.timeAgainstContactDAS;
        const id = project?.id || customer?.id || '';
        if (id) {
          existingItemsMap.set(id, index);
        }
      });

      action.payload.edges.forEach((edge) => {
        const { project, customer } =
          edge.node.timeAgainst.timeAgainstContactDAS;
        const id = project?.id || customer?.id || '';
        if (id) {
          const existingIndex = existingItemsMap.get(id);
          if (existingIndex !== undefined) {
            state.allItems[existingIndex] = edge;
          }
        }
      });

      state.totalCount = action.payload.totalCount;
      state.totalTimeForAssignments = action.payload.totalTimeForAssignments;
      state.totalCustomFieldAssignments =
        action.payload.totalCustomFieldAssignments;
      state.totalStandardFieldAssignments =
        action.payload.totalStandardFieldAssignments;
      state.loading = false;
      state.error = null;
    },

    // Save page state before search
    setPageBeforeSearch: (state, action: PayloadAction<number>) => {
      state.pageBeforeSearch = action.payload;
    },

    // Reset state (when component unmounts or needs refresh)
    resetCustomerAssignmentsState: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setInitialData,
  appendData,
  refreshPageData,
  setPageBeforeSearch,
  resetCustomerAssignmentsState,
} = customerAssignmentsSlice.actions;

// Selectors
export const selectCustomerAssignmentsState = (state: RootState) =>
  state.customerAssignments;

export const selectCustomerAssignmentsAllItems = (state: RootState) =>
  state.customerAssignments.allItems;

export const selectCustomerAssignmentsTotalCount = (state: RootState) =>
  state.customerAssignments.totalCount;

export const selectCustomerAssignmentsLoading = (state: RootState) =>
  state.customerAssignments.loading;

export const selectCustomerAssignmentsError = (state: RootState) =>
  state.customerAssignments.error;

export const selectCustomerAssignmentsHasMore = (state: RootState) =>
  state.customerAssignments.hasMore;

export const selectCustomerAssignmentsEndCursor = (state: RootState) =>
  state.customerAssignments.endCursor;

export const selectCustomerAssignmentsPageBeforeSearch = (state: RootState) =>
  state.customerAssignments.pageBeforeSearch;

export const selectCustomerAssignmentsSummaryStats = createSelector(
  [
    (state: RootState) => state.customerAssignments.totalTimeForAssignments,
    (state: RootState) => state.customerAssignments.totalCustomFieldAssignments,
    (state: RootState) =>
      state.customerAssignments.totalStandardFieldAssignments,
  ],
  (
    totalTimeForAssignments,
    totalCustomFieldAssignments,
    totalStandardFieldAssignments,
  ) => ({
    totalTimeForAssignments,
    totalCustomFieldAssignments,
    totalStandardFieldAssignments,
  }),
);

// Paginated selector - returns items for a specific page
export const selectCustomerAssignmentsPaginated = createSelector(
  [
    selectCustomerAssignmentsAllItems,
    (_state: RootState, page: number) => page,
    (_state: RootState, _page: number, pageSize: number) => pageSize,
  ],
  (items, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  },
);

export default customerAssignmentsSlice.reducer;
