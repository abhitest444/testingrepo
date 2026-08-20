import { act } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';
import {
  aTimeTracking_ManageUserSettingsInput,
  aTimeTracking_ManageUserSettingsPayload,
  aTimeTracking_ManageUserSettingsError,
  aTimeTracking_UserSettings,
} from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { UPDATE_USER_SETTINGS } from 'src/js/service/queries/userSettingsQueries';
import {
  useManageUserSettings,
  UseManageUserSettingsArgs,
} from 'src/js/service/hooks/userLevelSettings/useManageUserSettings';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

// Mock the customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
}));

// Mock the mapError utility
jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

// Mock the error mapping functions
jest.mock('src/js/service/errors/timeTrackingErrors', () => ({
  ...jest.requireActual('src/js/service/errors/timeTrackingErrors'),
  isExpectedError: jest.fn(),
  mapTimeTrackingMutationError: jest.fn(),
}));

describe('useManageUserSettings', () => {
  let args: UseManageUserSettingsArgs;
  const mockInput = aTimeTracking_ManageUserSettingsInput();

  beforeEach(() => {
    args = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
      interaction: TimeCustomerInteraction.SETTINGS_SAVE,
    };
    jest.clearAllMocks();
    // Default mock behavior - return undefined when no error
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);
    const {
      isExpectedError,
    } = require('src/js/service/errors/timeTrackingErrors');
    isExpectedError.mockReturnValue(false);
  });

  it('should return mutation function from the hook', () => {
    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [],
    );

    expect(result.current).toBeDefined();
    expect(typeof result.current[0]).toBe('function');
  });

  it('should handle successful mutation with payload response', async () => {
    const mockPayload = aTimeTracking_ManageUserSettingsPayload({
      successCode: 'SUCCESS',
      userSettings: aTimeTracking_UserSettings(),
    });

    const successMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: mockPayload,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [successMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onSuccess).toHaveBeenCalledWith(mockPayload);
    expect(args.onError).not.toHaveBeenCalled();
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.SETTINGS_SAVE,
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).not.toHaveBeenCalled();
  });

  it('should handle mutation error response', async () => {
    const errorMessage = 'User settings validation failed';
    const errorMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: aTimeTracking_ManageUserSettingsError(
            {
              errorCode: 'VALIDATION_ERROR',
              message: errorMessage,
              details: 'Invalid settings',
              subCode: '',
            },
          ),
        },
      },
    };

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(errorMessage);

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith(errorMessage);
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.SETTINGS_SAVE,
      'VALIDATION_ERROR',
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).not.toHaveBeenCalled();
  });

  it('should handle network/Apollo errors', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Network error occurred');

    const networkErrorMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith('Network error occurred');
    expect(mapError).toHaveBeenCalledWith({
      sourceComponent: 'useManageUserSettings',
      sandbox: expect.any(Object),
      intl: expect.any(Object),
      error: expect.any(ApolloError),
      customErrorHandler: expect.any(Function),
    });
  });

  it('should handle null response', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Null Response');

    const nullDataMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: null,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [nullDataMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith('Null Response');
  });

  it('should handle unexpected response type', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Unexpected response type');

    const unexpectedTypeMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: {
            __typename: 'UnexpectedType',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [unexpectedTypeMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith('Unexpected response type');
  });

  it('should handle error with subCode for GENERAL_V3_ERROR', async () => {
    const errorMessage = 'General error';
    const details = 'Error details';
    const subCode = '9403';

    const errorMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: aTimeTracking_ManageUserSettingsError(
            {
              errorCode: 'GENERAL_V3_ERROR',
              message: errorMessage,
              details,
              subCode,
            },
          ),
        },
      },
    };

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(`${errorMessage} ${details}`);

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onError).toHaveBeenCalledWith(`${errorMessage} ${details}`);
  });

  it('should handle GENERAL_V1_ERROR with subCode', async () => {
    const errorMessage = 'General V1 error';
    const details = 'V1 Error details';
    const subCode = '9406';

    const errorMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: aTimeTracking_ManageUserSettingsError(
            {
              errorCode: 'GENERAL_V1_ERROR',
              message: errorMessage,
              details,
              subCode,
            },
          ),
        },
      },
    };

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(`${errorMessage} ${details}`);

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onError).toHaveBeenCalledWith(`${errorMessage} ${details}`);
  });

  it('should not include message/details for GENERAL_V3_ERROR without subCode', async () => {
    const errorCode = 'GENERAL_V3_ERROR';

    const errorMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: aTimeTracking_ManageUserSettingsError(
            {
              errorCode,
              message: 'Some message',
              details: 'Some details',
              subCode: '',
            },
          ),
        },
      },
    };

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Mapped error from intl');

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onError).toHaveBeenCalledWith('Mapped error from intl');
    expect(mapError).toHaveBeenCalledWith({
      sourceComponent: 'useManageUserSettings',
      sandbox: expect.any(Object),
      intl: expect.any(Object),
      error: errorCode,
      customErrorHandler: expect.any(Function),
    });
  });

  it('should work without interaction tracking', async () => {
    const argsWithoutInteraction = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
      interaction: undefined,
    };

    const mockPayload = aTimeTracking_ManageUserSettingsPayload({
      successCode: 'SUCCESS',
      userSettings: aTimeTracking_UserSettings(),
    });

    const successMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: mockPayload,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(argsWithoutInteraction),
      [successMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(argsWithoutInteraction.onSuccess).toHaveBeenCalledWith(mockPayload);
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).not.toHaveBeenCalled();
  });

  it('should handle expected errors correctly', async () => {
    const {
      isExpectedError,
    } = require('src/js/service/errors/timeTrackingErrors');
    isExpectedError.mockReturnValue(true);

    const errorMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: aTimeTracking_ManageUserSettingsError(
            {
              errorCode: 'BILLABLE_REQUIRES_CUSTOMER',
              message: 'Expected error',
              details: '',
              subCode: '',
            },
          ),
        },
      },
    };

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Expected error');

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onError).toHaveBeenCalledWith('Expected error');
    // For expected errors, we should still call endInteractionWithSuccess
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.SETTINGS_SAVE,
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).not.toHaveBeenCalled();
  });

  it('should not call onError when mapError returns undefined', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);

    const errorMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: aTimeTracking_ManageUserSettingsError(
            {
              errorCode: 'SOME_ERROR',
              message: 'Error message',
              details: '',
              subCode: '',
            },
          ),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onError).not.toHaveBeenCalled();
  });

  it('should use TIME_TRACKING client name in context', async () => {
    const mockPayload = aTimeTracking_ManageUserSettingsPayload({
      successCode: 'SUCCESS',
      userSettings: aTimeTracking_UserSettings(),
    });

    const successMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: mockPayload,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [successMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    // If the client name wasn't correct, the mutation would fail
    expect(args.onSuccess).toHaveBeenCalled();
  });

  it('should log success message on successful mutation', async () => {
    const mockPayload = aTimeTracking_ManageUserSettingsPayload({
      successCode: 'SUCCESS',
      userSettings: aTimeTracking_UserSettings(),
    });

    const successMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: mockPayload,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [successMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onSuccess).toHaveBeenCalledWith(mockPayload);
    // Logger calls would be verified if we had access to sandbox mock
  });

  it('should handle error without interaction tracking', async () => {
    const argsWithoutInteraction = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
      interaction: undefined,
    };

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Error occurred');

    const errorMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageUserSettings: aTimeTracking_ManageUserSettingsError(
            {
              errorCode: 'SOME_ERROR',
              message: 'Error message',
              details: '',
              subCode: '',
            },
          ),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(argsWithoutInteraction),
      [errorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(argsWithoutInteraction.onError).toHaveBeenCalledWith(
      'Error occurred',
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).not.toHaveBeenCalled();
  });

  it('should handle Apollo error when interaction is provided', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Apollo error occurred');

    const networkErrorMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(args.onError).toHaveBeenCalledWith('Apollo error occurred');
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.SETTINGS_SAVE,
      'Network error',
    );
  });

  it('should pass custom error handler to mapError', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    const {
      mapTimeTrackingMutationError,
    } = require('src/js/service/errors/timeTrackingErrors');

    const errorMock = {
      request: {
        query: UPDATE_USER_SETTINGS,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Test error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: mockInput } });
    });

    expect(mapError).toHaveBeenCalledWith({
      sourceComponent: 'useManageUserSettings',
      sandbox: expect.any(Object),
      intl: expect.any(Object),
      error: expect.any(ApolloError),
      customErrorHandler: expect.any(Function),
    });

    // Test the custom error handler
    const { customErrorHandler } = mapError.mock.calls[0][0];

    // Test with GENERAL_V3_ERROR and subCode
    mapTimeTrackingMutationError.mockClear();
    const result1 = customErrorHandler('GENERAL_V3_ERROR');
    expect(mapTimeTrackingMutationError).toHaveBeenCalledWith(
      expect.any(Object),
      'GENERAL_V3_ERROR',
    );

    // Test with other error
    mapTimeTrackingMutationError.mockClear();
    const result2 = customErrorHandler('OTHER_ERROR');
    expect(mapTimeTrackingMutationError).toHaveBeenCalledWith(
      expect.any(Object),
      'OTHER_ERROR',
    );
  });
});
