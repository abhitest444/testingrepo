import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import dayjs from 'dayjs';
import { useWatch } from 'react-hook-form';
import {
  FormattedDatePicker,
  FormattedDatePickerProps,
  ISO_DATE_FORMAT,
} from 'src/js/widgets/common/FormattedDatePicker';
import { renderWithQuicksandProvider } from '../../testUtils';

// Mock the DatePicker component to avoid theme-related issues
jest.mock('@ids-ts/date-picker', () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    onBlur,
    label,
    errorText,
    dateFormat,
    disabled,
    minDate,
    maxDate,
  }: {
    value: string;
    onChange: (e: any) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    label: string;
    errorText?: string;
    dateFormat?: string;
    disabled?: boolean;
    minDate?: string;
    maxDate?: string;
  }) => (
    // Simple mock implementation that renders an input with the necessary props
    <div data-testid="date-picker">
      <label>{label}</label>
      <input
        data-testid="date-input"
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-label={label}
        disabled={disabled}
        data-min-date={minDate ?? ''}
        data-max-date={maxDate ?? ''}
      />
      {errorText && <div data-testid="error-text">{errorText}</div>}
    </div>
  ),
}));

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
}));

describe('FormattedDatePicker', () => {
  let props: FormattedDatePickerProps;

  beforeEach(() => {
    (useWatch as jest.Mock).mockReturnValue(false); // Default to unlocked
    props = {
      value: dayjs('2023-10-01'),
      onChange: jest.fn(),
      setError: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial value', () => {
    renderWithQuicksandProvider(<FormattedDatePicker {...props} />);

    expect(screen.getByTestId('date-input')).toBeInTheDocument();
    expect(screen.getByText(/drawer.form.startDate.label/)).toBeInTheDocument();
  });

  it('renders correctly with error message', () => {
    renderWithQuicksandProvider(
      <FormattedDatePicker {...{ ...props, errorText: 'Error message' }} />,
    );

    expect(screen.getByTestId('error-text')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('calls onChange with correct date on blur', () => {
    renderWithQuicksandProvider(<FormattedDatePicker {...props} />);
    const input = screen.getByTestId('date-input');
    fireEvent.blur(input, { target: { value: '02/10/2023' } });
    expect(props.onChange).toHaveBeenCalled();
  });

  it('calls only onChange on blur in case of null value and not setError callback', () => {
    const modifiedProps = { ...props, setError: undefined };
    renderWithQuicksandProvider(<FormattedDatePicker {...modifiedProps} />);
    const input = screen.getByTestId('date-input');
    fireEvent.blur(input, { target: { value: '' } });
    expect(props.onChange).toHaveBeenCalled();
  });

  it('sets error message when input does not match date regex', () => {
    renderWithQuicksandProvider(<FormattedDatePicker {...props} />);
    const input = screen.getByTestId('date-input');
    fireEvent.blur(input, { target: { value: '45/167/2023' } });

    expect(props.setError).toHaveBeenCalledWith(
      expect.stringContaining('date.format.error'),
    );
  });

  test.each([
    {
      isLocked: true,
      description: 'input is disabled when isLocked is true',
      expectDisabled: true,
    },
    {
      isLocked: false,
      description: 'input is enabled when isLocked is false',
      expectDisabled: false,
    },
  ])('$description', ({ isLocked, expectDisabled }) => {
    (useWatch as jest.Mock).mockReturnValue(isLocked);

    renderWithQuicksandProvider(<FormattedDatePicker {...props} />);
    const input = screen.getByTestId('date-input');
    if (expectDisabled) {
      expect(input).toBeDisabled();
    } else {
      expect(input).not.toBeDisabled();
    }
  });

  test.each([
    {
      description: 'uses current date when value is undefined',
      value: undefined as any,
    },
    { description: 'uses current date when value is null', value: null as any },
  ])('should $description', ({ value }) => {
    renderWithQuicksandProvider(
      <FormattedDatePicker {...{ ...props, value }} />,
    );

    // Should render without crashing
    expect(screen.getByTestId('date-input')).toBeInTheDocument();

    // The input should have a value (today's date formatted)
    const input = screen.getByTestId('date-input') as HTMLInputElement;
    expect(input.value).toBeTruthy();
  });

  it('should handle invalid dayjs object gracefully', () => {
    const invalidDayjs = dayjs('invalid-date');
    const propsWithInvalidValue = {
      ...props,
      value: invalidDayjs,
    };

    renderWithQuicksandProvider(
      <FormattedDatePicker {...propsWithInvalidValue} />,
    );

    // Should render without crashing
    expect(screen.getByTestId('date-input')).toBeInTheDocument();

    // The input should have a value (fallback to current date)
    const input = screen.getByTestId('date-input') as HTMLInputElement;
    expect(input.value).toBeTruthy();
  });

  it('should not crash when value is undefined and onBlur is triggered', () => {
    const propsWithUndefinedValue = {
      ...props,
      value: undefined as any,
    };

    renderWithQuicksandProvider(
      <FormattedDatePicker {...propsWithUndefinedValue} />,
    );

    const input = screen.getByTestId('date-input');

    // Should not throw an error when blurring with undefined value
    expect(() => {
      fireEvent.blur(input, { target: { value: '01/01/2023' } });
    }).not.toThrow();

    // onChange should still be called
    expect(props.onChange).toHaveBeenCalled();
  });

  it('should format the fallback date correctly when value is undefined', () => {
    const propsWithUndefinedValue = {
      ...props,
      value: undefined as any,
    };

    renderWithQuicksandProvider(
      <FormattedDatePicker {...propsWithUndefinedValue} />,
    );

    const input = screen.getByTestId('date-input') as HTMLInputElement;

    // The value should be a properly formatted date string
    expect(input.value).toMatch(/^\d{2}\/\d{2}\/\d{4}$/); // MM/DD/YYYY format
  });

  // Tests for the new onChange functionality
  describe('onChange functionality', () => {
    it('calls onChange with correct date on input change', () => {
      renderWithQuicksandProvider(<FormattedDatePicker {...props} />);
      const input = screen.getByTestId('date-input');
      fireEvent.change(input, { target: { value: '02/10/2023' } });
      expect(props.onChange).toHaveBeenCalled();
    });

    it('calls onChange immediately when user types valid date', () => {
      renderWithQuicksandProvider(<FormattedDatePicker {...props} />);
      const input = screen.getByTestId('date-input');

      // Simulate typing a valid date
      fireEvent.change(input, { target: { value: '03/15/2023' } });

      expect(props.onChange).toHaveBeenCalledTimes(1);
      expect(props.onChange).toHaveBeenCalledWith(expect.any(Object)); // Should be called with a dayjs object
    });

    it('calls onChange and setError when user types invalid date', () => {
      renderWithQuicksandProvider(<FormattedDatePicker {...props} />);
      const input = screen.getByTestId('date-input');

      // Simulate typing an invalid date
      fireEvent.change(input, { target: { value: '45/167/2023' } });

      expect(props.onChange).toHaveBeenCalledTimes(1);
      expect(props.setError).toHaveBeenCalledWith(
        expect.stringContaining('date.format.error'),
      );
    });

    it('calls onChange but not setError when setError is undefined', () => {
      const propsWithoutSetError = { ...props, setError: undefined };
      renderWithQuicksandProvider(
        <FormattedDatePicker {...propsWithoutSetError} />,
      );
      const input = screen.getByTestId('date-input');

      // Simulate typing an invalid date
      fireEvent.change(input, { target: { value: '45/167/2023' } });

      expect(props.onChange).toHaveBeenCalledTimes(1);
      // setError should not be called since it's undefined
    });

    it('handles empty input value in onChange', () => {
      renderWithQuicksandProvider(<FormattedDatePicker {...props} />);
      const input = screen.getByTestId('date-input');

      // Simulate clearing the input
      fireEvent.change(input, { target: { value: '' } });

      expect(props.onChange).toHaveBeenCalledTimes(1);
    });

    it('handles edge cases gracefully in onChange event', () => {
      renderWithQuicksandProvider(<FormattedDatePicker {...props} />);
      const input = screen.getByTestId('date-input');

      // Test with empty string value (edge case)
      fireEvent.change(input, { target: { value: '' } });
      expect(props.onChange).toHaveBeenCalledTimes(1);

      // Test with valid value
      fireEvent.change(input, { target: { value: '01/01/2023' } });
      expect(props.onChange).toHaveBeenCalledTimes(2);
    });

    it('both onChange and onBlur work independently', () => {
      renderWithQuicksandProvider(<FormattedDatePicker {...props} />);
      const input = screen.getByTestId('date-input');

      // First trigger onChange
      fireEvent.change(input, { target: { value: '02/10/2023' } });
      expect(props.onChange).toHaveBeenCalledTimes(1);

      // Then trigger onBlur
      fireEvent.blur(input, { target: { value: '02/10/2023' } });
      expect(props.onChange).toHaveBeenCalledTimes(2);
    });

    it('only calls setError when error state changes', () => {
      renderWithQuicksandProvider(<FormattedDatePicker {...props} />);
      const input = screen.getByTestId('date-input');

      // First invalid date - should set error
      fireEvent.change(input, { target: { value: '45/167/2023' } });
      expect(props.setError).toHaveBeenCalledTimes(1);
      expect(props.setError).toHaveBeenCalledWith(
        expect.stringContaining('date.format.error'),
      );

      // Second invalid date - should NOT set error again (state hasn't changed)
      fireEvent.change(input, { target: { value: '99/99/9999' } });
      expect(props.setError).toHaveBeenCalledTimes(1); // Still only 1 call

      // Valid date - should clear error
      fireEvent.change(input, { target: { value: '01/01/2023' } });
      expect(props.setError).toHaveBeenCalledTimes(2); // Now 2 calls (set + clear)
      expect(props.setError).toHaveBeenCalledWith(undefined);

      // Another valid date - should NOT clear error again (no error to clear)
      fireEvent.change(input, { target: { value: '02/02/2023' } });
      expect(props.setError).toHaveBeenCalledTimes(2); // Still only 2 calls
    });
  });

  // Regression: @ids-ts/date-picker parses minDate/maxDate format-less via
  // moment, falling back to the browser-native Date() parser for localized
  // formats (e.g. DD/MM/YYYY). That is inconsistent across browsers (the lock
  // worked in Safari but not Chrome). These bounds must always be emitted as
  // locale-independent ISO 8601 so parsing is reliable everywhere.
  describe('min/max date bounds', () => {
    it('exposes ISO_DATE_FORMAT as YYYY-MM-DD', () => {
      expect(ISO_DATE_FORMAT).toBe('YYYY-MM-DD');
    });

    it('formats minDate and maxDate as ISO 8601 regardless of display format', () => {
      // Use a day-of-month > 12 so a DD/MM/YYYY string would be an invalid
      // month (the exact case that broke min-date parsing in Chrome).
      renderWithQuicksandProvider(
        <FormattedDatePicker
          {...props}
          minDate={dayjs('2026-05-13')}
          maxDate={dayjs('2026-05-27')}
        />,
      );

      const input = screen.getByTestId('date-input');
      expect(input).toHaveAttribute('data-min-date', '2026-05-13');
      expect(input).toHaveAttribute('data-max-date', '2026-05-27');
    });

    it('does not pass min/max bounds when they are omitted', () => {
      renderWithQuicksandProvider(<FormattedDatePicker {...props} />);

      const input = screen.getByTestId('date-input');
      expect(input).toHaveAttribute('data-min-date', '');
      expect(input).toHaveAttribute('data-max-date', '');
    });
  });
});
