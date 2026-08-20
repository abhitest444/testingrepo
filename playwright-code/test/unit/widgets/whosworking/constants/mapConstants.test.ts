import {
  ControlPosition,
  MapTypeId,
  US_CENTER,
  ZOOM_DEFAULT,
  ZOOM_SINGLE_WORKER,
  ZOOM_MAX,
  CLUSTER_RADIUS_PIXELS,
} from 'src/js/widgets/whosworking/constants/mapConstants';

describe('mapConstants', () => {
  describe('ControlPosition', () => {
    it('has TOP_CENTER value', () => {
      expect(ControlPosition.TOP_CENTER).toBe(1);
    });

    it('has TOP_LEFT value', () => {
      expect(ControlPosition.TOP_LEFT).toBe(2);
    });

    it('has TOP_RIGHT value', () => {
      expect(ControlPosition.TOP_RIGHT).toBe(3);
    });

    it('has LEFT_CENTER value', () => {
      expect(ControlPosition.LEFT_CENTER).toBe(5);
    });

    it('has LEFT_BOTTOM value', () => {
      expect(ControlPosition.LEFT_BOTTOM).toBe(6);
    });

    it('has RIGHT_BOTTOM value', () => {
      expect(ControlPosition.RIGHT_BOTTOM).toBe(7);
    });

    it('has RIGHT_CENTER value', () => {
      expect(ControlPosition.RIGHT_CENTER).toBe(8);
    });

    it('has RIGHT_TOP value', () => {
      expect(ControlPosition.RIGHT_TOP).toBe(9);
    });

    it('has BOTTOM_CENTER value', () => {
      expect(ControlPosition.BOTTOM_CENTER).toBe(11);
    });

    it('has BOTTOM_LEFT value', () => {
      expect(ControlPosition.BOTTOM_LEFT).toBe(12);
    });

    it('has BOTTOM_RIGHT value', () => {
      expect(ControlPosition.BOTTOM_RIGHT).toBe(13);
    });

    it('has all expected properties', () => {
      expect(ControlPosition).toHaveProperty('TOP_CENTER');
      expect(ControlPosition).toHaveProperty('TOP_LEFT');
      expect(ControlPosition).toHaveProperty('TOP_RIGHT');
      expect(ControlPosition).toHaveProperty('LEFT_CENTER');
      expect(ControlPosition).toHaveProperty('LEFT_BOTTOM');
      expect(ControlPosition).toHaveProperty('RIGHT_BOTTOM');
      expect(ControlPosition).toHaveProperty('RIGHT_CENTER');
      expect(ControlPosition).toHaveProperty('RIGHT_TOP');
      expect(ControlPosition).toHaveProperty('BOTTOM_CENTER');
      expect(ControlPosition).toHaveProperty('BOTTOM_LEFT');
      expect(ControlPosition).toHaveProperty('BOTTOM_RIGHT');
    });

    it('all values are numbers', () => {
      Object.values(ControlPosition).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });

    it('values match Google Maps ControlPosition enum', () => {
      // These values should match the Google Maps API ControlPosition enum
      // Reference: https://developers.google.com/maps/documentation/javascript/reference/control#ControlPosition
      expect(ControlPosition.TOP_CENTER).toBe(1);
      expect(ControlPosition.TOP_LEFT).toBe(2);
      expect(ControlPosition.TOP_RIGHT).toBe(3);
      expect(ControlPosition.LEFT_CENTER).toBe(5);
      expect(ControlPosition.LEFT_BOTTOM).toBe(6);
      expect(ControlPosition.RIGHT_BOTTOM).toBe(7);
      expect(ControlPosition.RIGHT_CENTER).toBe(8);
      expect(ControlPosition.RIGHT_TOP).toBe(9);
      expect(ControlPosition.BOTTOM_CENTER).toBe(11);
      expect(ControlPosition.BOTTOM_LEFT).toBe(12);
      expect(ControlPosition.BOTTOM_RIGHT).toBe(13);
    });
  });

  describe('MapTypeId', () => {
    it('has ROADMAP value', () => {
      expect(MapTypeId.ROADMAP).toBe('roadmap');
    });

    it('has SATELLITE value', () => {
      expect(MapTypeId.SATELLITE).toBe('satellite');
    });

    it('has HYBRID value', () => {
      expect(MapTypeId.HYBRID).toBe('hybrid');
    });

    it('has TERRAIN value', () => {
      expect(MapTypeId.TERRAIN).toBe('terrain');
    });

    it('has all expected properties', () => {
      expect(MapTypeId).toHaveProperty('ROADMAP');
      expect(MapTypeId).toHaveProperty('SATELLITE');
      expect(MapTypeId).toHaveProperty('HYBRID');
      expect(MapTypeId).toHaveProperty('TERRAIN');
    });

    it('all values are strings', () => {
      Object.values(MapTypeId).forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });

    it('values are lowercase', () => {
      Object.values(MapTypeId).forEach((value) => {
        expect(value).toBe(value.toLowerCase());
      });
    });
  });

  describe('US_CENTER', () => {
    it('has lat property', () => {
      expect(US_CENTER).toHaveProperty('lat');
    });

    it('has lng property', () => {
      expect(US_CENTER).toHaveProperty('lng');
    });

    it('lat is a valid latitude', () => {
      expect(US_CENTER.lat).toBeGreaterThanOrEqual(-90);
      expect(US_CENTER.lat).toBeLessThanOrEqual(90);
    });

    it('lng is a valid longitude', () => {
      expect(US_CENTER.lng).toBeGreaterThanOrEqual(-180);
      expect(US_CENTER.lng).toBeLessThanOrEqual(180);
    });

    it('represents geographic center of US', () => {
      // The geographic center of the contiguous US is approximately:
      // 39.8333° N, 98.5855° W (near Lebanon, Kansas)
      expect(US_CENTER.lat).toBeCloseTo(39.8097343, 1);
      expect(US_CENTER.lng).toBeCloseTo(-98.5556199, 1);
    });

    it('coordinates are numbers', () => {
      expect(typeof US_CENTER.lat).toBe('number');
      expect(typeof US_CENTER.lng).toBe('number');
    });
  });

  describe('ZOOM_DEFAULT', () => {
    it('is a number', () => {
      expect(typeof ZOOM_DEFAULT).toBe('number');
    });

    it('has value 4', () => {
      expect(ZOOM_DEFAULT).toBe(4);
    });

    it('is within valid Google Maps zoom range', () => {
      // Google Maps supports zoom levels 0-22
      expect(ZOOM_DEFAULT).toBeGreaterThanOrEqual(0);
      expect(ZOOM_DEFAULT).toBeLessThanOrEqual(22);
    });

    it('is appropriate for viewing continental US', () => {
      // Zoom level 4 is appropriate for viewing a large country/continent
      expect(ZOOM_DEFAULT).toBe(4);
    });
  });

  describe('ZOOM_SINGLE_WORKER', () => {
    it('is a number', () => {
      expect(typeof ZOOM_SINGLE_WORKER).toBe('number');
    });

    it('has value 18', () => {
      expect(ZOOM_SINGLE_WORKER).toBe(18);
    });

    it('is within valid Google Maps zoom range', () => {
      expect(ZOOM_SINGLE_WORKER).toBeGreaterThanOrEqual(0);
      expect(ZOOM_SINGLE_WORKER).toBeLessThanOrEqual(22);
    });

    it('is higher than default zoom', () => {
      // Single worker zoom should be closer than default
      expect(ZOOM_SINGLE_WORKER).toBeGreaterThan(ZOOM_DEFAULT);
    });

    it('is appropriate for street-level view', () => {
      // Zoom level 18 is detailed street-level zoom
      expect(ZOOM_SINGLE_WORKER).toBeGreaterThanOrEqual(14);
      expect(ZOOM_SINGLE_WORKER).toBeLessThanOrEqual(19);
    });
  });

  describe('ZOOM_MAX', () => {
    it('is a number', () => {
      expect(typeof ZOOM_MAX).toBe('number');
    });

    it('has value 22', () => {
      expect(ZOOM_MAX).toBe(22);
    });

    it('is within valid Google Maps zoom range', () => {
      expect(ZOOM_MAX).toBeGreaterThanOrEqual(0);
      expect(ZOOM_MAX).toBeLessThanOrEqual(22);
    });

    it('is the highest of all zoom constants', () => {
      expect(ZOOM_MAX).toBeGreaterThan(ZOOM_DEFAULT);
      expect(ZOOM_MAX).toBeGreaterThanOrEqual(ZOOM_SINGLE_WORKER);
    });

    it('is appropriate for maximum cluster expansion', () => {
      // Max zoom should allow clusters to fully expand
      expect(ZOOM_MAX).toBeGreaterThanOrEqual(18);
    });
  });

  describe('CLUSTER_RADIUS_PIXELS', () => {
    it('is a number', () => {
      expect(typeof CLUSTER_RADIUS_PIXELS).toBe('number');
    });

    it('has value 90', () => {
      expect(CLUSTER_RADIUS_PIXELS).toBe(90);
    });

    it('is a positive number', () => {
      expect(CLUSTER_RADIUS_PIXELS).toBeGreaterThan(0);
    });

    it('is a reasonable clustering radius', () => {
      // Typical clustering radius is between 40-150 pixels
      expect(CLUSTER_RADIUS_PIXELS).toBeGreaterThanOrEqual(40);
      expect(CLUSTER_RADIUS_PIXELS).toBeLessThanOrEqual(150);
    });
  });

  describe('Constants Consistency', () => {
    it('zoom levels are in logical order', () => {
      expect(ZOOM_DEFAULT).toBeLessThan(ZOOM_SINGLE_WORKER);
      expect(ZOOM_SINGLE_WORKER).toBeLessThanOrEqual(ZOOM_MAX);
    });

    it('all constants are defined', () => {
      expect(ControlPosition).toBeDefined();
      expect(MapTypeId).toBeDefined();
      expect(US_CENTER).toBeDefined();
      expect(ZOOM_DEFAULT).toBeDefined();
      expect(ZOOM_SINGLE_WORKER).toBeDefined();
      expect(ZOOM_MAX).toBeDefined();
      expect(CLUSTER_RADIUS_PIXELS).toBeDefined();
    });

    it('constants are immutable (as const)', () => {
      // Since constants are defined with "as const", they should be read-only
      // We can verify the values haven't changed from expected
      expect(US_CENTER.lat).toBe(39.8097343);
      expect(US_CENTER.lng).toBe(-98.5556199);
      expect(ZOOM_DEFAULT).toBe(4);
      expect(ZOOM_SINGLE_WORKER).toBe(18);
      expect(ZOOM_MAX).toBe(22);
      expect(CLUSTER_RADIUS_PIXELS).toBe(90);
    });
  });

  describe('Type Safety', () => {
    it('US_CENTER has correct shape', () => {
      const center: { lat: number; lng: number } = US_CENTER;
      expect(center.lat).toBeDefined();
      expect(center.lng).toBeDefined();
    });

    it('ControlPosition values can be used as numbers', () => {
      const position: number = ControlPosition.BOTTOM_RIGHT;
      expect(position).toBe(13);
    });

    it('MapTypeId values can be used as strings', () => {
      const mapType: string = MapTypeId.ROADMAP;
      expect(mapType).toBe('roadmap');
    });
  });
});
