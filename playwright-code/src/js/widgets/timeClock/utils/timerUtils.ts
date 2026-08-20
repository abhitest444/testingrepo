import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const FUTURE_TIME = 'FUTURE_TIME';
export const calculateElapsedTime = (
  startTime: string,
  companyTimezone: string,
): string => {
  const now = dayjs().tz(companyTimezone);
  const start = dayjs(startTime).tz(companyTimezone);
  const diffInMs = now.diff(start);

  if (diffInMs < 0) {
    const absDiffInMs = Math.abs(diffInMs);
    const minutes = Math.floor(absDiffInMs / (1000 * 60));
    const seconds = Math.floor((absDiffInMs % (1000 * 60)) / 1000);
    return `-00:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
