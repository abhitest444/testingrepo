import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import styled from 'styled-components';
import { Checkbox } from '@ids-ts/checkbox';
import { RadioGroup, RadioOnChangeEventType } from '@ids-ts/radio';
import { NotificationTimeDropDown } from 'src/js/widgets/timeTrackingSettings/common/NotificationTimeDropDown';

import {
  ApprovalRemindersbasedOn,
  NotificationFieldKey,
  NotificationMedium,
  ReminderRole,
  ReminderPosition,
  TrackingElementType,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { ReminderDayDropdown } from 'src/js/widgets/timeTrackingSettings/common/ReminderDayDropdown';
import { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';
import {
  getReminderFieldNames,
  isNotificationMediumEnabled,
  toggleNotificationMedium,
} from 'src/js/widgets/timeTrackingSettings/utils';
import { buildNotificationTrackingData } from 'src/js/widgets/timeTrackingSettings/hooks/trackingHelper';
import { APPROVAL_SETTINGS_TRACKING_FIELDS } from 'src/js/common/useClickTracking';

export const SectionContainer = styled.div`
  display: flex;
  flex-flow: column;
  gap: 16px;
  margin-bottom: 32px;
  width: 100%;
`;

export const SectionHeader = styled.label`
  font-weight: var(--font-weight-component-bold);
  color: var(--color-text-primary);
  font-size: var(--font-size-component-medium);
  line-height: normal; /* (NoTokenFound) */
`;

export const SectionSubtitle = styled.div`
  font-size: var(--font-size-component-small);
  color: var(--color-text-secondary);
  margin-bottom: 16px;
`;

export const EditFormRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  & label {
    margin: 0 !important;
  }
`;

export const RadioGroupContainer = styled.div`
  margin-bottom: 16px;
`;

export const DropDownSection = styled.div`
  width: 100%;
  max-width: 300px;
  position: relative;
`;

export const ApprovalContent = styled.div`
  display: flex;
  align-items: center;
  gap: 124px;
  width: 100%;
`;

export const CheckboxSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

export const CheckboxContent = styled.div`
  gap: 18px;
  display: inline-grid;
  min-width: 34px;
`;

export const EmailManagersSection = styled.div`
  margin-top: 24px;
`;

export const EmailManagersContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const EditApprovalsNotificationSettings = () => {
  const intl = useIntl();
  const track = useTracking();
  const { control } = useFormContext<ITimeEntrySettingsFormState>();

  // Watch the approval reminder frequency to show different content
  const approvalReminderFrequency = useWatch({
    control,
    name: 'managerReminderBasedOn',
    defaultValue: ApprovalRemindersbasedOn.DAY_OF_WEEK,
  });
  // Determine the mode for ReminderDayDropdown based on frequency
  const reminderMode =
    approvalReminderFrequency === ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE
      ? ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE
      : ApprovalRemindersbasedOn.DAY_OF_WEEK;

  // Use the utility function to get field names
  const firstReminderFields = getReminderFieldNames(
    ReminderRole.MANAGER,
    approvalReminderFrequency as ApprovalRemindersbasedOn,
    true,
  );
  const secondReminderFields = getReminderFieldNames(
    ReminderRole.MANAGER,
    approvalReminderFrequency as ApprovalRemindersbasedOn,
    false,
  );

  return (
    <SectionContainer>
      <SectionHeader>
        {intl.formatMessage({ id: 'time-entries.section.title.approvals' })}
      </SectionHeader>
      <SectionSubtitle>
        {intl.formatMessage({
          id: 'time-entries.section.title.approvals.remind-managers-approve-time',
        })}
      </SectionSubtitle>

      {/* Reminder Frequency Radio Buttons */}
      <RadioGroupContainer>
        <Controller
          name={NotificationFieldKey.MANAGER_REMINDER_BASED_ON}
          control={control}
          render={({ field: { onChange, value } }) => (
            <RadioGroup
              options={[
                {
                  label: intl.formatMessage({
                    id: 'time-entries.section.title.approvals.on-day-of-week',
                  }),
                  value: ApprovalRemindersbasedOn.DAY_OF_WEEK,
                },
                {
                  label: intl.formatMessage({
                    id: 'time-entries.section.title.approvals.based-on-pay-period',
                  }),
                  value: ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
                },
              ]}
              value={value || ApprovalRemindersbasedOn.DAY_OF_WEEK}
              onChange={(e: RadioOnChangeEventType) => {
                const selectedValue = e.target.value as string;
                onChange(selectedValue);
                track({
                  ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_RADIOBUTTON,
                  object_detail: 'notifications_approvals',
                  ui_object_detail:
                    selectedValue ===
                    ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE
                      ? 'pay_period'
                      : selectedValue.toLowerCase(),
                });
              }}
              name={NotificationFieldKey.MANAGER_REMINDER_BASED_ON}
              size="medium"
            />
          )}
        />
      </RadioGroupContainer>

      {/* First Reminder */}
      <EditFormRow>
        <ApprovalContent>
          <DropDownSection>
            <Controller
              key={`first-reminder-${approvalReminderFrequency}`}
              name={firstReminderFields.medium}
              control={control}
              render={({ field: { onChange, value } }) => {
                const isEnabled = isNotificationMediumEnabled(
                  value,
                  NotificationMedium.EMAIL,
                );

                return (
                  <Checkbox
                    onChange={() => {
                      const newValue = toggleNotificationMedium(
                        value,
                        NotificationMedium.EMAIL,
                      );
                      onChange(newValue);

                      const willBeEnabled = isNotificationMediumEnabled(
                        newValue,
                        NotificationMedium.EMAIL,
                      );

                      track(
                        buildNotificationTrackingData(
                          TrackingElementType.CHECKBOX,
                          approvalReminderFrequency as string,
                          ReminderPosition.FIRST,
                          ReminderRole.MANAGER,
                          'notifications_approvals',
                          willBeEnabled,
                        ),
                      );
                    }}
                    checked={isEnabled}
                  >
                    {approvalReminderFrequency ===
                    ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE
                      ? intl.formatMessage({
                          id: 'time-entries.section.title.approvals.remind-if-time-not-approved-by-payroll-close',
                        })
                      : intl.formatMessage({
                          id: 'time-entries.section.title.approvals.remind-if-time-not-approved-current-week',
                        })}
                  </Checkbox>
                );
              }}
            />
          </DropDownSection>
          <CheckboxSection>
            <CheckboxContent>
              <NotificationTimeDropDown
                key={`first-time-${approvalReminderFrequency}`}
                name={firstReminderFields.hour}
                labelKey="time-entries.section.title.approvals.reminder-time"
                width="100%"
                intervalMinutes={60}
                trackingPoint={buildNotificationTrackingData(
                  TrackingElementType.TIME_DROPDOWN,
                  approvalReminderFrequency as string,
                  ReminderPosition.FIRST,
                  ReminderRole.MANAGER,
                  'notifications_approvals',
                )}
              />
            </CheckboxContent>
            {firstReminderFields.day && (
              <CheckboxContent>
                <ReminderDayDropdown
                  key={`first-day-${approvalReminderFrequency}`}
                  name={firstReminderFields.day}
                  control={control}
                  mode={reminderMode}
                  labelKey="time-entries.section.title.approvals.reminder-day"
                  defaultValue="1"
                  width="100%"
                  trackingPoint={buildNotificationTrackingData(
                    TrackingElementType.DAY_DROPDOWN,
                    approvalReminderFrequency as string,
                    ReminderPosition.FIRST,
                    ReminderRole.MANAGER,
                    'notifications_approvals',
                  )}
                  onTrack={track}
                />
              </CheckboxContent>
            )}
          </CheckboxSection>
        </ApprovalContent>
      </EditFormRow>

      {/* Second Reminder */}
      <EditFormRow>
        <ApprovalContent>
          <DropDownSection>
            <Controller
              key={`second-reminder-${approvalReminderFrequency}`}
              name={secondReminderFields.medium}
              control={control}
              render={({ field: { onChange, value } }) => {
                const isEnabled = isNotificationMediumEnabled(
                  value,
                  NotificationMedium.EMAIL,
                );

                return (
                  <Checkbox
                    onChange={() => {
                      const newValue = toggleNotificationMedium(
                        value,
                        NotificationMedium.EMAIL,
                      );
                      onChange(newValue);

                      const willBeEnabled = isNotificationMediumEnabled(
                        newValue,
                        NotificationMedium.EMAIL,
                      );

                      track(
                        buildNotificationTrackingData(
                          TrackingElementType.CHECKBOX,
                          approvalReminderFrequency as string,
                          ReminderPosition.SECOND,
                          ReminderRole.MANAGER,
                          'notifications_approvals',
                          willBeEnabled,
                        ),
                      );
                    }}
                    checked={isEnabled}
                  >
                    {approvalReminderFrequency ===
                    ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE
                      ? intl.formatMessage({
                          id: 'time-entries.section.title.approvals.remind-second-time-not-approved-by-payroll-close',
                        })
                      : intl.formatMessage({
                          id: 'time-entries.section.title.approvals.remind-if-time-not-approved-prior-week',
                        })}
                  </Checkbox>
                );
              }}
            />
          </DropDownSection>
          <CheckboxSection>
            <CheckboxContent>
              <NotificationTimeDropDown
                key={`second-time-${approvalReminderFrequency}`}
                name={secondReminderFields.hour}
                labelKey="time-entries.section.title.approvals.reminder-time"
                width="100%"
                intervalMinutes={60}
                trackingPoint={buildNotificationTrackingData(
                  TrackingElementType.TIME_DROPDOWN,
                  approvalReminderFrequency as string,
                  ReminderPosition.SECOND,
                  ReminderRole.MANAGER,
                  'notifications_approvals',
                )}
              />
            </CheckboxContent>
            {secondReminderFields.day && (
              <CheckboxContent>
                <ReminderDayDropdown
                  key={`second-day-${approvalReminderFrequency}`}
                  name={secondReminderFields.day}
                  control={control}
                  mode={reminderMode}
                  labelKey="time-entries.section.title.approvals.reminder-day"
                  defaultValue="1"
                  width="100%"
                  trackingPoint={buildNotificationTrackingData(
                    TrackingElementType.DAY_DROPDOWN,
                    approvalReminderFrequency as string,
                    ReminderPosition.SECOND,
                    ReminderRole.MANAGER,
                    'notifications_approvals',
                  )}
                  onTrack={track}
                />
              </CheckboxContent>
            )}
          </CheckboxSection>
        </ApprovalContent>
      </EditFormRow>
    </SectionContainer>
  );
};
