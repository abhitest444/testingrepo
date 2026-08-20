import React, { useEffect } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';
import Button from '@ids-ts/button';
import { IconControl } from '@ids-ts/icon-control';
import { ChevronLeft, PersonThree } from '@design-systems/icons';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setSelectedPolicyId,
  setShowPolicyDetails,
  selectSelectedPolicyId,
  selectOvertimePolicies,
  initializeWizardForEdit,
  WizardStepId,
} from '../store';
import {
  OvertimeRuleType,
  OvertimePolicy,
  OvertimeRule,
} from '../types/Overtime.types';
import { useOvertimePolicies, useOvertimePolicyWorkerCount } from '../hooks';
import { POLICY_LANDING_TRACKING_POINTS } from '../constants/overtimeTrackingPoints';
import {
  filterEnabledRules,
  isBasicPolicyId,
} from '../utils/overtimeMutationUtils';
import { USER_NOT_FOUND_ENTITY_NAME } from '../../../constants';
import { resolveOvertimeRuleType } from './PolicySetupWizard/constants/overtimeRulesConstants';
import { OVERTIME_LOGGING } from '../constants/overtimeLoggingConstants';
import { OvertimeRulesTable } from './PolicySetupWizard/OvertimeRulesTable';
import {
  BackButtonContainer,
  BackLink,
} from './PolicySetupWizard/styles/PolicySetupWizard.styled';
import {
  TrowserContent,
  PolicyDetailsContainer,
  PolicyHeader,
  PolicyActionsRow,
  PolicyActionsButtonGroup,
  RulesSection,
} from '../styles/OvertimeLandingPage.styled';

/**
 * Detect rule type from policy rules.
 * If any rule has consecutive_daily or consecutive_double_daily type:
 *   - all 5 threshold values match California constants → 'california'
 *   - any threshold differs → 'custom'
 * Otherwise → 'basic'
 */
const detectRuleType = (rules: OvertimeRule[]): OvertimeRuleType =>
  resolveOvertimeRuleType(rules);

interface PolicyDetailsScreenProps {
  onBack: () => void;
}

export const PolicyDetailsScreen: React.FC<PolicyDetailsScreenProps> = ({
  onBack,
}) => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const track = useTracking();
  const dispatch = useAppDispatch();

  const selectedPolicyId = useAppSelector(selectSelectedPolicyId);
  const policies = useAppSelector(selectOvertimePolicies);
  const { fetchPolicyById } = useOvertimePolicies();

  const [policy, setPolicy] = React.useState<OvertimePolicy | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Get worker count data using the dedicated hook
  // Pass empty array when policy is not loaded yet
  const {
    totalWorkerCount,
    companyTotalWorkerCount,
    loading: workerCountLoading,
    error: workerCountError,
    isCompanyWide,
    hasNoAssignments,
  } = useOvertimePolicyWorkerCount({
    assignments: policy?.assignments?.values || [],
  });

  useEffect(() => {
    const loadPolicy = async () => {
      if (!selectedPolicyId) return;

      // First check if policy is already in Redux store
      const existingPolicy = policies.find(
        (p: OvertimePolicy) => p.id === selectedPolicyId,
      );
      if (existingPolicy) {
        setPolicy(existingPolicy);
        return;
      }

      // If not in store, fetch from API
      try {
        setLoading(true);
        setFetchError(null);
        const fetchedPolicy = await fetchPolicyById(selectedPolicyId);
        setPolicy(fetchedPolicy);
      } catch (error) {
        logger.error(OVERTIME_LOGGING.FETCH_POLICY_BY_ID_FAILED, {
          policyId: selectedPolicyId,
          error,
        });
        setFetchError(intl.formatMessage({ id: 'catch.all.error.content' }));
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPolicyId, policies, fetchPolicyById, logger]);

  const handleBack = () => {
    dispatch(setSelectedPolicyId(null));
    dispatch(setShowPolicyDetails(false));
    onBack();
  };

  if (loading) {
    return (
      <TrowserContent>
        <Typography variant="body-1">
          {intl.formatMessage({
            id: 'overtime.details.loading',
            defaultMessage: 'Loading policy details...',
          })}
        </Typography>
      </TrowserContent>
    );
  }

  if (fetchError) {
    return (
      <TrowserContent>
        <Typography variant="body-1">{fetchError}</Typography>
      </TrowserContent>
    );
  }

  if (!policy) {
    return (
      <TrowserContent>
        <Typography variant="body-1">
          {intl.formatMessage({
            id: 'overtime.details.not_found',
            defaultMessage: 'Policy not found',
          })}
        </Typography>
      </TrowserContent>
    );
  }

  /**
   * Calculate worker count label for display
   * Uses data from useOvertimePolicyWorkerCount hook which fetches:
   * - Company total for 'all' assignments
   * - Group member counts for 'group' assignments
   * - Direct count for 'user' assignments
   */
  const getWorkerCountLabel = (): string => {
    // Show loading state while fetching counts
    if (workerCountLoading) {
      return intl.formatMessage({
        id: 'overtime.details.workers.loading',
        defaultMessage: 'Loading...',
      });
    }

    // Error fetching worker count
    if (workerCountError) {
      return intl.formatMessage({
        id: 'overtime.details.workers.error',
        defaultMessage: 'Unable to load worker count',
      });
    }

    // Company-wide assignment or default policy
    if (isCompanyWide || policy?.isDefault) {
      return intl.formatMessage({
        id: 'overtime.details.workers.all',
        defaultMessage: 'All workers',
      });
    }

    // No assignments case
    if (hasNoAssignments) {
      return intl.formatMessage({
        id: 'overtime.details.workers.none',
        defaultMessage: 'No workers assigned',
      });
    }

    // Show count with total (e.g., "5 of 20 workers")
    return intl.formatMessage(
      {
        id: 'overtime.details.workers.count',
        defaultMessage: '{count} of {total} workers',
      },
      { count: totalWorkerCount, total: companyTotalWorkerCount },
    );
  };

  /**
   * Extract member IDs from policy assignments
   * Filters for 'user' entity type assignments
   */
  const getMemberIdsFromPolicy = (): string[] => {
    const assignments = policy?.assignments?.values || [];
    return assignments
      .filter(
        (a) =>
          a.entityType === 'user' &&
          a.entityName !== USER_NOT_FOUND_ENTITY_NAME,
      )
      .map((a) => a.entityId);
  };

  const handleAssignWorkers = () => {
    track(POLICY_LANDING_TRACKING_POINTS.ASSIGN_WORKERS_POLICY_PAGE);
    logger.info(OVERTIME_LOGGING.ASSIGN_WORKERS_CLICKED, {
      policyId: policy.id,
    });
    dispatch(setShowPolicyDetails(false));
    dispatch(
      initializeWizardForEdit({
        policyId: policy.id,
        name: policy.name,
        description: policy.description || '',
        isDefault: policy.isDefault,
        rules: filterEnabledRules(policy.rules?.values || []),
        ruleType: detectRuleType(
          filterEnabledRules(policy.rules?.values || []),
        ),
        memberIds: getMemberIdsFromPolicy(),
        assignments: policy.assignments?.values || [],
        startStep: WizardStepId.POLICY_MEMBERS,
        origin: 'policyDetails',
      }),
    );
  };

  const handleEditPolicy = () => {
    track(POLICY_LANDING_TRACKING_POINTS.EDIT_OVERTIME_POLICY_PAGE);
    logger.info(OVERTIME_LOGGING.FILLED_STATE_EDIT_POLICY_CLICKED, {
      policyId: policy.id,
    });
    dispatch(setShowPolicyDetails(false));
    dispatch(
      initializeWizardForEdit({
        policyId: policy.id,
        name: policy.name,
        description: policy.description || '',
        isDefault: policy.isDefault,
        rules: filterEnabledRules(policy.rules?.values || []),
        ruleType: detectRuleType(
          filterEnabledRules(policy.rules?.values || []),
        ),
        memberIds: getMemberIdsFromPolicy(),
        assignments: policy.assignments?.values || [],
        startStep: WizardStepId.REVIEW,
        origin: 'policyDetails',
      }),
    );
  };

  const shouldShowAssignWorkersButton =
    !policy.isDefault && !isBasicPolicyId(policy.id);

  return (
    <TrowserContent>
      <BackButtonContainer>
        <BackLink
          onClick={handleBack}
          aria-label={intl.formatMessage({
            id: 'overtime.details.back.aria',
            defaultMessage: 'Back to Overtime policies',
          })}
        >
          <ChevronLeft size="small" />
          {intl.formatMessage({
            id: 'overtime.details.back',
            defaultMessage: 'Overtime policies',
          })}
        </BackLink>
      </BackButtonContainer>

      <PolicyDetailsContainer>
        <PolicyHeader>
          <Typography variant="headline-2">{policy.name}</Typography>
          {policy.description && (
            <Typography variant="body-1">{policy.description}</Typography>
          )}
        </PolicyHeader>

        <PolicyActionsRow>
          <IconControl
            label={getWorkerCountLabel()}
            labelAlignment="right"
            size="medium"
            shape="circle"
            data-testid="policy-worker-count"
          >
            <PersonThree />
          </IconControl>
          <PolicyActionsButtonGroup>
            {shouldShowAssignWorkersButton && (
              <Button
                size="small"
                priority="secondary"
                onClick={handleAssignWorkers}
                data-testid="assign-workers-button"
              >
                {intl.formatMessage({
                  id: 'overtime.details.button.assign_workers',
                  defaultMessage: 'Assign workers',
                })}
              </Button>
            )}
            <Button
              size="small"
              priority="secondary"
              onClick={handleEditPolicy}
              data-testid="edit-policy-button"
            >
              {intl.formatMessage({
                id: 'overtime.details.button.edit_policy',
                defaultMessage: 'Edit overtime policy',
              })}
            </Button>
          </PolicyActionsButtonGroup>
        </PolicyActionsRow>

        <RulesSection>
          <Typography variant="headline-3">
            {intl.formatMessage({
              id: 'overtime.details.rules.title',
              defaultMessage: 'Overtime rules',
            })}
          </Typography>
          <OvertimeRulesTable
            rules={filterEnabledRules(policy.rules?.values || [])}
          />
        </RulesSection>
      </PolicyDetailsContainer>
    </TrowserContent>
  );
};
