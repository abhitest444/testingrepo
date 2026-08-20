/**
 * Types for Quick Worker/Manager Assignment component
 * Used for standalone assignment from GroupDetailView
 */

import { WorkerSelectionMode } from './GroupDrawer.types';

export interface QuickWorkerAssignmentProps {
  /**
   * Group ID to assign workers to
   */
  groupId: string;

  /**
   * Name of the group
   */
  groupName: string;

  /**
   * Assignment mode: 'workers' for members, 'leads' for managers
   */
  mode: WorkerSelectionMode;

  /**
   * Callback when assignment is saved successfully
   */
  onSuccess: () => void;

  /**
   * Callback when user cancels assignment
   */
  onCancel: () => void;
}

export interface QuickAssignmentWorker {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  type: string;
  isActive: boolean;
  memberOfGroup: { id: string; name: string } | null;
  managesGroups: Array<{ id: string; name: string }>;
}
