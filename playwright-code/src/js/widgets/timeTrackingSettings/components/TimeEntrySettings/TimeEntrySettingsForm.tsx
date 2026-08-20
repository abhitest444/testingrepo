import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormProvider, SubmitHandler } from 'react-hook-form';
import Widget from 'web-shell-core/widgets/HOCWidget';
import {
  useFeatureFlag,
  useIntl,
  useTracking,
  useSandbox,
} from '@payroll/quicksand';
import styled, { keyframes } from 'styled-components';
import Button from '@ids-ts/button';
import { CommentPencil } from '@design-systems/icons';
import Typography from '@ids-ts/typography';
import { IconControl } from '@ids-ts/icon-control';
import { Activity } from '@ids-ts/loader';

import { NAVIGATION_ROUTES } from 'src/js/widgets/ttoHomePage/constants';
import {
  APPROVAL_SETTINGS_CONFIG,
  TIME_TRACKING_FORM_CONFIG,
  TIMESHEET_SETTINGS_FIELDS,
} from 'src/js/widgets/timeTrackingSettings/common/viewForm';
import { GeneralSettingSection } from 'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection';
import { ViewContent } from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import { TIME_ENTRY_SETTINGS_CONFIG } from 'src/js/widgets/timeTrackingSettings/config';
import {
  comparingTimeEntrySettingsToPreviousTimeEntrySettings,
  mappedTimeEntrySettingsForMutation,
  removeTimeEntryDirtyFieldsUtils,
  updateTimeSheetFieldsSelectedFields,
  useTimeEntrySettings,
} from 'src/js/widgets/timeTrackingSettings/hooks/useTimeEntrySettingsForm';
import {
  combinedApprovalSettings,
  CustomFieldData,
  IFormConfig,
  IIsFieldsVisible,
  ITimeEntriesFormEditing,
  ITimeEntrySettingsFormState,
  ITimeSheetFieldOption,
} from 'src/js/widgets/timeTrackingSettings/types';
import {
  APPROVAL_FIELD_NAMES,
  IS_TIME_ENTRIES_FORM_EDITING,
  MANAGE_KIOSK_LEGACY_WIDGET_ID,
  MANAGE_KIOSK_ORCHESTRATOR_WIDGET_ID,
  PAYROLL_DEFAULTS_SOURCE,
  SEARCH_SECTION_KEYS,
  SettingsTrowserKey,
  TimeEntriesFormType,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { MappedQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import {
  SetQLSettingsArgs,
  useSetQLSettings,
} from 'src/js/service/hooks/settings/useSetQLSettings';
import { useSetApprovalSettings } from 'src/js/service/hooks/settings/useSetApprovalSettings';
import {
  mapApprovalSettingsForMutation,
  hasApprovalSettingsChanges,
} from 'src/js/widgets/timeTrackingSettings/hooks/mapApprovalSettings';
import { createScheduleNotificationsInput } from 'src/js/widgets/timeTrackingSettings/hooks/mutationHelper';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { TimeTrackingTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeTrackingTimeEntrySettings/TimeTrackingTimeEntrySettings';
import { TimeSheetFields } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/TimeSheetFields';
import { NotificationsTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/NotificationsTimeEntrySettings';
import { GeoLocationsTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/geoLocations/GeoLocationsTimeEntrySettings';
import { SchedulesTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/schedules/SchedulesTimeEntrySettings';
import { ApprovalsTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/approvals/ApprovalsTimeEntrySettings';
import {
  cancelTimeEntrySettingsForm,
  successUpdateCompanySettings,
  updateTimeEntrySettingsForm,
} from 'src/js/widgets/timeTrackingSettings/hooks/timeEntrySettingsHandler';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import FeedbackPopover from 'src/js/widgets/common/feedbackPopover/FeedbackPopover';
import {
  APPROVAL_SETTINGS_TRACKING_FIELDS,
  TrackingPoint,
} from 'src/js/common/useClickTracking';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import {
  WORKFLOWS,
  FEATURE_FLAGS,
  VARIABILITY_DECISIONS,
  SECTION_READY_EVENT,
  SECTION_READY_KEYS,
} from 'src/js/common/constants';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { useNttfEligibility } from 'src/js/service/hooks/nttf/useNttfEligibility';
import { canEditPreference } from 'src/js/service/utils/sandboxUtils';
import { resolveBool } from 'src/js/common/boolQuery';
import {
  FEATURE_NAMES,
  FUNCTIONALITY_NAMES,
} from 'src/js/widgets/qbtOrchestrator/constants';
import {
  ConfirmationModalContent,
  ErrorOrWarningMessage,
} from 'src/js/widgets/timeTrackingSettings/TimeTrackingSettings.styled';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  useInitializeItmTasks,
  useUpdateItmTask,
} from 'src/js/widgets/qbtOrchestrator/features/overview/hooks';
import { selectItmTasks } from 'src/js/widgets/qbtOrchestrator/features/overview/store/overviewSelectors';
import { storeManager } from 'src/js/widgets/qbtOrchestrator/store/storeManager';
import {
  ITEM_TASK_TYPE_SETUP_TIMESHEET,
  ITM_TASK_STATUS_OPEN,
  ITM_TASK_STATUS_DONE_YES,
  ITM_LOGGING,
} from 'src/js/widgets/qbtOrchestrator/features/overview/constants';
import UserVoiceFeedBackWidget from 'src/js/widgets/common/feedbackPopover/UserVoiceFeedBackWidget';
import { TimeTracking_OvertimeNotificationRule } from 'src/__generated__/timeTracking/graphql';
import { buildOvertimeNotificationsManageInput } from 'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/overtimeNotifications.utils';
import { useOvertimeFeatureFlag } from 'src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled';
import {
  useDeepLinkNavigation,
  SectionEnabledState,
} from 'src/js/widgets/timeTrackingSettings/hooks/useDeepLinkNavigation';
import { getManageKioskWidgetId } from 'src/js/widgets/timeTrackingSettings/utils';

interface ITimeEntrySettingsForm {
  type: string;
  onIsDirtyTimeForm?: (isDirty: boolean) => boolean;
  /**
   * Standalone entry point. When set to `'timesheet-settings'`, the form skips
   * the full settings page and opens directly into the Timesheet settings
   * trowser.
   */
  trowserKey?: SettingsTrowserKey;
  /**
   * Invoked once the standalone trowser (see `trowserKey`) is closed — via
   * cancel, dismiss, or a successful save — so the calling page can navigate
   * back to itself.
   */
  onClose?: () => void;
  /**
   * Identifies the caller/context that launched this widget. When set to
   * `'payroll_defaults'`, the standalone timesheet settings trowser is closed
   * and control is handed back to the caller via `onClose`.
   */
  source?: string;
}

type FitAndFinishLogData = {
  old: {
    manageOwnTimeSheets: boolean | undefined;
    mobileTimeTracking: boolean | undefined;
    signatureCapture: boolean | undefined;
  };
  new: {
    manageOwnTimeSheets: boolean;
    mobileTimeTracking: boolean;
    signatureCapture: boolean;
  };
  changedFields: string[];
};

const FIT_AND_FINISH_FIELDS = [
  'manageOwnTimeSheetsEnabled',
  'mobileTimeTrackingEnabled',
  'signatureCaptureEnabled',
] as const;

const FeedBackFormComponent = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  padding-right: 32px;
`;

const DeepLinkLoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  /* Overlay z-index matches modal overlays to ensure loader appears above content but below critical UI */
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const WidgetSectionWrapper = styled.div`
  min-height: 80px;
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const FeedBackFormButton = styled(Button)`
  color: var(--color-action-standard) !important;
  background: none !important;
`;

const CommentPencilButton = styled(CommentPencil)`
  margin: 8px 5px;
`;

export const TimeEntrySettingsForm: React.FC<ITimeEntrySettingsForm> = ({
  type,
  onIsDirtyTimeForm,
  trowserKey,
  onClose,
  source,
}) => {
  // Standalone entry point: render only the Timesheet trowser (no settings page
  // chrome) and hand control back to the caller via `onClose` when it closes.
  const isTimesheetTrowserOnly = trowserKey === 'timesheet-settings';
  // When launched from payroll defaults, clicking "Set defaults" in the
  // Dimensions section closes this timesheet trowser (hands control back to the
  // caller via `onClose`). Returns whether the click was handled so the
  // Dimensions section can fall back to the custom defaults widget otherwise.
  const onDimensionsSetDefaults = (): boolean => {
    if (source === PAYROLL_DEFAULTS_SOURCE) {
      onClose?.();
      return true;
    }
    return false;
  };
  const timeTrackingFieldSettingSection =
    'time-entries.section.title.time-tracking';
  const timeSheetFieldSettingSection = 'time-entries.section.title.time-sheet';
  const notificationFieldSettingSection =
    'time-entries.section.title.notifications';
  const customFieldsSettingSection = 'time-entries.section.title.custom-fields';
  const approvalFieldSettingSection = 'time-entries.section.title.approvals';

  const feedbackButton = document.querySelector(
    `[data-automation-id="timeEntry-feedback"]`,
  ) as HTMLElement;

  const {
    QLData,
    sandbox,
    updateErrorMessage,
    reRenderTimeEntrySetting,
    errorMessage,
    isFormEditable,
    isUKLocale,
    urlParams,
    approvalSettings,
    refetchApprovalSettings,
    isQLSettingsLoading,
    sectionPath,
  } = useTimeTrackingSettingsContext(false);
  const intl = useIntl();
  const track = useTracking();
  const logger = useLoggingConfig();

  // ITM task wiring: initialize tasks into the shared orchestrator store and
  // complete the "setup-timesheet" task once timesheet settings are saved.
  useInitializeItmTasks();
  const { updateItmTask } = useUpdateItmTask();
  const { isEnabled: isOverviewModernisationEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_QBTIME_OVERVIEW_MODERNISATION,
    defaultValue: false,
  });

  const {
    isEnabled: isFeatureFlagEnableForTimeOffSettings,
    settled: isTimeOffFlagSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_OFF_SETTINGS,
    defaultValue: false,
  });

  const { data: showAdvancedTimeOffManagement, error: variabilityError } =
    useQbTimeSdk<boolean, [string]>((sdk) => sdk.evaluateDecision, {
      executeOnMount: true,
      args: [VARIABILITY_DECISIONS.SHOW_ADVANCED_TIME_OFF_MANAGEMENT],
    });
  const {
    data: shouldShowApprovalRequiredTimeSubmission,
    loading: approvalRequiredTimeSubmissionLoading,
  } = useQbTimeSdk<boolean>(
    (sdk) => async () =>
      sdk.submitTimeService.shouldShowApprovalRequiredTimeSubmission(),
    { executeOnMount: true },
  );
  const {
    data: isSubmittedFeatureEnabled,
    loading: submittedTimeStatusDisplayLoading,
  } = useQbTimeSdk<boolean>(
    (sdk) => async () =>
      sdk.submitTimeService.isSubmittedTimeStatusDisplayEnabled(),
    { executeOnMount: true },
  );
  const { isNttfEligible, loading: isNttfEligibilityLoading } =
    useNttfEligibility();
  // Match IXP `settled` semantics — the decision is settled once it
  // either resolves or errors. Until then, suppress deep-link navigation
  // to the time-off section to avoid scrolling to a section that hasn't
  // decided whether it will render.
  const isVariabilitySettled =
    showAdvancedTimeOffManagement !== undefined ||
    variabilityError !== undefined;

  const {
    isEnabled: isPostR2ReleaseTimeExperienceEnabled,
    settled: isR2FlagSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_R2_RELEASE,
    defaultValue: false,
  });

  const {
    isEnabled: isFeatureFlagEnableForGeoLocationSettings,
    settled: isGeoFlagSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_GEO_LOCATION_SETTINGS_UI,
    defaultValue: false,
  });

  const {
    isEnabled: isScheduleSettingsEnabled,
    settled: isScheduleFlagSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_ENABLE_SCHEDULE_SETTINGS,
    defaultValue: false,
  });

  const {
    isEnabled: isFeatureFlagEnableForOvertimeSettings,
    settled: isOvertimeFlagSettled,
  } = useOvertimeFeatureFlag();
  const {
    isEnabled: isTimeKioskSettingsEnabled,
    settled: isTimeKioskSettingsFlagSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.ENABLE_TIME_KIOSK_SETTINGS,
    defaultValue: false,
  });

  const manageKioskWidgetId = useMemo(
    () => getManageKioskWidgetId(isTimeKioskSettingsEnabled),
    [isTimeKioskSettingsEnabled],
  );

  const manageKioskWidgetOptions = useMemo(() => {
    if (manageKioskWidgetId === MANAGE_KIOSK_ORCHESTRATOR_WIDGET_ID) {
      return {
        feature: FEATURE_NAMES.TIME_KIOSK,
        functionality: FUNCTIONALITY_NAMES.KIOSK_SETTINGS_HANDLE,
        isEditable: isFormEditable,
        inactivityTimeout: QLData.inactivityTimeout,
        isQLSettingsLoading,
      };
    }
    return undefined;
  }, [
    manageKioskWidgetId,
    isFormEditable,
    QLData.inactivityTimeout,
    isQLSettingsLoading,
  ]);

  const { isEnabled: isFeatureFlagEnableForGeofenceSettings } =
    useIXPFeatureFlag({
      flagName: FEATURE_FLAGS.SBSEG_QBO_R6_GEOFENCE,
      defaultValue: false,
    });

  // Track if feature flags are still loading (for deep-link navigation)
  // Use !settled instead of isLoading to avoid race conditions
  const featureFlagsLoading =
    !isTimeOffFlagSettled ||
    !isR2FlagSettled ||
    !isGeoFlagSettled ||
    !isScheduleFlagSettled ||
    !isOvertimeFlagSettled ||
    !isTimeKioskSettingsFlagSettled ||
    !isVariabilitySettled;
  const isSubmitTimeFeatureOn = resolveBool({
    must: [isSubmittedFeatureEnabled === true],
  });
  const isApprovalVisibilityResolved =
    !approvalRequiredTimeSubmissionLoading &&
    !submittedTimeStatusDisplayLoading &&
    !isNttfEligibilityLoading;
  const shouldShowApprovalControls = resolveBool({
    should: [
      !isNttfEligible,
      {
        must: [
          shouldShowApprovalRequiredTimeSubmission === true,
          isSubmitTimeFeatureOn,
        ],
      },
    ],
  });

  const timeEntrySettingsFormMethod = useTimeEntrySettings();
  const formStateRef = useRef(
    timeEntrySettingsFormMethod.formState.dirtyFields,
  );

  const [isFormEdit, setIsFormEdit] = useState<ITimeEntriesFormEditing>(
    IS_TIME_ENTRIES_FORM_EDITING,
  );

  const [timeTrackingFields, setTimeTrackingFields] = useState<IFormConfig>({
    [timeTrackingFieldSettingSection]:
      TIME_TRACKING_FORM_CONFIG[timeTrackingFieldSettingSection],
  });

  const [approvalFields, setApprovalFields] = useState<IFormConfig>({
    [approvalFieldSettingSection]:
      APPROVAL_SETTINGS_CONFIG[approvalFieldSettingSection],
  });

  const [notificationFields, setNotificationFields] = useState<IFormConfig>({
    [notificationFieldSettingSection]:
      TIME_TRACKING_FORM_CONFIG[notificationFieldSettingSection],
  });

  const customFields: IFormConfig = {
    [customFieldsSettingSection]: TIME_TRACKING_FORM_CONFIG[
      customFieldsSettingSection
    ].map((field) => {
      if (field.menuButton) {
        return {
          ...field,
          menuButton: {
            ...field.menuButton,
            onClick: () => {
              track(
                TIME_ENTRY_SETTINGS_TRACKING_POINTS.MANAGE_ALL_CUSTOM_FIELDS,
              );
              sandbox.navigation.navigate(NAVIGATION_ROUTES.CUSTOM_FIELDS);
            },
            'data-testid': 'custom-fields-add-new-button',
          },
        };
      }
      return {
        ...field,
        'data-testid': 'custom-fields-edit-button',
      };
    }),
  };

  const [editTimeSheetFields, setEditTimeSheetFields] = useState<
    ITimeSheetFieldOption[]
  >(TIMESHEET_SETTINGS_FIELDS);

  const [isTimeSheetEditing, setIsTimeSheetEditing] = useState<boolean>(false);

  const [updatedTimeEntryFormValue, setUpdatedTimeEntryFormValue] =
    useState<combinedApprovalSettings>();

  const [timeEntryFormOpenToUpdate, setTimeEntryFormOpenToUpdate] =
    useState<string>('');

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] =
    useState<boolean>(false);

  const [selectedCustomTimeSheetFields, setSelectedCustomTimeSheetFields] =
    useState<string[]>([]);

  const [isFieldsVisible, setIsFieldsVisible] = useState<IIsFieldsVisible>({
    notifyWhenClockInOutTimeAdjusted: false,
    notifyWhenNotesAreAddedOrEdited: false,
  });

  const [updatedFields, setUpdatedFields] = useState<string[]>([]);

  /** Latest saved + draft overtime rules for employer mutation (not RHF). */
  const employerOvertimeRulesRef = useRef<{
    saved: TimeTracking_OvertimeNotificationRule[];
    draft: TimeTracking_OvertimeNotificationRule[];
  }>({ saved: [], draft: [] });

  const fitAndFinishLogRef = useRef<FitAndFinishLogData | null>(null);
  // Set in onSubmit when notification schedule rows change; consumed in updateCompanySettings callbacks.
  const scheduleNotificationsSaveLogRef = useRef<boolean>(false);

  // is feedback popover open
  const [showFeedbackPopover, setShowFeedbackPopover] =
    useState<boolean>(false);

  // is feedback success toast open
  const [showFeedbackSuccessToast, setShowFeedbackSuccessToast] =
    useState<boolean>(false);

  const [refreshCustomFields, setRefreshCustomFields] = useState<number>(0);

  const [triggerFeedback, setTriggerFeedback] = useState<() => void>(
    () => () => {},
  );

  // Section refs for scroll targeting (avoids document.getElementById anti-pattern)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setSectionRef = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      sectionRefs.current[key] = el;
    },
    [],
  );

  // Compute enabled state for each section (config + supportedLists + feature flags)
  const sectionEnabledState: SectionEnabledState = {
    timeTracking:
      TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.isEnabled(sandbox) &&
      TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.supportedLists.includes(type),
    timesheet:
      TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.isEnabled(sandbox) &&
      TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.supportedLists.includes(type),
    notifications:
      (TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.isEnabled(sandbox) &&
        TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.supportedLists.includes(
          type,
        )) ||
      (TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.isEnabled(sandbox) &&
        TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.supportedLists.includes(
          type,
        )),
    breaks:
      TIME_ENTRY_SETTINGS_CONFIG.BREAKS.enabled &&
      isPostR2ReleaseTimeExperienceEnabled,
    overtime:
      TIME_ENTRY_SETTINGS_CONFIG.OVERTIME.enabled &&
      isFeatureFlagEnableForOvertimeSettings,
    geoLocations:
      TIME_ENTRY_SETTINGS_CONFIG.GEO_LOCATIONS.enabled &&
      isFeatureFlagEnableForGeoLocationSettings,
    customFields:
      TIME_ENTRY_SETTINGS_CONFIG.CUSTOM_FIELDS.isEnabled(sandbox) &&
      TIME_ENTRY_SETTINGS_CONFIG.CUSTOM_FIELDS.supportedLists.includes(type) &&
      isPostR2ReleaseTimeExperienceEnabled,
    timeOff:
      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled &&
      isFeatureFlagEnableForTimeOffSettings &&
      !!showAdvancedTimeOffManagement,
    schedules:
      TIME_ENTRY_SETTINGS_CONFIG.SCHEDULES.enabled && isScheduleSettingsEnabled,
    approvals:
      TIME_ENTRY_SETTINGS_CONFIG.APPROVALS.enabled &&
      isPostR2ReleaseTimeExperienceEnabled,
    kiosk:
      TIME_ENTRY_SETTINGS_CONFIG.MANAGE_KIOSK.enabled &&
      TIME_ENTRY_SETTINGS_CONFIG.MANAGE_KIOSK.supportedLists.includes(type),
  };

  // Deep-link navigation hook - handles section navigation via query params
  const {
    isDeepLinkNavigating,
    breaksInitialView,
    overtimeInitialView,
    geoLocationsInitialOpen,
    customFieldsInitialOpen,
    pendingFormType,
    pendingScrollTarget,
    clearPendingNavigation,
    publishNavigationComplete,
  } = useDeepLinkNavigation({
    sectionPath,
    sectionRefs,
    sectionEnabledState,
    featureFlagsLoading,
  });

  const { isEnabled: showUserVoiceFeedbackWidget } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_USERVOICE_FEEDBACK,
    defaultValue: false,
  });

  const timeSheetFields = useMemo(
    () => ({
      [timeSheetFieldSettingSection]:
        TIME_TRACKING_FORM_CONFIG[timeSheetFieldSettingSection],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [TIME_TRACKING_FORM_CONFIG],
  );

  const setFormFieldValue = (
    fieldName: keyof ITimeEntrySettingsFormState,
    fieldValue: string | boolean | number | string[],
  ) =>
    timeEntrySettingsFormMethod.setValue(fieldName, fieldValue, {
      shouldDirty: false,
    });

  const isFormContainingDirtyFields = () =>
    Object.keys(timeEntrySettingsFormMethod.formState.dirtyFields).length > 0;

  const removeTimeEntryDirtyFields = (
    updatedFormValue?: combinedApprovalSettings,
  ) => {
    removeTimeEntryDirtyFieldsUtils(
      timeEntrySettingsFormMethod,
      updatedFormValue,
      isUKLocale,
    );
    onIsDirtyTimeForm && onIsDirtyTimeForm(false);
  };

  // Marks the open "setup-timesheet" ITM task as DoneYes once the timesheet
  // settings have been saved successfully.
  const updateItmTaskForTimesheetSave = useCallback(() => {
    if (!isOverviewModernisationEnabled) {
      return;
    }

    const orchestratorState = storeManager.store.getState();
    const tasks = selectItmTasks(orchestratorState);
    const setupTimesheetTask = tasks.find(
      (task) =>
        task.type === ITEM_TASK_TYPE_SETUP_TIMESHEET &&
        task.status === ITM_TASK_STATUS_OPEN,
    );

    if (!setupTimesheetTask) {
      return;
    }

    logger.info(ITM_LOGGING.ITM_TASK_UPDATE_INITIATED, {
      taskId: setupTimesheetTask.id,
      taskType: ITEM_TASK_TYPE_SETUP_TIMESHEET,
    });

    updateItmTask({
      id: setupTimesheetTask.id,
      status: ITM_TASK_STATUS_DONE_YES,
    })
      .then((result) => {
        if (result.success) {
          logger.info(ITM_LOGGING.ITM_TASK_UPDATE_SUCCESS, {
            taskId: setupTimesheetTask.id,
            taskType: ITEM_TASK_TYPE_SETUP_TIMESHEET,
            newStatus: ITM_TASK_STATUS_DONE_YES,
          });
        } else {
          logger.error(ITM_LOGGING.ITM_TASK_UPDATE_FAILED, {
            taskId: setupTimesheetTask.id,
            error: result.message,
          });
        }
      })
      .catch((error) => {
        logger.error(ITM_LOGGING.ITM_TASK_UPDATE_FAILED, {
          taskId: setupTimesheetTask.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
  }, [updateItmTask, logger, isOverviewModernisationEnabled]);

  const [updateCompanySettings, { loading: setQLSettingsLoading }] =
    useSetQLSettings({
      onSuccess: (result: any) => {
        if (fitAndFinishLogRef.current) {
          sandbox.logger.info(
            'Component=TimeTrackingTimeEntrySettings Event=SaveSuccess',
            fitAndFinishLogRef.current,
          );
          fitAndFinishLogRef.current = null;
        }
        // Notifications → schedule subsection save (distinct from SchedulesTimeEntrySettings prefs).
        if (scheduleNotificationsSaveLogRef.current) {
          sandbox.logger.info(
            'Component=NotificationsTimeEntrySettings Event=SAVE_SUCCESS section=SCHEDULE_NOTIFICATIONS',
          );
          scheduleNotificationsSaveLogRef.current = false;
        }
        if (result) {
          successUpdateCompanySettings({
            result,
            updatedFields,
            updatedTimeEntryFormValue,
            setUpdatedTimeEntryFormValue,
            setUpdatedFields,
            isFormEdit,
            timeTrackingFields,
            setFormFieldValue,
            intl,
            isFieldsVisible,
            setTimeTrackingFields,
            setEditTimeSheetFields,
            setNotificationFields,
            updateVisibleFields,
            notificationFields,
            editTimeSheetFields,
            isTimeSheetEditing,
            updateErrorMessage,
            timeEntryFormOpenToUpdate,
            removeTimeEntryDirtyFields,
            setIsConfirmationModalOpen,
            onFormUpdate,
            setTimeEntryFormOpenToUpdate,
            isUKLocale,
          });
        }
      },
      onError: (error: string | any) => {
        if (fitAndFinishLogRef.current) {
          sandbox.logger.error(
            'Component=TimeTrackingTimeEntrySettings Event=SaveFailed',
            { ...fitAndFinishLogRef.current, error: String(error) },
          );
          fitAndFinishLogRef.current = null;
        }
        // Pair with schedule save success log when notification schedule mutation fails.
        if (scheduleNotificationsSaveLogRef.current) {
          sandbox.logger.error(
            'Component=NotificationsTimeEntrySettings Event=SAVE_ERROR section=SCHEDULE_NOTIFICATIONS',
            { error: String(error) },
          );
          scheduleNotificationsSaveLogRef.current = false;
        }
        // Keep the user in edit mode and preserve unsaved changes — do not call
        // onFormUpdate('') or removeTimeEntryDirtyFields on failure.
        if (timeEntryFormOpenToUpdate) {
          setIsConfirmationModalOpen(false);
          setTimeEntryFormOpenToUpdate('');
        }
        if (error) {
          reRenderTimeEntrySetting(intl.formatMessage({ id: error }));
        }
      },
    });

  const [updateApprovalSettings, { loading: approvalSettingsLoading }] =
    useSetApprovalSettings({
      onSuccess: () => {
        // Refetch approval settings to sync with backend
        refetchApprovalSettings?.();
        // Clear dirty fields
        removeTimeEntryDirtyFields(updatedTimeEntryFormValue);
        // Close form or modal
        if (timeEntryFormOpenToUpdate) {
          setIsConfirmationModalOpen(false);
          onFormUpdate(timeEntryFormOpenToUpdate);
          setTimeEntryFormOpenToUpdate('');
        } else {
          onFormUpdate('');
        }
        updateErrorMessage('');
      },
      onError: (error) => {
        if (timeEntryFormOpenToUpdate) {
          setIsConfirmationModalOpen(false);
          setTimeEntryFormOpenToUpdate('');
        } else {
          onFormUpdate('');
        }
        updateErrorMessage(error as string);
        removeTimeEntryDirtyFields(updatedTimeEntryFormValue);
      },
    });

  const [showCustomFieldDrawer, setShowCustomFieldDrawer] =
    useState<boolean>(false);

  const [customFieldData, setCustomFieldData] =
    useState<CustomFieldData | null>(null);

  const [showCustomFieldsWidget, setShowCustomFieldsWidget] =
    useState<boolean>(false);

  const handleCustomFieldsClick = () => {
    track(TIME_ENTRY_SETTINGS_TRACKING_POINTS.CUSTOM_FIELD_EDIT);
    setShowCustomFieldsWidget(true);
    setRefreshCustomFields((prev) => prev + 1);
  };

  const handleAddDrawerClose = () => {
    setShowCustomFieldDrawer(false);
    setRefreshCustomFields((prev) => prev + 1);
  };

  const onFormUpdate = (formType: string, trackingPoints?: TrackingPoint) => {
    if (trackingPoints) track(trackingPoints);

    if (formType !== '') {
      sandbox.logger.info(
        `Component= Time Entry ${formType} settings : Update`,
      );
    }

    updateTimeEntrySettingsForm({
      formType,
      isFormEdit,
      isFormContainingDirtyFields,
      setTimeEntryFormOpenToUpdate,
      setIsConfirmationModalOpen,
      setIsTimeSheetEditing,
      handleCustomFieldsClick,
      isTimeSheetEditing,
      setIsFormEdit,
      reRenderTimeEntrySetting,
      errorMessage,
    });
  };

  // Handle pending navigation actions from deep-link hook
  useEffect(() => {
    if (pendingFormType) {
      onFormUpdate(pendingFormType);
    }
    if (pendingScrollTarget) {
      setTimeout(() => {
        const targetElement =
          sectionRefs.current[pendingScrollTarget.elementId];
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, pendingScrollTarget.delay);
    }
    if (pendingFormType || pendingScrollTarget) {
      clearPendingNavigation();
    }
  }, [pendingFormType, pendingScrollTarget, clearPendingNavigation]);

  const onFormCancel = (formType: string, trackingPoints: TrackingPoint) => {
    track(trackingPoints);
    timeEntrySettingsFormMethod.clearErrors();
    cancelTimeEntrySettingsForm({
      isFormContainingDirtyFields,
      removeTimeEntryDirtyFields,
      formType,
      updatedTimeEntryFormValue,
      isFormEdit,
      selectedCustomTimeSheetFields,
      setSelectedCustomTimeSheetFields,
      setIsTimeSheetEditing,
      setIsFormEdit,
    });
  };

  const updateVisibleFields = (visibleFields: IIsFieldsVisible) =>
    setIsFieldsVisible(visibleFields);

  const updateSelectedCustomTimeSheetField = (fieldKey: string) => {
    const isCustomTimeSheetFieldSelected =
      selectedCustomTimeSheetFields.indexOf(fieldKey);

    if (isCustomTimeSheetFieldSelected === -1) {
      selectedCustomTimeSheetFields.push(fieldKey);
    } else {
      selectedCustomTimeSheetFields.splice(
        selectedCustomTimeSheetFields.indexOf(fieldKey),
        1,
      );
    }

    setSelectedCustomTimeSheetFields([...selectedCustomTimeSheetFields]);
  };

  const onSubmit: SubmitHandler<ITimeEntrySettingsFormState> = async (
    formState: ITimeEntrySettingsFormState,
  ) => {
    const { dirtyFields } = timeEntrySettingsFormMethod.formState;

    // Check for approval settings changes
    const hasApprovalChanges = hasApprovalSettingsChanges(dirtyFields);

    // Get all updated fields
    const allUpdatedFields =
      comparingTimeEntrySettingsToPreviousTimeEntrySettings(
        dirtyFields as { [key: string]: boolean | boolean[] },
      );

    // Filter out approval fields from employer settings update
    const updatedFields = allUpdatedFields.filter(
      (field) => !APPROVAL_FIELD_NAMES.includes(field),
    );

    const changedFitAndFinishFields = updatedFields.filter((f) =>
      FIT_AND_FINISH_FIELDS.includes(
        f as (typeof FIT_AND_FINISH_FIELDS)[number],
      ),
    );
    if (changedFitAndFinishFields.length > 0) {
      fitAndFinishLogRef.current = {
        old: {
          manageOwnTimeSheets:
            updatedTimeEntryFormValue?.manageOwnTimeSheetsEnabled?.value,
          mobileTimeTracking:
            updatedTimeEntryFormValue?.mobileTimeTrackingEnabled?.value,
          signatureCapture:
            updatedTimeEntryFormValue?.signatureCaptureEnabled?.value,
        },
        new: {
          manageOwnTimeSheets: formState.manageOwnTimeSheetsEnabled,
          mobileTimeTracking: formState.mobileTimeTrackingEnabled,
          signatureCapture: formState.signatureCaptureEnabled,
        },
        changedFields: changedFitAndFinishFields,
      };
      sandbox.logger.info(
        'Component=TimeTrackingTimeEntrySettings Event=SaveInitiated',
        fitAndFinishLogRef.current,
      );
    } else {
      fitAndFinishLogRef.current = null;
    }

    // True when this submit includes schedule notification channel/send-mode changes.
    scheduleNotificationsSaveLogRef.current = updatedTimeEntryFormValue
      ? !!createScheduleNotificationsInput(
          formState,
          updatedTimeEntryFormValue,
          updatedFields,
        )
      : false;

    // Save approval settings if changed
    if (hasApprovalChanges && approvalSettings) {
      const approvalInput = mapApprovalSettingsForMutation(
        formState,
        approvalSettings,
        dirtyFields,
      );
      await updateApprovalSettings(approvalInput);
    }

    const overtimePayload = buildOvertimeNotificationsManageInput(
      employerOvertimeRulesRef.current.saved,
      employerOvertimeRulesRef.current.draft,
    );

    // Overtime-only save: user changed only overtime rules, no standard fields dirty
    if (overtimePayload && !updatedTimeEntryFormValue) {
      updateCompanySettings({
        notificationSettings: { overtimeNotifications: overtimePayload },
      });
    }

    const shouldSaveEmployerSettings =
      updatedTimeEntryFormValue &&
      (updatedFields.length > 0 || overtimePayload);

    if (shouldSaveEmployerSettings && updatedTimeEntryFormValue) {
      setUpdatedFields(updatedFields);

      const baseEmployerMutation = mappedTimeEntrySettingsForMutation(
        formState,
        updatedTimeEntryFormValue,
        updatedFields,
        isUKLocale,
      );

      const employerMutation: SetQLSettingsArgs = overtimePayload
        ? {
            ...baseEmployerMutation,
            notificationSettings: {
              ...baseEmployerMutation.notificationSettings,
              overtimeNotifications: overtimePayload,
            },
          }
        : baseEmployerMutation;

      await updateCompanySettings(employerMutation);
    }

    // If no changes, just close the form
    if (!hasApprovalChanges && updatedFields.length === 0 && !overtimePayload) {
      onFormUpdate('');
    }
  };

  const renderFeedbackTrigger = useCallback(
    (handleAccessPointClick: () => void) => {
      setTriggerFeedback(() => handleAccessPointClick);
      return null;
    },
    [],
  );

  const handleFeedBackIconClick = () => {
    setShowFeedbackPopover((prev) => !prev);
  };

  const handleFeedbackClose = (result: { success: boolean } | null) => {
    setShowFeedbackPopover(false);

    if (result?.success) {
      setShowFeedbackSuccessToast(true);
    }
  };

  const onSaveTimeEntrySettings = (
    trackingPoints?: TrackingPoint,
    formType: string = '',
  ) => {
    if (trackingPoints) {
      track(trackingPoints);
    }
    // Completing the timesheet setup task is tied to the save action itself —
    // it should happen whether or not the settings actually changed.
    if (formType === TimeEntriesFormType.TIMESHEET) {
      updateItmTaskForTimesheetSave();
    }
    timeEntrySettingsFormMethod.handleSubmit(onSubmit)();
  };

  const onConfirmationModalSave = () => {
    const isTimesheetSave =
      isFormEdit.isTimeSheetFieldsEditing || isTimeSheetEditing;
    onSaveTimeEntrySettings(
      TIME_ENTRY_SETTINGS_TRACKING_POINTS.CONFIRMATION_MODAL_SAVE,
      isTimesheetSave ? TimeEntriesFormType.TIMESHEET : '',
    );
  };

  const onNoConfirmationModal = () => {
    removeTimeEntryDirtyFields(updatedTimeEntryFormValue);
    if (timeEntryFormOpenToUpdate !== '') {
      setIsConfirmationModalOpen(false);
      onFormUpdate(timeEntryFormOpenToUpdate);
      setTimeEntryFormOpenToUpdate('');
    }
  };

  const openAndScrollToNotificationsSection = useCallback(() => {
    if (!isFormEdit.isNotificationEditing) {
      onFormUpdate(
        TimeEntriesFormType.NOTIFICATION,
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_SECTION_EDIT,
      );
    }
    setTimeout(() => {
      const notificationsEl = sectionRefs.current['notifications-settings'];
      notificationsEl?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 300);
    // `onFormUpdate` is stable across renders and excluded to avoid re-creating the
    // callback unnecessarily, which would reset scroll-to behaviour for consumers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormEdit.isNotificationEditing]);

  useEffect(() => {
    if (
      onIsDirtyTimeForm &&
      Object.keys(timeEntrySettingsFormMethod.formState.dirtyFields).length > 0
    ) {
      onIsDirtyTimeForm(true);
    }
    formStateRef.current = timeEntrySettingsFormMethod.formState.dirtyFields;
  }, [timeEntrySettingsFormMethod.formState, onIsDirtyTimeForm]);

  useEffect(() => {
    // show only if time tab is selected
    if (urlParams === 'time') {
      sandbox.logger.info(`Component= Time Entry Settings: Viewed`);
      track(TIME_ENTRY_SETTINGS_TRACKING_POINTS.ON_MOUNT);
    }
    onFormUpdate('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParams, sandbox.logger]);

  useEffect(() => {
    if (QLData) {
      setUpdatedTimeEntryFormValue({ ...QLData });
    }

    if (approvalSettings && isPostR2ReleaseTimeExperienceEnabled) {
      setUpdatedTimeEntryFormValue((prev) =>
        prev
          ? ({ ...prev, ...approvalSettings } as combinedApprovalSettings)
          : prev,
      );
    }
  }, [QLData, approvalSettings, isPostR2ReleaseTimeExperienceEnabled]);

  useEffect(() => {
    if (updatedTimeEntryFormValue) {
      updateTimeSheetFieldsSelectedFields(
        updatedTimeEntryFormValue,
        selectedCustomTimeSheetFields,
      );
      setSelectedCustomTimeSheetFields([...selectedCustomTimeSheetFields]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedTimeEntryFormValue]);

  // Handle custom fields deep-link - open the trowser (loader stays visible until widget onReady)
  useEffect(() => {
    if (customFieldsInitialOpen) {
      setShowCustomFieldsWidget(true);
      setRefreshCustomFields((prev) => prev + 1);
    }
  }, [customFieldsInitialOpen]);

  // Standalone timesheet trowser: whether the trowser is currently rendered.
  const isTimesheetTrowserOpen =
    isFormEdit.isTimeSheetFieldsEditing || isTimeSheetEditing;

  // Auto-open the timesheet trowser once when mounted as a standalone entry
  // point. Runs after the mount reset (`onFormUpdate('')`) so it wins.
  const autoOpenedTimesheetRef = useRef(false);
  useEffect(() => {
    if (!isTimesheetTrowserOnly || autoOpenedTimesheetRef.current) {
      return;
    }
    autoOpenedTimesheetRef.current = true;
    onFormUpdate(TimeEntriesFormType.TIMESHEET);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimesheetTrowserOnly]);

  // In standalone mode, hand control back to the caller once the trowser closes
  // (cancel, dismiss, or successful save all clear the editing flags).
  const timesheetTrowserWasOpenedRef = useRef(false);
  useEffect(() => {
    if (!isTimesheetTrowserOnly) {
      return;
    }
    if (isTimesheetTrowserOpen) {
      timesheetTrowserWasOpenedRef.current = true;
    } else if (timesheetTrowserWasOpenedRef.current) {
      timesheetTrowserWasOpenedRef.current = false;
      onClose?.();
    }
  }, [isTimesheetTrowserOnly, isTimesheetTrowserOpen, onClose]);

  const timeSheetFieldsSection = (
    <TimeSheetFields
      timeSheetFields={timeSheetFields}
      isTimeSheetEditing={isTimesheetTrowserOpen}
      timeSheetFieldSettingSection={timeSheetFieldSettingSection}
      id="timeSheet-settings"
      hideViewSection={isTimesheetTrowserOnly}
      onFormUpdate={() =>
        onFormUpdate(
          TimeEntriesFormType.TIMESHEET,
          TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_SECTION_EDIT,
        )
      }
      onFormCancel={() =>
        onFormCancel(
          TimeEntriesFormType.TIMESHEET,
          TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_SECTION_CANCEL,
        )
      }
      editTimeSheetFields={editTimeSheetFields}
      setEditTimeSheetFields={setEditTimeSheetFields}
      selectedCustomTimeSheetFields={selectedCustomTimeSheetFields}
      updateSelectedCustomTimeSheetField={updateSelectedCustomTimeSheetField}
      onSaveTimeEntrySettings={() =>
        onSaveTimeEntrySettings(
          TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_SECTION_SAVE,
          TimeEntriesFormType.TIMESHEET,
        )
      }
      isDataUpdating={setQLSettingsLoading}
      onDimensionsSetDefaults={onDimensionsSetDefaults}
    />
  );

  // Standalone entry point: render only the timesheet trowser, no page chrome.
  if (isTimesheetTrowserOnly) {
    return (
      <FormProvider {...timeEntrySettingsFormMethod}>
        {errorMessage && (
          <ErrorOrWarningMessage
            open
            type="error"
            dismissible={false}
            title={errorMessage}
            automationId="TimeEntrySettingsErrorPageMessage"
          />
        )}
        {timeSheetFieldsSection}
      </FormProvider>
    );
  }

  return (
    <>
      {/* Full-screen overlay loader while navigating to trowser sections via deep-link */}
      {isDeepLinkNavigating && (
        <DeepLinkLoaderOverlay>
          <Activity shape="dots" size="large" />
        </DeepLinkLoaderOverlay>
      )}
      {!canEditPreference(sandbox) && (
        <ErrorOrWarningMessage
          open
          type="info"
          dismissible={false}
          title={intl.formatMessage({
            id: 'do.not.have.access.rights.to.edit.time.settings',
          })}
          automationId="TimeEntrySettingsWarningPageMessage"
        >
          <Typography variant="body-3" as="span">
            {intl.formatMessage({
              id: 'ask.your.quickbooks.admin.for.access',
            })}
          </Typography>
        </ErrorOrWarningMessage>
      )}

      {errorMessage && (
        <ErrorOrWarningMessage
          open
          type="error"
          dismissible={false}
          title={errorMessage}
          automationId="TimeEntrySettingsErrorPageMessage"
        />
      )}

      <FeedBackFormComponent>
        <FeedBackFormButton
          size="small"
          onClick={
            showUserVoiceFeedbackWidget
              ? triggerFeedback
              : handleFeedBackIconClick
          }
          automationId="timeEntry-feedback"
        >
          <CommentPencilButton size="small" />
          <span>
            {intl.formatMessage({ id: 'time-entries.give-feedback' })}
          </span>
        </FeedBackFormButton>
      </FeedBackFormComponent>

      <FormProvider {...timeEntrySettingsFormMethod}>
        {TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.isEnabled(sandbox) &&
          TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.supportedLists.includes(
            type,
          ) && (
            <div
              data-search-section={SEARCH_SECTION_KEYS.TIME_TRACKING}
              ref={setSectionRef('timetracking-settings')}
            >
              <TimeTrackingTimeEntrySettings
                timeTrackingFields={timeTrackingFields}
                setTimeTrackingFields={setTimeTrackingFields}
                isTimeTrackingEditing={isFormEdit.isTimeTrackingEditing}
                onSaveTimeEntrySettings={() =>
                  onSaveTimeEntrySettings(
                    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIME_TRACKING_SECTION_SAVE,
                  )
                }
                timeTrackingFieldSettingSection={
                  timeTrackingFieldSettingSection
                }
                id="timetracking-settings"
                onFormUpdate={() =>
                  onFormUpdate(
                    TimeEntriesFormType.TIMETRACKING,
                    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIME_TRACKING_SECTION_EDIT,
                  )
                }
                onFormCancel={() =>
                  onFormCancel(
                    TimeEntriesFormType.TIMETRACKING,
                    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIME_TRACKING_SECTION_CANCEL,
                  )
                }
                isDataUpdating={setQLSettingsLoading}
              />
            </div>
          )}

        {TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled &&
          isFeatureFlagEnableForTimeOffSettings &&
          showAdvancedTimeOffManagement && (
            <div
              id="timeoff-settings"
              data-search-section={SEARCH_SECTION_KEYS.TIME_OFF}
              ref={setSectionRef('timeoff-settings')}
            >
              <Widget
                widgetId="team-management-ui/time-off-settings"
                onReady={() => {
                  sandbox.logger.info(
                    'Component=TimeEntrySettingsForm Event=SECTION_READY section=TIME_OFF',
                  );
                  sandbox.pubsub.publish(SECTION_READY_EVENT, {
                    section: SECTION_READY_KEYS.TIME_OFF,
                  });
                }}
              />
            </div>
          )}

        {TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.isEnabled(sandbox) &&
          TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.supportedLists.includes(
            type,
          ) && (
            <div
              data-search-section={SEARCH_SECTION_KEYS.TIMESHEET_FIELDS}
              ref={setSectionRef('timeSheet-settings')}
            >
              {timeSheetFieldsSection}
            </div>
          )}

        {TIME_ENTRY_SETTINGS_CONFIG.CUSTOM_FIELDS.isEnabled(sandbox) &&
          TIME_ENTRY_SETTINGS_CONFIG.CUSTOM_FIELDS.supportedLists.includes(
            type,
          ) &&
          isPostR2ReleaseTimeExperienceEnabled && (
            <div data-search-section={SEARCH_SECTION_KEYS.CUSTOM_FIELDS}>
              <GeneralSettingSection
                ViewContent={<ViewContent formFields={customFields} />}
                EditContent={<></>}
                Title={customFieldsSettingSection}
                onFormUpdate={onFormUpdate}
                onFormCancel={() => {}}
                isFormEdit={false}
                onSaveTimeTrackingSettings={() => {}}
                id="custom-fields-settings"
                isFormEditable={isFormEditable}
                isDataUpdating={false}
                formEditType={TimeEntriesFormType.CUSTOM_FIELDS}
              />
            </div>
          )}

        {TIME_ENTRY_SETTINGS_CONFIG.BREAKS.enabled &&
          isPostR2ReleaseTimeExperienceEnabled && (
            <WidgetSectionWrapper
              data-search-section={SEARCH_SECTION_KEYS.BREAKS}
            >
              <Widget
                key="breaks-settings-handle-1"
                widgetId="time-tracking-ui/breaks"
                options={{
                  isEditable: isFormEditable,
                  feature: 'breaks-settings',
                  functionality: 'settings-handle',
                  initialView: breaksInitialView,
                }}
              />
            </WidgetSectionWrapper>
          )}

        {TIME_ENTRY_SETTINGS_CONFIG.OVERTIME.enabled &&
          isFeatureFlagEnableForOvertimeSettings && (
            <WidgetSectionWrapper
              data-search-section={SEARCH_SECTION_KEYS.OVERTIME}
            >
              <Widget
                key="overtime-settings-handle"
                widgetId="time-tracking-ui/orchestrator"
                options={{
                  feature: FEATURE_NAMES.OVERTIME,
                  functionality: FUNCTIONALITY_NAMES.SETTINGS_HANDLE,
                  isEditable: isFormEditable,
                  initialView: overtimeInitialView,
                }}
              />
            </WidgetSectionWrapper>
          )}

        {/* Schedules settings */}
        {TIME_ENTRY_SETTINGS_CONFIG.SCHEDULES.enabled &&
          isScheduleSettingsEnabled && (
            <div
              data-search-section={SEARCH_SECTION_KEYS.SCHEDULES}
              ref={setSectionRef('schedules-settings')}
            >
              <SchedulesTimeEntrySettings />
            </div>
          )}

        {TIME_ENTRY_SETTINGS_CONFIG.GEO_LOCATIONS.enabled &&
          isFeatureFlagEnableForGeoLocationSettings && (
            <div data-search-section={SEARCH_SECTION_KEYS.GEO_LOCATIONS}>
              <GeoLocationsTimeEntrySettings
                onScrollToNotificationsSection={
                  openAndScrollToNotificationsSection
                }
                initialOpen={geoLocationsInitialOpen}
              />
            </div>
          )}

        {TIME_ENTRY_SETTINGS_CONFIG.MANAGE_KIOSK.enabled &&
          isTimeKioskSettingsFlagSettled &&
          TIME_ENTRY_SETTINGS_CONFIG.MANAGE_KIOSK.supportedLists.includes(
            type,
          ) && (
            <WidgetSectionWrapper>
              <div
                data-search-section={SEARCH_SECTION_KEYS.KIOSK}
                ref={setSectionRef('kiosk-settings')}
              >
                <Widget
                  widgetId={manageKioskWidgetId}
                  options={manageKioskWidgetOptions}
                  onReady={() => {
                    // Orchestrator widget publishes SECTION_READY itself
                    // (TimeKioskSettingsHandle) — skip here to avoid double-publish.
                    if (
                      manageKioskWidgetId ===
                      MANAGE_KIOSK_ORCHESTRATOR_WIDGET_ID
                    ) {
                      return;
                    }
                    sandbox.logger.info(
                      'Component=TimeEntrySettingsForm Event=SECTION_READY section=KIOSK',
                    );
                    sandbox.pubsub.publish(SECTION_READY_EVENT, {
                      section: SECTION_READY_KEYS.KIOSK,
                    });
                  }}
                />
              </div>
            </WidgetSectionWrapper>
          )}

        {((TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.isEnabled(sandbox) &&
          TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.supportedLists.includes(
            type,
          )) ||
          (TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.isEnabled(sandbox) &&
            TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.supportedLists.includes(
              type,
            ))) && (
          <div
            data-search-section={SEARCH_SECTION_KEYS.NOTIFICATIONS}
            ref={setSectionRef('notifications-settings')}
          >
            <NotificationsTimeEntrySettings
              notificationFields={notificationFields}
              setNotificationFields={setNotificationFields}
              isNotificationFieldEditing={isFormEdit.isNotificationEditing}
              employerOvertimeRulesRef={employerOvertimeRulesRef}
              overtimeNotificationRulesFromParent={
                updatedTimeEntryFormValue?.overtimeNotificationRules
              }
              onSaveTimeEntrySettings={() =>
                onSaveTimeEntrySettings(
                  TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_SECTION_SAVE,
                )
              }
              notificationFieldSettingSection={notificationFieldSettingSection}
              id="notifications-settings"
              onFormUpdate={() =>
                onFormUpdate(
                  TimeEntriesFormType.NOTIFICATION,
                  TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_SECTION_EDIT,
                )
              }
              onFormCancel={() =>
                onFormCancel(
                  TimeEntriesFormType.NOTIFICATION,
                  TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_SECTION_CANCEL,
                )
              }
              isDataUpdating={setQLSettingsLoading || approvalSettingsLoading}
              isFieldsVisible={isFieldsVisible}
              updateVisibleFields={updateVisibleFields}
              registerSectionRef={setSectionRef}
            />
          </div>
        )}

        {TIME_ENTRY_SETTINGS_CONFIG.APPROVALS.enabled &&
          isPostR2ReleaseTimeExperienceEnabled && (
            <div
              data-search-section={SEARCH_SECTION_KEYS.APPROVALS}
              ref={setSectionRef('approvals-settings')}
            >
              {isApprovalVisibilityResolved && (
                <ApprovalsTimeEntrySettings
                  approvalFields={approvalFields}
                  setApprovalFields={setApprovalFields}
                  isApprovalEditing={isFormEdit.isApprovalEditing}
                  onSaveTimeEntrySettings={() =>
                    onSaveTimeEntrySettings(
                      APPROVAL_SETTINGS_TRACKING_FIELDS.APPROVAL_SETTINGS_SECTION_SAVE,
                    )
                  }
                  approvalFieldSettingSection={approvalFieldSettingSection}
                  id="approvals-settings"
                  onFormUpdate={() =>
                    onFormUpdate(
                      TimeEntriesFormType.APPROVALS,
                      APPROVAL_SETTINGS_TRACKING_FIELDS.APPROVAL_SETTINGS_SECTION_EDIT,
                    )
                  }
                  onFormCancel={() =>
                    onFormCancel(
                      TimeEntriesFormType.APPROVALS,
                      APPROVAL_SETTINGS_TRACKING_FIELDS.APPROVAL_SETTINGS_SECTION_CANCEL,
                    )
                  }
                  shouldShowApprovalControls={shouldShowApprovalControls}
                  isApprovalVisibilityResolved={isApprovalVisibilityResolved}
                  isDataUpdating={approvalSettingsLoading}
                />
              )}
            </div>
          )}

        <ConfirmationModal
          open={isConfirmationModalOpen}
          setOpen={setIsConfirmationModalOpen}
          onYesClick={onConfirmationModalSave}
          onNoClick={onNoConfirmationModal}
          data-testid="confirmation-modal"
          size="small"
          actionAlignment="center"
          contentAlignment="center"
          headerAlignment="center"
          title={intl.formatMessage({
            id: 'unsaved.changes.confirmation.modal.header',
          })}
        >
          <ConfirmationModalContent variant="body-3">
            {intl.formatMessage({
              id: 'unsaved.changes.confirmation.modal.content',
            })}
          </ConfirmationModalContent>
        </ConfirmationModal>
      </FormProvider>

      {showFeedbackPopover && (
        <FeedbackPopover
          open={showFeedbackPopover}
          onClose={handleFeedbackClose}
          targetElement={feedbackButton}
          isOvertimeEnabled={isFeatureFlagEnableForOvertimeSettings}
          isGeofenceEnabled={isFeatureFlagEnableForGeofenceSettings}
        />
      )}

      {showUserVoiceFeedbackWidget && (
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={renderFeedbackTrigger}
          isOvertimeEnabled={isFeatureFlagEnableForOvertimeSettings}
        />
      )}

      {showFeedbackSuccessToast && (
        <SuccessToast
          message={intl.formatMessage({
            id: 'time-entries.toast.feedback.success',
          })}
          open={showFeedbackSuccessToast}
          onClose={() => setShowFeedbackSuccessToast(false)}
        />
      )}

      {showCustomFieldDrawer && (
        <Widget
          key="qbo-custom-fields-plugin/custom-fields-drawer"
          widgetId="qbo-custom-fields-plugin/custom-fields-drawer"
          data-testid="custom-fields-drawer"
          displayDrawer={showCustomFieldDrawer}
          onClose={handleAddDrawerClose}
          onDrawerWidgetClose={handleAddDrawerClose}
          workflow={WORKFLOWS.TIME}
          customFieldData={customFieldData}
        />
      )}

      {showCustomFieldsWidget && (
        <Widget
          key="custom-fields-widget"
          widgetId="time-tracking-ui/customField"
          data-testid="custom-fields-widget"
          onClose={() => setShowCustomFieldsWidget(false)}
          setShowCustomFieldDrawer={setShowCustomFieldDrawer}
          setCustomFieldData={setCustomFieldData}
          onAddDrawerClose={handleAddDrawerClose}
          refreshTrigger={refreshCustomFields}
          onReady={() => {
            sandbox.logger.info(
              'Component=TimeEntrySettingsForm Event=SECTION_READY section=CUSTOM_FIELDS',
            );
            sandbox.pubsub.publish(SECTION_READY_EVENT, {
              section: SECTION_READY_KEYS.CUSTOM_FIELDS,
            });
            publishNavigationComplete();
          }}
        />
      )}
    </>
  );
};
