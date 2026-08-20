import React, { createContext } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useForm, FormProvider } from 'react-hook-form';

import { Identity_EntitlementGrant } from 'src/__generated__/oigql/graphql';
import { Sandbox } from 'src/js/common/sandbox';
import { MappedQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import { EditNotificationTimeEntry } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditNotificationTimeEntrySettings';

// Create mock context type and context
interface TimeTrackingSettingsContextType {
  QLData: MappedQLSettings;
  isQLSettingsLoading: boolean;
  QLSettingsError?: string;
  v3PreferencesData: any;
  v3PreferencesLoading: boolean;
  v3PreferencesError?: boolean;
  QLSettingsRefetch: () => void;
  text: (id: string) => string;
  entitlements: Identity_EntitlementGrant[];
  entitlementsLoading: boolean;
  sandbox: Sandbox;
  isFormEditable: boolean;
  errorMessage: string;
  isRenderTimeEntry: boolean;
  reRenderTimeEntrySetting: (message: string) => void;
  updateErrorMessage: (message: string) => void;
}

const TimeTrackingSettingsContext = createContext<
  TimeTrackingSettingsContextType | undefined
>(undefined);

// Mock the context hook
jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: jest.fn(),
  }),
);

// Mock the NotificationTimeDropDown component
jest.mock(
  'src/js/widgets/timeTrackingSettings/common/NotificationTimeDropDown.tsx',
  () => ({
    NotificationTimeDropDown: ({
      name,
      labelKey,
    }: {
      name: string;
      labelKey: string;
    }) => (
      <div data-testid={`notification-time-dropdown-${name}`}>{labelKey}</div>
    ),
  }),
);

// Mock the constants
jest.mock(
  'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm.ts',
  () => ({
    NOTIFICATION_DAYS_OF_WEEK: {
      monday: 'MONDAY',
      tuesday: 'TUESDAY',
      wednesday: 'WEDNESDAY',
      thursday: 'THURSDAY',
      friday: 'FRIDAY',
      saturday: 'SATURDAY',
      sunday: 'SUNDAY',
    },
    NOTIFY_OPTIONS: ['adminsAndManagers', 'adminsOnly', 'managersOnly', 'none'],
  }),
);

const formatMessageMock = jest.fn(({ id }: { id: string }) => id);

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: formatMessageMock,
  }),
  useTracking: jest.fn(() => jest.fn()),
  useSandbox: jest.fn().mockReturnValue({
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    navigation: {
      navigate: jest.fn(),
    },
  }),
}));

describe('EditNotificationTimeEntry', () => {
  const mockText = jest.fn((id: string) => {
    const messages: Record<string, string> = {
      'time-entries.section.title.time-tracking': 'Time Tracking',
      'time-entries.section.title.notifications.time-tracking.send-clock-in-reminder-at':
        'Send Clock-in Reminder At',
      'time-entries.section.title.notifications.time-tracking.send-clock-out-reminder-at':
        'Send Clock-out Reminder At',
      'time-entries.section.title.notifications.time-tracking.days-reminders-are-sent':
        'Days Reminders Are Sent',
      'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted':
        'Notify When Clock-in/out Is Adjusted',
      'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited':
        'Notify When Notes Are Added Or Edited',
      'location-settings.fields.select-days': 'Select Days',
      email: 'email',
      mobile: 'mobile',
      monday: 'monday',
      tuesday: 'tuesday',
      wednesday: 'wednesday',
      thursday: 'thursday',
      friday: 'friday',
      saturday: 'saturday',
      sunday: 'sunday',
      adminsAndManagers: 'Admins and Managers',
      adminsOnly: 'Admins Only',
      managersOnly: 'Managers Only',
      none: 'None',
    };
    return messages[id] || id;
  });

  const defaultContextValue: TimeTrackingSettingsContextType = {
    QLData: {} as MappedQLSettings,
    isQLSettingsLoading: false,
    QLSettingsError: undefined,
    v3PreferencesData: {},
    v3PreferencesLoading: false,
    v3PreferencesError: false,
    QLSettingsRefetch: jest.fn(),
    text: mockText,
    entitlements: [],
    entitlementsLoading: false,
    sandbox: {} as Sandbox,
    isFormEditable: true,
    errorMessage: '',
    isRenderTimeEntry: false,
    reRenderTimeEntrySetting: jest.fn(),
    updateErrorMessage: jest.fn(),
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    // Mock the context hook to return our default context value
    const {
      useTimeTrackingSettingsContext,
    } = require('src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext');
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(
      defaultContextValue,
    );
    formatMessageMock.mockClear();

    // Ensure useSandbox and useTracking mocks are properly set up
    const { useSandbox, useTracking } = require('@payroll/quicksand');
    useSandbox.mockReturnValue({
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
      navigation: {
        navigate: jest.fn(),
      },
    });
    useTracking.mockReturnValue(jest.fn());
  });

  const renderComponent = (
    isFieldsVisible = {
      notifyWhenClockInOutTimeAdjusted: true,
      notifyWhenNotesAreAddedOrEdited: true,
    },
  ) => {
    const { result } = renderHook(() =>
      useForm({
        defaultValues: {
          clockInNotificationReminderTime: '',
          clockInNotificationReminderEmail: false,
          clockInNotificationReminderMobile: false,
          clockOutNotificationReminderTime: '',
          clockOutNotificationReminderEmail: false,
          clockOutNotificationReminderMobile: false,
          notificationEnabledForDays: [],
          notifyWhenClockInOutUpdated: '',
          notifyWhenNotesAreAddedOrEdited: '',
        },
      }),
    );
    const formMethods = result.current;

    return render(
      <FormProvider {...formMethods}>
        <EditNotificationTimeEntry isFieldsVisible={isFieldsVisible} />
      </FormProvider>,
    );
  };

  it('renders the time tracking section header', () => {
    renderComponent();
    expect(
      screen.getByText('time-entries.section.title.time-tracking'),
    ).toBeInTheDocument();
  });

  it('renders clock-in notification settings', () => {
    renderComponent();

    // Check time dropdown
    const clockInDropdown = screen.getByTestId(
      'notification-time-dropdown-clockInNotificationReminderTime',
    );
    expect(clockInDropdown).toBeInTheDocument();
    expect(clockInDropdown).toHaveTextContent(
      'time-entries.section.title.notifications.time-tracking.send-clock-in-reminder-at',
    );

    // Check email and mobile labels and checkboxes
    const emailLabel = screen.getByText('email');
    const mobileLabel = screen.getByText('mobile');
    expect(emailLabel).toBeInTheDocument();
    expect(mobileLabel).toBeInTheDocument();

    // Get all checkboxes and verify we have the right number
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(2); // At least email and mobile checkboxes

    // Verify the email and mobile checkboxes are next to their labels
    const emailCheckbox = emailLabel
      .closest('div')
      ?.querySelector('input[type="checkbox"]');
    const mobileCheckbox = mobileLabel
      .closest('div')
      ?.querySelector('input[type="checkbox"]');
    expect(emailCheckbox).toBeInTheDocument();
    expect(mobileCheckbox).toBeInTheDocument();
  });

  it('renders clock-out notification settings', () => {
    renderComponent();

    // Check time dropdown
    const clockOutDropdown = screen.getByTestId(
      'notification-time-dropdown-clockOutNotificationReminderTime',
    );
    expect(clockOutDropdown).toBeInTheDocument();
    expect(clockOutDropdown).toHaveTextContent(
      'time-entries.section.title.notifications.time-tracking.send-clock-out-reminder-at',
    );

    // Get all checkboxes in the clock-out section
    const clockOutSection = clockOutDropdown.closest('div');
    expect(clockOutSection).toBeInTheDocument();

    // Find the checkboxes that are part of the clock-out section
    const clockOutCheckboxes = clockOutSection?.querySelectorAll(
      'input[type="checkbox"]',
    );
    expect(clockOutCheckboxes?.length).toBe(0);
  });

  it('renders days of week selection dropdown', () => {
    renderComponent();

    const daysDropdown = screen.getByLabelText('notificationEnabledForDays');
    expect(daysDropdown).toBeInTheDocument();
    expect(
      screen.getByText(
        'time-entries.section.title.notifications.time-tracking.days-reminders-are-sent',
      ),
    ).toBeInTheDocument();
  });

  it('renders clock-in/out adjustment notification settings', () => {
    renderComponent();

    const adjustmentDropdown = screen.getByLabelText(
      'notifyWhenClockInOutUpdated',
    );
    expect(adjustmentDropdown).toBeInTheDocument();
    expect(
      screen.getByText(
        'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
      ),
    ).toBeInTheDocument();
  });

  it('renders notes change notification settings', () => {
    renderComponent();

    const notesDropdown = screen.getByLabelText(
      'notifyWhenNotesAreAddedOrEdited',
    );
    expect(notesDropdown).toBeInTheDocument();
    expect(
      screen.getByText(
        'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited',
      ),
    ).toBeInTheDocument();
  });

  it('handles checkbox changes correctly', () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  it('handles checkbox unchecking correctly', () => {
    const { result } = renderHook(() =>
      useForm({
        defaultValues: {
          clockInNotificationReminderTime: '',
          clockInNotificationReminderEmail: true, // Start with email enabled
          clockInNotificationReminderMobile: true, // Start with mobile enabled
          clockOutNotificationReminderTime: '',
          clockOutNotificationReminderEmail: true, // Start with email enabled
          clockOutNotificationReminderMobile: true, // Start with mobile enabled
          notificationEnabledForDays: [],
          notifyWhenClockInOutUpdated: '',
          notifyWhenNotesAreAddedOrEdited: '',
        },
      }),
    );
    const formMethods = result.current;

    render(
      <FormProvider {...formMethods}>
        <EditNotificationTimeEntry
          isFieldsVisible={{
            notifyWhenClockInOutTimeAdjusted: true,
            notifyWhenNotesAreAddedOrEdited: true,
          }}
        />
      </FormProvider>,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      // Start with checked state
      expect(checkbox).toBeChecked();

      // Uncheck the checkbox
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('days selection functionality', () => {
    const renderWithEnabledDropdown = () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: {
            clockInNotificationReminderTime: '',
            clockInNotificationReminderEmail: true, // Enable email notification by default
            clockInNotificationReminderMobile: false,
            clockOutNotificationReminderTime: '',
            clockOutNotificationReminderEmail: false,
            clockOutNotificationReminderMobile: false,
            notificationEnabledForDays: [],
            notifyWhenClockInOutUpdated: '',
            notifyWhenNotesAreAddedOrEdited: '',
          },
        }),
      );
      const formMethods = result.current;

      return render(
        <FormProvider {...formMethods}>
          <EditNotificationTimeEntry
            isFieldsVisible={{
              notifyWhenClockInOutTimeAdjusted: true,
              notifyWhenNotesAreAddedOrEdited: true,
            }}
          />
        </FormProvider>,
      );
    };

    it('allows selecting days when notifications are enabled', () => {
      renderWithEnabledDropdown();

      const daysDropdown = screen.getByRole('combobox', {
        name: 'notificationEnabledForDays',
      });
      expect(daysDropdown).toBeEnabled();

      // Open the dropdown
      fireEvent.click(daysDropdown);

      const mondayOption = screen.getByText('monday');
      fireEvent.click(mondayOption);

      // Verify the day was selected
      expect(daysDropdown).toHaveValue('monday');
    });

    it('allows deselecting days', () => {
      renderWithEnabledDropdown();

      const daysDropdown = screen.getByRole('combobox', {
        name: 'notificationEnabledForDays',
      });

      // Open and select a day
      fireEvent.click(daysDropdown);
      const mondayOption = screen.getByText('monday');
      fireEvent.click(mondayOption);
      expect(daysDropdown).toHaveValue('monday');

      // Deselect the day
      fireEvent.click(mondayOption);
      expect(daysDropdown).toHaveValue('');
    });

    it('allows selecting multiple days', () => {
      renderWithEnabledDropdown();

      const daysDropdown = screen.getByRole('combobox', {
        name: 'notificationEnabledForDays',
      });

      // Open and select first day
      fireEvent.click(daysDropdown);
      const mondayOption = screen.getByText('monday');
      fireEvent.click(mondayOption);

      // Select second day
      const tuesdayOption = screen.getByText('tuesday');
      fireEvent.click(tuesdayOption);

      // Verify both days are selected
      expect(daysDropdown).toHaveValue('monday, tuesday');
    });

    it('handles initial day selection when no days are selected', () => {
      renderWithEnabledDropdown();

      const daysDropdown = screen.getByRole('combobox', {
        name: 'notificationEnabledForDays',
      });

      // Open the dropdown
      fireEvent.click(daysDropdown);

      // Select a day when no days are previously selected
      const mondayOption = screen.getByText('monday');
      fireEvent.click(mondayOption);

      // Verify the day was selected
      expect(daysDropdown).toHaveValue('monday');
    });
  });

  describe('notification option changes', () => {
    it('handles clock-in/out adjustment notification changes', () => {
      renderComponent({
        notifyWhenClockInOutTimeAdjusted: true,
        notifyWhenNotesAreAddedOrEdited: false,
      });

      const adjustmentDropdown = screen.getByLabelText(
        'notifyWhenClockInOutUpdated',
      );

      // Open the dropdown
      fireEvent.click(adjustmentDropdown);

      // Select Admins and Managers
      const adminsAndManagersOption = screen.getByRole('option', {
        name: 'adminsAndManagers',
      });
      fireEvent.click(adminsAndManagersOption);

      // Verify the form value was updated
      expect(adjustmentDropdown).toHaveValue('adminsAndManagers');

      // Open the dropdown again
      fireEvent.click(adjustmentDropdown);

      // Select Admins Only
      const adminsOnlyOption = screen.getByRole('option', {
        name: 'adminsOnly',
      });
      fireEvent.click(adminsOnlyOption);

      // Verify the form value was updated
      expect(adjustmentDropdown).toHaveValue('adminsOnly');
    });

    it('handles notes change notification changes', () => {
      renderComponent({
        notifyWhenClockInOutTimeAdjusted: false,
        notifyWhenNotesAreAddedOrEdited: true,
      });

      const notesDropdown = screen.getByLabelText(
        'notifyWhenNotesAreAddedOrEdited',
      );

      // Open the dropdown
      fireEvent.click(notesDropdown);

      // Select Admins and Managers
      const adminsAndManagersOption = screen.getByRole('option', {
        name: 'adminsAndManagers',
      });
      fireEvent.click(adminsAndManagersOption);

      // Verify the form value was updated
      expect(notesDropdown).toHaveValue('adminsAndManagers');

      // Open the dropdown again
      fireEvent.click(notesDropdown);

      // Select Managers Only
      const managersOnlyOption = screen.getByRole('option', {
        name: 'managersOnly',
      });
      fireEvent.click(managersOnlyOption);

      // Verify the form value was updated
      expect(notesDropdown).toHaveValue('managersOnly');
    });
  });

  describe('notification recipient text formatting', () => {
    it('formats notification recipient text correctly', () => {
      renderComponent({
        notifyWhenClockInOutTimeAdjusted: true,
        notifyWhenNotesAreAddedOrEdited: true,
      });

      // Get all calls to formatMessage
      const formatMessageCalls = formatMessageMock.mock.calls;
      const usedMessageIds = formatMessageCalls.map((call) => call[0].id);

      // Verify that all required message keys are present
      const requiredMessageIds = [
        'time-entries.section.title.time-tracking',
        'location-settings.fields.select-days',
        'time-entries.section.title.notifications.time-tracking.days-reminders-are-sent',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
        'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
        'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited',
        'adminsAndManagers',
        'adminsOnly',
        'managersOnly',
        'none',
      ];

      requiredMessageIds.forEach((messageId) => {
        expect(usedMessageIds).toContain(messageId);
      });
    });
  });

  describe('conditional field visibility', () => {
    it('shows clock-in/out adjustment notification when enabled', () => {
      renderComponent({
        notifyWhenClockInOutTimeAdjusted: true,
        notifyWhenNotesAreAddedOrEdited: false,
      });

      expect(
        screen.getByText(
          'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited',
        ),
      ).not.toBeInTheDocument();
    });

    it('shows notes change notification when enabled', () => {
      renderComponent({
        notifyWhenClockInOutTimeAdjusted: false,
        notifyWhenNotesAreAddedOrEdited: true,
      });

      expect(
        screen.queryByText(
          'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(
          'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited',
        ),
      ).toBeInTheDocument();
    });

    it('hides both conditional notifications when disabled', () => {
      renderComponent({
        notifyWhenClockInOutTimeAdjusted: false,
        notifyWhenNotesAreAddedOrEdited: false,
      });

      expect(
        screen.queryByText(
          'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited',
        ),
      ).not.toBeInTheDocument();
    });

    it('shows both conditional notifications when enabled', () => {
      renderComponent({
        notifyWhenClockInOutTimeAdjusted: true,
        notifyWhenNotesAreAddedOrEdited: true,
      });

      expect(
        screen.getByText(
          'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited',
        ),
      ).toBeInTheDocument();
    });
  });
});
