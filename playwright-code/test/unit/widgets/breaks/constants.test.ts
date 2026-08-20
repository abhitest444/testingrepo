import {
  BREAKS_TRACKING_POINTS,
  WFS_BREAKS_TRACKING_POINTS,
} from 'src/js/widgets/breaks/constants';

describe('Break Entry Tracking Points', () => {
  describe('BREAKS_TRACKING_POINTS (QBO)', () => {
    it('should have correct screen for break entries', () => {
      expect(BREAKS_TRACKING_POINTS.ADD_BREAK_FROM_ADD_TIME.screen).toBe(
        'break_entries',
      );
    });

    it('should have all required base tracking point keys', () => {
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('ADD_BREAK_FROM_ADD_TIME');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('ADD_BREAK_DRAWER_VIEWED');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('BREAK_TEAM_MEMBER_FIELD');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('BREAK_START_TIME_FIELD');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('BREAK_END_TIME_FIELD');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('DURATION_FIELD');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('BREAK_NOTES_FIELD');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('SAVE_BREAK');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('CANCEL_BREAK');
    });

    it('should have QBO-specific tour modal tracking points', () => {
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('BREAK_TOUR_MODAL_OPEN');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('BREAK_TOUR_MODAL_CLOSE');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('BREAK_TOUR_MODAL_FINISH');
      expect(BREAKS_TRACKING_POINTS).toHaveProperty('BREAK_TOUR_MODAL_FAILED');
    });

    it('should have correct structure for tour modal tracking points', () => {
      expect(BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_OPEN).toMatchObject({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'breaks',
        screen: 'break_entries',
        action: 'engaged',
        object: 'widget',
      });

      expect(BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_CLOSE).toMatchObject({
        ui_action: 'clicked',
        ui_object: 'button',
      });
    });

    it('should have correct base structure', () => {
      expect(BREAKS_TRACKING_POINTS.ADD_BREAK_FROM_ADD_TIME).toMatchObject({
        org: 'sbseg',
        purpose: 'prod',
        screen: 'break_entries',
      });
    });
  });

  describe('WFS_BREAKS_TRACKING_POINTS (Workforce)', () => {
    it('should have correct screen for add break entry drawer', () => {
      expect(WFS_BREAKS_TRACKING_POINTS.ADD_BREAK_DRAWER_VIEWED.screen).toBe(
        'add_break_entry',
      );
    });

    it('should have all required base tracking point keys', () => {
      expect(WFS_BREAKS_TRACKING_POINTS).toHaveProperty(
        'ADD_BREAK_FROM_ADD_TIME',
      );
      expect(WFS_BREAKS_TRACKING_POINTS).toHaveProperty(
        'ADD_BREAK_DRAWER_VIEWED',
      );
      expect(WFS_BREAKS_TRACKING_POINTS).toHaveProperty(
        'BREAK_TEAM_MEMBER_FIELD',
      );
      expect(WFS_BREAKS_TRACKING_POINTS).toHaveProperty(
        'BREAK_START_TIME_FIELD',
      );
      expect(WFS_BREAKS_TRACKING_POINTS).toHaveProperty('BREAK_END_TIME_FIELD');
      expect(WFS_BREAKS_TRACKING_POINTS).toHaveProperty('DURATION_FIELD');
      expect(WFS_BREAKS_TRACKING_POINTS).toHaveProperty('BREAK_NOTES_FIELD');
      expect(WFS_BREAKS_TRACKING_POINTS).toHaveProperty('SAVE_BREAK');
      expect(WFS_BREAKS_TRACKING_POINTS).toHaveProperty('CANCEL_BREAK');
    });

    it('should have WFS-specific overrides for navigation', () => {
      expect(WFS_BREAKS_TRACKING_POINTS.ADD_BREAK_FROM_ADD_TIME).toMatchObject({
        screen: 'global_create',
        action: 'navigated',
        object: 'component',
        object_detail: 'break_entry',
        ui_object: 'page',
        ui_access_point: 'global_create',
      });
    });

    it('should have correct drawer viewed tracking point', () => {
      expect(WFS_BREAKS_TRACKING_POINTS.ADD_BREAK_DRAWER_VIEWED).toMatchObject({
        object: 'component',
        object_detail: 'break_entry',
        action: 'navigated',
        ui_action: 'viewed',
        ui_access_point: 'drawer',
      });
    });

    it('should have drawer ui_access_point for field interactions', () => {
      expect(WFS_BREAKS_TRACKING_POINTS.BREAK_TEAM_MEMBER_FIELD).toMatchObject({
        ui_access_point: 'drawer',
      });
    });

    it('should have correct structure for currently working field', () => {
      expect(
        WFS_BREAKS_TRACKING_POINTS.BREAK_CURRENTLY_WORKING_FIELD,
      ).toMatchObject({
        object_detail: 'currently_working_field',
        ui_object_detail: 'currently_working_field',
      });
    });

    it('should have correct base structure with scope_area workforce', () => {
      expect(WFS_BREAKS_TRACKING_POINTS.ADD_BREAK_FROM_ADD_TIME).toMatchObject({
        org: 'sbseg',
        purpose: 'prod',
        scope_area: 'workforce',
      });
    });

    it('should not have QBO-specific tour modal tracking points', () => {
      // WFS should not have tour modal points
      expect(WFS_BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_OPEN).toBeUndefined();
      expect(WFS_BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_CLOSE).toBeUndefined();
      expect(
        WFS_BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_FINISH,
      ).toBeUndefined();
      expect(
        WFS_BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_FAILED,
      ).toBeUndefined();
    });
  });

  describe('QBO vs WFS differences', () => {
    it('should have different screen names', () => {
      expect(BREAKS_TRACKING_POINTS.ADD_BREAK_FROM_ADD_TIME.screen).not.toBe(
        WFS_BREAKS_TRACKING_POINTS.ADD_BREAK_FROM_ADD_TIME.screen,
      );
    });

    it('should have different navigation actions', () => {
      expect(
        BREAKS_TRACKING_POINTS.ADD_BREAK_FROM_ADD_TIME.ui_access_point,
      ).not.toBe(
        WFS_BREAKS_TRACKING_POINTS.ADD_BREAK_FROM_ADD_TIME.ui_access_point,
      );
    });

    it('should return different object references', () => {
      expect(BREAKS_TRACKING_POINTS).not.toBe(WFS_BREAKS_TRACKING_POINTS);
    });
  });
});
