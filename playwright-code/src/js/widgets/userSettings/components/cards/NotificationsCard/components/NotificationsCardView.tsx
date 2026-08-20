import React from 'react';
import { B1, B2, B4, Demi, Medium } from '@ids-ts/typography';
import { IconControl } from '@ids-ts/icon-control';
import { Edit } from '@design-systems/icons';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Skeleton } from '@cgds/skeleton';
import {
  HeaderRow,
  Actions,
  FieldGroup,
} from 'src/js/widgets/userSettings/components/styles/cards.styles';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import { WORKER_NOTIFICATIONS_CARD_TRACKING_POINTS } from 'src/js/widgets/userSettings/utils/userSettingsTrackingPoints';
import { useAppDispatch, useAppSelector } from '../../../../store';
import {
  setMode,
  selectNotificationsSettings,
  selectNotificationsLoading,
} from '../../../../store/slices/notificationsSlice';
import { NotificationsCardMode } from '../types/NotificationsCard.types';
import { Section, KV } from '../styles/NotificationsCardView.styles';
import {
  getNotificationStatus,
  formatDaysOfWeek,
} from '../utils/NotificationsCard.utils';
import NotificationsOvertimeView from './NotificationsOvertimeView';
import NotificationsScheduleView from './NotificationsScheduleView';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <B4 style={{ color: 'var(--color-text-secondary)' }}>
    <Demi>{children}</Demi>
  </B4>
);

interface NotificationsCardViewProps {
  showActions?: boolean;
  showSuccessToast?: boolean;
  onCloseSuccessToast?: () => void;
  /** When false, overtime alert (daily/weekly) block is hidden (QB_OVERTIME_SETTINGS_UI). */
  showOvertimeNotificationsSection?: boolean;
  overtimeBadgeVisibilityEndDate?: string;
  /**
   * Schedule notification rows (view) — QB_TIME_ENABLE_SCHEDULE_SETTINGS; same gate as Schedules card.
   */
  showScheduleNotificationsSection?: boolean;
}

const NotificationsCardView: React.FC<NotificationsCardViewProps> = ({
  showActions = true,
  showSuccessToast = false,
  onCloseSuccessToast,
  showOvertimeNotificationsSection = false,
  overtimeBadgeVisibilityEndDate = '',
  showScheduleNotificationsSection = false,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectNotificationsSettings);
  const loading = useAppSelector(selectNotificationsLoading);

  const handleEditClick = () => {
    sandbox.logger.info(
      'Component=NotificationsCardView Event=Switching to edit mode',
    );
    track(WORKER_NOTIFICATIONS_CARD_TRACKING_POINTS.WORKER_NOTIF_EDIT);
    dispatch(setMode(NotificationsCardMode.EDIT));
  };

  const handleCloseSuccessToast = () => {
    onCloseSuccessToast?.();
  };

  return (
    <div>
      <HeaderRow>
        <B1>
          <Medium>{intl.formatMessage({ id: 'notifications.title' })}</Medium>
        </B1>
        {showActions && (
          <Actions>
            <IconControl
              disabled={loading}
              onClick={handleEditClick}
              aria-label="edit-notifications"
            >
              <Edit />
            </IconControl>
          </Actions>
        )}
      </HeaderRow>

      {/* TODO: Enable this once the settings are available from the API */}
      {/* <FieldGroup>
        <Label>
          {intl.formatMessage({ id: 'notifications.company.settings' })}
        </Label>
        {loading ? (
          <Skeleton variant="rectangular" height={18} />
        ) : (
          <B2>
            <Medium>
              {settings.notificationSetting === 'company'
                ? intl.formatMessage({ id: 'notifications.custom.rules.on' })
                : intl.formatMessage({ id: 'notifications.custom.rules.off' })}
            </Medium>
          </B2>
        )}
      </FieldGroup> */}

      <Section>
        <B2 weight={600}>
          <Demi>
            {intl.formatMessage({ id: 'notifications.reminders.title' })}
          </Demi>
        </B2>
        <KV>
          <FieldGroup>
            <Label>
              {intl.formatMessage({ id: 'notifications.reminders.clockin' })}
            </Label>
            {loading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>
                  {getNotificationStatus(
                    intl,
                    settings.clockInEmail,
                    settings.clockInMobile,
                    settings.clockInTime,
                  )}
                </Medium>
              </B2>
            )}
          </FieldGroup>
          <FieldGroup>
            <Label>
              {intl.formatMessage({ id: 'notifications.reminders.clockout' })}
            </Label>
            {loading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>
                  {getNotificationStatus(
                    intl,
                    settings.clockOutEmail,
                    settings.clockOutMobile,
                    settings.clockOutTime,
                  )}
                </Medium>
              </B2>
            )}
          </FieldGroup>
          <FieldGroup>
            <Label>
              {intl.formatMessage({ id: 'notifications.reminders.days' })}
            </Label>
            {loading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>{formatDaysOfWeek(intl, settings.daysOfWeek)}</Medium>
              </B2>
            )}
          </FieldGroup>
          {/* TODO: Enable this once the settings are available from the API */}
          {/* <FieldGroup>
            <Label>
              {intl.formatMessage({ id: 'notifications.reminders.adjust' })}
            </Label>
            {loading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>{settings.adjustNotification}</Medium>
              </B2>
            )}
          </FieldGroup>
          <FieldGroup>
            <Label>
              {intl.formatMessage({ id: 'notifications.reminders.notes' })}
            </Label>
            {loading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>{settings.notesNotification}</Medium>
              </B2>
            )}
          </FieldGroup> */}
        </KV>
      </Section>

      {showScheduleNotificationsSection && (
        <NotificationsScheduleView loading={loading} />
      )}

      {showOvertimeNotificationsSection && (
        <NotificationsOvertimeView
          overtimeBadgeVisibilityEndDate={overtimeBadgeVisibilityEndDate}
        />
      )}

      {/* TODO: Enable this once the settings are available from the API */}
      {/* <Section>
        <B2 weight={600}>
          <Demi>
            {intl.formatMessage({ id: 'notifications.schedule.title' })}
          </Demi>
        </B2>
        <KV>
          <FieldGroup>
            <Label>
              {intl.formatMessage({
                id: 'notifications.schedule.shift.published',
              })}
            </Label>
            {loading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>
                  {getNotificationStatus(
                    intl,
                    settings.scheduleEmail,
                    settings.scheduleMobile,
                  )}
                </Medium>
              </B2>
            )}
          </FieldGroup>
          <FieldGroup>
            <Label>
              {intl.formatMessage({
                id: 'notifications.schedule.shift.reminder',
              })}
            </Label>
            {loading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>
                  {getNotificationStatus(
                    intl,
                    settings.shiftReminderEmail,
                    settings.shiftReminderMobile,
                  )}
                </Medium>
              </B2>
            )}
          </FieldGroup>
        </KV>
      </Section> */}

      {/* TODO: Enable this once the settings are available from the API */}
      {/* <Section>
        <B2 weight={600}>
          <Demi>
            {intl.formatMessage({ id: 'notifications.timeoff.title' })}
          </Demi>
        </B2>
        <KV>
          <FieldGroup>
            <Label>
              {intl.formatMessage({
                id: 'notifications.timeoff.shift.published',
              })}
            </Label>
            {loading ? (
              <Skeleton variant="rectangular" height={18} />
            ) : (
              <B2>
                <Medium>
                  {getNotificationStatus(
                    intl,
                    settings.timeOffEmail,
                    settings.timeOffMobile,
                  )}
                </Medium>
              </B2>
            )}
          </FieldGroup>
        </KV>
      </Section> */}

      {/* Success Toast */}
      <SuccessToast
        message={intl.formatMessage({ id: 'settings.saved.success' })}
        open={showSuccessToast}
        onClose={handleCloseSuccessToast}
      />
    </div>
  );
};

export default NotificationsCardView;
