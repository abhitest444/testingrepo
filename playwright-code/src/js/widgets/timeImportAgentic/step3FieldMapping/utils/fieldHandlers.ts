/**
 * Utility functions for creating field mapping handlers
 */

interface FieldHandlerConfig {
  mapAction: any;
  unmatchedFields: Record<string, any>;
  primaryIdField: string;
  primaryNameField: string;
  additionalFields?: Array<{
    field: string;
    getValue: (id: string, name: string) => string;
  }>;
}

/**
 * Creates a generic field mapping handler that follows DRY principles
 *
 * This factory eliminates duplication across class, service, location, and customer handlers
 * by providing a configurable way to map fields and update affected entries.
 *
 * @param dispatch - Redux dispatch function
 * @param config - Configuration object defining field behavior
 * @returns Handler function that maps a field value to a QuickBooks entity
 *
 * @example
 * const handleMapClass = createFieldHandler(dispatch, {
 *   mapAction: mapClassField,
 *   unmatchedFields: unmatchedClasses,
 *   primaryIdField: 'classId',
 *   primaryNameField: 'className',
 * });
 *
 * @example
 * const handleMapService = createFieldHandler(dispatch, {
 *   mapAction: mapServiceField,
 *   unmatchedFields: unmatchedServices,
 *   primaryIdField: 'serviceItemId',
 *   primaryNameField: 'serviceName',
 *   additionalFields: [
 *     { field: 'serviceId', getValue: (id) => id },
 *   ],
 * });
 */
export const createFieldHandler =
  (dispatch: any, config: FieldHandlerConfig, updateTimeEntryField: any) =>
  (value: string, mappedId: string, mappedName: string) => {
    // Dispatch the field mapping action to Redux
    dispatch(config.mapAction({ value, mappedId, mappedName }));

    // Find the field in unmatched fields (case-insensitive)
    const field = config.unmatchedFields[value.toLowerCase()];

    if (field && field.affectedEntryIds) {
      // Update all affected time entries
      field.affectedEntryIds.forEach((entryId: string) => {
        // Update primary ID field
        dispatch(
          updateTimeEntryField({
            entryId,
            field: config.primaryIdField,
            value: mappedId,
          }),
        );

        // Update primary name field
        dispatch(
          updateTimeEntryField({
            entryId,
            field: config.primaryNameField,
            value: mappedName,
          }),
        );

        // Update any additional fields (e.g., serviceId for backward compatibility)
        if (config.additionalFields) {
          config.additionalFields.forEach(({ field, getValue }) => {
            const fieldValue = getValue(mappedId, mappedName);
            dispatch(
              updateTimeEntryField({
                entryId,
                field,
                value: fieldValue,
              }),
            );
          });
        }
      });
    }
  };

/**
 * Pre-configured handler configurations for each field type
 */
export const fieldHandlerConfigs = {
  class: (unmatchedClasses: Record<string, any>) => ({
    mapAction: (actions: any) => actions.mapClassField,
    unmatchedFields: unmatchedClasses,
    primaryIdField: 'classId',
    primaryNameField: 'className',
  }),

  service: (unmatchedServices: Record<string, any>) => ({
    mapAction: (actions: any) => actions.mapServiceField,
    unmatchedFields: unmatchedServices,
    primaryIdField: 'serviceItemId',
    primaryNameField: 'serviceName',
    additionalFields: [
      {
        field: 'serviceId',
        getValue: (id: string) => id, // Backward compatibility
      },
    ],
  }),

  location: (unmatchedLocations: Record<string, any>) => ({
    mapAction: (actions: any) => actions.mapLocationField,
    unmatchedFields: unmatchedLocations,
    primaryIdField: 'locationId',
    primaryNameField: 'locationName',
  }),

  customer: (unmatchedCustomers: Record<string, any>) => ({
    mapAction: (actions: any) => actions.mapCustomerField,
    unmatchedFields: unmatchedCustomers,
    primaryIdField: 'customerId',
    primaryNameField: 'customerName',
  }),

  employee: (unmatchedEmployees: Record<string, any>) => ({
    mapAction: (actions: any) => actions.mapEmployeeField,
    unmatchedFields: unmatchedEmployees,
    primaryIdField: 'employeeId',
    primaryNameField: 'employee',
    additionalFields: [
      {
        field: 'isMissingEmployee',
        getValue: () => false, // Clear the missing flag when mapped
      },
    ],
  }),
};
