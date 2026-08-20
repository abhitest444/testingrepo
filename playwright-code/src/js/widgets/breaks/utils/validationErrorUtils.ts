import {
  BREAK_VALIDATION_ERROR_CODES,
  BREAK_VALIDATION_ERROR_MESSAGE_REGEX,
} from '../constants';

/**
 * Checks if the given error code is a validation error
 * @param errorCode - The error code to check
 * @returns true if it's a validation error, false otherwise
 */
export const isValidationError = (errorCode: string): boolean =>
  BREAK_VALIDATION_ERROR_CODES.includes(errorCode as any);

/**
 * Checks if the given error message matches validation error patterns
 * @param errorMessage - The error message to check
 * @returns true if it matches a validation error pattern, false otherwise
 */
export const isValidationErrorMessage = (errorMessage?: string): boolean => {
  if (!errorMessage) return false;
  return BREAK_VALIDATION_ERROR_MESSAGE_REGEX.some((regex) =>
    regex.test(errorMessage),
  );
};

/**
 * Determines if an error response should be treated as a validation error
 * @param error - The error object from API response
 * @returns true if it's a validation error, false otherwise
 */
export const isValidationErrorResponse = (error: any): boolean => {
  if (!error) {
    return false;
  }

  // Check by error code
  if (error.code && isValidationError(error.code)) {
    return true;
  }

  // Check by error message pattern
  if (error.message && isValidationErrorMessage(error.message)) {
    return true;
  }

  return false;
};
