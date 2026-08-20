import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  computeSelectionState,
  type SelectableWorker,
} from 'src/js/widgets/common/WorkerSelection';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectPolicyMemberIds,
  selectPolicyAssignments,
  selectInitialMemberIds,
  setPolicyMemberIds,
  setInitialMemberIds,
  setAssignmentsDirty,
} from '../store';
import type { OvertimePolicyAssignment } from '../types/Overtime.types';
import { USER_NOT_FOUND_ENTITY_NAME } from '../../../constants';

/**
 * Compute worker IDs from policy assignments.
 * Handles all three entity types: 'user', 'group', and 'all'.
 *
 * @param assignments - Policy assignments from API
 * @param workers - Available workers with memberOfGroup info
 * @returns Array of worker IDs that should be pre-selected
 */
function getWorkerIdsFromAssignments(
  assignments: OvertimePolicyAssignment[],
  workers: SelectableWorker[],
): string[] {
  if (!assignments || assignments.length === 0 || workers.length === 0) {
    return [];
  }

  const workerIds = new Set<string>();

  assignments.forEach((assignment) => {
    switch (assignment.entityType) {
      case 'user':
        // Direct user assignment - entityId is the worker ID
        // Skip orphaned assignments where the user no longer exists
        if (assignment.entityName !== USER_NOT_FOUND_ENTITY_NAME) {
          workerIds.add(assignment.entityId);
        }
        break;

      case 'group':
        // Group assignment - find all workers belonging to this group
        workers
          .filter((worker) => worker.memberOfGroup?.id === assignment.entityId)
          .forEach((worker) => workerIds.add(worker.id));
        break;

      case 'all':
        // Company-wide assignment - select all workers
        workers.forEach((worker) => workerIds.add(worker.id));
        break;

      default:
        // Unknown entity type - skip
        break;
    }
  });

  return Array.from(workerIds);
}

/**
 * Props for the policy worker selection adapter
 */
export interface UsePolicyWorkerSelectionAdapterParams {
  /** Workers currently visible on the page */
  workers: SelectableWorker[];
  /** Policy ID for edit mode (optional - presence indicates edit mode) */
  policyId?: string;
  /** Initial worker IDs for edit mode (from API) */
  initialWorkerIds?: string[];
}

/**
 * Result from the adapter hook
 */
export interface UsePolicyWorkerSelectionAdapterResult {
  /** Set of selected worker IDs */
  selectedIds: Set<string>;
  /** Whether all visible workers are selected */
  allSelected: boolean;
  /** Whether some (but not all) visible workers are selected */
  someSelected: boolean;
  /** Handle individual worker selection change */
  onSelectionChange: (workerId: string, isSelected: boolean) => void;
  /** Handle select all/none toggle */
  onSelectAllChange: (selectAll: boolean) => void;
  /** Total count of selected workers */
  selectedCount: number;
  /** Whether in edit mode */
  isEditMode: boolean;
}

/**
 * Adapter hook connecting WorkerSelectionTable to the overtime policy Redux slice.
 *
 * This adapter bridges the stateless WorkerSelectionTable component to the
 * overtime Redux state management, supporting both create and edit modes.
 *
 * Unlike the base selection hook, this adapter uses Redux as the single source of truth
 * and doesn't maintain local state to avoid sync issues.
 *
 * @example
 * ```tsx
 * const {
 *   selectedIds,
 *   allSelected,
 *   someSelected,
 *   onSelectionChange,
 *   onSelectAllChange,
 * } = usePolicyWorkerSelectionAdapter({ workers, policyId });
 *
 * <WorkerSelectionTable
 *   workers={workers}
 *   selectedIds={selectedIds}
 *   onSelectionChange={onSelectionChange}
 *   onSelectAllChange={onSelectAllChange}
 *   allSelected={allSelected}
 *   someSelected={someSelected}
 * />
 * ```
 */
export function usePolicyWorkerSelectionAdapter(
  params: UsePolicyWorkerSelectionAdapterParams,
): UsePolicyWorkerSelectionAdapterResult {
  const { workers, policyId, initialWorkerIds } = params;
  const dispatch = useAppDispatch();
  const isEditMode = Boolean(policyId);

  // Get selection from Redux - this is the single source of truth
  const reduxSelectedIds = useAppSelector(selectPolicyMemberIds);
  const reduxInitialIds = useAppSelector(selectInitialMemberIds);
  const policyAssignments = useAppSelector(selectPolicyAssignments);
  const selectedIdsSet = useMemo(
    () => new Set(reduxSelectedIds),
    [reduxSelectedIds],
  );

  // Track if we've synced initial data in edit mode
  const hasSyncedInitial = useRef(false);
  // Track if we've resolved assignments (group/all) in edit mode
  const hasResolvedAssignments = useRef(false);
  // Track the policyId to reset sync flags when it changes
  const lastPolicyIdRef = useRef<string | undefined>(policyId);

  // Reset sync flags when policy changes
  if (policyId !== lastPolicyIdRef.current) {
    hasSyncedInitial.current = false;
    hasResolvedAssignments.current = false;
    lastPolicyIdRef.current = policyId;
  }

  // Sync initial worker IDs from API in edit mode (only once per policy)
  useEffect(() => {
    if (
      isEditMode &&
      initialWorkerIds &&
      initialWorkerIds.length > 0 &&
      !hasSyncedInitial.current
    ) {
      dispatch(setPolicyMemberIds(initialWorkerIds));
      hasSyncedInitial.current = true;
    }
  }, [isEditMode, initialWorkerIds, dispatch]);

  // Resolve group/all assignments to worker IDs once workers are loaded
  // This handles cases where assignments include groups or company-wide ("all")
  // Guard prevents infinite loop: dispatching setInitialMemberIds changes
  // reduxInitialIds, which would re-trigger this effect without the hasResolvedAssignments check
  useEffect(() => {
    if (
      isEditMode &&
      policyAssignments &&
      policyAssignments.length > 0 &&
      workers.length > 0 &&
      !hasResolvedAssignments.current
    ) {
      // Check if there are any group or all assignments that need resolution
      const hasGroupOrAllAssignments = policyAssignments.some(
        (a) => a.entityType === 'group' || a.entityType === 'all',
      );

      if (hasGroupOrAllAssignments) {
        // Compute worker IDs from assignments (includes user, group, and all)
        const resolvedWorkerIds = getWorkerIdsFromAssignments(
          policyAssignments,
          workers,
        );

        // Keep initial snapshot in sync with resolved state
        const mergedInitialIds = [
          ...new Set([...reduxInitialIds, ...resolvedWorkerIds]),
        ];
        dispatch(setInitialMemberIds(mergedInitialIds));

        // Merge with existing selections (to preserve any changes user made)
        const mergedIds = [
          ...new Set([...reduxSelectedIds, ...resolvedWorkerIds]),
        ];
        dispatch(setPolicyMemberIds(mergedIds));
      }

      hasResolvedAssignments.current = true;
    }
  }, [
    isEditMode,
    policyAssignments,
    workers,
    reduxSelectedIds,
    reduxInitialIds,
    dispatch,
  ]);

  // Compute selection state for current workers
  const { allSelected, someSelected } = useMemo(
    () => computeSelectionState(workers, selectedIdsSet),
    [workers, selectedIdsSet],
  );

  // Handle individual worker selection
  const onSelectionChange = useCallback(
    (workerId: string, isSelected: boolean) => {
      const newIds = isSelected
        ? [...reduxSelectedIds, workerId]
        : reduxSelectedIds.filter((id) => id !== workerId);
      dispatch(setPolicyMemberIds(newIds));
      // Mark assignments as dirty so ReviewStep uses selection count instead of API counts
      dispatch(setAssignmentsDirty(true));
    },
    [dispatch, reduxSelectedIds],
  );

  // Handle select all/none for current page
  const onSelectAllChange = useCallback(
    (selectAll: boolean) => {
      const currentPageIds = new Set(workers.map((w) => w.id));
      let newIds: string[];

      if (selectAll) {
        // Add all current page workers to selection
        newIds = [
          ...new Set([...reduxSelectedIds, ...workers.map((w) => w.id)]),
        ];
      } else {
        // Remove all current page workers from selection
        newIds = reduxSelectedIds.filter((id) => !currentPageIds.has(id));
      }
      dispatch(setPolicyMemberIds(newIds));
      // Mark assignments as dirty so ReviewStep uses selection count instead of API counts
      dispatch(setAssignmentsDirty(true));
    },
    [dispatch, reduxSelectedIds, workers],
  );

  return {
    selectedIds: selectedIdsSet,
    allSelected,
    someSelected,
    onSelectionChange,
    onSelectAllChange,
    selectedCount: reduxSelectedIds.length,
    isEditMode,
  };
}

export default usePolicyWorkerSelectionAdapter;
