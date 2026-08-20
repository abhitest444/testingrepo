/**
 * Utility functions for group mutation hooks
 * Partial Success Handling for Group Assignments
 */

import {
  endInteractionWithSuccess,
  endInteractionWithFailure,
  TimeCustomerInteraction,
  setInteractionDegraded,
  shouldTreatErrorAsDegraded,
} from 'src/js/common/CustomerInteraction';
import { Sandbox } from 'src/js/common/sandbox';
import { ErrorCodes } from 'src/js/widgets/assignments/types';

/**
 * Generic failure item interface for both assignments and removals.
 * workerId is required (API assignment/removal error results always include it).
 */
export interface FailureItem {
  workerId: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}

/**
 * Normalized failure shape (all fields required). Derived from FailureItem;
 * use for assignment/removal result failures after mapping.
 */
export type FailureOutput = FailureItem & {
  errorCode: string | null;
  errorMessage: string | null;
};

/**
 * Type guard: Check if API response is an error (has errorCode).
 * Shared across assign/remove members and managers mutations.
 */
export function isErrorResponse(
  res: unknown,
): res is { errorCode: string; message?: string } {
  return (
    typeof res === 'object' &&
    res !== null &&
    'errorCode' in res &&
    typeof (res as { errorCode: unknown }).errorCode === 'string'
  );
}

/**
 * Get error code for complete failure: WORKER_VALIDATION_FAILED if all failures
 * are validation errors, otherwise undefined.
 */
export function getErrorCodeForCompleteFailure(
  failures: FailureItem[],
): string | undefined {
  return areAllFailuresWorkerValidation(failures)
    ? ErrorCodes.WORKER_VALIDATION_FAILED
    : undefined;
}

/**
 * Map API error items to the common FailureOutput shape.
 */
export function mapToFailureOutput(items: FailureItem[]): FailureOutput[] {
  return items.map((f) => ({
    workerId: f.workerId,
    errorCode: f.errorCode ?? null,
    errorMessage: f.errorMessage ?? null,
  }));
}

/** Options for handleGroupMutationSuccess */
export interface GroupMutationSuccessOptions<T> {
  partialSuccessEvent: string;
  fullSuccessEvent: string;
  getLogMeta: (result: T) => Record<string, unknown>;
  validationDegradedMessage: string;
  mixedFailureMessage: string;
}

/**
 * Shared success handler: logs partial/full success, handles interaction
 * (degraded vs failure vs success), then calls onSuccess.
 */
export function handleGroupMutationSuccess<
  T extends { failures?: FailureItem[]; partialSuccess?: boolean },
>(
  sandbox: Sandbox,
  interaction: TimeCustomerInteraction,
  result: T,
  options: GroupMutationSuccessOptions<T>,
  onSuccess: (result: T) => void,
): void {
  if (result.partialSuccess) {
    sandbox.logger.warn(
      options.partialSuccessEvent,
      options.getLogMeta(result),
    );
  } else {
    sandbox.logger.info(options.fullSuccessEvent, options.getLogMeta(result));
  }

  if (result.failures && result.failures.length > 0) {
    const allValidationErrors = areAllFailuresWorkerValidation(result.failures);
    if (allValidationErrors) {
      setInteractionDegraded(
        sandbox,
        interaction,
        options.validationDegradedMessage,
      );
    } else {
      endInteractionWithFailure(
        sandbox,
        interaction,
        options.mixedFailureMessage,
      );
    }
  } else {
    endInteractionWithSuccess(sandbox, interaction);
  }

  onSuccess(result);
}

/** Options for handleGroupMutationError */
export interface GroupMutationErrorOptions {
  componentEvent: string;
}

/**
 * Shared error handler: checks degraded, logs, updates interaction, then calls onError.
 */
export function handleGroupMutationError(
  sandbox: Sandbox,
  interaction: TimeCustomerInteraction,
  error: string | undefined,
  errorCode: string,
  options: GroupMutationErrorOptions,
  onError: (error: string, errorCode: string) => void,
): void {
  const isDegraded = shouldTreatErrorAsDegraded(errorCode, error ?? '');

  sandbox.logger.error(options.componentEvent, {
    error,
    errorCode,
    isDegraded,
  });

  if (isDegraded) {
    setInteractionDegraded(sandbox, interaction, error ?? '');
  } else {
    endInteractionWithFailure(sandbox, interaction, error ?? '');
  }
  onError(error ?? '', errorCode);
}

/**
 * Checks if all failure items have errorCode as WORKER_VALIDATION_FAILED
 * Used to determine if a complete failure should pass WORKER_VALIDATION_FAILED to error handler
 *
 * Complete failure error code detection
 *
 * @param failures - Array of failure objects (can be empty)
 * @returns True if all failures have errorCode === 'WORKER_VALIDATION_FAILED', false otherwise
 *
 * @example
 * const failures = [
 *   { workerId: '1', errorCode: 'WORKER_VALIDATION_FAILED' },
 *   { workerId: '2', errorCode: 'WORKER_VALIDATION_FAILED' }
 * ];
 * areAllFailuresWorkerValidation(failures); // returns true
 *
 * @example
 * const failures = [
 *   { workerId: '1', errorCode: 'WORKER_VALIDATION_FAILED' },
 *   { workerId: '2', errorCode: 'SOME_OTHER_ERROR' }
 * ];
 * areAllFailuresWorkerValidation(failures); // returns false
 *
 * @example
 * areAllFailuresWorkerValidation([]); // returns false (empty array)
 */
export const areAllFailuresWorkerValidation = (
  failures: FailureItem[],
): boolean => {
  // Empty array returns false
  if (failures.length === 0) {
    return false;
  }

  // Check if all failures have errorCode === 'WORKER_VALIDATION_FAILED'
  return failures.every(
    (failure) => failure.errorCode === ErrorCodes.WORKER_VALIDATION_FAILED,
  );
};
