import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import TextField from '@ids-ts/text-field';
import { B2 } from '@ids-ts/typography';
import { Checkbox } from '@ids-ts/checkbox';
import { Skeleton } from '@cgds/skeleton';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_OvertimeNotificationRule,
  TimeTracking_OvertimePeriod,
} from 'src/__generated__/timeTracking/graphql';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  createDefaultOvertimeRule,
  getOvertimePeriodPhraseInSentence,
  getOvertimeRuleForPeriod,
  isMediumEnabled,
  patchOvertimeRule,
  removeRuleForPeriod,
  toggleMedium,
  upsertRuleForPeriod,
} from 'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/overtimeNotifications.utils';
import { EMPLOYER_OVERTIME_NOTIFICATIONS_LOGGING } from 'src/js/widgets/timeTrackingSettings/loggingConstants';
import {
  OVERTIME_NOTIFICATION_TRACKING_POINTS,
  OVERTIME_NOTIFICATION_DAILY_FIELD_TRACKING_POINTS,
  OVERTIME_NOTIFICATION_DAILY_RECIPIENT_TRACKING_POINTS,
  OVERTIME_NOTIFICATION_WEEKLY_FIELD_TRACKING_POINTS,
  OVERTIME_NOTIFICATION_WEEKLY_RECIPIENT_TRACKING_POINTS,
  OvertimeTrackingPoint,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeTrackingPoints';
import {
  OvertimeEditCheckboxContent,
  OvertimeEditFormLabelContainer,
  OvertimeEditFormLabelWrapper,
  OvertimeEditFormRow,
  OvertimeEditNotificationCategoryHeadersRow,
  OvertimeEditNotificationCategoryRow,
  OvertimeEditPeriodRuleBlock,
  OvertimeEditPeriodToggleRow,
  OvertimeEditSectionContainer,
  OvertimeEditSectionHeader,
  OvertimeEditSendAlertsToContainer,
  OvertimeEditSendAlertsToLabelWrapper,
  OvertimeEditTextFieldWrapper,
  OvertimeEditThresholdInputContainer,
} from 'src/js/widgets/userSettings/components/cards/NotificationsCard/styles/NotificationsOvertime.styles';

import { OVERTIME_VALIDATION } from 'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/overtimeValidation.constants';

type RoleKey = 'admin' | 'groupManager' | 'employee';

interface RecipientCheckboxTrackingPoints {
  emailOn: OvertimeTrackingPoint;
  emailOff: OvertimeTrackingPoint;
  mobileOn: OvertimeTrackingPoint;
  mobileOff: OvertimeTrackingPoint;
}

interface FieldTrackingPoints {
  hours: OvertimeTrackingPoint;
  minutes: OvertimeTrackingPoint;
  totalAlerts: OvertimeTrackingPoint;
  frequency: OvertimeTrackingPoint;
}

const RecipientRow: React.FC<{
  rule: TimeTracking_OvertimeNotificationRule;
  role: RoleKey;
  titleId: string;
  emailAria: string;
  mobileAria: string;
  onPatch: (next: TimeTracking_OvertimeNotificationRule) => void;
  trackingPoints?: RecipientCheckboxTrackingPoints;
}> = ({
  rule,
  role,
  titleId,
  emailAria,
  mobileAria,
  onPatch,
  trackingPoints,
}) => {
  const intl = useIntl();
  const track = useTracking();

  const toggleRecipient = (
    medium: TimeTracking_NotificationReminderMedium,
    enabled: boolean,
  ) => {
    if (trackingPoints) {
      const isEmail = medium === TimeTracking_NotificationReminderMedium.Email;
      let tp;
      if (isEmail) {
        tp = enabled ? trackingPoints.emailOn : trackingPoints.emailOff;
      } else {
        tp = enabled ? trackingPoints.mobileOn : trackingPoints.mobileOff;
      }
      track(tp);
    }
    const nextList = toggleMedium(rule.recipients[role], medium, enabled);
    onPatch(patchOvertimeRule(rule, { recipients: { [role]: nextList } }));
  };

  return (
    <OvertimeEditNotificationCategoryRow>
      <B2>{intl.formatMessage({ id: titleId })}</B2>
      <OvertimeEditCheckboxContent>
        <Checkbox
          checked={isMediumEnabled(
            rule.recipients[role],
            TimeTracking_NotificationReminderMedium.Email,
          )}
          onChange={() =>
            toggleRecipient(
              TimeTracking_NotificationReminderMedium.Email,
              !isMediumEnabled(
                rule.recipients[role],
                TimeTracking_NotificationReminderMedium.Email,
              ),
            )
          }
          aria-label={emailAria}
        />
      </OvertimeEditCheckboxContent>
      <OvertimeEditCheckboxContent>
        <Checkbox
          checked={isMediumEnabled(
            rule.recipients[role],
            TimeTracking_NotificationReminderMedium.PushNotification,
          )}
          onChange={() =>
            toggleRecipient(
              TimeTracking_NotificationReminderMedium.PushNotification,
              !isMediumEnabled(
                rule.recipients[role],
                TimeTracking_NotificationReminderMedium.PushNotification,
              ),
            )
          }
          aria-label={mobileAria}
        />
      </OvertimeEditCheckboxContent>
    </OvertimeEditNotificationCategoryRow>
  );
};

const OvertimeRuleFields: React.FC<{
  rule: TimeTracking_OvertimeNotificationRule;
  onPatch: (next: TimeTracking_OvertimeNotificationRule) => void;
  ruleKey: string;
  fieldTrackingPoints?: FieldTrackingPoints;
  recipientTrackingPoints?: {
    admin: RecipientCheckboxTrackingPoints;
    groupManager: RecipientCheckboxTrackingPoints;
    employee: RecipientCheckboxTrackingPoints;
  };
}> = ({
  rule,
  onPatch,
  ruleKey,
  fieldTrackingPoints,
  recipientTrackingPoints,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const periodPhrase = getOvertimePeriodPhraseInSentence(
    intl,
    rule.threshold.period,
  );

  const isDaily = rule.threshold.period === TimeTracking_OvertimePeriod.Day;
  const hoursLimits = isDaily
    ? OVERTIME_VALIDATION.threshold.hours.daily
    : OVERTIME_VALIDATION.threshold.hours.weekly;
  const minutesLimits = OVERTIME_VALIDATION.threshold.minutes;
  const totalAlertsLimits = OVERTIME_VALIDATION.alertFrequency.totalAlerts;
  const intervalLimits = OVERTIME_VALIDATION.alertFrequency.intervalMinutes;

  const setThreshold = (
    field: 'hours' | 'minutes',
    raw: string,
    min: number,
    max: number,
  ) => {
    if (fieldTrackingPoints) {
      track(
        field === 'hours'
          ? fieldTrackingPoints.hours
          : fieldTrackingPoints.minutes,
      );
    }
    const n = Math.min(max, Math.max(min, parseInt(raw, 10) || min));
    onPatch(patchOvertimeRule(rule, { threshold: { [field]: n } }));
  };

  const setFrequency = (
    field: 'totalAlerts' | 'intervalMinutes',
    raw: string,
    min: number,
    max: number,
  ) => {
    if (fieldTrackingPoints) {
      track(
        field === 'totalAlerts'
          ? fieldTrackingPoints.totalAlerts
          : fieldTrackingPoints.frequency,
      );
    }
    const n = Math.min(max, Math.max(min, parseInt(raw, 10) || min));
    onPatch(patchOvertimeRule(rule, { alertFrequency: { [field]: n } }));
  };

  // Validation helpers
  const hours = rule.threshold.hours ?? 0;
  const minutes = rule.threshold.minutes ?? 0;
  const totalAlerts = rule.alertFrequency.totalAlerts ?? 0;
  const intervalMinutes = rule.alertFrequency.intervalMinutes ?? 0;

  const getHoursError = () => {
    if (hours < hoursLimits.min || hours > hoursLimits.max) {
      return intl.formatMessage({
        id: isDaily
          ? 'notifications.overtime.validation.hours.daily.error'
          : 'notifications.overtime.validation.hours.weekly.error',
      });
    }
    return undefined;
  };

  const getMinutesError = () => {
    if (minutes < minutesLimits.min || minutes > minutesLimits.max) {
      return intl.formatMessage({
        id: 'notifications.overtime.validation.minutes.error',
      });
    }
    return undefined;
  };

  const getTotalAlertsError = () => {
    if (
      totalAlerts < totalAlertsLimits.min ||
      totalAlerts > totalAlertsLimits.max
    ) {
      return intl.formatMessage({
        id: 'notifications.overtime.validation.totalAlerts.error',
      });
    }
    return undefined;
  };

  const getIntervalError = () => {
    if (
      intervalMinutes < intervalLimits.min ||
      intervalMinutes > intervalLimits.max
    ) {
      return intl.formatMessage({
        id: 'notifications.overtime.validation.intervalMinutes.error',
      });
    }
    return undefined;
  };

  return (
    <>
      <OvertimeEditFormRow>
        <OvertimeEditFormLabelContainer>
          <OvertimeEditFormLabelWrapper>
            <B2>
              {intl.formatMessage({
                id: 'notifications.overtime.threshold.question',
              })}
            </B2>
          </OvertimeEditFormLabelWrapper>
          <OvertimeEditThresholdInputContainer>
            <OvertimeEditTextFieldWrapper>
              <TextField
                type="number"
                min={hoursLimits.min}
                max={hoursLimits.max}
                value={rule.threshold.hours?.toString() ?? '0'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setThreshold(
                    'hours',
                    e.target.value,
                    hoursLimits.min,
                    hoursLimits.max,
                  )
                }
                errorText={getHoursError()}
                aria-label={`overtime-threshold-hours-${ruleKey}`}
              />
            </OvertimeEditTextFieldWrapper>
            <B2>
              {intl.formatMessage({ id: 'notifications.overtime.hours' })}
            </B2>
            <OvertimeEditTextFieldWrapper>
              <TextField
                type="number"
                min={minutesLimits.min}
                max={minutesLimits.max}
                value={rule.threshold.minutes?.toString() ?? '0'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setThreshold(
                    'minutes',
                    e.target.value,
                    minutesLimits.min,
                    minutesLimits.max,
                  )
                }
                errorText={getMinutesError()}
                aria-label={`overtime-threshold-minutes-${ruleKey}`}
              />
            </OvertimeEditTextFieldWrapper>
            <B2 as="span">
              {intl.formatMessage({
                id: 'notifications.overtime.minutes.per',
              })}{' '}
              {periodPhrase}
            </B2>
          </OvertimeEditThresholdInputContainer>
        </OvertimeEditFormLabelContainer>
      </OvertimeEditFormRow>

      <OvertimeEditFormRow>
        <OvertimeEditFormLabelContainer>
          <OvertimeEditFormLabelWrapper>
            <B2>
              {intl.formatMessage({
                id: 'notifications.overtime.after.threshold.edit',
              })}
            </B2>
          </OvertimeEditFormLabelWrapper>
          <OvertimeEditThresholdInputContainer>
            <OvertimeEditTextFieldWrapper>
              <TextField
                type="number"
                min={totalAlertsLimits.min}
                max={totalAlertsLimits.max}
                value={rule.alertFrequency.totalAlerts?.toString() ?? '0'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFrequency(
                    'totalAlerts',
                    e.target.value,
                    totalAlertsLimits.min,
                    totalAlertsLimits.max,
                  )
                }
                errorText={getTotalAlertsError()}
                aria-label={`overtime-total-alerts-${ruleKey}`}
              />
            </OvertimeEditTextFieldWrapper>
            <B2>
              {intl.formatMessage({
                id: 'notifications.overtime.total.alerts',
              })}
            </B2>
            <OvertimeEditTextFieldWrapper>
              <TextField
                type="number"
                min={intervalLimits.min}
                max={intervalLimits.max}
                value={rule.alertFrequency.intervalMinutes?.toString() ?? '0'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFrequency(
                    'intervalMinutes',
                    e.target.value,
                    intervalLimits.min,
                    intervalLimits.max,
                  )
                }
                errorText={getIntervalError()}
                aria-label={`overtime-alert-interval-${ruleKey}`}
              />
            </OvertimeEditTextFieldWrapper>
            <B2>
              {intl.formatMessage({
                id: 'notifications.overtime.minutes.unit',
              })}
            </B2>
          </OvertimeEditThresholdInputContainer>
        </OvertimeEditFormLabelContainer>
      </OvertimeEditFormRow>

      <OvertimeEditSendAlertsToContainer>
        <OvertimeEditSendAlertsToLabelWrapper>
          <B2>
            {intl.formatMessage({ id: 'notifications.overtime.send.to' })}
          </B2>
        </OvertimeEditSendAlertsToLabelWrapper>

        <OvertimeEditNotificationCategoryHeadersRow>
          <div />
          <B2>{intl.formatMessage({ id: 'notifications.email' })}</B2>
          <B2>{intl.formatMessage({ id: 'notifications.mobile' })}</B2>
        </OvertimeEditNotificationCategoryHeadersRow>

        <RecipientRow
          rule={rule}
          role="admin"
          titleId="notifications.overtime.admin"
          emailAria={`overtime-admin-email-${ruleKey}`}
          mobileAria={`overtime-admin-mobile-${ruleKey}`}
          onPatch={onPatch}
          trackingPoints={recipientTrackingPoints?.admin}
        />
        <RecipientRow
          rule={rule}
          role="groupManager"
          titleId="notifications.overtime.group.leads"
          emailAria={`overtime-group-leads-email-${ruleKey}`}
          mobileAria={`overtime-group-leads-mobile-${ruleKey}`}
          onPatch={onPatch}
          trackingPoints={recipientTrackingPoints?.groupManager}
        />
        <RecipientRow
          rule={rule}
          role="employee"
          titleId="notifications.overtime.employees"
          emailAria={`overtime-employees-email-${ruleKey}`}
          mobileAria={`overtime-employees-mobile-${ruleKey}`}
          onPatch={onPatch}
          trackingPoints={recipientTrackingPoints?.employee}
        />
      </OvertimeEditSendAlertsToContainer>
    </>
  );
};

export interface EmployerOvertimeNotificationsEditProps {
  draftRules: TimeTracking_OvertimeNotificationRule[];
  loading: boolean;
  hasLoadedFromApi: boolean;
  onDraftRulesChange: (rules: TimeTracking_OvertimeNotificationRule[]) => void;
}

/**
 * Edit form for employer-level overtime notification rules.
 * Prop-driven equivalent of NotificationsOvertimeEdit (no Redux).
 * Uses draftRules/onDraftRulesChange instead of Redux dispatch.
 */
const EmployerOvertimeNotificationsEdit: React.FC<
  EmployerOvertimeNotificationsEditProps
> = ({ draftRules, loading, hasLoadedFromApi, onDraftRulesChange }) => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const track = useTracking();

  const dayRule = getOvertimeRuleForPeriod(
    draftRules,
    TimeTracking_OvertimePeriod.Day,
  );
  const weekRule = getOvertimeRuleForPeriod(
    draftRules,
    TimeTracking_OvertimePeriod.Week,
  );

  const [isDailyPanelOpen, setIsDailyPanelOpen] = useState(() =>
    Boolean(dayRule),
  );
  const [isWeeklyPanelOpen, setIsWeeklyPanelOpen] = useState(() =>
    Boolean(weekRule),
  );

  const hasMountLogged = useRef(false);
  useEffect(() => {
    if (hasLoadedFromApi && !hasMountLogged.current) {
      hasMountLogged.current = true;
      logger.info(EMPLOYER_OVERTIME_NOTIFICATIONS_LOGGING.EDIT_MOUNTED, {
        hasDailyRule: !!dayRule,
        hasWeeklyRule: !!weekRule,
      });
    }
  }, [hasLoadedFromApi, logger, dayRule, weekRule]);

  const patchRuleForPeriod = useCallback(
    (
      period:
        | TimeTracking_OvertimePeriod.Day
        | TimeTracking_OvertimePeriod.Week,
      patched: TimeTracking_OvertimeNotificationRule,
    ) => {
      onDraftRulesChange(upsertRuleForPeriod(draftRules, period, patched));
    },
    [draftRules, onDraftRulesChange],
  );

  const toggleDailyPanel = useCallback(() => {
    const isOpen = Boolean(
      getOvertimeRuleForPeriod(draftRules, TimeTracking_OvertimePeriod.Day),
    );
    logger.info(EMPLOYER_OVERTIME_NOTIFICATIONS_LOGGING.DAILY_PANEL_TOGGLED, {
      enabled: !isOpen,
    });
    track(
      isOpen
        ? OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_OFF
        : OVERTIME_NOTIFICATION_TRACKING_POINTS.DAILY_ON,
    );
    if (isOpen) {
      setIsDailyPanelOpen(false);
      onDraftRulesChange(
        removeRuleForPeriod(draftRules, TimeTracking_OvertimePeriod.Day),
      );
    } else {
      setIsDailyPanelOpen(true);
      if (
        !getOvertimeRuleForPeriod(draftRules, TimeTracking_OvertimePeriod.Day)
      ) {
        onDraftRulesChange(
          upsertRuleForPeriod(
            draftRules,
            TimeTracking_OvertimePeriod.Day,
            createDefaultOvertimeRule(TimeTracking_OvertimePeriod.Day),
          ),
        );
      }
    }
  }, [draftRules, logger, track, onDraftRulesChange]);

  const toggleWeeklyPanel = useCallback(() => {
    const isOpen = Boolean(
      getOvertimeRuleForPeriod(draftRules, TimeTracking_OvertimePeriod.Week),
    );
    logger.info(EMPLOYER_OVERTIME_NOTIFICATIONS_LOGGING.WEEKLY_PANEL_TOGGLED, {
      enabled: !isOpen,
    });
    track(
      isOpen
        ? OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_OFF
        : OVERTIME_NOTIFICATION_TRACKING_POINTS.WEEKLY_ON,
    );
    if (isOpen) {
      setIsWeeklyPanelOpen(false);
      onDraftRulesChange(
        removeRuleForPeriod(draftRules, TimeTracking_OvertimePeriod.Week),
      );
    } else {
      setIsWeeklyPanelOpen(true);
      if (
        !getOvertimeRuleForPeriod(draftRules, TimeTracking_OvertimePeriod.Week)
      ) {
        onDraftRulesChange(
          upsertRuleForPeriod(
            draftRules,
            TimeTracking_OvertimePeriod.Week,
            createDefaultOvertimeRule(TimeTracking_OvertimePeriod.Week),
          ),
        );
      }
    }
  }, [draftRules, logger, track, onDraftRulesChange]);

  if (loading || !hasLoadedFromApi) {
    return (
      <OvertimeEditSectionContainer>
        <OvertimeEditSectionHeader>
          {intl.formatMessage({ id: 'notifications.overtime.title' })}
        </OvertimeEditSectionHeader>
        <div style={{ marginTop: '1rem' }}>
          <Skeleton variant="rectangular" height={18} />
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <Skeleton variant="rectangular" height={18} />
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <Skeleton variant="rectangular" height={18} />
        </div>
      </OvertimeEditSectionContainer>
    );
  }

  return (
    <OvertimeEditSectionContainer>
      <OvertimeEditSectionHeader>
        {intl.formatMessage({ id: 'notifications.overtime.title' })}
      </OvertimeEditSectionHeader>

      <OvertimeEditPeriodToggleRow>
        <Checkbox checked={isDailyPanelOpen} onChange={toggleDailyPanel}>
          {intl.formatMessage({ id: 'notifications.overtime.daily' })}
        </Checkbox>
      </OvertimeEditPeriodToggleRow>

      {isDailyPanelOpen && dayRule && (
        <OvertimeEditPeriodRuleBlock>
          <OvertimeRuleFields
            rule={dayRule}
            ruleKey="day"
            onPatch={(patched) =>
              patchRuleForPeriod(TimeTracking_OvertimePeriod.Day, patched)
            }
            fieldTrackingPoints={
              OVERTIME_NOTIFICATION_DAILY_FIELD_TRACKING_POINTS
            }
            recipientTrackingPoints={
              OVERTIME_NOTIFICATION_DAILY_RECIPIENT_TRACKING_POINTS
            }
          />
        </OvertimeEditPeriodRuleBlock>
      )}

      <OvertimeEditPeriodToggleRow>
        <Checkbox checked={isWeeklyPanelOpen} onChange={toggleWeeklyPanel}>
          {intl.formatMessage({ id: 'notifications.overtime.weekly' })}
        </Checkbox>
      </OvertimeEditPeriodToggleRow>

      {isWeeklyPanelOpen && weekRule && (
        <OvertimeEditPeriodRuleBlock>
          <OvertimeRuleFields
            rule={weekRule}
            ruleKey="week"
            onPatch={(patched) =>
              patchRuleForPeriod(TimeTracking_OvertimePeriod.Week, patched)
            }
            fieldTrackingPoints={
              OVERTIME_NOTIFICATION_WEEKLY_FIELD_TRACKING_POINTS
            }
            recipientTrackingPoints={
              OVERTIME_NOTIFICATION_WEEKLY_RECIPIENT_TRACKING_POINTS
            }
          />
        </OvertimeEditPeriodRuleBlock>
      )}
    </OvertimeEditSectionContainer>
  );
};

export default EmployerOvertimeNotificationsEdit;
