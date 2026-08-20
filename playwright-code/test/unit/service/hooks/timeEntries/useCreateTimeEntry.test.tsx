/* eslint-disable camelcase */
import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { aTimeTracking_CreateTimeEntryInput } from '__mocks__/__generated__/timeTracking';
import {
  TIME_ENTRIES_APOLLO_ERROR_MOCKS,
  TIME_ENTRIES_SUCCESS_MOCKS,
  TIME_QUERY_ERROR_MOCKS,
} from 'test/unit/service/queries/timeTrackingQueries';
import { CREATE_TIME_ENTRY_MUTATION } from 'src/js/service/queries/timeTrackingQueries';
import {
  useCreateTimeEntry,
  UseCreateTimeEntryArgs,
} from 'src/js/service/hooks/timeEntries/useCreateTimeEntry';

describe('useCreateTimeEntry', () => {
  let args: UseCreateTimeEntryArgs;

  beforeEach(() => {
    args = {
      onError: jest.fn(),
      onSuccess: jest.fn(),
    };
  });

  it('should execute mutation and call onSuccess on successful create', async () => {
    const { result } = renderHookWithApolloProvider(
      () => useCreateTimeEntry(args),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    await act(async () => {
      result.current[0]({
        variables: { input: aTimeTracking_CreateTimeEntryInput() },
      });
    });

    await waitFor(() => {
      expect(args.onSuccess).toHaveBeenCalled();
    });
    expect(args.onError).not.toHaveBeenCalled();
  });

  it('should preserve custom fields from server response without hardcoded override', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useCreateTimeEntry(args),
      TIME_ENTRIES_SUCCESS_MOCKS,
    );

    act(() => {
      result.current[0]({
        variables: { input: aTimeTracking_CreateTimeEntryInput() },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).toHaveBeenCalled();

    // Get the time entries passed to onSuccess
    const timeEntries = (args.onSuccess as jest.Mock).mock.calls[0][0];

    // Verify that the time entries have the original custom fields from the mock
    // and not the hardcoded test data that was previously added
    expect(timeEntries).toHaveLength(1);
    expect(timeEntries[0].legacyCustomFields).toBeDefined();
    expect(timeEntries[0].legacyCustomFields).toHaveLength(1);

    // Verify it's the original mock custom field, not hardcoded test data
    const customField = timeEntries[0].legacyCustomFields[0];
    expect(customField.id).toBeDefined();
    expect(customField.name).toBeDefined();
    expect(customField.value).toBeDefined();

    // Verify it's not the hardcoded test values that were previously used
    expect(customField.id).not.toBe('udcf_1000000010');
    expect(customField.value).not.toBe('12345678');
  });

  test.each([
    ['GraphQL error', TIME_ENTRIES_APOLLO_ERROR_MOCKS],
    ['network error', TIME_QUERY_ERROR_MOCKS],
  ])('should call onError when %s occurs', async (_label, mocks) => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useCreateTimeEntry(args),
      mocks,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_CreateTimeEntryInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();
  });

  it('should handle TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET error with message details', async () => {
    const mockErrorMessage =
      'TSheet sync failed. Details:\\nField 1 is required\\nField 2 is invalid';
    const expectedCleanedMessage = 'Field 1 is required\\nField 2 is invalid';

    const tsheetErrorMocks = [
      {
        request: {
          query: CREATE_TIME_ENTRY_MUTATION,
          variables: {
            input: aTimeTracking_CreateTimeEntryInput(),
          },
        },
        result: {
          data: {
            __typename: 'Mutation',
            timeTrackingCreateTimeEntry: {
              __typename: 'TimeTracking_CreateTimeEntryError',
              errorCode: 'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
              message: mockErrorMessage,
              subCode: 'SUB_ERROR',
              details: null,
              element: null,
              detailLocalizationArgs: null,
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useCreateTimeEntry(args),
      tsheetErrorMocks,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_CreateTimeEntryInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith(expectedCleanedMessage);
  });

  it('should handle TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET error without message details', async () => {
    const tsheetErrorMocks = [
      {
        request: {
          query: CREATE_TIME_ENTRY_MUTATION,
          variables: {
            input: aTimeTracking_CreateTimeEntryInput(),
          },
        },
        result: {
          data: {
            __typename: 'Mutation',
            timeTrackingCreateTimeEntry: {
              __typename: 'TimeTracking_CreateTimeEntryError',
              errorCode: 'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
              message: null,
              subCode: 'SUB_ERROR',
              details: null,
              element: null,
              detailLocalizationArgs: null,
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useCreateTimeEntry(args),
      tsheetErrorMocks,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_CreateTimeEntryInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();

    // Verify that the error message is the mapped error, not the raw details
    const errorMessage = (args.onError as jest.Mock).mock.calls[0][0];
    expect(errorMessage).not.toContain('Details:\\n');
  });

  it('should handle TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET error with empty message', async () => {
    const tsheetErrorMocks = [
      {
        request: {
          query: CREATE_TIME_ENTRY_MUTATION,
          variables: {
            input: aTimeTracking_CreateTimeEntryInput(),
          },
        },
        result: {
          data: {
            __typename: 'Mutation',
            timeTrackingCreateTimeEntry: {
              __typename: 'TimeTracking_CreateTimeEntryError',
              errorCode: 'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
              message: '   ',
              subCode: 'SUB_ERROR',
              details: null,
              element: null,
              detailLocalizationArgs: null,
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useCreateTimeEntry(args),
      tsheetErrorMocks,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_CreateTimeEntryInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();

    // Verify that the error message is the mapped error, not the raw details
    const errorMessage = (args.onError as jest.Mock).mock.calls[0][0];
    expect(errorMessage).not.toContain('Details:\\n');
  });

  it('should handle non-TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET errors normally', async () => {
    const regularErrorMocks = [
      {
        request: {
          query: CREATE_TIME_ENTRY_MUTATION,
          variables: {
            input: aTimeTracking_CreateTimeEntryInput(),
          },
        },
        result: {
          data: {
            __typename: 'Mutation',
            timeTrackingCreateTimeEntry: {
              __typename: 'TimeTracking_CreateTimeEntryError',
              errorCode: 'GENERAL_ERROR',
              message: 'Some general error',
              subCode: 'SUB_ERROR',
              details: null,
              element: null,
              detailLocalizationArgs: null,
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useCreateTimeEntry(args),
      regularErrorMocks,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_CreateTimeEntryInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();
  });

  it('should handle null response error', async () => {
    const nullResponseMocks = [
      {
        request: {
          query: CREATE_TIME_ENTRY_MUTATION,
          variables: {
            input: aTimeTracking_CreateTimeEntryInput(),
          },
        },
        result: {
          data: {
            __typename: 'Mutation',
            timeTrackingCreateTimeEntry: null,
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useCreateTimeEntry(args),
      nullResponseMocks,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_CreateTimeEntryInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();

    // Verify that onError was called (the exact message will be processed through error mapping)
    const errorMessage = (args.onError as jest.Mock).mock.calls[0][0];
    expect(errorMessage).toBeDefined();
  });

  it('should handle unexpected response type error', async () => {
    const unexpectedResponseMocks = [
      {
        request: {
          query: CREATE_TIME_ENTRY_MUTATION,
          variables: {
            input: aTimeTracking_CreateTimeEntryInput(),
          },
        },
        result: {
          data: {
            __typename: 'Mutation',
            timeTrackingCreateTimeEntry: {
              __typename: 'UnexpectedType',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useCreateTimeEntry(args),
      unexpectedResponseMocks,
    );

    act(() => {
      result.current[0]({
        variables: {
          input: aTimeTracking_CreateTimeEntryInput(),
        },
      });
    });

    await waitForNextUpdate();

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();

    // Verify that onError was called (the exact message will be processed through error mapping)
    const errorMessage = (args.onError as jest.Mock).mock.calls[0][0];
    expect(errorMessage).toBeDefined();
  });
});
