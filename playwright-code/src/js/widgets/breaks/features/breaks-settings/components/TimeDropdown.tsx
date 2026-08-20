import React, { useCallback, useMemo, useState } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import DropdownTypeahead, {
  MenuItem as DropdownMenuItem,
} from '@ids-ts/dropdown-typeahead';
import dayjs from 'dayjs';
import { LOCALS } from 'src/js/common/constants';

// Generate time options from 00:00 AM to 11:45 PM in 15-minute increments
const generateTimeOptions = (timeFormat: string) => {
  const startOfDay = dayjs().startOf('day');
  return Array.from({ length: 24 * 4 }, (_, i) => {
    const time = startOfDay.add(i * 15, 'minute').format(timeFormat);
    return { value: time, label: time };
  });
};

// Helper function to validate and format time input for display
const validateAndFormatTimeForDisplay = (input: string): string | null => {
  if (!input.trim()) return null;

  // Try to parse various time formats
  const timePatterns = [
    /^(\d{1,2}):(\d{2})\s*(am|pm)$/i, // 9:30 AM, 2:15 pm
    /^(\d{1,2}):(\d{2})$/i, // 9:30, 14:15
    /^(\d{1,2})\s*(am|pm)$/i, // 9 AM, 2 pm
    /^(\d{1,2})$/i, // 9, 14
  ];

  const matchedPattern = timePatterns.find((pattern) => {
    const match = input.trim().match(pattern);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      let period = match[3] ? match[3].toUpperCase() : '';

      // Handle 24-hour format
      if (!period && hours >= 12) {
        period = hours >= 12 ? 'PM' : 'AM';
        if (hours > 12) hours -= 12;
      } else if (!period && hours < 12) {
        period = 'AM';
      }

      // Validate hours and minutes
      if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
        return false;
      }

      return true;
    }
    return false;
  });

  if (matchedPattern) {
    const match = input.trim().match(matchedPattern);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      let period = match[3] ? match[3].toUpperCase() : '';

      // Handle 24-hour format
      if (!period && hours >= 12) {
        period = hours >= 12 ? 'PM' : 'AM';
        if (hours > 12) hours -= 12;
      } else if (!period && hours < 12) {
        period = 'AM';
      }

      // Format as 12-hour with AM/PM for display
      return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
  }

  return null;
};

// Helper function to convert display time to 24-hour format for storage
const convertTo24HourFormat = (displayTime: string): string => {
  if (!displayTime) return '';

  // If already in 24-hour format, return as is
  if (/^\d{2}:\d{2}$/.test(displayTime)) {
    return displayTime;
  }

  // Parse 12-hour format
  const match = displayTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3];

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  return displayTime; // Return as is if can't parse
};

// Helper function to convert 24-hour format to display format
const convertToDisplayFormat = (time24Hour: string): string => {
  if (!time24Hour) return '';

  // If already in display format, return as is
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(time24Hour)) {
    return time24Hour;
  }

  // Parse 24-hour format
  const match = time24Hour.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }

    return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  return time24Hour; // Return as is if can't parse
};

interface TimeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  ariaLabel: string;
}

// Custom Time Dropdown Component for Break Auto Section
export const TimeDropdown: React.FC<TimeDropdownProps> = ({
  value,
  onChange,
  label,
  ariaLabel,
}) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  // Get locale and set time format - always use 12-hour format to show AM/PM
  const { locale = '' } = sandbox.appContext.getLocalizationInfo();
  const isUKLocale = locale.toLowerCase() === LOCALS.UK;
  const timeFormat = 'h:mm A'; // Always use 12-hour format to show AM/PM

  // Generate time options
  const timeOptions = useMemo(
    () => generateTimeOptions(timeFormat),
    [timeFormat],
  );

  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [filteredOptions, setFilteredOptions] = useState(timeOptions);

  const handleTimeInput = (e: any) => {
    const newValue = (e.target as HTMLInputElement).value;

    // Allow custom time input
    if (newValue) {
      const formattedTime = validateAndFormatTimeForDisplay(newValue);
      if (formattedTime) {
        // Convert to 24-hour format for storage
        const time24Hour = convertTo24HourFormat(formattedTime);
        onChange(time24Hour); // Always pass 24-hour format to parent
      } else {
        // If not a valid time format, still allow the input but don't update the value
        setInputValue(newValue);
        return;
      }
    } else {
      onChange(''); // Pass empty string in 24-hour format
    }

    setInputValue(undefined);
    setFilteredOptions(timeOptions);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value || '';
    setInputValue(searchValue);

    // Filter options that match the search
    const filtered = timeOptions.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );

    // If user is typing a custom time, add it to the filtered options
    if (
      searchValue &&
      !timeOptions.some(
        (option) => option.value.toLowerCase() === searchValue.toLowerCase(),
      )
    ) {
      const formattedTime = validateAndFormatTimeForDisplay(searchValue);
      if (formattedTime) {
        // Add the formatted display time to the dropdown options
        filtered.unshift({ value: formattedTime, label: formattedTime });
      }
    }

    setFilteredOptions(filtered);
  };

  const handleKeyDown = (e: React.KeyboardEvent, info?: any) => {
    if (e.key === 'Enter' && info) {
      const timeOption = filteredOptions[info.highlightedIndex ?? -1];
      if (timeOption) {
        // Convert display format to 24-hour format for storage
        const time24Hour = convertTo24HourFormat(timeOption.value);
        onChange(time24Hour); // Always pass 24-hour format to parent
        setInputValue(undefined);
        setFilteredOptions(timeOptions);
      }
    }
  };

  const handleBlur = () => {
    // Try to format the current input value on blur
    if (inputValue) {
      const formattedTime = validateAndFormatTimeForDisplay(inputValue);
      if (formattedTime) {
        // Convert to 24-hour format for storage
        const time24Hour = convertTo24HourFormat(formattedTime);
        onChange(time24Hour); // Always pass 24-hour format to parent
      }
    }
    setInputValue(undefined);
    setFilteredOptions(timeOptions);
  };

  return (
    <DropdownTypeahead
      addNew
      dataSource={filteredOptions}
      inputValue={inputValue ?? convertToDisplayFormat(value)}
      onChange={handleTimeInput}
      onSearch={handleSearch}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      value={convertToDisplayFormat(value)}
      label={label}
      aria-label={ariaLabel}
      renderItem={(dropdownItem, index) => (
        <DropdownMenuItem key={`${index}`} value={dropdownItem.value}>
          {dropdownItem.label}
        </DropdownMenuItem>
      )}
      style={{
        minWidth: 'unset',
      }}
    />
  );
};

export default TimeDropdown;
