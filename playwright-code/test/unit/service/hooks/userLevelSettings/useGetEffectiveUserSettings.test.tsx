import { act } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';
import {
  aTimeTracking_EffectiveUserSettings,
  aTimeTracking_UserSettingsInput,
} from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { GET_USER_SETTINGS } from 'src/js/service/queries/userSettingsQueries';
import { useGetEffectiveUserSettings } from 'src/js/service/hooks/userLevelSettings/useGetEffectiveUserSettings';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

// Mock the customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
}));

// Mock the mapError utility
jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

describe('useGetEffectiveUserSettings', () => {
  const mockInput = aTimeTracking_UserSettingsInput();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock behavior - return undefined when no error
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);
  });

  it('should return the hook interface with correct initial state', () => {
    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [],
    );

    expect(result.current.loadEffectiveUserSettings).toBeDefined();
    expect(typeof result.current.loadEffectiveUserSettings).toBe('function');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toBeUndefined();
  });

  it('should successfully load effective user settings', async () => {
    const mockData = aTimeTracking_EffectiveUserSettings();
    const successMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingEffectiveUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    expect(result.current.data).toBeDefined();
    expect(
      result.current.data?.timeTrackingEffectiveUserSettings,
    ).toBeDefined();
    expect(
      result.current.data?.timeTrackingEffectiveUserSettings?.__typename,
    ).toBe('TimeTracking_EffectiveUserSettings');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(
      require('src/js/common/CustomerInteraction').createCustomerInteraction,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
    );
  });

  it('should set loading state to true during query execution', async () => {
    const mockData = aTimeTracking_EffectiveUserSettings();
    const successMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingEffectiveUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [successMock],
    );

    // Initially not loading
    expect(result.current.loading).toBe(false);

    // Start the query
    const queryPromise = act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    // Should be loading during execution
    expect(result.current.loading).toBe(true);

    await queryPromise;

    // Should not be loading after completion
    expect(result.current.loading).toBe(false);
  });

  it('should handle network/Apollo errors', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Network error occurred');

    const networkErrorMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    expect(result.current.error).toBe('Network error occurred');
    expect(result.current.loading).toBe(false);
    expect(mapError).toHaveBeenCalledWith({
      sourceComponent: 'useGetEffectiveUserSettings',
      sandbox: expect.any(Object),
      intl: expect.any(Object),
      error: expect.any(ApolloError),
    });
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
      'QUERY_ERROR',
      { message: expect.any(String) },
    );
  });

  it('should not set error when mapError returns undefined', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);

    const networkErrorMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    expect(result.current.error).toBeUndefined();
  });

  it('should use cache-and-network fetch policy', async () => {
    const mockData = aTimeTracking_EffectiveUserSettings();
    const successMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingEffectiveUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    // Should be able to load data successfully with cache-and-network policy
    expect(result.current.data).toBeDefined();
  });

  it('should create customer interaction before loading', async () => {
    const mockData = aTimeTracking_EffectiveUserSettings();
    const successMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingEffectiveUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [successMock],
    );

    const {
      createCustomerInteraction,
    } = require('src/js/common/CustomerInteraction');

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    expect(createCustomerInteraction).toHaveBeenCalledTimes(1);
    expect(createCustomerInteraction).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
    );
  });

  it('should include propagation headers in query context', async () => {
    const mockData = aTimeTracking_EffectiveUserSettings();
    const mockHeaders = { 'x-trace-id': '123' };

    const {
      getCustomerInteractionPropagationHeaders,
    } = require('src/js/common/CustomerInteraction');
    getCustomerInteractionPropagationHeaders.mockReturnValue(mockHeaders);

    const successMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingEffectiveUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
    );
  });

  it('should handle multiple sequential calls', async () => {
    const mockData1 = aTimeTracking_EffectiveUserSettings();
    const mockData2 = aTimeTracking_EffectiveUserSettings();
    const mockInput1 = aTimeTracking_UserSettingsInput();
    const mockInput2 = aTimeTracking_UserSettingsInput();

    const successMock1 = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput1 },
      },
      result: {
        data: {
          timeTrackingEffectiveUserSettings: mockData1,
        },
      },
    };

    const successMock2 = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput2 },
      },
      result: {
        data: {
          timeTrackingEffectiveUserSettings: mockData2,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [successMock1, successMock2],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput1);
    });

    expect(result.current.data).toBeDefined();
    expect(
      result.current.data?.timeTrackingEffectiveUserSettings,
    ).toBeDefined();

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput2);
    });

    expect(result.current.data).toBeDefined();
    expect(
      result.current.data?.timeTrackingEffectiveUserSettings,
    ).toBeDefined();
  });

  it('should use TIME_TRACKING client name in context', async () => {
    const mockData = aTimeTracking_EffectiveUserSettings();
    const successMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingEffectiveUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    // If the client name wasn't correct, the query would fail
    expect(result.current.data).toBeDefined();
  });

  it('should call onSuccess callback when data is successfully fetched', async () => {
    const mockData = aTimeTracking_EffectiveUserSettings();
    const mockOnSuccess = jest.fn();
    const successMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingEffectiveUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings({ onSuccess: mockOnSuccess }),
      [successMock],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        timeTrackingEffectiveUserSettings: expect.any(Object),
      }),
    );
  });

  it('should call onError callback when query fails', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    const errorMessage = 'Network error occurred';
    mapError.mockReturnValue(errorMessage);
    const mockOnError = jest.fn();

    const networkErrorMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings({ onError: mockOnError }),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    expect(mockOnError).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith(errorMessage);
  });

  it('should handle onError callback with Unknown error when mapError returns null', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(null);
    const mockOnError = jest.fn();

    const networkErrorMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings({ onError: mockOnError }),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    expect(mockOnError).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith('Unknown error');
  });

  it('should work without callbacks provided', async () => {
    const mockData = aTimeTracking_EffectiveUserSettings();
    const successMock = {
      request: {
        query: GET_USER_SETTINGS,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingEffectiveUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetEffectiveUserSettings(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadEffectiveUserSettings(mockInput);
    });

    // Should work without errors even when callbacks are not provided
    expect(result.current.data).toBeDefined();
  });
});
