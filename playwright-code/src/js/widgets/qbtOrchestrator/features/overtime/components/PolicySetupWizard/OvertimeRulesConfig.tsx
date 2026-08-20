import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import Typography from '@ids-ts/typography';

import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import type {
  OvertimeRule,
  OvertimeRuleConditionField,
} from '../../store/overtimeSlice';
import {
  RulesFormSection,
  DropdownWrapper,
  RulesList,
} from './styles/PolicySetupWizard.styled';
import { OvertimeRulesStepProps } from './types';
import OvertimeRuleCard from './OvertimeRuleCard';
import {
  RULE_TYPE_OPTIONS,
  getDefaultRulesByType,
  getConditionValue,
  setConditionValue,
} from './constants/overtimeRulesConstants';
import {
  areRulesEqual,
  isBasicPolicyId,
} from '../../utils/overtimeMutationUtils';
import {
  OVERTIME_RULES_TRACKING_POINTS,
  OVERTIME_RULES_BASIC_TRACKING_POINTS,
  OVERTIME_RULES_CUSTOM_TRACKING_POINTS,
  OvertimeTrackingPoints,
} from '../../constants/overtimeTrackingPoints';
import { OVERTIME_LOGGING } from '../../constants/overtimeLoggingConstants';

type RuleSelectionMap = Record<OvertimeRule['type'], boolean>;
type RuleFieldErrors = Partial<Record<OvertimeRuleConditionField, string>>;
type ValidationErrors = Partial<Record<OvertimeRule['type'], RuleFieldErrors>>;

const weeklyRuleType: OvertimeRule['type'] = 'weekly';

const RULE_TYPE_LOG_MAP: Record<string, string> = {
  basic: OVERTIME_LOGGING.RULE_TYPE_BASIC_SELECTED,
  california: OVERTIME_LOGGING.RULE_TYPE_CALIFORNIA_SELECTED,
  custom: OVERTIME_LOGGING.RULE_TYPE_CUSTOM_SELECTED,
};

const isWeeklyRequired = (
  ruleType: OvertimeRulesStepProps['selectedRuleType'],
) => ruleType === 'basic' || ruleType === 'custom';

const validateSelectedRules = (
  selectedRuleType: OvertimeRulesStepProps['selectedRuleType'],
  selectedRules: OvertimeRule[],
  intl: ReturnType<typeof useIntl>,
): { isValid: boolean; errors: ValidationErrors } => {
  if (!selectedRuleType) {
    return { isValid: false, errors: {} };
  }

  if (selectedRuleType === 'california') {
    return { isValid: true, errors: {} };
  }

  const nextErrors: ValidationErrors = {};
  let valid = true;

  const hasWeekly = selectedRules.some((rule) => rule.type === weeklyRuleType);
  if (!hasWeekly) {
    valid = false;
    nextErrors.weekly = {
      threshold: intl.formatMessage({
        id: 'overtime.wizard.rules.validation.weekly_required',
        defaultMessage: 'Weekly overtime rule is required',
      }),
    };
  }

  selectedRules.forEach((rule) => {
    const ruleFieldErrors: RuleFieldErrors = {};
    const threshold = getConditionValue(rule, 'threshold');
    if (!threshold.trim()) {
      ruleFieldErrors.threshold = intl.formatMessage({
        id: 'overtime.wizard.rules.validation.threshold_required',
        defaultMessage: 'Threshold is required',
      });
      valid = false;
    }

    if (
      (rule.type === 'daily' || rule.type === 'double_daily') &&
      !getConditionValue(rule, 'day_of_week').includes('1')
    ) {
      ruleFieldErrors.day_of_week = intl.formatMessage({
        id: 'overtime.wizard.rules.validation.days_required',
        defaultMessage: 'At least one day must be selected',
      });
      valid = false;
    }

    if (
      (rule.type === 'consecutive_daily' ||
        rule.type === 'consecutive_double_daily') &&
      !getConditionValue(rule, 'days_in_a_row').trim()
    ) {
      ruleFieldErrors.days_in_a_row = intl.formatMessage({
        id: 'overtime.wizard.rules.validation.days_in_row_required',
        defaultMessage: 'Consecutive days value is required',
      });
      valid = false;
    }

    if (Object.keys(ruleFieldErrors).length > 0) {
      nextErrors[rule.type] = ruleFieldErrors;
    }
  });

  return { isValid: valid, errors: nextErrors };
};

const buildRulesForTemplate = (
  selectedRuleType: OvertimeRulesStepProps['selectedRuleType'],
  selectedRules: OvertimeRule[],
): { allRules: OvertimeRule[]; selectedMap: RuleSelectionMap } => {
  const templateRules = getDefaultRulesByType(selectedRuleType);
  const selectedByType = new Map(
    selectedRules.map((rule) => [rule.type, rule]),
  );
  const allRules = templateRules.map((templateRule) => {
    const selectedRule = selectedByType.get(templateRule.type);
    return selectedRule ? { ...selectedRule } : templateRule;
  });

  const selectedMap = allRules.reduce((acc, rule) => {
    const mustSelect = selectedRuleType === 'california';
    const selectedByUser = selectedByType.has(rule.type);
    const selected = mustSelect || selectedByUser || selectedRules.length === 0;
    acc[rule.type] =
      isWeeklyRequired(selectedRuleType) && rule.type === weeklyRuleType
        ? true
        : selected;
    return acc;
  }, {} as RuleSelectionMap);

  return { allRules, selectedMap };
};

export interface OvertimeRulesConfigProps {
  selectedRuleType: OvertimeRulesStepProps['selectedRuleType'];
  rules: OvertimeRule[];
  onRuleTypeChange: (
    ruleType: OvertimeRulesStepProps['selectedRuleType'],
  ) => void;
  onRulesChange: (rules: OvertimeRule[]) => void;
  onValidationChange?: (isValid: boolean) => void;
  /** Pass a filtered options array to limit which rule types appear in the dropdown.
   *  Defaults to all RULE_TYPE_OPTIONS when omitted.
   *  OvertimeCardEdit passes RULE_TYPE_OPTIONS.filter(o => o.value !== 'custom'). */
  ruleTypeOptions?: typeof RULE_TYPE_OPTIONS;
  /** When true, the rule-type dropdown section is hidden.
   *  Use in contexts (e.g. OvertimeCardEdit) that render their own dropdown above this component. */
  hideDropdown?: boolean;
  /**
   * Whether the wizard is in edit mode (editing existing policy).
   * Used to determine if day deselection prevention should be applied.
   */
  isEditMode?: boolean;
  /**
   * The policy ID being edited (if in edit mode).
   * Used to identify basic policies that require deselection prevention.
   */
  policyId?: string | null;
}

const OvertimeRulesConfig: React.FC<OvertimeRulesConfigProps> = ({
  selectedRuleType,
  rules,
  onRuleTypeChange,
  onRulesChange,
  onValidationChange,
  ruleTypeOptions,
  hideDropdown,
  isEditMode = false,
  policyId,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const logger = useLoggingConfig();
  // Compute initial rules template on first render only
  const initialBuildRef = useRef<ReturnType<
    typeof buildRulesForTemplate
  > | null>(null);
  if (initialBuildRef.current === null) {
    initialBuildRef.current = buildRulesForTemplate(selectedRuleType, rules);
  }
  const initialBuild = initialBuildRef.current;

  const [templateRules, setTemplateRules] = useState<OvertimeRule[]>(
    initialBuild.allRules,
  );
  const [selectedMap, setSelectedMap] = useState<RuleSelectionMap>(
    initialBuild.selectedMap,
  );
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  // When handleRuleTypeChange fires, it already sets correct local state.
  // Skip the sync effect for that render to avoid rebuilding from stale Redux rules.
  const ruleTypeChangedLocally = useRef(false);

  useEffect(() => {
    if (ruleTypeChangedLocally.current) {
      ruleTypeChangedLocally.current = false;
      return;
    }
    const next = buildRulesForTemplate(selectedRuleType, rules);
    setTemplateRules(next.allRules);
    setSelectedMap(next.selectedMap);
  }, [selectedRuleType, rules]);

  const handleRuleTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement> | React.SyntheticEvent,
  ) => {
    track(OVERTIME_RULES_TRACKING_POINTS.OVERTIME_RULES_SELECT);
    const target = e.target as HTMLSelectElement;
    const nextRuleType =
      target.value as OvertimeRulesStepProps['selectedRuleType'];

    // Log rule type selection
    const logMessage = RULE_TYPE_LOG_MAP[nextRuleType];
    if (logMessage) {
      logger.info(logMessage, {
        previousRuleType: selectedRuleType,
        newRuleType: nextRuleType,
      });
    }

    const nextRules = getDefaultRulesByType(nextRuleType);
    const nextSelection = nextRules.reduce((acc, rule) => {
      acc[rule.type] = true;
      return acc;
    }, {} as RuleSelectionMap);

    ruleTypeChangedLocally.current = true;
    onRuleTypeChange(nextRuleType);
    setTemplateRules(nextRules);
    setSelectedMap(nextSelection);
    setFieldErrors({});
  };

  const selectedRules = useMemo(
    () => templateRules.filter((rule) => selectedMap[rule.type]),
    [templateRules, selectedMap],
  );

  useEffect(() => {
    // Only call onRulesChange when selectedRules is meaningfully different from rules.
    // This prevents an infinite loop: onRulesChange -> Redux update -> rules prop changes ->
    // sync effect runs -> selectedRules gets new reference -> this effect runs again.
    const rulesChanged = !areRulesEqual(selectedRules, rules);
    if (rulesChanged) {
      onRulesChange(selectedRules);
    }
  }, [onRulesChange, selectedRules, rules]);

  const validationState = useMemo(
    () => validateSelectedRules(selectedRuleType, selectedRules, intl),
    [selectedRuleType, selectedRules, intl],
  );

  useEffect(() => {
    setFieldErrors(validationState.errors);
  }, [validationState.errors]);

  useEffect(() => {
    onValidationChange?.(validationState.isValid);
  }, [validationState.isValid, onValidationChange]);

  // Log validation failures for Splunk tracking - only on valid→invalid transition
  const prevIsValidRef = useRef(true);
  useEffect(() => {
    const wasValid = prevIsValidRef.current;
    prevIsValidRef.current = validationState.isValid;
    if (
      wasValid &&
      !validationState.isValid &&
      Object.keys(validationState.errors).length > 0
    ) {
      logger.info(OVERTIME_LOGGING.WIZARD_VALIDATION_FAILED, {
        ruleType: selectedRuleType,
        errors: Object.keys(validationState.errors),
      });
    }
    // Only trigger on isValid changes; errors accessed via closure is always fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationState.isValid, selectedRuleType, logger]);

  const ruleTrackingPoints: OvertimeTrackingPoints =
    selectedRuleType === 'custom'
      ? OVERTIME_RULES_CUSTOM_TRACKING_POINTS
      : OVERTIME_RULES_BASIC_TRACKING_POINTS;

  const handleToggleRule = (
    ruleType: OvertimeRule['type'],
    selected: boolean,
  ) => {
    if (
      selectedRuleType === 'california' ||
      (ruleType === weeklyRuleType && isWeeklyRequired(selectedRuleType))
    ) {
      return;
    }

    // When 'daily' is unchecked, also uncheck 'double_daily'
    if (ruleType === 'daily' && !selected) {
      setSelectedMap((prev) => ({
        ...prev,
        [ruleType]: selected,
        double_daily: false,
      }));
      return;
    }

    // When 'consecutive_daily' is unchecked, also uncheck 'consecutive_double_daily'
    if (ruleType === 'consecutive_daily' && !selected) {
      setSelectedMap((prev) => ({
        ...prev,
        [ruleType]: selected,
        consecutive_double_daily: false,
      }));
      return;
    }

    setSelectedMap((prev) => ({ ...prev, [ruleType]: selected }));
  };

  const handleConditionChange = (
    ruleType: OvertimeRule['type'],
    field: OvertimeRuleConditionField,
    value: string,
  ) => {
    setTemplateRules((prev) =>
      prev.map((rule) =>
        rule.type === ruleType ? setConditionValue(rule, field, value) : rule,
      ),
    );
  };

  const options = ruleTypeOptions ?? RULE_TYPE_OPTIONS;

  // Calculate shouldPreventDeselection here to avoid prop drilling
  const shouldPreventDeselection = isEditMode && isBasicPolicyId(policyId);

  return (
    <>
      {!hideDropdown && (
        <RulesFormSection>
          <Typography variant="body-2" weight="medium">
            {intl.formatMessage({
              id: 'overtime.wizard.rules.setup.question',
              defaultMessage: 'How do you want to set up your overtime rules?',
            })}
          </Typography>
          <DropdownWrapper>
            <Dropdown
              aria-label={intl.formatMessage({
                id: 'overtime.wizard.rules.setup.question',
                defaultMessage:
                  'How do you want to set up your overtime rules?',
              })}
              value={selectedRuleType}
              onChange={handleRuleTypeChange}
              onOpen={() =>
                track(OVERTIME_RULES_TRACKING_POINTS.RULE_DROPDOWN_CLICK)
              }
              placeholder={intl.formatMessage({
                id: 'overtime.wizard.rules.dropdown.placeholder',
                defaultMessage: 'Select overtime rules',
              })}
              data-testid="overtime-rules-dropdown"
              width="auto"
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {intl.formatMessage({
                    id: option.labelId,
                    defaultMessage: option.defaultMessage,
                  })}
                </MenuItem>
              ))}
            </Dropdown>
          </DropdownWrapper>
        </RulesFormSection>
      )}

      {selectedRuleType && (
        <RulesFormSection>
          <Typography variant="body-2" weight="medium">
            {intl.formatMessage({
              id: 'overtime.wizard.rules.configure.title',
              defaultMessage: 'Configure your overtime rules',
            })}
          </Typography>
          <RulesList>
            {templateRules.map((rule) => (
              <OvertimeRuleCard
                key={rule.type}
                rule={rule}
                selected={Boolean(selectedMap[rule.type])}
                readOnly={selectedRuleType === 'california'}
                shouldPreventDeselection={shouldPreventDeselection}
                checkboxDisabled={
                  selectedRuleType === 'california' ||
                  (rule.type === weeklyRuleType &&
                    isWeeklyRequired(selectedRuleType)) ||
                  (rule.type === 'double_daily' && !selectedMap.daily) ||
                  (rule.type === 'consecutive_double_daily' &&
                    !selectedMap.consecutive_daily)
                }
                fieldErrors={fieldErrors[rule.type]}
                trackingPoints={ruleTrackingPoints}
                onSelectedChange={(selected) =>
                  handleToggleRule(rule.type, selected)
                }
                onConditionChange={(field, value) =>
                  handleConditionChange(rule.type, field, value)
                }
              />
            ))}
          </RulesList>
        </RulesFormSection>
      )}
    </>
  );
};

export default OvertimeRulesConfig;
