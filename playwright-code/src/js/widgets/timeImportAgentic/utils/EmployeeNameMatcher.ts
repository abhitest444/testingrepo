import Fuse from 'fuse.js';

export interface Employee {
  id: string;
  name: string;
  email?: string;
  department?: string;
}

export interface MatchResult {
  employee: Employee;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  matchType: 'exact' | 'fuzzy' | 'abbreviation' | 'partial';
}

export interface FuzzyMatchOptions {
  threshold?: number;
  includeScore?: boolean;
  includeMatches?: boolean;
  minMatchCharLength?: number;
}

/**
 * Employee name matching utility using Fuse.js for fuzzy matching
 * Only matches employees that were not previously matched
 */
export class EmployeeNameMatcher {
  private fuse: Fuse<Employee>;

  private employees: Employee[];

  constructor(employees: Employee[], options: FuzzyMatchOptions = {}) {
    this.employees = employees;

    // Configure Fuse.js for employee name matching with better partial matching
    this.fuse = new Fuse(employees, {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'email', weight: 0.2 },
      ],
      threshold: options.threshold || 0.8, // Increased threshold for better partial matching
      includeScore: options.includeScore !== false,
      includeMatches: options.includeMatches !== false,
      minMatchCharLength: options.minMatchCharLength || 1, // Allow single character matches
      shouldSort: true,
      findAllMatches: true, // Find all matches, not just the first one
      ignoreLocation: true,
      useExtendedSearch: true, // Enable extended search for better partial matching
      distance: 100, // Allow more distance for partial matches
    });
  }

  /**
   * Find the best match for an employee name using fuzzy matching
   * Only returns matches for employees that were not previously matched
   */
  findBestMatch(
    inputName: string,
    excludeMatched: Employee[] = [],
  ): MatchResult | null {
    if (!inputName || inputName.trim().length < 2) {
      return null;
    }

    const normalizedInput = EmployeeNameMatcher.normalizeName(inputName);

    // First try exact match
    const exactMatch = this.findExactMatch(normalizedInput, excludeMatched);
    if (exactMatch) {
      return {
        employee: exactMatch,
        score: 1.0,
        confidence: 'high',
        matchType: 'exact',
      };
    }

    // Try abbreviation matching
    const abbreviationMatch = this.findAbbreviationMatch(
      normalizedInput,
      excludeMatched,
    );
    if (abbreviationMatch) {
      return {
        employee: abbreviationMatch,
        score: 0.9,
        confidence: 'high',
        matchType: 'abbreviation',
      };
    }

    // Use fuzzy matching for everything else
    const fuzzyResults = this.findFuzzyMatches(normalizedInput, excludeMatched);
    if (fuzzyResults.length > 0) {
      const bestMatch = fuzzyResults[0];
      const score = bestMatch.score || 0;
      return {
        employee: bestMatch.item,
        score,
        confidence: EmployeeNameMatcher.getConfidenceLevel(score),
        matchType: 'fuzzy',
      };
    }

    return null;
  }

  /**
   * Find multiple fuzzy matches for an employee name
   */
  findFuzzyMatches(
    inputName: string,
    excludeMatched: Employee[] = [],
    limit: number = 1,
  ): any[] {
    const availableEmployees = this.employees.filter(
      (emp) => !excludeMatched.some((excluded) => excluded.id === emp.id),
    );

    if (availableEmployees.length === 0) {
      return [];
    }

    // Create a new Fuse instance with only available employees
    const availableFuse = new Fuse(availableEmployees, {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'email', weight: 0.2 },
      ],
      threshold: 0.4, // Stricter threshold (was 0.6)
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: false,
      ignoreLocation: true,
    });

    return availableFuse.search(inputName).slice(0, limit);
  }

  /**
   * Find exact match (case-insensitive)
   */
  private findExactMatch(
    inputName: string,
    excludeMatched: Employee[],
  ): Employee | null {
    return (
      this.employees.find(
        (emp) =>
          !excludeMatched.some((excluded) => excluded.id === emp.id) &&
          EmployeeNameMatcher.normalizeName(emp.name) === inputName,
      ) || null
    );
  }

  /**
   * Find abbreviation matches (e.g., "J. Doe" -> "John Doe")
   */
  private findAbbreviationMatch(
    inputName: string,
    excludeMatched: Employee[],
  ): Employee | null {
    const inputParts = inputName.split(/\s+/);

    // Check if input looks like initials (single letters with periods)
    const isInitials = inputParts.every(
      (part) => part.length === 1 || (part.length === 2 && part.endsWith('.')),
    );

    if (isInitials) {
      return (
        this.employees.find((emp) => {
          if (excludeMatched.some((excluded) => excluded.id === emp.id))
            return false;

          const empParts = EmployeeNameMatcher.normalizeName(emp.name).split(
            /\s+/,
          );
          if (empParts.length !== inputParts.length) return false;

          return inputParts.every((inputPart, index) => {
            const empPart = empParts[index];
            const cleanInput = inputPart.replace('.', '');
            return empPart.startsWith(cleanInput);
          });
        }) || null
      );
    }

    // Check for partial name matches (e.g., "Jon" -> "John")
    return (
      this.employees.find((emp) => {
        if (excludeMatched.some((excluded) => excluded.id === emp.id))
          return false;

        const empName = EmployeeNameMatcher.normalizeName(emp.name);
        const empParts = empName.split(/\s+/);

        // Check if any part of the employee name starts with the input
        return (
          empParts.some((part) => part.startsWith(inputName)) ||
          empName.includes(inputName)
        );
      }) || null
    );
  }

  /**
   * Normalize name for consistent matching
   */
  private static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s]/g, '') // Remove special characters except spaces
      .trim();
  }

  /**
   * Get confidence level based on score
   */
  private static getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Get all unmatched employees
   */
  getUnmatchedEmployees(matchedEmployees: Employee[]): Employee[] {
    return this.employees.filter(
      (emp) => !matchedEmployees.some((matched) => matched.id === emp.id),
    );
  }

  /**
   * Update the employee list (useful when employees are added/removed)
   */
  updateEmployees(employees: Employee[]): void {
    this.employees = employees;
    this.fuse = new Fuse(employees, {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'email', weight: 0.2 },
      ],
      threshold: 0.6,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: false,
      ignoreLocation: true,
    });
  }
}

/**
 * Utility function to create a matcher instance
 */
export function createEmployeeMatcher(
  employees: Employee[],
  options?: FuzzyMatchOptions,
): EmployeeNameMatcher {
  return new EmployeeNameMatcher(employees, options);
}

/**
 * Quick fuzzy match function for simple use cases
 */
export function quickFuzzyMatch(
  inputName: string,
  employees: Employee[],
  excludeMatched: Employee[] = [],
): MatchResult | null {
  const matcher = new EmployeeNameMatcher(employees);
  return matcher.findBestMatch(inputName, excludeMatched);
}

/**
 * Get multiple fuzzy match suggestions for user selection
 * Returns array of potential matches sorted by confidence
 */
export function getFuzzySuggestions(
  inputName: string,
  employees: Employee[],
  limit: number = 1,
): MatchResult[] {
  if (!inputName || !employees || employees.length === 0) {
    return [];
  }

  // Enhanced abbreviation handling
  const normalizedInput = inputName.toLowerCase().trim();

  // Try multiple matching strategies
  const allMatches: MatchResult[] = [];

  // Strategy 1: Exact substring match (for abbreviations like "Aaka" -> "Aakash")
  // Only match if input has at least 3 characters to avoid too broad matches
  const substringMatches =
    normalizedInput.length >= 3
      ? employees
          .filter((emp) => {
            const empName = emp.name.toLowerCase();
            // Only match if employee name starts with input (more strict)
            return empName.startsWith(normalizedInput);
          })
          .map((emp) => ({
            employee: emp,
            score: 0.2, // High confidence for substring matches
            confidence: 'high' as const,
            matchType: 'fuzzy' as const,
          }))
      : [];

  allMatches.push(...substringMatches);

  // Strategy 2: First name matching (for cases like "Prithvi Arunshankar" -> "prithvi tester")
  // Also handles reversed names like "Arendt, Hannah" -> "Hannah Are"
  const inputWords = normalizedInput.split(/\s+/).filter((w) => w.length > 0);
  const firstNameMatches = employees
    .filter((emp) => {
      const empName = emp.name.toLowerCase();
      const empWords = empName.split(/\s+/).filter((w) => w.length > 0);

      // Match if the first word of input matches the first word of employee name
      if (inputWords.length > 0 && empWords.length > 0) {
        const inputFirstWord = inputWords[0];
        const empFirstWord = empWords[0];

        // Check for exact first name match or if one starts with the other
        const firstWordMatch =
          inputFirstWord === empFirstWord ||
          empFirstWord.startsWith(inputFirstWord) ||
          inputFirstWord.startsWith(empFirstWord);

        if (firstWordMatch) {
          return true;
        }

        // NEW: Check for reversed name patterns (e.g., "Arendt, Hannah" vs "Hannah Are")
        // Check if ANY input word matches ANY employee word (for reversed names)
        const hasAnyWordMatch = inputWords.some((inputWord) =>
          empWords.some(
            (empWord) =>
              inputWord.length >= 3 &&
              empWord.length >= 3 &&
              (empWord.startsWith(inputWord) || inputWord.startsWith(empWord)),
          ),
        );

        return hasAnyWordMatch;
      }
      return false;
    })
    .map((emp) => ({
      employee: emp,
      score: 0.3, // Good confidence for first name matches
      confidence: 'medium' as const,
      matchType: 'fuzzy' as const,
    }));

  allMatches.push(...firstNameMatches);

  // Strategy 3: Word boundary matching (for initials like "J.D." -> "John Doe")
  const wordBoundaryMatches = employees
    .filter((emp) => {
      const empName = emp.name.toLowerCase();
      const words = empName.split(/\s+/);

      // Check if input words match the beginning of employee name words
      return inputWords.every((inputWord) =>
        words.some((word) => word.startsWith(inputWord)),
      );
    })
    .map((emp) => ({
      employee: emp,
      score: 0.4,
      confidence: 'high' as const,
      matchType: 'fuzzy' as const,
    }));

  allMatches.push(...wordBoundaryMatches);

  // Strategy 4: Fuse.js with enhanced configuration for abbreviations
  const matcher = new EmployeeNameMatcher(employees, {
    threshold: 0.4, // Stricter threshold (was 0.5) - lower is stricter
    minMatchCharLength: 2, // Require at least 2 characters for better matches
    includeScore: true,
    includeMatches: true,
  });

  const fuseResults = matcher.findFuzzyMatches(inputName, [], limit * 3); // Get more candidates
  const fuseMatches = fuseResults
    .map((result) => {
      const employee = result.item;
      let score = result.score || 0;

      // Penalize matches with very different lengths
      const lengthDiff = Math.abs(employee.name.length - inputName.length);
      let lengthPenalty: number;
      if (lengthDiff > 10) {
        lengthPenalty = 0.3;
      } else if (lengthDiff > 5) {
        lengthPenalty = 0.15;
      } else {
        lengthPenalty = 0;
      }
      score = Math.min(1.0, score + lengthPenalty);

      // Boost score if first letter matches (common pattern)
      const firstLetterMatches =
        employee.name.toLowerCase()[0] === inputName.toLowerCase()[0];
      if (firstLetterMatches) {
        score = Math.max(0, score - 0.1); // Lower score is better in Fuse.js
      }

      return {
        employee: result.item,
        score,
        confidence: (() => {
          if (score < 0.3) return 'high' as const;
          if (score < 0.6) return 'medium' as const;
          return 'low' as const;
        })(),
        matchType: 'fuzzy' as const,
      };
    })
    .filter((match) => match.score < 0.6); // Only keep reasonable matches

  allMatches.push(...fuseMatches);

  // Remove duplicates and sort by score
  const uniqueMatches = allMatches.reduce((acc, match) => {
    const existing = acc.find((m) => m.employee.id === match.employee.id);
    if (!existing) {
      acc.push(match);
    } else if (match.score < existing.score) {
      // Keep the better match
      const index = acc.indexOf(existing);
      acc[index] = match;
    }
    return acc;
  }, [] as MatchResult[]);

  const sortedMatches = uniqueMatches
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);

  return sortedMatches;
}

/**
 * Enhanced employee matching with priority: DAS -> UX Preferences -> Fuse.js
 */
export function findEmployeeMatch(
  inputName: string,
  dasEmployees: Employee[],
  uxEmployeeMappings: Record<
    string,
    { employeeId: string; employeeName: string }
  >,
  limit: number = 1,
): { matchedEmployee?: Employee; fuzzySuggestions: MatchResult[] } {
  // Priority 1: Check DAS employees first - ONLY exact matches (case-insensitive)
  const dasMatch = dasEmployees?.find((emp) => {
    const empName = emp.name.toLowerCase().trim();
    const inputNameLower = inputName.toLowerCase().trim();
    // Only exact matches, no partial matching
    return empName === inputNameLower;
  });

  if (dasMatch) {
    return { matchedEmployee: dasMatch, fuzzySuggestions: [] };
  }

  // Priority 2: Check UX preferences
  const uxMatch = uxEmployeeMappings[inputName];
  if (uxMatch) {
    const uxEmployee = dasEmployees?.find(
      (emp) => emp.id === uxMatch.employeeId,
    );
    if (uxEmployee) {
      return { matchedEmployee: uxEmployee, fuzzySuggestions: [] };
    }
  }

  // Priority 3: Use Fuse.js for fuzzy matching

  const fuzzySuggestions = getFuzzySuggestions(
    inputName,
    dasEmployees || [],
    limit,
  );

  return { matchedEmployee: undefined, fuzzySuggestions };
}
