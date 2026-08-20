import dayjs from 'dayjs';
import {
  getFirstUnsubmittedDate,
  pickLaterDate,
} from 'src/js/common/submitTimeDates';

describe('submitTimeDates utils', () => {
  describe('getFirstUnsubmittedDate', () => {
    it('returns the day after submittedTo (submittedTo day itself is locked)', () => {
      const result = getFirstUnsubmittedDate('2026-06-15');
      expect(result?.format('YYYY-MM-DD')).toBe('2026-06-16');
      // normalized to start of day
      expect(result?.hour()).toBe(0);
      expect(result?.minute()).toBe(0);
    });

    it('returns undefined when submittedTo is null/undefined/empty', () => {
      expect(getFirstUnsubmittedDate(null)).toBeUndefined();
      expect(getFirstUnsubmittedDate(undefined)).toBeUndefined();
      expect(getFirstUnsubmittedDate('')).toBeUndefined();
    });

    it('returns undefined for an invalid date string', () => {
      expect(getFirstUnsubmittedDate('not-a-date')).toBeUndefined();
    });
  });

  describe('pickLaterDate', () => {
    const earlier = dayjs('2026-01-01');
    const later = dayjs('2026-02-01');

    it('returns the later of two dates', () => {
      expect(pickLaterDate(earlier, later)?.format('YYYY-MM-DD')).toBe(
        '2026-02-01',
      );
      expect(pickLaterDate(later, earlier)?.format('YYYY-MM-DD')).toBe(
        '2026-02-01',
      );
    });

    it('returns the defined one when the other is undefined', () => {
      expect(pickLaterDate(undefined, later)).toBe(later);
      expect(pickLaterDate(earlier, undefined)).toBe(earlier);
    });

    it('returns undefined when both are undefined', () => {
      expect(pickLaterDate(undefined, undefined)).toBeUndefined();
    });
  });
});
