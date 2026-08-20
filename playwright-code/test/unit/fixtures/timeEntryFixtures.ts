/**
 * Minimal time entry fixture data for widget tests.
 */
export const mockTimeEntry = {
  id: '742291174',
  startTime: '2026-01-14T09:30:00.000-08:00',
  endTime: '2026-01-14T10:30:00.000-08:00',
  duration: 3600,
  notes: 'Test time entry notes',
  timeZone: 'America/Los_Angeles',
  timeForContactDAS: {
    id: '400000021',
    displayName: 'John Doe',
    fullName: 'John Doe',
  },
  timeAgainstContactDAS: {
    customer: {
      id: '104',
      fullName: 'Test Customer',
      primaryAddress: {
        lines: '350 Fifth Avenue\nSuite 4200',
        city: 'New York',
        state: 'NY',
        postalCode: '10118',
        address: null,
      },
    },
  },
};

/**
 * GQL response wrapper shape for tests that need the full response object.
 */
export const mockTimeEntryData = {
  timeEntry: mockTimeEntry,
};
