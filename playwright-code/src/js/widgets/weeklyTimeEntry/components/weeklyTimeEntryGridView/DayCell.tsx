import React, { useCallback, useRef } from 'react';
import { useTracking } from '@payroll/quicksand';
import Tooltip from '@ids-ts/tooltip';
import { useSubmitTimeDatesContext } from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';
import { formatCellValue, isWeeklyCellLocked } from '../../utils/helpers';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import type { CellData } from '../../types';
import type { TimesheetRow } from '../../store/timeEntryGridSlice';
import { useAppSelector } from '../../store';
import { selectMaxApprovedDate } from '../../store/selectors';
import {
  SelectedCell,
  CellInput,
  DataCell,
} from '../styles/WeeklyTimeEntryTable.styles';

interface DayCellProps {
  cell: CellData;
  row: TimesheetRow;
  rowIndex: number;
  cellIdx: number;
  dayIdx: number;
  dayData: any;
  selectedCell: any;
  handleContextMenu: any;
  handleCellClick: any;
  handleHourChange: any;
  fieldErrors?: {
    service?: string;
    class?: string;
    location?: string;
    notes?: string;
    customerProject?: string;
    customFields?: { [fieldId: string]: string };
    dimensions?: { [definitionId: string]: string };
  };
}

/**
 * DayCell Component
 * Renders a day cell (hour input) for a row.
 * Handles selection, editing, and applies special background for break/time off.
 */
export const DayCell: React.FC<DayCellProps> = ({
  cell,
  row,
  rowIndex,
  cellIdx,
  dayIdx,
  dayData,
  selectedCell,
  handleContextMenu,
  handleCellClick,
  handleHourChange,
  fieldErrors = {},
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectedCell =
    selectedCell?.rowId === row.rowId && selectedCell?.dayIdx === dayIdx;
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();

  // Get the maximum approved date across ALL rows for this week
  const maxApprovedDate = useAppSelector(selectMaxApprovedDate);
  const { minSelectableDate, isSubmitTimeEnabled } =
    useSubmitTimeDatesContext();

  // Callback ref to focus input when it's mounted
  const setInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      // Always focus when input is created (only happens when cell is selected)
      node.focus();
    }
  }, []); // No dependencies = no re-renders

  // Compute cell class for break/time off highlighting and validation errors
  const classNames = [];
  if (
    (row.timeAgainst.type === 'PAID' || row.timeAgainst.type === 'UNPAID') &&
    dayData &&
    typeof dayData.hours === 'number' &&
    dayData.hours > 0
  ) {
    classNames.push('is-break');
  } else if (
    row.timeAgainst.type === 'TIME_OFF' &&
    dayData &&
    typeof dayData.hours === 'number' &&
    dayData.hours > 0
  ) {
    classNames.push('is-timeoff');
  }
  // Only apply has-notes class when there are both notes and hours > 0
  if (
    dayData?.notes &&
    dayData?.hours &&
    typeof dayData.hours === 'number' &&
    dayData.hours > 0
  ) {
    classNames.push('has-notes');
  }

  // Add error class if there are validation errors for this cell
  const hasErrors =
    Object.values(fieldErrors).some(
      (error) => typeof error === 'string' && error.length > 0,
    ) ||
    (fieldErrors.customFields &&
      Object.keys(fieldErrors.customFields).length > 0) ||
    (fieldErrors.dimensions && Object.keys(fieldErrors.dimensions).length > 0);
  if (hasErrors) {
    classNames.push('has-validation-errors');
  }

  // Check if this specific cell should be locked
  // A cell is locked if its date is on or before the max approved date, or if the row is a time off entry
  const isCellLockedStatus = isWeeklyCellLocked(
    dayData?.date,
    maxApprovedDate,
    row.isTimeOffRow,
    minSelectableDate,
    isSubmitTimeEnabled,
  );

  if (isCellLockedStatus) {
    classNames.push('is-approved-entry');
  }

  const classNameStr = classNames.join(' ');

  if (isCellLockedStatus) {
    // For locked cells, only allow clicking if the cell has hours > 0
    const hasHours =
      dayData && typeof dayData.hours === 'number' && dayData.hours > 0;

    return (
      <DataCell
        data-testid="data-cell"
        className={classNameStr}
        onClick={
          hasHours
            ? (e: React.MouseEvent<HTMLTableCellElement>) => {
                track(trackingPoints.DURATION);
                handleCellClick(row.rowId, cellIdx, e.currentTarget);
              }
            : undefined
        }
        onContextMenu={(e: React.MouseEvent) =>
          handleContextMenu(row.rowId, dayIdx, e)
        }
        style={{
          cursor: hasHours ? 'pointer' : 'default', // Only show pointer cursor if clickable
          backgroundColor:
            'var(--color-data-neutral)' /* (SemanticContextMatchOnly) */,
        }}
        tabIndex={hasHours ? 0 : -1}
        textAlign="left"
      >
        {formatCellValue(cell.value)}
      </DataCell>
    );
  }

  if (isSelectedCell) {
    // Render input for editing hours
    return (
      <SelectedCell
        data-testid="selected-cell"
        className={classNameStr}
        onContextMenu={(e: React.MouseEvent) =>
          handleContextMenu(row.rowId, dayIdx, e)
        }
      >
        <CellInput
          data-testid="cell-input"
          ref={setInputRef}
          type="text"
          defaultValue={cell.value === 0 ? '' : formatCellValue(cell.value)}
          onBlur={(e) => {
            // Process the value when user finishes editing
            handleHourChange(row.rowId, dayIdx, e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
      </SelectedCell>
    );
  }

  // Render static cell (for approved entries, entries with start time, or non-selected cells)
  return (
    <DataCell
      data-testid="data-cell"
      className={classNameStr}
      onClick={(e: React.MouseEvent<HTMLTableCellElement>) => {
        track(trackingPoints.DURATION);
        handleCellClick(row.rowId, cellIdx, e.currentTarget);
      }}
      onContextMenu={(e: React.MouseEvent) =>
        handleContextMenu(row.rowId, dayIdx, e)
      }
      tabIndex={0}
      textAlign="left"
    >
      {formatCellValue(cell.value)}
    </DataCell>
  );
};
