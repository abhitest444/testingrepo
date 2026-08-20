import React, {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useIntl, useSandbox } from '@payroll/quicksand';
import styled from 'styled-components';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import {
  FEATURE_FLAGS,
  WEEK_DAYS,
  SECTION_READY_EVENT,
  SECTION_READY_KEYS,
} from 'src/js/common/constants';
import {
  computeHasTimeElite,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';

import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { GeneralSettingSection } from 'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection';
import { ViewContent } from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import { EditNotificationTimeEntry } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditNotificationTimeEntrySettings';
import { EditApprovalsNotificationSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditApprovalsNotificationSettings';
import { EditSubmissionsNotificationSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditSubmissionsNotificationSettings';
import { EditGeofenceNotificationSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditGeofenceNotificationSettings';
import EmployerOvertimeNotificationsView from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EmployerOvertimeNotificationsView';
import EmployerOvertimeNotificationsEdit from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EmployerOvertimeNotificationsEdit';
import { EditScheduleNotificationSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditScheduleNotificationSettings';
import {
  IFormConfig,
  IIsFieldsVisible,
  ScheduleNotificationChannelsByField,
} from 'src/js/widgets/timeTrackingSettings/types';
import {
  formatArrayToTitleCase,
  formatChannelsFor,
  formatScheduleNotificationOnOffChannelValue,
  formatScheduleNotificationSummaryValue,
  formatTimeTo12Hour,
  hasEmailChannel,
  hasMobileChannel,
  mapShiftChangePreferenceToSendMode,
  mapSubscriptionsToScheduleChannels,
  uppercaseToPascalcase,
  getReminderData,
} from 'src/js/widgets/timeTrackingSettings/utils';
import {
  ApprovalRemindersbasedOn,
  ApprovalReminderPrefix,
  NotificationFieldKey,
  NotificationMedium,
  ReminderRole,
  TimeEntriesFormType,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { timeEntrySettingsDefaultState } from 'src/js/service/hooks/settings/useGetQLSettings';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_OvertimeNotificationRule,
} from 'src/__generated__/timeTracking/graphql';
import { useOvertimeFeatureFlag } from 'src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled';
import { useEmployerOvertimeNotifications } from '../../../hooks/useEmployerOvertimeNotifications';

interface INotificationsTimeEntrySettings {
  notificationFields: IFormConfig;
  setNotificationFields: (notificationFields: IFormConfig) => void;
  isNotificationFieldEditing: boolean;
  onSaveTimeEntrySettings: (trackingPoint?: TrackingPoint) => void;
  notificationFieldSettingSection: string;
  id: string;
  onFormUpdate: (formType: string) => void;
  onFormCancel: (formType: string) => void;
  isDataUpdating: boolean;
  isFieldsVisible: IIsFieldsVisible;
  updateVisibleFields: (visibleFields: IIsFieldsVisible) => void;
  /** Keeps latest saved/draft overtime rules for parent save mutation (not RHF). */
  employerOvertimeRulesRef?: MutableRefObject<{
    saved: TimeTracking_OvertimeNotificationRule[];
    draft: TimeTracking_OvertimeNotificationRule[];
  }>;
  /** After a successful employer mutation, merged rules from form state (preferred over QL). */
  overtimeNotificationRulesFromParent?: TimeTracking_OvertimeNotificationRule[];
  /** Callback to register subsection refs for scroll targeting */
  registerSectionRef?: (key: string) => (el: HTMLDivElement | null) => void;
}

// Approval and submission notification fields that need visibility management
const APPROVAL_AND_SUBMISSION_FIELDS = [
  NotificationFieldKey.APPROVALS_SECTION_HEADER,
  NotificationFieldKey.SUBMISSIONS_SECTION_HEADER,
  NotificationFieldKey.MANAGER_REMINDER_BASED_ON,
  NotificationFieldKey.MANAGER_FIRST_REMINDER,
  NotificationFieldKey.MANAGER_SECOND_REMINDER,
  NotificationFieldKey.EMPLOYEE_REMINDER_BASED_ON,
  NotificationFieldKey.EMPLOYEE_FIRST_REMINDER,
  NotificationFieldKey.EMPLOYEE_SECOND_REMINDER,
  NotificationFieldKey.SUBMISSION_REMINDER_DAYS_OF_WEEK,
  NotificationFieldKey.NOTIFY_MANAGER_ON_GROUP_SUBMITTED,
  NotificationFieldKey.NOTIFY_MANAGER_ON_SUBMIT,
];

// Geofence notification fields
const GEOFENCE_NOTIFICATION_FIELDS = [
  NotificationFieldKey.GEOFENCE_SETTINGS_HEADER,
  NotificationFieldKey.GEOFENCE_REMINDER_SETTINGS,
];

const SCHEDULE_NOTIFICATION_FIELDS = [
  NotificationFieldKey.SCHEDULE_SECTION_HEADER,
  NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE,
  NotificationFieldKey.SCHEDULE_ONE_HOUR_BEFORE_SHIFT,
  NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED,
  NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_ENDED,
  NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER,
];

/**
 * Updates field visibility for specified field keys
 */
const updateFieldsVisibility = (
  notificationFields: IFormConfig,
  fieldKeys: string[],
  isVisible: boolean,
): void => {
  Object.values(notificationFields).forEach((formFields) => {
    formFields.forEach((field) => {
      if (fieldKeys.includes(field.key)) {
        field.isVisible = isVisible;
      }
    });
  });
};

/**
 * Updates visibility for submission-related fields based on approval settings
 */
const updateSubmissionFieldsVisibility = (
  notificationFields: IFormConfig,
  isApprovalsEnabled: boolean,
  isApprovalSettingsEnabled: boolean,
  employeeReminderBasedOn?: string,
): void => {
  const submissionFields = [
    NotificationFieldKey.SUBMISSIONS_SECTION_HEADER,
    NotificationFieldKey.EMPLOYEE_REMINDER_BASED_ON,
    NotificationFieldKey.EMPLOYEE_FIRST_REMINDER,
    NotificationFieldKey.EMPLOYEE_SECOND_REMINDER,
    NotificationFieldKey.NOTIFY_MANAGER_ON_GROUP_SUBMITTED,
    NotificationFieldKey.NOTIFY_MANAGER_ON_SUBMIT,
  ];

  // Approvals section fields
  const approvalFields = [
    NotificationFieldKey.APPROVALS_SECTION_HEADER,
    NotificationFieldKey.MANAGER_REMINDER_BASED_ON,
    NotificationFieldKey.MANAGER_FIRST_REMINDER,
    NotificationFieldKey.MANAGER_SECOND_REMINDER,
  ];

  // Show approval fields only if feature flag is enabled (regardless of approval setting)
  updateFieldsVisibility(
    notificationFields,
    approvalFields,
    isApprovalSettingsEnabled,
  );

  // Show submission fields only if feature flag is enabled AND approvals are enabled
  updateFieldsVisibility(
    notificationFields,
    submissionFields,
    isApprovalSettingsEnabled && isApprovalsEnabled,
  );

  // Special case: SUBMISSION_REMINDER_DAYS_OF_WEEK visibility depends on feature flag, approvals, and reminder mode
  updateFieldsVisibility(
    notificationFields,
    [NotificationFieldKey.SUBMISSION_REMINDER_DAYS_OF_WEEK],
    isApprovalSettingsEnabled &&
      isApprovalsEnabled &&
      employeeReminderBasedOn === ApprovalRemindersbasedOn.DAILY,
  );
};

/**
 * Updates visibility for geofence notification fields based on feature flag, Time Elite status, and geofenceEnabled
 */
const updateGeofenceFieldsVisibility = (
  notificationFields: IFormConfig,
  isGeofenceExperienceEnabled: boolean,
  isTimeElite: boolean,
  geofenceEnabled: boolean,
): void => {
  const shouldShowGeofenceFields =
    isGeofenceExperienceEnabled && isTimeElite && geofenceEnabled;
  updateFieldsVisibility(
    notificationFields,
    GEOFENCE_NOTIFICATION_FIELDS,
    shouldShowGeofenceFields,
  );
};

// Updates visibility for schedule notification fields based on feature flag
const updateScheduleNotificationsFieldsVisibility = (
  notificationFields: IFormConfig,
  isScheduleSettingsEnabled: boolean,
): void => {
  updateFieldsVisibility(
    notificationFields,
    SCHEDULE_NOTIFICATION_FIELDS,
    isScheduleSettingsEnabled,
  );
};

/**
 * View body for notification fields + employer overtime read-only block.
 * Payroll settings view may center flex children; this column stretches to full width
 * and lays out children with align-items: stretch (not center) so rows line up.
 */
const NotificationsSettingsViewColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: unset;
  width: 100%;
  min-width: 0;
`;

export const NotificationsTimeEntrySettings: React.FC<
  INotificationsTimeEntrySettings
> = ({
  notificationFields,
  setNotificationFields,
  isNotificationFieldEditing,
  onSaveTimeEntrySettings,
  notificationFieldSettingSection,
  id,
  onFormUpdate,
  onFormCancel,
  isDataUpdating,
  isFieldsVisible,
  updateVisibleFields,
  employerOvertimeRulesRef,
  overtimeNotificationRulesFromParent,
  registerSectionRef,
}) => {
  const {
    QLData,
    isQLSettingsLoading,
    QLSettingsError,
    isFormEditable,
    isUKLocale,
    approvalSettings,
    approvalSettingsLoading,
    approvalSettingsError,
  } = useTimeTrackingSettingsContext(false);

  const sandbox = useSandbox();

  // Publish section ready event when data loads (transition from loading to loaded)
  const sectionReadyPublishedRef = useRef(false);
  const wasLoadingRef = useRef(isQLSettingsLoading || approvalSettingsLoading);
  useEffect(() => {
    const currentlyLoading = isQLSettingsLoading || approvalSettingsLoading;
    const wasLoading = wasLoadingRef.current;
    wasLoadingRef.current = currentlyLoading;

    const justLoaded = wasLoading && !currentlyLoading;
    if (justLoaded && !sectionReadyPublishedRef.current) {
      sectionReadyPublishedRef.current = true;
      sandbox.logger.info(
        'Component=NotificationsTimeEntrySettings Event=SECTION_READY section=NOTIFICATIONS',
      );
      sandbox.pubsub.publish(SECTION_READY_EVENT, {
        section: SECTION_READY_KEYS.NOTIFICATIONS,
      });
    }
  }, [isQLSettingsLoading, approvalSettingsLoading, sandbox]);

  const internalEmployerOvertimeRulesRef = useRef({
    saved: [] as TimeTracking_OvertimeNotificationRule[],
    draft: [] as TimeTracking_OvertimeNotificationRule[],
  });
  const employerOvertimeRulesRefResolved =
    employerOvertimeRulesRef ?? internalEmployerOvertimeRulesRef;

  // ── Employer overtime notifications draft state ────────────────────────────
  const {
    savedRules: savedOvertimeRules,
    draftRules: draftOvertimeRules,
    setDraftRules: setDraftOvertimeRules,
    cancelDraft: cancelOvertimeDraft,
    syncFromMutation: syncOvertimeFromMutation,
    hasLoadedFromApi: overtimeHasLoadedFromApi,
  } = useEmployerOvertimeNotifications(
    overtimeNotificationRulesFromParent ?? QLData?.overtimeNotificationRules,
    isQLSettingsLoading,
  );

  useEffect(() => {
    employerOvertimeRulesRefResolved.current = {
      saved: savedOvertimeRules,
      draft: draftOvertimeRules,
    };
  }, [
    employerOvertimeRulesRefResolved,
    savedOvertimeRules,
    draftOvertimeRules,
  ]);

  // Track whether the edit section was closed via Cancel (vs. a successful save).
  const wasCancelledRef = useRef(false);

  const { isEnabled: isOvertimeCardEnabled } = useOvertimeFeatureFlag();

  // When edit mode closes after a successful save, commit the draft as saved.
  useEffect(() => {
    if (!isNotificationFieldEditing) {
      if (!wasCancelledRef.current) {
        // The API returns only the affected rule(s) (CREATE/UPDATE only; DELETE → null).
        // Merge returned rules into draftOvertimeRules by period so that newly-created
        // rules get their real server ID while deleted/untouched rules stay correct.
        const returnedByPeriod = new Map(
          (overtimeNotificationRulesFromParent ?? []).map((r) => [
            r.threshold.period,
            r,
          ]),
        );
        const mergedRules = draftOvertimeRules.map(
          (draft) => returnedByPeriod.get(draft.threshold.period) ?? draft,
        );
        syncOvertimeFromMutation(mergedRules);
      }
      wasCancelledRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotificationFieldEditing]);

  const handleFormCancel = () => {
    wasCancelledRef.current = true;
    cancelOvertimeDraft();
    onFormCancel(TimeEntriesFormType.NOTIFICATION);
  };
  // ─────────────────────────────────────────────────────────────────────────
  const intl = useIntl();
  const { setValue } = useFormContext();

  // Watch geofenceEnabled so we show geofence notification when enabled (synced from QL or from Geo Locations trowser)
  const geofenceEnabled = useWatch({
    name: 'geofenceEnabled',
    defaultValue: false,
  }) as boolean | undefined;

  const geofenceEnabledValue = geofenceEnabled === true;

  const { isEnabled: isPostR2ReleaseTimeExperienceEnabled } = useIXPFeatureFlag(
    {
      flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_R2_RELEASE,
      defaultValue: false,
    },
  );

  // Feature flag for geofence experience
  const { isEnabled: isGeofenceExperienceEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_R6_GEOFENCE,
    defaultValue: false,
  });

  const { isEnabled: isScheduleSettingsEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_ENABLE_SCHEDULE_SETTINGS,
    defaultValue: false,
  });

  // Check if user is Time Elite
  const { data: entitlements } = useGetEntitlements();
  const isTimeElite = computeHasTimeElite(entitlements || []);

  // Check for errors for both QL and Approval APIs
  const hasQLError = !!(QLSettingsError && QLSettingsError !== '');
  const hasApprovalError = !!(
    approvalSettingsError && approvalSettingsError !== ''
  );
  const hasBothErrors = hasQLError && hasApprovalError;

  // Prepare section-specific errors for all sections
  // Only use section-specific errors when BOTH are NOT failing
  // If both are failing, show single error via isErrorInView instead
  const sectionErrors = {
    // Time Tracking section - controlled by QL API
    notificationTimeEntriesNotificationManagement: {
      hasError: !hasBothErrors && hasQLError,
      errorMessageKey: 'time-entries.validation.ql.fail',
    },
    // Approvals section - controlled by Approval API
    [NotificationFieldKey.APPROVALS_SECTION_HEADER]: {
      hasError: !hasBothErrors && hasApprovalError,
      errorMessageKey: 'time-entries.validation.ql.fail',
    },
    // Submissions section - controlled by Approval API
    // Show error if: approval API failed OR submissions feature is disabled
    [NotificationFieldKey.SUBMISSIONS_SECTION_HEADER]: {
      hasError: !hasBothErrors && hasApprovalError,
      errorMessageKey: 'time-entries.validation.ql.fail',
    },
    [NotificationFieldKey.GEOFENCE_SETTINGS_HEADER]: {
      hasError: !hasBothErrors && hasQLError,
      errorMessageKey: 'time-entries.validation.ql.fail',
    },
    // Schedule section
    [NotificationFieldKey.SCHEDULE_SECTION_HEADER]: {
      hasError: !hasBothErrors && hasQLError,
      errorMessageKey: 'time-entries.validation.ql.fail',
    },
  };

  // Form should be editable if at least one API is working
  // Only disable editing when BOTH APIs have errors
  const isFormEditableWithErrors = isFormEditable && !hasBothErrors;

  // Seed the shift-published RHF field from the QL value once settings load.
  const shiftChangeSendModeFromQL = mapShiftChangePreferenceToSendMode(
    QLData?.publishShiftChangePreference?.value,
  );
  useEffect(() => {
    if (isQLSettingsLoading || !shiftChangeSendModeFromQL) {
      return;
    }
    setValue(
      NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE,
      shiftChangeSendModeFromQL,
      {
        shouldValidate: false,
        shouldDirty: false,
      },
    );
  }, [isQLSettingsLoading, shiftChangeSendModeFromQL, setValue]);

  // Seed the schedule channel array fields from the QL subscriptions once settings
  // load (same pattern as the shift-published send mode above).
  const scheduleChannelsFromQL = mapSubscriptionsToScheduleChannels(
    QLData?.scheduleNotificationSubscriptions,
  );
  useEffect(() => {
    if (isQLSettingsLoading) {
      return;
    }
    (
      Object.entries(scheduleChannelsFromQL) as [
        keyof ScheduleNotificationChannelsByField,
        TimeTracking_NotificationReminderMedium[],
      ][]
    ).forEach(([field, value]) => {
      setValue(field, value, { shouldValidate: false, shouldDirty: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQLSettingsLoading, QLData]);

  // useEffect to handle fields visibility
  useEffect(() => {
    if (QLData && !isQLSettingsLoading && notificationFields) {
      const geofenceEnabledFromQL = QLData?.geofenceEnabled?.value ?? false;
      setValue('geofenceEnabled', geofenceEnabledFromQL, {
        shouldValidate: false,
        shouldDirty: false,
      });
      updateGeofenceFieldsVisibility(
        notificationFields,
        isGeofenceExperienceEnabled,
        isTimeElite,
        geofenceEnabledFromQL,
      );
      updateScheduleNotificationsFieldsVisibility(
        notificationFields,
        isScheduleSettingsEnabled,
      );

      Object.keys(notificationFields).forEach((key) => {
        const formField = notificationFields[key];

        const isSendClockInReminderEmail =
          QLData.clockInNotificationReminderEmail
            ? QLData.clockInNotificationReminderEmail.value
            : timeEntrySettingsDefaultState.clockInNotificationReminderEmail
                .value;

        const isSendClockInReminderMobile =
          QLData.clockInNotificationReminderMobile
            ? QLData.clockInNotificationReminderMobile.value
            : timeEntrySettingsDefaultState.clockInNotificationReminderMobile
                .value;

        const isSendClockOutReminderEmail =
          QLData.clockOutNotificationReminderEmail
            ? QLData.clockOutNotificationReminderEmail.value
            : timeEntrySettingsDefaultState.clockOutNotificationReminderEmail
                .value;

        const isSendClockOutReminderMobile =
          QLData.clockOutNotificationReminderMobile
            ? QLData.clockOutNotificationReminderMobile.value
            : timeEntrySettingsDefaultState.clockOutNotificationReminderMobile
                .value;

        // Schedule notification channel arrays derived from the QL subscriptions,
        // used to render the read-only Schedule rows (Email/Mobile per row).
        const scheduleChannels = mapSubscriptionsToScheduleChannels(
          QLData.scheduleNotificationSubscriptions,
        );

        formField.forEach((field: any) => {
          switch (field.key) {
            case NotificationFieldKey.SEND_CLOCK_IN_NOTIFICATION_REMINDERS:
              {
                const clockInNotificationReminderTime =
                  QLData.clockInNotificationReminderTime &&
                  QLData.clockInNotificationReminderTime.value
                    ? QLData.clockInNotificationReminderTime.value
                    : timeEntrySettingsDefaultState
                        .clockInNotificationReminderTime.value;

                const formattedClockInTime = formatTimeTo12Hour(
                  clockInNotificationReminderTime,
                  isUKLocale,
                );

                const sendClockInReminders =
                  isSendClockInReminderEmail || isSendClockInReminderMobile;

                field.value = sendClockInReminders
                  ? `${intl.formatMessage({ id: 'on' })}${
                      isSendClockInReminderEmail
                        ? `, ${intl.formatMessage({ id: 'notificationEmail' })}`
                        : ''
                    }${
                      isSendClockInReminderMobile
                        ? `, ${intl.formatMessage({
                            id: 'notificationMobile',
                          })}`
                        : ''
                    }, ${formattedClockInTime}`
                  : intl.formatMessage({ id: 'off' });

                setValue(
                  'clockInNotificationReminderTime',
                  formattedClockInTime,
                );
                setValue(
                  'clockInNotificationReminderEmail',
                  isSendClockInReminderEmail,
                );
                setValue(
                  'clockInNotificationReminderMobile',
                  isSendClockInReminderMobile,
                );
              }
              break;

            case NotificationFieldKey.SEND_CLOCK_OUT_NOTIFICATION_REMINDERS:
              {
                const clockOutNotificationReminderTime =
                  QLData.clockOutNotificationReminderTime &&
                  QLData.clockOutNotificationReminderTime.value
                    ? QLData.clockOutNotificationReminderTime.value
                    : timeEntrySettingsDefaultState
                        .clockOutNotificationReminderTime.value;

                const formattedClockOutTime = formatTimeTo12Hour(
                  clockOutNotificationReminderTime,
                  isUKLocale,
                );

                const sendClockOutReminders =
                  isSendClockOutReminderEmail || isSendClockOutReminderMobile;

                field.value = sendClockOutReminders
                  ? `${intl.formatMessage({ id: 'on' })}${
                      isSendClockOutReminderEmail
                        ? `, ${intl.formatMessage({ id: 'notificationEmail' })}`
                        : ''
                    }${
                      isSendClockOutReminderMobile
                        ? `, ${intl.formatMessage({
                            id: 'notificationMobile',
                          })}`
                        : ''
                    }, ${formattedClockOutTime}`
                  : intl.formatMessage({ id: 'off' });

                setValue(
                  'clockOutNotificationReminderTime',
                  formattedClockOutTime,
                );
                setValue(
                  'clockOutNotificationReminderEmail',
                  isSendClockOutReminderEmail,
                );
                setValue(
                  'clockOutNotificationReminderMobile',
                  isSendClockOutReminderMobile,
                );
              }
              break;

            case NotificationFieldKey.NOTIFICATION_ENABLED_FOR_DAYS:
              {
                const notificationEnabledForDays =
                  QLData.notificationEnabledForDays &&
                  QLData.notificationEnabledForDays.value
                    ? QLData.notificationEnabledForDays.value
                    : timeEntrySettingsDefaultState.notificationEnabledForDays
                        .value;

                field.value =
                  isSendClockInReminderEmail ||
                  isSendClockInReminderMobile ||
                  isSendClockOutReminderEmail ||
                  isSendClockOutReminderMobile
                    ? notificationEnabledForDays
                        .map((day) => uppercaseToPascalcase(day))
                        .join(', ')
                    : intl.formatMessage({ id: 'off' });

                setValue(
                  'notificationEnabledForDays',
                  notificationEnabledForDays,
                );
              }
              break;

            case NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED:
              {
                const notifyToAdmin =
                  QLData &&
                  QLData.notifyAdminOnClockOutOverrideEnabled &&
                  QLData.notifyAdminOnClockOutOverrideEnabled.value
                    ? QLData.notifyAdminOnClockOutOverrideEnabled.value
                    : timeEntrySettingsDefaultState
                        .notifyAdminOnClockOutOverrideEnabled.value;

                const notifyToManager =
                  QLData &&
                  QLData.notifyManagerOnClockOutOverrideEnabled &&
                  QLData.notifyManagerOnClockOutOverrideEnabled.value
                    ? QLData.notifyManagerOnClockOutOverrideEnabled.value
                    : timeEntrySettingsDefaultState
                        .notifyManagerOnClockOutOverrideEnabled.value;

                const fieldVisibilityValue = !!(
                  QLData &&
                  QLData.editClockOutTimeEnabled &&
                  QLData.editClockOutTimeEnabled.value &&
                  QLData.editClockOutTimeEnabled.value
                );

                field.isVisible = fieldVisibilityValue;
                isFieldsVisible.notifyWhenClockInOutTimeAdjusted =
                  fieldVisibilityValue;

                field.value =
                  // eslint-disable-next-line no-nested-ternary
                  notifyToAdmin && notifyToManager
                    ? `${intl.formatMessage({ id: 'adminsAndManagers' })}`
                    : // eslint-disable-next-line no-nested-ternary
                    notifyToAdmin
                    ? `${intl.formatMessage({ id: 'adminsOnly' })}`
                    : notifyToManager
                    ? `${intl.formatMessage({ id: 'managersOnly' })}`
                    : `${intl.formatMessage({ id: 'none' })}`;

                setValue(
                  'notifyWhenClockInOutUpdated',
                  // eslint-disable-next-line no-nested-ternary
                  notifyToAdmin && notifyToManager
                    ? 'adminsAndManagers'
                    : // eslint-disable-next-line no-nested-ternary
                    notifyToAdmin
                    ? 'adminsOnly'
                    : notifyToManager
                    ? 'managersOnly'
                    : 'none',
                );
              }

              break;

            case NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED:
              {
                const notifyToAdmin =
                  QLData &&
                  QLData.notifyAdminOnTimeSheetNotesEditEnabled &&
                  QLData.notifyAdminOnTimeSheetNotesEditEnabled.value
                    ? QLData.notifyAdminOnTimeSheetNotesEditEnabled.value
                    : timeEntrySettingsDefaultState
                        .notifyAdminOnTimeSheetNotesEditEnabled.value;

                const notifyToManager =
                  QLData &&
                  QLData.notifyGroupManagerOnTimeSheetNotesEditEnabled &&
                  QLData.notifyGroupManagerOnTimeSheetNotesEditEnabled.value
                    ? QLData.notifyGroupManagerOnTimeSheetNotesEditEnabled.value
                    : timeEntrySettingsDefaultState
                        .notifyGroupManagerOnTimeSheetNotesEditEnabled.value;

                const fieldVisibilityValue = !!(
                  QLData &&
                  QLData.timeSheetEntryNotesEnabled &&
                  QLData.timeSheetEntryNotesEnabled.value &&
                  QLData.timeSheetEntryNotesEnabled.value
                );

                field.isVisible = fieldVisibilityValue;
                isFieldsVisible.notifyWhenNotesAreAddedOrEdited =
                  fieldVisibilityValue;

                field.value =
                  // eslint-disable-next-line no-nested-ternary
                  notifyToAdmin && notifyToManager
                    ? `${intl.formatMessage({ id: 'adminsAndManagers' })}`
                    : // eslint-disable-next-line no-nested-ternary
                    notifyToAdmin
                    ? `${intl.formatMessage({ id: 'adminsOnly' })}`
                    : notifyToManager
                    ? `${intl.formatMessage({ id: 'managersOnly' })}`
                    : `${intl.formatMessage({ id: 'none' })}`;

                setValue(
                  'notifyWhenNotesAreAddedOrEdited',
                  (() => {
                    if (notifyToAdmin && notifyToManager) {
                      return 'adminsAndManagers';
                    }
                    if (notifyToAdmin) {
                      return 'adminsOnly';
                    }
                    if (notifyToManager) {
                      return 'managersOnly';
                    }
                    return 'none';
                  })(),
                );
              }
              break;

            case NotificationFieldKey.GEOFENCE_REMINDER_SETTINGS:
              {
                const geofenceReminderStartTime =
                  QLData.geofenceReminderStartTime &&
                  QLData.geofenceReminderStartTime.value
                    ? QLData.geofenceReminderStartTime.value
                    : timeEntrySettingsDefaultState.geofenceReminderStartTime
                        .value;

                const geofenceReminderEndTime =
                  QLData.geofenceReminderEndTime &&
                  QLData.geofenceReminderEndTime.value
                    ? QLData.geofenceReminderEndTime.value
                    : timeEntrySettingsDefaultState.geofenceReminderEndTime
                        .value;

                const geofenceReminderDaysOfWeek =
                  QLData.geofenceReminderDaysOfWeek &&
                  QLData.geofenceReminderDaysOfWeek.value
                    ? QLData.geofenceReminderDaysOfWeek.value
                    : timeEntrySettingsDefaultState.geofenceReminderDaysOfWeek
                        .value;

                const formattedStartTime = formatTimeTo12Hour(
                  geofenceReminderStartTime,
                  isUKLocale,
                );
                const formattedEndTime = formatTimeTo12Hour(
                  geofenceReminderEndTime,
                  isUKLocale,
                );

                const formattedDays = geofenceReminderDaysOfWeek
                  .map((day) => uppercaseToPascalcase(day))
                  .join(', ');

                field.value = `${formattedStartTime} - ${formattedEndTime}, ${formattedDays}`;

                setValue('geofenceReminderStartTime', formattedStartTime);
                setValue('geofenceReminderEndTime', formattedEndTime);
                setValue(
                  'geofenceReminderDaysOfWeek',
                  geofenceReminderDaysOfWeek,
                );
              }
              break;

            // Read publishShiftChangePreference (ALWAYS/ASK/NEVER) plus the
            // SHIFT_PUBLISHED subscription channels (EMAIL/PUSH_NOTIFICATION).
            // Empty when the send-mode preference is unset.
            case NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE: {
              const shiftChangeSendMode = mapShiftChangePreferenceToSendMode(
                QLData.publishShiftChangePreference?.value,
              );
              field.value = shiftChangeSendMode
                ? formatScheduleNotificationSummaryValue(
                    intl,
                    shiftChangeSendMode,
                    hasMobileChannel(scheduleChannels.scheduleShiftPublished),
                    hasEmailChannel(scheduleChannels.scheduleShiftPublished),
                  )
                : '';
              break;
            }

            case NotificationFieldKey.SCHEDULE_ONE_HOUR_BEFORE_SHIFT:
              field.value = formatChannelsFor(
                intl,
                scheduleChannels,
                NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS,
              );
              break;

            case NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED:
              field.value = formatChannelsFor(
                intl,
                scheduleChannels,
                NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_STARTED_CHANNELS,
              );
              break;

            case NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_ENDED:
              field.value = formatChannelsFor(
                intl,
                scheduleChannels,
                NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS,
              );
              break;

            case NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER:
              field.value = formatChannelsFor(
                intl,
                scheduleChannels,
                NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS,
              );
              break;

            default:
              break;
          }
        });
      });

      setNotificationFields({ ...notificationFields });
      updateVisibleFields({ ...isFieldsVisible });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    QLData,
    isQLSettingsLoading,
    isUKLocale,
    isGeofenceExperienceEnabled,
    isTimeElite,
    isScheduleSettingsEnabled,
  ]);

  // To handle the key value notification values in case of error scenarios
  useEffect(() => {
    if (
      !isQLSettingsLoading &&
      QLSettingsError &&
      QLSettingsError !== '' &&
      notificationFields
    ) {
      Object.keys(notificationFields).forEach((key) => {
        const formField = notificationFields[key];

        formField.forEach((field: any) => {
          switch (field.key) {
            case NotificationFieldKey.SEND_CLOCK_IN_NOTIFICATION_REMINDERS:
              field.value = intl.formatMessage({ id: 'off' });

              setValue(
                'clockInNotificationReminderTime',
                formatTimeTo12Hour('8:00', isUKLocale),
              );
              setValue('clockInNotificationReminderEmail', false);
              setValue('clockInNotificationReminderMobile', false);
              break;

            case NotificationFieldKey.SEND_CLOCK_OUT_NOTIFICATION_REMINDERS:
              field.value = intl.formatMessage({ id: 'off' });

              setValue(
                'clockOutNotificationReminderTime',
                formatTimeTo12Hour('17:00', isUKLocale),
              );
              setValue('clockOutNotificationReminderEmail', false);
              setValue('clockOutNotificationReminderMobile', false);
              break;

            case NotificationFieldKey.NOTIFICATION_ENABLED_FOR_DAYS:
              field.value = WEEK_DAYS.map((day: string) =>
                uppercaseToPascalcase(day),
              ).join(', ');

              setValue('notificationEnabledForDays', WEEK_DAYS);
              break;

            case NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED:
              field.value = `${intl.formatMessage({ id: 'none' })}`;

              field.isVisible = true;

              setValue('notifyWhenClockInOutUpdated', 'none');
              break;

            case NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED:
              field.value = `${intl.formatMessage({ id: 'none' })}`;

              field.isVisible = true;

              setValue('notifyWhenNotesAreAddedOrEdited', 'none');
              break;

            // QL error: section shows the "try again" banner, so clear the value.
            case NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE:
              field.value = '';
              break;

            case NotificationFieldKey.SCHEDULE_ONE_HOUR_BEFORE_SHIFT:
            case NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED:
            case NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_ENDED:
            case NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER:
              field.value = formatScheduleNotificationOnOffChannelValue(
                intl,
                false,
                null,
              );
              break;

            default:
              break;
          }
        });
      });

      setNotificationFields({ ...notificationFields });
      updateVisibleFields({ ...isFieldsVisible });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    QLSettingsError,
    isQLSettingsLoading,
    isUKLocale,
    isGeofenceExperienceEnabled,
    isTimeElite,
  ]);

  // When geofenceEnabled changes in form (e.g. toggled in Geo Locations trowser), update visibility
  useEffect(() => {
    if (notificationFields) {
      updateGeofenceFieldsVisibility(
        notificationFields,
        isGeofenceExperienceEnabled,
        isTimeElite,
        geofenceEnabledValue,
      );
      setNotificationFields({ ...notificationFields });
    }
    // `notificationFields`, `isGeofenceExperienceEnabled`, and `isTimeElite` are
    // intentionally omitted — this effect should only run when the geofence toggle
    // value changes to avoid redundant visibility updates on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geofenceEnabledValue]);

  useEffect(
    () => {
      if (notificationFields) {
        const geofenceEnabledFromQL = QLData?.geofenceEnabled?.value ?? false;
        if (QLData) {
          // Update form state to keep it in sync
          setValue('geofenceEnabled', geofenceEnabledFromQL, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
        updateGeofenceFieldsVisibility(
          notificationFields,
          isGeofenceExperienceEnabled,
          isTimeElite,
          geofenceEnabledFromQL,
        );

        // If feature flag is disabled, hide all approval and submission fields
        if (!isPostR2ReleaseTimeExperienceEnabled) {
          updateFieldsVisibility(
            notificationFields,
            APPROVAL_AND_SUBMISSION_FIELDS,
            false,
          );
          setNotificationFields({ ...notificationFields });
          return;
        }

        // Feature flag is enabled, proceed with normal logic
        if (approvalSettings && !approvalSettingsLoading) {
          const managerApprovalsRemindersBasedOn =
            approvalSettings.managerReminderBasedOn?.value ||
            ApprovalRemindersbasedOn.DAY_OF_WEEK;
          const employeeReminderBasedOn =
            approvalSettings.employeeReminderBasedOn?.value ||
            ApprovalRemindersbasedOn.DAY_OF_WEEK;
          const isApprovalsEnabled =
            approvalSettings.requireApprovalForTrackedTime?.value;

          Object.keys(notificationFields).forEach((key) => {
            const formField = notificationFields[key];

            formField.forEach((field: any) => {
              switch (field.key) {
                case NotificationFieldKey.MANAGER_REMINDER_BASED_ON:
                  field.value =
                    managerApprovalsRemindersBasedOn ===
                    ApprovalRemindersbasedOn.DAY_OF_WEEK
                      ? intl.formatMessage({
                          id: 'time-entries.section.title.submissions.send-reminder-team-submit-time.value',
                        })
                      : intl.formatMessage({
                          id: 'time-entries.section.title.approvals.remind-managers-approve-time.value',
                        });
                  setValue(
                    'managerReminderBasedOn',
                    managerApprovalsRemindersBasedOn,
                  );
                  break;

                case NotificationFieldKey.MANAGER_FIRST_REMINDER: {
                  const { fieldValue, fieldTitle, formValues } =
                    getReminderData(
                      approvalSettings,
                      ReminderRole.MANAGER,
                      ApprovalReminderPrefix.CURRENT,
                      managerApprovalsRemindersBasedOn,
                      isUKLocale,
                      intl,
                    );

                  const currentMedium =
                    managerApprovalsRemindersBasedOn ===
                    ApprovalRemindersbasedOn.DAY_OF_WEEK
                      ? approvalSettings.managerCurrentWeekReminderMedium
                          ?.value || []
                      : approvalSettings.managerCurrentPayPeriodReminderMedium
                          ?.value || [];

                  const isEmailEnabled =
                    currentMedium.length > 0 &&
                    currentMedium[0] === NotificationMedium.EMAIL;

                  field.title = fieldTitle;
                  field.value = isEmailEnabled
                    ? fieldValue
                    : intl.formatMessage({ id: 'off' });
                  Object.entries(formValues).forEach(([key, value]) =>
                    setValue(key, value),
                  );
                  break;
                }

                case NotificationFieldKey.MANAGER_SECOND_REMINDER: {
                  const { fieldValue, fieldTitle, formValues } =
                    getReminderData(
                      approvalSettings,
                      ReminderRole.MANAGER,
                      ApprovalReminderPrefix.PREVIOUS,
                      managerApprovalsRemindersBasedOn,
                      isUKLocale,
                      intl,
                    );

                  const previousMedium =
                    managerApprovalsRemindersBasedOn ===
                    ApprovalRemindersbasedOn.DAY_OF_WEEK
                      ? approvalSettings.managerPreviousWeekReminderMedium
                          ?.value || []
                      : approvalSettings.managerPreviousPayPeriodReminderMedium
                          ?.value || [];

                  const isEmailEnabled =
                    previousMedium.length > 0 &&
                    previousMedium[0] === NotificationMedium.EMAIL;

                  field.title = fieldTitle;
                  field.value = isEmailEnabled
                    ? fieldValue
                    : intl.formatMessage({ id: 'off' });
                  Object.entries(formValues).forEach(([key, value]) =>
                    setValue(key, value),
                  );
                  break;
                }

                case NotificationFieldKey.EMPLOYEE_REMINDER_BASED_ON: {
                  const messageIds: Record<string, string> = {
                    [ApprovalRemindersbasedOn.DAY_OF_WEEK]:
                      'time-entries.section.title.submissions.send-reminder-team-submit-time.value',
                    [ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE]:
                      'time-entries.section.title.approvals.based-on-pay-period',
                    [ApprovalRemindersbasedOn.DAILY]:
                      'time-entries.section.title.submissions.daily',
                  };
                  field.value = intl.formatMessage({
                    id:
                      messageIds[employeeReminderBasedOn] ||
                      messageIds[ApprovalRemindersbasedOn.DAY_OF_WEEK],
                  });
                  setValue('employeeReminderBasedOn', employeeReminderBasedOn);
                  break;
                }

                case NotificationFieldKey.EMPLOYEE_FIRST_REMINDER: {
                  const { fieldValue, fieldTitle, formValues } =
                    getReminderData(
                      approvalSettings,
                      ReminderRole.EMPLOYEE,
                      ApprovalReminderPrefix.CURRENT,
                      employeeReminderBasedOn,
                      isUKLocale,
                      intl,
                    );
                  field.title = fieldTitle;
                  field.value = fieldValue;
                  Object.entries(formValues).forEach(([key, value]) =>
                    setValue(key, value),
                  );
                  break;
                }

                case NotificationFieldKey.EMPLOYEE_SECOND_REMINDER: {
                  const { fieldValue, fieldTitle, formValues } =
                    getReminderData(
                      approvalSettings,
                      ReminderRole.EMPLOYEE,
                      ApprovalReminderPrefix.PREVIOUS,
                      employeeReminderBasedOn,
                      isUKLocale,
                      intl,
                    );
                  field.title = fieldTitle;
                  field.value = fieldValue;
                  Object.entries(formValues).forEach(([key, value]) =>
                    setValue(key, value),
                  );
                  break;
                }

                case NotificationFieldKey.SUBMISSION_REMINDER_DAYS_OF_WEEK: {
                  const employeeDailyReminderForTimesheetDays =
                    approvalSettings.employeeDailyReminderForTimesheetDays
                      ?.value || [];
                  const employeeDailyReminderSecondReminderMedium =
                    approvalSettings.employeeDailyReminderSecondReminderMedium
                      ?.value || [];
                  const employeeDailyFirstReminderMedium =
                    approvalSettings.employeeDailyReminderFirstReminderMedium
                      ?.value || [];

                  const isEmailEnabled =
                    (employeeDailyReminderSecondReminderMedium.length > 0 &&
                      employeeDailyReminderSecondReminderMedium[0] ===
                        NotificationMedium.EMAIL) ||
                    (employeeDailyFirstReminderMedium.length > 0 &&
                      employeeDailyFirstReminderMedium[0] ===
                        NotificationMedium.EMAIL);

                  field.value = isEmailEnabled
                    ? formatArrayToTitleCase(
                        employeeDailyReminderForTimesheetDays,
                      )
                    : intl.formatMessage({ id: 'off' });
                  setValue(
                    'employeeDailyReminderForTimesheetDays',
                    employeeDailyReminderForTimesheetDays,
                  );
                  break;
                }

                case NotificationFieldKey.NOTIFY_MANAGER_ON_GROUP_SUBMITTED: {
                  const notifyManagerOnGroupSubmitted =
                    approvalSettings.notifyManagerOnGroupSubmitted?.value ||
                    false;
                  field.value = notifyManagerOnGroupSubmitted
                    ? intl.formatMessage({ id: 'on' })
                    : intl.formatMessage({ id: 'off' });
                  setValue(
                    'notifyManagerOnGroupSubmitted',
                    notifyManagerOnGroupSubmitted,
                  );
                  break;
                }

                case NotificationFieldKey.NOTIFY_MANAGER_ON_SUBMIT: {
                  const notifyManagerOnSubmit =
                    approvalSettings.notifyManagerOnSubmit?.value || false;
                  field.value = intl.formatMessage({
                    id: notifyManagerOnSubmit
                      ? intl.formatMessage({ id: 'on' })
                      : intl.formatMessage({ id: 'off' }),
                  });
                  setValue('notifyManagerOnSubmit', notifyManagerOnSubmit);
                  break;
                }

                default:
                  break;
              }
            });
          });

          // Update submission fields visibility after all values are set
          updateSubmissionFieldsVisibility(
            notificationFields,
            isApprovalsEnabled,
            isPostR2ReleaseTimeExperienceEnabled,
            employeeReminderBasedOn,
          );

          setNotificationFields({ ...notificationFields });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      approvalSettings,
      approvalSettingsLoading,
      isUKLocale,
      isPostR2ReleaseTimeExperienceEnabled,
      isGeofenceExperienceEnabled,
      isTimeElite,
    ],
  );

  // Handle approval settings error - make approval and submission fields visible
  useEffect(
    () => {
      if (
        !approvalSettingsLoading &&
        approvalSettingsError &&
        approvalSettingsError !== '' &&
        notificationFields &&
        isPostR2ReleaseTimeExperienceEnabled
      ) {
        updateFieldsVisibility(
          notificationFields,
          APPROVAL_AND_SUBMISSION_FIELDS,
          true,
        );
        setNotificationFields({ ...notificationFields });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approvalSettingsError, approvalSettingsLoading],
  );

  return (
    <GeneralSettingSection
      ViewContent={
        <NotificationsSettingsViewColumn>
          <ViewContent
            formFields={notificationFields}
            isErrorInView={hasBothErrors}
            sectionErrors={sectionErrors}
          />
          {isOvertimeCardEnabled && (
            <EmployerOvertimeNotificationsView
              rules={savedOvertimeRules}
              loading={isQLSettingsLoading}
              hasLoadedFromApi={overtimeHasLoadedFromApi}
            />
          )}
        </NotificationsSettingsViewColumn>
      }
      EditContent={
        <>
          {!hasQLError && (
            <div
              id="notifications-clockin-subsection"
              ref={registerSectionRef?.('notifications-clockin-subsection')}
            >
              <EditNotificationTimeEntry isFieldsVisible={isFieldsVisible} />
            </div>
          )}

          {isPostR2ReleaseTimeExperienceEnabled && !hasApprovalError && (
            <div
              id="notifications-approvals-subsection"
              ref={registerSectionRef?.('notifications-approvals-subsection')}
            >
              <EditApprovalsNotificationSettings />
            </div>
          )}

          {isPostR2ReleaseTimeExperienceEnabled && !hasApprovalError && (
            <div
              id="notifications-submissions-subsection"
              ref={registerSectionRef?.('notifications-submissions-subsection')}
            >
              <EditSubmissionsNotificationSettings />
            </div>
          )}

          {!hasQLError &&
            isTimeElite &&
            isGeofenceExperienceEnabled &&
            geofenceEnabledValue && (
              <div
                id="notifications-geofence-subsection"
                ref={registerSectionRef?.('notifications-geofence-subsection')}
              >
                <EditGeofenceNotificationSettings />
              </div>
            )}

          {isScheduleSettingsEnabled && !hasQLError && (
            <div
              id="notifications-schedule-subsection"
              ref={registerSectionRef?.('notifications-schedule-subsection')}
            >
              <EditScheduleNotificationSettings />
            </div>
          )}

          {!hasQLError && isOvertimeCardEnabled && (
            <div
              id="notifications-overtime-subsection"
              ref={registerSectionRef?.('notifications-overtime-subsection')}
            >
              <EmployerOvertimeNotificationsEdit
                draftRules={draftOvertimeRules}
                loading={isQLSettingsLoading}
                hasLoadedFromApi={overtimeHasLoadedFromApi}
                onDraftRulesChange={setDraftOvertimeRules}
              />
            </div>
          )}
        </>
      }
      Title={notificationFieldSettingSection}
      onFormUpdate={onFormUpdate}
      onFormCancel={handleFormCancel}
      isFormEdit={isNotificationFieldEditing}
      onSaveTimeTrackingSettings={onSaveTimeEntrySettings}
      id={id}
      isFormEditable={isFormEditableWithErrors}
      isDataUpdating={isDataUpdating}
      formEditType={TimeEntriesFormType.NOTIFICATION}
    />
  );
};
