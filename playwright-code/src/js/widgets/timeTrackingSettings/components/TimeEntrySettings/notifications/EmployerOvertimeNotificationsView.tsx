import React, { useEffect, useRef } from 'react';
import { B3 } from '@ids-ts/typography';
import { Skeleton } from '@cgds/skeleton';
import { useIntl } from '@payroll/quicksand';
import {
  TimeTracking_OvertimeNotificationRule,
  TimeTracking_OvertimePeriod,
} from 'src/__generated__/timeTracking/graphql';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  BoldLabel,
  Label,
  Value,
} from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import {
  formatOvertimeFrequencyView,
  formatOvertimeRecipientsView,
  formatOvertimeThresholdView,
  getOvertimeRuleForPeriod,
  hasDisplayableOvertimeRules,
  hasOvertimeRuleForPeriod,
} from 'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/overtimeNotifications.utils';
import {
  OvertimeCardSection,
  OvertimeEmptySection,
  OvertimePeriodSection,
  OvertimeViewStack,
  StyledRow,
} from 'src/js/widgets/userSettings/components/cards/NotificationsCard/styles/NotificationsOvertime.styles';
import { EMPLOYER_OVERTIME_NOTIFICATIONS_LOGGING } from 'src/js/widgets/timeTrackingSettings/loggingConstants';

const OvertimePeriodBlock: React.FC<{
  titleId: string;
  period: TimeTracking_OvertimePeriod.Day | TimeTracking_OvertimePeriod.Week;
  rules: TimeTracking_OvertimeNotificationRule[];
}> = ({ titleId, period, rules }) => {
  const intl = useIntl();
  const rule = getOvertimeRuleForPeriod(rules, period);

  return (
    <OvertimePeriodSection>
      <StyledRow isErrorRow={false} index={0}>
        <BoldLabel index={0}>{intl.formatMessage({ id: titleId })}</BoldLabel>
      </StyledRow>
      <StyledRow isErrorRow={false} index={0}>
        <Label>
          {intl.formatMessage({
            id: 'notifications.overtime.threshold.question',
          })}
        </Label>
        <Value>{formatOvertimeThresholdView(intl, rule)}</Value>
      </StyledRow>
      <StyledRow isErrorRow={false} index={1}>
        <Label>
          {intl.formatMessage({
            id: 'notifications.overtime.after.threshold',
          })}
        </Label>
        <Value>{formatOvertimeFrequencyView(intl, rule)}</Value>
      </StyledRow>
      <StyledRow isErrorRow={false} index={2}>
        <Label>
          {intl.formatMessage({ id: 'notifications.overtime.send.alerts' })}
        </Label>
        <Value>{formatOvertimeRecipientsView(intl, rule)}</Value>
      </StyledRow>
    </OvertimePeriodSection>
  );
};

const OvertimeHeader: React.FC<{
  showDescription?: boolean;
}> = ({ showDescription = false }) => {
  const intl = useIntl();
  return (
    <>
      <StyledRow isErrorRow={false} index={0}>
        <BoldLabel index={0}>
          {intl.formatMessage({ id: 'notifications.overtime.title' })}
        </BoldLabel>
      </StyledRow>
      {showDescription && (
        <StyledRow isErrorRow={false} index={1}>
          <B3 style={{ color: 'var(--ids-color-ink-300)', maxWidth: '35rem' }}>
            {intl.formatMessage({ id: 'notifications.overtime.description' })}
          </B3>
        </StyledRow>
      )}
    </>
  );
};

interface EmployerOvertimeNotificationsViewProps {
  rules: TimeTracking_OvertimeNotificationRule[];
  loading: boolean;
  hasLoadedFromApi: boolean;
}

/**
 * Read-only view of employer-level overtime notification rules.
 * Prop-driven equivalent of NotificationsOvertimeView (no Redux).
 */
const EmployerOvertimeNotificationsView: React.FC<
  EmployerOvertimeNotificationsViewProps
> = ({ rules, loading, hasLoadedFromApi }) => {
  const logger = useLoggingConfig();
  const hasRules = hasDisplayableOvertimeRules(rules);

  const hasMountLogged = useRef(false);
  useEffect(() => {
    if (hasLoadedFromApi && !hasMountLogged.current) {
      hasMountLogged.current = true;
      logger.info(EMPLOYER_OVERTIME_NOTIFICATIONS_LOGGING.VIEW_MOUNTED, {
        hasRules,
        rulesCount: rules.length,
      });
    }
  }, [hasLoadedFromApi, logger, hasRules, rules.length]);

  if (loading || !hasLoadedFromApi) {
    return (
      <OvertimeCardSection>
        <OvertimeViewStack>
          <OvertimeHeader showDescription={false} />
          <div style={{ marginTop: '1rem' }}>
            <Skeleton variant="rectangular" height={18} />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <Skeleton variant="rectangular" height={18} />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <Skeleton variant="rectangular" height={18} />
          </div>
        </OvertimeViewStack>
      </OvertimeCardSection>
    );
  }

  if (!hasRules) {
    return (
      <OvertimeEmptySection>
        <OvertimeViewStack>
          <OvertimeHeader showDescription />
        </OvertimeViewStack>
      </OvertimeEmptySection>
    );
  }

  return (
    <OvertimeCardSection>
      <OvertimeViewStack>
        <OvertimeHeader showDescription={false} />
        {hasOvertimeRuleForPeriod(rules, TimeTracking_OvertimePeriod.Day) && (
          <OvertimePeriodBlock
            titleId="notifications.overtime.daily"
            period={TimeTracking_OvertimePeriod.Day}
            rules={rules}
          />
        )}
        {hasOvertimeRuleForPeriod(rules, TimeTracking_OvertimePeriod.Week) && (
          <OvertimePeriodBlock
            titleId="notifications.overtime.weekly"
            period={TimeTracking_OvertimePeriod.Week}
            rules={rules}
          />
        )}
      </OvertimeViewStack>
    </OvertimeCardSection>
  );
};

export default EmployerOvertimeNotificationsView;
