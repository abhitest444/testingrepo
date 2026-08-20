import React from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import styled from 'styled-components';
import { useIntl, useTracking } from '@payroll/quicksand';
import { Checkbox } from '@ids-ts/checkbox';
import { RadioGroup, RadioOnChangeEventType } from '@ids-ts/radio';
import {
  NotificationFieldKey,
  ScheduleNotificationSendMode,
} from 'src/js/widgets/timeTrackingSettings/constants';
import {
  hasEmailChannel,
  hasMobileChannel,
  toggleScheduleChannel,
} from 'src/js/widgets/timeTrackingSettings/utils';
import { TimeTracking_NotificationReminderMedium } from 'src/__generated__/timeTracking/graphql';
import type { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';
import {
  EmailMobileText,
  SectionContainer,
  SectionHeader,
  SendClockInOutContent,
} from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditNotificationTimeEntrySettings';
import { SCHEDULE_NOTIFICATIONS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/tracking/scheduleNotificationsTrackingPoints';

const ShiftPublishedBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  align-items: stretch;
  justify-content: flex-start;
`;

const ShiftPublishedChannelsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 124px;
  width: 100%;
  height: fit-content;
  min-height: 0;
`;

/** Schedule channel/checkbox row sized to its content (extends the shared clock-in/out row). */
const ScheduleChannelRow = styled(SendClockInOutContent)`
  align-items: center;
  height: fit-content;
  min-height: 0;
`;

/** Second row: reserve label column + gap so the radios line up under the Email/Mobile column. */
const ShiftPublishedRadiosRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 124px;
  width: 100%;
`;

const ShiftPublishedRadioField = styled.div`
  flex: 1;
  min-width: 0;
`;

/** Figma 12013:13820 — Email / Mobile labels once at top; aligns with 305px label + 124px data rows. */
const ScheduleChannelHeaderRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 124px;
  width: 100%;
`;

const ScheduleChannelHeaderSpacer = styled.div`
  flex: 0 0 305px;
  width: 305px;
  max-width: 305px;
  min-width: 0;
`;

/** Figma 12013:13823 — Email/Mobile labels, 20px gap, items-end. */
const ScheduleChannelLabels = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  white-space: nowrap;

  ${EmailMobileText} {
    line-height: 20px;
  }
`;

/** Figma 12013:13826 — checkbox pair, 24px gap. Constrain the IDS checkbox
 *  wrappers to their visual box so the row hugs content height (no extra
 *  vertical space from the control's default touch target). */
const ScheduleCheckboxPair = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;

  & > * {
    display: flex;
    align-items: center;
    height: 20px;
  }
`;

const ScheduleRowLabel = styled.span`
  flex: 0 0 305px;
  width: 305px;
  max-width: 305px;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-break: break-word;
  color: var(--color-text-primary);
  font-size: var(--font-size-body-3);
  font-weight: var(--font-weight-body);
  line-height: 1.5;
`;

/**
 * Schedule notifications edit block. Each channel row is an RHF field holding the
 * enabled delivery channels (distributionMethods); the checkboxes toggle a medium
 * in/out of that array. The shift-published send-mode radio is a separate RHF field.
 */
type ScheduleTrackingKey =
  | 'SHIFT_PUBLISHED'
  | 'SHIFT_START'
  | 'FORGOT_CLOCK_IN'
  | 'FORGOT_CLOCK_OUT'
  | 'NO_CLOCKIN_NOTIFY_MGR';

const RADIO_TRACKING_MAP: Record<
  ScheduleNotificationSendMode,
  keyof typeof SCHEDULE_NOTIFICATIONS_TRACKING_POINTS
> = {
  [ScheduleNotificationSendMode.ALWAYS_SEND]:
    'SCHEDULE_SHIFT_PUBLISHED_ALWAYS_SEND',
  [ScheduleNotificationSendMode.NEVER_SEND]:
    'SCHEDULE_SHIFT_PUBLISHED_NEVER_SEND',
  [ScheduleNotificationSendMode.ASK]: 'SCHEDULE_SHIFT_PUBLISHED_ASK',
};

export const EditScheduleNotificationSettings: React.FC = () => {
  const intl = useIntl();
  const track = useTracking();
  const { control } = useFormContext<ITimeEntrySettingsFormState>();

  const sectionTitle = intl.formatMessage({
    id: 'time-entries.section.title.notifications.schedule',
  });

  // Disable the send-mode radios when the shift-published row has no channel active.
  const shiftPublishedChannels =
    useWatch<ITimeEntrySettingsFormState>({
      name: NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS,
      control,
    }) ?? [];
  const shiftRadiosDisabled =
    !hasEmailChannel(
      shiftPublishedChannels as TimeTracking_NotificationReminderMedium[],
    ) &&
    !hasMobileChannel(
      shiftPublishedChannels as TimeTracking_NotificationReminderMedium[],
    );

  const shiftRadioOptions = [
    {
      value: ScheduleNotificationSendMode.ALWAYS_SEND,
      label: intl.formatMessage({
        id: 'time-entries.section.title.notifications.schedule.view.always-send',
      }),
      description: intl.formatMessage({
        id: 'time-entries.section.title.notifications.schedule.edit.shift-published.always-send.description',
      }),
    },
    {
      value: ScheduleNotificationSendMode.NEVER_SEND,
      label: intl.formatMessage({
        id: 'time-entries.section.title.notifications.schedule.view.never-send',
      }),
      description: intl.formatMessage({
        id: 'time-entries.section.title.notifications.schedule.edit.shift-published.never-send.description',
      }),
    },
    {
      value: ScheduleNotificationSendMode.ASK,
      label: intl.formatMessage({
        id: 'time-entries.section.title.notifications.schedule.view.ask',
      }),
      description: intl.formatMessage({
        id: 'time-entries.section.title.notifications.schedule.edit.shift-published.ask.description',
      }),
    },
  ];

  const { Email, PushNotification } = TimeTracking_NotificationReminderMedium;

  // Email/Mobile checkbox pair bound to one channel-array RHF field. Each checkbox
  // toggles its medium in/out of the array (value === API distributionMethods).
  const renderChannelCheckboxPair = (
    fieldName:
      | NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS
      | NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS
      | NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_STARTED_CHANNELS
      | NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS
      | NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS,
    trackingKey: ScheduleTrackingKey,
  ) => (
    <Controller
      name={fieldName}
      control={control}
      render={({ field: { onChange, value } }) => {
        const channels = (value ??
          []) as TimeTracking_NotificationReminderMedium[];
        return (
          <ScheduleCheckboxPair>
            <Checkbox
              checked={hasEmailChannel(channels)}
              onChange={() => {
                const emailOn = !hasEmailChannel(channels);
                track(
                  SCHEDULE_NOTIFICATIONS_TRACKING_POINTS[
                    `SCHEDULE_${trackingKey}_EMAIL_${emailOn ? 'ON' : 'OFF'}`
                  ],
                );
                onChange(toggleScheduleChannel(channels, Email));
              }}
            />
            <Checkbox
              checked={hasMobileChannel(channels)}
              onChange={() => {
                const mobileOn = !hasMobileChannel(channels);
                track(
                  SCHEDULE_NOTIFICATIONS_TRACKING_POINTS[
                    `SCHEDULE_${trackingKey}_MOBILE_${mobileOn ? 'ON' : 'OFF'}`
                  ],
                );
                onChange(toggleScheduleChannel(channels, PushNotification));
              }}
            />
          </ScheduleCheckboxPair>
        );
      }}
    />
  );

  return (
    <SectionContainer data-testid="schedule-notifications-edit">
      <SectionHeader>{sectionTitle}</SectionHeader>

      <ScheduleChannelHeaderRow>
        <ScheduleChannelHeaderSpacer aria-hidden />
        <ScheduleChannelLabels>
          <EmailMobileText>
            {intl.formatMessage({ id: 'email' })}
          </EmailMobileText>
          <EmailMobileText>
            {intl.formatMessage({ id: 'mobile' })}
          </EmailMobileText>
        </ScheduleChannelLabels>
      </ScheduleChannelHeaderRow>

      <ShiftPublishedBlock>
        <ShiftPublishedChannelsRow>
          <ScheduleRowLabel>
            {intl.formatMessage({
              id: 'time-entries.section.title.notifications.schedule.shift-published-or-changed',
            })}
          </ScheduleRowLabel>
          {renderChannelCheckboxPair(
            NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS,
            'SHIFT_PUBLISHED',
          )}
        </ShiftPublishedChannelsRow>
        <ShiftPublishedRadiosRow>
          <ShiftPublishedRadioField>
            <Controller
              name={NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE}
              control={control}
              render={({ field: { onChange, value } }) => (
                <RadioGroup
                  name="schedule-shift-published-send-mode"
                  vertical
                  disabled={shiftRadiosDisabled}
                  options={shiftRadioOptions}
                  value={value}
                  onChange={(e: RadioOnChangeEventType) => {
                    const mode = e.target.value as ScheduleNotificationSendMode;
                    track(
                      SCHEDULE_NOTIFICATIONS_TRACKING_POINTS[
                        RADIO_TRACKING_MAP[mode]
                      ],
                    );
                    onChange(mode);
                  }}
                  aria-label={intl.formatMessage({
                    id: 'time-entries.section.title.notifications.schedule.shift-published-or-changed',
                  })}
                  size="medium"
                />
              )}
            />
          </ShiftPublishedRadioField>
        </ShiftPublishedRadiosRow>
      </ShiftPublishedBlock>

      <ScheduleChannelRow>
        <ScheduleRowLabel>
          {intl.formatMessage({
            id: 'time-entries.section.title.notifications.schedule.one-hour-before-shift',
          })}
        </ScheduleRowLabel>
        {renderChannelCheckboxPair(
          NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS,
          'SHIFT_START',
        )}
      </ScheduleChannelRow>

      <ScheduleChannelRow>
        <ScheduleRowLabel>
          {intl.formatMessage({
            id: 'time-entries.section.title.notifications.schedule.forgot-clock-in-after-shift-started',
          })}
        </ScheduleRowLabel>
        {renderChannelCheckboxPair(
          NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_STARTED_CHANNELS,
          'FORGOT_CLOCK_IN',
        )}
      </ScheduleChannelRow>

      <ScheduleChannelRow>
        <ScheduleRowLabel>
          {intl.formatMessage({
            id: 'time-entries.section.title.notifications.schedule.forgot-clock-out-after-shift-ended',
          })}
        </ScheduleRowLabel>
        {renderChannelCheckboxPair(
          NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS,
          'FORGOT_CLOCK_OUT',
        )}
      </ScheduleChannelRow>

      <ScheduleChannelRow>
        <ScheduleRowLabel>
          {intl.formatMessage({
            id: 'time-entries.section.title.notifications.schedule.late-clock-in-notify-manager',
          })}
        </ScheduleRowLabel>
        {renderChannelCheckboxPair(
          NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS,
          'NO_CLOCKIN_NOTIFY_MGR',
        )}
      </ScheduleChannelRow>
    </SectionContainer>
  );
};
