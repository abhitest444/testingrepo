import { mapTimeTrackingMutationError } from '../errors/timeTrackingErrors';

/**
 * Interface for TSheet sync error response data
 */
export interface TSheetSyncErrorResponse {
  errorCode: string;
  message?: string | null;
  subCode?: string | null;
  details?: string | null;
}

/**
 * Interface for processed TSheet error result
 */
export interface ProcessedTSheetError {
  errorCode: string;
  subCode: string;
  cleanedDetails: string;
}

/**
 * List of TSheet sync error codes that require special handling
 */
export const TSHEET_SYNC_ERROR_CODES = [
  'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
  'TSHEET_SYNC_FAILED_FOR_UPDATE_TIMESHEET',
  'TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET',
  'TSHEET_SYNC_FAILED_FOR_DELETE_TIMESHEET',
] as const;

/**
 * Type for TSheet sync error codes
 */
export type TSheetSyncErrorCode = (typeof TSHEET_SYNC_ERROR_CODES)[number];

/**
 * Checks if an error code is a TSheet sync error that requires special handling
 *
 * @param errorCode - The error code to check
 * @returns True if the error code is a TSheet sync error
 */
export const isTSheetSyncError = (
  errorCode: string,
): errorCode is TSheetSyncErrorCode =>
  TSHEET_SYNC_ERROR_CODES.includes(errorCode as TSheetSyncErrorCode);

/**
 * Processes TSheet sync error responses to extract and clean error details
 *
 * This utility function handles the common pattern of extracting detailed error messages
 * from TSheet sync failures. It:
 * 1. Checks if the error is a TSheet sync error
 * 2. Extracts the message field if available
 * 3. Cleans the message by removing everything before "Details:"
 * 4. Returns the processed error information
 *
 * @param errorResponse - The error response from the GraphQL mutation
 * @returns Processed error information or null if not a TSheet sync error with details
 */
export const processTSheetSyncError = (
  errorResponse: TSheetSyncErrorResponse,
): ProcessedTSheetError | null => {
  // Check if this is a TSheet sync error
  if (!isTSheetSyncError(errorResponse.errorCode)) {
    return null;
  }

  // Check if we have a valid message with content
  if (!errorResponse.message || errorResponse.message.trim().length === 0) {
    return null;
  }

  // Extract and clean the details from the message
  const cleanedDetails = errorResponse.message.replace(/.*Details:\\n/, '');

  return {
    errorCode: errorResponse.errorCode,
    subCode: errorResponse.subCode || '',
    cleanedDetails,
  };
};

/**
 * Creates a custom error handler for TSheet sync errors
 *
 * This function returns a custom error handler that can be used with the mapError utility.
 * It handles TSheet sync errors specially by using the cleaned details, and falls back
 * to standard error mapping for other error types.
 *
 * @param intl - The internationalization object
 * @param details - The cleaned details from processTSheetSyncError
 * @returns A custom error handler function
 */
export const createTSheetSyncErrorHandler =
  (intl: any, details: string = '') =>
  (error: string, subCode?: string) => {
    // For TSheet sync errors, use the details field if available
    if (isTSheetSyncError(error) && details.trim().length > 0) {
      return details;
    }
    // Fall back to standard error mapping
    return mapTimeTrackingMutationError(intl, error, subCode);
  };
