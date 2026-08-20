import { useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  createCustomerInteraction,
  setInteractionDegraded,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  useGetStandardFieldOptionsSummaryLazyQuery,
  type TimeTracking_StandardFieldOptionSummaryConnection,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { ASSIGNMENT_PAGINATION_DEFAULTS } from 'src/js/widgets/assignments/constants';

/**
 * Standard field label types
 */
export type StandardFieldLabel =
  | 'CLASS'
  | 'LOCATION'
  | 'SERVICE_ITEM'
  | 'BILLABLE';

/**
 * Arguments for loading standard field option summaries
 */
export interface UseStandardFieldOptionsSummaryArgs {
  /** The standard field label to fetch (CLASS, LOCATION, SERVICE_ITEM, or BILLABLE) */
  standardFieldLabel: StandardFieldLabel;
  /** Number of results per page */
  first?: number;
  /** Cursor for pagination */
  after?: string;
  /** Search text to filter standard field options by name */
  searchText?: string;
}

/**
 * Result returned by the useStandardFieldOptionsSummary hook
 */
export interface UseStandardFieldOptionsSummaryResult {
  /** Loading state */
  loading: boolean;
  /** Standard field option summary data */
  data: TimeTracking_StandardFieldOptionSummaryConnection | null;
  /** Error message if any */
  error: string | null;
  /** Function to load standard field option summaries */
  loadStandardFieldOptionsSummary: (
    args: UseStandardFieldOptionsSummaryArgs,
  ) => void;
  /** Refetch function to reload data with same parameters */
  refetch: () => void;
}

/**
 * Custom hook to fetch standard field option summaries
 *
 * This hook fetches options for a specified standard field type (CLASS, LOCATION, SERVICE_ITEM, or BILLABLE).
 * Returns id, name, standardFieldLabel, workerAssignmentCount, and customerAssignmentCount for each option.
 *
 * Features:
 * - Simple single query approach
 * - Works for CLASS, LOCATION, SERVICE_ITEM, or BILLABLE
 * - Pagination support
 * - Customer interaction tracking for analytics
 * - Error handling and logging
 *
 * @returns Object containing loading state, data, options array, error, and load function
 *
 * @example
 * ```tsx
 * const { loading, data, options, loadStandardFieldOptionsSummary } =
 *   useStandardFieldOptionsSummary();
 *
 * // Load CLASS options
 * loadStandardFieldOptionsSummary({ standardFieldLabel: 'CLASS' });
 *
 * // Load LOCATION options with pagination
 * loadStandardFieldOptionsSummary({ standardFieldLabel: 'LOCATION', first: 50 });
 *
 * // Similarly for SERVICE_ITEM and BILLABLE options
 * loadStandardFieldOptionsSummary({ standardFieldLabel: 'SERVICE_ITEM' });
 * loadStandardFieldOptionsSummary({ standardFieldLabel: 'BILLABLE' });
 *
 * // Access data
 * data?.edges.forEach(({ node }) => {
 *   console.log(node.name);
 *   console.log(`Workers: ${node.workerAssignmentCount}`);
 *   console.log(`Customers: ${node.customerAssignmentCount}`);
 * });
 * ```
 */
export const useStandardFieldOptionsSummary =
  (): UseStandardFieldOptionsSummaryResult => {
    const sandbox = useSandbox();

    const [loadQuery, { data, loading, error }] =
      useGetStandardFieldOptionsSummaryLazyQuery({
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        context: { clientName: ApolloClientNames.TIME_TRACKING },
        onCompleted: () => {
          sandbox.logger.info(
            'Component=useStandardFieldOptionsSummary Event=Successfully fetched standard field options summary',
          );
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.STANDARD_FIELD_OPTION_SUMMARY_READ,
          );
        },
        onError: (err) => {
          sandbox.logger.error(
            'Component=useStandardFieldOptionsSummary Event=Error fetching standard field options summary',
            {
              error: err.message,
            },
          );
          setInteractionDegraded(
            sandbox,
            TimeCustomerInteraction.STANDARD_FIELD_OPTION_SUMMARY_READ,
            err.message,
          );
        },
      });

    const loadStandardFieldOptionsSummary = useCallback(
      ({
        standardFieldLabel,
        first = ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
        after,
        searchText,
      }: UseStandardFieldOptionsSummaryArgs) => {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.STANDARD_FIELD_OPTION_SUMMARY_READ,
        );

        loadQuery({
          variables: {
            standardFieldLabel,
            first,
            after,
            filter: searchText ? { searchText } : undefined,
          },
          context: {
            clientName: ApolloClientNames.TIME_TRACKING,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.STANDARD_FIELD_OPTION_SUMMARY_READ,
            ),
          },
        });
      },
      [sandbox, loadQuery],
    );

    return {
      loading,
      data: data?.timeTrackingStandardFieldOptionSummary || null,
      error: error?.message || null,
      loadStandardFieldOptionsSummary,
      refetch: () => {},
    };
  };
