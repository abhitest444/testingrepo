import {
  AssignmentItem,
  AssignmentChanges,
  AssignmentType,
  AssignmentDrawerConfig,
  FetchParams,
  FetchResult,
} from 'src/js/widgets/common/AssignmentDrawer/types';

describe('AssignmentDrawer Types', () => {
  describe('AssignmentType', () => {
    it('supports CustomerAssignment', () => {
      const type: AssignmentType = 'CustomerAssignment';
      expect(type).toBe('CustomerAssignment');
    });

    it('supports WorkerAssignment', () => {
      const type: AssignmentType = 'WorkerAssignment';
      expect(type).toBe('WorkerAssignment');
    });

    it('supports FieldAssignment', () => {
      const type: AssignmentType = 'FieldAssignment';
      expect(type).toBe('FieldAssignment');
    });
  });

  describe('AssignmentItem', () => {
    it('supports string IDs', () => {
      const item: AssignmentItem = {
        id: 'string-id',
        name: 'Test Item',
        level: 0,
        hasChildren: false,
        isSelected: false,
      };
      expect(typeof item.id).toBe('string');
    });

    it('supports number IDs', () => {
      const item: AssignmentItem = {
        id: 123,
        name: 'Test Item',
        level: 0,
        hasChildren: false,
        isSelected: false,
      };
      expect(typeof item.id).toBe('number');
    });

    it('supports optional parentId as string', () => {
      const item: AssignmentItem = {
        id: 'child-id',
        name: 'Child Item',
        level: 1,
        parentId: 'parent-id',
        hasChildren: false,
        isSelected: true,
      };
      expect(item.parentId).toBe('parent-id');
    });

    it('supports optional parentId as number', () => {
      const item: AssignmentItem = {
        id: 456,
        name: 'Child Item',
        level: 1,
        parentId: 123,
        hasChildren: true,
        isSelected: false,
      };
      expect(item.parentId).toBe(123);
    });

    it('supports optional count', () => {
      const item: AssignmentItem = {
        id: 'with-count',
        name: 'Item With Count',
        level: 0,
        hasChildren: true,
        isSelected: false,
        count: 5,
      };
      expect(item.count).toBe(5);
    });

    it('works without optional fields', () => {
      const item: AssignmentItem = {
        id: 'minimal',
        name: 'Minimal Item',
        level: 0,
        hasChildren: false,
        isSelected: false,
      };
      expect(item.parentId).toBeUndefined();
      expect(item.count).toBeUndefined();
    });
  });

  describe('AssignmentChanges', () => {
    it('supports string IDs in Sets', () => {
      const changes: AssignmentChanges = {
        currentSelections: new Set(['id1', 'id2']),
        totalItems: 2,
        isSelectAll: false,
        newlyAssigned: new Set(['id1']),
        newlyUnassigned: new Set(),
        finalAssigned: new Set(['id1', 'id2']),
        finalUnassigned: new Set(),
        hasChanges: true,
        changeCount: 1,
      };
      expect(changes.currentSelections.has('id1')).toBe(true);
    });

    it('supports number IDs in Sets', () => {
      const changes: AssignmentChanges = {
        currentSelections: new Set([1, 2]),
        totalItems: 2,
        isSelectAll: false,
        newlyAssigned: new Set([1]),
        newlyUnassigned: new Set(),
        finalAssigned: new Set([1, 2]),
        finalUnassigned: new Set(),
        hasChanges: true,
        changeCount: 1,
      };
      expect(changes.currentSelections.has(1)).toBe(true);
    });

    it('handles select all scenario', () => {
      const changes: AssignmentChanges = {
        currentSelections: new Set([1, 2, 3]),
        totalItems: 3,
        isSelectAll: true,
        newlyAssigned: new Set([1, 2, 3]),
        newlyUnassigned: new Set(),
        finalAssigned: new Set([1, 2, 3]),
        finalUnassigned: new Set(),
        hasChanges: true,
        changeCount: 3,
      };
      expect(changes.isSelectAll).toBe(true);
      expect(changes.changeCount).toBe(3);
    });

    it('handles unassignment scenario', () => {
      const changes: AssignmentChanges = {
        currentSelections: new Set([1]),
        totalItems: 2,
        isSelectAll: false,
        newlyAssigned: new Set(),
        newlyUnassigned: new Set([2]),
        finalAssigned: new Set([1]),
        finalUnassigned: new Set([2]),
        hasChanges: true,
        changeCount: 1,
      };
      expect(changes.newlyUnassigned.has(2)).toBe(true);
    });

    it('handles no changes scenario', () => {
      const changes: AssignmentChanges = {
        currentSelections: new Set(),
        totalItems: 0,
        isSelectAll: false,
        newlyAssigned: new Set(),
        newlyUnassigned: new Set(),
        finalAssigned: new Set(),
        finalUnassigned: new Set(),
        hasChanges: false,
        changeCount: 0,
      };
      expect(changes.hasChanges).toBe(false);
    });
  });

  describe('FetchParams', () => {
    it('supports all optional parameters', () => {
      const params: FetchParams = {
        page: 1,
        pageSize: 50,
        searchTerm: 'test',
      };
      expect(params.page).toBe(1);
      expect(params.pageSize).toBe(50);
      expect(params.searchTerm).toBe('test');
    });

    it('works with empty object', () => {
      const params: FetchParams = {};
      expect(params.page).toBeUndefined();
      expect(params.pageSize).toBeUndefined();
      expect(params.searchTerm).toBeUndefined();
    });
  });

  describe('FetchResult', () => {
    it('returns items and totalCount', () => {
      const result: FetchResult = {
        items: [
          {
            id: 1,
            name: 'Item 1',
            level: 0,
            hasChildren: false,
            isSelected: false,
          },
          {
            id: 2,
            name: 'Item 2',
            level: 0,
            hasChildren: false,
            isSelected: true,
          },
        ],
        totalCount: 2,
      };
      expect(result.items.length).toBe(2);
      expect(result.totalCount).toBe(2);
    });

    it('supports empty results', () => {
      const result: FetchResult = {
        items: [],
        totalCount: 0,
      };
      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('AssignmentDrawerConfig', () => {
    it('supports complete configuration with all required fields', () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'client',
        },
        ui: {
          searchPlaceholder: 'Search...',
          searchSupported: true,
          searchExpandable: false,
        },
        table: {
          columns: [{ key: 'name', header: 'Name' }],
          sortable: true,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 50,
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.assignmentType).toBe('CustomerAssignment');
      expect(config.dataSource.searchMode).toBe('client');
    });

    it('supports server-side search mode', () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'WorkerAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'server',
        },
        ui: {
          searchPlaceholder: 'Search workers',
          searchSupported: true,
          searchExpandable: true,
        },
        table: {
          columns: [],
          sortable: false,
        },
        pagination: {
          enabled: false,
          defaultPageSize: 25,
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.dataSource.searchMode).toBe('server');
      expect(config.ui.searchExpandable).toBe(true);
    });

    it('supports optional UI fieldName', () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'FieldAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'client',
        },
        ui: {
          searchPlaceholder: 'Search',
          searchSupported: true,
          searchExpandable: false,
          fieldName: 'Project',
        },
        table: {
          columns: [],
          sortable: true,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 50,
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.ui.fieldName).toBe('Project');
    });

    it('supports table with column widths', () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'client',
        },
        ui: {
          searchPlaceholder: 'Search',
          searchSupported: true,
          searchExpandable: false,
        },
        table: {
          columns: [
            { key: 'name', header: 'Name', width: '60%' },
            { key: 'count', header: 'Count', width: '40%' },
          ],
          sortable: true,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 50,
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.table.columns[0].width).toBe('60%');
    });

    it('supports optional table defaultSortBy', () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'client',
        },
        ui: {
          searchPlaceholder: 'Search',
          searchSupported: true,
          searchExpandable: false,
        },
        table: {
          columns: [],
          sortable: true,
          defaultSortBy: 'name',
        },
        pagination: {
          enabled: true,
          defaultPageSize: 50,
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.table.defaultSortBy).toBe('name');
    });

    it('supports optional table defaultExpanded', () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'client',
        },
        ui: {
          searchPlaceholder: 'Search',
          searchSupported: true,
          searchExpandable: false,
        },
        table: {
          columns: [],
          sortable: true,
          defaultExpanded: true,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 50,
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.table.defaultExpanded).toBe(true);
    });

    it('supports optional table hierarchicalSelection', () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'client',
        },
        ui: {
          searchPlaceholder: 'Search',
          searchSupported: true,
          searchExpandable: false,
        },
        table: {
          columns: [],
          sortable: true,
          hierarchicalSelection: true,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 50,
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.table.hierarchicalSelection).toBe(true);
    });

    it('supports optional pagination pageSizeOptions', () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'client',
        },
        ui: {
          searchPlaceholder: 'Search',
          searchSupported: true,
          searchExpandable: false,
        },
        table: {
          columns: [],
          sortable: true,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 50,
          pageSizeOptions: [25, 50, 100],
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.pagination.pageSizeOptions).toEqual([25, 50, 100]);
    });

    it('supports optional validation maxSelections', () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'client',
        },
        ui: {
          searchPlaceholder: 'Search',
          searchSupported: true,
          searchExpandable: false,
        },
        table: {
          columns: [],
          sortable: true,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 50,
        },
        validation: {
          maxSelections: 10,
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.validation?.maxSelections).toBe(10);
    });

    it('supports optional validation minSelections', () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'client',
        },
        ui: {
          searchPlaceholder: 'Search',
          searchSupported: true,
          searchExpandable: false,
        },
        table: {
          columns: [],
          sortable: true,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 50,
        },
        validation: {
          minSelections: 1,
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.validation?.minSelections).toBe(1);
    });

    it('supports optional validation customValidator', () => {
      const validator = (selections: Set<string>) =>
        selections.size > 0 ? null : 'Must select at least one';
      const config: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: async () => ({ items: [], totalCount: 0 }),
          searchMode: 'client',
        },
        ui: {
          searchPlaceholder: 'Search',
          searchSupported: true,
          searchExpandable: false,
        },
        table: {
          columns: [],
          sortable: true,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 50,
        },
        validation: {
          customValidator: validator,
        },
        callbacks: {
          onSave: async () => {},
        },
      };
      expect(config.validation?.customValidator).toBe(validator);
      expect(config.validation?.customValidator?.(new Set())).toBe(
        'Must select at least one',
      );
    });
  });
});
