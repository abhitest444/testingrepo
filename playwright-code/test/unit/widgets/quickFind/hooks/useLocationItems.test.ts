import { act } from '@testing-library/react-hooks';
import { useLocationItems } from 'src/js/widgets/quickFind/hooks/useLocationItems';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';

const mockLoadSfo = jest.fn();
const mockUseStandardFieldOptionAssignments = jest.fn(
  (): {
    data: any;
    error: null;
    loading: boolean;
    loadStandardFieldOptionAssignments: typeof mockLoadSfo;
    pageInfo: any;
  } => ({
    data: null,
    error: null,
    loading: false,
    loadStandardFieldOptionAssignments: mockLoadSfo,
    pageInfo: null,
  }),
);

jest.mock(
  'src/js/service/hooks/assignments/useStandardFieldOptionAssignments',
  () => ({
    useStandardFieldOptionAssignments: (() =>
      mockUseStandardFieldOptionAssignments()) as any,
  }),
);

describe('useLocationItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial empty state', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems(),
      );

      expect(result.current.locationItems).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(false);
    });

    it('should accept custom pageSize option', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems({ pageSize: 50 }),
      );

      expect(result.current.locationItems).toEqual([]);
    });

    it('should accept enableLoadMore option', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems({ enableLoadMore: false }),
      );

      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('preloaded options only (no SFO)', () => {
    it('should return preloadedOptions when provided', () => {
      const items = [
        {
          id: '1',
          name: 'New York Office',
          assigned: true,
          active: true,
          fullName: undefined,
          parentId: undefined,
          level: undefined,
          numberOfChildren: 0,
        },
        {
          id: '3',
          name: 'San Francisco Office',
          assigned: false,
          active: true,
          fullName: undefined,
          parentId: undefined,
          level: undefined,
          numberOfChildren: 0,
        },
      ];

      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems({ preloadedOptions: items }),
      );

      expect(result.current.locationItems).toEqual(items);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(false);
    });

    it('should return empty array when preloadedOptions is null', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems({ preloadedOptions: null }),
      );

      expect(result.current.locationItems).toEqual([]);
    });

    it('should expose no-op loadLocationItems, refetch, loadMore', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems(),
      );

      expect(() => {
        act(() => {
          result.current.loadLocationItems({
            timeForEntityId: '123',
            customerId: '456',
            projectId: '789',
          });
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.refetch({});
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.loadMore();
        });
      }).not.toThrow();

      expect(result.current.locationItems).toEqual([]);
      expect(result.current.hasMore).toBe(false);
    });

    it('should handle empty data array', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems({ preloadedOptions: [] }),
      );

      expect(result.current.locationItems).toEqual([]);
    });

    it('should use loadMoreFromParent and hasMoreFromParent when provided', () => {
      const loadMoreFromParent = jest.fn();
      const items = [
        { id: '1', name: 'NY Office', assigned: true, active: true },
      ];

      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems({
          preloadedOptions: items,
          hasMoreFromParent: true,
          loadMoreFromParent,
        }),
      );

      expect(result.current.locationItems).toEqual(items);
      expect(result.current.hasMore).toBe(true);
      act(() => {
        result.current.loadMore();
      });
      expect(loadMoreFromParent).toHaveBeenCalled();
    });
  });

  describe('SFO fetch path (timeForEntityId provided)', () => {
    it('should call loadSfo when timeForEntityId is provided on mount', () => {
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: null,
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: null,
      });

      renderHookWithQuicksandProvider(() =>
        useLocationItems({ timeForEntityId: 'worker-1' }),
      );

      expect(mockLoadSfo).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            standardFieldLabel: 'LOCATION',
            timeForEntityId: 'worker-1',
          }),
          filter: { assigned: true, active: true },
          first: 100,
        }),
      );
    });

    it('should set locationItems when SFO returns data', () => {
      const sfoData = [
        {
          id: 'l1',
          name: 'NY Office',
          assigned: true,
          active: true,
          standardFieldLabel: 'LOCATION',
        },
      ];
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: sfoData,
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: null,
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems({ timeForEntityId: 'worker-1' }),
      );

      expect(result.current.locationItems).toEqual([
        { id: 'l1', name: 'NY Office', assigned: true, active: true },
      ]);
    });

    it('should call loadSfo with searchText when refetchWithSearch is called', () => {
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: null,
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: null,
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems({ timeForEntityId: 'worker-1' }),
      );

      expect(mockLoadSfo).toHaveBeenCalled();
      act(() => {
        result.current.refetchWithSearch('search term');
      });

      expect(mockLoadSfo).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ searchText: 'search term' }),
        }),
      );
    });

    it('should call loadSfo with after cursor when loadMore is called and pageInfo has next page', () => {
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: [
          {
            id: '1',
            name: 'A',
            assigned: true,
            active: true,
            standardFieldLabel: 'LOCATION',
          },
        ],
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems({ timeForEntityId: 'worker-1', enableLoadMore: true }),
      );

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadSfo).toHaveBeenLastCalledWith(
        expect.objectContaining({ after: 'cursor-1' }),
      );
    });

    it('should clear locationItems when loadLocationItems is called with no workerId', () => {
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: [
          {
            id: '1',
            name: 'A',
            assigned: true,
            active: true,
            standardFieldLabel: 'LOCATION',
          },
        ],
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: null,
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useLocationItems(),
      );

      act(() => {
        result.current.loadLocationItems({ timeForEntityId: 'worker-1' });
      });

      expect(result.current.locationItems.length).toBeGreaterThan(0);

      act(() => {
        result.current.loadLocationItems();
      });

      expect(result.current.locationItems).toEqual([]);
    });

    it('should use assignmentFilters.assigned when provided', () => {
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: null,
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: null,
      });

      renderHookWithQuicksandProvider(() =>
        useLocationItems({
          timeForEntityId: 'worker-1',
          assignmentFilters: { assigned: null },
        }),
      );

      expect(mockLoadSfo).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ assigned: null }),
        }),
      );
    });

    it('should not replace existing items when an interim empty data emits during loadMore', () => {
      const page1 = [
        {
          id: '1',
          name: 'A',
          assigned: true,
          active: true,
          standardFieldLabel: 'LOCATION' as const,
        },
      ];
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: page1,
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: { hasNextPage: true, endCursor: 'c1' },
      });

      const { result, rerender } = renderHookWithQuicksandProvider(() =>
        useLocationItems({ timeForEntityId: 'worker-1', enableLoadMore: true }),
      );
      expect(result.current.locationItems).toHaveLength(1);

      // Interim empty emission while load-more is in flight — must be ignored
      // so the real page-2 response still appends.
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: [],
        error: null,
        loading: true,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: { hasNextPage: true, endCursor: 'c1' },
      });
      act(() => {
        result.current.loadMore();
      });
      rerender();
      expect(result.current.locationItems.map((i) => i.id)).toEqual(['1']);

      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: [
          {
            id: '2',
            name: 'B',
            assigned: true,
            active: true,
            standardFieldLabel: 'LOCATION' as const,
          },
        ],
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: { hasNextPage: false, endCursor: null },
      });
      rerender();
      expect(result.current.locationItems.map((i) => i.id)).toEqual(['1', '2']);
    });
  });
});
