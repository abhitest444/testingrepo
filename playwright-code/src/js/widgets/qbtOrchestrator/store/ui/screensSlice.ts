import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OrchestratorFeature, OrchestratorScreen } from '../../types';

interface ScreenState {
  activeFeature: OrchestratorFeature | null;
  activeScreen: OrchestratorScreen | null;
  previousScreen: {
    feature: OrchestratorFeature;
    screen: OrchestratorScreen;
  } | null;
  screenHistory: Array<{
    feature: OrchestratorFeature;
    screen: OrchestratorScreen;
    timestamp: number;
  }>;
  isLoading: boolean;
}

const initialState: ScreenState = {
  activeFeature: null,
  activeScreen: null,
  previousScreen: null,
  screenHistory: [],
  isLoading: false,
};

const screensSlice = createSlice({
  name: 'screens',
  initialState,
  reducers: {
    setActiveScreen: (
      state,
      action: PayloadAction<{
        feature: OrchestratorFeature;
        screen: OrchestratorScreen;
      }>,
    ) => {
      if (state.activeFeature && state.activeScreen) {
        state.previousScreen = {
          feature: state.activeFeature,
          screen: state.activeScreen,
        };
        state.screenHistory.push({
          feature: state.activeFeature,
          screen: state.activeScreen,
          timestamp: Date.now(),
        });
        if (state.screenHistory.length > 10) {
          state.screenHistory.shift();
        }
      }
      state.activeFeature = action.payload.feature;
      state.activeScreen = action.payload.screen;
      state.isLoading = false;
    },
    setScreenLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    navigateBack: (state) => {
      if (state.previousScreen) {
        state.activeFeature = state.previousScreen.feature;
        state.activeScreen = state.previousScreen.screen;
        const lastHistoryEntry = state.screenHistory.pop();
        state.previousScreen = lastHistoryEntry
          ? {
              feature: lastHistoryEntry.feature,
              screen: lastHistoryEntry.screen,
            }
          : null;
      }
    },
    clearScreenHistory: (state) => {
      state.screenHistory = [];
      state.previousScreen = null;
    },
    resetScreens: () => initialState,
  },
});

export const {
  setActiveScreen,
  setScreenLoading,
  navigateBack,
  clearScreenHistory,
  resetScreens,
} = screensSlice.actions;

export default screensSlice.reducer;
