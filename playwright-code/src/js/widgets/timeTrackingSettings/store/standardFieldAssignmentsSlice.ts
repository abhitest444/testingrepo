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
export const STANDARD_FIELD_ASSIGNMENT_PAGE_SIZE = 100;

/**
 * Arguments for fetching standard field assignments
 */
export interface FetchStandardFieldAssignmentsArgs {
  first: number;
  after?: string;
  standardFieldLabel: string;
}

/**
 * Standard Field Assignments slice state
 */
interface StandardFieldAssignmentsState {
  allItems: AssignmentItem[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  endCursor: string | null;
  lastFetchArgs: FetchStandardFieldAssignmentsArgs | null;
  standardFieldLabel: string | null;
}

/**
 * Initial state
 */
const initialState: StandardFieldAssignmentsState = {
  allItems: [],
  totalCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  endCursor: null,
  lastFetchArgs: null,
  standardFieldLabel: null,
};

/**
 * Async thunk for fetching standard field assignments
 */
export const fetchStandardFieldAssignments = createAsyncThunk<
  {
    items: AssignmentItem[];
    totalCount: number;
    hasMore: boolean;
    endCursor: string | null;
  },
  {
    loader: (args: FetchStandardFieldAssignmentsArgs) => Promise<{
      items: AssignmentItem[];
      totalCount: number;
      hasNextPage: boolean;
      endCursor: string | null;
    }>;
    args: FetchStandardFieldAssignmentsArgs;
  },
  { rejectValue: string }
>(
  'standardFieldAssignments/fetchStandardFieldAssignments',
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
        error?.message || 'Failed to fetch standard field assignments',
      );
    }
  },
);

/**
 * Standard Field Assignments slice
 */
const standardFieldAssignmentsSlice = createSlice({
  name: 'standardFieldAssignments',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<AssignmentItem[]>) => {
      state.allItems = action.payload;
    },

    addItems: (state, action: PayloadAction<AssignmentItem[]>) => {
      const existingIds = new Set(state.allItems.map((item) => item.id));
      action.payload.forEach((item) => {
        if (!existingIds.has(item.id)) {
          state.allItems.push(item);
          existingIds.add(item.id);
        }
      });
    },

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

    setTotalCount: (state, action: PayloadAction<number>) => {
      state.totalCount = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setEndCursor: (state, action: PayloadAction<string | null>) => {
      state.endCursor = action.payload;
    },

    appendData: (
      state,
      action: PayloadAction<{
        items: AssignmentItem[];
        totalCount: number;
        hasNextPage: boolean;
        endCursor: string | null;
      }>,
    ) => {
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

    resetStandardFieldAssignmentsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStandardFieldAssignments.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastFetchArgs = action.meta.arg.args;

        if (
          state.standardFieldLabel !== action.meta.arg.args.standardFieldLabel
        ) {
          state.allItems = [];
          state.totalCount = 0;
          state.hasMore = true;
          state.endCursor = null;
          state.standardFieldLabel = action.meta.arg.args.standardFieldLabel;
        }
      })
      .addCase(fetchStandardFieldAssignments.fulfilled, (state, action) => {
        state.loading = false;

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
      .addCase(fetchStandardFieldAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || 'Failed to fetch standard field assignments';
      });
  },
});

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
  resetStandardFieldAssignmentsState,
} = standardFieldAssignmentsSlice.actions;

export const selectStandardFieldAssignmentsState = (state: RootState) =>
  state.standardFieldAssignments;

export const selectStandardFieldAssignmentsAllItems = (state: RootState) =>
  state.standardFieldAssignments.allItems;

export const selectStandardFieldAssignmentsTotalCount = (state: RootState) =>
  state.standardFieldAssignments.totalCount;

export const selectStandardFieldAssignmentsLoading = (state: RootState) =>
  state.standardFieldAssignments.loading;

export const selectStandardFieldAssignmentsError = (state: RootState) =>
  state.standardFieldAssignments.error;

export const selectStandardFieldAssignmentsHasMore = (state: RootState) =>
  state.standardFieldAssignments.hasMore;

export const selectStandardFieldAssignmentsEndCursor = (state: RootState) =>
  state.standardFieldAssignments.endCursor;

export const selectStandardFieldAssignmentsStandardFieldLabel = (
  state: RootState,
) => state.standardFieldAssignments.standardFieldLabel;

export const selectStandardFieldAssignmentsCount = createSelector(
  [selectStandardFieldAssignmentsAllItems],
  (items) => items.length,
);

export const selectStandardFieldAssignmentsSelected = createSelector(
  [selectStandardFieldAssignmentsAllItems],
  (items) => items.filter((item) => item.isSelected),
);

export const selectStandardFieldAssignmentsPaginated = createSelector(
  [
    selectStandardFieldAssignmentsAllItems,
    (state: RootState, page: number) => page,
    (state: RootState, page: number, pageSize: number) => pageSize,
  ],
  (items, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  },
);

export default standardFieldAssignmentsSlice.reducer;
