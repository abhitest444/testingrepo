import { useFormContext, useWatch } from 'react-hook-form';
import {
  WeeklyTimeRowDurationState,
  WeeklyTimeRowState,
  WeeklyTimeFormStateRowsField,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';
import { bankersRound } from '../../../common/MiscUtils';

export const returnRoundedOffDurations = (
  durations: WeeklyTimeRowDurationState[],
): WeeklyTimeRowDurationState[] =>
  durations.map((value) => {
    if (value.duration) {
      let hours = Math.floor(value.duration / 3600);
      let minutes = Math.round((value.duration % 3600) / 60);
      if (minutes === 60) {
        hours += 1;
        minutes = 0;
      }
      const roundedOffDuration = hours * 3600 + minutes * 60;
      return { ...value, duration: roundedOffDuration };
    }
    return value;
  });

export const calculateRowSum = (
  durations: WeeklyTimeRowDurationState[],
): number =>
  returnRoundedOffDurations(durations).reduce(
    (rowSum, { day, duration }) => rowSum + (duration ?? 0),
    0,
  );

export const useTotalTime = (): number => {
  const { control } = useFormContext();
  const rows = useWatch({
    control,
    name: 'weeklyTimeRows',
  }) as WeeklyTimeRowState[];

  return rows.reduce(
    (totalSum, { durations }) => totalSum + calculateRowSum(durations),
    0,
  );
};

export const useTotalBillable = (): number => {
  const { control } = useFormContext();
  const rows = useWatch({
    control,
    name: 'weeklyTimeRows',
  }) as WeeklyTimeRowState[];

  const totalBillable = rows.reduce(
    (totalSum, { durations, billRate }) =>
      totalSum + ((billRate ?? 0) * calculateRowSum(durations)) / 3600,
    0,
  );

  return bankersRound(totalBillable);
};

export const getRowTimeTotal = (
  durations: WeeklyTimeRowDurationState[],
): number =>
  durations.reduce((sum, { day, duration }) => sum + (duration ?? 0), 0);

/**
 * Sums row time duration values to a number in seconds
 *
 * @param rowIndex index of row in `weeklyTimeRows`
 */
export const useRowTimeTotal = (rowIndex: number): number => {
  const { control } = useFormContext();

  const durations = useWatch({
    control,
    name: `weeklyTimeRows.${rowIndex}.durations`,
  }) as WeeklyTimeRowDurationState[];

  return getRowTimeTotal(durations);
};

export const getRowBillableTotal = (
  billRate: number,
  rowTotalSeconds: number,
) => bankersRound(billRate * (rowTotalSeconds / 3600));

/**
 * Computes total billable currency value as number up to two decimal points
 *
 * @param rowIndex index of row in `weeklyTimeRows`
 */
export const useRowBillableTotal = (rowIndex: number): number => {
  const { control } = useFormContext();

  const durations = useWatch({
    control,
    name: `weeklyTimeRows.${rowIndex}.durations`,
  }) as WeeklyTimeRowDurationState[];

  const billRate = useWatch({
    control,
    name: `weeklyTimeRows.${rowIndex}.billRate`,
  }) as number;

  const billable = useWatch({
    control,
    name: `weeklyTimeRows.${rowIndex}.billable`,
  }) as boolean;

  return getRowBillableTotal(
    billable ? billRate : 0,
    getRowTimeTotal(returnRoundedOffDurations(durations)),
  );
};

// computes the total hours for a particular day of a week
export const getTotalHoursForDay = (
  rows: (WeeklyTimeFormStateRowsField | WeeklyTimeRowState)[],
  dayIndex: number,
): number =>
  rows.reduce((sum, row) => sum + (row.durations[dayIndex]?.duration ?? 0), 0);

// computes the total hours for a week
export const getTotalHoursForWeek = (columnTotals: number[]) =>
  columnTotals.reduce((sum, dailyTotal) => sum + dailyTotal, 0);

// computes the total billable amount for a week
export const getTotalBillableAmount = (
  rows: (WeeklyTimeFormStateRowsField | WeeklyTimeRowState)[],
): number =>
  rows.reduce((totalSum, { durations, billRate, billable }) => {
    const effectiveBillRate = billable ? billRate ?? 0 : 0;
    const rowTotal = calculateRowSum(durations);
    const billableAmount = (effectiveBillRate * rowTotal) / 3600;
    return totalSum + bankersRound(billableAmount);
  }, 0);

export const useColumnTotals = (): {
  columnTotals: number[];
  totalHours: number;
  totalBillableAmount: number;
} => {
  const { control } = useFormContext();
  const rows = useWatch({
    control,
    name: 'weeklyTimeRows',
  }) as WeeklyTimeFormStateRowsField[];

  // Initialize an array to hold the total duration for each day of the week
  const columnTotals = Array(7)
    .fill(0)
    .map((_, dayIndex) => getTotalHoursForDay(rows, dayIndex));
  const totalHours = getTotalHoursForWeek(columnTotals);
  //  summing up the billable amount from the rows
  const totalBillableAmount = getTotalBillableAmount(rows);

  return { columnTotals, totalHours, totalBillableAmount };
};
