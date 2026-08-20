import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DurationFieldStandalone } from 'src/js/widgets/common/DurationFieldStandalone';
import { KeyboardNavigationProvider } from 'src/js/common/useKeyboardNavigation';

// Mock the intl hook
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

// Mock the DateAndTimeUtils
jest.mock('src/js/common/DateAndTimeUtils', () => ({
  secondsToDurationTimestamp: (seconds: number) => {
    if (seconds === 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);

    // Handle the case where minutes round up to 60
    if (minutes === 60) {
      const adjustedHours = hours + 1;
      return `${adjustedHours.toString().padStart(2, '0')}:00`;
    }

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}`;
  },
  hourMinStringToSecondsNumber: (time: string) => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 3600 + (minutes || 0) * 60;
  },
  formatDuration: (input: string) => {
    if (/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(input)) return input;
    if (/^\d{1,2}$/.test(input)) return `${input}:00`;
    return null;
  },
  isValidDurationFormat: (value: string) =>
    /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
  exceedsMaxDuration: (duration: string) => {
    const [hours, minutes] = duration.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes > 1000; // Lower threshold for testing
  },
}));

const renderWithKeyboardNavigation = (component: React.ReactElement) =>
  render(<KeyboardNavigationProvider>{component}</KeyboardNavigationProvider>);

describe('DurationFieldStandalone', () => {
  const defaultProps = {
    value: null,
    onChange: jest.fn(),
    setError: jest.fn(),
    label: 'Duration',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    renderWithKeyboardNavigation(<DurationFieldStandalone {...defaultProps} />);

    expect(screen.getByLabelText('Duration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('hh:mm')).toBeInTheDocument();
  });

  it('displays formatted value when provided', () => {
    renderWithKeyboardNavigation(
      <DurationFieldStandalone {...defaultProps} value={3661} />, // 01:01
    );

    expect(screen.getByDisplayValue('01:01')).toBeInTheDocument();
  });

  it('handles input changes', () => {
    renderWithKeyboardNavigation(<DurationFieldStandalone {...defaultProps} />);

    const input = screen.getByLabelText('Duration');
    fireEvent.change(input, { target: { value: '2:30' } });

    expect(input).toHaveValue('2:30');
  });

  it('validates and formats input on blur', async () => {
    const onChange = jest.fn();
    const setError = jest.fn();

    renderWithKeyboardNavigation(
      <DurationFieldStandalone
        {...defaultProps}
        onChange={onChange}
        setError={setError}
      />,
    );

    const input = screen.getByLabelText('Duration');
    fireEvent.change(input, { target: { value: '2:30' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(9000); // 2:30 in seconds
      expect(setError).toHaveBeenCalledWith(undefined);
    });
  });

  it('handles empty input', async () => {
    const onChange = jest.fn();
    const setError = jest.fn();

    renderWithKeyboardNavigation(
      <DurationFieldStandalone
        {...defaultProps}
        onChange={onChange}
        setError={setError}
      />,
    );

    const input = screen.getByLabelText('Duration');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(null);
      expect(setError).toHaveBeenCalledWith(undefined);
    });
  });

  it('shows error for invalid format', async () => {
    const setError = jest.fn();

    renderWithKeyboardNavigation(
      <DurationFieldStandalone {...defaultProps} setError={setError} />,
    );

    const input = screen.getByLabelText('Duration');
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith('duration.format.error');
    });
  });

  it('handles read-only state', () => {
    renderWithKeyboardNavigation(
      <DurationFieldStandalone {...defaultProps} isLocked />,
    );

    const input = screen.getByLabelText('Duration');
    expect(input).toHaveAttribute('readonly');
  });

  it('auto-focuses when isBreakField is true', () => {
    renderWithKeyboardNavigation(
      <DurationFieldStandalone {...defaultProps} isBreakField />,
    );

    const input = screen.getByLabelText('Duration');
    expect(input).toHaveFocus();
  });

  it('displays error text when provided', () => {
    renderWithKeyboardNavigation(
      <DurationFieldStandalone
        {...defaultProps}
        errorText="Invalid duration"
      />,
    );

    expect(screen.getByText('Invalid duration')).toBeInTheDocument();
  });

  it('handles custom key down events', () => {
    const onKeyDown = jest.fn();

    renderWithKeyboardNavigation(
      <DurationFieldStandalone {...defaultProps} onKeyDown={onKeyDown} />,
    );

    const input = screen.getByLabelText('Duration');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onKeyDown).toHaveBeenCalled();
  });

  it('applies custom width styling', () => {
    renderWithKeyboardNavigation(
      <DurationFieldStandalone {...defaultProps} width="300px" />,
    );

    const input = screen.getByLabelText('Duration');
    const container = input.closest('div');
    expect(container).toHaveStyle('width: 300px !important');
  });

  it('formats single digit input correctly', async () => {
    const onChange = jest.fn();
    const setError = jest.fn();

    renderWithKeyboardNavigation(
      <DurationFieldStandalone
        {...defaultProps}
        onChange={onChange}
        setError={setError}
      />,
    );

    const input = screen.getByLabelText('Duration');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(18000); // 5:00 in seconds
      expect(setError).toHaveBeenCalledWith(undefined);
    });
  });

  it('does not show internal validation errors when errorText is provided', async () => {
    const setError = jest.fn();

    renderWithKeyboardNavigation(
      <DurationFieldStandalone
        {...defaultProps}
        setError={setError}
        errorText="Custom error message"
      />,
    );

    const input = screen.getByLabelText('Duration');
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);

    // Should not call setError when errorText is provided
    await waitFor(() => {
      expect(setError).not.toHaveBeenCalled();
    });
  });

  it('displays duration in hh:mm format with leading zeros', () => {
    renderWithKeyboardNavigation(
      <DurationFieldStandalone {...defaultProps} value={720} />, // 12 minutes
    );

    expect(screen.getByDisplayValue('00:12')).toBeInTheDocument();
  });

  it('displays duration in hh:mm format for hours', () => {
    renderWithKeyboardNavigation(
      <DurationFieldStandalone {...defaultProps} value={3660} />, // 1 hour 1 minute
    );

    expect(screen.getByDisplayValue('01:01')).toBeInTheDocument();
  });

  it('shows error for duration exceeding max', async () => {
    const onChange = jest.fn();
    const setError = jest.fn();

    renderWithKeyboardNavigation(
      <DurationFieldStandalone
        {...defaultProps}
        onChange={onChange}
        setError={setError}
      />,
    );

    const input = screen.getByLabelText('Duration');
    fireEvent.change(input, { target: { value: '17:00' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith('work.max.duration');
    });
  });
});
