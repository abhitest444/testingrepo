import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import ReviewStep from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/ReviewStep';
import {
  WizardStepId,
  OvertimeRule,
  OvertimeRuleType,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/types';

// Mock IDS components
jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children, variant, weight }: any) => (
    <span data-variant={variant} data-weight={weight}>
      {children}
    </span>
  ),
}));

jest.mock('@design-systems/icons', () => ({
  Edit: () => <span data-testid="edit-icon">Edit</span>,
}));

// Mock OvertimeRulesTable
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRulesTable',
  () => ({
    __esModule: true,
    default: ({ rules }: any) => (
      <div data-testid="overtime-rules-table">
        <span data-testid="rules-count">{rules?.length || 0}</span>
      </div>
    ),
  }),
);

// Mock useWizardPolicyWorkerCount hook
const mockUseWizardPolicyWorkerCount = jest.fn();
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useWizardPolicyWorkerCount',
  () => ({
    __esModule: true,
    useWizardPolicyWorkerCount: () => mockUseWizardPolicyWorkerCount(),
  }),
);

describe('ReviewStep', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnEditStep = jest.fn();
  let store: ReturnType<typeof createQbtOrchestratorStore>;

  const mockRules: OvertimeRule[] = [
    {
      name: 'Weekly Overtime',
      type: 'weekly',
      frequency: 'WEEKLY',
      multiplier: 1.5,
      conditions: [{ field: 'threshold', value: '40' }],
      enabled: true,
    },
  ];

  const defaultProps = {
    policyName: 'Test Policy',
    isBasicPolicy: false,
    isDefault: false,
    overtimeRuleType: 'basic' as OvertimeRuleType,
    rules: mockRules,
    onEditStep: mockOnEditStep,
  };

  // Default mock return value for useWizardPolicyWorkerCount
  const defaultHookResult = {
    totalWorkerCount: 5,
    companyTotalWorkerCount: 50,
    isCompanyWide: false,
    hasNoAssignments: false,
    loading: false,
    error: null,
    isDirty: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    store = createQbtOrchestratorStore();
    // Reset hook mock to default values
    mockUseWizardPolicyWorkerCount.mockReturnValue(defaultHookResult);
  });

  const renderComponent = (props = {}) =>
    renderWithQuicksandReduxAndLogging(
      <ReviewStep {...defaultProps} {...props} />,
      store,
      mockSandbox,
    );

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render policy name section header', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.review.section.details/i),
      ).toBeInTheDocument();
    });

    it('should render overtime rules section header', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.review.section.rules/i),
      ).toBeInTheDocument();
    });

    it('should render policy members section header', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.review.section.members/i),
      ).toBeInTheDocument();
    });

    it('should display the policy name', () => {
      renderComponent();
      expect(screen.getByText('Test Policy')).toBeInTheDocument();
    });

    it('should render OvertimeRulesTable with correct props', () => {
      renderComponent();
      expect(screen.getByTestId('overtime-rules-table')).toBeInTheDocument();
      expect(screen.getByTestId('rules-count')).toHaveTextContent('1');
    });
  });

  describe('Edit Buttons', () => {
    it('should render edit icons when onEditStep is provided', () => {
      renderComponent();
      const editIcons = screen.getAllByTestId('edit-icon');
      expect(editIcons.length).toBe(3);
    });

    it('should not render edit icons when onEditStep is not provided', () => {
      renderComponent({ onEditStep: undefined });
      expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument();
    });

    it('should call onEditStep with POLICY_NAME when clicking policy details edit', () => {
      renderComponent();
      const editDetailsButton = screen.getByRole('button', {
        name: /NLS overtime.wizard.review.edit.details/i,
      });
      fireEvent.click(editDetailsButton);
      expect(mockOnEditStep).toHaveBeenCalledWith(WizardStepId.POLICY_NAME);
    });

    it('should call onEditStep with OVERTIME_RULES when clicking rules edit', () => {
      renderComponent();
      const editRulesButton = screen.getByRole('button', {
        name: /NLS overtime.wizard.review.edit.rules/i,
      });
      fireEvent.click(editRulesButton);
      expect(mockOnEditStep).toHaveBeenCalledWith(WizardStepId.OVERTIME_RULES);
    });

    it('should call onEditStep with POLICY_MEMBERS when clicking members edit', () => {
      renderComponent();
      const editMembersButton = screen.getByRole('button', {
        name: /NLS overtime.wizard.review.edit.members/i,
      });
      fireEvent.click(editMembersButton);
      expect(mockOnEditStep).toHaveBeenCalledWith(WizardStepId.POLICY_MEMBERS);
    });
  });

  describe('Default Policy Text', () => {
    it('should display "Yes" message when isDefault is true', () => {
      renderComponent({ isDefault: true });
      expect(
        screen.getByText(/NLS overtime.wizard.review.default.yes/i),
      ).toBeInTheDocument();
    });

    it('should display "No" message when isDefault is false', () => {
      renderComponent({ isDefault: false });
      expect(
        screen.getByText(/NLS overtime.wizard.review.default.no/i),
      ).toBeInTheDocument();
    });
  });

  describe('Policy Name Display', () => {
    it('should display dash when policy name is empty', () => {
      renderComponent({ policyName: '' });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should display the actual policy name when provided', () => {
      renderComponent({ policyName: 'Custom Policy Name' });
      expect(screen.getByText('Custom Policy Name')).toBeInTheDocument();
    });
  });

  describe('Policy Members Display', () => {
    it('should display worker count from hook', () => {
      mockUseWizardPolicyWorkerCount.mockReturnValue({
        ...defaultHookResult,
        totalWorkerCount: 10,
        companyTotalWorkerCount: 50,
      });
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.review.members.count/i),
      ).toBeInTheDocument();
    });

    it('should display loading state', () => {
      mockUseWizardPolicyWorkerCount.mockReturnValue({
        ...defaultHookResult,
        loading: true,
      });
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.review.members.loading/i),
      ).toBeInTheDocument();
    });

    it('should display error message when worker count fails', () => {
      mockUseWizardPolicyWorkerCount.mockReturnValue({
        ...defaultHookResult,
        error: 'Failed to fetch worker count',
      });
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.review.members.error/i),
      ).toBeInTheDocument();
    });

    it('should display "All workers" when isCompanyWide is true', () => {
      mockUseWizardPolicyWorkerCount.mockReturnValue({
        ...defaultHookResult,
        isCompanyWide: true,
      });
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.review.members.allWorkers/i),
      ).toBeInTheDocument();
    });

    it('should display "No workers assigned" when hasNoAssignments is true', () => {
      mockUseWizardPolicyWorkerCount.mockReturnValue({
        ...defaultHookResult,
        totalWorkerCount: 0,
        hasNoAssignments: true,
      });
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.review.members.noWorkers/i),
      ).toBeInTheDocument();
    });
  });

  describe('Rules Display', () => {
    it('should render OvertimeRulesTable with empty rules array', () => {
      renderComponent({ rules: [] });
      expect(screen.getByTestId('rules-count')).toHaveTextContent('0');
    });

    it('should render OvertimeRulesTable with multiple rules', () => {
      const multipleRules: OvertimeRule[] = [
        ...mockRules,
        {
          name: 'Daily Overtime',
          type: 'daily',
          frequency: 'DAILY',
          multiplier: 1.5,
          conditions: [{ field: 'threshold', value: '8' }],
          enabled: true,
        },
      ];
      renderComponent({ rules: multipleRules });
      expect(screen.getByTestId('rules-count')).toHaveTextContent('2');
    });
  });

  describe('Basic Policy Behavior', () => {
    it('should not render edit members button when isBasicPolicy is true', () => {
      renderComponent({ isBasicPolicy: true });
      expect(
        screen.queryByRole('button', {
          name: /NLS overtime.wizard.review.edit.members/i,
        }),
      ).not.toBeInTheDocument();
    });

    it('should render edit members button when isBasicPolicy is false', () => {
      renderComponent({ isBasicPolicy: false });
      expect(
        screen.getByRole('button', {
          name: /NLS overtime.wizard.review.edit.members/i,
        }),
      ).toBeInTheDocument();
    });

    it('should not render edit members button when isDefault is true', () => {
      renderComponent({ isDefault: true });
      expect(
        screen.queryByRole('button', {
          name: /NLS overtime.wizard.review.edit.members/i,
        }),
      ).not.toBeInTheDocument();
    });

    it('should not render edit members button when both isBasicPolicy and isDefault are true', () => {
      renderComponent({ isBasicPolicy: true, isDefault: true });
      expect(
        screen.queryByRole('button', {
          name: /NLS overtime.wizard.review.edit.members/i,
        }),
      ).not.toBeInTheDocument();
    });

    it('should render edit members button only when isBasicPolicy is false and isDefault is false', () => {
      renderComponent({ isBasicPolicy: false, isDefault: false });
      expect(
        screen.getByRole('button', {
          name: /NLS overtime.wizard.review.edit.members/i,
        }),
      ).toBeInTheDocument();
    });

    it('should hide policy details edit button and still render rules edit button when isBasicPolicy is true', () => {
      renderComponent({ isBasicPolicy: true });
      // Policy details edit button should be hidden for basic policies
      expect(
        screen.queryByRole('button', {
          name: /NLS overtime.wizard.review.edit.details/i,
        }),
      ).not.toBeInTheDocument();
      // Rules edit button should still be visible
      expect(
        screen.getByRole('button', {
          name: /NLS overtime.wizard.review.edit.rules/i,
        }),
      ).toBeInTheDocument();
    });
  });
});
