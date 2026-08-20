import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSandbox } from '@payroll/quicksand';
import React from 'react';
import useBreaksCrud from 'src/js/widgets/breaks/hooks/useBreaksCrud';
import {
  BreakRule,
  BreakRuleInput,
  TeamMember,
} from 'src/js/widgets/breaks/types';
import { Payroll_Break } from 'src/__generated__/oigql/graphql';
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

jest.mock('src/js/widgets/breaks/hooks/useBreakAssignmentCrud', () => ({
  __esModule: true,
  default: () => ({
    createBreakAssignments: jest.fn(),
  }),
}));

// Mock GraphQL hooks
const mockGetAllBreaks = jest.fn();
const mockGetBreaksByAssignee = jest.fn();
const mockCreateEmployerBreak = jest.fn();
const mockUpdateEmployerBreak = jest.fn();
const mockDeleteEmployerBreak = jest.fn();

jest.mock('src/__generated__/oigql/graphql', () => ({
  useGetEmployerBreaksLazyQuery: () => [
    mockGetAllBreaks,
    { loading: false, error: null, data: null },
  ],
  useGetEmployerBreaksByAssigneeLazyQuery: () => [
    mockGetBreaksByAssignee,
    { loading: false, error: null, data: null },
  ],
  useDeleteEmployerBreakMutation: () => [mockDeleteEmployerBreak],
  useCreateEmployerBreakMutation: () => [mockCreateEmployerBreak],
  useUpdateEmployerBreakMutation: () => [mockUpdateEmployerBreak],
  useTaskManagementUpdateTaskMutation: () => [jest.fn()],
  useTaskManagementTasksLazyQuery: () => [jest.fn()],
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
  Payroll_DurationUnit: {
    Minutes: 'MINUTES',
    Hours: 'HOURS',
  },
  Payroll_BreakAssignmentType: {
    Employee: 'EMPLOYEE',
    Vendor: 'VENDOR',
  },
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  setInteractionDegraded: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    BREAK_RULE_READ: 'BREAK_RULE_READ',
    BREAK_RULE_CREATE: 'BREAK_RULE_CREATE',
    BREAK_RULE_UPDATE: 'BREAK_RULE_UPDATE',
    BREAK_RULE_DELETE: 'BREAK_RULE_DELETE',
    BREAK_ASSIGNMENT_READ_BY_ASSIGNEE: 'BREAK_ASSIGNMENT_READ_BY_ASSIGNEE',
  },
}));

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  ApolloClientNames: {
    OIGQL: 'OIGQL',
  },
}));

jest.mock('src/js/widgets/breaks/utils/validationErrorUtils', () => ({
  isValidationErrorResponse: jest.fn(() => false),
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

const mockTeamMembers: TeamMember[] = [
  {
    id: 'member-1',
    name: 'John Doe',
    workerType: 'employee',
    isActive: true,
  },
  {
    id: 'member-2',
    name: 'Jane Smith',
    workerType: 'vendor',
    isActive: true,
  },
];

const mockBreakRules: BreakRule[] = [
  {
    id: 'break-1',
    breakName: 'Lunch Break',
    breakType: Payroll_Break.Paid,
    isActive: true,
    isDefaultPolicy: false,
    allowAuto: true,
    allowManual: true,
    breakDuration: 30,
    durationUnit: 'Minutes' as any,
    activeBreakAssignmentCount: 0,
    isDeleted: false,
    noSetDuration: false,
  },
  {
    id: 'break-2',
    breakName: 'Coffee Break',
    breakType: Payroll_Break.Unpaid,
    isActive: true,
    isDefaultPolicy: true,
    allowAuto: false,
    allowManual: true,
    breakDuration: 15,
    durationUnit: 'Minutes' as any,
    activeBreakAssignmentCount: 0,
    isDeleted: false,
    noSetDuration: false,
  },
];

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
          ids: mockTeamMembers.map((member) => member.id),
          entities: mockTeamMembers.reduce((acc, member) => {
            acc[member.id] = member;
            return acc;
          }, {} as Record<string, TeamMember>),
        },
        loading: false,
        error: null,
        ...initialState.workers,
      },
      breakAssignments: {
        loading: false,
        error: null,
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

describe('useBreaksCrud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);

    // Reset all mock implementations
    mockGetAllBreaks.mockReset();
    mockGetBreaksByAssignee.mockReset();
    mockCreateEmployerBreak.mockReset();
    mockUpdateEmployerBreak.mockReset();
    mockDeleteEmployerBreak.mockReset();
  });

  describe('getAllBreaksPolicies', () => {
    it('should return the getAllBreaksPolicies function', () => {
      const { result } = renderHookWithProviders(() => useBreaksCrud());

      expect(result.current.getAllBreaksPolicies).toBeDefined();
      expect(typeof result.current.getAllBreaksPolicies).toBe('function');
    });

    it('should handle successful getAllBreaksPolicies call', async () => {
      mockGetAllBreaks.mockImplementation(({ onCompleted }) => {
        onCompleted({
          payrollEmployerBreaks: {
            nodes: mockBreakRules,
          },
        });
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      await act(async () => {
        await result.current.getAllBreaksPolicies();
      });

      expect(mockGetAllBreaks).toHaveBeenCalled();
    });

    it('should handle getAllBreaksPolicies error', async () => {
      const mockError = new Error('Failed to fetch breaks');
      mockGetAllBreaks.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      await act(async () => {
        await result.current.getAllBreaksPolicies();
      });

      expect(mockGetAllBreaks).toHaveBeenCalled();
    });
  });

  describe('getBreaksByAssigneeId', () => {
    it('should return the getBreaksByAssigneeId function', () => {
      const { result } = renderHookWithProviders(() => useBreaksCrud());

      expect(result.current.getBreaksByAssigneeId).toBeDefined();
      expect(typeof result.current.getBreaksByAssigneeId).toBe('function');
    });

    it('should handle successful getBreaksByAssigneeId call', async () => {
      mockGetBreaksByAssignee.mockImplementation(({ onCompleted }) => {
        onCompleted(
          {
            payrollEmployerBreaksByAssigneeId: {
              nodes: mockBreakRules,
            },
          },
          'assignee-1',
        );
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      await act(async () => {
        await result.current.getBreaksByAssigneeId('assignee-1', true, false);
      });

      expect(mockGetBreaksByAssignee).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            filter: {
              assigneeId: 'assignee-1',
              isActive: true,
              includeDeleted: false,
            },
          },
        }),
      );
    });

    it('should handle getBreaksByAssigneeId error', async () => {
      const mockError = new Error('Failed to fetch breaks by assignee');
      mockGetBreaksByAssignee.mockImplementation(({ onError }) => {
        onError(mockError, 'assignee-1');
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      await act(async () => {
        await result.current.getBreaksByAssigneeId('assignee-1', true, false);
      });

      expect(mockGetBreaksByAssignee).toHaveBeenCalled();
    });
  });

  describe('createBreaksPolicy', () => {
    it('should return the createBreaksPolicy function', () => {
      const { result } = renderHookWithProviders(() => useBreaksCrud());

      expect(result.current.createBreaksPolicy).toBeDefined();
      expect(typeof result.current.createBreaksPolicy).toBe('function');
    });

    it('should handle successful createBreaksPolicy call', async () => {
      mockCreateEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted(
          {
            payrollCreateEmployerBreak: {
              __typename: 'Payroll_CreateEmployerBreakSuccess',
              breakRule: mockBreakRules[0],
            },
          },
          mockTeamMembers,
        );
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'New Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.createBreaksPolicy(
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(mockCreateEmployerBreak).toHaveBeenCalled();
    });

    it('should handle createBreaksPolicy error', async () => {
      const mockError = new Error('Failed to create break');
      mockCreateEmployerBreak.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'New Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.createBreaksPolicy(
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(mockCreateEmployerBreak).toHaveBeenCalled();
    });

    it('should set isDefaultPolicy based on team member assignments', async () => {
      mockCreateEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted(
          {
            payrollCreateEmployerBreak: {
              __typename: 'Payroll_CreateEmployerBreakSuccess',
              breakRule: mockBreakRules[0],
            },
          },
          mockTeamMembers,
        );
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'New Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.createBreaksPolicy(
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(mockCreateEmployerBreak).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              breakRule: expect.objectContaining({
                isDefaultPolicy: true, // Should be true since all team members are assigned
              }),
            },
          },
        }),
      );
    });
  });

  describe('updateBreaksPolicy', () => {
    it('should return the updateBreaksPolicy function', () => {
      const { result } = renderHookWithProviders(() => useBreaksCrud());

      expect(result.current.updateBreaksPolicy).toBeDefined();
      expect(typeof result.current.updateBreaksPolicy).toBe('function');
    });

    it('should handle successful updateBreaksPolicy call', async () => {
      mockUpdateEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted(
          {
            payrollUpdateEmployerBreak: {
              __typename: 'Payroll_UpdateEmployerBreakSuccess',
              breakRule: mockBreakRules[0],
            },
          },
          mockTeamMembers,
          { breakName: 'Updated Break' },
        );
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'Updated Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.updateBreaksPolicy(
          'break-1',
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(mockUpdateEmployerBreak).toHaveBeenCalled();
    });

    it('should handle updateBreaksPolicy error', async () => {
      const mockError = new Error('Failed to update break');
      mockUpdateEmployerBreak.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'Updated Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.updateBreaksPolicy(
          'break-1',
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(mockUpdateEmployerBreak).toHaveBeenCalled();
    });

    it('should handle isActive toggle without refetch', async () => {
      mockUpdateEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted(
          {
            payrollUpdateEmployerBreak: {
              __typename: 'Payroll_UpdateEmployerBreakSuccess',
              breakRule: mockBreakRules[0],
            },
          },
          mockTeamMembers,
          { isActive: false },
        );
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        isActive: false,
      };

      await act(async () => {
        await result.current.updateBreaksPolicy(
          'break-1',
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(mockUpdateEmployerBreak).toHaveBeenCalled();
    });
  });

  describe('deleteBreaksPolicy', () => {
    it('should return the deleteBreaksPolicy function', () => {
      const { result } = renderHookWithProviders(() => useBreaksCrud());

      expect(result.current.deleteBreaksPolicy).toBeDefined();
      expect(typeof result.current.deleteBreaksPolicy).toBe('function');
    });

    it('should handle successful deleteBreaksPolicy call', async () => {
      mockDeleteEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted(
          {
            payrollDeleteEmployerBreak: {
              __typename: 'Payroll_DeleteEmployerBreakSuccess',
            },
          },
          'break-1',
        );
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      await act(async () => {
        await result.current.deleteBreaksPolicy('break-1');
      });

      expect(mockDeleteEmployerBreak).toHaveBeenCalled();
    });

    it('should handle deleteBreaksPolicy error', async () => {
      const mockError = new Error('Failed to delete break');
      mockDeleteEmployerBreak.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      await act(async () => {
        await result.current.deleteBreaksPolicy('break-1');
      });

      expect(mockDeleteEmployerBreak).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle validation errors correctly', async () => {
      const mockError = {
        code: 'BREAK_NAME_ALREADY_EXISTS',
        message: 'Break name already exists',
      };

      mockCreateEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted({
          payrollCreateEmployerBreak: {
            __typename: 'Payroll_EmployerBreakError',
            ...mockError,
          },
        });
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'Duplicate Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.createBreaksPolicy(
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(mockCreateEmployerBreak).toHaveBeenCalled();
    });

    it('should handle network errors correctly', async () => {
      const mockError = new Error('Network error');
      mockGetAllBreaks.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      await act(async () => {
        await result.current.getAllBreaksPolicies();
      });

      expect(mockGetAllBreaks).toHaveBeenCalled();
    });
  });

  describe('Customer interaction tracking', () => {
    it('should create customer interactions for all operations', async () => {
      const {
        createCustomerInteraction,
      } = require('src/js/common/CustomerInteraction');
      const {
        endInteractionWithSuccess,
      } = require('src/js/common/CustomerInteraction');

      mockGetAllBreaks.mockImplementation(({ onCompleted }) => {
        onCompleted({
          payrollEmployerBreaks: {
            nodes: mockBreakRules,
          },
        });
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      await act(async () => {
        await result.current.getAllBreaksPolicies();
      });

      expect(createCustomerInteraction).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_READ',
      );
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_READ',
      );
    });
  });

  describe('Break assignment handling', () => {
    it('should create break assignments for non-default policies', async () => {
      mockCreateEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted(
          {
            payrollCreateEmployerBreak: {
              __typename: 'Payroll_CreateEmployerBreakSuccess',
              breakRule: {
                ...mockBreakRules[0],
                isDefaultPolicy: false,
              },
            },
          },
          mockTeamMembers,
        );
      });

      const mockCreateBreakAssignments = jest.fn();

      jest.doMock('src/js/widgets/breaks/hooks/useBreakAssignmentCrud', () => ({
        __esModule: true,
        default: () => ({
          createBreakAssignments: mockCreateBreakAssignments,
        }),
      }));

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'New Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.createBreaksPolicy(
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(mockCreateEmployerBreak).toHaveBeenCalled();
    });

    it('should not create break assignments for default policies', async () => {
      mockCreateEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted(
          {
            payrollCreateEmployerBreak: {
              __typename: 'Payroll_CreateEmployerBreakSuccess',
              breakRule: {
                ...mockBreakRules[0],
                isDefaultPolicy: true,
              },
            },
          },
          mockTeamMembers,
        );
      });

      const mockCreateBreakAssignments = jest.fn();

      jest.doMock('src/js/widgets/breaks/hooks/useBreakAssignmentCrud', () => ({
        __esModule: true,
        default: () => ({
          createBreakAssignments: mockCreateBreakAssignments,
        }),
      }));

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'Default Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.createBreaksPolicy(
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(mockCreateEmployerBreak).toHaveBeenCalled();
    });
  });

  describe('Degraded interaction handling', () => {
    it('should mark interaction as degraded when create error message contains "permission denied"', async () => {
      const {
        setInteractionDegraded,
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      const mockError = {
        code: 'GENERAL_ERROR',
        message: 'permission denied for this operation',
      };

      mockCreateEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted({
          payrollCreateEmployerBreak: {
            __typename: 'Payroll_EmployerBreakError',
            ...mockError,
          },
        });
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'Test Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.createBreaksPolicy(
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_CREATE',
        mockError.message,
      );
      expect(endInteractionWithFailure).not.toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_CREATE',
        expect.anything(),
      );
    });

    it('should mark interaction as degraded when update error message contains "forbidden"', async () => {
      const {
        setInteractionDegraded,
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      const mockError = {
        code: 'GENERAL_ERROR',
        message: 'Forbidden access to resource',
      };

      mockUpdateEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted({
          payrollUpdateEmployerBreak: {
            __typename: 'Payroll_EmployerBreakError',
            ...mockError,
          },
        });
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'Updated Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.updateBreaksPolicy(
          'break-1',
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_UPDATE',
        mockError.message,
      );
      expect(endInteractionWithFailure).not.toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_UPDATE',
        expect.anything(),
      );
    });

    it('should mark interaction as degraded when delete error message contains "Read timed out"', async () => {
      const {
        setInteractionDegraded,
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');

      const mockError = {
        code: 'GENERAL_ERROR',
        message: 'Read timed out while processing request',
      };

      mockDeleteEmployerBreak.mockImplementation(({ onCompleted }) => {
        onCompleted({
          payrollDeleteEmployerBreak: {
            __typename: 'Payroll_EmployerBreakError',
            ...mockError,
          },
        });
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      await act(async () => {
        await result.current.deleteBreaksPolicy('break-1');
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_DELETE',
        mockError.message,
      );
      expect(endInteractionWithFailure).not.toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_DELETE',
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

      mockCreateEmployerBreak.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'Test Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.createBreaksPolicy(
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_CREATE',
        mockError.message,
      );
      expect(endInteractionWithFailure).not.toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_CREATE',
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

      mockUpdateEmployerBreak.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'Test Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.updateBreaksPolicy(
          'break-1',
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_UPDATE',
        mockError.message,
      );
      expect(endInteractionWithFailure).not.toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_UPDATE',
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

      mockCreateEmployerBreak.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      const breakRuleInput: BreakRuleInput = {
        breakName: 'Test Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      await act(async () => {
        await result.current.createBreaksPolicy(
          breakRuleInput,
          mockTeamMembers,
        );
      });

      expect(setInteractionDegraded).not.toHaveBeenCalled();
      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_CREATE',
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

      mockDeleteEmployerBreak.mockImplementation(({ onError }) => {
        onError(mockError);
      });

      const { result } = renderHookWithProviders(() => useBreaksCrud());

      await act(async () => {
        await result.current.deleteBreaksPolicy('break-1');
      });

      expect(setInteractionDegraded).toHaveBeenCalledWith(
        mockSandbox,
        'BREAK_RULE_DELETE',
        mockError.message,
      );
    });
  });
});
