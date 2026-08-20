import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  FiltersSliceState,
  TimeProjectSortOrder,
  WorkflowGlobalId,
  DueDateRange,
} from '../types';
import { PROJECT_SORT_ORDER } from '../constants';

const initialState: FiltersSliceState = {
  searchText: '',
  statusFilter: '',
  customerFilter: '',
  sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
  searchProjectIds: null,
  dueDateRange: null,
};

export const buildCacheKey = (filters: FiltersSliceState): string => {
  const s = filters.statusFilter || '';
  const c = filters.customerFilter || '';
  const q = filters.searchText.trim();
  const i = filters.searchProjectIds?.join(',') ?? '';
  const o = filters.sortOrder;
  const d = filters.dueDateRange
    ? `${filters.dueDateRange.filterType}:${filters.dueDateRange.fromDate}:${filters.dueDateRange.toDate}`
    : '';
  if (!s && !c && !q && !i && !d && o === PROJECT_SORT_ORDER.NAME_ASC)
    return 'ALL';
  return `s=${s}|c=${c}|q=${q}|i=${i}|o=${o}|d=${d}`;
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchText(state, action: PayloadAction<string>) {
      state.searchText = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
    },
    setCustomerFilter(state, action: PayloadAction<string>) {
      state.customerFilter = action.payload;
    },
    setSortOrder(state, action: PayloadAction<TimeProjectSortOrder>) {
      state.sortOrder = action.payload;
    },
    setSearchProjectIds(state, action: PayloadAction<WorkflowGlobalId[]>) {
      state.searchProjectIds = action.payload;
    },
    clearSearchProjectIds(state) {
      state.searchProjectIds = null;
    },
    setDueDateRange(state, action: PayloadAction<DueDateRange | null>) {
      state.dueDateRange = action.payload;
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const {
  setSearchText,
  setStatusFilter,
  setCustomerFilter,
  setSortOrder,
  setSearchProjectIds,
  clearSearchProjectIds,
  setDueDateRange,
  resetFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
