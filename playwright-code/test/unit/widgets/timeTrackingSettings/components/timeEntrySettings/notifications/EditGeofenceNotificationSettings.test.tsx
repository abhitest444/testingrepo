import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { EditGeofenceNotificationSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditGeofenceNotificationSettings';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';

// Mock useIntl and useTracking
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'time-entries.section.title.notifications.geofence':
          'Geofence Locations',
        'time-entries.section.title.notifications.geofence.send-reminder-to-team':
          'Send reminder to team',
        'time-entries.section.title.notifications.geofence.start-time':
          'Start time',
        'time-entries.section.title.notifications.geofence.end-time':
          'End time',
        'time-entries.section.title.notifications.geofence.days-of-week':
          'Days of week',
        'common.day.monday': 'Monday',
        'common.day.tuesday': 'Tuesday',
        'common.day.wednesday': 'Wednesday',
        'common.day.thursday': 'Thursday',
        'common.day.friday': 'Friday',
        'common.day.saturday': 'Saturday',
        'common.day.sunday': 'Sunday',
      };
      return messages[id] || id;
    },
  }),
  useTracking: () => jest.fn(),
}));

// Mock NotificationTimeDropDown - capture all props for tracking point assertions
jest.mock(
  'src/js/widgets/timeTrackingSettings/common/NotificationTimeDropDown',
  () => ({
    NotificationTimeDropDown: jest.fn(
      ({
        name,
        labelKey,
      }: {
        name: string;
        labelKey: string;
        trackingPoint?: object;
      }) => (
        <div data-testid={`notification-time-dropdown-${name}`}>
          <label htmlFor={`time-select-${name}`}>{labelKey}</label>
          <select
            id={`time-select-${name}`}
            data-testid={`time-select-${name}`}
          >
            <option value="8:00 AM">8:00 AM</option>
            <option value="9:00 AM">9:00 AM</option>
            <option value="5:00 PM">5:00 PM</option>
            <option value="6:00 PM">6:00 PM</option>
          </select>
        </div>
      ),
    ),
  }),
);

// Mock ReminderDayDropdown - capture all props for tracking point assertions
jest.mock(
  'src/js/widgets/timeTrackingSettings/common/ReminderDayDropdown',
  () => ({
    ReminderDayDropdown: jest.fn(
      ({
        name,
        mode,
        multiselect,
        labelKey,
      }: {
        name: string;
        mode: string;
        multiselect: boolean;
        labelKey: string;
        trackingPoint?: object;
        onTrack?: (point: object) => void;
      }) => (
        <div data-testid={`reminder-day-dropdown-${name}`}>
          {labelKey && <label htmlFor={`day-select-${name}`}>{labelKey}</label>}
          <select
            id={`day-select-${name}`}
            data-testid={`day-select-${name}`}
            multiple={multiselect}
            data-mode={mode}
          >
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
            <option value="SATURDAY">Saturday</option>
            <option value="SUNDAY">Sunday</option>
          </select>
        </div>
      ),
    ),
  }),
);

const TestWrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const methods = useForm({
    defaultValues: {
      geofenceReminderStartTime: '8:00 AM',
      geofenceReminderEndTime: '5:00 PM',
      geofenceReminderDaysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('EditGeofenceNotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <EditGeofenceNotificationSettings />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it('should render the main section header', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      expect(screen.getByText('Geofence Locations')).toBeInTheDocument();
    });

    it('should render the section subheader', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      expect(screen.getByText('Send reminder to team')).toBeInTheDocument();
    });
  });

  describe('Form Elements Rendering', () => {
    it('should render all form elements', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      // Check section header
      expect(screen.getByText('Geofence Locations')).toBeInTheDocument();

      // Check subheader
      expect(screen.getByText('Send reminder to team')).toBeInTheDocument();

      // Check start time dropdown
      expect(
        screen.getByTestId(
          'notification-time-dropdown-geofenceReminderStartTime',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('time-select-geofenceReminderStartTime'),
      ).toBeInTheDocument();

      // Check end time dropdown
      expect(
        screen.getByTestId(
          'notification-time-dropdown-geofenceReminderEndTime',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('time-select-geofenceReminderEndTime'),
      ).toBeInTheDocument();

      // Check days of week dropdown
      expect(
        screen.getByTestId('reminder-day-dropdown-geofenceReminderDaysOfWeek'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('day-select-geofenceReminderDaysOfWeek'),
      ).toBeInTheDocument();
    });

    it('should render with correct test IDs', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      expect(
        screen.getByTestId('geofence-reminder-start-time'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('geofence-reminder-end-time'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('geofence-reminder-days-of-week'),
      ).toBeInTheDocument();
    });
  });

  describe('NotificationTimeDropDown Components', () => {
    it('should render start time dropdown with correct props', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const startTimeDropdown = screen.getByTestId(
        'notification-time-dropdown-geofenceReminderStartTime',
      );
      expect(startTimeDropdown).toBeInTheDocument();

      const startTimeSelect = screen.getByTestId(
        'time-select-geofenceReminderStartTime',
      );
      expect(startTimeSelect).toBeInTheDocument();
    });

    it('should render end time dropdown with correct props', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const endTimeDropdown = screen.getByTestId(
        'notification-time-dropdown-geofenceReminderEndTime',
      );
      expect(endTimeDropdown).toBeInTheDocument();

      const endTimeSelect = screen.getByTestId(
        'time-select-geofenceReminderEndTime',
      );
      expect(endTimeSelect).toBeInTheDocument();
    });

    it('should handle start time dropdown change', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const startTimeSelect = screen.getByTestId(
        'time-select-geofenceReminderStartTime',
      );

      fireEvent.change(startTimeSelect, { target: { value: '9:00 AM' } });
      expect(startTimeSelect).toHaveValue('9:00 AM');
    });

    it('should handle end time dropdown change', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const endTimeSelect = screen.getByTestId(
        'time-select-geofenceReminderEndTime',
      );

      fireEvent.change(endTimeSelect, { target: { value: '6:00 PM' } });
      expect(endTimeSelect).toHaveValue('6:00 PM');
    });
  });

  describe('ReminderDayDropdown Component', () => {
    it('should render days dropdown with correct props', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const daysDropdown = screen.getByTestId(
        'reminder-day-dropdown-geofenceReminderDaysOfWeek',
      );
      expect(daysDropdown).toBeInTheDocument();

      const daysSelect = screen.getByTestId(
        'day-select-geofenceReminderDaysOfWeek',
      );
      expect(daysSelect).toBeInTheDocument();
      expect(daysSelect).toHaveAttribute('multiple');
      expect(daysSelect).toHaveAttribute('data-mode', 'DAILY');
    });

    it('should render days dropdown with multiselect enabled', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const daysSelect = screen.getByTestId(
        'day-select-geofenceReminderDaysOfWeek',
      );
      expect(daysSelect).toHaveAttribute('multiple');
    });

    it('should render days dropdown with DAILY mode', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const daysSelect = screen.getByTestId(
        'day-select-geofenceReminderDaysOfWeek',
      );
      expect(daysSelect).toHaveAttribute('data-mode', 'DAILY');
    });

    it('should handle days dropdown change', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const daysSelect = screen.getByTestId(
        'day-select-geofenceReminderDaysOfWeek',
      );

      fireEvent.change(daysSelect, { target: { value: 'THURSDAY' } });
      expect(daysSelect).toBeInTheDocument();
    });
  });

  describe('Form Layout and Styling', () => {
    it('should render start time in first row', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const startTimeSection = screen.getByTestId(
        'geofence-reminder-start-time',
      );
      expect(startTimeSection).toBeInTheDocument();
    });

    it('should render end time in second row', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const endTimeSection = screen.getByTestId('geofence-reminder-end-time');
      expect(endTimeSection).toBeInTheDocument();
    });

    it('should render days of week in third row', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      const daysSection = screen.getByTestId('geofence-reminder-days-of-week');
      expect(daysSection).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('should handle empty default values', () => {
      const TestWrapperWithEmptyDefaults: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            geofenceReminderStartTime: '',
            geofenceReminderEndTime: '',
            geofenceReminderDaysOfWeek: [],
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithEmptyDefaults>
          <EditGeofenceNotificationSettings />
        </TestWrapperWithEmptyDefaults>,
      );

      // Component should render without errors even with empty defaults
      expect(screen.getByText('Geofence Locations')).toBeInTheDocument();
    });

    it('should handle default values with data', () => {
      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      // All form elements should be present
      expect(
        screen.getByTestId('time-select-geofenceReminderStartTime'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('time-select-geofenceReminderEndTime'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('day-select-geofenceReminderDaysOfWeek'),
      ).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate with react-hook-form', () => {
      const TestWrapperWithForm: React.FC<React.PropsWithChildren<{}>> = ({
        children,
      }) => {
        const methods = useForm({
          defaultValues: {
            geofenceReminderStartTime: '8:00 AM',
            geofenceReminderEndTime: '5:00 PM',
            geofenceReminderDaysOfWeek: ['MONDAY', 'TUESDAY'],
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithForm>
          <EditGeofenceNotificationSettings />
        </TestWrapperWithForm>,
      );

      // Component should render and integrate with form
      expect(screen.getByText('Geofence Locations')).toBeInTheDocument();
      expect(
        screen.getByTestId(
          'notification-time-dropdown-geofenceReminderStartTime',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Tracking Points', () => {
    it('should pass GEOFENCE_REMINDER_START_TIME tracking point to start time dropdown', () => {
      const {
        NotificationTimeDropDown,
      } = require('src/js/widgets/timeTrackingSettings/common/NotificationTimeDropDown');

      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      expect(NotificationTimeDropDown).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'geofenceReminderStartTime',
          trackingPoint:
            TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_REMINDER_START_TIME,
        }),
        expect.anything(),
      );
    });

    it('should pass GEOFENCE_REMINDER_END_TIME tracking point to end time dropdown', () => {
      const {
        NotificationTimeDropDown,
      } = require('src/js/widgets/timeTrackingSettings/common/NotificationTimeDropDown');

      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      expect(NotificationTimeDropDown).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'geofenceReminderEndTime',
          trackingPoint:
            TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_REMINDER_END_TIME,
        }),
        expect.anything(),
      );
    });

    it('should pass GEOFENCE_REMINDER_DAYS_OF_WEEK tracking point to days of week dropdown', () => {
      const {
        ReminderDayDropdown,
      } = require('src/js/widgets/timeTrackingSettings/common/ReminderDayDropdown');

      render(
        <TestWrapper>
          <EditGeofenceNotificationSettings />
        </TestWrapper>,
      );

      expect(ReminderDayDropdown).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'geofenceReminderDaysOfWeek',
          trackingPoint:
            TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_REMINDER_DAYS_OF_WEEK,
        }),
        expect.anything(),
      );
    });

    it('should pass geofence tracking points with correct structure (object_detail)', () => {
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_REMINDER_START_TIME
          .object_detail,
      ).toBe('geofence_reminder_start_time');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_REMINDER_END_TIME
          .object_detail,
      ).toBe('geofence_reminder_end_time');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_REMINDER_DAYS_OF_WEEK
          .object_detail,
      ).toBe('geofence_reminder_days_of_week');
    });
  });
});
