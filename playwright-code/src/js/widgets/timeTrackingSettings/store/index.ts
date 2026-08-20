import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import standardFieldAssignmentsReducer from './standardFieldAssignmentsSlice';
import standardFieldWorkerAssignmentsReducer from './standardFieldWorkerAssignmentsSlice';
import standardFieldOptionsSummaryReducer from './standardFieldOptionsSummarySlice';
import overviewReducer from './overviewSlice';

const rootReducer = combineReducers({
  standardFieldAssignments: standardFieldAssignmentsReducer,
  standardFieldWorkerAssignments: standardFieldWorkerAssignmentsReducer,
  standardFieldOptionsSummary: standardFieldOptionsSummaryReducer,
  overview: overviewReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['standardFieldAssignments/appendData'],
        ignoredPaths: ['standardFieldAssignments.lastFetchArgs'],
      },
    }),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
