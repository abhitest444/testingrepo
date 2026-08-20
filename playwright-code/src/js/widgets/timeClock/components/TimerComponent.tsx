import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { useIntl } from '@payroll/quicksand';
import { getBrowserTimezone } from 'src/js/common/DateAndTimeUtils';
import { calculateElapsedTime } from 'src/js/widgets/timeClock/utils/timerUtils';

const TIMER_RUNNING_COLOR =
  'var(--color-container-background-positive)'; /* (SemanticContextMatchOnly) */

const TimerContainer = styled.div<{ color?: string }>`
  border: 1px solid var(--color-container-border-secondary);
  border-radius: var(--radius-large); /* (SemanticContextMatchOnly) */
  padding-top: 20px;
  padding-bottom: 20px;
  text-align: center;
  background-color: ${(props) => props.color || 'transparent'};
`;

const TimerDisplayContainer = styled.div`
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const TimerHeading = styled.h2`
  margin: 0;
  font-size: var(--font-size-component-small);
  font-weight: var(--font-weight-component-bold);
`;

const TimerDisplay = styled.div`
  font-size: var(--font-size-display-4);
  color: var(--color-text-primary);
  font-weight: 800; /* (NoTokenFound) */
  font-family: var(--font-family-display); /* (SemanticContextMatchOnly) */
`;

const SummaryContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const SummaryLabel = styled.span`
  font-size: var(--font-size-component-x-small);
`;

const SummaryValue = styled.span`
  padding-left: 4px;
`;

interface TimerComponentProps {
  timerHeading: string;
  isRunning: boolean;
  todayDuration: number;
  weekDuration: number;
  timezone: string;
  startTime: string;
  component?: string;
}

const TimerComponent: React.FC<TimerComponentProps> = ({
  timerHeading,
  component,
  isRunning,
  todayDuration,
  weekDuration,
  startTime,
  timezone,
}) => {
  const intl = useIntl();
  const [time, setTime] = useState<number>(0);
  const [isNegativeTime, setIsNegativeTime] = useState<boolean>(false);
  const companyTimeZone = getBrowserTimezone();
  const formatTime = (
    seconds: number,
    showSeconds: boolean = true,
    forcePositive: boolean = false,
  ): string => {
    const absSeconds = Math.abs(seconds);
    const showNegative = !forcePositive && isNegativeTime && seconds < 0;

    if (showSeconds) {
      const hrs = String(Math.floor(absSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((absSeconds % 3600) / 60)).padStart(
        2,
        '0',
      );
      const secs = String(absSeconds % 60).padStart(2, '0');
      return `${showNegative ? '-' : ''}${hrs}:${mins}:${secs}`;
    }
    const hrs = Math.floor(absSeconds / 3600);
    const mins = Math.floor((absSeconds % 3600) / 60);

    return `${showNegative ? '-' : ''}${hrs}${intl.formatMessage({
      id: 'timeclock.hours',
    })} ${mins}${intl.formatMessage({ id: 'timeclock.minutes' })}`;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && startTime) {
      const updateTimer = () => {
        const elapsedTimeStr = calculateElapsedTime(startTime, companyTimeZone);
        const isNegative = elapsedTimeStr.startsWith('-');
        const timeStr = isNegative
          ? elapsedTimeStr.substring(1)
          : elapsedTimeStr;
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        setTime(isNegative ? -totalSeconds : totalSeconds);
        // Check if current time is less than start time
        setIsNegativeTime(isNegative);
      };
      // Update immediately to show current elapsed time
      updateTimer();
      // Then update every second
      timer = setInterval(updateTimer, 1000);
    } else if (!isRunning || !startTime) {
      setTime(0);
    }
    return () => {
      clearInterval(timer);
    };
  }, [startTime, isRunning, companyTimeZone]);

  const calculatedTodayDuration = todayDuration + time;
  const calculatedWeekDuration = weekDuration + time;

  return (
    <TimerContainer
      data-testid="timer-container"
      aria-label="timeclock-timer-container"
      color={isRunning && component !== 'clock-in' ? TIMER_RUNNING_COLOR : ''}
    >
      <TimerHeading data-testid="timer-heading">{timerHeading}</TimerHeading>
      <TimerDisplayContainer data-testid="timer-display-container">
        <TimerDisplay data-testid="timer-display">
          {formatTime(time)}
        </TimerDisplay>
        <SummaryContainer data-testid="summary-container">
          <SummaryItem data-testid="today-summary-item">
            <SummaryLabel data-testid="today-summary-label">
              {intl.formatMessage({ id: 'timeclock.today' })}
            </SummaryLabel>
            :
            <SummaryValue data-testid="today-summary-value">
              {formatTime(calculatedTodayDuration, false, true)}
            </SummaryValue>
          </SummaryItem>
          <SummaryItem data-testid="week-summary-item">
            <SummaryLabel data-testid="week-summary-label">
              {intl.formatMessage({ id: 'timeclock.thisWeek' })}
            </SummaryLabel>
            :
            <SummaryValue data-testid="week-summary-value">
              {formatTime(calculatedWeekDuration, false, true)}
            </SummaryValue>
          </SummaryItem>
        </SummaryContainer>
      </TimerDisplayContainer>
    </TimerContainer>
  );
};

export default TimerComponent;
