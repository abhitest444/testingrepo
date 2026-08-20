import dayjs from 'dayjs';
import { getMostRecentWeekTimeEntries } from 'src/js/widgets/weeklyTimeTrowser/utils/getMostRecentWeekTimeEntries';
import {
  TimeTracking_TimeEntry,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import { Week } from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';

describe('getMostRecentWeekTimeEntries', () => {
  const week: Week = {
    startDate: dayjs().startOf('week'),
    endDate: dayjs().endOf('week'),
  };

  const createEntry = (date: string): TimeTracking_TimeEntry => ({
    date,
    alternateIds: [],
    id: '',
    timeFor: {
      __typename: undefined,
      id: '',
    },
    timeForType: TimeTracking_TimeForType.Employee,
    isTimeOffEntry: false,
  });

  it('should return an empty array if timeEntriesData is empty', () => {
    const result = getMostRecentWeekTimeEntries([], week);
    expect(result).toEqual([]);
  });

  it('should only return entries for the most recent week', () => {
    const timeEntriesData: TimeTracking_TimeEntry[] = [
      {
        date: '2023-10-01',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-02',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-03',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-04',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-05',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-06',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-07',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-09-09',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-07-09',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
    ];

    const result = getMostRecentWeekTimeEntries(timeEntriesData, week);
    expect(result.length).toBe(7);
  });

  it('should handle entries spanning multiple weeks', () => {
    const timeEntriesData: TimeTracking_TimeEntry[] = [
      {
        date: '2023-09-25',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-09-26',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-09-27',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-09-28',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-09-29',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-09-30',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-01',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
    ];

    const result = getMostRecentWeekTimeEntries(timeEntriesData, week);
    expect(result.length).toBe(7);
  });

  it('should return entries sorted by date', () => {
    const timeEntriesData: TimeTracking_TimeEntry[] = [
      {
        date: '2023-10-03',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-01',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-02',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
    ];

    const result = getMostRecentWeekTimeEntries(timeEntriesData, week);
    expect(result[0].date).toBe('2023-10-01');
    expect(result[1].date).toBe('2023-10-02');
    expect(result[2].date).toBe('2023-10-03');
  });

  it('should handle entries with missing dates', () => {
    const timeEntriesData: TimeTracking_TimeEntry[] = [
      {
        date: '2023-10-01',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: null,
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-02',
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
    ];

    const result = getMostRecentWeekTimeEntries(timeEntriesData, week);
    expect(result.length).toBe(2);
  });

  it('should handle entries with week starting on Wednesday and ending on Tuesday', () => {
    const customWeek: Week = {
      startDate: dayjs().day(3), // Wednesday
      endDate: dayjs().day(2 + 7), // Tuesday
    };

    const timeEntriesData: TimeTracking_TimeEntry[] = [
      {
        date: '2023-09-27', // Wednesday
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-09-28', // Thursday
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-03', // Tuesday
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-07-29', // older time entry
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
    ];

    const result = getMostRecentWeekTimeEntries(timeEntriesData, customWeek);
    expect(result.length).toBe(3);
  });

  it('should handle entries with week starting on Friday and ending on Thursday', () => {
    const customWeek: Week = {
      startDate: dayjs().day(5), // Friday
      endDate: dayjs().day(4 + 7), // Thursday
    };

    const timeEntriesData: TimeTracking_TimeEntry[] = [
      {
        date: '2023-09-29', // Friday
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-05', // Thursday
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-07-29', // older time entry
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
    ];

    const result = getMostRecentWeekTimeEntries(timeEntriesData, customWeek);
    expect(result.length).toBe(2);
  });

  it('should handle entries with week starting on Sunday and ending on Saturday', () => {
    const customWeek: Week = {
      startDate: dayjs().day(0), // Sunday
      endDate: dayjs().day(6), // Saturday
    };

    const timeEntriesData: TimeTracking_TimeEntry[] = [
      {
        date: '2023-10-01', // Sunday
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-05', // Thursday
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-10-07', // Saturday
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
      {
        date: '2023-07-29', // older time entry
        alternateIds: [],
        id: '',
        timeFor: {
          __typename: undefined,
          id: '',
        },
        timeForType: TimeTracking_TimeForType.Employee,
        isTimeOffEntry: false,
      },
    ];

    const result = getMostRecentWeekTimeEntries(timeEntriesData, customWeek);
    expect(result.length).toBe(3);
  });

  // the function should work correctly for a given mostRecentEntryDate and all different possible combinations of week formats
  it('should handle different values of week.startDate and week.endDate', () => {
    const testCases = [
      {
        mostRecentEntryDate: '2023-10-01',
        week: {
          startDate: dayjs().day(0), // Sunday
          endDate: dayjs().day(6), // Saturday
        },
        expectedLength: 1,
      },
      {
        mostRecentEntryDate: '2023-10-01',
        week: {
          startDate: dayjs().day(1), // Monday
          endDate: dayjs().day(0 + 7), // Sunday
        },
        expectedLength: 1,
      },
      {
        mostRecentEntryDate: '2023-10-01',
        week: {
          startDate: dayjs().day(2), // Tuesday
          endDate: dayjs().day(1 + 7), // Monday
        },
        expectedLength: 1,
      },
      {
        mostRecentEntryDate: '2023-10-01',
        week: {
          startDate: dayjs().day(3), // Wednesday
          endDate: dayjs().day(2 + 7), // Tuesday
        },
        expectedLength: 1,
      },
      {
        mostRecentEntryDate: '2023-10-01',
        week: {
          startDate: dayjs().day(4), // Thursday
          endDate: dayjs().day(3 + 7), // Wednesday
        },
        expectedLength: 1,
      },
      {
        mostRecentEntryDate: '2023-10-01',
        week: {
          startDate: dayjs().day(5), // Friday
          endDate: dayjs().day(4 + 7), // Thursday
        },
        expectedLength: 1,
      },
    ];

    testCases.forEach(({ mostRecentEntryDate, week, expectedLength }) => {
      const timeEntriesData = [createEntry(mostRecentEntryDate)];
      const result = getMostRecentWeekTimeEntries(timeEntriesData, week);
      expect(result.length).toBe(expectedLength);
    });
  });

  it('should handle entries spanning multiple weeks with different week start and end days', () => {
    const testCases = [
      {
        mostRecentEntryDate: '2023-10-01',
        week: {
          startDate: dayjs().day(0), // Sunday
          endDate: dayjs().day(6), // Saturday
        },
        timeEntriesData: [
          createEntry('2023-10-01'), // sunday -> mostRecentEntryDate
          createEntry('2023-09-29'), // friday
          createEntry('2023-09-30'), // saturday
        ],
        expectedLength: 1,
      },
      {
        mostRecentEntryDate: '2023-10-03',
        week: {
          startDate: dayjs().day(1), // Monday
          endDate: dayjs().day(0 + 7), // Sunday
        },
        timeEntriesData: [
          createEntry('2023-10-03'), // tuesday -> mostRecentEntryDate
          createEntry('2023-10-01'), // sunday
          createEntry('2023-10-02'), // monday
        ],
        expectedLength: 2,
      },
      {
        mostRecentEntryDate: '2023-10-05',
        week: {
          startDate: dayjs().day(3), // Wednesday
          endDate: dayjs().day(2 + 7), // Tuesday
        },
        timeEntriesData: [
          createEntry('2023-10-05'), // thursday -> mostRecentEntryDate
          createEntry('2023-10-03'), // tuesday
          createEntry('2023-10-04'), // wednesday
        ],
        expectedLength: 2,
      },
      {
        mostRecentEntryDate: '2023-10-07',
        week: {
          startDate: dayjs().day(5), // Friday
          endDate: dayjs().day(4 + 7), // Thursday
        },
        timeEntriesData: [
          createEntry('2023-10-07'), // saturday -> mostRecentEntryDate
          createEntry('2023-10-05'), // thursday
          createEntry('2023-10-06'), // friday
        ],
        expectedLength: 2,
      },
    ];

    testCases.forEach(({ week, timeEntriesData, expectedLength }) => {
      const result = getMostRecentWeekTimeEntries(timeEntriesData, week);
      expect(result.length).toBe(expectedLength);
    });
  });
});
