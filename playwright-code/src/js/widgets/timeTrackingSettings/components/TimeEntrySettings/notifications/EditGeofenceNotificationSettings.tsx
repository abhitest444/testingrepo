import React from 'react';
import styled from 'styled-components';
import { useIntl, useTracking } from '@payroll/quicksand';
import { useFormContext } from 'react-hook-form';
import { NotificationTimeDropDown } from 'src/js/widgets/timeTrackingSettings/common/NotificationTimeDropDown';
import { ReminderDayDropdown } from 'src/js/widgets/timeTrackingSettings/common/ReminderDayDropdown';
import { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';
import { ApprovalRemindersbasedOn } from 'src/js/widgets/timeTrackingSettings/constants';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';

export const SectionContainer = styled.div`
  display: flex;
  flex-flow: column;
  gap: 8px;
  margin-bottom: 32px;
  width: 100%;
`;

export const SectionHeader = styled.label`
  font-weight: 600; /* (NoTokenFound) */
  color: var(--color-text-primary);
  font-size: var(--font-size-component-medium);
  line-height: normal; /* (NoTokenFound) */
`;
export const SectionSubHeader = styled.div`
  margin: 4px;
`;

export const EditFormRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const DropDownSection = styled.div`
  width: 100%;
  max-width: 300px;
  min-height: 72px;
  position: relative;
`;

export const DaysDropDownSection = styled.div`
  width: 100%;
  max-width: 300px;
  position: relative;
`;

interface IEditGeofenceNotificationSettings {}

export const EditGeofenceNotificationSettings: React.FC<
  IEditGeofenceNotificationSettings
> = () => {
  const intl = useIntl();
  const track = useTracking();
  const { control } = useFormContext<ITimeEntrySettingsFormState>();
  return (
    <>
      <SectionContainer>
        <SectionHeader>
          {intl.formatMessage({
            id: 'time-entries.section.title.notifications.geofence',
          })}
        </SectionHeader>
        <SectionSubHeader>
          {intl.formatMessage({
            id: 'time-entries.section.title.notifications.geofence.send-reminder-to-team',
          })}
        </SectionSubHeader>

        <EditFormRow>
          <DropDownSection data-testid="geofence-reminder-start-time">
            <NotificationTimeDropDown
              name="geofenceReminderStartTime"
              labelKey="time-entries.section.title.notifications.geofence.start-time"
              width="100%"
              trackingPoint={
                TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_REMINDER_START_TIME
              }
            />
          </DropDownSection>
        </EditFormRow>

        <EditFormRow>
          <DropDownSection data-testid="geofence-reminder-end-time">
            <NotificationTimeDropDown
              name="geofenceReminderEndTime"
              labelKey="time-entries.section.title.notifications.geofence.end-time"
              width="100%"
              trackingPoint={
                TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_REMINDER_END_TIME
              }
            />
          </DropDownSection>
        </EditFormRow>

        <EditFormRow>
          <DaysDropDownSection data-testid="geofence-reminder-days-of-week">
            <ReminderDayDropdown
              name="geofenceReminderDaysOfWeek"
              control={control}
              mode={ApprovalRemindersbasedOn.DAILY}
              width="100%"
              multiselect
              labelKey="time-entries.section.title.notifications.geofence.days-of-week"
              trackingPoint={
                TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_REMINDER_DAYS_OF_WEEK
              }
              onTrack={track}
            />
          </DaysDropDownSection>
        </EditFormRow>
      </SectionContainer>
    </>
  );
};
