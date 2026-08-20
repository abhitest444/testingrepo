import React, { useRef } from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import dayjs from 'dayjs';
import { IconControl } from '@ids-ts/icon-control';
import { ChevronLeft, ChevronRight } from '@design-systems/icons';
import { B2, Demi } from '@ids-ts/typography';
import DatePicker, { ChangeEventType } from '@ids-ts/date-picker';
import { getDateFormat } from 'src/js/common/DateAndTimeUtils';
import { useSubmitTimeDatesContext } from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import { useAppDispatch, useAppSelector } from '../../store';
import { setDateRange } from '../../store/timeEntryGridSlice';
import {
  clearValidationError,
  clearSaveError,
  clearTimeEntriesError,
} from '../../store/validationSlice';
import { selectDateRange } from '../../store/selectors';
import { DateRangePickerContainer } from '../../styles/WeeklyTimeEntryHeader.styles';
import { WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS } from '../../utils/constants';

interface WeekNavigatorProps {
  onWeekChange?: (newDateRange: { start: string; end: string }) => void;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  onWeekChange,
}) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const sandbox = useSandbox();
  const { start, end } = useAppSelector(selectDateRange);
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const { minSelectableDate } = useSubmitTimeDatesContext();
  const dateFormat = getDateFormat(sandbox);

  // Keep week navigation consistent with the submit-time lock: if the entire
  // previous week ends before the first editable day, there is nothing to edit
  // there, so disable the back arrow (the calendar's minDate already blocks it).
  // Fail-open on fetch error (same contract as Date/ClockInFooterButton): when
  // `minSelectableDate` is undefined navigation stays open and the server
  // enforces the real lock.
  const isPrevWeekLocked = Boolean(
    minSelectableDate &&
      dayjs(start).subtract(1, 'day').isBefore(minSelectableDate, 'day'),
  );
  const navigateWeek = (direction: 'next' | 'prev') => {
    // Track week change navigation with ui_object as button
    track({
      ...trackingPoints.WEEK,
      ui_object: 'button',
    });
    const currentStartDate = dayjs(start);
    const newStartDate =
      direction === 'next'
        ? currentStartDate.add(1, 'week')
        : currentStartDate.subtract(1, 'week');

    const newDateRange = {
      start: newStartDate.startOf('week').format('YYYY-MM-DD'),
      end: newStartDate.endOf('week').format('YYYY-MM-DD'),
    };

    sandbox.logger.info(
      WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.USER_INTERACTIONS
        .DATE_RANGE_CHANGED_USING_WEEK_NAVIGATION,
      {
        newDateRange,
      },
    );

    if (onWeekChange) {
      onWeekChange(newDateRange);
    } else {
      dispatch(setDateRange(newDateRange));
    }

    // Clear validation errors when week changes
    dispatch(clearValidationError());
    dispatch(clearSaveError());
    dispatch(clearTimeEntriesError());
  };

  const handleDateChange = (e: ChangeEventType) => {
    // Track week change navigation with ui_object as dropdown
    track(trackingPoints.WEEK);
    const selectedDate = (e.target as HTMLInputElement)?.value;
    if (selectedDate) {
      const selectedDayjs = dayjs(selectedDate);
      const weekStart = selectedDayjs.startOf('week');
      const weekEnd = selectedDayjs.endOf('week');
      const newDateRange = {
        start: weekStart.format('YYYY-MM-DD'),
        end: weekEnd.format('YYYY-MM-DD'),
      };

      sandbox.logger.info(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.USER_INTERACTIONS
          .DATE_RANGE_CHANGED_USING_CALENDAR,
        {
          newDateRange,
        },
      );

      if (onWeekChange) {
        onWeekChange(newDateRange);
      } else {
        dispatch(setDateRange(newDateRange));
      }

      // Clear validation errors when week changes
      dispatch(clearValidationError());
      dispatch(clearSaveError());
      dispatch(clearTimeEntriesError());
    }
  };

  const formattedRange =
    start && end
      ? (() => {
          const startDate = dayjs(start);
          const endDate = dayjs(end);
          const startMonth = startDate.format('MMM D');
          const endMonth = endDate.format('MMM D, YYYY');

          // If start and end are in the same month, show "Jul 28 - 3, 2025"
          // If they're in different months, show "Jul 28 - Aug 3, 2025"
          if (
            startDate.month() === endDate.month() &&
            startDate.year() === endDate.year()
          ) {
            return `${startMonth} - ${endDate.format('D, YYYY')}`;
          }
          return `${startMonth} - ${endMonth}`;
        })()
      : intl.formatMessage({ id: 'weekly.time.entry.select.date.range' });

  return (
    <DateRangePickerContainer>
      <IconControl
        aria-label={intl.formatMessage({
          id: 'weekly.time.entry.previous.week',
        })}
        disabled={isPrevWeekLocked}
        onClick={() => {
          if (!isPrevWeekLocked) navigateWeek('prev');
        }}
      >
        <ChevronLeft />
      </IconControl>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <B2>
          <Demi>{formattedRange}</Demi>
        </B2>
      </div>
      <IconControl
        aria-label={intl.formatMessage({ id: 'weekly.time.entry.next.week' })}
        onClick={() => navigateWeek('next')}
      >
        <ChevronRight />
      </IconControl>
      <DatePicker
        id="weekly-date-input"
        onChange={handleDateChange}
        aria-hidden="true"
        minDate={minSelectableDate?.format(dateFormat.toUpperCase())}
      />
    </DateRangePickerContainer>
  );
};
