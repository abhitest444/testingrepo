import {
  mapLocationPointsToDisplayData,
  getFormattedAddress,
  getTeamMemberInfo,
  getCustomerInfo,
  getTimeEntryRange,
  getTotalHoursFromLocationPoints,
  formatTimeEntryTimestamp,
  mapLocationPointsToTimeline,
  extractTimeFromFormattedTimestamp,
  getClockInOutTimes,
  buildGeoSameDayEntryTimeRangeMapById,
  getTimeEntryLocalDateForApi,
  getActiveDeviceFlagKeys,
  getFirstDeviceNote,
  truncateDeviceNote,
  getEntryLevelDeviceFlagKeys,
  DEVICE_NOTE_TRUNCATE_LENGTH,
} from 'src/js/widgets/timeEntryLocation/utils/locationPointUtils';
import {
  TimeTracking_LocationPoint,
  TimeTracking_TimeEntry,
  TimeTracking_TimeEntryDeviceAttributes,
} from 'src/__generated__/timeTracking/graphql';
import { LocationPointData } from 'src/js/widgets/timeEntryLocation/components/types';

// Mock dayjs and timezone plugin
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  const mockDayjs = (date?: string) => {
    const utcDate = date || '2026-01-14T17:30:00.000Z';
    const instance = originalDayjs(utcDate);
    return {
      ...instance,
      _utcDate: utcDate, // Store the original UTC date for diff calculations
      tz: jest.fn((timezone?: string | null) => {
        // When timezone is PST/PDT, convert UTC to PST (UTC-8)
        // createdAt '2026-01-14T17:30:00.000Z' (5:30 PM UTC) = 9:30 AM PST
        // For null/undefined timezone, use UTC
        const isPST = timezone === 'America/Los_Angeles';

        // Handle different input dates for different timestamps
        let convertedDate = utcDate;
        if (isPST) {
          // Convert UTC to PST (UTC-8)
          if (utcDate === '2026-01-14T17:30:00.000Z') {
            convertedDate = '2026-01-14T09:30:00.000-08:00'; // 9:30 AM PST
          } else if (utcDate === '2026-01-14T18:45:00.000Z') {
            convertedDate = '2026-01-14T10:45:00.000-08:00'; // 10:45 AM PST
          } else {
            // Default conversion: subtract 8 hours
            const dateObj = originalDayjs(utcDate);
            convertedDate = dateObj.subtract(8, 'hour').format();
          }
        }
        // For null/undefined timezone, keep UTC (no conversion)

        const convertedInstance = originalDayjs(convertedDate);
        const originalInstance = originalDayjs(utcDate);

        return {
          _utcDate: utcDate, // Store for diff calculations
          format: jest.fn((format: string) => {
            if (format === 'h:mm A') {
              if (isPST) {
                if (utcDate === '2026-01-14T17:30:00.000Z') return '9:30 AM';
                if (utcDate === '2026-01-14T18:45:00.000Z') return '10:45 AM';
                return convertedInstance.format('h:mm A');
              }
              // UTC: 17:30 UTC = 5:30 PM
              if (utcDate === '2026-01-14T17:30:00.000Z') return '5:30 PM';
              return convertedInstance.format('h:mm A');
            }
            if (format === 'D MMM YYYY, h:mm A') {
              if (isPST) {
                if (utcDate === '2026-01-14T17:30:00.000Z')
                  return '14 Jan 2026, 9:30 AM';
                if (utcDate === '2026-01-14T18:45:00.000Z')
                  return '14 Jan 2026, 10:45 AM';
                return convertedInstance.format('D MMM YYYY, h:mm A');
              }
              // UTC: 17:30 UTC = 5:30 PM
              if (utcDate === '2026-01-14T17:30:00.000Z')
                return '14 Jan 2026, 5:30 PM';
              return convertedInstance.format('D MMM YYYY, h:mm A');
            }
            return convertedInstance.format(format);
          }),
          diff: jest.fn((otherDate: any, unit: string) => {
            // Extract the UTC date from the other mock object
            const otherUtcDate = otherDate?._utcDate || otherDate;
            const otherInstance =
              typeof otherUtcDate === 'string'
                ? originalDayjs(otherUtcDate)
                : otherUtcDate;
            return originalInstance.diff(otherInstance, unit as any);
          }),
        };
      }),
    };
  };
  mockDayjs.extend = jest.fn();
  return mockDayjs;
});

jest.mock('dayjs/plugin/utc', () => ({}));
jest.mock('dayjs/plugin/timezone', () => ({}));

// Mock mapQBTimezoneToDayjsTimezone
jest.mock('src/js/common/DateAndTimeUtils', () => ({
  mapQBTimezoneToDayjsTimezone: jest.fn((tz: string | null | undefined) => {
    if (!tz) return 'UTC';
    return tz === 'America/Los_Angeles' ? 'America/Los_Angeles' : tz;
  }),
}));

describe('mapLocationPointsToDisplayData', () => {
  const mockApiLocationPoints: TimeTracking_LocationPoint[] = [
    {
      id: '111753208',
      longitude: -127.4203,
      latitude: 47.7769,
      createdAt: '2026-01-14T17:30:00.000Z',
      accuracy: 11.3,
      altitude: 202.8,
      deviceIdentifier: 'device-123',
    },
    {
      id: '111753210',
      longitude: -127.4208,
      latitude: 47.7775,
      createdAt: '2026-01-14T17:33:00.000Z',
      accuracy: 8.5,
      altitude: 200.0,
      deviceIdentifier: 'device-456',
    },
    {
      id: '111753212',
      longitude: -127.4223,
      latitude: 47.7779,
      createdAt: '2026-01-14T17:35:00.000Z',
      accuracy: null,
      altitude: null,
      deviceIdentifier: null as any,
    },
  ];

  const mockTimeEntry = {
    id: '742291174',
    startTime: '2026-01-14T09:30:00.000-08:00',
    endTime: '2026-01-14T10:30:00.000-08:00',
    duration: 3600,
    notes: 'Test notes',
    timeZone: 'America/Los_Angeles',
    timeForContactDAS: {
      id: '400000021',
      displayName: 'John Doe',
      fullName: 'John Doe',
    },
    timeAgainstContactDAS: {
      project: null,
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
  } as unknown as TimeTracking_TimeEntry;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic mapping', () => {
    it('should map location points to display format', () => {
      const result = mapLocationPointsToDisplayData(
        mockApiLocationPoints,
        mockTimeEntry,
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        lat: 47.7769,
        lng: -127.4203,
        accuracy: '11.3m',
        teamMemberName: 'John Doe',
      });
      expect(result[0].timestamp).toBe('14 Jan 2026, 9:30 AM');
    });

    it('should handle empty location points array', () => {
      const result = mapLocationPointsToDisplayData([], mockTimeEntry);
      expect(result).toEqual([]);
    });

    it('should handle null timeEntry', () => {
      const result = mapLocationPointsToDisplayData(
        mockApiLocationPoints,
        null,
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        lat: 47.7769,
        lng: -127.4203,
        teamMemberName: null,
      });
    });
  });

  describe('accuracy formatting', () => {
    it('should format accuracy with "m" suffix', () => {
      const result = mapLocationPointsToDisplayData(
        [mockApiLocationPoints[0]],
        mockTimeEntry,
      );

      expect(result[0].accuracy).toBe('11.3m');
    });

    it('should set accuracy to null when not provided', () => {
      const result = mapLocationPointsToDisplayData(
        [mockApiLocationPoints[2]],
        mockTimeEntry,
      );

      expect(result[0].accuracy).toBeNull();
    });

    it('should handle decimal accuracy values', () => {
      const result = mapLocationPointsToDisplayData(
        [mockApiLocationPoints[1]],
        mockTimeEntry,
      );

      expect(result[0].accuracy).toBe('8.5m');
    });
  });

  describe('team member name extraction', () => {
    it('should extract displayName from timeForContactDAS', () => {
      const result = mapLocationPointsToDisplayData(
        mockApiLocationPoints,
        mockTimeEntry,
      );

      expect(result[0].teamMemberName).toBe('John Doe');
    });

    it('should fallback to fullName when displayName is not available', () => {
      const timeEntryWithoutDisplayName = {
        ...mockTimeEntry,
        timeForContactDAS: {
          id: '400000021',
          fullName: 'Jane Smith',
        },
      } as TimeTracking_TimeEntry;

      const result = mapLocationPointsToDisplayData(
        mockApiLocationPoints,
        timeEntryWithoutDisplayName,
      );

      expect(result[0].teamMemberName).toBe('Jane Smith');
    });

    it('should set teamMemberName to null when neither displayName nor fullName is available', () => {
      const timeEntryWithoutName = {
        ...mockTimeEntry,
        timeForContactDAS: {
          id: '400000021',
        },
      } as TimeTracking_TimeEntry;

      const result = mapLocationPointsToDisplayData(
        mockApiLocationPoints,
        timeEntryWithoutName,
      );

      expect(result[0].teamMemberName).toBeNull();
    });

    it('should set teamMemberName to null when timeEntry is null', () => {
      const result = mapLocationPointsToDisplayData(
        mockApiLocationPoints,
        null,
      );

      expect(result[0].teamMemberName).toBeNull();
    });
  });

  describe('timezone handling', () => {
    it('should use timezone from timeEntry', () => {
      const result = mapLocationPointsToDisplayData(
        mockApiLocationPoints,
        mockTimeEntry,
      );

      // The timestamp should be formatted using the timezone
      expect(result[0].timestamp).toBe('14 Jan 2026, 9:30 AM');
    });

    it('should handle null timezone', () => {
      const timeEntryWithoutTimezone = {
        ...mockTimeEntry,
        timeZone: null,
      } as unknown as TimeTracking_TimeEntry;

      const result = mapLocationPointsToDisplayData(
        mockApiLocationPoints,
        timeEntryWithoutTimezone,
      );

      // When timezone is null, it uses UTC, so 17:30 UTC = 5:30 PM UTC
      expect(result[0].timestamp).toBe('14 Jan 2026, 5:30 PM');
    });
  });

  describe('timestamp formatting', () => {
    it('should format timestamp correctly', () => {
      const result = mapLocationPointsToDisplayData(
        [mockApiLocationPoints[0]],
        mockTimeEntry,
      );

      expect(result[0].timestamp).toBe('14 Jan 2026, 9:30 AM');
    });

    it('should set timestamp to empty string when createdAt is not provided', () => {
      const pointWithoutCreatedAt = {
        ...mockApiLocationPoints[0],
        createdAt: null,
      };

      const result = mapLocationPointsToDisplayData(
        [pointWithoutCreatedAt],
        mockTimeEntry,
      );

      expect(result[0].timestamp).toBe('');
    });
  });

  describe('coordinate handling', () => {
    it('should handle null latitude/longitude', () => {
      const pointWithNullCoords = {
        ...mockApiLocationPoints[0],
        latitude: null,
        longitude: null,
      };

      const result = mapLocationPointsToDisplayData(
        [pointWithNullCoords],
        mockTimeEntry,
      );

      expect(result[0].lat).toBe(0);
      expect(result[0].lng).toBe(0);
    });

    it('should preserve valid coordinates', () => {
      const result = mapLocationPointsToDisplayData(
        [mockApiLocationPoints[0]],
        mockTimeEntry,
      );

      expect(result[0].lat).toBe(47.7769);
      expect(result[0].lng).toBe(-127.4203);
    });
  });
});

describe('getFormattedAddress', () => {
  const mockTimeEntryWithCustomerAddress = {
    id: '742291174',
    timeAgainstContactDAS: {
      project: null,
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
  } as unknown as TimeTracking_TimeEntry;

  const mockTimeEntryWithProjectAddress = {
    id: '742291175',
    timeAgainstContactDAS: {
      project: {
        id: '105',
        fullName: 'Test Project',
        primaryAddress: {
          lines: '100 Main St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94102',
        },
      },
      customer: {
        id: '104',
        fullName: 'Test Customer',
        primaryAddress: {
          lines: '350 Fifth Avenue',
          city: 'New York',
          state: 'NY',
          postalCode: '10118',
        },
      },
    },
  } as unknown as TimeTracking_TimeEntry;

  const mockTimeEntryWithoutAddress = {
    id: '742291176',
    timeAgainstContactDAS: {
      project: null,
      customer: {
        id: '104',
        fullName: 'Test Customer',
        primaryAddress: null,
      },
    },
  } as unknown as TimeTracking_TimeEntry;

  const mockTimeEntryWithoutTimeAgainst = {
    id: '742291177',
    timeAgainstContactDAS: null,
  } as unknown as TimeTracking_TimeEntry;

  it('should format customer address correctly', () => {
    const result = getFormattedAddress(mockTimeEntryWithCustomerAddress);
    expect(result).toBe('350 Fifth Avenue Suite 4200, New York, NY, 10118');
  });

  it('should prioritize project address over customer address', () => {
    const result = getFormattedAddress(mockTimeEntryWithProjectAddress);
    expect(result).toBe('100 Main St, San Francisco, CA, 94102');
  });

  it('should handle address with newlines in lines field', () => {
    const result = getFormattedAddress(mockTimeEntryWithCustomerAddress);
    // Should replace \n with space
    expect(result).toContain('350 Fifth Avenue Suite 4200');
    expect(result).not.toContain('\n');
  });

  it('should return empty string when primaryAddress is null', () => {
    const result = getFormattedAddress(mockTimeEntryWithoutAddress);
    expect(result).toBe('');
  });

  it('should return empty string when timeAgainstContactDAS is null', () => {
    const result = getFormattedAddress(mockTimeEntryWithoutTimeAgainst);
    expect(result).toBe('');
  });

  it('should return empty string when timeEntry is null', () => {
    const result = getFormattedAddress(null);
    expect(result).toBe('');
  });

  it('should filter out empty address fields', () => {
    const timeEntryWithPartialAddress = {
      id: '742291178',
      timeAgainstContactDAS: {
        customer: {
          id: '104',
          primaryAddress: {
            lines: '350 Fifth Avenue',
            city: null,
            state: 'NY',
            postalCode: '',
          },
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getFormattedAddress(timeEntryWithPartialAddress);
    expect(result).toBe('350 Fifth Avenue, NY');
  });

  it('should trim whitespace from address fields', () => {
    const timeEntryWithWhitespace = {
      id: '742291179',
      timeAgainstContactDAS: {
        customer: {
          id: '104',
          primaryAddress: {
            lines: '  350 Fifth Avenue  ',
            city: '  New York  ',
            state: 'NY',
            postalCode: '10118',
          },
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getFormattedAddress(timeEntryWithWhitespace);
    expect(result).toBe('350 Fifth Avenue, New York, NY, 10118');
  });

  it('should return empty string when all address fields are empty', () => {
    const timeEntryWithEmptyAddress = {
      id: '742291180',
      timeAgainstContactDAS: {
        customer: {
          id: '104',
          primaryAddress: {
            lines: null,
            city: '',
            state: null,
            postalCode: null,
          },
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getFormattedAddress(timeEntryWithEmptyAddress);
    expect(result).toBe('');
  });
});

describe('getTeamMemberInfo', () => {
  it('should extract displayName when available', () => {
    const timeEntry = {
      timeForContactDAS: {
        id: '400000021',
        displayName: 'John Doe',
        fullName: 'John Doe Full',
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getTeamMemberInfo(timeEntry);
    expect(result).toEqual({ name: 'John Doe', id: '400000021' });
  });

  it('should fallback to fullName when displayName is not available', () => {
    const timeEntry = {
      timeForContactDAS: {
        id: '400000021',
        fullName: 'Jane Smith',
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getTeamMemberInfo(timeEntry);
    expect(result).toEqual({ name: 'Jane Smith', id: '400000021' });
  });

  it('should return empty name when neither displayName nor fullName is available', () => {
    const timeEntry = {
      timeForContactDAS: {
        id: '400000021',
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getTeamMemberInfo(timeEntry);
    expect(result).toEqual({ name: '', id: '400000021' });
  });

  it('should handle null timeEntry', () => {
    const result = getTeamMemberInfo(null);
    expect(result).toEqual({ name: '', id: undefined });
  });
});

describe('getTimeEntryRange', () => {
  const nowText = 'Now';

  it('should return time range from startTime to endTime for closed entries', () => {
    const timeEntry: TimeTracking_TimeEntry = {
      id: '742291174',
      startTime: '2026-01-14T17:30:00.000Z', // 9:30 AM PST
      endTime: '2026-01-14T18:45:00.000Z', // 10:45 AM PST
      timeZone: 'America/Los_Angeles',
      isOpen: false,
    } as TimeTracking_TimeEntry;

    const result = getTimeEntryRange(timeEntry, nowText);
    expect(result).toBe('9:30 AM - 10:45 AM');
  });

  it('should return "startTime - Now" for open entries', () => {
    const timeEntry: TimeTracking_TimeEntry = {
      id: '742291174',
      startTime: '2026-01-14T17:30:00.000Z', // 9:30 AM PST
      endTime: null,
      timeZone: 'America/Los_Angeles',
      isOpen: true,
    } as TimeTracking_TimeEntry;

    const result = getTimeEntryRange(timeEntry, nowText);
    expect(result).toBe('9:30 AM - Now');
  });

  it('should use provided nowText for open entries', () => {
    const timeEntry: TimeTracking_TimeEntry = {
      id: '742291174',
      startTime: '2026-01-14T17:30:00.000Z',
      endTime: null,
      timeZone: 'America/Los_Angeles',
      isOpen: true,
    } as TimeTracking_TimeEntry;

    const result = getTimeEntryRange(timeEntry, 'Maintenant'); // French for "Now"
    expect(result).toBe('9:30 AM - Maintenant');
  });

  it('should return empty string when timeEntry is null', () => {
    const result = getTimeEntryRange(null, nowText);
    expect(result).toBe('');
  });

  it('should return empty string when startTime is missing', () => {
    const timeEntry: TimeTracking_TimeEntry = {
      id: '742291174',
      startTime: null,
      endTime: '2026-01-14T10:45:00.000-08:00',
      timeZone: 'America/Los_Angeles',
      isOpen: false,
    } as TimeTracking_TimeEntry;

    const result = getTimeEntryRange(timeEntry, nowText);
    expect(result).toBe('');
  });

  it('should handle closed entry without endTime gracefully', () => {
    const timeEntry: TimeTracking_TimeEntry = {
      id: '742291174',
      startTime: '2026-01-14T09:30:00.000-08:00',
      endTime: null,
      timeZone: 'America/Los_Angeles',
      isOpen: false,
    } as TimeTracking_TimeEntry;

    const result = getTimeEntryRange(timeEntry, nowText);
    // Will attempt to format undefined endTime, resulting in empty string after " - "
    expect(result).toContain(' - ');
  });
});

describe('buildGeoSameDayEntryTimeRangeMapById', () => {
  const nowText = 'Now';

  it('returns id to range only for geo entries on the same local calendar day', () => {
    const entries = [
      {
        id: 'geo-same-day',
        startTime: '2026-01-14T17:30:00.000Z',
        endTime: '2026-01-14T18:45:00.000Z',
        timeZone: 'America/Los_Angeles',
        isOpen: false,
        hasGeoLocationPoints: true,
      },
      {
        id: 'no-geo',
        startTime: '2026-01-14T17:30:00.000Z',
        endTime: '2026-01-14T18:45:00.000Z',
        timeZone: 'America/Los_Angeles',
        isOpen: false,
        hasGeoLocationPoints: false,
      },
      {
        id: 'geo-other-day',
        startTime: '2026-01-15T17:30:00.000Z',
        endTime: '2026-01-15T18:45:00.000Z',
        timeZone: 'America/Los_Angeles',
        isOpen: false,
        hasGeoLocationPoints: true,
      },
    ] as TimeTracking_TimeEntry[];

    const result = buildGeoSameDayEntryTimeRangeMapById(
      entries,
      '2026-01-14',
      nowText,
    );

    expect(result).toEqual({
      'geo-same-day': '9:30 AM - 10:45 AM',
    });
  });

  it('returns empty object when sameDayCalendarDate is empty', () => {
    const entries = [
      {
        id: '1',
        startTime: '2026-01-14T17:30:00.000Z',
        endTime: '2026-01-14T18:45:00.000Z',
        timeZone: 'America/Los_Angeles',
        isOpen: false,
        hasGeoLocationPoints: true,
      },
    ] as TimeTracking_TimeEntry[];

    expect(buildGeoSameDayEntryTimeRangeMapById(entries, '', nowText)).toEqual(
      {},
    );
  });

  it('returns empty object when entries array is empty', () => {
    expect(
      buildGeoSameDayEntryTimeRangeMapById([], '2026-01-14', nowText),
    ).toEqual({});
  });

  it('returns empty object when entries is undefined', () => {
    expect(
      buildGeoSameDayEntryTimeRangeMapById(undefined, '2026-01-14', nowText),
    ).toEqual({});
  });

  it('excludes entries where hasGeoLocationPoints is null/undefined', () => {
    const entries = [
      {
        id: 'no-flag',
        startTime: '2026-01-14T17:30:00.000Z',
        endTime: '2026-01-14T18:45:00.000Z',
        timeZone: 'America/Los_Angeles',
        isOpen: false,
        hasGeoLocationPoints: null,
      },
    ] as unknown as TimeTracking_TimeEntry[];

    expect(
      buildGeoSameDayEntryTimeRangeMapById(entries, '2026-01-14', nowText),
    ).toEqual({});
  });

  it('excludes entries with no id', () => {
    const entries = [
      {
        id: '',
        startTime: '2026-01-14T17:30:00.000Z',
        endTime: '2026-01-14T18:45:00.000Z',
        timeZone: 'America/Los_Angeles',
        isOpen: false,
        hasGeoLocationPoints: true,
      },
    ] as TimeTracking_TimeEntry[];

    expect(
      buildGeoSameDayEntryTimeRangeMapById(entries, '2026-01-14', nowText),
    ).toEqual({});
  });
});

describe('getTimeEntryLocalDateForApi', () => {
  it('returns YYYY-MM-DD in the entry timezone', () => {
    const timeEntry = {
      startTime: '2026-01-14T17:30:00.000Z',
      timeZone: 'America/Los_Angeles',
    } as TimeTracking_TimeEntry;

    // 17:30 UTC = 09:30 PST (UTC-8) → still Jan 14
    expect(getTimeEntryLocalDateForApi(timeEntry)).toBe('2026-01-14');
  });

  it('returns empty string when timeEntry is null', () => {
    expect(getTimeEntryLocalDateForApi(null)).toBe('');
  });

  it('returns empty string when startTime is missing', () => {
    const timeEntry = {
      startTime: null,
      timeZone: 'America/Los_Angeles',
    } as unknown as TimeTracking_TimeEntry;

    expect(getTimeEntryLocalDateForApi(timeEntry)).toBe('');
  });

  it('uses UTC when timeZone is null', () => {
    const timeEntry = {
      startTime: '2026-01-14T17:30:00.000Z',
      timeZone: null,
    } as unknown as TimeTracking_TimeEntry;

    // null timezone falls back to UTC — 17:30 UTC is still Jan 14
    const result = getTimeEntryLocalDateForApi(timeEntry);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getTotalHoursFromLocationPoints', () => {
  describe('closed time entries', () => {
    it('should format hours and minutes correctly', () => {
      const timeEntry = {
        duration: 5700, // 1 hour 35 minutes
        isOpen: false,
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      expect(result).toBe('1h 35m');
    });

    it('should format only hours when minutes are zero', () => {
      const timeEntry = {
        duration: 7200, // 2 hours
        isOpen: false,
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      expect(result).toBe('2h');
    });

    it('should format only minutes when less than an hour', () => {
      const timeEntry = {
        duration: 2100, // 35 minutes
        isOpen: false,
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      expect(result).toBe('35m');
    });

    it('should return empty string when duration is null', () => {
      const timeEntry = {
        duration: null,
        isOpen: false,
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      expect(result).toBe('');
    });

    it('should return "0m" when duration is zero', () => {
      const timeEntry = {
        duration: 0,
        isOpen: false,
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      expect(result).toBe('0m');
    });

    it('should return "0m" when duration results in zero hours and zero minutes (edge case)', () => {
      // This covers the final return statement when duration > 0 but both hours and minutes are 0
      // This shouldn't happen in practice, but tests the defensive code path
      const timeEntry = {
        duration: 30, // Less than 60 seconds, so hours=0 and minutes=0
        isOpen: false,
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      // Since we now pass showZero=true, it should return "0m" when both are 0
      expect(result).toBe('0m');
    });
  });

  describe('open time entries', () => {
    it('should calculate elapsed time from startTime to now', () => {
      // Current time in mock is '2026-01-14T17:30:00.000Z'
      // Start time 1 hour 35 minutes earlier: '2026-01-14T15:55:00.000Z'
      const timeEntry = {
        isOpen: true,
        startTime: '2026-01-14T15:55:00.000Z',
        timeZone: 'America/Los_Angeles',
        duration: null,
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      expect(result).toBe('1h 35m');
    });

    it('should show "0m" for just-started open entries', () => {
      // Current time in mock is '2026-01-14T17:30:00.000Z'
      // Start time same as current time
      const timeEntry = {
        isOpen: true,
        startTime: '2026-01-14T17:30:00.000Z',
        timeZone: 'America/Los_Angeles',
        duration: null,
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      expect(result).toBe('0m');
    });

    it('should calculate hours only for open entries', () => {
      // Current time in mock is '2026-01-14T17:30:00.000Z'
      // Start time 2 hours earlier: '2026-01-14T15:30:00.000Z'
      const timeEntry = {
        isOpen: true,
        startTime: '2026-01-14T15:30:00.000Z',
        timeZone: 'America/Los_Angeles',
        duration: null,
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      expect(result).toBe('2h');
    });

    it('should calculate minutes only for open entries less than an hour', () => {
      // Current time in mock is '2026-01-14T17:30:00.000Z'
      // Start time 35 minutes earlier: '2026-01-14T16:55:00.000Z'
      const timeEntry = {
        isOpen: true,
        startTime: '2026-01-14T16:55:00.000Z',
        timeZone: 'America/Los_Angeles',
        duration: null,
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      expect(result).toBe('35m');
    });
  });

  describe('edge cases', () => {
    it('should return empty string when timeEntry is null', () => {
      const result = getTotalHoursFromLocationPoints(null);
      expect(result).toBe('');
    });

    it('should use closed entry logic when isOpen is false even if startTime exists', () => {
      const timeEntry = {
        isOpen: false,
        startTime: '2026-01-14T15:55:00.000Z',
        duration: 7200, // 2 hours
        timeZone: 'America/Los_Angeles',
      } as unknown as TimeTracking_TimeEntry;

      const result = getTotalHoursFromLocationPoints(timeEntry);
      expect(result).toBe('2h'); // Uses duration, not calculation
    });
  });
});

describe('getCustomerInfo', () => {
  it('should extract customer fullName when both customer and project are available', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: {
          id: '105',
          displayName: 'Project Display Name',
          fullName: 'Project Full Name',
        },
        customer: {
          id: '104',
          displayName: 'Customer Display Name',
          fullName: 'Customer Full Name',
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: 'Customer Full Name', id: '104' });
  });

  it('should extract customer info when both customer and project exist', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: {
          id: '105',
          fullName: 'Test Project',
        },
        customer: {
          id: '104',
          fullName: 'Test Customer',
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: 'Test Customer', id: '104' });
  });

  it('should extract customer fullName when both fullName and displayName exist', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: {
          id: '105',
          fullName: 'Test Project',
        },
        customer: {
          id: '104',
          fullName: 'Test Customer',
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: 'Test Customer', id: '104' });
  });

  it('should fallback to displayName when fullName is not available', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: null,
        customer: {
          id: '104',
          displayName: 'Customer Display Name',
          fullName: null,
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: 'Customer Display Name', id: '104' });
  });

  it('should extract project fullName when only project exists (no customer)', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: {
          id: '105',
          displayName: 'Project Display Name',
          fullName: 'Test Project',
        },
        customer: null,
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: 'Test Project', id: '105' });
  });

  it('should extract customer fullName when only customer exists', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: null,
        customer: {
          id: '104',
          displayName: 'Customer Display Name',
          fullName: 'Customer Full Name',
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: 'Customer Full Name', id: '104' });
  });

  it('should extract customer info when only customer exists', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: null,
        customer: {
          id: '104',
          fullName: 'Test Customer',
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: 'Test Customer', id: '104' });
  });

  it('should fallback to customer fullName when displayName is not available', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: null,
        customer: {
          id: '104',
          fullName: 'Test Customer',
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: 'Test Customer', id: '104' });
  });

  it('should return empty values when timeAgainstContactDAS is null', () => {
    const timeEntry = {
      timeAgainstContactDAS: null,
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: '', id: '' });
  });

  it('should return empty values when timeEntry is null', () => {
    const result = getCustomerInfo(null);
    expect(result).toEqual({ name: '', id: '' });
  });

  it('should return empty values when both project and customer are null', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: null,
        customer: null,
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: '', id: '' });
  });

  it('should handle project with null displayName and fullName', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: {
          id: '105',
          displayName: null,
          fullName: null,
        },
        customer: null,
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: '', id: '105' });
  });

  it('should handle customer with null displayName and fullName', () => {
    const timeEntry = {
      timeAgainstContactDAS: {
        project: null,
        customer: {
          id: '104',
          displayName: null,
          fullName: null,
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    const result = getCustomerInfo(timeEntry);
    expect(result).toEqual({ name: '', id: '104' });
  });
});

describe('formatTimeEntryTimestamp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format timestamp correctly with timezone', () => {
    const timestamp = '2026-01-14T17:30:00.000Z';
    const timezone = 'America/Los_Angeles';

    const result = formatTimeEntryTimestamp(timestamp, timezone);
    expect(result).toBe('9:30 AM');
  });

  it('should handle null timezone', () => {
    const timestamp = '2026-01-14T17:30:00.000Z';
    const timezone = null;

    const result = formatTimeEntryTimestamp(timestamp, timezone);
    // When timezone is null, it uses UTC, so 17:30 UTC = 5:30 PM UTC
    expect(result).toBe('5:30 PM');
  });

  it('should handle undefined timezone', () => {
    const timestamp = '2026-01-14T17:30:00.000Z';
    const timezone = undefined;

    const result = formatTimeEntryTimestamp(timestamp, timezone);
    // When timezone is undefined, it uses UTC, so 17:30 UTC = 5:30 PM UTC
    expect(result).toBe('5:30 PM');
  });

  it('should return empty string when timestamp is null', () => {
    const timestamp = null;
    const timezone = 'America/Los_Angeles';

    const result = formatTimeEntryTimestamp(timestamp, timezone);
    expect(result).toBe('');
  });

  it('should return empty string when timestamp is undefined', () => {
    const timestamp = undefined;
    const timezone = 'America/Los_Angeles';

    const result = formatTimeEntryTimestamp(timestamp, timezone);
    expect(result).toBe('');
  });

  it('should return empty string when timestamp is empty string', () => {
    const timestamp = '';
    const timezone = 'America/Los_Angeles';

    const result = formatTimeEntryTimestamp(timestamp, timezone);
    expect(result).toBe('');
  });
});

describe('mapLocationPointsToTimeline', () => {
  it('should map location points to timeline format and extract time only', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '14 Jan 2026, 9:30 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '14 Jan 2026, 10:45 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.388,
        lng: -122.086,
        timestamp: '14 Jan 2026, 11:00 AM',
        accuracy: '10m',
        teamMemberName: 'John Doe',
      },
    ];

    const result = mapLocationPointsToTimeline(locationPoints);
    expect(result).toEqual([
      { id: 'location-0', time: '9:30 AM' },
      { id: 'location-1', time: '10:45 AM' },
      { id: 'location-2', time: '11:00 AM' },
    ]);
  });

  it('should handle empty array', () => {
    const result = mapLocationPointsToTimeline([]);
    expect(result).toEqual([]);
  });

  it('should generate sequential IDs for multiple points', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '14 Jan 2026, 9:30 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '14 Jan 2026, 10:45 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
      },
    ];

    const result = mapLocationPointsToTimeline(locationPoints);
    expect(result[0].id).toBe('location-0');
    expect(result[1].id).toBe('location-1');
  });

  it('should extract time portion from formatted timestamp', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '29 Jan 2026, 6:42 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
    ];

    const result = mapLocationPointsToTimeline(locationPoints);
    expect(result[0].time).toBe('6:42 AM');
  });

  it('should handle timestamp without date (time only)', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '9:30 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
    ];

    const result = mapLocationPointsToTimeline(locationPoints);
    expect(result[0].time).toBe('9:30 AM');
  });

  it('should handle empty timestamp', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
    ];

    const result = mapLocationPointsToTimeline(locationPoints);
    expect(result[0].time).toBe('');
  });
});

describe('extractTimeFromFormattedTimestamp', () => {
  it('should extract time portion from formatted timestamp', () => {
    const formattedTimestamp = '14 Jan 2026, 9:30 AM';
    const result = extractTimeFromFormattedTimestamp(formattedTimestamp);
    expect(result).toBe('9:30 AM');
  });

  it('should extract time portion with PM', () => {
    const formattedTimestamp = '14 Jan 2026, 5:30 PM';
    const result = extractTimeFromFormattedTimestamp(formattedTimestamp);
    expect(result).toBe('5:30 PM');
  });

  it('should return empty string for empty input', () => {
    const result = extractTimeFromFormattedTimestamp('');
    expect(result).toBe('');
  });

  it('should return empty string for null input', () => {
    const result = extractTimeFromFormattedTimestamp(null as any);
    expect(result).toBe('');
  });

  it('should return empty string for undefined input', () => {
    const result = extractTimeFromFormattedTimestamp(undefined as any);
    expect(result).toBe('');
  });

  it('should return original string if format does not match', () => {
    const formattedTimestamp = '9:30 AM';
    const result = extractTimeFromFormattedTimestamp(formattedTimestamp);
    expect(result).toBe('9:30 AM');
  });

  it('should handle timestamp without comma', () => {
    const formattedTimestamp = '9:30 AM';
    const result = extractTimeFromFormattedTimestamp(formattedTimestamp);
    expect(result).toBe('9:30 AM');
  });
});

describe('getClockInOutTimes', () => {
  it('should extract clock in and clock out times from location points', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '14 Jan 2026, 9:30 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '14 Jan 2026, 10:45 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.388,
        lng: -122.086,
        timestamp: '14 Jan 2026, 5:30 PM',
        accuracy: '10m',
        teamMemberName: 'John Doe',
      },
    ];

    const result = getClockInOutTimes(locationPoints);
    expect(result).toEqual({
      clockInTime: '9:30 AM',
      clockOutTime: '5:30 PM',
    });
  });

  it('should return empty strings for empty location points array', () => {
    const result = getClockInOutTimes([]);
    expect(result).toEqual({
      clockInTime: '',
      clockOutTime: '',
    });
  });

  it('should return same time for clock in and clock out when only one point exists', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '14 Jan 2026, 9:30 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
    ];

    const result = getClockInOutTimes(locationPoints);
    expect(result).toEqual({
      clockInTime: '9:30 AM',
      clockOutTime: '9:30 AM',
    });
  });

  it('should handle location points with empty timestamps', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '14 Jan 2026, 5:30 PM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
      },
    ];

    const result = getClockInOutTimes(locationPoints);
    expect(result).toEqual({
      clockInTime: '',
      clockOutTime: '5:30 PM',
    });
  });

  it('should handle location points with timestamps that do not match expected format', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '9:30 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '5:30 PM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
      },
    ];

    const result = getClockInOutTimes(locationPoints);
    expect(result).toEqual({
      clockInTime: '9:30 AM',
      clockOutTime: '5:30 PM',
    });
  });
});

describe('getActiveDeviceFlagKeys', () => {
  it('should return an empty array when deviceAttributes is null', () => {
    expect(getActiveDeviceFlagKeys(null)).toEqual([]);
  });

  it('should return an empty array when deviceAttributes is undefined', () => {
    expect(getActiveDeviceFlagKeys(undefined)).toEqual([]);
  });

  it('should return an empty array when all flags are false', () => {
    const deviceAttributes: TimeTracking_TimeEntryDeviceAttributes = {
      leftGeofence: false,
      loggedOutOnClock: false,
      locationNotShared: false,
      lowBattery: false,
      batterySaverEnabled: false,
      mockedLocation: false,
    };
    expect(getActiveDeviceFlagKeys(deviceAttributes)).toEqual([]);
  });

  it('should return an empty array when all flags are null/undefined', () => {
    expect(getActiveDeviceFlagKeys({})).toEqual([]);
  });

  it('should return a single active flag key', () => {
    const deviceAttributes: TimeTracking_TimeEntryDeviceAttributes = {
      mockedLocation: true,
    };
    expect(getActiveDeviceFlagKeys(deviceAttributes)).toEqual([
      'mockedLocation',
    ]);
  });

  it('should return all six active flag keys in fixed declaration order regardless of input key order', () => {
    // Deliberately declared out of order to prove the return order is fixed, not input order
    const deviceAttributes: TimeTracking_TimeEntryDeviceAttributes = {
      mockedLocation: true,
      leftGeofence: true,
      batterySaverEnabled: true,
      lowBattery: true,
      locationNotShared: true,
      loggedOutOnClock: true,
    };
    expect(getActiveDeviceFlagKeys(deviceAttributes)).toEqual([
      'leftGeofence',
      'loggedOutOnClock',
      'locationNotShared',
      'lowBattery',
      'batterySaverEnabled',
      'mockedLocation',
    ]);
  });

  it('should return only the true flags in fixed order when some are true and some are false', () => {
    const deviceAttributes: TimeTracking_TimeEntryDeviceAttributes = {
      leftGeofence: false,
      loggedOutOnClock: true,
      locationNotShared: true,
      lowBattery: false,
      batterySaverEnabled: false,
      mockedLocation: true,
    };
    expect(getActiveDeviceFlagKeys(deviceAttributes)).toEqual([
      'loggedOutOnClock',
      'locationNotShared',
      'mockedLocation',
    ]);
  });

  it('locationNotShared should be returned before mockedLocation and lowBattery when all three are true (fixed order, not input order)', () => {
    const deviceAttributes: TimeTracking_TimeEntryDeviceAttributes = {
      locationNotShared: true,
      mockedLocation: true,
      lowBattery: true,
    };
    expect(getActiveDeviceFlagKeys(deviceAttributes)).toEqual([
      'locationNotShared',
      'lowBattery',
      'mockedLocation',
    ]);
  });
});

describe('getFirstDeviceNote', () => {
  it('should return null when deviceAttributes is null', () => {
    expect(getFirstDeviceNote(null)).toBeNull();
  });

  it('should return null when deviceAttributes is undefined', () => {
    expect(getFirstDeviceNote(undefined)).toBeNull();
  });

  it('should return null when notes is undefined', () => {
    expect(getFirstDeviceNote({ mockedLocation: true })).toBeNull();
  });

  it('should return null when notes is an empty array', () => {
    expect(getFirstDeviceNote({ mockedLocation: true, notes: [] })).toBeNull();
  });

  it('should return the first note when notes has one entry', () => {
    expect(
      getFirstDeviceNote({
        mockedLocation: true,
        notes: ['Phone has a mock location app turned on.'],
      }),
    ).toBe('Phone has a mock location app turned on.');
  });

  it('should return only the first note when notes has multiple entries', () => {
    expect(
      getFirstDeviceNote({
        mockedLocation: true,
        leftGeofence: true,
        notes: ['First note', 'Second note', 'Third note'],
      }),
    ).toBe('First note');
  });

  it('should return null when the first note entry is itself null', () => {
    expect(
      getFirstDeviceNote({
        mockedLocation: true,
        notes: [null as unknown as string],
      }),
    ).toBeNull();
  });
});

describe('truncateDeviceNote', () => {
  it('should return the original string unchanged when at or under the truncate length', () => {
    const note = 'a'.repeat(DEVICE_NOTE_TRUNCATE_LENGTH);
    expect(truncateDeviceNote(note)).toBe(note);
  });

  it('should return the original string unchanged when well under the truncate length', () => {
    const note = 'Short note.';
    expect(truncateDeviceNote(note)).toBe(note);
  });

  it('should return the original string unchanged for an empty string', () => {
    expect(truncateDeviceNote('')).toBe('');
  });

  it('should truncate and append an ellipsis when the note exceeds the truncate length', () => {
    const note = 'a'.repeat(DEVICE_NOTE_TRUNCATE_LENGTH + 1);
    const result = truncateDeviceNote(note);
    expect(result).toBe(`${'a'.repeat(DEVICE_NOTE_TRUNCATE_LENGTH)}...`);
    expect(result.length).toBe(DEVICE_NOTE_TRUNCATE_LENGTH + 3);
  });

  it('should truncate a very long note to exactly the truncate length plus ellipsis', () => {
    const note = 'b'.repeat(4000);
    const result = truncateDeviceNote(note);
    expect(result).toHaveLength(DEVICE_NOTE_TRUNCATE_LENGTH + 3);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('getEntryLevelDeviceFlagKeys', () => {
  it('should return an empty array for an empty location points array', () => {
    expect(getEntryLevelDeviceFlagKeys([])).toEqual([]);
  });

  it('should return an empty array when no points have deviceAttributes', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '9:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '5:00 PM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
      },
    ];
    expect(getEntryLevelDeviceFlagKeys(locationPoints)).toEqual([]);
  });

  it('should return an empty array when all points have deviceAttributes with all flags false', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '9:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
        deviceAttributes: { mockedLocation: false, leftGeofence: false },
      },
    ];
    expect(getEntryLevelDeviceFlagKeys(locationPoints)).toEqual([]);
  });

  it('should return the flag keys from a single point', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '9:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
        deviceAttributes: { mockedLocation: true },
      },
    ];
    expect(getEntryLevelDeviceFlagKeys(locationPoints)).toEqual([
      'mockedLocation',
    ]);
  });

  it('should union distinct flags across multiple points, in fixed order', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '9:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
        deviceAttributes: { mockedLocation: true },
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '10:00 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
        deviceAttributes: { leftGeofence: true },
      },
      {
        lat: 37.388,
        lng: -122.086,
        timestamp: '5:00 PM',
        accuracy: '10m',
        teamMemberName: 'John Doe',
        deviceAttributes: { locationNotShared: true },
      },
    ];
    expect(getEntryLevelDeviceFlagKeys(locationPoints)).toEqual([
      'leftGeofence',
      'locationNotShared',
      'mockedLocation',
    ]);
  });

  it('should dedupe the same flag appearing on multiple points', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '9:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
        deviceAttributes: { mockedLocation: true },
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '10:00 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
        deviceAttributes: { mockedLocation: true },
      },
    ];
    expect(getEntryLevelDeviceFlagKeys(locationPoints)).toEqual([
      'mockedLocation',
    ]);
  });

  it('should treat points with null deviceAttributes as having no flags', () => {
    const locationPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '9:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
        deviceAttributes: null,
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '10:00 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
        deviceAttributes: { batterySaverEnabled: true },
      },
    ];
    expect(getEntryLevelDeviceFlagKeys(locationPoints)).toEqual([
      'batterySaverEnabled',
    ]);
  });

  it('should return all six flag keys in fixed order when every point contributes a different flag', () => {
    const flagKeysInOrder: Array<keyof TimeTracking_TimeEntryDeviceAttributes> =
      [
        'mockedLocation',
        'leftGeofence',
        'batterySaverEnabled',
        'lowBattery',
        'locationNotShared',
        'loggedOutOnClock',
      ];
    const locationPoints: LocationPointData[] = flagKeysInOrder.map(
      (key, index) => ({
        lat: 37.386 + index,
        lng: -122.084 - index,
        timestamp: `${9 + index}:00 AM`,
        accuracy: '15m',
        teamMemberName: 'John Doe',
        deviceAttributes: { [key]: true },
      }),
    );
    expect(getEntryLevelDeviceFlagKeys(locationPoints)).toEqual([
      'leftGeofence',
      'loggedOutOnClock',
      'locationNotShared',
      'lowBattery',
      'batterySaverEnabled',
      'mockedLocation',
    ]);
  });
});
