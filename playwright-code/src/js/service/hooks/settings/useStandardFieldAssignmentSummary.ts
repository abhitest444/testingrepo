import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';

import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  getCustomerInteractionPropagationHeaders,
  createCustomerInteraction,
  endInteractionWithSuccess,
  setInteractionDegraded,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  useTimeTrackingStandardFieldAssignmentSummaryLazyQuery,
  TimeTracking_StandardFieldAssignmentSummary,
  TimeTrackingStandardFieldAssignmentSummaryQuery as TimeTrackingStandardFieldAssignmentSummaryQuery_Query,
} from 'src/__generated__/timeTracking/graphql';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';

interface UseStandardFieldAssignmentSummaryResult {
  loading: boolean;
  data: TimeTracking_StandardFieldAssignmentSummary[];
  error: string | null;
  refetch: () => Promise<void>;
  totalTimeAgainstAssignments: number;
}

/**
 * Hook to fetch standard field assignment summary data
 *
 * This hook handles:
 * - Fetching standard field assignment summaries with customer count per field
 * - Error handling and logging
 * - Loading state management
 * - Customer interaction tracking
 *
 * @returns Object containing assignment summaries, loading state, total count, and any error
 *
 * @example
 * ```tsx
 * const { data, loading, error, totalTimeAgainstAssignments } = useStandardFieldAssignmentSummary();
 * ```
 */
export const useStandardFieldAssignmentSummary =
  (): UseStandardFieldAssignmentSummaryResult => {
    const sandbox = useSandbox();
    const [localData, setLocalData] = useState<
      TimeTracking_StandardFieldAssignmentSummary[]
    >([]);
    const [totalAssignments, setTotalAssignments] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    // Feature flag check - IXP check happens only once due to useIXPFeatureFlag implementation
    const { isEnabled: isAssignmentsEnabled } = useIXPFeatureFlag({
      flagName: FEATURE_FLAGS.SBSEG_QBO_R4_ASSIGNMENTS,
      defaultValue: false,
      checkIESMasterFlag: true,
      excludePayrollFirst: true,
    });

    const [fetchAssignmentSummary, { loading }] =
      useTimeTrackingStandardFieldAssignmentSummaryLazyQuery({
        context: { clientName: ApolloClientNames.TIME_TRACKING },
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'cache-and-network',
      });

    const handleSuccess = useCallback(
      (
        result:
          | TimeTrackingStandardFieldAssignmentSummaryQuery_Query
          | undefined,
      ) => {
        sandbox.logger.info(
          'Component=useStandardFieldAssignmentSummary Event=Successfully fetched standard field assignment summary',
        );
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_SUMMARY_READ,
        );

        const summaries =
          result?.timeTrackingStandardFieldAssignmentSummary?.edges?.map(
            (edge) => edge.node,
          ) || [];
        const total =
          result?.timeTrackingStandardFieldAssignmentSummary
            ?.totalTimeAgainstAssignments || 0;

        setLocalData(summaries);
        setTotalAssignments(total);
        setError(null);
      },
      [sandbox],
    );

    const handleFailure = useCallback(
      (error: any) => {
        if (error) {
          sandbox.logger.error(
            'Component=useStandardFieldAssignmentSummary Event=Error fetching standard field assignment summary',
            {
              error: error.message,
            },
          );
          setError(error.message);
          setInteractionDegraded(
            sandbox,
            TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_SUMMARY_READ,
            error.message,
          );
        }
      },
      [sandbox],
    );

    const refetch = useCallback(async () => {
      // Don't make API calls if feature flag is disabled
      if (!isAssignmentsEnabled) {
        return;
      }

      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_SUMMARY_READ,
      );

      try {
        const result = await fetchAssignmentSummary({
          variables: {
            first: 20, // Default as mentioned in requirements - API has max 20 and default 20
          },
          context: {
            clientName: ApolloClientNames.TIME_TRACKING,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_SUMMARY_READ,
            ),
          },
          fetchPolicy: 'cache-and-network',
        });

        if (result.error) {
          handleFailure(result.error);
        } else {
          handleSuccess(result.data);
        }
      } catch (err) {
        handleFailure(err);
      }
    }, [
      fetchAssignmentSummary,
      handleFailure,
      handleSuccess,
      sandbox,
      isAssignmentsEnabled,
    ]);

    // Separate effect to fetch data when feature flag is enabled
    useEffect(() => {
      if (isAssignmentsEnabled) {
        // Call the fetch function directly instead of refetch to avoid dependency issues
        const fetchData = async () => {
          createCustomerInteraction(
            sandbox,
            TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_SUMMARY_READ,
          );

          try {
            const result = await fetchAssignmentSummary({
              variables: {
                first: 20,
              },
              context: {
                clientName: ApolloClientNames.TIME_TRACKING,
                headers: getCustomerInteractionPropagationHeaders(
                  sandbox,
                  TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_SUMMARY_READ,
                ),
              },
              fetchPolicy: 'cache-and-network',
            });

            if (result.error) {
              handleFailure(result.error);
            } else {
              handleSuccess(result.data);
            }
          } catch (err) {
            handleFailure(err);
          }
        };

        fetchData();
      }
    }, [
      isAssignmentsEnabled,
      fetchAssignmentSummary,
      handleFailure,
      handleSuccess,
      sandbox,
    ]);

    return {
      loading: isAssignmentsEnabled ? loading : false,
      data: isAssignmentsEnabled ? localData : [],
      error: isAssignmentsEnabled ? error : null,
      refetch,
      totalTimeAgainstAssignments: isAssignmentsEnabled ? totalAssignments : 0,
    };
  };
