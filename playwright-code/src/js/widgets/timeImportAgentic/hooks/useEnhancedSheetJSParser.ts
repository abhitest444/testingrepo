import { useCallback } from 'react';
import * as XLSX from '../utils/xlsxConfig';
import { useAppDispatch } from '../store';
import {
  setRawExcelData,
  setExcelColumns,
  setIsProcessingFile,
  setProcessingError,
} from '../store/excelDataSlice';
import {
  ExcelParseConfig,
  ParsedExcelRow,
  ExcelParseResult,
  TIMESHEET_CONFIGS,
  VALUE_TRANSFORMERS,
} from '../types/excelTypes';

/**
 * Enhanced SheetJS parser with structured configuration
 * Supports multiple timesheet formats and validation
 */
export const useEnhancedSheetJSParser = () => {
  const dispatch = useAppDispatch();

  /**
   * Parse Excel file with custom configuration
   */
  const parseExcelFileWithConfig = useCallback(
    async (
      file: File,
      config: ExcelParseConfig = TIMESHEET_CONFIGS.STANDARD,
    ): Promise<ExcelParseResult> => {
      dispatch(setIsProcessingFile(true));
      dispatch(setProcessingError(null));

      try {
        // Read the file as array buffer
        const arrayBuffer = await file.arrayBuffer();

        // Parse the workbook
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('No worksheets found in the Excel file');
        }

        const worksheet = workbook.Sheets[firstSheetName];

        // Convert worksheet to JSON with more control
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Use array format for more control
          defval: '', // Default value for empty cells
          raw: false, // Convert all values to strings initially
          range: config.maxRows
            ? `A1:${String.fromCharCode(65 + (config.maxCols || 26) - 1)}${
                config.maxRows
              }`
            : undefined,
        }) as any[][];

        if (jsonData.length === 0) {
          throw new Error('The Excel file appears to be empty');
        }

        // Find the first non-empty row to use as headers
        let actualHeaderRow = config.headerRow;
        let foundNonEmptyRow = false;
        const maxEmptyRowsToCheck = 5;

        // Helper function to check if a row is empty
        const isRowEmpty = (row: any[]): boolean =>
          !row ||
          row.length === 0 ||
          row.every(
            (cell) =>
              cell === '' ||
              cell === null ||
              cell === undefined ||
              String(cell).trim() === '',
          );

        // Search for the first non-empty row starting from configured header row
        for (
          let i = config.headerRow;
          i < Math.min(config.headerRow + maxEmptyRowsToCheck, jsonData.length);
          i += 1
        ) {
          const row = jsonData[i];

          if (!isRowEmpty(row)) {
            actualHeaderRow = i;
            foundNonEmptyRow = true;
            break;
          }
        }

        if (!foundNonEmptyRow) {
          throw new Error(
            'No data found in the uploaded file. The first 5 rows are empty. Please check your file and try again.',
          );
        }

        // Extract headers from the first non-empty row
        const headers = jsonData[actualHeaderRow] as string[];

        // Data rows start after the header row
        const actualDataStartRow = actualHeaderRow + 1;
        const dataRows = jsonData.slice(actualDataStartRow);

        // Filter out empty rows
        const filteredDataRows = dataRows.filter((row, index) => {
          const rowIndex = actualDataStartRow + index;
          const hasData = row.some(
            (cell) => cell !== '' && cell !== null && cell !== undefined,
          );
          const withinMaxRows = !config.maxRows || rowIndex < config.maxRows;
          return hasData && withinMaxRows;
        });
        // Parse and validate each row
        const parsedRows: ParsedExcelRow[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        filteredDataRows.forEach((row, index) => {
          const rowIndex = actualDataStartRow + index;
          const parsedRow: ParsedExcelRow = {
            _rowIndex: rowIndex,
            _isValid: true,
            _errors: [],
          };

          // Map Excel columns to internal field names
          headers.forEach((header, colIndex) => {
            if (!header || typeof header !== 'string' || header.trim() === '') {
              return;
            }

            const headerTrimmed = header.trim();
            const mappedField =
              config.columnMappings[headerTrimmed] ||
              headerTrimmed.toLowerCase();
            const rawValue = row[colIndex];

            // Apply value transformation based on column type
            let transformedValue = rawValue;

            if (config.dateColumns.includes(mappedField)) {
              transformedValue = VALUE_TRANSFORMERS.parseDate(rawValue);
            } else if (config.numberColumns.includes(mappedField)) {
              transformedValue = VALUE_TRANSFORMERS.parseNumber(rawValue);
            } else if (config.booleanColumns.includes(mappedField)) {
              transformedValue = VALUE_TRANSFORMERS.parseBoolean(rawValue);
            } else {
              // All unknown fields are treated as strings
              transformedValue = VALUE_TRANSFORMERS.parseString(rawValue);
            }

            // Apply custom transformer if defined
            if (config.valueTransformers?.[mappedField]) {
              transformedValue =
                config.valueTransformers[mappedField](transformedValue);
            }

            parsedRow[mappedField] = transformedValue;
          });

          // Validate the row
          const validationErrors = validateRow(parsedRow, config);
          if (validationErrors.length > 0) {
            parsedRow._isValid = false;
            parsedRow._errors = validationErrors;
            errors.push(`Row ${rowIndex + 1}: ${validationErrors.join(', ')}`);
          }

          parsedRows.push(parsedRow);
        });

        // Check for required columns
        const missingRequiredColumns = config.requiredColumns.filter(
          (col) =>
            !headers.some(
              (header) =>
                config.columnMappings[header] === col ||
                header.toLowerCase() === col.toLowerCase(),
            ),
        );

        if (missingRequiredColumns.length > 0) {
          errors.push(
            `Missing required columns: ${missingRequiredColumns.join(', ')}`,
          );
        }

        const result: ExcelParseResult = {
          headers: headers.filter((h) => h && h.trim() !== ''),
          data: parsedRows,
          totalRows: parsedRows.length,
          validRows: parsedRows.filter((r) => r._isValid).length,
          invalidRows: parsedRows.filter((r) => !r._isValid).length,
          errors,
          warnings,
          metadata: {
            fileName: file.name,
            sheetName: firstSheetName,
            parsedAt: new Date().toISOString(),
            config,
          },
        };

        // Store the raw data in Redux (for backward compatibility) - only clean data
        dispatch(setRawExcelData([headers, ...filteredDataRows]));

        // Extract column names and handle duplicates consistently
        const columnNames: string[] = [];
        const columnCounts: Record<string, number> = {};

        headers.forEach((header) => {
          if (!header || typeof header !== 'string' || header.trim() === '') {
            return;
          }

          const headerTrimmed = header.trim();
          const lowerCaseKey = headerTrimmed.toLowerCase();

          // Check if we've seen this column name before
          if (columnCounts[lowerCaseKey] !== undefined) {
            // Increment count and append suffix
            columnCounts[lowerCaseKey] += 1;
            columnNames.push(`${headerTrimmed}-${columnCounts[lowerCaseKey]}`);
          } else {
            // First occurrence, no suffix needed
            columnCounts[lowerCaseKey] = 0;
            columnNames.push(headerTrimmed);
          }
        });

        dispatch(setExcelColumns(columnNames));

        // Store clean processed data (without validation metadata)
        const cleanProcessedData = parsedRows.map((row) => {
          const cleanRow: any = {};
          Object.keys(row).forEach((key) => {
            // Skip validation metadata fields
            if (!key.startsWith('_')) {
              cleanRow[key] = row[key];
            }
          });
          return cleanRow;
        });

        // Store clean processed data in result only (no Redux duplication)
        result.cleanData = cleanProcessedData;

        dispatch(setIsProcessingFile(false));
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to parse Excel file';

        dispatch(setProcessingError(errorMessage));
        dispatch(setIsProcessingFile(false));
        throw error;
      }
    },
    [dispatch],
  );

  /**
   * Parse Excel file with predefined timesheet format
   */
  const parseTimesheetFile = useCallback(
    async (
      file: File,
      format: 'STANDARD' | 'QUICKBOOKS' | 'CUSTOM' = 'STANDARD',
    ) => {
      const config = TIMESHEET_CONFIGS[format];
      return parseExcelFileWithConfig(file, config);
    },
    [parseExcelFileWithConfig],
  );

  /**
   * Parse CSV file with configuration
   */
  const parseCSVFileWithConfig = useCallback(
    async (
      file: File,
      config: ExcelParseConfig = TIMESHEET_CONFIGS.STANDARD,
    ): Promise<ExcelParseResult> => {
      dispatch(setIsProcessingFile(true));
      dispatch(setProcessingError(null));

      try {
        // Read the file as text
        const text = await file.text();

        // Parse CSV using SheetJS
        const workbook = XLSX.read(text, { type: 'string' });

        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('No worksheets found in the CSV file');
        }

        const worksheet = workbook.Sheets[firstSheetName];

        // Convert worksheet to JSON array
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as any[][];

        if (jsonData.length === 0) {
          throw new Error('The CSV file appears to be empty');
        }

        // Use the same parsing logic as Excel
        const result = await parseExcelFileWithConfig(file, config);

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to parse CSV file';

        dispatch(setProcessingError(errorMessage));
        dispatch(setIsProcessingFile(false));
        throw error;
      }
    },
    [dispatch, parseExcelFileWithConfig],
  );

  /**
   * Validate a single row against the configuration
   */
  const validateRow = (
    row: ParsedExcelRow,
    config: ExcelParseConfig,
  ): string[] => {
    const errors: string[] = [];

    Object.entries(config.validationRules).forEach(([field, rules]) => {
      const value = row[field];

      // Required validation
      if (
        rules.required &&
        (value === null || value === undefined || value === '')
      ) {
        errors.push(`${field} is required`);
        return;
      }

      // Skip other validations if value is empty and not required
      if (!value && !rules.required) return;

      // Type validation
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
      } else if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${field} must be a number`);
      } else if (rules.type === 'date' && !(value instanceof Date)) {
        errors.push(`${field} must be a valid date`);
      } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${field} must be a boolean`);
      }

      // String validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(
            `${field} must be at least ${rules.minLength} characters`,
          );
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(
            `${field} must be no more than ${rules.maxLength} characters`,
          );
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }

      // Number validations
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be no more than ${rules.max}`);
        }
      }

      // Custom validation
      if (rules.customValidator && !rules.customValidator(value)) {
        errors.push(`${field} failed custom validation`);
      }
    });

    return errors;
  };

  /**
   * Get available timesheet formats
   */
  const getAvailableFormats = useCallback(
    () =>
      Object.keys(TIMESHEET_CONFIGS).map((key) => ({
        key,
        name: key.charAt(0) + key.slice(1).toLowerCase(),
        description: `Parse timesheet in ${key.toLowerCase()} format`,
        config: TIMESHEET_CONFIGS[key as keyof typeof TIMESHEET_CONFIGS],
      })),
    [],
  );

  /**
   * Create custom configuration
   */
  const createCustomConfig = useCallback(
    (baseConfig: Partial<ExcelParseConfig> = {}): ExcelParseConfig => ({
      ...TIMESHEET_CONFIGS.CUSTOM,
      ...baseConfig,
    }),
    [],
  );

  return {
    parseExcelFileWithConfig,
    parseTimesheetFile,
    parseCSVFileWithConfig,
    validateRow,
    getAvailableFormats,
    createCustomConfig,
    TIMESHEET_CONFIGS,
  };
};
