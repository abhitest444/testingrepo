import { act } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';
import { aTimeTracking_WorkerPermissions } from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import {
  TimeTracking_TimeForType,
  TimeTrackingWorkerPermissionsDocument,
} from 'src/__generated__/timeTracking/graphql';
import { useGetUserPermissions } from 'src/js/widgets/userSettings/service/permissions/useGetUserPermissions';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';
import { PERMISSIONS_ROLE_VALUE } from 'src/js/widgets/userSettings/components/cards/PermissionsCard/constants';

jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
}));

jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

describe('useGetUserPermissions', () => {
  const input = {
    settingsFor: {
      id: 'worker-1',
      timeForType: TimeTracking_TimeForType.Employee,
    },
  };

  const variables = {
    input: {
      workerId: 'worker-1',
      workerType: TimeTracking_TimeForType.Employee,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);
  });

  it('returns hook interface and loads permissions on success', async () => {
    const workerPermissions = aTimeTracking_WorkerPermissions({
      admin: false,
      workerId: 'worker-1',
    });
    const onSuccess = jest.fn();

    const { result } = renderHookWithApolloProvider(
      () => useGetUserPermissions({ onSuccess }),
      [
        {
          request: { query: TimeTrackingWorkerPermissionsDocument, variables },
          result: {
            data: { timeTrackingWorkerPermissions: workerPermissions },
          },
        },
      ],
    );

    expect(result.current.loadUserPermissions).toBeDefined();
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.loadUserPermissions(input);
    });

    expect(onSuccess).toHaveBeenCalledWith({
      permissions: expect.objectContaining({
        role: PERMISSIONS_ROLE_VALUE.WORKER,
      }),
    });
    expect(result.current.data?.permissions.role).toBe(
      PERMISSIONS_ROLE_VALUE.WORKER,
    );
    expect(
      require('src/js/common/CustomerInteraction').createCustomerInteraction,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_PERMISSIONS_READ,
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_PERMISSIONS_READ,
    );
  });

  it('handles query errors via mapError fallback', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Mapped load error');
    const onError = jest.fn();

    const { result } = renderHookWithApolloProvider(
      () => useGetUserPermissions({ onError }),
      [
        {
          request: { query: TimeTrackingWorkerPermissionsDocument, variables },
          error: new ApolloError({ errorMessage: 'Network error' }),
        },
      ],
    );

    await act(async () => {
      await result.current.loadUserPermissions(input);
    });

    expect(onError).toHaveBeenCalledWith('Mapped load error');
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_PERMISSIONS_READ,
      'QUERY_ERROR',
      expect.any(Object),
    );
  });

  it('handles null permissions response when not loading', async () => {
    const onError = jest.fn();

    const { result } = renderHookWithApolloProvider(
      () => useGetUserPermissions({ onError }),
      [
        {
          request: { query: TimeTrackingWorkerPermissionsDocument, variables },
          result: { data: { timeTrackingWorkerPermissions: null } },
        },
      ],
    );

    await act(async () => {
      await result.current.loadUserPermissions(input);
    });

    expect(onError).toHaveBeenCalled();
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_PERMISSIONS_READ,
      'EMPTY_RESPONSE',
      expect.any(Object),
    );
  });

  it('maps hook-level Apollo error for display', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Displayed error');

    const errorMock = {
      request: { query: TimeTrackingWorkerPermissionsDocument, variables },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetUserPermissions(),
      [errorMock],
    );

    await act(async () => {
      await result.current.loadUserPermissions(input);
    });

    expect(result.current.error).toBe('Displayed error');
  });
});
