import { renderHook } from '@testing-library/react-hooks';
import { useLazyGetTSheetsWorkerById } from '../../../../../src/js/service/hooks/employee/useLazyGetTSheetsWorkerById';

// Mock the Apollo client and related dependencies
jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(() => ({
    query: jest.fn().mockResolvedValue({
      data: {
        timeTrackingWorkerById: {
          tsheetsId: 'tsheets-123',
          authId: 'auth-123',
          profileId: 'profile-123',
          employeeId: 'employee-123',
          vendorId: null,
          isEmployee: true,
          isQboUser: true,
          isVendor: false,
          self: true,
          managedGroupIds: ['group-1', 'group-2'],
          groupId: 'group-1',
          permissions: ['read', 'write'],
          cacheHit: false,
          timeMs: 100,
        },
      },
    }),
  })),
}));

// Mock the sandbox
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({
    logger: {
      info: jest.fn(),
      logException: jest.fn(),
    },
    performance: {
      createCustomerInteraction: jest.fn(),
      endInteractionWithSuccess: jest.fn(),
      endInteractionWithFailure: jest.fn(),
    },
  })),
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn(({ id }) => id),
  })),
}));

// Mock the query
jest.mock('src/js/service/queries/tsheetsQueries', () => ({
  GET_TIME_TRACKING_WORKER_BY_ID: 'mock-query',
}));

// Mock the error mapping utility
jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(() => 'Mocked error message'),
}));

// Mock customer interaction
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({
    'x-trace-id': 'mock-trace-id',
  })),
  TimeCustomerInteraction: {
    EMPLOYEE_READ: 'employee-read',
  },
}));

describe('useLazyGetTSheetsWorkerById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useLazyGetTSheetsWorkerById());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toBeUndefined();
    expect(result.current.query).toBeDefined();
  });

  it('should handle successful query', async () => {
    const { result } = renderHook(() => useLazyGetTSheetsWorkerById());

    // Execute the query
    await result.current.query({
      variables: { id: 'auth-123' },
    });

    // Wait for the query to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual({
      tsheetsId: 'tsheets-123',
      authId: 'auth-123',
      profileId: 'profile-123',
      employeeId: 'employee-123',
      vendorId: null,
      isEmployee: true,
      isQboUser: true,
      isVendor: false,
      self: true,
      managedGroupIds: ['group-1', 'group-2'],
      groupId: 'group-1',
      permissions: ['read', 'write'],
      cacheHit: false,
      timeMs: 100,
    });
  });

  it('should handle query error', async () => {
    const {
      getApolloClientInstance,
    } = require('src/js/service/ApolloClientBuilder');
    getApolloClientInstance.mockReturnValue({
      query: jest.fn().mockRejectedValue(new Error('Test error')),
    });

    const { result } = renderHook(() => useLazyGetTSheetsWorkerById());

    // Execute the query and expect it to throw
    try {
      await result.current.query({
        variables: { id: 'auth-123' },
      });
    } catch (error) {
      // Expected to throw
    }

    // Wait for the query to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.loading).toBe(false);
    // mapError returns a generic error message from intl, not the original error
    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it('should throw when Apollo client is not initialized', async () => {
    const {
      getApolloClientInstance,
    } = require('src/js/service/ApolloClientBuilder');
    getApolloClientInstance.mockReturnValue(null);

    const { result } = renderHook(() => useLazyGetTSheetsWorkerById());

    await expect(
      result.current.query({ variables: { id: 'auth-123' } }),
    ).rejects.toThrow('Apollo client not initialized');

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it('should handle null data response', async () => {
    const {
      getApolloClientInstance,
    } = require('src/js/service/ApolloClientBuilder');
    getApolloClientInstance.mockReturnValue({
      query: jest.fn().mockResolvedValue({
        data: { timeTrackingWorkerById: null },
      }),
    });

    const { result } = renderHook(() => useLazyGetTSheetsWorkerById());

    // Execute the query
    await result.current.query({
      variables: { id: 'auth-123' },
    });

    // Wait for the query to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toBeUndefined();
  });
});
