import { useCallback, useEffect, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { GET_WORKER_TIME_SUMMARY } from '../graphql/queries';
import {
  WorkerRow,
  WorkerTimeSummaryResponse,
  WorkerTimeSummaryEdge,
} from '../types';
import {
  DEFAULT_PAGE_SIZE,
  TIME_PROJECT_LOGGING_CONSTANTS,
} from '../constants';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import {
  LegacyQboUserName,
  useLegacyQboUserNames,
} from './useLegacyQboUserNames';

export const LEGACY_QBO_USER_TYPE = 'LEGACY_QBO_USER';

export const mapEdgesToWorkerRows = (
  edges: WorkerTimeSummaryEdge[],
): WorkerRow[] =>
  edges.map(({ node }) => {
    const isLegacyQboUser = node.timeForType === LEGACY_QBO_USER_TYPE;
    // For LEGACY_QBO_USER rows DAS leaves `timeForContactDAS` null, so fall
    // back to the persona id off `timeFor` (Identity uses this as the
    // profile id). Display name is left blank here and filled in by the
    // Identity enrichment step below.
    const id = isLegacyQboUser
      ? node.timeFor?.id ?? ''
      : node.timeForContactDAS?.id ?? '';
    return {
      id,
      displayName: node.timeForContactDAS?.displayName || '',
      hoursWorked: Math.round((node.totalRegularSeconds / 3600) * 100) / 100,
      timeForType: node.timeForType,
    };
  });

export const enrichLegacyQboUserRows = (
  rows: WorkerRow[],
  names: Record<string, LegacyQboUserName>,
): WorkerRow[] =>
  rows.map((row) => {
    if (row.timeForType !== LEGACY_QBO_USER_TYPE) return row;
    const resolved = names[row.id];
    if (!resolved) return row;
    return {
      ...row,
      displayName: resolved.displayName || row.displayName,
    };
  });

export interface WorkerSummaryFilter {
  projectId: string;
  // Canonical customer id resolved by `useProjectCustomerLookup` from
  // the OIGQL contacts call. Required by the supergraph alongside
  // `projectId` so the worker-summary read scopes correctly to the
  // (project, customer) tuple. Optional only on the type so existing
  // string-based callers keep compiling — runtime callers should
  // always pass it.
  customerId?: string;
  serviceItemId?: string;
}

export interface UseWorkerTimeSummaryResult {
  workers: WorkerRow[];
  loading: boolean;
  error: boolean;
  page: number;
  totalPages: number;
  fetchWorkerSummary: (filter: string | WorkerSummaryFilter) => Promise<void>;
  goToNextPage: () => Promise<void>;
  goToPrevPage: () => Promise<void>;
}

export const useWorkerTimeSummary = (
  workerId?: string | null,
): UseWorkerTimeSummaryResult => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);
  const { data: isProjectsCurrentWorkerSummaryEnabled } = useQbTimeSdk<boolean>(
    (sdk) => (sdk as any).isProjectsCurrentWorkerSummaryEnabled,
    { executeOnMount: true },
  );
  const { fetchNames: fetchLegacyQboUserNames } = useLegacyQboUserNames();
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const filterRef = useRef<WorkerSummaryFilter | null>(null);
  const cursorStackRef = useRef<(string | null)[]>([null]);
  const pendingFetchRef = useRef<{
    filter: WorkerSummaryFilter;
    after: string | null;
    targetPage: number;
  } | null>(null);
  // Tracks the most recently dispatched fetch so a slow Identity enrichment
  // from an earlier page can't overwrite a newer page's rows on completion.
  const requestSeqRef = useRef(0);
  const shouldDeferUntilFlagResolves =
    isProjectsCurrentWorkerSummaryEnabled === undefined;

  const [loadQuery] = useLazyQuery<WorkerTimeSummaryResponse>(
    GET_WORKER_TIME_SUMMARY,
    { fetchPolicy: 'no-cache' },
  );

  const buildFilterInput = useCallback(
    (f: WorkerSummaryFilter) => {
      const input: Record<string, string | string[]> = {
        projectId: f.projectId,
      };
      // Pair customerId with projectId per the new contract — see the
      // WorkerSummaryFilter docstring.
      if (f.customerId) {
        input.customerId = f.customerId;
      }
      if (f.serviceItemId) {
        input.serviceItemId = f.serviceItemId;
      }
      if (isProjectsCurrentWorkerSummaryEnabled === true && workerId) {
        input.workerIds = [workerId];
      }
      return input;
    },
    [isProjectsCurrentWorkerSummaryEnabled, workerId],
  );

  const fetchPage = useCallback(
    async (
      filter: WorkerSummaryFilter,
      after: string | null,
      targetPage: number,
    ) => {
      if (shouldDeferUntilFlagResolves) {
        pendingFetchRef.current = { filter, after, targetPage };
        return;
      }

      setLoading(true);
      setError(false);
      requestSeqRef.current += 1;
      const seq = requestSeqRef.current;

      try {
        const result = await withLoggedOperation({
          logger,
          sandbox,
          interactionName:
            TimeCustomerInteraction.TIME_PROJECT_WORKER_TIME_SUMMARY_READ,
          event: {
            start:
              TIME_PROJECT_LOGGING_CONSTANTS.READS
                .WORKER_TIME_SUMMARY_FETCH_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.READS
                .WORKER_TIME_SUMMARY_FETCH_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.READS
                .WORKER_TIME_SUMMARY_FETCH_FAILURE,
          },
          extraProps: {
            projectId: filter.projectId,
            customerId: filter.customerId ?? null,
            serviceItemId: filter.serviceItemId ?? null,
            page: targetPage,
            pageSize: DEFAULT_PAGE_SIZE,
          },
          run: () =>
            loadQuery({
              variables: {
                input: { workerTimeSummaryFilter: buildFilterInput(filter) },
                first: DEFAULT_PAGE_SIZE,
                after,
              },
              context: {
                headers: {
                  ...(isWorkforceUser && {
                    'intuit-is-workforce-user': 'true',
                  }),
                  ...(sandbox
                    ? getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_WORKER_TIME_SUMMARY_READ,
                      )
                    : {}),
                },
              },
            }),
        });

        const connection = result.data?.timeTrackingWorkerTimeSummary;
        const edges = connection?.edges ?? [];
        const nextPage = connection?.pageInfo?.hasNextPage ?? false;

        if (nextPage && connection?.pageInfo?.endCursor) {
          cursorStackRef.current[targetPage] = connection.pageInfo.endCursor;
        }

        const baseRows = mapEdgesToWorkerRows(edges);
        setWorkers(baseRows);
        setPage(targetPage);
        setHasNextPage(nextPage);

        // Background-resolve display names for LEGACY_QBO_USER rows via
        // Identity. We render the table immediately with blank names for
        // those rows, then patch the displayName once the profile lookups
        // resolve. A stale enrichment from an earlier page is dropped via
        // the `seq` guard so it can't clobber a newer page.
        const legacyIds = baseRows
          .filter((row) => row.timeForType === LEGACY_QBO_USER_TYPE && row.id)
          .map((row) => row.id);
        if (legacyIds.length > 0) {
          fetchLegacyQboUserNames(legacyIds)
            .then((names) => {
              if (seq !== requestSeqRef.current) return;
              setWorkers((current) => enrichLegacyQboUserRows(current, names));
            })
            .catch(() => {
              // Per-id failures are already swallowed inside
              // `useLegacyQboUserNames`; this catch only fires for
              // unexpected aggregation errors and shouldn't block the
              // rendered table.
            });
        }
      } catch {
        setError(true);
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    },
    [
      buildFilterInput,
      fetchLegacyQboUserNames,
      isWorkforceUser,
      loadQuery,
      logger,
      sandbox,
      shouldDeferUntilFlagResolves,
    ],
  );

  useEffect(() => {
    if (shouldDeferUntilFlagResolves) return;
    if (!pendingFetchRef.current) return;

    const pendingFetch = pendingFetchRef.current;
    pendingFetchRef.current = null;
    fetchPage(
      pendingFetch.filter,
      pendingFetch.after,
      pendingFetch.targetPage,
    ).catch(() => {});
  }, [fetchPage, shouldDeferUntilFlagResolves]);

  const fetchWorkerSummary = useCallback(
    async (input: string | WorkerSummaryFilter) => {
      const filter = typeof input === 'string' ? { projectId: input } : input;
      filterRef.current = filter;
      cursorStackRef.current = [null];
      await fetchPage(filter, null, 1);
    },
    [fetchPage],
  );

  const goToNextPage = useCallback(async () => {
    const filter = filterRef.current;
    if (!filter || !hasNextPage) return;

    const nextP = page + 1;
    const cursor = cursorStackRef.current[nextP - 1] ?? null;
    await fetchPage(filter, cursor, nextP);
  }, [page, hasNextPage, fetchPage]);

  const goToPrevPage = useCallback(async () => {
    if (page <= 1) return;

    const filter = filterRef.current;
    if (!filter) return;

    const prevP = page - 1;
    const cursor = cursorStackRef.current[prevP - 1] ?? null;
    await fetchPage(filter, cursor, prevP);
  }, [page, fetchPage]);

  const totalPages = hasNextPage ? page + 1 : page;

  return {
    workers,
    loading,
    error,
    page,
    totalPages,
    fetchWorkerSummary,
    goToNextPage,
    goToPrevPage,
  };
};
