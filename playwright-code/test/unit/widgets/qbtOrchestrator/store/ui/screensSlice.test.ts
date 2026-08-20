import screensReducer, {
  setActiveScreen,
  setScreenLoading,
  navigateBack,
  clearScreenHistory,
  resetScreens,
} from 'src/js/widgets/qbtOrchestrator/store/ui/screensSlice';

// Helper to create typed initial state
type ScreenState = ReturnType<typeof screensReducer>;

describe('screensSlice', () => {
  const initialState: ScreenState = {
    activeFeature: null,
    activeScreen: null,
    previousScreen: null,
    screenHistory: [],
    isLoading: false,
  };

  describe('reducers', () => {
    describe('setActiveScreen', () => {
      it('should set active feature and screen when no previous screen exists', () => {
        const state = screensReducer(
          initialState,
          setActiveScreen({ feature: 'overtime', screen: 'landing' }),
        );

        expect(state.activeFeature).toBe('overtime');
        expect(state.activeScreen).toBe('landing');
        expect(state.previousScreen).toBeNull();
        expect(state.screenHistory).toHaveLength(0);
        expect(state.isLoading).toBe(false);
      });

      it('should track previous screen when navigating to new screen', () => {
        const stateWithActive: ScreenState = {
          ...initialState,
          activeFeature: 'overtime',
          activeScreen: 'landing',
        };

        const state = screensReducer(
          stateWithActive,
          setActiveScreen({ feature: 'overtime', screen: 'setup' }),
        );

        expect(state.activeFeature).toBe('overtime');
        expect(state.activeScreen).toBe('setup');
        expect(state.previousScreen).toEqual({
          feature: 'overtime',
          screen: 'landing',
        });
        expect(state.screenHistory).toHaveLength(1);
        expect(state.screenHistory[0]).toMatchObject({
          feature: 'overtime',
          screen: 'landing',
        });
      });

      it('should maintain screen history up to 10 entries', () => {
        let currentState: ScreenState = { ...initialState };

        // Add 12 screen navigations
        Array.from({ length: 12 }).forEach((_, i) => {
          currentState = screensReducer(
            currentState,
            setActiveScreen({
              feature: 'overtime',
              screen: `screen${i}`,
            }),
          );
        });

        expect(currentState.screenHistory.length).toBeLessThanOrEqual(10);
      });

      it('should set isLoading to false when screen is set', () => {
        const loadingState: ScreenState = { ...initialState, isLoading: true };

        const state = screensReducer(
          loadingState,
          setActiveScreen({ feature: 'overtime', screen: 'landing' }),
        );

        expect(state.isLoading).toBe(false);
      });

      it('should add timestamp to screen history entries', () => {
        const stateWithActive: ScreenState = {
          ...initialState,
          activeFeature: 'overtime',
          activeScreen: 'landing',
        };

        const beforeTime = Date.now();
        const state = screensReducer(
          stateWithActive,
          setActiveScreen({ feature: 'overtime', screen: 'setup' }),
        );
        const afterTime = Date.now();

        expect(state.screenHistory[0].timestamp).toBeGreaterThanOrEqual(
          beforeTime,
        );
        expect(state.screenHistory[0].timestamp).toBeLessThanOrEqual(afterTime);
      });
    });

    describe('setScreenLoading', () => {
      it('should set loading to true', () => {
        const state = screensReducer(initialState, setScreenLoading(true));
        expect(state.isLoading).toBe(true);
      });

      it('should set loading to false', () => {
        const loadingState: ScreenState = { ...initialState, isLoading: true };
        const state = screensReducer(loadingState, setScreenLoading(false));
        expect(state.isLoading).toBe(false);
      });
    });

    describe('navigateBack', () => {
      it('should navigate to previous screen', () => {
        const stateWithHistory: ScreenState = {
          ...initialState,
          activeFeature: 'overtime',
          activeScreen: 'setup',
          previousScreen: {
            feature: 'overtime',
            screen: 'landing',
          },
          screenHistory: [
            { feature: 'overtime', screen: 'initial', timestamp: Date.now() },
          ],
        };

        const state = screensReducer(stateWithHistory, navigateBack());

        expect(state.activeFeature).toBe('overtime');
        expect(state.activeScreen).toBe('landing');
      });

      it('should pop from screen history when navigating back', () => {
        const stateWithHistory: ScreenState = {
          ...initialState,
          activeFeature: 'overtime',
          activeScreen: 'details',
          previousScreen: {
            feature: 'overtime',
            screen: 'setup',
          },
          screenHistory: [
            { feature: 'overtime', screen: 'landing', timestamp: Date.now() },
            { feature: 'overtime', screen: 'setup', timestamp: Date.now() },
          ],
        };

        const state = screensReducer(stateWithHistory, navigateBack());

        expect(state.screenHistory).toHaveLength(1);
      });

      it('should set previousScreen to null when history is empty', () => {
        const stateWithNoPrevious: ScreenState = {
          ...initialState,
          activeFeature: 'overtime',
          activeScreen: 'setup',
          previousScreen: {
            feature: 'overtime',
            screen: 'landing',
          },
          screenHistory: [],
        };

        const state = screensReducer(stateWithNoPrevious, navigateBack());

        expect(state.previousScreen).toBeNull();
      });

      it('should do nothing if no previous screen exists', () => {
        const state = screensReducer(initialState, navigateBack());

        expect(state.activeFeature).toBeNull();
        expect(state.activeScreen).toBeNull();
      });
    });

    describe('clearScreenHistory', () => {
      it('should clear screen history', () => {
        const stateWithHistory: ScreenState = {
          ...initialState,
          screenHistory: [
            { feature: 'overtime', screen: 'landing', timestamp: Date.now() },
            { feature: 'overtime', screen: 'setup', timestamp: Date.now() },
          ],
          previousScreen: { feature: 'overtime', screen: 'landing' },
        };

        const state = screensReducer(stateWithHistory, clearScreenHistory());

        expect(state.screenHistory).toHaveLength(0);
        expect(state.previousScreen).toBeNull();
      });

      it('should preserve active screen when clearing history', () => {
        const stateWithHistory: ScreenState = {
          ...initialState,
          activeFeature: 'overtime',
          activeScreen: 'setup',
          screenHistory: [
            { feature: 'overtime', screen: 'landing', timestamp: Date.now() },
          ],
        };

        const state = screensReducer(stateWithHistory, clearScreenHistory());

        expect(state.activeFeature).toBe('overtime');
        expect(state.activeScreen).toBe('setup');
      });
    });

    describe('resetScreens', () => {
      it('should reset to initial state', () => {
        const modifiedState: ScreenState = {
          activeFeature: 'overtime',
          activeScreen: 'setup',
          previousScreen: { feature: 'overtime', screen: 'landing' },
          screenHistory: [
            { feature: 'overtime', screen: 'landing', timestamp: Date.now() },
          ],
          isLoading: true,
        };

        const state = screensReducer(modifiedState, resetScreens());

        expect(state).toEqual(initialState);
      });
    });
  });

  describe('complex navigation scenarios', () => {
    it('should handle multiple navigations with proper history tracking', () => {
      let state: ScreenState = initialState;

      // Navigate: landing -> setup -> details -> edit
      state = screensReducer(
        state,
        setActiveScreen({ feature: 'overtime', screen: 'landing' }),
      );
      // After: active=landing, prev=null, history=[]

      state = screensReducer(
        state,
        setActiveScreen({ feature: 'overtime', screen: 'setup' }),
      );
      // After: active=setup, prev=landing, history=[landing]

      state = screensReducer(
        state,
        setActiveScreen({ feature: 'overtime', screen: 'details' }),
      );
      // After: active=details, prev=setup, history=[landing, setup]

      state = screensReducer(
        state,
        setActiveScreen({ feature: 'overtime', screen: 'edit' }),
      );
      // After: active=edit, prev=details, history=[landing, setup, details]

      expect(state.activeScreen).toBe('edit');
      expect(state.previousScreen?.screen).toBe('details');
      expect(state.screenHistory.length).toBe(3);
      expect(state.screenHistory.map((h) => h.screen)).toEqual([
        'landing',
        'setup',
        'details',
      ]);

      // Navigate back: active becomes previousScreen (details)
      // previousScreen becomes popped history entry (details from history)
      state = screensReducer(state, navigateBack());
      expect(state.activeScreen).toBe('details');
      expect(state.screenHistory.length).toBe(2);
    });

    it('should handle cross-feature navigation', () => {
      let state: ScreenState = initialState;

      state = screensReducer(
        state,
        setActiveScreen({ feature: 'overtime', screen: 'landing' }),
      );
      state = screensReducer(
        state,
        setActiveScreen({ feature: 'breaks', screen: 'settings' }),
      );

      expect(state.activeFeature).toBe('breaks');
      expect(state.activeScreen).toBe('settings');
      expect(state.previousScreen).toEqual({
        feature: 'overtime',
        screen: 'landing',
      });
    });
  });
});
