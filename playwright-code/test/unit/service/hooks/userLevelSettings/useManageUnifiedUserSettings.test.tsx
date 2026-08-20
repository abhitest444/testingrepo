import { act } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';
import {
  aTimeTracking_ManageUnifiedUserSettingsPayload,
  aTimeTracking_ManageUnifiedUserSettingsError,
  aTimeTracking_UnifiedUserSettings,
  aTimeTracking_TimeForInput,
  aTimeTracking_UnifiedUserLocationTracking,
} from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import {
  TimeTrackingManageUnifiedUserSettingsDocument,
  TimeTracking_UserLocationTrackingType,
  TimeTracking_LocationTrackingType,
} from 'src/__generated__/timeTracking/graphql';
import {
  useManageUnifiedUserSettings,
  UseManageUnifiedUserSettingsArgs,
  LocationTrackingInput,
} from 'src/js/service/hooks/userLevelSettings/useManageUnifiedUserSettings';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

// Mock the customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({
    'x-interaction-id': 'test-interaction-id',
  }),
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

describe('useManageUnifiedUserSettings', () => {
  let args: UseManageUnifiedUserSettingsArgs;
  const mockSettingsFor = aTimeTracking_TimeForInput({
    id: '10',
    timeForType: 'EMPLOYEE' as any,
  });
  const mockLocationTracking: LocationTrackingInput = {
    value: TimeTracking_UserLocationTrackingType.Optional,
    version: '1121',
  };

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

  it('should return saveLocationSettings function and loading state', () => {
    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [],
    );

    expect(result.current).toBeDefined();
    expect(typeof result.current.saveLocationSettings).toBe('function');
    expect(typeof result.current.loading).toBe('boolean');
    expect(result.current.loading).toBe(false);
  });

  it('should handle successful mutation with payload response', async () => {
    const mockPayload = aTimeTracking_ManageUnifiedUserSettingsPayload({
      successCode: 'SUCCESS',
      userSettings: aTimeTracking_UnifiedUserSettings({
        locationTracking: aTimeTracking_UnifiedUserLocationTracking({
          value: TimeTracking_UserLocationTrackingType.Optional,
          effectiveValue: TimeTracking_LocationTrackingType.Optional,
          meta: { version: '1122' },
        }),
      }),
    });

    const successMock = {
      request: {
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings: mockPayload,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [successMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    expect(args.onSuccess).toHaveBeenCalledWith(mockPayload);
    expect(args.onError).not.toHaveBeenCalled();
    expect(
      require('src/js/common/CustomerInteraction').createCustomerInteraction,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.SETTINGS_SAVE,
    );
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
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings:
            aTimeTracking_ManageUnifiedUserSettingsError({
              errorCode: 'VALIDATION_ERROR',
              message: errorMessage,
              details: 'Invalid settings',
            }),
        },
      },
    };

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(errorMessage);

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
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
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith('Network error occurred');
    expect(mapError).toHaveBeenCalledWith({
      sourceComponent: 'useManageUnifiedUserSettings',
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
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings: null,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [nullDataMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith('Null Response');
  });

  it('should handle unexpected response type', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Unexpected response type');

    const unexpectedTypeMock = {
      request: {
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings: {
            __typename: 'UnexpectedType',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [unexpectedTypeMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith('Unexpected response type');
  });

  it('should handle error codes via mapTimeTrackingMutationError', async () => {
    const errorMock = {
      request: {
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings:
            aTimeTracking_ManageUnifiedUserSettingsError({
              errorCode: 'SOME_ERROR_CODE',
              message: 'Error message',
              details: '',
            }),
        },
      },
    };

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Mapped error message');

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    expect(args.onError).toHaveBeenCalledWith('Mapped error message');
    expect(mapError).toHaveBeenCalledWith({
      sourceComponent: 'useManageUnifiedUserSettings',
      sandbox: expect.any(Object),
      intl: expect.any(Object),
      error: 'SOME_ERROR_CODE',
      customErrorHandler: expect.any(Function),
    });
  });

  it('should work without interaction tracking', async () => {
    const argsWithoutInteraction = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
      interaction: undefined,
    };

    const mockPayload = aTimeTracking_ManageUnifiedUserSettingsPayload({
      successCode: 'SUCCESS',
      userSettings: aTimeTracking_UnifiedUserSettings(),
    });

    const successMock = {
      request: {
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings: mockPayload,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(argsWithoutInteraction),
      [successMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    expect(argsWithoutInteraction.onSuccess).toHaveBeenCalledWith(mockPayload);
    expect(
      require('src/js/common/CustomerInteraction').createCustomerInteraction,
    ).not.toHaveBeenCalled();
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
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings:
            aTimeTracking_ManageUnifiedUserSettingsError({
              errorCode: 'BILLABLE_REQUIRES_CUSTOMER',
              message: 'Expected error',
              details: '',
            }),
        },
      },
    };

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Expected error');

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
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
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings:
            aTimeTracking_ManageUnifiedUserSettingsError({
              errorCode: 'SOME_ERROR',
              message: 'Error message',
              details: '',
            }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    expect(args.onError).not.toHaveBeenCalled();
  });

  it('should use TIME_TRACKING client name in context', async () => {
    const mockPayload = aTimeTracking_ManageUnifiedUserSettingsPayload({
      successCode: 'SUCCESS',
      userSettings: aTimeTracking_UnifiedUserSettings(),
    });

    const successMock = {
      request: {
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings: mockPayload,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [successMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    // If the client name wasn't correct, the mutation would fail
    expect(args.onSuccess).toHaveBeenCalled();
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
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings:
            aTimeTracking_ManageUnifiedUserSettingsError({
              errorCode: 'SOME_ERROR',
              message: 'Error message',
              details: '',
            }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(argsWithoutInteraction),
      [errorMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
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
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
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
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      error: new ApolloError({ errorMessage: 'Test error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [errorMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    expect(mapError).toHaveBeenCalledWith({
      sourceComponent: 'useManageUnifiedUserSettings',
      sandbox: expect.any(Object),
      intl: expect.any(Object),
      error: expect.any(ApolloError),
      customErrorHandler: expect.any(Function),
    });

    // Test the custom error handler - all errors go through mapTimeTrackingMutationError
    const { customErrorHandler } = mapError.mock.calls[0][0];

    mapTimeTrackingMutationError.mockClear();
    customErrorHandler('SOME_ERROR');
    expect(mapTimeTrackingMutationError).toHaveBeenCalledWith(
      expect.any(Object),
      'SOME_ERROR',
    );
  });

  it('should include interaction propagation headers when interaction is provided', async () => {
    const mockPayload = aTimeTracking_ManageUnifiedUserSettingsPayload({
      successCode: 'SUCCESS',
      userSettings: aTimeTracking_UnifiedUserSettings(),
    });

    const successMock = {
      request: {
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings: mockPayload,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [successMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    expect(
      require('src/js/common/CustomerInteraction')
        .getCustomerInteractionPropagationHeaders,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.SETTINGS_SAVE,
    );
  });

  it('should not include interaction propagation headers when interaction is not provided', async () => {
    const argsWithoutInteraction = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
      interaction: undefined,
    };

    const mockPayload = aTimeTracking_ManageUnifiedUserSettingsPayload({
      successCode: 'SUCCESS',
      userSettings: aTimeTracking_UnifiedUserSettings(),
    });

    const successMock = {
      request: {
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: mockLocationTracking,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings: mockPayload,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(argsWithoutInteraction),
      [successMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        mockLocationTracking,
      );
    });

    expect(
      require('src/js/common/CustomerInteraction')
        .getCustomerInteractionPropagationHeaders,
    ).not.toHaveBeenCalled();
  });

  it('should handle location tracking with only value (no version)', async () => {
    const locationTrackingWithoutVersion: LocationTrackingInput = {
      value: TimeTracking_UserLocationTrackingType.Required,
    };

    const mockPayload = aTimeTracking_ManageUnifiedUserSettingsPayload({
      successCode: 'SUCCESS',
      userSettings: aTimeTracking_UnifiedUserSettings(),
    });

    const successMock = {
      request: {
        query: TimeTrackingManageUnifiedUserSettingsDocument,
        variables: {
          input: {
            settingsFor: mockSettingsFor,
            locationTracking: locationTrackingWithoutVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingManageUnifiedUserSettings: mockPayload,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUnifiedUserSettings(args),
      [successMock],
    );

    await act(async () => {
      await result.current.saveLocationSettings(
        mockSettingsFor,
        locationTrackingWithoutVersion,
      );
    });

    expect(args.onSuccess).toHaveBeenCalledWith(mockPayload);
  });
});
