import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from 'src/js/widgets/timeProject/store/projectsSlice';
import filtersReducer from 'src/js/widgets/timeProject/store/filtersSlice';
import uiReducer from 'src/js/widgets/timeProject/store/uiSlice';
import settingsReducer from 'src/js/widgets/timeProject/store/settingsSlice';
import { DEFAULT_PAGE_SIZE } from 'src/js/widgets/timeProject/constants';
import { useProjectEstimates } from 'src/js/widgets/timeProject/hooks/useProjectEstimates';

const mockFetchEstimates = jest.fn();

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(() => [mockFetchEstimates]),
}));

jest.mock('src/js/widgets/timeProject/hooks/useAdaptivePageSize', () => ({
  useAdaptivePageSize: () => DEFAULT_PAGE_SIZE,
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

const buildEstimateResponse = (
  edges: any[] = [],
  hasNextPage = false,
  endCursor: string | null = null,
) => ({
  data: {
    timeTrackingProjectEstimates: {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: false,
        startCursor: null,
        endCursor,
      },
    },
  },
  error: undefined,
});

const buildEstimateEdge = (
  projectId: string,
  totalEstimatedSeconds: number,
  projectElapsedSeconds: number,
  id = '1',
) => ({
  cursor: 'cursor-1',
  node: {
    id,
    projectId,
    projectEstimateType: 'TOTAL_HOURS',
    projectElapsedSeconds,
    totalEstimatedSeconds,
    fieldType: null,
    fieldRef: null,
  },
});

describe('useProjectEstimates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial empty state', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.estimatesMap).toEqual({});
    expect(result.current.estimatesLoading).toBe(false);
    expect(typeof result.current.fetchAllEstimates).toBe('function');
  });

  it('should fetch estimates and store in Redux', async () => {
    mockFetchEstimates.mockResolvedValue(
      buildEstimateResponse([buildEstimateEdge('proj-1', 72000, 0)]),
    );

    const store = createTestStore();
    const { result, waitForNextUpdate } = renderHook(
      () => useProjectEstimates(),
      { wrapper: createWrapper(store) },
    );

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
      ]);
    });

    expect(mockFetchEstimates).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          projectRefs: [{ projectId: 'proj-1', customerId: 'cust-1' }],
          first: DEFAULT_PAGE_SIZE,
          after: undefined,
          itemsFirst: 50,
        },
      }),
    );

    expect(result.current.estimatesMap['proj-1']).toEqual({
      budgetHoursTotal: 20,
      budgetHoursRemaining: 20,
      elapsedSeconds: 0,
      totalEstimatedSeconds: 72000,
      projectEstimateType: 'TOTAL_HOURS',
      fieldType: null,
      fieldRef: null,
      estimateItems: undefined,
    });
    expect(result.current.estimatesLoading).toBe(false);
  });

  it('should correctly calculate hours from seconds', async () => {
    mockFetchEstimates.mockResolvedValue(
      buildEstimateResponse([buildEstimateEdge('proj-1', 72000, 36000)]),
    );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
      ]);
    });

    expect(result.current.estimatesMap['proj-1'].budgetHoursTotal).toBe(20);
    expect(result.current.estimatesMap['proj-1'].budgetHoursRemaining).toBe(10);
  });

  it('should handle multiple projects', async () => {
    mockFetchEstimates.mockResolvedValue(
      buildEstimateResponse([
        buildEstimateEdge('proj-1', 72000, 0, '1'),
        buildEstimateEdge('proj-2', 144000, 72000, '2'),
      ]),
    );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
        { projectId: 'proj-2', customerId: 'cust-2' },
      ]);
    });

    expect(Object.keys(result.current.estimatesMap)).toHaveLength(2);
    expect(result.current.estimatesMap['proj-1'].budgetHoursTotal).toBe(20);
    expect(result.current.estimatesMap['proj-2'].budgetHoursTotal).toBe(40);
    expect(result.current.estimatesMap['proj-2'].budgetHoursRemaining).toBe(20);
  });

  it('should not fetch when projectIds is empty', async () => {
    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([]);
    });

    expect(mockFetchEstimates).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    mockFetchEstimates.mockResolvedValue({
      data: null,
      error: new Error('Network error'),
    });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
      ]);
    });

    expect(result.current.estimatesMap).toEqual({});
    expect(result.current.estimatesLoading).toBe(false);
  });

  it('should process data when error exists but data is present (partial errors)', async () => {
    mockFetchEstimates.mockResolvedValue({
      data: {
        timeTrackingProjectEstimates: {
          edges: [buildEstimateEdge('proj-1', 72000, 3600)],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      },
      error: new Error('Product not found'),
    });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
      ]);
    });

    expect(result.current.estimatesMap['proj-1']).toBeDefined();
    expect(result.current.estimatesMap['proj-1'].budgetHoursTotal).toBe(20);
    expect(result.current.estimatesMap['proj-1'].budgetHoursRemaining).toBe(19);
  });

  it('should map projectEstimateItems into estimateItems', async () => {
    mockFetchEstimates.mockResolvedValue({
      data: {
        timeTrackingProjectEstimates: {
          edges: [
            {
              cursor: 'c1',
              node: {
                id: '1',
                projectId: 'proj-1',
                projectEstimateType: 'BY_FIELD_OPTION',
                projectElapsedSeconds: 0,
                totalEstimatedSeconds: 10800,
                fieldType: 'STANDARD_FIELD',
                fieldRef: 'SERVICE_ITEM',
                projectEstimateItems: {
                  edges: [
                    {
                      node: {
                        fieldOptionId: '100',
                        estimatedSeconds: 3600,
                        elapsedSeconds: 1800,
                        serviceItemDAS: { id: '100', fullName: 'Design' },
                      },
                    },
                    {
                      node: {
                        fieldOptionId: '101',
                        estimatedSeconds: 7200,
                        elapsedSeconds: 0,
                        serviceItemDAS: { id: '101', fullName: null },
                      },
                    },
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: null,
                    endCursor: null,
                  },
                },
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      },
      error: undefined,
    });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
      ]);
    });

    const estimate = result.current.estimatesMap['proj-1'];
    expect(estimate.projectEstimateType).toBe('BY_FIELD_OPTION');
    expect(estimate.fieldType).toBe('STANDARD_FIELD');
    expect(estimate.fieldRef).toBe('SERVICE_ITEM');
    expect(estimate.estimateItems).toHaveLength(2);
    expect(estimate.estimateItems![0]).toEqual({
      fieldOptionId: '100',
      estimatedHours: 1,
      elapsedSeconds: 1800,
      serviceItemName: 'Design',
    });
    expect(estimate.estimateItems![1]).toEqual({
      fieldOptionId: '101',
      estimatedHours: 2,
      elapsedSeconds: 0,
      serviceItemName: '101',
    });
  });

  it('should preserve -1 sentinel for unestimated service items (estimatedSeconds: -1)', async () => {
    // The API returns `estimatedSeconds: -1` to mean "no estimate set yet"
    // for that service item while still reporting `elapsedSeconds`. We must
    // keep that as a negative `estimatedHours` so the UI can render a dash
    // instead of `-0.00`.
    mockFetchEstimates.mockResolvedValue({
      data: {
        timeTrackingProjectEstimates: {
          edges: [
            {
              cursor: 'c1',
              node: {
                id: '1',
                projectId: 'proj-unest',
                projectEstimateType: 'BY_FIELD_OPTION',
                projectElapsedSeconds: 800,
                totalEstimatedSeconds: 9000,
                fieldType: 'STANDARD_FIELD',
                fieldRef: 'SERVICE_ITEM',
                projectEstimateItems: {
                  edges: [
                    {
                      node: {
                        fieldOptionId: '1',
                        estimatedSeconds: -1,
                        elapsedSeconds: 600,
                        serviceItemDAS: { id: '1', fullName: null },
                      },
                    },
                    {
                      node: {
                        fieldOptionId: '2',
                        estimatedSeconds: -1,
                        elapsedSeconds: 200,
                        serviceItemDAS: { id: '2', fullName: 'Plumbing' },
                      },
                    },
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: null,
                    endCursor: null,
                  },
                },
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      },
      error: undefined,
    });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-unest', customerId: 'cust-unest' },
      ]);
    });

    const estimate = result.current.estimatesMap['proj-unest'];
    expect(estimate.estimateItems).toHaveLength(2);
    expect(estimate.estimateItems![0]).toEqual({
      fieldOptionId: '1',
      estimatedHours: -1,
      elapsedSeconds: 600,
      serviceItemName: '1',
    });
    expect(estimate.estimateItems![1]).toEqual({
      fieldOptionId: '2',
      estimatedHours: -1,
      elapsedSeconds: 200,
      serviceItemName: 'Plumbing',
    });
  });

  it('should handle empty response edges', async () => {
    mockFetchEstimates.mockResolvedValue(
      buildEstimateResponse([], false, null),
    );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
      ]);
    });

    expect(result.current.estimatesMap).toEqual({});
    expect(result.current.estimatesLoading).toBe(false);
  });

  it('should paginate when hasNextPage is true', async () => {
    mockFetchEstimates
      .mockResolvedValueOnce(
        buildEstimateResponse(
          [buildEstimateEdge('proj-1', 72000, 0, '1')],
          true,
          'cursor-page1',
        ),
      )
      .mockResolvedValueOnce(
        buildEstimateResponse(
          [buildEstimateEdge('proj-2', 144000, 36000, '2')],
          false,
          null,
        ),
      );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
        { projectId: 'proj-2', customerId: 'cust-2' },
      ]);
    });

    expect(mockFetchEstimates).toHaveBeenCalledTimes(2);
    expect(mockFetchEstimates).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        variables: expect.objectContaining({
          after: 'cursor-page1',
        }),
      }),
    );
    expect(Object.keys(result.current.estimatesMap)).toHaveLength(2);
  });

  it('should abort previous fetch when called again', async () => {
    let resolveFirst: (value: any) => void;
    const firstPromise = new Promise((res) => {
      resolveFirst = res;
    });
    mockFetchEstimates.mockReturnValueOnce(firstPromise);

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    const firstCall = result.current.fetchAllEstimates([
      { projectId: 'proj-1', customerId: 'cust-1' },
    ]);

    mockFetchEstimates.mockResolvedValueOnce(
      buildEstimateResponse([buildEstimateEdge('proj-2', 36000, 0, '2')]),
    );

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-2', customerId: 'cust-2' },
      ]);
    });

    resolveFirst!(
      buildEstimateResponse([buildEstimateEdge('proj-1', 72000, 0, '1')]),
    );
    await act(async () => {
      await firstCall;
    });

    expect(result.current.estimatesMap['proj-2']).toBeDefined();
  });

  it('should handle response with no edges array', async () => {
    mockFetchEstimates.mockResolvedValue({
      data: {
        timeTrackingProjectEstimates: {
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
      error: undefined,
    });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
      ]);
    });

    expect(result.current.estimatesMap).toEqual({});
    expect(result.current.estimatesLoading).toBe(false);
  });

  it('keeps the previous estimatesMap visible while a refetch is in flight (no flicker)', async () => {
    // Regression: previously `fetchAllEstimates` cleared the estimates
    // map up-front. After the assignment / estimate drawers saved, the
    // parent triggered a refetch and the open `ProjectSummary` would
    // briefly read `undefined` for its estimate, flashing the zero
    // state before the new data arrived. We now only mutate the map
    // once the response lands so stale rows stay visible during the
    // network round-trip.
    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    mockFetchEstimates.mockResolvedValueOnce(
      buildEstimateResponse([buildEstimateEdge('proj-1', 36000, 0)]),
    );
    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
      ]);
    });
    expect(result.current.estimatesMap['proj-1']).toBeDefined();

    let inflightResolve: (value: any) => void = () => {};
    const inflight = new Promise((resolve) => {
      inflightResolve = resolve;
    });
    mockFetchEstimates.mockReturnValueOnce(inflight);

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
      ]);
    });

    expect(result.current.estimatesMap['proj-1']).toBeDefined();

    await act(async () => {
      inflightResolve(
        buildEstimateResponse([buildEstimateEdge('proj-1', 72000, 0, '2')]),
      );
      await pending;
    });
    expect(result.current.estimatesMap['proj-1']).toBeDefined();
  });

  it('should handle null response data', async () => {
    mockFetchEstimates.mockResolvedValue({
      data: { timeTrackingProjectEstimates: null },
      error: undefined,
    });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectEstimates(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchAllEstimates([
        { projectId: 'proj-1', customerId: 'cust-1' },
      ]);
    });

    expect(result.current.estimatesMap).toEqual({});
  });
});
