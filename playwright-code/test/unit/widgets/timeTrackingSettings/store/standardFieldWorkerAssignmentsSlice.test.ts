import standardFieldWorkerAssignmentsReducer, {
  STANDARD_FIELD_WORKER_ASSIGNMENT_PAGE_SIZE,
  setItems,
  addItems,
  updateItem,
  setTotalCount,
  setError,
  clearError,
  setHasMore,
  setEndCursor,
  appendData,
  resetStandardFieldWorkerAssignmentsState,
  setLoading,
  fetchStandardFieldWorkerAssignments,
  selectStandardFieldWorkerAssignmentsState,
  selectStandardFieldWorkerAssignmentsAllItems,
  selectStandardFieldWorkerAssignmentsTotalCount,
  selectStandardFieldWorkerAssignmentsLoading,
  selectStandardFieldWorkerAssignmentsHasMore,
  selectStandardFieldWorkerAssignmentsEndCursor,
  selectStandardFieldWorkerAssignmentsError,
  selectStandardFieldWorkerAssignmentsStandardFieldLabel,
  selectStandardFieldWorkerAssignmentsStandardFieldOption,
  selectStandardFieldWorkerAssignmentsCount,
  selectStandardFieldWorkerAssignmentsSelected,
  selectStandardFieldWorkerAssignmentsPaginated,
} from 'src/js/widgets/timeTrackingSettings/store/standardFieldWorkerAssignmentsSlice';
import { AssignmentItem } from 'src/js/widgets/common/AssignmentDrawer/types';

describe('standardFieldWorkerAssignmentsSlice', () => {
  const initialState = {
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

  const mockItems: AssignmentItem[] = [
    { id: 1, name: 'Item 1', level: 0, hasChildren: false, isSelected: false },
    { id: 2, name: 'Item 2', level: 0, hasChildren: false, isSelected: true },
    { id: 3, name: 'Item 3', level: 0, hasChildren: false, isSelected: false },
  ];

  it('should return the initial state', () => {
    expect(
      standardFieldWorkerAssignmentsReducer(undefined, { type: 'unknown' }),
    ).toEqual(initialState);
  });

  it('should export the correct page size constant', () => {
    expect(STANDARD_FIELD_WORKER_ASSIGNMENT_PAGE_SIZE).toBe(100);
  });

  describe('setItems', () => {
    it('should set items', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        setItems(mockItems),
      );
      expect(state.allItems).toEqual(mockItems);
      expect(state.allItems.length).toBe(3);
    });

    it('should replace existing items', () => {
      const stateWithItems = { ...initialState, allItems: mockItems };
      const newItems: AssignmentItem[] = [
        {
          id: 4,
          name: 'Item 4',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithItems,
        setItems(newItems),
      );
      expect(state.allItems).toEqual(newItems);
      expect(state.allItems.length).toBe(1);
    });
  });

  describe('addItems', () => {
    it('should add items to existing items', () => {
      const stateWithItems = { ...initialState, allItems: [mockItems[0]] };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithItems,
        addItems([mockItems[1], mockItems[2]]),
      );
      expect(state.allItems).toEqual(mockItems);
      expect(state.allItems.length).toBe(3);
    });

    it('should add items to empty state', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        addItems(mockItems),
      );
      expect(state.allItems).toEqual(mockItems);
    });

    it('should not add duplicate items', () => {
      const stateWithItems = { ...initialState, allItems: [mockItems[0]] };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithItems,
        addItems([mockItems[0], mockItems[1]]),
      );
      expect(state.allItems.length).toBe(2);
      expect(state.allItems[0]).toEqual(mockItems[0]);
      expect(state.allItems[1]).toEqual(mockItems[1]);
    });
  });

  describe('updateItem', () => {
    it('should update an existing item', () => {
      const stateWithItems = { ...initialState, allItems: mockItems };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithItems,
        updateItem({
          id: 1,
          changes: { name: 'Updated Item 1', isSelected: true },
        }),
      );
      expect(state.allItems[0].name).toBe('Updated Item 1');
      expect(state.allItems[0].isSelected).toBe(true);
      expect(state.allItems[1]).toEqual(mockItems[1]);
    });

    it('should not modify state if item not found', () => {
      const stateWithItems = { ...initialState, allItems: mockItems };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithItems,
        updateItem({ id: 999, changes: { name: 'Not Found' } }),
      );
      expect(state.allItems).toEqual(mockItems);
    });

    it('should handle partial updates', () => {
      const stateWithItems = { ...initialState, allItems: mockItems };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithItems,
        updateItem({ id: 2, changes: { isSelected: false } }),
      );
      expect(state.allItems[1].isSelected).toBe(false);
      expect(state.allItems[1].name).toBe('Item 2');
    });
  });

  describe('setTotalCount', () => {
    it('should set total count', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        setTotalCount(100),
      );
      expect(state.totalCount).toBe(100);
    });

    it('should update total count', () => {
      const stateWithCount = { ...initialState, totalCount: 50 };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithCount,
        setTotalCount(150),
      );
      expect(state.totalCount).toBe(150);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        setError('Test error'),
      );
      expect(state.error).toBe('Test error');
    });

    it('should replace existing error', () => {
      const stateWithError = { ...initialState, error: 'Old error' };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithError,
        setError('New error'),
      );
      expect(state.error).toBe('New error');
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const stateWithError = { ...initialState, error: 'Test error' };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithError,
        clearError(),
      );
      expect(state.error).toBeNull();
    });

    it('should not throw when clearing non-existent error', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        clearError(),
      );
      expect(state.error).toBeNull();
    });
  });

  describe('setHasMore', () => {
    it('should set hasMore to true', () => {
      const stateWithNoMore = { ...initialState, hasMore: false };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithNoMore,
        setHasMore(true),
      );
      expect(state.hasMore).toBe(true);
    });

    it('should set hasMore to false', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        setHasMore(false),
      );
      expect(state.hasMore).toBe(false);
    });
  });

  describe('setEndCursor', () => {
    it('should set end cursor', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        setEndCursor('cursor-123'),
      );
      expect(state.endCursor).toBe('cursor-123');
    });

    it('should set end cursor to null', () => {
      const stateWithCursor = { ...initialState, endCursor: 'old-cursor' };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithCursor,
        setEndCursor(null),
      );
      expect(state.endCursor).toBeNull();
    });

    it('should update existing cursor', () => {
      const stateWithCursor = { ...initialState, endCursor: 'old-cursor' };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithCursor,
        setEndCursor('new-cursor'),
      );
      expect(state.endCursor).toBe('new-cursor');
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        setLoading(true),
      );
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const stateLoading = { ...initialState, loading: true };
      const state = standardFieldWorkerAssignmentsReducer(
        stateLoading,
        setLoading(false),
      );
      expect(state.loading).toBe(false);
    });
  });

  describe('appendData', () => {
    it('should append new items and update metadata', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        appendData({
          items: mockItems,
          totalCount: 100,
          hasNextPage: true,
          endCursor: 'cursor-abc',
        }),
      );
      expect(state.allItems).toEqual(mockItems);
      expect(state.totalCount).toBe(100);
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBe('cursor-abc');
      expect(state.loading).toBe(false);
    });

    it('should append without duplicates', () => {
      const stateWithItems = { ...initialState, allItems: [mockItems[0]] };
      const newItems = [mockItems[0], mockItems[1], mockItems[2]];
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithItems,
        appendData({
          items: newItems,
          totalCount: 3,
          hasNextPage: false,
          endCursor: null,
        }),
      );
      expect(state.allItems.length).toBe(3);
      expect(state.allItems).toEqual(mockItems);
    });

    it('should handle null end cursor', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        appendData({
          items: mockItems,
          totalCount: 3,
          hasNextPage: false,
          endCursor: null,
        }),
      );
      expect(state.endCursor).toBeNull();
      expect(state.hasMore).toBe(false);
    });

    it('should set loading to false after appending', () => {
      const stateLoading = { ...initialState, loading: true };
      const state = standardFieldWorkerAssignmentsReducer(
        stateLoading,
        appendData({
          items: mockItems,
          totalCount: 3,
          hasNextPage: true,
          endCursor: 'cursor-123',
        }),
      );
      expect(state.loading).toBe(false);
    });

    it('should filter out duplicate items by id', () => {
      const stateWithItems = {
        ...initialState,
        allItems: [mockItems[0], mockItems[1]],
      };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithItems,
        appendData({
          items: [mockItems[1], mockItems[2]],
          totalCount: 3,
          hasNextPage: false,
          endCursor: null,
        }),
      );
      expect(state.allItems.length).toBe(3);
      expect(state.allItems[2]).toEqual(mockItems[2]);
    });

    it('should handle empty items array', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        appendData({
          items: [],
          totalCount: 0,
          hasNextPage: false,
          endCursor: null,
        }),
      );
      expect(state.allItems).toEqual([]);
      expect(state.totalCount).toBe(0);
      expect(state.hasMore).toBe(false);
      expect(state.endCursor).toBeNull();
    });
  });

  describe('resetStandardFieldWorkerAssignmentsState', () => {
    it('should reset to initial state', () => {
      const modifiedState = {
        allItems: mockItems,
        totalCount: 100,
        loading: true,
        error: 'Some error',
        hasMore: false,
        endCursor: 'cursor-123',
        lastFetchArgs: {
          first: 10,
          standardFieldLabel: 'customer',
          standardFieldOption: 'option-1',
        },
        standardFieldLabel: 'customer',
        standardFieldOption: 'option-1',
      };
      const state = standardFieldWorkerAssignmentsReducer(
        modifiedState,
        resetStandardFieldWorkerAssignmentsState(),
      );
      expect(state).toEqual(initialState);
    });

    it('should reset when already in initial state', () => {
      const state = standardFieldWorkerAssignmentsReducer(
        initialState,
        resetStandardFieldWorkerAssignmentsState(),
      );
      expect(state).toEqual(initialState);
    });
  });

  describe('fetchStandardFieldWorkerAssignments async thunk', () => {
    const mockLoader = jest.fn();
    const mockArgs = {
      first: 100,
      standardFieldLabel: 'customer',
      standardFieldOption: 'option-1',
    };

    beforeEach(() => {
      mockLoader.mockClear();
    });

    it('should call loader and return data on success', async () => {
      const mockResult = {
        items: mockItems,
        totalCount: 100,
        hasNextPage: true,
        endCursor: 'cursor-123',
      };
      mockLoader.mockResolvedValueOnce(mockResult);

      const result = await fetchStandardFieldWorkerAssignments({
        loader: mockLoader,
        args: mockArgs,
      })(jest.fn(), jest.fn(), undefined);

      expect(mockLoader).toHaveBeenCalledWith(mockArgs);
      expect(result.type).toContain('fulfilled');
      if (result.type.includes('fulfilled')) {
        expect(result.payload).toEqual({
          items: mockItems,
          totalCount: 100,
          hasMore: true,
          endCursor: 'cursor-123',
        });
      }
    });

    it('should handle loader error', async () => {
      const mockError = new Error('Network error');
      mockLoader.mockRejectedValueOnce(mockError);

      const result = await fetchStandardFieldWorkerAssignments({
        loader: mockLoader,
        args: mockArgs,
      })(jest.fn(), jest.fn(), undefined);

      expect(mockLoader).toHaveBeenCalledWith(mockArgs);
      expect(result.type).toContain('rejected');
      if (result.type.includes('rejected')) {
        expect(result.payload).toBe('Network error');
      }
    });

    it('should handle loader error without message', async () => {
      mockLoader.mockRejectedValueOnce({});

      const result = await fetchStandardFieldWorkerAssignments({
        loader: mockLoader,
        args: mockArgs,
      })(jest.fn(), jest.fn(), undefined);

      expect(result.type).toContain('rejected');
      if (result.type.includes('rejected')) {
        expect(result.payload).toBe(
          'Failed to fetch standard field worker assignments',
        );
      }
    });

    it('should handle pending state', () => {
      const action = {
        type: fetchStandardFieldWorkerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = standardFieldWorkerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.lastFetchArgs).toEqual(mockArgs);
    });

    it('should reset state when standardFieldLabel changes', () => {
      const stateWithData = {
        ...initialState,
        allItems: mockItems,
        totalCount: 100,
        standardFieldLabel: 'project',
        standardFieldOption: 'option-1',
      };
      const action = {
        type: fetchStandardFieldWorkerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithData,
        action,
      );
      expect(state.allItems).toEqual([]);
      expect(state.totalCount).toBe(0);
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBeNull();
      expect(state.standardFieldLabel).toBe('customer');
      expect(state.standardFieldOption).toBe('option-1');
    });

    it('should reset state when standardFieldOption changes', () => {
      const stateWithData = {
        ...initialState,
        allItems: mockItems,
        totalCount: 100,
        standardFieldLabel: 'customer',
        standardFieldOption: 'option-2',
      };
      const action = {
        type: fetchStandardFieldWorkerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithData,
        action,
      );
      expect(state.allItems).toEqual([]);
      expect(state.totalCount).toBe(0);
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBeNull();
      expect(state.standardFieldLabel).toBe('customer');
      expect(state.standardFieldOption).toBe('option-1');
    });

    it('should not reset state when both standardFieldLabel and standardFieldOption are the same', () => {
      const stateWithData = {
        ...initialState,
        allItems: mockItems,
        totalCount: 100,
        standardFieldLabel: 'customer',
        standardFieldOption: 'option-1',
      };
      const action = {
        type: fetchStandardFieldWorkerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithData,
        action,
      );
      expect(state.allItems).toEqual(mockItems);
      expect(state.totalCount).toBe(100);
    });

    it('should handle fulfilled state', () => {
      const action = {
        type: fetchStandardFieldWorkerAssignments.fulfilled.type,
        payload: {
          items: mockItems,
          totalCount: 100,
          hasMore: true,
          endCursor: 'cursor-123',
        },
      };
      const state = standardFieldWorkerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.allItems).toEqual(mockItems);
      expect(state.totalCount).toBe(100);
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBe('cursor-123');
      expect(state.error).toBeNull();
    });

    it('should merge items without duplicates on fulfilled', () => {
      const stateWithItems = { ...initialState, allItems: [mockItems[0]] };
      const action = {
        type: fetchStandardFieldWorkerAssignments.fulfilled.type,
        payload: {
          items: mockItems,
          totalCount: 3,
          hasMore: false,
          endCursor: null,
        },
      };
      const state = standardFieldWorkerAssignmentsReducer(
        stateWithItems,
        action,
      );
      expect(state.allItems.length).toBe(3);
      expect(state.allItems).toEqual(mockItems);
    });

    it('should handle rejected state', () => {
      const action = {
        type: fetchStandardFieldWorkerAssignments.rejected.type,
        payload: 'Failed to load',
      };
      const state = standardFieldWorkerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to load');
    });

    it('should handle rejected state with default error message', () => {
      const action = {
        type: fetchStandardFieldWorkerAssignments.rejected.type,
        payload: undefined,
      };
      const state = standardFieldWorkerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(
        'Failed to fetch standard field worker assignments',
      );
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      standardFieldWorkerAssignments: {
        allItems: mockItems,
        totalCount: 150,
        loading: true,
        error: 'Test error',
        hasMore: true,
        endCursor: 'cursor-xyz',
        lastFetchArgs: null,
        standardFieldLabel: 'project',
        standardFieldOption: 'option-abc',
      },
    };

    it('selectStandardFieldWorkerAssignmentsState should return entire state', () => {
      expect(
        selectStandardFieldWorkerAssignmentsState(mockRootState as any),
      ).toEqual(mockRootState.standardFieldWorkerAssignments);
    });

    it('selectStandardFieldWorkerAssignmentsAllItems should return all items', () => {
      expect(
        selectStandardFieldWorkerAssignmentsAllItems(mockRootState as any),
      ).toEqual(mockItems);
    });

    it('selectStandardFieldWorkerAssignmentsTotalCount should return total count', () => {
      expect(
        selectStandardFieldWorkerAssignmentsTotalCount(mockRootState as any),
      ).toBe(150);
    });

    it('selectStandardFieldWorkerAssignmentsLoading should return loading state', () => {
      expect(
        selectStandardFieldWorkerAssignmentsLoading(mockRootState as any),
      ).toBe(true);
    });

    it('selectStandardFieldWorkerAssignmentsHasMore should return hasMore state', () => {
      expect(
        selectStandardFieldWorkerAssignmentsHasMore(mockRootState as any),
      ).toBe(true);
    });

    it('selectStandardFieldWorkerAssignmentsEndCursor should return end cursor', () => {
      expect(
        selectStandardFieldWorkerAssignmentsEndCursor(mockRootState as any),
      ).toBe('cursor-xyz');
    });

    it('selectStandardFieldWorkerAssignmentsError should return error', () => {
      expect(
        selectStandardFieldWorkerAssignmentsError(mockRootState as any),
      ).toBe('Test error');
    });

    it('selectStandardFieldWorkerAssignmentsStandardFieldLabel should return label', () => {
      expect(
        selectStandardFieldWorkerAssignmentsStandardFieldLabel(
          mockRootState as any,
        ),
      ).toBe('project');
    });

    it('selectStandardFieldWorkerAssignmentsStandardFieldOption should return option', () => {
      expect(
        selectStandardFieldWorkerAssignmentsStandardFieldOption(
          mockRootState as any,
        ),
      ).toBe('option-abc');
    });

    it('selectStandardFieldWorkerAssignmentsCount should return count of items', () => {
      expect(
        selectStandardFieldWorkerAssignmentsCount(mockRootState as any),
      ).toBe(3);
    });

    it('selectStandardFieldWorkerAssignmentsSelected should return selected items', () => {
      const selected = selectStandardFieldWorkerAssignmentsSelected(
        mockRootState as any,
      );
      expect(selected.length).toBe(1);
      expect(selected[0]).toEqual(mockItems[1]);
    });

    it('selectStandardFieldWorkerAssignmentsPaginated should return paginated items', () => {
      const paginated = selectStandardFieldWorkerAssignmentsPaginated(
        mockRootState as any,
        1,
        2,
      );
      expect(paginated.length).toBe(2);
      expect(paginated[0]).toEqual(mockItems[0]);
      expect(paginated[1]).toEqual(mockItems[1]);
    });

    it('selectStandardFieldWorkerAssignmentsPaginated should return correct page', () => {
      const paginated = selectStandardFieldWorkerAssignmentsPaginated(
        mockRootState as any,
        2,
        2,
      );
      expect(paginated.length).toBe(1);
      expect(paginated[0]).toEqual(mockItems[2]);
    });

    it('selectStandardFieldWorkerAssignmentsPaginated should return empty array for out of bounds page', () => {
      const paginated = selectStandardFieldWorkerAssignmentsPaginated(
        mockRootState as any,
        10,
        2,
      );
      expect(paginated.length).toBe(0);
    });
  });
});
