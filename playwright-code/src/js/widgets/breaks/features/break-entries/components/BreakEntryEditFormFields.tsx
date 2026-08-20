import React, { useRef, useState, useEffect } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import dayjs from 'dayjs';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
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
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import { useAppSelector } from 'src/js/widgets/breaks/store/hooks';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { useBreakEntryTrackingPoints } from '../hooks/useBreakEntryTrackingPoints';
import { BreakEntry, BreakRule } from '../../../types';
import LoadingOverlay from './LoadingOverlay';

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

const NameField = styled.div``;

const BreakRuleField = styled.div``;

const DurationFieldContainer = styled.div``;

const CurrentlyWorkingField = styled.div``;

const FormWrapper = styled.div`
  position: relative;
`;

const DisabledFieldset = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0;

  &:disabled {
    opacity: 0.6;
    pointer-events: none;
  }
`;

interface BreakEntryEditFormFieldsProps {
  disabled?: boolean;
}

const BreakEntryEditFormFields: React.FC<BreakEntryEditFormFieldsProps> = ({
  disabled = false,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );
  const { setValue, getValues, formState } = useFormContext<BreakEntry>();
  const [isTeamMemberLoading, setIsTeamMemberLoading] = useState(
    !isWorkforceUser,
  );
  const logger = useLoggingConfig();
  const trackingPoints = useBreakEntryTrackingPoints();

  const contact = useWatch({ name: 'contact' });
  const startTime = useWatch({ name: 'startTime' });
  const endTime = useWatch({ name: 'endTime' });
  const duration = useWatch({ name: 'duration' });
  const currentlyWorking = useWatch({ name: 'currentlyWorking' });
  const timezone = useWatch({ name: 'timezone' });
  const startDate = useWatch({ name: 'startDate' });
  const isQuickFindEnabled = useAppSelector(
    (state) => state.breakEntries.isQuickFindEnabled,
  );
  // Get dirtyFields to track manual changes
  const { dirtyFields } = formState;
  // Check if employee is selected - TeamMember stores contact as {id, name, type}

  // Determine if we should show start/end time or duration based on existing data
  const hasStartEndTime =
    startTime && endTime && startTime.isValid() && endTime.isValid();
  const hasDuration = duration && duration > 0;
  // Show start/end time fields if we have valid start/end times, otherwise show duration
  // If we have duration but no start/end times, show duration field
  // Also show duration field if we don't have start/end times (to allow user input)
  const showStartEndTimeFields = hasStartEndTime;
  // removed duration null check - see QUANTA-4076
  const showDurationField = !hasStartEndTime;

  // Auto-set start/end time when currentlyWorking is checked
  useEffect(() => {
    if (currentlyWorking) {
      // When currentlyWorking is checked, automatically switch to start/end time mode
      setValue('useStartEndTime', true);

      // Set current time as start time if not already set
      const now = dayjs();
      if (!startTime || !startTime.isValid()) {
        setValue('startTime', now);
      }
    }
  }, [currentlyWorking, setValue, startTime]);

  // Effect to have endDate follow startDate (same behavior as STE)
  // Only when user manually changes startDate
  useEffect(() => {
    const startDate = getValues('startDate');
    const endDate = getValues('endDate');

    // Only sync endDate with startDate if user manually changed startDate
    // Check if startDate is in dirtyFields (meaning user manually changed it)
    const isStartDateManuallyChanged = dirtyFields.startDate;

    if (
      isStartDateManuallyChanged &&
      (!endDate || !endDate.isSame(startDate))
    ) {
      setValue('endDate', startDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    startDate,
    dirtyFields.startDate, // Watch for manual changes to startDate
  ]);

  const handleTeamMemberReady = () => {
    setIsTeamMemberLoading(false);
  };

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
      BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS
        .BREAK_ENTRY_EDIT_FORM_FIELD_CHANGED,
      {
        field: 'breakRule',
        value: breakId,
        breakRuleName: breakRule.breakName,
      },
    );

    // If the break rule has duration, set the end time accordingly
    if (breakRule.breakDuration) {
      const currentStartTime = getValues('startTime');
      if (currentStartTime && currentStartTime.isValid()) {
        const endTime = currentStartTime.add(
          breakRule.breakDuration,
          'minutes',
        );
        setValue('endTime', endTime);
      }
    }
  };

  const ref = useRef<HTMLDivElement>(null);

  return (
    <FormWrapper>
      <LoadingOverlay
        isLoading={isTeamMemberLoading || isQuickFindEnabled === undefined}
      />
      <FormFieldsContainer>
        {isQuickFindEnabled !== undefined && !isWorkforceUser && (
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
                        disabled={disabled}
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
                          const existingValue = getValues().contact;
                          const updatedValue = {
                            ...existingValue,
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
                        disabled={disabled}
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
        <DisabledFieldset disabled={disabled}>
          {/* Currently Working Checkbox - Show only when isOpen is true (currentlyWorking is true) */}
          {currentlyWorking && (
            <CurrentlyWorkingField>
              <FormCheckbox
                name="currentlyWorking"
                disabled={disabled}
                labelKey="breaks.entry.form.currentlyWorking.label"
                trackingPoint={trackingPoints.BREAK_CURRENTLY_WORKING_FIELD}
                defaultChecked={false}
              />
            </CurrentlyWorkingField>
          )}

          {/* Break Rule Selection - hidden for time off entries */}
          {!disabled && (
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
                        disabled,
                        assigneeId: contact?.id, // Use selected employee's ID
                        breakId: value,
                        width: BREAK_ENTRY_FIELDS_WIDTH,
                        filter: {
                          isActive: true,
                          allowManual: true,
                          includeDeleted: true,
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
          )}

          {/* Conditional Fields based on existing data */}
          {(() => {
            if (showStartEndTimeFields) {
              // Show Start Date and Start Time in one row
              return (
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
                          disabled={disabled}
                        />
                      )}
                    />
                  </FormField>
                  <FormField>
                    <Controller
                      name="startTime"
                      rules={{
                        required: intl.formatMessage({
                          id: 'breaks.entry.form.startTime.required',
                          defaultValue: 'Start time is required',
                        }),
                      }}
                      render={({
                        field: { onChange, value },
                        fieldState: { error },
                      }) => (
                        <TimeDropdown
                          width={BREAK_ENTRY_FIELDS_WIDTH}
                          name="startTime"
                          disabled={disabled}
                          labelKey="breaks.entry.form.startTime.label"
                          trackingPoint={trackingPoints.BREAK_START_TIME_FIELD}
                        />
                      )}
                    />
                  </FormField>
                </FormRow>
              );
            }

            if (showDurationField && !currentlyWorking) {
              // Show Start Date and Duration in one row when duration is present but no start/end times
              return (
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
                          disabled={disabled}
                        />
                      )}
                    />
                  </FormField>
                  <FormField>
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
                          disabled={disabled}
                          label={intl.formatMessage({
                            id: 'breaks.entry.form.duration.label',
                            defaultValue: 'Duration',
                          })}
                          errorText={error?.message}
                          setError={() => {}} // DurationField handles its own errors
                          trackingPoint={trackingPoints.DURATION_FIELD}
                        />
                      )}
                    />
                  </FormField>
                </FormRow>
              );
            }

            // Show Duration field when we have duration but no start/end times (fallback)
            if (showDurationField && !currentlyWorking) {
              return (
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
                        disabled={disabled}
                        label={intl.formatMessage({
                          id: 'breaks.entry.form.duration.label',
                          defaultValue: 'Duration',
                        })}
                        errorText={error?.message}
                        setError={() => {}} // DurationField handles its own errors
                        trackingPoint={trackingPoints.DURATION_FIELD}
                      />
                    )}
                  />
                </DurationFieldContainer>
              );
            }

            return null;
          })()}

          {/* End Date and End Time in one row - Show when not currently working and we have start/end times */}
          {!currentlyWorking &&
            showStartEndTimeFields &&
            !showDurationField && (
              <FormRow>
                <FormField>
                  <Controller
                    name="endDate"
                    rules={{
                      required: intl.formatMessage({
                        id: 'breaks.entry.form.endDate.required',
                        defaultValue: 'End date is required',
                      }),
                    }}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <FormattedDatePicker
                        value={value || dayjs()}
                        onChange={(date) => onChange(date || dayjs())}
                        labelId="breaks.entry.form.endDate.label"
                        errorText={error?.message}
                        width={BREAK_ENTRY_FIELDS_WIDTH}
                        disabled={disabled}
                      />
                    )}
                  />
                </FormField>
                <FormField>
                  <Controller
                    name="endTime"
                    rules={{
                      required: intl.formatMessage({
                        id: 'breaks.entry.form.endTime.required',
                        defaultValue: 'End time is required',
                      }),
                    }}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <TimeDropdown
                        width={BREAK_ENTRY_FIELDS_WIDTH}
                        name="endTime"
                        disabled={disabled}
                        labelKey="breaks.entry.form.endTime.label"
                        trackingPoint={trackingPoints.BREAK_END_TIME_FIELD}
                      />
                    )}
                  />
                </FormField>
              </FormRow>
            )}

          {/* Timezone Field */}
          {timezone && showStartEndTimeFields && !currentlyWorking && (
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
                    readOnly={disabled}
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
                  disabled={disabled}
                  trackingPoint={trackingPoints.BREAK_NOTES_FIELD}
                  resizeTextArea
                  rows={4}
                  maxHeight="120px"
                />
              )}
            />
          </FormField>
        </DisabledFieldset>
      </FormFieldsContainer>
    </FormWrapper>
  );
};

export default BreakEntryEditFormFields;
