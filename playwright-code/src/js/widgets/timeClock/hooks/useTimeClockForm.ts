import { FormState, useForm } from 'react-hook-form';
import dayjs, { Dayjs } from 'dayjs';
import { getBrowserTimezone } from 'src/js/common/DateAndTimeUtils';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';
import { TimeAgainstFormState } from '../../common/addTimeFormComponents/CustomerProject';
import {
  TimeForFormState,
  TimeForType,
} from '../../common/addTimeFormComponents/TeamMember';
import { EntityRef } from '../../common/types';
import type { DimensionValue } from '../../common/dimensions/types';

export interface TimeClockFormState {
  id?: string;
  version: string;
  employeeId: string;
  startDate: Dayjs;
  startTime?: Dayjs;
  timeAgainst: TimeAgainstFormState;
  duration: number | null;
  timezone?: string;
  notes: string;
  timeFor: TimeForFormState;
  service: EntityRef;
  class: EntityRef;
  breakId?: string;
  billable: boolean;
  location: EntityRef;
  billableStatus?: TimeTracking_BillableStatus;
  billRate: number | null; // decimal number
  customFields?: Record<
    string,
    {
      id: string;
      name: string;
      value: string;
      required?: boolean;
      deleted?: boolean;
      optionID: string;
    }
  >;
  dimensions?: Record<string, DimensionValue>;
}

export const DEFAULT_TIME_CLOCK_FORM_STATE: TimeClockFormState = {
  id: undefined,
  version: '0',
  employeeId: '',
  startDate: dayjs(),
  startTime: undefined,
  timezone: undefined,
  duration: 0,
  notes: '',
  breakId: undefined,
  timeAgainst: {
    customer: {
      id: '',
      name: '',
    },
    project: {
      id: '',
      name: '',
    },
  },
  service: {
    id: '',
    name: '',
  },
  class: {
    id: '',
    name: '',
  },
  timeFor: {
    id: '',
    type: TimeForType.EMPLOYEE,
    name: '',
  },
  location: {
    id: '',
    name: '',
  },
  billable: false,
  billableStatus: undefined,
  billRate: null,
  customFields: {},
  dimensions: {},
};

export const isFormDirty = (
  formState: FormState<TimeClockFormState>,
): boolean => Object.keys(formState.dirtyFields).length !== 0;

export const useTimeClockForm = () => {
  // Get browser timezone for default values
  const browserTimezone = getBrowserTimezone();
  const defaultValues = {
    ...DEFAULT_TIME_CLOCK_FORM_STATE,
    startDate: dayjs().tz(browserTimezone),
    startTime: dayjs().tz(browserTimezone),
  };

  return useForm<TimeClockFormState>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues,
  });
};
