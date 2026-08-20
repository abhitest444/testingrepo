import React, { useCallback, useEffect, useMemo } from 'react';
import { Button } from '@ids-ts/button';
import { Table } from '@ids-ts/table';
import { B3 } from '@ids-ts/typography';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Info } from '@design-systems/icons';
import Tooltip from '@ids-ts/tooltip';
import { useSubmitTimeDatesContext } from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';
import { useCurrencySymbol } from 'src/js/service/utils/sandboxUtils';
import { HeaderData, CellData } from '../types';
import { useWeeklyTimeTrackingPoints } from '../hooks/useWeeklyTimeTrackingPoints';
import { useAppDispatch, useAppSelector } from '../store';
import { useOptimizedCellClick } from '../hooks/useOptimizedCellClick';
import { useUndoRedo } from '../hooks/useUndoRedo';
import {
  selectTimesheetRows,
  selectAllTimesheetRows,
  selectSelectedCell,
  selectVisibleDays,
  selectFirstDayOfWeek,
  selectCustomerData,
  selectActiveBreaks,
  selectWeekDates,
  selectDateRange,
} from '../store/selectors';
import type { TimesheetRow } from '../store/timeEntryGridSlice';
import {
  addRow,
  deleteRow,
  setTimeCategorySelectorReady,
  updateCell,
  selectCell,
  updateTimeAgainst,
} from '../store/timeEntryGridSlice';
import {
  WeeklyTimeEntryFormWrapper,
  NoPaddingTableWrapper,
  FocusableCell,
  DeleteCell,
  LastHeaderCell,
  HeaderContent,
  ButtonContainer,
  RowStyles,
  DataCell,
  TimeCategoryHeaderRow,
  TimeCategoryIconWrapper,
} from './styles/WeeklyTimeEntryTable.styles';
import {
  getCellStyle,
  getHeaderData,
  getRowData,
  createEmptyRow,
  getFormattedCellHours,
  isWeeklyRowLocked,
} from '../utils/helpers';
import type { Week } from '../hooks/useCombinedDataFetching';
import { closeContextMenu, openContextMenu } from '../store/contextMenuSlice';
import type { ContextMenuState } from '../store/contextMenuSlice';
import { WeeklyTimeEntryContextMenu } from './weeklyTimeEntryGridView/WeeklyTimeEntryContextMenu';
import { DeleteButton, CustomerCell, DayCell } from './weeklyTimeEntryGridView';
import { LockButton } from './weeklyTimeEntryGridView/LockButton';
import { WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS } from '../utils/constants';

interface WeeklyTimeEntryTableProps {
  currentWeek: Week;
  rowErrors?: {
    [rowId: string]: {
      overHours?: string;
    };
  };
  fieldErrors?: {
    [cellKey: string]: {
      service?: string;
      class?: string;
      location?: string;
      notes?: string;
      customerProject?: string;
      customFields?: { [fieldId: string]: string };
    };
  };
  onLockIconClick: (isTimeOff?: boolean, isSubmitted?: boolean) => void;
}

// WeeklyTimeEntryTable.tsx
// Main component for rendering the weekly time entry grid/table.
// Handles all row/cell rendering, cell selection, editing, and context menu integration.
// Uses Redux for state and dispatches all grid-related actions.

/**
 * Main Grid View Component
 * Renders the time entry table with all its functionality
 * Now optimized with custom hooks and Redux thunks
 */
const WeeklyTimeEntryTable: React.FC<WeeklyTimeEntryTableProps> = ({
  currentWeek,
  rowErrors = {},
  fieldErrors = {},
  onLockIconClick,
}) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const track = useTracking();
  const sandbox = useSandbox();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const currencySymbol = useCurrencySymbol();
  const { minSelectableDate, isSubmitTimeEnabled } =
    useSubmitTimeDatesContext();
  const timeEntries = useAppSelector(selectTimesheetRows);
  const selectedCell = useAppSelector(selectSelectedCell);
  const visibleDays = useAppSelector(selectVisibleDays);
  const firstDayOfWeek = useAppSelector(selectFirstDayOfWeek);
  const customers = useAppSelector(selectCustomerData);
  const breaks = useAppSelector(selectActiveBreaks);
  const dateRange = useAppSelector(selectDateRange);

  // Get the current week's dates for the grid
  const weekDates = useAppSelector(selectWeekDates);
  const contextMenu = useAppSelector(
    (state) => state.contextMenu as ContextMenuState,
  );

  // Resolve submit-time gate once at table level to avoid
  // per-cell async resolution and staggered lock repaint.
  const { handleCellClick: optimizedCellClick } = useOptimizedCellClick({
    minSelectableDate,
    isSubmitTimeEnabled,
  });
  const { recordHoursChange } = useUndoRedo();

  /**
   * Hour change handler with validation
   * Validates input and updates Redux store directly
   * Accepts both numeric values (e.g., "8.5") and duration format (e.g., "8:30")
   * Allows up to 24 hours per cell (validation will be handled later)
   */
  const handleHourChange = useCallback(
    (rowId: string, dayIdx: number, value: string) => {
      // Get current cell to record previous hours
      const currentCell = timeEntries.find((row) => row.rowId === rowId)
        ?.timeEntries[dayIdx];
      const previousHours = currentCell?.hours || 0;

      // Allow empty string
      if (value === '') {
        dispatch(updateCell({ rowId, dayIdx, value: { hours: 0 } }));
        // Record the change for undo/redo
        recordHoursChange(rowId, dayIdx, previousHours, 0);
        return;
      }

      const hours = getFormattedCellHours(value);

      if (hours === -1) {
        return;
      }

      const hasExistingId =
        currentCell?.timeEntryId && currentCell?.timeEntryId.trim() !== '';

      if (hours === 0 && hasExistingId) {
        // User manually entered 0 for an existing entry - mark for deletion
        dispatch(
          updateCell({
            rowId,
            dayIdx,
            value: {
              hours: 0,
              operation: 'DELETE',
            },
          }),
        );
        // Record the change for undo/redo
        recordHoursChange(rowId, dayIdx, previousHours, 0);
      } else {
        // Store the raw value without rounding - rounding will happen during display
        dispatch(updateCell({ rowId, dayIdx, value: { hours } }));
        // Record the change for undo/redo
        recordHoursChange(rowId, dayIdx, previousHours, hours);
      }
    },
    [dispatch, timeEntries, recordHoursChange],
  );

  /**
   * Cell click handler that uses the optimized hook
   */
  const handleCellClick = useCallback(
    (rowId: string, cellIdx: number, element: HTMLTableDataCellElement) => {
      // Use the optimized cell click logic
      optimizedCellClick(rowId, cellIdx);
    },
    [optimizedCellClick],
  );

  /**
   * Handles adding a new row
   * With the new approach, we always have 6 default rows, so this adds beyond that
   */
  const handleAddRow = useCallback((): void => {
    track(trackingPoints.ADD_LINE);
    const newRow = createEmptyRow(currentWeek);
    dispatch(addRow({ row: newRow }));
  }, [dispatch, currentWeek]);

  /**
   * Handles row deletion using rowId directly
   * No need to find index since we use rowId for identification
   */
  const handleDeleteRow = useCallback(
    (rowId: string): void => {
      dispatch(deleteRow({ rowId }));
    },
    [dispatch],
  );

  // Memoize header data to prevent unnecessary recalculations
  const headerData = useMemo(
    () =>
      getHeaderData(
        dateRange,
        visibleDays,
        timeEntries,
        firstDayOfWeek,
        currencySymbol,
      ),
    [
      dateRange.start,
      dateRange.end,
      visibleDays,
      timeEntries,
      firstDayOfWeek,
      currencySymbol,
    ],
  );

  /**
   * Renders a header cell
   * Applies styling and content for table headers
   * Shows customer/project info icon next to "Time category" when assignment (QuickFind OTX) is enabled (same pattern as Billable)
   */
  const renderHeaderCell = useCallback(
    (header: HeaderData): JSX.Element => {
      const isTimeCategoryWithInfo = header.label === 'Time category';
      const customerProjectTooltip = intl.formatMessage({
        id: 'customer.project.assignment.info.tooltip',
      });

      return (
        <FocusableCell
          className="header-cell"
          style={{
            ...getCellStyle(header.width, header.height),
            ...(header.hasError && {
              backgroundColor: '#ffebee',
              border: '1px solid #f44336',
            }),
          }}
          tabIndex={0}
        >
          <HeaderContent>
            <TimeCategoryHeaderRow>
              <B3 weight="bold">{header.label}</B3>
              {isTimeCategoryWithInfo && (
                <Tooltip
                  tooltipOffsetSkidding={-2}
                  message={customerProjectTooltip}
                >
                  <TimeCategoryIconWrapper aria-label={customerProjectTooltip}>
                    <Info size="small" />
                  </TimeCategoryIconWrapper>
                </Tooltip>
              )}
            </TimeCategoryHeaderRow>
            <B3 as="span" weight="regular">
              {header.value}
            </B3>
          </HeaderContent>
        </FocusableCell>
      );
    },
    [intl],
  );

  const handleContextMenu = useCallback(
    (rowId: string, dayIdx: number, e: React.MouseEvent) => {
      e.preventDefault();
      dispatch(selectCell({ rowId, dayIdx }));
      sandbox.logger.info(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.USER_INTERACTIONS
          .WEEKLY_TIME_ENTRY_CONTEXT_MENU_OPEN,
      );
      dispatch(openContextMenu({ x: e.clientX, y: e.clientY, rowId, dayIdx }));
    },
    [dispatch, sandbox.logger],
  );

  const handleCloseContextMenu = () => {
    sandbox.logger.info(
      WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.USER_INTERACTIONS
        .WEEKLY_TIME_ENTRY_CONTEXT_MENU_CLOSE,
    );
    dispatch(closeContextMenu());
  };

  /**
   * renderDataCell
   * Decides which cell component to render for each cell in the grid row.
   * Delegates to CustomerCell, DayCell, or renders a plain DataCell.
   */
  const renderDataCell = useCallback(
    (
      cell: CellData,
      row: TimesheetRow,
      rowIndex: number,
      cellIdx: number,
    ): JSX.Element => {
      if (cellIdx === 0) {
        return (
          <CustomerCell
            row={row}
            rowIndex={rowIndex}
            cellIdx={cellIdx}
            customers={customers}
            breaks={breaks}
            dispatch={dispatch}
            fieldErrors={fieldErrors[`${row.rowId}-time-category`] || {}}
          />
        );
      }

      // Day cells start at cellIdx 1 and correspond to visibleDays array
      const isDayCell = cellIdx >= 1 && cellIdx <= visibleDays.length;
      if (isDayCell) {
        // Map cellIdx to the corresponding day index from visibleDays
        const dayIdx = visibleDays[cellIdx - 1];
        const dayData = row.timeEntries[dayIdx];

        return (
          <DayCell
            cell={cell}
            row={row}
            rowIndex={rowIndex}
            cellIdx={cellIdx}
            dayIdx={dayIdx}
            dayData={dayData}
            selectedCell={selectedCell}
            handleContextMenu={handleContextMenu}
            handleCellClick={handleCellClick}
            handleHourChange={handleHourChange}
            fieldErrors={fieldErrors[`${row.rowId}-${dayIdx}`] || {}}
          />
        );
      }

      // Render any other cell (e.g., total, billable)
      const hasRowError = rowErrors[row.rowId]?.overHours;
      const isTotalCell = cell.id === 'total';
      const isBillableCell = cell.id === 'billable';

      if (isTotalCell && hasRowError) {
        return (
          <DataCell
            textAlign="left"
            className="error-total-cell"
            paddingRight="20px"
          >
            {cell.value}
          </DataCell>
        );
      }

      return (
        <DataCell
          textAlign="left"
          paddingRight={isBillableCell ? '28px' : '20px'}
        >
          {cell.value}
        </DataCell>
      );
    },
    [
      customers,
      breaks,
      dispatch,
      selectedCell,
      visibleDays,
      handleContextMenu,
      handleCellClick,
      handleHourChange,
      fieldErrors,
      rowErrors,
    ],
  );

  // With the new approach, we always have at least 6 default rows
  // No need for complex row creation logic
  const safeRows = timeEntries || [];

  useEffect(() => {
    dispatch(setTimeCategorySelectorReady(safeRows.length > 0));
  }, [dispatch, safeRows.length]);

  return (
    <WeeklyTimeEntryFormWrapper>
      <NoPaddingTableWrapper>
        <RowStyles>
          <Table
            className="weekly-time-entry-table"
            density="compact"
            border="round"
            verticalDividerStyle="solid"
            divider
            hover="row"
            responsive="stack"
            data-testid="weekly-timesheet-grid"
          >
            <Table.Header>
              <Table.Row>
                {headerData.map((header) => (
                  <React.Fragment key={`header-${header.label}`}>
                    {renderHeaderCell(header)}
                  </React.Fragment>
                ))}
                <LastHeaderCell tabIndex={0} />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {(safeRows || []).map((row: TimesheetRow, rowIndex: number) => {
                const isSelected = selectedCell?.rowId === row.rowId;
                const rowKey = `row-${row.rowId}`;
                const isRowLocked = isWeeklyRowLocked(
                  row.hasApprovedEntries,
                  row.isTimeOffRow,
                  row.timeEntries,
                  minSelectableDate,
                  isSubmitTimeEnabled,
                );
                // Keep submitted-lock derivation aligned with current lock contract:
                // when a row is locked and it's neither approved nor time-off,
                // the lock reason is submitted-through date.
                const isSubmittedLock =
                  !row.hasApprovedEntries && !row.isTimeOffRow;

                return (
                  <Table.Row
                    key={rowKey}
                    className={isSelected ? 'selected-row' : ''}
                  >
                    {getRowData(
                      row,
                      visibleDays,
                      firstDayOfWeek,
                      currencySymbol,
                    ).map((cell, cellIdx) => (
                      <React.Fragment key={`${rowKey}-${cell.id}`}>
                        {renderDataCell(cell, row, rowIndex, cellIdx)}
                      </React.Fragment>
                    ))}
                    <DeleteCell>
                      {isRowLocked ? (
                        <LockButton
                          onLockIconClick={() =>
                            onLockIconClick(row.isTimeOffRow, isSubmittedLock)
                          }
                        />
                      ) : (
                        <DeleteButton
                          onDelete={() => handleDeleteRow(row.rowId)}
                        />
                      )}
                    </DeleteCell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </RowStyles>
      </NoPaddingTableWrapper>
      <ButtonContainer>
        <Button
          priority="secondary"
          purpose="passive"
          size="small"
          onClick={handleAddRow}
        >
          + Add rows
        </Button>
      </ButtonContainer>
      <WeeklyTimeEntryContextMenu
        visible={contextMenu.visible}
        context={contextMenu.context}
        onClose={handleCloseContextMenu}
        currentWeek={currentWeek}
      />
    </WeeklyTimeEntryFormWrapper>
  );
};

export { WeeklyTimeEntryTable };
