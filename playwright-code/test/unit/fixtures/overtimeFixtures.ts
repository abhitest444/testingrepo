import type {
  OvertimePolicy,
  OvertimeRule,
  OvertimePolicyAssignment,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/types/Overtime.types';

export const createOvertimeRule = (
  overrides: Partial<OvertimeRule> = {},
): OvertimeRule => ({
  name: 'Weekly Overtime',
  type: 'weekly',
  frequency: 'WEEKLY',
  multiplier: 1.5,
  conditions: [{ field: 'threshold', value: '40' }],
  enabled: true,
  ...overrides,
});

export const createDailyRule = (
  overrides: Partial<OvertimeRule> = {},
): OvertimeRule =>
  createOvertimeRule({
    name: 'Daily Overtime',
    type: 'daily',
    frequency: 'DAILY',
    conditions: [{ field: 'threshold', value: '8' }],
    ...overrides,
  });

export const createDoubleDailyRule = (
  overrides: Partial<OvertimeRule> = {},
): OvertimeRule =>
  createOvertimeRule({
    name: 'Double Daily Overtime',
    type: 'double_daily',
    frequency: 'DAILY',
    multiplier: 2.0,
    conditions: [{ field: 'threshold', value: '12' }],
    ...overrides,
  });

export const createOvertimePolicy = (
  overrides: Partial<OvertimePolicy> = {},
): OvertimePolicy => ({
  id: '1',
  name: 'Test Policy',
  description: '',
  isDefault: false,
  assignments: { values: [] },
  rules: { values: [createOvertimeRule()] },
  ...overrides,
});

/** Generate N minimal policies (no rules/assignments) for pagination tests. */
export const createOvertimePolicies = (
  count: number,
  overrides?: Partial<OvertimePolicy>,
): OvertimePolicy[] =>
  Array.from({ length: count }, (_, i) =>
    createOvertimePolicy({
      id: `${i + 1}`,
      name: `Policy ${i + 1}`,
      isDefault: i === 0,
      assignments: { values: [] },
      rules: { values: [] },
      ...overrides,
    }),
  );

export const createAssignment = (
  overrides: Partial<OvertimePolicyAssignment>,
): OvertimePolicyAssignment => ({
  id: 'a1',
  entityType: 'user',
  entityId: 'user-1',
  entityName: 'Test User',
  ...overrides,
});
