import { useCallback } from 'react';
import { useSandbox, useIntl } from '@payroll/quicksand';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  setInteractionDegraded,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  CREATE_OVERTIME_POLICY,
  UPDATE_OVERTIME_POLICY,
  DELETE_OVERTIME_POLICY,
  MANAGE_OVERTIME_POLICY_ASSIGNMENTS,
} from '../queries/overtimeQueries';
import {
  updatePolicy,
  removePolicy,
  setCreatingPolicy,
  setCreatePolicyError,
  setUpdatingPolicy,
  setUpdatePolicyError,
  setDeletingPolicy,
  setDeletePolicyError,
  setManagingAssignments,
  setAssignmentsError,
  setShowDeleteModal,
  setShowWizard,
  setRefetchPolicies,
  selectIsCreatingPolicy,
  selectIsUpdatingPolicy,
  selectIsDeletingPolicy,
  selectIsManagingAssignments,
  selectCreatePolicyError,
  selectUpdatePolicyError,
  selectDeletePolicyError,
  selectAssignmentsError,
  selectPolicyToDelete,
  selectShowDeleteModal,
} from '../store';
import { OVERTIME_LOGGING } from '../constants/overtimeLoggingConstants';
import type {
  CreateOvertimePolicyInput,
  CreateOvertimePolicyResponse,
  UpdateOvertimePolicyInput,
  UpdateOvertimePolicyResponse,
  DeleteOvertimePolicyInput,
  DeleteOvertimePolicyResponse,
  ManageOvertimePolicyAssignmentsInput,
  ManageOvertimePolicyAssignmentsResponse,
  OvertimePolicy,
} from '../types/Overtime.types';
import {
  isUserOverridePolicy,
  getUserIdFromPolicyId,
  BASIC_POLICY_ID,
} from '../utils/overtimeMutationUtils';
import {
  OVERTIME_DEGRADED_STATUS_CODES,
  getOvertimeStatusCodeMessage,
} from '../constants/overtimeValidationConstants';

/**
 * Result interface for mutation operations
 */
interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Return type for useOvertimeMutations hook
 */
export type UseOvertimeMutationsResult = ReturnType<
  typeof useOvertimeMutations
>;

/**
 * Hook for overtime policy CRUD operations via GraphQL mutations
 * Handles customer interactions, error handling, and Redux state updates
 */
export const useOvertimeMutations = () => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const logger = useLoggingConfig();
  const dispatch = useAppDispatch();

  // Selectors for mutation states
  const isCreatingPolicy = useAppSelector(selectIsCreatingPolicy);
  const isUpdatingPolicy = useAppSelector(selectIsUpdatingPolicy);
  const isDeletingPolicy = useAppSelector(selectIsDeletingPolicy);
  const isManagingAssignments = useAppSelector(selectIsManagingAssignments);
  const createPolicyError = useAppSelector(selectCreatePolicyError);
  const updatePolicyError = useAppSelector(selectUpdatePolicyError);
  const deletePolicyError = useAppSelector(selectDeletePolicyError);
  const assignmentsError = useAppSelector(selectAssignmentsError);
  const policyToDelete = useAppSelector(selectPolicyToDelete);
  const showDeleteModal = useAppSelector(selectShowDeleteModal);

  /**
   * Create a new overtime policy
   */
  const createOvertimePolicy = useCallback(
    async (
      input: CreateOvertimePolicyInput,
    ): Promise<MutationResult<OvertimePolicy>> => {
      const interactionType = TimeCustomerInteraction.OVERTIME_POLICY_CREATE;
      createCustomerInteraction(sandbox, interactionType);
      dispatch(setCreatingPolicy(true));

      logger.info(OVERTIME_LOGGING.WIZARD_SUBMIT_CREATE_STARTED, {
        policyName: input.name,
        rulesCount: input.rules?.length ?? 0,
      });

      let errorMessageFromResponse = '';
      try {
        const client = getApolloClientInstance(sandbox);
        if (!client) {
          logger.error(OVERTIME_LOGGING.APOLLO_CLIENT_NOT_INITIALIZED);
          throw new Error('Apollo client not initialized');
        }

        const result = await client.mutate<CreateOvertimePolicyResponse>({
          mutation: CREATE_OVERTIME_POLICY,
          variables: { input },
          context: {
            clientName: ApolloClientNames.TSHEETS,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              interactionType,
            ),
          },
        });

        const response = result.data;

        // Check for GraphQL errors at the result level
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }

        const policy = response?.createOvertimePolicy?.policy;

        if (policy) {
          dispatch(setCreatingPolicy(false));
          dispatch(setShowWizard(false));
          endInteractionWithSuccess(sandbox, interactionType);

          logger.info(OVERTIME_LOGGING.API_CREATE_POLICY_SUCCESS, {
            policyId: policy.id,
            policyName: policy.name,
          });

          return { success: true, data: policy };
        }

        const createStatusCode = String(
          response?.createOvertimePolicy?.status?.statusCode ?? '',
        );

        errorMessageFromResponse =
          response?.createOvertimePolicy?.status?.message ?? '';

        if (OVERTIME_DEGRADED_STATUS_CODES.has(createStatusCode)) {
          const msgDescriptor = getOvertimeStatusCodeMessage(createStatusCode);
          const degradedMessage = msgDescriptor.defaultMessage;
          dispatch(setCreatingPolicy(false));
          dispatch(setCreatePolicyError(degradedMessage));
          setInteractionDegraded(sandbox, interactionType, createStatusCode);
          logger.warn(OVERTIME_LOGGING.API_CREATE_POLICY_DEGRADED, {
            statusCode: createStatusCode,
            error: degradedMessage,
          });
          return { success: false, error: degradedMessage };
        }

        throw new Error(
          intl.formatMessage({
            id: 'overtime.api.error.generic',
            defaultMessage: 'Something went wrong. Please try again.',
          }),
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        dispatch(setCreatingPolicy(false));
        dispatch(setCreatePolicyError(errorMessage));
        endInteractionWithFailure(sandbox, interactionType, errorMessage);

        logger.error(OVERTIME_LOGGING.API_CREATE_POLICY_FAILED, {
          error: errorMessageFromResponse || errorMessage,
        });

        return { success: false, error: errorMessage };
      }
    },
    [sandbox, intl, logger, dispatch],
  );

  /**
   * Update an existing overtime policy
   */
  const updateOvertimePolicy = useCallback(
    async (
      policyId: string,
      input: UpdateOvertimePolicyInput,
    ): Promise<MutationResult<OvertimePolicy>> => {
      const interactionType = TimeCustomerInteraction.OVERTIME_POLICY_UPDATE;
      createCustomerInteraction(sandbox, interactionType);
      dispatch(setUpdatingPolicy(true));

      logger.info(OVERTIME_LOGGING.WIZARD_SUBMIT_UPDATE_STARTED, {
        policyId,
        policyName: input.name,
      });

      let errorMessageFromResponse = '';
      try {
        const client = getApolloClientInstance(sandbox);
        if (!client) {
          logger.error(OVERTIME_LOGGING.APOLLO_CLIENT_NOT_INITIALIZED);
          throw new Error('Apollo client not initialized');
        }

        // If the policy is a user override, send 'basic' as the ID and pass
        // the user ID in input.userId (mutates input in place).
        let inputPolicyId = policyId;
        if (isUserOverridePolicy(policyId)) {
          inputPolicyId = BASIC_POLICY_ID;
          input.userId = getUserIdFromPolicyId(policyId);
        }

        const result = await client.mutate<UpdateOvertimePolicyResponse>({
          mutation: UPDATE_OVERTIME_POLICY,
          variables: { id: inputPolicyId, input },
          context: {
            clientName: ApolloClientNames.TSHEETS,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              interactionType,
            ),
          },
        });

        const response = result.data;

        // Check for GraphQL errors at the result level
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }

        const policy = response?.updateOvertimePolicy?.policy;

        if (policy) {
          dispatch(updatePolicy(policy));
          dispatch(setUpdatingPolicy(false));
          dispatch(setShowWizard(false));
          endInteractionWithSuccess(sandbox, interactionType);

          logger.info(OVERTIME_LOGGING.API_UPDATE_POLICY_SUCCESS, {
            policyId: policy.id,
            policyName: policy.name,
          });

          return { success: true, data: policy };
        }

        const updateStatusCode = String(
          response?.updateOvertimePolicy?.status?.statusCode ?? '',
        );

        errorMessageFromResponse =
          response?.updateOvertimePolicy?.status?.message ?? '';

        if (OVERTIME_DEGRADED_STATUS_CODES.has(updateStatusCode)) {
          const msgDescriptor = getOvertimeStatusCodeMessage(updateStatusCode);
          const degradedMessage = msgDescriptor.defaultMessage;
          dispatch(setUpdatingPolicy(false));
          dispatch(setUpdatePolicyError(degradedMessage));
          setInteractionDegraded(sandbox, interactionType, updateStatusCode);
          logger.warn(OVERTIME_LOGGING.API_UPDATE_POLICY_DEGRADED, {
            policyId,
            statusCode: updateStatusCode,
            error: degradedMessage,
          });
          return { success: false, error: degradedMessage };
        }

        throw new Error(
          intl.formatMessage({
            id: 'overtime.api.error.generic',
            defaultMessage: 'Something went wrong. Please try again.',
          }),
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        dispatch(setUpdatingPolicy(false));
        dispatch(setUpdatePolicyError(errorMessage));
        endInteractionWithFailure(sandbox, interactionType, errorMessage);

        logger.error(OVERTIME_LOGGING.API_UPDATE_POLICY_FAILED, {
          policyId,
          error: errorMessageFromResponse || errorMessage,
        });

        return { success: false, error: errorMessage };
      }
    },
    [sandbox, intl, logger, dispatch],
  );

  /**
   * Delete an overtime policy
   */
  const deleteOvertimePolicy = useCallback(
    async (
      policyId: string,
      input: DeleteOvertimePolicyInput = {},
    ): Promise<MutationResult<string>> => {
      const interactionType = TimeCustomerInteraction.OVERTIME_POLICY_DELETE;
      createCustomerInteraction(sandbox, interactionType);
      dispatch(setDeletingPolicy(true));

      logger.info(OVERTIME_LOGGING.DELETE_MODAL_CONFIRMED, {
        policyId,
      });

      let errorMessageFromResponse = '';
      try {
        const client = getApolloClientInstance(sandbox);
        if (!client) {
          logger.error(OVERTIME_LOGGING.APOLLO_CLIENT_NOT_INITIALIZED);
          throw new Error('Apollo client not initialized');
        }

        const result = await client.mutate<DeleteOvertimePolicyResponse>({
          mutation: DELETE_OVERTIME_POLICY,
          variables: { id: policyId, clientMutationId: input.clientMutationId },
          context: {
            clientName: ApolloClientNames.TSHEETS,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              interactionType,
            ),
          },
        });

        const response = result.data;

        // Check for GraphQL errors at the result level
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }

        const deletedPolicyId = response?.deleteOvertimePolicy?.deletedPolicyId;

        if (deletedPolicyId) {
          dispatch(removePolicy(deletedPolicyId));
          dispatch(setDeletingPolicy(false));
          dispatch(setShowDeleteModal(false));
          // Trigger refetch to update pagination info (totalCount) after deletion
          dispatch(setRefetchPolicies(true));
          endInteractionWithSuccess(sandbox, interactionType);

          logger.info(OVERTIME_LOGGING.API_DELETE_POLICY_SUCCESS, {
            policyId: deletedPolicyId,
          });

          return { success: true, data: deletedPolicyId };
        }

        const deleteStatusCode = String(
          response?.deleteOvertimePolicy?.status?.statusCode ?? '',
        );

        errorMessageFromResponse =
          response?.deleteOvertimePolicy?.status?.message ?? '';

        if (OVERTIME_DEGRADED_STATUS_CODES.has(deleteStatusCode)) {
          const msgDescriptor = getOvertimeStatusCodeMessage(deleteStatusCode);
          const degradedMessage = msgDescriptor.defaultMessage;
          dispatch(setDeletingPolicy(false));
          dispatch(setDeletePolicyError(degradedMessage));
          setInteractionDegraded(sandbox, interactionType, deleteStatusCode);
          logger.warn(OVERTIME_LOGGING.API_DELETE_POLICY_DEGRADED, {
            policyId,
            statusCode: deleteStatusCode,
            error: degradedMessage,
          });
          return { success: false, error: degradedMessage };
        }

        throw new Error(
          intl.formatMessage({
            id: 'overtime.api.error.generic',
            defaultMessage: 'Something went wrong. Please try again.',
          }),
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        dispatch(setDeletingPolicy(false));
        dispatch(setDeletePolicyError(errorMessage));
        endInteractionWithFailure(sandbox, interactionType, errorMessage);

        logger.error(OVERTIME_LOGGING.API_DELETE_POLICY_FAILED, {
          error: errorMessageFromResponse || errorMessage,
        });

        return { success: false, error: errorMessage };
      }
    },
    [sandbox, intl, logger, dispatch],
  );

  /**
   * Manage overtime policy assignments (assign/unassign users and groups)
   */
  const manageOvertimePolicyAssignments = useCallback(
    async (
      policyId: string,
      input: ManageOvertimePolicyAssignmentsInput,
    ): Promise<MutationResult<OvertimePolicy>> => {
      const interactionType =
        TimeCustomerInteraction.OVERTIME_POLICY_ASSIGNMENT_MANAGE;
      createCustomerInteraction(sandbox, interactionType);
      dispatch(setManagingAssignments(true));

      logger.info(OVERTIME_LOGGING.WIZARD_ASSIGNMENTS_STARTED, {
        policyId,
        assignUserIds: input.assign?.userIds?.length ?? 0,
        assignGroupIds: input.assign?.groupIds?.length ?? 0,
        unassignUserIds: input.unassign?.userIds?.length ?? 0,
        unassignGroupIds: input.unassign?.groupIds?.length ?? 0,
      });

      let errorMessageFromResponse = '';
      try {
        const client = getApolloClientInstance(sandbox);
        if (!client) {
          logger.error(OVERTIME_LOGGING.APOLLO_CLIENT_NOT_INITIALIZED);
          throw new Error('Apollo client not initialized');
        }

        const result =
          await client.mutate<ManageOvertimePolicyAssignmentsResponse>({
            mutation: MANAGE_OVERTIME_POLICY_ASSIGNMENTS,
            variables: { policyId, input },
            context: {
              clientName: ApolloClientNames.TSHEETS,
              headers: getCustomerInteractionPropagationHeaders(
                sandbox,
                interactionType,
              ),
            },
          });

        const response = result.data;

        // Check for GraphQL errors at the result level
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }

        const policy = response?.manageOvertimePolicyAssignments?.policy;

        if (policy) {
          dispatch(updatePolicy(policy));
          dispatch(setManagingAssignments(false));
          endInteractionWithSuccess(sandbox, interactionType);

          logger.info(OVERTIME_LOGGING.API_MANAGE_ASSIGNMENTS_SUCCESS, {
            policyId: policy.id,
            assignmentsCount: policy.assignments?.values?.length ?? 0,
          });

          return { success: true, data: policy };
        }

        errorMessageFromResponse =
          response?.manageOvertimePolicyAssignments?.status?.message ?? '';

        throw new Error(
          intl.formatMessage({
            id: 'overtime.api.error.generic',
            defaultMessage: 'Something went wrong. Please try again.',
          }),
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        dispatch(setManagingAssignments(false));
        dispatch(setAssignmentsError(errorMessage));
        endInteractionWithFailure(sandbox, interactionType, errorMessage);

        logger.error(OVERTIME_LOGGING.API_MANAGE_ASSIGNMENTS_FAILED, {
          error: errorMessageFromResponse || errorMessage,
        });

        return { success: false, error: errorMessage };
      }
    },
    [sandbox, intl, logger, dispatch],
  );

  return {
    // Mutation functions
    createOvertimePolicy,
    updateOvertimePolicy,
    deleteOvertimePolicy,
    manageOvertimePolicyAssignments,

    // Mutation states
    isCreatingPolicy,
    isUpdatingPolicy,
    isDeletingPolicy,
    isManagingAssignments,

    // Error states
    createPolicyError,
    updatePolicyError,
    deletePolicyError,
    assignmentsError,

    // Delete modal state
    policyToDelete,
    showDeleteModal,
  };
};
