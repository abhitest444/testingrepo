import dayjs from 'dayjs';
import {
  TimeTracking_LocationPoint,
  TimeTracking_TimeEntry,
  TimeTracking_TimeEntryDeviceAttributes,
} from 'src/__generated__/timeTracking/graphql';
import { DataAccess_ContactAddress } from 'src/__generated__/oigql/graphql';
import { mapQBTimezoneToDayjsTimezone } from 'src/js/common/DateAndTimeUtils';
import {
  DEVICE_FLAG_ORDER,
  DeviceFlagKey,
  LocationPointData,
} from '../components/types';

/**
 * Extracts team member name and ID from timeEntry
 * Used for displaying team member info in filters
 * Note: Assumes timeForContactDAS exists (validated in useTimeEntryLocationData)
 *
 * @param timeEntry - Time entry containing team member info
 * @returns Object with name (displayName or fullName) and id
 */
export const getTeamMemberInfo = (
  timeEntry: TimeTracking_TimeEntry | null,
): { name: string; id: string | undefined } => {
  const contact = timeEntry?.timeForContactDAS as {
    id: string;
    displayName?: string;
    fullName?: string;
  };

  // Try displayName first, then fullName
  const name = contact?.displayName || contact?.fullName || '';
  const id = contact?.id;

  return { name, id };
};

/**
 * Extracts customer/project name and ID from timeEntry
 * Used for displaying customer/project info in filters
 * Prioritizes project over customer (project takes precedence)
 *
 * @param timeEntry - Time entry containing customer/project info
 * @returns Object with name (displayName or fullName) and id, or empty values if not found
 */
export const getCustomerInfo = (
  timeEntry: TimeTracking_TimeEntry | null,
): { name: string; id: string | undefined } => {
  if (!timeEntry?.timeAgainstContactDAS) {
    return { name: '', id: '' };
  }

  // Type assertion to access fields returned by query but not in stub types
  const timeAgainst = timeEntry.timeAgainstContactDAS as {
    project?: {
      id: string;
      displayName?: string | null;
      fullName?: string | null;
    } | null;
    customer?: {
      id: string;
      displayName?: string | null;
      fullName?: string | null;
    } | null;
  };

  // Check customer first (takes precedence), then project
  // Even for projects, the names and details are stored in the customer object.
  const contact = timeAgainst.customer || timeAgainst.project;

  if (!contact) {
    return { name: '', id: '' };
  }

  // Try fullName first, then displayName
  const name = contact.fullName || contact.displayName || '';
  const { id } = contact;

  return { name, id };
};

/**
 * Extracts time entry range from timeEntry startTime and endTime
 * Used for displaying the time range in filters
 *
 * @param timeEntry - Time entry containing startTime and endTime
 * @returns Formatted time range string (e.g., "9:30 AM - 10:45 AM") or empty string
 */
export const getTimeEntryRange = (
  timeEntry: TimeTracking_TimeEntry | null,
  nowText: string,
): string => {
  // Return empty if no startTime
  if (!timeEntry?.startTime) {
    return '';
  }

  const startTime = formatTimeEntryTimestamp(
    timeEntry.startTime,
    timeEntry.timeZone,
  );

  // Currently, duration time entries dont come with location details generally
  // but incase it is made a feature in future, we wont show start or end time in that case.
  if (!startTime) {
    return '';
  }

  // If time entry is open/active - show "startTime - Now"
  if (timeEntry.isOpen) {
    return `${startTime} - ${nowText}`;
  }

  // If time entry is not open and there is startTime there will always be an endTime
  const endTime = formatTimeEntryTimestamp(
    timeEntry.endTime,
    timeEntry.timeZone,
  );

  return `${startTime} - ${endTime}`;
};

/**
 * Helper function to format duration in seconds to "Xh Ym" format
 * @param durationInSeconds - Duration in seconds
 * @param showZero - Whether to show "0m" for zero duration (default: false)
 * @returns Formatted string like "2h 30m", "45m", "3h", or ""
 */
const formatDuration = (
  durationInSeconds: number,
  showZero = false,
): string => {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return showZero ? '0m' : '';
};

/**
 * Calculates total hours from timeEntry (time difference between startTime and endTime)
 * Used for displaying total hours in filters
 *
 * @param timeEntry - Time entry containing startTime and endTime
 * @returns Formatted duration string (e.g., "1h 35m") or empty string
 */
export const getTotalHoursFromLocationPoints = (
  timeEntry: TimeTracking_TimeEntry | null,
): string => {
  if (!timeEntry) {
    return '';
  }

  // For open time entries, calculate elapsed time from startTime to now
  if (timeEntry.isOpen && timeEntry.startTime) {
    const dayjsTimezone = mapQBTimezoneToDayjsTimezone(timeEntry.timeZone);
    const startTime = dayjs(timeEntry.startTime).tz(dayjsTimezone);
    const now = dayjs().tz(dayjsTimezone);
    const diffInSeconds = now.diff(startTime, 'second');

    return formatDuration(diffInSeconds, true);
  }

  // For closed time entries, use the duration field
  return timeEntry.duration != null
    ? formatDuration(timeEntry.duration, true)
    : '';
};

/**
 * Cleans address field by removing newlines and trimming whitespace
 *
 * @param value - Address field value (lines, city, state, postalCode)
 * @returns Cleaned string or empty string if value is falsy/empty after cleaning
 */
const cleanAddressField = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }
  return value.replace(/\n/g, ' ').trim();
};

/**
 * Formats address from timeEntry customer/project address
 * Uses shippingAddress first, falls back to primaryAddress if shippingAddress is not available
 * Combines lines, city, state, and postalCode separated by commas
 * Removes any \n characters and trims whitespace from all fields
 *
 * @param timeEntry - Time entry containing customer/project address info
 * @returns Formatted address string or empty string if no address data
 */
export const getFormattedAddress = (
  timeEntry: TimeTracking_TimeEntry | null,
): string => {
  if (!timeEntry?.timeAgainstContactDAS) {
    return '';
  }

  // Type assertion to access fields returned by query but not in stub types
  // Apollo Client cache merge policies preserve these fields at runtime
  // Using DataAccess_ContactAddress from oigql schema which has the proper address structure
  const timeAgainst = timeEntry.timeAgainstContactDAS as {
    project?: {
      id: string;
      primaryAddress?: DataAccess_ContactAddress | null;
      shippingAddress?: DataAccess_ContactAddress | null;
    } | null;
    customer?: {
      id: string;
      primaryAddress?: DataAccess_ContactAddress | null;
      shippingAddress?: DataAccess_ContactAddress | null;
    } | null;
  };

  // Check project first (takes precedence), then customer
  const contact = timeAgainst.project || timeAgainst.customer;

  if (!contact) {
    return '';
  }

  // Use shippingAddress first, fallback to primaryAddress
  const address = contact.shippingAddress || contact.primaryAddress;

  if (!address) {
    return '';
  }

  const { lines, city, state, postalCode } = address;

  // Clean and validate all address fields, filter out empty values
  const addressParts = [lines, city, state, postalCode]
    .map((field) => cleanAddressField(field))
    .filter((cleaned) => cleaned.length > 0);

  return addressParts.length > 0 ? addressParts.join(', ') : '';
};

/**
 * Formats a time entry timestamp to display format
 * Used for clock in/out times in timeline
 *
 * @param timestamp - ISO timestamp string
 * @param timezone - QB timezone code
 * @returns Formatted time string (e.g., "9:30 AM") or empty string
 */
export const formatTimeEntryTimestamp = (
  timestamp: string | null | undefined,
  timezone: string | null | undefined,
): string => {
  if (!timestamp) {
    return '';
  }

  const dayjsTimezone = mapQBTimezoneToDayjsTimezone(timezone);
  return dayjs(timestamp).tz(dayjsTimezone).format('h:mm A');
};

/**
 * Calendar date (YYYY-MM-DD) for the entry in its time zone — same clock as
 * {@link getTimeEntryRange} / {@link formatTimeEntryTimestamp}. For searchTimeEntries date filter.
 */
export const getTimeEntryLocalDateForApi = (
  timeEntry: TimeTracking_TimeEntry | null,
): string => {
  if (!timeEntry?.startTime) {
    return '';
  }
  const dayjsTimezone = mapQBTimezoneToDayjsTimezone(timeEntry.timeZone);
  return dayjs(timeEntry.startTime).tz(dayjsTimezone).format('YYYY-MM-DD');
};

/**
 * Map of time entry id → localized start–end range (via {@link getTimeEntryRange})
 * for entries with `hasGeoLocationPoints === true` whose local calendar date equals
 * `sameDayCalendarDate` (per {@link getTimeEntryLocalDateForApi}, same clock as the search date filter).
 */
export const buildGeoSameDayEntryTimeRangeMapById = (
  entries: TimeTracking_TimeEntry[] | undefined,
  sameDayCalendarDate: string,
  nowLabel: string,
): Record<string, string> => {
  if (!entries?.length || !sameDayCalendarDate) {
    return {};
  }
  return entries.reduce<Record<string, string>>((acc, entry) => {
    if (!entry.id || entry.hasGeoLocationPoints !== true) {
      return acc;
    }

    const entryLocalDate = getTimeEntryLocalDateForApi(entry);
    if (entryLocalDate !== sameDayCalendarDate) {
      return acc;
    }

    const range = getTimeEntryRange(entry, nowLabel);
    if (range) {
      acc[entry.id] = range;
    }
    return acc;
  }, {});
};

/**
 * Extracts time portion from a formatted timestamp string
 * Used for extracting clock in/out times from location point timestamps
 *
 * @param formattedTimestamp - Formatted timestamp string (e.g., "14 Jan 2026, 9:30 AM")
 * @returns Time portion (e.g., "9:30 AM") or original string if format doesn't match
 */
export const extractTimeFromFormattedTimestamp = (
  formattedTimestamp: string,
): string => {
  if (!formattedTimestamp) {
    return '';
  }
  // Extract time portion from formatted timestamp (format: "D MMM YYYY, h:mm A")
  // Example: "14 Jan 2026, 9:30 AM" -> "9:30 AM"
  const timeMatch = formattedTimestamp.match(/,\s*(.+)$/);
  return timeMatch ? timeMatch[1] : formattedTimestamp;
};

/**
 * Extracts clock in and clock out times from location points
 * First location point = clock in time, last location point = clock out time
 *
 * @param locationPoints - Array of location points with formatted timestamps
 * @returns Object with clockInTime and clockOutTime (e.g., "9:30 AM")
 */
export const getClockInOutTimes = (
  locationPoints: LocationPointData[],
): { clockInTime: string; clockOutTime: string } => {
  if (locationPoints.length === 0) {
    return { clockInTime: '', clockOutTime: '' };
  }

  const clockInTime = extractTimeFromFormattedTimestamp(
    locationPoints[0].timestamp,
  );
  const clockOutTime = extractTimeFromFormattedTimestamp(
    locationPoints[locationPoints.length - 1].timestamp,
  );

  return { clockInTime, clockOutTime };
};

/**
 * Transforms LocationPointData to timeline location points format
 * Used for displaying location points in the timeline
 *
 * @param locationPoints - Formatted location points
 * @returns Location points in time format
 */
export interface TimelinePoint {
  id: string;
  time: string;
  deviceAttributes?: TimeTracking_TimeEntryDeviceAttributes | null;
}

export const mapLocationPointsToTimeline = (
  locationPoints: LocationPointData[],
): TimelinePoint[] =>
  locationPoints.map((point, index) => ({
    id: `location-${index}`,
    time: extractTimeFromFormattedTimestamp(point.timestamp),
    deviceAttributes: point.deviceAttributes,
  }));

/**
 * Maps API location points to display format with timezone-formatted timestamps
 * Extracts timezone and team member name from time entry
 * Formats timestamps once in HOC so both children can use them
 *
 * @param apiPoints - Location points from API
 * @param timeEntry - Time entry containing timezone and team member info
 * @returns Formatted location points ready for display
 */
export const mapLocationPointsToDisplayData = (
  apiPoints: TimeTracking_LocationPoint[],
  timeEntry: TimeTracking_TimeEntry | null,
): LocationPointData[] => {
  // Extract timezone from time entry
  const dayjsTimezone = mapQBTimezoneToDayjsTimezone(timeEntry?.timeZone);

  // Extract team member name from timeForContactDAS
  const timeForContact = timeEntry?.timeForContactDAS as {
    displayName?: string;
    fullName?: string;
  } | null;
  const teamMemberName =
    timeForContact?.displayName ?? timeForContact?.fullName ?? null;

  return apiPoints.map((point) => ({
    lat: point.latitude ?? 0,
    lng: point.longitude ?? 0,
    timestamp: point.createdAt
      ? dayjs(point.createdAt).tz(dayjsTimezone).format('D MMM YYYY, h:mm A')
      : '',
    accuracy: point.accuracy ? `${point.accuracy}m` : null,
    teamMemberName,
    deviceAttributes: point.deviceAttributes ?? null,
  }));
};

/**
 * Returns the TRUE device/geofence flag keys for a single point's
 * deviceAttributes, in the fixed DEVICE_FLAG_ORDER.
 *
 * @param deviceAttributes - Device attributes for a single location point
 * @returns Active flag keys, in fixed order
 */
export const getActiveDeviceFlagKeys = (
  deviceAttributes: TimeTracking_TimeEntryDeviceAttributes | null | undefined,
): DeviceFlagKey[] =>
  DEVICE_FLAG_ORDER.filter((key) => !!deviceAttributes?.[key]);

/**
 * Whether a point has any active device/geofence flag, gated by the
 * SBSEG-QBO-geofence-flags feature flag. Centralizes the
 * `isEnabled && getActiveDeviceFlagKeys(...).length > 0` check repeated across
 * marker-color call sites.
 *
 * @param deviceAttributes - Device attributes for a single location point
 * @param isGeofenceFlagsEnabled - Whether the feature flag is enabled
 * @returns true only when the flag is enabled and the point has an active flag
 */
export const hasActiveDeviceFlags = (
  deviceAttributes: TimeTracking_TimeEntryDeviceAttributes | null | undefined,
  isGeofenceFlagsEnabled: boolean | undefined,
): boolean =>
  !!isGeofenceFlagsEnabled &&
  getActiveDeviceFlagKeys(deviceAttributes).length > 0;

/**
 * Returns the first note attached to a point's active flags, or null.
 * Only the first note is ever shown, regardless of how many exist.
 *
 * @param deviceAttributes - Device attributes for a single location point
 * @returns First note string, or null if none
 */
export const getFirstDeviceNote = (
  deviceAttributes: TimeTracking_TimeEntryDeviceAttributes | null | undefined,
): string | null => deviceAttributes?.notes?.[0] ?? null;

/** Character length at which a device note is truncated with a show more/less toggle. */
export const DEVICE_NOTE_TRUNCATE_LENGTH = 100;

/**
 * Truncates a device note to DEVICE_NOTE_TRUNCATE_LENGTH characters with an
 * ellipsis, only when it exceeds that length.
 *
 * @param note - Full note text
 * @returns Truncated text with ellipsis, or the original text if short enough
 */
export const truncateDeviceNote = (note: string): string =>
  note.length > DEVICE_NOTE_TRUNCATE_LENGTH
    ? `${note.slice(0, DEVICE_NOTE_TRUNCATE_LENGTH)}...`
    : note;

/**
 * Returns the union of active device/geofence flag keys across all location
 * points for a time entry, deduped and in the fixed DEVICE_FLAG_ORDER.
 * Used for the entry-level "Timesheet flags" summary.
 *
 * @param locationPoints - Formatted location points for the entry
 * @returns Distinct active flag keys across all points, in fixed order
 */
export const getEntryLevelDeviceFlagKeys = (
  locationPoints: LocationPointData[],
): DeviceFlagKey[] => {
  const activeKeys = new Set<DeviceFlagKey>();
  locationPoints.forEach((point) => {
    getActiveDeviceFlagKeys(point.deviceAttributes).forEach((key) =>
      activeKeys.add(key),
    );
  });
  return DEVICE_FLAG_ORDER.filter((key) => activeKeys.has(key));
};
