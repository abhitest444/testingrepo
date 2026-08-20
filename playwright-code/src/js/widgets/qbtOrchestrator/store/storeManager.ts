import {
  configureStore,
  combineReducers,
  Reducer,
  AnyAction,
} from '@reduxjs/toolkit';

// Static reducers - always loaded
import sharedReducer from './shared';
import uiReducer from './ui';
import overviewReducer from '../features/overview/store/overviewSlice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReducerMap = { [key: string]: Reducer<any, AnyAction> };

const staticReducers: ReducerMap = {
  shared: sharedReducer,
  ui: uiReducer,
  overview: overviewReducer,
};

const createStoreManager = () => {
  let asyncReducers: ReducerMap = {};

  const createRootReducer = () =>
    combineReducers({
      ...staticReducers,
      ...asyncReducers,
    });

  const store = configureStore({
    reducer: createRootReducer(),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      }),
    devTools:
      process.env.NODE_ENV !== 'production'
        ? { name: 'QBT Orchestrator Store' }
        : false,
  });

  return {
    store,

    /**
     * Dynamically inject a feature reducer
     * @param key - The slice key (e.g., 'overtime', 'breaks')
     * @param asyncReducer - The reducer to inject
     */
    inject: (key: string, asyncReducer: Reducer) => {
      if (!asyncReducers[key]) {
        asyncReducers[key] = asyncReducer;
        store.replaceReducer(createRootReducer());

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log(`[StoreManager] Injected reducer: ${key}`);
        }
      }
    },

    /**
     * Check if a reducer is already injected
     */
    hasReducer: (key: string): boolean => !!asyncReducers[key],

    /**
     * Get current reducer keys (for debugging)
     */
    getReducerKeys: (): string[] => [
      ...Object.keys(staticReducers),
      ...Object.keys(asyncReducers),
    ],

    /**
     * Reset async reducers (useful for testing)
     */
    resetAsyncReducers: () => {
      asyncReducers = {};
      store.replaceReducer(createRootReducer());
    },
  };
};

// Singleton export
export const storeManager = createStoreManager();
export type RootState = ReturnType<typeof storeManager.store.getState>;
export type AppDispatch = typeof storeManager.store.dispatch;
