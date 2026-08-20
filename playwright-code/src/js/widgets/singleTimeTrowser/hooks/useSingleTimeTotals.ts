import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useFormContext } from 'react-hook-form';
import { useCurrencyFormat } from 'src/js/service/utils/sandboxUtils';

// Extend dayjs with UTC and timezone plugins for proper time handling
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Custom hook to calculate and format time entry totals including duration and billing calculations
 * Handles both single-day and multi-day time entries
 * @returns Object containing formatted currency values, duration calculations, and billing information
 */
export const useSingleTimeTotals = () => {
  const formContext = useFormContext();

  // Extract form values for time entry calculations
  const {
    billable,
    billRate,
    startTime,
    endTime,
    breakDuration,
    duration,
    isExported,
    startDate,
    endDate,
  } = formContext.getValues();

  // Format the billing rate as currency
  const currencyRate = useCurrencyFormat(
    billRate != null ? parseFloat(Number(billRate).toFixed(2)) : 0,
  );

  // Calculate total amount based on duration and billing rate
  const durationTotalAmount = parseFloat(
    ((billRate * duration) / 3600).toFixed(2),
  );
  const durationCurrencyCalcAmount = useCurrencyFormat(durationTotalAmount);

  // Convert duration to hours and minutes
  const durationHours = Math.floor(duration / 3600);
  const durationMinutes = Math.floor((duration % 3600) / 60);

  let netDurationInSeconds = 0;

  /**
   * Checks if the timesheet entity should use the time entry calculation
   * @returns boolean indicating if calculation should be time entry or time activity based
   */
  const isTimeEntryCalculation = () =>
    isExported === false && endDate && startDate && startTime && endTime;

  /**
   * Calculates time entries duration in seconds, handling both single and multi-day time entries.
   * Returns 0 for invalid entries (end before start on same day).
   * @returns {number} Duration in seconds
   */
  const calculateTimeEntryDuration = () => {
    // Convert times to local timezone
    const startTimeLocal = dayjs(startTime).tz(dayjs.tz.guess(), true);
    const endTimeLocal = dayjs(endTime).tz(dayjs.tz.guess(), true);

    // Create final start and end times by combining dates with times
    // Use the same timezone for both start and end times
    const finalStartTime = dayjs(startDate)
      .tz(dayjs.tz.guess())
      .hour(startTimeLocal.hour())
      .minute(startTimeLocal.minute())
      .second(startTimeLocal.second());

    const finalEndTime = dayjs(endDate)
      .tz(dayjs.tz.guess())
      .hour(endTimeLocal.hour())
      .minute(endTimeLocal.minute())
      .second(endTimeLocal.second());

    // Return 0 if end time is before start time on the same day -> error case
    if (
      startDate.isSame(endDate, 'day') &&
      finalEndTime.isBefore(finalStartTime)
    ) {
      return 0;
    }

    // Calculate duration in seconds and subtract break duration
    return finalEndTime.diff(finalStartTime, 'seconds') - (breakDuration || 0);
  };

  /**
   * Calculates duration for time activities.
   * @returns number of seconds for the time activity duration
   */
  const calculateTimeActivityDuration = () => {
    // Convert times to local timezone and use startDate for day reference
    const startTimeLocal = dayjs(startDate)
      .hour(dayjs(startTime).hour())
      .minute(dayjs(startTime).minute())
      .second(dayjs(startTime).second())
      .tz(dayjs.tz.guess(), true);
    const endTimeLocal = dayjs(startDate)
      .hour(dayjs(endTime).hour())
      .minute(dayjs(endTime).minute())
      .second(dayjs(endTime).second())
      .tz(dayjs.tz.guess(), true);

    // Calculate initial duration in seconds
    const clockedInDurationInSeconds = endTimeLocal.diff(
      startTimeLocal,
      'seconds',
    );

    // If end time is before start time, it means the activity spans to next day
    // Add 24 hours (86400 seconds) to handle overnight entries
    const adjustedClockedInDurationInSeconds =
      clockedInDurationInSeconds < 0
        ? clockedInDurationInSeconds + 86400
        : clockedInDurationInSeconds;

    // Subtract break duration from total duration
    return adjustedClockedInDurationInSeconds - (breakDuration || 0);
  };

  // Calculate net duration based on whether it's a multi-day or single-day entry
  if (isTimeEntryCalculation()) {
    netDurationInSeconds = calculateTimeEntryDuration();
  } else if (startTime && endTime) {
    netDurationInSeconds = calculateTimeActivityDuration();
  }

  // Calculate and format billing amounts based on net duration
  const clockedInTotalAmount = parseFloat(
    ((billRate * netDurationInSeconds) / 3600).toFixed(2),
  );
  const clockedInCurrencyCalcAmount = useCurrencyFormat(clockedInTotalAmount);

  // Convert net duration to hours and minutes
  const clockedInHours = Math.floor(netDurationInSeconds / 3600);
  const clockedInMinutes = Math.floor((netDurationInSeconds % 3600) / 60);

  return {
    currencyRate,
    durationCurrencyCalcAmount,
    clockedInCurrencyCalcAmount,
    durationHours,
    durationMinutes,
    clockedInHours,
    clockedInMinutes,
    netDurationInSeconds,
    billable,
  };
};
