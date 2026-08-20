import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import React from 'react';
import { DurationField } from 'src/js/widgets/common/DurationField';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';
import {
  MAX_BREAK_DURATION,
  MAX_TIME_ENTRY_DURATION,
} from 'src/js/common/constants';
import { TrackingPoint } from '../../../common/useClickTracking';

export interface DurationProps {
  name: string;
  width?: number;
  labelKey?: string;
  // technically could get the `toggledBreak` state from the form context in Duration component
  // but to avoid tight coupling to form state, just pass as prop
  shouldValidate?: boolean;
  trackingPoint: TrackingPoint;
  billableStatus?: TimeTracking_BillableStatus;
  // to distinguish break field
  isBreakField?: boolean;
  // to not allow zero duration
  nonZeroDuration?: boolean;
}

export const Duration = ({
  name,
  width,
  labelKey,
  shouldValidate = true,
  trackingPoint,
  billableStatus,
  isBreakField = false,
  nonZeroDuration = false,
}: DurationProps) => {
  const intl = useIntl();
  const track = useTracking();

  const { setError } = useFormContext();
  const isExported = useWatch({ name: 'isExported' });
  const isTimeEntry = isExported === false;

  return (
    <Controller
      name={name}
      rules={{
        validate: (value: number) => {
          if (shouldValidate && value === null) {
            return intl.formatMessage({
              id: 'drawer.field.required',
            });
          }
          // for single time entry, duration cannot be zero
          if (nonZeroDuration && value === 0) {
            return intl.formatMessage({
              id: 'duration.zero.error',
            });
          }

          if (isTimeEntry && value > MAX_TIME_ENTRY_DURATION) {
            return intl.formatMessage({
              id: 'time.entry.max.duration.error',
            });
          }

          // break should not be more than 24 hours
          if (value > MAX_BREAK_DURATION && isBreakField) {
            return intl.formatMessage({
              id: 'break.max.duration',
            });
          }
          return undefined;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <DurationField
          label={intl.formatMessage({
            id: labelKey || 'duration',
          })}
          onChange={(value) => {
            track(trackingPoint);
            onChange(value);
          }}
          value={value}
          errorText={error?.message}
          setError={(error?: string) => {
            setError(name, {
              type: 'custom',
              message: error,
            });
          }}
          billableStatus={billableStatus}
          isBreakField={isBreakField}
        />
      )}
    />
  );
};
