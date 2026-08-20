import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  TimeTracking_TimeForInput,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import {
  toggleDrawerWorkerSelection,
  toggleMemberSelection,
  toggleLeadSelection,
  setSelectedMembers,
  setSelectedLeads,
} from '../store/workersGroupViewSlice';
import { WorkerSelectionMode } from '../types/Groups/GroupDrawer.types';

/**
 * Parameters for worker selection hook
 * HYBRID: Different state systems for CREATE vs EDIT modes
 */
export interface UseWorkerSelectionParams {
  // Mode detection
  isEditMode: boolean;
  mode: WorkerSelectionMode;

  // Workers on current page
  workers: any[];

  // EDIT mode data: Drawer workers (unified state)
  drawerWorkersById: Record<string, any>;

  // CREATE mode data: Separate states for members vs leads
  selectedEntities: Record<string, TimeTracking_TimeForInput>;
}

/**
 * Result from worker selection hook
 */
export interface UseWorkerSelectionResult {
  // Check if a worker is selected
  isWorkerSelected: (workerId: string) => boolean;

  // Toggle individual worker selection
  updateWorkerSelection: (
    workerId: string,
    workerType: TimeTracking_TimeForType,
  ) => void;

  // Handle select/deselect all workers on current page
  handleSelectAll: (checked: boolean) => void;

  // Selection state for current page
  allSelected: boolean;
  someSelected: boolean;
}

/**
 * Custom hook to handle worker selection logic.
 * **HYBRID: Different approaches for CREATE vs EDIT modes.**
 *
 * Encapsulates all selection-related operations:
 * - Checking if workers are selected
 * - Toggling individual selections
 * - Select all / deselect all on current page
 * - Calculating selection state (all selected, some selected)
 *
 * **Hybrid State System:**
 * - EDIT mode: Uses `drawerWorkers` (unified state)
 * - CREATE mode: Uses `selectedMembers`/`selectedLeads` (separate states)
 *
 * **Usage:**
 * ```typescript
 * const {
 *   isWorkerSelected,
 *   updateWorkerSelection,
 *   handleSelectAll,
 *   allSelected,
 *   someSelected,
 * } = useWorkerSelection({
 *   isEditMode,
 *   mode,
 *   workers,
 *   drawerWorkersById,
 *   selectedEntities,
 * });
 * ```
 *
 * @param params - Worker selection parameters
 * @returns Selection utilities and state
 */
export function useWorkerSelection(
  params: UseWorkerSelectionParams,
): UseWorkerSelectionResult {
  const { isEditMode, mode, workers, drawerWorkersById, selectedEntities } =
    params;

  const dispatch = useDispatch();

  /**
   * Check if a specific worker is selected.
   * HYBRID: Check different state based on mode
   */
  const isWorkerSelected = useCallback(
    (workerId: string) => {
      if (isEditMode) {
        // EDIT mode: Check drawerWorkers
        return drawerWorkersById[workerId]?.isSelected || false;
      }

      // CREATE mode: Check selectedMembers/selectedLeads
      return workerId in selectedEntities;
    },
    [isEditMode, drawerWorkersById, selectedEntities],
  );

  /**
   * Toggle individual worker selection.
   * HYBRID: Use different action based on mode
   */
  const updateWorkerSelection = useCallback(
    (workerId: string, workerType: TimeTracking_TimeForType) => {
      if (isEditMode) {
        // EDIT mode: Toggle in drawerWorkers
        dispatch(toggleDrawerWorkerSelection({ workerId }));
        return;
      }

      // CREATE mode: Toggle in selectedMembers or selectedLeads
      const action =
        mode === WorkerSelectionMode.Workers
          ? toggleMemberSelection
          : toggleLeadSelection;

      dispatch(
        action({
          id: workerId,
          timeForType: workerType,
        }),
      );
    },
    [isEditMode, dispatch, mode],
  );

  /**
   * Handle select all / deselect all toggle.
   * Works on current page only.
   * HYBRID: Different logic based on mode
   */
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (isEditMode) {
        // EDIT mode: Toggle in drawerWorkers
        workers.forEach((worker) => {
          const isCurrentlySelected =
            drawerWorkersById[worker.id]?.isSelected || false;

          // Only toggle if state needs to change
          if (checked && !isCurrentlySelected) {
            dispatch(toggleDrawerWorkerSelection({ workerId: worker.id }));
          } else if (!checked && isCurrentlySelected) {
            dispatch(toggleDrawerWorkerSelection({ workerId: worker.id }));
          }
        });
        return;
      }

      // CREATE mode: Set/clear selectedMembers or selectedLeads
      const setAction =
        mode === WorkerSelectionMode.Workers
          ? setSelectedMembers
          : setSelectedLeads;

      if (checked) {
        // Select all on current page: merge existing selections + current page workers
        const currentPageSelections = workers.reduce((acc, worker) => {
          acc[worker.id] = { id: worker.id, timeForType: worker.type };
          return acc;
        }, {} as Record<string, TimeTracking_TimeForInput>);

        dispatch(setAction({ ...selectedEntities, ...currentPageSelections }));
      } else {
        // Deselect all on current page: remove current page workers from selections
        const currentPageWorkerIds = new Set(workers.map((w) => w.id));
        const remainingSelections = Object.entries(selectedEntities).reduce(
          (acc, [id, entity]) => {
            if (!currentPageWorkerIds.has(id)) {
              acc[id] = entity;
            }
            return acc;
          },
          {} as Record<string, TimeTracking_TimeForInput>,
        );

        dispatch(setAction(remainingSelections));
      }
    },
    [isEditMode, dispatch, workers, mode, selectedEntities, drawerWorkersById],
  );

  /**
   * Check if all workers on current page are selected.
   * Used for "select all" checkbox checked state.
   */
  const allSelected = useMemo(
    () =>
      workers.length > 0 &&
      workers.every((worker) => isWorkerSelected(worker.id)),
    [workers, isWorkerSelected],
  );

  /**
   * Check if some (but not all) workers on current page are selected.
   * Used for "select all" checkbox indeterminate state.
   */
  const someSelected = useMemo(
    () =>
      workers.length > 0 &&
      workers.some((worker) => isWorkerSelected(worker.id)) &&
      !allSelected,
    [workers, isWorkerSelected, allSelected],
  );

  return {
    isWorkerSelected,
    updateWorkerSelection,
    handleSelectAll,
    allSelected,
    someSelected,
  };
}
