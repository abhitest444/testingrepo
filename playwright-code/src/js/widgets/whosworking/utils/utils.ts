import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { DatePeriod } from '../../../service/hooks/whosWorking/types';

dayjs.extend(utc);
/**
 * Gets the date range filter with current UTC date for both begin and end
 */
export const getDateRangeFilter = (): DatePeriod => {
  const currentDate = dayjs().utc().format('YYYY-MM-DD');
  return {
    beginDate: currentDate,
    endDate: currentDate,
  };
};
/**
 * Formats duration in seconds to a human-readable string (e.g., "2h 30m" or "45m")
 */
export function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds === 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h > 0 && m > 0) {
    return `${h}h ${m}m`;
  }
  if (h > 0) {
    return `${h}h 0m`;
  }
  return `${m}m`;
}

/**
 * Calculates the duration from a start time to now and formats it
 */
export function getActiveEntryDuration(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffSeconds = Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / 1000),
  );
  return formatDuration(diffSeconds);
}
