import { renderHook, act } from '@testing-library/react-hooks';
import { useGetTimesheetFieldsData } from 'src/js/service/hooks/oigql/useGetTimesheetFieldsData';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import * as CustomerInteraction from 'src/js/common/CustomerInteraction';

// Mock @payroll/quicksand
const mockSandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => mockSandbox),
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn(({ id }: any) => id),
  })),
}));

// Mock customer interaction
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    WORKER_READ: 'WORKER_READ',
  },
}));

// Mock mapError
jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(({ error }: any) => `Mapped error: ${error.message}`),
}));

// Mock the GraphQL hook
const mockLoadQuery = jest.fn();
const mockData = {
  dataAccessContacts: {
    edges: [
      {
        node: {
          id: 'contact-1',
          name: 'Customer 1',
          type: DataAccess_ContactType.Customer,
        },
      },
      {
        node: {
          id: 'contact-2',
          name: 'Vendor 1',
          type: DataAccess_ContactType.Vendor,
        },
      },
    ],
  },
  dataAccessProducts: {
    edges: [
      {
        node: {
          id: 'product-1',
          name: 'Product 1',
        },
      },
    ],
  },
  dataAccessKlasses: {
    edges: [
      {
        node: {
          id: 'class-1',
          name: 'Class 1',
        },
      },
    ],
  },
  dataAccessDepartments: {
    edges: [
      {
        node: {
          id: 'dept-1',
          name: 'Department 1',
        },
      },
    ],
  },
};

jest.mock('src/__generated__/oigql/graphql', () => ({
  ...jest.requireActual('src/__generated__/oigql/graphql'),
  useGetTimesheetFieldsDataLazyQuery: jest.fn(() => [
    mockLoadQuery,
    {
      data: undefined,
      loading: false,
      error: undefined,
    },
  ]),
  DataAccess_ContactType: {
    Customer: 'Customer',
    Vendor: 'Vendor',
  },
}));

describe('useGetTimesheetFieldsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadQuery.mockResolvedValue({ data: mockData });
  });

  describe('Hook Initialization', () => {
    it('initializes with empty state', () => {
      const { result } = renderHook(() => useGetTimesheetFieldsData());

      expect(result.current.customers).toEqual([]);
      expect(result.current.products).toEqual([]);
      expect(result.current.classes).toEqual([]);
      expect(result.current.departments).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.loadTimesheetFieldsData).toBeDefined();
      expect(typeof result.current.loadTimesheetFieldsData).toBe('function');
    });
  });

  describe('loadTimesheetFieldsData', () => {
    it('should create customer interaction when loading data', async () => {
      const { result } = renderHook(() => useGetTimesheetFieldsData());

      await act(async () => {
        await result.current.loadTimesheetFieldsData({ first: 10 });
      });

      expect(
        CustomerInteraction.createCustomerInteraction,
      ).toHaveBeenCalledWith(mockSandbox, 'WORKER_READ');
    });

    it('should call loadQuery with correct variables', async () => {
      const { result } = renderHook(() => useGetTimesheetFieldsData());

      await act(async () => {
        await result.current.loadTimesheetFieldsData({ first: 10, offset: 5 });
      });

      expect(mockLoadQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { first: 10, offset: 5 },
          context: expect.objectContaining({
            headers: expect.any(Object),
          }),
        }),
      );
    });

    it('should call loadQuery without offset when not provided', async () => {
      const { result } = renderHook(() => useGetTimesheetFieldsData());

      await act(async () => {
        await result.current.loadTimesheetFieldsData({ first: 20 });
      });

      expect(mockLoadQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { first: 20, offset: undefined },
          context: expect.objectContaining({
            headers: expect.any(Object),
          }),
        }),
      );
    });

    it('should include propagation headers in context', async () => {
      const customHeaders = { 'x-custom-header': 'test-value' };
      (
        CustomerInteraction.getCustomerInteractionPropagationHeaders as jest.Mock
      ).mockReturnValue(customHeaders);

      const { result } = renderHook(() => useGetTimesheetFieldsData());

      await act(async () => {
        await result.current.loadTimesheetFieldsData({ first: 10 });
      });

      expect(
        CustomerInteraction.getCustomerInteractionPropagationHeaders,
      ).toHaveBeenCalledWith(mockSandbox, 'WORKER_READ');
    });
  });

  describe('Data Transformation', () => {
    it('should filter customers from contacts', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      mockUseGetTimesheetFieldsDataLazyQuery.mockReturnValue([
        mockLoadQuery,
        {
          data: mockData,
          loading: false,
          error: undefined,
        },
      ]);

      const { result } = renderHook(() => useGetTimesheetFieldsData());

      expect(result.current.customers).toHaveLength(1);
      expect(result.current.customers[0].id).toBe('contact-1');
      expect(result.current.customers[0].type).toBe(
        DataAccess_ContactType.Customer,
      );
    });

    it('should transform products data', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      mockUseGetTimesheetFieldsDataLazyQuery.mockReturnValue([
        mockLoadQuery,
        {
          data: mockData,
          loading: false,
          error: undefined,
        },
      ]);

      const { result } = renderHook(() => useGetTimesheetFieldsData());

      expect(result.current.products).toHaveLength(1);
      expect(result.current.products[0].id).toBe('product-1');
    });

    it('should transform classes data', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      mockUseGetTimesheetFieldsDataLazyQuery.mockReturnValue([
        mockLoadQuery,
        {
          data: mockData,
          loading: false,
          error: undefined,
        },
      ]);

      const { result } = renderHook(() => useGetTimesheetFieldsData());

      expect(result.current.classes).toHaveLength(1);
      expect(result.current.classes[0].id).toBe('class-1');
    });

    it('should transform departments data', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      mockUseGetTimesheetFieldsDataLazyQuery.mockReturnValue([
        mockLoadQuery,
        {
          data: mockData,
          loading: false,
          error: undefined,
        },
      ]);

      const { result } = renderHook(() => useGetTimesheetFieldsData());

      expect(result.current.departments).toHaveLength(1);
      expect(result.current.departments[0].id).toBe('dept-1');
    });

    it('should handle empty data', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      mockUseGetTimesheetFieldsDataLazyQuery.mockReturnValue([
        mockLoadQuery,
        {
          data: {
            dataAccessContacts: { edges: [] },
            dataAccessProducts: { edges: [] },
            dataAccessKlasses: { edges: [] },
            dataAccessDepartments: { edges: [] },
          },
          loading: false,
          error: undefined,
        },
      ]);

      const { result } = renderHook(() => useGetTimesheetFieldsData());

      expect(result.current.customers).toEqual([]);
      expect(result.current.products).toEqual([]);
      expect(result.current.classes).toEqual([]);
      expect(result.current.departments).toEqual([]);
    });

    it('should handle missing data', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      mockUseGetTimesheetFieldsDataLazyQuery.mockReturnValue([
        mockLoadQuery,
        {
          data: null,
          loading: false,
          error: undefined,
        },
      ]);

      const { result } = renderHook(() => useGetTimesheetFieldsData());

      expect(result.current.customers).toEqual([]);
      expect(result.current.products).toEqual([]);
      expect(result.current.classes).toEqual([]);
      expect(result.current.departments).toEqual([]);
    });
  });

  describe('Loading State', () => {
    it('should reflect loading state from query', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      mockUseGetTimesheetFieldsDataLazyQuery.mockReturnValue([
        mockLoadQuery,
        {
          data: undefined,
          loading: true,
          error: undefined,
        },
      ]);

      const { result } = renderHook(() => useGetTimesheetFieldsData());

      expect(result.current.loading).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should map error when query fails', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      const mockError = { message: 'Network error' };
      mockUseGetTimesheetFieldsDataLazyQuery.mockReturnValue([
        mockLoadQuery,
        {
          data: undefined,
          loading: false,
          error: mockError,
        },
      ]);

      const { result } = renderHook(() => useGetTimesheetFieldsData());

      expect(result.current.error).toBe('Mapped error: Network error');
    });

    it('should not have error when query succeeds', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      mockUseGetTimesheetFieldsDataLazyQuery.mockReturnValue([
        mockLoadQuery,
        {
          data: mockData,
          loading: false,
          error: undefined,
        },
      ]);

      const { result } = renderHook(() => useGetTimesheetFieldsData());

      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Callbacks', () => {
    it('should call endInteractionWithSuccess on query completion', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      let onCompletedCallback: any;
      mockUseGetTimesheetFieldsDataLazyQuery.mockImplementation(
        (options: any) => {
          onCompletedCallback = options.onCompleted;
          return [
            mockLoadQuery,
            {
              data: mockData,
              loading: false,
              error: undefined,
            },
          ];
        },
      );

      renderHook(() => useGetTimesheetFieldsData());

      // Trigger onCompleted callback
      onCompletedCallback();

      expect(
        CustomerInteraction.endInteractionWithSuccess,
      ).toHaveBeenCalledWith(mockSandbox, 'WORKER_READ');
    });

    it('should call endInteractionWithFailure on query error', () => {
      const mockUseGetTimesheetFieldsDataLazyQuery =
        require('src/__generated__/oigql/graphql').useGetTimesheetFieldsDataLazyQuery;

      let onErrorCallback: any;
      const mockError = { message: 'Query failed' };
      mockUseGetTimesheetFieldsDataLazyQuery.mockImplementation(
        (options: any) => {
          onErrorCallback = options.onError;
          return [
            mockLoadQuery,
            {
              data: undefined,
              loading: false,
              error: mockError,
            },
          ];
        },
      );

      renderHook(() => useGetTimesheetFieldsData());

      // Trigger onError callback
      onErrorCallback();

      expect(
        CustomerInteraction.endInteractionWithFailure,
      ).toHaveBeenCalledWith(mockSandbox, 'WORKER_READ', 'QUERY_ERROR', {
        message: mockError,
      });
    });
  });
});
