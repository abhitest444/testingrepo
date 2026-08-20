import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_OvertimePeriod,
  TimeTracking_OvertimeRuleEntityType,
} from 'src/__generated__/timeTracking/graphql';
import overtimeNotificationsReducer, {
  setOvertimeNotificationDraftRules,
} from '../../../../../store/slices/overtimeNotificationsSlice';
import NotificationsOvertimeEdit from '../NotificationsOvertimeEdit';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
  useSandbox: () => ({ logger: { info: jest.fn(), error: jest.fn() } }),
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

jest.mock('../../styles/NotificationsOvertime.styles', () => {
  const React = require('react');
  const div =
    (name: string) =>
    ({ children }: any) =>
      <div data-testid={name}>{children}</div>;
  return {
    OvertimeEditSectionContainer: div('section-container'),
    OvertimeEditSectionHeader: div('section-header'),
    OvertimeEditPeriodToggleRow: div('toggle-row'),
    OvertimeEditPeriodRuleBlock: div('rule-block'),
    OvertimeEditFormRow: div('form-row'),
    OvertimeEditFormLabelContainer: div('form-label-container'),
    OvertimeEditFormLabelWrapper: div('form-label-wrapper'),
    OvertimeEditThresholdInputContainer: div('threshold-input-container'),
    OvertimeEditTextFieldWrapper: div('text-field-wrapper'),
    OvertimeEditNotificationCategoryHeadersRow: div('category-headers-row'),
    OvertimeEditNotificationCategoryRow: div('category-row'),
    OvertimeEditCheckboxContent: div('checkbox-content'),
    OvertimeEditSendAlertsToContainer: div('send-alerts-container'),
    OvertimeEditSendAlertsToLabelWrapper: div('send-alerts-label'),
    StyledPageMessage: ({ children, type, automationId }: any) => (
      <div data-testid={automationId} data-type={type}>
        {children}
      </div>
    ),
  };
});

jest.mock('@ids-ts/checkbox', () => ({
  Checkbox: ({ checked, onChange, children, 'aria-label': ariaLabel }: any) => {
    // When no aria-label is given, use the text content of children as the label
    // so period toggle checkboxes (which pass children for display) are queryable.
    const label =
      ariaLabel || (typeof children === 'string' ? children : 'checkbox');
    return (
      <label htmlFor={label}>
        <input
          id={label}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-label={label}
          data-testid={label}
          readOnly
        />
        {children}
      </label>
    );
  },
}));

// Mock TextField to expose errorText, min, max for testing validation feedback
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

jest.mock('@cgds/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

jest.mock('@ids-ts/typography', () => ({
  B2: ({ children }: any) => <span>{children}</span>,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRule = (period: string, overrides = {}): any => ({
  __typename: 'TimeTracking_OvertimeNotificationRule',
  id: `rule-${period}`,
  meta: { version: '1' },
  threshold: { hours: 8, minutes: 0, period },
  alertFrequency: { totalAlerts: 2, intervalMinutes: 60 },
  recipients: {
    admin: [
      TimeTracking_NotificationReminderMedium.Email,
      TimeTracking_NotificationReminderMedium.PushNotification,
    ],
    groupManager: [TimeTracking_NotificationReminderMedium.Email],
    employee: [TimeTracking_NotificationReminderMedium.Email],
  },
  assignedTo: { entityType: 'ALL', entityIds: '-1' },
  ...overrides,
});

/** Build a minimal store pre-loaded with the given overtimeNotifications state. */
const makeStore = (
  overrides: Partial<{
    rules: any[];
    draftRules: any[];
    loading: boolean;
    hasLoadedFromApi: boolean;
  }> = {},
) => {
  const preloadedOvertimeNotifications = {
    rules: [],
    draftRules: [],
    loading: false,
    error: null,
    hasLoadedFromApi: true,
    ...overrides,
  };

  return configureStore({
    reducer: {
      // Only the slice this component reads is required; others use defaults.
      overtimeNotifications: overtimeNotificationsReducer,
    },
    preloadedState: {
      overtimeNotifications: preloadedOvertimeNotifications,
    },
  });
};

const renderWithStore = (store: ReturnType<typeof makeStore>) =>
  render(
    <Provider store={store}>
      <NotificationsOvertimeEdit />
    </Provider>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationsOvertimeEdit', () => {
  describe('loading state', () => {
    it('renders Skeleton and not the period checkboxes when loading=true', () => {
      const store = makeStore({ loading: true, hasLoadedFromApi: false });
      renderWithStore(store);

      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
      expect(
        screen.queryByLabelText('notifications.overtime.daily'),
      ).toBeNull();
      expect(
        screen.queryByLabelText('notifications.overtime.weekly'),
      ).toBeNull();
    });

    it('renders Skeleton when hasLoadedFromApi=false even if loading=false', () => {
      const store = makeStore({ loading: false, hasLoadedFromApi: false });
      renderWithStore(store);

      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
  });

  describe('loaded with no rules', () => {
    it('renders both period checkboxes unchecked', () => {
      const store = makeStore({ draftRules: [], hasLoadedFromApi: true });
      renderWithStore(store);

      const dailyCb = screen.getByLabelText(
        'notifications.overtime.daily',
      ) as HTMLInputElement;
      const weeklyCb = screen.getByLabelText(
        'notifications.overtime.weekly',
      ) as HTMLInputElement;

      expect(dailyCb.checked).toBe(false);
      expect(weeklyCb.checked).toBe(false);
    });

    it('does not render rule field inputs', () => {
      const store = makeStore({ draftRules: [], hasLoadedFromApi: true });
      renderWithStore(store);

      expect(
        screen.queryByLabelText('overtime-threshold-hours-day'),
      ).toBeNull();
      expect(
        screen.queryByLabelText('overtime-threshold-hours-week'),
      ).toBeNull();
    });
  });

  describe('loaded with a day rule', () => {
    it('renders daily checkbox as checked', () => {
      const store = makeStore({
        draftRules: [makeRule(TimeTracking_OvertimePeriod.Day)],
        hasLoadedFromApi: true,
      });
      renderWithStore(store);

      const dailyCb = screen.getByLabelText(
        'notifications.overtime.daily',
      ) as HTMLInputElement;
      expect(dailyCb.checked).toBe(true);
    });

    it('renders threshold input fields for the day rule', () => {
      const store = makeStore({
        draftRules: [makeRule(TimeTracking_OvertimePeriod.Day)],
        hasLoadedFromApi: true,
      });
      renderWithStore(store);

      expect(
        screen.getByLabelText('overtime-threshold-hours-day'),
      ).toBeTruthy();
      expect(
        screen.getByLabelText('overtime-threshold-minutes-day'),
      ).toBeTruthy();
    });

    it('renders weekly checkbox as unchecked', () => {
      const store = makeStore({
        draftRules: [makeRule(TimeTracking_OvertimePeriod.Day)],
        hasLoadedFromApi: true,
      });
      renderWithStore(store);

      const weeklyCb = screen.getByLabelText(
        'notifications.overtime.weekly',
      ) as HTMLInputElement;
      expect(weeklyCb.checked).toBe(false);
    });
  });

  describe('toggle daily checkbox on', () => {
    it('dispatches setOvertimeNotificationDraftRules with a DAY rule when daily is toggled on', () => {
      const store = makeStore({ draftRules: [], hasLoadedFromApi: true });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      const dailyCb = screen.getByLabelText('notifications.overtime.daily');
      fireEvent.click(dailyCb);

      // The dispatched action should be setOvertimeNotificationDraftRules
      // with a payload containing exactly one rule whose period is DAY.
      const dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      const draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      const { payload } = draftAction as any;
      expect(payload).toHaveLength(1);
      expect(payload[0].threshold.period).toBe(TimeTracking_OvertimePeriod.Day);
    });
  });

  describe('toggle daily checkbox off', () => {
    it('dispatches setOvertimeNotificationDraftRules without the DAY rule when daily is toggled off', () => {
      const store = makeStore({
        draftRules: [makeRule(TimeTracking_OvertimePeriod.Day)],
        hasLoadedFromApi: true,
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      // Daily checkbox is currently checked; clicking removes the rule.
      const dailyCb = screen.getByLabelText('notifications.overtime.daily');
      fireEvent.click(dailyCb);

      const dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      const draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      const { payload } = draftAction as any;
      const dayRules = payload.filter(
        (r: any) => r.threshold.period === TimeTracking_OvertimePeriod.Day,
      );
      expect(dayRules).toHaveLength(0);
    });
  });

  describe('toggle weekly checkbox on', () => {
    it('dispatches setOvertimeNotificationDraftRules with a WEEK rule when weekly is toggled on', () => {
      const store = makeStore({ draftRules: [], hasLoadedFromApi: true });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      const weeklyCb = screen.getByLabelText('notifications.overtime.weekly');
      fireEvent.click(weeklyCb);

      const dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      const draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      const { payload } = draftAction as any;
      expect(payload).toHaveLength(1);
      expect(payload[0].threshold.period).toBe(
        TimeTracking_OvertimePeriod.Week,
      );
    });
  });

  describe('toggle weekly checkbox off', () => {
    it('dispatches setOvertimeNotificationDraftRules without the WEEK rule when weekly is toggled off', () => {
      const weekRule = makeRule(TimeTracking_OvertimePeriod.Week, {
        assignedTo: {
          entityType: TimeTracking_OvertimeRuleEntityType.Employee,
          entityIds: '1',
        },
      });
      const store = makeStore({
        rules: [weekRule],
        draftRules: [weekRule],
        hasLoadedFromApi: true,
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      const weeklyCb = screen.getByLabelText('notifications.overtime.weekly');
      fireEvent.click(weeklyCb);

      const dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      const draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      const weekRules = (draftAction as any).payload.filter(
        (r: any) => r.threshold.period === TimeTracking_OvertimePeriod.Week,
      );
      expect(weekRules).toHaveLength(0);
    });
  });

  describe('company rule cannot remove — daily', () => {
    const allDayRule = makeRule(TimeTracking_OvertimePeriod.Day);

    it('shows error banner when unchecking a daily rule with assignedTo ALL', () => {
      const store = makeStore({
        rules: [allDayRule],
        draftRules: [allDayRule],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      expect(
        screen.queryByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeNull();

      fireEvent.click(screen.getByLabelText('notifications.overtime.daily'));

      expect(
        screen.getByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toHaveAttribute('data-type', 'error');
    });

    it('keeps the daily checkbox checked when the ALL rule cannot be removed', () => {
      const store = makeStore({
        rules: [allDayRule],
        draftRules: [allDayRule],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      const dailyCb = screen.getByLabelText(
        'notifications.overtime.daily',
      ) as HTMLInputElement;

      fireEvent.click(dailyCb);

      expect(dailyCb.checked).toBe(true);
    });

    it('daily error persists independently when weekly is enabled (errors are per-period)', () => {
      // With separate error state, enabling weekly clears only weeklyCompanyRuleError,
      // not dailyCompanyRuleError — the errors are independent.
      const store = makeStore({
        rules: [allDayRule],
        draftRules: [allDayRule],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      // Trigger daily error
      fireEvent.click(screen.getByLabelText('notifications.overtime.daily'));
      expect(
        screen.getByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeInTheDocument();

      // Enabling weekly clears only weeklyCompanyRuleError; daily error remains
      fireEvent.click(screen.getByLabelText('notifications.overtime.weekly'));
      expect(
        screen.getByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeInTheDocument();
    });

    it('does NOT show error when unchecking a daily rule that is NOT assigned to ALL', () => {
      const userDayRule = makeRule(TimeTracking_OvertimePeriod.Day, {
        assignedTo: {
          entityType: TimeTracking_OvertimeRuleEntityType.Employee,
          entityIds: '42',
        },
      });
      const store = makeStore({
        rules: [userDayRule],
        draftRules: [userDayRule],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      fireEvent.click(screen.getByLabelText('notifications.overtime.daily'));

      expect(
        screen.queryByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeNull();
    });

    it('does NOT show error when there is no saved day rule (new draft rule)', () => {
      const draftOnly = makeRule(TimeTracking_OvertimePeriod.Day, {
        id: 'draft-DAY-123',
      });
      const store = makeStore({
        rules: [],
        draftRules: [draftOnly],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      fireEvent.click(screen.getByLabelText('notifications.overtime.daily'));

      expect(
        screen.queryByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeNull();
    });
  });

  describe('company rule cannot remove — weekly', () => {
    const allWeekRule = makeRule(TimeTracking_OvertimePeriod.Week);

    it('shows error banner when unchecking a weekly rule with assignedTo ALL', () => {
      const store = makeStore({
        rules: [allWeekRule],
        draftRules: [allWeekRule],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      expect(
        screen.queryByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeNull();

      fireEvent.click(screen.getByLabelText('notifications.overtime.weekly'));

      expect(
        screen.getByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeInTheDocument();
    });

    it('keeps the weekly checkbox checked when the ALL rule cannot be removed', () => {
      const store = makeStore({
        rules: [allWeekRule],
        draftRules: [allWeekRule],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      const weeklyCb = screen.getByLabelText(
        'notifications.overtime.weekly',
      ) as HTMLInputElement;

      fireEvent.click(weeklyCb);

      expect(weeklyCb.checked).toBe(true);
    });

    it('does NOT show error when unchecking a weekly rule that is NOT assigned to ALL', () => {
      const userWeekRule = makeRule(TimeTracking_OvertimePeriod.Week, {
        assignedTo: {
          entityType: TimeTracking_OvertimeRuleEntityType.Employee,
          entityIds: '42',
        },
      });
      const store = makeStore({
        rules: [userWeekRule],
        draftRules: [userWeekRule],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      fireEvent.click(screen.getByLabelText('notifications.overtime.weekly'));

      expect(
        screen.queryByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeNull();
    });

    it('weekly error persists independently when daily is enabled (errors are per-period)', () => {
      // With separate error state, enabling daily clears only dailyCompanyRuleError,
      // not weeklyCompanyRuleError.
      const allWeekRule = makeRule(TimeTracking_OvertimePeriod.Week);
      const store = makeStore({
        rules: [allWeekRule],
        draftRules: [allWeekRule],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      // Trigger weekly error
      fireEvent.click(screen.getByLabelText('notifications.overtime.weekly'));
      expect(
        screen.getByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeInTheDocument();

      // Enabling daily clears only dailyCompanyRuleError; weekly error remains
      fireEvent.click(screen.getByLabelText('notifications.overtime.daily'));
      expect(
        screen.getByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeInTheDocument();
    });

    it('shows a single error banner when both daily and weekly ALL rules cannot be removed', () => {
      const allDayRule = makeRule(TimeTracking_OvertimePeriod.Day);
      const allWeekRule = makeRule(TimeTracking_OvertimePeriod.Week);
      const store = makeStore({
        rules: [allDayRule, allWeekRule],
        draftRules: [allDayRule, allWeekRule],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      // Trigger both errors
      fireEvent.click(screen.getByLabelText('notifications.overtime.daily'));
      fireEvent.click(screen.getByLabelText('notifications.overtime.weekly'));

      // Single banner (dailyCompanyRuleError || weeklyCompanyRuleError)
      expect(
        screen.getAllByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toHaveLength(1);
    });

    it('does NOT show error when there is no saved week rule (new draft rule)', () => {
      const draftWeek = makeRule(TimeTracking_OvertimePeriod.Week, {
        id: 'draft-WEEK-456',
      });
      const store = makeStore({
        rules: [],
        draftRules: [draftWeek],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      fireEvent.click(screen.getByLabelText('notifications.overtime.weekly'));

      expect(
        screen.queryByTestId('OvertimeEditCompanyRuleCannotRemoveError'),
      ).toBeNull();
    });
  });

  describe('error banner message content', () => {
    it('renders the NLS key inside the error banner', () => {
      const allDayRule = makeRule(TimeTracking_OvertimePeriod.Day);
      const store = makeStore({
        rules: [allDayRule],
        draftRules: [allDayRule],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      fireEvent.click(screen.getByLabelText('notifications.overtime.daily'));

      const banner = screen.getByTestId(
        'OvertimeEditCompanyRuleCannotRemoveError',
      );
      expect(banner).toHaveTextContent(
        'notifications.overtime.company.rule.cannot.remove',
      );
      expect(banner).toHaveAttribute('data-type', 'error');
    });
  });

  describe('validation clamping', () => {
    it('clamps daily threshold hours to max 24', () => {
      const store = makeStore({
        draftRules: [makeRule(TimeTracking_OvertimePeriod.Day)],
        hasLoadedFromApi: true,
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      const hoursInput = screen.getByLabelText('overtime-threshold-hours-day');
      fireEvent.change(hoursInput, { target: { value: '500' } });

      const dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      const draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      const { payload } = draftAction as any;
      expect(payload[0].threshold.hours).toBe(24);
    });

    it('clamps weekly threshold hours to max 168', () => {
      const store = makeStore({
        draftRules: [makeRule(TimeTracking_OvertimePeriod.Week)],
        hasLoadedFromApi: true,
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      const hoursInput = screen.getByLabelText('overtime-threshold-hours-week');
      fireEvent.change(hoursInput, { target: { value: '500' } });

      const dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      const draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      const { payload } = draftAction as any;
      expect(payload[0].threshold.hours).toBe(168);
    });

    it('clamps threshold hours to min 1', () => {
      const store = makeStore({
        draftRules: [makeRule(TimeTracking_OvertimePeriod.Day)],
        hasLoadedFromApi: true,
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      const hoursInput = screen.getByLabelText('overtime-threshold-hours-day');
      fireEvent.change(hoursInput, { target: { value: '0' } });

      const dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      const draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      const { payload } = draftAction as any;
      expect(payload[0].threshold.hours).toBe(1);
    });

    it('clamps total alerts to range 1-10', () => {
      const store = makeStore({
        draftRules: [makeRule(TimeTracking_OvertimePeriod.Day)],
        hasLoadedFromApi: true,
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      // Test max clamping
      fireEvent.change(screen.getByLabelText('overtime-total-alerts-day'), {
        target: { value: '100' },
      });

      let dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      let draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      expect((draftAction as any).payload[0].alertFrequency.totalAlerts).toBe(
        10,
      );

      // Test min clamping
      dispatchSpy.mockClear();
      fireEvent.change(screen.getByLabelText('overtime-total-alerts-day'), {
        target: { value: '0' },
      });

      dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      expect((draftAction as any).payload[0].alertFrequency.totalAlerts).toBe(
        1,
      );
    });

    it('clamps interval minutes to range 5-1440', () => {
      const store = makeStore({
        draftRules: [makeRule(TimeTracking_OvertimePeriod.Day)],
        hasLoadedFromApi: true,
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      // Test max clamping (above 1440)
      fireEvent.change(screen.getByLabelText('overtime-alert-interval-day'), {
        target: { value: '9999' },
      });

      let dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      let draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      expect(
        (draftAction as any).payload[0].alertFrequency.intervalMinutes,
      ).toBe(1440);

      // Test min clamping (below 5)
      dispatchSpy.mockClear();
      fireEvent.change(screen.getByLabelText('overtime-alert-interval-day'), {
        target: { value: '1' },
      });

      dispatchedActions = dispatchSpy.mock.calls.map((call) => call[0]);
      draftAction = dispatchedActions.find(
        (a: any) => a.type === setOvertimeNotificationDraftRules.type,
      );

      expect(draftAction).toBeDefined();
      expect(
        (draftAction as any).payload[0].alertFrequency.intervalMinutes,
      ).toBe(5);
    });
  });

  describe('validation error feedback', () => {
    it('shows error for daily hours outside valid range (1-24)', () => {
      const invalidDay = makeRule(TimeTracking_OvertimePeriod.Day, {
        threshold: {
          hours: 0,
          minutes: 0,
          period: TimeTracking_OvertimePeriod.Day,
        },
      });
      const store = makeStore({
        draftRules: [invalidDay],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      expect(
        screen.getByTestId('error-overtime-threshold-hours-day'),
      ).toHaveTextContent(
        'notifications.overtime.validation.hours.daily.error',
      );
    });

    it('shows error for weekly hours outside valid range (1-168)', () => {
      const invalidWeek = makeRule(TimeTracking_OvertimePeriod.Week, {
        threshold: {
          hours: 200,
          minutes: 0,
          period: TimeTracking_OvertimePeriod.Week,
        },
      });
      const store = makeStore({
        draftRules: [invalidWeek],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      expect(
        screen.getByTestId('error-overtime-threshold-hours-week'),
      ).toHaveTextContent(
        'notifications.overtime.validation.hours.weekly.error',
      );
    });

    it('shows error for minutes outside valid range (0-59)', () => {
      const invalidDay = makeRule(TimeTracking_OvertimePeriod.Day, {
        threshold: {
          hours: 8,
          minutes: 100,
          period: TimeTracking_OvertimePeriod.Day,
        },
      });
      const store = makeStore({
        draftRules: [invalidDay],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      expect(
        screen.getByTestId('error-overtime-threshold-minutes-day'),
      ).toHaveTextContent('notifications.overtime.validation.minutes.error');
    });

    it('shows error for total alerts outside valid range (1-10)', () => {
      const invalidDay = makeRule(TimeTracking_OvertimePeriod.Day, {
        alertFrequency: {
          totalAlerts: 0,
          intervalMinutes: 60,
        },
      });
      const store = makeStore({
        draftRules: [invalidDay],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      expect(
        screen.getByTestId('error-overtime-total-alerts-day'),
      ).toHaveTextContent(
        'notifications.overtime.validation.totalAlerts.error',
      );
    });

    it('shows error for interval minutes outside valid range (5-1440)', () => {
      const invalidDay = makeRule(TimeTracking_OvertimePeriod.Day, {
        alertFrequency: {
          totalAlerts: 2,
          intervalMinutes: 2,
        },
      });
      const store = makeStore({
        draftRules: [invalidDay],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

      expect(
        screen.getByTestId('error-overtime-alert-interval-day'),
      ).toHaveTextContent(
        'notifications.overtime.validation.intervalMinutes.error',
      );
    });

    it('does not show error when values are within valid ranges', () => {
      const validDay = makeRule(TimeTracking_OvertimePeriod.Day);
      const store = makeStore({
        draftRules: [validDay],
        hasLoadedFromApi: true,
      });

      renderWithStore(store);

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
