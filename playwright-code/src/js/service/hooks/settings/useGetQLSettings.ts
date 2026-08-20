import { useState, useEffect, useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  Common_DayOfWeek,
  TimeTracking_EmployerSettings,
  TimeTracking_LocationTrackingType,
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationSubscription,
  TimeTracking_OvertimeNotificationRule,
  useEmployerSettingLazyQuery,
} from 'src/__generated__/timeTracking/graphql';
import { WEEK_DAYS } from 'src/js/common/constants';
import {
  SCHEDULE_MANAGE_VALUE,
  SCHEDULE_VIEW_VALUE,
} from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/schedules/constants';
import {
  mapCustomDimensionsWireToSettings,
  mapScheduleManagePreferenceFromApi,
  mapScheduleViewPreferenceFromApi,
} from 'src/js/widgets/timeTrackingSettings/utils';

export type TimeEntryStringField = {
  version: string;
  value: string;
};

export type TimeEntryBooleanField = {
  version: string;
  value: boolean;
};

export type TimeEntryNumberField = {
  version: string;
  value: number;
};

export type TimeEntryArrayField = {
  version: string;
  value: string[];
};

export type CustomDimensionSetting = {
  dimensionDefinitionId: string;
  enabledForTimeTracking: TimeEntryBooleanField;
  required: TimeEntryBooleanField;
};

export interface MappedQLSettings {
  timeTrackingSupported: TimeEntryBooleanField;
  transactionBillingForTimeEnabled: TimeEntryBooleanField;
  transactionTimeTrackingEnabled: TimeEntryBooleanField;

  clockInNotificationReminderTime?: TimeEntryStringField;
  clockInNotificationReminderEmail?: TimeEntryBooleanField;
  clockInNotificationReminderMobile?: TimeEntryBooleanField;
  clockOutNotificationReminderTime?: TimeEntryStringField;
  clockOutNotificationReminderEmail?: TimeEntryBooleanField;
  clockOutNotificationReminderMobile?: TimeEntryBooleanField;
  notificationEnabledForDays?: TimeEntryArrayField;
  notifyAdminOnClockOutOverrideEnabled?: TimeEntryBooleanField;
  notifyManagerOnClockOutOverrideEnabled?: TimeEntryBooleanField;
  notifyAdminOnTimeSheetNotesEditEnabled?: TimeEntryBooleanField;
  notifyGroupManagerOnTimeSheetNotesEditEnabled?: TimeEntryBooleanField;

  firstDayOfWeek: TimeEntryNumberField;
  timeZone?: TimeEntryStringField;
  timeFormat?: TimeEntryNumberField;
  splitTimeSheetAtMidnightEnabled?: TimeEntryBooleanField;
  manageOwnTimeSheetsEnabled?: TimeEntryBooleanField;
  editClockOutTimeEnabled?: TimeEntryBooleanField;
  clockOutOverrideHours?: TimeEntryNumberField;
  clockInRoundDirection?: TimeEntryStringField;
  clockInRoundInMin?: TimeEntryNumberField;
  clockOutRoundDirection?: TimeEntryStringField;
  clockOutRoundInMin?: TimeEntryNumberField;

  customersForTimeSheetEnabled?: TimeEntryBooleanField;
  isBillingFieldEnabled: TimeEntryBooleanField;
  billingRateForTimeEnabled: TimeEntryBooleanField;
  requireBillable?: TimeEntryBooleanField;
  isServiceFieldEnabled: TimeEntryBooleanField;
  useItemForTime: TimeEntryBooleanField;
  classForTimeSheetEnabled?: TimeEntryBooleanField;
  locationForTimeSheetEnabled?: TimeEntryBooleanField;
  customDimensions?: CustomDimensionSetting[];
  timeSheetEntryNotesEnabled?: TimeEntryBooleanField;
  timeSheetEntryEditNotesEnabled?: TimeEntryBooleanField;
  timeSheetEntryMakesNotesRequiredEnabled?: TimeEntryBooleanField;

  serviceItemRequired?: TimeEntryBooleanField;
  classRequired?: TimeEntryBooleanField;
  locationRequired?: TimeEntryBooleanField;
  locationTracking?: TimeEntryStringField;
  mileageTrackingEnabled?: TimeEntryBooleanField;
  mobileTimeTrackingEnabled?: TimeEntryBooleanField;
  signatureCaptureEnabled?: TimeEntryBooleanField;

  // Geofencing Settings
  geofenceEnabled?: TimeEntryBooleanField;
  geofenceReminderStartTime?: TimeEntryStringField;
  geofenceReminderEndTime?: TimeEntryStringField;
  geofenceReminderDaysOfWeek?: TimeEntryArrayField;

  // Overtime Notification Settings
  overtimeNotificationRules?: TimeTracking_OvertimeNotificationRule[];

  // Schedule preferences
  scheduleManagePreference?: TimeEntryStringField;
  scheduleViewPreference?: TimeEntryStringField;

  // Schedule notification preferences
  publishShiftChangePreference?: TimeEntryStringField;
  scheduleNotificationSubscriptions?: TimeTracking_NotificationSubscription[];

  // Kiosk employer settings
  inactivityTimeout?: TimeEntryNumberField;
}

interface UseQLSettingsResult {
  loading: boolean;
  error?: string;
  qlSettings: MappedQLSettings;
  refetch: () => void;
}

interface UseGetQLSettingsOptions {
  isExported?: boolean;
}

export const mapDaysOfWeekValueToNumber = (day: Common_DayOfWeek): number => {
  const daysOfWeekMap: { [key: string]: number } = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };
  return daysOfWeekMap[day.valueOf()] ?? 0;
};

export const mapQlCompanySettings = (
  data: TimeTracking_EmployerSettings,
): MappedQLSettings => ({
  // Time Activity Settings
  isServiceFieldEnabled: {
    version: data.timeTrackingEnabled?.meta?.version ?? '0',
    value: data.timeTrackingEnabled?.value ?? false,
  },
  isBillingFieldEnabled: {
    version: data.billingForTimeEnabled?.meta?.version ?? '0',
    value: data.billingForTimeEnabled?.value ?? false,
  },
  firstDayOfWeek: {
    version: data.startWorkWeek?.meta?.version ?? '0',
    value: mapDaysOfWeekValueToNumber(
      data.startWorkWeek?.value ?? Common_DayOfWeek.Sunday,
    ),
  },
  billingRateForTimeEnabled: {
    version: data.billingRateForTimeEnabled?.meta?.version ?? '0',
    value: data.billingRateForTimeEnabled?.value ?? false,
  },
  timeTrackingSupported: {
    version: data.timeTrackingSupported?.meta?.version ?? '0',
    value: data.timeTrackingSupported?.value ?? false,
  },
  transactionBillingForTimeEnabled: {
    version: data.transactionBillingForTimeEnabled?.meta?.version ?? '0',
    value: data.transactionBillingForTimeEnabled?.value ?? false,
  },
  transactionTimeTrackingEnabled: {
    version: data.transactionTimeTrackingEnabled?.meta?.version ?? '0',
    value: data.transactionTimeTrackingEnabled?.value ?? false,
  },
  useItemForTime: {
    version: data.useItemForTime?.meta?.version ?? '0',
    value: data.useItemForTime?.value ?? false,
  },

  // Time Entry Settings
  clockInNotificationReminderTime: {
    version:
      data?.notificationSettings?.startShiftNotifications?.reminderTime?.meta
        ?.version ?? '0',
    value:
      data?.notificationSettings?.startShiftNotifications?.reminderTime
        ?.value ?? '8:00',
  },
  clockInNotificationReminderEmail: {
    version:
      data?.notificationSettings?.startShiftNotifications?.notificationMedium
        ?.meta?.version ?? '0',
    value:
      data &&
      data.notificationSettings &&
      data.notificationSettings.startShiftNotifications &&
      data.notificationSettings.startShiftNotifications.notificationMedium &&
      data.notificationSettings.startShiftNotifications.notificationMedium
        .value &&
      data.notificationSettings.startShiftNotifications.notificationMedium.value
        .length > 0
        ? data.notificationSettings.startShiftNotifications.notificationMedium.value.indexOf(
            TimeTracking_NotificationReminderMedium.Email,
          ) !== -1
        : false,
  },
  clockInNotificationReminderMobile: {
    version:
      data?.notificationSettings?.startShiftNotifications?.notificationMedium
        ?.meta?.version ?? '0',
    value:
      data &&
      data.notificationSettings &&
      data.notificationSettings.startShiftNotifications &&
      data.notificationSettings.startShiftNotifications.notificationMedium &&
      data.notificationSettings.startShiftNotifications.notificationMedium
        .value &&
      data.notificationSettings.startShiftNotifications.notificationMedium.value
        .length > 0
        ? data.notificationSettings.startShiftNotifications.notificationMedium.value.indexOf(
            TimeTracking_NotificationReminderMedium.PushNotification,
          ) !== -1
        : false,
  },
  clockOutNotificationReminderTime: {
    version:
      data?.notificationSettings?.endShiftNotifications?.reminderTime?.meta
        ?.version ?? '0',
    value:
      data?.notificationSettings?.endShiftNotifications?.reminderTime?.value ??
      '17:00',
  },
  clockOutNotificationReminderEmail: {
    version:
      data?.notificationSettings?.endShiftNotifications?.notificationMedium
        ?.meta?.version ?? '0',
    value:
      data &&
      data.notificationSettings &&
      data.notificationSettings.endShiftNotifications &&
      data.notificationSettings.endShiftNotifications.notificationMedium &&
      data.notificationSettings.endShiftNotifications.notificationMedium
        .value &&
      data.notificationSettings.endShiftNotifications.notificationMedium.value
        .length > 0
        ? data.notificationSettings.endShiftNotifications.notificationMedium.value.indexOf(
            TimeTracking_NotificationReminderMedium.Email,
          ) !== -1
        : false,
  },
  clockOutNotificationReminderMobile: {
    version:
      data?.notificationSettings?.endShiftNotifications?.notificationMedium
        ?.meta?.version ?? '0',
    value:
      data &&
      data.notificationSettings &&
      data.notificationSettings.endShiftNotifications &&
      data.notificationSettings.endShiftNotifications.notificationMedium &&
      data.notificationSettings.endShiftNotifications.notificationMedium
        .value &&
      data.notificationSettings.endShiftNotifications.notificationMedium.value
        .length > 0
        ? data.notificationSettings.endShiftNotifications.notificationMedium.value.indexOf(
            TimeTracking_NotificationReminderMedium.PushNotification,
          ) !== -1
        : false,
  },
  notificationEnabledForDays: {
    version:
      data?.notificationSettings?.notificationEnabledForDays?.meta?.version ??
      '0',
    value:
      data?.notificationSettings?.notificationEnabledForDays?.value ??
      WEEK_DAYS,
  },
  notifyAdminOnClockOutOverrideEnabled: {
    version:
      data?.notificationSettings?.clockOutOverrideNotifications?.adminEnabled
        ?.meta?.version ?? '0',
    value:
      data?.notificationSettings?.clockOutOverrideNotifications?.adminEnabled
        ?.value ?? true,
  },
  notifyManagerOnClockOutOverrideEnabled: {
    version:
      data?.notificationSettings?.clockOutOverrideNotifications
        ?.groupManagerEnabled?.meta?.version ?? '0',
    value:
      data?.notificationSettings?.clockOutOverrideNotifications
        ?.groupManagerEnabled?.value ?? false,
  },
  notifyAdminOnTimeSheetNotesEditEnabled: {
    version:
      data?.notificationSettings?.timesheetEditNotifications?.adminEnabled?.meta
        ?.version ?? '0',
    value:
      data?.notificationSettings?.timesheetEditNotifications?.adminEnabled
        ?.value ?? false,
  },
  notifyGroupManagerOnTimeSheetNotesEditEnabled: {
    version:
      data?.notificationSettings?.timesheetEditNotifications
        ?.groupManagerEnabled?.meta?.version ?? '0',

    value:
      data?.notificationSettings?.timesheetEditNotifications
        ?.groupManagerEnabled?.value ?? false,
  },
  timeZone: {
    version: data?.dateTimeSettings?.timeZone?.meta?.version ?? '0',
    value: data?.dateTimeSettings?.timeZone?.value ?? '',
  },
  timeFormat: {
    version: data?.dateTimeSettings?.clockFormat?.meta?.version ?? '0',
    value: data?.dateTimeSettings?.clockFormat?.value ?? 24,
  },
  splitTimeSheetAtMidnightEnabled: {
    version:
      data?.timesheetManagementSettings?.timesheet?.splitAtMidnightEnabled?.meta
        ?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.timesheet?.splitAtMidnightEnabled
        ?.value ?? true,
  },
  manageOwnTimeSheetsEnabled: {
    version:
      data?.timesheetManagementSettings?.timesheet?.manageOwnTimesheetEnabled
        ?.meta?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.timesheet?.manageOwnTimesheetEnabled
        ?.value ?? true,
  },
  editClockOutTimeEnabled: {
    version:
      data?.timesheetManagementSettings?.timesheet?.editClockOutTimeEnabled
        ?.meta?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.timesheet?.editClockOutTimeEnabled
        ?.value ?? true,
  },
  clockOutOverrideHours: {
    version:
      data?.timesheetManagementSettings?.timesheet?.clockOutOverrideHours?.meta
        ?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.timesheet?.clockOutOverrideHours
        ?.value ?? 8,
  },
  clockInRoundDirection: {
    version:
      data?.clockRoundingSettings?.startTimeRounding?.direction?.meta
        ?.version ?? '0',
    value:
      data?.clockRoundingSettings?.startTimeRounding?.direction?.value ??
      'NEAREST',
  },
  clockInRoundInMin: {
    version:
      data?.clockRoundingSettings?.startTimeRounding?.roundInMin?.meta
        ?.version ?? '0',
    value:
      data?.clockRoundingSettings?.startTimeRounding?.roundInMin?.value ?? 1,
  },
  clockOutRoundDirection: {
    version:
      data?.clockRoundingSettings?.endTimeRounding?.direction?.meta?.version ??
      '0',
    value:
      data?.clockRoundingSettings?.endTimeRounding?.direction?.value ??
      'NEAREST',
  },
  clockOutRoundInMin: {
    version:
      data?.clockRoundingSettings?.endTimeRounding?.roundInMin?.meta?.version ??
      '0',
    value: data?.clockRoundingSettings?.endTimeRounding?.roundInMin?.value ?? 1,
  },

  customersForTimeSheetEnabled: {
    version:
      data?.timesheetManagementSettings?.customFields?.customersEnabled?.meta
        ?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.customFields?.customersEnabled
        ?.value ?? true,
  },
  requireBillable: {
    version: data?.coreSettings?.requireBillable?.meta?.version ?? '0',
    value: data?.coreSettings?.requireBillable?.value ?? false,
  },
  classForTimeSheetEnabled: {
    version:
      data?.timesheetManagementSettings?.customFields?.classEnabled?.meta
        ?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.customFields?.classEnabled?.value ??
      false,
  },
  locationForTimeSheetEnabled: {
    version:
      data?.timesheetManagementSettings?.customFields?.locationEnabled?.meta
        ?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.customFields?.locationEnabled?.value ??
      false,
  },
  customDimensions: mapCustomDimensionsWireToSettings(
    data?.timesheetManagementSettings?.customFields?.customDimensions,
  ),
  timeSheetEntryNotesEnabled: {
    version:
      data?.timesheetManagementSettings?.notes?.enabled?.meta?.version ?? '0',
    value: data?.timesheetManagementSettings?.notes?.enabled?.value ?? false,
  },
  timeSheetEntryEditNotesEnabled: {
    version:
      data?.timesheetManagementSettings?.notes?.editEnabled?.meta?.version ??
      '0',
    value:
      data?.timesheetManagementSettings?.notes?.editEnabled?.value ?? false,
  },
  timeSheetEntryMakesNotesRequiredEnabled: {
    version:
      data?.timesheetManagementSettings?.notes?.requiredEnabled?.meta
        ?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.notes?.requiredEnabled?.value ?? false,
  },

  serviceItemRequired: {
    version: data?.coreSettings?.serviceItemRequired?.meta?.version ?? '0',
    value: data?.coreSettings?.serviceItemRequired?.value ?? false,
  },
  classRequired: {
    version: data?.coreSettings?.classRequired?.meta?.version ?? '0',
    value: data?.coreSettings?.classRequired?.value ?? false,
  },
  locationRequired: {
    version: data?.coreSettings?.locationRequired?.meta?.version ?? '0',
    value: data?.coreSettings?.locationRequired?.value ?? false,
  },
  locationTracking: {
    version:
      data?.timesheetManagementSettings?.timesheet?.locationTracking?.meta
        ?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.timesheet?.locationTracking?.value ??
      TimeTracking_LocationTrackingType.Optional,
  },
  mileageTrackingEnabled: {
    version:
      data?.timesheetManagementSettings?.timesheet?.mileageTrackingEnabled?.meta
        ?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.timesheet?.mileageTrackingEnabled
        ?.value ?? false,
  },
  mobileTimeTrackingEnabled: {
    version:
      data?.timesheetManagementSettings?.timesheet?.mobileTimeTrackingEnabled
        ?.meta?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.timesheet?.mobileTimeTrackingEnabled
        ?.value ?? false,
  },
  signatureCaptureEnabled: {
    version:
      data?.timesheetManagementSettings?.timesheet?.signatureCaptureEnabled
        ?.meta?.version ?? '0',
    value:
      data?.timesheetManagementSettings?.timesheet?.signatureCaptureEnabled
        ?.value ?? false,
  },

  // Geofencing Settings
  geofenceEnabled: {
    version: data?.geofenceSettings?.geofenceEnabled?.meta?.version ?? '0',
    value: data?.geofenceSettings?.geofenceEnabled?.value ?? false,
  },
  geofenceReminderStartTime: {
    version:
      data?.geofenceSettings?.geofenceReminderSettings?.startTime?.meta
        ?.version ?? '0',
    value:
      data?.geofenceSettings?.geofenceReminderSettings?.startTime?.value ??
      '08:00',
  },
  geofenceReminderEndTime: {
    version:
      data?.geofenceSettings?.geofenceReminderSettings?.endTime?.meta
        ?.version ?? '0',
    value:
      data?.geofenceSettings?.geofenceReminderSettings?.endTime?.value ??
      '17:00',
  },
  geofenceReminderDaysOfWeek: {
    version:
      data?.geofenceSettings?.geofenceReminderSettings?.daysOfWeek?.meta
        ?.version ?? '0',
    value:
      data?.geofenceSettings?.geofenceReminderSettings?.daysOfWeek?.value?.map(
        (day) => day.toString(),
      ) ?? WEEK_DAYS,
  },

  scheduleManagePreference: {
    version: data?.scheduleSettings?.manage?.meta?.version ?? '0',
    value: mapScheduleManagePreferenceFromApi(
      data?.scheduleSettings?.manage?.value,
    ),
  },
  scheduleViewPreference: {
    version: data?.scheduleSettings?.view?.meta?.version ?? '0',
    value: mapScheduleViewPreferenceFromApi(
      data?.scheduleSettings?.view?.value,
    ),
  },

  publishShiftChangePreference: {
    version:
      data?.notificationSettings?.scheduleNotifications
        ?.publishShiftChangePreference?.meta?.version ?? '0',
    value:
      data?.notificationSettings?.scheduleNotifications
        ?.publishShiftChangePreference?.value ?? '',
  },

  overtimeNotificationRules: (
    data?.notificationSettings?.overtimeNotifications?.rules ?? []
  ).filter((r): r is TimeTracking_OvertimeNotificationRule => r != null),

  scheduleNotificationSubscriptions: (
    data?.notificationSettings?.scheduleNotifications?.subscriptions ?? []
  ).filter((s): s is TimeTracking_NotificationSubscription => s != null),

  inactivityTimeout: {
    version: data?.kioskSettings?.inactivityTimeout?.meta?.version ?? '0',
    value: data?.kioskSettings?.inactivityTimeout?.value ?? 20,
  },
});

export const timeEntrySettingsDefaultState = {
  // Time Activity Settings
  isServiceFieldEnabled: {
    version: '0',
    value: false,
  },
  isBillingFieldEnabled: {
    version: '0',
    value: false,
  },
  firstDayOfWeek: {
    version: '0',
    value: 0,
  },
  billingRateForTimeEnabled: {
    version: '0',
    value: false,
  },
  timeTrackingSupported: {
    version: '0',
    value: false,
  },
  transactionBillingForTimeEnabled: {
    version: '0',
    value: false,
  },
  transactionTimeTrackingEnabled: {
    version: '0',
    value: false,
  },
  useItemForTime: {
    version: '0',
    value: false,
  },
  // Time Entry Settings
  clockInNotificationReminderTime: {
    version: '0',
    value: '8:00',
  },
  clockInNotificationReminderEmail: {
    version: '0',
    value: false,
  },
  clockInNotificationReminderMobile: {
    version: '0',
    value: false,
  },
  clockOutNotificationReminderTime: {
    version: '0',
    value: '17:00',
  },
  clockOutNotificationReminderEmail: {
    version: '0',
    value: false,
  },
  clockOutNotificationReminderMobile: {
    version: '0',
    value: false,
  },
  notificationEnabledForDays: {
    version: '0',
    value: WEEK_DAYS,
  },
  notifyAdminOnClockOutOverrideEnabled: {
    version: '0',
    value: false,
  },
  notifyManagerOnClockOutOverrideEnabled: {
    version: '0',
    value: false,
  },
  notifyAdminOnTimeSheetNotesEditEnabled: {
    version: '0',
    value: false,
  },
  notifyGroupManagerOnTimeSheetNotesEditEnabled: {
    version: '0',
    value: false,
  },
  timeZone: {
    version: '0',
    value: 'America/New_York',
  },
  timeFormat: {
    version: '0',
    value: 24,
  },
  splitTimeSheetAtMidnightEnabled: {
    version: '0',
    value: false,
  },
  manageOwnTimeSheetsEnabled: {
    version: '0',
    value: false,
  },
  editClockOutTimeEnabled: {
    version: '0',
    value: false,
  },
  clockOutOverrideHours: {
    version: '0',
    value: 8,
  },
  clockInRoundDirection: {
    version: '0',
    value: 'NEAREST',
  },
  clockInRoundInMin: {
    version: '0',
    value: 1,
  },
  clockOutRoundDirection: {
    version: '0',
    value: 'NEAREST',
  },
  clockOutRoundInMin: {
    version: '0',
    value: 1,
  },
  customersForTimeSheetEnabled: {
    version: '0',
    value: true,
  },
  requireBillable: {
    version: '0',
    value: false,
  },
  classForTimeSheetEnabled: {
    version: '0',
    value: false,
  },
  locationForTimeSheetEnabled: {
    version: '0',
    value: false,
  },
  customDimensions: [],
  timeSheetEntryNotesEnabled: {
    version: '0',
    value: false,
  },
  timeSheetEntryEditNotesEnabled: {
    version: '0',
    value: false,
  },
  timeSheetEntryMakesNotesRequiredEnabled: {
    version: '0',
    value: false,
  },
  serviceItemRequired: {
    version: '0',
    value: false,
  },
  classRequired: {
    version: '0',
    value: false,
  },
  locationRequired: {
    version: '0',
    value: false,
  },
  locationTracking: {
    version: '0',
    value: TimeTracking_LocationTrackingType.Optional,
  },
  mileageTrackingEnabled: {
    version: '0',
    value: false,
  },
  mobileTimeTrackingEnabled: {
    version: '0',
    value: false,
  },
  signatureCaptureEnabled: {
    version: '0',
    value: false,
  },

  // Geofencing Settings
  geofenceEnabled: {
    version: '0',
    value: false,
  },
  geofenceReminderStartTime: {
    version: '0',
    value: '08:00',
  },
  geofenceReminderEndTime: {
    version: '0',
    value: '17:00',
  },
  geofenceReminderDaysOfWeek: {
    version: '0',
    value: WEEK_DAYS,
  },

  scheduleManagePreference: {
    version: '0',
    value: SCHEDULE_MANAGE_VALUE.THEIR_OWN,
  },
  scheduleViewPreference: {
    version: '0',
    value: SCHEDULE_VIEW_VALUE.THEIR_OWN,
  },
  publishShiftChangePreference: {
    version: '0',
    value: '',
  },
  scheduleNotificationSubscriptions: [],
  inactivityTimeout: {
    version: '0',
    value: 20,
  },
};

export const useGetQLSettings = (
  options: UseGetQLSettingsOptions = { isExported: false },
): UseQLSettingsResult => {
  const { isExported } = options;
  const sandbox = useSandbox();
  const [localData, setLocalData] = useState<MappedQLSettings>(
    timeEntrySettingsDefaultState,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [EmployerSetting] = useEmployerSettingLazyQuery({
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
  });

  const handleSuccess = useCallback(
    (settings: TimeTracking_EmployerSettings) => {
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.EMPLOYER_SETTINGS_GET,
      );
      if (settings) {
        setLocalData(mapQlCompanySettings(settings));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sandbox],
  );

  const handleFailure = useCallback(
    (error) => {
      if (error) {
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.EMPLOYER_SETTINGS_GET,
          error.message,
          error,
        );
      }
    },
    [sandbox],
  );

  const fetchQLSettings = useCallback(async () => {
    setLoading(true);
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.EMPLOYER_SETTINGS_GET,
    );
    EmployerSetting({
      variables: {
        input: {
          isExported,
        },
      },
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: getCustomerInteractionPropagationHeaders(
          sandbox,
          TimeCustomerInteraction.EMPLOYER_SETTINGS_GET,
        ),
      },
    })
      .then((response) => {
        if (response.error) {
          setError(response.error.message);
          handleFailure(response.error);
        } else if (response.data?.timeTrackingEmployerSettings) {
          handleSuccess(response.data?.timeTrackingEmployerSettings);
        }
      })
      .catch(handleFailure)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [EmployerSetting, handleFailure, handleSuccess, sandbox, isExported]);

  useEffect(() => {
    fetchQLSettings();
  }, [fetchQLSettings]);

  return {
    loading,
    qlSettings: localData,
    refetch: fetchQLSettings,
    error,
  };
};
