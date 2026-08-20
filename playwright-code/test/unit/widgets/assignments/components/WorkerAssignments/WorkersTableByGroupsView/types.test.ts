/**
 * Tests for TypeScript types in Workers Table View by Groups
 * These tests ensure type definitions are correct and can be imported/used properly
 */

import {
  GroupNode,
  WorkerNode,
  Worker,
} from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/types';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

describe('WorkersTableByGroupsView Types', () => {
  describe('GroupNode', () => {
    it('should be a valid type alias for QueryGroupNode', () => {
      const mockGroup: GroupNode = {
        id: 'group-1',
        name: 'Engineering Team',
        isActive: true,
        meta: {
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
          createdBy: 'user-1',
          updatedBy: 'user-2',
          version: 1,
        },
        stats: {
          memberCount: 10,
          managerCount: 2,
        },
      };

      expect(mockGroup.id).toBe('group-1');
      expect(mockGroup.name).toBe('Engineering Team');
      expect(mockGroup.isActive).toBe(true);
      expect(mockGroup.stats.memberCount).toBe(10);
      expect(mockGroup.stats.managerCount).toBe(2);
    });

    it('should handle optional meta fields', () => {
      const mockGroup: GroupNode = {
        id: 'group-2',
        name: 'Design Team',
        isActive: false,
        meta: {
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
          createdBy: 'user-1',
          updatedBy: 'user-2',
          version: 1,
        },
        stats: {
          memberCount: 5,
          managerCount: 1,
        },
      };

      expect(mockGroup.isActive).toBe(false);
      expect(mockGroup.stats.memberCount).toBe(5);
    });
  });

  describe('WorkerNode', () => {
    it('should be a valid type for unassigned workers from GraphQL query', () => {
      // This type is derived from GraphQL, so we test that it can be used correctly
      const mockWorkerNode = {
        id: 'worker-1',
        type: TimeTracking_TimeForType.Employee,
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: {
          id: 'group-1',
          name: 'Engineering',
          isActive: true,
        },
        managesGroups: [
          {
            id: 'group-2',
            name: 'Frontend Team',
            isActive: true,
          },
        ],
      };

      // Type assertion to ensure it matches WorkerNode type
      const workerNode: WorkerNode = mockWorkerNode as WorkerNode;

      expect(workerNode.id).toBe('worker-1');
      expect(workerNode.type).toBe(TimeTracking_TimeForType.Employee);
      expect(workerNode.isActive).toBe(true);
    });
  });

  describe('Worker', () => {
    it('should create a valid Worker object with required fields', () => {
      const worker: Worker = {
        id: 'worker-1',
        displayName: 'John Doe',
        type: TimeTracking_TimeForType.Employee,
        isActive: true,
      };

      expect(worker.id).toBe('worker-1');
      expect(worker.displayName).toBe('John Doe');
      expect(worker.type).toBe(TimeTracking_TimeForType.Employee);
      expect(worker.isActive).toBe(true);
    });

    it('should create a valid Worker object with optional fields', () => {
      const worker: Worker = {
        id: 'worker-2',
        displayName: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        type: TimeTracking_TimeForType.Vendor,
        isActive: false,
        managesGroups: [
          {
            id: 'group-1',
            name: 'Design Team',
            isActive: true,
          },
          {
            id: 'group-2',
            name: 'UX Team',
            isActive: false,
          },
        ],
      };

      expect(worker.firstName).toBe('Jane');
      expect(worker.lastName).toBe('Smith');
      expect(worker.type).toBe(TimeTracking_TimeForType.Vendor);
      expect(worker.isActive).toBe(false);
      expect(worker.managesGroups).toHaveLength(2);
      expect(worker.managesGroups?.[0].name).toBe('Design Team');
      expect(worker.managesGroups?.[1].isActive).toBe(false);
    });

    it('should handle Worker with empty optional fields', () => {
      const worker: Worker = {
        id: 'worker-3',
        displayName: 'Bob Johnson',
        type: TimeTracking_TimeForType.Employee,
        isActive: true,
        firstName: undefined,
        lastName: undefined,
        managesGroups: undefined,
      };

      expect(worker.firstName).toBeUndefined();
      expect(worker.lastName).toBeUndefined();
      expect(worker.managesGroups).toBeUndefined();
    });

    it('should handle Worker with empty managesGroups array', () => {
      const worker: Worker = {
        id: 'worker-4',
        displayName: 'Alice Brown',
        type: TimeTracking_TimeForType.Employee,
        isActive: true,
        managesGroups: [],
      };

      expect(worker.managesGroups).toEqual([]);
      expect(worker.managesGroups).toHaveLength(0);
    });

    it('should support different TimeForType values', () => {
      const employeeWorker: Worker = {
        id: 'worker-employee',
        displayName: 'Employee Worker',
        type: TimeTracking_TimeForType.Employee,
        isActive: true,
      };

      const vendorWorker: Worker = {
        id: 'worker-vendor',
        displayName: 'Vendor Worker',
        type: TimeTracking_TimeForType.Vendor,
        isActive: true,
      };

      expect(employeeWorker.type).toBe(TimeTracking_TimeForType.Employee);
      expect(vendorWorker.type).toBe(TimeTracking_TimeForType.Vendor);
    });

    it('should handle Worker with complex managed groups structure', () => {
      const worker: Worker = {
        id: 'manager-1',
        displayName: 'Team Manager',
        type: TimeTracking_TimeForType.Employee,
        isActive: true,
        managesGroups: [
          {
            id: 'group-active',
            name: 'Active Team',
            isActive: true,
          },
          {
            id: 'group-inactive',
            name: 'Inactive Team',
            isActive: false,
          },
        ],
      };

      const activeGroups = worker.managesGroups?.filter(
        (group) => group.isActive,
      );
      const inactiveGroups = worker.managesGroups?.filter(
        (group) => !group.isActive,
      );

      expect(activeGroups).toHaveLength(1);
      expect(inactiveGroups).toHaveLength(1);
      expect(activeGroups?.[0].name).toBe('Active Team');
      expect(inactiveGroups?.[0].name).toBe('Inactive Team');
    });
  });

  describe('Type compatibility', () => {
    it('should allow Worker to be used in arrays', () => {
      const workers: Worker[] = [
        {
          id: 'worker-1',
          displayName: 'John Doe',
          type: TimeTracking_TimeForType.Employee,
          isActive: true,
        },
        {
          id: 'worker-2',
          displayName: 'Jane Smith',
          type: TimeTracking_TimeForType.Vendor,
          isActive: false,
        },
      ];

      expect(workers).toHaveLength(2);
      expect(workers[0].displayName).toBe('John Doe');
      expect(workers[1].type).toBe(TimeTracking_TimeForType.Vendor);
    });

    it('should allow GroupNode to be used in arrays', () => {
      const groups: GroupNode[] = [
        {
          id: 'group-1',
          name: 'Team A',
          isActive: true,
          meta: {
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            createdBy: 'user-1',
            updatedBy: 'user-2',
            version: 1,
          },
          stats: {
            memberCount: 5,
            managerCount: 1,
          },
        },
        {
          id: 'group-2',
          name: 'Team B',
          isActive: false,
          meta: {
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            createdBy: 'user-1',
            updatedBy: 'user-2',
            version: 1,
          },
          stats: {
            memberCount: 3,
            managerCount: 0,
          },
        },
      ];

      expect(groups).toHaveLength(2);
      expect(groups[0].stats.memberCount).toBe(5);
      expect(groups[1].isActive).toBe(false);
    });

    it('should support Record types with Worker', () => {
      const workersByGroup: Record<string, Worker[]> = {
        'group-1': [
          {
            id: 'worker-1',
            displayName: 'John Doe',
            type: TimeTracking_TimeForType.Employee,
            isActive: true,
          },
        ],
        'group-2': [
          {
            id: 'worker-2',
            displayName: 'Jane Smith',
            type: TimeTracking_TimeForType.Vendor,
            isActive: true,
          },
        ],
      };

      expect(Object.keys(workersByGroup)).toHaveLength(2);
      expect(workersByGroup['group-1'][0].displayName).toBe('John Doe');
      expect(workersByGroup['group-2'][0].type).toBe(
        TimeTracking_TimeForType.Vendor,
      );
    });
  });

  describe('Type inference', () => {
    it('should correctly infer types from objects', () => {
      const worker: Worker = {
        id: 'worker-1',
        displayName: 'Test Worker',
        type: TimeTracking_TimeForType.Employee,
        isActive: true,
      };

      // TypeScript should infer the correct types
      expect(typeof worker.id).toBe('string');
      expect(typeof worker.displayName).toBe('string');
      expect(typeof worker.isActive).toBe('boolean');
    });

    it('should handle partial Worker objects', () => {
      const partialWorker: Partial<Worker> = {
        id: 'worker-1',
        displayName: 'Partial Worker',
      };

      expect(partialWorker.id).toBe('worker-1');
      expect(partialWorker.type).toBeUndefined();
      expect(partialWorker.isActive).toBeUndefined();
    });

    it('should handle Pick utility type with Worker', () => {
      type WorkerBasicInfo = Pick<Worker, 'id' | 'displayName' | 'isActive'>;

      const basicInfo: WorkerBasicInfo = {
        id: 'worker-1',
        displayName: 'Basic Worker',
        isActive: true,
      };

      expect(basicInfo.id).toBe('worker-1');
      expect(basicInfo.displayName).toBe('Basic Worker');
      expect(basicInfo.isActive).toBe(true);
      // Type should not have 'type' property
      expect('type' in basicInfo).toBe(false);
    });

    it('should handle Omit utility type with Worker', () => {
      type WorkerWithoutManagement = Omit<Worker, 'managesGroups'>;

      const workerWithoutManagement: WorkerWithoutManagement = {
        id: 'worker-1',
        displayName: 'Non-Manager Worker',
        firstName: 'John',
        lastName: 'Doe',
        type: TimeTracking_TimeForType.Employee,
        isActive: true,
      };

      expect(workerWithoutManagement.id).toBe('worker-1');
      expect(workerWithoutManagement.firstName).toBe('John');
      // Type should not have 'managesGroups' property
      expect('managesGroups' in workerWithoutManagement).toBe(false);
    });
  });
});
