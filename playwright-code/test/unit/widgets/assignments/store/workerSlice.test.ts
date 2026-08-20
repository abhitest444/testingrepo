import workerReducer, {
  setWorkers,
  addWorker,
  updateWorker,
  removeWorker,
  setSelectedWorkers,
  toggleWorkerSelection,
  clearSelectedWorkers,
  setSearchText,
  setWorkerStatus,
  setRoleFilter,
  clearFilters,
  toggleShowInactiveWorkers,
  setShowInactiveWorkers,
  setLoading,
  setError,
  clearError,
  selectAllWorkers,
  selectFilteredWorkers,
  selectActiveWorkers,
  selectInactiveWorkers,
  selectSelectedWorkers,
  selectWorkersCount,
  selectFilteredWorkersCount,
  selectSelectedWorkersCount,
  Worker,
} from 'src/js/widgets/assignments/store/workerSlice';

describe('workerSlice', () => {
  const mockWorker1: Worker = {
    id: '1',
    name: 'Alice Doe',
    email: 'alice@example.com',
    role: 'developer',
    isActive: true,
    assignmentCount: 5,
  };

  const mockWorker2: Worker = {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'designer',
    isActive: true,
    assignmentCount: 3,
  };

  const mockWorker3: Worker = {
    id: '3',
    name: 'Charlie Johnson',
    email: 'charlie@example.com',
    role: 'developer',
    isActive: false,
    assignmentCount: 0,
  };

  const initialState = {
    workers: {
      ids: [],
      entities: {},
    },
    selectedWorkerIds: [],
    filters: {
      searchText: '',
      workerStatus: 'all' as const,
      roleFilter: [],
    },
    loading: false,
    error: null,
    showInactiveWorkers: false,
  };

  describe('reducers', () => {
    describe('setWorkers', () => {
      it('should set all workers', () => {
        const state = workerReducer(
          initialState,
          setWorkers([mockWorker1, mockWorker2]),
        );

        expect(state.workers.ids).toEqual(['1', '2']);
        expect(state.workers.entities['1']).toEqual(mockWorker1);
        expect(state.workers.entities['2']).toEqual(mockWorker2);
      });

      it('should replace existing workers', () => {
        const stateWithWorkers = workerReducer(
          initialState,
          setWorkers([mockWorker1]),
        );
        const newState = workerReducer(
          stateWithWorkers,
          setWorkers([mockWorker2, mockWorker3]),
        );

        expect(newState.workers.ids).toEqual(['2', '3']);
        expect(newState.workers.entities['1']).toBeUndefined();
      });
    });

    describe('addWorker', () => {
      it('should add a new worker', () => {
        const state = workerReducer(initialState, addWorker(mockWorker1));

        expect(state.workers.ids).toContain('1');
        expect(state.workers.entities['1']).toEqual(mockWorker1);
      });

      it('should add multiple workers', () => {
        let state = workerReducer(initialState, addWorker(mockWorker1));
        state = workerReducer(state, addWorker(mockWorker2));

        expect(state.workers.ids).toEqual(['1', '2']);
      });
    });

    describe('updateWorker', () => {
      it('should update worker properties', () => {
        const stateWithWorker = workerReducer(
          initialState,
          setWorkers([mockWorker1]),
        );
        const state = workerReducer(
          stateWithWorker,
          updateWorker({ id: '1', changes: { name: 'Alice Updated' } }),
        );

        expect(state.workers.entities['1']?.name).toBe('Alice Updated');
        expect(state.workers.entities['1']?.email).toBe('alice@example.com');
      });

      it('should update isActive status', () => {
        const stateWithWorker = workerReducer(
          initialState,
          setWorkers([mockWorker1]),
        );
        const state = workerReducer(
          stateWithWorker,
          updateWorker({ id: '1', changes: { isActive: false } }),
        );

        expect(state.workers.entities['1']?.isActive).toBe(false);
      });
    });

    describe('removeWorker', () => {
      it('should remove a worker', () => {
        const stateWithWorkers = workerReducer(
          initialState,
          setWorkers([mockWorker1, mockWorker2]),
        );
        const state = workerReducer(stateWithWorkers, removeWorker('1'));

        expect(state.workers.ids).not.toContain('1');
        expect(state.workers.entities['1']).toBeUndefined();
        expect(state.workers.ids).toContain('2');
      });

      it('should remove worker from selectedWorkerIds', () => {
        const stateWithWorkers = workerReducer(
          initialState,
          setWorkers([mockWorker1, mockWorker2]),
        );
        const stateWithSelection = workerReducer(
          stateWithWorkers,
          setSelectedWorkers(['1', '2']),
        );
        const state = workerReducer(stateWithSelection, removeWorker('1'));

        expect(state.selectedWorkerIds).not.toContain('1');
        expect(state.selectedWorkerIds).toContain('2');
      });
    });

    describe('selection operations', () => {
      it('should set selected workers', () => {
        const state = workerReducer(
          initialState,
          setSelectedWorkers(['1', '2']),
        );

        expect(state.selectedWorkerIds).toEqual(['1', '2']);
      });

      it('should toggle worker selection - add', () => {
        const state = workerReducer(initialState, toggleWorkerSelection('1'));

        expect(state.selectedWorkerIds).toContain('1');
      });

      it('should toggle worker selection - remove', () => {
        const stateWithSelection = workerReducer(
          initialState,
          setSelectedWorkers(['1', '2']),
        );
        const state = workerReducer(
          stateWithSelection,
          toggleWorkerSelection('1'),
        );

        expect(state.selectedWorkerIds).not.toContain('1');
        expect(state.selectedWorkerIds).toContain('2');
      });

      it('should clear selected workers', () => {
        const stateWithSelection = workerReducer(
          initialState,
          setSelectedWorkers(['1', '2', '3']),
        );
        const state = workerReducer(stateWithSelection, clearSelectedWorkers());

        expect(state.selectedWorkerIds).toEqual([]);
      });
    });

    describe('filter operations', () => {
      it('should set search text', () => {
        const state = workerReducer(initialState, setSearchText('john'));

        expect(state.filters.searchText).toBe('john');
      });

      it('should set worker status filter', () => {
        const state = workerReducer(initialState, setWorkerStatus('active'));

        expect(state.filters.workerStatus).toBe('active');
      });

      it('should set role filter', () => {
        const state = workerReducer(
          initialState,
          setRoleFilter(['developer', 'designer']),
        );

        expect(state.filters.roleFilter).toEqual(['developer', 'designer']);
      });

      it('should clear all filters', () => {
        let state = workerReducer(initialState, setSearchText('test'));
        state = workerReducer(state, setWorkerStatus('inactive'));
        state = workerReducer(state, setRoleFilter(['developer']));
        state = workerReducer(state, clearFilters());

        expect(state.filters.searchText).toBe('');
        expect(state.filters.workerStatus).toBe('all');
        expect(state.filters.roleFilter).toEqual([]);
      });
    });

    describe('show inactive workers toggle', () => {
      it('should toggle show inactive workers', () => {
        const state = workerReducer(initialState, toggleShowInactiveWorkers());

        expect(state.showInactiveWorkers).toBe(true);

        const toggledState = workerReducer(state, toggleShowInactiveWorkers());
        expect(toggledState.showInactiveWorkers).toBe(false);
      });

      it('should set show inactive workers', () => {
        const state = workerReducer(initialState, setShowInactiveWorkers(true));

        expect(state.showInactiveWorkers).toBe(true);
      });
    });

    describe('loading and error states', () => {
      it('should set loading state', () => {
        const state = workerReducer(initialState, setLoading(true));

        expect(state.loading).toBe(true);
      });

      it('should set error message', () => {
        const state = workerReducer(
          initialState,
          setError('Failed to load workers'),
        );

        expect(state.error).toBe('Failed to load workers');
      });

      it('should clear error', () => {
        const stateWithError = workerReducer(
          initialState,
          setError('Some error'),
        );
        const state = workerReducer(stateWithError, clearError());

        expect(state.error).toBeNull();
      });
    });
  });

  describe('selectors', () => {
    const mockState = {
      workers: {
        workers: {
          ids: ['1', '2', '3'],
          entities: {
            '1': mockWorker1,
            '2': mockWorker2,
            '3': mockWorker3,
          },
        },
        selectedWorkerIds: ['1', '2'],
        filters: {
          searchText: '',
          workerStatus: 'all' as const,
          roleFilter: [],
        },
        loading: false,
        error: null,
        showInactiveWorkers: false,
      },
    };

    describe('selectAllWorkers', () => {
      it('should return all workers', () => {
        const workers = selectAllWorkers(mockState);

        expect(workers).toHaveLength(3);
        expect(workers).toContainEqual(mockWorker1);
        expect(workers).toContainEqual(mockWorker2);
        expect(workers).toContainEqual(mockWorker3);
      });
    });

    describe('selectActiveWorkers', () => {
      it('should return only active workers', () => {
        const workers = selectActiveWorkers(mockState);

        expect(workers).toHaveLength(2);
        expect(workers.every((w) => w.isActive)).toBe(true);
      });
    });

    describe('selectInactiveWorkers', () => {
      it('should return only inactive workers', () => {
        const workers = selectInactiveWorkers(mockState);

        expect(workers).toHaveLength(1);
        expect(workers[0].id).toBe('3');
        expect(workers[0].isActive).toBe(false);
      });
    });

    describe('selectFilteredWorkers', () => {
      it('should filter by search text - name', () => {
        const stateWithFilter = {
          ...mockState,
          workers: {
            ...mockState.workers,
            filters: { ...mockState.workers.filters, searchText: 'alice' },
          },
        };

        const workers = selectFilteredWorkers(stateWithFilter);

        expect(workers).toHaveLength(1);
        expect(
          workers.some((w) => w.name.toLowerCase().includes('alice')),
        ).toBe(true);
      });

      it('should filter by search text - email', () => {
        const stateWithFilter = {
          ...mockState,
          workers: {
            ...mockState.workers,
            filters: { ...mockState.workers.filters, searchText: 'bob@' },
          },
        };

        const workers = selectFilteredWorkers(stateWithFilter);

        expect(workers).toHaveLength(1);
        expect(workers[0].email).toContain('bob@');
      });

      it('should filter by worker status - active', () => {
        const stateWithFilter = {
          ...mockState,
          workers: {
            ...mockState.workers,
            filters: {
              ...mockState.workers.filters,
              workerStatus: 'active' as const,
            },
          },
        };

        const workers = selectFilteredWorkers(stateWithFilter);

        expect(workers).toHaveLength(2);
        expect(workers.every((w) => w.isActive)).toBe(true);
      });

      it('should filter by worker status - inactive', () => {
        const stateWithFilter = {
          ...mockState,
          workers: {
            ...mockState.workers,
            filters: {
              ...mockState.workers.filters,
              workerStatus: 'inactive' as const,
            },
            showInactiveWorkers: true,
          },
        };

        const workers = selectFilteredWorkers(stateWithFilter);

        expect(workers).toHaveLength(1);
        expect(workers[0].isActive).toBe(false);
      });

      it('should filter by role', () => {
        const stateWithFilter = {
          ...mockState,
          workers: {
            ...mockState.workers,
            filters: {
              ...mockState.workers.filters,
              roleFilter: ['developer'],
            },
            showInactiveWorkers: true,
          },
        };

        const workers = selectFilteredWorkers(stateWithFilter);

        expect(workers).toHaveLength(2);
        expect(workers.every((w) => w.role === 'developer')).toBe(true);
      });

      it('should filter by showInactiveWorkers toggle', () => {
        const stateWithFilter = {
          ...mockState,
          workers: {
            ...mockState.workers,
            showInactiveWorkers: false,
          },
        };

        const workers = selectFilteredWorkers(stateWithFilter);

        expect(workers).toHaveLength(2);
        expect(workers.every((w) => w.isActive)).toBe(true);
      });

      it('should apply multiple filters', () => {
        const stateWithFilters = {
          ...mockState,
          workers: {
            ...mockState.workers,
            filters: {
              searchText: 'alice',
              workerStatus: 'active' as const,
              roleFilter: ['developer'],
            },
          },
        };

        const workers = selectFilteredWorkers(stateWithFilters);

        expect(workers).toHaveLength(1);
        expect(workers[0].id).toBe('1');
      });
    });

    describe('selectSelectedWorkers', () => {
      it('should return selected workers', () => {
        const workers = selectSelectedWorkers(mockState);

        expect(workers).toHaveLength(2);
        expect(workers.map((w) => w.id)).toEqual(['1', '2']);
      });
    });

    describe('count selectors', () => {
      it('should return total workers count', () => {
        const count = selectWorkersCount(mockState);

        expect(count).toBe(3);
      });

      it('should return filtered workers count', () => {
        const stateWithFilter = {
          ...mockState,
          workers: {
            ...mockState.workers,
            filters: {
              ...mockState.workers.filters,
              workerStatus: 'active' as const,
            },
          },
        };

        const count = selectFilteredWorkersCount(stateWithFilter);

        expect(count).toBe(2);
      });

      it('should return selected workers count', () => {
        const count = selectSelectedWorkersCount(mockState);

        expect(count).toBe(2);
      });
    });
  });
});
