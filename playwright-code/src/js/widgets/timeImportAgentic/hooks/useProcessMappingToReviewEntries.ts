import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { UxPreferenceKey } from 'src/js/service/utils/useUXPreferences';
import store from '../store';
import { setTimeEntries } from '../store/reviewSlice';
import {
  selectClasses,
  selectCustomers,
  selectDepartments,
  selectEmployeeGroupedTimeEntries,
  selectMappedColumnCheckboxes,
  selectMappedColumnMappings,
  selectServices,
} from '../store/selectors';
import { useEmployeeData } from './useEmployeeData';
import { useUxPreferencesRedux } from './useUxPreferencesRedux';
import { useCustomFieldsData } from './useCustomFieldsData';
import { calculateHoursBetweenTimes } from '../utils/timezoneUtils';
import { findEmployeeMatch } from '../utils/EmployeeNameMatcher';

// Use timezone-safe time calculation
const calculateHoursFromTime = (startTime: string, endTime: string): number =>
  calculateHoursBetweenTimes(startTime, endTime);

// Helper function to convert Excel serial time to AM/PM format
const convertExcelSerialTime = (serial: any): string => {
  // If it's already a formatted time string (HH:MM or H:MM format), convert to 12-hour AM/PM
  if (typeof serial === 'string' && serial.includes(':')) {
    const [hoursStr, minutesStr] = serial.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
  }

  // Try to convert to number (for Excel serial times)
  const numericValue = typeof serial === 'string' ? parseFloat(serial) : serial;

  if (typeof numericValue !== 'number' || Number.isNaN(numericValue)) {
    return String(serial || '');
  }

  // Excel stores time as fraction of a day
  // If value >= 1, it's a datetime (date + time), extract only the time portion
  const timePortion =
    numericValue >= 1 ? numericValue - Math.floor(numericValue) : numericValue;

  const totalMinutes = Math.round(timePortion * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Convert to 12-hour format with AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper function to find service item ID by name
const findServiceItemId = (
  serviceItemName: string,
  services: Array<{ id: string; fullName?: string }>,
): string | null => {
  if (!serviceItemName || !services || services.length === 0) {
    return null;
  }

  // Exact match only (case insensitive)
  const exactMatch = services.find(
    (service) =>
      service.fullName?.toLowerCase().trim() ===
      serviceItemName.toLowerCase().trim(),
  );

  if (exactMatch) {
    return exactMatch.id;
  }

  return null;
};

// Helper function to find class ID by name
const findClassId = (
  className: string,
  classes: Array<{ id: string; fullName?: string; name?: string }>,
): string | null => {
  if (!className || !classes || classes.length === 0) {
    return null;
  }

  // Exact match only (case insensitive)
  const exactMatch = classes.find((c) => {
    const fullName = (c.fullName || c.name || '').toLowerCase().trim();
    return fullName === className.toLowerCase().trim();
  });

  if (exactMatch) {
    return exactMatch.id;
  }

  return null;
};

// Helper function to find location ID by name
const findLocationId = (
  locationName: string,
  locations: Array<{ id: string; fullName?: string }>,
): string | null => {
  if (!locationName || !locations || locations.length === 0) {
    return null;
  }

  // Exact match only (case insensitive)
  const exactMatch = locations.find(
    (location) =>
      location.fullName?.toLowerCase().trim() ===
      locationName.toLowerCase().trim(),
  );

  if (exactMatch) {
    return exactMatch.id;
  }

  return null;
};

// Helper function to find customer ID by name
const findCustomerId = (
  customerName: string,
  customers: Array<{ id: string; displayName?: string; fullName?: string }>,
): string | null => {
  if (!customerName || !customers || customers.length === 0) {
    return null;
  }

  // Exact match only (case insensitive)
  const exactMatch = customers.find(
    (customer) =>
      customer.displayName?.toLowerCase().trim() ===
        customerName.toLowerCase().trim() ||
      customer.fullName?.toLowerCase().trim() ===
        customerName.toLowerCase().trim(),
  );

  if (exactMatch) {
    return exactMatch.id;
  }

  return null;
};

// Custom hook to process mapping and convert to review time entries
export const useProcessMappingToReviewEntries = () => {
  const dispatch = useDispatch();
  const { employees } = useEmployeeData();
  const { getEmployeeMappings } = useUxPreferencesRedux();
  const { customFields } = useCustomFieldsData();

  const processMappingToReviewEntries = useCallback(
    async (options?: {
      applyNullification?: boolean;
      filterUnmappedEmployees?: boolean;
    }): Promise<void> => {
      const { applyNullification = false, filterUnmappedEmployees = false } =
        options || {};

      // Read Redux state INSIDE the callback to get the latest values
      const state = store.getState();
      const mappedColumnMappings = selectMappedColumnMappings(state);
      const mappedColumnCheckboxes = selectMappedColumnCheckboxes(state);
      const employeeGroupedTimeEntries =
        selectEmployeeGroupedTimeEntries(state);
      const { rawExcelData } = state.excelData;
      const { uxEmployeeMappings } = state.excelData;
      const { unmatchedEmployees } = state.fieldMappings;
      const { unmatchedLocations } = state.fieldMappings;
      const { unmatchedClasses } = state.fieldMappings;
      const { unmatchedServices } = state.fieldMappings;
      const { unmatchedCustomers } = state.fieldMappings;
      const services = selectServices(state);
      const classes = selectClasses(state);
      const locations = selectDepartments(state);
      const customers = selectCustomers(state);
      const companySettings = state.companySettings.settings;

      // Start processing
      dispatch({ type: 'excelData/setIsProcessingFile', payload: true });
      dispatch({ type: 'excelData/setProcessingError', payload: null });

      try {
        // Process the actual Excel data using existing Redux state
        // Find the employee column name from mappings
        const employeeColumnName = Object.keys(mappedColumnMappings).find(
          (column) => mappedColumnMappings[column] === 'employee',
        );

        // Check if employeeGroupedTimeEntries is already populated from Step 2 processing
        const hasExistingProcessedData =
          employeeGroupedTimeEntries &&
          Object.keys(employeeGroupedTimeEntries).length > 0;

        if (
          !hasExistingProcessedData &&
          rawExcelData &&
          rawExcelData.length > 0
        ) {
          // Process the Excel data
          const headers = rawExcelData[0];
          const dataRows = rawExcelData.slice(1);

          // Find mapped column names for key fields
          const employeeColumnName = Object.keys(mappedColumnMappings).find(
            (column) => mappedColumnMappings[column] === 'employee',
          );
          const dateColumnName = Object.keys(mappedColumnMappings).find(
            (column) => mappedColumnMappings[column] === 'date',
          );
          const hoursColumnName = Object.keys(mappedColumnMappings).find(
            (column) => mappedColumnMappings[column] === 'hours',
          );

          const processedEntries = dataRows
            .filter(
              (row: any) =>
                row &&
                row.length > 0 &&
                row.some((cell: any) => cell && String(cell).trim() !== ''),
            )
            .map((row: any, index: number) => {
              const processedEntry: any = {};
              const columnCounts: Record<string, number> = {};

              headers.forEach((header: any, colIndex: any) => {
                if (
                  !header ||
                  typeof header !== 'string' ||
                  header.trim() === ''
                ) {
                  return;
                }

                const headerTrimmed = header.trim();
                const rawValue = row[colIndex];
                const lowerCaseKey = headerTrimmed.toLowerCase();

                let displayColumnName = headerTrimmed;
                if (columnCounts[lowerCaseKey] !== undefined) {
                  columnCounts[lowerCaseKey] += 1;
                  displayColumnName = `${headerTrimmed}-${columnCounts[lowerCaseKey]}`;
                } else {
                  columnCounts[lowerCaseKey] = 0;
                }

                // Clean up date values to remove time portion
                let cleanValue = String(rawValue || '');
                if (
                  mappedColumnMappings[headerTrimmed] === 'date' &&
                  cleanValue.includes(' ')
                ) {
                  // Remove time portion: "11/24/2025 12:00:00 AM" -> "11/24/2025"
                  [cleanValue] = cleanValue.split(' ');
                }

                processedEntry[displayColumnName] = cleanValue;
              });

              return {
                id: `entry-${index}`,
                ...processedEntry,
              };
            })
            .filter((entry: any) => {
              // Filter out entries that don't have essential data based on mapped columns
              const hasEmployeeName =
                employeeColumnName &&
                entry[employeeColumnName] &&
                String(entry[employeeColumnName]).trim() !== '';
              const hasDate =
                dateColumnName &&
                entry[dateColumnName] &&
                String(entry[dateColumnName]).trim() !== '';

              // Check for hours column
              const hasHours =
                hoursColumnName &&
                entry[hoursColumnName] &&
                String(entry[hoursColumnName]).trim() !== '';

              // Check for start/end time columns
              const startTimeColumnName = Object.keys(
                mappedColumnMappings,
              ).find((column) => mappedColumnMappings[column] === 'start time');
              const endTimeColumnName = Object.keys(mappedColumnMappings).find(
                (column) => mappedColumnMappings[column] === 'end time',
              );

              const hasStartTime =
                startTimeColumnName &&
                entry[startTimeColumnName] &&
                String(entry[startTimeColumnName]).trim() !== '';
              const hasEndTime =
                endTimeColumnName &&
                entry[endTimeColumnName] &&
                String(entry[endTimeColumnName]).trim() !== '';
              const hasTimePair = hasStartTime && hasEndTime;

              // Entry is valid if it has: Employee + Date + (Hours OR Start/End Time pair)
              const isValidEntry =
                hasEmployeeName && hasDate && (hasHours || hasTimePair);

              return isValidEntry;
            });

          // Create employee grouped data structure
          const employeeGroupedData: Record<string, any[]> = {};

          // Get existing user selections to preserve them
          const existingEntries = Object.values(
            employeeGroupedTimeEntries,
          ).flat();
          const existingSelections = new Map();
          existingEntries.forEach((existingEntry: any) => {
            existingSelections.set(existingEntry.id, {
              class: existingEntry.class,
              classId: existingEntry.classId,
              'service item': existingEntry['service item'],
              serviceItemId: existingEntry.serviceItemId,
              location: existingEntry.location,
              locationId: existingEntry.locationId,
              customer: existingEntry.customer,
              customerId: existingEntry.customerId,
              'customer / project': existingEntry['customer / project'],
              customFields: existingEntry.customFields,
            });
          });

          processedEntries.forEach((entry: any) => {
            // Use the mapped column name to get the employee name
            const originalEmployeeName = employeeColumnName
              ? entry[employeeColumnName]
              : entry.username || entry.employee || 'Unknown';

            // Enhanced employee matching with priority: DAS -> UX -> Fuse.js
            let matchedEmployee: any;
            let fuzzySuggestions: any[] = [];

            const employeeMappings = getEmployeeMappings();

            // Check if this employee name is already mapped in UX preferences
            let mappedEmployee = null;

            // Check format 1: Direct name lookup { "jared": { "employeeId": "400000001", ... } }
            const directMapping = employeeMappings[originalEmployeeName];
            if (directMapping && directMapping.employeeId) {
              mappedEmployee = employees?.find(
                (emp) => emp.id === directMapping.employeeId,
              );
            }

            // Check format 2: Employee ID with originalNames array
            // { "400000001": { "originalNames": ["jared", "Emp"], ... } }
            if (!mappedEmployee) {
              // eslint-disable-next-line no-restricted-syntax
              for (const [employeeId, mappingData] of Object.entries(
                employeeMappings,
              )) {
                if (
                  mappingData &&
                  typeof mappingData === 'object' &&
                  Array.isArray(mappingData.originalNames) &&
                  mappingData.originalNames.includes(originalEmployeeName)
                ) {
                  // Find the employee by ID
                  mappedEmployee = employees?.find(
                    (emp) => emp.id === employeeId,
                  );
                  if (mappedEmployee) {
                    break;
                  }
                }
              }
            }

            if (mappedEmployee) {
              matchedEmployee = mappedEmployee;
              fuzzySuggestions = [];
            } else {
              // Use the existing matching logic for unmapped employees
              const matchResult = findEmployeeMatch(
                originalEmployeeName,
                employees || [],
                employeeMappings,
                5,
              );
              matchedEmployee = matchResult.matchedEmployee;
              fuzzySuggestions = matchResult.fuzzySuggestions;
            }

            // Determine the final employee name for grouping
            let finalEmployeeName = originalEmployeeName;
            if (matchedEmployee) {
              finalEmployeeName = matchedEmployee.name;
            }

            if (!employeeGroupedData[finalEmployeeName]) {
              employeeGroupedData[finalEmployeeName] = [];
            }

            // Extract hours from the mapped column and convert to number
            const hoursValue = hoursColumnName
              ? entry[hoursColumnName]
              : entry.hours || entry.duration || 0;
            let hours = parseFloat(String(hoursValue)) || 0;
            // Round hours to 2 decimal places
            hours = Math.round(hours * 100) / 100;

            // Extract date from the mapped column
            let dateValue = dateColumnName
              ? entry[dateColumnName]
              : entry.date || entry.Date;

            // Convert Excel serial date if it's still a number
            if (
              typeof dateValue === 'number' ||
              (typeof dateValue === 'string' &&
                !Number.isNaN(Number(dateValue)) &&
                Number(dateValue) > 1000)
            ) {
              const serial =
                typeof dateValue === 'string'
                  ? parseFloat(dateValue)
                  : dateValue;
              const excelEpoch = dayjs('1900-01-01');
              const daysOffset = serial > 59 ? serial - 2 : serial - 1;
              const date = excelEpoch.add(daysOffset, 'day');
              dateValue = date.format('M/D/YYYY');
            }

            // Check if we need to calculate hours from start/end time
            const startTimeColumnName = Object.keys(mappedColumnMappings).find(
              (column) => mappedColumnMappings[column] === 'start time',
            );
            const endTimeColumnName = Object.keys(mappedColumnMappings).find(
              (column) => mappedColumnMappings[column] === 'end time',
            );

            // If no hours column but we have start/end time, calculate hours
            if (!hoursColumnName && startTimeColumnName && endTimeColumnName) {
              const startTime = entry[startTimeColumnName];
              const endTime = entry[endTimeColumnName];

              if (startTime && endTime) {
                const calculatedHours = calculateHoursFromTime(
                  startTime,
                  endTime,
                );
                if (calculatedHours > 0) {
                  hours = calculatedHours;
                }
              }
            }

            // Create mapped field names for ALL checked columns (generic approach)
            const mappedFields: Record<string, any> = {};
            const processedMappings: Array<{
              excelColumn: string;
              mappedField: string;
              value: any;
            }> = [];

            Object.entries(mappedColumnCheckboxes).forEach(
              ([excelColumn, isChecked]) => {
                if (isChecked && mappedColumnMappings[excelColumn]) {
                  const mappedField = mappedColumnMappings[excelColumn];
                  const value = entry[excelColumn];

                  // Skip start/end time columns from being added to mapped fields
                  // They are used for calculation but not displayed in review
                  if (
                    mappedField === 'start time' ||
                    mappedField === 'end time'
                  ) {
                    return; // Skip adding to mapped fields
                  }

                  // Smart type conversion based on field name patterns
                  let processedValue = value;

                  if (
                    mappedField === 'hours' ||
                    mappedField.includes('hour') ||
                    mappedField.includes('duration')
                  ) {
                    // Use calculated hours if available, otherwise use original value
                    const numericValue =
                      hours > 0 ? hours : parseFloat(String(value)) || 0;
                    // Round to 2 decimal places
                    processedValue = Math.round(numericValue * 100) / 100;
                  } else if (
                    mappedField === 'date' ||
                    mappedField.includes('date')
                  ) {
                    // Date fields - convert Excel serial dates
                    if (
                      typeof value === 'number' ||
                      (typeof value === 'string' &&
                        !Number.isNaN(Number(value)) &&
                        Number(value) > 1000)
                    ) {
                      const serial =
                        typeof value === 'string' ? parseFloat(value) : value;
                      const excelEpoch = dayjs('1900-01-01');
                      const daysOffset = serial > 59 ? serial - 2 : serial - 1;
                      const date = excelEpoch.add(daysOffset, 'day');
                      processedValue = date.format('M/D/YYYY');
                    } else {
                      processedValue = String(value || '');
                    }
                  } else if (mappedField.includes('time')) {
                    // Time fields - convert Excel serial times
                    if (typeof value === 'number') {
                      const timePortion =
                        value >= 1 ? value - Math.floor(value) : value;
                      const totalMinutes = Math.round(timePortion * 24 * 60);
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      const displayHours = hours % 12 || 12;
                      processedValue = `${displayHours}:${minutes
                        .toString()
                        .padStart(2, '0')} ${ampm}`;
                    } else {
                      processedValue = String(value || '');
                    }
                  } else if (
                    mappedField === 'billable' ||
                    mappedField.includes('billable')
                  ) {
                    // Boolean fields
                    processedValue =
                      String(value).toLowerCase() === 'true' ||
                      String(value).toLowerCase() === 'yes' ||
                      String(value) === '1';
                  } else if (
                    mappedField.includes('rate') ||
                    mappedField.includes('cost') ||
                    mappedField.includes('price')
                  ) {
                    // Numeric fields for rates/prices - round to 2 decimals
                    const numericValue = parseFloat(String(value)) || 0;
                    processedValue = Math.round(numericValue * 100) / 100;
                  } else {
                    // Text fields - keep as string
                    processedValue = String(value || '');
                  }

                  mappedFields[mappedField] = processedValue;

                  // Add service item ID if this is a service item field
                  if (mappedField === 'service item') {
                    const serviceItemId = processedValue
                      ? findServiceItemId(String(processedValue), services)
                      : null;
                    mappedFields.serviceItemId = serviceItemId;
                  }

                  // Add class ID if this is a class field
                  if (mappedField === 'class') {
                    const classId = processedValue
                      ? findClassId(String(processedValue), classes)
                      : null;
                    mappedFields.classId = classId;
                  }

                  // Add location ID if this is a location field
                  if (mappedField === 'location') {
                    const locationId = processedValue
                      ? findLocationId(String(processedValue), locations)
                      : null;
                    mappedFields.locationId = locationId;
                  }

                  // Add customer ID if this is a customer field
                  if (mappedField === 'customer') {
                    const customerId = processedValue
                      ? findCustomerId(String(processedValue), customers)
                      : null;
                    mappedFields.customerId = customerId;
                  }

                  // Add customer/project ID if this is a customer/project field
                  // Note: In QuickBooks, projects are also customers (sub-customers)
                  if (mappedField === 'customer / project') {
                    // Don't set customerId here as it's separate from the main customer field
                    // The 'customer / project' field is its own thing
                  }

                  processedMappings.push({
                    excelColumn,
                    mappedField,
                    value: processedValue,
                  });
                }
              },
            );

            // Always ensure hours field is present if we have start/end time or hours column
            if (
              !mappedFields.hours &&
              (startTimeColumnName || hoursColumnName)
            ) {
              mappedFields.hours = hours;
              processedMappings.push({
                excelColumn: startTimeColumnName
                  ? 'calculated'
                  : hoursColumnName || 'hours',
                mappedField: 'hours',
                value: hours,
              });
            }

            // Determine if hours were calculated from start/end time
            const isCalculatedHours =
              !hoursColumnName &&
              startTimeColumnName &&
              endTimeColumnName &&
              hours > 0;

            // Add calculatedHours field if hours were calculated from start/end time
            if (isCalculatedHours) {
              mappedFields.calculatedHours = hours;
            }

            // Process custom fields and add them in structured format
            const customFieldsArray: any[] = [];
            const standardFields = [
              'employee',
              'date',
              'hours',
              'notes',
              'service item',
              'class',
              'location',
              'customer',
              'start time',
              'end time',
              'cost rate',
              'billable',
              'bill rate',
            ];

            Object.entries(mappedColumnMappings).forEach(
              ([excelColumn, qbField]) => {
                if (
                  mappedColumnCheckboxes[excelColumn] &&
                  !standardFields.includes(qbField)
                ) {
                  // For custom fields, check if the value exists on the QB field name first
                  // (it would be there if it was mapped in Step 3)
                  // Otherwise, fall back to the Excel column name
                  let value = entry[qbField]; // Check QB field name first
                  if (value === undefined || value === null || value === '') {
                    value = entry[excelColumn]; // Fall back to Excel column name
                  }

                  if (value !== undefined && value !== null && value !== '') {
                    // Find the custom field definition
                    const customFieldDef = customFields.find(
                      (cf) => cf.name === qbField,
                    );
                    if (customFieldDef) {
                      // Handle dropdown fields
                      let optionID = '';
                      if (
                        customFieldDef.type === 'string' &&
                        customFieldDef.options &&
                        customFieldDef.options.length > 0
                      ) {
                        const matchingOption = customFieldDef.options.find(
                          (option: any) =>
                            option.name &&
                            option.name.toLowerCase().trim() ===
                              String(value).toLowerCase().trim(),
                        );
                        if (matchingOption) {
                          optionID = matchingOption.id;
                        }
                      }

                      customFieldsArray.push({
                        id: customFieldDef.id,
                        name: customFieldDef.name,
                        value: String(value || ''),
                        optionID,
                      });
                    }
                  }
                }
              },
            );

            // Convert all Excel column values (dates, times, numbers) before creating entry
            const convertedEntry: Record<string, any> = {};
            Object.entries(entry).forEach(([key, value]) => {
              const lowerKey = key.toLowerCase();

              // Convert dates
              if (
                lowerKey.includes('date') &&
                (typeof value === 'number' ||
                  (typeof value === 'string' &&
                    !Number.isNaN(Number(value)) &&
                    Number(value) > 1000))
              ) {
                const serial =
                  typeof value === 'string' ? parseFloat(value) : value;
                const excelEpoch = dayjs('1900-01-01');
                const daysOffset = serial > 59 ? serial - 2 : serial - 1;
                const date = excelEpoch.add(daysOffset, 'day');
                convertedEntry[key] = date.format('M/D/YYYY');
              }
              // Convert times
              else if (lowerKey.includes('time') && typeof value === 'number') {
                const timePortion =
                  value >= 1 ? value - Math.floor(value) : value;
                const totalMinutes = Math.round(timePortion * 24 * 60);
                const hrs = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                const ampm = hrs >= 12 ? 'PM' : 'AM';
                const displayHours = hrs % 12 || 12;
                convertedEntry[key] = `${displayHours}:${mins
                  .toString()
                  .padStart(2, '0')} ${ampm}`;
              }
              // Round numeric hours/duration values
              else if (
                (lowerKey.includes('hour') || lowerKey.includes('duration')) &&
                !Number.isNaN(Number(value))
              ) {
                const numValue = parseFloat(String(value));
                convertedEntry[key] = Math.round(numValue * 100) / 100;
              }
              // Keep other values as-is
              else {
                convertedEntry[key] = value;
              }
            });

            // Check if this entry has existing user selections to preserve
            const existingSelection = existingSelections.get(entry.id);

            // Build the base processed entry
            const baseProcessedEntry = {
              ...convertedEntry,
              ...mappedFields, // Add all mapped fields
              employee: finalEmployeeName, // Use the final employee name (mapped or original)
              originalEmployeeName, // Store the original Excel name
              employeeId: matchedEmployee?.id,
              isMissingEmployee: !matchedEmployee,
              fuzzySuggestions, // Store suggestions for user to choose from
              status: matchedEmployee ? 'Valid' : 'Invalid',
              validationErrors: matchedEmployee ? [] : ['missingEmployee'],
              hours, // This will be the calculated hours if calculated, or original hours if from column
              date: dateValue, // Ensure date is from mapped column
              customFields: customFieldsArray, // Add pre-processed custom fields
              // Preserve user selections if they exist
              ...(existingSelection && {
                class: existingSelection.class,
                classId: existingSelection.classId,
                'service item': existingSelection['service item'],
                serviceItemId: existingSelection.serviceItemId,
                location: existingSelection.location,
                locationId: existingSelection.locationId,
                customer: existingSelection.customer,
                customerId: existingSelection.customerId,
                'customer / project': existingSelection['customer / project'],
                customFields:
                  existingSelection.customFields || customFieldsArray,
              }),
            };

            // Apply null-checking AFTER existingSelection spread (only when moving to review)
            if (applyNullification) {
              // Define field mappings: { fieldName: { idField: 'xxxId', unmatchedMap: unmatchedXXX } }
              const fieldMappingsConfig = [
                {
                  field: 'location',
                  idField: 'locationId',
                  unmatchedMap: unmatchedLocations,
                },
                {
                  field: 'class',
                  idField: 'classId',
                  unmatchedMap: unmatchedClasses,
                },
                {
                  field: 'service item',
                  idField: 'serviceItemId',
                  unmatchedMap: unmatchedServices,
                },
                {
                  field: 'customer',
                  idField: 'customerId',
                  unmatchedMap: unmatchedCustomers,
                },
              ];

              // Process each field configuration
              fieldMappingsConfig.forEach(
                ({ field, idField, unmatchedMap }) => {
                  const fieldValue = baseProcessedEntry[field];
                  const idValue = baseProcessedEntry[idField];

                  // If field has a value but no valid ID (no QB match)
                  if (
                    fieldValue &&
                    (idValue === null ||
                      idValue === undefined ||
                      idValue === '')
                  ) {
                    // Field has a value but no QuickBooks ID - check if user mapped it in Step 3
                    const fieldKey = String(fieldValue).toLowerCase();
                    const fieldMapping = unmatchedMap?.[fieldKey];

                    if (
                      fieldMapping &&
                      fieldMapping.mappedId &&
                      fieldMapping.mappedId !== ''
                    ) {
                      // User mapped this value - apply the mapping
                      baseProcessedEntry[field] =
                        fieldMapping.mappedName || String(fieldValue);
                      baseProcessedEntry[idField] = fieldMapping.mappedId;
                    } else {
                      // No mapping - nullify the field
                      baseProcessedEntry[field] = null;
                      baseProcessedEntry[idField] = null;
                    }
                  }
                },
              );

              // Handle 'customer / project' field - apply mapping or nullify if unmapped
              const customerProjectValue =
                baseProcessedEntry['customer / project'];
              if (customerProjectValue) {
                // Check if user mapped it in Step 3
                const customerProjectKey =
                  String(customerProjectValue).toLowerCase();
                const customerProjectMapping =
                  unmatchedCustomers[customerProjectKey];

                if (
                  customerProjectMapping &&
                  customerProjectMapping.mappedId &&
                  customerProjectMapping.mappedId !== ''
                ) {
                  // User mapped this value - apply the mapping
                  baseProcessedEntry['customer / project'] =
                    customerProjectMapping.mappedName ||
                    String(customerProjectValue);
                } else {
                  // Not mapped by user - check if it exists in QB
                  const projectId = findCustomerId(
                    String(customerProjectValue),
                    customers,
                  );
                  if (!projectId) {
                    // Not found in QB and not mapped - nullify
                    baseProcessedEntry['customer / project'] = null;
                  }
                }
              }

              // Nullify unmapped custom field dropdown values
              if (
                baseProcessedEntry.customFields &&
                Array.isArray(baseProcessedEntry.customFields)
              ) {
                baseProcessedEntry.customFields =
                  baseProcessedEntry.customFields.map((cf: any) => {
                    // Find the custom field definition
                    const customFieldDef = customFields.find(
                      (cfd) => cfd.id === cf.id,
                    );

                    // If it's a dropdown field with options
                    if (
                      customFieldDef &&
                      customFieldDef.type === 'string' &&
                      customFieldDef.options &&
                      customFieldDef.options.length > 0
                    ) {
                      // If field has a value but no optionID (unmapped), nullify it
                      if (cf.value && (!cf.optionID || cf.optionID === '')) {
                        return {
                          ...cf,
                          value: '',
                          optionID: '',
                        };
                      }
                    }

                    // Return as-is for non-dropdown fields or already mapped fields
                    return cf;
                  });
              }
            }

            const processedEntry = baseProcessedEntry;

            employeeGroupedData[finalEmployeeName].push(processedEntry);
          });

          // IMPORTANT: Always keep employeeGroupedTimeEntries unfiltered
          // This ensures Step 3 can always extract unmapped fields, even after going back from Review
          // Filtering only happens when creating review.timeEntries (see below)

          // Filter employeeGroupedData if requested (when navigating to review with unmapped employees)
          let finalEmployeeGroupedData = employeeGroupedData;
          if (filterUnmappedEmployees) {
            // Remove employee groups where all entries have isMissingEmployee = true
            finalEmployeeGroupedData = {};
            Object.entries(employeeGroupedData).forEach(
              ([employeeName, entries]) => {
                // Filter out entries with missing employees
                const mappedEntries = entries.filter(
                  (entry) => !entry.isMissingEmployee,
                );

                // Only include this employee group if it has at least one mapped entry
                if (mappedEntries.length > 0) {
                  finalEmployeeGroupedData[employeeName] = mappedEntries;
                }
              },
            );
          }

          dispatch({
            type: 'excelData/setEmployeeGroupedTimeEntries',
            payload: finalEmployeeGroupedData,
          });
        }

        dispatch({ type: 'excelData/setIsProcessingFile', payload: false });

        // Step navigation is now handled in the button click handler above
      } catch (error) {
        dispatch({
          type: 'excelData/setProcessingError',
          payload: error instanceof Error ? error.message : 'Unknown error',
        });
        dispatch({ type: 'excelData/setIsProcessingFile', payload: false });
      }

      // Get DAS employees for matching
      const dasEmployees = employees || [];

      const reviewTimeEntries: any[] = [];

      Object.entries(employeeGroupedTimeEntries).forEach(
        ([employeeName, entries]) => {
          entries.forEach((entry) => {
            // Only process checked mapped columns
            const reviewEntry: any = {
              id: entry.id, // Use the existing ID from the entry
              employee: entry.employee, // Use the employee field from the entry
              status: 'Valid',
              validationErrors: [],
            };

            // Find the employee column mapping to extract employee names
            let employeeColumnName = null;
            Object.entries(mappedColumnMappings).forEach(
              ([excelColumn, qbField]) => {
                if (
                  qbField === 'employee' &&
                  mappedColumnCheckboxes[excelColumn]
                ) {
                  employeeColumnName = excelColumn;
                }
              },
            );

            // Map only checked columns to their QB time field mappings
            Object.entries(mappedColumnMappings).forEach(
              ([excelColumn, qbField]) => {
                if (
                  mappedColumnCheckboxes[excelColumn] &&
                  entry[excelColumn] !== undefined
                ) {
                  const value = entry[excelColumn];

                  // Skip custom field name columns - we only want the values
                  if (
                    excelColumn.includes('custom field name') &&
                    !excelColumn.includes('custom field value')
                  ) {
                    return; // Skip field name columns, but allow field value columns
                  }

                  // Map to review entry fields based on QB Time field names
                  switch (qbField) {
                    case 'employee':
                      // Don't overwrite employee - it's already set correctly from employeeGroupedTimeEntries
                      // reviewEntry.employee = String(value);
                      break;
                    case 'date': {
                      // Strip time portion if present (e.g., "11/24/2025 12:00:00 AM" -> "11/24/2025")
                      const dateStr = String(value);
                      reviewEntry.date = dateStr.includes(' ')
                        ? dateStr.split(' ')[0]
                        : dateStr;
                      break;
                    }
                    case 'duration':
                    case 'hours':
                      reviewEntry.duration = parseFloat(value) || 0;
                      reviewEntry.hours = parseFloat(value) || 0;
                      break;
                    case 'billableRate':
                      reviewEntry.billableRate = parseFloat(value) || 0;
                      break;
                    case 'costRate':
                      reviewEntry.costRate = parseFloat(value) || 0;
                      break;
                    case 'notes':
                      reviewEntry.notes = String(value);
                      break;
                    case 'taxable':
                      reviewEntry.taxable = Boolean(value);
                      break;
                    case 'billableStatus':
                      reviewEntry.billableStatus = String(value);
                      break;
                    case 'timeZone':
                      reviewEntry.timeZone = String(value);
                      break;
                    case 'class':
                      // First check if entry already has a mapped classId from Step 3
                      if (entry.classId) {
                        // Entry already has a valid ID from mapping - use it
                        const mappedClass = classes.find(
                          (c) => c.id === entry.classId,
                        );
                        reviewEntry.class =
                          mappedClass?.fullName || entry.class || String(value);
                        reviewEntry.classId = entry.classId;
                      } else {
                        // No existing mapping - check if this class is in unmatchedClasses and has a mapping
                        const classKey = String(value).toLowerCase();
                        const classMapping = unmatchedClasses[classKey];

                        if (classMapping && classMapping.mappedId) {
                          // Use the mapped value
                          reviewEntry.class =
                            classMapping.mappedName || String(value);
                          reviewEntry.classId = classMapping.mappedId;
                        } else {
                          // Try to find exact match in QuickBooks
                          const classId = value
                            ? findClassId(String(value), classes)
                            : null;
                          if (classId) {
                            // Has a valid match
                            reviewEntry.class = String(value);
                            reviewEntry.classId = classId;
                          } else {
                            // No match found - set to null
                            reviewEntry.class = null;
                            reviewEntry.classId = null;
                          }
                        }
                      }
                      break;
                    case 'service item':
                    case 'serviceItem':
                      // First check if entry already has a mapped serviceItemId from Step 3
                      if (entry.serviceItemId) {
                        // Entry already has a valid ID from mapping - use it
                        const mappedService = services.find(
                          (s) => s.id === entry.serviceItemId,
                        );
                        reviewEntry['service item'] =
                          mappedService?.fullName ||
                          entry['service item'] ||
                          String(value);
                        reviewEntry.serviceItemId = entry.serviceItemId;
                      } else {
                        // No existing mapping - check if this service is in unmatchedServices and has a mapping
                        const serviceKey = String(value).toLowerCase();
                        const serviceMapping = unmatchedServices[serviceKey];

                        if (serviceMapping && serviceMapping.mappedId) {
                          // Use the mapped value
                          reviewEntry['service item'] =
                            serviceMapping.mappedName || String(value);
                          reviewEntry.serviceItemId = serviceMapping.mappedId;
                        } else {
                          // Try to find exact match in QuickBooks
                          const serviceId = value
                            ? findServiceItemId(String(value), services)
                            : null;
                          if (serviceId) {
                            // Has a valid match
                            reviewEntry['service item'] = String(value);
                            reviewEntry.serviceItemId = serviceId;
                          } else {
                            // No match found - set to null
                            reviewEntry['service item'] = null;
                            reviewEntry.serviceItemId = null;
                          }
                        }
                      }
                      break;
                    case 'department':
                      reviewEntry.department = String(value);
                      break;
                    case 'location':
                      // First check if entry already has a mapped locationId from Step 3
                      if (entry.locationId) {
                        // Entry already has a valid ID from mapping - use it
                        const mappedLocation = locations.find(
                          (l) => l.id === entry.locationId,
                        );
                        reviewEntry.location =
                          mappedLocation?.fullName ||
                          entry.location ||
                          String(value);
                        reviewEntry.locationId = entry.locationId;
                      } else {
                        // No existing mapping - check if this location is in unmatchedLocations and has a mapping
                        const locationKey = String(value).toLowerCase();
                        const locationMapping = unmatchedLocations[locationKey];

                        if (locationMapping && locationMapping.mappedId) {
                          // Use the mapped value
                          reviewEntry.location =
                            locationMapping.mappedName || String(value);
                          reviewEntry.locationId = locationMapping.mappedId;
                        } else {
                          // Try to find exact match in QuickBooks
                          const locationId = value
                            ? findLocationId(String(value), locations)
                            : null;
                          if (locationId) {
                            // Has a valid match
                            reviewEntry.location = String(value);
                            reviewEntry.locationId = locationId;
                          } else {
                            // No match found - set to null
                            reviewEntry.location = null;
                            reviewEntry.locationId = null;
                          }
                        }
                      }
                      break;
                    case 'customer':
                    case 'client':
                      // First check if entry already has a mapped customerId from Step 3
                      if (entry.customerId) {
                        // Entry already has a valid ID from mapping - use it
                        const mappedCustomer = customers.find(
                          (c) => c.id === entry.customerId,
                        );
                        reviewEntry.customer =
                          mappedCustomer?.displayName ||
                          entry.customer ||
                          String(value);
                        reviewEntry.customerId = entry.customerId;
                      } else {
                        // No existing mapping - check if this customer is in unmatchedCustomers and has a mapping
                        const customerKey = String(value).toLowerCase();
                        const customerMapping = unmatchedCustomers[customerKey];

                        if (customerMapping && customerMapping.mappedId) {
                          // Use the mapped value
                          reviewEntry.customer =
                            customerMapping.mappedName || String(value);
                          reviewEntry.customerId = customerMapping.mappedId;
                        } else {
                          // Try to find exact match in QuickBooks
                          const customerId = value
                            ? findCustomerId(String(value), customers)
                            : null;
                          if (customerId) {
                            // Has a valid match
                            reviewEntry.customer = String(value);
                            reviewEntry.customerId = customerId;
                          } else {
                            // No match found - set to null
                            reviewEntry.customer = null;
                            reviewEntry.customerId = null;
                          }
                        }
                      }
                      break;
                    case 'customer / project': {
                      // Check if this customer/project is in unmatchedCustomers and has a mapping
                      const projectKey = String(value).toLowerCase();
                      const projectMapping = unmatchedCustomers[projectKey];

                      if (projectMapping && projectMapping.mappedId) {
                        // Use the mapped value
                        reviewEntry['customer / project'] =
                          projectMapping.mappedName || String(value);
                        // Note: customerId is for the 'customer' field, not 'customer / project'
                      } else {
                        // Try to find exact match in QuickBooks (customers + projects)
                        const projectId = value
                          ? findCustomerId(String(value), customers)
                          : null;
                        if (projectId) {
                          // Has a valid match
                          reviewEntry['customer / project'] = String(value);
                        } else {
                          // No match found - set to null
                          reviewEntry['customer / project'] = null;
                        }
                      }
                      break;
                    }
                    case 'start time':
                    case 'startTime':
                      reviewEntry['start time'] = convertExcelSerialTime(value);
                      break;
                    case 'end time':
                    case 'endTime':
                      reviewEntry['end time'] = convertExcelSerialTime(value);
                      break;
                    default:
                      // Handle custom fields and any other QB Time fields
                      reviewEntry[qbField] = value;
                  }
                }
              },
            );

            // Copy custom fields from entry (they were already processed and nullified if needed)
            if (entry.customFields && Array.isArray(entry.customFields)) {
              reviewEntry.customFields = entry.customFields;
            }

            // Check for employee mapping
            if (reviewEntry.employee) {
              // First, check if the entry already has employeeId from grouping (Step 2/3 processing)
              if (entry.employeeId) {
                // Entry already has been processed and has an employeeId
                reviewEntry.employeeId = entry.employeeId;
                reviewEntry.isMissingEmployee =
                  entry.isMissingEmployee || false;
                reviewEntry.status = entry.isMissingEmployee
                  ? 'Invalid'
                  : 'Valid';
                reviewEntry.validationErrors = entry.validationErrors || [];
              } else {
                // Fallback: Try to match the employee
                let matchedEmployee = null;

                // Priority 1: Check UX preferences for saved employee mappings
                const uxMapping = uxEmployeeMappings[reviewEntry.employee];
                if (uxMapping && uxMapping.employeeId) {
                  matchedEmployee = dasEmployees.find(
                    (emp) => emp.id === uxMapping.employeeId,
                  );
                }

                // Priority 2: Check fieldMappings for manually mapped employees (from step 3)
                if (!matchedEmployee) {
                  const employeeKey = reviewEntry.employee.toLowerCase();
                  const employeeMapping = unmatchedEmployees[employeeKey];

                  if (employeeMapping && employeeMapping.mappedId) {
                    // Use the mapped employee from step 3
                    matchedEmployee = dasEmployees.find(
                      (emp) => emp.id === employeeMapping.mappedId,
                    );
                  }
                }

                // Priority 3: Auto-match with DAS employees using regex (if not already mapped)
                if (!matchedEmployee) {
                  matchedEmployee = dasEmployees.find((emp) => {
                    const empName = emp.name.toLowerCase().trim();
                    const excelName = reviewEntry.employee.toLowerCase().trim();
                    // Use regex to match with flexible spacing and case
                    const regex = new RegExp(
                      excelName.replace(/\s+/g, '\\s*'),
                      'i',
                    );
                    return regex.test(empName) || empName === excelName;
                  });
                }

                if (matchedEmployee) {
                  reviewEntry.employee = matchedEmployee.name; // Update to mapped employee name
                  reviewEntry.employeeId = matchedEmployee.id;
                  reviewEntry.isMissingEmployee = false;
                  reviewEntry.status = 'Valid';
                  reviewEntry.validationErrors = [];
                } else {
                  reviewEntry.isMissingEmployee = true;
                  reviewEntry.status = 'Invalid';
                  reviewEntry.validationErrors = ['missingEmployee'];
                }
              }
            }

            // Filter out unmapped employees only when moving to review
            if (filterUnmappedEmployees) {
              // Only add to review if employee is mapped (ignore unmapped employees)
              if (!reviewEntry.isMissingEmployee) {
                // Additionally, filter out entries with missing required fields
                let hasMissingRequiredFields = false;

                // Check if notes are required and missing
                if (companySettings?.timeSheetEntryMakesNotesRequiredEnabled) {
                  if (!reviewEntry.notes || reviewEntry.notes === '') {
                    hasMissingRequiredFields = true;
                  }
                }

                // Check if service item is required and missing
                if (companySettings?.serviceItemRequired) {
                  if (
                    !reviewEntry.serviceItemId ||
                    reviewEntry.serviceItemId === null
                  ) {
                    hasMissingRequiredFields = true;
                  }
                }

                // Check if class is required and missing
                if (companySettings?.classRequired) {
                  if (!reviewEntry.classId || reviewEntry.classId === null) {
                    hasMissingRequiredFields = true;
                  }
                }

                // Check if location is required and missing
                if (companySettings?.locationRequired) {
                  if (
                    !reviewEntry.locationId ||
                    reviewEntry.locationId === null
                  ) {
                    hasMissingRequiredFields = true;
                  }
                }

                // Check if billable is required and missing
                if (companySettings?.requireBillable) {
                  if (
                    reviewEntry.billable === null ||
                    reviewEntry.billable === undefined
                  ) {
                    hasMissingRequiredFields = true;
                  }
                }

                // Check required custom fields
                if (customFields && customFields.length > 0) {
                  customFields.forEach((cf: any) => {
                    if (cf.required) {
                      // Find the custom field value in reviewEntry
                      const cfValue = reviewEntry[cf.name];
                      if (!cfValue || cfValue === '' || cfValue === null) {
                        hasMissingRequiredFields = true;
                      }
                    }
                  });
                }

                // Only add if no missing required fields
                if (!hasMissingRequiredFields) {
                  reviewTimeEntries.push(reviewEntry);
                }
              }
            } else {
              // Include all employees (for Step 3 mapping)
              reviewTimeEntries.push(reviewEntry);
            }
          });
        },
      );

      dispatch(setTimeEntries(reviewTimeEntries));

      // Note: Column mappings are saved in Step2Mapping.tsx (saveAllPreferences)
      // We don't save them here to avoid overwriting with unchecked mappings
    },
    [dispatch, employees, getEmployeeMappings, customFields],
  );

  return { processMappingToReviewEntries };
};
