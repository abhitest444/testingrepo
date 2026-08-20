import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { updateCell, selectCell } from '../store/timeEntryGridSlice';
import {
  recordChange,
  undo,
  redo,
  clearHistory,
  selectCanUndo,
  selectCanRedo,
  selectCurrentChange,
  selectNextRedoChange,
} from '../store/undoRedoSlice';

export const useUndoRedo = () => {
  const dispatch = useAppDispatch();

  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  const currentChange = useAppSelector(selectCurrentChange);
  const nextRedoChange = useAppSelector(selectNextRedoChange);

  const handleUndo = useCallback(() => {
    if (!canUndo || !currentChange) return;

    // Restore the original hours
    dispatch(
      updateCell({
        rowId: currentChange.rowId,
        dayIdx: currentChange.dayIdx,
        value: { hours: currentChange.originalHours },
      }),
    );

    // Select the cell that was undone
    dispatch(
      selectCell({ rowId: currentChange.rowId, dayIdx: currentChange.dayIdx }),
    );

    // Move the history index back
    dispatch(undo());
  }, [canUndo, currentChange, dispatch]);

  const handleRedo = useCallback(() => {
    if (!canRedo || !nextRedoChange) return;

    // Restore the new hours
    dispatch(
      updateCell({
        rowId: nextRedoChange.rowId,
        dayIdx: nextRedoChange.dayIdx,
        value: { hours: nextRedoChange.newHours },
      }),
    );

    // Select the cell that was redone
    dispatch(
      selectCell({
        rowId: nextRedoChange.rowId,
        dayIdx: nextRedoChange.dayIdx,
      }),
    );

    // Move the history index forward
    dispatch(redo());
  }, [canRedo, nextRedoChange, dispatch]);

  const resetHistory = useCallback(() => {
    dispatch(clearHistory());
  }, [dispatch]);

  const recordHoursChange = useCallback(
    (
      rowId: string,
      dayIdx: number,
      originalHours: number,
      newHours: number,
    ) => {
      // Only record if there's an actual change
      if (originalHours !== newHours) {
        dispatch(
          recordChange({
            rowId,
            dayIdx,
            originalHours,
            newHours,
          }),
        );
      }
    },
    [dispatch],
  );

  return {
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    resetHistory,
    recordHoursChange,
  };
};
