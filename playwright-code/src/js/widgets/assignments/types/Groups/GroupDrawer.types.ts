/**
 * Drawer view modes
 */
export enum GroupDrawerView {
  Details = 'details',
  AssignWorkers = 'assign-workers',
  AssignLeads = 'assign-leads',
}

/**
 * Worker selection mode for AssignWorkersContent component
 */
export enum WorkerSelectionMode {
  Workers = 'workers',
  Leads = 'leads',
}

/**
 * Source of error in the group with assignments operation
 */
export enum ErrorSource {
  CreateGroup = 'createGroup',
  UpdateGroup = 'updateGroup',
  AssignMembers = 'assignMembers',
  RemoveMembers = 'removeMembers',
  AssignManagers = 'assignManagers',
  RemoveManagers = 'removeManagers',
}

/**
 * Context for how the drawer was opened
 * Determines save/navigation behavior
 */
export enum GroupDrawerContext {
  QuickAction = 'quick-action', // Opened from table ComboLink
  EditGroup = 'edit-group', // Opened from GroupDetailsContent "Assign" button
  CreateGroup = 'create-group', // Opened from Create Group flow
}

/**
 * Operation type for group assignments
 * Used to distinguish between members and managers operations
 */
export enum OperationType {
  Members = 'members',
  Managers = 'managers',
}

/**
 * Operation action for group assignments
 * Used to distinguish between assign and remove operations
 */
export enum OperationAction {
  Assign = 'assign',
  Remove = 'remove',
}

export interface WorkerSelectionContentProps {
  /**
   * Name of the group being assigned to
   */
  groupName: string;

  /**
   * Selection mode: 'workers' for group members, 'leads' for group managers
   * @default WorkerSelectionMode.Workers
   */
  mode?: WorkerSelectionMode;

  /**
   * Group ID for edit mode (to fetch current members)
   * Optional - only needed in edit mode
   */
  groupId?: string;
}

/**
 * Props for EditGroupDrawer component
 */
export interface EditGroupDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialGroupName: string;
  groupId: string;
  groupVersion: number;
  initialView?: GroupDrawerView;
}

/**
 * Props for CreateGroupDrawer component
 */
export interface CreateGroupDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}
