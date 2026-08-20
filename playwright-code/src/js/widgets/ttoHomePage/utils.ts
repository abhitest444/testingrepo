import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import dayjs, { Dayjs } from 'dayjs';
import { DEFAULT_DURATION_PLACEHOLDER } from './constants';

export const getThemeFromSandbox = (sandbox: QuickbooksOnlineSandbox) => {
  const appName = sandbox?.appContext?.getAppInfo()?.appName?.toLowerCase();

  if (appName === 'quickbooks' || appName?.match(/^qb.*/i)) {
    return 'quickbooks';
  }
  return 'intuit'; // Default fallback theme
};

export function getWeekRangeAndMonthLabel(
  firstDayOfWeek: number,
  today?: Dayjs,
) {
  const current = today || dayjs();
  let daysToSub = (current.day() - firstDayOfWeek + 7) % 7;
  daysToSub =
    daysToSub === 0 && current.day() !== firstDayOfWeek ? 7 : daysToSub;
  const startOfWeek = current.subtract(daysToSub, 'day');
  const endOfWeek = startOfWeek.add(6, 'day');
  const weekRange = `${startOfWeek.format('M/D/YYYY')} - ${endOfWeek.format(
    'M/D/YYYY',
  )}`;
  const monthLabel = current.format('MMMM YYYY').toUpperCase();
  return { weekRange, monthLabel };
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return DEFAULT_DURATION_PLACEHOLDER;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    // Show h:mm
    return `${h}:${m.toString().padStart(2, '0')}`;
  }
  // Show m:ss
  return `${m}:${s.toString().padStart(2, '0')}`;
}
