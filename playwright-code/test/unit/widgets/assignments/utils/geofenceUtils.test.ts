import {
  extractGeofenceAddressFields,
  formatAddress,
  buildGeofenceConfigMap,
} from 'src/js/widgets/assignments/utils/geofenceUtils';
import {
  ShippingAddress,
  TimeAgainstAssignmentSummaryEdge,
} from 'src/js/service/types/assignmentTypes';
import { GeofenceConfigurationNode } from 'src/js/service/hooks/assignments/useGeofenceConfiguration';

const makeEdge = (
  overrides: {
    projectId?: string;
    customerId?: string;
    displayName?: string;
    fullName?: string;
    shippingAddress?: ShippingAddress | null;
  } = {},
): TimeAgainstAssignmentSummaryEdge => ({
  node: {
    timeAgainst: {
      timeAgainstContactDAS: {
        ...(overrides.projectId
          ? { project: { id: overrides.projectId } }
          : {}),
        ...(overrides.customerId
          ? { customer: { id: overrides.customerId } }
          : {}),
      },
      shippingAddress: overrides.shippingAddress ?? null,
      assigned: true,
      displayName: overrides.displayName,
      fullName: overrides.fullName,
    },
    assignedTimeForCount: 0,
    assignedCustomFieldCount: 0,
    assignedStandardFieldCount: 0,
  },
  cursor: 'cursor',
});

const makeGeoNode = (
  overrides: {
    projectId?: string;
    customerId?: string;
    geofenceEnabled?: boolean;
    enabledVersion?: string;
    latitude?: number;
    longitude?: number;
    radiusInMeters?: number;
    locationVersion?: string;
  } = {},
): GeofenceConfigurationNode => ({
  timeAgainstContactDAS: {
    ...(overrides.projectId ? { project: { id: overrides.projectId } } : {}),
    ...(overrides.customerId ? { customer: { id: overrides.customerId } } : {}),
  },
  geofenceEnabled: {
    value: overrides.geofenceEnabled ?? false,
    meta: { version: overrides.enabledVersion },
  },
  ...(overrides.latitude !== undefined
    ? {
        geofenceLocation: {
          latitude: overrides.latitude,
          longitude: overrides.longitude,
          geofenceRadiusInMeter: overrides.radiusInMeters ?? 100,
          meta: { version: overrides.locationVersion },
        },
      }
    : {}),
});

const makeComponent = (
  types: string[],
  long_name: string,
  short_name: string,
): google.maps.GeocoderAddressComponent =>
  ({ types, long_name, short_name } as google.maps.GeocoderAddressComponent);

describe('geofenceUtils', () => {
  describe('extractGeofenceAddressFields', () => {
    it('returns all fields when every component is present', () => {
      const components = [
        makeComponent(['street_number'], '123', '123'),
        makeComponent(['route'], 'Main Street', 'Main St'),
        makeComponent(['subpremise'], 'Suite 400', 'Ste 400'),
        makeComponent(['locality'], 'Springfield', 'Springfield'),
        makeComponent(['administrative_area_level_1'], 'Illinois', 'IL'),
        makeComponent(['country'], 'United States', 'US'),
        makeComponent(['postal_code'], '62704', '62704'),
      ];

      expect(extractGeofenceAddressFields(components)).toEqual({
        address1: '123 Main St',
        address2: 'Ste 400',
        city: 'Springfield',
        state: 'IL',
        country: 'US',
        zipCode: '62704',
      });
    });

    it('returns empty object when no components match', () => {
      expect(extractGeofenceAddressFields([])).toEqual({});
    });

    it('builds address1 from street_number alone when route is missing', () => {
      const components = [makeComponent(['street_number'], '42', '42')];
      expect(extractGeofenceAddressFields(components)).toEqual({
        address1: '42',
      });
    });
  });

  describe('formatAddress', () => {
    it('returns empty string for undefined', () => {
      expect(formatAddress(undefined)).toBe('');
    });

    it('returns empty string for null', () => {
      expect(formatAddress(null)).toBe('');
    });

    it('formats a full address', () => {
      const address: ShippingAddress = {
        lines: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62704',
        country: 'US',
      };
      expect(formatAddress(address)).toBe(
        '123 Main St, Springfield, IL 62704, US',
      );
    });

    it('omits missing fields', () => {
      const address: ShippingAddress = {
        lines: '123 Main St',
        city: 'Springfield',
      };
      expect(formatAddress(address)).toBe('123 Main St, Springfield');
    });

    it('omits null fields', () => {
      const address: ShippingAddress = {
        lines: '456 Oak Ave',
        city: null,
        state: 'CA',
        postalCode: '90210',
        country: null,
      };
      expect(formatAddress(address)).toBe('456 Oak Ave, CA 90210');
    });

    it('strips newlines and trims whitespace from fields', () => {
      const address: ShippingAddress = {
        lines: '789 Pine Rd\nSuite 200',
        city: '  Portland  ',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
      };
      expect(formatAddress(address)).toBe(
        '789 Pine Rd Suite 200, Portland, OR 97201, US',
      );
    });

    it('returns empty string when all fields are empty strings', () => {
      const address: ShippingAddress = {
        lines: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      };
      expect(formatAddress(address)).toBe('');
    });

    it('handles state without postalCode', () => {
      const address: ShippingAddress = {
        lines: '100 Elm St',
        city: 'Denver',
        state: 'CO',
      };
      expect(formatAddress(address)).toBe('100 Elm St, Denver, CO');
    });

    it('handles postalCode without state', () => {
      const address: ShippingAddress = {
        lines: '100 Elm St',
        city: 'Denver',
        postalCode: '80201',
      };
      expect(formatAddress(address)).toBe('100 Elm St, Denver, 80201');
    });
  });

  describe('buildGeofenceConfigMap', () => {
    it('returns an empty map when edges and geofenceNodes are empty', () => {
      expect(buildGeofenceConfigMap([], [])).toEqual({});
    });

    it('maps a customer edge with matching geofence node', () => {
      const edges = [
        makeEdge({
          customerId: 'cust-1',
          displayName: 'Acme Corp',
          shippingAddress: {
            lines: '1 Market St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US',
          },
        }),
      ];
      const geoNodes = [
        makeGeoNode({
          customerId: 'cust-1',
          geofenceEnabled: true,
          enabledVersion: 'v1',
          latitude: 37.7749,
          longitude: -122.4194,
          radiusInMeters: 200,
          locationVersion: 'v2',
        }),
      ];

      const result = buildGeofenceConfigMap(edges, geoNodes);

      expect(result).toEqual({
        'cust-1': {
          entityId: 'cust-1',
          customerName: 'Acme Corp',
          customerAddress: '1 Market St, San Francisco, CA 94105, US',
          geofenceEnabled: true,
          geofenceEnabledVersion: 'v1',
          geofenceLocation: {
            latitude: 37.7749,
            longitude: -122.4194,
            radiusInMeters: 200,
          },
          geofenceLocationVersion: 'v2',
        },
      });
    });

    it('maps a project edge with matching geofence node', () => {
      const edges = [
        makeEdge({
          projectId: 'proj-1',
          displayName: 'Project Alpha',
        }),
      ];
      const geoNodes = [
        makeGeoNode({
          projectId: 'proj-1',
          geofenceEnabled: false,
          enabledVersion: 'v3',
          latitude: 40.7128,
          longitude: -74.006,
          radiusInMeters: 150,
          locationVersion: 'v4',
        }),
      ];

      const result = buildGeofenceConfigMap(edges, geoNodes);

      expect(result['proj-1']).toEqual(
        expect.objectContaining({
          entityId: 'proj-1',
          customerName: 'Project Alpha',
          geofenceEnabled: false,
          geofenceLocation: {
            latitude: 40.7128,
            longitude: -74.006,
            radiusInMeters: 150,
          },
        }),
      );
    });

    it('falls back to fullName when displayName is missing', () => {
      const edges = [
        makeEdge({
          customerId: 'cust-2',
          fullName: 'Beta Industries',
        }),
      ];

      const result = buildGeofenceConfigMap(edges, []);

      expect(result['cust-2'].customerName).toBe('Beta Industries');
    });

    it('uses empty string for name when both displayName and fullName are missing', () => {
      const edges = [makeEdge({ customerId: 'cust-3' })];

      const result = buildGeofenceConfigMap(edges, []);

      expect(result['cust-3'].customerName).toBe('');
    });

    it('sets geofence defaults when no matching geofence node exists', () => {
      const edges = [makeEdge({ customerId: 'cust-4', displayName: 'Solo' })];

      const result = buildGeofenceConfigMap(edges, []);

      expect(result['cust-4']).toEqual(
        expect.objectContaining({
          geofenceEnabled: false,
          geofenceEnabledVersion: null,
          geofenceLocation: null,
          geofenceLocationVersion: null,
        }),
      );
    });

    it('skips edges with no project or customer id', () => {
      const edges = [makeEdge({})];

      const result = buildGeofenceConfigMap(edges, []);

      expect(result).toEqual({});
    });

    it('prefers project id over customer id for entity key', () => {
      const edges = [
        makeEdge({
          projectId: 'proj-x',
          customerId: 'cust-x',
          displayName: 'Dual Entity',
        }),
      ];
      const geoNodes = [
        makeGeoNode({
          projectId: 'proj-x',
          geofenceEnabled: true,
          enabledVersion: 'v5',
        }),
      ];

      const result = buildGeofenceConfigMap(edges, geoNodes);

      expect(result['proj-x']).toBeDefined();
      expect(result['cust-x']).toBeUndefined();
      expect(result['proj-x'].geofenceEnabled).toBe(true);
    });

    it('handles multiple edges and geofence nodes', () => {
      const edges = [
        makeEdge({ customerId: 'c1', displayName: 'Customer One' }),
        makeEdge({ projectId: 'p1', displayName: 'Project One' }),
        makeEdge({ customerId: 'c2', displayName: 'Customer Two' }),
      ];
      const geoNodes = [
        makeGeoNode({
          customerId: 'c1',
          geofenceEnabled: true,
          enabledVersion: 'v1',
          latitude: 10,
          longitude: 20,
          radiusInMeters: 50,
          locationVersion: 'v1',
        }),
        makeGeoNode({
          projectId: 'p1',
          geofenceEnabled: false,
          enabledVersion: 'v2',
        }),
      ];

      const result = buildGeofenceConfigMap(edges, geoNodes);

      expect(Object.keys(result)).toHaveLength(3);
      expect(result.c1.geofenceEnabled).toBe(true);
      expect(result.c1.geofenceLocation).toEqual({
        latitude: 10,
        longitude: 20,
        radiusInMeters: 50,
      });
      expect(result.p1.geofenceEnabled).toBe(false);
      expect(result.p1.geofenceLocation).toBeNull();
      expect(result.c2.geofenceEnabled).toBe(false);
      expect(result.c2.geofenceLocation).toBeNull();
    });

    it('preserves null for latitude and longitude when undefined in the geofence node', () => {
      const edges = [makeEdge({ customerId: 'c-nil', displayName: 'NilGeo' })];
      const geoNodes: GeofenceConfigurationNode[] = [
        {
          timeAgainstContactDAS: { customer: { id: 'c-nil' } },
          geofenceEnabled: { value: true },
          geofenceLocation: {
            geofenceRadiusInMeter: 300,
          },
        },
      ];

      const result = buildGeofenceConfigMap(edges, geoNodes);

      expect(result['c-nil'].geofenceLocation).toEqual({
        latitude: null,
        longitude: null,
        radiusInMeters: 300,
      });
    });

    it('skips geofence nodes with no entity id', () => {
      const edges = [makeEdge({ customerId: 'c5', displayName: 'Five' })];
      const geoNodes: GeofenceConfigurationNode[] = [
        {
          timeAgainstContactDAS: {},
          geofenceEnabled: { value: true, meta: { version: 'v9' } },
        },
      ];

      const result = buildGeofenceConfigMap(edges, geoNodes);

      expect(result.c5.geofenceEnabled).toBe(false);
    });

    it('formats the customerAddress from the edge shippingAddress', () => {
      const edges = [
        makeEdge({
          customerId: 'c6',
          displayName: 'Addr Test',
          shippingAddress: {
            lines: '10 Downing St',
            city: 'London',
            country: 'UK',
          },
        }),
      ];

      const result = buildGeofenceConfigMap(edges, []);

      expect(result.c6.customerAddress).toBe('10 Downing St, London, UK');
    });
  });
});
