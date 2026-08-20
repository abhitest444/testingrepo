import { useSandbox } from '@payroll/quicksand';
import { useCallback, useRef } from 'react';
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
  useGetBreakAssignmentsLazyQuery,
  Payroll_BreakAssignment,
} from 'src/__generated__/oigql/graphql';
import { setPageMessage } from 'src/js/widgets/breaks/store/uiSlice';
import {
  setBreakAssignments,
  setBreakAssignmentsLoading,
  setBreakAssignmentsError,
  BreakAssignment,
} from 'src/js/widgets/breaks/store/breakAssignmentsSlice';
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

export default function useBreakAssignmentsByBreakId() {
  const [getBreakAssignmentsQuery] = useGetBreakAssignmentsLazyQuery({
    fetchPolicy: 'cache-and-network',
  });
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const logger = useLoggingConfig();

  // Temporary storage for assignments across pagination
  const tempAssignmentsRef = useRef<BreakAssignment[]>([]);

  // Callback handlers for getBreakAssignments
  const handleGetBreakAssignmentsCompleted = useCallback(
    (
      data: any,
      hasNextPage: boolean,
      onComplete?: (assignments?: BreakAssignment[]) => void,
    ) => {
      if (data?.payrollBreakAssignments?.nodes) {
        const assignments: BreakAssignment[] =
          data.payrollBreakAssignments.nodes.map(
            (node: Payroll_BreakAssignment) => ({
              id: node.id,
              breakPolicyId: node.breakPolicyId,
              assignmentType: node.assignmentType,
              assignee: {
                id: node.assigneeId,
              },
              isActive: node.isActive,
            }),
          );

        // Add to temporary storage
        tempAssignmentsRef.current.push(...assignments);

        // If this is the last page, dispatch all assignments
        if (!hasNextPage) {
          dispatch(setBreakAssignments(tempAssignmentsRef.current));
          dispatch(setBreakAssignmentsLoading(false));
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.BREAK_ASSIGNMENT_READ,
          );

          logger.info(
            BREAK_LOGGING_CONSTANTS.SUCCESS.GET_BREAK_ASSIGNMENTS_SUCCESS,
            {
              breakPolicyId:
                data.payrollBreakAssignments.nodes?.[0]?.breakPolicyId,
              assignmentCount: tempAssignmentsRef.current.length,
            },
          );

          // Call completion callback if provided, passing the fresh assignments
          if (onComplete) {
            onComplete(tempAssignmentsRef.current);
          }
        }
      }
    },
    [sandbox, dispatch, logger],
  );

  const handleGetBreakAssignmentsError = useCallback(
    (error: any) => {
      dispatch(setBreakAssignmentsError(error.message));
      dispatch(setBreakAssignmentsLoading(false));
      dispatch(
        setPageMessage({
          show: true,
          type: 'error',
          message: error.message,
          code: error.code,
          titleNlsKey: 'breaks.api.assignments.create.error.title',
          descriptionNlsKey: 'breaks.api.assignments.create.error.description',
        }),
      );
      // Clear temporary storage on error
      tempAssignmentsRef.current = [];

      // Check if this is an assignment validation error and mark interaction accordingly
      if (isAssignmentValidationErrorResponse(error)) {
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.BREAK_ASSIGNMENT_READ,
        );
        logger.info(
          BREAK_LOGGING_CONSTANTS.SUCCESS.GET_BREAK_ASSIGNMENTS_SUCCESS,
          {
            error: error.message,
            code: error.code,
            isValidationError: true,
          },
        );
      } else if (isDegradedErrorMessage(error.message)) {
        setInteractionDegraded(
          sandbox,
          TimeCustomerInteraction.BREAK_ASSIGNMENT_READ,
          error.message,
        );

        if (error instanceof Error) {
          logger.logException(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_BREAK_ASSIGNMENTS_FAILED,
            error,
            { isDegraded: true },
          );
        } else {
          logger.info(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_BREAK_ASSIGNMENTS_FAILED,
            {
              error: error.message,
              code: error.code,
              response: error,
              isDegraded: true,
            },
          );
        }
      } else {
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.BREAK_ASSIGNMENT_READ,
          error.message,
        );

        if (error instanceof Error) {
          logger.logException(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_BREAK_ASSIGNMENTS_FAILED,
            error,
            {},
          );
        } else {
          logger.error(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_BREAK_ASSIGNMENTS_FAILED,
            {
              error: error.message,
              code: error.code,
              response: error,
            },
          );
        }
      }
    },
    [sandbox, dispatch, logger],
  );

  const getBreakAssignments = useCallback(
    async (
      breakPolicyId: string,
      onComplete?: (assignments?: BreakAssignment[]) => void,
    ) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.BREAK_ASSIGNMENT_READ,
      );
      dispatch(setBreakAssignmentsLoading(true));
      dispatch(setBreakAssignmentsError(null));

      // Clear temporary storage at the start
      tempAssignmentsRef.current = [];

      const fetchAllPages = async (after?: string): Promise<void> => {
        try {
          const result = await getBreakAssignmentsQuery({
            variables: {
              first: 200, // Fetch 200 items per page
              after,
              filter: {
                breakPolicyId,
              },
            },
            context: {
              clientName: ApolloClientNames.OIGQL,
              headers: getCustomerInteractionPropagationHeaders(
                sandbox,
                TimeCustomerInteraction.BREAK_ASSIGNMENT_READ,
              ),
            },
          });

          if (result.error) {
            handleGetBreakAssignmentsError(result.error);
            return;
          }

          const { data } = result;
          const hasNextPage =
            data?.payrollBreakAssignments?.pageInfo?.hasNextPage || false;
          const nextAfter = data?.payrollBreakAssignments?.pageInfo?.endCursor;

          // Handle the completed data
          handleGetBreakAssignmentsCompleted(data, hasNextPage, onComplete);

          // Recursively fetch next page if there is one
          if (hasNextPage && nextAfter) {
            await fetchAllPages(nextAfter);
          }
        } catch (error: any) {
          handleGetBreakAssignmentsError(error);
        }
      };

      try {
        await fetchAllPages();
      } catch (error: any) {
        handleGetBreakAssignmentsError(error);
      }
    },
    [
      getBreakAssignmentsQuery,
      sandbox,
      dispatch,
      handleGetBreakAssignmentsCompleted,
      handleGetBreakAssignmentsError,
    ],
  );

  return {
    getBreakAssignments,
  };
}
