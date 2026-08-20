import { combineReducers } from '@reduxjs/toolkit';
import workersReducer from './workersSlice';
import permissionsReducer from './permissionsSlice';

const sharedReducer = combineReducers({
  workers: workersReducer,
  permissions: permissionsReducer,
});

export type SharedState = ReturnType<typeof sharedReducer>;
export default sharedReducer;
