import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import Button from '@ids-ts/button';

import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  selectWizardCurrentStep,
  selectWizardStartStep,
  selectPolicyName,
  selectPolicyIsDefault,
  selectOvertimeRuleType,
  selectOvertimeRules,
  selectPolicyMemberIds,
  selectInitialMemberIds,
  selectEditingPolicyId,
  selectPolicyIsBasic,
  setPolicyName,
  setPolicyIsDefault,
  setOvertimeRuleType,
  setOvertimeRules,
  WizardStepId,
  selectOriginalPolicySnapshot,
} from '../../store';
import {
  WizardContainer,
  LeftSide,
  ButtonRow,
} from './styles/PolicySetupWizard.styled';
import WizardStepIndicator from './WizardStepIndicator';
import PolicyNameStep from './PolicyNameStep';
import OvertimeRulesStep from './OvertimeRulesStep';
import PolicyMembersStep from './PolicyMembersStep';
import ReviewStep from './ReviewStep';
import {
  PolicySetupWizardContainerProps,
  WizardStep,
  OvertimeRuleType,
  OvertimeRule,
} from './types';
import { RULE_TYPE_OPTIONS } from './constants/overtimeRulesConstants';
import {
  SET_OVERTIME_POLICY_TRACKING_POINTS,
  OVERTIME_RULES_TRACKING_POINTS,
  OVERTIME_RULES_BASIC_TRACKING_POINTS,
  OVERTIME_RULES_CALIFORNIA_TRACKING_POINTS,
  OVERTIME_RULES_CUSTOM_TRACKING_POINTS,
  POLICY_MEMBERS_TRACKING_POINTS,
  REVIEW_OVERTIME_POLICY_TRACKING_POINTS,
  EDIT_OVERTIME_POLICY_TRACKING_POINTS,
} from '../../constants/overtimeTrackingPoints';
import { areRulesEqual } from '../../utils/overtimeMutationUtils';
import { OVERTIME_LOGGING } from '../../constants/overtimeLoggingConstants';
import { POLICY_NAME_VALIDATION } from '../../constants/overtimeValidationConstants';

const hasSelectionChanged = (current: string[], initial: string[]): boolean => {
  if (current.length !== initial.length) return true;
  const initialSet = new Set(initial);
  return current.some((id) => !initialSet.has(id));
};

const STEP_ENTRY_LOG_MAP: Record<number, string> = {
  [WizardStepId.POLICY_NAME]: OVERTIME_LOGGING.WIZARD_STEP_1_ENTERED,
  [WizardStepId.OVERTIME_RULES]: OVERTIME_LOGGING.WIZARD_STEP_2_ENTERED,
  [WizardStepId.POLICY_MEMBERS]: OVERTIME_LOGGING.WIZARD_STEP_3_ENTERED,
  [WizardStepId.REVIEW]: OVERTIME_LOGGING.WIZARD_STEP_4_ENTERED,
};

const STEP_COMPLETE_LOG_MAP: Record<number, string> = {
  [WizardStepId.POLICY_NAME]: OVERTIME_LOGGING.WIZARD_STEP_1_COMPLETED,
  [WizardStepId.OVERTIME_RULES]: OVERTIME_LOGGING.WIZARD_STEP_2_COMPLETED,
  [WizardStepId.POLICY_MEMBERS]: OVERTIME_LOGGING.WIZARD_STEP_3_COMPLETED,
};

const PolicySetupWizardContainer: React.FC<PolicySetupWizardContainerProps> = ({
  onCancel,
  onBack,
  onNext,
  onEditStep,
  isEditMode = false,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const logger = useLoggingConfig();
  const dispatch = useAppDispatch();
  const prevStepRef = useRef<number | null>(null);

  // Redux state selectors
  const currentStep = useAppSelector(selectWizardCurrentStep);
  const wizardStartStep = useAppSelector(selectWizardStartStep);
  const policyName = useAppSelector(selectPolicyName);

  // Ref for cancel context - keeps values in sync for handleCancel callback
  const cancelContextRef = useRef({ currentStep, policyName, isEditMode });
  cancelContextRef.current = { currentStep, policyName, isEditMode };

  const policyIsDefault = useAppSelector(selectPolicyIsDefault);
  const overtimeRuleType = useAppSelector(selectOvertimeRuleType);
  const policyMemberIds = useAppSelector(selectPolicyMemberIds);
  const initialMemberIds = useAppSelector(selectInitialMemberIds);
  const overtimeRules = useAppSelector(selectOvertimeRules);
  const editingPolicyId = useAppSelector(selectEditingPolicyId);
  const originalPolicySnapshot = useAppSelector(selectOriginalPolicySnapshot);
  const isBasicPolicy = useAppSelector(selectPolicyIsBasic);

  const [isOvertimeRulesValid, setIsOvertimeRulesValid] = useState(false);

  // Log when step changes (also fires on initial mount to capture wizard open)
  useEffect(() => {
    if (prevStepRef.current === currentStep) {
      return;
    }
    prevStepRef.current = currentStep;

    const logMessage = STEP_ENTRY_LOG_MAP[currentStep];
    if (logMessage) {
      logger.info(logMessage, {
        isEditMode,
        stepId: currentStep,
      });
    }
  }, [currentStep, isEditMode, logger]);

  // Exclude 'custom' dropdown option for basic policies (basic or basic_policy_*)
  const ruleTypeOptions = useMemo(
    () =>
      isBasicPolicy
        ? RULE_TYPE_OPTIONS.filter((o) => o.value !== 'custom')
        : RULE_TYPE_OPTIONS,
    [isBasicPolicy],
  );

  // Wizard steps configuration
  const wizardSteps: WizardStep[] = useMemo(() => {
    // Base steps (always shown)
    const baseSteps: WizardStep[] = [
      {
        id: WizardStepId.POLICY_NAME,
        label: intl.formatMessage({
          id: 'overtime.wizard.step.policy',
          defaultMessage: 'Overtime policy',
        }),
        isActive: currentStep === WizardStepId.POLICY_NAME,
        isCompleted: currentStep > WizardStepId.POLICY_NAME,
      },
      {
        id: WizardStepId.OVERTIME_RULES,
        label: intl.formatMessage({
          id: 'overtime.wizard.step.rules',
          defaultMessage: 'Overtime rules',
        }),
        isActive: currentStep === WizardStepId.OVERTIME_RULES,
        isCompleted: currentStep > WizardStepId.OVERTIME_RULES,
      },
    ];

    // Conditional step (only for non-default policies)
    const policyMembersStep: WizardStep = {
      id: WizardStepId.POLICY_MEMBERS,
      label: intl.formatMessage({
        id: 'overtime.wizard.step.members',
        defaultMessage: 'Policy members',
      }),
      isActive: currentStep === WizardStepId.POLICY_MEMBERS,
      isCompleted: currentStep > WizardStepId.POLICY_MEMBERS,
    };

    // Final step (always shown)
    const reviewStep: WizardStep = {
      id: WizardStepId.REVIEW,
      label: intl.formatMessage({
        id: 'overtime.wizard.step.review',
        defaultMessage: 'Review overtime policy',
      }),
      isActive: currentStep === WizardStepId.REVIEW,
      isCompleted: currentStep > WizardStepId.REVIEW,
    };

    // Compose steps based on whether policy is default or basic
    return policyIsDefault || isBasicPolicy
      ? [...baseSteps, reviewStep]
      : [...baseSteps, policyMembersStep, reviewStep];
  }, [intl, currentStep, policyIsDefault, isBasicPolicy]);

  // Dispatch actions for form updates
  const handleNameChange = useCallback(
    (name: string) => {
      dispatch(setPolicyName(name));
    },
    [dispatch],
  );

  const handleDefaultChange = useCallback(
    (isDefault: boolean) => {
      dispatch(setPolicyIsDefault(isDefault));
    },
    [dispatch],
  );

  const handleRuleTypeChange = useCallback(
    (ruleType: string) => {
      dispatch(setOvertimeRuleType(ruleType as OvertimeRuleType));
    },
    [dispatch],
  );

  const handleOvertimeRulesChange = useCallback(
    (nextRules: OvertimeRule[]) => {
      dispatch(setOvertimeRules(nextRules));
    },
    [dispatch],
  );

  const isFirstStep = currentStep === WizardStepId.POLICY_NAME;

  // Step validation - determines if Next button should be enabled
  const isCurrentStepValid = useMemo(() => {
    switch (currentStep) {
      case WizardStepId.POLICY_NAME:
        return (
          policyName.trim().length > 0 &&
          policyName.length <= POLICY_NAME_VALIDATION.MAX_LENGTH
        );
      case WizardStepId.OVERTIME_RULES: {
        if (!isOvertimeRulesValid) return false;
        if (isEditMode && originalPolicySnapshot) {
          // In edit mode, also require rules to have actually changed.
          // Use areRulesEqual for reliable field-by-field comparison
          // (avoids JSON.stringify fragility with property order and undefined fields)
          return !areRulesEqual(originalPolicySnapshot.rules, overtimeRules);
        }
        return true;
      }
      case WizardStepId.POLICY_MEMBERS: {
        if (isEditMode) {
          return hasSelectionChanged(policyMemberIds, initialMemberIds);
        }
        return policyMemberIds.length > 0;
      }
      case WizardStepId.REVIEW:
        return true; // Review step is always valid
      default:
        return false;
    }
  }, [
    currentStep,
    policyName,
    isOvertimeRulesValid,
    overtimeRules,
    originalPolicySnapshot,
    policyMemberIds,
    isEditMode,
    initialMemberIds,
  ]);

  const getBackTrackingPointForRules = useCallback(() => {
    switch (overtimeRuleType) {
      case 'california':
        return OVERTIME_RULES_CALIFORNIA_TRACKING_POINTS.OVERTIME_RULES_CALIFORNIA_BACK;
      case 'custom':
        return OVERTIME_RULES_CUSTOM_TRACKING_POINTS.OVERTIME_RULES_CUSTOM_BACK;
      default:
        return OVERTIME_RULES_BASIC_TRACKING_POINTS.OVERTIME_RULES_BASIC_BACK;
    }
  }, [overtimeRuleType]);

  const getNextTrackingPointForRules = useCallback(() => {
    switch (overtimeRuleType) {
      case 'california':
        return OVERTIME_RULES_CALIFORNIA_TRACKING_POINTS.OVERTIME_RULES_CALIFORNIA_NEXT;
      case 'custom':
        return OVERTIME_RULES_CUSTOM_TRACKING_POINTS.OVERTIME_RULES_CUSTOM_NEXT;
      default:
        return OVERTIME_RULES_BASIC_TRACKING_POINTS.OVERTIME_RULES_BASIC_NEXT;
    }
  }, [overtimeRuleType]);

  const getSaveTrackingPointForRules = useCallback(() => {
    switch (overtimeRuleType) {
      case 'california':
        return EDIT_OVERTIME_POLICY_TRACKING_POINTS.CALIFORNIA_RULES_SAVE;
      case 'custom':
        return EDIT_OVERTIME_POLICY_TRACKING_POINTS.CUSTOM_RULES_SAVE;
      default:
        return EDIT_OVERTIME_POLICY_TRACKING_POINTS.BASIC_RULES_SAVE;
    }
  }, [overtimeRuleType]);

  const handleCancel = useCallback(() => {
    const ctx = cancelContextRef.current;
    if (ctx.isEditMode) {
      track(EDIT_OVERTIME_POLICY_TRACKING_POINTS.CANCEL_EDIT);
    } else {
      track(SET_OVERTIME_POLICY_TRACKING_POINTS.OVERTIME_POLICY_CANCEL);
    }
    logger.info(OVERTIME_LOGGING.WIZARD_ABANDONED, {
      isEditMode: ctx.isEditMode,
      currentStep: ctx.currentStep,
      policyName: ctx.policyName,
    });
    onCancel();
  }, [onCancel, track, logger]);

  const getEditBackTrackingPointForRules = useCallback(() => {
    switch (overtimeRuleType) {
      case 'california':
        return EDIT_OVERTIME_POLICY_TRACKING_POINTS.CALIFORNIA_RULES_BACK;
      case 'custom':
        return EDIT_OVERTIME_POLICY_TRACKING_POINTS.CUSTOM_RULES_BACK;
      default:
        return EDIT_OVERTIME_POLICY_TRACKING_POINTS.BASIC_RULES_BACK;
    }
  }, [overtimeRuleType]);

  const handleBack = useCallback(() => {
    if (isEditMode) {
      track(EDIT_OVERTIME_POLICY_TRACKING_POINTS.BACK_EDIT_POLICY);
      if (currentStep === WizardStepId.OVERTIME_RULES) {
        track(getEditBackTrackingPointForRules());
      } else if (currentStep === WizardStepId.POLICY_MEMBERS) {
        track(EDIT_OVERTIME_POLICY_TRACKING_POINTS.EDIT_POLICY_MEMBERS_BACK);
      }
    } else {
      switch (currentStep) {
        case WizardStepId.OVERTIME_RULES:
          track(getBackTrackingPointForRules());
          break;
        case WizardStepId.POLICY_MEMBERS:
          track(POLICY_MEMBERS_TRACKING_POINTS.POLICY_MEMBERS_BACK);
          break;
        case WizardStepId.REVIEW:
          track(REVIEW_OVERTIME_POLICY_TRACKING_POINTS.BACK_REVIEW_POLICY);
          break;
        /* istanbul ignore next */
        default:
          break;
      }
    }
    onBack();
  }, [
    onBack,
    currentStep,
    isEditMode,
    track,
    getBackTrackingPointForRules,
    getEditBackTrackingPointForRules,
  ]);

  const handleNext = useCallback(() => {
    // Log step completion
    const stepCompleteLog = STEP_COMPLETE_LOG_MAP[currentStep];
    if (stepCompleteLog) {
      logger.info(stepCompleteLog, {
        isEditMode,
        stepId: currentStep,
      });
    }

    if (isEditMode) {
      if (currentStep === WizardStepId.REVIEW) {
        track(EDIT_OVERTIME_POLICY_TRACKING_POINTS.CLOSE_EDIT_REVIEW_PAGE);
      } else if (currentStep === WizardStepId.POLICY_NAME) {
        track(EDIT_OVERTIME_POLICY_TRACKING_POINTS.SAVE_POLICY_NAME);
      } else if (currentStep === WizardStepId.OVERTIME_RULES) {
        track(getSaveTrackingPointForRules());
      } else if (currentStep === WizardStepId.POLICY_MEMBERS) {
        track(EDIT_OVERTIME_POLICY_TRACKING_POINTS.EDIT_POLICY_MEMBERS_SAVE);
      }
    } else {
      switch (currentStep) {
        case WizardStepId.POLICY_NAME:
          track(SET_OVERTIME_POLICY_TRACKING_POINTS.OVERTIME_POLICY_NEXT);
          break;
        case WizardStepId.OVERTIME_RULES:
          track(OVERTIME_RULES_TRACKING_POINTS.OVERTIME_RULES_NEXT);
          track(getNextTrackingPointForRules());
          break;
        case WizardStepId.POLICY_MEMBERS:
          track(POLICY_MEMBERS_TRACKING_POINTS.POLICY_MEMBERS_ASSIGN);
          break;
        case WizardStepId.REVIEW:
          track(REVIEW_OVERTIME_POLICY_TRACKING_POINTS.CREATE_POLICY);
          break;
        /* istanbul ignore next */
        default:
          break;
      }
    }
    onNext();
  }, [
    onNext,
    currentStep,
    isEditMode,
    track,
    logger,
    getNextTrackingPointForRules,
    getSaveTrackingPointForRules,
  ]);

  const handleEditStep = useCallback(
    (stepId: number) => {
      if (isEditMode) {
        switch (stepId) {
          case WizardStepId.POLICY_NAME:
            track(EDIT_OVERTIME_POLICY_TRACKING_POINTS.EDIT_POLICY_DETAILS);
            break;
          case WizardStepId.OVERTIME_RULES:
            track(EDIT_OVERTIME_POLICY_TRACKING_POINTS.EDIT_OVERTIME_RULES);
            break;
          case WizardStepId.POLICY_MEMBERS:
            track(EDIT_OVERTIME_POLICY_TRACKING_POINTS.EDIT_POLICY_MEMBERS);
            break;
          default:
            break;
        }
      }
      // Create-mode REVIEW_* edit-step tracking is handled in ReviewStep.tsx
      onEditStep(stepId);
    },
    [onEditStep, isEditMode, track],
  );

  return (
    <WizardContainer data-testid="policy-setup-wizard">
      <LeftSide>
        {/* Step 1: Policy Name */}
        {currentStep === WizardStepId.POLICY_NAME && (
          <PolicyNameStep
            name={policyName}
            isBasicPolicy={isBasicPolicy}
            isDefault={policyIsDefault}
            isEditMode={isEditMode}
            onNameChange={handleNameChange}
            onDefaultChange={handleDefaultChange}
          />
        )}

        {/* Step 2: Overtime Rules */}
        {currentStep === WizardStepId.OVERTIME_RULES && (
          <OvertimeRulesStep
            selectedRuleType={overtimeRuleType}
            rules={overtimeRules}
            onRuleTypeChange={handleRuleTypeChange}
            onRulesChange={handleOvertimeRulesChange}
            onValidationChange={setIsOvertimeRulesValid}
            ruleTypeOptions={ruleTypeOptions}
            isEditMode={isEditMode}
            policyId={editingPolicyId}
          />
        )}

        {/* Step 3: Policy Members */}
        {currentStep === WizardStepId.POLICY_MEMBERS && (
          <PolicyMembersStep
            policyName={policyName}
            policyId={isEditMode ? editingPolicyId ?? undefined : undefined}
          />
        )}

        {/* Step 4: Review */}
        {currentStep === WizardStepId.REVIEW && (
          <ReviewStep
            policyName={policyName}
            isBasicPolicy={isBasicPolicy}
            isDefault={policyIsDefault}
            overtimeRuleType={overtimeRuleType}
            rules={overtimeRules}
            onEditStep={handleEditStep}
          />
        )}

        {/* Action Buttons */}
        <ButtonRow>
          <Button
            priority="tertiary"
            purpose="standard"
            size="medium"
            onClick={isFirstStep ? handleCancel : handleBack}
            data-testid={
              isFirstStep ? 'wizard-cancel-button' : 'wizard-back-button'
            }
          >
            {isFirstStep
              ? intl.formatMessage({
                  id: 'overtime.wizard.button.cancel',
                  defaultMessage: 'Cancel',
                })
              : intl.formatMessage({
                  id: 'overtime.wizard.button.back',
                  defaultMessage: 'Back',
                })}
          </Button>
          <Button
            priority="primary"
            purpose="standard"
            size="medium"
            onClick={handleNext}
            disabled={!isCurrentStepValid}
            data-testid={
              currentStep === WizardStepId.REVIEW
                ? 'wizard-submit-button'
                : 'wizard-next-button'
            }
          >
            {(() => {
              // Create mode: show "Next" for non-review steps, "Create policy" for review
              if (!isEditMode) {
                if (currentStep === WizardStepId.REVIEW) {
                  return intl.formatMessage({
                    id: 'overtime.wizard.button.submit',
                    defaultMessage: 'Create policy',
                  });
                }
                return intl.formatMessage({
                  id: 'overtime.wizard.button.next',
                  defaultMessage: 'Next',
                });
              }

              // Edit mode: button label depends on wizardStartStep and currentStep
              // Flow 2: Started at REVIEW and still on REVIEW -> "Close" (just viewing)
              if (
                wizardStartStep === WizardStepId.REVIEW &&
                currentStep === WizardStepId.REVIEW
              ) {
                return intl.formatMessage({
                  id: 'overtime.wizard.button.close',
                  defaultMessage: 'Close',
                });
              }

              // Flow 3: Started at POLICY_MEMBERS (Assign Workers flow) -> "Save"
              if (wizardStartStep === WizardStepId.POLICY_MEMBERS) {
                return intl.formatMessage({
                  id: 'overtime.wizard.button.save',
                  defaultMessage: 'Save',
                });
              }

              // Flows 4-6: Started at REVIEW but navigated to edit a sub-section -> "Save"
              if (
                wizardStartStep === WizardStepId.REVIEW &&
                currentStep !== WizardStepId.REVIEW
              ) {
                return intl.formatMessage({
                  id: 'overtime.wizard.button.save',
                  defaultMessage: 'Save',
                });
              }

              // Default edit mode: show "Next" for non-review steps, "Save changes" for review
              if (currentStep === WizardStepId.REVIEW) {
                return intl.formatMessage({
                  id: 'overtime.wizard.button.saveChanges',
                  defaultMessage: 'Save changes',
                });
              }
              return intl.formatMessage({
                id: 'overtime.wizard.button.next',
                defaultMessage: 'Next',
              });
            })()}
          </Button>
        </ButtonRow>
      </LeftSide>

      {/* Wizard Step Indicator */}
      <WizardStepIndicator
        steps={wizardSteps}
        currentStep={currentStep}
        title={
          isEditMode
            ? intl.formatMessage({
                id: 'overtime.wizard.menu.title.edit',
                defaultMessage: 'Edit overtime policy',
              })
            : intl.formatMessage({
                id: 'overtime.wizard.menu.title',
                defaultMessage: 'Set up overtime policy',
              })
        }
      />
    </WizardContainer>
  );
};

export default PolicySetupWizardContainer;
