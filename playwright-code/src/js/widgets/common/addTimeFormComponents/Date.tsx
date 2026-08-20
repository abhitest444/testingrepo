import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import React from 'react';
import { Dayjs } from 'dayjs';

import { FormattedDatePicker } from 'src/js/widgets/common/FormattedDatePicker';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { pickLaterDate } from 'src/js/common/submitTimeDates';
import { useSubmitTimeDatesContext } from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';

export interface DateProps {
  name: string;
  width?: number;
  trackingPoint: TrackingPoint;
  labelId?: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
}

export const Date = ({
  name,
  width,
  trackingPoint,
  labelId,
  minDate,
  maxDate,
}: DateProps) => {
  const intl = useIntl();
  const track = useTracking();

  const { setError } = useFormContext();
  const startDate = useWatch({ name: 'startDate' });

  // Lock dates already submitted to TSheets (no-op when no provider is mounted).
  // `error` is intentionally not consulted: if the submit-time fetch fails,
  // `minSelectableDate` is undefined and the field falls open (no client lock).
  // This fail-open contract is deliberate and uniform across all three surfaces
  // (Date, WeekNavigator, ClockInFooterButton) — the server is the source of
  // truth and rejects submitted days, so a transient current_user blip should
  // not block editing on an unrelated, unsubmitted day.
  const { minSelectableDate } = useSubmitTimeDatesContext();
  const startMinDate = pickLaterDate(minDate, minSelectableDate);

  // When the submit-time lock covers the field's entire allowed range (e.g. Time
  // Clock caps startDate at "today" but everything up to today is already
  // submitted, so min > max), there is no selectable date. Disable the whole
  // field instead of rendering an empty/broken calendar.
  const isSubmitLocked = Boolean(
    minSelectableDate && maxDate && minSelectableDate.isAfter(maxDate),
  );

  const validate = (value?: Dayjs) => {
    if (!value || !value.isValid()) {
      return intl.formatMessage({
        id: 'drawer.field.required',
      });
    }
    return undefined;
  };

  return (
    <Controller
      name={name}
      rules={{
        validate,
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormattedDatePicker
          onChange={(value) => {
            track(trackingPoint);
            onChange(value);
          }}
          value={value}
          labelId={labelId}
          width={width}
          errorText={error?.message}
          setError={(error?: string) => {
            setError(name, {
              type: 'custom',
              message: error,
            });
          }}
          minDate={name === 'endDate' ? startDate : startMinDate}
          maxDate={maxDate}
          disabled={isSubmitLocked}
        />
      )}
    />
  );
};
