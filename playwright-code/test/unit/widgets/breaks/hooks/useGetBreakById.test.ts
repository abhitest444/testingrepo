import { renderHook, act } from '@testing-library/react-hooks';
import useGetBreakById from 'src/js/widgets/breaks/hooks/useGetBreakById';
import { BreakRule } from 'src/js/widgets/breaks/types';

// Mock the Apollo hooks
const mockGetBreakById = jest.fn();
jest.mock('src/__generated__/oigql/graphql', () => ({
  useGetEmployerBreaksLazyQuery: () => [mockGetBreakById],
  Payroll_Break: {
    Paid: 'PAID',
    Unpaid: 'UNPAID',
  },
  Common_DayOfWeek: {
    Monday: 'MONDAY',
    Tuesday: 'TUESDAY',
    Wednesday: 'WEDNESDAY',
    Thursday: 'THURSDAY',
    Friday: 'FRIDAY',
    Saturday: 'SATURDAY',
    Sunday: 'SUNDAY',
  },
}));

// Mock the sandbox hook
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

// Mock the logging provider
jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: jest.fn(),
}));

// Mock CustomerInteraction
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(),
  TimeCustomerInteraction: {
    BREAK_RULE_READ: 'BREAK_RULE_READ',
  },
}));

const mockUseSandbox = require('@payroll/quicksand').useSandbox;
const mockUseLoggingConfig =
  require('src/js/providers/LoggingConfigProvider').useLoggingConfig;
const mockCustomerInteraction = require('src/js/common/CustomerInteraction');

describe('useGetBreakById', () => {
  let mockSandbox: any;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a simple mock sandbox
    mockSandbox = {
      extensions: {
        qbo: {
          context: {
            getCompanyL10nInfo: jest.fn(),
            getAuthInfo: jest.fn(),
          },
        },
      },
      appContext: {
        getAppInfo: jest.fn(),
      },
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      logException: jest.fn(),
    };

    mockUseSandbox.mockReturnValue(mockSandbox);
    mockUseLoggingConfig.mockReturnValue(mockLogger);
  });

  it('should return the expected hook structure', () => {
    const { result } = renderHook(() => useGetBreakById());

    expect(result.current).toHaveProperty('getBreakByIdPolicy');
    expect(typeof result.current.getBreakByIdPolicy).toBe('function');
  });

  it('should successfully fetch a break by ID', async () => {
    const mockBreakRule: Partial<BreakRule> = {
      id: 'break-rule-id',
      breakName: 'Test Break Rule',
      isActive: true,
      breakType: 'PAID' as any,
      allowManual: true,
      allowAuto: false,
      activeBreakAssignmentCount: 0,
      isDefaultPolicy: false,
      isDeleted: false,
      noSetDuration: false,
    };

    const mockData = {
      payrollEmployerBreaks: {
        nodes: [mockBreakRule],
      },
    };

    mockGetBreakById.mockImplementation(({ onCompleted }) => {
      setTimeout(() => onCompleted(mockData), 0);
    });

    const { result } = renderHook(() => useGetBreakById());

    let resolvedValue: BreakRule | undefined;
    await act(async () => {
      resolvedValue = await result.current.getBreakByIdPolicy('break-rule-id');
    });

    expect(resolvedValue).toEqual(mockBreakRule);
    expect(
      mockCustomerInteraction.createCustomerInteraction,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ');
    expect(
      mockCustomerInteraction.endInteractionWithSuccess,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ');
    expect(mockLogger.info).toHaveBeenCalledWith(expect.any(String), {
      breakId: 'break-rule-id',
      found: true,
    });
  });

  it('should handle case when break is not found', async () => {
    const mockData = {
      payrollEmployerBreaks: {
        nodes: [],
      },
    };

    mockGetBreakById.mockImplementation(({ onCompleted }) => {
      setTimeout(() => onCompleted(mockData), 0);
    });

    const { result } = renderHook(() => useGetBreakById());

    let resolvedValue: BreakRule | undefined;
    await act(async () => {
      resolvedValue = await result.current.getBreakByIdPolicy(
        'non-existent-id',
      );
    });

    expect(resolvedValue).toBeUndefined();
    expect(
      mockCustomerInteraction.endInteractionWithSuccess,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ');
    expect(mockLogger.info).toHaveBeenCalledWith(expect.any(String), {
      breakId: 'non-existent-id',
      found: false,
    });
  });

  it('should handle API errors correctly', async () => {
    const mockError = new Error('API Error') as Error & { code?: string };
    mockError.code = 'API_ERROR';

    mockGetBreakById.mockImplementation(({ onError }) => {
      setTimeout(() => onError(mockError), 0);
    });

    const { result } = renderHook(() => useGetBreakById());

    await act(async () => {
      try {
        await result.current.getBreakByIdPolicy('break-rule-id');
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(
      mockCustomerInteraction.createCustomerInteraction,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ');
    expect(
      mockCustomerInteraction.endInteractionWithFailure,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ', 'API Error');
    expect(mockLogger.logException).toHaveBeenCalledWith(
      expect.any(String),
      mockError,
      {
        breakId: 'break-rule-id',
      },
    );
  });

  it('should handle non-Error objects in error scenario', async () => {
    const mockError = {
      message: 'Non-Error object',
      code: 'CUSTOM_ERROR',
    };

    mockGetBreakById.mockImplementation(({ onError }) => {
      setTimeout(() => onError(mockError), 0);
    });

    const { result } = renderHook(() => useGetBreakById());

    await act(async () => {
      try {
        await result.current.getBreakByIdPolicy('break-rule-id');
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(
      mockCustomerInteraction.endInteractionWithFailure,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ', 'Non-Error object');
    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(String), {
      breakId: 'break-rule-id',
      error: 'Non-Error object',
      code: 'CUSTOM_ERROR',
      response: mockError,
    });
  });

  it('should pass correct parameters to the GraphQL query', async () => {
    const mockData = {
      payrollEmployerBreaks: {
        nodes: [],
      },
    };

    mockGetBreakById.mockImplementation(({ onCompleted }) => {
      setTimeout(() => onCompleted(mockData), 0);
    });

    const { result } = renderHook(() => useGetBreakById());

    await act(async () => {
      await result.current.getBreakByIdPolicy('test-break-id');
    });

    expect(mockGetBreakById).toHaveBeenCalledWith({
      variables: {
        filter: {
          ids: ['test-break-id'],
        },
      },
      context: {
        clientName: 1, // ApolloClientNames.OIGQL enum value
        headers: undefined,
      },
      onCompleted: expect.any(Function),
      onError: expect.any(Function),
    });
  });

  it('should pass includeDeleted parameter when provided', async () => {
    const mockData = {
      payrollEmployerBreaks: {
        nodes: [],
      },
    };

    mockGetBreakById.mockImplementation(({ onCompleted }) => {
      setTimeout(() => onCompleted(mockData), 0);
    });

    const { result } = renderHook(() => useGetBreakById());

    await act(async () => {
      await result.current.getBreakByIdPolicy('test-break-id', true);
    });

    expect(mockGetBreakById).toHaveBeenCalledWith({
      variables: {
        filter: {
          ids: ['test-break-id'],
          includeDeleted: true,
        },
      },
      context: {
        clientName: 1, // ApolloClientNames.OIGQL enum value
        headers: undefined,
      },
      onCompleted: expect.any(Function),
      onError: expect.any(Function),
    });
  });

  it('should pass includeDeleted as false when explicitly set to false', async () => {
    const mockData = {
      payrollEmployerBreaks: {
        nodes: [],
      },
    };

    mockGetBreakById.mockImplementation(({ onCompleted }) => {
      setTimeout(() => onCompleted(mockData), 0);
    });

    const { result } = renderHook(() => useGetBreakById());

    await act(async () => {
      await result.current.getBreakByIdPolicy('test-break-id', false);
    });

    expect(mockGetBreakById).toHaveBeenCalledWith({
      variables: {
        filter: {
          ids: ['test-break-id'],
          includeDeleted: false,
        },
      },
      context: {
        clientName: 1, // ApolloClientNames.OIGQL enum value
        headers: undefined,
      },
      onCompleted: expect.any(Function),
      onError: expect.any(Function),
    });
  });

  it('should successfully fetch a deleted break when includeDeleted is true', async () => {
    const mockDeletedBreakRule: Partial<BreakRule> = {
      id: 'deleted-break-rule-id',
      breakName: 'Deleted Break Rule',
      isActive: false,
      breakType: 'PAID' as any,
      allowManual: true,
      allowAuto: false,
      activeBreakAssignmentCount: 0,
      isDefaultPolicy: false,
      isDeleted: true,
      noSetDuration: false,
    };

    const mockData = {
      payrollEmployerBreaks: {
        nodes: [mockDeletedBreakRule],
      },
    };

    mockGetBreakById.mockImplementation(({ onCompleted }) => {
      setTimeout(() => onCompleted(mockData), 0);
    });

    const { result } = renderHook(() => useGetBreakById());

    let resolvedValue: BreakRule | undefined;
    await act(async () => {
      resolvedValue = await result.current.getBreakByIdPolicy(
        'deleted-break-rule-id',
        true,
      );
    });

    expect(resolvedValue).toEqual(mockDeletedBreakRule);
    expect(
      mockCustomerInteraction.createCustomerInteraction,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ');
    expect(
      mockCustomerInteraction.endInteractionWithSuccess,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ');
    expect(mockLogger.info).toHaveBeenCalledWith(expect.any(String), {
      breakId: 'deleted-break-rule-id',
      found: true,
    });
  });

  it('should not return deleted break when includeDeleted is false', async () => {
    const mockData = {
      payrollEmployerBreaks: {
        nodes: [], // No results when includeDeleted is false for deleted breaks
      },
    };

    mockGetBreakById.mockImplementation(({ onCompleted }) => {
      setTimeout(() => onCompleted(mockData), 0);
    });

    const { result } = renderHook(() => useGetBreakById());

    let resolvedValue: BreakRule | undefined;
    await act(async () => {
      resolvedValue = await result.current.getBreakByIdPolicy(
        'deleted-break-rule-id',
        false,
      );
    });

    expect(resolvedValue).toBeUndefined();
    expect(
      mockCustomerInteraction.endInteractionWithSuccess,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ');
    expect(mockLogger.info).toHaveBeenCalledWith(expect.any(String), {
      breakId: 'deleted-break-rule-id',
      found: false,
    });
  });

  it('should handle API errors correctly when includeDeleted is provided', async () => {
    const mockError = new Error('API Error') as Error & { code?: string };
    mockError.code = 'API_ERROR';

    mockGetBreakById.mockImplementation(({ onError }) => {
      setTimeout(() => onError(mockError), 0);
    });

    const { result } = renderHook(() => useGetBreakById());

    await act(async () => {
      try {
        await result.current.getBreakByIdPolicy('break-rule-id', true);
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(
      mockCustomerInteraction.createCustomerInteraction,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ');
    expect(
      mockCustomerInteraction.endInteractionWithFailure,
    ).toHaveBeenCalledWith(mockSandbox, 'BREAK_RULE_READ', 'API Error');
    expect(mockLogger.logException).toHaveBeenCalledWith(
      expect.any(String),
      mockError,
      {
        breakId: 'break-rule-id',
      },
    );
  });
});
