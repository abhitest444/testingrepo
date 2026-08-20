// @ts-nocheck
/**
 * NotificationsCardView Component Tests
 *
 * Tests for the NotificationsCardView component that displays
 * notification settings in view mode.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// NOW import the component
import NotificationsCardView from 'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsCardView';
import notificationsReducer, {
  setMode,
} from 'src/js/widgets/userSettings/store/slices/notificationsSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';

// Create mock settings
const mockSettings = {
  clockInTime: '8:00 AM',
  clockOutTime: '5:00 PM',
  daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  clockInEmail: true,
  clockInMobile: true,
  clockOutEmail: true,
  clockOutMobile: false,
};

// Helper to create a mock store
const createMockStore = (settings = mockSettings, loading = false) =>
  configureStore({
    reducer: {
      notifications: notificationsReducer,
      settingsContext: settingsContextReducer,
    },
    preloadedState: {
      notifications: {
        mode: 'VIEW',
        settings,
        draftSettings: settings,
        loading,
        error: null,
      },
      settingsContext: {
        settingsFor: {
          __typename: 'User',
          userId: 'test-user-id',
          companyId: 'test-company-id',
          fullName: 'Test User',
        },
      },
    },
  });

// Mock the common card styles
jest.mock('src/js/widgets/userSettings/components/styles/cards.styles', () => ({
  HeaderRow: ({ children }) => <div data-testid="header-row">{children}</div>,
  Actions: ({ children }) => <div data-testid="actions">{children}</div>,
  FieldGroup: ({ children }) => <div data-testid="field-group">{children}</div>,
}));

// Mock the component-specific styles
jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/styles/NotificationsCardView.styles',
  () => ({
    Section: ({ children }) => <div data-testid="section">{children}</div>,
    KV: ({ children }) => <div data-testid="kv">{children}</div>,
  }),
);

// Mock @cgds/skeleton
jest.mock('@cgds/skeleton', () => ({
  Skeleton: ({ variant, height }) => (
    <div
      data-testid="skeleton-loader"
      data-variant={variant}
      data-height={height}
    >
      Loading...
    </div>
  ),
}));

// Mock SuccessToast component
jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({ message, open, onClose }) =>
    open ? (
      <div data-testid="success-toast">
        <span>{message}</span>
        <button onClick={onClose} data-testid="close-success-toast">
          Close
        </button>
      </div>
    ) : null,
}));

jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsScheduleView',
  () => ({
    __esModule: true,
    default: ({ loading }) => (
      <div
        data-testid="notifications-schedule-view"
        data-loading={String(loading)}
      />
    ),
  }),
);

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  IntlProvider: ({ children }) => children,
  useIntl: () => ({
    formatMessage: ({ id }) => {
      const messages = {
        'notifications.title': 'Notifications',
        'notifications.company.settings': 'Company settings',
        'notifications.custom.rules': 'Off, employee uses custom rules',
        'notifications.on.custom.rules': 'On, employee uses custom rules',
        'notifications.reminders.title': 'Reminders',
        'notifications.reminders.clockin': 'Clock-in reminders',
        'notifications.reminders.clockout': 'Clock-out reminders',
        'notifications.reminders.days': 'Days of week',
        'notifications.reminders.adjust': 'Notify when time is adjusted',
        'notifications.reminders.notes': 'Notify when notes are added',
        'notifications.schedule.title': 'Schedule',
        'notifications.schedule.shift.published': 'When shift is published',
        'notifications.schedule.shift.reminder': 'Shift reminder',
        'notifications.schedule.row.forgot-clock-in-after-shift-started':
          'Forgot clock in after started',
        'notifications.schedule.row.forgot-clock-out-after-shift-ended':
          'Forgot clock out after ended',
        'notifications.schedule.row.late-clock-in-notify-manager':
          'Late clock in notify manager',
        'notifications.schedule.view.always-send': 'Always send',
        'notifications.schedule.view.ask': 'Ask',
        'notifications.schedule.view.never-send': 'Never send',
        'notifications.schedule.view.on-with-channel': 'On, {channel}',
        'notifications.mobile': 'Mobile',
        'notifications.email': 'Email',
        'notifications.timeoff.title': 'Time off',
        'notifications.timeoff.shift.published': 'When time off is published',
        'notifications.off': 'Off',
        'notifications.on.email': 'On, email',
        'notifications.on.mobile': 'On, mobile',
        'notifications.on.email.mobile': 'On, email, mobile',
        'notifications.status.on.email.mobile': 'On, email, mobile',
        'notifications.status.on.email.at': 'On, email at {time}',
        'notifications.status.on.email': 'On, email',
        'notifications.status.on.mobile.at': 'On, mobile at {time}',
        'notifications.status.on.mobile': 'On, mobile',
        'notifications.status.off': 'Off',
        'notifications.at.time': 'at {time}',
        'days.monday': 'Monday',
        'days.tuesday': 'Tuesday',
        'days.wednesday': 'Wednesday',
        'days.thursday': 'Thursday',
        'days.friday': 'Friday',
        'days.saturday': 'Saturday',
        'days.sunday': 'Sunday',
        'settings.saved.success': 'Changes saved',
      };
      return messages[id] || id;
    },
  }),
  useSandbox: () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  }),
  useTracking: () => jest.fn(),
  IconButton: ({ children, onClick, ariaLabel }) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  Edit: () => <span>Edit Icon</span>,
}));

// Helper to render component
const renderComponent = (props = {}, store = createMockStore()) => {
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  const result = render(
    <Provider store={store}>
      <NotificationsCardView {...props} />
    </Provider>,
  );
  return { ...result, store, dispatchSpy };
};

describe('NotificationsCardView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    test('renders without crashing', () => {
      expect(() => {
        renderComponent();
      }).not.toThrow();
    });

    test('renders and matches snapshot', () => {
      const componentOutput = renderComponent();
      expect(componentOutput).toMatchSnapshot();
    });
  });

  describe('Rendering', () => {
    test('should render all main sections with correct content', () => {
      renderComponent();

      // Title
      expect(screen.getByText('Notifications')).toBeInTheDocument();

      // Reminders section
      expect(screen.getByText('Reminders')).toBeInTheDocument();
      expect(screen.getByText('Clock-in reminders')).toBeInTheDocument();
      expect(screen.getByText('Clock-out reminders')).toBeInTheDocument();
    });
  });

  describe('Settings Display', () => {
    test('displays all notification settings from context', () => {
      renderComponent();

      // All notification labels should be present
      expect(screen.getByText('Days of week')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    test('should render edit button by default and when showActions is true', () => {
      // Default (showActions = true)
      const { unmount } = renderComponent();
      expect(screen.getByLabelText('edit-notifications')).toBeInTheDocument();
      unmount();

      // Explicit true
      renderComponent({ showActions: true });
      expect(screen.getByLabelText('edit-notifications')).toBeInTheDocument();
    });

    test('should not render edit button when showActions is false', () => {
      renderComponent({ showActions: false });
      expect(
        screen.queryByLabelText('edit-notifications'),
      ).not.toBeInTheDocument();
    });

    test('should call setMode with EDIT when edit button is clicked', () => {
      const { dispatchSpy } = renderComponent({ showActions: true });

      const editButton = screen.getByLabelText('edit-notifications');
      fireEvent.click(editButton);

      expect(dispatchSpy).toHaveBeenCalledWith(setMode('EDIT'));
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Lifecycle', () => {
    test('maintains state across rerenders', () => {
      const { rerender, store } = renderComponent();

      expect(screen.getByText('Notifications')).toBeInTheDocument();

      rerender(
        <Provider store={store}>
          <NotificationsCardView />
        </Provider>,
      );

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    test('handles showActions prop change on rerender', () => {
      const { rerender, store } = renderComponent({ showActions: true });

      expect(screen.getByLabelText('edit-notifications')).toBeInTheDocument();

      rerender(
        <Provider store={store}>
          <NotificationsCardView showActions={false} />
        </Provider>,
      );

      expect(
        screen.queryByLabelText('edit-notifications'),
      ).not.toBeInTheDocument();
    });

    test('handles component unmounting without errors', () => {
      const { unmount } = renderComponent();

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Props Handling', () => {
    test('handles showActions prop edge cases', () => {
      // Should handle undefined, null, true, false without crashing
      expect(() => renderComponent({ showActions: undefined })).not.toThrow();
      expect(() => renderComponent({ showActions: null })).not.toThrow();
      expect(() => renderComponent({ showActions: true })).not.toThrow();
      expect(() => renderComponent({ showActions: false })).not.toThrow();
    });
  });

  describe('Component Structure', () => {
    test('uses styled components correctly', () => {
      renderComponent({ showActions: true });

      expect(screen.getAllByTestId('section').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('header-row').length).toBeGreaterThan(0);
      expect(screen.getByTestId('actions')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('edit button has proper ARIA label', () => {
      renderComponent({ showActions: true });
      expect(screen.getByLabelText('edit-notifications')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    // Note: loading is now read from Redux, not props

    test('displays loading skeletons when loading state is true in Redux', () => {
      const loadingStore = createMockStore(mockSettings, true);
      renderComponent({}, loadingStore);

      const skeletons = screen.getAllByTestId('skeleton-loader');
      // Should show multiple loading skeletons for each field
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('does not display loading skeletons when loading state is false in Redux', () => {
      const notLoadingStore = createMockStore(mockSettings, false);
      renderComponent({}, notLoadingStore);

      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    });

    test('disables edit button when loading is true in Redux', () => {
      const loadingStore = createMockStore(mockSettings, true);
      renderComponent({ showActions: true }, loadingStore);

      const editButton = screen.getByLabelText('edit-notifications');
      expect(editButton).toBeDisabled();
    });

    test('edit button is not disabled when loading is false in Redux', () => {
      const notLoadingStore = createMockStore(mockSettings, false);
      renderComponent({ showActions: true }, notLoadingStore);

      const editButton = screen.getByLabelText('edit-notifications');
      expect(editButton).not.toBeDisabled();
    });

    test('shows actual values when not loading', () => {
      const notLoadingStore = createMockStore(mockSettings, false);
      renderComponent({}, notLoadingStore);

      // Should display actual values, not loading skeletons
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    });

    test('defaults to loading=false when not set in Redux', () => {
      renderComponent();

      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    });
  });

  describe('Success Toast', () => {
    test('does not show success toast when showSuccessToast is false', () => {
      renderComponent({ showSuccessToast: false });

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });

    test('shows success toast when showSuccessToast is true', () => {
      renderComponent({ showSuccessToast: true });

      expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      expect(screen.getByText('Changes saved')).toBeInTheDocument();
    });

    test('calls onCloseSuccessToast when close button is clicked', () => {
      const mockOnCloseSuccessToast = jest.fn();
      renderComponent({
        showSuccessToast: true,
        onCloseSuccessToast: mockOnCloseSuccessToast,
      });

      const closeButton = screen.getByTestId('close-success-toast');
      fireEvent.click(closeButton);

      expect(mockOnCloseSuccessToast).toHaveBeenCalledTimes(1);
    });

    test('does not call onCloseSuccessToast when it is not provided', () => {
      renderComponent({ showSuccessToast: true });

      const closeButton = screen.getByTestId('close-success-toast');

      // Should not throw error
      expect(() => fireEvent.click(closeButton)).not.toThrow();
    });

    test('hides success toast after onCloseSuccessToast is called', () => {
      const mockOnCloseSuccessToast = jest.fn();
      const { rerender, store } = renderComponent({
        showSuccessToast: true,
        onCloseSuccessToast: mockOnCloseSuccessToast,
      });

      expect(screen.getByTestId('success-toast')).toBeInTheDocument();

      // Click close
      const closeButton = screen.getByTestId('close-success-toast');
      fireEvent.click(closeButton);

      expect(mockOnCloseSuccessToast).toHaveBeenCalled();

      // Rerender with showSuccessToast=false to simulate parent state update
      rerender(
        <Provider store={store}>
          <NotificationsCardView
            showSuccessToast={false}
            onCloseSuccessToast={mockOnCloseSuccessToast}
          />
        </Provider>,
      );

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });

    test('success toast displays correct message', () => {
      renderComponent({ showSuccessToast: true });

      expect(screen.getByText('Changes saved')).toBeInTheDocument();
    });

    test('success toast is initially hidden by default', () => {
      renderComponent();

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });

    test('success toast renders with proper structure', () => {
      renderComponent({ showSuccessToast: true });

      const toast = screen.getByTestId('success-toast');
      expect(toast).toBeInTheDocument();
      expect(toast).toContainElement(screen.getByText('Changes saved'));
      expect(toast).toContainElement(screen.getByTestId('close-success-toast'));
    });
  });

  describe('Schedule notifications section', () => {
    test('does not render schedule view by default', () => {
      renderComponent();
      expect(
        screen.queryByTestId('notifications-schedule-view'),
      ).not.toBeInTheDocument();
    });

    test('does not render schedule view when showScheduleNotificationsSection is false', () => {
      renderComponent({ showScheduleNotificationsSection: false });
      expect(
        screen.queryByTestId('notifications-schedule-view'),
      ).not.toBeInTheDocument();
    });

    test('renders schedule view when showScheduleNotificationsSection is true', () => {
      renderComponent({ showScheduleNotificationsSection: true });
      expect(
        screen.getByTestId('notifications-schedule-view'),
      ).toBeInTheDocument();
    });

    test('passes loading=false from Redux to schedule view when not loading', () => {
      const store = createMockStore(mockSettings, false);
      renderComponent({ showScheduleNotificationsSection: true }, store);
      expect(screen.getByTestId('notifications-schedule-view')).toHaveAttribute(
        'data-loading',
        'false',
      );
    });

    test('passes loading=true from Redux to schedule view when loading', () => {
      const store = createMockStore(mockSettings, true);
      renderComponent({ showScheduleNotificationsSection: true }, store);
      expect(screen.getByTestId('notifications-schedule-view')).toHaveAttribute(
        'data-loading',
        'true',
      );
    });
  });
});
