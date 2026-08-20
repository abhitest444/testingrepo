import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_OvertimePeriod,
  TimeTracking_OvertimeRuleEntityType,
  TimeTracking_OvertimeNotificationRule,
} from 'src/__generated__/timeTracking/graphql';
import EmployerOvertimeNotificationsView from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EmployerOvertimeNotificationsView';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => mockLogger,
}));

const makeRule = (
  period: TimeTracking_OvertimePeriod.Day | TimeTracking_OvertimePeriod.Week,
  id: string,
): TimeTracking_OvertimeNotificationRule =>
  ({
    __typename: 'TimeTracking_OvertimeNotificationRule',
    id,
    meta: { __typename: 'TimeTracking_SettingMeta', version: '1' },
    threshold: {
      __typename: 'TimeTracking_OvertimeThreshold',
      hours: 8,
      minutes: 0,
      period,
    },
    alertFrequency: {
      __typename: 'TimeTracking_OvertimeAlertFrequency',
      totalAlerts: 2,
      intervalMinutes: 60,
    },
    recipients: {
      __typename: 'TimeTracking_OvertimeAlertRecipients',
      admin: [
        TimeTracking_NotificationReminderMedium.Email,
        TimeTracking_NotificationReminderMedium.PushNotification,
      ],
      groupManager: [TimeTracking_NotificationReminderMedium.Email],
      employee: [TimeTracking_NotificationReminderMedium.Email],
    },
    assignedTo: {
      __typename: 'TimeTracking_OvertimeRuleAssignment',
      entityType: TimeTracking_OvertimeRuleEntityType.All,
      entityIds: '-1',
    },
  } as TimeTracking_OvertimeNotificationRule);

describe('EmployerOvertimeNotificationsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('renders loading skeleton when loading', () => {
    render(
      <EmployerOvertimeNotificationsView
        rules={[]}
        loading
        hasLoadedFromApi={false}
      />,
    );

    expect(
      screen.getByText('notifications.overtime.title'),
    ).toBeInTheDocument();
  });

  it('renders loading skeleton when hasLoadedFromApi is false', () => {
    render(
      <EmployerOvertimeNotificationsView
        rules={[]}
        loading={false}
        hasLoadedFromApi={false}
      />,
    );

    expect(
      screen.getByText('notifications.overtime.title'),
    ).toBeInTheDocument();
  });

  it('renders empty state with description when no displayable rules', () => {
    const neverRule = {
      ...makeRule(TimeTracking_OvertimePeriod.Day, 'n1'),
      threshold: {
        __typename: 'TimeTracking_OvertimeThreshold' as const,
        hours: 0,
        minutes: 0,
        period: TimeTracking_OvertimePeriod.Never,
      },
    } as TimeTracking_OvertimeNotificationRule;

    render(
      <EmployerOvertimeNotificationsView
        rules={[neverRule]}
        loading={false}
        hasLoadedFromApi
      />,
    );

    expect(
      screen.getByText('notifications.overtime.description'),
    ).toBeInTheDocument();
  });

  it('renders empty state when rules array is empty', () => {
    render(
      <EmployerOvertimeNotificationsView
        rules={[]}
        loading={false}
        hasLoadedFromApi
      />,
    );

    expect(
      screen.getByText('notifications.overtime.description'),
    ).toBeInTheDocument();
  });

  it('renders daily block when day rule exists', () => {
    render(
      <EmployerOvertimeNotificationsView
        rules={[makeRule(TimeTracking_OvertimePeriod.Day, 'd1')]}
        loading={false}
        hasLoadedFromApi
      />,
    );

    expect(
      screen.getByText('notifications.overtime.daily'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('notifications.overtime.weekly'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('notifications.overtime.threshold.question'),
    ).toBeInTheDocument();
  });

  it('renders weekly block when week rule exists', () => {
    render(
      <EmployerOvertimeNotificationsView
        rules={[makeRule(TimeTracking_OvertimePeriod.Week, 'w1')]}
        loading={false}
        hasLoadedFromApi
      />,
    );

    expect(
      screen.getByText('notifications.overtime.weekly'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('notifications.overtime.daily'),
    ).not.toBeInTheDocument();
  });

  it('renders both daily and weekly when both rules exist', () => {
    render(
      <EmployerOvertimeNotificationsView
        rules={[
          makeRule(TimeTracking_OvertimePeriod.Day, 'd1'),
          makeRule(TimeTracking_OvertimePeriod.Week, 'w1'),
        ]}
        loading={false}
        hasLoadedFromApi
      />,
    );

    expect(
      screen.getByText('notifications.overtime.daily'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('notifications.overtime.weekly'),
    ).toBeInTheDocument();
  });

  it('logs view mounted once after first loaded render', () => {
    const { rerender } = render(
      <EmployerOvertimeNotificationsView
        rules={[makeRule(TimeTracking_OvertimePeriod.Day, 'd1')]}
        loading={false}
        hasLoadedFromApi
      />,
    );

    rerender(
      <EmployerOvertimeNotificationsView
        rules={[makeRule(TimeTracking_OvertimePeriod.Day, 'd1')]}
        loading={false}
        hasLoadedFromApi
      />,
    );

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ hasRules: true, rulesCount: 1 }),
    );
  });
});
