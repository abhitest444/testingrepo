import { renderHook } from '@testing-library/react-hooks';
import { useGetGeofenceConfigurationLazyQuery } from 'src/__generated__/timeTracking/graphql';
import { useGeofenceConfiguration } from 'src/js/service/hooks/assignments/useGeofenceConfiguration';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  setInteractionDegraded,
} from 'src/js/common/CustomerInteraction';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

// Mock the generated hook directly so the test boundary matches the production import.
jest.mock('src/__generated__/timeTracking/graphql');
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({
    logger: mockLogger,
  })),
}));
jest.mock('src/js/service/AssignmentApolloClient', () => ({
  getAssignmentApolloClient: jest.fn(() => ({})),
}));
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({
    'x-trace': 'mock',
  })),
  setInteractionDegraded: jest.fn(),
  TimeCustomerInteraction: {
    GEOFENCE_CONFIGURATION_READ: 'geofence-configuration-read',
  },
}));

const mockUseLazyQuery =
  useGetGeofenceConfigurationLazyQuery as jest.MockedFunction<
    typeof useGetGeofenceConfigurationLazyQuery
  >;

describe('useGeofenceConfiguration', () => {
  const mockLoadQuery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: null,
        loading: false,
        error: undefined,
      } as any,
    ]);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGeofenceConfiguration());

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(result.current.pageInfo).toBe(null);
    expect(typeof result.current.loadGeofenceConfiguration).toBe('function');
  });

  it('should call loadQuery with correct variables and headers', () => {
    const { result } = renderHook(() => useGeofenceConfiguration());

    const args = {
      input: {
        timeAgainstList: [
          { projectId: 'proj-1', customerId: 'cust-1' },
          { customerId: 'cust-2' },
        ],
      },
    };

    result.current.loadGeofenceConfiguration(args);

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: { input: args.input },
      context: {
        headers: { 'x-trace': 'mock' },
      },
    });
  });

  it('should create a customer interaction before loading', () => {
    const { result } = renderHook(() => useGeofenceConfiguration());

    result.current.loadGeofenceConfiguration({
      input: { timeAgainstList: [{ projectId: 'proj-1' }] },
    });

    expect(createCustomerInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ logger: mockLogger }),
      'geofence-configuration-read',
    );
    expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
      expect.objectContaining({ logger: mockLogger }),
      'geofence-configuration-read',
    );
  });

  it('should transform edge nodes into flat data array', () => {
    const mockData = {
      timeTrackingGeofenceConfiguration: {
        edges: [
          {
            node: {
              timeAgainstContactDAS: {
                project: { id: 'proj-1' },
                customer: { id: 'cust-1' },
              },
              geofenceEnabled: {
                meta: { version: '1' },
                value: true,
              },
              geofenceLocation: {
                meta: { version: '1' },
                latitude: 37.7749,
                longitude: -122.4194,
                geofenceRadiusInMeter: 100,
              },
            },
          },
          {
            node: {
              timeAgainstContactDAS: {
                customer: { id: 'cust-2' },
              },
              geofenceEnabled: {
                value: false,
              },
              geofenceLocation: null,
            },
          },
        ],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'cursor-start',
          endCursor: 'cursor-end',
        },
      },
    };

    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      { data: mockData, loading: false, error: undefined } as any,
    ]);

    const { result } = renderHook(() => useGeofenceConfiguration());

    expect(result.current.data).toEqual([
      mockData.timeTrackingGeofenceConfiguration.edges[0].node,
      mockData.timeTrackingGeofenceConfiguration.edges[1].node,
    ]);
  });

  it('should transform pageInfo correctly', () => {
    const mockData = {
      timeTrackingGeofenceConfiguration: {
        edges: [],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'start-abc',
          endCursor: 'end-xyz',
        },
      },
    };

    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      { data: mockData, loading: false, error: undefined } as any,
    ]);

    const { result } = renderHook(() => useGeofenceConfiguration());

    expect(result.current.pageInfo).toEqual({
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: 'start-abc',
      endCursor: 'end-xyz',
    });
  });

  it('should default null cursors to undefined in pageInfo', () => {
    const mockData = {
      timeTrackingGeofenceConfiguration: {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      },
    };

    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      { data: mockData, loading: false, error: undefined } as any,
    ]);

    const { result } = renderHook(() => useGeofenceConfiguration());

    expect(result.current.pageInfo).toEqual({
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: undefined,
      endCursor: undefined,
    });
  });

  it('should handle empty edges', () => {
    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: {
          timeTrackingGeofenceConfiguration: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
          },
        },
        loading: false,
        error: undefined,
      } as any,
    ]);

    const { result } = renderHook(() => useGeofenceConfiguration());

    expect(result.current.data).toEqual([]);
  });

  it('should handle null data gracefully', () => {
    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      { data: null, loading: false, error: undefined } as any,
    ]);

    const { result } = renderHook(() => useGeofenceConfiguration());

    expect(result.current.data).toEqual([]);
    expect(result.current.pageInfo).toBe(null);
  });

  it('should reflect loading state', () => {
    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      { data: null, loading: true, error: undefined } as any,
    ]);

    const { result } = renderHook(() => useGeofenceConfiguration());

    expect(result.current.loading).toBe(true);
  });

  it('should expose error message', () => {
    const errorMessage = 'Failed to fetch geofence configuration';

    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: null,
        loading: false,
        error: { message: errorMessage } as any,
      } as any,
    ]);

    const { result } = renderHook(() => useGeofenceConfiguration());

    expect(result.current.error).toBe(errorMessage);
  });

  describe('CustomerInteraction lifecycle', () => {
    it('should end interaction with success on completed query', () => {
      let onCompletedCallback: ((data: any) => void) | undefined;

      mockUseLazyQuery.mockImplementation((options) => {
        onCompletedCallback = options?.onCompleted;
        return [
          mockLoadQuery,
          { data: null, loading: false, error: undefined } as any,
        ];
      });

      renderHook(() => useGeofenceConfiguration());

      onCompletedCallback?.({});

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=useGeofenceConfiguration Event=Successfully fetched geofence configuration',
      );
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ logger: mockLogger }),
        'geofence-configuration-read',
      );
    });

    it('should end interaction with failure on query error', () => {
      let onErrorCallback: ((error: any) => void) | undefined;

      mockUseLazyQuery.mockImplementation((options) => {
        onErrorCallback = options?.onError;
        return [
          mockLoadQuery,
          { data: null, loading: false, error: undefined } as any,
        ];
      });

      renderHook(() => useGeofenceConfiguration());

      const apolloError = new Error('Network error');
      onErrorCallback?.(apolloError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component=useGeofenceConfiguration Event=Error fetching geofence configuration (degraded: user can still edit in drawer)',
        { error: 'Network error', errorCode: 'Network error' },
      );
      expect(setInteractionDegraded).toHaveBeenCalledWith(
        expect.objectContaining({ logger: mockLogger }),
        'geofence-configuration-read',
        'Network error',
      );
    });
  });
});
