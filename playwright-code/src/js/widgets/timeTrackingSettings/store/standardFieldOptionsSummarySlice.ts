import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

/**
 * Page size constant - controls both API fetch size and UI pagination
 */
export const STANDARD_FIELD_OPTIONS_PAGE_SIZE = 20;

/**
 * Standard field option summary node interface
 */
export interface StandardFieldOptionSummaryNode {
  id: string;
  name: string;
  standardFieldLabel: string;
  customerAssignmentCount: number;
  workerAssignmentCount: number;
}

/**
 * Standard field option summary edge interface
 */
export interface StandardFieldOptionSummaryEdge {
  cursor: string;
  node: StandardFieldOptionSummaryNode;
}

/**
 * Standard Field Options Summary slice state
 */
interface StandardFieldOptionsSummaryState {
  // All fetched option edges (accumulated across pages)
  allItems: StandardFieldOptionSummaryEdge[];

  // Total counts from API
  totalWorkerCount: number;
  totalCustomerCount: number;
  totalOptionsCount: number;

  // Loading state
  loading: boolean;

  // Error state
  error: string | null;

  // Pagination cursor info
  hasMore: boolean;
  startCursor: string | null;
  endCursor: string | null;

  // Track pagination state before search
  pageBeforeSearch: number;

  // Current standard field label being viewed
  currentFieldLabel: string | null;
}

const initialState: StandardFieldOptionsSummaryState = {
  allItems: [],
  totalWorkerCount: 0,
  totalCustomerCount: 0,
  totalOptionsCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  startCursor: null,
  endCursor: null,
  pageBeforeSearch: 1,
  currentFieldLabel: null,
};

const standardFieldOptionsSummarySlice = createSlice({
  name: 'standardFieldOptionsSummary',
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
        edges: StandardFieldOptionSummaryEdge[];
        totalWorkerCount: number;
        totalCustomerCount: number;
        totalOptionsCount: number;
        hasNextPage: boolean;
        startCursor: string | null;
        endCursor: string | null;
        fieldLabel: string;
      }>,
    ) => {
      state.allItems = action.payload.edges;
      state.totalWorkerCount = action.payload.totalWorkerCount;
      state.totalCustomerCount = action.payload.totalCustomerCount;
      state.totalOptionsCount = action.payload.totalOptionsCount;
      state.hasMore = action.payload.hasNextPage;
      state.startCursor = action.payload.startCursor;
      state.endCursor = action.payload.endCursor;
      state.currentFieldLabel = action.payload.fieldLabel;
      state.loading = false;
      state.error = null;
    },

    // Append more data (next page)
    appendData: (
      state,
      action: PayloadAction<{
        edges: StandardFieldOptionSummaryEdge[];
        hasNextPage: boolean;
        startCursor: string | null;
        endCursor: string | null;
      }>,
    ) => {
      // Create a map of existing items by ID for quick lookup
      const existingItemsMap = new Map<string, number>();
      state.allItems.forEach((edge, index) => {
        existingItemsMap.set(edge.node.id, index);
      });

      action.payload.edges.forEach((edge) => {
        const existingIndex = existingItemsMap.get(edge.node.id);
        if (existingIndex !== undefined) {
          // Replace existing item with updated data
          state.allItems[existingIndex] = edge;
        } else {
          // Add new item
          state.allItems.push(edge);
          existingItemsMap.set(edge.node.id, state.allItems.length - 1);
        }
      });

      state.hasMore = action.payload.hasNextPage;
      state.startCursor = action.payload.startCursor;
      state.endCursor = action.payload.endCursor;
      state.loading = false;
    },

    // Save page state before search
    setPageBeforeSearch: (state, action: PayloadAction<number>) => {
      state.pageBeforeSearch = action.payload;
    },

    // Reset state (when component unmounts or needs refresh)
    resetStandardFieldOptionsSummaryState: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setInitialData,
  appendData,
  setPageBeforeSearch,
  resetStandardFieldOptionsSummaryState,
} = standardFieldOptionsSummarySlice.actions;

// Selectors
export const selectStandardFieldOptionsSummaryState = (state: RootState) =>
  state.standardFieldOptionsSummary;

export const selectStandardFieldOptionsSummaryAllItems = (state: RootState) =>
  state.standardFieldOptionsSummary.allItems;

export const selectStandardFieldOptionsSummaryTotalWorkerCount = (
  state: RootState,
) => state.standardFieldOptionsSummary.totalWorkerCount;

export const selectStandardFieldOptionsSummaryTotalCustomerCount = (
  state: RootState,
) => state.standardFieldOptionsSummary.totalCustomerCount;

export const selectStandardFieldOptionsSummaryTotalOptionsCount = (
  state: RootState,
) => state.standardFieldOptionsSummary.totalOptionsCount;

export const selectStandardFieldOptionsSummaryLoading = (state: RootState) =>
  state.standardFieldOptionsSummary.loading;

export const selectStandardFieldOptionsSummaryError = (state: RootState) =>
  state.standardFieldOptionsSummary.error;

export const selectStandardFieldOptionsSummaryHasMore = (state: RootState) =>
  state.standardFieldOptionsSummary.hasMore;

export const selectStandardFieldOptionsSummaryStartCursor = (
  state: RootState,
) => state.standardFieldOptionsSummary.startCursor;

export const selectStandardFieldOptionsSummaryEndCursor = (state: RootState) =>
  state.standardFieldOptionsSummary.endCursor;

export const selectStandardFieldOptionsSummaryPageBeforeSearch = (
  state: RootState,
) => state.standardFieldOptionsSummary.pageBeforeSearch;

export const selectStandardFieldOptionsSummaryCurrentFieldLabel = (
  state: RootState,
) => state.standardFieldOptionsSummary.currentFieldLabel;

// Paginated selector - returns items for a specific page
export const selectStandardFieldOptionsSummaryPaginated = createSelector(
  [
    selectStandardFieldOptionsSummaryAllItems,
    (_state: RootState, page: number) => page,
    (_state: RootState, _page: number, pageSize: number) => pageSize,
  ],
  (items, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  },
);

export default standardFieldOptionsSummarySlice.reducer;
