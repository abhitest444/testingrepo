import React, { KeyboardEvent, MouseEvent, useMemo } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import {
  DAY_OF_WEEK_OPTIONS,
  dayOfWeekToBinary,
  binaryToDayOfWeek,
} from './constants/overtimeRulesConstants';
import { OvertimeTrackingPoint } from '../../constants/overtimeTrackingPoints';

type DaysOfWeekDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  preventDeselection?: boolean;
  trackingPoint?: OvertimeTrackingPoint;
};

const DaysOfWeekDropdown: React.FC<DaysOfWeekDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  preventDeselection = false,
  trackingPoint,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const selectedDays = useMemo(() => binaryToDayOfWeek(value), [value]);
  const handleOpen = trackingPoint ? () => track(trackingPoint) : undefined;

  const handleChange = (event: KeyboardEvent | MouseEvent) => {
    const selectedValue = (event.target as HTMLSelectElement).value as string;

    // Prevent deselection if flag is set and user is trying to uncheck a day
    if (preventDeselection) {
      return;
    }

    const next = selectedDays.includes(selectedValue)
      ? selectedDays.filter((day) => day !== selectedValue)
      : [...selectedDays, selectedValue];
    onChange(dayOfWeekToBinary(next));
  };

  return (
    <Dropdown
      onOpen={handleOpen}
      multiselect
      value={selectedDays}
      onChange={handleChange}
      disabled={disabled}
      width="100%"
      label={intl.formatMessage({
        id: 'overtime.wizard.rules.days_of_week.label',
        defaultMessage: 'Days of the week',
      })}
      placeholder={intl.formatMessage({
        id: 'overtime.wizard.rules.days_of_week.placeholder',
        defaultMessage: 'Select days of the week',
      })}
      data-testid="overtime-rule-day-of-week-dropdown"
    >
      {DAY_OF_WEEK_OPTIONS.map((day) => (
        <MenuItem
          key={day.value}
          value={day.value}
          disabled={preventDeselection}
        >
          {intl.formatMessage({
            id: day.labelId,
            defaultMessage: day.defaultMessage,
          })}
        </MenuItem>
      ))}
    </Dropdown>
  );
};

export default DaysOfWeekDropdown;
