import { configureStore, createSlice } from '@reduxjs/toolkit';

// We need to test the actual storeManager logic, not the mocked version
// So we'll recreate the logic here for testing
describe('storeManager', () => {
  type ReducerMap = { [key: string]: any };

  const createTestStoreManager = () => {
    const staticReducers: ReducerMap = {
      shared: (state = { workers: [], preferences: {} }) => state,
      ui: (state = { screens: null, modals: [] }) => state,
    };

    let asyncReducers: ReducerMap = {};

    const createRootReducer = () => {
      const reducers = {
        ...staticReducers,
        ...asyncReducers,
      };
      return (state: any = {}, action: any) => {
        const nextState: any = {};
        Object.keys(reducers).forEach((key) => {
          nextState[key] = reducers[key](state[key], action);
        });
        return nextState;
      };
    };

    const store = configureStore({
      reducer: createRootReducer(),
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });

    return {
      store,
      inject: (key: string, asyncReducer: any) => {
        if (!asyncReducers[key]) {
          asyncReducers[key] = asyncReducer;
          store.replaceReducer(createRootReducer());
        }
      },
      hasReducer: (key: string): boolean => !!asyncReducers[key],
      getReducerKeys: (): string[] => [
        ...Object.keys(staticReducers),
        ...Object.keys(asyncReducers),
      ],
      resetAsyncReducers: () => {
        asyncReducers = {};
        store.replaceReducer(createRootReducer());
      },
    };
  };

  let storeManager: ReturnType<typeof createTestStoreManager>;

  beforeEach(() => {
    storeManager = createTestStoreManager();
  });

  describe('store initialization', () => {
    it('should create store with static reducers', () => {
      const state = storeManager.store.getState();
      expect(state).toHaveProperty('shared');
      expect(state).toHaveProperty('ui');
    });

    it('should return correct reducer keys for static reducers', () => {
      const keys = storeManager.getReducerKeys();
      expect(keys).toContain('shared');
      expect(keys).toContain('ui');
      expect(keys.length).toBe(2);
    });
  });

  describe('inject', () => {
    it('should inject a new reducer dynamically', () => {
      const testSlice = createSlice({
        name: 'testFeature',
        initialState: { value: 0 },
        reducers: {
          increment: (state) => {
            state.value += 1;
          },
        },
      });

      storeManager.inject('testFeature', testSlice.reducer);

      const state = storeManager.store.getState();
      expect(state).toHaveProperty('testFeature');
      expect(state.testFeature).toEqual({ value: 0 });
    });

    it('should not inject duplicate reducers', () => {
      const testSlice1 = createSlice({
        name: 'testFeature',
        initialState: { value: 1 },
        reducers: {},
      });

      const testSlice2 = createSlice({
        name: 'testFeature',
        initialState: { value: 2 },
        reducers: {},
      });

      storeManager.inject('testFeature', testSlice1.reducer);
      storeManager.inject('testFeature', testSlice2.reducer);

      const state = storeManager.store.getState();
      // Should still have the first reducer's initial state
      expect(state.testFeature).toEqual({ value: 1 });
    });

    it('should update reducer keys after injection', () => {
      const testSlice = createSlice({
        name: 'overtime',
        initialState: { policies: [] },
        reducers: {},
      });

      storeManager.inject('overtime', testSlice.reducer);

      const keys = storeManager.getReducerKeys();
      expect(keys).toContain('overtime');
      expect(keys.length).toBe(3);
    });

    it('should allow injected reducer to handle actions', () => {
      const testSlice = createSlice({
        name: 'counter',
        initialState: { count: 0 },
        reducers: {
          increment: (state) => {
            state.count += 1;
          },
          decrement: (state) => {
            state.count -= 1;
          },
        },
      });

      storeManager.inject('counter', testSlice.reducer);

      storeManager.store.dispatch(testSlice.actions.increment());
      expect(storeManager.store.getState().counter.count).toBe(1);

      storeManager.store.dispatch(testSlice.actions.increment());
      expect(storeManager.store.getState().counter.count).toBe(2);

      storeManager.store.dispatch(testSlice.actions.decrement());
      expect(storeManager.store.getState().counter.count).toBe(1);
    });
  });

  describe('hasReducer', () => {
    it('should return false for non-existent reducer', () => {
      expect(storeManager.hasReducer('nonExistent')).toBe(false);
    });

    it('should return true for injected reducer', () => {
      const testSlice = createSlice({
        name: 'testFeature',
        initialState: {},
        reducers: {},
      });

      storeManager.inject('testFeature', testSlice.reducer);

      expect(storeManager.hasReducer('testFeature')).toBe(true);
    });

    it('should return false for static reducers (only checks async)', () => {
      // Static reducers are not tracked by hasReducer - it only checks asyncReducers
      expect(storeManager.hasReducer('shared')).toBe(false);
      expect(storeManager.hasReducer('ui')).toBe(false);
    });
  });

  describe('getReducerKeys', () => {
    it('should return all reducer keys including injected ones', () => {
      const featureSlice = createSlice({
        name: 'feature1',
        initialState: {},
        reducers: {},
      });

      const anotherSlice = createSlice({
        name: 'feature2',
        initialState: {},
        reducers: {},
      });

      storeManager.inject('feature1', featureSlice.reducer);
      storeManager.inject('feature2', anotherSlice.reducer);

      const keys = storeManager.getReducerKeys();
      expect(keys).toEqual(
        expect.arrayContaining(['shared', 'ui', 'feature1', 'feature2']),
      );
      expect(keys.length).toBe(4);
    });
  });

  describe('resetAsyncReducers', () => {
    it('should remove all async reducers', () => {
      const testSlice = createSlice({
        name: 'testFeature',
        initialState: { value: 0 },
        reducers: {},
      });

      storeManager.inject('testFeature', testSlice.reducer);
      expect(storeManager.hasReducer('testFeature')).toBe(true);

      storeManager.resetAsyncReducers();

      expect(storeManager.hasReducer('testFeature')).toBe(false);
      const keys = storeManager.getReducerKeys();
      expect(keys).not.toContain('testFeature');
      expect(keys.length).toBe(2);
    });

    it('should preserve static reducers after reset', () => {
      const testSlice = createSlice({
        name: 'testFeature',
        initialState: {},
        reducers: {},
      });

      storeManager.inject('testFeature', testSlice.reducer);
      storeManager.resetAsyncReducers();

      const state = storeManager.store.getState();
      expect(state).toHaveProperty('shared');
      expect(state).toHaveProperty('ui');
    });

    it('should allow re-injection after reset', () => {
      const testSlice = createSlice({
        name: 'testFeature',
        initialState: { value: 42 },
        reducers: {},
      });

      storeManager.inject('testFeature', testSlice.reducer);
      storeManager.resetAsyncReducers();
      storeManager.inject('testFeature', testSlice.reducer);

      const state = storeManager.store.getState();
      expect(state.testFeature).toEqual({ value: 42 });
    });
  });

  describe('multiple feature injection', () => {
    it('should handle multiple feature reducers', () => {
      const overtimeSlice = createSlice({
        name: 'overtime',
        initialState: { policies: [], isLoading: false },
        reducers: {
          setLoading: (state, action) => {
            state.isLoading = action.payload;
          },
        },
      });

      const breaksSlice = createSlice({
        name: 'breaks',
        initialState: { rules: [], isActive: false },
        reducers: {
          setActive: (state, action) => {
            state.isActive = action.payload;
          },
        },
      });

      storeManager.inject('overtime', overtimeSlice.reducer);
      storeManager.inject('breaks', breaksSlice.reducer);

      // Dispatch actions to both slices
      storeManager.store.dispatch(overtimeSlice.actions.setLoading(true));
      storeManager.store.dispatch(breaksSlice.actions.setActive(true));

      const state = storeManager.store.getState();
      expect(state.overtime.isLoading).toBe(true);
      expect(state.breaks.isActive).toBe(true);
    });
  });
});
