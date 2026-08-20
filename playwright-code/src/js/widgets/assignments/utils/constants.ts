/**
 * Constants for Workers Table View by Groups
 * QUANTA-5011: Basic Table Structure & Layout
 */

import { OperationType, ErrorSource } from '../types/Groups/GroupDrawer.types';
import { SaveOperationConfig } from './groupSaveHelpers';

export const WORKERS_TABLE_DEFAULTS = {
  /** Default indentation level for child rows (in pixels) */
  INDENTATION_PER_LEVEL: 24,

  /** Default page size for pagination */
  DEFAULT_PAGE_SIZE: 50,

  /** Maximum page size */
  MAX_PAGE_SIZE: 100,

  /** Minimum page size */
  MIN_PAGE_SIZE: 25,
} as const;

export const WORKERS_PAGE_SIZE = 100;

/**
 * Size (height and width) for the load error state icon in the Worker Assignment drawer
 */
export const WORKER_ASSIGNMENT_LOAD_ERROR_ICON_SIZE = 72;

/**
 * Constants for Group Drawer Save Operations
 * Error Handling & Success Toast Messages
 */

/**
 * String to identify TSheets-specific errors
 */
export const TSHEETS_STRING = ' from TSheets';

/**
 * Configuration for saving member (worker) assignments
 */
export const SAVE_MEMBERS_CONFIG: SaveOperationConfig = {
  operationType: OperationType.Members,
  assignMutationField: 'timeTrackingAssignGroupMembers',
  removeMutationField: 'timeTrackingRemoveGroupMembers',
  assignErrorSource: ErrorSource.AssignMembers,
  removeErrorSource: ErrorSource.RemoveMembers,
  countField: 'memberCount',
  noChangesLogMessage:
    'Component="EditGroupDrawer" Event="No member changes to save"',
  errorLogMessage:
    'Component="EditGroupDrawer" Event="Failed to save member changes"',
} as const;

/**
 * Configuration for saving manager (lead) assignments
 */
export const SAVE_MANAGERS_CONFIG: SaveOperationConfig = {
  operationType: OperationType.Managers,
  assignMutationField: 'timeTrackingAssignGroupManagers',
  removeMutationField: 'timeTrackingRemoveGroupManagers',
  assignErrorSource: ErrorSource.AssignManagers,
  removeErrorSource: ErrorSource.RemoveManagers,
  countField: 'managerCount',
  noChangesLogMessage:
    'Component="EditGroupDrawer" Event="No manager changes to save"',
  errorLogMessage:
    'Component="EditGroupDrawer" Event="Failed to save manager changes"',
} as const;
