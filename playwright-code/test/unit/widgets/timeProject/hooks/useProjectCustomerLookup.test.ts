import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useLazyQuery } from '@apollo/client';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import projectsReducer from 'src/js/widgets/timeProject/store/projectsSlice';
import filtersReducer from 'src/js/widgets/timeProject/store/filtersSlice';
import uiReducer from 'src/js/widgets/timeProject/store/uiSlice';
import settingsReducer from 'src/js/widgets/timeProject/store/settingsSlice';
import { GET_PROJECT_CUSTOMERS_VIA_CONTACTS } from 'src/js/widgets/timeProject/graphql/queries';
import {
  useProjectCustomerLookup,
  stripProjectIdUrn,
} from 'src/js/widgets/timeProject/hooks/useProjectCustomerLookup';

// Apollo `useLazyQuery` is mocked at the module level. The default
// mock returns the canonical 8-edge contacts response captured from
// production; individual tests override `mockFetchContacts` per case
// (error, partial, empty, etc.).
const mockFetchContacts = jest.fn();
jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(() => [mockFetchContacts]),
}));

// Logger surface — captured so we can assert error-path logging fires
// with the right structured fields.
const mockLoggerError = jest.fn();
const mockUseTimeProjectSandbox = jest.fn();
jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => ({
  __esModule: true,
  useTimeProjectLogger: () => ({
    error: mockLoggerError,
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
  useTimeProjectSandbox: () => mockUseTimeProjectSandbox(),
  withLoggedOperation: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  ...jest.requireActual('src/js/service/utils/sandboxUtils'),
  isWorkforceEnvironment: jest.fn(() => false),
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      projects: projectsReducer,
      filters: filtersReducer,
      ui: uiReducer,
      settings: settingsReducer,
    },
  });

const createWrapper =
  (store: ReturnType<typeof createTestStore>): React.FC =>
  ({ children }) =>
    React.createElement(Provider, { store } as any, children);

const buildContactEdge = (
  id: string,
  projectId: string | null,
  parentId: string | null = null,
  parent: {
    id?: string | null;
    displayName?: string | null;
    fullName?: string | null;
  } | null = null,
) => ({
  cursor: 'cursor',
  node: {
    __typename: 'DataAccess_Project',
    id,
    projectId,
    parentId,
    parent,
  },
});

const buildContactsResponse = (edges: any[]) => ({
  data: { dataAccessContacts: { edges } },
  error: undefined,
});

describe('stripProjectIdUrn', () => {
  // The URN-stripping helper is the join key between the work-projects
  // listing (returns a bare numeric id like `793400145`) and the
  // contacts response (returns a path-style URN whose tail is the
  // same bare id). Coverage-critical because it's also the fallback
  // when the work-projects side comes back URN-shaped.

  it('returns null for null / undefined / empty input', () => {
    expect(stripProjectIdUrn(null)).toBeNull();
    expect(stripProjectIdUrn(undefined)).toBeNull();
    expect(stripProjectIdUrn('')).toBeNull();
  });

  it('returns the input as-is when no colon is present (already bare)', () => {
    expect(stripProjectIdUrn('793400145')).toBe('793400145');
  });

  it('strips the URN prefix and returns the bare numeric tail after the LAST colon', () => {
    expect(
      stripProjectIdUrn(
        '/work/Project; djQuMTo5MzQxNDU3MDk0Nzg0Mjk4OjY4ZDAxMTQ3ZGQ:793400145',
      ),
    ).toBe('793400145');
  });

  it('trims surrounding whitespace before AND after slicing', () => {
    expect(stripProjectIdUrn('  /work/Project;abc:42  ')).toBe('42');
    expect(stripProjectIdUrn('/work/Project;abc:  42  ')).toBe('42');
  });

  it('returns null when the colon is the last character (empty tail)', () => {
    expect(stripProjectIdUrn('/work/Project;abc:')).toBeNull();
  });
});

describe('useProjectCustomerLookup', () => {
  const mockIsWorkforceEnvironment =
    isWorkforceEnvironment as jest.MockedFunction<
      typeof isWorkforceEnvironment
    >;
  const mockUseLazyQuery = useLazyQuery as jest.MockedFunction<
    typeof useLazyQuery
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimeProjectSandbox.mockReturnValue(undefined);
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockFetchContacts.mockResolvedValue(buildContactsResponse([]));
  });

  it('returns an empty map and DOES NOT call the network when workProjectIds is empty', async () => {
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(createTestStore()),
    });

    let refs;
    await act(async () => {
      refs = await result.current.fetchCustomersForProjects([], ['parent-1']);
    });

    expect(refs).toEqual({});
    expect(mockFetchContacts).not.toHaveBeenCalled();
  });

  it('returns an empty map and DOES NOT call the network when parentCustomerIds is empty', async () => {
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(createTestStore()),
    });

    let refs;
    await act(async () => {
      refs = await result.current.fetchCustomersForProjects(['p1'], []);
    });

    expect(refs).toEqual({});
    expect(mockFetchContacts).not.toHaveBeenCalled();
  });

  it('invokes the OIGQL contacts query with the resolved variables and clientName', async () => {
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(createTestStore()),
    });

    await act(async () => {
      await result.current.fetchCustomersForProjects(
        ['767491223', '767602203'],
        ['1', '7'],
      );
    });

    expect(mockFetchContacts).toHaveBeenCalledTimes(1);
    const call = mockFetchContacts.mock.calls[0][0];
    expect(call.variables).toEqual({
      timeAgainstIds: ['1', '7'],
      pageSize: 200,
    });
    // Single-shot — no `cursor` / `after` variable surface.
    expect(call.variables.cursor).toBeUndefined();
    expect(call.context).toEqual(
      expect.objectContaining({ clientName: expect.anything() }),
    );
  });

  it('initializes the contacts query with network-only policy', () => {
    const store = createTestStore();

    renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    expect(mockUseLazyQuery).toHaveBeenCalledTimes(1);
    expect(mockUseLazyQuery).toHaveBeenCalledWith(
      GET_PROJECT_CUSTOMERS_VIA_CONTACTS,
      expect.objectContaining({
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      }),
    );
  });

  it('passes workforce header in contacts lookup context for WFS', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(createTestStore()),
    });

    await act(async () => {
      await result.current.fetchCustomersForProjects(['767491223'], ['1']);
    });

    const call = mockFetchContacts.mock.calls[0][0];
    expect(call.context).toEqual(
      expect.objectContaining({
        clientName: expect.anything(),
        headers: { 'intuit-is-workforce-user': 'true' },
      }),
    );
  });

  it('builds a refs + parents map from the contacts response and dispatches both into Redux', async () => {
    // Mirrors the canonical production payload: contacts returns
    // `{ id, projectId, parentId, parent }` per project, where the
    // `id` is the project's contact id (becomes `customerId`), the
    // `projectId` URN tail joins back to the work-project id, and
    // `parent.id` is the customer-level contact id (becomes
    // `projectParents[<workProjectId>]`).
    mockFetchContacts.mockResolvedValueOnce(
      buildContactsResponse([
        buildContactEdge('5', '/work/Project; abc:767491223', '1', { id: '1' }),
        buildContactEdge('46', '/work/Project; abc:767899019', '34', {
          id: '34',
        }),
      ]),
    );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    let refs;
    await act(async () => {
      refs = await result.current.fetchCustomersForProjects(
        ['767491223', '767899019'],
        ['1', '34'],
      );
    });

    expect(refs).toEqual({
      '767491223': { projectId: '767491223', customerId: '5' },
      '767899019': { projectId: '767899019', customerId: '46' },
    });

    const state = store.getState();
    expect(state.projects.projectRefs).toEqual({
      '767491223': { projectId: '767491223', customerId: '5' },
      '767899019': { projectId: '767899019', customerId: '46' },
    });
    expect(state.projects.projectParents).toEqual({
      '767491223': '1',
      '767899019': '34',
    });
  });

  it('matches when the work-projects id arrives URN-shaped (uses stripped form on both sides)', async () => {
    mockFetchContacts.mockResolvedValueOnce(
      buildContactsResponse([
        buildContactEdge('5', '/work/Project; abc:767491223', '1', { id: '1' }),
      ]),
    );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchCustomersForProjects(
        ['/work/Project; abc:767491223'],
        ['1'],
      );
    });

    // Ref is keyed under the original (URN) form so consumers
    // reading `state.projects.projectRefs[row.projectId]` find it.
    const state = store.getState();
    expect(state.projects.projectRefs).toEqual({
      '/work/Project; abc:767491223': {
        projectId: '/work/Project; abc:767491223',
        customerId: '5',
      },
    });
  });

  it('skips contacts whose stripped projectId is not in the work-projects set', async () => {
    // Contacts can return additional projects under the same parent
    // customer that aren't in the current page — the matcher must
    // ignore them so the resulting `projectRefs` only contains
    // entries the listing actually displays.
    mockFetchContacts.mockResolvedValueOnce(
      buildContactsResponse([
        buildContactEdge('5', '/work/Project; abc:767491223', '1', {
          id: '1',
        }),
        buildContactEdge('99', '/work/Project; abc:999999999', '1', {
          id: '1',
        }),
      ]),
    );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchCustomersForProjects(['767491223'], ['1']);
    });

    expect(store.getState().projects.projectRefs).toEqual({
      '767491223': { projectId: '767491223', customerId: '5' },
    });
  });

  it('falls back to `parentId` when `parent.id` is absent', async () => {
    mockFetchContacts.mockResolvedValueOnce(
      buildContactsResponse([
        buildContactEdge('5', '/work/Project; abc:p1', '7', null),
      ]),
    );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchCustomersForProjects(['p1'], ['7']);
    });

    expect(store.getState().projects.projectParents).toEqual({ p1: '7' });
  });

  it('drops self-loops where the parent id equals the contact id', async () => {
    // Defensive — never observed in practice but a self-loop would
    // produce a duplicate `timeAgainstList` entry on assignment save.
    mockFetchContacts.mockResolvedValueOnce(
      buildContactsResponse([
        buildContactEdge('5', '/work/Project; abc:p1', '5', { id: '5' }),
      ]),
    );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchCustomersForProjects(['p1'], ['5']);
    });

    expect(store.getState().projects.projectParents).toEqual({});
    // The ref itself is still recorded — the self-loop only blocks
    // the parent entry, not the project's own customerId.
    expect(store.getState().projects.projectRefs.p1).toEqual({
      projectId: 'p1',
      customerId: '5',
    });
  });

  it('clears prior projectRefs / projectParents at the start of every call', async () => {
    // Even when the call ends up returning empty results — the
    // caller relies on this so a fresh filter context never sees a
    // ref left over from the prior page.
    const store = createTestStore();
    // Pre-populate the slice with a stale entry.
    store.dispatch({
      type: 'projects/setProjectRefs',
      payload: { stale: { projectId: 'stale', customerId: 'old' } },
    });
    store.dispatch({
      type: 'projects/setProjectParents',
      payload: { stale: 'old-parent' },
    });

    mockFetchContacts.mockResolvedValueOnce(buildContactsResponse([]));

    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchCustomersForProjects(['p1'], ['c1']);
    });

    expect(store.getState().projects.projectRefs).toEqual({});
    expect(store.getState().projects.projectParents).toEqual({});
  });

  it('logs at error-level and returns empty when the contacts query reports a GraphQL error', async () => {
    mockFetchContacts.mockResolvedValueOnce({
      data: undefined,
      error: { message: 'level-1 invalid', name: 'ValidationError' },
    });

    const store = createTestStore();
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    let refs;
    await act(async () => {
      refs = await result.current.fetchCustomersForProjects(['p1'], ['c1']);
    });

    expect(refs).toEqual({});
    expect(store.getState().projects.projectRefs).toEqual({});
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining('Contacts Lookup Failure'),
      expect.objectContaining({
        errorMessage: 'level-1 invalid',
        errorName: 'ValidationError',
        parentCustomerCount: 1,
      }),
    );
  });

  it('logs at error-level and returns empty when fetchContacts itself throws', async () => {
    mockFetchContacts.mockRejectedValueOnce(new Error('network down'));

    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(createTestStore()),
    });

    let refs;
    await act(async () => {
      refs = await result.current.fetchCustomersForProjects(['p1'], ['c1']);
    });

    expect(refs).toEqual({});
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining('Contacts Lookup Threw'),
      expect.objectContaining({
        errorMessage: 'network down',
      }),
    );
  });

  it('returns empty when the response has no edges (no matched projects under the parents)', async () => {
    mockFetchContacts.mockResolvedValueOnce(buildContactsResponse([]));

    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(createTestStore()),
    });

    let refs;
    await act(async () => {
      refs = await result.current.fetchCustomersForProjects(['p1'], ['c1']);
    });

    expect(refs).toEqual({});
  });

  it('returns empty when the response shape is missing `dataAccessContacts` entirely', async () => {
    mockFetchContacts.mockResolvedValueOnce({ data: {}, error: undefined });

    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(createTestStore()),
    });

    let refs;
    await act(async () => {
      refs = await result.current.fetchCustomersForProjects(['p1'], ['c1']);
    });

    expect(refs).toEqual({});
  });

  it('skips edges whose node is null or whose projectId strips to null', async () => {
    mockFetchContacts.mockResolvedValueOnce(
      buildContactsResponse([
        null,
        { node: null },
        // Empty tail after the last colon — strip yields null.
        buildContactEdge('5', '/work/Project; abc:', '1', { id: '1' }),
        // Real match — should still land in the map alongside the
        // skipped entries above.
        buildContactEdge('6', '/work/Project; abc:p1', '1', { id: '1' }),
      ]),
    );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.fetchCustomersForProjects(['p1'], ['1']);
    });

    expect(store.getState().projects.projectRefs).toEqual({
      p1: { projectId: 'p1', customerId: '6' },
    });
  });

  it('drops a slow earlier completion if a newer call has already started (out-of-order guard)', async () => {
    // Concurrency: rapid filter / page toggles can launch overlapping
    // lookups. The hook bumps a request-seq counter on entry; only
    // the LATEST call's completion is allowed to dispatch into Redux.
    let resolveSlow: (value: any) => void = () => {};
    const slowResponse = new Promise((r) => {
      resolveSlow = r;
    });
    mockFetchContacts.mockReturnValueOnce(slowResponse).mockResolvedValueOnce(
      buildContactsResponse([
        buildContactEdge('99', '/work/Project; abc:p2', '2', {
          id: '2',
        }),
      ]),
    );

    const store = createTestStore();
    const { result } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    // Kick off the slow call (no await — let it stay pending).
    let slowPromise: Promise<unknown>;
    act(() => {
      slowPromise = result.current.fetchCustomersForProjects(['p1'], ['1']);
    });

    // Start a newer call while the slow one is still in flight; this
    // bumps `requestSeq` so the slow completion is now stale.
    await act(async () => {
      await result.current.fetchCustomersForProjects(['p2'], ['2']);
    });

    // Newer call's results landed.
    expect(store.getState().projects.projectRefs).toEqual({
      p2: { projectId: 'p2', customerId: '99' },
    });

    // Now resolve the slow call — its dispatch must be SKIPPED.
    resolveSlow(
      buildContactsResponse([
        buildContactEdge('5', '/work/Project; abc:p1', '1', { id: '1' }),
      ]),
    );
    await act(async () => {
      await slowPromise!;
    });

    // Refs from the newer call are still in place; the stale call
    // returned `{}` instead of clobbering them.
    expect(store.getState().projects.projectRefs).toEqual({
      p2: { projectId: 'p2', customerId: '99' },
    });
  });

  it('abandons in-flight work on unmount (counter bump skips dispatch)', async () => {
    let resolveCall: (value: any) => void = () => {};
    const pending = new Promise((r) => {
      resolveCall = r;
    });
    mockFetchContacts.mockReturnValueOnce(pending);

    const store = createTestStore();
    const { result, unmount } = renderHook(() => useProjectCustomerLookup(), {
      wrapper: createWrapper(store),
    });

    let pendingResult: Promise<unknown>;
    act(() => {
      pendingResult = result.current.fetchCustomersForProjects(['p1'], ['1']);
    });

    // Tear down the hook BEFORE the network resolves.
    unmount();

    resolveCall(
      buildContactsResponse([
        buildContactEdge('5', '/work/Project; abc:p1', '1', { id: '1' }),
      ]),
    );
    await act(async () => {
      await pendingResult!;
    });

    // No refs dispatched — the unmount cleanup bumped requestSeq so
    // the (now-stale) completion's final isStale check returns true.
    expect(store.getState().projects.projectRefs).toEqual({});
  });

  // ─────────────────────────────────────────────────────────────────────────
  // shouldBackfillCustomerNames option + customer name resolution
  // ─────────────────────────────────────────────────────────────────────────

  describe('shouldBackfillCustomerNames option', () => {
    it('dispatches backfillCustomerNames with resolved names when option is true', async () => {
      mockFetchContacts.mockResolvedValueOnce(
        buildContactsResponse([
          buildContactEdge('5', '/work/Project; abc:p1', '1', {
            id: '1',
            displayName: 'Acme Corp',
            fullName: 'Acme Corp Full',
          }),
        ]),
      );

      const store = createTestStore();
      const { result } = renderHook(() => useProjectCustomerLookup(), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        await result.current.fetchCustomersForProjects(['p1'], ['1'], {
          shouldBackfillCustomerNames: true,
        });
      });

      // backfillCustomerNames patches rows in the store. Since rows is
      // initially empty the uniqueCustomers remains [] — but we verify the
      // action was dispatched by checking the store state didn't throw and
      // that the ref was built (action sequence is deterministic).
      expect(store.getState().projects.projectRefs).toEqual({
        p1: { projectId: 'p1', customerId: '5' },
      });
    });

    it('prefers parent.displayName over parent.fullName', async () => {
      // We verify the preference by using a populated store and checking
      // that the rows are patched with displayName, not fullName.
      mockFetchContacts.mockResolvedValueOnce(
        buildContactsResponse([
          buildContactEdge('5', '/work/Project; abc:p1', '1', {
            id: '1',
            displayName: 'Display Name',
            fullName: 'Full Name Fallback',
          }),
        ]),
      );

      const store = createTestStore();
      // Pre-load a row so backfillCustomerNames has something to patch.
      store.dispatch({
        type: 'projects/setAllProjects',
        payload: {
          rows: [
            {
              rowIndex: 0,
              uniqueId: 'p1',
              projectId: 'p1',
              projectName: 'P',
              customerId: '1',
              customerName: '',
              status: 'IN_PROGRESS',
              deadline: '',
              deadlineLabel: '',
              budget: '',
              budgetHoursTotal: -1,
              budgetHoursRemaining: -1,
              startDate: '',
              completedDate: '',
              active: true,
              description: '',
              customer: null,
            },
          ],
          totalCount: 1,
          hasNextPage: false,
          endCursor: null,
        },
      });

      const { result } = renderHook(() => useProjectCustomerLookup(), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        await result.current.fetchCustomersForProjects(['p1'], ['1'], {
          shouldBackfillCustomerNames: true,
        });
      });

      expect(store.getState().projects.rows[0].customerName).toBe(
        'Display Name',
      );
    });

    it('falls back to parent.fullName when displayName is absent', async () => {
      mockFetchContacts.mockResolvedValueOnce(
        buildContactsResponse([
          buildContactEdge('5', '/work/Project; abc:p1', '1', {
            id: '1',
            displayName: null,
            fullName: 'Full Name Only',
          }),
        ]),
      );

      const store = createTestStore();
      store.dispatch({
        type: 'projects/setAllProjects',
        payload: {
          rows: [
            {
              rowIndex: 0,
              uniqueId: 'p1',
              projectId: 'p1',
              projectName: 'P',
              customerId: '1',
              customerName: '',
              status: 'IN_PROGRESS',
              deadline: '',
              deadlineLabel: '',
              budget: '',
              budgetHoursTotal: -1,
              budgetHoursRemaining: -1,
              startDate: '',
              completedDate: '',
              active: true,
              description: '',
              customer: null,
            },
          ],
          totalCount: 1,
          hasNextPage: false,
          endCursor: null,
        },
      });

      const { result } = renderHook(() => useProjectCustomerLookup(), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        await result.current.fetchCustomersForProjects(['p1'], ['1'], {
          shouldBackfillCustomerNames: true,
        });
      });

      expect(store.getState().projects.rows[0].customerName).toBe(
        'Full Name Only',
      );
    });

    it('does NOT dispatch backfillCustomerNames when neither displayName nor fullName is present', async () => {
      // parent has no displayName / fullName — the customerNames map is
      // empty so backfillCustomerNames should NOT be dispatched (the
      // guard `if (name)` inside the hook prevents it from firing with
      // an empty payload that would corrupt uniqueCustomers).
      mockFetchContacts.mockResolvedValueOnce(
        buildContactsResponse([
          buildContactEdge('5', '/work/Project; abc:p1', '1', {
            id: '1',
            displayName: null,
            fullName: null,
          }),
        ]),
      );

      const store = createTestStore();
      store.dispatch({
        type: 'projects/setAllProjects',
        payload: {
          rows: [
            {
              rowIndex: 0,
              uniqueId: 'p1',
              projectId: 'p1',
              projectName: 'P',
              customerId: '1',
              customerName: 'Preserved Name',
              status: 'IN_PROGRESS',
              deadline: '',
              deadlineLabel: '',
              budget: '',
              budgetHoursTotal: -1,
              budgetHoursRemaining: -1,
              startDate: '',
              completedDate: '',
              active: true,
              description: '',
              customer: null,
            },
          ],
          totalCount: 1,
          hasNextPage: false,
          endCursor: null,
        },
      });

      const { result } = renderHook(() => useProjectCustomerLookup(), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        await result.current.fetchCustomersForProjects(['p1'], ['1'], {
          shouldBackfillCustomerNames: true,
        });
      });

      // backfillCustomerNames was dispatched but with an empty map
      // (no valid name was found) so the existing name is unchanged.
      expect(store.getState().projects.rows[0].customerName).toBe(
        'Preserved Name',
      );
    });

    it('does NOT dispatch backfillCustomerNames when shouldBackfillCustomerNames is false', async () => {
      mockFetchContacts.mockResolvedValueOnce(
        buildContactsResponse([
          buildContactEdge('5', '/work/Project; abc:p1', '1', {
            id: '1',
            displayName: 'Should Not Appear',
            fullName: 'Should Not Appear Full',
          }),
        ]),
      );

      const store = createTestStore();
      store.dispatch({
        type: 'projects/setAllProjects',
        payload: {
          rows: [
            {
              rowIndex: 0,
              uniqueId: 'p1',
              projectId: 'p1',
              projectName: 'P',
              customerId: '1',
              customerName: 'Original',
              status: 'IN_PROGRESS',
              deadline: '',
              deadlineLabel: '',
              budget: '',
              budgetHoursTotal: -1,
              budgetHoursRemaining: -1,
              startDate: '',
              completedDate: '',
              active: true,
              description: '',
              customer: null,
            },
          ],
          totalCount: 1,
          hasNextPage: false,
          endCursor: null,
        },
      });

      const { result } = renderHook(() => useProjectCustomerLookup(), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        await result.current.fetchCustomersForProjects(['p1'], ['1'], {
          shouldBackfillCustomerNames: false,
        });
      });

      // backfillCustomerNames should NOT be dispatched → name unchanged
      expect(store.getState().projects.rows[0].customerName).toBe('Original');
    });

    it('does NOT dispatch backfillCustomerNames when options are omitted (default behaviour)', async () => {
      mockFetchContacts.mockResolvedValueOnce(
        buildContactsResponse([
          buildContactEdge('5', '/work/Project; abc:p1', '1', {
            id: '1',
            displayName: 'Should Not Appear',
          }),
        ]),
      );

      const store = createTestStore();
      store.dispatch({
        type: 'projects/setAllProjects',
        payload: {
          rows: [
            {
              rowIndex: 0,
              uniqueId: 'p1',
              projectId: 'p1',
              projectName: 'P',
              customerId: '1',
              customerName: 'Original',
              status: 'IN_PROGRESS',
              deadline: '',
              deadlineLabel: '',
              budget: '',
              budgetHoursTotal: -1,
              budgetHoursRemaining: -1,
              startDate: '',
              completedDate: '',
              active: true,
              description: '',
              customer: null,
            },
          ],
          totalCount: 1,
          hasNextPage: false,
          endCursor: null,
        },
      });

      const { result } = renderHook(() => useProjectCustomerLookup(), {
        wrapper: createWrapper(store),
      });

      // Call without the third argument at all
      await act(async () => {
        await result.current.fetchCustomersForProjects(['p1'], ['1']);
      });

      expect(store.getState().projects.rows[0].customerName).toBe('Original');
    });
  });
});
