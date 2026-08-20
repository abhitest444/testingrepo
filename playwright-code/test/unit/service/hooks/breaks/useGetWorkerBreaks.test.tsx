// @ts-nocheck
/**
 * Tests for useGetWorkerBreaks hook
 *
 * Tests the reusable hook for fetching worker break rules
 */

import { act } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { GET_EMPLOYER_BREAKS_BY_ASSIGNEE } from 'src/js/service/queries/breaks';
import { useGetWorkerBreaks } from 'src/js/service/hooks/breaks/useGetWorkerBreaks';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';
import { Payroll_Break } from 'src/__generated__/oigql/graphql';
import { createMockBreakRule } from 'test/unit/fixtures';

// Mock the customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
}));

// Mock the mapError utility
jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

describe('useGetWorkerBreaks', () => {
  const mockAssigneeId = 'test-assignee-123';
  const mockFilter = {
    assigneeId: mockAssigneeId,
    isActive: true,
  };

  const mockBreakData = {
    payrollEmployerBreaksByAssigneeId: {
      nodes: [
        createMockBreakRule('1', { breakName: 'Paid Lunch' }),
        createMockBreakRule('2', {
          breakName: 'Unpaid Break',
          breakType: Payroll_Break.Unpaid,
          breakDuration: 15,
          allowAuto: false,
        }),
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);
  });

  it('should return the hook interface with correct initial state', () => {
    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks(),
      [],
    );

    expect(result.current.loadWorkerBreaks).toBeDefined();
    expect(typeof result.current.loadWorkerBreaks).toBe('function');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.breaks).toEqual([]);
  });

  it('should successfully load worker breaks', async () => {
    const successMock = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter },
      },
      result: {
        data: mockBreakData,
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: mockAssigneeId,
        isActive: true,
      });
    });

    expect(result.current.breaks).toHaveLength(2);
    expect(result.current.breaks[0].breakName).toBe('Paid Lunch');
    expect(result.current.breaks[1].breakName).toBe('Unpaid Break');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should call customer interaction on success', async () => {
    const successMock = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter },
      },
      result: {
        data: mockBreakData,
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: mockAssigneeId,
        isActive: true,
      });
    });

    expect(
      require('src/js/common/CustomerInteraction').createCustomerInteraction,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
    );
  });

  it('should call onSuccess callback when provided at hook initialization', async () => {
    const successMock = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter },
      },
      result: {
        data: mockBreakData,
      },
    };

    const onSuccess = jest.fn();

    // Callbacks are passed at hook initialization, not at function call
    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks({ onSuccess }),
      [successMock],
    );

    await act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: mockAssigneeId,
        isActive: true,
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ breakName: 'Paid Lunch' }),
        expect.objectContaining({ breakName: 'Unpaid Break' }),
      ]),
    );
  });

  it('should set loading state during query execution', async () => {
    const successMock = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter },
      },
      result: {
        data: mockBreakData,
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks(),
      [successMock],
    );

    // Initially not loading
    expect(result.current.loading).toBe(false);

    // Start the query
    const queryPromise = act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: mockAssigneeId,
        isActive: true,
      });
    });

    // Should be loading during execution
    expect(result.current.loading).toBe(true);

    await queryPromise;

    // Should not be loading after completion
    expect(result.current.loading).toBe(false);
  });

  it('should handle network/Apollo errors', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Network error occurred');

    const networkErrorMock = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks(),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: mockAssigneeId,
        isActive: true,
      });
    });

    expect(result.current.error).toBe('Network error occurred');
    expect(result.current.loading).toBe(false);
  });

  it('should call onError callback when error occurs (callback at hook init)', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Network error occurred');

    const networkErrorMock = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter },
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const onError = jest.fn();

    // Callbacks are passed at hook initialization
    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks({ onError }),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: mockAssigneeId,
        isActive: true,
      });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(String));
  });

  it('should handle empty breaks response', async () => {
    const emptyMock = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter },
      },
      result: {
        data: {
          payrollEmployerBreaksByAssigneeId: {
            nodes: [],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks(),
      [emptyMock],
    );

    await act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: mockAssigneeId,
        isActive: true,
      });
    });

    expect(result.current.breaks).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle multiple sequential calls', async () => {
    const mockFilter1 = { assigneeId: 'assignee-1', isActive: true };
    const mockFilter2 = { assigneeId: 'assignee-2', isActive: true };

    const successMock1 = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter1 },
      },
      result: {
        data: mockBreakData,
      },
    };

    const successMock2 = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter2 },
      },
      result: {
        data: {
          payrollEmployerBreaksByAssigneeId: {
            nodes: [
              createMockBreakRule('3', {
                breakName: 'Different Break',
                breakDuration: 45,
              }),
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks(),
      [successMock1, successMock2],
    );

    await act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: 'assignee-1',
        isActive: true,
      });
    });

    expect(result.current.breaks).toHaveLength(2);

    await act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: 'assignee-2',
        isActive: true,
      });
    });

    expect(result.current.breaks).toHaveLength(1);
    expect(result.current.breaks[0].breakName).toBe('Different Break');
  });

  it('should include propagation headers in query context', async () => {
    const mockHeaders = { 'x-trace-id': '123' };

    const {
      getCustomerInteractionPropagationHeaders,
    } = require('src/js/common/CustomerInteraction');
    getCustomerInteractionPropagationHeaders.mockReturnValue(mockHeaders);

    const successMock = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter },
      },
      result: {
        data: mockBreakData,
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: mockAssigneeId,
        isActive: true,
      });
    });

    expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.BREAK_ASSIGNMENT_READ_BY_ASSIGNEE,
    );
  });

  it('should map break data correctly', async () => {
    const successMock = {
      request: {
        query: GET_EMPLOYER_BREAKS_BY_ASSIGNEE,
        variables: { filter: mockFilter },
      },
      result: {
        data: mockBreakData,
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetWorkerBreaks(),
      [successMock],
    );

    await act(async () => {
      await result.current.loadWorkerBreaks({
        assigneeId: mockAssigneeId,
        isActive: true,
      });
    });

    const paidBreak = result.current.breaks[0];
    expect(paidBreak).toEqual({
      id: '1',
      breakName: 'Paid Lunch',
      breakType: Payroll_Break.Paid,
      breakDuration: 30,
      durationUnit: 'MINUTES',
      isActive: true,
      isDefaultPolicy: false,
      allowAuto: true,
      allowManual: true,
      noSetDuration: false,
    });
  });
});
