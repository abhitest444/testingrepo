import React, { useCallback, useEffect, useState } from 'react';
import { useIntl } from '@payroll/quicksand';
import { Checkbox } from '@ids-ts/checkbox';
import { MenuItem } from '@ids-ts/dropdown';
import Tooltip from '@ids-ts/tooltip';
import { Info } from '@design-systems/icons';
import {
  Payroll_DurationUnit,
  Common_DayOfWeek,
} from 'src/__generated__/oigql/graphql';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/breaks/store/hooks';
import {
  updateAllowAuto,
  updateFrequency,
  updateRepeatEvery,
  updateDaysOfWeek,
  updateBreakLocation,
  updateSpecificTime,
  setFieldValidationError,
} from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import { DurationFieldStandalone } from 'src/js/widgets/common/DurationFieldStandalone';
import {
  hourMinStringToSecondsNumber,
  secondsToDurationTimestamp,
} from 'src/js/common/DateAndTimeUtils';
import { formatFrequencyDisplay } from '../../../utils';
import {
  FormSection,
  BreakOptionsContainer,
  WideTextField,
  WideDropdown,
  CheckboxLabelRow,
  InfoIconMargin,
  WideTextFieldWithMax,
  FlexEndRow,
  FlexStartRow,
  FormRow,
  FormField,
  ToggleFormField,
  ToggleRow,
} from '../styles/Breaks.styled';
import { FormValidationError } from './FormValidationError';
import {
  BreakDaysOfWeek,
  BREAK_DAYS_OF_WEEK_OPTIONS,
  INDIVIDUAL_DAYS_OF_WEEK,
  BREAK_LOCATIONS,
} from '../../../constants';
import TimeDropdown from './TimeDropdown';

interface BreakAutoSectionProps {
  allowAuto: boolean;
  frequency: string;
  repeatEvery: boolean;
  daysOfWeek: Common_DayOfWeek[];
  breakLocation: string;
  specificTime: string;
  noSetDuration: boolean;
  error?: string;
}

const BreakAutoSection: React.FC<BreakAutoSectionProps> = ({
  allowAuto,
  frequency,
  repeatEvery,
  daysOfWeek,
  breakLocation,
  specificTime,
  noSetDuration,
  error,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const formData = useAppSelector((state) => state.breakPolicyForm.formData);
  const validationErrors = useAppSelector(
    (state) => state.breakPolicyForm.formData.validationErrors,
  );

  // Local state for immediate input feedback - convert string to seconds
  const [localFrequencySeconds, setLocalFrequencySeconds] = useState(
    frequency ? hourMinStringToSecondsNumber(frequency) : 14400, // 4:00 in seconds
  );
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  // Update local state when form data changes (only on initial load)
  useEffect(() => {
    setLocalFrequencySeconds(
      frequency ? hourMinStringToSecondsNumber(frequency) : 14400,
    );
  }, [frequency]);

  // Handlers that update local state immediately and Redux
  const handleFrequencyChange = useCallback(
    (value: number | null) => {
      setLocalFrequencySeconds(value || 0);
      setHasBeenTouched(true);

      // Convert seconds back to hh:mm format for Redux store
      const frequencyString = secondsToDurationTimestamp(value || 0);
      dispatch(updateFrequency(frequencyString));

      // Real-time validation
      if (allowAuto && value !== null) {
        // Validate threshold limit is not less than break duration
        const thresholdMinutes = Math.floor(value / 60);
        const breakDurationMinutes =
          formData.durationUnit === Payroll_DurationUnit.Hours
            ? (formData.breakDuration || 0) * 60
            : formData.breakDuration || 0;

        if (thresholdMinutes < breakDurationMinutes) {
          dispatch(
            setFieldValidationError({
              field: 'thresholdLimit',
              error: intl.formatMessage({
                id: 'breaks.validation.threshold.less.than.duration',
              }),
            }),
          );
        } else {
          dispatch(
            setFieldValidationError({
              field: 'frequency',
              error: '',
            }),
          );
          dispatch(
            setFieldValidationError({
              field: 'thresholdLimit',
              error: '',
            }),
          );
        }
      }
    },
    [allowAuto, dispatch, intl, formData.durationUnit, formData.breakDuration],
  );

  // Memoized handlers for better performance
  const handleAllowAutoChange = useCallback(
    (e: any) => {
      dispatch(updateAllowAuto(e.target.checked || false));
    },
    [dispatch],
  );

  const handleRepeatEveryChange = useCallback(
    (e: any) => {
      dispatch(updateRepeatEvery(e.target.checked || false));
    },
    [dispatch],
  );

  const handleDaysOfWeekChange = useCallback(
    (e: any) => {
      e.stopPropagation();
      const selectedValue = (e.target as HTMLSelectElement)
        .value as Common_DayOfWeek;

      if (daysOfWeek.includes(selectedValue)) {
        // Remove the day if already selected
        const newDays = daysOfWeek.filter((day) => day !== selectedValue);
        dispatch(updateDaysOfWeek(newDays));
      } else {
        // Add the day if not selected
        const newDays = [...daysOfWeek, selectedValue];
        dispatch(updateDaysOfWeek(newDays));
      }
    },
    [dispatch, daysOfWeek],
  );

  const handleDaysOfWeekBlur = useCallback(() => {
    setHasBeenTouched(true);

    // Validate days of week is required when auto breaks are enabled
    if (allowAuto && (!daysOfWeek || daysOfWeek.length === 0)) {
      dispatch(
        setFieldValidationError({
          field: 'daysOfWeek',
          error: intl.formatMessage({
            id: 'breaks.validation.days.of.week.required',
          }),
        }),
      );
    } else {
      // Clear the error if validation passes
      dispatch(
        setFieldValidationError({
          field: 'daysOfWeek',
          error: '',
        }),
      );
    }
  }, [dispatch, allowAuto, daysOfWeek, intl]);

  const handleBreakLocationChange = useCallback(
    (e: any) => {
      dispatch(updateBreakLocation((e.target as HTMLInputElement).value));
    },
    [dispatch],
  );

  const handleSpecificTimeChange = useCallback(
    (value: string) => {
      dispatch(updateSpecificTime(value));
    },
    [dispatch],
  );

  // Helper function to format day names for display
  const formatDayName = useCallback(
    (day: Common_DayOfWeek) => intl.formatMessage({ id: day.toLowerCase() }),
    [intl],
  );

  return (
    <FormSection>
      <Checkbox
        checked={allowAuto || false}
        data-testid="break-auto-checkbox"
        onChange={handleAllowAutoChange}
        disabled={noSetDuration}
        description={intl.formatMessage({
          id: 'breaks.create.auto.description',
        })}
      >
        {intl.formatMessage({ id: 'breaks.create.auto.label' })}
      </Checkbox>
      {allowAuto && (
        <BreakOptionsContainer>
          {/* Frequency input and repeat every X hours */}
          <FormSection>
            <FormRow>
              <FormField>
                <DurationFieldStandalone
                  value={localFrequencySeconds}
                  onChange={handleFrequencyChange}
                  setError={(error) => {
                    if (error) {
                      dispatch(
                        setFieldValidationError({
                          field: 'frequency',
                          error,
                        }),
                      );
                    } else {
                      dispatch(
                        setFieldValidationError({
                          field: 'frequency',
                          error: '',
                        }),
                      );
                    }
                  }}
                  label={intl.formatMessage({
                    id: 'breaks.create.auto.frequency.label',
                  })}
                  width="320px"
                  textAlign="left"
                  data-testid="break-frequency-input"
                />
              </FormField>
              <ToggleFormField>
                <ToggleRow>
                  <Checkbox
                    checked={repeatEvery || false}
                    data-testid="break-repeat-every-checkbox"
                    onChange={handleRepeatEveryChange}
                  >
                    {intl.formatMessage(
                      {
                        id: 'breaks.create.auto.repeatEvery.label',
                      },
                      {
                        time: formatFrequencyDisplay(
                          secondsToDurationTimestamp(localFrequencySeconds),
                        ),
                      },
                    )}
                    <Tooltip
                      message={
                        <div>
                          <div>
                            {intl.formatMessage({
                              id: 'breaks.create.auto.repeatEvery.tooltip.line1',
                            })}
                          </div>
                          <div>
                            {intl.formatMessage({
                              id: 'breaks.create.auto.repeatEvery.tooltip.line2',
                            })}
                          </div>
                          <div>
                            {intl.formatMessage({
                              id: 'breaks.create.auto.repeatEvery.tooltip.line3',
                            })}
                          </div>
                        </div>
                      }
                      position="bottom"
                      alignment="bottom"
                      tooltipOffsetSkidding={15}
                      tooltipOffsetDistance={-10}
                    >
                      <InfoIconMargin tabIndex={0}>
                        <Info
                          aria-label={intl.formatMessage({
                            id: 'breaks.create.auto.repeatEvery.tooltip.line1',
                          })}
                        />
                      </InfoIconMargin>
                    </Tooltip>
                  </Checkbox>
                </ToggleRow>
              </ToggleFormField>
            </FormRow>
            {(error || validationErrors.frequency) && (
              <FormValidationError
                message={validationErrors.frequency || error || ''}
                testId="break-auto-validation-error"
              />
            )}
          </FormSection>

          {/* Days of week dropdown */}
          <FormSection>
            <WideDropdown
              multiselect
              label={intl.formatMessage({
                id: 'breaks.create.auto.daysOfWeek.label',
              })}
              value={daysOfWeek || []}
              onChange={handleDaysOfWeekChange}
              onBlur={handleDaysOfWeekBlur}
              aria-label={intl.formatMessage({
                id: 'breaks.create.auto.daysOfWeek.label',
              })}
              placeholder={intl.formatMessage({
                id: 'breaks.create.auto.daysOfWeek.placeholder',
              })}
            >
              {INDIVIDUAL_DAYS_OF_WEEK.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {intl.formatMessage({ id: option.label })}
                </MenuItem>
              ))}
            </WideDropdown>
            {validationErrors.daysOfWeek && hasBeenTouched && (
              <FormValidationError
                message={validationErrors.daysOfWeek}
                testId="break-days-of-week-validation-error"
              />
            )}
          </FormSection>

          {/* Break location dropdown and specific time input in a row */}
          <FormSection>
            <FlexStartRow>
              <WideDropdown
                label={intl.formatMessage({
                  id: 'breaks.create.auto.location.label',
                })}
                value={breakLocation || BREAK_LOCATIONS.MIDDLE}
                onChange={handleBreakLocationChange}
                aria-label={intl.formatMessage({
                  id: 'breaks.create.auto.location.label',
                })}
              >
                <MenuItem value={BREAK_LOCATIONS.START}>
                  {intl.formatMessage({
                    id: 'breaks.create.auto.location.start',
                  })}
                </MenuItem>
                <MenuItem value={BREAK_LOCATIONS.MIDDLE}>
                  {intl.formatMessage({
                    id: 'breaks.create.auto.location.middle',
                  })}
                </MenuItem>
                <MenuItem value={BREAK_LOCATIONS.END}>
                  {intl.formatMessage({
                    id: 'breaks.create.auto.location.end',
                  })}
                </MenuItem>
                <MenuItem value={BREAK_LOCATIONS.SPECIFIC}>
                  {intl.formatMessage({
                    id: 'breaks.create.location.specific',
                  })}
                </MenuItem>
              </WideDropdown>

              {/* Specific time input fields - only show when "specific time" is selected */}
              {breakLocation === BREAK_LOCATIONS.SPECIFIC && (
                <TimeDropdown
                  value={specificTime}
                  onChange={handleSpecificTimeChange}
                  label={intl.formatMessage({
                    id: 'breaks.create.auto.specificTime.label',
                  })}
                  ariaLabel={intl.formatMessage({
                    id: 'breaks.create.auto.specificTime.label',
                  })}
                />
              )}
            </FlexStartRow>
          </FormSection>
        </BreakOptionsContainer>
      )}
    </FormSection>
  );
};

export default BreakAutoSection;
