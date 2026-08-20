import { renderHook } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { getV4ApolloClient } from 'src/js/service/V4ApolloClientBuilder';
import { useLazyGetVendorData } from 'src/js/service/hooks/vendor/useLazyGetVendorData';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => `formatMessage(${id})`,
  }),
}));

jest.mock('src/js/service/V4ApolloClientBuilder', () => ({
  getV4ApolloClient: jest.fn().mockReturnValue({
    query: jest.fn(),
  }),
}));

const sandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  appContext: {
    getRealmInfo: () => '12345',
  },
};

const TEST_VENDOR_RESPONSE = {
  data: {
    node: {
      entityVersion: '4',
      displayName: 'Able Tractor',
      __typename: 'Network_Contact',
      externalIds: [
        {
          namespaceId: 'intuit.qbo.name.id',
          __typename: 'Common_ExternalId',
          localId: '13',
        },
      ],
      profiles: {
        vendor: {
          jobCosting: {
            billRate: '50.00',
            costRate: '75.00',
            __typename: 'Network_Relationships_Vendor_JobCosting',
          },
        },
        __typename: 'Network_Contact_Profiles',
      },
      id: 'djQuMTo5MTMwMzYxMzI2MDc0NTQ2OjlkNjk5ZTk2MDg:002071a445aded962741109957589d4620b6ae',
    },
  },
};

describe('useLazyGetVendorData', () => {
  beforeEach(() => {
    (useSandbox as jest.Mock).mockReturnValue(sandbox);
  });

  afterEach(() => {
    // jest.resetAllMocks();
  });

  it('should fetch vendor data successfully', async () => {
    ((getV4ApolloClient as jest.Mock)().query as jest.Mock).mockResolvedValue(
      TEST_VENDOR_RESPONSE,
    );

    const { result, waitForNextUpdate } = renderHook(() =>
      useLazyGetVendorData(),
    );

    result.current.getVendorCallback('13');

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({
      Vendor: {
        BillRate: 50,
        CostRate: 75,
        DisplayName: 'Able Tractor',
        Id: '13',
      },
    });
    expect(result.current.error).toBeUndefined();
    expect(sandbox.logger.info).toHaveBeenCalledWith(
      'Component: useLazyGetVendorData V4 API responded with data for vendorId=13',
    );
    expect((getV4ApolloClient as jest.Mock)().query).toHaveBeenCalledWith(
      expect.objectContaining({
        fetchPolicy: 'network-only',
      }),
    );
  });

  it('should handle a graphql error response', async () => {
    ((getV4ApolloClient as jest.Mock)().query as jest.Mock).mockReturnValue({
      error: { graphQLErrors: [{ message: 'Error' }] },
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useLazyGetVendorData(),
    );

    result.current.getVendorCallback('1');

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(
      'formatMessage(catch.all.error.content)',
    );
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      `Component: useLazyGetVendorData V4 API responded without data`,
      { error: { graphQLErrors: [{ message: 'Error' }] } },
    );
  });

  it('should handle API error response', async () => {
    const error = new Error('Request failed with status code 400');
    ((getV4ApolloClient as jest.Mock)().query as jest.Mock).mockRejectedValue(
      error,
    );

    const { result, waitForNextUpdate } = renderHook(() =>
      useLazyGetVendorData(),
    );

    result.current.getVendorCallback('1');

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(
      'formatMessage(catch.all.error.content)',
    );
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      'Component: useLazyGetVendorData V4 API error fetching vendor',
      { error: new Error('Request failed with status code 400') },
    );
  });

  it('should reset data', async () => {
    ((getV4ApolloClient as jest.Mock)().query as jest.Mock).mockResolvedValue(
      TEST_VENDOR_RESPONSE,
    );

    const { result, waitForNextUpdate } = renderHook(() =>
      useLazyGetVendorData(),
    );

    result.current.getVendorCallback('13');

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({
      Vendor: {
        BillRate: 50,
        CostRate: 75,
        DisplayName: 'Able Tractor',
        Id: '13',
      },
    });

    result.current.resetData();

    expect(result.current.data).toBeUndefined();
  });
});
