import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useIntl } from '@payroll/quicksand';
import { useFormContext, Controller } from 'react-hook-form';
import { EditGeneralTimeTrackingSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeActivitySettings/generalTimeTrackingSettings/EditGeneralTimeTrackingSettings';

// Mock necessary hooks and components
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

jest.mock('react-hook-form', () => ({
  useFormContext: jest.fn(),
  Controller: ({ render, name }: { render: any; name: string }) => (
    <div>
      {render({
        field: {
          onChange: jest.fn((value) => {
            // This simulates the actual Controller behavior
            const mockEvent = { target: { value } };
            render({ field: { onChange: (e: any) => e(mockEvent) } });
          }),
          onBlur: jest.fn(),
          name,
          value: '0',
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
}));

jest.mock(
  'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm',
  () => ({
    DAYS_OF_WEEK: {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    },
  }),
);

jest.mock('@ids-ts/dropdown', () => ({
  __esModule: true,
  default: ({ onChange, value, children }: any) => (
    <select
      data-testid="mock-dropdown"
      value={value}
      onChange={(e) => {
        e.stopPropagation();
        onChange(e);
      }}
      aria-label="DaysOfWeekDropDown"
    >
      {children}
    </select>
  ),
  MenuItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

describe('EditGeneralTimeTrackingSettings Component', () => {
  const mockSetValue = jest.fn();
  const messages = {
    'location-settings.fields.general-settings': 'General Settings',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  };

  const mockIntl = {
    formatMessage: jest.fn(
      ({ id }: { id: keyof typeof messages }) => messages[id] || id,
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useIntl as jest.Mock).mockReturnValue(mockIntl);
    (useFormContext as jest.Mock).mockReturnValue({ setValue: mockSetValue });

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

  test('renders without crashing', () => {
    render(<EditGeneralTimeTrackingSettings />);
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  test('handles dropdown change correctly', () => {
    const mockOnChange = jest.fn();
    const mockSetValue = jest.fn();

    (useFormContext as jest.Mock).mockReturnValue({
      setValue: mockSetValue,
      control: {
        _fields: {
          firstDayOfWeek: {
            onChange: mockOnChange,
          },
        },
      },
    });

    render(<EditGeneralTimeTrackingSettings />);

    const dropdown = screen.getByTestId('mock-dropdown');
    const mockEvent = {
      target: { value: '1' },
      stopPropagation: jest.fn(),
    };

    // Simulate the dropdown change
    fireEvent.change(dropdown, mockEvent);

    // Verify setValue is called with correct parameters
    expect(mockSetValue).toHaveBeenCalledTimes(1);
    expect(mockSetValue).toHaveBeenCalledWith('firstDayOfWeek', '1', {
      shouldDirty: true,
    });
  });

  test('handles multiple dropdown changes correctly', () => {
    const mockOnChange = jest.fn();
    const mockSetValue = jest.fn();

    (useFormContext as jest.Mock).mockReturnValue({
      setValue: mockSetValue,
      control: {
        _fields: {
          firstDayOfWeek: {
            onChange: mockOnChange,
          },
        },
      },
    });

    render(<EditGeneralTimeTrackingSettings />);

    const dropdown = screen.getByTestId('mock-dropdown');

    // Simulate multiple changes
    const values = ['2', '3', '4'];
    values.forEach((value) => {
      const mockEvent = {
        target: { value },
        stopPropagation: jest.fn(),
      };
      fireEvent.change(dropdown, mockEvent);
    });

    // Verify each change was handled correctly
    expect(mockSetValue).toHaveBeenCalledTimes(3);

    values.forEach((value, index) => {
      expect(mockSetValue).toHaveBeenNthCalledWith(
        index + 1,
        'firstDayOfWeek',
        value,
        { shouldDirty: true },
      );
    });
  });

  test('formatMessage is called with correct IDs', () => {
    render(<EditGeneralTimeTrackingSettings />);
    expect(mockIntl.formatMessage).toHaveBeenCalledWith({
      id: 'location-settings.fields.general-settings',
    });
  });
});
