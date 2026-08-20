import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useIntl } from '@payroll/quicksand';
import { getBrowserTimezone } from 'src/js/common/DateAndTimeUtils';
import { calculateElapsedTime } from 'src/js/widgets/timeClock/utils/timerUtils';
import { Payroll_EmployerBreak } from 'src/__generated__/oigql/graphql';
import {
  BREAK_TIMER_RUNNING_COLOR,
  TimerContainer,
  TimerDisplayContainer,
  TimerHeading,
  TimerDisplay,
  SummaryContainer,
  SummaryItem,
  SummaryLabel,
  SummaryValue,
  BreakRequiredText,
} from '../styles/BreakTimerComponent.styled';

interface BreakTimerComponentProps {
  userName: string;
  breakStartTime: string;
  breakRule: Payroll_EmployerBreak | undefined;
  isRunning: boolean;
  todayDuration: number;
  weekDuration: number;
  showRequiredText?: boolean;
}

const BreakTimerComponent: React.FC<BreakTimerComponentProps> = ({
  userName,
  breakStartTime,
  breakRule,
  isRunning,
  todayDuration,
  weekDuration,
  showRequiredText = false,
}) => {
  const intl = useIntl();
  const [time, setTime] = useState<number>(0);
  const companyTimeZone = getBrowserTimezone();

  const formatTime = (seconds: number): string => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const hrs = Math.floor(absSeconds / 3600);
    const mins = Math.floor((absSeconds % 3600) / 60);

    return `${isNegative ? '-' : ''}${hrs}${intl.formatMessage({
      id: 'timeclock.hours',
    })} ${mins}${intl.formatMessage({ id: 'timeclock.minutes' })}`;
  };

  // Check if break duration has elapsed
  const isBreakTimeElapsed = (): boolean => {
    if (!breakRule?.breakDuration || !isRunning || !breakStartTime)
      return false;

    const breakDurationInSeconds =
      breakRule.breakDuration *
      (breakRule.durationUnit === 'HOURS' ? 3600 : 60);
    return time >= breakDurationInSeconds;
  };

  // Generate break ending text based on break rules
  const getBreakEndingText = (): string => {
    // Return empty string if no break rule or no manual rule is applied
    if (!breakRule?.breakDuration || !breakRule.manualRule) return '';

    // Check if break time has elapsed and early end is not allowed
    if (!breakRule.manualRule.allowEarlyEndBreak && isBreakTimeElapsed()) {
      return intl.formatMessage({ id: 'timeclock.breakOver' });
    }

    const duration = breakRule.breakDuration;
    const unit = breakRule.durationUnit?.toLowerCase() || 'minutes';
    const durationText = `${duration} ${unit}`;
    const requiredText = intl.formatMessage({ id: 'timeclock.required' });

    // If showRequiredText is true, always show required text
    if (showRequiredText) {
      return `${durationText} ${requiredText}`;
    }

    if (breakRule.manualRule.autoEndBreak) {
      const autoEndText = intl.formatMessage({
        id: 'timeclock.breakWillAutoEndIn',
      });
      return `${durationText} ${requiredText}. ${autoEndText} ${durationText}`;
    }

    if (!breakRule.manualRule.allowEarlyEndBreak) {
      return `${durationText} ${requiredText}`;
    }

    return '';
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && breakStartTime) {
      const updateTimer = () => {
        const elapsedTimeStr = calculateElapsedTime(
          breakStartTime,
          companyTimeZone,
        );
        const [hours, minutes, seconds] = elapsedTimeStr.split(':').map(Number);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        setTime(totalSeconds);
      };
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else if (!isRunning || !breakStartTime) {
      setTime(0);
    }
    return () => {
      clearInterval(timer);
    };
  }, [breakStartTime, isRunning, companyTimeZone]);

  // Format the start time for display
  const formattedStartTime = breakStartTime
    ? dayjs(breakStartTime.split('T')[1].split('-')[0], 'HH:mm:ss').format(
        'h:mm A',
      )
    : '';

  const timerHeading = `${userName} started ${breakRule?.breakName} at ${formattedStartTime}`;

  return (
    <TimerContainer
      data-testid="break-timer-container"
      aria-label="break-timer-container"
      color={isRunning ? BREAK_TIMER_RUNNING_COLOR : ''}
    >
      <TimerHeading data-testid="break-timer-heading">
        {timerHeading}
      </TimerHeading>
      <TimerDisplayContainer data-testid="break-timer-display-container">
        <TimerDisplay data-testid="break-timer-display">
          {isRunning && breakStartTime
            ? calculateElapsedTime(breakStartTime, companyTimeZone)
            : '00:00:00'}
        </TimerDisplay>
        <SummaryContainer data-testid="break-summary-container">
          <SummaryItem data-testid="today-summary-item">
            <SummaryLabel data-testid="today-summary-label">
              {intl.formatMessage({ id: 'timeclock.today' })}
            </SummaryLabel>
            :
            <SummaryValue data-testid="today-summary-value">
              {formatTime(todayDuration)}
            </SummaryValue>
          </SummaryItem>
          <SummaryItem data-testid="week-summary-item">
            <SummaryLabel data-testid="week-summary-label">
              {intl.formatMessage({ id: 'timeclock.thisWeek' })}
            </SummaryLabel>
            :
            <SummaryValue data-testid="week-summary-value">
              {formatTime(weekDuration)}
            </SummaryValue>
          </SummaryItem>
        </SummaryContainer>
        {breakRule?.breakDuration && (
          <BreakRequiredText data-testid="break-required-text">
            {getBreakEndingText()}
          </BreakRequiredText>
        )}
      </TimerDisplayContainer>
    </TimerContainer>
  );
};

export default BreakTimerComponent;
