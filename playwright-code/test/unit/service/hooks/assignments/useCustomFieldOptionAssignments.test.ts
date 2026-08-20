import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useLazyQuery } from '@apollo/client';
import { useCustomFieldOptionAssignments } from 'src/js/service/hooks/assignments/useCustomFieldOptionAssignments';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

// Mock dependencies
jest.mock('@apollo/client');
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({
    logger: mockLogger,
  })),
}));
jest.mock('src/js/service/AssignmentApolloClient', () => ({
  getAssignmentApolloClient: jest.fn(() => ({})),
}));
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    CUSTOM_FIELD_OPTION_ASSIGNMENT_READ: 'custom-field-option-assignment-read',
  },
}));

const mockUseLazyQuery = useLazyQuery as jest.MockedFunction<
  typeof useLazyQuery
>;

describe('useCustomFieldOptionAssignments', () => {
  const mockLoadQuery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: null,
        loading: false,
        error: undefined,
      } as any,
    ]);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCustomFieldOptionAssignments());

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(result.current.pageInfo).toBe(null);
    expect(typeof result.current.loadCustomFieldOptionAssignments).toBe(
      'function',
    );
  });

  it('should call loadQuery with correct parameters', () => {
    const { result } = renderHook(() => useCustomFieldOptionAssignments());

    const args = {
      input: {
        timeForEntityId: 'worker1',
        timeAgainstEntityId: 'customer1',
        customFieldIds: 'field1',
      },
      filter: {
        assigned: null,
        active: true,
      },
      first: 50,
      after: 'cursor123',
    };

    result.current.loadCustomFieldOptionAssignments(args);

    expect(mockLoadQuery).toHaveBeenCalledWith({
      variables: {
        first: 50,
        after: 'cursor123',
        input: {
          timeForEntityId: 'worker1',
          timeAgainstEntityId: 'customer1',
          customFieldIds: 'field1',
        },
        filter: {
          assigned: null,
          active: true,
        },
      },
      context: {
        headers: expect.any(Object),
      },
    });
  });

  it('should use default first value of 100', () => {
    const { result } = renderHook(() => useCustomFieldOptionAssignments());

    result.current.loadCustomFieldOptionAssignments({
      input: {
        timeForEntityId: 'worker1',
        timeAgainstEntityId: null,
        customFieldIds: 'field1',
      },
    });

    expect(mockLoadQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          first: 100,
        }),
      }),
    );
  });

  it('should transform API data correctly', () => {
    const mockData = {
      timeTrackingCustomFieldOptionAssignments: {
        edges: [
          {
            node: {
              customField: {
                id: 'field1',
                label: 'Department',
              },
              customFieldOptions: [
                {
                  customFieldOption: {
                    id: 'option1',
                  },
                  assigned: true,
                },
                {
                  customFieldOption: {
                    id: 'option2',
                  },
                  assigned: false,
                },
              ],
              timeFor: {
                id: 'worker1',
              },
            },
          },
        ],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'start123',
          endCursor: 'end123',
        },
      },
    };

    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: mockData,
        loading: false,
        error: undefined,
      } as any,
    ]);

    const { result } = renderHook(() => useCustomFieldOptionAssignments());

    expect(result.current.data).toEqual([
      {
        id: 'option1',
        name: 'option1',
        assigned: true,
        customFieldId: 'field1',
      },
      {
        id: 'option2',
        name: 'option2',
        assigned: false,
        customFieldId: 'field1',
      },
    ]);

    expect(result.current.pageInfo).toEqual({
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: 'start123',
      endCursor: 'end123',
    });
  });

  it('should handle empty data gracefully', () => {
    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: {
          timeTrackingCustomFieldOptionAssignments: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
          },
        },
        loading: false,
        error: undefined,
      } as any,
    ]);

    const { result } = renderHook(() => useCustomFieldOptionAssignments());

    expect(result.current.data).toEqual([]);
    expect(result.current.pageInfo).toEqual({
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: undefined,
      endCursor: undefined,
    });
  });

  it('should handle null data gracefully', () => {
    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: null,
        loading: false,
        error: undefined,
      } as any,
    ]);

    const { result } = renderHook(() => useCustomFieldOptionAssignments());

    expect(result.current.data).toEqual([]);
    expect(result.current.pageInfo).toBe(null);
  });

  it('should handle loading state', () => {
    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: null,
        loading: true,
        error: undefined,
      } as any,
    ]);

    const { result } = renderHook(() => useCustomFieldOptionAssignments());

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state', () => {
    const errorMessage = 'Failed to fetch custom field option assignments';

    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: null,
        loading: false,
        error: { message: errorMessage } as any,
      } as any,
    ]);

    const { result } = renderHook(() => useCustomFieldOptionAssignments());

    expect(result.current.error).toBe(errorMessage);
  });

  it('should filter out null nodes', () => {
    const mockData = {
      timeTrackingCustomFieldOptionAssignments: {
        edges: [
          {
            node: {
              customField: {
                id: 'field1',
                label: 'Department',
              },
              customFieldOptions: [
                {
                  customFieldOption: {
                    id: 'option1',
                  },
                  assigned: true,
                },
              ],
              timeFor: {
                id: 'worker1',
              },
            },
          },
          {
            node: null,
          },
          {
            node: {
              customField: {
                id: 'field1',
                label: 'Department',
              },
              customFieldOptions: null,
              timeFor: {
                id: 'worker1',
              },
            },
          },
          {
            node: {
              customField: {
                id: 'field1',
                label: 'Department',
              },
              customFieldOptions: [
                {
                  customFieldOption: {
                    id: 'option2',
                  },
                  assigned: false,
                },
              ],
              timeFor: {
                id: 'worker1',
              },
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      },
    };

    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: mockData,
        loading: false,
        error: undefined,
      } as any,
    ]);

    const { result } = renderHook(() => useCustomFieldOptionAssignments());

    expect(result.current.data).toEqual([
      {
        id: 'option1',
        name: 'option1',
        assigned: true,
        customFieldId: 'field1',
      },
      {
        id: 'option2',
        name: 'option2',
        assigned: false,
        customFieldId: 'field1',
      },
    ]);
  });

  it('should handle missing optional fields with defaults', () => {
    const mockData = {
      timeTrackingCustomFieldOptionAssignments: {
        edges: [
          {
            node: {
              customField: {
                id: 'field1',
                label: 'Department',
              },
              customFieldOptions: [
                {
                  customFieldOption: {
                    id: '',
                  },
                },
              ],
              timeFor: {
                id: 'worker1',
              },
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    mockUseLazyQuery.mockReturnValue([
      mockLoadQuery,
      {
        data: mockData,
        loading: false,
        error: undefined,
      } as any,
    ]);

    const { result } = renderHook(() => useCustomFieldOptionAssignments());

    expect(result.current.data).toEqual([
      {
        id: '',
        name: '',
        assigned: false,
        customFieldId: 'field1',
      },
    ]);
  });

  describe('Logging', () => {
    it('logs info on successful query', () => {
      let onCompletedCallback: ((data: any) => void) | undefined;
      let onErrorCallback: ((error: any) => void) | undefined;

      mockUseLazyQuery.mockImplementation((query, options) => {
        onCompletedCallback = options?.onCompleted;
        onErrorCallback = options?.onError;
        return [
          mockLoadQuery,
          {
            data: null,
            loading: false,
            error: undefined,
          } as any,
        ];
      });

      const { result } = renderHook(() => useCustomFieldOptionAssignments());

      result.current.loadCustomFieldOptionAssignments({
        input: {
          customFieldIds: 'field1',
        },
      });

      // Simulate successful query completion
      if (onCompletedCallback) {
        onCompletedCallback({
          timeTrackingCustomFieldOptionAssignments: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
          },
        });
      }

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=useCustomFieldOptionAssignments Event=Successfully fetched custom field option assignments',
      );
    });

    it('logs error on query failure', () => {
      let onErrorCallback: ((error: any) => void) | undefined;

      mockUseLazyQuery.mockImplementation((query, options) => {
        onErrorCallback = options?.onError;
        return [
          mockLoadQuery,
          {
            data: null,
            loading: false,
            error: new Error('API Error'),
          } as any,
        ];
      });

      const { result } = renderHook(() => useCustomFieldOptionAssignments());

      result.current.loadCustomFieldOptionAssignments({
        input: {
          customFieldIds: 'field1',
        },
      });

      // Simulate error
      if (onErrorCallback) {
        onErrorCallback(new Error('API Error'));
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component=useCustomFieldOptionAssignments Event=Error fetching custom field option assignments',
        { error: 'API Error' },
      );
    });
  });
});
