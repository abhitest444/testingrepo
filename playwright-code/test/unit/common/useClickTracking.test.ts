import {
  getTimeClockTrackingPoints,
  CLOCK_IN_TRACKING_POINTS,
  WFS_CLOCK_IN_TRACKING_POINTS,
} from 'src/js/common/useClickTracking';

describe('getTimeClockTrackingPoints', () => {
  it('should return QBO tracking points when isWorkforce is false', () => {
    const result = getTimeClockTrackingPoints({ isWorkforce: false });

    expect(result).toBe(CLOCK_IN_TRACKING_POINTS);
    expect(result.ON_MOUNT.scope).toBe('time');
  });

  it('should return WFS tracking points when isWorkforce is true', () => {
    const result = getTimeClockTrackingPoints({ isWorkforce: true });

    expect(result).toBe(WFS_CLOCK_IN_TRACKING_POINTS);
    expect(result.ON_MOUNT.scope_area).toBe('workforce');
  });

  it('should return different tracking point objects for QBO vs WFS', () => {
    const qboPoints = getTimeClockTrackingPoints({ isWorkforce: false });
    const wfsPoints = getTimeClockTrackingPoints({ isWorkforce: true });

    expect(qboPoints).not.toBe(wfsPoints);
  });

  it('should consistently return same object for multiple calls with same parameter', () => {
    const qboPoints1 = getTimeClockTrackingPoints({ isWorkforce: false });
    const qboPoints2 = getTimeClockTrackingPoints({ isWorkforce: false });
    const wfsPoints1 = getTimeClockTrackingPoints({ isWorkforce: true });
    const wfsPoints2 = getTimeClockTrackingPoints({ isWorkforce: true });

    // Should return same reference for same parameter
    expect(qboPoints1).toBe(qboPoints2);
    expect(wfsPoints1).toBe(wfsPoints2);
  });

  describe('QBO tracking points structure', () => {
    it('should have correct scope for ON_MOUNT', () => {
      const points = getTimeClockTrackingPoints({ isWorkforce: false });

      expect(points.ON_MOUNT).toMatchObject({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'time_clock',
      });
    });

    it('should have all required tracking point keys', () => {
      const points = getTimeClockTrackingPoints({ isWorkforce: false });

      expect(points).toHaveProperty('ON_MOUNT');
      expect(points).toHaveProperty('CLOCK_IN');
      expect(points).toHaveProperty('CLOCK_OUT');
      expect(points).toHaveProperty('SAVE');
      expect(points).toHaveProperty('TAKE_BREAK');
      expect(points).toHaveProperty('END_BREAK');
    });
  });

  describe('WFS tracking points structure', () => {
    it('should have workforce scope_area for all points', () => {
      const points = getTimeClockTrackingPoints({ isWorkforce: true });

      expect(points.ON_MOUNT.scope_area).toBe('workforce');
      expect(points.CLOCK_IN.scope_area).toBe('workforce');
      expect(points.SAVE.scope_area).toBe('workforce');
    });

    it('should have correct overrides for ON_MOUNT', () => {
      const points = getTimeClockTrackingPoints({ isWorkforce: true });

      expect(points.ON_MOUNT).toMatchObject({
        object: 'component',
        scope_area: 'workforce',
      });
    });

    it('should have custom field tracking points with widget object type', () => {
      const points = getTimeClockTrackingPoints({ isWorkforce: true });

      expect(points.CUSTOM_FIELD_LIST).toMatchObject({
        object: 'widget',
        object_detail: 'time_clock',
      });

      expect(points.CUSTOM_FIELD_TEXT).toMatchObject({
        object: 'widget',
        object_detail: 'time_clock',
      });
    });

    it('should have correct TAKE_BREAK tracking point', () => {
      const points = getTimeClockTrackingPoints({ isWorkforce: true });

      expect(points.TAKE_BREAK).toMatchObject({
        object: 'widget',
        object_detail: 'time_clock',
        ui_object_detail: 'time_clock_takebreak',
      });
    });

    it('should have correct WANT_TO_SAVE tracking point with viewed action', () => {
      const points = getTimeClockTrackingPoints({ isWorkforce: true });

      expect(points.WANT_TO_SAVE).toMatchObject({
        action: 'viewed',
        ui_action: 'viewed',
      });
    });
  });
});
