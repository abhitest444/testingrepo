/* eslint-disable camelcase */
import { act } from '@testing-library/react-hooks';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { UPDATE_GROUP_MUTATION } from 'src/js/service/queries/timeTrackingGroupMutations';
import { useUpdateGroup } from 'src/js/service/hooks/groups/useUpdateGroup';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

// Mock the customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  setInteractionDegraded: jest.fn(),
}));

describe('useUpdateGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the hook interface with mutation function, loading state, and error', () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHookWithApolloProvider(
      () => useUpdateGroup({ onSuccess, onError }),
      [],
    );

    const [mutate, { loading, error }] = result.current;

    expect(mutate).toBeDefined();
    expect(typeof mutate).toBe('function');
    expect(loading).toBe(false);
    expect(error).toBeUndefined();
  });

  it('should handle successful group update', async () => {
    const mockUpdateInput = {
      id: 'group-123',
      version: 1,
      name: 'Updated Engineering Team',
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const successMock = {
      request: {
        query: UPDATE_GROUP_MUTATION,
        variables: {
          input: mockUpdateInput,
        },
      },
      result: {
        data: {
          timeTrackingUpdateGroup: {
            __typename: 'TimeTracking_UpdateGroupPayload',
            successCode: 'SUCCESS',
            group: {
              __typename: 'TimeTracking_Group',
              id: 'group-123',
              name: 'Updated Engineering Team',
              isActive: true,
              meta: {
                __typename: 'TimeTracking_GroupMeta',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-02T00:00:00Z',
                version: 2,
              },
            },
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useUpdateGroup({ onSuccess, onError }),
      [successMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: mockUpdateInput,
        },
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'group-123',
        name: 'Updated Engineering Team',
        isActive: true,
      }),
    );
    expect(onError).not.toHaveBeenCalled();

    // Verify customer interaction tracking
    const {
      endInteractionWithSuccess,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.GROUP_UPDATE,
    );
  });

  it('should handle duplicate group name error', async () => {
    const mockUpdateInput = {
      id: 'group-123',
      version: 1,
      name: 'Existing Team Name',
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: UPDATE_GROUP_MUTATION,
        variables: {
          input: mockUpdateInput,
        },
      },
      result: {
        data: {
          timeTrackingUpdateGroup: {
            __typename: 'TimeTracking_UpdateGroupError',
            errorCode: 'DUPLICATE_GROUP_NAME',
            message: 'Group with this name already exists',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useUpdateGroup({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: mockUpdateInput,
        },
      });
    });

    expect(onError).toHaveBeenCalledWith(
      'Group with this name already exists',
      'DUPLICATE_GROUP_NAME',
    );
    expect(onSuccess).not.toHaveBeenCalled();

    // Verify customer interaction tracking
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.GROUP_UPDATE,
      'Group with this name already exists',
    );
  });

  it('should handle GROUP_NAME_ALREADY_EXISTS error as degraded', async () => {
    const mockUpdateInput = {
      id: 'group-123',
      version: 1,
      name: 'Existing Team Name',
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: UPDATE_GROUP_MUTATION,
        variables: {
          input: mockUpdateInput,
        },
      },
      result: {
        data: {
          timeTrackingUpdateGroup: {
            __typename: 'TimeTracking_UpdateGroupError',
            errorCode: 'GROUP_NAME_ALREADY_EXISTS',
            message: 'A group with this name already exists',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useUpdateGroup({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: mockUpdateInput,
        },
      });
    });

    expect(onError).toHaveBeenCalledWith(
      'A group with this name already exists',
      'GROUP_NAME_ALREADY_EXISTS',
    );
    expect(onSuccess).not.toHaveBeenCalled();

    // Verify that setInteractionDegraded is called for GROUP_NAME_ALREADY_EXISTS
    const {
      setInteractionDegraded,
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.GROUP_UPDATE,
      'A group with this name already exists',
    );
    expect(endInteractionWithFailure).not.toHaveBeenCalled();
  });

  it('should handle version conflict error', async () => {
    const mockUpdateInput = {
      id: 'group-123',
      version: 1,
      name: 'Engineering Team',
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: UPDATE_GROUP_MUTATION,
        variables: {
          input: mockUpdateInput,
        },
      },
      result: {
        data: {
          timeTrackingUpdateGroup: {
            __typename: 'TimeTracking_UpdateGroupError',
            errorCode: 'VERSION_CONFLICT',
            message:
              'Group was modified by another user. Please refresh and try again.',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useUpdateGroup({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: mockUpdateInput,
        },
      });
    });

    expect(onError).toHaveBeenCalledWith(
      'Group was modified by another user. Please refresh and try again.',
      'VERSION_CONFLICT',
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle error without message field', async () => {
    const mockUpdateInput = {
      id: 'group-123',
      version: 1,
      name: 'Engineering Team',
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: UPDATE_GROUP_MUTATION,
        variables: {
          input: mockUpdateInput,
        },
      },
      result: {
        data: {
          timeTrackingUpdateGroup: {
            __typename: 'TimeTracking_UpdateGroupError',
            errorCode: 'UNKNOWN_ERROR',
            message: null,
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useUpdateGroup({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: mockUpdateInput,
        },
      });
    });

    expect(onError).toHaveBeenCalledWith(
      'Update group failed',
      'UNKNOWN_ERROR',
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle null response', async () => {
    const mockUpdateInput = {
      id: 'group-123',
      version: 1,
      name: 'Engineering Team',
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const nullResponseMock = {
      request: {
        query: UPDATE_GROUP_MUTATION,
        variables: {
          input: mockUpdateInput,
        },
      },
      result: {
        data: {
          timeTrackingUpdateGroup: null,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useUpdateGroup({ onSuccess, onError }),
      [nullResponseMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: mockUpdateInput,
        },
      });
    });

    expect(onError).toHaveBeenCalledWith('Null Response', '');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle Apollo/network errors', async () => {
    const mockUpdateInput = {
      id: 'group-123',
      version: 1,
      name: 'Engineering Team',
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const networkErrorMock = {
      request: {
        query: UPDATE_GROUP_MUTATION,
        variables: {
          input: mockUpdateInput,
        },
      },
      error: new Error('Network error occurred'),
    };

    const { result } = renderHookWithApolloProvider(
      () => useUpdateGroup({ onSuccess, onError }),
      [networkErrorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: mockUpdateInput,
        },
      });
    });

    expect(onError).toHaveBeenCalledWith('Network error occurred', '');
    expect(onSuccess).not.toHaveBeenCalled();

    // Verify customer interaction tracking
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.GROUP_UPDATE,
      'Network error occurred',
    );
  });

  it('should handle unexpected response type', async () => {
    const mockUpdateInput = {
      id: 'group-123',
      version: 1,
      name: 'Engineering Team',
    };
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const unexpectedMock = {
      request: {
        query: UPDATE_GROUP_MUTATION,
        variables: {
          input: mockUpdateInput,
        },
      },
      result: {
        data: {
          timeTrackingUpdateGroup: {
            __typename: 'UnexpectedType',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useUpdateGroup({ onSuccess, onError }),
      [unexpectedMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: mockUpdateInput,
        },
      });
    });

    expect(onError).toHaveBeenCalledWith('Unexpected response type', '');
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
