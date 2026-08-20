import {
  TimeTracking_WorkerOrderBy,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';

/**
 * Minimal worker interface representing a selectable worker in the table.
 * Aligned with TimeTracking_Worker GraphQL type but kept minimal for flexibility.
 */
export interface SelectableWorker {
  /** Unique worker identifier */
  id: string;
  /** Worker type: EMPLOYEE, VENDOR, or LEGACY_QBO_USER */
  type: TimeTracking_TimeForType;
  /** Whether the worker is active */
  isActive: boolean;
  /** Worker's first name */
  firstName?: string | null;
  /** Worker's last name */
  lastName?: string | null;
  /** Display name (preferred for UI) */
  displayName?: string | null;
  /** Group membership info */
  memberOfGroup?: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
}

/**
 * Pagination state and controls
 */
export interface PaginationProps {
  /** Whether there's a next page available */
  hasNextPage: boolean;
  /** Whether there's a previous page available */
  hasPreviousPage: boolean;
  /** Handler for navigating to next page */
  onNextPage: () => void;
  /** Handler for navigating to previous page */
  onPreviousPage: () => void;
  /** Current page number (1-indexed) for display */
  currentPage?: number;
  /** Total count of items (if known) */
  totalCount?: number | null;
  /** Whether pagination is loading */
  isLoading?: boolean;
}

/**
 * Internationalization labels for the table
 */
export interface WorkerSelectionTableLabels {
  /** Header text for name column */
  nameColumnHeader: string;
  /** Header text for group column */
  groupColumnHeader: string;
  /** Aria label for select all checkbox */
  selectAllLabel: string;
  /** Aria label formatter for individual worker checkbox */
  selectWorkerLabel: (workerName: string) => string;
  /** Empty state message when no workers match filters */
  emptyStateMessage: string;
  /** Loading state message */
  loadingMessage: string;
  /** Text shown when worker has no group */
  noGroupText: string;
  /** Previous page button text */
  previousPageLabel: string;
  /** Next page button text */
  nextPageLabel: string;
}

/**
 * Props for the stateless WorkerSelectionTable component.
 * Follows controlled component pattern - all state managed externally.
 */
export interface WorkerSelectionTableProps {
  /** List of workers to display */
  workers: SelectableWorker[];
  /** Set of selected worker IDs */
  selectedIds: Set<string>;
  /** Handler called when selection changes */
  onSelectionChange: (workerId: string, isSelected: boolean) => void;
  /** Handler for select all/none toggle */
  onSelectAllChange: (selectAll: boolean) => void;
  /** Whether all visible workers are selected */
  allSelected: boolean;
  /** Whether some (but not all) visible workers are selected */
  someSelected: boolean;
  /** Current sort order */
  sortOrder: TimeTracking_WorkerOrderBy;
  /** Handler for sort changes */
  onSortChange: (order: TimeTracking_WorkerOrderBy) => void;
  /** Whether the table is in loading state */
  isLoading: boolean;
  /** i18n labels */
  labels: WorkerSelectionTableLabels;
  /** Pagination controls (optional, renders pagination when provided) */
  pagination?: PaginationProps;
  /** Table summary for accessibility */
  tableSummary?: string;
  /** Test ID prefix for data-testid attributes */
  testIdPrefix?: string;
}

/**
 * Return type for useWorkerSelectionBase hook
 */
export interface WorkerSelectionBaseResult {
  /** Set of currently selected worker IDs */
  selectedIds: Set<string>;
  /** Whether all workers in the provided list are selected */
  allSelected: boolean;
  /** Whether some (but not all) workers are selected */
  someSelected: boolean;
  /** Toggle selection for a single worker */
  toggleWorker: (workerId: string) => void;
  /** Select or deselect all workers in the provided list */
  selectAll: (workers: SelectableWorker[], select: boolean) => void;
  /** Replace the entire selection (for external updates) */
  setSelectedIds: (ids: string[]) => void;
  /** Get selected IDs as array */
  getSelectedArray: () => string[];
}
