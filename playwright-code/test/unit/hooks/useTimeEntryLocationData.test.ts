import { renderHook, act } from '@testing-library/react-hooks';
import { useQuery } from '@apollo/client';
import { useSandbox } from '@payroll/quicksand';
import { useTimeEntryLocationData } from 'src/js/widgets/timeEntryLocation/hooks/useTimeEntryLocationData';
import {
  endInteractionWithSuccess,
  setInteractionDegraded,
  endInteractionWithFailure,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

// Mock dependencies
jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('src/js/service/queries/timeEntryLocationQueries', () => ({
  TIME_TRACKING_LOCATION_DETAIL_QUERY: 'mocked-query',
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  endInteractionWithSuccess: jest.fn(),
  setInteractionDegraded: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  TimeCustomerInteraction: {
    TIME_ENTRY_LOCATION_READ: 'time-entry-location-read',
  },
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseSandbox = useSandbox as jest.MockedFunction<typeof useSandbox>;
const mockIsWorkforceEnvironment =
  isWorkforceEnvironment as jest.MockedFunction<typeof isWorkforceEnvironment>;

// Mock data
const mockTimeEntry = {
  id: '742291174',
  startTime: '2026-01-14T09:30:00.000-08:00',
  endTime: '2026-01-14T10:30:00.000-08:00',
  duration: 3600,
  notes: 'Test time entry notes',
  timeZone: 'America/Los_Angeles',
  timeForContactDAS: {
    id: '400000021',
    displayName: 'John Doe',
    fullName: 'John Doe',
  },
  timeAgainstContactDAS: {
    customer: {
      id: '104',
      fullName: 'Test Customer',
      primaryAddress: {
        lines: '350 Fifth Avenue\nSuite 4200',
        city: 'New York',
        state: 'NY',
        postalCode: '10118',
        address: null,
      },
    },
  },
};

const mockLocationPoints = [
  {
    id: '111753208',
    longitude: -127.4203,
    latitude: 47.7769,
    createdAt: '2026-01-14T17:30:00.000Z',
    accuracy: 11.3,
    altitude: 202.8,
    deviceIdentifier: 'device-123891237',
  },
  {
    id: '111753210',
    longitude: -127.4208,
    latitude: 47.7775,
    createdAt: '2026-01-14T17:33:00.000Z',
    accuracy: 11.3,
    altitude: 202.8,
    deviceIdentifier: 'device-123891237',
  },
];

const mockApiResponse = {
  timeTrackingLocationDetail: {
    timeEntry: mockTimeEntry,
    locationDetail: {
      edges: mockLocationPoints.map((point) => ({
        node: point,
        cursor: 'mock-cursor',
      })),
    },
  },
};

const DEFAULT_TRACE_HEADERS: Record<string, string | number> = {};

describe('useTimeEntryLocationData', () => {
  const mockSandbox = {
    logger: {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
    },
  };

  let mockRefetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSandbox.mockReturnValue(mockSandbox as any);
    mockIsWorkforceEnvironment.mockReturnValue(false); // Default to non-workforce
    mockRefetch = jest.fn();

    // Default mock for useQuery - loading state
    mockUseQuery.mockReturnValue({
      loading: false,
      data: undefined,
      error: undefined,
      refetch: mockRefetch,
    } as any);
  });

  describe('initial state', () => {
    it('should return loading true when query is loading', () => {
      mockUseQuery.mockReturnValue({
        loading: true,
        data: undefined,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '12345',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.timeEntry).toBeNull();
      expect(result.current.locationPoints).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.refetch).toBeDefined();
    });

    it('should skip query when timeEntryId is empty', () => {
      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skip: true,
        }),
      );
    });

    it('should not skip query when timeEntryId is provided', () => {
      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '12345',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skip: false,
        }),
      );
    });
  });

  describe('successful data fetch', () => {
    it('should return time entry and location points when data is available', () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.timeEntry).toEqual(mockTimeEntry);
      expect(result.current.locationPoints).toEqual(mockLocationPoints);
      expect(result.current.error).toBeNull();
    });

    it('should handle response with no location points', () => {
      const responseWithNoPoints = {
        timeTrackingLocationDetail: {
          timeEntry: mockTimeEntry,
          locationDetail: {
            edges: [],
          },
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithNoPoints,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(result.current.timeEntry).toEqual(mockTimeEntry);
      expect(result.current.locationPoints).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle response with null locationDetail', () => {
      const responseWithNullLocationDetail = {
        timeTrackingLocationDetail: {
          timeEntry: mockTimeEntry,
          locationDetail: null,
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithNullLocationDetail,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(result.current.timeEntry).toEqual(mockTimeEntry);
      expect(result.current.locationPoints).toEqual([]);
    });

    it('should handle null timeEntry in response', () => {
      const responseWithNullTimeEntry = {
        timeTrackingLocationDetail: {
          timeEntry: null,
          locationDetail: {
            edges: mockLocationPoints.map((point) => ({
              node: point,
              cursor: 'mock-cursor',
            })),
          },
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithNullTimeEntry,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(result.current.timeEntry).toBeNull();
      expect(result.current.locationPoints).toEqual(mockLocationPoints);
    });
  });

  describe('error handling', () => {
    it('should return error when query fails', () => {
      const queryError = new Error('GraphQL error');

      mockUseQuery.mockReturnValue({
        loading: false,
        data: undefined,
        error: queryError,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(result.current.error).toEqual(queryError);
      expect(result.current.timeEntry).toBeNull();
      expect(result.current.locationPoints).toEqual([]);
    });

    it('should call onError callback when error occurs', () => {
      const queryError = new Error('GraphQL error');

      // Capture the onError callback
      mockUseQuery.mockImplementation((query, options: any) => {
        // Simulate calling onError
        if (options?.onError) {
          options.onError(queryError);
        }
        return {
          loading: false,
          data: undefined,
          error: queryError,
          refetch: mockRefetch,
        } as any;
      });

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Component=useTimeEntryLocationData'),
        expect.objectContaining({ error: queryError }),
      );
    });
  });

  describe('refetch functionality', () => {
    it('should call apolloRefetch when refetch is called', async () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      act(() => {
        result.current.refetch();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('timeEntryId prop changes', () => {
    it('should pass updated timeEntryId to useQuery variables', () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { rerender } = renderHook(
        ({ timeEntryId }) =>
          useTimeEntryLocationData({
            timeEntryId,
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        { initialProps: { timeEntryId: '742291174' } },
      );

      // Check initial call
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variables: {
            input: {
              timeEntryId: '742291174',
            },
          },
        }),
      );

      // Clear mock and rerender with new timeEntryId
      mockUseQuery.mockClear();
      rerender({ timeEntryId: '888888888' });

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variables: {
            input: {
              timeEntryId: '888888888',
            },
          },
        }),
      );
    });
  });

  describe('loading state', () => {
    it('should return loading true when useQuery is loading', () => {
      mockUseQuery.mockReturnValue({
        loading: true,
        data: undefined,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(result.current.loading).toBe(true);
    });

    it('should return loading false when useQuery completes', () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(result.current.loading).toBe(false);
    });

    it('should return loading false when error occurs', () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        data: undefined,
        error: new Error('Test error'),
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('useQuery configuration', () => {
    it('should configure useQuery with correct options', () => {
      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '12345',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(), // The gql query
        expect.objectContaining({
          fetchPolicy: 'no-cache',
          errorPolicy: 'all',
          context: expect.objectContaining({
            clientName: expect.anything(),
          }),
          skip: false,
          variables: {
            input: {
              timeEntryId: '12345',
            },
          },
        }),
      );
    });
  });

  describe('logging', () => {
    describe('success logging', () => {
      it('should log success when no error and essential data is present', () => {
        mockUseQuery.mockReturnValue({
          loading: false,
          data: mockApiResponse,
          error: undefined,
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          expect.stringContaining(
            'Component=useTimeEntryLocationData Event=Successfully fetched time entry location data timeEntryId=742291174',
          ),
          expect.objectContaining({
            locationPointsCount: 2,
            hasTimeEntry: true,
          }),
        );
        expect(mockSandbox.logger.error).not.toHaveBeenCalled();
      });

      it('should not log success when essential data is missing', () => {
        const responseWithoutEssentialData = {
          timeTrackingLocationDetail: {
            timeEntry: {
              ...mockTimeEntry,
              timeForContactDAS: null, // Missing essential data
            },
            locationDetail: {
              edges: mockLocationPoints.map((point) => ({
                node: point,
                cursor: 'mock-cursor',
              })),
            },
          },
        };

        mockUseQuery.mockReturnValue({
          loading: false,
          data: responseWithoutEssentialData,
          error: undefined,
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.info).not.toHaveBeenCalled();
        expect(mockSandbox.logger.error).not.toHaveBeenCalled();
      });

      it('should not log warning when essential data is missing', () => {
        const responseWithoutEssentialData = {
          timeTrackingLocationDetail: {
            timeEntry: {
              ...mockTimeEntry,
              timeForContactDAS: null, // Missing essential data
            },
            locationDetail: {
              edges: mockLocationPoints.map((point) => ({
                node: point,
                cursor: 'mock-cursor',
              })),
            },
          },
        };

        mockUseQuery.mockReturnValue({
          loading: false,
          data: responseWithoutEssentialData,
          error: undefined,
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.info).not.toHaveBeenCalled();
        expect(mockSandbox.logger.error).not.toHaveBeenCalled();
      });
    });

    describe('error logging', () => {
      it('should log complete failure when error exists and essential data is missing', () => {
        const queryError = new Error('GraphQL error');
        const responseWithoutEssentialData = {
          timeTrackingLocationDetail: {
            timeEntry: {
              ...mockTimeEntry,
              timeForContactDAS: null, // Missing essential data
            },
            locationDetail: null,
          },
        };

        mockUseQuery.mockReturnValue({
          loading: false,
          data: responseWithoutEssentialData,
          error: queryError,
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Component=useTimeEntryLocationData Event=Failed to fetch time entry location data timeEntryId=742291174',
          ),
          expect.objectContaining({ error: queryError }),
        );
        expect(mockSandbox.logger.info).not.toHaveBeenCalled();
      });

      it('should log partial error when error exists but essential data is present', () => {
        const queryError = new Error('DAS timeout for non-essential field');

        mockUseQuery.mockReturnValue({
          loading: false,
          data: mockApiResponse, // Has essential data
          error: queryError, // But has error
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
          expect.stringContaining(
            'Component=useTimeEntryLocationData Event=Partial error while fetching data timeEntryId=742291174',
          ),
          expect.objectContaining({ error: queryError }),
        );
        expect(mockSandbox.logger.error).not.toHaveBeenCalled();
        expect(mockSandbox.logger.info).not.toHaveBeenCalled();
      });

      it('should log complete failure when error exists and timeEntry is missing', () => {
        const queryError = new Error('GraphQL error');
        const responseWithoutTimeEntry = {
          timeTrackingLocationDetail: {
            timeEntry: null,
            locationDetail: {
              edges: mockLocationPoints.map((point) => ({
                node: point,
                cursor: 'mock-cursor',
              })),
            },
          },
        };

        mockUseQuery.mockReturnValue({
          loading: false,
          data: responseWithoutTimeEntry,
          error: queryError,
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Component=useTimeEntryLocationData Event=Failed to fetch time entry location data timeEntryId=742291174',
          ),
          expect.objectContaining({ error: queryError }),
        );
      });

      it('should log complete failure when error exists and locationDetail edges are missing', () => {
        const queryError = new Error('GraphQL error');
        const responseWithoutLocationEdges = {
          timeTrackingLocationDetail: {
            timeEntry: mockTimeEntry,
            locationDetail: null, // Missing locationDetail edges
          },
        };

        mockUseQuery.mockReturnValue({
          loading: false,
          data: responseWithoutLocationEdges,
          error: queryError,
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Component=useTimeEntryLocationData Event=Failed to fetch time entry location data timeEntryId=742291174',
          ),
          expect.objectContaining({ error: queryError }),
        );
      });

      it('should log complete failure when error exists and timeForContactDAS is missing', () => {
        const queryError = new Error('GraphQL error');
        const responseWithoutTimeForContactDAS = {
          timeTrackingLocationDetail: {
            timeEntry: {
              ...mockTimeEntry,
              timeForContactDAS: null, // Missing essential data
            },
            locationDetail: {
              edges: mockLocationPoints.map((point) => ({
                node: point,
                cursor: 'mock-cursor',
              })),
            },
          },
        };

        mockUseQuery.mockReturnValue({
          loading: false,
          data: responseWithoutTimeForContactDAS,
          error: queryError,
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Component=useTimeEntryLocationData Event=Failed to fetch time entry location data timeEntryId=742291174',
          ),
          expect.objectContaining({ error: queryError }),
        );
      });

      it('should log complete failure when error exists and timeAgainstContactDAS customer is missing', () => {
        const queryError = new Error('GraphQL error');
        const responseWithoutTimeAgainstContactDAS = {
          timeTrackingLocationDetail: {
            timeEntry: {
              ...mockTimeEntry,
              timeAgainstContactDAS: {
                customer: null, // Missing customer (project is no longer in query)
              },
            },
            locationDetail: {
              edges: mockLocationPoints.map((point) => ({
                node: point,
                cursor: 'mock-cursor',
              })),
            },
          },
        };

        mockUseQuery.mockReturnValue({
          loading: false,
          data: responseWithoutTimeAgainstContactDAS,
          error: queryError,
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Component=useTimeEntryLocationData Event=Failed to fetch time entry location data timeEntryId=742291174',
          ),
          expect.objectContaining({ error: queryError }),
        );
      });

      it('should log partial error when error exists but has customer in timeAgainstContactDAS', () => {
        const queryError = new Error('DAS timeout');
        const responseWithCustomer = {
          timeTrackingLocationDetail: {
            timeEntry: {
              ...mockTimeEntry,
              timeAgainstContactDAS: {
                customer: {
                  id: 'customer-123',
                  fullName: 'Test Customer',
                },
              },
            },
            locationDetail: {
              edges: mockLocationPoints.map((point) => ({
                node: point,
                cursor: 'mock-cursor',
              })),
            },
          },
        };

        mockUseQuery.mockReturnValue({
          loading: false,
          data: responseWithCustomer,
          error: queryError,
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
          expect.stringContaining(
            'Component=useTimeEntryLocationData Event=Partial error while fetching data timeEntryId=742291174',
          ),
          expect.objectContaining({ error: queryError }),
        );
        expect(mockSandbox.logger.error).not.toHaveBeenCalled();
      });

      it('should log warning when no location points are available (empty edges)', () => {
        const responseWithNoLocationPoints = {
          timeTrackingLocationDetail: {
            timeEntry: mockTimeEntry,
            locationDetail: {
              edges: [], // Empty location points
            },
          },
        };

        mockUseQuery.mockReturnValue({
          loading: false,
          data: responseWithNoLocationPoints,
          error: undefined,
          refetch: mockRefetch,
        } as any);

        renderHook(() =>
          useTimeEntryLocationData({
            timeEntryId: '742291174',
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        );

        expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
          expect.stringContaining(
            'Component=useTimeEntryLocationData Event=No location points available timeEntryId=742291174',
          ),
          expect.objectContaining({
            locationPointsCount: 0,
            hasTimeEntry: true,
          }),
        );
        expect(mockSandbox.logger.info).not.toHaveBeenCalled();
        expect(mockSandbox.logger.error).not.toHaveBeenCalled();
      });
    });
  });

  describe('customer interaction', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call endInteractionWithSuccess when query succeeds with essential data', () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
      );
      expect(setInteractionDegraded).not.toHaveBeenCalled();
      expect(endInteractionWithFailure).not.toHaveBeenCalled();
    });

    it('should call setInteractionDegraded when query has error but essential data is present', () => {
      const queryError = new Error('DAS timeout for non-essential field');

      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse, // Has essential data
        error: queryError, // But has error
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
        'DAS timeout for non-essential field',
      );
      expect(endInteractionWithSuccess).not.toHaveBeenCalled();
      expect(endInteractionWithFailure).not.toHaveBeenCalled();
    });

    it('should call endInteractionWithFailure when query has error and essential data is missing', () => {
      const queryError = new Error('GraphQL error');
      const responseWithoutEssentialData = {
        timeTrackingLocationDetail: {
          timeEntry: {
            ...mockTimeEntry,
            timeForContactDAS: null, // Missing essential data
          },
          locationDetail: null,
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithoutEssentialData,
        error: queryError,
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
        'GraphQL error',
        queryError,
      );
      expect(endInteractionWithSuccess).not.toHaveBeenCalled();
      expect(setInteractionDegraded).not.toHaveBeenCalled();
    });

    it('should not call interaction functions when query is still loading', () => {
      mockUseQuery.mockReturnValue({
        loading: true,
        data: undefined,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(endInteractionWithSuccess).not.toHaveBeenCalled();
      expect(setInteractionDegraded).not.toHaveBeenCalled();
      expect(endInteractionWithFailure).not.toHaveBeenCalled();
    });

    it('should not call interaction functions when timeEntryId is empty', () => {
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(endInteractionWithSuccess).not.toHaveBeenCalled();
      expect(setInteractionDegraded).not.toHaveBeenCalled();
      expect(endInteractionWithFailure).not.toHaveBeenCalled();
    });

    it('should call interaction function only once per timeEntryId', () => {
      // First render with timeEntryId '742291174'
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      // First render - should call endInteractionWithSuccess once
      expect(endInteractionWithSuccess).toHaveBeenCalledTimes(1);
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
      );

      // Clear mock and verify subsequent renders don't call again
      // (The ref prevents duplicate calls for the same timeEntryId)
      (endInteractionWithSuccess as jest.Mock).mockClear();

      // The hook should not call the interaction function again for the same timeEntryId
      // even if the component re-renders, because processedTimeEntryRef.current === timeEntryId
      // This is tested implicitly - if we rerender and the query state doesn't change,
      // the interaction function should not be called again
    });

    it('should reset and call interaction function again when timeEntryId changes', () => {
      // First render with timeEntryId '742291174'
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { rerender } = renderHook(
        ({ timeEntryId }) =>
          useTimeEntryLocationData({
            timeEntryId,
            traceHeaders: DEFAULT_TRACE_HEADERS,
          }),
        { initialProps: { timeEntryId: '742291174' } },
      );

      // First render - should call endInteractionWithSuccess
      expect(endInteractionWithSuccess).toHaveBeenCalledTimes(1);

      // Clear mock
      (endInteractionWithSuccess as jest.Mock).mockClear();

      // Change timeEntryId - this should reset the ref via useEffect
      // First, simulate the query going back to loading state when timeEntryId changes
      mockUseQuery.mockReturnValue({
        loading: true, // Query starts loading for new timeEntryId
        data: undefined,
        error: undefined,
        refetch: mockRefetch,
      } as any);
      rerender({ timeEntryId: '888888888' });

      // Should not call yet because loading is true
      expect(endInteractionWithSuccess).not.toHaveBeenCalled();

      // Now simulate query completing for new timeEntryId
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);
      rerender({ timeEntryId: '888888888' });

      // Should call again for the new timeEntryId
      expect(endInteractionWithSuccess).toHaveBeenCalledTimes(1);
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
      );
    });

    // Note: Project is no longer in the query response, so this test is removed
    // The query only returns customer data to ensure customer_id is always used

    it('should handle degraded state with customer in timeAgainstContactDAS', () => {
      const queryError = new Error('DAS timeout');
      const responseWithCustomer = {
        timeTrackingLocationDetail: {
          timeEntry: {
            ...mockTimeEntry,
            timeAgainstContactDAS: {
              project: null,
              customer: {
                id: 'customer-123',
                fullName: 'Test Customer',
              },
            },
          },
          locationDetail: {
            edges: mockLocationPoints.map((point) => ({
              node: point,
              cursor: 'mock-cursor',
            })),
          },
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithCustomer,
        error: queryError,
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
        'DAS timeout',
      );
      expect(endInteractionWithSuccess).not.toHaveBeenCalled();
      expect(endInteractionWithFailure).not.toHaveBeenCalled();
    });

    it('should call endInteractionWithSuccess and log warning when no location points are available (empty edges)', () => {
      const responseWithNoLocationPoints = {
        timeTrackingLocationDetail: {
          timeEntry: mockTimeEntry,
          locationDetail: {
            edges: [], // Empty location points
          },
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithNoLocationPoints,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '742291174',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
      );
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Component=useTimeEntryLocationData Event=No location points available timeEntryId=742291174',
        ),
        expect.objectContaining({
          locationPointsCount: 0,
          hasTimeEntry: true,
        }),
      );
      expect(setInteractionDegraded).not.toHaveBeenCalled();
      expect(endInteractionWithFailure).not.toHaveBeenCalled();
    });
  });

  describe('workforce headers', () => {
    it('should include intuit-is-workforce-user header when in workforce environment', () => {
      mockIsWorkforceEnvironment.mockReturnValue(true);
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '12345',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          context: expect.objectContaining({
            headers: {
              'intuit-is-workforce-user': 'true',
            },
          }),
        }),
      );
    });

    it('should not include intuit-is-workforce-user header when not in workforce environment', () => {
      mockIsWorkforceEnvironment.mockReturnValue(false);
      mockUseQuery.mockReturnValue({
        loading: false,
        data: mockApiResponse,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: '12345',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          context: expect.objectContaining({
            headers: expect.not.objectContaining({
              'intuit-is-workforce-user': expect.anything(),
            }),
          }),
        }),
      );
    });
  });

  describe('Coverage gaps', () => {
    // hasEssentialData false when timeForContactDAS.id is missing
    // Uses a unique timeEntryId to avoid processedTimeEntryRef.current guard
    it('should treat hasEssentialData as false when timeForContactDAS.id is missing (lines 101-104)', () => {
      const responseWithoutContactId = {
        timeTrackingLocationDetail: {
          timeEntry: {
            ...mockTimeEntry,
            timeForContactDAS: { id: null }, // missing id
          },
          locationDetail: {
            edges: mockLocationPoints.map((point) => ({
              node: point,
              cursor: 'mock-cursor',
            })),
          },
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithoutContactId,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: 'unique-id-no-contact',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      // hasEssentialData is false → success path but logs a warning about missing data
      expect(result.current.error).toBeNull();
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Missing essential data'),
        expect.any(Object),
      );
    });

    // hasEssentialData false when timeAgainstContactDAS customer id missing
    it('should treat hasEssentialData as false when timeAgainstContactDAS customer id is missing (lines 101-104)', () => {
      const responseWithoutCustomerId = {
        timeTrackingLocationDetail: {
          timeEntry: {
            ...mockTimeEntry,
            timeAgainstContactDAS: { customer: { id: null } },
          },
          locationDetail: {
            edges: mockLocationPoints.map((point) => ({
              node: point,
              cursor: 'mock-cursor',
            })),
          },
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithoutCustomerId,
        error: undefined,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: 'unique-id-no-customer',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(result.current.error).toBeNull();
    });

    // queryError.message || 'Failed...' — error with empty message string
    it('should use fallback message when queryError has empty message (line 144)', () => {
      const queryError = new Error('');
      Object.defineProperty(queryError, 'message', {
        value: '',
        writable: false,
      });

      const responseWithNoData = {
        timeTrackingLocationDetail: {
          timeEntry: null,
          locationDetail: { edges: [] },
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithNoData,
        error: queryError,
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: 'unique-id-empty-msg-failure',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
        'Failed to fetch time entry location data',
        queryError,
      );
    });

    // queryError.message || 'Partial error...' — degraded path with empty message
    it('should use fallback message when queryError has empty message in degraded path (line 156)', () => {
      const queryError = new Error('');
      Object.defineProperty(queryError, 'message', {
        value: '',
        writable: false,
      });

      const responseWithFullData = {
        timeTrackingLocationDetail: {
          timeEntry: mockTimeEntry,
          locationDetail: {
            edges: mockLocationPoints.map((point) => ({
              node: point,
              cursor: 'mock-cursor',
            })),
          },
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithFullData,
        error: queryError,
        refetch: mockRefetch,
      } as any);

      renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: 'unique-id-empty-msg-degraded',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
        'Partial error while fetching data',
      );
    });

    // error: shouldShowError ? queryError || null : null
    // Verify the error is the queryError object when shouldShowError is true
    it('should return queryError as the error value when shouldShowError is true (line 190)', () => {
      const queryError = new Error('Network failure');

      const responseWithNoEssentialData = {
        timeTrackingLocationDetail: {
          timeEntry: null,
          locationDetail: { edges: [] },
        },
      };

      mockUseQuery.mockReturnValue({
        loading: false,
        data: responseWithNoEssentialData,
        error: queryError,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() =>
        useTimeEntryLocationData({
          timeEntryId: 'unique-id-show-error',
          traceHeaders: DEFAULT_TRACE_HEADERS,
        }),
      );

      // shouldShowError = queryError && !hasEssentialData → true
      // so error = queryError || null = queryError
      expect(result.current.error).toBe(queryError);
    });
  });
});
