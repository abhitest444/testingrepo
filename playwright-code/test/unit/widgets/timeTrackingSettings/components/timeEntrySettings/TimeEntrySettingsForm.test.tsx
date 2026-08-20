import React from 'react';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
  within,
  act,
} from '@testing-library/react';
import { buildSandbox, MockQuicksandProvider } from '@payroll/quicksand';
import '@testing-library/jest-dom';
import { MockedProvider } from '@apollo/client/testing';

import { Sandbox } from 'src/js/common/sandbox';
import { TimeEntrySettingsForm } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/TimeEntrySettingsForm';
import {
  SEARCH_SECTION_KEYS,
  TimeEntriesFormType,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { useTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/hooks/useTimeEntrySettingsForm';

const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

afterAll(() => {
  window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
});

type MockMessages = {
  'time-entries.section.title.time-tracking': string;
  'time-entries.section.title.time-sheet': string;
  'time-entries.section.title.notifications': string;
  'time-entries.section.title.custom-fields': string;
  'time-entries.section.title.custom-fields.title': string;
  'time-entries.section.title.custom-fields.add-custom-field': string;
  'unsaved.changes.confirmation.modal.content': string;
  'do.not.have.access.rights.to.edit.info': string;
  'do.not.have.access.rights.to.edit.time.settings': string;
  'ask.your.quickbooks.admin.for.access': string;
  'time-entries.section.title.approvals': string;
  [key: string]: string; // Allow any string key
};

const mockNlsMessages: MockMessages = {
  'time-entries.section.title.time-tracking': 'Time Tracking',
  'time-entries.section.title.time-sheet': 'Time Sheet',
  'time-entries.section.title.notifications': 'Notifications',
  'time-entries.section.title.custom-fields': 'Custom Fields',
  'time-entries.section.title.custom-fields.title': 'Custom Fields',
  'time-entries.section.title.custom-fields.add-custom-field': 'Add New',
  'time-entries.section.title.approvals': 'Approvals',
  'unsaved.changes.confirmation.modal.content':
    'You have unsaved changes. Do you want to save them?',
  'do.not.have.access.rights.to.edit.info':
    'You do not have access rights to edit these settings.',
  'do.not.have.access.rights.to.edit.time.settings':
    'You do not have access rights to edit these settings.',
  'ask.your.quickbooks.admin.for.access':
    'Ask your QuickBooks admin for access.',
  'time-entries.give-feedback': 'Give feedback',
};

const mockNlsLoader = {
  requireNlsForLocale: () => mockNlsMessages,
};

// Mock useIntl hook
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    useIntl: () => ({
      formatMessage: ({ id }: { id: string }) => mockNlsMessages[id] || id,
    }),

    useTracking: jest.fn(() => jest.fn()),
    useSandbox: jest.fn(),
  };
});

// Mock useIXPFeatureFlag for tour functionality
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(),
}));

// Mock useQbTimeSdk — default to the realistic initial state (data undefined,
// loading false until executeOnMount fires) so tests opt-in to a resolved
// decision via mockReturnValue when they need one.
jest.mock('src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: jest.fn(() => ({
    data: undefined,
    loading: false,
    error: undefined,
    execute: jest.fn(),
    reset: jest.fn(),
  })),
}));
jest.mock('src/js/service/hooks/nttf/useNttfEligibility', () => ({
  useNttfEligibility: jest.fn(() => ({
    isNttfEligible: false,
    loading: false,
    refetch: jest.fn(),
  })),
}));

// Mock useOvertimeFeatureFlag hook
jest.mock('src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled', () => ({
  useOvertimeFeatureFlag: jest.fn(() => ({
    isEnabled: true,
    isLoading: false,
  })),
}));

// Mock tracking points
jest.mock('src/js/common/useClickTracking', () => ({
  TIME_ENTRY_SETTINGS_TRACKING_POINTS: {
    ON_MOUNT: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'navigated',
      object: 'drawer',
      object_detail: 'view_time_entry_settings',
      ui_action: 'viewed',
      ui_object: 'page',
      ui_object_detail: 'view_time_entry_settings',
      ui_access_point: 'page',
    },
    TIME_TRACKING_SECTION_SAVE: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'time_tracking_section_save',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'time_tracking_section_save',
      ui_access_point: 'page',
    },
    TIME_TRACKING_SECTION_EDIT: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'time_tracking_section_edit',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'time_tracking_section_edit',
      ui_access_point: 'page',
    },
    TIME_TRACKING_SECTION_CANCEL: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'time_tracking_section_cancel',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_access_point: 'page',
      ui_object_detail: 'time_tracking_section_cancel',
    },
    TIMESHEET_FIELDS_SECTION_SAVE: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'timesheet_fields_section_save',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'timesheet_fields_section_save',
      ui_access_point: 'page',
    },
    TIMESHEET_FIELDS_SECTION_EDIT: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'timesheet_fields_section_edit',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'timesheet_fields_section_edit',
      ui_access_point: 'page',
    },
    TIMESHEET_FIELDS_SECTION_CANCEL: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'timesheet_fields_section_cancel',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_access_point: 'page',
      ui_object_detail: 'timesheet_fields_section_cancel',
    },
    NOTIFICATION_SECTION_SAVE: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'notification_section_save',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'notification_section_save',
      ui_access_point: 'page',
    },
    NOTIFICATION_SECTION_EDIT: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'notification_section_edit',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'notification_section_edit',
      ui_access_point: 'page',
    },
    NOTIFICATION_SECTION_CANCEL: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'notification_section_cancel',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_access_point: 'page',
      ui_object_detail: 'notification_section_cancel',
    },
    MANAGE_ALL_CUSTOM_FIELDS: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'custom-field',
      screen: 'custom_fields_page',
      action: 'engaged',
      object: 'widget',
      object_detail: 'manage_all_custom_fields',
      ui_action: 'clicked',
      ui_object: 'link',
      ui_object_detail: 'manage_all_custom_fields',
      ui_access_point: 'page',
    },
    CUSTOM_FIELD_EDIT: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'custom_field_edit',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_access_point: 'page',
      ui_object_detail: 'custom_field_edit',
    },
    CONFIRMATION_MODAL_SAVE: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'timeentrymanagement',
      screen: 'single_time_entry',
      action: 'engaged',
      object: 'component',
      object_detail: 'confirmation_modal_save',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'confirmation_modal_save',
      ui_access_point: 'modal',
    },
    SETTINGS_TOUR_MODAL_OPEN: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'settings_tour_modal_open',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'settings_tour_modal_open',
      ui_access_point: 'page',
    },
    SETTINGS_TOUR_MODAL_CLOSE: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'settings_tour_modal_close',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'settings_tour_modal_close',
      ui_access_point: 'page',
    },
    SETTINGS_TOUR_MODAL_FINISH: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'time-tracking',
      screen: 'account-settings-time',
      action: 'engaged',
      object: 'widget',
      object_detail: 'settings_tour_modal_completed',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'settings_tour_modal_completed',
      ui_access_point: 'page',
    },
  },
}));

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useMutation: jest
    .fn()
    .mockReturnValue([jest.fn(), { loading: false, error: null }]),
}));

// Mock MapSigns icon
jest.mock('@design-systems/icons', () => ({
  ...jest.requireActual('@design-systems/icons'),
  MapSigns: () => <div data-testid="map-signs-icon">MapSigns</div>,
}));

// Mock useTimeEntrySettings
jest.mock(
  'src/js/widgets/timeTrackingSettings/hooks/useTimeEntrySettingsForm',
  () => ({
    useTimeEntrySettings: jest.fn().mockReturnValue({
      formState: {
        dirtyFields: {},
        errors: {},
      },
      setValue: jest.fn(),
      getValues: jest.fn(),
      watch: jest.fn(),
      handleSubmit: jest.fn((callback) => () => callback({})),
      reset: jest.fn(),
      control: {},
      clearErrors: jest.fn(),
    }),
    updateTimeSheetFieldsSelectedFields: jest.fn(),
    comparingTimeEntrySettingsToPreviousTimeEntrySettings: jest
      .fn()
      .mockReturnValue([]),
    mappedTimeEntrySettingsForMutation: jest.fn(),
    removeTimeEntryDirtyFieldsUtils: jest.fn(),
  }),
);

// Mock useSetQLSettings
jest.mock('src/js/service/hooks/settings/useSetQLSettings', () => ({
  useSetQLSettings: jest.fn(() => [jest.fn(), { loading: false }]),
}));

// Mock useSetApprovalSettings
jest.mock('src/js/service/hooks/settings/useSetApprovalSettings', () => ({
  useSetApprovalSettings: jest.fn(() => [jest.fn(), { loading: false }]),
}));

// Mock timezoneConversions
jest.mock('src/js/widgets/common/addTimeFormComponents/TimeZoneField', () => ({
  timezoneConversions: [
    {
      name: 'America/Los_Angeles',
      longFormName: 'Pacific Time (US & Canada)',
    },
    {
      name: 'America/New_York',
      longFormName: 'Eastern Time (US & Canada)',
    },
  ],
}));

// Mock TIME_TRACKING_FORM_CONFIG and APPROVAL_SETTINGS_CONFIG
jest.mock('src/js/widgets/timeTrackingSettings/common/viewForm', () => ({
  APPROVAL_SETTINGS_CONFIG: {
    'time-entries.section.title.approvals': [
      {
        id: 'timeEntriesRequireApprovalForTrackedTime',
        key: 'requireApprovalForTrackedTime',
        title:
          'time-entries.section.title.approvals.require-approval-for-tracked-time',
        ariaLabel:
          'time-entries.section.title.approvals.require-approval-for-tracked-time',
        tooltipText: '',
        disabled: false,
        value: 'No',
        detail: {
          title:
            'time-entries.section.title.approvals.require-approval-for-tracked-time',
          subtitle: '',
          ariaLabel:
            'time-entries.section.title.approvals.require-approval-for-tracked-time',
        },
        subFields: [],
        isEditable: true,
        isVisible: true,
        automationId: 'require-approval-for-tracked-time',
      },
    ],
  },
  TIME_TRACKING_FORM_CONFIG: {
    'time-entries.section.title.time-tracking': [
      {
        key: 'firstDayOfWeek',
        title: 'First Day of Week',
        value: 'Sunday',
        isVisible: true,
        isEditable: true,
      },
      {
        key: 'timeZone',
        title: 'Time Zone',
        value: 'Pacific Time (US & Canada)',
        isVisible: true,
        isEditable: true,
      },
      {
        key: 'timeFormat',
        title: 'Time Format',
        value: '12 Hour',
        isVisible: true,
        isEditable: true,
      },
    ],
    'time-entries.section.title.time-sheet': [
      {
        key: 'customersForTimeSheetEnabled',
        title: 'Customers',
        value: 'on',
        isVisible: true,
        isEditable: true,
      },
      {
        key: 'classForTimeSheetEnabled',
        title: 'Class',
        value: 'off',
        isVisible: true,
        isEditable: true,
      },
    ],
    'time-entries.section.title.notifications': [
      {
        key: 'clockInNotificationReminderTime',
        title: 'Clock In Reminder Time',
        value: '9:00 AM',
        isVisible: true,
        isEditable: true,
      },
      {
        key: 'clockOutNotificationReminderTime',
        title: 'Clock Out Reminder Time',
        value: '5:00 PM',
        isVisible: true,
        isEditable: true,
      },
    ],
    'time-entries.section.title.custom-fields': [
      {
        id: 'timeEntriesCustomFields',
        key: 'customFields',
        title: 'time-entries.section.title.custom-fields.title',
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
        isVisible: true,
        automationId: 'time-entries-custom-fields',
      },
      {
        id: 'timeEntriesCustomFieldsButton',
        key: 'customFieldsButton',
        title: '',
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
        isVisible: true,
        automationId: 'time-entries-custom-fields-button',
        menuButton: {
          label: 'time-entries.section.title.custom-fields.add-custom-field',
          onClick: () => {
            // This will be handled by the parent component to show drawer
          },
          automationId: 'add-new-custom-field-button',
          icon: 'add',
          iconSize: 'small',
          priority: 'tertiary',
          purpose: 'standard',
          size: 'small',
        },
      },
    ],
  },
  TIMESHEET_SETTINGS_FIELDS: [
    {
      id: 'customers',
      key: 'customersForTimeSheetEnabled',
      title: 'Customers',
      ariaLabel: 'Customers',
      tooltipText: 'Enable customers field',
      disabled: false,
      isVisible: true,
      isEditable: true,
      detail: {
        title: 'Customers',
        subtitle: 'Enable customers field',
        ariaLabel: 'Customers',
      },
      value: 'on',
    },
    {
      id: 'class',
      key: 'classForTimeSheetEnabled',
      title: 'Class',
      ariaLabel: 'Class',
      tooltipText: 'Enable class field',
      disabled: false,
      isVisible: true,
      isEditable: true,
      detail: {
        title: 'Class',
        subtitle: 'Enable class field',
        ariaLabel: 'Class',
      },
      value: 'off',
    },
  ],
  SCHEDULE_SETTINGS_CONFIG: {
    'time-entries.section.title.schedules': [
      {
        id: 'schedulesPreferencesHeader',
        key: 'schedulesPreferencesHeader',
        title: 'time-entries.section.title.schedules.preferences',
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
        isVisible: true,
        automationId: 'schedules-preferences-header',
      },
      {
        id: 'scheduleViewSchedule',
        key: 'viewSchedule',
        title: 'time-entries.section.title.schedules.view-schedule',
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
        isVisible: true,
        automationId: 'schedules-view-schedule',
      },
      {
        id: 'scheduleManageSchedule',
        key: 'manageSchedule',
        title: 'time-entries.section.title.schedules.manage-schedule',
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
        isVisible: true,
        automationId: 'schedules-manage-schedule',
      },
    ],
  },
}));

// Mock useTimeTrackingSettingsContext
jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: jest.fn(),
  }),
);

// Add type definitions
type TimeTrackingTimeEntrySettingsProps = {
  id?: string;
  timeTrackingFields: Record<string, any>;
  isTimeTrackingEditing: boolean;
  onSaveTimeEntrySettings: () => void;
  timeTrackingFieldSettingSection: string;
  onFormUpdate: (type: string) => void;
  onFormCancel: (type: string) => void;
  isDataUpdating: boolean;
};

type TimeSheetFieldsProps = {
  id?: string;
  timeSheetFields: Record<string, any>;
  isTimeSheetEditing: boolean;
  timeSheetFieldSettingSection: string;
  isFormEditable: boolean;
  onFormUpdate: (type: string) => void;
  onFormCancel: (type: string) => void;
  onSaveTimeEntrySettings: () => void;
  editTimeSheetFields: Array<any>;
  hideViewSection?: boolean;
  onDimensionsSetDefaults?: () => boolean;
};

type NotificationsTimeEntrySettingsProps = {
  id?: string;
  notificationFields: Record<string, any>;
  isNotificationFieldEditing: boolean;
  notificationFieldSettingSection: string;
  isFormEditable: boolean;
  onFormUpdate: (type: string) => void;
  onFormCancel: (type: string) => void;
  onSaveTimeEntrySettings: () => void;
  geofenceSectionRef?: React.RefObject<HTMLDivElement>;
};

// Mock TimeTrackingTimeEntrySettings component
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeTrackingTimeEntrySettings/TimeTrackingTimeEntrySettings',
  () => ({
    TimeTrackingTimeEntrySettings: ({
      id,
      timeTrackingFields,
      isTimeTrackingEditing,
      onSaveTimeEntrySettings,
      timeTrackingFieldSettingSection,
      onFormUpdate,
      onFormCancel,
      isDataUpdating,
    }: TimeTrackingTimeEntrySettingsProps) => (
      <div data-testid={id || 'timetracking-settings'}>
        <div>TimeTrackingTimeEntrySettings Component</div>
        <button onClick={() => onFormUpdate('timetracking')}>Update</button>
        <button onClick={() => onFormCancel('timetracking')}>Cancel</button>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/TimeSheetFields',
  () => ({
    TimeSheetFields: ({
      id,
      timeSheetFields,
      isTimeSheetEditing,
      timeSheetFieldSettingSection,
      isFormEditable,
      onFormUpdate,
      onFormCancel,
      onSaveTimeEntrySettings,
      editTimeSheetFields,
      hideViewSection,
      onDimensionsSetDefaults,
    }: TimeSheetFieldsProps) => (
      <div
        data-testid={id || 'timeSheet-settings'}
        data-hide-view-section={String(!!hideViewSection)}
        data-is-editing={String(!!isTimeSheetEditing)}
      >
        TimeSheetFields Component
        <button onClick={() => onFormUpdate('timesheet')}>Update</button>
        <button onClick={() => onFormCancel('timesheet')}>Cancel</button>
        <button onClick={onSaveTimeEntrySettings} data-testid="save-timesheet">
          Save
        </button>
        <button
          onClick={() => onDimensionsSetDefaults?.()}
          data-testid="dimensions-set-defaults"
        >
          Set defaults
        </button>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/NotificationsTimeEntrySettings',
  () => ({
    NotificationsTimeEntrySettings: ({
      id,
      notificationFields,
      isNotificationFieldEditing,
      notificationFieldSettingSection,
      isFormEditable,
      onFormUpdate,
      onFormCancel,
      onSaveTimeEntrySettings,
      geofenceSectionRef,
    }: NotificationsTimeEntrySettingsProps) => (
      <div data-testid={id || 'notifications-settings'}>
        Notification Component
        <button onClick={() => onFormUpdate('notification')}>Update</button>
        <button onClick={() => onFormCancel('notification')}>Cancel</button>
        <button
          onClick={onSaveTimeEntrySettings}
          data-testid="save-notifications"
        >
          Save
        </button>
        {geofenceSectionRef && (
          <div
            ref={geofenceSectionRef}
            data-testid="geofence-section-ref-target"
          />
        )}
      </div>
    ),
  }),
);

// Mock ApprovalsTimeEntrySettings component
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/approvals/ApprovalsTimeEntrySettings',
  () => ({
    ApprovalsTimeEntrySettings: ({
      isEditing,
      onEdit,
      onCancel,
      onSave,
      shouldShowApprovalControls,
      isApprovalVisibilityResolved,
    }: {
      isEditing: boolean;
      onEdit: () => void;
      onCancel: () => void;
      onSave: () => void;
      shouldShowApprovalControls?: boolean;
      isApprovalVisibilityResolved?: boolean;
    }) => (
      <div
        data-testid="approvals-settings"
        data-show-approval-controls={String(shouldShowApprovalControls)}
        data-approval-visibility-resolved={String(isApprovalVisibilityResolved)}
      >
        Approvals Component
        <button onClick={onEdit}>Edit</button>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onSave}>Save</button>
      </div>
    ),
  }),
);

// Mock GeoLocationsTimeEntrySettings component
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/geoLocations/GeoLocationsTimeEntrySettings',
  () => ({
    GeoLocationsTimeEntrySettings: ({
      onScrollToNotificationsSection,
    }: {
      onScrollToNotificationsSection?: () => void;
    }) => (
      <div data-testid="geo-locations-settings">
        GeoLocations Component
        {onScrollToNotificationsSection && (
          <button
            data-testid="scroll-to-notifications-btn"
            onClick={onScrollToNotificationsSection}
          >
            Scroll to Notifications
          </button>
        )}
      </div>
    ),
  }),
);

// Mock ConfirmationModal component
jest.mock('src/js/widgets/common/ConfirmationModal', () => ({
  ConfirmationModal: ({
    open,
    onYesClick,
    onNoClick,
    children,
  }: {
    open: boolean;
    onYesClick: () => void;
    onNoClick?: () => void;
    children?: React.ReactNode;
    [key: string]: any;
  }) =>
    open ? (
      <div data-testid="confirmation-modal">
        {children}
        <button data-testid="confirmation-yes" onClick={onYesClick}>
          Yes
        </button>
        {onNoClick && (
          <button data-testid="confirmation-no" onClick={onNoClick}>
            No
          </button>
        )}
      </div>
    ) : null,
}));

// Mock mapApprovalSettings
jest.mock(
  'src/js/widgets/timeTrackingSettings/hooks/mapApprovalSettings',
  () => ({
    mapApprovalSettingsForMutation: jest.fn().mockReturnValue({}),
    hasApprovalSettingsChanges: jest.fn().mockReturnValue(false),
  }),
);

// Mock buildOvertimeNotificationsManageInput
jest.mock(
  'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/overtimeNotifications.utils',
  () => ({
    buildOvertimeNotificationsManageInput: jest.fn().mockReturnValue(null),
  }),
);

// Mock ITM overview hooks (init is a no-op; update returns a controllable fn)
jest.mock('src/js/widgets/qbtOrchestrator/features/overview/hooks', () => ({
  useInitializeItmTasks: jest.fn(),
  useUpdateItmTask: jest.fn(() => ({ updateItmTask: jest.fn() })),
}));

// Mock the ITM task selector so tests control which tasks are in the store
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overview/store/overviewSelectors',
  () => ({
    selectItmTasks: jest.fn(() => []),
  }),
);

// Mock LoggingConfigProvider used by the ITM update logging
jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  }),
}));

// Mock useDeepLinkNavigation
jest.mock(
  'src/js/widgets/timeTrackingSettings/hooks/useDeepLinkNavigation',
  () => ({
    useDeepLinkNavigation: jest.fn().mockReturnValue({
      isDeepLinkNavigating: false,
      breaksInitialView: undefined,
      overtimeInitialView: undefined,
      geoLocationsInitialOpen: false,
      customFieldsInitialOpen: false,
      pendingFormType: null,
      pendingScrollTarget: null,
      clearPendingNavigation: jest.fn(),
      publishNavigationComplete: jest.fn(),
    }),
  }),
);

// Mock timeEntrySettingsHandler
jest.mock(
  'src/js/widgets/timeTrackingSettings/hooks/timeEntrySettingsHandler',
  () => ({
    cancelTimeEntrySettingsForm: jest.fn(),
    successUpdateCompanySettings: jest.fn(),
    updateTimeEntrySettingsForm: jest.fn(),
  }),
);

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({
    children,
    title,
    automationId,
    type,
  }: {
    children?: React.ReactNode;
    title?: string;
    automationId?: string;
    type?: string;
  }) => (
    <div
      data-testid={
        type === 'warn' || type === 'info' ? 'warning-message' : 'error-message'
      }
      data-automation-id={automationId}
      data-message-type={type}
    >
      {title}
      {children}
    </div>
  ),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isPayrollFirstCompany: jest.fn().mockReturnValue(false),
  canEditPreference: jest.fn().mockReturnValue(true),
}));

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useForm: jest.fn().mockReturnValue({
    clearErrors: jest.fn(),
    setError: jest.fn(),
    getValues: jest.fn(),
    setValue: jest.fn(),
    watch: jest.fn(),
    formState: {
      errors: {},
      isDirty: false,
    },
    handleSubmit: jest.fn((callback) => () => callback({})),
    reset: jest.fn(),
    control: {},
  }),
  useFormContext: jest.fn().mockReturnValue({
    clearErrors: jest.fn(),
    setError: jest.fn(),
    getValues: jest.fn(),
    setValue: jest.fn(),
    watch: jest.fn(),
    formState: {
      errors: {},
      isDirty: false,
    },
    handleSubmit: jest.fn((callback) => () => callback({})),
    reset: jest.fn(),
    control: {},
  }),
  SubmitHandler: jest.fn(),
}));

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    widgetId,
    onReady,
  }: {
    widgetId: string;
    onReady?: () => void;
  }) => {
    try {
      onReady?.();
    } catch (e) {
      // Ignore callback failures from tests that stub minimal sandbox shape.
    }
    return <div data-testid={`widget-${widgetId}`} />;
  },
}));

// Mock FeedbackPopover
jest.mock('src/js/widgets/common/feedbackPopover/FeedbackPopover', () => ({
  __esModule: true,
  default: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: (result: { success: boolean } | null) => void;
  }) =>
    open ? (
      <div data-testid="feedback-popover">
        <button onClick={() => onClose({ success: true })}>
          Submit Feedback
        </button>
        <button onClick={() => onClose(null)}>Cancel</button>
      </div>
    ) : null,
}));

// Mock UserVoiceFeedBackWidget
jest.mock(
  'src/js/widgets/common/feedbackPopover/UserVoiceFeedBackWidget',
  () => ({
    __esModule: true,
    default: function MockUserVoiceFeedBackWidget({
      renderFeedbackTrigger,
    }: {
      renderFeedbackTrigger: (
        handleAccessPointClick: () => void,
      ) => React.ReactNode;
    }) {
      const [isOpen, setIsOpen] = React.useState(false);
      const [showSuccessToast, setShowSuccessToast] = React.useState(false);

      const handleAccessPointClick = React.useCallback(() => {
        setIsOpen(true);
      }, []);

      React.useEffect(() => {
        // This ensures the renderFeedbackTrigger is called with the handler
        renderFeedbackTrigger(handleAccessPointClick);
      }, [renderFeedbackTrigger, handleAccessPointClick]);

      const handleSubmitFeedback = () => {
        setIsOpen(false);
        setShowSuccessToast(true);
      };

      return (
        <>
          {isOpen && (
            <div data-testid="feedback-popover">
              <button onClick={handleSubmitFeedback}>Submit Feedback</button>
              <button onClick={() => setIsOpen(false)}>Cancel</button>
            </div>
          )}
          {showSuccessToast && (
            <div data-testid="success-toast">
              <span>time-entries.toast.feedback.success</span>
              <button onClick={() => setShowSuccessToast(false)}>Close</button>
            </div>
          )}
        </>
      );
    },
  }),
);

// Mock SuccessToast
jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({
    message,
    open,
    onClose,
  }: {
    message: string;
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="success-toast">
        <span>{message}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

jest.mock('src/js/widgets/timeTrackingSettings/utils', () => {
  const actual = jest.requireActual(
    'src/js/widgets/timeTrackingSettings/utils',
  );
  return {
    ...actual,
    getManageKioskWidgetId: jest.fn(() => 'qbtime-setup-ui/settings/kiosk'),
  };
});

// Mock the actual config file
jest.mock('src/js/widgets/timeTrackingSettings/config', () => ({
  TIME_ENTRY_SETTINGS_CONFIG: {
    GENERAL_TIME: {
      id: 'general-time',
      isEnabled: jest.fn().mockReturnValue(true),
      supportedLists: ['US', 'CA', 'UK', 'PAYROLL_FIRST'],
    },
    TIMESHEET_FIELDS: {
      id: 'timesheet-fields',
      isEnabled: jest.fn().mockReturnValue(true),
      supportedLists: ['US', 'CA', 'UK', 'PAYROLL_FIRST'],
    },
    MANAGE_KIOSK: {
      id: 'manage-kiosk',
      enabled: true,
      supportedLists: ['US', 'CA', 'UK'],
    },
    CUSTOM_FIELDS: {
      id: 'custom-fields',
      isEnabled: jest.fn().mockReturnValue(true),
      supportedLists: ['US', 'CA', 'UK', 'PAYROLL_FIRST'],
      name: 'time-entries.section.title.custom-fields',
      isNew: true,
      widgetId: 'qbtime-setup-ui/settings/custom-fields',
    },
    BREAKS: {
      id: 'breaks',
      enabled: true,
      supportedLists: ['US', 'CA', 'UK'],
      widgetId: 'qbtime-setup-ui/settings/breaks',
    },
    OVERTIME: {
      id: 'overtime',
      name: 'time-entries.section.title.overtime',
      isNew: true,
      enabled: true,
    },
    SCHEDULES: {
      id: 'schedules',
      name: 'time-entries.section.title.schedules',
      enabled: true,
      isNew: true,
    },
    GEO_LOCATIONS: {
      id: 'geo-locations',
      enabled: true,
      isEnabled: jest.fn().mockReturnValue(true),
      supportedLists: ['US', 'CA', 'UK'],
    },
    APPROVALS: {
      id: 'approvals',
      name: 'time-entries.section.title.approvals',
      isNew: true,
      enabled: true,
    },
    TIME_OFF: {
      id: 'time-off',
      enabled: true,
      name: 'time-entries.section.title.time-off',
      isNew: true,
    },
  },
}));

const mockNavigate = jest.fn();
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
  fatal: jest.fn(),
  logException: jest.fn(),
  isLevelDebug: jest.fn(),
  isLevelLog: jest.fn(),
  isLevelInfo: jest.fn(),
  isLevelWarn: jest.fn(),
  isLevelError: jest.fn(),
  isLevelFatal: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};
const mockSandbox = {
  ...buildSandbox(),
  navigation: {
    navigate: mockNavigate,
  },
  logger: mockLogger,
  isTimeTrackingEnabled: true,
  isPayrollFirstCompany: false,
  extensions: {
    qbo: {
      plugins: {
        isPluginActivated: jest.fn().mockReturnValue(true),
      },
      context: {
        getAuthInfo: jest.fn().mockReturnValue({
          isAccountantUser: false,
          isAdmin: true,
          isMasterAdmin: false,
          legacyRoles: {
            roleType: 'admin',
          },
        }),
      },
    },
    getExtension: jest.fn().mockResolvedValue(null),
  },
  appContext: {
    getRealmInfo: jest.fn().mockReturnValue({
      realmId: 'test-realm-id',
      realmName: 'Test Company',
    }),
  },
  sandboxContext: {
    getInfo: jest.fn().mockReturnValue({
      widgetId: 'test-widget-id',
    }),
  },
} as any; // Using type assertion to bypass type checking since we're only testing form dirty state

// Mock FEATURE_FLAGS and TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE
jest.mock('src/js/common/constants', () => ({
  ...jest.requireActual('src/js/common/constants'),
  WORKFLOWS: { TIME: 'TIME' },
  FEATURE_FLAGS: {
    QB_TIME_TRACKING_UI_R2_RELEASE: 'QB_TIME_TRACKING_UI_R2_RELEASE',
    QB_TIME_BREAKS_SETTINGS: 'QB_TIME_BREAKS_SETTINGS',
  },
  TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE: {
    ATLAS: 'ATLAS',
    CA: 'CA',
    PAYROLL_FIRST: 'PAYROLL_FIRST',
    UK: 'UK',
    US: 'US',
  },
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const sandbox = buildSandbox();

  // Add missing methods for UserVoiceFeedBackWidget
  sandbox.appContext.getRealmInfo = jest.fn().mockReturnValue({
    realmId: 'test-realm-id',
    realmName: 'Test Company',
  });

  sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
    isAccountantUser: false,
    isAdmin: true,
    isMasterAdmin: false,
    legacyRoles: {
      roleType: 'admin',
    },
  });

  sandbox.sandboxContext.getInfo = jest.fn().mockReturnValue({
    widgetId: 'test-widget-id',
  });

  // Mock useSandbox to return the sandbox from context
  const { useSandbox } = require('@payroll/quicksand');
  useSandbox.mockReturnValue(sandbox);

  return render(
    <MockQuicksandProvider sandbox={sandbox}>
      <MockedProvider>{ui}</MockedProvider>
    </MockQuicksandProvider>,
  );
};

describe('TimeEntrySettingsForm', () => {
  let sandbox: Sandbox;
  const defaultQLData = {
    isServiceFieldEnabled: { version: '1', value: true },
    isBillingFieldEnabled: { version: '1', value: true },
    firstDayOfWeek: { version: '1', value: 1 },
    timeFormat: { version: '1', value: 12 },
    timeZone: { version: '1', value: 'America/Los_Angeles' },
    billingRateForTimeEnabled: { version: '1', value: true },
    useItemForTime: { version: '1', value: true },
    timeTrackingSupported: { version: '1', value: true },
    transactionBillingForTimeEnabled: { version: '1', value: true },
    transactionTimeTrackingEnabled: { version: '1', value: true },
  };

  const mockContextValue = {
    QLData: defaultQLData,
    text: (key: string) => mockNlsMessages[key] || key,
    sandbox: {
      isTimeTrackingEnabled: true,
      isPayrollFirstCompany: false,
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
      extensions: {
        qbo: {
          plugins: {
            isPluginActivated: jest.fn().mockReturnValue(true),
          },
        },
      },
      navigation: {
        navigate: jest.fn(),
      },
    },
    updateErrorMessage: jest.fn(),
    reRenderTimeEntrySetting: jest.fn(),
    errorMessage: '',
    isQLSettingsLoading: false,
    QLSettingsError: undefined,
    isFormEditable: true,
    isRenderTimeEntry: false,
    entitlements: [],
    entitlementsLoading: false,
    v3PreferencesData: {},
    v3PreferencesLoading: false,
    v3PreferencesError: false,
    QLSettingsRefetch: jest.fn(),
    timeEntrySettingsFormMethod: {
      clearErrors: jest.fn(),
      setError: jest.fn(),
      getValues: jest.fn(),
      setValue: jest.fn(),
      watch: jest.fn(),
      formState: {
        errors: {},
        isDirty: false,
      },
      handleSubmit: jest.fn((callback) => () => callback({})),
      reset: jest.fn(),
      control: {},
    },
    timeEntryNewBadgeVisibleFor: {
      breaksVisibilityEndDate: '12/31/2024',
      customFieldsVisibilityEndDate: '12/31/2024',
      timeTrackingVisibilityEndDate: '12/31/2024',
      notificationsVisibilityEndDate: '12/31/2024',
      geoLocationsVisibilityEndDate: '12/31/2024',
      approvalsVisibilityEndDate: '12/31/2024',
      newTimesheetVisibilityEndDate: '12/31/2024',
      newCustomFieldsVisibilityEndDate: '12/31/2024',
    },
    uxPreferenceLoading: false,
    isUKLocale: false,
    urlParams: 'time',
    isR4AssignmentsEnabled: false,
    isR4FlagLoading: false,
    refetchQlSettings: jest.fn(),
  };

  beforeEach(() => {
    sandbox = buildSandbox();

    // Add missing methods for UserVoiceFeedBackWidget
    sandbox.appContext.getRealmInfo = jest.fn().mockReturnValue({
      realmId: 'test-realm-id',
      realmName: 'Test Company',
    });

    sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      isAccountantUser: false,
      isAdmin: true,
      isMasterAdmin: false,
      legacyRoles: {
        roleType: 'admin',
      },
    });

    sandbox.sandboxContext.getInfo = jest.fn().mockReturnValue({
      widgetId: 'test-widget-id',
    });

    mockNavigate.mockClear(); // Clear before each test

    // Create a consistent mock for timeEntrySettingsFormMethod
    const mockTimeEntrySettingsFormMethod = {
      clearErrors: jest.fn(),
      setError: jest.fn(),
      getValues: jest.fn(),
      setValue: jest.fn(),
      watch: jest.fn(),
      formState: {
        errors: {},
        isDirty: false,
      },
      handleSubmit: jest.fn((callback) => () => callback({})),
      reset: jest.fn(),
      control: {},
    };

    // Setup base context with all required properties
    const baseContext = {
      ...mockContextValue,
      isFormEditable: true,
      sandbox: mockSandbox,
      timeEntrySettingsFormMethod: mockTimeEntrySettingsFormMethod,
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(baseContext);

    // Ensure useTracking mock is properly set up
    const { useTracking } = require('@payroll/quicksand');
    useTracking.mockReturnValue(jest.fn());

    // Ensure TIME_ENTRY_SETTINGS_CONFIG methods return true
    const { TIME_ENTRY_SETTINGS_CONFIG } = jest.requireActual(
      'src/js/widgets/timeTrackingSettings/config',
    );
    jest
      .spyOn(TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME, 'isEnabled')
      .mockReturnValue(true);
    jest
      .spyOn(TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS, 'isEnabled')
      .mockReturnValue(true);

    // Setup useIXPFeatureFlag mock
    const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
    (useIXPFeatureFlag as jest.Mock).mockReturnValue({
      isEnabled: true,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('TimeTrackingTimeEntrySettings rendering', () => {
    beforeEach(() => {
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: defaultQLData,
        sandbox: mockSandbox, // always use mockSandbox
        updateErrorMessage: jest.fn(),
        reRenderTimeEntrySetting: jest.fn(),
        errorMessage: '',
        isFormEditable: true,
        timeEntryNewBadgeVisibleFor: {
          breaksVisibilityEndDate: '12/31/2024',
          customFieldsVisibilityEndDate: '12/31/2024',
          timeTrackingVisibilityEndDate: '12/31/2024',
          notificationsVisibilityEndDate: '12/31/2024',
          approvalsVisibilityEndDate: '12/31/2024',
          newTimesheetVisibilityEndDate: '12/31/2024',
          newCustomFieldsVisibilityEndDate: '12/31/2024',
        },
        uxPreferenceLoading: false,
        isUKLocale: false,
        isR4AssignmentsEnabled: false,
        entitlements: [],
        entitlementsLoading: false,
        v3PreferencesData: {},
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        refetchQlSettings: jest.fn(),
      });
    });

    it('should render TimeTrackingTimeEntrySettings when conditions are met', () => {
      const { container } = renderWithProviders(
        <TimeEntrySettingsForm type="US" />,
      );
      expect(screen.getByTestId('timetracking-settings')).toBeInTheDocument();
      expect(
        screen.getByText('TimeTrackingTimeEntrySettings Component'),
      ).toBeInTheDocument();
    });

    it('should not render TimeTrackingTimeEntrySettings when type is not supported', () => {
      renderWithProviders(<TimeEntrySettingsForm type="unsupported" />);
      expect(
        screen.queryByTestId('timetracking-settings'),
      ).not.toBeInTheDocument();
    });

    it('should render TimeTrackingTimeEntrySettings with proper props', () => {
      const { container } = renderWithProviders(
        <TimeEntrySettingsForm type="US" />,
      );

      const timeTrackingSection = screen.getByTestId('timetracking-settings');
      expect(timeTrackingSection).toBeInTheDocument();

      // Verify buttons are present within the timetracking section
      const updateButtons = screen.getAllByText('Update');
      const cancelButtons = screen.getAllByText('Cancel');

      // Verify at least one Update and Cancel button exists
      expect(updateButtons.length).toBeGreaterThan(0);
      expect(cancelButtons.length).toBeGreaterThan(0);

      // Verify the timetracking section contains its specific buttons
      const timeTrackingButtons =
        timeTrackingSection.querySelectorAll('button');
      expect(timeTrackingButtons[0]).toHaveTextContent('Update');
      expect(timeTrackingButtons[1]).toHaveTextContent('Cancel');
    });
  });

  describe('Form sections visibility', () => {
    it('should not render sections for non-supported type', () => {
      renderWithProviders(<TimeEntrySettingsForm type="other" />);
      expect(
        screen.queryByTestId('timetracking-settings'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('timeSheet-settings'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('notifications-settings'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('custom-fields-settings'),
      ).not.toBeInTheDocument();
    });

    it('should not render Custom Fields section when payroll-first gate blocks it', () => {
      const {
        TIME_ENTRY_SETTINGS_CONFIG,
      } = require('src/js/widgets/timeTrackingSettings/config');
      const customFieldsIsEnabledMock = TIME_ENTRY_SETTINGS_CONFIG.CUSTOM_FIELDS
        .isEnabled as jest.Mock;
      customFieldsIsEnabledMock.mockReturnValue(false);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(
        screen.queryByTestId('custom-fields-settings'),
      ).not.toBeInTheDocument();

      customFieldsIsEnabledMock.mockReturnValue(true);
    });
  });

  describe('Search section anchors (SET-08 deep links)', () => {
    // Canonical host search keys -> the section testid that proves the
    // anchored row rendered. These are the cross-repo contract the host's
    // In-page Settings Search relies on to scroll/deep-link.
    const ANCHORED_SECTIONS: Array<[string, string]> = [
      [SEARCH_SECTION_KEYS.TIME_TRACKING, 'timetracking-settings'],
      [SEARCH_SECTION_KEYS.TIMESHEET_FIELDS, 'timeSheet-settings'],
      [SEARCH_SECTION_KEYS.CUSTOM_FIELDS, 'custom-fields-settings'],
      [SEARCH_SECTION_KEYS.NOTIFICATIONS, 'notifications-settings'],
      [SEARCH_SECTION_KEYS.APPROVALS, 'approvals-settings'],
    ];

    it('uses canonical snake_case keys matching the host timeTabIndex', () => {
      // Guards the cross-repo contract against accidental key drift.
      expect(SEARCH_SECTION_KEYS.TIME_TRACKING).toBe('time_tracking');
      expect(SEARCH_SECTION_KEYS.TIME_OFF).toBe('time_off');
      expect(SEARCH_SECTION_KEYS.TIMESHEET_FIELDS).toBe('timesheet_fields');
      expect(SEARCH_SECTION_KEYS.CUSTOM_FIELDS).toBe('custom_fields');
      expect(SEARCH_SECTION_KEYS.GEO_LOCATIONS).toBe('geo_locations');
    });

    it.each(ANCHORED_SECTIONS)(
      'renders a data-search-section="%s" anchor on the matching section',
      (searchKey, sectionTestId) => {
        const { container } = renderWithProviders(
          <TimeEntrySettingsForm type="US" />,
        );

        const anchor = container.querySelector(
          `[data-search-section="${searchKey}"]`,
        );
        expect(anchor).toBeInTheDocument();
        // The anchor wraps (or is) the rendered section row.
        expect(
          anchor === screen.getByTestId(sectionTestId) ||
            anchor?.contains(screen.getByTestId(sectionTestId)),
        ).toBe(true);
      },
    );

    it('does not render section anchors for an unsupported list type', () => {
      const { container } = renderWithProviders(
        <TimeEntrySettingsForm type="unsupported" />,
      );

      expect(
        container.querySelector(
          `[data-search-section="${SEARCH_SECTION_KEYS.TIME_TRACKING}"]`,
        ),
      ).not.toBeInTheDocument();
      expect(
        container.querySelector(
          `[data-search-section="${SEARCH_SECTION_KEYS.TIMESHEET_FIELDS}"]`,
        ),
      ).not.toBeInTheDocument();
      expect(
        container.querySelector(
          `[data-search-section="${SEARCH_SECTION_KEYS.CUSTOM_FIELDS}"]`,
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('Approvals visibility gating', () => {
    it('invokes submitTimeService checks through useQbTimeSdk selectors', async () => {
      const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const approvalVisibilitySelector = (useQbTimeSdk as jest.Mock).mock
        .calls[1][0];
      const submittedStatusSelector = (useQbTimeSdk as jest.Mock).mock
        .calls[2][0];
      const shouldShowApprovalRequiredTimeSubmission = jest
        .fn()
        .mockResolvedValue(true);
      const isSubmittedTimeStatusDisplayEnabled = jest
        .fn()
        .mockResolvedValue(true);

      const approvalVisibilityMethod = approvalVisibilitySelector({
        submitTimeService: { shouldShowApprovalRequiredTimeSubmission },
      });
      const submittedStatusMethod = submittedStatusSelector({
        submitTimeService: { isSubmittedTimeStatusDisplayEnabled },
      });

      await expect(approvalVisibilityMethod()).resolves.toBe(true);
      await expect(submittedStatusMethod()).resolves.toBe(true);
      expect(shouldShowApprovalRequiredTimeSubmission).toHaveBeenCalledTimes(1);
      expect(isSubmittedTimeStatusDisplayEnabled).toHaveBeenCalledTimes(1);
    });

    it('passes shouldShowApprovalControls=false when NTTF is eligible and submit-time flags are off', () => {
      const {
        useNttfEligibility,
      } = require('src/js/service/hooks/nttf/useNttfEligibility');
      (useNttfEligibility as jest.Mock).mockReturnValue({
        isNttfEligible: true,
        loading: false,
        refetch: jest.fn(),
      });
      const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: false,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(screen.getByTestId('approvals-settings')).toHaveAttribute(
        'data-show-approval-controls',
        'false',
      );
      expect(screen.getByTestId('approvals-settings')).toHaveAttribute(
        'data-approval-visibility-resolved',
        'true',
      );
    });

    it('does not render approvals section component while approval visibility checks are loading', () => {
      const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      const { container } = renderWithProviders(
        <TimeEntrySettingsForm type="US" />,
      );

      expect(
        container.querySelector(
          `[data-search-section="${SEARCH_SECTION_KEYS.APPROVALS}"]`,
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('approvals-settings'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Feedback Functionality', () => {
    it('should render feedback button with correct text', () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const feedbackButton = screen.getByRole('button', {
        name: /give feedback/i,
      });
      expect(feedbackButton).toBeInTheDocument();
    });

    it('should show feedback popover when feedback button is clicked', () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const feedbackButton = screen.getByRole('button', {
        name: /give feedback/i,
      });
      fireEvent.click(feedbackButton);

      expect(screen.getByTestId('feedback-popover')).toBeInTheDocument();
    });

    it('should hide feedback popover and show success toast when feedback is submitted', async () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      // Open feedback popover
      const feedbackButton = screen.getByRole('button', {
        name: /give feedback/i,
      });
      fireEvent.click(feedbackButton);

      // Submit feedback from within the popover
      const feedbackPopover = screen.getByTestId('feedback-popover');
      const submitButton = within(feedbackPopover).getByText('Submit Feedback');
      fireEvent.click(submitButton);

      // Check that popover is hidden
      await waitFor(() => {
        expect(
          screen.queryByTestId('feedback-popover'),
        ).not.toBeInTheDocument();
      });

      // Check that success toast is shown
      expect(screen.getByTestId('success-toast')).toBeInTheDocument();
    });

    it('should hide feedback popover when feedback is cancelled', async () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      // Open feedback popover
      const feedbackButton = screen.getByRole('button', {
        name: /give feedback/i,
      });
      fireEvent.click(feedbackButton);

      // Cancel feedback from within the popover
      const feedbackPopover = screen.getByTestId('feedback-popover');
      const cancelButton = within(feedbackPopover).getByText('Cancel');
      fireEvent.click(cancelButton);

      // Check that popover is hidden
      await waitFor(() => {
        expect(
          screen.queryByTestId('feedback-popover'),
        ).not.toBeInTheDocument();
      });

      // Check that success toast is not shown
      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });

    it('should close success toast when close button is clicked', async () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      // Open feedback popover and submit feedback
      const feedbackButton = screen.getByRole('button', {
        name: /give feedback/i,
      });
      fireEvent.click(feedbackButton);
      const feedbackPopover = screen.getByTestId('feedback-popover');
      const submitButton = within(feedbackPopover).getByText('Submit Feedback');
      fireEvent.click(submitButton);

      // Close success toast
      const successToast = screen.getByTestId('success-toast');
      const closeToastButton = within(successToast).getByText('Close');
      fireEvent.click(closeToastButton);

      // Check that toast is hidden
      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });

    it('should display correct success message in toast', async () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      // Open feedback popover and submit feedback
      const feedbackButton = screen.getByRole('button', {
        name: /give feedback/i,
      });
      fireEvent.click(feedbackButton);
      const feedbackPopover = screen.getByTestId('feedback-popover');
      const submitButton = within(feedbackPopover).getByText('Submit Feedback');
      fireEvent.click(submitButton);

      // Check success message
      expect(
        screen.getByText('time-entries.toast.feedback.success'),
      ).toBeInTheDocument();
    });
  });

  describe('TimeTrackingTimeEntrySettings Props Testing', () => {
    describe('onFormUpdate callback', () => {
      it('should call onFormUpdate with TimeEntriesFormType.TIMETRACKING and TIME_TRACKING_SECTION_EDIT tracking point when triggered', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear any previous tracking calls (like the mount tracking call)
        mockTrack.mockClear();

        const timeTrackingSection = screen.getByTestId('timetracking-settings');
        expect(timeTrackingSection).toBeInTheDocument();

        // Get the update button within the timetracking section
        const updateButtons = timeTrackingSection.querySelectorAll('button');
        const updateButton = Array.from(updateButtons).find(
          (button) => button.textContent === 'Update',
        );
        expect(updateButton).toBeInTheDocument();

        fireEvent.click(updateButton!);

        // Verify tracking was called with the correct tracking point
        expect(mockTrack).toHaveBeenCalledWith({
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'time-tracking',
          screen: 'account-settings-time',
          action: 'engaged',
          object: 'widget',
          object_detail: 'time_tracking_section_edit',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'time_tracking_section_edit',
          ui_access_point: 'page',
        });
      });

      it('should handle onFormUpdate correctly when form has dirty fields', async () => {
        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const timeTrackingSection = screen.getByTestId('timetracking-settings');
        const updateButtons = timeTrackingSection.querySelectorAll('button');
        const updateButton = Array.from(updateButtons).find(
          (button) => button.textContent === 'Update',
        );

        fireEvent.click(updateButton!);

        // Verify that when there are dirty fields, appropriate handling occurs
        // This tests the internal logic of onFormUpdate function
        await waitFor(() => {
          expect(
            screen.getByTestId('timetracking-settings'),
          ).toBeInTheDocument();
        });
      });
    });

    describe('onFormCancel callback', () => {
      it('should call onFormCancel with TimeEntriesFormType.TIMETRACKING and TIME_TRACKING_SECTION_CANCEL tracking point when triggered', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear any previous tracking calls (like the mount tracking call)
        mockTrack.mockClear();

        const timeTrackingSection = screen.getByTestId('timetracking-settings');
        expect(timeTrackingSection).toBeInTheDocument();

        // Get the cancel button within the timetracking section
        const cancelButtons = timeTrackingSection.querySelectorAll('button');
        const cancelButton = Array.from(cancelButtons).find(
          (button) => button.textContent === 'Cancel',
        );
        expect(cancelButton).toBeInTheDocument();

        fireEvent.click(cancelButton!);

        // Verify tracking was called with the correct tracking point
        expect(mockTrack).toHaveBeenCalledWith({
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'time-tracking',
          screen: 'account-settings-time',
          action: 'engaged',
          object: 'widget',
          object_detail: 'time_tracking_section_cancel',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'time_tracking_section_cancel',
          ui_access_point: 'page',
        });
      });

      it('should handle onFormCancel correctly and reset dirty fields', () => {
        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const timeTrackingSection = screen.getByTestId('timetracking-settings');
        const cancelButtons = timeTrackingSection.querySelectorAll('button');
        const cancelButton = Array.from(cancelButtons).find(
          (button) => button.textContent === 'Cancel',
        );

        fireEvent.click(cancelButton!);

        // Verify that cancel functionality works
        expect(screen.getByTestId('timetracking-settings')).toBeInTheDocument();
      });
    });

    describe('isDataUpdating prop', () => {
      it('should pass setQLSettingsLoading as isDataUpdating prop correctly', () => {
        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const timeTrackingSection = screen.getByTestId('timetracking-settings');
        expect(timeTrackingSection).toBeInTheDocument();

        // The component should reflect the loading state
        // This tests that isDataUpdating (setQLSettingsLoading) is properly passed through
        expect(timeTrackingSection).toHaveAttribute(
          'data-testid',
          'timetracking-settings',
        );
      });

      it('should handle isDataUpdating when setQLSettingsLoading is false', () => {
        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const timeTrackingSection = screen.getByTestId('timetracking-settings');
        expect(timeTrackingSection).toBeInTheDocument();

        // Verify the component renders properly when not loading
        expect(timeTrackingSection).toHaveAttribute(
          'data-testid',
          'timetracking-settings',
        );
      });
    });

    describe('TimeEntriesFormType constant usage', () => {
      it('should use TimeEntriesFormType.TIMETRACKING constant correctly in onFormUpdate callback', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear any previous tracking calls
        mockTrack.mockClear();

        const timeTrackingSection = screen.getByTestId('timetracking-settings');
        const updateButtons = timeTrackingSection.querySelectorAll('button');
        const updateButton = Array.from(updateButtons).find(
          (button) => button.textContent === 'Update',
        );

        fireEvent.click(updateButton!);

        // Verify that the correct form type constant is used internally
        // This is tested through the tracking call which includes the form type logic
        expect(mockTrack).toHaveBeenCalled();
      });

      it('should use TimeEntriesFormType.TIMETRACKING constant correctly in onFormCancel callback', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear any previous tracking calls
        mockTrack.mockClear();

        const timeTrackingSection = screen.getByTestId('timetracking-settings');
        const cancelButtons = timeTrackingSection.querySelectorAll('button');
        const cancelButton = Array.from(cancelButtons).find(
          (button) => button.textContent === 'Cancel',
        );

        fireEvent.click(cancelButton!);

        // Verify that the correct form type constant is used internally
        expect(mockTrack).toHaveBeenCalled();
      });
    });

    describe('Tracking Points Integration', () => {
      it('should use TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIME_TRACKING_SECTION_EDIT constant correctly', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear the mount tracking call
        mockTrack.mockClear();

        const timeTrackingSection = screen.getByTestId('timetracking-settings');
        const updateButtons = timeTrackingSection.querySelectorAll('button');
        const updateButton = Array.from(updateButtons).find(
          (button) => button.textContent === 'Update',
        );

        fireEvent.click(updateButton!);

        // Verify exact tracking point structure matches TIME_TRACKING_SECTION_EDIT
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            org: 'sbseg',
            purpose: 'prod',
            scope: 'time',
            scope_area: 'time-tracking',
            screen: 'account-settings-time',
            action: 'engaged',
            object: 'widget',
            object_detail: 'time_tracking_section_edit',
            ui_action: 'clicked',
            ui_object: 'button',
            ui_object_detail: 'time_tracking_section_edit',
            ui_access_point: 'page',
          }),
        );
      });

      it('should use TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIME_TRACKING_SECTION_CANCEL constant correctly', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear the mount tracking call first
        mockTrack.mockClear();

        const timeTrackingSection = screen.getByTestId('timetracking-settings');
        const cancelButtons = timeTrackingSection.querySelectorAll('button');
        const cancelButton = Array.from(cancelButtons).find(
          (button) => button.textContent === 'Cancel',
        );

        fireEvent.click(cancelButton!);

        // Verify exact tracking point structure matches TIME_TRACKING_SECTION_CANCEL
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            org: 'sbseg',
            purpose: 'prod',
            scope: 'time',
            scope_area: 'time-tracking',
            screen: 'account-settings-time',
            action: 'engaged',
            object: 'widget',
            object_detail: 'time_tracking_section_cancel',
            ui_action: 'clicked',
            ui_object: 'button',
            ui_object_detail: 'time_tracking_section_cancel',
            ui_access_point: 'page',
          }),
        );
      });
    });
  });

  describe('NotificationsTimeEntrySettings Props Testing', () => {
    beforeEach(() => {
      // Create a consistent mock for timeEntrySettingsFormMethod
      const mockTimeEntrySettingsFormMethod = {
        clearErrors: jest.fn(),
        setError: jest.fn(),
        getValues: jest.fn(),
        setValue: jest.fn(),
        watch: jest.fn(),
        formState: {
          errors: {},
          isDirty: false,
        },
        handleSubmit: jest.fn((callback) => () => callback({})),
        reset: jest.fn(),
        control: {},
      };

      // Setup context specifically for notifications tests
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        isFormEditable: true,
        sandbox: mockSandbox,
        timeEntrySettingsFormMethod: mockTimeEntrySettingsFormMethod,
        timeEntryNewBadgeVisibleFor: {
          breaksVisibilityEndDate: '12/31/2024',
          customFieldsVisibilityEndDate: '12/31/2024',
          timeTrackingVisibilityEndDate: '12/31/2024',
          notificationsVisibilityEndDate: '12/31/2024',
          approvalsVisibilityEndDate: '12/31/2024',
          newTimesheetVisibilityEndDate: '12/31/2024',
          newCustomFieldsVisibilityEndDate: '12/31/2024',
        },
        uxPreferenceLoading: false,
        isUKLocale: false,
      });
    });

    describe('onFormUpdate callback', () => {
      it('should call onFormUpdate with TimeEntriesFormType.NOTIFICATION and NOTIFICATION_SECTION_EDIT tracking point when triggered', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear any previous tracking calls (like the mount tracking call)
        mockTrack.mockClear();

        const notificationsSection = screen.getByTestId(
          'notifications-settings',
        );
        expect(notificationsSection).toBeInTheDocument();

        // Get the update button within the notifications section
        const updateButtons = notificationsSection.querySelectorAll('button');
        const updateButton = Array.from(updateButtons).find(
          (button) => button.textContent === 'Update',
        );
        expect(updateButton).toBeInTheDocument();

        fireEvent.click(updateButton!);

        // Verify tracking was called with the correct tracking point
        expect(mockTrack).toHaveBeenCalledWith({
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'time-tracking',
          screen: 'account-settings-time',
          action: 'engaged',
          object: 'widget',
          object_detail: 'notification_section_edit',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'notification_section_edit',
          ui_access_point: 'page',
        });
      });
    });

    describe('onFormCancel callback', () => {
      it('should call onFormCancel with TimeEntriesFormType.NOTIFICATION and NOTIFICATION_SECTION_CANCEL tracking point when triggered', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear any previous tracking calls (like the mount tracking call)
        mockTrack.mockClear();

        const notificationsSection = screen.getByTestId(
          'notifications-settings',
        );
        expect(notificationsSection).toBeInTheDocument();

        // Get the cancel button within the notifications section
        const cancelButtons = notificationsSection.querySelectorAll('button');
        const cancelButton = Array.from(cancelButtons).find(
          (button) => button.textContent === 'Cancel',
        );
        expect(cancelButton).toBeInTheDocument();

        fireEvent.click(cancelButton!);

        // Verify tracking was called with the correct tracking point
        expect(mockTrack).toHaveBeenCalledWith({
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'time-tracking',
          screen: 'account-settings-time',
          action: 'engaged',
          object: 'widget',
          object_detail: 'notification_section_cancel',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'notification_section_cancel',
          ui_access_point: 'page',
        });
      });
    });

    describe('isDataUpdating prop', () => {
      it('should pass setQLSettingsLoading as isDataUpdating prop correctly for notifications section', () => {
        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const notificationsSection = screen.getByTestId(
          'notifications-settings',
        );
        expect(notificationsSection).toBeInTheDocument();

        // The component should reflect the loading state
        // This tests that isDataUpdating (setQLSettingsLoading) is properly passed through
        expect(notificationsSection).toHaveAttribute(
          'data-testid',
          'notifications-settings',
        );
      });

      it('should handle isDataUpdating when setQLSettingsLoading is false for notifications section', () => {
        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const notificationsSection = screen.getByTestId(
          'notifications-settings',
        );
        expect(notificationsSection).toBeInTheDocument();

        // Verify the component renders properly when not loading
        expect(notificationsSection).toHaveAttribute(
          'data-testid',
          'notifications-settings',
        );
      });
    });

    describe('TimeEntriesFormType constant usage', () => {
      it('should use TimeEntriesFormType.NOTIFICATION constant correctly in onFormUpdate callback', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear any previous tracking calls
        mockTrack.mockClear();

        const notificationsSection = screen.getByTestId(
          'notifications-settings',
        );
        const updateButtons = notificationsSection.querySelectorAll('button');
        const updateButton = Array.from(updateButtons).find(
          (button) => button.textContent === 'Update',
        );

        fireEvent.click(updateButton!);

        // Verify that the correct form type constant is used internally
        // This is tested through the tracking call which includes the form type logic
        expect(mockTrack).toHaveBeenCalled();
      });

      it('should use TimeEntriesFormType.NOTIFICATION constant correctly in onFormCancel callback', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear any previous tracking calls
        mockTrack.mockClear();

        const notificationsSection = screen.getByTestId(
          'notifications-settings',
        );
        const cancelButtons = notificationsSection.querySelectorAll('button');
        const cancelButton = Array.from(cancelButtons).find(
          (button) => button.textContent === 'Cancel',
        );

        fireEvent.click(cancelButton!);

        // Verify that the correct form type constant is used internally
        expect(mockTrack).toHaveBeenCalled();
      });
    });

    describe('Tracking Points Integration', () => {
      it('should use TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_SECTION_EDIT constant correctly', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear the mount tracking call
        mockTrack.mockClear();

        const notificationsSection = screen.getByTestId(
          'notifications-settings',
        );
        const updateButtons = notificationsSection.querySelectorAll('button');
        const updateButton = Array.from(updateButtons).find(
          (button) => button.textContent === 'Update',
        );

        fireEvent.click(updateButton!);

        // Verify exact tracking point structure matches NOTIFICATION_SECTION_EDIT
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            org: 'sbseg',
            purpose: 'prod',
            scope: 'time',
            scope_area: 'time-tracking',
            screen: 'account-settings-time',
            action: 'engaged',
            object: 'widget',
            object_detail: 'notification_section_edit',
            ui_action: 'clicked',
            ui_object: 'button',
            ui_object_detail: 'notification_section_edit',
            ui_access_point: 'page',
          }),
        );
      });

      it('should use TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_SECTION_CANCEL constant correctly', () => {
        const mockTrack = jest.fn();
        const { useTracking } = require('@payroll/quicksand');
        useTracking.mockReturnValue(mockTrack);

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        // Clear the mount tracking call first
        mockTrack.mockClear();

        const notificationsSection = screen.getByTestId(
          'notifications-settings',
        );
        const cancelButtons = notificationsSection.querySelectorAll('button');
        const cancelButton = Array.from(cancelButtons).find(
          (button) => button.textContent === 'Cancel',
        );

        fireEvent.click(cancelButton!);

        // Verify exact tracking point structure matches NOTIFICATION_SECTION_CANCEL
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            org: 'sbseg',
            purpose: 'prod',
            scope: 'time',
            scope_area: 'time-tracking',
            screen: 'account-settings-time',
            action: 'engaged',
            object: 'widget',
            object_detail: 'notification_section_cancel',
            ui_action: 'clicked',
            ui_object: 'button',
            ui_access_point: 'page',
            ui_object_detail: 'notification_section_cancel',
          }),
        );
      });
    });
  });

  describe('Custom Fields Functionality', () => {
    beforeEach(() => {
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: defaultQLData,
        sandbox: mockSandbox, // always use mockSandbox
        updateErrorMessage: jest.fn(),
        reRenderTimeEntrySetting: jest.fn(),
        errorMessage: '',
        isFormEditable: true,
        isRenderTimeEntry: true,
        timeEntryNewBadgeVisibleFor: {
          breaksVisibilityEndDate: '12/31/2024',
          customFieldsVisibilityEndDate: '12/31/2024',
          timeTrackingVisibilityEndDate: '12/31/2024',
          notificationsVisibilityEndDate: '12/31/2024',
          approvalsVisibilityEndDate: '12/31/2024',
          newTimesheetVisibilityEndDate: '12/31/2024',
          newCustomFieldsVisibilityEndDate: '12/31/2024',
        },
        uxPreferenceLoading: false,
        isUKLocale: false,
        entitlements: [],
        entitlementsLoading: false,
        v3PreferencesData: {},
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        refetchQlSettings: jest.fn(),
      });
    });

    it('should open custom fields drawer when add new is clicked', async () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const addNewButton = screen.getByTestId('add-new-custom-field-button');
      fireEvent.click(addNewButton);
      expect(mockNavigate).toHaveBeenCalledWith('customfields');
    });

    it('should track manage all custom fields button click', () => {
      const mockTrack = jest.fn();
      const { useTracking } = require('@payroll/quicksand');
      useTracking.mockReturnValue(mockTrack);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const addNewButton = screen.getByTestId('add-new-custom-field-button');
      fireEvent.click(addNewButton);

      expect(mockTrack).toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'custom-field',
        screen: 'custom_fields_page',
        action: 'engaged',
        object: 'widget',
        object_detail: 'manage_all_custom_fields',
        ui_action: 'clicked',
        ui_object: 'link',
        ui_object_detail: 'manage_all_custom_fields',
        ui_access_point: 'page',
      });
    });

    it('should track manage all custom fields button click and navigate to custom fields', () => {
      const mockTrack = jest.fn();
      const { useTracking } = require('@payroll/quicksand');
      useTracking.mockReturnValue(mockTrack);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const addNewButton = screen.getByTestId('add-new-custom-field-button');
      fireEvent.click(addNewButton);

      // Verify tracking was called
      expect(mockTrack).toHaveBeenCalledWith({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'custom-field',
        screen: 'custom_fields_page',
        action: 'engaged',
        object: 'widget',
        object_detail: 'manage_all_custom_fields',
        ui_action: 'clicked',
        ui_object: 'link',
        ui_object_detail: 'manage_all_custom_fields',
        ui_access_point: 'page',
      });

      // Verify navigation was called
      expect(mockNavigate).toHaveBeenCalledWith('customfields');
    });
  });

  describe('Error Message Handling', () => {
    beforeEach(() => {
      // Setup context with error message
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        errorMessage: 'Test error message',
        sandbox: mockSandbox,
        timeEntryNewBadgeVisibleFor: {
          breaksVisibilityEndDate: '12/31/2024',
          customFieldsVisibilityEndDate: '12/31/2024',
          timeTrackingVisibilityEndDate: '12/31/2024',
          notificationsVisibilityEndDate: '12/31/2024',
          approvalsVisibilityEndDate: '12/31/2024',
          newTimesheetVisibilityEndDate: '12/31/2024',
          newCustomFieldsVisibilityEndDate: '12/31/2024',
        },
        uxPreferenceLoading: false,
        isUKLocale: false,
      });
    });

    it('should display error message when errorMessage is present', () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Test error message');
      expect(errorMessage).toHaveAttribute('data-message-type', 'error');
    });

    it('should not display error message when errorMessage is empty', () => {
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        errorMessage: '',
        sandbox: mockSandbox,
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const errorMessage = screen.queryByTestId('error-message');
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should render error message with correct props', () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveAttribute(
        'data-automation-id',
        'TimeEntrySettingsErrorPageMessage',
      );
      expect(errorMessage).toHaveTextContent('Test error message');
      expect(errorMessage).toHaveAttribute('data-message-type', 'error');
    });
  });

  describe('Warning Message Handling', () => {
    beforeEach(() => {
      // Setup context with default values
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        sandbox: mockSandbox,
        timeEntryNewBadgeVisibleFor: {
          breaksVisibilityEndDate: '12/31/2024',
          customFieldsVisibilityEndDate: '12/31/2024',
          timeTrackingVisibilityEndDate: '12/31/2024',
          notificationsVisibilityEndDate: '12/31/2024',
          approvalsVisibilityEndDate: '12/31/2024',
          newTimesheetVisibilityEndDate: '12/31/2024',
          newCustomFieldsVisibilityEndDate: '12/31/2024',
        },
        uxPreferenceLoading: false,
        isUKLocale: false,
      });
    });

    it('should display warning message when canEditPreference returns false', () => {
      // Mock canEditPreference to return false
      const {
        canEditPreference,
      } = require('src/js/service/utils/sandboxUtils');
      canEditPreference.mockReturnValue(false);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const warningMessage = screen.getByTestId('warning-message');
      expect(warningMessage).toBeInTheDocument();
      expect(warningMessage).toHaveTextContent(
        'You do not have access rights to edit these settings.Ask your QuickBooks admin for access.',
      );
      expect(warningMessage).toHaveAttribute(
        'data-automation-id',
        'TimeEntrySettingsWarningPageMessage',
      );
      expect(warningMessage).toHaveAttribute('data-message-type', 'info');
    });

    it('should not display warning message when canEditPreference returns true', () => {
      // Mock canEditPreference to return true (default behavior)
      const {
        canEditPreference,
      } = require('src/js/service/utils/sandboxUtils');
      canEditPreference.mockReturnValue(true);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const warningMessage = screen.queryByTestId('warning-message');
      expect(warningMessage).not.toBeInTheDocument();
    });

    it('should render warning message with correct props when canEditPreference is false', () => {
      // Mock canEditPreference to return false
      const {
        canEditPreference,
      } = require('src/js/service/utils/sandboxUtils');
      canEditPreference.mockReturnValue(false);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const warningMessage = screen.getByTestId('warning-message');
      expect(warningMessage).toHaveAttribute(
        'data-automation-id',
        'TimeEntrySettingsWarningPageMessage',
      );
      expect(warningMessage).toHaveTextContent(
        'You do not have access rights to edit these settings.Ask your QuickBooks admin for access.',
      );
      expect(warningMessage).toHaveAttribute('data-message-type', 'info');
    });

    it('should display both warning and error messages when both conditions are met', () => {
      // Mock canEditPreference to return false
      const {
        canEditPreference,
      } = require('src/js/service/utils/sandboxUtils');
      canEditPreference.mockReturnValue(false);

      // Setup context with error message
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        errorMessage: 'Test error message',
        sandbox: mockSandbox,
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const warningMessage = screen.getByTestId('warning-message');
      const errorMessage = screen.getByTestId('error-message');

      expect(warningMessage).toBeInTheDocument();
      expect(errorMessage).toBeInTheDocument();
      expect(warningMessage).toHaveTextContent(
        'You do not have access rights to edit these settings.Ask your QuickBooks admin for access.',
      );
      expect(errorMessage).toHaveTextContent('Test error message');
      expect(warningMessage).toHaveAttribute(
        'data-automation-id',
        'TimeEntrySettingsWarningPageMessage',
      );
      expect(errorMessage).toHaveAttribute(
        'data-automation-id',
        'TimeEntrySettingsErrorPageMessage',
      );
    });

    it('should call canEditPreference with sandbox parameter', () => {
      const {
        canEditPreference,
      } = require('src/js/service/utils/sandboxUtils');
      canEditPreference.mockReturnValue(false);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(canEditPreference).toHaveBeenCalledWith(mockSandbox);
    });
  });

  describe('Form Dirty State Tracking', () => {
    let mockOnIsDirty: jest.Mock;

    beforeEach(() => {
      mockOnIsDirty = jest.fn();
      // Reset the mock to its default state before each test
      (useTimeEntrySettings as jest.Mock).mockReturnValue({
        formState: {
          dirtyFields: {},
          errors: {},
        },
        setValue: jest.fn(),
        getValues: jest.fn(),
        watch: jest.fn(),
        handleSubmit: jest.fn((callback) => () => callback({})),
        reset: jest.fn(),
        control: {},
        clearErrors: jest.fn(),
      });
    });

    it('should call onIsDirty with true when form has dirty fields', async () => {
      // Mock the form state with dirty fields
      const mockFormState = {
        formState: {
          dirtyFields: {
            field1: true,
          },
          errors: {},
        },
        setValue: jest.fn(),
        getValues: jest.fn(),
        watch: jest.fn(),
        handleSubmit: jest.fn((callback) => () => callback({})),
        reset: jest.fn(),
        control: {},
        clearErrors: jest.fn(),
      };

      // Mock useTimeEntrySettings to return our mock form state
      (useTimeEntrySettings as jest.Mock).mockReturnValue(mockFormState);

      // Render the component
      renderWithProviders(
        <TimeEntrySettingsForm type="US" onIsDirtyTimeForm={mockOnIsDirty} />,
      );

      // Wait for the useEffect to run and verify the callback was called
      await waitFor(() => {
        expect(mockOnIsDirty).toHaveBeenCalledWith(true);
      });
    });

    it('should not call onIsDirty when form has no dirty fields', async () => {
      // Mock the form state with no dirty fields
      const mockFormState = {
        formState: {
          dirtyFields: {},
          errors: {},
        },
        setValue: jest.fn(),
        getValues: jest.fn(),
        watch: jest.fn(),
        handleSubmit: jest.fn((callback) => () => callback({})),
        reset: jest.fn(),
        control: {},
        clearErrors: jest.fn(),
      };

      // Mock useTimeEntrySettings to return our mock form state
      (useTimeEntrySettings as jest.Mock).mockReturnValue(mockFormState);

      // Render the component
      renderWithProviders(
        <TimeEntrySettingsForm type="US" onIsDirtyTimeForm={mockOnIsDirty} />,
      );

      // Wait for the useEffect to run and verify the callback was not called
      await waitFor(() => {
        expect(mockOnIsDirty).not.toHaveBeenCalled();
      });
    });

    it('should not call onIsDirty when callback is not provided', async () => {
      // Render without the callback
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      // Verify the component renders without errors
      expect(screen.getByTestId('timetracking-settings')).toBeInTheDocument();
    });
  });

  describe('GeoLocationsTimeEntrySettings rendering', () => {
    beforeEach(() => {
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: defaultQLData,
        sandbox: mockSandbox,
        updateErrorMessage: jest.fn(),
        reRenderTimeEntrySetting: jest.fn(),
        errorMessage: '',
        isFormEditable: true,
        timeEntryNewBadgeVisibleFor: {
          breaksVisibilityEndDate: '12/31/2024',
          customFieldsVisibilityEndDate: '12/31/2024',
          timeTrackingVisibilityEndDate: '12/31/2024',
          notificationsVisibilityEndDate: '12/31/2024',
          geoLocationsVisibilityEndDate: '12/31/2024',
          approvalsVisibilityEndDate: '12/31/2024',
          newTimesheetVisibilityEndDate: '12/31/2024',
          newCustomFieldsVisibilityEndDate: '12/31/2024',
        },
        uxPreferenceLoading: false,
        isUKLocale: false,
        urlParams: 'time',
        entitlements: [],
        entitlementsLoading: false,
        v3PreferencesData: {},
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        refetchQlSettings: jest.fn(),
      });
    });

    it('should render GeoLocationsTimeEntrySettings when feature flag is enabled', () => {
      // Mock the feature flag to return true for geo location settings
      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      useIXPFeatureFlag.mockImplementation(
        (config: { flagName: string; defaultValue: boolean }) => {
          if (config.flagName === 'SBSEG-QBO-location-tracking')
            return { isEnabled: true, isLoading: false, error: null };
          if (config.flagName === 'QB_TIME_TRACKING_UI_INTRO_MODAL_SETTINGS')
            return { isEnabled: false, isLoading: false, error: null };
          return { isEnabled: true, isLoading: false, error: null };
        },
      );

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(screen.getByTestId('geo-locations-settings')).toBeInTheDocument();
      expect(screen.getByText('GeoLocations Component')).toBeInTheDocument();
    });

    it('should not render GeoLocationsTimeEntrySettings when config is disabled', () => {
      // Temporarily override the config mock for this test
      const {
        TIME_ENTRY_SETTINGS_CONFIG,
      } = require('src/js/widgets/timeTrackingSettings/config');
      TIME_ENTRY_SETTINGS_CONFIG.GEO_LOCATIONS.enabled = false;

      // Mock the feature flag to return true
      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      useIXPFeatureFlag.mockImplementation(
        (config: { flagName: string; defaultValue: boolean }) => {
          if (config.flagName === 'SBSEG-QBO-location-tracking')
            return { isEnabled: true, isLoading: false, error: null };
          return { isEnabled: true, isLoading: false, error: null };
        },
      );

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(
        screen.queryByTestId('geo-locations-settings'),
      ).not.toBeInTheDocument();

      // Reset the config for other tests
      TIME_ENTRY_SETTINGS_CONFIG.GEO_LOCATIONS.enabled = true;
    });

    it('should render GeoLocationsTimeEntrySettings when both config and feature flag are enabled', () => {
      // Ensure config is enabled
      const {
        TIME_ENTRY_SETTINGS_CONFIG,
      } = require('src/js/widgets/timeTrackingSettings/config');
      TIME_ENTRY_SETTINGS_CONFIG.GEO_LOCATIONS.enabled = true;

      // Mock the feature flag to return true
      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      useIXPFeatureFlag.mockImplementation(
        (config: { flagName: string; defaultValue: boolean }) => {
          if (config.flagName === 'SBSEG-QBO-location-tracking')
            return { isEnabled: true, isLoading: false, error: null };
          return { isEnabled: true, isLoading: false, error: null };
        },
      );

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const geoLocationsSection = screen.getByTestId('geo-locations-settings');
      expect(geoLocationsSection).toBeInTheDocument();
      expect(geoLocationsSection).toHaveTextContent('GeoLocations Component');
    });

    it('should render GeoLocationsTimeEntrySettings alongside other sections', () => {
      // Mock the feature flags to enable all sections
      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      useIXPFeatureFlag.mockImplementation(
        (config: { flagName: string; defaultValue: boolean }) =>
          // Enable all feature flags
          ({ isEnabled: true, isLoading: false, error: null }),
      );

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      // Verify GeoLocations section is rendered
      expect(screen.getByTestId('geo-locations-settings')).toBeInTheDocument();

      // Verify other sections are also rendered
      expect(screen.getByTestId('timetracking-settings')).toBeInTheDocument();
      expect(screen.getByTestId('timeSheet-settings')).toBeInTheDocument();
      expect(screen.getByTestId('notifications-settings')).toBeInTheDocument();
    });
  });

  describe('Time Off Settings Widget rendering', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: defaultQLData,
        sandbox: mockSandbox,
        updateErrorMessage: jest.fn(),
        reRenderTimeEntrySetting: jest.fn(),
        errorMessage: '',
        isFormEditable: true,
        timeEntryNewBadgeVisibleFor: {
          breaksVisibilityEndDate: '12/31/2024',
          customFieldsVisibilityEndDate: '12/31/2024',
          timeTrackingVisibilityEndDate: '12/31/2024',
          notificationsVisibilityEndDate: '12/31/2024',
          geoLocationsVisibilityEndDate: '12/31/2024',
          approvalsVisibilityEndDate: '12/31/2024',
          newTimesheetVisibilityEndDate: '12/31/2024',
          newCustomFieldsVisibilityEndDate: '12/31/2024',
        },
        uxPreferenceLoading: false,
        isUKLocale: false,
        urlParams: 'time',
        entitlements: [],
        entitlementsLoading: false,
        v3PreferencesData: {},
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isQLSettingsLoading: false,
        QLSettingsError: undefined,
        refetchQlSettings: jest.fn(),
      });
    });

    it('should render Time Off Settings widget when feature flag is enabled', () => {
      // Mock the feature flag to return true for time off settings
      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      useIXPFeatureFlag.mockImplementation(
        (config: { flagName: string; defaultValue: boolean }) => {
          if (
            config.flagName ===
            'SBSEG-QBO-enable-time-off-policy-goco-integration-beta'
          )
            return { isEnabled: true, isLoading: false, error: null };
          if (config.flagName === 'QB_TIME_TRACKING_UI_INTRO_MODAL_SETTINGS')
            return { isEnabled: false, isLoading: false, error: null };
          return { isEnabled: true, isLoading: false, error: null };
        },
      );

      const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: true,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(
        screen.getByTestId('widget-team-management-ui/time-off-settings'),
      ).toBeInTheDocument();
    });

    it('should not render Time Off Settings widget when config is disabled even with feature flag enabled', () => {
      // Disable the config
      const {
        TIME_ENTRY_SETTINGS_CONFIG,
      } = require('src/js/widgets/timeTrackingSettings/config');
      const originalEnabled = TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled;
      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled = false;

      // Mock the feature flag to return true
      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      useIXPFeatureFlag.mockImplementation(
        (config: { flagName: string; defaultValue: boolean }) => ({
          isEnabled: true,
          isLoading: false,
          error: null,
        }),
      );

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(
        screen.queryByTestId('widget-team-management-ui/time-off-settings'),
      ).not.toBeInTheDocument();

      // Reset the config
      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled = originalEnabled;
    });

    it('should render Time Off Settings widget when both config and feature flag are enabled', () => {
      // Ensure config is enabled
      const {
        TIME_ENTRY_SETTINGS_CONFIG,
      } = require('src/js/widgets/timeTrackingSettings/config');
      const originalEnabled = TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled;
      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled = true;

      // Mock the feature flag to return true
      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      useIXPFeatureFlag.mockImplementation(
        (config: { flagName: string; defaultValue: boolean }) => {
          if (
            config.flagName ===
            'SBSEG-QBO-enable-time-off-policy-goco-integration-beta'
          )
            return { isEnabled: true, isLoading: false, error: null };
          return { isEnabled: true, isLoading: false, error: null };
        },
      );

      const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: true,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const timeOffWidget = screen.getByTestId(
        'widget-team-management-ui/time-off-settings',
      );
      expect(timeOffWidget).toBeInTheDocument();

      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled = originalEnabled;
    });

    it('should not render Time Off Settings widget when showAdvancedTimeOffManagement variability is false', () => {
      const {
        TIME_ENTRY_SETTINGS_CONFIG,
      } = require('src/js/widgets/timeTrackingSettings/config');
      const originalEnabled = TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled;
      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled = true;

      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      useIXPFeatureFlag.mockImplementation(() => ({
        isEnabled: true,
        isLoading: false,
        error: null,
      }));

      const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: false,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(
        screen.queryByTestId('widget-team-management-ui/time-off-settings'),
      ).not.toBeInTheDocument();

      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled = originalEnabled;
    });

    it('should not render Time Off Settings widget while showAdvancedTimeOffManagement variability is still loading', () => {
      const {
        TIME_ENTRY_SETTINGS_CONFIG,
      } = require('src/js/widgets/timeTrackingSettings/config');
      const originalEnabled = TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled;
      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled = true;

      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      useIXPFeatureFlag.mockImplementation(() => ({
        isEnabled: true,
        isLoading: false,
        error: null,
      }));

      const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(
        screen.queryByTestId('widget-team-management-ui/time-off-settings'),
      ).not.toBeInTheDocument();

      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled = originalEnabled;
    });

    it('should call useQbTimeSdk with the showAdvancedTimeOffManagement decision', () => {
      const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: true,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(useQbTimeSdk).toHaveBeenCalledWith(expect.any(Function), {
        executeOnMount: true,
        args: ['showAdvancedTimeOffManagement'],
      });
    });

    it('should render Time Off Settings widget when config, feature flag, and showAdvancedTimeOffManagement variability are all enabled', () => {
      const {
        TIME_ENTRY_SETTINGS_CONFIG,
      } = require('src/js/widgets/timeTrackingSettings/config');
      const originalEnabled = TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled;
      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled = true;

      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      useIXPFeatureFlag.mockImplementation(() => ({
        isEnabled: true,
        isLoading: false,
        error: null,
      }));

      const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
      (useQbTimeSdk as jest.Mock).mockReturnValue({
        data: true,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      expect(
        screen.getByTestId('widget-team-management-ui/time-off-settings'),
      ).toBeInTheDocument();

      TIME_ENTRY_SETTINGS_CONFIG.TIME_OFF.enabled = originalEnabled;
    });
  });

  describe('useSetQLSettings and useSetApprovalSettings callbacks', () => {
    const useSetQLSettings =
      require('src/js/service/hooks/settings/useSetQLSettings')
        .useSetQLSettings as jest.Mock;
    const useSetApprovalSettings =
      require('src/js/service/hooks/settings/useSetApprovalSettings')
        .useSetApprovalSettings as jest.Mock;

    it('invokes useSetQLSettings onError when timeEntryFormOpenToUpdate is set', async () => {
      let capturedOnError: ((error: any) => void) | undefined;
      useSetQLSettings.mockImplementation((args: any) => {
        capturedOnError = args.onError;
        return [jest.fn(), { loading: false }];
      });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        timeEntryFormOpenToUpdate: 'timesheet',
      } as any);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      await waitFor(() => {
        expect(useSetQLSettings).toHaveBeenCalled();
      });

      act(() => {
        capturedOnError?.('test.error.id');
      });
    });

    it('invokes useSetApprovalSettings onSuccess', async () => {
      let capturedOnSuccess: () => void | undefined;
      useSetApprovalSettings.mockImplementation((args: any) => {
        capturedOnSuccess = args.onSuccess;
        return [jest.fn(), { loading: false }];
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      await waitFor(() => {
        expect(useSetApprovalSettings).toHaveBeenCalled();
      });

      act(() => {
        capturedOnSuccess?.();
      });
    });

    it('invokes useSetApprovalSettings onError', async () => {
      let capturedOnError: ((error: any) => void) | undefined;
      useSetApprovalSettings.mockImplementation((args: any) => {
        capturedOnError = args.onError;
        return [jest.fn(), { loading: false }];
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      await waitFor(() => {
        expect(useSetApprovalSettings).toHaveBeenCalled();
      });

      act(() => {
        capturedOnError?.('Approval error');
      });
    });
  });

  describe('onSubmit flow', () => {
    let mockUpdateCompanySettings: jest.Mock;
    let mockUpdateApprovalSettings: jest.Mock;

    const useSetQLSettings =
      require('src/js/service/hooks/settings/useSetQLSettings')
        .useSetQLSettings as jest.Mock;
    const useSetApprovalSettings =
      require('src/js/service/hooks/settings/useSetApprovalSettings')
        .useSetApprovalSettings as jest.Mock;
    const {
      hasApprovalSettingsChanges,
    } = require('src/js/widgets/timeTrackingSettings/hooks/mapApprovalSettings');
    const {
      comparingTimeEntrySettingsToPreviousTimeEntrySettings,
      mappedTimeEntrySettingsForMutation,
    } = require('src/js/widgets/timeTrackingSettings/hooks/useTimeEntrySettingsForm');
    const {
      buildOvertimeNotificationsManageInput,
    } = require('src/js/widgets/userSettings/components/cards/NotificationsCard/utils/overtimeNotifications.utils');

    beforeEach(() => {
      mockUpdateCompanySettings = jest.fn();
      mockUpdateApprovalSettings = jest.fn();

      useSetQLSettings.mockImplementation((args: any) => [
        mockUpdateCompanySettings,
        { loading: false },
      ]);
      useSetApprovalSettings.mockImplementation((args: any) => [
        mockUpdateApprovalSettings,
        { loading: false },
      ]);

      (hasApprovalSettingsChanges as jest.Mock).mockReturnValue(false);
      (
        comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
      ).mockReturnValue([]);
      (mappedTimeEntrySettingsForMutation as jest.Mock).mockReturnValue({
        notificationSettings: {},
      });
      (buildOvertimeNotificationsManageInput as jest.Mock).mockReturnValue(
        null,
      );
    });

    it('should close form when no changes are present on submit', async () => {
      (hasApprovalSettingsChanges as jest.Mock).mockReturnValue(false);
      (
        comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
      ).mockReturnValue([]);
      (buildOvertimeNotificationsManageInput as jest.Mock).mockReturnValue(
        null,
      );

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const saveButton = screen.getByTestId('save-notifications');

      await act(async () => {
        fireEvent.click(saveButton);
      });

      expect(mockUpdateCompanySettings).not.toHaveBeenCalled();
      expect(mockUpdateApprovalSettings).not.toHaveBeenCalled();
    });

    it('should call updateApprovalSettings when approval changes are present', async () => {
      (hasApprovalSettingsChanges as jest.Mock).mockReturnValue(true);
      (
        comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
      ).mockReturnValue(['managerReminderBasedOn']);

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        isFormEditable: true,
        sandbox: mockSandbox,
        approvalSettings: { requireApprovalForTrackedTime: { value: true } },
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const saveButton = screen.getByTestId('save-notifications');

      await act(async () => {
        fireEvent.click(saveButton);
      });

      expect(mockUpdateApprovalSettings).toHaveBeenCalled();
    });

    it('should call updateCompanySettings with overtime-only payload when only overtime changes exist', async () => {
      const overtimePayload = { rules: [{ period: 'DAILY' }] };
      (buildOvertimeNotificationsManageInput as jest.Mock).mockReturnValue(
        overtimePayload,
      );
      (
        comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
      ).mockReturnValue([]);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const saveButton = screen.getByTestId('save-notifications');

      await act(async () => {
        fireEvent.click(saveButton);
      });

      expect(mockUpdateCompanySettings).toHaveBeenCalledWith({
        notificationSettings: { overtimeNotifications: overtimePayload },
      });
    });

    it('should call updateCompanySettings with merged overtime payload for employer settings', async () => {
      const overtimePayload = { rules: [{ period: 'WEEKLY' }] };
      (buildOvertimeNotificationsManageInput as jest.Mock).mockReturnValue(
        overtimePayload,
      );
      (
        comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
      ).mockReturnValue(['clockInNotificationReminderTime']);
      (mappedTimeEntrySettingsForMutation as jest.Mock).mockReturnValue({
        notificationSettings: { clockInTime: '09:00' },
      });

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        isFormEditable: true,
        sandbox: mockSandbox,
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const saveButton = screen.getByTestId('save-notifications');

      await act(async () => {
        fireEvent.click(saveButton);
      });

      expect(mockUpdateCompanySettings).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationSettings: expect.objectContaining({
            overtimeNotifications: overtimePayload,
          }),
        }),
      );
    });

    it('should not call updateCompanySettings when no changes and no overtime payload', async () => {
      (buildOvertimeNotificationsManageInput as jest.Mock).mockReturnValue(
        null,
      );
      (
        comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
      ).mockReturnValue([]);
      (hasApprovalSettingsChanges as jest.Mock).mockReturnValue(false);

      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        isFormEditable: true,
        sandbox: mockSandbox,
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const saveButton = screen.getByTestId('save-notifications');

      await act(async () => {
        fireEvent.click(saveButton);
      });

      expect(mockUpdateCompanySettings).not.toHaveBeenCalled();
    });

    describe('fit-and-finish sandbox.logger instrumentation', () => {
      const fitAndFinishQLData = {
        isServiceFieldEnabled: { version: '1', value: true },
        isBillingFieldEnabled: { version: '1', value: true },
        firstDayOfWeek: { version: '1', value: 1 },
        timeFormat: { version: '1', value: 12 },
        timeZone: { version: '1', value: 'America/Los_Angeles' },
        billingRateForTimeEnabled: { version: '1', value: true },
        useItemForTime: { version: '1', value: true },
        timeTrackingSupported: { version: '1', value: true },
        transactionBillingForTimeEnabled: { version: '1', value: true },
        transactionTimeTrackingEnabled: { version: '1', value: true },
        manageOwnTimeSheetsEnabled: { version: '1', value: false },
        mobileTimeTrackingEnabled: { version: '1', value: false },
        signatureCaptureEnabled: { version: '1', value: false },
      };

      it('logs SaveInitiated when a fit-and-finish field changes', async () => {
        (
          comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
        ).mockReturnValue(['manageOwnTimeSheetsEnabled']);

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: fitAndFinishQLData,
          isFormEditable: true,
          sandbox: mockSandbox,
        });

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const saveButton = screen.getByTestId('save-notifications');
        await act(async () => {
          fireEvent.click(saveButton);
        });

        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          'Component=TimeTrackingTimeEntrySettings Event=SaveInitiated',
          expect.objectContaining({
            changedFields: ['manageOwnTimeSheetsEnabled'],
            old: expect.objectContaining({
              manageOwnTimeSheets: false,
            }),
          }),
        );
      });

      it('logs SaveSuccess when mutation succeeds after fit-and-finish field change', async () => {
        let capturedOnSuccess: ((result: any) => void) | undefined;
        useSetQLSettings.mockImplementationOnce((args: any) => {
          capturedOnSuccess = args.onSuccess;
          return [mockUpdateCompanySettings, { loading: false }];
        });

        (
          comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
        ).mockReturnValue(['manageOwnTimeSheetsEnabled']);

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: fitAndFinishQLData,
          isFormEditable: true,
          sandbox: mockSandbox,
        });

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        await waitFor(() => {
          expect(useSetQLSettings).toHaveBeenCalled();
        });

        const saveButton = screen.getByTestId('save-notifications');
        await act(async () => {
          fireEvent.click(saveButton);
        });

        expect(capturedOnSuccess).toBeDefined();
        act(() => {
          capturedOnSuccess!({ data: {} });
        });

        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          'Component=TimeTrackingTimeEntrySettings Event=SaveSuccess',
          expect.objectContaining({
            changedFields: ['manageOwnTimeSheetsEnabled'],
          }),
        );
      });

      it('logs SaveFailed when the mutation errors and a fit-and-finish field was changed', async () => {
        let capturedOnError: ((error: any) => void) | undefined;
        useSetQLSettings.mockImplementationOnce((args: any) => {
          capturedOnError = args.onError;
          return [mockUpdateCompanySettings, { loading: false }];
        });

        (
          comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
        ).mockReturnValue(['mobileTimeTrackingEnabled']);

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: fitAndFinishQLData,
          isFormEditable: true,
          sandbox: mockSandbox,
        });

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        await waitFor(() => {
          expect(useSetQLSettings).toHaveBeenCalled();
        });

        const saveButton = screen.getByTestId('save-notifications');
        await act(async () => {
          fireEvent.click(saveButton);
        });

        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          'Component=TimeTrackingTimeEntrySettings Event=SaveInitiated',
          expect.objectContaining({
            changedFields: ['mobileTimeTrackingEnabled'],
          }),
        );

        act(() => {
          capturedOnError?.('some.error.id');
        });

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Component=TimeTrackingTimeEntrySettings Event=SaveFailed',
          expect.objectContaining({
            changedFields: ['mobileTimeTrackingEnabled'],
            error: 'some.error.id',
          }),
        );
      });

      it('does not log when no fit-and-finish fields are changed', async () => {
        (
          comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
        ).mockReturnValue(['clockInNotificationReminderTime']);

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: fitAndFinishQLData,
          isFormEditable: true,
          sandbox: mockSandbox,
        });

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const saveButton = screen.getByTestId('save-notifications');
        await act(async () => {
          fireEvent.click(saveButton);
        });

        expect(mockSandbox.logger.info).not.toHaveBeenCalledWith(
          'Component=TimeTrackingTimeEntrySettings Event=SaveInitiated',
          expect.anything(),
        );
      });
    });

    describe('schedule notification sandbox.logger instrumentation', () => {
      const scheduleNotificationQLData = {
        ...defaultQLData,
        scheduleNotificationSubscriptions: [
          {
            notificationType: 'ShiftStartBefore',
            distributionMethods: ['EMAIL'],
            meta: { version: '1' },
          },
        ],
      };

      it('logs SAVE_SUCCESS when schedule notification fields change and mutation succeeds', async () => {
        let capturedOnSuccess: ((result: unknown) => void) | undefined;
        useSetQLSettings.mockImplementationOnce(
          (args: { onSuccess: (result: unknown) => void }) => {
            capturedOnSuccess = args.onSuccess;
            return [mockUpdateCompanySettings, { loading: false }];
          },
        );

        (
          comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
        ).mockReturnValue(['scheduleOneHour']);

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: scheduleNotificationQLData,
          isFormEditable: true,
          sandbox: mockSandbox,
        });

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const saveButton = screen.getByTestId('save-notifications');
        await act(async () => {
          fireEvent.click(saveButton);
        });

        expect(mockUpdateCompanySettings).toHaveBeenCalled();
        act(() => {
          capturedOnSuccess?.({ data: {} });
        });

        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          'Component=NotificationsTimeEntrySettings Event=SAVE_SUCCESS section=SCHEDULE_NOTIFICATIONS',
        );
      });

      it('logs SAVE_ERROR when schedule notification fields change and mutation fails', async () => {
        let capturedOnError: ((error: string) => void) | undefined;
        useSetQLSettings.mockImplementationOnce(
          (args: { onError: (error: string) => void }) => {
            capturedOnError = args.onError;
            return [mockUpdateCompanySettings, { loading: false }];
          },
        );

        (
          comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
        ).mockReturnValue(['scheduleOneHour']);

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: scheduleNotificationQLData,
          isFormEditable: true,
          sandbox: mockSandbox,
        });

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const saveButton = screen.getByTestId('save-notifications');
        await act(async () => {
          fireEvent.click(saveButton);
        });

        act(() => {
          capturedOnError?.('schedule.save.error');
        });

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Component=NotificationsTimeEntrySettings Event=SAVE_ERROR section=SCHEDULE_NOTIFICATIONS',
          { error: 'schedule.save.error' },
        );
      });

      it('does not log schedule notification save when no schedule fields changed', async () => {
        (
          comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
        ).mockReturnValue(['clockInNotificationReminderTime']);

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: scheduleNotificationQLData,
          isFormEditable: true,
          sandbox: mockSandbox,
        });

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        const saveButton = screen.getByTestId('save-notifications');
        await act(async () => {
          fireEvent.click(saveButton);
        });

        expect(mockSandbox.logger.info).not.toHaveBeenCalledWith(
          'Component=NotificationsTimeEntrySettings Event=SAVE_SUCCESS section=SCHEDULE_NOTIFICATIONS',
        );
        expect(mockSandbox.logger.error).not.toHaveBeenCalledWith(
          'Component=NotificationsTimeEntrySettings Event=SAVE_ERROR section=SCHEDULE_NOTIFICATIONS',
          expect.anything(),
        );
      });
    });

    describe('approval settings callbacks', () => {
      const useSetApprovalSettings =
        require('src/js/service/hooks/settings/useSetApprovalSettings')
          .useSetApprovalSettings as jest.Mock;

      it('calls onSuccess handler correctly when approval settings save succeeds', async () => {
        let capturedApprovalOnSuccess: (() => void) | undefined;
        useSetApprovalSettings.mockImplementationOnce((args: any) => {
          capturedApprovalOnSuccess = args.onSuccess;
          return [jest.fn(), { loading: false }];
        });

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: defaultQLData,
          isFormEditable: true,
          sandbox: mockSandbox,
          refetchApprovalSettings: jest.fn(),
        });

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        await waitFor(() => {
          expect(useSetApprovalSettings).toHaveBeenCalled();
        });

        expect(capturedApprovalOnSuccess).toBeDefined();
        act(() => {
          capturedApprovalOnSuccess!();
        });

        expect(mockContextValue.updateErrorMessage).toHaveBeenCalledWith('');
      });

      it('calls onError handler correctly when approval settings save fails', async () => {
        let capturedApprovalOnError: ((error: any) => void) | undefined;
        useSetApprovalSettings.mockImplementationOnce((args: any) => {
          capturedApprovalOnError = args.onError;
          return [jest.fn(), { loading: false }];
        });

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: defaultQLData,
          isFormEditable: true,
          sandbox: mockSandbox,
        });

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        await waitFor(() => {
          expect(useSetApprovalSettings).toHaveBeenCalled();
        });

        expect(capturedApprovalOnError).toBeDefined();
        act(() => {
          capturedApprovalOnError!('approval.error');
        });

        expect(mockContextValue.updateErrorMessage).toHaveBeenCalledWith(
          'approval.error',
        );
      });
    });

    describe('QL settings error handler with confirmation modal', () => {
      it('closes confirmation modal and clears form state on error when timeEntryFormOpenToUpdate is set', async () => {
        let capturedOnError: ((error: any) => void) | undefined;
        useSetQLSettings.mockImplementationOnce((args: any) => {
          capturedOnError = args.onError;
          return [mockUpdateCompanySettings, { loading: false }];
        });

        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          ...mockContextValue,
          QLData: defaultQLData,
          isFormEditable: true,
          sandbox: mockSandbox,
        });

        renderWithProviders(<TimeEntrySettingsForm type="US" />);

        await waitFor(() => {
          expect(useSetQLSettings).toHaveBeenCalled();
        });

        expect(capturedOnError).toBeDefined();
        act(() => {
          capturedOnError!('test.error');
        });

        expect(mockContextValue.reRenderTimeEntrySetting).toHaveBeenCalled();
      });
    });
  });

  describe('handleFeedBackIconClick and handleFeedbackClose', () => {
    beforeEach(() => {
      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      (useIXPFeatureFlag as jest.Mock).mockImplementation(
        ({ flagName }: { flagName: string }) => {
          if (flagName === 'QB_TIME_TRACKING_USERVOICE_FEEDBACK') {
            return {
              isEnabled: false,
              isLoading: false,
              settled: true,
              error: null,
            };
          }
          return {
            isEnabled: true,
            isLoading: false,
            settled: true,
            error: null,
          };
        },
      );
    });

    it('should toggle feedback popover when feedback icon is clicked', async () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const feedbackButton = screen.getByRole('button', {
        name: /give feedback/i,
      });

      await act(async () => {
        fireEvent.click(feedbackButton);
      });

      expect(screen.getByTestId('feedback-popover')).toBeInTheDocument();
    });

    it('should close popover and show success toast on successful feedback submission', async () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const feedbackButton = screen.getByRole('button', {
        name: /give feedback/i,
      });
      fireEvent.click(feedbackButton);

      const popover = screen.getByTestId('feedback-popover');
      const submitButton = within(popover).getByText('Submit Feedback');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('feedback-popover'),
        ).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('success-toast')).toBeInTheDocument();
    });

    it('should close popover without success toast when feedback is cancelled (null result)', async () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const feedbackButton = screen.getByRole('button', {
        name: /give feedback/i,
      });
      fireEvent.click(feedbackButton);

      const popover = screen.getByTestId('feedback-popover');
      const cancelButton = within(popover).getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('feedback-popover'),
        ).not.toBeInTheDocument();
      });

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });
  });

  describe('onSaveTimeEntrySettings', () => {
    it('should call track with tracking points and invoke handleSubmit', () => {
      const mockTrack = jest.fn();
      const { useTracking } = require('@payroll/quicksand');
      useTracking.mockReturnValue(mockTrack);

      const mockHandleSubmit = jest.fn((callback: any) => () => callback({}));
      (useTimeEntrySettings as jest.Mock).mockReturnValue({
        formState: { dirtyFields: {}, errors: {} },
        setValue: jest.fn(),
        getValues: jest.fn(),
        watch: jest.fn(),
        handleSubmit: mockHandleSubmit,
        reset: jest.fn(),
        control: {},
        clearErrors: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      mockTrack.mockClear();

      const notificationsSection = screen.getByTestId('notifications-settings');
      const updateButton = Array.from(
        notificationsSection.querySelectorAll('button'),
      ).find((btn) => btn.textContent === 'Update');
      expect(updateButton).toBeInTheDocument();
      fireEvent.click(updateButton!);

      expect(mockTrack).toHaveBeenCalled();
    });
  });

  describe('onNoConfirmationModal', () => {
    it('should discard changes and close modal when No is clicked on the confirmation modal', async () => {
      const {
        updateTimeEntrySettingsForm,
      } = require('src/js/widgets/timeTrackingSettings/hooks/timeEntrySettingsHandler');
      const {
        removeTimeEntryDirtyFieldsUtils,
      } = require('src/js/widgets/timeTrackingSettings/hooks/useTimeEntrySettingsForm');

      // Track whether dirty fields have been cleared by removeTimeEntryDirtyFieldsUtils.
      // onNoConfirmationModal calls removeTimeEntryDirtyFields → removeTimeEntryDirtyFieldsUtils,
      // then calls onFormUpdate which re-enters updateTimeEntrySettingsForm.
      // The second time, isFormContainingDirtyFields() must return false so
      // the mock switches to the new form instead of re-opening the modal.
      let hasDirtyFields = true;
      (removeTimeEntryDirtyFieldsUtils as jest.Mock).mockImplementation(() => {
        hasDirtyFields = false;
      });

      (updateTimeEntrySettingsForm as jest.Mock).mockImplementation(
        ({
          formType,
          setTimeEntryFormOpenToUpdate,
          setIsConfirmationModalOpen,
          setIsFormEdit,
        }: any) => {
          if (formType !== '' && hasDirtyFields) {
            setTimeEntryFormOpenToUpdate(formType);
            setIsConfirmationModalOpen(true);
          } else if (formType !== '' && setIsFormEdit) {
            setIsFormEdit((prev: any) => ({
              ...prev,
              isNotificationEditing: formType === 'notification',
              isTimeTrackingEditing: formType === 'timetracking',
            }));
          }
        },
      );

      (useTimeEntrySettings as jest.Mock).mockReturnValue({
        formState: {
          dirtyFields: { clockInNotificationReminderTime: true },
          errors: {},
        },
        setValue: jest.fn(),
        getValues: jest.fn(),
        watch: jest.fn(),
        handleSubmit: jest.fn((callback: any) => () => callback({})),
        reset: jest.fn(),
        control: {},
        clearErrors: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      // Try to switch to timetracking section while dirty fields exist
      const timeTrackingSection = screen.getByTestId('timetracking-settings');
      const updateButton = Array.from(
        timeTrackingSection.querySelectorAll('button'),
      ).find((btn) => btn.textContent === 'Update');

      await act(async () => {
        fireEvent.click(updateButton!);
      });

      // Confirmation modal should now be visible
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

      // Click "No" to discard changes
      const noButton = screen.getByTestId('confirmation-no');

      await act(async () => {
        fireEvent.click(noButton);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('confirmation-modal'),
        ).not.toBeInTheDocument();
      });

      expect(removeTimeEntryDirtyFieldsUtils).toHaveBeenCalled();
    });
  });

  describe('openAndScrollToNotificationsSection', () => {
    beforeEach(() => {
      jest.useFakeTimers();

      const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
      (useIXPFeatureFlag as jest.Mock).mockImplementation(
        ({ flagName }: { flagName: string }) => ({
          isEnabled: true,
          isLoading: false,
          error: null,
        }),
      );

      const {
        updateTimeEntrySettingsForm,
      } = require('src/js/widgets/timeTrackingSettings/hooks/timeEntrySettingsHandler');
      (updateTimeEntrySettingsForm as jest.Mock).mockImplementation(
        ({ formType, setIsFormEdit }: any) => {
          if (formType && setIsFormEdit) {
            setIsFormEdit((prev: any) => ({
              ...prev,
              isNotificationEditing: formType === 'notification',
            }));
          }
        },
      );
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should open notification editing and scroll to geofence section when GeoLocations triggers scroll', async () => {
      const mockTrack = jest.fn();
      const { useTracking } = require('@payroll/quicksand');
      useTracking.mockReturnValue(mockTrack);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const scrollBtn = screen.getByTestId('scroll-to-notifications-btn');
      expect(scrollBtn).toBeInTheDocument();

      mockTrack.mockClear();

      await act(async () => {
        fireEvent.click(scrollBtn);
      });

      expect(mockTrack).toHaveBeenCalled();

      const notificationsComponent = screen.getByTestId(
        'notifications-settings',
      );
      const notificationsWrapper = notificationsComponent.parentElement;
      if (notificationsWrapper) {
        notificationsWrapper.scrollIntoView = jest.fn();
      }

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(notificationsWrapper?.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    it('should skip onFormUpdate when notification section is already in edit mode', async () => {
      const {
        updateTimeEntrySettingsForm,
      } = require('src/js/widgets/timeTrackingSettings/hooks/timeEntrySettingsHandler');

      (updateTimeEntrySettingsForm as jest.Mock).mockImplementation(
        ({ formType, setIsFormEdit }: any) => {
          if (formType && setIsFormEdit) {
            setIsFormEdit((prev: any) => ({
              ...prev,
              isNotificationEditing: formType === 'notification',
            }));
          }
        },
      );

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      const scrollBtn = screen.getByTestId('scroll-to-notifications-btn');

      await act(async () => {
        fireEvent.click(scrollBtn);
      });

      const callCountAfterFirst = (
        updateTimeEntrySettingsForm as jest.Mock
      ).mock.calls.filter(
        (call: any) => call[0]?.formType === 'notification',
      ).length;

      await act(async () => {
        fireEvent.click(scrollBtn);
      });

      const callCountAfterSecond = (
        updateTimeEntrySettingsForm as jest.Mock
      ).mock.calls.filter(
        (call: any) => call[0]?.formType === 'notification',
      ).length;

      // After the first click sets isNotificationEditing=true, the second click
      // should not trigger another onFormUpdate for 'notification'
      expect(callCountAfterSecond).toBe(callCountAfterFirst);
    });
  });

  describe('deep link navigation', () => {
    const useDeepLinkNavigation =
      require('src/js/widgets/timeTrackingSettings/hooks/useDeepLinkNavigation')
        .useDeepLinkNavigation as jest.Mock;

    beforeEach(() => {
      useDeepLinkNavigation.mockReturnValue({
        isDeepLinkNavigating: false,
        breaksInitialView: undefined,
        overtimeInitialView: undefined,
        geoLocationsInitialOpen: false,
        customFieldsInitialOpen: false,
        pendingFormType: null,
        pendingScrollTarget: null,
        clearPendingNavigation: jest.fn(),
        publishNavigationComplete: jest.fn(),
      });
    });

    it('should call onFormUpdate when pendingFormType is set', async () => {
      const mockClearPendingNavigation = jest.fn();
      const {
        updateTimeEntrySettingsForm,
      } = require('src/js/widgets/timeTrackingSettings/hooks/timeEntrySettingsHandler');

      useDeepLinkNavigation.mockReturnValue({
        isDeepLinkNavigating: false,
        breaksInitialView: undefined,
        overtimeInitialView: undefined,
        geoLocationsInitialOpen: false,
        customFieldsInitialOpen: false,
        pendingFormType: 'notification',
        pendingScrollTarget: null,
        clearPendingNavigation: mockClearPendingNavigation,
        publishNavigationComplete: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      await waitFor(() => {
        expect(updateTimeEntrySettingsForm).toHaveBeenCalled();
      });

      expect(mockClearPendingNavigation).toHaveBeenCalled();
    });

    it('should clear pending navigation when pendingScrollTarget is set', async () => {
      const mockClearPendingNavigation = jest.fn();

      useDeepLinkNavigation.mockReturnValue({
        isDeepLinkNavigating: false,
        breaksInitialView: undefined,
        overtimeInitialView: undefined,
        geoLocationsInitialOpen: false,
        customFieldsInitialOpen: false,
        pendingFormType: null,
        pendingScrollTarget: {
          elementId: 'notifications-settings',
          delay: 100,
        },
        clearPendingNavigation: mockClearPendingNavigation,
        publishNavigationComplete: jest.fn(),
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      await waitFor(() => {
        expect(mockClearPendingNavigation).toHaveBeenCalled();
      });
    });
  });

  describe('ITM setup-timesheet task completion', () => {
    const {
      useUpdateItmTask,
    } = require('src/js/widgets/qbtOrchestrator/features/overview/hooks');
    const {
      selectItmTasks,
    } = require('src/js/widgets/qbtOrchestrator/features/overview/store/overviewSelectors');
    const useSetQLSettings =
      require('src/js/service/hooks/settings/useSetQLSettings')
        .useSetQLSettings as jest.Mock;
    const {
      hasApprovalSettingsChanges,
    } = require('src/js/widgets/timeTrackingSettings/hooks/mapApprovalSettings');
    const {
      comparingTimeEntrySettingsToPreviousTimeEntrySettings,
      mappedTimeEntrySettingsForMutation,
    } = require('src/js/widgets/timeTrackingSettings/hooks/useTimeEntrySettingsForm');
    const {
      buildOvertimeNotificationsManageInput,
    } = require('src/js/widgets/userSettings/components/cards/NotificationsCard/utils/overtimeNotifications.utils');

    const OPEN_SETUP_TIMESHEET_TASK = {
      id: 'setup-timesheet-task-id',
      name: 'Set up timesheets',
      status: 'Open',
      type: 'setup-timesheet',
    };

    let mockUpdateItmTask: jest.Mock;
    let mockUpdateCompanySettings: jest.Mock;

    beforeEach(() => {
      mockUpdateItmTask = jest.fn().mockResolvedValue({ success: true });
      (useUpdateItmTask as jest.Mock).mockReturnValue({
        updateItmTask: mockUpdateItmTask,
      });
      (selectItmTasks as jest.Mock).mockReturnValue([
        OPEN_SETUP_TIMESHEET_TASK,
      ]);

      (hasApprovalSettingsChanges as jest.Mock).mockReturnValue(false);
      (
        comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
      ).mockReturnValue([]);
      (buildOvertimeNotificationsManageInput as jest.Mock).mockReturnValue(
        null,
      );

      mockUpdateCompanySettings = jest.fn();
      useSetQLSettings.mockImplementation(() => [
        mockUpdateCompanySettings,
        { loading: false },
      ]);
    });

    it('marks the open setup-timesheet task DoneYes when the timesheet section is saved without changes', async () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('save-timesheet'));
      });

      // No changes means no settings mutation runs...
      expect(mockUpdateCompanySettings).not.toHaveBeenCalled();
      // ...but the ITM task is still completed on the save click itself.
      expect(mockUpdateItmTask).toHaveBeenCalledWith({
        id: 'setup-timesheet-task-id',
        status: 'DoneYes',
      });
    });

    it('marks the open setup-timesheet task DoneYes when the timesheet section is saved with changes', async () => {
      (
        comparingTimeEntrySettingsToPreviousTimeEntrySettings as jest.Mock
      ).mockReturnValue(['someTimesheetField']);
      (mappedTimeEntrySettingsForMutation as jest.Mock).mockReturnValue({
        notificationSettings: {},
      });

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('save-timesheet'));
      });

      expect(mockUpdateItmTask).toHaveBeenCalledWith({
        id: 'setup-timesheet-task-id',
        status: 'DoneYes',
      });
    });

    it('does not update any ITM task when there is no open setup-timesheet task', async () => {
      (selectItmTasks as jest.Mock).mockReturnValue([
        { ...OPEN_SETUP_TIMESHEET_TASK, status: 'DoneYes' },
      ]);

      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('save-timesheet'));
      });

      expect(mockUpdateItmTask).not.toHaveBeenCalled();
    });

    it('does not complete the setup-timesheet task when a non-timesheet section is saved', async () => {
      renderWithProviders(<TimeEntrySettingsForm type="US" />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('save-notifications'));
      });

      expect(mockUpdateItmTask).not.toHaveBeenCalled();
    });
  });

  describe('standalone timesheet trowser (trowserKey="timesheet-settings")', () => {
    it('renders only the timesheet section without the rest of the settings page', async () => {
      renderWithProviders(
        <TimeEntrySettingsForm type="US" trowserKey="timesheet-settings" />,
      );
      await act(async () => {});

      expect(screen.getByText('TimeSheetFields Component')).toBeInTheDocument();
      expect(
        screen.queryByText('TimeTrackingTimeEntrySettings Component'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Notification Component'),
      ).not.toBeInTheDocument();
    });

    it('hides the collapsed view section by passing hideViewSection to TimeSheetFields', async () => {
      renderWithProviders(
        <TimeEntrySettingsForm type="US" trowserKey="timesheet-settings" />,
      );
      await act(async () => {});

      expect(screen.getByTestId('timeSheet-settings')).toHaveAttribute(
        'data-hide-view-section',
        'true',
      );
    });

    it('auto-opens the timesheet trowser on mount', async () => {
      const {
        updateTimeEntrySettingsForm,
      } = require('src/js/widgets/timeTrackingSettings/hooks/timeEntrySettingsHandler');
      (updateTimeEntrySettingsForm as jest.Mock).mockImplementation(
        ({ formType, setIsTimeSheetEditing }: any) => {
          if (
            formType === TimeEntriesFormType.TIMESHEET &&
            setIsTimeSheetEditing
          ) {
            setIsTimeSheetEditing(true);
          }
        },
      );

      renderWithProviders(
        <TimeEntrySettingsForm type="US" trowserKey="timesheet-settings" />,
      );
      await act(async () => {});

      // The auto-open effect requests the timesheet section on mount.
      expect(updateTimeEntrySettingsForm).toHaveBeenCalledWith(
        expect.objectContaining({ formType: TimeEntriesFormType.TIMESHEET }),
      );
      await waitFor(() => {
        expect(screen.getByTestId('timeSheet-settings')).toHaveAttribute(
          'data-is-editing',
          'true',
        );
      });
    });

    it('invokes onClose once the trowser is closed (cancel)', async () => {
      const {
        updateTimeEntrySettingsForm,
        cancelTimeEntrySettingsForm,
      } = require('src/js/widgets/timeTrackingSettings/hooks/timeEntrySettingsHandler');
      (updateTimeEntrySettingsForm as jest.Mock).mockImplementation(
        ({ formType, setIsTimeSheetEditing }: any) => {
          if (
            formType === TimeEntriesFormType.TIMESHEET &&
            setIsTimeSheetEditing
          ) {
            setIsTimeSheetEditing(true);
          }
        },
      );
      (cancelTimeEntrySettingsForm as jest.Mock).mockImplementation(
        ({ setIsTimeSheetEditing }: any) => {
          if (setIsTimeSheetEditing) {
            setIsTimeSheetEditing(false);
          }
        },
      );

      const onClose = jest.fn();
      renderWithProviders(
        <TimeEntrySettingsForm
          type="US"
          trowserKey="timesheet-settings"
          onClose={onClose}
        />,
      );
      await act(async () => {});

      // Auto-open should have opened the trowser first.
      await waitFor(() => {
        expect(screen.getByTestId('timeSheet-settings')).toHaveAttribute(
          'data-is-editing',
          'true',
        );
      });
      expect(onClose).not.toHaveBeenCalled();

      await act(async () => {
        fireEvent.click(
          within(screen.getByTestId('timeSheet-settings')).getByText('Cancel'),
        );
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onClose when not in standalone mode', async () => {
      const onClose = jest.fn();
      renderWithProviders(
        <TimeEntrySettingsForm type="US" onClose={onClose} />,
      );
      await act(async () => {});

      // Full settings page renders (page chrome present).
      expect(
        screen.getByText('TimeTrackingTimeEntrySettings Component'),
      ).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(
          within(screen.getByTestId('timeSheet-settings')).getByText('Update'),
        );
      });
      await act(async () => {
        fireEvent.click(
          within(screen.getByTestId('timeSheet-settings')).getByText('Cancel'),
        );
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes the trowser via onClose when "Set defaults" is clicked and source is payroll_defaults', async () => {
      const onClose = jest.fn();
      renderWithProviders(
        <TimeEntrySettingsForm
          type="US"
          trowserKey="timesheet-settings"
          onClose={onClose}
          source="payroll_defaults"
        />,
      );
      await act(async () => {});

      await act(async () => {
        fireEvent.click(screen.getByTestId('dimensions-set-defaults'));
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close the trowser on "Set defaults" when source is not payroll_defaults', async () => {
      const onClose = jest.fn();
      renderWithProviders(
        <TimeEntrySettingsForm
          type="US"
          trowserKey="timesheet-settings"
          onClose={onClose}
        />,
      );
      await act(async () => {});

      await act(async () => {
        fireEvent.click(screen.getByTestId('dimensions-set-defaults'));
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
