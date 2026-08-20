// Excel parsing configuration and type definitions
import { parseDate as parseDateUtil } from '../utils/timezoneUtils';

export interface ExcelParseConfig {
  // SheetJS parsing options
  headerRow: number; // Which row contains headers (0-based)
  dataStartRow: number; // Which row data starts (0-based)
  maxRows?: number; // Maximum rows to process
  maxCols?: number; // Maximum columns to process

  // Data validation
  requiredColumns: string[]; // Columns that must be present
  optionalColumns: string[]; // Columns that are optional
  dateColumns: string[]; // Columns that should be parsed as dates
  numberColumns: string[]; // Columns that should be parsed as numbers
  booleanColumns: string[]; // Columns that should be parsed as booleans

  // Data transformation
  columnMappings: Record<string, string>; // Map Excel column names to internal field names
  valueTransformers?: Record<string, (value: any) => any>; // Custom value transformers

  // Validation rules
  validationRules: {
    [columnName: string]: {
      required?: boolean;
      type?: 'string' | 'number' | 'date' | 'boolean';
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: RegExp;
      customValidator?: (value: any) => boolean;
    };
  };
}

export interface ParsedExcelRow {
  [key: string]: any;
  _rowIndex: number; // Original row index in Excel
  _isValid: boolean; // Whether the row passed validation
  _errors: string[]; // Validation errors for this row
}

export interface ExcelParseResult {
  headers: string[];
  data: ParsedExcelRow[];
  cleanData?: any[]; // Clean data without validation metadata
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  warnings: string[];
  metadata: {
    fileName: string;
    sheetName: string;
    parsedAt: string;
    config: ExcelParseConfig;
  };
}

// Predefined configurations for common timesheet formats
export const TIMESHEET_CONFIGS = {
  // Standard timesheet format
  STANDARD: {
    headerRow: 0,
    dataStartRow: 1,
    requiredColumns: ['employee', 'date', 'duration'],
    optionalColumns: [
      'billableRate',
      'costRate',
      'notes',
      'taxable',
      'billableStatus',
      'timeZone',
      'class',
      'serviceItem',
      'department',
      'location',
    ],
    dateColumns: ['date'],
    numberColumns: ['duration', 'billableRate', 'costRate'],
    booleanColumns: ['taxable'],
    columnMappings: {
      // Employee fields
      'Employee Name': 'employee',
      Employee: 'employee',
      Name: 'employee',

      // Date and time fields
      Date: 'date',
      'Work Date': 'date',
      Duration: 'duration',
      Hours: 'duration',
      Time: 'duration',

      // Rate fields
      'Billable Rate': 'billableRate',
      'Bill Rate': 'billableRate',
      Rate: 'billableRate',
      'Cost Rate': 'costRate',

      // Status and flags
      'Billable Status': 'billableStatus',
      Billable: 'billableStatus',
      Taxable: 'taxable',
      'Time Zone': 'timeZone',

      // QB Time specific fields
      Class: 'class',
      'Service Item': 'serviceItem',
      Service: 'serviceItem',
      Department: 'department',
      Location: 'location',

      // Notes
      Notes: 'notes',
      Description: 'notes',
      Comments: 'notes',
    },
    validationRules: {
      employee: { required: true, type: 'string', minLength: 1 },
      date: { required: true, type: 'date' },
      duration: { required: true, type: 'number', min: 0, max: 24 },
      billableRate: { type: 'number', min: 0 },
      costRate: { type: 'number', min: 0 },
      notes: { type: 'string' },
      taxable: { type: 'boolean' },
      billableStatus: { type: 'string' },
      timeZone: { type: 'string' },
      class: { type: 'string' },
      serviceItem: { type: 'string' },
      department: { type: 'string' },
      location: { type: 'string' },
    },
    valueTransformers: {},
  } as ExcelParseConfig,

  // QuickBooks format
  QUICKBOOKS: {
    headerRow: 0,
    dataStartRow: 1,
    requiredColumns: ['employee', 'date', 'duration'],
    optionalColumns: [
      'billableRate',
      'costRate',
      'notes',
      'taxable',
      'billableStatus',
      'timeZone',
      'class',
      'serviceItem',
      'department',
      'location',
    ],
    dateColumns: ['date'],
    numberColumns: ['duration', 'billableRate', 'costRate'],
    booleanColumns: ['taxable'],
    columnMappings: {
      Employee: 'employee',
      Date: 'date',
      Duration: 'duration',
      Hours: 'duration',
      'Billable Rate': 'billableRate',
      'Cost Rate': 'costRate',
      Notes: 'notes',
      Taxable: 'taxable',
      'Billable Status': 'billableStatus',
      'Time Zone': 'timeZone',
      Class: 'class',
      'Service Item': 'serviceItem',
      Department: 'department',
      Location: 'location',
    },
    validationRules: {
      employee: { required: true, type: 'string' },
      date: { required: true, type: 'date' },
      duration: { required: true, type: 'number', min: 0 },
    },
    valueTransformers: {},
  } as ExcelParseConfig,

  // Custom format - can be extended
  CUSTOM: {
    headerRow: 0,
    dataStartRow: 1,
    requiredColumns: [],
    optionalColumns: [],
    dateColumns: [],
    numberColumns: [],
    booleanColumns: [],
    columnMappings: {},
    validationRules: {},
    valueTransformers: {},
  } as ExcelParseConfig,
};

// Value transformers for common data types
export const VALUE_TRANSFORMERS = {
  // Date transformers - use timezone-safe parsing
  parseDate: (value: any): Date | null => {
    if (!value) return null;
    const parsedDate = parseDateUtil(value);
    return parsedDate.isValid() ? parsedDate.toDate() : null;
  },

  // Number transformers
  parseNumber: (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = parseFloat(value);
    return Number.isNaN(num) ? null : num;
  },

  // Boolean transformers
  parseBoolean: (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return (
        lower === 'true' || lower === 'yes' || lower === '1' || lower === 'y'
      );
    }
    return Boolean(value);
  },

  // String transformers
  parseString: (value: any): string => (value ? String(value).trim() : ''),

  // Custom transformers
  parseTime: (value: any): string | null => {
    if (!value) return null;
    const str = String(value).trim();
    // Handle various time formats: "9:00", "09:00", "9:00 AM", etc.
    const timeMatch = str.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      const ampm = timeMatch[3];

      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    return null;
  },
};
