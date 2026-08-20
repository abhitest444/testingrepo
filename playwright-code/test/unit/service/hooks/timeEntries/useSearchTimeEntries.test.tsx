/* eslint-disable camelcase */
import dayjs from 'dayjs';
import { ApolloError } from '@apollo/client';
import { act } from '@testing-library/react-hooks';
import {
  TIME_ENTRIES_APOLLO_ERROR_MOCKS,
  TIME_ENTRIES_SUCCESS_MOCKS,
} from 'test/unit/service/queries/timeTrackingQueries';
import {
  getDefaultSandbox,
  renderHookWithApolloProvider,
} from 'test/unit/testUtils';
import {
  getAllSearchTimeEntriesInput,
  getLastWeekTimeEntriesInput,
  getReadWeeklyTimeEntriesInput,
  getSearchTimeEntriesInput,
  getSearchTimeEntriesInput_byTransactionId,
  mapSearchTimeEntriesResult,
  useSearchTimeEntries,
  useSearchTransactionTimeEntries,
} from 'src/js/service/hooks/timeEntries/useSearchTimeEntries';
import {
  aQuery,
  aTimeTracking_TimeEntriesInput,
  aTimeTracking_TimeEntry,
} from '__mocks__/__generated__/timeTracking';
import {
  SearchTimeEntriesQuery_Query,
  TimeTracking_BillableStatus,
  TimeTracking_TimeEntryOrderOn,
} from 'src/__generated__/timeTracking/graphql';
import { Common_SortOrder } from 'src/__generated__/oigql/graphql';
import { Week } from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';
import { TIME_TRACKING_HEADERS } from 'src/js/common/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import {
  SUBSCRIPTION_STATUS,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { SEARCH_TIME_ENTRIES_QUERY } from 'src/js/service/queries/timeTrackingQueries';

// Mock useIXPFeatureFlag
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(),
}));

jest.mock('src/js/service/hooks/entitlements/useGetEntitlements', () => ({
  ...jest.requireActual('src/js/service/hooks/entitlements/useGetEntitlements'),
  useGetEntitlements: jest.fn(),
}));

const mockUseIXPFeatureFlag = useIXPFeatureFlag as jest.MockedFunction<
  typeof useIXPFeatureFlag
>;
const mockUseGetEntitlements = useGetEntitlements as jest.MockedFunction<
  typeof useGetEntitlements
>;

beforeEach(() => {
  mockUseGetEntitlements.mockReturnValue({
    data: [],
    loading: false,
    error: undefined,
  });
});

function timeSummaryConsumptionLogLines(
  infoSpy: jest.SpyInstance,
  errorSpy: jest.SpyInstance,
): string[] {
  const fromInfo = infoSpy.mock.calls
    .map(([msg]) => msg)
    .filter(
      (m): m is string =>
        typeof m === 'string' && m.includes('EVENT=TIME_SUMMARY_API_CALL'),
    );
  const fromError = errorSpy.mock.calls
    .map(([msg]) => msg)
    .filter(
      (m): m is string =>
        typeof m === 'string' && m.includes('EVENT=TIME_SUMMARY_API_CALL'),
    );
  return [...fromInfo, ...fromError];
}

describe('useSearchTimeEntries', () => {
  beforeEach(() => {
    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: false,
      error: null,
      settled: true,
    });
  });

  it('should return loading state initially', () => {
    const { result } = renderHookWithApolloProvider(
      () =>
        useSearchTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          txnId: '123',
        }),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('should return data after query is successful', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () =>
        useSearchTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          txnId: '123',
        }),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toHaveLength(1);
  });

  it('should return error if query fails', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () =>
        useSearchTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          txnId: '123',
        }),
      TIME_ENTRIES_APOLLO_ERROR_MOCKS,
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  describe('time summary API consumption logging', () => {
    let sandbox: ReturnType<typeof getDefaultSandbox>;
    let infoSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      sandbox = getDefaultSandbox();
      infoSpy = jest.spyOn(sandbox.logger, 'info');
      errorSpy = jest.spyOn(sandbox.logger, 'error');
    });

    afterEach(() => {
      infoSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('does not emit TIME_SUMMARY_API_CALL when primary data source FF is off', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        isLoading: false,
        error: null,
        settled: true,
      });

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTimeEntries({
            input: aTimeTracking_TimeEntriesInput(),
            txnId: '123',
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
        sandbox,
      );

      await waitForNextUpdate();

      expect(timeSummaryConsumptionLogLines(infoSpy, errorSpy)).toHaveLength(0);
    });

    it('emits READ SUCCESS when FF is on and search succeeds', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTimeEntries({
            input: aTimeTracking_TimeEntriesInput(),
            txnId: '123',
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
        sandbox,
      );

      await waitForNextUpdate();

      const lines = timeSummaryConsumptionLogLines(infoSpy, errorSpy);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(
        /EVENT=TIME_SUMMARY_API_CALL API=TIME_ACTIVITY_SEARCH operation=READ status=SUCCESS/,
      );
    });

    it('emits READ FAILED when FF is on and GraphQL returns errors', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTimeEntries({
            input: aTimeTracking_TimeEntriesInput(),
            txnId: '123',
          }),
        TIME_ENTRIES_APOLLO_ERROR_MOCKS,
        sandbox,
      );

      await waitForNextUpdate();

      const lines = timeSummaryConsumptionLogLines(infoSpy, errorSpy);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(
        /EVENT=TIME_SUMMARY_API_CALL API=TIME_ACTIVITY_SEARCH operation=READ status=FAILED/,
      );
    });
  });
});

describe('mapSearchTimeEntriesResult', () => {
  test.each([
    {
      input: {
        timeTrackingTimeEntries: {
          edges: [{ node: aTimeTracking_TimeEntry() }],
        },
      },
      expected: [aTimeTracking_TimeEntry()],
    },
  ] as unknown as { input: SearchTimeEntriesQuery_Query; expected: any }[])(
    'mapSearchTimeEntriesResult should map',
    ({ input, expected }) => {
      expect(mapSearchTimeEntriesResult(input)).toEqual(expected);
    },
  );

  test('should return empty array when data is undefined', () => {
    expect(mapSearchTimeEntriesResult(undefined)).toEqual([]);
  });

  test('should return empty array when timeTrackingTimeEntries is undefined', () => {
    const data = {} as SearchTimeEntriesQuery_Query;
    expect(mapSearchTimeEntriesResult(data)).toEqual([]);
  });

  test('should return empty array when edges is undefined', () => {
    const data = {
      timeTrackingTimeEntries: {},
    } as SearchTimeEntriesQuery_Query;
    expect(mapSearchTimeEntriesResult(data)).toEqual([]);
  });

  test('should return empty array when edges is empty', () => {
    const data = {
      timeTrackingTimeEntries: {
        edges: [],
      },
    } as unknown as SearchTimeEntriesQuery_Query;
    expect(mapSearchTimeEntriesResult(data)).toEqual([]);
  });

  test('should map multiple time entries', () => {
    const entry1 = aTimeTracking_TimeEntry({ id: '1' });
    const entry2 = aTimeTracking_TimeEntry({ id: '2' });
    const data = {
      timeTrackingTimeEntries: {
        edges: [{ node: entry1 }, { node: entry2 }],
      },
    } as unknown as SearchTimeEntriesQuery_Query;
    expect(mapSearchTimeEntriesResult(data)).toEqual([entry1, entry2]);
  });
});

describe('getSearchTimeEntriesInput_byTransactionId', () => {
  test.each([
    {
      description: 'string transactionId',
      transactionId: '123' as string | undefined,
      expectedEquals: '123' as string | undefined,
    },
    {
      description: 'undefined transactionId',
      transactionId: undefined as string | undefined,
      expectedEquals: undefined as string | undefined,
    },
    {
      description: 'empty string transactionId',
      transactionId: '' as string | undefined,
      expectedEquals: '' as string | undefined,
    },
  ])(
    'should return input with $description',
    ({ transactionId, expectedEquals }) => {
      const result = getSearchTimeEntriesInput_byTransactionId(transactionId);
      expect(result).toEqual({
        orderBy: [
          {
            orderOn: TimeTracking_TimeEntryOrderOn.Date,
            orderDirection: Common_SortOrder.Asc,
          },
        ],
        timeEntryFilter: {
          timeChargeTransactionId: {
            equals: expectedEquals,
          },
        },
      });
    },
  );
});

describe('getSearchTimeEntriesInput', () => {
  test('should return input', () => {
    const day = dayjs();
    const week = { startDate: day, endDate: day } as Week;
    const result = getSearchTimeEntriesInput(week, '123');
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Asc,
        },
      ],
      timeEntryFilter: {
        date: {
          onOrAfter: day.format('YYYY-MM-DD'),
          onOrBefore: day.format('YYYY-MM-DD'),
        },
        timeForEntityId: {
          equals: '123',
        },
      },
    });
  });

  test('should return input with different start and end dates', () => {
    const startDate = dayjs('2023-06-12');
    const endDate = dayjs('2023-06-18');
    const week = { startDate, endDate } as Week;
    const result = getSearchTimeEntriesInput(week, 'employee-456');
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Asc,
        },
      ],
      timeEntryFilter: {
        date: {
          onOrAfter: '2023-06-12',
          onOrBefore: '2023-06-18',
        },
        timeForEntityId: {
          equals: 'employee-456',
        },
      },
    });
  });
});

describe('getAllSearchTimeEntriesInput', () => {
  test('should return input', () => {
    const result = getAllSearchTimeEntriesInput();
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Desc,
        },
      ],
      timeEntryFilter: {
        billableStatus: {
          notEquals: TimeTracking_BillableStatus.NotBillable,
        },
      },
    });
  });

  test('should include timeForEntityId filter when timeTrackingOnlyId is provided', () => {
    const timeTrackingOnlyId = 'test-id-123';
    const result = getAllSearchTimeEntriesInput(undefined, timeTrackingOnlyId);
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Desc,
        },
      ],
      timeEntryFilter: {
        billableStatus: {
          notEquals: TimeTracking_BillableStatus.NotBillable,
        },
        timeForEntityId: {
          equals: timeTrackingOnlyId,
        },
      },
    });
  });

  test('should include isExported filter when isExported is true', () => {
    const result = getAllSearchTimeEntriesInput(true);
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Desc,
        },
      ],
      timeEntryFilter: {
        billableStatus: {
          notEquals: TimeTracking_BillableStatus.NotBillable,
        },
        isExported: true,
      },
    });
  });

  test('should include isExported filter when isExported is false', () => {
    const result = getAllSearchTimeEntriesInput(false);
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Desc,
        },
      ],
      timeEntryFilter: {
        billableStatus: {
          notEquals: TimeTracking_BillableStatus.NotBillable,
        },
        isExported: false,
      },
    });
  });

  test('should include both timeForEntityId and isExported filters when both are provided', () => {
    const timeTrackingOnlyId = 'test-id-456';
    const result = getAllSearchTimeEntriesInput(true, timeTrackingOnlyId);
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Desc,
        },
      ],
      timeEntryFilter: {
        billableStatus: {
          notEquals: TimeTracking_BillableStatus.NotBillable,
        },
        timeForEntityId: {
          equals: timeTrackingOnlyId,
        },
        isExported: true,
      },
    });
  });

  test('should sort by CreatedTime when time summary flow is enabled', () => {
    expect(getAllSearchTimeEntriesInput(true, 'entity-1', true)).toEqual(
      expect.objectContaining({
        orderBy: [
          {
            orderOn: TimeTracking_TimeEntryOrderOn.CreatedTime,
            orderDirection: Common_SortOrder.Desc,
          },
        ],
      }),
    );
  });

  test('should sort by TimeEntryId when time summary flow is disabled', () => {
    expect(getAllSearchTimeEntriesInput(true, 'entity-1', false)).toEqual(
      expect.objectContaining({
        orderBy: [
          {
            orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
            orderDirection: Common_SortOrder.Desc,
          },
        ],
      }),
    );
  });
});

describe('getLastWeekTimeEntriesInput', () => {
  test('should return input', () => {
    const day = dayjs();
    const week = { startDate: day, endDate: day } as Week;
    const interval = 1;
    const result = getLastWeekTimeEntriesInput(week, '123', interval);
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.Date,
          orderDirection: Common_SortOrder.Desc,
        },
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Asc,
        },
      ],
      timeEntryFilter: {
        date: {
          onOrAfter: day.subtract(interval, 'month').format('YYYY-MM-DD'),
          before: day.format('YYYY-MM-DD'),
        },
        timeForEntityId: {
          equals: '123',
        },
      },
    });
  });
});

describe('getLastWeekTimeEntriesInput with varying week startDate', () => {
  test.each([
    {
      week: { startDate: dayjs('2023-01-01'), endDate: dayjs('2023-01-07') },
      nameId: '123',
      interval: 1,
      expected: {
        orderBy: [
          {
            orderOn: TimeTracking_TimeEntryOrderOn.Date,
            orderDirection: Common_SortOrder.Desc,
          },
          {
            orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
            orderDirection: Common_SortOrder.Asc,
          },
        ],
        timeEntryFilter: {
          date: {
            onOrAfter: '2022-12-01',
            before: '2023-01-01',
          },
          timeForEntityId: {
            equals: '123',
          },
        },
      },
    },
    {
      week: { startDate: dayjs('2023-02-01'), endDate: dayjs('2023-02-07') },
      nameId: '456',
      interval: 2,
      expected: {
        orderBy: [
          {
            orderOn: TimeTracking_TimeEntryOrderOn.Date,
            orderDirection: Common_SortOrder.Desc,
          },
          {
            orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
            orderDirection: Common_SortOrder.Asc,
          },
        ],
        timeEntryFilter: {
          date: {
            onOrAfter: '2022-12-01',
            before: '2023-02-01',
          },
          timeForEntityId: {
            equals: '456',
          },
        },
      },
    },
    {
      week: { startDate: dayjs('2023-02-10'), endDate: dayjs('2023-02-17') },
      nameId: '789',
      interval: 3,
      expected: {
        orderBy: [
          {
            orderOn: TimeTracking_TimeEntryOrderOn.Date,
            orderDirection: Common_SortOrder.Desc,
          },
          {
            orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
            orderDirection: Common_SortOrder.Asc,
          },
        ],
        timeEntryFilter: {
          date: {
            onOrAfter: '2022-11-10',
            before: '2023-02-10',
          },
          timeForEntityId: {
            equals: '789',
          },
        },
      },
    },
  ])(
    'should return correct input for week starting on $week.startDate',
    ({ week, nameId, interval, expected }) => {
      const result = getLastWeekTimeEntriesInput(week, nameId, interval);
      expect(result).toEqual(expected);
    },
  );
});

describe('useSearchTransactionTimeEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to feature flag disabled and settled
    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: false,
      error: null,
      settled: true,
    });
  });

  it('should return loading state initially', () => {
    const { result } = renderHookWithApolloProvider(
      () =>
        useSearchTransactionTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          first: 10,
        }),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('should return data after query is successful', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () =>
        useSearchTransactionTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          first: 10,
        }),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toHaveLength(0);
  });

  it('should return error if query fails', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () =>
        useSearchTransactionTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          first: 10,
        }),
      TIME_ENTRIES_APOLLO_ERROR_MOCKS,
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('should provide resetData function that clears data', async () => {
    const { result } = renderHookWithApolloProvider(
      () =>
        useSearchTransactionTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          first: 10,
        }),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    expect(result.current.resetData).toBeDefined();
    expect(typeof result.current.resetData).toBe('function');
  });

  it('should reset data to empty array when resetData is called', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () =>
        useSearchTransactionTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          first: 10,
        }),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    await waitForNextUpdate();

    act(() => {
      result.current.resetData();
    });

    expect(result.current.data).toEqual([]);
  });

  describe('time summary API consumption logging', () => {
    let sandbox: ReturnType<typeof getDefaultSandbox>;
    let infoSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      sandbox = getDefaultSandbox();
      infoSpy = jest.spyOn(sandbox.logger, 'info');
      errorSpy = jest.spyOn(sandbox.logger, 'error');
    });

    afterEach(() => {
      infoSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('does not emit TIME_SUMMARY_API_CALL when primary data source FF is off', async () => {
      const input = aTimeTracking_TimeEntriesInput();
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        isLoading: false,
        error: null,
        settled: true,
      });

      const transactionMocks = [
        ...TIME_ENTRIES_SUCCESS_MOCKS,
        {
          request: {
            query: SEARCH_TIME_ENTRIES_QUERY,
            variables: { input, first: 10 },
          },
          result: { data: aQuery() },
        },
      ];

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTransactionTimeEntries({
            input,
            first: 10,
          }),
        transactionMocks,
        sandbox,
      );

      await waitForNextUpdate();

      expect(timeSummaryConsumptionLogLines(infoSpy, errorSpy)).toHaveLength(0);
    });

    it('emits READ SUCCESS when FF is on and search succeeds', async () => {
      const input = aTimeTracking_TimeEntriesInput();
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      const transactionMocks = [
        ...TIME_ENTRIES_SUCCESS_MOCKS,
        {
          request: {
            query: SEARCH_TIME_ENTRIES_QUERY,
            variables: { input, first: 10 },
          },
          result: { data: aQuery() },
        },
      ];

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTransactionTimeEntries({
            input,
            first: 10,
          }),
        transactionMocks,
        sandbox,
      );

      await waitForNextUpdate();

      const lines = timeSummaryConsumptionLogLines(infoSpy, errorSpy);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(
        /EVENT=TIME_SUMMARY_API_CALL API=TIME_ACTIVITY_SEARCH operation=READ status=SUCCESS/,
      );
    });

    it('emits READ FAILED when FF is on and GraphQL returns errors', async () => {
      const input = aTimeTracking_TimeEntriesInput();
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      const transactionMocks = [
        ...TIME_ENTRIES_APOLLO_ERROR_MOCKS,
        {
          request: {
            query: SEARCH_TIME_ENTRIES_QUERY,
            variables: { input, first: 10 },
          },
          error: new ApolloError({ errorMessage: 'An error occurred' }),
        },
      ];

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTransactionTimeEntries({
            input,
            first: 10,
          }),
        transactionMocks,
        sandbox,
      );

      await waitForNextUpdate();

      const lines = timeSummaryConsumptionLogLines(infoSpy, errorSpy);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(
        /EVENT=TIME_SUMMARY_API_CALL API=TIME_ACTIVITY_SEARCH operation=READ status=FAILED/,
      );
    });
  });

  describe('settled state', () => {
    it('should NOT make API call when feature flag is not settled', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: true,
        error: null,
        settled: false,
      });
      const input = getAllSearchTimeEntriesInput(true);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      renderHookWithApolloProvider(
        () =>
          useSearchTransactionTimeEntries({
            input,
            first: 20,
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      // Wait a bit to ensure the effect has run
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should make API call when feature flag is settled', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput(true);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTransactionTimeEntries({
            input,
            first: 20,
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('intuit-is-time-activity header', () => {
    it('should add intuit-is-time-activity header when feature flag is enabled and isExported is true', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput(true);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTransactionTimeEntries({
            input,
            first: 20,
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.objectContaining({
              [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
            }),
          }),
        }),
      );
    });

    it('should NOT add intuit-is-time-activity header when feature flag is disabled', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput(true);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTransactionTimeEntries({
            input,
            first: 20,
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.not.objectContaining({
              [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
            }),
          }),
        }),
      );
    });

    it('should NOT add intuit-is-time-activity header when isExported is false', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput(false);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTransactionTimeEntries({
            input,
            first: 20,
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.not.objectContaining({
              [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
            }),
          }),
        }),
      );
    });

    it('should NOT add intuit-is-time-activity header when org has active TSheets entitlement', async () => {
      mockUseGetEntitlements.mockReturnValue({
        data: [
          {
            featureSet: ['QB_TSHEETS_ELITE'],
            status: SUBSCRIPTION_STATUS.ACTIVE,
          } as any,
        ],
        loading: false,
        error: undefined,
      });
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput(true);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTransactionTimeEntries({
            input,
            first: 20,
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.not.objectContaining({
              [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
            }),
          }),
        }),
      );
    });
  });
});

describe('useSearchTimeEntries resetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetEntitlements.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
    });
    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: false,
      error: null,
      settled: true,
    });
  });

  it('should provide resetData function', () => {
    const { result } = renderHookWithApolloProvider(
      () =>
        useSearchTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          txnId: '123',
        }),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    expect(result.current.resetData).toBeDefined();
    expect(typeof result.current.resetData).toBe('function');
  });

  it('should not trigger query when txnId is undefined', () => {
    const { result } = renderHookWithApolloProvider(
      () =>
        useSearchTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          txnId: undefined,
        }),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('should not trigger query when txnId is empty string', () => {
    const { result } = renderHookWithApolloProvider(
      () =>
        useSearchTimeEntries({
          input: aTimeTracking_TimeEntriesInput(),
          txnId: '',
        }),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  describe('settled state', () => {
    it('should NOT make API call when feature flag is not settled', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: true,
        error: null,
        settled: false,
      });
      const input = getAllSearchTimeEntriesInput(true);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      renderHookWithApolloProvider(
        () =>
          useSearchTimeEntries({
            input,
            txnId: 'test-txn-id',
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      // Wait a bit to ensure the effect has run
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should make API call when feature flag is settled', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput(true);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTimeEntries({
            input,
            txnId: 'test-txn-id',
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('intuit-is-time-activity header', () => {
    it('should add intuit-is-time-activity header when feature flag is enabled and isExported is true', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput(true);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      // Mock the lazy query hook to capture the query call
      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTimeEntries({
            input,
            txnId: 'test-txn-id',
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.objectContaining({
              [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
            }),
          }),
        }),
      );
    });

    it('should NOT add intuit-is-time-activity header when feature flag is disabled', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput(true);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTimeEntries({
            input,
            txnId: 'test-txn-id',
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.not.objectContaining({
              [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
            }),
          }),
        }),
      );
    });

    it('should NOT add intuit-is-time-activity header when isExported is false', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput(false);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTimeEntries({
            input,
            txnId: 'test-txn-id',
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.not.objectContaining({
              [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
            }),
          }),
        }),
      );
    });

    it('should add intuit-is-time-activity header when isExported is undefined (treated as time activity)', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput();
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTimeEntries({
            input,
            txnId: 'test-txn-id',
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.objectContaining({
              [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
            }),
          }),
        }),
      );
    });

    it('should NOT add intuit-is-time-activity header when org has active TSheets entitlement', async () => {
      mockUseGetEntitlements.mockReturnValue({
        data: [
          {
            featureSet: ['QB_TSHEETS_ELITE'],
            status: SUBSCRIPTION_STATUS.ACTIVE,
          } as any,
        ],
        loading: false,
        error: undefined,
      });
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      const input = getAllSearchTimeEntriesInput(true);
      const mockQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      jest
        .spyOn(
          require('src/__generated__/timeTracking/graphql'),
          'useSearchTimeEntriesLazyQuery',
        )
        .mockReturnValue([
          mockQuery,
          { loading: false, error: undefined, data: null, called: false },
        ] as any);

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () =>
          useSearchTimeEntries({
            input,
            txnId: 'test-txn-id',
          }),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      await waitForNextUpdate();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.not.objectContaining({
              [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
            }),
          }),
        }),
      );
    });
  });
});

describe('getReadWeeklyTimeEntriesInput', () => {
  test('should return input with timeForEntityId when nameId is provided', () => {
    const day = dayjs('2023-06-15');
    const week = { startDate: day, endDate: day.add(6, 'day') } as Week;
    const nameId = 'employee-123';
    const result = getReadWeeklyTimeEntriesInput(week, nameId);
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Asc,
        },
      ],
      timeEntryFilter: {
        date: {
          onOrAfter: '2023-06-15',
          onOrBefore: '2023-06-21',
        },
        isExported: false,
        timeForEntityId: {
          equals: nameId,
        },
      },
    });
  });

  test('should return input without timeForEntityId when nameId is empty string', () => {
    const day = dayjs('2023-06-15');
    const week = { startDate: day, endDate: day.add(6, 'day') } as Week;
    const result = getReadWeeklyTimeEntriesInput(week, '');
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Asc,
        },
      ],
      timeEntryFilter: {
        date: {
          onOrAfter: '2023-06-15',
          onOrBefore: '2023-06-21',
        },
        isExported: false,
      },
    });
  });

  test('should return input without timeForEntityId when nameId is whitespace only', () => {
    const day = dayjs('2023-06-15');
    const week = { startDate: day, endDate: day.add(6, 'day') } as Week;
    const result = getReadWeeklyTimeEntriesInput(week, '   ');
    expect(result).toEqual({
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Asc,
        },
      ],
      timeEntryFilter: {
        date: {
          onOrAfter: '2023-06-15',
          onOrBefore: '2023-06-21',
        },
        isExported: false,
      },
    });
  });

  test.each([
    {
      week: { startDate: dayjs('2023-01-01'), endDate: dayjs('2023-01-07') },
      nameId: 'emp-001',
      expected: {
        orderBy: [
          {
            orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
            orderDirection: Common_SortOrder.Asc,
          },
        ],
        timeEntryFilter: {
          date: {
            onOrAfter: '2023-01-01',
            onOrBefore: '2023-01-07',
          },
          isExported: false,
          timeForEntityId: {
            equals: 'emp-001',
          },
        },
      },
    },
    {
      week: { startDate: dayjs('2023-12-25'), endDate: dayjs('2023-12-31') },
      nameId: 'emp-002',
      expected: {
        orderBy: [
          {
            orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
            orderDirection: Common_SortOrder.Asc,
          },
        ],
        timeEntryFilter: {
          date: {
            onOrAfter: '2023-12-25',
            onOrBefore: '2023-12-31',
          },
          isExported: false,
          timeForEntityId: {
            equals: 'emp-002',
          },
        },
      },
    },
  ])(
    'should return correct input for various week ranges with nameId $nameId',
    ({ week, nameId, expected }) => {
      const result = getReadWeeklyTimeEntriesInput(week as Week, nameId);
      expect(result).toEqual(expected);
    },
  );
});
