/**
 * Unit tests for groupMutationUtils
 * Partial Success Handling for Group Assignments
 */

import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';
import { ErrorCodes } from 'src/js/widgets/assignments/types';
import {
  areAllFailuresWorkerValidation,
  getErrorCodeForCompleteFailure,
  handleGroupMutationError,
  handleGroupMutationSuccess,
  isErrorResponse,
  mapToFailureOutput,
  type FailureItem,
} from 'src/js/service/hooks/groups/groupMutationUtils';
import { getDefaultSandbox } from 'test/unit/testUtils';

jest.mock('src/js/common/CustomerInteraction', () => {
  const actual = jest.requireActual<
    typeof import('src/js/common/CustomerInteraction')
  >('src/js/common/CustomerInteraction');
  return {
    ...actual,
    endInteractionWithSuccess: jest.fn(),
    endInteractionWithFailure: jest.fn(),
    setInteractionDegraded: jest.fn(),
    shouldTreatErrorAsDegraded: jest.fn(
      (errorCode?: string) => errorCode === 'WORKER_VALIDATION_FAILED',
    ),
  };
});

describe('groupMutationUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isErrorResponse', () => {
    it.each([
      {
        description: 'returns true for object with string errorCode',
        input: { errorCode: 'GROUP_NOT_FOUND' },
        expected: true,
      },
      {
        description:
          'returns true for object with string errorCode and extra fields',
        input: { errorCode: 'ERR', message: 'msg' },
        expected: true,
      },
      {
        description: 'returns false for null',
        input: null,
        expected: false,
      },
      {
        description: 'returns false for undefined',
        input: undefined,
        expected: false,
      },
      {
        description: 'returns false for string primitive',
        input: 'string',
        expected: false,
      },
      {
        description:
          'returns false for object without errorCode (message only)',
        input: { message: 'x' },
        expected: false,
      },
      {
        description: 'returns false for object without errorCode (successCode)',
        input: { successCode: 'SUCCESS' },
        expected: false,
      },
      {
        description: 'returns false when errorCode is not a string',
        input: { errorCode: 123 },
        expected: false,
      },
    ])('$description', ({ input, expected }) => {
      expect(isErrorResponse(input)).toBe(expected);
    });
  });

  describe('getErrorCodeForCompleteFailure', () => {
    it('returns WORKER_VALIDATION_FAILED when all failures are validation errors', () => {
      const failures: FailureItem[] = [
        { workerId: '1', errorCode: ErrorCodes.WORKER_VALIDATION_FAILED },
        { workerId: '2', errorCode: ErrorCodes.WORKER_VALIDATION_FAILED },
      ];
      expect(getErrorCodeForCompleteFailure(failures)).toBe(
        ErrorCodes.WORKER_VALIDATION_FAILED,
      );
    });

    it('returns undefined when any failure has different error code', () => {
      const failures: FailureItem[] = [
        { workerId: '1', errorCode: ErrorCodes.WORKER_VALIDATION_FAILED },
        { workerId: '2', errorCode: 'ALREADY_IN_GROUP' },
      ];
      expect(getErrorCodeForCompleteFailure(failures)).toBeUndefined();
    });

    it('returns undefined for empty array', () => {
      expect(getErrorCodeForCompleteFailure([])).toBeUndefined();
    });
  });

  describe('mapToFailureOutput', () => {
    it('maps items to FailureOutput with null for undefined errorCode/errorMessage', () => {
      const items: FailureItem[] = [
        { workerId: '1' },
        { workerId: '2', errorCode: 'ERR', errorMessage: 'msg' },
      ];
      expect(mapToFailureOutput(items)).toEqual([
        { workerId: '1', errorCode: null, errorMessage: null },
        { workerId: '2', errorCode: 'ERR', errorMessage: 'msg' },
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(mapToFailureOutput([])).toEqual([]);
    });

    it('preserves null errorCode and errorMessage', () => {
      const items: FailureItem[] = [
        { workerId: '1', errorCode: null, errorMessage: null },
      ];
      expect(mapToFailureOutput(items)).toEqual([
        { workerId: '1', errorCode: null, errorMessage: null },
      ]);
    });
  });

  describe('handleGroupMutationSuccess', () => {
    const sandbox = getDefaultSandbox();

    it('calls logger.info and endInteractionWithSuccess when no failures', () => {
      const result = {
        success: true,
        partialSuccess: false,
        assignedCount: 2,
        failedCount: 0,
      };
      const onSuccess = jest.fn();
      const {
        endInteractionWithSuccess,
      } = require('src/js/common/CustomerInteraction');

      handleGroupMutationSuccess(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        result,
        {
          partialSuccessEvent: 'partial',
          fullSuccessEvent: 'full',
          getLogMeta: (r) => ({
            count: (r as { assignedCount: number }).assignedCount,
          }),
          validationDegradedMessage: 'validation',
          mixedFailureMessage: 'mixed',
        },
        onSuccess,
      );

      expect(sandbox.logger.info).toHaveBeenCalledWith('full', { count: 2 });
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      );
      expect(onSuccess).toHaveBeenCalledWith(result);
    });

    it('calls logger.warn and setInteractionDegraded when partialSuccess with all validation failures', () => {
      const result = {
        success: true,
        partialSuccess: true,
        assignedCount: 1,
        failedCount: 1,
        failures: [
          {
            workerId: '1',
            errorCode: ErrorCodes.WORKER_VALIDATION_FAILED,
            errorMessage: null,
          },
        ] as FailureItem[],
      };
      const onSuccess = jest.fn();
      const {
        setInteractionDegraded,
      } = require('src/js/common/CustomerInteraction');

      handleGroupMutationSuccess(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        result,
        {
          partialSuccessEvent: 'partial',
          fullSuccessEvent: 'full',
          getLogMeta: () => ({}),
          validationDegradedMessage: 'Some workers could not be assigned',
          mixedFailureMessage: 'Failed to assign some workers',
        },
        onSuccess,
      );

      expect(sandbox.logger.warn).toHaveBeenCalledWith('partial', {});
      expect(setInteractionDegraded).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        'Some workers could not be assigned',
      );
      expect(onSuccess).toHaveBeenCalledWith(result);
    });

    it('calls endInteractionWithFailure when partialSuccess with mixed failure types', () => {
      const result = {
        success: true,
        partialSuccess: true,
        assignedCount: 1,
        failedCount: 1,
        failures: [
          { workerId: '1', errorCode: 'ALREADY_IN_GROUP', errorMessage: 'msg' },
        ] as FailureItem[],
      };
      const onSuccess = jest.fn();
      const {
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      handleGroupMutationSuccess(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        result,
        {
          partialSuccessEvent: 'partial',
          fullSuccessEvent: 'full',
          getLogMeta: () => ({}),
          validationDegradedMessage: 'validation',
          mixedFailureMessage: 'Failed to assign some workers',
        },
        onSuccess,
      );

      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        'Failed to assign some workers',
      );
      expect(onSuccess).toHaveBeenCalledWith(result);
    });
  });

  describe('handleGroupMutationError', () => {
    const sandbox = getDefaultSandbox();

    it('calls setInteractionDegraded when error is degraded and then onError', () => {
      const onError = jest.fn();
      const {
        setInteractionDegraded,
      } = require('src/js/common/CustomerInteraction');

      handleGroupMutationError(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        'Worker validation failed',
        'WORKER_VALIDATION_FAILED',
        { componentEvent: 'Error assigning members' },
        onError,
      );

      expect(sandbox.logger.error).toHaveBeenCalledWith(
        'Error assigning members',
        {
          error: 'Worker validation failed',
          errorCode: 'WORKER_VALIDATION_FAILED',
          isDegraded: true,
        },
      );
      expect(setInteractionDegraded).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        'Worker validation failed',
      );
      expect(onError).toHaveBeenCalledWith(
        'Worker validation failed',
        'WORKER_VALIDATION_FAILED',
      );
    });

    it('calls endInteractionWithFailure when error is not degraded and then onError', () => {
      const onError = jest.fn();
      const {
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      handleGroupMutationError(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        'Network error',
        'GENERAL_ERROR',
        { componentEvent: 'Error assigning members' },
        onError,
      );

      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        'Network error',
      );
      expect(onError).toHaveBeenCalledWith('Network error', 'GENERAL_ERROR');
    });

    it('uses empty string when error is undefined (degraded path)', () => {
      const onError = jest.fn();
      const {
        setInteractionDegraded,
      } = require('src/js/common/CustomerInteraction');

      handleGroupMutationError(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        undefined,
        'WORKER_VALIDATION_FAILED',
        { componentEvent: 'Error' },
        onError,
      );

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        '',
      );
      expect(onError).toHaveBeenCalledWith('', 'WORKER_VALIDATION_FAILED');
    });

    it('uses empty string when error is undefined (failure path)', () => {
      const onError = jest.fn();
      const {
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      handleGroupMutationError(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        undefined,
        'GENERAL_ERROR',
        { componentEvent: 'Error' },
        onError,
      );

      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
        '',
      );
      expect(onError).toHaveBeenCalledWith('', 'GENERAL_ERROR');
    });
  });

  describe('areAllFailuresWorkerValidation', () => {
    it.each([
      {
        description: 'should return false for empty array',
        failures: [] as FailureItem[],
        expected: false,
      },
      {
        description:
          'should return true when all failures have WORKER_VALIDATION_FAILED',
        failures: [
          { workerId: '1', errorCode: ErrorCodes.WORKER_VALIDATION_FAILED },
          { workerId: '2', errorCode: ErrorCodes.WORKER_VALIDATION_FAILED },
        ] as FailureItem[],
        expected: true,
      },
      {
        description:
          'should return true when single failure has WORKER_VALIDATION_FAILED',
        failures: [
          { workerId: '1', errorCode: ErrorCodes.WORKER_VALIDATION_FAILED },
        ] as FailureItem[],
        expected: true,
      },
      {
        description:
          'should return false when one failure has different error code',
        failures: [
          { workerId: '1', errorCode: ErrorCodes.WORKER_VALIDATION_FAILED },
          { workerId: '2', errorCode: 'ALREADY_IN_GROUP' },
        ] as FailureItem[],
        expected: false,
      },
      {
        description:
          'should return false when all failures have non-WORKER_VALIDATION_FAILED codes',
        failures: [
          { workerId: '1', errorCode: 'NOT_IN_GROUP' },
          { workerId: '2', errorCode: 'ALREADY_IN_GROUP' },
        ] as FailureItem[],
        expected: false,
      },
      {
        description: 'should return false when errorCode is null',
        failures: [
          { workerId: '1', errorCode: null },
          { workerId: '2', errorCode: ErrorCodes.WORKER_VALIDATION_FAILED },
        ] as FailureItem[],
        expected: false,
      },
      {
        description: 'should return false when errorCode is undefined',
        failures: [
          { workerId: '1' },
          { workerId: '2', errorCode: ErrorCodes.WORKER_VALIDATION_FAILED },
        ] as FailureItem[],
        expected: false,
      },
    ])('$description', ({ failures, expected }) => {
      expect(areAllFailuresWorkerValidation(failures)).toBe(expected);
    });
  });
});
