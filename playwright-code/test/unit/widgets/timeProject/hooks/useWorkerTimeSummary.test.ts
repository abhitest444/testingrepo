import { renderHook, act } from '@testing-library/react-hooks';
import {
  useWorkerTimeSummary,
  mapEdgesToWorkerRows,
  enrichLegacyQboUserRows,
} from 'src/js/widgets/timeProject/hooks/useWorkerTimeSummary';

const mockLoadQuery = jest.fn();
const mockFetchNames = jest.fn(async () => ({}));
const mockIsWorkforceEnvironment = jest.fn((_: unknown) => false);
const mockUseQbTimeSdk = jest.fn();

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(() => [mockLoadQuery]),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  ...jest.requireActual('src/js/service/utils/sandboxUtils'),
  isWorkforceEnvironment: (sandbox: unknown) =>
    mockIsWorkforceEnvironment(sandbox),
}));

jest.mock('src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: (...args: any[]) => mockUseQbTimeSdk(...args),
}));

jest.mock('src/js/widgets/timeProject/hooks/useLegacyQboUserNames', () => ({
  __esModule: true,
  useLegacyQboUserNames: () => ({
    fetchName: jest.fn(),
    fetchNames: mockFetchNames,
  }),
}));

const buildEdge = (
  id: string,
  displayName: string | null,
  totalRegularSeconds: number,
) => ({
  node: {
    totalRegularSeconds,
    timeForType: 'EMPLOYEE',
    timeForContactDAS: {
      id,
      firstName: displayName?.split(' ')[0] ?? null,
      lastName: displayName?.split(' ')[1] ?? null,
      displayName,
      fullName: displayName,
      type: 'EMPLOYEE',
    },
  },
  cursor: `cursor-${id}`,
});

const buildResponse = (
  edges: ReturnType<typeof buildEdge>[],
  hasNextPage = false,
  endCursor: string | null = null,
) => ({
  data: {
    timeTrackingWorkerTimeSummary: {
      edges,
      pageInfo: { hasNextPage, endCursor },
    },
  },
});

describe('useWorkerTimeSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseQbTimeSdk.mockImplementation(() => ({
      data: false,
      loading: false,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    }));
    mockFetchNames.mockResolvedValue({});
  });

  it('should return empty workers initially', () => {
    const { result } = renderHook(() => useWorkerTimeSummary());
    expect(result.current.workers).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it('should fetch and map a single page of worker data', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([
        buildEdge('1', 'Alice', 7200),
        buildEdge('2', 'Bob', 3600),
      ]),
    );
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(mockLoadQuery).toHaveBeenCalledTimes(1);
    expect(mockLoadQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: { workerTimeSummaryFilter: { projectId: 'proj-1' } },
          first: 10,
          after: null,
        },
      }),
    );
    expect(result.current.workers).toEqual([
      {
        id: '1',
        displayName: 'Alice',
        hoursWorked: 2,
        timeForType: 'EMPLOYEE',
      },
      { id: '2', displayName: 'Bob', hoursWorked: 1, timeForType: 'EMPLOYEE' },
    ]);
    expect(result.current.loading).toBe(false);
    expect(result.current.page).toBe(1);
  });

  it('should indicate more pages when hasNextPage is true', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)], true, 'cursor-1'),
    );
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(2);
  });

  it('should navigate to next page using cursor', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(
        buildResponse([buildEdge('1', 'Alice', 7200)], true, 'cursor-1'),
      )
      .mockResolvedValueOnce(
        buildResponse([buildEdge('2', 'Bob', 3600)], false, null),
      );

    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    await act(async () => {
      await result.current.goToNextPage();
    });

    expect(mockLoadQuery).toHaveBeenCalledTimes(2);
    expect(mockLoadQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: {
          input: { workerTimeSummaryFilter: { projectId: 'proj-1' } },
          first: 10,
          after: 'cursor-1',
        },
      }),
    );
    expect(result.current.workers).toEqual([
      { id: '2', displayName: 'Bob', hoursWorked: 1, timeForType: 'EMPLOYEE' },
    ]);
    expect(result.current.page).toBe(2);
    expect(result.current.totalPages).toBe(2);
  });

  it('should navigate back to previous page', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(
        buildResponse([buildEdge('1', 'Alice', 7200)], true, 'cursor-1'),
      )
      .mockResolvedValueOnce(
        buildResponse([buildEdge('2', 'Bob', 3600)], false, null),
      )
      .mockResolvedValueOnce(
        buildResponse([buildEdge('1', 'Alice', 7200)], true, 'cursor-1'),
      );

    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });
    await act(async () => {
      await result.current.goToNextPage();
    });
    await act(async () => {
      await result.current.goToPrevPage();
    });

    expect(mockLoadQuery).toHaveBeenCalledTimes(3);
    expect(result.current.page).toBe(1);
    expect(result.current.workers[0].displayName).toBe('Alice');
  });

  it('should not go to previous page when on page 1', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)]),
    );
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    await act(async () => {
      await result.current.goToPrevPage();
    });

    expect(mockLoadQuery).toHaveBeenCalledTimes(1);
    expect(result.current.page).toBe(1);
  });

  it('should not go to next page when no more pages', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)], false),
    );
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    await act(async () => {
      await result.current.goToNextPage();
    });

    expect(mockLoadQuery).toHaveBeenCalledTimes(1);
    expect(result.current.page).toBe(1);
  });

  it('should set error on failure', async () => {
    mockLoadQuery.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(result.current.error).toBe(true);
    expect(result.current.workers).toEqual([]);
  });

  it('should handle null displayName', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('3', null, 1800)]),
    );
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(result.current.workers[0].displayName).toBe('');
    expect(result.current.workers[0].hoursWorked).toBe(0.5);
  });

  it('should handle empty response', async () => {
    mockLoadQuery.mockResolvedValue(buildResponse([]));
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(result.current.workers).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should reset to page 1 when fetching a new project', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)], true, 'cursor-1'),
    );
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('3', 'Charlie', 5400)]),
    );

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-2');
    });

    expect(result.current.page).toBe(1);
    expect(result.current.workers[0].displayName).toBe('Charlie');
  });

  it('should pass serviceItemId in filter when provided as object', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)]),
    );
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary({
        projectId: 'proj-1',
        serviceItemId: 'si-2',
      });
    });

    expect(mockLoadQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            workerTimeSummaryFilter: {
              projectId: 'proj-1',
              serviceItemId: 'si-2',
            },
          },
          first: 10,
          after: null,
        },
      }),
    );
    expect(result.current.workers).toEqual([
      {
        id: '1',
        displayName: 'Alice',
        hoursWorked: 2,
        timeForType: 'EMPLOYEE',
      },
    ]);
  });

  it('should omit serviceItemId from filter when not provided', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)]),
    );
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary({ projectId: 'proj-1' });
    });

    expect(mockLoadQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            workerTimeSummaryFilter: { projectId: 'proj-1' },
          },
          first: 10,
          after: null,
        },
      }),
    );
  });

  it('should include customerId in the filter when supplied', async () => {
    // Per the contacts-resolved-id contract, callers now pass
    // `customerId` alongside `projectId` so the supergraph can scope
    // the worker-summary read to the (project, customer) tuple. The
    // hook must thread it into the GraphQL filter input.
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)]),
    );
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary({
        projectId: 'proj-1',
        customerId: 'cust-7',
      });
    });

    expect(mockLoadQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            workerTimeSummaryFilter: {
              projectId: 'proj-1',
              customerId: 'cust-7',
            },
          },
          first: 10,
          after: null,
        },
      }),
    );
  });

  it('should include workerIds when current worker summary flag is enabled', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseQbTimeSdk.mockImplementation(() => ({
      data: true,
      loading: false,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    }));
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)]),
    );

    const { result } = renderHook(() => useWorkerTimeSummary('emp-42'));

    await act(async () => {
      await result.current.fetchWorkerSummary({
        projectId: 'proj-1',
        customerId: 'cust-7',
      });
    });

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: {
        input: {
          workerTimeSummaryFilter: {
            projectId: 'proj-1',
            customerId: 'cust-7',
            workerIds: ['emp-42'],
          },
        },
        first: 10,
        after: null,
      },
      context: {
        headers: {
          'intuit-is-workforce-user': 'true',
        },
      },
    });
  });

  it('uses parent employee id when current worker summary flag is enabled', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseQbTimeSdk.mockImplementation(() => ({
      data: true,
      loading: false,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    }));
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)]),
    );

    const { result } = renderHook(() => useWorkerTimeSummary('emp-parent-1'));

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: {
        input: {
          workerTimeSummaryFilter: {
            projectId: 'proj-1',
            workerIds: ['emp-parent-1'],
          },
        },
        first: 10,
        after: null,
      },
      context: {
        headers: {
          'intuit-is-workforce-user': 'true',
        },
      },
    });
  });

  it('fetches immediately in WFS when parent employee id is missing', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)]),
    );

    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: {
        input: {
          workerTimeSummaryFilter: {
            projectId: 'proj-1',
          },
        },
        first: 10,
        after: null,
      },
      context: {
        headers: {
          'intuit-is-workforce-user': 'true',
        },
      },
    });
  });

  it('does not include workerIds when current worker summary flag is disabled', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseQbTimeSdk.mockImplementation(() => ({
      data: false,
      loading: false,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    }));
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)]),
    );

    const { result } = renderHook(() => useWorkerTimeSummary('emp-parent-1'));

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: {
        input: {
          workerTimeSummaryFilter: {
            projectId: 'proj-1',
          },
        },
        first: 10,
        after: null,
      },
      context: {
        headers: {
          'intuit-is-workforce-user': 'true',
        },
      },
    });
  });

  it('defers fetch until current worker summary flag resolves', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    let flagValue: boolean | undefined;
    mockUseQbTimeSdk.mockImplementation(() => ({
      data: flagValue,
      loading: flagValue === undefined,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    }));
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)]),
    );

    const { result, rerender } = renderHook(() =>
      useWorkerTimeSummary('emp-42'),
    );

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(mockLoadQuery).not.toHaveBeenCalled();

    flagValue = true;
    rerender();

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: {
        input: {
          workerTimeSummaryFilter: {
            projectId: 'proj-1',
            workerIds: ['emp-42'],
          },
        },
        first: 10,
        after: null,
      },
      context: {
        headers: {
          'intuit-is-workforce-user': 'true',
        },
      },
    });
  });

  it('should paginate with serviceItemId filter', async () => {
    mockLoadQuery
      .mockResolvedValueOnce(
        buildResponse([buildEdge('1', 'Alice', 7200)], true, 'cursor-1'),
      )
      .mockResolvedValueOnce(
        buildResponse([buildEdge('2', 'Bob', 3600)], false, null),
      );

    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary({
        projectId: 'proj-1',
        serviceItemId: 'si-5',
      });
    });

    await act(async () => {
      await result.current.goToNextPage();
    });

    expect(mockLoadQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            workerTimeSummaryFilter: {
              projectId: 'proj-1',
              serviceItemId: 'si-5',
            },
          },
          first: 10,
          after: 'cursor-1',
        },
      }),
    );
    expect(result.current.page).toBe(2);
  });

  it('should not navigate next when filter is null', async () => {
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.goToNextPage();
    });

    expect(mockLoadQuery).not.toHaveBeenCalled();
    expect(result.current.page).toBe(1);
  });

  it('should not navigate prev when filter is null and page > 1', async () => {
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.goToPrevPage();
    });

    expect(mockLoadQuery).not.toHaveBeenCalled();
    expect(result.current.page).toBe(1);
  });

  it('should handle response with null endCursor when hasNextPage is true', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)], true, null),
    );
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(result.current.totalPages).toBe(2);
    expect(result.current.workers).toHaveLength(1);
  });

  it('should handle response with missing connection data', async () => {
    mockLoadQuery.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-1');
    });

    expect(result.current.workers).toEqual([]);
    expect(result.current.page).toBe(1);
  });
});

describe('mapEdgesToWorkerRows', () => {
  it('should map edges with valid timeForContactDAS', () => {
    const edges = [
      {
        node: {
          totalRegularSeconds: 7200,
          timeForType: 'EMPLOYEE',
          timeForContactDAS: {
            id: '1',
            firstName: 'Alice',
            lastName: 'Smith',
            displayName: 'Alice Smith',
            fullName: 'Alice Smith',
            type: 'EMPLOYEE',
          },
        },
        cursor: 'c1',
      },
    ];
    const rows = mapEdgesToWorkerRows(edges);
    expect(rows).toEqual([
      {
        id: '1',
        displayName: 'Alice Smith',
        hoursWorked: 2,
        timeForType: 'EMPLOYEE',
      },
    ]);
  });

  it('should handle null timeForContactDAS', () => {
    const edges = [
      {
        node: {
          totalRegularSeconds: 3600,
          timeForType: 'EMPLOYEE',
          timeForContactDAS: null,
        },
        cursor: 'c1',
      },
    ];
    const rows = mapEdgesToWorkerRows(edges);
    expect(rows).toEqual([
      { id: '', displayName: '', hoursWorked: 1, timeForType: 'EMPLOYEE' },
    ]);
  });

  it('should handle timeForContactDAS with null displayName', () => {
    const edges = [
      {
        node: {
          totalRegularSeconds: 1800,
          timeForType: 'VENDOR',
          timeForContactDAS: {
            id: '5',
            firstName: null,
            lastName: null,
            displayName: null,
            fullName: null,
            type: 'VENDOR',
          },
        },
        cursor: 'c1',
      },
    ];
    const rows = mapEdgesToWorkerRows(edges);
    expect(rows[0].id).toBe('5');
    expect(rows[0].displayName).toBe('');
    expect(rows[0].hoursWorked).toBe(0.5);
  });

  it('should handle timeForContactDAS with undefined displayName', () => {
    const edges = [
      {
        node: {
          totalRegularSeconds: 900,
          timeForType: 'LEGACY',
          timeForContactDAS: { id: '7' },
        },
        cursor: 'c1',
      },
    ];
    const rows = mapEdgesToWorkerRows(edges as any);
    expect(rows[0].id).toBe('7');
    expect(rows[0].displayName).toBe('');
  });

  it('uses timeFor.id (persona id) for LEGACY_QBO_USER rows since DAS returns null', () => {
    const edges = [
      {
        node: {
          totalRegularSeconds: 120,
          timeForType: 'LEGACY_QBO_USER',
          timeForContactDAS: null,
          timeFor: { id: '9341457094784338' },
        },
        cursor: 'c-legacy',
      },
    ];
    const rows = mapEdgesToWorkerRows(edges as any);
    expect(rows[0]).toEqual({
      id: '9341457094784338',
      displayName: '',
      hoursWorked: 0.03,
      timeForType: 'LEGACY_QBO_USER',
    });
  });
});

describe('enrichLegacyQboUserRows', () => {
  it('patches displayName for LEGACY_QBO_USER rows from the resolved name map', () => {
    const rows = [
      {
        id: '400000012',
        displayName: 'Senior Sahab',
        hoursWorked: 6,
        timeForType: 'EMPLOYEE',
      },
      {
        id: '9341457094784338',
        displayName: '',
        hoursWorked: 0.03,
        timeForType: 'LEGACY_QBO_USER',
      },
    ];
    const enriched = enrichLegacyQboUserRows(rows, {
      '9341457094784338': {
        firstName: 'Jane',
        lastName: 'Doe',
        displayName: 'Jane Doe',
      },
    });

    // Employee row is left untouched.
    expect(enriched[0]).toEqual(rows[0]);
    // Legacy row gets the Identity-resolved display name.
    expect(enriched[1]).toEqual({
      id: '9341457094784338',
      displayName: 'Jane Doe',
      hoursWorked: 0.03,
      timeForType: 'LEGACY_QBO_USER',
    });
  });

  it('keeps existing displayName when the Identity lookup returned an empty name', () => {
    const rows = [
      {
        id: 'p1',
        displayName: 'fallback@example.com',
        hoursWorked: 1,
        timeForType: 'LEGACY_QBO_USER',
      },
    ];
    const enriched = enrichLegacyQboUserRows(rows, {
      p1: { firstName: '', lastName: '', displayName: '' },
    });
    expect(enriched[0].displayName).toBe('fallback@example.com');
  });
});

describe('useWorkerTimeSummary LEGACY_QBO_USER enrichment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchNames.mockResolvedValue({});
  });

  const buildLegacyEdge = (personaId: string, totalRegularSeconds: number) => ({
    node: {
      totalRegularSeconds,
      timeForType: 'LEGACY_QBO_USER',
      timeForContactDAS: null,
      timeFor: { id: personaId },
    },
    cursor: `cursor-${personaId}`,
  });

  it('calls Identity for LEGACY_QBO_USER persona ids and patches displayName', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([
        buildEdge('400000012', 'Senior Sahab', 22380),
        buildLegacyEdge('9341457094784338', 120) as any,
      ]),
    );
    mockFetchNames.mockResolvedValue({
      '9341457094784338': {
        firstName: 'Jane',
        lastName: 'Doe',
        displayName: 'Jane Doe',
      },
    });

    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-mixed');
    });

    expect(mockFetchNames).toHaveBeenCalledWith(['9341457094784338']);
    const legacyRow = result.current.workers.find(
      (w) => w.id === '9341457094784338',
    );
    expect(legacyRow?.displayName).toBe('Jane Doe');
    // Non-legacy row is unchanged by enrichment.
    const employeeRow = result.current.workers.find(
      (w) => w.id === '400000012',
    );
    expect(employeeRow?.displayName).toBe('Senior Sahab');
  });

  it('skips the Identity call when there are no LEGACY_QBO_USER rows', async () => {
    mockLoadQuery.mockResolvedValue(
      buildResponse([buildEdge('1', 'Alice', 7200)]),
    );

    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-no-legacy');
    });

    expect(mockFetchNames).not.toHaveBeenCalled();
    expect(result.current.workers[0].displayName).toBe('Alice');
  });

  it('drops a stale Identity enrichment when a newer fetch already updated the rows', async () => {
    // First page: legacy row whose enrichment we will resolve LATE.
    let resolveFirstNames: (
      value: Record<
        string,
        { firstName: string; lastName: string; displayName: string }
      >,
    ) => void = () => {};
    mockFetchNames.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirstNames = resolve as typeof resolveFirstNames;
        }),
    );
    mockLoadQuery.mockResolvedValueOnce(
      buildResponse([buildLegacyEdge('persona-old', 60) as any]),
    );

    // Second page: completely different rows, resolves enrichment immediately.
    mockFetchNames.mockResolvedValueOnce({});
    mockLoadQuery.mockResolvedValueOnce(
      buildResponse([buildEdge('emp-new', 'New Employee', 3600)]),
    );

    const { result } = renderHook(() => useWorkerTimeSummary());

    await act(async () => {
      await result.current.fetchWorkerSummary('proj-old');
    });
    await act(async () => {
      await result.current.fetchWorkerSummary('proj-new');
    });

    // Now the FIRST enrichment finally resolves with a stale name.
    await act(async () => {
      resolveFirstNames({
        'persona-old': {
          firstName: 'Stale',
          lastName: 'Name',
          displayName: 'Stale Name',
        },
      });
      await Promise.resolve();
    });

    // The second fetch's rows must still be in place; the late enrichment
    // from the first fetch must NOT have overwritten them.
    expect(result.current.workers).toHaveLength(1);
    expect(result.current.workers[0].id).toBe('emp-new');
    expect(result.current.workers[0].displayName).toBe('New Employee');
  });
});
