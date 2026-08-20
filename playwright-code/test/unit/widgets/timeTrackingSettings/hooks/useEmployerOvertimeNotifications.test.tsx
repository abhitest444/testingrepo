import { renderHook, act } from '@testing-library/react-hooks';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_OvertimePeriod,
  TimeTracking_OvertimeRuleEntityType,
  TimeTracking_OvertimeNotificationRule,
} from 'src/__generated__/timeTracking/graphql';
import { useEmployerOvertimeNotifications } from 'src/js/widgets/timeTrackingSettings/hooks/useEmployerOvertimeNotifications';

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
      admin: [TimeTracking_NotificationReminderMedium.Email],
      groupManager: [],
      employee: [],
    },
    assignedTo: {
      __typename: 'TimeTracking_OvertimeRuleAssignment',
      entityType: TimeTracking_OvertimeRuleEntityType.All,
      entityIds: '-1',
    },
  } as TimeTracking_OvertimeNotificationRule);

describe('useEmployerOvertimeNotifications', () => {
  it('starts empty until API data is applied', () => {
    const { result } = renderHook(() =>
      useEmployerOvertimeNotifications(undefined, true),
    );

    expect(result.current.savedRules).toEqual([]);
    expect(result.current.draftRules).toEqual([]);
    expect(result.current.hasLoadedFromApi).toBe(false);
  });

  it('hydrates saved and draft from apiRules when loading finishes', () => {
    const rules = [makeRule(TimeTracking_OvertimePeriod.Day, 'd1')];
    const { result, rerender } = renderHook(
      ({ loading, api }) => useEmployerOvertimeNotifications(api, loading),
      {
        initialProps: {
          loading: true as boolean,
          api: undefined as typeof rules | undefined,
        },
      },
    );

    rerender({ loading: false, api: rules });

    expect(result.current.hasLoadedFromApi).toBe(true);
    expect(result.current.savedRules).toEqual(rules);
    expect(result.current.draftRules).toEqual(rules);
    expect(result.current.draftRules).not.toBe(result.current.savedRules);
  });

  it('hydrates when mounted already not loading with apiRules (second effect)', () => {
    const rules = [makeRule(TimeTracking_OvertimePeriod.Week, 'w1')];
    const { result } = renderHook(() =>
      useEmployerOvertimeNotifications(rules, false),
    );

    expect(result.current.hasLoadedFromApi).toBe(true);
    expect(result.current.savedRules).toEqual(rules);
    expect(result.current.draftRules).toEqual(rules);
  });

  it('does not hydrate on load complete when apiRules is still undefined', () => {
    const { result, rerender } = renderHook(
      ({ loading, api }) => useEmployerOvertimeNotifications(api, loading),
      {
        initialProps: {
          loading: true as boolean,
          api: undefined as TimeTracking_OvertimeNotificationRule[] | undefined,
        },
      },
    );

    rerender({ loading: false, api: undefined });

    expect(result.current.hasLoadedFromApi).toBe(false);
    expect(result.current.savedRules).toEqual([]);
  });

  it('cancelDraft resets draft to saved', () => {
    const rules = [makeRule(TimeTracking_OvertimePeriod.Day, 'd1')];
    const { result } = renderHook(() =>
      useEmployerOvertimeNotifications(rules, false),
    );

    const edited = [
      {
        ...rules[0],
        threshold: { ...rules[0].threshold, hours: 99 },
      },
    ] as TimeTracking_OvertimeNotificationRule[];

    act(() => {
      result.current.setDraftRules(edited);
    });
    expect(result.current.draftRules[0].threshold.hours).toBe(99);

    act(() => {
      result.current.cancelDraft();
    });
    expect(result.current.draftRules).toEqual(rules);
    expect(result.current.savedRules).toEqual(rules);
  });

  it('syncFromMutation uses returned rules when provided', () => {
    const rules = [makeRule(TimeTracking_OvertimePeriod.Day, 'd1')];
    const { result } = renderHook(() =>
      useEmployerOvertimeNotifications(rules, false),
    );

    const returned = [makeRule(TimeTracking_OvertimePeriod.Day, 'd1-server')];

    act(() => {
      result.current.syncFromMutation(returned);
    });

    expect(result.current.savedRules).toEqual(returned);
    expect(result.current.draftRules).toEqual(returned);
  });

  it('syncFromMutation falls back to draftRules when returned is null', () => {
    const rules = [makeRule(TimeTracking_OvertimePeriod.Day, 'd1')];
    const { result } = renderHook(() =>
      useEmployerOvertimeNotifications(rules, false),
    );

    const draft = [
      {
        ...rules[0],
        threshold: { ...rules[0].threshold, hours: 7 },
      },
    ] as TimeTracking_OvertimeNotificationRule[];

    act(() => {
      result.current.setDraftRules(draft);
    });

    act(() => {
      result.current.syncFromMutation(null);
    });

    expect(result.current.savedRules).toEqual(draft);
    expect(result.current.draftRules).toEqual(draft);
  });

  it('syncFromMutation falls back to draft when returned is undefined', () => {
    const rules = [makeRule(TimeTracking_OvertimePeriod.Day, 'd1')];
    const { result } = renderHook(() =>
      useEmployerOvertimeNotifications(rules, false),
    );

    const draft = [
      {
        ...rules[0],
        alertFrequency: { ...rules[0].alertFrequency, totalAlerts: 5 },
      },
    ] as TimeTracking_OvertimeNotificationRule[];

    act(() => {
      result.current.setDraftRules(draft);
    });

    act(() => {
      result.current.syncFromMutation(undefined);
    });

    expect(result.current.savedRules).toEqual(draft);
  });
});
