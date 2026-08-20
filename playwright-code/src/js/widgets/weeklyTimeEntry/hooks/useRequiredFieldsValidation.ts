import { useCallback, useMemo } from 'react';
import { useIntl } from '@payroll/quicksand';
import { isStandardFieldAssigned } from 'src/js/common/assignmentFieldUtils';
import { isRequiredOnForm } from 'src/js/widgets/common/dimensions';
import { useAppSelector } from '../store';
import {
  selectAllTimesheetRows,
  selectCompanySettings,
  selectCustomFields,
  selectDimensions,
  selectDimensionsEnabled,
} from '../store/selectors';
import { selectCustomerAssignments } from '../store/assignmentSlice';
import { timeEntryDetails } from '../store/timeEntryGridSlice';
import { useUnsavedChangesDetection } from './useUnsavedChangesDetection';
import { labelPreferenceRef } from '../../common/types';

interface MissingRequiredField {
  rowId: string;
  dayIndex: number;
  date: string;
  missingFields: string[];
}

interface DayTotalError {
  dayIndex: number;
  dayLabel: string;
  totalHours: number;
}

interface RequiredFieldsValidationResult {
  isValid: boolean;
  missingFields: MissingRequiredField[];
  dayTotalErrors: DayTotalError[];
  errorMessages: string[];
  fieldErrors: {
    [cellKey: string]: {
      service?: string;
      class?: string;
      location?: string;
      notes?: string;
      hours?: string;
      customerProject?: string;
      customFields?: { [fieldId: string]: string };
      dimensions?: { [definitionId: string]: string };
    };
  };
  rowErrors: {
    [rowId: string]: {
      overHours?: string;
    };
  };
}

export const useRequiredFieldsValidation = (
  labelPreference?: labelPreferenceRef,
) => {
  const intl = useIntl();
  const MIN_HOURS = 0;
  const weeklyTimeEntries = useAppSelector(selectAllTimesheetRows);
  const companySettings = useAppSelector(selectCompanySettings);
  const customFields = useAppSelector(selectCustomFields);
  const dimensions = useAppSelector(selectDimensions);
  const dimensionsEnabled = useAppSelector(selectDimensionsEnabled);
  const selectedCell = useAppSelector((state) => state.timeEntryGrid.selected);
  // Get the full assignments state to look up by customer
  const assignmentsState = useAppSelector((state) => state.assignments);

  // Use the existing unsaved changes detection hook
  const { hasUnsavedChanges } = useUnsavedChangesDetection();

  // Field definitions to avoid duplication - memoized to prevent recreation
  const fieldDefinitions = useMemo(
    () => ({
      service: () =>
        intl.formatMessage({
          id: 'weekly.time.entry.validation.field.service',
        }),
      class: () =>
        intl.formatMessage({
          id: 'weekly.time.entry.validation.field.class',
        }),
      location: () =>
        labelPreference?.DepartmentTerminology ||
        intl.formatMessage({
          id: 'weekly.time.entry.validation.field.location',
        }),
      notes: () =>
        intl.formatMessage({
          id: 'weekly.time.entry.validation.field.notes',
        }),
      timeCategory: () =>
        intl.formatMessage({
          id: 'weekly.time.entry.validation.field.time.category',
        }),
    }),
    [intl, labelPreference],
  );

  // Field error type definition
  type FieldError = {
    service?: string;
    class?: string;
    location?: string;
    notes?: string;
    hours?: string;
    customerProject?: string;
    customFields?: { [fieldId: string]: string };
    dimensions?: { [definitionId: string]: string };
  };

  // Helper function to check if a field is missing - memoized
  const isFieldMissing = useMemo(
    () =>
      (missingFields: string[], fieldName: string): boolean =>
        missingFields.includes(fieldName),
    [],
  );

  // Helper function to create field errors - memoized
  const createFieldError = useMemo(
    () =>
      (missingFields: string[]): FieldError => ({
        service: isFieldMissing(missingFields, fieldDefinitions.service())
          ? 'Required'
          : undefined,
        class: isFieldMissing(missingFields, fieldDefinitions.class())
          ? 'Required'
          : undefined,
        location: isFieldMissing(missingFields, fieldDefinitions.location())
          ? 'Required'
          : undefined,
        notes: isFieldMissing(missingFields, fieldDefinitions.notes())
          ? 'Required'
          : undefined,
        hours: isFieldMissing(missingFields, 'Hours')
          ? intl.formatMessage({
              id: 'weekly.time.entry.validation.minimum.hours.required',
              defaultMessage:
                'Minimum hours required greater than 0 before save',
            })
          : undefined,

        customerProject: isFieldMissing(
          missingFields,
          fieldDefinitions.timeCategory(),
        )
          ? 'Required'
          : undefined,
      }),
    [fieldDefinitions, isFieldMissing, intl],
  );

  // Helper function to group missing fields by date - memoized
  const groupMissingFieldsByDate = useMemo(
    () =>
      (missingFields: MissingRequiredField[]): { [date: string]: string[] } => {
        const missingFieldsByDate: { [date: string]: string[] } = {};

        missingFields.forEach((field) => {
          // Use timezone-safe date formatting like in timeEntryTransformer.ts
          const parseDateString = (dateString: string) => {
            const parts = dateString.split('-');
            if (parts.length !== 3) return null;

            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);

            if (
              Number.isNaN(year) ||
              Number.isNaN(month) ||
              Number.isNaN(day)
            ) {
              return null;
            }

            return { year, month, day };
          };

          const createLocalDate = (year: number, month: number, day: number) =>
            new Date(year, month - 1, day); // month is 0-indexed in Date constructor
          // Parse the date string safely
          const parsedDate = parseDateString(field.date);
          if (!parsedDate) {
            // Fallback to original date if parsing fails
            const dayjs = require('dayjs');
            const dateObj = dayjs(field.date);
            const formattedDate = dateObj.format('dddd, M/D/YYYY');

            if (!missingFieldsByDate[formattedDate]) {
              missingFieldsByDate[formattedDate] = [];
            }
            missingFieldsByDate[formattedDate].push(...field.missingFields);
            return;
          }

          // Create date object in local timezone to avoid timezone shifts
          const dateObj = createLocalDate(
            parsedDate.year,
            parsedDate.month,
            parsedDate.day,
          );

          // Format the date using the same approach as timeEntryTransformer.ts
          const dayNames = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ];
          const dayName = dayNames[dateObj.getDay()];
          const month = dateObj.getMonth() + 1; // getMonth() is 0-indexed
          const day = dateObj.getDate();
          const year = dateObj.getFullYear();

          const formattedDate = `${dayName}, ${month}/${day}/${year}`;

          if (!missingFieldsByDate[formattedDate]) {
            missingFieldsByDate[formattedDate] = [];
          }
          missingFieldsByDate[formattedDate].push(...field.missingFields);
        });

        return missingFieldsByDate;
      },
    [],
  );

  // Helper function to create error messages from grouped fields - memoized
  const createErrorMessagesFromGroupedFields = useMemo(
    () =>
      (missingFieldsByDate: { [date: string]: string[] }): string[] => {
        const errorMessages: string[] = [];

        Object.entries(missingFieldsByDate).forEach(([date, fields]) => {
          const uniqueFields = [...new Set(fields)];
          errorMessages.push(`${date}: ${uniqueFields.join(', ')}`);
        });

        return errorMessages;
      },
    [],
  );

  // Validation rules map for better maintainability - memoized
  const getValidationRules = useMemo(
    () => () => {
      const rules = [
        {
          key: 'service',
          isRequired:
            companySettings.serviceItemRequired &&
            companySettings.isServiceFieldEnabled,
          getValue: (dayEntry: any, row?: any) =>
            dayEntry.metaInfo?.service?.id,
          getFieldName: () => fieldDefinitions.service(),
          getErrorMessage: () =>
            intl.formatMessage({
              id: 'weekly.time.entry.validation.field.required',
            }),
        },
        {
          key: 'class',
          isRequired:
            companySettings.classRequired && companySettings.isClassEnabled,
          getValue: (dayEntry: any, row?: any) => dayEntry.metaInfo?.class?.id,
          getFieldName: () => fieldDefinitions.class(),
          getErrorMessage: () =>
            intl.formatMessage({
              id: 'weekly.time.entry.validation.field.required',
            }),
        },
        {
          key: 'location',
          isRequired:
            companySettings.locationRequired &&
            companySettings.isLocationEnabled,
          getValue: (dayEntry: any, row?: any) =>
            dayEntry.metaInfo?.location?.id,
          getFieldName: () => fieldDefinitions.location(),
          getErrorMessage: () =>
            intl.formatMessage({
              id: 'weekly.time.entry.validation.field.required',
            }),
        },
        {
          key: 'notes',
          isRequired: companySettings.timeSheetEntryMakesNotesRequiredEnabled,
          getValue: (dayEntry: any, row?: any) => dayEntry.notes,
          getFieldName: () => fieldDefinitions.notes(),
          getErrorMessage: () =>
            intl.formatMessage({
              id: 'weekly.time.entry.validation.field.required',
            }),
          validate: (value: any) => value && value.trim() !== '',
        },
        {
          key: 'hours',
          isRequired: (dayEntry: any) =>
            dayEntry.operation === 'CREATE' || dayEntry.operation === 'UPDATE',
          getValue: (dayEntry: any, row?: any) => dayEntry.hours,
          getFieldName: () => 'Hours',
          getErrorMessage: () =>
            intl.formatMessage({
              id: 'weekly.time.entry.validation.minimum.hours.required',
              defaultMessage:
                'Minimum hours required greater than 0 before save',
            }),
          validate: (value: any) => value && value > 0,
        },
        {
          key: 'customerProject',
          isRequired: (dayEntry: any, row?: any) => {
            if (!dayEntry.billableInfo?.billable) return false;
            // Require time category when billable is active and the field is assigned (or settings demand it).
            const custId = row?.timeAgainst?.id;
            if (!custId) {
              return companySettings.isBillingFieldEnabled;
            }
            const custData = assignmentsState.customerAssignments[custId];
            if (!custData || custData.standardFieldAssignments.length === 0) {
              return companySettings.isBillingFieldEnabled;
            }
            return isStandardFieldAssigned(
              custData.standardFieldAssignments,
              'billable',
            );
          },
          getValue: (dayEntry: any, row?: any) => row?.timeAgainst?.id,
          getFieldName: () => fieldDefinitions.timeCategory(),
          getErrorMessage: () =>
            intl.formatMessage({
              id: 'weekly.time.entry.validation.field.time.category',
            }),
          validate: (value: any) => value && value !== '',
        },
      ];

      return rules;
    },
    [companySettings, intl, fieldDefinitions, assignmentsState],
  );

  // Helper function to validate a field - memoized
  const validateField = useMemo(
    () =>
      (dayEntry: any, rule: any, row?: any): string | null => {
        // Check if the field is required (handle both boolean and function-based isRequired)
        const isRequired =
          typeof rule.isRequired === 'function'
            ? rule.isRequired(dayEntry, row)
            : rule.isRequired;

        if (!isRequired) return null;

        const value = rule.getValue(dayEntry, row);

        const isValid = rule.validate
          ? rule.validate(value, dayEntry)
          : value && value !== '';

        return isValid ? null : rule.getFieldName();
      },
    [],
  );

  const validateRequiredFields =
    useCallback((): RequiredFieldsValidationResult => {
      const missingFields: MissingRequiredField[] = [];
      const dayTotalErrors: DayTotalError[] = [];

      // Check day totals across all rows - always check this regardless of unsaved changes
      // because day total errors represent invalid existing data
      const dayTotals = new Map<number, number>();
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Filter out deleted rows for validation - deleted rows should not be validated
      const filteredWeeklyTimeEntries = weeklyTimeEntries.filter(
        (row) => !row.deleted,
      );

      if (filteredWeeklyTimeEntries.length > 0) {
        filteredWeeklyTimeEntries.forEach((row) => {
          Object.entries(row.timeEntries).forEach(([dayIndexStr, dayEntry]) => {
            const dayIndex = parseInt(dayIndexStr, 10);
            const hours = dayEntry.hours || 0;

            // Include ALL hours for day total validation, not just ones with operations
            // Day total validation should check total hours regardless of save status
            const currentTotal = dayTotals.get(dayIndex) || 0;
            dayTotals.set(dayIndex, currentTotal + hours);
          });
        });
      }

      // Check if any day total exceeds 24 hours
      dayTotals.forEach((totalHours, dayIndex) => {
        if (totalHours > 24) {
          const dayLabel = dayLabels[dayIndex];
          dayTotalErrors.push({
            dayIndex,
            dayLabel,
            totalHours,
          });
        }
      });

      // Only check for missing required fields if there are unsaved changes
      if (hasUnsavedChanges) {
        if (filteredWeeklyTimeEntries.length > 0) {
          filteredWeeklyTimeEntries.forEach((row) => {
            // Get row assignments by looking up the customer from assignmentSlice
            const customerId = row.timeAgainst?.id || null;
            const customerAssignments = customerId
              ? assignmentsState.customerAssignments[customerId]
              : null;
            const { globalOptions } = assignmentsState;

            // Same logic as useWTERowFieldVisibility: only validate required for CFs that are
            // (1) assigned to this customer AND (2) if dropdown, have at least one assigned option.
            // Not assigned -> skip validation. Assigned but no CFO options -> skip (field is hidden).
            const assignedCFIds = new Set<string>();
            customerAssignments?.customFieldAssignments
              ?.filter((cf) => cf.assigned)
              .forEach((cf) => {
                const options =
                  customerAssignments.customFieldOptionAssignments?.[cf.id] ??
                  globalOptions?.customFieldOptions?.[cf.id];
                const hasNoOptions =
                  Array.isArray(options) && options.length === 0;
                if (hasNoOptions) {
                  return; // No options assigned -> don't show, don't validate required
                }
                const hasAssignedOption =
                  Array.isArray(options) &&
                  options.length > 0 &&
                  options.some(
                    (opt: { assigned?: boolean }) => opt.assigned === true,
                  );
                const isDropdownWithOptions =
                  Array.isArray(options) && options.length > 0;
                if (isDropdownWithOptions ? hasAssignedOption : true) {
                  assignedCFIds.add(cf.id);
                }
              });

            Object.entries(row.timeEntries).forEach(
              ([dayIndexStr, dayEntry]) => {
                const dayIndex = parseInt(dayIndexStr, 10);

                // Only validate entries that have hours and are being saved (CREATE/UPDATE operations)
                if (
                  (dayEntry.hours ?? MIN_HOURS) > MIN_HOURS &&
                  (dayEntry.operation === 'CREATE' ||
                    dayEntry.operation === 'UPDATE')
                ) {
                  const missingFieldsForDay: string[] = [];
                  const validationRules = getValidationRules();

                  // Check if this is a break row
                  const isBreakRow =
                    row.timeAgainst?.type === 'PAID' ||
                    row.timeAgainst?.type === 'UNPAID';

                  // Validate standard fields using rules map - skip service, class, location, billable, notes for break rows
                  validationRules.forEach((rule) => {
                    // Skip validation for service, class, location, billable, notes fields on break rows
                    if (
                      isBreakRow &&
                      [
                        'service',
                        'class',
                        'location',
                        'customerProject',
                        'notes',
                      ].includes(rule.key)
                    ) {
                      return;
                    }

                    const missingField = validateField(dayEntry, rule, row);
                    if (missingField) {
                      missingFieldsForDay.push(missingField);
                    }
                  });

                  // Check Custom Fields (if required) - skip for break rows

                  if (!isBreakRow) {
                    const requiredCustomFields = customFields?.filter(
                      (field) => field.required && !field.deleted,
                    );
                    const missingCustomFields: string[] = [];

                    requiredCustomFields.forEach((field) => {
                      // Only validate required when this CF is assigned and visible for this row:
                      // - Not assigned to customer -> skip (e.g. ExistingStagingCF for customer 3)
                      // - Assigned but no CFO options (dropdown) -> skip (field hidden, not required)
                      if (!assignedCFIds.has(field.id)) {
                        return;
                      }

                      const fieldValue = dayEntry.customFields?.find(
                        (cf) => cf.id === field.id,
                      )?.value;
                      if (!fieldValue || fieldValue.trim() === '') {
                        missingCustomFields.push(field.name);
                      }
                    });

                    if (missingCustomFields.length > 0) {
                      missingFieldsForDay.push(...missingCustomFields);
                    }
                  }

                  // Check Custom Dimensions (if required) - skip for break rows.
                  // A dimension is required only when it is active,
                  // enabledForTimeTracking and flagged required (isRequiredOnForm).
                  if (!isBreakRow && dimensionsEnabled) {
                    dimensions
                      .filter((def) => isRequiredOnForm(def))
                      .forEach((def) => {
                        const optionID = dayEntry.dimensions?.find(
                          (dim) => dim.id === def.id,
                        )?.optionID;
                        if (!optionID || optionID.trim() === '') {
                          missingFieldsForDay.push(def.name);
                        }
                      });
                  }

                  if (missingFieldsForDay.length > 0) {
                    missingFields.push({
                      rowId: row.rowId,
                      dayIndex,
                      date: dayEntry.date,
                      missingFields: missingFieldsForDay,
                    });
                  }
                }
              },
            );
          });
        }
      }

      const hasMissingFields = missingFields.length > 0;
      const hasDayTotalErrors = dayTotalErrors.length > 0;
      const isValid = !hasMissingFields && !hasDayTotalErrors;

      // Create error message if there are missing fields or day total errors
      const errorMessages: string[] = [];
      if (!isValid) {
        // Determine if we have multiple error types
        const hasMultipleErrors = hasMissingFields && hasDayTotalErrors;

        if (hasMultipleErrors) {
          // Multiple errors: no title, start with bullet points
          if (hasDayTotalErrors) {
            errorMessages.push(
              intl.formatMessage({
                id: 'weekly.time.entry.validation.day.total.over.limit',
              }),
            );
          }

          if (hasMissingFields) {
            const missingFieldsByDate = groupMissingFieldsByDate(missingFields);
            const groupedErrorMessages =
              createErrorMessagesFromGroupedFields(missingFieldsByDate);
            errorMessages.push(...groupedErrorMessages);
          }
        } else if (hasDayTotalErrors) {
          // Only day total errors
          errorMessages.push(
            intl.formatMessage({
              id: 'weekly.time.entry.validation.day.total.over.limit',
            }),
          );
        } else if (hasMissingFields) {
          // Only required fields error
          errorMessages.push(
            intl.formatMessage({
              id: 'weekly.time.entry.validation.required.fields.missing.header',
            }),
          );

          const missingFieldsByDate = groupMissingFieldsByDate(missingFields);
          const groupedErrorMessages =
            createErrorMessagesFromGroupedFields(missingFieldsByDate);
          errorMessages.push(...groupedErrorMessages);
        }
      }

      // Check field errors for all cells with missing required fields
      const fieldErrors: { [cellKey: string]: FieldError } = {};

      missingFields.forEach((field) => {
        const cellKey = `${field.rowId}-${field.dayIndex}`;
        const fieldError = createFieldError(field.missingFields);

        // Handle custom fields
        const customFieldErrors: { [fieldId: string]: string } = {};
        field.missingFields.forEach((missingField) => {
          // Check if this is a custom field by looking it up in the customFields array
          const customField = customFields?.find(
            (cf) => cf.name === missingField,
          );
          if (customField) {
            customFieldErrors[customField.id] = 'Required';
          }
        });

        if (Object.keys(customFieldErrors).length > 0) {
          fieldError.customFields = customFieldErrors;
        }

        // Handle custom dimensions - map the missing dimension label back to
        // its definition id so WeeklyDimensions can surface the per-field error.
        const dimensionErrors: { [definitionId: string]: string } = {};
        field.missingFields.forEach((missingField) => {
          const dimension = dimensions.find((def) => def.name === missingField);
          if (dimension) {
            dimensionErrors[dimension.id] = 'Required';
          }
        });

        if (Object.keys(dimensionErrors).length > 0) {
          fieldError.dimensions = dimensionErrors;
        }

        fieldErrors[cellKey] = fieldError;

        // Handle row-level errors (like Time category) - apply to the time-category cell
        if (
          isFieldMissing(field.missingFields, fieldDefinitions.timeCategory())
        ) {
          const timeCategoryCellKey = `${field.rowId}-time-category`;
          fieldErrors[timeCategoryCellKey] = {
            customerProject: 'Required',
          };
        }
      });

      return {
        isValid,
        missingFields,
        dayTotalErrors,
        errorMessages,
        fieldErrors,
        rowErrors: {},
      };
    }, [
      weeklyTimeEntries,
      customFields,
      dimensions,
      dimensionsEnabled,
      intl,
      fieldDefinitions,
      isFieldMissing,
      createFieldError,
      groupMissingFieldsByDate,
      createErrorMessagesFromGroupedFields,
      getValidationRules,
      validateField,
      hasUnsavedChanges,
      assignmentsState,
    ]);

  return { validateRequiredFields };
};
