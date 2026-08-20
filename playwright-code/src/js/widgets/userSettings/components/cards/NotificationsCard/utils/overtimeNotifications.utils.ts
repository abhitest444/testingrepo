import {
  TimeTracking_CreateOvertimeNotificationRuleInput,
  TimeTracking_NotificationReminderMedium,
  TimeTracking_OvertimeAlertRecipients,
  TimeTracking_OvertimeNotificationRule,
  TimeTracking_OvertimePeriod,
  TimeTracking_OvertimeRuleEntityType,
  TimeTracking_UpdateOvertimeNotificationRuleInput,
  TimeTracking_UpdateOvertimeNotificationSettingsInput,
} from 'src/__generated__/timeTracking/graphql';

const DEFAULT_OVERTIME_THRESHOLD_HOURS = 8;
const DEFAULT_TOTAL_ALERTS = 2;
const DEFAULT_ALERT_INTERVAL_MINUTES = 60;

type IntlShape = {
  formatMessage: (
    descriptor: { id: string },
    values?: Record<string, string | number>,
  ) => string;
};

export const getOvertimeRuleForPeriod = (
  rules: TimeTracking_OvertimeNotificationRule[],
  period: TimeTracking_OvertimePeriod,
): TimeTracking_OvertimeNotificationRule | undefined =>
  rules.find((r) => r.threshold.period === period);

/** True when the API returned a rule for this day/week period (view hides the whole block otherwise). */
export const hasOvertimeRuleForPeriod = (
  rules: TimeTracking_OvertimeNotificationRule[],
  period: TimeTracking_OvertimePeriod.Day | TimeTracking_OvertimePeriod.Week,
): boolean => getOvertimeRuleForPeriod(rules, period) != null;

/** True when there is at least one day/week rule to render (not NEVER-only). */
export const hasDisplayableOvertimeRules = (
  rules: TimeTracking_OvertimeNotificationRule[],
): boolean =>
  rules.some(
    (r) =>
      r.threshold.period === TimeTracking_OvertimePeriod.Day ||
      r.threshold.period === TimeTracking_OvertimePeriod.Week,
  );

/** Phrase after “minutes per …” in edit UI (day vs week). */
export const getOvertimePeriodPhraseInSentence = (
  intl: {
    formatMessage: (
      descriptor: { id: string },
      values?: Record<string, string | number>,
    ) => string;
  },
  period: TimeTracking_OvertimePeriod | string | undefined,
): string => {
  const p = String(period ?? '').toUpperCase();
  if (p === 'WEEK') {
    return intl.formatMessage({ id: 'notifications.overtime.per.week' });
  }
  return intl.formatMessage({ id: 'notifications.overtime.per.day' });
};

export const createDefaultOvertimeRule = (
  period: TimeTracking_OvertimePeriod.Day | TimeTracking_OvertimePeriod.Week,
): TimeTracking_OvertimeNotificationRule =>
  ({
    __typename: 'TimeTracking_OvertimeNotificationRule',
    id: `draft-${period}-${Date.now()}`,
    meta: { __typename: 'TimeTracking_SettingMeta', version: '1' },
    threshold: {
      __typename: 'TimeTracking_OvertimeThreshold',
      hours: DEFAULT_OVERTIME_THRESHOLD_HOURS,
      minutes: 0,
      period,
    },
    alertFrequency: {
      __typename: 'TimeTracking_OvertimeAlertFrequency',
      totalAlerts: DEFAULT_TOTAL_ALERTS,
      intervalMinutes: DEFAULT_ALERT_INTERVAL_MINUTES,
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

export const toggleMedium = (
  current: TimeTracking_NotificationReminderMedium[],
  medium: TimeTracking_NotificationReminderMedium,
  enabled: boolean,
): TimeTracking_NotificationReminderMedium[] => {
  if (enabled) {
    return current.includes(medium) ? current : [...current, medium];
  }
  return current.filter((m) => m !== medium);
};

export const isMediumEnabled = (
  list: TimeTracking_NotificationReminderMedium[] | undefined,
  medium: TimeTracking_NotificationReminderMedium,
): boolean => Boolean(list?.includes(medium));

export const formatOvertimeThresholdView = (
  intl: IntlShape,
  rule: TimeTracking_OvertimeNotificationRule | undefined,
): string => {
  if (!rule) {
    return intl.formatMessage({ id: 'notifications.overtime.not.configured' });
  }
  const { hours, minutes, period } = rule.threshold;
  if (period === TimeTracking_OvertimePeriod.Never) {
    return intl.formatMessage({ id: 'notifications.overtime.not.configured' });
  }
  const per =
    period === TimeTracking_OvertimePeriod.Day
      ? intl.formatMessage({ id: 'notifications.overtime.per.day' })
      : intl.formatMessage({ id: 'notifications.overtime.per.week' });
  return intl.formatMessage(
    { id: 'notifications.overtime.threshold.summary' },
    { hours, minutes, per },
  );
};

export const formatOvertimeFrequencyView = (
  intl: IntlShape,
  rule: TimeTracking_OvertimeNotificationRule | undefined,
): string => {
  if (!rule) {
    return intl.formatMessage({ id: 'notifications.overtime.not.configured' });
  }
  const { totalAlerts, intervalMinutes } = rule.alertFrequency;
  return intl.formatMessage(
    { id: 'notifications.overtime.frequency.summary' },
    { totalAlerts, intervalMinutes },
  );
};

export const formatOvertimeRecipientsView = (
  intl: IntlShape,
  rule: TimeTracking_OvertimeNotificationRule | undefined,
): string => {
  if (!rule) {
    return intl.formatMessage({ id: 'notifications.overtime.not.configured' });
  }
  const { recipients } = rule;
  const adminHasEmail = isMediumEnabled(
    recipients.admin,
    TimeTracking_NotificationReminderMedium.Email,
  );
  const adminHasMobile = isMediumEnabled(
    recipients.admin,
    TimeTracking_NotificationReminderMedium.PushNotification,
  );
  const glHasEmail = isMediumEnabled(
    recipients.groupManager,
    TimeTracking_NotificationReminderMedium.Email,
  );
  const glHasMobile = isMediumEnabled(
    recipients.groupManager,
    TimeTracking_NotificationReminderMedium.PushNotification,
  );
  const empHasEmail = isMediumEnabled(
    recipients.employee,
    TimeTracking_NotificationReminderMedium.Email,
  );
  const empHasMobile = isMediumEnabled(
    recipients.employee,
    TimeTracking_NotificationReminderMedium.PushNotification,
  );

  const anyOn =
    adminHasEmail ||
    adminHasMobile ||
    glHasEmail ||
    glHasMobile ||
    empHasEmail ||
    empHasMobile;
  if (!anyOn) {
    return intl.formatMessage({ id: 'notifications.status.off' });
  }

  const hasEmail = adminHasEmail || glHasEmail || empHasEmail;
  const hasMobile = adminHasMobile || glHasMobile || empHasMobile;
  let channels = '';
  if (hasEmail && hasMobile) {
    channels = intl.formatMessage({
      id: 'notifications.overtime.channel.email.mobile',
    });
  } else if (hasEmail) {
    channels = intl.formatMessage({ id: 'notifications.email' }).toLowerCase();
  } else {
    channels = intl.formatMessage({ id: 'notifications.mobile' }).toLowerCase();
  }

  return intl.formatMessage(
    { id: 'notifications.overtime.recipients.line' },
    { channels },
  );
};

export const upsertRuleForPeriod = (
  rules: TimeTracking_OvertimeNotificationRule[],
  period: TimeTracking_OvertimePeriod.Day | TimeTracking_OvertimePeriod.Week,
  next: TimeTracking_OvertimeNotificationRule,
): TimeTracking_OvertimeNotificationRule[] => {
  const without = rules.filter((r) => r.threshold.period !== period);
  return [...without, next];
};

export const removeRuleForPeriod = (
  rules: TimeTracking_OvertimeNotificationRule[],
  period: TimeTracking_OvertimePeriod,
): TimeTracking_OvertimeNotificationRule[] =>
  rules.filter((r) => r.threshold.period !== period);

/** Client-only draft rules use ids like `draft-DAY-…` (see `createDefaultOvertimeRule`). */
export const isDraftOvertimeRuleId = (id: string): boolean =>
  id.startsWith('draft-');

/** Company-wide rule (user settings cannot delete; updates use create — see `buildOvertimeNotificationsManageInput` user-level options). */
export const isOvertimeRuleAssignedToAll = (
  rule: TimeTracking_OvertimeNotificationRule | undefined,
): boolean =>
  rule?.assignedTo != null &&
  rule.assignedTo.entityType === TimeTracking_OvertimeRuleEntityType.All;

const isDayOrWeekPeriod = (period: TimeTracking_OvertimePeriod): boolean =>
  period === TimeTracking_OvertimePeriod.Day ||
  period === TimeTracking_OvertimePeriod.Week;

const sortMediums = (
  list: TimeTracking_NotificationReminderMedium[],
): TimeTracking_NotificationReminderMedium[] => [...list].sort();

const recipientsEqual = (
  a: TimeTracking_OvertimeAlertRecipients | undefined,
  b: TimeTracking_OvertimeAlertRecipients | undefined,
): boolean => {
  if (a == null || b == null) {
    return a === b;
  }
  return (
    JSON.stringify({
      admin: sortMediums(a.admin ?? []),
      groupManager: sortMediums(a.groupManager ?? []),
      employee: sortMediums(a.employee ?? []),
    }) ===
    JSON.stringify({
      admin: sortMediums(b.admin ?? []),
      groupManager: sortMediums(b.groupManager ?? []),
      employee: sortMediums(b.employee ?? []),
    })
  );
};

const sortedJoin = (ids: string | null | undefined): string =>
  String(ids ?? '')
    .split(',')
    .map((s) => s.trim())
    .sort()
    .join(',');

const assignedToEqual = (
  a: TimeTracking_OvertimeNotificationRule['assignedTo'] | undefined,
  b: TimeTracking_OvertimeNotificationRule['assignedTo'] | undefined,
): boolean => {
  if (a == null || b == null) {
    return a === b;
  }
  return (
    String(a.entityType) === String(b.entityType) &&
    sortedJoin(a.entityIds) === sortedJoin(b.entityIds)
  );
};

/** True when all user-editable / API-relevant fields match (used for update vs skip). */
const overtimeRulesDataEqual = (
  a: TimeTracking_OvertimeNotificationRule,
  b: TimeTracking_OvertimeNotificationRule,
): boolean =>
  a.threshold.hours === b.threshold.hours &&
  a.threshold.minutes === b.threshold.minutes &&
  a.threshold.period === b.threshold.period &&
  a.alertFrequency.totalAlerts === b.alertFrequency.totalAlerts &&
  a.alertFrequency.intervalMinutes === b.alertFrequency.intervalMinutes &&
  recipientsEqual(a.recipients, b.recipients) &&
  assignedToEqual(a.assignedTo, b.assignedTo);

const ruleToCreateInput = (
  rule: TimeTracking_OvertimeNotificationRule,
): TimeTracking_CreateOvertimeNotificationRuleInput => ({
  threshold: {
    hours: rule.threshold.hours,
    minutes: rule.threshold.minutes,
    period: rule.threshold.period,
  },
  alertFrequency: {
    totalAlerts: rule.alertFrequency.totalAlerts,
    intervalMinutes: rule.alertFrequency.intervalMinutes,
  },
  recipients: {
    admin: [...rule.recipients.admin],
    groupManager: [...rule.recipients.groupManager],
    employee: [...rule.recipients.employee],
  },
});

const ruleToUpdateInput = (
  rule: TimeTracking_OvertimeNotificationRule,
): TimeTracking_UpdateOvertimeNotificationRuleInput => ({
  id: rule.id,
  version: rule.meta?.version ?? '1',
  threshold: {
    hours: rule.threshold.hours,
    minutes: rule.threshold.minutes,
    period: rule.threshold.period,
  },
  alertFrequency: {
    totalAlerts: rule.alertFrequency.totalAlerts,
    intervalMinutes: rule.alertFrequency.intervalMinutes,
  },
  recipients: {
    admin: [...rule.recipients.admin],
    groupManager: [...rule.recipients.groupManager],
    employee: [...rule.recipients.employee],
  },
});

/**
 * Compares employer `savedRules` (last known API / source of truth) to `draftRules` (current UI).
 *
 * - **create** — User has Daily or Weekly checked in draft, and that **period does not exist on the API**
 *   yet (`savedRules` has no rule for that period with a **non–`draft-`** id). Client-only `draft-…`
 *   rows in `savedRules` with the same data mean “already submitted once without id refresh” → no second create.
 * - **update** — That period **already exists on the API** (persisted id in `savedRules`) and **any**
 *   compared field differs from draft (threshold, alert frequency, recipients, assignedTo).
 * - **delete** — User unchecked Daily/Weekly: period is **gone from draft** but **persisted** rule
 *   still in `savedRules` → delete by **server id** only (never `draft-…`).
 *
 * **User-level** (`userLevelOvertimeNotifications`): Rules with `assignedTo` ALL are company-defined.
 * Deletes for those periods are omitted (UI blocks uncheck). Updates to such rules emit **create** instead of **update**.
 */
export const buildOvertimeNotificationsManageInput = (
  savedRules: TimeTracking_OvertimeNotificationRule[],
  draftRules: TimeTracking_OvertimeNotificationRule[],
  options?: { userLevelOvertimeNotifications?: boolean },
): TimeTracking_UpdateOvertimeNotificationSettingsInput | undefined => {
  const userLevel = options?.userLevelOvertimeNotifications === true;

  const draftDayWeekPeriods = new Set(
    draftRules
      .filter((r) => isDayOrWeekPeriod(r.threshold.period))
      .map((r) => r.threshold.period),
  );

  const deleteIds = savedRules
    .filter(
      (r) =>
        isDayOrWeekPeriod(r.threshold.period) &&
        !draftDayWeekPeriods.has(r.threshold.period) &&
        !isDraftOvertimeRuleId(r.id) &&
        !(userLevel && isOvertimeRuleAssignedToAll(r)),
    )
    .map((r) => r.id);

  const savedById = new Map(savedRules.map((r) => [r.id, r] as const));

  const persistedRuleForPeriod = (
    period: TimeTracking_OvertimePeriod,
  ): TimeTracking_OvertimeNotificationRule | undefined =>
    savedRules.find(
      (s) =>
        isDayOrWeekPeriod(s.threshold.period) &&
        s.threshold.period === period &&
        !isDraftOvertimeRuleId(s.id),
    );

  const create: TimeTracking_CreateOvertimeNotificationRuleInput[] = [];
  const update: TimeTracking_UpdateOvertimeNotificationRuleInput[] = [];

  draftRules.forEach((draft) => {
    if (!isDayOrWeekPeriod(draft.threshold.period)) {
      return;
    }

    const persisted = persistedRuleForPeriod(draft.threshold.period);

    if (persisted) {
      if (!overtimeRulesDataEqual(persisted, draft)) {
        if (userLevel && isOvertimeRuleAssignedToAll(persisted)) {
          create.push(ruleToCreateInput(draft));
        } else {
          update.push(
            ruleToUpdateInput({
              ...draft,
              id: persisted.id,
              meta: persisted.meta,
            }),
          );
        }
      }
      return;
    }

    if (!isDraftOvertimeRuleId(draft.id)) {
      const previous = savedById.get(draft.id);
      if (previous && !overtimeRulesDataEqual(previous, draft)) {
        if (userLevel && isOvertimeRuleAssignedToAll(previous)) {
          create.push(ruleToCreateInput(draft));
        } else {
          update.push(ruleToUpdateInput(draft));
        }
      }
      return;
    }

    const savedPlaceholder = savedRules.find(
      (s) =>
        s.threshold.period === draft.threshold.period &&
        isDraftOvertimeRuleId(s.id),
    );
    if (savedPlaceholder && overtimeRulesDataEqual(savedPlaceholder, draft)) {
      return;
    }

    create.push(ruleToCreateInput(draft));
  });

  if (deleteIds.length === 0 && create.length === 0 && update.length === 0) {
    return undefined;
  }

  return {
    ...(deleteIds.length > 0 ? { delete: deleteIds } : {}),
    ...(create.length > 0 ? { create } : {}),
    ...(update.length > 0 ? { update } : {}),
  };
};

export const patchOvertimeRule = (
  rule: TimeTracking_OvertimeNotificationRule,
  patch: {
    threshold?: Partial<
      Pick<
        TimeTracking_OvertimeNotificationRule['threshold'],
        'hours' | 'minutes' | 'period'
      >
    >;
    alertFrequency?: Partial<
      Pick<
        TimeTracking_OvertimeNotificationRule['alertFrequency'],
        'totalAlerts' | 'intervalMinutes'
      >
    >;
    recipients?: Partial<TimeTracking_OvertimeAlertRecipients>;
  },
): TimeTracking_OvertimeNotificationRule => ({
  ...rule,
  threshold: { ...rule.threshold, ...patch.threshold },
  alertFrequency: { ...rule.alertFrequency, ...patch.alertFrequency },
  recipients: patch.recipients
    ? {
        ...rule.recipients,
        ...patch.recipients,
      }
    : rule.recipients,
});
