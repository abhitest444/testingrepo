import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useUnsavedChangesDetection } from 'src/js/widgets/weeklyTimeEntry/hooks/useUnsavedChangesDetection';
import timeEntryGridSlice from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import timeEntrySettingsSlice from 'src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import contextMenuSlice from 'src/js/widgets/weeklyTimeEntry/store/contextMenuSlice';
import validationSlice from 'src/js/widgets/weeklyTimeEntry/store/validationSlice';
import customFieldsSlice from 'src/js/widgets/weeklyTimeEntry/store/customFieldsSlice';

// Mock the selectors
jest.mock('src/js/widgets/weeklyTimeEntry/store/selectors', () => ({
  selectWeeklyTimeEntriesMap: (state: any) =>
    state.timeEntryGrid.weeklyTimeEntries,
}));

describe('useUnsavedChangesDetection', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        timeEntryGrid: timeEntryGridSlice,
        timeEntrySettings: timeEntrySettingsSlice,
        contextMenu: contextMenuSlice,
        validation: validationSlice,
        customFields: customFieldsSlice,
      },
    });
  });

  const renderHookWithProvider = () =>
    renderHook(() => useUnsavedChangesDetection(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

  const createStoreWithTimeEntries = (weeklyTimeEntries: any) => {
    store = configureStore({
      reducer: {
        timeEntryGrid: timeEntryGridSlice,
        timeEntrySettings: timeEntrySettingsSlice,
        contextMenu: contextMenuSlice,
        validation: validationSlice,
        customFields: customFieldsSlice,
      },
      preloadedState: {
        timeEntryGrid: {
          weeklyTimeEntries,
        } as any,
      },
    });
  };

  describe('Empty/null state tests', () => {
    it('should return false when weeklyTimeEntriesMap is null', () => {
      createStoreWithTimeEntries(null);
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return false when weeklyTimeEntriesMap is undefined', () => {
      createStoreWithTimeEntries(undefined);
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return false when no time entries exist', () => {
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return false when weeklyTimeEntriesMap is empty object', () => {
      createStoreWithTimeEntries({});
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  describe('Row-level edge cases', () => {
    it('should return false when row is null', () => {
      createStoreWithTimeEntries({
        'row-1': null,
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return false when row is undefined', () => {
      createStoreWithTimeEntries({
        'row-1': undefined,
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return false when row exists but timeEntries is null', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: null,
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return false when row exists but timeEntries is undefined', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: undefined,
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return false when row exists but timeEntries is empty object', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {},
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  describe('Operation-based detection', () => {
    it('should return true when a cell has CREATE operation', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: {
              hours: 8,
              operation: 'CREATE',
            },
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should return true when a cell has UPDATE operation', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: {
              hours: 8,
              operation: 'UPDATE',
            },
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should return true when a cell has DELETE operation', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: {
              hours: 0,
              operation: 'DELETE',
            },
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should return false when no cells have operations', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: {
              hours: 8,
              operation: null,
            },
            1: {
              hours: 4,
              operation: undefined,
            },
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return true when multiple cells have operations', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: {
              hours: 8,
              operation: 'CREATE',
            },
            1: {
              hours: 4,
              operation: 'UPDATE',
            },
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should return true when one cell has operation among many without operations', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: {
              hours: 8,
              operation: null,
            },
            1: {
              hours: 4,
              operation: 'CREATE',
            },
            2: {
              hours: 6,
              operation: null,
            },
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(true);
    });
  });

  describe('Multiple rows scenarios', () => {
    it('should return true when one row has cells with operations', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: {
              hours: 8,
              operation: null,
            },
          },
        },
        'row-2': {
          rowId: 'row-2',
          timeEntries: {
            0: {
              hours: 4,
              operation: 'CREATE',
            },
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should return false when no rows have cells with operations', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: {
              hours: 8,
              operation: null,
            },
          },
        },
        'row-2': {
          rowId: 'row-2',
          timeEntries: {
            0: {
              hours: 4,
              operation: null,
            },
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return true when multiple rows have cells with operations', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: {
              hours: 8,
              operation: 'CREATE',
            },
          },
        },
        'row-2': {
          rowId: 'row-2',
          timeEntries: {
            0: {
              hours: 4,
              operation: 'UPDATE',
            },
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(true);
    });
  });

  describe('Edge cases with mixed data', () => {
    it('should return true when some cells are null but one has operation', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: null,
            1: {
              hours: 4,
              operation: 'CREATE',
            },
            2: undefined,
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should return false when all cells are null or undefined', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: null,
            1: undefined,
            2: null,
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return false when cells exist but have no operations', () => {
      createStoreWithTimeEntries({
        'row-1': {
          rowId: 'row-1',
          timeEntries: {
            0: {
              hours: 8,
              operation: null,
            },
            1: {
              hours: 4,
              operation: undefined,
            },
            2: {
              hours: 6,
              // no operation field
            },
          },
        },
      });
      const { result } = renderHookWithProvider();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });
});
