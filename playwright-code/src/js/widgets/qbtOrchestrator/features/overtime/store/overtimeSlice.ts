import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  OvertimePolicy,
  OvertimePolicyAssignment,
  OvertimeRule,
  OvertimeRuleCondition,
  OvertimeRuleConditionField,
  OvertimeRuleType,
  OvertimeState,
  PolicyFormData,
  Group,
  Worker,
  CachedPageInfo,
  WizardMembersCache,
  PoliciesPageInfo,
  WizardOrigin,
} from '../types/Overtime.types';
import { WizardStepId } from '../types/Overtime.types';
import { filterEnabledRules } from '../utils/overtimeMutationUtils';

// Re-export types for backward compatibility
export type {
  OvertimeRule,
  OvertimeRuleCondition,
  OvertimeRuleConditionField,
  OvertimeRuleType,
  OvertimeState,
  PolicyFormData,
  Group,
  Worker,
  CachedPageInfo,
  WizardMembersCache,
  WizardOrigin,
};
export { WizardStepId };

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
  policyFormData: initialPolicyFormData,
  wizardEditMode: false,
  wizardOrigin: null,
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

  // Original policy snapshot for update diffs
  originalPolicySnapshot: null,
};

const overtimeSlice = createSlice({
  name: 'overtime',
  initialState,
  reducers: {
    // Policies management
    setPolicies: (state, action: PayloadAction<OvertimePolicy[]>) => {
      state.policies = action.payload;
      state.isLoadingPolicies = false;
      state.error = null;
    },

    setPoliciesPageInfo: (
      state,
      action: PayloadAction<PoliciesPageInfo | null>,
    ) => {
      state.policiesPageInfo = action.payload;
    },

    setLoadingPolicies: (state, action: PayloadAction<boolean>) => {
      state.isLoadingPolicies = action.payload;
    },

    addPolicy: (state, action: PayloadAction<OvertimePolicy>) => {
      state.policies.push(action.payload);
    },

    updatePolicy: (state, action: PayloadAction<OvertimePolicy>) => {
      const index = state.policies.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.policies[index] = action.payload;
      }
    },

    removePolicy: (state, action: PayloadAction<string>) => {
      state.policies = state.policies.filter((p) => p.id !== action.payload);
    },

    // UI state management
    setShowLandingPage: (state, action: PayloadAction<boolean>) => {
      state.showLandingPage = action.payload;
      if (action.payload) {
        state.isTrowserOpen = true;
      }
    },

    setTrowserOpen: (state, action: PayloadAction<boolean>) => {
      state.isTrowserOpen = action.payload;
      if (!action.payload) {
        state.showLandingPage = false;
      }
    },

    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    setSelectedPolicyId: (state, action: PayloadAction<string | null>) => {
      state.selectedPolicyId = action.payload;
    },

    setShowPolicyDetails: (state, action: PayloadAction<boolean>) => {
      state.showPolicyDetails = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoadingPolicies = false;
    },

    // Wizard state management
    setShowWizard: (
      state,
      action: PayloadAction<boolean | { show: boolean; origin?: WizardOrigin }>,
    ) => {
      const { payload } = action;
      const show = typeof payload === 'boolean' ? payload : payload.show;
      const origin = typeof payload === 'boolean' ? undefined : payload.origin;

      state.showWizard = show;
      if (origin) {
        state.wizardOrigin = origin;
      }
      if (!show) {
        // Reset wizard state when closing
        state.wizardCurrentStep = WizardStepId.POLICY_NAME;
        state.wizardStartStep = WizardStepId.POLICY_NAME;
        state.policyFormData = initialPolicyFormData;
        state.wizardEditMode = false;
        state.wizardOrigin = null;
        // Clear wizard members cache
        state.wizardMembersCache = initialWizardMembersCache;
      }
    },

    setWizardOrigin: (state, action: PayloadAction<WizardOrigin | null>) => {
      state.wizardOrigin = action.payload;
    },

    setWizardEditMode: (state, action: PayloadAction<boolean>) => {
      state.wizardEditMode = action.payload;
    },

    /**
     * Initialize wizard for editing an existing policy
     * Pre-populates form data and sets edit mode
     * @param origin - Where the wizard was opened from (for back navigation)
     */
    initializeWizardForEdit: (
      state,
      action: PayloadAction<{
        policyId: string;
        name: string;
        description: string;
        isDefault: boolean;
        rules: OvertimeRule[];
        ruleType: OvertimeRuleType;
        memberIds: string[];
        assignments?: OvertimePolicyAssignment[];
        startStep: WizardStepId;
        origin: WizardOrigin;
      }>,
    ) => {
      const {
        policyId,
        name,
        description,
        isDefault,
        rules,
        ruleType,
        memberIds,
        assignments,
        startStep,
        origin,
      } = action.payload;
      state.showWizard = true;
      state.wizardEditMode = true;
      state.wizardCurrentStep = startStep;
      state.wizardStartStep = startStep;
      state.wizardOrigin = origin;
      const enabledRules = filterEnabledRules(rules);
      state.policyFormData = {
        id: policyId,
        description,
        name,
        isDefault,
        overtimeRuleType: ruleType,
        rules: enabledRules,
        policyMemberIds: memberIds,
        policyAssignments: assignments || [],
      };
      state.initialMemberIds = memberIds;
      state.originalPolicySnapshot = {
        name,
        description,
        isDefault,
        rules: enabledRules,
      };
    },

    setWizardCurrentStep: (state, action: PayloadAction<WizardStepId>) => {
      state.wizardCurrentStep = action.payload;
    },

    updatePolicyFormData: (
      state,
      action: PayloadAction<Partial<PolicyFormData>>,
    ) => {
      state.policyFormData = { ...state.policyFormData, ...action.payload };
    },

    setPolicyName: (state, action: PayloadAction<string>) => {
      state.policyFormData.name = action.payload;
    },

    setPolicyIsDefault: (state, action: PayloadAction<boolean>) => {
      state.policyFormData.isDefault = action.payload;
    },

    setOvertimeRuleType: (state, action: PayloadAction<OvertimeRuleType>) => {
      state.policyFormData.overtimeRuleType = action.payload;
    },

    setOvertimeRules: (state, action: PayloadAction<OvertimeRule[]>) => {
      state.policyFormData.rules = action.payload;
    },

    setPolicyMemberIds: (state, action: PayloadAction<string[]>) => {
      state.policyFormData.policyMemberIds = action.payload;
    },

    setInitialMemberIds: (state, action: PayloadAction<string[]>) => {
      state.initialMemberIds = action.payload;
    },

    /**
     * Mark whether assignments have been modified by the user in edit mode.
     * Used to determine if we should count from original assignments or user selections.
     */
    setAssignmentsDirty: (state, action: PayloadAction<boolean>) => {
      state.policyFormData.assignmentsDirty = action.payload;
    },

    resetWizardState: (state) => {
      state.showWizard = false;
      state.wizardCurrentStep = WizardStepId.POLICY_NAME;
      state.wizardStartStep = WizardStepId.POLICY_NAME;
      state.policyFormData = initialPolicyFormData;
      state.wizardEditMode = false;
      state.wizardOrigin = null;
      state.initialMemberIds = [];
      state.originalPolicySnapshot = null;
      // Clear wizard members cache
      state.wizardMembersCache = initialWizardMembersCache;
    },

    // ==========================================
    // Wizard Members Cache Actions
    // ==========================================

    // Groups cache actions
    setWizardCachedGroups: (state, action: PayloadAction<Group[]>) => {
      state.wizardMembersCache.groups = action.payload;
      state.wizardMembersCache.groupsLoaded = true;
      state.wizardMembersCache.groupsLoading = false;
    },

    setWizardGroupsLoading: (state, action: PayloadAction<boolean>) => {
      state.wizardMembersCache.groupsLoading = action.payload;
    },

    // Workers cache actions
    setWizardCachedWorkers: (
      state,
      action: PayloadAction<{
        workers: Worker[];
        totalCount: number;
        pageInfo: CachedPageInfo;
        afterCursor?: string;
      }>,
    ) => {
      const { workers, totalCount, pageInfo, afterCursor } = action.payload;
      state.wizardMembersCache.workers = workers;
      state.wizardMembersCache.workersTotalCount = totalCount;
      state.wizardMembersCache.workersPageInfo = pageInfo;
      state.wizardMembersCache.workersLoaded = true;
      state.wizardMembersCache.workersLoading = false;
      state.wizardMembersCache.currentAfterCursor = afterCursor;
    },

    setWizardWorkersLoading: (state, action: PayloadAction<boolean>) => {
      state.wizardMembersCache.workersLoading = action.payload;
    },

    // Pagination cursor management
    pushWizardCursorHistory: (
      state,
      action: PayloadAction<string | undefined>,
    ) => {
      state.wizardMembersCache.cursorHistory.push(action.payload);
    },

    popWizardCursorHistory: (state) => {
      state.wizardMembersCache.cursorHistory.pop();
    },

    setWizardCurrentAfterCursor: (
      state,
      action: PayloadAction<string | undefined>,
    ) => {
      state.wizardMembersCache.currentAfterCursor = action.payload;
    },

    // Clear only the members cache (useful for filter changes)
    clearWizardMembersCache: (state) => {
      state.wizardMembersCache = initialWizardMembersCache;
    },

    // ==========================================
    // Mutation State Actions
    // ==========================================

    // Create policy mutation state
    setCreatingPolicy: (state, action: PayloadAction<boolean>) => {
      state.isCreatingPolicy = action.payload;
      if (action.payload) {
        state.createPolicyError = null;
      }
    },
    setCreatePolicyError: (state, action: PayloadAction<string | null>) => {
      state.createPolicyError = action.payload;
      state.isCreatingPolicy = false;
    },

    // Update policy mutation state
    setUpdatingPolicy: (state, action: PayloadAction<boolean>) => {
      state.isUpdatingPolicy = action.payload;
      if (action.payload) {
        state.updatePolicyError = null;
      }
    },
    setUpdatePolicyError: (state, action: PayloadAction<string | null>) => {
      state.updatePolicyError = action.payload;
      state.isUpdatingPolicy = false;
    },

    // Delete policy mutation state
    setDeletingPolicy: (state, action: PayloadAction<boolean>) => {
      state.isDeletingPolicy = action.payload;
      if (action.payload) {
        state.deletePolicyError = null;
      }
    },
    setDeletePolicyError: (state, action: PayloadAction<string | null>) => {
      state.deletePolicyError = action.payload;
      state.isDeletingPolicy = false;
    },

    // Manage assignments mutation state
    setManagingAssignments: (state, action: PayloadAction<boolean>) => {
      state.isManagingAssignments = action.payload;
      if (action.payload) {
        state.assignmentsError = null;
      }
    },
    setAssignmentsError: (state, action: PayloadAction<string | null>) => {
      state.assignmentsError = action.payload;
      state.isManagingAssignments = false;
    },

    // Delete modal state
    setPolicyToDelete: (
      state,
      action: PayloadAction<OvertimePolicy | null>,
    ) => {
      state.policyToDelete = action.payload;
    },
    setShowDeleteModal: (state, action: PayloadAction<boolean>) => {
      state.showDeleteModal = action.payload;
      if (!action.payload) {
        state.policyToDelete = null;
        state.deletePolicyError = null;
      }
    },

    // Refetch policies flag
    setRefetchPolicies: (state, action: PayloadAction<boolean>) => {
      state.refetchPolicies = action.payload;
    },

    // Reset state
    resetOvertimeState: () => initialState,
  },
});

export const {
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
  setWizardEditMode,
  setWizardOrigin,
  initializeWizardForEdit,
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
  // Wizard members cache actions
  setWizardCachedGroups,
  setWizardGroupsLoading,
  setWizardCachedWorkers,
  setWizardWorkersLoading,
  pushWizardCursorHistory,
  popWizardCursorHistory,
  setWizardCurrentAfterCursor,
  clearWizardMembersCache,
  // Mutation state actions
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
  // Refetch policies action
  setRefetchPolicies,
} = overtimeSlice.actions;

export default overtimeSlice.reducer;
