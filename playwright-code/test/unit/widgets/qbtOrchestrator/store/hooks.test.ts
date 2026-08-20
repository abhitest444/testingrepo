import { configureStore, createSlice, EnhancedStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/qbtOrchestrator/store/hooks';

// Import mocked functions

// Mock react-redux hooks for unit testing
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const mockedUseDispatch = useDispatch as jest.MockedFunction<
  typeof useDispatch
>;
const mockedUseSelector = useSelector as jest.MockedFunction<
  typeof useSelector
>;

describe('Redux Hooks', () => {
  // Create a test store for verification
  const createTestStore = () => {
    const testSlice = createSlice({
      name: 'test',
      initialState: { value: 0, message: '' },
      reducers: {
        increment: (state) => {
          state.value += 1;
        },
        decrement: (state) => {
          state.value -= 1;
        },
        setMessage: (state, action) => {
          state.message = action.payload;
        },
      },
    });

    const store = configureStore({
      reducer: {
        test: testSlice.reducer,
        shared: (state = {}) => state,
        ui: (state = {}) => state,
      },
    });

    return { store, actions: testSlice.actions };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAppDispatch', () => {
    it('should return dispatch function from useDispatch', () => {
      const mockDispatch = jest.fn();
      mockedUseDispatch.mockReturnValue(mockDispatch);

      const result = useAppDispatch();

      expect(useDispatch).toHaveBeenCalled();
      expect(result).toBe(mockDispatch);
    });

    it('should be able to dispatch actions', () => {
      const { store, actions } = createTestStore();
      mockedUseDispatch.mockReturnValue(store.dispatch);

      const dispatch = useAppDispatch();
      dispatch(actions.increment());

      expect(store.getState().test.value).toBe(1);
    });

    it('should dispatch multiple actions', () => {
      const { store, actions } = createTestStore();
      mockedUseDispatch.mockReturnValue(store.dispatch);

      const dispatch = useAppDispatch();
      dispatch(actions.increment());
      dispatch(actions.increment());
      dispatch(actions.increment());
      dispatch(actions.decrement());

      expect(store.getState().test.value).toBe(2);
    });

    it('should dispatch actions with payloads', () => {
      const { store, actions } = createTestStore();
      mockedUseDispatch.mockReturnValue(store.dispatch);

      const dispatch = useAppDispatch();
      dispatch(actions.setMessage('Hello World'));

      expect(store.getState().test.message).toBe('Hello World');
    });
  });

  describe('useAppSelector', () => {
    it('should call useSelector with the provided selector', () => {
      const mockSelector = (state: any) => state.test.value;
      mockedUseSelector.mockImplementation((selector) =>
        selector({ test: { value: 42 } }),
      );

      const result = useAppSelector(mockSelector);

      expect(useSelector).toHaveBeenCalled();
      expect(result).toBe(42);
    });

    it('should select nested state', () => {
      const nestedState = {
        feature: {
          nested: {
            deeply: {
              value: 'deep value',
            },
          },
        },
      };
      mockedUseSelector.mockImplementation((selector) => selector(nestedState));

      const result = useAppSelector(
        (state: any) => state.feature.nested.deeply.value,
      );

      expect(result).toBe('deep value');
    });

    it('should work with derived selectors', () => {
      const state = { test: { value: 5, message: 'test' } };
      mockedUseSelector.mockImplementation((selector) => selector(state));

      const result = useAppSelector((s: any) => ({
        doubled: s.test.value * 2,
        isPositive: s.test.value > 0,
      }));

      expect(result.doubled).toBe(10);
      expect(result.isPositive).toBe(true);
    });

    it('should handle negative values', () => {
      const state = { test: { value: -1 } };
      mockedUseSelector.mockImplementation((selector) => selector(state));

      const result = useAppSelector((s: any) => ({
        doubled: s.test.value * 2,
        isPositive: s.test.value > 0,
      }));

      expect(result.doubled).toBe(-2);
      expect(result.isPositive).toBe(false);
    });
  });

  describe('hooks type safety', () => {
    it('useAppDispatch should be typed correctly', () => {
      const mockDispatch = jest.fn();
      mockedUseDispatch.mockReturnValue(mockDispatch);

      const dispatch = useAppDispatch();

      // Verify it's a function
      expect(typeof dispatch).toBe('function');
    });

    it('useAppSelector should accept selector functions', () => {
      mockedUseSelector.mockReturnValue({ permissions: {} });

      const result = useAppSelector((state: any) => state.shared);

      expect(result).toEqual({ permissions: {} });
    });
  });
});
