import {
  resolveOvertimeRuleType,
  CALIFORNIA_RULES,
  BASIC_RULES,
  getConditionValue,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/constants/overtimeRulesConstants';
import type { OvertimeRule } from 'src/js/widgets/qbtOrchestrator/features/overtime/types/Overtime.types';

const cloneRules = (rules: OvertimeRule[]): OvertimeRule[] =>
  rules.map((r) => ({
    ...r,
    conditions: r.conditions.map((c) => ({ ...c })),
  }));

describe('resolveOvertimeRuleType', () => {
  describe('returns basic', () => {
    it('when rules array is empty', () => {
      expect(resolveOvertimeRuleType([])).toBe('basic');
    });

    it('when only basic rules are present (no consecutive rules)', () => {
      expect(resolveOvertimeRuleType(cloneRules(BASIC_RULES))).toBe('basic');
    });

    it('when only weekly rule is present', () => {
      const rules: OvertimeRule[] = [
        {
          name: 'Weekly',
          type: 'weekly',
          frequency: 'WEEKLY',
          multiplier: 1.5,
          conditions: [{ field: 'threshold', value: '40' }],
        },
      ];
      expect(resolveOvertimeRuleType(rules)).toBe('basic');
    });
  });

  describe('returns california', () => {
    it('when all California rules are present with matching thresholds', () => {
      expect(resolveOvertimeRuleType(cloneRules(CALIFORNIA_RULES))).toBe(
        'california',
      );
    });

    it('when only consecutive_daily is present with California threshold', () => {
      const consecutiveDailyCalif = CALIFORNIA_RULES.find(
        (r) => r.type === 'consecutive_daily',
      )!;
      expect(resolveOvertimeRuleType([{ ...consecutiveDailyCalif }])).toBe(
        'california',
      );
    });

    it('when only consecutive_double_daily is present with California threshold', () => {
      const consecutiveDoubleCalif = CALIFORNIA_RULES.find(
        (r) => r.type === 'consecutive_double_daily',
      )!;
      expect(resolveOvertimeRuleType([{ ...consecutiveDoubleCalif }])).toBe(
        'california',
      );
    });

    it('when both consecutive rules are present with California thresholds', () => {
      const consecutiveRules = CALIFORNIA_RULES.filter(
        (r) =>
          r.type === 'consecutive_daily' ||
          r.type === 'consecutive_double_daily',
      );
      expect(resolveOvertimeRuleType(cloneRules(consecutiveRules))).toBe(
        'california',
      );
    });
  });

  describe('returns custom', () => {
    it('when consecutive_daily threshold differs from California constant', () => {
      const rules: OvertimeRule[] = [
        {
          name: 'Consecutive Daily',
          type: 'consecutive_daily',
          frequency: 'DAILY',
          multiplier: 1.5,
          conditions: [
            { field: 'days_in_a_row', value: '7' },
            { field: 'threshold', value: '5' }, // California default is '0'
          ],
        },
      ];
      expect(resolveOvertimeRuleType(rules)).toBe('custom');
    });

    it('when consecutive_double_daily threshold differs from California constant', () => {
      const rules: OvertimeRule[] = [
        {
          name: 'Consecutive Double Daily',
          type: 'consecutive_double_daily',
          frequency: 'DAILY',
          multiplier: 2,
          conditions: [
            { field: 'days_in_a_row', value: '7' },
            { field: 'threshold', value: '8' }, // California default is '12'
          ],
        },
      ];
      expect(resolveOvertimeRuleType(rules)).toBe('custom');
    });

    it('when weekly threshold differs from California constant', () => {
      const rules = cloneRules(CALIFORNIA_RULES).map((r) =>
        r.type === 'weekly'
          ? {
              ...r,
              conditions: r.conditions.map((c) =>
                c.field === 'threshold' ? { ...c, value: '50' } : c,
              ),
            }
          : r,
      );
      expect(resolveOvertimeRuleType(rules)).toBe('custom');
    });

    it('when daily threshold differs from California constant', () => {
      const rules = cloneRules(CALIFORNIA_RULES).map((r) =>
        r.type === 'daily'
          ? {
              ...r,
              conditions: r.conditions.map((c) =>
                c.field === 'threshold' ? { ...c, value: '10' } : c,
              ),
            }
          : r,
      );
      expect(resolveOvertimeRuleType(rules)).toBe('custom');
    });

    it('when double_daily threshold differs from California constant', () => {
      const rules = cloneRules(CALIFORNIA_RULES).map((r) =>
        r.type === 'double_daily'
          ? {
              ...r,
              conditions: r.conditions.map((c) =>
                c.field === 'threshold' ? { ...c, value: '14' } : c,
              ),
            }
          : r,
      );
      expect(resolveOvertimeRuleType(rules)).toBe('custom');
    });
  });

  describe('getConditionValue used correctly', () => {
    it('California consecutive_daily threshold constant is "0"', () => {
      const rule = CALIFORNIA_RULES.find(
        (r) => r.type === 'consecutive_daily',
      )!;
      expect(getConditionValue(rule, 'threshold')).toBe('0');
    });

    it('California consecutive_double_daily threshold constant is "12"', () => {
      const rule = CALIFORNIA_RULES.find(
        (r) => r.type === 'consecutive_double_daily',
      )!;
      expect(getConditionValue(rule, 'threshold')).toBe('12');
    });
  });
});
