/**
 * Overtime Feature Type Definitions
 * Consolidated type definitions for the overtime feature
 */

// ==========================================
// Worker Types
// ==========================================

/**
 * Worker assignment entity for overtime policies
 */
export interface OvertimePolicyAssignment {
  id: string;
  entityType: string; // 'user', 'group', 'all'
  entityId: string;
  entityName: string;
}

// ==========================================
// Overtime Rule Types
// ==========================================

export type OvertimeRuleConditionField =
  | 'threshold'
  | 'day_of_week'
  | 'days_in_a_row';

export interface OvertimeRuleCondition {
  field: OvertimeRuleConditionField;
  value: string;
}

export type OvertimeRuleFrequency = 'WEEKLY' | 'DAILY';

export type OvertimeRuleRuleType =
  | 'weekly'
  | 'daily'
  | 'double_daily'
  | 'consecutive_daily'
  | 'consecutive_double_daily';

export interface OvertimeRule {
  id?: string;
  name: string;
  type: OvertimeRuleRuleType;
  frequency: OvertimeRuleFrequency;
  multiplier: number;
  conditions: OvertimeRuleCondition[];
  enabled?: boolean;
}

// ==========================================
// Overtime Policy Types
// ==========================================

/**
 * Overtime policy with properly typed structures
 * Matches the GraphQL API response structure from TSheets API
 */
export interface OvertimePolicy {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  assignments: { values: OvertimePolicyAssignment[] };
  rules: { values: OvertimeRule[] };
}

// ==========================================
// Policy Form Types
// ==========================================

export type OvertimeRuleType = '' | 'basic' | 'california' | 'custom';

/**
 * Policy form data interface for the wizard
 */
export interface PolicyFormData {
  /** Policy ID - null for create mode, string for edit mode */
  id: string | null;
  /** Policy description */
  description: string;
  name: string;
  isDefault: boolean;
  overtimeRuleType: OvertimeRuleType;
  rules: OvertimeRule[];
  policyMemberIds: string[];
  /** Policy assignments from API (used for edit mode to resolve group/all assignments) */
  policyAssignments?: OvertimePolicyAssignment[];
  /** Whether user has modified member selections from original assignments (edit mode) */
  assignmentsDirty?: boolean;
}

// ==========================================
// Wizard Types
// ==========================================

export enum WizardStepId {
  POLICY_NAME = 1,
  OVERTIME_RULES = 2,
  POLICY_MEMBERS = 3,
  REVIEW = 4,
}

/**
 * Tracks where the wizard was opened from to enable proper back navigation.
 * - 'listing': Wizard opened from the overtime listing page (Create Policy button)
 * - 'policyDetails': Wizard opened from the policy details page (Edit/Assign Workers)
 */
export type WizardOrigin = 'listing' | 'policyDetails';

/**
 * Initial view options for deep-linking into the overtime widget
 * Used when navigating via query params like ?section=overtime|edit|{policyId}
 */
export interface OvertimeInitialViewOptions {
  view: 'list' | 'details' | 'wizard' | 'edit' | 'assign';
  policyId?: string;
  wizardStep?: WizardStepId;
}

// ==========================================
// Wizard Cache Types
// ==========================================

/**
 * Group data for the wizard (simplified type for Redux storage)
 */
export interface Group {
  id: string;
  name: string;
  isActive: boolean;
  stats?: {
    memberCount: number;
  };
}

/**
 * Worker data for the wizard (simplified type for Redux storage)
 */
export interface Worker {
  id: string;
  type: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  memberOfGroup?: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

/**
 * Pagination info for cached data
 * Note: hasPreviousPage is derived from cursorHistory.length > 0
 * startCursor is not used in the wizard pagination flow
 */
export interface CachedPageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

/**
 * Wizard cache state for groups and workers
 * Stores fetched data to avoid redundant API calls when navigating wizard steps
 */
export interface WizardMembersCache {
  // Groups cache
  groups: Group[];
  groupsLoaded: boolean;
  groupsLoading: boolean;

  // Workers cache (keyed by filter state for pagination)
  workers: Worker[];
  workersLoaded: boolean;
  workersLoading: boolean;
  workersTotalCount: number | null;
  workersPageInfo: CachedPageInfo | null;

  // Track cursor history for backward pagination
  cursorHistory: (string | undefined)[];
  currentAfterCursor: string | undefined;
}

// ==========================================
// State Types
// ==========================================

/**
 * Redux state interface for overtime feature
 */
/**
 * Pagination info for policies list (offset-based pagination)
 */
export interface PoliciesPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
}

export interface OvertimeState {
  // Policies data
  policies: OvertimePolicy[];
  policiesPageInfo: PoliciesPageInfo | null;
  isLoadingPolicies: boolean;

  // UI state
  showLandingPage: boolean;
  isTrowserOpen: boolean;
  currentPage: number;

  // Policy details state
  selectedPolicyId: string | null;
  showPolicyDetails: boolean;

  // Wizard state
  showWizard: boolean;
  wizardCurrentStep: WizardStepId;
  /** The step the wizard was started on - used to determine button labels and which mutation to call */
  wizardStartStep: WizardStepId;
  policyFormData: PolicyFormData;
  /** Whether the wizard is in edit mode (true) or create mode (false) */
  wizardEditMode: boolean;
  /** Tracks where the wizard was opened from for back navigation */
  wizardOrigin: WizardOrigin | null;

  // Wizard members cache
  wizardMembersCache: WizardMembersCache;

  // Error handling
  error: string | null;

  // Mutation states
  isCreatingPolicy: boolean;
  createPolicyError: string | null;
  isUpdatingPolicy: boolean;
  updatePolicyError: string | null;
  isDeletingPolicy: boolean;
  deletePolicyError: string | null;
  isManagingAssignments: boolean;
  assignmentsError: string | null;

  // Delete modal state
  policyToDelete: OvertimePolicy | null;
  showDeleteModal: boolean;

  // Refetch flag
  refetchPolicies: boolean;

  // Initial member IDs snapshot (set when wizard opens in edit mode)
  initialMemberIds: string[];

  // Original policy snapshot for diffing in update mutations
  originalPolicySnapshot: {
    name: string;
    description: string;
    isDefault: boolean;
    rules: OvertimeRule[];
  } | null;
}

// ==========================================
// Table Types
// ==========================================

/**
 * Column configuration for overtime policy table
 */
export interface OvertimeTableColumn {
  key: string;
  translationId: string;
  defaultMessage: string;
}

// ==========================================
// Rule Type Option
// ==========================================

/**
 * Option for rule type selection dropdown
 */
export type RuleTypeOption = {
  value: OvertimeRuleType;
  labelId: string;
  defaultMessage: string;
};

// ==========================================
// Logging Types
// ==========================================

// ==========================================
// Mutation Input Types
// ==========================================

/**
 * Input for overtime rule conditions in mutations
 */
export interface OvertimeRuleConditionInput {
  field: OvertimeRuleConditionField;
  value: string;
}

/**
 * Input for a new or updated overtime rule (no deletion).
 * `name`, `type`, `multiplier`, and `conditions` are always required.
 * `id` is present only when updating an existing rule on a numeric policy.
 */
export interface OvertimeRuleUpsertInput {
  id?: string;
  name: string;
  type: OvertimeRuleRuleType;
  multiplier: number;
  conditions: OvertimeRuleConditionInput[];
  delete?: never;
}

/**
 * Input for deleting an overtime rule.
 * Basic policies key on `type`; numeric policies key on `id`.
 */
export interface OvertimeRuleDeleteInput {
  id?: string;
  type?: OvertimeRuleRuleType;
  delete: true;
  name?: never;
  multiplier?: never;
  conditions?: never;
}

/**
 * Discriminated union for overtime rule inputs in create/update mutations.
 * - Upsert: `name`, `type`, `multiplier`, `conditions` required; `delete` absent
 * - Delete: `delete: true` required; keyed by `id` or `type`
 */
export type OvertimeRuleInput =
  | OvertimeRuleUpsertInput
  | OvertimeRuleDeleteInput;

/**
 * Input for creating a new overtime policy
 */
export interface CreateOvertimePolicyInput {
  clientMutationId?: string;
  name: string;
  description?: string;
  setAsDefault: boolean;
  rules: OvertimeRuleInput[];
}

/**
 * Input for updating an existing overtime policy
 */
export interface UpdateOvertimePolicyInput {
  clientMutationId?: string;
  name?: string;
  description?: string;
  setAsDefault?: boolean;
  userId?: string;
  rules?: OvertimeRuleInput[];
}

/**
 * Input for deleting an overtime policy
 */
export interface DeleteOvertimePolicyInput {
  clientMutationId?: string;
}

/**
 * Assignment targets for manage assignments mutation
 */
export interface OvertimePolicyAssignmentTargets {
  userIds?: string[];
  groupIds?: string[];
}

/**
 * Input for managing overtime policy assignments
 */
export interface ManageOvertimePolicyAssignmentsInput {
  clientMutationId?: string;
  setAsDefault?: boolean;
  assign?: OvertimePolicyAssignmentTargets;
  unassign?: OvertimePolicyAssignmentTargets;
}

// ==========================================
// Mutation Response Types
// ==========================================

/**
 * Status structure returned by overtime mutations
 * Contains success/error information for the mutation operation
 */
export interface OvertimeMutationStatus {
  statusCode: string;
  message: string;
}

/**
 * Payload type for mutations that return a policy
 * Aligns with GraphQL mutation response structure in overtimeQueries.ts
 */
export interface OvertimePolicyMutationPayload {
  clientMutationId?: string;
  policy: OvertimePolicy | null;
  status: OvertimeMutationStatus;
}

/**
 * Payload type for delete mutation
 * Returns the deleted policy ID instead of the policy object
 */
export interface OvertimeDeleteMutationPayload {
  clientMutationId?: string;
  deletedPolicyId: string | null;
  status: OvertimeMutationStatus;
}

/**
 * Error structure returned by overtime mutations
 */
export interface GraphQLError {
  message: string;
}

/**
 * Response from createOvertimePolicy mutation
 */
export interface CreateOvertimePolicyResponse {
  createOvertimePolicy: OvertimePolicyMutationPayload;
  errors?: GraphQLError[];
}

/**
 * Response from updateOvertimePolicy mutation
 */
export interface UpdateOvertimePolicyResponse {
  updateOvertimePolicy: OvertimePolicyMutationPayload;
  errors?: GraphQLError[];
}

/**
 * Response from deleteOvertimePolicy mutation
 */
export interface DeleteOvertimePolicyResponse {
  deleteOvertimePolicy: OvertimeDeleteMutationPayload;
  errors?: GraphQLError[];
}

/**
 * Response from manageOvertimePolicyAssignments mutation
 */
export interface ManageOvertimePolicyAssignmentsResponse {
  manageOvertimePolicyAssignments: OvertimePolicyMutationPayload;
  errors?: GraphQLError[];
}

/**
 * Overtime rule type const
 * Represents the different types of overtime rules supported by the system
 */
export const OVERTIME_RULE_TYPES = {
  WEEKLY: 'weekly',
  DAILY: 'daily',
  DOUBLE_DAILY: 'double_daily',
  CONSECUTIVE_DAILY: 'consecutive_daily',
  CONSECUTIVE_DOUBLE_DAILY: 'consecutive_double_daily',
};
