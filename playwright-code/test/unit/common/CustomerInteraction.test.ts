import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  setInteractionDegraded,
  shouldTreatErrorAsDegraded,
  shouldTreatWeeklyTimesheetErrorAsDegraded,
  getCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
  REASON_NOISY_ERROR,
} from 'src/js/common/CustomerInteraction';
import { NOISY_ERRORS } from 'src/js/service/utils/mapError';

describe('Customer Interaction Utils', () => {
  let sandbox: any;

  beforeEach(() => {
    sandbox = {
      performance: {
        createCustomerInteraction: jest.fn(),
        getCustomerInteraction: jest.fn(),
        record: jest.fn(),
      },
      logger: {
        log: jest.fn(),
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createCustomerInteraction', () => {
    test('should create a customer interaction with metadata', () => {
      createCustomerInteraction(sandbox, 'testInteraction', { key: 'value' });
      expect(
        sandbox.performance.createCustomerInteraction,
      ).toHaveBeenCalledWith(
        'testInteraction',
        { key: 'value' },
        { returnExistingCI: true },
      );
    });

    test('should create a customer interaction without metadata', () => {
      createCustomerInteraction(sandbox, 'testInteraction');
      expect(
        sandbox.performance.createCustomerInteraction,
      ).toHaveBeenCalledWith('testInteraction', undefined, {
        returnExistingCI: true,
      });
    });
  });

  describe('getCustomerInteraction', () => {
    test('should get a customer interaction', () => {
      sandbox.performance.getCustomerInteraction.mockReturnValue('interaction');
      const result = getCustomerInteraction(sandbox, 'testInteraction');
      expect(result).toBe('interaction');
      expect(sandbox.performance.getCustomerInteraction).toHaveBeenCalledWith(
        'testInteraction',
      );
    });
  });

  describe('getCustomerInteractionPropagationHeaders', () => {
    test('should get trace propagation headers', () => {
      const interaction = {
        getTracePropagationHeaders: jest.fn().mockReturnValue('headers'),
      };
      sandbox.performance.getCustomerInteraction.mockReturnValue(interaction);
      const result = getCustomerInteractionPropagationHeaders(
        sandbox,
        'testInteraction',
      );
      expect(result).toBe('headers');
      expect(interaction.getTracePropagationHeaders).toHaveBeenCalled();
    });
  });

  describe('endInteractionWithSuccess', () => {
    test('should mark interaction as success and record it', () => {
      const interaction = {
        success: jest.fn(),
      };
      sandbox.performance.getCustomerInteraction.mockReturnValue(interaction);
      endInteractionWithSuccess(sandbox, 'testInteraction');
      expect(interaction.success).toHaveBeenCalled();
      expect(sandbox.performance.record).toHaveBeenCalledWith(interaction);
      expect(sandbox.logger.log).toHaveBeenCalledWith(
        'CustomerInteraction testInteraction marked as success.',
      );
    });
  });

  describe('endInteractionWithFailure', () => {
    test.each([
      ['errorReason', null],
      ['errorReason', 'error'],
    ])(
      'should mark interaction as failed with reason: %s and error: %o',
      (reason, error) => {
        const interaction = {
          fail: jest.fn(),
          addMetadata: jest.fn(),
        };
        sandbox.performance.getCustomerInteraction.mockReturnValue(interaction);
        endInteractionWithFailure(sandbox, 'testInteraction', reason, error);
        expect(interaction.fail).toHaveBeenCalledWith(reason);
        if (error) {
          expect(interaction.addMetadata).toHaveBeenCalledWith(error);
        } else {
          expect(interaction.addMetadata).not.toHaveBeenCalled();
        }
        expect(sandbox.performance.record).toHaveBeenCalledWith(interaction);
        expect(sandbox.logger.log).toHaveBeenCalledWith(
          'CustomerInteraction testInteraction marked as failed.',
        );
      },
    );

    test('should mark interaction as aborted with a noisy error', () => {
      const interaction = {
        abort: jest.fn(),
      };
      sandbox.performance.getCustomerInteraction.mockReturnValue(interaction);

      endInteractionWithFailure(sandbox, 'testInteraction', NOISY_ERRORS[0]);

      expect(interaction.abort).toHaveBeenCalledWith(
        `${REASON_NOISY_ERROR}: ${NOISY_ERRORS[0]}`,
      );
      expect(sandbox.performance.record).toHaveBeenCalledWith(interaction);
      expect(sandbox.logger.log).toHaveBeenCalledWith(
        'CustomerInteraction testInteraction marked as aborted.',
      );
    });
  });

  describe('setInteractionDegraded', () => {
    test('should mark interaction as degraded, call success, and record it', () => {
      const interaction = {
        setDegraded: jest.fn(),
        success: jest.fn(),
      };
      sandbox.performance.getCustomerInteraction.mockReturnValue(interaction);
      setInteractionDegraded(
        sandbox,
        'testInteraction',
        'Test degraded reason',
      );
      expect(interaction.setDegraded).toHaveBeenCalledWith(
        'Test degraded reason',
      );
      expect(interaction.success).toHaveBeenCalled();
      expect(sandbox.performance.record).toHaveBeenCalledWith(interaction);
      expect(sandbox.logger.log).toHaveBeenCalledWith(
        'CustomerInteraction testInteraction marked as degraded with reason: Test degraded reason',
      );
    });

    test('should handle null interaction gracefully', () => {
      sandbox.performance.getCustomerInteraction.mockReturnValue(null);
      expect(() => {
        setInteractionDegraded(sandbox, 'testInteraction', 'Test reason');
      }).not.toThrow();
    });
  });

  describe('shouldTreatErrorAsDegraded', () => {
    test('should return true for CONFLICTING_END_TIME_ENTRY', () => {
      expect(shouldTreatErrorAsDegraded('CONFLICTING_END_TIME_ENTRY')).toBe(
        true,
      );
    });

    test('should return true for CONFLICTING_START_END_TIME_ENTRY', () => {
      expect(
        shouldTreatErrorAsDegraded('CONFLICTING_START_END_TIME_ENTRY'),
      ).toBe(true);
    });

    test('should return true for CONFLICTING_START_TIME_ENTRY', () => {
      expect(shouldTreatErrorAsDegraded('CONFLICTING_START_TIME_ENTRY')).toBe(
        true,
      );
    });

    test('should return true for DURATION_MUST_BE_LESS_THAN_24_HOURS', () => {
      expect(
        shouldTreatErrorAsDegraded('DURATION_MUST_BE_LESS_THAN_24_HOURS'),
      ).toBe(true);
    });

    test('should return true for START_OR_END_TIME_IN_FUTURE', () => {
      expect(shouldTreatErrorAsDegraded('START_OR_END_TIME_IN_FUTURE')).toBe(
        true,
      );
    });

    test('should return true for TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET', () => {
      expect(
        shouldTreatErrorAsDegraded('TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET'),
      ).toBe(true);
    });

    test('should return true for error message containing "duplicate key value violates"', () => {
      expect(
        shouldTreatErrorAsDegraded(
          undefined,
          'Error: duplicate key value violates unique constraint',
        ),
      ).toBe(true);
    });

    test('should return true for error message with uppercase "DUPLICATE KEY VALUE VIOLATES"', () => {
      expect(
        shouldTreatErrorAsDegraded(
          undefined,
          'ERROR: DUPLICATE KEY VALUE VIOLATES',
        ),
      ).toBe(true);
    });

    test('should return false for non-degraded error codes', () => {
      expect(shouldTreatErrorAsDegraded('GENERAL_ERROR')).toBe(false);
    });

    test('should return false for non-degraded error messages', () => {
      expect(shouldTreatErrorAsDegraded(undefined, 'Some other error')).toBe(
        false,
      );
    });

    test('should return false for undefined inputs', () => {
      expect(shouldTreatErrorAsDegraded()).toBe(false);
    });
  });

  describe('shouldTreatWeeklyTimesheetErrorAsDegraded', () => {
    test('should return true when error message contains DataSyncWorkflowActivityType', () => {
      expect(
        shouldTreatWeeklyTimesheetErrorAsDegraded(
          'Error with DataSyncWorkflowActivityType details',
        ),
      ).toBe(true);
    });

    test('should return true when error message has DataSyncWorkflowActivityType in middle', () => {
      expect(
        shouldTreatWeeklyTimesheetErrorAsDegraded(
          'Something went wrong. DataSyncWorkflowActivityType failed. Try again.',
        ),
      ).toBe(true);
    });

    test('should return false for error message without DataSyncWorkflowActivityType', () => {
      expect(
        shouldTreatWeeklyTimesheetErrorAsDegraded('Some other error'),
      ).toBe(false);
    });

    test('should return false for undefined error message', () => {
      expect(shouldTreatWeeklyTimesheetErrorAsDegraded()).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(shouldTreatWeeklyTimesheetErrorAsDegraded('')).toBe(false);
    });
  });
});
