import React, { useMemo } from 'react';
import { B2, Demi, Medium } from '@ids-ts/typography';
import { Skeleton } from '@cgds/skeleton';
import { useIntl } from '@payroll/quicksand';
import { FieldGroup } from 'src/js/widgets/userSettings/components/styles/cards.styles';
import { useAppSelector } from '../../../../store';
import {
  selectScheduleNotificationSubscriptions,
  selectScheduleNotificationsLoading,
  selectScheduleNotificationsError,
  selectHasManagerNotificationSubscription,
} from '../../../../store/slices/scheduleNotificationsSlice';
import { Section } from '../styles/NotificationsCardView.styles';
import { SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS } from '../utils/scheduleNotifications.constants';
import {
  formatScheduleRowViewValue,
  mapSubscriptionsToRowValues,
} from '../utils/scheduleNotifications.utils';
import {
  ScheduleErrorMessage,
  ScheduleNotificationFieldGroupFullWidth,
  ScheduleNotificationLabel,
  ScheduleNotificationsKv,
  ScheduleSectionContent,
} from '../styles/NotificationsSchedule.styles';

export interface NotificationsScheduleViewProps {
  loading: boolean;
}

const NotificationsScheduleView: React.FC<NotificationsScheduleViewProps> = ({
  loading: externalLoading,
}) => {
  const intl = useIntl();
  const subscriptions = useAppSelector(selectScheduleNotificationSubscriptions);
  const sliceLoading = useAppSelector(selectScheduleNotificationsLoading);
  const error = useAppSelector(selectScheduleNotificationsError);
  const showManagerNotificationRow = useAppSelector(
    selectHasManagerNotificationSubscription,
  );

  // externalLoading comes from the parent card; sliceLoading from the unified fetch in UserSettingsPage
  const isLoading = externalLoading || sliceLoading;

  const rowValues = useMemo(
    () => mapSubscriptionsToRowValues(subscriptions),
    [subscriptions],
  );

  const formatRowValue = (key: keyof typeof rowValues) =>
    formatScheduleRowViewValue(intl, rowValues[key]);

  return (
    <Section>
      <ScheduleSectionContent>
        <B2>
          <Demi>
            {intl.formatMessage({ id: 'notifications.schedule.title' })}
          </Demi>
        </B2>
        {error && <ScheduleErrorMessage>{error}</ScheduleErrorMessage>}
      </ScheduleSectionContent>

      {!error && (
        <ScheduleNotificationsKv>
          <FieldGroup>
            <ScheduleNotificationLabel>
              {intl.formatMessage({
                id: SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.SHIFT_PUBLISHED_OR_CHANGED,
              })}
            </ScheduleNotificationLabel>
            {isLoading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>{formatRowValue('shiftPublishedOrChanged')}</Medium>
              </B2>
            )}
          </FieldGroup>
          <FieldGroup>
            <ScheduleNotificationLabel>
              {intl.formatMessage({
                id: SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.ONE_HOUR_BEFORE_SHIFT,
              })}
            </ScheduleNotificationLabel>
            {isLoading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>{formatRowValue('oneHourBeforeShift')}</Medium>
              </B2>
            )}
          </FieldGroup>
          <FieldGroup>
            <ScheduleNotificationLabel>
              {intl.formatMessage({
                id: SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED,
              })}
            </ScheduleNotificationLabel>
            {isLoading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>
                  {formatRowValue('forgotClockInAfterShiftStarted')}
                </Medium>
              </B2>
            )}
          </FieldGroup>
          <FieldGroup>
            <ScheduleNotificationLabel>
              {intl.formatMessage({
                id: SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.FORGOT_CLOCK_OUT_AFTER_SHIFT_ENDED,
              })}
            </ScheduleNotificationLabel>
            {isLoading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>
                  {formatRowValue('forgotClockOutAfterShiftEnded')}
                </Medium>
              </B2>
            )}
          </FieldGroup>
          {showManagerNotificationRow && (
            <ScheduleNotificationFieldGroupFullWidth>
              <ScheduleNotificationLabel>
                {intl.formatMessage({
                  id: SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.LATE_CLOCK_IN_NOTIFY_MANAGER,
                })}
              </ScheduleNotificationLabel>
              {isLoading ? (
                <Skeleton variant="rectangular" height={18} />
              ) : (
                <B2>
                  <Medium>{formatRowValue('lateClockInNotifyManager')}</Medium>
                </B2>
              )}
            </ScheduleNotificationFieldGroupFullWidth>
          )}
        </ScheduleNotificationsKv>
      )}
    </Section>
  );
};

export default NotificationsScheduleView;
