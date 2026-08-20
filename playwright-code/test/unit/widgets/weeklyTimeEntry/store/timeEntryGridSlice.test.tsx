import {
  timeEntryGridSlice,
  timeEntryDetails,
  TimesheetRow,
  TimeEntryGridState,
} from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';

const { updateCell } = timeEntryGridSlice.actions;

const makeEntry = (
  overrides: Partial<timeEntryDetails> = {},
): timeEntryDetails => ({
  timeEntryId: '',
  date: '2026-04-13',
  hours: 0,
  isApproved: false,
  ...overrides,
});

const makeSavedEntry = (
  overrides: Partial<timeEntryDetails> = {},
  originalOverrides: Partial<timeEntryDetails['originalValues']> = {},
): timeEntryDetails => {
  const base: timeEntryDetails = {
    timeEntryId: 'te-1',
    date: '2026-04-13',
    hours: 8,
    isApproved: false,
    ...overrides,
  };
  return {
    ...base,
    originalValues: {
      hours: base.hours,
      notes: base.notes,
      startTime: base.startTime,
      endTime: base.endTime,
      metaInfo: base.metaInfo,
      billableInfo: base.billableInfo,
      customFields: base.customFields,
      ...originalOverrides,
    },
  };
};

const buildState = (
  timeEntries: Record<number, timeEntryDetails>,
): TimeEntryGridState => {
  const row: TimesheetRow = {
    rowId: 'row-1',
    timeAgainst: { type: null, id: null },
    timeEntries,
    totalHours: 0,
    billableTotal: 0,
    hasApprovedEntries: false,
  };

  return {
    weeklyTimeEntries: { 'row-1': row },
    rowOrder: ['row-1'],
    teamMember: null,
    dateRange: { start: '2026-04-13', end: '2026-04-19' },
    loading: false,
    error: null,
    selected: null,
    firstEditedCells: {},
    showSelectTeamMemberTooltip: false,
    isTeamMemberDropdownReady: false,
    isQuickFindEnabled: false,
    isQuickFindSettled: true,
    confirmTimeEntryConversionModal: {
      isOpen: false,
      rowId: null,
      dayIdx: null,
    },
  };
};

describe('timeEntryGridSlice', () => {
  describe('updateCell - hasMeaningfulChanges with metaInfo', () => {
    it('should set UPDATE operation when adding class to saved entry that had no metaInfo', () => {
      const state = buildState({
        0: makeSavedEntry({ metaInfo: undefined }, { metaInfo: undefined }),
      });

      const nextState = timeEntryGridSlice.reducer(
        state,
        updateCell({
          rowId: 'row-1',
          dayIdx: 0,
          value: {
            metaInfo: { class: { id: 'cls-1', name: 'Design' } },
          },
        }),
      );

      expect(
        nextState.weeklyTimeEntries['row-1'].timeEntries[0].operation,
      ).toBe('UPDATE');
    });

    it('should set UPDATE operation when adding service to saved entry that had no metaInfo', () => {
      const state = buildState({
        0: makeSavedEntry({ metaInfo: undefined }, { metaInfo: undefined }),
      });

      const nextState = timeEntryGridSlice.reducer(
        state,
        updateCell({
          rowId: 'row-1',
          dayIdx: 0,
          value: {
            metaInfo: { service: { id: 'svc-1', name: 'Consulting' } },
          },
        }),
      );

      expect(
        nextState.weeklyTimeEntries['row-1'].timeEntries[0].operation,
      ).toBe('UPDATE');
    });

    it('should set UPDATE operation when adding location to saved entry that had no metaInfo', () => {
      const state = buildState({
        0: makeSavedEntry({ metaInfo: undefined }, { metaInfo: undefined }),
      });

      const nextState = timeEntryGridSlice.reducer(
        state,
        updateCell({
          rowId: 'row-1',
          dayIdx: 0,
          value: {
            metaInfo: { location: { id: 'loc-1', name: 'Office' } },
          },
        }),
      );

      expect(
        nextState.weeklyTimeEntries['row-1'].timeEntries[0].operation,
      ).toBe('UPDATE');
    });

    it('should set UPDATE operation when changing class on saved entry that had class', () => {
      const state = buildState({
        0: makeSavedEntry({
          metaInfo: { class: { id: 'cls-1', name: 'Design' } },
        }),
      });

      const nextState = timeEntryGridSlice.reducer(
        state,
        updateCell({
          rowId: 'row-1',
          dayIdx: 0,
          value: {
            metaInfo: { class: { id: 'cls-2', name: 'Development' } },
          },
        }),
      );

      expect(
        nextState.weeklyTimeEntries['row-1'].timeEntries[0].operation,
      ).toBe('UPDATE');
    });

    it('should not set operation when class value is unchanged', () => {
      const state = buildState({
        0: makeSavedEntry({
          metaInfo: { class: { id: 'cls-1', name: 'Design' } },
        }),
      });

      const nextState = timeEntryGridSlice.reducer(
        state,
        updateCell({
          rowId: 'row-1',
          dayIdx: 0,
          value: {
            metaInfo: { class: { id: 'cls-1', name: 'Design' } },
          },
        }),
      );

      expect(
        nextState.weeklyTimeEntries['row-1'].timeEntries[0].operation,
      ).toBeUndefined();
    });
  });

  describe('updateCell - hasMeaningfulChanges with billableInfo', () => {
    it('should set UPDATE operation when adding billableInfo to saved entry that had none', () => {
      const state = buildState({
        0: makeSavedEntry(
          { billableInfo: undefined },
          { billableInfo: undefined },
        ),
      });

      const nextState = timeEntryGridSlice.reducer(
        state,
        updateCell({
          rowId: 'row-1',
          dayIdx: 0,
          value: {
            billableInfo: { billable: true, billableRate: '50' },
          },
        }),
      );

      expect(
        nextState.weeklyTimeEntries['row-1'].timeEntries[0].operation,
      ).toBe('UPDATE');
    });
  });

  describe('updateCell - hasMeaningfulChanges with customFields', () => {
    it('should set UPDATE operation when adding customFields to saved entry that had none', () => {
      const state = buildState({
        0: makeSavedEntry(
          { customFields: undefined },
          { customFields: undefined },
        ),
      });

      const nextState = timeEntryGridSlice.reducer(
        state,
        updateCell({
          rowId: 'row-1',
          dayIdx: 0,
          value: {
            customFields: [{ id: 'cf-1', name: 'Priority', value: 'High' }],
          },
        }),
      );

      expect(
        nextState.weeklyTimeEntries['row-1'].timeEntries[0].operation,
      ).toBe('UPDATE');
    });
  });
});
