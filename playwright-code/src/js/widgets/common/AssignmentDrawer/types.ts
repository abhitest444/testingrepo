export type AssignmentType =
  | 'CustomerAssignment'
  | 'WorkerAssignment'
  | 'FieldAssignment';

export interface AssignmentItem {
  id: number | string; // Can be number or string ID
  name: string; // Only name field, no displayName
  level: number; // 0 = Parent, 1 = Child, 2 = Sub-child, 3 = Sub-sub-child, 4 = Sub-sub-sub-child
  parentId?: number | string; // Reference to parent item ID
  hasChildren: boolean;
  isSelected: boolean;
  count?: number;
  type?: string; // Optional type - Use enum values as strings (e.g., TimeTracking_TimeForType enum values)
  metadata?: Record<string, any>; // Optional metadata for storing additional info
  disabled?: boolean; // Optional flag to disable item selection
}

export interface AssignmentDrawerConfig {
  // Assignment type for text configuration
  assignmentType: AssignmentType;

  // Data fetching - Parent controls the API
  dataSource: {
    fetchData: (params: FetchParams) => Promise<FetchResult>;
    searchMode: 'client' | 'server';
  };

  // UI Configuration
  ui: {
    searchPlaceholder: string;
    searchSupported: boolean;
    searchExpandable: boolean; // Input → textarea toggle
    fieldName?: string; // The name of the field being assigned to
  };

  // Table Configuration
  table: {
    columns: Array<{
      key: string;
      header: string;
      width?: string;
    }>;
    sortable: boolean;
    defaultSortBy?: string;
    defaultExpanded?: boolean; // Control whether parent items are expanded by default
    hierarchicalSelection?: boolean; // Control whether parent-child selection is linked
  };

  // Pagination Configuration
  pagination: {
    enabled: boolean;
    defaultPageSize: number;
    pageSizeOptions?: number[];
  };

  // Business Logic
  validation?: {
    maxSelections?: number;
    minSelections?: number;
    customValidator?: (selections: Set<string>) => string | null;
  };

  // Advanced Callbacks
  callbacks: {
    onSave: (changes: AssignmentChanges) => Promise<void>;
    onSearch?: (searchValue: string) => void; // Optional callback for search tracking
  };
}

export interface FetchParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export interface FetchResult {
  items: AssignmentItem[];
  totalCount: number;
}

export interface AssignmentChanges {
  currentSelections: Set<number | string>;
  totalItems: number;
  isSelectAll: boolean;
  newlyAssigned: Set<number | string>;
  newlyUnassigned: Set<number | string>;
  finalAssigned: Set<number | string>;
  finalUnassigned: Set<number | string>;
  hasChanges: boolean;
  changeCount: number;
}
