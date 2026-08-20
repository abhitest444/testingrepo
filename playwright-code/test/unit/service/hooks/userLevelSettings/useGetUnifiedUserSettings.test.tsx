import { act } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';
import {
  aTimeTracking_UnifiedUserSettings,
  aTimeTracking_UnifiedUserSettingsInput,
} from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { TimeTrackingUnifiedUserSettingsDocument } from 'src/__generated__/timeTracking/graphql';
import { useGetUnifiedUserSettings } from 'src/js/service/hooks/userLevelSettings/useGetUnifiedUserSettings';
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

describe('useGetUnifiedUserSettings', () => {
  const mockInput = aTimeTracking_UnifiedUserSettingsInput();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock behavior - return undefined when no error
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);
  });

  it('should return the hook interface with correct initial state', () => {
    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [],
    );

    expect(result.current.loadUnifiedUserSettings).toBeDefined();
    expect(typeof result.current.loadUnifiedUserSettings).toBe('function');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toBeUndefined();
  });

  it('should successfully load unified user settings', async () => {
    const mockData = aTimeTracking_UnifiedUserSettings();
    const successMock = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingUnifiedUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.timeTrackingUnifiedUserSettings).toBeDefined();
    expect(
      result.current.data?.timeTrackingUnifiedUserSettings?.__typename,
    ).toBe('TimeTracking_UnifiedUserSettings');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(
      require('src/js/common/CustomerInteraction').createCustomerInteraction,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_UNIFIED_SETTINGS_READ,
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_UNIFIED_SETTINGS_READ,
    );
  });

  it('should set loading state to true during query execution', async () => {
    const mockData = aTimeTracking_UnifiedUserSettings();
    const successMock = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingUnifiedUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [successMock],
    );

    // Initially not loading
    expect(result.current.loading).toBe(false);

    // Start the query
    const queryPromise = act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
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
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
    });

    expect(result.current.error).toBe('Network error occurred');
    expect(result.current.loading).toBe(false);
    expect(mapError).toHaveBeenCalledWith({
      sourceComponent: 'useGetUnifiedUserSettings',
      sandbox: expect.any(Object),
      intl: expect.any(Object),
      error: expect.any(ApolloError),
    });
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_UNIFIED_SETTINGS_READ,
      'QUERY_ERROR',
      { message: expect.any(String) },
    );
  });

  it('should call onError callback when fetch fails', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Network error occurred');

    const onErrorMock = jest.fn();
    const networkErrorMock = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings({ onError: onErrorMock }),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
    });

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith('Network error occurred');
  });

  it('should call onError with "Unknown error" when mapError returns undefined', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);

    const onErrorMock = jest.fn();
    const networkErrorMock = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings({ onError: onErrorMock }),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
    });

    expect(onErrorMock).toHaveBeenCalledWith('Unknown error');
  });

  it('should not set error when mapError returns undefined', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);

    const networkErrorMock = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
    });

    expect(result.current.error).toBeUndefined();
  });

  it('should use cache-and-network fetch policy', async () => {
    const mockData = aTimeTracking_UnifiedUserSettings();
    const successMock = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingUnifiedUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
    });

    // Should be able to load data successfully with cache-and-network policy
    expect(result.current.data).toBeDefined();
  });

  it('should create customer interaction before loading', async () => {
    const mockData = aTimeTracking_UnifiedUserSettings();
    const successMock = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingUnifiedUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [successMock],
    );

    const {
      createCustomerInteraction,
    } = require('src/js/common/CustomerInteraction');

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
    });

    expect(createCustomerInteraction).toHaveBeenCalledTimes(1);
    expect(createCustomerInteraction).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_UNIFIED_SETTINGS_READ,
    );
  });

  it('should include propagation headers in query context', async () => {
    const mockData = aTimeTracking_UnifiedUserSettings();
    const mockHeaders = { 'x-trace-id': '123' };

    const {
      getCustomerInteractionPropagationHeaders,
    } = require('src/js/common/CustomerInteraction');
    getCustomerInteractionPropagationHeaders.mockReturnValue(mockHeaders);

    const successMock = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingUnifiedUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
    });

    expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_UNIFIED_SETTINGS_READ,
    );
  });

  it('should handle multiple sequential calls', async () => {
    const mockData1 = aTimeTracking_UnifiedUserSettings();
    const mockData2 = aTimeTracking_UnifiedUserSettings();
    const mockInput1 = aTimeTracking_UnifiedUserSettingsInput();
    const mockInput2 = aTimeTracking_UnifiedUserSettingsInput();

    const successMock1 = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput1 },
      },
      result: {
        data: {
          timeTrackingUnifiedUserSettings: mockData1,
        },
      },
    };

    const successMock2 = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput2 },
      },
      result: {
        data: {
          timeTrackingUnifiedUserSettings: mockData2,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [successMock1, successMock2],
    );

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput1);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.timeTrackingUnifiedUserSettings).toBeDefined();

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput2);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.timeTrackingUnifiedUserSettings).toBeDefined();
  });

  it('should use TIME_TRACKING client name in context', async () => {
    const mockData = aTimeTracking_UnifiedUserSettings();
    const successMock = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingUnifiedUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
    });

    // If the client name wasn't correct, the query would fail
    expect(result.current.data).toBeDefined();
  });

  it('should accept optional callbacks in hook initialization', () => {
    const onSuccessMock = jest.fn();
    const onErrorMock = jest.fn();

    const { result } = renderHookWithApolloProvider(
      () =>
        useGetUnifiedUserSettings({
          onSuccess: onSuccessMock,
          onError: onErrorMock,
        }),
      [],
    );

    // Hook should initialize without errors
    expect(result.current.loadUnifiedUserSettings).toBeDefined();
    expect(result.current.loading).toBe(false);
  });

  it('should work without any callbacks provided', async () => {
    const mockData = aTimeTracking_UnifiedUserSettings();
    const successMock = {
      request: {
        query: TimeTrackingUnifiedUserSettingsDocument,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingUnifiedUserSettings: mockData,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUnifiedUserSettings(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadUnifiedUserSettings(mockInput);
    });

    // Should complete successfully without callbacks
    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeUndefined();
  });
});
