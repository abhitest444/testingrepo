import type {
  OvertimeRule,
  OvertimeRuleConditionField,
  OvertimeRuleType,
  RuleTypeOption,
} from '../../../types/Overtime.types';

// Re-export type for backward compatibility
export type { RuleTypeOption } from '../../../types/Overtime.types';

export const RULE_TYPE_OPTIONS: RuleTypeOption[] = [
  {
    value: 'basic',
    labelId: 'overtime.wizard.rules.option.basic',
    defaultMessage: 'Use Basic Rules',
  },
  {
    value: 'california',
    labelId: 'overtime.wizard.rules.option.california',
    defaultMessage: 'Use California Overtime Rules',
  },
  {
    value: 'custom',
    labelId: 'overtime.wizard.rules.option.custom',
    defaultMessage: 'Create Custom overtime Rules',
  },
];

export const BASIC_RULES: OvertimeRule[] = [
  {
    name: 'Weekly Overtime Pay',
    type: 'weekly',
    frequency: 'WEEKLY',
    multiplier: 1.5,
    conditions: [{ field: 'threshold', value: '40' }],
  },
  {
    name: 'Daily Overtime Pay',
    type: 'daily',
    frequency: 'DAILY',
    multiplier: 1.5,
    conditions: [
      { field: 'day_of_week', value: '1111111' },
      { field: 'threshold', value: '8' },
    ],
  },
  {
    name: 'Daily Double Overtime Pay',
    type: 'double_daily',
    frequency: 'DAILY',
    multiplier: 2,
    conditions: [
      { field: 'day_of_week', value: '1111111' },
      { field: 'threshold', value: '12' },
    ],
  },
];

export const CALIFORNIA_RULES: OvertimeRule[] = [
  ...BASIC_RULES,
  {
    name: 'Consecutive Day Overtime Pay',
    type: 'consecutive_daily',
    frequency: 'DAILY',
    multiplier: 1.5,
    conditions: [
      { field: 'days_in_a_row', value: '7' },
      { field: 'threshold', value: '0' },
    ],
  },
  {
    name: 'Consecutive Day Double Overtime Pay',
    type: 'consecutive_double_daily',
    frequency: 'DAILY',
    multiplier: 2,
    enabled: true,
    conditions: [
      { field: 'days_in_a_row', value: '7' },
      { field: 'threshold', value: '12' },
    ],
  },
];

export const CUSTOM_RULES: OvertimeRule[] = [...CALIFORNIA_RULES];

export const RULE_TYPE_TO_LABEL_ID: Record<OvertimeRule['type'], string> = {
  weekly: 'overtime.wizard.rules.weekly',
  daily: 'overtime.wizard.rules.daily',
  double_daily: 'overtime.wizard.rules.double_daily',
  consecutive_daily: 'overtime.wizard.rules.consecutive_daily',
  consecutive_double_daily: 'overtime.wizard.rules.consecutive_double_daily',
};

export const DAY_OF_WEEK_OPTIONS = [
  { value: '0', labelId: 'weekday.sun', defaultMessage: 'Sunday' },
  { value: '1', labelId: 'weekday.mon', defaultMessage: 'Monday' },
  { value: '2', labelId: 'weekday.tue', defaultMessage: 'Tuesday' },
  { value: '3', labelId: 'weekday.wed', defaultMessage: 'Wednesday' },
  { value: '4', labelId: 'weekday.thu', defaultMessage: 'Thursday' },
  { value: '5', labelId: 'weekday.fri', defaultMessage: 'Friday' },
  { value: '6', labelId: 'weekday.sat', defaultMessage: 'Saturday' },
];

export const getConditionValue = (
  rule: OvertimeRule,
  field: OvertimeRuleConditionField,
) =>
  rule.conditions.find((condition) => condition.field === field)?.value ?? '';

export const setConditionValue = (
  rule: OvertimeRule,
  field: OvertimeRuleConditionField,
  value: string,
): OvertimeRule => {
  const conditionIndex = rule.conditions.findIndex(
    (condition) => condition.field === field,
  );

  if (conditionIndex < 0) {
    return {
      ...rule,
      conditions: [...rule.conditions, { field, value }],
    };
  }

  return {
    ...rule,
    conditions: rule.conditions.map((condition, idx) =>
      idx === conditionIndex ? { ...condition, value } : condition,
    ),
  };
};

export const binaryToDayOfWeek = (binary: string): string[] =>
  binary
    .split('')
    .map((value, index) => (value === '1' ? String(index) : null))
    .filter((value): value is string => value !== null);

export const dayOfWeekToBinary = (selectedDays: string[]): string => {
  const days = Array(7).fill('0');
  selectedDays.forEach((day) => {
    const index = Number(day);
    if (!Number.isNaN(index) && index >= 0 && index <= 6) {
      days[index] = '1';
    }
  });
  return days.join('');
};

export const getDefaultRulesByType = (
  ruleType: OvertimeRuleType,
): OvertimeRule[] => {
  const cloneRules = (rules: OvertimeRule[]) =>
    rules.map((rule) => ({
      ...rule,
      conditions: rule.conditions.map((condition) => ({ ...condition })),
    }));

  switch (ruleType) {
    case 'basic':
      return cloneRules(BASIC_RULES);
    case 'california':
      return cloneRules(CALIFORNIA_RULES);
    case 'custom':
      return cloneRules(CUSTOM_RULES);
    default:
      return [];
  }
};

/**
 * Resolves the overtime rule type from a set of policy rules.
 *
 * - Returns 'basic' when the rules contain no consecutive_daily or
 *   consecutive_double_daily rules.
 * - Returns 'california' when consecutive rules are present AND every rule's
 *   threshold matches the corresponding California constant threshold.
 * - Returns 'custom' when consecutive rules are present but at least one
 *   threshold differs from the California constants (i.e. the user has
 *   customised the values).
 */
export const resolveOvertimeRuleType = (
  rules: OvertimeRule[],
): OvertimeRuleType => {
  if (!rules.length) return 'basic';

  const hasConsecutive = rules.some(
    (r) =>
      r.type === 'consecutive_daily' || r.type === 'consecutive_double_daily',
  );

  if (!hasConsecutive) return 'basic';

  // For each rule present in the policy, compare its threshold against the
  // corresponding California constant. Rules not in the California set are ignored.
  // If every present rule's threshold matches → california, otherwise → custom.
  const allThresholdsMatchCalifornia = rules.every((rule) => {
    const californiaRule = CALIFORNIA_RULES.find((cr) => cr.type === rule.type);
    if (!californiaRule) return true;
    return (
      getConditionValue(rule, 'threshold') ===
      getConditionValue(californiaRule, 'threshold')
    );
  });

  return allThresholdsMatchCalifornia ? 'california' : 'custom';
};
