import standardFieldOptionsSummaryReducer, {
  STANDARD_FIELD_OPTIONS_PAGE_SIZE,
  setLoading,
  setError,
  clearError,
  setInitialData,
  appendData,
  setPageBeforeSearch,
  resetStandardFieldOptionsSummaryState,
  selectStandardFieldOptionsSummaryState,
  selectStandardFieldOptionsSummaryAllItems,
  selectStandardFieldOptionsSummaryTotalWorkerCount,
  selectStandardFieldOptionsSummaryTotalCustomerCount,
  selectStandardFieldOptionsSummaryTotalOptionsCount,
  selectStandardFieldOptionsSummaryLoading,
  selectStandardFieldOptionsSummaryError,
  selectStandardFieldOptionsSummaryHasMore,
  selectStandardFieldOptionsSummaryStartCursor,
  selectStandardFieldOptionsSummaryEndCursor,
  selectStandardFieldOptionsSummaryPageBeforeSearch,
  selectStandardFieldOptionsSummaryCurrentFieldLabel,
  selectStandardFieldOptionsSummaryPaginated,
  StandardFieldOptionSummaryEdge,
} from 'src/js/widgets/timeTrackingSettings/store/standardFieldOptionsSummarySlice';

describe('standardFieldOptionsSummarySlice', () => {
  const initialState = {
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

  const mockSummaryEdges: StandardFieldOptionSummaryEdge[] = [
    {
      cursor: 'cursor-1',
      node: {
        id: 'opt-1',
        name: 'Option 1',
        standardFieldLabel: 'customer',
        customerAssignmentCount: 5,
        workerAssignmentCount: 10,
      },
    },
    {
      cursor: 'cursor-2',
      node: {
        id: 'opt-2',
        name: 'Option 2',
        standardFieldLabel: 'customer',
        customerAssignmentCount: 3,
        workerAssignmentCount: 7,
      },
    },
    {
      cursor: 'cursor-3',
      node: {
        id: 'opt-3',
        name: 'Option 3',
        standardFieldLabel: 'customer',
        customerAssignmentCount: 2,
        workerAssignmentCount: 4,
      },
    },
  ];

  it('should return the initial state', () => {
    expect(
      standardFieldOptionsSummaryReducer(undefined, { type: 'unknown' }),
    ).toEqual(initialState);
  });

  it('should export the correct page size constant', () => {
    expect(STANDARD_FIELD_OPTIONS_PAGE_SIZE).toBe(20);
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = standardFieldOptionsSummaryReducer(
        initialState,
        setLoading(true),
      );
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const stateWithLoading = { ...initialState, loading: true };
      const state = standardFieldOptionsSummaryReducer(
        stateWithLoading,
        setLoading(false),
      );
      expect(state.loading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const state = standardFieldOptionsSummaryReducer(
        initialState,
        setError('Test error'),
      );
      expect(state.error).toBe('Test error');
    });

    it('should replace existing error', () => {
      const stateWithError = { ...initialState, error: 'Old error' };
      const state = standardFieldOptionsSummaryReducer(
        stateWithError,
        setError('New error'),
      );
      expect(state.error).toBe('New error');
    });

    it('should set error to null', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const state = standardFieldOptionsSummaryReducer(
        stateWithError,
        setError(null),
      );
      expect(state.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const stateWithError = { ...initialState, error: 'Test error' };
      const state = standardFieldOptionsSummaryReducer(
        stateWithError,
        clearError(),
      );
      expect(state.error).toBeNull();
    });

    it('should not throw when clearing non-existent error', () => {
      const state = standardFieldOptionsSummaryReducer(
        initialState,
        clearError(),
      );
      expect(state.error).toBeNull();
    });
  });

  describe('setInitialData', () => {
    it('should set initial data', () => {
      const state = standardFieldOptionsSummaryReducer(
        initialState,
        setInitialData({
          edges: mockSummaryEdges,
          totalWorkerCount: 21,
          totalCustomerCount: 10,
          totalOptionsCount: 3,
          hasNextPage: true,
          startCursor: 'cursor-1',
          endCursor: 'cursor-3',
          fieldLabel: 'customer',
        }),
      );
      expect(state.allItems).toEqual(mockSummaryEdges);
      expect(state.totalWorkerCount).toBe(21);
      expect(state.totalCustomerCount).toBe(10);
      expect(state.totalOptionsCount).toBe(3);
      expect(state.hasMore).toBe(true);
      expect(state.startCursor).toBe('cursor-1');
      expect(state.endCursor).toBe('cursor-3');
      expect(state.currentFieldLabel).toBe('customer');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should clear loading and error states', () => {
      const stateWithLoadingAndError = {
        ...initialState,
        loading: true,
        error: 'Error',
      };
      const state = standardFieldOptionsSummaryReducer(
        stateWithLoadingAndError,
        setInitialData({
          edges: mockSummaryEdges,
          totalWorkerCount: 21,
          totalCustomerCount: 10,
          totalOptionsCount: 3,
          hasNextPage: false,
          startCursor: null,
          endCursor: null,
          fieldLabel: 'project',
        }),
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should replace existing data', () => {
      const stateWithData = {
        ...initialState,
        allItems: [mockSummaryEdges[0]],
        totalOptionsCount: 1,
      };
      const state = standardFieldOptionsSummaryReducer(
        stateWithData,
        setInitialData({
          edges: mockSummaryEdges,
          totalWorkerCount: 21,
          totalCustomerCount: 10,
          totalOptionsCount: 3,
          hasNextPage: true,
          startCursor: 'cursor-1',
          endCursor: 'cursor-3',
          fieldLabel: 'customer',
        }),
      );
      expect(state.allItems).toEqual(mockSummaryEdges);
      expect(state.totalOptionsCount).toBe(3);
    });

    it('should handle empty edges array', () => {
      const state = standardFieldOptionsSummaryReducer(
        initialState,
        setInitialData({
          edges: [],
          totalWorkerCount: 0,
          totalCustomerCount: 0,
          totalOptionsCount: 0,
          hasNextPage: false,
          startCursor: null,
          endCursor: null,
          fieldLabel: 'customer',
        }),
      );
      expect(state.allItems).toEqual([]);
      expect(state.totalOptionsCount).toBe(0);
      expect(state.hasMore).toBe(false);
    });
  });

  describe('appendData', () => {
    it('should append new items', () => {
      const stateWithItems = {
        ...initialState,
        allItems: [mockSummaryEdges[0]],
      };
      const newEdges = [mockSummaryEdges[1], mockSummaryEdges[2]];
      const state = standardFieldOptionsSummaryReducer(
        stateWithItems,
        appendData({
          edges: newEdges,
          hasNextPage: false,
          startCursor: 'cursor-2',
          endCursor: 'cursor-3',
        }),
      );
      expect(state.allItems.length).toBe(3);
      expect(state.allItems[0]).toEqual(mockSummaryEdges[0]);
      expect(state.allItems[1]).toEqual(mockSummaryEdges[1]);
      expect(state.allItems[2]).toEqual(mockSummaryEdges[2]);
      expect(state.hasMore).toBe(false);
      expect(state.startCursor).toBe('cursor-2');
      expect(state.endCursor).toBe('cursor-3');
      expect(state.loading).toBe(false);
    });

    it('should update existing items instead of duplicating', () => {
      const stateWithItems = {
        ...initialState,
        allItems: [mockSummaryEdges[0], mockSummaryEdges[1]],
      };
      const updatedEdge: StandardFieldOptionSummaryEdge = {
        cursor: 'cursor-1-updated',
        node: {
          ...mockSummaryEdges[0].node,
          customerAssignmentCount: 99,
        },
      };
      const state = standardFieldOptionsSummaryReducer(
        stateWithItems,
        appendData({
          edges: [updatedEdge, mockSummaryEdges[2]],
          hasNextPage: true,
          startCursor: 'cursor-1-updated',
          endCursor: 'cursor-3',
        }),
      );
      expect(state.allItems.length).toBe(3);
      expect(state.allItems[0].node.customerAssignmentCount).toBe(99);
      expect(state.allItems[0].cursor).toBe('cursor-1-updated');
    });

    it('should handle empty edges array', () => {
      const state = standardFieldOptionsSummaryReducer(
        initialState,
        appendData({
          edges: [],
          hasNextPage: false,
          startCursor: null,
          endCursor: null,
        }),
      );
      expect(state.allItems).toEqual([]);
      expect(state.hasMore).toBe(false);
      expect(state.startCursor).toBeNull();
      expect(state.endCursor).toBeNull();
    });

    it('should set loading to false after appending', () => {
      const stateWithLoading = { ...initialState, loading: true };
      const state = standardFieldOptionsSummaryReducer(
        stateWithLoading,
        appendData({
          edges: mockSummaryEdges,
          hasNextPage: true,
          startCursor: 'cursor-1',
          endCursor: 'cursor-3',
        }),
      );
      expect(state.loading).toBe(false);
    });

    it('should handle appending to empty state', () => {
      const state = standardFieldOptionsSummaryReducer(
        initialState,
        appendData({
          edges: mockSummaryEdges,
          hasNextPage: true,
          startCursor: 'cursor-1',
          endCursor: 'cursor-3',
        }),
      );
      expect(state.allItems).toEqual(mockSummaryEdges);
      expect(state.hasMore).toBe(true);
      expect(state.startCursor).toBe('cursor-1');
      expect(state.endCursor).toBe('cursor-3');
    });

    it('should update pagination state', () => {
      const stateWithItems = {
        ...initialState,
        allItems: mockSummaryEdges,
        hasMore: true,
        startCursor: 'cursor-1',
        endCursor: 'cursor-3',
      };
      const state = standardFieldOptionsSummaryReducer(
        stateWithItems,
        appendData({
          edges: [],
          hasNextPage: false,
          startCursor: null,
          endCursor: null,
        }),
      );
      expect(state.hasMore).toBe(false);
      expect(state.startCursor).toBeNull();
      expect(state.endCursor).toBeNull();
    });
  });

  describe('setPageBeforeSearch', () => {
    it('should set page before search', () => {
      const state = standardFieldOptionsSummaryReducer(
        initialState,
        setPageBeforeSearch(5),
      );
      expect(state.pageBeforeSearch).toBe(5);
    });

    it('should update existing page before search', () => {
      const stateWithPage = { ...initialState, pageBeforeSearch: 3 };
      const state = standardFieldOptionsSummaryReducer(
        stateWithPage,
        setPageBeforeSearch(7),
      );
      expect(state.pageBeforeSearch).toBe(7);
    });

    it('should reset to page 1', () => {
      const stateWithPage = { ...initialState, pageBeforeSearch: 10 };
      const state = standardFieldOptionsSummaryReducer(
        stateWithPage,
        setPageBeforeSearch(1),
      );
      expect(state.pageBeforeSearch).toBe(1);
    });
  });

  describe('resetStandardFieldOptionsSummaryState', () => {
    it('should reset to initial state', () => {
      const modifiedState = {
        allItems: mockSummaryEdges,
        totalWorkerCount: 21,
        totalCustomerCount: 10,
        totalOptionsCount: 3,
        loading: true,
        error: 'Some error',
        hasMore: false,
        startCursor: 'cursor-1',
        endCursor: 'cursor-3',
        pageBeforeSearch: 5,
        currentFieldLabel: 'customer',
      };
      const state = standardFieldOptionsSummaryReducer(
        modifiedState,
        resetStandardFieldOptionsSummaryState(),
      );
      expect(state).toEqual(initialState);
    });

    it('should reset when already in initial state', () => {
      const state = standardFieldOptionsSummaryReducer(
        initialState,
        resetStandardFieldOptionsSummaryState(),
      );
      expect(state).toEqual(initialState);
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      standardFieldOptionsSummary: {
        allItems: mockSummaryEdges,
        totalWorkerCount: 21,
        totalCustomerCount: 10,
        totalOptionsCount: 3,
        loading: true,
        error: 'Test error',
        hasMore: true,
        startCursor: 'cursor-abc',
        endCursor: 'cursor-xyz',
        pageBeforeSearch: 5,
        currentFieldLabel: 'customer',
      },
    };

    it('selectStandardFieldOptionsSummaryState should return entire state', () => {
      expect(
        selectStandardFieldOptionsSummaryState(mockRootState as any),
      ).toEqual(mockRootState.standardFieldOptionsSummary);
    });

    it('selectStandardFieldOptionsSummaryAllItems should return all items', () => {
      expect(
        selectStandardFieldOptionsSummaryAllItems(mockRootState as any),
      ).toEqual(mockSummaryEdges);
    });

    it('selectStandardFieldOptionsSummaryTotalWorkerCount should return total worker count', () => {
      expect(
        selectStandardFieldOptionsSummaryTotalWorkerCount(mockRootState as any),
      ).toBe(21);
    });

    it('selectStandardFieldOptionsSummaryTotalCustomerCount should return total customer count', () => {
      expect(
        selectStandardFieldOptionsSummaryTotalCustomerCount(
          mockRootState as any,
        ),
      ).toBe(10);
    });

    it('selectStandardFieldOptionsSummaryTotalOptionsCount should return total options count', () => {
      expect(
        selectStandardFieldOptionsSummaryTotalOptionsCount(
          mockRootState as any,
        ),
      ).toBe(3);
    });

    it('selectStandardFieldOptionsSummaryLoading should return loading state', () => {
      expect(
        selectStandardFieldOptionsSummaryLoading(mockRootState as any),
      ).toBe(true);
    });

    it('selectStandardFieldOptionsSummaryError should return error', () => {
      expect(selectStandardFieldOptionsSummaryError(mockRootState as any)).toBe(
        'Test error',
      );
    });

    it('selectStandardFieldOptionsSummaryHasMore should return hasMore state', () => {
      expect(
        selectStandardFieldOptionsSummaryHasMore(mockRootState as any),
      ).toBe(true);
    });

    it('selectStandardFieldOptionsSummaryStartCursor should return start cursor', () => {
      expect(
        selectStandardFieldOptionsSummaryStartCursor(mockRootState as any),
      ).toBe('cursor-abc');
    });

    it('selectStandardFieldOptionsSummaryEndCursor should return end cursor', () => {
      expect(
        selectStandardFieldOptionsSummaryEndCursor(mockRootState as any),
      ).toBe('cursor-xyz');
    });

    it('selectStandardFieldOptionsSummaryPageBeforeSearch should return page before search', () => {
      expect(
        selectStandardFieldOptionsSummaryPageBeforeSearch(mockRootState as any),
      ).toBe(5);
    });

    it('selectStandardFieldOptionsSummaryCurrentFieldLabel should return current field label', () => {
      expect(
        selectStandardFieldOptionsSummaryCurrentFieldLabel(
          mockRootState as any,
        ),
      ).toBe('customer');
    });

    it('selectStandardFieldOptionsSummaryPaginated should return paginated items', () => {
      const paginated = selectStandardFieldOptionsSummaryPaginated(
        mockRootState as any,
        1,
        2,
      );
      expect(paginated.length).toBe(2);
      expect(paginated[0]).toEqual(mockSummaryEdges[0]);
      expect(paginated[1]).toEqual(mockSummaryEdges[1]);
    });

    it('selectStandardFieldOptionsSummaryPaginated should return correct page', () => {
      const paginated = selectStandardFieldOptionsSummaryPaginated(
        mockRootState as any,
        2,
        2,
      );
      expect(paginated.length).toBe(1);
      expect(paginated[0]).toEqual(mockSummaryEdges[2]);
    });

    it('selectStandardFieldOptionsSummaryPaginated should return empty array for out of range page', () => {
      const paginated = selectStandardFieldOptionsSummaryPaginated(
        mockRootState as any,
        10,
        2,
      );
      expect(paginated.length).toBe(0);
    });

    it('selectStandardFieldOptionsSummaryPaginated should handle single item page', () => {
      const paginated = selectStandardFieldOptionsSummaryPaginated(
        mockRootState as any,
        1,
        1,
      );
      expect(paginated.length).toBe(1);
      expect(paginated[0]).toEqual(mockSummaryEdges[0]);
    });

    it('selectStandardFieldOptionsSummaryPaginated should handle page size larger than items', () => {
      const paginated = selectStandardFieldOptionsSummaryPaginated(
        mockRootState as any,
        1,
        100,
      );
      expect(paginated.length).toBe(3);
      expect(paginated).toEqual(mockSummaryEdges);
    });
  });

  describe('selectors with empty state', () => {
    const emptyRootState = {
      standardFieldOptionsSummary: initialState,
    };

    it('selectStandardFieldOptionsSummaryAllItems should return empty array', () => {
      expect(
        selectStandardFieldOptionsSummaryAllItems(emptyRootState as any),
      ).toEqual([]);
    });

    it('selectStandardFieldOptionsSummaryTotalWorkerCount should return 0', () => {
      expect(
        selectStandardFieldOptionsSummaryTotalWorkerCount(
          emptyRootState as any,
        ),
      ).toBe(0);
    });

    it('selectStandardFieldOptionsSummaryTotalCustomerCount should return 0', () => {
      expect(
        selectStandardFieldOptionsSummaryTotalCustomerCount(
          emptyRootState as any,
        ),
      ).toBe(0);
    });

    it('selectStandardFieldOptionsSummaryTotalOptionsCount should return 0', () => {
      expect(
        selectStandardFieldOptionsSummaryTotalOptionsCount(
          emptyRootState as any,
        ),
      ).toBe(0);
    });

    it('selectStandardFieldOptionsSummaryLoading should return false', () => {
      expect(
        selectStandardFieldOptionsSummaryLoading(emptyRootState as any),
      ).toBe(false);
    });

    it('selectStandardFieldOptionsSummaryError should return null', () => {
      expect(
        selectStandardFieldOptionsSummaryError(emptyRootState as any),
      ).toBeNull();
    });

    it('selectStandardFieldOptionsSummaryHasMore should return true', () => {
      expect(
        selectStandardFieldOptionsSummaryHasMore(emptyRootState as any),
      ).toBe(true);
    });

    it('selectStandardFieldOptionsSummaryStartCursor should return null', () => {
      expect(
        selectStandardFieldOptionsSummaryStartCursor(emptyRootState as any),
      ).toBeNull();
    });

    it('selectStandardFieldOptionsSummaryEndCursor should return null', () => {
      expect(
        selectStandardFieldOptionsSummaryEndCursor(emptyRootState as any),
      ).toBeNull();
    });

    it('selectStandardFieldOptionsSummaryPageBeforeSearch should return 1', () => {
      expect(
        selectStandardFieldOptionsSummaryPageBeforeSearch(
          emptyRootState as any,
        ),
      ).toBe(1);
    });

    it('selectStandardFieldOptionsSummaryCurrentFieldLabel should return null', () => {
      expect(
        selectStandardFieldOptionsSummaryCurrentFieldLabel(
          emptyRootState as any,
        ),
      ).toBeNull();
    });

    it('selectStandardFieldOptionsSummaryPaginated should return empty array', () => {
      const paginated = selectStandardFieldOptionsSummaryPaginated(
        emptyRootState as any,
        1,
        20,
      );
      expect(paginated).toEqual([]);
    });
  });
});
