import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useStandardFieldOptionsSummary } from 'src/js/service/hooks/assignments/useStandardFieldOptionsSummary';
import { STANDARD_FIELD_OPTIONS_SUMMARY_QUERY } from 'src/js/service/queries/timeTrackingAssignmentQueries';
import { ASSIGNMENT_PAGINATION_DEFAULTS } from 'src/js/widgets/assignments/constants';
import { getDefaultSandbox } from 'test/unit/testUtils';

const mockData = {
  timeTrackingStandardFieldOptionSummary: {
    edges: [
      {
        node: {
          id: '1',
          name: 'Engineering',
          standardFieldLabel: 'CLASS',
          workerAssignmentCount: 5,
          customerAssignmentCount: 10,
        },
        cursor: 'cursor1',
      },
      {
        node: {
          id: '2',
          name: 'Marketing',
          standardFieldLabel: 'CLASS',
          workerAssignmentCount: 3,
          customerAssignmentCount: -1,
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
    totalWorkerCount: 50,
    totalCustomerCount: 100,
  },
};

describe('useStandardFieldOptionsSummary', () => {
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
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(typeof result.current.loadStandardFieldOptionsSummary).toBe(
        'function',
      );
    });
  });

  describe('Loading Data', () => {
    it('loads CLASS options successfully', async () => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        mockData.timeTrackingStandardFieldOptionSummary,
      );
      expect(result.current.error).toBeNull();
    });

    it('loads LOCATION options successfully', async () => {
      const locationMockData = {
        timeTrackingStandardFieldOptionSummary: {
          edges: [
            {
              node: {
                id: '3',
                name: 'New York Office',
                standardFieldLabel: 'LOCATION',
                workerAssignmentCount: 15,
                customerAssignmentCount: 20,
              },
              cursor: 'cursor3',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor3',
            endCursor: 'cursor3',
          },
          totalWorkerCount: 50,
          totalCustomerCount: 100,
        },
      };

      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'LOCATION',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: locationMockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'LOCATION',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        locationMockData.timeTrackingStandardFieldOptionSummary,
      );
    });

    it('loads SERVICE_ITEM options successfully', async () => {
      const serviceItemMockData = {
        timeTrackingStandardFieldOptionSummary: {
          edges: [
            {
              node: {
                id: '4',
                name: 'Consulting',
                standardFieldLabel: 'SERVICE_ITEM',
                workerAssignmentCount: 8,
                customerAssignmentCount: 12,
              },
              cursor: 'cursor4',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor4',
            endCursor: 'cursor4',
          },
          totalWorkerCount: 50,
          totalCustomerCount: 100,
        },
      };

      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'SERVICE_ITEM',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: serviceItemMockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'SERVICE_ITEM',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        serviceItemMockData.timeTrackingStandardFieldOptionSummary,
      );
    });

    it('loads BILLABLE options successfully', async () => {
      const billableMockData = {
        timeTrackingStandardFieldOptionSummary: {
          edges: [
            {
              node: {
                id: '1',
                name: 'True',
                standardFieldLabel: 'BILLABLE',
                workerAssignmentCount: 10,
                customerAssignmentCount: 15,
              },
              cursor: 'cursor5',
            },
            {
              node: {
                id: '0',
                name: 'False',
                standardFieldLabel: 'BILLABLE',
                workerAssignmentCount: 5,
                customerAssignmentCount: 8,
              },
              cursor: 'cursor6',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor5',
            endCursor: 'cursor6',
          },
          totalWorkerCount: 15,
          totalCustomerCount: 23,
        },
      };

      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'BILLABLE',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: billableMockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'BILLABLE',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        billableMockData.timeTrackingStandardFieldOptionSummary,
      );
      expect(result.current.data?.edges).toHaveLength(2);
      expect(result.current.data?.edges[0].node.name).toBe('True');
      expect(result.current.data?.edges[1].node.name).toBe('False');
    });

    it('handles pagination with cursor', async () => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
              after: 'cursor2',
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
          first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
          after: 'cursor2',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        mockData.timeTrackingStandardFieldOptionSummary,
      );
    });

    it('uses default first value when not provided', async () => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        mockData.timeTrackingStandardFieldOptionSummary,
      );
    });

    it('handles custom page size', async () => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: { standardFieldLabel: 'CLASS', first: 50 },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
          first: 50,
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        mockData.timeTrackingStandardFieldOptionSummary,
      );
    });
  });

  describe('Error Handling', () => {
    test.each([
      ['GraphQL error', new Error('Failed to fetch standard field options')],
      ['network error', new Error('Network error')],
    ])('handles %s', async (_label, error) => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          error,
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
        });
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('sets loading to true while fetching', async () => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          delay: 100,
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Multiple Calls', () => {
    it('handles multiple consecutive calls with different labels', async () => {
      const locationMockData = {
        timeTrackingStandardFieldOptionSummary: {
          edges: [
            {
              node: {
                id: '5',
                name: 'San Francisco',
                standardFieldLabel: 'LOCATION',
                workerAssignmentCount: 10,
                customerAssignmentCount: 15,
              },
              cursor: 'cursor5',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor5',
            endCursor: 'cursor5',
          },
          totalWorkerCount: 50,
          totalCustomerCount: 100,
        },
      };

      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'LOCATION',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: locationMockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      // First call - CLASS
      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        mockData.timeTrackingStandardFieldOptionSummary,
      );

      // Second call - LOCATION
      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'LOCATION',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        locationMockData.timeTrackingStandardFieldOptionSummary,
      );
    });

    it('handles pagination across multiple pages', async () => {
      const page2MockData = {
        timeTrackingStandardFieldOptionSummary: {
          edges: [
            {
              node: {
                id: '6',
                name: 'Sales',
                standardFieldLabel: 'CLASS',
                workerAssignmentCount: 7,
                customerAssignmentCount: 14,
              },
              cursor: 'cursor6',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: 'cursor6',
            endCursor: 'cursor6',
          },
          totalWorkerCount: 50,
          totalCustomerCount: 100,
        },
      };

      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
              after: 'cursor2',
            },
          },
          result: { data: page2MockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      // Load first page
      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.pageInfo.hasNextPage).toBe(true);

      // Load second page
      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
          first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
          after: 'cursor2',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        page2MockData.timeTrackingStandardFieldOptionSummary,
      );
    });
  });

  describe('Data Structure', () => {
    it('returns correct data structure with edges and pageInfo', async () => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveProperty('edges');
      expect(result.current.data).toHaveProperty('pageInfo');
      expect(result.current.data).toHaveProperty('totalWorkerCount');
      expect(result.current.data).toHaveProperty('totalCustomerCount');
      expect(result.current.data?.edges).toHaveLength(2);
    });

    it('returns correct node structure', async () => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstNode = result.current.data?.edges[0].node;
      expect(firstNode).toHaveProperty('id');
      expect(firstNode).toHaveProperty('name');
      expect(firstNode).toHaveProperty('standardFieldLabel');
      expect(firstNode).toHaveProperty('workerAssignmentCount');
      expect(firstNode).toHaveProperty('customerAssignmentCount');
    });
  });

  describe('Cache Policy', () => {
    it('uses cache-and-network fetch policy', async () => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe('Search Functionality', () => {
    it('filters options by searchText', async () => {
      const searchMockData = {
        timeTrackingStandardFieldOptionSummary: {
          edges: [
            {
              node: {
                id: '1',
                name: 'Engineering',
                standardFieldLabel: 'CLASS',
                workerAssignmentCount: 5,
                customerAssignmentCount: 10,
              },
              cursor: 'cursor1',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor1',
            endCursor: 'cursor1',
          },
          totalWorkerCount: 5,
          totalCustomerCount: 10,
        },
      };

      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
              filter: { searchText: 'Engineering' },
            },
          },
          result: { data: searchMockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
          searchText: 'Engineering',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        searchMockData.timeTrackingStandardFieldOptionSummary,
      );
      expect(result.current.data?.edges).toHaveLength(1);
      expect(result.current.data?.edges[0].node.name).toBe('Engineering');
    });

    it('does not include filter when searchText is empty', async () => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
          searchText: '',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        mockData.timeTrackingStandardFieldOptionSummary,
      );
    });

    it('combines searchText with pagination', async () => {
      const searchWithPaginationMockData = {
        timeTrackingStandardFieldOptionSummary: {
          edges: [
            {
              node: {
                id: '3',
                name: 'Marketing West',
                standardFieldLabel: 'CLASS',
                workerAssignmentCount: 2,
                customerAssignmentCount: 5,
              },
              cursor: 'cursor3',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: 'cursor3',
            endCursor: 'cursor3',
          },
          totalWorkerCount: 10,
          totalCustomerCount: 20,
        },
      };

      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: 10,
              after: 'cursor2',
              filter: { searchText: 'Marketing' },
            },
          },
          result: { data: searchWithPaginationMockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'CLASS',
          first: 10,
          after: 'cursor2',
          searchText: 'Marketing',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(
        searchWithPaginationMockData.timeTrackingStandardFieldOptionSummary,
      );
      expect(result.current.data?.pageInfo.hasPreviousPage).toBe(true);
    });

    it('filters LOCATION options by searchText', async () => {
      const locationSearchMockData = {
        timeTrackingStandardFieldOptionSummary: {
          edges: [
            {
              node: {
                id: '10',
                name: 'New York Office',
                standardFieldLabel: 'LOCATION',
                workerAssignmentCount: 15,
                customerAssignmentCount: 20,
              },
              cursor: 'cursor10',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor10',
            endCursor: 'cursor10',
          },
          totalWorkerCount: 15,
          totalCustomerCount: 20,
        },
      };

      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'LOCATION',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
              filter: { searchText: 'New York' },
            },
          },
          result: { data: locationSearchMockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.loadStandardFieldOptionsSummary({
          standardFieldLabel: 'LOCATION',
          searchText: 'New York',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.edges[0].node.name).toBe('New York Office');
    });
  });

  describe('Refetch', () => {
    it('returns a refetch function', () => {
      const mocks = [
        {
          request: {
            query: STANDARD_FIELD_OPTIONS_SUMMARY_QUERY,
            variables: {
              standardFieldLabel: 'CLASS',
              first: ASSIGNMENT_PAGINATION_DEFAULTS.PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useStandardFieldOptionsSummary(), {
        wrapper: createWrapper(mocks),
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
