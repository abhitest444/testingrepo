import { useCallback } from 'react';
import { Dayjs } from 'dayjs';
import { useAppDispatch, useAppSelector } from '../store';
import {
  updateCell,
  selectCell,
  toggleConfirmTimeEntryConversionModal,
} from '../store/timeEntryGridSlice';
import {
  selectFirstEditedCells,
  selectTeamMember,
  selectSelectedCell,
  selectVisibleDays,
  selectWeeklyTimeEntriesMap,
  selectMaxApprovedDate,
} from '../store/selectors';
import {
  hasValidBillable,
  isBreakRow,
  isWeeklyCellLocked,
} from '../utils/helpers';

/**
 * Custom hook for optimized cell click handling
 * Replaces Redux thunk with a clean useCallback approach
 */
export const useOptimizedCellClick = ({
  minSelectableDate,
  isSubmitTimeEnabled,
}: {
  minSelectableDate?: Dayjs;
  isSubmitTimeEnabled?: boolean;
} = {}) => {
  const dispatch = useAppDispatch();
  const firstEditedCells = useAppSelector(selectFirstEditedCells);
  const weeklyTimeEntriesMap = useAppSelector(selectWeeklyTimeEntriesMap);
  const visibleDays = useAppSelector(selectVisibleDays);
  const teamMember = useAppSelector(selectTeamMember);
  const previouslySelectedCell = useAppSelector(selectSelectedCell);
  const maxApprovedDate = useAppSelector(selectMaxApprovedDate);

  const handleCellClick = useCallback(
    (rowId: string, cellIdx: number) => {
      // Only handle day cells (indices 1 and up, but within visible days)
      if (cellIdx < 1 || cellIdx > visibleDays.length) {
        return { rowId: '', dayIdx: -1 };
      }

      // Map cellIdx to the corresponding day index from visibleDays
      const dayIdx = visibleDays[cellIdx - 1];

      // Auto-populate logic: Copy non-hour fields from the first edited cell if needed
      const firstEdit = firstEditedCells[rowId];
      const row = weeklyTimeEntriesMap[rowId];
      const targetCell = row?.timeEntries[dayIdx];

      // Don't allow editing locked cells (time off rows or cells on or before the week's max approved date)
      if (
        isWeeklyCellLocked(
          targetCell?.date,
          maxApprovedDate,
          row?.isTimeOffRow,
          minSelectableDate,
          isSubmitTimeEnabled,
        )
      ) {
        // For locked cells with hours, just select without allowing edit
        // This matches the DayCell behavior where locked cells are locked
        if (targetCell.hours && targetCell.hours > 0) {
          dispatch(selectCell({ rowId, dayIdx }));
        }
        return { rowId, dayIdx };
      }

      // If the selected cell has pre-saved start-end time type time entry, show the confirmation modal
      // Only show modal if the original values are different from current values (i.e., values have NOT changed)
      // AND the cell is not locked
      if (
        targetCell &&
        (targetCell.startTime || targetCell.endTime) &&
        !isWeeklyCellLocked(
          targetCell.date,
          maxApprovedDate,
          row?.isTimeOffRow,
          minSelectableDate,
          isSubmitTimeEnabled,
        )
      ) {
        dispatch(
          toggleConfirmTimeEntryConversionModal({
            isOpen: true,
            rowId: previouslySelectedCell?.rowId,
            dayIdx: previouslySelectedCell?.dayIdx,
          }),
        );
      }

      if (firstEdit && firstEdit.dayIndex !== dayIdx && row) {
        // Use the snapshot from firstEdit.cellState instead of current cell state
        // This ensures we copy the state as it was when the user finished editing
        const sourceCell = firstEdit.cellState;

        const updates: any = {};
        let hasUpdates = false;

        // Check metaInfo fields
        if (!targetCell?.metaInfo?.service && sourceCell.metaInfo?.service) {
          updates.metaInfo = {
            ...targetCell?.metaInfo,
            service: sourceCell.metaInfo.service,
          };
          hasUpdates = true;

          // Update notes with service description if no existing notes and service has description
          if (!targetCell?.notes && sourceCell.metaInfo.service.description) {
            updates.notes = sourceCell.metaInfo.service.description;
          }
        }

        if (!targetCell?.metaInfo?.class && sourceCell.metaInfo?.class) {
          updates.metaInfo = {
            ...(updates.metaInfo || targetCell?.metaInfo),
            class: sourceCell.metaInfo.class,
          };
          hasUpdates = true;
        }

        if (!targetCell?.metaInfo?.location && sourceCell.metaInfo?.location) {
          updates.metaInfo = {
            ...(updates.metaInfo || targetCell?.metaInfo),
            location: sourceCell.metaInfo.location,
          };
          hasUpdates = true;
        }

        // Copy billable info alongside the service. Skip when the target
        // already has its own service — that service's rate (set by the
        // service handler) takes precedence over the source cell's rate.
        const isCurrentRowBreak = isBreakRow(row.timeAgainst);
        const shouldCopyBillable =
          !isCurrentRowBreak &&
          !targetCell?.timeEntryId &&
          !targetCell?.metaInfo?.service &&
          sourceCell.billableInfo;

        if (shouldCopyBillable && hasValidBillable(sourceCell.billableInfo)) {
          updates.billableInfo = {
            billable: sourceCell.billableInfo!.billable,
            billableRate: sourceCell.billableInfo!.billableRate,
          };
          hasUpdates = true;
        }

        // Copy customFields if source has them and target doesn't have them and target is not a saved entry
        if (
          !targetCell?.customFields?.length &&
          sourceCell.customFields?.length &&
          !targetCell?.timeEntryId // Don't copy to saved entries
        ) {
          updates.customFields = sourceCell.customFields;
          hasUpdates = true;
        }

        // Dispatch updates if any
        if (hasUpdates) {
          dispatch(updateCell({ rowId, dayIdx, value: updates }));
        }
      } else if (
        targetCell &&
        !targetCell.timeEntryId &&
        !targetCell.metaInfo?.service &&
        (!targetCell.billableInfo ||
          targetCell.billableInfo.billable === undefined ||
          !targetCell.billableInfo.billableRate ||
          targetCell.billableInfo.billableRate === '0')
      ) {
        // Don't apply team member billable info to break entries
        // Break entries should not inherit billable information from team member
        const isCurrentRowBreak = isBreakRow(row?.timeAgainst);

        if (!isCurrentRowBreak) {
          // Use team member billable info as default for empty cells
          // Only apply to non-break entries (customers, projects, etc.)
          const updates: any = {
            billableInfo: {
              ...targetCell.billableInfo,
              billable: teamMember?.billable,
              billableRate: teamMember?.billableRate?.toString(),
            },
          };
          dispatch(updateCell({ rowId, dayIdx, value: updates }));
        }
      }

      // Select the cell
      dispatch(selectCell({ rowId, dayIdx }));

      return { rowId, dayIdx };
    },
    [
      visibleDays,
      firstEditedCells,
      weeklyTimeEntriesMap,
      dispatch,
      previouslySelectedCell?.rowId,
      previouslySelectedCell?.dayIdx,
      teamMember?.billable,
      teamMember?.billableRate,
      maxApprovedDate,
      minSelectableDate,
      isSubmitTimeEnabled,
    ],
  );

  return { handleCellClick };
};
