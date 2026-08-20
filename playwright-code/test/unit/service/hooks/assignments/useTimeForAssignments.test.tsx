import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useTimeForAssignments } from 'src/js/service/hooks/assignments/useTimeForAssignments';
import { TIME_FOR_ASSIGNMENTS_QUERY } from 'src/js/service/queries/timeTrackingAssignmentQueries';
import { getDefaultSandbox } from 'test/unit/testUtils';

// Mock the AssignmentApolloClient module
jest.mock('src/js/service/AssignmentApolloClient', () => ({
  getAssignmentApolloClient: jest.fn(() => null),
}));

const mockData = {
  timeTrackingTimeForAssignments: {
    edges: [
      {
        node: {
          timeForContactDAS: {
            id: 'worker-1',
          },
          assigned: true,
          displayName: 'John Doe',
          fullName: 'John Michael Doe',
          contractor: false,
        },
        cursor: 'cursor1',
      },
      {
        node: {
          timeForContactDAS: {
            id: 'worker-2',
          },
          assigned: false,
          displayName: 'Jane Smith',
          fullName: 'Jane Elizabeth Smith',
          contractor: true,
        },
        cursor: 'cursor2',
      },
    ],
    pageInfo: {
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: 'cursor1',
      endCursor: 'cursor2',
    },
  },
};

describe('useTimeForAssignments', () => {
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
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.pageInfo).toBeNull();
      expect(typeof result.current.loadTimeForAssignments).toBe('function');
    });
  });

  describe('Loading Data', () => {
    it('loads data for customerId successfully', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].displayName).toBe('John Doe');
      expect(result.current.data[1].displayName).toBe('Jane Smith');
      expect(result.current.error).toBeNull();
    });

    it('loads data for projectId successfully', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { projectId: 'project-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { projectId: 'project-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('loads data for customFieldOptionId successfully', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                customFieldOptionId: 'option-123',
                customFieldId: 'cf-123',
              },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: {
          customFieldOptionId: 'option-123',
          customFieldId: 'cf-123',
        },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('loads data for customFieldId successfully', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customFieldId: 'cf-123' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customFieldId: 'cf-123' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('loads data for standardFieldLabel successfully', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { standardFieldLabel: 'BILLABLE' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { standardFieldLabel: 'BILLABLE' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('loads data for standardFieldOption with standardFieldLabel successfully', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                standardFieldLabel: 'CLASS',
                standardFieldOption: 'class-option-123',
              },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: {
          standardFieldLabel: 'CLASS',
          standardFieldOption: 'class-option-123',
        },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('handles pagination with cursor', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              after: 'cursor1',
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        after: 'cursor1',
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.pageInfo?.hasNextPage).toBe(true);
      expect(result.current.pageInfo?.endCursor).toBe('cursor2');
    });

    it('filters by assigned status', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
              filter: { assigned: true },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
        filter: { assigned: true },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('filters by assigned false status', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
              filter: { assigned: false },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
        filter: { assigned: false },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('filters by searchText', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
              filter: { searchText: 'John' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
        filter: { searchText: 'John' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('uses custom first parameter', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 50,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 50,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('uses custom fetchPolicy', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
        fetchPolicy: 'network-only',
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('combines multiple filters', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
              filter: {
                assigned: true,
                searchText: 'John',
              },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
        filter: {
          assigned: true,
          searchText: 'John',
        },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('PageInfo', () => {
    it('returns pageInfo correctly', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'cursor1',
        endCursor: 'cursor2',
      });
    });

    it('handles pageInfo with null cursors', async () => {
      const dataWithNullCursors = {
        timeTrackingTimeForAssignments: {
          edges: [
            {
              node: {
                timeForContactDAS: { id: 'worker-1' },
                assigned: true,
                displayName: 'John Doe',
                fullName: 'John Michael Doe',
                contractor: false,
              },
              cursor: 'cursor1',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      };

      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: dataWithNullCursors },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pageInfo).toEqual({
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: undefined,
        endCursor: undefined,
      });
    });

    it('returns null pageInfo when no data', () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.pageInfo).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test.each([
      ['GraphQL error', new Error('Failed to fetch worker assignments')],
      ['network error', new Error('Network error')],
      ['GraphQL validation error', new Error('GraphQL error: Invalid input')],
    ])('handles %s', async (_label, error) => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          error,
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('Loading State', () => {
    it('sets loading to true while fetching', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          delay: 100,
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('resets loading after successful fetch', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(false);

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('Data Transformation', () => {
    it('transforms data correctly with all fields', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstWorker = result.current.data[0];
      expect(firstWorker.timeForContactDAS.id).toBe('worker-1');
      expect(firstWorker.assigned).toBe(true);
      expect(firstWorker.displayName).toBe('John Doe');
      expect(firstWorker.fullName).toBe('John Michael Doe');
      expect(firstWorker.contractor).toBe(false);

      const secondWorker = result.current.data[1];
      expect(secondWorker.timeForContactDAS.id).toBe('worker-2');
      expect(secondWorker.assigned).toBe(false);
      expect(secondWorker.displayName).toBe('Jane Smith');
      expect(secondWorker.fullName).toBe('Jane Elizabeth Smith');
      expect(secondWorker.contractor).toBe(true);
    });

    it('handles empty edges', async () => {
      const emptyData = {
        timeTrackingTimeForAssignments: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      };

      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: emptyData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles null data response', async () => {
      const nullData = {
        timeTrackingTimeForAssignments: null,
      };

      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: nullData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.pageInfo).toBeNull();
    });

    it('handles missing edges field', async () => {
      const dataWithoutEdges = {
        timeTrackingTimeForAssignments: {
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      };

      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: dataWithoutEdges },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles missing pageInfo field', async () => {
      const dataWithoutPageInfo = {
        timeTrackingTimeForAssignments: {
          edges: [
            {
              node: {
                timeForContactDAS: { id: 'worker-1' },
                assigned: true,
                displayName: 'John Doe',
                fullName: 'John Michael Doe',
                contractor: false,
              },
              cursor: 'cursor1',
            },
          ],
        },
      };

      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: dataWithoutPageInfo },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.pageInfo).toBeNull();
    });

    it('handles optional fields in node data', async () => {
      const minimalData = {
        timeTrackingTimeForAssignments: {
          edges: [
            {
              node: {
                timeForContactDAS: { id: 'worker-1' },
                assigned: false,
              },
              cursor: 'cursor1',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      };

      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: minimalData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const worker = result.current.data[0];
      expect(worker.timeForContactDAS.id).toBe('worker-1');
      expect(worker.assigned).toBe(false);
      expect(worker.displayName).toBeUndefined();
      expect(worker.fullName).toBeUndefined();
      expect(worker.contractor).toBeUndefined();
    });
  });

  describe('Multiple Calls', () => {
    it('handles multiple sequential calls', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customerId: 'customer-1' },
            },
          },
          result: { data: mockData },
        },
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { projectId: 'project-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      // First call
      result.current.loadTimeForAssignments({
        first: 100,
        input: { customerId: 'customer-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);

      // Second call
      result.current.loadTimeForAssignments({
        first: 100,
        input: { projectId: 'project-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('Logging', () => {
    it('logs info on successful query', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {},
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        input: {},
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(sandbox.logger.info).toHaveBeenCalledWith(
        'Component=useTimeForAssignments Event=Successfully fetched time for assignments',
      );
    });

    it('logs error on query failure', async () => {
      const mocks = [
        {
          request: {
            query: TIME_FOR_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {},
            },
          },
          error: new Error('Failed to fetch'),
        },
      ];

      const { result } = renderHook(() => useTimeForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeForAssignments({
        input: {},
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(sandbox.logger.error).toHaveBeenCalledWith(
        'Component=useTimeForAssignments Event=Error fetching time for assignments',
        { error: 'Failed to fetch' },
      );
    });
  });
});
