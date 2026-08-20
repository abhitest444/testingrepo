import React, {
  ChangeEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import dayjs, { Dayjs } from 'dayjs';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import {
  OnKeyDownInfoType,
  ReactEvent,
} from '@ids-ts/dropdown-typeahead/dist/types';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { LOCALS } from '../../../common/constants';
import {
  formatTime,
  isValidTime,
  timeStringToDayjs,
} from '../../../common/DateAndTimeUtils';

interface INotificationTimeDropDown {
  name: string;
  labelKey?: string;
  width: string;
  trackingPoint?: TrackingPoint;
  intervalMinutes?: number;
}

interface DropdownTypeaheadOption {
  value: string;
  label: string;
}

interface TimeFormValues {
  [key: string]: Dayjs;
}

export const generateTimeOptions = (
  timeFormat: string,
  intervalMinutes: number = 15,
): DropdownTypeaheadOption[] => {
  const startOfDay = dayjs().startOf('day');
  const numberOfOptions = (24 * 60) / intervalMinutes;
  return Array.from({ length: numberOfOptions }, (_, i) => {
    const time = startOfDay
      .add(i * intervalMinutes, 'minute')
      .format(timeFormat);
    return { value: time, label: time };
  });
};

export const NotificationTimeDropDown = ({
  name,
  labelKey,
  width,
  trackingPoint,
  intervalMinutes = 15,
}: INotificationTimeDropDown) => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const track = useTracking();
  const { setError } = useFormContext<TimeFormValues>();
  const dropdownRef = useRef<any>(null);
  const prevValue = useRef<string>('');

  // Get locale and set time format
  const { locale = '' } = sandbox.appContext.getLocalizationInfo();
  const isUKLocale = locale.toLowerCase() === LOCALS.UK;
  const timeFormat = isUKLocale ? 'HH:mm' : 'h:mm A';

  // Generate time options and set up state
  const timeOptions = useMemo(
    () => generateTimeOptions(timeFormat, intervalMinutes),
    [timeFormat, intervalMinutes],
  );
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [filteredOptions, setFilteredOptions] = useState(timeOptions);

  const convertStrToDayjs = (value: string) =>
    timeStringToDayjs(formatTime(value));

  // Helper functions for accessing the input element
  const getInputElement = useCallback(() => dropdownRef.current?.inputRef, []);

  // Get current input value from ref
  const getCurrentInputValue = useCallback(
    (): string => getInputElement()?.value || '',
    [getInputElement],
  );

  const handleTimeInput = (value: string, onChange: Function) => {
    let timeString;

    // Handle different input types
    if (dayjs.isDayjs(value)) {
      // Convert to 24-hour format for storage
      timeString = value.format('HH:mm');
    } else {
      const newTime = convertStrToDayjs(value);
      timeString = newTime.isValid() ? newTime.format('HH:mm') : value;
    }

    // Convert to Dayjs object in 24-hour format before passing to form
    const timeIn24Hour = dayjs(timeString, 'HH:mm');
    onChange(timeIn24Hour);
    setInputValue(undefined);
    setFilteredOptions(timeOptions);
    if (trackingPoint) track(trackingPoint);
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '';
    setInputValue(value);
    setFilteredOptions(
      timeOptions.filter((option) =>
        option.label.toLowerCase().includes(value.toLowerCase()),
      ),
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    onChange: Function,
    info?: OnKeyDownInfoType,
  ) => {
    if (e.key === 'Enter' && info) {
      const timeOption = timeOptions[info.highlightedIndex || -1];
      if (timeOption) {
        handleTimeInput(timeOption.value, onChange);
      }
    }
  };

  const handleFocus = () => {
    if (!prevValue.current) {
      prevValue.current = getCurrentInputValue();
    }
  };

  const handleBlur = (e: ReactEvent, onChange: Function) => {
    // Process time input
    const value = (e.target as HTMLInputElement)?.value || '';
    const formattedValue = formatTime(value);

    if (isValidTime(formattedValue)) {
      const newTime = timeStringToDayjs(formattedValue);
      setError(name, { type: 'custom', message: undefined });
      onChange(newTime);
      const formattedPrevValue = convertStrToDayjs(prevValue.current);
      prevValue.current = formattedPrevValue
        ? formattedPrevValue.format(timeFormat)
        : '';
      setInputValue(undefined);
    } else {
      setInputValue('');
      setError(name, {
        type: 'custom',
        message: intl.formatMessage({ id: 'time.format.error' }),
      });
    }

    setFilteredOptions(timeOptions);
  };

  return (
    <Controller
      name={name}
      rules={{
        validate: (value: Dayjs) =>
          !value
            ? intl.formatMessage({ id: 'drawer.field.required' })
            : undefined,
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <DropdownTypeahead
          ref={dropdownRef}
          addNew={false}
          dataSource={filteredOptions}
          inputValue={
            inputValue ??
            (value ? dayjs(value, timeFormat).format(timeFormat) : '')
          }
          disabled={false}
          onChange={(event: ReactEvent) =>
            handleTimeInput(
              (event.target as HTMLInputElement)?.value || '',
              onChange,
            )
          }
          onSearch={handleSearch}
          onKeyDown={(event, infoObject) =>
            handleKeyDown(event, onChange, infoObject)
          }
          onFocus={handleFocus}
          onBlur={(event) => handleBlur(event, onChange)}
          value={value}
          errorText={error?.message}
          label={intl.formatMessage({
            id: labelKey || 'drawer.form.duration.label',
          })}
          width={width}
          renderItem={(dropdownItem, index) => (
            <MenuItem key={`${index}`} value={dropdownItem.value}>
              {dropdownItem.label}
            </MenuItem>
          )}
        />
      )}
    />
  );
};
