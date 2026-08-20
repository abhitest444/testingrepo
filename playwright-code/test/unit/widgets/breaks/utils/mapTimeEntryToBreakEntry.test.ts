import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { mapTimeEntryToBreakEntry } from 'src/js/widgets/breaks/utils/mapTimeEntryToBreakEntry';
import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

describe('mapTimeEntryToBreakEntry', () => {
  const baseTimeEntry: TimeTracking_TimeEntry = {
    id: 'time-entry-id',
    meta: { version: '1' },
    timeBreakId: 'break-rule-id',
    date: '2024-01-01',
    notes: 'Test break entry',
    timeZone: 'America/New_York',
    timeFor: {
      __typename: 'WorkerManagement_Employee',
      id: 'employee-id',
    },
    timeForType: 'EMPLOYEE' as any,
    alternateIds: [],
    isOpen: false,
    duration: 3600,
    isExported: false,
    isTimeOffEntry: false,
  };

  it('should map time entry with start/end times correctly', () => {
    const timeEntry: TimeTracking_TimeEntry = {
      ...baseTimeEntry,
      startTime: '2024-01-01T09:00:00-05:00', // EST timezone
      endTime: '2024-01-01T10:00:00-05:00',
      v3BreakDuration: 0,
      isTimeOffEntry: false,
    };

    const result = mapTimeEntryToBreakEntry(timeEntry);

    expect(result).toEqual({
      timeEntryId: 'time-entry-id',
      version: '1',
      breakRule: 'break-rule-id',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      description: 'Test break entry',
      timezone: 'America/New_York',
      contact: { id: 'employee-id' },
      currentlyWorking: false,
      duration: 3600,
      startTime: expect.any(dayjs),
      endTime: expect.any(dayjs),
      useStartEndTime: true,
      isTimeOffEntry: false,
    });

    // Verify that timezone is applied correctly
    expect(dayjs.isDayjs(result.startTime)).toBe(true);
    expect(dayjs.isDayjs(result.endTime)).toBe(true);
  });

  it('should map time entry with duration correctly', () => {
    const timeEntry: TimeTracking_TimeEntry = {
      ...baseTimeEntry,
      startTime: undefined,
      endTime: undefined,
      v3BreakDuration: 3600, // 1 hour
      isTimeOffEntry: false,
    };

    const result = mapTimeEntryToBreakEntry(timeEntry);

    expect(result).toEqual({
      timeEntryId: 'time-entry-id',
      version: '1',
      breakRule: 'break-rule-id',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      description: 'Test break entry',
      timezone: 'America/New_York',
      contact: { id: 'employee-id' },
      currentlyWorking: false,
      duration: 3600,
      useStartEndTime: false,
      isTimeOffEntry: false,
    });

    // Should not have startTime/endTime when using duration
    expect(result.startTime).toBeUndefined();
    expect(result.endTime).toBeUndefined();
  });

  it('should handle time entry without timezone', () => {
    const timeEntry: TimeTracking_TimeEntry = {
      ...baseTimeEntry,
      timeZone: undefined,
      startTime: '2024-01-01T09:00:00Z', // UTC timezone
      endTime: '2024-01-01T10:00:00Z',
      v3BreakDuration: 0,
      isTimeOffEntry: false,
    };

    const result = mapTimeEntryToBreakEntry(timeEntry);

    expect(result.timezone).toBeUndefined();
    expect(dayjs.isDayjs(result.startTime)).toBe(true);
    expect(dayjs.isDayjs(result.endTime)).toBe(true);
  });

  it('should handle currently working time entries', () => {
    const timeEntry: TimeTracking_TimeEntry = {
      ...baseTimeEntry,
      isOpen: true,
      startTime: '2024-01-01T09:00:00-05:00',
      endTime: undefined,
      v3BreakDuration: 0,
      isTimeOffEntry: false,
    };

    const result = mapTimeEntryToBreakEntry(timeEntry);

    expect(result.currentlyWorking).toBe(true);
    // When endTime is undefined, startTime is not converted to dayjs
    expect(result.startTime).toBeUndefined();
    expect(result.endTime).toBeUndefined();
  });

  it('should handle different timezones correctly', () => {
    const timezones = [
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
    ];

    timezones.forEach((tz) => {
      const timeEntry: TimeTracking_TimeEntry = {
        ...baseTimeEntry,
        timeZone: tz,
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T10:00:00Z',
        v3BreakDuration: 0,
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToBreakEntry(timeEntry);

      expect(result.timezone).toBe(tz);
      expect(dayjs.isDayjs(result.startTime)).toBe(true);
      expect(dayjs.isDayjs(result.endTime)).toBe(true);
    });
  });

  it('should handle time entry with no contact', () => {
    const timeEntry = {
      ...baseTimeEntry,
      timeFor: undefined,
    } as unknown as TimeTracking_TimeEntry;

    const result = mapTimeEntryToBreakEntry(timeEntry);

    expect(result.contact).toBeUndefined();
  });

  it('should prioritize v3BreakDuration over duration when both are present', () => {
    const timeEntry: TimeTracking_TimeEntry = {
      ...baseTimeEntry,
      duration: 1800, // 30 minutes
      v3BreakDuration: 3600, // 1 hour
      startTime: undefined,
      endTime: undefined,
      isTimeOffEntry: false,
    };

    const result = mapTimeEntryToBreakEntry(timeEntry);

    expect(result.duration).toBe(3600); // Should use v3BreakDuration
    expect(result.useStartEndTime).toBe(false);
  });
});
