import { useState, useCallback, useMemo } from 'react';
import type {
  SelectableWorker,
  WorkerSelectionBaseResult,
} from '../components/WorkerSelectionTable.types';

/**
 * Entity-agnostic selection logic hook.
 * Manages selection state internally but allows external sync via callbacks.
 *
 * This hook is designed to be wrapped by feature-specific adapters that
 * connect to Redux or other state management solutions.
 *
 * @param initialSelectedIds - Initial set of selected worker IDs
 * @param onSelectionChange - Optional callback when selection changes
 * @returns Selection state and utilities
 *
 * @example
 * ```typescript
 * const selection = useWorkerSelectionBase({
 *   initialSelectedIds: ['worker-1', 'worker-2'],
 *   onSelectionChange: (ids) => dispatch(setSelectedWorkers(ids)),
 * });
 *
 * // In table:
 * <WorkerSelectionTable
 *   selectedIds={selection.selectedIds}
 *   onSelectionChange={(id, selected) => selection.toggleWorker(id)}
 *   onSelectAllChange={(selectAll) => selection.selectAll(workers, selectAll)}
 *   allSelected={selection.allSelected}
 *   someSelected={selection.someSelected}
 * />
 * ```
 */
export interface UseWorkerSelectionBaseParams {
  /** Initial set of selected worker IDs */
  initialSelectedIds?: string[];
  /** Callback fired when selection changes */
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function useWorkerSelectionBase(
  params: UseWorkerSelectionBaseParams = {},
): WorkerSelectionBaseResult {
  const { initialSelectedIds = [], onSelectionChange } = params;

  // Internal state
  const [selectedIds, setSelectedIdsInternal] = useState<Set<string>>(
    () => new Set(initialSelectedIds),
  );

  /**
   * Toggle selection for a single worker
   */
  const toggleWorker = useCallback(
    (workerId: string) => {
      setSelectedIdsInternal((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(workerId)) {
          newSet.delete(workerId);
        } else {
          newSet.add(workerId);
        }
        onSelectionChange?.(Array.from(newSet));
        return newSet;
      });
    },
    [onSelectionChange],
  );

  /**
   * Select or deselect all workers in the provided list.
   * Only affects workers in the current list (page-level selection).
   */
  const selectAll = useCallback(
    (workers: SelectableWorker[], select: boolean) => {
      setSelectedIdsInternal((prev) => {
        const newSet = new Set(prev);
        const currentPageIds = workers.map((w) => w.id);

        if (select) {
          // Add all workers from current page
          currentPageIds.forEach((id) => newSet.add(id));
        } else {
          // Remove all workers from current page
          currentPageIds.forEach((id) => newSet.delete(id));
        }

        onSelectionChange?.(Array.from(newSet));
        return newSet;
      });
    },
    [onSelectionChange],
  );

  /**
   * Replace entire selection (for external state sync)
   */
  const setSelectedIds = useCallback((ids: string[]) => {
    setSelectedIdsInternal(new Set(ids));
    // Don't call onSelectionChange here to avoid loops when syncing from external state
  }, []);

  /**
   * Get selected IDs as array
   */
  const getSelectedArray = useCallback(
    () => Array.from(selectedIds),
    [selectedIds],
  );

  return {
    selectedIds,
    allSelected: false, // Computed by consumer with workers list
    someSelected: false, // Computed by consumer with workers list
    toggleWorker,
    selectAll,
    setSelectedIds,
    getSelectedArray,
  };
}

/**
 * Compute selection state for a given list of workers.
 * Use this helper with useWorkerSelectionBase to get allSelected/someSelected.
 */
export function computeSelectionState(
  workers: SelectableWorker[],
  selectedIds: Set<string>,
): { allSelected: boolean; someSelected: boolean } {
  if (workers.length === 0) {
    return { allSelected: false, someSelected: false };
  }

  const selectedCount = workers.filter((w) => selectedIds.has(w.id)).length;
  const allSelected = selectedCount === workers.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return { allSelected, someSelected };
}

export default useWorkerSelectionBase;
