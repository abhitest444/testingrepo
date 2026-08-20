import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  TimeTracking_UpdateApprovalSettingsInput,
  TimeTracking_ApprovalReminderBasis,
  TimeTracking_SettingNotificationMedium,
} from 'src/__generated__/timeTracking/graphql';
import { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';
import { mappedApprovalSettings } from 'src/js/service/hooks/settings/useGetApprovalSettings';
import { ApprovalRemindersbasedOn } from 'src/js/widgets/timeTrackingSettings/constants';

dayjs.extend(customParseFormat);

// Helper to create a setting input if the field was updated
export const createSettingInput = <T>(
  version: string,
  value: T,
): { version: string; value: T } => ({
  version,
  value,
});

// Helper to convert hour from Dayjs or string to number
export const convertHourToNumber = (hour: string | Dayjs): number => {
  if (dayjs.isDayjs(hour)) {
    return hour.hour();
  }
  if (typeof hour === 'string') {
    const parsed = dayjs(hour, ['HH:mm', 'h:mm A']);
    return parsed.isValid() ? parsed.hour() : 0;
  }
  return 0;
};

// Helper to convert notification medium array to GraphQL enum array
export const convertNotificationMedium = (
  mediums: string[] | unknown,
): TimeTracking_SettingNotificationMedium[] => {
  if (!Array.isArray(mediums)) return [];
  return mediums
    .filter((m) => m === 'EMAIL' || m === 'PUSH_NOTIFICATION')
    .map((m) => m as TimeTracking_SettingNotificationMedium);
};

// Helper to determine if a field has changed
export const hasFieldChanged = (
  fieldName: keyof ITimeEntrySettingsFormState,
  dirtyFields: Partial<Record<keyof ITimeEntrySettingsFormState, any>>,
): boolean => !!dirtyFields[fieldName];

/**
 * Map form state to approval settings mutation input
 */
export const mapApprovalSettingsForMutation = (
  formState: ITimeEntrySettingsFormState,
  currentSettings: mappedApprovalSettings,
  dirtyFields: Partial<Record<keyof ITimeEntrySettingsFormState, any>>,
): TimeTracking_UpdateApprovalSettingsInput => {
  const input: TimeTracking_UpdateApprovalSettingsInput = {};

  // Employee approval settings
  const employeeSettings: any = {};

  if (hasFieldChanged('requireApprovalForTrackedTime', dirtyFields)) {
    employeeSettings.approvalEnabled = createSettingInput(
      currentSettings.requireApprovalForTrackedTime.version,
      formState.requireApprovalForTrackedTime,
    );
  }

  if (hasFieldChanged('enablePartialWeekSubmission', dirtyFields)) {
    // Note: The form uses inverted logic for partial week submission
    employeeSettings.partialWeekApprovalEnabled = createSettingInput(
      currentSettings.enablePartialWeekSubmission.version,
      !formState.enablePartialWeekSubmission,
    );
  }

  if (hasFieldChanged('requireTeamMembersSubmitTime', dirtyFields)) {
    employeeSettings.submissionRequired = createSettingInput(
      currentSettings.requireTeamMembersSubmitTime.version,
      formState.requireTeamMembersSubmitTime,
    );
  }

  if (hasFieldChanged('customMessage', dirtyFields)) {
    employeeSettings.submitMessage = createSettingInput(
      currentSettings.customMessage.version,
      formState.customMessage,
    );
  }

  // Employee reminders
  const employeeReminders: any = {};

  if (hasFieldChanged('employeeReminderBasedOn', dirtyFields)) {
    employeeReminders.reminderBasedOn = createSettingInput(
      currentSettings.employeeReminderBasedOn.version,
      formState.employeeReminderBasedOn as TimeTracking_ApprovalReminderBasis,
    );
  }

  // Employee week reminders
  const employeeWeekReminders: any = {};
  const employeeCurrentWeekReminder: any = {};
  const employeePreviousWeekReminder: any = {};

  if (hasFieldChanged('employeeCurrentWeekReminderDays', dirtyFields)) {
    employeeCurrentWeekReminder.daysOfWeek = createSettingInput(
      currentSettings.employeeCurrentWeekReminderDays.version,
      formState.employeeCurrentWeekReminderDays,
    );
  }

  if (hasFieldChanged('employeeCurrentWeekReminderHour', dirtyFields)) {
    employeeCurrentWeekReminder.hour = createSettingInput(
      currentSettings.employeeCurrentWeekReminderHour.version,
      convertHourToNumber(formState.employeeCurrentWeekReminderHour),
    );
  }

  if (hasFieldChanged('employeeCurrentWeekReminderMedium', dirtyFields)) {
    employeeCurrentWeekReminder.reminderMedium = createSettingInput(
      currentSettings.employeeCurrentWeekReminderMedium.version,
      convertNotificationMedium(formState.employeeCurrentWeekReminderMedium),
    );
  }

  if (hasFieldChanged('employeePreviousWeekReminderDays', dirtyFields)) {
    employeePreviousWeekReminder.daysOfWeek = createSettingInput(
      currentSettings.employeePreviousWeekReminderDays.version,
      formState.employeePreviousWeekReminderDays,
    );
  }

  if (hasFieldChanged('employeePreviousWeekReminderHour', dirtyFields)) {
    employeePreviousWeekReminder.hour = createSettingInput(
      currentSettings.employeePreviousWeekReminderHour.version,
      convertHourToNumber(formState.employeePreviousWeekReminderHour),
    );
  }

  if (hasFieldChanged('employeePreviousWeekReminderMedium', dirtyFields)) {
    employeePreviousWeekReminder.reminderMedium = createSettingInput(
      currentSettings.employeePreviousWeekReminderMedium.version,
      convertNotificationMedium(formState.employeePreviousWeekReminderMedium),
    );
  }

  if (Object.keys(employeeCurrentWeekReminder).length > 0) {
    employeeWeekReminders.currentWeekReminder = employeeCurrentWeekReminder;
  }
  if (Object.keys(employeePreviousWeekReminder).length > 0) {
    employeeWeekReminders.previousWeekReminder = employeePreviousWeekReminder;
  }
  if (Object.keys(employeeWeekReminders).length > 0) {
    employeeReminders.week = employeeWeekReminders;
  }

  // Employee pay period reminders
  const employeePayPeriodReminders: any = {};
  const employeeCurrentPayPeriodReminder: any = {};
  const employeePreviousPayPeriodReminder: any = {};

  if (hasFieldChanged('employeeCurrentPayPeriodReminderHour', dirtyFields)) {
    employeeCurrentPayPeriodReminder.hour = createSettingInput(
      currentSettings.employeeCurrentPayPeriodReminderHour.version,
      convertHourToNumber(formState.employeeCurrentPayPeriodReminderHour),
    );
  }

  if (
    hasFieldChanged('employeeCurrentPayPeriodReminderOffsetDays', dirtyFields)
  ) {
    employeeCurrentPayPeriodReminder.offsetDays = createSettingInput(
      currentSettings.employeeCurrentPayPeriodReminderOffsetDays.version,
      formState.employeeCurrentPayPeriodReminderOffsetDays,
    );
  }

  if (hasFieldChanged('employeeCurrentPayPeriodReminderMedium', dirtyFields)) {
    employeeCurrentPayPeriodReminder.reminderMedium = createSettingInput(
      currentSettings.employeeCurrentPayPeriodReminderMedium.version,
      convertNotificationMedium(
        formState.employeeCurrentPayPeriodReminderMedium,
      ),
    );
  }

  if (hasFieldChanged('employeePreviousPayPeriodReminderHour', dirtyFields)) {
    employeePreviousPayPeriodReminder.hour = createSettingInput(
      currentSettings.employeePreviousPayPeriodReminderHour.version,
      convertHourToNumber(formState.employeePreviousPayPeriodReminderHour),
    );
  }

  if (
    hasFieldChanged('employeePreviousPayPeriodReminderOffsetDays', dirtyFields)
  ) {
    employeePreviousPayPeriodReminder.offsetDays = createSettingInput(
      currentSettings.employeePreviousPayPeriodReminderOffsetDays.version,
      formState.employeePreviousPayPeriodReminderOffsetDays,
    );
  }

  if (hasFieldChanged('employeePreviousPayPeriodReminderMedium', dirtyFields)) {
    employeePreviousPayPeriodReminder.reminderMedium = createSettingInput(
      currentSettings.employeePreviousPayPeriodReminderMedium.version,
      convertNotificationMedium(
        formState.employeePreviousPayPeriodReminderMedium,
      ),
    );
  }

  if (Object.keys(employeeCurrentPayPeriodReminder).length > 0) {
    employeePayPeriodReminders.currentPeriodReminder =
      employeeCurrentPayPeriodReminder;
  }
  if (Object.keys(employeePreviousPayPeriodReminder).length > 0) {
    employeePayPeriodReminders.previousPeriodReminder =
      employeePreviousPayPeriodReminder;
  }
  if (Object.keys(employeePayPeriodReminders).length > 0) {
    employeeReminders.payPeriod = employeePayPeriodReminders;
  }

  // Employee daily reminders
  const employeeDailyReminders: any = {};
  const employeeFirstReminder: any = {};
  const employeeSecondReminder: any = {};

  if (hasFieldChanged('employeeDailyReminderForTimesheetDays', dirtyFields)) {
    employeeDailyReminders.reminderForTimesheetDays = createSettingInput(
      currentSettings.employeeDailyReminderForTimesheetDays.version,
      formState.employeeDailyReminderForTimesheetDays,
    );
  }

  if (hasFieldChanged('employeeDailyReminderFirstReminderHour', dirtyFields)) {
    employeeFirstReminder.hour = createSettingInput(
      currentSettings.employeeDailyReminderFirstReminderHour.version,
      convertHourToNumber(formState.employeeDailyReminderFirstReminderHour),
    );
  }

  if (
    hasFieldChanged('employeeDailyReminderFirstReminderMedium', dirtyFields)
  ) {
    employeeFirstReminder.reminderMedium = createSettingInput(
      currentSettings.employeeDailyReminderFirstReminderMedium.version,
      convertNotificationMedium(
        formState.employeeDailyReminderFirstReminderMedium,
      ),
    );
  }

  if (hasFieldChanged('employeeDailyReminderSecondReminderHour', dirtyFields)) {
    employeeSecondReminder.hour = createSettingInput(
      currentSettings.employeeDailyReminderSecondReminderHour.version,
      convertHourToNumber(formState.employeeDailyReminderSecondReminderHour),
    );
  }

  if (
    hasFieldChanged('employeeDailyReminderSecondReminderMedium', dirtyFields)
  ) {
    employeeSecondReminder.reminderMedium = createSettingInput(
      currentSettings.employeeDailyReminderSecondReminderMedium.version,
      convertNotificationMedium(
        formState.employeeDailyReminderSecondReminderMedium,
      ),
    );
  }

  if (Object.keys(employeeFirstReminder).length > 0) {
    employeeDailyReminders.firstReminder = employeeFirstReminder;
  }
  if (Object.keys(employeeSecondReminder).length > 0) {
    employeeDailyReminders.secondReminder = employeeSecondReminder;
  }
  if (Object.keys(employeeDailyReminders).length > 0) {
    employeeReminders.daily = employeeDailyReminders;
  }

  if (Object.keys(employeeReminders).length > 0) {
    employeeSettings.reminders = employeeReminders;
  }

  if (Object.keys(employeeSettings).length > 0) {
    input.employee = employeeSettings;
  }

  // Manager reminders
  const managerSettings: any = {};
  const managerReminders: any = {};

  if (hasFieldChanged('managerReminderBasedOn', dirtyFields)) {
    managerReminders.reminderBasedOn = createSettingInput(
      currentSettings.managerReminderBasedOn.version,
      formState.managerReminderBasedOn as TimeTracking_ApprovalReminderBasis,
    );
  }

  // Manager week reminders
  const managerWeekReminders: any = {};
  const managerCurrentWeekReminder: any = {};
  const managerPreviousWeekReminder: any = {};

  if (hasFieldChanged('managerCurrentWeekReminderDays', dirtyFields)) {
    managerCurrentWeekReminder.daysOfWeek = createSettingInput(
      currentSettings.managerCurrentWeekReminderDays.version,
      formState.managerCurrentWeekReminderDays,
    );
  }

  if (hasFieldChanged('managerCurrentWeekReminderHour', dirtyFields)) {
    managerCurrentWeekReminder.hour = createSettingInput(
      currentSettings.managerCurrentWeekReminderHour.version,
      convertHourToNumber(formState.managerCurrentWeekReminderHour),
    );
  }

  if (hasFieldChanged('managerCurrentWeekReminderMedium', dirtyFields)) {
    managerCurrentWeekReminder.reminderMedium = createSettingInput(
      currentSettings.managerCurrentWeekReminderMedium.version,
      convertNotificationMedium(formState.managerCurrentWeekReminderMedium),
    );
  }

  if (hasFieldChanged('managerPreviousWeekReminderDays', dirtyFields)) {
    managerPreviousWeekReminder.daysOfWeek = createSettingInput(
      currentSettings.managerPreviousWeekReminderDays.version,
      formState.managerPreviousWeekReminderDays,
    );
  }

  if (hasFieldChanged('managerPreviousWeekReminderHour', dirtyFields)) {
    managerPreviousWeekReminder.hour = createSettingInput(
      currentSettings.managerPreviousWeekReminderHour.version,
      convertHourToNumber(formState.managerPreviousWeekReminderHour),
    );
  }

  if (hasFieldChanged('managerPreviousWeekReminderMedium', dirtyFields)) {
    managerPreviousWeekReminder.reminderMedium = createSettingInput(
      currentSettings.managerPreviousWeekReminderMedium.version,
      convertNotificationMedium(formState.managerPreviousWeekReminderMedium),
    );
  }

  if (Object.keys(managerCurrentWeekReminder).length > 0) {
    managerWeekReminders.currentWeekReminder = managerCurrentWeekReminder;
  }
  if (Object.keys(managerPreviousWeekReminder).length > 0) {
    managerWeekReminders.previousWeekReminder = managerPreviousWeekReminder;
  }
  if (Object.keys(managerWeekReminders).length > 0) {
    managerReminders.week = managerWeekReminders;
  }

  // Manager pay period reminders
  const managerPayPeriodReminders: any = {};
  const managerCurrentPayPeriodReminder: any = {};
  const managerPreviousPayPeriodReminder: any = {};

  if (hasFieldChanged('managerCurrentPayPeriodReminderHour', dirtyFields)) {
    managerCurrentPayPeriodReminder.hour = createSettingInput(
      currentSettings.managerCurrentPayPeriodReminderHour.version,
      convertHourToNumber(formState.managerCurrentPayPeriodReminderHour),
    );
  }

  if (
    hasFieldChanged('managerCurrentPayPeriodReminderOffsetDays', dirtyFields)
  ) {
    managerCurrentPayPeriodReminder.offsetDays = createSettingInput(
      currentSettings.managerCurrentPayPeriodReminderOffsetDays.version,
      formState.managerCurrentPayPeriodReminderOffsetDays,
    );
  }

  if (hasFieldChanged('managerCurrentPayPeriodReminderMedium', dirtyFields)) {
    managerCurrentPayPeriodReminder.reminderMedium = createSettingInput(
      currentSettings.managerCurrentPayPeriodReminderMedium.version,
      convertNotificationMedium(
        formState.managerCurrentPayPeriodReminderMedium,
      ),
    );
  }

  if (hasFieldChanged('managerPreviousPayPeriodReminderHour', dirtyFields)) {
    managerPreviousPayPeriodReminder.hour = createSettingInput(
      currentSettings.managerPreviousPayPeriodReminderHour.version,
      convertHourToNumber(formState.managerPreviousPayPeriodReminderHour),
    );
  }

  if (
    hasFieldChanged('managerPreviousPayPeriodReminderOffsetDays', dirtyFields)
  ) {
    managerPreviousPayPeriodReminder.offsetDays = createSettingInput(
      currentSettings.managerPreviousPayPeriodReminderOffsetDays.version,
      formState.managerPreviousPayPeriodReminderOffsetDays,
    );
  }

  if (hasFieldChanged('managerPreviousPayPeriodReminderMedium', dirtyFields)) {
    managerPreviousPayPeriodReminder.reminderMedium = createSettingInput(
      currentSettings.managerPreviousPayPeriodReminderMedium.version,
      convertNotificationMedium(
        formState.managerPreviousPayPeriodReminderMedium,
      ),
    );
  }

  if (Object.keys(managerCurrentPayPeriodReminder).length > 0) {
    managerPayPeriodReminders.currentPeriodReminder =
      managerCurrentPayPeriodReminder;
  }
  if (Object.keys(managerPreviousPayPeriodReminder).length > 0) {
    managerPayPeriodReminders.previousPeriodReminder =
      managerPreviousPayPeriodReminder;
  }
  if (Object.keys(managerPayPeriodReminders).length > 0) {
    managerReminders.payPeriod = managerPayPeriodReminders;
  }

  if (Object.keys(managerReminders).length > 0) {
    managerSettings.reminders = managerReminders;
  }

  if (Object.keys(managerSettings).length > 0) {
    input.manager = managerSettings;
  }

  // Submission notifications
  const submissionNotifications: any = {};

  if (hasFieldChanged('notifyManagerOnSubmit', dirtyFields)) {
    submissionNotifications.notifyManagerOnSubmit = createSettingInput(
      currentSettings.notifyManagerOnSubmit.version,
      formState.notifyManagerOnSubmit,
    );
  }

  if (hasFieldChanged('notifyManagerOnGroupSubmitted', dirtyFields)) {
    submissionNotifications.notifyManagerOnGroupSubmitted = createSettingInput(
      currentSettings.notifyManagerOnGroupSubmitted.version,
      formState.notifyManagerOnGroupSubmitted,
    );
  }

  if (Object.keys(submissionNotifications).length > 0) {
    input.submissionNotifications = submissionNotifications;
  }

  return input;
};

/**
 * Check if there are any approval-related changes in the form
 */
export const hasApprovalSettingsChanges = (
  dirtyFields: Partial<Record<keyof ITimeEntrySettingsFormState, any>>,
): boolean => {
  const approvalFieldKeys: Array<keyof ITimeEntrySettingsFormState> = [
    'requireApprovalForTrackedTime',
    'enablePartialWeekSubmission',
    'requireTeamMembersSubmitTime',
    'customMessage',
    'managerReminderBasedOn',
    'managerCurrentWeekReminderDays',
    'managerCurrentWeekReminderHour',
    'managerCurrentWeekReminderMedium',
    'managerPreviousWeekReminderDays',
    'managerPreviousWeekReminderHour',
    'managerPreviousWeekReminderMedium',
    'managerCurrentPayPeriodReminderHour',
    'managerCurrentPayPeriodReminderOffsetDays',
    'managerCurrentPayPeriodReminderMedium',
    'managerPreviousPayPeriodReminderHour',
    'managerPreviousPayPeriodReminderOffsetDays',
    'managerPreviousPayPeriodReminderMedium',
    'employeeReminderBasedOn',
    'employeeCurrentWeekReminderDays',
    'employeeCurrentWeekReminderHour',
    'employeeCurrentWeekReminderMedium',
    'employeePreviousWeekReminderDays',
    'employeePreviousWeekReminderHour',
    'employeePreviousWeekReminderMedium',
    'employeeCurrentPayPeriodReminderHour',
    'employeeCurrentPayPeriodReminderOffsetDays',
    'employeeCurrentPayPeriodReminderMedium',
    'employeePreviousPayPeriodReminderHour',
    'employeePreviousPayPeriodReminderOffsetDays',
    'employeePreviousPayPeriodReminderMedium',
    'employeeDailyReminderFirstReminderHour',
    'employeeDailyReminderFirstReminderMedium',
    'employeeDailyReminderSecondReminderHour',
    'employeeDailyReminderSecondReminderMedium',
    'employeeDailyReminderForTimesheetDays',
    'notifyManagerOnSubmit',
    'notifyManagerOnGroupSubmitted',
  ];

  return approvalFieldKeys.some((key) => dirtyFields[key]);
};
