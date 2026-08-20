import { renderHook, act } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { useLazyQuery } from '@apollo/client';
import {
  useWhoIsWorking,
  WHO_IS_WORKING_PAGE_SIZE,
} from 'src/js/service/hooks/whosWorking/useWhoIsWorking';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

// Mock dependencies
jest.mock('@payroll/quicksand');
jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(),
}));
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
  TimeCustomerInteraction: {
    WHO_IS_WORKING_LOAD: 'who-is-working-load',
  },
}));
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

describe('useWhoIsWorking', () => {
  const mockLoadQuery = jest.fn();
  const mockRefetch = jest.fn();
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };
  const mockSandbox = {
    logger: mockLogger,
  };

  const mockWorkerData = {
    timeTrackingWhoIsWorking: {
      edges: [
        {
          cursor: 'cursor-1',
          node: {
            timeForContactDAS: { id: 'contact-1' },
            firstName: 'John',
            lastName: 'Doe',
            displayName: 'John Doe',
            timeForType: 'EMPLOYEE',
            group: { groupId: 'group-1', groupName: 'Engineering' },
            totalDaySeconds: 3600,
            activeTimeEntry: {
              id: 'entry-1',
              startTime: '2024-01-01T09:00:00Z',
              duration: 3600,
              isOpen: true,
            },
            currentLocation: { latitude: 37.7749, longitude: -122.4194 },
          },
        },
        {
          cursor: 'cursor-2',
          node: {
            timeForContactDAS: { id: 'contact-2' },
            firstName: 'Jane',
            lastName: 'Smith',
            displayName: 'Jane Smith',
            timeForType: 'EMPLOYEE',
            group: null,
            totalDaySeconds: 7200,
            activeTimeEntry: null,
            currentLocation: null,
          },
        },
      ],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'cursor-1',
        endCursor: 'cursor-2',
      },
      summary: {
        totalOnClock: 10,
        totalWorkers: 50,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);

    // Default mock for useLazyQuery
    (useLazyQuery as jest.Mock).mockReturnValue([
      mockLoadQuery,
      { data: null, loading: false, error: null, refetch: mockRefetch },
    ]);
  });

  describe('Initialization', () => {
    it('should return initial state with loading false and empty workers', () => {
      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.loading).toBe(false);
      expect(result.current.workers).toEqual([]);
      expect(result.current.pageInfo).toBeNull();
      expect(result.current.summary).toBeNull();
      expect(result.current.error).toBeNull();
      expect(typeof result.current.loadWhoIsWorking).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should export WHO_IS_WORKING_PAGE_SIZE constant', () => {
      expect(WHO_IS_WORKING_PAGE_SIZE).toBe(100);
    });
  });

  describe('loadWhoIsWorking', () => {
    it('should call loadQuery with filter', () => {
      const { result } = renderHook(() => useWhoIsWorking());
      const filter = { clockedInTimeForOnly: true };

      act(() => {
        result.current.loadWhoIsWorking({ filter });
      });

      expect(mockLoadQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            first: WHO_IS_WORKING_PAGE_SIZE,
            after: undefined,
            filter,
            orderBy: undefined,
          },
        }),
      );
    });

    it('should call loadQuery with custom page size', () => {
      const { result } = renderHook(() => useWhoIsWorking());
      const filter = { clockedInTimeForOnly: false };

      act(() => {
        result.current.loadWhoIsWorking({ first: 50, filter });
      });

      expect(mockLoadQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            first: 50,
            after: undefined,
            filter,
            orderBy: undefined,
          },
        }),
      );
    });

    it('should call loadQuery with orderBy parameter', () => {
      const { result } = renderHook(() => useWhoIsWorking());
      const filter = { clockedInTimeForOnly: true };
      const orderBy = [{ orderOn: 'CLOCK_IN_TIME', orderDirection: 'ASC' }];

      act(() => {
        result.current.loadWhoIsWorking({ filter, orderBy: orderBy as any });
      });

      expect(mockLoadQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            first: WHO_IS_WORKING_PAGE_SIZE,
            after: undefined,
            filter,
            orderBy,
          },
        }),
      );
    });

    it('should call loadQuery with cursor for pagination', () => {
      const { result } = renderHook(() => useWhoIsWorking());
      const filter = { clockedInTimeForOnly: true };

      act(() => {
        result.current.loadWhoIsWorking({
          first: 20,
          after: 'cursor-xyz',
          filter,
        });
      });

      expect(mockLoadQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            first: 20,
            after: 'cursor-xyz',
            filter,
            orderBy: undefined,
          },
        }),
      );
    });
  });

  describe('Data Processing', () => {
    it('should extract workers from edges', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          data: mockWorkerData,
          loading: false,
          error: null,
          refetch: mockRefetch,
        },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.workers).toHaveLength(2);
      expect(result.current.workers[0].firstName).toBe('John');
      expect(result.current.workers[1].firstName).toBe('Jane');
    });

    it('should extract pageInfo from response', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          data: mockWorkerData,
          loading: false,
          error: null,
          refetch: mockRefetch,
        },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.pageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'cursor-1',
        endCursor: 'cursor-2',
      });
    });

    it('should extract summary from response', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          data: mockWorkerData,
          loading: false,
          error: null,
          refetch: mockRefetch,
        },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.summary).toEqual({
        totalOnClock: 10,
        totalWorkers: 50,
      });
    });

    it('should return empty workers when data is null', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        { data: null, loading: false, error: null, refetch: mockRefetch },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.workers).toEqual([]);
    });

    it('should return empty workers when edges is undefined', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          data: { timeTrackingWhoIsWorking: { edges: undefined } },
          loading: false,
          error: null,
          refetch: mockRefetch,
        },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.workers).toEqual([]);
    });

    it('should handle empty edges array', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          data: {
            timeTrackingWhoIsWorking: {
              edges: [],
              pageInfo: { hasNextPage: false, endCursor: null },
              summary: { totalOnClock: 0, totalWorkers: 0 },
            },
          },
          loading: false,
          error: null,
          refetch: mockRefetch,
        },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.workers).toEqual([]);
      expect(result.current.summary?.totalOnClock).toBe(0);
    });
  });

  describe('Loading State', () => {
    it('should return loading true when query is loading', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        { data: null, loading: true, error: null, refetch: mockRefetch },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.loading).toBe(true);
    });

    it('should return loading false when query completes', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          data: mockWorkerData,
          loading: false,
          error: null,
          refetch: mockRefetch,
        },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return error message when query fails', () => {
      const mockError = { message: 'Network error occurred' };
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        { data: null, loading: false, error: mockError, refetch: mockRefetch },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.error).toBe('Network error occurred');
    });

    it('should return null error when no error', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          data: mockWorkerData,
          loading: false,
          error: null,
          refetch: mockRefetch,
        },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());

      expect(result.current.error).toBeNull();
    });
  });

  describe('Refetch', () => {
    it('should call apolloRefetch with variables', async () => {
      mockRefetch.mockResolvedValue({ data: mockWorkerData });

      const { result } = renderHook(() => useWhoIsWorking());
      const filter = { clockedInTimeForOnly: true };

      await act(async () => {
        await result.current.refetch({ filter });
      });

      expect(mockRefetch).toHaveBeenCalledWith({
        first: WHO_IS_WORKING_PAGE_SIZE,
        after: undefined,
        filter,
        orderBy: undefined,
      });
    });

    it('should use custom page size in refetch', async () => {
      mockRefetch.mockResolvedValue({ data: mockWorkerData });

      const { result } = renderHook(() => useWhoIsWorking());
      const filter = { clockedInTimeForOnly: false };

      await act(async () => {
        await result.current.refetch({ first: 100, filter });
      });

      expect(mockRefetch).toHaveBeenCalledWith({
        first: 100,
        after: undefined,
        filter,
        orderBy: undefined,
      });
    });

    it('should handle refetch errors gracefully', async () => {
      const refetchError = new Error('Refetch failed');
      mockRefetch.mockRejectedValue(refetchError);

      const { result } = renderHook(() => useWhoIsWorking());
      const filter = { clockedInTimeForOnly: true };

      await act(async () => {
        await result.current.refetch({ filter });
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error refetching who is working:',
        { error: refetchError },
      );
    });
  });

  describe('Query Configuration', () => {
    it('should configure lazy query with no-cache fetch policy', () => {
      renderHook(() => useWhoIsWorking());

      expect(useLazyQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fetchPolicy: 'no-cache',
        }),
      );
    });

    it('should configure lazy query with notifyOnNetworkStatusChange', () => {
      renderHook(() => useWhoIsWorking());

      expect(useLazyQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          notifyOnNetworkStatusChange: true,
        }),
      );
    });

    it('should pass workforce header context in workforce environment', () => {
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
      renderHook(() => useWhoIsWorking());

      expect(useLazyQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          context: {
            headers: {
              'intuit-is-workforce-user': 'true',
            },
          },
        }),
      );
    });

    it('should not pass workforce header context in non-workforce environment', () => {
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
      renderHook(() => useWhoIsWorking());

      expect(useLazyQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.not.objectContaining({
          context: expect.anything(),
        }),
      );
    });
  });

  describe('Worker Data Structure', () => {
    it('should correctly map worker node fields', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          data: mockWorkerData,
          loading: false,
          error: null,
          refetch: mockRefetch,
        },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());
      const worker = result.current.workers[0];

      expect(worker.timeForContactDAS).toEqual({ id: 'contact-1' });
      expect(worker.firstName).toBe('John');
      expect(worker.lastName).toBe('Doe');
      expect(worker.displayName).toBe('John Doe');
      expect(worker.timeForType).toBe('EMPLOYEE');
      expect(worker.group).toEqual({
        groupId: 'group-1',
        groupName: 'Engineering',
      });
      expect(worker.totalDaySeconds).toBe(3600);
      expect(worker.activeTimeEntry).toBeDefined();
      expect(worker.currentLocation).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
      });
    });

    it('should handle workers without optional fields', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          data: mockWorkerData,
          loading: false,
          error: null,
          refetch: mockRefetch,
        },
      ]);

      const { result } = renderHook(() => useWhoIsWorking());
      const worker = result.current.workers[1];

      expect(worker.group).toBeNull();
      expect(worker.activeTimeEntry).toBeNull();
      expect(worker.currentLocation).toBeNull();
    });
  });

  describe('Customer Interaction Tracking', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        { data: null, loading: false, error: null, refetch: mockRefetch },
      ]);
    });

    describe('loadWhoIsWorking', () => {
      it('should create WHO_IS_WORKING_LOAD interaction for initial load', () => {
        const { result } = renderHook(() => useWhoIsWorking());
        const filter = { clockedInTimeForOnly: true };

        act(() => {
          result.current.loadWhoIsWorking({ filter });
        });

        expect(createCustomerInteraction).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
        );
      });

      it('should create WHO_IS_WORKING_LOAD interaction when using after cursor', () => {
        const { result } = renderHook(() => useWhoIsWorking());
        const filter = { clockedInTimeForOnly: true };

        act(() => {
          result.current.loadWhoIsWorking({
            filter,
            after: 'some-cursor',
          });
        });

        expect(createCustomerInteraction).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
        );
      });
    });

    describe('refetch', () => {
      it('should create WHO_IS_WORKING_LOAD interaction on refetch', async () => {
        mockRefetch.mockResolvedValue({ data: mockWorkerData });
        const { result } = renderHook(() => useWhoIsWorking());
        const filter = { clockedInTimeForOnly: true };

        await act(async () => {
          await result.current.refetch({ filter });
        });

        expect(createCustomerInteraction).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
        );
      });

      it('should end interaction with failure on refetch error', async () => {
        const refetchError = new Error('Refetch failed');
        mockRefetch.mockRejectedValue(refetchError);

        const { result } = renderHook(() => useWhoIsWorking());
        const filter = { clockedInTimeForOnly: true };

        await act(async () => {
          await result.current.refetch({ filter });
        });

        expect(endInteractionWithFailure).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
          'Refetch failed',
          refetchError,
        );
      });
    });

    describe('onCompleted callback', () => {
      it('should end interaction with success when data is received', () => {
        let onCompletedCallback: (response: any) => void = () => {};

        (useLazyQuery as jest.Mock).mockImplementation((query, options) => {
          onCompletedCallback = options.onCompleted;
          return [
            mockLoadQuery,
            { data: null, loading: false, error: null, refetch: mockRefetch },
          ];
        });

        renderHook(() => useWhoIsWorking());

        // Simulate onCompleted callback
        onCompletedCallback({ timeTrackingWhoIsWorking: { edges: [] } });

        expect(endInteractionWithSuccess).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
        );
        expect(endInteractionWithSuccess).toHaveBeenCalledTimes(1);
      });

      it('should not end interaction when response is empty', () => {
        let onCompletedCallback: (response: any) => void = () => {};

        (useLazyQuery as jest.Mock).mockImplementation((query, options) => {
          onCompletedCallback = options.onCompleted;
          return [
            mockLoadQuery,
            { data: null, loading: false, error: null, refetch: mockRefetch },
          ];
        });

        renderHook(() => useWhoIsWorking());

        // Simulate onCompleted callback with null response
        onCompletedCallback({ timeTrackingWhoIsWorking: null });

        expect(endInteractionWithSuccess).not.toHaveBeenCalled();
      });
    });

    describe('onError callback', () => {
      it('should end interaction with failure on error', () => {
        let onErrorCallback: (err: any) => void = () => {};

        (useLazyQuery as jest.Mock).mockImplementation((query, options) => {
          onErrorCallback = options.onError;
          return [
            mockLoadQuery,
            { data: null, loading: false, error: null, refetch: mockRefetch },
          ];
        });

        renderHook(() => useWhoIsWorking());

        // Simulate onError callback
        const mockError = { message: 'Query failed', graphQLErrors: [] };
        onErrorCallback(mockError);

        expect(endInteractionWithFailure).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
          'Query failed',
          mockError,
        );
        expect(endInteractionWithFailure).toHaveBeenCalledTimes(1);
      });

      it('should handle errors without graphQLErrors', () => {
        let onErrorCallback: (err: any) => void = () => {};

        (useLazyQuery as jest.Mock).mockImplementation((query, options) => {
          onErrorCallback = options.onError;
          return [
            mockLoadQuery,
            { data: null, loading: false, error: null, refetch: mockRefetch },
          ];
        });

        renderHook(() => useWhoIsWorking());

        // Simulate onError callback without graphQLErrors
        const mockError = { message: 'Network error' };
        onErrorCallback(mockError);

        expect(endInteractionWithFailure).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
          'Network error',
          mockError,
        );
      });

      it('should use "Unknown Error" when error message is not available', () => {
        let onErrorCallback: (err: any) => void = () => {};

        (useLazyQuery as jest.Mock).mockImplementation((query, options) => {
          onErrorCallback = options.onError;
          return [
            mockLoadQuery,
            { data: null, loading: false, error: null, refetch: mockRefetch },
          ];
        });

        renderHook(() => useWhoIsWorking());

        // Simulate onError callback without message
        const mockError = {};
        onErrorCallback(mockError);

        expect(endInteractionWithFailure).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
          'Unknown Error',
          mockError,
        );
      });
    });
  });
});
