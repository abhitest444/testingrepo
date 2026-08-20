import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_OvertimePeriod,
  TimeTracking_OvertimeRuleEntityType,
} from 'src/__generated__/timeTracking/graphql';
import {
  buildOvertimeNotificationsManageInput,
  formatOvertimeFrequencyView,
  formatOvertimeRecipientsView,
  formatOvertimeThresholdView,
  getOvertimePeriodPhraseInSentence,
  hasDisplayableOvertimeRules,
  isMediumEnabled,
  isOvertimeRuleAssignedToAll,
  patchOvertimeRule,
  toggleMedium,
} from 'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/overtimeNotifications.utils';

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
  assignedTo: {
    entityType: TimeTracking_OvertimeRuleEntityType.All,
    entityIds: '-1',
  },
  ...overrides,
});

const makeIntl = () => ({
  formatMessage: jest.fn(
    (descriptor: { id: string }, values?: Record<string, string | number>) => {
      if (values) {
        return `${descriptor.id}:${JSON.stringify(values)}`;
      }
      return descriptor.id;
    },
  ),
});

// ---------------------------------------------------------------------------
// toggleMedium
// ---------------------------------------------------------------------------

describe('toggleMedium', () => {
  const { Email, PushNotification } = TimeTracking_NotificationReminderMedium;

  it('should add a medium when enabled and not already present', () => {
    const result = toggleMedium([Email], PushNotification, true);
    expect(result).toEqual([Email, PushNotification]);
  });

  it('should return the same array when enabling a medium already present', () => {
    const current = [Email, PushNotification];
    const result = toggleMedium(current, Email, true);
    expect(result).toBe(current);
  });

  it('should remove a medium when disabled', () => {
    const result = toggleMedium(
      [Email, PushNotification],
      PushNotification,
      false,
    );
    expect(result).toEqual([Email]);
  });

  it('should return an empty array when disabling the only medium', () => {
    const result = toggleMedium([Email], Email, false);
    expect(result).toEqual([]);
  });

  it('should be a no-op when disabling a medium not in the list', () => {
    const result = toggleMedium([Email], PushNotification, false);
    expect(result).toEqual([Email]);
  });
});

// ---------------------------------------------------------------------------
// isMediumEnabled
// ---------------------------------------------------------------------------

describe('isMediumEnabled', () => {
  const { Email, PushNotification } = TimeTracking_NotificationReminderMedium;

  it('should return true when the medium is in the list', () => {
    expect(isMediumEnabled([Email, PushNotification], Email)).toBe(true);
  });

  it('should return false when the medium is not in the list', () => {
    expect(isMediumEnabled([Email], PushNotification)).toBe(false);
  });

  it('should return false when the list is undefined', () => {
    expect(isMediumEnabled(undefined, Email)).toBe(false);
  });

  it('should return false for an empty list', () => {
    expect(isMediumEnabled([], Email)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatOvertimeThresholdView
// ---------------------------------------------------------------------------

describe('formatOvertimeThresholdView', () => {
  it('should return not-configured message when rule is undefined', () => {
    const intl = makeIntl();
    const result = formatOvertimeThresholdView(intl, undefined);
    expect(result).toBe('notifications.overtime.not.configured');
  });

  it('should return not-configured message when period is NEVER', () => {
    const intl = makeIntl();
    const rule = makeRule(TimeTracking_OvertimePeriod.Never);
    const result = formatOvertimeThresholdView(intl, rule);
    expect(result).toBe('notifications.overtime.not.configured');
  });

  it('should format summary with per.day label for DAY period', () => {
    const intl = makeIntl();
    const rule = makeRule(TimeTracking_OvertimePeriod.Day, {
      threshold: {
        hours: 8,
        minutes: 30,
        period: TimeTracking_OvertimePeriod.Day,
      },
    });
    const result = formatOvertimeThresholdView(intl, rule);
    expect(result).toBe(
      'notifications.overtime.threshold.summary:{"hours":8,"minutes":30,"per":"notifications.overtime.per.day"}',
    );
  });

  it('should format summary with per.week label for WEEK period', () => {
    const intl = makeIntl();
    const rule = makeRule(TimeTracking_OvertimePeriod.Week, {
      threshold: {
        hours: 40,
        minutes: 0,
        period: TimeTracking_OvertimePeriod.Week,
      },
    });
    const result = formatOvertimeThresholdView(intl, rule);
    expect(result).toBe(
      'notifications.overtime.threshold.summary:{"hours":40,"minutes":0,"per":"notifications.overtime.per.week"}',
    );
  });
});

// ---------------------------------------------------------------------------
// hasDisplayableOvertimeRules
// ---------------------------------------------------------------------------

describe('hasDisplayableOvertimeRules', () => {
  it('should return true when a DAY rule exists', () => {
    expect(
      hasDisplayableOvertimeRules([makeRule(TimeTracking_OvertimePeriod.Day)]),
    ).toBe(true);
  });

  it('should return true when a WEEK rule exists', () => {
    expect(
      hasDisplayableOvertimeRules([makeRule(TimeTracking_OvertimePeriod.Week)]),
    ).toBe(true);
  });

  it('should return false when only a NEVER rule exists', () => {
    expect(
      hasDisplayableOvertimeRules([
        makeRule(TimeTracking_OvertimePeriod.Never),
      ]),
    ).toBe(false);
  });

  it('should return false for an empty array', () => {
    expect(hasDisplayableOvertimeRules([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getOvertimePeriodPhraseInSentence
// ---------------------------------------------------------------------------

describe('getOvertimePeriodPhraseInSentence', () => {
  it('should return per.week message for WEEK period', () => {
    const intl = makeIntl();
    const result = getOvertimePeriodPhraseInSentence(
      intl,
      TimeTracking_OvertimePeriod.Week,
    );
    expect(result).toBe('notifications.overtime.per.week');
  });

  it('should return per.day message for DAY period', () => {
    const intl = makeIntl();
    const result = getOvertimePeriodPhraseInSentence(
      intl,
      TimeTracking_OvertimePeriod.Day,
    );
    expect(result).toBe('notifications.overtime.per.day');
  });

  it('should default to per.day for undefined period', () => {
    const intl = makeIntl();
    const result = getOvertimePeriodPhraseInSentence(intl, undefined);
    expect(result).toBe('notifications.overtime.per.day');
  });
});

// ---------------------------------------------------------------------------
// patchOvertimeRule
// ---------------------------------------------------------------------------

describe('patchOvertimeRule', () => {
  it('should patch threshold fields', () => {
    const rule = makeRule(TimeTracking_OvertimePeriod.Day);
    const patched = patchOvertimeRule(rule, {
      threshold: { hours: 10, minutes: 15 },
    });
    expect(patched.threshold.hours).toBe(10);
    expect(patched.threshold.minutes).toBe(15);
    expect(patched.threshold.period).toBe(TimeTracking_OvertimePeriod.Day);
  });

  it('should patch alertFrequency fields', () => {
    const rule = makeRule(TimeTracking_OvertimePeriod.Day);
    const patched = patchOvertimeRule(rule, {
      alertFrequency: { totalAlerts: 5, intervalMinutes: 30 },
    });
    expect(patched.alertFrequency.totalAlerts).toBe(5);
    expect(patched.alertFrequency.intervalMinutes).toBe(30);
  });

  it('should patch recipients', () => {
    const rule = makeRule(TimeTracking_OvertimePeriod.Day);
    const patched = patchOvertimeRule(rule, {
      recipients: {
        employee: [TimeTracking_NotificationReminderMedium.PushNotification],
      },
    });
    expect(patched.recipients.employee).toEqual([
      TimeTracking_NotificationReminderMedium.PushNotification,
    ]);
    // other recipient fields preserved
    expect(patched.recipients.admin).toEqual(rule.recipients.admin);
  });

  it('should preserve unpatched fields when no recipients patch provided', () => {
    const rule = makeRule(TimeTracking_OvertimePeriod.Day);
    const patched = patchOvertimeRule(rule, { threshold: { hours: 9 } });
    expect(patched.recipients).toBe(rule.recipients);
  });
});

// ---------------------------------------------------------------------------
// buildOvertimeNotificationsManageInput
// ---------------------------------------------------------------------------

describe('buildOvertimeNotificationsManageInput', () => {
  it('should return undefined when saved and draft rules are identical', () => {
    const rule = makeRule(TimeTracking_OvertimePeriod.Day);
    const result = buildOvertimeNotificationsManageInput([rule], [rule]);
    expect(result).toBeUndefined();
  });

  it('should include a create entry for a new draft DAY rule', () => {
    const draft = makeRule(TimeTracking_OvertimePeriod.Day, {
      id: 'draft-DAY-1234',
    });
    const result = buildOvertimeNotificationsManageInput([], [draft]);
    expect(result?.create).toHaveLength(1);
    expect(result?.create?.[0].threshold.period).toBe(
      TimeTracking_OvertimePeriod.Day,
    );
    expect(result?.delete).toBeUndefined();
    expect(result?.update).toBeUndefined();
  });

  it('should include an update entry when a persisted rule is changed', () => {
    const saved = makeRule(TimeTracking_OvertimePeriod.Week);
    const changed = { ...saved, threshold: { ...saved.threshold, hours: 45 } };
    const result = buildOvertimeNotificationsManageInput([saved], [changed]);
    expect(result?.update).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const updateEntry = result!.update![0];
    expect(updateEntry.id).toBe(`rule-${TimeTracking_OvertimePeriod.Week}`);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(updateEntry.threshold!.hours).toBe(45);
    expect(result?.create).toBeUndefined();
    expect(result?.delete).toBeUndefined();
  });

  it('should include a delete entry when a persisted day/week rule is removed', () => {
    const saved = makeRule(TimeTracking_OvertimePeriod.Day);
    const result = buildOvertimeNotificationsManageInput([saved], []);
    expect(result?.delete).toContain(`rule-${TimeTracking_OvertimePeriod.Day}`);
    expect(result?.create).toBeUndefined();
    expect(result?.update).toBeUndefined();
  });

  it('should handle create + delete in the same call', () => {
    const savedDay = makeRule(TimeTracking_OvertimePeriod.Day);
    const draftWeek = makeRule(TimeTracking_OvertimePeriod.Week, {
      id: 'draft-WEEK-9999',
    });
    const result = buildOvertimeNotificationsManageInput(
      [savedDay],
      [draftWeek],
    );
    expect(result?.delete).toContain(`rule-${TimeTracking_OvertimePeriod.Day}`);
    expect(result?.create).toHaveLength(1);
  });

  it('should not create a delete entry for a NEVER-period saved rule that is absent from draft', () => {
    const neverRule = makeRule(TimeTracking_OvertimePeriod.Never);
    const result = buildOvertimeNotificationsManageInput([neverRule], []);
    expect(result).toBeUndefined();
  });

  it('should skip a draft rule with a draft id and non-day/week period', () => {
    // draft id with NEVER period — should be ignored (not created)
    const draftNever = makeRule(TimeTracking_OvertimePeriod.Never, {
      id: 'draft-NEVER-1234',
    });
    const result = buildOvertimeNotificationsManageInput([], [draftNever]);
    expect(result).toBeUndefined();
  });

  it('should skip a server-id draft rule that has no matching saved rule', () => {
    // server-style id but not present in savedRules — should be ignored
    const orphanDraft = makeRule(TimeTracking_OvertimePeriod.Day, {
      id: 'server-id-999',
    });
    const result = buildOvertimeNotificationsManageInput([], [orphanDraft]);
    expect(result).toBeUndefined();
  });

  it('should emit only one create when adding weekly after daily was saved but saved daily still has a draft id', () => {
    const savedDay = makeRule(TimeTracking_OvertimePeriod.Day, {
      id: 'draft-DAY-111',
    });
    const draftDay = makeRule(TimeTracking_OvertimePeriod.Day, {
      id: 'draft-DAY-222',
    });
    const draftWeek = makeRule(TimeTracking_OvertimePeriod.Week, {
      id: 'draft-WEEK-9999',
    });
    const result = buildOvertimeNotificationsManageInput(
      [savedDay],
      [draftDay, draftWeek],
    );
    expect(result?.create).toHaveLength(1);
    expect(result?.create?.[0].threshold.period).toBe(
      TimeTracking_OvertimePeriod.Week,
    );
    expect(result?.delete).toBeUndefined();
    expect(result?.update).toBeUndefined();
  });

  it('should not send delete for client draft ids when that period is cleared from draft', () => {
    const savedWeek = makeRule(TimeTracking_OvertimePeriod.Week, {
      id: 'draft-WEEK-1774299591515',
    });
    const result = buildOvertimeNotificationsManageInput([savedWeek], []);
    expect(result).toBeUndefined();
  });

  it('should update daily when draft uses temp id but data changed vs saved server rule', () => {
    const savedDay = makeRule(TimeTracking_OvertimePeriod.Day, {
      id: 'server-day-id',
    });
    const draftDay = makeRule(TimeTracking_OvertimePeriod.Day, {
      id: 'draft-DAY-1234',
      threshold: { ...savedDay.threshold, hours: 9 },
    });
    const result = buildOvertimeNotificationsManageInput(
      [savedDay],
      [draftDay],
    );
    expect(result?.update).toHaveLength(1);
    expect(result?.update?.[0].id).toBe('server-day-id');
    expect(result?.update?.[0].threshold?.hours).toBe(9);
    expect(result?.create).toBeUndefined();
    expect(result?.delete).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isOvertimeRuleAssignedToAll
// ---------------------------------------------------------------------------

describe('isOvertimeRuleAssignedToAll', () => {
  it('should return true when entityType is ALL', () => {
    const rule = makeRule(TimeTracking_OvertimePeriod.Day);
    expect(isOvertimeRuleAssignedToAll(rule)).toBe(true);
  });

  it('should return false when entityType is not ALL', () => {
    const rule = makeRule(TimeTracking_OvertimePeriod.Day, {
      assignedTo: {
        entityType: TimeTracking_OvertimeRuleEntityType.Employee,
        entityIds: '42',
      },
    });
    expect(isOvertimeRuleAssignedToAll(rule)).toBe(false);
  });

  it('should return false when assignedTo is null', () => {
    const rule = makeRule(TimeTracking_OvertimePeriod.Day, {
      assignedTo: null,
    });
    expect(isOvertimeRuleAssignedToAll(rule)).toBe(false);
  });

  it('should return false for undefined rule', () => {
    expect(isOvertimeRuleAssignedToAll(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildOvertimeNotificationsManageInput — user-level (assignedTo ALL guards)
// ---------------------------------------------------------------------------

describe('buildOvertimeNotificationsManageInput — userLevelOvertimeNotifications', () => {
  it('should NOT include a delete entry for a persisted ALL-assigned DAY rule when period is removed from draft', () => {
    const saved = makeRule(TimeTracking_OvertimePeriod.Day);
    const result = buildOvertimeNotificationsManageInput([saved], [], {
      userLevelOvertimeNotifications: true,
    });
    expect(result).toBeUndefined();
  });

  it('should NOT include a delete entry for a persisted ALL-assigned WEEK rule when period is removed from draft', () => {
    const saved = makeRule(TimeTracking_OvertimePeriod.Week);
    const result = buildOvertimeNotificationsManageInput([saved], [], {
      userLevelOvertimeNotifications: true,
    });
    expect(result).toBeUndefined();
  });

  it('should still delete a non-ALL persisted rule when removed from draft (user-level flag on)', () => {
    const saved = makeRule(TimeTracking_OvertimePeriod.Day, {
      assignedTo: {
        entityType: TimeTracking_OvertimeRuleEntityType.Employee,
        entityIds: '99',
      },
    });
    const result = buildOvertimeNotificationsManageInput([saved], [], {
      userLevelOvertimeNotifications: true,
    });
    expect(result?.delete).toContain(saved.id);
    expect(result?.create).toBeUndefined();
    expect(result?.update).toBeUndefined();
  });

  it('should emit create instead of update when a persisted ALL-assigned rule is changed', () => {
    const saved = makeRule(TimeTracking_OvertimePeriod.Day);
    const changed = { ...saved, threshold: { ...saved.threshold, hours: 10 } };
    const result = buildOvertimeNotificationsManageInput([saved], [changed], {
      userLevelOvertimeNotifications: true,
    });
    expect(result?.create).toHaveLength(1);
    expect(result?.create?.[0].threshold.hours).toBe(10);
    expect(result?.update).toBeUndefined();
    expect(result?.delete).toBeUndefined();
  });

  it('should emit create instead of update when a savedById ALL-assigned rule is changed via draft id', () => {
    const saved = makeRule(TimeTracking_OvertimePeriod.Day, {
      id: 'server-day-id',
    });
    const draft = makeRule(TimeTracking_OvertimePeriod.Day, {
      id: 'server-day-id',
      threshold: { ...saved.threshold, hours: 12 },
    });
    const result = buildOvertimeNotificationsManageInput([saved], [draft], {
      userLevelOvertimeNotifications: true,
    });
    expect(result?.create).toHaveLength(1);
    expect(result?.create?.[0].threshold.hours).toBe(12);
    expect(result?.update).toBeUndefined();
  });

  it('should still emit update (not create) for a non-ALL persisted rule that changed (user-level flag on)', () => {
    const saved = makeRule(TimeTracking_OvertimePeriod.Week, {
      assignedTo: {
        entityType: TimeTracking_OvertimeRuleEntityType.Employee,
        entityIds: '99',
      },
    });
    const changed = {
      ...saved,
      threshold: { ...saved.threshold, hours: 45 },
    };
    const result = buildOvertimeNotificationsManageInput([saved], [changed], {
      userLevelOvertimeNotifications: true,
    });
    expect(result?.update).toHaveLength(1);
    expect(result?.update?.[0].threshold?.hours).toBe(45);
    expect(result?.create).toBeUndefined();
  });

  it('should return undefined when user-level flag is false and ALL-assigned rule is unchanged', () => {
    const saved = makeRule(TimeTracking_OvertimePeriod.Day);
    const result = buildOvertimeNotificationsManageInput([saved], [saved], {
      userLevelOvertimeNotifications: false,
    });
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// formatOvertimeFrequencyView
// ---------------------------------------------------------------------------

describe('formatOvertimeFrequencyView', () => {
  it('should return not-configured message when rule is undefined', () => {
    const intl = makeIntl();
    const result = formatOvertimeFrequencyView(intl, undefined);
    expect(result).toBe('notifications.overtime.not.configured');
  });

  it('should format frequency summary with totalAlerts and intervalMinutes', () => {
    const intl = makeIntl();
    const rule = makeRule(TimeTracking_OvertimePeriod.Day, {
      alertFrequency: { totalAlerts: 3, intervalMinutes: 30 },
    });
    const result = formatOvertimeFrequencyView(intl, rule);
    expect(result).toBe(
      'notifications.overtime.frequency.summary:{"totalAlerts":3,"intervalMinutes":30}',
    );
  });
});

// ---------------------------------------------------------------------------
// formatOvertimeRecipientsView
// ---------------------------------------------------------------------------

describe('formatOvertimeRecipientsView', () => {
  const { Email, PushNotification } = TimeTracking_NotificationReminderMedium;

  it('should return not-configured message when rule is undefined', () => {
    const intl = makeIntl();
    const result = formatOvertimeRecipientsView(intl, undefined);
    expect(result).toBe('notifications.overtime.not.configured');
  });

  it('should return status.off when all recipients have no mediums', () => {
    const intl = makeIntl();
    const rule = makeRule(TimeTracking_OvertimePeriod.Day, {
      recipients: {
        admin: [],
        groupManager: [],
        employee: [],
      },
    });
    const result = formatOvertimeRecipientsView(intl, rule);
    expect(result).toBe('notifications.status.off');
  });

  it('should use email.mobile channel label when both email and mobile are enabled', () => {
    const intl = makeIntl();
    const rule = makeRule(TimeTracking_OvertimePeriod.Day, {
      recipients: {
        admin: [Email, PushNotification],
        groupManager: [],
        employee: [],
      },
    });
    const result = formatOvertimeRecipientsView(intl, rule);
    expect(intl.formatMessage).toHaveBeenCalledWith({
      id: 'notifications.overtime.channel.email.mobile',
    });
  });

  it('should use email-only channel label when only email is enabled', () => {
    const intl = makeIntl();
    const rule = makeRule(TimeTracking_OvertimePeriod.Day, {
      recipients: {
        admin: [Email],
        groupManager: [],
        employee: [],
      },
    });
    formatOvertimeRecipientsView(intl, rule);
    expect(intl.formatMessage).toHaveBeenCalledWith({
      id: 'notifications.email',
    });
  });

  it('should use mobile-only channel label when only mobile is enabled', () => {
    const intl = makeIntl();
    const rule = makeRule(TimeTracking_OvertimePeriod.Day, {
      recipients: {
        admin: [PushNotification],
        groupManager: [],
        employee: [],
      },
    });
    formatOvertimeRecipientsView(intl, rule);
    expect(intl.formatMessage).toHaveBeenCalledWith({
      id: 'notifications.mobile',
    });
  });
});
