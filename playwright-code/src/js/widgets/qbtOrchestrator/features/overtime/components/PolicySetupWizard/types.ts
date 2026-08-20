import type {
  OvertimeRule,
  OvertimeRuleType,
  RuleTypeOption,
} from '../../types/Overtime.types';

// Re-export types from central types file
export { WizardStepId } from '../../types/Overtime.types';
export type {
  PolicyFormData,
  OvertimeRuleType,
  OvertimeRule,
  OvertimeRuleCondition,
  OvertimeRuleConditionField,
} from '../../types/Overtime.types';

export interface WizardStep {
  id: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

export interface PolicyNameStepProps {
  name: string;
  isBasicPolicy: boolean;
  isDefault: boolean;
  isEditMode?: boolean;
  onNameChange: (name: string) => void;
  onDefaultChange: (isDefault: boolean) => void;
}

export interface OvertimeRulesStepProps {
  selectedRuleType: OvertimeRuleType;
  rules: OvertimeRule[];
  onRuleTypeChange: (ruleType: OvertimeRuleType) => void;
  onRulesChange: (rules: OvertimeRule[]) => void;
  onValidationChange?: (isValid: boolean) => void;
  ruleTypeOptions?: RuleTypeOption[];
  isEditMode?: boolean;
  policyId?: string | null;
}

export interface PolicyMembersStepProps {
  /** Policy name displayed in the header */
  policyName: string;
  /** Policy ID for edit mode (presence indicates edit mode) */
  policyId?: string;
  /** Initial worker IDs for edit mode (from API) */
  initialWorkerIds?: string[];
}

export interface ReviewStepProps {
  policyName: string;
  isBasicPolicy: boolean;
  isDefault: boolean;
  overtimeRuleType: OvertimeRuleType;
  rules: OvertimeRule[];
  onEditStep?: (stepId: number) => void;
}

export interface WizardStepIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  title: string;
}

export interface PolicySetupWizardContainerProps {
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
  onEditStep: (stepId: number) => void;
  /** Whether the wizard is in edit mode (editing existing policy) */
  isEditMode?: boolean;
}
