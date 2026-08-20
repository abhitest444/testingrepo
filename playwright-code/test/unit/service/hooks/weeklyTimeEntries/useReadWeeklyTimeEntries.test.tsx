import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useIntl, useSandbox } from '@payroll/quicksand';
import dayjs from 'dayjs';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { useReadWeeklyTimeEntries } from 'src/js/service/hooks/weeklyTimeEntries/useReadWeeklyTimeEntries';
import {
  useWeeklyTimeEntriesQuery,
  mapWeeklyTimeEntriesResult,
} from 'src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntryQuery';
// New mocks to increase coverage
import { getReadWeeklyTimeEntriesInput } from 'src/js/service/hooks/timeEntries/useSearchTimeEntries';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { mapError } from 'src/js/service/utils/mapError';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

jest.mock(
  'src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntryQuery',
  () => ({
    useWeeklyTimeEntriesQuery: jest.fn(),
    mapWeeklyTimeEntriesResult: jest.fn(),
  }),
);

jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
  useSandbox: jest.fn(),
}));

jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

jest.mock('src/js/service/hooks/timeEntries/useSearchTimeEntries', () => {
  const actual = jest.requireActual(
    'src/js/service/hooks/timeEntries/useSearchTimeEntries',
  );
  return {
    ...actual,
    getReadWeeklyTimeEntriesInput: jest.fn(
      actual.getReadWeeklyTimeEntriesInput,
    ),
  };
});

jest.mock('src/js/common/CustomerInteraction', () => {
  const actual = jest.requireActual('src/js/common/CustomerInteraction');
  return {
    ...actual,
    createCustomerInteraction: jest.fn(),
    endInteractionWithFailure: jest.fn(),
    endInteractionWithSuccess: jest.fn(),
    getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
  };
});

// Mock Apollo Client
const mockApolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: {} as any,
});

const TestWrapper: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <ApolloProvider client={mockApolloClient}>{children}</ApolloProvider>;

describe('useReadWeeklyTimeEntries', () => {
  const mockSandbox = {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    performance: {
      createCustomerInteraction: jest.fn(),
      getCustomerInteraction: jest.fn(),
    },
  };

  const mockIntl = {
    formatMessage: jest.fn(),
  };

  const mockWeek = {
    startDate: dayjs('2024-03-01'),
    endDate: dayjs('2024-03-07'),
  };

  const mockNameId = 'test-user-123';

  const mockTimeEntries = [
    {
      id: 'entry-1',
      date: '2024-03-01',
      startTime: '09:00:00',
      endTime: '17:00:00',
    },
    {
      id: 'entry-2',
      date: '2024-03-02',
      startTime: '09:00:00',
      endTime: '17:00:00',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    (useIntl as jest.Mock).mockReturnValue(mockIntl);
    (mapWeeklyTimeEntriesResult as jest.Mock).mockReturnValue(mockTimeEntries);
    (mapError as jest.Mock).mockReturnValue('Mapped error message');
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
  });

  it('should fetch time entries when nameId and week are provided', async () => {
    const mockQuery = jest.fn();
    (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
      mockQuery,
      {
        data: {
          timeTrackingTimeEntries: {
            edges: mockTimeEntries.map((entry) => ({ node: entry })),
          },
        },
        loading: false,
        error: null,
      },
    ]);

    const { result } = renderHook(
      () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
      { wrapper: TestWrapper },
    );

    // Wait for effect to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockQuery).toHaveBeenCalledWith({
      variables: {
        input: {
          orderBy: [
            {
              orderDirection: 'ASC',
              orderOn: 'TIME_ENTRY_ID',
            },
          ],
          timeEntryFilter: {
            date: {
              onOrAfter: '2024-03-01',
              onOrBefore: '2024-03-07',
            },
            isExported: false,
            timeForEntityId: {
              equals: mockNameId,
            },
          },
        },
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
      context: {
        clientName: 2, // ApolloClientNames.TIME_TRACKING
        headers: {},
      },
    });

    expect(result.current.entries).toEqual(mockTimeEntries);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch time entries when nameId is empty', () => {
    const mockQuery = jest.fn();
    (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
      mockQuery,
      {
        data: null,
        loading: false,
        error: null,
      },
    ]);

    renderHook(() => useReadWeeklyTimeEntries('', mockWeek), {
      wrapper: TestWrapper,
    });

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should handle loading state', async () => {
    (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
      jest.fn(),
      {
        data: null,
        loading: true,
        error: null,
      },
    ]);

    const { result } = renderHook(
      () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
      { wrapper: TestWrapper },
    );

    // Wait for effect to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.entries).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle error state', async () => {
    const mockError = new Error('Test error');
    const mockQuery = jest.fn();
    (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
      mockQuery,
      {
        data: null,
        loading: false,
        error: mockError,
      },
    ]);

    // Mock the mapError utility to return a string
    (mockIntl.formatMessage as jest.Mock).mockReturnValue(
      'Mapped error message',
    );

    const { result } = renderHook(
      () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
      { wrapper: TestWrapper },
    );

    // Wait for effect to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Mapped error message');
    expect(result.current.entries).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockSandbox.logger.error).toHaveBeenCalledWith(
      'Component=useReadWeeklyTimeEntries Message=Failed to Fetch Weekly Time Entries',
      expect.objectContaining({
        error: 'Test error',
        nameId: mockNameId,
        startDate: '2024-03-01',
        endDate: '2024-03-07',
        timeEntriesFetched: 0,
      }),
    );
  });

  it('should not re-fetch when week object is recreated with same dates', async () => {
    const mockQuery = jest.fn();
    (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
      mockQuery,
      {
        data: {
          timeTrackingTimeEntries: {
            edges: mockTimeEntries.map((entry) => ({ node: entry })),
          },
        },
        loading: false,
        error: null,
      },
    ]);

    const { rerender } = renderHook(
      ({ nameId, week }) => useReadWeeklyTimeEntries(nameId, week),
      {
        initialProps: { nameId: mockNameId, week: mockWeek },
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      },
    );

    // Wait for initial effect to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Re-render with a new week object but same dates
    await act(async () => {
      rerender({
        nameId: mockNameId,
        week: {
          startDate: dayjs('2024-03-01'),
          endDate: dayjs('2024-03-07'),
        },
      });
    });

    // Wait for effect to complete after rerender
    await act(async () => {
      await Promise.resolve();
    });

    // Query should only be called once
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('should re-fetch when week dates change', async () => {
    const mockQuery = jest.fn();
    (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
      mockQuery,
      {
        data: {
          timeTrackingTimeEntries: {
            edges: mockTimeEntries.map((entry) => ({ node: entry })),
          },
        },
        loading: false,
        error: null,
      },
    ]);

    const { rerender } = renderHook(
      ({ nameId, week }) => useReadWeeklyTimeEntries(nameId, week),
      {
        initialProps: { nameId: mockNameId, week: mockWeek },
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      },
    );

    // Wait for initial effect to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Re-render with different dates
    await act(async () => {
      rerender({
        nameId: mockNameId,
        week: {
          startDate: dayjs('2024-03-08'),
          endDate: dayjs('2024-03-14'),
        },
      });
    });

    // Wait for effect to complete after rerender
    await act(async () => {
      await Promise.resolve();
    });

    // Query should be called twice (initial + new dates)
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  // Edge Cases and Validation Tests
  describe('Edge Cases and Validation', () => {
    it('should not fetch when nameId is null', () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);

      renderHook(() => useReadWeeklyTimeEntries(null as any, mockWeek), {
        wrapper: TestWrapper,
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should not fetch when nameId is undefined', () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);

      renderHook(() => useReadWeeklyTimeEntries(undefined as any, mockWeek), {
        wrapper: TestWrapper,
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should not fetch when nameId is only whitespace', () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);

      renderHook(() => useReadWeeklyTimeEntries('   ', mockWeek), {
        wrapper: TestWrapper,
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should not fetch when week is null', () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);

      renderHook(() => useReadWeeklyTimeEntries(mockNameId, null as any), {
        wrapper: TestWrapper,
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should not fetch when week startDate is null', () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);

      const invalidWeek = {
        startDate: null as any,
        endDate: dayjs('2024-03-07'),
      };

      renderHook(() => useReadWeeklyTimeEntries(mockNameId, invalidWeek), {
        wrapper: TestWrapper,
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should not fetch when week endDate is null', () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);

      const invalidWeek = {
        startDate: dayjs('2024-03-01'),
        endDate: null as any,
      };

      renderHook(() => useReadWeeklyTimeEntries(mockNameId, invalidWeek), {
        wrapper: TestWrapper,
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  // Data Processing Tests
  describe('Data Processing', () => {
    it('should handle empty data response', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: {
            timeTrackingTimeEntries: {
              edges: [],
            },
          },
          loading: false,
          error: null,
        },
      ]);

      (mapWeeklyTimeEntriesResult as jest.Mock).mockReturnValue([]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.entries).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=useReadWeeklyTimeEntries Message=Weekly Time Entries Fetched Successfully',
        expect.objectContaining({
          noOfTimeEntriesFetched: 0,
          nameId: mockNameId,
        }),
      );
    });

    it('should handle null data response', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.entries).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle malformed data response', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: {
            timeTrackingTimeEntries: null,
          },
          loading: false,
          error: null,
        },
      ]);

      (mapWeeklyTimeEntriesResult as jest.Mock).mockReturnValue([]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.entries).toEqual([]);
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=useReadWeeklyTimeEntries Message=Weekly Time Entries Fetched Successfully',
        expect.objectContaining({
          noOfTimeEntriesFetched: 0,
        }),
      );
    });
  });

  // Refetch Functionality Tests
  describe('Refetch Functionality', () => {
    it('should successfully refetch data', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: {
            timeTrackingTimeEntries: {
              edges: mockTimeEntries.map((entry) => ({ node: entry })),
            },
          },
          loading: false,
          error: null,
        },
      ]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      // Clear previous calls
      mockQuery.mockClear();

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockQuery).toHaveBeenCalledWith({
        variables: {
          input: {
            orderBy: [
              {
                orderDirection: 'ASC',
                orderOn: 'TIME_ENTRY_ID',
              },
            ],
            timeEntryFilter: {
              date: {
                onOrAfter: '2024-03-01',
                onOrBefore: '2024-03-07',
              },
              isExported: false,
              timeForEntityId: {
                equals: mockNameId,
              },
            },
          },
        },
        fetchPolicy: 'network-only',
        context: {
          clientName: 2,
        },
      });
    });

    it('should not refetch when nameId is empty', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries('', mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should fallback to apolloRefetch when query fails', async () => {
      const mockQuery = jest
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValue(new Error('Query failed'));
      const mockApolloRefetch = jest.fn().mockResolvedValue({});

      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: {
            timeTrackingTimeEntries: {
              edges: mockTimeEntries.map((entry) => ({ node: entry })),
            },
          },
          loading: false,
          error: null,
          refetch: mockApolloRefetch,
        },
      ]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      // Call refetch - this should trigger the rejected value
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockApolloRefetch).toHaveBeenCalled();
    });

    it('should handle refetch when apolloRefetch is not available', async () => {
      const mockQuery = jest
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValue(new Error('Query failed'));

      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: {
            timeTrackingTimeEntries: {
              edges: mockTimeEntries.map((entry) => ({ node: entry })),
            },
          },
          loading: false,
          error: null,
          refetch: undefined,
        },
      ]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      // This should not throw an error
      await act(async () => {
        await expect(result.current.refetch()).resolves.not.toThrow();
      });
    });
  });

  // Customer Interaction Logging Tests
  describe('Customer Interaction Logging', () => {
    it('should create customer interaction on successful fetch', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: {
            timeTrackingTimeEntries: {
              edges: mockTimeEntries.map((entry) => ({ node: entry })),
            },
          },
          loading: false,
          error: null,
        },
      ]);

      renderHook(() => useReadWeeklyTimeEntries(mockNameId, mockWeek), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(createCustomerInteraction).toHaveBeenCalledWith(
        mockSandbox,
        'weekly-time-sheet-read',
      );
    });

    it('should log successful fetch with correct data', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: {
            timeTrackingTimeEntries: {
              edges: mockTimeEntries.map((entry) => ({ node: entry })),
            },
          },
          loading: false,
          error: null,
        },
      ]);

      renderHook(() => useReadWeeklyTimeEntries(mockNameId, mockWeek), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=useReadWeeklyTimeEntries Message=Weekly Time Entries Fetched Successfully',
        expect.objectContaining({
          noOfTimeEntriesFetched: 2,
          nameId: mockNameId,
          startDate: '2024-03-01',
          endDate: '2024-03-07',
          timeEntriesFetched: 2,
        }),
      );
    });

    it('should log error details on fetch failure', async () => {
      const mockError = new Error('Network error');
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: null,
          loading: false,
          error: mockError,
        },
      ]);

      (mockIntl.formatMessage as jest.Mock).mockReturnValue(
        'Mapped error message',
      );

      renderHook(() => useReadWeeklyTimeEntries(mockNameId, mockWeek), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=useReadWeeklyTimeEntries Message=Failed to Fetch Weekly Time Entries',
        expect.objectContaining({
          error: 'Network error',
          nameId: mockNameId,
          startDate: '2024-03-01',
          endDate: '2024-03-07',
          timeEntriesFetched: 0,
        }),
      );
    });
  });

  // Complex Integration Scenarios
  describe('Integration Scenarios', () => {
    it('should handle multiple rapid nameId changes', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: {
            timeTrackingTimeEntries: {
              edges: mockTimeEntries.map((entry) => ({ node: entry })),
            },
          },
          loading: false,
          error: null,
        },
      ]);

      const { rerender } = renderHook(
        ({ nameId }) => useReadWeeklyTimeEntries(nameId, mockWeek),
        {
          initialProps: { nameId: mockNameId },
          wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
        },
      );

      await act(async () => {
        await Promise.resolve();
      });

      // Rapidly change nameId multiple times
      await act(async () => {
        rerender({ nameId: 'user-2' });
      });

      await act(async () => {
        rerender({ nameId: 'user-3' });
      });

      await act(async () => {
        rerender({ nameId: 'user-4' });
      });

      // Should have been called for each valid nameId
      expect(mockQuery).toHaveBeenCalledTimes(4); // Initial + 3 rerenders
    });

    it('should handle transition from loading to error state', async () => {
      const mockQuery = jest.fn();
      const mockQueryResult = {
        data: null,
        loading: true,
        error: null,
      };

      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        mockQueryResult,
      ]);

      const { result, rerender } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      // Simulate transition to error state
      mockQueryResult.loading = false;
      mockQueryResult.error = new Error('Network timeout') as any;
      (mockIntl.formatMessage as jest.Mock).mockReturnValue(
        'Network timeout error',
      );

      await act(async () => {
        rerender();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Mapped error message');
    });

    it('should handle transition from loading to success state', async () => {
      const mockQuery = jest.fn();
      const mockQueryResult = {
        data: null,
        loading: true,
        error: null,
      };

      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        mockQueryResult,
      ]);

      const { result, rerender } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.entries).toEqual([]);

      // Simulate transition to success state
      mockQueryResult.loading = false;
      mockQueryResult.data = {
        timeTrackingTimeEntries: {
          edges: mockTimeEntries.map((entry) => ({ node: entry })),
        },
      } as any;

      await act(async () => {
        rerender();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.entries).toEqual(mockTimeEntries);
      expect(result.current.error).toBeNull();
    });

    it('should preserve stable reference for refetch function', () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);

      const { result, rerender } = renderHook(
        ({ nameId }: { nameId: string }) =>
          useReadWeeklyTimeEntries(nameId, mockWeek),
        {
          initialProps: { nameId: mockNameId },
          wrapper: ({ children }: { children?: React.ReactNode }) => (
            <TestWrapper>{children}</TestWrapper>
          ),
        },
      );

      const initialRefetch = result.current.refetch;

      // Rerender with same props
      rerender({ nameId: mockNameId });

      expect(result.current.refetch).toBe(initialRefetch);
    });
  });

  // Additional Coverage Tests
  describe('Additional Coverage', () => {
    it('should include workforce header for fetch and refetch when workforce user', async () => {
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: { timeTrackingTimeEntries: { edges: [] } },
          loading: false,
          error: null,
        },
      ]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            clientName: 2,
            headers: { 'intuit-is-workforce-user': 'true' },
          }),
        }),
      );

      mockQuery.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            clientName: 2,
            headers: { 'intuit-is-workforce-user': 'true' },
          }),
        }),
      );
    });

    it('should pass correct options to useWeeklyTimeEntriesQuery', () => {
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        jest.fn(),
        { data: null, loading: false, error: null },
      ]);

      renderHook(() => useReadWeeklyTimeEntries(mockNameId, mockWeek), {
        wrapper: TestWrapper,
      });

      const callArg = (useWeeklyTimeEntriesQuery as jest.Mock).mock.calls[0][0];
      expect(callArg).toEqual({
        context: { clientName: 2 },
      });
    });

    it('should build variables using getReadWeeklyTimeEntriesInput for fetch and refetch', async () => {
      const mockQuery = jest.fn();
      const sentinelInput = { some: 'input' } as any;
      (getReadWeeklyTimeEntriesInput as jest.Mock).mockReturnValue(
        sentinelInput,
      );

      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: { timeTrackingTimeEntries: { edges: [] } },
          loading: false,
          error: null,
        },
      ]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(getReadWeeklyTimeEntriesInput).toHaveBeenCalledWith(
        mockWeek,
        mockNameId,
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { input: sentinelInput } }),
      );

      mockQuery.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      expect(getReadWeeklyTimeEntriesInput).toHaveBeenCalledWith(
        mockWeek,
        mockNameId,
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { input: sentinelInput } }),
      );
    });

    it('should end interaction with failure when error occurs and no data is present', async () => {
      const apolloError: any = new Error('Boom');
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        jest.fn(),
        { data: null, loading: false, error: apolloError },
      ]);

      renderHook(() => useReadWeeklyTimeEntries(mockNameId, mockWeek), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SHEET_READ,
        'Boom',
        apolloError,
      );
    });

    it('should log error details and end interaction with success when data and error both exist', async () => {
      const apolloError: any = {
        message: 'Partial',
        graphQLErrors: [{ path: ['timeTrackingTimeEntries'] }],
        networkError: { message: 'Net fail' },
      };

      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        jest.fn(),
        {
          data: {
            timeTrackingTimeEntries: {
              edges: mockTimeEntries.map((e) => ({ node: e })),
            },
          },
          loading: false,
          error: apolloError,
        },
      ]);

      renderHook(() => useReadWeeklyTimeEntries(mockNameId, mockWeek), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=useReadWeeklyTimeEntries Message=An Error Encountered While Fetching Weekly Time Entries',
        expect.objectContaining({
          error: 'Partial',
          graphQLErrors: ['timeTrackingTimeEntries'],
          networkErrors: 'Net fail',
        }),
      );
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SHEET_READ,
      );
    });

    it('should set error to null when mapError returns null', async () => {
      (mapError as jest.Mock).mockReturnValueOnce(null);

      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        jest.fn(),
        { data: null, loading: false, error: new Error('x') },
      ]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, mockWeek),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.error).toBeNull();
    });

    it('should not trigger fetch when nameId becomes whitespace after valid value', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        {
          data: { timeTrackingTimeEntries: { edges: [] } },
          loading: false,
          error: null,
        },
      ]);

      const { rerender } = renderHook(
        ({ nameId }) => useReadWeeklyTimeEntries(nameId, mockWeek),
        {
          initialProps: { nameId: mockNameId },
          wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
        },
      );

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        rerender({ nameId: '   ' as any });
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should not refetch when week is invalid (missing dates)', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        { data: null, loading: false, error: null },
      ]);

      const invalidWeek = { startDate: null as any, endDate: null as any };

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(mockNameId, invalidWeek as any),
        { wrapper: TestWrapper },
      );

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should not refetch when nameId is an empty string', async () => {
      const mockQuery = jest.fn();
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        { data: null, loading: false, error: null },
      ]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries('', mockWeek),
        { wrapper: TestWrapper },
      );

      mockQuery.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should still refetch when nameId is undefined (undefined !== "" is true)', async () => {
      const mockQuery = jest.fn().mockResolvedValue({});
      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        mockQuery,
        { data: null, loading: false, error: null },
      ]);

      const { result } = renderHook(
        () => useReadWeeklyTimeEntries(undefined as any, mockWeek),
        { wrapper: TestWrapper },
      );

      mockQuery.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      // undefined?.trim() === undefined, and undefined !== '' is true,
      // so the refetch guard does NOT block when nameId is undefined
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('Error without networkError', () => {
    it('should log error without networkError message when networkError is null', async () => {
      const apolloError: any = {
        message: 'Partial no network',
        graphQLErrors: [{ path: ['timeTrackingTimeEntries'] }],
        networkError: null,
      };

      (useWeeklyTimeEntriesQuery as jest.Mock).mockReturnValue([
        jest.fn(),
        {
          data: {
            timeTrackingTimeEntries: {
              edges: mockTimeEntries.map((e) => ({ node: e })),
            },
          },
          loading: false,
          error: apolloError,
        },
      ]);

      renderHook(() => useReadWeeklyTimeEntries(mockNameId, mockWeek), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=useReadWeeklyTimeEntries Message=An Error Encountered While Fetching Weekly Time Entries',
        expect.objectContaining({
          error: 'Partial no network',
          networkErrors: undefined,
        }),
      );
    });
  });
});
