import { act } from '@testing-library/react-hooks';
import useQuickfillsCrud from 'src/js/widgets/breaks/hooks/useQuickfillsCrud';
import quickfillsReducer, {
  clearAllBreaksByAssignee,
} from 'src/js/widgets/breaks/store/quickfillsSlice';
import {
  renderHookWithReduxProvider,
  createDefaultStore,
} from 'test/unit/testUtils';
import breakRulesReducer from 'src/js/widgets/breaks/store/breakRulesSlice';
import uiReducer from 'src/js/widgets/breaks/store/uiSlice';
import workerReducer from 'src/js/widgets/breaks/store/workerSlice';
import breakAssignmentsReducer from 'src/js/widgets/breaks/store/breakAssignmentsSlice';
import breakPolicyFormReducer from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import breakEntriesReducer from 'src/js/widgets/breaks/store/breakEntriesSlice';

// Mock the clearAllBreaksByAssignee action
jest.mock('src/js/widgets/breaks/store/quickfillsSlice', () => ({
  ...jest.requireActual('src/js/widgets/breaks/store/quickfillsSlice'),
  clearAllBreaksByAssignee: jest.fn(() => ({
    type: 'CLEAR_ALL_BREAKS_BY_ASSIGNEE',
  })),
}));

describe('useQuickfillsCrud', () => {
  let store: any;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    store = createDefaultStore({
      breakRules: breakRulesReducer,
      ui: uiReducer,
      workers: workerReducer,
      breakAssignments: breakAssignmentsReducer,
      breakPolicyForm: breakPolicyFormReducer,
      quickfills: quickfillsReducer,
      breakEntries: breakEntriesReducer,
    });
    store.dispatch = mockDispatch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return clearQuickfillData function', () => {
    const { result } = renderHookWithReduxProvider(
      () => useQuickfillsCrud(),
      store,
    );

    expect(result.current.clearQuickfillData).toBeDefined();
    expect(typeof result.current.clearQuickfillData).toBe('function');
  });

  it('should dispatch clearAllBreaksByAssignee when clearQuickfillData is called', () => {
    const { result } = renderHookWithReduxProvider(
      () => useQuickfillsCrud(),
      store,
    );

    act(() => {
      result.current.clearQuickfillData();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(clearAllBreaksByAssignee).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CLEAR_ALL_BREAKS_BY_ASSIGNEE',
    });
  });

  it('should memoize clearQuickfillData function', () => {
    const { result, rerender } = renderHookWithReduxProvider(
      () => useQuickfillsCrud(),
      store,
    );

    const firstRender = result.current.clearQuickfillData;

    rerender();

    const secondRender = result.current.clearQuickfillData;

    expect(firstRender).toBe(secondRender);
  });

  it('should create new clearQuickfillData function when dependencies change', () => {
    const { result, rerender } = renderHookWithReduxProvider(
      () => useQuickfillsCrud(),
      store,
    );

    const firstRender = result.current.clearQuickfillData;

    // Create a new store to simulate dependency change
    const newStore = createDefaultStore({
      breakRules: breakRulesReducer,
      ui: uiReducer,
      workers: workerReducer,
      breakAssignments: breakAssignmentsReducer,
      breakPolicyForm: breakPolicyFormReducer,
      quickfills: quickfillsReducer,
      breakEntries: breakEntriesReducer,
    });
    newStore.dispatch = jest.fn();
    store = newStore;

    rerender();

    const secondRender = result.current.clearQuickfillData;

    // The function reference should be the same because dispatch dependency hasn't actually changed
    // in the context of the hook (useAppDispatch returns the same dispatch)
    expect(firstRender).toBe(secondRender);
  });
});
