import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  aTimeTracking_OvertimeNotificationRule,
  aTimeTracking_OvertimeThreshold,
} from '__mocks__/__generated__/timeTracking';
import { TimeTracking_OvertimePeriod } from 'src/__generated__/timeTracking/graphql';
import NotificationsOvertimeView from 'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsOvertimeView';
import overtimeNotificationsReducer, {
  type OvertimeNotificationsState,
} from 'src/js/widgets/userSettings/store/slices/overtimeNotificationsSlice';

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
  useTracking: () => jest.fn(),
}));

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

const dayRule = aTimeTracking_OvertimeNotificationRule({
  id: 'r-day',
  threshold: aTimeTracking_OvertimeThreshold({
    period: TimeTracking_OvertimePeriod.Day,
  }),
});

const makeStore = (preloaded: OvertimeNotificationsState) =>
  configureStore({
    reducer: { overtimeNotifications: overtimeNotificationsReducer },
    preloadedState: {
      overtimeNotifications: preloaded,
    },
  });

describe('NotificationsOvertimeView', () => {
  it('shows skeletons when not loaded from API', () => {
    const store = makeStore({
      rules: [],
      draftRules: [],
      loading: false,
      error: null,
      hasLoadedFromApi: false,
    });

    render(
      <Provider store={store}>
        <NotificationsOvertimeView overtimeBadgeVisibilityEndDate="2099-12-31" />
      </Provider>,
    );

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('shows setup description when loaded and no displayable rules', () => {
    const store = makeStore({
      rules: [],
      draftRules: [],
      loading: false,
      error: null,
      hasLoadedFromApi: true,
    });

    render(
      <Provider store={store}>
        <NotificationsOvertimeView overtimeBadgeVisibilityEndDate="2099-12-31" />
      </Provider>,
    );

    expect(
      screen.getByText('notifications.overtime.description'),
    ).toBeInTheDocument();
  });

  it('renders only daily block when only day rule exists', () => {
    const store = makeStore({
      rules: [dayRule],
      draftRules: [dayRule],
      loading: false,
      error: null,
      hasLoadedFromApi: true,
    });

    render(
      <Provider store={store}>
        <NotificationsOvertimeView overtimeBadgeVisibilityEndDate="2099-12-31" />
      </Provider>,
    );

    expect(
      screen.getByText('notifications.overtime.daily'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('notifications.overtime.weekly'),
    ).not.toBeInTheDocument();
  });

  it('shows New badge when overtime badge visibility date is active', () => {
    const store = makeStore({
      rules: [dayRule],
      draftRules: [dayRule],
      loading: false,
      error: null,
      hasLoadedFromApi: true,
    });

    render(
      <Provider store={store}>
        <NotificationsOvertimeView overtimeBadgeVisibilityEndDate="2099-12-31" />
      </Provider>,
    );

    expect(screen.getByText('new')).toBeInTheDocument();
  });

  it('does not show New badge when overtime badge visibility date is empty', () => {
    const store = makeStore({
      rules: [dayRule],
      draftRules: [dayRule],
      loading: false,
      error: null,
      hasLoadedFromApi: true,
    });

    render(
      <Provider store={store}>
        <NotificationsOvertimeView overtimeBadgeVisibilityEndDate="" />
      </Provider>,
    );

    expect(screen.queryByText('new')).not.toBeInTheDocument();
  });
});
