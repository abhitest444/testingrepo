import { EmployeeNameMatcher } from '../utils/EmployeeNameMatcher';
import {
  parseDate,
  normalizeDate,
  formatDateForAPI,
} from '../utils/timezoneUtils';

export interface ValidationService {
  // Step 1: Map employee names with DAS, then UX preferences, then fuzzy matching
  mapEmployeeName: (
    originalName: string,
    dasEmployees: any[],
    uxEmployeeMappings: Record<string, any>,
  ) => Promise<{
    matched: boolean;
    employeeId?: string;
    employeeName?: string;
    fuzzySuggestions?: any[];
  }>;

  // Step 2: Map time entries with employee ID after mapping
  mapTimeEntriesWithEmployee: (
    timeEntries: any[],
    employeeMappings: Record<
      string,
      { employeeId: string; employeeName: string }
    >,
  ) => any[];

  // Step 3 & 4: Validate 24-hour limits
  validate24HourLimits: (
    existingTimeEntries: any[],
    uploadedTimeEntries: any[],
  ) => Record<
    string,
    {
      employeeId: string;
      date: string;
      totalHours: number;
      exceeds24Hours: boolean;
      validationErrors: string[];
    }
  >;

  // Step 5: Validate other missing fields
  validateMissingFields: (
    timeEntries: any[],
    customers: any[],
    services: any[],
    classes: any[],
    locations: any[],
  ) => any[];

  // Step 6: Get valid time entries for accept all
  getValidTimeEntries: (
    timeEntries: any[],
    validationResults: Record<string, any>,
  ) => any[];

  // Step 7: Filter and categorize all time entries
  filterAndCategorizeTimeEntries: (
    timeEntries: any[],
    validationResults: Record<string, any>,
  ) => {
    valid: Record<string, any[]>;
    invalid: Record<string, any[]>;
    missingEmployees: Record<string, any[]>;
    needsReview: Record<string, any[]>;
    all: Record<string, any[]>;
  };
}

// Use timezone-safe date normalization from utils
const normalizeDateForValidation = (dateString: string): string =>
  normalizeDate(dateString);

export const mapEmployeeName = async (
  originalName: string,
  dasEmployees: any[],
  uxEmployeeMappings: Record<string, any>,
): Promise<{
  matched: boolean;
  employeeId?: string;
  employeeName?: string;
  fuzzySuggestions?: any[];
}> => {
  // Initialize EmployeeNameMatcher with actual dasEmployees list
  const employeeMatcher = new EmployeeNameMatcher(dasEmployees || []);

  // Step 1: Try DAS exact match first
  const dasMatch = employeeMatcher.findBestMatch(originalName);
  if (dasMatch) {
    return {
      matched: true,
      employeeId: dasMatch.employee.id,
      employeeName: dasMatch.employee.name,
    };
  }

  // Step 2: Check UX preferences
  const uxMapping = uxEmployeeMappings[originalName];
  if (uxMapping && uxMapping.employeeId && uxMapping.employeeName) {
    return {
      matched: true,
      employeeId: uxMapping.employeeId,
      employeeName: uxMapping.employeeName,
    };
  }

  // Step 3: Get fuzzy suggestions
  const fuzzySuggestions = employeeMatcher.findFuzzyMatches(
    originalName,
    [],
    3,
  );
  return {
    matched: false,
    fuzzySuggestions,
  };
};

export const mapTimeEntriesWithEmployee = (
  timeEntries: any[],
  employeeMappings: Record<
    string,
    { employeeId: string; employeeName: string }
  >,
): any[] =>
  timeEntries.map((entry) => {
    const mapping =
      employeeMappings[entry.originalEmployeeName || entry.employee];
    if (mapping) {
      return {
        ...entry,
        employeeId: mapping.employeeId,
        employee: mapping.employeeName,
        isMissingEmployee: false,
      };
    }
    return entry;
  });

export const validate24HourLimits = (
  existingTimeEntries: any[],
  uploadedTimeEntries: any[],
): Record<
  string,
  {
    employeeId: string;
    date: string;
    totalHours: number;
    exceeds24Hours: boolean;
    validationErrors: string[];
  }
> => {
  const validationResults: Record<string, any> = {};

  // Group existing time entries by employee and normalized date
  const existingByEmployeeAndDate: Record<string, Record<string, any[]>> = {};
  existingTimeEntries.forEach((entry) => {
    const employeeId = entry.timeForId;
    const normalizedDate = normalizeDateForValidation(entry.date);
    if (!existingByEmployeeAndDate[employeeId]) {
      existingByEmployeeAndDate[employeeId] = {};
    }
    if (!existingByEmployeeAndDate[employeeId][normalizedDate]) {
      existingByEmployeeAndDate[employeeId][normalizedDate] = [];
    }
    existingByEmployeeAndDate[employeeId][normalizedDate].push(entry);
  });

  // Group uploaded entries by employee and normalized date
  // Skip validation for missing employees
  const uploadedByEmployeeAndDate: Record<string, Record<string, any[]>> = {};
  uploadedTimeEntries.forEach((entry) => {
    // Skip validation for missing employees
    if (entry.isMissingEmployee) {
      return;
    }

    const { employeeId } = entry;
    const normalizedDate = normalizeDateForValidation(entry.date);
    if (!uploadedByEmployeeAndDate[employeeId]) {
      uploadedByEmployeeAndDate[employeeId] = {};
    }
    if (!uploadedByEmployeeAndDate[employeeId][normalizedDate]) {
      uploadedByEmployeeAndDate[employeeId][normalizedDate] = [];
    }
    uploadedByEmployeeAndDate[employeeId][normalizedDate].push(entry);
  });

  // Validate existing + uploaded combinations
  Object.entries(existingByEmployeeAndDate).forEach(
    ([employeeId, dateEntries]) => {
      Object.entries(dateEntries).forEach(
        ([normalizedDate, existingEntries]) => {
          const existingHours = existingEntries.reduce(
            (sum, entry) => sum + (entry.duration || 0),
            0,
          );

          // Find matching uploaded entries using normalized date
          const uploadedEntries =
            uploadedByEmployeeAndDate[employeeId]?.[normalizedDate] || [];

          const uploadedHours = uploadedEntries.reduce((sum, entry) => {
            const hours = entry.calculatedHours || entry.hours || 0;
            return (
              sum + (typeof hours === 'number' ? hours : parseFloat(hours) || 0)
            );
          }, 0);

          const totalHours = existingHours + uploadedHours;
          const key = `${employeeId}-${normalizedDate}`;

          validationResults[key] = {
            employeeId,
            date: normalizedDate,
            totalHours,
            exceeds24Hours: totalHours >= 24,
            validationErrors:
              totalHours >= 24
                ? [
                    `Total hours exceed 24 hours per day limit (Total: ${totalHours.toFixed(
                      2,
                    )}hrs)`,
                  ]
                : [],
          };
        },
      );
    },
  );

  // Validate uploaded entries against each other
  Object.entries(uploadedByEmployeeAndDate).forEach(
    ([employeeId, dateEntries]) => {
      Object.entries(dateEntries).forEach(([normalizedDate, entries]) => {
        const totalHours = entries.reduce((sum, entry) => {
          const hours = entry.calculatedHours || entry.hours || 0;
          return (
            sum + (typeof hours === 'number' ? hours : parseFloat(hours) || 0)
          );
        }, 0);

        const key = `${employeeId}-${normalizedDate}`;

        // Only set if not already set by existing + uploaded validation
        if (!validationResults[key]) {
          validationResults[key] = {
            employeeId,
            date: normalizedDate,
            totalHours,
            exceeds24Hours: totalHours >= 24,
            validationErrors:
              totalHours >= 24
                ? [
                    `Total hours exceed 24 hours per day limit (Uploaded total: ${totalHours.toFixed(
                      2,
                    )}hrs)`,
                  ]
                : [],
          };
        }
      });
    },
  );

  return validationResults;
};

export const validateMissingFields = (
  timeEntries: any[],
  customers: any[],
  services: any[],
  classes: any[],
  locations: any[],
  columnMappings: Record<string, string> = {},
  companySettings: any = null,
): any[] =>
  timeEntries.map((entry) => {
    const validationErrors: string[] = [];

    // Skip validation for missing employees (but still mark as error)
    if (entry.isMissingEmployee) {
      return {
        ...entry,
        validationErrors: ['missingEmployee'],
        status: 'Invalid',
      };
    }

    // Check required fields
    if (!entry.date || entry.date === '') {
      validationErrors.push('date');
    }

    const hours = entry.hours || entry.calculatedHours || 0;
    if (!hours || hours <= 0) {
      validationErrors.push('hours');
    }

    // Check approval status
    if (entry.approvalStatus === 'APPROVED') {
      validationErrors.push('already approved');
    }

    // IMPORTANT: Replace validation errors, don't append to avoid duplicates
    return {
      ...entry,
      validationErrors,
      status: validationErrors.length > 0 ? 'Invalid' : 'Valid',
    };
  });

export const getValidTimeEntries = (
  timeEntries: any[],
  validationResults: Record<string, any>,
): any[] =>
  timeEntries.filter((entry) => {
    const key = `${entry.employeeId}-${entry.date}`;
    const validation = validationResults[key];
    return !validation || !validation.exceeds24Hours;
  });

export const filterAndCategorizeTimeEntries = (
  timeEntries: any[],
  validationResults: Record<string, any>,
): {
  valid: Record<string, any[]>;
  invalid: Record<string, any[]>;
  missingEmployees: Record<string, any[]>;
  needsReview: Record<string, any[]>;
  all: Record<string, any[]>;
} => {
  const result = {
    valid: {} as Record<string, any[]>,
    invalid: {} as Record<string, any[]>,
    missingEmployees: {} as Record<string, any[]>,
    needsReview: {} as Record<string, any[]>,
    all: {} as Record<string, any[]>,
  };

  // Group by employee name
  const groupedByEmployee: Record<string, any[]> = {};
  timeEntries.forEach((entry) => {
    const employeeName = entry.employee;
    if (!groupedByEmployee[employeeName]) {
      groupedByEmployee[employeeName] = [];
    }
    groupedByEmployee[employeeName].push(entry);
  });

  // Categorize each employee's entries
  Object.entries(groupedByEmployee).forEach(([employeeName, entries]) => {
    // All entries for this employee
    result.all[employeeName] = entries;

    // Check if employee is missing
    const hasMissingEmployee = entries.some((entry) => entry.isMissingEmployee);
    if (hasMissingEmployee) {
      result.missingEmployees[employeeName] = entries;
      return;
    }

    // Check for validation errors
    const hasValidationErrors =
      entries.some((entry) => {
        const key = `${entry.employeeId}-${entry.date}`;
        const validation = validationResults[key];
        return validation && validation.exceeds24Hours;
      }) ||
      entries.some(
        (entry) => entry.validationErrors && entry.validationErrors.length > 0,
      );

    if (hasValidationErrors) {
      result.invalid[employeeName] = entries;
      result.needsReview[employeeName] = entries;
    } else {
      result.valid[employeeName] = entries;
    }
  });

  return result;
};
