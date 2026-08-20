import {
  formatDuration,
  getActiveEntryDuration,
  getDateRangeFilter,
} from 'src/js/widgets/whosworking/utils/utils';

import { getInitials } from 'src/js/common/MiscUtils';

describe('whosworking utils', () => {
  describe('formatDuration', () => {
    it('returns "0m" for null', () => {
      expect(formatDuration(null)).toBe('0m');
    });

    it('returns "0m" for zero seconds', () => {
      expect(formatDuration(0)).toBe('0m');
    });

    it('returns minutes only for less than an hour', () => {
      expect(formatDuration(1800)).toBe('30m');
    });

    it('returns hours and 0m for exact hours', () => {
      expect(formatDuration(3600)).toBe('1h 0m');
    });

    it('returns hours and minutes for mixed duration', () => {
      expect(formatDuration(5400)).toBe('1h 30m');
    });

    it('handles large durations', () => {
      expect(formatDuration(36000)).toBe('10h 0m');
    });

    it('rounds down to nearest minute', () => {
      expect(formatDuration(65)).toBe('1m');
    });
  });

  describe('getActiveEntryDuration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calculates duration from start time to now', () => {
      const now = new Date('2024-01-01T10:00:00Z');
      jest.setSystemTime(now);

      const startTime = '2024-01-01T09:00:00Z';
      expect(getActiveEntryDuration(startTime)).toBe('1h 0m');
    });

    it('handles minutes correctly', () => {
      const now = new Date('2024-01-01T10:30:00Z');
      jest.setSystemTime(now);

      const startTime = '2024-01-01T10:00:00Z';
      expect(getActiveEntryDuration(startTime)).toBe('30m');
    });

    it('returns 0m for future start time (prevents negative duration)', () => {
      const now = new Date('2024-01-01T09:00:00Z');
      jest.setSystemTime(now);

      const startTime = '2024-01-01T10:00:00Z'; // Start time is in the future
      expect(getActiveEntryDuration(startTime)).toBe('0m');
    });

    it('handles same start time and now', () => {
      const now = new Date('2024-01-01T10:00:00Z');
      jest.setSystemTime(now);

      const startTime = '2024-01-01T10:00:00Z';
      expect(getActiveEntryDuration(startTime)).toBe('0m');
    });
  });

  describe('getDateRangeFilter', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns current UTC date for both begin and end', () => {
      const now = new Date('2024-06-15T14:30:00Z');
      jest.setSystemTime(now);

      const result = getDateRangeFilter();

      expect(result.beginDate).toBe('2024-06-15');
      expect(result.endDate).toBe('2024-06-15');
    });

    it('uses UTC date regardless of local timezone', () => {
      // Set to a time that might be different day in some timezones
      const now = new Date('2024-06-15T23:30:00Z');
      jest.setSystemTime(now);

      const result = getDateRangeFilter();

      expect(result.beginDate).toBe('2024-06-15');
      expect(result.endDate).toBe('2024-06-15');
    });
  });

  describe('getInitials', () => {
    it('returns first and last initials for two-word name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('returns first and last initials for multi-word name', () => {
      expect(getInitials('John William Doe')).toBe('JD');
    });

    it('returns first two characters for single-word name', () => {
      expect(getInitials('John')).toBe('JO');
    });

    it('converts initials to uppercase', () => {
      expect(getInitials('john doe')).toBe('JD');
    });

    it('handles name with leading/trailing spaces', () => {
      expect(getInitials('  John Doe  ')).toBe('JD');
    });

    it('handles single character name', () => {
      expect(getInitials('J')).toBe('J');
    });

    it('handles special characters in name', () => {
      expect(getInitials("O'Brien Smith")).toBe('OS');
    });

    it('handles hyphenated last name', () => {
      expect(getInitials('John Smith-Jones')).toBe('JS');
    });

    it('handles empty string', () => {
      expect(getInitials('')).toBe('');
    });

    it('handles whitespace-only string', () => {
      // Function returns first 2 chars of original string when trimmed results in single word
      expect(getInitials('   ')).toBe('  ');
    });
  });
});
