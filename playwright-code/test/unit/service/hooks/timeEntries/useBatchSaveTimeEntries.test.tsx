/* eslint-disable camelcase */

import { act } from '@testing-library/react-hooks';
import { BATCH_SAVE_TIME_ENTRIES } from 'src/js/service/queries/timeTrackingQueries';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import {
  aMutation,
  aTimeTracking_BatchManageTimeEntriesError,
  aTimeTracking_BatchManageTimeEntriesInput,
} from '__mocks__/__generated__/timeTracking';
import {
  TIME_ENTRIES_APOLLO_ERROR_MOCKS,
  TIME_ENTRIES_SUCCESS_MOCKS,
  TIME_QUERY_ERROR_MOCKS,
} from 'test/unit/service/queries/timeTrackingQueries';
import {
  TIME_SUMMARY_API_OPERATION,
  TIME_SUMMARY_API_STATUS,
  TIME_TRACKING_HEADERS,
} from 'src/js/common/constants';
import {
  useBatchSaveTimeEntries,
  UseBatchSaveTimeEntriesArgs,
} from 'src/js/service/hooks/timeEntries/useBatchSaveTimeEntries';
import {
  logTimeSummaryTimeActivityApiConsumption,
  TIME_SUMMARY_API_NAMES,
} from 'src/js/service/utils/timeSummaryHeaderUtils';
import {
  TimeCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
} from 'src/js/common/CustomerInteraction';

jest.mock('src/js/service/utils/timeSummaryHeaderUtils', () => {
  const actual = jest.requireActual(
    'src/js/service/utils/timeSummaryHeaderUtils',
  );
  return {
    ...actual,
    logTimeSummaryTimeActivityApiConsumption: jest.fn(),
  };
});

const mockLogTimeSummaryConsumption =
  logTimeSummaryTimeActivityApiConsumption as jest.MockedFunction<
    typeof logTimeSummaryTimeActivityApiConsumption
  >;

// Mock the CustomerInteraction module
jest.mock('src/js/common/CustomerInteraction', () => {
  const originalModule = jest.requireActual(
    'src/js/common/CustomerInteraction',
  );

  return {
    ...originalModule,
    endInteractionWithSuccess: jest.fn(),
    endInteractionWithFailure: jest.fn(),
  };
});

describe('useBatchSaveTimeEntries', () => {
  let args: UseBatchSaveTimeEntriesArgs;

  beforeEach(() => {
    args = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
    };
  });

  afterEach(jest.resetAllMocks);

  const timeSummaryMutateContext = {
    headers: {
      [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
    },
  };

  describe('time summary API consumption logging', () => {
    it('does not call log when the time-activity header is not on the mutate request', async () => {
      const argsWithInteraction = {
        ...args,
        interaction: TimeCustomerInteraction.WEEKLY_TIME_SAVE,
      };
      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useBatchSaveTimeEntries(argsWithInteraction),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      act(() => {
        result.current[0]({
          variables: {
            input: aTimeTracking_BatchManageTimeEntriesInput(),
          },
        });
      });

      await waitForNextUpdate();

      expect(mockLogTimeSummaryConsumption).not.toHaveBeenCalled();
    });

    it('does not call log when the header is set but interaction is not mapped', async () => {
      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useBatchSaveTimeEntries(args),
        TIME_ENTRIES_SUCCESS_MOCKS,
      );

      act(() => {
        result.current[0]({
          variables: {
            input: aTimeTracking_BatchManageTimeEntriesInput(),
          },
          context: timeSummaryMutateContext,
        });
      });

      await waitForNextUpdate();

      expect(mockLogTimeSummaryConsumption).not.toHaveBeenCalled();
    });

    it.each([
      [
        TimeCustomerInteraction.WEEKLY_TIME_SAVE,
        TIME_SUMMARY_API_OPERATION.UPDATE,
      ],
      [
        TimeCustomerInteraction.SINGLE_TIME_CREATE,
        TIME_SUMMARY_API_OPERATION.CREATE,
      ],
      [
        TimeCustomerInteraction.SINGLE_TIME_UPDATE,
        TIME_SUMMARY_API_OPERATION.UPDATE,
      ],
      [
        TimeCustomerInteraction.SINGLE_TIME_DELETE,
        TIME_SUMMARY_API_OPERATION.DELETE,
      ],
    ] as const)(
      'emits SUCCESS for interaction %s with operation %s',
      async (interaction, expectedOperation) => {
        const argsWithInteraction = {
          ...args,
          interaction,
        };
        const { result, waitForNextUpdate } = renderHookWithApolloProvider(
          () => useBatchSaveTimeEntries(argsWithInteraction),
          TIME_ENTRIES_SUCCESS_MOCKS,
        );

        act(() => {
          result.current[0]({
            variables: {
              input: aTimeTracking_BatchManageTimeEntriesInput(),
            },
            context: timeSummaryMutateContext,
          });
        });

        await waitForNextUpdate();

        expect(mockLogTimeSummaryConsumption).toHaveBeenCalledTimes(1);
        expect(mockLogTimeSummaryConsumption).toHaveBeenCalledWith(
          expect.anything(),
          {
            [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
          },
          {
            api: TIME_SUMMARY_API_NAMES.TIME_TRACKING_BATCH_MANAGE_TIME_ENTRIES,
            operation: expectedOperation,
            status: TIME_SUMMARY_API_STATUS.SUCCESS,
            errorMessage: undefined,
          },
        );
      },
    );

    it('emits FAILED with errorMessage when the request had the header and the mutation errors', async () => {
      const argsWithInteraction = {
        ...args,
        interaction: TimeCustomerInteraction.WEEKLY_TIME_SAVE,
      };
      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useBatchSaveTimeEntries(argsWithInteraction),
        TIME_QUERY_ERROR_MOCKS,
      );

      act(() => {
        result.current[0]({
          variables: {
            input: aTimeTracking_BatchManageTimeEntriesInput(),
          },
          context: timeSummaryMutateContext,
        });
      });

      await waitForNextUpdate();

      expect(mockLogTimeSummaryConsumption).toHaveBeenCalledTimes(1);
      expect(mockLogTimeSummaryConsumption).toHaveBeenCalledWith(
        expect.anything(),
        {
          [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
        },
        expect.objectContaining({
          api: TIME_SUMMARY_API_NAMES.TIME_TRACKING_BATCH_MANAGE_TIME_ENTRIES,
          operation: TIME_SUMMARY_API_OPERATION.UPDATE,
          status: TIME_SUMMARY_API_STATUS.FAILED,
          errorMessage: expect.any(String),
        }),
      );
    });
  });

  it('should successfully mutate', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(args),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    expect(result.current[1].loading).toBe(false);

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
      });
    });

    expect(result.current[1].loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current[1].loading).toBe(false);

    expect(args.onSuccess).toHaveBeenCalled();
    expect(args.onError).not.toHaveBeenCalled();
  });

  test.each([
    ['GraphQL error', TIME_ENTRIES_APOLLO_ERROR_MOCKS],
    ['network error', TIME_QUERY_ERROR_MOCKS],
  ])('should call onError when %s occurs', async (_label, mocks) => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(args),
      mocks,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();
  });

  it('should end the customer interaction with a success if provided', async () => {
    const argsWithInteraction = {
      ...args,
      interaction: TimeCustomerInteraction.WEEKLY_TIME_SAVE,
    };
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(argsWithInteraction),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(endInteractionWithFailure).not.toHaveBeenCalled();
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.WEEKLY_TIME_SAVE,
    );
  });

  it('should end the customer interaction with a failure if provided', async () => {
    const argsWithInteraction = {
      ...args,
      interaction: TimeCustomerInteraction.WEEKLY_TIME_SAVE,
    };
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(argsWithInteraction),
      TIME_QUERY_ERROR_MOCKS,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(endInteractionWithSuccess).not.toHaveBeenCalled();
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.WEEKLY_TIME_SAVE,
      expect.anything(),
    );
  });

  it('should forward ApolloError message when interaction failure is tracked', async () => {
    const argsWithInteraction = {
      ...args,
      interaction: TimeCustomerInteraction.WEEKLY_TIME_SAVE,
    };
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(argsWithInteraction),
      [
        {
          request: {
            query: BATCH_SAVE_TIME_ENTRIES,
            variables: {
              input: aTimeTracking_BatchManageTimeEntriesInput(),
            },
          },
          error: new Error('network failed'),
        },
      ],
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.WEEKLY_TIME_SAVE,
      expect.stringContaining('network failed'),
    );
  });

  it('should not end the customer interaction with a success if not provided', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(args),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(endInteractionWithFailure).not.toHaveBeenCalled();
    expect(endInteractionWithSuccess).not.toHaveBeenCalled();
  });

  it('should not end the customer interaction with a failure if not provided', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(args),
      TIME_QUERY_ERROR_MOCKS,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(endInteractionWithFailure).not.toHaveBeenCalled();
    expect(endInteractionWithSuccess).not.toHaveBeenCalled();
  });

  it('should end interaction with success for expected user errors', async () => {
    const argsWithInteraction = {
      ...args,
      interaction: TimeCustomerInteraction.WEEKLY_TIME_SAVE,
    };
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(argsWithInteraction),
      [
        {
          request: {
            query: BATCH_SAVE_TIME_ENTRIES,
            variables: {
              input: aTimeTracking_BatchManageTimeEntriesInput(),
            },
          },
          result: {
            data: aMutation({
              timeTrackingBatchManageTimeEntries:
                aTimeTracking_BatchManageTimeEntriesError({
                  __typename: 'TimeTracking_BatchManageTimeEntriesError',
                  errorCode: 'NO_SERVICE_ITEM',
                  element: 'ut',
                }),
            }),
          },
        },
      ],
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.WEEKLY_TIME_SAVE,
    );
    expect(endInteractionWithFailure).not.toHaveBeenCalled();
  });

  it('should handle unexpected response type', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(args),
      [
        {
          request: {
            query: BATCH_SAVE_TIME_ENTRIES,
            variables: {
              input: aTimeTracking_BatchManageTimeEntriesInput(),
            },
          },
          result: {
            data: aMutation({
              timeTrackingBatchManageTimeEntries: {
                __typename: 'TimeTracking_UnexpectedBatchMutationResult',
              } as any,
            }),
          },
        },
      ],
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith(
      'NLS catch.all.error.content undefined',
      '',
      expect.objectContaining({
        errorCode: 'Unexpected response type',
      }),
    );
  });

  it('should handle missing errorCode on batch error response', async () => {
    const argsWithInteraction = {
      ...args,
      interaction: TimeCustomerInteraction.WEEKLY_TIME_SAVE,
    };
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(argsWithInteraction),
      [
        {
          request: {
            query: BATCH_SAVE_TIME_ENTRIES,
            variables: {
              input: aTimeTracking_BatchManageTimeEntriesInput(),
            },
          },
          result: {
            data: aMutation({
              timeTrackingBatchManageTimeEntries:
                aTimeTracking_BatchManageTimeEntriesError({
                  __typename: 'TimeTracking_BatchManageTimeEntriesError',
                  errorCode: undefined as any,
                  message: undefined as any,
                  details: '',
                  subCode: '',
                  element: 'ut',
                }),
            }),
          },
        },
      ],
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
        context: timeSummaryMutateContext,
      });
    });

    await waitForNextUpdate();

    expect(mockLogTimeSummaryConsumption).toHaveBeenCalledWith(
      expect.anything(),
      {
        [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
      },
      expect.objectContaining({
        status: TIME_SUMMARY_API_STATUS.FAILED,
        errorMessage: undefined,
      }),
    );
    expect(args.onError).not.toHaveBeenCalled();
  });

  it.each([
    [
      {
        errorCode: 'GENERAL_V3_ERROR',
        message: 'An error occurred',
        details: 'Some details',
        subCode: 'Some sub code',
      },
      'An error occurred Some details',
      'ut',
    ],
    [
      {
        errorCode: 'GENERAL_V1_ERROR',
        message: 'An error occurred',
        details: 'Some details',
        subCode: 'Some sub code V1',
      },
      'An error occurred Some details',
      'ut',
    ],
    [
      {
        errorCode: 'GENERAL_V1_ERROR',
        message: 'An error occurred',
        details: '',
        subCode: '123',
      },
      'An error occurred ',
      'ut',
    ],
    [
      {
        errorCode: 'GENERAL_V1_ERROR',
        message: 'An error occurred',
        details: '',
        subCode: '',
      },
      'NLS catch.all.error.content undefined',
      'ut',
    ],
    [
      { errorCode: 'NO_SERVICE_ITEM' },
      'NLS time.tracking.validation.service.item.required undefined',
      'ut',
    ],
  ])(
    'onError should handle %s error',
    async (error, expectedMessage, expectedElement) => {
      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useBatchSaveTimeEntries(args),
        [
          {
            request: {
              query: BATCH_SAVE_TIME_ENTRIES,
              variables: {
                input: aTimeTracking_BatchManageTimeEntriesInput(),
              },
            },
            result: {
              data: aMutation({
                timeTrackingBatchManageTimeEntries:
                  aTimeTracking_BatchManageTimeEntriesError({
                    __typename: 'TimeTracking_BatchManageTimeEntriesError',
                    ...error,
                  }),
              }),
            },
          },
        ],
      );

      act(() => {
        result.current[0]({
          variables: {
            input: aTimeTracking_BatchManageTimeEntriesInput(),
          },
        });
      });

      await waitForNextUpdate();

      expect(args.onSuccess).not.toHaveBeenCalled();
      expect(args.onError).toHaveBeenCalled();
      expect(args.onError).toHaveBeenCalledWith(
        expectedMessage,
        expectedElement,
        expect.objectContaining({
          errorCode: error.errorCode,
        }),
      );
    },
  );

  it('should throw error for null response', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useBatchSaveTimeEntries(args),
      [
        {
          request: {
            query: BATCH_SAVE_TIME_ENTRIES,
            variables: {
              input: aTimeTracking_BatchManageTimeEntriesInput(),
            },
          },
          result: {
            data: aMutation({
              timeTrackingBatchManageTimeEntries: undefined,
            }),
          },
        },
      ],
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_BatchManageTimeEntriesInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith(
      'NLS catch.all.error.content undefined',
      '',
      expect.objectContaining({
        errorCode: 'Null Response',
      }),
    );
  });
});
