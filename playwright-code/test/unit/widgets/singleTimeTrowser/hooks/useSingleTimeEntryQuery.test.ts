import React from 'react';
import {
  renderHook as rtlRenderHook,
  act,
  type RenderHookOptions,
} from '@testing-library/react-hooks';
import { useLazyQuery, useApolloClient } from '@apollo/client';
import { useSandbox } from '@payroll/quicksand';
import {
  useSingleTimeEntryQuery,
  mapSingleTimeEntryResult,
  type UseSingleTimeEntryQueryResult,
} from '../../../../../src/js/widgets/singleTimeTrowser/hooks/useSingleTimeEntryQuery';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from '../../../../../src/js/common/CustomerInteraction';
import {
  hasAnyGraphQLError,
  extractGraphQLError,
} from '../../../../../src/js/service/utils/apolloErrorUtils';
import { TIME_TRACKING_HEADERS } from '../../../../../src/js/common/constants';
import { useIXPFeatureFlag } from '../../../../../src/js/common/useIXPFeatureFlag';
import { isWorkforceEnvironment } from '../../../../../src/js/service/utils/sandboxUtils';
import {
  SUBSCRIPTION_STATUS,
  useGetEntitlements,
} from '../../../../../src/js/service/hooks/entitlements/useGetEntitlements';
import { LoggingConfigProvider } from '../../../../../src/js/providers/LoggingConfigProvider';
// Mock dependencies
jest.mock('@apollo/client', () => ({
  useLazyQuery: jest.fn(),
  useApolloClient: jest.fn(),
  gql: jest.fn((template) => template),
}));

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('../../../../../src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(),
  TimeCustomerInteraction: {
    SINGLE_TIME_READ: 'single-time-entry-read',
    SINGLE_TIME_SHEET_READ: 'single-time-sheet-read',
  },
}));

jest.mock('../../../../../src/js/service/utils/apolloErrorUtils', () => ({
  hasAnyGraphQLError: jest.fn(),
  extractGraphQLError: jest.fn(),
}));

jest.mock('../../../../../src/js/service/utils/sandboxUtils', () => ({
  ...jest.requireActual('../../../../../src/js/service/utils/sandboxUtils'),
  isWorkforceEnvironment: jest.fn(),
}));

// Mock useIXPFeatureFlag
jest.mock('../../../../../src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(),
}));

jest.mock(
  '../../../../../src/js/service/hooks/entitlements/useGetEntitlements',
  () => ({
    ...jest.requireActual(
      '../../../../../src/js/service/hooks/entitlements/useGetEntitlements',
    ),
    useGetEntitlements: jest.fn(),
  }),
);

const mockUseIXPFeatureFlag = useIXPFeatureFlag as jest.MockedFunction<
  typeof useIXPFeatureFlag
>;
const mockIsWorkforceEnvironment =
  isWorkforceEnvironment as jest.MockedFunction<typeof isWorkforceEnvironment>;
const mockUseGetEntitlements = useGetEntitlements as jest.MockedFunction<
  typeof useGetEntitlements
>;

const mockUseLazyQuery = useLazyQuery as jest.MockedFunction<
  typeof useLazyQuery
>;
const mockUseApolloClient = useApolloClient as jest.MockedFunction<
  typeof useApolloClient
>;
const mockUseSandbox = useSandbox as jest.MockedFunction<typeof useSandbox>;
const mockCreateCustomerInteraction =
  createCustomerInteraction as jest.MockedFunction<
    typeof createCustomerInteraction
  >;
const mockEndInteractionWithFailure =
  endInteractionWithFailure as jest.MockedFunction<
    typeof endInteractionWithFailure
  >;
const mockEndInteractionWithSuccess =
  endInteractionWithSuccess as jest.MockedFunction<
    typeof endInteractionWithSuccess
  >;
const mockGetCustomerInteractionPropagationHeaders =
  getCustomerInteractionPropagationHeaders as jest.MockedFunction<
    typeof getCustomerInteractionPropagationHeaders
  >;
const mockHasAnyGraphQLError = hasAnyGraphQLError as jest.MockedFunction<
  typeof hasAnyGraphQLError
>;
const mockExtractGraphQLError = extractGraphQLError as jest.MockedFunction<
  typeof extractGraphQLError
>;

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

describe('useSingleTimeEntryQuery', () => {
  let mockClient: any;
  let mockSandbox: any;
  let mockGetTimeEntry: jest.Mock;

  const HookTestWrapper = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(
      LoggingConfigProvider,
      // react/no-children-prop: children via 3rd arg; cast satisfies props type (children at runtime).
      { sandbox: mockSandbox } as React.ComponentProps<
        typeof LoggingConfigProvider
      >,
      children,
    );

  function renderUseSingleTimeEntryHook<
    TProps = undefined,
    TResult = UseSingleTimeEntryQueryResult,
  >(hookFn: (props: TProps) => TResult, options?: RenderHookOptions<TProps>) {
    return rtlRenderHook<TProps, TResult>(hookFn, {
      ...(options ?? {}),
      // RTL forwards initialProps to the wrapper; we only need LoggingConfigProvider + children.
      wrapper: HookTestWrapper as React.ComponentType<TProps>,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseGetEntitlements.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
    });
    mockIsWorkforceEnvironment.mockReturnValue(false);

    mockClient = {
      query: jest.fn(),
      mutate: jest.fn(),
      watchQuery: jest.fn(),
    };

    mockSandbox = {
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
      },
      performance: {
        createCustomerInteraction: jest.fn(),
        getCustomerInteraction: jest.fn(),
      },
    };

    mockUseApolloClient.mockReturnValue(mockClient);
    mockUseSandbox.mockReturnValue(mockSandbox);
    mockGetCustomerInteractionPropagationHeaders.mockReturnValue({
      'x-trace-id': 'test-trace-id',
    });

    mockGetTimeEntry = jest.fn().mockResolvedValue({
      data: null,
    });

    mockUseLazyQuery.mockReturnValue([
      mockGetTimeEntry,
      {
        loading: false,
        error: undefined,
        data: null,
        called: false,
        refetch: jest.fn(),
      } as any,
    ]);

    mockHasAnyGraphQLError.mockReturnValue(false);
    // Default to feature flag disabled
    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: false,
      error: null,
      settled: true,
    });
  });

  describe('useSingleTimeEntryQuery hook', () => {
    it('should call useApolloClient to get the client', () => {
      renderUseSingleTimeEntryHook(() => useSingleTimeEntryQuery());

      expect(mockUseApolloClient).toHaveBeenCalled();
    });

    it('should call useSandbox to get the sandbox', () => {
      renderUseSingleTimeEntryHook(() => useSingleTimeEntryQuery());

      expect(mockUseSandbox).toHaveBeenCalled();
    });

    it('should call useLazyQuery with correct parameters', () => {
      renderUseSingleTimeEntryHook(() => useSingleTimeEntryQuery());

      expect(mockUseLazyQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          client: mockClient,
          fetchPolicy: 'cache-and-network',
          notifyOnNetworkStatusChange: true,
        }),
      );
    });

    it('should return initial state correctly', () => {
      const { result } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery(),
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.data).toBeUndefined();
      expect(typeof result.current.query).toBe('function');
      expect(typeof result.current.resetData).toBe('function');
    });

    it('should return loading state from useLazyQuery', () => {
      mockUseLazyQuery.mockReturnValue([
        mockGetTimeEntry,
        {
          loading: true,
          error: undefined,
          data: null,
          called: true,
          refetch: jest.fn(),
        } as any,
      ]);

      const { result } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery(),
      );

      expect(result.current.loading).toBe(true);
    });

    it('should not auto-fetch when id is not provided', () => {
      renderUseSingleTimeEntryHook(() => useSingleTimeEntryQuery());

      expect(mockGetTimeEntry).not.toHaveBeenCalled();
      expect(mockCreateCustomerInteraction).not.toHaveBeenCalled();
    });

    it('should auto-fetch when id is provided', async () => {
      const mockTimeEntry = {
        id: 'entry-123',
        date: '2024-01-01',
        notes: 'Test entry',
      };

      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: mockTimeEntry },
      });

      mockHasAnyGraphQLError.mockReturnValue(false);

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(mockCreateCustomerInteraction).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_READ,
      );
      expect(mockGetTimeEntry).toHaveBeenCalledWith({
        variables: {
          input: {
            id: 'entry-123',
          },
        },
        context: {
          headers: { 'x-trace-id': 'test-trace-id' },
        },
      });
    });

    it('should include workforce header when sandbox is workforce', async () => {
      mockIsWorkforceEnvironment.mockReturnValue(true);
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(mockGetTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.objectContaining({
              'intuit-is-workforce-user': 'true',
            }),
          }),
        }),
      );
    });

    it('should use SINGLE_TIME_READ interaction type when isExported is true (default)', async () => {
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123', isExported: true }),
      );

      await waitForNextUpdate();

      expect(mockCreateCustomerInteraction).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_READ,
      );
      expect(mockGetCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_READ,
      );
    });

    it('should use SINGLE_TIME_SHEET_READ interaction type when isExported is false', async () => {
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123', isExported: false }),
      );

      await waitForNextUpdate();

      expect(mockCreateCustomerInteraction).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_SHEET_READ,
      );
      expect(mockGetCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_SHEET_READ,
      );
    });

    it('should handle successful fetch and set data', async () => {
      const mockTimeEntry = {
        id: 'entry-123',
        date: '2024-01-01',
        notes: 'Test entry',
        duration: 3600,
      };

      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: mockTimeEntry },
      });

      mockHasAnyGraphQLError.mockReturnValue(false);

      const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual(mockTimeEntry);
      expect(result.current.error).toBeUndefined();
      expect(mockEndInteractionWithSuccess).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_READ,
      );
    });

    it('should handle GraphQL errors', async () => {
      const mockError = {
        message: 'GraphQL error occurred',
        name: 'GraphQLError',
      };

      mockGetTimeEntry.mockResolvedValue({
        errors: [{ message: 'GraphQL error occurred' }],
      });

      mockHasAnyGraphQLError.mockReturnValue(true);
      mockExtractGraphQLError.mockReturnValue(mockError);

      const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(result.current.error).toBe('GraphQL error occurred');
      expect(result.current.data).toBeUndefined();
      expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_READ,
        'GraphQL error occurred',
        mockError,
      );
    });

    it('should handle no data returned from server', async () => {
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: null },
      });

      mockHasAnyGraphQLError.mockReturnValue(false);

      const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(result.current.error).toBe('No data returned from server');
      expect(result.current.data).toBeUndefined();
      expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_READ,
        'No data returned from server',
        expect.objectContaining({
          message: 'No data returned from server',
          name: 'NoDataError',
        }),
      );
    });

    it('should handle network/catch errors', async () => {
      const networkError = new Error('Network error');

      mockGetTimeEntry.mockRejectedValue(networkError);

      const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(result.current.error).toBe('Network error');
      expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_READ,
        'Network error',
        networkError,
      );
    });

    describe('time summary API consumption logging', () => {
      let infoSpy: jest.SpyInstance;
      let errorSpy: jest.SpyInstance;

      beforeEach(() => {
        infoSpy = jest.spyOn(mockSandbox.logger, 'info');
        errorSpy = jest.spyOn(mockSandbox.logger, 'error');
      });

      afterEach(() => {
        infoSpy.mockRestore();
        errorSpy.mockRestore();
      });

      it('does not emit TIME_SUMMARY_API_CALL when primary data source FF is off', async () => {
        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: { id: 'entry-123' } },
        });
        mockHasAnyGraphQLError.mockReturnValue(false);

        const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery({ id: 'entry-123' }),
        );

        await waitForNextUpdate();

        expect(timeSummaryConsumptionLogLines(infoSpy, errorSpy)).toHaveLength(
          0,
        );
      });

      it('emits READ SUCCESS when FF is on and fetch succeeds', async () => {
        mockUseIXPFeatureFlag.mockReturnValue({
          isEnabled: true,
          isLoading: false,
          error: null,
          settled: true,
        });
        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: { id: 'entry-123' } },
        });
        mockHasAnyGraphQLError.mockReturnValue(false);

        const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery({ id: 'entry-123' }),
        );

        await waitForNextUpdate();

        const lines = timeSummaryConsumptionLogLines(infoSpy, errorSpy);
        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(
          /EVENT=TIME_SUMMARY_API_CALL API=GET_TIME_ENTRY operation=READ status=SUCCESS/,
        );
      });

      it('emits READ FAILED when FF is on and GraphQL returns errors', async () => {
        mockUseIXPFeatureFlag.mockReturnValue({
          isEnabled: true,
          isLoading: false,
          error: null,
          settled: true,
        });
        const gqlErr = {
          message: 'GraphQL error occurred',
          name: 'GraphQLError',
        };
        mockGetTimeEntry.mockResolvedValue({
          errors: [{ message: 'GraphQL error occurred' }],
        });
        mockHasAnyGraphQLError.mockReturnValue(true);
        mockExtractGraphQLError.mockReturnValue(gqlErr);

        const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery({ id: 'entry-123' }),
        );

        await waitForNextUpdate();

        const lines = timeSummaryConsumptionLogLines(infoSpy, errorSpy);
        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(
          /EVENT=TIME_SUMMARY_API_CALL API=GET_TIME_ENTRY operation=READ status=FAILED/,
        );
      });
    });

    it('should log info when fetching time entry', async () => {
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Component=useSingleTimeEntryQuery Event=Executing GraphQL query with timeEntryId=entry-123',
        ),
      );
    });

    it('should log info on successful fetch', async () => {
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Component=useSingleTimeEntryQuery Event=Successfully fetched time entry',
        ),
      );
    });

    it('should log error on failure', async () => {
      const mockError = new Error('Test error');
      mockGetTimeEntry.mockRejectedValue(mockError);

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Component=useSingleTimeEntryQuery Event=Error fetching time entry',
        ),
        expect.objectContaining({ error: 'Test error' }),
      );
    });

    it('should log appropriate entry type based on isExported flag', async () => {
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123', isExported: false }),
      );

      await waitForNextUpdate();

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Component=useSingleTimeEntryQuery Event=Successfully fetched single time entry',
        ),
      );
    });

    describe('resetData', () => {
      it('should reset data and error when called', async () => {
        const mockTimeEntry = {
          id: 'entry-123',
          date: '2024-01-01',
        };

        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: mockTimeEntry },
        });

        const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery({ id: 'entry-123' }),
        );

        await waitForNextUpdate();

        expect(result.current.data).toEqual(mockTimeEntry);

        act(() => {
          result.current.resetData();
        });

        expect(result.current.data).toBeUndefined();
        expect(result.current.error).toBeUndefined();
      });

      it('should log info when resetting data', async () => {
        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: { id: 'entry-123' } },
        });

        const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery({ id: 'entry-123' }),
        );

        await waitForNextUpdate();

        act(() => {
          result.current.resetData();
        });

        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          'Component=useSingleTimeEntryQuery Event=Resetting time entry data',
        );
      });
    });

    describe('manual query function', () => {
      it('should allow manual query calls with variables', async () => {
        const mockTimeEntry = {
          id: 'manual-entry',
          date: '2024-02-01',
        };

        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: mockTimeEntry },
        });

        const { result } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery(),
        );

        await act(async () => {
          await result.current.query({
            variables: { input: { id: 'manual-entry' } },
          });
        });

        expect(mockGetTimeEntry).toHaveBeenCalledWith({
          variables: { input: { id: 'manual-entry' } },
          context: {
            headers: { 'x-trace-id': 'test-trace-id' },
          },
        });
        expect(result.current.data).toEqual(mockTimeEntry);
      });

      it('should create customer interaction for manual query with id', async () => {
        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: { id: 'manual-entry' } },
        });

        const { result } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery(),
        );

        await act(async () => {
          await result.current.query({
            variables: { input: { id: 'manual-entry' } },
          });
        });

        expect(mockCreateCustomerInteraction).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.SINGLE_TIME_READ,
        );
      });

      it('should include workforce header for manual query when sandbox is workforce', async () => {
        mockIsWorkforceEnvironment.mockReturnValue(true);
        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: { id: 'manual-entry' } },
        });

        const { result } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery(),
        );

        await act(async () => {
          await result.current.query({
            variables: { input: { id: 'manual-entry' } },
          });
        });

        expect(mockGetTimeEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              headers: expect.objectContaining({
                'intuit-is-workforce-user': 'true',
              }),
            }),
          }),
        );
      });

      it('should not create customer interaction for manual query without id', async () => {
        mockGetTimeEntry.mockResolvedValue({
          data: null,
        });

        const { result } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery(),
        );

        mockCreateCustomerInteraction.mockClear();

        await act(async () => {
          await result.current.query();
        });

        expect(mockCreateCustomerInteraction).not.toHaveBeenCalled();
      });

      it('should handle errors in manual query and rethrow', async () => {
        const mockError = new Error('Manual query error');
        mockGetTimeEntry.mockRejectedValue(mockError);

        const { result } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery(),
        );

        await expect(
          result.current.query({
            variables: { input: { id: 'error-entry' } },
          }),
        ).rejects.toThrow('Manual query error');

        expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.SINGLE_TIME_READ,
          'Manual query error',
          mockError,
        );
      });

      it('should handle GraphQL errors in manual query', async () => {
        const mockError = {
          message: 'Manual GraphQL error',
          name: 'GraphQLError',
        };

        mockGetTimeEntry.mockResolvedValue({
          errors: [{ message: 'Manual GraphQL error' }],
        });

        mockHasAnyGraphQLError.mockReturnValue(true);
        mockExtractGraphQLError.mockReturnValue(mockError);

        const { result } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery(),
        );

        await act(async () => {
          await result.current.query({
            variables: { input: { id: 'error-entry' } },
          });
        });

        expect(result.current.error).toBe('Manual GraphQL error');
        expect(mockEndInteractionWithFailure).toHaveBeenCalled();
      });

      it('should handle no data returned in manual query', async () => {
        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: null },
        });

        const { result } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery(),
        );

        await act(async () => {
          await result.current.query({
            variables: { input: { id: 'no-data-entry' } },
          });
        });

        expect(result.current.error).toBe('No data returned from server');
      });

      it('should return response from manual query', async () => {
        const mockResponse = {
          data: { timeTrackingTimeEntry: { id: 'response-entry' } },
        };

        mockGetTimeEntry.mockResolvedValue(mockResponse);

        const { result } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery(),
        );

        let response;
        await act(async () => {
          response = await result.current.query({
            variables: { input: { id: 'response-entry' } },
          });
        });

        expect(response).toEqual(mockResponse);
      });
    });

    describe('re-fetch behavior', () => {
      it('should re-fetch when id changes', async () => {
        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: { id: 'entry-1' } },
        });

        const { rerender, waitForNextUpdate } = renderUseSingleTimeEntryHook(
          ({ id }) => useSingleTimeEntryQuery({ id }),
          { initialProps: { id: 'entry-1' } },
        );

        await waitForNextUpdate();

        expect(mockGetTimeEntry).toHaveBeenCalledTimes(1);

        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: { id: 'entry-2' } },
        });

        rerender({ id: 'entry-2' });

        await waitForNextUpdate();

        expect(mockGetTimeEntry).toHaveBeenCalledTimes(2);
        expect(mockGetTimeEntry).toHaveBeenLastCalledWith(
          expect.objectContaining({
            variables: {
              input: {
                id: 'entry-2',
              },
            },
          }),
        );
      });

      it('should pass isExported to query variables', async () => {
        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: { id: 'entry-1' } },
        });

        const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery({ id: 'entry-1', isExported: false }),
        );

        await waitForNextUpdate();

        expect(mockGetTimeEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              input: {
                id: 'entry-1',
                isExported: false,
              },
            },
          }),
        );
      });
    });

    describe('complex time entry data', () => {
      it('should handle complete time entry with all fields', async () => {
        const complexTimeEntry = {
          id: 'complex-entry',
          alternateIds: [{ id: 'alt-1', nameSpace: 'namespace-1' }],
          timeForType: 'Employee',
          timeAgainstContactDAS: {
            customer: {
              id: 'customer-123',
              fullName: 'Test Customer',
            },
          },
          timeFor: { id: 'employee-123' },
          date: '2024-01-15',
          startTime: '09:00:00',
          endTime: '17:00:00',
          v3StartTime: '09:00:00Z',
          v3EndTime: '17:00:00Z',
          duration: 28800,
          v3DurationDetails: { hours: 8, minutes: 0, seconds: 0 },
          v3BreakDuration: 3600,
          v3BreakDurationDetails: { hours: 1, minutes: 0, seconds: 0 },
          timeAgainst: {
            project: { id: 'project-123' },
            customer: { id: 'customer-123' },
          },
          class: { id: 'class-123' },
          serviceItem: { id: 'service-123' },
          payrollItem: { id: 'payroll-123' },
          department: { id: 'dept-123' },
          billableRate: 150.0,
          costRate: 75.0,
          notes: 'Complex task notes',
          taxable: true,
          billableStatus: 'BILLABLE',
          v3TransactionLocationType: 'OFFICE',
          isOpen: false,
          isSubmitted: true,
          approvalStatus: 'APPROVED',
          isExported: true,
          timeZone: 'America/Los_Angeles',
          attachmentsCount: 2,
          locked: false,
          invoiceId: 'invoice-123',
          meta: {
            createdAt: '2024-01-15T09:00:00Z',
            updatedAt: '2024-01-15T17:00:00Z',
            createdBy: 'user-123',
            version: 1,
          },
          legacyCustomFields: [
            { id: 'field-1', name: 'Custom Field 1', value: 'Value 1' },
          ],
          timeBreakId: 'break-123',
          distanceTracking: {
            autoCalculatedMeters: 5000,
            manualMeters: 4800,
          },
        };

        mockGetTimeEntry.mockResolvedValue({
          data: { timeTrackingTimeEntry: complexTimeEntry },
        });

        const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
          useSingleTimeEntryQuery({ id: 'complex-entry' }),
        );

        await waitForNextUpdate();

        expect(result.current.data).toEqual(complexTimeEntry);
      });
    });
  });

  describe('mapSingleTimeEntryResult', () => {
    it('should return undefined when data is undefined', () => {
      const result = mapSingleTimeEntryResult(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined when data is null', () => {
      const result = mapSingleTimeEntryResult(null as any);
      expect(result).toBeUndefined();
    });

    it('should return undefined when timeTrackingTimeEntry is undefined', () => {
      const data = {} as any;
      const result = mapSingleTimeEntryResult(data);
      expect(result).toBeUndefined();
    });

    it('should return null when timeTrackingTimeEntry is null', () => {
      const data = { timeTrackingTimeEntry: null } as any;
      const result = mapSingleTimeEntryResult(data);
      expect(result).toBeNull();
    });

    it('should return time entry when data is valid', () => {
      const timeEntry = {
        id: 'entry-123',
        date: '2024-01-01',
        notes: 'Test entry',
      };
      const data = { timeTrackingTimeEntry: timeEntry } as any;

      const result = mapSingleTimeEntryResult(data);

      expect(result).toEqual(timeEntry);
    });

    it('should map complete time entry correctly', () => {
      const completeEntry = {
        id: 'complete-entry',
        alternateIds: [{ id: 'alt-1', nameSpace: 'ns-1' }],
        timeForType: 'Employee',
        date: '2024-01-01',
        startTime: '09:00:00',
        endTime: '17:00:00',
        duration: 28800,
        notes: 'Complete entry with all fields',
        taxable: true,
        billableStatus: 'BILLABLE',
        isOpen: false,
        isSubmitted: true,
        approvalStatus: 'PENDING',
        isExported: true,
      };
      const data = { timeTrackingTimeEntry: completeEntry } as any;

      const result = mapSingleTimeEntryResult(data);

      expect(result).toEqual(completeEntry);
      expect(result?.id).toBe('complete-entry');
      expect(result?.notes).toBe('Complete entry with all fields');
    });

    it('should preserve all properties from time entry', () => {
      const timeEntry = {
        id: 'preserve-test',
        stringProperty: 'test-string',
        numberProperty: 42,
        booleanProperty: true,
        objectProperty: { nested: 'value' },
        arrayProperty: [1, 2, 3],
        nullProperty: null,
      };
      const data = { timeTrackingTimeEntry: timeEntry } as any;

      const result = mapSingleTimeEntryResult(data);

      expect(result).toEqual(timeEntry);
      expect((result as any).stringProperty).toBe('test-string');
      expect((result as any).numberProperty).toBe(42);
      expect((result as any).booleanProperty).toBe(true);
      expect((result as any).objectProperty).toEqual({ nested: 'value' });
      expect((result as any).arrayProperty).toEqual([1, 2, 3]);
      expect((result as any).nullProperty).toBeNull();
    });
  });

  describe('Error scenarios', () => {
    it('should handle client being null', () => {
      mockUseApolloClient.mockReturnValue(null as any);

      renderUseSingleTimeEntryHook(() => useSingleTimeEntryQuery());

      expect(mockUseLazyQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          client: null,
        }),
      );
    });

    it('should handle ApolloError with graphQLErrors', async () => {
      const apolloError = {
        message: 'Entity not found',
        name: 'ApolloError',
        graphQLErrors: [
          {
            message: 'Entity not found',
            extensions: { code: 'NOT_FOUND' },
          },
        ],
      };

      mockGetTimeEntry.mockResolvedValue({
        error: apolloError,
      });

      mockHasAnyGraphQLError.mockReturnValue(true);
      mockExtractGraphQLError.mockReturnValue(apolloError);

      const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'not-found-entry' }),
      );

      await waitForNextUpdate();

      expect(result.current.error).toBe('Entity not found');
      expect(mockEndInteractionWithFailure).toHaveBeenCalled();
    });

    it('should handle empty error message gracefully', async () => {
      const error = { message: '', name: 'EmptyError' };
      mockGetTimeEntry.mockRejectedValue(error);

      const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'empty-error-entry' }),
      );

      await waitForNextUpdate();

      // Empty string is falsy, so it falls back to 'Unknown error occurred'
      expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_READ,
        'Unknown error occurred',
        error,
      );
    });

    it('should handle undefined error message', async () => {
      const error = { name: 'NoMessageError' };
      mockGetTimeEntry.mockRejectedValue(error);

      const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'no-message-entry' }),
      );

      await waitForNextUpdate();

      expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_READ,
        'Unknown error occurred',
        error,
      );
    });
  });

  describe('Integration tests', () => {
    it('should work with real-world query variables', async () => {
      const realWorldEntry = {
        id: 'real-world-entry-123',
        date: '2024-01-15',
        startTime: '09:00:00',
        endTime: '17:00:00',
        duration: 28800,
        notes: 'Real work entry',
        billableStatus: 'BILLABLE',
        timeFor: { id: 'employee-abc-123' },
        timeAgainst: { customer: { id: 'customer-xyz-789' } },
      };

      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: realWorldEntry },
      });

      const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({
          id: 'real-world-entry-123',
          isExported: true,
        }),
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual(realWorldEntry);
      expect(result.current.error).toBeUndefined();
      expect(result.current.loading).toBe(false);
    });

    it('should handle time sheet (non-exported) entry correctly', async () => {
      const timeSheetEntry = {
        id: 'time-sheet-entry-123',
        date: '2024-01-15',
        duration: 14400,
        isExported: false,
      };

      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: timeSheetEntry },
      });

      const { result, waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({
          id: 'time-sheet-entry-123',
          isExported: false,
        }),
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual(timeSheetEntry);
      expect(mockCreateCustomerInteraction).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.SINGLE_TIME_SHEET_READ,
      );
    });

    it('should support complete workflow: fetch, error, reset, refetch', async () => {
      // First fetch succeeds
      mockGetTimeEntry.mockResolvedValueOnce({
        data: { timeTrackingTimeEntry: { id: 'entry-1' } },
      });

      const { result, waitForNextUpdate, rerender } =
        renderUseSingleTimeEntryHook(
          ({ id }) => useSingleTimeEntryQuery({ id }),
          { initialProps: { id: 'entry-1' } },
        );

      await waitForNextUpdate();
      expect(result.current.data?.id).toBe('entry-1');

      // Reset data
      act(() => {
        result.current.resetData();
      });
      expect(result.current.data).toBeUndefined();

      // Second fetch fails
      const mockError = new Error('Fetch failed');
      mockGetTimeEntry.mockRejectedValueOnce(mockError);

      rerender({ id: 'entry-2' });

      await waitForNextUpdate();
      expect(result.current.error).toBe('Fetch failed');

      // Reset again
      act(() => {
        result.current.resetData();
      });
      expect(result.current.error).toBeUndefined();

      // Third fetch succeeds
      mockGetTimeEntry.mockResolvedValueOnce({
        data: { timeTrackingTimeEntry: { id: 'entry-3' } },
      });

      rerender({ id: 'entry-3' });

      await waitForNextUpdate();
      expect(result.current.data?.id).toBe('entry-3');
      expect(result.current.error).toBeUndefined();
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
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      // Wait a bit to ensure the effect has run
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGetTimeEntry).not.toHaveBeenCalled();
    });

    it('should make API call when feature flag is settled', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(mockGetTimeEntry).toHaveBeenCalled();
    });
  });

  describe('intuit-is-time-activity header', () => {
    it('should add intuit-is-time-activity header when feature flag is enabled and isExported is true (default)', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123', isExported: true }),
      );

      await waitForNextUpdate();

      expect(mockGetTimeEntry).toHaveBeenCalledWith({
        variables: {
          input: {
            id: 'entry-123',
          },
        },
        context: {
          headers: expect.objectContaining({
            [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
          }),
        },
      });
    });

    it('should add intuit-is-time-activity header when feature flag is enabled and isExported is undefined (defaults to true)', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123' }),
      );

      await waitForNextUpdate();

      expect(mockGetTimeEntry).toHaveBeenCalledWith({
        variables: {
          input: {
            id: 'entry-123',
          },
        },
        context: {
          headers: expect.objectContaining({
            [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
          }),
        },
      });
    });

    it('should NOT add intuit-is-time-activity header when feature flag is disabled', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        isLoading: false,
        error: null,
        settled: true,
      });
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123', isExported: true }),
      );

      await waitForNextUpdate();

      expect(mockGetTimeEntry).toHaveBeenCalledWith({
        variables: {
          input: {
            id: 'entry-123',
          },
        },
        context: {
          headers: expect.not.objectContaining({
            [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
          }),
        },
      });
    });

    it('should NOT add intuit-is-time-activity header when isExported is false', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123', isExported: false }),
      );

      await waitForNextUpdate();

      expect(mockGetTimeEntry).toHaveBeenCalledWith({
        variables: {
          input: {
            id: 'entry-123',
            isExported: false,
          },
        },
        context: {
          headers: expect.not.objectContaining({
            [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
          }),
        },
      });
    });

    it('should add intuit-is-time-activity header in manual query when feature flag is enabled and isExported is true', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'manual-entry' } },
      });

      const { result } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery(),
      );

      await act(async () => {
        await result.current.query({
          variables: { input: { id: 'manual-entry', isExported: true } },
        });
      });

      expect(mockGetTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.objectContaining({
              [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
            }),
          }),
        }),
      );
    });

    it('should NOT add intuit-is-time-activity header in manual query when feature flag is disabled', async () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        isLoading: false,
        error: null,
        settled: true,
      });
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'manual-entry' } },
      });

      const { result } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery(),
      );

      await act(async () => {
        await result.current.query({
          variables: { input: { id: 'manual-entry', isExported: true } },
        });
      });

      expect(mockGetTimeEntry).toHaveBeenCalledWith(
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
      mockGetTimeEntry.mockResolvedValue({
        data: { timeTrackingTimeEntry: { id: 'entry-123' } },
      });

      const { waitForNextUpdate } = renderUseSingleTimeEntryHook(() =>
        useSingleTimeEntryQuery({ id: 'entry-123', isExported: true }),
      );

      await waitForNextUpdate();

      expect(mockGetTimeEntry).toHaveBeenCalledWith({
        variables: {
          input: {
            id: 'entry-123',
          },
        },
        context: {
          headers: expect.not.objectContaining({
            [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
          }),
        },
      });
    });
  });
});
