// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationType,
} from 'src/__generated__/timeTracking/graphql';
import NotificationsScheduleEdit from 'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsScheduleEdit';
import scheduleNotificationsReducer, {
  toggleDraftScheduleChannel,
  syncScheduleNotificationsWithSavedData,
  type ScheduleNotificationsState,
} from 'src/js/widgets/userSettings/store/slices/scheduleNotificationsSlice';
import { SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS } from 'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/scheduleNotifications.constants';

const BASE_ROW_LABEL_IDS = Object.values(
  SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS,
).filter(
  (labelId) =>
    labelId !==
    SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.LATE_CLOCK_IN_NOTIFY_MANAGER,
);

const managerSubscription = {
  notificationType: TimeTracking_NotificationType.ShiftStartAfterManager,
  distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: jest.fn(() => jest.fn()),
}));

jest.mock('@ids-ts/typography', () => ({
  B2: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Demi: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@ids-ts/checkbox', () => ({
  Checkbox: ({
    checked,
    onChange,
    'aria-label': ariaLabel,
  }: {
    checked?: boolean;
    onChange?: () => void;
    'aria-label'?: string;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      readOnly={!onChange}
    />
  ),
}));

jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/styles/NotificationsCardEdit.styles',
  () => ({
    NotificationCategoryHeadersRow: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,
    NotificationCategoryHeadersLabel: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,
    ScheduleNotificationCategoryRow: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,
    ScheduleNotificationCategoryLabel: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,
    CheckboxColumn: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    HeaderSpacer: ({ children }: { children?: React.ReactNode }) => (
      <span>{children}</span>
    ),
  }),
);

jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/styles/NotificationsSchedule.styles',
  () => ({
    ScheduleNotificationFieldGroupFullWidth: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,
    ScheduleSectionContent: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ScheduleNotificationsEditSection: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,
  }),
);

// ---------------------------------------------------------------------------
// Store helpers
// ---------------------------------------------------------------------------

const makeStore = (preloaded: ScheduleNotificationsState) =>
  configureStore({
    reducer: { scheduleNotifications: scheduleNotificationsReducer },
    preloadedState: { scheduleNotifications: preloaded },
  });

const defaultState: ScheduleNotificationsState = {
  subscriptions: [],
  draftSubscriptions: [],
  loading: false,
  error: null,
  hasLoadedFromApi: true,
};

const renderComponent = (
  preloaded: ScheduleNotificationsState = defaultState,
) => {
  const store = makeStore(preloaded);
  render(
    <Provider store={store}>
      <NotificationsScheduleEdit />
    </Provider>,
  );
  return store;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationsScheduleEdit', () => {
  it('renders without crashing', () => {
    expect(() => renderComponent()).not.toThrow();
  });

  it('renders email and mobile column header labels', () => {
    renderComponent();

    expect(screen.getByText('notifications.email')).toBeInTheDocument();
    expect(screen.getByText('notifications.mobile')).toBeInTheDocument();
  });

  it('renders all 4 base row labels and hides manager row when ShiftStartAfterManager is not in subscriptions', () => {
    renderComponent();

    BASE_ROW_LABEL_IDS.forEach((labelId) => {
      expect(screen.getByText(labelId)).toBeInTheDocument();
    });
    expect(
      screen.queryByText(
        SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.LATE_CLOCK_IN_NOTIFY_MANAGER,
      ),
    ).not.toBeInTheDocument();
  });

  it('renders manager row when ShiftStartAfterManager is returned by the API', () => {
    renderComponent({
      ...defaultState,
      subscriptions: [managerSubscription],
      draftSubscriptions: [managerSubscription],
    });

    expect(
      screen.getByText(
        SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.LATE_CLOCK_IN_NOTIFY_MANAGER,
      ),
    ).toBeInTheDocument();
  });

  it('renders 8 checkboxes total (4 rows × 2 channels) when manager row is hidden', () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(8);
  });

  it('renders 10 checkboxes total (5 rows × 2 channels) when manager row is shown', () => {
    renderComponent({
      ...defaultState,
      subscriptions: [managerSubscription],
      draftSubscriptions: [managerSubscription],
    });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(10);
  });

  it('checkboxes default to unchecked when draftSubscriptions is empty', () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('email checkbox shows checked=true when Email medium is in draftSubscriptions for that row', () => {
    renderComponent({
      ...defaultState,
      draftSubscriptions: [
        {
          notificationType: TimeTracking_NotificationType.ShiftPublished,
          distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
        },
      ],
    });

    const emailCheckbox = screen.getByRole('checkbox', {
      name: `${SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.SHIFT_PUBLISHED_OR_CHANGED} notifications.email`,
    });
    expect(emailCheckbox).toBeChecked();

    // The corresponding mobile checkbox should be unchecked
    const mobileCheckbox = screen.getByRole('checkbox', {
      name: `${SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.SHIFT_PUBLISHED_OR_CHANGED} notifications.mobile`,
    });
    expect(mobileCheckbox).not.toBeChecked();
  });

  it('mobile checkbox shows checked=true when PushNotification medium is in draftSubscriptions', () => {
    renderComponent({
      ...defaultState,
      draftSubscriptions: [
        {
          notificationType: TimeTracking_NotificationType.ShiftStartBefore,
          distributionMethods: [
            TimeTracking_NotificationReminderMedium.PushNotification,
          ],
        },
      ],
    });

    const mobileCheckbox = screen.getByRole('checkbox', {
      name: `${SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.ONE_HOUR_BEFORE_SHIFT} notifications.mobile`,
    });
    expect(mobileCheckbox).toBeChecked();

    // The corresponding email checkbox should be unchecked
    const emailCheckbox = screen.getByRole('checkbox', {
      name: `${SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.ONE_HOUR_BEFORE_SHIFT} notifications.email`,
    });
    expect(emailCheckbox).not.toBeChecked();
  });

  it('both checkboxes show checked when row has both Email and PushNotification', () => {
    renderComponent({
      ...defaultState,
      draftSubscriptions: [
        {
          notificationType: TimeTracking_NotificationType.ShiftStartAfter,
          distributionMethods: [
            TimeTracking_NotificationReminderMedium.Email,
            TimeTracking_NotificationReminderMedium.PushNotification,
          ],
        },
      ],
    });

    const emailCheckbox = screen.getByRole('checkbox', {
      name: `${SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED} notifications.email`,
    });
    const mobileCheckbox = screen.getByRole('checkbox', {
      name: `${SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED} notifications.mobile`,
    });

    expect(emailCheckbox).toBeChecked();
    expect(mobileCheckbox).toBeChecked();
  });

  it('clicking an email checkbox updates Redux draft state for that row', () => {
    const store = renderComponent();

    const emailCheckbox = screen.getByRole('checkbox', {
      name: `${SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.SHIFT_PUBLISHED_OR_CHANGED} notifications.email`,
    });
    fireEvent.click(emailCheckbox);

    const draft = store.getState().scheduleNotifications.draftSubscriptions;
    const row = draft.find(
      (r) =>
        r.notificationType === TimeTracking_NotificationType.ShiftPublished,
    );
    expect(row?.distributionMethods).toContain(
      TimeTracking_NotificationReminderMedium.Email,
    );
  });

  it('clicking a mobile checkbox updates Redux draft state with PushNotification medium', () => {
    const store = renderComponent();

    const mobileCheckbox = screen.getByRole('checkbox', {
      name: `${SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.ONE_HOUR_BEFORE_SHIFT} notifications.mobile`,
    });
    fireEvent.click(mobileCheckbox);

    const draft = store.getState().scheduleNotifications.draftSubscriptions;
    const row = draft.find(
      (r) =>
        r.notificationType === TimeTracking_NotificationType.ShiftStartBefore,
    );
    expect(row?.distributionMethods).toContain(
      TimeTracking_NotificationReminderMedium.PushNotification,
    );
  });

  it('toggleDraftScheduleChannel produces correct action shape', () => {
    expect(
      toggleDraftScheduleChannel({
        notificationType: TimeTracking_NotificationType.ShiftStartAfterManager,
        medium: TimeTracking_NotificationReminderMedium.Email,
      }),
    ).toMatchObject({
      type: 'scheduleNotifications/toggleDraftScheduleChannel',
      payload: {
        notificationType: TimeTracking_NotificationType.ShiftStartAfterManager,
        medium: TimeTracking_NotificationReminderMedium.Email,
      },
    });
  });

  it('clicking a checkbox updates the store state (Email toggled on)', () => {
    const store = renderComponent();

    const emailCheckbox = screen.getByRole('checkbox', {
      name: `${SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.SHIFT_PUBLISHED_OR_CHANGED} notifications.email`,
    });
    expect(emailCheckbox).not.toBeChecked();

    fireEvent.click(emailCheckbox);

    const state = store.getState().scheduleNotifications;
    const row = state.draftSubscriptions.find(
      (r) =>
        r.notificationType === TimeTracking_NotificationType.ShiftPublished,
    );
    expect(row).toBeDefined();
    expect(row?.distributionMethods).toContain(
      TimeTracking_NotificationReminderMedium.Email,
    );
  });

  it('renders the schedule section title NLS id', () => {
    renderComponent();

    expect(
      screen.getByText('notifications.schedule.title'),
    ).toBeInTheDocument();
  });
});
