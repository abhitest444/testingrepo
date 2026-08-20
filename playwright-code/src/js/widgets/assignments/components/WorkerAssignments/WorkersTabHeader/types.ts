import { WorkerNameType } from 'src/js/widgets/assignments/types';

/**
 * Workers Tab Header Types - Phase 1
 * Type definitions for tab-level header action buttons
 *
 * NOTE: Search and filter types will be added in a separate ticket
 */

/**
 * Props for HeaderActions component
 * Contains handlers for the three header action buttons
 */
export interface HeaderActionsProps {
  /** Handler for "Manage time tracking fields" button */
  onManageFields?: () => void;
  /** Handler for "Add worker" dropdown button - receives worker type */
  onAddWorker?: (workerType: WorkerNameType) => void;
  /**
   * Opens the InviteWorkerDrawer for the selected worker type.
   * Intentionally narrower than the state setter — HeaderActions only ever
   * calls this with a concrete WorkerNameType, never undefined.
   */
  setInviteWorkerType?: (workerType: WorkerNameType) => void;
  /** Handler for "+ Create group" button */
  onCreateGroup?: () => void;
}
