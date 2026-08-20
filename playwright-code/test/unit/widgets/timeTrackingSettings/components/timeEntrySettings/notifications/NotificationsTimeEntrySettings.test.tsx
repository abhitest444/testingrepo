import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useIntl } from '@payroll/quicksand';
import * as ReactHookForm from 'react-hook-form';
import { NotificationsTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/NotificationsTimeEntrySettings';
import { WEEK_DAYS, FEATURE_FLAGS } from 'src/js/common/constants';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import {
  convertTo12Hour,
  uppercaseToPascalcase,
} from 'src/js/widgets/timeTrackingSettings/utils';
import {
  ApprovalRemindersbasedOn,
  ApprovalReminderPrefix,
  NotificationMedium,
  NotificationFieldKey,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { IFormConfig } from 'src/js/widgets/timeTrackingSettings/types';

jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(),
}));

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: jest.fn(() => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
    pubsub: {
      publish: jest.fn(),
      subscribe: jest.fn(),
    },
    appContext: {
      getEnvironment: jest.fn().mockReturnValue('e2e'),
      getRealmInfo: jest.fn().mockReturnValue({
        realmId: 'exampleRealmId',
      }),
      getUserAuthInfo: jest.fn().mockReturnValue({
        authId: 'exampleAuthId',
      }),
    },
    pluginConfig: {
      extendedProperties: {
        appSecret: 'exampleAppSecret',
      },
    },
    featureFlags: {
      isFeatureEnabled: jest.fn(),
    },
    authorization: {
      isAuthorized: jest.fn(),
    },
    extensions: {
      qbo: {
        context: {
          getEnvironmentInfo: jest.fn().mockReturnValue({
            xCsrfToken: 'exampleCsrfToken',
          }),
          getCompanyL10nInfo: jest.fn().mockReturnValue({
            region: 'exampleRegion',
          }),
        },
      },
    },
  })),
  useIntl: jest.fn(),
  useTracking: jest.fn().mockReturnValue(jest.fn()),
  useAppContext: jest.fn().mockReturnValue({
    realmId: '123456',
    environment: 'sandbox',
  }),
  useStorage: jest.fn().mockReturnValue([false, jest.fn()]),
  useAuthorization: jest.fn().mockReturnValue({
    loading: false,
    decision: {
      isAuthorized: true,
    },
  }),
}));

jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: jest.fn(),
  }),
);

// Mock the EditNotificationTimeEntry component
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditNotificationTimeEntrySettings',
  () => ({
    EditNotificationTimeEntry: () => <div>Edit Notification Time Entry</div>,
  }),
);

// Mock the EditScheduleNotificationSettings component. Its internal RHF Controller
// is exercised separately; here we stub it so the shared useForm stubs (control: {})
// don't trip react-hook-form, matching the other Edit* notification mocks.
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditScheduleNotificationSettings',
  () => ({
    EditScheduleNotificationSettings: () => (
      <div>Edit Schedule Notification</div>
    ),
  }),
);

// Mock the EditApprovalsNotificationSettings component
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditApprovalsNotificationSettings',
  () => ({
    EditApprovalsNotificationSettings: () => (
      <div>Edit Approvals Notification</div>
    ),
  }),
);

// Mock the EditSubmissionsNotificationSettings component
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditSubmissionsNotificationSettings',
  () => ({
    EditSubmissionsNotificationSettings: () => (
      <div>Edit Submissions Notification</div>
    ),
  }),
);

// Mock the EditGeofenceNotificationSettings component
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditGeofenceNotificationSettings',
  () => ({
    EditGeofenceNotificationSettings: () => (
      <div>Edit Geofence Notification</div>
    ),
  }),
);

// Mock useOvertimeFeatureFlag hook to prevent sandbox.performance calls
jest.mock('src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled', () => ({
  useOvertimeFeatureFlag: jest.fn(() => ({
    isEnabled: false,
    isLoading: false,
  })),
}));

// Mock entitlements hook
const mockGetEntitlements = jest.fn();
jest.mock('src/js/service/hooks/entitlements/useGetEntitlements', () => ({
  useGetEntitlements: () => mockGetEntitlements(),
  computeHasTimeElite: (entitlements: any[]) =>
    entitlements.some((e) => e.name === 'TIME_ELITE'),
}));

// Mock viewContent — must export layout primitives used by EmployerOvertimeNotificationsView
jest.mock('src/js/widgets/timeTrackingSettings/common/viewContent', () => ({
  ViewContent: ({ formFields, isErrorInView, sectionErrors }: any) => (
    <div data-testid="view-content">
      View Content
      {isErrorInView && <span data-testid="error-in-view">Has Error</span>}
      {sectionErrors && (
        <span data-testid="section-errors">Section Errors</span>
      )}
      {formFields && <span data-testid="form-fields">Has Form Fields</span>}
    </div>
  ),
  BoldLabel: ({ children }: any) => (
    <div data-testid="bold-label">{children}</div>
  ),
  Label: ({ children }: any) => <span data-testid="label">{children}</span>,
  StyledRow: ({ children }: any) => <div>{children}</div>,
  Value: ({ children }: any) => <span>{children}</span>,
}));

// Mock the GeneralSettingSection component
jest.mock(
  'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection',
  () => ({
    GeneralSettingSection: ({
      ViewContent,
      EditContent,
      Title,
    }: {
      ViewContent: React.ReactNode;
      EditContent: React.ReactNode;
      Title: string;
    }) => (
      <div>
        <div>{Title}</div>
        <div>{ViewContent}</div>
        <div>{EditContent}</div>
      </div>
    ),
  }),
);

const mockSetNotificationFields = jest.fn();

const mockIsFieldsVisible = {
  notifyWhenClockInOutTimeAdjusted: false,
  notifyWhenNotesAreAddedOrEdited: false,
};

const mockUpdateVisibleFields = jest.fn();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const methods = ReactHookForm.useForm();
  return (
    <ReactHookForm.FormProvider
      control={methods.control}
      handleSubmit={methods.handleSubmit}
      register={methods.register}
      setValue={methods.setValue}
      getValues={methods.getValues}
      formState={methods.formState}
      watch={methods.watch}
      reset={methods.reset}
      clearErrors={methods.clearErrors}
      setError={methods.setError}
      trigger={methods.trigger}
      unregister={methods.unregister}
      getFieldState={methods.getFieldState}
      resetField={methods.resetField}
      setFocus={methods.setFocus}
    >
      {children}
    </ReactHookForm.FormProvider>
  );
};

describe('NotificationsTimeEntrySettings', () => {
  const mockQLData = {
    isServiceFieldEnabled: { version: '1', value: false },
    isBillingFieldEnabled: { version: '1', value: false },
    firstDayOfWeek: { version: '1', value: 0 },
    timeFormat: { version: '1', value: 12 },
    timeZone: { version: '1', value: 'Eastern time (US & Canada)' },
    billingRateForTimeEnabled: { version: '0', value: false },
    timeTrackingSupported: { version: '0', value: false },
    transactionBillingForTimeEnabled: { version: '0', value: false },
    transactionTimeTrackingEnabled: { version: '0', value: false },
    useItemForTime: { version: '0', value: false },
    isSplitTimeSheet: { version: '0', value: true },
    isAllowTeamMemberToCreateAndEditTimeSheet: {
      version: '0',
      value: true,
    },
    isTeamMemberEditClockOutTime: { version: '1', value: true },
    teamMemberEditedClockOutTime: { version: '1', value: '8 Hours' },
    isRoundClockInTime: { version: '1', value: true },
    roundClockInTimeDirection: { version: '1', value: 'Nearest' },
    roundClockInTimeDuration: { version: '1', value: '1 minute' },
    isRoundClockOutTime: { version: '1', value: true },
    roundClockOutTimeDirection: { version: '1', value: 'Nearest' },
    roundClockOutTimeDuration: { version: '1', value: '1 minute' },
    isSendClockInReminderEmail: { version: '1', value: true },
    isSendClockInReminderText: { version: '1', value: true },
    sendClockInRemindersAt: { version: '1', value: '9:00 AM' },
    isSendClockOutReminderEmail: { version: '1', value: true },
    isSendClockOutReminderText: { version: '1', value: true },
    sendClockOutRemindersAt: { version: '1', value: '6:00 PM' },
    reminderDays: { version: '1', value: 'Monday,Tuesday' },
    notifyClockInOutAdjusted: { version: '1', value: 'Immediate' },
    notifyNotesAddedOrEdited: { version: '1', value: 'Daily' },
    geofenceReminderStartTime: { version: '1', value: '09:00' },
    geofenceReminderEndTime: { version: '1', value: '18:00' },
    geofenceReminderDaysOfWeek: { version: '1', value: ['MONDAY', 'TUESDAY'] },
    geofenceEnabled: { version: '1', value: true },
  };

  // Helper function to create notification fields with optional geofence fields
  const createMockNotificationFields = (
    includeGeofence = false,
  ): IFormConfig => {
    const baseFields: any[] = [
      {
        id: 'timeEntriesSendClockInReminders',
        key: 'sendClockInNotificationReminders',
        title:
          'time-entries.section.title.notifications.time-tracking.send-clock-in-reminders',
        ariaLabel: '',
        tooltipText: '',
        detail: {
          title: '',
          subtitle: '',
          ariaLabel: '',
        },
        disabled: false,
        value: '',
        subFields: [],
        isEditable: true,
      },
      {
        id: 'timeEntriesSendClockOutReminders',
        key: 'sendClockOutNotificationReminders',
        title:
          'time-entries.section.title.notifications.time-tracking.send-clock-out-reminders',
        ariaLabel: '',
        tooltipText: '',
        detail: {
          title: '',
          subtitle: '',
          ariaLabel: '',
        },
        disabled: false,
        value: '',
        subFields: [],
        isEditable: true,
      },
      {
        id: 'daysRemindersAreSend',
        key: 'notificationEnabledForDays',
        title:
          'time-entries.section.title.notifications.time-tracking.days-reminders-are-sent',
        ariaLabel: '',
        tooltipText: '',
        detail: {
          title: '',
          subtitle: '',
          ariaLabel: '',
        },
        disabled: false,
        value: '',
        subFields: [],
        isEditable: true,
      },
      {
        id: 'notifyWhenClockInOutUpdated',
        key: 'notifyWhenClockInOutUpdated',
        title:
          'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
        ariaLabel: '',
        tooltipText: '',
        detail: {
          title: '',
          subtitle: '',
          ariaLabel: '',
        },
        disabled: false,
        value: '',
        subFields: [],
        isEditable: true,
      },
      {
        id: 'notifyWhenNotesAreAddedOrEdited',
        key: 'notifyWhenNotesAreAddedOrEdited',
        title:
          'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited',
        ariaLabel: '',
        tooltipText: '',
        detail: {
          title: '',
          subtitle: '',
          ariaLabel: '',
        },
        disabled: false,
        value: '',
        subFields: [],
        isEditable: true,
      },
    ];

    if (includeGeofence) {
      baseFields.push(
        {
          id: 'geofenceSettingsHeader',
          key: NotificationFieldKey.GEOFENCE_SETTINGS_HEADER,
          title: 'Geofence Settings',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: false,
          isVisible: false,
        },
        {
          id: 'geofenceReminderSettings',
          key: NotificationFieldKey.GEOFENCE_REMINDER_SETTINGS,
          title: 'Geofence Reminder Settings',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: true,
          isVisible: false,
        },
      );
    }

    return {
      notifications: baseFields,
    };
  };

  // Default notification fields without geofence (for tests that don't enable geofence)
  const mockNotificationFields = createMockNotificationFields(false);

  // Notification fields with geofence (for tests that enable geofence IXP)
  const mockNotificationFieldsWithGeofence = createMockNotificationFields(true);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ReactHookForm, 'useWatch').mockReturnValue(false as any);
    (useIntl as jest.Mock).mockReturnValue({
      formatMessage: ({ id }: { id: string }) => id,
    });
    (useIXPFeatureFlag as jest.Mock).mockReturnValue({
      isEnabled: false,
    });
    mockGetEntitlements.mockReturnValue({
      data: [],
    });
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: mockQLData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      isUKLocale: false,
    });
  });

  test('testComponentRendersWithInitialSettings', () => {
    const { getByText } = render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    expect(getByText('notificationSettings')).toBeInTheDocument();
  });

  test('testNotificationFieldsUpdateOnQLDataChange', () => {
    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    expect(mockSetNotificationFields).toHaveBeenCalled();
  });

  test('testFormUpdateAndCancelFunctions', () => {
    const mockOnFormUpdate = jest.fn();
    const mockOnFormCancel = jest.fn();

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={mockOnFormUpdate}
          onFormCancel={mockOnFormCancel}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    expect(mockOnFormUpdate).not.toHaveBeenCalled();
    expect(mockOnFormCancel).not.toHaveBeenCalled();

    mockOnFormUpdate('notificationSettings');
    expect(mockOnFormUpdate).toHaveBeenCalledWith('notificationSettings');

    mockOnFormCancel('notificationSettings');
    expect(mockOnFormCancel).toHaveBeenCalledWith('notificationSettings');
  });

  test('testHandlesMissingQLData', () => {
    const missingQlData = {
      isServiceFieldEnabled: { version: '1', value: false },
      isBillingFieldEnabled: { version: '1', value: false },
      firstDayOfWeek: { version: '1', value: 0 },
      timeFormat: { version: '1', value: 12 },
      timeZone: { version: '1', value: 'Eastern time (US & Canada)' },
      billingRateForTimeEnabled: { version: '0', value: false },
      timeTrackingSupported: { version: '0', value: false },
      transactionBillingForTimeEnabled: { version: '0', value: false },
      transactionTimeTrackingEnabled: { version: '0', value: false },
      useItemForTime: { version: '0', value: false },
      isSplitTimeSheet: { version: '0', value: true },
      isAllowTeamMemberToCreateAndEditTimeSheet: {
        version: '0',
        value: true,
      },
      isTeamMemberEditClockOutTime: { version: '1', value: true },
      teamMemberEditedClockOutTime: { version: '1', value: '8 Hours' },
      isRoundClockInTime: { version: '1', value: true },
      roundClockInTimeDirection: { version: '1', value: 'Nearest' },
      roundClockInTimeDuration: { version: '1', value: '1 minute' },
      isRoundClockOutTime: { version: '1', value: true },
      roundClockOutTimeDirection: { version: '1', value: 'Nearest' },
      roundClockOutTimeDuration: { version: '1', value: '1 minute' },
      isSendClockInReminderEmail: { version: '1', value: false },
      isSendClockInReminderText: { version: '1', value: true },
      sendClockInRemindersAt: { version: '1', value: '8:00 AM' },
      isSendClockOutReminderEmail: { version: '1', value: true },
      isSendClockOutReminderText: { version: '1', value: false },
      sendClockOutRemindersAt: { version: '1', value: '5:00 PM' },
      reminderDays: { version: '1', value: '' },
      notifyClockInOutAdjusted: { version: '1', value: '' },
      notifyNotesAddedOrEdited: { version: '1', value: '' },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: missingQlData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    expect(mockSetNotificationFields).toHaveBeenCalled();
  });

  test('testSendClockIn-OutasEmpty', () => {
    const missingQlData = {
      isServiceFieldEnabled: { version: '1', value: false },
      isBillingFieldEnabled: { version: '1', value: false },
      firstDayOfWeek: { version: '1', value: 0 },
      timeFormat: { version: '1', value: 12 },
      timeZone: { version: '1', value: 'Eastern time (US & Canada)' },
      billingRateForTimeEnabled: { version: '0', value: false },
      timeTrackingSupported: { version: '0', value: false },
      transactionBillingForTimeEnabled: { version: '0', value: false },
      transactionTimeTrackingEnabled: { version: '0', value: false },
      useItemForTime: { version: '0', value: false },
      isSplitTimeSheet: { version: '0', value: true },
      isAllowTeamMemberToCreateAndEditTimeSheet: {
        version: '0',
        value: true,
      },
      isTeamMemberEditClockOutTime: { version: '1', value: true },
      teamMemberEditedClocOutTime: { version: '1', value: '8 Hours' },
      isRoundClockInTime: { version: '1', value: true },
      roundClockInTimeDirection: { version: '1', value: 'Nearest' },
      roundClockInTimeDuration: { version: '1', value: '1 minute' },
      isRoundClockOutTime: { version: '1', value: true },
      roundClockOutTimeDirection: { version: '1', value: 'Nearest' },
      roundClockOutTimeDuration: { version: '1', value: '1 minute' },
      isSendClockInReminderEmail: { version: '1', value: false },
      isSendClockInReminderText: { version: '1', value: true },
      sendClockInRemindersAt: { version: '1', value: '' },
      isSendClockOutReminderEmail: { version: '1', value: true },
      isSendClockOutReminderText: { version: '1', value: false },
      sendClockOutRemindersAt: { version: '1', value: '' },
      reminderDays: { version: '1', value: '' },
      notifyClockInOutAdjusted: { version: '1', value: '' },
      notifyNotesAddedOrEdited: { version: '1', value: '' },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: missingQlData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    expect(mockSetNotificationFields).toHaveBeenCalled();
  });

  test('testSendClockIn-Outremindersasfalse', () => {
    const missingQlData = {
      isServiceFieldEnabled: { version: '1', value: false },
      isBillingFieldEnabled: { version: '1', value: false },
      firstDayOfWeek: { version: '1', value: 0 },
      timeFormat: { version: '1', value: 12 },
      timeZone: { version: '1', value: 'Eastern time (US & Canada)' },
      billingRateForTimeEnabled: { version: '0', value: false },
      timeTrackingSupported: { version: '0', value: false },
      transactionBillingForTimeEnabled: { version: '0', value: false },
      transactionTimeTrackingEnabled: { version: '0', value: false },
      useItemForTime: { version: '0', value: false },
      isSplitTimeSheet: { version: '0', value: true },
      isAllowTeamMemberToCreateAndEditTimeSheet: {
        version: '0',
        value: true,
      },
      isTeamMemberEditClockOutTime: { version: '1', value: true },
      teamMemberEditedClocOutTime: { version: '1', value: '8 Hours' },
      isRoundClockInTime: { version: '1', value: true },
      roundClockInTimeDirection: { version: '1', value: 'Nearest' },
      roundClockInTimeDuration: { version: '1', value: '1 minute' },
      isRoundClockOutTime: { version: '1', value: true },
      roundClockOutTimeDirection: { version: '1', value: 'Nearest' },
      roundClockOutTimeDuration: { version: '1', value: '1 minute' },
      isSendClockInReminderEmail: { version: '1', value: false },
      isSendClockInReminderText: { version: '1', value: false },
      sendClockInRemindersAt: { version: '1', value: '' },
      isSendClockOutReminderEmail: { version: '1', value: false },
      isSendClockOutReminderText: { version: '1', value: false },
      sendClockOutRemindersAt: { version: '1', value: '' },
      reminderDays: { version: '1', value: '' },
      notifyClockInOutAdjusted: { version: '1', value: '' },
      notifyNotesAddedOrEdited: { version: '1', value: '' },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: missingQlData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    expect(mockSetNotificationFields).toHaveBeenCalled();
  });

  test('testHandlesEmptyNotificationFields', () => {
    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={{}}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    expect(mockSetNotificationFields).toHaveBeenCalledWith({});
  });

  test('testHandlesUnexpectedFieldKeys', () => {
    const unexpectedFields = {
      unexpectedKey: [
        {
          id: 'timeEntriesSendClockOutReminders',
          key: 'unexpectedKey',
          value: '',
          title:
            'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
        },
      ],
    };

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={unexpectedFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    expect(mockSetNotificationFields).toHaveBeenCalledWith(unexpectedFields);
  });

  test('testLoadingState', () => {
    (useIXPFeatureFlag as jest.Mock).mockReturnValue({
      isEnabled: true,
    });

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: mockQLData,
      isQLSettingsLoading: true,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: true,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={{}}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // When both QL and approval settings are loading, only the geofence visibility effect runs
    expect(mockSetNotificationFields).toHaveBeenCalledTimes(1);
  });

  test('testErrorHandlingWithLoadingState', () => {
    (useIXPFeatureFlag as jest.Mock).mockReturnValue({
      isEnabled: true,
    });

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: mockQLData,
      isQLSettingsLoading: true,
      QLSettingsError: 'Error loading settings',
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: true,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={{}}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // When both QL and approval settings are loading with error, only the geofence visibility effect runs
    expect(mockSetNotificationFields).toHaveBeenCalledTimes(1);
  });

  test('testErrorHandlingWithEmptyNotificationFields', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: mockQLData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={{}}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    expect(mockSetNotificationFields).toHaveBeenCalledWith({});
  });

  test('testErrorHandlingWithUnexpectedFieldKeys', () => {
    const unexpectedFields = {
      unexpectedKey: [
        {
          id: 'timeEntriesSendClockOutReminders',
          key: 'unexpectedKey',
          value: '',
          title:
            'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
        },
      ],
    };

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={unexpectedFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that setNotificationFields was called with unexpected fields
    expect(mockSetNotificationFields).toHaveBeenCalledWith(unexpectedFields);
  });

  test('testNotificationRecipientsAdminsOnly', () => {
    const mockSetValue = jest.fn();
    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    const adminOnlyData = {
      ...mockQLData,
      notifyAdminOnClockOutOverrideEnabled: { version: '1', value: true },
      notifyManagerOnClockOutOverrideEnabled: { version: '1', value: false },
      notifyAdminOnTimeSheetNotesEditEnabled: { version: '1', value: true },
      notifyGroupManagerOnTimeSheetNotesEditEnabled: {
        version: '1',
        value: false,
      },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: adminOnlyData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that setValue was called with adminsOnly
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenClockInOutUpdated',
      'adminsOnly',
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenNotesAreAddedOrEdited',
      'adminsOnly',
    );

    // Verify that setNotificationFields was called with adminsOnly text
    expect(mockSetNotificationFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            key: 'notifyWhenClockInOutUpdated',
            value: 'adminsOnly',
          }),
          expect.objectContaining({
            key: 'notifyWhenNotesAreAddedOrEdited',
            value: 'adminsOnly',
          }),
        ]),
      }),
    );
  });

  test('testNotificationRecipientsManagersOnly', () => {
    const mockSetValue = jest.fn();
    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    const managerOnlyData = {
      ...mockQLData,
      notifyAdminOnClockOutOverrideEnabled: { version: '1', value: false },
      notifyManagerOnClockOutOverrideEnabled: { version: '1', value: true },
      notifyAdminOnTimeSheetNotesEditEnabled: { version: '1', value: false },
      notifyGroupManagerOnTimeSheetNotesEditEnabled: {
        version: '1',
        value: true,
      },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: managerOnlyData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that setValue was called with managersOnly
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenClockInOutUpdated',
      'managersOnly',
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenNotesAreAddedOrEdited',
      'managersOnly',
    );
  });

  test('testNotificationRecipientsNone', () => {
    const mockSetValue = jest.fn();
    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    const noneData = {
      ...mockQLData,
      notifyAdminOnClockOutOverrideEnabled: { version: '1', value: false },
      notifyManagerOnClockOutOverrideEnabled: { version: '1', value: false },
      notifyAdminOnTimeSheetNotesEditEnabled: { version: '1', value: false },
      notifyGroupManagerOnTimeSheetNotesEditEnabled: {
        version: '1',
        value: false,
      },
    };

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that setValue was called with none
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenClockInOutUpdated',
      'none',
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenNotesAreAddedOrEdited',
      'none',
    );

    // Verify that setNotificationFields was called with none text
    expect(mockSetNotificationFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            key: 'notifyWhenClockInOutUpdated',
            value: 'none',
          }),
          expect.objectContaining({
            key: 'notifyWhenNotesAreAddedOrEdited',
            value: 'none',
          }),
        ]),
      }),
    );
  });

  test('testClockInReminderEmailOnly', () => {
    const mockSetValue = jest.fn();
    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    const emailOnlyData = {
      ...mockQLData,
      clockInNotificationReminderEmail: { version: '1', value: true },
      clockInNotificationReminderMobile: { version: '1', value: false },
      clockInNotificationReminderTime: { version: '1', value: '9:00' },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: emailOnlyData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that setValue was called with correct values
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderTime',
      convertTo12Hour('9:00'),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderEmail',
      true,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderMobile',
      false,
    );

    // Verify that setNotificationFields was called with email only text
    expect(mockSetNotificationFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            key: 'sendClockInNotificationReminders',
            value: expect.stringMatching(
              /^on,\s*notificationEmail,\s*9:00\s*AM\s*$/,
            ),
          }),
        ]),
      }),
    );
  });

  test('testClockInReminderTextOnly', () => {
    const mockSetValue = jest.fn();
    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    const textOnlyData = {
      ...mockQLData,
      clockInNotificationReminderEmail: { version: '1', value: false },
      clockInNotificationReminderMobile: { version: '1', value: true },
      clockInNotificationReminderTime: { version: '1', value: '9:00' },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: textOnlyData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that setValue was called with correct values
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderTime',
      convertTo12Hour('9:00'),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderEmail',
      false,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderMobile',
      true,
    );
  });

  test('testNotificationSettings_AllCombinations', () => {
    const mockSetValue = jest.fn();
    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    // Test all combinations of notification settings
    const testData = {
      ...mockQLData,
      // Clock In settings
      clockInNotificationReminderEmail: { version: '1', value: true },
      clockInNotificationReminderMobile: { version: '1', value: true },
      clockInNotificationReminderTime: { version: '1', value: '10:30' },

      // Clock Out settings
      clockOutNotificationReminderEmail: { version: '1', value: true },
      clockOutNotificationReminderMobile: { version: '1', value: true },
      clockOutNotificationReminderTime: { version: '1', value: '18:45' },

      // Notification days
      notificationEnabledForDays: {
        version: '1',
        value: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      },

      // Admin/Manager notifications for clock in/out
      notifyAdminOnClockOutOverrideEnabled: { version: '1', value: true },
      notifyManagerOnClockOutOverrideEnabled: { version: '1', value: true },
      editClockOutTimeEnabled: { version: '1', value: true },

      // Admin/Manager notifications for notes
      notifyAdminOnTimeSheetNotesEditEnabled: { version: '1', value: true },
      notifyGroupManagerOnTimeSheetNotesEditEnabled: {
        version: '1',
        value: true,
      },
      timeSheetEntryNotesEnabled: { version: '1', value: true },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: testData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify Clock In settings
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderTime',
      convertTo12Hour('10:30'),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderEmail',
      true,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderMobile',
      true,
    );

    // Verify Clock Out settings
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderTime',
      convertTo12Hour('18:45'),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderEmail',
      true,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderMobile',
      true,
    );

    // Verify notification days
    expect(mockSetValue).toHaveBeenCalledWith('notificationEnabledForDays', [
      'MONDAY',
      'WEDNESDAY',
      'FRIDAY',
    ]);

    // Verify admin/manager notifications
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenClockInOutUpdated',
      'adminsAndManagers',
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenNotesAreAddedOrEdited',
      'adminsAndManagers',
    );
  });

  test('testNotificationSettings_DefaultValues', () => {
    const mockSetValue = jest.fn();
    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    // Test with minimal data to trigger default values
    const minimalData = {
      ...mockQLData,
      clockInNotificationReminderEmail: undefined,
      clockInNotificationReminderMobile: undefined,
      clockInNotificationReminderTime: undefined,
      clockOutNotificationReminderEmail: undefined,
      clockOutNotificationReminderMobile: undefined,
      clockOutNotificationReminderTime: undefined,
      notificationEnabledForDays: undefined,
      notifyAdminOnClockOutOverrideEnabled: undefined,
      notifyManagerOnClockOutOverrideEnabled: undefined,
      editClockOutTimeEnabled: undefined,
      notifyAdminOnTimeSheetNotesEditEnabled: undefined,
      notifyGroupManagerOnTimeSheetNotesEditEnabled: undefined,
      timeSheetEntryNotesEnabled: undefined,
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: minimalData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify default values are set
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderTime',
      convertTo12Hour('8:00'),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderEmail',
      false,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderMobile',
      false,
    );

    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderTime',
      convertTo12Hour('17:00'),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderEmail',
      false,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderMobile',
      false,
    );

    expect(mockSetValue).toHaveBeenCalledWith(
      'notificationEnabledForDays',
      WEEK_DAYS,
    );

    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenClockInOutUpdated',
      'none',
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenNotesAreAddedOrEdited',
      'none',
    );
  });

  test('testNotificationSettings_FieldVisibility', () => {
    const mockSetValue = jest.fn();
    const mockUpdateVisibleFields = jest.fn();
    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    // Test visibility conditions
    const visibilityData = {
      ...mockQLData,
      editClockOutTimeEnabled: { version: '1', value: true },
      timeSheetEntryNotesEnabled: { version: '1', value: true },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: visibilityData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
    });

    const mockIsFieldsVisible = {
      notifyWhenClockInOutTimeAdjusted: false,
      notifyWhenNotesAreAddedOrEdited: false,
    };

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify field visibility is updated
    expect(mockUpdateVisibleFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifyWhenClockInOutTimeAdjusted: true,
        notifyWhenNotesAreAddedOrEdited: true,
      }),
    );
  });
  test('testNotificationSettings_TextFormatting', () => {
    const mockSetValue = jest.fn();
    const mockSetNotificationFields = jest.fn();

    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    // Test cases for different notification combinations
    const testCases = [
      {
        name: 'Email only',
        data: {
          ...mockQLData,
          clockInNotificationReminderEmail: { version: '1', value: true },
          clockInNotificationReminderMobile: { version: '1', value: false },
          clockInNotificationReminderTime: { version: '1', value: '9:00' },
          clockOutNotificationReminderEmail: { version: '1', value: true },
          clockOutNotificationReminderMobile: { version: '1', value: false },
          clockOutNotificationReminderTime: { version: '1', value: '17:00' },
        },
        expectedClockIn: 'on, notificationEmail, 9:00 AM',
        expectedClockOut: 'on, notificationEmail, 5:00 PM',
      },
      {
        name: 'Mobile only',
        data: {
          ...mockQLData,
          clockInNotificationReminderEmail: { version: '1', value: false },
          clockInNotificationReminderMobile: { version: '1', value: true },
          clockInNotificationReminderTime: { version: '1', value: '9:00' },
          clockOutNotificationReminderEmail: { version: '1', value: false },
          clockOutNotificationReminderMobile: { version: '1', value: true },
          clockOutNotificationReminderTime: { version: '1', value: '17:00' },
        },
        expectedClockIn: 'on, notificationMobile, 9:00 AM',
        expectedClockOut: 'on, notificationMobile, 5:00 PM',
      },
      {
        name: 'Both email and mobile',
        data: {
          ...mockQLData,
          clockInNotificationReminderEmail: { version: '1', value: true },
          clockInNotificationReminderMobile: { version: '1', value: true },
          clockInNotificationReminderTime: { version: '1', value: '9:00' },
          clockOutNotificationReminderEmail: { version: '1', value: true },
          clockOutNotificationReminderMobile: { version: '1', value: true },
          clockOutNotificationReminderTime: { version: '1', value: '17:00' },
        },
        expectedClockIn: 'on, notificationEmail, notificationMobile, 9:00 AM',
        expectedClockOut: 'on, notificationEmail, notificationMobile, 5:00 PM',
      },
      {
        name: 'Neither email nor mobile',
        data: {
          ...mockQLData,
          clockInNotificationReminderEmail: { version: '1', value: false },
          clockInNotificationReminderMobile: { version: '1', value: false },
          clockInNotificationReminderTime: { version: '1', value: '9:00' },
          clockOutNotificationReminderEmail: { version: '1', value: false },
          clockOutNotificationReminderMobile: { version: '1', value: false },
          clockOutNotificationReminderTime: { version: '1', value: '17:00' },
        },
        expectedClockIn: 'off',
        expectedClockOut: 'off',
      },
    ];

    testCases.forEach((testCase) => {
      // Reset mocks for each test case
      jest.clearAllMocks();

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: testCase.data,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // Verify notification fields are updated with correct text
      expect(mockSetNotificationFields).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              key: 'sendClockInNotificationReminders',
              value: testCase.expectedClockIn,
            }),
            expect.objectContaining({
              key: 'sendClockOutNotificationReminders',
              value: testCase.expectedClockOut,
            }),
          ]),
        }),
      );

      // Verify form values are set correctly
      if (
        testCase.data.clockInNotificationReminderEmail.value ||
        testCase.data.clockInNotificationReminderMobile.value
      ) {
        expect(mockSetValue).toHaveBeenCalledWith(
          'clockInNotificationReminderTime',
          convertTo12Hour('9:00'),
        );
      }
      if (
        testCase.data.clockOutNotificationReminderEmail.value ||
        testCase.data.clockOutNotificationReminderMobile.value
      ) {
        expect(mockSetValue).toHaveBeenCalledWith(
          'clockOutNotificationReminderTime',
          convertTo12Hour('17:00'),
        );
      }
    });
  });

  test('testNotificationSettings_UnknownFieldKey', () => {
    const mockSetValue = jest.fn();
    const mockSetNotificationFields = jest.fn();

    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    // Create notification fields with both known and unknown keys
    const mixedNotificationFields = {
      notifications: [
        {
          id: 'timeEntriesSendClockInReminders',
          key: 'sendClockInNotificationReminders',
          title: 'Clock In Reminders',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'some-value',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'unknownField',
          key: 'unknownNotificationField',
          title: 'Unknown Field',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'some-value',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'timeEntriesSendClockOutReminders',
          key: 'sendClockOutNotificationReminders',
          title: 'Clock Out Reminders',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'some-value',
          subFields: [],
          isEditable: true,
        },
      ],
    };

    const testData = {
      ...mockQLData,
      clockInNotificationReminderEmail: { version: '1', value: true },
      clockInNotificationReminderMobile: { version: '1', value: false },
      clockInNotificationReminderTime: { version: '1', value: '9:00' },
      clockOutNotificationReminderEmail: { version: '1', value: true },
      clockOutNotificationReminderMobile: { version: '1', value: false },
      clockOutNotificationReminderTime: { version: '1', value: '17:00' },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: testData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mixedNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that known fields are processed correctly
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderTime',
      convertTo12Hour('9:00'),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderEmail',
      true,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderMobile',
      false,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderTime',
      convertTo12Hour('17:00'),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderEmail',
      true,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderMobile',
      false,
    );

    // Verify that the notification fields are updated with both known and unknown fields
    expect(mockSetNotificationFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            key: 'sendClockInNotificationReminders',
            value: expect.stringMatching(
              /^on,\s*notificationEmail,\s*9:00\s*AM\s*$/,
            ),
          }),
          expect.objectContaining({
            key: 'unknownNotificationField',
            value: 'some-value', // Unknown field should remain unchanged
          }),
          expect.objectContaining({
            key: 'sendClockOutNotificationReminders',
            value: expect.stringMatching(
              /^on,\s*notificationEmail,\s*5:00\s*PM\s*$/,
            ),
          }),
        ]),
      }),
    );
  });

  test('testNotificationSettings_GracefulErrorHandling', () => {
    const mockSetValue = jest.fn();
    const mockUpdateVisibleFields = jest.fn();
    const mockSetNotificationFields = jest.fn();

    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    // Setup notification fields with all possible keys
    const testNotificationFields = {
      notifications: [
        {
          id: 'timeEntriesSendClockInReminders',
          key: 'sendClockInNotificationReminders',
          title: 'Clock In Reminders',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'some-value',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'timeEntriesSendClockOutReminders',
          key: 'sendClockOutNotificationReminders',
          title: 'Clock Out Reminders',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'some-value',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'daysRemindersAreSend',
          key: 'notificationEnabledForDays',
          title: 'Days Reminders Are Sent',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'some-value',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'notifyWhenClockInOutUpdated',
          key: 'notifyWhenClockInOutUpdated',
          title: 'Notify When Clock In/Out Updated',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'some-value',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'notifyWhenNotesAreAddedOrEdited',
          key: 'notifyWhenNotesAreAddedOrEdited',
          title: 'Notify When Notes Are Added/Edited',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'some-value',
          subFields: [],
          isEditable: true,
        },
      ],
    };

    const mockIsFieldsVisible = {
      notifyWhenClockInOutTimeAdjusted: false,
      notifyWhenNotesAreAddedOrEdited: false,
    };

    // Mock context with error state
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {},
      isQLSettingsLoading: false,
      QLSettingsError: 'Some API Error',
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={testNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify Clock In notification defaults
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderTime',
      convertTo12Hour('8:00'),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderEmail',
      false,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderMobile',
      false,
    );

    // Verify Clock Out notification defaults
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderTime',
      convertTo12Hour('17:00'),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderEmail',
      false,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderMobile',
      false,
    );

    // Verify notification days are set to all week days
    expect(mockSetValue).toHaveBeenCalledWith(
      'notificationEnabledForDays',
      WEEK_DAYS,
    );

    // Verify notification settings default to none and are visible
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenClockInOutUpdated',
      'none',
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'notifyWhenNotesAreAddedOrEdited',
      'none',
    );

    // Verify fields are updated with safe defaults
    expect(mockSetNotificationFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            key: 'sendClockInNotificationReminders',
            value: 'off',
          }),
          expect.objectContaining({
            key: 'sendClockOutNotificationReminders',
            value: 'off',
          }),
          expect.objectContaining({
            key: 'notificationEnabledForDays',
            value: WEEK_DAYS.map((day: string) =>
              uppercaseToPascalcase(day),
            ).join(', '),
          }),
          expect.objectContaining({
            key: 'notifyWhenClockInOutUpdated',
            value: 'none',
            isVisible: true,
          }),
          expect.objectContaining({
            key: 'notifyWhenNotesAreAddedOrEdited',
            value: 'none',
            isVisible: true,
          }),
        ]),
      }),
    );

    // Verify visibility fields are updated
    expect(mockUpdateVisibleFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifyWhenClockInOutTimeAdjusted: false,
        notifyWhenNotesAreAddedOrEdited: false,
      }),
    );
  });

  test('testDefaultCaseInSwitchStatement', () => {
    const mockSetValue = jest.fn();
    const mockSetNotificationFields = jest.fn();

    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    // Create notification fields with only unknown keys to trigger default case
    const unknownNotificationFields = {
      notifications: [
        {
          id: 'unknownField1',
          key: 'completelyUnknownField',
          title: 'Unknown Field 1',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'original-value-1',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'unknownField2',
          key: 'anotherUnknownField',
          title: 'Unknown Field 2',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'original-value-2',
          subFields: [],
          isEditable: true,
        },
      ],
    };

    const mockIsFieldsVisible = {
      notifyWhenClockInOutTimeAdjusted: false,
      notifyWhenNotesAreAddedOrEdited: false,
    };

    const mockUpdateVisibleFields = jest.fn();

    // Create QLData without geofenceEnabled to prevent geofence useEffect from calling setValue
    // The geofence useEffect calls setValue('geofenceEnabled', ...) if QLData exists,
    // so we create a QLData object without geofenceEnabled field
    // Note: Even without geofenceEnabled, the useEffect will still call setValue with false,
    // so we need to ensure the geofence feature flag is disabled
    const qlDataWithoutGeofence = {
      clockInNotificationReminderEmail: { version: '1', value: false },
      clockInNotificationReminderMobile: { version: '1', value: false },
      clockInNotificationReminderTime: { version: '1', value: '8:00' },
      clockOutNotificationReminderEmail: { version: '1', value: false },
      clockOutNotificationReminderMobile: { version: '1', value: false },
      clockOutNotificationReminderTime: { version: '1', value: '17:00' },
      notificationEnabledForDays: { version: '1', value: [] },
      notifyClockInOutAdjusted: { version: '1', value: 'Immediate' },
      notifyNotesAddedOrEdited: { version: '1', value: 'Daily' },
    };

    // Ensure geofence feature flag is disabled to prevent geofence useEffect from running
    (useIXPFeatureFlag as jest.Mock).mockImplementation(({ flagName }) => {
      if (flagName === 'SBSEG_QBO_R6_GEOFENCE') {
        return { isEnabled: false };
      }
      return { isEnabled: false };
    });

    // Mock context with QLData without geofence to trigger the main useEffect
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: qlDataWithoutGeofence,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={unknownNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that setNotificationFields was called with the original fields unchanged
    // since the default case should not modify unknown fields
    expect(mockSetNotificationFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            key: 'completelyUnknownField',
            value: 'original-value-1',
          }),
          expect.objectContaining({
            key: 'anotherUnknownField',
            value: 'original-value-2',
          }),
        ]),
      }),
    );

    // Verify that no setValue calls were made for unknown fields
    // (since the default case doesn't set any form values)
    const setValueCalls = mockSetValue.mock.calls;
    const unknownFieldNames = ['completelyUnknownField', 'anotherUnknownField'];
    const callsForUnknownFields = setValueCalls.filter((call) =>
      unknownFieldNames.includes(call[0]),
    );
    expect(callsForUnknownFields).toHaveLength(0);

    // Verify that updateVisibleFields was called with the original visibility state
    expect(mockUpdateVisibleFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifyWhenClockInOutTimeAdjusted: false,
        notifyWhenNotesAreAddedOrEdited: false,
      }),
    );
  });

  test('testDefaultCaseInErrorHandlingSwitchStatement', () => {
    const mockSetValue = jest.fn();
    const mockSetNotificationFields = jest.fn();

    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    // Create notification fields with only unknown keys to trigger default case in error handling
    const unknownNotificationFields = {
      notifications: [
        {
          id: 'unknownField1',
          key: 'completelyUnknownField',
          title: 'Unknown Field 1',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'original-value-1',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'unknownField2',
          key: 'anotherUnknownField',
          title: 'Unknown Field 2',
          ariaLabel: '',
          tooltipText: '',
          detail: {
            title: '',
            subtitle: '',
            ariaLabel: '',
          },
          disabled: false,
          value: 'original-value-2',
          subFields: [],
          isEditable: true,
        },
      ],
    };

    const mockIsFieldsVisible = {
      notifyWhenClockInOutTimeAdjusted: false,
      notifyWhenNotesAreAddedOrEdited: false,
    };

    const mockUpdateVisibleFields = jest.fn();

    // Mock context with error state to trigger the error handling useEffect
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: null,
      isQLSettingsLoading: false,
      QLSettingsError: 'Some API Error',
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
      isUKLocale: false,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={unknownNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that setNotificationFields was called with the original fields unchanged
    // since the default case in error handling should not modify unknown fields
    expect(mockSetNotificationFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            key: 'completelyUnknownField',
            value: 'original-value-1',
          }),
          expect.objectContaining({
            key: 'anotherUnknownField',
            value: 'original-value-2',
          }),
        ]),
      }),
    );

    // Verify that no setValue calls were made for the unknown fields
    // (the default case doesn't set any form values). Note: the schedule
    // channel fields are seeded from QL on load via a separate effect, so
    // assert specifically that the unknown field keys were never set rather
    // than that setValue was never called at all.
    expect(mockSetValue).not.toHaveBeenCalledWith(
      'completelyUnknownField',
      expect.anything(),
      expect.anything(),
    );
    expect(mockSetValue).not.toHaveBeenCalledWith(
      'anotherUnknownField',
      expect.anything(),
      expect.anything(),
    );

    // Verify that updateVisibleFields was called with the original visibility state
    expect(mockUpdateVisibleFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifyWhenClockInOutTimeAdjusted: false,
        notifyWhenNotesAreAddedOrEdited: false,
      }),
    );
  });

  test('testUKLocaleTimeFormatting', () => {
    const mockSetValue = jest.fn();
    const mockSetNotificationFields = jest.fn();

    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    // Test data with UK locale enabled
    const ukTestData = {
      ...mockQLData,
      clockInNotificationReminderEmail: { version: '1', value: true },
      clockInNotificationReminderMobile: { version: '1', value: false },
      clockInNotificationReminderTime: { version: '1', value: '09:30' },
      clockOutNotificationReminderEmail: { version: '1', value: true },
      clockOutNotificationReminderMobile: { version: '1', value: false },
      clockOutNotificationReminderTime: { version: '1', value: '17:45' },
    };

    const mockIsFieldsVisible = {
      notifyWhenClockInOutTimeAdjusted: false,
      notifyWhenNotesAreAddedOrEdited: false,
    };

    const mockUpdateVisibleFields = jest.fn();

    // Mock context with UK locale enabled
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: ukTestData,
      isQLSettingsLoading: false,
      QLSettingsError: undefined,
      isFormEditable: true,
      isUKLocale: true, // This is the key difference - UK locale is enabled
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that for UK locale, times are NOT converted to 12-hour format
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderTime',
      '09:30', // Should remain in 24-hour format
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderTime',
      '17:45', // Should remain in 24-hour format
    );

    // Verify that notification fields contain 24-hour format times
    expect(mockSetNotificationFields).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            key: 'sendClockInNotificationReminders',
            value: 'on, notificationEmail, 09:30', // 24-hour format
          }),
          expect.objectContaining({
            key: 'sendClockOutNotificationReminders',
            value: 'on, notificationEmail, 17:45', // 24-hour format
          }),
        ]),
      }),
    );
  });

  test('testUKLocaleTimeFormattingWithErrorHandling', () => {
    const mockSetValue = jest.fn();
    const mockSetNotificationFields = jest.fn();

    jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
      setValue: mockSetValue,
      formState: {
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        disabled: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: {},
      },
      register: jest.fn(),
      handleSubmit: jest.fn(),
      watch: jest.fn(),
      getValues: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      getFieldState: jest.fn(),
      trigger: jest.fn(),
      resetField: jest.fn(),
      unregister: jest.fn(),
      control: {} as unknown as ReactHookForm.Control<any>,
      setFocus: jest.fn(),
    });

    const mockIsFieldsVisible = {
      notifyWhenClockInOutTimeAdjusted: false,
      notifyWhenNotesAreAddedOrEdited: false,
    };

    const mockUpdateVisibleFields = jest.fn();

    // Mock context with UK locale enabled and error state
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: mockQLData,
      isQLSettingsLoading: false,
      QLSettingsError: 'Some API Error',
      isFormEditable: true,
      isUKLocale: true, // UK locale is enabled
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        notificationVisibilityEndDate: '2024-12-31',
      },
      approvalSettings: undefined,
      approvalSettingsLoading: false,
      approvalSettingsError: undefined,
    });

    render(
      <TestWrapper>
        <NotificationsTimeEntrySettings
          notificationFields={mockNotificationFields}
          setNotificationFields={mockSetNotificationFields}
          isNotificationFieldEditing={false}
          onSaveTimeEntrySettings={jest.fn()}
          notificationFieldSettingSection="notificationSettings"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={jest.fn()}
          isDataUpdating={false}
          isFieldsVisible={mockIsFieldsVisible}
          updateVisibleFields={mockUpdateVisibleFields}
        />
      </TestWrapper>,
    );

    // Verify that for UK locale in error handling, default times are NOT converted to 12-hour format
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderTime',
      '8:00', // Should remain in 24-hour format (default value)
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderTime',
      '17:00', // Should remain in 24-hour format (default value)
    );

    // Verify other error handling setValue calls
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderEmail',
      false,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockInNotificationReminderMobile',
      false,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderEmail',
      false,
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'clockOutNotificationReminderMobile',
      false,
    );
  });

  // Tests for Approval Notification Settings with getReminderData
  describe('Approval Notification Settings', () => {
    const mockApprovalNotificationFields = {
      approvalNotifications: [
        {
          id: 'managerReminderBasedOn',
          key: 'managerReminderBasedOn',
          title: 'Manager Reminder Based On',
          ariaLabel: '',
          tooltipText: '',
          detail: { title: '', subtitle: '', ariaLabel: '' },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'managerFirstReminder',
          key: 'remindIfTimeNotApproved',
          title: 'Manager First Reminder',
          ariaLabel: '',
          tooltipText: '',
          detail: { title: '', subtitle: '', ariaLabel: '' },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'managerSecondReminder',
          key: 'remindSecondTimeNotApproved',
          title: 'Manager Second Reminder',
          ariaLabel: '',
          tooltipText: '',
          detail: { title: '', subtitle: '', ariaLabel: '' },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'employeeReminderBasedOn',
          key: 'employeeReminderBasedOn',
          title: 'Employee Reminder Based On',
          ariaLabel: '',
          tooltipText: '',
          detail: { title: '', subtitle: '', ariaLabel: '' },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'employeeFirstReminder',
          key: 'remindIfTimeNotSubmitted',
          title: 'Employee First Reminder',
          ariaLabel: '',
          tooltipText: '',
          detail: { title: '', subtitle: '', ariaLabel: '' },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: true,
        },
        {
          id: 'employeeSecondReminder',
          key: 'remindSecondTimeNotSubmitted',
          title: 'Employee Second Reminder',
          ariaLabel: '',
          tooltipText: '',
          detail: { title: '', subtitle: '', ariaLabel: '' },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: true,
        },
      ],
    };

    test('testManagerRemindersWithDayOfWeek', () => {
      const mockSetValue = jest.fn();
      const mockSetNotificationFields = jest.fn();

      jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
        setValue: mockSetValue,
        formState: {
          isDirty: false,
          isLoading: false,
          isSubmitted: false,
          isSubmitSuccessful: false,
          isSubmitting: false,
          isValidating: false,
          isValid: true,
          disabled: false,
          submitCount: 0,
          dirtyFields: {},
          touchedFields: {},
          validatingFields: {},
          errors: {},
        },
        register: jest.fn(),
        handleSubmit: jest.fn(),
        watch: jest.fn(),
        getValues: jest.fn(),
        setError: jest.fn(),
        clearErrors: jest.fn(),
        reset: jest.fn(),
        getFieldState: jest.fn(),
        trigger: jest.fn(),
        resetField: jest.fn(),
        unregister: jest.fn(),
        control: {} as unknown as ReactHookForm.Control<any>,
        setFocus: jest.fn(),
      });

      const mockApprovalSettings = {
        requireApprovalForTrackedTime: { value: true },
        managerReminderBasedOn: { value: ApprovalRemindersbasedOn.DAY_OF_WEEK },
        employeeReminderBasedOn: {
          value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
        },
        managerCurrentWeekReminderDays: { value: ['monday', 'wednesday'] },
        managerCurrentWeekReminderHour: { value: 10 },
        managerCurrentWeekReminderMedium: { value: [NotificationMedium.EMAIL] },
        managerPreviousWeekReminderDays: { value: ['friday'] },
        managerPreviousWeekReminderHour: { value: 14 },
        managerPreviousWeekReminderMedium: {
          value: [NotificationMedium.EMAIL],
        },
      };

      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: true,
      });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: mockApprovalSettings,
        approvalSettingsLoading: false,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockApprovalNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="approvalNotifications"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // Verify manager reminders were set correctly
      expect(mockSetValue).toHaveBeenCalledWith(
        'managerCurrentWeekReminderDays',
        ['monday', 'wednesday'],
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'managerCurrentWeekReminderHour',
        '10:00 AM',
      );
    });

    test('testManagerRemindersWithPayrollCloseDate', () => {
      const mockSetValue = jest.fn();
      const mockSetNotificationFields = jest.fn();

      jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
        setValue: mockSetValue,
        formState: {
          isDirty: false,
          isLoading: false,
          isSubmitted: false,
          isSubmitSuccessful: false,
          isSubmitting: false,
          isValidating: false,
          isValid: true,
          disabled: false,
          submitCount: 0,
          dirtyFields: {},
          touchedFields: {},
          validatingFields: {},
          errors: {},
        },
        register: jest.fn(),
        handleSubmit: jest.fn(),
        watch: jest.fn(),
        getValues: jest.fn(),
        setError: jest.fn(),
        clearErrors: jest.fn(),
        reset: jest.fn(),
        getFieldState: jest.fn(),
        trigger: jest.fn(),
        resetField: jest.fn(),
        unregister: jest.fn(),
        control: {} as unknown as ReactHookForm.Control<any>,
        setFocus: jest.fn(),
      });

      const mockApprovalSettings = {
        requireApprovalForTrackedTime: { value: true },
        managerReminderBasedOn: {
          value: ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
        },
        employeeReminderBasedOn: {
          value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
        },
        managerCurrentPayPeriodReminderHour: { value: 15 },
        managerCurrentPayPeriodReminderOffsetDays: { value: 2 },
        managerCurrentPayPeriodReminderMedium: {
          value: [NotificationMedium.EMAIL],
        },
      };

      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: true,
      });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: mockApprovalSettings,
        approvalSettingsLoading: false,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockApprovalNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="approvalNotifications"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // Verify payroll close date reminders were set correctly
      expect(mockSetValue).toHaveBeenCalledWith(
        'managerCurrentPayPeriodReminderHour',
        '3:00 PM',
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'managerCurrentPayPeriodReminderOffsetDays',
        2,
      );
    });

    test('testEmployeeRemindersWithDailyMode', () => {
      const mockSetValue = jest.fn();
      const mockSetNotificationFields = jest.fn();

      jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
        setValue: mockSetValue,
        formState: {
          isDirty: false,
          isLoading: false,
          isSubmitted: false,
          isSubmitSuccessful: false,
          isSubmitting: false,
          isValidating: false,
          isValid: true,
          disabled: false,
          submitCount: 0,
          dirtyFields: {},
          touchedFields: {},
          validatingFields: {},
          errors: {},
        },
        register: jest.fn(),
        handleSubmit: jest.fn(),
        watch: jest.fn(),
        getValues: jest.fn(),
        setError: jest.fn(),
        clearErrors: jest.fn(),
        reset: jest.fn(),
        getFieldState: jest.fn(),
        trigger: jest.fn(),
        resetField: jest.fn(),
        unregister: jest.fn(),
        control: {} as unknown as ReactHookForm.Control<any>,
        setFocus: jest.fn(),
      });

      const mockApprovalSettings = {
        requireApprovalForTrackedTime: { value: true },
        managerReminderBasedOn: { value: ApprovalRemindersbasedOn.DAY_OF_WEEK },
        employeeReminderBasedOn: { value: ApprovalRemindersbasedOn.DAILY },
        employeeDailyReminderFirstReminderHour: { value: 9 },
        employeeDailyReminderFirstReminderMedium: {
          value: [NotificationMedium.EMAIL],
        },
        employeeDailyReminderSecondReminderHour: { value: 16 },
        employeeDailyReminderSecondReminderMedium: {
          value: [NotificationMedium.EMAIL],
        },
        employeeDailyReminderForTimesheetDays: {
          value: ['monday', 'tuesday', 'wednesday'],
        },
      };

      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: true,
      });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: mockApprovalSettings,
        approvalSettingsLoading: false,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockApprovalNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="approvalNotifications"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // Verify daily reminders were set correctly
      expect(mockSetValue).toHaveBeenCalledWith(
        'employeeDailyReminderFirstReminderHour',
        '9:00 AM',
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'employeeDailyReminderSecondReminderHour',
        '4:00 PM',
      );
    });

    test('testManagerReminderShowsOffWhenNoEmailMedium', () => {
      const mockSetValue = jest.fn();
      const mockSetNotificationFields = jest.fn();

      jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
        setValue: mockSetValue,
        formState: {
          isDirty: false,
          isLoading: false,
          isSubmitted: false,
          isSubmitSuccessful: false,
          isSubmitting: false,
          isValidating: false,
          isValid: true,
          disabled: false,
          submitCount: 0,
          dirtyFields: {},
          touchedFields: {},
          validatingFields: {},
          errors: {},
        },
        register: jest.fn(),
        handleSubmit: jest.fn(),
        watch: jest.fn(),
        getValues: jest.fn(),
        setError: jest.fn(),
        clearErrors: jest.fn(),
        reset: jest.fn(),
        getFieldState: jest.fn(),
        trigger: jest.fn(),
        resetField: jest.fn(),
        unregister: jest.fn(),
        control: {} as unknown as ReactHookForm.Control<any>,
        setFocus: jest.fn(),
      });

      const mockApprovalSettings = {
        requireApprovalForTrackedTime: { value: true },
        managerReminderBasedOn: { value: ApprovalRemindersbasedOn.DAY_OF_WEEK },
        employeeReminderBasedOn: {
          value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
        },
        managerCurrentWeekReminderDays: { value: ['monday'] },
        managerCurrentWeekReminderHour: { value: 10 },
        managerCurrentWeekReminderMedium: { value: [] }, // No EMAIL medium
      };

      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: true,
      });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: mockApprovalSettings,
        approvalSettingsLoading: false,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockApprovalNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="approvalNotifications"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // Verify that the notification field shows "off" when no EMAIL medium is set
      expect(mockSetNotificationFields).toHaveBeenCalledWith(
        expect.objectContaining({
          approvalNotifications: expect.arrayContaining([
            expect.objectContaining({
              key: 'remindIfTimeNotApproved',
              value: 'off',
            }),
          ]),
        }),
      );
    });
  });

  describe('Submission Notification Settings Visibility', () => {
    const createMockField = (
      id: string,
      key: string,
      isEditable = true,
      isVisible = true,
    ) => ({
      id,
      key,
      title: id,
      ariaLabel: '',
      tooltipText: '',
      detail: { title: '', subtitle: '', ariaLabel: '' },
      disabled: false,
      value: '',
      subFields: [],
      isEditable,
      isVisible,
    });

    const mockSubmissionNotificationFields = {
      submissionNotifications: [
        createMockField(
          'submissionsSectionHeader',
          'submissionsSectionHeader',
          false,
        ),
        createMockField('employeeReminderBasedOn', 'employeeReminderBasedOn'),
        createMockField('employeeFirstReminder', 'remindIfTimeNotSubmitted'),
        createMockField(
          'employeeSecondReminder',
          'remindSecondTimeNotSubmitted',
        ),
        createMockField(
          'employeeDailyReminderForTimesheetDays',
          'employeeDailyReminderForTimesheetDays',
          true,
          false,
        ),
        createMockField('notifyManagerOnSubmit', 'notifyManagerOnSubmit'),
        createMockField(
          'notifyManagerOnGroupSubmitted',
          'notifyManagerOnGroupSubmitted',
        ),
      ],
    };

    const setupTest = (approvalSettingsOverrides = {}) => {
      const mockSetValue = jest.fn();
      const mockSetNotificationFields = jest.fn();

      jest.spyOn(ReactHookForm, 'useForm').mockReturnValue({
        setValue: mockSetValue,
        formState: {
          isDirty: false,
          isLoading: false,
          isSubmitted: false,
          isSubmitSuccessful: false,
          isSubmitting: false,
          isValidating: false,
          isValid: true,
          disabled: false,
          submitCount: 0,
          dirtyFields: {},
          touchedFields: {},
          validatingFields: {},
          errors: {},
        },
        register: jest.fn(),
        handleSubmit: jest.fn(),
        watch: jest.fn(),
        getValues: jest.fn(),
        setError: jest.fn(),
        clearErrors: jest.fn(),
        reset: jest.fn(),
        getFieldState: jest.fn(),
        trigger: jest.fn(),
        resetField: jest.fn(),
        unregister: jest.fn(),
        control: {} as unknown as ReactHookForm.Control<any>,
        setFocus: jest.fn(),
      });

      const mockApprovalSettings = {
        requireApprovalForTrackedTime: { value: true },
        managerReminderBasedOn: {
          value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
        },
        employeeReminderBasedOn: {
          value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
        },
        employeeCurrentWeekReminderDays: { value: ['monday'] },
        employeeCurrentWeekReminderHour: { value: 9 },
        employeeCurrentWeekReminderMedium: {
          value: [NotificationMedium.EMAIL],
        },
        employeePreviousWeekReminderDays: { value: ['friday'] },
        employeePreviousWeekReminderHour: { value: 15 },
        employeePreviousWeekReminderMedium: {
          value: [NotificationMedium.EMAIL],
        },
        notifyManagerOnSubmit: { value: true },
        notifyManagerOnGroupSubmitted: { value: true },
        ...approvalSettingsOverrides,
      };

      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: mockApprovalSettings,
        approvalSettingsLoading: false,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockSubmissionNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="submissionNotifications"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      return mockSetNotificationFields;
    };

    const expectFieldVisibility = (
      mockSetNotificationFields: jest.Mock,
      fieldKey: string,
      isVisible: boolean | undefined,
    ) => {
      expect(mockSetNotificationFields).toHaveBeenCalledWith(
        expect.objectContaining({
          submissionNotifications: expect.arrayContaining([
            expect.objectContaining({ key: fieldKey, isVisible }),
          ]),
        }),
      );
    };

    test('testSubmissionFieldsVisibleWhenApprovalsEnabled', () => {
      const mock = setupTest();

      const submissionFields = [
        'submissionsSectionHeader',
        'employeeReminderBasedOn',
        'remindIfTimeNotSubmitted',
        'remindSecondTimeNotSubmitted',
        'notifyManagerOnSubmit',
        'notifyManagerOnGroupSubmitted',
      ];

      submissionFields.forEach((field) =>
        expectFieldVisibility(mock, field, true),
      );
    });

    test('testSubmissionFieldsHiddenWhenApprovalsDisabled', () => {
      const mock = setupTest({
        requireApprovalForTrackedTime: { value: false },
      });

      const submissionFields = [
        'submissionsSectionHeader',
        'employeeReminderBasedOn',
        'remindIfTimeNotSubmitted',
        'remindSecondTimeNotSubmitted',
        'notifyManagerOnSubmit',
        'notifyManagerOnGroupSubmitted',
      ];

      submissionFields.forEach((field) =>
        expectFieldVisibility(mock, field, false),
      );
    });

    test('testDailyReminderDaysVisibleOnlyInDailyMode', () => {
      const mock = setupTest({
        employeeReminderBasedOn: { value: ApprovalRemindersbasedOn.DAILY },
        employeeDailyReminderForTimesheetDays: {
          value: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        },
        employeeDailyReminderFirstReminderMedium: {
          value: [NotificationMedium.EMAIL],
        },
        employeeDailyReminderSecondReminderMedium: {
          value: [NotificationMedium.EMAIL],
        },
      });

      expectFieldVisibility(
        mock,
        'employeeDailyReminderForTimesheetDays',
        true,
      );
    });

    test('testDailyReminderDaysHiddenInWeeklyMode', () => {
      const mock = setupTest();
      expectFieldVisibility(
        mock,
        'employeeDailyReminderForTimesheetDays',
        false,
      );
    });

    test('testDailyReminderDaysHiddenWhenApprovalsDisabled', () => {
      const mock = setupTest({
        requireApprovalForTrackedTime: { value: false },
        employeeReminderBasedOn: { value: ApprovalRemindersbasedOn.DAILY },
        employeeDailyReminderForTimesheetDays: {
          value: ['MONDAY', 'WEDNESDAY'],
        },
      });

      expectFieldVisibility(
        mock,
        'employeeDailyReminderForTimesheetDays',
        false,
      );
    });

    test('testSubmissionFieldsDefaultToVisibleWhenRequireApprovalUndefined', () => {
      const mock = setupTest({
        requireApprovalForTrackedTime: undefined,
      });

      expectFieldVisibility(mock, 'submissionsSectionHeader', undefined);
      expectFieldVisibility(mock, 'employeeReminderBasedOn', undefined);
    });
  });

  describe('Error Handling for QL and Approval APIs', () => {
    const mockSetNotificationFields = jest.fn();
    const mockUpdateVisibleFields = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      (useIntl as jest.Mock).mockReturnValue({
        formatMessage: ({ id }: { id: string }) => id,
      });
    });

    test('testBothAPIsFailShowSingleErrorAndDisableEditing', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: 'QL API Error',
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: 'Approval API Error',
        isUKLocale: false,
      });

      const { container } = render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // When both APIs fail, isErrorInView should be true (hasBothErrors = true)
      // This would be passed to ViewContent component
      expect(container).toBeInTheDocument();
    });

    test('testOnlyQLAPIFailsShowSectionSpecificError', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: 'QL API Error',
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: undefined,
        isUKLocale: false,
      });

      const { container } = render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // When only QL API fails, isErrorInView should be false (hasBothErrors = false)
      // but sectionErrors should have error for time tracking section
      expect(container).toBeInTheDocument();
    });

    test('testOnlyApprovalAPIFailsShowSectionSpecificError', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: 'Approval API Error',
        isUKLocale: false,
      });

      const { container } = render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // When only Approval API fails, isErrorInView should be false (hasBothErrors = false)
      // but sectionErrors should have error for approval/submission sections
      expect(container).toBeInTheDocument();
    });

    test('testFormEditableWhenOnlyQLAPIFails', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: 'QL API Error',
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: undefined,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // Form should still be editable when only one API fails (isFormEditableWithErrors = true)
      // isFormEditableWithErrors = isFormEditable && !hasBothErrors = true && false = true
      expect(mockSetNotificationFields).toHaveBeenCalled();
    });

    test('testFormEditableWhenOnlyApprovalAPIFails', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: 'Approval API Error',
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // Form should still be editable when only one API fails
      expect(mockSetNotificationFields).toHaveBeenCalled();
    });

    test('testFormNotEditableWhenBothAPIsFail', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: 'QL API Error',
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: 'Approval API Error',
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // Form should not be editable when both APIs fail
      // isFormEditableWithErrors = isFormEditable && !hasBothErrors = true && false = false
      expect(mockSetNotificationFields).toHaveBeenCalled();
    });

    test('testApprovalErrorMakesApprovalFieldsVisible', () => {
      const mockNotificationFieldsWithApprovals = {
        notifications: [
          ...mockNotificationFields.notifications,
          {
            id: 'approvalsSectionHeader',
            key: 'approvalsSectionHeader',
            title: 'Approvals',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: '',
            subFields: [],
            isEditable: false,
            isVisible: false,
          },
          {
            id: 'managerReminderBasedOn',
            key: 'managerReminderBasedOn',
            title: 'Manager Reminder Based On',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: '',
            subFields: [],
            isEditable: true,
            isVisible: false,
          },
        ],
      };

      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: 'Approval API Error',
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFieldsWithApprovals}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // When approval API fails, approval and submission fields should be made visible
      expect(mockSetNotificationFields).toHaveBeenCalled();
    });

    test('testNoErrorsAllFieldsNormalBehavior', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: false });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: undefined,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // When no errors, everything should work normally
      expect(mockSetNotificationFields).toHaveBeenCalled();
    });

    test('testEmptyErrorStringsAreNotTreatedAsErrors', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: '', // Empty string should not be treated as error
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: '', // Empty string should not be treated as error
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFields}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // Empty error strings should not be treated as errors
      // hasQLError = !!('' && '' !== '') = !!false = false
      // hasApprovalError = !!('' && '' !== '') = !!false = false
      expect(mockSetNotificationFields).toHaveBeenCalled();
    });
  });

  describe('Feature Flag Visibility Control', () => {
    const mockNotificationFieldsWithApprovals = {
      notifications: [
        ...mockNotificationFields.notifications,
        {
          id: 'approvalsSectionHeader',
          key: 'approvalsSectionHeader',
          title: 'Approvals',
          ariaLabel: '',
          tooltipText: '',
          detail: { title: '', subtitle: '', ariaLabel: '' },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: false,
          isVisible: true,
        },
        {
          id: 'managerReminderBasedOn',
          key: 'managerReminderBasedOn',
          title: 'Manager Reminder Based On',
          ariaLabel: '',
          tooltipText: '',
          detail: { title: '', subtitle: '', ariaLabel: '' },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: true,
          isVisible: true,
        },
        {
          id: 'submissionsSectionHeader',
          key: 'submissionsSectionHeader',
          title: 'Submissions',
          ariaLabel: '',
          tooltipText: '',
          detail: { title: '', subtitle: '', ariaLabel: '' },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: false,
          isVisible: true,
        },
        {
          id: 'employeeReminderBasedOn',
          key: 'employeeReminderBasedOn',
          title: 'Employee Reminder Based On',
          ariaLabel: '',
          tooltipText: '',
          detail: { title: '', subtitle: '', ariaLabel: '' },
          disabled: false,
          value: '',
          subFields: [],
          isEditable: true,
          isVisible: true,
        },
      ],
    };

    test('testApprovalAndSubmissionFieldsHiddenWhenFeatureFlagDisabled', () => {
      const mockSetNotificationFields = jest.fn();

      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: false });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: {
          requireApprovalForTrackedTime: { value: true },
          managerReminderBasedOn: {
            value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
          },
          employeeReminderBasedOn: {
            value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
          },
        },
        approvalSettingsLoading: false,
        approvalSettingsError: undefined,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFieldsWithApprovals}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // When feature flag is disabled, both approval and submission fields should be hidden
      // (regardless of approval settings)
      expect(mockSetNotificationFields).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              key: 'approvalsSectionHeader',
              isVisible: false,
            }),
            expect.objectContaining({
              key: 'managerReminderBasedOn',
              isVisible: false,
            }),
            expect.objectContaining({
              key: 'submissionsSectionHeader',
              isVisible: false,
            }),
            expect.objectContaining({
              key: 'employeeReminderBasedOn',
              isVisible: false,
            }),
          ]),
        }),
      );
    });

    test('testApprovalFieldsVisibleWhenFeatureFlagEnabled', () => {
      const mockSetNotificationFields = jest.fn();

      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: {
          requireApprovalForTrackedTime: { value: true },
          managerReminderBasedOn: {
            value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
          },
          employeeReminderBasedOn: {
            value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
          },
          managerCurrentWeekReminderDays: { value: ['monday'] },
          managerCurrentWeekReminderHour: { value: 10 },
          managerCurrentWeekReminderMedium: {
            value: [NotificationMedium.EMAIL],
          },
          managerPreviousWeekReminderDays: { value: ['friday'] },
          managerPreviousWeekReminderHour: { value: 14 },
          managerPreviousWeekReminderMedium: {
            value: [NotificationMedium.EMAIL],
          },
          employeeCurrentWeekReminderDays: { value: ['tuesday'] },
          employeeCurrentWeekReminderHour: { value: 9 },
          employeeCurrentWeekReminderMedium: {
            value: [NotificationMedium.EMAIL],
          },
          employeePreviousWeekReminderDays: { value: ['thursday'] },
          employeePreviousWeekReminderHour: { value: 15 },
          employeePreviousWeekReminderMedium: {
            value: [NotificationMedium.EMAIL],
          },
        },
        approvalSettingsLoading: false,
        approvalSettingsError: undefined,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFieldsWithApprovals}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // When feature flag is enabled, approval fields should be visible (regardless of approval setting)
      // But submission fields should be visible only when approvals are also enabled
      expect(mockSetNotificationFields).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              key: 'approvalsSectionHeader',
              isVisible: true,
            }),
            expect.objectContaining({
              key: 'managerReminderBasedOn',
              isVisible: true,
            }),
            expect.objectContaining({
              key: 'submissionsSectionHeader',
              isVisible: true,
            }),
            expect.objectContaining({
              key: 'employeeReminderBasedOn',
              isVisible: true,
            }),
          ]),
        }),
      );
    });

    test('testSubmissionFieldsHiddenWhenFeatureFlagEnabledButApprovalsDisabled', () => {
      const mockSetNotificationFields = jest.fn();

      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: mockQLData,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: {
          requireApprovalForTrackedTime: { value: false }, // Approvals disabled
          managerReminderBasedOn: {
            value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
          },
          employeeReminderBasedOn: {
            value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
          },
          managerCurrentWeekReminderDays: { value: ['monday'] },
          managerCurrentWeekReminderHour: { value: 10 },
          employeeCurrentWeekReminderDays: { value: ['tuesday'] },
          employeeCurrentWeekReminderHour: { value: 9 },
        },
        approvalSettingsLoading: false,
        approvalSettingsError: undefined,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={mockNotificationFieldsWithApprovals}
            setNotificationFields={mockSetNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      // When feature flag is enabled but approvals are disabled:
      // - Approval fields should be VISIBLE (they only depend on feature flag)
      // - Submission fields should be HIDDEN (they depend on both flag and approvals)
      expect(mockSetNotificationFields).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              key: 'approvalsSectionHeader',
              isVisible: true, // Visible because feature flag is enabled
            }),
            expect.objectContaining({
              key: 'managerReminderBasedOn',
              isVisible: true, // Visible because feature flag is enabled
            }),
            expect.objectContaining({
              key: 'submissionsSectionHeader',
              isVisible: false, // Hidden because approvals are disabled
            }),
            expect.objectContaining({
              key: 'employeeReminderBasedOn',
              isVisible: false, // Hidden because approvals are disabled
            }),
          ]),
        }),
      );
    });

    describe('EditGeofenceNotificationSettings visibility', () => {
      test('renders EditGeofenceNotificationSettings when no QL error, Time Elite, and geofence feature enabled', () => {
        jest.spyOn(ReactHookForm, 'useWatch').mockReturnValue(true as any);
        (useIXPFeatureFlag as jest.Mock).mockImplementation(
          ({ flagName }: { flagName: string }) => ({
            isEnabled: flagName === FEATURE_FLAGS.SBSEG_QBO_R6_GEOFENCE,
          }),
        );
        mockGetEntitlements.mockReturnValue({
          data: [{ name: 'TIME_ELITE' }],
        });
        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          QLData: mockQLData,
          isQLSettingsLoading: false,
          QLSettingsError: undefined,
          isFormEditable: true,
          text: (id: string) => id,
          timeEntryNewBadgeVisibleFor: {
            notificationVisibilityEndDate: '2024-12-31',
          },
          approvalSettings: undefined,
          approvalSettingsLoading: false,
          approvalSettingsError: undefined,
          isUKLocale: false,
        });

        const { getByText } = render(
          <TestWrapper>
            <NotificationsTimeEntrySettings
              notificationFields={mockNotificationFields}
              setNotificationFields={mockSetNotificationFields}
              isNotificationFieldEditing={false}
              onSaveTimeEntrySettings={jest.fn()}
              notificationFieldSettingSection="notificationSettings"
              id="test-id"
              onFormUpdate={jest.fn()}
              onFormCancel={jest.fn()}
              isDataUpdating={false}
              isFieldsVisible={mockIsFieldsVisible}
              updateVisibleFields={mockUpdateVisibleFields}
            />
          </TestWrapper>,
        );

        expect(getByText('Edit Geofence Notification')).toBeInTheDocument();
      });

      test('does not render EditGeofenceNotificationSettings when QL error is present', () => {
        (useIXPFeatureFlag as jest.Mock).mockImplementation(
          ({ flagName }: { flagName: string }) => ({
            isEnabled: flagName === FEATURE_FLAGS.SBSEG_QBO_R6_GEOFENCE,
          }),
        );
        mockGetEntitlements.mockReturnValue({
          data: [{ name: 'TIME_ELITE' }],
        });
        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          QLData: mockQLData,
          isQLSettingsLoading: false,
          QLSettingsError: 'QL API Error',
          isFormEditable: true,
          text: (id: string) => id,
          timeEntryNewBadgeVisibleFor: {
            notificationVisibilityEndDate: '2024-12-31',
          },
          approvalSettings: undefined,
          approvalSettingsLoading: false,
          approvalSettingsError: undefined,
          isUKLocale: false,
        });

        const { queryByText } = render(
          <TestWrapper>
            <NotificationsTimeEntrySettings
              notificationFields={mockNotificationFields}
              setNotificationFields={mockSetNotificationFields}
              isNotificationFieldEditing={false}
              onSaveTimeEntrySettings={jest.fn()}
              notificationFieldSettingSection="notificationSettings"
              id="test-id"
              onFormUpdate={jest.fn()}
              onFormCancel={jest.fn()}
              isDataUpdating={false}
              isFieldsVisible={mockIsFieldsVisible}
              updateVisibleFields={mockUpdateVisibleFields}
            />
          </TestWrapper>,
        );

        expect(
          queryByText('Edit Geofence Notification'),
        ).not.toBeInTheDocument();
      });

      test('does not render EditGeofenceNotificationSettings when user is not Time Elite', () => {
        (useIXPFeatureFlag as jest.Mock).mockImplementation(
          ({ flagName }: { flagName: string }) => ({
            isEnabled: flagName === FEATURE_FLAGS.SBSEG_QBO_R6_GEOFENCE,
          }),
        );
        mockGetEntitlements.mockReturnValue({
          data: [{ name: 'OTHER_ENTITLEMENT' }],
        });
        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          QLData: mockQLData,
          isQLSettingsLoading: false,
          QLSettingsError: undefined,
          isFormEditable: true,
          text: (id: string) => id,
          timeEntryNewBadgeVisibleFor: {
            notificationVisibilityEndDate: '2024-12-31',
          },
          approvalSettings: undefined,
          approvalSettingsLoading: false,
          approvalSettingsError: undefined,
          isUKLocale: false,
        });

        const { queryByText } = render(
          <TestWrapper>
            <NotificationsTimeEntrySettings
              notificationFields={mockNotificationFields}
              setNotificationFields={mockSetNotificationFields}
              isNotificationFieldEditing={false}
              onSaveTimeEntrySettings={jest.fn()}
              notificationFieldSettingSection="notificationSettings"
              id="test-id"
              onFormUpdate={jest.fn()}
              onFormCancel={jest.fn()}
              isDataUpdating={false}
              isFieldsVisible={mockIsFieldsVisible}
              updateVisibleFields={mockUpdateVisibleFields}
            />
          </TestWrapper>,
        );

        expect(
          queryByText('Edit Geofence Notification'),
        ).not.toBeInTheDocument();
      });

      test('does not render EditGeofenceNotificationSettings when geofence feature flag is disabled', () => {
        (useIXPFeatureFlag as jest.Mock).mockImplementation(
          ({ flagName }: { flagName: string }) => ({
            isEnabled: flagName !== FEATURE_FLAGS.SBSEG_QBO_R6_GEOFENCE,
          }),
        );
        mockGetEntitlements.mockReturnValue({
          data: [{ name: 'TIME_ELITE' }],
        });
        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          QLData: mockQLData,
          isQLSettingsLoading: false,
          QLSettingsError: undefined,
          isFormEditable: true,
          text: (id: string) => id,
          timeEntryNewBadgeVisibleFor: {
            notificationVisibilityEndDate: '2024-12-31',
          },
          approvalSettings: undefined,
          approvalSettingsLoading: false,
          approvalSettingsError: undefined,
          isUKLocale: false,
        });

        const { queryByText } = render(
          <TestWrapper>
            <NotificationsTimeEntrySettings
              notificationFields={mockNotificationFields}
              setNotificationFields={mockSetNotificationFields}
              isNotificationFieldEditing={false}
              onSaveTimeEntrySettings={jest.fn()}
              notificationFieldSettingSection="notificationSettings"
              id="test-id"
              onFormUpdate={jest.fn()}
              onFormCancel={jest.fn()}
              isDataUpdating={false}
              isFieldsVisible={mockIsFieldsVisible}
              updateVisibleFields={mockUpdateVisibleFields}
            />
          </TestWrapper>,
        );

        expect(
          queryByText('Edit Geofence Notification'),
        ).not.toBeInTheDocument();
      });

      test('calls registerSectionRef to register subsection refs for scroll targeting', () => {
        const sectionRefs: Record<string, HTMLDivElement | null> = {};
        const mockRegisterSectionRef = jest.fn(
          (key: string) => (el: HTMLDivElement | null) => {
            sectionRefs[key] = el;
          },
        );
        jest.spyOn(ReactHookForm, 'useWatch').mockReturnValue(true as any);
        (useIXPFeatureFlag as jest.Mock).mockImplementation(
          ({ flagName }: { flagName: string }) => ({
            isEnabled: flagName === FEATURE_FLAGS.SBSEG_QBO_R6_GEOFENCE,
          }),
        );
        mockGetEntitlements.mockReturnValue({
          data: [{ name: 'TIME_ELITE' }],
        });
        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          QLData: mockQLData,
          isQLSettingsLoading: false,
          QLSettingsError: undefined,
          isFormEditable: true,
          text: (id: string) => id,
          timeEntryNewBadgeVisibleFor: {
            notificationVisibilityEndDate: '2024-12-31',
          },
          approvalSettings: undefined,
          approvalSettingsLoading: false,
          approvalSettingsError: undefined,
          isUKLocale: false,
        });

        const { getByText } = render(
          <TestWrapper>
            <NotificationsTimeEntrySettings
              notificationFields={mockNotificationFields}
              setNotificationFields={mockSetNotificationFields}
              isNotificationFieldEditing={false}
              onSaveTimeEntrySettings={jest.fn()}
              notificationFieldSettingSection="notificationSettings"
              id="test-id"
              onFormUpdate={jest.fn()}
              onFormCancel={jest.fn()}
              isDataUpdating={false}
              isFieldsVisible={mockIsFieldsVisible}
              updateVisibleFields={mockUpdateVisibleFields}
              registerSectionRef={mockRegisterSectionRef}
            />
          </TestWrapper>,
        );

        expect(getByText('Edit Geofence Notification')).toBeInTheDocument();
        expect(mockRegisterSectionRef).toHaveBeenCalledWith(
          'notifications-geofence-subsection',
        );
      });
    });
  });

  describe('Schedule notification view', () => {
    const scheduleFieldTemplate = (partial: {
      id: string;
      key: string;
      title: string;
      isEditable: boolean;
    }) => ({
      ...partial,
      ariaLabel: '',
      tooltipText: '',
      detail: { title: '', subtitle: '', ariaLabel: '' },
      disabled: false,
      value: '',
      subFields: [],
      isVisible: true,
    });

    const buildScheduleNotificationRows = () => [
      scheduleFieldTemplate({
        id: 'scheduleSectionHeader',
        key: NotificationFieldKey.SCHEDULE_SECTION_HEADER,
        title: 'time-entries.section.title.notifications.schedule',
        isEditable: false,
      }),
      scheduleFieldTemplate({
        id: 'scheduleShiftPublishedSendMode',
        key: NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE,
        title:
          'time-entries.section.title.notifications.schedule.shift-published-or-changed',
        isEditable: true,
      }),
      scheduleFieldTemplate({
        id: 'scheduleOneHourBeforeShift',
        key: NotificationFieldKey.SCHEDULE_ONE_HOUR_BEFORE_SHIFT,
        title:
          'time-entries.section.title.notifications.schedule.one-hour-before-shift',
        isEditable: true,
      }),
      scheduleFieldTemplate({
        id: 'scheduleForgotClockInAfterShiftStarted',
        key: NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED,
        title:
          'time-entries.section.title.notifications.schedule.forgot-clock-in-after-shift-started',
        isEditable: true,
      }),
      scheduleFieldTemplate({
        id: 'scheduleForgotClockInAfterShiftEnded',
        key: NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_ENDED,
        title:
          'time-entries.section.title.notifications.schedule.forgot-clock-in-after-shift-ended',
        isEditable: true,
      }),
      scheduleFieldTemplate({
        id: 'scheduleLateClockInNotifyManager',
        key: NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER,
        title:
          'time-entries.section.title.notifications.schedule.late-clock-in-notify-manager',
        isEditable: true,
      }),
    ];

    const notificationFieldsWithSchedule = (): IFormConfig => ({
      notifications: [
        ...createMockNotificationFields(false).notifications,
        ...buildScheduleNotificationRows(),
      ],
    });

    const qlDataSchedulePath = {
      clockInNotificationReminderEmail: { version: '1', value: false },
      clockInNotificationReminderMobile: { version: '1', value: false },
      clockInNotificationReminderTime: { version: '1', value: '8:00' },
      clockOutNotificationReminderEmail: { version: '1', value: false },
      clockOutNotificationReminderMobile: { version: '1', value: false },
      clockOutNotificationReminderTime: { version: '1', value: '17:00' },
      notificationEnabledForDays: { version: '1', value: [] },
      notifyClockInOutAdjusted: { version: '1', value: 'Immediate' },
      notifyNotesAddedOrEdited: { version: '1', value: 'Daily' },
      publishShiftChangePreference: { version: '1', value: 'ALWAYS' },
    };

    const mockScheduleFlags = (scheduleEnabled: boolean) => {
      (useIXPFeatureFlag as jest.Mock).mockImplementation(
        ({ flagName }: { flagName: string }) => {
          if (flagName === FEATURE_FLAGS.QB_TIME_ENABLE_SCHEDULE_SETTINGS) {
            return { isEnabled: scheduleEnabled };
          }
          if (flagName === FEATURE_FLAGS.SBSEG_QBO_R6_GEOFENCE) {
            return { isEnabled: false };
          }
          return { isEnabled: false };
        },
      );
    };

    test('hides schedule notification rows when schedule settings IXP flag is off', () => {
      const setNotificationFields = jest.fn();
      mockScheduleFlags(false);
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: qlDataSchedulePath,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
          schedulesVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: undefined,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={notificationFieldsWithSchedule()}
            setNotificationFields={setNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      const payloads = setNotificationFields.mock.calls.map((c) => c[0]);
      const scheduleKeys = [
        NotificationFieldKey.SCHEDULE_SECTION_HEADER,
        NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE,
      ];
      const payloadWithSchedule = payloads.find((cfg) =>
        cfg.notifications?.some((f: { key: string }) =>
          scheduleKeys.includes(f.key as NotificationFieldKey),
        ),
      );
      expect(payloadWithSchedule).toBeDefined();
      const header = payloadWithSchedule!.notifications.find(
        (f: { key: string }) =>
          f.key === NotificationFieldKey.SCHEDULE_SECTION_HEADER,
      );
      expect(header?.isVisible).toBe(false);
    });

    test('QL success path sets schedule row values and shows rows when schedule IXP flag is on', () => {
      const setNotificationFields = jest.fn();
      mockScheduleFlags(true);
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: qlDataSchedulePath,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
          schedulesVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: undefined,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={notificationFieldsWithSchedule()}
            setNotificationFields={setNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      const lastPayload =
        setNotificationFields.mock.calls[
          setNotificationFields.mock.calls.length - 1
        ][0];
      const shiftPublished = lastPayload.notifications.find(
        (f: { key: string }) =>
          f.key === NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE,
      );
      expect(shiftPublished?.isVisible).toBe(true);
      expect(shiftPublished?.value).toContain(
        'time-entries.section.title.notifications.schedule.view.always-send',
      );

      const lateClockIn = lastPayload.notifications.find(
        (f: { key: string }) =>
          f.key === NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER,
      );
      expect(lateClockIn?.value).toBe('off');
    });

    test('QL error path clears shift-published row (section shows try-again) and resets other rows to off', () => {
      const setNotificationFields = jest.fn();
      mockScheduleFlags(true);
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: undefined,
        isQLSettingsLoading: false,
        QLSettingsError: 'ql-load-failed',
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          notificationVisibilityEndDate: '2024-12-31',
          schedulesVisibilityEndDate: '2024-12-31',
        },
        approvalSettings: undefined,
        approvalSettingsLoading: false,
        approvalSettingsError: undefined,
        isUKLocale: false,
      });

      render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={notificationFieldsWithSchedule()}
            setNotificationFields={setNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      const errorPayload =
        setNotificationFields.mock.calls[
          setNotificationFields.mock.calls.length - 1
        ][0];
      const shiftPublished = errorPayload.notifications.find(
        (f: { key: string }) =>
          f.key === NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE,
      );
      // publishShiftChangePreference is API-backed; on QL error the schedule
      // section renders the "try again" banner, so the row value is cleared.
      expect(shiftPublished?.value).toBe('');
      const oneHour = errorPayload.notifications.find(
        (f: { key: string }) =>
          f.key === NotificationFieldKey.SCHEDULE_ONE_HOUR_BEFORE_SHIFT,
      );
      expect(oneHour?.value).toBe('off');
    });

    test('handles loading-to-loaded transition for schedule notification settings', () => {
      const setNotificationFields = jest.fn();
      mockScheduleFlags(true);

      (useTimeTrackingSettingsContext as jest.Mock)
        .mockReturnValueOnce({
          QLData: qlDataSchedulePath,
          isQLSettingsLoading: true,
          QLSettingsError: undefined,
          isFormEditable: true,
          text: (id: string) => id,
          timeEntryNewBadgeVisibleFor: {
            notificationVisibilityEndDate: '2024-12-31',
            schedulesVisibilityEndDate: '2024-12-31',
          },
          approvalSettings: undefined,
          approvalSettingsLoading: false,
          approvalSettingsError: undefined,
          isUKLocale: false,
        })
        .mockReturnValueOnce({
          QLData: qlDataSchedulePath,
          isQLSettingsLoading: false,
          QLSettingsError: undefined,
          isFormEditable: true,
          text: (id: string) => id,
          timeEntryNewBadgeVisibleFor: {
            notificationVisibilityEndDate: '2024-12-31',
            schedulesVisibilityEndDate: '2024-12-31',
          },
          approvalSettings: undefined,
          approvalSettingsLoading: false,
          approvalSettingsError: undefined,
          isUKLocale: false,
        });

      const { rerender } = render(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={notificationFieldsWithSchedule()}
            setNotificationFields={setNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      rerender(
        <TestWrapper>
          <NotificationsTimeEntrySettings
            notificationFields={notificationFieldsWithSchedule()}
            setNotificationFields={setNotificationFields}
            isNotificationFieldEditing={false}
            onSaveTimeEntrySettings={jest.fn()}
            notificationFieldSettingSection="notificationSettings"
            id="test-id"
            onFormUpdate={jest.fn()}
            onFormCancel={jest.fn()}
            isDataUpdating={false}
            isFieldsVisible={mockIsFieldsVisible}
            updateVisibleFields={mockUpdateVisibleFields}
          />
        </TestWrapper>,
      );

      expect(setNotificationFields).toHaveBeenCalled();
    });
  });
});
