import reducer, {
  setSearchText,
  setStatusFilter,
  setCustomerFilter,
  setSortOrder,
  setSearchProjectIds,
  clearSearchProjectIds,
  setDueDateRange,
  resetFilters,
  buildCacheKey,
} from 'src/js/widgets/timeProject/store/filtersSlice';
import {
  FiltersSliceState,
  WorkflowGlobalId,
} from 'src/js/widgets/timeProject/types';
import { PROJECT_SORT_ORDER } from 'src/js/widgets/timeProject/constants';
import {
  DueDateFilterType,
  DueDateRange,
} from 'src/js/widgets/timeProject/utils/dateFilterUtils';

describe('filtersSlice', () => {
  const initialState: FiltersSliceState = {
    searchText: '',
    statusFilter: '',
    customerFilter: '',
    sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
    searchProjectIds: null,
    dueDateRange: null,
  };

  it('should return initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setSearchText', () => {
    it('should update searchText', () => {
      const state = reducer(initialState, setSearchText('kitchen'));
      expect(state.searchText).toBe('kitchen');
    });

    it('should clear searchText with empty string', () => {
      const stateWithSearch: FiltersSliceState = {
        ...initialState,
        searchText: 'kitchen',
      };
      const state = reducer(stateWithSearch, setSearchText(''));
      expect(state.searchText).toBe('');
    });
  });

  describe('setStatusFilter', () => {
    it('should update statusFilter', () => {
      const state = reducer(initialState, setStatusFilter('IN_PROGRESS'));
      expect(state.statusFilter).toBe('IN_PROGRESS');
    });
  });

  describe('setCustomerFilter', () => {
    it('should update customerFilter', () => {
      const state = reducer(initialState, setCustomerFilter('cust-1'));
      expect(state.customerFilter).toBe('cust-1');
    });
  });

  describe('setSortOrder', () => {
    it('should update sortOrder to NAME_DESC', () => {
      const state = reducer(
        initialState,
        setSortOrder(PROJECT_SORT_ORDER.NAME_DESC),
      );
      expect(state.sortOrder).toBe(PROJECT_SORT_ORDER.NAME_DESC);
    });

    it('should toggle sortOrder back to NAME_ASC', () => {
      const descState: FiltersSliceState = {
        ...initialState,
        sortOrder: PROJECT_SORT_ORDER.NAME_DESC,
      };
      const state = reducer(
        descState,
        setSortOrder(PROJECT_SORT_ORDER.NAME_ASC),
      );
      expect(state.sortOrder).toBe(PROJECT_SORT_ORDER.NAME_ASC);
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to initial state', () => {
      const dirtyState: FiltersSliceState = {
        searchText: 'test',
        statusFilter: 'COMPLETED',
        customerFilter: 'cust-1',
        sortOrder: PROJECT_SORT_ORDER.NAME_DESC,
        searchProjectIds: null,
        dueDateRange: {
          filterType: DueDateFilterType.TODAY,
          fromDate: '2026-07-01',
          toDate: '2026-07-01',
        },
      };
      const state = reducer(dirtyState, resetFilters());
      expect(state).toEqual(initialState);
    });
  });

  describe('setSearchProjectIds', () => {
    it('should set searchProjectIds to the provided array', () => {
      const state = reducer(
        initialState,
        setSearchProjectIds(['id-1', 'id-2'] as WorkflowGlobalId[]),
      );
      expect(state.searchProjectIds).toEqual(['id-1', 'id-2']);
    });

    it('should replace an existing searchProjectIds value', () => {
      const existing: FiltersSliceState = {
        ...initialState,
        searchProjectIds: ['old-id'] as WorkflowGlobalId[],
      };
      const state = reducer(
        existing,
        setSearchProjectIds(['new-id-1', 'new-id-2'] as WorkflowGlobalId[]),
      );
      expect(state.searchProjectIds).toEqual(['new-id-1', 'new-id-2']);
    });

    it('should accept an empty array', () => {
      const state = reducer(initialState, setSearchProjectIds([]));
      expect(state.searchProjectIds).toEqual([]);
    });
  });

  describe('clearSearchProjectIds', () => {
    it('should reset searchProjectIds to null', () => {
      const withIds: FiltersSliceState = {
        ...initialState,
        searchProjectIds: ['id-1', 'id-2'] as WorkflowGlobalId[],
      };
      const state = reducer(withIds, clearSearchProjectIds());
      expect(state.searchProjectIds).toBeNull();
    });

    it('should be a no-op when searchProjectIds is already null', () => {
      const state = reducer(initialState, clearSearchProjectIds());
      expect(state.searchProjectIds).toBeNull();
    });
  });

  describe('setDueDateRange', () => {
    it('should set dueDateRange', () => {
      const range: DueDateRange = {
        filterType: DueDateFilterType.TODAY,
        fromDate: '2026-07-01',
        toDate: '2026-07-01',
      };
      const state = reducer(initialState, setDueDateRange(range));
      expect(state.dueDateRange).toEqual(range);
    });

    it('should clear dueDateRange when null is dispatched', () => {
      const stateWithRange: FiltersSliceState = {
        ...initialState,
        dueDateRange: {
          filterType: DueDateFilterType.TODAY,
          fromDate: '2026-07-01',
          toDate: '2026-07-01',
        },
      };
      const state = reducer(stateWithRange, setDueDateRange(null));
      expect(state.dueDateRange).toBeNull();
    });
  });

  describe('buildCacheKey', () => {
    it('should return ALL when no filters active', () => {
      expect(buildCacheKey(initialState)).toBe('ALL');
    });

    it('should include status filter', () => {
      expect(
        buildCacheKey({
          searchText: '',
          statusFilter: 'IN_PROGRESS',
          customerFilter: '',
          sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
          searchProjectIds: null,
          dueDateRange: null,
        }),
      ).toBe('s=IN_PROGRESS|c=|q=|i=|o=NAME_ASC|d=');
    });

    it('should include customer filter', () => {
      expect(
        buildCacheKey({
          searchText: '',
          statusFilter: '',
          customerFilter: 'cust-1',
          sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
          searchProjectIds: null,
          dueDateRange: null,
        }),
      ).toBe('s=|c=cust-1|q=|i=|o=NAME_ASC|d=');
    });

    it('should combine status and customer', () => {
      expect(
        buildCacheKey({
          searchText: '',
          statusFilter: 'COMPLETE',
          customerFilter: 'cust-1',
          sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
          searchProjectIds: null,
          dueDateRange: null,
        }),
      ).toBe('s=COMPLETE|c=cust-1|q=|i=|o=NAME_ASC|d=');
    });

    it('should include search text trimmed', () => {
      expect(
        buildCacheKey({
          searchText: '  kitchen  ',
          statusFilter: '',
          customerFilter: '',
          sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
          searchProjectIds: null,
          dueDateRange: null,
        }),
      ).toBe('s=|c=|q=kitchen|i=|o=NAME_ASC|d=');
    });

    it('should combine all filters', () => {
      expect(
        buildCacheKey({
          searchText: 'test',
          statusFilter: 'OPEN',
          customerFilter: 'c1',
          sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
          searchProjectIds: null,
          dueDateRange: null,
        }),
      ).toBe('s=OPEN|c=c1|q=test|i=|o=NAME_ASC|d=');
    });

    it('should include sort order when set to NAME_DESC even without other filters', () => {
      expect(
        buildCacheKey({
          searchText: '',
          statusFilter: '',
          customerFilter: '',
          sortOrder: PROJECT_SORT_ORDER.NAME_DESC,
          searchProjectIds: null,
          dueDateRange: null,
        }),
      ).toBe('s=|c=|q=|i=|o=NAME_DESC|d=');
    });

    it('should produce distinct keys for values containing underscores', () => {
      const key1 = buildCacheKey({
        searchText: '',
        statusFilter: 'a_b',
        customerFilter: 'c',
        sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
        searchProjectIds: null,
        dueDateRange: null,
      });
      const key2 = buildCacheKey({
        searchText: '',
        statusFilter: 'a',
        customerFilter: 'b_c',
        sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
        searchProjectIds: null,
        dueDateRange: null,
      });
      expect(key1).not.toBe(key2);
    });

    it('should include searchProjectIds in the cache key when populated', () => {
      expect(
        buildCacheKey({
          searchText: '',
          statusFilter: '',
          customerFilter: '',
          sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
          searchProjectIds: ['101', '202'] as WorkflowGlobalId[],
          dueDateRange: null,
        }),
      ).toBe('s=|c=|q=|i=101,202|o=NAME_ASC|d=');
    });

    it('should produce a different key for different searchProjectIds arrays', () => {
      const key1 = buildCacheKey({
        searchText: '',
        statusFilter: '',
        customerFilter: '',
        sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
        searchProjectIds: ['101'] as WorkflowGlobalId[],
        dueDateRange: null,
      });
      const key2 = buildCacheKey({
        searchText: '',
        statusFilter: '',
        customerFilter: '',
        sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
        searchProjectIds: ['101', '202'] as WorkflowGlobalId[],
        dueDateRange: null,
      });
      expect(key1).not.toBe(key2);
    });

    it('should include searchProjectIds alongside other active filters', () => {
      expect(
        buildCacheKey({
          searchText: 'kitchen',
          statusFilter: 'IN_PROGRESS',
          customerFilter: 'cust-1',
          sortOrder: PROJECT_SORT_ORDER.NAME_DESC,
          searchProjectIds: ['id-1', 'id-2'] as WorkflowGlobalId[],
          dueDateRange: null,
        }),
      ).toBe('s=IN_PROGRESS|c=cust-1|q=kitchen|i=id-1,id-2|o=NAME_DESC|d=');
    });

    it('should include dueDateRange filterType and dates in the cache key', () => {
      expect(
        buildCacheKey({
          searchText: '',
          statusFilter: '',
          customerFilter: '',
          sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
          searchProjectIds: null,
          dueDateRange: {
            filterType: DueDateFilterType.TODAY,
            fromDate: '2026-07-01',
            toDate: '2026-07-01',
          },
        }),
      ).toBe('s=|c=|q=|i=|o=NAME_ASC|d=TODAY:2026-07-01:2026-07-01');
    });

    it('produces different keys for same date range with different filterType', () => {
      const key1 = buildCacheKey({
        ...initialState,
        dueDateRange: {
          filterType: DueDateFilterType.TODAY,
          fromDate: '2026-07-01',
          toDate: '2026-07-01',
        },
      });
      const key2 = buildCacheKey({
        ...initialState,
        dueDateRange: {
          filterType: DueDateFilterType.CUSTOM_RANGE,
          fromDate: '2026-07-01',
          toDate: '2026-07-01',
        },
      });
      expect(key1).not.toBe(key2);
    });

    it('should return ALL when dueDateRange is null and all other filters are default', () => {
      expect(buildCacheKey(initialState)).toBe('ALL');
    });

    it('should produce different keys for different date ranges', () => {
      const key1 = buildCacheKey({
        ...initialState,
        dueDateRange: {
          filterType: DueDateFilterType.TODAY,
          fromDate: '2026-07-01',
          toDate: '2026-07-01',
        },
      });
      const key2 = buildCacheKey({
        ...initialState,
        dueDateRange: {
          filterType: DueDateFilterType.THIS_WEEK,
          fromDate: '2026-06-29',
          toDate: '2026-07-05',
        },
      });
      expect(key1).not.toBe(key2);
    });
  });
});
