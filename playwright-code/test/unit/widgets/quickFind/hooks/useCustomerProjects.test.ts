import { renderHook } from '@testing-library/react-hooks';
import { useCustomerProjects } from '../../../../../src/js/widgets/quickFind/hooks/useCustomerProjects';
import { CustomerType } from '../../../../../src/js/widgets/quickFind/types';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
  }),
}));

jest.mock(
  '../../../../../src/js/service/hooks/assignments/useTimeAgainstAssignments',
);

const mockUseTimeAgainstAssignments =
  require('../../../../../src/js/service/hooks/assignments/useTimeAgainstAssignments').useTimeAgainstAssignments;

describe('useCustomerProjects', () => {
  const mockLoadTimeAgainstAssignments = jest.fn();

  const mockTimeAgainstData = [
    {
      displayName: 'Customer1',
      fullName: 'Customer1',
      customerType: 'CUSTOMER',
      active: true,
      numChildren: 0,
      timeAgainstContactDAS: {
        customer: { id: '1' },
        project: null,
      },
      parentId: null,
      level: null,
    },
    {
      displayName: 'Project1',
      fullName: 'Customer1:Project1',
      customerType: 'PROJECT',
      active: true,
      numChildren: 0,
      timeAgainstContactDAS: {
        customer: { id: '1' },
        project: { id: '2' },
      },
      parentId: '1',
      level: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTimeAgainstAssignments.mockReturnValue({
      loading: false,
      data: mockTimeAgainstData,
      error: null,
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      pageInfo: null,
      totalTimeAgainstCount: 2,
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCustomerProjects());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.customers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          displayName: 'Customer1',
          type: CustomerType.Customer,
        }),
        expect.objectContaining({
          id: '2',
          displayName: 'Project1',
          type: CustomerType.Project,
        }),
      ]),
    );
  });

  it('should load customers with timeForEntityId', () => {
    const { result } = renderHook(() => useCustomerProjects());

    result.current.loadCustomers({ timeForEntityId: '123' });

    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
      first: 100,
      after: undefined,
      input: { timeForEntityId: '123' },
      filter: { searchText: null },
    });
  });

  it('should load customers with search text', () => {
    const { result } = renderHook(() => useCustomerProjects());

    result.current.loadCustomers({
      timeForEntityId: '123',
      searchText: 'Customer',
    });

    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
      first: 100,
      after: undefined,
      input: { timeForEntityId: '123' },
      filter: { searchText: 'Customer' },
    });
  });

  it('should load customers with assignment filters', () => {
    const { result } = renderHook(() => useCustomerProjects());

    result.current.loadCustomers({
      timeForEntityId: '123',
      assignmentFilters: { assigned: true },
    });

    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
      first: 100,
      after: undefined,
      input: { timeForEntityId: '123' },
      filter: { searchText: null, assigned: true },
    });
  });

  it('should combine searchText and assignmentFilters', () => {
    const { result } = renderHook(() => useCustomerProjects());

    result.current.loadCustomers({
      timeForEntityId: '123',
      searchText: 'Customer1',
      assignmentFilters: { assigned: true },
    });

    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
      first: 100,
      after: undefined,
      input: { timeForEntityId: '123' },
      filter: { searchText: 'Customer1', assigned: true },
    });
  });

  it('should not load if timeForEntityId is missing', () => {
    const { result } = renderHook(() => useCustomerProjects());

    result.current.loadCustomers({ timeForEntityId: '' });

    // Should log error and not call the API
    expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
  });

  it('should transform customer data correctly', () => {
    const { result } = renderHook(() => useCustomerProjects());

    expect(result.current.customers).toEqual([
      {
        id: '1',
        displayName: 'Customer1',
        fullName: 'Customer1',
        type: CustomerType.Customer,
        customerType: 'CUSTOMER',
        active: true,
        parentId: null,
        level: null,
        numChildren: 0,
      },
      {
        id: '2',
        displayName: 'Project1',
        fullName: 'Customer1:Project1',
        type: CustomerType.Project,
        customerType: 'PROJECT',
        active: true,
        parentId: '1',
        level: 1,
        numChildren: 0,
      },
    ]);
  });

  it('should deduplicate customers by id when API returns same id twice (first occurrence wins)', () => {
    const dataWithDuplicateId = [
      {
        displayName: 'Intuit',
        fullName: 'Intuit',
        customerType: 'CUSTOMER',
        active: true,
        numChildren: 1,
        timeAgainstContactDAS: { customer: { id: '3' }, project: null },
        parentId: null,
        level: null,
      },
      {
        displayName: 'Intuit Building 55 Construction',
        fullName: 'Intuit:Intuit Building 55 Construction',
        customerType: 'PROJECT',
        active: true,
        numChildren: 0,
        timeAgainstContactDAS: { customer: { id: '7' }, project: null },
        parentId: '3',
        level: 1,
      },
      {
        displayName: 'Intuit Building 55 Construction',
        fullName: 'Real Builders:Intuit Building 55 Construction',
        customerType: 'PROJECT',
        active: true,
        numChildren: 0,
        timeAgainstContactDAS: { customer: { id: '7' }, project: null },
        parentId: '1',
        level: 1,
      },
    ];

    mockUseTimeAgainstAssignments.mockReturnValue({
      loading: false,
      data: dataWithDuplicateId,
      error: null,
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      pageInfo: null,
      totalTimeAgainstCount: 3,
    });

    const { result } = renderHook(() => useCustomerProjects());

    expect(result.current.customers).toHaveLength(2);
    expect(result.current.customers.find((c) => c.id === '7')).toEqual(
      expect.objectContaining({
        id: '7',
        displayName: 'Intuit Building 55 Construction',
        fullName: 'Intuit:Intuit Building 55 Construction',
        parentId: '3',
      }),
    );
  });

  it('should transform project data correctly', () => {
    const projectData = [
      {
        displayName: 'Project Only',
        fullName: 'Project Only',
        customerType: 'PROJECT',
        active: true,
        numChildren: 0,
        timeAgainstContactDAS: {
          customer: null,
          project: { id: 'proj-1' },
        },
        parentId: null,
        level: null,
      },
    ];

    mockUseTimeAgainstAssignments.mockReturnValue({
      loading: false,
      data: projectData,
      error: null,
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      pageInfo: null,
      totalTimeAgainstCount: 1,
    });

    const { result } = renderHook(() => useCustomerProjects());

    expect(result.current.customers).toEqual([
      {
        id: 'proj-1',
        displayName: 'Project Only',
        fullName: 'Project Only',
        type: CustomerType.Project,
        customerType: 'PROJECT',
        active: true,
        parentId: null,
        level: null,
        numChildren: 0,
      },
    ]);
  });

  it('should handle refetch correctly', () => {
    const { result } = renderHook(() => useCustomerProjects());

    // Initial load
    result.current.loadCustomers({
      timeForEntityId: '123',
      searchText: 'Customer',
    });

    // Refetch without args should use last args
    result.current.refetch();

    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledTimes(2);
    expect(mockLoadTimeAgainstAssignments).toHaveBeenLastCalledWith({
      first: 100,
      after: undefined,
      input: { timeForEntityId: '123' },
      filter: { searchText: 'Customer' },
    });
  });

  it('should handle refetch with new args', () => {
    const { result } = renderHook(() => useCustomerProjects());

    result.current.loadCustomers({ timeForEntityId: '123' });

    // Refetch with new args
    result.current.refetch({
      timeForEntityId: '456',
      searchText: 'New Search',
    });

    expect(mockLoadTimeAgainstAssignments).toHaveBeenLastCalledWith({
      first: 100,
      after: undefined,
      input: { timeForEntityId: '456' },
      filter: { searchText: 'New Search' },
    });
  });

  it('should handle loading state', () => {
    mockUseTimeAgainstAssignments.mockReturnValue({
      loading: true,
      data: [],
      error: null,
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      pageInfo: null,
      totalTimeAgainstCount: null,
    });

    const { result } = renderHook(() => useCustomerProjects());

    expect(result.current.loading).toBe(true);
    expect(result.current.customers).toEqual([]);
  });

  it('should handle error state', () => {
    mockUseTimeAgainstAssignments.mockReturnValue({
      loading: false,
      data: [],
      error: 'Network error',
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      pageInfo: null,
      totalTimeAgainstCount: null,
    });

    const { result } = renderHook(() => useCustomerProjects());

    expect(result.current.error).toBe('Network error');
    expect(result.current.customers).toEqual([]);
  });

  it('should handle empty data', () => {
    mockUseTimeAgainstAssignments.mockReturnValue({
      loading: false,
      data: [],
      error: null,
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      pageInfo: null,
      totalTimeAgainstCount: 0,
    });

    const { result } = renderHook(() => useCustomerProjects());

    expect(result.current.customers).toEqual([]);
  });

  it('should handle missing timeAgainstContactDAS gracefully', () => {
    const dataWithMissingDAS = [
      {
        displayName: 'Customer Without DAS',
        fullName: 'Customer Without DAS',
        customerType: 'CUSTOMER',
        active: true,
        numChildren: 0,
        timeAgainstContactDAS: null,
        parentId: null,
        level: null,
      },
    ];

    mockUseTimeAgainstAssignments.mockReturnValue({
      loading: false,
      data: dataWithMissingDAS,
      error: null,
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      pageInfo: null,
      totalTimeAgainstCount: 1,
    });

    const { result } = renderHook(() => useCustomerProjects());

    expect(result.current.customers).toEqual([
      {
        id: 'Customer Without DAS', // Falls back to displayName
        displayName: 'Customer Without DAS',
        fullName: 'Customer Without DAS',
        type: CustomerType.Customer,
        customerType: 'CUSTOMER',
        active: true,
        parentId: null,
        level: null,
        numChildren: 0,
      },
    ]);
  });

  describe('Load More (Load More)', () => {
    it('should not load more when load more is disabled', () => {
      const { result } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: false }),
      );

      mockLoadTimeAgainstAssignments.mockClear();

      result.current.loadMore();

      expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
    });

    it('should not load more when hasMore is false', () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: false,
          endCursor: 'cursor123',
        },
        totalTimeAgainstCount: 2,
      });

      const { result } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      mockLoadTimeAgainstAssignments.mockClear();

      result.current.loadMore();

      expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
    });

    it('should not load more when endCursor is null', () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: null,
        },
        totalTimeAgainstCount: 2,
      });

      const { result } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      mockLoadTimeAgainstAssignments.mockClear();

      result.current.loadMore();

      expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
    });

    it('should not load more when already loading', () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: true,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor123',
        },
        totalTimeAgainstCount: 2,
      });

      const { result } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      mockLoadTimeAgainstAssignments.mockClear();

      result.current.loadMore();

      expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
    });

    it('should not load more when currentArgs is missing', () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor123',
        },
        totalTimeAgainstCount: 2,
      });

      const { result } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      mockLoadTimeAgainstAssignments.mockClear();

      // Try to loadMore without calling loadCustomers first
      result.current.loadMore();

      expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
    });

    it('should not load more when timeForEntityId is missing from currentArgs', () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor123',
        },
        totalTimeAgainstCount: 2,
      });

      const { result } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      // Load customers without timeForEntityId
      result.current.loadCustomers({ timeForEntityId: '' });

      mockLoadTimeAgainstAssignments.mockClear();

      result.current.loadMore();

      expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
    });

    it('should load more with correct parameters when all conditions are met', () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor123',
        },
        totalTimeAgainstCount: 2,
      });

      const { result } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      // Set up initial load
      result.current.loadCustomers({
        timeForEntityId: '123',
        searchText: 'Customer',
        assignmentFilters: { assigned: true },
      });

      mockLoadTimeAgainstAssignments.mockClear();

      result.current.loadMore();

      expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
        first: 100,
        after: 'cursor123',
        input: { timeForEntityId: '123' },
        filter: {
          searchText: 'Customer',
          assigned: true,
        },
      });
    });

    it('should load more without searchText if not provided', () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor456',
        },
        totalTimeAgainstCount: 2,
      });

      const { result } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      result.current.loadCustomers({
        timeForEntityId: '456',
        assignmentFilters: { assigned: false },
      });

      mockLoadTimeAgainstAssignments.mockClear();

      result.current.loadMore();

      expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
        first: 100,
        after: 'cursor456',
        input: { timeForEntityId: '456' },
        filter: {
          searchText: null,
          assigned: false,
        },
      });
    });

    it('should load more without assignmentFilters if not provided', () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor789',
        },
        totalTimeAgainstCount: 2,
      });

      const { result } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      result.current.loadCustomers({
        timeForEntityId: '789',
        searchText: 'Project',
      });

      mockLoadTimeAgainstAssignments.mockClear();

      result.current.loadMore();

      expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
        first: 100,
        after: 'cursor789',
        input: { timeForEntityId: '789' },
        filter: {
          searchText: 'Project',
        },
      });
    });
  });

  describe('Data Accumulation (Load More)', () => {
    it('should replace data on initial load with load more', () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor1',
        },
        totalTimeAgainstCount: 2,
      });

      const { result, rerender } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      rerender();

      expect(result.current.customers).toHaveLength(2);
      expect(result.current.hasMore).toBe(true);
    });

    it('should append data on subsequent loads with load more', () => {
      // Initial data
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor1',
        },
        totalTimeAgainstCount: 4,
      });

      const { result, rerender } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      rerender();

      expect(result.current.customers).toHaveLength(2);

      // More data (simulating loadMore)
      const moreData = [
        {
          displayName: 'Customer2',
          fullName: 'Customer2',
          customerType: 'CUSTOMER',
          active: true,
          numChildren: 0,
          timeAgainstContactDAS: {
            customer: { id: '3' },
            project: null,
          },
          parentId: null,
          level: null,
        },
        {
          displayName: 'Project2',
          fullName: 'Customer2:Project2',
          customerType: 'PROJECT',
          active: true,
          numChildren: 0,
          timeAgainstContactDAS: {
            customer: { id: '3' },
            project: { id: '4' },
          },
          parentId: '3',
          level: 1,
        },
      ];

      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: moreData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: false,
          endCursor: 'cursor2',
        },
        totalTimeAgainstCount: 4,
      });

      rerender();

      // Should have all 4 customers now (accumulated)
      expect(result.current.customers).toHaveLength(4);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.customers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: '1', displayName: 'Customer1' }),
          expect.objectContaining({ id: '2', displayName: 'Project1' }),
          expect.objectContaining({ id: '3', displayName: 'Customer2' }),
          expect.objectContaining({ id: '4', displayName: 'Project2' }),
        ]),
      );
    });

    it('should deduplicate customers by id when accumulating', () => {
      // Initial data with customer1
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: [mockTimeAgainstData[0]],
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor1',
        },
        totalTimeAgainstCount: 2,
      });

      const { result, rerender } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      rerender();

      expect(result.current.customers).toHaveLength(1);

      // Try to add the same customer again (duplicate)
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: [mockTimeAgainstData[0], mockTimeAgainstData[1]],
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: false,
          endCursor: 'cursor2',
        },
        totalTimeAgainstCount: 2,
      });

      rerender();

      // Should still have 2 unique customers (deduplicated)
      expect(result.current.customers).toHaveLength(2);
      const customerIds = result.current.customers.map((c) => c.id);
      expect(customerIds).toEqual(['1', '2']);
    });

    it('should clear customers when empty data is received with load more enabled', () => {
      // Start with data
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: null,
        totalTimeAgainstCount: 2,
      });

      const { result, rerender } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      rerender();

      expect(result.current.customers).toHaveLength(2);

      // Clear data (simulate new search with no results on initial load)
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: [],
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: null,
        totalTimeAgainstCount: 0,
      });

      // Trigger a new search (reset isInitialLoadRef)
      result.current.loadCustomers({ timeForEntityId: '999' });

      rerender();

      // Should clear customers
      expect(result.current.customers).toEqual([]);
    });

    it('should reset accumulated data when loadCustomers is called', () => {
      // Initial load
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor1',
        },
        totalTimeAgainstCount: 2,
      });

      const { result, rerender } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: true }),
      );

      rerender();

      expect(result.current.customers).toHaveLength(2);

      // Load more to accumulate
      const moreData = [
        {
          displayName: 'Customer3',
          fullName: 'Customer3',
          customerType: 'CUSTOMER',
          active: true,
          numChildren: 0,
          timeAgainstContactDAS: {
            customer: { id: '5' },
            project: null,
          },
          parentId: null,
          level: null,
        },
      ];

      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: moreData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: false,
          endCursor: 'cursor2',
        },
        totalTimeAgainstCount: 3,
      });

      rerender();

      expect(result.current.customers).toHaveLength(3);

      // Now call loadCustomers with new filter - should reset
      const newData = [
        {
          displayName: 'New Customer',
          fullName: 'New Customer',
          customerType: 'CUSTOMER',
          active: true,
          numChildren: 0,
          timeAgainstContactDAS: {
            customer: { id: '99' },
            project: null,
          },
          parentId: null,
          level: null,
        },
      ];

      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: newData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: null,
        totalTimeAgainstCount: 1,
      });

      result.current.loadCustomers({ timeForEntityId: '888' });

      rerender();

      // Should have reset to just the new customer
      expect(result.current.customers).toHaveLength(1);
      expect(result.current.customers[0].id).toBe('99');
    });

    it('should not accumulate when load more is disabled', () => {
      mockUseTimeAgainstAssignments.mockReturnValue({
        loading: false,
        data: mockTimeAgainstData,
        error: null,
        loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
        pageInfo: {
          hasNextPage: true,
          endCursor: 'cursor1',
        },
        totalTimeAgainstCount: 2,
      });

      const { result } = renderHook(() =>
        useCustomerProjects({ enableLoadMore: false }),
      );

      // Should just return customers as-is, no accumulation
      expect(result.current.customers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: '1' }),
          expect.objectContaining({ id: '2' }),
        ]),
      );
      expect(result.current.hasMore).toBe(false);
    });
  });
});
