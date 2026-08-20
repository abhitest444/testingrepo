import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import React from 'react';
import styled from 'styled-components';
import TextField from '@ids-ts/text-field';
import Tooltip from '@ids-ts/tooltip';
import { CircleQuestion } from '@design-systems/icons';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { FormCheckbox } from './FormCheckbox';

// Maximum mileage value to prevent user input errors (as per Tsheets limit)
const MAX_MILEAGE_MILES = 10424.86;

export interface MileageProps {
  name: string;
  trackingPoint: TrackingPoint;
  autoCalculateTrackingPoint: TrackingPoint;
}

const MileageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

const TextFieldWrapper = styled.div`
  flex: 1;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 32px 2px 0;
  max-height: 64px;
`;

const TooltipContent = styled.div`
  display: flex;
  align-items: center;
`;

export const Mileage = ({
  name,
  trackingPoint,
  autoCalculateTrackingPoint,
}: MileageProps) => {
  const intl = useIntl();
  const track = useTracking();
  const { setError } = useFormContext();

  // Watch isLocked from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  // Watch autoCalculateMileage to determine if field should be readonly
  const autoCalculateMileage = useWatch({
    name: 'autoCalculateMileage',
    defaultValue: true,
  });

  const handleMileageChange = (
    inputValue: string,
    onChange: (value: number | null) => void,
  ) => {
    const parsedValue = inputValue === '' ? null : parseFloat(inputValue);
    let errorMessage: string | undefined;

    // Validation only applies when manual entry is enabled
    if (!autoCalculateMileage && parsedValue !== null) {
      // Check for negative values and set error if applicable
      if (parsedValue < 0) {
        errorMessage = intl.formatMessage({
          id: 'mileage.negative.error',
        });
      }
      // Check for max mileage value limit and set error if applicable
      else if (parsedValue > MAX_MILEAGE_MILES) {
        errorMessage = intl.formatMessage(
          {
            id: 'mileage.max.error',
          },
          { max: MAX_MILEAGE_MILES },
        );
      }
    }

    // Set or clear error based on validation result
    setError(name, { type: 'custom', message: errorMessage });
    onChange(parsedValue);
  };

  const handleMileageBlur = () => {
    // Track only when user finishes editing (on blur)
    track(trackingPoint);
  };

  return (
    <MileageContainer>
      <TextFieldWrapper>
        <Controller
          name={name}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <TextField
              type="number"
              value={value ?? ''}
              onChange={(e) => handleMileageChange(e.target.value, onChange)}
              onBlur={handleMileageBlur}
              hideArrows
              width="100%"
              disabled={isLocked}
              readOnly={autoCalculateMileage === true}
              label={intl.formatMessage({
                id: 'drawer.form.mileage.label',
              })}
              errorText={error?.message}
            />
          )}
        />
      </TextFieldWrapper>

      <CheckboxWrapper>
        <FormCheckbox
          name="autoCalculateMileage"
          labelKey="drawer.form.mileage.auto.calculate"
          trackingPoint={autoCalculateTrackingPoint}
          defaultChecked={autoCalculateMileage}
        />
        <Tooltip
          tooltipOffsetSkidding={-2}
          message={intl.formatMessage({
            id: 'mileage.auto.calculate.info',
          })}
        >
          <TooltipContent>
            <CircleQuestion
              color="#6B6C72"
              data-testid="circle-question-icon"
            />
          </TooltipContent>
        </Tooltip>
      </CheckboxWrapper>
    </MileageContainer>
  );
};
