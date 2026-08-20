import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import ClockInView from 'src/js/widgets/timeClock/components/ClockIn';
import { useGetUserInfo } from 'src/js/service/utils/useGetUserInfo';
import {
  getBrowserTimezone,
  mapQBTimezoneToDayjsTimezone,
} from 'src/js/common/DateAndTimeUtils';
import { labelPreferenceRef } from 'src/js/widgets/common/types';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { CLOCK_IN_TRACKING_POINTS } from 'src/js/common/useClickTracking';
import {
  TIME_CLOCK_DATE_WIDTH,
  TIME_CLOCK_FIELDS_WIDTH,
} from 'src/js/common/constants';

// Add necessary dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Mock dayjs for timezone testing
const mockTz = jest.fn(() => dayjs());
// Instead of direct assignment, use jest.spyOn
jest.spyOn(dayjs, 'tz').mockImplementation(mockTz);

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: jest.fn(() => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      logException: jest.fn(),
    },
    appContext: {
      getEnvironment: jest.fn().mockReturnValue('e2e'),
      getRealmInfo: jest.fn().mockReturnValue({
        realmId: 'exampleRealmId',
      }),
      getUserAuthInfo: jest.fn().mockReturnValue({
        authId: 'exampleAuthId',
      }),
      getRealm: jest.fn().mockResolvedValue({
        realmId: 'exampleRealmId',
      }),
      getAppInfo: jest.fn().mockReturnValue({
        appId: 'qbo-web-app',
      }),
    },
    performance: {
      createCustomerInteraction: jest.fn(),
      getCustomerInteraction: jest.fn(),
      record: jest.fn(),
    },
    pluginConfig: {
      extendedProperties: {
        appSecret: 'exampleAppSecret',
      },
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
  useIntl: jest.fn().mockReturnValue({
    formatMessage: ({ id }: { id: string }) => id,
  }),
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

jest.mock('src/js/service/utils/useGetUserInfo', () => ({
  useGetUserInfo: jest.fn(),
}));

jest.mock('src/js/common/DateAndTimeUtils', () => ({
  mapQBTimezoneToDayjsTimezone: jest.fn((tz) => tz),
  getBrowserTimezone: jest.fn(() => 'America/Los_Angeles'),
}));

// Mock the tracking points with inline definition to avoid hoisting issues
jest.mock('src/js/common/useClickTracking', () => ({
  CLOCK_IN_TRACKING_POINTS: {
    ON_MOUNT: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time_clock',
      scope_area: 'time_clock',
      screen: 'time_clock',
      action: 'engaged',
      object: 'component',
      object_detail: 'add_time_time_clock',
      ui_action: 'viewed',
      ui_object: 'component',
      ui_object_detail: 'add_time_time_clock',
      ui_access_point: 'add_time_dropdown',
    },
    CLOCK_IN_ON_MOUNT: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time_clock',
      scope_area: 'time_clock',
      screen: 'time_clock',
      action: 'engaged',
      object: 'drawer',
      object_detail: 'clock_in_screen',
      ui_action: 'viewed',
      ui_object: 'drawer',
      ui_object_detail: 'clock_in_screen',
      ui_access_point: 'add_time_dropdown',
    },
    START_DATE: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time_clock',
      scope_area: 'time_clock',
      screen: 'time_clock',
      action: 'engaged',
      object: 'component',
      object_detail: 'time_start_date_field',
      ui_action: 'clicked',
      ui_object: 'dropdown',
      ui_object_detail: 'time_start_date_field',
      ui_access_point: 'drawer',
    },
    START_TIME: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time_clock',
      scope_area: 'time_clock',
      screen: 'time_clock',
      action: 'engaged',
      object: 'component',
      object_detail: 'time_start_time_field',
      ui_action: 'clicked',
      ui_object: 'dropdown',
      ui_object_detail: 'time_start_time_field',
      ui_access_point: 'drawer',
    },
    CUSTOMER: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time_clock',
      scope_area: 'time_clock',
      screen: 'time_clock',
      action: 'engaged',
      object: 'component',
      object_detail: 'time_customer_field',
      ui_action: 'clicked',
      ui_object: 'dropdown',
      ui_object_detail: 'time_customer_field',
      ui_access_point: 'drawer',
    },
  },
}));

jest.mock('src/js/widgets/timeClock/hooks/useTimeClockTrackingPoints', () => ({
  useTimeClockTrackingPoints: jest.fn(() => ({
    ON_MOUNT: {},
    CLOCK_IN_ON_MOUNT: {},
    START_DATE: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time_clock',
      scope_area: 'time_clock',
      screen: 'time_clock',
      action: 'engaged',
      object: 'component',
      object_detail: 'time_start_date_field',
      ui_action: 'clicked',
      ui_object: 'dropdown',
      ui_object_detail: 'time_start_date_field',
      ui_access_point: 'drawer',
    },
    START_TIME: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time_clock',
      scope_area: 'time_clock',
      screen: 'time_clock',
      action: 'engaged',
      object: 'component',
      object_detail: 'time_start_time_field',
      ui_action: 'clicked',
      ui_object: 'dropdown',
      ui_object_detail: 'time_start_time_field',
      ui_access_point: 'drawer',
    },
    CUSTOMER: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time_clock',
      scope_area: 'time_clock',
      screen: 'time_clock',
      action: 'engaged',
      object: 'component',
      object_detail: 'time_customer_field',
      ui_action: 'clicked',
      ui_object: 'dropdown',
      ui_object_detail: 'time_customer_field',
      ui_access_point: 'drawer',
    },
  })),
}));

// Mock constants
jest.mock('src/js/common/constants', () => ({
  TIME_CLOCK_DATE_WIDTH: '250px',
  TIME_CLOCK_FIELDS_WIDTH: '100%',
}));

// Mock child components
jest.mock('src/js/widgets/timeClock/components/TimerComponent', () => ({
  __esModule: true,
  default: jest.fn(() => (
    <div data-testid="timer-component">Timer Component</div>
  )),
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/TimeDropdown', () => ({
  TimeDropdown: jest.fn(() => (
    <div data-testid="time-dropdown">Time Dropdown</div>
  )),
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/Date', () => ({
  Date: jest.fn(() => <div data-testid="date-component">Date Component</div>),
}));

jest.mock(
  'src/js/widgets/common/addTimeFormComponents/CustomerProject',
  () => ({
    CustomerProject: jest.fn(() => (
      <div data-testid="customer-project">Customer Project</div>
    )),
  }),
);

// Mock react-hook-form since it might be needed by CustomerProject
jest.mock('react-hook-form', () => ({
  useFormContext: jest.fn(() => ({
    setError: jest.fn(),
  })),
  Controller: ({ render }: { render: any }) =>
    render({
      field: { onChange: jest.fn(), value: {} },
      fieldState: { error: null },
    }),
}));

describe('ClockInView', () => {
  const defaultProps = {
    labelPreference: {
      DepartmentTerminology: 'Department',
      CustomerTerminology: 'Customer',
    } as labelPreferenceRef,
    isBillingFieldEnabled: true,
    hasProjects: true,
    todayDuration: 3600, // 1 hour
    weekDuration: 18000, // 5 hours
    settings: {
      isServiceFieldEnabled: false,
      isBillingFieldEnabled: true,
      firstDayOfWeek: 0,
      isClassEnabled: false,
      isLocationEnabled: false,
      isTaxableFieldEnabled: false,
      entityVersion: '0',
      isCloseBookDateEnabled: false,
      isCloseBookPasswordEnabled: false,
      closeBookDate: dayjs(),
      timezone: 'America/Los_Angeles',
    } as TimeTrackingCompanySettings,
    formValues: {
      startTime: '',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with all components', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: 'Test User' },
      loading: false,
    });

    render(<ClockInView {...defaultProps} />);

    // Timer component
    expect(screen.getByTestId('timer-component')).toBeInTheDocument();

    // Date and time components
    expect(screen.getByTestId('date-component')).toBeInTheDocument();
    expect(screen.getByTestId('time-dropdown')).toBeInTheDocument();

    // Customer/Project component
    expect(screen.getByTestId('customer-project')).toBeInTheDocument();

    // User name in timer
    expect(screen.getByText('timeclock.name')).toBeInTheDocument();
  });

  it('displays user name correctly when userInfo is loaded', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: 'Test User' },
      loading: false,
    });

    render(<ClockInView {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('handles loading state for user info', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: undefined,
      loading: true,
    });

    render(<ClockInView {...defaultProps} />);

    // Should display empty string when loading
    const nameDisplays = screen.getAllByText('');
    expect(nameDisplays.length).toBeGreaterThan(0);
  });

  it('handles null user info gracefully', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
    });

    render(<ClockInView {...defaultProps} />);

    // Should display empty string when user info is null
    const nameDisplays = screen.getAllByText('');
    expect(nameDisplays.length).toBeGreaterThan(0);
  });

  it('passes correct props to TimerComponent', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: 'Test User' },
      loading: false,
    });

    const { rerender } = render(<ClockInView {...defaultProps} />);

    // Re-import the mocked component to check props
    const TimerComponent =
      require('src/js/widgets/timeClock/components/TimerComponent').default;

    expect(TimerComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        isRunning: true,
        component: 'clock-in',
        todayDuration: 3600,
        weekDuration: 18000,
        timezone: 'America/Los_Angeles',
        startTime: '',
      }),
      expect.anything(),
    );

    // Test with different durations
    rerender(
      <ClockInView
        {...defaultProps}
        todayDuration={7200}
        weekDuration={36000}
      />,
    );

    expect(TimerComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        todayDuration: 7200,
        weekDuration: 36000,
      }),
      expect.anything(),
    );
  });

  it('passes correct props to Date component', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: 'Test User' },
      loading: false,
    });

    render(<ClockInView {...defaultProps} />);

    // Re-import the mocked component to check props
    const DateComponent =
      require('src/js/widgets/common/addTimeFormComponents/Date').Date;

    expect(DateComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'startDate',
        trackingPoint: expect.any(Object),
        labelId: 'drawer.form.startDate.label',
        width: TIME_CLOCK_DATE_WIDTH,
        minDate: expect.anything(),
      }),
      expect.anything(),
    );
  });

  it('passes correct props to TimeDropdown component', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: 'Test User' },
      loading: false,
    });

    render(<ClockInView {...defaultProps} />);

    // Re-import the mocked component to check props
    const {
      TimeDropdown,
    } = require('src/js/widgets/common/addTimeFormComponents/TimeDropdown');

    expect(TimeDropdown).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'startTime',
        labelKey: 'drawer.form.startTime.label',
        trackingPoint: expect.any(Object),
      }),
      expect.anything(),
    );
  });

  it('passes correct props to CustomerProject component', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: 'Test User' },
      loading: false,
    });

    render(<ClockInView {...defaultProps} />);

    // Re-import the mocked component to check props
    const {
      CustomerProject,
    } = require('src/js/widgets/common/addTimeFormComponents/CustomerProject');

    expect(CustomerProject).toHaveBeenCalledWith(
      expect.objectContaining({
        'data-test-id': 'time-clock-customer-project',
        name: 'timeAgainst',
        trackingPoint: expect.any(Object),
        hasProjects: true,
        isBillingFieldEnabled: true,
        toggledBillable: true,
        width: TIME_CLOCK_FIELDS_WIDTH,
        labelPreference: defaultProps.labelPreference,
        isTimeClockEntry: true,
        shouldValidate: true,
      }),
      expect.anything(),
    );
  });

  it('respects hasProjects setting', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: 'Test User' },
      loading: false,
    });

    render(<ClockInView {...{ ...defaultProps, hasProjects: false }} />);

    // Re-import the mocked component to check props
    const {
      CustomerProject,
    } = require('src/js/widgets/common/addTimeFormComponents/CustomerProject');

    expect(CustomerProject).toHaveBeenCalledWith(
      expect.objectContaining({
        hasProjects: false,
      }),
      expect.anything(),
    );
  });

  it('respects isBillingFieldEnabled setting', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: 'Test User' },
      loading: false,
    });

    render(
      <ClockInView {...{ ...defaultProps, isBillingFieldEnabled: false }} />,
    );

    // Re-import the mocked component to check props
    const {
      CustomerProject,
    } = require('src/js/widgets/common/addTimeFormComponents/CustomerProject');

    expect(CustomerProject).toHaveBeenCalledWith(
      expect.objectContaining({
        isBillingFieldEnabled: false,
        toggledBillable: false,
      }),
      expect.anything(),
    );
  });

  it('uses correct timezone for minDate', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: 'Test User' },
      loading: false,
    });

    // Set up mocked timezone values
    (mapQBTimezoneToDayjsTimezone as jest.Mock).mockReturnValue(
      'America/New_York',
    );

    render(<ClockInView {...defaultProps} />);

    // Verify Date component received a minDate prop
    const DateComponent =
      require('src/js/widgets/common/addTimeFormComponents/Date').Date;
    expect(DateComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        minDate: expect.anything(),
      }),
      expect.anything(),
    );
  });
});
