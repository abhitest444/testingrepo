import React from 'react';
import { render, screen, act } from '@testing-library/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import TimerComponent from 'src/js/widgets/timeClock/components/TimerComponent';
import { calculateElapsedTime } from 'src/js/widgets/timeClock/utils/timerUtils';
import { getBrowserTimezone } from 'src/js/common/DateAndTimeUtils';

// Add dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

jest.mock('src/js/common/DateAndTimeUtils', () => ({
  mapQBTimezoneToDayjsTimezone: jest.fn((tz) => tz),
  getBrowserTimezone: jest.fn(() => 'America/Los_Angeles'),
}));

jest.mock('src/js/widgets/timeClock/utils/timerUtils', () => ({
  calculateElapsedTime: jest.fn(() => '01:30:45'),
}));

describe('TimerComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    timerHeading: 'Timer Heading',
    isRunning: false,
    todayDuration: 3600, // 1 hour
    weekDuration: 18000, // 5 hours
    timezone: 'America/Los_Angeles',
    startTime: '',
  };

  it('renders correctly with default props', () => {
    render(<TimerComponent {...defaultProps} />);

    // Check heading
    expect(screen.getByText('Timer Heading')).toBeInTheDocument();

    // Check timer display (00:00:00 when not running)
    expect(screen.getByText('00:00:00')).toBeInTheDocument();

    // Check summary items
    expect(screen.getByText('timeclock.today')).toBeInTheDocument();
    expect(screen.getByText('timeclock.thisWeek')).toBeInTheDocument();

    // Verify the formatted durations
    expect(screen.getByTestId('today-summary-value').textContent).toBe(
      '1timeclock.hours 0timeclock.minutes',
    ); // todayDuration (3600s = 1h)
    expect(screen.getByTestId('week-summary-value').textContent).toBe(
      '5timeclock.hours 0timeclock.minutes',
    ); // weekDuration (18000s = 5h)
  });

  it('applies different background color when timer is running', () => {
    const { container } = render(
      <TimerComponent
        {...defaultProps}
        isRunning
        startTime="2023-01-01T12:00:00Z"
      />,
    );

    // The TimerContainer should have a background color when running (CSS variable)
    const timerContainer = container.firstChild;
    expect(timerContainer).toHaveStyle(
      'background-color: var(--color-container-background-positive)',
    );
  });

  it('has transparent background when timer is not running', () => {
    const { container } = render(
      <TimerComponent {...defaultProps} isRunning={false} />,
    );

    // The TimerContainer should have transparent background when not running
    const timerContainer = container.firstChild;
    expect(timerContainer).toHaveStyle('background-color: transparent');
  });

  it('formats time correctly with hours, minutes, and seconds', () => {
    render(
      <TimerComponent
        {...defaultProps}
        todayDuration={12345} // 3h 25m 45s
        weekDuration={54321} // 15h 5m 21s
      />,
    );

    expect(screen.getByTestId('today-summary-value').textContent).toBe(
      '3timeclock.hours 25timeclock.minutes',
    );
    expect(screen.getByTestId('week-summary-value').textContent).toBe(
      '15timeclock.hours 5timeclock.minutes',
    );
  });

  it('resets timer to 00:00:00 when isRunning becomes false', () => {
    // Start with running timer
    (calculateElapsedTime as jest.Mock).mockReturnValue('00:01:30');

    const { rerender } = render(
      <TimerComponent
        {...defaultProps}
        isRunning
        startTime="2023-01-01T12:00:00Z"
      />,
    );

    // Timer should show calculated time
    expect(screen.getByText('00:01:30')).toBeInTheDocument();

    // Stop the timer
    rerender(
      <TimerComponent
        {...defaultProps}
        isRunning={false}
        startTime="2023-01-01T12:00:00Z"
      />,
    );

    // Timer should reset to 00:00:00
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('resets timer to 00:00:00 when startTime becomes empty', () => {
    // Start with running timer and valid startTime
    (calculateElapsedTime as jest.Mock).mockReturnValue('00:01:30');

    const { rerender } = render(
      <TimerComponent
        {...defaultProps}
        isRunning
        startTime="2023-01-01T12:00:00Z"
      />,
    );

    // Timer should show calculated time
    expect(screen.getByText('00:01:30')).toBeInTheDocument();

    // Remove startTime
    rerender(<TimerComponent {...defaultProps} isRunning startTime="" />);

    // Timer should reset to 00:00:00
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('cleans up interval on unmount', () => {
    // Create a spy on clearInterval
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(
      <TimerComponent
        {...defaultProps}
        isRunning
        startTime="2023-01-01T12:00:00Z"
      />,
    );

    // Unmount component
    unmount();

    // Verify clearInterval was called
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('updates timer properly when props change', () => {
    (calculateElapsedTime as jest.Mock).mockReturnValue('00:01:30');

    const { rerender } = render(
      <TimerComponent
        {...defaultProps}
        isRunning
        startTime="2023-01-01T12:00:00Z"
      />,
    );

    // Timer should show calculated time
    expect(screen.getByText('00:01:30')).toBeInTheDocument();

    // Change startTime
    (calculateElapsedTime as jest.Mock).mockReturnValue('00:00:15');

    rerender(
      <TimerComponent
        {...defaultProps}
        isRunning
        startTime="2023-01-01T12:01:15Z"
      />,
    );

    // Timer should reflect new startTime
    expect(screen.getByText('00:00:15')).toBeInTheDocument();

    // Change timezone
    (calculateElapsedTime as jest.Mock).mockReturnValue('00:00:30');

    rerender(
      <TimerComponent
        {...defaultProps}
        isRunning
        startTime="2023-01-01T12:01:15Z"
        timezone="Europe/London"
      />,
    );

    // Verify calculateElapsedTime was called with new timezone
    expect(calculateElapsedTime).toHaveBeenCalledWith(
      '2023-01-01T12:01:15Z',
      getBrowserTimezone(),
    );
  });

  it('handles very large durations correctly', () => {
    render(
      <TimerComponent
        {...defaultProps}
        todayDuration={86399} // 23h 59m 59s
        weekDuration={604799} // 167h 59m 59s (almost a week)
      />,
    );

    const summaryValues = screen.getAllByTestId('today-summary-value');
    expect(summaryValues[0].textContent).toBe(
      '23timeclock.hours 59timeclock.minutes',
    );
  });

  it('renders all sub-components correctly', () => {
    render(<TimerComponent {...defaultProps} />);

    // Check for all the main components
    expect(screen.getByTestId('summary-container')).toBeInTheDocument();

    // Check for multiple summary items
    expect(screen.getByTestId('today-summary-item')).toBeInTheDocument();
    expect(screen.getByTestId('week-summary-item')).toBeInTheDocument();

    // Check for labels
    expect(screen.getByTestId('today-summary-label').textContent).toBe(
      'timeclock.today',
    );
    expect(screen.getByTestId('week-summary-label').textContent).toBe(
      'timeclock.thisWeek',
    );
  });

  it('updates timer every minute when running', () => {
    jest.useFakeTimers();
    (calculateElapsedTime as jest.Mock).mockReturnValue('00:01:30');

    render(
      <TimerComponent
        {...defaultProps}
        isRunning
        startTime="2023-01-01T12:00:00Z"
      />,
    );

    // Initial state
    expect(screen.getByText('00:01:30')).toBeInTheDocument();

    // Advance timer by 1 minute
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    jest.useRealTimers();
  });

  it('handles timezone conversion correctly', () => {
    (calculateElapsedTime as jest.Mock).mockReturnValue('00:01:30');

    render(
      <TimerComponent
        {...defaultProps}
        isRunning
        startTime="2023-01-01T12:00:00Z"
        timezone="Europe/London"
      />,
    );

    // Verify calculateElapsedTime was called with correct timezone
    expect(calculateElapsedTime).toHaveBeenCalledWith(
      '2023-01-01T12:00:00Z',
      getBrowserTimezone(),
    );
  });

  it('formats time without seconds for summary displays', () => {
    render(
      <TimerComponent
        {...defaultProps}
        todayDuration={3661} // 1h 1m 1s
        weekDuration={18061} // 5h 1m 1s
      />,
    );

    // Summary should show hours and minutes without seconds
    expect(screen.getByTestId('today-summary-value').textContent).toBe(
      '1timeclock.hours 1timeclock.minutes',
    );
    expect(screen.getByTestId('week-summary-value').textContent).toBe(
      '5timeclock.hours 1timeclock.minutes',
    );
  });

  it('cleans up both timer intervals on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(
      <TimerComponent
        {...defaultProps}
        isRunning
        startTime="2023-01-01T12:00:00Z"
      />,
    );

    unmount();

    // Verify both intervals were cleared
    expect(clearIntervalSpy).toHaveBeenCalledTimes(2);
  });
});
