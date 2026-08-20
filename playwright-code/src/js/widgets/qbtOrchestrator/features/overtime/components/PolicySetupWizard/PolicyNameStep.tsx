import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import TextField from '@ids-ts/text-field';
import { Checkbox } from '@ids-ts/checkbox';
import Typography from '@ids-ts/typography';
import { Card } from '@ids-ts/cards';
import { CircleInfoFill } from '@design-systems/icons';

import {
  PolicyCardWrapper,
  TitleSection,
  FormSection,
  TextFieldWrapper,
  CheckboxHelperText,
  InfoMessage,
  StyledCardContent,
} from './styles/PolicySetupWizard.styled';
import { PolicyNameStepProps } from './types';
import {
  SET_OVERTIME_POLICY_TRACKING_POINTS,
  EDIT_OVERTIME_POLICY_TRACKING_POINTS,
} from '../../constants/overtimeTrackingPoints';
import { POLICY_NAME_VALIDATION } from '../../constants/overtimeValidationConstants';

const PolicyNameStep: React.FC<PolicyNameStepProps> = ({
  name,
  isBasicPolicy,
  isDefault,
  isEditMode = false,
  onNameChange,
  onDefaultChange,
}) => {
  const intl = useIntl();
  const track = useTracking();

  const isNameTooLong = name.length > POLICY_NAME_VALIDATION.MAX_LENGTH;

  const getDefaultToggleTrackingPoint = (checked: boolean) => {
    if (isEditMode) {
      return checked
        ? EDIT_OVERTIME_POLICY_TRACKING_POINTS.DEFAULT_ON
        : EDIT_OVERTIME_POLICY_TRACKING_POINTS.DEFAULT_OFF;
    }

    return checked
      ? SET_OVERTIME_POLICY_TRACKING_POINTS.DEFAULT_POLICY_ON
      : SET_OVERTIME_POLICY_TRACKING_POINTS.DEFAULT_POLICY_OFF;
  };

  return (
    <PolicyCardWrapper>
      <Card size="none">
        <StyledCardContent>
          <TitleSection>
            <Typography variant="headline-5" weight="medium">
              {intl.formatMessage({
                id: 'overtime.wizard.policy.name.title',
                defaultMessage: 'Describe your new overtime policy',
              })}
            </Typography>
            <Typography variant="body-2" weight="regular">
              {intl.formatMessage({
                id: 'overtime.wizard.policy.name.description',
                defaultMessage:
                  'What kind of overtime policy is it, and what will your team call it?',
              })}
            </Typography>
          </TitleSection>

          <FormSection>
            <TextFieldWrapper>
              <TextField
                label={intl.formatMessage({
                  id: 'overtime.wizard.policy.name.label',
                  defaultMessage: 'Name',
                })}
                placeholder={intl.formatMessage({
                  id: 'overtime.wizard.policy.name.placeholder',
                  defaultMessage: 'Enter policy name',
                })}
                value={name}
                onChange={(e) => {
                  track(
                    isEditMode
                      ? EDIT_OVERTIME_POLICY_TRACKING_POINTS.UPDATE_POLICY_NAME
                      : SET_OVERTIME_POLICY_TRACKING_POINTS.POLICY_NAME,
                  );
                  onNameChange(e.target.value);
                }}
                errorText={
                  isNameTooLong
                    ? intl.formatMessage(POLICY_NAME_VALIDATION.ERROR_TOO_LONG)
                    : undefined
                }
                data-testid="policy-name-input"
              />
            </TextFieldWrapper>
          </FormSection>

          <FormSection>
            <Checkbox
              disabled={isBasicPolicy && isEditMode}
              checked={isDefault}
              onChange={(e) => {
                const checked = e.target.checked || false;
                track(getDefaultToggleTrackingPoint(checked));
                onDefaultChange(checked);
              }}
              data-testid="default-policy-checkbox"
            >
              {intl.formatMessage({
                id: 'overtime.wizard.policy.default.label',
                defaultMessage: 'Default overtime policy',
              })}
            </Checkbox>
            <CheckboxHelperText>
              {intl.formatMessage({
                id: 'overtime.wizard.policy.default.description',
                defaultMessage:
                  'New workers will be assigned this overtime policy by default',
              })}
            </CheckboxHelperText>
            {isDefault && (
              <InfoMessage data-testid="default-policy-info-message">
                <CircleInfoFill color="var(--color-icon-accent)" size="small" />
                <span>
                  {intl.formatMessage({
                    id: 'overtime.wizard.policy.default.info',
                    defaultMessage:
                      'This overtime policy applies to everyone, so you can skip assigning it to individual workers.',
                  })}
                </span>
              </InfoMessage>
            )}
          </FormSection>
        </StyledCardContent>
      </Card>
    </PolicyCardWrapper>
  );
};

export default PolicyNameStep;
