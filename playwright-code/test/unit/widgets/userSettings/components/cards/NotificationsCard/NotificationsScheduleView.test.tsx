// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationType,
} from 'src/__generated__/timeTracking/graphql';
import NotificationsScheduleView from 'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsScheduleView';
import scheduleNotificationsReducer, {
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

jest.mock('@cgds/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

jest.mock('@ids-ts/typography', () => ({
  B2: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  B4: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Demi: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Medium: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('src/js/widgets/userSettings/components/styles/cards.styles', () => ({
  FieldGroup: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/styles/NotificationsSchedule.styles',
  () => ({
    ScheduleNotificationLabel: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,
    ScheduleNotificationsKv: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ScheduleNotificationFieldGroupFullWidth: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,
    ScheduleSectionContent: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ScheduleErrorMessage: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="schedule-error-message">{children}</div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/styles/NotificationsCardView.styles',
  () => ({
    Section: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    KV: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  }),
);

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

const managerSubscription = {
  notificationType: TimeTracking_NotificationType.ShiftStartAfterManager,
  distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
};

describe('NotificationsScheduleView', () => {
  it('shows 4 skeletons when loading and manager row is not returned by API', () => {
    const store = makeStore(defaultState);

    render(
      <Provider store={store}>
        <NotificationsScheduleView loading />
      </Provider>,
    );

    expect(screen.getAllByTestId('skeleton')).toHaveLength(4);
  });

  it('shows 5 skeletons when loading and manager row is returned by API', () => {
    const store = makeStore({
      ...defaultState,
      subscriptions: [managerSubscription],
      draftSubscriptions: [managerSubscription],
    });

    render(
      <Provider store={store}>
        <NotificationsScheduleView loading />
      </Provider>,
    );

    expect(screen.getAllByTestId('skeleton')).toHaveLength(5);
  });

  it('shows 4 skeletons when slice loading is true and no manager subscription', () => {
    const store = makeStore({ ...defaultState, loading: true });

    render(
      <Provider store={store}>
        <NotificationsScheduleView loading={false} />
      </Provider>,
    );

    expect(screen.getAllByTestId('skeleton')).toHaveLength(4);
  });

  it('renders 4 base rows and hides manager row when ShiftStartAfterManager is not in subscriptions', () => {
    const store = makeStore(defaultState);

    render(
      <Provider store={store}>
        <NotificationsScheduleView loading={false} />
      </Provider>,
    );

    expect(screen.queryAllByTestId('skeleton')).toHaveLength(0);

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
    const store = makeStore({
      ...defaultState,
      subscriptions: [managerSubscription],
      draftSubscriptions: [managerSubscription],
    });

    render(
      <Provider store={store}>
        <NotificationsScheduleView loading={false} />
      </Provider>,
    );

    expect(
      screen.getByText(
        SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.LATE_CLOCK_IN_NOTIFY_MANAGER,
      ),
    ).toBeInTheDocument();
  });

  it('renders formatted value for shiftPublishedOrChanged when subscription has Email channel', () => {
    const store = makeStore(defaultState);

    store.dispatch(
      syncScheduleNotificationsWithSavedData([
        {
          notificationType: TimeTracking_NotificationType.ShiftPublished,
          distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
        },
      ]),
    );

    render(
      <Provider store={store}>
        <NotificationsScheduleView loading={false} />
      </Provider>,
    );

    expect(
      screen.getByText('notifications.schedule.view.on-with-channel'),
    ).toBeInTheDocument();
  });

  it('shows error message and hides rows when slice has an error', () => {
    const store = makeStore({ ...defaultState, error: 'Something went wrong' });

    render(
      <Provider store={store}>
        <NotificationsScheduleView loading={false} />
      </Provider>,
    );

    expect(screen.getByTestId('schedule-error-message')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    Object.values(SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS).forEach(
      (labelId) => {
        expect(screen.queryByText(labelId)).not.toBeInTheDocument();
      },
    );
  });
});
