import dayjs, { Dayjs } from 'dayjs';
import {
  TimeTracking_TimeEntry,
  TimeTracking_TotalDurationByDate,
} from 'src/__generated__/timeTracking/graphql';
import {
  getBrowserTimezone,
  buildDateTimeString,
} from 'src/js/common/DateAndTimeUtils';

// Toast message formatting
export const formatClockInMessage = (
  userName: string,
  startTime: string,
  intl: any,
) =>
  `${userName || ''} ${intl.formatMessage({
    id: 'timeclock.clocked.in.at',
  })} ${startTime}`;

export const formatAlreadyClockedInMessage = (startTime: string, intl: any) =>
  `${intl.formatMessage({
    id: 'timeclock.error.already.clocked.in',
    values: {
      time: startTime,
    },
  })}`;

export const formatClockOutMessage = (
  userName: string,
  endTime: string,
  intl: any,
) =>
  `${userName || ''} ${intl.formatMessage({
    id: 'timeclock.clocked.out.at',
  })} ${endTime}`;

export const formatSaveMessage = (intl: any) =>
  intl.formatMessage({
    id: 'timeclock.changes.saved',
  });

export const formatJobSwitchMessage = (timeAgainst: string, intl: any) =>
  `${intl.formatMessage({
    id: 'timeclock.job.switched',
  })} ${timeAgainst}`;

export const formatBreakStartMessage = (
  userName: string,
  startTime: string,
  intl: any,
) =>
  `${userName || ''} ${intl.formatMessage({
    id: 'timeclock.break.started.at',
  })} ${startTime}`;

// Time entry validation
export const isTimeEntryActive = (timeEntry: TimeTracking_TimeEntry | null) =>
  Boolean(timeEntry?.startTime && !timeEntry?.endTime);

// Time formatting
export const getFormattedCurrentTime = (timezone: string) =>
  dayjs().tz(getBrowserTimezone()).format();

// Duration calculations
export const calculateWeekDuration = (
  weekData: TimeTracking_TotalDurationByDate[] | undefined,
) => weekData?.reduce((acc, curr) => acc + curr.totalDurationSeconds, 0) || 0;

// Loading state
export const getLoadingState = (
  employeeLoading: boolean,
  settingsLoading: boolean,
  v3PreferencesLoading: boolean,
  employerSettingsLoading?: boolean,
  breaksByAssigneeLoading?: boolean,
  createTimeEntryLoading?: boolean,
  updateTimeEntryLoading?: boolean,
  timeEntriesLoading?: boolean,
) =>
  Boolean(
    employeeLoading ||
      settingsLoading ||
      v3PreferencesLoading ||
      employerSettingsLoading ||
      breaksByAssigneeLoading ||
      createTimeEntryLoading ||
      updateTimeEntryLoading ||
      timeEntriesLoading,
  );

// Comprehensive loading state that includes all UI element loading states
export const getFullLoadingState = (
  employeeLoading: boolean,
  settingsLoading: boolean,
  v3PreferencesLoading: boolean,
  employerSettingsLoading: boolean,
  userInfoLoading: boolean,
  timeEntriesLoading: boolean,
  todayLoading: boolean,
  weekLoading: boolean,
  uxPreferencesLoading: boolean,
) =>
  Boolean(
    employeeLoading ||
      settingsLoading ||
      v3PreferencesLoading ||
      employerSettingsLoading ||
      userInfoLoading ||
      timeEntriesLoading ||
      todayLoading ||
      weekLoading ||
      uxPreferencesLoading,
  );

export const getTimeClockMinDate = (timezone: string): Dayjs =>
  dayjs().tz(getBrowserTimezone()).subtract(24, 'hours');

export const getTimeClockMaxDate = (timezone: string): Dayjs =>
  dayjs().tz(getBrowserTimezone());

export const combineTimeAndDayjs = (
  datePart: Dayjs,
  timePart: Dayjs,
  timezone: string,
): string => {
  // Create a new date object with the original date's year, month, and day in the specified timezone
  // Build a date string and parse it in the target timezone to ensure correct DST offset
  const dateString = buildDateTimeString(datePart, timePart);
  const combined = dayjs.tz(dateString, 'YYYY-MM-DD HH:mm:ss', timezone);

  return combined.format('YYYY-MM-DDTHH:mm:ssZ');
};

export const nameSpaceId = 'Intuit.sbe.salsa.default';
