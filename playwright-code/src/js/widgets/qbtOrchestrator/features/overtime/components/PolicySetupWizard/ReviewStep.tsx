import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';
import { Edit } from '@design-systems/icons';

import {
  ReviewCardsContainer,
  ReviewSectionCard,
  ReviewSectionHeader,
  ReviewSectionContent,
  ReviewFieldGroup,
  StyledEditIconControl,
  StyledEditIcon,
} from './styles/PolicySetupWizard.styled';
import { ReviewStepProps, WizardStepId } from './types';
import OvertimeRulesTable from './OvertimeRulesTable';
import { useWizardPolicyWorkerCount } from '../../hooks/useWizardPolicyWorkerCount';
import { REVIEW_OVERTIME_POLICY_TRACKING_POINTS } from '../../constants/overtimeTrackingPoints';

const ReviewStep: React.FC<ReviewStepProps> = ({
  policyName,
  isBasicPolicy,
  isDefault,
  overtimeRuleType,
  rules,
  onEditStep,
}) => {
  const intl = useIntl();
  const track = useTracking();

  // Use the coordinator hook for accurate worker count
  const {
    totalWorkerCount,
    companyTotalWorkerCount,
    isCompanyWide,
    hasNoAssignments,
    loading,
    error: workerCountError,
  } = useWizardPolicyWorkerCount();

  const handleEditPolicyDetails = () => {
    track(REVIEW_OVERTIME_POLICY_TRACKING_POINTS.EDIT_POLICY_DETAILS);
    onEditStep?.(WizardStepId.POLICY_NAME);
  };

  const handleEditRules = () => {
    track(REVIEW_OVERTIME_POLICY_TRACKING_POINTS.EDIT_OVERTIME_RULES);
    onEditStep?.(WizardStepId.OVERTIME_RULES);
  };

  const handleEditMembers = () => {
    track(REVIEW_OVERTIME_POLICY_TRACKING_POINTS.EDIT_POLICY_MEMBERS);
    onEditStep?.(WizardStepId.POLICY_MEMBERS);
  };

  const getDefaultPolicyText = () => {
    if (isDefault) {
      return intl.formatMessage({
        id: 'overtime.wizard.review.default.yes',
        defaultMessage:
          'Yes, new workers will be assigned this overtime policy by default',
      });
    }
    return intl.formatMessage({
      id: 'overtime.wizard.review.default.no',
      defaultMessage: 'No',
    });
  };

  const getMembersDisplayText = (): string => {
    if (loading && !isDefault) {
      return intl.formatMessage({
        id: 'overtime.wizard.review.members.loading',
        defaultMessage: 'Loading...',
      });
    }
    if (workerCountError) {
      return intl.formatMessage({
        id: 'overtime.wizard.review.members.error',
        defaultMessage: 'Unable to load worker count',
      });
    }
    if (isCompanyWide || isDefault) {
      return intl.formatMessage({
        id: 'overtime.wizard.review.members.allWorkers',
        defaultMessage: 'All workers',
      });
    }
    if (hasNoAssignments) {
      return intl.formatMessage({
        id: 'overtime.wizard.review.members.noWorkers',
        defaultMessage: 'No workers assigned',
      });
    }
    return intl.formatMessage(
      {
        id: 'overtime.wizard.review.members.count',
        defaultMessage: '{count} of {total} workers assigned to {policyName}',
      },
      {
        count: totalWorkerCount,
        total: companyTotalWorkerCount,
        policyName:
          policyName ||
          intl.formatMessage({
            id: 'overtime.wizard.review.members.policy.placeholder',
            defaultMessage: '{overtime policy name}',
          }),
      },
    );
  };

  return (
    <ReviewCardsContainer>
      {/* Overtime Policy Details Section */}
      <ReviewSectionCard>
        <ReviewSectionHeader>
          <Typography variant="headline-5" weight="medium">
            {intl.formatMessage({
              id: 'overtime.wizard.review.section.details',
              defaultMessage: 'Overtime policy details',
            })}
          </Typography>
          {onEditStep && !isBasicPolicy && (
            <StyledEditIconControl
              onClick={handleEditPolicyDetails}
              aria-label={intl.formatMessage({
                id: 'overtime.wizard.review.edit.details',
                defaultMessage: 'Edit policy details',
              })}
            >
              <StyledEditIcon>
                <Edit />
              </StyledEditIcon>
            </StyledEditIconControl>
          )}
        </ReviewSectionHeader>
        <ReviewSectionContent>
          <ReviewFieldGroup>
            <Typography variant="body-2" weight="medium">
              {intl.formatMessage({
                id: 'overtime.wizard.review.policyname.label',
                defaultMessage: 'Policy name',
              })}
            </Typography>
            <Typography variant="body-2" weight="regular">
              {policyName || '—'}
            </Typography>
          </ReviewFieldGroup>
          <ReviewFieldGroup>
            <Typography variant="body-2" weight="medium">
              {intl.formatMessage({
                id: 'overtime.wizard.review.defaultpolicy.label',
                defaultMessage: 'Default policy',
              })}
            </Typography>
            <Typography variant="body-2" weight="regular">
              {getDefaultPolicyText()}
            </Typography>
          </ReviewFieldGroup>
        </ReviewSectionContent>
      </ReviewSectionCard>

      {/* Overtime Rules Section */}
      <ReviewSectionCard>
        <ReviewSectionHeader>
          <Typography variant="headline-5" weight="medium">
            {intl.formatMessage({
              id: 'overtime.wizard.review.section.rules',
              defaultMessage: 'Overtime rules',
            })}
          </Typography>
          {onEditStep && (
            <StyledEditIconControl
              onClick={handleEditRules}
              aria-label={intl.formatMessage({
                id: 'overtime.wizard.review.edit.rules',
                defaultMessage: 'Edit overtime rules',
              })}
            >
              <StyledEditIcon>
                <Edit />
              </StyledEditIcon>
            </StyledEditIconControl>
          )}
        </ReviewSectionHeader>
        <OvertimeRulesTable rules={rules} />
      </ReviewSectionCard>

      {/* Policy Members Section */}
      <ReviewSectionCard>
        <ReviewSectionHeader>
          <Typography variant="headline-5" weight="medium">
            {intl.formatMessage({
              id: 'overtime.wizard.review.section.members',
              defaultMessage: 'Policy members',
            })}
          </Typography>
          {onEditStep && !isDefault && !isBasicPolicy && (
            <StyledEditIconControl
              onClick={handleEditMembers}
              aria-label={intl.formatMessage({
                id: 'overtime.wizard.review.edit.members',
                defaultMessage: 'Edit policy members',
              })}
            >
              <StyledEditIcon>
                <Edit />
              </StyledEditIcon>
            </StyledEditIconControl>
          )}
        </ReviewSectionHeader>
        <Typography variant="body-2" weight="regular">
          {getMembersDisplayText()}
        </Typography>
      </ReviewSectionCard>
    </ReviewCardsContainer>
  );
};

export default ReviewStep;
