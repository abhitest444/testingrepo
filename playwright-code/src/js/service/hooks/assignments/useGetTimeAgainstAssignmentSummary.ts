import { useSandbox } from '@payroll/quicksand';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  appendData,
  refreshPageData,
  setInitialData,
  setLoading,
} from 'src/js/widgets/assignments/store/customerAssignmentsSlice';
import { useGetTimeAgainstAssignmentSummaryLazyQuery } from 'src/__generated__/timeTracking/graphql';

export interface UseGetTimeAgainstAssignmentSummaryArgs {
  first?: number;
  after?: string;
  searchText?: string;
  append?: boolean; // Matches Groups tab pattern - append vs replace data
  refreshInPlace?: boolean; // Upsert current page items without resetting cursor/hasMore
}

export interface UseGetTimeAgainstAssignmentSummaryResult {
  loading: boolean;
  error: string | null;
  loadTimeAgainstAssignmentSummary: (
    args?: UseGetTimeAgainstAssignmentSummaryArgs,
  ) => Promise<void>;
}

// Context: TimeTracking Time Against Assignment Summary
// Pattern: Exactly matches Groups tab useGetWorkersForGroup
export const useGetTimeAgainstAssignmentSummary =
  (): UseGetTimeAgainstAssignmentSummaryResult => {
    const sandbox = useSandbox();
    const dispatch = useDispatch();

    const [loadQuery, { loading, error }] =
      useGetTimeAgainstAssignmentSummaryLazyQuery({
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
      });

    const loadTimeAgainstAssignmentSummary = useCallback(
      async ({
        first = 20,
        after,
        searchText,
        append = false,
        refreshInPlace = false,
      }: UseGetTimeAgainstAssignmentSummaryArgs = {}) => {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.TIME_AGAINST_ASSIGNMENT_SUMMARY_READ,
        );

        // Set loading state for both initial and append loads
        dispatch(setLoading(true));

        try {
          // Build filter object if searchText is provided
          const filter = searchText ? { searchText } : undefined;

          // Execute query and wait for result
          const result = await loadQuery({
            variables: { first, after, filter },
            context: {
              headers: getCustomerInteractionPropagationHeaders(
                sandbox,
                TimeCustomerInteraction.TIME_AGAINST_ASSIGNMENT_SUMMARY_READ,
              ),
            },
          });

          sandbox.logger.info(
            'Component=useGetTimeAgainstAssignmentSummary Event=Successfully fetched time against assignment summary',
          );
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.TIME_AGAINST_ASSIGNMENT_SUMMARY_READ,
          );

          // Extract data from result
          const data = result.data?.timeTrackingTimeAgainstAssignmentSummary;

          if (data?.edges) {
            if (refreshInPlace) {
              dispatch(
                refreshPageData({
                  edges: data.edges,
                  totalCount: data.totalTimeAgainstCount || 0,
                  totalTimeForAssignments: data.totalTimeForAssignments || 0,
                  totalCustomFieldAssignments:
                    data.totalCustomFieldAssignments || 0,
                  totalStandardFieldAssignments:
                    data.totalStandardFieldAssignments || 0,
                }),
              );
            } else if (append) {
              dispatch(
                appendData({
                  edges: data.edges,
                  hasNextPage: data.pageInfo?.hasNextPage || false,
                  endCursor: data.pageInfo?.endCursor || null,
                  totalCount: data.totalTimeAgainstCount || 0,
                }),
              );
            } else {
              dispatch(
                setInitialData({
                  edges: data.edges,
                  totalCount: data.totalTimeAgainstCount || 0,
                  hasNextPage: data.pageInfo?.hasNextPage || false,
                  endCursor: data.pageInfo?.endCursor || null,
                  totalTimeForAssignments: data.totalTimeForAssignments || 0,
                  totalCustomFieldAssignments:
                    data.totalCustomFieldAssignments || 0,
                  totalStandardFieldAssignments:
                    data.totalStandardFieldAssignments || 0,
                }),
              );
            }
          }

          // Clear loading state
          dispatch(setLoading(false));
        } catch (err: any) {
          sandbox.logger.error(
            'Component=useGetTimeAgainstAssignmentSummary Event=Error fetching time against assignment summary',
            { error: err.message },
          );
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.TIME_AGAINST_ASSIGNMENT_SUMMARY_READ,
            err.message,
            err,
          );
          dispatch(setLoading(false));
        }
      },
      [sandbox, loadQuery, dispatch],
    );

    return {
      loading,
      error: error?.message || null,
      loadTimeAgainstAssignmentSummary,
    };
  };
