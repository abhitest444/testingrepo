import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import customFieldsReducer from './customFieldsSlice';
import customerAssignmentsReducer from './customerAssignmentsSlice';
import workerAssignmentsReducer from './workerAssignmentsSlice';

/**
 * Root reducer combining all slices
 */
const rootReducer = combineReducers({
  customFields: customFieldsReducer,
  customerAssignments: customerAssignmentsReducer,
  workerAssignments: workerAssignmentsReducer,
});

/**
 * Configure the Redux store for CustomField widget
 */
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
      },
    }),
  devTools:
    process.env.NODE_ENV !== 'production'
      ? { name: 'CustomField Widget Store' }
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

/**
 * Typed hooks for this store
 */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
