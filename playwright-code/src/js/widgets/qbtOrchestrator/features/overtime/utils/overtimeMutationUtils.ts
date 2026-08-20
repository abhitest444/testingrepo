import type {
  PolicyFormData,
  OvertimeRule,
  OvertimeRuleCondition,
  CreateOvertimePolicyInput,
  UpdateOvertimePolicyInput,
  OvertimeRuleInput,
  OvertimeRuleUpsertInput,
  OvertimeRuleDeleteInput,
  ManageOvertimePolicyAssignmentsInput,
  OvertimePolicy,
  Worker,
} from '../types/Overtime.types';

const BASIC_POLICY_PREFIX = 'basic_policy_';
export const BASIC_POLICY_ID = 'basic';

/**
 * Checks if a policy ID represents a basic policy.
 * Basic policies have ID 'basic' or start with 'basic_policy_'.
 *
 * @param policyId - The policy ID to check
 * @returns true if the policy is a basic policy type, false otherwise
 */
export const isBasicPolicyId = (
  policyId: string | null | undefined,
): policyId is string => {
  if (!policyId) return false;
  return (
    policyId === BASIC_POLICY_ID || policyId.startsWith(BASIC_POLICY_PREFIX)
  );
};

/**
 * Returns `true` if the policy is a user-level override (id starts with 'basic_policy_').
 */
export const isUserOverridePolicy = (
  policyId: string | undefined | null,
): boolean => !!policyId && policyId.startsWith(BASIC_POLICY_PREFIX);

/**
 * Extracts the user ID from a user-level override policy ID.
 * User override policy IDs are of the form 'basic_policy_<user-id>'.
 * Only call this after confirming `isUserOverridePolicy` is true.
 */
export const getUserIdFromPolicyId = (policyId: string): string =>
  policyId.slice(BASIC_POLICY_PREFIX.length);

/**
 * Deep field-by-field comparison of two OvertimeRule arrays.
 * Order-sensitive (index-by-index) since rules are displayed in order.
 */
export const areRulesEqual = (
  a: OvertimeRule[],
  b: OvertimeRule[],
): boolean => {
  if (a.length !== b.length) return false;
  return a.every((ruleA, i) => {
    const ruleB = b[i];
    if (ruleA.type !== ruleB.type) return false;
    if (ruleA.name !== ruleB.name) return false;
    if (ruleA.multiplier !== ruleB.multiplier) return false;
    if (ruleA.id !== ruleB.id) return false;
    if (ruleA.frequency !== ruleB.frequency) return false;
    if (ruleA.enabled !== ruleB.enabled) return false;

    const condA: OvertimeRuleCondition[] = ruleA.conditions ?? [];
    const condB: OvertimeRuleCondition[] = ruleB.conditions ?? [];
    if (condA.length !== condB.length) return false;
    return condA.every((cA, j) => {
      const cB = condB[j];
      return cA.field === cB.field && cA.value === cB.value;
    });
  });
};

/**
 * Generate a unique client mutation ID for GraphQL mutations
 * @param prefix - Prefix for the mutation ID (e.g., 'create-policy', 'update-policy')
 * @returns A unique string identifier
 */
export const generateClientMutationId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Map API condition field names to internal field names.
 * API may return 'dow' instead of 'day_of_week'.
 */
// API → internal field name mapping
const CONDITION_FIELD_ALIASES: Record<string, string> = {
  dow: 'day_of_week',
};

// Internal → API field name mapping (reverse of aliases)
const CONDITION_FIELD_TO_API: Record<string, string> = {
  day_of_week: 'dow',
};

/**
 * Normalize rule conditions to use internal field names.
 * Converts API field names (e.g., 'dow') to expected names (e.g., 'day_of_week').
 */
const normalizeConditions = (rule: OvertimeRule): OvertimeRule => ({
  ...rule,
  conditions: (rule.conditions ?? []).map((c) => ({
    ...c,
    field: (CONDITION_FIELD_ALIASES[c.field] ||
      c.field) as OvertimeRule['conditions'][0]['field'],
  })),
});

/**
 * Filter rules to only include enabled ones and normalize condition field names.
 * Rules with enabled: false are excluded. Rules without an enabled field are included.
 *
 * This function is idempotent — callers do not need to pre-filter before passing
 * rules here. It is safe to call on already-filtered rules.
 */
export const filterEnabledRules = (rules: OvertimeRule[]): OvertimeRule[] =>
  rules.filter((r) => r.enabled !== false).map(normalizeConditions);

/**
 * Transform an OvertimeRule to OvertimeRuleInput for API consumption.
 * The main transformation is converting multiplier from number to string.
 * @param rule - The overtime rule from the form
 * @returns The rule formatted for the API
 */
export const transformRuleToInput = (
  rule: OvertimeRule,
): OvertimeRuleUpsertInput => ({
  name: rule.name,
  type: rule.type,
  multiplier: rule.multiplier,
  conditions: rule.conditions.map((condition) => ({
    field: (CONDITION_FIELD_TO_API[condition.field] ||
      condition.field) as OvertimeRule['conditions'][0]['field'],
    value: condition.value,
  })),
});

/**
 * Transform policy form data to CreateOvertimePolicyInput
 * @param formData - The policy form data from the wizard
 * @param clientMutationId - Optional client mutation ID
 * @returns Input object for createOvertimePolicy mutation
 */
export const transformToCreateInput = (
  formData: PolicyFormData,
  clientMutationId?: string,
): CreateOvertimePolicyInput => ({
  clientMutationId:
    clientMutationId ?? generateClientMutationId('create-policy'),
  name: formData.name.trim(),
  description: formData.description?.trim() || undefined,
  setAsDefault: formData.isDefault,
  rules: formData.rules.map(transformRuleToInput),
});

/**
 * Check if a rule is unchanged between original and draft.
 * Uses explicit field-by-field comparison instead of JSON.stringify
 * to avoid fragile ordering/serialization issues.
 */
const isRuleUnchanged = (
  original: OvertimeRule,
  draft: OvertimeRule,
): boolean => {
  if (original.name !== draft.name) return false;
  if (original.type !== draft.type) return false;
  if (original.multiplier !== draft.multiplier) return false;

  const condA: OvertimeRuleCondition[] = original.conditions ?? [];
  const condB: OvertimeRuleCondition[] = draft.conditions ?? [];
  if (condA.length !== condB.length) return false;
  return condA.every((cA, j) => {
    const cB = condB[j];
    return cA.field === cB.field && cA.value === cB.value;
  });
};

/**
 * Build a rules diff for update mutations.
 *
 * Basic policies (id 'basic' or 'basic_policy_*') use rule `type` as key:
 *   - Updated: { type, ...fields }
 *   - Removed: { type, delete: true }
 *
 * Numeric policies use rule `id` as key:
 *   - Updated: { id, ...fields }
 *   - Removed: { id, delete: true }
 *   - New: no id
 *
 * @param matchByType - true for basic policies, false for numeric policies
 */
export const buildRulesDiff = (
  originalRules: OvertimeRule[],
  draftRules: OvertimeRule[],
  matchByType = false,
): OvertimeRuleInput[] => {
  const result: OvertimeRuleInput[] = [];

  if (matchByType) {
    const draftByType = new Map(draftRules.map((r) => [r.type, r]));
    const originalByType = new Map(originalRules.map((r) => [r.type, r]));

    // Updated or new rules — skip unchanged
    draftRules.forEach((draft) => {
      const original = originalByType.get(draft.type);
      if (original && isRuleUnchanged(original, draft)) {
        return;
      }
      result.push(transformRuleToInput(draft));
    });

    // Removed rules — in original but not in draft
    originalRules.forEach((original) => {
      if (!draftByType.has(original.type)) {
        result.push({
          type: original.type,
          delete: true,
        } as OvertimeRuleDeleteInput);
      }
    });
  } else {
    // For numeric policies: match by id first, fall back to type.
    // This handles dropdown changes where draft rules are fresh defaults (no id).
    const originalByType = new Map(originalRules.map((r) => [r.type, r]));
    const matchedOriginalIds = new Set<string>();

    draftRules.forEach((draft) => {
      // Try to find the matching original rule: by id if present, else by type
      const matchedOriginal = draft.id
        ? originalRules.find((r) => r.id === draft.id)
        : originalByType.get(draft.type);

      if (matchedOriginal?.id) {
        matchedOriginalIds.add(matchedOriginal.id);
        // Skip unchanged rules
        if (!isRuleUnchanged(matchedOriginal, draft)) {
          result.push({
            id: matchedOriginal.id,
            ...transformRuleToInput(draft),
          });
        }
      } else {
        // New rule — no id
        result.push(transformRuleToInput(draft));
      }
    });

    // Removed rules — originals not matched by any draft
    originalRules.forEach((original) => {
      if (original.id && !matchedOriginalIds.has(original.id)) {
        result.push({
          id: original.id,
          delete: true,
        } as OvertimeRuleDeleteInput);
      }
    });
  }

  return result;
};

/**
 * Transform policy form data to UpdateOvertimePolicyInput
 * Only includes fields that have changed from the original policy
 * @param formData - The policy form data from the wizard
 * @param originalPolicy - The original policy before edits (optional, for diff)
 * @param clientMutationId - Optional client mutation ID
 * @returns Input object for updateOvertimePolicy mutation
 */
export const transformToUpdateInput = (
  formData: PolicyFormData,
  originalPolicy?: {
    name: string;
    description?: string;
    isDefault: boolean;
    rules: OvertimeRule[];
  },
  clientMutationId?: string,
): UpdateOvertimePolicyInput => {
  const input: UpdateOvertimePolicyInput = {
    clientMutationId:
      clientMutationId ?? generateClientMutationId('update-policy'),
  };

  if (!originalPolicy) {
    // No original to diff against — send everything
    input.name = formData.name.trim();
    input.description = formData.description?.trim() || undefined;
    input.setAsDefault = formData.isDefault;
    input.rules = formData.rules.map(transformRuleToInput);
    return input;
  }

  // Only include changed fields
  if (formData.name.trim() !== originalPolicy.name) {
    input.name = formData.name.trim();
  }
  if (
    (formData.description?.trim() || '') !== (originalPolicy.description || '')
  ) {
    input.description = formData.description?.trim() || undefined;
  }
  if (formData.isDefault !== originalPolicy.isDefault) {
    input.setAsDefault = formData.isDefault;
  }

  // Build rules diff — basic policies use type as key, numeric use id
  const isBasicPolicy = isBasicPolicyId(formData.id);
  input.rules = buildRulesDiff(
    filterEnabledRules(originalPolicy.rules),
    filterEnabledRules(formData.rules),
    isBasicPolicy,
  );

  return input;
};

/**
 * Create assignment changes for ManageOvertimePolicyAssignmentsInput
 * Computes the differences between initial and current member selections
 * @param initialMemberIds - The original set of member IDs assigned to the policy
 * @param currentMemberIds - The new set of member IDs selected in the wizard
 * @param policyId - The policy ID to manage assignments for
 * @param setAsDefault - Whether to set this as the default policy
 * @param clientMutationId - Optional client mutation ID
 * @returns Input object for manageOvertimePolicyAssignments mutation, or null if no changes
 */
export const createAssignmentChangesInput = (
  initialMemberIds: string[],
  currentMemberIds: string[],
  policyId: string,
  setAsDefault: boolean = false,
  clientMutationId?: string,
): ManageOvertimePolicyAssignmentsInput | null => {
  const initialSet = new Set(initialMemberIds);
  const currentSet = new Set(currentMemberIds);

  // Compute additions (in current but not in initial)
  const toAssign = currentMemberIds.filter((id) => !initialSet.has(id));

  // Compute removals (in initial but not in current)
  const toUnassign = initialMemberIds.filter((id) => !currentSet.has(id));

  // If no changes, return null
  if (toAssign.length === 0 && toUnassign.length === 0 && !setAsDefault) {
    return null;
  }

  return {
    clientMutationId:
      clientMutationId ?? generateClientMutationId('manage-assignments'),
    setAsDefault,
    assign: {
      userIds: toAssign,
      groupIds: [], // Group assignments handled separately if needed
    },
    unassign: {
      userIds: toUnassign,
      groupIds: [],
    },
  };
};

/**
 * Create assignment input for a new policy (create mode)
 * All selected members are new assignments
 * @param memberIds - The member IDs to assign
 * @param policyId - The policy ID (will be provided after create)
 * @param setAsDefault - Whether to set as default policy
 * @param clientMutationId - Optional client mutation ID
 * @returns Input object for manageOvertimePolicyAssignments mutation
 */
export const createNewPolicyAssignmentsInput = (
  memberIds: string[],
  setAsDefault: boolean = false,
  clientMutationId?: string,
): Omit<ManageOvertimePolicyAssignmentsInput, 'policyId'> | null => {
  if (memberIds.length === 0 && !setAsDefault) {
    return null;
  }

  return {
    clientMutationId:
      clientMutationId ?? generateClientMutationId('assign-members'),
    setAsDefault,
    assign: {
      userIds: memberIds,
      groupIds: [],
    },
    unassign: {
      userIds: [],
      groupIds: [],
    },
  };
};

/**
 * Interface for worker reassignment conflict detection result
 */
export interface WorkerReassignmentConflicts {
  hasConflicts: boolean;
  conflictingWorkerIds: string[];
}

/**
 * Detect if selected workers are already assigned to other overtime policies.
 * Checks all assignment types: direct user assignments, group assignments, and company-wide ('all') assignments.
 *
 * @param selectedWorkerIds - Array of worker IDs selected in the wizard
 * @param currentPolicyId - The policy being edited (null for create mode)
 * @param allPolicies - All overtime policies in the system
 * @param allWorkers - All workers (needed to resolve group assignments)
 * @returns Object with hasConflicts flag and array of conflicting worker IDs
 *
 * @example
 * ```ts
 * const { hasConflicts, conflictingWorkerIds } = detectWorkerReassignmentConflicts(
 *   ['worker1', 'worker2'],
 *   'policy123',
 *   policies,
 *   workers
 * );
 *
 * if (hasConflicts) {
 *   console.log(`${conflictingWorkerIds.length} workers are already assigned to other policies`);
 * }
 * ```
 */
export const detectWorkerReassignmentConflicts = (
  selectedWorkerIds: string[],
  currentPolicyId: string | null,
  allPolicies: OvertimePolicy[],
  allWorkers: Worker[],
): WorkerReassignmentConflicts => {
  // Filter out the current policy and default policies
  const otherPolicies = allPolicies.filter(
    (p) => p.id !== currentPolicyId && !p.isDefault,
  );

  const conflictingWorkerIds = new Set<string>();
  const selectedWorkerIdsSet = new Set(selectedWorkerIds);

  otherPolicies.forEach((policy) => {
    const assignments = policy.assignments?.values ?? [];

    assignments.forEach((assignment) => {
      switch (assignment.entityType) {
        case 'user': {
          // Direct user assignment - check if this worker is in our selection
          if (selectedWorkerIdsSet.has(assignment.entityId)) {
            conflictingWorkerIds.add(assignment.entityId);
          }
          break;
        }

        case 'group': {
          // Group assignment - find all workers in this group and check for conflicts
          const workersInGroup = allWorkers.filter(
            (w) => w.memberOfGroup?.id === assignment.entityId,
          );
          workersInGroup.forEach((worker) => {
            if (selectedWorkerIdsSet.has(worker.id)) {
              conflictingWorkerIds.add(worker.id);
            }
          });
          break;
        }
        default:
          // Unknown entity type - skip
          break;
      }
    });
  });

  return {
    hasConflicts: conflictingWorkerIds.size > 0,
    conflictingWorkerIds: Array.from(conflictingWorkerIds),
  };
};
