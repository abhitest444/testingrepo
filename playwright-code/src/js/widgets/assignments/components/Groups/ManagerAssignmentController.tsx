import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSandbox } from '@payroll/quicksand';
import { WorkerSelectionContent } from './WorkerSelectionContent';
import { useInitializeEditMode } from '../../hooks/useInitializeEditMode';
import { clearDrawerWorkers } from '../../store/workersGroupViewSlice';
import {
  WorkerSelectionMode,
  GroupDrawerContext,
} from '../../types/Groups/GroupDrawer.types';

export interface ManagerAssignmentControllerProps {
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
   * Manager count (for optimization in edit mode)
   */
  managerCount?: number;

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
 * ManagerAssignmentController
 *
 * Reusable controller for assigning managers/leads to groups in edit mode.
 * Handles all initialization, data loading, and context setup.
 *
 * Usage:
 *
 * // In GroupDrawer (with drawer context)
 * <ManagerAssignmentController
 *   groupId={groupId}
 *   groupName={groupName}
 *   mode="edit"
 *   context={GroupDrawerContext.QuickAction}
 *   managerCount={managerCount}
 *   open={open}
 * />
 *
 * // Standalone (without drawer)
 * <ManagerAssignmentController
 *   groupId={groupId}
 *   groupName={groupName}
 *   mode="edit"
 *   context={GroupDrawerContext.QuickAction}
 *   managerCount={managerCount}
 *   open={true}
 * />
 */
export const ManagerAssignmentController: React.FC<
  ManagerAssignmentControllerProps
> = ({
  groupId,
  groupName,
  mode,
  context,
  managerCount,
  open,
  currentView,
}) => {
  const sandbox = useSandbox();
  const dispatch = useDispatch();

  // Initialize edit mode (loads current managers/leads)
  // CREATE mode doesn't need initialization - workers loaded by WorkerSelectionContent
  useInitializeEditMode(mode, groupId, open, managerCount, currentView);

  // NOTE: setDrawerContext is now handled by EditGroupDrawer on mount
  // This ensures groupId/groupName are in Redux before controllers render

  // Clean up when closed
  useEffect(() => {
    if (!open) {
      sandbox.logger.info(
        'Component="ManagerAssignmentController" Event="Cleaning up on close"',
      );
      dispatch(clearDrawerWorkers());
    }
  }, [open, dispatch, sandbox]);

  // Render the manager/lead selection UI
  // Key ensures component remounts when groupId OR currentView changes for fresh state
  return (
    <WorkerSelectionContent
      key={`leads-${groupId || 'new'}-${currentView || 'default'}`}
      groupName={groupName}
      mode={WorkerSelectionMode.Leads}
      groupId={groupId}
    />
  );
};
