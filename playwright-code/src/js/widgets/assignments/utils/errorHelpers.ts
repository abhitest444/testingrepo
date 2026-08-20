/**
 * Error detection and parsing helpers for partial success scenarios
 * Partial Success Handling for Group Assignments
 */

import { ErrorCodes } from '../types';
import {
  OperationAction,
  WorkerSelectionMode,
} from '../types/Groups/GroupDrawer.types';

/**
 * Generic failure interface that works with both assignment and manager failures
 */
export interface GenericFailure {
  errorCode: string | null;
  errorMessage: string | null;
}

/**
 * Checks if a failure is due to an inactive worker
 *
 * @param failure - The failure object with errorCode and errorMessage
 * @returns True if the error is WORKER_VALIDATION_FAILED and message contains "is inactive"
 *
 * @example
 * const failure = {
 *   errorCode: 'WORKER_VALIDATION_FAILED',
 *   errorMessage: "Worker 'John Doe' is inactive"
 * };
 * isInactiveWorkerError(failure); // returns true
 */
export const isInactiveWorkerError = (failure: GenericFailure): boolean =>
  failure.errorCode === ErrorCodes.WORKER_VALIDATION_FAILED &&
  failure.errorMessage?.includes('is inactive') === true;

/**
 * Extracts worker name from inactive worker error message
 * Format: "Worker '{workerName}' is inactive"
 *
 * @param errorMessage - The error message from the API
 * @returns The extracted worker name, or 'Unknown Worker' if pattern doesn't match
 *
 * @example
 * extractWorkerName("Worker 'John Doe' is inactive"); // returns "John Doe"
 * extractWorkerName("Some other error"); // returns "Unknown Worker"
 */
export const extractWorkerName = (errorMessage: string | null): string => {
  if (!errorMessage) {
    return 'Unknown Worker';
  }

  const match = errorMessage.match(/Worker '(.+?)' is inactive/);
  return match ? match[1] : 'Unknown Worker';
};

/**
 * Checks if ALL failures are inactive worker errors
 *
 * @param failures - Array of failure objects
 * @returns True if all failures are WORKER_VALIDATION_FAILED with inactive message
 *
 * @example
 * const failures = [
 *   { errorCode: 'WORKER_VALIDATION_FAILED', errorMessage: "Worker 'John' is inactive" },
 *   { errorCode: 'WORKER_VALIDATION_FAILED', errorMessage: "Worker 'Jane' is inactive" }
 * ];
 * areAllInactiveWorkerErrors(failures); // returns true
 *
 * @example
 * const failures = [
 *   { errorCode: 'WORKER_VALIDATION_FAILED', errorMessage: "Worker 'John' is inactive" },
 *   { errorCode: 'ALREADY_ASSIGNED', errorMessage: "Already assigned" }
 * ];
 * areAllInactiveWorkerErrors(failures); // returns false
 */
export const areAllInactiveWorkerErrors = (
  failures: GenericFailure[],
): boolean => failures.length > 0 && failures.every(isInactiveWorkerError);

/**
 * Builds error message for inactive workers with bulleted list
 *
 * @param failures - Array of inactive worker failures
 * @param operationType - 'assign' or 'remove'
 * @param workerType - 'workers' or 'leads' (defaults to 'workers')
 * @returns Formatted error message with HTML line breaks and bulleted worker names
 *
 * @example
 * const failures = [
 *   { errorCode: 'WORKER_VALIDATION_FAILED', errorMessage: "Worker 'John Doe' is inactive" },
 *   { errorCode: 'WORKER_VALIDATION_FAILED', errorMessage: "Worker 'Jane Smith' is inactive" }
 * ];
 * buildInactiveWorkersErrorMessage(failures, 'assign', 'workers');
 * Returns:
 * "We could not assign the following workers:
 * - John Doe
 * - Jane Smith"
 *
 * @example
 * buildInactiveWorkersErrorMessage(failures, 'assign', 'leads');
 * Returns:
 * "We could not assign the following leads:
 * - Lead Manager"
 */
export const buildInactiveWorkersErrorMessage = (
  failures: GenericFailure[],
  operationType: OperationAction,
  workerType: WorkerSelectionMode = WorkerSelectionMode.Workers,
): string => {
  const workerNames = failures
    .map((f) => extractWorkerName(f.errorMessage))
    .map((name) => `<li>${name}</li>`)
    .join('');

  return `We could not ${operationType} the following ${workerType}:<ul>${workerNames}</ul>`;
};

/**
 * Builds combined error message for both inactive workers and leads
 * For Create Group when both members and leads have partial success
 *
 * @param memberFailures - Array of member failures
 * @param leadFailures - Array of lead failures
 * @param operationType - 'assign' or 'remove'
 * @returns Formatted error message with HTML line breaks for both workers and leads
 *
 * @example
 * buildCombinedInactiveWorkersErrorMessage(memberFailures, leadFailures, 'assign');
 * Returns:
 * "We could not assign the following workers:
 * - John Doe
 * - Jane Smith
 * And could not assign the following leads:
 * - Lead Manager"
 */
export const buildCombinedInactiveWorkersErrorMessage = (
  memberFailures: GenericFailure[],
  leadFailures: GenericFailure[],
  operationType: OperationAction,
): string => {
  const memberNames = memberFailures
    .map((f) => extractWorkerName(f.errorMessage))
    .map((name) => `<li>${name}</li>`)
    .join('');

  const leadNames = leadFailures
    .map((f) => extractWorkerName(f.errorMessage))
    .map((name) => `<li>${name}</li>`)
    .join('');

  return `We could not ${operationType} the following workers:<ul>${memberNames}</ul>And could not ${operationType} the following leads:<ul>${leadNames}</ul>`;
};

/**
 * Builds combined error message for both assign and remove inactive worker errors
 * For Edit Group when both assign and remove have partial success with all inactive errors
 *
 * @param assignFailures - Array of assign failures (all inactive)
 * @param removeFailures - Array of remove failures (all inactive)
 * @param workerType - 'workers' or 'leads'
 * @returns Formatted error message with HTML list elements for assign and remove worker names
 *
 * @example
 * buildCombinedAssignRemoveInactiveErrorMessage(assignFailures, removeFailures, 'workers');
 * Returns:
 * "We could not assign the following workers:
 * - John Doe
 * - Jane Smith
 * And could not remove the following workers:
 * - Inactive Worker"
 */
export const buildCombinedAssignRemoveInactiveErrorMessage = (
  assignFailures: GenericFailure[],
  removeFailures: GenericFailure[],
  workerType: WorkerSelectionMode,
): string => {
  const assignNames = assignFailures
    .map((f) => extractWorkerName(f.errorMessage))
    .map((name) => `<li>${name}</li>`)
    .join('');

  const removeNames = removeFailures
    .map((f) => extractWorkerName(f.errorMessage))
    .map((name) => `<li>${name}</li>`)
    .join('');

  return `We could not assign the following ${workerType}:<ul>${assignNames}</ul>And could not remove the following ${workerType}:<ul>${removeNames}</ul>`;
};
