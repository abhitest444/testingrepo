import { BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES } from '../constants';

/**
 * Checks if the given error code is an assignment validation error
 * @param errorCode - The error code to check
 * @returns true if it's an assignment validation error, false otherwise
 */
export const isAssignmentValidationError = (errorCode: string): boolean =>
  BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES.includes(errorCode as any);

/**
 * Determines if an error response should be treated as an assignment validation error
 * @param error - The error object from API response
 * @returns true if it's an assignment validation error, false otherwise
 */
export const isAssignmentValidationErrorResponse = (error: any): boolean => {
  if (!error || !error.code) {
    return false;
  }

  return isAssignmentValidationError(error.code);
};
