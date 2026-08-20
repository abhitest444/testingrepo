/* eslint-disable react/no-children-prop */
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useOvertimePolicyWorkerCount } from 'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useOvertimePolicyWorkerCount';
import { getDefaultSandbox } from 'test/unit/testUtils';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import type { OvertimePolicyAssignment } from 'src/js/widgets/qbtOrchestrator/features/overtime/types/Overtime.types';

import {
  useGetWorkersTotalCountLazyQuery,
  useGetGroupWorkersTotalCountLazyQuery,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    WORKERS_READ_FOR_ASSIGNMENT: 'workers-read-for-assignment',
    GROUP_MEMBERS_READ: 'group-members-read',
  },
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockExecuteCompanyCount = jest.fn();
const mockExecuteGroupCount = jest.fn();

jest.mock('src/__generated__/timeTracking/graphql', () => ({
  ...jest.requireActual('src/__generated__/timeTracking/graphql'),
  useGetWorkersTotalCountLazyQuery: jest.fn(() => [
    mockExecuteCompanyCount,
    { data: null, loading: false, error: undefined },
  ]),
  useGetGroupWorkersTotalCountLazyQuery: jest.fn(() => [
    mockExecuteGroupCount,
    { loading: false },
  ]),
}));

const mockCompanyQuery = useGetWorkersTotalCountLazyQuery as jest.Mock;
const mockGroupQuery = useGetGroupWorkersTotalCountLazyQuery as jest.Mock;

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

const makeAllAssignment = (): OvertimePolicyAssignment => ({
  id: 'a-all',
  entityType: 'all',
  entityId: 'all',
  entityName: 'All Workers',
});

const makeUserAssignment = (id: string): OvertimePolicyAssignment => ({
  id: `a-${id}`,
  entityType: 'user',
  entityId: id,
  entityName: `User ${id}`,
});

const makeGroupAssignment = (id: string): OvertimePolicyAssignment => ({
  id: `a-${id}`,
  entityType: 'group',
  entityId: id,
  entityName: `Group ${id}`,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useOvertimePolicyWorkerCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompanyQuery.mockReturnValue([
      mockExecuteCompanyCount,
      {
        data: { timeTrackingWorkers: { totalCount: 50 } },
        loading: false,
        error: undefined,
      },
    ]);
    mockGroupQuery.mockReturnValue([mockExecuteGroupCount, { loading: false }]);
  });

  it('reports hasNoAssignments when assignments array is empty', () => {
    const { result } = renderHook(
      () => useOvertimePolicyWorkerCount({ assignments: [] }),
      { wrapper },
    );

    expect(result.current.hasNoAssignments).toBe(true);
    expect(result.current.totalWorkerCount).toBe(0);
  });

  it('reports isCompanyWide and uses company count for "all" assignment', () => {
    const { result } = renderHook(
      () =>
        useOvertimePolicyWorkerCount({ assignments: [makeAllAssignment()] }),
      { wrapper },
    );

    expect(result.current.isCompanyWide).toBe(true);
    expect(result.current.totalWorkerCount).toBe(50); // from company query
    expect(result.current.companyTotalWorkerCount).toBe(50);
  });

  it('counts user assignments directly without GraphQL', () => {
    const assignments = [makeUserAssignment('u-1'), makeUserAssignment('u-2')];

    const { result } = renderHook(
      () => useOvertimePolicyWorkerCount({ assignments }),
      { wrapper },
    );

    expect(result.current.isCompanyWide).toBe(false);
    expect(result.current.hasNoAssignments).toBe(false);
    expect(result.current.totalWorkerCount).toBe(2);
  });

  it('excludes User Not Found user assignments from totalWorkerCount', () => {
    const orphanAssignment: OvertimePolicyAssignment = {
      id: 'a-orphan',
      entityType: 'user',
      entityId: 'user-orphan',
      entityName: 'User Not Found',
    };
    const assignments = [makeUserAssignment('u-1'), orphanAssignment];

    const { result } = renderHook(
      () => useOvertimePolicyWorkerCount({ assignments }),
      { wrapper },
    );

    // Only the valid user should count; the orphan must be excluded
    expect(result.current.totalWorkerCount).toBe(1);
  });

  it('executes group count query for each group assignment with overtime worker types filter', () => {
    const assignments = [
      makeGroupAssignment('g-1'),
      makeGroupAssignment('g-2'),
    ];

    renderHook(() => useOvertimePolicyWorkerCount({ assignments }), {
      wrapper,
    });

    const expectedTypes = [
      TimeTracking_TimeForType.Employee,
      TimeTracking_TimeForType.Vendor,
    ];

    // Should have called executeGroupCountQuery twice (once per group)
    expect(mockExecuteGroupCount).toHaveBeenCalledTimes(2);
    expect(mockExecuteGroupCount).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { groupId: 'g-1', types: expectedTypes },
      }),
    );
    expect(mockExecuteGroupCount).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { groupId: 'g-2', types: expectedTypes },
      }),
    );
  });

  it('shows loading when company count query is loading', () => {
    mockCompanyQuery.mockReturnValue([
      mockExecuteCompanyCount,
      { data: null, loading: true, error: undefined },
    ]);

    const { result } = renderHook(
      () => useOvertimePolicyWorkerCount({ assignments: [] }),
      { wrapper },
    );

    expect(result.current.loading).toBe(true);
  });

  it('reports error from company count query', () => {
    const graphqlError = { message: 'Network error' } as any;
    mockCompanyQuery.mockReturnValue([
      mockExecuteCompanyCount,
      { data: null, loading: false, error: graphqlError },
    ]);

    const { result } = renderHook(
      () => useOvertimePolicyWorkerCount({ assignments: [] }),
      { wrapper },
    );

    expect(result.current.error).toBe('Network error');
  });

  it('fetches company total count on mount with overtime worker types filter', () => {
    renderHook(() => useOvertimePolicyWorkerCount({ assignments: [] }), {
      wrapper,
    });

    expect(mockExecuteCompanyCount).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          filter: {
            isActive: true,
            types: [
              TimeTracking_TimeForType.Employee,
              TimeTracking_TimeForType.Vendor,
            ],
          },
        },
      }),
    );
  });

  it('completes company interaction on successful company query', () => {
    const {
      createCustomerInteraction,
      endInteractionWithSuccess,
    } = require('src/js/common/CustomerInteraction');

    mockExecuteCompanyCount.mockImplementationOnce((options: any) => {
      options?.onCompleted?.();
    });

    renderHook(() => useOvertimePolicyWorkerCount({ assignments: [] }), {
      wrapper,
    });

    expect(createCustomerInteraction).toHaveBeenCalledWith(
      sandbox,
      'workers-read-for-assignment',
    );
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      sandbox,
      'workers-read-for-assignment',
    );
  });

  it('fails company interaction on company query error', () => {
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    const queryError = new Error('Company count failed');

    mockExecuteCompanyCount.mockImplementationOnce((options: any) => {
      options?.onError?.(queryError);
    });

    renderHook(() => useOvertimePolicyWorkerCount({ assignments: [] }), {
      wrapper,
    });

    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      sandbox,
      'workers-read-for-assignment',
      'Company count failed',
      queryError,
    );
  });

  describe('stale group count cleanup on policy switch', () => {
    it('removes counts for groups not in the new policy assignments', () => {
      // Simulate group count resolved by calling onCompleted
      mockGroupQuery.mockImplementation(() => [
        (options: any) => {
          if (options?.onCompleted) {
            options.onCompleted({ members: { totalCount: 5 } });
          }
        },
        { loading: false },
      ]);

      // Start with Policy A: groups G1 and G2
      const { rerender, result } = renderHook(
        ({ assignments }: { assignments: any[] }) =>
          useOvertimePolicyWorkerCount({ assignments }),
        {
          wrapper,
          initialProps: {
            assignments: [
              makeGroupAssignment('g-1'),
              makeGroupAssignment('g-2'),
            ],
          },
        },
      );

      // Policy A: G1(5) + G2(5) = 10
      expect(result.current.totalWorkerCount).toBe(10);

      // Switch to Policy B: only G3 (no overlap with G1/G2)
      rerender({ assignments: [makeGroupAssignment('g-3')] });

      // G1 and G2 stale counts should be removed; only G3(5) remains
      expect(result.current.totalWorkerCount).toBe(5);
    });

    it('resets group counts when switching to empty assignments', () => {
      mockGroupQuery.mockImplementation(() => [
        (options: any) => {
          if (options?.onCompleted) {
            options.onCompleted({ members: { totalCount: 8 } });
          }
        },
        { loading: false },
      ]);

      const { rerender, result } = renderHook(
        ({ assignments }: { assignments: any[] }) =>
          useOvertimePolicyWorkerCount({ assignments }),
        {
          wrapper,
          initialProps: { assignments: [makeGroupAssignment('g-1')] },
        },
      );

      expect(result.current.totalWorkerCount).toBe(8);

      // Switch to no assignments
      rerender({ assignments: [] });

      expect(result.current.totalWorkerCount).toBe(0);
      expect(result.current.hasNoAssignments).toBe(true);
    });
  });

  it('combines user count and group count into totalWorkerCount', () => {
    // Simulate group count resolved by calling onCompleted
    mockGroupQuery.mockImplementation(() => [
      (options: any) => {
        // Immediately invoke onCompleted to simulate resolved group count
        if (options?.onCompleted) {
          options.onCompleted({ members: { totalCount: 8 } });
        }
      },
      { loading: false },
    ]);

    const assignments = [
      makeGroupAssignment('g-1'), // 8 members
      makeUserAssignment('u-1'), // 1 user
    ];

    const { result } = renderHook(
      () => useOvertimePolicyWorkerCount({ assignments }),
      { wrapper },
    );

    expect(result.current.totalWorkerCount).toBe(9); // 8 group + 1 user

    const {
      endInteractionWithSuccess,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      sandbox,
      'group-members-read',
    );
  });

  it('logs error and sets error state when group count query fails', () => {
    // Simulate group count error by calling onError
    mockGroupQuery.mockImplementation(() => [
      (options: any) => {
        if (options?.onError) {
          options.onError(new Error('Failed to fetch group members'));
        }
      },
      { loading: false },
    ]);

    const assignments = [makeGroupAssignment('g-1')];

    const { result } = renderHook(
      () => useOvertimePolicyWorkerCount({ assignments }),
      { wrapper },
    );

    expect(result.current.error).toBe('Failed to fetch group members');
    expect(result.current.totalWorkerCount).toBe(0); // No count available due to error

    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      sandbox,
      'group-members-read',
      'Failed to fetch group members',
      expect.any(Error),
    );
  });
});
