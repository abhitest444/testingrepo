import { TrackingPoint } from 'src/js/common/useClickTracking';

export interface TimeKioskTrackingPoint extends TrackingPoint {}

export interface TimeKioskTrackingPoints {
  [key: string]: TimeKioskTrackingPoint;
}

// const TIME_KIOSK_BASE_CONFIG = {
//   org: 'sbseg',
//   purpose: 'prod',
//   scope: 'time',
//   scope_area: 'kiosk',
//   object: 'component',
// } as const;

// TODO: add tracking points for the time kiosk
