import workersReducer, {
  setWorkers,
  setWorkersLoading,
  setWorkersError,
  resetWorkers,
  Worker,
} from 'src/js/widgets/qbtOrchestrator/store/shared/workersSlice';

describe('workersSlice', () => {
  const initialState = {
    workers: [],
    isLoading: false,
    error: null,
  };

  const mockWorkers: Worker[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', isActive: true },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', isActive: true },
    {
      id: '3',
      name: 'Bob Johnson',
      workerType: 'contractor',
      isActive: false,
    },
  ];

  describe('reducers', () => {
    describe('setWorkers', () => {
      it('should set workers array', () => {
        const state = workersReducer(initialState, setWorkers(mockWorkers));

        expect(state.workers).toEqual(mockWorkers);
        expect(state.workers).toHaveLength(3);
      });

      it('should clear loading state when setting workers', () => {
        const loadingState = { ...initialState, isLoading: true };
        const state = workersReducer(loadingState, setWorkers(mockWorkers));

        expect(state.isLoading).toBe(false);
      });

      it('should clear error when setting workers', () => {
        const errorState = { ...initialState, error: 'Previous error' };
        const state = workersReducer(errorState, setWorkers(mockWorkers));

        expect(state.error).toBeNull();
      });

      it('should replace existing workers', () => {
        const stateWithWorkers = { ...initialState, workers: mockWorkers };
        const newWorkers = [{ id: '4', name: 'New Worker' }];

        const state = workersReducer(stateWithWorkers, setWorkers(newWorkers));

        expect(state.workers).toEqual(newWorkers);
        expect(state.workers).toHaveLength(1);
      });

      it('should handle empty array', () => {
        const stateWithWorkers = { ...initialState, workers: mockWorkers };
        const state = workersReducer(stateWithWorkers, setWorkers([]));

        expect(state.workers).toEqual([]);
      });
    });

    describe('setWorkersLoading', () => {
      it('should set loading to true', () => {
        const state = workersReducer(initialState, setWorkersLoading(true));

        expect(state.isLoading).toBe(true);
      });

      it('should set loading to false', () => {
        const loadingState = { ...initialState, isLoading: true };
        const state = workersReducer(loadingState, setWorkersLoading(false));

        expect(state.isLoading).toBe(false);
      });

      it('should preserve workers when setting loading', () => {
        const stateWithWorkers = {
          ...initialState,
          workers: mockWorkers,
          isLoading: false,
        };
        const state = workersReducer(stateWithWorkers, setWorkersLoading(true));

        expect(state.workers).toEqual(mockWorkers);
      });
    });

    describe('setWorkersError', () => {
      it('should set error message', () => {
        const errorMessage = 'Failed to fetch workers';
        const state = workersReducer(
          initialState,
          setWorkersError(errorMessage),
        );

        expect(state.error).toBe(errorMessage);
      });

      it('should clear loading when setting error', () => {
        const loadingState = { ...initialState, isLoading: true };
        const state = workersReducer(
          loadingState,
          setWorkersError('Error occurred'),
        );

        expect(state.isLoading).toBe(false);
      });

      it('should clear error when set to null', () => {
        const errorState = { ...initialState, error: 'Previous error' };
        const state = workersReducer(errorState, setWorkersError(null));

        expect(state.error).toBeNull();
      });
    });

    describe('resetWorkers', () => {
      it('should reset to initial state', () => {
        const modifiedState = {
          workers: mockWorkers,
          isLoading: true,
          error: 'Some error',
        };

        const state = workersReducer(modifiedState, resetWorkers());

        expect(state).toEqual(initialState);
      });
    });
  });

  describe('Worker type validation', () => {
    it('should handle workers with all optional fields', () => {
      const fullWorker: Worker = {
        id: '1',
        name: 'Full Worker',
        email: 'full@example.com',
        workerType: 'employee',
        isActive: true,
      };

      const state = workersReducer(initialState, setWorkers([fullWorker]));

      expect(state.workers[0]).toEqual(fullWorker);
    });

    it('should handle workers with minimal fields', () => {
      const minimalWorker: Worker = {
        id: '2',
        name: 'Minimal Worker',
      };

      const state = workersReducer(initialState, setWorkers([minimalWorker]));

      expect(state.workers[0].id).toBe('2');
      expect(state.workers[0].name).toBe('Minimal Worker');
      expect(state.workers[0].email).toBeUndefined();
    });
  });
});
