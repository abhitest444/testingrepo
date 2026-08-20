import React from 'react';
import styled from 'styled-components';
import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import Checkbox from '@ids-ts/checkbox';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import { NotificationTimeDropDown } from 'src/js/widgets/timeTrackingSettings/common/NotificationTimeDropDown';
import {
  IIsFieldsVisible,
  ITimeEntrySettingsFormState,
} from 'src/js/widgets/timeTrackingSettings/types';
import {
  NOTIFICATION_DAYS_OF_WEEK,
  NOTIFY_OPTIONS,
} from 'src/js/widgets/timeTrackingSettings/constants';

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

export const EditFormRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const DropDownSection = styled.div`
  width: 300px;
  min-height: 72px;
  position: relative;
`;

export const DaysDropDownSection = styled.div`
  width: 300px;
  min-height: 72px;
  position: relative;

  /* Only add margin when dropdown is expanded (has aria-expanded="true") */
  &:has([aria-expanded='true']) {
    margin-bottom: 200px;
  }

  /* Fallback for browsers that don't support :has() - use class-based approach */
  &.dropdown-expanded {
    margin-bottom: 200px;
  }

  /* Target the IDS dropdown menu specifically for days dropdown */
  .ids-dropdown-menu,
  [class*='dropdown-menu'],
  [class*='Menu'],
  div[role='listbox'],
  ul[role='listbox'],
  .dropdown-menu {
    position: absolute !important;
    top: calc(
      100% + 4px
    ) !important; /* Open downward to avoid overlap with above elements */
    bottom: auto !important;
    left: 0 !important;
    right: 0 !important;
    max-height: 160px !important;
    overflow-y: auto !important;
    z-index: 10000 !important;
    background: var(--color-container-background-primary) !important;
    border: 1px solid var(--color-container-border-secondary) !important; /* (SemanticContextMatchOnly) */
    border-radius: var(--radius-container-overlay) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    width: 100% !important;
    box-sizing: border-box !important;
    transform: none !important;
    margin: 0 !important;
  }
`;

export const EmailMobileContent = styled.div`
  gap: 18px;
  display: inline-grid;
  width: 34px;
`;

export const SendClockInOutContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 124px;
  width: 100%;
`;

export const EmailMobileSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
`;

export const EmailMobileText = styled.span`
  color: var(--color-text-secondary);
  font-size: var(--font-size-input-label);
  font-style: normal;
  font-weight: var(--font-weight-input-label);
  line-height: normal;
`;

/** Invisible copy of EmailMobileText so the clock-out row reserves the same height as clock-in's labeled row. */
export const HiddenEmailMobileText = styled(EmailMobileText)`
  visibility: hidden;
`;

interface IEditNotificationTimeEntry {
  isFieldsVisible: IIsFieldsVisible;
}

export const EditNotificationTimeEntry: React.FC<
  IEditNotificationTimeEntry
> = ({ isFieldsVisible }) => {
  const daysOfWeek = Object.keys(NOTIFICATION_DAYS_OF_WEEK);

  const intl = useIntl();
  const track = useTracking();

  const { control } = useFormContext<ITimeEntrySettingsFormState>();

  const isClockInNotificationReminderEmail = useWatch({
    control,
    name: 'clockInNotificationReminderEmail',
  });

  const isClockInNotificationReminderMobile = useWatch({
    control,
    name: 'clockInNotificationReminderMobile',
  });

  const isClockOutNotificationReminderEmail = useWatch({
    control,
    name: 'clockOutNotificationReminderEmail',
  });

  const isClockOutNotificationReminderMobile = useWatch({
    control,
    name: 'clockOutNotificationReminderMobile',
  });

  return (
    <>
      <SectionContainer>
        <SectionHeader>
          {intl.formatMessage({
            id: 'time-entries.section.title.time-tracking',
          })}
        </SectionHeader>

        <EditFormRow>
          <SendClockInOutContent>
            <DropDownSection data-testid="clk-in-reminder">
              <NotificationTimeDropDown
                name="clockInNotificationReminderTime"
                labelKey="time-entries.section.title.notifications.time-tracking.send-clock-in-reminder-at"
                width="100%"
                trackingPoint={
                  TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_CLOCK_IN_REMINDER_TIME
                }
              />
            </DropDownSection>

            <EmailMobileSection>
              <Controller
                render={({ field: { onChange, value } }) => (
                  <EmailMobileContent data-testid="clk-in-email">
                    <EmailMobileText>
                      {intl.formatMessage({ id: 'email' })}
                    </EmailMobileText>
                    <Checkbox
                      onChange={() => {
                        const newValue = !value;
                        onChange(newValue);
                        track({
                          ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_CLOCK_IN_EMAIL,
                          ui_action: newValue ? 'enabled' : 'disabled',
                        });
                      }}
                      checked={value}
                    />
                  </EmailMobileContent>
                )}
                name="clockInNotificationReminderEmail"
              />

              <Controller
                render={({ field: { onChange, value } }) => (
                  <EmailMobileContent data-testid="clk-in-mobile">
                    <EmailMobileText>
                      {intl.formatMessage({ id: 'mobile' })}
                    </EmailMobileText>
                    <Checkbox
                      onChange={() => {
                        const newValue = !value;
                        onChange(newValue);
                        track({
                          ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_CLOCK_IN_MOBILE,
                          ui_action: newValue ? 'enabled' : 'disabled',
                        });
                      }}
                      checked={value}
                    />
                  </EmailMobileContent>
                )}
                name="clockInNotificationReminderMobile"
              />
            </EmailMobileSection>
          </SendClockInOutContent>
        </EditFormRow>

        <EditFormRow>
          <SendClockInOutContent>
            <DropDownSection data-testid="clk-out-reminder">
              <NotificationTimeDropDown
                name="clockOutNotificationReminderTime"
                labelKey="time-entries.section.title.notifications.time-tracking.send-clock-out-reminder-at"
                width="100%"
                trackingPoint={
                  TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_CLOCK_OUT_REMINDER_TIME
                }
              />
            </DropDownSection>

            <EmailMobileSection>
              <Controller
                render={({ field: { onChange, value } }) => (
                  <EmailMobileContent data-testid="clk-out-email">
                    <HiddenEmailMobileText aria-hidden="true">
                      &nbsp;
                    </HiddenEmailMobileText>
                    <Checkbox
                      onChange={() => {
                        const newValue = !value;
                        onChange(newValue);
                        track({
                          ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_CLOCK_OUT_EMAIL,
                          ui_action: newValue ? 'enabled' : 'disabled',
                        });
                      }}
                      checked={value}
                    />
                  </EmailMobileContent>
                )}
                name="clockOutNotificationReminderEmail"
              />

              <Controller
                render={({ field: { onChange, value } }) => (
                  <EmailMobileContent data-testid="clk-out-mobile">
                    <HiddenEmailMobileText aria-hidden="true">
                      &nbsp;
                    </HiddenEmailMobileText>
                    <Checkbox
                      onChange={() => {
                        const newValue = !value;
                        onChange(newValue);
                        track({
                          ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_CLOCK_OUT_MOBILE,
                          ui_action: newValue ? 'enabled' : 'disabled',
                        });
                      }}
                      checked={value}
                    />
                  </EmailMobileContent>
                )}
                name="clockOutNotificationReminderMobile"
              />
            </EmailMobileSection>
          </SendClockInOutContent>
        </EditFormRow>

        <EditFormRow>
          <DaysDropDownSection data-testid="days-of-week">
            <Controller
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  multiselect
                  colorScheme="light"
                  placeholder={intl.formatMessage({
                    id: 'location-settings.fields.select-days',
                  })}
                  disabled={
                    !(
                      isClockInNotificationReminderEmail ||
                      isClockInNotificationReminderMobile ||
                      isClockOutNotificationReminderEmail ||
                      isClockOutNotificationReminderMobile
                    )
                  }
                  onChange={(e) => {
                    e.stopPropagation();
                    track(
                      TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_DAYS_OF_WEEK,
                    );
                    if (value.length > 0) {
                      if (
                        value.indexOf((e.target as HTMLSelectElement).value) !==
                        -1
                      ) {
                        const indexOfElement = value.indexOf(
                          (e.target as HTMLSelectElement).value,
                        );
                        value.splice(indexOfElement, 1);
                        onChange(value);
                      } else {
                        value.push((e.target as HTMLSelectElement).value);
                        onChange(value);
                      }
                    } else {
                      onChange([(e.target as HTMLSelectElement).value]);
                    }
                  }}
                  aria-label="notificationEnabledForDays"
                  value={value}
                  label={intl.formatMessage({
                    id: 'time-entries.section.title.notifications.time-tracking.days-reminders-are-sent',
                  })}
                  width="100%"
                >
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day} value={NOTIFICATION_DAYS_OF_WEEK[day]}>
                      {intl.formatMessage({ id: day })}
                    </MenuItem>
                  ))}
                </Dropdown>
              )}
              name="notificationEnabledForDays"
            />
          </DaysDropDownSection>
        </EditFormRow>

        {isFieldsVisible.notifyWhenClockInOutTimeAdjusted && (
          <EditFormRow>
            <DropDownSection data-testid="clk-in-out-adjust">
              <Controller
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    multiselect={false}
                    colorScheme="light"
                    placeholder={intl.formatMessage({
                      id: 'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
                    })}
                    onChange={(e: any) => {
                      e.stopPropagation();
                      onChange(e.target.value);
                      track(
                        TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_CLOCK_IN_OUT_ADJUSTED,
                      );
                    }}
                    aria-label="notifyWhenClockInOutUpdated"
                    value={value}
                    label={intl.formatMessage({
                      id: 'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
                    })}
                    width="100%"
                  >
                    {NOTIFY_OPTIONS.map((notify) => (
                      <MenuItem key={notify} value={notify}>
                        {intl.formatMessage({ id: notify })}
                      </MenuItem>
                    ))}
                  </Dropdown>
                )}
                name="notifyWhenClockInOutUpdated"
              />
            </DropDownSection>
          </EditFormRow>
        )}

        {isFieldsVisible.notifyWhenNotesAreAddedOrEdited && (
          <EditFormRow>
            <DropDownSection data-testid="notes-add-adjust">
              <Controller
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    multiselect={false}
                    colorScheme="light"
                    placeholder={intl.formatMessage({
                      id: 'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited',
                    })}
                    onChange={(e: any) => {
                      e.stopPropagation();
                      onChange(e.target.value);
                      track(
                        TIME_ENTRY_SETTINGS_TRACKING_POINTS.NOTIFICATION_NOTES_ADJUSTED,
                      );
                    }}
                    aria-label="notifyWhenNotesAreAddedOrEdited"
                    value={value}
                    label={intl.formatMessage({
                      id: 'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited',
                    })}
                    width="100%"
                  >
                    {NOTIFY_OPTIONS.map((notify) => (
                      <MenuItem key={notify} value={notify}>
                        {intl.formatMessage({ id: notify })}
                      </MenuItem>
                    ))}
                  </Dropdown>
                )}
                name="notifyWhenNotesAreAddedOrEdited"
              />
            </DropDownSection>
          </EditFormRow>
        )}
      </SectionContainer>
    </>
  );
};
