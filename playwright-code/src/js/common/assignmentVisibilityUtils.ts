/**
 * Assignment Visibility Utilities
 *
 * These utilities implement the field visibility logic where assignment API
 * overrides company settings and UX preferences.
 *
 * Priority Chain: Company Settings → UX Preferences → Assignment API (OVERRIDES)
 */

export interface CompanySettings {
  isServiceFieldEnabled?: boolean;
  serviceItemRequired?: boolean;
  isClassEnabled?: boolean;
  classRequired?: boolean;
  isLocationEnabled?: boolean;
  locationRequired?: boolean;
  isBillingFieldEnabled?: boolean;
  requireBillable?: boolean;
  customFieldsEnabled?: Record<string, boolean>;
}

export interface UxPreferences {
  customFields?: Record<string, boolean>;
}

export interface CustomField {
  id: string;
  name: string;
  [key: string]: any;
}

export interface CustomFieldAssignment {
  id: string;
  assigned: boolean;
}

export interface StandardFieldAssignment {
  name: string;
  assigned: boolean;
}

/**
 * Determines if a custom field should be visible based on settings and assignments
 *
 * @param fieldId - Custom field ID
 * @param companySettings - Is field enabled in company settings
 * @param uxPreferences - Is field enabled in UX preferences
 * @param assignmentData - Assignment status from API (assigned: boolean)
 * @returns boolean - Should the field be visible?
 *
 * @example
 * // Field enabled in settings but NOT assigned
 * shouldShowCustomField('field1', { enabled: true }, { enabled: true }, { assigned: false })
 * // Returns: false (assignment overrides)
 *
 * @example
 * // Field disabled in settings but IS assigned
 * shouldShowCustomField('field1', { enabled: false }, { enabled: false }, { assigned: true })
 * // Returns: true (assignment overrides)
 */
export function shouldShowCustomField(
  fieldId: string,
  companySettings: { enabled: boolean },
  uxPreferences: { enabled: boolean },
  assignmentData: { assigned: boolean } | null,
): boolean {
  // If assignment data exists, it OVERRIDES settings
  if (assignmentData !== null) {
    return assignmentData.assigned;
  }

  // Fallback to settings if no assignment data
  return companySettings.enabled && uxPreferences.enabled;
}

/**
 * Determines if a standard field should be visible
 *
 * @param fieldName - 'service' | 'class' | 'location' | 'billable'
 * @param companySettings - Field settings from company
 * @param assignmentData - Assignment status from API
 * @returns boolean - Should the field be visible?
 *
 * @example
 * // Service enabled in settings but NOT assigned to customer
 * shouldShowStandardField('service', { enabled: true }, { assigned: false })
 * // Returns: false (assignment overrides)
 *
 * @example
 * // Service disabled in settings but IS assigned to customer
 * shouldShowStandardField('service', { enabled: false }, { assigned: true })
 * // Returns: true (assignment overrides)
 */
export function shouldShowStandardField(
  fieldName: string,
  companySettings: {
    enabled: boolean;
    required?: boolean;
  },
  assignmentData: { assigned: boolean } | null,
): boolean {
  // Assignment API overrides company settings
  if (assignmentData !== null) {
    return assignmentData.assigned;
  }

  // Fallback to company settings
  return companySettings.enabled;
}

/**
 * Filters custom fields based on assignment and settings
 *
 * @param allCustomFields - All available custom fields
 * @param companySettings - Company settings for custom fields
 * @param uxPreferences - UX preferences for custom fields
 * @param assignmentData - Assignment data from API
 * @returns Filtered list of visible custom fields
 *
 * @example
 * const visible = getVisibleCustomFields(
 *   allFields,
 *   companySettings,
 *   uxPreferences,
 *   [{ id: 'field1', assigned: true }, { id: 'field2', assigned: false }]
 * );
 * // Returns only fields that should be visible based on assignment override logic
 */
export function getVisibleCustomFields(
  allCustomFields: CustomField[],
  companySettings: CompanySettings,
  uxPreferences: UxPreferences,
  assignmentData: CustomFieldAssignment[],
): CustomField[] {
  return allCustomFields.filter((field) => {
    const assignment = assignmentData.find((a) => a.id === field.id);
    const settingsEnabled = companySettings.customFieldsEnabled?.[field.id];
    const prefsEnabled = uxPreferences.customFields?.[field.id];

    return shouldShowCustomField(
      field.id,
      { enabled: settingsEnabled ?? false },
      { enabled: prefsEnabled ?? false },
      assignment ? { assigned: assignment.assigned } : null,
    );
  });
}

/**
 * Gets visibility state for all standard fields
 *
 * @param companySettings - Company settings for all fields
 * @param assignmentData - Assignment data from API for standard fields
 * @returns Object with visibility state for each standard field
 *
 * @example
 * const visibility = getStandardFieldsVisibility(
 *   companySettings,
 *   [{ name: 'service', assigned: true }, { name: 'class', assigned: false }]
 * );
 * // Returns: { service: true, class: false, location: ..., billable: ... }
 */
export function getStandardFieldsVisibility(
  companySettings: CompanySettings,
  assignmentData: StandardFieldAssignment[],
): {
  service: boolean;
  class: boolean;
  location: boolean;
  billable: boolean;
} {
  const serviceAssignment = assignmentData.find((a) => a.name === 'service');
  const classAssignment = assignmentData.find((a) => a.name === 'class');
  const locationAssignment = assignmentData.find((a) => a.name === 'location');
  const billableAssignment = assignmentData.find((a) => a.name === 'billable');

  return {
    service: shouldShowStandardField(
      'service',
      {
        enabled: companySettings.isServiceFieldEnabled ?? false,
        required: companySettings.serviceItemRequired,
      },
      serviceAssignment ? { assigned: serviceAssignment.assigned } : null,
    ),
    class: shouldShowStandardField(
      'class',
      {
        enabled: companySettings.isClassEnabled ?? false,
        required: companySettings.classRequired,
      },
      classAssignment ? { assigned: classAssignment.assigned } : null,
    ),
    location: shouldShowStandardField(
      'location',
      {
        enabled: companySettings.isLocationEnabled ?? false,
        required: companySettings.locationRequired,
      },
      locationAssignment ? { assigned: locationAssignment.assigned } : null,
    ),
    billable: shouldShowStandardField(
      'billable',
      {
        enabled: companySettings.isBillingFieldEnabled ?? false,
        required: companySettings.requireBillable,
      },
      billableAssignment ? { assigned: billableAssignment.assigned } : null,
    ),
  };
}
