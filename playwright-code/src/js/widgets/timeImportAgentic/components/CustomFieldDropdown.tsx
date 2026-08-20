import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl } from '@payroll/quicksand';
import DropdownTypeahead from '@ids-ts/dropdown-typeahead';
import { ReactEvent } from '@ids-ts/dropdown-typeahead/dist/types';
import styled from 'styled-components';
import { FullWidthMenuItem } from 'src/js/widgets/quickFind/styles';

const MenuItemContent = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
`;

const MainLabel = styled.span<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  font-weight: ${({ selected }) => (selected ? 'bold' : 'normal')};
`;

const RowTextLabel = styled.span`
  display: flex;
  align-items: center;
`;

export interface CustomFieldDropdownProps {
  value?: string;
  fieldValue?: string;
  onChange?: (value: string, item?: any) => void;
  onReady?: (data?: any) => void;
  onError?: (error: Error | string) => void;
  label?: string;
  placeholder?: string;
  errorText?: string;
  onLoad?: (data?: any) => void;
  disabled?: boolean;
  addNew?: boolean;
  addNewItemProps?: {
    onClick: () => void;
  };
  width?: string;
  options: Array<{
    id: string;
    name: string;
  }>;
}

const CustomFieldDropdown: React.FC<CustomFieldDropdownProps> = ({
  value,
  fieldValue,
  onChange,
  onReady,
  onError,
  label,
  placeholder,
  errorText,
  onLoad,
  disabled = false,
  addNew = false,
  addNewItemProps,
  width,
  options = [],
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  const [inputValue, setInputValue] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [isUserCleared, setIsUserCleared] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const intl = useIntl();

  // Debounced search function
  const debouncedSearch = useCallback((searchValue: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setSearchText(searchValue);
    }, 300); // 300ms debounce delay
  }, []);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    },
    [],
  );

  // Filter options based on search text
  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) {
      return options;
    }

    const searchLower = searchText.toLowerCase();
    return options.filter((option) => {
      const name = option.name || '';
      return name.toLowerCase().includes(searchLower);
    });
  }, [options, searchText]);

  // Call onLoad and onReady when options are loaded
  useEffect(() => {
    if (!isLoaded && options.length > 0) {
      setIsLoaded(true);
      onLoad?.(options);
      onReady?.(options);
    }
  }, [isLoaded, options, onLoad, onReady]);

  // Reset user cleared state and update selectedValue when value prop changes from outside
  useEffect(() => {
    setIsUserCleared(false);
    setSelectedValue(value || '');
  }, [value, fieldValue]);

  // Generate data source for DropdownTypeahead
  const dataSource = useMemo(() => {
    // Don't show dropdown until data is ready
    if (filteredOptions.length === 0) {
      return [];
    }

    return filteredOptions.map((option) => ({
      value: option.id,
      label: option.name || '',
    }));
  }, [filteredOptions]);

  // Handle dropdown change
  const handleChange = useCallback(
    (event: ReactEvent) => {
      const selectedId = (event.target as HTMLInputElement).value;

      // Handle dropdown selection change
      if (onChange && selectedId) {
        const selectedOption = filteredOptions.find(
          (option) => option.id === selectedId,
        );

        // Set input value to the selected option's name to prevent text clearing
        if (selectedOption) {
          setInputValue(selectedOption.name || '');

          // Clear search text when selection is made (only if it has a value)
          if (searchText) {
            setSearchText('');
          }

          // Reset user cleared state when a new selection is made
          setIsUserCleared(false);

          // Call onChange with full option details
          onChange(selectedId, {
            id: selectedId,
            name: selectedOption.name || '',
          });
        }
      }
    },
    [onChange, filteredOptions, searchText],
  );

  // Handle search with debouncing
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = event.target.value;
      setInputValue(searchValue);
      debouncedSearch(searchValue);
      setSelectedValue('');
      // If user clears all text, clear the selection and mark as user cleared
      if (searchValue.trim() === '') {
        setIsUserCleared(true);
        if (value && onChange) {
          onChange('', undefined);
        }
      } else {
        // Reset user cleared state when user starts typing
        setIsUserCleared(false);
      }
    },
    [debouncedSearch, value, onChange],
  );

  // Handle blur - clear search and validate input
  const handleBlur = useCallback(() => {
    // If user was typing but didn't select anything, clear the selection
    if (inputValue && onChange) {
      const selectedOption = filteredOptions.find(
        (option) =>
          (option.name || '').toLowerCase() === inputValue.toLowerCase(),
      );

      // If the typed text doesn't match any option exactly, clear the selection
      if (!selectedOption) {
        onChange('', undefined);
        setIsUserCleared(true);
      }
    }

    setSearchText('');
    setInputValue('');
  }, [inputValue, onChange, filteredOptions]);

  const defaultLabel = label || '';
  const defaultPlaceholder = placeholder || '';

  // Get display value for selected option
  const displayValue = useMemo(() => {
    // If user is typing, show what they're typing
    if (inputValue) {
      return inputValue;
    }

    // If user has explicitly cleared the input, show empty string
    if (isUserCleared) {
      return '';
    }

    // If fieldValue is provided (option name without ID), prioritize it
    if (fieldValue) {
      return fieldValue;
    }

    if (options.length === 0) {
      return '';
    }

    // If there's a selected value and user is not typing, show the selected option's name
    if (value && options.length > 0) {
      const selectedOption = options.find((option) => option.id === value);
      if (selectedOption) {
        return selectedOption.name || '';
      }
    }

    return '';
  }, [value, fieldValue, options, inputValue, isUserCleared]);

  return (
    <div>
      <DropdownTypeahead
        value={selectedValue}
        inputValue={displayValue}
        onChange={handleChange}
        onSearch={handleSearch}
        onBlur={handleBlur}
        dataSource={dataSource}
        label={defaultLabel}
        placeholder={defaultPlaceholder}
        errorText={errorText}
        disabled={disabled}
        aria-label={defaultLabel}
        width={(width as string) ?? 'auto'}
        addNew={addNew}
        addNewIndex={0}
        addNewItemProps={addNewItemProps}
        addNewText={intl.formatMessage({
          id: 'quickfill.dropdown.customfield.add.new',
          defaultMessage: 'Add new option',
        })}
        renderItem={(item, index) => {
          const highlightText = (
            text: string | undefined,
            searchValue: string,
          ) => {
            if (!searchValue.trim() || !text) return text || '';

            // Use the same approach as quickfill: split with capture groups
            const regex = new RegExp(
              `(${searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
              'gi',
            );
            const parts = text.split(regex);

            return parts
              .filter((part) => part) // Filter out empty parts
              .map((part, i) =>
                regex.test(part) ? (
                  // eslint-disable-next-line react/no-array-index-key
                  <b key={`bold-${part}-${i}`} style={{ whiteSpace: 'pre' }}>
                    {part}
                  </b>
                ) : (
                  // eslint-disable-next-line react/no-array-index-key
                  <span key={`span-${part}-${i}`} style={{ whiteSpace: 'pre' }}>
                    {part}
                  </span>
                ),
              );
          };

          const isSelected = item.value === value;

          return (
            <FullWidthMenuItem
              key={`${index}`}
              value={item.value}
              className="quickfind-menu-item"
            >
              <MenuItemContent>
                <MainLabel selected={isSelected}>
                  <RowTextLabel title={item.label}>
                    {highlightText(item.label, inputValue || '')}
                  </RowTextLabel>
                </MainLabel>
              </MenuItemContent>
            </FullWidthMenuItem>
          );
        }}
      />
    </div>
  );
};

export default CustomFieldDropdown;
