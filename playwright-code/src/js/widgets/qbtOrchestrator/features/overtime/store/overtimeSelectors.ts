import { RootState } from '../../../store';
import {
  WizardStepId,
  PolicyFormData,
  OvertimeRuleType,
  WizardMembersCache,
  WizardOrigin,
} from './overtimeSlice';
import { isBasicPolicyId } from '../utils/overtimeMutationUtils';
import type {
  OvertimePolicyAssignment,
  Group,
  Worker,
  CachedPageInfo,
  PoliciesPageInfo,
} from '../types/Overtime.types';

// Selectors for overtime state
export const selectOvertimePolicies = (state: RootState) =>
  state.overtime?.policies ?? [];

export const selectIsLoadingPolicies = (state: RootState) =>
  state.overtime?.isLoadingPolicies ?? false;

export const selectPoliciesPageInfo = (
  state: RootState,
): PoliciesPageInfo | null => state.overtime?.policiesPageInfo ?? null;

export const selectShowLandingPage = (state: RootState) =>
  state.overtime?.showLandingPage ?? false;

export const selectIsTrowserOpen = (state: RootState) =>
  state.overtime?.isTrowserOpen ?? false;

export const selectCurrentPage = (state: RootState) =>
  state.overtime?.currentPage ?? 1;

export const selectSelectedPolicyId = (state: RootState) =>
  state.overtime?.selectedPolicyId ?? null;

export const selectShowPolicyDetails = (state: RootState) =>
  state.overtime?.showPolicyDetails ?? false;

export const selectOvertimeError = (state: RootState) =>
  state.overtime?.error ?? null;

export const selectHasPolicies = (state: RootState) =>
  (state.overtime?.policies?.length ?? 0) > 0;

export const selectPoliciesCount = (state: RootState) =>
  state.overtime?.policies?.length ?? 0;

// Wizard selectors
export const selectShowWizard = (state: RootState) =>
  state.overtime?.showWizard ?? false;

export const selectWizardCurrentStep = (state: RootState): WizardStepId =>
  state.overtime?.wizardCurrentStep ?? WizardStepId.POLICY_NAME;

export const selectPolicyFormData = (state: RootState): PolicyFormData =>
  state.overtime?.policyFormData ?? {
    id: null,
    description: '',
    name: '',
    isDefault: false,
    overtimeRuleType: '',
    rules: [],
    policyMemberIds: [],
    policyAssignments: [],
  };

export const selectPolicyMemberIds = (state: RootState): string[] =>
  state.overtime?.policyFormData?.policyMemberIds ?? [];

export const selectPolicyName = (state: RootState) =>
  state.overtime?.policyFormData?.name ?? '';

export const selectPolicyIsDefault = (state: RootState) =>
  state.overtime?.policyFormData?.isDefault ?? false;

export const selectPolicyIsBasic = (state: RootState) =>
  isBasicPolicyId(state.overtime?.policyFormData?.id ?? null);

export const selectOvertimeRuleType = (state: RootState): OvertimeRuleType =>
  state.overtime?.policyFormData?.overtimeRuleType ?? '';

export const selectOvertimeRules = (state: RootState) =>
  state.overtime?.policyFormData?.rules ?? [];

// Wizard edit mode selectors
export const selectWizardEditMode = (state: RootState) =>
  state.overtime?.wizardEditMode ?? false;

/**
 * Selector for wizard start step - the step the wizard was started on.
 * Used to determine button labels and which mutation to call in edit flows.
 */
export const selectWizardStartStep = (state: RootState): WizardStepId =>
  state.overtime?.wizardStartStep ?? WizardStepId.POLICY_NAME;

/**
 * Selector for wizard origin - where the wizard was opened from.
 * Used to determine proper back navigation behavior.
 */
export const selectWizardOrigin = (state: RootState): WizardOrigin | null =>
  state.overtime?.wizardOrigin ?? null;

export const selectEditingPolicyId = (state: RootState) =>
  state.overtime?.policyFormData?.id ?? null;

export const selectEditingPolicyDescription = (state: RootState) =>
  state.overtime?.policyFormData?.description ?? '';

export const selectPolicyAssignments = (
  state: RootState,
): OvertimePolicyAssignment[] =>
  state.overtime?.policyFormData?.policyAssignments ?? [];

export const selectPolicyDescription = (state: RootState): string =>
  state.overtime?.policyFormData?.description ?? '';

/**
 * Selector for whether user has modified member selections from original assignments.
 * Used to determine if ReviewStep should count from original assignments or user selections.
 */
export const selectAssignmentsDirty = (state: RootState): boolean =>
  state.overtime?.policyFormData?.assignmentsDirty ?? false;

/**
 * Selector for initial member IDs snapshot (set when wizard opens in edit mode).
 * Used to compute assignment changes (assign/unassign deltas) when saving edits.
 */
export const selectInitialMemberIds = (state: RootState): string[] =>
  state.overtime?.initialMemberIds ?? [];

export const selectOriginalPolicySnapshot = (state: RootState) =>
  state.overtime?.originalPolicySnapshot ?? null;

// ==========================================
// Wizard Members Cache Selectors
// ==========================================

const defaultWizardMembersCache: WizardMembersCache = {
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

export const selectWizardMembersCache = (
  state: RootState,
): WizardMembersCache =>
  state.overtime?.wizardMembersCache ?? defaultWizardMembersCache;

// Groups cache selectors
export const selectWizardCachedGroups = (state: RootState): Group[] =>
  state.overtime?.wizardMembersCache?.groups ?? [];

export const selectWizardGroupsLoaded = (state: RootState): boolean =>
  state.overtime?.wizardMembersCache?.groupsLoaded ?? false;

export const selectWizardGroupsLoading = (state: RootState): boolean =>
  state.overtime?.wizardMembersCache?.groupsLoading ?? false;

// Workers cache selectors
export const selectWizardCachedWorkers = (state: RootState): Worker[] =>
  state.overtime?.wizardMembersCache?.workers ?? [];

export const selectWizardWorkersLoaded = (state: RootState): boolean =>
  state.overtime?.wizardMembersCache?.workersLoaded ?? false;

export const selectWizardWorkersLoading = (state: RootState): boolean =>
  state.overtime?.wizardMembersCache?.workersLoading ?? false;

export const selectWizardWorkersTotalCount = (
  state: RootState,
): number | null =>
  state.overtime?.wizardMembersCache?.workersTotalCount ?? null;

export const selectWizardWorkersPageInfo = (
  state: RootState,
): CachedPageInfo | null =>
  state.overtime?.wizardMembersCache?.workersPageInfo ?? null;

// Pagination cursor selectors
export const selectWizardCursorHistory = (
  state: RootState,
): (string | undefined)[] =>
  state.overtime?.wizardMembersCache?.cursorHistory ?? [];

export const selectWizardCurrentAfterCursor = (
  state: RootState,
): string | undefined => state.overtime?.wizardMembersCache?.currentAfterCursor;

// ==========================================
// Mutation State Selectors
// ==========================================

// Create policy mutation state
export const selectIsCreatingPolicy = (state: RootState): boolean =>
  state.overtime?.isCreatingPolicy ?? false;

export const selectCreatePolicyError = (state: RootState): string | null =>
  state.overtime?.createPolicyError ?? null;

// Update policy mutation state
export const selectIsUpdatingPolicy = (state: RootState): boolean =>
  state.overtime?.isUpdatingPolicy ?? false;

export const selectUpdatePolicyError = (state: RootState): string | null =>
  state.overtime?.updatePolicyError ?? null;

// Delete policy mutation state
export const selectIsDeletingPolicy = (state: RootState): boolean =>
  state.overtime?.isDeletingPolicy ?? false;

export const selectDeletePolicyError = (state: RootState): string | null =>
  state.overtime?.deletePolicyError ?? null;

// Manage assignments mutation state
export const selectIsManagingAssignments = (state: RootState): boolean =>
  state.overtime?.isManagingAssignments ?? false;

export const selectAssignmentsError = (state: RootState): string | null =>
  state.overtime?.assignmentsError ?? null;

// Delete modal state
export const selectPolicyToDelete = (state: RootState) =>
  state.overtime?.policyToDelete ?? null;

export const selectShowDeleteModal = (state: RootState): boolean =>
  state.overtime?.showDeleteModal ?? false;

// Refetch policies flag
export const selectRefetchPolicies = (state: RootState): boolean =>
  state.overtime?.refetchPolicies ?? false;
