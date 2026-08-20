import React from 'react';
import { Controller } from 'react-hook-form';
import { useTracking } from '@payroll/quicksand';
import { TimeOffMethod } from 'src/__generated__/gas/graphql';
import { CompensationDropdown } from 'src/js/widgets/common/CompensationDropdown';
import { TrackingPoint } from '../../../common/useClickTracking';

export interface FormCompensationProps {
  name: string;
  width?: number | string;
  trackingPoint: TrackingPoint;
  updateLabel?: (field: string, value: string) => void;
  timeOffMethod?: TimeOffMethod | null;
}

export const FormCompensation = ({
  name,
  width,
  trackingPoint,
  updateLabel,
  timeOffMethod,
}: FormCompensationProps) => {
  const track = useTracking();

  return (
    <Controller
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <CompensationDropdown
          value={value.id}
          onChange={(selectedOption) => {
            track(trackingPoint);
            onChange(selectedOption);
          }}
          errorText={error?.message}
          width={width}
          updateLabel={updateLabel}
          timeOffMethod={timeOffMethod}
        />
      )}
    />
  );
};
