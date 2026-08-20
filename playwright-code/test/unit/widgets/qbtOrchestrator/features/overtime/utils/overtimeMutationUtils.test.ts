import {
  generateClientMutationId,
  transformRuleToInput,
  transformToCreateInput,
  transformToUpdateInput,
  createAssignmentChangesInput,
  createNewPolicyAssignmentsInput,
  filterEnabledRules,
  buildRulesDiff,
  isBasicPolicyId,
  isUserOverridePolicy,
  getUserIdFromPolicyId,
  areRulesEqual,
  detectWorkerReassignmentConflicts,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/utils/overtimeMutationUtils';
import type {
  OvertimeRule,
  PolicyFormData,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/types/Overtime.types';
import {
  createOvertimeRule,
  createDailyRule,
  createDoubleDailyRule,
  createOvertimePolicy,
} from 'test/unit/fixtures/overtimeFixtures';

const makeFormData = (
  overrides: Partial<PolicyFormData> = {},
): PolicyFormData => ({
  id: null,
  name: 'Test Policy',
  description: '',
  isDefault: false,
  overtimeRuleType: 'basic',
  rules: [createOvertimeRule()],
  policyMemberIds: [],
  ...overrides,
});

describe('overtimeMutationUtils', () => {
  describe('isBasicPolicyId', () => {
    it('should return true for "basic" policy ID', () => {
      expect(isBasicPolicyId('basic')).toBe(true);
    });

    it('should return true for policy IDs starting with "basic_policy_"', () => {
      expect(isBasicPolicyId('basic_policy_123')).toBe(true);
      expect(isBasicPolicyId('basic_policy_abc')).toBe(true);
      expect(isBasicPolicyId('basic_policy_')).toBe(true);
    });

    it('should return false for null', () => {
      expect(isBasicPolicyId(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isBasicPolicyId(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isBasicPolicyId('')).toBe(false);
    });

    it('should return false for numeric policy IDs', () => {
      expect(isBasicPolicyId('123')).toBe(false);
      expect(isBasicPolicyId('policy_123')).toBe(false);
    });

    it('should return false for policy IDs containing "basic" but not starting correctly', () => {
      expect(isBasicPolicyId('my_basic_policy')).toBe(false);
      expect(isBasicPolicyId('basic_123')).toBe(false);
    });

    it('should use type predicate correctly - narrows type to string when true', () => {
      const policyId: string | null = 'basic';
      if (isBasicPolicyId(policyId)) {
        // TypeScript should know policyId is string here
        const uppercased: string = policyId.toUpperCase();
        expect(uppercased).toBe('BASIC');
      }
    });
  });

  describe('generateClientMutationId', () => {
    it('should return a string starting with the given prefix', () => {
      const id = generateClientMutationId('create-policy');
      expect(id).toMatch(/^create-policy-/);
    });

    it('should produce unique IDs on repeated calls', () => {
      const id1 = generateClientMutationId('test');
      const id2 = generateClientMutationId('test');
      // They may collide within the same millisecond but the random suffix makes it extremely unlikely
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });

  describe('transformRuleToInput', () => {
    it('should map rule fields to OvertimeRuleInput shape', () => {
      const rule = createOvertimeRule();
      const result = transformRuleToInput(rule);
      expect(result.name).toBe(rule.name);
      expect(result.type).toBe(rule.type);
      expect(result.multiplier).toBe(rule.multiplier);
      expect(result.conditions).toEqual([{ field: 'threshold', value: '40' }]);
    });

    it('should only include field and value in each condition', () => {
      const rule: OvertimeRule = {
        name: 'R',
        type: 'daily',
        frequency: 'DAILY',
        multiplier: 1.5,
        conditions: [
          { field: 'threshold', value: '8' },
          { field: 'day_of_week', value: '1111100' },
        ],
        enabled: true,
      };
      const result = transformRuleToInput(rule);
      expect(result.conditions).toHaveLength(2);
      expect(result.conditions?.[0]).toEqual({
        field: 'threshold',
        value: '8',
      });
      expect(result.conditions?.[1]).toEqual({
        field: 'dow',
        value: '1111100',
      });
    });
  });

  describe('transformToCreateInput', () => {
    it('should trim name and set setAsDefault from formData', () => {
      const formData = makeFormData({ name: '  My Policy  ', isDefault: true });
      const result = transformToCreateInput(formData);
      expect(result.name).toBe('My Policy');
      expect(result.setAsDefault).toBe(true);
    });

    it('should convert empty description to undefined', () => {
      const formData = makeFormData({ description: '' });
      const result = transformToCreateInput(formData);
      expect(result.description).toBeUndefined();
    });

    it('should trim and keep non-empty description', () => {
      const formData = makeFormData({ description: '  A description  ' });
      const result = transformToCreateInput(formData);
      expect(result.description).toBe('A description');
    });

    it.each([
      {
        description: 'should use provided clientMutationId when given',
        clientMutationId: 'my-id' as string | undefined,
        expectedMatch: undefined,
        expectedValue: 'my-id',
      },
      {
        description: 'should auto-generate clientMutationId when not provided',
        clientMutationId: undefined,
        expectedMatch: /^create-policy-/,
        expectedValue: undefined,
      },
    ])('$description', ({ clientMutationId, expectedMatch, expectedValue }) => {
      const formData = makeFormData();
      const result = transformToCreateInput(formData, clientMutationId);
      if (expectedValue !== undefined) {
        expect(result.clientMutationId).toBe(expectedValue);
      }
      if (expectedMatch !== undefined) {
        expect(result.clientMutationId).toMatch(expectedMatch);
      }
    });
  });

  describe('transformToUpdateInput', () => {
    it('should trim name and map rules', () => {
      const formData = makeFormData({ name: ' Updated  ' });
      const result = transformToUpdateInput(formData);
      expect(result.name).toBe('Updated');
      expect(Array.isArray(result.rules)).toBe(true);
    });

    it.each([
      {
        description: 'should use provided clientMutationId when given',
        clientMutationId: 'upd-id' as string | undefined,
        expectedMatch: undefined,
        expectedValue: 'upd-id',
      },
      {
        description: 'should auto-generate clientMutationId when not provided',
        clientMutationId: undefined,
        expectedMatch: /^update-policy-/,
        expectedValue: undefined,
      },
    ])('$description', ({ clientMutationId, expectedMatch, expectedValue }) => {
      const formData = makeFormData();
      const result = transformToUpdateInput(
        formData,
        undefined,
        clientMutationId,
      );
      if (expectedValue !== undefined) {
        expect(result.clientMutationId).toBe(expectedValue);
      }
      if (expectedMatch !== undefined) {
        expect(result.clientMutationId).toMatch(expectedMatch);
      }
    });
  });

  describe('createAssignmentChangesInput', () => {
    it('should return null when there are no changes and setAsDefault is false', () => {
      // Line 101: toAssign.length === 0 && toUnassign.length === 0 && !setAsDefault
      const result = createAssignmentChangesInput(
        ['user-1', 'user-2'],
        ['user-1', 'user-2'],
        'policy-1',
        false,
      );
      expect(result).toBeNull();
    });

    it('should return null when both arrays are empty and setAsDefault is false', () => {
      const result = createAssignmentChangesInput([], [], 'policy-1', false);
      expect(result).toBeNull();
    });

    it('should return input when there are additions', () => {
      const result = createAssignmentChangesInput(
        ['user-1'],
        ['user-1', 'user-2'],
        'policy-1',
        false,
      );
      expect(result).not.toBeNull();
      expect(result?.assign?.userIds).toEqual(['user-2']);
      expect(result?.unassign?.userIds).toEqual([]);
    });

    it('should return input when there are removals', () => {
      const result = createAssignmentChangesInput(
        ['user-1', 'user-2'],
        ['user-1'],
        'policy-1',
        false,
      );
      expect(result).not.toBeNull();
      expect(result?.unassign?.userIds).toEqual(['user-2']);
      expect(result?.assign?.userIds).toEqual([]);
    });

    it('should return input when no member changes but setAsDefault is true', () => {
      const result = createAssignmentChangesInput(
        ['user-1'],
        ['user-1'],
        'policy-1',
        true,
      );
      expect(result).not.toBeNull();
      expect(result?.setAsDefault).toBe(true);
    });

    it.each([
      {
        description: 'should use provided clientMutationId',
        clientMutationId: 'cid' as string | undefined,
        expectedMatch: undefined,
        expectedValue: 'cid',
      },
      {
        description: 'should auto-generate clientMutationId when not provided',
        clientMutationId: undefined,
        expectedMatch: /^manage-assignments-/,
        expectedValue: undefined,
      },
    ])('$description', ({ clientMutationId, expectedMatch, expectedValue }) => {
      const result = createAssignmentChangesInput(
        [],
        ['user-1'],
        'policy-1',
        false,
        clientMutationId,
      );
      if (expectedValue !== undefined) {
        expect(result?.clientMutationId).toBe(expectedValue);
      }
      if (expectedMatch !== undefined) {
        expect(result?.clientMutationId).toMatch(expectedMatch);
      }
    });
  });

  describe('filterEnabledRules', () => {
    it('should filter out rules with enabled: false', () => {
      const rules = [
        createOvertimeRule({ enabled: true }),
        createDailyRule({ enabled: false }),
      ];
      const result = filterEnabledRules(rules);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('weekly');
    });

    it('should keep rules without an enabled field', () => {
      const rule = createOvertimeRule();
      delete (rule as unknown as Record<string, unknown>).enabled;
      const result = filterEnabledRules([rule]);
      expect(result).toHaveLength(1);
    });

    it('should normalize dow → day_of_week in conditions', () => {
      const rule = createOvertimeRule({
        conditions: [
          {
            field: 'dow' as OvertimeRule['conditions'][0]['field'],
            value: '1111100',
          },
        ],
      });
      const result = filterEnabledRules([rule]);
      expect(result[0].conditions[0].field).toBe('day_of_week');
    });
  });

  describe('buildRulesDiff', () => {
    describe('matchByType=true (basic policies)', () => {
      it('should include changed and new draft rules', () => {
        const original = [createOvertimeRule()];
        const draft = [createOvertimeRule(), createDailyRule()];
        const result = buildRulesDiff(original, draft, true);
        // unchanged weekly rule is filtered out, only new daily rule remains
        expect(result.filter((r) => !r.delete)).toHaveLength(1);
        expect(result.filter((r) => !r.delete)[0].type).toBe('daily');
      });

      it('should skip unchanged rules in matchByType branch', () => {
        const rule = createOvertimeRule();
        const result = buildRulesDiff([rule], [{ ...rule }], true);
        expect(result).toHaveLength(0);
      });

      it('should mark removed originals with { type, delete: true }', () => {
        const original = [createOvertimeRule(), createDailyRule()];
        const draft = [createOvertimeRule()];
        const result = buildRulesDiff(original, draft, true);
        const deleted = result.find((r) => r.delete);
        expect(deleted).toEqual({ type: 'daily', delete: true });
      });
    });

    describe('matchByType=false (numeric policies)', () => {
      it('should match by id and skip unchanged rules', () => {
        const rule = createOvertimeRule({ id: 'r1' });
        const result = buildRulesDiff([rule], [{ ...rule }], false);
        expect(result).toHaveLength(0);
      });

      it('should include changed rules with their id', () => {
        const original = createOvertimeRule({ id: 'r1', multiplier: 1.5 });
        const draft = createOvertimeRule({ id: 'r1', multiplier: 2.0 });
        const result = buildRulesDiff([original], [draft], false);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('r1');
        expect(result[0].multiplier).toBe(2.0);
      });

      it('should mark removed originals with { id, delete: true }', () => {
        const original = createOvertimeRule({ id: 'r1' });
        const result = buildRulesDiff([original], [], false);
        expect(result).toEqual([{ id: 'r1', delete: true }]);
      });

      it('should add new rules without id', () => {
        const draft = createDailyRule();
        const result = buildRulesDiff([], [draft], false);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBeUndefined();
        expect(result[0].type).toBe('daily');
      });

      it('should fall back to type matching when draft has no id', () => {
        const original = createOvertimeRule({ id: 'r1' });
        const draft = createOvertimeRule({ multiplier: 2.0 }); // no id, same type
        const result = buildRulesDiff([original], [draft], false);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('r1');
      });
    });
  });

  describe('transformToUpdateInput with originalPolicy', () => {
    it('should only include changed name', () => {
      const formData = makeFormData({ name: 'New Name' });
      const original = {
        name: 'Old Name',
        description: '',
        isDefault: false,
        rules: formData.rules,
      };
      const result = transformToUpdateInput(formData, original);
      expect(result.name).toBe('New Name');
      expect(result.setAsDefault).toBeUndefined();
      expect(result.description).toBeUndefined();
    });

    it('should only include changed description', () => {
      const formData = makeFormData({ description: 'New desc' });
      const original = {
        name: 'Test Policy',
        description: '',
        isDefault: false,
        rules: formData.rules,
      };
      const result = transformToUpdateInput(formData, original);
      expect(result.description).toBe('New desc');
      expect(result.name).toBeUndefined();
    });

    it('should only include changed isDefault', () => {
      const formData = makeFormData({ isDefault: true });
      const original = {
        name: 'Test Policy',
        description: '',
        isDefault: false,
        rules: formData.rules,
      };
      const result = transformToUpdateInput(formData, original);
      expect(result.setAsDefault).toBe(true);
      expect(result.name).toBeUndefined();
    });

    it('should use matchByType=true for basic policy ids', () => {
      const rule = createOvertimeRule();
      const formData = makeFormData({ id: 'basic', rules: [rule] });
      const original = {
        name: 'Test Policy',
        description: '',
        isDefault: false,
        rules: [rule, createDailyRule()],
      };
      const result = transformToUpdateInput(formData, original);
      // basic policy: removed daily rule should have type + delete
      const deleted = result.rules?.find((r) => r.delete);
      expect(deleted).toEqual({ type: 'daily', delete: true });
    });

    it('should use matchByType=true for basic_policy_* ids', () => {
      const rule = createOvertimeRule();
      const formData = makeFormData({ id: 'basic_policy_456', rules: [rule] });
      const original = {
        name: 'Test Policy',
        description: '',
        isDefault: false,
        rules: [rule, createDailyRule()],
      };
      const result = transformToUpdateInput(formData, original);
      // basic policy: removed daily rule should have type + delete
      const deleted = result.rules?.find((r) => r.delete);
      expect(deleted).toEqual({ type: 'daily', delete: true });
    });

    it('should use matchByType=false for numeric policy ids', () => {
      const original = createOvertimeRule({ id: 'r1' });
      const formData = makeFormData({
        id: 'policy_123',
        rules: [createOvertimeRule({ id: 'r1' })],
      });
      const originalPolicy = {
        name: 'Test Policy',
        description: '',
        isDefault: false,
        rules: [original],
      };
      const result = transformToUpdateInput(formData, originalPolicy);
      // unchanged rule — only rules diff, no entries for unchanged
      const nonDeleted = result.rules?.filter((r) => !r.delete) ?? [];
      expect(nonDeleted).toHaveLength(0);
    });
  });

  describe('createNewPolicyAssignmentsInput', () => {
    it('should return null when memberIds is empty and setAsDefault is false', () => {
      // Line 134: memberIds.length === 0 && !setAsDefault
      const result = createNewPolicyAssignmentsInput([], false);
      expect(result).toBeNull();
    });

    it('should return null when called with no args and empty members', () => {
      const result = createNewPolicyAssignmentsInput([]);
      expect(result).toBeNull();
    });

    it('should return input when memberIds is non-empty', () => {
      const result = createNewPolicyAssignmentsInput(
        ['user-1', 'user-2'],
        false,
      );
      expect(result).not.toBeNull();
      expect(result?.assign?.userIds).toEqual(['user-1', 'user-2']);
      expect(result?.unassign?.userIds).toEqual([]);
    });

    it('should return input when memberIds is empty but setAsDefault is true', () => {
      const result = createNewPolicyAssignmentsInput([], true);
      expect(result).not.toBeNull();
      expect(result?.setAsDefault).toBe(true);
    });

    it.each([
      {
        description: 'should use provided clientMutationId',
        clientMutationId: 'my-cid' as string | undefined,
        expectedMatch: undefined,
        expectedValue: 'my-cid',
      },
      {
        description: 'should auto-generate clientMutationId when not provided',
        clientMutationId: undefined,
        expectedMatch: /^assign-members-/,
        expectedValue: undefined,
      },
    ])('$description', ({ clientMutationId, expectedMatch, expectedValue }) => {
      const result = createNewPolicyAssignmentsInput(
        ['user-1'],
        false,
        clientMutationId,
      );
      if (expectedValue !== undefined) {
        expect(result?.clientMutationId).toBe(expectedValue);
      }
      if (expectedMatch !== undefined) {
        expect(result?.clientMutationId).toMatch(expectedMatch);
      }
    });
  });

  describe('detectWorkerReassignmentConflicts', () => {
    it('should return no conflicts when no other policies exist', () => {
      const result = detectWorkerReassignmentConflicts(
        ['worker-1', 'worker-2'],
        null,
        [],
        [],
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflictingWorkerIds).toEqual([]);
    });

    it('should return no conflicts when workers are not assigned to other policies', () => {
      const policy1 = createOvertimePolicy({
        id: 'policy-1',
        assignments: {
          values: [
            {
              id: 'a1',
              entityType: 'user',
              entityId: 'worker-3',
              entityName: 'Worker 3',
            },
          ],
        },
      });

      const result = detectWorkerReassignmentConflicts(
        ['worker-1', 'worker-2'],
        null,
        [policy1],
        [],
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflictingWorkerIds).toEqual([]);
    });

    it('should detect conflicts for direct user assignments', () => {
      const policy1 = createOvertimePolicy({
        id: 'policy-1',
        assignments: {
          values: [
            {
              id: 'a1',
              entityType: 'user',
              entityId: 'worker-1',
              entityName: 'Worker 1',
            },
          ],
        },
      });

      const result = detectWorkerReassignmentConflicts(
        ['worker-1', 'worker-2'],
        null,
        [policy1],
        [],
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.conflictingWorkerIds).toEqual(['worker-1']);
    });

    it('should exclude current policy when checking conflicts', () => {
      const policy1 = createOvertimePolicy({
        id: 'policy-1',
        assignments: {
          values: [
            {
              id: 'a1',
              entityType: 'user',
              entityId: 'worker-1',
              entityName: 'Worker 1',
            },
          ],
        },
      });

      const result = detectWorkerReassignmentConflicts(
        ['worker-1', 'worker-2'],
        'policy-1',
        [policy1],
        [],
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflictingWorkerIds).toEqual([]);
    });

    it('should detect conflicts for group assignments', () => {
      const workers = [
        {
          id: 'worker-1',
          type: 'Employee' as const,
          isActive: true,
          memberOfGroup: { id: 'group-1', name: 'Group 1', isActive: true },
        },
        {
          id: 'worker-2',
          type: 'Employee' as const,
          isActive: true,
          memberOfGroup: { id: 'group-2', name: 'Group 2', isActive: true },
        },
      ];

      const policy1 = createOvertimePolicy({
        id: 'policy-1',
        assignments: {
          values: [
            {
              id: 'a1',
              entityType: 'group',
              entityId: 'group-1',
              entityName: 'Group 1',
            },
          ],
        },
      });

      const result = detectWorkerReassignmentConflicts(
        ['worker-1', 'worker-2'],
        null,
        [policy1],
        workers,
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.conflictingWorkerIds).toEqual(['worker-1']);
    });

    it('should detect conflicts across multiple policies', () => {
      const policy1 = createOvertimePolicy({
        id: 'policy-1',
        assignments: {
          values: [
            {
              id: 'a1',
              entityType: 'user',
              entityId: 'worker-1',
              entityName: 'Worker 1',
            },
          ],
        },
      });

      const policy2 = createOvertimePolicy({
        id: 'policy-2',
        assignments: {
          values: [
            {
              id: 'a2',
              entityType: 'user',
              entityId: 'worker-2',
              entityName: 'Worker 2',
            },
          ],
        },
      });

      const result = detectWorkerReassignmentConflicts(
        ['worker-1', 'worker-2', 'worker-3'],
        null,
        [policy1, policy2],
        [],
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.conflictingWorkerIds).toEqual(['worker-1', 'worker-2']);
    });

    it('should handle workers without group assignments', () => {
      const workers = [
        {
          id: 'worker-1',
          type: 'Employee' as const,
          isActive: true,
        },
      ];

      const policy1 = createOvertimePolicy({
        id: 'policy-1',
        assignments: {
          values: [
            {
              id: 'a1',
              entityType: 'group',
              entityId: 'group-1',
              entityName: 'Group 1',
            },
          ],
        },
      });

      const result = detectWorkerReassignmentConflicts(
        ['worker-1'],
        null,
        [policy1],
        workers,
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflictingWorkerIds).toEqual([]);
    });

    it('should ignore assignments with unknown entity types', () => {
      const policy1 = createOvertimePolicy({
        id: 'policy-1',
        assignments: {
          values: [
            {
              id: 'a1',
              entityType: 'unknown' as any,
              entityId: 'worker-1',
              entityName: 'Worker 1',
            },
          ],
        },
      });

      const result = detectWorkerReassignmentConflicts(
        ['worker-1'],
        null,
        [policy1],
        [],
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflictingWorkerIds).toEqual([]);
    });
  });

  describe('isUserOverridePolicy', () => {
    it('should return true for basic_policy_ prefixed ids', () => {
      expect(isUserOverridePolicy('basic_policy_123')).toBe(true);
      expect(isUserOverridePolicy('basic_policy_abc')).toBe(true);
    });

    it('should return false for "basic"', () => {
      expect(isUserOverridePolicy('basic')).toBe(false);
    });

    it('should return false for null, undefined, and empty string', () => {
      expect(isUserOverridePolicy(null)).toBe(false);
      expect(isUserOverridePolicy(undefined)).toBe(false);
      expect(isUserOverridePolicy('')).toBe(false);
    });

    it('should return false for numeric policy ids', () => {
      expect(isUserOverridePolicy('123')).toBe(false);
    });
  });

  describe('getUserIdFromPolicyId', () => {
    it('should extract user id from basic_policy_ prefixed id', () => {
      expect(getUserIdFromPolicyId('basic_policy_user123')).toBe('user123');
      expect(getUserIdFromPolicyId('basic_policy_')).toBe('');
    });
  });

  describe('areRulesEqual', () => {
    it('should return true for two identical rule arrays', () => {
      const rule = createOvertimeRule({ id: 'r1' });
      expect(areRulesEqual([rule], [{ ...rule }])).toBe(true);
    });

    it('should return false when arrays have different lengths', () => {
      const rule = createOvertimeRule();
      expect(areRulesEqual([rule], [])).toBe(false);
    });

    it('should return false when a rule field differs', () => {
      const a = createOvertimeRule({ multiplier: 1.5 });
      const b = createOvertimeRule({ multiplier: 2.0 });
      expect(areRulesEqual([a], [b])).toBe(false);
    });

    it('should return false when condition counts differ', () => {
      const a = createOvertimeRule({
        conditions: [{ field: 'threshold', value: '40' }],
      });
      const b = createOvertimeRule({ conditions: [] });
      expect(areRulesEqual([a], [b])).toBe(false);
    });

    it('should return false when a condition value differs', () => {
      const a = createOvertimeRule({
        conditions: [{ field: 'threshold', value: '40' }],
      });
      const b = createOvertimeRule({
        conditions: [{ field: 'threshold', value: '50' }],
      });
      expect(areRulesEqual([a], [b])).toBe(false);
    });

    it('should return true for empty arrays', () => {
      expect(areRulesEqual([], [])).toBe(true);
    });
  });
});
