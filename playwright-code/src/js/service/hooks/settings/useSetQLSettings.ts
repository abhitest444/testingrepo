import { useState } from 'react';
import { ApolloError } from '@apollo/client';
import { useIntl, useSandbox } from '@payroll/quicksand';
import {
  Common_DayOfWeek,
  TimeTracking_LocationTrackingType,
  TimeTracking_NotificationReminderMedium,
  TimeTracking_ScheduleEmployerSettingsInput,
  TimeTracking_ScheduleShiftChangeNotificationPreference,
  TimeTracking_UpdateEmployerSettingsPayload,
  TimeTracking_UpdateOvertimeNotificationSettingsInput,
  TimeTrackingUpdateEmployerSettingsMutation_Mutation,
  useTimeTrackingUpdateEmployerSettingsMutation,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { mapTimeTrackingMutationError } from 'src/js/service/errors/timeTrackingErrors';

export interface SetQLSettingsArgs {
  timeTrackingBillingEnabled?: {
    version: string;
    value: boolean;
  };
  timeTrackingUseItemForTimeEnabled?: {
    version: string;
    value: boolean;
  };
  timeTrackingBillingRateForTimeEnabled?: {
    version: string;
    value: boolean;
  };
  timeTrackingStartWorkWeek?: {
    version: string;
    value: number;
  };

  coreSettings?: {
    requireBillable?: {
      version: string;
      value: boolean;
    };
  };

  dateTimeSettings?: {
    timeZone?: {
      version: string;
      value: string;
    };
    clockFormat?: {
      version: string;
      value: number;
    };
  };

  timesheetManagementSettings?: {
    notes?: {
      enabled?: {
        version: string;
        value: boolean;
      };
      editEnabled?: {
        version: string;
        value: boolean;
      };
      requiredEnabled?: {
        version: string;
        value: boolean;
      };
    };
    timesheet?: {
      manageOwnTimesheetEnabled?: {
        version: string;
        value: boolean;
      };
      editClockOutTimeEnabled?: {
        version: string;
        value: boolean;
      };
      clockOutOverrideHours?: {
        version: string;
        value: number;
      };
      splitAtMidnightEnabled?: {
        version: string;
        value: boolean;
      };
      locationTracking?: {
        version: string;
        value: TimeTracking_LocationTrackingType;
      };
      mileageTrackingEnabled?: {
        version: string;
        value: boolean;
      };
    };
    customFields?: {
      customersEnabled?: {
        version: string;
        value: boolean;
      };
      classEnabled?: {
        version: string;
        value: boolean;
      };
      locationEnabled?: {
        version: string;
        value: boolean;
      };
      customDimensions?: Array<{
        dimensionDefinitionId: string;
        enabledForTimeTracking?: {
          version: string;
          value: boolean;
        };
        required?: {
          version: string;
          value: boolean;
        };
      }>;
    };
  };

  clockRoundingSettings?: {
    startTimeRounding?: {
      direction?: {
        version: string;
        value: string;
      };
      roundInMin?: {
        version: string;
        value: number;
      };
    };
    endTimeRounding?: {
      direction?: {
        version: string;
        value: string;
      };
      roundInMin?: {
        version: string;
        value: number;
      };
    };
  };

  geofenceSettings?: {
    geofenceEnabled?: {
      version: string;
      value: boolean;
    };
    geofenceReminderSettings?: {
      startTime?: {
        version: string;
        value: string;
      };
      endTime?: {
        version: string;
        value: string;
      };
      daysOfWeek?: {
        version: string;
        value: Common_DayOfWeek[];
      };
    };
  };

  /** Schedule employer settings only; omit when not updating schedules */
  scheduleSettings?: TimeTracking_ScheduleEmployerSettingsInput;

  /** Kiosk employer settings only; omit when not updating kiosk settings */
  kioskSettings?: {
    inactivityTimeout?: {
      version: string;
      value: number;
    };
  };

  notificationSettings?: {
    startShiftNotifications?: {
      reminderTime?: {
        version: string;
        value: string;
      };
      notificationMedium?: {
        version: string;
        value: TimeTracking_NotificationReminderMedium[];
      };
    };
    endShiftNotifications?: {
      reminderTime?: {
        version: string;
        value: string;
      };
      notificationMedium?: {
        version: string;
        value: TimeTracking_NotificationReminderMedium[];
      };
    };
    notificationEnabledForDays?: {
      version: string;
      value: Common_DayOfWeek[];
    };
    clockOutOverrideNotifications?: {
      adminEnabled?: {
        version: string;
        value: boolean;
      };
      groupManagerEnabled?: {
        version: string;
        value: boolean;
      };
    };
    timesheetEditNotifications?: {
      adminEnabled?: {
        version: string;
        value: boolean;
      };
      groupManagerEnabled?: {
        version: string;
        value: boolean;
      };
    };
    overtimeNotifications?: TimeTracking_UpdateOvertimeNotificationSettingsInput;
    scheduleNotifications?: {
      publishShiftChangePreference?: {
        version: string;
        value: TimeTracking_ScheduleShiftChangeNotificationPreference;
      };
    };
  };
}

// Type for arguments that will be passed to useSetQLSettings on call
export interface UseUpdateQLSettingsArgs {
  onSuccess: (data: TimeTracking_UpdateEmployerSettingsPayload) => void;
  onError: (error: string | any) => void;
}

export type useSetQLSettingsState = [
  (args: SetQLSettingsArgs) => Promise<void>,
  { loading: boolean },
];

export const mapNumberToDaysOfWeekValue = (
  dayNumber: number,
): Common_DayOfWeek => {
  const numberToDaysOfWeekMap: { [key: number]: Common_DayOfWeek } = {
    0: Common_DayOfWeek.Sunday,
    1: Common_DayOfWeek.Monday,
    2: Common_DayOfWeek.Tuesday,
    3: Common_DayOfWeek.Wednesday,
    4: Common_DayOfWeek.Thursday,
    5: Common_DayOfWeek.Friday,
    6: Common_DayOfWeek.Saturday,
  };
  return numberToDaysOfWeekMap[dayNumber] ?? Common_DayOfWeek.Sunday;
};

export const useSetQLSettings = ({
  onSuccess,
  onError,
}: UseUpdateQLSettingsArgs): useSetQLSettingsState => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = (result: any) => {
    // TODO: Temporarily disabled, reenable once version mismatch issue for employer settings is resolved
    // endInteractionWithSuccess(
    //   sandbox,
    //   TimeCustomerInteraction.EMPLOYER_SETTINGS_SAVE,
    // );
    onSuccess(result);
  };

  const handleError = (error: string | ApolloError | undefined) => {
    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.EMPLOYER_SETTINGS_SAVE,
      error as string,
    );
    const mappedError = mapError({
      sourceComponent: 'updateQLSettings',
      sandbox,
      intl,
      error,
      customErrorHandler: (error) => mapTimeTrackingMutationError(intl, error),
    });

    if (mappedError) {
      onError(mappedError);
    }
  };

  const handleCompleted = (
    result: TimeTrackingUpdateEmployerSettingsMutation_Mutation,
  ) => {
    if (!result.timeTrackingUpdateEmployerSettings) {
      handleError('Null Response');
      return;
    }
    if (
      result &&
      result.timeTrackingUpdateEmployerSettings &&
      result.timeTrackingUpdateEmployerSettings.__typename &&
      result.timeTrackingUpdateEmployerSettings.__typename ===
        'TimeTracking_UpdateEmployerSettingsError'
    ) {
      handleError(result.timeTrackingUpdateEmployerSettings.errorCode);
    } else if (
      result &&
      result.timeTrackingUpdateEmployerSettings &&
      result.timeTrackingUpdateEmployerSettings.__typename &&
      result.timeTrackingUpdateEmployerSettings.__typename ===
        'TimeTracking_UpdateEmployerSettingsPayload'
    ) {
      if (result.timeTrackingUpdateEmployerSettings.employerSettings) {
        handleSuccess(
          result.timeTrackingUpdateEmployerSettings.employerSettings,
        );
      }
    }
  };

  const [timeTrackingUpdateEmployerSettings] =
    useTimeTrackingUpdateEmployerSettingsMutation({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
      },
      onCompleted: handleCompleted,
      onError: handleError,
    });

  const [loading, setLoading] = useState<boolean>(false);

  const updateQLSettings = async (args: SetQLSettingsArgs) => {
    setLoading(true);
    try {
      // TODO: Temporarily disabled, reenable once version mismatch issue for employer settings is resolved
      // create customer interaction for the updateQLSettings operation
      // createCustomerInteraction(
      //   sandbox,
      //   TimeCustomerInteraction.EMPLOYER_SETTINGS_SAVE,
      // );
      // update the QL employer settings
      await timeTrackingUpdateEmployerSettings({
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          // headers: getCustomerInteractionPropagationHeaders(
          //   sandbox,
          //   TimeCustomerInteraction.EMPLOYER_SETTINGS_SAVE,
          // ),
        },
        variables: {
          input: {
            timeTrackingBillingEnabled: args.timeTrackingBillingEnabled
              ? {
                  version: args.timeTrackingBillingEnabled.version,
                  value: args.timeTrackingBillingEnabled.value,
                }
              : undefined,
            timeTrackingUseItemForTimeEnabled:
              args.timeTrackingUseItemForTimeEnabled
                ? {
                    version: args.timeTrackingUseItemForTimeEnabled.version,
                    value: args.timeTrackingUseItemForTimeEnabled.value,
                  }
                : undefined,
            timeTrackingBillingRateForTimeEnabled:
              args.timeTrackingBillingRateForTimeEnabled
                ? {
                    version:
                      args.timeTrackingBillingRateForTimeEnabled?.version,
                    value: args.timeTrackingBillingRateForTimeEnabled?.value,
                  }
                : undefined,
            timeTrackingStartWorkWeek: args.timeTrackingStartWorkWeek
              ? {
                  version: args.timeTrackingStartWorkWeek.version,
                  value: mapNumberToDaysOfWeekValue(
                    args.timeTrackingStartWorkWeek.value,
                  ) as Common_DayOfWeek,
                }
              : undefined,
            coreSettings: args.coreSettings ? args.coreSettings : undefined,
            notificationSettings: args.notificationSettings
              ? args.notificationSettings
              : undefined,
            dateTimeSettings: args.dateTimeSettings
              ? args.dateTimeSettings
              : undefined,
            timesheetManagementSettings: args.timesheetManagementSettings
              ? args.timesheetManagementSettings
              : undefined,
            clockRoundingSettings: args.clockRoundingSettings
              ? args.clockRoundingSettings
              : undefined,
            geofenceSettings: args.geofenceSettings
              ? args.geofenceSettings
              : undefined,
            scheduleSettings: args.scheduleSettings
              ? args.scheduleSettings
              : undefined,
            kioskSettings: args.kioskSettings,
          },
        },
      });
    } catch (error) {
      handleError(error as string);
    } finally {
      setLoading(false);
    }
  };

  return [updateQLSettings, { loading }];
};
