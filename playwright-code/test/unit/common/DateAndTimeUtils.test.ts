import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { buildSandbox } from '@payroll/quicksand';
import {
  applyTimezoneToDayjs,
  buildDateTimeString,
  combineDateAndTimeAndConvertToTimezone,
  combineTimeAndDayjs,
  combineTimeAndDayjsForTimeEntries,
  createDateTimeFromParts,
  exceedsMaxDuration,
  DEFAULT_DURATION,
  formatDuration,
  formatTime,
  getBrowserTimezone,
  getDateFormat,
  hourMinStringToSecondsNumber,
  isValidDurationFormat,
  isValidTime,
  mapQBTimezoneToDayjsTimezone,
  secondsNumberToHourMinString,
  secondsToDurationTimestamp,
  stringToDayJS,
  timeStringToDayjs,
  validateAndFormatDate,
  findNearestTimeOptionIndex,
} from 'src/js/common/DateAndTimeUtils';
import { Sandbox } from 'src/js/common/sandbox';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

describe('DateAndTimeUtils', () => {
  let sandbox: Sandbox;

  const buildSandboxWithMockL10Info = ({
    defaultDateFormat = 'MM/DD/YYYY',
  } = {}) =>
    ({
      ...buildSandbox(),
      extensions: {
        qbo: {
          context: {
            getCompanyL10nInfo: () => ({
              defaultDateFormat,
            }),
          },
        },
      },
    } as unknown as Sandbox);

  beforeEach(() => {
    sandbox = buildSandboxWithMockL10Info();
  });

  describe('getDateFormatFromSettings', () => {
    it('should return the default date format in lowercase when provided by sandbox', () => {
      // Act
      const result = getDateFormat(sandbox);

      // Assert
      expect(result).toBe('mm/dd/yyyy');
    });

    it('should return "mm/dd/yyyy" when no default date format is provided by sandbox', () => {
      // @ts-ignore
      sandbox.extensions.qbo.context.getCompanyL10nInfo = () => ({});

      // Act
      const result = getDateFormat(sandbox);

      // Assert
      expect(result).toBe('mm/dd/yyyy');
    });

    it.each([
      ['en-us', 'mm/dd/yyyy'],
      ['en-ca', 'dd/mm/yyyy'],
      ['en-gb', 'dd/mm/yyyy'],
    ])(
      'should return "%s" date format for %s locale in WFS when QBO extension is not available',
      (locale, expectedFormat) => {
        const wfsSandbox = {
          ...buildSandbox(),
          extensions: {
            qbo: undefined,
          },
          appContext: {
            getLocalizationInfo: () => ({ locale }),
            getAppInfo: () => ({ appId: 'payroll-employee-portal-experience' }),
          },
        } as unknown as Sandbox;

        const result = getDateFormat(wfsSandbox);

        expect(result).toBe(expectedFormat);
      },
    );

    it('should return "mm/dd/yyyy" as default fallback when no localization info is available in WFS', () => {
      const wfsSandbox = {
        ...buildSandbox(),
        extensions: {
          qbo: undefined,
        },
        appContext: {
          getLocalizationInfo: () => undefined,
          getAppInfo: () => ({ appId: 'payroll-employee-portal-experience' }),
        },
      } as unknown as Sandbox;

      const result = getDateFormat(wfsSandbox);

      expect(result).toBe('mm/dd/yyyy');
    });
  });

  describe('hourMinStringToSecondsNumber', () => {
    test.each([
      ['1:01', 3660],
      ['0:00', 0],
      ['2:30', 9000],
      ['0:45', 2700],
      ['10:00', 36000],
      ['', 0],
      ['100', 0],
      ['a:b', 0],
      ['2:', 7200],
      [':30', 1800],
      ['01:05', 3900],
    ])('should convert "%s" to %d seconds', (input, expected) => {
      const result = hourMinStringToSecondsNumber(input);
      expect(result).toBe(expected);
    });
  });

  describe('secondsToDurationTimestamp', () => {
    test.each([
      [3661, '01:01'],
      [0, DEFAULT_DURATION],
      [60, '00:01'],
      [3600, '01:00'],
      [59, '00:01'],
      [86399, '24:00'],
      [86400, '24:00'],
      [89999, '25:00'],
      [90061, '25:01'],
      [undefined, DEFAULT_DURATION],
    ])('should convert %s seconds to "%s"', (durationSeconds, expected) => {
      // Act
      const result = secondsToDurationTimestamp(durationSeconds);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('isValidDurationFormat', () => {
    test.each([
      ['0:00', true],
      ['12:34', true],
      ['123:45', true],
      ['12:345', false],
      ['12:3', false],
      ['abc:de', false],
      ['12:34:56', false],
      ['12:34abc', false],
      ['', false],
      [null as any, false],
      [undefined as any, false],
    ])('should return %s for input "%s"', (input, expected) => {
      expect(isValidDurationFormat(input)).toBe(expected);
    });
  });

  describe('formatDuration', () => {
    test.each([
      ['2:30', '02:30'],
      ['5', '05:00'],
      ['45', '45:00'],
      ['007', '00:07'],
      ['0000', '00:00'],
      ['.5', '00:30'],
      ['1.5', '01:30'],
      ['1;5', null],
      ['1:5', '01:05'],
      [':', null],
      [':2', '00:02'],
      ['::', null],
      ['2000', '20:00'],
      ['1430', '14:30'],
      ['0900', '09:00'],
      ['2359', '23:59'],
      ['200', '02:00'],
      ['900', '09:00'],
      ['123', '01:23'],
      ['0030', '00:30'],
      ['', '00:00'],
      ['0', '00:00'],
      ['00', '00:00'],
      ['000', '00:00'],
      ['12', '12:00'],
    ])('formatDuration(%s) should return %s', (input, expected) => {
      expect(formatDuration(input)).toBe(expected);
    });
  });

  describe('isValidTime', () => {
    test.each([
      ['12:00 AM', true],
      ['1:00 PM', true],
      ['09:30 AM', true],
      ['11:59 PM', true],
      ['00:00 AM', false], // Invalid hour
      ['13:00 PM', false], // Invalid hour
      ['12:60 PM', false], // Invalid minute
      ['12:00', false], // Missing AM/PM
      ['12:00 XM', false], // Invalid suffix
      ['12:00 am', false], // Lowercase suffix
      ['12:00 pm', false], // Lowercase suffix
      ['7:45 AM', true], // Single digit hour
      ['07:45 AM', true], // Leading zero hour
      ['7:45', false], // Missing AM/PM
      ['7:45 XM', false], // Invalid suffix
      ['7:60 AM', false], // Invalid minute
      ['24:00 PM', false], // Invalid hour
      ['12:00PM', true], // No space before AM/PM
      ['12:00 PM', true], // Space before AM/PM
    ])('should return %s for input "%s"', (input, expected) => {
      const result = isValidTime(input);
      expect(result).toBe(expected);
    });
  });

  describe('formatTime', () => {
    test.each([
      ['10:30 AM', '10:30 AM'],
      ['1:45 PM', '1:45 PM'],
      ['5', '5:00 AM'],
      ['12', '12:00 PM'],
      ['123', '1:23 AM'],
      ['1234', '12:34 PM'],
      ['0123', '1:23 AM'],
      ['0005', '12:05 AM'],
      ['abc', 'abc'],
      ['', ''],
      [' ', ' '],
      ['  ', '  '],
      ['1400', '2:00 PM'],
      ['130', '1:30 AM'],
      ['2359', '11:59 PM'],
      ['0000', '12:00 AM'],
      ['10a', '10:00 AM'],
      ['2p', '2:00 PM'],
      ['14:30', '2:30 PM'],
      ['09:15', '9:15 AM'],
      ['10a ', '10:00 AM'],
      ['2p ', '2:00 PM'],
      ['10A', '10:00 AM'],
      ['2P', '2:00 PM'],
      ['10:00am', '10:00 AM'],
      ['2:00pm', '2:00 PM'],
      ['10:00AM', '10:00 AM'],
      ['2:00PM', '2:00 PM'],
      ['10:00 am', '10:00 AM'],
      ['2:00 pm', '2:00 PM'],
      ['0', '12:00 AM'],
      ['00', '12:00 AM'],
      ['000', '12:00 AM'],
      ['1200', '12:00 PM'],
      ['13', '1:00 PM'],
      ['1300', '1:00 PM'],
      ['23', '11:00 PM'],
      ['2300', '11:00 PM'],
      ['0:0', '12:00 AM'],
      ['0:00', '12:00 AM'],
      ['00:0', '12:00 AM'],
      ['00:00', '12:00 AM'],
      ['12:0', '12:00 PM'],
      ['12:00', '12:00 PM'],
      ['13:0', '1:00 PM'],
      ['13:00', '1:00 PM'],
      ['23:0', '11:00 PM'],
      ['23:00', '11:00 PM'],
      ['1:2:3', '1:2:3'],
      ['1:2:3:4', '1:2:3:4'],
      ['1,2', '1,2'],
      ['1;2', '1;2'],
      ['25:00', '25:00'],
      ['24:01', '24:01'],
      ['12:60', '12:60'],
      ['13:60', '13:60'],
      ['99:99', '99:99'],
      ['0930', '9:30 AM'],
      ['2460', '2460'],
      ['2360', '2360'],
      ['2500', '2500'],
      ['9999', '9999'],
      ['-100', '-100'],
    ])('should format "%s" as "%s"', (input, expected) => {
      expect(formatTime(input)).toBe(expected);
    });
  });

  describe('timeStringToDayjs', () => {
    test.each([
      { value: '2:30 PM', format: 'h:mm A', expected: '14:30' },
      { value: '14:30', format: 'HH:mm', expected: '14:30' },
      { value: '02:30 PM', format: 'hh:mm A', expected: '14:30' },
      { value: '2:30', format: 'H:mm', expected: '02:30' },
    ])(
      'should parse "$value" with format "$format" correctly',
      ({ value, format, expected }) => {
        const result = timeStringToDayjs(value, format);
        expect(result.format('HH:mm')).toBe(expected);
      },
    );

    it('should use default format "h:mm A" if no format is provided', () => {
      const result = timeStringToDayjs('2:30 PM');
      expect(result.format('HH:mm')).toBe('14:30');
    });

    it('should return an invalid date for incorrect time string', () => {
      const result = timeStringToDayjs('invalid time');
      expect(result.isValid()).toBe(false);
    });

    it('should return an invalid date for incorrect format', () => {
      const result = timeStringToDayjs('2:30 PM', 'invalid format');
      expect(result.isValid()).toBe(false);
    });
  });

  describe('secondsNumberToHourMinString', () => {
    test.each([
      [0, '0h 0m'],
      [60, '0h 1m'],
      [3600, '1h 0m'],
      [3661, '1h 1m'],
      [7200, '2h 0m'],
      [7322, '2h 2m'],
      [86399, '23h 59m'],
      [86400, '24h 0m'],
      [90061, '25h 1m'],
      [undefined as any, '0h 0m'],
    ])('converts %s seconds to "%s"', (input, expected) => {
      expect(secondsNumberToHourMinString(input)).toBe(expected);
    });
  });

  describe('validateAndFormatDate', () => {
    test.each([
      [
        'valid date with hyphen separator',
        '2023-12-31',
        'YYYY-MM-DD',
        true,
        '2023-12-31',
      ],
      [
        'valid date with slash separator',
        '12/31/2023',
        'MM/DD/YYYY',
        true,
        '12/31/2023',
      ],
      [
        'valid date with dot separator',
        '31.12.2023',
        'DD.MM.YYYY',
        true,
        '31.12.2023',
      ],
      ['invalid date value', '33/11/2025', 'DD/MM/YYYY', false, '33/11/2025'],
      ['empty date string', '', 'DD/MM/YYYY', false, ''],
      [
        'date with invalid month',
        '12/16/2024',
        'DD/MM/YYYY',
        false,
        '12/16/2024',
      ],
      [
        'date with invalid day',
        '42/16/2024',
        'DD/MM/YYYY',
        false,
        '42/16/2024',
      ],
      [
        'mobile format converted to MM/DD/YYYY',
        '2023-04-15',
        'MM/DD/YYYY',
        true,
        '04/15/2023',
      ],
      [
        'mobile format converted to DD/MM/YYYY',
        '2023-04-15',
        'DD/MM/YYYY',
        true,
        '15/04/2023',
      ],
      [
        'mobile format with single digit month/day',
        '2023-4-5',
        'MM/DD/YYYY',
        true,
        '04/05/2023',
      ],
      [
        'invalid mobile date format',
        '2023-13-42',
        'MM/DD/YYYY',
        false,
        '2023-13-42',
      ],
    ])('%s', (_, input, format, isValid, formatted) => {
      const result = validateAndFormatDate(input, format);
      expect(result.isValidDate).toBe(isValid);
      expect(result.formattedDate).toBe(formatted);
    });
  });

  describe('exceedsMaxDuration', () => {
    test.each([
      ['8760:01', true],
      ['10000:00', true],
      ['8759:59', false],
      ['0:00', false],
      ['100:00', false],
      ['', false],
      ['invalid', false],
      ['12:60', false],
    ])('exceedsMaxDuration(%s) → %s', (input, expected) => {
      expect(exceedsMaxDuration(input)).toBe(expected);
    });
  });

  describe('buildDateTimeString', () => {
    test.each([
      [
        'formats date and time with proper padding',
        '2024-06-15',
        '2024-06-15 14:30:00',
        '2024-06-15 14:30:00',
      ],
      [
        'pads single-digit month with leading zero',
        '2024-01-15',
        '2024-01-15 14:30:00',
        '2024-01-15 14:30:00',
      ],
      [
        'pads single-digit date with leading zero',
        '2024-06-05',
        '2024-06-05 14:30:00',
        '2024-06-05 14:30:00',
      ],
      [
        'pads single-digit hour with leading zero',
        '2024-06-15',
        '2024-06-15 08:30:00',
        '2024-06-15 08:30:00',
      ],
      [
        'pads single-digit minute with leading zero',
        '2024-06-15',
        '2024-06-15 14:05:00',
        '2024-06-15 14:05:00',
      ],
      [
        'handles midnight time correctly',
        '2024-06-15',
        '2024-06-15 00:00:00',
        '2024-06-15 00:00:00',
      ],
      [
        'handles noon time correctly',
        '2024-06-15',
        '2024-06-15 12:00:00',
        '2024-06-15 12:00:00',
      ],
      [
        'handles end of day time correctly',
        '2024-06-15',
        '2024-06-15 23:59:00',
        '2024-06-15 23:59:00',
      ],
      [
        'handles first day of month correctly',
        '2024-06-01',
        '2024-06-01 09:15:00',
        '2024-06-01 09:15:00',
      ],
      [
        'handles last day of month correctly',
        '2024-06-30',
        '2024-06-30 17:45:00',
        '2024-06-30 17:45:00',
      ],
      [
        'handles leap year date correctly',
        '2024-02-29',
        '2024-02-29 10:20:00',
        '2024-02-29 10:20:00',
      ],
      [
        'handles December correctly',
        '2024-12-25',
        '2024-12-25 16:00:00',
        '2024-12-25 16:00:00',
      ],
      [
        'always appends :00 for seconds',
        '2024-06-15',
        '2024-06-15 14:30:45',
        '2024-06-15 14:30:00',
      ],
    ])('%s', (_, dateStr, timeStr, expected) => {
      const datePart = dayjs(dateStr);
      const timePart = dayjs(timeStr);
      const result = buildDateTimeString(datePart, timePart);
      expect(result).toBe(expected);
    });
  });

  describe(`mapQBTimezoneToDayjsTimezone`, () => {
    test.each([
      ['(UTC-08:00) Pacific Time (US & Canada)', 'America/Los_Angeles'],
      ['(UTC-10:00) Hawaii', 'Pacific/Honolulu'],
      ['(UTC-03:00) Brasilia', 'America/Sao_Paulo'],
      ['(UTC+08:00) Perth', 'Australia/Perth'],
      ['Unknown Timezone', 'Unknown Timezone'],
      ['' as any, 'America/Los_Angeles'],
      [undefined as any, 'America/Los_Angeles'],
      [null as any, 'America/Los_Angeles'],
    ])('normalizes qbTimezone %s to %s', (qbTimezone, dayjsTimezone) => {
      const result = mapQBTimezoneToDayjsTimezone(qbTimezone);
      expect(result).toBe(dayjsTimezone);
    });
  });

  describe('combineTimeAndDayjs', () => {
    it('should combine date and time correctly in the given timezone', () => {
      // 2024-06-01, 15:45, America/New_York
      const datePart = dayjs.tz('2024-06-01', 'YYYY-MM-DD', 'America/New_York');
      const timePart = dayjs.tz('15:45', 'HH:mm', 'America/New_York');
      const timezone = 'America/New_York';
      const result = combineTimeAndDayjs(datePart, timePart, timezone);
      // Should be 2024-06-01T15:45:00-04:00 (EDT)
      expect(result).toMatch(/^2024-06-01T15:45:00-04:00$/);
    });
  });

  describe('combineTimeAndDayjsForTimeEntries', () => {
    it('should combine date and time correctly in the given timezone for time entries', () => {
      // 2024-06-01, 08:15, America/Los_Angeles
      const datePart = dayjs.tz(
        '2024-06-01',
        'YYYY-MM-DD',
        'America/Los_Angeles',
      );
      const timePart = dayjs.tz('08:15', 'HH:mm', 'America/Los_Angeles');
      const timezone = 'America/Los_Angeles';
      const result = combineTimeAndDayjsForTimeEntries(
        datePart,
        timePart,
        timezone,
      );
      // Should be 2024-06-01T08:15:00-07:00 (PDT)
      expect(result).toMatch(/^2024-06-01T08:15:00-07:00$/);
    });
  });

  describe('stringToDayJS', () => {
    it('should parse a valid date string with the given format', () => {
      const result = stringToDayJS('2024-06-01', 'YYYY-MM-DD');
      expect(result.isValid()).toBe(true);
      expect(result.format('YYYY-MM-DD')).toBe('2024-06-01');
    });
    it('should return invalid for a mismatched format', () => {
      const result = stringToDayJS('06/01/2024', 'YYYY-MM-DD');
      expect(result.isValid()).toBe(false);
    });
  });

  describe('getBrowserTimezone', () => {
    let originalDateTimeFormat: typeof Intl.DateTimeFormat;

    beforeEach(() => {
      // Save the original Intl.DateTimeFormat before each test
      originalDateTimeFormat = Intl.DateTimeFormat;
    });

    afterEach(() => {
      // Restore the original Intl.DateTimeFormat after each test
      Intl.DateTimeFormat = originalDateTimeFormat;
    });

    it('should return a non-empty string for the browser timezone', () => {
      // Mock
      Intl.DateTimeFormat = jest.fn(() => ({
        resolvedOptions: () => ({ timeZone: 'America/New_York' }),
      })) as any;
      expect(getBrowserTimezone()).toBe('America/New_York');
    });

    it('should return UTC if detection fails', () => {
      // Mock to throw
      Intl.DateTimeFormat = jest.fn(() => {
        throw new Error('fail');
      }) as any;
      expect(getBrowserTimezone()).toBe('UTC');
    });
  });

  describe('applyTimezoneToDayjs', () => {
    test.each([
      {
        description: 'applies timezone to a valid dayjs object',
        date: dayjs('2023-12-25 10:00:00'),
        timezone: 'America/New_York',
        checkOriginal: false,
      },
      {
        description: 'handles null dayjs object with fallback to current time',
        date: null,
        timezone: 'America/New_York',
        checkOriginal: false,
      },
      {
        description: 'handles undefined dayjs object with fallback',
        date: undefined,
        timezone: 'America/New_York',
        checkOriginal: false,
      },
      {
        description: 'handles null timezone by returning original',
        date: dayjs('2023-12-25 10:00:00'),
        timezone: null,
        checkOriginal: true,
      },
      {
        description: 'handles undefined timezone by returning original',
        date: dayjs('2023-12-25 10:00:00'),
        timezone: undefined,
        checkOriginal: true,
      },
      {
        description: 'handles both null dayjs and null timezone',
        date: null,
        timezone: null,
        checkOriginal: false,
      },
      {
        description: 'converts QB timezone format to dayjs timezone',
        date: dayjs('2023-12-25 10:00:00'),
        timezone: '(UTC-08:00) Pacific Time (US & Canada)',
        checkOriginal: false,
      },
    ])('$description', ({ date, timezone, checkOriginal }) => {
      const result = applyTimezoneToDayjs(date as any, timezone as any);
      expect(result).toBeDefined();
      expect(dayjs.isDayjs(result)).toBe(true);
      if (checkOriginal) {
        expect(result.format()).toBe((date as any).format());
      } else if (date !== null && date !== undefined) {
        expect(result.isValid()).toBe(true);
      }
    });
  });

  describe('combineDateAndTimeAndConvertToTimezone', () => {
    test.each([
      [
        'combines date and time and converts to timezone',
        dayjs('2023-12-25'),
        dayjs('2023-12-25 14:30:00'),
        'America/New_York',
        false,
      ],
      [
        'handles null date with fallback to current date',
        null,
        dayjs('2023-12-25 14:30:00'),
        'America/New_York',
        false,
      ],
      [
        'handles null time with fallback to current time',
        dayjs('2023-12-25'),
        null,
        'America/New_York',
        false,
      ],
      [
        'handles null timezone',
        dayjs('2023-12-25'),
        dayjs('2023-12-25 14:30:00'),
        null,
        false,
      ],
      [
        'handles undefined timezone',
        dayjs('2023-12-25'),
        dayjs('2023-12-25 14:30:00'),
        undefined,
        false,
      ],
      [
        'handles timezone conversion crossing date boundaries',
        dayjs('2023-12-25'),
        dayjs('2023-12-25 02:00:00'),
        'America/Los_Angeles',
        false,
      ],
      [
        'returns date as start of day and time as full datetime',
        dayjs('2023-12-25'),
        dayjs('2023-12-25 14:30:45'),
        'America/New_York',
        true,
      ],
      [
        'handles QB timezone format',
        dayjs('2023-12-25'),
        dayjs('2023-12-25 14:30:00'),
        '(UTC-08:00) Pacific Time (US & Canada)',
        false,
      ],
      ['handles all null/undefined inputs', null, null, null, false],
    ] as const)('%s', (_, date, time, timezone, checkStartOfDay) => {
      const result = combineDateAndTimeAndConvertToTimezone(
        date,
        time,
        timezone,
      );
      expect(result.date).toBeDefined();
      expect(result.time).toBeDefined();
      expect(dayjs.isDayjs(result.date)).toBe(true);
      expect(dayjs.isDayjs(result.time)).toBe(true);
      expect(result.date.isValid()).toBe(true);
      expect(result.time.isValid()).toBe(true);
      if (checkStartOfDay) {
        expect(result.date.format('HH:mm:ss')).toBe('00:00:00');
      }
    });
  });

  describe('findNearestTimeOptionIndex', () => {
    test.each([
      ['2:30 PM with 15-min intervals', '2023-12-25 14:30:00', 15, 58],
      [
        '2:20 PM with 15-min intervals (rounds to 2:15)',
        '2023-12-25 14:20:00',
        15,
        57,
      ],
      [
        '2:25 PM with 15-min intervals (rounds to 2:30)',
        '2023-12-25 14:25:00',
        15,
        58,
      ],
      ['midnight', '2023-12-25 00:00:00', 15, 0],
      ['11:45 PM', '2023-12-25 23:45:00', 15, 95],
      ['2:20 PM with 30-min intervals', '2023-12-25 14:20:00', 30, 29],
      ['2:22 PM with 5-min intervals', '2023-12-25 14:22:00', 5, 172],
      [
        'default interval (no factor provided)',
        '2023-12-25 14:30:00',
        undefined,
        58,
      ],
    ])('%s', (_, timeStr, interval, expected) => {
      const time = dayjs(timeStr);
      const result =
        interval !== undefined
          ? findNearestTimeOptionIndex(time, interval)
          : findNearestTimeOptionIndex(time);
      expect(result).toBe(expected);
    });

    it('should return 0 for null, undefined, or invalid input', () => {
      expect(findNearestTimeOptionIndex(null, 15)).toBe(0);
      expect(findNearestTimeOptionIndex(undefined, 15)).toBe(0);
      expect(findNearestTimeOptionIndex(dayjs('invalid-date'), 15)).toBe(0);
    });
  });

  describe('createDateTimeFromParts', () => {
    test.each([
      {
        description: 'combines local date and local time',
        date: () => dayjs('2025-10-20'),
        time: () => dayjs('12:30 PM', 'h:mm A'),
        expected: {
          year: 2025,
          month: 9,
          day: 20,
          hour: 12,
          minute: 30,
          second: 0,
          ms: 0,
        },
      },
      {
        description: 'extracts components from UTC date and local time',
        date: () => dayjs.utc('2025-10-20T00:00:00Z'),
        time: () => dayjs('6:00 PM', 'h:mm A'),
        expected: { year: 2025, month: 9, day: 20, hour: 18, minute: 0 },
      },
      {
        description: 'handles UTC time and local date',
        date: () => dayjs('2025-10-20'),
        time: () => dayjs.utc('2025-11-07T00:00:00Z'),
        expected: { year: 2025, month: 9, day: 20, hour: 0, minute: 0 },
      },
      {
        description: 'handles timezoned date (IST) and local time',
        date: () => dayjs.tz('2025-10-20', 'Asia/Kolkata'),
        time: () => dayjs('12:30 PM', 'h:mm A'),
        expected: { year: 2025, month: 9, day: 20, hour: 12, minute: 30 },
      },
      {
        description: 'handles mixed timezones',
        date: () => dayjs.utc('2025-10-20T00:00:00Z'),
        time: () => dayjs.tz('2025-11-07 14:45:00', 'Asia/Kolkata'),
        expected: { year: 2025, month: 9, day: 20, hour: 14, minute: 45 },
      },
      {
        description: 'handles midnight (12:00 AM)',
        date: () => dayjs('2025-10-20'),
        time: () => dayjs('12:00 AM', 'h:mm A'),
        expected: { hour: 0, minute: 0 },
      },
      {
        description: 'handles end of day (11:59 PM)',
        date: () => dayjs('2025-10-20'),
        time: () => dayjs('11:59 PM', 'h:mm A'),
        expected: { hour: 23, minute: 59 },
      },
      {
        description: 'resets seconds and milliseconds to 0',
        date: () => dayjs('2025-10-20T10:25:45.678'),
        time: () => dayjs('2025-11-07T14:30:55.999'),
        expected: { hour: 14, minute: 30, second: 0, ms: 0 },
      },
      {
        description: 'preserves date when combining with different time',
        date: () => dayjs('2025-03-15'),
        time: () => dayjs('2025-11-07 18:00:00'),
        expected: { year: 2025, month: 2, day: 15, hour: 18 },
      },
      {
        description: 'handles leap year dates',
        date: () => dayjs('2024-02-29'),
        time: () => dayjs('10:30 AM', 'h:mm A'),
        expected: { year: 2024, month: 1, day: 29, hour: 10, minute: 30 },
      },
      {
        description: 'handles DST transition dates',
        date: () => dayjs('2025-03-09'),
        time: () => dayjs('4:30 AM', 'h:mm A'),
        expected: { year: 2025, month: 2, day: 9, hour: 4, minute: 30 },
      },
    ])('$description', ({ date, time, expected }) => {
      const result = createDateTimeFromParts(date(), time());
      if (expected.year !== undefined)
        expect(result.year()).toBe(expected.year);
      if (expected.month !== undefined)
        expect(result.month()).toBe(expected.month);
      if (expected.day !== undefined) expect(result.date()).toBe(expected.day);
      if (expected.hour !== undefined)
        expect(result.hour()).toBe(expected.hour);
      if (expected.minute !== undefined)
        expect(result.minute()).toBe(expected.minute);
      if (expected.second !== undefined)
        expect(result.second()).toBe(expected.second);
      if (expected.ms !== undefined)
        expect(result.millisecond()).toBe(expected.ms);
    });

    it('should always return local timezone Dayjs object', () => {
      const result = createDateTimeFromParts(
        dayjs.utc('2025-10-20T00:00:00Z'),
        dayjs.utc('2025-11-07T18:00:00Z'),
      );
      const resultInternal = result as any;
      expect(result.isUTC?.()).toBeFalsy();
      expect(resultInternal.$x?.$timezone).toBeUndefined();
    });

    it('should order 12:00 AM before 12:30 AM on the same day', () => {
      const date = dayjs('2025-10-20');
      const start = createDateTimeFromParts(date, dayjs('12:30 AM', 'h:mm A'));
      const end = createDateTimeFromParts(date, dayjs('12:00 AM', 'h:mm A'));
      expect(end.isBefore(start)).toBe(true);
    });

    it('should create consistent results for validation comparison', () => {
      const startDate = dayjs.utc('2025-10-20T00:00:00Z');
      const finalStartTime = createDateTimeFromParts(
        startDate,
        dayjs('12:30 AM', 'h:mm A'),
      );
      const finalEndTime = createDateTimeFromParts(
        startDate,
        dayjs('6:00 PM', 'h:mm A'),
      );
      expect(finalEndTime.isAfter(finalStartTime)).toBe(true);
      expect(finalEndTime.isBefore(finalStartTime)).toBe(false);
    });
  });
});
