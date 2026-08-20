import Fuse from 'fuse.js';

/**
 * Required QB Time fields that need fuzzy matching (always auto-mapped)
 */
const REQUIRED_QB_FIELDS = ['employee', 'date', 'hours'];

/**
 * Optional QB Time fields that can be auto-mapped (conditional)
 */
const OPTIONAL_QB_FIELDS = ['start time', 'end time'];

/**
 * All other QB Time fields that support fuzzy matching
 */
const OTHER_QB_FIELDS = [
  'customer',
  'service item',
  'class',
  'location',
  'notes',
  'billable',
  'cost rate',
  'bill rate',
];

/**
 * Mapping of QB Time fields to their possible column name variations
 */
const QB_FIELD_VARIATIONS: Record<string, string[]> = {
  employee: [
    'employee',
    'employee name',
    'name',
    'username',
    'user name',
    'worker',
    'staff',
    'team member',
    'resource',
  ],
  date: [
    'date',
    'work date',
    'workdate',
    'entry date',
    'time date',
    'day',
    'date worked',
    'work day',
    'timesheet date',
  ],
  hours: [
    'hours',
    'duration',
    'worked hours',
    'total hours',
    'hrs',
    'time worked',
    'total time',
    'work hours',
  ],
  'start time': [
    'start time',
    'start',
    'time in',
    'timein',
    'clock in',
    'begin time',
    'from time',
    'start hour',
    'in time',
    'in',
  ],
  'end time': [
    'end time',
    'end',
    'time out',
    'timeout',
    'clock out',
    'finish time',
    'to time',
    'end hour',
    'out time',
    'out',
  ],
  customer: [
    'customer',
    'client',
    'customer name',
    'client name',
    'account',
    'company',
    'organization',
    'project',
  ],
  'service item': [
    'service item',
    'service',
    'item',
    'service name',
    'activity',
    'task',
    'work type',
    'service type',
    'product',
    'service code',
  ],
  class: [
    'class',
    'category',
    'department',
    'division',
    'group',
    'classification',
    'class name',
    'cost center',
  ],
  location: [
    'location',
    'site',
    'office',
    'branch',
    'place',
    'work location',
    'job site',
    'facility',
    'location name',
  ],
  notes: [
    'notes',
    'note',
    'description',
    'comments',
    'comment',
    'details',
    'memo',
    'remarks',
    'work description',
  ],
  billable: [
    'billable',
    'billable status',
    'is billable',
    'chargeable',
    'bill',
    'billing',
    'billable time',
  ],
  'cost rate': [
    'cost rate',
    'cost',
    'hourly cost',
    'cost per hour',
    'employee cost',
    'labor cost',
    'cost/hour',
    'cost hr',
  ],
  'bill rate': [
    'bill rate',
    'billing rate',
    'billable rate',
    'bill/hour',
    'bill hr',
    'invoice rate',
  ],
};

/**
 * Type for fuzzy match results
 */
type MatchResult = { column: string; score: number };

/**
 * Fuzzy match Excel column names to QB Time fields using Fuse.js
 * @param excelColumns - Array of Excel column names
 * @param qbField - QB Time field to match (e.g., 'employee', 'date', 'hours')
 * @returns Best matching Excel column name or null
 */
export const fuzzyMatchColumn = (
  excelColumns: string[],
  qbField: string,
): string | null => {
  const variations = QB_FIELD_VARIATIONS[qbField];
  if (!variations) {
    return null;
  }

  // Step 1: Check for exact matches first (case-insensitive)
  const exactMatch = variations
    .map((variation) =>
      excelColumns.find(
        (col) => col.toLowerCase().trim() === variation.toLowerCase().trim(),
      ),
    )
    .find((match) => match !== undefined);

  if (exactMatch) {
    return exactMatch;
  }

  // Step 2: Check for word boundary matches with preference for more specific matches
  // e.g., "Duration (Hours)" should match "hours" field, not "Duration (Minutes)"
  const wordMatches: Array<{ column: string; specificity: number }> = [];

  variations
    .filter((variation) => variation.length >= 3)
    .forEach((variation) => {
      excelColumns.forEach((col) => {
        const colLower = col.toLowerCase().trim();
        const varLower = variation.toLowerCase().trim();

        // Check if column equals the variation exactly
        if (colLower === varLower) {
          wordMatches.push({ column: col, specificity: 100 }); // Highest priority
          return;
        }

        // Check if column contains the variation as a complete word
        // e.g., "Duration (Hours)" contains "hours"
        const wordBoundaryPattern = new RegExp(`\\b${varLower}\\b`, 'i');
        if (wordBoundaryPattern.test(colLower)) {
          // Calculate specificity: prefer matches where variation is a larger portion of the column name
          // Remove special chars for length calculation
          const cleanColName = colLower.replace(/[^a-z0-9]/g, '');
          const specificity = (varLower.length / cleanColName.length) * 100;
          wordMatches.push({ column: col, specificity });
          return;
        }

        // Check if column starts/ends with variation (with separators)
        const patterns = [
          new RegExp(`^${varLower}[_\\s-]`, 'i'), // starts with variation
          new RegExp(`[_\\s-]${varLower}$`, 'i'), // ends with variation
        ];

        if (patterns.some((pattern) => pattern.test(colLower))) {
          wordMatches.push({ column: col, specificity: 50 });
        }
      });
    });

  // Sort by specificity (higher = better match) and return the best one
  if (wordMatches.length > 0) {
    wordMatches.sort((a, b) => b.specificity - a.specificity);
    const bestWordMatch = wordMatches[0];
    return bestWordMatch.column;
  }

  // Step 3: Use fuzzy matching with a VERY strict threshold
  const fuse = new Fuse(excelColumns, {
    includeScore: true,
    threshold: 0.2, // VERY STRICT: 0.3 -> 0.2 (lower = more strict)
    ignoreLocation: true,
    minMatchCharLength: 4, // Require at least 4 matching characters
  });

  // Try to find a match for each variation
  let bestMatch: MatchResult | null = null;

  variations.forEach((variation) => {
    // Skip very short variations for fuzzy matching
    if (variation.length < 4) return; // Increased from 3 to 4

    // Search for this variation in Excel columns
    const results = fuse.search(variation);

    if (results.length > 0 && results[0].score !== undefined) {
      const score = results[0].score as number;
      const column = results[0].item as string;

      // Keep track of the best match (lowest score = best match)
      if (bestMatch === null) {
        bestMatch = { column, score };
      } else if (score < bestMatch.score) {
        bestMatch = { column, score };
      }
    }
  });

  // Return the best match if it's good enough (score < 0.2)
  if (bestMatch !== null) {
    const result: MatchResult = bestMatch;
    if (result.score < 0.2) {
      return result.column;
    }
  }

  return null;
};

/**
 * Auto-map all QB Time fields to Excel columns using fuzzy matching
 * Maps required, optional, and other QB fields that are not already mapped by UX preferences
 * Note: start time and end time are only mapped if hours is not already mapped
 * @param excelColumns - Array of Excel column names
 * @param existingMappings - Existing column mappings (from UX preferences)
 * @returns Object with auto-mapped columns
 */
export const autoMapRequiredFields = (
  excelColumns: string[],
  existingMappings: Record<string, string> = {},
): Record<string, string> => {
  const autoMappings: Record<string, string> = {};

  // Get list of QB fields that are already mapped
  const mappedQBFields = new Set(Object.values(existingMappings));

  // Check if hours/duration is already mapped
  const hasHoursMapped = mappedQBFields.has('hours');

  // Combine all fields for auto-mapping
  const allFieldsToMap = [
    ...REQUIRED_QB_FIELDS,
    ...OTHER_QB_FIELDS, // Add all other QB fields for fuzzy matching
  ];

  // Only add start time and end time if hours is NOT mapped
  if (!hasHoursMapped) {
    allFieldsToMap.push(...OPTIONAL_QB_FIELDS);
  }

  // Try to auto-map each field
  allFieldsToMap.forEach((qbField) => {
    // Skip if this QB field is already mapped by UX preferences
    if (mappedQBFields.has(qbField)) {
      return;
    }

    // Try to find a fuzzy match for this QB field
    const matchedColumn = fuzzyMatchColumn(excelColumns, qbField);

    if (matchedColumn) {
      // Check if this Excel column is already mapped
      const isColumnAlreadyMapped = Object.keys(existingMappings).some(
        (col) =>
          col.toLowerCase().trim() === matchedColumn.toLowerCase().trim(),
      );

      // Only add the mapping if the column isn't already mapped
      if (!isColumnAlreadyMapped) {
        autoMappings[matchedColumn] = qbField;
      }
    }
  });

  return autoMappings;
};

/**
 * Check if a QB field is required
 */
export const isRequiredField = (qbField: string): boolean =>
  REQUIRED_QB_FIELDS.includes(qbField);

/**
 * Auto-map ALL QB Time fields to Excel columns using fuzzy matching
 * This function auto-maps all fields without checking existing mappings
 * (use this for initial auto-mapping before applying UX preferences)
 * @param excelColumns - Array of Excel column names
 * @returns Object with auto-mapped columns
 */
export const autoMapAllFields = (
  excelColumns: string[],
): Record<string, string> => {
  const autoMappings: Record<string, string> = {};
  const mappedColumns = new Set<string>(); // Track which columns have been mapped

  // Combine all fields for auto-mapping
  const allFieldsToMap = [
    ...REQUIRED_QB_FIELDS,
    ...OPTIONAL_QB_FIELDS, // Include start time and end time
    ...OTHER_QB_FIELDS, // Include all other QB fields
  ];

  // Try to auto-map each field
  allFieldsToMap.forEach((qbField) => {
    // Try to find a fuzzy match for this QB field
    const matchedColumn = fuzzyMatchColumn(excelColumns, qbField);

    if (matchedColumn && !mappedColumns.has(matchedColumn)) {
      // Only add the mapping if the column hasn't been mapped yet
      autoMappings[matchedColumn] = qbField;
      mappedColumns.add(matchedColumn);
    }
  });

  return autoMappings;
};
