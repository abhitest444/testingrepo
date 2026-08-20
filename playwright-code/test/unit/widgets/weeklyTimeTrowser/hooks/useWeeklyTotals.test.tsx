import dayjs from 'dayjs';
import {
  calculateRowSum,
  getRowTimeTotal,
  useColumnTotals,
  useRowTimeTotal,
  returnRoundedOffDurations,
  useTotalTime,
  useTotalBillable,
  useRowBillableTotal,
  getTotalHoursForWeek,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTotals';
import { renderHookWithFormProvider } from 'test/unit/testUtils';
import { WeeklyTimeRowDurationState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';

describe('returnRoundedOffDurations', () => {
  const dateValue = new Date(2024, 12, 14);
  const dayValue = dayjs(dateValue);
  test.each([
    {
      durations: [
        { day: dayValue, duration: 89999, version: '0' },
        { day: dayValue, duration: 90001, version: '0' },
      ],
      expectedDurations: [
        { day: dayValue, duration: 90000, version: '0' },
        { day: dayValue, duration: 90000, version: '0' },
      ],
    },
    {
      durations: [
        { day: dayValue, duration: 25420, version: '0' },
        { day: dayValue, duration: 28850, version: '0' },
      ],
      expectedDurations: [
        { day: dayValue, duration: 25440, version: '0' },
        { day: dayValue, duration: 28860, version: '0' },
      ],
    },
    {
      durations: [{ day: dayValue, duration: null, version: '0' }],
      expectedDurations: [{ day: dayValue, duration: null, version: '0' }],
    },
    {
      durations: [],
      expectedDurations: [],
    },
  ])(
    'should calculate the correct sum for given durations',
    ({ durations, expectedDurations }) => {
      const result = returnRoundedOffDurations(durations);
      expect(result).toEqual(expectedDurations);
    },
  );
});

describe('calculateRowSum', () => {
  test.each([
    {
      durations: [
        { day: dayjs(), duration: 3600, version: '0' },
        { day: dayjs(), duration: 1800, version: '0' },
      ],
      expectedSum: 5400,
    },
    {
      durations: [
        { day: dayjs(), duration: null, version: '0' },
        { day: dayjs(), duration: null, version: '0' },
      ],
      expectedSum: 0,
    },
    {
      durations: [
        { day: dayjs(), duration: 7200, version: '0' },
        { day: dayjs(), duration: 3600, version: '0' },
        { day: dayjs(), duration: 3600, version: '0' },
      ],
      expectedSum: 14400,
    },
    {
      durations: [],
      expectedSum: 0,
    },
  ])(
    'should calculate the correct sum for given durations',
    ({ durations, expectedSum }) => {
      const result = calculateRowSum(durations);
      expect(result).toBe(expectedSum);
    },
  );
});

describe('getRowTimeTotal', () => {
  test.each([
    {
      description: 'should return 0 for an empty array',
      durations: [] as WeeklyTimeRowDurationState[],
      expected: 0,
    },
    {
      description: 'should return 0 for an array with null durations',
      durations: [
        { day: dayjs(), duration: null, version: '0' },
        { day: dayjs(), duration: null, version: '0' },
      ],
      expected: 0,
    },
    {
      description: 'should return the correct total for positive durations',
      durations: [
        { day: dayjs(), duration: 3600, version: '0' },
        { day: dayjs(), duration: 1800, version: '0' },
      ],
      expected: 5400,
    },
    {
      description: 'should handle a single duration correctly',
      durations: [{ day: dayjs(), duration: 7200, version: '0' }],
      expected: 7200,
    },
    {
      description: 'should handle mixed zero and positive durations',
      durations: [
        { day: dayjs(), duration: 0, version: '0' },
        { day: dayjs(), duration: 3600, version: '0' },
        { day: dayjs(), duration: 0, version: '0' },
        { day: dayjs(), duration: 1800, version: '0' },
      ],
      expected: 5400,
    },
  ])('$description', ({ durations, expected }) => {
    const result = getRowTimeTotal(durations);
    expect(result).toBe(expected);
  });
});

describe('useRowTimeTotal', () => {
  test.each([
    {
      mockDurations: [
        { day: dayjs().day(1), duration: 2, version: '0' },
        { day: dayjs().day(2), duration: 3, version: '0' },
        { day: dayjs().day(3), duration: 4, version: '0' },
      ],
      expectedTotal: 9,
    },
    {
      mockDurations: [
        { day: dayjs().day(1), duration: 1, version: '0' },
        { day: dayjs().day(2), duration: 2, version: '0' },
        { day: dayjs().day(3), duration: 3, version: '0' },
      ],
      expectedTotal: 6,
    },
  ])(
    'should calculate the total duration excluding hidden weekdays',
    ({ mockDurations, expectedTotal }) => {
      const { result } = renderHookWithFormProvider(() => useRowTimeTotal(0), {
        defaultValues: {
          weeklyTimeRows: [{ durations: mockDurations }],
        },
      });

      expect(result.current).toBe(expectedTotal);
    },
  );
});

describe('useColumnTotals', () => {
  const { result } = renderHookWithFormProvider(() => useColumnTotals(), {
    defaultValues: {
      weeklyTimeRows: [
        {
          durations: [
            { day: dayjs().day(1), duration: 3600, version: '0' },
            { day: dayjs().day(2), duration: 0, version: '0' },
            { day: dayjs().day(3), duration: 7200, version: '0' },
          ],
          billRate: 10,
          billable: true,
        },
        {
          durations: [
            { day: dayjs().day(1), duration: 3600, version: '0' },
            { day: dayjs().day(2), duration: 0, version: '0' },
            { day: dayjs().day(3), duration: 7200, version: '0' },
          ],
          billRate: 11,
          billable: true,
        },
        {
          durations: [
            { day: dayjs().day(1), duration: 3600, version: '0' },
            { day: dayjs().day(2), duration: 0, version: '0' },
            { day: dayjs().day(3), duration: 7200, version: '0' },
          ],
          billRate: null,
          billable: true,
        },
        {
          durations: [
            { day: dayjs().day(1), duration: 3600, version: '0' },
            { day: dayjs().day(2), duration: 0, version: '0' },
            { day: dayjs().day(3), duration: 7200, version: '0' },
          ],
          billRate: null,
          billable: false,
        },
      ],
    },
  });
  expect(result.current.columnTotals).toEqual([14400, 0, 28800, 0, 0, 0, 0]);
  expect(result.current.totalHours).toEqual(43200);
  expect(result.current.totalBillableAmount).toEqual(63);
});

describe('useTotalTime', () => {
  test('should calculate the total time correctly', () => {
    const { result } = renderHookWithFormProvider(() => useTotalTime(), {
      defaultValues: {
        weeklyTimeRows: [
          {
            durations: [
              { day: dayjs().day(1), duration: 3600, version: '0' },
              { day: dayjs().day(2), duration: 1800, version: '0' },
            ],
          },
          {
            durations: [
              { day: dayjs().day(1), duration: 7200, version: '0' },
              { day: dayjs().day(2), duration: 3600, version: '0' },
            ],
          },
        ],
      },
    });

    expect(result.current).toBe(16200);
  });
});

describe('useTotalBillable', () => {
  test('should calculate the total billable amount correctly', () => {
    const { result } = renderHookWithFormProvider(() => useTotalBillable(), {
      defaultValues: {
        weeklyTimeRows: [
          {
            durations: [
              { day: dayjs().day(1), duration: 3600, version: '0' },
              { day: dayjs().day(2), duration: 7200, version: '0' },
            ],
            billRate: 10,
            billable: true,
          },
          {
            durations: [
              { day: dayjs().day(1), duration: 7200, version: '0' },
              { day: dayjs().day(2), duration: 3600, version: '0' },
            ],
            billRate: 20,
            billable: true,
          },
          {
            durations: [
              { day: dayjs().day(1), duration: 5400, version: '0' },
              { day: dayjs().day(2), duration: 1800, version: '0' },
            ],
            billRate: null,
            billable: true,
          },
        ],
      },
    });

    expect(result.current).toBe(90);
  });
});

describe('useRowBillableTotal', () => {
  test('should calculate the row billable total correctly', () => {
    const { result } = renderHookWithFormProvider(
      () => useRowBillableTotal(0),
      {
        defaultValues: {
          weeklyTimeRows: [
            {
              durations: [
                { day: dayjs().day(1), duration: 3600, version: '0' },
                { day: dayjs().day(2), duration: 1800, version: '0' },
              ],
              billRate: 10,
              billable: true,
            },
          ],
        },
      },
    );

    expect(result.current).toBe(15);
  });

  test('should calculate the row billable total correctly considering non-billable team member', () => {
    const { result } = renderHookWithFormProvider(
      () => useRowBillableTotal(0),
      {
        defaultValues: {
          weeklyTimeRows: [
            {
              durations: [
                { day: dayjs().day(1), duration: 3600, version: '0' },
                { day: dayjs().day(2), duration: 1800, version: '0' },
              ],
              billRate: null,
              billable: false,
            },
          ],
        },
      },
    );

    expect(result.current).toBe(0);
  });
});

describe('getTotalHoursForWeek', () => {
  test('should calculate the total hours for a week correctly', () => {
    const columnTotals = [3600, 1800, 7200, 3600, 0, 0, 0];
    const result = getTotalHoursForWeek(columnTotals);
    expect(result).toBe(16200);
  });
});
