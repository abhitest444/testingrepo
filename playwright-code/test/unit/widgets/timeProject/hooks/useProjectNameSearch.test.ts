import { renderHook, act } from '@testing-library/react-hooks';
import { useProjectNameSearch } from 'src/js/widgets/timeProject/hooks/useProjectNameSearch';

const mockSearchQuery = jest.fn();
let mockData: any;
let mockLoading = false;
let mockError: any;

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(() => [
    mockSearchQuery,
    { data: mockData, loading: mockLoading, error: mockError },
  ]),
}));

// Replace debounce with a synchronous pass-through so tests don't need
// fake timers. The debounce behaviour is tested by the debounce utility
// itself and is not the concern of this hook's unit test.
// `.cancel` is a jest.fn() so tests can assert it was called by clearResults()
// and the unmount cleanup.
jest.mock('src/js/service/utils/debounce', () => ({
  debounce: (fn: (...args: any[]) => void) => {
    // Ignore any returned Promise so callers can use sync `act(() => ...)`
    // without triggering "act(async) without await" warnings.
    const wrapped = (...args: any[]) => {
      fn(...args);
    };
    wrapped.cancel = jest.fn();
    return wrapped;
  },
}));

const mockUseTimeProjectSandbox = jest.fn().mockReturnValue(undefined);
jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => ({
  __esModule: true,
  useTimeProjectSandbox: () => mockUseTimeProjectSandbox(),
  useTimeProjectLogger: () => ({ error: jest.fn(), info: jest.fn() }),
  // Thin passthrough so tests can verify run() is invoked and the
  // searchError return value flows from Apollo's reactive error state.
  // Also invokes isFailure with the run() result so the callback's
  // branches are exercised during coverage collection.
  withLoggedOperation: jest.fn(
    ({
      run,
      isFailure,
    }: {
      run: () => unknown;
      isFailure?: (res: unknown) => unknown;
    }) => {
      const result = run();
      if (isFailure) isFailure(result);
      return result;
    },
  ),
}));

const mockIsWorkforceEnvironment = jest.fn().mockReturnValue(false);
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  ...jest.requireActual('src/js/service/utils/sandboxUtils'),
  isWorkforceEnvironment: (...args: any[]) =>
    mockIsWorkforceEnvironment(...args),
}));

const mockGetCustomerInteractionPropagationHeaders = jest
  .fn()
  .mockReturnValue({});
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  getCustomerInteractionPropagationHeaders: (...args: any[]) =>
    mockGetCustomerInteractionPropagationHeaders(...args),
}));

// Build a dataAccessContacts edge in the shape returned by GET_PROJECTS_SEARCH_VIA_CONTACTS.
// `id` is the OIGQL short internal integer (e.g. `"15"`).
// `projectId` is the path-style URN (e.g. `/work/Project; djQuMTo5...:767655383`).
// The hook extracts the Workflow API global ID from the URN via `extractWorkflowIdFromUrn`.
const buildContactEdge = (
  id: string,
  displayName: string,
  projectId?: string,
) => ({
  node: { id, displayName, projectId },
});

// Wraps edges in the OIGQL contacts response shape.
const buildContactsData = (
  edges: Array<{
    node: { id: string; displayName: string; projectId?: string } | null;
  }>,
) => ({
  dataAccessContacts: { edges },
});

describe('useProjectNameSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockData = undefined;
    mockLoading = false;
    mockError = undefined;
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseTimeProjectSandbox.mockReturnValue(undefined);
    mockGetCustomerInteractionPropagationHeaders.mockReturnValue({});
    const { useLazyQuery } = require('@apollo/client');
    (useLazyQuery as jest.Mock).mockImplementation(() => [
      mockSearchQuery,
      { data: mockData, loading: mockLoading, error: mockError },
    ]);
  });

  it('returns empty results when no search has been performed', () => {
    const { result } = renderHook(() => useProjectNameSearch());
    expect(result.current.results).toEqual([]);
  });

  it('returns empty results when lastSearchText is blank even if data is present', () => {
    mockData = buildContactsData([
      buildContactEdge(
        '15',
        'Kitchen Remodel',
        '/work/Project; djQuMTo5:767655383',
      ),
    ]);

    const { result } = renderHook(() => useProjectNameSearch());
    // clearResults resets lastSearchText → results should stay empty
    act(() => result.current.clearResults());
    expect(result.current.results).toEqual([]);
  });

  it('calls searchQuery with correct variables when debouncedSearch is called', () => {
    const { result } = renderHook(() => useProjectNameSearch());

    act(() => result.current.debouncedSearch('kitchen'));

    expect(mockSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { searchText: 'kitchen', pageSize: 50 },
      }),
    );
  });

  it('does not call searchQuery for blank/whitespace input', () => {
    const { result } = renderHook(() => useProjectNameSearch());

    act(() => result.current.debouncedSearch('   '));

    expect(mockSearchQuery).not.toHaveBeenCalled();
  });

  it('extracts the Workflow API global ID from a path-style contact URN', () => {
    // OIGQL returns `projectId` as a path-style URN:
    //   `/work/Project; djQuMTo5...:767655383`
    // The hook strips everything up to and including the semicolon, leaving
    // the Workflow API global ID (`djQuMTo5...:767655383`) which is used in
    // the `id in (...)` Workflow filter.
    const { useLazyQuery } = require('@apollo/client');
    (useLazyQuery as jest.Mock).mockImplementation(() => [
      mockSearchQuery,
      {
        data: buildContactsData([
          buildContactEdge(
            '15',
            'Kitchen Remodel',
            '/work/Project; djQuMTo5base64A:767655383',
          ),
          buildContactEdge(
            '14',
            'Bathroom Reno',
            '/work/Project; djQuMTo5base64B:111222333',
          ),
        ]),
        loading: false,
      },
    ]);

    const { result } = renderHook(() => useProjectNameSearch());
    act(() => result.current.debouncedSearch('kitchen'));

    expect(result.current.results).toEqual([
      {
        projectId: 'djQuMTo5base64A:767655383',
        displayName: 'Kitchen Remodel',
      },
      { projectId: 'djQuMTo5base64B:111222333', displayName: 'Bathroom Reno' },
    ]);
  });

  it('drops results where the projectId URN is absent rather than using the OIGQL node.id fallback', () => {
    // node.id is the OIGQL short internal integer — it is NOT a WorkflowGlobalId
    // and cannot be used in a Workflow API id-in filter.  A contact returned
    // without a projectId URN must be excluded from results entirely.
    const { useLazyQuery } = require('@apollo/client');
    (useLazyQuery as jest.Mock).mockImplementation(() => [
      mockSearchQuery,
      {
        data: buildContactsData([
          buildContactEdge('999', 'Fallback Project', undefined),
        ]),
        loading: false,
      },
    ]);

    const { result } = renderHook(() => useProjectNameSearch());
    act(() => result.current.debouncedSearch('fallback'));

    expect(result.current.results).toHaveLength(0);
  });

  it('clears results when clearResults is called', () => {
    const { useLazyQuery } = require('@apollo/client');
    (useLazyQuery as jest.Mock).mockImplementation(() => [
      mockSearchQuery,
      {
        data: buildContactsData([
          buildContactEdge('15', 'Kitchen', '/work/Project; djQuMTo5:101'),
        ]),
        loading: false,
      },
    ]);

    const { result } = renderHook(() => useProjectNameSearch());
    act(() => result.current.debouncedSearch('kitchen'));
    expect(result.current.results).toHaveLength(1);

    act(() => result.current.clearResults());
    expect(result.current.results).toEqual([]);
  });

  it('exposes isLoading from the underlying query', () => {
    const { useLazyQuery } = require('@apollo/client');
    (useLazyQuery as jest.Mock).mockImplementation(() => [
      mockSearchQuery,
      { data: undefined, loading: true },
    ]);

    const { result } = renderHook(() => useProjectNameSearch());
    expect(result.current.isLoading).toBe(true);
  });

  it('exposes searchError when the underlying query returns an error', () => {
    const searchFailure = new Error('contacts search failed');
    const { useLazyQuery } = require('@apollo/client');
    (useLazyQuery as jest.Mock).mockImplementation(() => [
      mockSearchQuery,
      { data: undefined, loading: false, error: searchFailure },
    ]);

    const { result } = renderHook(() => useProjectNameSearch());
    expect(result.current.searchError).toBe(searchFailure);
  });

  it('returns null searchError when there is no query error', () => {
    const { result } = renderHook(() => useProjectNameSearch());
    expect(result.current.searchError).toBeNull();
  });

  it('invokes withLoggedOperation for backend observability on each search', () => {
    const {
      withLoggedOperation,
    } = require('src/js/widgets/timeProject/utils/timeProjectLogging');
    const { result } = renderHook(() => useProjectNameSearch());

    act(() => result.current.debouncedSearch('kitchen'));

    expect(withLoggedOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          start: expect.stringContaining('Project Name Search Started'),
          success: expect.stringContaining('Project Name Search Success'),
          failure: expect.stringContaining('Project Name Search Failure'),
        }),
        interactionName: 'time-project-name-search',
        extraProps: { searchTextLength: 7 },
      }),
    );
  });

  it('does not invoke withLoggedOperation for blank/whitespace input', () => {
    const {
      withLoggedOperation,
    } = require('src/js/widgets/timeProject/utils/timeProjectLogging');
    const { result } = renderHook(() => useProjectNameSearch());

    act(() => result.current.debouncedSearch('   '));

    expect(withLoggedOperation).not.toHaveBeenCalled();
  });

  it('filters out null nodes from edges gracefully', () => {
    const { useLazyQuery } = require('@apollo/client');
    (useLazyQuery as jest.Mock).mockImplementation(() => [
      mockSearchQuery,
      {
        data: buildContactsData([
          { node: null },
          buildContactEdge(
            '15',
            'Valid Project',
            '/work/Project; djQuMTo5base64:101',
          ),
        ]),
        loading: false,
      },
    ]);

    const { result } = renderHook(() => useProjectNameSearch());
    act(() => result.current.debouncedSearch('valid'));

    expect(result.current.results).toEqual([
      { projectId: 'djQuMTo5base64:101', displayName: 'Valid Project' },
    ]);
  });

  it('cancels any pending debounced call when clearResults is called', () => {
    const { result } = renderHook(() => useProjectNameSearch());

    act(() => result.current.debouncedSearch('kitchen'));

    act(() => result.current.clearResults());

    expect((result.current.debouncedSearch as any).cancel).toHaveBeenCalled();
    // State must also be cleared so stale results don't re-appear.
    expect(result.current.results).toEqual([]);
  });

  it('includes the workforce header in the contacts query context for Workforce users', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    const { result } = renderHook(() => useProjectNameSearch());

    act(() => result.current.debouncedSearch('kitchen'));

    expect(mockSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { headers: { 'intuit-is-workforce-user': 'true' } },
      }),
    );
  });

  it('omits the workforce header for non-Workforce users', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    const { result } = renderHook(() => useProjectNameSearch());

    act(() => result.current.debouncedSearch('kitchen'));

    const callArg = mockSearchQuery.mock.calls[0]?.[0];
    expect(
      callArg?.context?.headers?.['intuit-is-workforce-user'],
    ).toBeUndefined();
  });

  it('cancels any pending debounced call on unmount', () => {
    const { result, unmount } = renderHook(() => useProjectNameSearch());

    // Capture the cancel mock before the hook tears down.
    const cancelFn = (result.current.debouncedSearch as any)
      .cancel as jest.Mock;

    act(() => {
      unmount();
    });

    expect(cancelFn).toHaveBeenCalled();
  });

  it('passes trace propagation headers when sandbox is defined', () => {
    const mockSandbox = { performance: {} } as any;
    mockUseTimeProjectSandbox.mockReturnValue(mockSandbox);
    mockGetCustomerInteractionPropagationHeaders.mockReturnValue({
      'intuit-tid': 'test-tid-abc123',
    });

    const { result } = renderHook(() => useProjectNameSearch());
    act(() => result.current.debouncedSearch('roof'));

    expect(mockGetCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
      mockSandbox,
      'time-project-name-search',
    );
    expect(mockSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          headers: expect.objectContaining({ 'intuit-tid': 'test-tid-abc123' }),
        }),
      }),
    );
  });

  it('isFailure callback returns the error message when the query result has an error', () => {
    const {
      withLoggedOperation,
    } = require('src/js/widgets/timeProject/utils/timeProjectLogging');
    let capturedIsFailure: ((res: unknown) => unknown) | undefined;
    (withLoggedOperation as jest.Mock).mockImplementationOnce(
      ({
        run,
        isFailure,
      }: {
        run: () => unknown;
        isFailure?: (res: unknown) => unknown;
      }) => {
        capturedIsFailure = isFailure;
        return run();
      },
    );

    const { result } = renderHook(() => useProjectNameSearch());
    act(() => result.current.debouncedSearch('kitchen'));

    // Truthy branch: error message is present.
    expect(capturedIsFailure?.({ error: { message: 'network failure' } })).toBe(
      'network failure',
    );
    // Falsy branch: no error on the result returns null.
    expect(capturedIsFailure?.({})).toBeNull();
  });

  it('treats a null edge in the contacts array as a missing node (edge?.node branch)', () => {
    const { useLazyQuery } = require('@apollo/client');
    (useLazyQuery as jest.Mock).mockImplementation(() => [
      mockSearchQuery,
      {
        data: buildContactsData([
          null as any,
          buildContactEdge(
            '15',
            'Valid Project',
            '/work/Project; djQuMTo5base64:101',
          ),
        ]),
        loading: false,
      },
    ]);

    const { result } = renderHook(() => useProjectNameSearch());
    act(() => result.current.debouncedSearch('valid'));

    // The null edge is skipped; only the valid project is returned.
    expect(result.current.results).toEqual([
      { projectId: 'djQuMTo5base64:101', displayName: 'Valid Project' },
    ]);
  });

  it('falls back to an empty string when displayName is null', () => {
    const { useLazyQuery } = require('@apollo/client');
    (useLazyQuery as jest.Mock).mockImplementation(() => [
      mockSearchQuery,
      {
        data: buildContactsData([
          {
            node: {
              id: '15',
              displayName: '',
              projectId: '/work/Project; djQuMTo5base64:202',
            },
          },
        ]),
        loading: false,
      },
    ]);

    const { result } = renderHook(() => useProjectNameSearch());
    act(() => result.current.debouncedSearch('proj'));

    expect(result.current.results).toEqual([
      { projectId: 'djQuMTo5base64:202', displayName: '' },
    ]);
  });
});
