import { useIntl } from '@payroll/quicksand';
import dayjs from 'dayjs';
import {
  TimeTrackingEffectiveUserSettingsQuery,
  TimeTracking_ManageUserSettingsInput,
  TimeTracking_ManageUnifiedUserSettingsInput,
  TimeTracking_NotificationReminderMedium,
  TimeTracking_OvertimeNotificationRule,
  Common_DayOfWeek,
  TimeTracking_TimeForInput,
} from 'src/__generated__/timeTracking/graphql';
import {
  NotificationSettings,
  DayOfWeek,
} from '../types/NotificationsCard.types';
import { buildOvertimeNotificationsManageInput } from './overtimeNotifications.utils';

type IntlShape = ReturnType<typeof useIntl>;

// Constants for days of week
const ALL_DAYS_OF_WEEK = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
] as const;

const WEEKDAYS = ALL_DAYS_OF_WEEK.filter(
  (day) => day !== DayOfWeek.SUNDAY && day !== DayOfWeek.SATURDAY,
);

const WEEKDAYS_WITH_SATURDAY = ALL_DAYS_OF_WEEK.filter(
  (day) => day !== DayOfWeek.SUNDAY,
);

interface DropdownTypeaheadOption {
  value: string;
  label: string;
}

export const getNotificationStatus = (
  intl: IntlShape,
  email: boolean,
  mobile: boolean,
  time?: string,
): string => {
  if (email && mobile) {
    return time
      ? intl.formatMessage(
          { id: 'notifications.status.on.email.mobile.at' },
          { time },
        )
      : intl.formatMessage({ id: 'notifications.status.on.email.mobile' });
  }
  if (email) {
    return time
      ? intl.formatMessage({ id: 'notifications.status.on.email.at' }, { time })
      : intl.formatMessage({ id: 'notifications.status.on.email' });
  }
  if (mobile) {
    return time
      ? intl.formatMessage(
          { id: 'notifications.status.on.mobile.at' },
          { time },
        )
      : intl.formatMessage({ id: 'notifications.status.on.mobile' });
  }
  return intl.formatMessage({ id: 'notifications.status.off' });
};

// Helper function to format days array into readable string
export const formatDaysOfWeek = (intl: IntlShape, days: string[]): string => {
  if (!days || days.length === 0) {
    return intl.formatMessage({ id: 'notifications.days.no.days.selected' });
  }

  // Sort days in week order
  const sortedDays = [...days].sort(
    (a, b) =>
      ALL_DAYS_OF_WEEK.indexOf(a as DayOfWeek) -
      ALL_DAYS_OF_WEEK.indexOf(b as DayOfWeek),
  );

  // Check for common patterns
  if (sortedDays.length === ALL_DAYS_OF_WEEK.length) {
    return intl.formatMessage({ id: 'notifications.days.every.day' });
  }
  if (
    sortedDays.length === WEEKDAYS.length &&
    WEEKDAYS.every((day) => sortedDays.includes(day))
  ) {
    return intl.formatMessage({ id: 'notifications.days.monday.friday' });
  }
  if (
    sortedDays.length === WEEKDAYS_WITH_SATURDAY.length &&
    WEEKDAYS_WITH_SATURDAY.every((day) => sortedDays.includes(day))
  ) {
    return intl.formatMessage({ id: 'notifications.days.monday.saturday' });
  }

  // Format individual days (capitalize first letter, lowercase rest)
  return sortedDays
    .map((day) => day.charAt(0) + day.slice(1).toLowerCase())
    .join(', ');
};

/**
 * Converts time string to hh:mm AM/PM format
 * Handles various input formats including HH:mm, HH:mm:ss, ISO strings, etc.
 */
const formatTimeToAMPM = (timeString?: string): string => {
  if (!timeString) {
    return '';
  }

  try {
    // Handle different time formats
    let hours: number;
    let minutes: number;

    // If it's already in AM/PM format, return as is
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }

    // Parse HH:mm or HH:mm:ss format
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);
    } else {
      // If parsing fails, return original
      return timeString;
    }

    // Validate parsed values
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return timeString;
    }

    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    const minutesStr = minutes.toString().padStart(2, '0');

    return `${hours12}:${minutesStr} ${period}`;
  } catch (error) {
    // If any error occurs, return original string
    return timeString;
  }
};

/**
 * Maps days of week from GraphQL enum to string array format
 */
const mapDaysOfWeek = (days?: Common_DayOfWeek[]): string[] => {
  if (!days || days.length === 0) {
    return [...WEEKDAYS];
  }

  // Map GraphQL enum to uppercase string format
  return days.map((day) => day.toUpperCase());
};

/**
 * Checks if a notification medium is enabled
 */
const isNotificationMediumEnabled = (
  mediums?: TimeTracking_NotificationReminderMedium[],
  medium?: TimeTracking_NotificationReminderMedium,
): boolean => {
  if (!mediums || !medium) {
    return false;
  }
  return mediums.includes(medium);
};

/**
 * Maps effective user settings from GraphQL to NotificationSettings format
 */
export const mapEffectiveUserSettings = (
  data?: TimeTrackingEffectiveUserSettingsQuery,
): Partial<NotificationSettings> => {
  if (!data?.timeTrackingEffectiveUserSettings) {
    return {};
  }

  const settings = data.timeTrackingEffectiveUserSettings;

  const mappedSettings: Partial<NotificationSettings> = {
    versions: {
      clockInReminderTime: '1',
      clockInNotificationMedium: '1',
      clockOutReminderTime: '1',
      clockOutNotificationMedium: '1',
      notificationEnabledForDays: '1',
    },
  };

  // Only set values if they exist in the API response
  // Convert times to hh:mm AM/PM format
  if (settings.clockInSetting?.reminderTime?.value) {
    mappedSettings.clockInTime = formatTimeToAMPM(
      settings.clockInSetting.reminderTime.value,
    );
    // Extract version from meta if available
    if (settings.clockInSetting.reminderTime.meta?.version) {
      mappedSettings.versions!.clockInReminderTime =
        settings.clockInSetting.reminderTime.meta.version;
    }
  }

  if (settings.clockOutSetting?.reminderTime?.value) {
    mappedSettings.clockOutTime = formatTimeToAMPM(
      settings.clockOutSetting.reminderTime.value,
    );
    // Extract version from meta if available
    if (settings.clockOutSetting.reminderTime.meta?.version) {
      mappedSettings.versions!.clockOutReminderTime =
        settings.clockOutSetting.reminderTime.meta.version;
    }
  }

  if (settings.notificationEnabledForDays?.value) {
    mappedSettings.daysOfWeek = mapDaysOfWeek(
      settings.notificationEnabledForDays.value,
    );
    // Extract version from meta if available
    if (settings.notificationEnabledForDays.meta?.version) {
      mappedSettings.versions!.notificationEnabledForDays =
        settings.notificationEnabledForDays.meta.version;
    }
  }

  // Clock in notification mediums
  if (settings.clockInSetting?.notificationMedium?.value) {
    mappedSettings.clockInEmail = isNotificationMediumEnabled(
      settings.clockInSetting.notificationMedium.value,
      TimeTracking_NotificationReminderMedium.Email,
    );
    mappedSettings.clockInMobile = isNotificationMediumEnabled(
      settings.clockInSetting.notificationMedium.value,
      TimeTracking_NotificationReminderMedium.PushNotification,
    );
    // Extract version from meta if available
    if (settings.clockInSetting.notificationMedium.meta?.version) {
      mappedSettings.versions!.clockInNotificationMedium =
        settings.clockInSetting.notificationMedium.meta.version;
    }
  }

  // Clock out notification mediums
  if (settings.clockOutSetting?.notificationMedium?.value) {
    mappedSettings.clockOutEmail = isNotificationMediumEnabled(
      settings.clockOutSetting.notificationMedium.value,
      TimeTracking_NotificationReminderMedium.Email,
    );
    mappedSettings.clockOutMobile = isNotificationMediumEnabled(
      settings.clockOutSetting.notificationMedium.value,
      TimeTracking_NotificationReminderMedium.PushNotification,
    );
    // Extract version from meta if available
    if (settings.clockOutSetting.notificationMedium.meta?.version) {
      mappedSettings.versions!.clockOutNotificationMedium =
        settings.clockOutSetting.notificationMedium.meta.version;
    }
  }

  return mappedSettings;
};

/**
 * Converts time string from AM/PM format to HH:mm 24-hour format
 */
export const convertTimeToHHMM = (timeString: string): string => {
  if (!timeString) {
    return '';
  }

  try {
    // If it's already in HH:mm format, return as is
    if (!timeString.includes('AM') && !timeString.includes('PM')) {
      return timeString;
    }

    // Parse AM/PM format
    const timeMatch = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) {
      return timeString;
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3].toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}`;
  } catch (error) {
    return timeString;
  }
};

export type MapNotificationSettingsOvertimeArgs = {
  /** Last loaded from API (before this save) */
  savedRules: TimeTracking_OvertimeNotificationRule[];
  /** Current editor state */
  draftRules: TimeTracking_OvertimeNotificationRule[];
};

/**
 * Redux settings context may include UI-only fields (e.g. `displayName`).
 * `TimeTracking_TimeForInput` only allows `id` and `timeForType` — extra keys cause ValidationError.
 */
export const toTimeForGraphQLInput = (
  settingsFor: TimeTracking_TimeForInput & { displayName?: string },
): TimeTracking_TimeForInput => ({
  id: settingsFor.id,
  timeForType: settingsFor.timeForType,
});

/** Clock-in/out and reminder days — `timeTrackingManageUserSettings` only. */
export const mapNotificationSettingsToManageUserInput = (
  settings: NotificationSettings,
  settingsFor: TimeTracking_TimeForInput,
): TimeTracking_ManageUserSettingsInput => {
  const clockInMediums: TimeTracking_NotificationReminderMedium[] = [];
  if (settings.clockInEmail) {
    clockInMediums.push(TimeTracking_NotificationReminderMedium.Email);
  }
  if (settings.clockInMobile) {
    clockInMediums.push(
      TimeTracking_NotificationReminderMedium.PushNotification,
    );
  }

  const clockOutMediums: TimeTracking_NotificationReminderMedium[] = [];
  if (settings.clockOutEmail) {
    clockOutMediums.push(TimeTracking_NotificationReminderMedium.Email);
  }
  if (settings.clockOutMobile) {
    clockOutMediums.push(
      TimeTracking_NotificationReminderMedium.PushNotification,
    );
  }

  return {
    clockIn: {
      reminderTime: {
        value: convertTimeToHHMM(settings.clockInTime),
        version: settings.versions.clockInReminderTime,
      },
      notificationMedium: {
        value: clockInMediums,
        version: settings.versions.clockInNotificationMedium,
      },
    },
    clockOut: {
      reminderTime: {
        value: convertTimeToHHMM(settings.clockOutTime),
        version: settings.versions.clockOutReminderTime,
      },
      notificationMedium: {
        value: clockOutMediums,
        version: settings.versions.clockOutNotificationMedium,
      },
    },
    notificationEnabledForDays: {
      value: settings.daysOfWeek as Common_DayOfWeek[],
      version: settings.versions.notificationEnabledForDays,
    },
    settingsFor: toTimeForGraphQLInput(settingsFor),
  };
};

/**
 * Overtime only — `timeTrackingManageUnifiedUserSettings` (`settingsFor` + `overtimeNotifications`).
 * Returns `undefined` when there is nothing to send.
 */
export const mapOvertimeNotificationUnifiedInput = (
  settingsFor: TimeTracking_TimeForInput,
  overtime: MapNotificationSettingsOvertimeArgs,
): TimeTracking_ManageUnifiedUserSettingsInput | undefined => {
  const overtimeNotifications = buildOvertimeNotificationsManageInput(
    overtime.savedRules,
    overtime.draftRules,
    { userLevelOvertimeNotifications: true },
  );
  if (!overtimeNotifications) {
    return undefined;
  }
  // Generated `TimeTracking_ManageUnifiedUserSettingsInput` may lag schema; API accepts `overtimeNotifications`.
  return {
    settingsFor: toTimeForGraphQLInput(settingsFor),
    overtimeNotifications,
  } as TimeTracking_ManageUnifiedUserSettingsInput;
};

export const generateTimeOptions = (
  timeFormat: string,
): DropdownTypeaheadOption[] => {
  const startOfDay = dayjs().startOf('day');
  return Array.from({ length: 24 * 4 }, (_, i) => {
    const time = startOfDay.add(i * 15, 'minute').format(timeFormat);
    return { value: time, label: time };
  });
};
