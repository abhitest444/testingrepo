/**
 * Simplified GroupDetailView tests focusing on Redux integration and core logic
 * Full integration tests should be added in E2E testing
 */

import { configureStore } from '@reduxjs/toolkit';
import workersGroupViewReducer, {
  openGroupDetailView,
  closeGroupDetailView,
  setViewByGroups,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';

describe('GroupDetailView - Redux Integration', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
      },
    });
  });

  describe('Group Detail View State Management', () => {
    it('should open group detail view with correct state', () => {
      store.dispatch(
        openGroupDetailView({
          groupId: '123',
          groupName: 'Engineering Team',
        }),
      );

      const state = store.getState().workersGroupView.groupDetailView;
      expect(state.isActive).toBe(true);
      expect(state.groupId).toBe('123');
      expect(state.groupName).toBe('Engineering Team');
    });

    it('should close group detail view and reset to Group by view', () => {
      // First open
      store.dispatch(
        openGroupDetailView({
          groupId: '123',
          groupName: 'Engineering Team',
        }),
      );

      // Then close
      store.dispatch(closeGroupDetailView());

      const state = store.getState().workersGroupView;
      expect(state.groupDetailView.isActive).toBe(false);
      expect(state.groupDetailView.groupId).toBeNull();
      expect(state.groupDetailView.groupName).toBeNull();
      expect(state.viewByGroups).toBe(true); // Should default to Group by view
    });

    it('should toggle viewByGroups state', () => {
      // Default should be false (workers list view)
      expect(store.getState().workersGroupView.viewByGroups).toBe(false);

      // Toggle to true
      store.dispatch(setViewByGroups(true));
      expect(store.getState().workersGroupView.viewByGroups).toBe(true);

      // Toggle back to false
      store.dispatch(setViewByGroups(false));
      expect(store.getState().workersGroupView.viewByGroups).toBe(false);
    });

    it('should maintain separate state for group detail and view toggle', () => {
      // Open group detail
      store.dispatch(
        openGroupDetailView({
          groupId: '123',
          groupName: 'Test Group',
        }),
      );

      // Change view toggle
      store.dispatch(setViewByGroups(false));

      const state = store.getState().workersGroupView;
      expect(state.groupDetailView.isActive).toBe(true);
      expect(state.viewByGroups).toBe(false);

      // Close group detail should reset viewByGroups
      store.dispatch(closeGroupDetailView());
      expect(store.getState().workersGroupView.viewByGroups).toBe(true);
    });
  });

  describe('Group Detail View Selectors', () => {
    it('should select correct group detail state', () => {
      store.dispatch(
        openGroupDetailView({
          groupId: '456',
          groupName: 'Design Team',
        }),
      );

      const state = store.getState().workersGroupView.groupDetailView;
      expect(state).toEqual({
        error: null,
        isActive: true,
        groupId: '456',
        groupName: 'Design Team',
      });
    });
  });
});
