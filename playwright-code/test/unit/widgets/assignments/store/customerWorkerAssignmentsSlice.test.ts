import customerWorkerAssignmentsReducer, {
  WORKER_ASSIGNMENT_PAGE_SIZE,
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
  fetchCustomerWorkerAssignments,
  selectCustomerWorkerAssignmentsState,
  selectCustomerWorkerAssignmentsAllItems,
  selectCustomerWorkerAssignmentsTotalCount,
  selectCustomerWorkerAssignmentsLoading,
  selectCustomerWorkerAssignmentsHasMore,
  selectCustomerWorkerAssignmentsEndCursor,
  selectCustomerWorkerAssignmentsError,
  selectCustomerWorkerAssignmentsCustomerId,
  selectCustomerWorkerAssignmentsProjectId,
  selectCustomerWorkerAssignmentsCount,
  selectCustomerWorkerAssignmentsSelected,
  selectCustomerWorkerAssignmentsPaginated,
} from 'src/js/widgets/assignments/store/customerWorkerAssignmentsSlice';
import { AssignmentItem } from 'src/js/widgets/common/AssignmentDrawer/types';

describe('customerWorkerAssignmentsSlice', () => {
  const initialState = {
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

  const mockItems: AssignmentItem[] = [
    {
      id: 1,
      name: 'Worker 1',
      level: 0,
      hasChildren: false,
      isSelected: false,
    },
    { id: 2, name: 'Worker 2', level: 0, hasChildren: false, isSelected: true },
  ];

  it('should return the initial state', () => {
    expect(
      customerWorkerAssignmentsReducer(undefined, { type: 'unknown' }),
    ).toEqual(initialState);
  });

  it('should export the correct page size constant', () => {
    expect(WORKER_ASSIGNMENT_PAGE_SIZE).toBe(100);
  });

  describe('setItems', () => {
    it('should set items', () => {
      const state = customerWorkerAssignmentsReducer(
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
          name: 'Worker 3',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];
      const state = customerWorkerAssignmentsReducer(
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
      const state = customerWorkerAssignmentsReducer(
        stateWithItems,
        addItems([mockItems[1]]),
      );
      expect(state.allItems).toEqual(mockItems);
      expect(state.allItems.length).toBe(2);
    });

    it('should add items to empty state', () => {
      const state = customerWorkerAssignmentsReducer(
        initialState,
        addItems(mockItems),
      );
      expect(state.allItems).toEqual(mockItems);
    });

    it('should not add duplicate items', () => {
      const stateWithItems = { ...initialState, allItems: [mockItems[0]] };
      const state = customerWorkerAssignmentsReducer(
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
      const state = customerWorkerAssignmentsReducer(
        stateWithItems,
        updateItem({
          id: 1,
          changes: { name: 'Updated Worker 1', isSelected: true },
        }),
      );
      expect(state.allItems[0].name).toBe('Updated Worker 1');
      expect(state.allItems[0].isSelected).toBe(true);
      expect(state.allItems[1]).toEqual(mockItems[1]);
    });

    it('should not modify state if item not found', () => {
      const stateWithItems = { ...initialState, allItems: mockItems };
      const state = customerWorkerAssignmentsReducer(
        stateWithItems,
        updateItem({ id: 999, changes: { name: 'Not Found' } }),
      );
      expect(state.allItems).toEqual(mockItems);
    });

    it('should handle partial updates', () => {
      const stateWithItems = { ...initialState, allItems: mockItems };
      const state = customerWorkerAssignmentsReducer(
        stateWithItems,
        updateItem({ id: 2, changes: { isSelected: false } }),
      );
      expect(state.allItems[1].isSelected).toBe(false);
      expect(state.allItems[1].name).toBe('Worker 2');
    });
  });

  describe('setTotalCount', () => {
    it('should set total count', () => {
      const state = customerWorkerAssignmentsReducer(
        initialState,
        setTotalCount(100),
      );
      expect(state.totalCount).toBe(100);
    });

    it('should update total count', () => {
      const stateWithCount = { ...initialState, totalCount: 50 };
      const state = customerWorkerAssignmentsReducer(
        stateWithCount,
        setTotalCount(150),
      );
      expect(state.totalCount).toBe(150);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const state = customerWorkerAssignmentsReducer(
        initialState,
        setError('Test error'),
      );
      expect(state.error).toBe('Test error');
    });

    it('should replace existing error', () => {
      const stateWithError = { ...initialState, error: 'Old error' };
      const state = customerWorkerAssignmentsReducer(
        stateWithError,
        setError('New error'),
      );
      expect(state.error).toBe('New error');
    });

    it('should set error to null', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const state = customerWorkerAssignmentsReducer(
        stateWithError,
        setError(null),
      );
      expect(state.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const stateWithError = { ...initialState, error: 'Test error' };
      const state = customerWorkerAssignmentsReducer(
        stateWithError,
        clearError(),
      );
      expect(state.error).toBeNull();
    });

    it('should not throw when clearing non-existent error', () => {
      const state = customerWorkerAssignmentsReducer(
        initialState,
        clearError(),
      );
      expect(state.error).toBeNull();
    });
  });

  describe('setHasMore', () => {
    it('should set hasMore to true', () => {
      const stateWithNoMore = { ...initialState, hasMore: false };
      const state = customerWorkerAssignmentsReducer(
        stateWithNoMore,
        setHasMore(true),
      );
      expect(state.hasMore).toBe(true);
    });

    it('should set hasMore to false', () => {
      const state = customerWorkerAssignmentsReducer(
        initialState,
        setHasMore(false),
      );
      expect(state.hasMore).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = customerWorkerAssignmentsReducer(
        initialState,
        setLoading(true),
      );
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const stateLoading = { ...initialState, loading: true };
      const state = customerWorkerAssignmentsReducer(
        stateLoading,
        setLoading(false),
      );
      expect(state.loading).toBe(false);
    });
  });

  describe('setEndCursor', () => {
    it('should set end cursor', () => {
      const state = customerWorkerAssignmentsReducer(
        initialState,
        setEndCursor('cursor-123'),
      );
      expect(state.endCursor).toBe('cursor-123');
    });

    it('should set end cursor to null', () => {
      const stateWithCursor = { ...initialState, endCursor: 'old-cursor' };
      const state = customerWorkerAssignmentsReducer(
        stateWithCursor,
        setEndCursor(null),
      );
      expect(state.endCursor).toBeNull();
    });

    it('should update existing cursor', () => {
      const stateWithCursor = { ...initialState, endCursor: 'old-cursor' };
      const state = customerWorkerAssignmentsReducer(
        stateWithCursor,
        setEndCursor('new-cursor'),
      );
      expect(state.endCursor).toBe('new-cursor');
    });
  });

  describe('appendData', () => {
    it('should append new items and update metadata', () => {
      const state = customerWorkerAssignmentsReducer(
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
      const state = customerWorkerAssignmentsReducer(
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
      const state = customerWorkerAssignmentsReducer(
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
      const state = customerWorkerAssignmentsReducer(
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

  describe('resetCustomerWorkerAssignmentsState', () => {
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
          customerId: 'cust-1',
          projectId: 'proj-1',
        },
        customerId: 'cust-1',
        projectId: 'proj-1',
      };
      const state = customerWorkerAssignmentsReducer(
        modifiedState,
        resetCustomerWorkerAssignmentsState(),
      );
      expect(state).toEqual(initialState);
    });

    it('should reset when already in initial state', () => {
      const state = customerWorkerAssignmentsReducer(
        initialState,
        resetCustomerWorkerAssignmentsState(),
      );
      expect(state).toEqual(initialState);
    });
  });

  describe('fetchCustomerWorkerAssignments async thunk', () => {
    const mockLoader = jest.fn();
    const mockArgs = {
      first: 100,
      customerId: 'cust-1',
      projectId: 'proj-1',
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

      const result = await fetchCustomerWorkerAssignments({
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

      const result = await fetchCustomerWorkerAssignments({
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

      const result = await fetchCustomerWorkerAssignments({
        loader: mockLoader,
        args: mockArgs,
      })(jest.fn(), jest.fn(), undefined);

      expect(result.type).toContain('rejected');
      if (result.type.includes('rejected')) {
        expect(result.payload).toBe('Failed to fetch worker assignments');
      }
    });

    it('should handle pending state', () => {
      const action = {
        type: fetchCustomerWorkerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = customerWorkerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.lastFetchArgs).toEqual(mockArgs);
    });

    it('should reset state when customerId changes', () => {
      const stateWithData = {
        ...initialState,
        allItems: mockItems,
        totalCount: 100,
        customerId: 'cust-old',
        projectId: null,
      };
      const action = {
        type: fetchCustomerWorkerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = customerWorkerAssignmentsReducer(stateWithData, action);
      expect(state.allItems).toEqual([]);
      expect(state.totalCount).toBe(0);
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBeNull();
      expect(state.customerId).toBe('cust-1');
      expect(state.projectId).toBe('proj-1');
    });

    it('should reset state when projectId changes', () => {
      const stateWithData = {
        ...initialState,
        allItems: mockItems,
        totalCount: 100,
        customerId: 'cust-1',
        projectId: 'proj-old',
      };
      const action = {
        type: fetchCustomerWorkerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = customerWorkerAssignmentsReducer(stateWithData, action);
      expect(state.allItems).toEqual([]);
      expect(state.totalCount).toBe(0);
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBeNull();
      expect(state.customerId).toBe('cust-1');
      expect(state.projectId).toBe('proj-1');
    });

    it('should not reset state when customerId and projectId are the same', () => {
      const stateWithData = {
        ...initialState,
        allItems: mockItems,
        totalCount: 100,
        customerId: 'cust-1',
        projectId: 'proj-1',
      };
      const action = {
        type: fetchCustomerWorkerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: mockArgs } },
      };
      const state = customerWorkerAssignmentsReducer(stateWithData, action);
      expect(state.allItems).toEqual(mockItems);
      expect(state.totalCount).toBe(100);
    });

    it('should handle pending state without projectId', () => {
      const argsWithoutProject = {
        first: 100,
        customerId: 'cust-1',
      };
      const action = {
        type: fetchCustomerWorkerAssignments.pending.type,
        meta: { arg: { loader: mockLoader, args: argsWithoutProject } },
      };
      const state = customerWorkerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.customerId).toBe('cust-1');
      expect(state.projectId).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const action = {
        type: fetchCustomerWorkerAssignments.fulfilled.type,
        payload: {
          items: mockItems,
          totalCount: 100,
          hasMore: true,
          endCursor: 'cursor-123',
        },
      };
      const state = customerWorkerAssignmentsReducer(initialState, action);
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
        type: fetchCustomerWorkerAssignments.fulfilled.type,
        payload: {
          items: mockItems,
          totalCount: 2,
          hasMore: false,
          endCursor: null,
        },
      };
      const state = customerWorkerAssignmentsReducer(stateWithItems, action);
      expect(state.allItems.length).toBe(2);
      expect(state.allItems).toEqual(mockItems);
    });

    it('should handle rejected state', () => {
      const action = {
        type: fetchCustomerWorkerAssignments.rejected.type,
        payload: 'Failed to load',
      };
      const state = customerWorkerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to load');
    });

    it('should handle rejected state with default error message', () => {
      const action = {
        type: fetchCustomerWorkerAssignments.rejected.type,
        payload: undefined,
      };
      const state = customerWorkerAssignmentsReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch worker assignments');
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      customerWorkerAssignments: {
        allItems: mockItems,
        totalCount: 100,
        loading: true,
        error: 'Test error',
        hasMore: false,
        endCursor: 'cursor-xyz',
        lastFetchArgs: null,
        customerId: 'cust-1',
        projectId: 'proj-1',
      },
    };

    it('selectCustomerWorkerAssignmentsState should return entire state', () => {
      expect(
        selectCustomerWorkerAssignmentsState(mockRootState as any),
      ).toEqual(mockRootState.customerWorkerAssignments);
    });

    it('selectCustomerWorkerAssignmentsAllItems should return all items', () => {
      expect(
        selectCustomerWorkerAssignmentsAllItems(mockRootState as any),
      ).toEqual(mockItems);
    });

    it('selectCustomerWorkerAssignmentsTotalCount should return total count', () => {
      expect(
        selectCustomerWorkerAssignmentsTotalCount(mockRootState as any),
      ).toBe(100);
    });

    it('selectCustomerWorkerAssignmentsLoading should return loading state', () => {
      expect(selectCustomerWorkerAssignmentsLoading(mockRootState as any)).toBe(
        true,
      );
    });

    it('selectCustomerWorkerAssignmentsHasMore should return hasMore state', () => {
      expect(selectCustomerWorkerAssignmentsHasMore(mockRootState as any)).toBe(
        false,
      );
    });

    it('selectCustomerWorkerAssignmentsEndCursor should return end cursor', () => {
      expect(
        selectCustomerWorkerAssignmentsEndCursor(mockRootState as any),
      ).toBe('cursor-xyz');
    });

    it('selectCustomerWorkerAssignmentsError should return error', () => {
      expect(selectCustomerWorkerAssignmentsError(mockRootState as any)).toBe(
        'Test error',
      );
    });

    it('selectCustomerWorkerAssignmentsCustomerId should return customerId', () => {
      expect(
        selectCustomerWorkerAssignmentsCustomerId(mockRootState as any),
      ).toBe('cust-1');
    });

    it('selectCustomerWorkerAssignmentsProjectId should return projectId', () => {
      expect(
        selectCustomerWorkerAssignmentsProjectId(mockRootState as any),
      ).toBe('proj-1');
    });

    it('selectCustomerWorkerAssignmentsCount should return count of items', () => {
      expect(selectCustomerWorkerAssignmentsCount(mockRootState as any)).toBe(
        2,
      );
    });

    it('selectCustomerWorkerAssignmentsSelected should return selected items', () => {
      const selected = selectCustomerWorkerAssignmentsSelected(
        mockRootState as any,
      );
      expect(selected.length).toBe(1);
      expect(selected[0]).toEqual(mockItems[1]);
    });

    it('selectCustomerWorkerAssignmentsPaginated should return paginated items', () => {
      const paginated = selectCustomerWorkerAssignmentsPaginated(
        mockRootState as any,
        1,
        1,
      );
      expect(paginated.length).toBe(1);
      expect(paginated[0]).toEqual(mockItems[0]);
    });

    it('selectCustomerWorkerAssignmentsPaginated should return correct page', () => {
      const paginated = selectCustomerWorkerAssignmentsPaginated(
        mockRootState as any,
        2,
        1,
      );
      expect(paginated.length).toBe(1);
      expect(paginated[0]).toEqual(mockItems[1]);
    });

    it('selectCustomerWorkerAssignmentsPaginated should handle empty results', () => {
      const paginated = selectCustomerWorkerAssignmentsPaginated(
        mockRootState as any,
        10,
        10,
      );
      expect(paginated.length).toBe(0);
    });
  });
});
