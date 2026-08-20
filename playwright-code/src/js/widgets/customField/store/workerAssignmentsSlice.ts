import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';
import { AssignmentItem } from 'src/js/widgets/common/AssignmentDrawer/types';
import type { RootState } from './index';

export const WORKER_ASSIGNMENT_PAGE_SIZE = 100;

export interface FetchWorkerAssignmentsArgs {
  first: number;
  after?: string;
  customFieldOptionId: string;
}

interface WorkerAssignmentsState {
  allItems: AssignmentItem[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  endCursor: string | null;
  lastFetchArgs: FetchWorkerAssignmentsArgs | null;
  customFieldOptionId: string | null;
}

const initialState: WorkerAssignmentsState = {
  allItems: [],
  totalCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  endCursor: null,
  lastFetchArgs: null,
  customFieldOptionId: null,
};

export const fetchWorkerAssignments = createAsyncThunk<
  {
    items: AssignmentItem[];
    totalCount: number;
    hasMore: boolean;
    endCursor: string | null;
  },
  {
    loader: (args: FetchWorkerAssignmentsArgs) => Promise<{
      items: AssignmentItem[];
      totalCount: number;
      hasNextPage: boolean;
      endCursor: string | null;
    }>;
    args: FetchWorkerAssignmentsArgs;
  },
  { rejectValue: string }
>(
  'workerAssignments/fetchWorkerAssignments',
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
        error?.message || 'Failed to fetch worker assignments',
      );
    }
  },
);

const workerAssignmentsSlice = createSlice({
  name: 'workerAssignments',
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

    resetWorkerAssignmentsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkerAssignments.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastFetchArgs = action.meta.arg.args;

        if (
          state.customFieldOptionId !== action.meta.arg.args.customFieldOptionId
        ) {
          state.allItems = [];
          state.totalCount = 0;
          state.hasMore = true;
          state.endCursor = null;
          state.customFieldOptionId = action.meta.arg.args.customFieldOptionId;
        }
      })
      .addCase(fetchWorkerAssignments.fulfilled, (state, action) => {
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
      .addCase(fetchWorkerAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch worker assignments';
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
  resetWorkerAssignmentsState,
} = workerAssignmentsSlice.actions;

export const selectWorkerAssignmentsState = (state: RootState) =>
  state.workerAssignments;

export const selectWorkerAssignmentsAllItems = (state: RootState) =>
  state.workerAssignments.allItems;

export const selectWorkerAssignmentsTotalCount = (state: RootState) =>
  state.workerAssignments.totalCount;

export const selectWorkerAssignmentsLoading = (state: RootState) =>
  state.workerAssignments.loading;

export const selectWorkerAssignmentsError = (state: RootState) =>
  state.workerAssignments.error;

export const selectWorkerAssignmentsHasMore = (state: RootState) =>
  state.workerAssignments.hasMore;

export const selectWorkerAssignmentsEndCursor = (state: RootState) =>
  state.workerAssignments.endCursor;

export const selectWorkerAssignmentsCustomFieldOptionId = (state: RootState) =>
  state.workerAssignments.customFieldOptionId;

export const selectWorkerAssignmentsCount = createSelector(
  [selectWorkerAssignmentsAllItems],
  (items) => items.length,
);

export const selectWorkerAssignmentsSelected = createSelector(
  [selectWorkerAssignmentsAllItems],
  (items) => items.filter((item) => item.isSelected),
);

export const selectWorkerAssignmentsPaginated = createSelector(
  [
    selectWorkerAssignmentsAllItems,
    (state: RootState, page: number) => page,
    (state: RootState, page: number, pageSize: number) => pageSize,
  ],
  (items, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  },
);

export default workerAssignmentsSlice.reducer;
