import { BREAK_ENTRY_VALIDATION_ERROR_CODES } from '../constants';

/**
 * Checks if the given error code is a break entry validation error
 * @param errorCode - The error code to check
 * @returns true if it's a break entry validation error, false otherwise
 */
export const isBreakEntryValidationError = (errorCode: string): boolean =>
  BREAK_ENTRY_VALIDATION_ERROR_CODES.includes(errorCode as any);

/**
 * Determines if an error response should be treated as a break entry validation error
 * @param error - The error object from API response
 * @returns true if it's a break entry validation error, false otherwise
 */
export const isBreakEntryValidationErrorResponse = (error: any): boolean => {
  if (!error || !error.code) {
    return false;
  }

  return isBreakEntryValidationError(error.code);
};
