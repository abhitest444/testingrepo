import React, { useMemo } from 'react';
import { Dayjs } from 'dayjs';
import { useIntl, useSandbox } from '@payroll/quicksand';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import { getDateFormat } from 'src/js/common/DateAndTimeUtils';

const NUMBER_OF_WEEKS_AROUND_CURRENT_WEEK = 52;

export interface Week {
  startDate: Dayjs;
  endDate: Dayjs;
}

export interface WeekSelectorProps {
  startDate: Dayjs;
  value: Week;
  onChange: (value: Week) => void;
  width?: number;
}

export const getWeekStartAndEndDates = (date: Dayjs): Week => ({
  startDate: date,
  endDate: date.add(6, 'days'),
});

export const getWeeksAroundDate = (
  startDate: Dayjs,
  weeksAround: number,
): Week[] =>
  Array.from({ length: 2 * weeksAround + 1 }, (_, i) =>
    getWeekStartAndEndDates(startDate.add((i - weeksAround) * 7, 'days')),
  );

export const findWeekIndex = (weekToFind: Week, weeks: Week[]) =>
  weeks.findIndex(
    (week) =>
      week.startDate.isSame(weekToFind.startDate, 'day') &&
      week.endDate.isSame(weekToFind.endDate, 'day'),
  );

export const WeekSelector = ({
  startDate,
  value,
  onChange,
  width,
}: WeekSelectorProps) => {
  // -------------------------------- context hooks
  const sandbox = useSandbox();
  const intl = useIntl();
  const dateFormat = getDateFormat(sandbox).toUpperCase();

  // -------------------------------- component state hooks
  const weeks = useMemo(
    () => getWeeksAroundDate(startDate, NUMBER_OF_WEEKS_AROUND_CURRENT_WEEK),
    [startDate],
  );
  const weekIndexValue = findWeekIndex(value, weeks);

  // -------------------------------- component interaction handlers
  const handleWeekChange = (e: KeyboardEvent | MouseEvent) => {
    const selectedWeekIndexValue = (e.target as HTMLSelectElement)
      .value as unknown as number;
    onChange(weeks[selectedWeekIndexValue]);
  };

  return (
    <Dropdown
      // @ts-ignore
      onChange={handleWeekChange}
      value={weekIndexValue}
      label={intl.formatMessage({
        id: 'select.a.week',
      })}
      width={width}
    >
      {weeks.map((week, index) => (
        <MenuItem
          key={week.startDate.toString()}
          value={index}
        >{`${week.startDate.format(dateFormat)} ${intl.formatMessage({
          id: 'to',
        })} ${week.endDate.format(dateFormat)}`}</MenuItem>
      ))}
    </Dropdown>
  );
};
