import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSandbox } from '@payroll/quicksand';
import React from 'react';
import useBreakAssignmentCrud from 'src/js/widgets/breaks/hooks/useBreakAssignmentCrud';
import breakRulesSlice from 'src/js/widgets/breaks/store/breakRulesSlice';
import quickfillsSlice from 'src/js/widgets/breaks/store/quickfillsSlice';
import breakPolicyFormSlice from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import uiSlice from 'src/js/widgets/breaks/store/uiSlice';
import workerSlice from 'src/js/widgets/breaks/store/workerSlice';
import breakAssignmentsSlice from 'src/js/widgets/breaks/store/breakAssignmentsSlice';
import breakEntriesSlice from 'src/js/widgets/breaks/store/breakEntriesSlice';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => ({
    info: jest.fn(),
    error: jest.fn(),
    logException: jest.fn(),
  }),
}));

// Mock GraphQL hooks
const mockCreateBreakAssignment = jest.fn();

jest.mock('src/__generated__/oigql/graphql', () => ({
  useCreateBreakAssignmentMutation: () => [mockCreateBreakAssignment],
  Payroll_Break: {
    Paid: 'PAID',
    Unpaid: 'UNPAID',
  },
  Payroll_BreakAssignmentType: {
    Employee: 'EMPLOYEE',
    Vendor: 'VENDOR',
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
  Payroll_DurationUnit: {
    Minutes: 'MINUTES',
    Hours: 'HOURS',
  },
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  setInteractionDegraded: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    BREAK_ASSIGNMENT_CREATE: 'BREAK_ASSIGNMENT_CREATE',
    BREAK_ASSIGNMENT_READ: 'BREAK_ASSIGNMENT_READ',
  },
}));

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  ApolloClientNames: {
    OIGQL: 'OIGQL',
  },
}));

jest.mock('src/js/widgets/breaks/utils/assignmentValidationErrorUtils', () => ({
  isAssignmentValidationErrorResponse: jest.fn(() => false),
}));

const mockSandbox = {
  extensions: {
    qbo: {
      context: {
        getCompanyL10nInfo: jest.fn().mockReturnValue({
          defaultDateFormat: 'mm/dd/yyyy',
        }),
        getAuthInfo: jest.fn().mockReturnValue({
          legacyPermissions: {
            features: {
              companyPrefs: 'ALL',
            },
          },
        }),
      },
    },
  },
  experiments: {
    optInUserToTreatmentsIL: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
  },
  appContext: {
    getAppInfo: jest.fn().mockReturnValue({ appName: 'quickbooks' }),
  },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

interface TestInitialState {
  breakRules?: any;
  quickfills?: any;
  breakPolicyForm?: any;
  ui?: any;
  workers?: any;
  breakAssignments?: any;
  breakEntries?: any;
}

const createTestStore = (initialState: TestInitialState = {}) =>
  configureStore({
    reducer: {
      breakRules: breakRulesSlice,
      quickfills: quickfillsSlice,
      breakPolicyForm: breakPolicyFormSlice,
      ui: uiSlice,
      workers: workerSlice,
      breakAssignments: breakAssignmentsSlice,
      breakEntries: breakEntriesSlice,
    },
    preloadedState: {
      breakRules: {
        ids: [],
        entities: {},
        loading: false,
        error: null,
        deleteLoading: false,
        deleteError: null,
        createLoading: false,
        createError: null,
        updateLoading: false,
        updateError: null,
        refetch: false,
        ...initialState.breakRules,
      },
      quickfills: {
        breaksByAssignee: {},
        ...initialState.quickfills,
      },
      breakPolicyForm: {
        tempAssignments: [],
        isFormOpen: false,
        ...initialState.breakPolicyForm,
      },
      ui: {
        isAddBreakRuleEnabled: true,
        isCreateBreakOpen: false,
        isEditBreakOpen: false,
        breakToEdit: null,
        breakToDelete: null,
        isDeleteModalOpen: false,
        pageMessage: {
          show: false,
          type: 'info',
          message: '',
          code: null,
          titleNlsKey: '',
          descriptionNlsKey: '',
        },
        ...initialState.ui,
      },
      workers: {
        teamMembers: {
          ids: [],
          entities: {},
        },
        loading: false,
        error: null,
        ...initialState.workers,
      },
      breakAssignments: {
        entities: {
          ids: [],
          entities: {},
        },
        loading: false,
        error: null,
        createLoading: false,
        createError: null,
        ...initialState.breakAssignments,
      },
      breakEntries: {
        entries: [],
        loading: false,
        error: null,
        ...initialState.breakEntries,
      },
    },
  });

const renderHookWithProviders = (
  hook: () => any,
  initialState: TestInitialState = {},
) => {
  const store = createTestStore(initialState);
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const ProviderComponent = Provider as any;
    return React.createElement(ProviderComponent, { store }, children);
  };
  return renderHook(hook, { wrapper });
};

describe('useBreakAssignmentCrud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    mockCreateBreakAssignment.mockReset();
  });

  describe('createBreakAssignments', () => {
    it('should return the createBreakAssignments function', () => {
      const { result } = renderHookWithProviders(() =>
        useBreakAssignmentCrud(),
      );

      expect(result.current.createBreakAssignments).toBeDefined();
      expect(typeof result.current.createBreakAssignments).toBe('function');
    });

    it('should handle successful createBreakAssignments call', async () => {
      mockCreateBreakAssignment.mockImplementation(({ onCompleted }) => {
        onCompleted({
          payrollCreateBreakAssignment: {
            __typename: 'Payroll_BreakAssignmentResult',
            results: [
              {
                __typename: 'Payroll_CreateBreakAssignmentSuccess',
                breakAssignment: {
                  id: 'assignment-1',
                  breakPolicyId: 'break-1',
                  assignmentType: 'EMPLOYEE',
                  assigneeId: 'member-1',
                  isActive: true,
                },
              },
            ],
          },
        });
      });

      const { result } = renderHookWithProviders(() =>
        useBreakAssignmentCrud(),
      );

      await act(async () => {
        await result.current.createBreakAssignments({
          breakAssignments: [
            {
              breakPolicyId: 'break-1',
              assignmentType: 'EMPLOYEE',
              assigneeId: 'member-1',
              isActive: true,
            },
          ],
        });
      });

      expect(mockCreateBreakAssignment).toHaveBeenCalled();
    });

    it('should handle createBreakAssignments error', async () => {
      const mockError = new Error('Failed to create assignment');
      mockCreateBreakAssignment.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() =>
        useBreakAssignmentCrud(),
      );

      await act(async () => {
        await result.current.createBreakAssignments({
          breakAssignments: [
            {
              breakPolicyId: 'break-1',
              assignmentType: 'EMPLOYEE',
              assigneeId: 'member-1',
              isActive: true,
            },
          ],
        });
      });

      expect(mockCreateBreakAssignment).toHaveBeenCalled();
    });
  });

  describe('Degraded interaction handling', () => {
    it('should mark interaction as degraded when error message contains "permission denied"', async () => {
      const {
        setInteractionDegraded,
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      const mockError = {
        code: 'GENERAL_ERROR',
        message: 'permission denied for this operation',
      };

      mockCreateBreakAssignment.mockImplementation(({ onCompleted }) => {
        onCompleted({
          payrollCreateBreakAssignment: {
            __typename: 'Payroll_BreakAssignmentError',
            ...mockError,
          },
        });
      });

      const { result } = renderHookWithProviders(() =>
        useBreakAssignmentCrud(),
      );

      await act(async () => {
        await result.current.createBreakAssignments({
          breakAssignments: [
            {
              breakPolicyId: 'break-1',
              assignmentType: 'EMPLOYEE',
              assigneeId: 'member-1',
              isActive: true,
            },
          ],
        });
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        mockError.message,
      );
      expect(endInteractionWithFailure).not.toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        expect.anything(),
      );
    });

    it('should mark interaction as degraded when error message contains "forbidden"', async () => {
      const {
        setInteractionDegraded,
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      const mockError = {
        code: 'GENERAL_ERROR',
        message: 'Forbidden access to resource',
      };

      mockCreateBreakAssignment.mockImplementation(({ onCompleted }) => {
        onCompleted({
          payrollCreateBreakAssignment: {
            __typename: 'Payroll_BreakAssignmentError',
            ...mockError,
          },
        });
      });

      const { result } = renderHookWithProviders(() =>
        useBreakAssignmentCrud(),
      );

      await act(async () => {
        await result.current.createBreakAssignments({
          breakAssignments: [
            {
              breakPolicyId: 'break-1',
              assignmentType: 'EMPLOYEE',
              assigneeId: 'member-1',
              isActive: true,
            },
          ],
        });
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        mockError.message,
      );
      expect(endInteractionWithFailure).not.toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        expect.anything(),
      );
    });

    it('should mark interaction as degraded when network error contains "IdentityGraphQLErrorResponseException"', async () => {
      const {
        setInteractionDegraded,
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      const mockError = {
        message: 'IdentityGraphQLErrorResponseException: Access denied',
        code: 'NETWORK_ERROR',
      };

      mockCreateBreakAssignment.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() =>
        useBreakAssignmentCrud(),
      );

      await act(async () => {
        await result.current.createBreakAssignments({
          breakAssignments: [
            {
              breakPolicyId: 'break-1',
              assignmentType: 'EMPLOYEE',
              assigneeId: 'member-1',
              isActive: true,
            },
          ],
        });
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        mockError.message,
      );
      expect(endInteractionWithFailure).not.toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        expect.anything(),
      );
    });

    it('should mark interaction as degraded when error contains "Read timed out"', async () => {
      const {
        setInteractionDegraded,
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      const mockError = {
        message: 'Read timed out while processing request',
        code: 'GENERAL_ERROR',
      };

      mockCreateBreakAssignment.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() =>
        useBreakAssignmentCrud(),
      );

      await act(async () => {
        await result.current.createBreakAssignments({
          breakAssignments: [
            {
              breakPolicyId: 'break-1',
              assignmentType: 'EMPLOYEE',
              assigneeId: 'member-1',
              isActive: true,
            },
          ],
        });
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        mockError.message,
      );
      expect(endInteractionWithFailure).not.toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        expect.anything(),
      );
    });

    it('should mark interaction as degraded when error contains "having some technical difficulties"', async () => {
      const {
        setInteractionDegraded,
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      const mockError = {
        message:
          'We are having some technical difficulties. Please try again later',
        code: 'GENERAL_ERROR',
      };

      mockCreateBreakAssignment.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() =>
        useBreakAssignmentCrud(),
      );

      await act(async () => {
        await result.current.createBreakAssignments({
          breakAssignments: [
            {
              breakPolicyId: 'break-1',
              assignmentType: 'EMPLOYEE',
              assigneeId: 'member-1',
              isActive: true,
            },
          ],
        });
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        mockError.message,
      );
      expect(endInteractionWithFailure).not.toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        expect.anything(),
      );
    });

    it('should call endInteractionWithFailure for non-degraded errors', async () => {
      const {
        setInteractionDegraded,
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      const mockError = {
        message: 'Some random error that should fail',
        code: 'GENERAL_ERROR',
      };

      mockCreateBreakAssignment.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() =>
        useBreakAssignmentCrud(),
      );

      await act(async () => {
        await result.current.createBreakAssignments({
          breakAssignments: [
            {
              breakPolicyId: 'break-1',
              assignmentType: 'EMPLOYEE',
              assigneeId: 'member-1',
              isActive: true,
            },
          ],
        });
      });

      expect(setInteractionDegraded).not.toHaveBeenCalled();
      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        mockError.message,
      );
    });

    it('should handle case-insensitive matching for degraded patterns', async () => {
      const {
        setInteractionDegraded,
      } = require('src/js/common/CustomerInteraction');

      const mockError = {
        message: 'PERMISSION DENIED - Access not allowed',
        code: 'GENERAL_ERROR',
      };

      mockCreateBreakAssignment.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() =>
        useBreakAssignmentCrud(),
      );

      await act(async () => {
        await result.current.createBreakAssignments({
          breakAssignments: [
            {
              breakPolicyId: 'break-1',
              assignmentType: 'EMPLOYEE',
              assigneeId: 'member-1',
              isActive: true,
            },
          ],
        });
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_ASSIGNMENT_CREATE',
        mockError.message,
      );
    });
  });
});
