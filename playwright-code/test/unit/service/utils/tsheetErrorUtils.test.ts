import {
  isTSheetSyncError,
  processTSheetSyncError,
  createTSheetSyncErrorHandler,
  TSHEET_SYNC_ERROR_CODES,
  TSheetSyncErrorResponse,
} from 'src/js/service/utils/tsheetErrorUtils';

// Mock the mapTimeTrackingMutationError function
jest.mock('src/js/service/errors/timeTrackingErrors', () => ({
  mapTimeTrackingMutationError: jest.fn(
    (intl, error, subCode) => `mapped-${error}-${subCode || 'no-sub'}`,
  ),
}));

describe('tsheetErrorUtils', () => {
  describe('TSHEET_SYNC_ERROR_CODES', () => {
    it('should contain all expected TSheet sync error codes', () => {
      expect(TSHEET_SYNC_ERROR_CODES).toEqual([
        'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
        'TSHEET_SYNC_FAILED_FOR_UPDATE_TIMESHEET',
        'TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET',
        'TSHEET_SYNC_FAILED_FOR_DELETE_TIMESHEET',
      ]);
    });
  });

  describe('isTSheetSyncError', () => {
    it('should return true for valid TSheet sync error codes', () => {
      expect(isTSheetSyncError('TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET')).toBe(
        true,
      );
      expect(isTSheetSyncError('TSHEET_SYNC_FAILED_FOR_UPDATE_TIMESHEET')).toBe(
        true,
      );
      expect(isTSheetSyncError('TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET')).toBe(
        true,
      );
      expect(isTSheetSyncError('TSHEET_SYNC_FAILED_FOR_DELETE_TIMESHEET')).toBe(
        true,
      );
    });

    it('should return false for invalid error codes', () => {
      expect(isTSheetSyncError('GENERAL_ERROR')).toBe(false);
      expect(isTSheetSyncError('SOME_OTHER_ERROR')).toBe(false);
      expect(isTSheetSyncError('')).toBe(false);
      expect(isTSheetSyncError('TSHEET_SYNC_FAILED_FOR_INVALID')).toBe(false);
    });
  });

  describe('processTSheetSyncError', () => {
    it('should process TSheet sync error with valid message', () => {
      const errorResponse: TSheetSyncErrorResponse = {
        errorCode: 'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
        message:
          'TSheet sync failed. Details:\\nField 1 is required\\nField 2 is invalid',
        subCode: 'SUB_ERROR',
        details: null,
      };

      const result = processTSheetSyncError(errorResponse);

      expect(result).toEqual({
        errorCode: 'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
        subCode: 'SUB_ERROR',
        cleanedDetails: 'Field 1 is required\\nField 2 is invalid',
      });
    });

    it('should process TSheet sync error with message without Details prefix', () => {
      const errorResponse: TSheetSyncErrorResponse = {
        errorCode: 'TSHEET_SYNC_FAILED_FOR_UPDATE_TIMESHEET',
        message: 'Field 1 is required\\nField 2 is invalid',
        subCode: 'SUB_ERROR',
        details: null,
      };

      const result = processTSheetSyncError(errorResponse);

      expect(result).toEqual({
        errorCode: 'TSHEET_SYNC_FAILED_FOR_UPDATE_TIMESHEET',
        subCode: 'SUB_ERROR',
        cleanedDetails: 'Field 1 is required\\nField 2 is invalid',
      });
    });

    it('should handle missing subCode', () => {
      const errorResponse: TSheetSyncErrorResponse = {
        errorCode: 'TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET',
        message: 'Details:\\nSome error details',
        subCode: null,
        details: null,
      };

      const result = processTSheetSyncError(errorResponse);

      expect(result).toEqual({
        errorCode: 'TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET',
        subCode: '',
        cleanedDetails: 'Some error details',
      });
    });

    it('should return null for non-TSheet sync errors', () => {
      const errorResponse: TSheetSyncErrorResponse = {
        errorCode: 'GENERAL_ERROR',
        message: 'Some general error message',
        subCode: 'SUB_ERROR',
        details: null,
      };

      const result = processTSheetSyncError(errorResponse);

      expect(result).toBeNull();
    });

    it('should return null for TSheet sync errors without message', () => {
      const errorResponse: TSheetSyncErrorResponse = {
        errorCode: 'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
        message: null,
        subCode: 'SUB_ERROR',
        details: null,
      };

      const result = processTSheetSyncError(errorResponse);

      expect(result).toBeNull();
    });

    it('should return null for TSheet sync errors with empty message', () => {
      const errorResponse: TSheetSyncErrorResponse = {
        errorCode: 'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
        message: '   ',
        subCode: 'SUB_ERROR',
        details: null,
      };

      const result = processTSheetSyncError(errorResponse);

      expect(result).toBeNull();
    });
  });

  describe('createTSheetSyncErrorHandler', () => {
    const mockIntl = {};

    it('should return details for TSheet sync errors when details are provided', () => {
      const details = 'Field 1 is required\\nField 2 is invalid';
      const errorHandler = createTSheetSyncErrorHandler(mockIntl, details);

      const result = errorHandler(
        'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
        'SUB_ERROR',
      );

      expect(result).toBe(details);
    });

    it('should fall back to mapped error for TSheet sync errors without details', () => {
      const errorHandler = createTSheetSyncErrorHandler(mockIntl, '');

      const result = errorHandler(
        'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
        'SUB_ERROR',
      );

      expect(result).toBe(
        'mapped-TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET-SUB_ERROR',
      );
    });

    it('should fall back to mapped error for TSheet sync errors with whitespace-only details', () => {
      const errorHandler = createTSheetSyncErrorHandler(mockIntl, '   ');

      const result = errorHandler(
        'TSHEET_SYNC_FAILED_FOR_UPDATE_TIMESHEET',
        'SUB_ERROR',
      );

      expect(result).toBe(
        'mapped-TSHEET_SYNC_FAILED_FOR_UPDATE_TIMESHEET-SUB_ERROR',
      );
    });

    it('should fall back to mapped error for non-TSheet sync errors', () => {
      const details = 'Some details';
      const errorHandler = createTSheetSyncErrorHandler(mockIntl, details);

      const result = errorHandler('GENERAL_ERROR', 'SUB_ERROR');

      expect(result).toBe('mapped-GENERAL_ERROR-SUB_ERROR');
    });

    it('should handle missing subCode', () => {
      const errorHandler = createTSheetSyncErrorHandler(mockIntl, '');

      const result = errorHandler('GENERAL_ERROR');

      expect(result).toBe('mapped-GENERAL_ERROR-no-sub');
    });

    it('should work with default empty details parameter', () => {
      const errorHandler = createTSheetSyncErrorHandler(mockIntl);

      const result = errorHandler(
        'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
        'SUB_ERROR',
      );

      expect(result).toBe(
        'mapped-TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET-SUB_ERROR',
      );
    });
  });
});
