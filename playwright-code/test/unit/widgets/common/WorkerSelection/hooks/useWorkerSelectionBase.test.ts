import { renderHook, act } from '@testing-library/react-hooks';
import {
  useWorkerSelectionBase,
  computeSelectionState,
} from 'src/js/widgets/common/WorkerSelection/hooks/useWorkerSelectionBase';
import type { SelectableWorker } from 'src/js/widgets/common/WorkerSelection/components/WorkerSelectionTable.types';
import { createMockWorker } from 'test/unit/fixtures';

describe('useWorkerSelectionBase', () => {
  const mockWorkers: SelectableWorker[] = [
    createMockWorker('worker-1'),
    createMockWorker('worker-2'),
    createMockWorker('worker-3'),
  ];

  describe('initialization', () => {
    it('initializes with empty selection by default', () => {
      const { result } = renderHook(() => useWorkerSelectionBase());

      expect(result.current.selectedIds.size).toBe(0);
    });

    it('initializes with provided initialSelectedIds', () => {
      const { result } = renderHook(() =>
        useWorkerSelectionBase({
          initialSelectedIds: ['worker-1', 'worker-2'],
        }),
      );

      expect(result.current.selectedIds.size).toBe(2);
      expect(result.current.selectedIds.has('worker-1')).toBe(true);
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
    });
  });

  describe('toggleWorker', () => {
    test.each([
      {
        description: 'adds worker to selection when not selected',
        initialIds: undefined as string[] | undefined,
        expectedHas: true,
      },
      {
        description: 'removes worker from selection when already selected',
        initialIds: ['worker-1'] as string[],
        expectedHas: false,
      },
    ])('$description', ({ initialIds, expectedHas }) => {
      const { result } = renderHook(() =>
        useWorkerSelectionBase(
          initialIds !== undefined
            ? { initialSelectedIds: initialIds }
            : undefined,
        ),
      );

      act(() => {
        result.current.toggleWorker('worker-1');
      });

      expect(result.current.selectedIds.has('worker-1')).toBe(expectedHas);
    });

    it('calls onSelectionChange callback when selection changes', () => {
      const mockOnSelectionChange = jest.fn();
      const { result } = renderHook(() =>
        useWorkerSelectionBase({ onSelectionChange: mockOnSelectionChange }),
      );

      act(() => {
        result.current.toggleWorker('worker-1');
      });

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['worker-1']);
    });

    it('maintains other selections when toggling one worker', () => {
      const { result } = renderHook(() =>
        useWorkerSelectionBase({
          initialSelectedIds: ['worker-1', 'worker-2'],
        }),
      );

      act(() => {
        result.current.toggleWorker('worker-1');
      });

      expect(result.current.selectedIds.has('worker-1')).toBe(false);
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
    });
  });

  describe('selectAll', () => {
    test.each([
      {
        description: 'adds all workers when select is true',
        select: true,
        initialIds: [] as string[],
        expectedSize: 3,
      },
      {
        description: 'removes all workers when select is false',
        select: false,
        initialIds: ['worker-1', 'worker-2', 'worker-3'] as string[],
        expectedSize: 0,
      },
    ])('$description', ({ select, initialIds, expectedSize }) => {
      const { result } = renderHook(() =>
        useWorkerSelectionBase(
          initialIds.length > 0
            ? { initialSelectedIds: initialIds }
            : undefined,
        ),
      );

      act(() => {
        result.current.selectAll(mockWorkers, select);
      });

      expect(result.current.selectedIds.size).toBe(expectedSize);
    });

    it('preserves selections from other pages when selecting all on current page', () => {
      const { result } = renderHook(() =>
        useWorkerSelectionBase({ initialSelectedIds: ['other-page-worker'] }),
      );

      act(() => {
        result.current.selectAll(mockWorkers, true);
      });

      expect(result.current.selectedIds.size).toBe(4);
      expect(result.current.selectedIds.has('other-page-worker')).toBe(true);
      expect(result.current.selectedIds.has('worker-1')).toBe(true);
    });

    it('preserves selections from other pages when deselecting all on current page', () => {
      const { result } = renderHook(() =>
        useWorkerSelectionBase({
          initialSelectedIds: ['other-page-worker', 'worker-1', 'worker-2'],
        }),
      );

      act(() => {
        result.current.selectAll(mockWorkers, false);
      });

      expect(result.current.selectedIds.size).toBe(1);
      expect(result.current.selectedIds.has('other-page-worker')).toBe(true);
    });

    it('calls onSelectionChange callback when selecting all', () => {
      const mockOnSelectionChange = jest.fn();
      const { result } = renderHook(() =>
        useWorkerSelectionBase({ onSelectionChange: mockOnSelectionChange }),
      );

      act(() => {
        result.current.selectAll(mockWorkers, true);
      });

      expect(mockOnSelectionChange).toHaveBeenCalled();
      const calledIds = mockOnSelectionChange.mock.calls[0][0];
      expect(calledIds).toContain('worker-1');
      expect(calledIds).toContain('worker-2');
      expect(calledIds).toContain('worker-3');
    });
  });

  describe('setSelectedIds', () => {
    it('replaces entire selection with provided IDs', () => {
      const { result } = renderHook(() =>
        useWorkerSelectionBase({ initialSelectedIds: ['worker-1'] }),
      );

      act(() => {
        result.current.setSelectedIds(['worker-2', 'worker-3']);
      });

      expect(result.current.selectedIds.size).toBe(2);
      expect(result.current.selectedIds.has('worker-1')).toBe(false);
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
      expect(result.current.selectedIds.has('worker-3')).toBe(true);
    });

    it('does NOT call onSelectionChange to avoid loops during external sync', () => {
      const mockOnSelectionChange = jest.fn();
      const { result } = renderHook(() =>
        useWorkerSelectionBase({ onSelectionChange: mockOnSelectionChange }),
      );

      act(() => {
        result.current.setSelectedIds(['worker-1']);
      });

      expect(mockOnSelectionChange).not.toHaveBeenCalled();
    });
  });

  describe('getSelectedArray', () => {
    it('returns selected IDs as array', () => {
      const { result } = renderHook(() =>
        useWorkerSelectionBase({
          initialSelectedIds: ['worker-1', 'worker-2'],
        }),
      );

      const selectedArray = result.current.getSelectedArray();

      expect(Array.isArray(selectedArray)).toBe(true);
      expect(selectedArray.length).toBe(2);
      expect(selectedArray).toContain('worker-1');
      expect(selectedArray).toContain('worker-2');
    });

    it('returns empty array when nothing is selected', () => {
      const { result } = renderHook(() => useWorkerSelectionBase());

      const selectedArray = result.current.getSelectedArray();

      expect(selectedArray).toEqual([]);
    });
  });
});

describe('computeSelectionState', () => {
  const mockWorkers: SelectableWorker[] = [
    createMockWorker('worker-1'),
    createMockWorker('worker-2'),
    createMockWorker('worker-3'),
  ];

  it('returns allSelected true when all workers are selected', () => {
    const selectedIds = new Set(['worker-1', 'worker-2', 'worker-3']);

    const result = computeSelectionState(mockWorkers, selectedIds);

    expect(result.allSelected).toBe(true);
    expect(result.someSelected).toBe(false);
  });

  it('returns someSelected true when some (but not all) workers are selected', () => {
    const selectedIds = new Set(['worker-1', 'worker-2']);

    const result = computeSelectionState(mockWorkers, selectedIds);

    expect(result.allSelected).toBe(false);
    expect(result.someSelected).toBe(true);
  });

  it('returns both false when no workers are selected', () => {
    const selectedIds = new Set<string>();

    const result = computeSelectionState(mockWorkers, selectedIds);

    expect(result.allSelected).toBe(false);
    expect(result.someSelected).toBe(false);
  });

  it('returns both false when workers list is empty', () => {
    const selectedIds = new Set(['worker-1']);

    const result = computeSelectionState([], selectedIds);

    expect(result.allSelected).toBe(false);
    expect(result.someSelected).toBe(false);
  });

  it('handles selections that include IDs not in current workers list', () => {
    // IDs from other pages
    const selectedIds = new Set(['worker-1', 'other-page-worker']);

    const result = computeSelectionState(mockWorkers, selectedIds);

    // Only 1 of 3 visible workers is selected
    expect(result.allSelected).toBe(false);
    expect(result.someSelected).toBe(true);
  });

  it('correctly identifies allSelected even with extra IDs from other pages', () => {
    // All visible workers + one from another page
    const selectedIds = new Set([
      'worker-1',
      'worker-2',
      'worker-3',
      'other-page-worker',
    ]);

    const result = computeSelectionState(mockWorkers, selectedIds);

    expect(result.allSelected).toBe(true);
    expect(result.someSelected).toBe(false);
  });
});
