import { createQbtOrchestratorStore } from 'test/unit/testUtils';
import {
  selectOvertimePolicies,
  selectIsLoadingPolicies,
  selectPoliciesPageInfo,
  selectShowLandingPage,
  selectIsTrowserOpen,
  selectCurrentPage,
  selectSelectedPolicyId,
  selectShowPolicyDetails,
  selectOvertimeError,
  selectHasPolicies,
  selectPoliciesCount,
  selectShowWizard,
  selectWizardCurrentStep,
  selectPolicyFormData,
  selectPolicyMemberIds,
  selectPolicyName,
  selectPolicyIsDefault,
  selectPolicyIsBasic,
  selectOvertimeRuleType,
  selectOvertimeRules,
  selectWizardEditMode,
  selectWizardStartStep,
  selectWizardOrigin,
  selectEditingPolicyId,
  selectEditingPolicyDescription,
  selectPolicyAssignments,
  selectPolicyDescription,
  selectAssignmentsDirty,
  selectInitialMemberIds,
  selectWizardMembersCache,
  selectWizardCachedGroups,
  selectWizardGroupsLoaded,
  selectWizardGroupsLoading,
  selectWizardCachedWorkers,
  selectWizardWorkersLoaded,
  selectWizardWorkersLoading,
  selectWizardWorkersTotalCount,
  selectWizardWorkersPageInfo,
  selectWizardCursorHistory,
  selectWizardCurrentAfterCursor,
  selectIsCreatingPolicy,
  selectCreatePolicyError,
  selectIsUpdatingPolicy,
  selectUpdatePolicyError,
  selectIsDeletingPolicy,
  selectDeletePolicyError,
  selectIsManagingAssignments,
  selectAssignmentsError,
  selectPolicyToDelete,
  selectShowDeleteModal,
  selectRefetchPolicies,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/store/overtimeSelectors';
import { WizardStepId } from 'src/js/widgets/qbtOrchestrator/features/overtime/store/overtimeSlice';
import {
  createOvertimePolicy,
  createOvertimePolicies,
  createAssignment,
} from 'test/unit/fixtures/overtimeFixtures';

describe('overtimeSelectors', () => {
  // Helper that returns a state with overtime === undefined to exercise ?? fallback branches
  const getEmptyState = () => ({ overtime: undefined } as any);

  const getState = (overrides: any = {}) => {
    const store = createQbtOrchestratorStore({
      overtime: {
        policies: [],
        policiesPageInfo: null,
        isLoadingPolicies: false,
        showLandingPage: false,
        isTrowserOpen: false,
        currentPage: 1,
        selectedPolicyId: null,
        showPolicyDetails: false,
        showWizard: false,
        wizardCurrentStep: WizardStepId.POLICY_NAME,
        wizardStartStep: WizardStepId.POLICY_NAME,
        wizardOrigin: null,
        wizardEditMode: false,
        policyFormData: {
          id: null,
          description: '',
          name: '',
          isDefault: false,
          overtimeRuleType: '',
          rules: [],
          policyMemberIds: [],
          policyAssignments: [],
          assignmentsDirty: false,
        },
        wizardMembersCache: {
          groups: [],
          groupsLoaded: false,
          groupsLoading: false,
          workers: [],
          workersLoaded: false,
          workersLoading: false,
          workersTotalCount: null,
          workersPageInfo: null,
          cursorHistory: [],
          currentAfterCursor: undefined,
        },
        error: null,
        isCreatingPolicy: false,
        createPolicyError: null,
        isUpdatingPolicy: false,
        updatePolicyError: null,
        isDeletingPolicy: false,
        deletePolicyError: null,
        isManagingAssignments: false,
        assignmentsError: null,
        policyToDelete: null,
        showDeleteModal: false,
        refetchPolicies: false,
        ...overrides,
      },
    });
    return store.getState() as any;
  };

  // ==========================================
  // Basic policy list selectors
  // ==========================================

  describe('selectOvertimePolicies', () => {
    it('returns empty array when no policies', () => {
      expect(selectOvertimePolicies(getState())).toEqual([]);
    });

    it('returns policies when present', () => {
      const policies = createOvertimePolicies(2);
      expect(selectOvertimePolicies(getState({ policies }))).toEqual(policies);
    });
  });

  describe('simple boolean/value selectors', () => {
    it.each([
      {
        description: 'selectIsLoadingPolicies',
        selector: selectIsLoadingPolicies,
        expected: false,
      },
      {
        description: 'selectShowLandingPage',
        selector: selectShowLandingPage,
        expected: false,
      },
      {
        description: 'selectIsTrowserOpen',
        selector: selectIsTrowserOpen,
        expected: false,
      },
      {
        description: 'selectCurrentPage',
        selector: selectCurrentPage,
        expected: 1,
      },
      {
        description: 'selectSelectedPolicyId',
        selector: selectSelectedPolicyId,
        expected: null,
      },
    ] as { description: string; selector: (state: any) => any; expected: unknown }[])(
      '$description returns default value',
      ({ selector, expected }) => {
        if (expected === null) {
          expect(selector(getState())).toBeNull();
        } else {
          expect(selector(getState())).toEqual(expected);
        }
      },
    );

    it.each([
      {
        description: 'selectIsLoadingPolicies',
        selector: selectIsLoadingPolicies,
        override: { isLoadingPolicies: true },
        expected: true,
      },
      {
        description: 'selectShowLandingPage',
        selector: selectShowLandingPage,
        override: { showLandingPage: true },
        expected: true,
      },
      {
        description: 'selectIsTrowserOpen',
        selector: selectIsTrowserOpen,
        override: { isTrowserOpen: true },
        expected: true,
      },
      {
        description: 'selectCurrentPage',
        selector: selectCurrentPage,
        override: { currentPage: 3 },
        expected: 3,
      },
      {
        description: 'selectSelectedPolicyId',
        selector: selectSelectedPolicyId,
        override: { selectedPolicyId: 'policy-99' },
        expected: 'policy-99',
      },
    ] as { description: string; selector: (state: any) => any; override: any; expected: unknown }[])(
      '$description returns value when set',
      ({ selector, override, expected }) => {
        if (expected === null) {
          expect(selector(getState(override))).toBeNull();
        } else {
          expect(selector(getState(override))).toEqual(expected);
        }
      },
    );
  });

  describe('selectPoliciesPageInfo', () => {
    it('returns null by default', () => {
      expect(selectPoliciesPageInfo(getState())).toBeNull();
    });

    it('returns page info when set', () => {
      const pageInfo = {
        hasNextPage: true,
        hasPreviousPage: false,
        totalCount: 10,
      };
      expect(
        selectPoliciesPageInfo(getState({ policiesPageInfo: pageInfo })),
      ).toEqual(pageInfo);
    });
  });

  describe('selectShowPolicyDetails', () => {
    it('returns false by default', () => {
      expect(selectShowPolicyDetails(getState())).toBe(false);
    });

    it('returns true when set', () => {
      expect(
        selectShowPolicyDetails(getState({ showPolicyDetails: true })),
      ).toBe(true);
    });
  });

  describe('selectOvertimeError', () => {
    it('returns null when no error', () => {
      expect(selectOvertimeError(getState())).toBeNull();
    });

    it('returns the error message when set', () => {
      expect(
        selectOvertimeError(getState({ error: 'Something went wrong' })),
      ).toBe('Something went wrong');
    });
  });

  describe('selectHasPolicies', () => {
    it('returns false when no policies', () => {
      expect(selectHasPolicies(getState())).toBe(false);
    });

    it('returns true when policies exist', () => {
      const policies = createOvertimePolicies(1);
      expect(selectHasPolicies(getState({ policies }))).toBe(true);
    });
  });

  describe('selectPoliciesCount', () => {
    it('returns 0 when no policies', () => {
      expect(selectPoliciesCount(getState())).toBe(0);
    });

    it('returns the correct count when policies exist', () => {
      const policies = createOvertimePolicies(3);
      expect(selectPoliciesCount(getState({ policies }))).toBe(3);
    });
  });

  // ==========================================
  // Wizard selectors
  // ==========================================

  describe('selectShowWizard', () => {
    it('returns false by default', () => {
      expect(selectShowWizard(getState())).toBe(false);
    });

    it('returns true when wizard is open', () => {
      expect(selectShowWizard(getState({ showWizard: true }))).toBe(true);
    });
  });

  describe('selectWizardCurrentStep', () => {
    it('returns POLICY_NAME by default', () => {
      expect(selectWizardCurrentStep(getState())).toBe(
        WizardStepId.POLICY_NAME,
      );
    });

    it('returns the current step when set', () => {
      expect(
        selectWizardCurrentStep(
          getState({ wizardCurrentStep: WizardStepId.REVIEW }),
        ),
      ).toBe(WizardStepId.REVIEW);
    });
  });

  describe('selectPolicyFormData', () => {
    it('returns default form data when nothing is set', () => {
      const formData = selectPolicyFormData(getState());
      expect(formData.name).toBe('');
      expect(formData.isDefault).toBe(false);
    });

    it('returns actual form data when set', () => {
      const policyFormData = {
        id: 'policy-1',
        description: 'A description',
        name: 'My Policy',
        isDefault: true,
        overtimeRuleType: 'basic',
        rules: [],
        policyMemberIds: ['m-1'],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      const formData = selectPolicyFormData(getState({ policyFormData }));
      expect(formData.name).toBe('My Policy');
      expect(formData.isDefault).toBe(true);
      expect(formData.id).toBe('policy-1');
    });
  });

  describe('selectPolicyMemberIds', () => {
    it('returns empty array by default', () => {
      expect(selectPolicyMemberIds(getState())).toEqual([]);
    });

    it('returns member IDs when set', () => {
      const policyFormData = {
        id: null,
        description: '',
        name: '',
        isDefault: false,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: ['m-1', 'm-2'],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectPolicyMemberIds(getState({ policyFormData }))).toEqual([
        'm-1',
        'm-2',
      ]);
    });
  });

  describe('selectPolicyName', () => {
    it('returns empty string by default', () => {
      expect(selectPolicyName(getState())).toBe('');
    });

    it('returns the policy name when set', () => {
      const policyFormData = {
        id: null,
        description: '',
        name: 'My Policy',
        isDefault: false,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectPolicyName(getState({ policyFormData }))).toBe('My Policy');
    });
  });

  describe('selectPolicyIsDefault', () => {
    it('returns false by default', () => {
      expect(selectPolicyIsDefault(getState())).toBe(false);
    });

    it('returns true when set', () => {
      const policyFormData = {
        id: null,
        description: '',
        name: '',
        isDefault: true,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectPolicyIsDefault(getState({ policyFormData }))).toBe(true);
    });
  });

  describe('selectPolicyIsBasic', () => {
    it('returns false when policy id is null', () => {
      expect(selectPolicyIsBasic(getState())).toBe(false);
    });

    it('returns false when policy id is a regular id', () => {
      const policyFormData = {
        id: 'policy-123',
        description: '',
        name: '',
        isDefault: false,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectPolicyIsBasic(getState({ policyFormData }))).toBe(false);
    });

    it('returns true when policy id is "basic"', () => {
      const policyFormData = {
        id: 'basic',
        description: '',
        name: '',
        isDefault: false,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectPolicyIsBasic(getState({ policyFormData }))).toBe(true);
    });

    it('returns true when policy id starts with "basic_policy_"', () => {
      const policyFormData = {
        id: 'basic_policy_abc123',
        description: '',
        name: '',
        isDefault: false,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectPolicyIsBasic(getState({ policyFormData }))).toBe(true);
    });

    it('returns false when overtime state is undefined', () => {
      expect(selectPolicyIsBasic(getEmptyState())).toBe(false);
    });
  });

  describe('selectOvertimeRuleType', () => {
    it('returns empty string by default', () => {
      expect(selectOvertimeRuleType(getState())).toBe('');
    });

    it('returns the rule type when set', () => {
      const policyFormData = {
        id: null,
        description: '',
        name: '',
        isDefault: false,
        overtimeRuleType: 'basic',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectOvertimeRuleType(getState({ policyFormData }))).toBe(
        'basic',
      );
    });
  });

  describe('selectOvertimeRules', () => {
    it('returns empty array by default', () => {
      expect(selectOvertimeRules(getState())).toEqual([]);
    });

    it('returns rules when set', () => {
      const rule = {
        name: 'Weekly OT',
        type: 'weekly',
        frequency: 'WEEKLY',
        multiplier: 1.5,
        conditions: [{ field: 'threshold', value: '40' }],
        enabled: true,
      };
      const policyFormData = {
        id: null,
        description: '',
        name: '',
        isDefault: false,
        overtimeRuleType: 'basic',
        rules: [rule],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectOvertimeRules(getState({ policyFormData }))).toEqual([rule]);
    });
  });

  // ==========================================
  // Wizard edit mode selectors
  // ==========================================

  describe('selectWizardEditMode', () => {
    it('returns false by default', () => {
      expect(selectWizardEditMode(getState())).toBe(false);
    });

    it('returns true when in edit mode', () => {
      expect(selectWizardEditMode(getState({ wizardEditMode: true }))).toBe(
        true,
      );
    });
  });

  describe('selectWizardStartStep', () => {
    it('returns POLICY_NAME by default', () => {
      expect(selectWizardStartStep(getState())).toBe(WizardStepId.POLICY_NAME);
    });

    it('returns the start step when set', () => {
      expect(
        selectWizardStartStep(
          getState({ wizardStartStep: WizardStepId.POLICY_MEMBERS }),
        ),
      ).toBe(WizardStepId.POLICY_MEMBERS);
    });
  });

  describe('selectWizardOrigin', () => {
    it('returns null by default', () => {
      expect(selectWizardOrigin(getState())).toBeNull();
    });

    it('returns the origin when set', () => {
      expect(selectWizardOrigin(getState({ wizardOrigin: 'listing' }))).toBe(
        'listing',
      );
      expect(
        selectWizardOrigin(getState({ wizardOrigin: 'policyDetails' })),
      ).toBe('policyDetails');
    });
  });

  describe('selectEditingPolicyId', () => {
    it('returns null by default', () => {
      expect(selectEditingPolicyId(getState())).toBeNull();
    });

    it('returns the policy ID when set', () => {
      const policyFormData = {
        id: 'policy-abc',
        description: '',
        name: '',
        isDefault: false,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectEditingPolicyId(getState({ policyFormData }))).toBe(
        'policy-abc',
      );
    });
  });

  describe('selectEditingPolicyDescription', () => {
    it('returns empty string by default', () => {
      expect(selectEditingPolicyDescription(getState())).toBe('');
    });

    it('returns the description when set', () => {
      const policyFormData = {
        id: null,
        description: 'My description',
        name: '',
        isDefault: false,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectEditingPolicyDescription(getState({ policyFormData }))).toBe(
        'My description',
      );
    });
  });

  describe('selectPolicyAssignments', () => {
    it('returns empty array by default', () => {
      expect(selectPolicyAssignments(getState())).toEqual([]);
    });

    it('returns assignments when set', () => {
      const assignment = createAssignment({
        entityType: 'user',
        entityId: 'user-1',
      });
      const policyFormData = {
        id: null,
        description: '',
        name: '',
        isDefault: false,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [assignment],
        assignmentsDirty: false,
      };
      expect(selectPolicyAssignments(getState({ policyFormData }))).toEqual([
        assignment,
      ]);
    });
  });

  describe('selectPolicyDescription', () => {
    it('returns empty string by default', () => {
      expect(selectPolicyDescription(getState())).toBe('');
    });

    it('returns the description when set', () => {
      const policyFormData = {
        id: null,
        description: 'A policy description',
        name: '',
        isDefault: false,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: false,
      };
      expect(selectPolicyDescription(getState({ policyFormData }))).toBe(
        'A policy description',
      );
    });
  });

  describe('selectAssignmentsDirty', () => {
    it('returns false by default', () => {
      expect(selectAssignmentsDirty(getState())).toBe(false);
    });

    it('returns true when dirty', () => {
      const policyFormData = {
        id: null,
        description: '',
        name: '',
        isDefault: false,
        overtimeRuleType: '',
        rules: [],
        policyMemberIds: [],
        policyAssignments: [],
        assignmentsDirty: true,
      };
      expect(selectAssignmentsDirty(getState({ policyFormData }))).toBe(true);
    });
  });

  // ==========================================
  // selectInitialMemberIds
  // ==========================================

  describe('selectInitialMemberIds', () => {
    it('returns empty array by default', () => {
      expect(selectInitialMemberIds(getState())).toEqual([]);
    });

    it('returns the initial member IDs from state', () => {
      expect(
        selectInitialMemberIds(
          getState({ initialMemberIds: ['worker-1', 'worker-2'] }),
        ),
      ).toEqual(['worker-1', 'worker-2']);
    });

    it('returns empty array when overtime state is undefined', () => {
      expect(selectInitialMemberIds(getEmptyState())).toEqual([]);
    });
  });

  // ==========================================
  // Wizard members cache selectors
  // ==========================================

  describe('selectWizardMembersCache', () => {
    it('returns default cache by default', () => {
      const cache = selectWizardMembersCache(getState());
      expect(cache.groups).toEqual([]);
      expect(cache.groupsLoaded).toBe(false);
      expect(cache.workers).toEqual([]);
    });

    it('returns actual cache when populated', () => {
      const wizardMembersCache = {
        groups: [{ id: 'g-1', name: 'Group 1', isActive: true }],
        groupsLoaded: true,
        groupsLoading: false,
        workers: [{ id: 'w-1', type: 'Employee', isActive: true }],
        workersLoaded: true,
        workersLoading: false,
        workersTotalCount: 1,
        workersPageInfo: { hasNextPage: false },
        cursorHistory: ['cursor-1'],
        currentAfterCursor: 'cursor-abc',
      };
      expect(
        selectWizardMembersCache(getState({ wizardMembersCache })),
      ).toEqual(wizardMembersCache);
    });
  });

  describe('selectWizardCachedGroups', () => {
    it('returns empty array by default', () => {
      expect(selectWizardCachedGroups(getState())).toEqual([]);
    });

    it('returns groups when cached', () => {
      const groups = [{ id: 'g-1', name: 'Team A', isActive: true }];
      const wizardMembersCache = {
        groups,
        groupsLoaded: true,
        groupsLoading: false,
        workers: [],
        workersLoaded: false,
        workersLoading: false,
        workersTotalCount: null,
        workersPageInfo: null,
        cursorHistory: [],
        currentAfterCursor: undefined,
      };
      expect(
        selectWizardCachedGroups(getState({ wizardMembersCache })),
      ).toEqual(groups);
    });
  });

  describe('selectWizardGroupsLoaded', () => {
    it('returns false by default', () => {
      expect(selectWizardGroupsLoaded(getState())).toBe(false);
    });

    it('returns true when loaded', () => {
      const wizardMembersCache = {
        groups: [],
        groupsLoaded: true,
        groupsLoading: false,
        workers: [],
        workersLoaded: false,
        workersLoading: false,
        workersTotalCount: null,
        workersPageInfo: null,
        cursorHistory: [],
        currentAfterCursor: undefined,
      };
      expect(selectWizardGroupsLoaded(getState({ wizardMembersCache }))).toBe(
        true,
      );
    });
  });

  describe('selectWizardGroupsLoading', () => {
    it('returns false by default', () => {
      expect(selectWizardGroupsLoading(getState())).toBe(false);
    });

    it('returns true when loading', () => {
      const wizardMembersCache = {
        groups: [],
        groupsLoaded: false,
        groupsLoading: true,
        workers: [],
        workersLoaded: false,
        workersLoading: false,
        workersTotalCount: null,
        workersPageInfo: null,
        cursorHistory: [],
        currentAfterCursor: undefined,
      };
      expect(selectWizardGroupsLoading(getState({ wizardMembersCache }))).toBe(
        true,
      );
    });
  });

  describe('selectWizardCachedWorkers', () => {
    it('returns empty array by default', () => {
      expect(selectWizardCachedWorkers(getState())).toEqual([]);
    });

    it('returns workers when cached', () => {
      const workers = [{ id: 'w-1', type: 'Employee', isActive: true }];
      const wizardMembersCache = {
        groups: [],
        groupsLoaded: false,
        groupsLoading: false,
        workers,
        workersLoaded: true,
        workersLoading: false,
        workersTotalCount: 1,
        workersPageInfo: null,
        cursorHistory: [],
        currentAfterCursor: undefined,
      };
      expect(
        selectWizardCachedWorkers(getState({ wizardMembersCache })),
      ).toEqual(workers);
    });
  });

  describe('selectWizardWorkersLoaded', () => {
    it('returns false by default', () => {
      expect(selectWizardWorkersLoaded(getState())).toBe(false);
    });

    it('returns true when loaded', () => {
      const wizardMembersCache = {
        groups: [],
        groupsLoaded: false,
        groupsLoading: false,
        workers: [],
        workersLoaded: true,
        workersLoading: false,
        workersTotalCount: 0,
        workersPageInfo: null,
        cursorHistory: [],
        currentAfterCursor: undefined,
      };
      expect(selectWizardWorkersLoaded(getState({ wizardMembersCache }))).toBe(
        true,
      );
    });
  });

  describe('selectWizardWorkersLoading', () => {
    it('returns false by default', () => {
      expect(selectWizardWorkersLoading(getState())).toBe(false);
    });

    it('returns true when loading', () => {
      const wizardMembersCache = {
        groups: [],
        groupsLoaded: false,
        groupsLoading: false,
        workers: [],
        workersLoaded: false,
        workersLoading: true,
        workersTotalCount: null,
        workersPageInfo: null,
        cursorHistory: [],
        currentAfterCursor: undefined,
      };
      expect(selectWizardWorkersLoading(getState({ wizardMembersCache }))).toBe(
        true,
      );
    });
  });

  describe('selectWizardWorkersTotalCount', () => {
    it('returns null by default', () => {
      expect(selectWizardWorkersTotalCount(getState())).toBeNull();
    });

    it('returns count when set', () => {
      const wizardMembersCache = {
        groups: [],
        groupsLoaded: false,
        groupsLoading: false,
        workers: [],
        workersLoaded: true,
        workersLoading: false,
        workersTotalCount: 42,
        workersPageInfo: null,
        cursorHistory: [],
        currentAfterCursor: undefined,
      };
      expect(
        selectWizardWorkersTotalCount(getState({ wizardMembersCache })),
      ).toBe(42);
    });
  });

  describe('selectWizardWorkersPageInfo', () => {
    it('returns null by default', () => {
      expect(selectWizardWorkersPageInfo(getState())).toBeNull();
    });

    it('returns page info when set', () => {
      const pageInfo = { hasNextPage: true, endCursor: 'cursor-xyz' };
      const wizardMembersCache = {
        groups: [],
        groupsLoaded: false,
        groupsLoading: false,
        workers: [],
        workersLoaded: false,
        workersLoading: false,
        workersTotalCount: null,
        workersPageInfo: pageInfo,
        cursorHistory: [],
        currentAfterCursor: undefined,
      };
      expect(
        selectWizardWorkersPageInfo(getState({ wizardMembersCache })),
      ).toEqual(pageInfo);
    });
  });

  describe('selectWizardCursorHistory', () => {
    it('returns empty array by default', () => {
      expect(selectWizardCursorHistory(getState())).toEqual([]);
    });

    it('returns cursor history when set', () => {
      const wizardMembersCache = {
        groups: [],
        groupsLoaded: false,
        groupsLoading: false,
        workers: [],
        workersLoaded: false,
        workersLoading: false,
        workersTotalCount: null,
        workersPageInfo: null,
        cursorHistory: ['cursor-1', 'cursor-2'],
        currentAfterCursor: undefined,
      };
      expect(
        selectWizardCursorHistory(getState({ wizardMembersCache })),
      ).toEqual(['cursor-1', 'cursor-2']);
    });
  });

  describe('selectWizardCurrentAfterCursor', () => {
    it('returns undefined by default', () => {
      expect(selectWizardCurrentAfterCursor(getState())).toBeUndefined();
    });

    it('returns cursor when set', () => {
      const wizardMembersCache = {
        groups: [],
        groupsLoaded: false,
        groupsLoading: false,
        workers: [],
        workersLoaded: false,
        workersLoading: false,
        workersTotalCount: null,
        workersPageInfo: null,
        cursorHistory: [],
        currentAfterCursor: 'my-cursor',
      };
      expect(
        selectWizardCurrentAfterCursor(getState({ wizardMembersCache })),
      ).toBe('my-cursor');
    });
  });

  // ==========================================
  // Mutation state selectors
  // ==========================================

  describe('selectIsCreatingPolicy', () => {
    it('returns false by default', () => {
      expect(selectIsCreatingPolicy(getState())).toBe(false);
    });

    it('returns true when creating', () => {
      expect(selectIsCreatingPolicy(getState({ isCreatingPolicy: true }))).toBe(
        true,
      );
    });
  });

  describe('selectCreatePolicyError', () => {
    it('returns null by default', () => {
      expect(selectCreatePolicyError(getState())).toBeNull();
    });

    it('returns error when set', () => {
      expect(
        selectCreatePolicyError(
          getState({ createPolicyError: 'Create failed' }),
        ),
      ).toBe('Create failed');
    });
  });

  describe('selectIsUpdatingPolicy', () => {
    it('returns false by default', () => {
      expect(selectIsUpdatingPolicy(getState())).toBe(false);
    });

    it('returns true when updating', () => {
      expect(selectIsUpdatingPolicy(getState({ isUpdatingPolicy: true }))).toBe(
        true,
      );
    });
  });

  describe('selectUpdatePolicyError', () => {
    it('returns null by default', () => {
      expect(selectUpdatePolicyError(getState())).toBeNull();
    });

    it('returns error when set', () => {
      expect(
        selectUpdatePolicyError(
          getState({ updatePolicyError: 'Update failed' }),
        ),
      ).toBe('Update failed');
    });
  });

  describe('selectIsDeletingPolicy', () => {
    it('returns false by default', () => {
      expect(selectIsDeletingPolicy(getState())).toBe(false);
    });

    it('returns true when deleting', () => {
      expect(selectIsDeletingPolicy(getState({ isDeletingPolicy: true }))).toBe(
        true,
      );
    });
  });

  describe('selectDeletePolicyError', () => {
    it('returns null by default', () => {
      expect(selectDeletePolicyError(getState())).toBeNull();
    });

    it('returns error when set', () => {
      expect(
        selectDeletePolicyError(
          getState({ deletePolicyError: 'Delete failed' }),
        ),
      ).toBe('Delete failed');
    });
  });

  describe('selectIsManagingAssignments', () => {
    it('returns false by default', () => {
      expect(selectIsManagingAssignments(getState())).toBe(false);
    });

    it('returns true when managing', () => {
      expect(
        selectIsManagingAssignments(getState({ isManagingAssignments: true })),
      ).toBe(true);
    });
  });

  describe('selectAssignmentsError', () => {
    it('returns null by default', () => {
      expect(selectAssignmentsError(getState())).toBeNull();
    });

    it('returns error when set', () => {
      expect(
        selectAssignmentsError(
          getState({ assignmentsError: 'Assignments failed' }),
        ),
      ).toBe('Assignments failed');
    });
  });

  // ==========================================
  // Delete modal state selectors
  // ==========================================

  describe('selectPolicyToDelete', () => {
    it('returns null by default', () => {
      expect(selectPolicyToDelete(getState())).toBeNull();
    });

    it('returns the policy to delete when set', () => {
      const policy = createOvertimePolicy({
        id: 'policy-to-delete',
        name: 'Delete Me',
      });
      expect(
        selectPolicyToDelete(getState({ policyToDelete: policy })),
      ).toEqual(policy);
    });
  });

  describe('selectShowDeleteModal', () => {
    it('returns false by default', () => {
      expect(selectShowDeleteModal(getState())).toBe(false);
    });

    it('returns true when modal is open', () => {
      expect(selectShowDeleteModal(getState({ showDeleteModal: true }))).toBe(
        true,
      );
    });
  });

  // ==========================================
  // Refetch flag
  // ==========================================

  describe('selectRefetchPolicies', () => {
    it('returns false by default', () => {
      expect(selectRefetchPolicies(getState())).toBe(false);
    });

    it('returns true when refetch is requested', () => {
      expect(selectRefetchPolicies(getState({ refetchPolicies: true }))).toBe(
        true,
      );
    });
  });

  // ==========================================
  // Null/undefined overtime state (covers ?? fallback branches)
  // ==========================================

  describe('fallback branches when state.overtime is undefined', () => {
    it.each([
      {
        description: 'selectOvertimePolicies returns []',
        selector: selectOvertimePolicies,
        expected: [],
      },
      {
        description: 'selectIsLoadingPolicies returns false',
        selector: selectIsLoadingPolicies,
        expected: false,
      },
      {
        description: 'selectPoliciesPageInfo returns null',
        selector: selectPoliciesPageInfo,
        expected: null,
      },
      {
        description: 'selectShowLandingPage returns false',
        selector: selectShowLandingPage,
        expected: false,
      },
      {
        description: 'selectIsTrowserOpen returns false',
        selector: selectIsTrowserOpen,
        expected: false,
      },
      {
        description: 'selectCurrentPage returns 1',
        selector: selectCurrentPage,
        expected: 1,
      },
      {
        description: 'selectSelectedPolicyId returns null',
        selector: selectSelectedPolicyId,
        expected: null,
      },
      {
        description: 'selectShowPolicyDetails returns false',
        selector: selectShowPolicyDetails,
        expected: false,
      },
      {
        description: 'selectOvertimeError returns null',
        selector: selectOvertimeError,
        expected: null,
      },
      {
        description: 'selectHasPolicies returns false',
        selector: selectHasPolicies,
        expected: false,
      },
      {
        description: 'selectPoliciesCount returns 0',
        selector: selectPoliciesCount,
        expected: 0,
      },
      {
        description: 'selectShowWizard returns false',
        selector: selectShowWizard,
        expected: false,
      },
      {
        description: 'selectWizardCurrentStep returns POLICY_NAME',
        selector: selectWizardCurrentStep,
        expected: WizardStepId.POLICY_NAME,
      },
      {
        description: 'selectPolicyMemberIds returns []',
        selector: selectPolicyMemberIds,
        expected: [],
      },
      {
        description: 'selectPolicyName returns empty string',
        selector: selectPolicyName,
        expected: '',
      },
      {
        description: 'selectPolicyIsDefault returns false',
        selector: selectPolicyIsDefault,
        expected: false,
      },
      {
        description: 'selectPolicyIsBasic returns false',
        selector: selectPolicyIsBasic,
        expected: false,
      },
      {
        description: 'selectOvertimeRuleType returns empty string',
        selector: selectOvertimeRuleType,
        expected: '',
      },
      {
        description: 'selectOvertimeRules returns []',
        selector: selectOvertimeRules,
        expected: [],
      },
      {
        description: 'selectWizardEditMode returns false',
        selector: selectWizardEditMode,
        expected: false,
      },
      {
        description: 'selectWizardStartStep returns POLICY_NAME',
        selector: selectWizardStartStep,
        expected: WizardStepId.POLICY_NAME,
      },
      {
        description: 'selectWizardOrigin returns null',
        selector: selectWizardOrigin,
        expected: null,
      },
      {
        description: 'selectEditingPolicyId returns null',
        selector: selectEditingPolicyId,
        expected: null,
      },
      {
        description: 'selectEditingPolicyDescription returns empty string',
        selector: selectEditingPolicyDescription,
        expected: '',
      },
      {
        description: 'selectPolicyAssignments returns []',
        selector: selectPolicyAssignments,
        expected: [],
      },
      {
        description: 'selectPolicyDescription returns empty string',
        selector: selectPolicyDescription,
        expected: '',
      },
      {
        description: 'selectAssignmentsDirty returns false',
        selector: selectAssignmentsDirty,
        expected: false,
      },
      {
        description: 'selectInitialMemberIds returns []',
        selector: selectInitialMemberIds,
        expected: [],
      },
      {
        description: 'selectWizardCachedGroups returns []',
        selector: selectWizardCachedGroups,
        expected: [],
      },
      {
        description: 'selectWizardGroupsLoaded returns false',
        selector: selectWizardGroupsLoaded,
        expected: false,
      },
      {
        description: 'selectWizardGroupsLoading returns false',
        selector: selectWizardGroupsLoading,
        expected: false,
      },
      {
        description: 'selectWizardCachedWorkers returns []',
        selector: selectWizardCachedWorkers,
        expected: [],
      },
      {
        description: 'selectWizardWorkersLoaded returns false',
        selector: selectWizardWorkersLoaded,
        expected: false,
      },
      {
        description: 'selectWizardWorkersLoading returns false',
        selector: selectWizardWorkersLoading,
        expected: false,
      },
      {
        description: 'selectWizardWorkersTotalCount returns null',
        selector: selectWizardWorkersTotalCount,
        expected: null,
      },
      {
        description: 'selectWizardWorkersPageInfo returns null',
        selector: selectWizardWorkersPageInfo,
        expected: null,
      },
      {
        description: 'selectWizardCursorHistory returns []',
        selector: selectWizardCursorHistory,
        expected: [],
      },
      {
        description: 'selectWizardCurrentAfterCursor returns undefined',
        selector: selectWizardCurrentAfterCursor,
        expected: undefined,
      },
      {
        description: 'selectIsCreatingPolicy returns false',
        selector: selectIsCreatingPolicy,
        expected: false,
      },
      {
        description: 'selectCreatePolicyError returns null',
        selector: selectCreatePolicyError,
        expected: null,
      },
      {
        description: 'selectIsUpdatingPolicy returns false',
        selector: selectIsUpdatingPolicy,
        expected: false,
      },
      {
        description: 'selectUpdatePolicyError returns null',
        selector: selectUpdatePolicyError,
        expected: null,
      },
      {
        description: 'selectIsDeletingPolicy returns false',
        selector: selectIsDeletingPolicy,
        expected: false,
      },
      {
        description: 'selectDeletePolicyError returns null',
        selector: selectDeletePolicyError,
        expected: null,
      },
      {
        description: 'selectIsManagingAssignments returns false',
        selector: selectIsManagingAssignments,
        expected: false,
      },
      {
        description: 'selectAssignmentsError returns null',
        selector: selectAssignmentsError,
        expected: null,
      },
      {
        description: 'selectPolicyToDelete returns null',
        selector: selectPolicyToDelete,
        expected: null,
      },
      {
        description: 'selectShowDeleteModal returns false',
        selector: selectShowDeleteModal,
        expected: false,
      },
      {
        description: 'selectRefetchPolicies returns false',
        selector: selectRefetchPolicies,
        expected: false,
      },
      {
        description:
          'selectShowPolicyDetails returns false (duplicate fallback)',
        selector: selectShowPolicyDetails,
        expected: false,
      },
    ] as { description: string; selector: (state: any) => any; expected: unknown }[])(
      '$description',
      ({ selector, expected }) => {
        if (expected === undefined) {
          expect(selector(getEmptyState())).toBeUndefined();
        } else if (expected === null) {
          expect(selector(getEmptyState())).toBeNull();
        } else {
          expect(selector(getEmptyState())).toEqual(expected);
        }
      },
    );

    it('selectPolicyFormData returns default form data', () => {
      const formData = selectPolicyFormData(getEmptyState());
      expect(formData.name).toBe('');
      expect(formData.isDefault).toBe(false);
      expect(formData.id).toBeNull();
    });

    it('selectWizardMembersCache returns default cache', () => {
      const cache = selectWizardMembersCache(getEmptyState());
      expect(cache.groups).toEqual([]);
      expect(cache.groupsLoaded).toBe(false);
      expect(cache.workers).toEqual([]);
    });
  });
});
