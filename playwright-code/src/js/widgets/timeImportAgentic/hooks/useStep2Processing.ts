import { useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { getFuzzySuggestions } from '../utils/EmployeeNameMatcher';
import { parseDate, isValidDate } from '../utils/timezoneUtils';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setExcelColumns,
  updateExcelColumnsForDisplay,
  processEmployeeGroupedTimeEntries,
  setIsProcessingFile,
  setProcessingError,
} from '../store/excelDataSlice';
import {
  selectRawExcelData,
  selectExcelColumns,
  selectUploadId,
  selectEmployeeGroupedTimeEntries,
  selectMappedColumnMappings,
  selectMappedColumnCheckboxes,
  selectCurrentStep,
} from '../store/selectors';
import { useEmployeeData } from './useEmployeeData';
import { useUxPreferencesRedux } from './useUxPreferencesRedux';

/**
 * Convert Excel serial date number to formatted date string
 */
const convertExcelSerialDate = (serial: any): string => {
  if (typeof serial !== 'number' || Number.isNaN(serial)) {
    return String(serial || '');
  }

  // Excel stores dates as number of days since 1/1/1900
  // Note: Excel incorrectly treats 1900 as a leap year, so we need to account for that
  const excelEpoch = dayjs('1900-01-01');
  const daysOffset = serial > 59 ? serial - 2 : serial - 1; // Adjust for Excel's 1900 leap year bug
  const date = excelEpoch.add(daysOffset, 'day');

  // Return in format: M/D/YYYY
  return date.format('M/D/YYYY');
};

/**
 * Convert Excel serial time to readable time string
 */
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

  // Try to parse as number (for Excel serial times)
  if (typeof serial !== 'number' || Number.isNaN(serial)) {
    return String(serial || '');
  }

  // Excel stores time as fraction of a day
  // If value >= 1, it's a datetime (date + time), extract only the time portion
  const timePortion = serial >= 1 ? serial - Math.floor(serial) : serial;

  const totalMinutes = Math.round(timePortion * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Convert to 12-hour format with AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Utility function to generate unique column names for duplicate headers
 * Maintains consistency with SheetJS parser
 */
const generateUniqueColumnNames = (
  headers: any[],
): { displayNames: string[]; columnCounts: Record<string, number> } => {
  const displayNames: string[] = [];
  const columnCounts: Record<string, number> = {};

  headers.forEach((header) => {
    if (!header || typeof header !== 'string' || header.trim() === '') {
      return;
    }

    const headerTrimmed = header.trim();
    const lowerCaseKey = headerTrimmed.toLowerCase();
    let displayName = headerTrimmed;

    // If we have duplicate names, append a suffix
    if (columnCounts[lowerCaseKey] !== undefined) {
      columnCounts[lowerCaseKey] += 1;
      displayName = `${headerTrimmed}-${columnCounts[lowerCaseKey]}`;
    } else {
      columnCounts[lowerCaseKey] = 0;
    }

    displayNames.push(displayName);
  });

  return { displayNames, columnCounts };
};

/**
 * Resolve column names from mappings with case-insensitive matching
 */
const resolveColumnNames = (
  mappedColumnMappings: Record<string, string>,
  processedData: any[],
) => {
  const firstEntry = processedData[0] || {};

  // Find mapped column names
  const employeeColumnName = Object.keys(mappedColumnMappings).find(
    (column) => mappedColumnMappings[column] === 'employee',
  );
  const dateColumnName = Object.keys(mappedColumnMappings).find(
    (column) => mappedColumnMappings[column] === 'date',
  );
  const hoursColumnName = Object.keys(mappedColumnMappings).find(
    (column) => mappedColumnMappings[column] === 'hours',
  );

  // Find actual column names in data (case-insensitive match)
  const actualEmployeeColumnName = Object.keys(firstEntry).find(
    (col) => col.toLowerCase() === employeeColumnName?.toLowerCase(),
  );
  const actualDateColumnName = Object.keys(firstEntry).find(
    (col) => col.toLowerCase() === dateColumnName?.toLowerCase(),
  );
  const actualHoursColumnName = Object.keys(firstEntry).find(
    (col) => col.toLowerCase() === hoursColumnName?.toLowerCase(),
  );

  return {
    employeeColumnName: actualEmployeeColumnName,
    dateColumnName: actualDateColumnName,
    hoursColumnName: actualHoursColumnName,
  };
};

/**
 * Extract unique employee names from processed data
 */
const extractUniqueEmployees = (
  processedData: any[],
  employeeColumnName: string | undefined,
): string[] => {
  if (!employeeColumnName) return [];

  const uniqueNames = [
    ...new Set(
      processedData.map((entry) => {
        const employeeName = entry[employeeColumnName];
        return String(employeeName || '').trim();
      }),
    ),
  ].filter((name) => name);

  return uniqueNames;
};

/**
 * Match an Excel employee name to system employees
 * Returns matched employee and fuzzy suggestions
 */
const matchEmployeeToSystem = (
  employeeName: string,
  dasEmployees: any[],
  getEmployeeMappings: () => any,
): { matchedEmployee: any | null; fuzzySuggestions: any[] } => {
  let matchedEmployee: any = null;
  let fuzzySuggestions: any[] = [];

  // Step 1: Try exact DAS match (case-insensitive)
  matchedEmployee = dasEmployees.find((emp) => {
    const empName = emp.name.toLowerCase().trim();
    const excelName = employeeName.toLowerCase().trim();
    return empName === excelName;
  });

  // Step 2: If no DAS match, check UX preferences
  if (!matchedEmployee) {
    try {
      const employeeMappings = getEmployeeMappings();

      // Check format 1: Direct name lookup
      const directMapping = employeeMappings[employeeName];
      if (directMapping && directMapping.employeeId) {
        matchedEmployee = dasEmployees.find(
          (emp) => emp.id === directMapping.employeeId,
        );
      }

      // Check format 2: Employee ID with originalNames array
      if (!matchedEmployee) {
        // eslint-disable-next-line no-restricted-syntax
        for (const [employeeId, mappingData] of Object.entries(
          employeeMappings,
        )) {
          if (
            mappingData &&
            typeof mappingData === 'object' &&
            Array.isArray((mappingData as any).originalNames) &&
            (mappingData as any).originalNames.includes(employeeName)
          ) {
            matchedEmployee = dasEmployees.find((emp) => emp.id === employeeId);
            if (matchedEmployee) {
              break;
            }
          }
        }
      }
    } catch (error) {
      // UX preference check failed silently
    }
  }

  // Step 3: If still no match, get fuzzy suggestions
  if (!matchedEmployee) {
    try {
      fuzzySuggestions = getFuzzySuggestions(employeeName, dasEmployees, 3);
    } catch (error) {
      // Fuzzy matching failed silently
    }
  }

  return { matchedEmployee, fuzzySuggestions };
};

/**
 * Build filtered entry with only checked columns and QB Time field mappings
 */
const buildFilteredAndQBFields = (
  entry: any,
  mappedColumnMappings: Record<string, string>,
  mappedColumnCheckboxes: Record<string, boolean>,
) => {
  // Filter to only include checked columns
  const checkedColumns = Object.keys(mappedColumnCheckboxes).filter(
    (column) => mappedColumnCheckboxes[column] === true,
  );

  const filteredEntry: any = {};
  checkedColumns.forEach((column) => {
    if (entry[column] !== undefined) {
      // Check if this column is mapped to 'start time' or 'end time'
      const qbField = mappedColumnMappings[column];

      if (
        qbField === 'start time' ||
        qbField === 'end time' ||
        qbField === 'startTime' ||
        qbField === 'endTime'
      ) {
        // Convert Excel serial time to AM/PM format
        filteredEntry[column] = convertExcelSerialTime(entry[column]);
      } else {
        filteredEntry[column] = entry[column];
      }
    }
  });

  // Add QB Time field names based on mappings
  const qbTimeFields: any = {};
  Object.entries(mappedColumnMappings).forEach(([excelColumn, qbField]) => {
    if (
      mappedColumnCheckboxes[excelColumn] &&
      entry[excelColumn] !== undefined
    ) {
      // Skip employee, date, hours as they're handled separately
      if (qbField !== 'employee' && qbField !== 'date' && qbField !== 'hours') {
        // Convert time values to AM/PM format
        if (
          qbField === 'start time' ||
          qbField === 'end time' ||
          qbField === 'startTime' ||
          qbField === 'endTime'
        ) {
          qbTimeFields[qbField] = convertExcelSerialTime(entry[excelColumn]);
        } else {
          qbTimeFields[qbField] = entry[excelColumn];
        }
      }
    }
  });

  return { filteredEntry, qbTimeFields };
};

/**
 * Create a cleaned entry object with all required fields
 */
const createCleanedEntry = (
  employeeName: string,
  finalEmployeeName: string,
  matchedEmployee: any | null,
  fuzzySuggestions: any[],
  entryDate: any,
  entryHours: any,
  filteredEntry: any,
  qbTimeFields: any,
): any => ({
  id: uuidv4(),
  employee: finalEmployeeName,
  originalEmployeeName: employeeName,
  employeeId: matchedEmployee?.id,
  isMissingEmployee: !matchedEmployee,
  fuzzySuggestions,
  date: entryDate,
  ...filteredEntry,
  ...qbTimeFields,
  hours: entryHours ? parseFloat(String(entryHours)) : 0,
});

/**
 * Hook to handle step 2 background processing with dynamic progress
 * 1. Parse Excel data using SheetJS
 * 2. Convert data to employee-grouped structure
 * 3. Store in Redux
 */
export const useStep2Processing = () => {
  const dispatch = useAppDispatch();
  const hasProcessedRef = useRef(false);
  const prevUploadIdRef = useRef<string>('');

  // Get employee data
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
  } = useEmployeeData();

  // Get UX preferences for employee mappings
  const { getEmployeeMappings } = useUxPreferencesRedux();

  // Redux state
  const rawExcelData = useAppSelector(selectRawExcelData);
  const excelColumns = useAppSelector(selectExcelColumns);
  const uploadId = useAppSelector(selectUploadId);
  const employeeGroupedTimeEntries = useAppSelector(
    selectEmployeeGroupedTimeEntries,
  );
  const mappedColumnMappings = useAppSelector(selectMappedColumnMappings);
  const mappedColumnCheckboxes = useAppSelector(selectMappedColumnCheckboxes);
  const currentStep = useAppSelector(selectCurrentStep);

  // Process Excel data
  const processExcelData = useCallback(async () => {
    if (!rawExcelData || rawExcelData.length === 0) {
      return;
    }

    dispatch(setIsProcessingFile(true));
    dispatch(setProcessingError(null));

    try {
      // Process the raw Excel data to get clean entries
      const headers = rawExcelData[0];
      const dataRows = rawExcelData.slice(1);

      // Find mapped column names
      const employeeColumnName = Object.keys(mappedColumnMappings).find(
        (column) => mappedColumnMappings[column] === 'employee',
      );
      const dateColumnName = Object.keys(mappedColumnMappings).find(
        (column) => mappedColumnMappings[column] === 'date',
      );
      const hoursColumnName = Object.keys(mappedColumnMappings).find(
        (column) => mappedColumnMappings[column] === 'hours',
      );

      let currentEmployeeName: string | null = null;

      const dataRowsWithEmployee = dataRows
        .map((row: any, rowIndex: number) => {
          // Check if this is an employee header row (has only 1-2 cells with a name)
          const nonNullCells = row.filter(
            (cell: any) =>
              cell !== null && cell !== undefined && String(cell).trim() !== '',
          );

          // If row has only 1 cell and it's in the employee column position, it's an employee header
          const employeeColIndex = headers.findIndex(
            (h: any) => h === employeeColumnName,
          );
          if (
            nonNullCells.length === 1 &&
            row[employeeColIndex] &&
            String(row[employeeColIndex]).trim() !== ''
          ) {
            currentEmployeeName = String(row[employeeColIndex]).trim();
            return null; // Skip this row, it's just a header
          }

          // If this is a total row or summary row, skip it
          if (
            nonNullCells.some((cell: any) =>
              String(cell).toLowerCase().includes('total'),
            )
          ) {
            return null;
          }

          // If this is a data row with null employee but we have a current employee, fill it in
          if (
            currentEmployeeName &&
            employeeColIndex >= 0 &&
            !row[employeeColIndex]
          ) {
            const newRow = [...row];
            newRow[employeeColIndex] = currentEmployeeName;
            return newRow;
          }

          return row;
        })
        .filter((row: any) => row !== null);

      // Convert to clean processed entries with unique column names
      const cleanProcessedData = dataRowsWithEmployee
        .filter((row) => {
          // Filter out completely empty rows
          const isValid =
            row &&
            row.length > 0 &&
            row.some((cell: any) => cell && String(cell).trim() !== '');
          return isValid;
        })
        .map((row, index) => {
          const processedEntry: any = {};

          // Use utility function to generate unique column names
          const { columnCounts } = generateUniqueColumnNames(headers);

          headers.forEach((header, colIndex) => {
            if (!header || typeof header !== 'string' || header.trim() === '') {
              return;
            }

            const headerTrimmed = header.trim();
            const rawValue = row[colIndex];
            const lowerCaseKey = headerTrimmed.toLowerCase();

            // Create display column name for duplicates (consistent with parser)
            let displayColumnName = headerTrimmed;
            if (
              columnCounts[lowerCaseKey] !== undefined &&
              columnCounts[lowerCaseKey] > 0
            ) {
              displayColumnName = `${headerTrimmed}-${columnCounts[lowerCaseKey]}`;
            }

            // Convert Excel serial numbers to readable format
            let processedValue = rawValue;
            const qbFieldMapping = mappedColumnMappings[headerTrimmed];

            // Check if this column is mapped to 'date' or contains date-related keywords
            if (qbFieldMapping === 'date' || lowerCaseKey.includes('date')) {
              processedValue = convertExcelSerialDate(rawValue);
            }
            // Check if this column is mapped to time fields or contains time-related keywords
            else if (
              qbFieldMapping === 'start time' ||
              qbFieldMapping === 'end time' ||
              lowerCaseKey.includes('time')
            ) {
              processedValue = convertExcelSerialTime(rawValue);
            }

            // All fields are treated as strings for simplicity, trim to remove leading/trailing spaces
            processedEntry[displayColumnName] = String(
              processedValue || '',
            ).trim();
          });

          // Handle grouped format: if employee name exists in this row, remember it
          if (employeeColumnName && processedEntry[employeeColumnName]) {
            const employeeValue = String(
              processedEntry[employeeColumnName],
            ).trim();
            if (
              employeeValue !== '' &&
              employeeValue.toLowerCase() !== 'total' &&
              !employeeValue.toLowerCase().startsWith('total:')
            ) {
              currentEmployeeName = employeeValue;
            }
          }

          // If this row has no employee but we have a current employee tracked, use it
          if (
            employeeColumnName &&
            (!processedEntry[employeeColumnName] ||
              String(processedEntry[employeeColumnName]).trim() === '')
          ) {
            if (currentEmployeeName) {
              processedEntry[employeeColumnName] = currentEmployeeName;
            }
          }

          return processedEntry;
        })
        .filter((entry, index) => {
          const hasEmployeeName =
            employeeColumnName &&
            entry[employeeColumnName] &&
            String(entry[employeeColumnName]).trim() !== '';
          const hasDate =
            dateColumnName &&
            entry[dateColumnName] &&
            String(entry[dateColumnName]).trim() !== '' &&
            String(entry[dateColumnName]).toLowerCase() !== 'total' &&
            !String(entry[dateColumnName]).toLowerCase().startsWith('total:');
          const hasHours =
            hoursColumnName &&
            entry[hoursColumnName] &&
            String(entry[hoursColumnName]).trim() !== '' &&
            String(entry[hoursColumnName]).toLowerCase() !== 'total' &&
            !String(entry[hoursColumnName]).toLowerCase().startsWith('total:');

          // Valid entry must have at least employee and date (hours is optional)
          const isValid = hasEmployeeName && (hasDate || hasHours);

          return isValid;
        });

      // Update excelColumns with original names for display (consistent with parser)
      // Use updateExcelColumnsForDisplay to avoid overwriting uploadId – setExcelColumns would
      // create new uploadId and trigger infinite loop (ChatStyleFlow reset + Step3DataLoader re-run)
      const { displayNames: displayColumnNames } =
        generateUniqueColumnNames(headers);

      dispatch(updateExcelColumnsForDisplay(displayColumnNames));

      // Filter and convert to employee-grouped data
      await convertToEmployeeGroupedData(cleanProcessedData);

      dispatch(setIsProcessingFile(false));

      // Note: Navigation is handled by the calling component (Step2Mapping or Step3FieldMapping)
      // Don't auto-navigate here as it causes issues when called from different steps
    } catch (error) {
      dispatch(
        setProcessingError(
          error instanceof Error ? error.message : 'Unknown error',
        ),
      );
      dispatch(setIsProcessingFile(false));
    }
  }, [rawExcelData, mappedColumnMappings, dispatch]);

  // Convert processed time entries to employee-grouped format
  const convertToEmployeeGroupedData = useCallback(
    async (processedData: any[]) => {
      if (!processedData || processedData.length === 0) {
        return;
      }

      if (employeesLoading) {
        return;
      }

      // Get all DAS employees for matching
      const dasEmployees = employees || [];
      const employeeGroupedData: Record<string, any[]> = {};

      // Resolve column names (case-insensitive)
      const { employeeColumnName, dateColumnName, hoursColumnName } =
        resolveColumnNames(mappedColumnMappings, processedData);

      // Extract unique employee names and initialize groups
      const uniqueExcelEmployees = extractUniqueEmployees(
        processedData,
        employeeColumnName,
      );

      uniqueExcelEmployees.forEach((empName) => {
        employeeGroupedData[empName] = [];
      });

      // Process each entry (no deduplication by employee|date|hours so all rows are kept;
      // multiple rows per employee/date/hours are valid, e.g. multiple sessions per day)
      processedData.forEach((entry) => {
        const employeeName = employeeColumnName
          ? String(entry[employeeColumnName] || '').trim()
          : '';
        const entryDate = dateColumnName ? entry[dateColumnName] : null;
        const entryHours = hoursColumnName ? entry[hoursColumnName] : null;

        // Skip entries without employee name
        if (!employeeName) {
          return;
        }

        // Validate date if present
        if (entryDate) {
          const parsedDate = parseDate(entryDate);
          if (!isValidDate(parsedDate)) {
            return;
          }
        }

        // Match employee to system (DAS → UX Preferences → Fuzzy)
        const { matchedEmployee, fuzzySuggestions } = matchEmployeeToSystem(
          employeeName,
          dasEmployees,
          getEmployeeMappings,
        );

        // Determine final employee name for grouping
        const finalEmployeeName = matchedEmployee
          ? matchedEmployee.name
          : employeeName;

        // Build filtered entry and QB Time fields
        const { filteredEntry, qbTimeFields } = buildFilteredAndQBFields(
          entry,
          mappedColumnMappings,
          mappedColumnCheckboxes,
        );

        // Create cleaned entry
        const cleanedEntry = createCleanedEntry(
          employeeName,
          finalEmployeeName,
          matchedEmployee,
          fuzzySuggestions,
          entryDate,
          entryHours,
          filteredEntry,
          qbTimeFields,
        );

        // Filter out 0-hour entries at the source
        if (entryHours <= 0) {
          return;
        }

        // Add to grouped data (every row is kept; rowIndex ensures stable ordering)
        if (!employeeGroupedData[finalEmployeeName]) {
          employeeGroupedData[finalEmployeeName] = [];
        }
        employeeGroupedData[finalEmployeeName].push(cleanedEntry);
      });

      // Store the grouped data in Redux
      dispatch(
        processEmployeeGroupedTimeEntries({
          employees: dasEmployees,
          rawExcelData,
          excelColumns,
          employeeGroupedData,
        }),
      );

      // Add a small delay to ensure processing completes
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    [
      employees,
      employeesLoading,
      dispatch,
      rawExcelData,
      excelColumns,
      mappedColumnMappings,
      mappedColumnCheckboxes,
      getEmployeeMappings,
    ],
  );

  // Reset processing flag when uploadId changes or step changes
  useEffect(() => {
    // Reset when step changes away from step 3
    if (currentStep !== 3) {
      hasProcessedRef.current = false;
    }

    // Reset when new data is uploaded (uploadId changes)
    if (uploadId && uploadId !== prevUploadIdRef.current) {
      hasProcessedRef.current = false;
      prevUploadIdRef.current = uploadId;
    }
  }, [currentStep, uploadId]);

  // Trigger processing when step 3 (Mapping) is reached
  useEffect(() => {
    if (
      currentStep === 3 &&
      !hasProcessedRef.current &&
      rawExcelData &&
      rawExcelData.length > 0
    ) {
      hasProcessedRef.current = true;
      processExcelData();
    }
  }, [currentStep, rawExcelData, processExcelData]);

  // Note: Review entries are now created directly in processExcelData

  // Return processExcelData so it can be called from other components
  return { processExcelData };
};
