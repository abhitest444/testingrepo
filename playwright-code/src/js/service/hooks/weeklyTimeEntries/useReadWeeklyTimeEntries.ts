import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { useApolloClient } from '@apollo/client';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import { getReadWeeklyTimeEntriesInput } from 'src/js/service/hooks/timeEntries/useSearchTimeEntries';
import { Week } from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';
import { WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS } from 'src/js/widgets/weeklyTimeEntry/utils/constants';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  mapWeeklyTimeEntriesResult,
  useWeeklyTimeEntriesQuery,
} from 'src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntryQuery';
import { WeeklyTimeEntry } from 'src/js/widgets/weeklyTimeEntry/types/weeklyTimeEntryQueryTypes';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

/**
 * Interface defining the shape of the hook's return value
 * @property entries - Array of time entries for the specified week
 * @property loading - Boolean indicating if the data is currently being fetched
 * @property error - Error message if the fetch failed, null otherwise
 * @property refetch - Function to manually trigger a refetch of the data
 */
interface UseReadWeeklyTimeEntriesResult {
  entries: WeeklyTimeEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage weekly time entries
 *
 * This hook handles:
 * - Fetching time entries for a specific week and user
 * - Converting dates to strings for stable comparison
 * - Error handling and logging
 * - Loading state management
 *
 * @param nameId - The ID of the user/entity to fetch time entries for
 * @param week - The week object containing start and end dates
 * @returns Object containing entries, loading state, and any error
 *
 * @example
 * ```tsx
 * const { entries, loading, error } = useReadWeeklyTimeEntries(userId, {
 *   startDate: dayjs('2024-03-01'),
 *   endDate: dayjs('2024-03-07')
 * });
 * ```
 */
export const useReadWeeklyTimeEntries = (
  nameId: string,
  week: Week,
): UseReadWeeklyTimeEntriesResult => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);
  const client = useApolloClient();
  // const dispatch = useDispatch();

  // Convert dates to strings for stable comparison in dependencies
  // This prevents unnecessary re-renders when the week object is recreated
  const startDate = week.startDate?.format('YYYY-MM-DD').toString();
  const endDate = week.endDate?.format('YYYY-MM-DD').toString();

  // Tracks the (nameId|startDate|endDate) we last issued a network request for.
  // The fetch effect below re-runs on every staged Redux update during first
  // open — teamMember lands, then dateRange seeds, then combinedDataReady flips,
  // then the firstDayOfWeek locale re-seed — and several of those renders carry
  // the SAME nameId+week. Because the query is `no-cache` (see
  // useWeeklyTimeEntryQuery), each effect run would otherwise be a real HTTP
  // call, producing the multiple in-flight requests and repeated loading
  // spinners users saw as flicker on first open. Guarding on this key collapses
  // identical re-fires to a single request; a genuine change (new worker or
  // week) updates the key and fetches once.
  const lastFetchedKeyRef = useRef<string>();

  // Initialize Apollo query hook for fetching time entries.
  // notifyOnNetworkStatusChange is intentionally omitted (defaults to false) —
  // enabling it caused the hook to emit on every loading-state transition,
  // which combined with cache-and-network to produce ~2x the renders per fetch.
  const [query, { data, loading, error, refetch: apolloRefetch }] =
    useWeeklyTimeEntriesQuery({
      context: { clientName: ApolloClientNames.TIME_TRACKING },
    });

  /**
   * Function to fetch time entries for a specific week and nameId
   * Memoized to prevent unnecessary re-renders
   */
  const readWeeklyTimeEntries = useCallback(
    (week: Week, nameId: string) => {
      // Validate inputs - don't fetch if nameId is empty or undefined
      if (!week || !nameId?.trim()) {
        return; // dont fetch if no week or nameId
      }

      // Create customer interaction for FCI tracking
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SHEET_READ,
      );

      const input = getReadWeeklyTimeEntriesInput(week, nameId);

      query({
        variables: { input },
        fetchPolicy: 'network-only', // Always fetch fresh data from server — avoids cache-and-network double-emit
        errorPolicy: 'all',
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: {
            ...getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.WEEKLY_TIME_SHEET_READ,
            ),
            ...(isWorkforceUser && {
              'intuit-is-workforce-user': 'true',
            }),
          },
        },
      });
    },
    [query, sandbox, isWorkforceUser],
  );

  /**
   * Effect to fetch time entries when dependencies change
   * Only triggers when:
   * - nameId changes (and is not empty)
   * - startDate changes
   * - endDate changes
   * - readWeeklyTimeEntries changes (rare)
   */
  useEffect(() => {
    const trimmedNameId = nameId?.trim();

    // Only fetch if we have a valid nameId (not empty or undefined) and dates.
    if (!trimmedNameId || !startDate || !endDate) {
      // Prerequisites not met (e.g. a caller intentionally gates fetching by
      // passing nameId === ''). Clear the dedupe key so that when the same
      // params are re-enabled later ('' -> id), the fetch is not suppressed as
      // a "duplicate" of the last request. Without this reset the guard would
      // permanently swallow the re-enabled fetch and loading would never flip.
      lastFetchedKeyRef.current = undefined;
      return;
    }

    // Skip if we already issued a request for this exact worker+week. Staged
    // renders during first open re-run this effect with identical params; the
    // `no-cache` query would turn each into a duplicate network call (and
    // another spinner) without this guard. Key on the trimmed nameId so stray
    // whitespace can't produce a spurious "different" key.
    const fetchKey = `${trimmedNameId}|${startDate}|${endDate}`;
    if (lastFetchedKeyRef.current === fetchKey) {
      return;
    }
    lastFetchedKeyRef.current = fetchKey;
    readWeeklyTimeEntries(week, nameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // The code intentionally uses startDate and endDate (string representations) instead of the week object in the dependency array
    // Prevents Unnecessary Re-renders: Including week would cause the effect to run every time the week object is recreated, even if the actual dates haven't changed
  }, [nameId, startDate, endDate, readWeeklyTimeEntries]);

  /**
   * Process and memoize the fetched entries and errors
   * Handles:
   * - Error logging and mapping
   * - Success logging
   * - Data transformation
   */
  const { entries, errorMessage } = useMemo(() => {
    if (error && !data) {
      // Log read failure with error details and end FCI with failure
      sandbox.logger.error(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.ERRORS.READ_TIME_ENTRIES_FAILED,
        {
          error: error.message,
          nameId,
          startDate,
          endDate,
          timeEntriesFetched: 0,
        },
      );

      // End customer interaction with failure
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SHEET_READ,
        error.message,
        error,
      );

      return {
        entries: [],
        errorMessage:
          mapError({
            sourceComponent: 'useReadWeeklyTimeEntries',
            sandbox,
            intl,
            error,
          }) ?? null,
      };
    }

    if (data) {
      if (error) {
        // Log the encountered error  with details
        sandbox.logger.error(
          WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.ERRORS
            .ERROR_FETCHING_TIME_ENTRIES,
          {
            error: error.message,
            graphQLErrors: error.graphQLErrors[0].path,
            networkErrors: error.networkError?.message,
            nameId,
            startDate,
            endDate,
            timeEntriesFetched: 0,
          },
        );
      }
      const timeEntriesCount = data.timeTrackingTimeEntries?.edges?.length || 0;
      sandbox.logger.info(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.SUCCESS
          .WEEKLY_TIME_ENTRIES_FETCH_SUCCESS,
        {
          noOfTimeEntriesFetched: timeEntriesCount,
          nameId,
          startDate,
          endDate,
          timeEntriesFetched: timeEntriesCount,
        },
      );

      // End customer interaction with success
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SHEET_READ,
      );

      return {
        entries: mapWeeklyTimeEntriesResult(data),
        errorMessage: null,
      };
    }

    return { entries: [], errorMessage: null };
  }, [data, error, intl, sandbox, nameId, startDate, endDate]);

  /**
   * Refetch function that forces fresh data from the server
   * Uses a fresh query to bypass cache and get latest data
   */
  const refetch = useCallback(async () => {
    if (nameId?.trim() !== '' && startDate && endDate) {
      // Manual refetch intentionally bypasses the dedupe guard — the caller
      // wants fresh data even for the current worker+week. Mark this key as
      // already fetched so the automatic effect doesn't immediately re-issue
      // the same request on the next render. Use the trimmed nameId so the key
      // matches the effect's key format and the two stay in sync.
      lastFetchedKeyRef.current = `${nameId?.trim()}|${startDate}|${endDate}`;
      try {
        // Force fresh data by making a new query with network-only policy
        const input = getReadWeeklyTimeEntriesInput(week, nameId);

        await query({
          variables: { input },
          fetchPolicy: 'network-only', // Force fresh data from server
          context: {
            clientName: ApolloClientNames.TIME_TRACKING,
            ...(isWorkforceUser && {
              headers: {
                'intuit-is-workforce-user': 'true',
              },
            }),
          },
        });
      } catch (err) {
        // Fallback to Apollo refetch if available
        if (apolloRefetch) {
          await apolloRefetch();
        }
      }
    }
  }, [query, nameId, startDate, endDate, week, apolloRefetch, isWorkforceUser]);

  return {
    entries,
    loading,
    error: errorMessage,
    refetch,
  };
};
