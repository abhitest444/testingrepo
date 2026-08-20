import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { Sandbox } from 'src/js/common/sandbox';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { MAX_WORK_DURATION_MINUTES } from './constants';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const DEFAULT_DURATION = '00:00';

/**
 * Helper function to build a date-time string from Dayjs objects
 * @param datePart - The Dayjs object containing the date
 * @param timePart - The Dayjs object containing the time
 * @returns Formatted date-time string in 'YYYY-MM-DD HH:mm:ss' format
 */
export const buildDateTimeString = (datePart: Dayjs, timePart: Dayjs): string =>
  `${datePart.year()}-${String(datePart.month() + 1).padStart(2, '0')}-${String(
    datePart.date(),
  ).padStart(2, '0')} ${String(timePart.hour()).padStart(2, '0')}:${String(
    timePart.minute(),
  ).padStart(2, '0')}:00`;

export const getDateFormat = (sandbox: Sandbox): string => {
  // Try QBO extension first
  if (sandbox.extensions?.qbo?.context?.getCompanyL10nInfo) {
    const defaultDateFormat =
      sandbox.extensions.qbo.context.getCompanyL10nInfo()?.defaultDateFormat;
    return defaultDateFormat ? defaultDateFormat.toLowerCase() : 'mm/dd/yyyy';
  }

  // Fallback to AppFabric localization info if available (Workforce environment)
  if (isWorkforceEnvironment(sandbox)) {
    const locale = sandbox.appContext?.getLocalizationInfo?.()?.locale;
    if (locale) {
      const localeToDateFormat: Record<string, string> = {
        'en-us': 'mm/dd/yyyy',
        'en-ca': 'dd/mm/yyyy',
        'en-gb': 'dd/mm/yyyy',
      };
      return localeToDateFormat[locale.toLowerCase()] || 'mm/dd/yyyy';
    }
  }

  return 'mm/dd/yyyy'; // Default fallback
};

export const hourMinStringToSecondsNumber = (time: string): number => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 3600 + (minutes || 0) * 60;
};

export const secondsToDurationTimestamp = (seconds: number = 0): string => {
  if (seconds === 0) return DEFAULT_DURATION;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  // Handle the case where minutes round up to 60
  if (minutes === 60) {
    const adjustedHours = hours + 1;
    return `${adjustedHours.toString().padStart(2, '0')}:00`;
  }

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${formattedHours}:${formattedMinutes}`;
};

export const secondsNumberToHourMinString = (seconds: number = 0): string => {
  if (seconds === 0) return '0h 0m';
  const hours = Math.floor(seconds / 3600).toString();
  const minutes = Math.floor((seconds % 3600) / 60).toString();
  return `${hours}h ${minutes}m`;
};

const durationRegex: RegExp = /^[0-9]+:[0-5][0-9]$/;
export const isValidDurationFormat = (value: string): boolean =>
  durationRegex.test(value);

export const exceedsMaxDuration = (duration: string): boolean => {
  const [hours, minutes] = duration.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes > MAX_WORK_DURATION_MINUTES;
};

export const formatDuration = (input: string): string | null => {
  if (isValidDurationFormat(input)) {
    // Even if valid, ensure consistent hh:mm format with leading zeros
    const [hours, minutes] = input.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }

  // return null for invalid input of non-numeric characters (excluding ':')
  if (/[^0-9:.]/.test(input)) {
    return null;
  }

  // Check if the input is empty or is all zeros
  if (!input || /^0+$/.test(input)) {
    return DEFAULT_DURATION;
  }

  // Remove leading zeros and split by colon
  const parts = input.replace(/^0+/, '').split(':');

  // Handle cases with no colon or single colon
  if (parts.length === 1) {
    // Handle military time format
    if (/^\d{3,4}$/.test(input)) {
      const paddedInput = input.padStart(4, '0');
      const hours = paddedInput.slice(0, 2);
      const minutes = paddedInput.slice(2, 4);
      return `${hours}:${minutes}`;
    }

    const cleanedDigits = parts[0];
    if (cleanedDigits.length === 0) {
      return null;
    }
    // Handle single digit input
    if (/^\d$/.test(cleanedDigits)) {
      return `${cleanedDigits.padStart(2, '0')}:00`;
    }

    // Handle input with decimal
    if (/^\d*\.?\d+$/.test(cleanedDigits)) {
      const [whole, fraction] = cleanedDigits.split('.');
      const minutes = Math.round(parseFloat(`0.${fraction}`) * 60)
        .toString()
        .padStart(2, '0');
      return `${(whole || '0').padStart(2, '0')}:${minutes}`;
    }

    return `${cleanedDigits.padStart(2, '0')}:00`;
  }
  if (parts.length === 2) {
    const [hours, minutes] = parts;
    if (hours.length === 0 && minutes.length === 0) {
      return null;
    }
    const formattedHours = (hours.length === 0 ? '0' : hours).padStart(2, '0');
    const formattedMinutes = minutes.padStart(2, '0').slice(0, 2);
    return `${formattedHours}:${formattedMinutes}`;
  }

  // More than one colon is considered invalid
  return null;
};

const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s?(AM|PM)$/;
const numberRegex = /^[0-9]+$/i;
export const isValidTime = (value: string): boolean => timeRegex.test(value);

export const formatTime = (newValue: string): string => {
  // Validate the input time format
  if (isValidTime(newValue)) {
    const time = newValue.trim().replace(' ', '');
    const [hours, minutes] = time.slice(0, -2).split(':');
    const amPMValue = time.slice(-2);
    const formattedTime = `${hours}:${minutes} ${amPMValue}`;

    return formattedTime.replace(/am|pm/i, (match) => match.toUpperCase());
  }

  let explicitSuffix = '';
  let hourMinuteData = newValue.trim();

  // Check for and remove explicit AM/PM suffix
  const amMatch = hourMinuteData.match(/\s*(am)/i);
  const pmMatch = hourMinuteData.match(/\s*(pm)/i);

  if (amMatch) {
    explicitSuffix = 'AM';
    hourMinuteData = hourMinuteData.replace(/\s*am/i, '');
  } else if (pmMatch) {
    explicitSuffix = 'PM';
    hourMinuteData = hourMinuteData.replace(/\s*pm/i, '');
  } else if (/[aA]/.test(hourMinuteData) && !/[pP]/.test(hourMinuteData)) {
    // Handle cases like '10a' -> treat as AM
    explicitSuffix = 'AM';
    hourMinuteData = hourMinuteData.replace(/[aA]/, '');
  } else if (/[pP]/.test(hourMinuteData) && !/[aA]/.test(hourMinuteData)) {
    // Handle cases like '2p' -> treat as PM
    explicitSuffix = 'PM';
    hourMinuteData = hourMinuteData.replace(/[pP]/, '');
  }

  hourMinuteData = hourMinuteData.trim(); // Trim again after suffix removal

  // Handle numeric inputs without a colon (potential military time)
  if (
    hourMinuteData.indexOf(':') === -1 &&
    numberRegex.test(hourMinuteData) &&
    hourMinuteData.length > 0
  ) {
    let hours24 = 0;
    let minutes = 0;

    // Parse based on length (assuming HHmm, Hmm, HH, H)
    if (hourMinuteData.length >= 3) {
      // 3 or 4 digits
      const paddedInput = hourMinuteData.padStart(4, '0'); // Pad 3 digits like 130 to 0130
      hours24 = parseInt(paddedInput.slice(0, 2), 10);
      minutes = parseInt(paddedInput.slice(2, 4), 10);
    } else {
      // 1 or 2 digits
      hours24 = parseInt(hourMinuteData, 10);
      minutes = 0; // Assume 0 minutes for H or HH input
    }

    // Validate parsed hours and minutes
    if (hours24 < 0 || hours24 > 23 || minutes < 0 || minutes > 59) {
      return newValue; // Invalid time, return original input
    }

    // Determine 12-hour format and suffix
    let hours12 = 0;
    let derivedSuffix = 'AM';

    if (hours24 === 0) {
      hours12 = 12; // Midnight
      derivedSuffix = 'AM';
    } else if (hours24 >= 1 && hours24 <= 11) {
      hours12 = hours24;
      derivedSuffix = 'AM';
    } else if (hours24 === 12) {
      hours12 = 12; // Noon
      derivedSuffix = 'PM';
    } else {
      // 13 to 23
      hours12 = hours24 - 12;
      derivedSuffix = 'PM';
    }

    // Use explicit suffix if provided, otherwise use derived suffix
    const finalSuffix = explicitSuffix || derivedSuffix;

    // Format hours and minutes with leading zeros
    const formattedHours = hours12.toString(); // Reverted: No leading zero for hour 1-9 in h:mm A
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes.toString();

    return `${formattedHours}:${formattedMinutes} ${finalSuffix}`;
  }

  // Handle inputs with a colon
  if ((hourMinuteData.match(/:/g) || []).length === 1) {
    const [hourPart, minutePart] = hourMinuteData.split(':');

    if (numberRegex.test(hourPart) && numberRegex.test(minutePart)) {
      const hours = parseInt(hourPart, 10);
      const minutes = parseInt(minutePart, 10);

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        // Determine 12-hour format and suffix
        let hours12 = 0;
        let derivedSuffix = 'AM';
        if (hours === 0) {
          hours12 = 12;
          derivedSuffix = 'AM';
        } else if (hours >= 1 && hours <= 11) {
          hours12 = hours;
          derivedSuffix = 'AM';
        } else if (hours === 12) {
          hours12 = 12;
          derivedSuffix = 'PM';
        } else {
          hours12 = hours - 12;
          derivedSuffix = 'PM';
        }

        const finalSuffix = explicitSuffix || derivedSuffix;
        const formattedHours = hours12.toString(); // Reverted: No leading zero for hour 1-9 in h:mm A
        const formattedMinutes =
          minutes < 10 ? `0${minutes}` : minutes.toString();

        return `${formattedHours}:${formattedMinutes} ${finalSuffix}`;
      }
    }
  }

  // If input doesn't match expected formats, return it as is
  return newValue;
};

export const timeStringToDayjs = (
  value: string,
  format: string = 'h:mm A',
): Dayjs => dayjs(value, format);

export const validateAndFormatDate = (date: string, outputFormat: string) => {
  // Standard validation first: Try with the expected format
  // Create a regex pattern based on the output format
  const dateRegex = new RegExp(
    outputFormat
      .replace(/YYYY/, '(\\d{4})')
      .replace(/MM/, '(\\d{2})')
      .replace(/DD/, '(\\d{2})')
      // eslint-disable-next-line no-useless-escape
      .replace(/[\/\-\.]/g, '[/\\-\\.]'),
  );

  const match = date.match(dateRegex);
  if (match) {
    const parsedDate = dayjs(date, outputFormat, true);
    if (parsedDate.isValid()) {
      const formattedDate = parsedDate.format(outputFormat);
      return { isValidDate: true, formattedDate };
    }
  }

  // If standard validation fails, check for mobile's YYYY-MM-DD format
  // This addresses a known issue where mobile date inputs are always in YYYY-MM-DD format
  // Supporting both formats: YYYY-MM-DD and YYYY-M-D (single digit month/day)
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
    // Normalize single-digit month/day to two digits if needed
    // For example: 2023-4-5 should be treated as 2023-04-05
    let normalizedDate = date;
    const parts = date.split('-');
    if (parts.length === 3) {
      // Normalize month and day to two digits if they're not already
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      normalizedDate = `${year}-${month}-${day}`;
    }

    // Try with the normalized date and a strict format
    const mobileDate = dayjs(normalizedDate, 'YYYY-MM-DD', true);
    if (mobileDate.isValid()) {
      // Convert from mobile format to the required output format for consistency
      const formattedDate = mobileDate.format(outputFormat);
      return { isValidDate: true, formattedDate };
    }
  }

  // Return invalid if both formats fail
  return { isValidDate: false, formattedDate: date };
};

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

export const combineTimeAndDayjsForTimeEntries = (
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

export const stringToDayJS = (
  value: string,
  format: string,
  isStrict: boolean = true,
) => dayjs(value, format, isStrict);

/**
 * Gets the browser's timezone using Intl.DateTimeFormat
 * @returns The browser timezone string (e.g., 'America/New_York', 'Europe/London')
 */
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback to UTC if timezone detection fails
    return 'UTC';
  }
};

export const mapQBTimezoneToDayjsTimezone = (
  qbTimezone?: string | null,
): string => {
  // Handle undefined and null cases by returning default timezone
  if (!qbTimezone || qbTimezone === '') {
    return 'America/Los_Angeles';
  }

  // Adapted from QBO Monolith QBTimeZone enum
  const QBTimeZones: { [key: string]: string } = {
    '(UTC-08:00) Pacific Time (US & Canada)': 'America/Los_Angeles',
    '(UTC) Dublin, Edinburgh, Lisbon, London': 'Europe/London',
    '(UTC+08:00) Kuala Lumpur, Singapore': 'Asia/Singapore',
    '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi': 'Asia/Calcutta',
    '(UTC-11:00) Coordinated Universal Time-11': 'Etc/GMT+11',
    '(UTC-10:00) Hawaii': 'Pacific/Honolulu',
    '(UTC-09:00) Alaska': 'America/Anchorage',
    '(UTC-08:00) Baja California': 'America/Santa_Isabel',
    '(UTC-07:00) Arizona': 'America/Phoenix',
    '(UTC-07:00) Chihuahua, La Paz, Mazatlan': 'America/Chihuahua',
    '(UTC-07:00) Mountain Time (US & Canada)': 'America/Denver',
    '(UTC-06:00) Central America': 'America/Guatemala',
    '(UTC-06:00) Central Time (US & Canada)': 'America/Chicago',
    '(UTC-06:00) Guadalajara, Mexico City, Monterrey': 'America/Mexico_City',
    '(UTC-06:00) Saskatchewan': 'America/Regina',
    '(UTC-05:00) Bogota, Lima, Quito': 'America/Bogota',
    '(UTC-05:00) Eastern Time (US & Canada)': 'America/New_York',
    '(UTC-05:00) Indiana (East)': 'America/Indianapolis',
    '(UTC-04:30) Caracas': 'America/Caracas',
    '(UTC-04:00) Asuncion': 'America/Asuncion',
    '(UTC-04:00) Atlantic Time (Canada)': 'America/Halifax',
    '(UTC-04:00) Cuiaba': 'America/Cuiaba',
    '(UTC-04:00) Georgetown, La Paz, Manaus, San Juan': 'America/La_Paz',
    '(UTC-04:00) Santiago': 'America/Santiago',
    '(UTC-03:30) Newfoundland': 'America/St_Johns',
    '(UTC-03:00) Brasilia': 'America/Sao_Paulo',
    '(UTC-03:00) Buenos Aires': 'America/Buenos_Aires',
    '(UTC-03:00) Cayenne, Fortaleza': 'America/Cayenne',
    '(UTC-03:00) Greenland': 'America/Godthab',
    '(UTC-03:00) Montevideo': 'America/Montevideo',
    '(UTC-03:00) Salvador': 'America/Bahia',
    '(UTC-02:00) Coordinated Universal Time-02': 'Etc/GMT+2',
    '(UTC-02:00) Mid-Atlantic': 'America/Noronha',
    '(UTC-01:00) Azores': 'Atlantic/Azores',
    '(UTC-01:00) Cape Verde Is.': 'Atlantic/Cape_Verde',
    '(UTC) Casablanca': 'Africa/Casablanca',
    '(UTC) Coordinated Universal Time': 'Etc/GMT',
    '(UTC) Monrovia, Reykjavik': 'Atlantic/Reykjavik',
    '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna':
      'Europe/Berlin',
    '(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague':
      'Europe/Budapest',
    '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris': 'Europe/Paris',
    '(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb': 'Europe/Warsaw',
    '(UTC+01:00) West Central Africa': 'Africa/Lagos',
    '(UTC+01:00) Windhoek': 'Africa/Windhoek',
    '(UTC+02:00) Amman': 'Asia/Amman',
    '(UTC+02:00) Athens, Bucharest': 'Europe/Bucharest',
    '(UTC+02:00) Beirut': 'Asia/Beirut',
    '(UTC+02:00) Cairo': 'Africa/Cairo',
    '(UTC+02:00) Damascus': 'Asia/Damascus',
    '(UTC+02:00) Harare, Pretoria': 'Africa/Johannesburg',
    '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius': 'Europe/Kiev',
    '(UTC+02:00) Istanbul': 'Europe/Istanbul',
    '(UTC+02:00) Jerusalem': 'Asia/Jerusalem',
    '(UTC+02:00) Nicosia': 'Asia/Nicosia',
    '(UTC+03:00) Baghdad': 'Asia/Baghdad',
    '(UTC+03:00) Kaliningrad, Minsk': 'Europe/Kaliningrad',
    '(UTC+03:00) Kuwait, Riyadh': 'Asia/Riyadh',
    '(UTC+03:00) Nairobi': 'Africa/Nairobi',
    '(UTC+03:30) Tehran': 'Asia/Tehran',
    '(UTC+04:00) Abu Dhabi, Muscat': 'Asia/Dubai',
    '(UTC+04:00) Baku': 'Asia/Baku',
    '(UTC+04:00) Moscow, St. Petersburg, Volgograd': 'Europe/Moscow',
    '(UTC+04:00) Port Louis': 'Indian/Mauritius',
    '(UTC+04:00) Tbilisi': 'Asia/Tbilisi',
    '(UTC+04:00) Yerevan': 'Asia/Yerevan',
    '(UTC+04:30) Kabul': 'Asia/Kabul',
    '(UTC+05:00) Islamabad, Karachi': 'Asia/Karachi',
    '(UTC+05:00) Tashkent': 'Asia/Tashkent',
    '(UTC-12:00) International Date Line West': 'Etc/GMT+12',
    '(UTC+05:30) Sri Jayawardenepura': 'Asia/Colombo',
    '(UTC+05:45) Kathmandu': 'Asia/Katmandu',
    '(UTC+06:00) Astana': 'Asia/Almaty',
    '(UTC+06:00) Dhaka': 'Asia/Dhaka',
    '(UTC+06:00) Ekaterinburg': 'Asia/Yekaterinburg',
    '(UTC+06:30) Yangon (Rangoon)': 'Asia/Rangoon',
    '(UTC+07:00) Bangkok, Hanoi, Jakarta': 'Asia/Bangkok',
    '(UTC+07:00) Novosibirsk': 'Asia/Novosibirsk',
    '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi': 'Asia/Shanghai',
    '(UTC+08:00) Krasnoyarsk': 'Asia/Krasnoyarsk',
    '(UTC+08:00) Perth': 'Australia/Perth',
    '(UTC+08:00) Taipei': 'Asia/Taipei',
    '(UTC+08:00) Ulaanbaatar': 'Asia/Ulaanbaatar',
    '(UTC+09:00) Irkutsk': 'Asia/Irkutsk',
    '(UTC+09:00) Osaka, Sapporo, Tokyo': 'Asia/Tokyo',
    '(UTC+09:00) Seoul': 'Asia/Seoul',
    '(UTC+09:30) Adelaide': 'Australia/Adelaide',
    '(UTC+09:30) Darwin': 'Australia/Darwin',
    '(UTC+10:00) Brisbane': 'Australia/Brisbane',
    '(UTC+10:00) Canberra, Melbourne, Sydney': 'Australia/Sydney',
    '(UTC+10:00) Guam, Port Moresby': 'Pacific/Port_Moresby',
    '(UTC+10:00) Hobart': 'Australia/Hobart',
    '(UTC+10:00) Yakutsk': 'Asia/Yakutsk',
    '(UTC+11:00) Solomon Is., New Caledonia': 'Pacific/Guadalcanal',
    '(UTC+11:00) Vladivostok': 'Asia/Vladivostok',
    '(UTC+12:00) Auckland, Wellington': 'Pacific/Auckland',
    '(UTC+12:00) Coordinated Universal Time+12': 'Etc/GMT-12',
    '(UTC+12:00) Fiji': 'Pacific/Fiji',
    '(UTC+12:00) Magadan': 'Asia/Magadan',
    "(UTC+13:00) Nuku'alofa": 'Pacific/Tongatapu',
    '(UTC+13:00) Samoa': 'Pacific/Apia',
  };

  // incase we dont have the mapping, we return the timezone as it is dont return any default
  // this is necessary to make sure we dont send default timezone for other selected timezones
  return QBTimeZones[qbTimezone] || qbTimezone;
};

/**
 * Applies timezone to a dayjs object with fallback to dayjs object if no timezone is provided
 * @param dayjsObj - The dayjs object to apply timezone to
 * @param timezone - The timezone string to apply
 * @returns A new dayjs object with the timezone applied
 */
export const applyTimezoneToDayjs = (
  dayjsObj: Dayjs | null | undefined,
  timezone: string | null | undefined,
): Dayjs => {
  if (!timezone) {
    return dayjsObj || dayjs();
  }

  const dayjsTimezone = mapQBTimezoneToDayjsTimezone(timezone);
  const targetDayjs = dayjsObj || dayjs();

  // Convert to the target timezone
  return targetDayjs.tz(dayjsTimezone);
};

/**
 * Combines date and time, applies timezone, and returns both date and time parts
 * @param date - The date part
 * @param time - The time part
 * @param timezone - The target timezone
 * @returns Object with date and time parts in the target timezone
 */
export const combineDateAndTimeAndConvertToTimezone = (
  date: Dayjs | null | undefined,
  time: Dayjs | null | undefined,
  timezone: string | null | undefined,
): { date: Dayjs; time: Dayjs } => {
  const baseDate = date || dayjs();
  const baseTime = time || dayjs();

  // If time is invalid (e.g., time-only string), use current time
  const validTime = baseTime.isValid() ? baseTime : dayjs();

  // Combine date and time
  const combinedDateTime = baseDate
    .hour(validTime.hour())
    .minute(validTime.minute())
    .second(validTime.second());

  // Apply timezone conversion
  const dateTimeWithTimezone = applyTimezoneToDayjs(combinedDateTime, timezone);

  return {
    date: dateTimeWithTimezone.startOf('day'),
    time: dateTimeWithTimezone,
  };
};

/**
 * Finds the nearest time option index based on a dividing factor
 * @param currentValue - The current Dayjs time value
 * @param dividingFactor - The interval in minutes (e.g., 15 for 15-minute intervals)
 * @returns The index of the nearest option
 */
export const findNearestTimeOptionIndex = (
  currentValue: Dayjs | null | undefined,
  dividingFactor: number = 15,
): number => {
  if (!currentValue || !currentValue.isValid()) {
    return 0; // Default to first option
  }

  const currentMinutes = currentValue.hour() * 60 + currentValue.minute();

  // Find the closest interval based on dividing factor
  const nearestMinutes =
    Math.round(currentMinutes / dividingFactor) * dividingFactor;
  const nearestIndex = nearestMinutes / dividingFactor;

  // Ensure index is within bounds (24 hours * 60 minutes / dividingFactor)
  const maxIndex = (24 * 60) / dividingFactor - 1;
  return Math.max(0, Math.min(nearestIndex, maxIndex));
};

/**
 * Creates a datetime by combining date and time components.
 * Extracts hour/minute from time and year/month/day from date,
 * then builds a fresh local Dayjs object for consistent comparison.
 *
 * @param date - The Dayjs object containing the date components
 * @param time - The Dayjs object containing the time components
 * @returns A new local Dayjs object with combined date and time
 *
 * @example
 * const date = dayjs.utc('2025-10-20T00:00:00Z');
 * const time = dayjs('12:30 PM', 'h:mm A');
 * const combined = createDateTimeFromParts(date, time);
 * // Returns: Oct 20, 2025 12:30 PM in local timezone
 */
export const createDateTimeFromParts = (date: Dayjs, time: Dayjs): Dayjs => {
  // Extract components as they appear in their respective timezones
  const hour = time.hour();
  const minute = time.minute();
  const year = date.year();
  const month = date.month();
  const day = date.date();

  // Create fresh local Dayjs for consistent comparison
  // Using explicit setters ensures clean state without timezone metadata
  return dayjs()
    .year(year)
    .month(month)
    .date(day)
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0);
};
