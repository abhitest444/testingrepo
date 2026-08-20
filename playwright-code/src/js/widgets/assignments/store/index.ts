import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { enableMapSet } from 'immer';
import workerReducer from './workerSlice';
import uiReducer from './uiSlice';
import workersGroupViewReducer from './workersGroupViewSlice';
import workersListReducer from './workersListSlice';
import customerWorkerAssignmentsReducer from './customerWorkerAssignmentsSlice';
import customerAssignmentsReducer from './customerAssignmentsSlice';
import geofenceConfigurationReducer from './geofenceConfigurationSlice';
import geofenceLocationSearchReducer from './geofenceLocationSearchSlice';

// Enable Immer's MapSet plugin for Set support
enableMapSet();

/**
 * Root reducer combining all slices
 */
const rootReducer = combineReducers({
  workers: workerReducer,
  ui: uiReducer,
  workersGroupView: workersGroupViewReducer,
  workersList: workersListReducer,
  customerWorkerAssignments: customerWorkerAssignmentsReducer,
  customerAssignments: customerAssignmentsReducer,
  geofenceConfiguration: geofenceConfigurationReducer,
  geofenceLocationSearch: geofenceLocationSearchReducer,
});

/**
 * Configure the Redux store for Assignments widget
 */
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['ui/setPageMessage', 'ui/showSuccessMessage'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['ui.pageMessage'],
      },
    }),
  devTools:
    process.env.NODE_ENV !== 'production'
      ? { name: 'Assignments Widget Store' }
      : false,
});

/**
 * Root state type
 */
export type RootState = ReturnType<typeof rootReducer>;

/**
 * App dispatch type
 */
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
