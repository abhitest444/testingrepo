import { renderHook } from '@testing-library/react-hooks';
import { useGeofenceRadius } from 'src/js/service/hooks/assignments/useGeofenceRadius';
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

const mockLoadQuery = jest.fn();

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
    GEOFENCE_RADIUS_READ: 'geofence-radius-read',
  },
}));
jest.mock('src/__generated__/timeTracking/graphql', () => ({
  useGetGeofenceRadiusLazyQuery: jest.fn(),
}));

const mockUseGetGeofenceRadiusLazyQuery =
  require('src/__generated__/timeTracking/graphql')
    .useGetGeofenceRadiusLazyQuery as jest.MockedFunction<
    typeof import('src/__generated__/timeTracking/graphql').useGetGeofenceRadiusLazyQuery
  >;

describe('useGeofenceRadius', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseGetGeofenceRadiusLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: null,
        loading: false,
        error: undefined,
      } as any,
    ]);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGeofenceRadius());

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.loadGeofenceRadius).toBe('function');
  });

  it('should call loadQuery with correct variables and headers when loadGeofenceRadius is invoked', () => {
    const { result } = renderHook(() => useGeofenceRadius());

    const args = {
      input: { placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' },
    };

    result.current.loadGeofenceRadius(args);

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: { input: args.input },
      context: {
        headers: { 'x-trace': 'mock' },
      },
    });
  });

  it('should create a customer interaction before loading', () => {
    const { result } = renderHook(() => useGeofenceRadius());

    result.current.loadGeofenceRadius({
      input: { placeId: 'place-123' },
    });

    expect(createCustomerInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ logger: mockLogger }),
      'geofence-radius-read',
    );
    expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
      expect.objectContaining({ logger: mockLogger }),
      'geofence-radius-read',
    );
  });

  it('should transform timeTrackingGeofenceRadius into result shape', () => {
    const mockData = {
      timeTrackingGeofenceRadius: {
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        geofenceRadiusInMeter: 150,
      },
    };

    mockUseGetGeofenceRadiusLazyQuery.mockReturnValue([
      mockLoadQuery,
      { data: mockData, loading: false, error: undefined } as any,
    ]);

    const { result } = renderHook(() => useGeofenceRadius());

    expect(result.current.data).toEqual({
      placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      geofenceRadiusInMeter: 150,
    });
  });

  it('should return null data when timeTrackingGeofenceRadius is missing', () => {
    mockUseGetGeofenceRadiusLazyQuery.mockReturnValue([
      mockLoadQuery,
      { data: {}, loading: false, error: undefined } as any,
    ]);

    const { result } = renderHook(() => useGeofenceRadius());

    expect(result.current.data).toBe(null);
  });

  it('should return null data when data is null', () => {
    mockUseGetGeofenceRadiusLazyQuery.mockReturnValue([
      mockLoadQuery,
      { data: null, loading: false, error: undefined } as any,
    ]);

    const { result } = renderHook(() => useGeofenceRadius());

    expect(result.current.data).toBe(null);
  });

  it('should reflect loading state', () => {
    mockUseGetGeofenceRadiusLazyQuery.mockReturnValue([
      mockLoadQuery,
      { data: null, loading: true, error: undefined } as any,
    ]);

    const { result } = renderHook(() => useGeofenceRadius());

    expect(result.current.loading).toBe(true);
  });

  it('should expose error message', () => {
    const errorMessage = 'Failed to fetch geofence radius';

    mockUseGetGeofenceRadiusLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: null,
        loading: false,
        error: { message: errorMessage } as any,
      } as any,
    ]);

    const { result } = renderHook(() => useGeofenceRadius());

    expect(result.current.error).toBe(errorMessage);
  });

  it('should pass client and options to useGetGeofenceRadiusLazyQuery', () => {
    const mockClient = {};
    const {
      getAssignmentApolloClient,
    } = require('src/js/service/AssignmentApolloClient');
    (getAssignmentApolloClient as jest.Mock).mockReturnValue(mockClient);

    renderHook(() => useGeofenceRadius());

    expect(mockUseGetGeofenceRadiusLazyQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
      }),
    );
  });

  describe('CustomerInteraction lifecycle', () => {
    it('should end interaction with success on completed query', () => {
      let onCompletedCallback: ((data: any) => void) | undefined;

      mockUseGetGeofenceRadiusLazyQuery.mockImplementation((options) => {
        onCompletedCallback = options?.onCompleted;
        return [
          mockLoadQuery,
          { data: null, loading: false, error: undefined } as any,
        ];
      });

      renderHook(() => useGeofenceRadius());

      onCompletedCallback?.({});

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=useGeofenceRadius Event=Successfully fetched geofence radius',
      );
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ logger: mockLogger }),
        'geofence-radius-read',
      );
    });

    it('should set interaction degraded on query error', () => {
      let onErrorCallback: ((error: any) => void) | undefined;

      mockUseGetGeofenceRadiusLazyQuery.mockImplementation((options) => {
        onErrorCallback = options?.onError;
        return [
          mockLoadQuery,
          { data: null, loading: false, error: undefined } as any,
        ];
      });

      renderHook(() => useGeofenceRadius());

      const apolloError = new Error('Network error');
      onErrorCallback?.(apolloError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component=useGeofenceRadius Event=Error fetching geofence radius (degraded: user can still set radius manually)',
        { error: 'Network error', errorCode: 'Network error' },
      );
      expect(setInteractionDegraded).toHaveBeenCalledWith(
        expect.objectContaining({ logger: mockLogger }),
        'geofence-radius-read',
        'Network error',
      );
    });

    it('should use Unknown degraded error when error message is missing', () => {
      let onErrorCallback: ((error: any) => void) | undefined;

      mockUseGetGeofenceRadiusLazyQuery.mockImplementation((options) => {
        onErrorCallback = options?.onError;
        return [
          mockLoadQuery,
          { data: null, loading: false, error: undefined } as any,
        ];
      });

      renderHook(() => useGeofenceRadius());

      onErrorCallback?.({ message: undefined });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        expect.objectContaining({ logger: mockLogger }),
        'geofence-radius-read',
        'Unknown degraded error',
      );
    });
  });
});
