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
  useGetEmployerBreaksLazyQuery,
  useGetEmployerBreaksByAssigneeLazyQuery,
  useDeleteEmployerBreakMutation,
  useCreateEmployerBreakMutation,
  useUpdateEmployerBreakMutation,
  Payroll_EmployerBreakInput,
  Payroll_EmployerBreak,
  Payroll_BreakAssignmentInput,
  Payroll_BreakAssignmentType,
  Payroll_CreateBreakAssignmentInput,
} from 'src/__generated__/oigql/graphql';
import {
  setBreakToEdit,
  setIsAddBreakRuleEnabled,
  setIsCreateBreakOpen,
  setIsEditBreakOpen,
  setPageMessage,
  closeDrawer,
  setBreakToDelete,
  setDeleteModalOpen,
} from 'src/js/widgets/breaks/store/uiSlice';
import { setBreakAssignmentsLoading } from 'src/js/widgets/breaks/store/breakAssignmentsSlice';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  ITM_TASK_TYPE_LUNCH_BREAKS,
  ITM_TASK_STATUS_OPEN,
  ITM_TASK_STATUS_DONE_YES,
  ITM_LOGGING,
} from 'src/js/widgets/qbtOrchestrator/features/overview/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import {
  useInitializeItmTasks,
  useUpdateItmTask,
} from 'src/js/widgets/qbtOrchestrator/features/overview/hooks';
import { selectItmTasks } from 'src/js/widgets/qbtOrchestrator/features/overview/store/overviewSelectors';
import { storeManager } from 'src/js/widgets/qbtOrchestrator/store/storeManager';
import useBreakAssignmentCrud from './useBreakAssignmentCrud';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setRules,
  setLoading,
  setError,
  removeRule,
  setDeleteLoading,
  setDeleteError,
  setCreateLoading,
  setCreateError,
  setUpdateLoading,
  setUpdateError,
  addRule,
  updateRule,
  setRefetchBreakPolicies,
} from '../store/breakRulesSlice';
import {
  setBreaksByAssignee,
  setBreaksByAssigneeLoading,
  setBreaksByAssigneeError,
} from '../store/quickfillsSlice';
import { clearTempAssignments, closeForm } from '../store/breakPolicyFormSlice';
import { selectTeamMembers } from '../store/workerSlice';
import { BreakRule, BreakRuleInput, TeamMember } from '../types';
import {
  MAX_BREAK_RULES,
  BREAK_POLICY_ERROR_CODES,
  BREAK_LOGGING_CONSTANTS,
  BREAK_DEGRADED_INTERACTION_MESSAGE_REGEX,
} from '../constants';
import { deriveAssignmentTypeFromWorkerType } from '../utils';
import { isValidationErrorResponse } from '../utils/validationErrorUtils';

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

export default function useBreaksCrud() {
  const [getAllBreaks] = useGetEmployerBreaksLazyQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [getBreaksByAssignee] = useGetEmployerBreaksByAssigneeLazyQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [deleteEmployerBreak] = useDeleteEmployerBreakMutation();
  const [createEmployerBreak] = useCreateEmployerBreakMutation();
  const [updateEmployerBreak] = useUpdateEmployerBreakMutation();
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const teamMembers = useAppSelector(selectTeamMembers);
  const { createBreakAssignments } = useBreakAssignmentCrud();
  const logger = useLoggingConfig();
  const { updateItmTask } = useUpdateItmTask();
  const { isEnabled: isOverviewModernisationEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_QBTIME_OVERVIEW_MODERNISATION,
    defaultValue: false,
  });

  useInitializeItmTasks();

  // Callback handlers for getAllBreaks
  const handleGetAllBreaksCompleted = useCallback(
    (data: any) => {
      if (data?.payrollEmployerBreaks?.nodes) {
        const breakRules: BreakRule[] = data.payrollEmployerBreaks.nodes.map(
          (node: Payroll_EmployerBreak) => ({
            ...node,
            __typename: 'Payroll_EmployerBreak',
          }),
        );
        dispatch(setRules(breakRules));
        dispatch(setIsAddBreakRuleEnabled(breakRules.length < MAX_BREAK_RULES));
        dispatch(setLoading(false));
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_READ,
        );
        dispatch(closeDrawer());

        logger.info(BREAK_LOGGING_CONSTANTS.SUCCESS.GET_ALL_BREAKS_SUCCESS, {
          breakCount: breakRules.length,
        });
      }
    },
    [sandbox, dispatch],
  );

  const handleGetAllBreaksError = useCallback(
    (error: any) => {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
      dispatch(
        setPageMessage({
          show: true,
          type: 'error',
          message: error.message,
          code: error.code,
          titleNlsKey: 'breaks.api.get.error.title',
          descriptionNlsKey: 'breaks.api.get.error.description',
        }),
      );
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.BREAK_RULE_READ,
        error.message,
      );

      if (error instanceof Error) {
        logger.logException(
          BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_ALL_BREAKS_FAILED,
          error,
          {},
        );
      } else {
        logger.error(BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_ALL_BREAKS_FAILED, {
          error: error.message,
          code: error.code,
          response: error,
        });
      }
    },
    [sandbox, dispatch, logger],
  );

  // Callback handlers for getBreaksByAssignee
  const handleGetBreaksByAssigneeCompleted = useCallback(
    (data: any, assigneeId: string) => {
      if (data?.payrollEmployerBreaksByAssigneeId?.nodes) {
        const breakRules: BreakRule[] =
          data.payrollEmployerBreaksByAssigneeId.nodes.map(
            (node: Payroll_EmployerBreak) => ({
              ...node,
              __typename: 'Payroll_EmployerBreak',
            }),
          );
        dispatch(setBreaksByAssignee({ assigneeId, breaks: breakRules }));
        dispatch(setBreaksByAssigneeLoading({ assigneeId, loading: false }));
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
        );

        logger.info(
          BREAK_LOGGING_CONSTANTS.SUCCESS.GET_BREAKS_BY_ASSIGNEE_SUCCESS,
          {
            assigneeId,
            breakCount: breakRules.length,
          },
        );
      }
    },
    [sandbox, dispatch, logger],
  );

  const handleGetBreaksByAssigneeError = useCallback(
    (error: any, assigneeId: string) => {
      // Log the actual error for debugging
      if (error instanceof Error) {
        logger.logException(
          BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_BREAKS_BY_ASSIGNEE_FAILED,
          error,
          {
            assigneeId,
          },
        );
      } else {
        logger.error(
          BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_BREAKS_BY_ASSIGNEE_FAILED,
          {
            assigneeId,
            error: error.message,
            code: error.code,
            response: error,
          },
        );
      }

      // Dispatch errorCode (fallback to GENERAL_ERROR if not available)
      const errorCode = error.code || BREAK_POLICY_ERROR_CODES.GENERAL_ERROR;
      dispatch(setBreaksByAssigneeError({ assigneeId, errorCode }));

      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
        error.message,
      );
    },
    [sandbox, dispatch, logger],
  );

  const handleDeleteBreaksError = useCallback(
    (error: any) => {
      dispatch(setDeleteError(error.message));
      dispatch(setDeleteLoading(false));
      dispatch(
        setPageMessage({
          show: true,
          type: 'error',
          message: error.message,
          code: error.code,
          titleNlsKey: 'breaks.api.save.error.title',
          descriptionNlsKey: 'breaks.api.save.error.description',
        }),
      );

      // Check if this is a validation error and mark interaction accordingly
      if (isValidationErrorResponse(error)) {
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_DELETE,
        );
        logger.info(
          BREAK_LOGGING_CONSTANTS.VALIDATION_ERRORS
            .DELETE_BREAK_POLICY_VALIDATION_ERROR,
          {
            error: error.message,
            code: error.code,
            isValidationError: true,
          },
        );
      } else if (isDegradedErrorMessage(error.message)) {
        setInteractionDegraded(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_DELETE,
          error.message,
        );

        if (error instanceof Error) {
          logger.logException(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.DELETE_BREAK_POLICY_FAILED,
            error,
            { isDegraded: true },
          );
        } else {
          logger.info(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.DELETE_BREAK_POLICY_FAILED,
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
          TimeCustomerInteraction.BREAK_RULE_DELETE,
          error.message,
        );

        if (error instanceof Error) {
          logger.logException(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.DELETE_BREAK_POLICY_FAILED,
            error,
            {},
          );
        } else {
          logger.error(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.DELETE_BREAK_POLICY_FAILED,
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

  // Callback handlers for createEmployerBreak
  const handleCreateBreaksCompleted = useCallback(
    (data: any, assignments?: TeamMember[]) => {
      if (
        data?.payrollCreateEmployerBreak?.__typename ===
        'Payroll_CreateEmployerBreakSuccess'
      ) {
        const { breakRule } = data.payrollCreateEmployerBreak;
        if (breakRule) {
          dispatch(addRule(breakRule as BreakRule));

          // dispatch(clearTempAssignments());

          // Create break assignments only if the break rule is NOT a default policy
          // (Default policies apply to all team members, so no individual assignments needed)
          if (
            assignments &&
            assignments.length > 0 &&
            !breakRule.isDefaultPolicy
          ) {
            const breakAssignments = assignments.map((member) => ({
              assigneeId: member.id,
              assignmentType: deriveAssignmentTypeFromWorkerType(member),
              isActive: member.isActive || false,
            }));

            const breakAssignmentInput: Payroll_CreateBreakAssignmentInput = {
              breakPolicyId: breakRule.id,
              breakAssignments,
            };
            createBreakAssignments(breakAssignmentInput);
          } else {
            dispatch(closeForm());
            dispatch(closeDrawer());
          }
          dispatch(setCreateLoading(false));
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_CREATE,
          );

          logger.info(
            BREAK_LOGGING_CONSTANTS.SUCCESS.CREATE_BREAK_POLICY_SUCCESS,
            {
              breakRuleId: breakRule.id,
              breakRuleName: breakRule.breakName,
              isDefaultPolicy: breakRule.isDefaultPolicy,
              assignmentCount: assignments?.length || 0,
            },
          );

          // Update ITM task if there's an open "time-lunch-breaks" task
          if (isOverviewModernisationEnabled) {
            const orchestratorState = storeManager.store.getState();
            const tasks = selectItmTasks(orchestratorState);
            const lunchBreaksTask = tasks.find(
              (task) =>
                task.type === ITM_TASK_TYPE_LUNCH_BREAKS &&
                task.status === ITM_TASK_STATUS_OPEN,
            );

            if (lunchBreaksTask) {
              logger.info(ITM_LOGGING.ITM_TASK_UPDATE_INITIATED, {
                taskId: lunchBreaksTask.id,
                taskType: ITM_TASK_TYPE_LUNCH_BREAKS,
              });

              updateItmTask({
                id: lunchBreaksTask.id,
                status: ITM_TASK_STATUS_DONE_YES,
              })
                .then((result) => {
                  if (result.success) {
                    logger.info(ITM_LOGGING.ITM_TASK_UPDATE_SUCCESS, {
                      taskId: lunchBreaksTask.id,
                      taskType: ITM_TASK_TYPE_LUNCH_BREAKS,
                      newStatus: ITM_TASK_STATUS_DONE_YES,
                    });
                  } else {
                    logger.error(ITM_LOGGING.ITM_TASK_UPDATE_FAILED, {
                      taskId: lunchBreaksTask.id,
                      error: result.message,
                    });
                  }
                })
                .catch((error) => {
                  logger.error(ITM_LOGGING.ITM_TASK_UPDATE_FAILED, {
                    taskId: lunchBreaksTask.id,
                    error:
                      error instanceof Error ? error.message : 'Unknown error',
                  });
                });
            }
          }
        }
      } else if (
        data?.payrollCreateEmployerBreak?.__typename ===
        'Payroll_EmployerBreakError'
      ) {
        const error = data.payrollCreateEmployerBreak;
        dispatch(setCreateError(error.message));
        dispatch(setCreateLoading(false));
        dispatch(
          setPageMessage({
            show: true,
            type: 'error',
            message: error.message,
            code: error.code,
            titleNlsKey:
              error.code === BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS
                ? 'breaks.api.error.BREAK_NAME_ALREADY_EXISTS'
                : 'breaks.api.create.save.error.title',
            descriptionNlsKey: 'breaks.api.save.error.description',
          }),
        );

        // Check if this is a validation error and mark interaction accordingly
        if (isValidationErrorResponse(error)) {
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_CREATE,
          );
          logger.info(
            BREAK_LOGGING_CONSTANTS.VALIDATION_ERRORS
              .CREATE_BREAK_POLICY_VALIDATION_ERROR,
            {
              error: error.message,
              code: error.code,
              isValidationError: true,
            },
          );
        } else if (isDegradedErrorMessage(error.message)) {
          setInteractionDegraded(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_CREATE,
            error.message,
          );

          logger.info(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_POLICY_FAILED,
            {
              error: error.message,
              code: error.code,
              isDegraded: true,
            },
          );
        } else {
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_CREATE,
            error.message,
          );

          logger.error(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_POLICY_FAILED,
            {
              error: error.message,
              code: error.code,
            },
          );
        }
      }
    },
    [
      sandbox,
      dispatch,
      createBreakAssignments,
      logger,
      updateItmTask,
      isOverviewModernisationEnabled,
    ],
  );

  const handleCreateBreaksError = useCallback(
    (error: any) => {
      dispatch(setCreateError(error.message));
      dispatch(setCreateLoading(false));
      dispatch(
        setPageMessage({
          show: true,
          type: 'error',
          message: error.message,
          code: error.code,
          titleNlsKey:
            error.code === BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS
              ? 'breaks.api.error.BREAK_NAME_ALREADY_EXISTS'
              : 'breaks.api.create.save.error.title',
          descriptionNlsKey: 'breaks.api.save.error.description',
        }),
      );

      // Check if this is a validation error and mark interaction accordingly
      if (isValidationErrorResponse(error)) {
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_CREATE,
        );
        logger.info(
          BREAK_LOGGING_CONSTANTS.VALIDATION_ERRORS
            .CREATE_BREAK_POLICY_VALIDATION_ERROR,
          {
            error: error.message,
            code: error.code,
            isValidationError: true,
          },
        );
      } else if (isDegradedErrorMessage(error.message)) {
        setInteractionDegraded(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_CREATE,
          error.message,
        );

        if (error instanceof Error) {
          logger.logException(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_POLICY_FAILED,
            error,
            { isDegraded: true },
          );
        } else {
          logger.info(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_POLICY_FAILED,
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
          TimeCustomerInteraction.BREAK_RULE_CREATE,
          error.message,
        );

        if (error instanceof Error) {
          logger.logException(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_POLICY_FAILED,
            error,
            {},
          );
        } else {
          logger.error(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_POLICY_FAILED,
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

  // Callback handlers for updateEmployerBreak
  const handleUpdateBreaksCompleted = useCallback(
    (
      data: any,
      assignments?: TeamMember[],
      breakRuleInput?: BreakRuleInput,
    ) => {
      if (
        data?.payrollUpdateEmployerBreak?.__typename ===
        'Payroll_UpdateEmployerBreakSuccess'
      ) {
        let callAssignmentsAPI = false;
        const { breakRule } = data.payrollUpdateEmployerBreak;
        if (breakRule) {
          dispatch(updateRule(breakRule as BreakRule));
          dispatch(setUpdateLoading(false));
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_UPDATE,
          );
          dispatch(clearTempAssignments());

          // Create break assignments only if the break rule is NOT a default policy
          // (Default policies apply to all team members, so no individual assignments needed)
          if (
            assignments &&
            assignments.length > 0 &&
            !breakRule.isDefaultPolicy
          ) {
            const breakAssignments = assignments.map((member) => ({
              assigneeId: member.id,
              assignmentType: deriveAssignmentTypeFromWorkerType(member),
              isActive: member.isActive || false,
            }));

            const breakAssignmentInput: Payroll_CreateBreakAssignmentInput = {
              breakPolicyId: breakRule.id,
              breakAssignments,
            };
            createBreakAssignments(breakAssignmentInput);
            callAssignmentsAPI = true;
          }

          if (!callAssignmentsAPI) dispatch(closeDrawer());

          // Refetch break policies after successful update (but not for isActive toggle)
          // Check if this is just an isActive toggle by looking at the breakRuleInput
          // If it only contains isActive field, skip the refetch since local state is already updated
          const isOnlyActiveToggle =
            Object.keys(breakRuleInput || {}).length === 1 &&
            'isActive' in (breakRuleInput || {});

          logger.info(
            BREAK_LOGGING_CONSTANTS.SUCCESS.UPDATE_BREAK_POLICY_SUCCESS,
            {
              breakRuleId: breakRule.id,
              breakRuleName: breakRule.breakName,
              isDefaultPolicy: breakRule.isDefaultPolicy,
              assignmentCount: assignments?.length || 0,
            },
          );
          if (!callAssignmentsAPI && !isOnlyActiveToggle) {
            dispatch(setRefetchBreakPolicies(true));
          }
        }
      } else if (
        data?.payrollUpdateEmployerBreak?.__typename ===
        'Payroll_EmployerBreakError'
      ) {
        const error = data.payrollUpdateEmployerBreak;
        dispatch(setUpdateError(error.message));
        dispatch(setUpdateLoading(false));
        dispatch(
          setPageMessage({
            show: true,
            type: 'error',
            message: error.message,
            code: error.code,
            titleNlsKey:
              error.code === BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS
                ? 'breaks.api.error.BREAK_NAME_ALREADY_EXISTS'
                : 'breaks.api.save.error.title',
            descriptionNlsKey: 'breaks.api.save.error.description',
          }),
        );

        // Check if this is a validation error and mark interaction accordingly
        if (isValidationErrorResponse(error)) {
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_UPDATE,
          );
          logger.info(
            BREAK_LOGGING_CONSTANTS.VALIDATION_ERRORS
              .UPDATE_BREAK_POLICY_VALIDATION_ERROR,
            {
              error: error.message,
              code: error.code,
              isValidationError: true,
            },
          );
        } else if (isDegradedErrorMessage(error.message)) {
          setInteractionDegraded(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_UPDATE,
            error.message,
          );

          logger.info(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.UPDATE_BREAK_POLICY_FAILED,
            {
              error: error.message,
              code: error.code,
              response: data,
              isDegraded: true,
            },
          );
        } else {
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_UPDATE,
            error.message,
          );

          logger.error(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.UPDATE_BREAK_POLICY_FAILED,
            {
              error: error.message,
              code: error.code,
              response: data,
            },
          );
        }
      }
    },
    [sandbox, dispatch, createBreakAssignments, logger],
  );

  const handleUpdateBreaksError = useCallback(
    (error: any) => {
      dispatch(setUpdateError(error.message));
      dispatch(setUpdateLoading(false));
      dispatch(
        setPageMessage({
          show: true,
          type: 'error',
          message: error.message,
          code: error.code,
          titleNlsKey:
            error.code === BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS
              ? 'breaks.api.error.BREAK_NAME_ALREADY_EXISTS'
              : 'breaks.api.save.error.title',
          descriptionNlsKey: 'breaks.api.save.error.description',
        }),
      );

      // Check if this is a validation error and mark interaction accordingly
      if (isValidationErrorResponse(error)) {
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_UPDATE,
        );
        logger.info(
          BREAK_LOGGING_CONSTANTS.VALIDATION_ERRORS
            .UPDATE_BREAK_POLICY_VALIDATION_ERROR,
          {
            error: error.message,
            code: error.code,
            isValidationError: true,
          },
        );
      } else if (isDegradedErrorMessage(error.message)) {
        setInteractionDegraded(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_UPDATE,
          error.message,
        );

        if (error instanceof Error) {
          logger.logException(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.UPDATE_BREAK_POLICY_FAILED,
            error,
            { isDegraded: true },
          );
        } else {
          logger.info(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.UPDATE_BREAK_POLICY_FAILED,
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
          TimeCustomerInteraction.BREAK_RULE_UPDATE,
          error.message,
        );

        if (error instanceof Error) {
          logger.logException(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.UPDATE_BREAK_POLICY_FAILED,
            error,
            {},
          );
        } else {
          logger.error(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.UPDATE_BREAK_POLICY_FAILED,
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

  const getAllBreaksPolicies = useCallback(async () => {
    createCustomerInteraction(sandbox, TimeCustomerInteraction.BREAK_RULE_READ);
    dispatch(setLoading(true));
    getAllBreaks({
      context: {
        clientName: ApolloClientNames.OIGQL,
        headers: getCustomerInteractionPropagationHeaders(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_READ,
        ),
      },
      onCompleted: handleGetAllBreaksCompleted,
      onError: handleGetAllBreaksError,
    });
  }, [
    getAllBreaks,
    sandbox,
    dispatch,
    handleGetAllBreaksCompleted,
    handleGetAllBreaksError,
  ]);

  const getBreaksByAssigneeId = useCallback(
    async (
      assigneeId: string,
      isActive?: boolean,
      includeDeleted?: boolean,
    ) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
      );
      dispatch(setBreaksByAssigneeLoading({ assigneeId, loading: true }));
      getBreaksByAssignee({
        variables: {
          filter: {
            assigneeId,
            isActive,
            includeDeleted,
          },
        },
        context: {
          clientName: ApolloClientNames.OIGQL,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
          ),
        },
        onCompleted: (data) =>
          handleGetBreaksByAssigneeCompleted(data, assigneeId),
        onError: (error) => handleGetBreaksByAssigneeError(error, assigneeId),
      });
    },
    [
      getBreaksByAssignee,
      sandbox,
      dispatch,
      handleGetBreaksByAssigneeCompleted,
      handleGetBreaksByAssigneeError,
    ],
  );

  // Callback handlers for deleteEmployerBreak
  const handleDeleteBreaksCompleted = useCallback(
    (data: any, breakId: string) => {
      if (
        data?.payrollDeleteEmployerBreak?.__typename ===
        'Payroll_DeleteEmployerBreakSuccess'
      ) {
        dispatch(setDeleteModalOpen(false));
        // dispatch(setBreakToDelete(null));
        dispatch(removeRule(breakId));
        dispatch(setDeleteLoading(false));
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.BREAK_RULE_DELETE,
        );

        logger.info(
          BREAK_LOGGING_CONSTANTS.SUCCESS.DELETE_BREAK_POLICY_SUCCESS,
          {
            breakId,
          },
        );
      } else if (
        data?.payrollDeleteEmployerBreak?.__typename ===
        'Payroll_EmployerBreakError'
      ) {
        const error = data.payrollDeleteEmployerBreak;
        dispatch(setDeleteError(error.message));
        dispatch(setDeleteLoading(false));
        dispatch(
          setPageMessage({
            show: true,
            type: 'error',
            message: error.message,
            code: error.code,
            titleNlsKey:
              error.code === BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS
                ? 'breaks.api.error.BREAK_NAME_ALREADY_EXISTS'
                : 'breaks.api.save.error.title',
            descriptionNlsKey: 'breaks.api.save.error.description',
          }),
        );

        // Check if this is a validation error and mark interaction accordingly
        if (isValidationErrorResponse(error)) {
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_DELETE,
          );
          logger.info(
            BREAK_LOGGING_CONSTANTS.VALIDATION_ERRORS
              .DELETE_BREAK_POLICY_VALIDATION_ERROR,
            {
              breakId,
              error: error.message,
              code: error.code,
              isValidationError: true,
            },
          );
        } else if (isDegradedErrorMessage(error.message)) {
          setInteractionDegraded(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_DELETE,
            error.message,
          );

          logger.info(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.DELETE_BREAK_POLICY_FAILED,
            {
              breakId,
              error: error.message,
              code: error.code,
              response: data,
              isDegraded: true,
            },
          );
        } else {
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_DELETE,
            error.message,
          );

          logger.error(
            BREAK_LOGGING_CONSTANTS.API_ERRORS.DELETE_BREAK_POLICY_FAILED,
            {
              breakId,
              error: error.message,
              code: error.code,
              response: data,
            },
          );
        }
      }
    },
    [sandbox, dispatch, logger],
  );

  const deleteBreaksPolicy = useCallback(
    async (breakId: string) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.BREAK_RULE_DELETE,
      );
      dispatch(setDeleteLoading(true));
      dispatch(setDeleteError(null));
      deleteEmployerBreak({
        variables: {
          input: {
            id: breakId,
          },
        },
        context: {
          clientName: ApolloClientNames.OIGQL,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_DELETE,
          ),
        },
        onCompleted: (data) => handleDeleteBreaksCompleted(data, breakId),
        onError: handleDeleteBreaksError,
      });
    },
    [
      deleteEmployerBreak,
      sandbox,
      dispatch,
      handleDeleteBreaksCompleted,
      handleDeleteBreaksError,
    ],
  );

  const createBreaksPolicy = useCallback(
    async (
      breakRuleInput: Payroll_EmployerBreakInput,
      assignments?: TeamMember[],
    ) => {
      // Check if assigned team members is less than total team members
      const assignedTeamMembersCount =
        assignments?.filter((assignment) => assignment.isActive).length ||
        teamMembers.length;
      const totalTeamMembersCount = teamMembers.length;
      const shouldSetAsDefaultPolicy =
        assignedTeamMembersCount >= totalTeamMembersCount;

      // Update the break rule input with the correct isDefaultPolicy value
      const updatedBreakRuleInput = {
        ...breakRuleInput,
        isDefaultPolicy: shouldSetAsDefaultPolicy,
      };

      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.BREAK_RULE_CREATE,
      );
      dispatch(setCreateLoading(true));
      dispatch(setCreateError(null));
      createEmployerBreak({
        variables: {
          input: {
            breakRule: updatedBreakRuleInput,
          },
        },
        context: {
          clientName: ApolloClientNames.OIGQL,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_CREATE,
          ),
        },
        onCompleted: (data) => handleCreateBreaksCompleted(data, assignments),
        onError: handleCreateBreaksError,
      });
    },
    [
      createEmployerBreak,
      sandbox,
      dispatch,
      handleCreateBreaksCompleted,
      handleCreateBreaksError,
      teamMembers,
    ],
  );

  const updateBreaksPolicy = useCallback(
    async (
      breakId: string,
      breakRuleInput: BreakRuleInput,
      assignments?: TeamMember[],
      sparse: boolean = true,
    ) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.BREAK_RULE_UPDATE,
      );
      dispatch(setUpdateLoading(true));
      dispatch(setUpdateError(null));
      updateEmployerBreak({
        variables: {
          input: {
            id: breakId,
            breakRule: {
              ...breakRuleInput,
              isDefaultPolicy:
                assignments &&
                assignments.filter((assignment) => assignment.isActive)
                  .length >= teamMembers.length,
            },
            sparse,
          },
        },
        context: {
          clientName: ApolloClientNames.OIGQL,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.BREAK_RULE_UPDATE,
          ),
        },
        onCompleted: (data) =>
          handleUpdateBreaksCompleted(data, assignments, breakRuleInput),
        onError: handleUpdateBreaksError,
      });
    },
    [
      updateEmployerBreak,
      sandbox,
      dispatch,
      handleUpdateBreaksCompleted,
      handleUpdateBreaksError,
      teamMembers,
    ],
  );

  return {
    getAllBreaksPolicies,
    getBreaksByAssigneeId,
    deleteBreaksPolicy,
    createBreaksPolicy,
    updateBreaksPolicy,
  };
}
