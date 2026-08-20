import { renderHook, act } from '@testing-library/react-hooks';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import { usePaginationHandlers } from 'src/js/widgets/assignments/hooks/usePaginationHandlers';
import { NavigationAction } from 'src/js/widgets/assignments/utils/workerPaginationUtils';
import { WORKERS_PAGE_SIZE } from 'src/js/widgets/assignments/utils/constants';

// Mock the utility functions
jest.mock('src/js/widgets/assignments/utils/workerPaginationUtils', () => ({
  ...jest.requireActual(
    'src/js/widgets/assignments/utils/workerPaginationUtils',
  ),
  calculateNextPageNavigation: jest.fn(),
  calculatePreviousPageNavigation: jest.fn(),
  NavigationAction: {
    DO_NOTHING: 'DO_NOTHING',
    FETCH_THEN_CHANGE: 'FETCH_THEN_CHANGE',
    CHANGE_PAGE: 'CHANGE_PAGE',
  },
}));

describe('usePaginationHandlers', () => {
  const mockSetCurrentPageNumber = jest.fn();
  const mockFetchNextPage = jest.fn();
  const mockFetchPreviousPage = jest.fn();

  const {
    calculateNextPageNavigation,
    calculatePreviousPageNavigation,
  } = require('src/js/widgets/assignments/utils/workerPaginationUtils');

  const defaultParams = {
    loading: false,
    currentPageNumber: 1,
    searchTerm: '',
    sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
    isEditMode: true,
    drawerWorkersLength: 100,
    hasNextPage: true,
    hasPreviousPage: false,
    fullPagesOfSelected: 0,
    transitionPageNumber: 1,
    totalPagesForSelected: 0,
    setCurrentPageNumber: mockSetCurrentPageNumber,
    fetchNextPage: mockFetchNextPage,
    fetchPreviousPage: mockFetchPreviousPage,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchNextPage.mockResolvedValue(undefined);
    mockFetchPreviousPage.mockResolvedValue(undefined);
  });

  describe('handleNextPage', () => {
    describe('DO_NOTHING action', () => {
      it('should do nothing when utility returns DO_NOTHING', async () => {
        calculateNextPageNavigation.mockReturnValue({
          action: NavigationAction.DO_NOTHING,
          nextPageNumber: 1,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers(defaultParams),
        );

        await act(async () => {
          await result.current.handleNextPage();
        });

        expect(mockFetchNextPage).not.toHaveBeenCalled();
        expect(mockSetCurrentPageNumber).not.toHaveBeenCalled();
      });

      it('should not navigate when loading', async () => {
        calculateNextPageNavigation.mockReturnValue({
          action: NavigationAction.CHANGE_PAGE,
          nextPageNumber: 2,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers({
            ...defaultParams,
            loading: true,
          }),
        );

        await act(async () => {
          await result.current.handleNextPage();
        });

        expect(mockSetCurrentPageNumber).not.toHaveBeenCalled();
      });
    });

    describe('CHANGE_PAGE action', () => {
      it('should change page without fetching', async () => {
        calculateNextPageNavigation.mockReturnValue({
          action: NavigationAction.CHANGE_PAGE,
          nextPageNumber: 2,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers(defaultParams),
        );

        await act(async () => {
          await result.current.handleNextPage();
        });

        expect(mockFetchNextPage).not.toHaveBeenCalled();
        expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(2);
      });

      it('should respect nextPageNumber from utility', async () => {
        calculateNextPageNavigation.mockReturnValue({
          action: NavigationAction.CHANGE_PAGE,
          nextPageNumber: 5,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers(defaultParams),
        );

        await act(async () => {
          await result.current.handleNextPage();
        });

        expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(5);
      });
    });

    describe('FETCH_THEN_CHANGE action', () => {
      test.each([
        {
          description: 'should fetch then change page with isActive filter',
          overrides: {},
          nextPageNumber: 3,
          expectedFilter: { isActive: true },
          expectedOrderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
          expectedPage: 3,
        },
        {
          description:
            'should include search filter with isActive when provided',
          overrides: { searchTerm: 'John' },
          nextPageNumber: 2,
          expectedFilter: { isActive: true, searchText: 'John' },
          expectedOrderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
          expectedPage: 2,
        },
        {
          description: 'should trim search term',
          overrides: { searchTerm: '  Test  ' },
          nextPageNumber: 2,
          expectedFilter: { isActive: true, searchText: 'Test' },
          expectedOrderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
          expectedPage: 2,
        },
        {
          description: 'should respect sort order',
          overrides: { sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc },
          nextPageNumber: 2,
          expectedFilter: { isActive: true },
          expectedOrderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
          expectedPage: 2,
        },
      ])(
        '$description',
        async ({
          overrides,
          nextPageNumber,
          expectedFilter,
          expectedOrderBy,
          expectedPage,
        }) => {
          calculateNextPageNavigation.mockReturnValue({
            action: NavigationAction.FETCH_THEN_CHANGE,
            nextPageNumber,
          });

          const { result } = renderHook(() =>
            usePaginationHandlers({ ...defaultParams, ...overrides }),
          );

          await act(async () => {
            await result.current.handleNextPage();
          });

          expect(mockFetchNextPage).toHaveBeenCalledWith({
            first: WORKERS_PAGE_SIZE,
            filter: expectedFilter,
            orderBy: expectedOrderBy,
          });
          expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(expectedPage);
        },
      );

      it('should wait for fetch before changing page', async () => {
        calculateNextPageNavigation.mockReturnValue({
          action: NavigationAction.FETCH_THEN_CHANGE,
          nextPageNumber: 2,
        });

        let resolveFetch: any;
        const fetchPromise = new Promise((resolve) => {
          resolveFetch = resolve;
        });
        mockFetchNextPage.mockReturnValue(fetchPromise);

        const { result } = renderHook(() =>
          usePaginationHandlers(defaultParams),
        );

        const navigationPromise = act(async () => {
          await result.current.handleNextPage();
        });

        // Page should not be changed yet
        expect(mockSetCurrentPageNumber).not.toHaveBeenCalled();

        resolveFetch();
        await navigationPromise;

        // Now page should be changed
        expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(2);
      });
    });

    describe('Edit Mode Scenarios', () => {
      it('should handle edit mode next page navigation', async () => {
        calculateNextPageNavigation.mockReturnValue({
          action: NavigationAction.FETCH_THEN_CHANGE,
          nextPageNumber: 2,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers({
            ...defaultParams,
            isEditMode: true,
            hasNextPage: true,
          }),
        );

        await act(async () => {
          await result.current.handleNextPage();
        });

        expect(calculateNextPageNavigation).toHaveBeenCalledWith(
          expect.objectContaining({
            isEditMode: true,
            hasNextPage: true,
          }),
        );
      });
    });

    describe('Create Mode Scenarios', () => {
      it('should handle create mode next page navigation', async () => {
        calculateNextPageNavigation.mockReturnValue({
          action: NavigationAction.CHANGE_PAGE,
          nextPageNumber: 2,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers({
            ...defaultParams,
            isEditMode: false,
            fullPagesOfSelected: 2,
            transitionPageNumber: 3,
          }),
        );

        await act(async () => {
          await result.current.handleNextPage();
        });

        expect(calculateNextPageNavigation).toHaveBeenCalledWith(
          expect.objectContaining({
            isEditMode: false,
            fullPagesOfSelected: 2,
            transitionPageNumber: 3,
          }),
        );
      });
    });
  });

  describe('handlePreviousPage', () => {
    describe('DO_NOTHING action', () => {
      it('should do nothing when utility returns DO_NOTHING', async () => {
        calculatePreviousPageNavigation.mockReturnValue({
          action: NavigationAction.DO_NOTHING,
          nextPageNumber: 1,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers(defaultParams),
        );

        await act(async () => {
          await result.current.handlePreviousPage();
        });

        expect(mockFetchPreviousPage).not.toHaveBeenCalled();
        expect(mockSetCurrentPageNumber).not.toHaveBeenCalled();
      });

      it('should not navigate when loading', async () => {
        calculatePreviousPageNavigation.mockReturnValue({
          action: NavigationAction.CHANGE_PAGE,
          nextPageNumber: 1,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers({
            ...defaultParams,
            loading: true,
            currentPageNumber: 2,
          }),
        );

        await act(async () => {
          await result.current.handlePreviousPage();
        });

        expect(mockSetCurrentPageNumber).not.toHaveBeenCalled();
      });
    });

    describe('CHANGE_PAGE action', () => {
      it('should change page without fetching', async () => {
        calculatePreviousPageNavigation.mockReturnValue({
          action: NavigationAction.CHANGE_PAGE,
          nextPageNumber: 1,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers({
            ...defaultParams,
            currentPageNumber: 2,
          }),
        );

        await act(async () => {
          await result.current.handlePreviousPage();
        });

        expect(mockFetchPreviousPage).not.toHaveBeenCalled();
        expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(1);
      });

      it('should respect nextPageNumber from utility', async () => {
        calculatePreviousPageNavigation.mockReturnValue({
          action: NavigationAction.CHANGE_PAGE,
          nextPageNumber: 3,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers({
            ...defaultParams,
            currentPageNumber: 4,
          }),
        );

        await act(async () => {
          await result.current.handlePreviousPage();
        });

        expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(3);
      });
    });

    describe('FETCH_THEN_CHANGE action', () => {
      test.each([
        {
          description: 'should fetch then change page with isActive filter',
          overrides: { currentPageNumber: 3 },
          nextPageNumber: 2,
          expectedFilter: { isActive: true },
          expectedOrderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
          expectedPage: 2,
        },
        {
          description:
            'should include search filter with isActive when provided',
          overrides: { currentPageNumber: 2, searchTerm: 'Search' },
          nextPageNumber: 1,
          expectedFilter: { isActive: true, searchText: 'Search' },
          expectedOrderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
          expectedPage: 1,
        },
        {
          description: 'should respect sort order',
          overrides: {
            currentPageNumber: 2,
            sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc,
          },
          nextPageNumber: 1,
          expectedFilter: { isActive: true },
          expectedOrderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
          expectedPage: 1,
        },
      ])(
        '$description',
        async ({
          overrides,
          nextPageNumber,
          expectedFilter,
          expectedOrderBy,
          expectedPage,
        }) => {
          calculatePreviousPageNavigation.mockReturnValue({
            action: NavigationAction.FETCH_THEN_CHANGE,
            nextPageNumber,
          });

          const { result } = renderHook(() =>
            usePaginationHandlers({ ...defaultParams, ...overrides }),
          );

          await act(async () => {
            await result.current.handlePreviousPage();
          });

          expect(mockFetchPreviousPage).toHaveBeenCalledWith({
            first: WORKERS_PAGE_SIZE,
            filter: expectedFilter,
            orderBy: expectedOrderBy,
          });
          expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(expectedPage);
        },
      );
    });

    describe('Edit Mode Scenarios', () => {
      it('should handle edit mode previous page navigation', async () => {
        calculatePreviousPageNavigation.mockReturnValue({
          action: NavigationAction.FETCH_THEN_CHANGE,
          nextPageNumber: 1,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers({
            ...defaultParams,
            isEditMode: true,
            currentPageNumber: 2,
            hasPreviousPage: true,
          }),
        );

        await act(async () => {
          await result.current.handlePreviousPage();
        });

        expect(calculatePreviousPageNavigation).toHaveBeenCalledWith(
          expect.objectContaining({
            isEditMode: true,
            hasPreviousPage: true,
          }),
        );
      });
    });

    describe('Create Mode Scenarios', () => {
      it('should handle create mode previous page navigation', async () => {
        calculatePreviousPageNavigation.mockReturnValue({
          action: NavigationAction.CHANGE_PAGE,
          nextPageNumber: 1,
        });

        const { result } = renderHook(() =>
          usePaginationHandlers({
            ...defaultParams,
            isEditMode: false,
            currentPageNumber: 2,
            fullPagesOfSelected: 1,
            totalPagesForSelected: 1,
          }),
        );

        await act(async () => {
          await result.current.handlePreviousPage();
        });

        expect(calculatePreviousPageNavigation).toHaveBeenCalledWith(
          expect.objectContaining({
            isEditMode: false,
            fullPagesOfSelected: 1,
            totalPagesForSelected: 1,
          }),
        );
      });
    });
  });

  describe('Integration', () => {
    it('should handle back-and-forth navigation', async () => {
      // Setup: Start on page 1
      calculateNextPageNavigation.mockReturnValue({
        action: NavigationAction.CHANGE_PAGE,
        nextPageNumber: 2,
      });
      calculatePreviousPageNavigation.mockReturnValue({
        action: NavigationAction.CHANGE_PAGE,
        nextPageNumber: 1,
      });

      const { result } = renderHook(() => usePaginationHandlers(defaultParams));

      // Go to page 2
      await act(async () => {
        await result.current.handleNextPage();
      });
      expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(2);

      mockSetCurrentPageNumber.mockClear();

      // Go back to page 1
      await act(async () => {
        await result.current.handlePreviousPage();
      });
      expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(1);
    });

    it('should coordinate with utility functions', async () => {
      calculateNextPageNavigation.mockReturnValue({
        action: NavigationAction.FETCH_THEN_CHANGE,
        nextPageNumber: 2,
      });

      const { result } = renderHook(() =>
        usePaginationHandlers({
          ...defaultParams,
          currentPageNumber: 1,
          drawerWorkersLength: 25,
          hasNextPage: true,
        }),
      );

      await act(async () => {
        await result.current.handleNextPage();
      });

      expect(calculateNextPageNavigation).toHaveBeenCalledWith({
        currentPageNumber: 1,
        isEditMode: true,
        drawerWorkersLength: 25,
        hasNextPage: true,
        fullPagesOfSelected: 0,
        transitionPageNumber: 1,
      });
    });
  });
});
