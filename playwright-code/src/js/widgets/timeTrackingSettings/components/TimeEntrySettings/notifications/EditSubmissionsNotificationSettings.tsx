import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import styled from 'styled-components';
import { Checkbox } from '@ids-ts/checkbox';
import { RadioGroup, RadioOnChangeEventType } from '@ids-ts/radio';
import { NotificationTimeDropDown } from 'src/js/widgets/timeTrackingSettings/common/NotificationTimeDropDown';
import { ReminderDayDropdown } from 'src/js/widgets/timeTrackingSettings/common/ReminderDayDropdown';
import { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';
import {
  ApprovalRemindersbasedOn,
  NotificationFieldKey,
  NotificationMedium,
  ReminderRole,
  ReminderPosition,
  TrackingElementType,
} from 'src/js/widgets/timeTrackingSettings/constants';
import {
  getReminderFieldNames,
  getReminderMessageKey,
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
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: var(--font-size-component-medium);
  line-height: normal;
`;

export const SectionSubtitle = styled.div`
  font-size: var(--font-size-component-small);
  color: var(--color-text-secondary); /* (SemanticContextMatchOnly) */
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

export const SubmissionContent = styled.div`
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
  gap: 16px;
`;

export const DailyDaysOfWeekContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 600px;
  margin-top: -8px;
  margin-bottom: 16px;
`;

export const DaysOfWeekLabel = styled.label`
  font-size: 14px;
  color: #393a3d;
  font-weight: 400;
`;

export const EditSubmissionsNotificationSettings = () => {
  const intl = useIntl();
  const track = useTracking();
  const { control } = useFormContext<ITimeEntrySettingsFormState>();

  // Watch the submission reminder frequency to show different content
  const submissionReminderFrequency = useWatch({
    control,
    name: 'employeeReminderBasedOn',
    defaultValue: ApprovalRemindersbasedOn.DAY_OF_WEEK,
  });

  const reminderMode =
    submissionReminderFrequency === ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE
      ? ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE
      : ApprovalRemindersbasedOn.DAY_OF_WEEK;

  // Use the utility function to get field names
  const firstReminderFields = getReminderFieldNames(
    ReminderRole.EMPLOYEE,
    submissionReminderFrequency as ApprovalRemindersbasedOn,
    true,
  );
  const secondReminderFields = getReminderFieldNames(
    ReminderRole.EMPLOYEE,
    submissionReminderFrequency as ApprovalRemindersbasedOn,
    false,
  );

  const isApprovalsEnabled = useWatch({
    control,
    name: 'requireApprovalForTrackedTime',
  });

  // Hide the entire section if approvals are not enabled
  if (!isApprovalsEnabled) {
    return null;
  }

  return (
    <SectionContainer>
      <SectionHeader>
        {intl.formatMessage({ id: 'time-entries.section.title.submissions' })}
      </SectionHeader>
      <SectionSubtitle>
        {intl.formatMessage({
          id: 'time-entries.section.title.submissions.send-reminder-team-submit-time',
        })}
      </SectionSubtitle>

      {/* Reminder Frequency Radio Buttons */}
      <RadioGroupContainer>
        <Controller
          name="employeeReminderBasedOn"
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
                {
                  label: intl.formatMessage({
                    id: 'time-entries.section.title.submissions.daily',
                  }),
                  value: ApprovalRemindersbasedOn.DAILY,
                },
              ]}
              value={value || ApprovalRemindersbasedOn.DAY_OF_WEEK}
              onChange={(e: RadioOnChangeEventType) => {
                const selectedValue = e.target.value as string;
                onChange(selectedValue);
                track({
                  ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_RADIOBUTTON,
                  object_detail: 'notifications_submissions',
                  ui_object_detail:
                    selectedValue ===
                    ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE
                      ? 'pay_period'
                      : selectedValue.toLowerCase(),
                });
              }}
              name="employeeReminderBasedOn"
              size="medium"
            />
          )}
        />
      </RadioGroupContainer>

      {/* First Reminder */}
      <EditFormRow>
        <SubmissionContent>
          <DropDownSection>
            <Controller
              key={`first-reminder-${submissionReminderFrequency}`}
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
                          submissionReminderFrequency as string,
                          ReminderPosition.FIRST,
                          ReminderRole.EMPLOYEE,
                          'notifications_submissions',
                          willBeEnabled,
                        ),
                      );
                    }}
                    checked={isEnabled}
                  >
                    {intl.formatMessage({
                      id: getReminderMessageKey(
                        ReminderRole.EMPLOYEE,
                        submissionReminderFrequency as ApprovalRemindersbasedOn,
                        true,
                      ),
                    })}
                  </Checkbox>
                );
              }}
            />
          </DropDownSection>
          <CheckboxSection>
            <CheckboxContent>
              <NotificationTimeDropDown
                key={`first-time-${submissionReminderFrequency}`}
                name={firstReminderFields.hour}
                labelKey="time-entries.section.title.approvals.reminder-time"
                width="100%"
                intervalMinutes={60}
                trackingPoint={buildNotificationTrackingData(
                  TrackingElementType.TIME_DROPDOWN,
                  submissionReminderFrequency as string,
                  ReminderPosition.FIRST,
                  ReminderRole.EMPLOYEE,
                  'notifications_submissions',
                )}
              />
            </CheckboxContent>
            {firstReminderFields.day && (
              <CheckboxContent>
                <ReminderDayDropdown
                  key={`first-day-${submissionReminderFrequency}`}
                  name={firstReminderFields.day}
                  control={control}
                  mode={reminderMode}
                  labelKey="time-entries.section.title.approvals.reminder-day"
                  defaultValue="1"
                  width="100%"
                  trackingPoint={buildNotificationTrackingData(
                    TrackingElementType.DAY_DROPDOWN,
                    submissionReminderFrequency as string,
                    ReminderPosition.FIRST,
                    ReminderRole.EMPLOYEE,
                    'notifications_submissions',
                  )}
                  onTrack={track}
                />
              </CheckboxContent>
            )}
          </CheckboxSection>
        </SubmissionContent>
      </EditFormRow>

      {/* Second Reminder */}
      <EditFormRow>
        <SubmissionContent>
          <DropDownSection>
            <Controller
              key={`second-reminder-${submissionReminderFrequency}`}
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
                          submissionReminderFrequency as string,
                          ReminderPosition.SECOND,
                          ReminderRole.EMPLOYEE,
                          'notifications_submissions',
                          willBeEnabled,
                        ),
                      );
                    }}
                    checked={isEnabled}
                  >
                    {intl.formatMessage({
                      id: getReminderMessageKey(
                        ReminderRole.EMPLOYEE,
                        submissionReminderFrequency as ApprovalRemindersbasedOn,
                        false,
                      ),
                    })}
                  </Checkbox>
                );
              }}
            />
          </DropDownSection>
          <CheckboxSection>
            <CheckboxContent>
              <NotificationTimeDropDown
                key={`second-time-${submissionReminderFrequency}`}
                name={secondReminderFields.hour}
                labelKey="time-entries.section.title.approvals.reminder-time"
                width="100%"
                intervalMinutes={60}
                trackingPoint={buildNotificationTrackingData(
                  TrackingElementType.TIME_DROPDOWN,
                  submissionReminderFrequency as string,
                  ReminderPosition.SECOND,
                  ReminderRole.EMPLOYEE,
                  'notifications_submissions',
                )}
              />
            </CheckboxContent>
            {secondReminderFields.day && (
              <CheckboxContent>
                <ReminderDayDropdown
                  key={`second-day-${submissionReminderFrequency}`}
                  name={secondReminderFields.day}
                  control={control}
                  mode={reminderMode}
                  labelKey="time-entries.section.title.approvals.reminder-day"
                  defaultValue="1"
                  width="100%"
                  trackingPoint={buildNotificationTrackingData(
                    TrackingElementType.DAY_DROPDOWN,
                    submissionReminderFrequency as string,
                    ReminderPosition.SECOND,
                    ReminderRole.EMPLOYEE,
                    'notifications_submissions',
                  )}
                  onTrack={track}
                />
              </CheckboxContent>
            )}
          </CheckboxSection>
        </SubmissionContent>
      </EditFormRow>

      {/* Days of Week Selection for Daily Mode */}
      {submissionReminderFrequency === ApprovalRemindersbasedOn.DAILY && (
        <DailyDaysOfWeekContainer>
          <DaysOfWeekLabel>
            {intl.formatMessage({
              id: 'time-entries.section.title.submissions.days-of-week',
            })}
          </DaysOfWeekLabel>
          <ReminderDayDropdown
            key={`daily-days-${submissionReminderFrequency}`}
            name={NotificationFieldKey.SUBMISSION_REMINDER_DAYS_OF_WEEK}
            control={control}
            mode={ApprovalRemindersbasedOn.DAILY}
            width="100%"
            multiselect
            trackingPoint={buildNotificationTrackingData(
              TrackingElementType.DAY_DROPDOWN,
              ApprovalRemindersbasedOn.DAILY,
              ReminderPosition.FIRST,
              ReminderRole.EMPLOYEE,
              'notifications_submissions',
            )}
            onTrack={track}
          />
        </DailyDaysOfWeekContainer>
      )}

      {/* Email Managers Section */}
      <EmailManagersSection>
        <SectionHeader>
          {intl.formatMessage({
            id: 'time-entries.section.title.email-managers',
          })}
        </SectionHeader>
        <EditFormRow>
          <Controller
            name={NotificationFieldKey.NOTIFY_MANAGER_ON_SUBMIT}
            control={control}
            render={({ field: { onChange, value } }) => (
              <Checkbox
                onChange={() => {
                  const newValue = !value;
                  onChange(newValue);
                  track({
                    ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_EMAIL_ON_SUBMIT,
                    ui_action: newValue ? 'enabled' : 'disabled',
                  });
                }}
                checked={value || false}
              >
                {intl.formatMessage({
                  id: 'time-entries.section.title.submissions.email-managers-team-member-submits',
                })}
              </Checkbox>
            )}
          />
        </EditFormRow>
        <EditFormRow>
          <Controller
            name={NotificationFieldKey.NOTIFY_MANAGER_ON_GROUP_SUBMITTED}
            control={control}
            render={({ field: { onChange, value } }) => (
              <Checkbox
                onChange={() => {
                  const newValue = !value;
                  onChange(newValue);
                  track({
                    ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_EMAIL_ON_GROUP_SUBMITTED,
                    ui_action: newValue ? 'enabled' : 'disabled',
                  });
                }}
                checked={value || false}
              >
                {intl.formatMessage({
                  id: 'time-entries.section.title.submissions.email-managers-entire-team-submits',
                })}
              </Checkbox>
            )}
          />
        </EditFormRow>
      </EmailManagersSection>
    </SectionContainer>
  );
};
