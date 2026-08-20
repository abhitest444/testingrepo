import {
  transformWorkerToGeoJSON,
  WorkerGeoJSONProperties,
} from 'src/js/widgets/whosworking/utils/geoJsonUtils';
import { WhoIsWorkingWorkerNode } from 'src/js/widgets/whosworking/hooks/useWhoIsWorkingLoadMore';
import { TimeForType } from 'src/js/service/hooks/whosWorking/types';

// Helper to create mock worker nodes
const createMockWorker = (
  id: string,
  displayName: string,
  overrides?: Partial<WhoIsWorkingWorkerNode>,
): WhoIsWorkingWorkerNode =>
  ({
    timeForContactDAS: { id },
    firstName: displayName.split(' ')[0],
    lastName: displayName.split(' ')[1] || 'Test',
    displayName,
    timeForType: TimeForType.EMPLOYEE,
    group: undefined,
    totalDaySeconds: 3600,
    activeTimeEntry: undefined,
    currentLocation: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    ...overrides,
  } as WhoIsWorkingWorkerNode);

describe('geoJsonUtils', () => {
  describe('transformWorkerToGeoJSON', () => {
    describe('Basic Transformation', () => {
      it('transforms worker to GeoJSON Point Feature', () => {
        const worker = createMockWorker('1', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.type).toBe('Feature');
        expect(result.geometry.type).toBe('Point');
      });

      it('sets coordinates from worker location', () => {
        const worker = createMockWorker('1', 'John Doe', {
          currentLocation: { latitude: 40.7128, longitude: -74.006 },
        });

        const result = transformWorkerToGeoJSON(worker, '');

        // GeoJSON uses [longitude, latitude] order
        expect(result.geometry.coordinates).toEqual([-74.006, 40.7128]);
      });

      it('includes worker details in properties', () => {
        const worker = createMockWorker('1', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.properties.workerDetails).toBe(worker);
      });
    });

    describe('Selection State', () => {
      it('sets isSelected to true when worker ID matches selectedWorkerId', () => {
        const worker = createMockWorker('1', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, '1');

        expect(result.properties.isSelected).toBe(true);
      });

      it('sets isSelected to false when worker ID does not match selectedWorkerId', () => {
        const worker = createMockWorker('1', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, '2');

        expect(result.properties.isSelected).toBe(false);
      });

      it('sets isSelected to false when selectedWorkerId is empty', () => {
        const worker = createMockWorker('1', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.properties.isSelected).toBe(false);
      });

      it('handles undefined selectedWorkerId', () => {
        const worker = createMockWorker('1', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, undefined as any);

        expect(result.properties.isSelected).toBe(false);
      });
    });

    describe('Coordinate Handling', () => {
      it('handles positive coordinates', () => {
        const worker = createMockWorker('1', 'John Doe', {
          currentLocation: { latitude: 51.5074, longitude: 0.1278 },
        });

        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.geometry.coordinates).toEqual([0.1278, 51.5074]);
      });

      it('handles negative coordinates', () => {
        const worker = createMockWorker('1', 'John Doe', {
          currentLocation: { latitude: -33.8688, longitude: 151.2093 },
        });

        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.geometry.coordinates).toEqual([151.2093, -33.8688]);
      });

      it('handles zero coordinates', () => {
        const worker = createMockWorker('1', 'John Doe', {
          currentLocation: { latitude: 0, longitude: 0 },
        });

        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.geometry.coordinates).toEqual([0, 0]);
      });

      it('handles extreme latitude values', () => {
        const worker = createMockWorker('1', 'John Doe', {
          currentLocation: { latitude: 90, longitude: 0 },
        });

        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.geometry.coordinates).toEqual([0, 90]);
      });

      it('handles extreme longitude values', () => {
        const worker = createMockWorker('1', 'John Doe', {
          currentLocation: { latitude: 0, longitude: 180 },
        });

        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.geometry.coordinates).toEqual([180, 0]);
      });

      it('handles decimal precision', () => {
        const worker = createMockWorker('1', 'John Doe', {
          currentLocation: { latitude: 40.71284567, longitude: -74.00597123 },
        });

        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.geometry.coordinates).toEqual([
          -74.00597123, 40.71284567,
        ]);
      });
    });

    describe('GeoJSON Structure', () => {
      it('returns valid GeoJSON Feature structure', () => {
        const worker = createMockWorker('1', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, '');

        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('properties');
        expect(result).toHaveProperty('geometry');
        expect(result.geometry).toHaveProperty('type');
        expect(result.geometry).toHaveProperty('coordinates');
      });

      it('geometry type is Point', () => {
        const worker = createMockWorker('1', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.geometry.type).toBe('Point');
      });

      it('coordinates is array of two numbers', () => {
        const worker = createMockWorker('1', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, '');

        expect(Array.isArray(result.geometry.coordinates)).toBe(true);
        expect(result.geometry.coordinates).toHaveLength(2);
        expect(typeof result.geometry.coordinates[0]).toBe('number');
        expect(typeof result.geometry.coordinates[1]).toBe('number');
      });

      it('properties has correct shape', () => {
        const worker = createMockWorker('1', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.properties).toHaveProperty('workerDetails');
        expect(result.properties).toHaveProperty('isSelected');
      });
    });

    describe('Worker Details Preservation', () => {
      it('preserves all worker fields', () => {
        const worker = createMockWorker('1', 'John Doe', {
          firstName: 'John',
          lastName: 'Doe',
          timeForType: TimeForType.EMPLOYEE,
          group: { groupId: 'g1', groupName: 'Engineering' },
          totalDaySeconds: 7200,
          activeTimeEntry: {
            id: 'entry-1',
            startTime: '2024-01-01T09:00:00Z',
            isOpen: true,
          },
        });

        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.properties.workerDetails).toEqual(worker);
        expect(result.properties.workerDetails.firstName).toBe('John');
        expect(result.properties.workerDetails.lastName).toBe('Doe');
        expect(result.properties.workerDetails.group?.groupName).toBe(
          'Engineering',
        );
        expect(result.properties.workerDetails.totalDaySeconds).toBe(7200);
      });

      it('preserves active time entry details', () => {
        const activeTimeEntry = {
          id: 'entry-1',
          startTime: '2024-01-01T09:00:00Z',
          isOpen: true,
          timeAgainstContactDAS: {
            customer: { id: 'c1', displayName: 'Acme Corp' },
          },
        };

        const worker = createMockWorker('1', 'John Doe', { activeTimeEntry });
        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.properties.workerDetails.activeTimeEntry).toEqual(
          activeTimeEntry,
        );
      });

      it('preserves group information', () => {
        const group = { groupId: 'g1', groupName: 'Sales' };
        const worker = createMockWorker('1', 'John Doe', { group });
        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.properties.workerDetails.group).toEqual(group);
      });

      it('handles worker with undefined group', () => {
        const worker = createMockWorker('1', 'John Doe', { group: undefined });
        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.properties.workerDetails.group).toBeUndefined();
      });
    });

    describe('ID Matching', () => {
      it('matches worker ID from timeForContactDAS', () => {
        const worker = createMockWorker('worker-123', 'John Doe');
        const result = transformWorkerToGeoJSON(worker, 'worker-123');

        expect(result.properties.isSelected).toBe(true);
      });

      it('handles worker with undefined timeForContactDAS', () => {
        const worker = {
          ...createMockWorker('1', 'John Doe'),
          timeForContactDAS: undefined,
        } as any;

        const result = transformWorkerToGeoJSON(worker, '1');

        expect(result.properties.isSelected).toBe(false);
      });

      it('handles worker with null timeForContactDAS.id', () => {
        const worker = {
          ...createMockWorker('1', 'John Doe'),
          timeForContactDAS: { id: null },
        } as any;

        const result = transformWorkerToGeoJSON(worker, '');

        expect(result.properties.isSelected).toBe(false);
      });

      it('performs strict equality check on ID', () => {
        const worker = createMockWorker('1', 'John Doe');

        // String '1' vs number 1
        const result = transformWorkerToGeoJSON(worker, 1 as any);

        expect(result.properties.isSelected).toBe(false);
      });
    });

    describe('Multiple Workers', () => {
      it('can transform multiple workers independently', () => {
        const worker1 = createMockWorker('1', 'John Doe', {
          currentLocation: { latitude: 40.7128, longitude: -74.006 },
        });
        const worker2 = createMockWorker('2', 'Jane Smith', {
          currentLocation: { latitude: 34.0522, longitude: -118.2437 },
        });

        const result1 = transformWorkerToGeoJSON(worker1, '1');
        const result2 = transformWorkerToGeoJSON(worker2, '1');

        expect(result1.properties.isSelected).toBe(true);
        expect(result2.properties.isSelected).toBe(false);
        expect(result1.geometry.coordinates).toEqual([-74.006, 40.7128]);
        expect(result2.geometry.coordinates).toEqual([-118.2437, 34.0522]);
      });

      it('each transformation is independent', () => {
        const worker = createMockWorker('1', 'John Doe');

        const result1 = transformWorkerToGeoJSON(worker, '1');
        const result2 = transformWorkerToGeoJSON(worker, '2');

        expect(result1.properties.isSelected).toBe(true);
        expect(result2.properties.isSelected).toBe(false);
      });
    });
  });

  describe('WorkerGeoJSONProperties Interface', () => {
    it('result properties match WorkerGeoJSONProperties interface', () => {
      const worker = createMockWorker('1', 'John Doe');
      const result = transformWorkerToGeoJSON(worker, '1');

      const { properties } = result;

      expect(properties.workerDetails).toBeDefined();
      expect(typeof properties.isSelected).toBe('boolean');
    });
  });
});
