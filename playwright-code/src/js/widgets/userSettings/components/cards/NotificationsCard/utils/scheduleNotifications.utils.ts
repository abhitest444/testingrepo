import { useIntl } from '@payroll/quicksand';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationType,
  TimeTracking_NotificationSubscriptionInput,
  TimeTracking_TimeForInput,
  TimeTracking_ManageUnifiedUserSettingsInput,
} from 'src/__generated__/timeTracking/graphql';
import type { ScheduleNotificationRow } from 'src/js/widgets/userSettings/store/slices/scheduleNotificationsSlice';
import { toTimeForGraphQLInput } from './NotificationsCard.utils';
import {
  SCHEDULE_NOTIFICATION_ROW_KEY_TO_TYPE,
  SCHEDULE_NOTIFICATION_USER_SETTINGS_ROW_KEYS,
  type ScheduleNotificationUserSettingsRowKey,
} from './scheduleNotifications.constants';

type IntlShape = ReturnType<typeof useIntl>;

/** Formats the view-mode string for a single schedule row */
export const formatScheduleRowViewValue = (
  intl: IntlShape,
  distributionMethods: TimeTracking_NotificationReminderMedium[],
): string => {
  const hasMobile = distributionMethods.includes(
    TimeTracking_NotificationReminderMedium.PushNotification,
  );
  const hasEmail = distributionMethods.includes(
    TimeTracking_NotificationReminderMedium.Email,
  );

  if (!hasMobile && !hasEmail) {
    return intl.formatMessage({ id: 'notifications.status.off' });
  }
  if (hasMobile && hasEmail) {
    return intl.formatMessage({
      id: 'notifications.schedule.view.on-mobile-email',
    });
  }
  const channelLabel = hasMobile
    ? intl.formatMessage({ id: 'notifications.mobile' })
    : intl.formatMessage({ id: 'notifications.email' });
  return intl.formatMessage(
    { id: 'notifications.schedule.view.on-with-channel' },
    { channel: channelLabel },
  );
};

/**
 * Maps the subscriptions array from Redux into a per-row lookup keyed by row key.
 * Rows missing from the API response default to an empty distributionMethods array.
 */
export const mapSubscriptionsToRowValues = (
  subscriptions: ScheduleNotificationRow[],
): Record<
  ScheduleNotificationUserSettingsRowKey,
  TimeTracking_NotificationReminderMedium[]
> => {
  const channelsByNotificationType = new Map<
    TimeTracking_NotificationType,
    TimeTracking_NotificationReminderMedium[]
  >(subscriptions.map((s) => [s.notificationType, s.distributionMethods]));

  return Object.fromEntries(
    SCHEDULE_NOTIFICATION_USER_SETTINGS_ROW_KEYS.map((key) => [
      key,
      channelsByNotificationType.get(
        SCHEDULE_NOTIFICATION_ROW_KEY_TO_TYPE[key],
      ) ?? [],
    ]),
  ) as Record<
    ScheduleNotificationUserSettingsRowKey,
    TimeTracking_NotificationReminderMedium[]
  >;
};

/**
 * Builds the `scheduleNotifications.subscriptions` input array for the mutation.
 * Only sends rows where the draft channels differ from the saved channels
 * (avoids sending no-op updates and triggering unnecessary optimistic-lock increments).
 */
export const buildScheduleNotificationsManageInput = (
  settingsFor: TimeTracking_TimeForInput,
  saved: ScheduleNotificationRow[],
  draft: ScheduleNotificationRow[],
): TimeTracking_ManageUnifiedUserSettingsInput | undefined => {
  const savedByType = new Map(saved.map((r) => [r.notificationType, r]));
  const draftByType = new Map(draft.map((r) => [r.notificationType, r]));

  const subscriptions: TimeTracking_NotificationSubscriptionInput[] =
    SCHEDULE_NOTIFICATION_USER_SETTINGS_ROW_KEYS.reduce<
      TimeTracking_NotificationSubscriptionInput[]
    >((acc, rowKey) => {
      const notificationType = SCHEDULE_NOTIFICATION_ROW_KEY_TO_TYPE[rowKey];
      const draftRow = draftByType.get(notificationType);
      const savedRow = savedByType.get(notificationType);

      const draftMethods = draftRow?.distributionMethods ?? [];
      const savedMethods = savedRow?.distributionMethods ?? [];

      const methodsChanged =
        draftMethods.length !== savedMethods.length ||
        draftMethods.some((m) => !savedMethods.includes(m));

      if (!methodsChanged) return acc;

      // Omit version entirely for first-time creates (server treats absent = create).
      // Only include it when the row already exists on the server (savedRow has a version).
      const version = savedRow?.version ?? undefined;
      return [
        ...acc,
        {
          notificationType,
          distributionMethods: draftMethods,
          ...(version !== undefined ? { version } : {}),
        },
      ];
    }, []);

  if (subscriptions.length === 0) {
    return undefined;
  }

  return {
    settingsFor: toTimeForGraphQLInput(settingsFor),
    scheduleNotifications: { subscriptions },
  } as TimeTracking_ManageUnifiedUserSettingsInput;
};
