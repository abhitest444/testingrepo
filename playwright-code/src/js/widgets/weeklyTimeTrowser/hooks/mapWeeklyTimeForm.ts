import { Buffer } from 'buffer';
import { DeepPartial } from 'react-hook-form/dist/types/utils';
import { TimeTrackingSettings } from 'src/js/service/hooks/settings/useGetSettings';
import {
  getIsWeekdayHidden,
  UxPreferenceData,
  UxPreferenceHideTimeEntryFieldsData,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { WeeklyTimeFormState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import {
  WeeklyTimeRowDurationState,
  WeeklyTimeRowState,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';
import { TimeSettingsPopulatedState } from 'src/js/widgets/common/timeSettingsPopover/useTimeSettingsPopoverForm';
import {
  TimeTracking_BatchCreateUpdateTimeEntryInput,
  TimeTracking_BatchManageTimeEntriesInput,
  TimeTracking_BillableStatus,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { TIMECHARGE_PENDING_LOCK_REASON } from 'src/js/common/constants';

interface MapWeeklyTimeFormArgs {
  formState: WeeklyTimeFormState;
  settings: TimeTrackingCompanySettings;
  preferences: UxPreferenceData;
  hasPayroll: boolean;
  hasAdminAccess: boolean;
  hasProjects: boolean;
  // to determine which rows were deleted
  defaultState?: Readonly<DeepPartial<WeeklyTimeFormState>>;
  isLegacyQboUserEnabled?: boolean;
}

export const extractDurations = (
  rows?: WeeklyTimeRowState[] | Readonly<DeepPartial<WeeklyTimeRowState[]>>,
): WeeklyTimeRowDurationState[] =>
  (rows?.flatMap(
    (row) =>
      row?.durations?.filter((duration) => duration && duration.id != null) ||
      [],
  ) || []) as WeeklyTimeRowDurationState[];

const resolveWeeklyTimeForType = (
  type: TimeForType | undefined,
  isVendor: boolean,
  isLegacyQboUserEnabled: boolean,
): TimeTracking_TimeForType => {
  if (isVendor) return TimeTracking_TimeForType.Vendor;
  if (isLegacyQboUserEnabled && type === TimeForType.LEGACY_QBO_USER)
    return TimeTracking_TimeForType.LegacyQboUser;
  return TimeTracking_TimeForType.Employee;
};

export const mapDuration = (
  { id, day, duration, version }: WeeklyTimeRowDurationState,
  isVendor: boolean,
  formState: WeeklyTimeFormState,
  row: WeeklyTimeRowState,
  hideTimeEntryFields: UxPreferenceHideTimeEntryFieldsData,
  settings: TimeTrackingCompanySettings,
  hasPayroll: boolean,
  isLegacyQboUserEnabled: boolean = false,
): TimeTracking_BatchCreateUpdateTimeEntryInput => ({
  // required fields
  date: day.format('YYYY-MM-DD'),
  duration: duration ?? undefined,
  timeFor: {
    id: formState.timeFor.id,
    timeForType: resolveWeeklyTimeForType(
      formState.timeFor.type,
      isVendor,
      isLegacyQboUserEnabled,
    ),
  },
  timeAgainst: {
    customerId: row.timeAgainst.customer?.id || undefined,
    ...(row.timeAgainst.project.id && {
      projectId: row.timeAgainst.project.id,
    }),
  },
  // optional fields
  ...(id && {
    id,
    version,
  }),
  ...(settings.isClassEnabled &&
    hideTimeEntryFields.isClassFieldEnabled &&
    row.class.id && {
      classID: row.class.id,
    }),
  ...(settings.isServiceFieldEnabled &&
    row.service.id && {
      serviceItemID: row.service.id,
    }),
  ...(settings.isLocationEnabled &&
    hideTimeEntryFields.isLocationFieldEnabled &&
    row.location.id && {
      departmentID: row.location.id,
    }),
  ...{
    billableStatus: (() => {
      if (!settings.isBillingFieldEnabled || !row.billable) {
        return TimeTracking_BillableStatus.NotBillable;
      }

      if (row.billableStatus === TimeTracking_BillableStatus.HasBeenBilled) {
        return row.billableStatus;
      }

      return TimeTracking_BillableStatus.Billable;
    })(),
  },
  ...{
    billableRate:
      row.billable && settings.isBillingFieldEnabled ? row.billRate : null,
  },
  costRate: row.costRate,
  ...(hideTimeEntryFields.isTaxableFieldEnabled && {
    taxable: row.taxable,
  }),
  ...(hasPayroll &&
    !isVendor &&
    row.payType.id && {
      payrollItemID: row.payType.id,
    }),
  notes: row.notes,
});

export const isDurationLockedPending = (
  duration: WeeklyTimeRowDurationState,
): boolean =>
  duration.locked === true &&
  duration.lockedReason === TIMECHARGE_PENDING_LOCK_REASON;

export const isSameEntryInput = (
  a: TimeTracking_BatchCreateUpdateTimeEntryInput,
  b: TimeTracking_BatchCreateUpdateTimeEntryInput,
): boolean =>
  a.date === b.date &&
  a.duration === b.duration &&
  a.timeFor?.id === b.timeFor?.id &&
  a.timeFor?.timeForType === b.timeFor?.timeForType &&
  a.timeAgainst?.customerId === b.timeAgainst?.customerId &&
  a.timeAgainst?.projectId === b.timeAgainst?.projectId &&
  a.billableStatus === b.billableStatus &&
  a.billableRate === b.billableRate &&
  a.costRate === b.costRate &&
  a.notes === b.notes &&
  a.classID === b.classID &&
  a.serviceItemID === b.serviceItemID &&
  a.departmentID === b.departmentID &&
  a.payrollItemID === b.payrollItemID &&
  a.taxable === b.taxable;

export const mapWeeklyTimeForm = ({
  formState,
  settings,
  preferences,
  hasPayroll,
  defaultState,
  isLegacyQboUserEnabled = false,
}: MapWeeklyTimeFormArgs): TimeTracking_BatchManageTimeEntriesInput => {
  const hideTimeEntryFields =
    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS];
  const hideWeekdays = preferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE];
  const isVendor = formState.timeFor.type === TimeForType.VENDOR;

  const savedEntryInputById = new Map<
    string,
    TimeTracking_BatchCreateUpdateTimeEntryInput
  >();
  if (defaultState?.weeklyTimeRows) {
    (
      defaultState.weeklyTimeRows as
        | WeeklyTimeRowState[]
        | readonly Partial<WeeklyTimeRowState>[]
    ).forEach((row) => {
      if (!row?.durations) return;
      (row.durations as WeeklyTimeRowDurationState[])
        .filter((d) => d && d.id != null)
        .forEach((d) => {
          savedEntryInputById.set(
            d.id!,
            mapDuration(
              d,
              isVendor,
              defaultState as WeeklyTimeFormState,
              row as WeeklyTimeRowState,
              hideTimeEntryFields,
              settings,
              hasPayroll,
              isLegacyQboUserEnabled,
            ),
          );
        });
    });
  }

  const allMappedEntries: TimeTracking_BatchCreateUpdateTimeEntryInput[] =
    formState.weeklyTimeRows.flatMap((row) =>
      row.durations
        .filter(({ duration }) => duration !== null && duration !== undefined)
        .filter(({ day }) => !getIsWeekdayHidden(day.day(), hideWeekdays))
        .filter((duration) => !isDurationLockedPending(duration))
        .map((duration) =>
          mapDuration(
            duration,
            isVendor,
            formState,
            row,
            hideTimeEntryFields,
            settings,
            hasPayroll,
            isLegacyQboUserEnabled,
          ),
        ),
    );

  const timeEntries = allMappedEntries.filter((entry) => {
    if (!entry.id) return true;
    const savedEntryInput = savedEntryInputById.get(entry.id);
    return !savedEntryInput || !isSameEntryInput(entry, savedEntryInput);
  });

  const defaultDurations = extractDurations(defaultState?.weeklyTimeRows);
  const formDurations = extractDurations(formState.weeklyTimeRows);

  const timeEntriesToDelete = defaultDurations
    .filter((duration) => !isDurationLockedPending(duration))
    .filter(
      (duration) => !formDurations.map((fd) => fd.id).includes(duration.id),
    )
    .map((duration) => ({
      id: duration.id!,
      version: duration.version,
    }))
    // time activities with zero duration also has to be deleted
    .concat(
      formDurations
        .filter((duration) => !isDurationLockedPending(duration))
        .filter(
          (duration) =>
            duration.duration === undefined || duration.duration == null,
        )
        .map((duration) => ({
          id: duration.id!,
          version: duration.version,
        })),
    );

  return {
    ...{
      closedBookPassword: Buffer.from(
        formState.closedBookPassword || '*',
      ).toString('base64'),
    },
    timeEntries,
    timeEntriesToDelete,
  };
};

export const computeFieldsWithData = (
  rows: WeeklyTimeRowState[],
): TimeSettingsPopulatedState => ({
  hasServiceFieldData: rows.some(
    (row) => row.service.id != null && row.service.id !== '',
  ),
  hasBillingFieldData: rows.some((row) => row.billable),
  hasClassFieldData: rows.some(
    (row) => row.class.id != null && row.class.id !== '',
  ),
  // hasProjectFieldData: rows.some(
  //   (row) => row.project.id != null && row.project.id !== '',
  // ),
  hasLocationFieldData: rows.some(
    (row) => row.location.id != null && row.location.id !== '',
  ),
  hasPayTypeFieldData: rows.some(
    (row) => row.payType.id != null && row.payType.id !== '',
  ),
  hasCostRateFieldData: rows.some(
    (row) => row.costRate != null && row.costRate !== 0,
  ),
  hasTaxableFieldData: rows.some((row) => row.billable && row.taxable),
});
