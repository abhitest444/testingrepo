import React from 'react';
import { screen } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import OvertimeRulesTable from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRulesTable';
import type {
  OvertimeRule,
  OvertimeRuleType,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/types';
import {
  BASIC_RULES,
  CALIFORNIA_RULES,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/constants/overtimeRulesConstants';

// Mock IDS Typography
jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <span data-testid="ids-typography" {...props}>
      {children}
    </span>
  ),
}));

describe('OvertimeRulesTable', () => {
  const mockSandbox = getDefaultSandbox();
  let store: ReturnType<typeof createQbtOrchestratorStore>;

  beforeEach(() => {
    store = createQbtOrchestratorStore();
  });

  const renderComponent = (props: {
    rules: OvertimeRule[];
    overtimeRuleType: OvertimeRuleType;
  }) =>
    renderWithQuicksandReduxAndLogging(
      <OvertimeRulesTable {...props} />,
      store,
      mockSandbox,
    );

  describe('Empty State', () => {
    it('should render empty message when rules array is empty', () => {
      renderComponent({ rules: [], overtimeRuleType: 'basic' });
      expect(
        screen.getByText(/overtime\.rules\.table\.empty/),
      ).toBeInTheDocument();
    });

    it('should render empty message when rules is undefined', () => {
      renderComponent({ rules: undefined as any, overtimeRuleType: 'basic' });
      expect(
        screen.getByText(/overtime\.rules\.table\.empty/),
      ).toBeInTheDocument();
    });
  });

  describe('Table Rendering', () => {
    it('should render table headers', () => {
      renderComponent({ rules: BASIC_RULES, overtimeRuleType: 'basic' });

      expect(
        screen.getByText(/overtime\.rules\.table\.header\.rule/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/overtime\.rules\.table\.header\.payitem/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/overtime\.rules\.table\.header\.startsafter/),
      ).toBeInTheDocument();
    });

    it('should render correct number of rows', () => {
      renderComponent({ rules: BASIC_RULES, overtimeRuleType: 'basic' });

      const tbody = screen.getByRole('table').querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      expect(rows).toHaveLength(BASIC_RULES.length);
    });
  });

  describe('Rule Label Display', () => {
    it('should display rule labels from RULE_TYPE_TO_LABEL_ID mapping', () => {
      renderComponent({ rules: BASIC_RULES, overtimeRuleType: 'basic' });

      expect(
        screen.getByText(/overtime\.wizard\.rules\.weekly/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/overtime\.wizard\.rules\.daily(?!\.)/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/overtime\.wizard\.rules\.double_daily/),
      ).toBeInTheDocument();
    });

    it('should fall back to rule name when no labelId found', () => {
      const customRule: OvertimeRule = {
        name: 'Custom Rule Name',
        type: 'unknown_type' as any,
        frequency: 'DAILY',
        multiplier: 1.5,
        conditions: [{ field: 'threshold', value: '10' }],
      };
      renderComponent({ rules: [customRule], overtimeRuleType: 'custom' });

      expect(screen.getByText('Custom Rule Name')).toBeInTheDocument();
    });
  });

  describe('Pay Item Label Display', () => {
    it('should display "Double overtime pay" for double_daily rules', () => {
      const doubleRule = BASIC_RULES.find((r) => r.type === 'double_daily');
      renderComponent({ rules: [doubleRule!], overtimeRuleType: 'basic' });

      expect(
        screen.getByText(/overtime\.rules\.table\.payitem\.double_overtime/),
      ).toBeInTheDocument();
    });

    it('should display "Double overtime pay" for consecutive_double_daily rules', () => {
      const consecutiveDoubleRule = CALIFORNIA_RULES.find(
        (r) => r.type === 'consecutive_double_daily',
      );
      renderComponent({
        rules: [consecutiveDoubleRule!],
        overtimeRuleType: 'california',
      });

      expect(
        screen.getByText(/overtime\.rules\.table\.payitem\.double_overtime/),
      ).toBeInTheDocument();
    });

    it('should display "Overtime pay" for non-double rules', () => {
      const weeklyRule = BASIC_RULES.find((r) => r.type === 'weekly');
      renderComponent({ rules: [weeklyRule!], overtimeRuleType: 'basic' });

      expect(
        screen.getByText(/overtime\.rules\.table\.payitem\.overtime(?!\.)/),
      ).toBeInTheDocument();
    });
  });

  describe('Threshold Formatting', () => {
    it('should display threshold with hrs/week for WEEKLY frequency', () => {
      const weeklyRule = BASIC_RULES.find((r) => r.type === 'weekly');
      renderComponent({ rules: [weeklyRule!], overtimeRuleType: 'basic' });

      expect(
        screen.getByText(/40.*overtime\.rules\.table\.unit\.week/),
      ).toBeInTheDocument();
    });

    it('should display threshold with hrs/day for DAILY frequency', () => {
      const dailyRule = BASIC_RULES.find((r) => r.type === 'daily');
      renderComponent({ rules: [dailyRule!], overtimeRuleType: 'basic' });

      expect(
        screen.getByText(/8.*overtime\.rules\.table\.unit\.day/),
      ).toBeInTheDocument();
    });

    it('should display dash when threshold is missing', () => {
      const ruleWithoutThreshold: OvertimeRule = {
        name: 'No Threshold Rule',
        type: 'weekly',
        frequency: 'WEEKLY',
        multiplier: 1.5,
        conditions: [],
      };
      renderComponent({
        rules: [ruleWithoutThreshold],
        overtimeRuleType: 'basic',
      });

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('California Rules', () => {
    it('should render all California overtime rules', () => {
      renderComponent({
        rules: CALIFORNIA_RULES,
        overtimeRuleType: 'california',
      });

      const tbody = screen.getByRole('table').querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      expect(rows).toHaveLength(CALIFORNIA_RULES.length);

      expect(
        screen.getByText(/overtime\.wizard\.rules\.consecutive_daily(?!\.)/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/overtime\.wizard\.rules\.consecutive_double_daily/),
      ).toBeInTheDocument();
    });
  });
});
