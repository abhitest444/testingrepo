import React from 'react';
import { screen } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandProvider,
} from 'test/unit/testUtils';
import WizardStepIndicator from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/WizardStepIndicator';
import { WizardStep } from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/types';
import { WizardStepId } from 'src/js/widgets/qbtOrchestrator/features/overtime/store';

// Mock Checkmark icon
jest.mock('@design-systems/icons', () => ({
  Checkmark: () => <span data-testid="checkmark-icon" />,
}));

// Mock IDS Typography
jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children, variant, weight }: any) => (
    <span data-variant={variant} data-weight={weight}>
      {children}
    </span>
  ),
}));

describe('WizardStepIndicator', () => {
  const mockSandbox = getDefaultSandbox();

  const defaultSteps: WizardStep[] = [
    {
      id: WizardStepId.POLICY_NAME,
      label: 'Overtime policy',
      isActive: true,
      isCompleted: false,
    },
    {
      id: WizardStepId.OVERTIME_RULES,
      label: 'Overtime rules',
      isActive: false,
      isCompleted: false,
    },
    {
      id: WizardStepId.POLICY_MEMBERS,
      label: 'Policy members',
      isActive: false,
      isCompleted: false,
    },
    {
      id: WizardStepId.REVIEW,
      label: 'Review overtime policy',
      isActive: false,
      isCompleted: false,
    },
  ];

  const defaultProps = {
    steps: defaultSteps,
    currentStep: WizardStepId.POLICY_NAME,
    title: 'Set up overtime policy',
  };

  const renderComponent = (props = {}) =>
    renderWithQuicksandProvider(
      <WizardStepIndicator {...defaultProps} {...props} />,
      mockSandbox,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render the title', () => {
      renderComponent();
      expect(screen.getByText('Set up overtime policy')).toBeInTheDocument();
    });

    it('should render all step labels', () => {
      renderComponent();

      expect(screen.getByText('Overtime policy')).toBeInTheDocument();
      expect(screen.getByText('Overtime rules')).toBeInTheDocument();
      expect(screen.getByText('Policy members')).toBeInTheDocument();
      expect(screen.getByText('Review overtime policy')).toBeInTheDocument();
    });

    it('should render step numbers', () => {
      renderComponent();

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Step States', () => {
    it('should render all 4 step items when currentStep is POLICY_NAME', () => {
      renderComponent({
        currentStep: WizardStepId.POLICY_NAME,
      });

      // All 4 steps should be rendered with their labels
      expect(screen.getByText('Overtime policy')).toBeInTheDocument();
      expect(screen.getByText('Overtime rules')).toBeInTheDocument();
      expect(screen.getByText('Policy members')).toBeInTheDocument();
      expect(screen.getByText('Review overtime policy')).toBeInTheDocument();
    });
  });

  describe('Custom Title', () => {
    it('should render custom title when provided', () => {
      renderComponent({ title: 'Custom Wizard Title' });
      expect(screen.getByText('Custom Wizard Title')).toBeInTheDocument();
    });
  });

  describe('Empty Steps', () => {
    it('should render only title when steps array is empty', () => {
      renderComponent({ steps: [] });
      expect(screen.getByText('Set up overtime policy')).toBeInTheDocument();
      expect(screen.queryByText('Overtime policy')).not.toBeInTheDocument();
    });
  });

  describe('Completed Step indicator - line 32', () => {
    it('should render Checkmark for completed steps and step number for active/future steps', () => {
      // When currentStep is OVERTIME_RULES (2), step 1 (POLICY_NAME) is completed
      // isCompleted = step.id < currentStep, so step 1 < 2 → isCompleted = true → renders <Checkmark />
      renderComponent({ currentStep: WizardStepId.OVERTIME_RULES });

      // Step 1 is completed - its number should NOT be shown (Checkmark renders instead)
      // Steps 2, 3, 4 should show their numbers
      expect(screen.queryByText('1')).not.toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should render Checkmarks for all steps before currentStep', () => {
      // currentStep = REVIEW (4): steps 1, 2, 3 are all completed
      renderComponent({ currentStep: WizardStepId.REVIEW });

      expect(screen.queryByText('1')).not.toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
      expect(screen.queryByText('3')).not.toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });
});
