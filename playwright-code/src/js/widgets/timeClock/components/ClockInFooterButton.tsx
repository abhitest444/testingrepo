import React from 'react';
import { useIntl } from '@payroll/quicksand';
import Button from '@ids-ts/button';
import { CircleClock } from '@design-systems/icons';
import { useSubmitTimeDatesContext } from '../../common/submitTimeDates/SubmitTimeDatesProvider';
import { getTimeClockMaxDate } from '../utils/timeClockUtils';

export interface ClockInFooterButtonProps {
  timezone: string;
  disabled: boolean;
  onClick: () => void;
}

/**
 * Clock In footer button. Rendered inside SubmitTimeDatesProvider so it can read
 * the submit-time lock: when every date within the clock-in window (up to
 * "today") is already submitted, there is nothing to clock in against, so the
 * button is disabled. No-op outside Workforce (no lock => never disabled here).
 */
export const ClockInFooterButton: React.FC<ClockInFooterButtonProps> = ({
  timezone,
  disabled,
  onClick,
}) => {
  const intl = useIntl();
  const { minSelectableDate, loading } = useSubmitTimeDatesContext();
  // While the submit-time fetch is in flight `minSelectableDate` is undefined,
  // so keep the button disabled until it resolves — otherwise the worker could
  // clock in against a locked day before the lock is known. On fetch failure we
  // fail open (same contract as the Date/WeekNavigator calendars): `error` is
  // not consulted and the server still rejects a submitted clock-in.
  const isSubmitLocked = Boolean(
    minSelectableDate &&
      minSelectableDate.isAfter(getTimeClockMaxDate(timezone)),
  );

  return (
    <Button
      purpose="standard"
      onClick={onClick}
      disabled={disabled || loading || isSubmitLocked}
      data-test-id="time-clock-in-button"
    >
      <CircleClock />
      {intl.formatMessage({ id: 'timeclock.clockIn' })}
    </Button>
  );
};

export default ClockInFooterButton;
