import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';

// Configure dayjs plugins for timezone support
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

/**
 * Timezone utilities for global demo widget usage
 * Ensures consistent date handling across all timezones
 */

// Common date formats for parsing
export const DATE_FORMATS = [
  'MM/DD/YYYY',
  'MM/DD/YY',
  'MM-DD-YYYY',
  'MM-DD-YY',
  'YYYY-MM-DD',
  'DD/MM/YYYY',
  'DD/MM/YY',
  'DD-MM-YYYY',
  'DD-MM-YY',
  'MMM DD, YYYY',
  'MMM DD, YY',
  'DD MMM YYYY',
  'DD MMM YY',
] as const;

// Time formats for parsing
export const TIME_FORMATS = [
  'HH:mm',
  'HH:mm:ss',
  'h:mm A',
  'h:mm:ss A',
  'HH:mm:ss.SSS',
] as const;

/**
 * Parse a date string with multiple format support
 * Returns dayjs object in UTC
 */
export const parseDate = (dateString: string | number | Date): dayjs.Dayjs => {
  if (!dateString) {
    return dayjs.utc();
  }

  // If it's already a dayjs object, convert to UTC
  if (dayjs.isDayjs(dateString)) {
    return (dateString as dayjs.Dayjs).utc();
  }

  // If it's a Date object, convert to UTC
  if (dateString instanceof Date) {
    return dayjs.utc(dateString);
  }

  // If it's a number (timestamp), convert to UTC
  if (typeof dateString === 'number') {
    return dayjs.utc(dateString);
  }

  // Try parsing with multiple formats
  const dateStr = String(dateString).trim();

  // First try custom formats with strict parsing - parse directly as UTC to avoid timezone shifts
  const validFormat = DATE_FORMATS.find((format) => {
    const parsed = dayjs.utc(dateStr, format, true);
    return parsed.isValid();
  });

  if (validFormat) {
    return dayjs.utc(dateStr, validFormat, true);
  }

  // Then try ISO format (parse as UTC to prevent timezone shifts)
  const isoDate = dayjs.utc(dateStr);
  if (isoDate.isValid()) {
    return isoDate;
  }

  // Fallback to dayjs default parsing (as UTC)
  return dayjs.utc(dateStr);
};

/**
 * Parse a time string with multiple format support
 * Returns dayjs object in UTC for today's date
 */
export const parseTime = (timeString: string): dayjs.Dayjs => {
  if (!timeString) {
    return dayjs.utc();
  }

  const timeStr = String(timeString).trim();

  // Try parsing with time formats
  const validTimeFormat = TIME_FORMATS.find((format) => {
    const parsed = dayjs.utc(
      `1970-01-01 ${timeStr}`,
      `YYYY-MM-DD ${format}`,
      true,
    );
    return parsed.isValid();
  });

  if (validTimeFormat) {
    return dayjs.utc(
      `1970-01-01 ${timeStr}`,
      `YYYY-MM-DD ${validTimeFormat}`,
      true,
    );
  }

  // Fallback to dayjs default parsing
  const fallback = dayjs.utc(`1970-01-01 ${timeStr}`);
  return fallback.isValid() ? fallback : dayjs.utc();
};

/**
 * Format date for display in user's timezone
 * @param date - dayjs object or date string
 * @param format - display format (default: 'MM/DD/YYYY')
 * @param timezone - target timezone (default: user's timezone)
 */
export const formatDateForDisplay = (
  date: dayjs.Dayjs | string | Date,
  format: string = 'MM/DD/YYYY',
  timezone?: string,
): string => {
  const dayjsDate = dayjs.isDayjs(date) ? date : parseDate(date);
  return timezone
    ? dayjsDate.tz(timezone).format(format)
    : dayjsDate.format(format);
};

/**
 * Format date for API/GraphQL (always UTC ISO format)
 * @param date - dayjs object or date string
 */
export const formatDateForAPI = (date: dayjs.Dayjs | string | Date): string => {
  const dayjsDate = dayjs.isDayjs(date) ? date : parseDate(date);
  return dayjsDate.utc().format('YYYY-MM-DD');
};

/**
 * Format datetime for API/GraphQL (always UTC ISO format)
 * @param date - dayjs object or date string
 */
export const formatDateTimeForAPI = (
  date: dayjs.Dayjs | string | Date,
): string => {
  const dayjsDate = dayjs.isDayjs(date) ? date : parseDate(date);
  return dayjsDate.utc().toISOString();
};

/**
 * Calculate hours between two time strings
 * Handles overnight shifts and various time formats
 */
export const calculateHoursBetweenTimes = (
  startTime: string,
  endTime: string,
): number => {
  if (!startTime || !endTime) return 0;

  try {
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    // Calculate difference in milliseconds
    const diffMs = end.diff(start);

    // Convert to hours
    const hours = diffMs / (1000 * 60 * 60);

    // Handle overnight shifts (end time is next day)
    const finalHours = hours < 0 ? hours + 24 : hours;

    // Round to 2 decimal places and clamp between 0 and 24
    return Math.max(0, Math.min(24, Math.round(finalHours * 100) / 100));
  } catch (error) {
    // Error calculating hours - return 0
    return 0;
  }
};

/**
 * Get current date in UTC
 */
export const getCurrentUTCDate = (): dayjs.Dayjs => dayjs.utc();

/**
 * Get current date in user's timezone
 */
export const getCurrentLocalDate = (): dayjs.Dayjs => dayjs();

/**
 * Check if a date is valid
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const dayjsDate = dayjs.isDayjs(date) ? date : parseDate(date);
  return dayjsDate.isValid();
};

/**
 * Normalize date to YYYY-MM-DD format for consistent comparison
 * Always returns UTC date
 */
export const normalizeDate = (
  dateString: string | Date | dayjs.Dayjs,
): string => {
  const dayjsDate = dayjs.isDayjs(dateString)
    ? dateString
    : parseDate(dateString);
  return dayjsDate.utc().format('YYYY-MM-DD');
};

/**
 * Get timezone offset in minutes
 */
export const getTimezoneOffset = (): number => new Date().getTimezoneOffset();

/**
 * Convert local time to UTC
 */
export const toUTC = (date: dayjs.Dayjs | string | Date): dayjs.Dayjs => {
  const dayjsDate = dayjs.isDayjs(date) ? date : parseDate(date);
  return dayjsDate.utc();
};

/**
 * Convert UTC to local time
 */
export const toLocal = (date: dayjs.Dayjs | string | Date): dayjs.Dayjs => {
  const dayjsDate = dayjs.isDayjs(date) ? date : parseDate(date);
  return dayjsDate.local();
};

/**
 * Get start of day in UTC
 */
export const getStartOfDayUTC = (
  date: dayjs.Dayjs | string | Date,
): dayjs.Dayjs => {
  const dayjsDate = dayjs.isDayjs(date) ? date : parseDate(date);
  return dayjsDate.utc().startOf('day');
};

/**
 * Get end of day in UTC
 */
export const getEndOfDayUTC = (
  date: dayjs.Dayjs | string | Date,
): dayjs.Dayjs => {
  const dayjsDate = dayjs.isDayjs(date) ? date : parseDate(date);
  return dayjsDate.utc().endOf('day');
};

/**
 * Check if two dates are the same day (in UTC)
 */
export const isSameDay = (
  date1: dayjs.Dayjs | string | Date,
  date2: dayjs.Dayjs | string | Date,
): boolean => {
  const dayjsDate1 = dayjs.isDayjs(date1) ? date1 : parseDate(date1);
  const dayjsDate2 = dayjs.isDayjs(date2) ? date2 : parseDate(date2);
  return dayjsDate1.utc().isSame(dayjsDate2.utc(), 'day');
};

/**
 * Get date range for a week (Monday to Sunday)
 * Returns start and end dates in UTC
 */
export const getWeekRange = (
  date: dayjs.Dayjs | string | Date,
): { start: dayjs.Dayjs; end: dayjs.Dayjs } => {
  const dayjsDate = dayjs.isDayjs(date) ? date : parseDate(date);
  const start = dayjsDate.utc().startOf('week');
  const end = dayjsDate.utc().endOf('week');
  return { start, end };
};

/**
 * Format date for error messages (user-friendly)
 */
export const formatDateForError = (
  date: dayjs.Dayjs | string | Date,
): string => {
  const dayjsDate = dayjs.isDayjs(date) ? date : parseDate(date);
  return dayjsDate.format('MMM DD, YYYY');
};

/**
 * Format time for error messages (user-friendly)
 */
export const formatTimeForError = (
  time: dayjs.Dayjs | string | Date,
): string => {
  let dayjsTime: dayjs.Dayjs;

  if (dayjs.isDayjs(time)) {
    dayjsTime = time;
  } else if (time instanceof Date) {
    dayjsTime = dayjs.utc(time);
  } else {
    dayjsTime = parseTime(time);
  }

  return dayjsTime.format('h:mm A');
};
