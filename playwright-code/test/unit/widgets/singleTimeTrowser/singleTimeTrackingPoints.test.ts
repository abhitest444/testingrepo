import {
  BASE_SINGLE_TIME_TRACKING_TEMPLATE,
  SINGLE_TIME_TRACKING_POINTS,
  SINGLE_TIME_ENTRY_TRACKING_POINTS,
  TRACKING_FIELD_NAMES,
} from 'src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';
import { createTrackingPoints } from 'src/js/common/useClickTracking';

describe('Single Time Tracking Points', () => {
  describe('BASE_SINGLE_TIME_TRACKING_TEMPLATE', () => {
    it('should have all required tracking field names', () => {
      const baseKeys = Object.keys(BASE_SINGLE_TIME_TRACKING_TEMPLATE);
      const fieldNames = Object.values(TRACKING_FIELD_NAMES);

      // Most field names should exist in base template
      // Some fields are added via overrides in SINGLE_TIME_ENTRY_TRACKING_POINTS
      const excludedFields = [
        'CURRENTLY_WORKING',
        'TIMEZONE',
        'CUSTOM_FIELD_LIST',
        'CUSTOM_FIELD_TEXT',
        'CUSTOM_FIELD_DROPDOWN',
        'CUSTOM_FIELD_NUMBER',
      ];
      fieldNames.forEach((fieldName) => {
        if (!excludedFields.includes(fieldName)) {
          expect(baseKeys).toContain(fieldName);
        }
      });
    });

    it('should have valid tracking point structure for all fields', () => {
      Object.entries(BASE_SINGLE_TIME_TRACKING_TEMPLATE).forEach(
        ([key, point]) => {
          expect(point).toHaveProperty('org');
          expect(point).toHaveProperty('purpose');
          expect(point).toHaveProperty('scope');
          expect(point).toHaveProperty('scope_area');
          expect(point).toHaveProperty('action');
          expect(point).toHaveProperty('object');
          expect(point).toHaveProperty('ui_action');
          expect(point).toHaveProperty('ui_object');

          // Check types
          expect(typeof point.org).toBe('string');
          expect(typeof point.purpose).toBe('string');
          expect(typeof point.scope).toBe('string');
          expect(typeof point.scope_area).toBe('string');
          expect(typeof point.action).toBe('string');
          expect(typeof point.object).toBe('string');
          expect(typeof point.ui_action).toBe('string');
          expect(typeof point.ui_object).toBe('string');
        },
      );
    });

    it('should have correct number of tracking points', () => {
      const baseKeys = Object.keys(BASE_SINGLE_TIME_TRACKING_TEMPLATE);
      // 45 base tracking points as per the original template
      expect(baseKeys.length).toBe(45);
    });

    it('should contain required core fields', () => {
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE).toHaveProperty('ON_MOUNT');
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE).toHaveProperty('START_DATE');
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE).toHaveProperty('END_DATE');
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE).toHaveProperty('TEAM_MEMBER');
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE).toHaveProperty('CUSTOMER');
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE).toHaveProperty('PROJECT');
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE).toHaveProperty('MILEAGE');
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE).toHaveProperty(
        'AUTO_CALCULATE_MILEAGE',
      );
    });
  });

  describe('TRACKING_FIELD_NAMES', () => {
    it('should export all field name constants', () => {
      expect(TRACKING_FIELD_NAMES).toHaveProperty('ON_MOUNT');
      expect(TRACKING_FIELD_NAMES).toHaveProperty('START_DATE');
      expect(TRACKING_FIELD_NAMES).toHaveProperty('MILEAGE');
      expect(TRACKING_FIELD_NAMES).toHaveProperty('AUTO_CALCULATE_MILEAGE');
      expect(TRACKING_FIELD_NAMES).toHaveProperty('CUSTOM_FIELD_LIST');
    });

    it('should have correct string values', () => {
      expect(TRACKING_FIELD_NAMES.ON_MOUNT).toBe('ON_MOUNT');
      expect(TRACKING_FIELD_NAMES.MILEAGE).toBe('MILEAGE');
      expect(TRACKING_FIELD_NAMES.AUTO_CALCULATE_MILEAGE).toBe(
        'AUTO_CALCULATE_MILEAGE',
      );
    });
  });

  describe('SINGLE_TIME_TRACKING_POINTS', () => {
    it('should be created with single_time_entry screen', () => {
      Object.values(SINGLE_TIME_TRACKING_POINTS).forEach((point) => {
        expect(point.screen).toBe('single_time_entry');
      });
    });

    it('should include all base template keys', () => {
      const baseKeys = Object.keys(BASE_SINGLE_TIME_TRACKING_TEMPLATE);
      const singleTimeKeys = Object.keys(SINGLE_TIME_TRACKING_POINTS);

      baseKeys.forEach((key) => {
        expect(singleTimeKeys).toContain(key);
      });
    });

    it('should have CURRENTLY_WORKING override', () => {
      expect(SINGLE_TIME_TRACKING_POINTS).toHaveProperty('CURRENTLY_WORKING');
      expect(SINGLE_TIME_TRACKING_POINTS.CURRENTLY_WORKING.screen).toBe(
        'single_time_entry',
      );
      expect(SINGLE_TIME_TRACKING_POINTS.CURRENTLY_WORKING.object).toBe(
        'component',
      );
      expect(SINGLE_TIME_TRACKING_POINTS.CURRENTLY_WORKING.object_detail).toBe(
        'currently_working',
      );
    });

    it('should preserve base template properties', () => {
      expect(SINGLE_TIME_TRACKING_POINTS.ON_MOUNT.org).toBe('sbseg');
      expect(SINGLE_TIME_TRACKING_POINTS.ON_MOUNT.purpose).toBe('prod');
      expect(SINGLE_TIME_TRACKING_POINTS.START_DATE.ui_object).toBe('dropdown');
    });
  });

  describe('SINGLE_TIME_ENTRY_TRACKING_POINTS', () => {
    it('should be created with single_time_tracking_time_entry screen', () => {
      Object.values(SINGLE_TIME_ENTRY_TRACKING_POINTS).forEach((point) => {
        expect(point.screen).toBe('single_time_tracking_time_entry');
      });
    });

    it('should include all base template keys', () => {
      const baseKeys = Object.keys(BASE_SINGLE_TIME_TRACKING_TEMPLATE);
      const singleTimeEntryKeys = Object.keys(
        SINGLE_TIME_ENTRY_TRACKING_POINTS,
      );

      baseKeys.forEach((key) => {
        expect(singleTimeEntryKeys).toContain(key);
      });
    });

    it('should have ON_MOUNT override with correct object_detail', () => {
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS.ON_MOUNT.object_detail).toBe(
        'view_single_time_tracking_time_entry',
      );
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS.ON_MOUNT.ui_object_detail).toBe(
        'view_single_time_tracking_time_entry',
      );
    });

    it('should have CURRENTLY_WORKING override', () => {
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS).toHaveProperty(
        'CURRENTLY_WORKING',
      );
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS.CURRENTLY_WORKING.screen).toBe(
        'single_time_tracking_time_entry',
      );
    });

    it('should have custom field overrides', () => {
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS).toHaveProperty('TIMEZONE');
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS).toHaveProperty(
        'CUSTOM_FIELD_LIST',
      );
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS).toHaveProperty(
        'CUSTOM_FIELD_TEXT',
      );
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS).toHaveProperty(
        'CUSTOM_FIELD_DROPDOWN',
      );
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS).toHaveProperty(
        'CUSTOM_FIELD_NUMBER',
      );

      // Verify screen is set correctly for custom fields
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS.TIMEZONE.screen).toBe(
        'single_time_tracking_time_entry',
      );
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS.CUSTOM_FIELD_LIST.screen).toBe(
        'single_time_tracking_time_entry',
      );
    });

    it('should have correct action and ui_action for TIMEZONE', () => {
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS.TIMEZONE.action).toBe('engaged');
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS.TIMEZONE.ui_action).toBe(
        'clicked',
      );
      expect(SINGLE_TIME_ENTRY_TRACKING_POINTS.TIMEZONE.ui_object).toBe(
        'form_field',
      );
    });
  });

  describe('Mileage tracking points', () => {
    it('should have MILEAGE tracking point in base template', () => {
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE).toHaveProperty('MILEAGE');
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE.MILEAGE.ui_action).toBe(
        'typed',
      );
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE.MILEAGE.ui_object).toBe(
        'form_field',
      );
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE.MILEAGE.ui_object_detail).toBe(
        'mileage',
      );
    });

    it('should have AUTO_CALCULATE_MILEAGE tracking point in base template', () => {
      expect(BASE_SINGLE_TIME_TRACKING_TEMPLATE).toHaveProperty(
        'AUTO_CALCULATE_MILEAGE',
      );
      expect(
        BASE_SINGLE_TIME_TRACKING_TEMPLATE.AUTO_CALCULATE_MILEAGE.ui_object,
      ).toBe('checkbox');
      expect(
        BASE_SINGLE_TIME_TRACKING_TEMPLATE.AUTO_CALCULATE_MILEAGE
          .ui_object_detail,
      ).toBe('auto_calculate');
    });

    it('should have correct mileage tracking in SINGLE_TIME_TRACKING_POINTS', () => {
      expect(SINGLE_TIME_TRACKING_POINTS.MILEAGE.screen).toBe(
        'single_time_entry',
      );
      expect(SINGLE_TIME_TRACKING_POINTS.AUTO_CALCULATE_MILEAGE.screen).toBe(
        'single_time_entry',
      );
    });
  });

  describe('Integration with createTrackingPoints', () => {
    it('should work correctly with createTrackingPoints function', () => {
      const result = createTrackingPoints(
        'test_screen',
        BASE_SINGLE_TIME_TRACKING_TEMPLATE,
        {
          ON_MOUNT: {
            object_detail: 'custom_detail',
          },
        },
      );

      expect(result.ON_MOUNT.screen).toBe('test_screen');
      expect(result.ON_MOUNT.object_detail).toBe('custom_detail');
      expect(result.ON_MOUNT.org).toBe('sbseg'); // Preserved from base
    });
  });
});
