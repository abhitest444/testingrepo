import { renderHook, act } from '@testing-library/react-hooks';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import { useSearchAndSort } from 'src/js/widgets/assignments/hooks/useSearchAndSort';
import { WORKERS_PAGE_SIZE } from 'src/js/widgets/assignments/utils/constants';

describe('useSearchAndSort', () => {
  const mockSetCurrentPageNumber = jest.fn();
  const mockRefetch = jest.fn();

  const defaultParams = {
    setCurrentPageNumber: mockSetCurrentPageNumber,
    refetch: mockRefetch,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty search and ascending sort', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      expect(result.current.searchTerm).toBe('');
      expect(result.current.sortOrder).toBe(
        TimeTracking_WorkerOrderBy.DisplayNameAsc,
      );
    });
  });

  describe('Search Functionality', () => {
    it('should update search term when handleSearchChange is called', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      act(() => {
        result.current.handleSearchChange('John');
      });

      expect(result.current.searchTerm).toBe('John');
    });

    it('should trigger refetch with filter when search term is provided', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      act(() => {
        result.current.handleSearchChange('John');
      });

      expect(mockRefetch).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        filter: { searchText: 'John' },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('should trim search term before refetching', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      act(() => {
        result.current.handleSearchChange('  John Doe  ');
      });

      expect(mockRefetch).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        filter: { searchText: 'John Doe' },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('should clear filter when search is empty', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      // First set a search term
      act(() => {
        result.current.handleSearchChange('Test');
      });

      // Then clear it
      act(() => {
        result.current.handleSearchChange('');
      });

      expect(mockRefetch).toHaveBeenLastCalledWith({
        first: WORKERS_PAGE_SIZE,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('should not include filter when search term is only whitespace', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      act(() => {
        result.current.handleSearchChange('   ');
      });

      expect(mockRefetch).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('should reset page number when search changes', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      act(() => {
        result.current.handleSearchChange('Test');
      });

      expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(1);
    });
  });

  describe('Sort Functionality', () => {
    it('should toggle sort order from ascending to descending', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      expect(result.current.sortOrder).toBe(
        TimeTracking_WorkerOrderBy.DisplayNameAsc,
      );

      act(() => {
        result.current.handleSorting();
      });

      expect(result.current.sortOrder).toBe(
        TimeTracking_WorkerOrderBy.DisplayNameDesc,
      );
    });

    it('should toggle sort order from descending to ascending', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      // First toggle to descending
      act(() => {
        result.current.handleSorting();
      });

      expect(result.current.sortOrder).toBe(
        TimeTracking_WorkerOrderBy.DisplayNameDesc,
      );

      // Toggle back to ascending
      act(() => {
        result.current.handleSorting();
      });

      expect(result.current.sortOrder).toBe(
        TimeTracking_WorkerOrderBy.DisplayNameAsc,
      );
    });

    it('should trigger refetch with new sort order', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      act(() => {
        result.current.handleSorting();
      });

      expect(mockRefetch).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
      });
    });

    it('should preserve search filter when sorting', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      // Set search term first
      act(() => {
        result.current.handleSearchChange('John');
      });

      mockRefetch.mockClear();

      // Then sort
      act(() => {
        result.current.handleSorting();
      });

      expect(mockRefetch).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        filter: { searchText: 'John' },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
      });
    });

    it('should reset page number when sort changes', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      mockSetCurrentPageNumber.mockClear();

      act(() => {
        result.current.handleSorting();
      });

      expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(1);
    });
  });

  describe('Combined Search and Sort', () => {
    it('should maintain sort order when searching', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      // Change sort order first
      act(() => {
        result.current.handleSorting();
      });

      mockRefetch.mockClear();

      // Then search
      act(() => {
        result.current.handleSearchChange('Test');
      });

      expect(mockRefetch).toHaveBeenCalledWith({
        first: WORKERS_PAGE_SIZE,
        filter: { searchText: 'Test' },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
      });
    });

    it('should handle multiple search updates', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      act(() => {
        result.current.handleSearchChange('First');
      });

      act(() => {
        result.current.handleSearchChange('Second');
      });

      act(() => {
        result.current.handleSearchChange('Third');
      });

      expect(result.current.searchTerm).toBe('Third');
      expect(mockRefetch).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple sort toggles', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      act(() => {
        result.current.handleSorting();
      });
      expect(result.current.sortOrder).toBe(
        TimeTracking_WorkerOrderBy.DisplayNameDesc,
      );

      act(() => {
        result.current.handleSorting();
      });
      expect(result.current.sortOrder).toBe(
        TimeTracking_WorkerOrderBy.DisplayNameAsc,
      );

      act(() => {
        result.current.handleSorting();
      });
      expect(result.current.sortOrder).toBe(
        TimeTracking_WorkerOrderBy.DisplayNameDesc,
      );

      expect(mockRefetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Page Reset Behavior', () => {
    test.each([
      {
        description: 'should reset page only once when search changes',
        trigger: (r: any) => {
          r.current.handleSearchChange('Test');
        },
      },
      {
        description: 'should reset page only once when sort changes',
        trigger: (r: any) => {
          r.current.handleSorting();
        },
      },
    ])('$description', ({ trigger }) => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      mockSetCurrentPageNumber.mockClear();

      act(() => {
        trigger(result);
      });

      expect(mockSetCurrentPageNumber).toHaveBeenCalledTimes(1);
      expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(1);
    });

    it('should reset page when changing from search to empty', () => {
      const { result } = renderHook(() => useSearchAndSort(defaultParams));

      act(() => {
        result.current.handleSearchChange('Test');
      });

      mockSetCurrentPageNumber.mockClear();

      act(() => {
        result.current.handleSearchChange('');
      });

      expect(mockSetCurrentPageNumber).toHaveBeenCalledWith(1);
    });
  });

  describe('Callback Stability', () => {
    it('should have stable handleSearchChange callback', () => {
      const { result, rerender } = renderHook(() =>
        useSearchAndSort(defaultParams),
      );

      const firstCallback = result.current.handleSearchChange;

      rerender();

      const secondCallback = result.current.handleSearchChange;

      expect(firstCallback).toBe(secondCallback);
    });

    it('should have stable handleSorting callback', () => {
      const { result, rerender } = renderHook(() =>
        useSearchAndSort(defaultParams),
      );

      const firstCallback = result.current.handleSorting;

      rerender();

      const secondCallback = result.current.handleSorting;

      expect(firstCallback).toBe(secondCallback);
    });
  });
});
