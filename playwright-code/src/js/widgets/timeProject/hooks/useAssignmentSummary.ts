import { useCallback, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { GET_PROJECT_ASSIGNMENT_SUMMARY } from '../graphql/queries';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import { TIME_PROJECT_LOGGING_CONSTANTS } from '../constants';

export interface AssignmentSummaryCounts {
  assignedTimeForCount: number;
  assignedStandardFieldCount: number;
  assignedCustomFieldCount: number;
  totalTimeForAssignments: number;
  totalStandardFieldAssignments: number;
  totalCustomFieldAssignments: number;
}

interface AssignmentSummaryEdgeNode {
  assignedTimeForCount: number;
  assignedCustomFieldCount: number;
  assignedStandardFieldCount: number;
}

interface AssignmentSummaryResponse {
  timeTrackingTimeAgainstAssignmentSummary?: {
    edges: { node: AssignmentSummaryEdgeNode }[];
    totalTimeForAssignments: number;
    totalCustomFieldAssignments: number;
    totalStandardFieldAssignments: number;
    totalTimeAgainstCount: number;
  };
}

export interface UseAssignmentSummaryResult {
  counts: AssignmentSummaryCounts | null;
  loading: boolean;
  error: boolean;
  /**
   * Fetches the assignment summary for the given customer id. NOTE: This
   * hook intentionally has NO caching of any kind - every call hits the
   * network. The Apollo query is forced to `network-only` and there is no
   * in-memory cache or last-fetched-id dedup. Counts must always reflect
   * the latest server state, especially after the assignment drawer
   * mutates assignments.
   */
  fetchAssignmentSummary: (customerId: string) => Promise<void>;
}

function extractCounts(
  data: AssignmentSummaryResponse['timeTrackingTimeAgainstAssignmentSummary'],
): AssignmentSummaryCounts | null {
  if (!data) return null;
  const firstNode = data.edges?.[0]?.node;
  // The backend may return a "summary-only" response where `edges` is empty
  // but the connection-level `totalXxxAssignments` aggregates ARE populated
  // (e.g. when filtering by `timeAgainstEntityIds=[customerId]` and the
  // assignments are rolled up at the customer level rather than against
  // discrete entities). In that case, the per-node `assignedXxxCount`
  // doesn't exist, so we fall back to the connection-level totals; that
  // way the chips correctly report e.g. "4 workers" instead of being
  // hidden because the per-edge count looked like 0.
  return {
    assignedTimeForCount:
      firstNode?.assignedTimeForCount ?? data.totalTimeForAssignments ?? 0,
    assignedStandardFieldCount:
      firstNode?.assignedStandardFieldCount ??
      data.totalStandardFieldAssignments ??
      0,
    assignedCustomFieldCount:
      firstNode?.assignedCustomFieldCount ??
      data.totalCustomFieldAssignments ??
      0,
    totalTimeForAssignments: data.totalTimeForAssignments ?? 0,
    totalStandardFieldAssignments: data.totalStandardFieldAssignments ?? 0,
    totalCustomFieldAssignments: data.totalCustomFieldAssignments ?? 0,
  };
}

export const useAssignmentSummary = (): UseAssignmentSummaryResult => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);
  const [counts, setCounts] = useState<AssignmentSummaryCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // `network-only` at the lazy-query level so Apollo never serves a stale
  // cached response either.
  const [loadQuery] = useLazyQuery<AssignmentSummaryResponse>(
    GET_PROJECT_ASSIGNMENT_SUMMARY,
    { fetchPolicy: 'network-only' },
  );

  const fetchAssignmentSummary = useCallback(
    async (customerId: string) => {
      setLoading(true);
      setError(false);
      try {
        const result = await withLoggedOperation({
          logger,
          sandbox,
          interactionName:
            TimeCustomerInteraction.TIME_PROJECT_ASSIGNMENT_SUMMARY_READ,
          event: {
            start:
              TIME_PROJECT_LOGGING_CONSTANTS.ASSIGNMENTS
                .ASSIGNMENT_SUMMARY_FETCH_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.ASSIGNMENTS
                .ASSIGNMENT_SUMMARY_FETCH_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.ASSIGNMENTS
                .ASSIGNMENT_SUMMARY_FETCH_FAILURE,
          },
          extraProps: { customerId },
          run: () =>
            loadQuery({
              variables: {
                first: 100,
                filter: { timeAgainstEntityIds: [customerId] },
              },
              // Belt-and-suspenders: also force network-only at the call
              // site so a future change to the lazy-query default can't
              // accidentally reintroduce caching.
              fetchPolicy: 'network-only',
              context: {
                headers: {
                  ...(sandbox &&
                    getCustomerInteractionPropagationHeaders(
                      sandbox,
                      TimeCustomerInteraction.TIME_PROJECT_ASSIGNMENT_SUMMARY_READ,
                    )),
                  ...(isWorkforceUser
                    ? { 'intuit-qbtime-worker': 'true' }
                    : {}),
                },
              },
            }),
        });

        const extracted = extractCounts(
          result.data?.timeTrackingTimeAgainstAssignmentSummary,
        );
        setCounts(extracted);
      } catch {
        setError(true);
        setCounts(null);
      } finally {
        setLoading(false);
      }
    },
    // Intentionally NO `counts` here - including state would change the
    // callback identity on every `setCounts` call, which would re-fire the
    // consumer's `useEffect` and infinitely re-hit the API.
    [isWorkforceUser, loadQuery, logger, sandbox],
  );

  return { counts, loading, error, fetchAssignmentSummary };
};
