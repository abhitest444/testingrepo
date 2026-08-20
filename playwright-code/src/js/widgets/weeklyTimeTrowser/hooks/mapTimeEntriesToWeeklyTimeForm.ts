import { Dayjs } from 'dayjs';

import {
  TimeTracking_BillableStatus,
  TimeTracking_TimeEntry,
} from 'src/__generated__/timeTracking/graphql';
import { TimeForFormState } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { Week } from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';
import { stringToDayJS } from 'src/js/common/DateAndTimeUtils';
import { WeeklyTimeFormState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import {
  WeeklyTimeRowDurationState,
  WeeklyTimeRowState,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';

export const mapTimeEntriesToWeeklyTimeForm = (
  timeFor: TimeForFormState,
  week: Week,
  timeEntries: TimeTracking_TimeEntry[],
  copyDataOnly: boolean = false,
): WeeklyTimeFormState => ({
  timeFor,
  week,
  weeklyTimeRows: mapWeeklyTimeRows(
    groupTimeEntries(timeEntries),
    week,
    copyDataOnly,
  ),
  closedBookPassword: '',
});

const groupTimeEntries = (
  timeEntries: TimeTracking_TimeEntry[],
): TimeTracking_TimeEntry[][] => {
  const groupedTimeEntries: TimeTracking_TimeEntry[][] = [];

  timeEntries.forEach((entry) => {
    const groupedIndex = groupedTimeEntries.findIndex((groupedRow) => {
      const identicalJobDetails = groupedRow.every(
        (groupedEntry) =>
          groupedEntry.timeAgainst?.customer?.id ===
            entry.timeAgainst?.customer?.id &&
          groupedEntry.timeAgainst?.project?.id ===
            entry.timeAgainst?.project?.id &&
          groupedEntry.serviceItem?.id === entry.serviceItem?.id &&
          groupedEntry.department?.id === entry.department?.id &&
          groupedEntry.class?.id === entry.class?.id &&
          groupedEntry.payrollItem?.id === entry.payrollItem?.id &&
          groupedEntry.notes === entry.notes &&
          groupedEntry.billableStatus === entry.billableStatus &&
          groupedEntry.billableRate === entry.billableRate &&
          groupedEntry.costRate === entry.costRate &&
          groupedEntry.taxable === entry.taxable,
      );
      const dateAlreadyTaken = groupedRow.some(
        (groupedEntry) => groupedEntry.date === entry.date,
      );
      return identicalJobDetails && !dateAlreadyTaken;
    });

    if (groupedIndex >= 0) {
      groupedTimeEntries[groupedIndex].push(entry);
    } else {
      groupedTimeEntries[groupedTimeEntries.length] = [entry];
    }
  });

  return groupedTimeEntries;
};

const mapWeeklyTimeRows = (
  groupedTimeEntries: TimeTracking_TimeEntry[][],
  week: Week,
  copyDataOnly: boolean,
): WeeklyTimeRowState[] => {
  const result: WeeklyTimeRowState[] = [];

  const isBillable = (billableStatus?: TimeTracking_BillableStatus) =>
    billableStatus === TimeTracking_BillableStatus.Billable ||
    billableStatus === TimeTracking_BillableStatus.HasBeenBilled ||
    false;

  groupedTimeEntries.forEach((groupedTime) => {
    const row: WeeklyTimeRowState = {
      timeAgainst: {
        customer: {
          id: groupedTime[0].timeAgainst?.customer?.id || '',
          name: '',
        },
        project: {
          id: groupedTime[0].timeAgainst?.project?.id || '',
          name: '',
        },
      },
      service: {
        id: groupedTime[0].serviceItem?.id || '',
        name: '',
      },
      location: {
        id: groupedTime[0].department?.id || '',
        name: '',
      },
      class: {
        id: groupedTime[0].class?.id || '',
        name: '',
      },
      payType: {
        id: groupedTime[0].payrollItem?.id || '',
        name: '',
      },
      notes: groupedTime[0].notes || '',
      billable: isBillable(groupedTime[0].billableStatus),
      billableStatus: groupedTime[0].billableStatus,
      billRate:
        !isBillable(groupedTime[0].billableStatus) ||
        window.isNaN(groupedTime[0].billableRate)
          ? null
          : Number(groupedTime[0].billableRate),
      costRate: window.isNaN(groupedTime[0].costRate)
        ? null
        : Number(groupedTime[0].costRate),
      taxable: groupedTime[0].taxable || false,
      id: Number(groupedTime[0].id) || 0,
      invoiceId: groupedTime[0].invoiceId?.toString() || null,
      durations: [
        findDuration(groupedTime, week.startDate, copyDataOnly),
        findDuration(groupedTime, week.startDate.add(1, 'day'), copyDataOnly),
        findDuration(groupedTime, week.startDate.add(2, 'day'), copyDataOnly),
        findDuration(groupedTime, week.startDate.add(3, 'day'), copyDataOnly),
        findDuration(groupedTime, week.startDate.add(4, 'day'), copyDataOnly),
        findDuration(groupedTime, week.startDate.add(5, 'day'), copyDataOnly),
        findDuration(groupedTime, week.startDate.add(6, 'day'), copyDataOnly),
      ],
    };
    result.push(row);
  });

  return result;
};

export const findDuration = (
  timeEntries: TimeTracking_TimeEntry[],
  day: Dayjs,
  copyDataOnly: boolean,
): WeeklyTimeRowDurationState => {
  const found = timeEntries.find(
    (entry) => stringToDayJS(entry.date, 'YYYY-MM-DD').day() === day.day(),
  );
  return {
    id: !copyDataOnly ? found?.id : undefined,
    duration: found?.duration ?? null,
    day,
    billableStatus: found?.billableStatus,
    version: !copyDataOnly ? found?.meta?.version || '0' : '0',
    locked: !copyDataOnly ? found?.locked ?? undefined : undefined,
    lockedReason: !copyDataOnly ? found?.lockedReason ?? undefined : undefined,
  };
};
