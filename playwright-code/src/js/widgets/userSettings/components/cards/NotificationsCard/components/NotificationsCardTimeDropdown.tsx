import React, { useMemo, useState, ChangeEvent, useRef } from 'react';
import { useIntl } from '@payroll/quicksand';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import { ReactEvent } from '@ids-ts/dropdown-typeahead/dist/types';
import { formatTime, isValidTime } from 'src/js/common/DateAndTimeUtils';
import { generateTimeOptions } from '../utils/NotificationsCard.utils';

interface NotificationsCardTimeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
  width?: string;
}

export const NotificationsCardTimeDropdown: React.FC<
  NotificationsCardTimeDropdownProps
> = ({ value, onChange, disabled = false, label, width = '320px' }) => {
  const intl = useIntl();

  // Generate time options in 12-hour format (h:mm A)
  const timeOptions = useMemo(() => generateTimeOptions('h:mm A'), []);

  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [filteredOptions, setFilteredOptions] = useState(timeOptions);
  const [error, setError] = useState<string | undefined>(undefined);
  const prevValue = useRef<string>('');

  const handleChange = (event: ReactEvent) => {
    const selectedValue = (event.target as HTMLInputElement)?.value || '';

    // Clear error when selecting from dropdown
    setError(undefined);

    // Check if the selected value is valid
    const formattedValue = formatTime(selectedValue);
    if (isValidTime(formattedValue)) {
      onChange(formattedValue);
    } else {
      onChange(selectedValue);
    }

    setInputValue(undefined);
    setFilteredOptions(timeOptions);
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value || '';
    setInputValue(searchValue);

    // Clear error while typing
    if (error) {
      setError(undefined);
    }

    setFilteredOptions(
      timeOptions.filter((option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()),
      ),
    );
  };

  const handleFocus = (e: ReactEvent) => {
    // Store the previous value when focusing
    const currentValue = (e.target as HTMLInputElement)?.value || '';
    prevValue.current = currentValue;
  };

  const handleBlur = (e: ReactEvent) => {
    const inputElement = e.target as HTMLInputElement;
    const userInput = inputElement?.value || '';

    // If the input is empty or unchanged, reset to previous value
    if (!userInput || userInput === prevValue.current) {
      setInputValue(undefined);
      setFilteredOptions(timeOptions);
      setError(undefined);
      return;
    }

    // Format the time input (handles partial inputs like "2:20" -> "2:20 AM")
    const formattedValue = formatTime(userInput);

    // Validate the formatted time
    if (isValidTime(formattedValue)) {
      // Valid time - update the value and clear any errors
      setError(undefined);
      onChange(formattedValue);
      prevValue.current = formattedValue;
      setInputValue(undefined);
    } else {
      // Invalid time - show error and revert to previous value
      setError(intl.formatMessage({ id: 'notifications.time.invalid.format' }));
      setInputValue('');

      // Optionally revert to previous valid value
      // onChange(prevValue.current || value);
    }

    setFilteredOptions(timeOptions);
  };

  return (
    <DropdownTypeahead
      addNew={false}
      dataSource={filteredOptions}
      inputValue={inputValue ?? value}
      disabled={disabled}
      onChange={handleChange}
      onSearch={handleSearch}
      onFocus={handleFocus}
      onBlur={handleBlur}
      value={value}
      label={label}
      width={width}
      errorText={error}
      renderItem={(dropdownItem, index) => (
        <MenuItem key={`${index}`} value={dropdownItem.value}>
          {dropdownItem.label}
        </MenuItem>
      )}
    />
  );
};
