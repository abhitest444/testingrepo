import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { useWatch, useFormContext } from 'react-hook-form';

import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  FormSwitch,
  FormSwitchProps,
} from 'src/js/widgets/common/addTimeFormComponents/FormSwitch';

// Mock tracking points for testing
const mockTrackingPoints = {
  CLOCK_IN: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'timeentrymanagement',
    screen: 'single_time_entry',
    action: 'enabled',
    object: 'component',
    object_detail: 'clock_in_toggle',
    ui_action: 'enabled',
    ui_object: 'switch',
    ui_object_detail: 'clock_in_toggle',
    ui_access_point: 'modal',
  },
  CLOCK_OUT: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'timeentrymanagement',
    screen: 'single_time_entry',
    action: 'enabled',
    object: 'component',
    object_detail: 'clock_out_toggle',
    ui_action: 'enabled',
    ui_object: 'switch',
    ui_object_detail: 'clock_out_toggle',
    ui_access_point: 'modal',
  },
};

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
  useFormContext: jest.fn(),
}));

describe('FormSwitch', () => {
  let props: FormSwitchProps;
  let mockClearErrors: jest.Mock;

  beforeEach(() => {
    (useWatch as jest.Mock).mockReturnValue(false); // Default to unlocked
    mockClearErrors = jest.fn();
    (useFormContext as jest.Mock).mockReturnValue({
      clearErrors: mockClearErrors,
    });
    props = {
      name: 'test',
      trackingPoints: mockTrackingPoints,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the switch with the correct label', () => {
    renderWithFormProvider(<FormSwitch {...props} />, {
      defaultValues: {
        test: false,
      },
    });
    expect(screen.getByText(/toggleClockIn/)).toBeInTheDocument();
  });

  test('toggles the switch value on click', () => {
    renderWithFormProvider(<FormSwitch {...props} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();

    fireEvent.click(switchElement);
    expect(switchElement).toBeChecked();

    fireEvent.click(switchElement);
    expect(switchElement).not.toBeChecked();
  });

  test.each([
    { description: 'disabled', isLocked: true, expectedDisabled: true },
    { description: 'enabled', isLocked: false, expectedDisabled: false },
  ])(
    'switch is $description when isLocked is $isLocked',
    ({ isLocked, expectedDisabled }) => {
      (useWatch as jest.Mock).mockReturnValue(isLocked);

      renderWithFormProvider(<FormSwitch {...props} />, {
        defaultValues: { test: false },
      });
      const switchElement = screen.getByRole('switch');
      if (expectedDisabled) {
        expect(switchElement).toBeDisabled();
      } else {
        expect(switchElement).not.toBeDisabled();
      }
    },
  );

  test.each([
    {
      description: 'disabled when isdisabled is true',
      isdisabled: true as boolean | undefined,
      expectedDisabled: true,
    },
    {
      description: 'enabled when isdisabled is false',
      isdisabled: false as boolean | undefined,
      expectedDisabled: false,
    },
    {
      description: 'enabled when isdisabled is not provided',
      isdisabled: undefined as boolean | undefined,
      expectedDisabled: false,
    },
  ])(
    'renders the switch as $description',
    ({ isdisabled, expectedDisabled }) => {
      props.isdisabled = isdisabled;
      renderWithFormProvider(<FormSwitch {...props} />, {
        defaultValues: { test: false },
      });
      const switchElement = screen.getByRole('switch');
      if (expectedDisabled) {
        expect(switchElement).toBeDisabled();
      } else {
        expect(switchElement).not.toBeDisabled();
      }
    },
  );

  test('clears time-related errors when switching to duration mode (toggleClockIn = false)', () => {
    renderWithFormProvider(<FormSwitch {...props} />, {
      defaultValues: {
        test: true, // Start with clock-in mode (true) - use the actual field name
      },
    });

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'true');

    // Click to switch to duration mode (false)
    fireEvent.click(switchElement);

    // Verify clearErrors was called for time-related fields
    expect(mockClearErrors).toHaveBeenCalledWith('startTime');
    expect(mockClearErrors).toHaveBeenCalledWith('endTime');
  });

  test('clears duration-related errors when switching to time mode (toggleClockIn = true)', () => {
    renderWithFormProvider(<FormSwitch {...props} />, {
      defaultValues: {
        test: false, // Start with duration mode (false) - use the actual field name
      },
    });

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'false');

    // Click to switch to time mode (true)
    fireEvent.click(switchElement);

    // Verify clearErrors was called for duration field
    expect(mockClearErrors).toHaveBeenCalledWith('duration');
  });
});
