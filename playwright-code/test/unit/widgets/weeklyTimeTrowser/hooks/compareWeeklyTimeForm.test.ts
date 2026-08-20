import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import dayjs from 'dayjs';
import {
  useWeeklyTimeForm,
  WeeklyTimeFormState,
  getWeeklyTimeFormDefaultValues,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import {
  areDurationsEqual,
  areWeeklyTimeFormStatesEqual,
  areWeeklyTimeRowsEqual,
  isARowMissingDurations,
  isAWeeklyTimeFormDirty,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/compareWeeklyTimeForm';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import {
  WeeklyTimeRowDurationState,
  WeeklyTimeRowState,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';

describe('areDurationsEqual', () => {
  it('should return true for equal durations', () => {
    const durations1: WeeklyTimeRowDurationState[] = [
      {
        duration: 3600,
        day: dayjs('2023-10-01'),
        version: '0',
      },
      { duration: 7200, day: dayjs('2023-10-02'), version: '0' },
    ];
    const durations2: WeeklyTimeRowDurationState[] = [
      { duration: 3600, day: dayjs('2023-10-01'), version: '0' },
      { duration: 7200, day: dayjs('2023-10-02'), version: '0' },
    ];
    expect(areDurationsEqual(durations1, durations2)).toBe(true);
  });

  it('should return false for different durations', () => {
    const durations1: WeeklyTimeRowDurationState[] = [
      { duration: 3600, day: dayjs('2023-10-01'), version: '0' },
    ];
    const durations2: WeeklyTimeRowDurationState[] = [
      { duration: 1800, day: dayjs('2023-10-01'), version: '0' },
    ];
    expect(areDurationsEqual(durations1, durations2)).toBe(false);
  });

  it('should return false for different days', () => {
    const durations1: WeeklyTimeRowDurationState[] = [
      { duration: 3600, day: dayjs('2023-10-01'), version: '0' },
    ];
    const durations2: WeeklyTimeRowDurationState[] = [
      { duration: 3600, day: dayjs('2023-10-02'), version: '0' },
    ];
    expect(areDurationsEqual(durations1, durations2)).toBe(false);
  });
});

describe('areWeeklyTimeRowsEqual', () => {
  it('should return true for equal weekly time rows', () => {
    const row1: WeeklyTimeRowState = {
      timeAgainst: {
        customer: {
          id: 'Customer A',
          name: '',
        },
        project: {
          id: 'Project A',
          name: '',
        },
      },
      // customer: {
      //   id: 'Customer A',
      //   name: '',
      // },
      // project: {
      //   id: 'Project A',
      //   name: '',
      // },
      service: {
        id: 'Service A',
        name: '',
      },
      location: {
        id: 'Location A',
        name: '',
      },
      class: {
        id: 'Class A',
        name: '',
      },
      payType: {
        id: 'Hourly',
        name: '',
      },
      notes: 'Notes A',
      billable: true,
      billRate: 100,
      billableStatus: TimeTracking_BillableStatus.Billable,
      costRate: 50,
      taxable: true,
      id: 1,
      durations: [
        { duration: 3600, day: dayjs('2023-10-01'), version: '0' },
        {
          duration: 3600,
          day: dayjs('2023-10-02'),
          version: '0',
        },
        { duration: 3600, day: dayjs('2023-10-03'), version: '0' },
        { duration: 3600, day: dayjs('2023-10-04'), version: '0' },
        {
          duration: 3600,
          day: dayjs('2023-10-05'),
          version: '0',
        },
        { duration: 3600, day: dayjs('2023-10-06'), version: '0' },
        { duration: 3600, day: dayjs('2023-10-07'), version: '0' },
      ],
    };
    const row2: WeeklyTimeRowState = { ...row1 };
    expect(areWeeklyTimeRowsEqual(row1, row2)).toBe(true);
  });

  it('should return false for different weekly time rows', () => {
    const row1: WeeklyTimeRowState = {
      timeAgainst: {
        customer: null,
        project: {
          id: 'Project A',
          name: '',
        },
      },
      // customer: {
      //   id: 'Customer A',
      //   name: '',
      // },
      // project: {
      //   id: 'Project A',
      //   name: '',
      // },
      service: {
        id: 'Service A',
        name: '',
      },
      location: {
        id: 'Location A',
        name: '',
      },
      class: {
        id: 'Class A',
        name: '',
      },
      payType: {
        id: 'Hourly',
        name: '',
      },
      notes: 'Notes A',
      billable: true,
      billableStatus: TimeTracking_BillableStatus.Billable,
      billRate: 100,
      costRate: 50,
      taxable: true,
      id: 1,
      durations: [
        { duration: 3600, day: dayjs('2023-10-01'), version: '0' },
        {
          duration: 3600,
          day: dayjs('2023-10-02'),
          version: '0',
        },
        { duration: 3600, day: dayjs('2023-10-03'), version: '0' },
        { duration: 3600, day: dayjs('2023-10-04'), version: '0' },
        {
          duration: 3600,
          day: dayjs('2023-10-05'),
          version: '0',
        },
        { duration: 3600, day: dayjs('2023-10-06'), version: '0' },
        { duration: 3600, day: dayjs('2023-10-07'), version: '0' },
      ],
    };
    const row2: WeeklyTimeRowState = {
      ...row1,
      class: {
        id: 'Class B',
        name: '',
      },
    };
    expect(areWeeklyTimeRowsEqual(row1, row2)).toBe(false);
  });
});

describe('areWeeklyTimeFormStatesEqual', () => {
  it('should return true for equal weekly time form states', () => {
    const formState1: WeeklyTimeFormState = {
      timeFor: { id: '1', type: TimeForType.EMPLOYEE, name: '' },
      week: {
        startDate: dayjs('2023-10-01'),
        endDate: dayjs('2023-10-07'),
      },
      weeklyTimeRows: [
        {
          timeAgainst: {
            customer: {
              id: 'Customer A',
              name: '',
            },
            project: {
              id: 'Project A',
              name: '',
            },
          },
          // customer: {
          //   id: 'Customer A',
          //   name: '',
          // },
          // project: {
          //   id: 'Project A',
          //   name: '',
          // },
          service: {
            id: 'Service A',
            name: '',
          },
          location: {
            id: 'Location A',
            name: '',
          },
          class: {
            id: 'Class A',
            name: '',
          },
          payType: {
            id: 'Hourly',
            name: '',
          },
          notes: 'Notes A',
          billable: true,
          billableStatus: TimeTracking_BillableStatus.Billable,
          billRate: 100,
          costRate: 50,
          taxable: true,
          id: 1,
          durations: [
            { duration: 3600, day: dayjs('2023-10-01'), version: '0' },
            {
              duration: 3600,
              day: dayjs('2023-10-02'),
              version: '0',
            },
            { duration: 3600, day: dayjs('2023-10-03'), version: '0' },
            { duration: 3600, day: dayjs('2023-10-04'), version: '0' },
            {
              duration: 3600,
              day: dayjs('2023-10-05'),
              version: '0',
            },
            { duration: 3600, day: dayjs('2023-10-06'), version: '0' },
            { duration: 3600, day: dayjs('2023-10-07'), version: '0' },
          ],
        },
      ],
    };
    const formState2: WeeklyTimeFormState = { ...formState1 };
    expect(areWeeklyTimeFormStatesEqual(formState1, formState2)).toBe(true);
  });

  it('should return false if first weekly time form state has more weeklyTimeRows', () => {
    const createWeeklyTimeRow = (durations: number[]): WeeklyTimeRowState => ({
      timeAgainst: {
        customer: {
          id: 'Customer A',
          name: '',
        },
        project: {
          id: 'Project A',
          name: '',
        },
      },
      // customer: {
      //   id: 'Customer A',
      //   name: '',
      // },
      // project: {
      //   id: 'Project A',
      //   name: '',
      // },
      service: {
        id: 'Service A',
        name: '',
      },
      location: {
        id: 'Location A',
        name: '',
      },
      class: {
        id: 'Class A',
        name: '',
      },
      payType: {
        id: 'Hourly',
        name: '',
      },
      notes: 'Test Notes',
      billable: true,
      billableStatus: TimeTracking_BillableStatus.Billable,
      billRate: 100,
      costRate: 50,
      taxable: false,
      id: 1,
      durations: durations.map((duration, index) => ({
        duration,
        day: dayjs().add(index, 'days'),
        version: '0',
      })),
    });

    const formState2: WeeklyTimeFormState = {
      timeFor: { id: '1', type: TimeForType.EMPLOYEE, name: '' },
      week: {
        startDate: dayjs('2023-10-01'),
        endDate: dayjs('2023-10-07'),
      },
      weeklyTimeRows: [
        {
          timeAgainst: {
            customer: {
              id: 'Customer A',
              name: '',
            },
            project: {
              id: 'Project A',
              name: '',
            },
          },
          // customer: {
          //   id: 'Customer A',
          //   name: '',
          // },
          // project: {
          //   id: 'Project A',
          //   name: '',
          // },
          service: {
            id: 'Service A',
            name: '',
          },
          location: {
            id: 'Location A',
            name: '',
          },
          class: {
            id: 'Class A',
            name: '',
          },
          payType: {
            id: 'Hourly',
            name: '',
          },
          notes: 'Notes A',
          billable: true,
          billableStatus: TimeTracking_BillableStatus.Billable,
          billRate: 100,
          costRate: 50,
          taxable: true,
          id: 1,
          durations: [
            { duration: 3600, day: dayjs('2023-10-01'), version: '0' },
            {
              duration: 3600,
              day: dayjs('2023-10-02'),
              version: '0',
            },
            { duration: 3600, day: dayjs('2023-10-03'), version: '0' },
            { duration: 3600, day: dayjs('2023-10-04'), version: '0' },
            {
              duration: 3600,
              day: dayjs('2023-10-05'),
              version: '0',
            },
            { duration: 3600, day: dayjs('2023-10-06'), version: '0' },
            { duration: 3600, day: dayjs('2023-10-07'), version: '0' },
          ],
        },
      ],
    };
    const formState1: WeeklyTimeFormState = {
      ...formState2,
      weeklyTimeRows: [
        createWeeklyTimeRow([0, 0, 0, 0, 0, 0, 0]),
        createWeeklyTimeRow([1, 2, 3, 4, 5, 6, 7]),
      ],
    };
    expect(areWeeklyTimeFormStatesEqual(formState1, formState2)).toBe(false);
  });

  it('should return false for different weekly time form states', () => {
    const formState1: WeeklyTimeFormState = {
      timeFor: { id: '1', type: TimeForType.EMPLOYEE, name: '' },
      week: {
        startDate: dayjs('2023-10-01'),
        endDate: dayjs('2023-10-07'),
      },
      weeklyTimeRows: [
        {
          timeAgainst: {
            customer: {
              id: 'Customer A',
              name: '',
            },
            project: {
              id: 'Project A',
              name: '',
            },
          },
          // customer: {
          //   id: 'Customer A',
          //   name: '',
          // },
          // project: {
          //   id: 'Project A',
          //   name: '',
          // },
          service: {
            id: 'Service A',
            name: '',
          },
          location: {
            id: 'Location A',
            name: '',
          },
          class: {
            id: 'Class A',
            name: '',
          },
          payType: {
            id: 'Hourly',
            name: '',
          },
          notes: 'Notes A',
          billable: true,
          billableStatus: TimeTracking_BillableStatus.Billable,
          billRate: 100,
          costRate: 50,
          taxable: true,
          id: 1,
          durations: [
            { duration: 3600, day: dayjs('2023-10-01'), version: '0' },
            {
              duration: 3600,
              day: dayjs('2023-10-02'),
              version: '0',
            },
            { duration: 3600, day: dayjs('2023-10-03'), version: '0' },
            { duration: 3600, day: dayjs('2023-10-04'), version: '0' },
            {
              duration: 3600,
              day: dayjs('2023-10-05'),
              version: '0',
            },
            { duration: 3600, day: dayjs('2023-10-06'), version: '0' },
            { duration: 3600, day: dayjs('2023-10-07'), version: '0' },
          ],
        },
      ],
    };
    const formState2: WeeklyTimeFormState = {
      ...formState1,
      timeFor: { id: '2', type: TimeForType.EMPLOYEE, name: '' },
    };
    expect(areWeeklyTimeFormStatesEqual(formState1, formState2)).toBe(false);
  });
});

describe('isAWeeklyTimeFormDirty', () => {
  test('should return true when the form is dirty', () => {
    const { result } = renderHook(() => useWeeklyTimeForm());
    act(() => {
      result.current.reset(
        {
          ...getWeeklyTimeFormDefaultValues(0),
          timeFor: { id: '2', type: TimeForType.EMPLOYEE, name: 'John Smith' },
        },
        { keepDefaultValues: true },
      );
    });

    expect(isAWeeklyTimeFormDirty(result.current.formState)).toBe(true);
  });

  test('should return false when the form is not dirty', () => {
    const { result } = renderHook(() => useWeeklyTimeForm());
    expect(isAWeeklyTimeFormDirty(result.current.formState)).toBe(false);
  });
});

describe('isARowMissingDurations', () => {
  const createWeeklyTimeRow = (durations: number[]): WeeklyTimeRowState => ({
    timeAgainst: {
      customer: {
        id: 'Customer A',
        name: '',
      },
      project: {
        id: 'Project A',
        name: '',
      },
    },
    // customer: {
    //   id: 'Customer A',
    //   name: '',
    // },
    // project: {
    //   id: 'Project A',
    //   name: '',
    // },
    service: {
      id: 'Service A',
      name: '',
    },
    location: {
      id: 'Location A',
      name: '',
    },
    class: {
      id: 'Class A',
      name: '',
    },
    payType: {
      id: 'Hourly',
      name: '',
    },
    notes: 'Test Notes',
    billable: true,
    billableStatus: TimeTracking_BillableStatus.Billable,
    billRate: 100,
    costRate: 50,
    taxable: false,
    id: 1,
    durations: durations.map((duration, index) => ({
      duration,
      day: dayjs().add(index, 'days'),
      version: '0',
    })),
  });

  test.each([
    {
      description:
        'should return true when at least one row has all durations set to 0',
      formState: {
        timeFor: { id: '1', type: TimeForType.EMPLOYEE, name: '' },
        week: { startDate: dayjs(), endDate: dayjs().add(6, 'days') },
        weeklyTimeRows: [
          createWeeklyTimeRow([0, 0, 0, 0, 0, 0, 0]),
          createWeeklyTimeRow([1, 2, 3, 4, 5, 6, 7]),
        ],
      },
      expected: true,
    },
    {
      description: 'should return false when no row has all durations set to 0',
      formState: {
        timeFor: { id: '2', type: TimeForType.EMPLOYEE, name: '' },
        week: { startDate: dayjs(), endDate: dayjs().add(6, 'days') },
        weeklyTimeRows: [
          createWeeklyTimeRow([1, 2, 3, 4, 5, 6, 7]),
          createWeeklyTimeRow([1, 0, 0, 0, 0, 0, 0]),
        ],
      },
      expected: false,
    },
    {
      description:
        'should return true when all rows have all durations set to 0',
      formState: {
        timeFor: { id: '3', type: TimeForType.EMPLOYEE, name: '' },
        week: { startDate: dayjs(), endDate: dayjs().add(6, 'days') },
        weeklyTimeRows: [
          createWeeklyTimeRow([0, 0, 0, 0, 0, 0, 0]),
          createWeeklyTimeRow([0, 0, 0, 0, 0, 0, 0]),
        ],
      },
      expected: true,
    },
    {
      description: 'should return false when there are no rows',
      formState: {
        timeFor: { id: '4', type: TimeForType.EMPLOYEE, name: '' },
        week: { startDate: dayjs(), endDate: dayjs().add(6, 'days') },
        weeklyTimeRows: [],
      },
      expected: false,
    },
  ])('$description', ({ formState, expected }) => {
    expect(isARowMissingDurations(formState)).toBe(expected);
  });
});
