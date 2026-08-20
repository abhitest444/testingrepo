/**
 * Unit tests for errorHelpers
 * Partial Success Handling for Group Assignments
 */

import { ErrorCodes } from 'src/js/widgets/assignments/types';
import {
  OperationAction,
  WorkerSelectionMode,
} from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';
import {
  isInactiveWorkerError,
  extractWorkerName,
  areAllInactiveWorkerErrors,
  buildInactiveWorkersErrorMessage,
  buildCombinedInactiveWorkersErrorMessage,
  buildCombinedAssignRemoveInactiveErrorMessage,
  type GenericFailure,
} from 'src/js/widgets/assignments/utils/errorHelpers';

describe('errorHelpers', () => {
  describe('isInactiveWorkerError', () => {
    it('should return true when errorCode is WORKER_VALIDATION_FAILED and message contains "is inactive"', () => {
      const failure: GenericFailure = {
        errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
        errorMessage: "Worker 'John Doe' is inactive",
      };
      expect(isInactiveWorkerError(failure)).toBe(true);
    });

    it('should return false when errorCode is WORKER_VALIDATION_FAILED but message does not contain "is inactive"', () => {
      const failure: GenericFailure = {
        errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
        errorMessage: 'Some other validation error',
      };
      expect(isInactiveWorkerError(failure)).toBe(false);
    });

    it('should return false when errorCode is not WORKER_VALIDATION_FAILED', () => {
      const failure: GenericFailure = {
        errorCode: 'ALREADY_IN_GROUP',
        errorMessage: "Worker 'John Doe' is inactive",
      };
      expect(isInactiveWorkerError(failure)).toBe(false);
    });

    it('should return false when errorMessage is null', () => {
      const failure: GenericFailure = {
        errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
        errorMessage: null,
      };
      expect(isInactiveWorkerError(failure)).toBe(false);
    });

    it('should return false when errorMessage is undefined', () => {
      const failure: GenericFailure = {
        errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
        errorMessage: null,
      };
      expect(isInactiveWorkerError(failure)).toBe(false);
    });
  });

  describe('extractWorkerName', () => {
    it.each([
      {
        description:
          'should extract worker name from "Worker \'Name\' is inactive" format',
        message: "Worker 'John Doe' is inactive",
        expected: 'John Doe',
      },
      {
        description: 'should return "Unknown Worker" when errorMessage is null',
        message: null,
        expected: 'Unknown Worker',
      },
      {
        description:
          'should return "Unknown Worker" when errorMessage is empty string',
        message: '',
        expected: 'Unknown Worker',
      },
      {
        description:
          'should return "Unknown Worker" when pattern does not match',
        message: 'Some other error',
        expected: 'Unknown Worker',
      },
      {
        description: 'should extract single-word name',
        message: "Worker 'Alice' is inactive",
        expected: 'Alice',
      },
      {
        description: 'should extract name with multiple words',
        message: "Worker 'Mary Jane' is inactive",
        expected: 'Mary Jane',
      },
    ])('$description', ({ message, expected }) => {
      expect(extractWorkerName(message)).toBe(expected);
    });
  });

  describe('areAllInactiveWorkerErrors', () => {
    it('should return true when all failures are inactive worker errors', () => {
      const failures: GenericFailure[] = [
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'John' is inactive",
        },
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'Jane' is inactive",
        },
      ];
      expect(areAllInactiveWorkerErrors(failures)).toBe(true);
    });

    it('should return false when one failure is not inactive worker error', () => {
      const failures: GenericFailure[] = [
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'John' is inactive",
        },
        { errorCode: 'ALREADY_ASSIGNED', errorMessage: 'Already assigned' },
      ];
      expect(areAllInactiveWorkerErrors(failures)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(areAllInactiveWorkerErrors([])).toBe(false);
    });

    it('should return true for single inactive worker error', () => {
      const failures: GenericFailure[] = [
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'John' is inactive",
        },
      ];
      expect(areAllInactiveWorkerErrors(failures)).toBe(true);
    });
  });

  describe('buildInactiveWorkersErrorMessage', () => {
    it.each([
      {
        description:
          'should build message for assign workers with default workerType',
        failures: [
          {
            errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
            errorMessage: "Worker 'John Doe' is inactive",
          },
          {
            errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
            errorMessage: "Worker 'Jane Smith' is inactive",
          },
        ] as GenericFailure[],
        operation: OperationAction.Assign,
        workerType: WorkerSelectionMode.Workers as
          | WorkerSelectionMode
          | undefined,
        expectedContains: [
          'We could not assign the following workers',
          '<ul>',
          '<li>John Doe</li>',
          '<li>Jane Smith</li>',
        ],
      },
      {
        description: 'should build message for remove leads',
        failures: [
          {
            errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
            errorMessage: "Worker 'Lead Manager' is inactive",
          },
        ] as GenericFailure[],
        operation: OperationAction.Remove,
        workerType: WorkerSelectionMode.Leads as
          | WorkerSelectionMode
          | undefined,
        expectedContains: [
          'We could not remove the following leads',
          '<li>Lead Manager</li>',
        ],
      },
      {
        description:
          'should use default WorkerSelectionMode.Workers when workerType not provided',
        failures: [
          {
            errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
            errorMessage: "Worker 'Worker' is inactive",
          },
        ] as GenericFailure[],
        operation: OperationAction.Assign,
        workerType: undefined,
        expectedContains: ['the following workers'],
      },
      {
        description:
          'should show Unknown Worker for failures with no matching message',
        failures: [
          {
            errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
            errorMessage: null,
          },
        ] as GenericFailure[],
        operation: OperationAction.Assign,
        workerType: WorkerSelectionMode.Workers as
          | WorkerSelectionMode
          | undefined,
        expectedContains: ['<li>Unknown Worker</li>'],
      },
    ])(
      '$description',
      ({ failures, operation, workerType, expectedContains }) => {
        const result = buildInactiveWorkersErrorMessage(
          failures,
          operation,
          workerType,
        );
        expectedContains.forEach((substring) =>
          expect(result).toContain(substring),
        );
      },
    );
  });

  describe('buildCombinedInactiveWorkersErrorMessage', () => {
    it('should build combined message for members and leads', () => {
      const memberFailures: GenericFailure[] = [
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'John Doe' is inactive",
        },
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'Jane Smith' is inactive",
        },
      ];
      const leadFailures: GenericFailure[] = [
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'Lead Manager' is inactive",
        },
      ];
      const result = buildCombinedInactiveWorkersErrorMessage(
        memberFailures,
        leadFailures,
        OperationAction.Assign,
      );
      expect(result).toContain('We could not assign the following workers');
      expect(result).toContain('<li>John Doe</li>');
      expect(result).toContain('<li>Jane Smith</li>');
      expect(result).toContain('And could not assign the following leads');
      expect(result).toContain('<li>Lead Manager</li>');
    });

    it('should handle remove operation', () => {
      const memberFailures: GenericFailure[] = [
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'A' is inactive",
        },
      ];
      const leadFailures: GenericFailure[] = [];
      const result = buildCombinedInactiveWorkersErrorMessage(
        memberFailures,
        leadFailures,
        OperationAction.Remove,
      );
      expect(result).toContain('We could not remove the following workers');
      expect(result).toContain('And could not remove the following leads');
    });

    it('should handle empty member failures', () => {
      const memberFailures: GenericFailure[] = [];
      const leadFailures: GenericFailure[] = [
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'Lead' is inactive",
        },
      ];
      const result = buildCombinedInactiveWorkersErrorMessage(
        memberFailures,
        leadFailures,
        OperationAction.Assign,
      );
      expect(result).toContain('<ul></ul>');
      expect(result).toContain('<li>Lead</li>');
    });
  });

  describe('buildCombinedAssignRemoveInactiveErrorMessage', () => {
    it('should build combined assign and remove message for workers', () => {
      const assignFailures: GenericFailure[] = [
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'John Doe' is inactive",
        },
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'Jane Smith' is inactive",
        },
      ];
      const removeFailures: GenericFailure[] = [
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'Inactive Worker' is inactive",
        },
      ];
      const result = buildCombinedAssignRemoveInactiveErrorMessage(
        assignFailures,
        removeFailures,
        WorkerSelectionMode.Workers,
      );
      expect(result).toContain('We could not assign the following workers');
      expect(result).toContain('<li>John Doe</li>');
      expect(result).toContain('<li>Jane Smith</li>');
      expect(result).toContain('And could not remove the following workers');
      expect(result).toContain('<li>Inactive Worker</li>');
    });

    it('should build combined message for leads', () => {
      const assignFailures: GenericFailure[] = [
        {
          errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
          errorMessage: "Worker 'Lead A' is inactive",
        },
      ];
      const removeFailures: GenericFailure[] = [];
      const result = buildCombinedAssignRemoveInactiveErrorMessage(
        assignFailures,
        removeFailures,
        WorkerSelectionMode.Leads,
      );
      expect(result).toContain('the following leads');
      expect(result).toContain('<li>Lead A</li>');
      expect(result).toContain('And could not remove the following leads');
    });
  });
});
