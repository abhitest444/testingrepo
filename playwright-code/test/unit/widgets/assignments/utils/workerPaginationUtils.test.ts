import {
  TimeTracking_TimeForType,
  TimeTracking_WorkerOrderBy,
} from 'src/__generated__/timeTracking/graphql';
import { DrawerWorker } from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import {
  calculatePageWorkers,
  calculateNextPageNavigation,
  calculatePreviousPageNavigation,
  NavigationAction,
  WorkerFromAPI,
  WorkerPaginationParams,
  NextPageNavigationParams,
  PreviousPageNavigationParams,
} from 'src/js/widgets/assignments/utils/workerPaginationUtils';

// Helper to create mock worker
const createWorker = (
  id: string,
  displayName: string,
  isSelected = false,
): DrawerWorker => ({
  id,
  displayName,
  firstName: displayName.split(' ')[0],
  lastName: displayName.split(' ')[1] || '',
  type: TimeTracking_TimeForType.Employee,
  isActive: true,
  isSelected,
  memberOfGroup: null,
  managesGroups: [],
});

// Helper to create base params
const createBaseParams = (
  overrides: Partial<WorkerPaginationParams> = {},
): WorkerPaginationParams => ({
  isEditMode: true,
  currentPageNumber: 1,
  searchTerm: '',
  sortOrder: undefined,
  isSorted: false,
  drawerWorkersAllIds: [],
  drawerWorkersById: {},
  currentWorkers: [],
  allCompanyWorkers: [],
  selectedWorkerIds: new Set(),
  totalSelectedWorkers: 0,
  fullPagesOfSelected: 0,
  transitionPageNumber: 0,
  totalPagesForSelected: 0,
  remainingSelected: 0,
  ...overrides,
});

describe('workerPaginationUtils', () => {
  describe('calculatePageWorkers', () => {
    describe('Edit Mode - Basic Pagination', () => {
      it('should return workers for current page', () => {
        const worker1 = createWorker('1', 'Alice Smith');
        const worker2 = createWorker('2', 'Bob Jones');

        const params = createBaseParams({
          drawerWorkersAllIds: ['1', '2'],
          drawerWorkersById: { '1': worker1, '2': worker2 },
        });

        const result = calculatePageWorkers(params);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('1');
        expect(result[1].id).toBe('2');
      });

      it('should handle pagination correctly', () => {
        const workers: Record<string, DrawerWorker> = {};
        const allIds: string[] = [];

        for (let i = 1; i <= 125; i += 1) {
          const id = `w-${i}`;
          workers[id] = createWorker(id, `Worker ${i}`);
          allIds.push(id);
        }

        // Page 1: Workers 1-100
        const page1 = calculatePageWorkers(
          createBaseParams({
            currentPageNumber: 1,
            drawerWorkersAllIds: allIds,
            drawerWorkersById: workers,
          }),
        );
        expect(page1).toHaveLength(100);
        expect(page1[0].id).toBe('w-1');

        // Page 2: Workers 101-125
        const page2 = calculatePageWorkers(
          createBaseParams({
            currentPageNumber: 2,
            drawerWorkersAllIds: allIds,
            drawerWorkersById: workers,
          }),
        );
        expect(page2).toHaveLength(25);
        expect(page2[0].id).toBe('w-101');
      });
    });

    describe('Edit Mode - Search', () => {
      it('should return API results when searching', () => {
        const apiWorkers: WorkerFromAPI[] = [
          {
            id: '1',
            displayName: 'John Doe',
            type: TimeTracking_TimeForType.Employee,
            isActive: true,
          },
        ];

        const params = createBaseParams({
          searchTerm: 'John',
          drawerWorkersAllIds: ['1', '2', '3'],
          allCompanyWorkers: apiWorkers,
        });

        const result = calculatePageWorkers(params);
        expect(result).toEqual(apiWorkers);
      });

      it('should use drawer workers when search is whitespace', () => {
        const worker = createWorker('1', 'Test Worker');
        const params = createBaseParams({
          searchTerm: '   ',
          drawerWorkersAllIds: ['1'],
          drawerWorkersById: { '1': worker },
        });

        const result = calculatePageWorkers(params);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
      });
    });

    describe('Edit Mode - Sorting', () => {
      it('should sort ascending when isSorted is true', () => {
        const workers = {
          '1': createWorker('1', 'Zebra Last'),
          '2': createWorker('2', 'Alpha First', true),
          '3': createWorker('3', 'Beta Middle'),
        };

        const params = createBaseParams({
          sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
          isSorted: true,
          drawerWorkersAllIds: ['1', '2', '3'],
          drawerWorkersById: workers,
        });

        const result = calculatePageWorkers(params);
        expect(result[0].displayName).toBe('Alpha First');
        expect(result[1].displayName).toBe('Beta Middle');
        expect(result[2].displayName).toBe('Zebra Last');
      });

      it('should sort descending when isSorted is true', () => {
        const workers = {
          '1': createWorker('1', 'Alpha First'),
          '2': createWorker('2', 'Zebra Last'),
        };

        const params = createBaseParams({
          sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc,
          isSorted: true,
          drawerWorkersAllIds: ['1', '2'],
          drawerWorkersById: workers,
        });

        const result = calculatePageWorkers(params);
        expect(result[0].displayName).toBe('Zebra Last');
        expect(result[1].displayName).toBe('Alpha First');
      });

      it('should handle missing display names when sorting', () => {
        const workers = {
          '1': { ...createWorker('1', 'Test'), displayName: undefined as any },
          '2': createWorker('2', 'Alpha'),
        };

        const params = createBaseParams({
          sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
          isSorted: true,
          drawerWorkersAllIds: ['1', '2'],
          drawerWorkersById: workers,
        });

        const result = calculatePageWorkers(params);
        expect(result).toHaveLength(2);
      });
    });

    describe('Create Mode', () => {
      it('should return all company workers', () => {
        const apiWorkers: WorkerFromAPI[] = [
          {
            id: '1',
            displayName: 'Worker 1',
            type: TimeTracking_TimeForType.Employee,
            isActive: true,
          },
          {
            id: '2',
            displayName: 'Worker 2',
            type: TimeTracking_TimeForType.Vendor,
            isActive: true,
          },
        ];

        const params = createBaseParams({
          isEditMode: false,
          allCompanyWorkers: apiWorkers,
        });

        const result = calculatePageWorkers(params);
        expect(result).toEqual(apiWorkers);
      });
    });
  });

  describe('calculateNextPageNavigation', () => {
    describe('Edit Mode', () => {
      it('should change page when data is available', () => {
        const params: NextPageNavigationParams = {
          currentPageNumber: 1,
          isEditMode: true,
          drawerWorkersLength: 150,
          hasNextPage: false,
          fullPagesOfSelected: 0,
          transitionPageNumber: 0,
        };

        const result = calculateNextPageNavigation(params);
        expect(result).toEqual({
          action: NavigationAction.CHANGE_PAGE,
          nextPageNumber: 2,
        });
      });

      it('should fetch then change when data needs fetching', () => {
        const params: NextPageNavigationParams = {
          currentPageNumber: 1,
          isEditMode: true,
          drawerWorkersLength: 100,
          hasNextPage: true,
          fullPagesOfSelected: 0,
          transitionPageNumber: 0,
        };

        const result = calculateNextPageNavigation(params);
        expect(result).toEqual({
          action: NavigationAction.FETCH_THEN_CHANGE,
          nextPageNumber: 2,
        });
      });
    });

    describe('Create Mode', () => {
      it('should do nothing when no next page', () => {
        const params: NextPageNavigationParams = {
          currentPageNumber: 1,
          isEditMode: false,
          drawerWorkersLength: 0,
          hasNextPage: false,
          fullPagesOfSelected: 0,
          transitionPageNumber: 0,
        };

        const result = calculateNextPageNavigation(params);
        expect(result.action).toBe(NavigationAction.DO_NOTHING);
      });

      it('should fetch when has next page', () => {
        const params: NextPageNavigationParams = {
          currentPageNumber: 1,
          isEditMode: false,
          drawerWorkersLength: 0,
          hasNextPage: true,
          fullPagesOfSelected: 0,
          transitionPageNumber: 0,
        };

        const result = calculateNextPageNavigation(params);
        expect(result).toEqual({
          action: NavigationAction.FETCH_THEN_CHANGE,
          nextPageNumber: 2,
        });
      });
    });
  });

  describe('calculatePreviousPageNavigation', () => {
    describe('Edit Mode', () => {
      it('should change page when going back', () => {
        const params: PreviousPageNavigationParams = {
          currentPageNumber: 2,
          isEditMode: true,
          fullPagesOfSelected: 0,
          totalPagesForSelected: 0,
          hasPreviousPage: false,
        };

        const result = calculatePreviousPageNavigation(params);
        expect(result).toEqual({
          action: NavigationAction.CHANGE_PAGE,
          nextPageNumber: 1,
        });
      });

      it('should do nothing on page 1', () => {
        const params: PreviousPageNavigationParams = {
          currentPageNumber: 1,
          isEditMode: true,
          fullPagesOfSelected: 0,
          totalPagesForSelected: 0,
          hasPreviousPage: false,
        };

        const result = calculatePreviousPageNavigation(params);
        expect(result.action).toBe(NavigationAction.DO_NOTHING);
      });
    });

    describe('Create Mode', () => {
      it('should fetch when has previous page', () => {
        const params: PreviousPageNavigationParams = {
          currentPageNumber: 3,
          isEditMode: false,
          fullPagesOfSelected: 0,
          totalPagesForSelected: 0,
          hasPreviousPage: true,
        };

        const result = calculatePreviousPageNavigation(params);
        expect(result).toEqual({
          action: NavigationAction.FETCH_THEN_CHANGE,
          nextPageNumber: 2,
        });
      });

      it('should do nothing on page 1', () => {
        const params: PreviousPageNavigationParams = {
          currentPageNumber: 1,
          isEditMode: false,
          fullPagesOfSelected: 0,
          totalPagesForSelected: 0,
          hasPreviousPage: true,
        };

        const result = calculatePreviousPageNavigation(params);
        expect(result.action).toBe(NavigationAction.DO_NOTHING);
      });
    });
  });

  describe('NavigationAction Enum', () => {
    it('should have correct values', () => {
      expect(NavigationAction.CHANGE_PAGE).toBe('CHANGE_PAGE');
      expect(NavigationAction.FETCH_THEN_CHANGE).toBe('FETCH_THEN_CHANGE');
      expect(NavigationAction.DO_NOTHING).toBe('DO_NOTHING');
    });
  });
});
