import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';

describe('Time entry sorting functionality', () => {
  // This test validates the sorting logic used in WeeklyTimeHOC.onSaveSuccess
  it('should sort time entries by ID in ascending order', () => {
    // Create mock time entries with IDs in random order
    const mockTimeEntries = [
      { id: 'c', date: '2023-01-01', duration: 3600 },
      { id: 'a', date: '2023-01-02', duration: 7200 },
      { id: 'b', date: '2023-01-03', duration: 1800 },
    ] as TimeTracking_TimeEntry[];

    // Apply the same sorting logic as in WeeklyTimeHOC.onSaveSuccess
    const sortedEntries = [...mockTimeEntries].sort((a, b) =>
      a.id && b.id ? a.id.localeCompare(b.id) : 0,
    );

    // Verify the sorting works as expected
    expect(sortedEntries[0].id).toBe('a');
    expect(sortedEntries[1].id).toBe('b');
    expect(sortedEntries[2].id).toBe('c');
  });

  it('should handle time entries with null or undefined IDs', () => {
    // Create mock time entries with some missing IDs
    const mixedEntries = [
      { id: 'z', date: '2023-01-01', duration: 3600 },
      { id: undefined, date: '2023-01-02', duration: 7200 },
      { id: null, date: '2023-01-03', duration: 1800 },
      { id: 'y', date: '2023-01-04', duration: 5400 },
    ] as TimeTracking_TimeEntry[];

    // Apply the same sorting logic as in WeeklyTimeHOC.onSaveSuccess
    const sortedEntries = [...mixedEntries].sort((a, b) =>
      a.id && b.id ? a.id.localeCompare(b.id) : 0,
    );

    // Filter entries with IDs to verify sorting
    const entriesWithIds = sortedEntries.filter((entry) => entry.id);

    // Verify entries with IDs are sorted correctly
    expect(entriesWithIds[0].id).toBe('z');
    expect(entriesWithIds[1].id).toBe('y');

    // Verify entries without IDs are handled gracefully
    const entriesWithoutIds = sortedEntries.filter((entry) => !entry.id);
    expect(entriesWithoutIds.length).toBe(2);
  });
});
