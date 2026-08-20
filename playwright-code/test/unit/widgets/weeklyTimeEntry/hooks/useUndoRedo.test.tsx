import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useUndoRedo } from 'src/js/widgets/weeklyTimeEntry/hooks/useUndoRedo';
import timeEntryGridSlice, {
  updateCell,
  selectCell,
} from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import undoRedoSlice, {
  selectCanUndo,
  selectCanRedo,
  selectCurrentChange,
  selectNextRedoChange,
  recordChange,
  undo,
  redo,
  clearHistory,
} from 'src/js/widgets/weeklyTimeEntry/store/undoRedoSlice';

import { useAppSelector } from 'src/js/widgets/weeklyTimeEntry/store';

// Mock the store selectors and actions
const mockDispatch = jest.fn();
const mockUpdateCell = jest.fn();
const mockSelectCell = jest.fn();
const mockRecordChange = jest.fn();
const mockUndo = jest.fn();
const mockRedo = jest.fn();
const mockClearHistory = jest.fn();

// Mock the store module
jest.mock('src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn(),
}));

jest.mock('src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice', () => ({
  updateCell: jest.fn(),
  selectCell: jest.fn(),
}));

jest.mock('src/js/widgets/weeklyTimeEntry/store/undoRedoSlice', () => ({
  recordChange: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  clearHistory: jest.fn(),
  selectCanUndo: jest.fn(),
  selectCanRedo: jest.fn(),
  selectCurrentChange: jest.fn(),
  selectNextRedoChange: jest.fn(),
}));

const mockUseAppSelector = useAppSelector as jest.MockedFunction<
  typeof useAppSelector
>;

describe('useUndoRedo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockReturnValue({});
  });

  describe('when there are no changes to undo/redo', () => {
    beforeEach(() => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return false;
        if (selector === selectCanRedo) return false;
        if (selector === selectCurrentChange) return null;
        if (selector === selectNextRedoChange) return null;
        return null;
      });
    });

    it('should return correct initial state', () => {
      const { result } = renderHook(() => useUndoRedo());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(typeof result.current.handleUndo).toBe('function');
      expect(typeof result.current.handleRedo).toBe('function');
      expect(typeof result.current.resetHistory).toBe('function');
      expect(typeof result.current.recordHoursChange).toBe('function');
    });

    it('should not perform undo when canUndo is false', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.handleUndo();
      });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not perform undo when currentChange is null', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return true;
        if (selector === selectCanRedo) return false;
        if (selector === selectCurrentChange) return null;
        if (selector === selectNextRedoChange) return null;
        return null;
      });

      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.handleUndo();
      });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not perform redo when canRedo is false', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.handleRedo();
      });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not perform redo when nextRedoChange is null', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return false;
        if (selector === selectCanRedo) return true;
        if (selector === selectCurrentChange) return null;
        if (selector === selectNextRedoChange) return null;
        return null;
      });

      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.handleRedo();
      });

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('when there are changes to undo', () => {
    const mockCurrentChange = {
      rowId: 'row-1',
      dayIdx: 2,
      originalHours: 8.0,
      newHours: 6.0,
    };

    beforeEach(() => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return true;
        if (selector === selectCanRedo) return false;
        if (selector === selectCurrentChange) return mockCurrentChange;
        if (selector === selectNextRedoChange) return null;
        return null;
      });
    });

    it('should perform undo when canUndo is true and currentChange exists', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.handleUndo();
      });

      expect(mockDispatch).toHaveBeenCalledTimes(3);
      expect(updateCell).toHaveBeenCalledWith({
        rowId: 'row-1',
        dayIdx: 2,
        value: { hours: 8.0 },
      });
      expect(selectCell).toHaveBeenCalledWith({
        rowId: 'row-1',
        dayIdx: 2,
      });
      expect(undo).toHaveBeenCalled();
    });

    it('should restore original hours when undoing', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.handleUndo();
      });

      expect(updateCell).toHaveBeenCalledWith({
        rowId: 'row-1',
        dayIdx: 2,
        value: { hours: 8.0 }, // originalHours
      });
    });

    it('should select the cell that was undone', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.handleUndo();
      });

      expect(selectCell).toHaveBeenCalledWith({
        rowId: 'row-1',
        dayIdx: 2,
      });
    });
  });

  describe('when there are changes to redo', () => {
    const mockNextRedoChange = {
      rowId: 'row-2',
      dayIdx: 3,
      originalHours: 4.0,
      newHours: 7.5,
    };

    beforeEach(() => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return false;
        if (selector === selectCanRedo) return true;
        if (selector === selectCurrentChange) return null;
        if (selector === selectNextRedoChange) return mockNextRedoChange;
        return null;
      });
    });

    it('should perform redo when canRedo is true and nextRedoChange exists', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.handleRedo();
      });

      expect(mockDispatch).toHaveBeenCalledTimes(3);
      expect(updateCell).toHaveBeenCalledWith({
        rowId: 'row-2',
        dayIdx: 3,
        value: { hours: 7.5 },
      });
      expect(selectCell).toHaveBeenCalledWith({
        rowId: 'row-2',
        dayIdx: 3,
      });
      expect(redo).toHaveBeenCalled();
    });

    it('should restore new hours when redoing', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.handleRedo();
      });

      expect(updateCell).toHaveBeenCalledWith({
        rowId: 'row-2',
        dayIdx: 3,
        value: { hours: 7.5 }, // newHours
      });
    });

    it('should select the cell that was redone', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.handleRedo();
      });

      expect(selectCell).toHaveBeenCalledWith({
        rowId: 'row-2',
        dayIdx: 3,
      });
    });
  });

  describe('resetHistory', () => {
    beforeEach(() => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return false;
        if (selector === selectCanRedo) return false;
        if (selector === selectCurrentChange) return null;
        if (selector === selectNextRedoChange) return null;
        return null;
      });
    });

    it('should clear history when resetHistory is called', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.resetHistory();
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(clearHistory).toHaveBeenCalled();
    });
  });

  describe('recordHoursChange', () => {
    beforeEach(() => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return false;
        if (selector === selectCanRedo) return false;
        if (selector === selectCurrentChange) return null;
        if (selector === selectNextRedoChange) return null;
        return null;
      });
    });

    it('should record change when hours are different', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.recordHoursChange('row-1', 2, 8.0, 6.5);
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(recordChange).toHaveBeenCalledWith({
        rowId: 'row-1',
        dayIdx: 2,
        originalHours: 8.0,
        newHours: 6.5,
      });
    });

    it('should not record change when hours are the same', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.recordHoursChange('row-1', 2, 8.0, 8.0);
      });

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(recordChange).not.toHaveBeenCalled();
    });

    it('should handle zero hours correctly', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.recordHoursChange('row-1', 2, 0, 4.0);
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(recordChange).toHaveBeenCalledWith({
        rowId: 'row-1',
        dayIdx: 2,
        originalHours: 0,
        newHours: 4.0,
      });
    });

    it('should handle decimal hours correctly', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.recordHoursChange('row-1', 2, 7.5, 8.25);
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(recordChange).toHaveBeenCalledWith({
        rowId: 'row-1',
        dayIdx: 2,
        originalHours: 7.5,
        newHours: 8.25,
      });
    });
  });

  describe('hook dependencies and memoization', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useUndoRedo());

      const firstRender = {
        handleUndo: result.current.handleUndo,
        handleRedo: result.current.handleRedo,
        resetHistory: result.current.resetHistory,
        recordHoursChange: result.current.recordHoursChange,
      };

      rerender();

      expect(result.current.handleUndo).toBe(firstRender.handleUndo);
      expect(result.current.handleRedo).toBe(firstRender.handleRedo);
      expect(result.current.resetHistory).toBe(firstRender.resetHistory);
      expect(result.current.recordHoursChange).toBe(
        firstRender.recordHoursChange,
      );
    });

    it('should update function references when dependencies change', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return false;
        if (selector === selectCanRedo) return false;
        if (selector === selectCurrentChange) return null;
        if (selector === selectNextRedoChange) return null;
        return null;
      });

      const { result, rerender } = renderHook(() => useUndoRedo());

      const firstRender = {
        handleUndo: result.current.handleUndo,
        handleRedo: result.current.handleRedo,
      };

      // Change the selector values
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return true;
        if (selector === selectCanRedo) return true;
        if (selector === selectCurrentChange)
          return { rowId: 'row-1', dayIdx: 0, originalHours: 8, newHours: 6 };
        if (selector === selectNextRedoChange)
          return { rowId: 'row-1', dayIdx: 0, originalHours: 8, newHours: 6 };
        return null;
      });

      rerender();

      // Functions should be different due to dependency changes
      expect(result.current.handleUndo).not.toBe(firstRender.handleUndo);
      expect(result.current.handleRedo).not.toBe(firstRender.handleRedo);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined values gracefully', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return undefined;
        if (selector === selectCanRedo) return undefined;
        if (selector === selectCurrentChange) return undefined;
        if (selector === selectNextRedoChange) return undefined;
        return undefined;
      });

      const { result } = renderHook(() => useUndoRedo());

      expect(result.current.canUndo).toBeUndefined();
      expect(result.current.canRedo).toBeUndefined();

      act(() => {
        result.current.handleUndo();
        result.current.handleRedo();
      });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should handle empty string rowId', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return false;
        if (selector === selectCanRedo) return false;
        if (selector === selectCurrentChange) return null;
        if (selector === selectNextRedoChange) return null;
        return null;
      });

      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.recordHoursChange('', 0, 8.0, 6.0);
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(recordChange).toHaveBeenCalledWith({
        rowId: '',
        dayIdx: 0,
        originalHours: 8.0,
        newHours: 6.0,
      });
    });

    it('should handle negative dayIdx', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        if (selector === selectCanUndo) return false;
        if (selector === selectCanRedo) return false;
        if (selector === selectCurrentChange) return null;
        if (selector === selectNextRedoChange) return null;
        return null;
      });

      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.recordHoursChange('row-1', -1, 8.0, 6.0);
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(recordChange).toHaveBeenCalledWith({
        rowId: 'row-1',
        dayIdx: -1,
        originalHours: 8.0,
        newHours: 6.0,
      });
    });
  });
});
