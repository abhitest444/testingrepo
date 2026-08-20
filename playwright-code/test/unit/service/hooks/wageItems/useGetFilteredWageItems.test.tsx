import { ApolloError } from '@apollo/client';
import { waitFor } from '@testing-library/dom';
import { useGetFilteredWageItems } from 'src/js/service/hooks/wageItems/useGetFilteredWageItems';
import { useGetFilteredWageItemsDataForTimeEntriesQuery } from 'src/__generated__/gas/graphql';
import { renderHookWithApolloProvider } from '../../../testUtils';

// TODO upgrade to use apollo provider mocking, don't mock hook directly
jest.mock('src/__generated__/gas/graphql', () => ({
  useGetFilteredWageItemsDataForTimeEntriesQuery: jest.fn(),
}));

describe('useGetFilteredWageItems', () => {
  const wageItemIds = ['01020000-0368-0000-4300-00DD10A9555A'];

  const mockData = {
    company: {
      companyInfo: {
        employerInfo: {
          employerCompensations: [
            {
              id: '1',
              name: 'Compensation 1',
              type: 'TYPE_1',
            },
          ],
        },
      },
    },
  };

  const mockError = new ApolloError({
    errorMessage: 'The company you were looking for does not exist',
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return data when query is successful', async () => {
    (
      useGetFilteredWageItemsDataForTimeEntriesQuery as jest.Mock
    ).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
    });

    const { result } = renderHookWithApolloProvider(
      () => useGetFilteredWageItems({ wageItemIds }),
      [],
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(
      mockData.company.companyInfo.employerInfo.employerCompensations,
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return error when query fails', async () => {
    (
      useGetFilteredWageItemsDataForTimeEntriesQuery as jest.Mock
    ).mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
    });

    const { result } = renderHookWithApolloProvider(
      () => useGetFilteredWageItems({ wageItemIds }),
      [],
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should skip query when wageItemIds is empty', async () => {
    (
      useGetFilteredWageItemsDataForTimeEntriesQuery as jest.Mock
    ).mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });

    const { result } = renderHookWithApolloProvider(
      () => useGetFilteredWageItems({ wageItemIds: [] }),
      [],
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });
});
