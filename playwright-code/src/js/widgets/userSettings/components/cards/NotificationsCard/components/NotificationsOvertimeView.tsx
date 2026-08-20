import React, { useEffect, useRef } from 'react';
import { B2, B4, Demi, Medium } from '@ids-ts/typography';
import { Skeleton } from '@cgds/skeleton';
import { useIntl } from '@payroll/quicksand';
import { renderTitleWithBadge } from 'src/js/hooks/useRenderTitleWithBadge';
import { FieldGroup } from 'src/js/widgets/userSettings/components/styles/cards.styles';
import { TimeTracking_OvertimePeriod } from 'src/__generated__/timeTracking/graphql';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { USER_SETTINGS_OVERTIME_NOTIFICATIONS_LOGGING } from 'src/js/widgets/userSettings/constants/loggingConstants';
import { useAppSelector } from '../../../../store';
import {
  selectOvertimeNotificationRules,
  selectOvertimeNotificationsError,
  selectOvertimeNotificationsHasLoadedFromApi,
  selectOvertimeNotificationsLoading,
} from '../../../../store/slices/overtimeNotificationsSlice';
import { KV } from '../styles/NotificationsCardView.styles';
import {
  OvertimeCardSection,
  OvertimeEmptySection,
  OvertimePeriodSection,
  OvertimeTitleBlock,
  OvertimeViewStack,
} from '../styles/NotificationsOvertime.styles';
import {
  formatOvertimeFrequencyView,
  formatOvertimeRecipientsView,
  formatOvertimeThresholdView,
  getOvertimeRuleForPeriod,
  hasDisplayableOvertimeRules,
  hasOvertimeRuleForPeriod,
} from '../utils/overtimeNotifications.utils';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <B4 style={{ color: '#6b7177' }}>
    <Demi>{children}</Demi>
  </B4>
);

const OvertimePeriodBlock: React.FC<{
  titleId: string;
  period: TimeTracking_OvertimePeriod.Day | TimeTracking_OvertimePeriod.Week;
}> = ({ titleId, period }) => {
  const intl = useIntl();
  const rules = useAppSelector(selectOvertimeNotificationRules);
  const loading = useAppSelector(selectOvertimeNotificationsLoading);
  const rule = getOvertimeRuleForPeriod(rules, period);

  return (
    <OvertimePeriodSection>
      <B2 weight={600}>
        <Demi>{intl.formatMessage({ id: titleId })}</Demi>
      </B2>
      <KV>
        <FieldGroup>
          <Label>
            {intl.formatMessage({
              id: 'notifications.overtime.threshold.question',
            })}
          </Label>
          {loading ? (
            <Skeleton variant="rectangular" height={18} />
          ) : (
            <B2>
              <Medium>{formatOvertimeThresholdView(intl, rule)}</Medium>
            </B2>
          )}
        </FieldGroup>
        <FieldGroup>
          <Label>
            {intl.formatMessage({
              id: 'notifications.overtime.after.threshold',
            })}
          </Label>
          {loading ? (
            <Skeleton variant="rectangular" height={18} />
          ) : (
            <B2>
              <Medium>{formatOvertimeFrequencyView(intl, rule)}</Medium>
            </B2>
          )}
        </FieldGroup>
        <FieldGroup style={{ gridColumn: '1 / -1' }}>
          <Label>
            {intl.formatMessage({ id: 'notifications.overtime.send.alerts' })}
          </Label>
          {loading ? (
            <Skeleton variant="rectangular" height={18} />
          ) : (
            <B2>
              <Medium>{formatOvertimeRecipientsView(intl, rule)}</Medium>
            </B2>
          )}
        </FieldGroup>
      </KV>
    </OvertimePeriodSection>
  );
};

/** Intro copy is only for the empty state; hide it when Day/Week rules exist. */
const OvertimeHeader: React.FC<{
  showDescription?: boolean;
  overtimeBadgeVisibilityEndDate?: string;
}> = ({ showDescription = false, overtimeBadgeVisibilityEndDate = '' }) => {
  const intl = useIntl();

  const titleWithBadge = renderTitleWithBadge({
    title: 'notifications.overtime.title',
    isNew: true,
    isNewVisibleTill: overtimeBadgeVisibilityEndDate,
    intl,
  });

  return (
    <OvertimeTitleBlock>
      <B2 weight={600}>
        <Demi>{titleWithBadge}</Demi>
      </B2>
      {showDescription && (
        <B4 style={{ color: '#6b7177', marginTop: 8, maxWidth: 560 }}>
          {intl.formatMessage({ id: 'notifications.overtime.description' })}
        </B4>
      )}
    </OvertimeTitleBlock>
  );
};

/**
 * Read-only overtime: empty state (title + copy + divider) when API returns no rules;
 * Daily/Weekly details only when at least one rule exists.
 */
interface NotificationsOvertimeViewProps {
  overtimeBadgeVisibilityEndDate?: string;
}

const NotificationsOvertimeView: React.FC<NotificationsOvertimeViewProps> = ({
  overtimeBadgeVisibilityEndDate = '',
}) => {
  const logger = useLoggingConfig();
  const rules = useAppSelector(selectOvertimeNotificationRules);
  const loading = useAppSelector(selectOvertimeNotificationsLoading);
  const hasLoadedFromApi = useAppSelector(
    selectOvertimeNotificationsHasLoadedFromApi,
  );
  const error = useAppSelector(selectOvertimeNotificationsError);

  const hasRules = hasDisplayableOvertimeRules(rules);

  const hasMountLogged = useRef(false);
  useEffect(() => {
    if (hasLoadedFromApi && !hasMountLogged.current) {
      hasMountLogged.current = true;
      logger.info(USER_SETTINGS_OVERTIME_NOTIFICATIONS_LOGGING.VIEW_MOUNTED, {
        hasRules,
        hasError: !!error,
      });
    }
  }, [hasLoadedFromApi, logger, hasRules, error]);

  if (loading || !hasLoadedFromApi) {
    return (
      <OvertimeCardSection>
        <OvertimeViewStack>
          <OvertimeHeader
            showDescription={false}
            overtimeBadgeVisibilityEndDate={overtimeBadgeVisibilityEndDate}
          />
          <div style={{ marginTop: 16 }}>
            <Skeleton variant="rectangular" height={18} />
          </div>
          <div style={{ marginTop: 8 }}>
            <Skeleton variant="rectangular" height={18} />
          </div>
          <div style={{ marginTop: 8 }}>
            <Skeleton variant="rectangular" height={18} />
          </div>
        </OvertimeViewStack>
      </OvertimeCardSection>
    );
  }

  // API loaded with no day/week rules — setup copy only (no “Not configured” rows).
  if (!hasRules) {
    return (
      <OvertimeEmptySection>
        <OvertimeViewStack>
          <OvertimeHeader
            showDescription
            overtimeBadgeVisibilityEndDate={overtimeBadgeVisibilityEndDate}
          />
          {error && <B4 style={{ color: '#c43d3d', marginTop: 8 }}>{error}</B4>}
        </OvertimeViewStack>
      </OvertimeEmptySection>
    );
  }

  return (
    <OvertimeCardSection>
      <OvertimeViewStack>
        <OvertimeHeader
          showDescription={false}
          overtimeBadgeVisibilityEndDate={overtimeBadgeVisibilityEndDate}
        />
        {error && <B4 style={{ color: '#c43d3d', marginTop: 8 }}>{error}</B4>}
        {hasOvertimeRuleForPeriod(rules, TimeTracking_OvertimePeriod.Day) && (
          <OvertimePeriodBlock
            titleId="notifications.overtime.daily"
            period={TimeTracking_OvertimePeriod.Day}
          />
        )}
        {hasOvertimeRuleForPeriod(rules, TimeTracking_OvertimePeriod.Week) && (
          <OvertimePeriodBlock
            titleId="notifications.overtime.weekly"
            period={TimeTracking_OvertimePeriod.Week}
          />
        )}
      </OvertimeViewStack>
    </OvertimeCardSection>
  );
};

export default NotificationsOvertimeView;
