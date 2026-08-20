import { useCallback, useState } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import {
  useGetEmployerBreaksByAssigneeLazyQuery,
  Payroll_EmployerBreak,
  Payroll_Break,
} from 'src/__generated__/oigql/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

/**
 * Break rule interface for consumer use
 */
export interface BreakRule {
  id: string;
  breakName: string;
  breakType: Payroll_Break;
  breakDuration?: number | null;
  durationUnit?: string | null;
  isActive: boolean;
  isDefaultPolicy: boolean;
  allowAuto: boolean;
  allowManual: boolean;
  noSetDuration: boolean;
}

export interface UseGetWorkerBreaksArgs {
  /** Optional callback when breaks are successfully fetched */
  onSuccess?: (breaks: BreakRule[]) => void;
  /** Optional callback when fetch fails */
  onError?: (error: string) => void;
}

export interface LoadWorkerBreaksArgs {
  assigneeId: string;
  isActive?: boolean;
}

export interface UseGetWorkerBreaksResult {
  breaks: BreakRule[];
  loading: boolean;
  error?: string;
  loadWorkerBreaks: (args: LoadWorkerBreaksArgs) => Promise<void>;
}

/**
 * Hook to fetch break rules for a specific worker (assignee)
 * Reusable across widgets - uses Apollo's built-in state management
 *
 * Callbacks are passed at hook initialization (following useManageCustomFieldAssignment pattern)
 *
 * @example
 * const { loadWorkerBreaks, loading } = useGetWorkerBreaks({
 *   onSuccess: (breaks) => dispatch(setBreaks(breaks)),
 *   onError: (error) => dispatch(setBreaksError(error)),
 * });
 *
 * loadWorkerBreaks({ assigneeId: workerId, isActive: true });
 */
export const useGetWorkerBreaks = ({
  onSuccess,
  onError,
}: UseGetWorkerBreaksArgs = {}): UseGetWorkerBreaksResult => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const [breaks, setBreaks] = useState<BreakRule[]>([]);

  const handleSuccess = (breakRules: BreakRule[]) => {
    setBreaks(breakRules);

    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
    );
    sandbox.logger.info('Successfully fetched worker breaks', {
      breakCount: breakRules.length,
    });

    onSuccess?.(breakRules);
  };

  const handleError = (err: any) => {
    const errorMessage = mapError({
      sourceComponent: 'useGetWorkerBreaks',
      sandbox,
      intl,
      error: err,
    });

    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
      err.message,
    );
    sandbox.logger.error('Failed to fetch worker breaks', {
      error: err.message,
    });

    onError?.(errorMessage ?? 'Unknown error');
  };

  const [loadQuery, { loading, error }] =
    useGetEmployerBreaksByAssigneeLazyQuery({
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        if (data?.payrollEmployerBreaksByAssigneeId?.nodes) {
          const breakRules: BreakRule[] =
            data.payrollEmployerBreaksByAssigneeId.nodes.map(
              (node: Payroll_EmployerBreak) => ({
                id: node.id,
                breakName: node.breakName,
                breakType: node.breakType,
                breakDuration: node.breakDuration,
                durationUnit: node.durationUnit,
                isActive: node.isActive,
                isDefaultPolicy: node.isDefaultPolicy,
                allowAuto: node.allowAuto,
                allowManual: node.allowManual,
                noSetDuration: node.noSetDuration,
              }),
            );
          handleSuccess(breakRules);
        }
      },
      onError: handleError,
    });

  const loadWorkerBreaks = useCallback(
    async ({ assigneeId, isActive }: LoadWorkerBreaksArgs): Promise<void> => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
      );
      await loadQuery({
        variables: {
          filter: {
            assigneeId,
            isActive,
          },
        },
        context: {
          clientName: ApolloClientNames.OIGQL,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
          ),
        },
      });
    },
    [sandbox, loadQuery],
  );

  return {
    breaks,
    loading,
    error: error
      ? mapError({
          sourceComponent: 'useGetWorkerBreaks',
          sandbox,
          intl,
          error,
        })
      : undefined,
    loadWorkerBreaks,
  };
};

export default useGetWorkerBreaks;
