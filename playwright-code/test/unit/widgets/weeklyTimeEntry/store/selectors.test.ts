import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import { selectMaxApprovedDate } from 'src/js/widgets/weeklyTimeEntry/store/selectors';
import type { TimesheetRow } from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';

// Helper to create a mock RootState with weeklyTimeEntries
const createMockState = (weeklyTimeEntries: {
  [rowId: string]: TimesheetRow;
}) =>
  ({
    timeEntryGrid: {
      weeklyTimeEntries,
    },
  } as any);

const createRow = (
  overrides: Partial<TimesheetRow> & { rowId: string },
): TimesheetRow => ({
  timeAgainst: {
    type: DataAccess_ContactType.Customer,
    id: 'customer1',
    displayName: 'Test Customer',
  },
  timeEntries: {},
  totalHours: 0,
  billableTotal: 0,
  hasApprovedEntries: false,
  ...overrides,
});

describe('selectMaxApprovedDate', () => {
  it('should return null when no rows exist', () => {
    const state = createMockState({});
    expect(selectMaxApprovedDate(state)).toBeNull();
  });

  it('should return null when no entries are approved', () => {
    const state = createMockState({
      'row-1': createRow({
        rowId: 'row-1',
        timeEntries: {
          0: {
            timeEntryId: 'entry-1',
            date: '2026-04-14',
            hours: 8,
            isApproved: false,
          },
        },
      }),
    });
    expect(selectMaxApprovedDate(state)).toBeNull();
  });

  it('should return the approved date for a single approved entry', () => {
    const state = createMockState({
      'row-1': createRow({
        rowId: 'row-1',
        timeEntries: {
          0: {
            timeEntryId: 'entry-1',
            date: '2026-04-14',
            hours: 8,
            isApproved: true,
          },
        },
      }),
    });
    expect(selectMaxApprovedDate(state)).toBe('2026-04-14');
  });

  it('should return the latest approved date across multiple rows', () => {
    const state = createMockState({
      'row-1': createRow({
        rowId: 'row-1',
        timeEntries: {
          0: {
            timeEntryId: 'entry-1',
            date: '2026-04-14',
            hours: 8,
            isApproved: true,
          },
        },
      }),
      'row-2': createRow({
        rowId: 'row-2',
        timeEntries: {
          2: {
            timeEntryId: 'entry-2',
            date: '2026-04-16',
            hours: 4,
            isApproved: true,
          },
        },
      }),
    });
    expect(selectMaxApprovedDate(state)).toBe('2026-04-16');
  });

  it('should exclude isExternalTimeOff entries from the max approved date calculation', () => {
    const state = createMockState({
      'row-1': createRow({
        rowId: 'row-1',
        timeEntries: {
          0: {
            timeEntryId: 'entry-1',
            date: '2026-04-14',
            hours: 8,
            isApproved: true,
          },
        },
      }),
      'row-2': createRow({
        rowId: 'row-2',
        isTimeOffRow: true,
        timeEntries: {
          4: {
            timeEntryId: 'entry-2',
            date: '2026-04-18',
            hours: 8,
            isApproved: true,
            isExternalTimeOff: true,
          },
        },
      }),
    });
    // The external time off entry on 4/18 should be excluded,
    // so maxApprovedDate should be 4/14 from the regular entry
    expect(selectMaxApprovedDate(state)).toBe('2026-04-14');
  });

  it('should return null when only isExternalTimeOff entries are approved', () => {
    const state = createMockState({
      'row-1': createRow({
        rowId: 'row-1',
        timeEntries: {
          0: {
            timeEntryId: 'entry-1',
            date: '2026-04-14',
            hours: 8,
            isApproved: false,
          },
        },
      }),
      'row-2': createRow({
        rowId: 'row-2',
        isTimeOffRow: true,
        timeEntries: {
          4: {
            timeEntryId: 'entry-2',
            date: '2026-04-18',
            hours: 8,
            isApproved: true,
            isExternalTimeOff: true,
          },
        },
      }),
    });
    expect(selectMaxApprovedDate(state)).toBeNull();
  });

  it('should still include approved time off entries that are not external', () => {
    const state = createMockState({
      'row-1': createRow({
        rowId: 'row-1',
        isTimeOffRow: true,
        timeEntries: {
          0: {
            timeEntryId: 'entry-1',
            date: '2026-04-14',
            hours: 8,
            isApproved: true,
            isExternalTimeOff: false,
          },
        },
      }),
    });
    expect(selectMaxApprovedDate(state)).toBe('2026-04-14');
  });
});
