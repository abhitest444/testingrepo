import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import Checkbox from '@ids-ts/checkbox';
import TextField from '@ids-ts/text-field';
import Typography from '@ids-ts/typography';
import type {
  OvertimeRule,
  OvertimeRuleConditionField,
} from '../../store/overtimeSlice';
import { OVERTIME_RULE_TYPES } from '../../types/Overtime.types';
import DaysOfWeekDropdown from './DaysOfWeekDropdown';
import {
  RULE_TYPE_TO_LABEL_ID,
  getConditionValue,
} from './constants/overtimeRulesConstants';
import {
  RuleCardWrapper,
  RuleInputsColumn,
  RuleInputFieldsContainer,
  RuleInputField,
  RuleErrorText,
} from './styles/PolicySetupWizard.styled';
import type { OvertimeTrackingPoints } from '../../constants/overtimeTrackingPoints';

const RULE_TYPE_KEY_MAP: Record<string, string> = {
  weekly: 'WEEKLY',
  daily: 'DAILY',
  double_daily: 'DOUBLE_DAILY',
  consecutive_daily: 'CONSECUTIVE',
  consecutive_double_daily: 'DOUBLE_CONSECUTIVE',
};

type OvertimeRuleCardProps = {
  rule: OvertimeRule;
  selected: boolean;
  readOnly: boolean;
  checkboxDisabled: boolean;
  /**
   * When true, prevents users from deselecting already selected days in the dropdown.
   * Applies to basic policies in edit mode to maintain required day selections.
   */
  shouldPreventDeselection?: boolean;
  fieldErrors?: Partial<Record<OvertimeRuleConditionField, string>>;
  trackingPoints?: OvertimeTrackingPoints;
  onSelectedChange: (selected: boolean) => void;
  onConditionChange: (field: OvertimeRuleConditionField, value: string) => void;
};

const OvertimeRuleCard: React.FC<OvertimeRuleCardProps> = ({
  rule,
  selected,
  readOnly,
  checkboxDisabled,
  shouldPreventDeselection = false,
  fieldErrors,
  trackingPoints,
  onSelectedChange,
  onConditionChange,
}) => {
  const intl = useIntl();
  const track = useTracking();

  const trackRule = (action: string) => {
    if (!trackingPoints) return;
    const suffix = RULE_TYPE_KEY_MAP[rule.type];
    if (!suffix) return;
    const tp =
      trackingPoints[`BASIC_${suffix}_${action}`] ??
      trackingPoints[`CUSTOM_${suffix}_${action}`];
    if (tp) track(tp);
  };

  const getDropdownClickTrackingPoint = () => {
    if (!trackingPoints) return undefined;
    const suffix = RULE_TYPE_KEY_MAP[rule.type];
    if (!suffix) return undefined;
    return (
      trackingPoints[`BASIC_${suffix}_SELECT_DAYS_CLICK`] ??
      trackingPoints[`CUSTOM_${suffix}_SELECT_DAYS_CLICK`]
    );
  };

  const ruleLabel = intl.formatMessage({
    id: RULE_TYPE_TO_LABEL_ID[rule.type],
    defaultMessage: rule.name,
  });
  const threshold = getConditionValue(rule, 'threshold');
  const dayOfWeek = getConditionValue(rule, 'day_of_week');
  const daysInRow = getConditionValue(rule, 'days_in_a_row');

  const multiplierLabel = intl.formatMessage({
    id:
      rule.multiplier === 2
        ? 'overtime.wizard.rules.multiplier.2'
        : 'overtime.wizard.rules.multiplier.1.5',
    defaultMessage:
      rule.multiplier === 2
        ? 'Rate multiplier is 2x base pay'
        : 'Rate multiplier is 1.5x base pay',
  });

  return (
    <RuleCardWrapper data-testid={`overtime-rule-${rule.type}`}>
      <Checkbox
        checked={selected}
        disabled={checkboxDisabled}
        onChange={(event) => {
          const checked = Boolean(event.target.checked);
          trackRule(checked ? 'ON' : 'OFF');
          onSelectedChange(checked);
        }}
        data-testid={`overtime-rule-checkbox-${rule.type}`}
      >
        <Typography variant="body-2" weight="medium">
          {ruleLabel}
        </Typography>
      </Checkbox>

      {selected && (
        <RuleInputsColumn>
          <Typography variant="body-3" weight="regular">
            {multiplierLabel}
          </Typography>
          <RuleInputFieldsContainer>
            {(rule.type === OVERTIME_RULE_TYPES.DAILY ||
              rule.type === OVERTIME_RULE_TYPES.DOUBLE_DAILY) && (
              <RuleInputField>
                <DaysOfWeekDropdown
                  value={dayOfWeek}
                  disabled={readOnly}
                  preventDeselection={shouldPreventDeselection}
                  trackingPoint={getDropdownClickTrackingPoint()}
                  onChange={(value) => {
                    trackRule('SELECT_DAYS');
                    onConditionChange('day_of_week', value);
                  }}
                />
                {fieldErrors?.day_of_week && (
                  <RuleErrorText>{fieldErrors.day_of_week}</RuleErrorText>
                )}
              </RuleInputField>
            )}

            {(rule.type === OVERTIME_RULE_TYPES.CONSECUTIVE_DAILY ||
              rule.type === OVERTIME_RULE_TYPES.CONSECUTIVE_DOUBLE_DAILY) && (
              <RuleInputField>
                <TextField
                  label={intl.formatMessage({
                    id: 'overtime.wizard.rules.days_in_row.label',
                    defaultMessage:
                      'Start on number of consecutive days worked',
                  })}
                  width="100%"
                  value={daysInRow}
                  disabled={readOnly}
                  onChange={(event) => {
                    trackRule('HOURS');
                    onConditionChange('days_in_a_row', event.target.value);
                  }}
                  data-testid={`overtime-rule-days-in-a-row-${rule.type}`}
                />
                {fieldErrors?.days_in_a_row && (
                  <RuleErrorText>{fieldErrors.days_in_a_row}</RuleErrorText>
                )}
              </RuleInputField>
            )}

            <RuleInputField>
              <TextField
                label={intl.formatMessage({
                  id: 'overtime.wizard.rules.threshold.label',
                  defaultMessage: 'Start overtime after hours exceed',
                })}
                width="100%"
                value={threshold}
                disabled={readOnly}
                onChange={(event) => {
                  trackRule('HOURS');
                  onConditionChange('threshold', event.target.value);
                }}
                data-testid={`overtime-rule-threshold-${rule.type}`}
              />
              {fieldErrors?.threshold && (
                <RuleErrorText>{fieldErrors.threshold}</RuleErrorText>
              )}
            </RuleInputField>
          </RuleInputFieldsContainer>
        </RuleInputsColumn>
      )}
    </RuleCardWrapper>
  );
};

export default OvertimeRuleCard;
