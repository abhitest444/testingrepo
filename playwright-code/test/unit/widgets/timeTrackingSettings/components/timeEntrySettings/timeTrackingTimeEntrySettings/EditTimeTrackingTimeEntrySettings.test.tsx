import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { EditTimeTrackingTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeTrackingTimeEntrySettings/EditTimeTrackingTimeEntrySettings';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';

// Mock IntlProvider and sandbox hooks
jest.mock('@payroll/quicksand', () => ({
  IntlProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
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

// Mock the sandbox utils
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  useSandboxNavigate: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock TimeZoneField component
jest.mock('src/js/widgets/common/addTimeFormComponents/TimeZoneField', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <input
      data-testid="__textField"
      type="text"
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}));

// Create a mock function that we can reference in tests
const mockStopPropagation = jest.fn();

// Mock the dropdown component
jest.mock('@ids-ts/dropdown', () => ({
  Dropdown: ({
    children,
    onChange,
    value,
    'aria-label': ariaLabel,
    label,
  }: any) => {
    const handleChange = (e: any) => {
      const event = {
        target: { value: e.target.value },
        stopPropagation: mockStopPropagation,
      };
      if (onChange) {
        onChange(event);
      }
    };

    // Add special handling for clock in/out dropdowns
    let testId = `mock-dropdown-${ariaLabel}`;
    if (ariaLabel === 'roundingClockIN') {
      if (label.includes('clock-in')) {
        testId = 'mock-dropdown-roundingClockIN-clock-in';
      } else if (label.includes('clock-out')) {
        testId = 'mock-dropdown-roundingClockIN-clock-out';
      }
    } else if (ariaLabel === 'directionClockIn') {
      if (label.includes('clock-in')) {
        testId = 'mock-dropdown-directionClockIn-clock-in';
      } else if (label.includes('clock-out')) {
        testId = 'mock-dropdown-directionClockIn-clock-out';
      }
    }

    return (
      <select data-testid={testId} value={value} onChange={handleChange}>
        {children}
      </select>
    );
  },
  MenuItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      editClockOutTimeEnabled: true,
      timeFormat: '',
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('EditTimeTrackingTimeEntrySettings', () => {
  beforeEach(() => {
    mockStopPropagation.mockClear();

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

  it('renders all sections correctly', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    expect(
      screen.getByText('time-entries.section.title.time-management'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('time-entries.section.title.timesheet-rounding'),
    ).toBeInTheDocument();
  });

  it('handles time zone field changes', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const timeZoneField = screen.getByTestId('__textField');
    expect(timeZoneField).toBeInTheDocument();

    fireEvent.change(timeZoneField, { target: { value: 'America/Chicago' } });
    expect((timeZoneField as HTMLInputElement).value).toBe('America/Chicago');
  });

  it('handles checkbox toggles correctly', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const checkbox = screen.getByText(
      'time-entries.section.title.time-management.split-time-sheet',
    );
    fireEvent.click(checkbox);

    expect(
      screen.getByText(
        'time-entries.section.title.time-management.split-time-sheet',
      ),
    ).toBeInTheDocument();
  });

  it('tracks split timesheet checkbox state changes correctly', () => {
    const mockTrack = jest.fn();
    jest
      .spyOn(require('@payroll/quicksand'), 'useTracking')
      .mockReturnValue(mockTrack);

    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const checkbox = screen.getByText(
      'time-entries.section.title.time-management.split-time-sheet',
    );

    // Test enabling the checkbox
    fireEvent.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith({
      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_SPLIT_AT_MIDNIGHT,
      ui_action: 'enabled',
    });

    // Test disabling the checkbox
    fireEvent.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith({
      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_SPLIT_AT_MIDNIGHT,
      ui_action: 'disabled',
    });

    // Verify the tracking was called exactly twice
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('disables text input when edit clock-out checkbox is unchecked', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const checkbox = screen.getByText(
      'time-entries.section.title.time-management.ask-team-member-like-to-edit-clock-out-time',
    );

    // First verify the input is enabled when checkbox is checked
    const textField = screen.getByRole('spinbutton');
    expect(textField).not.toBeDisabled();

    // Then uncheck the checkbox to disable the input
    fireEvent.click(checkbox);
    expect(textField).toBeDisabled();
  });
  it('handles first day of week selection', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const firstDayDropdown = screen.getByTestId(
      'mock-dropdown-DaysOfWeekDropDown',
    );
    expect(firstDayDropdown).toBeInTheDocument();

    fireEvent.change(firstDayDropdown, { target: { value: '1' } });
    expect(firstDayDropdown).toHaveValue('1');
    expect(mockStopPropagation).toHaveBeenCalled();
  });

  it('handles clock in/out rounding direction changes', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const clockInDirectionDropdown = screen.getByTestId(
      'mock-dropdown-directionClockIn-clock-in',
    );
    const clockOutDirectionDropdown = screen.getByTestId(
      'mock-dropdown-directionClockIn-clock-out',
    );

    expect(clockInDirectionDropdown).toBeInTheDocument();
    expect(clockOutDirectionDropdown).toBeInTheDocument();

    fireEvent.change(clockInDirectionDropdown, { target: { value: 'UP' } });
    fireEvent.change(clockOutDirectionDropdown, { target: { value: 'DOWN' } });

    expect(clockInDirectionDropdown).toHaveValue('UP');
    expect(clockOutDirectionDropdown).toHaveValue('DOWN');
    // stopPropagation is called twice (once for each dropdown)
    expect(mockStopPropagation).toHaveBeenCalledTimes(2);
  });

  it('tracks clock in rounding direction changes', () => {
    const mockTrack = jest.fn();
    jest
      .spyOn(require('@payroll/quicksand'), 'useTracking')
      .mockReturnValue(mockTrack);

    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const clockInDirectionDropdown = screen.getByTestId(
      'mock-dropdown-directionClockIn-clock-in',
    );

    // Change clock-in direction from default to UP
    fireEvent.change(clockInDirectionDropdown, { target: { value: 'UP' } });
    expect(mockTrack).toHaveBeenCalledWith(
      TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_CLOCK_IN_DIRECTION,
    );

    // Change clock-in direction to DOWN
    fireEvent.change(clockInDirectionDropdown, { target: { value: 'DOWN' } });
    expect(mockTrack).toHaveBeenCalledWith(
      TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_CLOCK_IN_DIRECTION,
    );

    // Verify tracking was called twice (once for each change)
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('tracks clock out rounding direction changes', () => {
    const mockTrack = jest.fn();
    jest
      .spyOn(require('@payroll/quicksand'), 'useTracking')
      .mockReturnValue(mockTrack);

    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const clockOutDirectionDropdown = screen.getByTestId(
      'mock-dropdown-directionClockIn-clock-out',
    );

    // Change clock-out direction
    fireEvent.change(clockOutDirectionDropdown, { target: { value: 'UP' } });
    expect(mockTrack).toHaveBeenCalledWith(
      TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_CLOCK_OUT_DIRECTION,
    );

    // Verify tracking was called
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it('handles clock in/out rounding increment changes', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const clockInIncrementDropdown = screen.getByTestId(
      'mock-dropdown-roundingClockIN-clock-in',
    );
    const clockOutIncrementDropdown = screen.getByTestId(
      'mock-dropdown-roundingClockIN-clock-out',
    );

    expect(clockInIncrementDropdown).toBeInTheDocument();
    expect(clockOutIncrementDropdown).toBeInTheDocument();

    fireEvent.change(clockInIncrementDropdown, { target: { value: '15' } });
    fireEvent.change(clockOutIncrementDropdown, { target: { value: '30' } });

    expect(clockInIncrementDropdown).toHaveValue('15');
    expect(clockOutIncrementDropdown).toHaveValue('30');
    expect(mockStopPropagation).toHaveBeenCalledTimes(2);
  });

  it('handles manage own timesheets checkbox toggle', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const checkbox = screen.getByText(
      'time-entries.section.title.time-management.allow-team-member-to-create-or-edit-their-own-timesheet',
    );
    expect(checkbox).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(checkbox).toBeInTheDocument();
  });

  it('tracks manage own timesheets checkbox state changes correctly', () => {
    const mockTrack = jest.fn();
    jest
      .spyOn(require('@payroll/quicksand'), 'useTracking')
      .mockReturnValue(mockTrack);

    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const checkbox = screen.getByText(
      'time-entries.section.title.time-management.allow-team-member-to-create-or-edit-their-own-timesheet',
    );

    // Test enabling the checkbox
    fireEvent.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith({
      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_EDIT_OWN_TIMESHEET,
      ui_action: 'enabled',
    });

    // Test disabling the checkbox
    fireEvent.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith({
      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_EDIT_OWN_TIMESHEET,
      ui_action: 'disabled',
    });

    // Verify the tracking was called exactly twice
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('renders mobile time tracking checkbox', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const checkbox = screen.getByText(
      'time-entries.section.title.time-management.allow-team-member-to-track-time-on-mobile',
    );
    expect(checkbox).toBeInTheDocument();
  });

  it('handles mobile time tracking checkbox toggle', () => {
    const mockTrack = jest.fn();
    jest
      .spyOn(require('@payroll/quicksand'), 'useTracking')
      .mockReturnValue(mockTrack);

    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const checkboxText = screen.getByText(
      'time-entries.section.title.time-management.allow-team-member-to-track-time-on-mobile',
    );
    const checkboxContainer = checkboxText.closest(
      '[data-testid="mobile-time-tracking"]',
    );
    const checkbox = checkboxContainer?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    fireEvent.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith({
      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_MOBILE_TIME_TRACKING,
      ui_action: 'enabled',
    });
  });

  it('disables mobile time tracking checkbox when manageOwnTimeSheetsEnabled is true', () => {
    const CustomWrapper = ({ children }: { children: React.ReactNode }) => {
      const methods = useForm({
        defaultValues: {
          editClockOutTimeEnabled: true,
          timeFormat: '',
          manageOwnTimeSheetsEnabled: true,
          mobileTimeTrackingEnabled: false,
        },
      });
      return <FormProvider {...methods}>{children}</FormProvider>;
    };

    render(
      <CustomWrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </CustomWrapper>,
    );

    const checkboxText = screen.getByText(
      'time-entries.section.title.time-management.allow-team-member-to-track-time-on-mobile',
    );
    const checkboxContainer = checkboxText.closest(
      '[data-testid="mobile-time-tracking"]',
    );
    const checkbox = checkboxContainer?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    expect(checkbox).toBeDisabled();
    expect(checkbox.checked).toBe(true);
  });

  it('enables mobile time tracking checkbox and clicking it fires tracking event when manageOwnTimeSheetsEnabled is false', () => {
    const mockTrack = jest.fn();
    jest
      .spyOn(require('@payroll/quicksand'), 'useTracking')
      .mockReturnValue(mockTrack);

    const CustomWrapper = ({ children }: { children: React.ReactNode }) => {
      const methods = useForm({
        defaultValues: {
          editClockOutTimeEnabled: true,
          timeFormat: '',
          manageOwnTimeSheetsEnabled: false,
          mobileTimeTrackingEnabled: false,
        },
      });
      return <FormProvider {...methods}>{children}</FormProvider>;
    };

    render(
      <CustomWrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </CustomWrapper>,
    );

    const checkboxText = screen.getByText(
      'time-entries.section.title.time-management.allow-team-member-to-track-time-on-mobile',
    );
    const checkboxContainer = checkboxText.closest(
      '[data-testid="mobile-time-tracking"]',
    );
    const checkbox = checkboxContainer?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    expect(checkbox).not.toBeDisabled();
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith({
      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_MOBILE_TIME_TRACKING,
      ui_action: 'enabled',
    });
  });

  it('reflects actual form value for mobile time tracking checkbox when manageOwnTimeSheetsEnabled is toggled off', () => {
    const CustomWrapper = ({ children }: { children: React.ReactNode }) => {
      const methods = useForm({
        defaultValues: {
          editClockOutTimeEnabled: true,
          timeFormat: '',
          manageOwnTimeSheetsEnabled: false,
          mobileTimeTrackingEnabled: false,
        },
      });
      return <FormProvider {...methods}>{children}</FormProvider>;
    };

    render(
      <CustomWrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </CustomWrapper>,
    );

    const checkboxText = screen.getByText(
      'time-entries.section.title.time-management.allow-team-member-to-track-time-on-mobile',
    );
    const checkboxContainer = checkboxText.closest(
      '[data-testid="mobile-time-tracking"]',
    );
    const checkbox = checkboxContainer?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    // When manageOwnTimeSheetsEnabled is false, checkbox reflects its actual value (false)
    expect(checkbox.checked).toBe(false);
  });

  it('renders signature capture checkbox', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const checkbox = screen.getByText(
      'time-entries.section.title.time-management.capture-signatures-for-timesheets',
    );
    expect(checkbox).toBeInTheDocument();
  });

  it('handles signature capture checkbox toggle', () => {
    const mockTrack = jest.fn();
    jest
      .spyOn(require('@payroll/quicksand'), 'useTracking')
      .mockReturnValue(mockTrack);

    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const checkboxText = screen.getByText(
      'time-entries.section.title.time-management.capture-signatures-for-timesheets',
    );
    const checkboxContainer = checkboxText.closest(
      '[data-testid="signature-capture"]',
    );
    const checkbox = checkboxContainer?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    fireEvent.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith({
      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_SIGNATURE_CAPTURE,
      ui_action: 'enabled',
    });
  });

  it('handles clock out hours input when enabled', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const hoursInput = screen.getByRole('spinbutton');
    expect(hoursInput).toBeInTheDocument();

    fireEvent.change(hoursInput, { target: { value: '2' } });
    expect(hoursInput).toHaveValue(2);
  });

  it('tracks edit clock out time checkbox state changes and enables hours input', () => {
    const mockTrack = jest.fn();
    jest
      .spyOn(require('@payroll/quicksand'), 'useTracking')
      .mockReturnValue(mockTrack);

    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    const checkbox = screen.getByText(
      'time-entries.section.title.time-management.ask-team-member-like-to-edit-clock-out-time',
    );
    const hoursInput = screen.getByRole('spinbutton');

    // Initially verify the input is enabled (based on default value in Wrapper)
    expect(hoursInput).not.toBeDisabled();

    // First click will disable the checkbox (since it starts enabled)
    fireEvent.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith({
      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_EDIT_CLOCKOUT_OVERRIDE_ENABLED,
      ui_action: 'disabled',
    });
    expect(hoursInput).toBeDisabled();

    // Second click will enable the checkbox
    fireEvent.click(checkbox);
    expect(mockTrack).toHaveBeenCalledWith({
      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_EDIT_CLOCKOUT_OVERRIDE_ENABLED,
      ui_action: 'enabled',
    });
    expect(hoursInput).not.toBeDisabled();

    // Verify the tracking was called exactly twice
    expect(mockTrack).toHaveBeenCalledTimes(2);

    // Test hours input interaction when enabled
    fireEvent.change(hoursInput, { target: { value: '3' } });
    expect(hoursInput).toHaveValue(3);
  });

  it('should hide mobile time tracking and signature capture when feature flag is disabled', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled={false}
          isTimeElite
        />
      </Wrapper>,
    );

    expect(
      screen.queryByTestId('mobile-time-tracking'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('signature-capture')).not.toBeInTheDocument();
  });

  it('should show mobile time tracking and signature capture when feature flag is enabled', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    expect(screen.getByTestId('mobile-time-tracking')).toBeInTheDocument();
    expect(screen.getByTestId('signature-capture')).toBeInTheDocument();
  });

  it('should hide signature capture when user does not have Elite SKU', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite={false}
        />
      </Wrapper>,
    );

    // Mobile time tracking should still be visible (not Elite-gated)
    expect(screen.getByTestId('mobile-time-tracking')).toBeInTheDocument();

    // Signature capture should be hidden (Elite-gated)
    expect(screen.queryByTestId('signature-capture')).not.toBeInTheDocument();
  });

  it('should show signature capture when user has Elite SKU', () => {
    render(
      <Wrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </Wrapper>,
    );

    // Both should be visible when Elite
    expect(screen.getByTestId('mobile-time-tracking')).toBeInTheDocument();
    expect(screen.getByTestId('signature-capture')).toBeInTheDocument();
  });

  it('should sync mobileTimeTrackingEnabled form value to true when user checks manageOwnTimeSheetsEnabled', () => {
    let formMethods: any;

    const CustomWrapper = ({ children }: { children: React.ReactNode }) => {
      formMethods = useForm({
        defaultValues: {
          editClockOutTimeEnabled: true,
          timeFormat: '',
          manageOwnTimeSheetsEnabled: false,
          mobileTimeTrackingEnabled: false,
        },
      });
      return <FormProvider {...formMethods}>{children}</FormProvider>;
    };

    render(
      <CustomWrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </CustomWrapper>,
    );

    // Initially both are false
    expect(formMethods.getValues('manageOwnTimeSheetsEnabled')).toBe(false);
    expect(formMethods.getValues('mobileTimeTrackingEnabled')).toBe(false);

    // Find and click the manageOwnTimeSheetsEnabled checkbox (simulating user action)
    const manageOwnCheckboxContainer = screen.getByTestId(
      'allow-to-create-edit-ts',
    );
    const manageOwnCheckbox = manageOwnCheckboxContainer.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    fireEvent.click(manageOwnCheckbox);

    // Now mobileTimeTrackingEnabled should automatically be synced to true
    expect(formMethods.getValues('manageOwnTimeSheetsEnabled')).toBe(true);
    expect(formMethods.getValues('mobileTimeTrackingEnabled')).toBe(true);
  });

  it('should not sync mobileTimeTrackingEnabled when feature flag is disabled', () => {
    let formMethods: any;

    const CustomWrapper = ({ children }: { children: React.ReactNode }) => {
      formMethods = useForm({
        defaultValues: {
          editClockOutTimeEnabled: true,
          timeFormat: '',
          manageOwnTimeSheetsEnabled: false,
          mobileTimeTrackingEnabled: false,
        },
      });
      return <FormProvider {...formMethods}>{children}</FormProvider>;
    };

    const { rerender } = render(
      <CustomWrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled={false}
          isTimeElite
        />
      </CustomWrapper>,
    );

    // Initially both are false
    expect(formMethods.getValues('manageOwnTimeSheetsEnabled')).toBe(false);
    expect(formMethods.getValues('mobileTimeTrackingEnabled')).toBe(false);

    // Manually update manageOwnTimeSheetsEnabled
    formMethods.setValue('manageOwnTimeSheetsEnabled', true);

    // Force re-render
    rerender(
      <CustomWrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled={false}
          isTimeElite
        />
      </CustomWrapper>,
    );

    // mobileTimeTrackingEnabled should remain false (no sync when flag is off)
    expect(formMethods.getValues('manageOwnTimeSheetsEnabled')).toBe(true);
    expect(formMethods.getValues('mobileTimeTrackingEnabled')).toBe(false);
  });
});

describe('mobile tracking form state synchronization with shouldDirty', () => {
  it('marks mobileTimeTrackingEnabled as dirty when user checks manageOwnTimeSheetsEnabled', () => {
    const mockSetValue = jest.fn();
    let formMethods: any;

    const CustomWrapper = ({ children }: { children: React.ReactNode }) => {
      formMethods = useForm({
        defaultValues: {
          manageOwnTimeSheetsEnabled: false,
          mobileTimeTrackingEnabled: false,
          editClockOutTimeEnabled: false,
          timeFormat: '',
        },
      });

      // Override setValue to spy on it
      const originalSetValue = formMethods.setValue;
      formMethods.setValue = (...args: any[]) => {
        mockSetValue(...args);
        return originalSetValue(...args);
      };

      return <FormProvider {...formMethods}>{children}</FormProvider>;
    };

    render(
      <CustomWrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </CustomWrapper>,
    );

    // Initially both are false
    expect(formMethods.getValues('manageOwnTimeSheetsEnabled')).toBe(false);
    expect(formMethods.getValues('mobileTimeTrackingEnabled')).toBe(false);

    // Find and click the manageOwnTimeSheetsEnabled checkbox
    const manageOwnCheckboxContainer = screen.getByTestId(
      'allow-to-create-edit-ts',
    );
    const manageOwnCheckbox = manageOwnCheckboxContainer.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    fireEvent.click(manageOwnCheckbox);

    // Verify setValue was called with shouldDirty: true for mobile tracking
    expect(mockSetValue).toHaveBeenCalledWith(
      'mobileTimeTrackingEnabled',
      true,
      expect.objectContaining({
        shouldDirty: true,
      }),
    );
  });

  it('ensures both fields are marked as dirty when user checks manageOwn', () => {
    let formMethods: any;

    const CustomWrapper = ({ children }: { children: React.ReactNode }) => {
      formMethods = useForm({
        defaultValues: {
          manageOwnTimeSheetsEnabled: false,
          mobileTimeTrackingEnabled: false,
          editClockOutTimeEnabled: false,
          timeFormat: '',
        },
      });
      return <FormProvider {...formMethods}>{children}</FormProvider>;
    };

    render(
      <CustomWrapper>
        <EditTimeTrackingTimeEntrySettings
          isFitAndFinishSettingsEnabled
          isTimeElite
        />
      </CustomWrapper>,
    );

    // Check that initial dirty fields are empty
    expect(
      formMethods.formState.dirtyFields.manageOwnTimeSheetsEnabled,
    ).toBeFalsy();
    expect(
      formMethods.formState.dirtyFields.mobileTimeTrackingEnabled,
    ).toBeFalsy();

    // Find and click the manageOwnTimeSheetsEnabled checkbox (simulating user action)
    const manageOwnCheckboxContainer = screen.getByTestId(
      'allow-to-create-edit-ts',
    );
    const manageOwnCheckbox = manageOwnCheckboxContainer.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    act(() => {
      fireEvent.click(manageOwnCheckbox);
    });

    // Both fields should now be dirty
    expect(
      formMethods.formState.dirtyFields.manageOwnTimeSheetsEnabled,
    ).toBeTruthy();
    expect(
      formMethods.formState.dirtyFields.mobileTimeTrackingEnabled,
    ).toBeTruthy();
  });

  // Note: The onChange event-based approach ensures mobileTimeTrackingEnabled is only marked
  // dirty when the user actively clicks the manageOwnTimeSheetsEnabled checkbox, avoiding
  // false "unsaved changes" warnings when edit mode is opened.
});
