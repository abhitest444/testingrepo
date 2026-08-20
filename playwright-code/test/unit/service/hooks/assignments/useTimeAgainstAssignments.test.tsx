import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useTimeAgainstAssignments } from 'src/js/service/hooks/assignments/useTimeAgainstAssignments';
import { TIME_AGAINST_ASSIGNMENTS_QUERY } from 'src/js/service/queries/timeTrackingAssignmentQueries';
import { getDefaultSandbox } from 'test/unit/testUtils';
import * as CustomerInteraction from 'src/js/common/CustomerInteraction';

// Mock the AssignmentApolloClient module
jest.mock('src/js/service/AssignmentApolloClient', () => ({
  getAssignmentApolloClient: jest.fn(() => null),
}));

// Mock CustomerInteraction module
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    TIME_AGAINST_ASSIGNMENT_READ: 'TIME_AGAINST_ASSIGNMENT_READ',
  },
}));

const mockData = {
  timeTrackingTimeAgainstAssignments: {
    edges: [
      {
        node: {
          timeAgainstContactDAS: {
            customer: { id: '1' },
            project: null,
          },
          assigned: true,
          displayName: 'Customer 1',
          fullName: 'Customer 1 Full',
          customerType: 'CUSTOMER',
          active: true,
          parentId: null,
          level: 0,
          numChildren: 2,
        },
        cursor: 'cursor1',
      },
      {
        node: {
          timeAgainstContactDAS: {
            customer: { id: '2' },
            project: { id: 'p1' },
          },
          assigned: false,
          displayName: 'Project 1',
          fullName: 'Customer 2:Project 1',
          customerType: 'PROJECT',
          active: true,
          parentId: '2',
          level: 1,
          numChildren: 0,
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
    totalTimeAgainstCount: 2,
  },
};

describe('useTimeAgainstAssignments', () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial loading state', () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.pageInfo).toBeNull();
      expect(result.current.totalTimeAgainstCount).toBeNull();
      expect(typeof result.current.loadTimeAgainstAssignments).toBe('function');
    });
  });

  describe('Loading Data', () => {
    it('loads data for timeForEntityId successfully', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].displayName).toBe('Customer 1');
      expect(result.current.data[1].displayName).toBe('Project 1');
      expect(result.current.error).toBeNull();
    });

    it('loads data for standardFieldLabel successfully', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { standardFieldLabel: 'CLASS' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { standardFieldLabel: 'CLASS' },
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
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                standardFieldLabel: 'LOCATION',
                standardFieldOption: 'location-option-456',
              },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: {
          standardFieldLabel: 'LOCATION',
          standardFieldOption: 'location-option-456',
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
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customFieldId: 'cf-123' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { customFieldId: 'cf-123' },
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
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              after: 'cursor1',
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        after: 'cursor1',
        input: { timeForEntityId: 'entity-1' },
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
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
              filter: { assigned: true },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
        filter: { assigned: true },
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
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
              filter: { searchText: 'Customer' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
        filter: { searchText: 'Customer' },
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
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
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

    it('returns totalTimeAgainstCount correctly', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalTimeAgainstCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test.each([
      ['GraphQL error', new Error('Failed to fetch assignments')],
      ['network error', new Error('Network error')],
    ])('handles %s', async (_label, error) => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          error,
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
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
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          delay: 100,
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(
        () => {
          expect(result.current.loading).toBe(true);
        },
        { timeout: 2000 },
      );

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Data Transformation', () => {
    it('transforms data correctly with all fields', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstItem = result.current.data[0];
      expect(firstItem.timeAgainstContactDAS.customer?.id).toBe('1');
      expect(firstItem.assigned).toBe(true);
      expect(firstItem.displayName).toBe('Customer 1');
      expect(firstItem.fullName).toBe('Customer 1 Full');
      expect(firstItem.customerType).toBe('CUSTOMER');
      expect(firstItem.active).toBe(true);
      expect(firstItem.level).toBe(0);
      expect(firstItem.numChildren).toBe(2);
    });

    it('handles empty edges', async () => {
      const emptyData = {
        timeTrackingTimeAgainstAssignments: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalTimeAgainstCount: 0,
        },
      };

      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: emptyData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('Fetch Policy', () => {
    it('uses cache-and-network by default', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('supports network-only fetch policy', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
        fetchPolicy: 'network-only',
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('supports no-cache fetch policy', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
        fetchPolicy: 'no-cache',
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('supports cache-first fetch policy', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
        fetchPolicy: 'cache-first',
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('Custom Field Option ID', () => {
    it('loads data for customFieldOptionId successfully', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { customFieldOptionId: 'opt-456' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { customFieldOptionId: 'opt-456' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('loads data for both customFieldId and customFieldOptionId', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                customFieldId: 'cf-123',
                customFieldOptionId: 'opt-456',
              },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: {
          customFieldId: 'cf-123',
          customFieldOptionId: 'opt-456',
        },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('Customer Interaction Tracking', () => {
    it('creates customer interaction on load', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      expect(
        CustomerInteraction.createCustomerInteraction,
      ).toHaveBeenCalledWith(
        sandbox,
        CustomerInteraction.TimeCustomerInteraction
          .TIME_AGAINST_ASSIGNMENT_READ,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('ends interaction with success on successful load', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        CustomerInteraction.endInteractionWithSuccess,
      ).toHaveBeenCalledWith(
        sandbox,
        CustomerInteraction.TimeCustomerInteraction
          .TIME_AGAINST_ASSIGNMENT_READ,
      );
    });

    it('ends interaction with failure on error', async () => {
      const errorMessage = 'Failed to fetch assignments';
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          error: new Error(errorMessage),
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(
        CustomerInteraction.endInteractionWithFailure,
      ).toHaveBeenCalledWith(
        sandbox,
        CustomerInteraction.TimeCustomerInteraction
          .TIME_AGAINST_ASSIGNMENT_READ,
        errorMessage,
        expect.any(Error),
      );
    });

    it('includes customer interaction headers in request context', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      expect(
        CustomerInteraction.getCustomerInteractionPropagationHeaders,
      ).toHaveBeenCalledWith(
        sandbox,
        CustomerInteraction.TimeCustomerInteraction
          .TIME_AGAINST_ASSIGNMENT_READ,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles null pageInfo gracefully', async () => {
      const dataWithoutPageInfo = {
        timeTrackingTimeAgainstAssignments: {
          edges: mockData.timeTrackingTimeAgainstAssignments.edges,
          pageInfo: null,
          totalTimeAgainstCount: 2,
        },
      };

      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: dataWithoutPageInfo },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pageInfo).toBeNull();
      expect(result.current.data).toHaveLength(2);
    });

    it('handles missing cursor values in pageInfo', async () => {
      const dataWithPartialPageInfo = {
        timeTrackingTimeAgainstAssignments: {
          edges: mockData.timeTrackingTimeAgainstAssignments.edges,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalTimeAgainstCount: 2,
        },
      };

      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: dataWithPartialPageInfo },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
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

    it('handles undefined totalTimeAgainstCount', async () => {
      const dataWithoutCount = {
        timeTrackingTimeAgainstAssignments: {
          edges: mockData.timeTrackingTimeAgainstAssignments.edges,
          pageInfo: mockData.timeTrackingTimeAgainstAssignments.pageInfo,
          totalTimeAgainstCount: undefined,
        },
      };

      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: dataWithoutCount },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalTimeAgainstCount).toBeNull();
    });

    it('handles combined filters (assigned and searchText)', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: { timeForEntityId: 'entity-1' },
              filter: {
                assigned: true,
                searchText: 'Customer',
              },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: { timeForEntityId: 'entity-1' },
        filter: {
          assigned: true,
          searchText: 'Customer',
        },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('handles custom first parameter', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 50,
              input: { timeForEntityId: 'entity-1' },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 50,
        input: { timeForEntityId: 'entity-1' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('Multiple Input Types', () => {
    it('handles multiple input fields simultaneously', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                timeForEntityId: 'entity-1',
                standardFieldLabel: 'CLASS',
                customFieldId: 'cf-123',
              },
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        first: 100,
        input: {
          timeForEntityId: 'entity-1',
          standardFieldLabel: 'CLASS',
          customFieldId: 'cf-123',
        },
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
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {},
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        input: {},
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(sandbox.logger.info).toHaveBeenCalledWith(
        'Component=useTimeAgainstAssignments Event=Successfully fetched time against assignments',
      );
    });

    it('logs error on query failure', async () => {
      const mocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {},
            },
          },
          error: new Error('Failed to fetch'),
        },
      ];

      const { result } = renderHook(() => useTimeAgainstAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadTimeAgainstAssignments({
        input: {},
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(sandbox.logger.error).toHaveBeenCalledWith(
        'Component=useTimeAgainstAssignments Event=Error fetching time against assignments',
        { error: 'Failed to fetch' },
      );
    });
  });
});
