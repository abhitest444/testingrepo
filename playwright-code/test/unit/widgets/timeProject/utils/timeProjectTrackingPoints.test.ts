import {
  LANDING_PAGE_TRACKING_POINTS,
  ASSIGN_WORKERS_TRACKING_POINTS,
  DETAILS_PAGE_TRACKING_POINTS,
  CREATE_ESTIMATE_TRACKING_POINTS,
  WFS_LANDING_PAGE_TRACKING_POINTS,
  WFS_ASSIGN_WORKERS_TRACKING_POINTS,
  WFS_DETAILS_PAGE_TRACKING_POINTS,
  WFS_CREATE_ESTIMATE_TRACKING_POINTS,
  getLandingPageTrackingPoints,
  getAssignWorkersTrackingPoints,
  getDetailsPageTrackingPoints,
  getCreateEstimateTrackingPoints,
} from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';

const BASE_FIELDS = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'Time projects',
  action: 'engaged',
  object: 'component',
};

const WFS_BASE_FIELDS = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'workforce',
  action: 'engaged',
  object: 'component',
};

describe('timeProjectTrackingPoints', () => {
  describe('LANDING_PAGE_TRACKING_POINTS', () => {
    it('should have 16 tracking points', () => {
      expect(Object.keys(LANDING_PAGE_TRACKING_POINTS)).toHaveLength(16);
    });

    it('should have correct base fields on every entry', () => {
      Object.values(LANDING_PAGE_TRACKING_POINTS).forEach((point) => {
        expect(point).toMatchObject(BASE_FIELDS);
        expect(point.screen).toBe('Time_projects_landing_page');
      });
    });

    it('should have correct keys', () => {
      expect(LANDING_PAGE_TRACKING_POINTS.CLICK_STATUS_DROPDOWN).toBeDefined();
      expect(LANDING_PAGE_TRACKING_POINTS.SELECT_STATUS_DROPDOWN).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.CLICK_CUSTOMER_SEARCH_DROPDOWN,
      ).toBeDefined();
      expect(LANDING_PAGE_TRACKING_POINTS.SELECT_CUSTOMER_SEARCH).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.CLICK_CUSTOMER_SEARCH_FORM_FIELD,
      ).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.TYPE_CUSTOMER_SEARCH_FORM_FIELD,
      ).toBeDefined();
      expect(LANDING_PAGE_TRACKING_POINTS.CLICK_SEARCH_ICON).toBeDefined();
      expect(LANDING_PAGE_TRACKING_POINTS.CLICK_MANAGE_PROJECTS).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.CLICK_CREATE_ESTIMATE_LANDING_PAGE,
      ).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.CLICK_VIEW_PROJECT_LANDING_PAGE,
      ).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.CLICK_PROJECTS_DROPDOWN,
      ).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.CLICK_PROJECTS_LANDING_PAGE,
      ).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.SELECT_VIEW_PROJECT_DROPDOWN,
      ).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.SELECT_EDIT_PROJECT_DROPDOWN,
      ).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.SELECT_ASSIGN_WORKERS_PROJECT_DROPDOWN,
      ).toBeDefined();
      expect(
        LANDING_PAGE_TRACKING_POINTS.SELECT_CSV_EXPORT_PROJECT_DROPDOWN,
      ).toBeDefined();
    });

    it('should have specific ui_action values', () => {
      expect(LANDING_PAGE_TRACKING_POINTS.CLICK_STATUS_DROPDOWN.ui_action).toBe(
        'clicked',
      );
      expect(
        LANDING_PAGE_TRACKING_POINTS.SELECT_STATUS_DROPDOWN.ui_action,
      ).toBe('selected');
      expect(
        LANDING_PAGE_TRACKING_POINTS.TYPE_CUSTOMER_SEARCH_FORM_FIELD.ui_action,
      ).toBe('typed');
    });
  });

  describe('ASSIGN_WORKERS_TRACKING_POINTS', () => {
    it('should have 8 tracking points', () => {
      expect(Object.keys(ASSIGN_WORKERS_TRACKING_POINTS)).toHaveLength(8);
    });

    it('should have correct base fields and screen on every entry', () => {
      Object.values(ASSIGN_WORKERS_TRACKING_POINTS).forEach((point) => {
        expect(point).toMatchObject(BASE_FIELDS);
        expect(point.screen).toBe('Time_projects_assign_workers');
      });
    });

    it('should have correct keys', () => {
      expect(
        ASSIGN_WORKERS_TRACKING_POINTS.SEARCH_ASSIGN_WORKERS,
      ).toBeDefined();
      expect(
        ASSIGN_WORKERS_TRACKING_POINTS.TYPE_SEARCH_ASSIGN_WORKERS,
      ).toBeDefined();
      expect(
        ASSIGN_WORKERS_TRACKING_POINTS.CLICK_ALL_WORKER_DROPDOWN,
      ).toBeDefined();
      expect(
        ASSIGN_WORKERS_TRACKING_POINTS.SELECT_ALL_WORKER_DROPDOWN,
      ).toBeDefined();
      expect(ASSIGN_WORKERS_TRACKING_POINTS.ENABLE_ALL_WORKER).toBeDefined();
      expect(ASSIGN_WORKERS_TRACKING_POINTS.DISABLE_ALL_WORKER).toBeDefined();
      expect(ASSIGN_WORKERS_TRACKING_POINTS.SAVE_ASSIGN_WORKER).toBeDefined();
      expect(ASSIGN_WORKERS_TRACKING_POINTS.CLOSE_ASSIGN_WORKER).toBeDefined();
    });
  });

  describe('DETAILS_PAGE_TRACKING_POINTS', () => {
    it('should have 19 tracking points', () => {
      expect(Object.keys(DETAILS_PAGE_TRACKING_POINTS)).toHaveLength(19);
    });

    it('should have correct base fields and screen on every entry', () => {
      Object.values(DETAILS_PAGE_TRACKING_POINTS).forEach((point) => {
        expect(point).toMatchObject(BASE_FIELDS);
        expect(point.screen).toBe('Time_projects_details_page');
      });
    });

    it('should have correct keys', () => {
      expect(DETAILS_PAGE_TRACKING_POINTS.CLICK_ASSIGN).toBeDefined();
      expect(DETAILS_PAGE_TRACKING_POINTS.CLICK_ASSIGN_DROPDOWN).toBeDefined();
      expect(DETAILS_PAGE_TRACKING_POINTS.CLICK_EDIT_PROJECT).toBeDefined();
      expect(
        DETAILS_PAGE_TRACKING_POINTS.CLICK_EDIT_PROJECT_DROPDOWN,
      ).toBeDefined();
      expect(
        DETAILS_PAGE_TRACKING_POINTS.EDIT_ESTIMATION_SUMMARY,
      ).toBeDefined();
      expect(DETAILS_PAGE_TRACKING_POINTS.CLICK_ESTIMATES_TAB).toBeDefined();
      expect(DETAILS_PAGE_TRACKING_POINTS.CLICK_USER_TAB).toBeDefined();
      expect(DETAILS_PAGE_TRACKING_POINTS.VIEW_WORKERS).toBeDefined();
      expect(
        DETAILS_PAGE_TRACKING_POINTS.LEFT_PAGINATION_ARROW_ESTIMATES,
      ).toBeDefined();
      expect(
        DETAILS_PAGE_TRACKING_POINTS.RIGHT_PAGINATION_ARROW_ESTIMATES,
      ).toBeDefined();
      expect(
        DETAILS_PAGE_TRACKING_POINTS.LEFT_PAGINATION_ARROW_USERS,
      ).toBeDefined();
      expect(
        DETAILS_PAGE_TRACKING_POINTS.RIGHT_PAGINATION_ARROW_USERS,
      ).toBeDefined();
      expect(DETAILS_PAGE_TRACKING_POINTS.CUSTOMER_NAME).toBeDefined();
      expect(
        DETAILS_PAGE_TRACKING_POINTS.ENABLE_FAVOURITE_PROJECT,
      ).toBeDefined();
      expect(
        DETAILS_PAGE_TRACKING_POINTS.DISABLE_FAVOURITE_PROJECT,
      ).toBeDefined();
      expect(DETAILS_PAGE_TRACKING_POINTS.CREATE_ESTIMATE).toBeDefined();
      expect(
        DETAILS_PAGE_TRACKING_POINTS.SELECT_EDIT_ESTIMATE_DROPDOWN,
      ).toBeDefined();
      expect(
        DETAILS_PAGE_TRACKING_POINTS.SELECT_EXPORT_CSV_DROPDOWN,
      ).toBeDefined();
      expect(DETAILS_PAGE_TRACKING_POINTS.EDIT_PROJECT_DATES).toBeDefined();
    });
  });

  describe('CREATE_ESTIMATE_TRACKING_POINTS', () => {
    it('should have 17 tracking points', () => {
      expect(Object.keys(CREATE_ESTIMATE_TRACKING_POINTS)).toHaveLength(17);
    });

    it('should have correct base fields on every entry', () => {
      Object.values(CREATE_ESTIMATE_TRACKING_POINTS).forEach((point) => {
        expect(point).toMatchObject(BASE_FIELDS);
      });
    });

    it('should have correct keys', () => {
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.CLICK_CREATE_ESTIMATE_FOR_PROJECT,
      ).toBeDefined();
      expect(CREATE_ESTIMATE_TRACKING_POINTS.ENABLE_BY_HOURS).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.ENABLE_BY_SERVICE_ITEM,
      ).toBeDefined();
      expect(CREATE_ESTIMATE_TRACKING_POINTS.ENTER_HOURS_WORKED).toBeDefined();
      expect(CREATE_ESTIMATE_TRACKING_POINTS.SAVE_ESTIMATE).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.CLOSE_CREATE_ESTIMATE,
      ).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.CLICK_SERVICE_ITEM_DROPDOWN,
      ).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.SELECT_SERVICE_ITEM_DROPDOWN,
      ).toBeDefined();
      expect(CREATE_ESTIMATE_TRACKING_POINTS.ENTER_SERVICE_HOURS).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.ADD_SERVICE_ITEM_DETAILS,
      ).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.CLICK_ELLIPSIS_SERVICE_ITEM,
      ).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.EDIT_SERVICE_LINE_ITEM,
      ).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.SELECT_DELETE_SERVICE_ITEM,
      ).toBeDefined();
      expect(CREATE_ESTIMATE_TRACKING_POINTS.EDIT_SERVICE_HOURS).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.DELETE_SERVICE_HOURS,
      ).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.CHANGE_ESTIMATE_TYPE,
      ).toBeDefined();
      expect(
        CREATE_ESTIMATE_TRACKING_POINTS.CANCEL_ESTIMATE_TYPE_CHANGE,
      ).toBeDefined();
    });

    it('most entries should use Time_projects_details_page_create_estimate screen', () => {
      const entries = Object.values(CREATE_ESTIMATE_TRACKING_POINTS);
      const estimateScreenEntries = entries.filter(
        (p) => p.screen === 'Time_projects_details_page_create_estimate',
      );
      expect(estimateScreenEntries.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('WFS_LANDING_PAGE_TRACKING_POINTS', () => {
    it('should have 16 tracking points', () => {
      expect(Object.keys(WFS_LANDING_PAGE_TRACKING_POINTS)).toHaveLength(16);
    });

    it('should have WFS base fields (workforce scope) on every entry', () => {
      Object.values(WFS_LANDING_PAGE_TRACKING_POINTS).forEach((point) => {
        expect(point).toMatchObject(WFS_BASE_FIELDS);
        expect(point.screen).toBe('Time_projects_landing_page');
      });
    });

    it('should have same keys as QBO version', () => {
      const qboKeys = Object.keys(LANDING_PAGE_TRACKING_POINTS).sort();
      const wfsKeys = Object.keys(WFS_LANDING_PAGE_TRACKING_POINTS).sort();
      expect(wfsKeys).toEqual(qboKeys);
    });
  });

  describe('WFS_ASSIGN_WORKERS_TRACKING_POINTS', () => {
    it('should have 8 tracking points', () => {
      expect(Object.keys(WFS_ASSIGN_WORKERS_TRACKING_POINTS)).toHaveLength(8);
    });

    it('should have WFS base fields on every entry', () => {
      Object.values(WFS_ASSIGN_WORKERS_TRACKING_POINTS).forEach((point) => {
        expect(point).toMatchObject(WFS_BASE_FIELDS);
        expect(point.screen).toBe('Time_projects_assign_workers');
      });
    });
  });

  describe('WFS_DETAILS_PAGE_TRACKING_POINTS', () => {
    it('should have 19 tracking points', () => {
      expect(Object.keys(WFS_DETAILS_PAGE_TRACKING_POINTS)).toHaveLength(19);
    });

    it('should have WFS base fields on every entry', () => {
      Object.values(WFS_DETAILS_PAGE_TRACKING_POINTS).forEach((point) => {
        expect(point).toMatchObject(WFS_BASE_FIELDS);
        expect(point.screen).toBe('Time_projects_details_page');
      });
    });
  });

  describe('WFS_CREATE_ESTIMATE_TRACKING_POINTS', () => {
    it('should have 17 tracking points', () => {
      expect(Object.keys(WFS_CREATE_ESTIMATE_TRACKING_POINTS)).toHaveLength(17);
    });

    it('should have WFS base fields on every entry', () => {
      Object.values(WFS_CREATE_ESTIMATE_TRACKING_POINTS).forEach((point) => {
        expect(point).toMatchObject(WFS_BASE_FIELDS);
      });
    });
  });

  describe('Getter Functions', () => {
    describe('getLandingPageTrackingPoints', () => {
      it('should return QBO tracking points when isWorkforce is false', () => {
        const result = getLandingPageTrackingPoints({ isWorkforce: false });
        expect(result).toBe(LANDING_PAGE_TRACKING_POINTS);
      });

      it('should return WFS tracking points when isWorkforce is true', () => {
        const result = getLandingPageTrackingPoints({ isWorkforce: true });
        expect(result).toBe(WFS_LANDING_PAGE_TRACKING_POINTS);
      });
    });

    describe('getAssignWorkersTrackingPoints', () => {
      it('should return QBO tracking points when isWorkforce is false', () => {
        const result = getAssignWorkersTrackingPoints({ isWorkforce: false });
        expect(result).toBe(ASSIGN_WORKERS_TRACKING_POINTS);
      });

      it('should return WFS tracking points when isWorkforce is true', () => {
        const result = getAssignWorkersTrackingPoints({ isWorkforce: true });
        expect(result).toBe(WFS_ASSIGN_WORKERS_TRACKING_POINTS);
      });
    });

    describe('getDetailsPageTrackingPoints', () => {
      it('should return QBO tracking points when isWorkforce is false', () => {
        const result = getDetailsPageTrackingPoints({ isWorkforce: false });
        expect(result).toBe(DETAILS_PAGE_TRACKING_POINTS);
      });

      it('should return WFS tracking points when isWorkforce is true', () => {
        const result = getDetailsPageTrackingPoints({ isWorkforce: true });
        expect(result).toBe(WFS_DETAILS_PAGE_TRACKING_POINTS);
      });
    });

    describe('getCreateEstimateTrackingPoints', () => {
      it('should return QBO tracking points when isWorkforce is false', () => {
        const result = getCreateEstimateTrackingPoints({ isWorkforce: false });
        expect(result).toBe(CREATE_ESTIMATE_TRACKING_POINTS);
      });

      it('should return WFS tracking points when isWorkforce is true', () => {
        const result = getCreateEstimateTrackingPoints({ isWorkforce: true });
        expect(result).toBe(WFS_CREATE_ESTIMATE_TRACKING_POINTS);
      });
    });
  });
});
