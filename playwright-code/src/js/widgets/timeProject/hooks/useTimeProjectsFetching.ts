import { useEffect, useCallback, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { useIsAccountantUser } from 'src/js/common/useIsAccountantUser';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { useAppDispatch, useAppSelector } from '../store';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import {
  TIME_PROJECT_LOGGING_CONSTANTS,
  ALL_PROJECT_STATUSES,
  PROJECT_SORT_ORDER,
} from '../constants';
import {
  setAllProjects,
  setFilteredResults,
  resetToAllProjects,
  setPageResults,
  setPageSize,
  invalidateCache,
  clearEstimates,
  clearProjectRefs,
  clearProjectParents,
} from '../store/projectsSlice';
import {
  setSearchText,
  setStatusFilter,
  setCustomerFilter,
  setSortOrder,
  setSearchProjectIds,
  clearSearchProjectIds,
  setDueDateRange,
  resetFilters,
  buildCacheKey,
} from '../store/filtersSlice';
import { setLoading, setError } from '../store/uiSlice';
import {
  TimeProjectRow,
  TimeProjectSortOrder,
  WorkProjectsResponse,
  WorkflowGlobalId,
  DueDateRange,
} from '../types';
import { escapeFilterValue } from '../utils/projectIdUtils';
import {
  DueDateFilterType,
  getFilterDateRange as getDueDateFilterRange,
  isDefaultDueDateRangeForUser,
} from '../utils/dateFilterUtils';
import { useProjectEstimates } from './useProjectEstimates';
import { useProjectCustomerLookup } from './useProjectCustomerLookup';
import { useProjectsSdkFlags } from './useProjectsSdkFlags';
import {
  GET_TIME_PROJECTS,
  GET_TIME_PROJECTS_WITH_CUSTOMERS,
  GET_WORKFLOW_PROJECTS,
} from '../graphql/queries';
import { useAdaptivePageSize } from './useAdaptivePageSize';
import { mapResponseToRows } from '../utils/projectRowMapper';

// Maps the UI status label to the value the Workflow API's filterBy accepts.
// Mirrors projects-plugin's _findKey(ProjectStatus) + toWorkflowStatus() chain:
// the API filter expects ProperCase enum key names, not ALL_CAPS enum values.
// 'Canceled' (single-l) comes from V4StatusMapper.toWorkflowStatus('Cancelled').
//
// Both "To do" (QBOA label) and "Not started" (QBO label) resolve to 'Open' —
// matching projects-plugin where both QbaStatus and QboStatus resolve
// ProjectStatus.Open to the same Workflow API value.
const toWorkflowApiStatus = (uiStatus: string): string => {
  const statusMap: Record<string, string> = {
    'In progress': 'Inprogress',
    Completed: 'Complete',
    'Not started': 'Open',
    'To do': 'Open',
    Canceled: 'Canceled',
    Cancelled: 'Canceled',
  };
  return statusMap[uiStatus] ?? uiStatus;
};

const buildWorkflowFilterString = (
  statusFilter: string,
  customerFilter: string,
  searchProjectIds: string[] | null,
  dueDateRange?: DueDateRange | null,
): string => {
  const conditions: string[] = [
    "deleted='false'",
    "inServiceToType in ('CONTACT')",
  ];

  if (statusFilter && statusFilter !== 'ALL') {
    conditions.push(
      `status='${escapeFilterValue(toWorkflowApiStatus(statusFilter))}'`,
    );
  }

  if (customerFilter) {
    conditions.push(
      `client.externalIds.localId='${escapeFilterValue(customerFilter)}'`,
    );
  }

  if (searchProjectIds?.length) {
    // Filter to only the projects resolved by the typeahead search.
    // `searchProjectIds` hold Workflow API global entity IDs extracted
    // from the OIGQL contact URN (e.g. `djQuMTo5...:767655383`), so
    // the `id` field filter is the correct match — same approach used
    // in projects-plugin's WorkflowDataTransformer.
    const ids = searchProjectIds
      .map((id) => `'${escapeFilterValue(id)}'`)
      .join(', ');
    conditions.push(`id in (${ids})`);
  }

  if (dueDateRange?.fromDate && dueDateRange?.toDate) {
    conditions.push(
      `dueDate between '${dueDateRange.fromDate}' and '${dueDateRange.toDate}'`,
    );
  }

  return conditions.join(' && ');
};

// Converts a TimeProjectSortOrder enum value to the plain string format
// the Workflow API's orderBy argument expects (matches projects-plugin behaviour).
const buildWorkflowOrderString = (sortOrder: TimeProjectSortOrder): string => {
  const orderMap: Record<string, string> = {
    NAME_ASC: 'pinned DESC, name ASC',
    NAME_DESC: 'pinned DESC, name DESC',
  };
  return orderMap[sortOrder] ?? 'pinned DESC, name ASC';
};

// Runtime guard that verifies a raw Apollo response value has the
// expected WorkProjectsResponse shape before mapping it.  Apollo's
// untyped `data` means the `as` cast alone is unverified; if either
// the Workflow or OIGQL API changes its response structure the cast
// would silently succeed while `mapResponseToRows` maps over undefined
// and returns empty rows.  Checking `edges` (the field `mapResponseToRows`
// iterates) is sufficient to distinguish a valid response from a broken
// or absent shape.
const isWorkProjectsResponse = (val: unknown): val is WorkProjectsResponse =>
  val != null &&
  typeof val === 'object' &&
  Array.isArray((val as Record<string, unknown>).edges);

interface AndCondition {
  status?: { matchesAny: string[] };
  customerId?: { matchesAny: string[] };
  deleted?: { equals: boolean };
}

interface WorkProjectFilter {
  or?: Array<{ and: AndCondition[] }>;
  workProjectSearch?: { searchText: string; name: Record<string, never> };
}

const buildFilterVariables = (
  statusFilter: string,
  customerFilter: string,
  searchText: string,
): WorkProjectFilter => {
  const andConditions: AndCondition[] = [];

  if (statusFilter && statusFilter !== 'ALL') {
    andConditions.push({ status: { matchesAny: [statusFilter] } });
  } else {
    andConditions.push({ status: { matchesAny: [...ALL_PROJECT_STATUSES] } });
  }

  andConditions.push({ deleted: { equals: false } });

  if (customerFilter) {
    andConditions.push({ customerId: { matchesAny: [customerFilter] } });
  }

  const filter: WorkProjectFilter = { or: [{ and: andConditions }] };

  if (searchText.trim()) {
    filter.workProjectSearch = { searchText: searchText.trim(), name: {} };
  }

  return filter;
};

interface UseTimeProjectsFetchingOptions {
  enabled?: boolean;
}

export const useTimeProjectsFetching = (
  options: UseTimeProjectsFetchingOptions = {},
) => {
  const { enabled = true } = options;
  // Computed synchronously from window.innerHeight before any API call fires.
  const pageSize = useAdaptivePageSize();
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);
  const { isAccountant, isLoading: isAccountantLoading } =
    useIsAccountantUser();
  const {
    isProjectsManageProjectsEnabled,
    loading: sdkFlagLoading,
    error: sdkFlagError,
  } = useProjectsSdkFlags();
  const isManageProjectsFlagResolved =
    isProjectsManageProjectsEnabled === true ||
    isProjectsManageProjectsEnabled === false ||
    !!sdkFlagError;
  const shouldIncludeCustomerData = isProjectsManageProjectsEnabled === true;

  const {
    isEnabled: isQboWorkflowEnabled,
    isLoading: isQboWorkflowFlagLoading,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_QBTIME_WORKFLOW_PROJECTS_API,
    defaultValue: false,
  });
  const {
    isEnabled: isWfsWorkflowEnabled,
    isLoading: isWfsWorkflowFlagLoading,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_WFS_QBTIME_WORKFLOW_PROJECTS_API,
    defaultValue: false,
  });
  const isWorkflowApiEnabled = isWorkforceUser
    ? isWfsWorkflowEnabled
    : isQboWorkflowEnabled;
  const isWorkflowFlagLoading = isWorkforceUser
    ? isWfsWorkflowFlagLoading
    : isQboWorkflowFlagLoading;
  const dispatch = useAppDispatch();
  const { filteredRows, pagination } = useAppSelector(
    (state) => state.projects,
  );
  const filters = useAppSelector((state) => state.filters);
  const loading = useAppSelector((state) => state.ui.loading);
  const error = useAppSelector((state) => state.ui.error);
  const uniqueCustomers = useAppSelector(
    (state) => state.projects.uniqueCustomers,
  );
  const initialLoadDone = useRef(false);
  const mountedRef = useRef(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorHistory = useRef<Array<string | null>>([null]);
  const { estimatesMap, estimatesLoading, fetchAllEstimates } =
    useProjectEstimates();
  const { fetchCustomersForProjects } = useProjectCustomerLookup();

  const [fetchProjectsWithCustomers] = useLazyQuery(
    GET_TIME_PROJECTS_WITH_CUSTOMERS,
    {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  );
  const [fetchProjectsWithoutCustomers] = useLazyQuery(GET_TIME_PROJECTS, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });
  const [fetchWorkflowProjects] = useLazyQuery(GET_WORKFLOW_PROJECTS, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });
  let fetchProjects: typeof fetchProjectsWithoutCustomers;
  if (isWorkflowApiEnabled) {
    fetchProjects = fetchWorkflowProjects;
  } else if (shouldIncludeCustomerData) {
    fetchProjects = fetchProjectsWithCustomers;
  } else {
    fetchProjects = fetchProjectsWithoutCustomers;
  }

  const executeQuery = useCallback(
    async (
      statusFilter: string,
      customerFilter: string,
      searchText: string,
      sortOrder: TimeProjectSortOrder,
      searchProjectIds: WorkflowGlobalId[] | null = null,
      after?: string | null,
      dueDateRange?: DueDateRange | null,
    ) => {
      // The page intentionally does NOT read from `cachedResults`. Every
      // filter / search / clear / refetch change must hit the network so
      // newly created or updated projects (especially in low-traffic
      // buckets like Cancelled / Completed) don't get masked by a stale
      // session cache. The Redux cache slice is still written by
      // `setFilteredResults` for telemetry / future reuse but is never
      // restored from here.
      const currentFilters = {
        statusFilter,
        customerFilter,
        searchText,
        sortOrder,
        searchProjectIds,
        dueDateRange: dueDateRange ?? null,
      };
      const cacheKey = buildCacheKey(currentFilters);
      const isDefaultFilter =
        !statusFilter &&
        !customerFilter &&
        !searchText.trim() &&
        !searchProjectIds?.length &&
        isDefaultDueDateRangeForUser(
          dueDateRange,
          isWorkflowApiEnabled,
          isAccountant,
        ) &&
        sortOrder === PROJECT_SORT_ORDER.NAME_ASC;

      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        // A fresh listing fetch invalidates everything keyed off the
        // previous page's project ids — both the per-project estimate
        // cache and the (projectId -> customerId) ref map. Clear them
        // up front so a downstream consumer that reads slice state mid-
        // fetch can't accidentally bind to a stale ref / estimate from
        // the prior filter context. The contacts-derived
        // `projectParents` map (assignment-save side channel) is
        // cleared in lockstep for the same reason.
        dispatch(clearProjectRefs());
        dispatch(clearProjectParents());
        dispatch(clearEstimates());

        const queryVariables = isWorkflowApiEnabled
          ? {
              pageSize,
              after: after || undefined,
              filter:
                buildWorkflowFilterString(
                  statusFilter,
                  customerFilter,
                  searchProjectIds,
                  dueDateRange,
                ) || null,
              order: buildWorkflowOrderString(sortOrder),
            }
          : {
              first: pageSize,
              after: after || undefined,
              filter: buildFilterVariables(
                statusFilter,
                customerFilter,
                searchText,
              ),
              orderBy: [sortOrder],
            };
        const { data, error: queryError } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_LIST_READ,
          event: {
            start:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.PROJECT_LIST_FETCH_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.PROJECT_LIST_FETCH_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.PROJECT_LIST_FETCH_FAILURE,
          },
          extraProps: {
            pageSize,
            hasStatusFilter: !!statusFilter,
            hasCustomerFilter: !!customerFilter,
            hasSearch: !!searchText.trim() || !!searchProjectIds?.length,
            page: 1,
            useWorkflowApi: isWorkflowApiEnabled,
          },
          isFailure: (res) => res.error?.message ?? null,
          run: () =>
            fetchProjects({
              variables: queryVariables,
              context: {
                ...(isWorkflowApiEnabled
                  ? { clientName: ApolloClientNames.WORKFLOW }
                  : {}),
                headers: {
                  ...(sandbox &&
                    getCustomerInteractionPropagationHeaders(
                      sandbox,
                      TimeCustomerInteraction.TIME_PROJECT_LIST_READ,
                    )),
                  ...(isWorkforceUser
                    ? { 'intuit-is-workforce-user': 'true' }
                    : {}),
                },
              },
            }),
        });

        if (queryError) {
          dispatch(setError(queryError.message));
          return;
        }

        const rawProjectsData = isWorkflowApiEnabled
          ? data?.company?.projects
          : data?.dataAccessWorkProjects;

        if (!isWorkProjectsResponse(rawProjectsData)) {
          logger.warn(
            TIME_PROJECT_LOGGING_CONSTANTS.READS
              .PROJECT_LIST_RESPONSE_SHAPE_INVALID,
            { isWorkflowApiEnabled },
          );
          dispatch(setError('An error occurred while loading projects.'));
          return;
        }

        const projectsData = rawProjectsData;
        const mappedRows = mapResponseToRows(projectsData.edges, {
          ...(isWorkflowApiEnabled ? { isAccountant } : {}),
          onUnknownStatus: (status) =>
            logger.warn(
              'Component=useTimeProjectsFetching Event=unknown_project_status',
              { status, isWorkflowApiEnabled },
            ),
        });
        const payload = {
          rows: mappedRows,
          totalCount: projectsData.totalCount || 0,
          hasNextPage: projectsData.pageInfo?.hasNextPage ?? false,
          endCursor: projectsData.pageInfo?.endCursor ?? null,
        };

        cursorHistory.current = [null];
        if (payload.endCursor) {
          cursorHistory.current.push(payload.endCursor);
        }

        if (isDefaultFilter) {
          dispatch(setAllProjects(payload));
        } else {
          dispatch(setFilteredResults({ ...payload, cacheKey }));
        }

        const projectIds = mappedRows.map((row) => row.projectId);
        // Dedupe — multiple projects on the page can share a customer,
        // and the OIGQL `parentId.matchesAny` filter only needs each
        // value once. Smaller filter inputs also keep the contacts
        // round-trip lighter.
        const parentCustomerIds = Array.from(
          new Set(
            mappedRows
              .map((row) => row.customerId)
              .filter((id): id is string => !!id),
          ),
        );
        if (projectIds.length > 0) {
          // Resolve `(projectId -> customerId)` from OIGQL contacts
          // FIRST so the project-estimates call can be issued with the
          // new `projectRefs` payload shape. Awaited so callers
          // (`refetchProjects`) can wait for the full "projects +
          // refs + per-project estimates" round-trip before they
          // resolve — drawers rely on that promise to keep their
          // saving spinner up until the page is fully back in sync.
          const refs = await fetchCustomersForProjects(
            projectIds,
            parentCustomerIds,
            { shouldBackfillCustomerNames: isWorkflowApiEnabled },
          );
          const projectRefList = Object.values(refs);
          if (projectRefList.length > 0) {
            await fetchAllEstimates(projectRefList);
          }
        }
      } catch (err) {
        dispatch(
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to fetch time projects',
          ),
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [
      dispatch,
      fetchProjects,
      fetchAllEstimates,
      fetchCustomersForProjects,
      pageSize,
      logger,
      sandbox,
      isWorkforceUser,
      isWorkflowApiEnabled,
      isAccountant,
    ],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Keep Redux pagination.pageSize in sync so the pagination component
  // calculates totalPages = ceil(totalCount / pageSize) correctly.
  useEffect(() => {
    dispatch(setPageSize(pageSize));
  }, [dispatch, pageSize]);

  useEffect(() => {
    if (
      enabled &&
      isManageProjectsFlagResolved &&
      !sdkFlagLoading &&
      !isWorkflowFlagLoading &&
      // On the Workflow path, isAccountant controls which status badge
      // (TODO vs NOT_STARTED) is rendered for Open projects. If the
      // variability SDK hasn't resolved yet, isAccountant defaults to false
      // and QBOA users would receive NOT_STARTED badges on first load with
      // no subsequent re-fetch (initialLoadDone prevents it). Guard the
      // initial fetch until the SDK resolves. On the OIGQL path isAccountant
      // is irrelevant so we skip the guard to avoid any unnecessary delay.
      (!isWorkflowApiEnabled || !isAccountantLoading) &&
      !initialLoadDone.current
    ) {
      initialLoadDone.current = true;
      // Mirror projects-plugin: QBOA accountants on the Workflow path always
      // start with the default CUSTOM_RANGE (-3 months → +9 months) rather
      // than "all dates". Dispatch so the filter UI reflects the selection.
      const defaultDueDateRange =
        isWorkflowApiEnabled && isAccountant
          ? getDueDateFilterRange(DueDateFilterType.CUSTOM_RANGE)
          : null;
      if (defaultDueDateRange) {
        dispatch(setDueDateRange(defaultDueDateRange));
      }
      executeQuery(
        '',
        '',
        '',
        PROJECT_SORT_ORDER.NAME_ASC,
        null,
        null,
        defaultDueDateRange,
      );
    }
  }, [
    enabled,
    isManageProjectsFlagResolved,
    sdkFlagLoading,
    isWorkflowFlagLoading,
    isWorkflowApiEnabled,
    isAccountant,
    isAccountantLoading,
    dispatch,
    executeQuery,
  ]);

  const handleStatusChange = useCallback(
    (status: string) => {
      const newStatus = status === 'ALL' ? '' : status;
      if (newStatus === filters.statusFilter) return;
      dispatch(setStatusFilter(newStatus));
      executeQuery(
        newStatus,
        filters.customerFilter,
        filters.searchText,
        filters.sortOrder,
        filters.searchProjectIds,
        null,
        filters.dueDateRange,
      );
    },
    [
      dispatch,
      executeQuery,
      filters.statusFilter,
      filters.customerFilter,
      filters.searchText,
      filters.sortOrder,
      filters.searchProjectIds,
      filters.dueDateRange,
    ],
  );

  const handleCustomerChange = useCallback(
    (customerId: string) => {
      dispatch(setCustomerFilter(customerId));
      executeQuery(
        filters.statusFilter,
        customerId,
        filters.searchText,
        filters.sortOrder,
        filters.searchProjectIds,
        null,
        filters.dueDateRange,
      );
    },
    [
      dispatch,
      executeQuery,
      filters.statusFilter,
      filters.searchText,
      filters.sortOrder,
      filters.searchProjectIds,
      filters.dueDateRange,
    ],
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      dispatch(setSearchText(text));
      dispatch(clearSearchProjectIds());
      executeQuery(
        filters.statusFilter,
        filters.customerFilter,
        text,
        filters.sortOrder,
        null,
        null,
        filters.dueDateRange,
      );
    },
    [
      dispatch,
      executeQuery,
      filters.statusFilter,
      filters.customerFilter,
      filters.sortOrder,
      filters.dueDateRange,
    ],
  );

  const handleSortChange = useCallback(() => {
    const nextSortOrder: TimeProjectSortOrder =
      filters.sortOrder === PROJECT_SORT_ORDER.NAME_ASC
        ? PROJECT_SORT_ORDER.NAME_DESC
        : PROJECT_SORT_ORDER.NAME_ASC;
    dispatch(setSortOrder(nextSortOrder));
    executeQuery(
      filters.statusFilter,
      filters.customerFilter,
      filters.searchText,
      nextSortOrder,
      filters.searchProjectIds,
      null,
      filters.dueDateRange,
    );
  }, [
    dispatch,
    executeQuery,
    filters.sortOrder,
    filters.statusFilter,
    filters.customerFilter,
    filters.searchText,
    filters.searchProjectIds,
    filters.dueDateRange,
  ]);

  const handleClearFilters = useCallback(() => {
    dispatch(resetFilters());
    dispatch(resetToAllProjects());
    // Mirrors projects-plugin: clearing all filters resets due-date back to
    // the CUSTOM_RANGE default for QBOA accountants on the Workflow path.
    const resetDueDateRange =
      isWorkflowApiEnabled && isAccountant
        ? getDueDateFilterRange(DueDateFilterType.CUSTOM_RANGE)
        : null;
    if (resetDueDateRange) {
      dispatch(setDueDateRange(resetDueDateRange));
    }
    executeQuery(
      '',
      '',
      '',
      PROJECT_SORT_ORDER.NAME_ASC,
      null,
      null,
      resetDueDateRange,
    );
  }, [dispatch, executeQuery, isWorkflowApiEnabled, isAccountant]);

  const handleDueDateChange = useCallback(
    (newDueDateRange: DueDateRange) => {
      dispatch(setDueDateRange(newDueDateRange));
      executeQuery(
        filters.statusFilter,
        filters.customerFilter,
        filters.searchText,
        filters.sortOrder,
        filters.searchProjectIds,
        null,
        newDueDateRange,
      );
    },
    [
      dispatch,
      executeQuery,
      filters.statusFilter,
      filters.customerFilter,
      filters.searchText,
      filters.sortOrder,
      filters.searchProjectIds,
    ],
  );

  // Triggered by Enter-to-filter in ProjectSearchTypeahead. Takes the
  // IDs resolved by the typeahead contacts search and re-fetches the
  // Workflow project list filtered to exactly those projects.
  const handleFilterByProjectIds = useCallback(
    (ids: WorkflowGlobalId[], displayText: string) => {
      dispatch(setSearchProjectIds(ids));
      dispatch(setSearchText(displayText));
      executeQuery(
        filters.statusFilter,
        filters.customerFilter,
        displayText,
        filters.sortOrder,
        ids,
        null,
        filters.dueDateRange,
      );
    },
    [
      dispatch,
      executeQuery,
      filters.statusFilter,
      filters.customerFilter,
      filters.sortOrder,
      filters.dueDateRange,
    ],
  );

  const handlePageChange = useCallback(
    async (newPage: number) => {
      if (loadingMore || newPage === pagination.page) return;

      const afterCursor = cursorHistory.current[newPage - 1] ?? null;

      try {
        if (!mountedRef.current) return;
        setLoadingMore(true);
        dispatch(setError(null));
        // A page change is a fresh server fetch — same rule as in
        // `executeQuery`: invalidate previous-page-derived state up
        // front so no consumer reads a stale ref / estimate / parent.
        dispatch(clearProjectRefs());
        dispatch(clearProjectParents());
        dispatch(clearEstimates());

        const pageQueryVariables = isWorkflowApiEnabled
          ? {
              pageSize,
              after: afterCursor || undefined,
              filter: buildWorkflowFilterString(
                filters.statusFilter,
                filters.customerFilter,
                filters.searchProjectIds,
                filters.dueDateRange,
              ),
              order: buildWorkflowOrderString(filters.sortOrder),
            }
          : {
              first: pageSize,
              after: afterCursor || undefined,
              filter: buildFilterVariables(
                filters.statusFilter,
                filters.customerFilter,
                filters.searchText,
              ),
              orderBy: [filters.sortOrder],
            };
        const { data, error: queryError } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_LIST_READ,
          event: {
            start:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.PROJECT_LIST_FETCH_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.PROJECT_LIST_FETCH_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.PROJECT_LIST_FETCH_FAILURE,
          },
          extraProps: {
            pageSize,
            page: newPage,
            paginated: true,
            useWorkflowApi: isWorkflowApiEnabled,
          },
          isFailure: (res) => res.error?.message ?? null,
          run: () =>
            fetchProjects({
              variables: pageQueryVariables,
              context: {
                ...(isWorkflowApiEnabled
                  ? { clientName: ApolloClientNames.WORKFLOW }
                  : {}),
                headers: {
                  ...(sandbox &&
                    getCustomerInteractionPropagationHeaders(
                      sandbox,
                      TimeCustomerInteraction.TIME_PROJECT_LIST_READ,
                    )),
                  ...(isWorkforceUser
                    ? { 'intuit-is-workforce-user': 'true' }
                    : {}),
                },
              },
            }),
        });

        if (queryError) {
          dispatch(setError(queryError.message));
          return;
        }

        const rawProjectsData = isWorkflowApiEnabled
          ? data?.company?.projects
          : data?.dataAccessWorkProjects;

        if (!isWorkProjectsResponse(rawProjectsData)) {
          logger.warn(
            TIME_PROJECT_LOGGING_CONSTANTS.READS
              .PROJECT_LIST_RESPONSE_SHAPE_INVALID,
            { isWorkflowApiEnabled },
          );
          dispatch(setError('An error occurred while loading projects.'));
          return;
        }

        const projectsData = rawProjectsData;
        const mappedRows = mapResponseToRows(projectsData.edges, {
          ...(isWorkflowApiEnabled ? { isAccountant } : {}),
          onUnknownStatus: (status) =>
            logger.warn(
              'Component=useTimeProjectsFetching Event=unknown_project_status',
              { status, isWorkflowApiEnabled },
            ),
        });

        dispatch(
          setPageResults({
            rows: mappedRows,
            totalCount: projectsData.totalCount || 0,
            hasNextPage: projectsData.pageInfo?.hasNextPage ?? false,
            endCursor: projectsData.pageInfo?.endCursor ?? null,
            page: newPage,
          }),
        );

        const pageProjectIds = mappedRows.map((row) => row.projectId);
        const pageParentCustomerIds = Array.from(
          new Set(
            mappedRows
              .map((row) => row.customerId)
              .filter((id): id is string => !!id),
          ),
        );
        if (pageProjectIds.length > 0) {
          // Same chain as the initial fetch: contacts first, then
          // estimates with the resolved refs. Fire-and-forget — the
          // page-change UX shouldn't block on the round-trip. The
          // lookup hook itself guards against out-of-order completion
          // via its internal request-seq counter, so a slow earlier
          // page can't stomp a newer page's refs.
          fetchCustomersForProjects(pageProjectIds, pageParentCustomerIds, {
            shouldBackfillCustomerNames: isWorkflowApiEnabled,
          })
            .then((refs) => {
              const refList = Object.values(refs);
              if (refList.length > 0) {
                fetchAllEstimates(refList);
              }
            })
            .catch((err) => {
              // The lookup hook already logs known failure modes; this
              // catch is a backstop for unanticipated rejections. Log
              // at error-level so the failure is observable in Splunk
              // — without it, a fan-out failure on a page change would
              // drop estimates silently.
              logger.error(
                'Component=useTimeProjectsFetching Event=Page Refs Lookup Threw',
                {
                  errorMessage:
                    err instanceof Error ? err.message : String(err),
                  errorName: err instanceof Error ? err.name : undefined,
                  page: newPage,
                  pageSize,
                },
              );
            });
        }

        const endCursor = projectsData?.pageInfo?.endCursor;
        if (endCursor && cursorHistory.current.length <= newPage) {
          cursorHistory.current.push(endCursor);
        }
      } catch (err) {
        dispatch(
          setError(
            err instanceof Error ? err.message : 'Failed to load more projects',
          ),
        );
      } finally {
        if (mountedRef.current) {
          setLoadingMore(false);
        }
      }
    },
    [
      dispatch,
      fetchProjects,
      fetchCustomersForProjects,
      filters,
      loadingMore,
      pagination.page,
      fetchAllEstimates,
      pageSize,
      logger,
      sandbox,
      isWorkforceUser,
      isWorkflowApiEnabled,
      isAccountant,
    ],
  );

  const refetchProjects = useCallback(async (): Promise<void> => {
    dispatch(invalidateCache());
    // Returns the underlying promise so callers can `await` the full
    // refresh - both the project-list query and the per-project
    // estimates fan-out - before they consider the page "in sync"
    // again. The estimate / assign drawers use this to keep their
    // saving spinner visible until the summary view actually has
    // fresh data to render.
    await executeQuery(
      filters.statusFilter,
      filters.customerFilter,
      filters.searchText,
      filters.sortOrder,
      filters.searchProjectIds,
      null,
      filters.dueDateRange,
    );
  }, [dispatch, executeQuery, filters]);

  return {
    rows: filteredRows,
    pagination,
    loading,
    loadingMore,
    error,
    filters,
    uniqueCustomers,
    estimatesMap,
    estimatesLoading,
    isAccountant,
    isWorkflowApiEnabled,
    handlePageChange,
    handleStatusChange,
    handleCustomerChange,
    handleSearchChange,
    handleFilterByProjectIds,
    handleSortChange,
    handleClearFilters,
    handleDueDateChange,
    refetchProjects,
  };
};
