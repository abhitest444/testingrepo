import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '@ids-ts/button';
import styled from 'styled-components';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CircleClock, CircleClockFill, StopWatch } from '@design-systems/icons';
import { useIntl, useSandbox } from '@payroll/quicksand';
import {
  calculateElapsedTime,
  FUTURE_TIME,
} from 'src/js/widgets/timeClock/utils/timerUtils';
import { mapQBTimezoneToDayjsTimezone } from 'src/js/common/DateAndTimeUtils';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import {
  createCustomerInteraction,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

dayjs.extend(utc);
dayjs.extend(timezone);

// Style the button container
const StyledButton = styled(Button)`
  &&& {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`;

// Style the icon container
const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 8px;

  svg {
    width: 24px;
    height: 24px;
  }
`;

// Style the text container
const TextWrapper = styled.span`
  display: inline-block;
  line-height: 1;
`;

function TimeActionButton({
  disabled = false,
  text = 'Clock in',
  purpose = 'standard',
  priority = 'secondary',
  variant = 'circle-clock',
  startTime = null,
  onClick = () => {},
}) {
  const sandbox = useSandbox();
  const intl = useIntl();
  const [elapsedTime, setElapsedTime] = useState('');
  const { settingsData } = useCompanySettings();
  const companyTimezone = mapQBTimezoneToDayjsTimezone(
    settingsData?.timezone || '',
  );

  useEffect(() => {
    sandbox.logger.info(
      '[CLOCK_IN_FLOW] - TimeActionButton - TimeActionButton MOUNTED',
    );
  }, []);

  useEffect(() => {
    if (variant === 'circle-stopwatch' && startTime) {
      const updateTimer = () =>
        setElapsedTime(calculateElapsedTime(startTime, companyTimezone));
      updateTimer();
      const timerId = setInterval(updateTimer, 1000);
      return () => clearInterval(timerId);
    }
    return undefined;
  }, [startTime, variant, companyTimezone]);

  const getIcon = () => {
    switch (variant) {
      case 'circle-clock':
        return <CircleClock />;
      case 'circle-stopwatch':
        return <StopWatch />;
      case 'clock-in':
        return <CircleClockFill />;
      default:
        return null;
    }
  };

  const getButtonText = () => {
    if (variant === 'circle-stopwatch' && startTime) {
      return elapsedTime === FUTURE_TIME
        ? intl.formatMessage({ id: 'timeclock.clockIn' })
        : elapsedTime || '00:00:00';
    }
    return text;
  };

  const handleClick = () => {
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.TIME_ACTION_BUTTON_CLICK,
    );
    onClick();
  };

  return (
    <StyledButton
      onClick={handleClick}
      purpose={purpose}
      priority={priority}
      disabled={disabled}
      data-testid="time-action-button"
      aria-label="timeclock-action-button"
    >
      {variant !== 'text' && <IconWrapper>{getIcon()}</IconWrapper>}
      <TextWrapper>{getButtonText()}</TextWrapper>
    </StyledButton>
  );
}

TimeActionButton.propTypes = {
  disabled: PropTypes.bool,
  text: PropTypes.string,
  purpose: PropTypes.string,
  priority: PropTypes.string,
  variant: PropTypes.oneOf(['circle-clock', 'circle-stopwatch', 'text-only']),
  startTime: PropTypes.string,
  onClick: PropTypes.func,
};

TimeActionButton.defaultProps = {
  disabled: false,
  text: 'Clock in',
  purpose: 'standard',
  priority: 'secondary',
  variant: 'circle-clock',
  startTime: null,
  onClick: null,
};

export default TimeActionButton;
