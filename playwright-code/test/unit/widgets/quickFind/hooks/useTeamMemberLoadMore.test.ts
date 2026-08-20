import { renderHook, act } from '@testing-library/react-hooks';
import { useTeamMemberLoadMore } from '../../../../../src/js/widgets/quickFind/hooks/useTeamMemberLoadMore';
import {
  TimeTracking_WorkerOrderBy,
  TimeTracking_TimeForType,
} from '../../../../../src/__generated__/timeTracking/graphql';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    },
  }),
}));

const mockLoadWorkers = jest.fn();
const mockRefetch = jest.fn();
const mockUseTimeTrackingWorkers = jest.fn();

jest.mock(
  '../../../../../src/js/service/hooks/groups/useTimeTrackingWorkers',
  () => ({
    useTimeTrackingWorkers: () => mockUseTimeTrackingWorkers(),
  }),
);

describe('useTeamMemberLoadMore', () => {
  const mockWorkers = [
    {
      id: 'worker1',
      displayName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      type: 'EMPLOYEE',
    },
    {
      id: 'worker2',
      displayName: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      type: 'EMPLOYEE',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock return value
    mockUseTimeTrackingWorkers.mockReturnValue({
      loading: false,
      workers: mockWorkers,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: 'cursor1',
        endCursor: 'cursor2',
      },
      error: null,
      loadWorkers: mockLoadWorkers,
      fetchNextPage: jest.fn(),
      fetchPreviousPage: jest.fn(),
      refetch: mockRefetch,
    });
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useTeamMemberLoadMore());

      expect(result.current.workers).toEqual(mockWorkers);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(false);
    });

    it('should use default pageSize of 100', () => {
      const { result } = renderHook(() => useTeamMemberLoadMore());

      act(() => {
        result.current.loadWorkers({ isActive: true });
      });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: 100,
        after: undefined,
        filter: { isActive: true },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('should use custom pageSize when provided', () => {
      const { result } = renderHook(() =>
        useTeamMemberLoadMore({ pageSize: 50 }),
      );

      act(() => {
        result.current.loadWorkers({ isActive: true });
      });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: 50,
        after: undefined,
        filter: { isActive: true },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });
  });

  describe('loadWorkers', () => {
    it('should call loadWorkers with correct parameters', () => {
      const { result } = renderHook(() => useTeamMemberLoadMore());

      act(() => {
        result.current.loadWorkers({
          isActive: true,
          types: [TimeTracking_TimeForType.Employee],
        });
      });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: 100,
        after: undefined,
        filter: {
          isActive: true,
          types: [TimeTracking_TimeForType.Employee],
        },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });
  });

  describe('Load More Functionality', () => {
    it('should not load more when load more is disabled', () => {
      const { result } = renderHook(() =>
        useTeamMemberLoadMore({ enableLoadMore: false }),
      );

      mockLoadWorkers.mockClear();

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWorkers).not.toHaveBeenCalled();
    });

    it('should not load more when hasMore is false', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        loading: false,
        workers: mockWorkers,
        pageInfo: {
          hasNextPage: false,
          endCursor: 'cursor2',
        },
        error: null,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: jest.fn(),
        fetchPreviousPage: jest.fn(),
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        useTeamMemberLoadMore({ enableLoadMore: true }),
      );

      mockLoadWorkers.mockClear();

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWorkers).not.toHaveBeenCalled();
    });

    it('should not load more when already loading', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        loading: true,
        workers: mockWorkers,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor2',
        },
        error: null,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: jest.fn(),
        fetchPreviousPage: jest.fn(),
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        useTeamMemberLoadMore({ enableLoadMore: true }),
      );

      mockLoadWorkers.mockClear();

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWorkers).not.toHaveBeenCalled();
    });

    it('should load more with endCursor when conditions are met', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        loading: false,
        workers: mockWorkers,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor2',
        },
        error: null,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: jest.fn(),
        fetchPreviousPage: jest.fn(),
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        useTeamMemberLoadMore({ enableLoadMore: true }),
      );

      // Set up the filter first
      act(() => {
        result.current.loadWorkers({ isActive: true });
      });

      mockLoadWorkers.mockClear();

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: 100,
        after: 'cursor2',
        filter: { isActive: true },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });
  });

  describe('hasMore flag', () => {
    it('should set hasMore to true when pageInfo.hasNextPage is true and load more is enabled', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        loading: false,
        workers: mockWorkers,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor2',
        },
        error: null,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: jest.fn(),
        fetchPreviousPage: jest.fn(),
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        useTeamMemberLoadMore({ enableLoadMore: true }),
      );

      expect(result.current.hasMore).toBe(true);
    });

    it('should set hasMore to false when load more is disabled', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        loading: false,
        workers: mockWorkers,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor2',
        },
        error: null,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: jest.fn(),
        fetchPreviousPage: jest.fn(),
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        useTeamMemberLoadMore({ enableLoadMore: false }),
      );

      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return error from base hook', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        loading: false,
        workers: [],
        pageInfo: null,
        error: 'Failed to load workers',
        loadWorkers: mockLoadWorkers,
        fetchNextPage: jest.fn(),
        fetchPreviousPage: jest.fn(),
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useTeamMemberLoadMore());

      expect(result.current.error).toBe('Failed to load workers');
    });

    it('should return loading state from base hook', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        loading: true,
        workers: [],
        pageInfo: null,
        error: null,
        loadWorkers: mockLoadWorkers,
        fetchNextPage: jest.fn(),
        fetchPreviousPage: jest.fn(),
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useTeamMemberLoadMore());

      expect(result.current.loading).toBe(true);
    });
  });

  describe('refetch', () => {
    it('should call loadWorkers with provided filter', () => {
      const { result } = renderHook(() => useTeamMemberLoadMore());

      const filter = {
        isActive: true,
        types: [TimeTracking_TimeForType.Vendor],
      };

      act(() => {
        result.current.refetch(filter);
      });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: 100,
        after: undefined,
        filter,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });
  });
});
