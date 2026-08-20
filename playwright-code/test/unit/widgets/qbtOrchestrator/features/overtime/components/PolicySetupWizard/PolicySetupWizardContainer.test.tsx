import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import PolicySetupWizardContainer from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/PolicySetupWizardContainer';
import {
  WizardStepId,
  setPolicyName,
  setPolicyIsDefault,
  setWizardCurrentStep,
  setOvertimeRuleType,
  setPolicyMemberIds,
  setInitialMemberIds,
  initializeWizardForEdit,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/store';

// Mock useTracking to allow tracking code to execute without errors
const mockTrack = jest.fn();
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    useTracking: () => mockTrack,
  };
});

// Mock IDS components
jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
    priority,
    purpose,
    theme,
    size,
    'data-testid': testId,
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      data-priority={priority}
      data-purpose={purpose}
      data-theme={theme}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children, variant, weight }: any) => (
    <span data-variant={variant} data-weight={weight}>
      {children}
    </span>
  ),
}));

// Mock child components
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/PolicyNameStep',
  () => ({
    __esModule: true,
    default: ({
      name,
      isBasicPolicy,
      isDefault,
      isEditMode,
      onNameChange,
      onDefaultChange,
    }: any) => (
      <div data-testid="policy-name-step">
        <input
          data-testid="mock-name-input"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <input
          data-testid="mock-default-checkbox"
          type="checkbox"
          checked={isDefault}
          disabled={isBasicPolicy && isEditMode}
          onChange={() => onDefaultChange(!isDefault)}
        />
        <span data-testid="mock-is-basic-policy">
          {isBasicPolicy ? 'true' : 'false'}
        </span>
        <span data-testid="mock-is-edit-mode">
          {isEditMode ? 'true' : 'false'}
        </span>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/PolicyMembersStep',
  () => ({
    __esModule: true,
    default: () => <div data-testid="policy-members-step" />,
  }),
);

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/ReviewStep',
  () => ({
    __esModule: true,
    default: ({ isBasicPolicy, onEditStep }: any) => (
      <div data-testid="review-step">
        <span data-testid="review-is-basic-policy">
          {isBasicPolicy ? 'true' : 'false'}
        </span>
        <button
          data-testid="mock-edit-policy-name"
          onClick={() => onEditStep?.(1)}
        >
          Edit Policy Name
        </button>
        <button
          data-testid="mock-edit-overtime-rules"
          onClick={() => onEditStep?.(2)}
        >
          Edit Overtime Rules
        </button>
        <button
          data-testid="mock-edit-policy-members"
          onClick={() => onEditStep?.(3)}
        >
          Edit Policy Members
        </button>
        <button
          data-testid="mock-edit-invalid-step"
          onClick={() => onEditStep?.(999)}
        >
          Edit Invalid Step
        </button>
      </div>
    ),
  }),
);

// Mock OvertimeRulesStep as a proper React component to avoid hook errors
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRulesStep',
  () => {
    const MockOvertimeRulesStep = ({
      selectedRuleType,
      onRuleTypeChange,
      onRulesChange,
      onValidationChange,
    }: any) => {
      React.useEffect(() => {
        onValidationChange?.(Boolean(selectedRuleType));
      }, [onValidationChange, selectedRuleType]);
      return (
        <div data-testid="overtime-rules-step">
          <button
            data-testid="mock-rules-change"
            onClick={() => onRulesChange([{ type: 'weekly' }])}
          >
            Change rules
          </button>
          <select
            data-testid="mock-rules-dropdown"
            value={selectedRuleType}
            onChange={(e) => onRuleTypeChange(e.target.value)}
          >
            <option value="">Select</option>
            <option value="basic">Basic</option>
            <option value="california">California</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      );
    };
    return {
      __esModule: true,
      default: MockOvertimeRulesStep,
    };
  },
);

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/WizardStepIndicator',
  () => ({
    __esModule: true,
    default: ({ steps, currentStep, title }: any) => (
      <div data-testid="wizard-step-indicator">
        <span data-testid="wizard-title">{title}</span>
        <span data-testid="current-step">{currentStep}</span>
        <span data-testid="steps-count">{steps.length}</span>
      </div>
    ),
  }),
);

describe('PolicySetupWizardContainer', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnCancel = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnEditStep = jest.fn();
  let store: ReturnType<typeof createQbtOrchestratorStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createQbtOrchestratorStore();
  });

  const renderComponent = (props = {}) =>
    renderWithQuicksandReduxAndLogging(
      <PolicySetupWizardContainer
        onCancel={mockOnCancel}
        onBack={mockOnBack}
        onNext={mockOnNext}
        onEditStep={mockOnEditStep}
        {...props}
      />,
      store,
      mockSandbox,
    );

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render the wizard container', () => {
      renderComponent();
      expect(screen.getByTestId('policy-setup-wizard')).toBeInTheDocument();
    });

    it('should render the Cancel button', () => {
      renderComponent();
      expect(screen.getByTestId('wizard-cancel-button')).toBeInTheDocument();
    });

    it('should render the Next button', () => {
      renderComponent();
      expect(screen.getByTestId('wizard-next-button')).toBeInTheDocument();
    });

    it('should render the WizardStepIndicator', () => {
      renderComponent();
      expect(screen.getByTestId('wizard-step-indicator')).toBeInTheDocument();
    });

    it('should render the wizard title', () => {
      renderComponent();
      expect(screen.getByTestId('wizard-title')).toHaveTextContent(
        /NLS overtime.wizard.menu.title/i,
      );
    });
  });

  describe('Step Rendering', () => {
    it('should render PolicyNameStep when on step 1', () => {
      renderComponent();
      expect(screen.getByTestId('policy-name-step')).toBeInTheDocument();
    });

    it('should pass 4 steps to WizardStepIndicator', () => {
      renderComponent();
      expect(screen.getByTestId('steps-count')).toHaveTextContent('4');
    });

    it('should show current step as 1 initially', () => {
      renderComponent();
      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    });
  });

  describe('Button Actions', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      renderComponent();
      const cancelButton = screen.getByTestId('wizard-cancel-button');

      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Next button is clicked', () => {
      // Set a policy name to enable the Next button
      store.dispatch(setPolicyName('Test Policy'));
      renderComponent();
      const nextButton = screen.getByTestId('wizard-next-button');

      fireEvent.click(nextButton);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('should call onBack when Back button is clicked on step 2', () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
      renderComponent();
      const backButton = screen.getByTestId('wizard-back-button');

      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should render Cancel button with tertiary priority', () => {
      renderComponent();
      const cancelButton = screen.getByTestId('wizard-cancel-button');
      expect(cancelButton).toHaveAttribute('data-priority', 'tertiary');
    });

    it('should render Next button with primary priority', () => {
      renderComponent();
      const nextButton = screen.getByTestId('wizard-next-button');
      expect(nextButton).toHaveAttribute('data-priority', 'primary');
    });
  });

  describe('Redux Integration', () => {
    it('should dispatch setPolicyName when name changes', async () => {
      renderComponent();
      const nameInput = screen.getByTestId('mock-name-input');

      fireEvent.change(nameInput, { target: { value: 'New Policy Name' } });

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.policyFormData.name).toBe('New Policy Name');
      });
    });

    it('should dispatch setPolicyIsDefault when checkbox changes', async () => {
      renderComponent();
      const checkbox = screen.getByTestId('mock-default-checkbox');

      fireEvent.click(checkbox);

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.policyFormData.isDefault).toBe(true);
      });
    });

    it('should read initial policy name from Redux store', async () => {
      store.dispatch(setPolicyName('Redux Policy Name'));
      renderComponent();

      const nameInput = screen.getByTestId(
        'mock-name-input',
      ) as HTMLInputElement;
      expect(nameInput.value).toBe('Redux Policy Name');
    });

    it('should read initial isDefault from Redux store', async () => {
      store.dispatch(setPolicyIsDefault(true));
      renderComponent();

      const checkbox = screen.getByTestId(
        'mock-default-checkbox',
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Step Navigation', () => {
    it('should not render PolicyNameStep when on step 2', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
      renderComponent();

      expect(screen.queryByTestId('policy-name-step')).not.toBeInTheDocument();
    });

    it('should render OvertimeRulesStep when on step 2', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
      renderComponent();

      expect(screen.getByTestId('overtime-rules-step')).toBeInTheDocument();
    });

    it('should not render OvertimeRulesStep when on step 1', () => {
      renderComponent();

      expect(
        screen.queryByTestId('overtime-rules-step'),
      ).not.toBeInTheDocument();
    });

    it('should update current step in WizardStepIndicator when step changes', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
      renderComponent();

      expect(screen.getByTestId('current-step')).toHaveTextContent('2');
    });

    it('should show step 3 when on POLICY_MEMBERS step', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
      renderComponent();

      expect(screen.getByTestId('current-step')).toHaveTextContent('3');
    });

    it('should show step 4 when on REVIEW step', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
      renderComponent();

      expect(screen.getByTestId('current-step')).toHaveTextContent('4');
    });
  });

  describe('Step 2 - Overtime Rules Redux Integration', () => {
    it('should dispatch setOvertimeRuleType when rule type changes', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
      renderComponent();
      const dropdown = screen.getByTestId('mock-rules-dropdown');

      fireEvent.change(dropdown, { target: { value: 'basic' } });

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.policyFormData.overtimeRuleType).toBe('basic');
      });
    });

    it('should dispatch setOvertimeRuleType with custom value', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
      renderComponent();
      const dropdown = screen.getByTestId('mock-rules-dropdown');

      fireEvent.change(dropdown, { target: { value: 'custom' } });

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.policyFormData.overtimeRuleType).toBe('custom');
      });
    });

    it('should read initial overtimeRuleType from Redux store', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
      store.dispatch(setOvertimeRuleType('basic'));
      renderComponent();

      const dropdown = screen.getByTestId(
        'mock-rules-dropdown',
      ) as HTMLSelectElement;
      expect(dropdown.value).toBe('basic');
    });

    it('should dispatch setOvertimeRules when rules change', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
      renderComponent();
      fireEvent.click(screen.getByTestId('mock-rules-change'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.policyFormData.rules).toHaveLength(1);
      });
    });

    it('should disable next button when overtime rules are invalid', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
      renderComponent();
      expect(screen.getByTestId('wizard-next-button')).toBeDisabled();
    });

    it('should enable next button when overtime rules become valid', async () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
      renderComponent();
      fireEvent.change(screen.getByTestId('mock-rules-dropdown'), {
        target: { value: 'basic' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('wizard-next-button')).not.toBeDisabled();
      });
    });
  });

  describe('Step 3 - Policy Members Step Validation', () => {
    it('should disable the button in create mode when no members are selected', () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
      renderComponent();
      expect(screen.getByTestId('wizard-next-button')).toBeDisabled();
    });

    it('should enable the button in create mode when members are selected', () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
      store.dispatch(setPolicyMemberIds(['worker-1', 'worker-2']));
      renderComponent();
      expect(screen.getByTestId('wizard-next-button')).not.toBeDisabled();
    });

    it('should disable the button in edit mode when selection has not changed from initial', () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
      store.dispatch(setInitialMemberIds(['worker-1', 'worker-2']));
      store.dispatch(setPolicyMemberIds(['worker-1', 'worker-2']));
      renderComponent({ isEditMode: true });
      expect(screen.getByTestId('wizard-next-button')).toBeDisabled();
    });

    it('should enable the button in edit mode when all workers are unselected (changed from initial)', () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
      store.dispatch(setInitialMemberIds(['worker-1', 'worker-2']));
      store.dispatch(setPolicyMemberIds([]));
      renderComponent({ isEditMode: true });
      expect(screen.getByTestId('wizard-next-button')).not.toBeDisabled();
    });

    it('should enable the button in edit mode when a worker is added to the selection', () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
      store.dispatch(setInitialMemberIds(['worker-1']));
      store.dispatch(setPolicyMemberIds(['worker-1', 'worker-2']));
      renderComponent({ isEditMode: true });
      expect(screen.getByTestId('wizard-next-button')).not.toBeDisabled();
    });

    it('should enable the button in edit mode when a worker is removed from the selection', () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
      store.dispatch(setInitialMemberIds(['worker-1', 'worker-2']));
      store.dispatch(setPolicyMemberIds(['worker-1']));
      renderComponent({ isEditMode: true });
      expect(screen.getByTestId('wizard-next-button')).not.toBeDisabled();
    });

    it('should disable the button in edit mode when initially empty and still empty', () => {
      store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
      store.dispatch(setInitialMemberIds([]));
      store.dispatch(setPolicyMemberIds([]));
      renderComponent({ isEditMode: true });
      expect(screen.getByTestId('wizard-next-button')).toBeDisabled();
    });
  });

  describe('Button Labels', () => {
    it('should render Cancel button with correct label', () => {
      renderComponent();
      expect(screen.getByTestId('wizard-cancel-button')).toHaveTextContent(
        /NLS overtime.wizard.button.cancel/i,
      );
    });

    it('should render Next button with correct label', () => {
      renderComponent();
      expect(screen.getByTestId('wizard-next-button')).toHaveTextContent(
        /NLS overtime.wizard.button.next/i,
      );
    });
  });

  describe('Action Button Labels for Different Flows', () => {
    // Helper to setup wizard in edit mode with specific startStep
    const setupEditWizard = (
      startStep: WizardStepId,
      currentStep?: WizardStepId,
    ) => {
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'policy-123',
          name: 'Test Policy',
          description: 'Test Description',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: [],
          startStep,
          origin: 'policyDetails',
        }),
      );
      if (currentStep && currentStep !== startStep) {
        store.dispatch(setWizardCurrentStep(currentStep));
      }
    };

    // Helper to render with edit mode enabled
    const renderEditModeComponent = () => renderComponent({ isEditMode: true });

    describe('Flow 1: Create Policy Flow', () => {
      it('should show "Next" button on step 1 (Policy Name)', () => {
        renderComponent();
        expect(screen.getByTestId('wizard-next-button')).toHaveTextContent(
          /NLS overtime.wizard.button.next/i,
        );
      });

      it('should show "Next" button on step 2 (Overtime Rules)', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        store.dispatch(setOvertimeRuleType('basic'));
        renderComponent();
        expect(screen.getByTestId('wizard-next-button')).toHaveTextContent(
          /NLS overtime.wizard.button.next/i,
        );
      });

      it('should show "Create policy" button on REVIEW step in create mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();
        expect(screen.getByTestId('wizard-submit-button')).toHaveTextContent(
          /NLS overtime.wizard.button.submit/i,
        );
      });
    });

    describe('Flow 2: View Review (Edit from Policy Details)', () => {
      it('should show "Close" button when startStep=REVIEW and currentStep=REVIEW', () => {
        setupEditWizard(WizardStepId.REVIEW, WizardStepId.REVIEW);
        renderEditModeComponent();
        expect(screen.getByTestId('wizard-submit-button')).toHaveTextContent(
          /NLS overtime.wizard.button.close/i,
        );
      });
    });

    describe('Flow 3: Assign Workers Flow', () => {
      it('should show "Save" button when startStep=POLICY_MEMBERS', () => {
        setupEditWizard(WizardStepId.POLICY_MEMBERS);
        renderEditModeComponent();
        expect(screen.getByTestId('wizard-next-button')).toHaveTextContent(
          /NLS overtime.wizard.button.save/i,
        );
      });
    });

    describe('Flow 4: Edit Policy Name from Review', () => {
      it('should show "Save" button when startStep=REVIEW and currentStep=POLICY_NAME', () => {
        setupEditWizard(WizardStepId.REVIEW, WizardStepId.POLICY_NAME);
        renderEditModeComponent();
        expect(screen.getByTestId('wizard-next-button')).toHaveTextContent(
          /NLS overtime.wizard.button.save/i,
        );
      });
    });

    describe('Flow 5: Edit Policy Rules from Review', () => {
      it('should show "Save" button when startStep=REVIEW and currentStep=OVERTIME_RULES', () => {
        setupEditWizard(WizardStepId.REVIEW, WizardStepId.OVERTIME_RULES);
        renderEditModeComponent();
        expect(screen.getByTestId('wizard-next-button')).toHaveTextContent(
          /NLS overtime.wizard.button.save/i,
        );
      });
    });

    describe('Flow 6: Edit Policy Members from Review', () => {
      it('should show "Save" button when startStep=REVIEW and currentStep=POLICY_MEMBERS', () => {
        setupEditWizard(WizardStepId.REVIEW, WizardStepId.POLICY_MEMBERS);
        renderEditModeComponent();
        expect(screen.getByTestId('wizard-next-button')).toHaveTextContent(
          /NLS overtime.wizard.button.save/i,
        );
      });
    });
  });

  describe('Tracking Code Coverage', () => {
    // These tests ensure tracking code paths are exercised for coverage
    // The actual tracking assertions are handled by the sandbox mock

    describe('Cancel Handler Coverage', () => {
      it('should execute cancel tracking in create mode', () => {
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-cancel-button'));
        expect(mockOnCancel).toHaveBeenCalled();
      });

      it('should execute cancel tracking in edit mode', () => {
        renderComponent({ isEditMode: true });
        fireEvent.click(screen.getByTestId('wizard-cancel-button'));
        expect(mockOnCancel).toHaveBeenCalled();
      });
    });

    describe('Back Handler Coverage - All Rule Types', () => {
      it('should execute back tracking with basic rules', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        store.dispatch(setOvertimeRuleType('basic'));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-back-button'));
        expect(mockOnBack).toHaveBeenCalled();
      });

      it('should execute back tracking with california rules', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        store.dispatch(setOvertimeRuleType('california'));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-back-button'));
        expect(mockOnBack).toHaveBeenCalled();
      });

      it('should execute back tracking with custom rules', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        store.dispatch(setOvertimeRuleType('custom'));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-back-button'));
        expect(mockOnBack).toHaveBeenCalled();
      });

      it('should execute back tracking on policy members step', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-back-button'));
        expect(mockOnBack).toHaveBeenCalled();
      });

      it('should execute back tracking on review step', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-back-button'));
        expect(mockOnBack).toHaveBeenCalled();
      });

      it('should execute back tracking in edit mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        renderComponent({ isEditMode: true });
        fireEvent.click(screen.getByTestId('wizard-back-button'));
        expect(mockOnBack).toHaveBeenCalled();
      });
    });

    describe('Next Handler Coverage - All Rule Types', () => {
      it('should execute next tracking on policy name step', () => {
        store.dispatch(setPolicyName('Test Policy'));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-next-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });

      it('should execute next tracking with basic rules', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        store.dispatch(setOvertimeRuleType('basic'));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-next-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });

      it('should execute next tracking with california rules', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        store.dispatch(setOvertimeRuleType('california'));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-next-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });

      it('should execute next tracking with custom rules', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        store.dispatch(setOvertimeRuleType('custom'));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-next-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });

      it('should execute assign tracking on policy members step', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
        store.dispatch(setPolicyMemberIds(['worker-1']));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-next-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });

      it('should execute create policy tracking on review step', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();
        fireEvent.click(screen.getByTestId('wizard-submit-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    describe('Edit Mode Next Handler Coverage', () => {
      it('should execute save tracking on policy name step in edit mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_NAME));
        store.dispatch(setPolicyName('Updated Policy'));
        renderComponent({ isEditMode: true });
        fireEvent.click(screen.getByTestId('wizard-next-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });

      it('should execute save tracking with basic rules in edit mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        store.dispatch(setOvertimeRuleType('basic'));
        renderComponent({ isEditMode: true });
        fireEvent.click(screen.getByTestId('wizard-next-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });

      it('should execute save tracking with california rules in edit mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        store.dispatch(setOvertimeRuleType('california'));
        renderComponent({ isEditMode: true });
        fireEvent.click(screen.getByTestId('wizard-next-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });

      it('should execute save tracking with custom rules in edit mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.OVERTIME_RULES));
        store.dispatch(setOvertimeRuleType('custom'));
        renderComponent({ isEditMode: true });
        fireEvent.click(screen.getByTestId('wizard-next-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });

      it('should execute save tracking on policy members step in edit mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.POLICY_MEMBERS));
        store.dispatch(setInitialMemberIds(['worker-1']));
        store.dispatch(setPolicyMemberIds(['worker-1', 'worker-2']));
        renderComponent({ isEditMode: true });
        fireEvent.click(screen.getByTestId('wizard-next-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });

      it('should execute close tracking on review step in edit mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent({ isEditMode: true });
        fireEvent.click(screen.getByTestId('wizard-submit-button'));
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    describe('Edit Mode with Different Start Steps', () => {
      it('should render in edit mode starting from policy name step', () => {
        store.dispatch(
          initializeWizardForEdit({
            policyId: 'policy-123',
            name: 'Test Policy',
            description: '',
            isDefault: false,
            rules: [],
            ruleType: 'basic',
            memberIds: [],
            startStep: WizardStepId.POLICY_NAME,
            origin: 'policyDetails',
          }),
        );
        renderComponent({ isEditMode: true });
        expect(screen.getByTestId('policy-setup-wizard')).toBeInTheDocument();
      });

      it('should render in edit mode starting from overtime rules step', () => {
        store.dispatch(
          initializeWizardForEdit({
            policyId: 'policy-123',
            name: 'Test Policy',
            description: '',
            isDefault: false,
            rules: [],
            ruleType: 'california',
            memberIds: [],
            startStep: WizardStepId.OVERTIME_RULES,
            origin: 'policyDetails',
          }),
        );
        renderComponent({ isEditMode: true });
        expect(screen.getByTestId('policy-setup-wizard')).toBeInTheDocument();
      });

      it('should render in edit mode with custom rule type', () => {
        store.dispatch(
          initializeWizardForEdit({
            policyId: 'policy-123',
            name: 'Test Policy',
            description: '',
            isDefault: false,
            rules: [],
            ruleType: 'custom',
            memberIds: [],
            startStep: WizardStepId.OVERTIME_RULES,
            origin: 'policyDetails',
          }),
        );
        renderComponent({ isEditMode: true });
        expect(screen.getByTestId('policy-setup-wizard')).toBeInTheDocument();
      });
    });

    describe('Edit Step Handler - Review Page Edit Buttons', () => {
      it('should handle edit policy details in create mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();

        fireEvent.click(screen.getByTestId('mock-edit-policy-name'));
        expect(mockOnEditStep).toHaveBeenCalledWith(WizardStepId.POLICY_NAME);
      });

      it('should handle edit overtime rules in create mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();

        fireEvent.click(screen.getByTestId('mock-edit-overtime-rules'));
        expect(mockOnEditStep).toHaveBeenCalledWith(
          WizardStepId.OVERTIME_RULES,
        );
      });

      it('should handle edit policy members in create mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();

        fireEvent.click(screen.getByTestId('mock-edit-policy-members'));
        expect(mockOnEditStep).toHaveBeenCalledWith(
          WizardStepId.POLICY_MEMBERS,
        );
      });

      it('should handle edit policy details in edit mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent({ isEditMode: true });

        fireEvent.click(screen.getByTestId('mock-edit-policy-name'));
        expect(mockOnEditStep).toHaveBeenCalledWith(WizardStepId.POLICY_NAME);
      });

      it('should handle edit overtime rules in edit mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent({ isEditMode: true });

        fireEvent.click(screen.getByTestId('mock-edit-overtime-rules'));
        expect(mockOnEditStep).toHaveBeenCalledWith(
          WizardStepId.OVERTIME_RULES,
        );
      });

      it('should handle edit policy members in edit mode', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent({ isEditMode: true });

        fireEvent.click(screen.getByTestId('mock-edit-policy-members'));
        expect(mockOnEditStep).toHaveBeenCalledWith(
          WizardStepId.POLICY_MEMBERS,
        );
      });
    });

    describe('Edge Cases for Coverage', () => {
      it('should handle basic policy editing with filtered rule types', () => {
        store.dispatch(
          initializeWizardForEdit({
            policyId: 'basic_policy_123',
            name: 'Basic Policy',
            description: '',
            isDefault: false,
            rules: [],
            ruleType: 'basic',
            memberIds: [],
            startStep: WizardStepId.POLICY_NAME,
            origin: 'policyDetails',
          }),
        );
        renderComponent({ isEditMode: true });
        expect(screen.getByTestId('policy-setup-wizard')).toBeInTheDocument();
      });

      it('should handle step validation default case', () => {
        store.dispatch(setWizardCurrentStep(999 as any)); // Invalid step
        renderComponent();
        expect(screen.getByTestId('policy-setup-wizard')).toBeInTheDocument();
      });

      it('should handle edit step with invalid step id in edit mode (default case)', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent({ isEditMode: true });

        fireEvent.click(screen.getByTestId('mock-edit-invalid-step'));
        expect(mockOnEditStep).toHaveBeenCalledWith(999);
      });

      it('should handle edit step with invalid step id in create mode (default case)', () => {
        store.dispatch(setWizardCurrentStep(WizardStepId.REVIEW));
        renderComponent();

        fireEvent.click(screen.getByTestId('mock-edit-invalid-step'));
        expect(mockOnEditStep).toHaveBeenCalledWith(999);
      });
    });
  });

  describe('Basic Policy Behavior', () => {
    it('should pass isBasicPolicy=true to PolicyNameStep for basic policy', () => {
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'basic',
          name: 'Basic Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: [],
          startStep: WizardStepId.POLICY_NAME,
          origin: 'policyDetails',
        }),
      );
      renderComponent({ isEditMode: true });
      expect(screen.getByTestId('mock-is-basic-policy')).toHaveTextContent(
        'true',
      );
    });

    it('should pass isBasicPolicy=true to PolicyNameStep for basic_policy_* prefixed policy', () => {
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'basic_policy_abc123',
          name: 'Basic Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: [],
          startStep: WizardStepId.POLICY_NAME,
          origin: 'policyDetails',
        }),
      );
      renderComponent({ isEditMode: true });
      expect(screen.getByTestId('mock-is-basic-policy')).toHaveTextContent(
        'true',
      );
    });

    it('should pass isBasicPolicy=false to PolicyNameStep for regular policy', () => {
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'policy-123',
          name: 'Regular Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'custom',
          memberIds: [],
          startStep: WizardStepId.POLICY_NAME,
          origin: 'policyDetails',
        }),
      );
      renderComponent({ isEditMode: true });
      expect(screen.getByTestId('mock-is-basic-policy')).toHaveTextContent(
        'false',
      );
    });

    it('should pass isBasicPolicy=true to ReviewStep for basic policy', () => {
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'basic_policy_abc123',
          name: 'Basic Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: [],
          startStep: WizardStepId.REVIEW,
          origin: 'policyDetails',
        }),
      );
      renderComponent({ isEditMode: true });
      expect(screen.getByTestId('review-is-basic-policy')).toHaveTextContent(
        'true',
      );
    });

    it('should skip POLICY_MEMBERS step for basic policy when calculating wizard steps', async () => {
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'basic_policy_abc123',
          name: 'Basic Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: [],
          startStep: WizardStepId.POLICY_NAME,
          origin: 'policyDetails',
        }),
      );
      renderComponent({ isEditMode: true });
      // The wizard should have 3 steps (not 4) - Policy Name, Rules, Review
      // We can verify this by checking that total steps shown is 3
      expect(screen.getByTestId('steps-count')).toHaveTextContent('3');
    });

    it('should show 4 steps for regular non-default policy', () => {
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'policy-123',
          name: 'Regular Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'custom',
          memberIds: [],
          startStep: WizardStepId.POLICY_NAME,
          origin: 'policyDetails',
        }),
      );
      renderComponent({ isEditMode: true });
      // The wizard should have 4 steps - Policy Name, Rules, Members, Review
      expect(screen.getByTestId('steps-count')).toHaveTextContent('4');
    });

    it('should disable default checkbox for basic policy in edit mode', () => {
      store.dispatch(
        initializeWizardForEdit({
          policyId: 'basic',
          name: 'Basic Policy',
          description: '',
          isDefault: false,
          rules: [],
          ruleType: 'basic',
          memberIds: [],
          startStep: WizardStepId.POLICY_NAME,
          origin: 'policyDetails',
        }),
      );
      renderComponent({ isEditMode: true });
      const checkbox = screen.getByTestId(
        'mock-default-checkbox',
      ) as HTMLInputElement;
      expect(checkbox.disabled).toBe(true);
    });
  });
});
