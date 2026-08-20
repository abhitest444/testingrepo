import { renderHook, act } from '@testing-library/react-hooks';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError, useLazyQuery } from '@apollo/client';
import { GraphQLError } from 'graphql';
import {
  TimeCustomerInteraction,
  endInteractionWithFailure,
  createCustomerInteraction,
  endInteractionWithSuccess,
} from 'src/js/common/CustomerInteraction';
import { GET_TOTAL_DURATION_BY_DATE_QUERY } from 'src/js/service/queries/timeTrackingQueries';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { TimeTracking_TotalDurationByDateInput } from 'src/__generated__/timeTracking/graphql';
import { useGetTotalDurationByDate } from 'src/js/widgets/timeClock/hooks/useGetTotalDurationByDate';

// Mock the dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
  useSandbox: jest.fn(() => ({
    logger: {
      info: jest.fn(),
      logException: jest.fn(),
      error: jest.fn(),
    },
    performance: {
      createCustomerInteraction: jest.fn(),
      getCustomerInteraction: jest.fn(),
      getCustomerInteractionPropagationHeaders: jest.fn(),
    },
  })),
}));

jest.mock('@apollo/client', () => ({
  useLazyQuery: jest.fn(),
  ApolloError: jest.fn(),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest
    .fn()
    .mockReturnValue({ 'x-customer-interaction': 'test' }),
  TimeCustomerInteraction: {
    TOTAL_DURATION_BY_DATE_OR_WEEK_READ: 'TOTAL_DURATION_BY_DATE_OR_WEEK_READ',
  },
}));

jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn().mockReturnValue('Mapped error message'),
}));

describe('useGetTotalDurationByDate', () => {
  const mockSandbox = {
    logger: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      logException: jest.fn(),
    },
    performance: {
      createCustomerInteraction: jest.fn(),
      getCustomerInteraction: jest.fn(),
      getCustomerInteractionPropagationHeaders: jest.fn(),
    },
  };

  const mockIntl = {
    formatMessage: jest.fn(),
  };

  const mockInput = {
    totalDurationFilter: {
      dateRange: {
        beginDate: '2024-01-01',
        endDate: '2024-01-07',
      },
    },
  };

  const mockData = [
    {
      date: '2024-01-01',
      totalDuration: 480, // 8 hours in minutes
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    (useIntl as jest.Mock).mockReturnValue(mockIntl);
  });

  it('should initialize with default values', () => {
    const mockQuery = jest.fn();
    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false, error: undefined, data: undefined },
    ]);

    const { result } = renderHook(() => useGetTotalDurationByDate({}));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual([]);
  });

  it('should fetch data when input is provided', async () => {
    const mockQuery = jest.fn().mockResolvedValue({
      data: {
        timeTrackingTotalDurationByDate: {
          edges: mockData.map((node) => ({ node })),
        },
      },
      error: undefined,
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false, error: undefined, data: undefined },
    ]);

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockQuery).toHaveBeenCalledWith({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: { 'x-customer-interaction': 'test' },
      },
    });
  });

  it('should handle successful data fetch', async () => {
    const onSuccess = jest.fn();
    const mockQuery = jest.fn().mockResolvedValue({
      data: {
        timeTrackingTotalDurationByDate: {
          edges: mockData.map((node) => ({ node })),
        },
      },
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false },
    ]);

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
        onSuccess,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual(mockData);
    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });

  it('should handle error during data fetch', async () => {
    const onError = jest.fn();
    const mockError = new ApolloError({
      graphQLErrors: [new GraphQLError('Test error')],
    });
    const mockQuery = jest.fn().mockRejectedValue(mockError);

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false, error: mockError, data: undefined },
    ]);

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
        onError,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('Mapped error message');
    expect(onError).toHaveBeenCalledWith('Mapped error message');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
      mockError.message,
    );
  });

  it('should show loading state during fetch', () => {
    (useLazyQuery as jest.Mock).mockReturnValue([
      jest.fn(),
      { loading: true, error: undefined, data: undefined },
    ]);

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
      }),
    );

    expect(result.current.loading).toBe(true);
  });

  it('should handle empty data response', async () => {
    const mockQuery = jest.fn().mockResolvedValue({
      data: {
        timeTrackingTotalDurationByDate: {
          edges: [],
        },
      },
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false },
    ]);

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual([]);
  });

  it('should handle undefined edges in response', async () => {
    const mockQuery = jest.fn().mockResolvedValue({
      data: {
        timeTrackingTotalDurationByDate: {
          edges: undefined,
        },
      },
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false },
    ]);

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual([]);
  });

  it('should handle response with both error and data', async () => {
    const mockError = new ApolloError({
      graphQLErrors: [new GraphQLError('Test error')],
    });
    const mockQuery = jest.fn().mockResolvedValue({
      error: mockError,
      data: {
        timeTrackingTotalDurationByDate: {
          edges: mockData.map((node) => ({ node })),
        },
      },
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false },
    ]);

    const onError = jest.fn();
    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
        onError,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('Mapped error message');
    expect(onError).toHaveBeenCalledWith('Mapped error message');
    expect(result.current.data).toEqual([]);
  });

  it('should handle network errors', async () => {
    const onError = jest.fn();
    const networkError = new Error('Network error');
    const mockError = new ApolloError({
      networkError,
    });
    const mockQuery = jest.fn().mockRejectedValue(mockError);

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false, error: mockError, data: undefined },
    ]);

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
        onError,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('Mapped error message');
    expect(onError).toHaveBeenCalledWith('Mapped error message');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
      mockError.message,
    );
  });

  it('should handle input changes and trigger fetch', async () => {
    const mockQuery = jest.fn().mockResolvedValue({
      data: {
        timeTrackingTotalDurationByDate: {
          edges: mockData.map((node) => ({ node })),
        },
      },
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false },
    ]);

    const { result, rerender } = renderHook(
      ({ input }) => useGetTotalDurationByDate({ input }),
      {
        initialProps: {
          input: undefined as TimeTracking_TotalDurationByDateInput | undefined,
        },
      },
    );

    // First render with undefined input
    expect(mockQuery).not.toHaveBeenCalled();

    // Rerender with new input
    rerender({ input: mockInput as TimeTracking_TotalDurationByDateInput });
    expect(mockQuery).toHaveBeenCalled();
  });

  it('should handle undefined result in handleSuccess', async () => {
    const onSuccess = jest.fn();
    const mockQuery = jest.fn().mockResolvedValue({
      data: {
        timeTrackingTotalDurationByDate: {
          edges: undefined,
        },
      },
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false },
    ]);

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
        onSuccess,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual([]);
    expect(onSuccess).toHaveBeenCalledWith([]);
    expect(mockSandbox.logger.info).toHaveBeenCalledWith(
      '[Clock In/Out Flow] - useGetTotalDurationByDate - Success',
      { result: undefined },
    );
  });

  it('should handle string error in handleError', async () => {
    const onError = jest.fn();
    const stringError = 'String error message';
    const mockQuery = jest.fn().mockRejectedValue(stringError);

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false, error: stringError, data: undefined },
    ]);

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
        onError,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('Mapped error message');
    expect(onError).toHaveBeenCalledWith('Mapped error message');
    expect(mockSandbox.logger.logException).toHaveBeenCalledWith(
      '[Clock In/Out Flow] - useGetTotalDurationByDate - Error',
      expect.any(Error),
    );
  });

  it('should handle customer interaction tracking', async () => {
    const mockQuery = jest.fn().mockResolvedValue({
      data: {
        timeTrackingTotalDurationByDate: {
          edges: mockData.map((node) => ({ node })),
        },
      },
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false },
    ]);

    // Reset all mocks before the test
    jest.clearAllMocks();

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    // Verify the customer interaction was created
    expect(createCustomerInteraction).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
    );

    // Verify the query was called with the correct context
    expect(mockQuery).toHaveBeenCalledWith({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: { 'x-customer-interaction': 'test' },
      },
    });
  });

  it('should handle fetchData error with undefined error', async () => {
    const onError = jest.fn();
    const mockQuery = jest.fn().mockRejectedValue(undefined);

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false, error: undefined, data: undefined },
    ]);

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
        onError,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeUndefined();
    expect(onError).not.toHaveBeenCalled();
  });

  it('should end interaction with success on successful data fetch', async () => {
    const mockQuery = jest.fn().mockResolvedValue({
      data: {
        timeTrackingTotalDurationByDate: {
          edges: mockData.map((node) => ({ node })),
        },
      },
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false },
    ]);

    // Reset all mocks before the test
    jest.clearAllMocks();

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    // Verify the customer interaction was created
    expect(createCustomerInteraction).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
    );

    // Verify the interaction was ended with success
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
    );

    // Verify the data was set correctly
    expect(result.current.data).toEqual(mockData);
  });

  it('should handle successful query response and end interaction', async () => {
    const mockQuery = jest.fn().mockResolvedValue({
      data: {
        timeTrackingTotalDurationByDate: {
          edges: mockData.map((node) => ({ node })),
        },
      },
      error: undefined,
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false, error: undefined, data: undefined },
    ]);

    // Reset all mocks before the test
    jest.clearAllMocks();

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    // Verify the customer interaction was created
    expect(createCustomerInteraction).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
    );

    // Verify the interaction was ended with success
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
    );

    // Verify the data was set correctly
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle successful query response with onSuccess callback', async () => {
    const onSuccess = jest.fn();
    const mockQuery = jest.fn().mockResolvedValue({
      data: {
        timeTrackingTotalDurationByDate: {
          edges: mockData.map((node) => ({ node })),
        },
      },
      error: undefined,
    });

    (useLazyQuery as jest.Mock).mockReturnValue([
      mockQuery,
      { loading: false, error: undefined, data: undefined },
    ]);

    // Reset all mocks before the test
    jest.clearAllMocks();

    const { result } = renderHook(() =>
      useGetTotalDurationByDate({
        input: mockInput,
        onSuccess,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    // Verify the customer interaction was created
    expect(createCustomerInteraction).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
    );

    // Verify the interaction was ended with success
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
    );

    // Verify the data was set correctly
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeUndefined();

    // Verify onSuccess was called with the correct data
    expect(onSuccess).toHaveBeenCalledWith(mockData);

    // Verify the success log was called with the processed data
    expect(mockSandbox.logger.info).toHaveBeenCalledWith(
      '[Clock In/Out Flow] - useGetTotalDurationByDate - Success',
      { result: mockData },
    );
  });
});
