import {
  isStandardFieldAssigned,
  calculateStandardFieldsVisibility,
  getFallbackStandardFieldsVisibility,
  getStandardFieldsVisibilityWithAssignmentOverride,
  filterCustomFieldsByAssignment,
  shouldUseAssignmentLogic,
  isStandardFieldDisabled,
  isAnyStandardFieldDisabled,
  getStandardFieldAssignmentFilter,
  isAnyCustomFieldEnabled,
  getCustomFieldAssignmentFilter,
  getQuickFindAssignmentFilter,
} from '../../../src/js/common/assignmentFieldUtils';
import { MappedQLSettings } from '../../../src/js/service/hooks/settings/useGetQLSettings';

describe('assignmentFieldUtils', () => {
  describe('isStandardFieldAssigned', () => {
    it('should return true for uppercase API format', () => {
      const assignments = [{ name: 'SERVICE_ITEM' }, { name: 'CLASS' }];
      expect(isStandardFieldAssigned(assignments, 'service')).toBe(true);
      expect(isStandardFieldAssigned(assignments, 'class')).toBe(true);
    });

    it('should return true for lowercase format', () => {
      const assignments = [{ name: 'service' }, { name: 'class' }];
      expect(isStandardFieldAssigned(assignments, 'service')).toBe(true);
      expect(isStandardFieldAssigned(assignments, 'class')).toBe(true);
    });

    it('should return false when field is not assigned', () => {
      const assignments = [{ name: 'SERVICE_ITEM' }];
      expect(isStandardFieldAssigned(assignments, 'class')).toBe(false);
      expect(isStandardFieldAssigned(assignments, 'location')).toBe(false);
    });

    it('should return false for empty assignments', () => {
      expect(isStandardFieldAssigned([], 'service')).toBe(false);
    });
  });

  describe('calculateStandardFieldsVisibility', () => {
    it('should calculate visibility for all fields', () => {
      const assignments = [{ name: 'SERVICE_ITEM' }, { name: 'CLASS' }];

      const result = calculateStandardFieldsVisibility(assignments);

      expect(result).toEqual({
        service: true,
        class: true,
        location: false,
        billable: false,
      });
    });

    it('should return all false for empty assignments', () => {
      const result = calculateStandardFieldsVisibility([]);

      expect(result).toEqual({
        service: false,
        class: false,
        location: false,
        billable: false,
      });
    });

    it('should handle all fields assigned', () => {
      const assignments = [
        { name: 'SERVICE_ITEM' },
        { name: 'CLASS' },
        { name: 'LOCATION' },
        { name: 'BILLABLE' },
      ];

      const result = calculateStandardFieldsVisibility(assignments);

      expect(result).toEqual({
        service: true,
        class: true,
        location: true,
        billable: true,
      });
    });
  });

  describe('getFallbackStandardFieldsVisibility', () => {
    it('should return visibility from company settings', () => {
      const settings = {
        isServiceFieldEnabled: true,
        isClassEnabled: false,
        isLocationEnabled: true,
        isBillingFieldEnabled: false,
      };

      const result = getFallbackStandardFieldsVisibility(settings);

      expect(result).toEqual({
        service: true,
        class: false,
        location: true,
        billable: false,
      });
    });

    it('should handle undefined settings gracefully', () => {
      const settings = {};

      const result = getFallbackStandardFieldsVisibility(settings);

      expect(result).toEqual({
        service: false,
        class: false,
        location: false,
        billable: false,
      });
    });

    it('should handle null values', () => {
      const settings = {
        isServiceFieldEnabled: null,
        isClassEnabled: undefined,
      };

      const result = getFallbackStandardFieldsVisibility(settings);

      expect(result).toEqual({
        service: false,
        class: false,
        location: false,
        billable: false,
      });
    });
  });

  describe('getStandardFieldsVisibilityWithAssignmentOverride', () => {
    it('should show field when enabled in company settings', () => {
      const settings = {
        isServiceFieldEnabled: true,
        isClassEnabled: false,
        isLocationEnabled: true,
        isBillingFieldEnabled: false,
      };
      const result = getStandardFieldsVisibilityWithAssignmentOverride(
        settings,
        [],
      );
      expect(result.service).toBe(true);
      expect(result.class).toBe(false);
      expect(result.location).toBe(true);
      expect(result.billable).toBe(false);
    });

    it('should show field when disabled in settings but present in SF response (assigned)', () => {
      const settings = {
        isServiceFieldEnabled: false,
        isClassEnabled: false,
        isLocationEnabled: false,
        isBillingFieldEnabled: false,
      };
      const assignments = [
        { name: 'SERVICE_ITEM', assigned: true },
        { name: 'CLASS', assigned: true },
      ];
      const result = getStandardFieldsVisibilityWithAssignmentOverride(
        settings,
        assignments,
      );
      expect(result.service).toBe(true);
      expect(result.class).toBe(true);
      expect(result.location).toBe(false);
      expect(result.billable).toBe(false);
    });

    it('should merge settings and assignment (show if either enables)', () => {
      const settings = {
        isServiceFieldEnabled: true,
        isClassEnabled: false,
        isLocationEnabled: false,
        isBillingFieldEnabled: false,
      };
      const assignments = [
        { name: 'CLASS', assigned: true },
        { name: 'LOCATION', assigned: true },
      ];
      const result = getStandardFieldsVisibilityWithAssignmentOverride(
        settings,
        assignments,
      );
      expect(result.service).toBe(true);
      expect(result.class).toBe(true);
      expect(result.location).toBe(true);
      expect(result.billable).toBe(false);
    });
  });

  describe('filterCustomFieldsByAssignment', () => {
    it('should filter custom fields by assigned IDs', () => {
      const customFields = [
        { id: '1', name: 'Field 1' },
        { id: '2', name: 'Field 2' },
        { id: '3', name: 'Field 3' },
      ];
      const assignedIds = new Set(['1', '3']);

      const result = filterCustomFieldsByAssignment(customFields, assignedIds);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: '1', name: 'Field 1' },
        { id: '3', name: 'Field 3' },
      ]);
    });

    it('should return empty array when no fields are assigned', () => {
      const customFields = [
        { id: '1', name: 'Field 1' },
        { id: '2', name: 'Field 2' },
      ];
      const assignedIds = new Set<string>([]);

      const result = filterCustomFieldsByAssignment(customFields, assignedIds);

      expect(result).toHaveLength(0);
    });

    it('should handle empty custom fields array', () => {
      const customFields: any[] = [];
      const assignedIds = new Set(['1', '2']);

      const result = filterCustomFieldsByAssignment(customFields, assignedIds);

      expect(result).toHaveLength(0);
    });
  });

  describe('shouldUseAssignmentLogic', () => {
    it('should return true when all conditions are met', () => {
      const result = shouldUseAssignmentLogic(
        true, // feature flag enabled
        true, // has customer/project
        false, // no error
      );

      expect(result).toBe(true);
    });

    it('should return false when feature flag disabled', () => {
      const result = shouldUseAssignmentLogic(false, true, false);
      expect(result).toBe(false);
    });

    it('should return false when no customer/project', () => {
      const result = shouldUseAssignmentLogic(true, false, false);
      expect(result).toBe(false);
    });

    it('should return false when there is an error', () => {
      const result = shouldUseAssignmentLogic(true, true, true);
      expect(result).toBe(false);
    });

    it('should return false when multiple conditions fail', () => {
      const result = shouldUseAssignmentLogic(false, false, true);
      expect(result).toBe(false);
    });
  });

  describe('isStandardFieldDisabled', () => {
    it('should return true when SERVICE_ITEM is disabled in company settings', () => {
      const settings = {
        isServiceFieldEnabled: { value: false },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = isStandardFieldDisabled('SERVICE_ITEM', settings);
      expect(result).toBe(true);
    });

    it('should return false when SERVICE_ITEM is enabled in company settings', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = isStandardFieldDisabled('SERVICE_ITEM', settings);
      expect(result).toBe(false);
    });

    it('should return true when BILLABLE is disabled in company settings', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: false },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = isStandardFieldDisabled('BILLABLE', settings);
      expect(result).toBe(true);
    });

    it('should return false when BILLABLE is enabled in company settings', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = isStandardFieldDisabled('BILLABLE', settings);
      expect(result).toBe(false);
    });

    it('should return true when CLASS is disabled in company settings', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: false },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = isStandardFieldDisabled('CLASS', settings);
      expect(result).toBe(true);
    });

    it('should return false when CLASS is enabled in company settings', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = isStandardFieldDisabled('CLASS', settings);
      expect(result).toBe(false);
    });

    it('should return true when LOCATION is disabled in company settings', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: false },
      } as MappedQLSettings;

      const result = isStandardFieldDisabled('LOCATION', settings);
      expect(result).toBe(true);
    });

    it('should return false when LOCATION is enabled in company settings', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = isStandardFieldDisabled('LOCATION', settings);
      expect(result).toBe(false);
    });

    it('should return true when field setting is undefined', () => {
      const settings = {} as MappedQLSettings;

      const result = isStandardFieldDisabled('SERVICE_ITEM', settings);
      expect(result).toBe(true);
    });

    it('should return true when field setting is null', () => {
      const settings = {
        isServiceFieldEnabled: null,
      } as unknown as MappedQLSettings;

      const result = isStandardFieldDisabled('SERVICE_ITEM', settings);
      expect(result).toBe(true);
    });

    it('should return true when field setting value is undefined', () => {
      const settings = {
        isServiceFieldEnabled: { value: undefined },
      } as unknown as MappedQLSettings;

      const result = isStandardFieldDisabled('SERVICE_ITEM', settings);
      expect(result).toBe(true);
    });

    it('should return true for unknown field name', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = isStandardFieldDisabled('UNKNOWN_FIELD', settings);
      expect(result).toBe(true);
    });

    it('should handle all fields disabled', () => {
      const settings = {
        isServiceFieldEnabled: { value: false },
        isBillingFieldEnabled: { value: false },
        classForTimeSheetEnabled: { value: false },
        locationForTimeSheetEnabled: { value: false },
      } as MappedQLSettings;

      expect(isStandardFieldDisabled('SERVICE_ITEM', settings)).toBe(true);
      expect(isStandardFieldDisabled('BILLABLE', settings)).toBe(true);
      expect(isStandardFieldDisabled('CLASS', settings)).toBe(true);
      expect(isStandardFieldDisabled('LOCATION', settings)).toBe(true);
    });

    it('should handle all fields enabled', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      expect(isStandardFieldDisabled('SERVICE_ITEM', settings)).toBe(false);
      expect(isStandardFieldDisabled('BILLABLE', settings)).toBe(false);
      expect(isStandardFieldDisabled('CLASS', settings)).toBe(false);
      expect(isStandardFieldDisabled('LOCATION', settings)).toBe(false);
    });

    it('should handle mixed enabled/disabled fields', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: false },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: false },
      } as MappedQLSettings;

      expect(isStandardFieldDisabled('SERVICE_ITEM', settings)).toBe(false);
      expect(isStandardFieldDisabled('BILLABLE', settings)).toBe(true);
      expect(isStandardFieldDisabled('CLASS', settings)).toBe(false);
      expect(isStandardFieldDisabled('LOCATION', settings)).toBe(true);
    });
  });

  describe('isAnyStandardFieldDisabled', () => {
    it('should return true when at least one SF is disabled', () => {
      const settings = {
        isServiceFieldEnabled: false,
        isBillingFieldEnabled: true,
        isClassEnabled: true,
        isLocationEnabled: true,
      };

      expect(isAnyStandardFieldDisabled(settings)).toBe(true);
    });

    it('should return false when all SFs are enabled', () => {
      const settings = {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        isClassEnabled: true,
        isLocationEnabled: true,
      };

      expect(isAnyStandardFieldDisabled(settings)).toBe(false);
    });

    it('should return true when all SFs are disabled', () => {
      const settings = {
        isServiceFieldEnabled: false,
        isBillingFieldEnabled: false,
        isClassEnabled: false,
        isLocationEnabled: false,
      };

      expect(isAnyStandardFieldDisabled(settings)).toBe(true);
    });

    it('should return true when settings are undefined', () => {
      expect(isAnyStandardFieldDisabled({})).toBe(true);
    });

    it('should return true when multiple fields are disabled', () => {
      const settings = {
        isServiceFieldEnabled: false,
        isBillingFieldEnabled: false,
        isClassEnabled: true,
        isLocationEnabled: true,
      };

      expect(isAnyStandardFieldDisabled(settings)).toBe(true);
    });
  });

  describe('getStandardFieldAssignmentFilter', () => {
    it('should return assigned: true when any SF is disabled', () => {
      const settings = {
        isServiceFieldEnabled: false,
        isBillingFieldEnabled: true,
        isClassEnabled: true,
        isLocationEnabled: true,
      };

      const result = getStandardFieldAssignmentFilter(settings);
      expect(result).toEqual({ assigned: true });
    });

    it('should return assigned: null when all SFs are enabled', () => {
      const settings = {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        isClassEnabled: true,
        isLocationEnabled: true,
      };

      const result = getStandardFieldAssignmentFilter(settings);
      expect(result).toEqual({ assigned: null });
    });

    it('should return assigned: true when all SFs are disabled', () => {
      const settings = {
        isServiceFieldEnabled: false,
        isBillingFieldEnabled: false,
        isClassEnabled: false,
        isLocationEnabled: false,
      };

      const result = getStandardFieldAssignmentFilter(settings);
      expect(result).toEqual({ assigned: true });
    });

    it('should return assigned: true when settings are empty', () => {
      const result = getStandardFieldAssignmentFilter({});
      expect(result).toEqual({ assigned: true });
    });
  });

  describe('isAnyCustomFieldEnabled', () => {
    it('should return true when at least one CF is enabled', () => {
      const settings = {
        customFieldsEnabled: {
          'cf-1': true,
          'cf-2': false,
          'cf-3': false,
        },
      };

      expect(isAnyCustomFieldEnabled(settings)).toBe(true);
    });

    it('should return false when all CFs are disabled', () => {
      const settings = {
        customFieldsEnabled: {
          'cf-1': false,
          'cf-2': false,
          'cf-3': false,
        },
      };

      expect(isAnyCustomFieldEnabled(settings)).toBe(false);
    });

    it('should return false when customFieldsEnabled is undefined', () => {
      const settings = {};

      expect(isAnyCustomFieldEnabled(settings)).toBe(false);
    });

    it('should return false when customFieldsEnabled is null', () => {
      const settings = {
        customFieldsEnabled: null,
      };

      expect(isAnyCustomFieldEnabled(settings)).toBe(false);
    });

    it('should return false when customFieldsEnabled is not an object', () => {
      const settings = {
        customFieldsEnabled: 'not-an-object',
      };

      expect(isAnyCustomFieldEnabled(settings)).toBe(false);
    });

    it('should return true when multiple CFs are enabled', () => {
      const settings = {
        customFieldsEnabled: {
          'cf-1': true,
          'cf-2': true,
          'cf-3': false,
        },
      };

      expect(isAnyCustomFieldEnabled(settings)).toBe(true);
    });
  });

  describe('getCustomFieldAssignmentFilter', () => {
    it('should return assigned: true when allCustomFields has items', () => {
      const settings = {};
      const allCustomFields = [
        { id: 'cf-1', name: 'Field 1' },
        { id: 'cf-2', name: 'Field 2' },
      ];

      const result = getCustomFieldAssignmentFilter(settings, allCustomFields);
      expect(result).toEqual({ assigned: true });
    });

    it('should return assigned: null when allCustomFields is empty', () => {
      const settings = {};
      const allCustomFields: any[] = [];

      const result = getCustomFieldAssignmentFilter(settings, allCustomFields);
      expect(result).toEqual({ assigned: null });
    });

    it('should return assigned: null when allCustomFields is undefined', () => {
      const settings = {};

      const result = getCustomFieldAssignmentFilter(settings, undefined);
      expect(result).toEqual({ assigned: null });
    });

    it('should return assigned: true when allCustomFields has one item', () => {
      const settings = {};
      const allCustomFields = [{ id: 'cf-1', name: 'Field 1' }];

      const result = getCustomFieldAssignmentFilter(settings, allCustomFields);
      expect(result).toEqual({ assigned: true });
    });
  });

  describe('getQuickFindAssignmentFilter', () => {
    it('should return true for service when service is disabled', () => {
      const settings = {
        isServiceFieldEnabled: { value: false },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = getQuickFindAssignmentFilter('service', settings);
      expect(result).toBe(true);
    });

    it('should return null for service when service is enabled', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = getQuickFindAssignmentFilter('service', settings);
      expect(result).toBeNull();
    });

    it('should return true for class when class is disabled', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: false },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = getQuickFindAssignmentFilter('class', settings);
      expect(result).toBe(true);
    });

    it('should return null for class when class is enabled', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = getQuickFindAssignmentFilter('class', settings);
      expect(result).toBeNull();
    });

    it('should return true for location when location is disabled', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: false },
      } as MappedQLSettings;

      const result = getQuickFindAssignmentFilter('location', settings);
      expect(result).toBe(true);
    });

    it('should return null for location when location is enabled', () => {
      const settings = {
        isServiceFieldEnabled: { value: true },
        isBillingFieldEnabled: { value: true },
        classForTimeSheetEnabled: { value: true },
        locationForTimeSheetEnabled: { value: true },
      } as MappedQLSettings;

      const result = getQuickFindAssignmentFilter('location', settings);
      expect(result).toBeNull();
    });

    it('should handle undefined settings', () => {
      const result = getQuickFindAssignmentFilter(
        'service',
        {} as MappedQLSettings,
      );
      expect(result).toBe(true);
    });

    it('should handle null field values', () => {
      const settings = {
        isServiceFieldEnabled: null,
        classForTimeSheetEnabled: null,
        locationForTimeSheetEnabled: null,
      } as unknown as MappedQLSettings;

      expect(getQuickFindAssignmentFilter('service', settings)).toBe(true);
      expect(getQuickFindAssignmentFilter('class', settings)).toBe(true);
      expect(getQuickFindAssignmentFilter('location', settings)).toBe(true);
    });
  });
});
