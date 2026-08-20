import reducer, {
  setWorkerSummaryLoading,
  setWorkerSummaryError,
  setWorkerSummaryPage,
  resetWorkerSummary,
} from 'src/js/widgets/timeProject/store/workerSummarySlice';
import { WorkerSummarySliceState } from 'src/js/widgets/timeProject/types';

const initialState: WorkerSummarySliceState = {
  workers: [],
  loading: false,
  error: false,
  page: 1,
  hasNextPage: false,
};

describe('workerSummarySlice', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setWorkerSummaryLoading', () => {
    const state = reducer(initialState, setWorkerSummaryLoading(true));
    expect(state.loading).toBe(true);

    const state2 = reducer(state, setWorkerSummaryLoading(false));
    expect(state2.loading).toBe(false);
  });

  it('should handle setWorkerSummaryError and clear workers', () => {
    const stateWithWorkers: WorkerSummarySliceState = {
      ...initialState,
      workers: [{ id: '1', displayName: 'Alice', hoursWorked: 5 }],
    };
    const state = reducer(stateWithWorkers, setWorkerSummaryError(true));
    expect(state.error).toBe(true);
    expect(state.workers).toEqual([]);
  });

  it('should handle setWorkerSummaryError(false) without clearing workers', () => {
    const stateWithWorkers: WorkerSummarySliceState = {
      ...initialState,
      workers: [{ id: '1', displayName: 'Alice', hoursWorked: 5 }],
    };
    const state = reducer(stateWithWorkers, setWorkerSummaryError(false));
    expect(state.error).toBe(false);
    expect(state.workers).toEqual(stateWithWorkers.workers);
  });

  it('should handle setWorkerSummaryPage', () => {
    const workers = [
      { id: '1', displayName: 'Alice', hoursWorked: 2 },
      { id: '2', displayName: 'Bob', hoursWorked: 1 },
    ];
    const state = reducer(
      initialState,
      setWorkerSummaryPage({ workers, page: 2, hasNextPage: true }),
    );
    expect(state.workers).toEqual(workers);
    expect(state.page).toBe(2);
    expect(state.hasNextPage).toBe(true);
  });

  it('should handle resetWorkerSummary', () => {
    const modifiedState: WorkerSummarySliceState = {
      workers: [{ id: '1', displayName: 'Alice', hoursWorked: 2 }],
      loading: true,
      error: true,
      page: 3,
      hasNextPage: true,
    };
    const state = reducer(modifiedState, resetWorkerSummary());
    expect(state).toEqual(initialState);
  });
});
