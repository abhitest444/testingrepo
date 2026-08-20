import { renderHook } from '@testing-library/react-hooks';
import dayjs from 'dayjs';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import {
  useWeeklyTimeForm,
  addAdditionalWeeklyRows,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import { getWeeklyTimeRowFormState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';

describe('useWeeklyTimeForm', () => {
  it('should initialize form with default values', () => {
    const { result } = renderHook(() => useWeeklyTimeForm());

    const { getValues } = result.current;
    // const startOfWeek = dayjs('2024-01-01').day(0);

    // expect(getValues().week.startDate.format('YYYY-MM-DD')).toBe(
    //   startOfWeek.format('YYYY-MM-DD'),
    // );
    // expect(getValues().week.endDate.format('YYYY-MM-DD')).toBe(
    //   startOfWeek.add(6, 'days').format('YYYY-MM-DD'),
    // );
    expect(getValues().weeklyTimeRows).toHaveLength(3);
  });

  it('should initialize form with initial values', () => {
    const { result } = renderHook(() =>
      useWeeklyTimeForm({
        timeFor: {
          id: '1',
          name: 'Siddharth',
          type: TimeForType.VENDOR,
        },
        week: {
          startDate: dayjs('2025-03-10T20:00:00'),
          endDate: dayjs('2025-03-14T20:00:00'),
        },
        weeklyTimeRows: [],
      }),
    );

    const { getValues } = result.current;
    expect(getValues().timeFor).toEqual({
      id: '1',
      name: 'Siddharth',
      type: TimeForType.VENDOR,
    });
    expect(getValues().weeklyTimeRows).toHaveLength(3);
  });

  it('should return existing rows when there are already 3 or more', () => {
    const existingRows = [
      getWeeklyTimeRowFormState(dayjs()),
      getWeeklyTimeRowFormState(dayjs().add(1, 'day')),
      getWeeklyTimeRowFormState(dayjs().add(2, 'day')),
    ];
    const startOfWeek = dayjs();
    const result = addAdditionalWeeklyRows(existingRows, startOfWeek);
    expect(result).toEqual(existingRows);
  });

  it('should add 3 rows when existingRows is empty', () => {
    const existingRows: ReturnType<typeof getWeeklyTimeRowFormState>[] = [];
    const startOfWeek = dayjs();
    const result = addAdditionalWeeklyRows(existingRows, startOfWeek);
    expect(result.length).toBe(3);
    result.forEach((row) => {
      expect(row.durations[0].day.isSame(startOfWeek)).toBe(true);
    });
  });

  it('should add rows when existingRows length is less than 3', () => {
    const startOfWeek = dayjs();
    const existingRows = [getWeeklyTimeRowFormState(startOfWeek)];
    const result = addAdditionalWeeklyRows(existingRows, startOfWeek);
    expect(result.length).toBe(3);
    result.forEach((row) => {
      expect(row.durations[0].day.isSame(startOfWeek)).toBe(true);
    });
  });
});
