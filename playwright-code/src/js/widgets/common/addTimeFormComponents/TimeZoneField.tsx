import React, { useState, useMemo, useEffect } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { useWatch } from 'react-hook-form';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import { mapQBTimezoneToDayjsTimezone } from 'src/js/common/DateAndTimeUtils';
import { TrackingPoint } from '../../../common/useClickTracking';

// Extend the Intl type to include supportedValuesOf
declare global {
  interface Intl {
    supportedValuesOf?(key: string): string[];
  }
}

export const timezoneConversions = [
  { name: 'America/Los_Angeles', longFormName: 'Pacific Time (US & Canada)' },
  { name: 'America/Denver', longFormName: 'Mountain Time (US & Canada)' },
  { name: 'America/Phoenix', longFormName: 'Arizona' },
  { name: 'America/Chicago', longFormName: 'Central Time (US & Canada)' },
  { name: 'America/New_York', longFormName: 'Eastern Time (US & Canada)' },
];

// Fallback for Intl.supportedValuesOf
const getSupportedTimeZones = (): string[] => {
  if (typeof (Intl as any).supportedValuesOf === 'function') {
    return (Intl as any).supportedValuesOf('timeZone') as string[];
  }
  // Provide a empty fallback list of time zones if supportedValuesOf is unavailable
  return [];
};

function convertTimezoneToLongName(timezone: string): string {
  // First check if it's a QB timezone format
  // TODO:- to be removed once timeZone settings is brought to QL
  if (timezone.startsWith('(UTC')) {
    const mappedTimezone = mapQBTimezoneToDayjsTimezone(timezone);
    const conversion = timezoneConversions.find(
      (item) => item.name === mappedTimezone,
    );
    return conversion ? conversion.longFormName : mappedTimezone;
  }

  // Then check regular timezone conversions
  const conversion = timezoneConversions.find(
    (item) => item.name === timezone || timezone.includes(item.longFormName),
  );
  return conversion ? conversion.longFormName : timezone;
}

function convertTimezoneLongNameToShortName(timezone: string): string {
  // First check if it's a QB timezone format
  // TODO:- to be removed once timeZone settings is brought to QL
  if (timezone.startsWith('(UTC')) {
    return mapQBTimezoneToDayjsTimezone(timezone);
  }

  // Then check regular timezone conversions
  const conversion = timezoneConversions.find(
    (item) => item.longFormName === timezone,
  );
  return conversion ? conversion.name : timezone;
}

type TimeZoneFieldProps = {
  readOnly?: boolean;
  disabled?: boolean;
  errorText?: string;
  value: string;
  name: string;
  width?: string;
  placeholderText?: string;
  onChange?: (event: any) => void;
  trackingPoint?: TrackingPoint;
};

export const TimeZoneField: React.FC<TimeZoneFieldProps> = ({
  name,
  readOnly = false,
  disabled: disabledProp,
  value,
  width,
  placeholderText,
  onChange,
  trackingPoint,
}: TimeZoneFieldProps) => {
  const intl = useIntl();
  const track = useTracking();
  // label of selected item
  const [timeZoneSearchTerm, setTimeZoneSearchTerm] = useState(() =>
    convertTimezoneToLongName(value),
  );
  // value of selected item
  const [selectedValue, setSelectedValue] = useState(value);

  // Keep internal state in sync when the parent supplies a new value after
  // mount (e.g. async-loaded settings.timezone, or a form setValue). Only
  // re-sync when the incoming value differs from what is selected, so a user's
  // in-progress selection (already reflected in selectedValue) is not clobbered.
  useEffect(() => {
    if (value !== selectedValue) {
      setSelectedValue(value);
      setTimeZoneSearchTerm(convertTimezoneToLongName(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Watch isApproved from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  const timeZoneValues = useMemo(() => {
    const values = [
      ...timezoneConversions.map((item) => item.longFormName),
      ...getSupportedTimeZones(),
    ];

    const filteredValues =
      !timeZoneSearchTerm ||
      timeZoneSearchTerm === convertTimezoneToLongName(selectedValue)
        ? values
        : values.filter((timeZoneName) =>
            timeZoneName
              .toLowerCase()
              .includes(timeZoneSearchTerm.toLowerCase()),
          );

    return filteredValues.map((timeZoneName) => ({
      label: timeZoneName,
      value: convertTimezoneLongNameToShortName(timeZoneName),
    }));
  }, [timeZoneSearchTerm, selectedValue]);

  // handles change when user types in the box
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTimeZoneSearchTerm(event.target.value);
  };

  // handles change when user selects from dropdown
  const handleChange = (
    e: React.SyntheticEvent,
    info?: { selectedItem?: { value?: string; label?: string } },
  ) => {
    const { selectedItem } = info || {};
    if (!selectedItem || !selectedItem.value || !selectedItem.label) {
      return;
    }

    // Track the timezone selection
    if (trackingPoint) {
      track(trackingPoint);
    }

    setTimeZoneSearchTerm(selectedItem.label);
    setSelectedValue(selectedItem.value);
    if (onChange) {
      onChange(selectedItem.value);
    }
  };

  const renderMenuItem = (data: any & Record<string, any>) => (
    <MenuItem value={data.value}>{data.label}</MenuItem>
  );

  const handleBlur = () => {
    // ensures that the displayed value in the input field resets to the last selected value, when the input field loses focus
    if (timeZoneSearchTerm !== convertTimezoneToLongName(selectedValue)) {
      setTimeZoneSearchTerm(convertTimezoneToLongName(selectedValue));
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.currentTarget === e.target) {
      e.target?.select?.();
    }
  };

  return (
    <DropdownTypeahead
      label={intl.formatMessage({ id: 'time_zone_field_label' })}
      value={selectedValue} // Real Value
      inputValue={timeZoneSearchTerm} // Display value
      dataSource={timeZoneValues}
      onSearch={handleInputChange}
      renderItem={renderMenuItem}
      onChange={handleChange}
      onFocus={handleInputFocus}
      onBlur={handleBlur}
      errorText=""
      readOnly={disabledProp || readOnly || isLocked}
      selectTextOnFocus
      width={width}
      placeholder={placeholderText}
    />
  );
};

export default TimeZoneField;
