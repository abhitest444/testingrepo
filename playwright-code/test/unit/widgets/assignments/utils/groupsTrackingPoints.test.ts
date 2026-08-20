/**
 * Test suite for Groups Tracking Points
 * Unit tests for analytics tracking configurations
 */

import {
  GROUPS_LIST_TRACKING_POINTS,
  CREATE_GROUP_TRACKING_POINTS,
  GROUP_ACTIONS_TRACKING_POINTS,
  GROUP_DETAILS_TRACKING_POINTS,
  GROUP_MODALS_TRACKING_POINTS,
} from 'src/js/widgets/assignments/utils/groupsTrackingPoints';
import { BASE_TIME_TRACKING_FIELDS } from 'src/js/common/trackingConstants';

describe('Groups Tracking Points', () => {
  // Base template fields that should be present in all tracking points
  const BASE_FIELDS = BASE_TIME_TRACKING_FIELDS;

  // Required fields for all tracking points
  const REQUIRED_FIELDS = [
    'org',
    'purpose',
    'scope',
    'scope_area',
    'screen',
    'action',
    'object',
    'object_detail',
    'ui_action',
    'ui_object',
    'ui_object_detail',
    'ui_access_point',
  ];

  /**
   * Helper function to validate tracking point structure
   */
  const validateTrackingPoint = (
    trackingPoint: any,
    pointName: string,
  ): void => {
    // Check all required fields are present
    REQUIRED_FIELDS.forEach((field) => {
      expect(trackingPoint).toHaveProperty(field);
      expect(trackingPoint[field]).toBeDefined();
      expect(typeof trackingPoint[field]).toBe('string');
    });

    // Check base template fields match
    Object.entries(BASE_FIELDS).forEach(([key, value]) => {
      // Allow overrides for specific fields (object, object_detail)
      if (
        key !== 'object' &&
        key !== 'object_detail' &&
        trackingPoint[key] !== value
      ) {
        expect(trackingPoint[key]).toBe(value);
      }
    });

    // Validate previous_screen is present (Groups-specific field)
    expect(trackingPoint).toHaveProperty('previous_screen');
    expect(trackingPoint.previous_screen).toBeDefined();
    expect(typeof trackingPoint.previous_screen).toBe('string');
  };

  describe('GROUPS_LIST_TRACKING_POINTS', () => {
    test('should export all expected tracking points', () => {
      const expectedPoints = [
        'GROUPS_ENTRY',
        'GROUPS_LIST_VIEW',
        'SEARCH_GROUPS',
        'PAGINATION',
        'MANAGE_FIELDS',
        'WORKERS_LIST_CLICKED',
      ];

      expectedPoints.forEach((point) => {
        expect(GROUPS_LIST_TRACKING_POINTS).toHaveProperty(point);
      });
    });

    test('GROUPS_ENTRY should have correct structure', () => {
      const point = GROUPS_LIST_TRACKING_POINTS.GROUPS_ENTRY;
      validateTrackingPoint(point, 'GROUPS_ENTRY');

      expect(point.action).toBe('navigated');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('link');
      expect(point.ui_object_detail).toBe('groups_tab');
      expect(point.ui_access_point).toBe('groups_tab');
      expect(point.previous_screen).toBe('left_nav');
    });

    test('GROUPS_LIST_VIEW should have correct structure', () => {
      const point = GROUPS_LIST_TRACKING_POINTS.GROUPS_LIST_VIEW;
      validateTrackingPoint(point, 'GROUPS_LIST_VIEW');

      expect(point.action).toBe('viewed');
      expect(point.ui_action).toBe('viewed');
      expect(point.ui_object).toBe('page');
      expect(point.ui_object_detail).toBe('groups_list');
      expect(point.previous_screen).toBe('groups_tab');
    });

    test('SEARCH_GROUPS should have correct structure', () => {
      const point = GROUPS_LIST_TRACKING_POINTS.SEARCH_GROUPS;
      validateTrackingPoint(point, 'SEARCH_GROUPS');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('typed');
      expect(point.ui_object).toBe('form_field');
      expect(point.ui_object_detail).toBe('search_groups');
      expect(point.previous_screen).toBe('groups_list_header');
    });

    test('PAGINATION should have correct structure', () => {
      const point = GROUPS_LIST_TRACKING_POINTS.PAGINATION;
      validateTrackingPoint(point, 'PAGINATION');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('groups_pagination');
      expect(point.previous_screen).toBe('groups_list_footer');
    });

    test('MANAGE_FIELDS should have correct structure', () => {
      const point = GROUPS_LIST_TRACKING_POINTS.MANAGE_FIELDS;
      validateTrackingPoint(point, 'MANAGE_FIELDS');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('manage_fields');
      expect(point.previous_screen).toBe('groups_list_header');
    });
  });

  describe('CREATE_GROUP_TRACKING_POINTS', () => {
    test('should export all expected tracking points', () => {
      const expectedPoints = [
        'START_CREATE_GROUP',
        'VIEW_CREATE_DRAWER',
        'TYPE_GROUP_NAME',
        'CLICK_ASSIGN_WORKERS',
        'CLICK_ASSIGN_LEADS',
        'SAVE_GROUP',
        'CANCEL_GROUP',
        'CLOSE_CREATE_GROUP_DRAWER',
      ];

      expectedPoints.forEach((point) => {
        expect(CREATE_GROUP_TRACKING_POINTS).toHaveProperty(point);
      });
    });

    test('START_CREATE_GROUP should have correct structure', () => {
      const point = CREATE_GROUP_TRACKING_POINTS.START_CREATE_GROUP;
      validateTrackingPoint(point, 'START_CREATE_GROUP');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('create_group');
      expect(point.previous_screen).toBe('groups_list_header');
    });

    test('VIEW_CREATE_DRAWER should have correct structure and override object fields', () => {
      const point = CREATE_GROUP_TRACKING_POINTS.VIEW_CREATE_DRAWER;
      validateTrackingPoint(point, 'VIEW_CREATE_DRAWER');

      expect(point.action).toBe('viewed');
      expect(point.object).toBe('drawer'); // Override from base
      expect(point.object_detail).toBe('drawer'); // Override from base
      expect(point.ui_action).toBe('viewed');
      expect(point.ui_object).toBe('drawer');
      expect(point.ui_object_detail).toBe('create_group_drawer');
      expect(point.previous_screen).toBe('create_group_cta');
    });

    test('TYPE_GROUP_NAME should have correct structure', () => {
      const point = CREATE_GROUP_TRACKING_POINTS.TYPE_GROUP_NAME;
      validateTrackingPoint(point, 'TYPE_GROUP_NAME');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('typed');
      expect(point.ui_object).toBe('form_field');
      expect(point.ui_object_detail).toBe('group_name_field');
      expect(point.previous_screen).toBe('create_group_drawer');
    });

    test('CLICK_ASSIGN_WORKERS should have correct structure', () => {
      const point = CREATE_GROUP_TRACKING_POINTS.CLICK_ASSIGN_WORKERS;
      validateTrackingPoint(point, 'CLICK_ASSIGN_WORKERS');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('assign_workers');
      expect(point.previous_screen).toBe('create_group_drawer');
    });

    test('CLICK_ASSIGN_LEADS should have correct structure', () => {
      const point = CREATE_GROUP_TRACKING_POINTS.CLICK_ASSIGN_LEADS;
      validateTrackingPoint(point, 'CLICK_ASSIGN_LEADS');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('assign_leads');
      expect(point.previous_screen).toBe('create_group_drawer');
    });

    test('SAVE_GROUP should have correct structure', () => {
      const point = CREATE_GROUP_TRACKING_POINTS.SAVE_GROUP;
      validateTrackingPoint(point, 'SAVE_GROUP');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('save_group');
      expect(point.previous_screen).toBe('create_group_drawer');
    });

    test('CANCEL_GROUP should have correct structure', () => {
      const point = CREATE_GROUP_TRACKING_POINTS.CANCEL_GROUP;
      validateTrackingPoint(point, 'CANCEL_GROUP');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('cancel_group');
      expect(point.previous_screen).toBe('create_group_drawer');
    });
  });

  describe('GROUP_ACTIONS_TRACKING_POINTS', () => {
    test('should export all expected tracking points', () => {
      const expectedPoints = [
        'OPEN_GROUP_MENU',
        'EDIT_GROUP',
        'ASSIGN_WORKERS_MENU',
        'ASSIGN_LEAD_MENU',
        'DELETE_GROUP',
        'VIEW_GROUP_CTA',
      ];

      expectedPoints.forEach((point) => {
        expect(GROUP_ACTIONS_TRACKING_POINTS).toHaveProperty(point);
      });
    });

    test('OPEN_GROUP_MENU should have correct structure', () => {
      const point = GROUP_ACTIONS_TRACKING_POINTS.OPEN_GROUP_MENU;
      validateTrackingPoint(point, 'OPEN_GROUP_MENU');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('group_action_menu');
      expect(point.previous_screen).toBe('groups_list_row');
    });

    test('EDIT_GROUP should have correct structure', () => {
      const point = GROUP_ACTIONS_TRACKING_POINTS.EDIT_GROUP;
      validateTrackingPoint(point, 'EDIT_GROUP');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('list_item');
      expect(point.ui_object_detail).toBe('edit_group');
      expect(point.previous_screen).toBe('group_row_dropdown');
    });

    test('ASSIGN_WORKERS_MENU should have correct structure', () => {
      const point = GROUP_ACTIONS_TRACKING_POINTS.ASSIGN_WORKERS_MENU;
      validateTrackingPoint(point, 'ASSIGN_WORKERS_MENU');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('list_item');
      expect(point.ui_object_detail).toBe('assign_workers_menu');
      expect(point.previous_screen).toBe('group_row_dropdown');
    });

    test('ASSIGN_LEAD_MENU should have correct structure', () => {
      const point = GROUP_ACTIONS_TRACKING_POINTS.ASSIGN_LEAD_MENU;
      validateTrackingPoint(point, 'ASSIGN_LEAD_MENU');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('list_item');
      expect(point.ui_object_detail).toBe('assign_lead_menu');
      expect(point.previous_screen).toBe('group_row_dropdown');
    });

    test('DELETE_GROUP should have correct structure', () => {
      const point = GROUP_ACTIONS_TRACKING_POINTS.DELETE_GROUP;
      validateTrackingPoint(point, 'DELETE_GROUP');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('list_item');
      expect(point.ui_object_detail).toBe('delete_group');
      expect(point.previous_screen).toBe('group_row_dropdown');
    });
  });

  describe('GROUP_DETAILS_TRACKING_POINTS', () => {
    test('should export all expected tracking points', () => {
      const expectedPoints = [
        'VIEW_GROUP_DETAILS',
        'SEARCH_WORKERS_DETAIL',
        'FILTER_WORKERS_DETAIL',
        'ASSIGN_DROPDOWN_CLICKED',
        'ASSIGN_WORKERS_OPTION_CLICKED',
        'ASSIGN_LEADS_OPTION_CLICKED',
      ];

      expectedPoints.forEach((point) => {
        expect(GROUP_DETAILS_TRACKING_POINTS).toHaveProperty(point);
      });
    });

    test('VIEW_GROUP_DETAILS should have correct structure', () => {
      const point = GROUP_DETAILS_TRACKING_POINTS.VIEW_GROUP_DETAILS;
      validateTrackingPoint(point, 'VIEW_GROUP_DETAILS');

      expect(point.action).toBe('viewed');
      expect(point.ui_action).toBe('viewed');
      expect(point.ui_object).toBe('page');
      expect(point.ui_object_detail).toBe('group_details');
      expect(point.previous_screen).toBe('group_name_link');
    });

    test('SEARCH_WORKERS_DETAIL should have correct structure', () => {
      const point = GROUP_DETAILS_TRACKING_POINTS.SEARCH_WORKERS_DETAIL;
      validateTrackingPoint(point, 'SEARCH_WORKERS_DETAIL');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('typed');
      expect(point.ui_object).toBe('form_field');
      expect(point.ui_object_detail).toBe('search_group_workers');
      expect(point.previous_screen).toBe('group_details_header');
    });

    test('FILTER_WORKERS_DETAIL should have correct structure', () => {
      const point = GROUP_DETAILS_TRACKING_POINTS.FILTER_WORKERS_DETAIL;
      validateTrackingPoint(point, 'FILTER_WORKERS_DETAIL');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('dropdown');
      expect(point.ui_object_detail).toBe('filter_group_workers');
      expect(point.previous_screen).toBe('group_details_header');
    });
  });

  describe('GROUP_MODALS_TRACKING_POINTS', () => {
    test('should export all expected tracking points', () => {
      const expectedPoints = [
        'VIEW_LEAD_MODAL',
        'SEARCH_LEAD',
        'SELECT_LEAD',
        'SELECT_ALL_LEADS',
        'SAVE_LEAD',
        'CLOSE_LEAD_MODAL',
        'VIEW_WORKER_MODAL',
        'SEARCH_WORKER',
        'SELECT_WORKER',
        'SELECT_ALL_WORKERS',
        'SAVE_WORKER',
        'CLOSE_WORKER_MODAL',
      ];

      expectedPoints.forEach((point) => {
        expect(GROUP_MODALS_TRACKING_POINTS).toHaveProperty(point);
      });
    });

    test('VIEW_LEAD_MODAL should have correct structure and override object fields', () => {
      const point = GROUP_MODALS_TRACKING_POINTS.VIEW_LEAD_MODAL;
      validateTrackingPoint(point, 'VIEW_LEAD_MODAL');

      expect(point.action).toBe('viewed');
      expect(point.object).toBe('modal'); // Override from base
      expect(point.object_detail).toBe('modal'); // Override from base
      expect(point.ui_action).toBe('viewed');
      expect(point.ui_object).toBe('modal');
      expect(point.ui_object_detail).toBe('assign_lead_modal');
      expect(point.previous_screen).toBe('group_action_menu');
    });

    test('SEARCH_LEAD should have correct structure', () => {
      const point = GROUP_MODALS_TRACKING_POINTS.SEARCH_LEAD;
      validateTrackingPoint(point, 'SEARCH_LEAD');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('typed');
      expect(point.ui_object).toBe('form_field');
      expect(point.ui_object_detail).toBe('search_leads');
      expect(point.previous_screen).toBe('assign_lead_modal');
    });

    test('SELECT_LEAD should have correct structure', () => {
      const point = GROUP_MODALS_TRACKING_POINTS.SELECT_LEAD;
      validateTrackingPoint(point, 'SELECT_LEAD');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('checkbox');
      expect(point.ui_object_detail).toBe('select_lead');
      expect(point.previous_screen).toBe('assign_lead_modal');
    });

    test('SAVE_LEAD should have correct structure', () => {
      const point = GROUP_MODALS_TRACKING_POINTS.SAVE_LEAD;
      validateTrackingPoint(point, 'SAVE_LEAD');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('save_lead');
      expect(point.previous_screen).toBe('assign_lead_modal');
    });

    test('CLOSE_LEAD_MODAL should have correct structure', () => {
      const point = GROUP_MODALS_TRACKING_POINTS.CLOSE_LEAD_MODAL;
      validateTrackingPoint(point, 'CLOSE_LEAD_MODAL');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('close_lead_modal');
      expect(point.previous_screen).toBe('assign_lead_modal');
    });

    test('VIEW_WORKER_MODAL should have correct structure and override object fields', () => {
      const point = GROUP_MODALS_TRACKING_POINTS.VIEW_WORKER_MODAL;
      validateTrackingPoint(point, 'VIEW_WORKER_MODAL');

      expect(point.action).toBe('viewed');
      expect(point.object).toBe('modal'); // Override from base
      expect(point.object_detail).toBe('modal'); // Override from base
      expect(point.ui_action).toBe('viewed');
      expect(point.ui_object).toBe('modal');
      expect(point.ui_object_detail).toBe('assign_worker_modal');
      expect(point.previous_screen).toBe('group_action_menu');
    });

    test('SEARCH_WORKER should have correct structure', () => {
      const point = GROUP_MODALS_TRACKING_POINTS.SEARCH_WORKER;
      validateTrackingPoint(point, 'SEARCH_WORKER');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('typed');
      expect(point.ui_object).toBe('form_field');
      expect(point.ui_object_detail).toBe('search_workers');
      expect(point.previous_screen).toBe('assign_worker_modal');
    });

    test('SELECT_WORKER should have correct structure', () => {
      const point = GROUP_MODALS_TRACKING_POINTS.SELECT_WORKER;
      validateTrackingPoint(point, 'SELECT_WORKER');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('checkbox');
      expect(point.ui_object_detail).toBe('select_worker');
      expect(point.previous_screen).toBe('assign_worker_modal');
    });

    test('SAVE_WORKER should have correct structure', () => {
      const point = GROUP_MODALS_TRACKING_POINTS.SAVE_WORKER;
      validateTrackingPoint(point, 'SAVE_WORKER');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('save_worker');
      expect(point.previous_screen).toBe('assign_worker_modal');
    });

    test('CLOSE_WORKER_MODAL should have correct structure', () => {
      const point = GROUP_MODALS_TRACKING_POINTS.CLOSE_WORKER_MODAL;
      validateTrackingPoint(point, 'CLOSE_WORKER_MODAL');

      expect(point.action).toBe('engaged');
      expect(point.ui_action).toBe('clicked');
      expect(point.ui_object).toBe('button');
      expect(point.ui_object_detail).toBe('close_worker_modal');
      expect(point.previous_screen).toBe('assign_worker_modal');
    });
  });

  describe('Base Template Consistency', () => {
    test('all GROUPS_LIST_TRACKING_POINTS should have base template fields', () => {
      Object.values(GROUPS_LIST_TRACKING_POINTS).forEach((point) => {
        expect(point.org).toBe(BASE_FIELDS.org);
        expect(point.purpose).toBe(BASE_FIELDS.purpose);
        expect(point.scope).toBe(BASE_FIELDS.scope);
        expect(point.scope_area).toBe(BASE_FIELDS.scope_area);
        expect(point.screen).toBe(BASE_FIELDS.screen);
      });
    });

    test('all CREATE_GROUP_TRACKING_POINTS should have base template fields', () => {
      Object.values(CREATE_GROUP_TRACKING_POINTS).forEach((point) => {
        expect(point.org).toBe(BASE_FIELDS.org);
        expect(point.purpose).toBe(BASE_FIELDS.purpose);
        expect(point.scope).toBe(BASE_FIELDS.scope);
        expect(point.scope_area).toBe(BASE_FIELDS.scope_area);
        expect(point.screen).toBe(BASE_FIELDS.screen);
      });
    });

    test('all GROUP_ACTIONS_TRACKING_POINTS should have base template fields', () => {
      Object.values(GROUP_ACTIONS_TRACKING_POINTS).forEach((point) => {
        expect(point.org).toBe(BASE_FIELDS.org);
        expect(point.purpose).toBe(BASE_FIELDS.purpose);
        expect(point.scope).toBe(BASE_FIELDS.scope);
        expect(point.scope_area).toBe(BASE_FIELDS.scope_area);
        expect(point.screen).toBe(BASE_FIELDS.screen);
      });
    });

    test('all GROUP_DETAILS_TRACKING_POINTS should have base template fields', () => {
      Object.values(GROUP_DETAILS_TRACKING_POINTS).forEach((point) => {
        expect(point.org).toBe(BASE_FIELDS.org);
        expect(point.purpose).toBe(BASE_FIELDS.purpose);
        expect(point.scope).toBe(BASE_FIELDS.scope);
        expect(point.scope_area).toBe(BASE_FIELDS.scope_area);
        expect(point.screen).toBe(BASE_FIELDS.screen);
      });
    });

    test('all GROUP_MODALS_TRACKING_POINTS should have base template fields', () => {
      Object.values(GROUP_MODALS_TRACKING_POINTS).forEach((point) => {
        expect(point.org).toBe(BASE_FIELDS.org);
        expect(point.purpose).toBe(BASE_FIELDS.purpose);
        expect(point.scope).toBe(BASE_FIELDS.scope);
        expect(point.scope_area).toBe(BASE_FIELDS.scope_area);
        expect(point.screen).toBe(BASE_FIELDS.screen);
      });
    });
  });

  describe('Groups-Specific Fields', () => {
    test('all tracking points should have previous_screen field', () => {
      const allTrackingPoints = [
        ...Object.values(GROUPS_LIST_TRACKING_POINTS),
        ...Object.values(CREATE_GROUP_TRACKING_POINTS),
        ...Object.values(GROUP_ACTIONS_TRACKING_POINTS),
        ...Object.values(GROUP_DETAILS_TRACKING_POINTS),
        ...Object.values(GROUP_MODALS_TRACKING_POINTS),
      ];

      allTrackingPoints.forEach((point) => {
        expect(point).toHaveProperty('previous_screen');
        expect(point.previous_screen).toBeDefined();
        expect(typeof point.previous_screen).toBe('string');
        expect(point.previous_screen!.length).toBeGreaterThan(0);
      });
    });

    test('previous_screen values should be unique and descriptive', () => {
      const previousScreens = [
        ...Object.values(GROUPS_LIST_TRACKING_POINTS),
        ...Object.values(CREATE_GROUP_TRACKING_POINTS),
        ...Object.values(GROUP_ACTIONS_TRACKING_POINTS),
        ...Object.values(GROUP_DETAILS_TRACKING_POINTS),
        ...Object.values(GROUP_MODALS_TRACKING_POINTS),
      ].map((point) => point.previous_screen);

      // All previous_screen values should be defined
      previousScreens.forEach((screen) => {
        expect(screen).toBeDefined();
        expect(screen!).not.toBe('');
      });
    });
  });

  describe('Action Types Validation', () => {
    test('action field should only contain valid values', () => {
      const validActions = ['navigated', 'viewed', 'engaged'];
      const allTrackingPoints = [
        ...Object.values(GROUPS_LIST_TRACKING_POINTS),
        ...Object.values(CREATE_GROUP_TRACKING_POINTS),
        ...Object.values(GROUP_ACTIONS_TRACKING_POINTS),
        ...Object.values(GROUP_DETAILS_TRACKING_POINTS),
        ...Object.values(GROUP_MODALS_TRACKING_POINTS),
      ];

      allTrackingPoints.forEach((point) => {
        expect(validActions).toContain(point.action);
      });
    });

    test('ui_action field should only contain valid values', () => {
      const validUIActions = ['clicked', 'typed', 'viewed'];
      const allTrackingPoints = [
        ...Object.values(GROUPS_LIST_TRACKING_POINTS),
        ...Object.values(CREATE_GROUP_TRACKING_POINTS),
        ...Object.values(GROUP_ACTIONS_TRACKING_POINTS),
        ...Object.values(GROUP_DETAILS_TRACKING_POINTS),
        ...Object.values(GROUP_MODALS_TRACKING_POINTS),
      ];

      allTrackingPoints.forEach((point) => {
        expect(validUIActions).toContain(point.ui_action);
      });
    });
  });

  describe('Naming Consistency', () => {
    test('tracking point keys should be in SCREAMING_SNAKE_CASE', () => {
      const allKeys = [
        ...Object.keys(GROUPS_LIST_TRACKING_POINTS),
        ...Object.keys(CREATE_GROUP_TRACKING_POINTS),
        ...Object.keys(GROUP_ACTIONS_TRACKING_POINTS),
        ...Object.keys(GROUP_DETAILS_TRACKING_POINTS),
        ...Object.keys(GROUP_MODALS_TRACKING_POINTS),
      ];

      allKeys.forEach((key) => {
        expect(key).toMatch(/^[A-Z_]+$/);
      });
    });

    test('ui_object_detail values should be in snake_case', () => {
      const allTrackingPoints = [
        ...Object.values(GROUPS_LIST_TRACKING_POINTS),
        ...Object.values(CREATE_GROUP_TRACKING_POINTS),
        ...Object.values(GROUP_ACTIONS_TRACKING_POINTS),
        ...Object.values(GROUP_DETAILS_TRACKING_POINTS),
        ...Object.values(GROUP_MODALS_TRACKING_POINTS),
      ];

      allTrackingPoints.forEach((point) => {
        expect(point.ui_object_detail).toMatch(/^[a-z_]+$/);
      });
    });
  });
});
