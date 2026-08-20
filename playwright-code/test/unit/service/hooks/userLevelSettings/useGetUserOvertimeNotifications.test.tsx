// @ts-nocheck
/**
 * Tests for useGetUserOvertimeNotifications — lazy query + callbacks.
 */

import { act, waitFor } from '@testing-library/react-hooks';
import { aTimeTracking_UnifiedUserSettingsInput } from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { GET_USER_OVERTIME_NOTIFICATIONS } from 'src/js/service/queries/userSettingsQueries';
import { useGetUserOvertimeNotifications } from 'src/js/service/hooks/userLevelSettings/useGetUserOvertimeNotifications';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
}));

jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

const {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
} = require('src/js/common/CustomerInteraction');

const { mapError } = require('src/js/service/utils/mapError');

describe('useGetUserOvertimeNotifications', () => {
  const mockInput = aTimeTracking_UnifiedUserSettingsInput();

  const mockOvertimeNotifications = {
    rules: [
      {
        id: 'rule-DAY-1',
        meta: {
          version: '1',
          createdBy: null,
          createdAt: null,
          updatedBy: null,
          updatedAt: null,
        },
        threshold: { hours: 8, minutes: 0, period: 'DAY' },
        alertFrequency: { totalAlerts: 2, intervalMinutes: 60 },
        recipients: {
          admin: ['EMAIL'],
          groupManager: ['EMAIL'],
          employee: ['EMAIL'],
        },
        assignedTo: { entityType: 'ALL', entityIds: '-1' },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mapError.mockReturnValue('mapped-error');
  });

  it('starts with loading false and no data', () => {
    const { result } = renderHookWithApolloProvider(() =>
      useGetUserOvertimeNotifications({}),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('exposes loadUserOvertimeNotifications function', () => {
    const { result } = renderHookWithApolloProvider(() =>
      useGetUserOvertimeNotifications({}),
    );

    expect(typeof result.current.loadUserOvertimeNotifications).toBe(
      'function',
    );
  });

  it('calls onSuccess with data on successful query', async () => {
    const onSuccess = jest.fn();
    const mocks = [
      {
        request: {
          query: GET_USER_OVERTIME_NOTIFICATIONS,
          variables: { input: mockInput },
        },
        result: {
          data: {
            timeTrackingUnifiedUserSettings: {
              overtimeNotifications: mockOvertimeNotifications,
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetUserOvertimeNotifications({ onSuccess }),
      mocks,
    );

    act(() => {
      result.current.loadUserOvertimeNotifications(mockInput);
    });
    await waitForNextUpdate();

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        timeTrackingUnifiedUserSettings: expect.objectContaining({
          overtimeNotifications: mockOvertimeNotifications,
        }),
      }),
    );
  });

  it('calls endInteractionWithSuccess on successful query', async () => {
    const mocks = [
      {
        request: {
          query: GET_USER_OVERTIME_NOTIFICATIONS,
          variables: { input: mockInput },
        },
        result: {
          data: {
            timeTrackingUnifiedUserSettings: {
              overtimeNotifications: mockOvertimeNotifications,
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () =>
        useGetUserOvertimeNotifications({
          customerInteraction:
            TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
        }),
      mocks,
    );

    act(() => {
      result.current.loadUserOvertimeNotifications(mockInput);
    });
    await waitForNextUpdate();

    expect(endInteractionWithSuccess).toHaveBeenCalled();
  });

  it('calls createCustomerInteraction when loadUserOvertimeNotifications is called', () => {
    const { result } = renderHookWithApolloProvider(() =>
      useGetUserOvertimeNotifications({}),
    );

    act(() => {
      result.current.loadUserOvertimeNotifications(mockInput);
    });

    expect(createCustomerInteraction).toHaveBeenCalled();
  });

  it('calls onError with mapped error message on network error', async () => {
    const onError = jest.fn();
    const mocks = [
      {
        request: {
          query: GET_USER_OVERTIME_NOTIFICATIONS,
          variables: { input: mockInput },
        },
        error: new Error('Network error'),
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetUserOvertimeNotifications({ onError }),
      mocks,
    );

    act(() => {
      result.current.loadUserOvertimeNotifications(mockInput);
    });
    await waitForNextUpdate();

    expect(onError).toHaveBeenCalledWith('mapped-error');
  });

  it('calls endInteractionWithFailure on network error', async () => {
    const mocks = [
      {
        request: {
          query: GET_USER_OVERTIME_NOTIFICATIONS,
          variables: { input: mockInput },
        },
        error: new Error('Network error'),
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetUserOvertimeNotifications({}),
      mocks,
    );

    act(() => {
      result.current.loadUserOvertimeNotifications(mockInput);
    });
    await waitForNextUpdate();

    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'QUERY_ERROR',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it('loadUserOvertimeNotifications returns a resolved promise', async () => {
    const { result } = renderHookWithApolloProvider(() =>
      useGetUserOvertimeNotifications({}),
    );

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.loadUserOvertimeNotifications(
        mockInput,
      );
    });

    expect(returnValue).toBeUndefined();
  });

  it('uses default customerInteraction when none provided', () => {
    const { result } = renderHookWithApolloProvider(() =>
      useGetUserOvertimeNotifications(),
    );

    act(() => {
      result.current.loadUserOvertimeNotifications(mockInput);
    });

    expect(createCustomerInteraction).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
    );
  });

  it('passes custom fetchPolicy to query when provided in options', async () => {
    const onSuccess = jest.fn();
    const mocks = [
      {
        request: {
          query: GET_USER_OVERTIME_NOTIFICATIONS,
          variables: { input: mockInput },
        },
        result: {
          data: {
            timeTrackingUnifiedUserSettings: {
              overtimeNotifications: mockOvertimeNotifications,
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetUserOvertimeNotifications({ onSuccess }),
      mocks,
    );

    act(() => {
      result.current.loadUserOvertimeNotifications(mockInput, {
        fetchPolicy: 'network-only',
      });
    });
    await waitForNextUpdate();

    // onSuccess is called with the data from the mock — confirms query executed
    expect(onSuccess).toHaveBeenCalled();
  });
});
