import dayjs from 'dayjs';
import {
  TimeTracking_CreateTimeEntryInput,
  TimeTracking_TimeForType,
  TimeTracking_TotalDurationByDateInput,
  TimeTracking_TimeEntry,
  TimeTracking_TimeEntriesInput,
  TimeTracking_UpdateTimeEntryInput,
  TimeTracking_BillableStatus,
  TimeTracking_CustomExtensionsInput,
} from 'src/__generated__/timeTracking/graphql';
import {
  getBrowserTimezone,
  mapQBTimezoneToDayjsTimezone,
} from 'src/js/common/DateAndTimeUtils';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import {
  mapCustomExtensionsToDimensionValues,
  mapDimensionsToPayload,
} from 'src/js/widgets/common/dimensions/dimensionUtils';
import type { CustomExtensionsWire } from 'src/js/widgets/common/dimensions/types';
import {
  DEFAULT_TIME_CLOCK_FORM_STATE,
  TimeClockFormState,
} from '../hooks/useTimeClockForm';
import { combineTimeAndDayjs } from './timeClockUtils';

// Type for custom fields in the form state
interface FormCustomField {
  id: string;
  name: string;
  value?: string;
  required?: boolean;
  deleted?: boolean;
  optionID?: string;
}

// Helper function to map custom fields from form state
// Uses the same pattern as other optimized custom field mappers
const mapCustomFields = (customFields?: Record<string, FormCustomField>) =>
  customFields
    ? Object.values(customFields).map((field: FormCustomField) => ({
        id: field.id,
        name: field.name.trim(),
        value: field.value || '',
        optionID: field.optionID || '', // Include optionID for dropdown fields
      }))
    : [];

export const mapTimeClockFormToCreateInput = (
  formValues: TimeClockFormState,
  timeFor: { id: string; timeForType: TimeTracking_TimeForType },
  timezone: string,
): TimeTracking_CreateTimeEntryInput => {
  const { startDate, startTime } = formValues;

  // Map custom fields to form state
  const customFields = mapCustomFields(formValues.customFields);

  return {
    date: startDate.format('YYYY-MM-DD'),
    startTime: combineTimeAndDayjs(
      startDate,
      startTime as dayjs.Dayjs,
      getBrowserTimezone(),
    ),
    timeFor: {
      id: timeFor.id,
      timeForType: timeFor.timeForType,
    },
    timeAgainst: {
      customerId: formValues.timeAgainst.customer?.id || undefined,
    },
    isExported: false,
    ...(customFields && customFields.length > 0 ? { customFields } : {}),
  };
};

export const mapTodayDurationInput = (
  employeeId: string,
  today: string,
  tomorrow: string,
): TimeTracking_TotalDurationByDateInput => ({
  totalDurationFilter: {
    timeForEntityId: employeeId,
    dateRange: {
      beginDate: today,
      endDate: tomorrow,
    },
    isExported: false,
  },
});

export const mapWeekDurationInput = (
  employeeId: string,
  startOfWeek: string,
  endOfWeek: string,
): TimeTracking_TotalDurationByDateInput => ({
  totalDurationFilter: {
    timeForEntityId: employeeId,
    dateRange: {
      beginDate: startOfWeek,
      endDate: endOfWeek,
    },
    isExported: false,
  },
});

export const getStartOfWeek = (
  companyTimezone: string,
  firstDayOfWeek: number = 0,
): string => {
  const now = dayjs().tz(getBrowserTimezone());
  const day = now.day();
  const diff = (day - firstDayOfWeek + 7) % 7;
  return now.subtract(diff, 'day').format('YYYY-MM-DD');
};

export const getEndOfWeek = (
  startOfWeek: string,
  companyTimezone: string,
): string => {
  const start = dayjs(startOfWeek, 'YYYY-MM-DD').tz(getBrowserTimezone());
  return start.add(7, 'day').format('YYYY-MM-DD');
};

export const getToday = (companyTimezone: string): string =>
  dayjs().tz(getBrowserTimezone()).format('YYYY-MM-DD');

export const getTomorrow = (companyTimezone: string): string =>
  dayjs().tz(getBrowserTimezone()).add(1, 'day').format('YYYY-MM-DD');

export const mapTimeEntryToFormValues = (
  timeEntry: TimeTracking_TimeEntry,
  timezone: string,
  existingCustomFields?: Array<{
    id: string;
    name: string;
    value?: string;
    optionID?: string;
  }>,
  quickFillFieldLocationLabel?: string,
) => ({
  ...DEFAULT_TIME_CLOCK_FORM_STATE,
  // DimensionsField derives isCreate from this id; needed so clock-out is seen
  // as edit and inactive dimensions with a saved value render greyed-out.
  id: timeEntry.id,
  startDate: timeEntry.startTime
    ? dayjs(timeEntry.startTime).tz(getBrowserTimezone()).startOf('day')
    : dayjs().tz(getBrowserTimezone()).startOf('day'),
  timeAgainst: (() => {
    const fromDAS = timeEntry.timeAgainstContactDAS;
    const fromLegacy = timeEntry.timeAgainst as
      | { customer?: { id?: string }; project?: { id?: string } }
      | undefined;
    let customer: { id: string } | undefined;
    if (fromDAS?.customer != null) {
      customer = { id: fromDAS.customer.id };
    } else if (fromLegacy?.customer?.id != null) {
      customer = { id: fromLegacy.customer.id };
    } else {
      customer = undefined;
    }
    let project: { id: string } | undefined;
    if (fromDAS?.project != null) {
      project = { id: fromDAS.project.id };
    } else if (fromLegacy?.project?.id != null) {
      project = { id: fromLegacy.project.id };
    } else {
      project = undefined;
    }
    return { customer, project };
  })(),
  notes: timeEntry?.notes || '',
  startTime: timeEntry?.startTime
    ? dayjs(timeEntry.startTime).tz(getBrowserTimezone())
    : undefined,
  service: timeEntry.serviceItem ? { id: timeEntry.serviceItem.id } : undefined,
  class: timeEntry.class ? { id: timeEntry.class.id } : undefined,
  timezone: timeEntry.timeZone,
  location: {
    id: timeEntry.department?.id || '',
    name: timeEntry.department?.id ? quickFillFieldLocationLabel : '',
  },
  billable:
    timeEntry.billableStatus === TimeTracking_BillableStatus.Billable ||
    timeEntry.billableStatus === TimeTracking_BillableStatus.HasBeenBilled ||
    false,
  billableStatus: timeEntry.billableStatus,
  billRate: window.isNaN(timeEntry.billableRate)
    ? null
    : Number(timeEntry.billableRate),
  isExported: false,
  customFields: (() => {
    const customFieldsObj: Record<string, any> = {};
    timeEntry.legacyCustomFields?.forEach((field) => {
      // Find existing field by ID instead of index
      const existingField = existingCustomFields?.find(
        (f) => f.id === field.id,
      );
      customFieldsObj[field.id] = {
        id: field.id,
        name: field.name.trim(),
        value: field.value || existingField?.value || '',
        optionID: (field as any).optionID || existingField?.optionID || '', // Include optionID for dropdown fields when mapping existing entries
      };
    });
    return customFieldsObj;
  })(),
  // When the entry already has persisted dimension values (e.g. the user saved
  // via the clock-out form), read them from customExtensions. DimensionsField's
  // seed then stamps displayOnly on inactive / not-enabled dimensions (using the
  // fetched definitions) so they render read-only and stay out of the payload.
  dimensions: mapCustomExtensionsToDimensionValues(
    timeEntry.customExtensions as CustomExtensionsWire | null,
  ),
});

export const mapSearchTimeEntriesInput = (
  employeeId: string,
): TimeTracking_TimeEntriesInput => ({
  timeEntryFilter: {
    isExported: false,
    isOpen: true,
    timeForEntityId: {
      equals: employeeId,
    },
  },
});

export const mapTimeClockFormToBreakInput = (
  formValues: TimeClockFormState,
  timeFor: { id: string; timeForType: TimeTracking_TimeForType },
  breakId: string,
  currentTime: string,
  quickFillFieldLocationLabel?: string,
): TimeTracking_CreateTimeEntryInput => {
  const customFields = mapCustomFields(formValues.customFields);

  return {
    timeFor: {
      id: timeFor.id,
      timeForType: timeFor.timeForType,
    },
    timeBreakId: breakId,

    date: formValues.startDate.format('YYYY-MM-DD'),
    startTime: currentTime,
    isExported: false,

    // Include location (department) if available
    ...(formValues.location?.id
      ? {
          departmentID: formValues.location.id,
          departmentLabel:
            quickFillFieldLocationLabel ||
            formValues.location.name ||
            undefined,
        }
      : {}),
  };
};

export const mapTimeClockFormToUpdateInput = (
  formValues: TimeClockFormState,
  timeEntryId: string,
  timezone: string,
  settings: TimeTrackingCompanySettings,
  endTime: string,
  timeFor: { id: string; timeForType: TimeTracking_TimeForType },
  quickFillFieldLocationLabel?: string,
  dirtyDimensions?: Record<string, unknown>,
): TimeTracking_UpdateTimeEntryInput => {
  const customFields = mapCustomFields(formValues.customFields);
  // Clock-out is an edit: send only dimensions the user touched, plus any
  // worker default the clock-out screen seeded and the user kept.
  const customExtensions = mapDimensionsToPayload(formValues.dimensions, {
    isCreate: false,
    dirtyDimensions,
  });

  return {
    id: timeEntryId,
    timeFor: {
      id: timeFor.id,
      timeForType: timeFor.timeForType,
    },
    endTime,
    date: formValues.startDate.format('YYYY-MM-DD'),
    startTime: combineTimeAndDayjs(
      formValues.startDate,
      formValues.startTime as dayjs.Dayjs,
      getBrowserTimezone(),
    ),
    timeAgainst: {
      customerId: formValues.timeAgainst.customer?.id || undefined,
    },
    notes: formValues?.notes,
    timeBreakId: formValues?.breakId ? formValues.breakId : undefined,
    serviceItemID: formValues?.service?.id ? formValues.service.id : undefined,
    classID: formValues?.class?.id ? formValues.class.id : undefined,
    timeZone: getBrowserTimezone(),
    isExported: false,
    ...(settings.isTsheetLocationEnabled && formValues.location.id
      ? {
          departmentID: formValues.location.id,
          departmentLabel: quickFillFieldLocationLabel || undefined,
        }
      : {}),
    billableRate:
      formValues.billable && settings.isBillingFieldEnabled
        ? formValues.billRate
        : null,
    billableStatus:
      formValues.billable && settings.isBillingFieldEnabled
        ? TimeTracking_BillableStatus.Billable
        : TimeTracking_BillableStatus.NotBillable,
    customFields,
    // CustomExtensionsInput narrows the generated type (required `dimensions`
    // with required `values: string[]`); the narrowed shape is assignable to
    // the wider optional generated input, so a single cast is sound.
    ...(customExtensions.dimensions.length > 0
      ? {
          customExtensions:
            customExtensions as TimeTracking_CustomExtensionsInput,
        }
      : {}),
  };
};

/**
 * Maps time clock form to update input specifically for break clock-out operations
 * Only includes fields that are relevant for break entries
 */
export const mapTimeClockFormToBreakEndInput = (
  formValues: TimeClockFormState,
  timeEntryId: string,
  settings: TimeTrackingCompanySettings,
  endTime: string,
  timeFor: { id: string; timeForType: TimeTracking_TimeForType },
  quickFillFieldLocationLabel?: string,
): TimeTracking_UpdateTimeEntryInput => ({
  id: timeEntryId,
  timeFor: {
    id: timeFor.id,
    timeForType: timeFor.timeForType,
  },
  endTime,
  date: formValues.startDate.format('YYYY-MM-DD'),
  startTime: combineTimeAndDayjs(
    formValues.startDate,
    formValues.startTime as dayjs.Dayjs,
    getBrowserTimezone(),
  ),
  ...(settings.isTsheetLocationEnabled && formValues.location.id
    ? {
        departmentID: formValues.location.id,
        departmentLabel: quickFillFieldLocationLabel || undefined,
      }
    : {}),
  timeBreakId: formValues?.breakId ? formValues.breakId : undefined,
  isExported: false,
});

/**
 * Maps active time entry data for break ending operations
 * Sets the breakId and startTime from the active time entry
 */
export const mapActiveTimeEntryForBreakEnd = (
  activeTimeEntry: TimeTracking_TimeEntry,
  timeClockFormMethods: any,
) => {
  if (activeTimeEntry?.timeBreakId) {
    timeClockFormMethods.setValue('breakId', activeTimeEntry.timeBreakId);
  }

  if (activeTimeEntry?.startTime) {
    timeClockFormMethods.setValue(
      'startTime',
      dayjs(activeTimeEntry.startTime),
    );
  }
};
