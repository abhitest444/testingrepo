import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';
import { AssignmentItem } from 'src/js/widgets/common/AssignmentDrawer/types';
import type { RootState } from './index';

/**
 * Page size constant - controls both API fetch size and UI pagination
 * Change this value to adjust how many records are fetched and displayed per page
 */
export const CUSTOMER_ASSIGNMENT_PAGE_SIZE = 100;

/**
 * Arguments for fetching customer assignments
 */
export interface FetchCustomerAssignmentsArgs {
  first: number; // Number of items to fetch (use CUSTOMER_ASSIGNMENT_PAGE_SIZE)
  after?: string; // Cursor for pagination
  customFieldId: string;
}

/**
 * Customer Assignments slice state
 */
interface CustomerAssignmentsState {
  allItems: AssignmentItem[]; // Accumulated items from all fetches
  totalCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  endCursor: string | null; // Track the cursor for next page
  lastFetchArgs: FetchCustomerAssignmentsArgs | null;
  customFieldId: string | null; // Track which custom field we're loading for
}

/**
 * Initial state
 */
const initialState: CustomerAssignmentsState = {
  allItems: [],
  totalCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  endCursor: null,
  lastFetchArgs: null,
  customFieldId: null,
};

/**
 * Async thunk for fetching customer assignments
 * This will be called from the component with the loader function
 */
export const fetchCustomerAssignments = createAsyncThunk<
  {
    items: AssignmentItem[];
    totalCount: number;
    hasMore: boolean;
    endCursor: string | null;
  },
  {
    loader: (args: FetchCustomerAssignmentsArgs) => Promise<{
      items: AssignmentItem[];
      totalCount: number;
      hasNextPage: boolean;
      endCursor: string | null;
    }>;
    args: FetchCustomerAssignmentsArgs;
  },
  { rejectValue: string }
>(
  'customerAssignments/fetchCustomerAssignments',
  async ({ loader, args }, { rejectWithValue }) => {
    try {
      const result = await loader(args);

      return {
        items: result.items,
        totalCount: result.totalCount,
        hasMore: result.hasNextPage,
        endCursor: result.endCursor,
      };
    } catch (error: any) {
      return rejectWithValue(
        error?.message || 'Failed to fetch customer assignments',
      );
    }
  },
);

/**
 * Customer Assignments slice
 */
const customerAssignmentsSlice = createSlice({
  name: 'customerAssignments',
  initialState,
  reducers: {
    // Set items directly (for initial load or manual data management)
    setItems: (state, action: PayloadAction<AssignmentItem[]>) => {
      state.allItems = action.payload;
    },

    // Add items to the cache (for incremental loading)
    addItems: (state, action: PayloadAction<AssignmentItem[]>) => {
      const existingIds = new Set(state.allItems.map((item) => item.id));
      action.payload.forEach((item) => {
        if (!existingIds.has(item.id)) {
          state.allItems.push(item);
          existingIds.add(item.id);
        }
      });
    },

    // Update a single item
    updateItem: (
      state,
      action: PayloadAction<{
        id: string | number;
        changes: Partial<AssignmentItem>;
      }>,
    ) => {
      const index = state.allItems.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index !== -1) {
        state.allItems[index] = {
          ...state.allItems[index],
          ...action.payload.changes,
        };
      }
    },

    // Set total count
    setTotalCount: (state, action: PayloadAction<number>) => {
      state.totalCount = action.payload;
    },

    // Set error manually
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set hasMore flag
    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set endCursor
    setEndCursor: (state, action: PayloadAction<string | null>) => {
      state.endCursor = action.payload;
    },

    // Append new data from API (convenience action that combines multiple updates)
    appendData: (
      state,
      action: PayloadAction<{
        items: AssignmentItem[];
        totalCount: number;
        hasNextPage: boolean;
        endCursor: string | null;
      }>,
    ) => {
      // Merge new items with existing ones, avoiding duplicates
      const existingIds = new Set(state.allItems.map((item) => item.id));
      action.payload.items.forEach((item) => {
        if (!existingIds.has(item.id)) {
          state.allItems.push(item);
          existingIds.add(item.id);
        }
      });
      state.totalCount = action.payload.totalCount;
      state.hasMore = action.payload.hasNextPage;
      state.endCursor = action.payload.endCursor;
      state.loading = false;
    },

    // Reset state (when switching custom fields or closing drawer)
    resetCustomerAssignmentsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch customer assignments - pending
      .addCase(fetchCustomerAssignments.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastFetchArgs = action.meta.arg.args;

        // If this is a new custom field, reset the state
        if (state.customFieldId !== action.meta.arg.args.customFieldId) {
          state.allItems = [];
          state.totalCount = 0;
          state.hasMore = true;
          state.endCursor = null;
          state.customFieldId = action.meta.arg.args.customFieldId;
        }
      })
      // Fetch customer assignments - fulfilled
      .addCase(fetchCustomerAssignments.fulfilled, (state, action) => {
        state.loading = false;

        // Merge new items with existing ones
        const existingIds = new Set(state.allItems.map((item) => item.id));
        action.payload.items.forEach((item) => {
          if (!existingIds.has(item.id)) {
            state.allItems.push(item);
            existingIds.add(item.id);
          }
        });

        state.totalCount = action.payload.totalCount;
        state.hasMore = action.payload.hasMore;
        state.endCursor = action.payload.endCursor;
        state.error = null;
      })
      // Fetch customer assignments - rejected
      .addCase(fetchCustomerAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch customer assignments';
      });
  },
});

// Export actions
export const {
  setItems,
  addItems,
  updateItem,
  setTotalCount,
  setError,
  clearError,
  setHasMore,
  setLoading,
  setEndCursor,
  appendData,
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

export const selectCustomerAssignmentsCustomFieldId = (state: RootState) =>
  state.customerAssignments.customFieldId;

// Memoized selectors
export const selectCustomerAssignmentsCount = createSelector(
  [selectCustomerAssignmentsAllItems],
  (items) => items.length,
);

export const selectCustomerAssignmentsSelected = createSelector(
  [selectCustomerAssignmentsAllItems],
  (items) => items.filter((item) => item.isSelected),
);

export const selectCustomerAssignmentsPaginated = createSelector(
  [
    selectCustomerAssignmentsAllItems,
    (state: RootState, page: number) => page,
    (state: RootState, page: number, pageSize: number) => pageSize,
  ],
  (items, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  },
);

export default customerAssignmentsSlice.reducer;
