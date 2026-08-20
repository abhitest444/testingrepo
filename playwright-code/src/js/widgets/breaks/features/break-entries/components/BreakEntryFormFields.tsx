import React, { useRef, useState, useEffect } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import dayjs from 'dayjs';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { Switch } from '@ids-ts/switch';
import { FormattedDatePicker } from 'src/js/widgets/common/FormattedDatePicker';
import { TimeDropdown } from 'src/js/widgets/common/addTimeFormComponents/TimeDropdown';
import { TimeZoneField } from 'src/js/widgets/common/addTimeFormComponents/TimeZoneField';
import { Notes } from 'src/js/widgets/common/addTimeFormComponents/Notes';
import { DurationField } from 'src/js/widgets/common/DurationField';
import { FormCheckbox } from 'src/js/widgets/common/addTimeFormComponents/FormCheckbox';
import {
  mapStringToTimeForType,
  mapTimeForState,
  TeamMember,
  TimeForFormState,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import {
  BREAK_ENTRY_FIELDS_WIDTH,
  BREAK_LOGGING_CONSTANTS,
} from 'src/js/widgets/breaks/constants';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useAppSelector } from 'src/js/widgets/breaks/store/hooks';
import { useBreakEntryTrackingPoints } from '../hooks/useBreakEntryTrackingPoints';
import LoadingOverlay from './LoadingOverlay';
import { BreakEntry, BreakRule } from '../../../types';

const FormFieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const ToggleFormField = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
  padding-top: 32px;
`;

const NameField = styled.div``;

const BreakRuleField = styled.div``;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToggleLabel = styled.span`
  font-size: var(--font-size-input-label);
  color: var(--color-input-label); /* (SemanticContextMatchOnly) */
`;

const DurationFieldContainer = styled.div``;

const CurrentlyWorkingField = styled.div``;

const FormWrapper = styled.div`
  position: relative;
`;

interface BreakEntryFormFieldsProps {
  shouldShowTeamMemberField: boolean;
}

const BreakEntryFormFields: React.FC<BreakEntryFormFieldsProps> = ({
  shouldShowTeamMemberField,
}) => {
  const intl = useIntl();
  const { setValue, getValues } = useFormContext<BreakEntry>();
  const [isTeamMemberLoading, setIsTeamMemberLoading] = useState(
    shouldShowTeamMemberField,
  );
  const logger = useLoggingConfig();
  const track = useTracking();
  const trackingPoints = useBreakEntryTrackingPoints();

  const showStartEndTimeFields = useWatch({ name: 'useStartEndTime' });
  const currentlyWorking = useWatch({ name: 'currentlyWorking' });
  const contact = useWatch({ name: 'contact' });
  const isQuickFindEnabled = useAppSelector(
    (state) => state.breakEntries.isQuickFindEnabled,
  );

  // Auto-set start/end time when currentlyWorking is checked
  useEffect(() => {
    if (currentlyWorking) {
      // When currentlyWorking is checked, automatically switch to start/end time mode
      setValue('useStartEndTime', true);

      // // Set current time as start time
      // const now = dayjs();
      // setValue('startTime', now);
    }
  }, [currentlyWorking, setValue]);

  const handleTeamMemberReady = () => {
    setIsTeamMemberLoading(false);
  };

  useEffect(() => {
    setIsTeamMemberLoading(shouldShowTeamMemberField);
  }, [shouldShowTeamMemberField]);

  const handleBreakSelected = (
    breakId: string,
    breakRule: BreakRule,
    onChange?: (value: string) => void,
  ) => {
    // Update the form with the selected break rule
    setValue('breakRule', breakId);
    setValue('name', breakRule.breakName || '');

    // Call the Controller's onChange if provided
    if (onChange) {
      onChange(breakId);
    }

    // Store the full break rule for later use
    setValue('selectedBreakRule', breakRule);

    // Log the break rule selection
    logger.info(
      BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.BREAK_ENTRY_FORM_FIELD_CHANGED,
      {
        field: 'breakRule',
        value: breakId,
        breakRuleName: breakRule.breakName,
      },
    );

    // If the break rule has duration, set the end time accordingly
    // if (breakRule.breakDuration) {
    //   const startTime = getValues('startTime');
    //   // if (startTime && startTime.isValid()) {
    //   //   const endTime = startTime.add(breakRule.breakDuration, 'minutes');
    //   //   setValue('endTime', endTime);
    //   // }
    // }
  };

  const handleToggleChange = (checked: boolean) => {
    setValue('useStartEndTime', checked, { shouldDirty: true });

    // Track toggle change with enabled/disabled state
    track({
      ...trackingPoints.SET_START_END_TIME_TOGGLE,
      ui_action: checked ? 'enabled' : 'disabled',
    });

    // Log the toggle change
    logger.info(
      BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.BREAK_ENTRY_FORM_FIELD_CHANGED,
      {
        field: 'useStartEndTime',
        value: checked,
      },
    );

    // If unchecking start/end time while currently working, also uncheck currently working
    if (!checked && currentlyWorking) {
      setValue('currentlyWorking', false);
    }

    if (checked) {
      // When switching to start/end time, set default times
      setValue('startTime', dayjs().startOf('hour'));
      setValue('endTime', dayjs().startOf('hour').add(1, 'hour'));
    } else {
      // When switching to duration, clear start/end times and set default duration
      setValue('startTime', dayjs().startOf('hour'));
      // setValue('endTime', dayjs().startOf('hour').add(1, 'hour'));

      // setValue('duration', null); // Default 1 hour in seconds
    }
  };

  const ref = useRef<HTMLDivElement>(null);

  return (
    <FormWrapper>
      <LoadingOverlay
        isLoading={isTeamMemberLoading || isQuickFindEnabled === undefined}
      />
      <FormFieldsContainer>
        {isQuickFindEnabled !== undefined && shouldShowTeamMemberField && (
          <NameField>
            <Controller
              name="contact"
              rules={{
                validate: (value: TimeForFormState) => {
                  if (!value || !value.id || value.id === '') {
                    return intl.formatMessage({
                      id: 'drawer.field.required',
                    });
                  }
                  return undefined;
                },
              }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <>
                  <div ref={ref}>
                    {isQuickFindEnabled ? (
                      <Widget
                        widgetId="time-tracking-ui/quickFind"
                        dropdownType="team-member"
                        width="16em"
                        subTypes={[
                          DataAccess_ContactType.Employee,
                          DataAccess_ContactType.Vendor,
                        ]}
                        onChange={(_: string, item: any) => {
                          onChange(item);
                        }}
                        value={value?.id}
                        onReady={() => {
                          // setValue('contact', data[0], { shouldDirty: false });
                          handleTeamMemberReady();
                        }}
                        placeholder={intl.formatMessage({
                          id: 'team.member.placeholder',
                        })}
                        label={intl.formatMessage({
                          id: 'team.member',
                        })}
                        onLoad={(data: any[]) => {
                          const item = data?.[0];
                          const existingValue = getValues().contact;
                          const updatedValue = {
                            ...existingValue,
                            ...item,
                          };
                          setValue('contact', updatedValue, {
                            shouldDirty: false,
                          });
                        }}
                        errorText={error?.message}
                        filters={{
                          subtypes: {
                            [DataAccess_ContactType.Vendor]: {
                              contractor: true,
                            },
                          },
                        }}
                      />
                    ) : (
                      <Widget
                        widgetId="qbo-quickfills-ui/quickfills"
                        addNew={false}
                        shouldShowSubLabel
                        type="contact"
                        subTypes={['employee', 'vendor']}
                        value={value?.id}
                        onChange={(e: any) => {
                          const newValue = mapTimeForState(e);
                          onChange(newValue);
                        }}
                        onReady={handleTeamMemberReady}
                        onLoad={(item: any) => {
                          const input = ref.current?.querySelector('input');
                          if (input) {
                            input.value = getValues().contact?.id;
                          }

                          const existingValue = getValues().contact;
                          const updatedValue = {
                            ...existingValue,
                            ...(item?.contact?.type && {
                              type: mapStringToTimeForType(item.contact.type),
                            }),
                          };
                          setValue('contact', updatedValue, {
                            shouldDirty: false,
                          });
                        }}
                        placeholder={intl.formatMessage({
                          id: 'team.member.placeholder',
                        })}
                        label={intl.formatMessage({
                          id: 'team.member',
                        })}
                        errorText={error?.message}
                        width={BREAK_ENTRY_FIELDS_WIDTH}
                        excludePayrollInactiveEmployees
                      />
                    )}
                  </div>
                </>
              )}
            />
          </NameField>
        )}

        {/* Show other fields only when employee is selected */}
        <>
          {/* Currently Working Checkbox */}
          <CurrentlyWorkingField>
            <FormCheckbox
              name="currentlyWorking"
              labelKey="breaks.entry.form.currentlyWorking.label"
              trackingPoint={trackingPoints.BREAK_CURRENTLY_WORKING_FIELD}
              defaultChecked={false}
            />
          </CurrentlyWorkingField>

          {/* Break Rule Selection */}
          <BreakRuleField>
            <Controller
              name="breakRule"
              rules={{
                required: intl.formatMessage({
                  id: 'breaks.entry.form.breakRule.required',
                  defaultValue: 'Break type is required',
                }),
              }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <Widget
                  key="break-rule-selector"
                  widgetId="time-tracking-ui/breaks"
                  options={{
                    feature: 'breaks-quickfills',
                    functionality: 'breaks-selector-quickfill',
                    props: {
                      assigneeId: contact?.id, // Use selected employee's ID
                      width: BREAK_ENTRY_FIELDS_WIDTH,
                      filter: {
                        isActive: true,
                        allowManual: true,
                      },
                      onBreakSelected: (
                        breakId: string,
                        breakRule: BreakRule,
                      ) => handleBreakSelected(breakId, breakRule, onChange),
                      errorText: error?.message,
                      value,
                    },
                  }}
                />
              )}
            />
          </BreakRuleField>

          {/* Start Date and Toggle Switch - Always visible */}
          <FormRow>
            <FormField>
              <Controller
                name="startDate"
                rules={{
                  validate: (value) => {
                    if (!value || !dayjs(value).isValid()) {
                      return intl.formatMessage({
                        id: 'breaks.entry.form.startDate.required',
                        defaultValue: 'Start date is required',
                      });
                    }
                    return undefined;
                  },
                }}
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormattedDatePicker
                    value={value || null}
                    onChange={(date) => onChange(date || null)}
                    labelId="breaks.entry.form.startDate.label"
                    errorText={error?.message}
                    width={BREAK_ENTRY_FIELDS_WIDTH}
                  />
                )}
              />
            </FormField>
            <ToggleFormField>
              <ToggleRow>
                <ToggleLabel>
                  {intl.formatMessage({
                    id: 'breaks.entry.form.useStartEndTime.label',
                    defaultValue: 'Set start and end time',
                  })}
                </ToggleLabel>
                <Controller
                  name="useStartEndTime"
                  render={({ field: { onChange, value } }) => (
                    <Switch
                      checked={value || false}
                      onChange={() => handleToggleChange(!value)}
                      aria-label={intl.formatMessage({
                        id: 'breaks.entry.form.useStartEndTime.label',
                        defaultValue: 'Set start and end time',
                      })}
                    />
                  )}
                />
              </ToggleRow>
            </ToggleFormField>
          </FormRow>

          {/* Conditional Fields based on toggle */}
          {!showStartEndTimeFields && !currentlyWorking && (
            <DurationFieldContainer>
              <Controller
                name="duration"
                rules={{
                  required: intl.formatMessage({
                    id: 'breaks.entry.form.duration.required',
                    defaultValue: 'Duration is required',
                  }),
                }}
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <DurationField
                    width={`${BREAK_ENTRY_FIELDS_WIDTH}px`}
                    name="duration"
                    value={value || null}
                    onChange={onChange}
                    label={intl.formatMessage({
                      id: 'breaks.entry.form.duration.label',
                      defaultValue: 'Duration',
                    })}
                    errorText={error?.message}
                    setError={() => {}}
                    trackingPoint={trackingPoints.DURATION_FIELD}
                  />
                )}
              />
            </DurationFieldContainer>
          )}

          {/* Start Time and End Time in one row - Show when using start/end time mode */}
          {showStartEndTimeFields && (
            <FormRow>
              <FormField>
                <Controller
                  name="startTime"
                  rules={{
                    required: intl.formatMessage({
                      id: 'breaks.entry.form.startTime.required',
                      defaultValue: 'Start time is required',
                    }),
                  }}
                  render={() => (
                    <TimeDropdown
                      width={BREAK_ENTRY_FIELDS_WIDTH}
                      name="startTime"
                      labelKey="breaks.entry.form.startTime.label"
                      trackingPoint={trackingPoints.BREAK_START_TIME_FIELD}
                    />
                  )}
                />
              </FormField>
              {/* End Time only - Show when not currently working */}
              {!currentlyWorking && showStartEndTimeFields && (
                <FormField>
                  <Controller
                    name="endTime"
                    rules={{
                      required:
                        !currentlyWorking && showStartEndTimeFields
                          ? intl.formatMessage({
                              id: 'breaks.entry.form.endTime.required',
                              defaultValue: 'End time is required',
                            })
                          : undefined,
                    }}
                    render={() => (
                      <TimeDropdown
                        width={BREAK_ENTRY_FIELDS_WIDTH}
                        name="endTime"
                        labelKey="breaks.entry.form.endTime.label"
                        trackingPoint={trackingPoints.BREAK_END_TIME_FIELD}
                      />
                    )}
                  />
                </FormField>
              )}
            </FormRow>
          )}

          {/* Timezone Field */}
          {showStartEndTimeFields && (
            <FormField>
              <Controller
                name="timezone"
                rules={{
                  required: intl.formatMessage({
                    id: 'breaks.entry.form.timezone.required',
                    defaultValue: 'Timezone is required',
                  }),
                }}
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <TimeZoneField
                    width="100%"
                    name="timezone"
                    value={value}
                    onChange={onChange}
                    errorText={error?.message}
                    trackingPoint={trackingPoints.BREAK_TIMEZONE_FIELD}
                  />
                )}
              />
            </FormField>
          )}

          {/* Description Field */}
          <FormField>
            <Controller
              name="description"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <Notes
                  name="description"
                  trackingPoint={trackingPoints.BREAK_NOTES_FIELD}
                  resizeTextArea
                  rows={4}
                  maxHeight="120px"
                />
              )}
            />
          </FormField>
        </>
      </FormFieldsContainer>
    </FormWrapper>
  );
};

export default BreakEntryFormFields;
