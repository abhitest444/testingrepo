import { FormState, useForm } from 'react-hook-form';
import dayjs, { Dayjs } from 'dayjs';
import {
  TimeForFormState,
  TimeForType,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';
import { EntityRef, JobCostingDetails } from 'src/js/widgets/common/types';
import type { DimensionValue } from 'src/js/widgets/common/dimensions/types';
import { TimeAgainstFormState } from '../../common/addTimeFormComponents/CustomerProject';

export interface CustomField {
  id: string;
  name: string;
  value?: string;
  optionID?: string; // For dropdown fields - the selected option's ID
  required?: boolean;
  deleted?: boolean;
}

export interface DistanceTracking {
  autoCalculatedMeters: string | null; // stored in miles (converted from meters)
  manualMeters: string | null; // stored in miles (converted from meters)
}

export interface SingleTimeFormState {
  id?: string;
  version: string;
  timeFor: TimeForFormState;
  timeAgainst: TimeAgainstFormState;
  toggleClockIn: boolean;
  toggleBreak: boolean;
  startDate: Dayjs;
  endDate?: Dayjs; // Only used when isOTX and isSingleTimeEntry is true
  startTime?: Dayjs; // use only the time part, the date is not relevant
  endTime?: Dayjs; // use only the time part, the date is not relevant
  duration: number | null; // in seconds
  timezone?: string; // timezone in string
  // customer: EntityRef;
  // project: EntityRef;
  service: EntityRef;
  class: EntityRef;
  location: EntityRef;
  billable: boolean;
  // using a GQL type as form state
  // generally can't recommend this, but should be OK for just enums
  billableStatus?: TimeTracking_BillableStatus;
  billRate: number | null; // decimal number
  notes: string;
  breakDuration: number | null; // in seconds
  payType: EntityRef;
  costRate: number | null; // decimal number
  taxable: boolean;
  closedBookPassword?: string;
  currentlyWorking?: boolean; // if true, end time will be null
  isExported?: boolean; // Indicates if this is a time entry or activity; defaults to true for Time Activity backward compatibility, to be deprecated after merging Time Entry and Activity.
  invoiceId?: string | null;
  isLocked?: boolean;
  isApproved?: boolean;
  isSubmitted?: boolean;
  customFields?: Record<string, CustomField>;
  /**
   * IES dimensions — keyed by dimension definition id, hydrated from
   * `TimeTracking_TimeEntry.customExtensions.dimensions`. Display labels are
   * re-resolved at render time by `useGetDimensions` / `useGetDimensionOptions`.
   */
  dimensions?: Record<string, DimensionValue>;
  mileage?: string | null;
  autoCalculateMileage?: boolean;
  distanceTracking?: DistanceTracking;
  isCopied?: boolean; // Flag to indicate if the time entry is copied from another entry
}

export const DEFAULT_SINGLE_TIME_FORM_STATE: SingleTimeFormState = {
  id: undefined,
  version: '0',
  timeFor: {
    id: '',
    type: TimeForType.EMPLOYEE,
    name: '',
  },
  timeAgainst: {
    customer: {
      id: null,
      name: null,
    },
    project: {
      id: '',
      name: '',
    },
  },
  toggleClockIn: false,
  toggleBreak: false,
  startDate: dayjs(),
  endDate: dayjs(),
  timezone: undefined,
  startTime: undefined,
  isExported: true,
  isApproved: false,
  isSubmitted: false,
  currentlyWorking: false,
  endTime: undefined,
  duration: null,
  service: {
    id: '',
    name: '',
  },
  class: {
    id: '',
    name: '',
  },
  location: {
    id: '',
    name: '',
  },
  mileage: null,
  autoCalculateMileage: true,
  billable: false,
  billableStatus: undefined,
  billRate: null,
  notes: '',
  breakDuration: null,
  payType: {
    id: '',
    name: '',
  },
  costRate: null,
  taxable: false,
  closedBookPassword: '',
  invoiceId: null,
  isLocked: false,
  customFields: {},
  dimensions: {},
  isCopied: false,
};

export const setJobCostingDetails = (
  setValue: Function,
  { billable, billRate, costRate }: JobCostingDetails,
) => {
  setValue(`billable`, billable);
  setValue(`billRate`, billRate);
  setValue(`costRate`, costRate);
};

export const isFormDirty = (
  formState: FormState<SingleTimeFormState>,
): boolean => Object.keys(formState.dirtyFields).length !== 0;

export const useSingleTimeForm = () =>
  useForm<SingleTimeFormState>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: DEFAULT_SINGLE_TIME_FORM_STATE,
  });
