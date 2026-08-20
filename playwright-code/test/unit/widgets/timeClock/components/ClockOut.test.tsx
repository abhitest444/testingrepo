import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useFormContext } from 'react-hook-form';
import { useSandbox, useIntl, useTracking } from '@payroll/quicksand';
import { useQuery, useApolloClient } from '@apollo/client';
import ClockOutView from 'src/js/widgets/timeClock/components/ClockOut';
import { useGetUserInfo } from 'src/js/service/utils/useGetUserInfo';
import { mapQBTimezoneToDayjsTimezone } from 'src/js/common/DateAndTimeUtils';
import { labelPreferenceRef } from 'src/js/widgets/common/types';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { CLOCK_IN_TRACKING_POINTS } from 'src/js/common/useClickTracking';
import {
  TIME_CLOCK_DATE_WIDTH,
  TIME_CLOCK_OUT_FIELDS_WIDTH,
} from 'src/js/common/constants';
import TimerComponent from 'src/js/widgets/timeClock/components/TimerComponent';
import { TimeDropdown } from 'src/js/widgets/common/addTimeFormComponents/TimeDropdown';
import { Date } from 'src/js/widgets/common/addTimeFormComponents/Date';
import { CustomerProject } from 'src/js/widgets/common/addTimeFormComponents/CustomerProject';
import { Notes } from 'src/js/widgets/common/addTimeFormComponents/Notes';
import { FormCurrency } from 'src/js/widgets/common/addTimeFormComponents/FormCurrency';
import { FormCheckbox } from 'src/js/widgets/common/addTimeFormComponents/FormCheckbox';
import { Class } from 'src/js/widgets/common/addTimeFormComponents/Class';
import { Service } from 'src/js/widgets/common/addTimeFormComponents/Service';
import { Location } from 'src/js/widgets/common/addTimeFormComponents/Location';

// Add necessary dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Mock useGetUserInfo hook
jest.mock('src/js/service/utils/useGetUserInfo', () => ({
  useGetUserInfo: jest.fn(),
}));

jest.mock('src/js/widgets/timeClock/hooks/useTimeClockTrackingPoints', () => ({
  useTimeClockTrackingPoints: jest.fn(() => ({
    ON_MOUNT: {},
    CLOCK_OUT_ON_MOUNT: {},
    START_DATE: {},
    START_TIME: {},
    END_DATE: {},
    END_TIME: {},
    CUSTOMER: {},
    SERVICE: {},
    BILLABLE: {},
    BILL_RATE: {},
    BILL_RATE_CHECKBOX: {},
    CLASS: {},
    LOCATION: {},
    NOTES: {},
    SAVE: {},
    CLOCK_OUT: {},
    SWITCH_JOB: {},
    SWITCH_JOB_DROPDOWN: {},
    CUSTOM_FIELD_LIST: {},
    CUSTOM_FIELD_TEXT: {},
    CUSTOM_FIELD_DROPDOWN: {},
    TAKE_BREAK: {},
    BREAK_BUTTON_CLICK: {},
    END_BREAK: {},
    TIME_CLOCK_EXIT: {},
    WANT_TO_SAVE: {},
    DONT_SAVE: {},
  })),
}));

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
      getAppInfo: jest.fn().mockReturnValue({
        appId: 'qbo-web-app',
      }),
    },
    featureFlags: {
      isFeatureEnabled: jest.fn().mockReturnValue(false),
    },
  })),
  useIntl: jest.fn().mockReturnValue({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock('src/js/common/DateAndTimeUtils', () => ({
  mapQBTimezoneToDayjsTimezone: jest.fn((tz) => tz),
  getBrowserTimezone: jest.fn(() => 'America/Los_Angeles'),
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
    CustomerProject: jest.fn(({ onDepartmentChange }) => (
      <div
        data-testid="customer-project"
        onClick={() =>
          onDepartmentChange &&
          onDepartmentChange({ id: 'dept-1', name: 'Test Department' })
        }
      >
        Customer Project
      </div>
    )),
  }),
);

jest.mock('src/js/widgets/common/addTimeFormComponents/Notes', () => ({
  Notes: jest.fn(() => (
    <div data-testid="notes-component">Notes Component</div>
  )),
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/FormCurrency', () => ({
  FormCurrency: jest.fn(({ onChange }) => (
    <div
      data-testid="form-currency"
      onClick={() => onChange && onChange({ target: { value: '100.00' } })}
    >
      Form Currency
    </div>
  )),
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/FormCheckbox', () => ({
  FormCheckbox: jest.fn(({ onChange, name }) => (
    <div
      data-testid="form-checkbox"
      onClick={() => onChange && onChange({ target: { checked: true } })}
      data-name={name}
    >
      Form Checkbox
    </div>
  )),
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/Class', () => ({
  Class: jest.fn(() => (
    <div data-testid="class-component">Class Component</div>
  )),
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/Service', () => ({
  Service: jest.fn(() => (
    <div data-testid="service-component">Service Component</div>
  )),
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/Location', () => ({
  Location: jest.fn(() => (
    <div data-testid="location-component">Location Component</div>
  )),
}));

jest.mock('src/js/widgets/common/dimensions/DimensionsField', () => ({
  __esModule: true,
  default: jest.fn(() => (
    <div data-testid="dimensions-field">Dimensions Field</div>
  )),
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useFormContext: jest.fn(() => ({
    watch: jest.fn().mockImplementation((field?: string) => {
      const formValues = {
        billable: true,
        timeAgainst: {
          customer: { id: 'customer-1', name: 'Test Customer' },
          project: { id: 'project-1', name: 'Test Project' },
        },
        customFields: [],
      };
      return field ? formValues[field as keyof typeof formValues] : formValues;
    }),
    getValues: jest.fn(() => ({
      billable: true,
      timeAgainst: {
        customer: { id: 'customer-1', name: 'Test Customer' },
        project: { id: 'project-1', name: 'Test Project' },
      },
      customFields: [],
    })),
    control: {},
  })),
  useWatch: jest.fn().mockImplementation(({ name }: { name: string }) => {
    if (name === 'customFields') {
      return [];
    }
    if (name === 'billable') {
      return true; // Bill rate field shows when billable is checked
    }
    return undefined;
  }),
  Controller: ({ render }: { render: any }) =>
    render({
      field: { onChange: jest.fn(), value: {} },
      fieldState: { error: null },
    }),
}));

// Mock Apollo Client
jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useQuery: jest.fn(() => ({ data: {}, loading: false, error: undefined })),
  useApolloClient: jest.fn(() => ({})),
}));

// Mock custom fields hook
jest.mock('src/js/service/hooks/timeEntries/useGetCustomFields', () => ({
  useGetCustomFields: jest.fn(() => ({
    customFields: [],
    loading: false,
    error: undefined,
    query: jest.fn(),
  })),
}));

// Mock custom fields utils
jest.mock('src/js/widgets/common/customFields/utils', () => ({
  mapCustomFieldsToComponentInterface: jest.fn(() => []),
}));

// Mock the main customFields module to ensure the utils are properly mocked
jest.mock('src/js/widgets/common/customFields', () => ({
  CustomFields: jest.fn(() => (
    <div data-testid="custom-fields-widget">Custom Fields</div>
  )),
  mapCustomFieldsToComponentInterface: jest.fn(() => [
    {
      id: '1',
      name: 'Field1',
      type: 'string',
      required: false,
      value: 'test value',
    },
  ]),
}));

// Add this after other jest.mock calls
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn().mockReturnValue({
    isEnabled: false,
    isLoading: false,
    error: null,
  }),
}));

// Mock the Time Clock field assignments hook
jest.mock(
  'src/js/widgets/timeClock/hooks/useTimeClockFieldAssignments',
  () => ({
    useTimeClockFieldAssignments: jest.fn(() => ({
      visibleCustomFields: [],
      standardFieldsVisibility: {
        service: false,
        class: false,
        location: false,
        billable: false,
      },
      standardFieldOptionAssignments: {
        service: undefined,
        class: undefined,
        location: undefined,
      },
      loading: false,
      workerId: undefined,
      customerId: undefined,
      projectId: undefined,
      customFieldOptionAssignments: {},
    })),
  }),
);

const useIXPFeatureFlagMock = require('src/js/common/useIXPFeatureFlag')
  .useIXPFeatureFlag as jest.Mock;
const useQueryMock = require('@apollo/client').useQuery as jest.Mock;
const useTimeClockFieldAssignmentsMock =
  require('src/js/widgets/timeClock/hooks/useTimeClockFieldAssignments')
    .useTimeClockFieldAssignments as jest.Mock;

describe('ClockOutView', () => {
  const defaultProps = {
    onSwitchJobs: jest.fn(),
    onNewJobSelected: jest.fn(),
    labelPreference: {
      DepartmentTerminology: 'Department',
      CustomerTerminology: 'Customer',
    } as labelPreferenceRef,
    settings: {
      isServiceFieldEnabled: false,
      isBillingFieldEnabled: true,
      firstDayOfWeek: 0,
      isClassEnabled: false,
      isLocationEnabled: false,
      isTsheetClassEnabled: false,
      isTsheetLocationEnabled: false,
      isTaxableFieldEnabled: false,
      entityVersion: '0',
      isCloseBookDateEnabled: false,
      isCloseBookPasswordEnabled: false,
      closeBookDate: dayjs(),
      timezone: 'America/Los_Angeles',
    } as TimeTrackingCompanySettings,
    hasProjects: true,
    serviceItemPriceRef: { current: 0 },
    serviceDescriptionRef: { current: '' },
    serviceTaxableRef: { current: false },
    startTime: '2023-01-01T09:00:00Z',
    todayDuration: 3600,
    weekDuration: 18000,
    showErrorToast: false,
    errorToastMessage: '',
    onCloseErrorToast: jest.fn(),
    setIsSwitchJobClicked: jest.fn(),
    isSwitchJobClicked: false,
    shouldOpenDropdown: false,
    updateLabel: jest.fn(),
    isBillingFieldEnabled: true,
    isDrawerOpen: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: 'Test User' },
      loading: false,
    });

    // Reset the assignment hook mock to default values
    useTimeClockFieldAssignmentsMock.mockReturnValue({
      visibleCustomFields: [],
      standardFieldsVisibility: {
        service: false,
        class: false,
        location: false,
        billable: false,
      },
      standardFieldOptionAssignments: {
        service: undefined,
        class: undefined,
        location: undefined,
      },
      loading: false,
      workerId: undefined,
      customerId: undefined,
      projectId: undefined,
      customFieldOptionAssignments: {},
    });
  });

  it('renders correctly with all components', () => {
    render(<ClockOutView {...defaultProps} />);

    expect(screen.getByTestId('timer-component')).toBeInTheDocument();
    expect(screen.getByTestId('date-component')).toBeInTheDocument();
    expect(screen.getByTestId('time-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('customer-project')).toBeInTheDocument();
    expect(screen.getByTestId('notes-component')).toBeInTheDocument();
    expect(screen.getByTestId('dimensions-field')).toBeInTheDocument();
    const DimensionsFieldMock =
      require('src/js/widgets/common/dimensions/DimensionsField').default;
    expect(DimensionsFieldMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isTimeEntry: true,
        isOTX: true,
        prefillWorkerDefaultsWhenEmpty: true,
      }),
      expect.anything(),
    );
  });

  it('uses default isDrawerOpen when not passed', () => {
    const { isDrawerOpen: _isDrawerOpen, ...propsWithoutDrawer } = defaultProps;
    render(<ClockOutView {...propsWithoutDrawer} />);
    expect(screen.getByTestId('clock-out-drawer-content')).toBeInTheDocument();
  });

  it('displays user name and start time correctly', () => {
    render(<ClockOutView {...defaultProps} />);

    const TimerComponent =
      require('src/js/widgets/timeClock/components/TimerComponent').default;
    expect(TimerComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        timerHeading: expect.stringContaining('Test User'),
        startTime: '2023-01-01T09:00:00Z',
      }),
      expect.anything(),
    );
  });

  it('displays empty user name when userInfo has no userName', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: { userName: undefined },
      loading: false,
    });

    render(<ClockOutView {...defaultProps} />);

    const TimerComponent =
      require('src/js/widgets/timeClock/components/TimerComponent').default;
    expect(TimerComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        timerHeading: expect.stringContaining('timeclock.clocked.in.at'),
      }),
      expect.anything(),
    );
  });

  it('displays when userInfo data is undefined', () => {
    (useGetUserInfo as jest.Mock).mockReturnValue({
      data: undefined,
      loading: false,
    });

    render(<ClockOutView {...defaultProps} />);

    const TimerComponent =
      require('src/js/widgets/timeClock/components/TimerComponent').default;
    expect(TimerComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        timerHeading: expect.stringContaining('timeclock.clocked.in.at'),
      }),
      expect.anything(),
    );
  });

  it('handles switch jobs button click', () => {
    render(<ClockOutView {...defaultProps} />);

    const switchJobsButton = screen.getByTestId('switch-jobs-button');
    fireEvent.click(switchJobsButton);

    expect(defaultProps.onSwitchJobs).toHaveBeenCalled();
  });

  it('shows error toast when showErrorToast is true', () => {
    const errorMessage = 'Test error message';
    render(
      <ClockOutView
        {...defaultProps}
        showErrorToast
        errorToastMessage={errorMessage}
      />,
    );

    expect(screen.getByTestId('error-toast')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows default error message when errorToastMessage is empty', () => {
    render(
      <ClockOutView {...defaultProps} showErrorToast errorToastMessage="" />,
    );

    expect(screen.getByTestId('error-toast')).toBeInTheDocument();
  });

  it('shows bill rate when billingRateForTimeEnabled is undefined', () => {
    // Time Clock drives the billing section off assignment visibility, not company settings.
    useTimeClockFieldAssignmentsMock.mockReturnValue({
      visibleCustomFields: [],
      standardFieldsVisibility: {
        service: false,
        class: false,
        location: false,
        billable: true,
      },
      standardFieldOptionAssignments: {
        service: undefined,
        class: undefined,
        location: undefined,
      },
      loading: false,
      workerId: undefined,
      customerId: undefined,
      projectId: undefined,
      customFieldOptionAssignments: {},
    });

    render(
      <ClockOutView
        {...defaultProps}
        settings={{
          ...defaultProps.settings,
          isBillingFieldEnabled: true,
          billingRateForTimeEnabled: undefined,
        }}
      />,
    );

    expect(screen.getByTestId('form-currency')).toBeInTheDocument();
  });

  it('shows service field when enabled', () => {
    // Mock the assignment hook to return service as visible
    useTimeClockFieldAssignmentsMock.mockReturnValue({
      visibleCustomFields: [],
      standardFieldsVisibility: {
        service: true,
        class: false,
        location: false,
        billable: false,
      },
      standardFieldOptionAssignments: {
        service: undefined,
        class: undefined,
        location: undefined,
      },
      loading: false,
      workerId: undefined,
      customerId: undefined,
      projectId: undefined,
      customFieldOptionAssignments: {},
    });

    render(
      <ClockOutView
        {...defaultProps}
        settings={{
          ...defaultProps.settings,
          isServiceFieldEnabled: true,
        }}
      />,
    );

    expect(screen.getByTestId('service-component')).toBeInTheDocument();
  });

  it('uses assignment visibility over company settings', () => {
    useTimeClockFieldAssignmentsMock.mockReturnValue({
      visibleCustomFields: [],
      standardFieldsVisibility: {
        service: true,
        class: true,
        location: true,
        billable: true,
      },
      standardFieldOptionAssignments: {
        service: undefined,
        class: undefined,
        location: undefined,
      },
      loading: false,
      workerId: undefined,
      customerId: undefined,
      projectId: undefined,
      customFieldOptionAssignments: {},
    });

    render(
      <ClockOutView
        {...defaultProps}
        settings={{
          ...defaultProps.settings,
          isServiceFieldEnabled: false,
          isTsheetClassEnabled: false,
          isTsheetLocationEnabled: false,
          isBillingFieldEnabled: false,
        }}
      />,
    );

    expect(screen.getByTestId('service-component')).toBeInTheDocument();
    expect(screen.getByTestId('class-component')).toBeInTheDocument();
    expect(screen.getByTestId('location-component')).toBeInTheDocument();
  });

  it('shows billing field when enabled', () => {
    // Time Clock drives the billing section off assignment visibility, not company settings.
    useTimeClockFieldAssignmentsMock.mockReturnValue({
      visibleCustomFields: [],
      standardFieldsVisibility: {
        service: false,
        class: false,
        location: false,
        billable: true,
      },
      standardFieldOptionAssignments: {
        service: undefined,
        class: undefined,
        location: undefined,
      },
      loading: false,
      workerId: undefined,
      customerId: undefined,
      projectId: undefined,
      customFieldOptionAssignments: {},
    });

    render(
      <ClockOutView
        {...defaultProps}
        settings={{
          ...defaultProps.settings,
          isBillingFieldEnabled: true,
          billingRateForTimeEnabled: true,
        }}
      />,
    );

    expect(screen.getByTestId('form-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('form-currency')).toBeInTheDocument();
  });

  it('shows class field when enabled', () => {
    // Mock the assignment hook to return class as visible
    useTimeClockFieldAssignmentsMock.mockReturnValue({
      visibleCustomFields: [],
      standardFieldsVisibility: {
        service: false,
        class: true,
        location: false,
        billable: false,
      },
      standardFieldOptionAssignments: {
        service: undefined,
        class: undefined,
        location: undefined,
      },
      loading: false,
      workerId: undefined,
      customerId: undefined,
      projectId: undefined,
      customFieldOptionAssignments: {},
    });

    render(
      <ClockOutView
        {...defaultProps}
        settings={{
          ...defaultProps.settings,
          isTsheetClassEnabled: true,
        }}
      />,
    );

    expect(screen.getByTestId('class-component')).toBeInTheDocument();
  });

  it('shows location field when enabled', () => {
    // Mock the assignment hook to return location as visible
    useTimeClockFieldAssignmentsMock.mockReturnValue({
      visibleCustomFields: [],
      standardFieldsVisibility: {
        service: false,
        class: false,
        location: true,
        billable: false,
      },
      standardFieldOptionAssignments: {
        service: undefined,
        class: undefined,
        location: undefined,
      },
      loading: false,
      workerId: undefined,
      customerId: undefined,
      projectId: undefined,
      customFieldOptionAssignments: {},
    });

    render(
      <ClockOutView
        {...defaultProps}
        settings={{
          ...defaultProps.settings,
          isTsheetLocationEnabled: true,
        }}
      />,
    );

    expect(screen.getByTestId('location-component')).toBeInTheDocument();
  });

  it('handles customer project dropdown opened', () => {
    render(<ClockOutView {...defaultProps} />);

    const {
      CustomerProject,
    } = require('src/js/widgets/common/addTimeFormComponents/CustomerProject');
    const { onDropdownOpened } = CustomerProject.mock.calls[0][0];

    onDropdownOpened();

    expect(CustomerProject).toHaveBeenCalledWith(
      expect.objectContaining({
        shouldOpenDropdown: false,
      }),
      expect.anything(),
    );
  });

  it('handles tracking on mount', () => {
    const track = jest.fn();
    (useTracking as jest.Mock).mockReturnValue(track);

    render(<ClockOutView {...defaultProps} />);

    expect(track).toHaveBeenCalledWith(expect.any(Object));
  });

  it('handles tracking on switch jobs click', () => {
    const track = jest.fn();
    (useTracking as jest.Mock).mockReturnValue(track);

    render(<ClockOutView {...defaultProps} />);

    const switchJobsButton = screen.getByTestId('switch-jobs-button');
    fireEvent.click(switchJobsButton);

    expect(track).toHaveBeenCalledWith(expect.any(Object));
  });

  describe('onNewJobSelected when customer or project changes', () => {
    const defaultFormContextMock = {
      watch: jest.fn().mockImplementation((field?: string) => {
        const formValues = {
          billable: true,
          timeAgainst: {
            customer: { id: 'customer-1', name: 'Test Customer' },
            project: { id: 'project-1', name: 'Test Project' },
          },
          customFields: [],
        };
        return field
          ? formValues[field as keyof typeof formValues]
          : formValues;
      }),
      getValues: jest.fn(() => ({
        billable: true,
        timeAgainst: {
          customer: { id: 'customer-1', name: 'Test Customer' },
          project: { id: 'project-1', name: 'Test Project' },
        },
        customFields: [],
      })),
      control: {},
    };

    afterEach(() => {
      (useFormContext as jest.Mock).mockReturnValue(defaultFormContextMock);
    });

    it('calls onNewJobSelected when isSwitchJobClicked and customer/project change with both having names', () => {
      const onNewJobSelected = jest.fn();
      const initialTimeAgainst = {
        customer: { id: 'customer-1', name: 'Initial Customer' },
        project: { id: 'project-1', name: 'Initial Project' },
      };
      const newTimeAgainst = {
        customer: { id: 'customer-2', name: 'New Customer' },
        project: { id: 'project-2', name: 'New Project' },
      };

      let renderCount = 0;
      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const timeAgainst =
            renderCount === 0 ? initialTimeAgainst : newTimeAgainst;
          const formValues = {
            billable: true,
            timeAgainst,
            customFields: [],
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => {
          const timeAgainst =
            renderCount === 0 ? initialTimeAgainst : newTimeAgainst;
          return {
            billable: true,
            timeAgainst,
            customFields: [],
          };
        }),
        control: {},
      });

      const { rerender } = render(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked={false}
        />,
      );

      expect(onNewJobSelected).not.toHaveBeenCalled();

      renderCount = 1;
      rerender(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked
        />,
      );

      expect(onNewJobSelected).toHaveBeenCalledWith(newTimeAgainst);
    });

    it('calls onNewJobSelected when only customer changes', () => {
      const onNewJobSelected = jest.fn();
      const initialTimeAgainst = {
        customer: { id: 'customer-1', name: 'Old Customer' },
        project: { id: 'project-1', name: 'Same Project' },
      };
      const newTimeAgainst = {
        customer: { id: 'customer-2', name: 'New Customer' },
        project: { id: 'project-1', name: 'Same Project' },
      };

      let renderCount = 0;
      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const timeAgainst =
            renderCount === 0 ? initialTimeAgainst : newTimeAgainst;
          const formValues = {
            billable: true,
            timeAgainst,
            customFields: [],
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: true,
          timeAgainst: renderCount === 0 ? initialTimeAgainst : newTimeAgainst,
          customFields: [],
        })),
        control: {},
      });

      const { rerender } = render(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked={false}
        />,
      );

      renderCount = 1;
      rerender(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked
        />,
      );

      expect(onNewJobSelected).toHaveBeenCalledWith(newTimeAgainst);
    });

    it('calls onNewJobSelected when only project changes', () => {
      const onNewJobSelected = jest.fn();
      const initialTimeAgainst = {
        customer: { id: 'customer-1', name: 'Same Customer' },
        project: { id: 'project-1', name: 'Old Project' },
      };
      const newTimeAgainst = {
        customer: { id: 'customer-1', name: 'Same Customer' },
        project: { id: 'project-2', name: 'New Project' },
      };

      let renderCount = 0;
      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const timeAgainst =
            renderCount === 0 ? initialTimeAgainst : newTimeAgainst;
          const formValues = {
            billable: true,
            timeAgainst,
            customFields: [],
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: true,
          timeAgainst: renderCount === 0 ? initialTimeAgainst : newTimeAgainst,
          customFields: [],
        })),
        control: {},
      });

      const { rerender } = render(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked={false}
        />,
      );

      renderCount = 1;
      rerender(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked
        />,
      );

      expect(onNewJobSelected).toHaveBeenCalledWith(newTimeAgainst);
    });

    it('does not call onNewJobSelected when customer/project names are undefined', () => {
      const onNewJobSelected = jest.fn();
      const initialTimeAgainst = {
        customer: { id: 'customer-1' },
        project: { id: 'project-1' },
      };
      const newTimeAgainst = {
        customer: { id: 'customer-2' },
        project: { id: 'project-2' },
      };

      let renderCount = 0;
      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const timeAgainst =
            renderCount === 0 ? initialTimeAgainst : newTimeAgainst;
          const formValues = {
            billable: true,
            timeAgainst,
            customFields: [],
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => {
          const timeAgainst =
            renderCount === 0 ? initialTimeAgainst : newTimeAgainst;
          return {
            billable: true,
            timeAgainst,
            customFields: [],
          };
        }),
        control: {},
      });

      const { rerender } = render(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked={false}
        />,
      );

      renderCount = 1;
      rerender(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked
        />,
      );

      expect(onNewJobSelected).not.toHaveBeenCalled();
    });

    it('does not call onNewJobSelected when customer name is undefined', () => {
      const onNewJobSelected = jest.fn();
      const initialTimeAgainst = {
        customer: { id: 'c1', name: 'Customer 1' },
        project: { id: 'p1', name: 'Project 1' },
      };
      const newTimeAgainst = {
        customer: { id: 'c2' },
        project: { id: 'p1', name: 'Project 1' },
      };

      let renderCount = 0;
      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const timeAgainst =
            renderCount === 0 ? initialTimeAgainst : newTimeAgainst;
          const formValues = { billable: true, timeAgainst, customFields: [] };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: true,
          timeAgainst: renderCount === 0 ? initialTimeAgainst : newTimeAgainst,
          customFields: [],
        })),
        control: {},
      });

      const { rerender } = render(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked={false}
        />,
      );
      renderCount = 1;
      rerender(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked
        />,
      );

      expect(onNewJobSelected).not.toHaveBeenCalled();
    });

    it('does not call onNewJobSelected when neither customer nor project changed', () => {
      const onNewJobSelected = jest.fn();
      const sameTimeAgainst = {
        customer: { id: 'c1', name: 'Customer' },
        project: { id: 'p1', name: 'Project' },
      };

      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const formValues = {
            billable: true,
            timeAgainst: sameTimeAgainst,
            customFields: [],
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: true,
          timeAgainst: sameTimeAgainst,
          customFields: [],
        })),
        control: {},
      });

      const { rerender } = render(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked={false}
        />,
      );

      rerender(
        <ClockOutView
          {...defaultProps}
          onNewJobSelected={onNewJobSelected}
          isSwitchJobClicked
        />,
      );

      expect(onNewJobSelected).not.toHaveBeenCalled();
    });
  });

  describe('usePrevious Hook', () => {
    it('maintains previous value when component re-renders', () => {
      const { rerender } = render(
        <ClockOutView {...defaultProps} startTime="2023-01-01T09:00:00Z" />,
      );

      // Initial render should have no previous value
      expect(useFormContext().watch('timeAgainst')).toEqual({
        customer: { id: 'customer-1', name: 'Test Customer' },
        project: { id: 'project-1', name: 'Test Project' },
      });

      // Update form values
      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const formValues = {
            billable: true,
            timeAgainst: {
              customer: { id: 'customer-2', name: 'New Customer' },
              project: { id: 'project-2', name: 'New Project' },
            },
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: true,
          timeAgainst: {
            customer: { id: 'customer-2', name: 'New Customer' },
            project: { id: 'project-2', name: 'New Project' },
          },
          customFields: [],
        })),
        setValue: jest.fn(),
        formState: {},
        control: {},
      });

      // Re-render with new values
      rerender(
        <ClockOutView {...defaultProps} startTime="2023-01-01T10:00:00Z" />,
      );

      // Previous value should be maintained
      expect(useFormContext().watch('timeAgainst')).toEqual({
        customer: { id: 'customer-2', name: 'New Customer' },
        project: { id: 'project-2', name: 'New Project' },
      });
    });
  });

  describe('Customer Project Dropdown', () => {
    it('handles dropdown opened state correctly', () => {
      render(<ClockOutView {...defaultProps} />);

      const {
        CustomerProject,
      } = require('src/js/widgets/common/addTimeFormComponents/CustomerProject');
      const { onDropdownOpened } = CustomerProject.mock.calls[0][0];

      onDropdownOpened();

      expect(CustomerProject).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldOpenDropdown: false,
        }),
        expect.anything(),
      );
    });

    it('opens dropdown when shouldOpenDropdown prop is true', () => {
      const { rerender } = render(
        <ClockOutView {...defaultProps} shouldOpenDropdown={false} />,
      );

      rerender(<ClockOutView {...defaultProps} shouldOpenDropdown />);

      const {
        CustomerProject,
      } = require('src/js/widgets/common/addTimeFormComponents/CustomerProject');
      expect(CustomerProject).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldOpenDropdown: true,
        }),
        expect.anything(),
      );
    });
  });

  describe('Service Changes', () => {
    it('updates billable and bill rate when service changes', () => {
      const serviceItemPriceRef = { current: 100 };
      const { rerender } = render(
        <ClockOutView
          {...defaultProps}
          serviceItemPriceRef={serviceItemPriceRef}
        />,
      );

      // Simulate service change
      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const formValues = {
            billable: false,
            billRate: 0,
            service: { id: 'service-1', name: 'Test Service' },
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: false,
          billRate: 0,
          service: { id: 'service-1', name: 'Test Service' },
          customFields: [],
        })),
        setValue: jest.fn(),
        formState: {
          dirtyFields: {
            service: true,
          },
        },
        control: {},
      });

      rerender(
        <ClockOutView
          {...defaultProps}
          serviceItemPriceRef={serviceItemPriceRef}
        />,
      );

      const { setValue } = useFormContext();
    });

    it('updates billable and bill rate when service is not changed', () => {
      // Mock the form context with employee data
      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const formValues = {
            billable: false,
            billRate: 0,
            service: { id: 'service-1', name: 'Test Service' },
            employee: {
              employmentDetail: {
                jobCosting: {
                  billRate: 50,
                  billable: true,
                },
              },
            },
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: false,
          billRate: 0,
          service: { id: 'service-1', name: 'Test Service' },
          employee: {
            employmentDetail: {
              jobCosting: {
                billRate: 50,
                billable: true,
              },
            },
          },
          customFields: [],
        })),
        setValue: jest.fn(),
        formState: {
          dirtyFields: {},
        },
        control: {},
      });

      render(<ClockOutView {...defaultProps} />);

      const { setValue } = useFormContext();
    });
  });

  describe('Tracking and Logging', () => {
    it('tracks clock out event on mount', () => {
      const track = jest.fn();
      (useTracking as jest.Mock).mockReturnValue(track);

      render(<ClockOutView {...defaultProps} />);

      expect(track).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Timer Static Display', () => {
    it('displays timer component with static startTime prop', () => {
      render(
        <ClockOutView {...defaultProps} startTime="2023-01-01T16:20:00Z" />,
      );

      const TimerComponent =
        require('src/js/widgets/timeClock/components/TimerComponent').default;
      const timerCall = TimerComponent.mock.calls[0][0];

      // Should use the prop startTime (no real-time updates)
      expect(timerCall.startTime).toBe('2023-01-01T16:20:00Z');
      expect(timerCall.timerHeading).toContain('Test User');
      expect(timerCall.timerHeading).toContain('timeclock.clocked.in.at');
    });

    it('formats timer heading correctly with browser timezone conversion', () => {
      // Use a specific time that we can verify conversion for
      render(
        <ClockOutView {...defaultProps} startTime="2023-01-01T21:45:00Z" />,
      );

      const TimerComponent =
        require('src/js/widgets/timeClock/components/TimerComponent').default;
      const timerCall = TimerComponent.mock.calls[0][0];

      // Verify the timer heading contains the formatted time (converted to browser timezone)
      expect(timerCall.timerHeading).toContain('Test User');
      expect(timerCall.timerHeading).toContain('timeclock.clocked.in.at');
      // The exact formatted time depends on timezone conversion, but it should be formatted
      expect(timerCall.timerHeading).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });

    it('shows empty time display when startTime is not provided', () => {
      render(<ClockOutView {...defaultProps} startTime="" />);

      const TimerComponent =
        require('src/js/widgets/timeClock/components/TimerComponent').default;
      const timerCall = TimerComponent.mock.calls[0][0];

      // Should have empty time when no startTime provided
      expect(timerCall.startTime).toBe('');
      expect(timerCall.timerHeading).toContain('Test User');
      expect(timerCall.timerHeading).toContain('timeclock.clocked.in.at');
      expect(timerCall.timerHeading).toContain(''); // Empty time part
    });
  });

  describe('Custom Fields Widget', () => {
    const mockCustomFieldsData = {
      timeTrackingCustomFields: {
        edges: [
          {
            node: {
              name: 'Field1',
              id: '1',
              deleted: false,
              type: 'string',
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'start',
          endCursor: 'end',
        },
      },
    };

    it('fetches custom fields when drawer opens and feature flag is enabled', () => {
      const mockQuery = jest.fn();
      useIXPFeatureFlagMock.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
      });

      const {
        useGetCustomFields,
      } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
      (useGetCustomFields as jest.Mock).mockReturnValue({
        customFields: [],
        loading: false,
        error: undefined,
        query: mockQuery,
      });

      // Initial render with drawer closed
      const { rerender } = render(
        <ClockOutView {...defaultProps} isDrawerOpen={false} />,
      );

      // Verify query is not called initially
      expect(mockQuery).not.toHaveBeenCalled();

      // Rerender with drawer open
      rerender(<ClockOutView {...defaultProps} isDrawerOpen />);

      // Verify query is called when drawer opens
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith({
        variables: {
          filter: { deleted: false },
        },
      });
    });

    it('does not fetch custom fields when drawer opens but feature flag is disabled', () => {
      const mockQuery = jest.fn();
      useIXPFeatureFlagMock.mockReturnValue({
        isEnabled: false,
        isLoading: false,
        error: null,
      });

      const {
        useGetCustomFields,
      } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
      (useGetCustomFields as jest.Mock).mockReturnValue({
        customFields: [],
        loading: false,
        error: undefined,
        query: mockQuery,
      });

      // Initial render with drawer closed
      const { rerender } = render(
        <ClockOutView {...defaultProps} isDrawerOpen={false} />,
      );

      // Rerender with drawer open
      rerender(<ClockOutView {...defaultProps} isDrawerOpen />);

      // Verify query is not called when feature flag is disabled
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('does not fetch custom fields when drawer is closed', () => {
      const mockQuery = jest.fn();
      useIXPFeatureFlagMock.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
      });

      const {
        useGetCustomFields,
      } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
      (useGetCustomFields as jest.Mock).mockReturnValue({
        customFields: [],
        loading: false,
        error: undefined,
        query: mockQuery,
      });

      // Render with drawer closed
      render(<ClockOutView {...defaultProps} isDrawerOpen={false} />);

      // Verify query is not called when drawer is closed
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('renders custom fields widget when feature flag is enabled and data is present', () => {
      useIXPFeatureFlagMock.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
      });
      useQueryMock.mockReturnValue({
        data: mockCustomFieldsData,
        loading: false,
        error: undefined,
      });

      // Mock useGetCustomFields to return non-empty custom fields
      const {
        useGetCustomFields,
      } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
      (useGetCustomFields as jest.Mock).mockReturnValue({
        customFields: [
          {
            id: '1',
            name: 'Field1',
            type: 'string',
            required: false,
            value: 'test value',
          },
        ],
        loading: false,
        error: undefined,
        query: jest.fn(),
      });

      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const formValues = {
            billable: true,
            timeAgainst: {
              customer: { id: 'customer-1', name: 'Test Customer' },
              project: { id: 'project-1', name: 'Test Project' },
            },
            customFields: [
              {
                id: '1',
                name: 'Field1',
                type: 'string',
                required: false,
                value: 'test value',
              },
            ],
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: true,
          timeAgainst: {
            customer: { id: 'customer-1', name: 'Test Customer' },
            project: { id: 'project-1', name: 'Test Project' },
          },
          customFields: [
            {
              id: '1',
              name: 'Field1',
              type: 'string',
              required: false,
              value: 'test value',
            },
          ],
        })),
        setValue: jest.fn(),
        formState: {},
        control: {},
      });
      render(<ClockOutView {...defaultProps} />);
      expect(screen.getByTestId('custom-fields-widget')).toBeInTheDocument();
    });

    it('does not render custom fields widget when feature flag is disabled', () => {
      useIXPFeatureFlagMock.mockReturnValue({
        isEnabled: false,
        isLoading: false,
        error: null,
      });
      useQueryMock.mockReturnValue({
        data: mockCustomFieldsData,
        loading: false,
        error: undefined,
      });
      render(<ClockOutView {...defaultProps} />);
      expect(screen.queryByTestId('custom-fields')).not.toBeInTheDocument();
    });

    it('does not render custom fields widget when there are no custom fields', () => {
      useIXPFeatureFlagMock.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
      });
      useQueryMock.mockReturnValue({
        data: {
          timeTrackingCustomFields: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
          },
        },
        loading: false,
        error: undefined,
      });
      render(<ClockOutView {...defaultProps} />);
      expect(screen.queryByTestId('custom-fields')).not.toBeInTheDocument();
    });

    it('handles undefined customFields from useWatch', () => {
      const { useWatch } = require('react-hook-form');
      (useWatch as jest.Mock).mockImplementation(
        ({ name }: { name: string }) => {
          if (name === 'customFields') return undefined;
          if (name === 'billable') return true;
          return undefined;
        },
      );

      render(<ClockOutView {...defaultProps} />);

      expect(
        screen.getByTestId('clock-out-drawer-content'),
      ).toBeInTheDocument();

      (useWatch as jest.Mock).mockImplementation(
        ({ name }: { name: string }) => {
          if (name === 'customFields') return [];
          if (name === 'billable') return true;
          return undefined;
        },
      );
    });
  });

  describe('form values with optional fields', () => {
    afterEach(() => {
      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const formValues = {
            billable: true,
            timeAgainst: {
              customer: { id: 'customer-1', name: 'Test Customer' },
              project: { id: 'project-1', name: 'Test Project' },
            },
            timeFor: { id: '1', name: 'Test' },
            customFields: [],
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: true,
          timeAgainst: {
            customer: { id: 'customer-1', name: 'Test Customer' },
            project: { id: 'project-1', name: 'Test Project' },
          },
          timeFor: { id: '1', name: 'Test' },
          customFields: [],
        })),
        control: {},
      });
    });

    it('renders when formValues.timeFor is undefined', () => {
      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const formValues = {
            billable: true,
            timeAgainst: {
              customer: { id: 'c1', name: 'Cust' },
              project: { id: 'p1', name: 'Proj' },
            },
            timeFor: undefined,
            customFields: [],
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: true,
          timeAgainst: {
            customer: { id: 'c1', name: 'Cust' },
            project: { id: 'p1', name: 'Proj' },
          },
          timeFor: undefined,
          customFields: [],
        })),
        control: {},
      });

      render(<ClockOutView {...defaultProps} />);
      expect(
        screen.getByTestId('clock-out-drawer-content'),
      ).toBeInTheDocument();
    });

    it('renders when timeAgainst customer and project ids are undefined', () => {
      useTimeClockFieldAssignmentsMock.mockReturnValue({
        visibleCustomFields: [],
        standardFieldsVisibility: {
          service: true,
          class: false,
          location: false,
          billable: false,
        },
        standardFieldOptionAssignments: {},
        loading: false,
        workerId: undefined,
        customerId: undefined,
        projectId: undefined,
        customFieldOptionAssignments: {},
      });

      (useFormContext as jest.Mock).mockReturnValue({
        watch: jest.fn().mockImplementation((field?: string) => {
          const formValues = {
            billable: true,
            timeAgainst: {
              customer: undefined,
              project: undefined,
            },
            timeFor: { id: '1', name: 'Test' },
            customFields: [],
          };
          return field
            ? formValues[field as keyof typeof formValues]
            : formValues;
        }),
        getValues: jest.fn(() => ({
          billable: true,
          timeAgainst: { customer: undefined, project: undefined },
          timeFor: { id: '1', name: 'Test' },
          customFields: [],
        })),
        control: {},
      });

      render(
        <ClockOutView
          {...defaultProps}
          settings={{ ...defaultProps.settings, isServiceFieldEnabled: true }}
        />,
      );
      expect(
        screen.getByTestId('clock-out-drawer-content'),
      ).toBeInTheDocument();
    });
  });
});
