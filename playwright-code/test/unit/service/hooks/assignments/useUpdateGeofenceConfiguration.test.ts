import { renderHook, act } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';

import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { useUpdateGeofenceConfigurationMutation } from 'src/__generated__/timeTracking/graphql';
import { useUpdateGeofenceConfiguration } from 'src/js/service/hooks/assignments';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const mockSandbox = { logger: mockLogger };

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => mockSandbox),
}));
jest.mock('src/js/service/AssignmentApolloClient', () => ({
  getAssignmentApolloClient: jest.fn(() => ({})),
}));
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({
    'x-trace': 'mock',
  })),
  TimeCustomerInteraction: {
    GEOFENCE_CONFIGURATION_UPDATE: 'geofence-configuration-update',
  },
}));
jest.mock('src/__generated__/timeTracking/graphql', () => ({
  useUpdateGeofenceConfigurationMutation: jest.fn(),
}));

const mockUseUpdateGeofenceConfigurationMutation =
  useUpdateGeofenceConfigurationMutation as jest.MockedFunction<
    typeof useUpdateGeofenceConfigurationMutation
  >;

describe('useUpdateGeofenceConfiguration', () => {
  const mockMutate = jest.fn();
  const defaultMutationResult = {
    data: undefined,
    loading: false,
    called: false,
    error: undefined,
    reset: jest.fn(),
    client: {} as any,
  };

  let capturedOnCompleted: ((data: any) => void) | undefined;
  let capturedOnError: ((error: ApolloError) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnCompleted = undefined;
    capturedOnError = undefined;

    mockUseUpdateGeofenceConfigurationMutation.mockImplementation(
      (options: any) => {
        capturedOnCompleted = options?.onCompleted;
        capturedOnError = options?.onError;
        return [mockMutate, defaultMutationResult] as any;
      },
    );
  });

  it('should return a mutation function and result tuple', () => {
    const { result } = renderHook(() => useUpdateGeofenceConfiguration());

    expect(result.current).toHaveLength(2);
    expect(typeof result.current[0]).toBe('function');
    expect(result.current[1]).toBe(defaultMutationResult);
  });

  it('should pass the assignment client to the mutation hook', () => {
    renderHook(() => useUpdateGeofenceConfiguration());

    expect(mockUseUpdateGeofenceConfigurationMutation).toHaveBeenCalledWith(
      expect.objectContaining({ client: expect.any(Object) }),
    );
  });

  describe('wrappedMutationFunction', () => {
    it('should create a customer interaction when called with options', () => {
      const { result } = renderHook(() => useUpdateGeofenceConfiguration());

      const options = {
        variables: {
          input: {
            timeAgainst: { customerId: 'cust-123' },
            geofenceEnabled: { value: true, version: 'v1' },
          },
        },
      };

      act(() => {
        result.current[0](options as any);
      });

      expect(createCustomerInteraction).toHaveBeenCalledWith(
        mockSandbox,
        'geofence-configuration-update',
      );
    });

    it('should merge propagation headers into the mutation context', () => {
      const { result } = renderHook(() => useUpdateGeofenceConfiguration());

      const options = {
        variables: {
          input: {
            timeAgainst: { customerId: 'cust-123' },
            geofenceEnabled: { value: false, version: 'v1' },
          },
        },
        context: {
          headers: { 'x-custom': 'existing' },
        },
      };

      act(() => {
        result.current[0](options as any);
      });

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: options.variables,
          context: {
            headers: {
              'x-custom': 'existing',
              'x-trace': 'mock',
            },
          },
        }),
      );
    });

    it('should call mutationFunction without args when no options are provided', () => {
      const { result } = renderHook(() => useUpdateGeofenceConfiguration());

      act(() => {
        result.current[0]();
      });

      expect(createCustomerInteraction).toHaveBeenCalled();
      expect(mockMutate).toHaveBeenCalledWith();
    });

    it('should handle options with no existing context', () => {
      const { result } = renderHook(() => useUpdateGeofenceConfiguration());

      const options = {
        variables: {
          input: {
            timeAgainst: { customerId: 'cust-456' },
            geofenceEnabled: { value: true, version: 'v2' },
          },
        },
      };

      act(() => {
        result.current[0](options as any);
      });

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          context: {
            headers: { 'x-trace': 'mock' },
          },
        }),
      );
    });
  });

  describe('onCompleted handler', () => {
    it('should call onSuccess and end interaction on successful payload', () => {
      const onSuccess = jest.fn();
      renderHook(() => useUpdateGeofenceConfiguration({ onSuccess }));

      act(() => {
        capturedOnCompleted?.({
          timeTrackingUpdateGeofenceConfiguration: {
            __typename: 'TimeTracking_UpdateGeofenceConfigurationPayload',
            successCode: 'OK',
            geofenceConfiguration: {},
          },
        });
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=useUpdateGeofenceConfiguration Event=Successfully updated geofence configuration',
      );
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        mockSandbox,
        'geofence-configuration-update',
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError with server message on error response', () => {
      const onError = jest.fn();
      renderHook(() => useUpdateGeofenceConfiguration({ onError }));

      act(() => {
        capturedOnCompleted?.({
          timeTrackingUpdateGeofenceConfiguration: {
            __typename: 'TimeTracking_UpdateGeofenceConfigurationError',
            errorCode: 'SOME_ERROR',
            message: 'Version conflict',
          },
        });
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component=useUpdateGeofenceConfiguration Event=Error updating geofence configuration: Version conflict',
        { error: undefined },
      );
      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        'geofence-configuration-update',
        'Version conflict',
      );
      expect(onError).toHaveBeenCalledWith('Version conflict');
    });

    it('should fall back to default error message when server message is null', () => {
      const onError = jest.fn();
      renderHook(() => useUpdateGeofenceConfiguration({ onError }));

      act(() => {
        capturedOnCompleted?.({
          timeTrackingUpdateGeofenceConfiguration: {
            __typename: 'TimeTracking_UpdateGeofenceConfigurationError',
            errorCode: 'UNKNOWN',
            message: null,
          },
        });
      });

      expect(onError).toHaveBeenCalledWith(
        'Failed to update geofence configuration',
      );
    });

    it('should handle null response', () => {
      const onError = jest.fn();
      renderHook(() => useUpdateGeofenceConfiguration({ onError }));

      act(() => {
        capturedOnCompleted?.({
          timeTrackingUpdateGeofenceConfiguration: null,
        });
      });

      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        'geofence-configuration-update',
        'Failed to update geofence configuration',
      );
      expect(onError).toHaveBeenCalledWith(
        'Failed to update geofence configuration',
      );
    });
  });

  describe('onError handler (Apollo error)', () => {
    it('should call onError and end interaction with failure on ApolloError', () => {
      const onError = jest.fn();
      renderHook(() => useUpdateGeofenceConfiguration({ onError }));

      const apolloError = new ApolloError({ errorMessage: 'Network failure' });

      act(() => {
        capturedOnError?.(apolloError);
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component=useUpdateGeofenceConfiguration Event=Error updating geofence configuration: Network failure',
        { error: apolloError },
      );
      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        'geofence-configuration-update',
        'Network failure',
      );
      expect(onError).toHaveBeenCalledWith('Network failure');
    });

    it('should use default error message when ApolloError has empty message', () => {
      const onError = jest.fn();
      renderHook(() => useUpdateGeofenceConfiguration({ onError }));

      const apolloError = new ApolloError({});
      apolloError.message = '';

      act(() => {
        capturedOnError?.(apolloError);
      });

      expect(onError).toHaveBeenCalledWith(
        'Failed to update geofence configuration',
      );
    });
  });

  describe('default arguments', () => {
    it('should work without any arguments', () => {
      const { result } = renderHook(() => useUpdateGeofenceConfiguration());

      expect(result.current).toHaveLength(2);
    });

    it('should not throw when onSuccess/onError are not provided on completed', () => {
      renderHook(() => useUpdateGeofenceConfiguration());

      expect(() => {
        act(() => {
          capturedOnCompleted?.({
            timeTrackingUpdateGeofenceConfiguration: {
              __typename: 'TimeTracking_UpdateGeofenceConfigurationPayload',
              successCode: 'OK',
              geofenceConfiguration: {},
            },
          });
        });
      }).not.toThrow();
    });

    it('should not throw when onSuccess/onError are not provided on error', () => {
      renderHook(() => useUpdateGeofenceConfiguration());

      expect(() => {
        act(() => {
          capturedOnCompleted?.({
            timeTrackingUpdateGeofenceConfiguration: {
              __typename: 'TimeTracking_UpdateGeofenceConfigurationError',
              errorCode: 'ERR',
              message: 'oops',
            },
          });
        });
      }).not.toThrow();
    });
  });
});
