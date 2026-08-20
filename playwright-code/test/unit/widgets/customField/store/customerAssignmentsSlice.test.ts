import customerAssignmentsReducer, {
  CUSTOMER_ASSIGNMENT_PAGE_SIZE,
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
  resetCustomerAssignmentsState,
  fetchCustomerAssignments,
  selectCustomerAssignmentsState,
  selectCustomerAssignmentsAllItems,
  selectCustomerAssignmentsTotalCount,
  selectCustomerAssignmentsLoading,
  selectCustomerAssignmentsHasMore,
  selectCustomerAssignmentsEndCursor,
  selectCustomerAssignmentsError,
  selectCustomerAssignmentsCustomFieldId,
  selectCustomerAssignmentsCount,
  selectCustomerAssignmentsSelected,
  selectCustomerAssignmentsPaginated,
} from 'src/js/widgets/customField/store/customerAssignmentsSlice';
import { AssignmentItem } from 'src/js/widgets/common/AssignmentDrawer/types';

describe('customerAssignmentsSlice', () => {
  const initialState = {
    allItems: [],
    totalCount: 0,
    loading: false,
    error: null,
    hasMore: true,
    endCursor: null,
    lastFetchArgs: null,
    customFieldId: null,
  };

  const mockItems: AssignmentItem[] = [
    { id: 1, name: 'Item 1', level: 0, hasChildren: false, isSelected: false },
    { id: 2, name: 'Item 2', level: 0, hasChildren: false, isSelected: true },
  ];

  it('should return the initial state', () => {
    expect(customerAssignmentsReducer(undefined, { type: 'unknown' })).toEqual(
      initialState,
    );
  });

  it('should export the correct page size constant', () => {
    expect(CUSTOMER_ASSIGNMENT_PAGE_SIZE).toBe(100);
  });

  describe('setItems', () => {
    it('should set items', () => {
      const state = customerAssignmentsReducer(
        initialState,
        setItems(mockItems),
      );
      expect(state.allItems).toEqual(mockItems);
      expect(state.allItems.length).toBe(2);
    });

    it('should replace existing items', () => {
      const stateWithItems = { ...initialState, allItems: mockItems };
      const newItems: AssignmentItem[] = [
        {
          id: 3,
          name: 'Item 3',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];
      const state = customerAssignmentsReducer(
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
      const state = customerAssignmentsReducer(
        stateWithItems,
        addItems([mockItems[1]]),
      );
      expect(state.allItems).toEqual(mockItems);
      expect(state.allItems.length).toBe(2);
    });

    it('should add items to empty state', () => {
      const state = customerAssignmentsReducer(
        initialState,
        addItems(mockItems),
      );
      expect(state.allItems).toEqual(mockItems);
    });

    it('should not add duplicate items', () => {
      const stateWithItems = { ...initialState, allItems: [mockItems[0]] };
      const state = customerAssignmentsReducer(
        stateWithItems,
        addItems([mockItems[0], mockItems[1]]),
      );
      expect(state.allItems.length).toBe(2);
      expect(state.allItems).toEqual(mockItems);
    });
  });

  describe('updateItem', () => {
    it('should update an existing item', () => {
      const stateWithItems = { ...initialState, allItems: mockItems };
      const state = customerAssignmentsReducer(
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
      const state = customerAssignmentsReducer(
        stateWithItems,
        updateItem({ id: 999, changes: { name: 'Not Found' } }),
      );
      expect(state.allItems).toEqual(mockItems);
    });

    it('should handle partial updates', () => {
      const stateWithItems = { ...initialState, allItems: mockItems };
      const state = customerAssignmentsReducer(
        stateWithItems,
        updateItem({ id: 2, changes: { isSelected: false } }),
      );
      expect(state.allItems[1].isSelected).toBe(false);
      expect(state.allItems[1].name).toBe('Item 2');
    });
  });

  describe('setTotalCount', () => {
    it('should set total count', () => {
      const state = customerAssignmentsReducer(
        initialState,
        setTotalCount(100),
      );
      expect(state.totalCount).toBe(100);
    });

    it('should update total count', () => {
      const stateWithCount = { ...initialState, totalCount: 50 };
      const state = customerAssignmentsReducer(
        stateWithCount,
        setTotalCount(150),
      );
      expect(state.totalCount).toBe(150);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const state = customerAssignmentsReducer(
        initialState,
        setError('Test error'),
      );
      expect(state.error).toBe('Test error');
    });

    it('should replace existing error', () => {
      const stateWithError = { ...initialState, error: 'Old error' };
      const state = customerAssignmentsReducer(
        stateWithError,
        setError('New error'),
      );
      expect(state.error).toBe('New error');
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const stateWithError = { ...initialState, error: 'Test error' };
      const state = customerAssignmentsReducer(stateWithError, clearError());
      expect(state.error).toBeNull();
    });

    it('should not throw when clearing non-existent error', () => {
      const state = customerAssignmentsReducer(initialState, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('setHasMore', () => {
    it('should set hasMore to true', () => {
      const stateWithNoMore = { ...initialState, hasMore: false };
      const state = customerAssignmentsReducer(
        stateWithNoMore,
        setHasMore(true),
      );
      expect(state.hasMore).toBe(true);
    });

    it('should set hasMore to false', () => {
      const state = customerAssignmentsReducer(initialState, setHasMore(false));
      expect(state.hasMore).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = customerAssignmentsReducer(initialState, setLoading(true));
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const stateLoading = { ...initialState, loading: true };
      const state = customerAssignmentsReducer(stateLoading, setLoading(false));
      expect(state.loading).toBe(false);
    });
  });

  describe('setEndCursor', () => {
    it('should set end cursor', () => {
      const state = customerAssignmentsReducer(
        initialState,
        setEndCursor('cursor-123'),
      );
      expect(state.endCursor).toBe('cursor-123');
    });

    it('should set end cursor to null', () => {
      const stateWithCursor = { ...initialState, endCursor: 'old-cursor' };
      const state = customerAssignmentsReducer(
        stateWithCursor,
        setEndCursor(null),
      );
      expect(state.endCursor).toBeNull();
    });

    it('should update existing cursor', () => {
      const stateWithCursor = { ...initialState, endCursor: 'old-cursor' };
      const state = customerAssignmentsReducer(
        stateWithCursor,
        setEndCursor('new-cursor'),
      );
      expect(state.endCursor).toBe('new-cursor');
    });
  });

  describe('appendData', () => {
    it('should append new items and update metadata', () => {
      const state = customerAssignmentsReducer(
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
      const newItems = [mockItems[0], mockItems[1]];
      const state = customerAssignmentsReducer(
        stateWithItems,
        appendData({
          items: newItems,
          totalCount: 2,
          hasNextPage: false,
          endCursor: null,
        }),
      );
      expect(state.allItems.length).toBe(2);
      expect(state.allItems).toEqual(mockItems);
    });

    it('should handle null end cursor', () => {
      const state = customerAssignmentsReducer(
        initialState,
        appendData({
          items: mockItems,
          totalCount: 2,
          hasNextPage: false,
          endCursor: null,
        }),
      );
      expect(state.endCursor).toBeNull();
      expect(state.hasMore).toBe(false);
    });

    it('should set loading to false', () => {
      const stateLoading = { ...initialState, loading: true };
      const state = customerAssignmentsReducer(
        stateLoading,
        appendData({
          items: mockItems,
          totalCount: 2,
          hasNextPage: false,
          endCursor: null,
        }),
      );
      expect(state.loading).toBe(false);
    });
  });

  describe('resetCustomerAssignmentsState', () => {
    it('should reset to initial state', () => {
      const modifiedState = {
        allItems: mockItems,
        totalCount: 100,
        loading: true,
        error: 'Some error',
        hasMore: false,
        endCursor: 'cursor-123',
        lastFetchArgs: { first: 10, customFieldId: 'cf-1' },
        customFieldId: 'cf-1',
      };
      const state = customerAssignmentsReducer(
        modifiedState,
        resetCustomerAssignmentsState(),
      );
      expect(state).toEqual(initialState);
    });

    it('should reset when already in initial state', () => {
      const state = customerAssignmentsReducer(
        initialState,
        resetCustomerAssignmentsState(),
      );
      expect(state).toEqual(initialState);
    });
  });

  describe('fetchCustomerAssignments async thunk', () => {
    const mockLoader = jest.fn();
    const mockArgs = {
      first: 100,
      customFieldId: 'cf-1',
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

      const result = await fetchCustomerAssignments({
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

      const result = await fetchCustomerAssignments({
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

      const result = await fetchCustomerAssignments({
        loader: mockLoader,
        args: mockArgs,
      })(jest.fn(), jest.fn(), undefined);

      expect(result.type).toContain('rejected');
      if (result.type.includes('rejected')) {
        expect(result.payload).toBe('Failed to fetch customer assignments');
      }
    });

    it('should handle pending state', () => {
      const action = {
        type: fetchCustomerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = customerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.lastFetchArgs).toEqual(mockArgs);
    });

    it('should reset state when customFieldId changes', () => {
      const stateWithData = {
        ...initialState,
        allItems: mockItems,
        totalCount: 100,
        customFieldId: 'cf-old',
      };
      const action = {
        type: fetchCustomerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = customerAssignmentsReducer(stateWithData, action);
      expect(state.allItems).toEqual([]);
      expect(state.totalCount).toBe(0);
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBeNull();
      expect(state.customFieldId).toBe('cf-1');
    });

    it('should not reset state when customFieldId is the same', () => {
      const stateWithData = {
        ...initialState,
        allItems: mockItems,
        totalCount: 100,
        customFieldId: 'cf-1',
      };
      const action = {
        type: fetchCustomerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = customerAssignmentsReducer(stateWithData, action);
      expect(state.allItems).toEqual(mockItems);
      expect(state.totalCount).toBe(100);
    });

    it('should handle fulfilled state', () => {
      const action = {
        type: fetchCustomerAssignments.fulfilled.type,
        payload: {
          items: mockItems,
          totalCount: 100,
          hasMore: true,
          endCursor: 'cursor-123',
        },
      };
      const state = customerAssignmentsReducer(initialState, action);
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
        type: fetchCustomerAssignments.fulfilled.type,
        payload: {
          items: mockItems,
          totalCount: 2,
          hasMore: false,
          endCursor: null,
        },
      };
      const state = customerAssignmentsReducer(stateWithItems, action);
      expect(state.allItems.length).toBe(2);
      expect(state.allItems).toEqual(mockItems);
    });

    it('should handle rejected state', () => {
      const action = {
        type: fetchCustomerAssignments.rejected.type,
        payload: 'Failed to load',
      };
      const state = customerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to load');
    });

    it('should handle rejected state with default error message', () => {
      const action = {
        type: fetchCustomerAssignments.rejected.type,
        payload: undefined,
      };
      const state = customerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch customer assignments');
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      customerAssignments: {
        allItems: mockItems,
        totalCount: 100,
        loading: true,
        error: 'Test error',
        hasMore: false,
        endCursor: 'cursor-xyz',
        lastFetchArgs: null,
        customFieldId: 'cf-1',
      },
    };

    it('selectCustomerAssignmentsState should return entire state', () => {
      expect(selectCustomerAssignmentsState(mockRootState as any)).toEqual(
        mockRootState.customerAssignments,
      );
    });

    it('selectCustomerAssignmentsAllItems should return all items', () => {
      expect(selectCustomerAssignmentsAllItems(mockRootState as any)).toEqual(
        mockItems,
      );
    });

    it('selectCustomerAssignmentsTotalCount should return total count', () => {
      expect(selectCustomerAssignmentsTotalCount(mockRootState as any)).toBe(
        100,
      );
    });

    it('selectCustomerAssignmentsLoading should return loading state', () => {
      expect(selectCustomerAssignmentsLoading(mockRootState as any)).toBe(true);
    });

    it('selectCustomerAssignmentsHasMore should return hasMore state', () => {
      expect(selectCustomerAssignmentsHasMore(mockRootState as any)).toBe(
        false,
      );
    });

    it('selectCustomerAssignmentsEndCursor should return end cursor', () => {
      expect(selectCustomerAssignmentsEndCursor(mockRootState as any)).toBe(
        'cursor-xyz',
      );
    });

    it('selectCustomerAssignmentsError should return error', () => {
      expect(selectCustomerAssignmentsError(mockRootState as any)).toBe(
        'Test error',
      );
    });

    it('selectCustomerAssignmentsCustomFieldId should return customFieldId', () => {
      expect(selectCustomerAssignmentsCustomFieldId(mockRootState as any)).toBe(
        'cf-1',
      );
    });

    it('selectCustomerAssignmentsCount should return count of items', () => {
      expect(selectCustomerAssignmentsCount(mockRootState as any)).toBe(2);
    });

    it('selectCustomerAssignmentsSelected should return selected items', () => {
      const selected = selectCustomerAssignmentsSelected(mockRootState as any);
      expect(selected.length).toBe(1);
      expect(selected[0]).toEqual(mockItems[1]);
    });

    it('selectCustomerAssignmentsPaginated should return paginated items', () => {
      const paginated = selectCustomerAssignmentsPaginated(
        mockRootState as any,
        1,
        1,
      );
      expect(paginated.length).toBe(1);
      expect(paginated[0]).toEqual(mockItems[0]);
    });

    it('selectCustomerAssignmentsPaginated should return correct page', () => {
      const paginated = selectCustomerAssignmentsPaginated(
        mockRootState as any,
        2,
        1,
      );
      expect(paginated.length).toBe(1);
      expect(paginated[0]).toEqual(mockItems[1]);
    });
  });
});
