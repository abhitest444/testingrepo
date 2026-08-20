import {
  ShippingAddress,
  TimeAgainstAssignmentSummaryEdge,
} from 'src/js/service/types/assignmentTypes';
import { GeofenceConfigurationNode } from 'src/js/service/hooks/assignments/useGeofenceConfiguration';

export interface GeofenceCustomerData {
  entityId: string;
  customerName: string;
  customerAddress: string;
  geofenceEnabled: boolean;
  geofenceEnabledVersion: string | null;
  geofenceLocation: {
    latitude: number | null;
    longitude: number | null;
    radiusInMeters: number;
  } | null;
  geofenceLocationVersion: string | null;
}

export type GeofenceConfigMap = Record<string, GeofenceCustomerData>;

export interface GeofenceAddressFields {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

/**
 * Maps Google Geocoder address components to the address fields expected by
 * `TimeTracking_UpdateGeofenceLocationInput`.
 *
 * Mapping:
 *  locality            (long_name)  → city
 *  subpremise          (short_name) → address2
 *  administrative_area_level_1 (short_name) → state
 *  country             (short_name) → country
 *  street_number + route (short_name, combined) → address1
 *  postal_code         (short_name) → zipCode
 */
export const extractGeofenceAddressFields = (
  addressComponents: google.maps.GeocoderAddressComponent[],
): GeofenceAddressFields => {
  const find = (type: string, nameKey: 'long_name' | 'short_name') =>
    addressComponents.find((c) => c.types.includes(type))?.[nameKey];

  const streetNumber = find('street_number', 'short_name');
  const route = find('route', 'short_name');
  const address1Parts = [streetNumber, route].filter(Boolean);
  const subpremise = find('subpremise', 'short_name');
  const locality = find('locality', 'long_name');
  const adminArea = find('administrative_area_level_1', 'short_name');
  const countryCode = find('country', 'short_name');
  const postalCode = find('postal_code', 'short_name');

  return {
    ...(address1Parts.length ? { address1: address1Parts.join(' ') } : {}),
    ...(subpremise ? { address2: subpremise } : {}),
    ...(locality ? { city: locality } : {}),
    ...(adminArea ? { state: adminArea } : {}),
    ...(countryCode ? { country: countryCode } : {}),
    ...(postalCode ? { zipCode: postalCode } : {}),
  };
};

export const formatAddress = (address?: ShippingAddress | null): string => {
  if (!address) return '';
  const { lines, city, state, postalCode, country } = address;
  const clean = (field?: string | null) =>
    field ? field.replace(/\n/g, ' ').trim() : '';
  const stateZip = [clean(state), clean(postalCode)].filter(Boolean).join(' ');
  const parts = [clean(lines), clean(city), stateZip, clean(country)].filter(
    Boolean,
  );
  return parts.join(', ');
};

/**
 * Builds a lookup map keyed by customer/project ID that merges the address
 * from the assignment summary with the geofence enabled/location data from the
 * geofence configuration API.
 */
export const buildGeofenceConfigMap = (
  edges: TimeAgainstAssignmentSummaryEdge[],
  geofenceNodes: GeofenceConfigurationNode[],
): GeofenceConfigMap => {
  // Index geofence config nodes by their customer/project ID for fast lookup
  const geofenceByEntityId = new Map<string, GeofenceConfigurationNode>();
  geofenceNodes.forEach((node) => {
    const id =
      node.timeAgainstContactDAS?.project?.id ||
      node.timeAgainstContactDAS?.customer?.id ||
      '';
    if (id) {
      geofenceByEntityId.set(id, node);
    }
  });

  const map: GeofenceConfigMap = {};

  edges.forEach((edge) => {
    const { project, customer } = edge.node.timeAgainst.timeAgainstContactDAS;
    const entityId = project?.id ?? customer?.id ?? '';
    if (!entityId) return;

    const geoNode = geofenceByEntityId.get(entityId);

    const geofenceLocation = geoNode?.geofenceLocation
      ? {
          latitude: geoNode.geofenceLocation.latitude ?? null,
          longitude: geoNode.geofenceLocation.longitude ?? null,
          radiusInMeters: geoNode.geofenceLocation.geofenceRadiusInMeter,
        }
      : null;

    map[entityId] = {
      entityId,
      customerName:
        edge.node.timeAgainst.displayName ||
        edge.node.timeAgainst.fullName ||
        '',
      customerAddress: formatAddress(edge.node.timeAgainst.shippingAddress),
      geofenceEnabled: geoNode?.geofenceEnabled?.value ?? false,
      geofenceEnabledVersion: geoNode?.geofenceEnabled?.meta?.version ?? null,
      geofenceLocation,
      geofenceLocationVersion: geoNode?.geofenceLocation?.meta?.version ?? null,
    };
  });

  return map;
};
