import { renderHook, act } from '@testing-library/react-hooks';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { useFetchProjectById } from 'src/js/widgets/timeProject/hooks/useFetchProjectById';
import { TIME_PROJECT_LOGGING_CONSTANTS } from 'src/js/widgets/timeProject/constants';

const mockFetchProject = jest.fn();
const mockFetchContacts = jest.fn();

// useLazyQuery is called twice: first for GET_WORKFLOW_PROJECT_BY_ID,
// second for GET_PROJECT_CUSTOMERS_VIA_CONTACTS.
let lazyQueryCallCount = 0;
jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(() => {
    lazyQueryCallCount += 1;
    return lazyQueryCallCount % 2 !== 0
      ? [mockFetchProject]
      : [mockFetchContacts];
  }),
}));

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  ApolloClientNames: {
    WORKFLOW: 6,
    OIGQL: 1,
  },
}));

// withLoggedOperation must call through to `run()` so the underlying
// fetchProjectQuery mock is invoked and existing assertions keep passing.
const mockWithLoggedOperation = jest
  .fn()
  .mockImplementation(({ run }: { run: () => unknown }) => run());
const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();
jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => ({
  __esModule: true,
  useTimeProjectLogger: () => ({
    error: mockLoggerError,
    info: jest.fn(),
    warn: mockLoggerWarn,
    debug: jest.fn(),
  }),
  useTimeProjectSandbox: () => undefined,
  withLoggedOperation: (...args: any[]) => mockWithLoggedOperation(...args),
}));

const mockGetCustomerInteractionPropagationHeaders = jest
  .fn()
  .mockReturnValue({ 'x-intuit-tid': 'test-trace-id' });
jest.mock('src/js/common/CustomerInteraction', () => ({
  TimeCustomerInteraction: {
    TIME_PROJECT_FETCH_BY_ID: 'time-project-fetch-by-id',
  },
  getCustomerInteractionPropagationHeaders: (...args: any[]) =>
    mockGetCustomerInteractionPropagationHeaders(...args),
}));

const mockIsWorkforceEnvironment = jest.fn().mockReturnValue(false);
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  ...jest.requireActual('src/js/service/utils/sandboxUtils'),
  isWorkforceEnvironment: (...args: any[]) =>
    mockIsWorkforceEnvironment(...args),
}));

const buildProjectEdge = (overrides: Record<string, any> = {}) => ({
  cursor: 'cursor-1',
  node: {
    id: 'djQuMTo5:proj-123',
    name: 'Alpha Project',
    status: 'Inprogress',
    description: 'desc',
    dueDate: '2026-09-01',
    completedDate: null,
    startDate: '2026-01-01',
    client: { id: 'djQuMTo5:cust-456' },
    active: true,
    ...overrides,
  },
});

const buildProjectResponse = (edges: any[] = [buildProjectEdge()]) => ({
  data: {
    company: {
      projects: { edges },
    },
  },
});

const buildContactsResponse = (displayName?: string, fullName?: string) => ({
  data: {
    dataAccessContacts: {
      edges: [
        {
          node: {
            id: 'contact-1',
            parent: {
              displayName: displayName ?? null,
              fullName: fullName ?? null,
            },
          },
        },
      ],
    },
  },
});

describe('useFetchProjectById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lazyQueryCallCount = 0;
    mockWithLoggedOperation.mockImplementation(
      ({ run }: { run: () => unknown }) => run(),
    );
    mockIsWorkforceEnvironment.mockReturnValue(false);
  });

  it('returns null when the Workflow API returns no edges', async () => {
    mockFetchProject.mockResolvedValueOnce(buildProjectResponse([]));

    const { result } = renderHook(() => useFetchProjectById());

    let row;
    await act(async () => {
      row = await result.current.fetchProjectById('proj-123');
    });

    expect(row).toBeNull();
  });

  it('calls the project query with the correct filter and WORKFLOW client context', async () => {
    mockFetchProject.mockResolvedValueOnce(buildProjectResponse());
    mockFetchContacts.mockResolvedValueOnce(buildContactsResponse());

    const { result } = renderHook(() => useFetchProjectById());

    await act(async () => {
      await result.current.fetchProjectById('proj-123');
    });

    expect(mockFetchProject).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          filter:
            "deleted='false' && inServiceToType in ('CONTACT') && id='proj-123'",
        },
        context: expect.objectContaining({
          clientName: ApolloClientNames.WORKFLOW,
        }),
      }),
    );
  });

  it('calls the contacts query with OIGQL client context to resolve customer name', async () => {
    mockFetchProject.mockResolvedValueOnce(buildProjectResponse());
    mockFetchContacts.mockResolvedValueOnce(buildContactsResponse('Acme Corp'));

    const { result } = renderHook(() => useFetchProjectById());

    await act(async () => {
      await result.current.fetchProjectById('proj-123');
    });

    expect(mockFetchContacts).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { clientName: ApolloClientNames.OIGQL },
      }),
    );
  });

  it('returns a row with customerName resolved from parent.displayName', async () => {
    mockFetchProject.mockResolvedValueOnce(buildProjectResponse());
    mockFetchContacts.mockResolvedValueOnce(buildContactsResponse('Acme Corp'));

    const { result } = renderHook(() => useFetchProjectById());

    let row: any;
    await act(async () => {
      row = await result.current.fetchProjectById('proj-123');
    });

    expect(row).not.toBeNull();
    expect(row.customerName).toBe('Acme Corp');
    expect(row.projectName).toBe('Alpha Project');
  });

  it('falls back to parent.fullName when displayName is absent', async () => {
    mockFetchProject.mockResolvedValueOnce(buildProjectResponse());
    mockFetchContacts.mockResolvedValueOnce(
      buildContactsResponse(undefined, 'Full Name Only'),
    );

    const { result } = renderHook(() => useFetchProjectById());

    let row: any;
    await act(async () => {
      row = await result.current.fetchProjectById('proj-123');
    });

    expect(row.customerName).toBe('Full Name Only');
  });

  it('returns the row without a customerName when contacts lookup fails (best-effort)', async () => {
    mockFetchProject.mockResolvedValueOnce(buildProjectResponse());
    mockFetchContacts.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useFetchProjectById());

    let row: any;
    await act(async () => {
      row = await result.current.fetchProjectById('proj-123');
    });

    expect(row).not.toBeNull();
    // customerName is empty — contacts failure is swallowed gracefully
    expect(row.customerName).toBe('');
  });

  it('skips the contacts query entirely when customerId is empty', async () => {
    mockFetchProject.mockResolvedValueOnce(
      buildProjectResponse([
        buildProjectEdge({ client: null }), // no client → customerId = ''
      ]),
    );

    const { result } = renderHook(() => useFetchProjectById());

    await act(async () => {
      await result.current.fetchProjectById('proj-no-customer');
    });

    expect(mockFetchContacts).not.toHaveBeenCalled();
  });

  it('decodes the Workflow API global project ID to a local ID', async () => {
    mockFetchProject.mockResolvedValueOnce(
      buildProjectResponse([
        buildProjectEdge({
          id: 'djQuMTo5OjAuMTo5:793400145',
          client: null,
        }),
      ]),
    );

    const { result } = renderHook(() => useFetchProjectById());

    let row: any;
    await act(async () => {
      row = await result.current.fetchProjectById('793400145');
    });

    expect(row).not.toBeNull();
    expect(row.projectId).toBe('793400145');
  });

  it('wraps the Workflow API call in withLoggedOperation with the correct interaction name and Splunk event strings', async () => {
    mockFetchProject.mockResolvedValueOnce(buildProjectResponse([]));

    const { result } = renderHook(() => useFetchProjectById());

    await act(async () => {
      await result.current.fetchProjectById('proj-abc');
    });

    expect(mockWithLoggedOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        interactionName: 'time-project-fetch-by-id',
        event: {
          start: TIME_PROJECT_LOGGING_CONSTANTS.READS.FETCH_PROJECT_BY_ID_START,
          success:
            TIME_PROJECT_LOGGING_CONSTANTS.READS.FETCH_PROJECT_BY_ID_SUCCESS,
          failure:
            TIME_PROJECT_LOGGING_CONSTANTS.READS.FETCH_PROJECT_BY_ID_FAILURE,
        },
        extraProps: { projectId: 'proj-abc' },
      }),
    );
  });

  it('includes the workforce header in the Workflow API query context for Workforce users', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockFetchProject.mockResolvedValueOnce(buildProjectResponse([]));

    const { result } = renderHook(() => useFetchProjectById());

    await act(async () => {
      await result.current.fetchProjectById('proj-wfs');
    });

    expect(mockFetchProject).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          headers: expect.objectContaining({
            'intuit-is-workforce-user': 'true',
          }),
        }),
      }),
    );
  });

  it('includes the workforce header in the contacts query context for Workforce users', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockFetchProject.mockResolvedValueOnce(buildProjectResponse());
    mockFetchContacts.mockResolvedValueOnce(buildContactsResponse('Acme Corp'));

    const { result } = renderHook(() => useFetchProjectById());

    await act(async () => {
      await result.current.fetchProjectById('proj-wfs');
    });

    expect(mockFetchContacts).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          headers: { 'intuit-is-workforce-user': 'true' },
        }),
      }),
    );
  });

  it('omits the workforce header in both queries for non-Workforce users', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockFetchProject.mockResolvedValueOnce(buildProjectResponse());
    mockFetchContacts.mockResolvedValueOnce(buildContactsResponse('Acme Corp'));

    const { result } = renderHook(() => useFetchProjectById());

    await act(async () => {
      await result.current.fetchProjectById('proj-qbo');
    });

    const projectCallHeaders =
      mockFetchProject.mock.calls[0]?.[0]?.context?.headers;
    expect(projectCallHeaders?.['intuit-is-workforce-user']).toBeUndefined();

    const contactsCallHeaders =
      mockFetchContacts.mock.calls[0]?.[0]?.context?.headers;
    expect(contactsCallHeaders?.['intuit-is-workforce-user']).toBeUndefined();
  });

  it('passes trace propagation headers when sandbox is available', async () => {
    const mockSandbox = { performance: {}, logger: {} };
    // Override the sandbox mock to return a truthy value for this test.
    jest
      .spyOn(
        jest.requireMock('src/js/widgets/timeProject/utils/timeProjectLogging'),
        'useTimeProjectSandbox',
      )
      .mockReturnValue(mockSandbox);

    mockFetchProject.mockResolvedValueOnce(buildProjectResponse([]));

    const { result } = renderHook(() => useFetchProjectById());

    await act(async () => {
      await result.current.fetchProjectById('proj-xyz');
    });

    expect(mockGetCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
      mockSandbox,
      'time-project-fetch-by-id',
    );
    expect(mockFetchProject).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          headers: { 'x-intuit-tid': 'test-trace-id' },
        }),
      }),
    );
  });

  describe('isAccountant context for Workflow Open status badge', () => {
    it('maps Open → TODO for QBOA user (isAccountant=true)', async () => {
      mockFetchProject.mockResolvedValueOnce(
        buildProjectResponse([
          buildProjectEdge({ status: 'Open', client: null }),
        ]),
      );

      const { result } = renderHook(() =>
        useFetchProjectById({ isAccountant: true }),
      );

      let row: any;
      await act(async () => {
        row = await result.current.fetchProjectById('proj-qboa');
      });

      expect(row?.status).toBe('TODO');
    });

    it('maps Open → NOT_STARTED for QBO user (isAccountant=false)', async () => {
      mockFetchProject.mockResolvedValueOnce(
        buildProjectResponse([
          buildProjectEdge({ status: 'Open', client: null }),
        ]),
      );

      const { result } = renderHook(() =>
        useFetchProjectById({ isAccountant: false }),
      );

      let row: any;
      await act(async () => {
        row = await result.current.fetchProjectById('proj-qbo');
      });

      expect(row?.status).toBe('NOT_STARTED');
    });

    it('defaults Open → TODO when no context is provided', async () => {
      mockFetchProject.mockResolvedValueOnce(
        buildProjectResponse([
          buildProjectEdge({ status: 'Open', client: null }),
        ]),
      );

      const { result } = renderHook(() => useFetchProjectById());

      let row: any;
      await act(async () => {
        row = await result.current.fetchProjectById('proj-default');
      });

      expect(row?.status).toBe('TODO');
    });
  });

  describe('onUnknownStatus structured logging', () => {
    it('calls logger.warn when an unrecognised project status is returned by the API', async () => {
      mockFetchProject.mockResolvedValueOnce(
        buildProjectResponse([
          buildProjectEdge({ status: 'FUTURE_UNKNOWN_STATUS', client: null }),
        ]),
      );

      const { result } = renderHook(() => useFetchProjectById());

      await act(async () => {
        await result.current.fetchProjectById('proj-unknown');
      });

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Component=useFetchProjectById Event=unknown_project_status',
        expect.objectContaining({ status: 'FUTURE_UNKNOWN_STATUS' }),
      );
    });
  });
});
