import { useForm } from 'react-hook-form';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo } from 'react';
import { Week } from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';
import {
  TimeForFormState,
  TimeForType,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import {
  getWeeklyTimeRowFormState,
  WeeklyTimeRowState,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';

const DEFAULT_ROWS_COUNT = 3;
export interface WeeklyTimeFormState {
  timeFor: TimeForFormState;
  week: Week;
  weeklyTimeRows: WeeklyTimeRowState[];
  closedBookPassword?: string;
}

// Add 3 rows by default
export const addAdditionalWeeklyRows = (
  existingRows: WeeklyTimeRowState[],
  startOfWeek: Dayjs,
): WeeklyTimeRowState[] => {
  if (existingRows.length >= DEFAULT_ROWS_COUNT) {
    return existingRows;
  }
  // Calculate the number of additional rows needed to make a total of 3

  const additionalRowsNeeded = DEFAULT_ROWS_COUNT - existingRows.length;

  const additionalRows = Array.from({ length: additionalRowsNeeded }, () =>
    getWeeklyTimeRowFormState(startOfWeek),
  );
  // Combine existing rows with additional empty rows
  return [...existingRows, ...additionalRows];
};

export const getWeeklyTimeFormDefaultValues = (
  firstDayOfWeek: number, // Default to Sunday if not provided
  values?: Partial<WeeklyTimeFormState>,
): WeeklyTimeFormState => {
  const today = dayjs();
  let daysToSub = (today.day() - firstDayOfWeek + 7) % 7;
  daysToSub = daysToSub === 0 && today.day() !== firstDayOfWeek ? 7 : daysToSub;
  const startOfWeek = today.subtract(daysToSub, 'day');
  const endOfWeek = startOfWeek.add(6, 'days');

  const week: Week = {
    startDate: values?.week?.startDate || startOfWeek,
    endDate: values?.week?.endDate || endOfWeek,
  };

  const timeFor: TimeForFormState = {
    id: values?.timeFor?.id || '',
    type: values?.timeFor?.type || TimeForType.EMPLOYEE,
    name: values?.timeFor?.name || '',
  };

  const weeklyTimeRowsArg: WeeklyTimeRowState[] = values?.weeklyTimeRows || [];

  const weeklyTimeRowsOnRenderState = addAdditionalWeeklyRows(
    weeklyTimeRowsArg,
    week.startDate,
  );
  return {
    timeFor,
    week,
    weeklyTimeRows: weeklyTimeRowsOnRenderState,
    closedBookPassword: '',
  };
};

export const useWeeklyTimeForm = (
  initialValues?: Partial<WeeklyTimeFormState>,
  firstDayOfWeek: number = 0,
) => {
  // Memoize the default values to avoid recalculating them on every render
  const defaultValues = useMemo(
    () => getWeeklyTimeFormDefaultValues(firstDayOfWeek, initialValues),
    [
      initialValues?.timeFor,
      initialValues?.week,
      firstDayOfWeek,
      initialValues?.weeklyTimeRows,
    ],
  );

  return useForm<WeeklyTimeFormState>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues,
  });
};
