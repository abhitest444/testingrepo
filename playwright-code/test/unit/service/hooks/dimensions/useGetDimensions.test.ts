import { renderHook, act } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import {
  useGetDimensions,
  mapDimensionsResponse,
} from 'src/js/service/hooks/dimensions/useGetDimensions';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  setInteractionDegraded,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

const mockLazyQuery = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('src/__generated__/timeTracking/graphql', () => ({
  useGetTimeTrackingCustomDimensionsLazyQuery: jest.fn(),
}));

jest.mock('src/js/common/CustomerInteraction', () => {
  const actual = jest.requireActual('src/js/common/CustomerInteraction');
  return {
    ...actual,
    createCustomerInteraction: jest.fn(),
    endInteractionWithSuccess: jest.fn(),
    setInteractionDegraded: jest.fn(),
    getCustomerInteractionPropagationHeaders: jest.fn(() => ({
      'intuit-tid': 'test-tid',
    })),
  };
});

const { useGetTimeTrackingCustomDimensionsLazyQuery } = jest.requireMock(
  'src/__generated__/timeTracking/graphql',
);

const sandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

const mockDimensionNodes = [
  {
    customDimensionDefinition: { id: '1000000023' },
    label: 'Job Costs',
    active: true,
    enabledForTimeTracking: true,
    required: true,
  },
  {
    customDimensionDefinition: { id: '1000000024' },
    label: 'Project Type',
    active: true,
    enabledForTimeTracking: false,
    required: false,
  },
  {
    customDimensionDefinition: { id: '1000000025' },
    label: 'Department',
    active: true,
    enabledForTimeTracking: true,
    required: false,
  },
  {
    customDimensionDefinition: { id: '1000000026' },
    label: 'Service Type',
    active: false,
    enabledForTimeTracking: false,
    required: false,
  },
];

const expectedDimensions = [
  {
    id: '1000000023',
    name: 'Job Costs',
    active: true,
    enabledForTimeTracking: true,
    required: true,
  },
  {
    id: '1000000024',
    name: 'Project Type',
    active: true,
    enabledForTimeTracking: false,
    required: false,
  },
  {
    id: '1000000025',
    name: 'Department',
    active: true,
    enabledForTimeTracking: true,
    required: false,
  },
  {
    id: '1000000026',
    name: 'Service Type',
    active: false,
    enabledForTimeTracking: false,
    required: false,
  },
];

const mockQueryData = {
  timeTrackingCustomDimensions: {
    edges: mockDimensionNodes.map((node) => ({ node })),
    pageInfo: {
      hasNextPage: false,
      endCursor: null,
    },
  },
};

describe('mapDimensionsResponse', () => {
  it('maps wire nodes into DimensionDefinition[]', () => {
    expect(mapDimensionsResponse(mockDimensionNodes)).toEqual(
      expectedDimensions,
    );
  });

  it('returns an empty array when nodes is null or undefined', () => {
    expect(mapDimensionsResponse(null)).toEqual([]);
    expect(mapDimensionsResponse(undefined as never)).toEqual([]);
  });

  it('returns an empty array when nodes is not an array', () => {
    expect(mapDimensionsResponse({} as never)).toEqual([]);
  });

  it('filters out nodes missing a customDimensionDefinition id', () => {
    const nodes = [
      { customDimensionDefinition: { id: 'keep-me' }, label: 'Kept' },
      { customDimensionDefinition: null, label: 'No ref' },
      { label: 'No id' },
      null,
    ];

    expect(mapDimensionsResponse(nodes as never)).toEqual([
      {
        id: 'keep-me',
        name: 'Kept',
      },
    ]);
  });

  it('maps workerDefaultDimensionValue id to workerDefaultOptionId', () => {
    const nodes = [
      {
        customDimensionDefinition: { id: 'dim-with-default' },
        label: 'Cost Center',
        active: true,
        enabledForTimeTracking: true,
        required: false,
        workerDefaultDimensionValue: { id: 'option-42' },
      },
      {
        customDimensionDefinition: { id: 'dim-no-default' },
        label: 'Project',
        active: true,
        enabledForTimeTracking: true,
        required: false,
        workerDefaultDimensionValue: null,
      },
      {
        customDimensionDefinition: { id: 'dim-empty-default' },
        label: 'Region',
        active: true,
        enabledForTimeTracking: true,
        required: false,
        workerDefaultDimensionValue: { id: '  ' },
      },
    ];

    expect(mapDimensionsResponse(nodes as never)).toEqual([
      {
        id: 'dim-with-default',
        name: 'Cost Center',
        active: true,
        enabledForTimeTracking: true,
        required: false,
        workerDefaultOptionId: 'option-42',
      },
      {
        id: 'dim-no-default',
        name: 'Project',
        active: true,
        enabledForTimeTracking: true,
        required: false,
        workerDefaultOptionId: undefined,
      },
      {
        id: 'dim-empty-default',
        name: 'Region',
        active: true,
        enabledForTimeTracking: true,
        required: false,
        workerDefaultOptionId: '  ',
      },
    ]);
  });
});

describe('useGetDimensions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(sandbox);
    mockLazyQuery.mockResolvedValue(undefined);
    useGetTimeTrackingCustomDimensionsLazyQuery.mockReturnValue([
      mockLazyQuery,
      { data: undefined, loading: false, error: undefined },
    ]);
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useGetDimensions());

    expect(result.current.dimensions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.query).toBe('function');
  });

  it('configures the generated lazy query with Time Tracking client and network-only policy', () => {
    renderHook(() => useGetDimensions());

    expect(useGetTimeTrackingCustomDimensionsLazyQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        fetchPolicy: 'network-only',
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
        },
      }),
    );
  });

  it('fetches custom dimension definitions via the generated lazy query', async () => {
    useGetTimeTrackingCustomDimensionsLazyQuery.mockReturnValue([
      mockLazyQuery,
      { data: mockQueryData, loading: false, error: undefined },
    ]);

    const { result } = renderHook(() => useGetDimensions());

    await act(async () => {
      await result.current.query();
    });

    expect(mockLazyQuery).toHaveBeenCalledWith({
      variables: {
        first: 150,
        filter: undefined,
      },
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: { 'intuit-tid': 'test-tid' },
      },
    });
    expect(result.current.dimensions).toEqual(expectedDimensions);
  });

  it('passes filter variables when provided', async () => {
    useGetTimeTrackingCustomDimensionsLazyQuery.mockReturnValue([
      mockLazyQuery,
      { data: mockQueryData, loading: false, error: undefined },
    ]);
    const filter = { active: true, enabledForTimeTracking: true };

    const { result } = renderHook(() => useGetDimensions());

    await act(async () => {
      await result.current.query({ filter });
    });

    expect(mockLazyQuery).toHaveBeenCalledWith({
      variables: {
        first: 150,
        filter,
      },
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: { 'intuit-tid': 'test-tid' },
      },
    });
  });

  it('passes timeForId in the filter when provided', async () => {
    useGetTimeTrackingCustomDimensionsLazyQuery.mockReturnValue([
      mockLazyQuery,
      { data: mockQueryData, loading: false, error: undefined },
    ]);
    const filter = { active: true, enabledForTimeTracking: true };

    const { result } = renderHook(() => useGetDimensions());

    await act(async () => {
      await result.current.query({ filter, timeForId: 'worker-123' });
    });

    expect(mockLazyQuery).toHaveBeenCalledWith({
      variables: {
        first: 150,
        filter: {
          ...filter,
          timeForId: { id: 'worker-123' },
        },
      },
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: { 'intuit-tid': 'test-tid' },
      },
    });
  });

  it('treats a null filter as undefined', async () => {
    useGetTimeTrackingCustomDimensionsLazyQuery.mockReturnValue([
      mockLazyQuery,
      { data: mockQueryData, loading: false, error: undefined },
    ]);

    const { result } = renderHook(() => useGetDimensions());

    await act(async () => {
      await result.current.query({ filter: null });
    });

    expect(mockLazyQuery).toHaveBeenCalledWith({
      variables: {
        first: 150,
        filter: undefined,
      },
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: { 'intuit-tid': 'test-tid' },
      },
    });
  });

  it('reflects loading state from the lazy query', () => {
    useGetTimeTrackingCustomDimensionsLazyQuery.mockReturnValue([
      mockLazyQuery,
      { data: undefined, loading: true, error: undefined },
    ]);

    const { result } = renderHook(() => useGetDimensions());

    expect(result.current.loading).toBe(true);
  });

  it('surfaces apollo errors', () => {
    useGetTimeTrackingCustomDimensionsLazyQuery.mockReturnValue([
      mockLazyQuery,
      {
        data: undefined,
        loading: false,
        error: { message: 'Network error' },
      },
    ]);

    const { result } = renderHook(() => useGetDimensions());

    expect(result.current.error).toBe('Network error');
    expect(result.current.dimensions).toEqual([]);
  });

  it('logs success and ends the customer interaction when the query completes', async () => {
    useGetTimeTrackingCustomDimensionsLazyQuery.mockImplementation(
      (options: { onCompleted?: () => void }) => [
        jest.fn(async () => {
          options?.onCompleted?.();
        }),
        { data: mockQueryData, loading: false, error: undefined },
      ],
    );

    const { result } = renderHook(() => useGetDimensions());

    await act(async () => {
      await result.current.query();
    });

    expect(sandbox.logger.info).toHaveBeenCalledWith(
      'Component=useGetDimensions Event=Fetched',
    );
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      sandbox,
      TimeCustomerInteraction.GET_DIMENSIONS,
    );
  });

  it('creates the customer interaction when the query is invoked', async () => {
    useGetTimeTrackingCustomDimensionsLazyQuery.mockReturnValue([
      mockLazyQuery,
      { data: mockQueryData, loading: false, error: undefined },
    ]);

    const { result } = renderHook(() => useGetDimensions());

    await act(async () => {
      await result.current.query();
    });

    expect(createCustomerInteraction).toHaveBeenCalledWith(
      sandbox,
      TimeCustomerInteraction.GET_DIMENSIONS,
    );
    expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
      sandbox,
      TimeCustomerInteraction.GET_DIMENSIONS,
    );
  });

  it('logs failures and marks the interaction as degraded via onError', () => {
    renderHook(() => useGetDimensions());

    const options =
      useGetTimeTrackingCustomDimensionsLazyQuery.mock.calls[0][0];
    options.onError({ message: 'Network error' });

    expect(sandbox.logger.error).toHaveBeenCalledWith(
      'Component=useGetDimensions Event=Failed',
      { error: 'Network error' },
    );
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      sandbox,
      TimeCustomerInteraction.GET_DIMENSIONS,
      'Network error',
    );
  });
});
