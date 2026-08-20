import {
  shouldShowCustomField,
  shouldShowStandardField,
  getVisibleCustomFields,
  getStandardFieldsVisibility,
  CustomField,
  CompanySettings,
  UxPreferences,
  CustomFieldAssignment,
  StandardFieldAssignment,
} from 'src/js/common/assignmentVisibilityUtils';

describe('assignmentVisibilityUtils', () => {
  describe('shouldShowCustomField', () => {
    it('should return true when assignment is assigned (overrides settings)', () => {
      const result = shouldShowCustomField(
        'field1',
        { enabled: false }, // disabled in settings
        { enabled: false }, // disabled in preferences
        { assigned: true }, // BUT assigned via API
      );
      expect(result).toBe(true);
    });

    it('should return false when assignment is not assigned (overrides settings)', () => {
      const result = shouldShowCustomField(
        'field1',
        { enabled: true }, // enabled in settings
        { enabled: true }, // enabled in preferences
        { assigned: false }, // BUT not assigned via API
      );
      expect(result).toBe(false);
    });

    it('should fallback to settings when no assignment data', () => {
      const result = shouldShowCustomField(
        'field1',
        { enabled: true },
        { enabled: true },
        null, // no assignment data
      );
      expect(result).toBe(true);
    });

    it('should return false when settings disabled and no assignment', () => {
      const result = shouldShowCustomField(
        'field1',
        { enabled: false },
        { enabled: true },
        null,
      );
      expect(result).toBe(false);
    });

    it('should return false when preferences disabled and no assignment', () => {
      const result = shouldShowCustomField(
        'field1',
        { enabled: true },
        { enabled: false },
        null,
      );
      expect(result).toBe(false);
    });

    it('should handle both settings and preferences disabled', () => {
      const result = shouldShowCustomField(
        'field1',
        { enabled: false },
        { enabled: false },
        null,
      );
      expect(result).toBe(false);
    });
  });

  describe('shouldShowStandardField', () => {
    it('should return true when assignment is assigned (overrides settings)', () => {
      const result = shouldShowStandardField(
        'service',
        { enabled: false, required: false }, // disabled in settings
        { assigned: true }, // BUT assigned via API
      );
      expect(result).toBe(true);
    });

    it('should return false when assignment is not assigned (overrides settings)', () => {
      const result = shouldShowStandardField(
        'service',
        { enabled: true, required: true }, // enabled in settings
        { assigned: false }, // BUT not assigned via API
      );
      expect(result).toBe(false);
    });

    it('should fallback to company settings when no assignment data', () => {
      const result = shouldShowStandardField(
        'service',
        { enabled: true },
        null, // no assignment data
      );
      expect(result).toBe(true);
    });

    it('should return false when settings disabled and no assignment', () => {
      const result = shouldShowStandardField(
        'service',
        { enabled: false },
        null,
      );
      expect(result).toBe(false);
    });

    it('should handle required fields correctly', () => {
      const result = shouldShowStandardField(
        'service',
        { enabled: true, required: true },
        null,
      );
      expect(result).toBe(true);
    });
  });

  describe('getVisibleCustomFields', () => {
    const mockCustomFields: CustomField[] = [
      { id: 'field1', name: 'Field 1' },
      { id: 'field2', name: 'Field 2' },
      { id: 'field3', name: 'Field 3' },
    ];

    it('should filter fields based on assignment data (assignment overrides)', () => {
      const companySettings: CompanySettings = {
        customFieldsEnabled: {
          field1: true, // enabled
          field2: true, // enabled
          field3: false, // disabled
        },
      };

      const uxPreferences: UxPreferences = {
        customFields: {
          field1: true,
          field2: true,
          field3: false,
        },
      };

      const assignmentData: CustomFieldAssignment[] = [
        { id: 'field1', assigned: false }, // enabled but NOT assigned → hide
        { id: 'field2', assigned: true }, // enabled and assigned → show
        { id: 'field3', assigned: true }, // disabled but assigned → show (override)
      ];

      const result = getVisibleCustomFields(
        mockCustomFields,
        companySettings,
        uxPreferences,
        assignmentData,
      );

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.id)).toEqual(['field2', 'field3']);
    });

    it('should fallback to settings when no assignment data', () => {
      const companySettings: CompanySettings = {
        customFieldsEnabled: {
          field1: true,
          field2: false,
          field3: true,
        },
      };

      const uxPreferences: UxPreferences = {
        customFields: {
          field1: true,
          field2: true,
          field3: false,
        },
      };

      const assignmentData: CustomFieldAssignment[] = [];

      const result = getVisibleCustomFields(
        mockCustomFields,
        companySettings,
        uxPreferences,
        assignmentData,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('field1'); // only field1 has both enabled
    });

    it('should handle empty custom fields array', () => {
      const result = getVisibleCustomFields([], {}, {}, []);

      expect(result).toEqual([]);
    });

    it('should handle missing settings gracefully', () => {
      const companySettings: CompanySettings = {
        customFieldsEnabled: {},
      };

      const uxPreferences: UxPreferences = {
        customFields: {},
      };

      const assignmentData: CustomFieldAssignment[] = [
        { id: 'field1', assigned: true },
      ];

      const result = getVisibleCustomFields(
        mockCustomFields,
        companySettings,
        uxPreferences,
        assignmentData,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('field1'); // shown because assigned
    });

    it('should handle undefined customFieldsEnabled', () => {
      const companySettings: CompanySettings = {};

      const uxPreferences: UxPreferences = {};

      const assignmentData: CustomFieldAssignment[] = [
        { id: 'field1', assigned: true },
      ];

      const result = getVisibleCustomFields(
        mockCustomFields,
        companySettings,
        uxPreferences,
        assignmentData,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('field1');
    });
  });

  describe('getStandardFieldsVisibility', () => {
    it('should return visibility based on assignment data (assignment overrides)', () => {
      const companySettings: CompanySettings = {
        isServiceFieldEnabled: true, // enabled
        isClassEnabled: true, // enabled
        isLocationEnabled: false, // disabled
        isBillingFieldEnabled: true, // enabled
      };

      const assignmentData: StandardFieldAssignment[] = [
        { name: 'service', assigned: false }, // enabled but NOT assigned → hide
        { name: 'class', assigned: true }, // enabled and assigned → show
        { name: 'location', assigned: true }, // disabled but assigned → show (override)
        // billable not in assignment data → fallback to settings
      ];

      const result = getStandardFieldsVisibility(
        companySettings,
        assignmentData,
      );

      expect(result).toEqual({
        service: false, // assignment overrides (false)
        class: true, // assignment overrides (true)
        location: true, // assignment overrides (true, even though settings disabled)
        billable: true, // fallback to settings (true)
      });
    });

    it('should fallback to settings when no assignment data', () => {
      const companySettings: CompanySettings = {
        isServiceFieldEnabled: true,
        isClassEnabled: false,
        isLocationEnabled: true,
        isBillingFieldEnabled: false,
      };

      const assignmentData: StandardFieldAssignment[] = [];

      const result = getStandardFieldsVisibility(
        companySettings,
        assignmentData,
      );

      expect(result).toEqual({
        service: true,
        class: false,
        location: true,
        billable: false,
      });
    });

    it('should handle all fields assigned', () => {
      const companySettings: CompanySettings = {
        isServiceFieldEnabled: false,
        isClassEnabled: false,
        isLocationEnabled: false,
        isBillingFieldEnabled: false,
      };

      const assignmentData: StandardFieldAssignment[] = [
        { name: 'service', assigned: true },
        { name: 'class', assigned: true },
        { name: 'location', assigned: true },
        { name: 'billable', assigned: true },
      ];

      const result = getStandardFieldsVisibility(
        companySettings,
        assignmentData,
      );

      expect(result).toEqual({
        service: true,
        class: true,
        location: true,
        billable: true,
      });
    });

    it('should handle all fields not assigned', () => {
      const companySettings: CompanySettings = {
        isServiceFieldEnabled: true,
        isClassEnabled: true,
        isLocationEnabled: true,
        isBillingFieldEnabled: true,
      };

      const assignmentData: StandardFieldAssignment[] = [
        { name: 'service', assigned: false },
        { name: 'class', assigned: false },
        { name: 'location', assigned: false },
        { name: 'billable', assigned: false },
      ];

      const result = getStandardFieldsVisibility(
        companySettings,
        assignmentData,
      );

      expect(result).toEqual({
        service: false,
        class: false,
        location: false,
        billable: false,
      });
    });

    it('should handle undefined settings gracefully', () => {
      const companySettings: CompanySettings = {};

      const assignmentData: StandardFieldAssignment[] = [
        { name: 'service', assigned: true },
      ];

      const result = getStandardFieldsVisibility(
        companySettings,
        assignmentData,
      );

      expect(result).toEqual({
        service: true, // assigned
        class: false, // no setting, no assignment
        location: false, // no setting, no assignment
        billable: false, // no setting, no assignment
      });
    });

    it('should handle empty assignment data', () => {
      const companySettings: CompanySettings = {
        isServiceFieldEnabled: true,
        serviceItemRequired: true,
        isClassEnabled: true,
        classRequired: false,
        isLocationEnabled: false,
        locationRequired: false,
        isBillingFieldEnabled: true,
        requireBillable: true,
      };

      const assignmentData: StandardFieldAssignment[] = [];

      const result = getStandardFieldsVisibility(
        companySettings,
        assignmentData,
      );

      expect(result).toEqual({
        service: true,
        class: true,
        location: false,
        billable: true,
      });
    });
  });
});
