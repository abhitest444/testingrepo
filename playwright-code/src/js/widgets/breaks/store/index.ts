import { combineReducers, configureStore } from '@reduxjs/toolkit';
import breakRulesReducer from './breakRulesSlice';
import uiReducer from './uiSlice';
import workerReducer from './workerSlice';
import breakAssignmentsReducer from './breakAssignmentsSlice';
import breakPolicyFormReducer from './breakPolicyFormSlice';
import quickfillsReducer from './quickfillsSlice';
import breakEntriesReducer from './breakEntriesSlice';

const rootReducer = combineReducers({
  breakRules: breakRulesReducer,
  ui: uiReducer,
  workers: workerReducer,
  breakAssignments: breakAssignmentsReducer,
  breakPolicyForm: breakPolicyFormReducer,
  quickfills: quickfillsReducer,
  breakEntries: breakEntriesReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  devTools:
    process.env.NODE_ENV !== 'production'
      ? { name: 'Breaks Widget Store' }
      : false,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export default store;
