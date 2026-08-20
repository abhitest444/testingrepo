import { act } from '@testing-library/react-hooks';
import { useClassItems } from 'src/js/widgets/quickFind/hooks/useClassItems';
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

describe('useClassItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial empty state', () => {
      const { result } = renderHookWithQuicksandProvider(() => useClassItems());

      expect(result.current.classItems).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(false);
    });

    it('should accept custom pageSize option', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useClassItems({ pageSize: 50 }),
      );

      expect(result.current.classItems).toEqual([]);
    });

    it('should accept enableLoadMore option', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useClassItems({ enableLoadMore: false }),
      );

      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('preloaded options only (no SFO)', () => {
    it('should return preloadedOptions when provided', () => {
      const items = [
        {
          id: '1',
          name: 'Engineering',
          assigned: true,
          active: true,
          fullName: undefined,
          parentId: undefined,
          level: undefined,
          numberOfChildren: 0,
        },
        {
          id: '2',
          name: 'Marketing',
          assigned: false,
          active: true,
          fullName: undefined,
          parentId: undefined,
          level: undefined,
          numberOfChildren: 0,
        },
      ];

      const { result } = renderHookWithQuicksandProvider(() =>
        useClassItems({ preloadedOptions: items }),
      );

      expect(result.current.classItems).toEqual(items);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(false);
    });

    it('should return empty array when preloadedOptions is null', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useClassItems({ preloadedOptions: null }),
      );

      expect(result.current.classItems).toEqual([]);
    });

    it('should expose no-op loadClassItems, refetch, loadMore', () => {
      const { result } = renderHookWithQuicksandProvider(() => useClassItems());

      expect(() => {
        act(() => {
          result.current.loadClassItems({
            timeForEntityId: '123',
            customerId: '456',
            projectId: '789',
          });
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.refetch();
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.loadMore();
        });
      }).not.toThrow();

      expect(result.current.classItems).toEqual([]);
      expect(result.current.hasMore).toBe(false);
    });

    it('should handle empty data array', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useClassItems({ preloadedOptions: [] }),
      );

      expect(result.current.classItems).toEqual([]);
    });

    it('should use loadMoreFromParent and hasMoreFromParent when provided', () => {
      const loadMoreFromParent = jest.fn();
      const items = [
        {
          id: '1',
          name: 'Engineering',
          assigned: true,
          active: true,
        },
      ];

      const { result } = renderHookWithQuicksandProvider(() =>
        useClassItems({
          preloadedOptions: items,
          hasMoreFromParent: true,
          loadMoreFromParent,
        }),
      );

      expect(result.current.classItems).toEqual(items);
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
        useClassItems({ timeForEntityId: 'worker-1' }),
      );

      expect(mockLoadSfo).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            standardFieldLabel: 'CLASS',
            timeForEntityId: 'worker-1',
          }),
          filter: { assigned: true, active: true },
          first: 100,
        }),
      );
    });

    it('should set classItems when SFO returns data', () => {
      const sfoData = [
        {
          id: 'c1',
          name: 'Class One',
          assigned: true,
          active: true,
          standardFieldLabel: 'CLASS',
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
        useClassItems({ timeForEntityId: 'worker-1' }),
      );

      expect(result.current.classItems).toEqual([
        { id: 'c1', name: 'Class One', assigned: true, active: true },
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
        useClassItems({ timeForEntityId: 'worker-1' }),
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
            standardFieldLabel: 'CLASS',
          },
        ],
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useClassItems({ timeForEntityId: 'worker-1', enableLoadMore: true }),
      );

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadSfo).toHaveBeenLastCalledWith(
        expect.objectContaining({ after: 'cursor-1' }),
      );
    });

    it('should clear classItems when loadClassItems is called with no workerId', () => {
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: [
          {
            id: '1',
            name: 'A',
            assigned: true,
            active: true,
            standardFieldLabel: 'CLASS',
          },
        ],
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: null,
      });

      const { result } = renderHookWithQuicksandProvider(() => useClassItems());

      act(() => {
        result.current.loadClassItems({ timeForEntityId: 'worker-1' });
      });

      expect(result.current.classItems.length).toBeGreaterThan(0);

      act(() => {
        result.current.loadClassItems();
      });

      expect(result.current.classItems).toEqual([]);
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
        useClassItems({
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

    it('should merge new items on loadMore when pageInfo has next page', () => {
      const initialData = [
        {
          id: '1',
          name: 'A',
          assigned: true,
          active: true,
          standardFieldLabel: 'CLASS' as const,
        },
      ];
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: initialData,
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: { hasNextPage: true, endCursor: 'c1' },
      });

      const { result, rerender } = renderHookWithQuicksandProvider(() =>
        useClassItems({ timeForEntityId: 'worker-1', enableLoadMore: true }),
      );

      expect(result.current.classItems).toHaveLength(1);

      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: [
          {
            id: '2',
            name: 'B',
            assigned: true,
            active: true,
            standardFieldLabel: 'CLASS' as const,
          },
        ],
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: { hasNextPage: false, endCursor: null },
      });

      act(() => {
        result.current.loadMore();
      });
      rerender();
      expect(result.current.classItems.map((i) => i.id)).toContain('1');
      expect(result.current.classItems.map((i) => i.id)).toContain('2');
    });

    it('should call loadSfo when refetchWithSearch is called after initial load', () => {
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: null,
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: null,
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useClassItems({ timeForEntityId: 'worker-1' }),
      );

      const callCount = mockLoadSfo.mock.calls.length;
      act(() => {
        result.current.refetchWithSearch('x');
      });
      expect(mockLoadSfo).toHaveBeenCalledTimes(callCount + 1);
    });

    it('should not replace existing items when an interim empty data emits during loadMore', () => {
      // Page 1 loaded
      const page1 = [
        {
          id: '1',
          name: 'A',
          assigned: true,
          active: true,
          standardFieldLabel: 'CLASS' as const,
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
        useClassItems({ timeForEntityId: 'worker-1', enableLoadMore: true }),
      );
      expect(result.current.classItems).toHaveLength(1);

      // Dispatch loadMore — request is in flight (loading=true) and Apollo
      // emits an interim empty data before the real page-2 lands. Our hook
      // must IGNORE that interim emission, otherwise it would consume the
      // pending-load-more counter and the real response would be treated as
      // a "replace" → wiping the accumulated list.
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
      // Existing items must still be there during the in-flight load-more.
      expect(result.current.classItems.map((i) => i.id)).toEqual(['1']);

      // Real page-2 lands.
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: [
          {
            id: '2',
            name: 'B',
            assigned: true,
            active: true,
            standardFieldLabel: 'CLASS' as const,
          },
        ],
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: { hasNextPage: false, endCursor: null },
      });
      rerender();
      expect(result.current.classItems.map((i) => i.id)).toEqual(['1', '2']);
    });
  });
});
