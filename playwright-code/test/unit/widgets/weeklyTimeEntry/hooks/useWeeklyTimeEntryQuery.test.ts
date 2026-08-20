import { renderHook } from '@testing-library/react-hooks';
import { useLazyQuery } from '@apollo/client';
import {
  useWeeklyTimeEntriesQuery,
  mapWeeklyTimeEntriesResult,
} from '../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntryQuery';
import { useWeeklyTimeEntryClient } from '../../../../../src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryApolloProvider';

// Mock dependencies
jest.mock('@apollo/client', () => ({
  useLazyQuery: jest.fn(),
  gql: jest.fn((template) => template),
}));

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryApolloProvider',
  () => ({
    useWeeklyTimeEntryClient: jest.fn(),
  }),
);

const mockUseLazyQuery = useLazyQuery as jest.MockedFunction<
  typeof useLazyQuery
>;
const mockUseWeeklyTimeEntryClient =
  useWeeklyTimeEntryClient as jest.MockedFunction<
    typeof useWeeklyTimeEntryClient
  >;

describe('useWeeklyTimeEntryQuery', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      query: jest.fn(),
      mutate: jest.fn(),
      watchQuery: jest.fn(),
    };

    mockUseWeeklyTimeEntryClient.mockReturnValue(mockClient);

    mockUseLazyQuery.mockReturnValue([
      jest.fn(),
      {
        loading: false,
        error: undefined,
        data: null,
        called: false,
        refetch: jest.fn(),
      } as any,
    ]);
  });

  describe('useWeeklyTimeEntriesQuery', () => {
    it('should call useWeeklyTimeEntryClient to get the client', () => {
      renderHook(() => useWeeklyTimeEntriesQuery());

      expect(mockUseWeeklyTimeEntryClient).toHaveBeenCalled();
    });

    it('should call useLazyQuery with correct parameters', () => {
      const baseOptions = {
        variables: {
          input: {
            timeEntryFilter: {
              date: {
                onOrAfter: '2024-01-01',
                onOrBefore: '2024-01-07',
              },
            },
          },
        },
      };

      renderHook(() => useWeeklyTimeEntriesQuery(baseOptions));

      expect(mockUseLazyQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'Document',
          definitions: expect.any(Array),
        }),
        {
          client: mockClient,
          fetchPolicy: 'no-cache',
          errorPolicy: 'all',
          ...baseOptions,
        },
      );
    });

    it('should return the result from useLazyQuery', () => {
      const mockResult = [jest.fn(), { loading: true, data: null }];
      mockUseLazyQuery.mockReturnValue(mockResult as any);

      const { result } = renderHook(() => useWeeklyTimeEntriesQuery());

      expect(result.current).toBe(mockResult);
    });

    it('should work without base options', () => {
      renderHook(() => useWeeklyTimeEntriesQuery());

      expect(mockUseLazyQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'Document',
          definitions: expect.any(Array),
        }),
        {
          client: mockClient,
          fetchPolicy: 'no-cache',
          errorPolicy: 'all',
        },
      );
    });

    it('should merge base options with default options', () => {
      const baseOptions = {
        fetchPolicy: 'cache-first' as const,
        notifyOnNetworkStatusChange: true,
        variables: {
          input: {
            orderBy: [
              { orderDirection: 'ASC' as const, orderOn: 'date' as const },
            ],
          },
        },
      };

      renderHook(() => useWeeklyTimeEntriesQuery(baseOptions));

      expect(mockUseLazyQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'Document',
          definitions: expect.any(Array),
        }),
        {
          client: mockClient,
          fetchPolicy: 'cache-first', // Should override default
          errorPolicy: 'all',
          notifyOnNetworkStatusChange: true,
          variables: baseOptions.variables,
        },
      );
    });

    it('should handle different client instances', () => {
      const differentClient = { query: jest.fn(), mutate: jest.fn() };
      mockUseWeeklyTimeEntryClient.mockReturnValue(differentClient as any);

      renderHook(() => useWeeklyTimeEntriesQuery());

      expect(mockUseLazyQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'Document',
          definitions: expect.any(Array),
        }),
        expect.objectContaining({
          client: differentClient,
        }),
      );
    });

    it('should preserve all base options', () => {
      const complexBaseOptions = {
        fetchPolicy: 'no-cache' as const,
        errorPolicy: 'all' as const,
        context: { important: true },
        onCompleted: jest.fn(),
        onError: jest.fn(),
        variables: {
          first: 50,
          after: 'cursor-123',
          offset: 0,
          input: {
            timeEntryFilter: {
              date: {
                onOrAfter: '2024-01-01',
                onOrBefore: '2024-01-07',
              },
              isExported: false,
              timeForEntityId: { equals: 'employee-123' },
            },
            orderBy: [
              { orderDirection: 'DESC' as const, orderOn: 'date' as const },
            ],
          },
        },
      };

      renderHook(() => useWeeklyTimeEntriesQuery(complexBaseOptions));

      expect(mockUseLazyQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'Document',
          definitions: expect.any(Array),
        }),
        {
          client: mockClient,
          ...complexBaseOptions,
        },
      );
    });
  });

  describe('mapWeeklyTimeEntriesResult', () => {
    it('should return empty array when data is undefined', () => {
      const result = mapWeeklyTimeEntriesResult(undefined as any);
      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', () => {
      const result = mapWeeklyTimeEntriesResult(null as any);
      expect(result).toEqual([]);
    });

    it('should return empty array when timeTrackingTimeEntries is undefined', () => {
      const data = {} as any;
      const result = mapWeeklyTimeEntriesResult(data);
      expect(result).toEqual([]);
    });

    it('should return empty array when timeTrackingTimeEntries is null', () => {
      const data = { timeTrackingTimeEntries: null } as any;
      const result = mapWeeklyTimeEntriesResult(data);
      expect(result).toEqual([]);
    });

    it('should return empty array when edges is undefined', () => {
      const data = { timeTrackingTimeEntries: {} } as any;
      const result = mapWeeklyTimeEntriesResult(data);
      expect(result).toEqual([]);
    });

    it('should return empty array when edges is null', () => {
      const data = { timeTrackingTimeEntries: { edges: null } } as any;
      const result = mapWeeklyTimeEntriesResult(data);
      expect(result).toEqual([]);
    });

    it('should return empty array when edges is empty', () => {
      const data = { timeTrackingTimeEntries: { edges: [] } } as any;
      const result = mapWeeklyTimeEntriesResult(data);
      expect(result).toEqual([]);
    });

    it('should map single time entry correctly', () => {
      const data = {
        timeTrackingTimeEntries: {
          edges: [
            {
              node: {
                id: 'entry-1',
                date: '2024-01-01',
                notes: 'Work on project',
                duration: 8,
              },
            },
          ],
        },
      } as any;

      const result = mapWeeklyTimeEntriesResult(data);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'entry-1',
        date: '2024-01-01',
        notes: 'Work on project',
        duration: 8,
      });
    });

    it('should map multiple time entries correctly', () => {
      const data = {
        timeTrackingTimeEntries: {
          edges: [
            { node: { id: 'entry-1', date: '2024-01-01' } },
            { node: { id: 'entry-2', date: '2024-01-02' } },
            { node: { id: 'entry-3', date: '2024-01-03' } },
          ],
        },
      } as any;

      const result = mapWeeklyTimeEntriesResult(data);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('entry-1');
      expect(result[1].id).toBe('entry-2');
      expect(result[2].id).toBe('entry-3');
    });

    it('should handle complex time entry data', () => {
      const data = {
        timeTrackingTimeEntries: {
          edges: [
            {
              node: {
                id: 'complex-entry',
                date: '2024-01-01',
                startTime: '09:00:00',
                endTime: '17:00:00',
                notes: 'Complex task with details',
                duration: 8,
                isExported: false,
                legacyCustomFields: [
                  { id: 'field-1', value: 'value-1' },
                  { id: 'field-2', value: 'value-2' },
                ],
                timeFor: {
                  id: 'employee-123',
                },
              },
            },
          ],
        },
      } as any;

      const result = mapWeeklyTimeEntriesResult(data);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'complex-entry',
        date: '2024-01-01',
        startTime: '09:00:00',
        endTime: '17:00:00',
        notes: 'Complex task with details',
        duration: 8,
        isExported: false,
        legacyCustomFields: [
          { id: 'field-1', value: 'value-1' },
          { id: 'field-2', value: 'value-2' },
        ],
        timeFor: {
          id: 'employee-123',
        },
      });
    });

    it('should handle mixed data quality', () => {
      const data = {
        timeTrackingTimeEntries: {
          edges: [
            {
              node: {
                id: 'entry-1',
                date: '2024-01-01',
                notes: 'Complete entry',
              },
            },
            { node: { id: 'entry-2' } }, // Minimal data
            { node: { id: 'entry-3', date: '2024-01-03', notes: null } }, // Null notes
          ],
        },
      } as any;

      const result = mapWeeklyTimeEntriesResult(data);

      expect(result).toHaveLength(3);
      expect((result[0] as any).notes).toBe('Complete entry');
      expect((result[1] as any).notes).toBeUndefined();
      expect((result[2] as any).notes).toBeNull();
    });

    it('should preserve all node properties', () => {
      const data = {
        timeTrackingTimeEntries: {
          edges: [
            {
              node: {
                id: 'preserve-test',
                stringProperty: 'test-string',
                numberProperty: 42,
                booleanProperty: true,
                objectProperty: { nested: 'value' },
                arrayProperty: [1, 2, 3],
                nullProperty: null,
                undefinedProperty: undefined,
              },
            },
          ],
        },
      } as any;

      const result = mapWeeklyTimeEntriesResult(data);

      expect(result).toHaveLength(1);
      expect((result[0] as any).stringProperty).toBe('test-string');
      expect((result[0] as any).numberProperty).toBe(42);
      expect((result[0] as any).booleanProperty).toBe(true);
      expect((result[0] as any).objectProperty).toEqual({ nested: 'value' });
      expect((result[0] as any).arrayProperty).toEqual([1, 2, 3]);
      expect((result[0] as any).nullProperty).toBeNull();
      expect((result[0] as any).undefinedProperty).toBeUndefined();
    });
  });

  describe('Integration tests', () => {
    it('should work with real-world query variables', () => {
      const realWorldOptions = {
        variables: {
          first: 100,
          offset: 0,
          input: {
            timeEntryFilter: {
              date: {
                onOrAfter: '2024-01-01T00:00:00.000Z',
                onOrBefore: '2024-01-07T23:59:59.999Z',
              },
              isExported: false,
              timeForEntityId: { equals: 'employee-abc-123' },
            },
            orderBy: [
              { orderDirection: 'ASC' as const, orderOn: 'date' as const },
              { orderDirection: 'ASC' as const, orderOn: 'startTime' as const },
            ],
          },
        },
        onCompleted: jest.fn(),
        onError: jest.fn(),
      };

      renderHook(() => useWeeklyTimeEntriesQuery(realWorldOptions));

      expect(mockUseLazyQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'Document',
          definitions: expect.any(Array),
        }),
        expect.objectContaining({
          variables: realWorldOptions.variables,
          onCompleted: realWorldOptions.onCompleted,
          onError: realWorldOptions.onError,
        }),
      );
    });

    it('should handle pagination scenarios', () => {
      const paginationOptions = {
        variables: {
          first: 25,
          after: 'cursor-page-2',
          offset: 25,
          input: {
            timeEntryFilter: {
              date: {
                onOrAfter: '2024-01-01',
                onOrBefore: '2024-01-31',
              },
            },
          },
        },
      };

      renderHook(() => useWeeklyTimeEntriesQuery(paginationOptions));

      expect(mockUseLazyQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'Document',
          definitions: expect.any(Array),
        }),
        expect.objectContaining({
          variables: paginationOptions.variables,
        }),
      );
    });
  });

  describe('Error scenarios', () => {
    it('should handle client being null', () => {
      mockUseWeeklyTimeEntryClient.mockReturnValue(null as any);

      renderHook(() => useWeeklyTimeEntriesQuery());

      expect(mockUseLazyQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'Document',
          definitions: expect.any(Array),
        }),
        expect.objectContaining({
          client: null,
        }),
      );
    });

    it('should handle malformed data in mapper by throwing error', () => {
      const malformedData = {
        timeTrackingTimeEntries: {
          edges: [
            { node: { id: 'valid-entry' } },
            null, // This will cause an error when trying to access edge.node
            { node: { id: 'another-valid-entry' } },
          ],
        },
      } as any;

      // The mapper will throw an error when it encounters null edges
      expect(() => {
        mapWeeklyTimeEntriesResult(malformedData);
      }).toThrow();
    });
  });
});
