import React from 'react';
import { B2, Demi } from '@ids-ts/typography';
import { Checkbox } from '@ids-ts/checkbox';
import { useIntl, useTracking } from '@payroll/quicksand';
import { TimeTracking_NotificationReminderMedium } from 'src/__generated__/timeTracking/graphql';
import { USER_SCHEDULE_NOTIFICATIONS_TRACKING_POINTS } from 'src/js/widgets/userSettings/utils/userScheduleNotificationsTrackingPoints';
import { useAppDispatch, useAppSelector } from '../../../../store';
import {
  selectScheduleNotificationDraftSubscriptions,
  selectHasManagerNotificationSubscription,
  toggleDraftScheduleChannel,
} from '../../../../store/slices/scheduleNotificationsSlice';
import {
  SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS,
  SCHEDULE_NOTIFICATION_USER_SETTINGS_ROW_KEYS,
  SCHEDULE_NOTIFICATION_ROW_KEY_TO_TYPE,
  SCHEDULE_NOTIFICATION_ROW_KEY_TO_TRACKING_PREFIX,
  type ScheduleNotificationUserSettingsRowKey,
} from '../utils/scheduleNotifications.constants';
import { mapSubscriptionsToRowValues } from '../utils/scheduleNotifications.utils';
import {
  NotificationCategoryHeadersRow,
  NotificationCategoryHeadersLabel,
  ScheduleNotificationCategoryRow,
  ScheduleNotificationCategoryLabel,
  CheckboxColumn,
  HeaderSpacer,
} from '../styles/NotificationsCardEdit.styles';
import {
  ScheduleSectionContent,
  ScheduleNotificationsEditSection,
} from '../styles/NotificationsSchedule.styles';

const ROW_KEY_TO_LABEL_ID: Record<
  ScheduleNotificationUserSettingsRowKey,
  string
> = {
  shiftPublishedOrChanged:
    SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.SHIFT_PUBLISHED_OR_CHANGED,
  oneHourBeforeShift:
    SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.ONE_HOUR_BEFORE_SHIFT,
  forgotClockInAfterShiftStarted:
    SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED,
  forgotClockOutAfterShiftEnded:
    SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.FORGOT_CLOCK_OUT_AFTER_SHIFT_ENDED,
  lateClockInNotifyManager:
    SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS.LATE_CLOCK_IN_NOTIFY_MANAGER,
};

const NotificationsScheduleEdit: React.FC = () => {
  const intl = useIntl();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const draftSubscriptions = useAppSelector(
    selectScheduleNotificationDraftSubscriptions,
  );
  const showManagerNotificationRow = useAppSelector(
    selectHasManagerNotificationSubscription,
  );

  const rowValues = mapSubscriptionsToRowValues(draftSubscriptions);

  const emailLabel = intl.formatMessage({ id: 'notifications.email' });
  const mobileLabel = intl.formatMessage({ id: 'notifications.mobile' });

  const renderRow = (rowKey: ScheduleNotificationUserSettingsRowKey) => {
    const notificationType = SCHEDULE_NOTIFICATION_ROW_KEY_TO_TYPE[rowKey];
    const channels = rowValues[rowKey];
    const hasEmail = channels.includes(
      TimeTracking_NotificationReminderMedium.Email,
    );
    const hasMobile = channels.includes(
      TimeTracking_NotificationReminderMedium.PushNotification,
    );

    const trackingPrefix =
      SCHEDULE_NOTIFICATION_ROW_KEY_TO_TRACKING_PREFIX[rowKey];

    return (
      <ScheduleNotificationCategoryRow key={rowKey}>
        <ScheduleNotificationCategoryLabel>
          {intl.formatMessage({ id: ROW_KEY_TO_LABEL_ID[rowKey] })}
        </ScheduleNotificationCategoryLabel>
        <CheckboxColumn>
          <Checkbox
            checked={hasEmail}
            onChange={() => {
              track(
                USER_SCHEDULE_NOTIFICATIONS_TRACKING_POINTS[
                  `${trackingPrefix}_EMAIL_${hasEmail ? 'OFF' : 'ON'}`
                ],
              );
              dispatch(
                toggleDraftScheduleChannel({
                  notificationType,
                  medium: TimeTracking_NotificationReminderMedium.Email,
                }),
              );
            }}
            aria-label={`${intl.formatMessage({
              id: ROW_KEY_TO_LABEL_ID[rowKey],
            })} ${emailLabel}`}
          />
        </CheckboxColumn>
        <CheckboxColumn>
          <Checkbox
            checked={hasMobile}
            onChange={() => {
              track(
                USER_SCHEDULE_NOTIFICATIONS_TRACKING_POINTS[
                  `${trackingPrefix}_MOBILE_${hasMobile ? 'OFF' : 'ON'}`
                ],
              );
              dispatch(
                toggleDraftScheduleChannel({
                  notificationType,
                  medium:
                    TimeTracking_NotificationReminderMedium.PushNotification,
                }),
              );
            }}
            aria-label={`${intl.formatMessage({
              id: ROW_KEY_TO_LABEL_ID[rowKey],
            })} ${mobileLabel}`}
          />
        </CheckboxColumn>
      </ScheduleNotificationCategoryRow>
    );
  };

  return (
    <ScheduleNotificationsEditSection>
      <B2>
        <Demi>
          {intl.formatMessage({ id: 'notifications.schedule.title' })}
        </Demi>
      </B2>

      <ScheduleSectionContent>
        <NotificationCategoryHeadersRow>
          <HeaderSpacer />
          <NotificationCategoryHeadersLabel>
            {emailLabel}
          </NotificationCategoryHeadersLabel>
          <NotificationCategoryHeadersLabel>
            {mobileLabel}
          </NotificationCategoryHeadersLabel>
        </NotificationCategoryHeadersRow>

        {SCHEDULE_NOTIFICATION_USER_SETTINGS_ROW_KEYS.filter(
          (rowKey) =>
            rowKey !== 'lateClockInNotifyManager' || showManagerNotificationRow,
        ).map((rowKey) => renderRow(rowKey))}
      </ScheduleSectionContent>
    </ScheduleNotificationsEditSection>
  );
};

export default NotificationsScheduleEdit;
