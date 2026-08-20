import { renderHook } from '@testing-library/react-hooks';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import { useInitialDataLoader } from 'src/js/widgets/assignments/hooks/useInitialDataLoader';
import { WORKERS_PAGE_SIZE } from 'src/js/widgets/assignments/utils/constants';

describe('useInitialDataLoader', () => {
  const mockLoadWorkers = jest.fn();

  const defaultParams = {
    currentPageNumber: 1,
    searchTerm: '',
    sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
    isEditMode: true,
    drawerWorkersLength: 0,
    currentWorkersCount: 0,
    totalPagesForSelected: 0,
    loadWorkers: mockLoadWorkers,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Edit Mode', () => {
    type EditModeRow = {
      description: string;
      overrideParams: Partial<typeof defaultParams>;
      expectCalled: boolean;
      expectedArgs?: {
        first: number;
        filter: Record<string, unknown>;
        orderBy: TimeTracking_WorkerOrderBy[];
      };
    };

    test.each<EditModeRow>([
      {
        description: 'loads workers on mount with default params',
        overrideParams: {},
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      {
        description: 'does not load when not on page 1',
        overrideParams: { currentPageNumber: 2 },
        expectCalled: false,
      },
      {
        description: 'includes search filter with isActive',
        overrideParams: { searchTerm: 'John' },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true, searchText: 'John' },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      {
        description: 'trims search term',
        overrideParams: { searchTerm: '  John Doe  ' },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true, searchText: 'John Doe' },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      {
        description: 'omits searchText for whitespace-only search',
        overrideParams: { searchTerm: '   ' },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      {
        description: 'respects sort order',
        overrideParams: {
          sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc,
        },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
        },
      },
      {
        description: 'loads with both search and sort',
        overrideParams: {
          searchTerm: 'Test',
          sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc,
        },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true, searchText: 'Test' },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
        },
      },
      {
        description:
          'loads with realistic edit scenario (search + sort + existing drawer workers)',
        overrideParams: {
          searchTerm: 'Active',
          sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc,
          drawerWorkersLength: 50,
        },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true, searchText: 'Active' },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
        },
      },
    ])('$description', ({ overrideParams, expectCalled, expectedArgs }) => {
      renderHook(() =>
        useInitialDataLoader({ ...defaultParams, ...overrideParams }),
      );

      if (expectCalled) {
        expect(mockLoadWorkers).toHaveBeenCalledWith(expectedArgs);
      } else {
        expect(mockLoadWorkers).not.toHaveBeenCalled();
      }
    });
  });

  describe('Create Mode', () => {
    type CreateModeRow = {
      description: string;
      overrideParams: Partial<typeof defaultParams> & { isEditMode: boolean };
      expectCalled: boolean;
      expectedArgs?: {
        first: number;
        filter: Record<string, unknown>;
        orderBy: TimeTracking_WorkerOrderBy[];
      };
    };

    test.each<CreateModeRow>([
      {
        description: 'loads full page when no selected workers',
        overrideParams: { isEditMode: false, currentWorkersCount: 0 },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      {
        description: 'adjusts fetch count based on selected workers',
        overrideParams: { isEditMode: false, currentWorkersCount: 5 },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE - 5,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      {
        description: 'loads full page when selected count equals page size',
        overrideParams: {
          isEditMode: false,
          currentWorkersCount: WORKERS_PAGE_SIZE,
        },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      {
        description: 'loads full page when selected count exceeds page size',
        overrideParams: {
          isEditMode: false,
          currentWorkersCount: WORKERS_PAGE_SIZE + 10,
        },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      {
        description: 'includes search filter in create mode',
        overrideParams: { isEditMode: false, searchTerm: 'Search' },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true, searchText: 'Search' },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      {
        description: 'respects sort order in create mode',
        overrideParams: {
          isEditMode: false,
          sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc,
        },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
        },
      },
      {
        description: 'does not load when not on page 1 in create mode',
        overrideParams: { isEditMode: false, currentPageNumber: 3 },
        expectCalled: false,
      },
      {
        description:
          'loads with realistic create scenario (search + selected workers)',
        overrideParams: {
          isEditMode: false,
          currentWorkersCount: 10,
          totalPagesForSelected: 1,
          searchTerm: 'Developer',
        },
        expectCalled: true,
        expectedArgs: {
          first: WORKERS_PAGE_SIZE - 10,
          filter: { isActive: true, searchText: 'Developer' },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
    ])('$description', ({ overrideParams, expectCalled, expectedArgs }) => {
      renderHook(() =>
        useInitialDataLoader({ ...defaultParams, ...overrideParams }),
      );

      if (expectCalled) {
        expect(mockLoadWorkers).toHaveBeenCalledWith(expectedArgs);
      } else {
        expect(mockLoadWorkers).not.toHaveBeenCalled();
      }
    });
  });

  describe('Dependency Changes', () => {
    it('should reload when search term changes', () => {
      const { rerender } = renderHook(
        ({ searchTerm }) =>
          useInitialDataLoader({
            ...defaultParams,
            searchTerm,
          }),
        { initialProps: { searchTerm: '' } },
      );

      expect(mockLoadWorkers).toHaveBeenCalledTimes(1);

      mockLoadWorkers.mockClear();

      rerender({ searchTerm: 'New Search' });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        filter: { isActive: true, searchText: 'New Search' },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('should reload when sort order changes', () => {
      const { rerender } = renderHook(
        ({ sortOrder }) =>
          useInitialDataLoader({
            ...defaultParams,
            sortOrder,
          }),
        {
          initialProps: {
            sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
          },
        },
      );

      expect(mockLoadWorkers).toHaveBeenCalledTimes(1);

      mockLoadWorkers.mockClear();

      rerender({ sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        filter: { isActive: true },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
      });
    });

    it('should reload when currentWorkersCount changes in create mode', () => {
      const { rerender } = renderHook(
        ({ currentWorkersCount }) =>
          useInitialDataLoader({
            ...defaultParams,
            isEditMode: false,
            currentWorkersCount,
          }),
        { initialProps: { currentWorkersCount: 0 } },
      );

      expect(mockLoadWorkers).toHaveBeenCalledTimes(1);

      mockLoadWorkers.mockClear();

      rerender({ currentWorkersCount: 5 });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE - 5,
        filter: { isActive: true },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('should not reload when currentPageNumber changes from 1 to 2', () => {
      const { rerender } = renderHook(
        ({ currentPageNumber }) =>
          useInitialDataLoader({
            ...defaultParams,
            currentPageNumber,
          }),
        { initialProps: { currentPageNumber: 1 } },
      );

      expect(mockLoadWorkers).toHaveBeenCalledTimes(1);

      mockLoadWorkers.mockClear();

      rerender({ currentPageNumber: 2 });

      // Should not load because not on page 1
      expect(mockLoadWorkers).not.toHaveBeenCalled();
    });

    it('should reload when returning to page 1', () => {
      const { rerender } = renderHook(
        ({ currentPageNumber }) =>
          useInitialDataLoader({
            ...defaultParams,
            currentPageNumber,
          }),
        { initialProps: { currentPageNumber: 2 } },
      );

      expect(mockLoadWorkers).not.toHaveBeenCalled();

      rerender({ currentPageNumber: 1 });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        filter: { isActive: true },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle drawerWorkersLength changes', () => {
      const { rerender } = renderHook(
        ({ drawerWorkersLength }) =>
          useInitialDataLoader({
            ...defaultParams,
            drawerWorkersLength,
          }),
        { initialProps: { drawerWorkersLength: 0 } },
      );

      expect(mockLoadWorkers).toHaveBeenCalledTimes(1);

      mockLoadWorkers.mockClear();

      rerender({ drawerWorkersLength: 100 });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        filter: { isActive: true },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('should handle mode switching', () => {
      const { rerender } = renderHook(
        ({ isEditMode }) =>
          useInitialDataLoader({
            ...defaultParams,
            isEditMode,
          }),
        { initialProps: { isEditMode: true } },
      );

      expect(mockLoadWorkers).toHaveBeenCalledTimes(1);

      mockLoadWorkers.mockClear();

      rerender({ isEditMode: false });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        filter: { isActive: true },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('should only call loadWorkers once on mount regardless of rerenders with stable dependencies', () => {
      const { rerender } = renderHook(() =>
        useInitialDataLoader(defaultParams),
      );

      expect(mockLoadWorkers).toHaveBeenCalledTimes(1);

      rerender();
      rerender();

      // Should only be called once because dependencies are stable
      expect(mockLoadWorkers).toHaveBeenCalledTimes(1);
    });
  });
});
