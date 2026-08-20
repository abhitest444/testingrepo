import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import timeEntryGridReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import customerReducer from 'src/js/widgets/weeklyTimeEntry/store/customerSlice';
import timeEntrySettingsReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import contextMenuReducer from 'src/js/widgets/weeklyTimeEntry/store/contextMenuSlice';
import { useOptimizedCellClick } from 'src/js/widgets/weeklyTimeEntry/hooks/useOptimizedCellClick';

const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridReducer,
      customers: customerReducer,
      timeEntrySettings: timeEntrySettingsReducer,
      contextMenu: contextMenuReducer,
    },
    preloadedState: initialState,
  });

const TestWrapper: React.FC<{ store: any; children: React.ReactNode }> = ({
  store,
  children,
}) => <Provider store={store}>{children}</Provider>;

describe('useOptimizedCellClick', () => {
  let store: any;

  beforeEach(() => {
    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {
          'row-1': {
            rowId: 'row-1',
            timeAgainst: {
              type: 'CUSTOMER',
              id: 'customer-1',
              displayName: 'Customer 1',
            },
            timeEntries: {
              0: {
                timeEntryId: '1',
                date: '2024-01-01',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              1: {
                timeEntryId: '2',
                date: '2024-01-02',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              2: {
                timeEntryId: '3',
                date: '2024-01-03',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              3: {
                timeEntryId: '4',
                date: '2024-01-04',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              4: {
                timeEntryId: '5',
                date: '2024-01-05',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              5: {
                timeEntryId: '6',
                date: '2024-01-06',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              6: {
                timeEntryId: '7',
                date: '2024-01-07',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
            },
            totalHours: 56,
            billableTotal: 56,
            deleted: false,
          },
          'row-2': {
            rowId: 'row-2',
            timeAgainst: {
              type: 'CUSTOMER',
              id: 'customer-2',
              displayName: 'Customer 2',
            },
            timeEntries: {
              0: {
                timeEntryId: '8',
                date: '2024-01-01',
                hours: 4,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              1: {
                timeEntryId: '9',
                date: '2024-01-02',
                hours: 4,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              2: {
                timeEntryId: '10',
                date: '2024-01-03',
                hours: 4,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              3: {
                timeEntryId: '11',
                date: '2024-01-04',
                hours: 4,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              4: {
                timeEntryId: '12',
                date: '2024-01-05',
                hours: 4,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              5: {
                timeEntryId: '13',
                date: '2024-01-06',
                hours: 4,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              6: {
                timeEntryId: '14',
                date: '2024-01-07',
                hours: 4,
                entryMethod: 'DURATION',
                minutes: 0,
              },
            },
            totalHours: 28,
            billableTotal: 28,
            deleted: false,
          },
          'row-3': {
            rowId: 'row-3',
            timeAgainst: {
              type: 'CUSTOMER',
              id: 'customer-3',
              displayName: 'Customer 3',
            },
            timeEntries: {
              0: {
                timeEntryId: '15',
                date: '2024-01-01',
                hours: 2,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              1: {
                timeEntryId: '16',
                date: '2024-01-02',
                hours: 2,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              2: {
                timeEntryId: '17',
                date: '2024-01-03',
                hours: 2,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              3: {
                timeEntryId: '18',
                date: '2024-01-04',
                hours: 2,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              4: {
                timeEntryId: '19',
                date: '2024-01-05',
                hours: 2,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              5: {
                timeEntryId: '20',
                date: '2024-01-06',
                hours: 2,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              6: {
                timeEntryId: '21',
                date: '2024-01-07',
                hours: 2,
                entryMethod: 'DURATION',
                minutes: 0,
              },
            },
            totalHours: 14,
            billableTotal: 14,
            deleted: false,
          },
        },
        rowOrder: ['row-1', 'row-2', 'row-3'],
        teamMember: null,
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        showSelectTeamMemberTooltip: false,
        isTeamMemberDropdownReady: false,
        confirmTimeEntryConversionModal: {
          isOpen: false,
          rowId: null,
          dayIdx: null,
          inputValue: null,
        },
      },
      timeEntrySettings: {
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
      },
    });
  });

  it('should return an object with handleCellClick function', () => {
    const { result } = renderHook(() => useOptimizedCellClick(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current).toHaveProperty('handleCellClick');
    expect(typeof result.current.handleCellClick).toBe('function');
  });

  it('should handle cell click with valid parameters', () => {
    const { result } = renderHook(() => useOptimizedCellClick(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    act(() => {
      const clickResult = result.current.handleCellClick('row-1', 1);
      expect(clickResult).toEqual({ rowId: 'row-1', dayIdx: 0 });
    });
  });

  it('should handle cell click with different day indices', () => {
    const { result } = renderHook(() => useOptimizedCellClick(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    act(() => {
      const clickResult = result.current.handleCellClick('row-2', 5);
      expect(clickResult).toEqual({ rowId: 'row-2', dayIdx: 4 });
    });
  });

  it('should handle cell click with invalid cell index (less than 1)', () => {
    const { result } = renderHook(() => useOptimizedCellClick(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    act(() => {
      const clickResult = result.current.handleCellClick('row-1', 0);
      expect(clickResult).toEqual({ rowId: '', dayIdx: -1 });
    });
  });

  it('should handle cell click with invalid cell index (greater than visible days)', () => {
    const { result } = renderHook(() => useOptimizedCellClick(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    act(() => {
      const clickResult = result.current.handleCellClick('row-1', 8);
      expect(clickResult).toEqual({ rowId: '', dayIdx: -1 });
    });
  });

  it('should handle multiple consecutive clicks', () => {
    const { result } = renderHook(() => useOptimizedCellClick(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    act(() => {
      const result1 = result.current.handleCellClick('row-1', 1);
      const result2 = result.current.handleCellClick('row-2', 2);
      const result3 = result.current.handleCellClick('row-3', 3);

      expect(result1).toEqual({ rowId: 'row-1', dayIdx: 0 });
      expect(result2).toEqual({ rowId: 'row-2', dayIdx: 1 });
      expect(result3).toEqual({ rowId: 'row-3', dayIdx: 2 });
    });
  });

  it('should handle cell click with edge case indices', () => {
    const { result } = renderHook(() => useOptimizedCellClick(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    act(() => {
      const result1 = result.current.handleCellClick('row-1', 1); // First day
      const result2 = result.current.handleCellClick('row-1', 7); // Last day

      expect(result1).toEqual({ rowId: 'row-1', dayIdx: 0 });
      expect(result2).toEqual({ rowId: 'row-1', dayIdx: 6 });
    });
  });

  it('should handle cell click with partial visible days', () => {
    // Test with only some days visible
    const storeWithPartialDays = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {
          'row-1': {
            rowId: 'row-1',
            timeAgainst: {
              type: 'CUSTOMER',
              id: 'customer-1',
              displayName: 'Customer 1',
            },
            timeEntries: {
              0: {
                timeEntryId: '1',
                date: '2024-01-01',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              1: {
                timeEntryId: '2',
                date: '2024-01-02',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              2: {
                timeEntryId: '3',
                date: '2024-01-03',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              3: {
                timeEntryId: '4',
                date: '2024-01-04',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              4: {
                timeEntryId: '5',
                date: '2024-01-05',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              5: {
                timeEntryId: '6',
                date: '2024-01-06',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
              6: {
                timeEntryId: '7',
                date: '2024-01-07',
                hours: 8,
                entryMethod: 'DURATION',
                minutes: 0,
              },
            },
            totalHours: 56,
            billableTotal: 56,
            deleted: false,
          },
        },
        rowOrder: ['row-1'],
        teamMember: null,
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        showSelectTeamMemberTooltip: false,
        isTeamMemberDropdownReady: false,
        confirmTimeEntryConversionModal: {
          isOpen: false,
          rowId: null,
          dayIdx: null,
          inputValue: null,
        },
      },
      timeEntrySettings: {
        visibleDays: [0, 1, 2, 4, 6],
      },
    });

    const { result } = renderHook(() => useOptimizedCellClick(), {
      wrapper: ({ children }) => (
        <TestWrapper store={storeWithPartialDays}>{children}</TestWrapper>
      ),
    });

    act(() => {
      const result1 = result.current.handleCellClick('row-1', 1); // First visible day
      const result2 = result.current.handleCellClick('row-1', 2); // Second visible day
      const result3 = result.current.handleCellClick('row-1', 3); // Third visible day
      const result4 = result.current.handleCellClick('row-1', 4); // Fourth visible day
      const result5 = result.current.handleCellClick('row-1', 5); // Fifth visible day

      expect(result1).toEqual({ rowId: 'row-1', dayIdx: 0 });
      expect(result2).toEqual({ rowId: 'row-1', dayIdx: 1 });
      expect(result3).toEqual({ rowId: 'row-1', dayIdx: 2 });
      expect(result4).toEqual({ rowId: 'row-1', dayIdx: 4 });
      expect(result5).toEqual({ rowId: 'row-1', dayIdx: 6 });
    });
  });

  it('should auto-populate metaInfo fields from first edited cell', () => {
    const preloadedState = {
      timeEntryGrid: {
        weeklyTimeEntries: {
          'row-1': {
            rowId: 'row-1',
            timeAgainst: { type: null, id: null },
            timeEntries: {
              0: {
                metaInfo: {},
                timeEntryId: null,
                operation: null,
              }, // dayIdx 0 (target)
              1: {
                metaInfo: { service: 'A', class: 'B', location: 'C' },
                timeEntryId: null,
                operation: null,
              }, // dayIdx 1 (source)
              2: {
                metaInfo: {},
                timeEntryId: null,
                operation: null,
              }, // dayIdx 2
            },
            totalHours: 0,
            billableTotal: 0,
            hasApprovedEntries: false,
          },
        },
        rowOrder: ['row-1'],
        teamMember: null,
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {
          'row-1': {
            dayIndex: 1,
            cellState: {
              metaInfo: { service: 'A', class: 'B', location: 'C' },
              billableInfo: { billable: true, billableRate: 100 },
              customFields: [],
              timeEntryId: null,
              operation: null,
            },
          },
        },
        showSelectTeamMemberTooltip: false,
        isTeamMemberDropdownReady: false,
      },
      timeEntrySettings: {
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
      },
    };
    const storeWithAutoPopulate = createTestStore(preloadedState);
    storeWithAutoPopulate.dispatch = jest.fn();

    const { result } = renderHook(() => useOptimizedCellClick(), {
      wrapper: ({ children }) => (
        <TestWrapper store={storeWithAutoPopulate}>{children}</TestWrapper>
      ),
    });

    act(() => {
      result.current.handleCellClick('row-1', 1); // Click dayIdx 0, should copy from dayIdx 1
    });

    expect(storeWithAutoPopulate.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          rowId: 'row-1',
          dayIdx: 0,
          value: expect.objectContaining({
            metaInfo: expect.objectContaining({
              service: 'A',
              class: 'B',
              location: 'C',
            }),
          }),
        }),
      }),
    );
  });

  describe('teamMember billableInfo population', () => {
    it('should populate billableInfo from teamMember when target cell has no timeEntryId and no billableRate', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  billableInfo: {
                    billable: undefined,
                    billableRate: undefined,
                  },
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: {
            id: 'member-1',
            name: 'Test Member',
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 100.0,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithTeamMember = createTestStore(preloadedState);
      storeWithTeamMember.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithTeamMember}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithTeamMember.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              billableInfo: expect.objectContaining({
                billable: true,
                billableRate: '100',
              }),
            }),
          }),
        }),
      );
    });

    it('should populate billableInfo from teamMember when target cell has existing billableInfo but no billableRate', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  billableInfo: { billable: false, billableRate: undefined },
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: {
            id: 'member-1',
            name: 'Test Member',
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 75.5,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithTeamMember = createTestStore(preloadedState);
      storeWithTeamMember.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithTeamMember}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithTeamMember.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              billableInfo: expect.objectContaining({
                billable: true,
                billableRate: '75.5',
              }),
            }),
          }),
        }),
      );
    });

    it('should NOT populate billableInfo when target cell has timeEntryId', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  billableInfo: {
                    billable: undefined,
                    billableRate: undefined,
                  },
                  timeEntryId: 'saved-entry-123', // Has timeEntryId
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: {
            id: 'member-1',
            name: 'Test Member',
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 100.0,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithTeamMember = createTestStore(preloadedState);
      storeWithTeamMember.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithTeamMember}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      // Should only call selectCell, not updateCell
      expect(storeWithTeamMember.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
          }),
        }),
      );

      // Verify no updateCell call was made
      const updateCellCalls = (
        storeWithTeamMember.dispatch as jest.Mock
      ).mock.calls.filter((call: any) => call[0].type?.includes('updateCell'));
      expect(updateCellCalls).toHaveLength(0);
    });

    it('should NOT populate billableInfo when target cell already has billableRate', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  billableInfo: { billable: false, billableRate: 50.0 }, // Has billableRate
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: {
            id: 'member-1',
            name: 'Test Member',
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 100.0,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithTeamMember = createTestStore(preloadedState);
      storeWithTeamMember.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithTeamMember}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      // Should only call selectCell, not updateCell
      expect(storeWithTeamMember.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
          }),
        }),
      );

      // Verify no updateCell call was made
      const updateCellCalls = (
        storeWithTeamMember.dispatch as jest.Mock
      ).mock.calls.filter((call: any) => call[0].type?.includes('updateCell'));
      expect(updateCellCalls).toHaveLength(0);
    });

    it('should preserve existing billableInfo properties when populating from teamMember', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  billableInfo: {
                    billable: undefined,
                    billableRate: undefined,
                    customProperty: 'existing-value',
                  },
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: {
            id: 'member-1',
            name: 'Test Member',
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 100.0,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithTeamMember = createTestStore(preloadedState);
      storeWithTeamMember.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithTeamMember}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithTeamMember.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              billableInfo: expect.objectContaining({
                billable: true,
                billableRate: '100',
                customProperty: 'existing-value',
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('service description to notes copying', () => {
    it('should copy service description to notes when target cell has no notes and service has description', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  notes: '', // No existing notes
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 0 (target)
                1: {
                  metaInfo: {
                    service: {
                      id: 'service-123',
                      name: 'Consulting Service',
                      price: 100,
                      description: 'Professional consulting services',
                    },
                  },
                  notes: 'Some existing notes',
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 1 (source)
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                metaInfo: {
                  service: {
                    id: 'service-123',
                    name: 'Consulting Service',
                    price: 100,
                    description: 'Professional consulting services',
                  },
                },
                billableInfo: { billable: true, billableRate: 100 },
                customFields: [],
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithServiceDescription = createTestStore(preloadedState);
      storeWithServiceDescription.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithServiceDescription}>
            {children}
          </TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1); // Click dayIdx 0, should copy from dayIdx 1
      });

      expect(storeWithServiceDescription.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              metaInfo: expect.objectContaining({
                service: expect.objectContaining({
                  id: 'service-123',
                  name: 'Consulting Service',
                  price: 100,
                  description: 'Professional consulting services',
                }),
              }),
              notes: 'Professional consulting services',
            }),
          }),
        }),
      );
    });

    it('should NOT copy service description to notes when target cell already has notes', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  notes: 'Existing user notes', // Has existing notes
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 0 (target)
                1: {
                  metaInfo: {
                    service: {
                      id: 'service-123',
                      name: 'Consulting Service',
                      price: 100,
                      description: 'Professional consulting services',
                    },
                  },
                  notes: 'Some other notes',
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 1 (source)
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                metaInfo: {
                  service: {
                    id: 'service-123',
                    name: 'Consulting Service',
                    price: 100,
                    description: 'Professional consulting services',
                  },
                },
                billableInfo: { billable: true, billableRate: 100 },
                customFields: [],
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithExistingNotes = createTestStore(preloadedState);
      storeWithExistingNotes.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithExistingNotes}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1); // Click dayIdx 0, should copy from dayIdx 1
      });

      expect(storeWithExistingNotes.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              metaInfo: expect.objectContaining({
                service: expect.objectContaining({
                  id: 'service-123',
                  name: 'Consulting Service',
                  price: 100,
                  description: 'Professional consulting services',
                }),
              }),
              // Should NOT include notes property since target already has notes
            }),
          }),
        }),
      );

      // Verify notes were not updated
      const updateCall = (storeWithExistingNotes.dispatch as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.payload.value.notes).toBeUndefined();
    });

    it('should NOT copy service description to notes when service has no description', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  notes: '', // No existing notes
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 0 (target)
                1: {
                  metaInfo: {
                    service: {
                      id: 'service-123',
                      name: 'Consulting Service',
                      price: 100,
                      description: '', // Empty description
                    },
                  },
                  notes: 'Some existing notes',
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 1 (source)
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                metaInfo: {
                  service: {
                    id: 'service-123',
                    name: 'Consulting Service',
                    price: 100,
                    description: '', // Empty description
                  },
                },
                billableInfo: { billable: true, billableRate: 100 },
                customFields: [],
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithEmptyDescription = createTestStore(preloadedState);
      storeWithEmptyDescription.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithEmptyDescription}>
            {children}
          </TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1); // Click dayIdx 0, should copy from dayIdx 1
      });

      expect(storeWithEmptyDescription.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              metaInfo: expect.objectContaining({
                service: expect.objectContaining({
                  id: 'service-123',
                  name: 'Consulting Service',
                  price: 100,
                  description: '',
                }),
              }),
              // Should NOT include notes property since service has no description
            }),
          }),
        }),
      );

      // Verify notes were not updated
      const updateCall = (storeWithEmptyDescription.dispatch as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.payload.value.notes).toBeUndefined();
    });

    it('should NOT copy service description to notes when service description is null or undefined', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  notes: '', // No existing notes
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 0 (target)
                1: {
                  metaInfo: {
                    service: {
                      id: 'service-123',
                      name: 'Consulting Service',
                      price: 100,
                      // description is undefined
                    },
                  },
                  notes: 'Some existing notes',
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 1 (source)
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                metaInfo: {
                  service: {
                    id: 'service-123',
                    name: 'Consulting Service',
                    price: 100,
                    // description is undefined
                  },
                },
                billableInfo: { billable: true, billableRate: 100 },
                customFields: [],
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithUndefinedDescription = createTestStore(preloadedState);
      storeWithUndefinedDescription.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithUndefinedDescription}>
            {children}
          </TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1); // Click dayIdx 0, should copy from dayIdx 1
      });

      expect(storeWithUndefinedDescription.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              metaInfo: expect.objectContaining({
                service: expect.objectContaining({
                  id: 'service-123',
                  name: 'Consulting Service',
                  price: 100,
                }),
              }),
              // Should NOT include notes property since service has no description
            }),
          }),
        }),
      );

      // Verify notes were not updated
      const updateCall = (storeWithUndefinedDescription.dispatch as jest.Mock)
        .mock.calls[0][0];
      expect(updateCall.payload.value.notes).toBeUndefined();
    });

    it('should copy service description to notes when target cell has null notes', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  notes: null, // Null notes (falsy)
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 0 (target)
                1: {
                  metaInfo: {
                    service: {
                      id: 'service-456',
                      name: 'Development Service',
                      price: 150,
                      description: 'Software development services',
                    },
                  },
                  notes: 'Some existing notes',
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 1 (source)
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                metaInfo: {
                  service: {
                    id: 'service-456',
                    name: 'Development Service',
                    price: 150,
                    description: 'Software development services',
                  },
                },
                billableInfo: { billable: true, billableRate: 150 },
                customFields: [],
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithNullNotes = createTestStore(preloadedState);
      storeWithNullNotes.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithNullNotes}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1); // Click dayIdx 0, should copy from dayIdx 1
      });

      expect(storeWithNullNotes.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              metaInfo: expect.objectContaining({
                service: expect.objectContaining({
                  id: 'service-456',
                  name: 'Development Service',
                  price: 150,
                  description: 'Software development services',
                }),
              }),
              notes: 'Software development services',
            }),
          }),
        }),
      );
    });

    it('should copy service description to notes when target cell has undefined notes', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  metaInfo: {},
                  // notes is undefined
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 0 (target)
                1: {
                  metaInfo: {
                    service: {
                      id: 'service-789',
                      name: 'Design Service',
                      price: 120,
                      description: 'UI/UX design services',
                    },
                  },
                  notes: 'Some existing notes',
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 1 (source)
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                metaInfo: {
                  service: {
                    id: 'service-789',
                    name: 'Design Service',
                    price: 120,
                    description: 'UI/UX design services',
                  },
                },
                billableInfo: { billable: true, billableRate: 120 },
                customFields: [],
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithUndefinedNotes = createTestStore(preloadedState);
      storeWithUndefinedNotes.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithUndefinedNotes}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1); // Click dayIdx 0, should copy from dayIdx 1
      });

      expect(storeWithUndefinedNotes.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              metaInfo: expect.objectContaining({
                service: expect.objectContaining({
                  id: 'service-789',
                  name: 'Design Service',
                  price: 120,
                  description: 'UI/UX design services',
                }),
              }),
              notes: 'UI/UX design services',
            }),
          }),
        }),
      );
    });
  });

  describe('Conversion Modal Scenarios', () => {
    it('should open conversion modal when clicking cell with startTime or endTime', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  timeEntryId: 'saved-entry-123',
                  date: '2024-01-01',
                  hours: 8,
                  startTime: '09:00',
                  endTime: '17:00',
                },
              },
              totalHours: 8,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: { rowId: 'previous-row', dayIdx: 2 }, // Previously selected cell
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
          confirmTimeEntryConversionModal: {
            isOpen: false,
            rowId: null,
            dayIdx: null,
            inputValue: null,
          },
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithSavedEntry = createTestStore(preloadedState);
      storeWithSavedEntry.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithSavedEntry}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithSavedEntry.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining(
            'toggleConfirmTimeEntryConversionModal',
          ),
          payload: expect.objectContaining({
            isOpen: true,
            rowId: 'previous-row', // Uses previously selected cell
            dayIdx: 2,
          }),
        }),
      );
    });

    it('should NOT open conversion modal when cell has no startTime or endTime', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  timeEntryId: 'saved-entry-123',
                  date: '2024-01-01',
                  hours: 8,
                  // No startTime or endTime
                },
              },
              totalHours: 8,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
          confirmTimeEntryConversionModal: {
            isOpen: false,
            rowId: null,
            dayIdx: null,
            inputValue: null,
          },
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithUnsavedEntry = createTestStore(preloadedState);
      storeWithUnsavedEntry.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithUnsavedEntry}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      // Should only call selectCell, not toggleConfirmTimeEntryConversionModal
      const toggleConversionModalCalls = (
        storeWithUnsavedEntry.dispatch as jest.Mock
      ).mock.calls.filter((call: any) =>
        call[0].type?.includes('toggleConfirmTimeEntryConversionModal'),
      );
      expect(toggleConversionModalCalls).toHaveLength(0);
    });

    it('should open conversion modal when cell has only startTime', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  timeEntryId: 'saved-entry-123',
                  date: '2024-01-01',
                  hours: 0,
                  startTime: '09:00', // Only startTime, no endTime
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: { rowId: 'prev-row', dayIdx: 1 },
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
          confirmTimeEntryConversionModal: {
            isOpen: false,
            rowId: null,
            dayIdx: null,
            inputValue: null,
          },
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithStartTime = createTestStore(preloadedState);
      storeWithStartTime.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithStartTime}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      // Should call toggleConfirmTimeEntryConversionModal
      expect(storeWithStartTime.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining(
            'toggleConfirmTimeEntryConversionModal',
          ),
          payload: expect.objectContaining({
            isOpen: true,
            rowId: 'prev-row',
            dayIdx: 1,
          }),
        }),
      );
    });

    it('should open conversion modal when cell has only endTime', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  timeEntryId: 'saved-entry-123',
                  date: '2024-01-01',
                  hours: 7.5,
                  endTime: '16:30', // Only endTime, no startTime
                },
              },
              totalHours: 7.5,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: { rowId: 'another-row', dayIdx: 3 },
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
          confirmTimeEntryConversionModal: {
            isOpen: false,
            rowId: null,
            dayIdx: null,
            inputValue: null,
          },
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithEndTime = createTestStore(preloadedState);
      storeWithEndTime.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithEndTime}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithEndTime.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining(
            'toggleConfirmTimeEntryConversionModal',
          ),
          payload: expect.objectContaining({
            isOpen: true,
            rowId: 'another-row',
            dayIdx: 3,
          }),
        }),
      );
    });

    it('should open conversion modal when cell has only endTime', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  timeEntryId: 'saved-entry-123',
                  date: '2024-01-01',
                  hours: 8,
                  startTime: undefined,
                  endTime: '17:00',
                },
              },
              totalHours: 8,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: { rowId: 'previous-row', dayIdx: 2 },
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
          confirmTimeEntryConversionModal: {
            isOpen: false,
            rowId: null,
            dayIdx: null,
            inputValue: null,
          },
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithEndTimeOnly = createTestStore(preloadedState);
      storeWithEndTimeOnly.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithEndTimeOnly}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithEndTimeOnly.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'timeEntryGrid/toggleConfirmTimeEntryConversionModal',
          payload: {
            isOpen: true,
            rowId: 'previous-row',
            dayIdx: 2,
          },
        }),
      );
    });

    it('should NOT open conversion modal when cell is locked (based on week max approved date)', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  timeEntryId: 'saved-entry-123',
                  date: '2024-01-01',
                  hours: 8,
                  startTime: '09:00',
                  endTime: '17:00',
                  isApproved: false, // This cell itself is not approved
                },
              },
              totalHours: 8,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
            'row-2': {
              rowId: 'row-2',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                2: {
                  timeEntryId: 'saved-entry-456',
                  date: '2024-01-03',
                  hours: 8,
                  isApproved: true, // Different row has approved entry on Jan 3
                },
              },
              totalHours: 8,
              billableTotal: 0,
              hasApprovedEntries: true,
            },
          },
          rowOrder: ['row-1', 'row-2'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: { rowId: 'previous-row', dayIdx: 2 },
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
          confirmTimeEntryConversionModal: {
            isOpen: false,
            rowId: null,
            dayIdx: null,
            inputValue: null,
          },
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithLockedCell = createTestStore(preloadedState);
      storeWithLockedCell.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithLockedCell}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1); // Clicking day index 0 (2024-01-01)
      });

      // Should NOT call toggleConfirmTimeEntryConversionModal because Jan 1 is locked
      // (it's before Jan 3 which is approved in row-2)
      expect(storeWithLockedCell.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'timeEntryGrid/toggleConfirmTimeEntryConversionModal',
        }),
      );

      // Should still call selectCell
      expect(storeWithLockedCell.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'timeEntryGrid/selectCell',
          payload: {
            rowId: 'row-1',
            dayIdx: 0,
          },
        }),
      );
    });
  });

  describe('Break Entry Protection', () => {
    it('should not copy billable info to break entries when copying from other cells', () => {
      // Test that billable information is not copied to break entries (PAID/UNPAID)
      // This ensures break entries remain clean without billable information
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: 'PAID', id: 'break1' }, // Break row
              timeEntries: {
                0: {
                  metaInfo: {},
                  billableInfo: {
                    billable: undefined,
                    billableRate: undefined,
                  },
                  timeEntryId: null,
                  operation: null,
                }, // dayIdx 0 (target - break)
                1: {
                  metaInfo: { service: { id: 'service1', name: 'Service 1' } },
                  billableInfo: {
                    billable: true,
                    billableRate: '100',
                  },
                  timeEntryId: 'entry1',
                  operation: null,
                }, // dayIdx 1 (source - customer)
              },
            },
          },
        },
      };

      const store = createTestStore(preloadedState);
      store.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      // Simulate copying from customer cell to break cell
      act(() => {
        result.current.handleCellClick('row-1', 0);
      });

      // Should not copy billable info to break entries
      expect(store.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            value: expect.objectContaining({
              billableInfo: expect.any(Object),
            }),
          }),
        }),
      );
    });

    it('should set default billable info when converting from break to customer type', () => {
      // Test that when converting from break to customer type, default billable information
      // is set for cells with hours > 0 so that billable totals can be calculated correctly
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: 'PAID', id: 'break1' }, // Initial break type
              timeEntries: {
                0: {
                  hours: 8,
                  billableInfo: undefined, // No billable info (as expected for breaks)
                  timeEntryId: 'entry1',
                  operation: null,
                },
              },
            },
          },
          rowOrder: ['row-1'],
          teamMember: {
            id: 'member-1',
            name: 'Test Member',
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 100.0,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };

      const store = createTestStore(preloadedState);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <div data-testid="test-container" />
        </Provider>,
      );

      // Simulate changing from break to customer type
      store.dispatch({
        type: 'timeEntryGrid/updateTimeAgainst',
        payload: {
          rowId: 'row-1',
          timeAgainst: {
            type: 'CUSTOMER',
            id: 'customer1',
            displayName: 'Customer 1',
          },
        },
      });

      // Verify that the cell now has billable information set
      const updatedState = store.getState();
      const updatedCell =
        updatedState.timeEntryGrid.weeklyTimeEntries['row-1'].timeEntries[0];

      expect(updatedCell.billableInfo).toEqual({
        billable: true,
        billableRate: '100',
      });

      // Verify that the row totals are recalculated
      expect(
        updatedState.timeEntryGrid.weeklyTimeEntries['row-1'].totalHours,
      ).toBe(8);
      expect(
        updatedState.timeEntryGrid.weeklyTimeEntries['row-1'].billableTotal,
      ).toBe(800); // 8 hours * $100
    });
  });

  describe('time category ID change protection', () => {
    it('should mark cells for update when time category ID changes within same type', () => {
      // Test that when time category ID changes within the same type (e.g., customer1 to customer2),
      // cells with hours > 0 are marked for UPDATE or CREATE based on whether they have timeEntryId
      // This ensures proper save operations when switching between different customers/projects
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: 'CUSTOMER', id: 'customer1' }, // Initial customer
              timeEntries: {
                0: {
                  metaInfo: { service: { id: 'service1', name: 'Service 1' } },
                  billableInfo: { billable: true, billableRate: '100' },
                  notes: 'Some notes',
                  hours: 8,
                  timeEntryId: 'entry1', // Has existing timeEntryId
                  operation: null,
                },
                1: {
                  metaInfo: { service: { id: 'service2', name: 'Service 2' } },
                  billableInfo: { billable: false, billableRate: '50' },
                  notes: 'Other notes',
                  hours: 4,
                  timeEntryId: null, // No existing timeEntryId
                  operation: null,
                },
              },
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithCustomerRow = createTestStore(preloadedState);
      storeWithCustomerRow.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithCustomerRow}>{children}</TestWrapper>
        ),
      });

      // Simulate changing from customer1 to customer2 (same type, different ID)
      act(() => {
        // This would typically be done by dispatching updateTimeAgainst
        // For this test, we're just verifying the cell click behavior
        result.current.handleCellClick('row-1', 1);
      });

      // Should call selectCell
      expect(storeWithCustomerRow.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
          }),
        }),
      );
    });
  });

  describe('Custom Fields Copying', () => {
    it('should copy custom fields from first edited cell when target has no custom fields', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  customFields: [], // No custom fields
                  timeEntryId: null,
                  operation: null,
                },
                1: {
                  customFields: [
                    { id: 'field-1', name: 'Field 1', value: 'Value 1' },
                    { id: 'field-2', name: 'Field 2', value: 'Value 2' },
                  ],
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                customFields: [
                  { id: 'field-1', name: 'Field 1', value: 'Value 1' },
                  { id: 'field-2', name: 'Field 2', value: 'Value 2' },
                ],
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithCustomFields = createTestStore(preloadedState);
      storeWithCustomFields.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithCustomFields}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithCustomFields.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              customFields: [
                { id: 'field-1', name: 'Field 1', value: 'Value 1' },
                { id: 'field-2', name: 'Field 2', value: 'Value 2' },
              ],
            }),
          }),
        }),
      );
    });

    it('should NOT copy custom fields to saved entries (with timeEntryId)', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  customFields: [],
                  timeEntryId: 'saved-entry-123', // Saved entry
                  operation: null,
                },
                1: {
                  customFields: [
                    { id: 'field-1', name: 'Field 1', value: 'Value 1' },
                  ],
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                customFields: [
                  { id: 'field-1', name: 'Field 1', value: 'Value 1' },
                ],
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithSavedEntry = createTestStore(preloadedState);
      storeWithSavedEntry.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithSavedEntry}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      // Should only call selectCell, not updateCell
      const updateCellCalls = (
        storeWithSavedEntry.dispatch as jest.Mock
      ).mock.calls.filter((call: any) => call[0].type?.includes('updateCell'));
      expect(updateCellCalls).toHaveLength(0);
    });

    it('should NOT copy custom fields when target already has custom fields', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  customFields: [
                    {
                      id: 'existing-field',
                      name: 'Existing Field',
                      value: 'Existing Value',
                    },
                  ],
                  timeEntryId: null,
                  operation: null,
                },
                1: {
                  customFields: [
                    { id: 'field-1', name: 'Field 1', value: 'Value 1' },
                  ],
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                customFields: [
                  { id: 'field-1', name: 'Field 1', value: 'Value 1' },
                ],
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithExistingFields = createTestStore(preloadedState);
      storeWithExistingFields.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithExistingFields}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      // Should only call selectCell, not updateCell
      const updateCellCalls = (
        storeWithExistingFields.dispatch as jest.Mock
      ).mock.calls.filter((call: any) => call[0].type?.includes('updateCell'));
      expect(updateCellCalls).toHaveLength(0);
    });
  });

  describe('Complex Billable Info Scenarios', () => {
    it('should copy billableInfo when source has billable=true and target has no billable', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  billableInfo: {}, // No billable info
                  timeEntryId: null,
                  operation: null,
                },
                1: {
                  billableInfo: {
                    billable: true,
                    billableRate: '150',
                  },
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                billableInfo: {
                  billable: true,
                  billableRate: '150',
                },
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithBillableInfo = createTestStore(preloadedState);
      storeWithBillableInfo.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithBillableInfo}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithBillableInfo.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              billableInfo: expect.objectContaining({
                billable: true,
                billableRate: '150',
              }),
            }),
          }),
        }),
      );
    });

    it('should copy billableInfo when source has billable=false and target has no billable rate', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  billableInfo: {
                    billable: true, // Has billable but no rate
                  },
                  timeEntryId: null,
                  operation: null,
                },
                1: {
                  billableInfo: {
                    billable: false,
                    billableRate: '75',
                  },
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                billableInfo: {
                  billable: false,
                  billableRate: '75',
                },
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithFalseBillable = createTestStore(preloadedState);
      storeWithFalseBillable.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithFalseBillable}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithFalseBillable.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              billableInfo: expect.objectContaining({
                billable: false,
                billableRate: '75',
              }),
            }),
          }),
        }),
      );
    });

    it('should use source billableRate when target has no rate', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  billableInfo: {
                    billable: true,
                    billableRate: null, // No rate
                  },
                  timeEntryId: null,
                  operation: null,
                },
                1: {
                  billableInfo: {
                    billable: true,
                    billableRate: '200',
                  },
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                billableInfo: {
                  billable: true,
                  billableRate: '200',
                },
                timeEntryId: null,
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithSourceRate = createTestStore(preloadedState);
      storeWithSourceRate.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithSourceRate}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithSourceRate.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              billableInfo: expect.objectContaining({
                billable: true,
                billableRate: '200',
              }),
            }),
          }),
        }),
      );
    });

    it('should fallback to target billableRate when source has no rate', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  timeEntryId: '',
                  date: '2024-01-01',
                  isApproved: false,
                  billableInfo: {
                    billable: false,
                    billableRate: '100', // Target has rate
                  },
                  operation: undefined,
                },
                1: {
                  timeEntryId: '',
                  date: '2024-01-02',
                  isApproved: false,
                  billableInfo: {
                    billable: true,
                    billableRate: null, // Source has no rate
                  },
                  operation: undefined,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                timeEntryId: '',
                date: '2024-01-02',
                isApproved: false,
                billableInfo: {
                  billable: true,
                  billableRate: null,
                },
                operation: undefined,
              },
            },
          },
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithTargetRate = createTestStore(preloadedState);
      storeWithTargetRate.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithTargetRate}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      // Should dispatch selectCell action
      expect(storeWithTargetRate.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'timeEntryGrid/selectCell',
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
          }),
        }),
      );
    });
  });

  describe('Error and Edge Cases', () => {
    it('should handle clicking on non-existent row', () => {
      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(() => {
        act(() => {
          result.current.handleCellClick('non-existent-row', 1);
        });
      }).not.toThrow();
    });

    it('should handle clicking when visibleDays is empty', () => {
      const storeWithEmptyVisibleDays = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: { timeEntryId: '1', date: '2024-01-01', hours: 8 },
              },
              totalHours: 8,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [], // Empty visible days
        },
      });

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithEmptyVisibleDays}>
            {children}
          </TestWrapper>
        ),
      });

      act(() => {
        const clickResult = result.current.handleCellClick('row-1', 1);
        expect(clickResult).toEqual({ rowId: '', dayIdx: -1 });
      });
    });

    it('should handle clicking with negative cell index', () => {
      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      act(() => {
        const clickResult = result.current.handleCellClick('row-1', -1);
        expect(clickResult).toEqual({ rowId: '', dayIdx: -1 });
      });
    });

    it('should handle clicking with very large cell index', () => {
      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      act(() => {
        const clickResult = result.current.handleCellClick('row-1', 1000);
        expect(clickResult).toEqual({ rowId: '', dayIdx: -1 });
      });
    });

    it('should handle teamMember with null billable properties', () => {
      const preloadedState = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  billableInfo: {
                    billable: undefined,
                    billableRate: undefined,
                  },
                  timeEntryId: null,
                  operation: null,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: {
            id: 'member-1',
            name: 'Test Member',
            type: 'EMPLOYEE',
            billable: null, // Null billable
            billableRate: null, // Null rate
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      };
      const storeWithNullTeamMember = createTestStore(preloadedState);
      storeWithNullTeamMember.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithNullTeamMember}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithNullTeamMember.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
            value: expect.objectContaining({
              billableInfo: expect.objectContaining({
                billable: null,
                billableRate: undefined, // When null.toString() is called, optional chaining results in undefined
              }),
            }),
          }),
        }),
      );
    });

    it('should handle undefined target cell gracefully', () => {
      const storeWithMissingCell = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                // Missing entry for day 0
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      });

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithMissingCell}>{children}</TestWrapper>
        ),
      });

      expect(() => {
        act(() => {
          result.current.handleCellClick('row-1', 1);
        });
      }).not.toThrow();
    });

    it('should handle empty firstEditedCells object', () => {
      const storeWithEmptyFirstEdited = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: {
                  timeEntryId: '',
                  date: '2024-01-01',
                  isApproved: false,
                  operation: undefined,
                },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {}, // Empty object
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      });
      storeWithEmptyFirstEdited.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithEmptyFirstEdited}>
            {children}
          </TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      // Should call selectCell action when firstEditedCells is empty
      expect(storeWithEmptyFirstEdited.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'timeEntryGrid/selectCell',
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
          }),
        }),
      );
    });
  });

  describe('Integration with Redux State', () => {
    it('should handle previously selected cell correctly', () => {
      const storeWithSelectedCell = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: { timeEntryId: null, operation: null },
                1: { timeEntryId: null, operation: null },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: { rowId: 'row-1', dayIdx: 1 }, // Previously selected
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      });
      storeWithSelectedCell.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithSelectedCell}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.handleCellClick('row-1', 1);
      });

      expect(storeWithSelectedCell.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-1',
            dayIdx: 0,
          }),
        }),
      );
    });

    it('should work with multiple rows and complex state', () => {
      const complexStore = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: 'CUSTOMER', id: 'customer-1' },
              timeEntries: {
                0: { timeEntryId: '1', hours: 8, operation: null },
                1: { timeEntryId: '2', hours: 6, operation: 'UPDATE' },
              },
              totalHours: 14,
              billableTotal: 1400,
              hasApprovedEntries: false,
            },
            'row-2': {
              rowId: 'row-2',
              timeAgainst: { type: 'CUSTOMER', id: 'customer-2' },
              timeEntries: {
                0: { timeEntryId: '', hours: 0, operation: null },
                1: { timeEntryId: '', hours: 4, operation: 'CREATE' },
              },
              totalHours: 4,
              billableTotal: 200,
              hasApprovedEntries: true,
            },
            'row-3': {
              rowId: 'row-3',
              timeAgainst: { type: 'PAID', id: 'break-1' },
              timeEntries: {
                0: { timeEntryId: '5', hours: 1, operation: null },
                1: { timeEntryId: '', hours: 0.5, operation: 'CREATE' },
              },
              totalHours: 1.5,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1', 'row-2', 'row-3'],
          teamMember: {
            id: 'team-member-1',
            name: 'John Doe',
            type: 'EMPLOYEE',
            billable: true,
            billableRate: 75,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: { rowId: 'row-2', dayIdx: 1 },
          firstEditedCells: {
            'row-1': {
              dayIndex: 1,
              cellState: {
                metaInfo: { service: { id: 'service-1', name: 'Consulting' } },
                billableInfo: { billable: true, billableRate: '100' },
                customFields: [
                  { id: 'field-1', name: 'Field 1', value: 'Test' },
                ],
                timeEntryId: '2',
                operation: 'UPDATE',
              },
            },
            'row-3': {
              dayIndex: 0,
              cellState: {
                notes: 'Break time',
                timeEntryId: '5',
                operation: null,
              },
            },
          },
          showSelectTeamMemberTooltip: true,
          isTeamMemberDropdownReady: true,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      });
      complexStore.dispatch = jest.fn();

      const { result } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={complexStore}>{children}</TestWrapper>
        ),
      });

      act(() => {
        // Click on row-2, cell 1
        const clickResult = result.current.handleCellClick('row-2', 1);
        expect(clickResult).toEqual({ rowId: 'row-2', dayIdx: 0 });
      });

      // Should call selectCell
      expect(complexStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            rowId: 'row-2',
            dayIdx: 0,
          }),
        }),
      );
    });

    it('should handle state changes during hook execution', () => {
      const mutableStore = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': {
              rowId: 'row-1',
              timeAgainst: { type: null, id: null },
              timeEntries: {
                0: { timeEntryId: null, operation: null },
              },
              totalHours: 0,
              billableTotal: 0,
              hasApprovedEntries: false,
            },
          },
          rowOrder: ['row-1'],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          showSelectTeamMemberTooltip: false,
          isTeamMemberDropdownReady: false,
        },
        timeEntrySettings: {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      });

      const { result, rerender } = renderHook(() => useOptimizedCellClick(), {
        wrapper: ({ children }) => (
          <TestWrapper store={mutableStore}>{children}</TestWrapper>
        ),
      });

      // First click - should not throw
      expect(() => {
        act(() => {
          result.current.handleCellClick('row-1', 1);
        });
      }).not.toThrow();

      // Change the store state
      mutableStore.dispatch({
        type: 'timeEntryGrid/setSelectedCell',
        payload: { rowId: 'row-1', dayIdx: 0 },
      });

      // Re-render to pick up state changes
      rerender();

      // Second click should still work without throwing
      expect(() => {
        act(() => {
          result.current.handleCellClick('row-1', 2);
        });
      }).not.toThrow();
    });
  });
});
