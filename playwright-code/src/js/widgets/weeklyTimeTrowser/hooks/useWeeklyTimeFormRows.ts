import { Dayjs } from 'dayjs';
import {
  FieldArrayWithId,
  useFieldArray,
  useFormContext,
} from 'react-hook-form';

import { WeeklyTimeFormState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import { EntityRef, JobCostingDetails } from 'src/js/widgets/common/types';
import { TimeAgainstFormState } from 'src/js/widgets/common/addTimeFormComponents/CustomerProject';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';

export type WeeklyTimeFormStateRowsField = FieldArrayWithId<
  WeeklyTimeFormState,
  'weeklyTimeRows'
>;

export interface UseWeeklyTimeFormRowsState {
  weeklyTimeRows: WeeklyTimeFormStateRowsField[];
  appendWeeklyTimeRow: (weeklyTimeRow: WeeklyTimeRowState) => void;
  removeWeeklyTimeRow: (rowIndex: number, startOfWeek: Dayjs) => void;
  clearAllRows: (startOfWeek: Dayjs) => void;
}

export interface UseWeeklyTimeFormRowsProps {
  billRate: number | null;
  costRate: number | null;
  isEmployeeOrVendorBillable: boolean;
}

export interface WeeklyTimeRowDurationState {
  id?: string; // id of the time entry
  duration: number | null; // in seconds
  billableStatus?: TimeTracking_BillableStatus;
  day: Dayjs;
  version: string;
  locked?: boolean;
  lockedReason?: string;
}

export interface WeeklyTimeRowState {
  timeAgainst: TimeAgainstFormState;
  service: EntityRef;
  location: EntityRef;
  class: EntityRef;
  notes: string;
  billable: boolean;
  billableStatus: TimeTracking_BillableStatus | undefined;
  billRate: number | null; // decimal number
  payType: EntityRef;
  costRate: number | null; // decimal number
  taxable: boolean;
  id: number; // Adding id to determine if the row is new  or existing
  durations: WeeklyTimeRowDurationState[];
  invoiceId?: string | null;
}

export const getWeeklyTimeRowFormState = (
  startOfWeek: Dayjs,
): WeeklyTimeRowState => ({
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
  location: {
    id: '',
    name: '',
  },
  notes: '',
  billable: false,
  billableStatus: undefined,
  billRate: null,
  payType: {
    id: '',
    name: '',
  },
  costRate: null,
  taxable: false,
  id: 0,
  invoiceId: null,
  durations: Array.from({ length: 7 }, (_, index) => ({
    duration: null,
    day: startOfWeek.add(index, 'days'),
    version: '0',
  })),
});

export const getWeekdaysWithDurations = (
  rows: WeeklyTimeRowState[],
): number[] => {
  const daysWithDurations = new Set<number>();

  rows
    .flatMap((row) => row.durations)
    .forEach((duration) => {
      if (duration.duration !== null && duration.duration >= 0) {
        daysWithDurations.add(duration.day.day());
      }
    });

  return Array.from(daysWithDurations);
};

export const setJobCostingDetails = (
  setValue: Function,
  {
    rowIndex,
    jobCostingDetails: { billable, billRate, costRate },
  }: {
    rowIndex: number;
    jobCostingDetails: JobCostingDetails;
  },
) => {
  setValue(`weeklyTimeRows.${rowIndex}.billable`, billable);
  setValue(`weeklyTimeRows.${rowIndex}.billRate`, billRate);
  setValue(`weeklyTimeRows.${rowIndex}.costRate`, costRate);
};

export const useWeeklyTimeFormRows = ({
  billRate,
  costRate,
  isEmployeeOrVendorBillable,
}: UseWeeklyTimeFormRowsProps): UseWeeklyTimeFormRowsState => {
  const { control } = useFormContext<WeeklyTimeFormState>();

  const {
    fields: weeklyTimeRows,
    append: appendWeeklyTimeRow,
    remove: removeWeeklyTimeRow,
  } = useFieldArray<WeeklyTimeFormState, 'weeklyTimeRows'>({
    control,
    name: 'weeklyTimeRows',
  });

  const removeRow = (index: number, startOfWeek: Dayjs) => {
    removeWeeklyTimeRow(index);
    // should have 3 rows by default

    if (weeklyTimeRows.length === 3) {
      // while reseting the row, setting default value for billable & billRate
      appendWeeklyTimeRow({
        ...getWeeklyTimeRowFormState(startOfWeek),
        billable: isEmployeeOrVendorBillable || (billRate ?? 0) > 0,
        billRate,
        costRate,
      });
    }
  };

  const clearAllRows = (startOfWeek: Dayjs) => {
    // remove all when no index provided
    removeWeeklyTimeRow();
    for (let i = 0; i < 3; i += 1) {
      // while reseting the row, setting default value for billable & billRate
      appendWeeklyTimeRow({
        ...getWeeklyTimeRowFormState(startOfWeek),
        billable: isEmployeeOrVendorBillable || (billRate ?? 0) > 0,
        billRate,
        costRate,
      });
    }
  };

  return {
    weeklyTimeRows,
    appendWeeklyTimeRow,
    removeWeeklyTimeRow: removeRow,
    clearAllRows,
  };
};
