import { Buffer } from 'buffer';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  UxPreferenceData,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import {
  TimeTracking_ApprovalStatusType,
  TimeTracking_BatchCreateUpdateTimeEntryInput,
  TimeTracking_BatchManageTimeEntriesInput,
  TimeTracking_BillableStatus,
  TimeTracking_CreateTimeEntryInput,
  TimeTracking_TimeEntry,
  TimeTracking_TimeForType,
  TimeTracking_UpdateTimeEntryInput,
} from 'src/__generated__/timeTracking/graphql';
import {
  TimeForType,
  TimeForTypeNames,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import {
  combineTimeAndDayjs,
  combineTimeAndDayjsForTimeEntries,
  mapQBTimezoneToDayjsTimezone,
  stringToDayJS,
} from 'src/js/common/DateAndTimeUtils';
import { SingleTimeFormState } from 'src/js/widgets/singleTimeTrowser/hooks/useSingleTimeForm';
import { TimeSettingsPopulatedState } from 'src/js/widgets/common/timeSettingsPopover/useTimeSettingsPopoverForm';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { metersToMiles, milesToMeters } from 'src/js/common/MiscUtils';
import { isSubmittedTimeEntry } from 'src/js/common/timeEntryLockUtils';
import { resolveBool } from 'src/js/common/boolQuery';
import { mapCustomFieldsToPayload } from '../../common/customFields/utils';
import {
  mapCustomExtensionsToDimensionValues,
  mapDimensionsToPayload,
} from '../../common/dimensions/dimensionUtils';
import type { CustomExtensionsWire } from '../../common/dimensions/types';

dayjs.extend(utc);

/**
 * Safely extract `fullName` from a DAS field on a time entry.
 *
 * The generated GraphQL stubs for DAS entities (e.g. `DataAccess_Klass`,
 * `DataAccess_Department`) only declare `id`, but the runtime payload includes
 * `fullName` when DAS is joined. Rather than asserting the shape with `as`,
 * narrow `unknown` through a runtime guard so a backend shape change cannot
 * produce a silent `undefined` cast.
 */
const getDASFullName = (dasField: unknown): string => {
  if (
    dasField != null &&
    typeof dasField === 'object' &&
    'fullName' in dasField &&
    typeof (dasField as { fullName?: unknown }).fullName === 'string'
  ) {
    return (dasField as { fullName: string }).fullName;
  }
  return '';
};

export const mapTimeEntryToSingleTimeFormState = (
  timeEntry: TimeTracking_TimeEntry,
  timezone: string,
  isSubmitTimeEnabled?: boolean,
  canManageTimesheets?: boolean,
): SingleTimeFormState => {
  // Common base object for both flows
  const baseFormState = {
    id: timeEntry.id,
    version: timeEntry.meta?.version || '0',
    timeFor: {
      id: timeEntry.timeFor?.id,
      type: timeEntry.timeFor.__typename
        ? TimeForTypeNames[
            timeEntry.timeFor.__typename as keyof typeof TimeForTypeNames
          ] || TimeForType.EMPLOYEE
        : TimeForType.EMPLOYEE,
      name: '',
    },
    timeAgainst: (() => {
      const fromDAS = timeEntry.timeAgainstContactDAS;
      const fromLegacy = timeEntry.timeAgainst as
        | {
            customer?: { id?: string | null };
            project?: { id?: string | null };
          }
        | undefined;
      return {
        customer: {
          id: fromDAS?.customer?.id ?? fromLegacy?.customer?.id ?? null,
          name: null,
        },
        project: {
          id: fromDAS?.project?.id ?? fromLegacy?.project?.id ?? '',
          name: '',
        },
      };
    })(),
    toggleClockIn:
      (timeEntry.startTime !== null &&
        timeEntry.startTime !== '' &&
        timeEntry.endTime !== null &&
        timeEntry.endTime !== '') ||
      timeEntry.isOpen ||
      false,
    toggleBreak:
      (timeEntry.v3BreakDuration && timeEntry.v3BreakDuration > 0) || false,
    startDate: stringToDayJS(timeEntry.date, 'YYYY-MM-DD'),
    endDate: (() => {
      // for time activities, endDate is not set
      if (timeEntry.isExported === true) {
        return undefined;
      }
      // for time entries, endDate is derived from endTime
      return timeEntry.endTime
        ? dayjs(timeEntry.endTime)
            .tz(mapQBTimezoneToDayjsTimezone(timeEntry.timeZone ?? timezone)) // priority to time entry timezone if present
            .startOf('date')
        : stringToDayJS(timeEntry.date, 'YYYY-MM-DD');
    })(),
    duration: timeEntry.duration || null,
    service: {
      id: timeEntry.serviceItem?.id || '',
      name: getDASFullName(timeEntry.serviceItemDAS),
    },
    class: {
      id: timeEntry.class?.id || '',
      name: getDASFullName(timeEntry.classDAS),
    },
    location: {
      id: timeEntry.department?.id || '',
      name: getDASFullName(timeEntry.departmentDAS),
    },
    billable:
      timeEntry.billableStatus === TimeTracking_BillableStatus.Billable ||
      timeEntry.billableStatus === TimeTracking_BillableStatus.HasBeenBilled ||
      false,
    billableStatus: timeEntry.billableStatus,
    billRate: window.isNaN(timeEntry.billableRate)
      ? null
      : Number(timeEntry.billableRate),
    notes: timeEntry.notes || '',
    breakDuration: timeEntry.v3BreakDuration || null,
    payType: {
      id: timeEntry.payrollItem?.id || '',
      name: '',
    },
    costRate: window.isNaN(timeEntry.costRate)
      ? null
      : Number(timeEntry.costRate),
    taxable: timeEntry.taxable || false,
    closedBookPassword: '',
    isLocked: resolveBool({
      should: [
        (timeEntry.approvalStatus ===
          TimeTracking_ApprovalStatusType.Approved ||
          timeEntry.locked) &&
          timeEntry.isExported === false,
        isSubmittedTimeEntry(timeEntry, isSubmitTimeEnabled),
        canManageTimesheets === false,
      ],
    }),
    isApproved:
      timeEntry.approvalStatus === TimeTracking_ApprovalStatusType.Approved &&
      timeEntry.isExported === false,
    isSubmitted: isSubmittedTimeEntry(timeEntry),
    invoiceId: timeEntry.invoiceId || null,
    customFields: (() => {
      const customFieldsObj: Record<string, any> = {};
      timeEntry.legacyCustomFields?.forEach((field) => {
        customFieldsObj[field.id] = {
          id: field.id,
          name: field.name?.trim(),
          value: field.value || '',
          optionID: (field as any).optionID || '', // Include optionID for dropdown fields when mapping existing entries
        };
      });
      return customFieldsObj;
    })(),
    // DimensionsField's seed stamps displayOnly on inactive / not-enabled
    // dimensions (using the fetched definitions) so they render read-only; on
    // edit their persisted value is still sent (includeDisplayOnly). Here we
    // just hydrate the persisted values.
    dimensions: mapCustomExtensionsToDimensionValues(
      timeEntry.customExtensions as CustomExtensionsWire | null,
    ),
    // Map distance tracking data and convert meters to miles
    distanceTracking: timeEntry.distanceTracking
      ? {
          autoCalculatedMeters: metersToMiles(
            timeEntry.distanceTracking.autoCalculatedMeters ?? null,
          ),
          manualMeters: metersToMiles(
            timeEntry.distanceTracking.manualMeters ?? null,
          ),
        }
      : undefined,
    // Determine mileage field value based on distance tracking data
    mileage: (() => {
      const { distanceTracking } = timeEntry;
      if (!distanceTracking) return null;

      const manualMetersFromAPI = distanceTracking.manualMeters ?? null;
      const autoCalculatedMetersFromAPI =
        distanceTracking.autoCalculatedMeters ?? null;

      // Case 1. If manualMeters is null from API, we use autoCalculatedMeters as it is calculated by the system
      // Case 2. If manualMeters is not null from API, it means the user has manually entered the mileage value and we use that value
      return manualMetersFromAPI === null
        ? metersToMiles(autoCalculatedMetersFromAPI)
        : metersToMiles(manualMetersFromAPI);
    })(),
    autoCalculateMileage: (() => {
      const { distanceTracking } = timeEntry;
      // Scenario 1: Distance tracking is not present in API response i.e null
      // If distanceTracking is not present, we should show the mileage value null and autoCalculateMileage by default
      if (!distanceTracking) return true;

      // Scenario 2: Distance tracking is present in API response
      // If manualMeters is null, enable auto-calculation
      return distanceTracking.manualMeters === null;
    })(),
  };

  // Check if the entity is a time entry is a time activity
  const isTimeActivity = timeEntry.isExported !== false;
  // Flow 1: For time activities (isExported = true)
  const timeActivityFormState = {
    ...baseFormState,
    startTime: timeEntry.startTime ? dayjs.utc(timeEntry.startTime) : undefined,
    endTime: timeEntry.endTime ? dayjs.utc(timeEntry.endTime) : undefined,
    isExported: true,
  };

  // Flow 2: For time entries (isExported = false)
  const timeEntryFormState = {
    ...baseFormState,
    currentlyWorking: timeEntry.isOpen || false,
    startTime: timeEntry.startTime
      ? // Prioritizing timeZone present in time entry, else fallback to company timezone
        dayjs(timeEntry.startTime).tz(
          mapQBTimezoneToDayjsTimezone(timeEntry.timeZone ?? timezone),
        )
      : undefined,
    endTime: timeEntry.endTime
      ? // Prioritizing timeZone present in time entry, else fallback to company timezone
        dayjs(timeEntry.endTime).tz(
          mapQBTimezoneToDayjsTimezone(timeEntry.timeZone ?? timezone),
        )
      : undefined,
    isExported: false,
    timezone: timeEntry.timeZone,
  };

  return isTimeActivity ? timeActivityFormState : timeEntryFormState;
};

export const mapAddSingleTimeEntryForm_forCreateInput = <
  T extends
    | TimeTracking_CreateTimeEntryInput
    | TimeTracking_BatchCreateUpdateTimeEntryInput,
>(
  formState: SingleTimeFormState,
  settings: TimeTrackingCompanySettings,
  preferences: UxPreferenceData,
  hasPayroll: boolean,
  sparse: boolean = false,
  quickFillFieldLabels?: Record<string, any>,
  dirtyFields?: Partial<Record<keyof SingleTimeFormState, any>>,
  shouldIncludeDistanceTracking?: boolean,
  isBillableFieldAssigned?: boolean,
  isLegacyQboUserEnabled: boolean = false,
): T => {
  const hideTimeEntryFieldsPreferences =
    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS];
  const timeForTypeUpper = (formState.timeFor.type as string)?.toUpperCase();
  const isEmployee = timeForTypeUpper === TimeTracking_TimeForType.Employee;
  const isLegacyQboUser =
    isLegacyQboUserEnabled &&
    timeForTypeUpper === TimeTracking_TimeForType.LegacyQboUser;

  // Check if the entity is a time entry or a time activity
  const isTimeActivity = formState.isExported !== false;

  // Determine if class field should be shown
  const isClassEnabled = !isTimeActivity
    ? settings.isTsheetClassEnabled
    : settings.isClassEnabled &&
      hideTimeEntryFieldsPreferences.isClassFieldEnabled;

  // Determine if location field should be shown
  const isLocationEnabled = !isTimeActivity
    ? settings.isTsheetLocationEnabled
    : settings.isLocationEnabled &&
      hideTimeEntryFieldsPreferences.isLocationFieldEnabled;

  // Helper function to determine if a field should be included in the payload
  // For updates (sparse = true), include field if it's dirty OR has a value
  // For creates (sparse = false), include field only if it has a value
  const shouldIncludeField = (
    fieldName: keyof SingleTimeFormState,
    hasValue: boolean,
  ) => {
    // For updates: include if dirty (even if emptied to clear) OR has value
    if (sparse && dirtyFields) {
      return dirtyFields[fieldName] !== undefined || hasValue;
    }
    // For creates: ONLY include if has value
    return hasValue;
  };

  // Billing field gating:
  // - Time activities: require isBillingFieldEnabled
  // - Time entries without a customer: same as time activities (require isBillingFieldEnabled)
  // - Time entries with a customer: require the field to be assigned to the selected customer
  const hasCustomerSelected = !!formState.timeAgainst?.customer?.id;
  const isBillable =
    formState.billable &&
    (isTimeActivity || !hasCustomerSelected
      ? settings.isBillingFieldEnabled
      : isBillableFieldAssigned);

  const customExtensions = mapDimensionsToPayload(formState.dimensions, {
    isCreate: !sparse,
    dirtyDimensions: dirtyFields?.dimensions,
    // Whatever value the API returned for a dimension is sent back in the
    // payload, even when the field renders disabled/read-only (inactive
    // dimension). displayOnly no longer suppresses a value from the payload.
    includeDisplayOnly: true,
  });

  // Common base object for both flows
  const baseInput = {
    date: formState.startDate.format('YYYY-MM-DD'),
    timeFor: {
      id: formState.timeFor.id,
      timeForType: (() => {
        if (isLegacyQboUser) return TimeTracking_TimeForType.LegacyQboUser;
        if (isEmployee) return TimeTracking_TimeForType.Employee;
        return TimeTracking_TimeForType.Vendor;
      })(),
    },
    v3BreakDuration: formState.breakDuration || 0,
    ...(shouldIncludeField('class', !!formState.class.id)
      ? {
          classID: formState.class.id || '',
        }
      : {}),
    ...(shouldIncludeField('location', !!formState.location.id)
      ? {
          departmentID: formState.location.id || '',
          ...(!isTimeActivity && {
            departmentLabel: quickFillFieldLabels?.location || '',
          }),
        }
      : {}),
    // Send billable state and rate from form (user's selection)
    billableRate: isBillable ? formState.billRate ?? null : null,
    ...{
      billableStatus: isBillable
        ? TimeTracking_BillableStatus.Billable
        : TimeTracking_BillableStatus.NotBillable,
    },
    ...(shouldIncludeField('service', !!formState.service.id)
      ? {
          serviceItemID: formState.service.id || '',
        }
      : {}),
    ...(hasPayroll && isEmployee && formState.payType.id
      ? {
          payrollItemID: formState.payType.id,
        }
      : {}),
    ...(shouldIncludeField(
      'notes',
      !!(formState.notes && formState.notes.length > 0),
    )
      ? {
          notes: formState.notes || '',
        }
      : {}),
    ...(formState.customFields && Object.keys(formState.customFields).length > 0
      ? {
          customFields: mapCustomFieldsToPayload(
            Object.values(formState.customFields).map((field) => ({
              id: field.id,
              name: field.name?.trim(),
              value: field.value,
              required: field.required || false,
              deleted: field.deleted || false,
              optionID: field.optionID || '',
            })),
          ),
        }
      : {}),
    ...(customExtensions.dimensions.length > 0 ? { customExtensions } : {}),
    ...(shouldIncludeDistanceTracking
      ? {
          distanceTracking: {
            manualMeters: formState.autoCalculateMileage
              ? null
              : milesToMeters(formState.mileage ?? null),
            isAutoCalculated:
              formState.autoCalculateMileage || formState.mileage === null,
          },
        }
      : {}),
    ...(sparse ? { sparse: true } : {}),
  };

  // Flow 1: For time activities fields explicitly (isExported = true)
  const timeActivityInput = {
    ...baseInput,
    costRate: formState.costRate,
    ...(settings.isTaxableFieldEnabled &&
    hideTimeEntryFieldsPreferences.isTaxableFieldEnabled
      ? {
          taxable: formState.taxable,
        }
      : {}),
    // STA sends both customer id and project id (when a project is selected),
    // matching WTA. STE/WTE intentionally send customer id only.
    timeAgainst: {
      customerId: formState.timeAgainst.customer?.id || null,
      ...(formState.timeAgainst.project?.id && {
        projectId: formState.timeAgainst.project.id,
      }),
    },
    ...(formState.toggleClockIn && formState.startTime && formState.endTime
      ? {
          // TA flow should use qboTimezone for start and end time
          startTime: combineTimeAndDayjs(
            formState.startDate,
            formState.startTime,
            mapQBTimezoneToDayjsTimezone(settings.qboTimezone),
          ),
          endTime: combineTimeAndDayjs(
            formState.startTime.isAfter(formState.endTime)
              ? formState.startDate.add(1, 'day')
              : formState.startDate,
            formState.endTime,
            mapQBTimezoneToDayjsTimezone(settings.qboTimezone),
          ),
        }
      : {
          duration: formState.duration,
        }),
  };

  // Flow 2: For time entries fields explicitly (isExported = false)
  // STE sends customer id only (same as WTE), even when project is selected
  const timeEntryInput = {
    ...baseInput,
    timeAgainst: {
      customerId: formState.timeAgainst.customer?.id || undefined,
    },
    ...(formState.toggleClockIn && formState.startTime
      ? {
          startTime: combineTimeAndDayjsForTimeEntries(
            formState.startDate,
            formState.startTime,
            // Prioritizing user-specific timezone, else fallback to company timezone
            mapQBTimezoneToDayjsTimezone(
              formState.timezone ?? settings.timezone,
            ),
          ),
          ...(!formState.currentlyWorking &&
            formState.endTime && {
              endTime: combineTimeAndDayjsForTimeEntries(
                // TODO: fix the below logic to work for non-OTX STE as well
                formState.endDate ??
                  // incase of OTX, we always have endDate, so we use that
                  // otherwise, we use startDate + 1 day if start time is before end time
                  // otherwise, we use startDate
                  (formState.startTime.isAfter(formState.endTime)
                    ? formState.startDate.add(1, 'day')
                    : formState.startDate),
                formState.endTime,
                // Prioritizing user-specific timezone, else fallback to company timezone
                mapQBTimezoneToDayjsTimezone(
                  formState.timezone ?? settings.timezone,
                ),
              ),
            }),
        }
      : {
          duration: formState.duration,
        }),
    isExported: false,
  };

  return (isTimeActivity ? timeActivityInput : timeEntryInput) as unknown as T;
};

// update is the same as create, just with id
export const mapAddSingleTimeEntryForm_forUpdateInput = <
  T extends
    | TimeTracking_UpdateTimeEntryInput
    | TimeTracking_BatchCreateUpdateTimeEntryInput,
>(
  formState: SingleTimeFormState,
  settings: TimeTrackingCompanySettings,
  preferences: UxPreferenceData,
  hasPayroll: boolean,
  quickFillFieldLabels?: Record<string, any>,
  dirtyFields?: Partial<Record<keyof SingleTimeFormState, any>>,
  shouldIncludeDistanceTracking?: boolean,
  isBillableFieldAssigned?: boolean,
  isLegacyQboUserEnabled: boolean = false,
): T =>
  ({
    id: formState.id!,
    version: formState.version,
    ...mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      settings,
      preferences,
      hasPayroll,
      true,
      quickFillFieldLabels,
      dirtyFields,
      shouldIncludeDistanceTracking,
      isBillableFieldAssigned,
      isLegacyQboUserEnabled,
    ),
  } as T);

export const mapAddSingleTimeEntryForm_forBatchCreateUpdateInput = (
  formState: SingleTimeFormState,
  settings: TimeTrackingCompanySettings,
  preferences: UxPreferenceData,
  hasPayroll: boolean,
  dirtyFields?: Partial<Record<keyof SingleTimeFormState, any>>,
  isLegacyQboUserEnabled: boolean = false,
): TimeTracking_BatchManageTimeEntriesInput => {
  const isUpdate = formState.id != null;

  return {
    ...{
      closedBookPassword: Buffer.from(
        formState.closedBookPassword || '*',
      ).toString('base64'),
    },
    timeEntries: isUpdate
      ? [
          mapAddSingleTimeEntryForm_forUpdateInput<TimeTracking_BatchCreateUpdateTimeEntryInput>(
            formState,
            settings,
            preferences,
            hasPayroll,
            undefined,
            dirtyFields,
            undefined,
            undefined,
            isLegacyQboUserEnabled,
          ),
        ]
      : [
          mapAddSingleTimeEntryForm_forCreateInput<TimeTracking_BatchCreateUpdateTimeEntryInput>(
            formState,
            settings,
            preferences,
            hasPayroll,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            isLegacyQboUserEnabled,
          ),
        ],
  };
};

export const mapAddSingleTimeEntryForm_forBatchDeleteInput = (
  formState: SingleTimeFormState,
): TimeTracking_BatchManageTimeEntriesInput => ({
  ...{
    closedBookPassword: Buffer.from(
      formState.closedBookPassword || '*',
    ).toString('base64'),
  },
  timeEntriesToDelete: [
    {
      id: formState.id!,
      version: formState.version,
    },
  ],
});

export const computeFieldsWithData = (
  formState: SingleTimeFormState,
): TimeSettingsPopulatedState => ({
  hasServiceFieldData:
    formState.service.id != null && formState.service.id !== '',
  hasBillingFieldData: formState.billable,
  hasClassFieldData: formState.class.id != null && formState.class.id !== '',
  // hasProjectFieldData:
  //   formState.project.id != null && formState.project.id !== '',
  hasLocationFieldData:
    formState.location.id != null && formState.location.id !== '',
  hasPayTypeFieldData:
    formState.payType.id != null && formState.payType.id !== '',
  hasCostRateFieldData: formState.costRate !== null && formState.costRate !== 0,
  hasTaxableFieldData: formState.billable && formState.taxable,
});
