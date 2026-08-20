import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ProjectsSliceState,
  ProjectsPaginationState,
  TimeProjectRow,
  CustomerOption,
  CachedFilterResult,
  ProjectEstimateData,
  ProjectRef,
} from '../types';
import { DEFAULT_PAGE_SIZE } from '../constants';

const initialState: ProjectsSliceState = {
  rows: [],
  filteredRows: [],
  pagination: {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    hasNextPage: false,
    endCursor: null,
  },
  cachedResults: {},
  uniqueCustomers: [],
  estimatesMap: {},
  estimatesLoading: false,
  estimatesError: null,
  projectRefs: {},
  projectParents: {},
};

const extractUniqueCustomers = (rows: TimeProjectRow[]): CustomerOption[] => {
  const seen = new Set<string>();
  const customers: CustomerOption[] = [];
  rows.forEach((row) => {
    if (row.customerId && row.customerName && !seen.has(row.customerId)) {
      seen.add(row.customerId);
      customers.push({
        customerId: row.customerId,
        displayName: row.customerName,
      });
    }
  });
  return customers.sort((a, b) => a.displayName.localeCompare(b.displayName));
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setAllProjects(
      state,
      action: PayloadAction<{
        rows: TimeProjectRow[];
        totalCount: number;
        hasNextPage: boolean;
        endCursor: string | null;
      }>,
    ) {
      state.rows = action.payload.rows;
      state.filteredRows = action.payload.rows;
      state.pagination.totalCount = action.payload.totalCount;
      state.pagination.hasNextPage = action.payload.hasNextPage;
      state.pagination.endCursor = action.payload.endCursor;
      state.pagination.page = 1;
      state.uniqueCustomers = extractUniqueCustomers(action.payload.rows);
    },
    setFilteredResults(
      state,
      action: PayloadAction<{
        rows: TimeProjectRow[];
        totalCount: number;
        hasNextPage: boolean;
        endCursor: string | null;
        cacheKey: string;
      }>,
    ) {
      state.filteredRows = action.payload.rows;
      state.pagination.totalCount = action.payload.totalCount;
      state.pagination.hasNextPage = action.payload.hasNextPage;
      state.pagination.endCursor = action.payload.endCursor;
      state.pagination.page = 1;
      state.cachedResults[action.payload.cacheKey] = {
        rows: action.payload.rows,
        totalCount: action.payload.totalCount,
        hasNextPage: action.payload.hasNextPage,
        endCursor: action.payload.endCursor,
      };
    },
    restoreFromCache(state, action: PayloadAction<{ cacheKey: string }>) {
      const cached = state.cachedResults[action.payload.cacheKey];
      if (cached) {
        state.filteredRows = cached.rows;
        state.pagination.totalCount = cached.totalCount;
        state.pagination.hasNextPage = cached.hasNextPage;
        state.pagination.endCursor = cached.endCursor;
        state.pagination.page = 1;
      }
    },
    resetToAllProjects(state) {
      state.filteredRows = state.rows;
      state.pagination.totalCount = state.rows.length;
      state.pagination.page = 1;
    },
    setPageResults(
      state,
      action: PayloadAction<{
        rows: TimeProjectRow[];
        totalCount: number;
        hasNextPage: boolean;
        endCursor: string | null;
        page: number;
      }>,
    ) {
      state.filteredRows = action.payload.rows;
      state.pagination.totalCount = action.payload.totalCount;
      state.pagination.hasNextPage = action.payload.hasNextPage;
      state.pagination.endCursor = action.payload.endCursor;
      state.pagination.page = action.payload.page;
    },
    updateProjectBudget(
      state,
      action: PayloadAction<{ projectId: string; budget: string }>,
    ) {
      const row = state.rows.find(
        (r) => r.projectId === action.payload.projectId,
      );
      if (row) {
        row.budget = action.payload.budget;
      }
    },
    setPage(state, action: PayloadAction<number>) {
      state.pagination.page = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pagination.pageSize = action.payload;
      state.pagination.page = 1;
    },
    setPagination(state, action: PayloadAction<ProjectsPaginationState>) {
      state.pagination = action.payload;
    },
    clearProjects(state) {
      state.rows = [];
      state.filteredRows = [];
      state.pagination = initialState.pagination;
      state.cachedResults = {};
      state.uniqueCustomers = [];
    },
    setEstimatesMap(
      state,
      action: PayloadAction<Record<string, ProjectEstimateData>>,
    ) {
      state.estimatesMap = { ...state.estimatesMap, ...action.payload };
    },
    setEstimatesLoading(state, action: PayloadAction<boolean>) {
      state.estimatesLoading = action.payload;
    },
    setEstimatesError(state, action: PayloadAction<string | null>) {
      state.estimatesError = action.payload;
    },
    clearEstimates(state) {
      state.estimatesMap = {};
      state.estimatesError = null;
    },
    /**
     * Replace the project-customer map for the current page of
     * results. Always a full replace (not a merge) — a fresh listing
     * fetch should not leak refs from the previous filter context.
     */
    setProjectRefs(state, action: PayloadAction<Record<string, ProjectRef>>) {
      state.projectRefs = action.payload;
    },
    clearProjectRefs(state) {
      state.projectRefs = {};
    },
    /**
     * Replace the projectId -> parent-customer-id map. Used solely by
     * the assignment-save flow to extend `timeAgainstList` with the
     * parent customer entry (the supergraph mutation expects the same
     * hierarchical shape the Customer Assignments widget produces).
     * Always a full replace — never merge — so a stale entry from the
     * previous filter context can't leak into a new save.
     */
    setProjectParents(state, action: PayloadAction<Record<string, string>>) {
      state.projectParents = action.payload;
    },
    clearProjectParents(state) {
      state.projectParents = {};
    },
    invalidateCache(state) {
      state.cachedResults = {};
    },
    /**
     * Backfills `customerName` on rows after the contacts lookup resolves.
     * Called by `useProjectCustomerLookup` once `dataAccessContacts` returns
     * `parent.displayName` / `parent.fullName` for each project contact.
     * Patches both `rows` and `filteredRows` so the data is consistent
     * regardless of which slice the table is currently reading from.
     * Rebuilds `uniqueCustomers` so the customer filter dropdown reflects
     * the newly resolved names.
     */
    backfillCustomerNames(
      state,
      action: PayloadAction<Record<string, string>>,
    ) {
      const nameMap = action.payload;
      const patch = (row: TimeProjectRow) => {
        const name = nameMap[row.projectId];
        if (name) row.customerName = name;
      };
      state.rows.forEach(patch);
      state.filteredRows.forEach(patch);
      state.uniqueCustomers = extractUniqueCustomers(state.filteredRows);
    },
  },
});

export const {
  setAllProjects,
  setFilteredResults,
  restoreFromCache,
  resetToAllProjects,
  setPageResults,
  updateProjectBudget,
  setPage,
  setPageSize,
  setPagination,
  clearProjects,
  setEstimatesMap,
  setEstimatesLoading,
  setEstimatesError,
  clearEstimates,
  setProjectRefs,
  clearProjectRefs,
  setProjectParents,
  clearProjectParents,
  invalidateCache,
  backfillCustomerNames,
} = projectsSlice.actions;

export default projectsSlice.reducer;
