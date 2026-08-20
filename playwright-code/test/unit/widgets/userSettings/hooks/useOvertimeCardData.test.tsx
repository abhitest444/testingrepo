// @ts-nocheck
/**
 * Tests for useOvertimeCardData hook
 *
 * Tests the card-specific hook that orchestrates data fetching
 * and Redux synchronization for the OvertimeCard component.
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { useOvertimeCardData } from 'src/js/widgets/userSettings/hooks/useOvertimeCardData';
import overtimeReducer, {
  setOvertimePolicy,
  setOvertimeLoading,
  setOvertimeError,
  resetOvertimeState,
} from 'src/js/widgets/userSettings/store/slices/overtimeSlice';
import { createOvertimePolicy } from 'test/unit/fixtures/overtimeFixtures';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

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
    USER_OVERTIME_POLICY_READ: 'user-overtime-policy-read',
  },
}));

const mockGetClient = getApolloClientInstance as jest.Mock;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const mockSandbox = {
  logger: mockLogger,
};

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => mockSandbox),
}));

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => mockLogger,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockPolicy = createOvertimePolicy({ id: 'p1', name: 'Weekly OT' });

const makePoliciesResponse = (policies: any[]) => ({
  data: { overtimePolicies: { values: policies } },
});

const makeGraphQLErrorResponse = (messages: string[]) => ({
  data: { overtimePolicies: { values: [] } },
  errors: messages.map((message) => ({ message })),
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useOvertimeCardData', () => {
  let store: ReturnType<typeof configureStore>;

  const createStore = () =>
    configureStore({
      reducer: {
        overtime: overtimeReducer,
      },
    });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClient.mockReturnValue(mockClient);
    store = createStore();
  });

  describe('State reset on user switch', () => {
    it('dispatches resetOvertimeState on initial mount', async () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      // Wait for the useEffect to fire
      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(resetOvertimeState());
    });

    it('dispatches resetOvertimeState when assignedToUserId changes', async () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { rerender } = renderHook(
        ({ userId }) => useOvertimeCardData(userId),
        {
          wrapper,
          initialProps: { userId: 'user-1' },
        },
      );

      await act(async () => {});
      dispatchSpy.mockClear();

      rerender({ userId: 'user-2' });
      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(resetOvertimeState());
    });

    it('dispatches resetOvertimeState when userId changes to undefined', async () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { rerender } = renderHook(
        ({ userId }) => useOvertimeCardData(userId),
        {
          wrapper,
          initialProps: { userId: 'user-1' as string | undefined },
        },
      );

      await act(async () => {});
      dispatchSpy.mockClear();

      rerender({ userId: undefined });
      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(resetOvertimeState());
    });
  });

  describe('Skip fetch when userId is undefined', () => {
    it('does not call Apollo query when assignedToUserId is undefined', async () => {
      renderHook(() => useOvertimeCardData(undefined), { wrapper });

      await act(async () => {});

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('does not dispatch setOvertimeLoading when assignedToUserId is undefined', async () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData(undefined), { wrapper });

      await act(async () => {});

      expect(dispatchSpy).not.toHaveBeenCalledWith(setOvertimeLoading(true));
    });
  });

  describe('Error dispatch when client is null', () => {
    it('dispatches setOvertimeError when Apollo client is null', async () => {
      mockGetClient.mockReturnValue(null);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(
        setOvertimeError('Apollo client not initialized'),
      );
    });

    it('logs error when Apollo client is null', async () => {
      mockGetClient.mockReturnValue(null);

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(mockLogger.error).toHaveBeenCalledWith(
        'OvertimeSettings.APOLLO_CLIENT_NOT_INITIALIZED',
      );
    });
  });

  describe('Error dispatch when query throws', () => {
    it('dispatches setOvertimeError on network failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Network error'));
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(
        setOvertimeError('Network error'),
      );
      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.USER_OVERTIME_POLICY_READ,
        'Network error',
        expect.any(Error),
      );
    });

    it('logs error on network failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Network error'));

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(mockLogger.error).toHaveBeenCalledWith(
        'OvertimeSettings.FETCH_POLICY_FAILED',
        expect.objectContaining({ error: 'Network error' }),
      );
    });

    it('converts non-Error throwables to string', async () => {
      mockQuery.mockRejectedValueOnce('raw string error');
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(
        setOvertimeError('raw string error'),
      );
    });
  });

  describe('Policy dispatch on success', () => {
    it('dispatches setOvertimePolicy with first policy on success', async () => {
      mockQuery.mockResolvedValueOnce(makePoliciesResponse([mockPolicy]));
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(setOvertimePolicy(mockPolicy));
      expect(createCustomerInteraction).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.USER_OVERTIME_POLICY_READ,
      );
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        mockSandbox,
        TimeCustomerInteraction.USER_OVERTIME_POLICY_READ,
      );
    });

    it('dispatches setOvertimePolicy(null) when no policies returned', async () => {
      mockQuery.mockResolvedValueOnce(makePoliciesResponse([]));
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(setOvertimePolicy(null));
    });

    it('dispatches setOvertimeLoading(true) before fetching', async () => {
      mockQuery.mockResolvedValueOnce(makePoliciesResponse([mockPolicy]));
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(setOvertimeLoading(true));
    });

    it('logs success message after fetching', async () => {
      mockQuery.mockResolvedValueOnce(makePoliciesResponse([mockPolicy]));

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(mockLogger.info).toHaveBeenCalledWith(
        'OvertimeSettings.FETCH_POLICY_SUCCESS',
        expect.objectContaining({ hasPolicyAssigned: true }),
      );
    });

    it('dispatches setOvertimeLoading(false) after fetch completes', async () => {
      mockQuery.mockResolvedValueOnce(makePoliciesResponse([mockPolicy]));
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), {
        wrapper,
      });

      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(setOvertimeLoading(false));
    });
  });

  describe('GraphQL errors handling', () => {
    it('dispatches setOvertimeError when response contains GraphQL errors', async () => {
      mockQuery.mockResolvedValueOnce(
        makeGraphQLErrorResponse(['Unauthorized access']),
      );
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(
        setOvertimeError('Unauthorized access'),
      );
    });

    it('joins multiple GraphQL error messages', async () => {
      mockQuery.mockResolvedValueOnce(
        makeGraphQLErrorResponse(['Error one', 'Error two']),
      );
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(dispatchSpy).toHaveBeenCalledWith(
        setOvertimeError('Error one; Error two'),
      );
    });

    it('does not dispatch setOvertimePolicy when GraphQL errors are present', async () => {
      mockQuery.mockResolvedValueOnce(
        makeGraphQLErrorResponse(['Server error']),
      );
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(dispatchSpy).not.toHaveBeenCalledWith(
        setOvertimePolicy(expect.anything()),
      );
    });

    it('logs error when GraphQL errors are present', async () => {
      mockQuery.mockResolvedValueOnce(
        makeGraphQLErrorResponse(['Server error']),
      );

      renderHook(() => useOvertimeCardData('user-1'), { wrapper });

      await act(async () => {});

      expect(mockLogger.error).toHaveBeenCalledWith(
        'OvertimeSettings.FETCH_POLICY_FAILED',
        expect.objectContaining({ error: 'Server error' }),
      );
    });
  });
});
