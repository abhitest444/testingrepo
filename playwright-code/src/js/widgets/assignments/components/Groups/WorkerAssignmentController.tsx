import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSandbox } from '@payroll/quicksand';
import { WorkerSelectionContent } from './WorkerSelectionContent';
import { useInitializeEditModeWorkers } from '../../hooks/useInitializeEditModeWorkers';
import { clearDrawerWorkers } from '../../store/workersGroupViewSlice';
import {
  WorkerSelectionMode,
  GroupDrawerContext,
} from '../../types/Groups/GroupDrawer.types';

export interface WorkerAssignmentControllerProps {
  /**
   * Group ID for edit mode (undefined for create mode)
   */
  groupId?: string;

  /**
   * Group name to display
   */
  groupName: string;

  /**
   * Mode: 'create' or 'edit'
   */
  mode: 'create' | 'edit';

  /**
   * Context: determines save behavior
   * - 'create-group': Creating new group (all-in-one save)
   * - 'edit-group': Editing existing group (multi-step save)
   * - 'quick-action': Quick assignment (immediate save and close)
   */
  context: GroupDrawerContext;

  /**
   * Member count (for optimization in edit mode)
   */
  memberCount?: number;

  /**
   * Whether the parent container is open
   */
  open: boolean;

  /**
   * Current view (optional, for coordination with parent)
   */
  currentView?: string;
}

/**
 * WorkerAssignmentController
 *
 * Reusable controller for assigning workers to groups in edit mode.
 * Handles all initialization, data loading, and context setup.
 *
 * Usage:
 *
 * // In GroupDrawer (with drawer context)
 * <WorkerAssignmentController
 *   groupId={groupId}
 *   groupName={groupName}
 *   mode="edit"
 *   context={GroupDrawerContext.QuickAction}
 *   memberCount={memberCount}
 *   open={open}
 * />
 *
 * // Standalone (without drawer)
 * <WorkerAssignmentController
 *   groupId={groupId}
 *   groupName={groupName}
 *   mode="edit"
 *   context={GroupDrawerContext.QuickAction}
 *   memberCount={memberCount}
 *   open={true}
 * />
 */
export const WorkerAssignmentController: React.FC<
  WorkerAssignmentControllerProps
> = ({ groupId, groupName, mode, context, memberCount, open, currentView }) => {
  const sandbox = useSandbox();
  const dispatch = useDispatch();

  // Initialize edit mode (loads current members)
  // CREATE mode doesn't need initialization - workers loaded by WorkerSelectionContent
  useInitializeEditModeWorkers(mode, groupId, open, memberCount, currentView);

  // NOTE: setDrawerContext is now handled by EditGroupDrawer on mount
  // This ensures groupId/groupName are in Redux before controllers render

  // Clean up when closed
  useEffect(() => {
    if (!open) {
      sandbox.logger.info(
        'Component="WorkerAssignmentController" Event="Cleaning up on close"',
      );
      dispatch(clearDrawerWorkers());
    }
  }, [open, dispatch, sandbox]);

  // Render the worker selection UI
  // Key ensures component remounts when groupId OR currentView changes for fresh state
  return (
    <WorkerSelectionContent
      key={`workers-${groupId || 'new'}-${currentView || 'default'}`}
      groupName={groupName}
      mode={WorkerSelectionMode.Workers}
      groupId={groupId}
    />
  );
};
