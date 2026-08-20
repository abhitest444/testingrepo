import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import {
  calculatePageWorkers,
  WorkerFromAPI,
  WorkerPaginationParams,
} from '../workerPaginationUtils';
import { DrawerWorker } from '../../store/workersGroupViewSlice';

const mockAPIWorkers: WorkerFromAPI[] = [
  {
    id: '1',
    type: 'Employee',
    displayName: 'Alice Johnson',
    isActive: true,
    firstName: 'Alice',
    lastName: 'Johnson',
    memberOfGroup: { id: 'group-1', name: 'Engineering', isActive: true },
  },
  {
    id: '2',
    type: 'Employee',
    displayName: 'Bob Smith',
    isActive: true,
    firstName: 'Bob',
    lastName: 'Smith',
    memberOfGroup: { id: 'group-1', name: 'Engineering', isActive: true },
  },
  {
    id: '3',
    type: 'Employee',
    displayName: 'Charlie Brown',
    isActive: true,
    firstName: 'Charlie',
    lastName: 'Brown',
    memberOfGroup: null,
  },
];

const mockDrawerWorkersById: Record<string, DrawerWorker> = {
  '1': {
    id: '1',
    type: 'Employee',
    displayName: 'Alice Johnson',
    isActive: true,
    firstName: 'Alice',
    lastName: 'Johnson',
    memberOfGroup: { id: 'group-1', name: 'Engineering', isActive: true },
    managesGroups: [],
    isSelected: true,
  },
  '2': {
    id: '2',
    type: 'Employee',
    displayName: 'Bob Smith',
    isActive: true,
    firstName: 'Bob',
    lastName: 'Smith',
    memberOfGroup: { id: 'group-1', name: 'Engineering', isActive: true },
    managesGroups: [],
    isSelected: false,
  },
};

describe('calculatePageWorkers with groupFilter', () => {
  const baseParams: WorkerPaginationParams = {
    isEditMode: false,
    currentPageNumber: 1,
    drawerWorkersAllIds: [],
    drawerWorkersById: {},
    currentWorkers: [],
    allCompanyWorkers: mockAPIWorkers,
    selectedWorkerIds: new Set(),
    totalSelectedWorkers: 0,
    fullPagesOfSelected: 0,
    transitionPageNumber: 0,
    totalPagesForSelected: 0,
    remainingSelected: 0,
  };

  describe('Group Filter Active (not "ALL")', () => {
    it('should return only API results when groupFilter is set to specific group', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        groupFilter: 'group-1',
      });

      expect(result).toEqual(mockAPIWorkers);
      expect(result.length).toBe(3);
    });

    it('should return only API results when groupFilter is "NO_GROUP"', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        groupFilter: 'NO_GROUP',
      });

      expect(result).toEqual(mockAPIWorkers);
    });

    it('should return API results in Edit mode with groupFilter', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        isEditMode: true,
        drawerWorkersAllIds: ['1', '2'],
        drawerWorkersById: mockDrawerWorkersById,
        groupFilter: 'group-1',
      });

      // Should return API results, NOT drawer workers
      expect(result).toEqual(mockAPIWorkers);
    });

    it('should override search behavior when groupFilter is active', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        isEditMode: true,
        searchTerm: 'Alice',
        groupFilter: 'group-1',
      });

      // Should still return API results
      expect(result).toEqual(mockAPIWorkers);
    });
  });

  describe('Group Filter "ALL" (default)', () => {
    it('should use normal Edit mode logic when groupFilter is "ALL"', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        isEditMode: true,
        drawerWorkersAllIds: ['1', '2'],
        drawerWorkersById: mockDrawerWorkersById,
        groupFilter: 'ALL',
      });

      // Should use drawer workers, not API workers
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should use normal Create mode logic when groupFilter is "ALL"', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        groupFilter: 'ALL',
      });

      expect(result).toEqual(mockAPIWorkers);
    });
  });

  describe('No Group Filter (undefined)', () => {
    it('should use normal Edit mode logic when groupFilter is undefined', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        isEditMode: true,
        drawerWorkersAllIds: ['1', '2'],
        drawerWorkersById: mockDrawerWorkersById,
      });

      expect(result.length).toBe(2);
    });

    it('should use normal Create mode logic when groupFilter is undefined', () => {
      const result = calculatePageWorkers({
        ...baseParams,
      });

      expect(result).toEqual(mockAPIWorkers);
    });
  });

  describe('Edit Mode with Search', () => {
    it('should return API results when searching (no groupFilter)', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        isEditMode: true,
        searchTerm: 'Alice',
        drawerWorkersAllIds: ['1', '2'],
        drawerWorkersById: mockDrawerWorkersById,
      });

      expect(result).toEqual(mockAPIWorkers);
    });

    it('should return API results when both search and groupFilter are active', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        isEditMode: true,
        searchTerm: 'Alice',
        groupFilter: 'group-1',
      });

      expect(result).toEqual(mockAPIWorkers);
    });
  });

  describe('Pagination with Group Filter', () => {
    it('should return all API workers regardless of page number when filter is active', () => {
      const resultPage1 = calculatePageWorkers({
        ...baseParams,
        currentPageNumber: 1,
        groupFilter: 'group-1',
      });

      const resultPage2 = calculatePageWorkers({
        ...baseParams,
        currentPageNumber: 2,
        groupFilter: 'group-1',
      });

      // Both pages should return the same API results
      // Actual pagination happens at API level
      expect(resultPage1).toEqual(mockAPIWorkers);
      expect(resultPage2).toEqual(mockAPIWorkers);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty allCompanyWorkers with groupFilter', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        allCompanyWorkers: [],
        groupFilter: 'group-1',
      });

      expect(result).toEqual([]);
    });

    it('should handle empty string groupFilter as truthy', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        isEditMode: true,
        drawerWorkersAllIds: ['1', '2'],
        drawerWorkersById: mockDrawerWorkersById,
        groupFilter: '', // Empty string is falsy, so should use normal logic
      });

      // Should use drawer workers
      expect(result.length).toBe(2);
    });

    it('should prioritize groupFilter over other display logic', () => {
      const result = calculatePageWorkers({
        ...baseParams,
        isEditMode: true,
        searchTerm: '',
        isSorted: true,
        sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc,
        drawerWorkersAllIds: ['1', '2'],
        drawerWorkersById: mockDrawerWorkersById,
        groupFilter: 'group-1',
      });

      // groupFilter takes priority - should return API results
      expect(result).toEqual(mockAPIWorkers);
    });
  });
});
