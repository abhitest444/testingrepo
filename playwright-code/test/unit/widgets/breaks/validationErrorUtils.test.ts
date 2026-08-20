import {
  isValidationError,
  isValidationErrorMessage,
  isValidationErrorResponse,
} from 'src/js/widgets/breaks/utils/validationErrorUtils';
import {
  BREAK_POLICY_ERROR_CODES,
  BREAK_VALIDATION_ERROR_CODES,
} from 'src/js/widgets/breaks/constants';

describe('validationErrorUtils', () => {
  describe('isValidationError', () => {
    it('should return true for validation error codes', () => {
      expect(
        isValidationError(BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS),
      ).toBe(true);
      expect(
        isValidationError(
          BREAK_POLICY_ERROR_CODES.POLICY_NAME_REQUIRED_FOR_CREATE,
        ),
      ).toBe(true);
      expect(
        isValidationError(
          BREAK_POLICY_ERROR_CODES.BREAK_DURATION_NULL_FOR_SET_DURATION,
        ),
      ).toBe(true);
    });

    it('should return false for non-validation error codes', () => {
      expect(isValidationError('NETWORK_ERROR')).toBe(false);
      expect(isValidationError('TIMEOUT_ERROR')).toBe(false);
      expect(isValidationError('UNKNOWN_ERROR')).toBe(false);
      expect(isValidationError(BREAK_POLICY_ERROR_CODES.GENERAL_ERROR)).toBe(
        false,
      );
    });

    it('should return false for empty or null values', () => {
      expect(isValidationError('')).toBe(false);
      expect(isValidationError(null as any)).toBe(false);
      expect(isValidationError(undefined as any)).toBe(false);
    });
  });

  describe('isValidationErrorMessage', () => {
    it('should return true for messages containing "is already in use"', () => {
      expect(isValidationErrorMessage('Break name is already in use')).toBe(
        true,
      );
      expect(
        isValidationErrorMessage('The name "Test Break" is already in use'),
      ).toBe(true);
      expect(isValidationErrorMessage('This value is already in use.')).toBe(
        true,
      );
    });

    it('should return true for case-insensitive matches', () => {
      expect(isValidationErrorMessage('IS ALREADY IN USE')).toBe(true);
      expect(isValidationErrorMessage('Is Already In Use')).toBe(true);
      expect(isValidationErrorMessage('is ALREADY in USE')).toBe(true);
    });

    it('should return false for messages not matching validation patterns', () => {
      expect(isValidationErrorMessage('Network error occurred')).toBe(false);
      expect(isValidationErrorMessage('Permission denied')).toBe(false);
      expect(isValidationErrorMessage('Something went wrong')).toBe(false);
    });

    it('should return false for empty, null, or undefined messages', () => {
      expect(isValidationErrorMessage('')).toBe(false);
      expect(isValidationErrorMessage(null as any)).toBe(false);
      expect(isValidationErrorMessage(undefined)).toBe(false);
    });
  });

  describe('isValidationErrorResponse', () => {
    it('should return true for validation error responses with valid error code', () => {
      const validationError = {
        code: BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS,
        message: 'Break name already exists',
      };
      expect(isValidationErrorResponse(validationError)).toBe(true);
    });

    it('should return true for error responses with validation message pattern', () => {
      const validationErrorByMessage = {
        code: 'UNKNOWN_ERROR',
        message: 'Break name is already in use',
      };
      expect(isValidationErrorResponse(validationErrorByMessage)).toBe(true);
    });

    it('should return true for error responses with only validation message (no code)', () => {
      const errorWithoutCode = {
        message: 'The name "Test" is already in use',
      };
      expect(isValidationErrorResponse(errorWithoutCode)).toBe(true);
    });

    it('should return false for non-validation error responses', () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
      };
      expect(isValidationErrorResponse(networkError)).toBe(false);
    });

    it('should return false for error objects without code and non-matching message', () => {
      const errorWithoutCode = {
        message: 'Some error message',
      };
      expect(isValidationErrorResponse(errorWithoutCode)).toBe(false);
    });

    it('should return false for null or undefined errors', () => {
      expect(isValidationErrorResponse(null)).toBe(false);
      expect(isValidationErrorResponse(undefined)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(isValidationErrorResponse({})).toBe(false);
    });
  });

  describe('BREAK_VALIDATION_ERROR_CODES', () => {
    it('should contain all validation error codes', () => {
      // Test a few key validation error codes to ensure they're included
      expect(BREAK_VALIDATION_ERROR_CODES).toContain(
        BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS,
      );
      expect(BREAK_VALIDATION_ERROR_CODES).toContain(
        BREAK_POLICY_ERROR_CODES.POLICY_NAME_REQUIRED_FOR_CREATE,
      );
      expect(BREAK_VALIDATION_ERROR_CODES).toContain(
        BREAK_POLICY_ERROR_CODES.BREAK_DURATION_NULL_FOR_SET_DURATION,
      );
      expect(BREAK_VALIDATION_ERROR_CODES).toContain(
        BREAK_POLICY_ERROR_CODES.EMPLOYER_BREAK_NOT_FOUND,
      );
    });

    it('should not contain non-validation error codes', () => {
      // These should not be in the validation error codes array
      expect(BREAK_VALIDATION_ERROR_CODES).not.toContain('NETWORK_ERROR');
      expect(BREAK_VALIDATION_ERROR_CODES).not.toContain('TIMEOUT_ERROR');
      expect(BREAK_VALIDATION_ERROR_CODES).not.toContain('UNKNOWN_ERROR');
      expect(BREAK_VALIDATION_ERROR_CODES).not.toContain(
        BREAK_POLICY_ERROR_CODES.GENERAL_ERROR,
      );
    });
  });
});
