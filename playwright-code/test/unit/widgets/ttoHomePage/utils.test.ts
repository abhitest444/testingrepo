import dayjs from 'dayjs';
import {
  getThemeFromSandbox,
  getWeekRangeAndMonthLabel,
  formatDuration,
} from 'src/js/widgets/ttoHomePage/utils';
import { getDefaultSandbox } from 'test/unit/testUtils';
import { DEFAULT_DURATION_PLACEHOLDER } from 'src/js/widgets/ttoHomePage/constants';

describe('getThemeFromSandbox', () => {
  it('returns theme from sandbox', () => {
    const sandbox = getDefaultSandbox();

    expect(getThemeFromSandbox(sandbox as any)).toEqual('quickbooks');
  });

  it('returns theme from sandbox with appContext.getAppInfo returning QUICKBOOKS', () => {
    const sandbox = getDefaultSandbox();
    expect(getThemeFromSandbox(sandbox as any)).toEqual('quickbooks');
  });
  it('returns theme from sandbox with appContext.getAppInfo returning other', () => {
    const sandbox = getDefaultSandbox();
    sandbox.appContext.getAppInfo = jest
      .fn()
      .mockReturnValue({ appName: 'other' });
    expect(getThemeFromSandbox(sandbox as any)).toEqual('intuit');
  });
  it('returns theme from sandbox with appContext.getAppInfo returning empty string', () => {
    const sandbox = getDefaultSandbox();
    sandbox.appContext.getAppInfo = jest.fn().mockReturnValue({ appName: '' });
    expect(getThemeFromSandbox(sandbox as any)).toEqual('intuit');
  });
});

describe('getWeekRangeAndMonthLabel', () => {
  it('returns correct week range and month label for Sunday as first day', () => {
    const today = dayjs('2024-06-12'); // Wednesday
    const { weekRange, monthLabel } = getWeekRangeAndMonthLabel(0, today);
    expect(weekRange).toBe('6/9/2024 - 6/15/2024');
    expect(monthLabel).toBe('JUNE 2024');
  });

  it('returns correct week range and month label for Monday as first day', () => {
    const today = dayjs('2024-06-12'); // Wednesday
    const { weekRange, monthLabel } = getWeekRangeAndMonthLabel(1, today);
    expect(weekRange).toBe('6/10/2024 - 6/16/2024');
    expect(monthLabel).toBe('JUNE 2024');
  });

  it('handles today on first day of week', () => {
    const today = dayjs('2024-06-10'); // Monday
    const { weekRange, monthLabel } = getWeekRangeAndMonthLabel(1, today);
    expect(weekRange).toBe('6/10/2024 - 6/16/2024');
    expect(monthLabel).toBe('JUNE 2024');
  });

  it('handles week crossing months', () => {
    const today = dayjs('2024-03-30'); // Saturday
    const { weekRange, monthLabel } = getWeekRangeAndMonthLabel(0, today);
    expect(weekRange).toBe('3/24/2024 - 3/30/2024');
    expect(monthLabel).toBe('MARCH 2024');
  });

  it('defaults to today if no date is provided', () => {
    const { weekRange, monthLabel } = getWeekRangeAndMonthLabel(0);
    expect(typeof weekRange).toBe('string');
    expect(typeof monthLabel).toBe('string');
  });
});

describe('formatDuration', () => {
  it('returns the default placeholder for null', () => {
    expect(formatDuration(null)).toBe(DEFAULT_DURATION_PLACEHOLDER);
  });

  it('returns 0:00 for zero seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats minutes correctly', () => {
    expect(formatDuration(90)).toBe('1:30'); // 1 minute, 30 seconds
    expect(formatDuration(60)).toBe('1:00'); // 1 minute, 0 seconds
  });

  it('formats hours and minutes correctly', () => {
    expect(formatDuration(3661)).toBe('1:01'); // 1 hour, 1 minute
    expect(formatDuration(7322)).toBe('2:02'); // 2 hours, 2 minutes
  });
});

describe('DEFAULT_DURATION_PLACEHOLDER', () => {
  it('should be 00:00', () => {
    expect(DEFAULT_DURATION_PLACEHOLDER).toBe('00:00');
  });
});
