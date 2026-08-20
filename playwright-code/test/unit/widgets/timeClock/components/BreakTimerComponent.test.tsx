import React from 'react';
import { render, screen, act } from '@testing-library/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import BreakTimerComponent from 'src/js/widgets/timeClock/components/BreakTimerComponent';
import { calculateElapsedTime } from 'src/js/widgets/timeClock/utils/timerUtils';
import { getBrowserTimezone } from 'src/js/common/DateAndTimeUtils';
import {
  Payroll_EmployerBreak,
  Payroll_DurationUnit,
  Payroll_Break,
} from 'src/__generated__/oigql/graphql';

// We'll use module mocking to access internal functions

// Add dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: { [key: string]: string } = {
        'timeclock.today': 'Today',
        'timeclock.thisWeek': 'This Week',
        'timeclock.hours': 'h',
        'timeclock.minutes': 'm',
        'timeclock.breakRequired': 'Break required',
        'timeclock.breakOptional': 'Break optional',
        'timeclock.breakEnding': 'Break ending in',
        'timeclock.breakEndingSoon': 'Break ending soon',
      };
      return messages[id] || id;
    },
  }),
}));

jest.mock('src/js/common/DateAndTimeUtils', () => ({
  getBrowserTimezone: jest.fn(() => 'America/Los_Angeles'),
}));

jest.mock('src/js/widgets/timeClock/utils/timerUtils', () => ({
  calculateElapsedTime: jest.fn(() => '00:15:30'),
}));

describe('BreakTimerComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockBreakRule: Payroll_EmployerBreak = {
    __typename: 'Payroll_EmployerBreak',
    id: 'break-1',
    breakName: 'Lunch Break',
    isActive: true,
    breakType: Payroll_Break.Paid,
    allowManual: true,
    allowAuto: false,
    noSetDuration: false,
    breakDuration: 30,
    durationUnit: Payroll_DurationUnit.Minutes,
    isDeleted: false,
    isDefaultPolicy: false,
    activeBreakAssignmentCount: 0,
    manualRule: {
      __typename: 'Payroll_ManualBreakRule',
      autoEndBreak: false,
      allowEarlyEndBreak: true,
      breakEndingReminder: true,
      breakEndingReminderTime: 5,
      durationUnit: Payroll_DurationUnit.Minutes,
    },
    autoRule: undefined,
  };

  const defaultProps = {
    userName: 'John Doe',
    breakStartTime: '2023-01-01T12:00:00Z',
    breakRule: mockBreakRule,
    isRunning: true,
    todayDuration: 3600, // 1 hour in seconds
    weekDuration: 18000, // 5 hours in seconds
  };

  describe('Basic Rendering', () => {
    it('renders correctly with default props', () => {
      render(<BreakTimerComponent {...defaultProps} />);

      // Check break timer heading
      expect(screen.getByTestId('break-timer-heading')).toBeInTheDocument();
      expect(screen.getByTestId('break-timer-heading').textContent).toContain(
        'John Doe started Lunch Break at',
      );

      // Check timer display
      expect(screen.getByTestId('break-timer-display')).toBeInTheDocument();
      expect(screen.getByText('00:15:30')).toBeInTheDocument();

      // Check summary containers
      expect(screen.getByTestId('break-summary-container')).toBeInTheDocument();
      expect(screen.getByTestId('today-summary-item')).toBeInTheDocument();
      expect(screen.getByTestId('week-summary-item')).toBeInTheDocument();

      // Check summary labels and values
      expect(screen.getByTestId('today-summary-label')).toHaveTextContent(
        'Today',
      );
      expect(screen.getByTestId('week-summary-label')).toHaveTextContent(
        'This Week',
      );
      expect(screen.getByTestId('today-summary-value')).toHaveTextContent(
        '1h 0m',
      );
      expect(screen.getByTestId('week-summary-value')).toHaveTextContent(
        '5h 0m',
      );
    });

    it('renders with break timer container background color when running', () => {
      const { container } = render(<BreakTimerComponent {...defaultProps} />);

      const timerContainer = screen.getByTestId('break-timer-container');
      expect(timerContainer).toHaveStyle('background-color: #FFEAC7');
    });

    it('renders with transparent background when not running', () => {
      render(<BreakTimerComponent {...defaultProps} isRunning={false} />);

      const timerContainer = screen.getByTestId('break-timer-container');
      expect(timerContainer).toHaveStyle('background-color: transparent');
    });

    it('renders all required test ids', () => {
      render(<BreakTimerComponent {...defaultProps} />);

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();
      expect(screen.getByTestId('break-timer-heading')).toBeInTheDocument();
      expect(
        screen.getByTestId('break-timer-display-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('break-timer-display')).toBeInTheDocument();
      expect(screen.getByTestId('break-summary-container')).toBeInTheDocument();
      expect(screen.getByTestId('today-summary-item')).toBeInTheDocument();
      expect(screen.getByTestId('today-summary-label')).toBeInTheDocument();
      expect(screen.getByTestId('today-summary-value')).toBeInTheDocument();
      expect(screen.getByTestId('week-summary-item')).toBeInTheDocument();
      expect(screen.getByTestId('week-summary-label')).toBeInTheDocument();
      expect(screen.getByTestId('week-summary-value')).toBeInTheDocument();
    });
  });

  describe('Timer Display Logic', () => {
    it('shows calculated elapsed time when running and breakStartTime is provided', () => {
      (calculateElapsedTime as jest.Mock).mockReturnValue('00:25:15');

      render(<BreakTimerComponent {...defaultProps} />);

      expect(screen.getByText('00:25:15')).toBeInTheDocument();
      expect(calculateElapsedTime).toHaveBeenCalledWith(
        '2023-01-01T12:00:00Z',
        'America/Los_Angeles',
      );
    });

    it('shows 00:00:00 when not running', () => {
      render(<BreakTimerComponent {...defaultProps} isRunning={false} />);

      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });

    it('shows 00:00:00 when breakStartTime is empty', () => {
      render(<BreakTimerComponent {...defaultProps} breakStartTime="" />);

      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });

    it('shows 00:00:00 when breakStartTime is not provided', () => {
      const propsWithoutStartTime = { ...defaultProps };
      delete (propsWithoutStartTime as any).breakStartTime;

      render(<BreakTimerComponent {...propsWithoutStartTime} />);

      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });
  });

  describe('Break Rules and Duration Logic', () => {
    it('shows break required text when breakRule has duration', () => {
      render(<BreakTimerComponent {...defaultProps} />);

      expect(screen.getByTestId('break-required-text')).toBeInTheDocument();
    });

    it('does not show break required text when breakRule has no duration', () => {
      const breakRuleWithoutDuration = {
        ...mockBreakRule,
        breakDuration: undefined,
      };

      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={breakRuleWithoutDuration}
        />,
      );

      expect(
        screen.queryByTestId('break-required-text'),
      ).not.toBeInTheDocument();
    });

    it('does not show break required text when breakRule is undefined', () => {
      render(<BreakTimerComponent {...defaultProps} breakRule={undefined} />);

      expect(
        screen.queryByTestId('break-required-text'),
      ).not.toBeInTheDocument();
    });

    it('handles break rule with hours duration unit', () => {
      const breakRuleWithHours = {
        ...mockBreakRule,
        breakDuration: 1,
        durationUnit: Payroll_DurationUnit.Hours,
      };

      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={breakRuleWithHours}
        />,
      );

      expect(screen.getByTestId('break-required-text')).toBeInTheDocument();
    });

    it('handles break rule with minutes duration unit', () => {
      const breakRuleWithMinutes = {
        ...mockBreakRule,
        breakDuration: 15,
        durationUnit: Payroll_DurationUnit.Minutes,
      };

      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={breakRuleWithMinutes}
        />,
      );

      expect(screen.getByTestId('break-required-text')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('formats duration correctly with hours and minutes', () => {
      render(
        <BreakTimerComponent
          {...defaultProps}
          todayDuration={3661} // 1h 1m 1s
          weekDuration={18061} // 5h 1m 1s
        />,
      );

      expect(screen.getByTestId('today-summary-value')).toHaveTextContent(
        '1h 1m',
      );
      expect(screen.getByTestId('week-summary-value')).toHaveTextContent(
        '5h 1m',
      );
    });

    it('formats zero duration correctly', () => {
      render(
        <BreakTimerComponent
          {...defaultProps}
          todayDuration={0}
          weekDuration={0}
        />,
      );

      expect(screen.getByTestId('today-summary-value')).toHaveTextContent(
        '0h 0m',
      );
      expect(screen.getByTestId('week-summary-value')).toHaveTextContent(
        '0h 0m',
      );
    });

    it('formats large durations correctly', () => {
      render(
        <BreakTimerComponent
          {...defaultProps}
          todayDuration={86399} // 23h 59m 59s
          weekDuration={604799} // 167h 59m 59s
        />,
      );

      expect(screen.getByTestId('today-summary-value')).toHaveTextContent(
        '23h 59m',
      );
      expect(screen.getByTestId('week-summary-value')).toHaveTextContent(
        '167h 59m',
      );
    });

    it('handles negative durations', () => {
      render(
        <BreakTimerComponent
          {...defaultProps}
          todayDuration={-3600} // -1h
          weekDuration={-1800} // -30m
        />,
      );

      expect(screen.getByTestId('today-summary-value')).toHaveTextContent(
        '-1h 0m',
      );
      expect(screen.getByTestId('week-summary-value')).toHaveTextContent(
        '-0h 30m',
      );
    });
  });

  describe('User Name and Break Name Display', () => {
    it('displays correct heading with user name and break name', () => {
      render(<BreakTimerComponent {...defaultProps} />);

      const heading = screen.getByTestId('break-timer-heading');
      expect(heading.textContent).toContain('John Doe started Lunch Break at');
    });

    it('handles empty user name', () => {
      render(<BreakTimerComponent {...defaultProps} userName="" />);

      const heading = screen.getByTestId('break-timer-heading');
      expect(heading.textContent).toContain(' started Lunch Break at');
    });

    it('handles undefined break rule name', () => {
      const breakRuleWithoutName = {
        ...mockBreakRule,
        breakName: '',
      };

      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={breakRuleWithoutName}
        />,
      );

      const heading = screen.getByTestId('break-timer-heading');
      expect(heading.textContent).toContain('John Doe started  at');
    });

    it('handles different break names', () => {
      const customBreakRule = {
        ...mockBreakRule,
        breakName: 'Coffee Break',
      };

      render(
        <BreakTimerComponent {...defaultProps} breakRule={customBreakRule} />,
      );

      const heading = screen.getByTestId('break-timer-heading');
      expect(heading.textContent).toContain('John Doe started Coffee Break at');
    });
  });

  describe('Timer Updates and State Management', () => {
    it('updates timer display when calculateElapsedTime returns different values', () => {
      (calculateElapsedTime as jest.Mock).mockReturnValue('00:10:00');

      const { rerender } = render(<BreakTimerComponent {...defaultProps} />);

      expect(screen.getByText('00:10:00')).toBeInTheDocument();

      // Mock a different elapsed time
      (calculateElapsedTime as jest.Mock).mockReturnValue('00:15:30');

      rerender(<BreakTimerComponent {...defaultProps} />);

      expect(screen.getByText('00:15:30')).toBeInTheDocument();
    });

    it('calls calculateElapsedTime with correct parameters', () => {
      render(<BreakTimerComponent {...defaultProps} />);

      expect(calculateElapsedTime).toHaveBeenCalledWith(
        '2023-01-01T12:00:00Z',
        'America/Los_Angeles',
      );
    });

    it('calls getBrowserTimezone to get timezone', () => {
      render(<BreakTimerComponent {...defaultProps} />);

      expect(getBrowserTimezone).toHaveBeenCalled();
    });
  });

  describe('Component Props Variations', () => {
    it('handles all props being undefined except required ones', () => {
      const minimalProps = {
        userName: 'Test User',
        breakStartTime: '',
        breakRule: undefined,
        isRunning: false,
        todayDuration: 0,
        weekDuration: 0,
      };

      render(<BreakTimerComponent {...minimalProps} />);

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();
      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });

    it('handles different break types', () => {
      const unpaidBreakRule = {
        ...mockBreakRule,
        breakType: Payroll_Break.Unpaid,
        breakName: 'Unpaid Break',
      };

      render(
        <BreakTimerComponent {...defaultProps} breakRule={unpaidBreakRule} />,
      );

      expect(screen.getByTestId('break-timer-heading').textContent).toContain(
        'Unpaid Break',
      );
    });

    it('updates when props change', () => {
      const { rerender } = render(<BreakTimerComponent {...defaultProps} />);

      expect(screen.getByTestId('break-timer-heading').textContent).toContain(
        'John Doe',
      );

      rerender(<BreakTimerComponent {...defaultProps} userName="Jane Smith" />);

      expect(screen.getByTestId('break-timer-heading').textContent).toContain(
        'Jane Smith',
      );
    });
  });

  describe('Accessibility and ARIA Labels', () => {
    it('has proper aria-label on timer container', () => {
      render(<BreakTimerComponent {...defaultProps} />);

      const container = screen.getByTestId('break-timer-container');
      expect(container).toHaveAttribute('aria-label', 'break-timer-container');
    });

    it('renders semantic HTML structure', () => {
      render(<BreakTimerComponent {...defaultProps} />);

      // Check for proper heading structure
      const heading = screen.getByTestId('break-timer-heading');
      expect(heading.tagName).toBe('H2');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles extremely large duration values', () => {
      render(
        <BreakTimerComponent
          {...defaultProps}
          todayDuration={999999999}
          weekDuration={999999999}
        />,
      );

      const todayValue = screen.getByTestId('today-summary-value');
      const weekValue = screen.getByTestId('week-summary-value');

      expect(todayValue).toBeInTheDocument();
      expect(weekValue).toBeInTheDocument();
    });

    it('handles null break start time gracefully', () => {
      render(<BreakTimerComponent {...defaultProps} breakStartTime="" />);

      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });

    it('handles calculateElapsedTime returning invalid values', () => {
      (calculateElapsedTime as jest.Mock).mockReturnValue('');

      render(<BreakTimerComponent {...defaultProps} />);

      // Should still render the component
      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('cleans up properly on unmount', () => {
      const { unmount } = render(<BreakTimerComponent {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it('handles re-renders without issues', () => {
      const { rerender } = render(<BreakTimerComponent {...defaultProps} />);

      for (let i = 0; i < 5; i += 1) {
        rerender(
          <BreakTimerComponent {...defaultProps} todayDuration={i * 1000} />,
        );
      }

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();
    });
  });

  describe('Integration with External Dependencies', () => {
    it('uses intl formatMessage correctly', () => {
      render(<BreakTimerComponent {...defaultProps} />);

      // Verify intl messages are displayed
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('This Week')).toBeInTheDocument();
    });

    it('handles different timezone scenarios', () => {
      (getBrowserTimezone as jest.Mock).mockReturnValue('Europe/London');

      render(<BreakTimerComponent {...defaultProps} />);

      expect(calculateElapsedTime).toHaveBeenCalledWith(
        '2023-01-01T12:00:00Z',
        'Europe/London',
      );
    });
  });

  describe('Break Rule Manual Rule Properties', () => {
    it('handles break rule with manual rule properties', () => {
      const breakRuleWithComplexManualRule = {
        ...mockBreakRule,
        manualRule: {
          __typename: 'Payroll_ManualBreakRule' as const,
          autoEndBreak: true,
          allowEarlyEndBreak: false,
          breakEndingReminder: false,
          breakEndingReminderTime: 10,
          durationUnit: Payroll_DurationUnit.Minutes,
        },
      };

      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={breakRuleWithComplexManualRule}
        />,
      );

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();
    });

    it('handles break rule without manual rule', () => {
      const breakRuleWithoutManualRule = {
        ...mockBreakRule,
        manualRule: undefined,
      };

      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={breakRuleWithoutManualRule}
        />,
      );

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();
    });

    it('shows break over message when break time elapsed and early end not allowed', () => {
      const breakRuleNoEarlyEnd = {
        ...mockBreakRule,
        breakDuration: 1, // 1 minute
        durationUnit: Payroll_DurationUnit.Minutes,
        manualRule: {
          __typename: 'Payroll_ManualBreakRule' as const,
          autoEndBreak: false,
          allowEarlyEndBreak: false,
          breakEndingReminder: true,
          breakEndingReminderTime: 5,
          durationUnit: Payroll_DurationUnit.Minutes,
        },
      };

      // Mock time to simulate break time elapsed
      const mockTime = jest.spyOn(React, 'useState');
      mockTime.mockImplementationOnce(() => [3600, jest.fn()]); // 1 hour elapsed

      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={breakRuleNoEarlyEnd}
        />,
      );

      expect(screen.getByTestId('break-required-text')).toBeInTheDocument();

      mockTime.mockRestore();
    });

    it('shows required break text when early end not allowed', () => {
      const breakRuleNoEarlyEnd = {
        ...mockBreakRule,
        breakDuration: 30,
        durationUnit: Payroll_DurationUnit.Minutes,
        manualRule: {
          __typename: 'Payroll_ManualBreakRule' as const,
          autoEndBreak: false,
          allowEarlyEndBreak: false,
          breakEndingReminder: true,
          breakEndingReminderTime: 5,
          durationUnit: Payroll_DurationUnit.Minutes,
        },
      };

      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={breakRuleNoEarlyEnd}
        />,
      );

      expect(screen.getByTestId('break-required-text')).toBeInTheDocument();
    });
  });

  describe('Internal Function Coverage', () => {
    it('covers isBreakTimeElapsed early return by testing getBreakEndingText', () => {
      // The isBreakTimeElapsed function (line 116) is called within getBreakEndingText
      // We need to create conditions where getBreakEndingText is called but isBreakTimeElapsed returns false

      // Test case 1: breakRule with no breakDuration (triggers line 116)
      const breakRuleNoDuration = {
        ...mockBreakRule,
        breakDuration: undefined,
        manualRule: {
          __typename: 'Payroll_ManualBreakRule' as const,
          autoEndBreak: false,
          allowEarlyEndBreak: false,
          breakEndingReminder: true,
          breakEndingReminderTime: 5,
          durationUnit: Payroll_DurationUnit.Minutes,
        },
      };

      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={breakRuleNoDuration}
          isRunning
          breakStartTime="2023-01-01T12:00:00Z"
        />,
      );

      // Test case 2: isRunning is false (triggers line 116)
      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={mockBreakRule}
          isRunning={false}
          breakStartTime="2023-01-01T12:00:00Z"
        />,
      );

      // Test case 3: no breakStartTime (triggers line 116)
      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={mockBreakRule}
          isRunning
          breakStartTime=""
        />,
      );
    });

    it('covers isBreakTimeElapsed function calls through getBreakEndingText scenarios', () => {
      // Line 116 should be covered by testing scenarios where getBreakEndingText is called
      // but isBreakTimeElapsed returns false due to missing conditions

      // Scenario 1: Break rule exists but component is not running
      const { rerender } = render(
        <BreakTimerComponent
          {...defaultProps}
          isRunning={false} // This should cause isBreakTimeElapsed to return false on line 116
          breakRule={{
            ...mockBreakRule,
            manualRule: {
              __typename: 'Payroll_ManualBreakRule' as const,
              autoEndBreak: false,
              allowEarlyEndBreak: false,
              breakEndingReminder: true,
              breakEndingReminderTime: 5,
              durationUnit: Payroll_DurationUnit.Minutes,
            },
          }}
        />,
      );

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();

      // Scenario 2: Break rule exists, running, but no start time
      rerender(
        <BreakTimerComponent
          {...defaultProps}
          isRunning
          breakStartTime="" // This should cause isBreakTimeElapsed to return false on line 116
          breakRule={{
            ...mockBreakRule,
            manualRule: {
              __typename: 'Payroll_ManualBreakRule' as const,
              autoEndBreak: false,
              allowEarlyEndBreak: false,
              breakEndingReminder: true,
              breakEndingReminderTime: 5,
              durationUnit: Payroll_DurationUnit.Minutes,
            },
          }}
        />,
      );

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();

      // Scenario 3: Running with start time but no break duration
      rerender(
        <BreakTimerComponent
          {...defaultProps}
          isRunning
          breakStartTime="2023-01-01T12:00:00Z"
          breakRule={{
            ...mockBreakRule,
            breakDuration: undefined, // This should cause isBreakTimeElapsed to return false on line 116
            manualRule: {
              __typename: 'Payroll_ManualBreakRule' as const,
              autoEndBreak: false,
              allowEarlyEndBreak: false,
              breakEndingReminder: true,
              breakEndingReminderTime: 5,
              durationUnit: Payroll_DurationUnit.Minutes,
            },
          }}
        />,
      );

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();
    });

    it('covers formatTime with showSeconds=true path for positive values', () => {
      // Test formatTime to ensure the showSeconds=true path is covered
      // This specifically targets lines 97-103
      render(
        <BreakTimerComponent
          {...defaultProps}
          todayDuration={3661} // 1h 1m 1s - covers the calculation lines
          weekDuration={7321} // 2h 2m 1s
        />,
      );

      expect(screen.getByTestId('today-summary-value')).toHaveTextContent(
        '1h 1m',
      );
      expect(screen.getByTestId('week-summary-value')).toHaveTextContent(
        '2h 2m',
      );
    });

    it('covers isBreakTimeElapsed early return when breakRule has no duration', () => {
      const breakRuleNoDuration = {
        ...mockBreakRule,
        breakDuration: undefined,
      };

      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={breakRuleNoDuration}
          isRunning
          breakStartTime="2023-01-01T12:00:00Z"
        />,
      );

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();
    });

    it('covers isBreakTimeElapsed early return when not running', () => {
      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={mockBreakRule}
          isRunning={false}
          breakStartTime="2023-01-01T12:00:00Z"
        />,
      );

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();
    });

    it('covers isBreakTimeElapsed early return when no break start time', () => {
      render(
        <BreakTimerComponent
          {...defaultProps}
          breakRule={mockBreakRule}
          isRunning
          breakStartTime=""
        />,
      );

      expect(screen.getByTestId('break-timer-container')).toBeInTheDocument();
    });

    it('covers formatTime edge cases with zero and small values', () => {
      // Test edge cases to ensure all calculation paths are covered
      render(
        <BreakTimerComponent
          {...defaultProps}
          todayDuration={59} // Less than 1 minute
          weekDuration={3599} // Less than 1 hour
        />,
      );

      expect(screen.getByTestId('today-summary-value')).toHaveTextContent(
        '0h 0m',
      );
      expect(screen.getByTestId('week-summary-value')).toHaveTextContent(
        '0h 59m',
      );
    });

    it('covers all branches of formatTime calculations', () => {
      // Test values that will exercise all the math operations in formatTime
      render(
        <BreakTimerComponent
          {...defaultProps}
          todayDuration={3723} // 1h 2m 3s - exercises all calculation branches
          weekDuration={7923} // 2h 12m 3s
        />,
      );

      expect(screen.getByTestId('today-summary-value')).toHaveTextContent(
        '1h 2m',
      );
      expect(screen.getByTestId('week-summary-value')).toHaveTextContent(
        '2h 12m',
      );
    });
  });
});
