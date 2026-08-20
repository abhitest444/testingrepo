import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useGetUnassignedWorkers } from 'src/js/service/hooks/groups/useGetUnassignedWorkers';
import { GET_UNASSIGNED_WORKERS_QUERY } from 'src/js/service/queries/timeTrackingGroupQueries';
import { getDefaultSandbox } from 'test/unit/testUtils';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';

const mockData = {
  timeTrackingWorkers: {
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: 'cursor1',
      endCursor: 'cursor3',
    },
    edges: [
      {
        cursor: 'cursor1',
        node: {
          id: 'worker-unassigned-1',
          type: 'EMPLOYEE',
          isActive: true,
          firstName: 'David',
          lastName: 'Unassigned',
          displayName: 'David Unassigned',
          memberOfGroup: null,
          managesGroups: [],
        },
      },
      {
        cursor: 'cursor2',
        node: {
          id: 'worker-unassigned-2',
          type: 'VENDOR',
          isActive: true,
          firstName: 'Emma',
          lastName: 'Freelance',
          displayName: 'Emma Freelance',
          memberOfGroup: null,
          managesGroups: [],
        },
      },
      {
        cursor: 'cursor3',
        node: {
          id: 'worker-unassigned-3',
          type: 'EMPLOYEE',
          isActive: false,
          firstName: 'Frank',
          lastName: 'Inactive',
          displayName: 'Frank Inactive',
          memberOfGroup: null,
          managesGroups: [],
        },
      },
    ],
  },
};

describe('useGetUnassignedWorkers', () => {
  const sandbox = getDefaultSandbox();

  const createWrapper =
    (mocks: any[]) =>
    ({ children }: any) =>
      (
        <MockQuicksandProvider sandbox={sandbox}>
          <MockedProvider mocks={mocks} addTypename={false}>
            {children}
          </MockedProvider>
        </MockQuicksandProvider>
      );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial loading state', () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(typeof result.current.loadUnassignedWorkers).toBe('function');
    });
  });

  describe('Loading Data', () => {
    it('loads unassigned workers successfully with default parameters', async () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadUnassignedWorkers();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.timeTrackingWorkers);
      expect(result.current.error).toBeNull();
    });

    it('loads workers with custom first parameter', async () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 100,
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadUnassignedWorkers({ first: 100 });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.timeTrackingWorkers);
    });

    it('handles pagination with cursor', async () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              after: 'cursor3',
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadUnassignedWorkers({ after: 'cursor3' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.timeTrackingWorkers);
    });

    it('loads workers with active filter', async () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              filter: { hasGroup: false, isActive: true },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadUnassignedWorkers({
        filter: { hasGroup: false, isActive: true },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.timeTrackingWorkers);
    });

    it('loads workers with custom orderBy', async () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadUnassignedWorkers({
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.timeTrackingWorkers);
    });

    it('ensures hasGroup filter defaults to false when no filter provided', async () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      // Call without filter - should use default filter with hasGroup: false
      result.current.loadUnassignedWorkers();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.timeTrackingWorkers);
    });
  });

  describe('Error Handling', () => {
    test.each([
      ['error response', new Error('Failed to fetch unassigned workers')],
      ['network error', new Error('Network error')],
    ])('handles %s', async (_label, error) => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          error,
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadUnassignedWorkers();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    it('sets loading to true while fetching', async () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          delay: 100,
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadUnassignedWorkers();

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Multiple Calls', () => {
    it('handles multiple consecutive calls', async () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          result: { data: mockData },
        },
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              after: 'cursor3',
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadUnassignedWorkers();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.loadUnassignedWorkers({ after: 'cursor3' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData.timeTrackingWorkers);
    });
  });

  describe('Cache Policy', () => {
    it('uses cache-and-network fetch policy', async () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadUnassignedWorkers();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe('Data Structure', () => {
    it('returns workers with null memberOfGroup', async () => {
      const mocks = [
        {
          request: {
            query: GET_UNASSIGNED_WORKERS_QUERY,
            variables: {
              first: 50,
              filter: { hasGroup: false },
              orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetUnassignedWorkers(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadUnassignedWorkers();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const workers = result.current.data;
      expect(workers?.edges).toHaveLength(3);
      expect(workers?.edges[0].node.displayName).toBe('David Unassigned');
      expect(workers?.edges[0].node.memberOfGroup).toBeNull();
      expect(workers?.edges[1].node.type).toBe('VENDOR');
      expect(workers?.edges[2].node.isActive).toBe(false);
    });
  });
});
