import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';
import { mapQBTimezoneToDayjsTimezone } from 'src/js/common/DateAndTimeUtils';
import { BreakEntry } from '../types';

export const mapTimeEntryToBreakEntry = (
  timeEntry: TimeTracking_TimeEntry,
): Partial<BreakEntry> => {
  dayjs.extend(utc);
  dayjs.extend(timezone);

  // Determine if the time entry has start/end times or duration
  const hasStartEndTime = timeEntry.startTime && timeEntry.endTime;
  const hasDuration =
    timeEntry.v3BreakDuration && timeEntry.v3BreakDuration > 0;

  const breakEntry: Partial<BreakEntry> = {
    // Store the original time entry ID and version for updates
    timeEntryId: timeEntry.id,
    version: timeEntry.meta?.version,
    breakRule: timeEntry.timeBreakId,
    startDate: timeEntry.date,
    endDate: timeEntry.date,
    description: timeEntry.notes,
    timezone: timeEntry.timeZone,
    contact: timeEntry.timeFor
      ? {
          id: timeEntry.timeFor.id,
        }
      : undefined,
    // Set currentlyWorking based on isOpen flag from time entry data
    currentlyWorking: timeEntry.isOpen || false,
    duration: timeEntry.duration,
    isTimeOffEntry: timeEntry.isTimeOffEntry ?? false,
  };

  if (hasStartEndTime) {
    // If time entry has start and end times, use them with proper timezone handling
    const timeZoneToUse = timeEntry.timeZone
      ? mapQBTimezoneToDayjsTimezone(timeEntry.timeZone)
      : undefined;
    breakEntry.startTime = timeZoneToUse
      ? dayjs(timeEntry.startTime).tz(timeZoneToUse)
      : dayjs(timeEntry.startTime);
    breakEntry.endTime = timeZoneToUse
      ? dayjs(timeEntry.endTime).tz(timeZoneToUse)
      : dayjs(timeEntry.endTime);
    breakEntry.useStartEndTime = true;
  } else if (hasDuration) {
    // If time entry has duration but no start/end times, use duration
    breakEntry.duration = timeEntry.v3BreakDuration;
    breakEntry.useStartEndTime = false;
    // Don't set startTime and endTime when we have duration
  }

  return breakEntry;
};

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
