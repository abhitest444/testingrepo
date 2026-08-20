import { useSandbox } from '@payroll/quicksand';
import { useCallback } from 'react';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  setInteractionDegraded,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  useCreateBreakAssignmentMutation,
  Payroll_CreateBreakAssignmentInput,
  Payroll_BreakAssignment,
} from 'src/__generated__/oigql/graphql';
import {
  setPageMessage,
  closeDrawer,
} from 'src/js/widgets/breaks/store/uiSlice';
import {
  addBreakAssignments,
  setBreakAssignmentsCreateLoading,
  setBreakAssignmentsCreateError,
  BreakAssignment,
} from 'src/js/widgets/breaks/store/breakAssignmentsSlice';
import {
  updateRule,
  setRefetchBreakPolicies,
} from 'src/js/widgets/breaks/store/breakRulesSlice';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useAppDispatch } from '../store/hooks';
import {
  BREAK_LOGGING_CONSTANTS,
  BREAK_DEGRADED_INTERACTION_MESSAGE_REGEX,
} from '../constants';
import { isAssignmentValidationErrorResponse } from '../utils/assignmentValidationErrorUtils';

/**
 * Checks if the error message matches any degraded interaction pattern
 * @param errorMessage - The error message to check
 * @returns true if the error should be treated as degraded
 */
const isDegradedErrorMessage = (errorMessage?: string): boolean => {
  if (!errorMessage) return false;
  return BREAK_DEGRADED_INTERACTION_MESSAGE_REGEX.some((regex) =>
    regex.test(errorMessage),
  );
};

export default function useBreakAssignmentCrud() {
  const [createBreakAssignment] = useCreateBreakAssignmentMutation();
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const logger = useLoggingConfig();

  // Callback handlers for createBreakAssignment
  const handleCreateBreakAssignmentCompleted = useCallback(
    (data: any, input?: Payroll_CreateBreakAssignmentInput) => {
      if (
        data?.payrollCreateBreakAssignment?.__typename ===
        'Payroll_BreakAssignmentResult'
      ) {
        const { results } = data.payrollCreateBreakAssignment;
        if (results && results.length > 0) {
          const newAssignments: BreakAssignment[] = [];
          const assignmentErrors: string[] = [];

          // Process each result in the array
          results.forEach((result: any) => {
            if (result.__typename === 'Payroll_CreateBreakAssignmentSuccess') {
              const assignment = result.breakAssignment;
              // Only add active assignments
              if (assignment.isActive) {
                newAssignments.push({
                  id: assignment.id,
                  breakPolicyId: assignment.breakPolicyId,
                  assignmentType: assignment.assignmentType,
                  assignee: {
                    id: assignment.assigneeId,
                  },
                  isActive: assignment.isActive,
                });
              }
            } else if (
              result.__typename === 'Payroll_BreakAssignmentAssigneeError'
            ) {
              // Handle individual assignment errors
              assignmentErrors.push(`${result.assigneeId}: ${result.message}`);
            }
          });

          // Filter errors to only include assignees that were in the payload and were marked as active
          const activeAssignmentsInPayload =
            input?.breakAssignments?.filter(
              (assignment: any) => assignment.isActive,
            ) || [];
          const activeAssigneeIdsInPayload = activeAssignmentsInPayload.map(
            (assignment: any) => assignment.assigneeId,
          );

          const filteredAssignmentErrors = assignmentErrors.filter((error) => {
            const assigneeId = error.split(':')[0];
            return activeAssigneeIdsInPayload.includes(assigneeId);
          });

          // Handle successful assignments
          if (newAssignments.length > 0) {
            dispatch(addBreakAssignments(newAssignments));

            const { breakPolicyId } = newAssignments[0];
            const assignmentCount = newAssignments.length;

            // Update the break rule with the new assignment count
            dispatch(
              updateRule({
                id: breakPolicyId,
                activeBreakAssignmentCount: assignmentCount,
              } as any),
            );

            dispatch(setBreakAssignmentsCreateLoading(false));
            endInteractionWithSuccess(
              sandbox,
              TimeCustomerInteraction.BREAK_ASSIGNMENT_CREATE,
            );
            dispatch(closeDrawer());

            logger.info(
              BREAK_LOGGING_CONSTANTS.SUCCESS.CREATE_BREAK_ASSIGNMENT_SUCCESS,
              {
                breakPolicyId,
                assignmentCount,
                totalResults: results.length,
                successfulAssignments: newAssignments.length,
                failedAssignments: assignmentErrors.length,
              },
            );

            // Show warning if there were partial failures
            if (filteredAssignmentErrors.length > 0) {
              dispatch(
                setPageMessage({
                  show: true,
                  type: 'warn',
                  message: `Some assignments failed: ${filteredAssignmentErrors.join(
                    ', ',
                  )}`,
                  titleNlsKey:
                    'breaks.api.assignments.create.partial.success.title',
                  descriptionNlsKey:
                    'breaks.api.assignments.create.partial.success.description',
                }),
              );
            } else {
              // Only refetch break policies when all assignments succeed
              dispatch(setRefetchBreakPolicies(true));
            }
          } else {
            // All assignments failed
            dispatch(setBreakAssignmentsCreateLoading(false));
            dispatch(setBreakAssignmentsCreateError('All assignments failed'));
            dispatch(
              setPageMessage({
                show: true,
                type: 'error',
                message: `All assignments failed: ${assignmentErrors.join(
                  ', ',
                )}`,
                titleNlsKey: 'breaks.api.assignments.create.error.title',
              }),
            );
            endInteractionWithFailure(
              sandbox,
              TimeCustomerInteraction.BREAK_ASSIGNMENT_CREATE,
              'All assignments failed',
            );
            logger.error(
              BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_ASSIGNMENT_FAILED,
              {
                error: 'All assignments failed',
                assignmentErrors,
              },
            );
          }
        }
      } else if (
        data?.payrollCreateBreakAssignment?.__typename ===
        'Payroll_BreakAssignmentError'
      ) {
        const error = data.payrollCreateBreakAssignment;
        dispatch(setBreakAssignmentsCreateError(error.message));
        dispatch(setBreakAssignmentsCreateLoading(false));
        dispatch(
          setPageMessage({
            show: true,
            type: 'error',
            message: error.message,
            code: error.code,
            titleNlsKey: 'breaks.api.assignments.create.error.title',
          }),
        );

        // Check if this is an assignment validation error and mark interaction accordingly
        if (isAssignmentValidationErrorResponse(error)) {
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.BREAK_ASSIGNMENT_CREATE,
          );
          logger.info(
            BREAK_LOGGING_CONSTANTS.VALIDATION_ERRORS
              .CREATE_BREAK_ASSIGNMENT_VALIDATION_ERROR,
            {
              error: error.message,
              code: error.code,
              isValidationError: true,
            },
          );
        } else if (isDegradedErrorMessage(error.message)) {
          setInteractionDegraded(
            sandbox,
            TimeCustomerInteraction.BREAK_ASSIGNMENT_CREATE,
            error.message,
          );
          logger.info(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_ASSIGNMENT_FAILED,
            {
              error: error.message,
              code: error.code,
              isDegraded: true,
            },
          );
        } else {
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.BREAK_ASSIGNMENT_CREATE,
            error.message,
          );
          logger.error(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_ASSIGNMENT_FAILED,
            {
              error: error.message,
              code: error.code,
            },
          );
        }
      }
    },
    [dispatch, sandbox, logger],
  );

  const handleCreateBreakAssignmentError = useCallback(
    (error: any) => {
      dispatch(setBreakAssignmentsCreateError(error.message));
      dispatch(setBreakAssignmentsCreateLoading(false));
      dispatch(
        setPageMessage({
          show: true,
          type: 'error',
          message: error.message,
          titleNlsKey: 'breaks.api.assignments.create.error.title',
        }),
      );

      // Check if this is an assignment validation error and mark interaction accordingly
      if (isAssignmentValidationErrorResponse(error)) {
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.BREAK_ASSIGNMENT_CREATE,
        );
        logger.info(
          BREAK_LOGGING_CONSTANTS.VALIDATION_ERRORS
            .CREATE_BREAK_ASSIGNMENT_VALIDATION_ERROR,
          {
            error: error.message,
            code: error.code,
            isValidationError: true,
          },
        );
      } else if (isDegradedErrorMessage(error.message)) {
        setInteractionDegraded(
          sandbox,
          TimeCustomerInteraction.BREAK_ASSIGNMENT_CREATE,
          error.message,
        );

        if (error instanceof Error) {
          logger.logException(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_ASSIGNMENT_FAILED,
            error,
            { isDegraded: true },
          );
        } else {
          logger.info(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_ASSIGNMENT_FAILED,
            {
              error: error.message,
              code: error.code,
              isDegraded: true,
            },
          );
        }
      } else {
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.BREAK_ASSIGNMENT_CREATE,
          error.message,
        );

        if (error instanceof Error) {
          logger.logException(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_ASSIGNMENT_FAILED,
            error,
            {},
          );
        } else {
          logger.error(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_ASSIGNMENT_FAILED,
            {
              error: error.message,
              code: error.code,
            },
          );
        }
      }
    },
    [dispatch, sandbox, logger],
  );

  const createBreakAssignments = useCallback(
    async (input: Payroll_CreateBreakAssignmentInput) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.BREAK_ASSIGNMENT_CREATE,
      );
      dispatch(setBreakAssignmentsCreateLoading(true));
      dispatch(setBreakAssignmentsCreateError(null));
      createBreakAssignment({
        variables: {
          input,
        },
        context: {
          clientName: ApolloClientNames.OIGQL,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.BREAK_ASSIGNMENT_CREATE,
          ),
        },
        onCompleted: (data) =>
          handleCreateBreakAssignmentCompleted(data, input),
        onError: handleCreateBreakAssignmentError,
      });
    },
    [
      createBreakAssignment,
      sandbox,
      dispatch,
      handleCreateBreakAssignmentCompleted,
      handleCreateBreakAssignmentError,
    ],
  );

  return {
    createBreakAssignments,
  };
}
