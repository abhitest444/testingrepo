import { act } from '@testing-library/react-hooks';
import { useServiceItems } from 'src/js/widgets/quickFind/hooks/useServiceItems';
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

describe('useServiceItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('preloaded options only (no SFO)', () => {
    it('should return initial state when no options provided', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useServiceItems(),
      );

      expect(result.current.serviceItems).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(false);
    });

    it('should return preloadedOptions when provided', () => {
      const items = [
        {
          id: '1',
          name: 'Consulting',
          assigned: true,
          active: true,
          fullName: undefined,
          parentId: undefined,
          level: undefined,
          numberOfChildren: 0,
        },
        {
          id: '2',
          name: 'Development',
          assigned: false,
          active: true,
          fullName: undefined,
          parentId: undefined,
          level: undefined,
          numberOfChildren: 0,
        },
      ];

      const { result } = renderHookWithQuicksandProvider(() =>
        useServiceItems({ preloadedOptions: items }),
      );

      expect(result.current.serviceItems).toEqual(items);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(false);
    });

    it('should return empty array when preloadedOptions is null', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useServiceItems({ preloadedOptions: null }),
      );

      expect(result.current.serviceItems).toEqual([]);
    });

    it('should expose no-op loadServiceItems, refetch, loadMore', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useServiceItems(),
      );

      expect(() => {
        act(() => {
          result.current.loadServiceItems({
            timeForEntityId: '123',
            customerId: '456',
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

      expect(result.current.serviceItems).toEqual([]);
      expect(result.current.hasMore).toBe(false);
    });

    it('should accept pageSize and enableLoadMore options without changing behavior', () => {
      const { result } = renderHookWithQuicksandProvider(() =>
        useServiceItems({ pageSize: 50, enableLoadMore: true }),
      );

      expect(result.current.serviceItems).toEqual([]);
      expect(result.current.hasMore).toBe(false);
    });

    it('should use loadMoreFromParent and hasMoreFromParent when provided', () => {
      const loadMoreFromParent = jest.fn();
      const items = [
        { id: '1', name: 'Consulting', assigned: true, active: true },
      ];

      const { result } = renderHookWithQuicksandProvider(() =>
        useServiceItems({
          preloadedOptions: items,
          hasMoreFromParent: true,
          loadMoreFromParent,
        }),
      );

      expect(result.current.serviceItems).toEqual(items);
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
        useServiceItems({ timeForEntityId: 'worker-1' }),
      );

      expect(mockLoadSfo).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            standardFieldLabel: 'SERVICE_ITEM',
            timeForEntityId: 'worker-1',
          }),
          filter: { assigned: true, active: true },
          first: 100,
        }),
      );
    });

    it('should set serviceItems when SFO returns data', () => {
      const sfoData = [
        {
          id: 's1',
          name: 'Consulting',
          assigned: true,
          active: true,
          standardFieldLabel: 'SERVICE_ITEM',
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
        useServiceItems({ timeForEntityId: 'worker-1' }),
      );

      expect(result.current.serviceItems).toEqual([
        { id: 's1', name: 'Consulting', assigned: true, active: true },
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
        useServiceItems({ timeForEntityId: 'worker-1' }),
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
            standardFieldLabel: 'SERVICE_ITEM',
          },
        ],
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useServiceItems({ timeForEntityId: 'worker-1', enableLoadMore: true }),
      );

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadSfo).toHaveBeenLastCalledWith(
        expect.objectContaining({ after: 'cursor-1' }),
      );
    });

    it('should clear serviceItems when loadServiceItems is called with no workerId', () => {
      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: [
          {
            id: '1',
            name: 'A',
            assigned: true,
            active: true,
            standardFieldLabel: 'SERVICE_ITEM',
          },
        ],
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: null,
      });

      const { result } = renderHookWithQuicksandProvider(() =>
        useServiceItems(),
      );

      act(() => {
        result.current.loadServiceItems({ timeForEntityId: 'worker-1' });
      });

      expect(result.current.serviceItems.length).toBeGreaterThan(0);

      act(() => {
        result.current.loadServiceItems();
      });

      expect(result.current.serviceItems).toEqual([]);
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
        useServiceItems({
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
          standardFieldLabel: 'SERVICE_ITEM' as const,
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
        useServiceItems({ timeForEntityId: 'worker-1', enableLoadMore: true }),
      );
      expect(result.current.serviceItems).toHaveLength(1);

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
      expect(result.current.serviceItems.map((i) => i.id)).toEqual(['1']);

      mockUseStandardFieldOptionAssignments.mockReturnValue({
        data: [
          {
            id: '2',
            name: 'B',
            assigned: true,
            active: true,
            standardFieldLabel: 'SERVICE_ITEM' as const,
          },
        ],
        error: null,
        loading: false,
        loadStandardFieldOptionAssignments: mockLoadSfo,
        pageInfo: { hasNextPage: false, endCursor: null },
      });
      rerender();
      expect(result.current.serviceItems.map((i) => i.id)).toEqual(['1', '2']);
    });
  });
});
