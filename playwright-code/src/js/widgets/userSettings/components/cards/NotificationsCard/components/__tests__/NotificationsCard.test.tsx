// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import notificationsReducer from 'src/js/widgets/userSettings/store/slices/notificationsSlice';
import settingsContextReducer from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import breaksReducer from 'src/js/widgets/userSettings/store/slices/breaksSlice';
import locationReducer from 'src/js/widgets/userSettings/store/slices/locationSlice';
import overtimeReducer from 'src/js/widgets/userSettings/store/slices/overtimeSlice';
import overtimeNotificationsReducer from 'src/js/widgets/userSettings/store/slices/overtimeNotificationsSlice';
import scheduleNotificationsReducer from 'src/js/widgets/userSettings/store/slices/scheduleNotificationsSlice';

import { useManageUserSettings } from 'src/js/service/hooks/userLevelSettings/useManageUserSettings';
import { useManageUserOvertimeNotifications } from 'src/js/service/hooks/userLevelSettings/useManageUserOvertimeNotifications';
import { mapOvertimeNotificationUnifiedInput } from 'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/NotificationsCard.utils';
import NotificationsCardEdit from '../NotificationsCardEdit';
import NotificationsCardView from '../NotificationsCardView';

const mockNotificationsOvertimeView = jest.fn();

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
  useSandbox: () => ({ logger: { info: jest.fn(), error: jest.fn() } }),
  useTracking: jest.fn(() => jest.fn()),
}));

jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsOvertimeView',
  () => (props: any) => {
    mockNotificationsOvertimeView(props);
    return <div data-testid="overtime-view" />;
  },
);
jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsOvertimeEdit',
  () => () => <div data-testid="overtime-edit" />,
);
jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsCardTimeDropdown',
  () => ({
    NotificationsCardTimeDropdown: () => <div data-testid="time-dropdown" />,
  }),
);

jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({ open }: any) =>
    open ? <div data-testid="success-toast" /> : null,
}));

jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({
    children,
    onClick,
    disabled,
    'aria-label': ariaLabel,
  }: any) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));
jest.mock('@design-systems/icons', () => ({
  Edit: () => <svg data-testid="edit-icon" />,
}));
jest.mock('@cgds/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));
jest.mock('@ids-ts/typography', () => ({
  B1: ({ children }: any) => <span>{children}</span>,
  B2: ({ children }: any) => <span>{children}</span>,
  B4: ({ children }: any) => <span>{children}</span>,
  Demi: ({ children }: any) => <span>{children}</span>,
  Medium: ({ children }: any) => <span>{children}</span>,
  H6: ({ children }: any) => <h6>{children}</h6>,
}));
jest.mock('@ids-ts/button', () => ({
  Button: ({ children, onClick, disabled, 'aria-label': ariaLabel }: any) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));
jest.mock('@ids-ts/loader', () => ({ Activity: () => <span /> }));
jest.mock('@ids-ts/checkbox', () => ({
  Checkbox: ({ checked, onChange, 'aria-label': ariaLabel, children }: any) => (
    <>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        readOnly
      />
      {children}
    </>
  ),
}));
jest.mock('@ids-ts/dropdown', () => ({
  Dropdown: ({ children }: any) => <div>{children}</div>,
  MenuItem: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@ids-ts/radio', () => ({ RadioGroup: () => null }));

jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/styles/NotificationsCardEdit.styles',
  () => {
    const React = require('react');
    const div =
      (name: string) =>
      ({ children }: any) =>
        <div data-testid={name}>{children}</div>;
    return {
      Section: div('section'),
      FormRow: div('form-row'),
      FormLabel: div('form-label'),
      FormControl: div('form-control'),
      ControlCell: div('control-cell'),
      CheckboxContainer: div('checkbox-container'),
      CheckboxLabel: div('checkbox-label'),
      CheckboxWrapper: div('checkbox-wrapper'),
      Divider: div('divider'),
      ActionButtons: div('action-buttons'),
      HeaderSpacer: div('header-spacer'),
      NotificationSettingsGroup: div('notification-settings-group'),
      NotificationCategoryHeadersRow: div('category-headers-row'),
      NotificationCategoryHeadersLabel: div('category-headers-label'),
      NotificationCategoryRow: div('category-row'),
      NotificationCategoryLabel: div('category-label'),
      CheckboxColumn: div('checkbox-column'),
      StyledPageMessage: ({ children, title, open }: any) =>
        open ? (
          <div data-testid="page-message">
            <span>{title}</span>
            {children}
          </div>
        ) : null,
      SectionTitle: div('section-title'),
    };
  },
);

jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/styles/NotificationsCardView.styles',
  () => {
    const React = require('react');
    const div =
      (n: string) =>
      ({ children }: any) =>
        <div data-testid={n}>{children}</div>;
    return { Section: div('section'), KV: div('kv') };
  },
);

jest.mock('src/js/widgets/userSettings/components/styles/cards.styles', () => {
  const React = require('react');
  const div =
    (n: string) =>
    ({ children }: any) =>
      <div data-testid={n}>{children}</div>;
  return {
    HeaderRow: div('header-row'),
    Actions: div('actions'),
    FieldGroup: div('field-group'),
  };
});

jest.mock(
  'src/js/service/hooks/userLevelSettings/useManageUserSettings',
  () => ({
    useManageUserSettings: jest.fn(),
  }),
);
jest.mock(
  'src/js/service/hooks/userLevelSettings/useManageUserOvertimeNotifications',
  () => ({
    useManageUserOvertimeNotifications: jest.fn(),
  }),
);
jest.mock(
  'src/js/service/hooks/userLevelSettings/useManageUserScheduleNotifications',
  () => ({
    useManageUserScheduleNotifications: jest.fn(() => ({
      saveUserScheduleNotifications: jest.fn().mockResolvedValue(true),
      loading: false,
    })),
  }),
);
jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsScheduleEdit',
  () => () => <div data-testid="notifications-schedule-edit" />,
);
jest.mock('src/js/common/CustomerInteraction', () => ({
  TimeCustomerInteraction: {
    USER_NOTIFICATION_SETTINGS_SAVE: 'SAVE',
  },
}));
jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/NotificationsCard.utils',
  () => ({
    mapNotificationSettingsToManageUserInput: jest.fn(() => ({})),
    mapOvertimeNotificationUnifiedInput: jest.fn(() => null),
    getNotificationStatus: jest.fn(() => 'off'),
    formatDaysOfWeek: jest.fn(() => 'Mon–Fri'),
    mapEffectiveUserSettings: jest.fn(() => ({})),
  }),
);
jest.mock(
  'src/js/widgets/userSettings/components/constants/UserSettingsPage.constants',
  () => ({
    NOTIFICATION_DAYS_OF_WEEK: { MONDAY: 'MONDAY', TUESDAY: 'TUESDAY' },
  }),
);

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

const createTestStore = (overrides: Record<string, any> = {}) =>
  configureStore({
    reducer: {
      settingsContext: settingsContextReducer,
      notifications: notificationsReducer,
      breaks: breaksReducer,
      location: locationReducer,
      overtime: overtimeReducer,
      overtimeNotifications: overtimeNotificationsReducer,
      scheduleNotifications: scheduleNotificationsReducer,
    },
    preloadedState: overrides,
  });

const defaultSettingsContext = {
  settingsFor: { timeForType: 'EMPLOYEE' as any, id: 'user-1' },
};

const renderView = (
  props: React.ComponentProps<typeof NotificationsCardView> = {},
  storeOverrides: Record<string, any> = {},
) => {
  const store = createTestStore({
    settingsContext: defaultSettingsContext,
    ...storeOverrides,
  });
  return render(
    <Provider store={store}>
      <NotificationsCardView {...props} />
    </Provider>,
  );
};

const renderEdit = (
  props: React.ComponentProps<typeof NotificationsCardEdit> = {},
  storeOverrides: Record<string, any> = {},
) => {
  const store = createTestStore({
    settingsContext: defaultSettingsContext,
    ...storeOverrides,
  });
  const utils = render(
    <Provider store={store}>
      <NotificationsCardEdit {...props} />
    </Provider>,
  );
  return { store, ...utils };
};

// ---------------------------------------------------------------------------
// Default mutation mocks (no-op / success)
// ---------------------------------------------------------------------------

const noopMutationFn = jest.fn().mockResolvedValue({ data: null, errors: [] });
const noopOvertimeFn = jest.fn().mockResolvedValue(true);

beforeEach(() => {
  jest.clearAllMocks();

  (useManageUserSettings as jest.Mock).mockReturnValue([noopMutationFn, {}]);
  (useManageUserOvertimeNotifications as jest.Mock).mockReturnValue({
    saveUserOvertimeNotifications: noopOvertimeFn,
  });
});

// ---------------------------------------------------------------------------
// NotificationsCardView tests
// ---------------------------------------------------------------------------

describe('NotificationsCardView', () => {
  it('renders the notifications title', () => {
    renderView();
    expect(screen.getByText('notifications.title')).toBeInTheDocument();
  });

  it('shows the edit button by default', () => {
    renderView();
    expect(
      screen.getByRole('button', { name: 'edit-notifications' }),
    ).toBeInTheDocument();
  });

  it('hides the edit button when showActions is false', () => {
    renderView({ showActions: false });
    expect(
      screen.queryByRole('button', { name: 'edit-notifications' }),
    ).not.toBeInTheDocument();
  });

  it('renders Skeleton components when loading', () => {
    renderView(
      {},
      {
        notifications: {
          loading: true,
          mode: 'VIEW',
          settings: {
            clockInTime: '8:00 AM',
            clockOutTime: '5:00 PM',
            daysOfWeek: [],
            clockInEmail: false,
            clockInMobile: false,
            clockOutEmail: false,
            clockOutMobile: false,
            versions: {
              clockInReminderTime: '1',
              clockInNotificationMedium: '1',
              clockOutReminderTime: '1',
              clockOutNotificationMedium: '1',
              notificationEnabledForDays: '1',
            },
          },
          draftSettings: {
            clockInTime: '8:00 AM',
            clockOutTime: '5:00 PM',
            daysOfWeek: [],
            clockInEmail: false,
            clockInMobile: false,
            clockOutEmail: false,
            clockOutMobile: false,
            versions: {
              clockInReminderTime: '1',
              clockInNotificationMedium: '1',
              clockOutReminderTime: '1',
              clockOutNotificationMedium: '1',
              notificationEnabledForDays: '1',
            },
          },
          error: null,
        },
      },
    );
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not render the overtime section by default', () => {
    renderView();
    expect(screen.queryByTestId('overtime-view')).not.toBeInTheDocument();
  });

  it('renders the overtime section when showOvertimeNotificationsSection is true', () => {
    renderView({ showOvertimeNotificationsSection: true });
    expect(screen.getByTestId('overtime-view')).toBeInTheDocument();
  });

  it('passes overtime badge visibility date to NotificationsOvertimeView', () => {
    renderView({
      showOvertimeNotificationsSection: true,
      overtimeBadgeVisibilityEndDate: '2099-12-31',
    });

    expect(mockNotificationsOvertimeView).toHaveBeenCalledWith(
      expect.objectContaining({
        overtimeBadgeVisibilityEndDate: '2099-12-31',
      }),
    );
  });

  it('renders the success toast when showSuccessToast is true', () => {
    renderView({ showSuccessToast: true });
    expect(screen.getByTestId('success-toast')).toBeInTheDocument();
  });

  it('does not render the success toast when showSuccessToast is false', () => {
    renderView({ showSuccessToast: false });
    expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// NotificationsCardEdit tests
// ---------------------------------------------------------------------------

describe('NotificationsCardEdit', () => {
  it('dispatches cancelEdit and returns to VIEW mode when cancel is clicked', async () => {
    const { store } = renderEdit();

    // Put store in EDIT mode first so we can verify it goes back to VIEW
    store.dispatch({ type: 'notifications/setMode', payload: 'EDIT' });

    fireEvent.click(
      screen.getByRole('button', { name: 'cancel-notifications' }),
    );

    await waitFor(() => {
      const state = store.getState() as ReturnType<typeof store.getState>;
      expect((state as any).notifications.mode).toBe('VIEW');
    });
  });

  it('does not call onSaveSuccess when save is clicked with no changes', async () => {
    const onSaveSuccess = jest.fn();
    const baseSettings = {
      clockInTime: '8:00 AM',
      clockOutTime: '5:00 PM',
      daysOfWeek: ['MONDAY'],
      clockInEmail: false,
      clockInMobile: false,
      clockOutEmail: false,
      clockOutMobile: false,
      versions: {
        clockInReminderTime: '1',
        clockInNotificationMedium: '1',
        clockOutReminderTime: '1',
        clockOutNotificationMedium: '1',
        notificationEnabledForDays: '1',
      },
    };

    renderEdit(
      { onSaveSuccess },
      {
        notifications: {
          mode: 'EDIT',
          settings: baseSettings,
          draftSettings: baseSettings,
          loading: false,
          error: null,
        },
      },
    );

    fireEvent.click(screen.getByRole('button', { name: 'save-notifications' }));

    await waitFor(() => {
      expect(noopMutationFn).not.toHaveBeenCalled();
    });

    expect(onSaveSuccess).not.toHaveBeenCalled();
  });

  it('does not render the overtime edit section by default', () => {
    renderEdit();
    expect(screen.queryByTestId('overtime-edit')).not.toBeInTheDocument();
  });

  it('renders the overtime edit section when showOvertimeNotificationsSection is true', () => {
    renderEdit({ showOvertimeNotificationsSection: true });
    expect(screen.getByTestId('overtime-edit')).toBeInTheDocument();
  });

  it('does not call onSaveSuccess when overtime save returns false (partial-save)', async () => {
    const onSaveSuccess = jest.fn();

    // Reminder mutation resolves successfully with no errors and no typed payload
    const successMutationFn = jest
      .fn()
      .mockResolvedValue({ data: {}, errors: [] });
    (useManageUserSettings as jest.Mock).mockReturnValue([
      successMutationFn,
      {},
    ]);

    // Overtime save fails
    const failOvertimeFn = jest.fn().mockResolvedValue(false);
    (useManageUserOvertimeNotifications as jest.Mock).mockReturnValue({
      saveUserOvertimeNotifications: failOvertimeFn,
    });

    // mapOvertimeNotificationUnifiedInput returns a non-null input so the save is attempted
    (mapOvertimeNotificationUnifiedInput as jest.Mock).mockReturnValue({
      someField: 'value',
    });

    renderEdit({ onSaveSuccess, showOvertimeNotificationsSection: true });

    fireEvent.click(screen.getByRole('button', { name: 'save-notifications' }));

    await waitFor(() => {
      expect(failOvertimeFn).toHaveBeenCalled();
    });

    expect(onSaveSuccess).not.toHaveBeenCalled();
  });

  it('renders an error message when the mutation calls onError', async () => {
    // Capture the onError callback passed to useManageUserSettings and call it
    let capturedOnError: ((msg: string) => void) | undefined;

    (useManageUserSettings as jest.Mock).mockImplementation(
      ({ onError }: any) => {
        capturedOnError = onError;
        const mutationFn = jest.fn().mockImplementation(async () => {
          capturedOnError?.('Something went wrong');
          return { data: null, errors: [{ message: 'Something went wrong' }] };
        });
        return [mutationFn, {}];
      },
    );

    const baseSettings = {
      clockInTime: '8:00 AM',
      clockOutTime: '5:00 PM',
      daysOfWeek: ['MONDAY'],
      clockInEmail: false,
      clockInMobile: false,
      clockOutEmail: false,
      clockOutMobile: false,
      versions: {
        clockInReminderTime: '1',
        clockInNotificationMedium: '1',
        clockOutReminderTime: '1',
        clockOutNotificationMedium: '1',
        notificationEnabledForDays: '1',
      },
    };
    // Draft differs from saved so isReminderDirty is true and the mutation fires
    renderEdit(
      {},
      {
        notifications: {
          mode: 'EDIT',
          settings: baseSettings,
          draftSettings: { ...baseSettings, clockInTime: '9:00 AM' },
          loading: false,
          error: null,
        },
      },
    );

    fireEvent.click(screen.getByRole('button', { name: 'save-notifications' }));

    await waitFor(() => {
      expect(screen.getByTestId('page-message')).toBeInTheDocument();
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
