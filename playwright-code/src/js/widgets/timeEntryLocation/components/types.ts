import { TimeTracking_TimeEntryDeviceAttributes } from 'src/__generated__/timeTracking/graphql';

/**
 * Fixed declaration order for device/geofence flags. "First flag" anywhere in
 * this widget (e.g. the single note shown per point) means the first TRUE
 * flag in this order, not a business-priority ranking.
 */
export const DEVICE_FLAG_ORDER = [
  'leftGeofence',
  'loggedOutOnClock',
  'locationNotShared',
  'lowBattery',
  'batterySaverEnabled',
  'mockedLocation',
] as const;

export type DeviceFlagKey = (typeof DEVICE_FLAG_ORDER)[number];

/** NLS message ids for each device/geofence flag label. */
export const DEVICE_FLAG_LABEL_NLS_ID: Record<DeviceFlagKey, string> = {
  leftGeofence: 'timeEntryLocation.flags.leftGeofence',
  loggedOutOnClock: 'timeEntryLocation.flags.loggedOutOnClock',
  locationNotShared: 'timeEntryLocation.flags.locationNotShared',
  lowBattery: 'timeEntryLocation.flags.lowBattery',
  batterySaverEnabled: 'timeEntryLocation.flags.batterySaverEnabled',
  mockedLocation: 'timeEntryLocation.flags.mockedLocation',
};

export interface LocationPointData {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy: string | null;
  teamMemberName: string | null;
  /** Device/geofence attributes for this point. Only populated when the SBSEG-QBO-geofence-flags feature flag is enabled. */
  deviceAttributes?: TimeTracking_TimeEntryDeviceAttributes | null;
}
