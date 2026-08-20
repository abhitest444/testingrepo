import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useGetCustomFieldsForAssignments } from 'src/js/service/hooks/assignments/useGetCustomFieldsForAssignments';
import { GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY } from 'src/js/service/queries/timeTrackingQueries';
import { getDefaultSandbox } from 'test/unit/testUtils';

const mockData = {
  timeTrackingCustomFields: {
    edges: [
      {
        node: {
          id: 'cf-1',
          name: 'Project Code',
          type: 'TEXT',
          deleted: false,
          required: true,
        },
        cursor: 'cursor-1',
      },
      {
        node: {
          id: 'cf-2',
          name: 'Cost Center',
          type: 'DROPDOWN',
          deleted: false,
          required: false,
        },
        cursor: 'cursor-2',
      },
      {
        node: {
          id: 'cf-3',
          name: 'Work Order',
          type: 'NUMBER',
          deleted: false,
          required: true,
        },
        cursor: 'cursor-3',
      },
    ],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: 'cursor-1',
      endCursor: 'cursor-3',
    },
  },
};

const mockEmptyData = {
  timeTrackingCustomFields: {
    edges: [],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
  },
};

describe('useGetCustomFieldsForAssignments', () => {
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

  describe('Hook - Initial State', () => {
    it('should return initial loading state', () => {
      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.customFields).toEqual([]);
      expect(result.current.error).toBeUndefined();
      expect(typeof result.current.loadCustomFieldsForAssignments).toBe(
        'function',
      );
    });
  });

  describe('Hook - Loading Data', () => {
    it('should load custom fields metadata successfully', async () => {
      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customFields).toEqual([
        {
          id: 'cf-1',
          name: 'Project Code',
          type: 'TEXT',
          deleted: false,
          required: true,
        },
        {
          id: 'cf-2',
          name: 'Cost Center',
          type: 'DROPDOWN',
          deleted: false,
          required: false,
        },
        {
          id: 'cf-3',
          name: 'Work Order',
          type: 'NUMBER',
          deleted: false,
          required: true,
        },
      ]);
      expect(result.current.error).toBeUndefined();
    });

    it('should load all custom fields including deleted ones', async () => {
      const dataWithDeleted = {
        timeTrackingCustomFields: {
          edges: [
            {
              node: {
                id: 'cf-1',
                name: 'Active Field',
                type: 'TEXT',
                deleted: false,
                required: true,
              },
              cursor: 'cursor-1',
            },
            {
              node: {
                id: 'cf-2',
                name: 'Deleted Field',
                type: 'TEXT',
                deleted: true,
                required: false,
              },
              cursor: 'cursor-2',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor-1',
            endCursor: 'cursor-2',
          },
        },
      };

      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: dataWithDeleted },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customFields).toHaveLength(2);
      expect(result.current.customFields[1].deleted).toBe(true);
    });

    it('should handle empty results', async () => {
      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: mockEmptyData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customFields).toEqual([]);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Hook - Error Handling', () => {
    test.each([
      ['GraphQL error', new Error('GraphQL error occurred')],
      ['network error', new Error('Network error: Failed to fetch')],
      ['server error', new Error('Internal Server Error')],
    ])('should handle %s', async (_label, error) => {
      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          error,
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.customFields).toEqual([]);
    });
  });

  describe('Hook - Loading State', () => {
    it('should set loading to true while fetching', async () => {
      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          delay: 100,
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should maintain loading=false before load is called', () => {
      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Hook - Data Scenarios', () => {
    it('should handle custom fields with various types', async () => {
      const variedTypesData = {
        timeTrackingCustomFields: {
          edges: [
            {
              node: {
                id: 'cf-text',
                name: 'Text Field',
                type: 'TEXT',
                deleted: false,
                required: true,
              },
            },
            {
              node: {
                id: 'cf-number',
                name: 'Number Field',
                type: 'NUMBER',
                deleted: false,
                required: false,
              },
            },
            {
              node: {
                id: 'cf-dropdown',
                name: 'Dropdown Field',
                type: 'DROPDOWN',
                deleted: false,
                required: true,
              },
            },
            {
              node: {
                id: 'cf-date',
                name: 'Date Field',
                type: 'DATE',
                deleted: false,
                required: false,
              },
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
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: variedTypesData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customFields).toHaveLength(4);
      expect(result.current.customFields.map((cf) => cf.type)).toEqual([
        'TEXT',
        'NUMBER',
        'DROPDOWN',
        'DATE',
      ]);
    });

    it('should handle custom fields with long names', async () => {
      const longNameData = {
        timeTrackingCustomFields: {
          edges: [
            {
              node: {
                id: 'cf-long',
                name: 'This is a very long custom field name that might be used in some organizations to provide detailed descriptions',
                type: 'TEXT',
                deleted: false,
                required: true,
              },
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
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: longNameData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customFields[0].name.length).toBeGreaterThan(50);
    });

    it('should handle special characters in field names', async () => {
      const specialCharsData = {
        timeTrackingCustomFields: {
          edges: [
            {
              node: {
                id: 'cf-special',
                name: 'Field w/ Special Chars: @#$%&*()_+-=[]{}|;\':",./<>?',
                type: 'TEXT',
                deleted: false,
                required: false,
              },
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
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: specialCharsData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customFields[0].name).toContain('@#$%&*()_+-=');
    });
  });

  describe('Hook - Load Function', () => {
    it('should return a callable load function', () => {
      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      expect(typeof result.current.loadCustomFieldsForAssignments).toBe(
        'function',
      );
    });

    it('should allow load to be called multiple times', async () => {
      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: mockData },
        },
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: mockEmptyData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      // First call
      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.customFields).toHaveLength(3);
      });

      // Second call
      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.customFields).toHaveLength(0);
      });
    });
  });

  describe('Logging', () => {
    it('logs info on successful query', async () => {
      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          result: { data: mockData },
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(sandbox.logger.info).toHaveBeenCalledWith(
        'Component=useGetCustomFieldsForAssignments Event=Successfully fetched custom fields for assignments',
      );
    });

    it('logs error on query failure', async () => {
      const mocks = [
        {
          request: {
            query: GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY,
            variables: {
              filter: {},
            },
          },
          error: new Error('Failed to fetch'),
        },
      ];

      const { result } = renderHook(() => useGetCustomFieldsForAssignments(), {
        wrapper: createWrapper(mocks),
      });

      result.current.loadCustomFieldsForAssignments();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(sandbox.logger.error).toHaveBeenCalledWith(
        'Component=useGetCustomFieldsForAssignments Event=Error fetching custom fields for assignments',
        { error: 'Failed to fetch' },
      );
    });
  });
});
