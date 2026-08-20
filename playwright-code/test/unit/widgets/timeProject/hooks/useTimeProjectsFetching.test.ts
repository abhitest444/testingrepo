import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useLazyQuery } from '@apollo/client';
import projectsReducer from 'src/js/widgets/timeProject/store/projectsSlice';
import filtersReducer from 'src/js/widgets/timeProject/store/filtersSlice';
import uiReducer from 'src/js/widgets/timeProject/store/uiSlice';
import settingsReducer from 'src/js/widgets/timeProject/store/settingsSlice';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { useProjectsSdkFlags } from 'src/js/widgets/timeProject/hooks/useProjectsSdkFlags';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import {
  DEFAULT_PAGE_SIZE,
  ALL_PROJECT_STATUSES,
  PROJECT_SORT_ORDER,
} from 'src/js/widgets/timeProject/constants';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { WorkflowGlobalId } from 'src/js/widgets/timeProject/types';

import { useTimeProjectsFetching } from 'src/js/widgets/timeProject/hooks/useTimeProjectsFetching';

const mockFetchProjects = jest.fn();
const mockFetchAllEstimates = jest.fn();
// `useProjectCustomerLookup.fetchCustomersForProjects` returns a
// `Record<projectId, ProjectRef>`. Default to empty so the production
// code's `Object.values(refs)` short-circuits past the estimates call —
// tests that need the estimates call to fire override the resolved
// value per-test.
const mockFetchCustomersForProjects = jest
  .fn()
  .mockResolvedValue({} as Record<string, never>);

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(() => [mockFetchProjects]),
}));

jest.mock('src/js/widgets/timeProject/hooks/useProjectsSdkFlags', () => ({
  useProjectsSdkFlags: jest.fn(),
}));

const mockUseIXPFeatureFlag = jest.fn();
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  ...jest.requireActual('src/js/service/utils/sandboxUtils'),
  isWorkforceEnvironment: jest.fn(() => false),
}));

jest.mock('src/js/widgets/timeProject/hooks/useAdaptivePageSize', () => ({
  useAdaptivePageSize: () => DEFAULT_PAGE_SIZE,
}));

jest.mock('src/js/common/useIsAccountantUser', () => ({
  useIsAccountantUser: jest.fn(() => ({
    isAccountant: false,
    isLoading: false,
  })),
}));

jest.mock('src/js/widgets/timeProject/hooks/useProjectEstimates', () => ({
  useProjectEstimates: () => ({
    estimatesMap: {},
    estimatesLoading: false,
    fetchAllEstimates: mockFetchAllEstimates,
  }),
}));

jest.mock('src/js/widgets/timeProject/hooks/useProjectCustomerLookup', () => ({
  useProjectCustomerLookup: () => ({
    fetchCustomersForProjects: mockFetchCustomersForProjects,
  }),
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      projects: projectsReducer,
      filters: filtersReducer,
      ui: uiReducer,
      settings: settingsReducer,
    },
  });

const createWrapper =
  (store: ReturnType<typeof createTestStore>): React.FC =>
  ({ children }) =>
    React.createElement(Provider, { store } as any, children);

const buildEdge = (overrides: Record<string, any> = {}) => ({
  node: {
    id: 'proj-1',
    name: 'Project Alpha',
    status: 'IN_PROGRESS',
    customerId: 'cust-1',
    dueDate: '2026-06-01',
    startDate: '2026-01-01',
    completedDate: null,
    active: true,
    description: 'Test project',
    customer: {
      id: 'cust-1',
      companyId: 'comp-1',
      fullName: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      displayName: 'Jane Doe Inc',
    },
    ...overrides,
  },
  cursor: 'cursor-1',
});

const buildSuccessResponse = (
  edges = [buildEdge()],
  pageInfo: { hasNextPage: boolean; endCursor: string | null } = {
    hasNextPage: false,
    endCursor: null,
  },
  totalCount = edges.length,
) => ({
  data: {
    dataAccessWorkProjects: {
      edges,
      pageInfo,
      totalCount,
    },
  },
  error: undefined,
});

describe('useTimeProjectsFetching', () => {
  const mockUseProjectsSdkFlags = useProjectsSdkFlags as jest.MockedFunction<
    typeof useProjectsSdkFlags
  >;
  const mockIsWorkforceEnvironment =
    isWorkforceEnvironment as jest.MockedFunction<
      typeof isWorkforceEnvironment
    >;

  const mockUseIXPFeatureFlagTyped = useIXPFeatureFlag as jest.MockedFunction<
    typeof useIXPFeatureFlag
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseProjectsSdkFlags.mockReturnValue({
      isProjectsManageProjectsEnabled: true,
      isProjectsAssignWorkersEnabled: true,
      isProjectsEditEstimatesEnabled: true,
      isProjectsEditDateEnabled: true,
      loading: false,
      error: undefined,
    });
    // Default: workflow API disabled and flag fully resolved so the
    // existing non-workflow tests aren't blocked by isWorkflowFlagLoading.
    mockUseIXPFeatureFlagTyped.mockReturnValue({
      isEnabled: false,
      isLoading: false,
      settled: true,
      error: null,
    });
    mockFetchProjects.mockResolvedValue(buildSuccessResponse());
    mockFetchAllEstimates.mockResolvedValue(undefined);
  });

  it('should call useLazyQuery with network-only fetch policy', () => {
    const store = createTestStore();
    renderHook(() => useTimeProjectsFetching(), {
      wrapper: createWrapper(store),
    });

    expect(useLazyQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      }),
    );
  });

  it('should fetch projects on mount with all status filter', async () => {
    const store = createTestStore();
    const { waitForNextUpdate } = renderHook(() => useTimeProjectsFetching(), {
      wrapper: createWrapper(store),
    });

    await waitForNextUpdate();

    expect(mockFetchProjects).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          first: DEFAULT_PAGE_SIZE,
          after: undefined,
          filter: {
            or: [
              {
                and: [
                  { status: { matchesAny: [...ALL_PROJECT_STATUSES] } },
                  { deleted: { equals: false } },
                ],
              },
            ],
          },
          orderBy: [PROJECT_SORT_ORDER.NAME_ASC],
        },
      }),
    );
  });

  it('should pass workforce header in projects query context for WFS', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    const store = createTestStore();
    const { waitForNextUpdate } = renderHook(() => useTimeProjectsFetching(), {
      wrapper: createWrapper(store),
    });

    await waitForNextUpdate();

    expect(mockFetchProjects).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { headers: { 'intuit-is-workforce-user': 'true' } },
      }),
    );
  });

  it('does not fetch projects before manage-projects flag resolves', async () => {
    const store = createTestStore();
    mockUseProjectsSdkFlags.mockReturnValue({
      isProjectsManageProjectsEnabled: undefined,
      isProjectsAssignWorkersEnabled: undefined,
      isProjectsEditEstimatesEnabled: undefined,
      isProjectsEditDateEnabled: undefined,
      loading: false,
      error: undefined,
    });

    renderHook(() => useTimeProjectsFetching(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchProjects).not.toHaveBeenCalled();
  });

  it('fetches projects when manage-projects flag lookup errors', async () => {
    const store = createTestStore();
    mockUseProjectsSdkFlags.mockReturnValue({
      isProjectsManageProjectsEnabled: undefined,
      isProjectsAssignWorkersEnabled: undefined,
      isProjectsEditEstimatesEnabled: undefined,
      isProjectsEditDateEnabled: undefined,
      loading: false,
      error: new Error('sdk flag failed'),
    });
    const { waitForNextUpdate } = renderHook(() => useTimeProjectsFetching(), {
      wrapper: createWrapper(store),
    });

    await waitForNextUpdate();

    expect(mockFetchProjects).toHaveBeenCalled();
  });

  it('should map successful response to Redux store', async () => {
    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0]).toMatchObject({
      projectId: 'proj-1',
      projectName: 'Project Alpha',
      customerName: 'Jane Doe Inc',
      status: 'IN_PROGRESS',
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return filters and handler functions', async () => {
    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.filters).toEqual({
      searchText: '',
      statusFilter: '',
      customerFilter: '',
      sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
      searchProjectIds: null,
      dueDateRange: null,
    });
    expect(typeof result.current.handlePageChange).toBe('function');
    expect(typeof result.current.handleStatusChange).toBe('function');
    expect(typeof result.current.handleCustomerChange).toBe('function');
    expect(typeof result.current.handleSearchChange).toBe('function');
    expect(typeof result.current.handleSortChange).toBe('function');
    expect(typeof result.current.handleClearFilters).toBe('function');
    expect(typeof result.current.refetchProjects).toBe('function');
  });

  it('should extract unique customers', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse([
        buildEdge({
          id: 'p1',
          customerId: 'cust-1',
          customer: {
            id: 'cid-1',
            companyId: 'c1',
            fullName: 'A',
            firstName: 'A',
            lastName: 'A',
            displayName: 'Alpha Co',
          },
        }),
        buildEdge({
          id: 'p2',
          customerId: 'cust-2',
          customer: {
            id: 'cid-2',
            companyId: 'c2',
            fullName: 'B',
            firstName: 'B',
            lastName: 'B',
            displayName: 'Beta Co',
          },
        }),
      ]),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.uniqueCustomers).toHaveLength(2);
    expect(result.current.uniqueCustomers).toEqual([
      { customerId: 'cid-1', displayName: 'Alpha Co' },
      { customerId: 'cid-2', displayName: 'Beta Co' },
    ]);
  });

  describe('status mapping', () => {
    const statusCases: [string, string][] = [
      ['IN_PROGRESS', 'IN_PROGRESS'],
      ['COMPLETE', 'COMPLETED'],
      // 'OPEN' is the Workflow API's "Not started" equivalent and now maps
      // to TODO so the badge is consistent with the hidden "Not started"
      // dropdown option on the Workflow path.
      ['OPEN', 'TODO'],
      // Backend "TODO" is its own first-class UI status.
      ['TODO', 'TODO'],
      ['CANCELLED', 'CANCELLED'],
      ['UNKNOWN_STATUS', 'NOT_STARTED'],
    ];

    it.each(statusCases)(
      'should map API status "%s" to UI status "%s"',
      async (apiStatus, expectedUiStatus) => {
        mockFetchProjects.mockResolvedValue(
          buildSuccessResponse([buildEdge({ status: apiStatus })]),
        );

        const store = createTestStore();
        const { result, waitForNextUpdate } = renderHook(
          () => useTimeProjectsFetching(),
          { wrapper: createWrapper(store) },
        );

        await waitForNextUpdate();

        expect(result.current.rows[0].status).toBe(expectedUiStatus);
      },
    );
  });

  it('should set error from GraphQL query error', async () => {
    mockFetchProjects.mockResolvedValue({
      data: null,
      error: { message: 'GraphQL error occurred' },
    });

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.error).toBe('GraphQL error occurred');
    expect(result.current.loading).toBe(false);
  });

  it('should set error when fetchProjects throws', async () => {
    mockFetchProjects.mockRejectedValue(new Error('Network failure'));

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.error).toBe('Network failure');
    expect(result.current.loading).toBe(false);
  });

  it('should handle empty data response', async () => {
    mockFetchProjects.mockResolvedValue({ data: null, error: undefined });

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.rows).toEqual([]);
    expect(result.current.pagination.totalCount).toBe(0);
  });

  it('should update status filter and refetch', async () => {
    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();
    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(buildSuccessResponse());

    await act(async () => {
      result.current.handleStatusChange('In progress');
    });

    const calledFilter = mockFetchProjects.mock.calls[0][0].variables.filter;
    expect(calledFilter.or[0].and).toEqual(
      expect.arrayContaining([{ status: { matchesAny: ['In progress'] } }]),
    );
  });

  it('should update customer filter and refetch', async () => {
    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();
    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(buildSuccessResponse());

    await act(async () => {
      result.current.handleCustomerChange('comp-1');
    });

    const calledFilter = mockFetchProjects.mock.calls[0][0].variables.filter;
    expect(calledFilter.or[0].and).toEqual(
      expect.arrayContaining([{ customerId: { matchesAny: ['comp-1'] } }]),
    );
  });

  it('should handle search text change with debounce', async () => {
    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();
    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(buildSuccessResponse());

    await act(async () => {
      result.current.handleSearchChange('kitchen');
    });

    const calledFilter = mockFetchProjects.mock.calls[0][0].variables.filter;
    expect(calledFilter.workProjectSearch).toEqual({
      searchText: 'kitchen',
      name: {},
    });
  });

  it('should fetch next page on handlePageChange', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge()],
        { hasNextPage: true, endCursor: 'cursor-page-1' },
        12,
      ),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge({ id: 'proj-2', name: 'Page 2 Project' })],
        { hasNextPage: false, endCursor: null },
        12,
      ),
    );

    await act(async () => {
      await result.current.handlePageChange(2);
    });

    expect(mockFetchProjects).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          first: DEFAULT_PAGE_SIZE,
          after: 'cursor-page-1',
          filter: expect.any(Object),
          orderBy: [PROJECT_SORT_ORDER.NAME_ASC],
        },
      }),
    );
    expect(result.current.pagination.page).toBe(2);
  });

  it('should not fetch when page does not change', async () => {
    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();
    mockFetchProjects.mockClear();

    await act(async () => {
      await result.current.handlePageChange(1);
    });

    expect(mockFetchProjects).not.toHaveBeenCalled();
  });

  it('should clear filters and reset to all projects', async () => {
    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    await act(async () => {
      result.current.handleStatusChange('In progress');
    });

    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(buildSuccessResponse());

    await act(async () => {
      result.current.handleClearFilters();
    });

    expect(result.current.filters).toEqual({
      searchText: '',
      statusFilter: '',
      customerFilter: '',
      sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
      searchProjectIds: null,
      dueDateRange: null,
    });
  });

  it('refetchProjects should bypass cache and re-fetch', async () => {
    const store = createTestStore();
    mockFetchProjects.mockResolvedValue(buildSuccessResponse());
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );
    await waitForNextUpdate();

    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(buildSuccessResponse());

    await act(async () => {
      result.current.refetchProjects();
    });

    expect(mockFetchProjects).toHaveBeenCalledTimes(1);
  });

  it('should always make a fresh API call on status change, even for previously seen filters', async () => {
    // Status changes intentionally bypass the cache. Otherwise picking
    // a status the user has already selected once in this session
    // (e.g., Cancelled, Completed) would silently hydrate from
    // `cachedResults` and miss any newly created / updated projects in
    // that bucket.
    const store = createTestStore();
    mockFetchProjects.mockResolvedValue(buildSuccessResponse());

    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );
    await waitForNextUpdate();

    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(buildSuccessResponse());

    await act(async () => {
      result.current.handleStatusChange('In progress');
    });

    expect(mockFetchProjects).toHaveBeenCalledTimes(1);

    mockFetchProjects.mockClear();

    await act(async () => {
      result.current.handleStatusChange('ALL');
    });
    // ALL also fires a fresh fetch (different filter than In progress).
    expect(mockFetchProjects).toHaveBeenCalledTimes(1);

    mockFetchProjects.mockClear();

    await act(async () => {
      result.current.handleStatusChange('In progress');
    });

    // Re-selecting "In progress" — even though we have a cached result
    // for it — must still hit the network.
    expect(mockFetchProjects).toHaveBeenCalledTimes(1);
  });

  it('should handle GraphQL error on page change', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge()],
        { hasNextPage: true, endCursor: 'cursor-1' },
        12,
      ),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );
    await waitForNextUpdate();

    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue({
      data: null,
      error: { message: 'Page change error' },
    });

    await act(async () => {
      await result.current.handlePageChange(2);
    });

    expect(result.current.error).toBe('Page change error');
  });

  it('should handle exception thrown during page change', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge()],
        { hasNextPage: true, endCursor: 'cursor-1' },
        12,
      ),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );
    await waitForNextUpdate();

    mockFetchProjects.mockClear();
    mockFetchProjects.mockRejectedValue(new Error('Network down'));

    await act(async () => {
      await result.current.handlePageChange(2);
    });

    expect(result.current.error).toBe('Network down');
  });

  it('should skip pushing to cursorHistory when endCursor is null', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge()],
        { hasNextPage: true, endCursor: 'cursor-1' },
        12,
      ),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );
    await waitForNextUpdate();

    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge({ id: 'proj-2' })],
        { hasNextPage: false, endCursor: null },
        12,
      ),
    );

    await act(async () => {
      await result.current.handlePageChange(2);
    });

    expect(result.current.pagination.page).toBe(2);
  });

  it('should handle non-Error exception during page change', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge()],
        { hasNextPage: true, endCursor: 'cursor-1' },
        12,
      ),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );
    await waitForNextUpdate();

    mockFetchProjects.mockClear();
    mockFetchProjects.mockRejectedValue('string error');

    await act(async () => {
      await result.current.handlePageChange(2);
    });

    expect(result.current.error).toBe('Failed to load more projects');
  });

  it('should call fetchAllEstimates with the resolved projectRefs after initial project fetch', async () => {
    // The contacts lookup resolves before estimates fire — point the
    // mock at a populated refs map so the chain produces a non-empty
    // ProjectRef list for `fetchAllEstimates`.
    mockFetchCustomersForProjects.mockResolvedValueOnce({
      'proj-1': { projectId: 'proj-1', customerId: 'cust-1' },
    });
    const store = createTestStore();
    const { waitForNextUpdate } = renderHook(() => useTimeProjectsFetching(), {
      wrapper: createWrapper(store),
    });

    await waitForNextUpdate();

    expect(mockFetchAllEstimates).toHaveBeenCalledWith([
      { projectId: 'proj-1', customerId: 'cust-1' },
    ]);
  });

  it('should not call fetchAllEstimates when no projects returned', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse([], { hasNextPage: false, endCursor: null }, 0),
    );

    const store = createTestStore();
    const { waitForNextUpdate } = renderHook(() => useTimeProjectsFetching(), {
      wrapper: createWrapper(store),
    });

    await waitForNextUpdate();

    expect(mockFetchAllEstimates).not.toHaveBeenCalled();
  });

  it('should return estimatesMap and estimatesLoading', async () => {
    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.estimatesMap).toEqual({});
    expect(result.current.estimatesLoading).toBe(false);
  });

  it('should not fetch when enabled is false', () => {
    const store = createTestStore();
    renderHook(() => useTimeProjectsFetching({ enabled: false }), {
      wrapper: createWrapper(store),
    });

    expect(mockFetchProjects).not.toHaveBeenCalled();
  });

  it('should not re-fetch when ALL status is re-selected without change', async () => {
    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();
    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(buildSuccessResponse());

    await act(async () => {
      result.current.handleStatusChange('ALL');
    });

    expect(mockFetchProjects).not.toHaveBeenCalled();
  });

  it('should handle non-Error thrown during initial fetch', async () => {
    mockFetchProjects.mockRejectedValue('string error');

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.error).toBe('Failed to fetch time projects');
  });

  it('should map node without customer to null', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse([buildEdge({ customer: null })]),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.rows[0].customerName).toBe('');
    expect(result.current.rows[0].customer).toBeNull();
  });

  it('should map node with fullName fallback when displayName is missing', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse([
        buildEdge({
          customer: {
            id: 'c1',
            companyId: 'comp',
            fullName: 'FullName Corp',
            firstName: 'F',
            lastName: 'L',
            displayName: '',
          },
        }),
      ]),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.rows[0].customerName).toBe('FullName Corp');
  });

  it('should handle endCursor in initial response', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge()],
        { hasNextPage: true, endCursor: 'cur1' },
        10,
      ),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );

    await waitForNextUpdate();

    expect(result.current.pagination.hasNextPage).toBe(true);
  });

  it('should call fetchAllEstimates after page change with the resolved projectRefs', async () => {
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge()],
        { hasNextPage: true, endCursor: 'cursor-1' },
        12,
      ),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );
    await waitForNextUpdate();

    mockFetchAllEstimates.mockClear();
    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge({ id: 'proj-2', name: 'Page 2' })],
        { hasNextPage: false, endCursor: null },
        12,
      ),
    );
    // Fresh page → fresh contacts lookup. Mock the resolved refs for
    // proj-2 so the estimates call has something to fan out on.
    mockFetchCustomersForProjects.mockResolvedValueOnce({
      'proj-2': { projectId: 'proj-2', customerId: 'cust-2' },
    });

    await act(async () => {
      await result.current.handlePageChange(2);
    });

    expect(mockFetchAllEstimates).toHaveBeenCalledWith([
      { projectId: 'proj-2', customerId: 'cust-2' },
    ]);
  });

  it('should swallow a rejected contacts lookup on page change without calling fetchAllEstimates', async () => {
    // Backstop catch on the page-change refs lookup: if the lookup
    // hook throws, we should NOT issue a project-estimates request
    // with a stale ref list — and the page-change handler must still
    // settle cleanly so the user isn't stuck behind a stale spinner.
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge()],
        { hasNextPage: true, endCursor: 'cursor-1' },
        12,
      ),
    );
    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useTimeProjectsFetching(),
      { wrapper: createWrapper(store) },
    );
    await waitForNextUpdate();

    mockFetchAllEstimates.mockClear();
    mockFetchProjects.mockClear();
    mockFetchProjects.mockResolvedValue(
      buildSuccessResponse(
        [buildEdge({ id: 'proj-2', name: 'Page 2' })],
        { hasNextPage: false, endCursor: null },
        12,
      ),
    );
    mockFetchCustomersForProjects.mockRejectedValueOnce(new Error('boom'));

    await act(async () => {
      await result.current.handlePageChange(2);
    });

    expect(mockFetchAllEstimates).not.toHaveBeenCalled();
    // The thrown lookup must NOT surface as a page-level error —
    // it's a non-blocking side effect, not the projects fetch itself.
    expect(result.current.error).toBeNull();
  });

  describe('handleSortChange', () => {
    it('toggles sortOrder from NAME_ASC to NAME_DESC and refetches with the new orderBy', async () => {
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());

      await act(async () => {
        result.current.handleSortChange();
      });

      expect(result.current.filters.sortOrder).toBe(
        PROJECT_SORT_ORDER.NAME_DESC,
      );
      expect(mockFetchProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            orderBy: [PROJECT_SORT_ORDER.NAME_DESC],
          }),
        }),
      );
    });

    it('toggles back from NAME_DESC to NAME_ASC on a second invocation', async () => {
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockResolvedValue(buildSuccessResponse());
      await act(async () => {
        result.current.handleSortChange();
      });
      expect(result.current.filters.sortOrder).toBe(
        PROJECT_SORT_ORDER.NAME_DESC,
      );

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());

      await act(async () => {
        result.current.handleSortChange();
      });

      expect(result.current.filters.sortOrder).toBe(
        PROJECT_SORT_ORDER.NAME_ASC,
      );
      expect(mockFetchProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            orderBy: [PROJECT_SORT_ORDER.NAME_ASC],
          }),
        }),
      );
    });

    it('preserves status, customer, and search filters across a sort change', async () => {
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockResolvedValue(buildSuccessResponse());
      await act(async () => {
        result.current.handleStatusChange('IN_PROGRESS');
      });
      await act(async () => {
        result.current.handleCustomerChange('cust-1');
      });
      await act(async () => {
        result.current.handleSearchChange('kitchen');
      });

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());

      await act(async () => {
        result.current.handleSortChange();
      });

      expect(result.current.filters.statusFilter).toBe('IN_PROGRESS');
      expect(result.current.filters.customerFilter).toBe('cust-1');
      expect(result.current.filters.searchText).toBe('kitchen');
      expect(result.current.filters.sortOrder).toBe(
        PROJECT_SORT_ORDER.NAME_DESC,
      );
      expect(mockFetchProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            orderBy: [PROJECT_SORT_ORDER.NAME_DESC],
          }),
        }),
      );
    });

    it('uses the current sortOrder when paginating', async () => {
      mockFetchProjects.mockResolvedValue(
        buildSuccessResponse(
          [buildEdge()],
          { hasNextPage: true, endCursor: 'cursor-page-1' },
          12,
        ),
      );
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockResolvedValue(
        buildSuccessResponse(
          [buildEdge()],
          { hasNextPage: true, endCursor: 'cursor-page-1' },
          12,
        ),
      );
      await act(async () => {
        result.current.handleSortChange();
      });

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(
        buildSuccessResponse(
          [buildEdge({ id: 'proj-2', name: 'Page 2' })],
          { hasNextPage: false, endCursor: null },
          12,
        ),
      );

      await act(async () => {
        await result.current.handlePageChange(2);
      });

      expect(mockFetchProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            after: 'cursor-page-1',
            orderBy: [PROJECT_SORT_ORDER.NAME_DESC],
          }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Workflow API path (isWorkflowApiEnabled: true)
  // ─────────────────────────────────────────────────────────────────────────

  // Workflow API response shape: data.company.projects (no totalCount)
  const buildWorkflowEdge = (overrides: Record<string, any> = {}) => ({
    cursor: 'cursor-wf-1',
    node: {
      // Global ID — `extractQboLocalId` strips to the segment after the last colon
      id: 'djQuMTo5OjAuMTo5MzQxNDU0NzE5NTE0OTAyOjY4ZDAxMTQ3ZGQ:wf-proj-1',
      name: 'Workflow Project Alpha',
      status: 'Inprogress',
      description: 'wf desc',
      dueDate: '2026-09-01',
      completedDate: null,
      startDate: '2026-03-01',
      // Workflow API client global ID — local id is after the last colon
      client: {
        id: 'djQuMTo5OjAuMTo5MzQxNDU0NzE5NTE0OTAyOjY4ZDAxMTQ3ZGQ:cust-999',
      },
      active: true,
      ...overrides,
    },
  });

  const buildWorkflowSuccessResponse = (
    edges = [buildWorkflowEdge()],
    pageInfo: { hasNextPage: boolean; endCursor: string | null } = {
      hasNextPage: false,
      endCursor: null,
    },
  ) => ({
    data: {
      company: {
        projects: {
          edges,
          pageInfo,
        },
      },
    },
    error: undefined,
  });

  const enableWorkflowFlag = () => {
    mockUseIXPFeatureFlagTyped.mockReturnValue({
      isEnabled: true,
      isLoading: false,
      settled: true,
      error: null,
    });
  };

  describe('Workflow API — flag loading gate', () => {
    it('does not fetch before isWorkflowFlagLoading resolves', async () => {
      // First call = QBO flag (still loading), second call = WFS flag
      mockUseIXPFeatureFlagTyped
        .mockReturnValueOnce({
          isEnabled: false,
          isLoading: true,
          settled: false,
          error: null,
        })
        .mockReturnValueOnce({
          isEnabled: false,
          isLoading: false,
          settled: true,
          error: null,
        });

      const store = createTestStore();
      renderHook(() => useTimeProjectsFetching(), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockFetchProjects).not.toHaveBeenCalled();
    });
  });

  describe('Workflow API — query variables and routing', () => {
    it('sends pageSize / filter / order variables (not first / filter / orderBy) when workflow flag is on', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());

      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        {
          wrapper: createWrapper(store),
        },
      );
      await waitForNextUpdate();

      const call = mockFetchProjects.mock.calls[0][0];
      expect(call.variables).toMatchObject({
        pageSize: DEFAULT_PAGE_SIZE,
        filter: expect.any(String),
        order: expect.any(String),
      });
      expect(call.variables.first).toBeUndefined();
      expect(call.variables.orderBy).toBeUndefined();
    });

    it('adds clientName: WORKFLOW to the Apollo context when workflow flag is on', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());

      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        {
          wrapper: createWrapper(store),
        },
      );
      await waitForNextUpdate();

      const call = mockFetchProjects.mock.calls[0][0];
      expect(call.context.clientName).toBe(ApolloClientNames.WORKFLOW);
    });

    it('does NOT add clientName to context when workflow flag is off (OIGQL path)', async () => {
      // Default: mockUseIXPFeatureFlag returns isEnabled: false
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());

      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        {
          wrapper: createWrapper(store),
        },
      );
      await waitForNextUpdate();

      const call = mockFetchProjects.mock.calls[0][0];
      expect(call.context.clientName).toBeUndefined();
    });

    it('reads data.company.projects (not data.dataAccessWorkProjects) when workflow flag is on', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());

      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      expect(result.current.rows).toHaveLength(1);
      expect(result.current.rows[0].projectName).toBe('Workflow Project Alpha');
    });

    it('calls fetchCustomersForProjects with shouldBackfillCustomerNames: true when workflow flag is on', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());

      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        {
          wrapper: createWrapper(store),
        },
      );
      await waitForNextUpdate();

      expect(mockFetchCustomersForProjects).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        { shouldBackfillCustomerNames: true },
      );
    });

    it('calls fetchCustomersForProjects with shouldBackfillCustomerNames: false when workflow flag is off', async () => {
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());

      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        {
          wrapper: createWrapper(store),
        },
      );
      await waitForNextUpdate();

      expect(mockFetchCustomersForProjects).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        { shouldBackfillCustomerNames: false },
      );
    });
  });

  describe('Workflow API — WFS vs QBO flag selection', () => {
    it('uses the WFS flag for a workforce user', async () => {
      mockIsWorkforceEnvironment.mockReturnValue(true);
      // Call 1 = QBO flag (disabled), call 2 = WFS flag (enabled)
      mockUseIXPFeatureFlagTyped
        .mockReturnValueOnce({
          isEnabled: false,
          isLoading: false,
          settled: true,
          error: null,
        })
        .mockReturnValueOnce({
          isEnabled: true,
          isLoading: false,
          settled: true,
          error: null,
        });
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());

      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        {
          wrapper: createWrapper(store),
        },
      );
      await waitForNextUpdate();

      // Workflow flag on for WFS user → WORKFLOW client context
      const call = mockFetchProjects.mock.calls[0][0];
      expect(call.context.clientName).toBe(ApolloClientNames.WORKFLOW);
    });

    it('uses the QBO flag for a non-workforce user and does not fire if only WFS flag is on', async () => {
      mockIsWorkforceEnvironment.mockReturnValue(false);
      // Call 1 = QBO flag (disabled), call 2 = WFS flag (enabled)
      mockUseIXPFeatureFlagTyped
        .mockReturnValueOnce({
          isEnabled: false,
          isLoading: false,
          settled: true,
          error: null,
        })
        .mockReturnValueOnce({
          isEnabled: true,
          isLoading: false,
          settled: true,
          error: null,
        });
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());

      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        {
          wrapper: createWrapper(store),
        },
      );
      await waitForNextUpdate();

      // Non-workforce uses QBO flag (disabled) → no WORKFLOW client name
      const call = mockFetchProjects.mock.calls[0][0];
      expect(call.context.clientName).toBeUndefined();
    });

    it('reads the correct flag names from FEATURE_FLAGS', () => {
      enableWorkflowFlag();
      renderHook(() => useTimeProjectsFetching(), {
        wrapper: createWrapper(createTestStore()),
      });

      const calledFlagNames = mockUseIXPFeatureFlagTyped.mock.calls.map(
        (call) => call[0].flagName,
      );
      expect(calledFlagNames).toContain(
        FEATURE_FLAGS.SBSEG_QBO_QBTIME_WORKFLOW_PROJECTS_API,
      );
      expect(calledFlagNames).toContain(
        FEATURE_FLAGS.SBSEG_WFS_QBTIME_WORKFLOW_PROJECTS_API,
      );
    });
  });

  describe('Workflow API — extractQboLocalId via row mapping', () => {
    it('strips the global ID prefix to a numeric local id for projectId and customerId', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([
          buildWorkflowEdge({
            id: 'djQuMTo5OjAuMTo5MzQxNDU0NzE5NTE0OTAyOjY4ZDAxMTQ3ZGQ:793400145',
            client: {
              id: 'djQuMTo5OjAuMTo5MzQxNDU0NzE5NTE0OTAyOjY4ZDAxMTQ3ZGQ:888777666',
            },
          }),
        ]),
      );

      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      const row = result.current.rows[0];
      expect(row.projectId).toBe('793400145');
      expect(row.customerId).toBe('888777666');
    });

    it('strips a type-prefixed underscore segment from the local id (e.g. Customer_12345 → 12345)', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([
          buildWorkflowEdge({
            id: 'djQuMTo5:Customer_793400145',
          }),
        ]),
      );

      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      expect(result.current.rows[0].projectId).toBe('793400145');
    });

    it('passes through a bare numeric ID unchanged (no colon = already local)', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([
          buildWorkflowEdge({ id: '793400145', client: { id: '888777' } }),
        ]),
      );

      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      expect(result.current.rows[0].projectId).toBe('793400145');
      expect(result.current.rows[0].customerId).toBe('888777');
    });

    it('returns empty customerId when client is null/absent', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([buildWorkflowEdge({ client: null })]),
      );

      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      expect(result.current.rows[0].customerId).toBe('');
    });
  });

  describe('Workflow API — buildWorkflowFilterString (via executeQuery)', () => {
    it('always includes deleted=false and inServiceToType as base conditions', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());

      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        {
          wrapper: createWrapper(store),
        },
      );
      await waitForNextUpdate();

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("deleted='false'");
      expect(filter).toContain("inServiceToType in ('CONTACT')");
    });

    it('appends the workflow status condition when a non-ALL status filter is active', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleStatusChange('In progress');
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("status='Inprogress'");
      expect(filter).toContain("deleted='false'");
      expect(filter).toContain("inServiceToType in ('CONTACT')");
    });

    it('sends status=\'Open\' when "To do" is selected (QBOA path — mirrors projects-plugin)', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleStatusChange('To do');
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("status='Open'");
      expect(filter).not.toContain("status='Todo'");
    });

    it('sends status=\'Open\' when "Not started" is selected (QBO path — same filter as "To do")', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleStatusChange('Not started');
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("status='Open'");
      expect(filter).not.toContain("status='Todo'");
    });

    it('omits the status condition when statusFilter is ALL', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      // Set a non-empty status first so that resetting to ALL triggers a fetch
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleStatusChange('In progress');
      });

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleStatusChange('ALL');
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).not.toContain('status=');
    });

    it('appends client.externalIds.localId condition when customer filter is active', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleCustomerChange('cust-42');
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("client.externalIds.localId='cust-42'");
    });

    it('does not include a name/search condition when handleSearchChange is called (non-workflow text path)', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleSearchChange('kitchen');
      });

      // handleSearchChange clears searchProjectIds; the Workflow API filter
      // does not carry a name-based condition (name contains is unsupported).
      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).not.toContain('kitchen');
    });

    it('adds id in (...) condition via handleFilterByProjectIds', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleFilterByProjectIds(
          ['101', '202'] as WorkflowGlobalId[],
          'kitchen',
        );
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("id in ('101', '202')");
    });

    it('handleFilterByProjectIds preserves status and customer conditions alongside IDs filter', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      // Set status first
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleStatusChange('Completed');
      });

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleFilterByProjectIds(
          ['303'] as WorkflowGlobalId[],
          'proj',
        );
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("deleted='false'");
      expect(filter).toContain("inServiceToType in ('CONTACT')");
      expect(filter).toContain("status='Complete'");
      expect(filter).toContain("id in ('303')");
    });

    it('handleSearchChange clears the IDs filter and refetches without it', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      // Apply an IDs filter first
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleFilterByProjectIds(
          ['101'] as WorkflowGlobalId[],
          'kitchen',
        );
      });

      // Now clear via handleSearchChange
      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleSearchChange('');
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).not.toContain('externalIds.localId');
    });

    it('combines all conditions with && separator', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleStatusChange('Completed');
      });
      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleCustomerChange('cust-5');
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain(' && ');
      expect(filter).toContain("deleted='false'");
      expect(filter).toContain("inServiceToType in ('CONTACT')");
      expect(filter).toContain("status='Complete'");
      expect(filter).toContain("client.externalIds.localId='cust-5'");
    });
  });

  describe('Workflow API — buildWorkflowOrderString (via executeQuery)', () => {
    it('sends "pinned DESC, name ASC" for NAME_ASC sort order', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());

      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        {
          wrapper: createWrapper(store),
        },
      );
      await waitForNextUpdate();

      const { order } = mockFetchProjects.mock.calls[0][0].variables;
      expect(order).toBe('pinned DESC, name ASC');
    });

    it('sends "pinned DESC, name DESC" after a sort toggle', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleSortChange();
      });

      const { order } = mockFetchProjects.mock.calls[0][0].variables;
      expect(order).toBe('pinned DESC, name DESC');
    });
  });

  describe('Workflow API — Workflow status mapping', () => {
    // The useIsAccountantUser mock in this file returns isAccountant=false (QBO
    // context). On the QBO Workflow path, Open → NOT_STARTED so the badge
    // matches the "Not started" label shown in the QBO filter dropdown.
    const workflowStatusCases: [string, string][] = [
      ['Inprogress', 'IN_PROGRESS'],
      ['Complete', 'COMPLETED'],
      ['Open', 'NOT_STARTED'],
      ['Todo', 'TODO'],
      ['Canceled', 'CANCELLED'],
    ];

    it.each(workflowStatusCases)(
      'maps Workflow API status "%s" to UI status "%s" for QBO users',
      async (workflowStatus, expectedUiStatus) => {
        enableWorkflowFlag();
        mockFetchProjects.mockResolvedValue(
          buildWorkflowSuccessResponse([
            buildWorkflowEdge({ status: workflowStatus }),
          ]),
        );

        const store = createTestStore();
        const { result, waitForNextUpdate } = renderHook(
          () => useTimeProjectsFetching(),
          { wrapper: createWrapper(store) },
        );
        await waitForNextUpdate();

        expect(result.current.rows[0].status).toBe(expectedUiStatus);
      },
    );

    it('maps Workflow API "Open" → "TODO" for QBOA users (isAccountant=true)', async () => {
      const { useIsAccountantUser } = jest.requireMock(
        'src/js/common/useIsAccountantUser',
      );
      useIsAccountantUser.mockReturnValueOnce({
        isAccountant: true,
        isLoading: false,
      });

      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([buildWorkflowEdge({ status: 'Open' })]),
      );

      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      expect(result.current.rows[0].status).toBe('TODO');
    });

    it('delays initial fetch until isAccountantLoading resolves on Workflow path', async () => {
      // When isWorkflowApiEnabled=true and isAccountantLoading=true the initial
      // fetch must wait. If it fired early, isAccountant would be the stale
      // default (false), QBOA users would receive NOT_STARTED badges, and
      // initialLoadDone.current would prevent a corrective re-fetch.
      const { useIsAccountantUser } = jest.requireMock(
        'src/js/common/useIsAccountantUser',
      );

      useIsAccountantUser.mockReturnValue({
        isAccountant: false,
        isLoading: true,
      });

      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([buildWorkflowEdge({ status: 'Open' })]),
      );

      const store = createTestStore();
      const { rerender, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );

      // SDK still loading — fetch must not have started yet.
      expect(mockFetchProjects).not.toHaveBeenCalled();

      // SDK resolves for QBOA user — flip to isLoading=false, isAccountant=true.
      useIsAccountantUser.mockReturnValue({
        isAccountant: true,
        isLoading: false,
      });
      rerender();
      await waitForNextUpdate();

      // Now the fetch should have fired exactly once with the correct context.
      expect(mockFetchProjects).toHaveBeenCalledTimes(1);
    });
  });

  describe('Workflow API — pagination', () => {
    it('uses pageSize/filter/order on handlePageChange when workflow flag is on', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([buildWorkflowEdge()], {
          hasNextPage: true,
          endCursor: 'wf-cursor-1',
        }),
      );

      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse(
          [buildWorkflowEdge({ id: 'djQuMTo5:wf-proj-2', name: 'Wf Page 2' })],
          { hasNextPage: false, endCursor: null },
        ),
      );

      await act(async () => {
        await result.current.handlePageChange(2);
      });

      const call = mockFetchProjects.mock.calls[0][0];
      expect(call.variables).toMatchObject({
        pageSize: DEFAULT_PAGE_SIZE,
        after: 'wf-cursor-1',
        filter: expect.any(String),
        order: expect.any(String),
      });
      expect(call.variables.first).toBeUndefined();
      expect(call.variables.orderBy).toBeUndefined();
      expect(call.context.clientName).toBe(ApolloClientNames.WORKFLOW);
    });

    it('reads data.company.projects on page change when workflow flag is on', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([buildWorkflowEdge()], {
          hasNextPage: true,
          endCursor: 'wf-cursor-1',
        }),
      );

      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse(
          [buildWorkflowEdge({ id: 'djQuMTo5:wf-proj-2', name: 'Wf Page 2' })],
          { hasNextPage: false, endCursor: null },
        ),
      );

      await act(async () => {
        await result.current.handlePageChange(2);
      });

      expect(result.current.rows[0].projectName).toBe('Wf Page 2');
      expect(result.current.pagination.page).toBe(2);
    });

    it('passes shouldBackfillCustomerNames: true to fetchCustomersForProjects on page change', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([buildWorkflowEdge()], {
          hasNextPage: true,
          endCursor: 'wf-cursor-1',
        }),
      );

      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchCustomersForProjects.mockClear();
      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse(
          [buildWorkflowEdge({ id: 'djQuMTo5:wf-proj-2', name: 'Wf Page 2' })],
          { hasNextPage: false, endCursor: null },
        ),
      );

      await act(async () => {
        await result.current.handlePageChange(2);
      });

      expect(mockFetchCustomersForProjects).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        { shouldBackfillCustomerNames: true },
      );
    });
  });

  describe('Workflow API — due date filter (handleDueDateChange)', () => {
    const buildWorkflowSuccessResponse = (
      edges = [buildWorkflowEdge()],
      pageInfo: { hasNextPage: boolean; endCursor: string | null } = {
        hasNextPage: false,
        endCursor: null,
      },
    ) => ({
      data: {
        company: {
          projects: {
            edges,
            pageInfo,
          },
        },
      },
      error: undefined,
    });

    const buildWorkflowEdge = (overrides: Record<string, any> = {}) => ({
      node: {
        id: 'djQuMTo5:wf-proj-1',
        name: 'WF Project',
        status: 'Open',
        customerId: null,
        dueDate: '2026-07-01',
        startDate: '2026-01-01',
        completedDate: null,
        active: true,
        description: '',
        pinned: false,
        customer: null,
        ...overrides,
      },
      cursor: 'wf-cursor-1',
    });

    const enableWorkflowFlag = () => {
      mockUseIXPFeatureFlagTyped.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        settled: true,
        error: null,
      });
    };

    it('sends default CUSTOM_RANGE dueDate filter on initial fetch when workflow is enabled and user is accountant', async () => {
      enableWorkflowFlag();
      const { useIsAccountantUser } = jest.requireMock(
        'src/js/common/useIsAccountantUser',
      );
      // Use mockReturnValueOnce so this only affects the current render, not subsequent tests
      (useIsAccountantUser as jest.Mock).mockReturnValueOnce({
        isAccountant: true,
        isLoading: false,
      });

      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toMatch(
        /dueDate between '\d{4}-\d{2}-\d{2}' and '\d{4}-\d{2}-\d{2}'/,
      );
    });

    it('does not send dueDate filter on initial fetch when workflow is enabled but user is NOT accountant', async () => {
      enableWorkflowFlag();
      const { useIsAccountantUser } = jest.requireMock(
        'src/js/common/useIsAccountantUser',
      );
      (useIsAccountantUser as jest.Mock).mockReturnValueOnce({
        isAccountant: false,
        isLoading: false,
      });

      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).not.toContain('dueDate');
    });

    it('appends dueDate between condition when dueDateRange is set', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleDueDateChange({
          filterType: 'TODAY' as any,
          fromDate: '2026-07-01',
          toDate: '2026-07-01',
        });
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("dueDate between '2026-07-01' and '2026-07-01'");
    });

    it('omits dueDate condition in filter string when dueDateRange state is null (non-accountant)', async () => {
      enableWorkflowFlag();
      const { useIsAccountantUser } = jest.requireMock(
        'src/js/common/useIsAccountantUser',
      );
      (useIsAccountantUser as jest.Mock).mockReturnValueOnce({
        isAccountant: false,
        isLoading: false,
      });

      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).not.toContain('dueDate');
    });

    it('preserves status and customer conditions alongside dueDate filter', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleStatusChange('In progress');
      });
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleCustomerChange('cust-1');
      });

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleDueDateChange({
          filterType: 'THIS_WEEK' as any,
          fromDate: '2026-06-29',
          toDate: '2026-07-05',
        });
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("deleted='false'");
      expect(filter).toContain("status='Inprogress'");
      expect(filter).toContain("client.externalIds.localId='cust-1'");
      expect(filter).toContain("dueDate between '2026-06-29' and '2026-07-05'");
    });

    it('dueDate condition is preserved on handlePageChange', async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([buildWorkflowEdge()], {
          hasNextPage: true,
          endCursor: 'wf-cursor-1',
        }),
      );
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleDueDateChange({
          filterType: 'TODAY' as any,
          fromDate: '2026-07-01',
          toDate: '2026-07-01',
        });
      });

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(
        buildWorkflowSuccessResponse([buildWorkflowEdge()], {
          hasNextPage: false,
          endCursor: null,
        }),
      );
      await act(async () => {
        await result.current.handlePageChange(2);
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("dueDate between '2026-07-01' and '2026-07-01'");
    });

    it('QBOA accountant initial load: dispatches setAllProjects so state.rows is populated', async () => {
      enableWorkflowFlag();
      const { useIsAccountantUser } = jest.requireMock(
        'src/js/common/useIsAccountantUser',
      );
      (useIsAccountantUser as jest.Mock).mockReturnValueOnce({
        isAccountant: true,
        isLoading: false,
      });

      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      // setAllProjects must have been dispatched — rows is the baseline for
      // resetToAllProjects. Before the fix this was always [] for accountants
      // because the CUSTOM_RANGE default caused isDefaultFilter=false.
      expect(store.getState().projects.rows).toHaveLength(1);
    });

    it('handleClearFilters for QBOA accountant: state.rows remains populated so resetToAllProjects does not flash an empty list', async () => {
      enableWorkflowFlag();
      const { useIsAccountantUser } = jest.requireMock(
        'src/js/common/useIsAccountantUser',
      );
      (useIsAccountantUser as jest.Mock).mockReturnValue({
        isAccountant: true,
        isLoading: false,
      });

      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      // Apply a non-default (non-CUSTOM_RANGE) filter to dirty the state.
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleDueDateChange({
          filterType: 'TODAY' as any,
          fromDate: '2026-07-01',
          toDate: '2026-07-01',
        });
      });

      // Verify the TODAY filter set filteredRows but did NOT wipe rows.
      expect(store.getState().projects.rows).toHaveLength(1);

      // Clear all filters — resetToAllProjects runs synchronously before
      // the network response comes back. rows must already be non-empty.
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleClearFilters();
      });

      expect(store.getState().projects.rows).toHaveLength(1);
      expect(store.getState().projects.filteredRows).toHaveLength(1);

      // Restore default mock so subsequent tests are not affected.
      (useIsAccountantUser as jest.Mock).mockReturnValue({
        isAccountant: false,
        isLoading: false,
      });
    });

    it('does not apply dueDate condition on the OIGQL path', async () => {
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildSuccessResponse());
      await act(async () => {
        result.current.handleDueDateChange({
          filterType: 'TODAY' as any,
          fromDate: '2026-07-01',
          toDate: '2026-07-01',
        });
      });

      const callVariables = mockFetchProjects.mock.calls[0][0].variables;
      expect(callVariables).not.toHaveProperty('filter.dueDate');
      expect(JSON.stringify(callVariables)).not.toContain('dueDate between');
    });
  });

  describe('Workflow API — due date filter preserved across other filter changes', () => {
    const DUE_DATE_RANGE = {
      filterType: 'TODAY' as any,
      fromDate: '2026-07-01',
      toDate: '2026-07-01',
    };

    const buildWorkflowSuccessResponse = (
      edges: any[] = [],
      pageInfo = { hasNextPage: false, endCursor: null },
    ) => ({
      data: {
        company: {
          projects: { edges, pageInfo, totalCount: 0 },
        },
      },
      error: undefined,
    });

    const enableWorkflowFlag = () => {
      mockUseIXPFeatureFlagTyped.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        settled: true,
        error: null,
      });
    };

    const setupHookWithDueDate = async () => {
      enableWorkflowFlag();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      const store = createTestStore();
      const { result, waitForNextUpdate } = renderHook(
        () => useTimeProjectsFetching(),
        { wrapper: createWrapper(store) },
      );
      await waitForNextUpdate();

      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());
      await act(async () => {
        result.current.handleDueDateChange(DUE_DATE_RANGE);
      });

      mockFetchProjects.mockClear();
      mockFetchProjects.mockResolvedValue(buildWorkflowSuccessResponse());

      return result;
    };

    it('preserves active due date filter when handleStatusChange is called', async () => {
      const result = await setupHookWithDueDate();

      await act(async () => {
        result.current.handleStatusChange('In progress');
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("dueDate between '2026-07-01' and '2026-07-01'");
      expect(filter).toContain("status='Inprogress'");
    });

    it('preserves active due date filter when handleCustomerChange is called', async () => {
      const result = await setupHookWithDueDate();

      await act(async () => {
        result.current.handleCustomerChange('cust-99');
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("dueDate between '2026-07-01' and '2026-07-01'");
      expect(filter).toContain("client.externalIds.localId='cust-99'");
    });

    it('preserves active due date filter when handleSearchChange is called', async () => {
      const result = await setupHookWithDueDate();

      await act(async () => {
        result.current.handleSearchChange('kitchen remodel');
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("dueDate between '2026-07-01' and '2026-07-01'");
    });

    it('preserves active due date filter when handleSortChange is called', async () => {
      const result = await setupHookWithDueDate();

      await act(async () => {
        result.current.handleSortChange();
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("dueDate between '2026-07-01' and '2026-07-01'");
      expect(mockFetchProjects.mock.calls[0][0].variables.order).toContain(
        'DESC',
      );
    });

    it('preserves active due date filter when handleFilterByProjectIds is called', async () => {
      const result = await setupHookWithDueDate();

      await act(async () => {
        result.current.handleFilterByProjectIds(
          ['djQuMTo5:wf-proj-1', 'djQuMTo5:wf-proj-2'] as WorkflowGlobalId[],
          'search text',
        );
      });

      const { filter } = mockFetchProjects.mock.calls[0][0].variables;
      expect(filter).toContain("dueDate between '2026-07-01' and '2026-07-01'");
      expect(filter).toContain('id in (');
    });
  });
});
