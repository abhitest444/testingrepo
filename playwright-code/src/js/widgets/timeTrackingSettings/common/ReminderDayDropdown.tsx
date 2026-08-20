import React, { useMemo, useCallback } from 'react';
import { useIntl } from '@payroll/quicksand';
import { ReactEvent } from '@ids-ts/dropdown-typeahead/dist/types';
import { Control, Controller, Path } from 'react-hook-form';
import { Dropdown, MenuItem } from '@ids-ts/dropdown';
import {
  NOTIFICATION_DAYS_OF_WEEK,
  ApprovalRemindersbasedOn,
  APPROVAL_PAY_PERIOD_OPTIONS,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';
import { TrackingPoint } from 'src/js/common/useClickTracking';

export type ReminderDayMode =
  (typeof ApprovalRemindersbasedOn)[keyof typeof ApprovalRemindersbasedOn];

export interface ReminderDayDropdownProps {
  name: Path<ITimeEntrySettingsFormState>;
  control: Control<ITimeEntrySettingsFormState>;
  mode: ReminderDayMode;
  labelKey?: string;
  defaultValue?: string | string[];
  multiselect?: boolean;
  width?: string;
  trackingPoint?: TrackingPoint;
  onTrack?: (trackingData: TrackingPoint) => void;
}

export const ReminderDayDropdown: React.FC<ReminderDayDropdownProps> = ({
  name,
  control,
  mode,
  labelKey,
  defaultValue = '1',
  multiselect = false,
  width = '100%',
  trackingPoint,
  onTrack,
}) => {
  const intl = useIntl();

  // Memoize days of week entries
  const daysOfWeekEntries = useMemo(
    () => Object.entries(NOTIFICATION_DAYS_OF_WEEK),
    [],
  );

  // Memoized handler for multi-select
  const handleMultiSelectChange = useCallback(
    (
      currentValue: string[] | string | number | undefined,
      selectedValue: string,
    ): string[] => {
      const valueArray = Array.isArray(currentValue) ? currentValue : [];
      if (valueArray.includes(selectedValue)) {
        return valueArray.filter((v) => v !== selectedValue);
      }
      return [...valueArray, selectedValue];
    },
    [],
  );

  return (
    <Controller
      name={name as Path<ITimeEntrySettingsFormState>}
      control={control}
      render={({ field: { onChange, value: rawValue } }) => {
        // ReminderDayDropdown only binds to string/number day fields; cast away
        // unrelated form paths (e.g. customDimensions) from the Path union.
        const value = rawValue as string | number | string[] | undefined;

        const handleChange = (e: ReactEvent) => {
          const selectedValue = (e.target as HTMLSelectElement).value;

          if (multiselect) {
            const newValue = handleMultiSelectChange(
              value as string[] | string,
              selectedValue,
            );
            onChange(newValue);
          } else if (mode === ApprovalRemindersbasedOn.DAY_OF_WEEK) {
            // For single-select day of week mode, store as array to match API format
            onChange([selectedValue]);
          } else if (mode === ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE) {
            // For pay period mode, convert string to number for offsetDays field
            onChange(Number(selectedValue));
          } else {
            onChange(selectedValue);
          }

          // Track the change if tracking is provided
          if (trackingPoint && onTrack) {
            onTrack(trackingPoint);
          }
        };

        // Extract display value: for arrays in single-select, use first element
        let displayValue;
        if (Array.isArray(value) && !multiselect) {
          [displayValue] = value;
        } else if (Array.isArray(value) && multiselect) {
          displayValue = value;
        } else if (value !== undefined && value !== null) {
          displayValue = String(value);
        } else {
          displayValue = defaultValue;
        }

        return (
          <Dropdown
            theme="quickbooks"
            multiselect={multiselect}
            colorScheme="light"
            label={labelKey ? intl.formatMessage({ id: labelKey }) : undefined}
            onChange={handleChange}
            value={displayValue}
            width={width}
            placeholder={intl.formatMessage({
              id: 'location-settings.fields.select-days',
            })}
          >
            {mode === ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE
              ? APPROVAL_PAY_PERIOD_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {intl.formatMessage({ id: option.labelKey })}
                  </MenuItem>
                ))
              : daysOfWeekEntries.map(([day, dayValue]) => (
                  <MenuItem key={dayValue} value={dayValue}>
                    {intl.formatMessage({ id: day })}
                  </MenuItem>
                ))}
          </Dropdown>
        );
      }}
    />
  );
};

// Export pre-configured versions for common use cases
export const ApprovalPayPeriodDropdown: React.FC<
  Omit<ReminderDayDropdownProps, 'mode' | 'payPeriodOptions'>
> = (props) => (
  <ReminderDayDropdown
    {...props}
    mode={ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE}
  />
);
