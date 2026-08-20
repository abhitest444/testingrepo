/**
 * Google Maps styles configuration for timesheet location tracking
 * Essential labels for admin timesheet review:
 * - Road labels: Street names for route verification
 * - POI business labels: Business names where employees worked
 * - Administrative labels: City/neighborhood context
 */
export const TIMESHEET_MAP_STYLES = [
  // Road labels - CRITICAL: Admins need street names to verify routes
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
  // POI business labels - CRITICAL: Shows where employees were working
  {
    featureType: 'poi.business',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
  // Administrative labels - IMPORTANT: Geographic context
  {
    featureType: 'administrative.locality',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
];

// Default map configuration
export const US_CENTER = { lat: 39.8097343, lng: -98.5556199 };
export const ZOOM_DEFAULT = 4;
export const ZOOM_MAX = 17;

// Map type constants
export type MapType = 'roadmap' | 'satellite';

// Map toggle options for UI
export const MAP_TOGGLE_OPTIONS = [
  { label: 'Map', value: 'roadmap' },
  { label: 'Satellite', value: 'satellite' },
];

// Convert map type to tracking view value
export const getMapViewForTracking = (mapType: MapType): string =>
  mapType === 'roadmap' ? 'map' : 'satellite';
