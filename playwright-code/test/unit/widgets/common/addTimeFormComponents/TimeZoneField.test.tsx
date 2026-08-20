import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import TimeZoneField from 'src/js/widgets/common/addTimeFormComponents/TimeZoneField';

// Mock useWatch from react-hook-form to control isApproved
jest.mock('react-hook-form', () => {
  const actual = jest.requireActual('react-hook-form');
  return {
    ...actual,
    useWatch: jest.fn(),
  };
});

// Mock useTracking from @payroll/quicksand
const mockTrack = jest.fn();
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
  useTracking: () => mockTrack,
}));

const { useWatch } = require('react-hook-form');

describe('TimeZoneField Component', () => {
  const mockIntl = {
    formatMessage: jest.fn(({ id }) => id),
  };

  const mockTrackingPoint = {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'timeentrymanagement',
    screen: 'single_time_tracking_time_entry',
    object: 'component',
    object_detail: 'time_currently_working_field',
    ui_action: 'clicked',
    ui_object: 'form_field',
    ui_object_detail: 'timezone',
    ui_access_point: 'modal',
    action: 'engaged',
  };

  beforeEach(() => {
    jest
      .spyOn(require('@payroll/quicksand'), 'useIntl')
      .mockReturnValue(mockIntl);
    useWatch.mockReset();
    mockTrack.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial value', () => {
    useWatch.mockReturnValue(false);
    render(<TimeZoneField name="timezone" value="America/New_York" />);
    expect(screen.getByLabelText('time_zone_field_label')).toHaveValue(
      'Eastern Time (US & Canada)',
    );
  });

  test.each([
    { description: 'true', isApproved: true, expectedReadonly: true },
    { description: 'false', isApproved: false, expectedReadonly: false },
    {
      description: 'undefined',
      isApproved: undefined,
      expectedReadonly: false,
    },
  ])(
    'input readonly state when isApproved is $description',
    ({ isApproved, expectedReadonly }) => {
      useWatch.mockReturnValue(isApproved);
      render(<TimeZoneField name="timezone" value="America/New_York" />);
      const input = screen.getByLabelText('time_zone_field_label');
      if (expectedReadonly) {
        expect(input).toHaveAttribute('readonly');
      } else {
        expect(input).not.toHaveAttribute('readonly');
      }
    },
  );

  it('updates input value on typing', () => {
    render(<TimeZoneField name="timezone" value="America/New_York" />);
    const input = screen.getByLabelText('time_zone_field_label');
    fireEvent.change(input, { target: { value: 'Pacific' } });
    expect(input).toHaveValue('Pacific');
  });

  it('filters dropdown options based on input', async () => {
    render(<TimeZoneField name="timezone" value="America/New_York" />);
    const input = screen.getByLabelText('time_zone_field_label');

    // Simulate typing in the input field
    fireEvent.change(input, { target: { value: 'Arizona' } });

    // Wait for the dropdown to be visible and get the options
    const dropdown = await screen.findByRole('combobox');
    expect(dropdown).toBeInTheDocument();

    // Verify that only Arizona timezone option is shown
    const arizonaOption = await screen.findByText('Arizona');
    expect(arizonaOption).toBeInTheDocument();
  });

  it('updates selected value on dropdown selection', () => {
    render(<TimeZoneField name="timezone" value="America/New_York" />);
    const input = screen.getByLabelText('time_zone_field_label');
    fireEvent.change(input, { target: { value: 'Pacific' } });

    const dropdownOption = screen.getByText('Pacific Time (US & Canada)');
    fireEvent.click(dropdownOption);

    expect(input).toHaveValue('Pacific Time (US & Canada)');
  });

  it('resets input value to selected value on blur', () => {
    render(<TimeZoneField name="timezone" value="America/New_York" />);
    const input = screen.getByLabelText('time_zone_field_label');
    fireEvent.change(input, { target: { value: 'Invalid Timezone' } });
    fireEvent.blur(input);

    expect(input).toHaveValue('Eastern Time (US & Canada)');
  });

  it('renders read-only mode correctly', () => {
    render(<TimeZoneField name="timezone" value="America/New_York" readOnly />);
    const input = screen.getByLabelText('time_zone_field_label');
    expect(input).toHaveAttribute('readonly');
  });

  it('handles empty value gracefully', () => {
    render(<TimeZoneField name="timezone" value="" />);
    const input = screen.getByLabelText('time_zone_field_label');
    expect(input).toHaveValue('');
  });

  it('handles invalid timezone gracefully', () => {
    render(<TimeZoneField name="timezone" value="Invalid/Timezone" />);
    const input = screen.getByLabelText('time_zone_field_label');
    expect(input).toHaveValue('Invalid/Timezone');
  });

  it('does not allow invalid selection from dropdown', () => {
    render(<TimeZoneField name="timezone" value="America/New_York" />);
    const input = screen.getByLabelText('time_zone_field_label');
    fireEvent.change(input, { target: { value: 'Invalid Timezone' } });

    const dropdownOptions = screen.queryAllByRole('menuitem');
    expect(dropdownOptions).toHaveLength(0);
  });

  it('updates value correctly when input changes', async () => {
    render(<TimeZoneField name="timezone" value="America/New_York" />);
    const input = screen.getByLabelText('time_zone_field_label');

    // Simulate typing in the input field
    fireEvent.change(input, { target: { value: 'Pacific' } });

    // Wait for the dropdown options to appear
    const dropdownOption = await screen.findByText(
      'Pacific Time (US & Canada)',
    );

    // Simulate selecting an option from the dropdown
    fireEvent.click(dropdownOption);

    // Assert that the input value is updated
    expect(input).toHaveValue('Pacific Time (US & Canada)');
  });

  // Tracking functionality tests
  describe('Tracking functionality', () => {
    it('calls track function when trackingPoint is provided and timezone is selected', () => {
      const mockOnChange = jest.fn();
      render(
        <TimeZoneField
          name="timezone"
          value="America/New_York"
          trackingPoint={mockTrackingPoint}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByLabelText('time_zone_field_label');

      // Simulate selecting a timezone from dropdown
      fireEvent.change(input, { target: { value: 'Pacific' } });
      const dropdownOption = screen.getByText('Pacific Time (US & Canada)');
      fireEvent.click(dropdownOption);

      // Verify tracking was called with the correct tracking point
      expect(mockTrack).toHaveBeenCalledWith(mockTrackingPoint);
      expect(mockTrack).toHaveBeenCalledTimes(1);
    });

    it('does not call track function when trackingPoint is not provided', () => {
      const mockOnChange = jest.fn();
      render(
        <TimeZoneField
          name="timezone"
          value="America/New_York"
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByLabelText('time_zone_field_label');

      // Simulate selecting a timezone from dropdown
      fireEvent.change(input, { target: { value: 'Pacific' } });
      const dropdownOption = screen.getByText('Pacific Time (US & Canada)');
      fireEvent.click(dropdownOption);

      // Verify tracking was not called
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it('does not call track function when no valid selection is made', () => {
      render(
        <TimeZoneField
          name="timezone"
          value="America/New_York"
          trackingPoint={mockTrackingPoint}
        />,
      );

      const input = screen.getByLabelText('time_zone_field_label');

      // Simulate typing but not selecting anything
      fireEvent.change(input, { target: { value: 'Invalid' } });

      // Verify tracking was not called
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it('calls track function only once per valid selection', () => {
      const mockOnChange = jest.fn();
      render(
        <TimeZoneField
          name="timezone"
          value="America/New_York"
          trackingPoint={mockTrackingPoint}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByLabelText('time_zone_field_label');

      // Simulate multiple selections
      fireEvent.change(input, { target: { value: 'Pacific' } });
      const pacificOption = screen.getByText('Pacific Time (US & Canada)');
      fireEvent.click(pacificOption);

      fireEvent.change(input, { target: { value: 'Mountain' } });
      const mountainOption = screen.getByText('Mountain Time (US & Canada)');
      fireEvent.click(mountainOption);

      // Verify tracking was called exactly twice (once for each selection)
      expect(mockTrack).toHaveBeenCalledTimes(2);
      expect(mockTrack).toHaveBeenNthCalledWith(1, mockTrackingPoint);
      expect(mockTrack).toHaveBeenNthCalledWith(2, mockTrackingPoint);
    });

    it('calls onChange callback after tracking', () => {
      const mockOnChange = jest.fn();
      render(
        <TimeZoneField
          name="timezone"
          value="America/New_York"
          trackingPoint={mockTrackingPoint}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByLabelText('time_zone_field_label');

      // Simulate selecting a timezone from dropdown
      fireEvent.change(input, { target: { value: 'Pacific' } });
      const dropdownOption = screen.getByText('Pacific Time (US & Canada)');
      fireEvent.click(dropdownOption);

      // Verify onChange was called with the correct value
      expect(mockOnChange).toHaveBeenCalledWith('America/Los_Angeles');
    });
  });

  // Sync behavior: the field must reflect a value that arrives after mount
  // (e.g. async-loaded settings.timezone or a form setValue), without a remount.
  describe('value prop sync', () => {
    it('updates the displayed value when the value prop changes after mount', () => {
      useWatch.mockReturnValue(false);
      const { rerender } = render(<TimeZoneField name="timezone" value="" />);
      // Mounts empty (value not yet available)
      expect(screen.getByLabelText('time_zone_field_label')).toHaveValue('');

      // Parent supplies the value later (no key change / no remount)
      rerender(<TimeZoneField name="timezone" value="America/Los_Angeles" />);
      expect(screen.getByLabelText('time_zone_field_label')).toHaveValue(
        'Pacific Time (US & Canada)',
      );
    });

    it('does not clobber in-progress typing when the value prop is unchanged', () => {
      useWatch.mockReturnValue(false);
      const { rerender } = render(
        <TimeZoneField name="timezone" value="America/New_York" />,
      );
      const input = screen.getByLabelText('time_zone_field_label');

      // User starts typing a search term
      fireEvent.change(input, { target: { value: 'Pac' } });
      expect(input).toHaveValue('Pac');

      // An unrelated parent re-render with the SAME value must not reset typing
      rerender(<TimeZoneField name="timezone" value="America/New_York" />);
      expect(input).toHaveValue('Pac');
    });
  });
});
