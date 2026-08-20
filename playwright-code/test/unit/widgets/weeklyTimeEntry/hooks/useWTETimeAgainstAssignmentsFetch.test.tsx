import { renderHook, act } from '@testing-library/react-hooks';
import { useWTETimeAgainstAssignmentsFetch } from 'src/js/widgets/weeklyTimeEntry/hooks/useWTETimeAgainstAssignmentsFetch';

const mockLoadTimeAgainstAssignments = jest.fn();

jest.mock('src/js/service/hooks/assignments/useTimeAgainstAssignments', () => ({
  useTimeAgainstAssignments: jest.fn(),
}));

jest.mock('src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}));

const mockUseTimeAgainstAssignments =
  require('src/js/service/hooks/assignments/useTimeAgainstAssignments').useTimeAgainstAssignments;
const storeModule = require('src/js/widgets/weeklyTimeEntry/store');

const mockUseAppSelector = storeModule.useAppSelector;
const mockUseAppDispatch = storeModule.useAppDispatch;

describe('useWTETimeAgainstAssignmentsFetch', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppDispatch.mockReturnValue(mockDispatch);
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: null,
      loading: false,
      error: null,
    });
  });

  const setSelectorState = (overrides: Record<string, unknown>) => {
    mockUseAppSelector.mockImplementation((selector: (s: any) => any) =>
      selector({
        timeEntryGrid: {
          teamMember: null,
          ...overrides,
        },
      }),
    );
  };

  it('should fetch with teamMember id and filter assigned', () => {
    setSelectorState({
      teamMember: { id: 'worker-123' },
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { loading: true } }),
    );
    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
      first: 100,
      input: { timeForEntityId: 'worker-123' },
      filter: { assigned: true },
    });
  });

  it('should fetch with empty timeForEntityId and undefined filter when no team member', () => {
    setSelectorState({
      teamMember: null,
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
      first: 100,
      input: { timeForEntityId: '' },
      filter: undefined,
    });
  });

  it('should sync loading to Redux', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: null,
      loading: true,
      error: null,
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { loading: true },
        type: expect.any(String),
      }),
    );
  });

  it('should dispatch setError when API returns error', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: null,
      loading: false,
      error: 'Network error',
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { error: 'Network error' },
      }),
    );
  });

  it('should transform PROJECT items using customer id only (WTE sends customer id)', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    const projectItem = {
      customerType: 'PROJECT',
      displayName: 'Project Alpha',
      fullName: 'Project Alpha',
      timeAgainstContactDAS: {
        project: { id: 'proj-1' },
        customer: { id: 'cust-fallback' },
      },
      parentId: null,
      level: 0,
    };
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [projectItem],
      loading: false,
      error: null,
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    const setCustomersCall = mockDispatch.mock.calls.find(
      (call: any) => call[0]?.payload?.customers != null,
    );
    expect(setCustomersCall).toBeDefined();
    const customers = setCustomersCall?.[0]?.payload?.customers ?? [];
    const project = customers.find(
      (c: any) => c.displayName === 'Project Alpha',
    );
    // WTE uses customer id only for all items (including projects)
    expect(project?.id).toBe('cust-fallback');
    expect(project?.__typename).toBe('DataAccess_Project');
  });

  it('should transform CUSTOMER items and use customer id', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    const customerItem = {
      customerType: 'CUSTOMER',
      displayName: 'Acme Corp',
      fullName: 'Acme Corp',
      timeAgainstContactDAS: { customer: { id: 'cust-1' } },
      parentId: null,
      level: 0,
    };
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [customerItem],
      loading: false,
      error: null,
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    const setCustomersCall = mockDispatch.mock.calls.find(
      (call: any) => call[0]?.payload?.customers != null,
    );
    expect(setCustomersCall).toBeDefined();
    const customers = setCustomersCall?.[0]?.payload?.customers ?? [];
    const customer = customers.find((c: any) => c.displayName === 'Acme Corp');
    expect(customer?.id).toBe('cust-1');
    expect(customer?.__typename).toBe('DataAccess_Customer');
  });

  it('should return loadMore and hasMore in result', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [],
      loading: false,
      error: null,
      pageInfo: { hasNextPage: false, endCursor: null },
    });

    const { result } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    expect(result.current).toEqual(
      expect.objectContaining({
        loadMore: expect.any(Function),
        hasMore: false,
      }),
    );
  });

  it('should return hasMore true when pageInfo has next page', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [],
      loading: false,
      error: null,
      pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
    });

    const { result } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    expect(result.current.hasMore).toBe(true);
  });

  it('should call loadTimeAgainstAssignments with after cursor when loadMore is invoked and pageInfo has next page', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [
        {
          customerType: 'CUSTOMER',
          displayName: 'First',
          timeAgainstContactDAS: { customer: { id: 'c1' } },
          parentId: null,
          level: 0,
        },
      ],
      loading: false,
      error: null,
      pageInfo: { hasNextPage: true, endCursor: 'cursor-abc' },
    });

    const { result } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    mockLoadTimeAgainstAssignments.mockClear();

    act(() => {
      result.current.loadMore();
    });

    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
      first: 100,
      after: 'cursor-abc',
      input: { timeForEntityId: 'w1' },
      filter: { assigned: true },
    });
  });

  it('should dispatch appendCustomers when loadMore returns additional data', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    const initialData = [
      {
        customerType: 'CUSTOMER',
        displayName: 'First',
        fullName: 'First',
        timeAgainstContactDAS: { customer: { id: 'c1' } },
        parentId: null,
        level: 0,
      },
    ];
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: initialData,
      loading: false,
      error: null,
      pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
    });

    const { result, rerender } = renderHook(() =>
      useWTETimeAgainstAssignmentsFetch(),
    );

    act(() => {
      result.current.loadMore();
    });

    const appendData = [
      {
        customerType: 'CUSTOMER',
        displayName: 'Second',
        fullName: 'Second',
        timeAgainstContactDAS: { customer: { id: 'c2' } },
        parentId: null,
        level: 0,
      },
    ];
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: appendData,
      loading: false,
      error: null,
      pageInfo: { hasNextPage: false, endCursor: null },
    });

    rerender();

    const appendCall = mockDispatch.mock.calls.find(
      (call: any) => call[0]?.type?.includes?.('appendCustomers') ?? false,
    );
    expect(appendCall).toBeDefined();
  });

  it('should not refetch when worker key unchanged (early return)', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [],
      loading: false,
      error: null,
    });

    const { rerender } = renderHook(() => useWTETimeAgainstAssignmentsFetch());
    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledTimes(1);

    const newLoadFn = jest.fn();
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: newLoadFn,
      data: [],
      loading: false,
      error: null,
    });
    rerender();
    expect(newLoadFn).not.toHaveBeenCalled();
  });

  it('should not call loadTimeAgainstAssignments when loadMore is invoked but loading is true', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [
        {
          customerType: 'CUSTOMER',
          displayName: 'First',
          timeAgainstContactDAS: { customer: { id: 'c1' } },
          parentId: null,
          level: 0,
        },
      ],
      loading: true,
      error: null,
      pageInfo: { hasNextPage: true, endCursor: 'cursor-abc' },
    });

    const { result } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    mockLoadTimeAgainstAssignments.mockClear();
    act(() => {
      result.current.loadMore();
    });

    expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
  });

  it('should not call loadTimeAgainstAssignments when loadMore is invoked but hasNextPage is false', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [
        {
          customerType: 'CUSTOMER',
          displayName: 'First',
          timeAgainstContactDAS: { customer: { id: 'c1' } },
          parentId: null,
          level: 0,
        },
      ],
      loading: false,
      error: null,
      pageInfo: { hasNextPage: false, endCursor: 'cursor-abc' },
    });

    const { result } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    mockLoadTimeAgainstAssignments.mockClear();
    act(() => {
      result.current.loadMore();
    });

    expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
  });

  it('should not call loadTimeAgainstAssignments when loadMore is invoked but endCursor is null', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [
        {
          customerType: 'CUSTOMER',
          displayName: 'First',
          timeAgainstContactDAS: { customer: { id: 'c1' } },
          parentId: null,
          level: 0,
        },
      ],
      loading: false,
      error: null,
      pageInfo: { hasNextPage: true, endCursor: null },
    });

    const { result } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    mockLoadTimeAgainstAssignments.mockClear();
    act(() => {
      result.current.loadMore();
    });

    expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
  });

  it('should not call loadTimeAgainstAssignments when loadMore is invoked but lastFetchArgsRef is null', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [],
      loading: false,
      error: null,
      pageInfo: { hasNextPage: true, endCursor: 'cursor-x' },
    });

    const { result } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    mockLoadTimeAgainstAssignments.mockClear();
    act(() => {
      result.current.loadMore();
    });

    expect(mockLoadTimeAgainstAssignments).not.toHaveBeenCalled();
  });

  it('should not dispatch setCustomers when empty data and loading is true', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [],
      loading: true,
      error: null,
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    const setCustomersEmptyCall = mockDispatch.mock.calls.find(
      (call: any) =>
        call[0]?.payload?.customers &&
        Array.isArray(call[0].payload.customers) &&
        call[0].payload.customers.length === 0,
    );
    expect(setCustomersEmptyCall).toBeUndefined();
  });

  it('should dispatch setCustomers with empty array when empty data, not loading, and not load more', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [],
      loading: false,
      error: null,
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { customers: [] },
      }),
    );
  });

  it('should dispatch resetCustomers on initial fetch', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: null,
      loading: false,
      error: null,
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    const resetCall = mockDispatch.mock.calls.find(
      (call: any) => call[0]?.type?.includes?.('resetCustomers') ?? false,
    );
    expect(resetCall).toBeDefined();
  });

  it('should call loadTimeAgainstAssignments with empty timeForEntityId and undefined filter when loadMore with no team member', () => {
    setSelectorState({
      teamMember: null,
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [
        {
          customerType: 'CUSTOMER',
          displayName: 'First',
          fullName: 'First',
          timeAgainstContactDAS: { customer: { id: 'c1' } },
          parentId: null,
          level: 0,
        },
      ],
      loading: false,
      error: null,
      pageInfo: { hasNextPage: true, endCursor: 'cursor-xyz' },
    });

    const { result } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    mockLoadTimeAgainstAssignments.mockClear();
    act(() => {
      result.current.loadMore();
    });

    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith({
      first: 100,
      after: 'cursor-xyz',
      input: { timeForEntityId: '' },
      filter: undefined,
    });
  });

  it('should dispatch setError with null when error clears after previous error', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: null,
      loading: false,
      error: 'Network error',
    });

    const { rerender } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [
        {
          customerType: 'CUSTOMER',
          displayName: 'Ok',
          timeAgainstContactDAS: { customer: { id: 'c1' } },
          parentId: null,
          level: 0,
        },
      ],
      loading: false,
      error: null,
    });
    rerender();

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { error: null },
      }),
    );
  });

  it('should not process customer dispatch when effect runs with same response signature (dedupe guard)', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    const data = [
      {
        customerType: 'CUSTOMER',
        displayName: 'First',
        fullName: 'First',
        timeAgainstContactDAS: { customer: { id: 'c1' } },
        parentId: null,
        level: 0,
      },
    ];
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data,
      loading: false,
      error: null,
      pageInfo: { hasNextPage: false, endCursor: 'cur-1', startCursor: 's1' },
    });

    const { rerender } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    const setCustomersCallsBefore = mockDispatch.mock.calls.filter(
      (call: any) => call[0]?.type?.includes?.('Customers'),
    );

    rerender();

    const setCustomersCallsAfter = mockDispatch.mock.calls.filter((call: any) =>
      call[0]?.type?.includes?.('Customers'),
    );
    expect(setCustomersCallsAfter.length).toBe(setCustomersCallsBefore.length);
  });

  it('should hit dedupe guard return when effect re-runs with identical response (pageInfo dep change)', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    const data = [
      {
        customerType: 'CUSTOMER',
        displayName: 'Dedup',
        fullName: 'Dedup',
        timeAgainstContactDAS: { customer: { id: 'd1' } },
        parentId: null,
        level: 0,
      },
    ];
    const pageInfo1 = {
      hasNextPage: false,
      endCursor: 'cursor-dedup',
      startCursor: 's0',
    };
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data,
      loading: false,
      error: null,
      pageInfo: pageInfo1,
    });

    const { rerender } = renderHook(() => useWTETimeAgainstAssignmentsFetch());
    const firstSetCustomersCount = mockDispatch.mock.calls.filter((call: any) =>
      call[0]?.type?.includes?.('setCustomers'),
    ).length;

    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data,
      loading: false,
      error: null,
      pageInfo: { ...pageInfo1 },
    });
    rerender();

    const secondSetCustomersCount = mockDispatch.mock.calls.filter(
      (call: any) => call[0]?.type?.includes?.('setCustomers'),
    ).length;
    expect(secondSetCustomersCount).toBe(firstSetCustomersCount);
  });

  it('should transform item with project id when customer id is missing', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    const projectOnlyItem = {
      customerType: 'PROJECT',
      displayName: 'Proj Only',
      fullName: 'Proj Only',
      timeAgainstContactDAS: {
        project: { id: 'proj-2' },
      },
      parentId: null,
      level: 0,
    };
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [projectOnlyItem],
      loading: false,
      error: null,
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    const setCustomersCall = mockDispatch.mock.calls.find(
      (call: any) => call[0]?.payload?.customers != null,
    );
    expect(setCustomersCall).toBeDefined();
    const customers = setCustomersCall?.[0]?.payload?.customers ?? [];
    const project = customers.find((c: any) => c.displayName === 'Proj Only');
    expect(project?.id).toBe('');
    expect(project?.__typename).toBe('DataAccess_Project');
  });

  it('should handle pageInfo being null (pageInfo ref sync)', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [],
      loading: false,
      error: null,
      pageInfo: null,
    });

    const { result } = renderHook(() => useWTETimeAgainstAssignmentsFetch());

    expect(result.current.hasMore).toBe(false);
  });

  it('should use project id in signature when customer id is missing', () => {
    setSelectorState({
      teamMember: { id: 'w1' },
    });
    const projectItem = {
      customerType: 'PROJECT',
      displayName: 'Proj Sig',
      fullName: 'Proj Sig',
      timeAgainstContactDAS: { project: { id: 'proj-sig' } },
      parentId: null,
      level: 0,
    };
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [projectItem],
      loading: false,
      error: null,
      pageInfo: { hasNextPage: false, endCursor: 'c1' },
    });

    renderHook(() => useWTETimeAgainstAssignmentsFetch());

    const setCustomersCall = mockDispatch.mock.calls.find(
      (call: any) => call[0]?.payload?.customers != null,
    );
    expect(setCustomersCall).toBeDefined();
    const customers = setCustomersCall?.[0]?.payload?.customers ?? [];
    expect(customers).toHaveLength(1);
    expect(customers[0]?.displayName).toBe('Proj Sig');
  });

  it('should refetch when worker changes', () => {
    setSelectorState({
      teamMember: { id: 'worker-1' },
    });
    mockUseTimeAgainstAssignments.mockReturnValue({
      loadTimeAgainstAssignments: mockLoadTimeAgainstAssignments,
      data: [],
      loading: false,
      error: null,
    });

    const { rerender } = renderHook(() => useWTETimeAgainstAssignmentsFetch());
    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { timeForEntityId: 'worker-1' },
      }),
    );

    mockLoadTimeAgainstAssignments.mockClear();
    setSelectorState({
      teamMember: { id: 'worker-2' },
    });
    rerender();

    expect(mockLoadTimeAgainstAssignments).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { timeForEntityId: 'worker-2' },
      }),
    );
  });
});
