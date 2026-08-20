/**
 * Search Filter Bar Types
 * Type definitions for search, filter dropdown, and view toggle components
 */

/**
 * View type options for toggling between workers and groups view
 */
export enum ViewType {
  WORKERS = 'workers',
  GROUPS = 'groups',
}

/**
 * Worker type options for filtering
 */
export enum WorkerType {
  ALL = 'ALL',
  EMPLOYEE = 'EMPLOYEE',
  LEGACY_QBO_USER = 'LEGACY_QBO_USER',
  VENDOR = 'VENDOR',
}

/**
 * Props for SearchFilterBar component
 * Contains all handlers for search, filter, and view toggle interactions
 */
export interface SearchFilterBarProps {
  /** Current search text value */
  searchText: string;
  /** Handler for search text changes */
  onSearchChange: (text: string) => void;
  /** Current worker type filter value */
  workerType: WorkerType;
  /** Handler for worker type filter changes */
  onWorkerTypeChange: (type: WorkerType) => void;
  /** Current view by groups toggle state */
  viewByGroups: boolean;
  /** Handler for view toggle changes */
  onViewToggle: (checked: boolean) => void;
}

/**
 * Props for WorkerTypeFilter component
 */
export interface WorkerTypeFilterProps {
  /** Current filter value */
  value: WorkerType;
  /** Handler for filter changes */
  onChange: (value: WorkerType) => void;
}

/**
 * Props for ViewToggle component
 */
export interface ViewToggleProps {
  /** Current toggle state */
  checked: boolean;
  /** Handler for toggle changes */
  onChange: (checked: boolean) => void;
}
