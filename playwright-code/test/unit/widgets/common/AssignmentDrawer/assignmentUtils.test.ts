import {
  processAssignmentChanges,
  transformTimeAgainstIds,
  buildHierarchicalTimeAgainstList,
} from 'src/js/widgets/common/AssignmentDrawer/assignmentUtils';
import {
  AssignmentChanges,
  AssignmentItem,
} from 'src/js/widgets/common/AssignmentDrawer/types';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

describe('assignmentUtils - processAssignmentChanges', () => {
  // Helper to create worker items
  const createWorker = (
    id: string,
    parentId: string | number,
    isSelected: boolean = false,
    timeForType: TimeTracking_TimeForType = TimeTracking_TimeForType.Employee,
  ): AssignmentItem => ({
    id,
    name: `Worker ${id}`,
    level: 1,
    hasChildren: false,
    isSelected,
    parentId,
    type: timeForType,
  });

  // Helper to create group items
  const createGroup = (
    id: string,
    isSelected: boolean = false,
    count: number = 0,
  ): AssignmentItem => ({
    id,
    name: `Group ${id}`,
    level: 0,
    hasChildren: true,
    isSelected,
    count,
  });

  // Helper to create AssignmentChanges with all required fields
  const createChanges = (
    newlyAssigned: Set<number | string> = new Set(),
    newlyUnassigned: Set<number | string> = new Set(),
    finalAssigned: Set<number | string> = new Set(),
  ): AssignmentChanges => ({
    currentSelections: new Set(),
    totalItems: 0,
    isSelectAll: false,
    newlyAssigned,
    newlyUnassigned,
    finalAssigned,
    finalUnassigned: new Set(),
    hasChanges: newlyAssigned.size > 0 || newlyUnassigned.size > 0,
    changeCount: newlyAssigned.size + newlyUnassigned.size,
  });

  describe('Group Selection - Assign', () => {
    it('should assign group ID only when entire group is selected', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1', false, 3),
        createWorker('w1', 'group-1'),
        createWorker('w2', 'group-1'),
        createWorker('w3', 'group-1'),
      ];

      const changes = createChanges(new Set(['group-1']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToAssign).toEqual(['1']);
      expect(result.workersToAssign).toEqual([]);
      expect(result.groupIdsToUnassign).toEqual([]);
      expect(result.workersToUnassign).toEqual([]);
    });

    it('should handle multiple groups being assigned', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1'),
        createWorker('w1', 'group-1'),
        createGroup('group-2'),
        createWorker('w2', 'group-2'),
      ];

      const changes = createChanges(new Set(['group-1', 'group-2']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToAssign).toEqual(
        expect.arrayContaining(['1', '2']),
      );
      expect(result.groupIdsToAssign.length).toBe(2);
      expect(result.workersToAssign).toEqual([]);
    });
  });

  describe('Group Selection - Unassign', () => {
    it('should unassign group ID and all workers when entire group is unselected', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1', true, 3),
        createWorker('w1', 'group-1', true),
        createWorker('w2', 'group-1', true),
        createWorker('w3', 'group-1', true),
      ];

      const changes = createChanges(new Set(), new Set(['group-1']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToUnassign).toEqual(['1']);
      expect(result.workersToUnassign).toHaveLength(3);
      expect(result.workersToUnassign).toEqual(
        expect.arrayContaining([
          { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
          { id: 'w2', timeForType: TimeTracking_TimeForType.Employee },
          { id: 'w3', timeForType: TimeTracking_TimeForType.Employee },
        ]),
      );
      expect(result.groupIdsToAssign).toEqual([]);
      expect(result.workersToAssign).toEqual([]);
    });

    it('should handle different worker types when unassigning group', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1'),
        createWorker('w1', 'group-1', true, TimeTracking_TimeForType.Employee),
        createWorker(
          'w2',
          'group-1',
          true,
          TimeTracking_TimeForType.LegacyQboUser,
        ),
        createWorker('w3', 'group-1', true, TimeTracking_TimeForType.Vendor),
      ];

      const changes = createChanges(new Set(), new Set(['group-1']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.workersToUnassign).toEqual(
        expect.arrayContaining([
          { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
          { id: 'w2', timeForType: TimeTracking_TimeForType.LegacyQboUser },
          { id: 'w3', timeForType: TimeTracking_TimeForType.Vendor },
        ]),
      );
    });
  });

  describe('Individual Worker Selection - Optimization to Group', () => {
    it('should optimize to group ID when selecting last worker completes the group', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1', false, 3),
        createWorker('w1', 'group-1', true),
        createWorker('w2', 'group-1', true),
        createWorker('w3', 'group-1', false), // Last one to be selected
      ];

      // finalAssigned should contain all workers that will be selected after changes
      const changes = createChanges(
        new Set(['w3']),
        new Set(),
        new Set(['w1', 'w2', 'w3']),
      );

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToAssign).toEqual(['1']);
      expect(result.workersToAssign).toEqual([]);
      expect(result.groupIdsToUnassign).toEqual([]);
      expect(result.workersToUnassign).toEqual([]);
    });

    it('should not optimize when worker is first in group to be selected', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1', false, 3),
        createWorker('w1', 'group-1', false),
        createWorker('w2', 'group-1', false),
        createWorker('w3', 'group-1', false),
      ];

      // finalAssigned contains only w1 (w2 and w3 are not selected)
      const changes = createChanges(
        new Set(['w1']),
        new Set(),
        new Set(['w1']),
      );

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToAssign).toEqual([]);
      expect(result.workersToAssign).toEqual([
        { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
      ]);
    });

    it('should not optimize when some workers remain unselected', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1', false, 3),
        createWorker('w1', 'group-1', true),
        createWorker('w2', 'group-1', false),
        createWorker('w3', 'group-1', false),
      ];

      // finalAssigned contains w1 and w2 (w3 is not selected)
      const changes = createChanges(
        new Set(['w2']),
        new Set(),
        new Set(['w1', 'w2']),
      );

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToAssign).toEqual([]);
      expect(result.workersToAssign).toEqual([
        { id: 'w2', timeForType: TimeTracking_TimeForType.Employee },
      ]);
    });
  });

  describe('Individual Worker Selection - Unassign from Group', () => {
    it('should include group ID and worker when unassigning worker from group', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1', true, 3),
        createWorker('w1', 'group-1', true),
        createWorker('w2', 'group-1', true),
        createWorker('w3', 'group-1', true),
      ];

      const changes = createChanges(new Set(), new Set(['w2']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToUnassign).toEqual(['1']);
      expect(result.workersToUnassign).toEqual([
        { id: 'w2', timeForType: TimeTracking_TimeForType.Employee },
      ]);
      expect(result.groupIdsToAssign).toEqual([]);
      expect(result.workersToAssign).toEqual([]);
    });

    it('should handle multiple workers being unassigned from same group', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1', true, 3),
        createWorker('w1', 'group-1', true),
        createWorker('w2', 'group-1', true),
        createWorker('w3', 'group-1', true),
      ];

      const changes = createChanges(new Set(), new Set(['w1', 'w2']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToUnassign).toEqual(['1']);
      expect(result.workersToUnassign).toHaveLength(2);
      expect(result.workersToUnassign).toEqual(
        expect.arrayContaining([
          { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
          { id: 'w2', timeForType: TimeTracking_TimeForType.Employee },
        ]),
      );
    });
  });

  describe('No-Group Workers', () => {
    it('should assign all no-group workers when no-group parent is selected', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('no-group', false, 2),
        createWorker('w1', 'no-group', false),
        createWorker('w2', 'no-group', false),
      ];

      const changes = createChanges(new Set(['no-group']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToAssign).toEqual([]);
      expect(result.workersToAssign).toHaveLength(2);
      expect(result.workersToAssign).toEqual(
        expect.arrayContaining([
          { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
          { id: 'w2', timeForType: TimeTracking_TimeForType.Employee },
        ]),
      );
    });

    it('should unassign all no-group workers when no-group parent is unselected', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('no-group', true, 2),
        createWorker('w1', 'no-group', true),
        createWorker('w2', 'no-group', true),
      ];

      const changes = createChanges(new Set(), new Set(['no-group']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToUnassign).toEqual([]);
      expect(result.workersToUnassign).toHaveLength(2);
      expect(result.workersToUnassign).toEqual(
        expect.arrayContaining([
          { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
          { id: 'w2', timeForType: TimeTracking_TimeForType.Employee },
        ]),
      );
    });

    it('should assign individual no-group worker without group ID', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createWorker('w1', 'no-group', false),
        createWorker('w2', 'no-group', false),
      ];

      const changes = createChanges(new Set(['w1']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToAssign).toEqual([]);
      expect(result.workersToAssign).toEqual([
        { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
      ]);
    });

    it('should unassign individual no-group worker without group ID', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createWorker('w1', 'no-group', true),
        createWorker('w2', 'no-group', true),
      ];

      const changes = createChanges(new Set(), new Set(['w1']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToUnassign).toEqual([]);
      expect(result.workersToUnassign).toEqual([
        { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
      ]);
    });
  });

  describe('Edge Cases', () => {
    test.each([
      {
        description: 'handles worker not found gracefully',
        hierarchicalItems: [createWorker('w1', 'group-1', false)],
        changes: createChanges(new Set(['nonexistent-worker'])),
      },
      {
        description: 'handles empty changes',
        hierarchicalItems: [
          createGroup('group-1'),
          createWorker('w1', 'group-1'),
        ],
        changes: createChanges(),
      },
      {
        description: 'handles empty hierarchical items',
        hierarchicalItems: [] as AssignmentItem[],
        changes: createChanges(new Set(['w1'])),
      },
    ])(
      'should $description — all output arrays empty',
      ({ hierarchicalItems, changes }) => {
        const result = processAssignmentChanges(changes, hierarchicalItems);

        expect(result.groupIdsToAssign).toEqual([]);
        expect(result.workersToAssign).toEqual([]);
        expect(result.groupIdsToUnassign).toEqual([]);
        expect(result.workersToUnassign).toEqual([]);
      },
    );

    it('should handle worker with no type defaulting to Employee', () => {
      const hierarchicalItems: AssignmentItem[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'no-group',
          // No type specified
        },
      ];

      const changes = createChanges(new Set(['w1']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.workersToAssign).toEqual([
        { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
      ]);
    });
  });

  describe('Complex Scenarios', () => {
    it('should correctly handle deselecting one worker from assign-all state', () => {
      // Scenario: G1 has W1, W2; G2 has W3; No-group has W4, W5
      // Initial: All 5 workers selected (assign to all)
      // User deselects W2
      // Expected: Assign G2, unassign W2, assign W1, W4, W5 individually
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1', true, 2),
        createWorker('w1', 'group-1', true),
        createWorker('w2', 'group-1', true),
        createGroup('group-2', true, 1),
        createWorker('w3', 'group-2', true),
        createGroup('no-group', true, 2),
        createWorker('w4', 'no-group', true),
        createWorker('w5', 'no-group', true),
      ];

      // After deselecting W2:
      // - newlyAssigned: w1, w3, w4, w5 (from assign-all logic)
      // - newlyUnassigned: w2
      // - finalAssigned: w1, w3, w4, w5 (everything except w2)
      const changes = createChanges(
        new Set(['w1', 'w3', 'w4', 'w5']),
        new Set(['w2']),
        new Set(['w1', 'w3', 'w4', 'w5']),
      );

      const result = processAssignmentChanges(changes, hierarchicalItems);

      // G2 should be optimized to group (all workers in G2 are selected)
      expect(result.groupIdsToAssign).toEqual(['2']);

      // W1, W4, W5 should be assigned individually (G1 is incomplete, no-group doesn't optimize)
      expect(result.workersToAssign).toEqual(
        expect.arrayContaining([
          { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
          { id: 'w4', timeForType: TimeTracking_TimeForType.Employee },
          { id: 'w5', timeForType: TimeTracking_TimeForType.Employee },
        ]),
      );
      expect(result.workersToAssign.length).toBe(3);

      // W2 should be unassigned with G1
      expect(result.groupIdsToUnassign).toEqual(['1']);
      expect(result.workersToUnassign).toEqual([
        { id: 'w2', timeForType: TimeTracking_TimeForType.Employee },
      ]);
    });

    it('should handle simultaneous assign and unassign operations', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1'),
        createWorker('w1', 'group-1', false),
        createWorker('w2', 'group-1', true),
        createGroup('group-2'),
        createWorker('w3', 'group-2', false),
        createWorker('w4', 'group-2', false), // Add second worker to group-2
      ];

      // Initial: w2 selected
      // After changes: w1, w3 selected; w2 unselected
      // finalAssigned: w1, w3 (w2 is being unassigned)
      const changes = createChanges(
        new Set(['w1', 'w3']),
        new Set(['w2']),
        new Set(['w1', 'w3']),
      );

      const result = processAssignmentChanges(changes, hierarchicalItems);

      // w1 does NOT complete group-1 (w2 is being unassigned), so sent as individual worker
      expect(result.workersToAssign).toEqual(
        expect.arrayContaining([
          { id: 'w1', timeForType: TimeTracking_TimeForType.Employee },
          { id: 'w3', timeForType: TimeTracking_TimeForType.Employee },
        ]),
      );
      expect(result.workersToAssign.length).toBe(2);
      expect(result.groupIdsToAssign).toEqual([]);
      // w2 is being unassigned from group-1
      expect(result.groupIdsToUnassign).toEqual(['1']);
      expect(result.workersToUnassign).toEqual([
        { id: 'w2', timeForType: TimeTracking_TimeForType.Employee },
      ]);
    });

    it('should handle mixed group and individual selections', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1'),
        createWorker('w1', 'group-1', false),
        createWorker('w2', 'no-group', false),
      ];

      const changes = createChanges(new Set(['group-1', 'w2']));

      const result = processAssignmentChanges(changes, hierarchicalItems);

      expect(result.groupIdsToAssign).toEqual(['1']);
      expect(result.workersToAssign).toEqual([
        { id: 'w2', timeForType: TimeTracking_TimeForType.Employee },
      ]);
    });

    it('should handle group with single worker optimization', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-1', false, 1),
        createWorker('w1', 'group-1', false),
      ];

      // finalAssigned contains w1 (the only worker in the group)
      const changes = createChanges(
        new Set(['w1']),
        new Set(),
        new Set(['w1']),
      );

      const result = processAssignmentChanges(changes, hierarchicalItems);

      // Should optimize to group since selecting the only worker
      expect(result.groupIdsToAssign).toEqual(['1']);
      expect(result.workersToAssign).toEqual([]);
    });

    it('should handle numeric IDs correctly', () => {
      const hierarchicalItems: AssignmentItem[] = [
        createGroup('group-123'),
        createWorker('456', 'group-123', false),
        createWorker('789', 'group-123', false), // Add second worker
      ];

      // finalAssigned contains only 456 (789 is not selected)
      const changes = createChanges(new Set([456]), new Set(), new Set([456])); // Numeric ID

      const result = processAssignmentChanges(changes, hierarchicalItems);

      // Worker 456 doesn't complete the group (789 is not selected), so sent as individual worker
      expect(result.workersToAssign).toEqual([
        { id: '456', timeForType: TimeTracking_TimeForType.Employee },
      ]);
      expect(result.groupIdsToAssign).toEqual([]);
    });
  });

  describe('transformTimeAgainstIds', () => {
    const createApiItem = (
      customerId: string | null,
      projectId: string | null,
    ) => ({
      timeAgainstContactDAS: {
        customer: customerId ? { id: customerId } : null,
        project: projectId ? { id: projectId } : null,
      },
    });

    it('should transform customer ID correctly', () => {
      const apiData = [createApiItem('CUST-123', null)];
      const ids = new Set<string | number>(['CUST-123']);

      const result = transformTimeAgainstIds(ids, apiData);

      expect(result).toEqual([{ customerId: 'CUST-123' }]);
    });

    it('should transform project ID with customer ID correctly', () => {
      const apiData = [createApiItem('CUST-123', 'PROJ-456')];
      const ids = new Set<string | number>(['PROJ-456']);

      const result = transformTimeAgainstIds(ids, apiData);

      expect(result).toEqual([
        { customerId: 'CUST-123', projectId: 'PROJ-456' },
      ]);
    });

    it('should transform multiple IDs correctly', () => {
      const apiData = [
        createApiItem('CUST-123', null),
        createApiItem('CUST-123', 'PROJ-456'),
        createApiItem('CUST-789', 'PROJ-789'),
      ];
      const ids = new Set<string | number>([
        'CUST-123',
        'PROJ-456',
        'PROJ-789',
      ]);

      const result = transformTimeAgainstIds(ids, apiData);

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ customerId: 'CUST-123' });
      expect(result).toContainEqual({
        customerId: 'CUST-123',
        projectId: 'PROJ-456',
      });
      expect(result).toContainEqual({
        customerId: 'CUST-789',
        projectId: 'PROJ-789',
      });
    });

    test.each([
      {
        description: 'missing apiData',
        apiData: undefined as any,
      },
      {
        description: 'empty apiData array',
        apiData: [] as any[],
      },
    ])(
      'should return fallback customerId result when $description',
      ({ apiData }) => {
        const ids = new Set<string | number>(['CUST-123']);
        const result = transformTimeAgainstIds(ids, apiData);
        expect(result).toEqual([{ customerId: 'CUST-123' }]);
      },
    );

    it('should handle ID not found in apiData (fallback)', () => {
      const apiData = [createApiItem('CUST-999', null)];
      const ids = new Set<string | number>(['CUST-123']);

      const result = transformTimeAgainstIds(ids, apiData);

      expect(result).toEqual([{ customerId: 'CUST-123' }]);
    });

    it('should handle numeric IDs by converting to string', () => {
      const apiData = [createApiItem('123', null)];
      const ids = new Set<string | number>([123]);

      const result = transformTimeAgainstIds(ids, apiData);

      expect(result).toEqual([{ customerId: '123' }]);
    });

    it('should handle mixed customer and project IDs', () => {
      const apiData = [
        createApiItem('CUST-1', null),
        createApiItem('CUST-2', 'PROJ-1'),
      ];
      const ids = new Set<string | number>(['CUST-1', 'PROJ-1']);

      const result = transformTimeAgainstIds(ids, apiData);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ customerId: 'CUST-1' });
      expect(result).toContainEqual({
        customerId: 'CUST-2',
        projectId: 'PROJ-1',
      });
    });

    it('should handle item with project but no customer (edge case)', () => {
      const apiData = [
        {
          timeAgainstContactDAS: {
            customer: null,
            project: { id: 'PROJ-456' },
          },
        },
      ];
      const ids = new Set<string | number>(['PROJ-456']);

      const result = transformTimeAgainstIds(ids, apiData);

      // Should fallback to customerId when structure is unexpected
      expect(result).toEqual([{ customerId: 'PROJ-456' }]);
    });

    it('should handle empty ID set', () => {
      const apiData = [createApiItem('CUST-123', null)];
      const ids = new Set<string | number>();

      const result = transformTimeAgainstIds(ids, apiData);

      expect(result).toEqual([]);
    });

    it('should match by customerId when ID is a customer', () => {
      const apiData = [createApiItem('CUST-100', null)];
      const ids = new Set<string | number>(['CUST-100']);

      const result = transformTimeAgainstIds(ids, apiData);

      expect(result).toEqual([{ customerId: 'CUST-100' }]);
    });

    it('should match by projectId when ID is a project', () => {
      const apiData = [createApiItem('CUST-200', 'PROJ-200')];
      const ids = new Set<string | number>(['PROJ-200']);

      const result = transformTimeAgainstIds(ids, apiData);

      expect(result).toEqual([
        { customerId: 'CUST-200', projectId: 'PROJ-200' },
      ]);
    });
  });

  describe('buildHierarchicalTimeAgainstList', () => {
    // Helper to create edge objects
    const createEdge = (
      id: string,
      isCustomer: boolean,
      parentId: string | null = null,
      displayName: string = '',
    ) => ({
      node: {
        timeAgainst: {
          timeAgainstContactDAS: {
            customer: isCustomer ? { id } : null,
            project: !isCustomer ? { id } : null,
          },
          displayName,
          parentId,
        },
      },
    });

    describe('Parent Node Actions', () => {
      it('should include parent and all descendants when action is on parent', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Customer 1'), // Root customer
          createEdge('C2', true, 'C1', 'Sub Customer'), // Child customer
          createEdge('P1', false, 'C2', 'Project 1'), // Grandchild project
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[0], allEdges);

        expect(result).toHaveLength(3);
        expect(result).toContainEqual({ customerId: 'C1' });
        expect(result).toContainEqual({ customerId: 'C2' });
        expect(result).toContainEqual({ customerId: 'C2', projectId: 'P1' });
      });

      it('should handle parent with multiple children', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Parent'),
          createEdge('C2', true, 'C1', 'Child 1'),
          createEdge('C3', true, 'C1', 'Child 2'),
          createEdge('P1', false, 'C1', 'Project 1'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[0], allEdges);

        expect(result).toHaveLength(4);
        expect(result).toContainEqual({ customerId: 'C1' });
        expect(result).toContainEqual({ customerId: 'C2' });
        expect(result).toContainEqual({ customerId: 'C3' });
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P1' });
      });

      it('should handle deep hierarchy (5 levels)', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Level 1'),
          createEdge('C2', true, 'C1', 'Level 2'),
          createEdge('C3', true, 'C2', 'Level 3'),
          createEdge('C4', true, 'C3', 'Level 4'),
          createEdge('C5', true, 'C4', 'Level 5'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[0], allEdges);

        expect(result).toHaveLength(5);
        expect(result).toContainEqual({ customerId: 'C1' });
        expect(result).toContainEqual({ customerId: 'C2' });
        expect(result).toContainEqual({ customerId: 'C3' });
        expect(result).toContainEqual({ customerId: 'C4' });
        expect(result).toContainEqual({ customerId: 'C5' });
      });

      it('should handle parent with projects at different levels', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Parent Customer'),
          createEdge('C2', true, 'C1', 'Sub Customer'),
          createEdge('P1', false, 'C1', 'Project Level 1'),
          createEdge('P2', false, 'C2', 'Project Level 2'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[0], allEdges);

        expect(result).toHaveLength(4);
        expect(result).toContainEqual({ customerId: 'C1' });
        expect(result).toContainEqual({ customerId: 'C2' });
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P1' });
        expect(result).toContainEqual({ customerId: 'C2', projectId: 'P2' });
      });
    });

    describe('Child Node Actions', () => {
      it('should include child and all ancestors when action is on child', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Root Customer'),
          createEdge('C2', true, 'C1', 'Sub Customer'),
          createEdge('C3', true, 'C2', 'Sub Sub Customer'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[2], allEdges);

        expect(result).toHaveLength(3);
        expect(result).toContainEqual({ customerId: 'C3' });
        expect(result).toContainEqual({ customerId: 'C2' });
        expect(result).toContainEqual({ customerId: 'C1' });
      });

      it('should NOT include siblings when action is on child', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Parent'),
          createEdge('C2', true, 'C1', 'Child 1'),
          createEdge('C3', true, 'C1', 'Child 2 (Sibling)'),
          createEdge('C4', true, 'C2', 'Grandchild'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[3], allEdges);

        expect(result).toHaveLength(3);
        expect(result).toContainEqual({ customerId: 'C4' });
        expect(result).toContainEqual({ customerId: 'C2' });
        expect(result).toContainEqual({ customerId: 'C1' });
        // Should NOT include C3 (sibling)
        expect(result).not.toContainEqual({ customerId: 'C3' });
      });

      it('should include all ancestors up to root', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Level 1'),
          createEdge('C2', true, 'C1', 'Level 2'),
          createEdge('C3', true, 'C2', 'Level 3'),
          createEdge('C4', true, 'C3', 'Level 4'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[3], allEdges);

        expect(result).toHaveLength(4);
        expect(result).toContainEqual({ customerId: 'C4' });
        expect(result).toContainEqual({ customerId: 'C3' });
        expect(result).toContainEqual({ customerId: 'C2' });
        expect(result).toContainEqual({ customerId: 'C1' });
      });
    });

    describe('Project Node Handling', () => {
      it('should find parent customer ID for project', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Customer'),
          createEdge('P1', false, 'C1', 'Project'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[1], allEdges);

        expect(result).toHaveLength(2);
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P1' });
        expect(result).toContainEqual({ customerId: 'C1' });
      });

      it('should handle project with nested customer hierarchy', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Root Customer'),
          createEdge('C2', true, 'C1', 'Sub Customer'),
          createEdge('P1', false, 'C2', 'Project'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[2], allEdges);

        expect(result).toHaveLength(3);
        expect(result).toContainEqual({ customerId: 'C2', projectId: 'P1' });
        expect(result).toContainEqual({ customerId: 'C2' });
        expect(result).toContainEqual({ customerId: 'C1' });
      });

      it('should handle action on parent that has project children', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Customer'),
          createEdge('P1', false, 'C1', 'Project 1'),
          createEdge('P2', false, 'C1', 'Project 2'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[0], allEdges);

        expect(result).toHaveLength(3);
        expect(result).toContainEqual({ customerId: 'C1' });
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P1' });
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P2' });
      });

      it('should handle complex mixed hierarchy', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Root'),
          createEdge('C2', true, 'C1', 'Sub Customer'),
          createEdge('P1', false, 'C1', 'Project at Level 1'),
          createEdge('P2', false, 'C2', 'Project at Level 2'),
          createEdge('C3', true, 'C2', 'Sub Sub Customer'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[0], allEdges);

        expect(result).toHaveLength(5);
        expect(result).toContainEqual({ customerId: 'C1' });
        expect(result).toContainEqual({ customerId: 'C2' });
        expect(result).toContainEqual({ customerId: 'C3' });
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P1' });
        expect(result).toContainEqual({ customerId: 'C2', projectId: 'P2' });
      });
    });

    describe('Edge Cases', () => {
      it('should handle single node with no children or parents', () => {
        const allEdges = [createEdge('C1', true, null, 'Single Customer')];

        const result = buildHierarchicalTimeAgainstList(allEdges[0], allEdges);

        expect(result).toHaveLength(1);
        expect(result).toContainEqual({ customerId: 'C1' });
      });

      it('should handle empty allEdges array', () => {
        const nodeEdge = createEdge('C1', true, null, 'Customer');

        const result = buildHierarchicalTimeAgainstList(nodeEdge, []);

        expect(result).toHaveLength(1);
        expect(result).toContainEqual({ customerId: 'C1' });
      });

      it('should not duplicate nodes', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Parent'),
          createEdge('C2', true, 'C1', 'Child'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[0], allEdges);

        // Check for duplicates by comparing lengths
        const uniqueResults = Array.from(
          new Set(result.map((r) => JSON.stringify(r))),
        ).map((s) => JSON.parse(s));

        expect(result.length).toBe(uniqueResults.length);
      });

      it('should handle node with missing parent (broken hierarchy)', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Root'),
          createEdge('C2', true, 'MISSING', 'Orphan Child'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[1], allEdges);

        // Should still include the node itself even if parent not found
        expect(result).toContainEqual({ customerId: 'C2' });
      });

      it('should handle project with deeply nested parent customer', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Level 1'),
          createEdge('C2', true, 'C1', 'Level 2'),
          createEdge('C3', true, 'C2', 'Level 3'),
          createEdge('P1', false, 'C3', 'Project at Level 4'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[3], allEdges);

        expect(result).toContainEqual({ customerId: 'C3', projectId: 'P1' });
        expect(result).toContainEqual({ customerId: 'C3' });
        expect(result).toContainEqual({ customerId: 'C2' });
        expect(result).toContainEqual({ customerId: 'C1' });
      });
    });

    describe('Real-world Test Data Scenarios', () => {
      it('should handle AbcCus hierarchy from test.json', () => {
        const allEdges = [
          createEdge('18', true, null, 'AbcCus'),
          createEdge('20', true, '18', 'PqrProj1'),
          createEdge('21', true, '18', 'TestSubCustomer'),
          createEdge('43', true, '21', '4th-level'),
          createEdge('46', true, '43', '5th-level-1'),
          createEdge('50', true, '46', 'Testing'),
          createEdge('45', true, '43', 'Test-5th-level'),
          createEdge('44', false, '21', '5th-level project'),
          createEdge('22', false, '21', 'SubCusProject'),
          createEdge('23', false, '21', 'Test Project 1224'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[0], allEdges);

        // Should include all descendants
        expect(result).toHaveLength(10);
        expect(result).toContainEqual({ customerId: '18' });
        expect(result).toContainEqual({ customerId: '20' });
        expect(result).toContainEqual({ customerId: '21' });
        expect(result).toContainEqual({ customerId: '43' });
        expect(result).toContainEqual({ customerId: '46' });
        expect(result).toContainEqual({ customerId: '50' });
        expect(result).toContainEqual({ customerId: '45' });
        expect(result).toContainEqual({ customerId: '21', projectId: '44' });
        expect(result).toContainEqual({ customerId: '21', projectId: '22' });
        expect(result).toContainEqual({ customerId: '21', projectId: '23' });
      });

      it('should handle action on 5th level child from test.json', () => {
        const allEdges = [
          createEdge('18', true, null, 'AbcCus'),
          createEdge('21', true, '18', 'TestSubCustomer'),
          createEdge('43', true, '21', '4th-level'),
          createEdge('46', true, '43', '5th-level-1'),
          createEdge('50', true, '46', 'Testing'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[4], allEdges);

        // Should include all ancestors, no siblings
        expect(result).toHaveLength(5);
        expect(result).toContainEqual({ customerId: '50' });
        expect(result).toContainEqual({ customerId: '46' });
        expect(result).toContainEqual({ customerId: '43' });
        expect(result).toContainEqual({ customerId: '21' });
        expect(result).toContainEqual({ customerId: '18' });
      });

      it('should handle nested projects (project under project scenario)', () => {
        // Edge case: project with parent that is also a project (rare but possible)
        const allEdges = [
          createEdge('C1', true, null, 'Root Customer'),
          createEdge('P1', false, 'C1', 'Parent Project'),
          createEdge('P2', false, 'P1', 'Child Project'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[2], allEdges);

        // Should find the root customer through the parent project
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P2' });
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P1' });
        expect(result).toContainEqual({ customerId: 'C1' });
      });

      it('should handle edge with malformed data (no customer or project)', () => {
        const malformedEdge = {
          node: {
            timeAgainst: {
              timeAgainstContactDAS: {
                customer: null,
                project: null,
              },
              displayName: 'Malformed',
              parentId: null,
            },
          },
        };

        const result = buildHierarchicalTimeAgainstList(malformedEdge, [
          malformedEdge,
        ]);

        // When node has no valid ID, it won't be added to result
        expect(result).toHaveLength(0);
      });

      it('should handle project without parent in hierarchy', () => {
        const orphanProject = createEdge(
          'P1',
          false,
          'MISSING_PARENT',
          'Orphan Project',
        );

        const result = buildHierarchicalTimeAgainstList(orphanProject, [
          orphanProject,
        ]);

        // Should include the project with empty customerId fallback
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ customerId: '', projectId: 'P1' });
      });

      it('should handle edge case where both customer and project IDs exist but with null values', () => {
        // Edge case to cover the fallback in createAssignment
        const edgeWithNullIds = {
          node: {
            timeAgainst: {
              timeAgainstContactDAS: {
                customer: { id: null },
                project: { id: null },
              },
              displayName: 'Null IDs',
              parentId: null,
            },
          },
        };

        const result = buildHierarchicalTimeAgainstList(edgeWithNullIds, [
          edgeWithNullIds,
        ]);

        // When IDs are null, getNodeId returns empty string, so nothing is added
        expect(result).toHaveLength(0);
      });
    });

    describe('Coverage for helper functions', () => {
      it('should cover findParentCustomerId when node is a customer', () => {
        const allEdges = [
          createEdge('C1', true, null, 'Customer'),
          createEdge('P1', false, 'C1', 'Project'),
        ];

        // Action on project should call findParentCustomerId which returns customer.id
        const result = buildHierarchicalTimeAgainstList(allEdges[1], allEdges);

        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P1' });
        expect(result).toContainEqual({ customerId: 'C1' });
      });

      it('should handle direct customer node in findParentCustomerId', () => {
        // This tests the branch where customer?.id && !project?.id returns early
        const allEdges = [
          createEdge('C1', true, null, 'Parent Customer'),
          createEdge('C2', true, 'C1', 'Child Customer'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[0], allEdges);

        // Should include both customers
        expect(result).toContainEqual({ customerId: 'C1' });
        expect(result).toContainEqual({ customerId: 'C2' });
      });

      it('should cover recursive project hierarchy traversal', () => {
        // Multi-level project nesting to trigger recursive findParentCustomerId
        const allEdges = [
          createEdge('C1', true, null, 'Customer'),
          createEdge('P1', false, 'C1', 'Project Level 1'),
          createEdge('P2', false, 'P1', 'Project Level 2'),
          createEdge('P3', false, 'P2', 'Project Level 3'),
        ];

        const result = buildHierarchicalTimeAgainstList(allEdges[3], allEdges);

        // Should recursively find C1 as the parent customer for all projects
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P3' });
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P2' });
        expect(result).toContainEqual({ customerId: 'C1', projectId: 'P1' });
        expect(result).toContainEqual({ customerId: 'C1' });
      });
    });
  });
});
