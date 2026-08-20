import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  FocusEvent,
} from 'react';
import TextField from '@ids-ts/text-field';
import { IconControl } from '@ids-ts/icon-control';
import { Search, Close } from '@design-systems/icons';
import { debounce } from 'src/js/service/utils/debounce';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  alwaysExpanded?: boolean;
  debounceMs?: number;
}

/**
 * Collapsible search field component
 * Based on QBDS data grid search pattern
 * Starts as an icon button and expands to a text field on click
 * Debounces onChange callback to parent for better performance
 */
export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  label = 'Search',
  placeholder,
  defaultValue = '',
  alwaysExpanded = false,
  debounceMs = 300,
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [showTextField, setShowTextField] = useState(
    alwaysExpanded || value.length > 0,
  );
  const textFieldRef = useRef<HTMLInputElement>(null);

  // Keep a stable ref to the latest onChange so the debounced function
  // always calls the current callback (avoids stale filter closures).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const debouncedOnChange = useRef(
    debounce((newValue: string) => {
      onChangeRef.current(newValue);
    }, debounceMs),
  ).current;

  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(value);
    // Collapse to icon when value is cleared externally (unless alwaysExpanded)
    if (!value && !alwaysExpanded) {
      setShowTextField(false);
    }
  }, [value, alwaysExpanded]);

  // Auto-focus when expanded
  useEffect(() => {
    if (showTextField && !alwaysExpanded) {
      textFieldRef.current?.focus();
    }
  }, [showTextField, alwaysExpanded]);

  const handleClear = useCallback(() => {
    setInternalValue(defaultValue);
    onChange(defaultValue); // Clear immediately, no debounce
    textFieldRef.current?.focus();
  }, [defaultValue, onChange]);

  const handleTextFieldBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      // Collapse to icon if empty and not always expanded
      if (!internalValue && !alwaysExpanded) {
        setShowTextField(false);
      }
    },
    [internalValue, alwaysExpanded],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange],
  );

  if (!showTextField) {
    return (
      <IconControl
        label={label}
        aria-label={label}
        size="medium"
        onClick={() => setShowTextField(true)}
      >
        <Search />
      </IconControl>
    );
  }

  return (
    <TextField
      ref={textFieldRef}
      addonBefore={<Search />}
      label={label}
      placeholder={placeholder}
      aria-label={label}
      value={internalValue}
      autoComplete="off"
      addonAfter={
        internalValue ? (
          <IconControl
            aria-label="Clear search"
            size="small"
            onClick={handleClear}
          >
            <Close />
          </IconControl>
        ) : undefined
      }
      onBlur={handleTextFieldBlur}
      onChange={handleInputChange}
    />
  );
};
