/**
 * Test suite for User Settings Tracking Points
 *
 * Tests the tracking point constants used for analytics in the
 * User Settings Location Card components.
 */

import {
  LOCATION_CARD_VIEW_TRACKING_POINTS,
  LOCATION_CARD_EDIT_TRACKING_POINTS,
  UserSettingsTrackingPoint,
} from 'src/js/widgets/userSettings/utils/userSettingsTrackingPoints';
import {
  BASE_TIME_TRACKING_FIELDS,
  TRACKING_ACTIONS,
  UI_ACTIONS,
  UI_OBJECTS,
} from 'src/js/common/trackingConstants';

describe('userSettingsTrackingPoints', () => {
  // Base fields expected in all location tracking points
  const expectedBaseFields = {
    ...BASE_TIME_TRACKING_FIELDS,
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'time_user_settings',
    object: 'widget',
    object_detail: 'location_user settings',
  };

  describe('LOCATION_CARD_VIEW_TRACKING_POINTS', () => {
    describe('EDIT_LOCATION_CARD', () => {
      const trackingPoint =
        LOCATION_CARD_VIEW_TRACKING_POINTS.EDIT_LOCATION_CARD;

      test('should have correct base fields', () => {
        expect(trackingPoint).toMatchObject(expectedBaseFields);
      });

      test('should have action set to engaged', () => {
        expect(trackingPoint.action).toBe(TRACKING_ACTIONS.ENGAGED);
      });

      test('should have ui_action set to clicked', () => {
        expect(trackingPoint.ui_action).toBe(UI_ACTIONS.CLICKED);
      });

      test('should have ui_object set to button', () => {
        expect(trackingPoint.ui_object).toBe(UI_OBJECTS.BUTTON);
      });

      test('should have ui_object_detail set to edit', () => {
        expect(trackingPoint.ui_object_detail).toBe('edit');
      });
    });

    test('should export all expected tracking points', () => {
      expect(LOCATION_CARD_VIEW_TRACKING_POINTS).toHaveProperty(
        'EDIT_LOCATION_CARD',
      );
    });
  });

  describe('LOCATION_CARD_EDIT_TRACKING_POINTS', () => {
    describe('MANAGE_COMPANY_LOCATION_TRACKING', () => {
      const trackingPoint =
        LOCATION_CARD_EDIT_TRACKING_POINTS.MANAGE_COMPANY_LOCATION_TRACKING;

      test('should have correct base fields', () => {
        expect(trackingPoint).toMatchObject(expectedBaseFields);
      });

      test('should have action set to engaged', () => {
        expect(trackingPoint.action).toBe(TRACKING_ACTIONS.ENGAGED);
      });

      test('should have ui_action set to clicked', () => {
        expect(trackingPoint.ui_action).toBe(UI_ACTIONS.CLICKED);
      });

      test('should have ui_object set to link', () => {
        expect(trackingPoint.ui_object).toBe(UI_OBJECTS.LINK);
      });

      test('should have ui_object_detail set to manage_company_location_tracking', () => {
        expect(trackingPoint.ui_object_detail).toBe(
          'manage_company_location_tracking',
        );
      });
    });

    describe('USE_COMPANY_LEVEL_SETTINGS', () => {
      const trackingPoint =
        LOCATION_CARD_EDIT_TRACKING_POINTS.USE_COMPANY_LEVEL_SETTINGS;

      test('should have correct base fields', () => {
        expect(trackingPoint).toMatchObject(expectedBaseFields);
      });

      test('should have action set to engaged', () => {
        expect(trackingPoint.action).toBe(TRACKING_ACTIONS.ENGAGED);
      });

      test('should have ui_action set to clicked', () => {
        expect(trackingPoint.ui_action).toBe(UI_ACTIONS.CLICKED);
      });

      test('should have ui_object set to radio_button', () => {
        expect(trackingPoint.ui_object).toBe('radio_button');
      });

      test('should have ui_object_detail set to use_company_level_settings', () => {
        expect(trackingPoint.ui_object_detail).toBe(
          'use_company_level_settings',
        );
      });
    });

    describe('USE_CUSTOM_RULES_FOR_THIS_WORKER', () => {
      const trackingPoint =
        LOCATION_CARD_EDIT_TRACKING_POINTS.USE_CUSTOM_RULES_FOR_THIS_WORKER;

      test('should have correct base fields', () => {
        expect(trackingPoint).toMatchObject(expectedBaseFields);
      });

      test('should have action set to engaged', () => {
        expect(trackingPoint.action).toBe(TRACKING_ACTIONS.ENGAGED);
      });

      test('should have ui_action set to clicked', () => {
        expect(trackingPoint.ui_action).toBe(UI_ACTIONS.CLICKED);
      });

      test('should have ui_object set to radio_button', () => {
        expect(trackingPoint.ui_object).toBe('radio_button');
      });

      test('should have ui_object_detail set to use_custom_rules_for_this_worker', () => {
        expect(trackingPoint.ui_object_detail).toBe(
          'use_custom_rules_for_this_worker',
        );
      });
    });

    describe('LOCATION_TRACKING_REQUIRED', () => {
      const trackingPoint =
        LOCATION_CARD_EDIT_TRACKING_POINTS.LOCATION_TRACKING_REQUIRED;

      test('should have correct base fields', () => {
        expect(trackingPoint).toMatchObject(expectedBaseFields);
      });

      test('should have action set to engaged', () => {
        expect(trackingPoint.action).toBe(TRACKING_ACTIONS.ENGAGED);
      });

      test('should have ui_action set to clicked', () => {
        expect(trackingPoint.ui_action).toBe(UI_ACTIONS.CLICKED);
      });

      test('should have ui_object set to radio_button', () => {
        expect(trackingPoint.ui_object).toBe('radio_button');
      });

      test('should have ui_object_detail set to required', () => {
        expect(trackingPoint.ui_object_detail).toBe('required');
      });
    });

    describe('LOCATION_TRACKING_OPTIONAL', () => {
      const trackingPoint =
        LOCATION_CARD_EDIT_TRACKING_POINTS.LOCATION_TRACKING_OPTIONAL;

      test('should have correct base fields', () => {
        expect(trackingPoint).toMatchObject(expectedBaseFields);
      });

      test('should have action set to engaged', () => {
        expect(trackingPoint.action).toBe(TRACKING_ACTIONS.ENGAGED);
      });

      test('should have ui_action set to clicked', () => {
        expect(trackingPoint.ui_action).toBe(UI_ACTIONS.CLICKED);
      });

      test('should have ui_object set to radio_button', () => {
        expect(trackingPoint.ui_object).toBe('radio_button');
      });

      test('should have ui_object_detail set to optional', () => {
        expect(trackingPoint.ui_object_detail).toBe('optional');
      });
    });

    describe('LOCATION_TRACKING_OFF', () => {
      const trackingPoint =
        LOCATION_CARD_EDIT_TRACKING_POINTS.LOCATION_TRACKING_OFF;

      test('should have correct base fields', () => {
        expect(trackingPoint).toMatchObject(expectedBaseFields);
      });

      test('should have action set to engaged', () => {
        expect(trackingPoint.action).toBe(TRACKING_ACTIONS.ENGAGED);
      });

      test('should have ui_action set to clicked', () => {
        expect(trackingPoint.ui_action).toBe(UI_ACTIONS.CLICKED);
      });

      test('should have ui_object set to radio_button', () => {
        expect(trackingPoint.ui_object).toBe('radio_button');
      });

      test('should have ui_object_detail set to off', () => {
        expect(trackingPoint.ui_object_detail).toBe('off');
      });
    });

    describe('CANCEL_LOCATION_CARD', () => {
      const trackingPoint =
        LOCATION_CARD_EDIT_TRACKING_POINTS.CANCEL_LOCATION_CARD;

      test('should have correct base fields', () => {
        expect(trackingPoint).toMatchObject(expectedBaseFields);
      });

      test('should have action set to engaged', () => {
        expect(trackingPoint.action).toBe(TRACKING_ACTIONS.ENGAGED);
      });

      test('should have ui_action set to clicked', () => {
        expect(trackingPoint.ui_action).toBe(UI_ACTIONS.CLICKED);
      });

      test('should have ui_object set to button', () => {
        expect(trackingPoint.ui_object).toBe(UI_OBJECTS.BUTTON);
      });

      test('should have ui_object_detail set to cancel', () => {
        expect(trackingPoint.ui_object_detail).toBe('cancel');
      });
    });

    describe('SAVE_LOCATION_CARD', () => {
      const trackingPoint =
        LOCATION_CARD_EDIT_TRACKING_POINTS.SAVE_LOCATION_CARD;

      test('should have correct base fields', () => {
        expect(trackingPoint).toMatchObject(expectedBaseFields);
      });

      test('should have action set to engaged', () => {
        expect(trackingPoint.action).toBe(TRACKING_ACTIONS.ENGAGED);
      });

      test('should have ui_action set to clicked', () => {
        expect(trackingPoint.ui_action).toBe(UI_ACTIONS.CLICKED);
      });

      test('should have ui_object set to button', () => {
        expect(trackingPoint.ui_object).toBe(UI_OBJECTS.BUTTON);
      });

      test('should have ui_object_detail set to save', () => {
        expect(trackingPoint.ui_object_detail).toBe('save');
      });
    });

    test('should export all expected tracking points', () => {
      expect(LOCATION_CARD_EDIT_TRACKING_POINTS).toHaveProperty(
        'MANAGE_COMPANY_LOCATION_TRACKING',
      );
      expect(LOCATION_CARD_EDIT_TRACKING_POINTS).toHaveProperty(
        'USE_COMPANY_LEVEL_SETTINGS',
      );
      expect(LOCATION_CARD_EDIT_TRACKING_POINTS).toHaveProperty(
        'USE_CUSTOM_RULES_FOR_THIS_WORKER',
      );
      expect(LOCATION_CARD_EDIT_TRACKING_POINTS).toHaveProperty(
        'LOCATION_TRACKING_REQUIRED',
      );
      expect(LOCATION_CARD_EDIT_TRACKING_POINTS).toHaveProperty(
        'LOCATION_TRACKING_OPTIONAL',
      );
      expect(LOCATION_CARD_EDIT_TRACKING_POINTS).toHaveProperty(
        'LOCATION_TRACKING_OFF',
      );
      expect(LOCATION_CARD_EDIT_TRACKING_POINTS).toHaveProperty(
        'CANCEL_LOCATION_CARD',
      );
      expect(LOCATION_CARD_EDIT_TRACKING_POINTS).toHaveProperty(
        'SAVE_LOCATION_CARD',
      );
    });

    test('should have exactly 8 tracking points', () => {
      expect(Object.keys(LOCATION_CARD_EDIT_TRACKING_POINTS)).toHaveLength(8);
    });
  });

  describe('Tracking Point Consistency', () => {
    const allTrackingPoints = [
      ...Object.values(LOCATION_CARD_VIEW_TRACKING_POINTS),
      ...Object.values(LOCATION_CARD_EDIT_TRACKING_POINTS),
    ];

    test('all tracking points should have required base properties', () => {
      allTrackingPoints.forEach((point: UserSettingsTrackingPoint) => {
        expect(point).toHaveProperty('scope');
        expect(point).toHaveProperty('scope_area');
        expect(point).toHaveProperty('screen');
        expect(point).toHaveProperty('object');
        expect(point).toHaveProperty('object_detail');
        expect(point).toHaveProperty('action');
        expect(point).toHaveProperty('ui_action');
        expect(point).toHaveProperty('ui_object');
        expect(point).toHaveProperty('ui_object_detail');
      });
    });

    test('all tracking points should have consistent scope values', () => {
      allTrackingPoints.forEach((point: UserSettingsTrackingPoint) => {
        expect(point.scope).toBe('qbtime');
        expect(point.scope_area).toBe('time-tracking');
        expect(point.screen).toBe('time_user_settings');
      });
    });

    test('all tracking points should have consistent object values', () => {
      allTrackingPoints.forEach((point: UserSettingsTrackingPoint) => {
        expect(point.object).toBe('widget');
        expect(point.object_detail).toBe('location_user settings');
      });
    });

    test('all tracking points should have engaged action', () => {
      allTrackingPoints.forEach((point: UserSettingsTrackingPoint) => {
        expect(point.action).toBe('engaged');
      });
    });

    test('all tracking points should have clicked ui_action', () => {
      allTrackingPoints.forEach((point: UserSettingsTrackingPoint) => {
        expect(point.ui_action).toBe('clicked');
      });
    });
  });
});
