/* eslint-disable react-hooks/rules-of-hooks */
import moment from 'moment';
import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';
import { Week } from '../components/WeekSelector';

export const getMostRecentWeekTimeEntries = (
  timeEntriesData: TimeTracking_TimeEntry[],
  week: Week,
) => {
  if (!timeEntriesData || timeEntriesData.length === 0) return [];

  // Get the most recent past time entry date
  const MostRecentEntryDate = moment(timeEntriesData[0].date);

  // Calculate the start and end of the week for the most recent past entry according to the customer defined week format
  let mostRecentEntryWeekStart = moment(MostRecentEntryDate)
    .startOf('week')
    .day(week.startDate.day());
  let mostRecentEntryWeekEnd = moment(MostRecentEntryDate)
    .startOf('week')
    .day(week.endDate.day() + 7);

  // Adjust if the calculated start date is after the entry date
  if (mostRecentEntryWeekStart.isAfter(MostRecentEntryDate)) {
    mostRecentEntryWeekStart = moment(mostRecentEntryWeekStart).subtract(
      7,
      'days',
    );
    mostRecentEntryWeekEnd = moment(mostRecentEntryWeekEnd).subtract(7, 'days');
  }

  // Filter entries for the same week as the most recent entry in the past
  const filteredEntries = timeEntriesData.filter(
    (entry: TimeTracking_TimeEntry) => {
      const entryDate = moment(entry.date!);
      return (
        entryDate.isSameOrAfter(mostRecentEntryWeekStart) &&
        entryDate.isSameOrBefore(mostRecentEntryWeekEnd)
      );
    },
  );

  // Sort the filtered entries by date in ascending order
  filteredEntries.sort((a: TimeTracking_TimeEntry, b: TimeTracking_TimeEntry) =>
    moment(a.date ?? '').diff(moment(b.date ?? '')),
  );

  return filteredEntries;
};
