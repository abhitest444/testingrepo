import { useCallback, useMemo } from 'react';
import store, { useAppDispatch, useAppSelector } from '../store';
import {
  setUnmatchedClasses,
  setUnmatchedServices,
  setUnmatchedLocations,
  setUnmatchedCustomers,
  setUnmatchedEmployees,
  setUnmatchedCustomFieldDropdownValues,
  setFieldMappingsProcessing,
  setFieldMappingsError,
  UnmappedField,
} from '../store/fieldMappingsSlice';
import {
  selectEmployeeGroupedTimeEntries,
  selectClasses,
  selectServices,
  selectCustomers,
  selectCustomFields,
} from '../store/selectors';
import { getFuzzySuggestions } from '../utils/EmployeeNameMatcher';
import { useEmployeeData } from './useEmployeeData';

/**
 * Hook to extract unique unmapped field values from time entries
 * and associate them with the entries that use them.
 *
 * Excludes custom fields from processing.
 */
export const useExtractUnmappedFields = () => {
  const dispatch = useAppDispatch();

  // Get data from Redux
  const employeeGroupedTimeEntries = useAppSelector(
    selectEmployeeGroupedTimeEntries,
  );

  // Flatten employeeGroupedTimeEntries to get all entries (replaces processedTimeEntries)
  const processedTimeEntries = useMemo(
    () => Object.values(employeeGroupedTimeEntries).flat(),
    [employeeGroupedTimeEntries],
  );
  const classes = useAppSelector(selectClasses);
  const services = useAppSelector(selectServices);
  const customers = useAppSelector(
    (state) => state.timesheetFieldsData.customers,
  );
  const locations = useAppSelector(
    (state) => state.timesheetFieldsData.departments,
  );
  const customFields = useAppSelector(selectCustomFields);
  const companySettings = useAppSelector(
    (state) => state.companySettings.settings,
  );
  const { employees } = useEmployeeData();

  // Get column mappings to find which Excel columns are mapped to custom fields
  const mappedColumnMappings = useAppSelector(
    (state) => state.excelData.mappedColumnMappings,
  );

  // Get column checkboxes to check if a column is enabled
  const mappedColumnCheckboxes = useAppSelector(
    (state) => state.excelData.mappedColumnCheckboxes,
  );

  /**
   * Check if a field name is a custom field (should be excluded from mapping)
   */
  const isCustomField = useCallback(
    (fieldName: string): boolean =>
      customFields.some(
        (cf) => cf.name.toLowerCase() === fieldName.toLowerCase(),
      ),
    [customFields],
  );

  /**
   * Extract and process unmapped fields from all time entries
   */
  const extractUnmappedFields = useCallback(async () => {
    try {
      dispatch(setFieldMappingsProcessing(true));
      dispatch(setFieldMappingsError(null));

      // Create maps for quick lookup
      const classIdMap = new Map<string, string>();
      const serviceIdMap = new Map<string, string>();
      const customerIdMap = new Map<string, string>();
      const locationIdMap = new Map<string, string>();

      // Populate lookup maps
      classes.forEach((c) => {
        const className = c?.name || c?.fullName;
        if (className) {
          classIdMap.set(className.toLowerCase(), c.id);
        }
      });

      services.forEach((s) => {
        if (s?.fullName) {
          serviceIdMap.set(s.fullName.toLowerCase(), s.id);
        }
      });

      customers.forEach((c) => {
        const customerName = c?.displayName || c?.fullName;
        if (customerName) {
          customerIdMap.set(customerName.toLowerCase(), c.id);
        }
      });

      locations.forEach((l) => {
        if (l?.fullName) {
          locationIdMap.set(l.fullName.toLowerCase(), l.id);
        }
      });

      // Collect unmapped values and their affected entries
      const unmatchedClassesMap: Record<string, UnmappedField> = {};
      const unmatchedServicesMap: Record<string, UnmappedField> = {};
      const unmatchedLocationsMap: Record<string, UnmappedField> = {};
      const unmatchedCustomersMap: Record<string, UnmappedField> = {};
      const unmatchedEmployeesMap: Record<string, UnmappedField> = {};
      const unmatchedCustomFieldDropdownValuesMap: Record<
        string,
        UnmappedField
      > = {};

      // PERFORMANCE OPTIMIZATION: Pre-compute custom field to Excel column mappings
      // This avoids doing Object.entries().filter() inside the loop for every entry
      // Only include columns that are checked in Step 2
      const customFieldToExcelColumns = new Map<string, string[]>();
      if (mappedColumnMappings && mappedColumnCheckboxes) {
        Object.entries(mappedColumnMappings).forEach(([excelCol, qbField]) => {
          // Skip if the column is not checked in Step 2
          if (!mappedColumnCheckboxes[excelCol]) {
            return;
          }

          // Check if this QB field is a custom field with dropdown options
          const matchingCustomField = customFields.find(
            (cf) => cf.name === qbField && cf.options && cf.options.length > 0,
          );
          if (matchingCustomField) {
            const existing = customFieldToExcelColumns.get(qbField) || [];
            customFieldToExcelColumns.set(qbField, [...existing, excelCol]);
          }
        });
      }

      // PERFORMANCE OPTIMIZATION: Pre-compute valid options for each custom field (lowercase for faster comparison)
      const customFieldOptionsMap = new Map<string, Set<string>>();
      customFields.forEach((customField) => {
        if (customField.options && customField.options.length > 0) {
          const validOptions = new Set(
            customField.options
              .filter((option) => !option.deleted)
              .map((option) => option.name.toLowerCase()),
          );
          customFieldOptionsMap.set(customField.name, validOptions);
        }
      });

      // PERFORMANCE OPTIMIZATION: Build a map of QB fields to their source Excel columns (only checked ones)
      // This helps us know which Excel columns to read from for each QB field
      const qbFieldToExcelColumns = new Map<string, string[]>();
      if (mappedColumnMappings && mappedColumnCheckboxes) {
        Object.entries(mappedColumnMappings).forEach(([excelCol, qbField]) => {
          const isChecked = mappedColumnCheckboxes[excelCol];
          // Only include checked columns
          if (isChecked) {
            const existing = qbFieldToExcelColumns.get(qbField) || [];
            qbFieldToExcelColumns.set(qbField, [...existing, excelCol]);
          }
        });
      }

      // Use processedTimeEntries (flat array) as source of truth for extraction
      // This ensures we can re-extract unmapped fields even after filtering employeeGroupedTimeEntries
      const allEntries = processedTimeEntries;

      // Process each entry
      allEntries.forEach((entry) => {
        const entryId = entry.id;

        // Check class field
        // Find which Excel column(s) are mapped to 'class' and read from those
        const classExcelColumns = qbFieldToExcelColumns.get('class') || [];
        const { classId } = entry;

        // Only extract if the 'class' field has at least one checked source column
        if (
          classExcelColumns.length > 0 &&
          !classId &&
          !isCustomField('class')
        ) {
          // Read from all Excel columns mapped to class (usually just one)
          classExcelColumns.forEach((excelCol) => {
            const classValue = entry[excelCol];
            if (classValue && classValue !== '') {
              const className = String(classValue).trim();
              const key = className.toLowerCase();
              if (!unmatchedClassesMap[key]) {
                // Get fuzzy suggestions for this class
                const fuzzySuggestions = classes
                  .map((c) => {
                    const classFullName = c.fullName || c.name || '';
                    const inputLower = className.toLowerCase();
                    const classLower = classFullName.toLowerCase();

                    // Calculate simple similarity score
                    let score = 1.0;

                    // Exact match
                    if (classLower === inputLower) {
                      score = 0.0;
                    }
                    // Starts with
                    else if (
                      classLower.startsWith(inputLower) ||
                      inputLower.startsWith(classLower)
                    ) {
                      score = 0.2;
                    }
                    // Contains
                    else if (classLower.includes(inputLower)) {
                      score = 0.3;
                    }
                    // Check word boundaries
                    else {
                      const classWords = classLower.split(/\s+/);
                      const inputWords = inputLower.split(/\s+/);
                      const matchingWords = inputWords.filter((iw: string) =>
                        classWords.some(
                          (cw: string) =>
                            cw.startsWith(iw) || iw.startsWith(cw),
                        ),
                      );
                      score = matchingWords.length > 0 ? 0.4 : 0.8;
                    }

                    let confidence: 'high' | 'medium' | 'low';
                    if (score < 0.3) {
                      confidence = 'high';
                    } else if (score < 0.6) {
                      confidence = 'medium';
                    } else {
                      confidence = 'low';
                    }

                    return {
                      id: c.id,
                      name: classFullName,
                      score,
                      confidence,
                    };
                  })
                  .filter((s) => s.score < 0.7) // Only keep reasonable matches
                  .sort((a, b) => a.score - b.score)
                  .slice(0, 3);

                unmatchedClassesMap[key] = {
                  value: className,
                  affectedEntryIds: [],
                  fuzzySuggestions,
                  // Use fuzzy match if high confidence, otherwise empty
                  mappedId:
                    fuzzySuggestions[0]?.confidence === 'high'
                      ? fuzzySuggestions[0].id
                      : '',
                  mappedName:
                    fuzzySuggestions[0]?.confidence === 'high'
                      ? fuzzySuggestions[0].name
                      : '',
                };
              }
              if (
                !unmatchedClassesMap[key].affectedEntryIds.includes(entryId)
              ) {
                unmatchedClassesMap[key].affectedEntryIds.push(entryId);
              }
            }
          });
        }

        // Check service field
        // Find which Excel column(s) are mapped to 'service item' and read from those
        const serviceExcelColumns =
          qbFieldToExcelColumns.get('service item') || [];
        const serviceId = entry.serviceItemId || entry.serviceId;

        // Only extract if the 'service item' field has at least one checked source column
        if (
          serviceExcelColumns.length > 0 &&
          !serviceId &&
          !isCustomField('service')
        ) {
          // Read from all Excel columns mapped to service item (usually just one)
          serviceExcelColumns.forEach((excelCol) => {
            const serviceValue = entry[excelCol];
            if (serviceValue && serviceValue !== '') {
              const serviceName = String(serviceValue).trim();
              const key = serviceName.toLowerCase();
              if (!unmatchedServicesMap[key]) {
                // Get fuzzy suggestions for this service
                const fuzzySuggestions = services
                  .map((s) => {
                    const serviceFullName = s.fullName || '';
                    const inputLower = serviceName.toLowerCase();
                    const serviceLower = serviceFullName.toLowerCase();

                    // Calculate simple similarity score
                    let score = 1.0;

                    // Exact match
                    if (serviceLower === inputLower) {
                      score = 0.0;
                    }
                    // Starts with
                    else if (
                      serviceLower.startsWith(inputLower) ||
                      inputLower.startsWith(serviceLower)
                    ) {
                      score = 0.2;
                    }
                    // Contains
                    else if (serviceLower.includes(inputLower)) {
                      score = 0.3;
                    }
                    // Check word boundaries
                    else {
                      const serviceWords = serviceLower.split(/\s+/);
                      const inputWords = inputLower.split(/\s+/);
                      const matchingWords = inputWords.filter((iw: string) =>
                        serviceWords.some(
                          (sw: string) =>
                            sw.startsWith(iw) || iw.startsWith(sw),
                        ),
                      );
                      score = matchingWords.length > 0 ? 0.4 : 0.8;
                    }

                    let confidence: 'high' | 'medium' | 'low';
                    if (score < 0.3) {
                      confidence = 'high';
                    } else if (score < 0.6) {
                      confidence = 'medium';
                    } else {
                      confidence = 'low';
                    }

                    return {
                      id: s.id,
                      name: serviceFullName,
                      score,
                      confidence,
                    };
                  })
                  .filter((s) => s.score < 0.7) // Only keep reasonable matches
                  .sort((a, b) => a.score - b.score)
                  .slice(0, 3);

                unmatchedServicesMap[key] = {
                  value: serviceName,
                  affectedEntryIds: [],
                  fuzzySuggestions,
                  // Use fuzzy match if high confidence, otherwise empty
                  mappedId:
                    fuzzySuggestions[0]?.confidence === 'high'
                      ? fuzzySuggestions[0].id
                      : '',
                  mappedName:
                    fuzzySuggestions[0]?.confidence === 'high'
                      ? fuzzySuggestions[0].name
                      : '',
                };
              }
              if (
                !unmatchedServicesMap[key].affectedEntryIds.includes(entryId)
              ) {
                unmatchedServicesMap[key].affectedEntryIds.push(entryId);
              }
            }
          });
        }

        // Check location field
        // Find which Excel column(s) are mapped to 'location' and read from those
        const locationExcelColumns =
          qbFieldToExcelColumns.get('location') || [];
        const { locationId } = entry;

        // Only extract if the 'location' field has at least one checked source column
        if (
          locationExcelColumns.length > 0 &&
          !locationId &&
          !isCustomField('location')
        ) {
          // Read from all Excel columns mapped to location (usually just one)
          locationExcelColumns.forEach((excelCol) => {
            const locationValue = entry[excelCol];
            if (locationValue && locationValue !== '') {
              const locationName = String(locationValue).trim();
              const key = locationName.toLowerCase();
              if (!unmatchedLocationsMap[key]) {
                // Get fuzzy suggestions for this location
                const fuzzySuggestions = locations
                  .map((l) => {
                    const locationFullName = l.fullName || '';
                    const inputLower = locationName.toLowerCase();
                    const locationLower = locationFullName.toLowerCase();

                    // Calculate simple similarity score
                    let score = 1.0;

                    // Exact match
                    if (locationLower === inputLower) {
                      score = 0.0;
                    }
                    // Starts with
                    else if (
                      locationLower.startsWith(inputLower) ||
                      inputLower.startsWith(locationLower)
                    ) {
                      score = 0.2;
                    }
                    // Contains
                    else if (locationLower.includes(inputLower)) {
                      score = 0.3;
                    }
                    // Check word boundaries
                    else {
                      const locationWords = locationLower.split(/\s+/);
                      const inputWords = inputLower.split(/\s+/);
                      const matchingWords = inputWords.filter((iw: string) =>
                        locationWords.some(
                          (lw: string) =>
                            lw.startsWith(iw) || iw.startsWith(lw),
                        ),
                      );
                      score = matchingWords.length > 0 ? 0.4 : 0.8;
                    }

                    let confidence: 'high' | 'medium' | 'low';
                    if (score < 0.3) {
                      confidence = 'high';
                    } else if (score < 0.6) {
                      confidence = 'medium';
                    } else {
                      confidence = 'low';
                    }

                    return {
                      id: l.id,
                      name: locationFullName,
                      score,
                      confidence,
                    };
                  })
                  .filter((s) => s.score < 0.7) // Only keep reasonable matches
                  .sort((a, b) => a.score - b.score)
                  .slice(0, 3);

                unmatchedLocationsMap[key] = {
                  value: locationName,
                  affectedEntryIds: [],
                  fuzzySuggestions,
                  // Use fuzzy match if high confidence, otherwise empty
                  mappedId:
                    fuzzySuggestions[0]?.confidence === 'high'
                      ? fuzzySuggestions[0].id
                      : '',
                  mappedName:
                    fuzzySuggestions[0]?.confidence === 'high'
                      ? fuzzySuggestions[0].name
                      : '',
                };
              }
              if (
                !unmatchedLocationsMap[key].affectedEntryIds.includes(entryId)
              ) {
                unmatchedLocationsMap[key].affectedEntryIds.push(entryId);
              }
            }
          });
        }

        // Check customer field
        // Find which Excel column(s) are mapped to 'customer' and read from those
        const customerExcelColumns =
          qbFieldToExcelColumns.get('customer') || [];
        const customerId = entry.customerId || entry.clientId;

        // Only extract if the 'customer' field has at least one checked source column
        if (
          customerExcelColumns.length > 0 &&
          !customerId &&
          !isCustomField('customer')
        ) {
          // Read from all Excel columns mapped to customer (usually just one)
          customerExcelColumns.forEach((excelCol) => {
            const customerValue = entry[excelCol];
            if (customerValue && customerValue !== '') {
              const customerName = String(customerValue).trim();
              const key = customerName.toLowerCase();
              if (!unmatchedCustomersMap[key]) {
                // Get fuzzy suggestions for this customer
                const fuzzySuggestions = customers
                  .map((c) => {
                    const customerFullName = c.displayName || c.fullName || '';
                    const inputLower = customerName.toLowerCase();
                    const customerLower = customerFullName.toLowerCase();

                    // Calculate simple similarity score
                    let score = 1.0;

                    // Exact match
                    if (customerLower === inputLower) {
                      score = 0.0;
                    }
                    // Starts with
                    else if (
                      customerLower.startsWith(inputLower) ||
                      inputLower.startsWith(customerLower)
                    ) {
                      score = 0.2;
                    }
                    // Contains
                    else if (customerLower.includes(inputLower)) {
                      score = 0.3;
                    }
                    // Check word boundaries
                    else {
                      const customerWords = customerLower.split(/\s+/);
                      const inputWords = inputLower.split(/\s+/);
                      const matchingWords = inputWords.filter((iw: string) =>
                        customerWords.some(
                          (cw: string) =>
                            cw.startsWith(iw) || iw.startsWith(cw),
                        ),
                      );
                      score = matchingWords.length > 0 ? 0.4 : 0.8;
                    }

                    let confidence: 'high' | 'medium' | 'low';
                    if (score < 0.3) {
                      confidence = 'high';
                    } else if (score < 0.6) {
                      confidence = 'medium';
                    } else {
                      confidence = 'low';
                    }

                    return {
                      id: c.id,
                      name: customerFullName,
                      score,
                      confidence,
                    };
                  })
                  .filter((s) => s.score < 0.7) // Only keep reasonable matches
                  .sort((a, b) => a.score - b.score)
                  .slice(0, 3);

                unmatchedCustomersMap[key] = {
                  value: customerName,
                  affectedEntryIds: [],
                  fuzzySuggestions,
                  // Use fuzzy match if high confidence, otherwise empty
                  mappedId:
                    fuzzySuggestions[0]?.confidence === 'high'
                      ? fuzzySuggestions[0].id
                      : '',
                  mappedName:
                    fuzzySuggestions[0]?.confidence === 'high'
                      ? fuzzySuggestions[0].name
                      : '',
                };
              }
              if (
                !unmatchedCustomersMap[key].affectedEntryIds.includes(entryId)
              ) {
                unmatchedCustomersMap[key].affectedEntryIds.push(entryId);
              }
            }
          });
        }

        // Check custom field dropdown values
        // PERFORMANCE: Use pre-computed maps instead of filtering on every iteration
        customFieldToExcelColumns.forEach((excelColumns, customFieldName) => {
          // Get the custom field details
          const customField = customFields.find(
            (cf) => cf.name === customFieldName,
          );
          if (
            !customField ||
            !customField.options ||
            customField.options.length === 0
          ) {
            return; // Skip if not found or no options
          }

          // Get pre-computed valid options for fast lookup
          const validOptions = customFieldOptionsMap.get(customFieldName);
          if (!validOptions) return;

          // Check each Excel column mapped to this custom field
          excelColumns.forEach((excelColumn) => {
            const fieldValue = entry[excelColumn];

            // If field has a value
            if (
              fieldValue &&
              typeof fieldValue === 'string' &&
              fieldValue.trim()
            ) {
              const trimmedValue = fieldValue.trim();
              const lowerValue = trimmedValue.toLowerCase();

              // PERFORMANCE: Use Set.has() instead of array.some() - O(1) vs O(n)
              const matchesOption = validOptions.has(lowerValue);

              // If value doesn't match any option, it's unmapped
              if (!matchesOption) {
                const key = `${customFieldName}:${trimmedValue}`.toLowerCase();

                if (!unmatchedCustomFieldDropdownValuesMap[key]) {
                  // Get suggestions from valid options (only compute once when creating the entry)
                  const suggestions = customField.options
                    .filter((option) => !option.deleted)
                    .map((option) => ({
                      id: option.id,
                      name: option.name,
                      confidence: 'medium' as const,
                    }));

                  unmatchedCustomFieldDropdownValuesMap[key] = {
                    value: trimmedValue,
                    affectedEntryIds: [],
                    customFieldId: customField.id,
                    customFieldName: customField.name,
                    fuzzySuggestions: suggestions,
                    mappedId: '',
                    mappedName: '',
                  };
                }

                // PERFORMANCE: Only add entryId if not already in the array
                const affectedIds =
                  unmatchedCustomFieldDropdownValuesMap[key].affectedEntryIds;
                if (!affectedIds.includes(entryId)) {
                  affectedIds.push(entryId);
                }
              }
            }
          });
        });

        // Check employee field - look for missing employees
        const employeeValue = entry.employee || entry.originalEmployeeName;
        const { employeeId, isMissingEmployee } = entry;

        if (employeeValue && (isMissingEmployee || !employeeId)) {
          const employeeName = employeeValue.trim();
          const key = employeeName.toLowerCase();
          if (!unmatchedEmployeesMap[key]) {
            // Get fuzzy suggestions for this employee
            const fuzzySuggestions = getFuzzySuggestions(
              employeeName,
              employees || [],
              3,
            );

            unmatchedEmployeesMap[key] = {
              value: employeeName,
              affectedEntryIds: [],
              fuzzySuggestions,
              // Mappings will be filled when user selects from dropdown
              mappedId: '',
              mappedName: '',
            };
          }
          if (!unmatchedEmployeesMap[key].affectedEntryIds.includes(entryId)) {
            unmatchedEmployeesMap[key].affectedEntryIds.push(entryId);
          }
        }
      });

      // Get existing mappings from Redux to preserve user selections
      // Read directly from store to get latest values (not from closure)
      const currentState = store.getState();
      const existingUnmatchedClasses =
        currentState.fieldMappings.unmatchedClasses;
      const existingUnmatchedServices =
        currentState.fieldMappings.unmatchedServices;
      const existingUnmatchedLocations =
        currentState.fieldMappings.unmatchedLocations;
      const existingUnmatchedCustomers =
        currentState.fieldMappings.unmatchedCustomers;
      const existingUnmatchedEmployees =
        currentState.fieldMappings.unmatchedEmployees;
      const existingUnmatchedCustomFieldDropdownValues =
        currentState.fieldMappings.unmatchedCustomFieldDropdownValues;

      // Merge existing mappings with newly extracted unmapped fields
      // This preserves user selections even after re-extraction
      const mergedClasses = { ...unmatchedClassesMap };
      Object.keys(existingUnmatchedClasses).forEach((key) => {
        if (existingUnmatchedClasses[key].mappedId) {
          // If user has mapped this field, preserve the mapping
          if (mergedClasses[key]) {
            mergedClasses[key].mappedId =
              existingUnmatchedClasses[key].mappedId;
            mergedClasses[key].mappedName =
              existingUnmatchedClasses[key].mappedName;
          } else {
            // Field was mapped and no longer appears as unmapped - keep it in the list
            mergedClasses[key] = existingUnmatchedClasses[key];
          }
        }
      });

      const mergedServices = { ...unmatchedServicesMap };
      Object.keys(existingUnmatchedServices).forEach((key) => {
        if (existingUnmatchedServices[key].mappedId) {
          if (mergedServices[key]) {
            mergedServices[key].mappedId =
              existingUnmatchedServices[key].mappedId;
            mergedServices[key].mappedName =
              existingUnmatchedServices[key].mappedName;
          } else {
            mergedServices[key] = existingUnmatchedServices[key];
          }
        }
      });

      const mergedLocations = { ...unmatchedLocationsMap };
      Object.keys(existingUnmatchedLocations).forEach((key) => {
        if (existingUnmatchedLocations[key].mappedId) {
          if (mergedLocations[key]) {
            mergedLocations[key].mappedId =
              existingUnmatchedLocations[key].mappedId;
            mergedLocations[key].mappedName =
              existingUnmatchedLocations[key].mappedName;
          } else {
            mergedLocations[key] = existingUnmatchedLocations[key];
          }
        }
      });

      const mergedCustomers = { ...unmatchedCustomersMap };
      Object.keys(existingUnmatchedCustomers).forEach((key) => {
        if (existingUnmatchedCustomers[key].mappedId) {
          if (mergedCustomers[key]) {
            mergedCustomers[key].mappedId =
              existingUnmatchedCustomers[key].mappedId;
            mergedCustomers[key].mappedName =
              existingUnmatchedCustomers[key].mappedName;
          } else {
            mergedCustomers[key] = existingUnmatchedCustomers[key];
          }
        }
      });

      const mergedEmployees = { ...unmatchedEmployeesMap };
      Object.keys(existingUnmatchedEmployees).forEach((key) => {
        if (existingUnmatchedEmployees[key].mappedId) {
          if (mergedEmployees[key]) {
            mergedEmployees[key].mappedId =
              existingUnmatchedEmployees[key].mappedId;
            mergedEmployees[key].mappedName =
              existingUnmatchedEmployees[key].mappedName;
          } else {
            mergedEmployees[key] = existingUnmatchedEmployees[key];
          }
        }
      });

      // Merge custom field dropdown values
      const mergedCustomFieldDropdownValues = {
        ...unmatchedCustomFieldDropdownValuesMap,
      };
      Object.keys(existingUnmatchedCustomFieldDropdownValues).forEach((key) => {
        if (existingUnmatchedCustomFieldDropdownValues[key].mappedId) {
          if (mergedCustomFieldDropdownValues[key]) {
            mergedCustomFieldDropdownValues[key].mappedId =
              existingUnmatchedCustomFieldDropdownValues[key].mappedId;
            mergedCustomFieldDropdownValues[key].mappedName =
              existingUnmatchedCustomFieldDropdownValues[key].mappedName;
          } else {
            mergedCustomFieldDropdownValues[key] =
              existingUnmatchedCustomFieldDropdownValues[key];
          }
        }
      });

      // Dispatch to Redux with merged maps
      dispatch(setUnmatchedClasses(mergedClasses));
      dispatch(setUnmatchedServices(mergedServices));
      dispatch(setUnmatchedLocations(mergedLocations));
      dispatch(setUnmatchedCustomers(mergedCustomers));
      dispatch(setUnmatchedEmployees(mergedEmployees));
      dispatch(
        setUnmatchedCustomFieldDropdownValues(mergedCustomFieldDropdownValues),
      );

      return {
        classCount: Object.keys(mergedClasses).length,
        serviceCount: Object.keys(mergedServices).length,
        locationCount: Object.keys(mergedLocations).length,
        customerCount: Object.keys(mergedCustomers).length,
        employeeCount: Object.keys(mergedEmployees).length,
        customFieldDropdownValueCount: Object.keys(
          mergedCustomFieldDropdownValues,
        ).length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to extract unmapped fields';
      dispatch(setFieldMappingsError(errorMessage));
      throw error;
    } finally {
      dispatch(setFieldMappingsProcessing(false));
    }
  }, [
    dispatch,
    employeeGroupedTimeEntries,
    processedTimeEntries, // computed from employeeGroupedTimeEntries
    classes,
    services,
    customers,
    locations,
    customFields,
    companySettings,
    isCustomField,
    employees,
    mappedColumnMappings,
    mappedColumnCheckboxes,
    // NOTE: Do NOT include existing unmapped fields in dependencies
    // to avoid infinite loop when mappings change
  ]);

  return {
    extractUnmappedFields,
  };
};
