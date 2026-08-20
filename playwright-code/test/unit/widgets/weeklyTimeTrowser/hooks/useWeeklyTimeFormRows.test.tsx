import { act } from '@testing-library/react-hooks';
import dayjs from 'dayjs';
import { renderHookWithFormProvider } from 'test/unit/testUtils';

import {
  getWeekdaysWithDurations,
  getWeeklyTimeRowFormState,
  setJobCostingDetails,
  useWeeklyTimeFormRows,
  WeeklyTimeRowState,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';

describe('useWeeklyTimeFormRows', () => {
  it('should initialize with empty weeklyTimeRows', () => {
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: 1,
          costRate: 1,
          isEmployeeOrVendorBillable: false,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [],
        },
      },
    );

    expect(result.current.weeklyTimeRows).toHaveLength(0);
  });

  it('should append a new row', () => {
    const startOfWeek = dayjs('2023-01-01');
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: 1,
          costRate: 1,
          isEmployeeOrVendorBillable: false,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [],
        },
      },
    );

    act(() => {
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
    });

    expect(result.current.weeklyTimeRows).toHaveLength(1);
  });

  it('should remove a row', () => {
    const startOfWeek = dayjs('2023-01-01');
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: 1,
          costRate: 0,
          isEmployeeOrVendorBillable: false,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [],
        },
      },
    );

    act(() => {
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.removeWeeklyTimeRow(0, startOfWeek);
    });

    expect(result.current.weeklyTimeRows).toHaveLength(0);
  });

  it('should clear all rows with billable and billRate', () => {
    const startOfWeek = dayjs('2023-01-01');
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: 1,
          costRate: 1,
          isEmployeeOrVendorBillable: false,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [],
        },
      },
    );

    act(() => {
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.clearAllRows(startOfWeek);
    });

    expect(result.current.weeklyTimeRows).toHaveLength(3);
    expect(result.current.weeklyTimeRows[0].billRate).toBe(1);
    expect(result.current.weeklyTimeRows[0].costRate).toBe(1);
    expect(result.current.weeklyTimeRows[0].billable).toBe(true);
  });

  it('should clear all rows with billable false', () => {
    const startOfWeek = dayjs('2023-01-01');
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: null,
          costRate: null,
          isEmployeeOrVendorBillable: false,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [],
        },
      },
    );

    act(() => {
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.clearAllRows(startOfWeek);
      result.current.removeWeeklyTimeRow(0, startOfWeek);
    });

    expect(result.current.weeklyTimeRows).toHaveLength(2);
    expect(result.current.weeklyTimeRows[0].billRate).toBe(null);
    expect(result.current.weeklyTimeRows[0].costRate).toBe(null);
    expect(result.current.weeklyTimeRows[0].billable).toBe(false);
  });

  it('should clear all rows with billable false when billRate is 0 (testing ?? 0 fallback)', () => {
    const startOfWeek = dayjs('2023-01-01');
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: 0,
          costRate: 0,
          isEmployeeOrVendorBillable: false,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [],
        },
      },
    );

    act(() => {
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.clearAllRows(startOfWeek);
    });

    expect(result.current.weeklyTimeRows).toHaveLength(3);
    expect(result.current.weeklyTimeRows[0].billRate).toBe(0);
    expect(result.current.weeklyTimeRows[0].costRate).toBe(0);
    expect(result.current.weeklyTimeRows[0].billable).toBe(false);
  });

  it('should handle undefined billRate with ?? 0 fallback', () => {
    const startOfWeek = dayjs('2023-01-01');
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: undefined as any,
          costRate: undefined as any,
          isEmployeeOrVendorBillable: false,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [],
        },
      },
    );

    act(() => {
      result.current.clearAllRows(startOfWeek);
    });

    expect(result.current.weeklyTimeRows).toHaveLength(3);
    expect(result.current.weeklyTimeRows[0].billRate).toBe(undefined);
    expect(result.current.weeklyTimeRows[0].costRate).toBe(undefined);
    // undefined ?? 0 = 0, and 0 > 0 is false, so billable should be false
    expect(result.current.weeklyTimeRows[0].billable).toBe(false);
  });

  it('should clear all rows with billable false in case of non-empty weeklyTimeRows', () => {
    const startOfWeek = dayjs('2023-01-01');
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: 5,
          costRate: 5,
          isEmployeeOrVendorBillable: false,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [
            {
              timeAgainst: {
                customer: {
                  id: null,
                  name: null,
                },
                project: {
                  id: null,
                  name: null,
                },
              },
              service: {
                id: null,
                name: null,
              },
              location: {
                id: null,
                name: null,
              },
              class: {
                id: null,
                name: null,
              },
              notes: '',
              billable: true,
              billableStatus: undefined,
              billRate: 20,
              payType: {
                id: null,
                name: null,
              },
              costRate: 10,
              taxable: false,
              id: 1,
              durations: [],
            },
            {
              timeAgainst: {
                customer: {
                  id: null,
                  name: null,
                },
                project: {
                  id: null,
                  name: null,
                },
              },
              service: {
                id: null,
                name: null,
              },
              location: {
                id: null,
                name: null,
              },
              class: {
                id: null,
                name: null,
              },
              notes: '',
              billable: true,
              billableStatus: undefined,
              billRate: 20,
              payType: {
                id: null,
                name: null,
              },
              costRate: 10,
              taxable: false,
              id: 1,
              durations: [],
            },
            {
              timeAgainst: {
                customer: {
                  id: null,
                  name: null,
                },
                project: {
                  id: null,
                  name: null,
                },
              },
              service: {
                id: null,
                name: null,
              },
              location: {
                id: null,
                name: null,
              },
              class: {
                id: null,
                name: null,
              },
              notes: '',
              billable: true,
              billableStatus: undefined,
              billRate: 20,
              payType: {
                id: null,
                name: null,
              },
              costRate: 10,
              taxable: false,
              id: 1,
              durations: [],
            },
          ],
        },
      },
    );

    act(() => {
      result.current.removeWeeklyTimeRow(0, startOfWeek);
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.clearAllRows(startOfWeek);
    });

    expect(result.current.weeklyTimeRows).toHaveLength(3);
    expect(result.current.weeklyTimeRows[0].billRate).toBe(5);
    expect(result.current.weeklyTimeRows[0].costRate).toBe(5);
    expect(result.current.weeklyTimeRows[0].billable).toBe(true);
    expect(result.current.weeklyTimeRows[1].billRate).toBe(5);
    expect(result.current.weeklyTimeRows[1].costRate).toBe(5);
    expect(result.current.weeklyTimeRows[1].billable).toBe(true);
    expect(result.current.weeklyTimeRows[2].billRate).toBe(5);
    expect(result.current.weeklyTimeRows[2].costRate).toBe(5);
    expect(result.current.weeklyTimeRows[2].billable).toBe(true);
  });

  it('should return unique weekdays when rows contain non-null, non-negative durations', () => {
    const rows = [
      {
        durations: [
          { duration: 2, day: { day: () => 1 } },
          { duration: 3, day: { day: () => 2 } },
        ],
      },
      {
        durations: [
          { duration: 1, day: { day: () => 1 } },
          { duration: null, day: { day: () => 3 } },
        ],
      },
      { durations: [{ duration: 0, day: { day: () => 4 } }] },
    ] as WeeklyTimeRowState[];
    const result = getWeekdaysWithDurations(rows);
    expect(result).toEqual([1, 2, 4]);
  });

  it('should update billable status for the specified row index', () => {
    const setValue = jest.fn();
    const rowIndex = 1;
    const jobCostingDetails = { billable: true, billRate: 100, costRate: 50 };

    setJobCostingDetails(setValue, { rowIndex, jobCostingDetails });

    expect(setValue).toHaveBeenNthCalledWith(
      1,
      `weeklyTimeRows.${rowIndex}.billable`,
      true,
    );
    expect(setValue).toHaveBeenNthCalledWith(
      2,
      `weeklyTimeRows.${rowIndex}.billRate`,
      100,
    );
    expect(setValue).toHaveBeenNthCalledWith(
      3,
      `weeklyTimeRows.${rowIndex}.costRate`,
      50,
    );
  });

  it('should set billable=true via isEmployeeOrVendorBillable when removing from 3 rows', () => {
    const startOfWeek = dayjs('2023-01-01');
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: null,
          costRate: null,
          isEmployeeOrVendorBillable: true,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [],
        },
      },
    );

    act(() => {
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
    });

    expect(result.current.weeklyTimeRows).toHaveLength(3);

    act(() => {
      result.current.removeWeeklyTimeRow(0, startOfWeek);
    });

    expect(result.current.weeklyTimeRows).toHaveLength(3);
    expect(result.current.weeklyTimeRows[2].billable).toBe(true);
    expect(result.current.weeklyTimeRows[2].billRate).toBe(null);
  });

  it('should set billable=true via billRate when removing from 3 rows with isEmployeeOrVendorBillable=false', () => {
    const startOfWeek = dayjs('2023-01-01');
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: 10,
          costRate: 5,
          isEmployeeOrVendorBillable: false,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [],
        },
      },
    );

    act(() => {
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
    });

    expect(result.current.weeklyTimeRows).toHaveLength(3);

    act(() => {
      result.current.removeWeeklyTimeRow(0, startOfWeek);
    });

    expect(result.current.weeklyTimeRows).toHaveLength(3);
    expect(result.current.weeklyTimeRows[2].billable).toBe(true);
    expect(result.current.weeklyTimeRows[2].billRate).toBe(10);
  });

  it('should set billable=false when removing from 3 rows with isEmployeeOrVendorBillable=false and billRate=null', () => {
    const startOfWeek = dayjs('2023-01-01');
    const { result } = renderHookWithFormProvider(
      () =>
        useWeeklyTimeFormRows({
          billRate: null,
          costRate: null,
          isEmployeeOrVendorBillable: false,
        }),
      {
        defaultValues: {
          weeklyTimeRows: [],
        },
      },
    );

    act(() => {
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
      result.current.appendWeeklyTimeRow(
        getWeeklyTimeRowFormState(startOfWeek),
      );
    });

    expect(result.current.weeklyTimeRows).toHaveLength(3);

    act(() => {
      result.current.removeWeeklyTimeRow(0, startOfWeek);
    });

    expect(result.current.weeklyTimeRows).toHaveLength(3);
    expect(result.current.weeklyTimeRows[2].billable).toBe(false);
    expect(result.current.weeklyTimeRows[2].billRate).toBe(null);
  });
});
