import React from 'react';
import { Controller } from 'react-hook-form';

import { useIntl, useTracking } from '@payroll/quicksand';
import { DurationField } from 'src/js/widgets/common/DurationField';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { WeeklyTimeRowDurationState } from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';
import { isDurationLockedPending } from 'src/js/widgets/weeklyTimeTrowser/hooks/mapWeeklyTimeForm';
import LightTooltip from 'src/js/widgets/common/LightTooltip';

export interface DurationCellProps {
  name: string;
  setError: (name: string, error: { type: string; message?: string }) => void;
  trackingPoint: TrackingPoint;
}

export const DurationCell = ({
  name,
  setError,
  trackingPoint,
}: DurationCellProps) => {
  const track = useTracking();
  const intl = useIntl();

  return (
    <Controller
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const isLockedPending = value && isDurationLockedPending(value);

        const durationField = (
          <DurationField
            name={name}
            value={value?.duration}
            billableStatus={value?.billableStatus}
            errorText={error?.message}
            disabled={isLockedPending}
            onChange={(onChangeValue) => {
              track(trackingPoint);
              onChange({
                id: value.id,
                version: value.version,
                duration: onChangeValue,
                day: value.day,
                billableStatus: value.billableStatus,
                locked: value.locked,
                lockedReason: value.lockedReason,
              } as WeeklyTimeRowDurationState);
              setError(name, { type: 'custom', message: undefined });
            }}
            setError={(error?: string) => {
              error &&
                setError(name, {
                  type: 'custom',
                  message: error,
                });
            }}
            width="60px"
          />
        );

        if (isLockedPending) {
          return (
            <LightTooltip
              message={intl.formatMessage({
                id: 'time.activity.pending.save.tooltip.message',
              })}
            >
              <div>{durationField}</div>
            </LightTooltip>
          );
        }

        return durationField;
      }}
    />
  );
};
