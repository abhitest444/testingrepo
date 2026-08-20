import { useSandbox } from '@payroll/quicksand';
import { useCallback, useEffect, useState } from 'react';
import {
  useGetApprovalSettingsLazyQuery,
  TimeTracking_ApprovalSettings,
  TimeTracking_ApprovalReminderBasis,
} from 'src/__generated__/timeTracking/graphql';
import { mapFieldApprovalSettingsField } from 'src/js/widgets/timeTrackingSettings/utils';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  TimeEntryArrayField,
  TimeEntryBooleanField,
  TimeEntryNumberField,
  TimeEntryStringField,
} from './useGetQLSettings';

export interface UseGetApprovalSettingsResult {
  loading: boolean;
  settled: boolean;
  approvalSettings: mappedApprovalSettings;
  refetch: () => Promise<void>;
  error: string;
}

export interface mappedApprovalSettings {
  requireApprovalForTrackedTime: TimeEntryBooleanField;
  enablePartialWeekSubmission: TimeEntryBooleanField;
  requireTeamMembersSubmitTime: TimeEntryBooleanField;
  customMessage: TimeEntryStringField;
  // manager reminders
  managerReminderBasedOn: TimeEntryStringField;
  // on basis of week
  managerCurrentWeekReminderDays: TimeEntryArrayField;
  managerCurrentWeekReminderHour: TimeEntryNumberField;
  managerCurrentWeekReminderMedium: TimeEntryArrayField;
  managerPreviousWeekReminderDays: TimeEntryArrayField;
  managerPreviousWeekReminderHour: TimeEntryNumberField;
  managerPreviousWeekReminderMedium: TimeEntryArrayField;
  // on basis of pay period
  managerCurrentPayPeriodReminderHour: TimeEntryNumberField;
  managerCurrentPayPeriodReminderOffsetDays: TimeEntryNumberField;
  managerCurrentPayPeriodReminderMedium: TimeEntryArrayField;
  managerPreviousPayPeriodReminderHour: TimeEntryNumberField;
  managerPreviousPayPeriodReminderOffsetDays: TimeEntryNumberField;
  managerPreviousPayPeriodReminderMedium: TimeEntryArrayField;

  // employee reminders
  employeeReminderBasedOn: TimeEntryStringField;
  // on basis of week
  employeeCurrentWeekReminderDays: TimeEntryArrayField;
  employeeCurrentWeekReminderHour: TimeEntryNumberField;
  employeeCurrentWeekReminderMedium: TimeEntryArrayField;
  employeePreviousWeekReminderDays: TimeEntryArrayField;
  employeePreviousWeekReminderHour: TimeEntryNumberField;
  employeePreviousWeekReminderMedium: TimeEntryArrayField;
  // on basis of pay period
  employeeCurrentPayPeriodReminderHour: TimeEntryNumberField;
  employeeCurrentPayPeriodReminderOffsetDays: TimeEntryNumberField;
  employeeCurrentPayPeriodReminderMedium: TimeEntryArrayField;
  employeePreviousPayPeriodReminderHour: TimeEntryNumberField;
  employeePreviousPayPeriodReminderOffsetDays: TimeEntryNumberField;
  employeePreviousPayPeriodReminderMedium: TimeEntryArrayField;
  // on basis of daily
  employeeDailyReminderFirstReminderHour: TimeEntryNumberField;
  employeeDailyReminderFirstReminderMedium: TimeEntryArrayField;
  employeeDailyReminderSecondReminderHour: TimeEntryNumberField;
  employeeDailyReminderSecondReminderMedium: TimeEntryArrayField;
  employeeDailyReminderForTimesheetDays: TimeEntryArrayField;

  // submission notifications
  notifyManagerOnSubmit: TimeEntryBooleanField;
  notifyManagerOnGroupSubmitted: TimeEntryBooleanField;
}
// Context: TimeTracking Approval Settings
const mapApprovalSettings = (
  settings: TimeTracking_ApprovalSettings,
): mappedApprovalSettings => ({
  requireApprovalForTrackedTime: mapFieldApprovalSettingsField(
    settings.employee?.approvalEnabled,
    false,
  ),
  enablePartialWeekSubmission: {
    version:
      settings.employee?.partialWeekApprovalEnabled?.meta?.version ?? '0',
    value: !(settings.employee?.partialWeekApprovalEnabled?.value ?? true),
  },
  requireTeamMembersSubmitTime: mapFieldApprovalSettingsField(
    settings.employee?.submissionRequired,
    false,
  ),
  customMessage: mapFieldApprovalSettingsField(
    settings.employee?.submitMessage,
    '',
  ),

  // manager reminders
  managerReminderBasedOn: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.reminderBasedOn,
    TimeTracking_ApprovalReminderBasis.DayOfWeek,
  ),
  managerCurrentWeekReminderDays: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.week?.currentWeekReminder?.daysOfWeek,
    [],
  ),
  managerCurrentWeekReminderHour: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.week?.currentWeekReminder?.hour,
    0,
  ),
  managerCurrentWeekReminderMedium: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.week?.currentWeekReminder?.reminderMedium,
    [],
  ),
  managerPreviousWeekReminderDays: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.week?.previousWeekReminder?.daysOfWeek,
    [],
  ),
  managerPreviousWeekReminderHour: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.week?.previousWeekReminder?.hour,
    0,
  ),
  managerPreviousWeekReminderMedium: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.week?.previousWeekReminder?.reminderMedium,
    [],
  ),
  managerCurrentPayPeriodReminderHour: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.payPeriod?.currentPeriodReminder?.hour,
    0,
  ),
  managerCurrentPayPeriodReminderOffsetDays: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.payPeriod?.currentPeriodReminder?.offsetDays,
    0,
  ),
  managerCurrentPayPeriodReminderMedium: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.payPeriod?.currentPeriodReminder
      ?.reminderMedium,
    [],
  ),
  managerPreviousPayPeriodReminderHour: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.payPeriod?.previousPeriodReminder?.hour,
    0,
  ),
  managerPreviousPayPeriodReminderOffsetDays: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.payPeriod?.previousPeriodReminder?.offsetDays,
    0,
  ),
  managerPreviousPayPeriodReminderMedium: mapFieldApprovalSettingsField(
    settings.manager?.reminders?.payPeriod?.previousPeriodReminder
      ?.reminderMedium,
    [],
  ),

  // employee reminders
  employeeReminderBasedOn: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.reminderBasedOn,
    TimeTracking_ApprovalReminderBasis.DayOfWeek,
  ),
  employeeCurrentWeekReminderDays: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.week?.currentWeekReminder?.daysOfWeek,
    [],
  ),
  employeeCurrentWeekReminderHour: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.week?.currentWeekReminder?.hour,
    0,
  ),
  employeeCurrentWeekReminderMedium: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.week?.currentWeekReminder?.reminderMedium,
    [],
  ),
  employeePreviousWeekReminderDays: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.week?.previousWeekReminder?.daysOfWeek,
    [],
  ),
  employeePreviousWeekReminderHour: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.week?.previousWeekReminder?.hour,
    0,
  ),
  employeePreviousWeekReminderMedium: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.week?.previousWeekReminder?.reminderMedium,
    [],
  ),
  employeeCurrentPayPeriodReminderHour: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.payPeriod?.currentPeriodReminder?.hour,
    0,
  ),
  employeeCurrentPayPeriodReminderOffsetDays: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.payPeriod?.currentPeriodReminder?.offsetDays,
    0,
  ),
  employeeCurrentPayPeriodReminderMedium: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.payPeriod?.currentPeriodReminder
      ?.reminderMedium,
    [],
  ),
  employeePreviousPayPeriodReminderHour: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.payPeriod?.previousPeriodReminder?.hour,
    0,
  ),
  employeePreviousPayPeriodReminderOffsetDays: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.payPeriod?.previousPeriodReminder?.offsetDays,
    0,
  ),
  employeePreviousPayPeriodReminderMedium: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.payPeriod?.previousPeriodReminder
      ?.reminderMedium,
    [],
  ),
  employeeDailyReminderFirstReminderHour: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.daily?.firstReminder?.hour,
    0,
  ),
  employeeDailyReminderFirstReminderMedium: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.daily?.firstReminder?.reminderMedium,
    [],
  ),
  employeeDailyReminderSecondReminderHour: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.daily?.secondReminder?.hour,
    0,
  ),
  employeeDailyReminderSecondReminderMedium: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.daily?.secondReminder?.reminderMedium,
    [],
  ),
  employeeDailyReminderForTimesheetDays: mapFieldApprovalSettingsField(
    settings.employee?.reminders?.daily?.reminderForTimesheetDays,
    [],
  ),

  // submission notifications
  notifyManagerOnSubmit: mapFieldApprovalSettingsField(
    settings.submissionNotifications?.notifyManagerOnSubmit,
    false,
  ),
  notifyManagerOnGroupSubmitted: mapFieldApprovalSettingsField(
    settings.submissionNotifications?.notifyManagerOnGroupSubmitted,
    false,
  ),
});

const approvalSettingsDefaultState: mappedApprovalSettings = {
  requireApprovalForTrackedTime: { version: '0', value: false },
  enablePartialWeekSubmission: { version: '0', value: false },
  requireTeamMembersSubmitTime: { version: '0', value: false },
  customMessage: { version: '0', value: '' },
  managerReminderBasedOn: {
    version: '0',
    value: 'DAY_OF_WEEK',
  },
  managerCurrentWeekReminderDays: { version: '0', value: [] },
  managerCurrentWeekReminderHour: { version: '0', value: 0 },
  managerCurrentWeekReminderMedium: { version: '0', value: [] },
  managerPreviousWeekReminderDays: { version: '0', value: [] },
  managerPreviousWeekReminderHour: { version: '0', value: 0 },
  managerPreviousWeekReminderMedium: { version: '0', value: [] },
  managerCurrentPayPeriodReminderHour: { version: '0', value: 0 },
  managerCurrentPayPeriodReminderOffsetDays: { version: '0', value: 0 },
  managerCurrentPayPeriodReminderMedium: {
    version: '0',
    value: [],
  },
  managerPreviousPayPeriodReminderHour: { version: '0', value: 0 },
  managerPreviousPayPeriodReminderOffsetDays: {
    version: '0',
    value: 0,
  },
  managerPreviousPayPeriodReminderMedium: {
    version: '0',
    value: [],
  },
  employeeReminderBasedOn: {
    version: '0',
    value: 'DAY_OF_WEEK',
  },
  employeeCurrentWeekReminderDays: { version: '0', value: [] },
  employeeCurrentWeekReminderHour: { version: '0', value: 0 },
  employeeCurrentWeekReminderMedium: { version: '0', value: [] },
  employeePreviousWeekReminderDays: { version: '0', value: [] },
  employeePreviousWeekReminderHour: { version: '0', value: 0 },
  employeePreviousWeekReminderMedium: { version: '0', value: [] },
  employeeCurrentPayPeriodReminderHour: { version: '0', value: 0 },
  employeeCurrentPayPeriodReminderOffsetDays: {
    version: '0',
    value: 0,
  },
  employeeCurrentPayPeriodReminderMedium: {
    version: '0',
    value: [],
  },
  employeePreviousPayPeriodReminderHour: { version: '0', value: 0 },
  employeePreviousPayPeriodReminderOffsetDays: {
    version: '0',
    value: 0,
  },
  employeePreviousPayPeriodReminderMedium: {
    version: '0',
    value: [],
  },
  employeeDailyReminderFirstReminderHour: { version: '0', value: 0 },
  employeeDailyReminderSecondReminderHour: { version: '0', value: 0 },
  employeeDailyReminderForTimesheetDays: {
    version: '0',
    value: [],
  },
  employeeDailyReminderFirstReminderMedium: { version: '0', value: [] },
  employeeDailyReminderSecondReminderMedium: { version: '0', value: [] },
  notifyManagerOnSubmit: { version: '0', value: false },
  notifyManagerOnGroupSubmitted: { version: '0', value: false },
};

export const useGetApprovalSettings = (): UseGetApprovalSettingsResult => {
  const sandbox = useSandbox();
  const [localData, setLocalData] = useState<mappedApprovalSettings>(
    approvalSettingsDefaultState,
  );
  const [loading, setLoading] = useState<boolean>(false);
  // True once a fetch attempt has fully completed (success or failure).
  // Distinguishes "request finished" from the initial default-state render.
  const [settled, setSettled] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [getApprovalSettings] = useGetApprovalSettingsLazyQuery({
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
  });

  const handleSuccess = useCallback(
    (settings: TimeTracking_ApprovalSettings) => {
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.GET_APPROVAL_SETTINGS,
      );
      if (settings) {
        setLocalData(mapApprovalSettings(settings));
      }
    },
    [sandbox],
  );

  const handleFailure = useCallback(
    (error) => {
      if (error) {
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.GET_APPROVAL_SETTINGS,
          error.message,
          error,
        );
        setError(error.message);
      }
    },
    [sandbox],
  );

  const fetchApprovalSettings = useCallback(async () => {
    setLoading(true);
    setSettled(false);
    setError('');
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.GET_APPROVAL_SETTINGS,
    );

    getApprovalSettings({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: getCustomerInteractionPropagationHeaders(
          sandbox,
          TimeCustomerInteraction.GET_APPROVAL_SETTINGS,
        ),
      },
    })
      .then((response) => {
        if (response.error) {
          handleFailure(response.error);
        } else if (response.data?.timeTrackingApprovalSettings) {
          handleSuccess(response.data.timeTrackingApprovalSettings);
        }
      })
      .catch(handleFailure)
      .finally(() => {
        setLoading(false);
        setSettled(true);
      });
  }, [getApprovalSettings, handleFailure, handleSuccess, sandbox]);

  useEffect(() => {
    fetchApprovalSettings();
  }, [fetchApprovalSettings]);

  return {
    loading,
    settled,
    approvalSettings: localData,
    refetch: fetchApprovalSettings,
    error,
  };
};
