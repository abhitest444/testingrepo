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
export const STANDARD_FIELD_WORKER_ASSIGNMENT_PAGE_SIZE = 100;

/**
 * Arguments for fetching standard field worker assignments
 */
export interface FetchStandardFieldWorkerAssignmentsArgs {
  first: number;
  after?: string;
  standardFieldLabel: string;
  standardFieldOption: string;
}

/**
 * Standard Field Worker Assignments slice state
 */
interface StandardFieldWorkerAssignmentsState {
  allItems: AssignmentItem[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  endCursor: string | null;
  lastFetchArgs: FetchStandardFieldWorkerAssignmentsArgs | null;
  standardFieldLabel: string | null;
  standardFieldOption: string | null;
}

/**
 * Initial state
 */
const initialState: StandardFieldWorkerAssignmentsState = {
  allItems: [],
  totalCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  endCursor: null,
  lastFetchArgs: null,
  standardFieldLabel: null,
  standardFieldOption: null,
};

/**
 * Async thunk for fetching standard field worker assignments
 */
export const fetchStandardFieldWorkerAssignments = createAsyncThunk<
  {
    items: AssignmentItem[];
    totalCount: number;
    hasMore: boolean;
    endCursor: string | null;
  },
  {
    loader: (args: FetchStandardFieldWorkerAssignmentsArgs) => Promise<{
      items: AssignmentItem[];
      totalCount: number;
      hasNextPage: boolean;
      endCursor: string | null;
    }>;
    args: FetchStandardFieldWorkerAssignmentsArgs;
  },
  { rejectValue: string }
>(
  'standardFieldWorkerAssignments/fetchStandardFieldWorkerAssignments',
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
        error?.message || 'Failed to fetch standard field worker assignments',
      );
    }
  },
);

/**
 * Standard Field Worker Assignments slice
 */
const standardFieldWorkerAssignmentsSlice = createSlice({
  name: 'standardFieldWorkerAssignments',
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

    resetStandardFieldWorkerAssignmentsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStandardFieldWorkerAssignments.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastFetchArgs = action.meta.arg.args;

        if (
          state.standardFieldLabel !==
            action.meta.arg.args.standardFieldLabel ||
          state.standardFieldOption !== action.meta.arg.args.standardFieldOption
        ) {
          state.allItems = [];
          state.totalCount = 0;
          state.hasMore = true;
          state.endCursor = null;
          state.standardFieldLabel = action.meta.arg.args.standardFieldLabel;
          state.standardFieldOption = action.meta.arg.args.standardFieldOption;
        }
      })
      .addCase(
        fetchStandardFieldWorkerAssignments.fulfilled,
        (state, action) => {
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
        },
      )
      .addCase(
        fetchStandardFieldWorkerAssignments.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            action.payload ||
            'Failed to fetch standard field worker assignments';
        },
      );
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
  resetStandardFieldWorkerAssignmentsState,
} = standardFieldWorkerAssignmentsSlice.actions;

export const selectStandardFieldWorkerAssignmentsState = (state: RootState) =>
  state.standardFieldWorkerAssignments;

export const selectStandardFieldWorkerAssignmentsAllItems = (
  state: RootState,
) => state.standardFieldWorkerAssignments.allItems;

export const selectStandardFieldWorkerAssignmentsTotalCount = (
  state: RootState,
) => state.standardFieldWorkerAssignments.totalCount;

export const selectStandardFieldWorkerAssignmentsLoading = (state: RootState) =>
  state.standardFieldWorkerAssignments.loading;

export const selectStandardFieldWorkerAssignmentsError = (state: RootState) =>
  state.standardFieldWorkerAssignments.error;

export const selectStandardFieldWorkerAssignmentsHasMore = (state: RootState) =>
  state.standardFieldWorkerAssignments.hasMore;

export const selectStandardFieldWorkerAssignmentsEndCursor = (
  state: RootState,
) => state.standardFieldWorkerAssignments.endCursor;

export const selectStandardFieldWorkerAssignmentsStandardFieldLabel = (
  state: RootState,
) => state.standardFieldWorkerAssignments.standardFieldLabel;

export const selectStandardFieldWorkerAssignmentsStandardFieldOption = (
  state: RootState,
) => state.standardFieldWorkerAssignments.standardFieldOption;

export const selectStandardFieldWorkerAssignmentsCount = createSelector(
  [selectStandardFieldWorkerAssignmentsAllItems],
  (items) => items.length,
);

export const selectStandardFieldWorkerAssignmentsSelected = createSelector(
  [selectStandardFieldWorkerAssignmentsAllItems],
  (items) => items.filter((item) => item.isSelected),
);

export const selectStandardFieldWorkerAssignmentsPaginated = createSelector(
  [
    selectStandardFieldWorkerAssignmentsAllItems,
    (state: RootState, page: number) => page,
    (state: RootState, page: number, pageSize: number) => pageSize,
  ],
  (items, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  },
);

export default standardFieldWorkerAssignmentsSlice.reducer;
