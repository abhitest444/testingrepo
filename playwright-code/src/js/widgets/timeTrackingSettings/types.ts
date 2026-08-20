import { Path } from 'react-hook-form';
import {
  CustomDimensionSetting,
  MappedQLSettings,
} from 'src/js/service/hooks/settings/useGetQLSettings';
import { mappedApprovalSettings } from 'src/js/service/hooks/settings/useGetApprovalSettings';
import { TimeTracking_NotificationReminderMedium } from 'src/__generated__/timeTracking/graphql';
import {
  ApprovalRemindersbasedOn,
  IconSize,
  MenuButtonPriority,
  MenuButtonPurpose,
  ReminderRole,
  ScheduleNotificationSendMode,
} from 'src/js/widgets/timeTrackingSettings/constants';

export type FieldOption = {
  id: string;
  key: string;
  title: string;
  ariaLabel: string;
  tooltipText: string;
  disabled: boolean;
  detail: {
    title: string;
    subtitle: string;
    ariaLabel: string;
  };
  subFields?: FieldOption[];
  isCustom?: boolean;
  value: string | boolean;
  isEditable?: boolean;
  isVisible?: boolean;
  automationId?: string;
  menuButton?: {
    label: string;
    onClick: () => void;
    automationId?: string;
    icon?: string;
    iconSize?: IconSize;
    priority: MenuButtonPriority;
    purpose: MenuButtonPurpose;
    size: IconSize;
  };
};

export interface ITimeSheetRequiredFieldOption {
  id: string;
  key: string;
  disabled: boolean;
  value: boolean;
}

export interface ITimeSheetFieldOption {
  id: string;
  key: string;
  title: string;
  ariaLabel: string;
  tooltipText: string;
  disabled: boolean;
  value: boolean;
  detail: {
    title: string;
    subtitle: string;
    ariaLabel: string;
  };
  subFields?: ITimeSheetFieldOption[];
  automationId?: string;
  requiredField?: ITimeSheetRequiredFieldOption;
}

/**
 * Form keys are nested under `dimensions.<id>` so the `Record`-shaped form
 * field on `ITimeEntrySettingsFormState` can absorb any number of dimensions
 * returned by the API without widening the form state type per dimension.
 */
export interface IDimensionInput {
  id: string;
  /** Display label from employer settings. */
  label: string;
  /** Default for the Status (show on timesheets) toggle. */
  enabled?: boolean;
  /** Default for the Required toggle. */
  required?: boolean;
  /** i18n message id for the mobile preview subtitle. */
  mobileSubtitleId?: string;
}

/** Seeded from `useGetDimensions` — id, label, and active flag per dimension. */
export interface DimensionFormDefinition {
  id: string;
  label: string;
  active: boolean;
}

export interface IFormConfig {
  [key: string]: FieldOption[];
}

export interface IIsFieldsVisible {
  notifyWhenClockInOutTimeAdjusted: boolean;
  notifyWhenNotesAreAddedOrEdited: boolean;
}

export interface ITimeEntriesFormEditing {
  isNotificationEditing: boolean;
  isTimeTrackingEditing: boolean;
  isTimeSheetFieldsEditing: boolean;
  isGeoLocationsEditing: boolean;
  isApprovalEditing: boolean;
}

export interface ITimeEntrySettingsFormState {
  clockInNotificationReminderTime: string;
  clockInNotificationReminderEmail: boolean;
  clockInNotificationReminderMobile: boolean;
  clockOutNotificationReminderTime: string;
  clockOutNotificationReminderEmail: boolean;
  clockOutNotificationReminderMobile: boolean;
  notificationEnabledForDays: string[];
  notifyWhenClockInOutUpdated: string;
  notifyWhenNotesAreAddedOrEdited: string;
  shiftPublishedSendMode: ScheduleNotificationSendMode;

  // Schedule notification channels — one array per row holding the enabled
  // delivery channels. Maps 1:1 to the API subscription `distributionMethods`
  // (empty array = no channels active). Seeded from QL on load.
  scheduleShiftPublished: TimeTracking_NotificationReminderMedium[];
  scheduleOneHour: TimeTracking_NotificationReminderMedium[];
  scheduleForgotClockInAfterStarted: TimeTracking_NotificationReminderMedium[];
  scheduleForgotClockInAfterEnded: TimeTracking_NotificationReminderMedium[];
  scheduleLateClockInNotifyManagerChannels: TimeTracking_NotificationReminderMedium[];

  firstDayOfWeek: string;
  timeZone: string;
  timeFormat: string;
  splitTimeSheetAtMidnightEnabled: boolean;
  manageOwnTimeSheetsEnabled: boolean;
  mobileTimeTrackingEnabled: boolean;
  signatureCaptureEnabled: boolean;
  editClockOutTimeEnabled: boolean;
  clockOutOverrideHours: string;
  clockInRoundDirection: string;
  clockInRoundInMin: number;
  clockOutRoundDirection: string;
  clockOutRoundInMin: number;

  customersForTimeSheetEnabled: boolean;
  isBillingFieldEnabled: boolean;
  billingRateForTimeEnabled: boolean;
  requireBillable: boolean;
  isServiceFieldEnabled: boolean;
  classForTimeSheetEnabled: boolean;
  locationForTimeSheetEnabled: boolean;
  timeSheetEntryNotesEnabled: boolean;
  timeSheetEntryEditNotesEnabled: boolean;
  timeSheetEntryMakesNotesRequiredEnabled: boolean;

  classRequired: boolean;
  locationRequired: boolean;
  serviceItemRequired: boolean;

  // Dimensions — seeded once in `TimeSheetFields` from QL settings + definitions.
  // `dimensions` holds live toggle state bound by `DimensionsSection` Controllers.
  customDimensions?: CustomDimensionSetting[];
  dimensionDefinitions?: DimensionFormDefinition[];
  dimensions?: Record<string, { enabled: boolean; required: boolean }>;

  // Approval settings
  requireApprovalForTrackedTime: boolean;
  requireTeamMembersSubmitTime: boolean;
  enablePartialWeekSubmission: boolean;
  customMessage: string;

  // Approval reminder settings
  managerReminderBasedOn: string;
  managerCurrentWeekReminderDays: string[];
  managerCurrentWeekReminderHour: string;
  managerCurrentWeekReminderMedium: string[];
  managerPreviousWeekReminderDays: string[];
  managerPreviousWeekReminderHour: string;
  managerPreviousWeekReminderMedium: string[];
  managerCurrentPayPeriodReminderHour: string;
  managerCurrentPayPeriodReminderOffsetDays: number;
  managerCurrentPayPeriodReminderMedium: string[];
  managerPreviousPayPeriodReminderHour: string;
  managerPreviousPayPeriodReminderOffsetDays: number;
  managerPreviousPayPeriodReminderMedium: string[];

  employeeReminderBasedOn: string;
  employeeCurrentWeekReminderDays: string[];
  employeeCurrentWeekReminderHour: string;
  employeeCurrentWeekReminderMedium: string[];
  employeePreviousWeekReminderDays: string[];
  employeePreviousWeekReminderHour: string;
  employeePreviousWeekReminderMedium: string[];
  employeeCurrentPayPeriodReminderHour: string;
  employeeCurrentPayPeriodReminderOffsetDays: number;
  employeeCurrentPayPeriodReminderMedium: string[];
  employeePreviousPayPeriodReminderHour: string;
  employeePreviousPayPeriodReminderOffsetDays: number;
  employeePreviousPayPeriodReminderMedium: string[];

  employeeDailyReminderFirstReminderHour: string;
  employeeDailyReminderFirstReminderMedium: string[];
  employeeDailyReminderSecondReminderHour: string;
  employeeDailyReminderSecondReminderMedium: string[];
  employeeDailyReminderForTimesheetDays: string[];

  notifyManagerOnSubmit: boolean;
  notifyManagerOnGroupSubmitted: boolean;

  // Geofence notification settings
  geofenceEnabled?: boolean;
  geofenceReminderStartTime: string;
  geofenceReminderEndTime: string;
  geofenceReminderDaysOfWeek: string[];
}

// The schedule channel arrays subset of the form state — the value shape produced
// by mapSubscriptionsToScheduleChannels and used to seed the RHF fields on load.
export type ScheduleNotificationChannelsByField = Pick<
  ITimeEntrySettingsFormState,
  | 'scheduleShiftPublished'
  | 'scheduleOneHour'
  | 'scheduleForgotClockInAfterStarted'
  | 'scheduleForgotClockInAfterEnded'
  | 'scheduleLateClockInNotifyManagerChannels'
>;

export interface ISuccessUpdateCompanySettings {
  result: any;
  updatedFields: string[];
  updatedTimeEntryFormValue?: MappedQLSettings;
  setUpdatedTimeEntryFormValue: (
    updatedTimeEntryFormValue?: MappedQLSettings,
  ) => void;
  setUpdatedFields: (updatedFields: string[]) => void;
  isFormEdit: ITimeEntriesFormEditing;
  timeTrackingFields: IFormConfig;
  setFormFieldValue: (
    fieldName: keyof ITimeEntrySettingsFormState,
    fieldValue: string | boolean | number | string[],
  ) => void;
  intl: any;
  isFieldsVisible: IIsFieldsVisible;
  setTimeTrackingFields: (timeTrackingFields: IFormConfig) => void;
  setEditTimeSheetFields: (
    editTimeSheetFields: ITimeSheetFieldOption[],
  ) => void;
  setNotificationFields: (notificationFields: IFormConfig) => void;
  updateVisibleFields: (visibleFields: IIsFieldsVisible) => void;
  notificationFields: IFormConfig;
  editTimeSheetFields: ITimeSheetFieldOption[];
  isTimeSheetEditing: boolean;
  updateErrorMessage: (errorMessage: string) => void;
  timeEntryFormOpenToUpdate: string;
  removeTimeEntryDirtyFields: (updatedFormValue?: MappedQLSettings) => void;
  setIsConfirmationModalOpen: (isConfirmationModalOpen: boolean) => void;
  onFormUpdate: (formType: string) => void;
  setTimeEntryFormOpenToUpdate: (timeEntryFormOpenToUpdate: string) => void;
  isUKLocale: boolean;
}

export interface IUpdateTimeEntrySettingsForm {
  formType: string;
  isFormEdit: ITimeEntriesFormEditing;
  isFormContainingDirtyFields: () => boolean;
  setTimeEntryFormOpenToUpdate: (timeEntryFormOpenToUpdate: string) => void;
  setIsConfirmationModalOpen: (isConfirmationModalOpen: boolean) => void;
  setIsTimeSheetEditing: (isTimeSheetEditing: boolean) => void;
  handleCustomFieldsClick: () => void;
  isTimeSheetEditing: boolean;
  setIsFormEdit: (isFormEdit: ITimeEntriesFormEditing) => void;
  reRenderTimeEntrySetting: (message: string) => void;
  errorMessage: string;
}

export interface ICancelTimeEntrySettingsForm {
  isFormContainingDirtyFields: () => boolean;
  removeTimeEntryDirtyFields: (updatedFormValue?: MappedQLSettings) => void;
  formType: string;
  updatedTimeEntryFormValue?: MappedQLSettings;
  isFormEdit: ITimeEntriesFormEditing;
  selectedCustomTimeSheetFields: string[];
  setSelectedCustomTimeSheetFields: (
    selectedCustomTimeSheetFields: string[],
  ) => void;
  setIsTimeSheetEditing: (isTimeSheetEditing: boolean) => void;
  setIsFormEdit: (isFormEdit: ITimeEntriesFormEditing) => void;
}

// Type for entries that have name and isNew properties
export type NamedConfigEntry = {
  name: string;
  isNew: boolean;
  [key: string]: any;
};

export type CustomFieldData = {
  type: string;
  format: string | null;
  name: string;
  title: string;
  allowedOperations: string[];
  allowedValues: CustomFieldOption[] | null | [];
  associatedEntityTypes: {
    deleted: boolean;
    allowedOperations: string[];
    entityConditions: {
      deleted: boolean;
      allowedOperations: string[];
      subtype: string;
    }[];
    type: string;
  }[];
  id: string;
  active: boolean;
};

type CustomFieldOption = {
  deleted: boolean;
  __typename: string;
  id: string;
  value: string;
  order: number;
};

export type ApprovalSettingsField<T> =
  | {
      meta?: { version?: string | null } | null;
      value?: T | null;
    }
  | null
  | undefined;

export type combinedApprovalSettings = Partial<mappedApprovalSettings> &
  MappedQLSettings;

export type ReminderFieldNames = {
  medium: Path<ITimeEntrySettingsFormState>;
  hour: Path<ITimeEntrySettingsFormState>;
  day: Path<ITimeEntrySettingsFormState> | '';
};

/**
 * Map of translation keys for reminder messages based on role and frequency
 */
export const REMINDER_KEY_MAP: Record<
  ReminderRole,
  Partial<Record<ApprovalRemindersbasedOn, { first: string; second: string }>>
> = {
  [ReminderRole.MANAGER]: {
    [ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE]: {
      first:
        'time-entries.section.title.approvals.remind-if-time-not-approved-by-payroll-close',
      second:
        'time-entries.section.title.approvals.remind-second-time-not-approved-by-payroll-close',
    },
    [ApprovalRemindersbasedOn.DAY_OF_WEEK]: {
      first:
        'time-entries.section.title.approvals.remind-if-time-not-approved-current-week',
      second:
        'time-entries.section.title.approvals.remind-if-time-not-approved-prior-week',
    },
  },
  [ReminderRole.EMPLOYEE]: {
    [ApprovalRemindersbasedOn.DAILY]: {
      first:
        'time-entries.section.title.submissions.remind-if-time-not-submitted-daily',
      second:
        'time-entries.section.title.submissions.remind-second-time-not-submitted-daily',
    },
    [ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE]: {
      first:
        'time-entries.section.title.submissions.remind-if-time-not-submitted-by-payroll-close',
      second:
        'time-entries.section.title.submissions.remind-second-time-not-submitted-by-payroll-close',
    },
    [ApprovalRemindersbasedOn.DAY_OF_WEEK]: {
      first:
        'time-entries.section.title.submissions.remind-if-time-not-submitted',
      second:
        'time-entries.section.title.submissions.remind-second-time-not-submitted',
    },
  },
};
