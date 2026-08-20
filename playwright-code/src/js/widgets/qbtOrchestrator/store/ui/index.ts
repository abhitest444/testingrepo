import { combineReducers } from '@reduxjs/toolkit';
import screensReducer from './screensSlice';
import modalsReducer from './modalsSlice';

const uiReducer = combineReducers({
  screens: screensReducer,
  modals: modalsReducer,
});

export type UIState = ReturnType<typeof uiReducer>;
export default uiReducer;
