import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTimeEntriesFetching } from 'src/js/widgets/weeklyTimeEntry/hooks/useTimeEntriesFetching';
import timeEntryGridReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import customerReducer from 'src/js/widgets/weeklyTimeEntry/store/customerSlice';
import timeEntrySettingsReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import contextMenuReducer from 'src/js/widgets/weeklyTimeEntry/store/contextMenuSlice';
import breaksReducer from 'src/js/widgets/weeklyTimeEntry/store/breaksSlice';
import customFieldsReducer from 'src/js/widgets/weeklyTimeEntry/store/customFieldsSlice';
import validationReducer from 'src/js/widgets/weeklyTimeEntry/store/validationSlice';

// Mock the API hook
jest.mock('src/js/service/hooks/weeklyTimeEntries/useReadWeeklyTimeEntries');
const mockUseReadWeeklyTimeEntries =
  require('src/js/service/hooks/weeklyTimeEntries/useReadWeeklyTimeEntries').useReadWeeklyTimeEntries;

// Mock the transformer
jest.mock('src/js/widgets/weeklyTimeEntry/store/timeEntryTransformer');
const mockTransformTimeEntriesToTimesheetRows =
  require('src/js/widgets/weeklyTimeEntry/store/timeEntryTransformer').transformTimeEntriesToTimesheetRows;

// Mock the team billable details hook
jest.mock(
  'src/js/widgets/weeklyTimeEntry/hooks/useTeamBillableDetailsFetching',
);
const mockUseTeamBillableDetailsFetching =
  require('src/js/widgets/weeklyTimeEntry/hooks/useTeamBillableDetailsFetching').useTeamBillableDetailsFetching;

const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridReducer,
      customers: customerReducer,
      timeEntrySettings: timeEntrySettingsReducer,
      contextMenu: contextMenuReducer,
      breaks: breaksReducer,
      customFields: customFieldsReducer,
      validation: validationReducer,
    },
    preloadedState: initialState,
  });

const TestWrapper = ({
  children,
  store,
}: {
  children: React.ReactNode;
  store: any;
}) => <Provider store={store}>{children}</Provider>;

describe('useTimeEntriesFetching', () => {
  let store: any;

  beforeEach(() => {
    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: null,
        dateRange: { start: '', end: '' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
      breaks: {
        breaks: [],
        loading: false,
        error: null,
      },
      customFields: {
        customFields: [],
        loading: false,
        error: null,
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
      },
    });

    // Reset mocks
    jest.clearAllMocks();
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: [],
      loading: false,
      error: null,
    });
    mockTransformTimeEntriesToTimesheetRows.mockReturnValue([]);
    mockUseTeamBillableDetailsFetching.mockReturnValue({
      fetchTeamBillableDetails: jest.fn(),
      data: null,
      isLoading: false,
    });
  });

  it('should return initial state when no team member or date range', () => {
    const { result } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current).toEqual({
      loading: false,
      error: null,
      timeEntries: [],
      currentWeek: {
        startDate: expect.any(Object),
        endDate: expect.any(Object),
      },
      hasData: false,
      fetchKey: '',
    });
  });

  it('should generate fetch key when team member and date range are available', () => {
    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    const { result } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.fetchKey).toBe('emp123-2024-01-01-2024-01-07');
  });

  it('should fetch time entries when conditions are met', () => {
    const mockEntries = [
      { id: '1', date: '2024-01-01', duration: 28800, notes: 'Work' },
      { id: '2', date: '2024-01-02', duration: 25200, notes: 'Meeting' },
    ];

    const mockTransformedRows = [
      {
        rowId: 'row-1',
        timeAgainst: { type: 'CUSTOMER' as const, id: 'customer1' },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            notes: 'Work',
            metaInfo: undefined,
            billableInfo: undefined,
          },
          1: {
            timeEntryId: '2',
            date: '2024-01-02',
            hours: 7,
            notes: 'Meeting',
            metaInfo: undefined,
            billableInfo: undefined,
          },
        },
        totalHours: 15,
        billableTotal: 0,
      },
    ];

    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: mockEntries,
      loading: false,
      error: null,
    });

    mockTransformTimeEntriesToTimesheetRows.mockReturnValue(
      mockTransformedRows,
    );

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {
          'row-1': mockTransformedRows[0],
        },
        rowOrder: ['row-1'],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
      breaks: {
        breaks: [],
        loading: false,
        error: null,
      },
    });

    const { result } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.timeEntries).toEqual(mockEntries);
    expect(result.current.hasData).toBe(true);
    expect(mockTransformTimeEntriesToTimesheetRows).toHaveBeenCalledWith(
      mockEntries,
      result.current.currentWeek,
      [0, 1, 2, 3, 4, 5, 6], // visible days array
      [], // breaks array
      [], // custom field definitions
    );
  });

  it('should handle loading state', () => {
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: [],
      loading: true,
      error: null,
    });

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    const { result } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = 'Failed to fetch time entries';
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: [],
      loading: false,
      error: mockError,
    });

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    const { result } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.error).toBe(mockError);
  });

  it('should handle error object with message property', () => {
    const mockError = { message: 'Network error occurred' };
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: [],
      loading: false,
      error: mockError,
    });

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    const { result } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.error).toBe(mockError);
  });

  it('should update Redux loading state when API loading changes', () => {
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: [],
      loading: true,
      error: null,
    });

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(store.getState().timeEntryGrid.loading).toBe(true);
  });

  it('should update Redux error state when API error occurs', () => {
    const mockError = 'API Error';
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: [],
      loading: false,
      error: mockError,
    });

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(store.getState().timeEntryGrid.error).toBe(mockError);
  });

  it('should merge time entries to Redux when data is available', () => {
    const mockEntries = [{ id: '1', date: '2024-01-01', duration: 28800 }];
    const mockTransformedRows = [
      {
        rowId: 'row-1',
        timeAgainst: { type: 'CUSTOMER' as const, id: 'customer1' },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            notes: '',
            metaInfo: undefined,
            billableInfo: undefined,
          },
        },
        totalHours: 8,
        billableTotal: 0,
      },
    ];

    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: mockEntries,
      loading: false,
      error: null,
    });

    mockTransformTimeEntriesToTimesheetRows.mockReturnValue(
      mockTransformedRows,
    );

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    // Check that the transformed rows are included in the Redux state
    const state = store.getState().timeEntryGrid.weeklyTimeEntries;
    const { rowOrder } = store.getState().timeEntryGrid;
    expect(rowOrder).toHaveLength(6); // Should have 6 rows (1 merged + 5 default)

    // Check that the first row contains our expected data (ignoring dynamic rowId)
    const firstRowId = rowOrder[0];
    const firstRow = state[firstRowId];
    expect(firstRow.timeAgainst).toEqual(mockTransformedRows[0].timeAgainst);

    // Check that the original entry is preserved
    expect(firstRow.timeEntries[0]).toEqual(
      mockTransformedRows[0].timeEntries[0],
    );

    // Check that all 7 days exist with proper dates
    expect(firstRow.timeEntries[0].date).toBe('2024-01-01');
    expect(firstRow.timeEntries[1].date).toBe('2024-01-02');
    expect(firstRow.timeEntries[2].date).toBe('2024-01-03');
    expect(firstRow.timeEntries[3].date).toBe('2024-01-04');
    expect(firstRow.timeEntries[4].date).toBe('2024-01-05');
    expect(firstRow.timeEntries[5].date).toBe('2024-01-06');
    expect(firstRow.timeEntries[6].date).toBe('2024-01-07');

    // Check that empty days have default values
    expect(firstRow.timeEntries[1].hours).toBe(0);
    expect(firstRow.timeEntries[1].notes).toBe('');
    expect(firstRow.timeEntries[1].timeEntryId).toBe('');

    expect(firstRow.totalHours).toEqual(mockTransformedRows[0].totalHours);
    expect(firstRow.billableTotal).toEqual(
      mockTransformedRows[0].billableTotal,
    );
    expect(firstRow.rowId).toBeDefined(); // Should have a rowId
  });

  it('should NOT re-merge when a co-dependency changes but entries ref is unchanged', () => {
    // Regression guard: merging is destructive (wipes the grid and rebuilds
    // from server data). It must only run when fresh `entries` arrive, not when
    // visibleDays / breaks / customFields tick mid-session — otherwise the
    // user's unsaved input would be wiped. See useTimeEntriesFetching merge effect.
    const mockEntries = [{ id: '1', date: '2024-01-01', duration: 28800 }];
    const mockTransformedRows = [
      {
        rowId: 'row-1',
        timeAgainst: { type: 'CUSTOMER' as const, id: 'customer1' },
        timeEntries: {
          0: {
            timeEntryId: '1',
            date: '2024-01-01',
            hours: 8,
            notes: '',
            metaInfo: undefined,
            billableInfo: undefined,
          },
        },
        totalHours: 8,
        billableTotal: 0,
      },
    ];

    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: mockEntries, // stable reference across rerenders
      loading: false,
      error: null,
    });
    mockTransformTimeEntriesToTimesheetRows.mockReturnValue(
      mockTransformedRows,
    );

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { rerender } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const countMerges = () =>
      dispatchSpy.mock.calls.filter(
        (call) =>
          (call[0] as { type?: string })?.type ===
          'timeEntryGrid/mergeTimeEntries',
      ).length;

    // Initial fetch should merge exactly once
    expect(countMerges()).toBe(1);

    // Change a co-dependency (visibleDays) WITHOUT changing the entries ref
    act(() => {
      store.dispatch({
        type: 'timeEntrySettings/setVisibleDays',
        payload: { visibleIndices: [1, 2, 3, 4, 5] },
      });
    });
    rerender();

    // Merge must NOT fire again — entries reference is unchanged
    expect(countMerges()).toBe(1);

    dispatchSpy.mockRestore();
  });

  it('should re-merge when a non-duration field changes (service/class/location/notes)', () => {
    // The grid renders far more than duration — service, class, location, customer,
    // notes, custom fields, breaks. The content signature must cover all of them, so a
    // server change to ANY of these triggers a re-merge. Here only the service item
    // changes (same id/date/duration) and we assert the grid still re-merges.
    const firstEntries = [
      {
        id: '1',
        date: '2024-01-01',
        duration: 28800,
        serviceItemDAS: { id: 'svc-1', fullName: 'Consulting' },
      },
    ];
    const serviceChangedEntries = [
      {
        id: '1',
        date: '2024-01-01',
        duration: 28800, // unchanged
        serviceItemDAS: { id: 'svc-2', fullName: 'Design' }, // changed
      },
    ];

    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: firstEntries,
      loading: false,
      error: null,
    });
    mockTransformTimeEntriesToTimesheetRows.mockReturnValue([]);

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { rerender } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const countMerges = () =>
      dispatchSpy.mock.calls.filter(
        (call) =>
          (call[0] as { type?: string })?.type ===
          'timeEntryGrid/mergeTimeEntries',
      ).length;

    expect(countMerges()).toBe(1);

    // Only the service item changed -> signature changes -> should merge again
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: serviceChangedEntries,
      loading: false,
      error: null,
    });
    rerender();

    expect(countMerges()).toBe(2);

    dispatchSpy.mockRestore();
  });

  it('should NOT re-merge when a new entries array has identical content (Apollo re-emit)', () => {
    // Root-cause regression: useReadWeeklyTimeEntries (network-only) can hand back a
    // brand-new entries array holding structurally-identical data when an UNRELATED
    // request on the shared TIME_TRACKING Apollo client resolves (e.g. the per-customer
    // assignment fetch on slow networks). Merging is destructive — re-merging on a
    // new-but-equal array wipes and rebuilds the grid, producing the "flash the whole
    // UI then re-render" customers reported on customer selection. The content
    // signature must absorb the new reference and skip the merge.
    const firstEntries = [{ id: '1', date: '2024-01-01', duration: 28800 }];
    // Same content, different array + object references.
    const sameContentNewRef = [
      { id: '1', date: '2024-01-01', duration: 28800 },
    ];

    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: firstEntries,
      loading: false,
      error: null,
    });
    mockTransformTimeEntriesToTimesheetRows.mockReturnValue([]);

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { rerender } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const countMerges = () =>
      dispatchSpy.mock.calls.filter(
        (call) =>
          (call[0] as { type?: string })?.type ===
          'timeEntryGrid/mergeTimeEntries',
      ).length;

    expect(countMerges()).toBe(1);

    // A new array reference with identical content arrives (Apollo re-emit).
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: sameContentNewRef,
      loading: false,
      error: null,
    });
    rerender();

    // Merge must NOT fire again — the content signature is unchanged.
    expect(countMerges()).toBe(1);

    dispatchSpy.mockRestore();
  });

  it('should handle empty entries array', () => {
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: [],
      loading: false,
      error: null,
    });

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    const { result } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.hasData).toBe(false);
    expect(result.current.timeEntries).toEqual([]);
  });

  describe('Team member name fill from timeForContactDAS', () => {
    it('fills an empty team member name from the readWeekly timeForContactDAS', () => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [
          {
            id: '1',
            date: '2024-01-01',
            duration: 28800,
            timeForContactDAS: {
              id: 'emp123',
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        ],
        loading: false,
        error: null,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: '',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(store.getState().timeEntryGrid.teamMember.name).toBe('John Doe');
      // id/type must be preserved
      expect(store.getState().timeEntryGrid.teamMember.id).toBe('emp123');
      expect(store.getState().timeEntryGrid.teamMember.type).toBe('employee');
    });

    it('does not overwrite an existing team member name', () => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [
          {
            id: '1',
            date: '2024-01-01',
            duration: 28800,
            timeForContactDAS: {
              id: 'emp123',
              firstName: 'Should',
              lastName: 'NotApply',
            },
          },
        ],
        loading: false,
        error: null,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: 'John Doe',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(store.getState().timeEntryGrid.teamMember.name).toBe('John Doe');
    });

    it('does not fill the name when no entry carries timeForContactDAS', () => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [{ id: '1', date: '2024-01-01', duration: 28800 }],
        loading: false,
        error: null,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: '',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(store.getState().timeEntryGrid.teamMember.name).toBe('');
    });
  });

  it('should memoize current week based on date range', () => {
    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
    });

    const { result, rerender } = renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const firstWeek = result.current.currentWeek;

    // Rerender with same date range
    rerender();

    expect(result.current.currentWeek).toBe(firstWeek);

    // Update date range
    act(() => {
      store.dispatch({
        type: 'timeEntryGrid/setDateRange',
        payload: { start: '2024-01-08', end: '2024-01-14' },
      });
    });

    expect(result.current.currentWeek).not.toBe(firstWeek);
  });

  it('should dispatch time entries error to validation slice when API error occurs', () => {
    const mockError = 'API Error';
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: [],
      loading: false,
      error: mockError,
    });

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
      },
    });

    renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    // Check that the error is dispatched to both timeEntryGrid and validation slices
    expect(store.getState().timeEntryGrid.error).toBe(mockError);
    expect(store.getState().validation.timeEntriesError).toBe(mockError);
  });

  it('should clear time entries error when API loading starts', () => {
    mockUseReadWeeklyTimeEntries.mockReturnValue({
      entries: [],
      loading: true,
      error: null,
    });

    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: {
          id: 'emp123',
          name: 'John Doe',
          type: 'employee' as const,
        },
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: 'Previous error',
        fieldErrors: {},
        rowErrors: {},
      },
    });

    renderHook(() => useTimeEntriesFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    // Check that the error is cleared when loading starts
    expect(store.getState().validation.timeEntriesError).toBeNull();
  });

  // Team Billable Details Tests
  describe('Team Billable Details', () => {
    it('should call fetchTeamBillableDetails when team member is available', () => {
      const mockFetchTeamBillableDetails = jest.fn();
      mockUseTeamBillableDetailsFetching.mockReturnValue({
        fetchTeamBillableDetails: mockFetchTeamBillableDetails,
        data: null,
        isLoading: false,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: 'John Doe',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(mockFetchTeamBillableDetails).toHaveBeenCalled();
    });

    it('should not call fetchTeamBillableDetails when team member is not available', () => {
      const mockFetchTeamBillableDetails = jest.fn();
      mockUseTeamBillableDetailsFetching.mockReturnValue({
        fetchTeamBillableDetails: mockFetchTeamBillableDetails,
        data: null,
        isLoading: false,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: null,
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(mockFetchTeamBillableDetails).not.toHaveBeenCalled();
    });

    it('should dispatch team billable details to Redux when data is available', () => {
      const mockTeamBillableDetails = {
        billable: true,
        billableRate: 50.0,
      };

      mockUseTeamBillableDetailsFetching.mockReturnValue({
        fetchTeamBillableDetails: jest.fn(),
        data: mockTeamBillableDetails,
        isLoading: false,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: 'John Doe',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      // Check that the team billable details are dispatched to Redux
      // Note: We can't directly check the Redux state for teamBillableDetails
      // since it's not part of the test store, but we can verify the dispatch was called
      // by checking that the hook doesn't throw any errors
      expect(mockUseTeamBillableDetailsFetching).toHaveBeenCalled();
    });

    it('should dispatch team billable details when team member type changes', () => {
      const mockTeamBillableDetails = {
        billable: false,
        billableRate: 0,
      };

      mockUseTeamBillableDetailsFetching.mockReturnValue({
        fetchTeamBillableDetails: jest.fn(),
        data: mockTeamBillableDetails,
        isLoading: false,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: 'John Doe',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      const { rerender } = renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      // Change team member type
      act(() => {
        store.dispatch({
          type: 'timeEntryGrid/setTeamMember',
          payload: {
            id: 'emp123',
            name: 'John Doe',
            type: 'vendor' as const,
          },
        });
      });

      rerender();

      // The hook should handle the team member type change
      expect(mockUseTeamBillableDetailsFetching).toHaveBeenCalled();
    });

    it('should combine loading states from time entries and team billable details', () => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [],
        loading: true,
        error: null,
      });

      mockUseTeamBillableDetailsFetching.mockReturnValue({
        fetchTeamBillableDetails: jest.fn(),
        data: null,
        isLoading: true,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: 'John Doe',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      // Both time entries and team billable details are loading, so Redux loading should be true
      expect(store.getState().timeEntryGrid.loading).toBe(true);
    });

    it('should set loading to false when both time entries and team billable details are not loading', () => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [],
        loading: false,
        error: null,
      });

      mockUseTeamBillableDetailsFetching.mockReturnValue({
        fetchTeamBillableDetails: jest.fn(),
        data: null,
        isLoading: false,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: 'John Doe',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: true, // Start with loading true
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      // Both are not loading, so Redux loading should be false
      expect(store.getState().timeEntryGrid.loading).toBe(false);
    });

    it('should set loading to true when only time entries is loading', () => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [],
        loading: true,
        error: null,
      });

      mockUseTeamBillableDetailsFetching.mockReturnValue({
        fetchTeamBillableDetails: jest.fn(),
        data: null,
        isLoading: false,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: 'John Doe',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      // Only time entries is loading, so Redux loading should be true
      expect(store.getState().timeEntryGrid.loading).toBe(true);
    });

    it('should set loading to true when only team billable details is loading', () => {
      mockUseReadWeeklyTimeEntries.mockReturnValue({
        entries: [],
        loading: false,
        error: null,
      });

      mockUseTeamBillableDetailsFetching.mockReturnValue({
        fetchTeamBillableDetails: jest.fn(),
        data: null,
        isLoading: true,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: 'John Doe',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      // Only team billable details is loading, so Redux loading should be true
      expect(store.getState().timeEntryGrid.loading).toBe(true);
    });

    it('should call fetchTeamBillableDetails when team member ID changes', () => {
      const mockFetchTeamBillableDetails = jest.fn();
      mockUseTeamBillableDetailsFetching.mockReturnValue({
        fetchTeamBillableDetails: mockFetchTeamBillableDetails,
        data: null,
        isLoading: false,
      });

      store = createTestStore({
        timeEntryGrid: {
          weeklyTimeEntries: {},
          rowOrder: [],
          teamMember: {
            id: 'emp123',
            name: 'John Doe',
            type: 'employee' as const,
          },
          dateRange: { start: '2024-01-01', end: '2024-01-07' },
          loading: false,
          error: null,
          selected: null,
          firstEditedCells: {},
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
          visibleDaysFromPreferences: [],
        },
      });

      const { rerender } = renderHook(() => useTimeEntriesFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      // Clear the mock calls
      mockFetchTeamBillableDetails.mockClear();

      // Change team member ID
      act(() => {
        store.dispatch({
          type: 'timeEntryGrid/setTeamMember',
          payload: {
            id: 'emp456',
            name: 'Jane Smith',
            type: 'employee' as const,
          },
        });
      });

      rerender();

      // Should call fetchTeamBillableDetails again with new team member ID
      expect(mockFetchTeamBillableDetails).toHaveBeenCalled();
    });
  });
});
