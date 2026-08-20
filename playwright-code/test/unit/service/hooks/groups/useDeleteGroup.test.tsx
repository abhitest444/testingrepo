/* eslint-disable camelcase */
import { act } from '@testing-library/react-hooks';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { aTimeTracking_DeleteGroupError } from '__mocks__/__generated__/timeTracking';
import { DELETE_GROUP_MUTATION } from 'src/js/service/queries/timeTrackingGroupMutations';
import { useDeleteGroup } from 'src/js/service/hooks/groups/useDeleteGroup';

import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

// Mock the customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  setInteractionDegraded: jest.fn(),
}));

describe('useDeleteGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the hook interface with mutation function, loading state, and error', () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [],
    );

    const { deleteGroup, isDeleting } = result.current;

    expect(deleteGroup).toBeDefined();
    expect(typeof deleteGroup).toBe('function');
    expect(isDeleting).toBe(false);
  });

  it('should handle successful group deletion', async () => {
    const mockGroupId = 'group-123';
    const mockGroupName = 'California Team';
    const mockVersion = 5;
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const successMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: {
            __typename: 'TimeTracking_DeleteGroupPayload',
            successCode: 'SUCCESS',
            group: {
              __typename: 'TimeTracking_Group',
              id: mockGroupId,
              name: mockGroupName,
              isActive: false, // Soft deleted
              meta: {
                __typename: 'TimeTracking_GroupMeta',
                createdAt: '2025-10-29T00:00:00Z',
                updatedAt: '2025-11-13T00:00:00Z',
                version: mockVersion + 1, // Version incremented after delete
              },
            },
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [successMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockGroupId,
        name: mockGroupName,
        isActive: false, // Verify it's soft deleted
      }),
    );
    expect(onError).not.toHaveBeenCalled();

    // Verify customer interaction tracking
    const {
      createCustomerInteraction,
      endInteractionWithSuccess,
    } = require('src/js/common/CustomerInteraction');

    expect(createCustomerInteraction).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_DELETE,
    );
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_DELETE,
    );
  });

  it('should handle GROUP_NOT_FOUND error', async () => {
    const mockGroupId = 'non-existent-group';
    const mockVersion = 1;
    const errorMessage = 'The group was not found';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: aTimeTracking_DeleteGroupError({
            errorCode: 'GROUP_NOT_FOUND',
            message: errorMessage,
            details: 'Group may have been already deleted',
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [errorMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      errorMessage,
      'GROUP_NOT_FOUND',
      'Group may have been already deleted',
    );

    // Verify error interaction tracking
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_DELETE,
      errorMessage,
    );
  });

  it('should handle OPTIMISTIC_LOCK_FAILURE (VERSION_MISMATCH) error', async () => {
    const mockGroupId = 'group-456';
    const mockVersion = 3;
    const errorMessage = 'The group was modified by another user';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: aTimeTracking_DeleteGroupError({
            errorCode: 'OPTIMISTIC_LOCK_FAILURE',
            message: errorMessage,
            details: 'Please refresh and try again',
            subCode: 'VERSION_MISMATCH',
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [errorMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      errorMessage,
      'OPTIMISTIC_LOCK_FAILURE',
      'Please refresh and try again',
    );
  });

  it('should handle INSUFFICIENT_PERMISSIONS error', async () => {
    const mockGroupId = 'group-789';
    const mockVersion = 2;
    const errorMessage = 'User lacks permission to delete this group';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: aTimeTracking_DeleteGroupError({
            errorCode: 'INSUFFICIENT_PERMISSIONS',
            message: errorMessage,
            details: undefined, // Explicitly set to undefined
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [errorMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      errorMessage,
      'INSUFFICIENT_PERMISSIONS',
      '',
    );
  });

  it('should handle GENERAL_ERROR', async () => {
    const mockGroupId = 'group-999';
    const mockVersion = 1;
    const errorMessage = 'An unexpected error occurred';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: aTimeTracking_DeleteGroupError({
            errorCode: 'GENERAL_ERROR',
            message: errorMessage,
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [errorMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('should handle network/Apollo errors', async () => {
    const mockGroupId = 'group-111';
    const mockVersion = 1;
    const networkError = new Error('Network request failed');
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      error: networkError,
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [errorMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
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
    const mockGroupId = 'group-222';
    const mockVersion = 1;
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const nullResponseMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: null,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [nullResponseMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Null Response', '', '');
  });

  it('should handle error response with undefined message', async () => {
    const mockGroupId = 'group-333';
    const mockVersion = 1;
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: aTimeTracking_DeleteGroupError({
            errorCode: 'GENERAL_ERROR',
            message: undefined,
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [errorMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
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
      TimeCustomerInteraction.GROUP_DELETE,
      'Delete group failed',
    );
  });

  it('should handle TSHEETS_API_ERROR', async () => {
    const mockGroupId = 'group-444';
    const mockVersion = 1;
    const errorMessage = 'TSheets API call failed during duality phase';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: aTimeTracking_DeleteGroupError({
            errorCode: 'TSHEETS_API_ERROR',
            message: errorMessage,
            details: 'Duality sync failed',
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [errorMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      errorMessage,
      'TSHEETS_API_ERROR',
      'Duality sync failed',
    );
  });

  it('should verify group isActive is set to false after deletion', async () => {
    const mockGroupId = 'group-555';
    const mockVersion = 7;
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const successMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: {
            __typename: 'TimeTracking_DeleteGroupPayload',
            successCode: 'SUCCESS',
            group: {
              __typename: 'TimeTracking_Group',
              id: mockGroupId,
              name: 'Test Group',
              isActive: false, // This is the key assertion - soft delete
              meta: {
                __typename: 'TimeTracking_GroupMeta',
                createdAt: '2025-10-01T00:00:00Z',
                updatedAt: '2025-11-13T00:00:00Z',
                version: mockVersion + 1,
              },
            },
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [successMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
      });
    });

    // Verify the group returned has isActive: false
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
      }),
    );
  });

  it('should handle degraded error with GROUP_ALREADY_INACTIVE', async () => {
    const mockGroupId = 'group-666';
    const mockVersion = 1;
    const errorMessage = 'Group is already inactive';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: aTimeTracking_DeleteGroupError({
            errorCode: 'GROUP_ALREADY_INACTIVE',
            message: errorMessage,
            details: '',
          }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [errorMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      errorMessage,
      'GROUP_ALREADY_INACTIVE',
      '',
    );

    // Verify degraded interaction tracking
    const {
      setInteractionDegraded,
    } = require('src/js/common/CustomerInteraction');
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_DELETE,
      errorMessage,
    );
  });

  it('should handle unexpected response type', async () => {
    const mockGroupId = 'group-777';
    const mockVersion = 1;
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const unexpectedResponseMock = {
      request: {
        query: DELETE_GROUP_MUTATION,
        variables: {
          input: {
            id: mockGroupId,
            version: mockVersion,
          },
        },
      },
      result: {
        data: {
          timeTrackingDeleteGroup: {
            __typename: 'UnexpectedType',
            unexpectedField: 'unexpected value',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useDeleteGroup({ onSuccess, onError }),
      [unexpectedResponseMock],
    );

    const { deleteGroup: mutate } = result.current;

    await act(async () => {
      await mutate({
        groupId: mockGroupId,
        version: mockVersion,
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Unexpected response type', '', '');
  });
});
