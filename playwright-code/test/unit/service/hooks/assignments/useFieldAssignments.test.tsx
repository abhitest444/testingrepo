import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useStandardFieldAssignments } from 'src/js/service/hooks/assignments/useStandardFieldAssignments';
import { useCustomFieldAssignments } from 'src/js/service/hooks/assignments/useCustomFieldAssignments';
import {
  GET_STANDARD_FIELD_ASSIGNMENTS_QUERY,
  GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY,
} from 'src/js/service/queries/timeTrackingAssignmentQueries';
import { getDefaultSandbox } from 'test/unit/testUtils';
import {
  mockStandardFieldAssignmentsData,
  mockCustomFieldAssignmentsData,
  mockEmptyAssignmentsData,
} from 'test/unit/fixtures';

describe.each([
  {
    label: 'standard field',
    hookFn: useStandardFieldAssignments,
    query: GET_STANDARD_FIELD_ASSIGNMENTS_QUERY,
    dataKey: 'timeTrackingStandardFieldAssignments',
    mockData: mockStandardFieldAssignmentsData,
    loadFnName: 'loadStandardFieldAssignments',
    logSuccessMsg:
      'Component=useStandardFieldAssignments Event=Successfully fetched standard field assignments data',
    logErrorMsg:
      'Component=useStandardFieldAssignments Event=Error fetching standard field assignments data',
  },
  {
    label: 'custom field',
    hookFn: useCustomFieldAssignments,
    query: GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY,
    dataKey: 'timeTrackingCustomFieldAssignments',
    mockData: mockCustomFieldAssignmentsData,
    loadFnName: 'loadCustomFieldAssignments',
    logSuccessMsg:
      'Component=useCustomFieldAssignments Event=Successfully fetched custom field assignments',
    logErrorMsg:
      'Component=useCustomFieldAssignments Event=Error fetching custom field assignments',
  },
])(
  '$label',
  ({
    hookFn,
    query,
    dataKey,
    mockData,
    loadFnName,
    logSuccessMsg,
    logErrorMsg,
  }) => {
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
              query,
              variables: {
                first: 100,
                input: { customerId: 'customer-123' },
              },
            },
            result: { data: mockData },
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.data).toEqual([]);
        expect(result.current.error).toBe(null);
        expect(result.current.pageInfo).toBe(null);
        expect(typeof (result.current as any)[loadFnName]).toBe('function');
      });
    });

    describe('Loading Data', () => {
      it('loads field assignments for a customer', async () => {
        const mocks = [
          {
            request: {
              query,
              variables: {
                first: 100,
                input: { customerId: 'customer-123' },
              },
            },
            result: { data: mockData },
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { customerId: 'customer-123' },
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toHaveLength(3);
        expect(result.current.pageInfo).toEqual({
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'cursor-1',
          endCursor: 'cursor-3',
        });
        expect(result.current.error).toBe(null);
      });

      it('loads field assignments for a project', async () => {
        const mocks = [
          {
            request: {
              query,
              variables: {
                first: 100,
                input: { projectId: 'project-456' },
              },
            },
            result: { data: mockData },
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { projectId: 'project-456' },
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toHaveLength(3);
        expect(result.current.error).toBe(null);
      });

      it('filters by assigned status', async () => {
        const mocks = [
          {
            request: {
              query,
              variables: {
                first: 100,
                input: { customerId: 'customer-123' },
                filter: { assigned: true },
              },
            },
            result: { data: mockData },
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { customerId: 'customer-123' },
          filter: { assigned: true },
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toHaveLength(3);
      });

      it('handles pagination with custom first parameter', async () => {
        const mocks = [
          {
            request: {
              query,
              variables: {
                first: 50,
                after: 'cursor-3',
                input: { customerId: 'customer-123' },
              },
            },
            result: { data: mockData },
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { customerId: 'customer-123' },
          first: 50,
          after: 'cursor-3',
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toHaveLength(3);
      });

      it('uses default first parameter of 100', async () => {
        const mocks = [
          {
            request: {
              query,
              variables: {
                first: 100,
                input: { customerId: 'customer-123' },
              },
            },
            result: { data: mockData },
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { customerId: 'customer-123' },
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toHaveLength(3);
      });

      it('handles empty results', async () => {
        const emptyMockData = { [dataKey]: mockEmptyAssignmentsData };

        const mocks = [
          {
            request: {
              query,
              variables: {
                first: 100,
                input: { customerId: 'customer-empty' },
              },
            },
            result: { data: emptyMockData },
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { customerId: 'customer-empty' },
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.pageInfo).toEqual({
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: undefined,
          endCursor: undefined,
        });
      });
    });

    describe('Error Handling', () => {
      test.each([
        ['GraphQL error', new Error('Network error')],
        ['network error', new Error('Failed to fetch')],
      ])('handles %s', async (_label, error) => {
        const mocks = [
          {
            request: {
              query,
              variables: {
                first: 100,
                input: { customerId: 'customer-123' },
              },
            },
            error,
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { customerId: 'customer-123' },
        });

        await waitFor(() => {
          expect(result.current.error).toBeTruthy();
        });

        expect(result.current.error).toBe(error.message);
        expect(result.current.data).toEqual([]);
      });
    });

    describe('Loading State', () => {
      it('sets loading to true while fetching', async () => {
        const mocks = [
          {
            request: {
              query,
              variables: {
                first: 100,
                input: { customerId: 'customer-123' },
              },
            },
            delay: 100,
            result: { data: mockData },
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { customerId: 'customer-123' },
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(true);
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });
      });
    });

    describe('Data Transformation', () => {
      it('filters out null nodes in edges', async () => {
        // dataWithNulls shape differs per variant — constructed inline using the row's dataKey
        const dataWithNulls =
          dataKey === 'timeTrackingStandardFieldAssignments'
            ? {
                timeTrackingStandardFieldAssignments: {
                  edges: [
                    {
                      node: {
                        standardFieldLabel: { name: 'Customer' },
                        assigned: true,
                      },
                      cursor: 'cursor-1',
                    },
                    { node: null, cursor: 'cursor-2' },
                    {
                      node: {
                        standardFieldLabel: { name: 'Service' },
                        assigned: false,
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
              }
            : {
                timeTrackingCustomFieldAssignments: {
                  edges: [
                    {
                      node: {
                        customFieldDefinition: { id: 'cf-1' },
                        assigned: true,
                      },
                      cursor: 'cursor-1',
                    },
                    { node: null, cursor: 'cursor-2' },
                    {
                      node: {
                        customFieldDefinition: { id: 'cf-3' },
                        assigned: false,
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

        const mocks = [
          {
            request: {
              query,
              variables: {
                first: 100,
                input: { customerId: 'customer-123' },
              },
            },
            result: { data: dataWithNulls },
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { customerId: 'customer-123' },
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
              query,
              variables: {
                first: 100,
                input: { customerId: 'customer-123' },
              },
            },
            result: { data: mockData },
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { customerId: 'customer-123' },
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(sandbox.logger.info).toHaveBeenCalledWith(logSuccessMsg);
      });

      it('logs error on query failure', async () => {
        const mocks = [
          {
            request: {
              query,
              variables: {
                first: 100,
                input: { customerId: 'customer-123' },
              },
            },
            error: new Error('Failed to fetch'),
          },
        ];

        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper(mocks),
        });

        (result.current as any)[loadFnName]({
          input: { customerId: 'customer-123' },
        });

        await waitFor(() => {
          expect(result.current.error).toBeTruthy();
        });

        expect(sandbox.logger.error).toHaveBeenCalledWith(logErrorMsg, {
          error: 'Failed to fetch',
        });
      });
    });
  },
);
