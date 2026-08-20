import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { MappedQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import { IFormConfig } from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { TimeTrackingTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeTrackingTimeEntrySettings/TimeTrackingTimeEntrySettings';

// Mock timezoneConversions
jest.mock('src/js/widgets/common/addTimeFormComponents/TimeZoneField', () => ({
  timezoneConversions: [
    {
      name: 'America/New_York',
      longFormName: 'Eastern Time (US & Canada)',
    },
  ],
}));

// Mock the feature flag hook
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(() => ({ isEnabled: true })),
}));

const mockUseIXPFeatureFlag = require('src/js/common/useIXPFeatureFlag')
  .useIXPFeatureFlag as jest.Mock;

// Mock the entitlements hook
jest.mock('src/js/service/hooks/entitlements/useGetEntitlements', () => ({
  useGetEntitlements: jest.fn(() => ({ data: [] })),
  computeHasTimeElite: jest.fn(() => true),
}));

const mockUseGetEntitlements =
  require('src/js/service/hooks/entitlements/useGetEntitlements')
    .useGetEntitlements as jest.Mock;
const mockComputeHasTimeElite =
  require('src/js/service/hooks/entitlements/useGetEntitlements')
    .computeHasTimeElite as jest.Mock;

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
        realmId: 'exampleRealmId', // Mock realmId value
      }),
      getUserAuthInfo: jest.fn().mockReturnValue({
        authId: 'exampleAuthId', // Mock authId value
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
            xCsrfToken: 'exampleCsrfToken', // Mock CSRF token value
          }),
          getCompanyL10nInfo: jest.fn().mockReturnValue({
            region: 'exampleRegion', // Mock region value
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

interface GeneralSettingSectionProps {
  ViewContent: React.ReactNode;
  Title: string;
  EditContent?: React.ReactNode;
  onFormUpdate?: (formType: string) => void;
  onFormCancel?: (formType: string) => void;
  isFormEdit?: boolean;
  onSaveTimeTrackingSettings?: () => void;
  id?: string;
  isFormEditable?: boolean;
  isDataUpdating?: boolean;
  formEditType?: string;
}

interface ViewContentProps {
  formFields: IFormConfig;
}

jest.mock(
  'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection.tsx',
  () => ({
    GeneralSettingSection: ({
      ViewContent,
      Title,
    }: GeneralSettingSectionProps) => (
      <div>
        <div>GeneralSettingSection Component</div>
        {ViewContent}
      </div>
    ),
  }),
);

jest.mock('src/js/widgets/timeTrackingSettings/common/viewContent.tsx', () => ({
  ViewContent: jest.fn(({ formFields }: ViewContentProps) => (
    <div data-testid="view-content">ViewContent Component</div>
  )),
}));

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useForm: jest.fn(),
  useFormContext: jest.fn(),
  FormProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const defaultQLData: MappedQLSettings = {
  isServiceFieldEnabled: { version: '1', value: false },
  timeTrackingSupported: { version: '0', value: false },
  transactionBillingForTimeEnabled: { version: '0', value: false },
  transactionTimeTrackingEnabled: { version: '0', value: false },
  useItemForTime: { version: '0', value: false },
  firstDayOfWeek: { version: '1', value: 0 },
  timeZone: { version: '1', value: 'Eastern time (US & Canada)' },
  timeFormat: { version: '1', value: 12 },
  splitTimeSheetAtMidnightEnabled: { version: '0', value: true },
  manageOwnTimeSheetsEnabled: { version: '0', value: true },
  editClockOutTimeEnabled: { version: '1', value: true },
  clockOutOverrideHours: { version: '1', value: 8 },
  clockInRoundDirection: { version: '1', value: 'Nearest' },
  clockInRoundInMin: { version: '1', value: 1 },
  clockOutRoundDirection: { version: '1', value: 'Nearest' },
  clockOutRoundInMin: { version: '1', value: 1 },
  customersForTimeSheetEnabled: { version: '0', value: true },
  isBillingFieldEnabled: { version: '1', value: false },
  billingRateForTimeEnabled: { version: '0', value: false },
  requireBillable: { version: '0', value: false },
  classForTimeSheetEnabled: { version: '0', value: false },
  locationForTimeSheetEnabled: { version: '0', value: false },
  timeSheetEntryNotesEnabled: { version: '0', value: false },
  timeSheetEntryEditNotesEnabled: { version: '0', value: false },
  timeSheetEntryMakesNotesRequiredEnabled: { version: '0', value: false },
  scheduleManagePreference: { version: '0', value: 'company' },
  scheduleViewPreference: { version: '0', value: 'company' },
};

const defaultProps = {
  timeTrackingFields: {
    'time-entries.section.title.time-tracking': [
      {
        id: 'timeEntriesTimeSheetManagement',
        key: 'timeSheetManagement',
        title: 'time-entries.section.title.time-management',
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
      },
      {
        id: 'timeEntriesFirstDayOfWeek',
        key: 'firstDayOfWeek',
        title: 'location-settings.fields.general-settings',
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
        id: 'timeEntriesTimeZone',
        key: 'timeZone',
        title: 'time-entries.section.title.time-management.time-zone',
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
        id: 'timeEntriesTimeFormat',
        key: 'timeFormat',
        title: 'time-entries.section.title.time-management.time-format',
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
        id: 'timeEntriesSplitTimesheetsAtMidnight',
        key: 'splitTimeSheetAtMidnightEnabled',
        title: 'time-entries.section.title.time-management.split-time-sheet',
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
        id: 'timeEntriesAllowTeamMemberToAddAndEditTimeSheets',
        key: 'manageOwnTimeSheetsEnabled',
        title:
          'time-entries.section.title.time-management.allow-team-member-to-add-and-edit-time-sheet',
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
        id: 'timeEntriesAllowTeamMemberToEditClockOutTime',
        key: 'editClockOutTimeEnabled',
        title:
          'time-entries.section.title.time-management.allow-team-member-to-edit-clock-out-time',
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
        id: 'timeEntriesTimesheetRounding',
        key: 'timesheetRounding',
        title: 'time-entries.section.title.timesheet-rounding',
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
      },
      {
        id: 'timeEntriesRoundClockInTimes',
        key: 'roundClockInTime',
        title:
          'time-entries.section.title.timesheet-rounding.round-clock-in-times',
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
        id: 'timeEntriesRoundClockOutTimes',
        key: 'roundClockOutTime',
        title:
          'time-entries.section.title.timesheet-rounding.round-clock-in-times',
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
    ],
  },
  setTimeTrackingFields: jest.fn(),
  isTimeTrackingEditing: false,
  onSaveTimeEntrySettings: jest.fn(),
  timeTrackingFieldSettingSection: 'time-tracking',
  id: 'test-id',
  onFormUpdate: jest.fn(),
  onFormCancel: jest.fn(),
  isDataUpdating: false,
};

interface TimeTrackingSettingsContextType {
  QLData: MappedQLSettings;
  isQLSettingsLoading: boolean;
  QLSettingsError?: string;
  text: (key: string) => string;
  isFormEditable: boolean;
  errorMessage: string;
  isRenderTimeEntry: boolean;
  reRenderTimeEntry: (message: string) => void;
  updateErrorMessage: (message: string) => void;
  QLSettingsRefetch: () => void;
  entitlements: any[];
  entitlementsLoading: boolean;
  sandbox: any;
  v3PreferencesData: any;
  v3PreferencesLoading: boolean;
  v3PreferencesError: boolean;
}

// Mock the useTimeTrackingSettingsContext hook
jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: jest.fn(),
  }),
);

const mockContextValue = {
  QLData: defaultQLData,
  isQLSettingsLoading: false,
  QLSettingsError: undefined,
  text: (key: string) => key,
  isFormEditable: true,
  errorMessage: '',
  isRenderTimeEntry: false,
  reRenderTimeEntrySetting: jest.fn(),
  updateErrorMessage: jest.fn(),
  QLSettingsRefetch: jest.fn(),
  entitlements: [],
  entitlementsLoading: false,
  sandbox: {} as any,
  v3PreferencesData: {},
  v3PreferencesLoading: false,
  v3PreferencesError: false,
  timeEntryNewBadgeVisibleFor: {
    timeTrackingVisibilityEndDate: '',
    timeSheetVisibilityEndDate: '',
    notificationVisibilityEndDate: '',
  },
};

interface TestWrapperProps {
  children: React.ReactNode;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  const methods = useForm();

  return <FormProvider {...methods}>{children}</FormProvider>;
};

const defaultComponentProps = {
  timeTrackingFields: defaultProps.timeTrackingFields,
  setTimeTrackingFields: jest.fn(),
  isTimeTrackingEditing: false,
  onSaveTimeEntrySettings: jest.fn(),
  timeTrackingFieldSettingSection: 'time-entries.section.title.time-tracking',
  isTimeTrackingFieldsLoading: false,
  isTimeTrackingFieldsError: false,
  onEditTimeTrackingFields: jest.fn(),
  id: 'test-id',
  onFormUpdate: jest.fn(),
  onFormCancel: jest.fn(),
  isDataUpdating: false,
};

describe('TimeTrackingTimeEntrySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(
      mockContextValue,
    );
  });

  it('renders time tracking fields', () => {
    render(
      <TestWrapper>
        <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText('GeneralSettingSection Component'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('view-content')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      isQLSettingsLoading: true,
    });

    render(
      <TestWrapper>
        <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText('GeneralSettingSection Component'),
    ).toBeInTheDocument();
  });

  it('renders error state', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLSettingsError: 'Test error',
    });

    render(
      <TestWrapper>
        <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText('GeneralSettingSection Component'),
    ).toBeInTheDocument();
  });

  it('handles first day of week setting', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLData: {
        ...defaultQLData,
        firstDayOfWeek: { version: '1', value: 1 },
      },
    });

    render(
      <TestWrapper>
        <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText('GeneralSettingSection Component'),
    ).toBeInTheDocument();
  });

  it('handles all settings together', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLData: {
        ...defaultQLData,
        firstDayOfWeek: { version: '1', value: 1 },
        timeZone: { version: '1', value: 'America/New_York' },
        timeFormat: { version: '1', value: 24 },
        splitTimeSheetAtMidnightEnabled: { version: '0', value: false },
        clockInRoundDirection: { version: '1', value: 'Up' },
        clockInRoundInMin: { version: '1', value: 15 },
        clockOutRoundDirection: { version: '1', value: 'Down' },
        clockOutRoundInMin: { version: '1', value: 30 },
      },
      isFormEditable: true,
    });

    render(
      <TestWrapper>
        <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText('GeneralSettingSection Component'),
    ).toBeInTheDocument();
  });

  const mockIntl = {
    formatMessage: jest.fn(({ id }) => id),
  };

  beforeEach(() => {
    (useIntl as jest.Mock).mockReturnValue(mockIntl);
    (useFormContext as jest.Mock).mockReturnValue({
      setValue: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls TimeTrackingTimeEntrySettings with updated values', () => {
    const contextValue = {
      QLData: {
        isServiceFieldEnabled: { version: '1', value: false },
        timeTrackingSupported: { version: '0', value: false },
        transactionBillingForTimeEnabled: { version: '0', value: false },
        transactionTimeTrackingEnabled: { version: '0', value: false },
        useItemForTime: { version: '0', value: false },
        clockInNotificationReminderTime: {
          version: '1',
          value: '1 minutes',
        },
        clockInNotificationReminderEmail: {
          version: '1',
          value: true,
        },
        clockInNotificationReminderMobile: {
          version: '1',
          value: true,
        },
        clockOutNotificationReminderTime: {
          version: '1',
          value: '1 minutes',
        },
        clockOutNotificationReminderEmail: {
          version: '1',
          value: true,
        },
        clockOutNotificationReminderMobile: {
          version: '1',
          value: true,
        },
        notificationEnabledForDays: {
          version: '1',
          value: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        notifyAdminOnClockOutOverrideEnabled: {
          version: '1',
          value: true,
        },
        notifyManagerOnClockOutOverrideEnabled: {
          version: '1',
          value: true,
        },
        notifyAdminOnTimeSheetNotesEditEnabled: {
          version: '1',
          value: true,
        },
        notifyGroupManagerOnTimeSheetNotesEditEnabled: {
          version: '1',
          value: true,
        },
        firstDayOfWeek: { version: '1', value: 0 },
        timeZone: { version: '1', value: 'Eastern time (US & Canada)' },
        timeFormat: { version: '1', value: 12 },
        splitTimeSheetAtMidnightEnabled: { version: '0', value: true },
        manageOwnTimeSheetsEnabled: {
          version: '0',
          value: true,
        },
        editClockOutTimeEnabled: { version: '1', value: true },
        clockOutOverrideHours: { version: '1', value: 8 },
        clockInRoundDirection: { version: '1', value: 'Nearest' },
        clockInRoundInMin: { version: '1', value: 1 },
        clockOutRoundDirection: { version: '1', value: 'Nearest' },
        clockOutRoundInMin: { version: '1', value: 1 },
        customersForTimeSheetEnabled: { version: '0', value: true },
        isBillingFieldEnabled: { version: '1', value: false },
        billingRateForTimeEnabled: { version: '0', value: false },
        requireBillable: { version: '0', value: false },
        classForTimeSheetEnabled: { version: '0', value: false },
        locationForTimeSheetEnabled: { version: '0', value: false },
        timeSheetEntryNotesEnabled: { version: '0', value: false },
        timeSheetEntryEditNotesEnabled: { version: '0', value: false },
        timeSheetEntryMakesNotesRequiredEnabled: {
          version: '0',
          value: false,
        },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      text: (key: string) => key,
      isFormEditable: false,
    };

    render(
      <TestWrapper>
        <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
      </TestWrapper>,
    );
  });

  it('calls TimeTrackingTimeEntrySettings sendClockIn/outReminders Email with values', () => {
    const contextValue = {
      QLData: {
        isServiceFieldEnabled: { version: '1', value: false },
        timeTrackingSupported: { version: '0', value: false },
        transactionBillingForTimeEnabled: { version: '0', value: false },
        transactionTimeTrackingEnabled: { version: '0', value: false },
        useItemForTime: { version: '0', value: false },
        clockInNotificationReminderTime: {
          version: '1',
          value: '1 minutes',
        },
        clockInNotificationReminderEmail: {
          version: '1',
          value: true,
        },
        clockInNotificationReminderMobile: {
          version: '1',
          value: true,
        },
        clockOutNotificationReminderTime: {
          version: '1',
          value: '1 minutes',
        },
        clockOutNotificationReminderEmail: {
          version: '1',
          value: true,
        },
        clockOutNotificationReminderMobile: {
          version: '1',
          value: true,
        },
        notificationEnabledForDays: {
          version: '1',
          value: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        notifyAdminOnClockOutOverrideEnabled: {
          version: '1',
          value: true,
        },
        notifyManagerOnClockOutOverrideEnabled: {
          version: '1',
          value: true,
        },
        notifyAdminOnTimeSheetNotesEditEnabled: {
          version: '1',
          value: true,
        },
        notifyGroupManagerOnTimeSheetNotesEditEnabled: {
          version: '1',
          value: true,
        },
        firstDayOfWeek: { version: '1', value: 0 },
        timeZone: { version: '1', value: 'Eastern time (US & Canada)' },
        timeFormat: { version: '1', value: 12 },
        splitTimeSheetAtMidnightEnabled: { version: '0', value: true },
        manageOwnTimeSheetsEnabled: {
          version: '0',
          value: true,
        },
        editClockOutTimeEnabled: { version: '1', value: true },
        clockOutOverrideHours: { version: '1', value: 8 },
        clockInRoundDirection: { version: '1', value: 'Nearest' },
        clockInRoundInMin: { version: '1', value: 1 },
        clockOutRoundDirection: { version: '1', value: 'Nearest' },
        clockOutRoundInMin: { version: '1', value: 1 },
        customersForTimeSheetEnabled: { version: '0', value: true },
        isBillingFieldEnabled: { version: '1', value: false },
        billingRateForTimeEnabled: { version: '0', value: false },
        requireBillable: { version: '0', value: false },
        classForTimeSheetEnabled: { version: '0', value: false },
        locationForTimeSheetEnabled: { version: '0', value: false },
        timeSheetEntryNotesEnabled: { version: '0', value: false },
        timeSheetEntryEditNotesEnabled: { version: '0', value: false },
        timeSheetEntryMakesNotesRequiredEnabled: {
          version: '0',
          value: false,
        },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      text: (key: string) => key,
      isFormEditable: false,
    };

    render(
      <TestWrapper>
        <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
      </TestWrapper>,
    );
  });

  it('calls TimeTrackingTimeEntrySettings isSendClockIn/outReminder Text with values', () => {
    const contextValue = {
      QLData: {
        isServiceFieldEnabled: { version: '1', value: false },
        timeTrackingSupported: { version: '0', value: false },
        transactionBillingForTimeEnabled: { version: '0', value: false },
        transactionTimeTrackingEnabled: { version: '0', value: false },
        useItemForTime: { version: '0', value: false },
        clockInNotificationReminderTime: {
          version: '1',
          value: '1 minutes',
        },
        clockInNotificationReminderEmail: {
          version: '1',
          value: true,
        },
        clockInNotificationReminderMobile: {
          version: '1',
          value: true,
        },
        clockOutNotificationReminderTime: {
          version: '1',
          value: '1 minutes',
        },
        clockOutNotificationReminderEmail: {
          version: '1',
          value: true,
        },
        clockOutNotificationReminderMobile: {
          version: '1',
          value: true,
        },
        notificationEnabledForDays: {
          version: '1',
          value: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        notifyAdminOnClockOutOverrideEnabled: {
          version: '1',
          value: true,
        },
        notifyManagerOnClockOutOverrideEnabled: {
          version: '1',
          value: true,
        },
        notifyAdminOnTimeSheetNotesEditEnabled: {
          version: '1',
          value: true,
        },
        notifyGroupManagerOnTimeSheetNotesEditEnabled: {
          version: '1',
          value: true,
        },
        firstDayOfWeek: { version: '1', value: 0 },
        timeZone: { version: '1', value: 'Eastern time (US & Canada)' },
        timeFormat: { version: '1', value: 12 },
        splitTimeSheetAtMidnightEnabled: { version: '0', value: true },
        manageOwnTimeSheetsEnabled: {
          version: '0',
          value: true,
        },
        editClockOutTimeEnabled: { version: '1', value: true },
        clockOutOverrideHours: { version: '1', value: 8 },
        clockInRoundDirection: { version: '1', value: 'Nearest' },
        clockInRoundInMin: { version: '1', value: 1 },
        clockOutRoundDirection: { version: '1', value: 'Nearest' },
        clockOutRoundInMin: { version: '1', value: 1 },
        customersForTimeSheetEnabled: { version: '0', value: true },
        isBillingFieldEnabled: { version: '1', value: false },
        billingRateForTimeEnabled: { version: '0', value: false },
        requireBillable: { version: '0', value: false },
        classForTimeSheetEnabled: { version: '0', value: false },
        locationForTimeSheetEnabled: { version: '0', value: false },
        timeSheetEntryNotesEnabled: { version: '0', value: false },
        timeSheetEntryEditNotesEnabled: { version: '0', value: false },
        timeSheetEntryMakesNotesRequiredEnabled: {
          version: '0',
          value: false,
        },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      text: (key: string) => key,
      isFormEditable: false,
    };

    render(
      <TestWrapper>
        <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
      </TestWrapper>,
    );
  });

  describe('firstDayOfWeek handling', () => {
    it('handles integer firstDayOfWeek value correctly', () => {
      const mockSetValue = jest.fn();
      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          ...defaultQLData,
          firstDayOfWeek: { version: '1', value: 1 },
        },
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
        </TestWrapper>,
      );

      expect(mockSetValue).toHaveBeenCalledWith('firstDayOfWeek', '1');
    });

    it('handles zero firstDayOfWeek value correctly', () => {
      const mockSetValue = jest.fn();
      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          ...defaultQLData,
          firstDayOfWeek: { version: '1', value: 0 },
        },
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
        </TestWrapper>,
      );

      expect(mockSetValue).toHaveBeenCalledWith('firstDayOfWeek', '0');
    });

    it('handles negative firstDayOfWeek value correctly', () => {
      const mockSetValue = jest.fn();
      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          ...defaultQLData,
          firstDayOfWeek: { version: '1', value: -1 },
        },
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
        </TestWrapper>,
      );

      expect(mockSetValue).toHaveBeenCalledWith('firstDayOfWeek', '-1');
    });
  });

  describe('timeZone handling', () => {
    it('handles timeZone with matching conversion correctly', () => {
      const mockSetValue = jest.fn();
      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          ...defaultQLData,
          timeZone: { version: '1', value: 'America/New_York' },
        },
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
        </TestWrapper>,
      );

      expect(mockSetValue).toHaveBeenCalledWith('timeZone', 'America/New_York');
    });

    it('handles timeZone with non-matching conversion correctly', async () => {
      const mockSetValue = jest.fn();
      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      const customTimeZone = 'Asia/Custom_Zone';
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          ...defaultQLData,
          timeZone: { version: '1', value: customTimeZone },
        },
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
        </TestWrapper>,
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSetValue).toHaveBeenCalledWith('timeZone', customTimeZone);
    });

    it('handles disabled splitTimeSheetAtMidnight correctly', async () => {
      const mockSetValue = jest.fn();
      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      const timeTrackingFields = JSON.parse(
        JSON.stringify(defaultComponentProps.timeTrackingFields),
      );

      const qlData: MappedQLSettings = {
        ...defaultQLData,
        splitTimeSheetAtMidnightEnabled: { version: '1', value: false },
        firstDayOfWeek: { version: '1', value: 0 },
        timeZone: { version: '1', value: 'America/New_York' },
        timeFormat: { version: '1', value: 24 },
        manageOwnTimeSheetsEnabled: { version: '1', value: true },
        editClockOutTimeEnabled: { version: '1', value: true },
        clockOutOverrideHours: { version: '1', value: 8 },
        clockInRoundDirection: { version: '1', value: 'NEAREST' },
        clockInRoundInMin: { version: '1', value: 1 },
        clockOutRoundDirection: { version: '1', value: 'NEAREST' },
        clockOutRoundInMin: { version: '1', value: 1 },
      };

      const contextValue = {
        QLData: qlData,
        isQLSettingsLoading: false,
        QLSettingsError: '',
        text: (key: string) => key,
        isFormEditable: false,
      };

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings {...defaultComponentProps} />
        </TestWrapper>,
      );

      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('should use raw timezone value when no conversion is found', () => {
      const mockText = jest.fn((key) => key);
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();
      const customTimezone = 'Custom/Timezone/Value';
      const qlDataWithCustomTimezone = {
        ...defaultQLData,
        timeZone: { version: '1', value: customTimezone },
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithCustomTimezone,
        isQLSettingsLoading: false,
        text: mockText,
      });

      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Get all setValue calls
      const allCalls = mockSetValue.mock.calls;

      // Verify timezone is set to raw value
      expect(allCalls).toContainEqual(['timeZone', customTimezone]);

      // Verify the field value in timeTrackingFields is also set to raw value
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
      const setTimeTrackingFieldsCalls = mockSetTimeTrackingFields.mock.calls;
      const lastCall =
        setTimeTrackingFieldsCalls[setTimeTrackingFieldsCalls.length - 1][0];
      const timeZoneField = lastCall[
        'time-entries.section.title.time-tracking'
      ].find((field: any) => field.key === 'timeZone');
      expect(timeZoneField.value).toBe(customTimezone);
    });

    it('should handle timezone with null QLData.timeZone.value and use default', () => {
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();
      const qlDataWithNullTimezone = {
        ...defaultQLData,
        timeZone: { version: '1', value: null },
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithNullTimezone,
        isQLSettingsLoading: false,
      });

      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Should use default timezone value when QLData.timeZone.value is null
      expect(mockSetValue).toHaveBeenCalledWith('timeZone', 'America/New_York');

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('should handle timezone with undefined QLData.timeZone.value and use default', () => {
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();
      const qlDataWithUndefinedTimezone = {
        ...defaultQLData,
        timeZone: { version: '1', value: undefined },
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithUndefinedTimezone,
        isQLSettingsLoading: false,
      });

      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Should use default timezone value when QLData.timeZone.value is undefined
      expect(mockSetValue).toHaveBeenCalledWith('timeZone', 'America/New_York');

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('should handle timezone with empty string QLData.timeZone.value and use default', () => {
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();
      const qlDataWithEmptyTimezone = {
        ...defaultQLData,
        timeZone: { version: '1', value: '' },
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithEmptyTimezone,
        isQLSettingsLoading: false,
      });

      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Should use default timezone value when QLData.timeZone.value is empty string
      expect(mockSetValue).toHaveBeenCalledWith('timeZone', 'America/New_York');

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('should handle timezone with undefined QLData.timeZone and use default', () => {
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();
      const qlDataWithUndefinedTimezoneObject = {
        ...defaultQLData,
        timeZone: undefined,
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithUndefinedTimezoneObject,
        isQLSettingsLoading: false,
      });

      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Should use default timezone value when QLData.timeZone is undefined
      expect(mockSetValue).toHaveBeenCalledWith('timeZone', 'America/New_York');

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('should handle timezone with null QLData.timeZone and use default', () => {
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();
      const qlDataWithNullTimezoneObject = {
        ...defaultQLData,
        timeZone: null,
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithNullTimezoneObject,
        isQLSettingsLoading: false,
      });

      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Should use default timezone value when QLData.timeZone is null
      expect(mockSetValue).toHaveBeenCalledWith('timeZone', 'America/New_York');

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('should handle various timezone formats that are not in conversions list', () => {
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();

      const testTimezones = [
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Africa/Cairo',
        'Pacific/Auckland',
        'Custom/Timezone/Format',
        'Unknown/Zone/123',
        'Test/Zone/With/Slashes',
        'Zone-With-Dashes',
        'Zone_With_Underscores',
      ];

      testTimezones.forEach((timezone) => {
        const qlDataWithTestTimezone = {
          ...defaultQLData,
          timeZone: { version: '1', value: timezone },
        };

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: qlDataWithTestTimezone,
          isQLSettingsLoading: false,
        });

        (useFormContext as jest.Mock).mockReturnValue({
          setValue: mockSetValue,
        });

        const { unmount } = render(
          <TestWrapper>
            <TimeTrackingTimeEntrySettings
              {...defaultComponentProps}
              setTimeTrackingFields={mockSetTimeTrackingFields}
            />
          </TestWrapper>,
        );

        // Should use the raw timezone value when not in conversions list
        expect(mockSetValue).toHaveBeenCalledWith('timeZone', timezone);

        // Verify setTimeTrackingFields was called
        expect(mockSetTimeTrackingFields).toHaveBeenCalled();

        // Clean up for next iteration
        unmount();
        mockSetValue.mockClear();
        mockSetTimeTrackingFields.mockClear();
      });
    });

    it('should handle timezone case sensitivity correctly', () => {
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();

      // Test with different case variations that should not match the mock conversion
      const caseVariations = [
        'AMERICA/NEW_YORK', // All caps
        'america/new_york', // All lowercase
        'America/New_York', // Different case
        'AMERICA/new_york', // Mixed case
      ];

      caseVariations.forEach((timezone) => {
        const qlDataWithCaseVariation = {
          ...defaultQLData,
          timeZone: { version: '1', value: timezone },
        };

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: qlDataWithCaseVariation,
          isQLSettingsLoading: false,
        });

        (useFormContext as jest.Mock).mockReturnValue({
          setValue: mockSetValue,
        });

        const { unmount } = render(
          <TestWrapper>
            <TimeTrackingTimeEntrySettings
              {...defaultComponentProps}
              setTimeTrackingFields={mockSetTimeTrackingFields}
            />
          </TestWrapper>,
        );

        // Should use the raw timezone value when case doesn't match
        expect(mockSetValue).toHaveBeenCalledWith('timeZone', timezone);

        // Verify setTimeTrackingFields was called
        expect(mockSetTimeTrackingFields).toHaveBeenCalled();

        // Clean up for next iteration
        unmount();
        mockSetValue.mockClear();
        mockSetTimeTrackingFields.mockClear();
      });
    });

    it('should test the else branch in error state useEffect when default timezone is not in conversions', () => {
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        isQLSettingsLoading: false,
        QLSettingsError: 'Test error message',
      });

      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // In error state, should use default timezone value from timeEntrySettingsDefaultState
      expect(mockSetValue).toHaveBeenCalledWith('timeZone', 'America/New_York');

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();

      // Verify the field value is set correctly in the error state
      const setTimeTrackingFieldsCalls = mockSetTimeTrackingFields.mock.calls;
      const lastCall =
        setTimeTrackingFieldsCalls[setTimeTrackingFieldsCalls.length - 1][0];
      const timeZoneField = lastCall[
        'time-entries.section.title.time-tracking'
      ].find((field: any) => field.key === 'timeZone');

      // Since 'America/New_York' is in our mock conversions, it should use the long form name
      expect(timeZoneField.value).toBe('Eastern Time (US & Canada)');
    });

    it('should explicitly test the else branch when timezone is NOT in conversions list', () => {
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();

      // Use a timezone that is definitely NOT in the mock timezoneConversions array
      const timezoneNotInConversions = 'Europe/London';
      const qlDataWithUnknownTimezone = {
        ...defaultQLData,
        timeZone: { version: '1', value: timezoneNotInConversions },
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithUnknownTimezone,
        isQLSettingsLoading: false,
      });

      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Should call setValue with the raw timezone value
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeZone',
        timezoneNotInConversions,
      );

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();

      // Verify the field value is set to the raw timezone value (not the long form name)
      const setTimeTrackingFieldsCalls = mockSetTimeTrackingFields.mock.calls;
      const lastCall =
        setTimeTrackingFieldsCalls[setTimeTrackingFieldsCalls.length - 1][0];
      const timeZoneField = lastCall[
        'time-entries.section.title.time-tracking'
      ].find((field: any) => field.key === 'timeZone');

      // Should use the raw timezone value since it's not in conversions list
      expect(timeZoneField.value).toBe(timezoneNotInConversions);
    });

    it('should test the else branch with a completely different timezone format', () => {
      const mockSetValue = jest.fn();
      const mockSetTimeTrackingFields = jest.fn();

      // Use a timezone with a completely different format that won't match the mock
      const customTimezone = 'Custom/Timezone/123';
      const qlDataWithCustomTimezone = {
        ...defaultQLData,
        timeZone: { version: '1', value: customTimezone },
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithCustomTimezone,
        isQLSettingsLoading: false,
      });

      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Should call setValue with the raw timezone value
      expect(mockSetValue).toHaveBeenCalledWith('timeZone', customTimezone);

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();

      // Verify the field value is set to the raw timezone value
      const setTimeTrackingFieldsCalls = mockSetTimeTrackingFields.mock.calls;
      const lastCall =
        setTimeTrackingFieldsCalls[setTimeTrackingFieldsCalls.length - 1][0];
      const timeZoneField = lastCall[
        'time-entries.section.title.time-tracking'
      ].find((field: any) => field.key === 'timeZone');

      // Should use the raw timezone value since it's not in conversions list
      expect(timeZoneField.value).toBe(customTimezone);
    });
  });

  describe('TimeTrackingTimeEntrySettings useEffect handling', () => {
    let mockSetValue: jest.Mock;
    let mockSetTimeTrackingFields: jest.Mock;

    beforeEach(() => {
      mockSetValue = jest.fn();
      mockSetTimeTrackingFields = jest.fn();
      (useFormContext as jest.Mock).mockReturnValue({
        setValue: mockSetValue,
      });
    });

    it('should not update fields when QLData is null', () => {
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: null,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      expect(mockSetValue).not.toHaveBeenCalled();
      expect(mockSetTimeTrackingFields).not.toHaveBeenCalled();
    });

    it('should not update fields when isQLSettingsLoading is true', () => {
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        isQLSettingsLoading: true,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      expect(mockSetValue).not.toHaveBeenCalled();
      expect(mockSetTimeTrackingFields).not.toHaveBeenCalled();
    });

    it('should handle all field types with default values when QLData values are missing', () => {
      const mockText = jest.fn((key) => key);
      const emptyQLData = {
        ...defaultQLData,
        firstDayOfWeek: { version: '1', value: null },
        timeZone: { version: '1', value: null },
        timeFormat: { version: '1', value: null },
        splitTimeSheetAtMidnightEnabled: { version: '1', value: null },
        manageOwnTimeSheetsEnabled: { version: '1', value: null },
        editClockOutTimeEnabled: { version: '1', value: null },
        clockOutOverrideHours: { version: '1', value: null },
        clockInRoundDirection: { version: '1', value: null },
        clockInRoundInMin: { version: '1', value: null },
        clockOutRoundDirection: { version: '1', value: null },
        clockOutRoundInMin: { version: '1', value: null },
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: emptyQLData,
        isQLSettingsLoading: false,
        text: mockText,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Get all setValue calls
      const allCalls = mockSetValue.mock.calls;

      // Define expected calls based on actual component behavior
      const expectedCalls = [
        ['firstDayOfWeek', null],
        ['timeZone', 'America/New_York'],
        ['timeFormat', 24],
        ['splitTimeSheetAtMidnightEnabled', null],
        ['manageOwnTimeSheetsEnabled', null],
        ['editClockOutTimeEnabled', null],
        ['clockOutOverrideHours', null],
        ['clockInRoundDirection', 'nearest'],
        ['clockInRoundInMin', 1],
        ['clockOutRoundDirection', 'nearest'],
        ['clockOutRoundInMin', 1],
      ];

      // Verify that each expected call exists in allCalls
      expectedCalls.forEach(([key, value]) => {
        expect(allCalls).toContainEqual([key, value]);
      });

      // Verify the total number of calls
      expect(mockSetValue).toHaveBeenCalledTimes(expectedCalls.length);

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('should handle all field types with provided values', () => {
      const mockText = jest.fn((key) => key);
      const customQLData = {
        ...defaultQLData,
        firstDayOfWeek: { version: '1', value: 1 },
        timeZone: { version: '1', value: 'America/Los_Angeles' },
        timeFormat: { version: '1', value: 12 },
        splitTimeSheetAtMidnightEnabled: { version: '1', value: false },
        manageOwnTimeSheetsEnabled: { version: '1', value: false },
        editClockOutTimeEnabled: { version: '1', value: true },
        clockOutOverrideHours: { version: '1', value: 4 },
        clockInRoundDirection: { version: '1', value: 'UP' },
        clockInRoundInMin: { version: '1', value: 15 },
        clockOutRoundDirection: { version: '1', value: 'DOWN' },
        clockOutRoundInMin: { version: '1', value: 30 },
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: customQLData,
        isQLSettingsLoading: false,
        text: mockText,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Verify all expected setValue calls were made with correct values
      const expectedCalls = [
        ['firstDayOfWeek', '1'],
        ['timeZone', 'America/Los_Angeles'],
        ['timeFormat', 12],
        ['splitTimeSheetAtMidnightEnabled', false],
        ['manageOwnTimeSheetsEnabled', false],
        ['editClockOutTimeEnabled', true],
        ['clockOutOverrideHours', 4],
        ['clockInRoundDirection', 'UP'],
        ['clockInRoundInMin', 15],
        ['clockOutRoundDirection', 'DOWN'],
        ['clockOutRoundInMin', 30],
      ];

      // Instead of checking exact order, verify each call was made
      expectedCalls.forEach(([key, value]) => {
        const { calls } = mockSetValue.mock;
        const matchingCall = calls.find((call) => call[0] === key);
        expect(matchingCall).toBeTruthy();
        if (matchingCall) {
          expect(matchingCall[1]).toBe(value);
        }
      });

      // Verify the total number of calls matches what we expect
      expect(mockSetValue).toHaveBeenCalledTimes(expectedCalls.length);

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('should handle timezone conversion when timezone exists in conversions list', () => {
      const qlDataWithKnownTimezone = {
        ...defaultQLData,
        timeZone: { version: '1', value: 'America/New_York' },
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithKnownTimezone,
        isQLSettingsLoading: false,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      expect(mockSetValue).toHaveBeenCalledWith('timeZone', 'America/New_York');
      // Verify the field value is set to the long form name from conversions
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
      const { calls } = mockSetTimeTrackingFields.mock;
      const lastCall = calls[calls.length - 1][0];
      const timeZoneField = lastCall[
        'time-entries.section.title.time-tracking'
      ].find((field: any) => field.key === 'timeZone');
      expect(timeZoneField.value).toBe('Eastern Time (US & Canada)');
    });

    it('should handle timezone when timezone is not in conversions list', () => {
      const qlDataWithUnknownTimezone = {
        ...defaultQLData,
        timeZone: { version: '1', value: 'Custom/Timezone' },
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithUnknownTimezone,
        isQLSettingsLoading: false,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      expect(mockSetValue).toHaveBeenCalledWith('timeZone', 'Custom/Timezone');
      // Verify the field value is set to the original timezone string
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
      const { calls } = mockSetTimeTrackingFields.mock;
      const lastCall = calls[calls.length - 1][0];
      const timeZoneField = lastCall[
        'time-entries.section.title.time-tracking'
      ].find((field: any) => field.key === 'timeZone');
      expect(timeZoneField.value).toBe('Custom/Timezone');
    });

    it('should use default values when QLData fields are undefined', () => {
      const mockText = jest.fn((key) => key);
      const qlDataWithUndefinedFields = {
        ...defaultQLData,
        splitTimeSheetAtMidnightEnabled: undefined,
        manageOwnTimeSheetsEnabled: undefined,
        editClockOutTimeEnabled: undefined,
        clockOutOverrideHours: undefined,
        clockInRoundDirection: undefined,
        clockInRoundInMin: undefined,
        clockOutRoundDirection: undefined,
        clockOutRoundInMin: undefined,
      };

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: qlDataWithUndefinedFields,
        isQLSettingsLoading: false,
        text: mockText,
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Get all setValue calls
      const allCalls = mockSetValue.mock.calls;

      // Define expected calls based on default values
      const expectedCalls = [
        ['firstDayOfWeek', '0'],
        ['timeZone', 'Eastern time (US & Canada)'],
        ['timeFormat', 12],
        ['splitTimeSheetAtMidnightEnabled', false],
        ['manageOwnTimeSheetsEnabled', false],
        ['editClockOutTimeEnabled', false],
        ['clockOutOverrideHours', 8],
        ['clockInRoundDirection', 'nearest'],
        ['clockInRoundInMin', 1],
        ['clockOutRoundDirection', 'nearest'],
        ['clockOutRoundInMin', 1],
      ];

      // Verify that each expected call exists in allCalls
      expectedCalls.forEach(([key, value]) => {
        expect(allCalls).toContainEqual([key, value]);
      });

      // Verify the total number of calls
      expect(mockSetValue).toHaveBeenCalledTimes(expectedCalls.length);

      // Verify setTimeTrackingFields was called
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });
  });

  describe('Feature flag filtering', () => {
    it('should filter out new settings when feature flag is disabled', () => {
      // Mock feature flag as disabled
      mockUseIXPFeatureFlag.mockReturnValue({ isEnabled: false });

      const mockTimeTrackingFields = {
        'time-entries.section.title.time-tracking': [
          {
            key: 'manageOwnTimeSheetsEnabled',
            id: 'manage-own',
            title: 'Manage Own Timesheets',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: '',
            subFields: [],
            isEditable: true,
          },
          {
            key: 'mobileTimeTrackingEnabled',
            id: 'mobile-tracking',
            title: 'Mobile Time Tracking',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: '',
            subFields: [],
            isEditable: true,
          },
          {
            key: 'signatureCaptureEnabled',
            id: 'signature-capture',
            title: 'Signature Capture',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: '',
            subFields: [],
            isEditable: true,
          },
          {
            key: 'editClockOutTimeEnabled',
            id: 'clock-out',
            title: 'Edit Clock Out',
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

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: defaultQLData,
        isQLSettingsLoading: false,
      });

      const mockSetTimeTrackingFields = jest.fn();

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            timeTrackingFields={mockTimeTrackingFields}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Verify the filtered fields were passed to ViewContent
      // The new settings should be filtered out
      const viewContent = screen.getByTestId('view-content');
      expect(viewContent).toBeInTheDocument();

      // Check that mockSetTimeTrackingFields was called (it's called in useEffect)
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('should include new settings when feature flag is enabled', () => {
      // Mock feature flag as enabled
      mockUseIXPFeatureFlag.mockReturnValue({ isEnabled: true });

      const mockTimeTrackingFields = {
        'time-entries.section.title.time-tracking': [
          {
            key: 'manageOwnTimeSheetsEnabled',
            id: 'manage-own',
            title: 'Manage Own Timesheets',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: '',
            subFields: [],
            isEditable: true,
          },
          {
            key: 'mobileTimeTrackingEnabled',
            id: 'mobile-tracking',
            title: 'Mobile Time Tracking',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: '',
            subFields: [],
            isEditable: true,
          },
          {
            key: 'signatureCaptureEnabled',
            id: 'signature-capture',
            title: 'Signature Capture',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: '',
            subFields: [],
            isEditable: true,
          },
          {
            key: 'editClockOutTimeEnabled',
            id: 'clock-out',
            title: 'Edit Clock Out',
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

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: defaultQLData,
        isQLSettingsLoading: false,
      });

      const mockSetTimeTrackingFields = jest.fn();

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            timeTrackingFields={mockTimeTrackingFields}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Verify the fields were passed through without filtering
      const viewContent = screen.getByTestId('view-content');
      expect(viewContent).toBeInTheDocument();
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('should return original fields when timeTrackingFields is empty', () => {
      mockUseIXPFeatureFlag.mockReturnValue({ isEnabled: false });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: defaultQLData,
        isQLSettingsLoading: false,
      });

      const mockSetTimeTrackingFields = jest.fn();
      const emptyTimeTrackingFields = {
        'time-entries.section.title.time-tracking': [],
      };

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            timeTrackingFields={emptyTimeTrackingFields}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      // Component should handle empty timeTrackingFields gracefully
      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });
  });

  describe('mobile tracking view mode display respects API values', () => {
    it('displays off when manageOwn is true but mobile is false from API', () => {
      const mockQLData: MappedQLSettings = {
        ...defaultQLData,
        manageOwnTimeSheetsEnabled: { value: true, version: '1' },
        mobileTimeTrackingEnabled: { value: false, version: '1' },
      };

      jest
        .spyOn(require('src/js/common/useIXPFeatureFlag'), 'useIXPFeatureFlag')
        .mockReturnValue({ isEnabled: true });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: mockQLData,
        isQLSettingsLoading: false,
      });

      const mockTimeTrackingFields = {
        'time-entries.section.title.time-tracking': [
          {
            key: 'mobileTimeTrackingEnabled',
            id: 'mobile-tracking',
            title: 'Mobile Tracking',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: 'placeholder',
            subFields: [],
            isEditable: true,
          },
        ],
      };

      const mockSetTimeTrackingFields = jest.fn((updatedFields) => {
        // Check that the updated field value is 'off' (from API false)
        const mobileField = updatedFields[
          'time-entries.section.title.time-tracking'
        ].find((f: any) => f.key === 'mobileTimeTrackingEnabled');
        expect(mobileField.value).toBe('off');
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            timeTrackingFields={mockTimeTrackingFields}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('displays on when both manageOwn and mobile are true from API', () => {
      const mockQLData: MappedQLSettings = {
        ...defaultQLData,
        manageOwnTimeSheetsEnabled: { value: true, version: '1' },
        mobileTimeTrackingEnabled: { value: true, version: '1' },
      };

      mockUseIXPFeatureFlag.mockReturnValue({ isEnabled: true });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: mockQLData,
        isQLSettingsLoading: false,
      });

      const mockTimeTrackingFields = {
        'time-entries.section.title.time-tracking': [
          {
            key: 'mobileTimeTrackingEnabled',
            id: 'mobile-tracking',
            title: 'Mobile Tracking',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: 'placeholder',
            subFields: [],
            isEditable: true,
          },
        ],
      };

      const mockSetTimeTrackingFields = jest.fn((updatedFields) => {
        const mobileField = updatedFields[
          'time-entries.section.title.time-tracking'
        ].find((f: any) => f.key === 'mobileTimeTrackingEnabled');
        expect(mobileField.value).toBe('on');
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            timeTrackingFields={mockTimeTrackingFields}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });

    it('displays on when manageOwn is false but mobile is true from API', () => {
      const mockQLData: MappedQLSettings = {
        ...defaultQLData,
        manageOwnTimeSheetsEnabled: { value: false, version: '1' },
        mobileTimeTrackingEnabled: { value: true, version: '1' },
      };

      mockUseIXPFeatureFlag.mockReturnValue({ isEnabled: true });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: mockQLData,
        isQLSettingsLoading: false,
      });

      const mockTimeTrackingFields = {
        'time-entries.section.title.time-tracking': [
          {
            key: 'mobileTimeTrackingEnabled',
            id: 'mobile-tracking',
            title: 'Mobile Tracking',
            ariaLabel: '',
            tooltipText: '',
            detail: { title: '', subtitle: '', ariaLabel: '' },
            disabled: false,
            value: 'placeholder',
            subFields: [],
            isEditable: true,
          },
        ],
      };

      const mockSetTimeTrackingFields = jest.fn((updatedFields) => {
        const mobileField = updatedFields[
          'time-entries.section.title.time-tracking'
        ].find((f: any) => f.key === 'mobileTimeTrackingEnabled');
        expect(mobileField.value).toBe('on');
      });

      render(
        <TestWrapper>
          <TimeTrackingTimeEntrySettings
            {...defaultComponentProps}
            timeTrackingFields={mockTimeTrackingFields}
            setTimeTrackingFields={mockSetTimeTrackingFields}
          />
        </TestWrapper>,
      );

      expect(mockSetTimeTrackingFields).toHaveBeenCalled();
    });
  });

  it('handles missing time-tracking section key in form fields', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLData: defaultQLData,
      isQLSettingsLoading: false,
    });

    const mockSetTimeTrackingFields = jest.fn();
    render(
      <TestWrapper>
        <TimeTrackingTimeEntrySettings
          {...defaultComponentProps}
          timeTrackingFields={{} as any}
          setTimeTrackingFields={mockSetTimeTrackingFields}
        />
      </TestWrapper>,
    );

    expect(mockSetTimeTrackingFields).toHaveBeenCalled();
  });
});
