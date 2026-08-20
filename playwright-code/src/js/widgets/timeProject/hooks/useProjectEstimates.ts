import { useCallback, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { useAppDispatch, useAppSelector } from '../store';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import { TIME_PROJECT_LOGGING_CONSTANTS } from '../constants';
import {
  setEstimatesMap,
  setEstimatesLoading,
  setEstimatesError,
} from '../store/projectsSlice';
import {
  ProjectEstimateEdge,
  ProjectEstimatesResponse,
  ProjectEstimateData,
  EstimateItemData,
  ProjectRef,
} from '../types';
import { GET_PROJECT_ESTIMATES } from '../graphql/queries';
import { useAdaptivePageSize } from './useAdaptivePageSize';

const ITEMS_PAGE_SIZE = 50;

const mapEdgesToEstimatesMap = (
  edges: ProjectEstimateEdge[],
): Record<string, ProjectEstimateData> => {
  const map: Record<string, ProjectEstimateData> = {};
  edges.forEach(({ node }) => {
    // The supergraph reports `totalEstimatedSeconds: -1` to mean "no
    // estimate set yet" (distinct from "estimated zero hours" which
    // comes back as 0). Preserve the sentinel through to the UI so:
    //   - the budget cell can render "-" only when truly unestimated
    //     (per product: 0 must render as "0", not "-")
    //   - the summary's chart subtext / hours-remaining line can
    //     suppress its green "0 hrs remaining" treatment for unset
    //     estimates
    //   - we DO NOT subtract -1 from `projectElapsedSeconds`, which
    //     would otherwise produce a meaningless "1h remaining"
    //     value while the user has logged real time.
    const elapsedSeconds = node.projectElapsedSeconds ?? 0;
    const elapsedHours = elapsedSeconds / 3600;

    let estimateItems: EstimateItemData[] | undefined;
    if (node.projectEstimateItems?.edges?.length) {
      estimateItems = node.projectEstimateItems.edges.map(({ node: item }) => {
        // Same sentinel convention applies per service-item row: -1
        // means "appears on the project but not yet estimated", while
        // 0 means "estimated as zero hours".
        const isUnestimated =
          typeof item.estimatedSeconds !== 'number' ||
          item.estimatedSeconds < 0;
        return {
          fieldOptionId: item.fieldOptionId,
          estimatedHours: isUnestimated
            ? -1
            : Math.round((item.estimatedSeconds / 3600) * 100) / 100,
          elapsedSeconds: item.elapsedSeconds ?? 0,
          serviceItemName: item.serviceItemDAS?.fullName || item.fieldOptionId,
        };
      });
    }

    // For BY_FIELD_OPTION (service-item) projects, having items
    // configured means the project IS estimated even when each
    // individual item — and therefore the project total — is 0
    // hours, OR when the supergraph reports `totalEstimatedSeconds: -1`
    // alongside a populated items array. In that mixed case we want
    // the budget cell to show the real summed total (zero, or the
    // sum of estimated items) instead of either the `-1` sentinel
    // or a misleading "Create estimate" CTA.
    const isServiceItemEstimate =
      node.projectEstimateType === 'BY_FIELD_OPTION';
    const hasItems = (estimateItems?.length ?? 0) > 0;
    const sumOfItemHours = (estimateItems ?? []).reduce(
      (acc, item) => acc + (item.estimatedHours > 0 ? item.estimatedHours : 0),
      0,
    );

    // The supergraph reports `totalEstimatedSeconds: -1` to mean "no
    // estimate set yet" (distinct from "estimated zero hours" which
    // comes back as 0). Preserve the sentinel through to the UI so
    // downstream code can render "—" only when truly unestimated and
    // never subtract -1 from `projectElapsedSeconds`.
    //
    // Caveat for service-item projects: if items exist, we synthesize
    // the project total from those items — see comment above.
    const supergraphProjectUnestimated =
      typeof node.totalEstimatedSeconds !== 'number' ||
      node.totalEstimatedSeconds < 0;
    let totalHours: number;
    if (!supergraphProjectUnestimated) {
      totalHours = Math.round((node.totalEstimatedSeconds / 3600) * 100) / 100;
    } else if (isServiceItemEstimate && hasItems) {
      totalHours = Math.round(sumOfItemHours * 100) / 100;
    } else {
      totalHours = -1;
    }
    const isProjectUnestimated = totalHours === -1;

    map[node.projectId] = {
      budgetHoursTotal: totalHours,
      // Preserve the unestimated sentinel on the remaining field too —
      // "remaining" is meaningless without a target.
      budgetHoursRemaining: isProjectUnestimated
        ? -1
        : Math.round((totalHours - elapsedHours) * 100) / 100,
      elapsedSeconds,
      totalEstimatedSeconds: node.totalEstimatedSeconds,
      projectEstimateType: node.projectEstimateType,
      fieldType: node.fieldType,
      fieldRef: node.fieldRef,
      estimateItems,
    };
  });
  return map;
};

export const useProjectEstimates = () => {
  const pageSize = useAdaptivePageSize();
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const dispatch = useAppDispatch();
  const estimatesMap = useAppSelector((state) => state.projects.estimatesMap);
  const estimatesLoading = useAppSelector(
    (state) => state.projects.estimatesLoading,
  );
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight paginated fetch when the hook unmounts.
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const [fetchEstimates] = useLazyQuery(GET_PROJECT_ESTIMATES, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const fetchAllEstimates = useCallback(
    async (projectRefs: ProjectRef[]) => {
      if (projectRefs.length === 0) return;

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      dispatch(setEstimatesLoading(true));
      // Clear any prior estimates error so a successful retry takes
      // the page out of the error state. The catch block below
      // re-sets it on a fresh failure.
      dispatch(setEstimatesError(null));
      // Intentionally do NOT clear `estimatesMap` here. After a successful
      // assignment-drawer or estimate-drawer save, the parent calls
      // `refetchProjects` which triggers this fetch. Clearing first would
      // briefly drop the currently-open project's estimate to `undefined`
      // and the summary view would flash its "no estimate yet" UI before
      // the new estimate arrives. `setEstimatesMap` does a shallow merge,
      // so stale rows stay visible and get overwritten in place once the
      // new payload lands.

      let after: string | undefined;
      let hasMore = true;
      const allEdges: ProjectEstimateEdge[] = [];

      try {
        // Wrap the entire pagination loop so the emitted `durationMs` reflects
        // the real user-perceived "load all estimates" latency in Splunk.
        await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_ESTIMATES_READ,
          event: {
            start: TIME_PROJECT_LOGGING_CONSTANTS.READS.ESTIMATES_FETCH_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.ESTIMATES_FETCH_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.ESTIMATES_FETCH_FAILURE,
          },
          extraProps: { projectCount: projectRefs.length, pageSize },
          run: async () => {
            while (hasMore) {
              if (ac.signal.aborted) return;

              // eslint-disable-next-line no-await-in-loop
              const { data, error } = await fetchEstimates({
                variables: {
                  projectRefs,
                  first: pageSize,
                  after,
                  itemsFirst: ITEMS_PAGE_SIZE,
                },
                context: {
                  headers: sandbox
                    ? getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_ESTIMATES_READ,
                      )
                    : undefined,
                },
              });

              if (ac.signal.aborted) return;
              if (error && !data) {
                throw error;
              }

              const response = data?.timeTrackingProjectEstimates as
                | ProjectEstimatesResponse
                | undefined;

              if (response?.edges) {
                allEdges.push(...response.edges);
              }

              hasMore = response?.pageInfo?.hasNextPage ?? false;
              after = response?.pageInfo?.endCursor || undefined;
            }
          },
        });

        if (!ac.signal.aborted) {
          const map = mapEdgesToEstimatesMap(allEdges);
          dispatch(setEstimatesMap(map));
        }
      } catch (err) {
        // withInteraction already logged the failure; surface a flag
        // to the page-level UI so it can render the dedicated
        // "We were not able to fetch estimates for the projects…"
        // error state in place of the table. Aborts (which fire when
        // the user navigates away or filters change) are swallowed
        // because they aren't real failures.
        if (!ac.signal.aborted) {
          dispatch(
            setEstimatesError(
              err instanceof Error ? err.message : 'Failed to fetch estimates',
            ),
          );
        }
      } finally {
        if (!ac.signal.aborted) {
          dispatch(setEstimatesLoading(false));
        }
      }
    },
    [dispatch, fetchEstimates, pageSize, logger, sandbox],
  );

  return {
    estimatesMap,
    estimatesLoading,
    fetchAllEstimates,
  };
};
