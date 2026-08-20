import {
  isBreakEntryValidationError,
  isBreakEntryValidationErrorResponse,
} from 'src/js/widgets/breaks/utils/breakEntryValidationErrorUtils';
import { BREAK_ENTRY_VALIDATION_ERROR_CODES } from 'src/js/widgets/breaks/constants';

describe('breakEntryValidationErrorUtils', () => {
  describe('isBreakEntryValidationError', () => {
    it('should return true for break entry validation error codes', () => {
      expect(isBreakEntryValidationError('MANUAL_MODE_NOT_ALLOWED')).toBe(true);
      expect(isBreakEntryValidationError('BREAK_RULE_NOT_FOUND')).toBe(true);
      expect(isBreakEntryValidationError('TT_BREAK_DURATION_INVALID')).toBe(
        true,
      );
      expect(
        isBreakEntryValidationError('START_END_TIME_OR_DURATION_REQUIRED'),
      ).toBe(true);
      expect(isBreakEntryValidationError('CONFLICTING_TIME_ENTRY')).toBe(true);
    });

    it('should return false for non-break entry validation error codes', () => {
      expect(isBreakEntryValidationError('NETWORK_ERROR')).toBe(false);
      expect(isBreakEntryValidationError('TIMEOUT_ERROR')).toBe(false);
      expect(isBreakEntryValidationError('UNKNOWN_ERROR')).toBe(false);
      expect(isBreakEntryValidationError('BREAK_NAME_ALREADY_EXISTS')).toBe(
        false,
      );
      expect(isBreakEntryValidationError('GENERAL_ERROR')).toBe(false);
    });

    it('should return false for empty or null values', () => {
      expect(isBreakEntryValidationError('')).toBe(false);
      expect(isBreakEntryValidationError(null as any)).toBe(false);
      expect(isBreakEntryValidationError(undefined as any)).toBe(false);
    });
  });

  describe('isBreakEntryValidationErrorResponse', () => {
    it('should return true for break entry validation error responses', () => {
      const validationError = {
        code: 'MANUAL_MODE_NOT_ALLOWED',
        message: 'Manual mode is not allowed',
      };
      expect(isBreakEntryValidationErrorResponse(validationError)).toBe(true);
    });

    it('should return false for non-break entry validation error responses', () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
      };
      expect(isBreakEntryValidationErrorResponse(networkError)).toBe(false);
    });

    it('should return false for error objects without code', () => {
      const errorWithoutCode = {
        message: 'Some error message',
      };
      expect(isBreakEntryValidationErrorResponse(errorWithoutCode)).toBe(false);
    });

    it('should return false for null or undefined errors', () => {
      expect(isBreakEntryValidationErrorResponse(null)).toBe(false);
      expect(isBreakEntryValidationErrorResponse(undefined)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(isBreakEntryValidationErrorResponse({})).toBe(false);
    });
  });

  describe('BREAK_ENTRY_VALIDATION_ERROR_CODES', () => {
    it('should contain all break entry validation error codes', () => {
      // Test a few key break entry validation error codes to ensure they're included
      expect(BREAK_ENTRY_VALIDATION_ERROR_CODES).toContain(
        'MANUAL_MODE_NOT_ALLOWED',
      );
      expect(BREAK_ENTRY_VALIDATION_ERROR_CODES).toContain(
        'BREAK_RULE_NOT_FOUND',
      );
      expect(BREAK_ENTRY_VALIDATION_ERROR_CODES).toContain(
        'TT_BREAK_DURATION_INVALID',
      );
      expect(BREAK_ENTRY_VALIDATION_ERROR_CODES).toContain(
        'START_END_TIME_OR_DURATION_REQUIRED',
      );
      expect(BREAK_ENTRY_VALIDATION_ERROR_CODES).toContain(
        'CONFLICTING_TIME_ENTRY',
      );
    });

    it('should not contain non-break entry validation error codes', () => {
      // These should not be in the break entry validation error codes array
      expect(BREAK_ENTRY_VALIDATION_ERROR_CODES).not.toContain('NETWORK_ERROR');
      expect(BREAK_ENTRY_VALIDATION_ERROR_CODES).not.toContain('TIMEOUT_ERROR');
      expect(BREAK_ENTRY_VALIDATION_ERROR_CODES).not.toContain('UNKNOWN_ERROR');
      expect(BREAK_ENTRY_VALIDATION_ERROR_CODES).not.toContain(
        'BREAK_NAME_ALREADY_EXISTS',
      );
      expect(BREAK_ENTRY_VALIDATION_ERROR_CODES).not.toContain('GENERAL_ERROR');
    });
  });
});
