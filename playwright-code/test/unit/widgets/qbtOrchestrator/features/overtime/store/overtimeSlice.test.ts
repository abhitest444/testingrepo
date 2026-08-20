import overtimeReducer, {
  setPolicies,
  setPoliciesPageInfo,
  setLoadingPolicies,
  addPolicy,
  updatePolicy,
  removePolicy,
  setShowLandingPage,
  setTrowserOpen,
  setCurrentPage,
  setSelectedPolicyId,
  setShowPolicyDetails,
  setError,
  setShowWizard,
  setWizardCurrentStep,
  setWizardOrigin,
  setWizardEditMode,
  updatePolicyFormData,
  setPolicyName,
  setPolicyIsDefault,
  setOvertimeRuleType,
  setOvertimeRules,
  setPolicyMemberIds,
  setInitialMemberIds,
  setAssignmentsDirty,
  resetWizardState,
  resetOvertimeState,
  initializeWizardForEdit,
  setWizardCachedGroups,
  setWizardGroupsLoading,
  setWizardCachedWorkers,
  setWizardWorkersLoading,
  pushWizardCursorHistory,
  popWizardCursorHistory,
  setWizardCurrentAfterCursor,
  clearWizardMembersCache,
  setCreatingPolicy,
  setCreatePolicyError,
  setUpdatingPolicy,
  setUpdatePolicyError,
  setDeletingPolicy,
  setDeletePolicyError,
  setManagingAssignments,
  setAssignmentsError,
  setPolicyToDelete,
  setShowDeleteModal,
  setRefetchPolicies,
  WizardStepId,
  OvertimeState,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/store/overtimeSlice';
import {
  OvertimePolicy,
  PolicyFormData,
  WizardMembersCache,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/types/Overtime.types';

describe('overtimeSlice', () => {
  const initialPolicyFormData: PolicyFormData = {
    id: null,
    description: '',
    name: '',
    isDefault: false,
    overtimeRuleType: '',
    rules: [],
    policyMemberIds: [],
    policyAssignments: [],
    assignmentsDirty: false,
  };

  const initialWizardMembersCache: WizardMembersCache = {
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
  };

  const initialState: OvertimeState = {
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
    policyFormData: initialPolicyFormData,
    wizardEditMode: false,
    wizardMembersCache: initialWizardMembersCache,
    error: null,
    // Mutation states
    isCreatingPolicy: false,
    createPolicyError: null,
    isUpdatingPolicy: false,
    updatePolicyError: null,
    isDeletingPolicy: false,
    deletePolicyError: null,
    isManagingAssignments: false,
    assignmentsError: null,
    // Delete modal state
    policyToDelete: null,
    showDeleteModal: false,
    // Refetch flag
    refetchPolicies: false,
    // Initial member IDs snapshot
    initialMemberIds: [],
    // Original policy snapshot for diffing
    originalPolicySnapshot: null,
  };

  const mockPolicy: OvertimePolicy = {
    id: '1',
    name: 'Test Policy',
    description: '',
    isDefault: false,
    assignments: {
      values: [
        {
          id: 'w1',
          entityType: 'user',
          entityId: 'user-123',
          entityName: 'John Doe',
        },
      ],
    },
    rules: {
      values: [
        {
          name: 'Weekly Overtime',
          type: 'weekly',
          frequency: 'WEEKLY',
          multiplier: 1.5,
          conditions: [{ field: 'threshold', value: '40' }],
          enabled: true,
        },
      ],
    },
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(overtimeReducer(undefined, { type: 'unknown' })).toEqual(
        initialState,
      );
    });
  });

  describe('policies management', () => {
    it('should handle setPolicies', () => {
      const policies: OvertimePolicy[] = [mockPolicy];
      const state = overtimeReducer(
        { ...initialState, isLoadingPolicies: true, error: 'some error' },
        setPolicies(policies),
      );

      expect(state.policies).toEqual(policies);
      expect(state.isLoadingPolicies).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle setLoadingPolicies', () => {
      const state = overtimeReducer(initialState, setLoadingPolicies(true));
      expect(state.isLoadingPolicies).toBe(true);

      const state2 = overtimeReducer(state, setLoadingPolicies(false));
      expect(state2.isLoadingPolicies).toBe(false);
    });

    it('should handle addPolicy', () => {
      const state = overtimeReducer(initialState, addPolicy(mockPolicy));
      expect(state.policies).toHaveLength(1);
      expect(state.policies[0]).toEqual(mockPolicy);
    });

    it('should handle updatePolicy when policy exists', () => {
      const stateWithPolicy = { ...initialState, policies: [mockPolicy] };
      const updatedPolicy = { ...mockPolicy, name: 'Updated Policy' };

      const state = overtimeReducer(
        stateWithPolicy,
        updatePolicy(updatedPolicy),
      );

      expect(state.policies[0].name).toBe('Updated Policy');
    });

    it('should handle updatePolicy when policy does not exist', () => {
      const state = overtimeReducer(
        initialState,
        updatePolicy({ ...mockPolicy, id: 'non-existent' }),
      );

      expect(state.policies).toHaveLength(0);
    });

    it('should handle removePolicy', () => {
      const stateWithPolicy = { ...initialState, policies: [mockPolicy] };
      const state = overtimeReducer(stateWithPolicy, removePolicy('1'));

      expect(state.policies).toHaveLength(0);
    });

    it('should handle removePolicy when policy does not exist', () => {
      const stateWithPolicy = { ...initialState, policies: [mockPolicy] };
      const state = overtimeReducer(
        stateWithPolicy,
        removePolicy('non-existent'),
      );

      expect(state.policies).toHaveLength(1);
    });
  });

  describe('UI state management', () => {
    it('should handle setShowLandingPage with true', () => {
      const state = overtimeReducer(initialState, setShowLandingPage(true));

      expect(state.showLandingPage).toBe(true);
      expect(state.isTrowserOpen).toBe(true);
    });

    it('should handle setShowLandingPage with false', () => {
      const stateWithOpen = {
        ...initialState,
        showLandingPage: true,
        isTrowserOpen: true,
      };
      const state = overtimeReducer(stateWithOpen, setShowLandingPage(false));

      expect(state.showLandingPage).toBe(false);
      // isTrowserOpen should not change when setting showLandingPage to false
      expect(state.isTrowserOpen).toBe(true);
    });

    it('should handle setTrowserOpen with true', () => {
      const state = overtimeReducer(initialState, setTrowserOpen(true));
      expect(state.isTrowserOpen).toBe(true);
    });

    it('should handle setTrowserOpen with false', () => {
      const stateWithOpen = {
        ...initialState,
        showLandingPage: true,
        isTrowserOpen: true,
      };
      const state = overtimeReducer(stateWithOpen, setTrowserOpen(false));

      expect(state.isTrowserOpen).toBe(false);
      expect(state.showLandingPage).toBe(false);
    });

    it('should handle setCurrentPage', () => {
      const state = overtimeReducer(initialState, setCurrentPage(5));
      expect(state.currentPage).toBe(5);
    });
  });

  describe('error handling', () => {
    it('should handle setError with error message', () => {
      const stateWithLoading = { ...initialState, isLoadingPolicies: true };
      const state = overtimeReducer(
        stateWithLoading,
        setError('Something went wrong'),
      );

      expect(state.error).toBe('Something went wrong');
      expect(state.isLoadingPolicies).toBe(false);
    });

    it('should handle setError with null', () => {
      const stateWithError = { ...initialState, error: 'Previous error' };
      const state = overtimeReducer(stateWithError, setError(null));

      expect(state.error).toBeNull();
    });
  });

  describe('wizard state management', () => {
    it('should handle setShowWizard with true', () => {
      const state = overtimeReducer(initialState, setShowWizard(true));
      expect(state.showWizard).toBe(true);
    });

    it('should handle setShowWizard with false and reset wizard state', () => {
      const stateWithWizard = {
        ...initialState,
        showWizard: true,
        wizardCurrentStep: WizardStepId.REVIEW,
        policyFormData: {
          ...initialPolicyFormData,
          name: 'Custom Policy',
          isDefault: true,
          overtimeRuleType: 'custom' as const,
        },
      };

      const state = overtimeReducer(stateWithWizard, setShowWizard(false));

      expect(state.showWizard).toBe(false);
      expect(state.wizardCurrentStep).toBe(WizardStepId.POLICY_NAME);
      expect(state.policyFormData.name).toBe('');
      expect(state.policyFormData.isDefault).toBe(false);
      expect(state.policyFormData.overtimeRuleType).toBe('');
    });

    it('should handle setWizardCurrentStep', () => {
      const state = overtimeReducer(
        initialState,
        setWizardCurrentStep(WizardStepId.OVERTIME_RULES),
      );

      expect(state.wizardCurrentStep).toBe(WizardStepId.OVERTIME_RULES);
    });

    it('should handle updatePolicyFormData', () => {
      const state = overtimeReducer(
        initialState,
        updatePolicyFormData({ name: 'New Name', isDefault: true }),
      );

      expect(state.policyFormData.name).toBe('New Name');
      expect(state.policyFormData.isDefault).toBe(true);
    });

    it('should handle updatePolicyFormData with partial update', () => {
      const state = overtimeReducer(
        initialState,
        updatePolicyFormData({ name: 'New Name' }),
      );

      expect(state.policyFormData.name).toBe('New Name');
      expect(state.policyFormData.isDefault).toBe(false); // unchanged
    });

    it('should handle setPolicyName', () => {
      const state = overtimeReducer(initialState, setPolicyName('My Policy'));
      expect(state.policyFormData.name).toBe('My Policy');
    });

    it('should handle setPolicyIsDefault', () => {
      const state = overtimeReducer(initialState, setPolicyIsDefault(true));
      expect(state.policyFormData.isDefault).toBe(true);
    });

    it.each(['basic', 'custom', 'california'] as const)(
      'should handle setOvertimeRuleType with %s',
      (ruleType) => {
        const state = overtimeReducer(
          initialState,
          setOvertimeRuleType(ruleType),
        );
        expect(state.policyFormData.overtimeRuleType).toBe(ruleType);
      },
    );

    it('should handle setOvertimeRules', () => {
      const state = overtimeReducer(
        initialState,
        setOvertimeRules([
          {
            name: 'Weekly Overtime Pay',
            type: 'weekly',
            frequency: 'WEEKLY',
            multiplier: 1.5,
            conditions: [{ field: 'threshold', value: '40' }],
          },
        ]),
      );
      expect(state.policyFormData.rules).toHaveLength(1);
    });

    it('should handle setOvertimeRuleType with empty string', () => {
      const stateWithRuleType = {
        ...initialState,
        policyFormData: {
          ...initialState.policyFormData,
          overtimeRuleType: 'basic' as const,
          rules: [],
          policyMemberIds: [],
        },
      };
      const state = overtimeReducer(stateWithRuleType, setOvertimeRuleType(''));
      expect(state.policyFormData.overtimeRuleType).toBe('');
    });

    it('should handle setAssignmentsDirty with true', () => {
      const state = overtimeReducer(initialState, setAssignmentsDirty(true));
      expect(state.policyFormData.assignmentsDirty).toBe(true);
    });

    it('should handle setAssignmentsDirty with false', () => {
      const stateWithDirty = {
        ...initialState,
        policyFormData: {
          ...initialState.policyFormData,
          assignmentsDirty: true,
        },
      };
      const state = overtimeReducer(stateWithDirty, setAssignmentsDirty(false));
      expect(state.policyFormData.assignmentsDirty).toBe(false);
    });

    it('should handle resetWizardState', () => {
      const stateWithWizard = {
        ...initialState,
        showWizard: true,
        wizardCurrentStep: WizardStepId.POLICY_MEMBERS,
        wizardStartStep: WizardStepId.REVIEW,
        initialMemberIds: ['member-1', 'member-2'],
        policyFormData: {
          ...initialPolicyFormData,
          name: 'Custom Policy',
          isDefault: true,
          overtimeRuleType: 'custom' as const,
          assignmentsDirty: true,
        },
      };

      const state = overtimeReducer(stateWithWizard, resetWizardState());

      expect(state.showWizard).toBe(false);
      expect(state.wizardCurrentStep).toBe(WizardStepId.POLICY_NAME);
      expect(state.wizardStartStep).toBe(WizardStepId.POLICY_NAME);
      expect(state.policyFormData.name).toBe('');
      expect(state.policyFormData.isDefault).toBe(false);
      expect(state.policyFormData.overtimeRuleType).toBe('');
      expect(state.policyFormData.assignmentsDirty).toBe(false);
      expect(state.initialMemberIds).toEqual([]);
    });

    it('should handle initializeWizardForEdit with REVIEW startStep', () => {
      const state = overtimeReducer(
        initialState,
        initializeWizardForEdit({
          policyId: 'policy-123',
          name: 'Test Policy',
          description: 'Test Description',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: ['member-1', 'member-2'],
          startStep: WizardStepId.REVIEW,
          origin: 'policyDetails',
        }),
      );

      expect(state.showWizard).toBe(true);
      expect(state.wizardEditMode).toBe(true);
      expect(state.wizardCurrentStep).toBe(WizardStepId.REVIEW);
      expect(state.wizardStartStep).toBe(WizardStepId.REVIEW);
      expect(state.wizardOrigin).toBe('policyDetails');
      expect(state.policyFormData.id).toBe('policy-123');
      expect(state.policyFormData.name).toBe('Test Policy');
      expect(state.initialMemberIds).toEqual(['member-1', 'member-2']);
    });

    it('should handle initializeWizardForEdit with POLICY_MEMBERS startStep', () => {
      const state = overtimeReducer(
        initialState,
        initializeWizardForEdit({
          policyId: 'policy-456',
          name: 'Members Policy',
          description: '',
          isDefault: true,
          rules: [],
          ruleType: 'california',
          memberIds: [],
          startStep: WizardStepId.POLICY_MEMBERS,
          origin: 'policyDetails',
        }),
      );

      expect(state.showWizard).toBe(true);
      expect(state.wizardEditMode).toBe(true);
      expect(state.wizardCurrentStep).toBe(WizardStepId.POLICY_MEMBERS);
      expect(state.wizardStartStep).toBe(WizardStepId.POLICY_MEMBERS);
      expect(state.policyFormData.id).toBe('policy-456');
      expect(state.policyFormData.isDefault).toBe(true);
    });

    it('should handle initializeWizardForEdit with POLICY_NAME startStep', () => {
      const state = overtimeReducer(
        initialState,
        initializeWizardForEdit({
          policyId: 'policy-789',
          name: 'Name Edit Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'custom',
          memberIds: ['member-3'],
          startStep: WizardStepId.POLICY_NAME,
          origin: 'listing',
        }),
      );

      expect(state.wizardCurrentStep).toBe(WizardStepId.POLICY_NAME);
      expect(state.wizardStartStep).toBe(WizardStepId.POLICY_NAME);
      expect(state.wizardOrigin).toBe('listing');
    });
  });

  describe('reset state', () => {
    it('should handle resetOvertimeState', () => {
      const modifiedState: OvertimeState = {
        ...initialState,
        policies: [mockPolicy],
        isLoadingPolicies: true,
        showLandingPage: true,
        isTrowserOpen: true,
        currentPage: 5,
        showWizard: true,
        wizardCurrentStep: WizardStepId.REVIEW,
        policyFormData: {
          ...initialPolicyFormData,
          name: 'Custom',
          isDefault: true,
          overtimeRuleType: 'custom',
        },
        error: 'Some error',
        selectedPolicyId: null,
        showPolicyDetails: false,
      };

      const state = overtimeReducer(modifiedState, resetOvertimeState());
      expect(state).toEqual(initialState);
    });
  });

  describe('UI state - selectedPolicy and wizard flags', () => {
    it('should handle setPoliciesPageInfo', () => {
      const pageInfo = {
        hasNextPage: true,
        hasPreviousPage: false,
        totalCount: 25,
      };
      const s1 = overtimeReducer(initialState, setPoliciesPageInfo(pageInfo));
      expect(s1.policiesPageInfo).toEqual(pageInfo);

      const s2 = overtimeReducer(s1, setPoliciesPageInfo(null));
      expect(s2.policiesPageInfo).toBeNull();
    });

    it('should handle setSelectedPolicyId', () => {
      const s1 = overtimeReducer(
        initialState,
        setSelectedPolicyId('policy-99'),
      );
      expect(s1.selectedPolicyId).toBe('policy-99');

      const s2 = overtimeReducer(s1, setSelectedPolicyId(null));
      expect(s2.selectedPolicyId).toBeNull();
    });

    it('should handle setShowPolicyDetails', () => {
      const state = overtimeReducer(initialState, setShowPolicyDetails(true));
      expect(state.showPolicyDetails).toBe(true);
    });

    it('should handle setWizardOrigin', () => {
      const s1 = overtimeReducer(initialState, setWizardOrigin('listing'));
      expect(s1.wizardOrigin).toBe('listing');

      const s2 = overtimeReducer(s1, setWizardOrigin(null));
      expect(s2.wizardOrigin).toBeNull();
    });

    it('should handle setWizardEditMode', () => {
      const state = overtimeReducer(initialState, setWizardEditMode(true));
      expect(state.wizardEditMode).toBe(true);
    });

    it('should handle setPolicyMemberIds', () => {
      const state = overtimeReducer(
        initialState,
        setPolicyMemberIds(['m-1', 'm-2']),
      );
      expect(state.policyFormData.policyMemberIds).toEqual(['m-1', 'm-2']);
    });

    it('should handle setInitialMemberIds', () => {
      const state = overtimeReducer(
        initialState,
        setInitialMemberIds(['init-1', 'init-2']),
      );
      expect(state.initialMemberIds).toEqual(['init-1', 'init-2']);
    });

    it('should handle setInitialMemberIds with empty array', () => {
      const stateWithIds = { ...initialState, initialMemberIds: ['id-1'] };
      const state = overtimeReducer(stateWithIds, setInitialMemberIds([]));
      expect(state.initialMemberIds).toEqual([]);
    });

    it('setShowWizard with object payload sets origin', () => {
      const state = overtimeReducer(
        initialState,
        setShowWizard({ show: true, origin: 'listing' }),
      );
      expect(state.showWizard).toBe(true);
      expect(state.wizardOrigin).toBe('listing');
    });

    it('setShowWizard(false) via object payload resets wizard and clears origin', () => {
      const stateOpen = {
        ...initialState,
        showWizard: true,
        wizardOrigin: 'listing' as const,
        wizardCurrentStep: WizardStepId.REVIEW,
        policyFormData: { ...initialPolicyFormData, name: 'Test' },
      };
      const state = overtimeReducer(stateOpen, setShowWizard({ show: false }));
      expect(state.showWizard).toBe(false);
      expect(state.wizardOrigin).toBeNull();
      expect(state.policyFormData.name).toBe('');
    });
  });

  describe('wizard members cache', () => {
    it('setWizardCachedGroups stores groups and marks loaded', () => {
      const groups = [{ id: 'g-1', name: 'Group 1', isActive: true }];
      const state = overtimeReducer(
        initialState,
        setWizardCachedGroups(groups),
      );
      expect(state.wizardMembersCache.groups).toEqual(groups);
      expect(state.wizardMembersCache.groupsLoaded).toBe(true);
      expect(state.wizardMembersCache.groupsLoading).toBe(false);
    });

    it('setWizardGroupsLoading toggles loading flag', () => {
      const state = overtimeReducer(initialState, setWizardGroupsLoading(true));
      expect(state.wizardMembersCache.groupsLoading).toBe(true);
    });

    it('setWizardCachedWorkers stores workers and marks loaded', () => {
      const workers = [{ id: 'w-1', type: 'Employee', isActive: true }];
      const payload = {
        workers,
        totalCount: 1,
        pageInfo: { hasNextPage: false },
      };
      const state = overtimeReducer(
        initialState,
        setWizardCachedWorkers(payload),
      );
      expect(state.wizardMembersCache.workers).toEqual(workers);
      expect(state.wizardMembersCache.workersTotalCount).toBe(1);
      expect(state.wizardMembersCache.workersLoaded).toBe(true);
      expect(state.wizardMembersCache.workersLoading).toBe(false);
    });

    it('setWizardWorkersLoading toggles loading flag', () => {
      const state = overtimeReducer(
        initialState,
        setWizardWorkersLoading(true),
      );
      expect(state.wizardMembersCache.workersLoading).toBe(true);
    });

    it('pushWizardCursorHistory appends; popWizardCursorHistory removes last', () => {
      const s1 = overtimeReducer(
        initialState,
        pushWizardCursorHistory('cursor-1'),
      );
      const s2 = overtimeReducer(s1, pushWizardCursorHistory('cursor-2'));
      expect(s2.wizardMembersCache.cursorHistory).toEqual([
        'cursor-1',
        'cursor-2',
      ]);

      const s3 = overtimeReducer(s2, popWizardCursorHistory());
      expect(s3.wizardMembersCache.cursorHistory).toEqual(['cursor-1']);
    });

    it('setWizardCurrentAfterCursor sets cursor', () => {
      const state = overtimeReducer(
        initialState,
        setWizardCurrentAfterCursor('abc'),
      );
      expect(state.wizardMembersCache.currentAfterCursor).toBe('abc');
    });

    it('clearWizardMembersCache resets cache to initial', () => {
      const loaded = overtimeReducer(
        initialState,
        setWizardCachedGroups([{ id: 'g-1', name: 'G', isActive: true }]),
      );
      const state = overtimeReducer(loaded, clearWizardMembersCache());
      expect(state.wizardMembersCache).toEqual(initialWizardMembersCache);
    });
  });

  describe('mutation state actions', () => {
    it.each([
      {
        label: 'createPolicy',
        pendingAction: setCreatingPolicy,
        initialState: { ...initialState, createPolicyError: 'old error' },
        pendingFlag: 'isCreatingPolicy' as const,
        errorKey: 'createPolicyError' as const,
      },
      {
        label: 'updatePolicy',
        pendingAction: setUpdatingPolicy,
        initialState: { ...initialState, updatePolicyError: 'old error' },
        pendingFlag: 'isUpdatingPolicy' as const,
        errorKey: 'updatePolicyError' as const,
      },
      {
        label: 'deletePolicy',
        pendingAction: setDeletingPolicy,
        initialState: { ...initialState, deletePolicyError: 'old error' },
        pendingFlag: 'isDeletingPolicy' as const,
        errorKey: 'deletePolicyError' as const,
      },
      {
        label: 'manageAssignments',
        pendingAction: setManagingAssignments,
        initialState: { ...initialState, assignmentsError: 'old error' },
        pendingFlag: 'isManagingAssignments' as const,
        errorKey: 'assignmentsError' as const,
      },
    ])(
      'set$label pending(true) clears error',
      ({ pendingAction, initialState: s, pendingFlag, errorKey }) => {
        const state = overtimeReducer(s, (pendingAction as any)(true));
        expect((state as any)[pendingFlag]).toBe(true);
        expect((state as any)[errorKey]).toBeNull();
      },
    );

    it.each([
      {
        label: 'CreatePolicy',
        errorAction: setCreatePolicyError,
        initialState: { ...initialState, isCreatingPolicy: true },
        pendingFlag: 'isCreatingPolicy' as const,
        errorKey: 'createPolicyError' as const,
        errorMessage: 'Create failed',
      },
      {
        label: 'UpdatePolicy',
        errorAction: setUpdatePolicyError,
        initialState: { ...initialState, isUpdatingPolicy: true },
        pendingFlag: 'isUpdatingPolicy' as const,
        errorKey: 'updatePolicyError' as const,
        errorMessage: 'Update failed',
      },
      {
        label: 'DeletePolicy',
        errorAction: setDeletePolicyError,
        initialState: { ...initialState, isDeletingPolicy: true },
        pendingFlag: 'isDeletingPolicy' as const,
        errorKey: 'deletePolicyError' as const,
        errorMessage: 'Delete failed',
      },
      {
        label: 'AssignmentsError',
        errorAction: setAssignmentsError,
        initialState: { ...initialState, isManagingAssignments: true },
        pendingFlag: 'isManagingAssignments' as const,
        errorKey: 'assignmentsError' as const,
        errorMessage: 'Assignments failed',
      },
    ])(
      'set$label sets error and stops pending',
      ({
        errorAction,
        initialState: s,
        pendingFlag,
        errorKey,
        errorMessage,
      }) => {
        const state = overtimeReducer(s, (errorAction as any)(errorMessage));
        expect((state as any)[errorKey]).toBe(errorMessage);
        expect((state as any)[pendingFlag]).toBe(false);
      },
    );
  });

  describe('delete modal state', () => {
    it('setPolicyToDelete stores the policy', () => {
      const state = overtimeReducer(
        initialState,
        setPolicyToDelete(mockPolicy),
      );
      expect(state.policyToDelete).toEqual(mockPolicy);
    });

    it('setShowDeleteModal(true) shows modal', () => {
      const state = overtimeReducer(initialState, setShowDeleteModal(true));
      expect(state.showDeleteModal).toBe(true);
    });

    it('setShowDeleteModal(false) hides modal and clears policyToDelete + error', () => {
      const s = {
        ...initialState,
        showDeleteModal: true,
        policyToDelete: mockPolicy,
        deletePolicyError: 'Some error',
      };
      const state = overtimeReducer(s, setShowDeleteModal(false));
      expect(state.showDeleteModal).toBe(false);
      expect(state.policyToDelete).toBeNull();
      expect(state.deletePolicyError).toBeNull();
    });
  });

  describe('refetch policies flag', () => {
    it('setRefetchPolicies toggles the flag', () => {
      const s1 = overtimeReducer(initialState, setRefetchPolicies(true));
      expect(s1.refetchPolicies).toBe(true);

      const s2 = overtimeReducer(s1, setRefetchPolicies(false));
      expect(s2.refetchPolicies).toBe(false);
    });
  });
});
