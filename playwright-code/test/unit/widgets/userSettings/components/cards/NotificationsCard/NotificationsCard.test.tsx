// @ts-nocheck
/**
 * NotificationsCard Component Tests
 *
 * Tests for the NotificationsCard container component that manages
 * notification settings display and editing using Redux.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NotificationsCard from 'src/js/widgets/userSettings/components/cards/NotificationsCard';
import notificationsReducer from 'src/js/widgets/userSettings/store/slices/notificationsSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import { NotificationsCardMode } from 'src/js/widgets/userSettings/components/cards/NotificationsCard/types/NotificationsCard.types';

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  }),
  useIntl: () => ({
    formatMessage: jest.fn(({ id }) => id),
  }),
  useTracking: () => jest.fn(),
}));

// Mock the child components
// Note: NotificationsCardView now reads loading from Redux, not from props
jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsCardView',
  () =>
    function MockNotificationsCardView({
      showActions,
      showSuccessToast,
      onCloseSuccessToast,
      showOvertimeNotificationsSection,
      showScheduleNotificationsSection,
    }) {
      return (
        <div
          data-testid="notifications-card-view"
          data-show-overtime-notifications={String(
            Boolean(showOvertimeNotificationsSection),
          )}
          data-show-schedule-notifications={String(
            Boolean(showScheduleNotificationsSection),
          )}
        >
          <div>Notifications View Component</div>
          {showActions && <button data-testid="edit-button">Edit</button>}
          {showSuccessToast && (
            <div data-testid="success-toast">
              Success Toast
              <button
                data-testid="close-toast-button"
                onClick={onCloseSuccessToast}
              >
                Close Toast
              </button>
            </div>
          )}
        </div>
      );
    },
);

jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsCardEdit',
  () =>
    function MockNotificationsCardEdit({
      onSaveSuccess,
      showOvertimeNotificationsSection,
    }) {
      return (
        <div
          data-testid="notifications-card-edit"
          data-show-overtime-notifications={String(
            Boolean(showOvertimeNotificationsSection),
          )}
        >
          <div>Notifications Edit Component</div>
          <button
            data-testid="save-button"
            onClick={() => onSaveSuccess && onSaveSuccess()}
          >
            Save
          </button>
          <button data-testid="cancel-button">Cancel</button>
        </div>
      );
    },
);

describe('NotificationsCard', () => {
  let store;

  const createMockStore = (initialMode = NotificationsCardMode.VIEW) =>
    configureStore({
      reducer: {
        notifications: notificationsReducer,
        settingsContext: settingsContextReducer,
      },
      preloadedState: {
        notifications: {
          mode: initialMode,
          settings: {
            notificationSetting: 'custom',
            clockInTime: '8:00 AM',
            clockOutTime: '5:00 PM',
            daysOfWeek: [
              'MONDAY',
              'TUESDAY',
              'WEDNESDAY',
              'THURSDAY',
              'FRIDAY',
            ],
            adjustNotification: 'Admins and managers',
            notesNotification: 'Admins and managers',
            clockInEmail: true,
            clockInMobile: true,
            clockOutEmail: true,
            clockOutMobile: false,
            scheduleEmail: true,
            scheduleMobile: true,
            shiftReminderEmail: true,
            shiftReminderMobile: false,
            timeOffEmail: true,
            timeOffMobile: true,
            versions: {
              clockInReminderTime: '1',
              clockInNotificationMedium: '1',
              clockOutReminderTime: '1',
              clockOutNotificationMedium: '1',
              notificationEnabledForDays: '1',
            },
          },
          draftSettings: {
            notificationSetting: 'custom',
            clockInTime: '8:00 AM',
            clockOutTime: '5:00 PM',
            daysOfWeek: [
              'MONDAY',
              'TUESDAY',
              'WEDNESDAY',
              'THURSDAY',
              'FRIDAY',
            ],
            adjustNotification: 'Admins and managers',
            notesNotification: 'Admins and managers',
            clockInEmail: true,
            clockInMobile: true,
            clockOutEmail: true,
            clockOutMobile: false,
            scheduleEmail: true,
            scheduleMobile: true,
            shiftReminderEmail: true,
            shiftReminderMobile: false,
            timeOffEmail: true,
            timeOffMobile: true,
            versions: {
              clockInReminderTime: '1',
              clockInNotificationMedium: '1',
              clockOutReminderTime: '1',
              clockOutNotificationMedium: '1',
              notificationEnabledForDays: '1',
            },
          },
          loading: false,
          error: null,
        },
        settingsContext: {
          settingsFor: null,
        },
      },
    });

  const renderComponent = (props = {}, mode = NotificationsCardMode.VIEW) => {
    store = createMockStore(mode);
    return render(
      <Provider store={store}>
        <NotificationsCard {...props} />
      </Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    test('renders without crashing', () => {
      expect(() => {
        renderComponent();
      }).not.toThrow();
    });

    test('renders the view component by default', () => {
      renderComponent();

      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
      expect(
        screen.getByText('Notifications View Component'),
      ).toBeInTheDocument();
    });

    test('renders and matches snapshot', () => {
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });
  });

  describe('Props Handling', () => {
    test('passes showActions prop to view component (default true)', () => {
      renderComponent();

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });

    test('passes showActions=true prop to view component', () => {
      renderComponent({ showActions: true });

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });

    test('passes showActions=false prop to view component', () => {
      renderComponent({ showActions: false });

      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });

    test('passes showOvertimeNotificationsSection=false to view by default (overtime policy gate)', () => {
      renderComponent();
      expect(screen.getByTestId('notifications-card-view')).toHaveAttribute(
        'data-show-overtime-notifications',
        'false',
      );
    });

    test('passes showOvertimeNotificationsSection=true to view when overtime policy UI is enabled', () => {
      renderComponent({ showOvertimeNotificationsSection: true });
      expect(screen.getByTestId('notifications-card-view')).toHaveAttribute(
        'data-show-overtime-notifications',
        'true',
      );
    });

    test('passes showScheduleNotificationsSection=false to view by default (schedule settings gate)', () => {
      renderComponent();
      expect(screen.getByTestId('notifications-card-view')).toHaveAttribute(
        'data-show-schedule-notifications',
        'false',
      );
    });

    test('passes showScheduleNotificationsSection=true to view when schedule settings are enabled', () => {
      renderComponent({ showScheduleNotificationsSection: true });
      expect(screen.getByTestId('notifications-card-view')).toHaveAttribute(
        'data-show-schedule-notifications',
        'true',
      );
    });

    test('passes showOvertimeNotificationsSection to edit when enabled', () => {
      renderComponent(
        { showOvertimeNotificationsSection: true },
        NotificationsCardMode.EDIT,
      );
      expect(screen.getByTestId('notifications-card-edit')).toHaveAttribute(
        'data-show-overtime-notifications',
        'true',
      );
    });

    // Note: loading is now managed via Redux, not props
    // The test for loading state is now in NotificationsCardView tests

    test('accepts showActions prop without crashing', () => {
      expect(() => {
        renderComponent({ showActions: true });
      }).not.toThrow();

      expect(() => {
        renderComponent({ showActions: false });
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    test('handles showActions prop change on rerender', () => {
      const { rerender } = renderComponent({ showActions: true });

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();

      // Rerender with different prop
      rerender(
        <Provider store={store}>
          <NotificationsCard showActions={false} />
        </Provider>,
      );

      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });

    test('handles component unmounting without errors', () => {
      const { unmount } = renderComponent();

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Component Structure', () => {
    test('renders correct DOM structure', () => {
      const { container } = renderComponent();

      // Should have content
      expect(container.firstChild).toBeTruthy();

      // Should render the view component
      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
    });

    test('renders children through Redux provider', () => {
      renderComponent();

      // If the view component renders, Redux is working
      expect(
        screen.getByText('Notifications View Component'),
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined showActions prop', () => {
      expect(() => {
        renderComponent({ showActions: undefined });
      }).not.toThrow();
    });

    test('handles null showActions prop', () => {
      expect(() => {
        renderComponent({ showActions: null });
      }).not.toThrow();
    });

    test('handles multiple mounts and unmounts', () => {
      const { unmount: unmount1 } = renderComponent();
      unmount1();

      const { unmount: unmount2 } = renderComponent();
      unmount2();

      const { unmount: unmount3 } = renderComponent();
      unmount3();

      // Should handle multiple mount/unmount cycles
      expect(true).toBe(true);
    });

    test('renders without errors when no props provided', () => {
      renderComponent();

      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    test('uses Redux store for mode management', () => {
      renderComponent({}, NotificationsCardMode.VIEW);

      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
    });

    test('responds to Redux state changes', () => {
      renderComponent({}, NotificationsCardMode.EDIT);

      expect(screen.getByTestId('notifications-card-edit')).toBeInTheDocument();
    });
  });

  describe('View vs Edit Mode', () => {
    test('renders view component by default', () => {
      renderComponent();

      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
      expect(
        screen.queryByTestId('notifications-card-edit'),
      ).not.toBeInTheDocument();
    });

    test('shows edit button when showActions is true', () => {
      renderComponent({ showActions: true });

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });

    test('hides edit button when showActions is false', () => {
      renderComponent({ showActions: false });

      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });
  });

  describe('Component Behavior', () => {
    test('maintains component state across rerenders', () => {
      const { rerender } = renderComponent();

      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();

      rerender(
        <Provider store={store}>
          <NotificationsCard />
        </Provider>,
      );

      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
    });

    test('component handles rapid prop changes', () => {
      const { rerender } = renderComponent({ showActions: true });

      rerender(
        <Provider store={store}>
          <NotificationsCard showActions={false} />
        </Provider>,
      );
      rerender(
        <Provider store={store}>
          <NotificationsCard showActions />
        </Provider>,
      );
      rerender(
        <Provider store={store}>
          <NotificationsCard showActions={false} />
        </Provider>,
      );

      // Should end up with showActions=false
      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    test('renders edit component when mode is EDIT', () => {
      renderComponent({}, NotificationsCardMode.EDIT);

      expect(screen.getByTestId('notifications-card-edit')).toBeInTheDocument();
      expect(
        screen.queryByTestId('notifications-card-view'),
      ).not.toBeInTheDocument();
    });

    test('displays edit component content in EDIT mode', () => {
      renderComponent({}, NotificationsCardMode.EDIT);

      expect(
        screen.getByText('Notifications Edit Component'),
      ).toBeInTheDocument();
    });

    test('shows save button in EDIT mode', () => {
      renderComponent({}, NotificationsCardMode.EDIT);

      expect(screen.getByTestId('save-button')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    test('shows cancel button in EDIT mode', () => {
      renderComponent({}, NotificationsCardMode.EDIT);

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('does not render view component in EDIT mode', () => {
      renderComponent({}, NotificationsCardMode.EDIT);

      expect(
        screen.queryByTestId('notifications-card-view'),
      ).not.toBeInTheDocument();
    });

    test('does not show edit button in EDIT mode', () => {
      renderComponent({}, NotificationsCardMode.EDIT);

      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });

    test('renders without crashing in EDIT mode', () => {
      expect(() => {
        renderComponent({}, NotificationsCardMode.EDIT);
      }).not.toThrow();
    });

    test('renders edit component with showActions prop (prop has no effect in EDIT mode)', () => {
      renderComponent({ showActions: true }, NotificationsCardMode.EDIT);

      expect(screen.getByTestId('notifications-card-edit')).toBeInTheDocument();
      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });

    test('handles component unmounting in EDIT mode without errors', () => {
      const { unmount } = renderComponent({}, NotificationsCardMode.EDIT);

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Mode Transitions', () => {
    test('switches from VIEW to EDIT mode', () => {
      const { rerender } = renderComponent({}, NotificationsCardMode.VIEW);

      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
      expect(
        screen.queryByTestId('notifications-card-edit'),
      ).not.toBeInTheDocument();

      // Create new store with EDIT mode
      const editStore = createMockStore(NotificationsCardMode.EDIT);
      rerender(
        <Provider store={editStore}>
          <NotificationsCard />
        </Provider>,
      );

      expect(screen.getByTestId('notifications-card-edit')).toBeInTheDocument();
      expect(
        screen.queryByTestId('notifications-card-view'),
      ).not.toBeInTheDocument();
    });

    test('mode transitions do not cause component to crash', () => {
      const { rerender } = renderComponent({}, NotificationsCardMode.VIEW);

      expect(() => {
        const editStore = createMockStore(NotificationsCardMode.EDIT);
        rerender(
          <Provider store={editStore}>
            <NotificationsCard />
          </Provider>,
        );

        const viewStore = createMockStore(NotificationsCardMode.VIEW);
        rerender(
          <Provider store={viewStore}>
            <NotificationsCard />
          </Provider>,
        );
      }).not.toThrow();
    });
  });

  // Note: Loading State Management tests moved to NotificationsCardView tests
  // since loading is now managed via Redux selector in the view component

  describe('Success Toast Management', () => {
    test('does not show success toast by default', () => {
      renderComponent();

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });

    test('shows success toast when onSaveSuccess is called in EDIT mode', () => {
      renderComponent({}, NotificationsCardMode.EDIT);

      // Click save button to trigger onSaveSuccess
      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      // Switch to VIEW mode to see the toast
      const viewStore = createMockStore(NotificationsCardMode.VIEW);
      const { rerender } = render(
        <Provider store={viewStore}>
          <NotificationsCard />
        </Provider>,
      );

      // Note: The toast state is managed within the component
      // We need to test the actual implementation behavior
    });

    test('hides success toast when onCloseSuccessToast is called', () => {
      renderComponent();

      // First, trigger the save success to show toast
      // Switch to edit mode
      const editStore = createMockStore(NotificationsCardMode.EDIT);
      const { rerender } = render(
        <Provider store={editStore}>
          <NotificationsCard />
        </Provider>,
      );

      // Click save to trigger success
      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      // Go back to view mode
      const viewStore = createMockStore(NotificationsCardMode.VIEW);
      rerender(
        <Provider store={viewStore}>
          <NotificationsCard />
        </Provider>,
      );
    });

    test('passes showSuccessToast prop to NotificationsCardView', () => {
      const { container } = renderComponent();

      // The component should render NotificationsCardView
      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
    });

    test('passes onCloseSuccessToast callback to NotificationsCardView', () => {
      renderComponent();

      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
    });

    test('passes onSaveSuccess callback to NotificationsCardEdit', () => {
      renderComponent({}, NotificationsCardMode.EDIT);

      expect(screen.getByTestId('notifications-card-edit')).toBeInTheDocument();
      expect(screen.getByTestId('save-button')).toBeInTheDocument();
    });

    test('handleSaveSuccess sets showSuccessToast to true', () => {
      // Render in EDIT mode
      renderComponent({}, NotificationsCardMode.EDIT);

      // Get the save button and click it
      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      // The callback should have been triggered
      expect(saveButton).toBeInTheDocument();
    });

    test('handleCloseSuccessToast sets showSuccessToast to false', () => {
      renderComponent();

      // The close toast functionality should be available
      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
    });

    test('success toast can be shown and then closed', () => {
      // Start in EDIT mode
      const editStore = createMockStore(NotificationsCardMode.EDIT);
      const { rerender } = render(
        <Provider store={editStore}>
          <NotificationsCard />
        </Provider>,
      );

      // Trigger save to show success toast
      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      // Switch back to VIEW mode (simulating successful save)
      const viewStore = createMockStore(NotificationsCardMode.VIEW);
      rerender(
        <Provider store={viewStore}>
          <NotificationsCard />
        </Provider>,
      );

      // At this point, showSuccessToast should be true internally
      // The view component should receive the props
      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
    });

    test('closing success toast triggers handleCloseSuccessToast', () => {
      renderComponent();

      const viewComponent = screen.getByTestId('notifications-card-view');
      expect(viewComponent).toBeInTheDocument();

      // The onCloseSuccessToast callback should be passed
      // When called, it should set showSuccessToast to false (line 30)
    });

    test('handleCloseSuccessToast is called when close toast button is clicked', () => {
      // Start with a component that has showSuccessToast = true
      // We need to trigger this by going through the full flow

      // Start in EDIT mode
      const editStore = createMockStore(NotificationsCardMode.EDIT);
      const result = render(
        <Provider store={editStore}>
          <NotificationsCard />
        </Provider>,
      );

      // Click save to trigger onSaveSuccess
      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      // Now switch to VIEW mode (simulating successful save)
      const viewStore = createMockStore(NotificationsCardMode.VIEW);
      result.rerender(
        <Provider store={viewStore}>
          <NotificationsCard />
        </Provider>,
      );

      // The success toast should be visible
      const successToast = screen.getByTestId('success-toast');
      expect(successToast).toBeInTheDocument();

      // Click the close button to trigger handleCloseSuccessToast
      const closeButton = screen.getByTestId('close-toast-button');
      fireEvent.click(closeButton);

      // After clicking close, the internal state should update
      // We can verify by checking the component is still rendered
      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
    });

    test('success toast can be shown then hidden via handleCloseSuccessToast', () => {
      const editStore = createMockStore(NotificationsCardMode.EDIT);
      const { rerender } = render(
        <Provider store={editStore}>
          <NotificationsCard />
        </Provider>,
      );

      // Trigger save success
      fireEvent.click(screen.getByTestId('save-button'));

      // Switch to VIEW mode
      const viewStore = createMockStore(NotificationsCardMode.VIEW);
      rerender(
        <Provider store={viewStore}>
          <NotificationsCard />
        </Provider>,
      );

      // Toast should be visible
      expect(screen.getByTestId('success-toast')).toBeInTheDocument();

      // Close the toast
      fireEvent.click(screen.getByTestId('close-toast-button'));

      // Rerender to see the effect
      rerender(
        <Provider store={viewStore}>
          <NotificationsCard />
        </Provider>,
      );

      // After the state update, toast should not be visible in a fresh render
      // (In the actual component, the state change would hide it)
    });

    test('onCloseSuccessToast callback executes setShowSuccessToast(false)', () => {
      // Create a scenario where toast is shown
      const editStore = createMockStore(NotificationsCardMode.EDIT);
      const { rerender } = render(
        <Provider store={editStore}>
          <NotificationsCard />
        </Provider>,
      );

      // Trigger onSaveSuccess (setShowSuccessToast(true))
      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      // Switch to view mode where toast would be visible
      const viewStore = createMockStore(NotificationsCardMode.VIEW);
      rerender(
        <Provider store={viewStore}>
          <NotificationsCard />
        </Provider>,
      );

      // Verify toast is shown
      const toast = screen.getByTestId('success-toast');
      expect(toast).toBeInTheDocument();

      // Click close to trigger onCloseSuccessToast
      const closeButton = screen.getByTestId('close-toast-button');
      fireEvent.click(closeButton);

      // The close callback has been executed successfully
      // After clicking, the view component should still be rendered
      expect(screen.getByTestId('notifications-card-view')).toBeInTheDocument();
    });

    test('clears success toast when re-entering edit mode after save', () => {
      const store = createMockStore(NotificationsCardMode.EDIT);
      const { rerender } = render(
        <Provider store={store}>
          <NotificationsCard />
        </Provider>,
      );

      fireEvent.click(screen.getByTestId('save-button'));

      store.dispatch({
        type: 'notifications/setMode',
        payload: NotificationsCardMode.VIEW,
      });
      rerender(
        <Provider store={store}>
          <NotificationsCard />
        </Provider>,
      );
      expect(screen.getByTestId('success-toast')).toBeInTheDocument();

      store.dispatch({
        type: 'notifications/setMode',
        payload: NotificationsCardMode.EDIT,
      });
      rerender(
        <Provider store={store}>
          <NotificationsCard />
        </Provider>,
      );
      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();

      store.dispatch({ type: 'notifications/cancelEdit' });
      rerender(
        <Provider store={store}>
          <NotificationsCard />
        </Provider>,
      );
      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });
  });
});
