import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import projectsReducer from './projectsSlice';
import filtersReducer from './filtersSlice';
import uiReducer from './uiSlice';
import settingsReducer from './settingsSlice';
import estimateDrawerReducer from './estimateDrawerSlice';
import workerSummaryReducer from './workerSummarySlice';
import postsUiReducer from './postsUiSlice';
import postAttachmentsReducer from './postAttachmentsSlice';
import customerWorkerAssignmentsReducer from '../../assignments/store/customerWorkerAssignmentsSlice';

const rootReducer = combineReducers({
  projects: projectsReducer,
  filters: filtersReducer,
  ui: uiReducer,
  settings: settingsReducer,
  estimateDrawer: estimateDrawerReducer,
  workerSummary: workerSummaryReducer,
  postsUi: postsUiReducer,
  postAttachments: postAttachmentsReducer,
  customerWorkerAssignments: customerWorkerAssignmentsReducer,
});

const store = configureStore({
  reducer: rootReducer,
  devTools:
    process.env.NODE_ENV !== 'production'
      ? { name: 'TimeProject Widget Store' }
      : false,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
