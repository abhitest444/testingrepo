import { useSandbox } from '@payroll/quicksand';
import { useCallback, useMemo, useRef } from 'react';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  TimeTracking_WorkersQueryFilter,
  TimeTracking_WorkerOrderBy,
  useGetTimeTrackingWorkersLazyQuery,
  GetTimeTrackingWorkersQuery,
} from 'src/__generated__/timeTracking/graphql';
import { WORKERS_PAGE_SIZE } from 'src/js/widgets/assignments/utils/constants';

export interface UseTimeTrackingWorkersArgs {
  first?: number;
  after?: string;
  filter?: TimeTracking_WorkersQueryFilter;
  orderBy?: TimeTracking_WorkerOrderBy[];
}

type WorkerNode = NonNullable<
  NonNullable<GetTimeTrackingWorkersQuery['timeTrackingWorkers']>['edges']
>[number]['node'];

type PageInfo = NonNullable<
  GetTimeTrackingWorkersQuery['timeTrackingWorkers']
>['pageInfo'];

export interface UseTimeTrackingWorkersResult {
  loading: boolean;
  workers: WorkerNode[];
  pageInfo: PageInfo | null;
  totalCount: number | null;
  error: string | null;
  loadWorkers: (args?: UseTimeTrackingWorkersArgs) => void;
  fetchNextPage: (args: UseTimeTrackingWorkersArgs) => Promise<void>;
  fetchPreviousPage: (args: UseTimeTrackingWorkersArgs) => Promise<void>;
  refetch: (args?: UseTimeTrackingWorkersArgs) => Promise<void>;
}

/**
 * Custom hook to fetch workers for assignment operations
 * Used in "Assign Workers" and "Assign Leads" drawers
 * Supports pagination, search, and filtering by group
 *
 * QUANTA-5072 (UI-014): Workers Query, Code Generation & Custom Hook
 */
export const useTimeTrackingWorkers = (): UseTimeTrackingWorkersResult => {
  const sandbox = useSandbox();

  // Track cursor history for backward pagination
  // Stores the 'after' cursor used to fetch each page
  // When on page N, history has N-1 entries (page 1 has no history)
  // Example: On page 3, history = [undefined, endCursor_page1]
  //   - undefined was used to fetch page 1
  //   - endCursor_page1 was used to fetch page 2
  const cursorHistoryRef = useRef<(string | undefined)[]>([]);

  // Track the current 'after' cursor (what was used to fetch current page)
  const currentAfterRef = useRef<string | undefined>(undefined);

  const [
    loadQuery,
    {
      data,
      loading,
      error,
      fetchMore: apolloFetchMore,
      refetch: apolloRefetch,
    },
  ] = useGetTimeTrackingWorkersLazyQuery({
    // Use cache-and-network for speed - shows cached data immediately while fetching fresh data
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    onCompleted: () => {
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.WORKERS_READ_FOR_ASSIGNMENT,
      );
    },
    onError: (err) => {
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.WORKERS_READ_FOR_ASSIGNMENT,
        err.message,
        err,
      );
    },
  });

  // Extract workers from edges
  const workers = useMemo(
    () => data?.timeTrackingWorkers?.edges?.map((edge) => edge.node) || [],
    [data],
  );

  const pageInfo = data?.timeTrackingWorkers?.pageInfo || null;
  const totalCount = data?.timeTrackingWorkers?.totalCount ?? null;

  const loadWorkers = useCallback(
    ({
      first = WORKERS_PAGE_SIZE,
      after,
      filter,
      orderBy = [TimeTracking_WorkerOrderBy.DisplayNameAsc],
    }: UseTimeTrackingWorkersArgs = {}) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.WORKERS_READ_FOR_ASSIGNMENT,
      );

      // Reset cursor history and tracking when loading fresh data
      if (!after) {
        cursorHistoryRef.current = [];
        currentAfterRef.current = undefined;
      } else {
        currentAfterRef.current = after;
      }

      loadQuery({
        variables: { first, after, filter, orderBy },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.WORKERS_READ_FOR_ASSIGNMENT,
          ),
        },
      });
    },
    [sandbox, loadQuery],
  );

  // Fetch next page (replaces current page data)
  const fetchNextPage = useCallback(
    async (args: UseTimeTrackingWorkersArgs) => {
      if (!pageInfo?.hasNextPage || !pageInfo?.endCursor) {
        sandbox.logger.warn('No next page available');
        return;
      }

      const {
        first = WORKERS_PAGE_SIZE,
        filter,
        orderBy = [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      } = args;

      // Store the cursor we used to fetch the CURRENT page
      // This allows us to return to the current page when going backward
      cursorHistoryRef.current.push(currentAfterRef.current);

      // Update current cursor to the one we're about to use
      const nextCursor = pageInfo.endCursor;
      currentAfterRef.current = nextCursor;

      sandbox.logger.info('Fetching next page', {
        after: nextCursor,
        historyLength: cursorHistoryRef.current.length,
        storedCursor:
          cursorHistoryRef.current[cursorHistoryRef.current.length - 1],
      });

      try {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.WORKERS_READ_FOR_ASSIGNMENT,
        );

        await apolloRefetch({
          first,
          after: nextCursor,
          filter,
          orderBy,
        });
      } catch (err) {
        sandbox.logger.error('Error fetching next page:', { error: err });
        // Restore on error
        cursorHistoryRef.current.pop();
        currentAfterRef.current =
          cursorHistoryRef.current[cursorHistoryRef.current.length - 1];
      }
    },
    [apolloRefetch, pageInfo, sandbox],
  );

  // Fetch previous page (replaces current page data)
  const fetchPreviousPage = useCallback(
    async (args: UseTimeTrackingWorkersArgs) => {
      if (cursorHistoryRef.current.length === 0) {
        sandbox.logger.warn('No previous page available');
        return;
      }

      const {
        first = WORKERS_PAGE_SIZE,
        filter,
        orderBy = [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      } = args;

      try {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.WORKERS_READ_FOR_ASSIGNMENT,
        );

        // Get the cursor from history (this is what we used to fetch the previous page)
        const previousCursor = cursorHistoryRef.current.pop();

        // Update current cursor
        currentAfterRef.current = previousCursor;

        sandbox.logger.info('Fetching previous page', {
          after: previousCursor,
          historyLength: cursorHistoryRef.current.length,
        });

        await apolloRefetch({
          first,
          after: previousCursor,
          filter,
          orderBy,
        });
      } catch (err) {
        sandbox.logger.error('Error fetching previous page:', { error: err });
      }
    },
    [apolloRefetch, sandbox],
  );

  // Refetch helper (resets to first page)
  const refetch = useCallback(
    async (args?: UseTimeTrackingWorkersArgs) => {
      try {
        // Reset cursor history and tracking when refetching
        cursorHistoryRef.current = [];
        currentAfterRef.current = args?.after;

        const variables = args
          ? {
              first: args.first || WORKERS_PAGE_SIZE,
              after: args.after,
              filter: args.filter,
              orderBy: args.orderBy || [
                TimeTracking_WorkerOrderBy.DisplayNameAsc,
              ],
            }
          : undefined;

        await apolloRefetch(variables);
      } catch (err) {
        sandbox.logger.error('Error refetching workers:', {
          error: err,
        });
      }
    },
    [apolloRefetch, sandbox],
  );

  return {
    loading,
    workers,
    pageInfo,
    totalCount,
    error: error?.message || null,
    loadWorkers,
    fetchNextPage,
    fetchPreviousPage,
    refetch,
  };
};
