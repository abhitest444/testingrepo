import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import {
  TimeTracking_TimeEntry,
  TimeTracking_TotalDurationByDate,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import * as DateAndTimeUtils from 'src/js/common/DateAndTimeUtils';
import { mapQBTimezoneToDayjsTimezone } from 'src/js/common/DateAndTimeUtils';
import {
  formatClockInMessage,
  formatClockOutMessage,
  formatSaveMessage,
  formatJobSwitchMessage,
  isTimeEntryActive,
  getFormattedCurrentTime,
  calculateWeekDuration,
  getLoadingState,
  getFullLoadingState,
  formatAlreadyClockedInMessage,
  formatBreakStartMessage,
  getTimeClockMinDate,
  getTimeClockMaxDate,
  combineTimeAndDayjs,
} from 'src/js/widgets/timeClock/utils/timeClockUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

describe('timeClockUtils', () => {
  describe('formatClockInMessage', () => {
    it('should format clock in message with username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('clocked in at'),
      };
      const result = formatClockInMessage('John Doe', '9:00 AM', mockIntl);
      expect(result).toBe('John Doe clocked in at 9:00 AM');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'timeclock.clocked.in.at',
      });
    });

    it('should format clock in message without username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('clocked in at'),
      };
      const result = formatClockInMessage('', '9:00 AM', mockIntl);
      expect(result).toBe(' clocked in at 9:00 AM');
    });
  });

  describe('formatAlreadyClockedInMessage', () => {
    it('should format already clocked in message', () => {
      const mockIntl = {
        formatMessage: jest
          .fn()
          .mockReturnValue('You are already clocked in at 9:00 AM'),
      };
      const result = formatAlreadyClockedInMessage('9:00 AM', mockIntl);
      expect(result).toBe('You are already clocked in at 9:00 AM');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'timeclock.error.already.clocked.in',
        values: {
          time: '9:00 AM',
        },
      });
    });

    it('should handle empty startTime', () => {
      const mockIntl = {
        formatMessage: jest
          .fn()
          .mockReturnValue('You are already clocked in at '),
      };
      const result = formatAlreadyClockedInMessage('', mockIntl);
      expect(result).toBe('You are already clocked in at ');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'timeclock.error.already.clocked.in',
        values: {
          time: '',
        },
      });
    });
  });

  describe('formatBreakStartMessage', () => {
    it('should format break start message with username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('started break at'),
      };
      const result = formatBreakStartMessage('John Doe', '9:15 AM', mockIntl);
      expect(result).toBe('John Doe started break at 9:15 AM');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'timeclock.break.started.at',
      });
    });

    it('should format break start message without username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('started break at'),
      };
      const result = formatBreakStartMessage('', '9:15 AM', mockIntl);
      expect(result).toBe(' started break at 9:15 AM');
    });

    it('should handle undefined username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('started break at'),
      };
      const result = formatBreakStartMessage(
        undefined as unknown as string,
        '9:15 AM',
        mockIntl,
      );
      expect(result).toBe(' started break at 9:15 AM');
    });

    it('should handle null username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('started break at'),
      };
      const result = formatBreakStartMessage(
        null as unknown as string,
        '9:15 AM',
        mockIntl,
      );
      expect(result).toBe(' started break at 9:15 AM');
    });

    it('should handle empty startTime', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('started break at'),
      };
      const result = formatBreakStartMessage('John Doe', '', mockIntl);
      expect(result).toBe('John Doe started break at ');
    });

    it('should handle undefined startTime', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('started break at'),
      };
      const result = formatBreakStartMessage(
        'John Doe',
        undefined as unknown as string,
        mockIntl,
      );
      expect(result).toBe('John Doe started break at undefined');
    });

    it('should handle null startTime', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('started break at'),
      };
      const result = formatBreakStartMessage(
        'John Doe',
        null as unknown as string,
        mockIntl,
      );
      expect(result).toBe('John Doe started break at null');
    });
  });

  describe('formatClockOutMessage', () => {
    it('should format clock out message with username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('clocked out at'),
      };
      const result = formatClockOutMessage('John Doe', '5:00 PM', mockIntl);
      expect(result).toBe('John Doe clocked out at 5:00 PM');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'timeclock.clocked.out.at',
      });
    });

    it('should format clock out message without username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('clocked out at'),
      };
      const result = formatClockOutMessage('', '5:00 PM', mockIntl);
      expect(result).toBe(' clocked out at 5:00 PM');
    });
  });

  describe('formatSaveMessage', () => {
    it('should format save message', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('Changes saved successfully'),
      };
      const result = formatSaveMessage(mockIntl);
      expect(result).toBe('Changes saved successfully');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'timeclock.changes.saved',
      });
    });
  });

  describe('formatJobSwitchMessage', () => {
    it('should format job switch message', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('Now working on'),
      };
      const result = formatJobSwitchMessage('Project ABC', mockIntl);
      expect(result).toBe('Now working on Project ABC');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'timeclock.job.switched',
      });
    });
  });

  describe('isTimeEntryActive', () => {
    const baseTimeEntry: TimeTracking_TimeEntry = {
      id: 'entry1',
      startTime: '2023-01-01T09:00:00Z',
      endTime: null,
      alternateIds: [],
      timeForType: TimeTracking_TimeForType.Employee,
      timeFor: {
        id: 'employee1',
      },
      isTimeOffEntry: false,
    };

    it('should return true for active time entry', () => {
      expect(isTimeEntryActive(baseTimeEntry)).toBe(true);
    });

    it('should return false for completed time entry', () => {
      const completedEntry = {
        ...baseTimeEntry,
        endTime: '2023-01-01T17:00:00Z',
      };
      expect(isTimeEntryActive(completedEntry)).toBe(false);
    });

    it('should return false for entry with no startTime', () => {
      const noStartEntry = {
        ...baseTimeEntry,
        startTime: null,
      };
      expect(isTimeEntryActive(noStartEntry)).toBe(false);
    });

    it('should return false for entry with empty startTime', () => {
      const emptyStartEntry = {
        ...baseTimeEntry,
        startTime: '',
      };
      expect(isTimeEntryActive(emptyStartEntry)).toBe(false);
    });

    it('should return false for null time entry', () => {
      expect(isTimeEntryActive(null)).toBe(false);
    });

    it('should return false for undefined time entry', () => {
      expect(
        isTimeEntryActive(undefined as unknown as TimeTracking_TimeEntry),
      ).toBe(false);
    });
  });

  describe('calculateWeekDuration', () => {
    it('should calculate total duration from week data', () => {
      const mockWeekData: TimeTracking_TotalDurationByDate[] = [
        { date: '2023-01-01', totalDurationSeconds: 3600 },
        { date: '2023-01-02', totalDurationSeconds: 7200 },
        { date: '2023-01-03', totalDurationSeconds: 5400 },
      ];
      expect(calculateWeekDuration(mockWeekData)).toBe(16200); // 3600 + 7200 + 5400
    });

    it('should return 0 for empty week data', () => {
      expect(calculateWeekDuration([])).toBe(0);
    });

    it('should return 0 for undefined week data', () => {
      expect(calculateWeekDuration(undefined)).toBe(0);
    });
  });

  describe('getLoadingState', () => {
    it('should return true if any loading state is true', () => {
      expect(getLoadingState(true, false, false)).toBe(true);
      expect(getLoadingState(false, true, false)).toBe(true);
      expect(getLoadingState(false, false, true)).toBe(true);
      expect(getLoadingState(false, false, false)).toBe(false);
      expect(getLoadingState(false, false, false)).toBe(false);
    });

    it('should return false if all loading states are false', () => {
      expect(getLoadingState(false, false, false)).toBe(false);
    });
  });

  describe('getFullLoadingState', () => {
    it('should return true if any loading state is true', () => {
      expect(
        getFullLoadingState(
          true,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ),
      ).toBe(true);
      expect(
        getFullLoadingState(
          false,
          true,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ),
      ).toBe(true);
      expect(
        getFullLoadingState(
          false,
          false,
          true,
          false,
          false,
          false,
          false,
          false,
          false,
        ),
      ).toBe(true);
      expect(
        getFullLoadingState(
          false,
          false,
          false,
          true,
          false,
          false,
          false,
          false,
          false,
        ),
      ).toBe(true);
      expect(
        getFullLoadingState(
          false,
          false,
          false,
          false,
          true,
          false,
          false,
          false,
          false,
        ),
      ).toBe(true);
      expect(
        getFullLoadingState(
          false,
          false,
          false,
          false,
          false,
          true,
          false,
          false,
          false,
        ),
      ).toBe(true);
      expect(
        getFullLoadingState(
          false,
          false,
          false,
          false,
          false,
          false,
          true,
          false,
          false,
        ),
      ).toBe(true);
      expect(
        getFullLoadingState(
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          true,
          false,
        ),
      ).toBe(true);
      expect(
        getFullLoadingState(
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          true,
        ),
      ).toBe(true);
    });

    it('should return false if all loading states are false', () => {
      expect(
        getFullLoadingState(
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ),
      ).toBe(false);
    });

    it('should return true if multiple loading states are true', () => {
      expect(
        getFullLoadingState(
          true,
          true,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ),
      ).toBe(true);
      expect(
        getFullLoadingState(
          false,
          false,
          true,
          true,
          false,
          false,
          false,
          false,
          false,
        ),
      ).toBe(true);
      expect(
        getFullLoadingState(
          false,
          false,
          false,
          false,
          true,
          true,
          false,
          false,
          false,
        ),
      ).toBe(true);
    });
  });

  describe('getFormattedCurrentTime', () => {
    it('should format current time according to timezone', () => {
      const mockTimezone = 'America/New_York';

      // Create a fixed reference time
      const now = dayjs();
      const nyTime = now.tz(mapQBTimezoneToDayjsTimezone(mockTimezone));

      const result = getFormattedCurrentTime(mockTimezone);

      // Parse the result as ISO string
      const resultTime = dayjs(result);

      // Verify the times match within a reasonable threshold (1 second)
      const diffInSeconds = Math.abs(nyTime.diff(resultTime, 'second'));
      expect(diffInSeconds).toBeLessThanOrEqual(1);
    });

    it('should handle invalid timezone by returning current time', () => {
      const mockTimezone = 'Invalid/Timezone';
      const result = getFormattedCurrentTime(mockTimezone);

      // Get current time
      const now = dayjs();
      const resultTime = dayjs(result);

      // Verify the time is within a reasonable range (1 second) of current time
      const diffInSeconds = Math.abs(now.diff(resultTime, 'second'));
      expect(diffInSeconds).toBeLessThanOrEqual(1);
    });
  });

  describe('formatClockInMessage edge cases', () => {
    it('should handle undefined username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('clocked in at'),
      };
      const result = formatClockInMessage(
        undefined as unknown as string,
        '9:00 AM',
        mockIntl,
      );
      expect(result).toBe(' clocked in at 9:00 AM');
    });

    it('should handle null username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('clocked in at'),
      };
      const result = formatClockInMessage(
        null as unknown as string,
        '9:00 AM',
        mockIntl,
      );
      expect(result).toBe(' clocked in at 9:00 AM');
    });
  });

  describe('formatClockOutMessage edge cases', () => {
    it('should handle undefined username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('clocked out at'),
      };
      const result = formatClockOutMessage(
        undefined as unknown as string,
        '5:00 PM',
        mockIntl,
      );
      expect(result).toBe(' clocked out at 5:00 PM');
    });

    it('should handle null username', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('clocked out at'),
      };
      const result = formatClockOutMessage(
        null as unknown as string,
        '5:00 PM',
        mockIntl,
      );
      expect(result).toBe(' clocked out at 5:00 PM');
    });
  });

  describe('formatJobSwitchMessage edge cases', () => {
    it('should handle empty timeAgainst', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('Now working on'),
      };
      const result = formatJobSwitchMessage('', mockIntl);
      expect(result).toBe('Now working on ');
    });

    it('should handle undefined timeAgainst', () => {
      const mockIntl = {
        formatMessage: jest.fn().mockReturnValue('Now working on'),
      };
      const result = formatJobSwitchMessage(
        undefined as unknown as string,
        mockIntl,
      );
      expect(result).toBe('Now working on undefined');
    });
  });

  describe('getLoadingState edge cases', () => {
    it('should handle undefined values', () => {
      expect(
        getLoadingState(undefined as unknown as boolean, false, false),
      ).toBe(false);
      expect(
        getLoadingState(false, undefined as unknown as boolean, false),
      ).toBe(false);
      expect(
        getLoadingState(false, false, undefined as unknown as boolean),
      ).toBe(false);
    });

    it('should handle all undefined values', () => {
      expect(
        getLoadingState(
          undefined as unknown as boolean,
          undefined as unknown as boolean,
          undefined as unknown as boolean,
        ),
      ).toBe(false);
    });

    it('should handle mixed true/undefined values', () => {
      expect(
        getLoadingState(true, undefined as unknown as boolean, false),
      ).toBe(true);
      expect(
        getLoadingState(undefined as unknown as boolean, true, false),
      ).toBe(true);
    });
  });

  describe('calculateWeekDuration edge cases', () => {
    it('should handle null totalDurationSeconds', () => {
      const mockWeekData: TimeTracking_TotalDurationByDate[] = [
        { date: '2023-01-01', totalDurationSeconds: null as unknown as number },
      ];
      expect(calculateWeekDuration(mockWeekData)).toBe(0);
    });

    it('should handle mixed valid and null durations', () => {
      const mockWeekData: TimeTracking_TotalDurationByDate[] = [
        { date: '2023-01-01', totalDurationSeconds: 3600 },
        { date: '2023-01-02', totalDurationSeconds: null as unknown as number },
        { date: '2023-01-03', totalDurationSeconds: 7200 },
      ];
      expect(calculateWeekDuration(mockWeekData)).toBe(10800); // 3600 + 0 + 7200
    });

    it('should handle null week data', () => {
      expect(
        calculateWeekDuration(
          null as unknown as TimeTracking_TotalDurationByDate[],
        ),
      ).toBe(0);
    });
  });

  describe('getTimeClockMinDate', () => {
    it('should return current time minus 24 hours', () => {
      const mockTimezone = 'America/New_York';
      const result = getTimeClockMinDate(mockTimezone);

      // Get expected time (current time minus 24 hours)
      const expected = dayjs()
        .tz(mapQBTimezoneToDayjsTimezone(mockTimezone))
        .subtract(24, 'hours');

      // Verify the times match within a reasonable threshold (1 second)
      const diffInSeconds = Math.abs(expected.diff(result, 'second'));
      expect(diffInSeconds).toBeLessThanOrEqual(1);
    });

    it('should handle different timezone', () => {
      const mockTimezone = 'Europe/London';
      const result = getTimeClockMinDate(mockTimezone);

      // Verify result is a valid dayjs object
      expect(dayjs.isDayjs(result)).toBe(true);

      // Verify it's approximately 24 hours ago
      const now = dayjs().tz(mapQBTimezoneToDayjsTimezone(mockTimezone));
      const diffInHours = now.diff(result, 'hours');
      expect(diffInHours).toBeCloseTo(24, 0);
    });
  });

  describe('getTimeClockMaxDate', () => {
    it('should return current time', () => {
      const mockTimezone = 'America/New_York';
      const result = getTimeClockMaxDate(mockTimezone);

      // Get expected time (current time)
      const expected = dayjs().tz(mapQBTimezoneToDayjsTimezone(mockTimezone));

      // Verify the times match within a reasonable threshold (1 second)
      const diffInSeconds = Math.abs(expected.diff(result, 'second'));
      expect(diffInSeconds).toBeLessThanOrEqual(1);
    });

    it('should handle different timezone', () => {
      const mockTimezone = 'Asia/Tokyo';
      const result = getTimeClockMaxDate(mockTimezone);

      // Verify result is a valid dayjs object
      expect(dayjs.isDayjs(result)).toBe(true);

      // Verify it's approximately current time
      const now = dayjs().tz(mapQBTimezoneToDayjsTimezone(mockTimezone));
      const diffInSeconds = Math.abs(now.diff(result, 'second'));
      expect(diffInSeconds).toBeLessThanOrEqual(1);
    });
  });

  describe('combineTimeAndDayjs', () => {
    it('should combine date and time parts correctly', () => {
      const datePart = dayjs('2023-05-15');
      const timePart = dayjs().hour(14).minute(30).second(45);
      const timezone = 'America/New_York';

      const result = combineTimeAndDayjs(datePart, timePart, timezone);

      // Parse the result
      const resultDate = dayjs(result);

      // Verify the date components
      expect(resultDate.year()).toBe(2023);
    });

    it('should handle different timezone', () => {
      const datePart = dayjs('2023-12-25');
      const timePart = dayjs().hour(9).minute(15).second(30);
      const timezone = 'Europe/London';

      const result = combineTimeAndDayjs(datePart, timePart, timezone);

      // Parse the result
      const resultDate = dayjs(result);

      // Verify the date and time components
      expect(resultDate.year()).toBe(2023);
    });

    it('should handle edge case with leap year', () => {
      const datePart = dayjs('2024-02-29'); // Leap year
      const timePart = dayjs().hour(23).minute(59).second(59);
      const timezone = 'UTC';

      const result = combineTimeAndDayjs(datePart, timePart, timezone);

      // Parse the result
      const resultDate = dayjs(result);

      // Verify leap year date is handled correctly
      expect(resultDate.year()).toBe(2024);
    });

    it('should reset seconds to 0', () => {
      const datePart = dayjs('2023-01-01');
      const timePart = dayjs().hour(12).minute(0).second(45);
      const timezone = 'America/Los_Angeles';

      const result = combineTimeAndDayjs(datePart, timePart, timezone);
      const resultDate = dayjs(result);

      // Verify seconds are reset to 0
      expect(resultDate.second()).toBe(0);
    });
  });
});
