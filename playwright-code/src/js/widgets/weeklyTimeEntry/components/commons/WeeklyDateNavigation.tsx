import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import { B1 } from '@ids-ts/typography';
import { ChevronLeft, ChevronRight } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import { format, parse } from 'date-fns';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectCell } from '../../store/timeEntryGridSlice';
import {
  selectSelectedCell,
  selectWeekDates,
  selectVisibleDays,
  selectFirstDayOfWeek,
} from '../../store/selectors';

// Styled components for the navigation UI
const NavigationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
`;

const NavigationContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1;
`;

const DateText = styled(B1)`
  text-align: center;
`;

interface WeeklyDateNavigationProps {
  displayCell?: any;
}

export const WeeklyDateNavigation: React.FC<WeeklyDateNavigationProps> = ({
  displayCell,
}) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const selectedCell = useAppSelector(selectSelectedCell);
  const weekDates = useAppSelector(selectWeekDates);
  const visibleDays = useAppSelector(selectVisibleDays);
  const firstDayOfWeek = useAppSelector(selectFirstDayOfWeek);
  const track = useTracking();
  // Guard clause: return null if no dates available
  if (!weekDates?.length || !visibleDays?.length) return null;

  // Use selected cell or default to first visible cell for display
  const displayDayIdx = selectedCell ? selectedCell.dayIdx : visibleDays[0];
  const currentDate = weekDates[displayDayIdx];

  // Safety check: ensure we have a valid date string
  if (!currentDate || currentDate === '') {
    return null; // Don't render if no valid date
  }

  const date = parse(currentDate, 'yyyy-MM-dd', new Date());

  // Safety check: ensure the parsed date is valid
  if (Number.isNaN(date.getTime())) {
    return null; // Don't render if invalid date
  }

  const dayName = format(date, 'EEEE'); // Full day name (e.g., "Wednesday")
  const formattedDate = format(date, 'M/d'); // Month/day format (e.g., "3/12")

  /**
   * Handles navigation between dates when clicking left/right arrows
   * @param direction - 'left' to go to previous date, 'right' to go to next date
   */
  const handleNavigate = (direction: 'left' | 'right') => {
    // Guard clause: return if no cell is selected or no dates available
    if (!selectedCell || !weekDates.length || !visibleDays.length) return;

    // Get the current day index from the selected cell
    const currentDayIndex = selectedCell.dayIdx;

    // Find the current position in the visible days array
    const currentVisibleIndex = visibleDays.indexOf(currentDayIndex);
    if (currentVisibleIndex === -1) return; // Current day is not visible

    // Calculate the new visible index based on navigation direction
    const newVisibleIndex =
      direction === 'left'
        ? Math.max(currentVisibleIndex - 1, 0)
        : Math.min(currentVisibleIndex + 1, visibleDays.length - 1);

    // Get the new day index from the visible days array
    const newDayIndex = visibleDays[newVisibleIndex];

    // Only update if we're actually moving to a different date
    if (newDayIndex !== currentDayIndex) {
      // Track navigation only when actually moving to a different day
      track(trackingPoints.WEEKDAY_CHANGE);

      dispatch(
        selectCell({
          rowId: selectedCell.rowId,
          dayIdx: newDayIndex,
        }),
      );
    }
  };

  return (
    <NavigationContainer>
      <NavigationContent>
        {/* Left navigation button - disabled when at first visible date or no cell selected */}
        <IconControl
          onClick={() => handleNavigate('left')}
          disabled={
            !selectedCell || visibleDays.indexOf(selectedCell.dayIdx) <= 0
          }
          size="medium"
          aria-label={intl.formatMessage({
            id: 'weekly.time.entry.panel.navigate.previous.day',
          })}
        >
          <ChevronLeft />
        </IconControl>

        {/* Current date display */}
        <DateText weight="demi">{`${dayName} ${formattedDate}`}</DateText>

        {/* Right navigation button - disabled when at last visible date or no cell selected */}
        <IconControl
          onClick={() => handleNavigate('right')}
          disabled={
            !selectedCell ||
            visibleDays.indexOf(selectedCell.dayIdx) >= visibleDays.length - 1
          }
          size="medium"
          aria-label={intl.formatMessage({
            id: 'weekly.time.entry.panel.navigate.next.day',
          })}
        >
          <ChevronRight />
        </IconControl>
      </NavigationContent>
    </NavigationContainer>
  );
};
