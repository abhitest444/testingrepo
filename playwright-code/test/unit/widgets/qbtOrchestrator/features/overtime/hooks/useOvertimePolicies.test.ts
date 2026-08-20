/* eslint-disable react/no-children-prop */
import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import {
  useOvertimePolicies,
  OVERTIME_POLICIES_PAGE_SIZE,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useOvertimePolicies';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { getDefaultSandbox } from 'test/unit/testUtils';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';

import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockQuery = jest.fn();
const mockClient = { query: mockQuery };

jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(() => mockClient),
}));
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    OVERTIME_POLICIES_READ: 'overtime-policies-read',
    OVERTIME_POLICY_READ: 'overtime-policy-read',
  },
}));
const mockGetClient = getApolloClientInstance as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

const sandbox = getDefaultSandbox();
const wrapper = ({ children }: { children?: React.ReactNode }) => {
  const loggingProvider = React.createElement(LoggingConfigProvider, {
    sandbox,
    prefix: 'test',
    children,
  });
  return React.createElement(MockQuicksandProvider, {
    sandbox,
    children: loggingProvider,
  });
};

const makePageInfo = (overrides = {}) => ({
  hasNextPage: false,
  hasPreviousPage: false,
  totalCount: 2,
  ...overrides,
});

const makePoliciesResponse = (policies: any[], pageInfo = makePageInfo()) => ({
  data: { overtimePolicies: { values: policies, pageInfo } },
});

const policy1 = { id: '1', name: 'Policy One' };
const policy2 = { id: '2', name: 'Policy Two' };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useOvertimePolicies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClient.mockReturnValue(mockClient);
  });

  describe('fetchPolicies', () => {
    it('returns policies and pageInfo on success', async () => {
      mockQuery.mockResolvedValueOnce(makePoliciesResponse([policy1, policy2]));

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      let fetchResult: any;
      await act(async () => {
        fetchResult = await result.current.fetchPolicies();
      });

      expect(fetchResult.policies).toHaveLength(2);
      expect(fetchResult.pageInfo).toEqual(makePageInfo());
      expect(result.current.policies).toHaveLength(2);
      expect(result.current.loading).toBe(false);
      expect(createCustomerInteraction).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.OVERTIME_POLICIES_READ,
      );
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.OVERTIME_POLICIES_READ,
      );
    });

    it('passes offset and limit to Apollo query', async () => {
      mockQuery.mockResolvedValueOnce(makePoliciesResponse([policy1]));

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      await act(async () => {
        await result.current.fetchPolicies({ offset: 10, limit: 5 });
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            pagination: { limit: 5, offset: 10 },
          }),
        }),
      );
    });

    it('throws and sets error when Apollo client is not initialized', async () => {
      mockGetClient.mockReturnValueOnce(null);

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      await expect(
        act(async () => {
          await result.current.fetchPolicies();
        }),
      ).rejects.toThrow('Apollo client not initialized');

      expect(result.current.error?.message).toBe(
        'Apollo client not initialized',
      );
      expect(result.current.loading).toBe(false);
    });

    it('throws and sets error on network failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      let caughtError: Error | undefined;
      await act(async () => {
        try {
          await result.current.fetchPolicies();
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError?.message).toBe('Network error');
      expect(result.current.error?.message).toBe('Network error');
      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.OVERTIME_POLICIES_READ,
        'Network error',
        expect.any(Error),
      );
    });
  });

  describe('fetchPolicyById', () => {
    it('returns a single policy on success', async () => {
      mockQuery.mockResolvedValueOnce({ data: { overtimePolicy: policy1 } });

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      let fetched: any;
      await act(async () => {
        fetched = await result.current.fetchPolicyById('1');
      });

      expect(fetched).toEqual(policy1);
      expect(createCustomerInteraction).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.OVERTIME_POLICY_READ,
      );
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.OVERTIME_POLICY_READ,
      );
    });

    it('returns null when policy is missing from response', async () => {
      mockQuery.mockResolvedValueOnce({ data: { overtimePolicy: null } });

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      let fetched: any;
      await act(async () => {
        fetched = await result.current.fetchPolicyById('999');
      });

      expect(fetched).toBeNull();
    });

    it('throws and sets error on failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      let caughtError: Error | undefined;
      await act(async () => {
        try {
          await result.current.fetchPolicyById('bad-id');
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError?.message).toBe('Not found');
      expect(result.current.error?.message).toBe('Not found');
    });
  });

  describe('fetchNextPage', () => {
    it('fetches next page using calculated offset when hasNextPage is true', async () => {
      // First fetch to seed pageInfo
      mockQuery.mockResolvedValueOnce(
        makePoliciesResponse([policy1], makePageInfo({ hasNextPage: true })),
      );
      mockQuery.mockResolvedValueOnce(
        makePoliciesResponse([policy2], makePageInfo()),
      );

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      await act(async () => {
        await result.current.fetchPolicies();
      });
      await act(async () => {
        await result.current.fetchNextPage();
      });

      const secondCall = mockQuery.mock.calls[1][0];
      expect(secondCall.variables.pagination.offset).toBe(
        OVERTIME_POLICIES_PAGE_SIZE,
      );
    });

    it('does nothing when hasNextPage is false', async () => {
      mockQuery.mockResolvedValueOnce(
        makePoliciesResponse([policy1], makePageInfo({ hasNextPage: false })),
      );

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });
      await act(async () => {
        await result.current.fetchPolicies();
      });

      const callsBefore = mockQuery.mock.calls.length;
      await act(async () => {
        await result.current.fetchNextPage();
      });

      expect(mockQuery.mock.calls.length).toBe(callsBefore); // no new call
    });

    it('throws and logs error when fetchNextPage fails', async () => {
      mockQuery.mockResolvedValueOnce(
        makePoliciesResponse([policy1], makePageInfo({ hasNextPage: true })),
      );
      mockQuery.mockRejectedValueOnce(new Error('Next page error'));

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      await act(async () => {
        await result.current.fetchPolicies();
      });

      let caughtError: Error | undefined;
      await act(async () => {
        try {
          await result.current.fetchNextPage();
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError?.message).toBe('Next page error');
      expect(result.current.error?.message).toBe('Next page error');
    });
  });

  describe('fetchPreviousPage', () => {
    it('fetches previous page with offset decremented by page size', async () => {
      // Page 2 loaded (offset=10)
      mockQuery.mockResolvedValueOnce(
        makePoliciesResponse(
          [policy1],
          makePageInfo({ hasNextPage: true, hasPreviousPage: false }),
        ),
      );
      mockQuery.mockResolvedValueOnce(
        makePoliciesResponse(
          [policy2],
          makePageInfo({ hasPreviousPage: true }),
        ),
      );
      mockQuery.mockResolvedValueOnce(makePoliciesResponse([policy1]));

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });
      await act(async () => {
        await result.current.fetchPolicies({ offset: 0 });
      });
      await act(async () => {
        await result.current.fetchNextPage();
      });
      await act(async () => {
        await result.current.fetchPreviousPage();
      });

      const lastCall = mockQuery.mock.calls[2][0];
      expect(lastCall.variables.pagination.offset).toBe(0);
    });

    it('does nothing when hasPreviousPage is false', async () => {
      mockQuery.mockResolvedValueOnce(
        makePoliciesResponse(
          [policy1],
          makePageInfo({ hasPreviousPage: false }),
        ),
      );

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });
      await act(async () => {
        await result.current.fetchPolicies();
      });

      const callsBefore = mockQuery.mock.calls.length;
      await act(async () => {
        await result.current.fetchPreviousPage();
      });

      expect(mockQuery.mock.calls.length).toBe(callsBefore);
    });

    it('throws and logs error when fetchPreviousPage fails', async () => {
      mockQuery.mockResolvedValueOnce(
        makePoliciesResponse([policy1], makePageInfo({ hasNextPage: true })),
      );
      mockQuery.mockResolvedValueOnce(
        makePoliciesResponse(
          [policy2],
          makePageInfo({ hasPreviousPage: true }),
        ),
      );
      mockQuery.mockRejectedValueOnce(new Error('Previous page error'));

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      await act(async () => {
        await result.current.fetchPolicies();
      });
      await act(async () => {
        await result.current.fetchNextPage();
      });

      let caughtError: Error | undefined;
      await act(async () => {
        try {
          await result.current.fetchPreviousPage();
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError?.message).toBe('Previous page error');
      expect(result.current.error?.message).toBe('Previous page error');
    });
  });

  describe('fetchPage', () => {
    it('calculates correct offset for a 1-based page number', async () => {
      mockQuery.mockResolvedValueOnce(makePoliciesResponse([policy2]));

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      await act(async () => {
        await result.current.fetchPage(3);
      });

      const call = mockQuery.mock.calls[0][0];
      expect(call.variables.pagination.offset).toBe(
        2 * OVERTIME_POLICIES_PAGE_SIZE,
      );
    });

    it('throws and logs error when fetchPage fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Fetch page error'));

      const { result } = renderHook(() => useOvertimePolicies(), { wrapper });

      let caughtError: Error | undefined;
      await act(async () => {
        try {
          await result.current.fetchPage(2);
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError?.message).toBe('Fetch page error');
      expect(result.current.error?.message).toBe('Fetch page error');
    });
  });
});
