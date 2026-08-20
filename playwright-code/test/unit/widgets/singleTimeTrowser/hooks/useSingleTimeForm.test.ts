/* eslint-disable camelcase */

import { act, renderHook } from '@testing-library/react-hooks';
import dayjs from 'dayjs';
import {
  isFormDirty,
  SingleTimeFormState,
  useSingleTimeForm,
  setJobCostingDetails,
} from 'src/js/widgets/singleTimeTrowser/hooks/useSingleTimeForm';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';

describe('useSingleTimeForm', () => {
  it('should initialize form with default values', () => {
    const { result } = renderHook(() => useSingleTimeForm());

    const { getValues } = result.current;

    // just check one field
    expect(getValues().duration).toEqual(null);
  });

  it('should update form values correctly', () => {
    const { result } = renderHook(() => useSingleTimeForm());

    const { setValue, getValues } = result.current;

    act(() => {
      setValue('class', {
        id: 'New Class',
        name: '',
      });
      setValue('billRate', 100.5);
      setValue('startTime', dayjs('2023-10-10T08:00:00'));
    });

    expect(getValues().class).toStrictEqual({
      id: 'New Class',
      name: '',
    });
    expect(getValues().billRate).toBe(100.5);
    expect(getValues().startTime!.format('HH:mm')).toBe('08:00');
  });

  it('should update form values correctly - nullable start and end time', () => {
    const { result } = renderHook(() => useSingleTimeForm());

    const { setValue, getValues } = result.current;

    act(() => {
      setValue('class', {
        id: 'New Class',
        name: '',
      });
      setValue('billRate', 100.5);
    });

    expect(getValues().class).toStrictEqual({
      id: 'New Class',
      name: '',
    });
    expect(getValues().billRate).toBe(100.5);
    expect(getValues().startTime).toBe(undefined);
    expect(getValues().endTime).toBe(undefined);
  });

  it('should handle toggleClockIn correctly', () => {
    const { result } = renderHook(() => useSingleTimeForm());

    const { setValue, getValues } = result.current;

    act(() => {
      setValue('toggleClockIn', true);
    });

    expect(getValues().toggleClockIn).toBe(true);
  });

  it('should handle toggleBreak correctly', () => {
    const { result } = renderHook(() => useSingleTimeForm());

    const { setValue, getValues } = result.current;

    act(() => {
      setValue('toggleBreak', true);
    });

    expect(getValues().toggleBreak).toBe(true);
  });

  it('should initialize with isLocked as false by default', () => {
    const { result } = renderHook(() => useSingleTimeForm());
    expect(result.current.getValues().isLocked).toBe(false);
  });

  it('should allow setting isLocked to true', () => {
    const { result } = renderHook(() => useSingleTimeForm());
    act(() => {
      result.current.setValue('isLocked', true);
    });
    expect(result.current.getValues().isLocked).toBe(true);
  });

  it('should reset isLocked when form is reset', () => {
    const { result } = renderHook(() => useSingleTimeForm());
    act(() => {
      result.current.setValue('isLocked', true);
    });
    expect(result.current.getValues().isLocked).toBe(true);

    act(() => {
      result.current.reset({ ...result.current.getValues(), isLocked: false });
    });
    expect(result.current.getValues().isLocked).toBe(false);
  });
});

describe('setJobCostingDetails', () => {
  it('should set job costing details correctly', () => {
    const setValue = jest.fn();
    const jobCostingDetails = {
      billable: true,
      billRate: 150.5,
      costRate: 75.25,
    };

    setJobCostingDetails(setValue, jobCostingDetails);

    expect(setValue).toHaveBeenCalledTimes(3);
    expect(setValue).toHaveBeenCalledWith('billable', true);
    expect(setValue).toHaveBeenCalledWith('billRate', 150.5);
    expect(setValue).toHaveBeenCalledWith('costRate', 75.25);
  });
});

describe('isFormDirty', () => {
  const defaultFormState: SingleTimeFormState = {
    id: '1',
    version: '0',
    timeFor: { id: '1', type: TimeForType.VENDOR, name: 'John Doe' },
    timeAgainst: {
      customer: { id: '1', name: 'Customer A' },
      project: { id: '1', name: 'Project A' },
    },
    toggleClockIn: false,
    toggleBreak: false,
    startDate: dayjs('2023-10-01'),
    startTime: dayjs('2023-10-01T08:00:00'),
    endTime: dayjs('2023-10-01T17:00:00'),
    duration: 32400,
    // customer: { id: '1', name: 'Customer A' },
    // project: { id: '1', name: 'Project A' },
    service: { id: '1', name: 'Service A' },
    class: { id: '1', name: 'Class A' },
    location: { id: '1', name: 'Location A' },
    billable: true,
    billableStatus: TimeTracking_BillableStatus.Billable,
    billRate: 100,
    notes: 'Some notes',
    breakDuration: 3600,
    payType: { id: '1', name: 'Pay Type A' },
    costRate: 50,
    taxable: true,
    closedBookPassword: 'password123',
  };

  describe('isFormDirty', () => {
    test.each([
      ['id', { ...defaultFormState, id: '2' }],
      ['version', { ...defaultFormState, version: '1' }],
      [
        'timeFor.id',
        {
          ...defaultFormState,
          timeFor: { ...defaultFormState.timeFor, id: '2' },
        },
      ],
      ['toggleClockIn', { ...defaultFormState, toggleClockIn: true }],
      ['toggleBreak', { ...defaultFormState, toggleBreak: true }],
      ['startDate', { ...defaultFormState, startDate: dayjs('2023-10-02') }],
      [
        'startTime',
        { ...defaultFormState, startTime: dayjs('2023-10-01T09:00:00') },
      ],
      [
        'endTime',
        { ...defaultFormState, endTime: dayjs('2023-10-01T18:00:00') },
      ],
      ['duration', { ...defaultFormState, duration: 36000 }],
      // [
      //   'customer.id',
      //   {
      //     ...defaultFormState,
      //     customer: { ...defaultFormState.customer, id: '2' },
      //   },
      // ],
      // [
      //   'project.id',
      //   {
      //     ...defaultFormState,
      //     project: { ...defaultFormState.project, id: '2' },
      //   },
      // ],
      [
        'service.id',
        {
          ...defaultFormState,
          service: { ...defaultFormState.service, id: '2' },
        },
      ],
      [
        'class.id',
        { ...defaultFormState, class: { ...defaultFormState.class, id: '2' } },
      ],
      [
        'location.id',
        {
          ...defaultFormState,
          location: { ...defaultFormState.location, id: '2' },
        },
      ],
      ['billable', { ...defaultFormState, billable: false }],
      [
        'billableStatus',
        {
          ...defaultFormState,
          billableStatus: TimeTracking_BillableStatus.NotBillable,
        },
      ],
      ['billRate', { ...defaultFormState, billRate: 150 }],
      ['notes', { ...defaultFormState, notes: 'Different notes' }],
      ['breakDuration', { ...defaultFormState, breakDuration: 7200 }],
      [
        'payType.id',
        {
          ...defaultFormState,
          payType: { ...defaultFormState.payType, id: '2' },
        },
      ],
      ['costRate', { ...defaultFormState, costRate: 60 }],
      ['taxable', { ...defaultFormState, taxable: false }],
      [
        'closedBookPassword',
        { ...defaultFormState, closedBookPassword: 'newpassword' },
      ],
    ])('should return true when %s is different', (_, modifiedFormState) => {
      const { result } = renderHook(() => useSingleTimeForm());
      act(() => {
        result.current.reset(modifiedFormState, { keepDefaultValues: true });
      });

      expect(isFormDirty(result.current.formState)).toBe(true);
    });

    test('should return false when formState is identical to defaultFormState', () => {
      const { result } = renderHook(() => useSingleTimeForm());
      expect(isFormDirty(result.current.formState)).toBe(false);
    });
  });
});
