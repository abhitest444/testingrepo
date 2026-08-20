import {
  WHOS_WORKING_TRACKING_POINTS,
  WFS_WHOS_WORKING_TRACKING_POINTS,
  getWhosWorkingTrackingPoints,
} from 'src/js/widgets/whosworking/whosWorkingTrackingPoints';

describe('whosWorkingTrackingPoints', () => {
  describe('QBO - WHOS_WORKING_TRACKING_POINTS', () => {
    describe('BASE_CONFIG consistency', () => {
      const expectedBaseConfig = {
        org: 'sbseg',
        purpose: 'prod',
        scope: 'qbtime',
        scope_area: 'time-tracking',
        screen: 'whos_working_map',
        object: 'widget',
        object_detail: 'whos_working',
      };

      it.each(Object.keys(WHOS_WORKING_TRACKING_POINTS))(
        '%s should have correct base configuration',
        (key) => {
          const trackingPoint =
            WHOS_WORKING_TRACKING_POINTS[
              key as keyof typeof WHOS_WORKING_TRACKING_POINTS
            ];

          expect(trackingPoint.org).toBe(expectedBaseConfig.org);
          expect(trackingPoint.purpose).toBe(expectedBaseConfig.purpose);
          expect(trackingPoint.scope).toBe(expectedBaseConfig.scope);
          expect(trackingPoint.scope_area).toBe(expectedBaseConfig.scope_area);
          expect(trackingPoint.screen).toBe(expectedBaseConfig.screen);
          expect(trackingPoint.object).toBe(expectedBaseConfig.object);
          expect(trackingPoint.object_detail).toBe(
            expectedBaseConfig.object_detail,
          );
        },
      );
    });

    describe('WIDGET_VIEWED', () => {
      it('should have correct tracking properties', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.WIDGET_VIEWED).toMatchObject({
          action: 'engaged',
          ui_action: 'viewed',
          ui_object: 'page',
          ui_object_detail: 'whos_working_map',
        });
      });
    });

    describe('MAP_VIEW_TOGGLE', () => {
      it('should have correct tracking properties for map toggle', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.MAP_VIEW_TOGGLE).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'map',
        });
      });
    });

    describe('MAP_CLUSTER_CLICK', () => {
      it('should have correct tracking properties for cluster click', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.MAP_CLUSTER_CLICK).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'map_multiple_employees',
        });
      });
    });

    describe('EMPLOYEE_LOCATION_MAP', () => {
      it('should have correct tracking properties for employee location map', () => {
        expect(
          WHOS_WORKING_TRACKING_POINTS.EMPLOYEE_LOCATION_MAP,
        ).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'employee_location_map',
        });
      });
    });

    describe('EDIT_TIME', () => {
      it('should have correct tracking properties for edit time', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.EDIT_TIME).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'edit_time',
        });
      });
    });

    describe('SINGLE_TIME_ENTRY', () => {
      it('should have correct tracking properties for single time entry', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.SINGLE_TIME_ENTRY).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'single_time_entry',
        });
      });
    });

    describe('ADD_BREAK', () => {
      it('should have correct tracking properties for add break', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.ADD_BREAK).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'add_break',
        });
      });
    });

    describe('TEAM_MEMBER_SELECT', () => {
      it('should have correct tracking properties for team member select', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.TEAM_MEMBER_SELECT).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'team_member',
        });
      });
    });

    describe('REFRESH', () => {
      it('should have correct tracking properties for refresh', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.REFRESH).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'refresh',
        });
      });
    });

    describe('SEARCH', () => {
      it('should have correct tracking properties for search', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.SEARCH).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'search',
        });
      });
    });

    describe('GO_TO_EMPLOYEE_LIST', () => {
      it('should have correct tracking properties for go to employee list', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.GO_TO_EMPLOYEE_LIST).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'go_to_employee_list',
        });
      });
    });

    describe('SELECT_FILTER', () => {
      it('should have correct tracking properties for select filter', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.SELECT_FILTER).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'select_filter',
        });
      });
    });

    describe('DISPLAY_BY', () => {
      it('should have correct tracking properties for display by', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.DISPLAY_BY).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'display_by',
        });
      });
    });

    describe('SORT_BY', () => {
      it('should have correct tracking properties for sort by', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.SORT_BY).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'sort_by',
        });
      });
    });

    describe('APPLY_FILTER', () => {
      it('should have correct tracking properties for apply filter', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.APPLY_FILTER).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'apply_filter',
        });
      });
    });

    describe('DONE', () => {
      it('should have correct tracking properties for done', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.DONE).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'done',
        });
      });
    });

    describe('CLOSE', () => {
      it('should have correct tracking properties for close', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.CLOSE).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'close',
        });
      });
    });

    describe('X_CLOSE', () => {
      it('should have correct tracking properties for X close', () => {
        expect(WHOS_WORKING_TRACKING_POINTS.X_CLOSE).toMatchObject({
          action: 'engaged',
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'x',
        });
      });
    });

    describe('All tracking points have required fields', () => {
      it.each(Object.keys(WHOS_WORKING_TRACKING_POINTS))(
        '%s should have all required fields',
        (key) => {
          const trackingPoint =
            WHOS_WORKING_TRACKING_POINTS[
              key as keyof typeof WHOS_WORKING_TRACKING_POINTS
            ];

          expect(trackingPoint).toHaveProperty('org');
          expect(trackingPoint).toHaveProperty('purpose');
          expect(trackingPoint).toHaveProperty('scope');
          expect(trackingPoint).toHaveProperty('scope_area');
          expect(trackingPoint).toHaveProperty('screen');
          expect(trackingPoint).toHaveProperty('object');
          expect(trackingPoint).toHaveProperty('object_detail');
          expect(trackingPoint).toHaveProperty('action');
          expect(trackingPoint).toHaveProperty('ui_action');
          expect(trackingPoint).toHaveProperty('ui_object');
          expect(trackingPoint).toHaveProperty('ui_object_detail');
        },
      );
    });
  }); // Close QBO describe block
});

describe('WFS - WFS_WHOS_WORKING_TRACKING_POINTS', () => {
  describe('BASE_CONFIG consistency with WFS overrides', () => {
    const expectedBaseConfig = {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'workforce',
      screen: 'whos_working_map',
      object: 'widget',
      object_detail: 'whos_working',
    };

    it.each(Object.keys(WFS_WHOS_WORKING_TRACKING_POINTS))(
      '%s should have correct WFS base configuration',
      (key) => {
        const trackingPoint =
          WFS_WHOS_WORKING_TRACKING_POINTS[
            key as keyof typeof WFS_WHOS_WORKING_TRACKING_POINTS
          ];

        expect(trackingPoint.org).toBe(expectedBaseConfig.org);
        expect(trackingPoint.purpose).toBe(expectedBaseConfig.purpose);
        expect(trackingPoint.scope).toBe(expectedBaseConfig.scope);
        expect(trackingPoint.scope_area).toBe(expectedBaseConfig.scope_area);
        expect(trackingPoint.screen).toBe(expectedBaseConfig.screen);
        expect(trackingPoint.object).toBe(expectedBaseConfig.object);
        expect(trackingPoint.object_detail).toBe(
          expectedBaseConfig.object_detail,
        );
      },
    );
  });

  describe('WFS specific field overrides', () => {
    it('should override scope to "time" for all tracking points', () => {
      Object.values(WFS_WHOS_WORKING_TRACKING_POINTS).forEach(
        (trackingPoint) => {
          expect(trackingPoint.scope).toBe('time');
        },
      );
    });

    it('should override scope_area to "workforce" for all tracking points', () => {
      Object.values(WFS_WHOS_WORKING_TRACKING_POINTS).forEach(
        (trackingPoint) => {
          expect(trackingPoint.scope_area).toBe('workforce');
        },
      );
    });
  });

  describe('All WFS tracking points have required fields', () => {
    it.each(Object.keys(WFS_WHOS_WORKING_TRACKING_POINTS))(
      '%s should have all required fields',
      (key) => {
        const trackingPoint =
          WFS_WHOS_WORKING_TRACKING_POINTS[
            key as keyof typeof WFS_WHOS_WORKING_TRACKING_POINTS
          ];

        expect(trackingPoint).toHaveProperty('org');
        expect(trackingPoint).toHaveProperty('purpose');
        expect(trackingPoint).toHaveProperty('scope');
        expect(trackingPoint).toHaveProperty('scope_area');
        expect(trackingPoint).toHaveProperty('screen');
        expect(trackingPoint).toHaveProperty('object');
        expect(trackingPoint).toHaveProperty('object_detail');
        expect(trackingPoint).toHaveProperty('action');
        expect(trackingPoint).toHaveProperty('ui_action');
        expect(trackingPoint).toHaveProperty('ui_object');
        expect(trackingPoint).toHaveProperty('ui_object_detail');
      },
    );
  });
});

describe('getWhosWorkingTrackingPoints helper function', () => {
  it('should return QBO tracking points when isWorkforce is false', () => {
    const trackingPoints = getWhosWorkingTrackingPoints({ isWorkforce: false });

    expect(trackingPoints).toBe(WHOS_WORKING_TRACKING_POINTS);
    expect(trackingPoints.WIDGET_VIEWED.scope).toBe('qbtime');
    expect(trackingPoints.WIDGET_VIEWED.scope_area).toBe('time-tracking');
  });

  it('should return WFS tracking points when isWorkforce is true', () => {
    const trackingPoints = getWhosWorkingTrackingPoints({ isWorkforce: true });

    expect(trackingPoints).toBe(WFS_WHOS_WORKING_TRACKING_POINTS);
    expect(trackingPoints.WIDGET_VIEWED.scope).toBe('time');
    expect(trackingPoints.WIDGET_VIEWED.scope_area).toBe('workforce');
  });

  it('should have the same tracking point keys for both QBO and WFS', () => {
    const qboKeys = Object.keys(WHOS_WORKING_TRACKING_POINTS).sort();
    const wfsKeys = Object.keys(WFS_WHOS_WORKING_TRACKING_POINTS).sort();

    expect(qboKeys).toEqual(wfsKeys);
  });
});
