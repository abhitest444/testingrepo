import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  calculateElapsedTime,
  FUTURE_TIME,
} from 'src/js/widgets/timeClock/utils/timerUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

describe('timerUtils', () => {
  describe('calculateElapsedTime', () => {
    const companyTimezone = 'UTC';

    beforeEach(() => {
      // Mock the current time to ensure consistent test results
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate elapsed time correctly for positive time difference', () => {
      // Set current time to 2024-03-20 10:00:00 UTC
      const mockDate = new Date('2024-03-20T10:00:00Z');
      jest.setSystemTime(mockDate);

      // Start time 1 hour, 30 minutes, and 15 seconds ago
      const startTime = '2024-03-20T08:29:45Z';

      const result = calculateElapsedTime(startTime, companyTimezone);
      expect(result).toBe('01:30:15');
    });

    it('should calculate elapsed time correctly for negative time difference', () => {
      // Set current time to 2024-03-20 10:00:00 UTC
      const mockDate = new Date('2024-03-20T10:00:00Z');
      jest.setSystemTime(mockDate);

      // Start time 5 minutes in the future
      const startTime = '2024-03-20T10:05:00Z';

      const result = calculateElapsedTime(startTime, companyTimezone);
      expect(result).toBe('-00:05:00');
    });

    it('should handle timezone differences correctly', () => {
      // Set current time to 2024-03-20 10:00:00 UTC
      const mockDate = new Date('2024-03-20T10:00:00Z');
      jest.setSystemTime(mockDate);

      // Start time 1 hour ago in UTC
      const startTime = '2024-03-20T09:00:00Z';

      // Test with different timezone (America/New_York is UTC-4 during DST)
      const result = calculateElapsedTime(startTime, 'America/New_York');
      expect(result).toBe('01:00:00');
    });

    it('should handle edge case with zero time difference', () => {
      // Set current time to 2024-03-20 10:00:00 UTC
      const mockDate = new Date('2024-03-20T10:00:00Z');
      jest.setSystemTime(mockDate);

      // Start time is exactly the same as current time
      const startTime = '2024-03-20T10:00:00Z';

      const result = calculateElapsedTime(startTime, companyTimezone);
      expect(result).toBe('00:00:00');
    });

    it('should handle large time differences', () => {
      // Set current time to 2024-03-20 10:00:00 UTC
      const mockDate = new Date('2024-03-20T10:00:00Z');
      jest.setSystemTime(mockDate);

      // Start time 25 hours ago
      const startTime = '2024-03-19T09:00:00Z';

      const result = calculateElapsedTime(startTime, companyTimezone);
      expect(result).toBe('25:00:00');
    });
  });
});
