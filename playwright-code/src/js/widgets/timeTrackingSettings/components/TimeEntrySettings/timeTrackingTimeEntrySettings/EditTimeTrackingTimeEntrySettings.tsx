import React from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useIntl, useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import { Dropdown, MenuItem } from '@ids-ts/dropdown';
import { Checkbox } from '@ids-ts/checkbox';
import TextField from '@ids-ts/text-field';
import { Info } from '@design-systems/icons';
import Tooltip from '@ids-ts/tooltip';
import { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';
import {
  CLOCK_IN_OUT_DIRECTIONS,
  ROUNDING_INCREMENT_CLOCK_IN_OUT,
} from 'src/js/widgets/timeTrackingSettings/constants';
import TimeZoneField from 'src/js/widgets/common/addTimeFormComponents/TimeZoneField';
import { DAYS_OF_WEEK } from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import { FEATURE_FLAGS } from 'src/js/common/constants';

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
  line-height: normal;
`;

export const EditFormRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const DropDownSection = styled.div`
  width: 100%;
  max-width: 300px;
`;

export const TeamMemberEditedClockOutTime = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

export const HoursContent = styled.span`
  display: inline-block;
  margin-top: 5px;
  align-items: center;
`;

export const CheckboxContent = styled.div`
  display: flex;
  align-items: baseline;
  line-height: normal;
  gap: 10px;
`;

export const RoundClockInOutComponent = styled.div`
  display: flex;
  gap: 16px;
  white-space: nowrap;
  align-items: center;

  label {
    margin-top: 32px;
  }
`;

export const RoundClockInClockOutText = styled.span`
  margin-top: 16px;
  min-width: 150px;
`;

export const TimeFormatContent = styled.div`
  display: inline;
`;

export const AdvanceCompanySettings = styled.span`
  color: var(--color-action-special-use);
  cursor: pointer;
`;

export const ToolTipIcon = styled(Info)`
  bottom: 18px;
  align-items: center;
  display: inline-block;
  vertical-align: middle;
  cursor: pointer;
  background-color: transparent;
  border: none;
  min-width: 20px;
  color: var(--color-icon-secondary);
`;

export interface IEditTimeTrackingTimeEntrySettings {
  isFitAndFinishSettingsEnabled: boolean;
  isTimeElite: boolean;
}

export const EditTimeTrackingTimeEntrySettings = ({
  isFitAndFinishSettingsEnabled,
  isTimeElite,
}: IEditTimeTrackingTimeEntrySettings) => {
  const intl = useIntl();
  // const navigator = useSandboxNavigate();
  const track = useTracking();

  const daysOfWeek = Object.keys(DAYS_OF_WEEK);
  const clockInClockOutDirection = Object.keys(CLOCK_IN_OUT_DIRECTIONS);
  const roundingDurations = Object.keys(ROUNDING_INCREMENT_CLOCK_IN_OUT);

  const { control, setValue } = useFormContext<ITimeEntrySettingsFormState>();

  const isEditClockOutTimeEnabled = useWatch({
    control,
    name: 'editClockOutTimeEnabled',
  });

  const isManageOwnTimeSheetsEnabled = useWatch({
    control,
    name: 'manageOwnTimeSheetsEnabled',
  });

  return (
    <>
      <SectionContainer>
        <SectionHeader data-testid="tt-ts-management">
          {intl.formatMessage({
            id: 'time-entries.section.title.time-management',
          })}
        </SectionHeader>

        <EditFormRow>
          <DropDownSection data-testid="first-day-work-week">
            <Controller
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  multiselect={false}
                  colorScheme="light"
                  placeholder={intl.formatMessage({
                    id: 'location-settings.fields.select-days',
                  })}
                  onChange={(e: any) => {
                    onChange(e.target.value);
                    e.stopPropagation();
                    track(
                      TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_FIRST_DAY_OF_WEEK,
                    );
                  }}
                  aria-label="DaysOfWeekDropDown"
                  value={value}
                  label={intl.formatMessage({
                    id: 'location-settings.fields.general-settings',
                  })}
                  width="100%"
                >
                  {Object.entries(daysOfWeek).map(([index, day]) => (
                    <MenuItem key={index} value={index}>
                      {intl.formatMessage({ id: day })}
                    </MenuItem>
                  ))}
                </Dropdown>
              )}
              name="firstDayOfWeek"
            />
          </DropDownSection>
        </EditFormRow>

        <EditFormRow>
          <DropDownSection data-testid="tt-time-zone">
            <Controller
              render={({ field: { onChange, value } }) => (
                <TimeZoneField
                  value={value}
                  readOnly={false}
                  name="timezone"
                  width="100%"
                  placeholderText={intl.formatMessage({
                    id: 'time-entries.section.title.time-management.time-zone-placeholder',
                  })}
                  onChange={(e) => {
                    onChange(e);
                    track(
                      TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_TIME_ZONE,
                    );
                  }}
                />
              )}
              name="timeZone"
            />
          </DropDownSection>
        </EditFormRow>

        <EditFormRow>
          <CheckboxContent data-testid="split-ts">
            <Controller
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  onChange={() => {
                    const newValue = !value;
                    onChange(newValue);
                    track({
                      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_SPLIT_AT_MIDNIGHT,
                      ui_action: newValue ? 'enabled' : 'disabled',
                    });
                  }}
                  checked={value}
                >
                  {intl.formatMessage({
                    id: 'time-entries.section.title.time-management.split-time-sheet',
                  })}
                </Checkbox>
              )}
              name="splitTimeSheetAtMidnightEnabled"
            />

            <Tooltip
              position="right"
              message={
                <div>
                  {intl.formatMessage({
                    id: 'time-entries.time-tracking.split-time-sheet-popover',
                  })}
                </div>
              }
            >
              <ToolTipIcon
                color="#6B6C72"
                size="small"
                data-testid="tooltip-split-ts"
              />
            </Tooltip>
          </CheckboxContent>
        </EditFormRow>

        <EditFormRow>
          <CheckboxContent data-testid="allow-to-create-edit-ts">
            <Controller
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  onChange={() => {
                    const newValue = !value;
                    onChange(newValue);

                    // When enabling manageOwnTimeSheetsEnabled, also mark mobileTimeTrackingEnabled as dirty
                    // This ensures both fields are included in the mutation payload
                    if (isFitAndFinishSettingsEnabled && newValue === true) {
                      setValue('mobileTimeTrackingEnabled', true, {
                        shouldDirty: true,
                      });
                    }

                    track({
                      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_EDIT_OWN_TIMESHEET,
                      ui_action: newValue ? 'enabled' : 'disabled',
                    });
                  }}
                  checked={value}
                >
                  {intl.formatMessage({
                    id: 'time-entries.section.title.time-management.allow-team-member-to-create-or-edit-their-own-timesheet',
                  })}
                </Checkbox>
              )}
              name="manageOwnTimeSheetsEnabled"
            />

            <Tooltip
              position="right"
              message={
                <div>
                  {intl.formatMessage({
                    id: 'time-entries.time-tracking.allow-team-member-to-create-or-edit-their-own-timesheet-popover',
                  })}
                </div>
              }
            >
              <ToolTipIcon
                color="#6B6C72"
                size="small"
                data-testid="tooltip-allow-to-create-edit-ts"
              />
            </Tooltip>
          </CheckboxContent>
        </EditFormRow>

        {isFitAndFinishSettingsEnabled && (
          <>
            <EditFormRow>
              <CheckboxContent data-testid="mobile-time-tracking">
                <Controller
                  render={({ field: { onChange, value } }) => (
                    <Checkbox
                      onChange={() => {
                        const newValue = !value;
                        onChange(newValue);
                        track({
                          ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_MOBILE_TIME_TRACKING,
                          ui_action: newValue ? 'enabled' : 'disabled',
                        });
                      }}
                      checked={isManageOwnTimeSheetsEnabled ? true : value}
                      disabled={isManageOwnTimeSheetsEnabled}
                    >
                      {intl.formatMessage({
                        id: 'time-entries.section.title.time-management.allow-team-member-to-track-time-on-mobile',
                      })}
                    </Checkbox>
                  )}
                  name="mobileTimeTrackingEnabled"
                />

                <Tooltip
                  position="right"
                  message={
                    <div>
                      {intl.formatMessage({
                        id: 'time-entries.time-tracking.allow-team-member-to-track-time-on-mobile-popover',
                      })}
                    </div>
                  }
                >
                  <ToolTipIcon
                    color="#6B6C72"
                    size="small"
                    data-testid="tooltip-mobile-time-tracking"
                  />
                </Tooltip>
              </CheckboxContent>
            </EditFormRow>

            {isTimeElite && (
              <EditFormRow>
                <CheckboxContent data-testid="signature-capture">
                  <Controller
                    render={({ field: { onChange, value } }) => (
                      <Checkbox
                        onChange={() => {
                          const newValue = !value;
                          onChange(newValue);
                          track({
                            ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_SIGNATURE_CAPTURE,
                            ui_action: newValue ? 'enabled' : 'disabled',
                          });
                        }}
                        checked={value}
                      >
                        {intl.formatMessage({
                          id: 'time-entries.section.title.time-management.capture-signatures-for-timesheets',
                        })}
                      </Checkbox>
                    )}
                    name="signatureCaptureEnabled"
                  />

                  <Tooltip
                    position="right"
                    message={
                      <div>
                        {intl.formatMessage({
                          id: 'time-entries.time-tracking.capture-signatures-for-timesheets-popover',
                        })}
                      </div>
                    }
                  >
                    <ToolTipIcon
                      color="#6B6C72"
                      size="small"
                      data-testid="tooltip-signature-capture"
                    />
                  </Tooltip>
                </CheckboxContent>
              </EditFormRow>
            )}
          </>
        )}

        <EditFormRow>
          <CheckboxContent data-testid="allow-to-edit-clk-out">
            <Controller
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  onChange={() => {
                    const newValue = !value;
                    onChange(newValue);
                    track({
                      ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_EDIT_CLOCKOUT_OVERRIDE_ENABLED,
                      ui_action: newValue ? 'enabled' : 'disabled',
                    });
                  }}
                  checked={value}
                >
                  {intl.formatMessage({
                    id: 'time-entries.section.title.time-management.ask-team-member-like-to-edit-clock-out-time',
                  })}
                </Checkbox>
              )}
              name="editClockOutTimeEnabled"
            />

            <TeamMemberEditedClockOutTime data-testid="allow-to-edit-clk-out-textbox">
              <Controller
                render={({ field: { onChange, value } }) => (
                  <TextField
                    onChange={(e) => {
                      e.stopPropagation();
                      onChange(e.target.value);
                      track(
                        TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_EDIT_CLOCKOUT_OVERRIDE_HOURS,
                      );
                    }}
                    value={value}
                    readOnly={!isEditClockOutTimeEnabled}
                    disabled={!isEditClockOutTimeEnabled}
                    type="number"
                    hideArrows
                  />
                )}
                name="clockOutOverrideHours"
              />
              <HoursContent>{intl.formatMessage({ id: 'hours' })}</HoursContent>
            </TeamMemberEditedClockOutTime>

            <Tooltip
              position="right"
              message={
                <div>
                  {intl.formatMessage({
                    id: 'time-entries.time-tracking.ask-team-member-like-to-edit-clock-out-time-popover',
                  })}
                </div>
              }
            >
              <ToolTipIcon
                color="#6B6C72"
                size="small"
                data-testid="tooltip-allow-to-edit-clk-out"
              />
            </Tooltip>
          </CheckboxContent>
        </EditFormRow>
      </SectionContainer>

      <SectionContainer>
        <SectionHeader data-testid="tt-ts-rounding">
          {intl.formatMessage({
            id: 'time-entries.section.title.timesheet-rounding',
          })}
        </SectionHeader>
        <EditFormRow>
          <span>
            {intl.formatMessage({
              id: 'time-entries.section.title.timesheet-rounding.instruction',
            })}
            <a
              href="https://quickbooks.intuit.com/time-tracking/resources/timesheet-rounding/"
              rel="noopener noreferrer"
              target="_blank"
            >
              {intl.formatMessage({
                id: 'time-entries.section.title.timesheet-rounding.view-rounding-guide',
              })}
            </a>
          </span>
        </EditFormRow>

        <EditFormRow>
          <RoundClockInOutComponent>
            <RoundClockInClockOutText>
              {intl.formatMessage({
                id: 'time-entries.section.title.timesheet-rounding.round-clock-in-times',
              })}
            </RoundClockInClockOutText>

            <Controller
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  multiselect={false}
                  colorScheme="light"
                  placeholder={intl.formatMessage({
                    id: 'time-entries.section.title.timesheet-rounding.select-direction',
                  })}
                  onChange={(e: any) => {
                    onChange(e.target.value);
                    e.stopPropagation();
                    track(
                      TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_CLOCK_IN_DIRECTION,
                    );
                  }}
                  aria-label="directionClockIn"
                  value={value}
                  label={intl.formatMessage({
                    id: 'time-entries.section.title.timesheet-rounding.direction-clock-in',
                  })}
                  width="100%"
                  data-testid="round-clk-in-dir"
                >
                  {clockInClockOutDirection.map((direction) => (
                    <MenuItem value={CLOCK_IN_OUT_DIRECTIONS[direction]}>
                      {intl.formatMessage({ id: direction })}
                    </MenuItem>
                  ))}
                </Dropdown>
              )}
              name="clockInRoundDirection"
            />

            <Controller
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  multiselect={false}
                  colorScheme="light"
                  placeholder={intl.formatMessage({
                    id: 'time-entries.section.title.timesheet-rounding.select-rounding-increment',
                  })}
                  onChange={(e: any) => {
                    onChange(e.target.value);
                    e.stopPropagation();
                    track(
                      TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_CLOCK_IN_INCREMENT,
                    );
                  }}
                  aria-label="roundingClockIN"
                  value={value}
                  label={intl.formatMessage({
                    id: 'time-entries.section.title.timesheet-rounding.rounding-increment-clock-in',
                  })}
                  width="100%"
                  data-testid="round-clk-in-inc"
                >
                  {roundingDurations.map((rounding) => (
                    <MenuItem value={ROUNDING_INCREMENT_CLOCK_IN_OUT[rounding]}>
                      {intl.formatMessage({ id: rounding })}
                    </MenuItem>
                  ))}
                </Dropdown>
              )}
              name="clockInRoundInMin"
            />
          </RoundClockInOutComponent>
        </EditFormRow>

        <EditFormRow>
          <RoundClockInOutComponent>
            <RoundClockInClockOutText>
              {intl.formatMessage({
                id: 'time-entries.section.title.timesheet-rounding.round-clock-out-times',
              })}
            </RoundClockInClockOutText>

            <Controller
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  multiselect={false}
                  colorScheme="light"
                  placeholder={intl.formatMessage({
                    id: 'time-entries.section.title.timesheet-rounding.select-direction',
                  })}
                  onChange={(e: any) => {
                    onChange(e.target.value);
                    e.stopPropagation();
                    track(
                      TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_CLOCK_OUT_DIRECTION,
                    );
                  }}
                  aria-label="directionClockIn"
                  value={value}
                  label={intl.formatMessage({
                    id: 'time-entries.section.title.timesheet-rounding.direction-clock-out',
                  })}
                  width="100%"
                  data-testid="round-clk-out-dir"
                >
                  {clockInClockOutDirection.map((direction) => (
                    <MenuItem value={CLOCK_IN_OUT_DIRECTIONS[direction]}>
                      {intl.formatMessage({ id: direction })}
                    </MenuItem>
                  ))}
                </Dropdown>
              )}
              name="clockOutRoundDirection"
            />

            <Controller
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  multiselect={false}
                  colorScheme="light"
                  placeholder={intl.formatMessage({
                    id: 'time-entries.section.title.timesheet-rounding.select-rounding-increment',
                  })}
                  onChange={(e: any) => {
                    onChange(e.target.value);
                    e.stopPropagation();
                    track(
                      TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_CLOCK_OUT_INCREMENT,
                    );
                  }}
                  aria-label="roundingClockIN"
                  value={value}
                  label={intl.formatMessage({
                    id: 'time-entries.section.title.timesheet-rounding.rounding-increment-clock-out',
                  })}
                  width="100%"
                  data-testid="round-clk-out-inc"
                >
                  {roundingDurations.map((rounding) => (
                    <MenuItem value={ROUNDING_INCREMENT_CLOCK_IN_OUT[rounding]}>
                      {intl.formatMessage({ id: rounding })}
                    </MenuItem>
                  ))}
                </Dropdown>
              )}
              name="clockOutRoundInMin"
            />
          </RoundClockInOutComponent>
        </EditFormRow>
      </SectionContainer>
    </>
  );
};
