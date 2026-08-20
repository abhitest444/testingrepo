import customerAssignmentsReducer, {
  CUSTOMER_ASSIGNMENT_PAGE_SIZE,
  setLoading,
  setError,
  clearError,
  setInitialData,
  appendData,
  refreshPageData,
  setPageBeforeSearch,
  resetCustomerAssignmentsState,
  selectCustomerAssignmentsState,
  selectCustomerAssignmentsAllItems,
  selectCustomerAssignmentsTotalCount,
  selectCustomerAssignmentsLoading,
  selectCustomerAssignmentsError,
  selectCustomerAssignmentsHasMore,
  selectCustomerAssignmentsEndCursor,
  selectCustomerAssignmentsPageBeforeSearch,
  selectCustomerAssignmentsSummaryStats,
  selectCustomerAssignmentsPaginated,
} from 'src/js/widgets/assignments/store/customerAssignmentsSlice';
import { TimeAgainstAssignmentSummaryEdge } from 'src/js/service/types/assignmentTypes';

describe('customerAssignmentsSlice', () => {
  const initialState = {
    allItems: [],
    totalCount: 0,
    loading: false,
    error: null,
    hasMore: true,
    endCursor: null,
    totalTimeForAssignments: 0,
    totalCustomFieldAssignments: 0,
    totalStandardFieldAssignments: 0,
    pageBeforeSearch: 1,
  };

  const mockEdge1: TimeAgainstAssignmentSummaryEdge = {
    node: {
      timeAgainst: {
        timeAgainstContactDAS: {
          customer: { id: 'cust-1' },
          project: undefined,
        },
        assigned: true,
        displayName: 'Customer 1',
        fullName: 'Customer 1 Full Name',
        customerType: 'CUSTOMER',
        active: true,
        parentId: undefined,
        level: 0,
        numChildren: 0,
      },
      assignedTimeForCount: 5,
      assignedCustomFieldCount: 2,
      assignedStandardFieldCount: 3,
    },
    cursor: 'cursor-1',
  };

  const mockEdge2: TimeAgainstAssignmentSummaryEdge = {
    node: {
      timeAgainst: {
        timeAgainstContactDAS: {
          customer: { id: 'cust-2' },
          project: undefined,
        },
        assigned: false,
        displayName: 'Customer 2',
        fullName: 'Customer 2 Full Name',
        customerType: 'CUSTOMER',
        active: true,
        parentId: undefined,
        level: 0,
        numChildren: 1,
      },
      assignedTimeForCount: 0,
      assignedCustomFieldCount: 0,
      assignedStandardFieldCount: 0,
    },
    cursor: 'cursor-2',
  };

  const mockEdges = [mockEdge1, mockEdge2];

  it('should return the initial state', () => {
    expect(customerAssignmentsReducer(undefined, { type: 'unknown' })).toEqual(
      initialState,
    );
  });

  it('should export the correct page size constant', () => {
    expect(CUSTOMER_ASSIGNMENT_PAGE_SIZE).toBe(20);
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

    it('should set error to null', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const state = customerAssignmentsReducer(stateWithError, setError(null));
      expect(state.error).toBeNull();
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

  describe('setInitialData', () => {
    it('should set initial data with all fields', () => {
      const payload = {
        edges: mockEdges,
        totalCount: 100,
        hasNextPage: true,
        endCursor: 'cursor-xyz',
        totalTimeForAssignments: 50,
        totalCustomFieldAssignments: 12,
        totalStandardFieldAssignments: 8,
      };
      const state = customerAssignmentsReducer(
        initialState,
        setInitialData(payload),
      );
      expect(state.allItems).toEqual(mockEdges);
      expect(state.totalCount).toBe(100);
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBe('cursor-xyz');
      expect(state.totalTimeForAssignments).toBe(50);
      expect(state.totalCustomFieldAssignments).toBe(12);
      expect(state.totalStandardFieldAssignments).toBe(8);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should replace existing data', () => {
      const stateWithData = {
        ...initialState,
        allItems: mockEdges,
        totalCount: 50,
        loading: true,
        error: 'Some error',
      };
      const newEdges = [mockEdge1];
      const payload = {
        edges: newEdges,
        totalCount: 200,
        hasNextPage: false,
        endCursor: null,
        totalTimeForAssignments: 10,
        totalCustomFieldAssignments: 5,
        totalStandardFieldAssignments: 3,
      };
      const state = customerAssignmentsReducer(
        stateWithData,
        setInitialData(payload),
      );
      expect(state.allItems).toEqual(newEdges);
      expect(state.totalCount).toBe(200);
      expect(state.hasMore).toBe(false);
      expect(state.endCursor).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle empty edges array', () => {
      const payload = {
        edges: [],
        totalCount: 0,
        hasNextPage: false,
        endCursor: null,
        totalTimeForAssignments: 0,
        totalCustomFieldAssignments: 0,
        totalStandardFieldAssignments: 0,
      };
      const state = customerAssignmentsReducer(
        initialState,
        setInitialData(payload),
      );
      expect(state.allItems).toEqual([]);
      expect(state.totalCount).toBe(0);
      expect(state.hasMore).toBe(false);
      expect(state.endCursor).toBeNull();
    });
  });

  describe('appendData', () => {
    it('should append new items and update pagination info', () => {
      const stateWithItems = {
        ...initialState,
        allItems: [mockEdge1],
        totalCount: 100,
      };
      const payload = {
        edges: [mockEdge2],
        hasNextPage: true,
        endCursor: 'cursor-new',
      };
      const state = customerAssignmentsReducer(
        stateWithItems,
        appendData(payload),
      );
      expect(state.allItems).toEqual(mockEdges);
      expect(state.allItems.length).toBe(2);
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBe('cursor-new');
      expect(state.loading).toBe(false);
    });

    it('should append to empty state', () => {
      const payload = {
        edges: mockEdges,
        hasNextPage: true,
        endCursor: 'cursor-abc',
      };
      const state = customerAssignmentsReducer(
        initialState,
        appendData(payload),
      );
      expect(state.allItems).toEqual(mockEdges);
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBe('cursor-abc');
    });

    it('should handle null end cursor', () => {
      const payload = {
        edges: mockEdges,
        hasNextPage: false,
        endCursor: null,
      };
      const state = customerAssignmentsReducer(
        initialState,
        appendData(payload),
      );
      expect(state.endCursor).toBeNull();
      expect(state.hasMore).toBe(false);
    });

    it('should set loading to false', () => {
      const stateLoading = { ...initialState, loading: true };
      const payload = {
        edges: mockEdges,
        hasNextPage: false,
        endCursor: null,
      };
      const state = customerAssignmentsReducer(
        stateLoading,
        appendData(payload),
      );
      expect(state.loading).toBe(false);
    });

    it('should update totalCount when provided', () => {
      const stateWithCount = {
        ...initialState,
        allItems: [mockEdge1],
        totalCount: 100,
      };
      const payload = {
        edges: [mockEdge2],
        hasNextPage: true,
        endCursor: 'cursor-new',
        totalCount: 50, // Updated total count (for search results)
      };
      const state = customerAssignmentsReducer(
        stateWithCount,
        appendData(payload),
      );
      expect(state.totalCount).toBe(50);
      expect(state.allItems.length).toBe(2);
    });

    it('should not update totalCount when not provided', () => {
      const stateWithCount = {
        ...initialState,
        allItems: [mockEdge1],
        totalCount: 100,
      };
      const payload = {
        edges: [mockEdge2],
        hasNextPage: true,
        endCursor: 'cursor-new',
        // totalCount not provided
      };
      const state = customerAssignmentsReducer(
        stateWithCount,
        appendData(payload),
      );
      expect(state.totalCount).toBe(100); // Should remain unchanged
      expect(state.allItems.length).toBe(2);
    });

    it('should ignore items with no ID', () => {
      const edgeWithoutId: TimeAgainstAssignmentSummaryEdge = {
        node: {
          timeAgainst: {
            timeAgainstContactDAS: {
              customer: undefined,
              project: undefined,
            },
            assigned: false,
            displayName: '',
            fullName: '',
            customerType: 'CUSTOMER',
            active: true,
            parentId: undefined,
            level: 0,
            numChildren: 0,
          },
          assignedTimeForCount: 0,
          assignedCustomFieldCount: 0,
          assignedStandardFieldCount: 0,
        },
        cursor: 'cursor-no-id',
      };
      const stateWithItems = {
        ...initialState,
        allItems: [mockEdge1],
      };
      const payload = {
        edges: [edgeWithoutId, mockEdge2],
        hasNextPage: false,
        endCursor: null,
      };
      const state = customerAssignmentsReducer(
        stateWithItems,
        appendData(payload),
      );
      // Should only add mockEdge2, not edgeWithoutId
      expect(state.allItems.length).toBe(2);
      expect(state.allItems).toEqual(mockEdges);
    });

    it('should handle project IDs', () => {
      const projectEdge: TimeAgainstAssignmentSummaryEdge = {
        node: {
          timeAgainst: {
            timeAgainstContactDAS: {
              customer: undefined,
              project: { id: 'proj-1' },
            },
            assigned: false,
            displayName: 'Project 1',
            fullName: 'Project 1 Full Name',
            customerType: 'PROJECT',
            active: true,
            parentId: 'cust-1',
            level: 1,
            numChildren: 0,
          },
          assignedTimeForCount: 0,
          assignedCustomFieldCount: 0,
          assignedStandardFieldCount: 0,
        },
        cursor: 'cursor-proj-1',
      };
      const payload = {
        edges: [projectEdge],
        hasNextPage: false,
        endCursor: null,
      };
      const state = customerAssignmentsReducer(
        initialState,
        appendData(payload),
      );
      expect(state.allItems.length).toBe(1);
      expect(state.allItems[0]).toEqual(projectEdge);
    });

    it('should replace existing item with updated data when ID matches', () => {
      const originalEdge: TimeAgainstAssignmentSummaryEdge = {
        node: {
          timeAgainst: {
            timeAgainstContactDAS: {
              customer: { id: 'cust-1' },
              project: undefined,
            },
            assigned: false,
            displayName: 'Customer 1',
            fullName: 'Customer 1 Full Name',
            customerType: 'CUSTOMER',
            active: true,
            parentId: undefined,
            level: 0,
            numChildren: 0,
          },
          assignedTimeForCount: 5,
          assignedCustomFieldCount: 2,
          assignedStandardFieldCount: 3,
        },
        cursor: 'cursor-1',
      };
      const updatedEdge: TimeAgainstAssignmentSummaryEdge = {
        node: {
          timeAgainst: {
            timeAgainstContactDAS: {
              customer: { id: 'cust-1' },
              project: undefined,
            },
            assigned: true,
            displayName: 'Customer 1 Updated',
            fullName: 'Customer 1 Updated Full Name',
            customerType: 'CUSTOMER',
            active: true,
            parentId: undefined,
            level: 0,
            numChildren: 0,
          },
          assignedTimeForCount: 10, // Updated count
          assignedCustomFieldCount: 5, // Updated count
          assignedStandardFieldCount: 4, // Updated count
        },
        cursor: 'cursor-1-updated',
      };
      const stateWithOriginal = {
        ...initialState,
        allItems: [originalEdge],
      };
      const payload = {
        edges: [updatedEdge],
        hasNextPage: false,
        endCursor: null,
      };
      const state = customerAssignmentsReducer(
        stateWithOriginal,
        appendData(payload),
      );
      // Should replace, not append
      expect(state.allItems.length).toBe(1);
      expect(state.allItems[0]).toEqual(updatedEdge);
      expect(state.allItems[0].node.assignedTimeForCount).toBe(10);
      expect(state.allItems[0].node.assignedCustomFieldCount).toBe(5);
      expect(state.allItems[0].node.timeAgainst.displayName).toBe(
        'Customer 1 Updated',
      );
    });

    it('should handle existing item with empty string ID when building map', () => {
      const edgeWithEmptyId: TimeAgainstAssignmentSummaryEdge = {
        node: {
          timeAgainst: {
            timeAgainstContactDAS: {
              customer: { id: '' }, // Empty string ID
              project: undefined,
            },
            assigned: false,
            displayName: 'Edge with Empty ID',
            fullName: 'Edge with Empty ID Full Name',
            customerType: 'CUSTOMER',
            active: true,
            parentId: undefined,
            level: 0,
            numChildren: 0,
          },
          assignedTimeForCount: 0,
          assignedCustomFieldCount: 0,
          assignedStandardFieldCount: 0,
        },
        cursor: 'cursor-empty',
      };
      const stateWithEmptyIdItem = {
        ...initialState,
        allItems: [edgeWithEmptyId, mockEdge1],
      };
      const payload = {
        edges: [mockEdge2],
        hasNextPage: false,
        endCursor: null,
      };
      const state = customerAssignmentsReducer(
        stateWithEmptyIdItem,
        appendData(payload),
      );
      // Should add mockEdge2, edgeWithEmptyId should remain (not in map due to empty ID)
      expect(state.allItems.length).toBe(3);
      expect(state.allItems).toContain(edgeWithEmptyId);
      expect(state.allItems).toContain(mockEdge1);
      expect(state.allItems).toContain(mockEdge2);
    });
  });

  describe('refreshPageData', () => {
    it('should upsert matching items by ID and update summary stats', () => {
      const stateWithItems = {
        ...initialState,
        allItems: [mockEdge1, mockEdge2],
        totalCount: 50,
        hasMore: true,
        endCursor: 'cursor-2',
        totalTimeForAssignments: 10,
        totalCustomFieldAssignments: 3,
        totalStandardFieldAssignments: 2,
      };

      const updatedEdge1: TimeAgainstAssignmentSummaryEdge = {
        ...mockEdge1,
        node: {
          ...mockEdge1.node,
          assignedTimeForCount: 99,
          timeAgainst: {
            ...mockEdge1.node.timeAgainst,
            assigned: true,
            displayName: 'Customer 1 Updated',
          },
        },
      };

      const payload = {
        edges: [updatedEdge1],
        totalCount: 45,
        totalTimeForAssignments: 20,
        totalCustomFieldAssignments: 7,
        totalStandardFieldAssignments: 5,
      };

      const state = customerAssignmentsReducer(
        stateWithItems,
        refreshPageData(payload),
      );

      // Item at index 0 should be updated
      expect(state.allItems[0]).toEqual(updatedEdge1);
      expect(state.allItems[0].node.assignedTimeForCount).toBe(99);
      expect(state.allItems[0].node.timeAgainst.displayName).toBe(
        'Customer 1 Updated',
      );
      // Item at index 1 should be untouched
      expect(state.allItems[1]).toEqual(mockEdge2);
      // Counts updated
      expect(state.totalCount).toBe(45);
      expect(state.totalTimeForAssignments).toBe(20);
      expect(state.totalCustomFieldAssignments).toBe(7);
      expect(state.totalStandardFieldAssignments).toBe(5);
      // Cursor and hasMore preserved
      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBe('cursor-2');
      // Loading cleared
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should skip edges whose ID does not exist in allItems', () => {
      const stateWithItems = {
        ...initialState,
        allItems: [mockEdge1],
      };

      const payload = {
        edges: [mockEdge2], // cust-2 not in allItems
        totalCount: 1,
        totalTimeForAssignments: 5,
        totalCustomFieldAssignments: 1,
        totalStandardFieldAssignments: 1,
      };

      const state = customerAssignmentsReducer(
        stateWithItems,
        refreshPageData(payload),
      );

      // allItems should be unchanged (no insert, only update existing)
      expect(state.allItems.length).toBe(1);
      expect(state.allItems[0]).toEqual(mockEdge1);
    });

    it('should handle project-based IDs', () => {
      const projectEdge: TimeAgainstAssignmentSummaryEdge = {
        node: {
          timeAgainst: {
            timeAgainstContactDAS: {
              customer: undefined,
              project: { id: 'proj-1' },
            },
            assigned: false,
            displayName: 'Project 1',
            fullName: 'Project 1 Full',
            customerType: 'PROJECT',
            active: true,
            parentId: 'cust-1',
            level: 1,
            numChildren: 0,
          },
          assignedTimeForCount: 0,
          assignedCustomFieldCount: 0,
          assignedStandardFieldCount: 0,
        },
        cursor: 'cursor-proj-1',
      };

      const updatedProjectEdge: TimeAgainstAssignmentSummaryEdge = {
        ...projectEdge,
        node: {
          ...projectEdge.node,
          assignedTimeForCount: 10,
          timeAgainst: {
            ...projectEdge.node.timeAgainst,
            assigned: true,
          },
        },
      };

      const stateWithProject = {
        ...initialState,
        allItems: [projectEdge],
      };

      const payload = {
        edges: [updatedProjectEdge],
        totalCount: 1,
        totalTimeForAssignments: 10,
        totalCustomFieldAssignments: 0,
        totalStandardFieldAssignments: 0,
      };

      const state = customerAssignmentsReducer(
        stateWithProject,
        refreshPageData(payload),
      );

      expect(state.allItems.length).toBe(1);
      expect(state.allItems[0].node.assignedTimeForCount).toBe(10);
      expect(state.allItems[0].node.timeAgainst.assigned).toBe(true);
    });

    it('should skip edges with no ID', () => {
      const edgeWithNoId: TimeAgainstAssignmentSummaryEdge = {
        node: {
          timeAgainst: {
            timeAgainstContactDAS: {
              customer: undefined,
              project: undefined,
            },
            assigned: false,
            displayName: '',
            fullName: '',
            customerType: 'CUSTOMER',
            active: true,
            parentId: undefined,
            level: 0,
            numChildren: 0,
          },
          assignedTimeForCount: 0,
          assignedCustomFieldCount: 0,
          assignedStandardFieldCount: 0,
        },
        cursor: 'cursor-no-id',
      };

      const stateWithItems = {
        ...initialState,
        allItems: [mockEdge1],
      };

      const payload = {
        edges: [edgeWithNoId],
        totalCount: 1,
        totalTimeForAssignments: 0,
        totalCustomFieldAssignments: 0,
        totalStandardFieldAssignments: 0,
      };

      const state = customerAssignmentsReducer(
        stateWithItems,
        refreshPageData(payload),
      );

      expect(state.allItems.length).toBe(1);
      expect(state.allItems[0]).toEqual(mockEdge1);
    });

    it('should set loading to false and clear error', () => {
      const stateLoading = {
        ...initialState,
        allItems: [mockEdge1],
        loading: true,
        error: 'previous error',
      };

      const payload = {
        edges: [],
        totalCount: 1,
        totalTimeForAssignments: 0,
        totalCustomFieldAssignments: 0,
        totalStandardFieldAssignments: 0,
      };

      const state = customerAssignmentsReducer(
        stateLoading,
        refreshPageData(payload),
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should preserve hasMore and endCursor', () => {
      const stateWithCursor = {
        ...initialState,
        allItems: [mockEdge1],
        hasMore: true,
        endCursor: 'preserved-cursor',
      };

      const payload = {
        edges: [mockEdge1],
        totalCount: 10,
        totalTimeForAssignments: 5,
        totalCustomFieldAssignments: 2,
        totalStandardFieldAssignments: 1,
      };

      const state = customerAssignmentsReducer(
        stateWithCursor,
        refreshPageData(payload),
      );

      expect(state.hasMore).toBe(true);
      expect(state.endCursor).toBe('preserved-cursor');
    });
  });

  describe('setPageBeforeSearch', () => {
    it('should set page before search', () => {
      const state = customerAssignmentsReducer(
        initialState,
        setPageBeforeSearch(5),
      );
      expect(state.pageBeforeSearch).toBe(5);
    });

    it('should update existing page before search', () => {
      const stateWithPage = { ...initialState, pageBeforeSearch: 3 };
      const state = customerAssignmentsReducer(
        stateWithPage,
        setPageBeforeSearch(7),
      );
      expect(state.pageBeforeSearch).toBe(7);
    });

    it('should handle page 1', () => {
      const stateWithPage = { ...initialState, pageBeforeSearch: 10 };
      const state = customerAssignmentsReducer(
        stateWithPage,
        setPageBeforeSearch(1),
      );
      expect(state.pageBeforeSearch).toBe(1);
    });
  });

  describe('resetCustomerAssignmentsState', () => {
    it('should reset to initial state', () => {
      const modifiedState = {
        allItems: mockEdges,
        totalCount: 100,
        loading: true,
        error: 'Some error',
        hasMore: false,
        endCursor: 'cursor-123',
        totalTimeForAssignments: 50,
        totalCustomFieldAssignments: 12,
        totalStandardFieldAssignments: 8,
        pageBeforeSearch: 5,
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

  describe('selectors', () => {
    const mockRootState = {
      customerAssignments: {
        allItems: mockEdges,
        totalCount: 100,
        loading: true,
        error: 'Test error',
        hasMore: false,
        endCursor: 'cursor-xyz',
        totalTimeForAssignments: 50,
        totalCustomFieldAssignments: 12,
        totalStandardFieldAssignments: 8,
        pageBeforeSearch: 3,
      },
    };

    it('selectCustomerAssignmentsState should return entire state', () => {
      expect(selectCustomerAssignmentsState(mockRootState as any)).toEqual(
        mockRootState.customerAssignments,
      );
    });

    it('selectCustomerAssignmentsAllItems should return all items', () => {
      expect(selectCustomerAssignmentsAllItems(mockRootState as any)).toEqual(
        mockEdges,
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

    it('selectCustomerAssignmentsError should return error', () => {
      expect(selectCustomerAssignmentsError(mockRootState as any)).toBe(
        'Test error',
      );
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

    it('selectCustomerAssignmentsPageBeforeSearch should return page before search', () => {
      expect(
        selectCustomerAssignmentsPageBeforeSearch(mockRootState as any),
      ).toBe(3);
    });

    it('selectCustomerAssignmentsSummaryStats should return summary stats', () => {
      const stats = selectCustomerAssignmentsSummaryStats(mockRootState as any);
      expect(stats).toEqual({
        totalTimeForAssignments: 50,
        totalCustomFieldAssignments: 12,
        totalStandardFieldAssignments: 8,
      });
    });

    it('selectCustomerAssignmentsPaginated should return paginated items', () => {
      const paginated = selectCustomerAssignmentsPaginated(
        mockRootState as any,
        1,
        1,
      );
      expect(paginated.length).toBe(1);
      expect(paginated[0]).toEqual(mockEdges[0]);
    });

    it('selectCustomerAssignmentsPaginated should return correct page', () => {
      const paginated = selectCustomerAssignmentsPaginated(
        mockRootState as any,
        2,
        1,
      );
      expect(paginated.length).toBe(1);
      expect(paginated[0]).toEqual(mockEdges[1]);
    });

    it('selectCustomerAssignmentsPaginated should handle empty results', () => {
      const paginated = selectCustomerAssignmentsPaginated(
        mockRootState as any,
        10,
        10,
      );
      expect(paginated.length).toBe(0);
    });

    it('selectCustomerAssignmentsPaginated should handle page size larger than total', () => {
      const paginated = selectCustomerAssignmentsPaginated(
        mockRootState as any,
        1,
        100,
      );
      expect(paginated.length).toBe(2);
      expect(paginated).toEqual(mockEdges);
    });

    it('selectCustomerAssignmentsPaginated should handle partial last page', () => {
      const stateWith3Items = {
        customerAssignments: {
          ...mockRootState.customerAssignments,
          allItems: [mockEdge1, mockEdge2, mockEdge1],
        },
      };
      const paginated = selectCustomerAssignmentsPaginated(
        stateWith3Items as any,
        2,
        2,
      );
      expect(paginated.length).toBe(1);
    });
  });
});
