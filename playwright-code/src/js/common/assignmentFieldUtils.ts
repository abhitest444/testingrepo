/**
 * Common utility functions for assignment-based field visibility
 * Shared between STE and WTE implementations
 */

import { MappedQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';

/**
 * Check if a standard field is assigned in the assignment response
 * Handles both uppercase API format and lowercase formats
 *
 * @param assignments - Array of standard field assignments
 * @param fieldName - Field name to check (e.g., 'service', 'class')
 * @returns boolean - Whether the field is assigned
 */
export const isStandardFieldAssigned = (
  assignments: Array<{ name?: string }>,
  fieldName: 'service' | 'class' | 'location' | 'billable',
): boolean => {
  const fieldNameMap: Record<string, string[]> = {
    service: ['SERVICE_ITEM', 'service'],
    class: ['CLASS', 'class'],
    location: ['LOCATION', 'location'],
    billable: ['BILLABLE', 'billable'],
  };

  const possibleNames = fieldNameMap[fieldName];
  const normalized = (a: { name?: string }) =>
    (a.name || '').trim().toUpperCase();
  return assignments.some((a) =>
    possibleNames.some(
      (p) => normalized(a) === p.toUpperCase() || (a.name || '').trim() === p,
    ),
  );
};

/**
 * Calculate standard fields visibility from assignment data
 *
 * @param assignments - Array of standard field assignments
 * @returns Object with boolean flags for each standard field
 */
export const calculateStandardFieldsVisibility = (
  assignments: Array<{ name: string }>,
): {
  service: boolean;
  class: boolean;
  location: boolean;
  billable: boolean;
} => ({
  service: isStandardFieldAssigned(assignments, 'service'),
  class: isStandardFieldAssigned(assignments, 'class'),
  location: isStandardFieldAssigned(assignments, 'location'),
  billable: isStandardFieldAssigned(assignments, 'billable'),
});

/**
 * Get fallback visibility based on company settings
 * Used when assignments are not available (no customer, API error, feature flag off)
 *
 * @param companySettings - Company settings object
 * @returns Object with boolean flags for each standard field
 */
export const getFallbackStandardFieldsVisibility = (
  companySettings: any,
): {
  service: boolean;
  class: boolean;
  location: boolean;
  billable: boolean;
} => ({
  service: companySettings.isServiceFieldEnabled ?? false,
  class: companySettings.isClassEnabled ?? false,
  location: companySettings.isLocationEnabled ?? false,
  billable: companySettings.isBillingFieldEnabled ?? false,
});

/**
 * Standard field visibility: use company settings first; when a field is disabled
 * in settings, still show it if the SF assignment response includes it (assigned for this customer).
 * So: show if (company setting enabled) OR (field present in SF response).
 *
 * @param companySettings - Company settings object
 * @param standardFieldAssignments - SF API response (assignments for this customer)
 * @returns Object with boolean flags for each standard field
 */
export const getStandardFieldsVisibilityWithAssignmentOverride = (
  companySettings: any,
  standardFieldAssignments: Array<{ name?: string; assigned?: boolean }>,
): {
  service: boolean;
  class: boolean;
  location: boolean;
  billable: boolean;
} => {
  const fallback = getFallbackStandardFieldsVisibility(companySettings);
  const assignedOnly = (standardFieldAssignments || [])
    .filter(
      (a): a is { name: string; assigned: true } =>
        a.assigned === true && typeof a.name === 'string',
    )
    .map((a) => ({ name: a.name }));
  const fromAssignment = calculateStandardFieldsVisibility(assignedOnly);
  return {
    service: fallback.service || fromAssignment.service,
    class: fallback.class || fromAssignment.class,
    location: fallback.location || fromAssignment.location,
    billable: fallback.billable || fromAssignment.billable,
  };
};

/**
 * Filter custom fields by assignment IDs
 *
 * @param allCustomFields - All available custom fields
 * @param assignedFieldIds - Set of assigned custom field IDs
 * @returns Filtered array of custom fields
 */
export const filterCustomFieldsByAssignment = (
  allCustomFields: any[],
  assignedFieldIds: Set<string>,
): any[] => allCustomFields.filter((field) => assignedFieldIds.has(field.id));

/**
 * Determine if assignments should be used based on conditions
 *
 * @param isTimeEntry - Precondition that gates assignment logic
 * @param hasCustomerOrProject - Has customer or project selected
 * @param hasError - Has API error
 * @returns boolean - Whether to use assignments
 */
export const shouldUseAssignmentLogic = (
  isTimeEntry: boolean,
  hasCustomerOrProject: boolean,
  hasError: boolean,
): boolean => isTimeEntry && hasCustomerOrProject && !hasError;

/**
 * Check if a standard field is disabled in company settings.
 * Supports both settings shapes so SFO gets correct assigned filter in WTE, STE, and TC:
 * - QL shape: isServiceFieldEnabled?.value, classForTimeSheetEnabled?.value, locationForTimeSheetEnabled?.value
 * - Time entry shape: isServiceFieldEnabled, isClassEnabled, isLocationEnabled (flat booleans)
 *
 * @param fieldName - API field name (SERVICE_ITEM, BILLABLE, CLASS, LOCATION)
 * @param companySettings - Settings from QL (MappedQLSettings) or from time entry (WTE/STE/TC selectors)
 * @returns boolean - Whether the field is disabled in company settings
 */
export const isStandardFieldDisabled = (
  fieldName: string,
  companySettings: MappedQLSettings | Record<string, any>,
): boolean => {
  const s = companySettings as Record<string, any>;
  // Treat as enabled only when explicitly true (undefined/falsy = disabled)
  const fieldSettingsMap: Record<string, boolean> = {
    SERVICE_ITEM:
      (s.isServiceFieldEnabled?.value ?? s.isServiceFieldEnabled) === true,
    BILLABLE:
      (s.isBillingFieldEnabled?.value ?? s.isBillingFieldEnabled) === true,
    CLASS: (s.classForTimeSheetEnabled?.value ?? s.isClassEnabled) === true,
    LOCATION:
      (s.locationForTimeSheetEnabled?.value ?? s.isLocationEnabled) === true,
  };

  return !fieldSettingsMap[fieldName];
};

/**
 * Check if ANY standard field is disabled in company settings
 * If any SF is disabled, we need to fetch assignments to determine which fields to show
 *
 * @param companySettings - Company settings object
 * @returns boolean - Whether any standard field is disabled
 */
export const isAnyStandardFieldDisabled = (companySettings: any): boolean =>
  !companySettings.isServiceFieldEnabled ||
  !companySettings.isClassEnabled ||
  !companySettings.isLocationEnabled ||
  !companySettings.isBillingFieldEnabled;

/**
 * Get the assignment filter to use when fetching standard field assignments
 * Logic:
 * - If ANY SF is disabled in settings → Use assigned: true (fetch only assigned fields)
 * - If ALL SF are enabled in settings → Use assigned: null (don't filter, show all)
 *
 * @param companySettings - Company settings object
 * @returns Filter object with assigned property (true or null)
 */
export const getStandardFieldAssignmentFilter = (
  companySettings: any,
): { assigned: boolean | null } => {
  const anyFieldDisabled = isAnyStandardFieldDisabled(companySettings);
  return {
    assigned: anyFieldDisabled ? true : null,
  };
};

/**
 * Get the assignment filter for QuickFind dropdown options (Service/Class/Location)
 * Same logic as field-level assignments: based on SF enabled/disabled status
 *
 * @param fieldName - Field name ('service', 'class', 'location')
 * @param companySettings - Company settings object
 * @returns Filter value (true or null)
 */
export const getQuickFindAssignmentFilter = (
  fieldName: 'service' | 'class' | 'location',
  companySettings: any,
): boolean | null => {
  const fieldNameMap = {
    service: 'SERVICE_ITEM',
    class: 'CLASS',
    location: 'LOCATION',
  };

  const apiFieldName = fieldNameMap[fieldName];
  const isDisabled = isStandardFieldDisabled(apiFieldName, companySettings);

  // If field is disabled in settings → filter by assigned: true
  // If field is enabled in settings → don't filter, use assigned: null
  return isDisabled ? true : null;
};

/**
 * Check if ANY custom field is enabled in company settings
 * OPPOSITE logic from SF: If any CF is enabled, we need to fetch assignments
 *
 * @param companySettings - Company settings object
 * @returns boolean - Whether any custom field is enabled
 */
export const isAnyCustomFieldEnabled = (companySettings: any): boolean => {
  // Handle case where customFieldsEnabled might be undefined or null
  if (
    !companySettings?.customFieldsEnabled ||
    typeof companySettings.customFieldsEnabled !== 'object'
  ) {
    return false;
  }

  // Check if any CF ID is set to true
  return Object.values(companySettings.customFieldsEnabled).some(
    (enabled) => enabled === true,
  );
};

/**
 * Get the assignment filter for custom field assignments API call
 *
 * IMPORTANT: Custom Fields come from GraphQL query, not settings.
 * If allCustomFields has items, it means CFs are enabled for this company.
 *
 * LOGIC:
 * - If allCustomFields exists and has items → Use assigned: true (fetch only assigned CFs)
 * - If allCustomFields is empty → Use assigned: null (no CFs enabled, skip API call)
 *
 * WHY: Unlike SFs which have settings per field, CFs are all-or-nothing at the company level.
 * If CFs are enabled, we need to fetch which specific CFs are assigned to this customer.
 *
 * @param companySettings - Company settings object (not used, kept for API consistency)
 * @param allCustomFields - All available custom fields from GraphQL query
 * @returns Filter object with assigned property (true or null)
 *
 * @example
 * // Returns { assigned: true } - CFs are enabled, fetch assigned ones
 * getCustomFieldAssignmentFilter({}, [
 *   { id: 'cf-1', name: 'Department' },
 *   { id: 'cf-2', name: 'Project Code' }
 * ])
 *
 * // Returns { assigned: null } - No CFs enabled
 * getCustomFieldAssignmentFilter({}, [])
 */
export const getCustomFieldAssignmentFilter = (
  companySettings: any,
  allCustomFields?: any[],
): { assigned: boolean | null } => {
  // If allCustomFields has any items, it means CFs are enabled
  // (they come from GraphQL query, not settings)
  const hasCustomFields = allCustomFields && allCustomFields.length > 0;

  return {
    // true = CFs are enabled, filter by assigned fields
    // null = No CFs enabled, don't call the API
    assigned: hasCustomFields ? true : null,
  };
};

/**
 * Get the assignment filter for QuickFind dropdown options (Service, Class, Location)
 * This determines if we should filter dropdown OPTIONS by worker assignments.
 *
 * LOGIC:
 * - If the SF is DISABLED in settings → Use assigned: true (filter options by assignments)
 * - If the SF is ENABLED in settings → Use assigned: null (show all options)
 *
 * WHY: When a field is disabled globally but enabled for specific customers,
 * we also need to filter the available options within that field based on worker assignments.
 *
 * @param fieldName - The standard field name ('service', 'class', 'location')
 * @param companySettings - Company settings object
 * @returns boolean | null - Assignment filter value for QuickFind widget
 *
 * @example
 * // Returns true - service is disabled, filter options
 * getQuickFindAssignmentFilter('service', {
 *   isServiceFieldEnabled: false
 * })
 *
 * // Returns null - class is enabled, show all options
 * getQuickFindAssignmentFilter('class', {
 *   isClassEnabled: true
 * })
 */
