import { useEffect, useRef, useCallback } from 'react';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import { useTimeAgainstAssignments } from 'src/js/service/hooks/assignments/useTimeAgainstAssignments';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCustomers,
  setError,
  setLoading,
  appendCustomers,
  resetCustomers,
} from '../store/customerSlice';
import { selectTeamMember } from '../store/selectors';
import { WEEKLY_SUPER_SEARCH_CUSTOMER_PAGE_SIZE } from '../utils/constants';

/** Args used for load more - stored in ref, must match the initial fetch */
interface CustomerFetchArgs {
  timeForEntityId: string;
  filter?: { assigned?: boolean } | undefined;
}

export interface UseWTETimeAgainstAssignmentsFetchResult {
  loadMore: () => void;
  hasMore: boolean;
}

/**
 * Fetches time-against assignments (customer/project list) once when worker is selected or changes,
 * and stores the result in Redux. The time category dropdown (WeeklySuperSearch) then reads
 * from Redux instead of calling API on every open.
 *
 * Returns loadMore and hasMore for infinite scroll when not searching.
 *
 * Should be used at WTE widget level (e.g. WeeklyTimeEntryDataProvider) so the fetch runs
 * when the team member is set, not when the dropdown is opened.
 */
export const useWTETimeAgainstAssignmentsFetch =
  (): UseWTETimeAgainstAssignmentsFetchResult => {
    const dispatch = useAppDispatch();
    const teamMember = useAppSelector(selectTeamMember);

    const {
      loadTimeAgainstAssignments,
      data: timeAgainstData,
      loading,
      error,
      pageInfo,
    } = useTimeAgainstAssignments();

    const loadingRef = useRef(loading);
    loadingRef.current = loading;

    // Refs for load more - updated when we get API response, read when loadMore is called
    const pageInfoRef = useRef<{
      hasNextPage: boolean;
      endCursor: string | null;
    }>({ hasNextPage: false, endCursor: null });
    const lastFetchArgsRef = useRef<CustomerFetchArgs | null>(null);
    const isLoadMoreRef = useRef(false);
    // Guard: prevents setCustomers when effect runs multiple times for same load more response
    const lastProcessedResponseRef = useRef<string | null>(null);

    // Track last fetched worker so we only refetch when worker changes
    const lastFetchedWorkerKeyRef = useRef<string | null>(null);

    // Keep refs in sync with latest pageInfo
    useEffect(() => {
      if (pageInfo) {
        pageInfoRef.current = {
          hasNextPage: pageInfo.hasNextPage ?? false,
          endCursor: pageInfo.endCursor ?? null,
        };
      }
    }, [pageInfo]);

    // Fetch once when worker is set or changes (or when no worker - show all)
    // Clears existing list and fetches fresh data
    useEffect(() => {
      const workerKey = teamMember?.id ?? '';

      if (lastFetchedWorkerKeyRef.current === workerKey) {
        return;
      }

      lastFetchedWorkerKeyRef.current = workerKey;
      isLoadMoreRef.current = false;
      lastFetchArgsRef.current = null;
      lastProcessedResponseRef.current = null;

      dispatch(resetCustomers());
      dispatch(setLoading({ loading: true }));

      if (teamMember?.id) {
        loadTimeAgainstAssignments({
          first: WEEKLY_SUPER_SEARCH_CUSTOMER_PAGE_SIZE,
          input: {
            timeForEntityId: teamMember.id,
          },
          filter: { assigned: true },
        });
      } else {
        loadTimeAgainstAssignments({
          first: WEEKLY_SUPER_SEARCH_CUSTOMER_PAGE_SIZE,
          input: {
            timeForEntityId: '',
          },
          filter: undefined,
        });
      }
    }, [teamMember?.id, loadTimeAgainstAssignments, dispatch]);

    // Stable loadMore callback - reads from refs, no effect dependencies
    const loadMore = useCallback(() => {
      if (loadingRef.current) return;

      const { hasNextPage, endCursor } = pageInfoRef.current;
      const args = lastFetchArgsRef.current;
      if (!hasNextPage || !endCursor || !args) return;

      isLoadMoreRef.current = true;
      loadTimeAgainstAssignments({
        first: WEEKLY_SUPER_SEARCH_CUSTOMER_PAGE_SIZE,
        after: endCursor,
        input: {
          timeForEntityId: args.timeForEntityId,
        },
        filter: args.filter,
      });
    }, [loadTimeAgainstAssignments]);

    // When data/loading/error from API changes, sync to Redux
    useEffect(() => {
      dispatch(setLoading({ loading }));

      if (error) {
        dispatch(setError({ error }));
        return;
      }

      dispatch(setError({ error: null }));

      if (!timeAgainstData || timeAgainstData.length === 0) {
        if (!loading && !isLoadMoreRef.current) {
          dispatch(setCustomers({ customers: [] }));
        }
        return;
      }

      // Dedupe: effect can run multiple times for same response (e.g. loading + data in separate batches).
      // If we already processed this response, skip to avoid setCustomers overwriting a correct appendCustomers.
      const responseSignature = `${pageInfo?.endCursor ?? 'initial'}-${
        timeAgainstData.length
      }-${
        timeAgainstData[0]?.timeAgainstContactDAS?.customer?.id ??
        timeAgainstData[0]?.timeAgainstContactDAS?.project?.id ??
        'x'
      }`;
      if (lastProcessedResponseRef.current === responseSignature) {
        return;
      }
      lastProcessedResponseRef.current = responseSignature;

      const transformedCustomers = timeAgainstData.map((item) => {
        const isProject = item.customerType === 'PROJECT';
        const id = item.timeAgainstContactDAS?.customer?.id || '';

        return {
          id,
          displayName: item.displayName || '',
          fullName: item.fullName || '',
          type: DataAccess_ContactType.Customer,
          __typename: isProject
            ? ('DataAccess_Project' as const)
            : ('DataAccess_Customer' as const),
          parentId: item.parentId || null,
          level: item.level ?? null,
          active: true,
        };
      });

      const workerKey = teamMember?.id ?? '';
      const fetchArgs: CustomerFetchArgs = {
        timeForEntityId: workerKey,
        filter: teamMember?.id ? { assigned: true } : undefined,
      };

      if (isLoadMoreRef.current) {
        isLoadMoreRef.current = false;
        dispatch(appendCustomers({ customers: transformedCustomers as any }));
      } else {
        lastFetchArgsRef.current = fetchArgs;
        dispatch(setCustomers({ customers: transformedCustomers as any }));
      }
    }, [timeAgainstData, loading, error, dispatch, pageInfo, teamMember?.id]);

    return {
      loadMore,
      hasMore: pageInfo?.hasNextPage ?? false,
    };
  };
