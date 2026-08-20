import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_OvertimePeriod,
  TimeTracking_OvertimeRuleEntityType,
  TimeTracking_OvertimeNotificationRule,
} from 'src/__generated__/timeTracking/graphql';
import EmployerOvertimeNotificationsEdit from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EmployerOvertimeNotificationsEdit';

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

// Mock TextField to expose errorText for testing validation feedback
jest.mock('@ids-ts/text-field', () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    'aria-label': ariaLabel,
    errorText,
    min,
    max,
  }: any) => (
    <div>
      <input
        type="number"
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        min={min}
        max={max}
      />
      {errorText && <span data-testid={`error-${ariaLabel}`}>{errorText}</span>}
    </div>
  ),
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
      minutes: 15,
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

describe('EmployerOvertimeNotificationsEdit', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows skeleton when loading', () => {
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[]}
        loading
        hasLoadedFromApi={false}
        onDraftRulesChange={jest.fn()}
      />,
    );

    expect(
      screen.getByText('notifications.overtime.title'),
    ).toBeInTheDocument();
  });

  it('shows skeleton when hasLoadedFromApi is false', () => {
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[]}
        loading={false}
        hasLoadedFromApi={false}
        onDraftRulesChange={jest.fn()}
      />,
    );

    expect(
      screen.getByText('notifications.overtime.title'),
    ).toBeInTheDocument();
  });

  it('renders daily and weekly toggles when loaded', () => {
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={jest.fn()}
      />,
    );

    expect(
      screen.getByText('notifications.overtime.daily'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('notifications.overtime.weekly'),
    ).toBeInTheDocument();
  });

  it('opens daily panel and adds default rule when toggled on from empty', () => {
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    const dailyCheckbox = screen.getByRole('checkbox', {
      name: /notifications\.overtime\.daily/i,
    });
    fireEvent.click(dailyCheckbox);

    expect(onDraftRulesChange).toHaveBeenCalledTimes(1);
    const next = onDraftRulesChange.mock
      .calls[0][0] as TimeTracking_OvertimeNotificationRule[];
    expect(next).toHaveLength(1);
    expect(next[0].threshold.period).toBe(TimeTracking_OvertimePeriod.Day);
  });

  it('removes day rule when daily toggle turned off', () => {
    const day = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
    const onDraftRulesChange = jest.fn();
    const { rerender } = render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[day]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    const dailyCheckbox = screen.getByRole('checkbox', {
      name: /notifications\.overtime\.daily/i,
    });
    expect(dailyCheckbox).toBeChecked();

    fireEvent.click(dailyCheckbox);

    expect(onDraftRulesChange).toHaveBeenCalledWith([]);
    onDraftRulesChange.mockClear();

    rerender(
      <EmployerOvertimeNotificationsEdit
        draftRules={[]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    fireEvent.click(dailyCheckbox);
    expect(onDraftRulesChange).toHaveBeenCalled();
  });

  it('opens weekly panel and adds default week rule when toggled on', () => {
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    const weeklyCheckbox = screen.getByRole('checkbox', {
      name: /notifications\.overtime\.weekly/i,
    });
    fireEvent.click(weeklyCheckbox);

    expect(onDraftRulesChange).toHaveBeenCalledTimes(1);
    const next = onDraftRulesChange.mock
      .calls[0][0] as TimeTracking_OvertimeNotificationRule[];
    expect(next[0].threshold.period).toBe(TimeTracking_OvertimePeriod.Week);
  });

  it('toggles admin mobile (push) recipient checkbox', () => {
    const day = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[day]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('overtime-admin-mobile-day'));
    expect(onDraftRulesChange).toHaveBeenCalled();
    const next = onDraftRulesChange.mock
      .calls[0][0] as TimeTracking_OvertimeNotificationRule[];
    expect(
      next[0].recipients.admin.includes(
        TimeTracking_NotificationReminderMedium.PushNotification,
      ),
    ).toBe(false);
  });

  it('updates threshold hours via TextField', () => {
    const day = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[day]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    const hoursInput = screen.getByLabelText('overtime-threshold-hours-day');
    fireEvent.change(hoursInput, { target: { value: '6' } });

    expect(onDraftRulesChange).toHaveBeenCalled();
    const next = onDraftRulesChange.mock
      .calls[0][0] as TimeTracking_OvertimeNotificationRule[];
    expect(next[0].threshold.hours).toBe(6);
  });

  it('clamps daily threshold hours to max 24', () => {
    const day = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[day]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    const hoursInput = screen.getByLabelText('overtime-threshold-hours-day');
    fireEvent.change(hoursInput, { target: { value: '500' } });

    const next = onDraftRulesChange.mock
      .calls[0][0] as TimeTracking_OvertimeNotificationRule[];
    expect(next[0].threshold.hours).toBe(24);
  });

  it('clamps weekly threshold hours to max 168', () => {
    const week = makeRule(TimeTracking_OvertimePeriod.Week, 'w1');
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[week]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    const hoursInput = screen.getByLabelText('overtime-threshold-hours-week');
    fireEvent.change(hoursInput, { target: { value: '500' } });

    const next = onDraftRulesChange.mock
      .calls[0][0] as TimeTracking_OvertimeNotificationRule[];
    expect(next[0].threshold.hours).toBe(168);
  });

  it('clamps threshold hours to min 1', () => {
    const day = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[day]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    const hoursInput = screen.getByLabelText('overtime-threshold-hours-day');
    fireEvent.change(hoursInput, { target: { value: '0' } });

    const next = onDraftRulesChange.mock
      .calls[0][0] as TimeTracking_OvertimeNotificationRule[];
    expect(next[0].threshold.hours).toBe(1);
  });

  it('clamps total alerts to range 1-10', () => {
    const day = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[day]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    // Test max clamping
    fireEvent.change(screen.getByLabelText('overtime-total-alerts-day'), {
      target: { value: '100' },
    });
    expect(
      (
        onDraftRulesChange.mock
          .calls[0][0] as TimeTracking_OvertimeNotificationRule[]
      )[0].alertFrequency.totalAlerts,
    ).toBe(10);

    // Test min clamping
    onDraftRulesChange.mockClear();
    fireEvent.change(screen.getByLabelText('overtime-total-alerts-day'), {
      target: { value: '0' },
    });
    expect(
      (
        onDraftRulesChange.mock
          .calls[0][0] as TimeTracking_OvertimeNotificationRule[]
      )[0].alertFrequency.totalAlerts,
    ).toBe(1);
  });

  it('clamps interval minutes to range 5-1440', () => {
    const day = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[day]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    // Test max clamping (above 1440)
    fireEvent.change(screen.getByLabelText('overtime-alert-interval-day'), {
      target: { value: '9999' },
    });
    expect(
      (
        onDraftRulesChange.mock
          .calls[0][0] as TimeTracking_OvertimeNotificationRule[]
      )[0].alertFrequency.intervalMinutes,
    ).toBe(1440);

    // Test min clamping (below 5)
    onDraftRulesChange.mockClear();
    fireEvent.change(screen.getByLabelText('overtime-alert-interval-day'), {
      target: { value: '1' },
    });
    expect(
      (
        onDraftRulesChange.mock
          .calls[0][0] as TimeTracking_OvertimeNotificationRule[]
      )[0].alertFrequency.intervalMinutes,
    ).toBe(5);
  });

  it('updates total alerts within valid range', () => {
    const day = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[day]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('overtime-total-alerts-day'), {
      target: { value: '5' },
    });
    expect(
      (
        onDraftRulesChange.mock
          .calls[0][0] as TimeTracking_OvertimeNotificationRule[]
      )[0].alertFrequency.totalAlerts,
    ).toBe(5);
  });

  it('updates interval minutes within valid range', () => {
    const day = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[day]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('overtime-alert-interval-day'), {
      target: { value: '30' },
    });
    expect(
      (
        onDraftRulesChange.mock
          .calls[0][0] as TimeTracking_OvertimeNotificationRule[]
      )[0].alertFrequency.intervalMinutes,
    ).toBe(30);
  });

  it('toggles admin email recipient checkbox', () => {
    const day = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
    const onDraftRulesChange = jest.fn();
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[day]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={onDraftRulesChange}
      />,
    );

    const emailCb = screen.getByLabelText('overtime-admin-email-day');
    fireEvent.click(emailCb);

    expect(onDraftRulesChange).toHaveBeenCalled();
    const next = onDraftRulesChange.mock
      .calls[0][0] as TimeTracking_OvertimeNotificationRule[];
    expect(
      next[0].recipients.admin.includes(
        TimeTracking_NotificationReminderMedium.Email,
      ),
    ).toBe(false);
  });

  it('renders week rule fields when only week rule present', () => {
    const week = makeRule(TimeTracking_OvertimePeriod.Week, 'w1');
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[week]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={jest.fn()}
      />,
    );

    expect(
      screen.getByLabelText('overtime-threshold-hours-week'),
    ).toBeInTheDocument();
  });

  it('renders both panels when day and week rules exist', () => {
    render(
      <EmployerOvertimeNotificationsEdit
        draftRules={[
          makeRule(TimeTracking_OvertimePeriod.Day, 'd1'),
          makeRule(TimeTracking_OvertimePeriod.Week, 'w1'),
        ]}
        loading={false}
        hasLoadedFromApi
        onDraftRulesChange={jest.fn()}
      />,
    );

    expect(
      screen.getByLabelText('overtime-threshold-hours-day'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('overtime-threshold-hours-week'),
    ).toBeInTheDocument();
  });

  describe('validation error feedback', () => {
    it('shows error for daily hours outside valid range (1-24)', () => {
      const invalidDay: TimeTracking_OvertimeNotificationRule = {
        ...makeRule(TimeTracking_OvertimePeriod.Day, 'd1'),
        threshold: {
          __typename: 'TimeTracking_OvertimeThreshold',
          hours: 0,
          minutes: 0,
          period: TimeTracking_OvertimePeriod.Day,
        },
      };
      render(
        <EmployerOvertimeNotificationsEdit
          draftRules={[invalidDay]}
          loading={false}
          hasLoadedFromApi
          onDraftRulesChange={jest.fn()}
        />,
      );

      expect(
        screen.getByTestId('error-overtime-threshold-hours-day'),
      ).toHaveTextContent(
        'notifications.overtime.validation.hours.daily.error',
      );
    });

    it('shows error for weekly hours outside valid range (1-168)', () => {
      const invalidWeek: TimeTracking_OvertimeNotificationRule = {
        ...makeRule(TimeTracking_OvertimePeriod.Week, 'w1'),
        threshold: {
          __typename: 'TimeTracking_OvertimeThreshold',
          hours: 200,
          minutes: 0,
          period: TimeTracking_OvertimePeriod.Week,
        },
      };
      render(
        <EmployerOvertimeNotificationsEdit
          draftRules={[invalidWeek]}
          loading={false}
          hasLoadedFromApi
          onDraftRulesChange={jest.fn()}
        />,
      );

      expect(
        screen.getByTestId('error-overtime-threshold-hours-week'),
      ).toHaveTextContent(
        'notifications.overtime.validation.hours.weekly.error',
      );
    });

    it('shows error for minutes outside valid range (0-59)', () => {
      const invalidDay: TimeTracking_OvertimeNotificationRule = {
        ...makeRule(TimeTracking_OvertimePeriod.Day, 'd1'),
        threshold: {
          __typename: 'TimeTracking_OvertimeThreshold',
          hours: 8,
          minutes: 100,
          period: TimeTracking_OvertimePeriod.Day,
        },
      };
      render(
        <EmployerOvertimeNotificationsEdit
          draftRules={[invalidDay]}
          loading={false}
          hasLoadedFromApi
          onDraftRulesChange={jest.fn()}
        />,
      );

      expect(
        screen.getByTestId('error-overtime-threshold-minutes-day'),
      ).toHaveTextContent('notifications.overtime.validation.minutes.error');
    });

    it('shows error for total alerts outside valid range (1-10)', () => {
      const invalidDay: TimeTracking_OvertimeNotificationRule = {
        ...makeRule(TimeTracking_OvertimePeriod.Day, 'd1'),
        alertFrequency: {
          __typename: 'TimeTracking_OvertimeAlertFrequency',
          totalAlerts: 0,
          intervalMinutes: 60,
        },
      };
      render(
        <EmployerOvertimeNotificationsEdit
          draftRules={[invalidDay]}
          loading={false}
          hasLoadedFromApi
          onDraftRulesChange={jest.fn()}
        />,
      );

      expect(
        screen.getByTestId('error-overtime-total-alerts-day'),
      ).toHaveTextContent(
        'notifications.overtime.validation.totalAlerts.error',
      );
    });

    it('shows error for interval minutes outside valid range (5-1440)', () => {
      const invalidDay: TimeTracking_OvertimeNotificationRule = {
        ...makeRule(TimeTracking_OvertimePeriod.Day, 'd1'),
        alertFrequency: {
          __typename: 'TimeTracking_OvertimeAlertFrequency',
          totalAlerts: 2,
          intervalMinutes: 2,
        },
      };
      render(
        <EmployerOvertimeNotificationsEdit
          draftRules={[invalidDay]}
          loading={false}
          hasLoadedFromApi
          onDraftRulesChange={jest.fn()}
        />,
      );

      expect(
        screen.getByTestId('error-overtime-alert-interval-day'),
      ).toHaveTextContent(
        'notifications.overtime.validation.intervalMinutes.error',
      );
    });

    it('does not show error when values are within valid ranges', () => {
      const validDay = makeRule(TimeTracking_OvertimePeriod.Day, 'd1');
      render(
        <EmployerOvertimeNotificationsEdit
          draftRules={[validDay]}
          loading={false}
          hasLoadedFromApi
          onDraftRulesChange={jest.fn()}
        />,
      );

      expect(
        screen.queryByTestId('error-overtime-threshold-hours-day'),
      ).toBeNull();
      expect(
        screen.queryByTestId('error-overtime-threshold-minutes-day'),
      ).toBeNull();
      expect(
        screen.queryByTestId('error-overtime-total-alerts-day'),
      ).toBeNull();
      expect(
        screen.queryByTestId('error-overtime-alert-interval-day'),
      ).toBeNull();
    });
  });
});
