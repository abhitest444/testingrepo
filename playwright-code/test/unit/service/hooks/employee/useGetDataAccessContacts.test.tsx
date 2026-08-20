/* eslint-disable camelcase */

import { act } from '@testing-library/react-hooks';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import {
  GetEmployeesAndVendorsDocument,
  DataAccess_ContactType,
} from 'src/__generated__/oigql/graphql';
import * as CustomerInteraction from 'src/js/common/CustomerInteraction';
import * as mapErrorModule from 'src/js/service/utils/mapError';
import { useGetDataAccessContacts } from '../../../../../src/js/service/hooks/oigql/useGetDataAccessContacts';

const EMPLOYEE_NODE = {
  __typename: 'DataAccess_Employee',
  type: DataAccess_ContactType.Employee,
  displayName: 'John Employee',
  firstName: 'John',
  id: 'emp-1',
};
const VENDOR_NODE = {
  __typename: 'DataAccess_Vendor',
  type: DataAccess_ContactType.Vendor,
  displayName: 'Jane Vendor',
  firstName: 'Jane',
  id: 'ven-1',
};
const MOCK_SUCCESS = [
  {
    request: {
      query: GetEmployeesAndVendorsDocument,
      variables: { filter: { active: { equals: true } }, first: 10, offset: 0 },
    },
    result: {
      data: {
        dataAccessContacts: {
          __typename: 'DataAccess_ContactConnection',
          totalCount: 2,
          edges: [
            { __typename: 'DataAccess_ContactEdge', node: EMPLOYEE_NODE },
            { __typename: 'DataAccess_ContactEdge', node: VENDOR_NODE },
          ],
        },
      },
    },
  },
];
const MOCK_EMPTY = [
  {
    request: {
      query: GetEmployeesAndVendorsDocument,
      variables: { filter: { active: { equals: true } }, first: 10, offset: 0 },
    },
    result: {
      data: {
        dataAccessContacts: {
          __typename: 'DataAccess_ContactConnection',
          totalCount: 0,
          edges: [],
        },
      },
    },
  },
];
const MOCK_ERROR = [
  {
    request: {
      query: GetEmployeesAndVendorsDocument,
      variables: { filter: { active: { equals: true } }, first: 10, offset: 0 },
    },
    error: new Error('Test error'),
  },
];

describe('useGetEmployeesAndVendors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(CustomerInteraction, 'createCustomerInteraction')
      .mockImplementation(jest.fn());
    jest
      .spyOn(CustomerInteraction, 'endInteractionWithSuccess')
      .mockImplementation(jest.fn());
    jest
      .spyOn(CustomerInteraction, 'endInteractionWithFailure')
      .mockImplementation(jest.fn());
    jest
      .spyOn(CustomerInteraction, 'getCustomerInteractionPropagationHeaders')
      .mockReturnValue({});
  });

  it('should return loading state when query is triggered', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetDataAccessContacts(),
      MOCK_SUCCESS,
    );
    act(() => {
      result.current.loadDataAccessContacts({
        filter: { active: { equals: true } },
        first: 10,
        offset: 0,
      });
    });
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
  });

  it('should return employees and vendors on success', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetDataAccessContacts(),
      MOCK_SUCCESS,
    );
    act(() => {
      result.current.loadDataAccessContacts({
        filter: { active: { equals: true } },
        first: 10,
        offset: 0,
      });
    });
    await waitForNextUpdate();
    expect(result.current.employees).toEqual([EMPLOYEE_NODE]);
    expect(result.current.vendors).toEqual([VENDOR_NODE]);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.error).toBeUndefined();
  });

  it('should return empty arrays if no data', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetDataAccessContacts(),
      MOCK_EMPTY,
    );
    act(() => {
      result.current.loadDataAccessContacts({
        filter: { active: { equals: true } },
        first: 10,
        offset: 0,
      });
    });
    await waitForNextUpdate();
    expect(result.current.employees).toEqual([]);
    expect(result.current.vendors).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.error).toBeUndefined();
  });

  it('should return error if query fails', async () => {
    jest.spyOn(mapErrorModule, 'mapError').mockReturnValue('Mapped error');
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetDataAccessContacts(),
      MOCK_ERROR,
    );
    act(() => {
      result.current.loadDataAccessContacts({
        filter: { active: { equals: true } },
        first: 10,
        offset: 0,
      });
    });
    await waitForNextUpdate();
    expect(result.current.error).toBe('Mapped error');
    expect(result.current.employees).toEqual([]);
    expect(result.current.vendors).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });
});
