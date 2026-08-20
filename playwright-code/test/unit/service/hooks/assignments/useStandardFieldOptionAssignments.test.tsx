import { act } from '@testing-library/react-hooks';
import { useStandardFieldOptionAssignments } from 'src/js/service/hooks/assignments/useStandardFieldOptionAssignments';
import { STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY } from 'src/js/service/queries/timeTrackingAssignmentQueries';
import {
  renderHookWithApolloProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';

// Mock dependencies
jest.mock('src/js/service/AssignmentApolloClient', () => ({
  getAssignmentApolloClient: jest.fn(),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({
    'x-customer-interaction-id': 'test-interaction-id',
  })),
  TimeCustomerInteraction: {
    STANDARD_FIELD_OPTION_ASSIGNMENT_READ:
      'standard-field-option-assignment-read',
  },
}));

const mockGetAssignmentApolloClient = getAssignmentApolloClient as jest.Mock;
const mockCreateCustomerInteraction = createCustomerInteraction as jest.Mock;
const mockEndInteractionWithSuccess = endInteractionWithSuccess as jest.Mock;
const mockEndInteractionWithFailure = endInteractionWithFailure as jest.Mock;
const mockGetCustomerInteractionPropagationHeaders =
  getCustomerInteractionPropagationHeaders as jest.Mock;

describe('useStandardFieldOptionAssignments', () => {
  const sandbox = getDefaultSandbox();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAssignmentApolloClient.mockReturnValue(null);
    mockGetCustomerInteractionPropagationHeaders.mockReturnValue({});
  });

  it('should return initial state', () => {
    const mocks: any[] = [];

    const { result } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.pageInfo).toBeNull();
  });

  it('should load and transform standard field option assignments', async () => {
    const mocks: any[] = [
      {
        request: {
          query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
          variables: {
            first: 100,
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              timeForEntityId: '123',
            },
            filter: { searchText: null },
          },
        },
        result: {
          data: {
            timeTrackingStandardFieldOptionAssignments: {
              edges: [
                {
                  node: {
                    id: '1',
                    name: 'Consulting',
                    assigned: true,
                    active: true,
                    standardFieldLabel: 'SERVICE_ITEM',
                    fullName: 'Consulting',
                    parentId: null,
                    level: null,
                    numberOfChildren: 0,
                    saleDetails: null,
                    taxable: false,
                    timeForContactDAS: {
                      id: '123',
                      __typename: 'Contact',
                    },
                    __typename: 'TimeTracking_StandardFieldOptionAssignment',
                  },
                  cursor: 'cursor1',
                },
                {
                  node: {
                    id: '2',
                    name: 'Development',
                    assigned: false,
                    active: true,
                    standardFieldLabel: 'SERVICE_ITEM',
                    fullName: 'Development',
                    parentId: null,
                    level: null,
                    numberOfChildren: 0,
                    saleDetails: null,
                    taxable: false,
                    timeForContactDAS: null,
                    __typename: 'TimeTracking_StandardFieldOptionAssignment',
                  },
                  cursor: 'cursor2',
                },
              ],
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: 'cursor1',
                endCursor: 'cursor2',
              },
              __typename:
                'TimeTracking_StandardFieldOptionAssignmentConnection',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    act(() => {
      result.current.loadStandardFieldOptionAssignments({
        input: {
          standardFieldLabel: 'SERVICE_ITEM',
          timeForEntityId: '123',
        },
      });
    });

    await waitForNextUpdate();

    expect(mockCreateCustomerInteraction).toHaveBeenCalled();
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0]).toEqual({
      id: '1',
      name: 'Consulting',
      assigned: true,
      active: true,
      standardFieldLabel: 'SERVICE_ITEM',
      fullName: 'Consulting',
      parentId: null,
      level: null,
      numberOfChildren: 0,
      price: null,
      description: null,
      taxable: false,
    });
    expect(result.current.data[1]).toMatchObject({
      id: '2',
      name: 'Development',
      standardFieldLabel: 'SERVICE_ITEM',
      price: null,
      description: null,
      taxable: false,
    });
  });

  it('should transform saleDetails and taxable for SERVICE_ITEM nodes', async () => {
    const mocks: any[] = [
      {
        request: {
          query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
          variables: {
            first: 100,
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              timeForEntityId: '123',
            },
            filter: { searchText: null },
          },
        },
        result: {
          data: {
            timeTrackingStandardFieldOptionAssignments: {
              edges: [
                {
                  node: {
                    id: 'svc-1',
                    name: 'Consulting',
                    assigned: true,
                    active: true,
                    standardFieldLabel: 'SERVICE_ITEM',
                    fullName: 'Consulting',
                    parentId: null,
                    level: null,
                    numberOfChildren: 0,
                    saleDetails: {
                      price: 150.5,
                      description: 'Consulting service description',
                    },
                    taxable: true,
                    __typename: 'TimeTracking_StandardFieldOptionAssignment',
                  },
                  cursor: 'cursor1',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
              __typename:
                'TimeTracking_StandardFieldOptionAssignmentConnection',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    act(() => {
      result.current.loadStandardFieldOptionAssignments({
        input: {
          standardFieldLabel: 'SERVICE_ITEM',
          timeForEntityId: '123',
        },
      });
    });

    await waitForNextUpdate();

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toEqual({
      id: 'svc-1',
      name: 'Consulting',
      assigned: true,
      active: true,
      standardFieldLabel: 'SERVICE_ITEM',
      fullName: 'Consulting',
      parentId: null,
      level: null,
      numberOfChildren: 0,
      price: 150.5,
      description: 'Consulting service description',
      taxable: true,
    });
  });

  it('should handle pageInfo correctly', async () => {
    const mocks: any[] = [
      {
        request: {
          query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
          variables: {
            first: 100,
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              timeForEntityId: '123',
            },
            filter: { searchText: null },
          },
        },
        result: {
          data: {
            timeTrackingStandardFieldOptionAssignments: {
              edges: [],
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: 'cursor1',
                endCursor: 'cursor2',
              },
              __typename:
                'TimeTracking_StandardFieldOptionAssignmentConnection',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    act(() => {
      result.current.loadStandardFieldOptionAssignments({
        input: {
          standardFieldLabel: 'SERVICE_ITEM',
          timeForEntityId: '123',
        },
      });
    });

    await waitForNextUpdate();

    expect(result.current.pageInfo).toEqual({
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: 'cursor1',
      endCursor: 'cursor2',
    });
  });

  it('should support CLASS field label', async () => {
    const mocks: any[] = [
      {
        request: {
          query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
          variables: {
            first: 100,
            input: {
              standardFieldLabel: 'CLASS',
              timeForEntityId: '123',
            },
            filter: { searchText: null },
          },
        },
        result: {
          data: {
            timeTrackingStandardFieldOptionAssignments: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
              __typename:
                'TimeTracking_StandardFieldOptionAssignmentConnection',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    act(() => {
      result.current.loadStandardFieldOptionAssignments({
        input: {
          standardFieldLabel: 'CLASS',
          timeForEntityId: '123',
        },
      });
    });

    await waitForNextUpdate();

    expect(mockCreateCustomerInteraction).toHaveBeenCalled();
  });

  it('should support LOCATION field label', async () => {
    const mocks: any[] = [
      {
        request: {
          query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
          variables: {
            first: 100,
            input: {
              standardFieldLabel: 'LOCATION',
              timeForEntityId: '123',
            },
            filter: { searchText: null },
          },
        },
        result: {
          data: {
            timeTrackingStandardFieldOptionAssignments: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
              __typename:
                'TimeTracking_StandardFieldOptionAssignmentConnection',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    act(() => {
      result.current.loadStandardFieldOptionAssignments({
        input: {
          standardFieldLabel: 'LOCATION',
          timeForEntityId: '123',
        },
      });
    });

    await waitForNextUpdate();

    expect(mockCreateCustomerInteraction).toHaveBeenCalled();
  });

  it('should support customerId and projectId in input', async () => {
    const mocks: any[] = [
      {
        request: {
          query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
          variables: {
            first: 100,
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              timeForEntityId: '123',
              customerId: '456',
              projectId: '789',
            },
            filter: { searchText: null },
          },
        },
        result: {
          data: {
            timeTrackingStandardFieldOptionAssignments: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
              __typename:
                'TimeTracking_StandardFieldOptionAssignmentConnection',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    act(() => {
      result.current.loadStandardFieldOptionAssignments({
        input: {
          standardFieldLabel: 'SERVICE_ITEM',
          timeForEntityId: '123',
          customerId: '456',
          projectId: '789',
        },
      });
    });

    await waitForNextUpdate();

    expect(mockCreateCustomerInteraction).toHaveBeenCalled();
  });

  it('should support assigned filter', async () => {
    const mocks: any[] = [
      {
        request: {
          query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
          variables: {
            first: 100,
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              timeForEntityId: '123',
            },
            filter: {
              assigned: true,
              active: true,
              searchText: null,
            },
          },
        },
        result: {
          data: {
            timeTrackingStandardFieldOptionAssignments: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
              __typename:
                'TimeTracking_StandardFieldOptionAssignmentConnection',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    act(() => {
      result.current.loadStandardFieldOptionAssignments({
        input: {
          standardFieldLabel: 'SERVICE_ITEM',
          timeForEntityId: '123',
        },
        filter: {
          assigned: true,
          active: true,
        },
      });
    });

    await waitForNextUpdate();

    expect(mockCreateCustomerInteraction).toHaveBeenCalled();
  });

  it('should filter out null nodes', async () => {
    const mocks: any[] = [
      {
        request: {
          query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
          variables: {
            first: 100,
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              timeForEntityId: '123',
            },
            filter: { searchText: null },
          },
        },
        result: {
          data: {
            timeTrackingStandardFieldOptionAssignments: {
              edges: [
                {
                  node: {
                    id: '1',
                    name: 'Consulting',
                    assigned: true,
                    active: true,
                    standardFieldLabel: 'SERVICE_ITEM',
                    saleDetails: null,
                    taxable: false,
                    timeForContactDAS: null,
                    __typename: 'TimeTracking_StandardFieldOptionAssignment',
                  },
                  cursor: 'cursor1',
                },
                {
                  node: null,
                  cursor: 'cursor2',
                },
                {
                  node: {
                    id: '2',
                    name: 'Development',
                    assigned: false,
                    active: true,
                    standardFieldLabel: 'SERVICE_ITEM',
                    saleDetails: null,
                    taxable: false,
                    timeForContactDAS: null,
                    __typename: 'TimeTracking_StandardFieldOptionAssignment',
                  },
                  cursor: 'cursor3',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
              __typename:
                'TimeTracking_StandardFieldOptionAssignmentConnection',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    act(() => {
      result.current.loadStandardFieldOptionAssignments({
        input: {
          standardFieldLabel: 'SERVICE_ITEM',
          timeForEntityId: '123',
        },
      });
    });

    await waitForNextUpdate();

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].id).toBe('1');
    expect(result.current.data[1].id).toBe('2');
  });

  it('should handle errors', async () => {
    const mocks: any[] = [
      {
        request: {
          query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
          variables: {
            first: 100,
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              timeForEntityId: '123',
            },
            filter: { searchText: null },
          },
        },
        error: new Error('API Error'),
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    act(() => {
      result.current.loadStandardFieldOptionAssignments({
        input: {
          standardFieldLabel: 'SERVICE_ITEM',
          timeForEntityId: '123',
        },
      });
    });

    await waitForNextUpdate();

    expect(result.current.error).toBe('API Error');
    expect(mockEndInteractionWithFailure).toHaveBeenCalled();
  });

  it('should handle pagination with after cursor', async () => {
    const mocks: any[] = [
      {
        request: {
          query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
          variables: {
            first: 50,
            after: 'cursor123',
            input: {
              standardFieldLabel: 'SERVICE_ITEM',
              timeForEntityId: '123',
            },
            filter: { searchText: null },
          },
        },
        result: {
          data: {
            timeTrackingStandardFieldOptionAssignments: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: 'cursor123',
                endCursor: 'cursor200',
              },
              __typename:
                'TimeTracking_StandardFieldOptionAssignmentConnection',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useStandardFieldOptionAssignments(),
      mocks,
    );

    act(() => {
      result.current.loadStandardFieldOptionAssignments({
        first: 50,
        after: 'cursor123',
        input: {
          standardFieldLabel: 'SERVICE_ITEM',
          timeForEntityId: '123',
        },
      });
    });

    await waitForNextUpdate();

    expect(result.current.pageInfo?.hasPreviousPage).toBe(true);
  });

  describe('CustomerInteraction Integration', () => {
    it('calls createCustomerInteraction with STANDARD_FIELD_OPTION_ASSIGNMENT_READ before executing query', async () => {
      const mocks: any[] = [
        {
          request: {
            query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                standardFieldLabel: 'SERVICE_ITEM',
                timeForEntityId: '123',
              },
              filter: { searchText: null },
            },
          },
          result: {
            data: {
              timeTrackingStandardFieldOptionAssignments: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: null,
                  endCursor: null,
                },
                __typename:
                  'TimeTracking_StandardFieldOptionAssignmentConnection',
              },
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useStandardFieldOptionAssignments(),
        mocks,
      );

      act(() => {
        result.current.loadStandardFieldOptionAssignments({
          input: {
            standardFieldLabel: 'SERVICE_ITEM',
            timeForEntityId: '123',
          },
        });
      });

      expect(mockCreateCustomerInteraction).toHaveBeenCalledWith(
        expect.any(Object),
        'standard-field-option-assignment-read',
      );

      await waitForNextUpdate();
    });

    it('calls getCustomerInteractionPropagationHeaders with STANDARD_FIELD_OPTION_ASSIGNMENT_READ', async () => {
      const mockHeaders = {
        'x-customer-interaction-id': 'test-interaction-id',
      };

      mockGetCustomerInteractionPropagationHeaders.mockReturnValue(mockHeaders);

      const mocks: any[] = [
        {
          request: {
            query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                standardFieldLabel: 'SERVICE_ITEM',
                timeForEntityId: '123',
              },
              filter: { searchText: null },
            },
            context: {
              headers: mockHeaders,
            },
          },
          result: {
            data: {
              timeTrackingStandardFieldOptionAssignments: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: null,
                  endCursor: null,
                },
                __typename:
                  'TimeTracking_StandardFieldOptionAssignmentConnection',
              },
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useStandardFieldOptionAssignments(),
        mocks,
      );

      act(() => {
        result.current.loadStandardFieldOptionAssignments({
          input: {
            standardFieldLabel: 'SERVICE_ITEM',
            timeForEntityId: '123',
          },
        });
      });

      expect(mockGetCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
        expect.any(Object),
        'standard-field-option-assignment-read',
      );

      await waitForNextUpdate();
    });

    it('calls endInteractionWithSuccess with STANDARD_FIELD_OPTION_ASSIGNMENT_READ on successful query', async () => {
      const mocks: any[] = [
        {
          request: {
            query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                standardFieldLabel: 'SERVICE_ITEM',
                timeForEntityId: '123',
              },
              filter: { searchText: null },
            },
          },
          result: {
            data: {
              timeTrackingStandardFieldOptionAssignments: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: null,
                  endCursor: null,
                },
                __typename:
                  'TimeTracking_StandardFieldOptionAssignmentConnection',
              },
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useStandardFieldOptionAssignments(),
        mocks,
      );

      act(() => {
        result.current.loadStandardFieldOptionAssignments({
          input: {
            standardFieldLabel: 'SERVICE_ITEM',
            timeForEntityId: '123',
          },
        });
      });

      await waitForNextUpdate();

      expect(mockEndInteractionWithSuccess).toHaveBeenCalledWith(
        expect.any(Object),
        'standard-field-option-assignment-read',
      );
    });

    it('calls endInteractionWithFailure with STANDARD_FIELD_OPTION_ASSIGNMENT_READ on query error', async () => {
      const mocks: any[] = [
        {
          request: {
            query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                standardFieldLabel: 'SERVICE_ITEM',
                timeForEntityId: '123',
              },
              filter: { searchText: null },
            },
          },
          error: new Error('API Error'),
        },
      ];

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useStandardFieldOptionAssignments(),
        mocks,
      );

      act(() => {
        result.current.loadStandardFieldOptionAssignments({
          input: {
            standardFieldLabel: 'SERVICE_ITEM',
            timeForEntityId: '123',
          },
        });
      });

      await waitForNextUpdate();

      expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
        expect.any(Object),
        'standard-field-option-assignment-read',
        'API Error',
        expect.any(Error),
      );
    });

    it('logs info on successful query', async () => {
      const mocks: any[] = [
        {
          request: {
            query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                standardFieldLabel: 'SERVICE_ITEM',
                timeForEntityId: '123',
              },
              filter: { searchText: null },
            },
          },
          result: {
            data: {
              timeTrackingStandardFieldOptionAssignments: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: null,
                  endCursor: null,
                },
                __typename:
                  'TimeTracking_StandardFieldOptionAssignmentConnection',
              },
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useStandardFieldOptionAssignments(),
        mocks,
        sandbox,
      );

      act(() => {
        result.current.loadStandardFieldOptionAssignments({
          input: {
            standardFieldLabel: 'SERVICE_ITEM',
            timeForEntityId: '123',
          },
        });
      });

      await waitForNextUpdate();

      expect(sandbox.logger.info).toHaveBeenCalledWith(
        'Component=useStandardFieldOptionAssignments Event=Successfully fetched standard field option assignments',
      );
    });

    it('logs error on query failure', async () => {
      const mocks: any[] = [
        {
          request: {
            query: STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
            variables: {
              first: 100,
              input: {
                standardFieldLabel: 'SERVICE_ITEM',
                timeForEntityId: '123',
              },
              filter: { searchText: null },
            },
          },
          error: new Error('API Error'),
        },
      ];

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useStandardFieldOptionAssignments(),
        mocks,
        sandbox,
      );

      act(() => {
        result.current.loadStandardFieldOptionAssignments({
          input: {
            standardFieldLabel: 'SERVICE_ITEM',
            timeForEntityId: '123',
          },
        });
      });

      await waitForNextUpdate();

      expect(sandbox.logger.error).toHaveBeenCalledWith(
        'Component=useStandardFieldOptionAssignments Event=Error fetching standard field option assignments',
        { error: 'API Error' },
      );
    });
  });
});
