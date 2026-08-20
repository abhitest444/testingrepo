import React, { useEffect } from 'react';
import { B1, Medium } from '@ids-ts/typography';
import { IconControl } from '@ids-ts/icon-control';
import { Edit, NewWindow, ThumbDown, StopWatch } from '@design-systems/icons';
import { Skeleton } from '@cgds/skeleton';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { USER_SETTINGS_OVERTIME_LOGGING } from 'src/js/widgets/userSettings/constants/loggingConstants';
import { renderTitleWithBadge } from 'src/js/hooks/useRenderTitleWithBadge';
import {
  HeaderRow,
  Actions,
} from 'src/js/widgets/userSettings/components/styles/cards.styles';
import { OvertimeRulesTable } from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRulesTable';
import { filterEnabledRules } from 'src/js/widgets/qbtOrchestrator/features/overtime/utils/overtimeMutationUtils';
import {
  useAppSelector,
  useAppDispatch,
} from 'src/js/widgets/userSettings/store';
import {
  selectOvertimePolicy,
  selectOvertimeLoading,
  selectOvertimeError,
  setOvertimeMode,
  initializeEditDraft,
} from 'src/js/widgets/userSettings/store/slices/overtimeSlice';
import { storeManager } from 'src/js/widgets/qbtOrchestrator/store/storeManager';
import { overtimeReducer } from 'src/js/widgets/qbtOrchestrator/features/overtime/store';
import {
  setSelectedPolicyId,
  setShowPolicyDetails,
  setShowLandingPage,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/store/overtimeSlice';
import { WORKER_OVERTIME_TRACKING_POINTS } from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeTrackingPoints';
import { OvertimeCardMode } from '../types/OvertimeCard.types';
import BreaksStateMessage from '../../BreaksCard/components/BreaksStateMessage';
import {
  SectionLabel,
  PolicyName,
  SkeletonRow,
} from '../styles/OvertimeCard.styles';
import {
  isBasicPolicy,
  isNumericPolicy as isNumericPolicyId,
} from '../utils/policyIdUtils';

interface OvertimeCardViewProps {
  overtimeBadgeVisibilityEndDate?: string;
}

const OvertimeCardView: React.FC<OvertimeCardViewProps> = ({
  overtimeBadgeVisibilityEndDate = '',
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const logger = useLoggingConfig();
  const track = useTracking();
  const dispatch = useAppDispatch();

  const policy = useAppSelector(selectOvertimePolicy);
  const loading = useAppSelector(selectOvertimeLoading);
  const error = useAppSelector(selectOvertimeError);

  useEffect(() => {
    logger.info(USER_SETTINGS_OVERTIME_LOGGING.CARD_VIEW_MOUNTED);
    // Intentional: log component mount only. Data (policy/loading/error) is not
    // included because it's not yet loaded at mount time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Policy type determination based on API-returned id:
  // 'basic'              → company-assigned policy (isDefault: true) → show Edit
  // 'basic_policy_<uid>' → user-level override                       → show Edit
  // numeric string       → pay-rate-engine policy                    → show jump link
  const isEditablePolicy = !!policy && isBasicPolicy(policy.id);
  const isNumericPolicy = !!policy && isNumericPolicyId(policy.id);
  const isEmpty = !loading && !error && !policy;

  // TODO: [QUANTA-8892] Consider URL-based state passing (query params) instead of
  // cross-store dispatch for more robust cross-widget communication
  const handleNavigateToPolicyDetails = () => {
    logger.info(
      USER_SETTINGS_OVERTIME_LOGGING.NAVIGATE_TO_POLICY_DETAILS_CLICKED,
      { policyId: policy?.id },
    );
    try {
      // Ensure the overtime reducer is injected before dispatching
      if (!storeManager.hasReducer('overtime')) {
        storeManager.inject('overtime', overtimeReducer);
      }
      storeManager.store.dispatch(setSelectedPolicyId(policy!.id));
      storeManager.store.dispatch(setShowPolicyDetails(true));
      storeManager.store.dispatch(setShowLandingPage(true));
      // Navigate to the time settings page where the trowser is mounted
      sandbox.navigation.navigate('/app/accountsettings?p=time');
    } catch (err) {
      logger.error(USER_SETTINGS_OVERTIME_LOGGING.NAVIGATION_FAILED, {
        target: 'policyDetails',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleNavigateToTimeSettings = () => {
    logger.info(
      USER_SETTINGS_OVERTIME_LOGGING.NAVIGATE_TO_TIME_SETTINGS_CLICKED,
    );
    try {
      sandbox.navigation.navigate('/app/accountsettings?p=time');
    } catch (err) {
      logger.error(USER_SETTINGS_OVERTIME_LOGGING.NAVIGATION_FAILED, {
        target: 'timeSettings',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // Header: BASIC gets Edit icon, numeric/empty get NewWindow icon
  const renderHeader = () => (
    <HeaderRow>
      <B1>
        <Medium>
          {renderTitleWithBadge({
            title: 'overtime.card.title',
            isNew: true,
            isNewVisibleTill: overtimeBadgeVisibilityEndDate,
            intl,
          })}
        </Medium>
      </B1>
      <Actions>
        {isEditablePolicy && (
          <IconControl
            disabled={loading}
            onClick={() => {
              track(WORKER_OVERTIME_TRACKING_POINTS.WORKER_OVERTIME_EDIT);
              logger.info(USER_SETTINGS_OVERTIME_LOGGING.EDIT_CLICKED, {
                policyId: policy?.id,
              });
              dispatch(initializeEditDraft(policy));
              dispatch(setOvertimeMode(OvertimeCardMode.EDIT));
            }}
            aria-label="edit-overtime"
          >
            <Edit />
          </IconControl>
        )}
        {(isNumericPolicy || isEmpty) && (
          <IconControl
            disabled={loading}
            onClick={
              isNumericPolicy
                ? handleNavigateToPolicyDetails
                : handleNavigateToTimeSettings
            }
            aria-label="open-overtime-settings"
          >
            <NewWindow />
          </IconControl>
        )}
      </Actions>
    </HeaderRow>
  );

  // Error state
  if (error) {
    return (
      <div>
        {renderHeader()}
        <BreaksStateMessage
          icon={ThumbDown}
          messageId="overtime.card.error.state.message"
          testId="overtime-error-state"
        />
      </div>
    );
  }

  // Empty state (no policy assigned)
  if (isEmpty) {
    return (
      <div>
        {renderHeader()}
        <BreaksStateMessage
          icon={StopWatch}
          messageId="overtime.card.empty.state.message"
          testId="overtime-empty-state"
        />
      </div>
    );
  }

  // Policy view (loading skeleton or actual rules table)
  const rules = filterEnabledRules(policy?.rules?.values ?? []);

  return (
    <div>
      {renderHeader()}
      <SectionLabel>
        {intl.formatMessage({ id: 'overtime.card.rules.label' })}
      </SectionLabel>
      {loading ? (
        <>
          <SkeletonRow>
            <Skeleton variant="rectangular" height={18} />
          </SkeletonRow>
          <SkeletonRow>
            <Skeleton variant="rectangular" height={18} />
          </SkeletonRow>
        </>
      ) : (
        <>
          <PolicyName>{policy?.name}</PolicyName>
          <OvertimeRulesTable rules={rules} />
        </>
      )}
    </div>
  );
};

export default OvertimeCardView;
