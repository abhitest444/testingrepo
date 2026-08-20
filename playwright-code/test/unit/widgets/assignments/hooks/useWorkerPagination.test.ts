import { renderHook, act } from '@testing-library/react-hooks';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import { useWorkerPagination } from 'src/js/widgets/assignments/hooks/useWorkerPagination';
import { WORKERS_PAGE_SIZE } from 'src/js/widgets/assignments/utils/constants';

// Mock the sub-hooks
jest.mock('src/js/widgets/assignments/hooks/useInitialDataLoader', () => ({
  useInitialDataLoader: jest.fn(),
}));

jest.mock('src/js/widgets/assignments/hooks/usePaginationHandlers', () => ({
  usePaginationHandlers: jest.fn(() => ({
    handleNextPage: jest.fn(),
    handlePreviousPage: jest.fn(),
  })),
}));

jest.mock('src/js/widgets/assignments/utils/workerPaginationUtils', () => ({
  calculatePageWorkers: jest.fn(() => []),
}));

const {
  useInitialDataLoader,
} = require('src/js/widgets/assignments/hooks/useInitialDataLoader');
const {
  usePaginationHandlers,
} = require('src/js/widgets/assignments/hooks/usePaginationHandlers');
const {
  calculatePageWorkers,
} = require('src/js/widgets/assignments/utils/workerPaginationUtils');

describe('useWorkerPagination', () => {
  const mockSetCurrentPageNumber = jest.fn();
  const mockLoadWorkers = jest.fn();
  const mockFetchNextPage = jest.fn();
  const mockFetchPreviousPage = jest.fn();
  const mockHandleNextPage = jest.fn();
  const mockHandlePreviousPage = jest.fn();

  const defaultParams = {
    isEditMode: true,
    currentPageNumber: 1,
    setCurrentPageNumber: mockSetCurrentPageNumber,
    searchTerm: '',
    sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
    isSorted: false,
    loading: false,
    drawerWorkersAllIds: ['worker-1', 'worker-2'],
    drawerWorkersById: {
      'worker-1': { id: 'worker-1', displayName: 'Worker 1' },
      'worker-2': { id: 'worker-2', displayName: 'Worker 2' },
    },
    drawerWorkersSelectedCount: 2,
    currentWorkers: [],
    selectedWorkerIds: new Set<string>(),
    allCompanyWorkers: [],
    pageInfo: { hasNextPage: true, hasPreviousPage: false },
    loadWorkers: mockLoadWorkers,
    fetchNextPage: mockFetchNextPage,
    fetchPreviousPage: mockFetchPreviousPage,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useInitialDataLoader as jest.Mock).mockImplementation(() => {});
    (usePaginationHandlers as jest.Mock).mockReturnValue({
      handleNextPage: mockHandleNextPage,
      handlePreviousPage: mockHandlePreviousPage,
    });
    (calculatePageWorkers as jest.Mock).mockReturnValue([
      { id: 'worker-1', displayName: 'Worker 1' },
    ]);
  });

  describe('Composition', () => {
    it('should call useInitialDataLoader with correct parameters', () => {
      renderHook(() => useWorkerPagination(defaultParams));

      expect(useInitialDataLoader).toHaveBeenCalledWith({
        currentPageNumber: 1,
        searchTerm: '',
        sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
        isEditMode: true,
        drawerWorkersLength: 2,
        currentWorkersCount: 0,
        totalPagesForSelected: 0,
        loadWorkers: mockLoadWorkers,
      });
    });

    it('should call usePaginationHandlers with correct parameters', () => {
      renderHook(() => useWorkerPagination(defaultParams));

      expect(usePaginationHandlers).toHaveBeenCalledWith({
        loading: false,
        currentPageNumber: 1,
        searchTerm: '',
        sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
        isEditMode: true,
        drawerWorkersLength: 2,
        hasNextPage: true,
        hasPreviousPage: false,
        fullPagesOfSelected: 0,
        transitionPageNumber: 0,
        totalPagesForSelected: 0,
        setCurrentPageNumber: mockSetCurrentPageNumber,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
      });
    });

    it('should call calculatePageWorkers with correct parameters', () => {
      renderHook(() => useWorkerPagination(defaultParams));

      expect(calculatePageWorkers).toHaveBeenCalledWith({
        isEditMode: true,
        currentPageNumber: 1,
        searchTerm: '',
        sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
        isSorted: false,
        drawerWorkersAllIds: ['worker-1', 'worker-2'],
        drawerWorkersById: {
          'worker-1': { id: 'worker-1', displayName: 'Worker 1' },
          'worker-2': { id: 'worker-2', displayName: 'Worker 2' },
        },
        currentWorkers: [],
        allCompanyWorkers: [],
        selectedWorkerIds: new Set<string>(),
        totalSelectedWorkers: 0,
        fullPagesOfSelected: 0,
        transitionPageNumber: 0,
        totalPagesForSelected: 0,
        remainingSelected: 0,
      });
    });
  });

  describe('Return Values', () => {
    it('should return workers from calculatePageWorkers', () => {
      const mockWorkers = [
        { id: 'worker-1', displayName: 'Worker 1' },
        { id: 'worker-2', displayName: 'Worker 2' },
      ];
      (calculatePageWorkers as jest.Mock).mockReturnValue(mockWorkers);

      const { result } = renderHook(() => useWorkerPagination(defaultParams));

      expect(result.current.workers).toEqual(mockWorkers);
    });

    it('should return handleNextPage from usePaginationHandlers', () => {
      const { result } = renderHook(() => useWorkerPagination(defaultParams));

      expect(result.current.handleNextPage).toBe(mockHandleNextPage);
    });

    it('should return handlePreviousPage from usePaginationHandlers', () => {
      const { result } = renderHook(() => useWorkerPagination(defaultParams));

      expect(result.current.handlePreviousPage).toBe(mockHandlePreviousPage);
    });

    it('should return pagination metadata', () => {
      const { result } = renderHook(() => useWorkerPagination(defaultParams));

      expect(result.current.totalPagesForSelected).toBe(0);
      expect(result.current.fullPagesOfSelected).toBe(0);
      expect(result.current.transitionPageNumber).toBe(0);
      expect(result.current.remainingSelected).toBe(0);
    });
  });

  describe('Pagination Metadata Calculations', () => {
    it('should calculate metadata for empty current workers', () => {
      const { result } = renderHook(() =>
        useWorkerPagination({
          ...defaultParams,
          currentWorkers: [],
        }),
      );

      expect(result.current.totalPagesForSelected).toBe(0);
      expect(result.current.fullPagesOfSelected).toBe(0);
      expect(result.current.transitionPageNumber).toBe(0);
      expect(result.current.remainingSelected).toBe(0);
    });

    it('should calculate metadata for less than one page of workers', () => {
      const workers = Array.from({ length: 10 }, (_, i) => ({
        id: `worker-${i}`,
        displayName: `Worker ${i}`,
      }));

      const { result } = renderHook(() =>
        useWorkerPagination({
          ...defaultParams,
          isEditMode: false,
          currentWorkers: workers,
        }),
      );

      expect(result.current.fullPagesOfSelected).toBe(0);
      expect(result.current.remainingSelected).toBe(10);
      expect(result.current.transitionPageNumber).toBe(1);
      expect(result.current.totalPagesForSelected).toBe(1);
    });

    it('should calculate metadata for exactly one page of workers', () => {
      const workers = Array.from({ length: WORKERS_PAGE_SIZE }, (_, i) => ({
        id: `worker-${i}`,
        displayName: `Worker ${i}`,
      }));

      const { result } = renderHook(() =>
        useWorkerPagination({
          ...defaultParams,
          isEditMode: false,
          currentWorkers: workers,
        }),
      );

      expect(result.current.fullPagesOfSelected).toBe(1);
      expect(result.current.remainingSelected).toBe(0);
      expect(result.current.transitionPageNumber).toBe(0);
      expect(result.current.totalPagesForSelected).toBe(1);
    });

    it('should calculate metadata for more than one page of workers', () => {
      const workers = Array.from(
        { length: WORKERS_PAGE_SIZE + 10 },
        (_, i) => ({
          id: `worker-${i}`,
          displayName: `Worker ${i}`,
        }),
      );

      const { result } = renderHook(() =>
        useWorkerPagination({
          ...defaultParams,
          isEditMode: false,
          currentWorkers: workers,
        }),
      );

      expect(result.current.fullPagesOfSelected).toBe(1);
      expect(result.current.remainingSelected).toBe(10);
      expect(result.current.transitionPageNumber).toBe(2);
      expect(result.current.totalPagesForSelected).toBe(2);
    });

    it('should calculate metadata for multiple full pages', () => {
      const workers = Array.from({ length: WORKERS_PAGE_SIZE * 3 }, (_, i) => ({
        id: `worker-${i}`,
        displayName: `Worker ${i}`,
      }));

      const { result } = renderHook(() =>
        useWorkerPagination({
          ...defaultParams,
          isEditMode: false,
          currentWorkers: workers,
        }),
      );

      expect(result.current.fullPagesOfSelected).toBe(3);
      expect(result.current.remainingSelected).toBe(0);
      expect(result.current.transitionPageNumber).toBe(0);
      expect(result.current.totalPagesForSelected).toBe(3);
    });
  });

  describe('Edit Mode', () => {
    it('should pass edit mode data to hooks', () => {
      renderHook(() => useWorkerPagination(defaultParams));

      expect(useInitialDataLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          isEditMode: true,
          drawerWorkersLength: 2,
        }),
      );

      expect(usePaginationHandlers).toHaveBeenCalledWith(
        expect.objectContaining({
          isEditMode: true,
          drawerWorkersLength: 2,
        }),
      );
    });
  });

  describe('Create Mode', () => {
    it('should pass create mode data to hooks', () => {
      const createModeParams = {
        ...defaultParams,
        isEditMode: false,
        currentWorkers: [{ id: 'w1' }, { id: 'w2' }],
      };

      renderHook(() => useWorkerPagination(createModeParams));

      expect(useInitialDataLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          isEditMode: false,
          currentWorkersCount: 2,
        }),
      );
    });
  });

  describe('Search and Sort', () => {
    test.each([
      {
        description: 'should pass search term to hooks',
        overrides: { searchTerm: 'John' },
        expectedContaining: { searchTerm: 'John' },
      },
      {
        description: 'should pass sort order to hooks',
        overrides: { sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc },
        expectedContaining: {
          sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc,
        },
      },
    ])('$description', ({ overrides, expectedContaining }) => {
      renderHook(() => useWorkerPagination({ ...defaultParams, ...overrides }));

      expect(useInitialDataLoader).toHaveBeenCalledWith(
        expect.objectContaining(expectedContaining),
      );
      expect(usePaginationHandlers).toHaveBeenCalledWith(
        expect.objectContaining(expectedContaining),
      );
    });

    it('should pass isSorted to calculatePageWorkers', () => {
      const paramsWithSorted = {
        ...defaultParams,
        isSorted: true,
      };

      renderHook(() => useWorkerPagination(paramsWithSorted));

      expect(calculatePageWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          isSorted: true,
        }),
      );
    });
  });

  describe('Page Info', () => {
    it('should pass hasNextPage and hasPreviousPage to usePaginationHandlers', () => {
      const paramsWithPageInfo = {
        ...defaultParams,
        pageInfo: { hasNextPage: false, hasPreviousPage: true },
      };

      renderHook(() => useWorkerPagination(paramsWithPageInfo));

      expect(usePaginationHandlers).toHaveBeenCalledWith(
        expect.objectContaining({
          hasNextPage: false,
          hasPreviousPage: true,
        }),
      );
    });

    it('should handle undefined pageInfo', () => {
      const paramsWithoutPageInfo = {
        ...defaultParams,
        pageInfo: undefined,
      };

      renderHook(() => useWorkerPagination(paramsWithoutPageInfo));

      expect(usePaginationHandlers).toHaveBeenCalledWith(
        expect.objectContaining({
          hasNextPage: undefined,
          hasPreviousPage: undefined,
        }),
      );
    });
  });

  describe('Loading State', () => {
    it('should pass loading state to usePaginationHandlers', () => {
      const paramsWithLoading = {
        ...defaultParams,
        loading: true,
      };

      renderHook(() => useWorkerPagination(paramsWithLoading));

      expect(usePaginationHandlers).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: true,
        }),
      );
    });
  });

  describe('Memoization', () => {
    it('should recalculate workers when dependencies change', () => {
      const { rerender } = renderHook(
        ({ currentPageNumber }) =>
          useWorkerPagination({
            ...defaultParams,
            currentPageNumber,
          }),
        { initialProps: { currentPageNumber: 1 } },
      );

      const initialCallCount = (calculatePageWorkers as jest.Mock).mock.calls
        .length;

      rerender({ currentPageNumber: 2 });

      expect(
        (calculatePageWorkers as jest.Mock).mock.calls.length,
      ).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Integration', () => {
    it('should work with realistic edit mode scenario', () => {
      const editModeParams = {
        ...defaultParams,
        isEditMode: true,
        drawerWorkersAllIds: ['w1', 'w2', 'w3'],
        drawerWorkersById: {
          w1: { id: 'w1', displayName: 'Worker 1', isSelected: true },
          w2: { id: 'w2', displayName: 'Worker 2', isSelected: false },
          w3: { id: 'w3', displayName: 'Worker 3', isSelected: true },
        },
        drawerWorkersSelectedCount: 2,
        searchTerm: 'Worker',
        pageInfo: { hasNextPage: true, hasPreviousPage: false },
      };

      const { result } = renderHook(() => useWorkerPagination(editModeParams));

      expect(result.current.handleNextPage).toBe(mockHandleNextPage);
      expect(result.current.handlePreviousPage).toBe(mockHandlePreviousPage);
    });

    it('should work with realistic create mode scenario', () => {
      const createModeParams = {
        ...defaultParams,
        isEditMode: false,
        currentWorkers: [
          { id: 'w1', displayName: 'Worker 1' },
          { id: 'w2', displayName: 'Worker 2' },
        ],
        selectedWorkerIds: new Set(['w1']),
        allCompanyWorkers: [
          { id: 'w3', displayName: 'Worker 3' },
          { id: 'w4', displayName: 'Worker 4' },
        ],
      };

      const { result } = renderHook(() =>
        useWorkerPagination(createModeParams),
      );

      expect(result.current.totalPagesForSelected).toBe(1);
      expect(result.current.fullPagesOfSelected).toBe(0);
    });
  });
});
