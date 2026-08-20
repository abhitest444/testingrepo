import {
  isAssignmentValidationError,
  isAssignmentValidationErrorResponse,
} from 'src/js/widgets/breaks/utils/assignmentValidationErrorUtils';
import {
  BREAK_POLICY_ERROR_CODES,
  BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES,
} from 'src/js/widgets/breaks/constants';

describe('assignmentValidationErrorUtils', () => {
  describe('isAssignmentValidationError', () => {
    it('should return true for assignment validation error codes', () => {
      expect(
        isAssignmentValidationError(
          BREAK_POLICY_ERROR_CODES.BATCH_REQUEST_NULL,
        ),
      ).toBe(true);
      expect(
        isAssignmentValidationError(
          BREAK_POLICY_ERROR_CODES.BREAK_POLICY_ID_REQUIRED,
        ),
      ).toBe(true);
      expect(
        isAssignmentValidationError(
          BREAK_POLICY_ERROR_CODES.ASSIGNMENTS_LIST_EMPTY,
        ),
      ).toBe(true);
      expect(
        isAssignmentValidationError(
          BREAK_POLICY_ERROR_CODES.ASSIGNEE_ID_REQUIRED,
        ),
      ).toBe(true);
      expect(
        isAssignmentValidationError(
          BREAK_POLICY_ERROR_CODES.ASSIGNMENT_TYPE_REQUIRED,
        ),
      ).toBe(true);
    });

    it('should return false for non-assignment validation error codes', () => {
      expect(isAssignmentValidationError('NETWORK_ERROR')).toBe(false);
      expect(isAssignmentValidationError('TIMEOUT_ERROR')).toBe(false);
      expect(isAssignmentValidationError('UNKNOWN_ERROR')).toBe(false);
      expect(
        isAssignmentValidationError(
          BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS,
        ),
      ).toBe(false);
      expect(
        isAssignmentValidationError(BREAK_POLICY_ERROR_CODES.GENERAL_ERROR),
      ).toBe(false);
    });

    it('should return false for empty or null values', () => {
      expect(isAssignmentValidationError('')).toBe(false);
      expect(isAssignmentValidationError(null as any)).toBe(false);
      expect(isAssignmentValidationError(undefined as any)).toBe(false);
    });
  });

  describe('isAssignmentValidationErrorResponse', () => {
    it('should return true for assignment validation error responses', () => {
      const validationError = {
        code: BREAK_POLICY_ERROR_CODES.BATCH_REQUEST_NULL,
        message: 'Batch request cannot be null',
      };
      expect(isAssignmentValidationErrorResponse(validationError)).toBe(true);
    });

    it('should return false for non-assignment validation error responses', () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
      };
      expect(isAssignmentValidationErrorResponse(networkError)).toBe(false);
    });

    it('should return false for error objects without code', () => {
      const errorWithoutCode = {
        message: 'Some error message',
      };
      expect(isAssignmentValidationErrorResponse(errorWithoutCode)).toBe(false);
    });

    it('should return false for null or undefined errors', () => {
      expect(isAssignmentValidationErrorResponse(null)).toBe(false);
      expect(isAssignmentValidationErrorResponse(undefined)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(isAssignmentValidationErrorResponse({})).toBe(false);
    });
  });

  describe('BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES', () => {
    it('should contain all assignment validation error codes', () => {
      // Test a few key assignment validation error codes to ensure they're included
      expect(BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES).toContain(
        BREAK_POLICY_ERROR_CODES.BATCH_REQUEST_NULL,
      );
      expect(BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES).toContain(
        BREAK_POLICY_ERROR_CODES.BREAK_POLICY_ID_REQUIRED,
      );
      expect(BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES).toContain(
        BREAK_POLICY_ERROR_CODES.ASSIGNMENTS_LIST_EMPTY,
      );
      expect(BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES).toContain(
        BREAK_POLICY_ERROR_CODES.ASSIGNEE_ID_REQUIRED,
      );
      expect(BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES).toContain(
        BREAK_POLICY_ERROR_CODES.ASSIGNMENT_TYPE_REQUIRED,
      );
    });

    it('should not contain non-assignment validation error codes', () => {
      // These should not be in the assignment validation error codes array
      expect(BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES).not.toContain(
        'NETWORK_ERROR',
      );
      expect(BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES).not.toContain(
        'TIMEOUT_ERROR',
      );
      expect(BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES).not.toContain(
        'UNKNOWN_ERROR',
      );
      expect(BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES).not.toContain(
        BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS,
      );
      expect(BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES).not.toContain(
        BREAK_POLICY_ERROR_CODES.GENERAL_ERROR,
      );
    });
  });
});
