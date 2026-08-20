/* eslint-disable camelcase */
import { act } from '@testing-library/react-hooks';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { aTimeTracking_CreateGroupError } from '__mocks__/__generated__/timeTracking';
import { CREATE_GROUP_MUTATION } from 'src/js/service/queries/timeTrackingGroupMutations';
import { useCreateGroup } from 'src/js/service/hooks/groups/useCreateGroup';

import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

// Mock the customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  setInteractionDegraded: jest.fn(),
}));

describe('useCreateGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the hook interface with mutation function, loading state, and error', () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHookWithApolloProvider(
      () => useCreateGroup({ onSuccess, onError }),
      [],
    );

    const [mutate, { loading, error }] = result.current;

    expect(mutate).toBeDefined();
    expect(typeof mutate).toBe('function');
    expect(loading).toBe(false);
    expect(error).toBeUndefined();
  });

  it('should handle successful group creation', async () => {
    const mockGroupName = 'California Team';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const successMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: {
          input: { name: mockGroupName },
        },
      },
      result: {
        data: {
          timeTrackingCreateGroup: {
            __typename: 'TimeTracking_CreateGroupPayload',
            successCode: 'GROUP_CREATED',
            group: {
              __typename: 'TimeTracking_Group',
              id: 'group-123',
              name: mockGroupName,
              isActive: true,
              meta: {
                __typename: 'TimeTracking_GroupMeta',
                createdAt: '2025-10-29T00:00:00Z',
                updatedAt: '2025-10-29T00:00:00Z',
                version: 1,
              },
            },
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useCreateGroup({ onSuccess, onError }),
      [successMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { name: mockGroupName },
        },
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'group-123',
        name: mockGroupName,
        isActive: true,
      }),
    );
    expect(onError).not.toHaveBeenCalled();

    // Verify customer interaction tracking
    const {
      endInteractionWithSuccess,
    } = require('src/js/common/CustomerInteraction');

    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_CREATE,
    );
  });

  it('should trim whitespace from group name before creating', async () => {
    const mockGroupName = '  Sales Team  ';
    const trimmedName = 'Sales Team';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const successMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: {
          input: { name: trimmedName },
        },
      },
      result: {
        data: {
          timeTrackingCreateGroup: {
            __typename: 'TimeTracking_CreateGroupPayload',
            successCode: 'GROUP_CREATED',
            group: {
              __typename: 'TimeTracking_Group',
              id: 'group-456',
              name: trimmedName,
              isActive: true,
              meta: {
                __typename: 'TimeTracking_GroupMeta',
                createdAt: '2025-10-29T00:00:00Z',
                updatedAt: '2025-10-29T00:00:00Z',
                version: 1,
              },
            },
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useCreateGroup({ onSuccess, onError }),
      [successMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { name: trimmedName },
        },
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        name: trimmedName,
      }),
    );
  });

  it('should handle GROUP_NAME_ALREADY_EXISTS error', async () => {
    const mockGroupName = 'Duplicate Group';
    const errorMessage = 'A group with this name already exists';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: {
          input: { name: mockGroupName },
        },
      },
      result: {
        data: {
          timeTrackingCreateGroup: aTimeTracking_CreateGroupError({
            errorCode: 'GROUP_NAME_ALREADY_EXISTS',
            message: errorMessage,
            details: undefined,
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useCreateGroup({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { name: mockGroupName },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      errorMessage,
      'GROUP_NAME_ALREADY_EXISTS',
      '',
    );

    // Verify that endInteractionWithFailure is NOT called for duplicate group errors
    const {
      endInteractionWithFailure,
      setInteractionDegraded,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).not.toHaveBeenCalled();

    // Verify that setInteractionDegraded IS called for duplicate group errors
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_CREATE,
      errorMessage,
    );
  });

  it('should handle INVALID_GROUP_NAME error', async () => {
    const mockGroupName = '';
    const errorMessage = 'Group name cannot be empty';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: {
          input: { name: mockGroupName },
        },
      },
      result: {
        data: {
          timeTrackingCreateGroup: aTimeTracking_CreateGroupError({
            errorCode: 'INVALID_GROUP_NAME',
            message: errorMessage,
            details: 'Group name must be between 1 and 60 characters',
            subCode: 'NAME_TOO_SHORT',
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useCreateGroup({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { name: mockGroupName },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      errorMessage,
      'INVALID_GROUP_NAME',
      'Group name must be between 1 and 60 characters',
    );
  });

  it('should handle GENERAL_ERROR', async () => {
    const mockGroupName = 'Test Group';
    const errorMessage = 'An unexpected error occurred';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: {
          input: { name: mockGroupName },
        },
      },
      result: {
        data: {
          timeTrackingCreateGroup: aTimeTracking_CreateGroupError({
            errorCode: 'GENERAL_ERROR',
            message: errorMessage,
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useCreateGroup({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { name: mockGroupName },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('should handle network/Apollo errors', async () => {
    const mockGroupName = 'Test Group';
    const networkError = new Error('Network request failed');
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: {
          input: { name: mockGroupName },
        },
      },
      error: networkError,
    };

    const { result } = renderHookWithApolloProvider(
      () => useCreateGroup({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { name: mockGroupName },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Network request failed', '', '');

    // Verify error interaction tracking
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalled();
  });

  it('should handle null response from mutation', async () => {
    const mockGroupName = 'Test Group';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const nullResponseMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: {
          input: { name: mockGroupName },
        },
      },
      result: {
        data: {
          timeTrackingCreateGroup: null,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useCreateGroup({ onSuccess, onError }),
      [nullResponseMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { name: mockGroupName },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Null Response', '', '');
  });

  it('should handle error response with undefined message', async () => {
    const mockGroupName = 'Test Group';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: {
          input: { name: mockGroupName },
        },
      },
      result: {
        data: {
          timeTrackingCreateGroup: aTimeTracking_CreateGroupError({
            errorCode: 'GENERAL_ERROR',
            message: undefined,
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useCreateGroup({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { name: mockGroupName },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();

    // Verify it uses fallback error message
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_CREATE,
      'Create group failed',
    );
  });

  it('should handle unexpected response type', async () => {
    const mockGroupName = 'Test Group';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const unexpectedResponseMock = {
      request: {
        query: CREATE_GROUP_MUTATION,
        variables: {
          input: { name: mockGroupName },
        },
      },
      result: {
        data: {
          timeTrackingCreateGroup: {
            __typename: 'UnexpectedType',
            unexpectedField: 'value',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useCreateGroup({ onSuccess, onError }),
      [unexpectedResponseMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { name: mockGroupName },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Unexpected response type', '', '');

    // Verify error interaction tracking
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_CREATE,
      'Unexpected response type',
    );
  });
});
