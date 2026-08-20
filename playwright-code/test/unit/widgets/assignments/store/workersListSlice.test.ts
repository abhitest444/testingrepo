import workersListReducer, {
  setWorkers,
  setError,
  setCurrentPage,
  resetCurrentPage,
  setHeaderTotalCount,
  selectWorkersListState,
  selectWorkersListWorkers,
  selectWorkersListPageInfo,
  selectWorkersListLoading,
  selectWorkersListError,
  selectWorkersListCurrentPage,
  selectActiveWorkersListWorkers,
  selectInactiveWorkersListWorkers,
  selectWorkersListHeaderTotalCount,
  WorkerNode,
} from 'src/js/widgets/assignments/store/workersListSlice';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import type { RootState } from 'src/js/widgets/assignments/store';

describe('workersListSlice', () => {
  const mockWorker1: WorkerNode = {
    id: '1',
    displayName: 'Alice Johnson',
    firstName: 'Alice',
    lastName: 'Johnson',
    type: TimeTracking_TimeForType.Employee,
    isActive: true,
    memberOfGroup: { id: 'g1', name: 'Engineering', isActive: true },
    managesGroups: [],
  };

  const mockWorker2: WorkerNode = {
    id: '2',
    displayName: 'Bob Smith',
    firstName: 'Bob',
    lastName: 'Smith',
    type: TimeTracking_TimeForType.Vendor,
    isActive: true,
    memberOfGroup: undefined,
    managesGroups: [],
  } as any;

  const mockWorker3: WorkerNode = {
    id: '3',
    displayName: 'Charlie Brown',
    firstName: 'Charlie',
    lastName: 'Brown',
    type: TimeTracking_TimeForType.Employee,
    isActive: false,
    memberOfGroup: { id: 'g2', name: 'Marketing', isActive: true },
    managesGroups: [],
  };

  const initialState = {
    workers: [],
    pageInfo: null,
    loading: false,
    error: null,
    currentPage: 1,
    headerTotalCount: 0,
  };

  describe('Reducers', () => {
    describe('setWorkers', () => {
      it('should set workers array', () => {
        const state = workersListReducer(
          initialState,
          setWorkers([mockWorker1, mockWorker2]),
        );

        expect(state.workers).toHaveLength(2);
        expect(state.workers[0].displayName).toBe('Alice Johnson');
        expect(state.workers[1].displayName).toBe('Bob Smith');
      });

      it('should replace existing workers', () => {
        const stateWithWorkers = {
          ...initialState,
          workers: [mockWorker3],
        };

        const state = workersListReducer(
          stateWithWorkers,
          setWorkers([mockWorker1]),
        );

        expect(state.workers).toHaveLength(1);
        expect(state.workers[0].displayName).toBe('Alice Johnson');
      });

      it('should handle empty array', () => {
        const stateWithWorkers = {
          ...initialState,
          workers: [mockWorker1, mockWorker2],
        };

        const state = workersListReducer(stateWithWorkers, setWorkers([]));

        expect(state.workers).toHaveLength(0);
      });
    });

    describe('setError', () => {
      it('should set error message', () => {
        const state = workersListReducer(
          initialState,
          setError('Network error'),
        );

        expect(state.error).toBe('Network error');
      });

      it('should replace existing error', () => {
        const stateWithError = {
          ...initialState,
          error: 'Old error',
        };

        const state = workersListReducer(stateWithError, setError('New error'));

        expect(state.error).toBe('New error');
      });

      it('should set error to null', () => {
        const state = workersListReducer(initialState, setError(null));
        expect(state.error).toBeNull();
      });
    });

    describe('setCurrentPage', () => {
      it('should set current page', () => {
        const state = workersListReducer(initialState, setCurrentPage(5));

        expect(state.currentPage).toBe(5);
      });

      it('should update current page from existing value', () => {
        const stateWithPage = {
          ...initialState,
          currentPage: 2,
        };

        const state = workersListReducer(stateWithPage, setCurrentPage(10));

        expect(state.currentPage).toBe(10);
      });

      it('should accept page 1', () => {
        const stateWithPage = {
          ...initialState,
          currentPage: 5,
        };

        const state = workersListReducer(stateWithPage, setCurrentPage(1));

        expect(state.currentPage).toBe(1);
      });
    });

    describe('resetCurrentPage', () => {
      it('should reset current page to 1', () => {
        const stateWithPage = {
          ...initialState,
          currentPage: 10,
        };

        const state = workersListReducer(stateWithPage, resetCurrentPage());

        expect(state.currentPage).toBe(1);
      });

      it('should not change if already at page 1', () => {
        const state = workersListReducer(initialState, resetCurrentPage());

        expect(state.currentPage).toBe(1);
      });
    });
  });

  describe('Selectors', () => {
    const mockRootState = {
      workersList: {
        workers: [mockWorker1, mockWorker2, mockWorker3],
        pageInfo: { hasNextPage: false, hasPreviousPage: false } as any,
        loading: false,
        error: null,
        currentPage: 2,
      },
    } as RootState;

    describe('selectWorkersListState', () => {
      it('should select the entire workersList state', () => {
        const result = selectWorkersListState(mockRootState);
        expect(result).toEqual(mockRootState.workersList);
      });
    });

    describe('selectWorkersListWorkers', () => {
      it('should select workers array', () => {
        const result = selectWorkersListWorkers(mockRootState);
        expect(result).toHaveLength(3);
        expect(result[0].displayName).toBe('Alice Johnson');
      });
    });

    describe('selectWorkersListPageInfo', () => {
      it('should select pageInfo', () => {
        const result = selectWorkersListPageInfo(mockRootState);
        expect(result).toEqual({
          hasNextPage: false,
          hasPreviousPage: false,
        });
      });
    });

    describe('selectWorkersListLoading', () => {
      it('should select loading state', () => {
        const result = selectWorkersListLoading(mockRootState);
        expect(result).toBe(false);
      });

      it('should return true when loading', () => {
        const loadingState = {
          ...mockRootState,
          workersList: {
            ...mockRootState.workersList,
            loading: true,
          },
        } as RootState;

        const result = selectWorkersListLoading(loadingState);
        expect(result).toBe(true);
      });
    });

    describe('selectWorkersListError', () => {
      it('should select error', () => {
        const result = selectWorkersListError(mockRootState);
        expect(result).toBeNull();
      });

      it('should return error message when present', () => {
        const errorState = {
          ...mockRootState,
          workersList: {
            ...mockRootState.workersList,
            error: 'Network error',
          },
        } as RootState;

        const result = selectWorkersListError(errorState);
        expect(result).toBe('Network error');
      });
    });

    describe('selectWorkersListCurrentPage', () => {
      it('should return current page', () => {
        const result = selectWorkersListCurrentPage(mockRootState);
        expect(result).toBe(2);
      });

      it('should return page 1 for initial state', () => {
        const initialStateRoot = {
          ...mockRootState,
          workersList: {
            ...mockRootState.workersList,
            currentPage: 1,
          },
        } as RootState;

        const result = selectWorkersListCurrentPage(initialStateRoot);
        expect(result).toBe(1);
      });
    });

    describe('selectActiveWorkersListWorkers', () => {
      it('should return only active workers', () => {
        const result = selectActiveWorkersListWorkers(mockRootState);
        expect(result).toHaveLength(2);
        expect(result.every((w) => w.isActive)).toBe(true);
      });
    });

    describe('selectInactiveWorkersListWorkers', () => {
      it('should return only inactive workers', () => {
        const result = selectInactiveWorkersListWorkers(mockRootState);
        expect(result).toHaveLength(1);
        expect(result[0].displayName).toBe('Charlie Brown');
        expect(result[0].isActive).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined state gracefully', () => {
      const state = workersListReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });

    it('should handle multiple updates in sequence', () => {
      let state: any = initialState;
      state = workersListReducer(state, setWorkers([mockWorker1, mockWorker2]));
      state = workersListReducer(state, setCurrentPage(3));
      state = workersListReducer(state, setError('Test error'));
      state = workersListReducer(state, resetCurrentPage());

      expect(state.workers).toHaveLength(2);
      expect(state.currentPage).toBe(1);
      expect(state.error).toBe('Test error');
    });

    it('should maintain immutability', () => {
      const state1 = workersListReducer(
        initialState,
        setWorkers([mockWorker1]),
      );
      const state2 = workersListReducer(state1, setCurrentPage(5));

      expect(state1.workers).toHaveLength(1);
      expect(state1.currentPage).toBe(1); // Unchanged
      expect(state2.currentPage).toBe(5);
      expect(state1).not.toBe(state2);
    });

    it('should handle setting workers to empty array', () => {
      const stateWithWorkers = {
        ...initialState,
        workers: [mockWorker1, mockWorker2],
        currentPage: 5,
      };

      const state = workersListReducer(stateWithWorkers, setWorkers([]));

      expect(state.workers).toHaveLength(0);
      expect(state.currentPage).toBe(5); // Should not reset page
    });

    it('should handle page navigation', () => {
      let state: any = initialState;
      state = workersListReducer(state, setCurrentPage(1));
      state = workersListReducer(state, setCurrentPage(2));
      state = workersListReducer(state, setCurrentPage(3));
      state = workersListReducer(state, resetCurrentPage());

      expect(state.currentPage).toBe(1);
    });
  });

  describe('headerTotalCount', () => {
    it('should have initial headerTotalCount of 0', () => {
      const state = workersListReducer(undefined, { type: 'unknown' });
      expect(state.headerTotalCount).toBe(0);
    });

    it('should set headerTotalCount', () => {
      const state = workersListReducer(initialState, setHeaderTotalCount(150));
      expect(state.headerTotalCount).toBe(150);
    });

    it('should update headerTotalCount', () => {
      const state1 = workersListReducer(initialState, setHeaderTotalCount(100));
      const state2 = workersListReducer(state1, setHeaderTotalCount(200));
      expect(state2.headerTotalCount).toBe(200);
    });
  });

  describe('selectWorkersListHeaderTotalCount', () => {
    it('should select headerTotalCount from state', () => {
      const state = workersListReducer(initialState, setHeaderTotalCount(150));
      const rootState = { workersList: state } as any;
      expect(selectWorkersListHeaderTotalCount(rootState)).toBe(150);
    });

    it('should return 0 when headerTotalCount is not set', () => {
      const rootState = { workersList: initialState } as any;
      expect(selectWorkersListHeaderTotalCount(rootState)).toBe(0);
    });
  });
});
