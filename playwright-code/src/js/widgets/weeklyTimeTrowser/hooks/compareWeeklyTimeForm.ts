import { FormState } from 'react-hook-form';
import { WeeklyTimeFormState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import {
  WeeklyTimeRowDurationState,
  WeeklyTimeRowState,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';

export const areDurationsEqual = (
  durations1: WeeklyTimeRowDurationState[],
  durations2: WeeklyTimeRowDurationState[],
): boolean =>
  durations1.every((duration1, index) => {
    const duration2 = durations2[index];
    return (
      duration1.duration === duration2.duration &&
      duration1.day.isSame(duration2.day)
    );
  });

export const areWeeklyTimeRowsEqual = (
  row1: WeeklyTimeRowState,
  row2: WeeklyTimeRowState,
): boolean =>
  row1.timeAgainst.customer?.id === row2.timeAgainst.customer?.id &&
  row1.timeAgainst.project.id === row2.timeAgainst.project.id &&
  row1.service.id === row2.service.id &&
  row1.location.id === row2.location.id &&
  row1.class.id === row2.class.id &&
  row1.notes === row2.notes &&
  row1.billable === row2.billable &&
  row1.billRate === row2.billRate &&
  row1.costRate === row2.costRate &&
  row1.payType.id === row2.payType.id &&
  row1.taxable === row2.taxable &&
  areDurationsEqual(row1.durations, row2.durations);

export const areWeeklyTimeFormStatesEqual = (
  formState1: WeeklyTimeFormState,
  formState2: WeeklyTimeFormState,
): boolean => {
  if (
    formState1.timeFor.id !== formState2.timeFor.id ||
    formState1.timeFor.type !== formState2.timeFor.type ||
    !formState1.week.startDate.isSame(formState2.week.startDate, 'date') ||
    !formState1.week.endDate.isSame(formState2.week.endDate, 'date')
    // Not checking formState length because any data change in the last row adds another row, which should not cause this function to fail
  ) {
    return false;
  }

  // Ensure formState1 has fewer or equal rows compared to formState2
  // formState1 should always be the default values for the check so that it does not consider extra rows present in formState2
  if (formState1.weeklyTimeRows.length > formState2.weeklyTimeRows.length) {
    return false;
  }

  return formState1.weeklyTimeRows.every((row, index) =>
    areWeeklyTimeRowsEqual(row, formState2.weeklyTimeRows[index]),
  );
};

export const isAWeeklyTimeFormDirty = (
  formState: FormState<WeeklyTimeFormState>,
): boolean => formState.isDirty;

export const isARowMissingDurations = (formState: WeeklyTimeFormState) =>
  formState.weeklyTimeRows.some((row) =>
    row.durations.every((duration) => duration.duration === 0),
  );
