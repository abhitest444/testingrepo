import reducer, {
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
  clearEstimates,
  setProjectRefs,
  clearProjectRefs,
  setProjectParents,
  clearProjectParents,
  invalidateCache,
  backfillCustomerNames,
} from 'src/js/widgets/timeProject/store/projectsSlice';
import {
  TimeProjectRow,
  ProjectsSliceState,
} from 'src/js/widgets/timeProject/types';
import { DEFAULT_PAGE_SIZE } from 'src/js/widgets/timeProject/constants';

const mockRow = (overrides: Partial<TimeProjectRow> = {}): TimeProjectRow => ({
  rowIndex: 0,
  uniqueId: 'proj-1',
  projectId: 'proj-1',
  projectName: 'Test Project',
  customerId: 'cust-1',
  customerName: 'Test Customer',
  status: 'IN_PROGRESS',
  deadline: '2026-03-01',
  deadlineLabel: '2 days left',
  budget: '80h',
  budgetHoursTotal: 80,
  budgetHoursRemaining: 40,
  startDate: '2026-01-01',
  completedDate: '',
  active: true,
  description: '',
  customer: {
    id: 'cust-1',
    companyId: 'comp-1',
    fullName: 'Test Customer',
    firstName: 'Test',
    lastName: 'Customer',
    displayName: 'Test Customer',
  },
  ...overrides,
});

describe('projectsSlice', () => {
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

  it('should return initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setAllProjects', () => {
    it('should set rows, filteredRows, totalCount, and reset page to 1', () => {
      const rows = [
        mockRow(),
        mockRow({ rowIndex: 1, uniqueId: 'proj-2', projectId: 'proj-2' }),
      ];
      const state = reducer(
        initialState,
        setAllProjects({
          rows,
          totalCount: 2,
          hasNextPage: false,
          endCursor: null,
        }),
      );

      expect(state.rows).toHaveLength(2);
      expect(state.filteredRows).toHaveLength(2);
      expect(state.pagination.totalCount).toBe(2);
      expect(state.pagination.page).toBe(1);
    });

    it('should extract unique customers from rows using customerId', () => {
      const rows = [
        mockRow({ customerId: 'cust-1', customerName: 'Alpha' }),
        mockRow({
          rowIndex: 1,
          uniqueId: 'p2',
          projectId: 'p2',
          customerId: 'cust-2',
          customerName: 'Beta',
        }),
        mockRow({
          rowIndex: 2,
          uniqueId: 'p3',
          projectId: 'p3',
          customerId: 'cust-1',
          customerName: 'Alpha',
        }),
      ];
      const state = reducer(
        initialState,
        setAllProjects({
          rows,
          totalCount: 3,
          hasNextPage: false,
          endCursor: null,
        }),
      );

      expect(state.uniqueCustomers).toHaveLength(2);
      expect(state.uniqueCustomers[0]).toEqual({
        customerId: 'cust-1',
        displayName: 'Alpha',
      });
      expect(state.uniqueCustomers[1]).toEqual({
        customerId: 'cust-2',
        displayName: 'Beta',
      });
    });
  });

  describe('setFilteredResults', () => {
    it('should set filteredRows and cache results', () => {
      const rows = [mockRow()];
      const state = reducer(
        initialState,
        setFilteredResults({
          rows,
          totalCount: 1,
          hasNextPage: false,
          endCursor: null,
          cacheKey: 'IN_PROGRESS',
        }),
      );

      expect(state.filteredRows).toHaveLength(1);
      expect(state.cachedResults.IN_PROGRESS).toBeDefined();
      expect(state.cachedResults.IN_PROGRESS.rows).toHaveLength(1);
    });
  });

  describe('restoreFromCache', () => {
    it('should restore filteredRows from cache', () => {
      const cachedRow = mockRow({ projectName: 'Cached Project' });
      const stateWithCache: ProjectsSliceState = {
        ...initialState,
        cachedResults: {
          IN_PROGRESS: {
            rows: [cachedRow],
            totalCount: 1,
            hasNextPage: false,
            endCursor: null,
          },
        },
      };

      const state = reducer(
        stateWithCache,
        restoreFromCache({ cacheKey: 'IN_PROGRESS' }),
      );

      expect(state.filteredRows).toHaveLength(1);
      expect(state.filteredRows[0].projectName).toBe('Cached Project');
    });

    it('should not change state for missing cache key', () => {
      const state = reducer(
        initialState,
        restoreFromCache({ cacheKey: 'MISSING' }),
      );
      expect(state.filteredRows).toEqual([]);
    });
  });

  describe('resetToAllProjects', () => {
    it('should reset filteredRows to all rows', () => {
      const allRows = [
        mockRow(),
        mockRow({ rowIndex: 1, uniqueId: 'p2', projectId: 'p2' }),
      ];
      const stateWithFilter: ProjectsSliceState = {
        ...initialState,
        rows: allRows,
        filteredRows: [allRows[0]],
      };

      const state = reducer(stateWithFilter, resetToAllProjects());
      expect(state.filteredRows).toHaveLength(2);
      expect(state.pagination.totalCount).toBe(2);
    });
  });

  describe('setPageResults', () => {
    it('should replace filteredRows and set page without touching cache', () => {
      const pageRows = [mockRow({ projectName: 'Page 2 Project' })];
      const stateWithCache: ProjectsSliceState = {
        ...initialState,
        cachedResults: {
          'some-key': {
            rows: [mockRow()],
            totalCount: 10,
            hasNextPage: true,
            endCursor: 'abc',
          },
        },
      };

      const state = reducer(
        stateWithCache,
        setPageResults({
          rows: pageRows,
          totalCount: 10,
          hasNextPage: false,
          endCursor: 'cursor-2',
          page: 2,
        }),
      );

      expect(state.filteredRows).toHaveLength(1);
      expect(state.filteredRows[0].projectName).toBe('Page 2 Project');
      expect(state.pagination.page).toBe(2);
      expect(state.pagination.totalCount).toBe(10);
      expect(state.pagination.hasNextPage).toBe(false);
      expect(state.pagination.endCursor).toBe('cursor-2');
      expect(state.cachedResults).toEqual(stateWithCache.cachedResults);
    });
  });

  describe('updateProjectBudget', () => {
    it('should update budget for matching project', () => {
      const stateWithRows: ProjectsSliceState = {
        ...initialState,
        rows: [mockRow({ projectId: 'proj-1', budget: '–' })],
      };
      const state = reducer(
        stateWithRows,
        updateProjectBudget({ projectId: 'proj-1', budget: '50%' }),
      );

      expect(state.rows[0].budget).toBe('50%');
    });

    it('should not modify state when projectId does not match', () => {
      const stateWithRows: ProjectsSliceState = {
        ...initialState,
        rows: [mockRow({ projectId: 'proj-1', budget: '–' })],
      };
      const state = reducer(
        stateWithRows,
        updateProjectBudget({ projectId: 'nonexistent', budget: '50%' }),
      );

      expect(state.rows[0].budget).toBe('–');
    });
  });

  describe('setPage', () => {
    it('should update page number', () => {
      const state = reducer(initialState, setPage(5));
      expect(state.pagination.page).toBe(5);
    });
  });

  describe('setPageSize', () => {
    it('should update pageSize and reset page to 1', () => {
      const stateOnPage3: ProjectsSliceState = {
        ...initialState,
        pagination: {
          page: 3,
          pageSize: DEFAULT_PAGE_SIZE,
          totalCount: 50,
          hasNextPage: false,
          endCursor: null,
        },
      };
      const state = reducer(stateOnPage3, setPageSize(25));

      expect(state.pagination.pageSize).toBe(25);
      expect(state.pagination.page).toBe(1);
    });
  });

  describe('setPagination', () => {
    it('should replace the entire pagination object', () => {
      const newPagination = {
        page: 2,
        pageSize: 20,
        totalCount: 100,
        hasNextPage: false,
        endCursor: null,
      };
      const state = reducer(initialState, setPagination(newPagination));

      expect(state.pagination).toEqual(newPagination);
    });
  });

  describe('clearProjects', () => {
    it('should reset rows, filteredRows, pagination, cache, and customers', () => {
      const stateWithData: ProjectsSliceState = {
        rows: [mockRow()],
        filteredRows: [mockRow()],
        pagination: {
          page: 3,
          pageSize: 25,
          totalCount: 50,
          hasNextPage: true,
          endCursor: 'xyz',
        },
        cachedResults: {
          test: {
            rows: [],
            totalCount: 0,
            hasNextPage: false,
            endCursor: null,
          },
        },
        uniqueCustomers: [{ customerId: 'c1', displayName: 'C' }],
        estimatesMap: {
          'proj-1': {
            budgetHoursTotal: 20,
            budgetHoursRemaining: 10,
            elapsedSeconds: 36000,
            totalEstimatedSeconds: 72000,
            projectEstimateType: 'TOTAL_HOURS',
          },
        },
        estimatesLoading: false,
        estimatesError: null,
        projectRefs: {},
        projectParents: {},
      };
      const state = reducer(stateWithData, clearProjects());

      expect(state.rows).toEqual([]);
      expect(state.filteredRows).toEqual([]);
      expect(state.cachedResults).toEqual({});
      expect(state.uniqueCustomers).toEqual([]);
      expect(state.pagination).toEqual(initialState.pagination);
    });
  });

  describe('setEstimatesMap', () => {
    it('should merge estimates into the map', () => {
      const state = reducer(
        initialState,
        setEstimatesMap({
          'proj-1': {
            budgetHoursTotal: 20,
            budgetHoursRemaining: 10,
            elapsedSeconds: 36000,
            totalEstimatedSeconds: 72000,
            projectEstimateType: 'TOTAL_HOURS',
          },
        }),
      );
      expect(state.estimatesMap['proj-1']).toEqual({
        budgetHoursTotal: 20,
        budgetHoursRemaining: 10,
        elapsedSeconds: 36000,
        totalEstimatedSeconds: 72000,
        projectEstimateType: 'TOTAL_HOURS',
      });
    });

    it('should merge without overwriting existing entries', () => {
      const stateWithEstimates: ProjectsSliceState = {
        ...initialState,
        estimatesMap: {
          'proj-1': {
            budgetHoursTotal: 20,
            budgetHoursRemaining: 10,
            elapsedSeconds: 36000,
            totalEstimatedSeconds: 72000,
            projectEstimateType: 'TOTAL_HOURS',
          },
        },
      };
      const state = reducer(
        stateWithEstimates,
        setEstimatesMap({
          'proj-2': {
            budgetHoursTotal: 40,
            budgetHoursRemaining: 30,
            elapsedSeconds: 36000,
            totalEstimatedSeconds: 144000,
            projectEstimateType: 'TOTAL_HOURS',
          },
        }),
      );
      expect(Object.keys(state.estimatesMap)).toHaveLength(2);
      expect(state.estimatesMap['proj-1'].budgetHoursTotal).toBe(20);
      expect(state.estimatesMap['proj-2'].budgetHoursTotal).toBe(40);
    });
  });

  describe('setEstimatesLoading', () => {
    it('should set estimatesLoading to true', () => {
      const state = reducer(initialState, setEstimatesLoading(true));
      expect(state.estimatesLoading).toBe(true);
    });

    it('should set estimatesLoading to false', () => {
      const loadingState: ProjectsSliceState = {
        ...initialState,
        estimatesLoading: true,
      };
      const state = reducer(loadingState, setEstimatesLoading(false));
      expect(state.estimatesLoading).toBe(false);
    });
  });

  describe('clearEstimates', () => {
    it('should clear the estimates map', () => {
      const stateWithEstimates: ProjectsSliceState = {
        ...initialState,
        estimatesMap: {
          'proj-1': {
            budgetHoursTotal: 20,
            budgetHoursRemaining: 10,
            elapsedSeconds: 36000,
            totalEstimatedSeconds: 72000,
            projectEstimateType: 'TOTAL_HOURS',
          },
        },
      };
      const state = reducer(stateWithEstimates, clearEstimates());
      expect(state.estimatesMap).toEqual({});
    });
  });

  describe('setProjectRefs', () => {
    it('should fully replace the projectRefs map (no merge)', () => {
      // The contacts lookup always replaces the whole map for the
      // current page — never merges — so a stale entry from a prior
      // filter context can't leak through.
      const stateWithOldRefs: ProjectsSliceState = {
        ...initialState,
        projectRefs: {
          'old-proj': { projectId: 'old-proj', customerId: 'old-cust' },
        },
      };
      const newRefs = {
        'new-proj-1': { projectId: 'new-proj-1', customerId: 'cust-A' },
        'new-proj-2': { projectId: 'new-proj-2', customerId: 'cust-B' },
      };
      const state = reducer(stateWithOldRefs, setProjectRefs(newRefs));
      expect(state.projectRefs).toEqual(newRefs);
      expect(state.projectRefs['old-proj']).toBeUndefined();
    });

    it('should accept an empty map and clear any prior entries', () => {
      const stateWithOldRefs: ProjectsSliceState = {
        ...initialState,
        projectRefs: {
          'old-proj': { projectId: 'old-proj', customerId: 'old-cust' },
        },
      };
      const state = reducer(stateWithOldRefs, setProjectRefs({}));
      expect(state.projectRefs).toEqual({});
    });
  });

  describe('clearProjectRefs', () => {
    it('should reset projectRefs back to empty', () => {
      const stateWithRefs: ProjectsSliceState = {
        ...initialState,
        projectRefs: {
          'proj-1': { projectId: 'proj-1', customerId: 'cust-A' },
        },
      };
      const state = reducer(stateWithRefs, clearProjectRefs());
      expect(state.projectRefs).toEqual({});
    });
  });

  describe('setProjectParents', () => {
    it('should fully replace the projectParents map (no merge)', () => {
      // The contacts lookup writes `projectParents` in lockstep with
      // `projectRefs` — both fully replaced per page so a stale parent
      // entry from the prior filter context can't leak into a fresh
      // assignment-save payload.
      const stateWithOldParents: ProjectsSliceState = {
        ...initialState,
        projectParents: { 'old-proj': 'old-parent' },
      };
      const state = reducer(
        stateWithOldParents,
        setProjectParents({ 'new-proj': 'parent-A' }),
      );
      expect(state.projectParents).toEqual({ 'new-proj': 'parent-A' });
      expect(state.projectParents['old-proj']).toBeUndefined();
    });

    it('should accept an empty map and clear any prior entries', () => {
      const stateWithOldParents: ProjectsSliceState = {
        ...initialState,
        projectParents: { 'old-proj': 'old-parent' },
      };
      const state = reducer(stateWithOldParents, setProjectParents({}));
      expect(state.projectParents).toEqual({});
    });
  });

  describe('clearProjectParents', () => {
    it('should reset projectParents back to empty', () => {
      const stateWithParents: ProjectsSliceState = {
        ...initialState,
        projectParents: { 'proj-1': 'parent-A' },
      };
      const state = reducer(stateWithParents, clearProjectParents());
      expect(state.projectParents).toEqual({});
    });
  });

  describe('invalidateCache', () => {
    it('should clear all cached results', () => {
      const stateWithCache: ProjectsSliceState = {
        ...initialState,
        cachedResults: {
          key1: {
            rows: [],
            totalCount: 0,
            hasNextPage: false,
            endCursor: null,
          },
          key2: {
            rows: [],
            totalCount: 0,
            hasNextPage: false,
            endCursor: null,
          },
        },
      };
      const state = reducer(stateWithCache, invalidateCache());
      expect(state.cachedResults).toEqual({});
    });
  });

  describe('backfillCustomerNames', () => {
    it('patches customerName on matching rows in both rows and filteredRows', () => {
      const row1 = mockRow({
        projectId: 'proj-1',
        customerName: '',
      });
      const row2 = mockRow({
        rowIndex: 1,
        uniqueId: 'proj-2',
        projectId: 'proj-2',
        customerName: '',
      });
      const stateWithRows: ProjectsSliceState = {
        ...initialState,
        rows: [row1, row2],
        filteredRows: [row1, row2],
      };

      const state = reducer(
        stateWithRows,
        backfillCustomerNames({ 'proj-1': 'Acme Corp', 'proj-2': 'Beta LLC' }),
      );

      expect(state.rows[0].customerName).toBe('Acme Corp');
      expect(state.rows[1].customerName).toBe('Beta LLC');
      expect(state.filteredRows[0].customerName).toBe('Acme Corp');
      expect(state.filteredRows[1].customerName).toBe('Beta LLC');
    });

    it('does not touch rows whose projectId is absent from the nameMap', () => {
      const row1 = mockRow({ projectId: 'proj-1', customerName: 'Original' });
      const row2 = mockRow({
        rowIndex: 1,
        uniqueId: 'proj-2',
        projectId: 'proj-2',
        customerName: 'Keep This',
      });
      const stateWithRows: ProjectsSliceState = {
        ...initialState,
        rows: [row1, row2],
        filteredRows: [row1, row2],
      };

      const state = reducer(
        stateWithRows,
        backfillCustomerNames({ 'proj-1': 'Acme Corp' }),
      );

      expect(state.rows[0].customerName).toBe('Acme Corp');
      // proj-2 not in map — unchanged
      expect(state.rows[1].customerName).toBe('Keep This');
    });

    it('overwrites an existing customerName when the nameMap has a new value', () => {
      const row = mockRow({ projectId: 'proj-1', customerName: 'Old Name' });
      const stateWithRows: ProjectsSliceState = {
        ...initialState,
        rows: [row],
        filteredRows: [row],
      };

      const state = reducer(
        stateWithRows,
        backfillCustomerNames({ 'proj-1': 'New Name' }),
      );

      expect(state.rows[0].customerName).toBe('New Name');
    });

    it('rebuilds uniqueCustomers from filteredRows after patching names', () => {
      // Two rows sharing a customer — after backfill the dropdown should
      // show exactly one entry under the new resolved name.
      const row1 = mockRow({
        projectId: 'proj-1',
        customerId: 'cust-A',
        customerName: '',
      });
      const row2 = mockRow({
        rowIndex: 1,
        uniqueId: 'proj-2',
        projectId: 'proj-2',
        customerId: 'cust-A',
        customerName: '',
      });
      const stateWithRows: ProjectsSliceState = {
        ...initialState,
        rows: [row1, row2],
        filteredRows: [row1, row2],
      };

      const state = reducer(
        stateWithRows,
        backfillCustomerNames({
          'proj-1': 'Resolved Corp',
          'proj-2': 'Resolved Corp',
        }),
      );

      // extractUniqueCustomers deduplicates by customerId
      expect(state.uniqueCustomers).toHaveLength(1);
      expect(state.uniqueCustomers[0]).toEqual({
        customerId: 'cust-A',
        displayName: 'Resolved Corp',
      });
    });

    it('rebuilds uniqueCustomers sorted alphabetically after patching', () => {
      const row1 = mockRow({
        projectId: 'proj-1',
        customerId: 'cust-Z',
        customerName: '',
      });
      const row2 = mockRow({
        rowIndex: 1,
        uniqueId: 'proj-2',
        projectId: 'proj-2',
        customerId: 'cust-A',
        customerName: '',
      });
      const stateWithRows: ProjectsSliceState = {
        ...initialState,
        rows: [row1, row2],
        filteredRows: [row1, row2],
      };

      const state = reducer(
        stateWithRows,
        backfillCustomerNames({ 'proj-1': 'Zeta Inc', 'proj-2': 'Alpha Co' }),
      );

      expect(state.uniqueCustomers[0].displayName).toBe('Alpha Co');
      expect(state.uniqueCustomers[1].displayName).toBe('Zeta Inc');
    });

    it('handles an empty nameMap gracefully without crashing', () => {
      const row = mockRow({ projectId: 'proj-1', customerName: 'Existing' });
      const stateWithRows: ProjectsSliceState = {
        ...initialState,
        rows: [row],
        filteredRows: [row],
      };

      expect(() =>
        reducer(stateWithRows, backfillCustomerNames({})),
      ).not.toThrow();

      const state = reducer(stateWithRows, backfillCustomerNames({}));
      expect(state.rows[0].customerName).toBe('Existing');
    });

    it('handles empty rows and filteredRows gracefully', () => {
      const state = reducer(
        initialState,
        backfillCustomerNames({ 'proj-1': 'Acme' }),
      );
      expect(state.rows).toEqual([]);
      expect(state.filteredRows).toEqual([]);
      expect(state.uniqueCustomers).toEqual([]);
    });
  });
});
