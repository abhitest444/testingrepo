/* eslint-disable camelcase */
import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { buildSandbox, MockQuicksandProvider } from '@payroll/quicksand';
import {
  useDeleteTimeEntry,
  UseDeleteTimeEntryArgs,
} from 'src/js/service/hooks/timeEntries/useDeleteTimeEntry';
import { useDeleteTimeEntryMutation } from 'src/__generated__/timeTracking/graphql';

// Mock the generated mutation hook
jest.mock('src/__generated__/timeTracking/graphql', () => ({
  useDeleteTimeEntryMutation: jest.fn(),
}));

describe('useDeleteTimeEntry', () => {
  let args: UseDeleteTimeEntryArgs;
  const mockMutate = jest.fn();
  const sandbox = buildSandbox();

  beforeEach(() => {
    jest.clearAllMocks();
    args = {
      onError: jest.fn(),
      onSuccess: jest.fn(),
    };

    (useDeleteTimeEntryMutation as jest.Mock).mockReturnValue([
      mockMutate,
      { loading: false },
    ]);
  });

  const renderHookWithSandbox = (callback: any) =>
    renderHook(callback, {
      wrapper: ({ children }) => (
        <MockQuicksandProvider sandbox={sandbox}>
          {children}
        </MockQuicksandProvider>
      ),
    });

  it('should call onSuccess when mutation returns success payload', () => {
    const successCode = 'DELETE_SUCCESS';
    let onCompletedCallback: any;

    (useDeleteTimeEntryMutation as jest.Mock).mockImplementation((options) => {
      onCompletedCallback = options.onCompleted;
      return [mockMutate, { loading: false }];
    });

    renderHookWithSandbox(() => useDeleteTimeEntry(args));

    // Simulate successful response
    act(() => {
      onCompletedCallback({
        timeTrackingDeleteTimeEntry: {
          __typename: 'TimeTracking_DeleteTimeEntryPayload',
          successCode,
        },
      });
    });

    expect(args.onSuccess).toHaveBeenCalledWith(successCode);
    expect(args.onError).not.toHaveBeenCalled();
  });

  it('should call onError when mutation returns null response', () => {
    let onCompletedCallback: any;

    (useDeleteTimeEntryMutation as jest.Mock).mockImplementation((options) => {
      onCompletedCallback = options.onCompleted;
      return [mockMutate, { loading: false }];
    });

    renderHookWithSandbox(() => useDeleteTimeEntry(args));

    act(() => {
      onCompletedCallback({
        timeTrackingDeleteTimeEntry: null,
      });
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();
  });

  it('should call onError when mutation returns error type', () => {
    let onCompletedCallback: any;

    (useDeleteTimeEntryMutation as jest.Mock).mockImplementation((options) => {
      onCompletedCallback = options.onCompleted;
      return [mockMutate, { loading: false }];
    });

    renderHookWithSandbox(() => useDeleteTimeEntry(args));

    act(() => {
      onCompletedCallback({
        timeTrackingDeleteTimeEntry: {
          __typename: 'TimeTracking_DeleteTimeEntryError',
          errorCode: 'TIME_ENTRY_NOT_FOUND',
        },
      });
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();
  });

  it('should call onError when mutation returns unexpected type', () => {
    let onCompletedCallback: any;

    (useDeleteTimeEntryMutation as jest.Mock).mockImplementation((options) => {
      onCompletedCallback = options.onCompleted;
      return [mockMutate, { loading: false }];
    });

    renderHookWithSandbox(() => useDeleteTimeEntry(args));

    act(() => {
      onCompletedCallback({
        timeTrackingDeleteTimeEntry: {
          __typename: 'UnexpectedType',
        },
      });
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();
  });

  it('should call onError when network error occurs', () => {
    let onErrorCallback: any;

    (useDeleteTimeEntryMutation as jest.Mock).mockImplementation((options) => {
      onErrorCallback = options.onError;
      return [mockMutate, { loading: false }];
    });

    renderHookWithSandbox(() => useDeleteTimeEntry(args));

    act(() => {
      onErrorCallback(new Error('Network error'));
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalled();
  });

  it('should handle success with logging and customer interaction', () => {
    const successCode = 'SUCCESS';
    let onCompletedCallback: any;

    (useDeleteTimeEntryMutation as jest.Mock).mockImplementation((options) => {
      onCompletedCallback = options.onCompleted;
      return [mockMutate, { loading: false }];
    });

    const loggerSpy = jest.spyOn(sandbox.logger, 'info');

    renderHookWithSandbox(() => useDeleteTimeEntry(args));

    act(() => {
      onCompletedCallback({
        timeTrackingDeleteTimeEntry: {
          __typename: 'TimeTracking_DeleteTimeEntryPayload',
          successCode,
        },
      });
    });

    expect(loggerSpy).toHaveBeenCalledWith(
      'Component=useDeleteTimeEntry Event=Successfully deleted time entry',
    );
    expect(args.onSuccess).toHaveBeenCalledWith(successCode);
  });

  it('should handle error with logging and customer interaction', () => {
    let onErrorCallback: any;

    (useDeleteTimeEntryMutation as jest.Mock).mockImplementation((options) => {
      onErrorCallback = options.onError;
      return [mockMutate, { loading: false }];
    });

    const loggerSpy = jest.spyOn(sandbox.logger, 'error');

    renderHookWithSandbox(() => useDeleteTimeEntry(args));

    const testError = new Error('Test error');
    act(() => {
      onErrorCallback(testError);
    });

    expect(loggerSpy).toHaveBeenCalledWith(
      'Component=useDeleteTimeEntry Event=Error deleting time entry',
      { error: testError },
    );
    expect(args.onError).toHaveBeenCalled();
  });
});
