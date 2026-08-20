import React, { useCallback, useState, useEffect } from 'react';
import { useIntl } from '@payroll/quicksand';
import { Dropdown, MenuItem } from '@ids-ts/dropdown';
import { Checkbox } from '@ids-ts/checkbox';
import Tooltip from '@ids-ts/tooltip';
import { Info } from '@design-systems/icons';
import { Typography } from '@ids-ts/typography';
import { Payroll_DurationUnit } from 'src/__generated__/oigql/graphql';
import {
  useAppDispatch,
  useAppSelector,
  useBreakPolicyForm,
} from 'src/js/widgets/breaks/store/hooks';
import {
  updateBreakDuration,
  updateDurationUnit,
  updateNoSetDuration,
  updateAllowAuto,
  setFieldValidationError,
} from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import {
  FormSection,
  FlexRow,
  NoSetCheckboxRow,
  NoSetTooltipIcon,
  InfoGray,
} from '../styles/Breaks.styled';
import NumericInput from './NumericInput';
import { FormValidationError } from './FormValidationError';

interface BreakDurationSectionProps {
  breakDuration?: number;
  durationUnit: Payroll_DurationUnit;
  noSetDuration: boolean;
  error?: string;
}

const BreakDurationSection: React.FC<BreakDurationSectionProps> = ({
  breakDuration,
  durationUnit,
  noSetDuration,
  error,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const formData = useAppSelector((state) => state.breakPolicyForm.formData);
  const { resetDuration } = useBreakPolicyForm();

  // Local state for immediate input feedback
  const [localDuration, setLocalDuration] = useState(breakDuration || 0);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  // Update local state when form data changes (only on initial load)
  useEffect(() => {
    setLocalDuration(breakDuration || 0);
  }, [breakDuration]);

  const handleDurationChange = useCallback((value: number) => {
    setLocalDuration(value);
    setHasBeenTouched(true);
  }, []);

  const handleDurationBlur = useCallback(() => {
    dispatch(updateBreakDuration(localDuration));
    setHasBeenTouched(true);

    // Validate duration on blur only if field has been touched and noSetDuration is false
    if (!formData.noSetDuration && hasBeenTouched) {
      if (!localDuration || localDuration <= 0) {
        dispatch(
          setFieldValidationError({
            field: 'breakDuration',
            error: intl.formatMessage({
              id: 'breaks.api.error.BREAK_DURATION_NULL_FOR_SET_DURATION',
            }),
          }),
        );
      } else {
        dispatch(
          setFieldValidationError({
            field: 'breakDuration',
            error: '',
          }),
        );
      }
    }
  }, [dispatch, localDuration, formData.noSetDuration, intl, hasBeenTouched]);

  const handleDurationUnitChange = useCallback(
    (value: Payroll_DurationUnit) => {
      dispatch(updateDurationUnit(value));
    },
    [dispatch],
  );

  const handleNoSetDurationChange = useCallback(
    (checked: boolean) => {
      dispatch(updateNoSetDuration(checked));
      // Set duration to 0 and disable auto rule when "No set duration" is checked
      if (checked) {
        dispatch(updateBreakDuration(0));
        dispatch(updateAllowAuto(false));
      } else {
        // Reset duration to default when "No set duration" is unchecked
        resetDuration();
      }
    },
    [dispatch, resetDuration],
  );

  return (
    <FormSection>
      <FlexRow>
        <NumericInput
          value={localDuration}
          onChange={(e) => handleDurationChange(parseInt(e.target.value, 10))}
          onBlur={handleDurationBlur}
          size="medium"
          disabled={formData.noSetDuration}
          aria-label={
            intl.formatMessage({ id: 'breaks.create.duration.input' }) ||
            'Break duration'
          }
          data-testid="break-duration-input"
        />
        <Dropdown
          value={durationUnit || Payroll_DurationUnit.Minutes}
          onChange={(e) =>
            handleDurationUnitChange(
              (e.target as HTMLInputElement).value as Payroll_DurationUnit,
            )
          }
          disabled={formData.noSetDuration}
          aria-label={intl.formatMessage({
            id: 'breaks.create.duration.unit.dropdown.label',
          })}
        >
          <MenuItem value={Payroll_DurationUnit.Minutes}>
            {intl.formatMessage({ id: 'breaks.create.duration.minutes' })}
          </MenuItem>
          <MenuItem value={Payroll_DurationUnit.Hours}>
            {intl.formatMessage({ id: 'breaks.create.duration.hours' })}
          </MenuItem>
        </Dropdown>
      </FlexRow>

      {/* Error display */}
      {error && hasBeenTouched && (
        <FormValidationError
          message={error}
          testId="break-duration-validation-error"
        />
      )}

      {/* No set duration checkbox with tooltip */}
      <NoSetCheckboxRow>
        <Checkbox
          checked={noSetDuration}
          onChange={(e) => handleNoSetDurationChange(e.target.checked || false)}
        >
          <span>
            {intl.formatMessage({ id: 'breaks.create.duration.noSet' })}
          </span>
          <Tooltip
            message={intl.formatMessage({
              id: 'breaks.create.duration.tooltip',
            })}
            position="right"
          >
            <NoSetTooltipIcon tabIndex={0}>
              <InfoGray>
                <Info
                  aria-label={intl.formatMessage({
                    id: 'breaks.create.duration.tooltip',
                  })}
                />
              </InfoGray>
            </NoSetTooltipIcon>
          </Tooltip>
        </Checkbox>
      </NoSetCheckboxRow>
    </FormSection>
  );
};

export default BreakDurationSection;
