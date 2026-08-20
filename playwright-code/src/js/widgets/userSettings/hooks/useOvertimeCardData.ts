import { useEffect, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { GET_OVERTIME_POLICIES } from 'src/js/widgets/qbtOrchestrator/features/overtime/queries/overtimeQueries';
import { OvertimePolicy } from 'src/js/widgets/qbtOrchestrator/features/overtime/types/Overtime.types';
import { USER_SETTINGS_OVERTIME_LOGGING } from '../constants/loggingConstants';
import { useAppDispatch } from '../store';
import {
  setOvertimePolicy,
  setOvertimeLoading,
  setOvertimeError,
  resetOvertimeState,
} from '../store/slices/overtimeSlice';

interface OvertimePoliciesResponse {
  overtimePolicies: {
    values: OvertimePolicy[];
  };
}

/**
 * Hook to fetch and sync overtime policy data for the OvertimeCard component.
 *
 * Fetches GET_OVERTIME_POLICIES filtered by userId and syncs the first result
 * (the worker's effective policy) to Redux for VIEW/EDIT modes.
 *
 * @param assignedToUserId - The worker ID to filter policies by. Pass undefined to skip fetch.
 */
export const useOvertimeCardData = (assignedToUserId: string | undefined) => {
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();
  const logger = useLoggingConfig();
  // Sentinel ensures reset fires on mount (handles widget remount with stale Redux).
  // Also fires on prop change within the same instance (admin switches user without remount).
  const prevIdRef = useRef<string | undefined | null>(null);
  useEffect(() => {
    if (prevIdRef.current !== assignedToUserId) {
      prevIdRef.current = assignedToUserId;
      dispatch(resetOvertimeState());
    }
  }, [assignedToUserId, dispatch]);

  useEffect(() => {
    if (!assignedToUserId) {
      return undefined;
    }

    let cancelled = false;

    const fetchOvertimePolicy = async () => {
      const interactionType = TimeCustomerInteraction.USER_OVERTIME_POLICY_READ;
      createCustomerInteraction(sandbox, interactionType);
      logger.info(USER_SETTINGS_OVERTIME_LOGGING.FETCH_POLICY_REQUESTED, {
        workerId: assignedToUserId,
      });

      dispatch(setOvertimeLoading(true));

      try {
        const client = getApolloClientInstance(sandbox);
        if (!client) {
          logger.error(
            USER_SETTINGS_OVERTIME_LOGGING.APOLLO_CLIENT_NOT_INITIALIZED,
          );
          throw new Error('Apollo client not initialized');
        }

        const result = await client.query<OvertimePoliciesResponse>({
          query: GET_OVERTIME_POLICIES,
          variables: {
            filter: { assignedToUserId },
          },
          context: {
            clientName: ApolloClientNames.TSHEETS,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              interactionType,
            ),
          },
          fetchPolicy: 'network-only',
        });

        if (result.errors?.length) {
          const errMsg = result.errors.map((e) => e.message).join('; ');
          throw new Error(errMsg);
        }

        const policies = result.data?.overtimePolicies?.values ?? [];
        const policy = policies[0] ?? null;

        if (!cancelled) {
          logger.info(USER_SETTINGS_OVERTIME_LOGGING.FETCH_POLICY_SUCCESS, {
            workerId: assignedToUserId,
            hasPolicyAssigned: !!policy,
          });
          dispatch(setOvertimePolicy(policy));
        }
        endInteractionWithSuccess(sandbox, interactionType);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        endInteractionWithFailure(sandbox, interactionType, message, err);
        if (!cancelled) {
          logger.error(USER_SETTINGS_OVERTIME_LOGGING.FETCH_POLICY_FAILED, {
            workerId: assignedToUserId,
            error: message,
          });
          dispatch(setOvertimeError(message));
        }
      } finally {
        if (!cancelled) {
          dispatch(setOvertimeLoading(false));
        }
      }
    };

    fetchOvertimePolicy();

    // logger is stable from LoggingConfigProvider (memoized)
    return () => {
      cancelled = true;
    };
  }, [assignedToUserId, dispatch, sandbox, logger]);
};

export default useOvertimeCardData;
