import dayjs from 'dayjs';
import { BreakEntry } from '../types';

export const updateTimeToDayjs = (
  breakEntry: Partial<BreakEntry>,
): Partial<BreakEntry> => {
  const updatedEntry = {
    ...breakEntry,
    startDate: breakEntry.startDate ? dayjs(breakEntry.startDate) : dayjs(),
    endDate: breakEntry.endDate ? dayjs(breakEntry.endDate) : undefined,
  };

  // Only set startTime and endTime if they exist and we're not using duration
  if (breakEntry.startTime && breakEntry.endTime) {
    updatedEntry.startTime = dayjs(breakEntry.startTime);
    updatedEntry.endTime = dayjs(breakEntry.endTime);
  } else if (breakEntry.duration) {
    // If we have duration but no start/end times, don't set them
    updatedEntry.startTime = undefined;
    updatedEntry.endTime = undefined;
  } else {
    // Default values for new entries
    updatedEntry.startTime = dayjs().startOf('hour');
    updatedEntry.endTime = dayjs().startOf('hour').add(1, 'hour');
  }

  return updatedEntry;
};
