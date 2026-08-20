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
  customerId: string;
  projectId?: string;
}

interface CustomerWorkerAssignmentsState {
  allItems: AssignmentItem[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  endCursor: string | null;
  lastFetchArgs: FetchWorkerAssignmentsArgs | null;
  customerId: string | null;
  projectId: string | null;
}

const initialState: CustomerWorkerAssignmentsState = {
  allItems: [],
  totalCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  endCursor: null,
  lastFetchArgs: null,
  customerId: null,
  projectId: null,
};

export const fetchCustomerWorkerAssignments = createAsyncThunk<
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
  'customerWorkerAssignments/fetchCustomerWorkerAssignments',
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

const customerWorkerAssignmentsSlice = createSlice({
  name: 'customerWorkerAssignments',
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

    resetCustomerWorkerAssignmentsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerWorkerAssignments.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastFetchArgs = action.meta.arg.args;

        if (
          state.customerId !== action.meta.arg.args.customerId ||
          state.projectId !== action.meta.arg.args.projectId
        ) {
          state.allItems = [];
          state.totalCount = 0;
          state.hasMore = true;
          state.endCursor = null;
          state.customerId = action.meta.arg.args.customerId;
          state.projectId = action.meta.arg.args.projectId || null;
        }
      })
      .addCase(fetchCustomerWorkerAssignments.fulfilled, (state, action) => {
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
      .addCase(fetchCustomerWorkerAssignments.rejected, (state, action) => {
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
  resetCustomerWorkerAssignmentsState,
} = customerWorkerAssignmentsSlice.actions;

export const selectCustomerWorkerAssignmentsState = (state: RootState) =>
  state.customerWorkerAssignments;

export const selectCustomerWorkerAssignmentsAllItems = (state: RootState) =>
  state.customerWorkerAssignments.allItems;

export const selectCustomerWorkerAssignmentsTotalCount = (state: RootState) =>
  state.customerWorkerAssignments.totalCount;

export const selectCustomerWorkerAssignmentsLoading = (state: RootState) =>
  state.customerWorkerAssignments.loading;

export const selectCustomerWorkerAssignmentsError = (state: RootState) =>
  state.customerWorkerAssignments.error;

export const selectCustomerWorkerAssignmentsHasMore = (state: RootState) =>
  state.customerWorkerAssignments.hasMore;

export const selectCustomerWorkerAssignmentsEndCursor = (state: RootState) =>
  state.customerWorkerAssignments.endCursor;

export const selectCustomerWorkerAssignmentsCustomerId = (state: RootState) =>
  state.customerWorkerAssignments.customerId;

export const selectCustomerWorkerAssignmentsProjectId = (state: RootState) =>
  state.customerWorkerAssignments.projectId;

export const selectCustomerWorkerAssignmentsCount = createSelector(
  [selectCustomerWorkerAssignmentsAllItems],
  (items) => items.length,
);

export const selectCustomerWorkerAssignmentsSelected = createSelector(
  [selectCustomerWorkerAssignmentsAllItems],
  (items) => items.filter((item) => item.isSelected),
);

export const selectCustomerWorkerAssignmentsPaginated = createSelector(
  [
    selectCustomerWorkerAssignmentsAllItems,
    (state: RootState, page: number) => page,
    (state: RootState, page: number, pageSize: number) => pageSize,
  ],
  (items, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  },
);

export default customerWorkerAssignmentsSlice.reducer;
