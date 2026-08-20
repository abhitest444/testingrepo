import React, { useMemo, useRef } from 'react';
import DatePicker, { ChangeEventType } from '@ids-ts/date-picker';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { useWatch } from 'react-hook-form';
import dayjs, { Dayjs } from 'dayjs';
import {
  getDateFormat,
  validateAndFormatDate,
  mapQBTimezoneToDayjsTimezone,
} from 'src/js/common/DateAndTimeUtils';

// Wire format for the picker's min/max bounds. @ids-ts/date-picker parses these
// props format-less via moment, which falls back to the native Date() parser for
// localized formats (e.g. DD/MM/YYYY) and is inconsistent across browsers (breaks
// in Chrome, works in Safari). ISO 8601 is parsed reliably everywhere, so this is
// intentionally locale-independent and must NOT use the display date format.
export const ISO_DATE_FORMAT = 'YYYY-MM-DD';

export interface FormattedDatePickerProps {
  value: Dayjs;
  onChange: (value?: Dayjs) => void;
  width?: number; // in px
  errorText?: string;
  setError?: (error?: string) => void;
  labelId?: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  disabled?: boolean;
}

export const FormattedDatePicker = ({
  value,
  labelId,
  onChange,
  width,
  errorText,
  setError,
  minDate,
  maxDate,
  disabled: disabledProp,
}: FormattedDatePickerProps) => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const dateFormat = useMemo(() => getDateFormat(sandbox), [sandbox]);

  // Watch isApproved from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  // Watch timezone from form context
  const timezone = useWatch({
    name: 'timezone',
  });

  // Track if there's currently an error to avoid unnecessary setError calls
  const hasError = useRef(false);

  const valueToFormat = value ?? dayjs(); // fallback to today's date if value is undefined
  const formattedValue = valueToFormat.format(dateFormat.toUpperCase());

  // Common function to process date input and call onChange/setError
  const processDateInput = (inputValue: string, upperDateFormat: string) => {
    const formattedDate = validateAndFormatDate(inputValue, upperDateFormat);

    if (formattedDate.isValidDate) {
      // Valid date detected (either in standard format or mobile format)
      // Create the date in the specified timezone or UTC if no timezone
      const newDate = timezone
        ? dayjs.tz(
            formattedDate.formattedDate,
            upperDateFormat,
            mapQBTimezoneToDayjsTimezone(timezone),
          )
        : dayjs.utc(formattedDate.formattedDate, upperDateFormat);
      onChange(newDate);

      // Only clear error if there was one
      if (hasError.current && setError) {
        setError(undefined);
        hasError.current = false;
      }
    } else {
      // If validation fails, set the error
      onChange(
        dayjs(formattedDate.formattedDate || inputValue, upperDateFormat),
      );

      // Only set error if there wasn't one already
      if (!hasError.current && setError) {
        setError(intl.formatMessage({ id: 'date.format.error' }));
        hasError.current = true;
      }
    }
  };

  const handleChange = (e: ChangeEventType) => {
    const inputValue = (e.target as HTMLInputElement)?.value?.toString() || '';
    const upperDateFormat = dateFormat.toUpperCase();
    // process the date input
    processDateInput(inputValue, upperDateFormat);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toString() || '';
    const upperDateFormat = dateFormat.toUpperCase();
    // process the date input
    processDateInput(inputValue, upperDateFormat);
  };

  return (
    <DatePicker
      disabled={disabledProp || isLocked}
      width={width}
      onChange={handleChange}
      onBlur={handleBlur}
      value={formattedValue}
      dateFormat={dateFormat}
      label={intl.formatMessage({
        id: labelId || 'drawer.form.startDate.label',
      })}
      errorText={errorText}
      minDate={minDate?.format(ISO_DATE_FORMAT)}
      maxDate={maxDate?.format(ISO_DATE_FORMAT)}
      // errorText={errors?.startDate?.message as string}
    />
  );
};
