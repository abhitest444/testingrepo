import {
  TIMESHEET_MAP_STYLES,
  ZOOM_DEFAULT,
  ZOOM_MAX,
  MAP_TOGGLE_OPTIONS,
  getMapViewForTracking,
  type MapType,
} from 'src/js/widgets/timeEntryLocation/utils/constants';

describe('timeEntryLocation constants', () => {
  describe('TIMESHEET_MAP_STYLES', () => {
    it('should have correct structure for all map styles', () => {
      expect(TIMESHEET_MAP_STYLES).toBeDefined();
      expect(Array.isArray(TIMESHEET_MAP_STYLES)).toBe(true);
      expect(TIMESHEET_MAP_STYLES.length).toBeGreaterThan(0);
    });

    it('should include road label styles', () => {
      const roadStyles = TIMESHEET_MAP_STYLES.filter((style) =>
        style.featureType?.startsWith('road'),
      );
      expect(roadStyles.length).toBeGreaterThan(0);
      expect(roadStyles.some((s) => s.featureType === 'road')).toBe(true);
      expect(roadStyles.some((s) => s.featureType === 'road.arterial')).toBe(
        true,
      );
      expect(roadStyles.some((s) => s.featureType === 'road.highway')).toBe(
        true,
      );
      expect(roadStyles.some((s) => s.featureType === 'road.local')).toBe(true);
    });

    it('should include POI label styles', () => {
      const poiStyles = TIMESHEET_MAP_STYLES.filter((style) =>
        style.featureType?.startsWith('poi'),
      );
      expect(poiStyles.length).toBeGreaterThan(0);
      expect(poiStyles.some((s) => s.featureType === 'poi')).toBe(true);
      expect(poiStyles.some((s) => s.featureType === 'poi.business')).toBe(
        true,
      );
    });

    it('should include administrative label styles', () => {
      const adminStyles = TIMESHEET_MAP_STYLES.filter((style) =>
        style.featureType?.startsWith('administrative'),
      );
      expect(adminStyles.length).toBeGreaterThan(0);
      expect(
        adminStyles.some((s) => s.featureType === 'administrative.locality'),
      ).toBe(true);
      expect(
        adminStyles.some(
          (s) => s.featureType === 'administrative.neighborhood',
        ),
      ).toBe(true);
    });

    it('should have visibility set to on for all styles', () => {
      TIMESHEET_MAP_STYLES.forEach((style) => {
        expect(style.elementType).toBe('labels');
        expect(style.stylers).toBeDefined();
        expect(style.stylers[0]?.visibility).toBe('on');
      });
    });
  });

  describe('ZOOM_DEFAULT', () => {
    it('should be a number', () => {
      expect(typeof ZOOM_DEFAULT).toBe('number');
    });

    it('should have a reasonable default value', () => {
      expect(ZOOM_DEFAULT).toBeGreaterThanOrEqual(0);
      expect(ZOOM_DEFAULT).toBeLessThanOrEqual(21);
    });
  });

  describe('ZOOM_MAX', () => {
    it('should be a number', () => {
      expect(typeof ZOOM_MAX).toBe('number');
    });

    it('should be set to 17 to prevent tilt control', () => {
      expect(ZOOM_MAX).toBe(17);
    });

    it('should be greater than ZOOM_DEFAULT', () => {
      expect(ZOOM_MAX).toBeGreaterThan(ZOOM_DEFAULT);
    });

    it('should be less than 18 to prevent tilt controls from appearing', () => {
      expect(ZOOM_MAX).toBeLessThan(18);
    });
  });

  describe('MAP_TOGGLE_OPTIONS', () => {
    it('should have two options', () => {
      expect(MAP_TOGGLE_OPTIONS).toHaveLength(2);
    });

    it('should have Map option with roadmap value', () => {
      const mapOption = MAP_TOGGLE_OPTIONS.find(
        (option) => option.value === 'roadmap',
      );
      expect(mapOption).toBeDefined();
      expect(mapOption?.label).toBe('Map');
    });

    it('should have Satellite option with satellite value', () => {
      const satelliteOption = MAP_TOGGLE_OPTIONS.find(
        (option) => option.value === 'satellite',
      );
      expect(satelliteOption).toBeDefined();
      expect(satelliteOption?.label).toBe('Satellite');
    });
  });

  describe('getMapViewForTracking', () => {
    it('should return "map" for roadmap type', () => {
      expect(getMapViewForTracking('roadmap')).toBe('map');
    });

    it('should return "satellite" for satellite type', () => {
      expect(getMapViewForTracking('satellite')).toBe('satellite');
    });

    it('should handle all valid MapType values', () => {
      const roadmapView = getMapViewForTracking('roadmap' as MapType);
      const satelliteView = getMapViewForTracking('satellite' as MapType);

      expect(roadmapView).toBe('map');
      expect(satelliteView).toBe('satellite');
    });
  });
});
