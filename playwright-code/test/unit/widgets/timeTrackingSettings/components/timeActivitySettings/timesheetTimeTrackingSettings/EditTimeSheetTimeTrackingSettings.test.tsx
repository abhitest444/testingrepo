import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { useIntl } from '@payroll/quicksand';
import { EditTimeSheetTimeTrackingSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeActivitySettings/timeSheetTimeTrackingSettings/EditTimeSheetTimeTrackingSettings';

// Mock dependencies
jest.mock('react-hook-form', () => ({
  useFormContext: jest.fn(),
  Controller: ({ render, name }: { render: any; name: string }) => (
    <div>
      {render({
        field: {
          onChange: jest.fn(),
          onBlur: jest.fn(),
          name,
          value: true,
          ref: jest.fn(),
        },
        fieldState: {
          invalid: false,
          isTouched: false,
          isDirty: false,
          isValidating: false,
        },
      })}
    </div>
  ),
  useWatch: jest.fn(() => true), // Mock useWatch
}));

jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
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

jest.mock('@ids-ts/switch', () => ({
  __esModule: true,
  default: ({ checked, onChange, 'aria-label': ariaLabel }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  ),
}));

jest.mock('@ids-ts/checkbox', () => ({
  __esModule: true,
  default: ({ checked, onChange }: any) => (
    <input type="checkbox" checked={checked} onChange={onChange} />
  ),
}));

jest.mock('@ids-ts/tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="ids-tooltip">{children}</span>
  ),
}));

describe('EditTimeSheetTimeTrackingSettings Component', () => {
  const mockSetValue = jest.fn();
  const mockTrack = jest.fn();
  const mockIntl = {
    formatMessage: jest.fn(({ id }) => id),
  };

  beforeEach(() => {
    (useFormContext as jest.Mock).mockReturnValue({
      setValue: mockSetValue,
      control: {},
    });
    (useIntl as jest.Mock).mockReturnValue(mockIntl);

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
    useTracking.mockReturnValue(mockTrack);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    expect(
      screen.getByText((content, element) =>
        content.includes('location-settings.fields.timesheet-settings-service'),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content, element) =>
        content.includes(
          'location-settings.fields.timesheet-settings-billable',
        ),
      ),
    ).toBeInTheDocument();
  });

  test('does not render a popover dialog', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('toggles service field switch', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    const serviceSwitch = screen.getByLabelText('serviceFieldEnableSwitch');
    fireEvent.click(serviceSwitch);
    expect(mockSetValue).toHaveBeenCalledWith('isServiceFieldEnabled', false, {
      shouldDirty: true,
    });
  });

  test('toggles billable field switch', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    const billableSwitch = screen.getByLabelText('billableFieldEnableSwitch');
    fireEvent.click(billableSwitch);
    expect(mockSetValue).toHaveBeenCalledWith('isBillingFieldEnabled', false, {
      shouldDirty: true,
    });
  });

  test('handles checkbox interactions', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]); // Assuming the third checkbox is the one you want to test
    expect(mockSetValue).toHaveBeenCalled();
  });

  test('handles different useWatch values', () => {
    (useWatch as jest.Mock).mockReturnValueOnce(false);
    render(<EditTimeSheetTimeTrackingSettings />);
  });

  test('renders help icons for service, billable, and bill rate labels', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    expect(document.getElementById('service_icon')).toBeInTheDocument();
    expect(document.getElementById('billable_icon')).toBeInTheDocument();
    expect(document.getElementById('billable_rate_icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('ids-tooltip')).toHaveLength(3);
  });

  // New tests for tracking functionality
  test('tracks service field switch with disabled action when value is true', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    const serviceSwitch = screen.getByLabelText('serviceFieldEnableSwitch');
    fireEvent.click(serviceSwitch);

    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        ui_action: 'disabled',
      }),
    );
  });

  test('tracks billable field switch with disabled action when value is true', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    const billableSwitch = screen.getByLabelText('billableFieldEnableSwitch');
    fireEvent.click(billableSwitch);

    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        ui_action: 'disabled',
      }),
    );
  });

  test('tracks billing rate checkbox with disabled action when value is true', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]); // Billing rate checkbox

    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        ui_action: 'disabled',
      }),
    );
  });
});

// Separate describe block for testing the 'enabled' case
describe('EditTimeSheetTimeTrackingSettings Component - Enabled Tracking', () => {
  const mockSetValue = jest.fn();
  const mockTrack = jest.fn();
  const mockIntl = {
    formatMessage: jest.fn(({ id }) => id),
  };

  beforeEach(() => {
    // Override the react-hook-form mock for this test suite to return false values
    const reactHookForm = require('react-hook-form');
    reactHookForm.Controller = ({
      render,
      name,
    }: {
      render: any;
      name: string;
    }) => (
      <div>
        {render({
          field: {
            onChange: jest.fn(),
            onBlur: jest.fn(),
            name,
            value: false, // Set to false to test 'enabled' case
            ref: jest.fn(),
          },
          fieldState: {
            invalid: false,
            isTouched: false,
            isDirty: false,
            isValidating: false,
          },
        })}
      </div>
    );

    (useFormContext as jest.Mock).mockReturnValue({
      setValue: mockSetValue,
      control: {},
    });
    (useIntl as jest.Mock).mockReturnValue(mockIntl);

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
    useTracking.mockReturnValue(mockTrack);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('tracks service field switch with enabled action when value is false', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    const serviceSwitch = screen.getByLabelText('serviceFieldEnableSwitch');
    fireEvent.click(serviceSwitch);

    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        ui_action: 'enabled',
      }),
    );
  });

  test('tracks billable field switch with enabled action when value is false', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    const billableSwitch = screen.getByLabelText('billableFieldEnableSwitch');
    fireEvent.click(billableSwitch);

    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        ui_action: 'enabled',
      }),
    );
  });

  test('tracks billing rate checkbox with enabled action when value is false', () => {
    render(<EditTimeSheetTimeTrackingSettings />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]); // Billing rate checkbox

    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        ui_action: 'enabled',
      }),
    );
  });
});
