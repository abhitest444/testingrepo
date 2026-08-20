/* eslint-disable camelcase */

import { useGetCustomerData } from 'src/js/service/hooks/customer/useGetCustomerData';
import { CUSTOMER_DATA_FOR_TIME_ENTRIES_QUERY } from 'src/js/service/queries/oigqlQueries';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';

describe('useGetCustomerData', () => {
  it('should return customer data when query is successful', async () => {
    const customerIds = ['1', '2'];
    const mocks = [
      {
        request: {
          query: CUSTOMER_DATA_FOR_TIME_ENTRIES_QUERY,
          variables: {
            filter: {
              or: [
                {
                  and: [
                    {
                      id: {
                        matchesAny: customerIds,
                      },
                    },
                    {
                      type: {
                        matchesAny: [DataAccess_ContactType.Customer],
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
        result: {
          data: {
            dataAccessContacts: {
              edges: [
                {
                  node: {
                    id: '1',
                    displayName: 'Customer 1',
                    __typename: 'DataAccess_Customer',
                  },
                },
                {
                  node: {
                    id: '2',
                    displayName: 'Customer 2',
                    __typename: 'DataAccess_Customer',
                  },
                },
              ],
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetCustomerData({ customerIds }),
      mocks,
    );

    await waitForNextUpdate();

    expect(result.current.data).toEqual([
      {
        id: '1',
        displayName: 'Customer 1',
        __typename: 'DataAccess_Customer',
      },
      {
        id: '2',
        displayName: 'Customer 2',
        __typename: 'DataAccess_Customer',
      },
    ]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return an error when query fails', async () => {
    const customerIds = ['1', '2'];
    const mocks = [
      {
        request: {
          query: CUSTOMER_DATA_FOR_TIME_ENTRIES_QUERY,
          variables: {
            filter: {
              or: [
                {
                  and: [
                    {
                      id: {
                        matchesAny: customerIds,
                      },
                    },
                    {
                      type: {
                        matchesAny: ['Customer'],
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
        error: new Error('An error occurred'),
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetCustomerData({ customerIds }),
      mocks,
    );

    await waitForNextUpdate();

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
  });

  it('should skip query when customerIds is empty', async () => {
    const customerIds: string[] = [];

    const { result } = renderHookWithApolloProvider(
      () => useGetCustomerData({ customerIds }),
      [],
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });
});
