/* eslint-disable camelcase */

import dayjs from 'dayjs';

import {
  findDuration,
  mapTimeEntriesToWeeklyTimeForm,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/mapTimeEntriesToWeeklyTimeForm';
import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';
import {
  TimeForFormState,
  TimeForType,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { Week } from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';
import {
  aTimeTracking_TimeEntry,
  aTimeTracking_TrackTimeAgainst,
} from '__mocks__/__generated__/timeTracking';

describe('mapTimeEntriesToWeeklyTimeForm', () => {
  const timeFor: TimeForFormState = {
    id: 'emp1',
    type: TimeForType.EMPLOYEE,
    name: '',
  };
  const week: Week = {
    startDate: dayjs('2023-10-09'),
    endDate: dayjs('2023-10-15'),
  };

  const timeEntries: TimeTracking_TimeEntry[] = [
    aTimeTracking_TimeEntry({
      id: '1',
      date: '2024-10-09',
      duration: 28800,
      billableRate: '1',
      costRate: '2',
    }),
    aTimeTracking_TimeEntry({
      id: '2',
      date: '2023-10-10',
      duration: 16200,
      billableRate: '1',
      costRate: '2',
    }),
  ];

  const nullTimeEntries: TimeTracking_TimeEntry[] = [
    aTimeTracking_TimeEntry({
      id: undefined,
      date: '2024-10-09',
      duration: 28800,
      timeAgainst: undefined,
      serviceItem: undefined,
      department: undefined,
      class: undefined,
      payrollItem: undefined,
      billableRate: '1',
      billableStatus: undefined,
      costRate: '2',
      notes: undefined,
    }),
  ];

  it('should map time entries to weekly time form state correctly', () => {
    const result = mapTimeEntriesToWeeklyTimeForm(timeFor, week, timeEntries);
    expect(result.timeFor).toEqual(timeFor);
    expect(result.week).toEqual(week);
    expect(result.closedBookPassword).toBe('');
    expect(result.weeklyTimeRows).toHaveLength(1);

    const row = result.weeklyTimeRows[0];
    expect(row.timeAgainst?.customer?.id).toBe(
      timeEntries[0].timeAgainst?.customer?.id,
    );
    expect(row.timeAgainst.project.id).toBe(
      timeEntries[0].timeAgainst?.project?.id,
    );
    // expect(row.customer.id).toBe(timeEntries[0].timeAgainst?.customer?.id);
    // expect(row.project.id).toBe(timeEntries[0].timeAgainst?.project?.id);
    expect(row.service.id).toBe(timeEntries[0].serviceItem?.id);
    expect(row.location.id).toBe(timeEntries[0].department?.id);
    expect(row.class.id).toBe(timeEntries[0].class?.id);
    expect(row.notes).toBe(timeEntries[0].notes);
    expect(row.billable).toBe(true);
    expect(row.billRate).toBe(Number(timeEntries[0].billableRate));
    expect(row.costRate).toBe(2);
    expect(row.taxable).toBe(timeEntries[0].taxable);

    expect(row.durations).toHaveLength(7);
    expect(row.durations[0].duration).toBe(null);
    expect(row.durations[1].duration).toBe(16200);
    expect(row.durations[2].duration).toBe(28800);
    expect(row.durations[3].duration).toBe(null);
    expect(row.durations[4].duration).toBe(null);
    expect(row.durations[5].duration).toBe(null);
    expect(row.durations[6].duration).toBe(null);
  });

  it('should handle empty time entries', () => {
    const result = mapTimeEntriesToWeeklyTimeForm(timeFor, week, []);
    expect(result.weeklyTimeRows).toHaveLength(0);
  });

  it('should handle time entries having null values', () => {
    const result = mapTimeEntriesToWeeklyTimeForm(
      timeFor,
      week,
      nullTimeEntries,
    );
    expect(result.weeklyTimeRows).toHaveLength(1);
  });

  it('should group time entries by composite key', () => {
    const result = mapTimeEntriesToWeeklyTimeForm(timeFor, week, [
      ...timeEntries,
      aTimeTracking_TimeEntry({
        id: '3',
        date: '2023-10-11',
      }),
    ]);
    expect(result.weeklyTimeRows).toHaveLength(2);
  });

  it('should handle scenario if copyDataOnly is true', () => {
    const selectedDay = dayjs('2024-10-09');
    const foundDuration = findDuration(timeEntries, selectedDay, true);
    expect(foundDuration).toEqual({
      billableStatus: 'BILLABLE',
      id: undefined,
      duration: 28800,
      day: selectedDay,
      version: '0',
      locked: undefined,
      lockedReason: undefined,
    });
  });

  it('should set invoiceId to null when entry has no invoiceId', () => {
    const entriesNoInvoice: TimeTracking_TimeEntry[] = [
      aTimeTracking_TimeEntry({
        id: '1',
        date: '2023-10-09',
        duration: 3600,
        invoiceId: null as any,
      }),
    ];
    const result = mapTimeEntriesToWeeklyTimeForm(
      timeFor,
      week,
      entriesNoInvoice,
    );
    expect(result.weeklyTimeRows[0].invoiceId).toBeNull();
  });

  it('should group entries with null timeAgainst into the same row', () => {
    const entry1 = aTimeTracking_TimeEntry({
      id: '1',
      date: '2023-10-09',
      duration: 3600,
      timeAgainst: null as any,
    });
    const entry2 = aTimeTracking_TimeEntry({
      id: '2',
      date: '2023-10-10',
      duration: 7200,
      timeAgainst: null as any,
    });
    const result = mapTimeEntriesToWeeklyTimeForm(timeFor, week, [
      entry1,
      entry2,
    ]);
    expect(result.weeklyTimeRows.length).toBe(1);
  });

  it('should group entries with null customer/project into the same row', () => {
    const entry1 = aTimeTracking_TimeEntry({
      id: '1',
      date: '2023-10-09',
      duration: 3600,
      timeAgainst: aTimeTracking_TrackTimeAgainst({
        customer: null as any,
        project: null as any,
      }),
    });
    const entry2 = aTimeTracking_TimeEntry({
      id: '2',
      date: '2023-10-10',
      duration: 7200,
      timeAgainst: aTimeTracking_TrackTimeAgainst({
        customer: null as any,
        project: null as any,
      }),
    });
    const result = mapTimeEntriesToWeeklyTimeForm(timeFor, week, [
      entry1,
      entry2,
    ]);
    expect(result.weeklyTimeRows.length).toBe(1);
  });

  it('should group entries with null serviceItem/department/class/payrollItem', () => {
    const entry1 = aTimeTracking_TimeEntry({
      id: '1',
      date: '2023-10-09',
      duration: 3600,
      serviceItem: null as any,
      department: null as any,
      class: null as any,
      payrollItem: null as any,
    });
    const entry2 = aTimeTracking_TimeEntry({
      id: '2',
      date: '2023-10-10',
      duration: 7200,
      serviceItem: null as any,
      department: null as any,
      class: null as any,
      payrollItem: null as any,
    });
    const result = mapTimeEntriesToWeeklyTimeForm(timeFor, week, [
      entry1,
      entry2,
    ]);
    expect(result.weeklyTimeRows.length).toBe(1);
  });
});
