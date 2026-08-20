import TextField from '@ids-ts/text-field';
import { useIntl } from '@payroll/quicksand';
import React, { useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';
import {
  exceedsMaxDuration,
  formatDuration,
  hourMinStringToSecondsNumber,
  isValidDurationFormat,
  secondsToDurationTimestamp,
} from 'src/js/common/DateAndTimeUtils';
import {
  AllowedEventKey,
  KeyboardNavigationContext,
} from 'src/js/common/useKeyboardNavigation';

const StyledTextField = styled(TextField)<{
  width?: string;
  textAlign?: string;
}>`
  input {
    text-align: ${(props) => props.textAlign || 'right'};
    ${(props) =>
      props.width === '60px' ? '&::placeholder { font-size: 13px; }' : ''}
  }
  & {
    & {
      width: ${(props) => props.width || 'auto !important'};
    }
  }
`;

// Filter out textAlign from props passed to TextField
const FilteredTextField = React.forwardRef<HTMLInputElement, any>(
  ({ textAlign, ...props }, ref) => (
    <StyledTextField {...props} ref={ref} textAlign={textAlign} />
  ),
);

export interface DurationFieldStandaloneProps {
  name?: string;
  value: number | null; // duration in seconds
  onChange: (value: number | null) => void; // duration in seconds
  label?: string;
  errorText?: string;
  setError: (error?: string) => void;
  billableStatus?: TimeTracking_BillableStatus;
  isBreakField?: boolean;
  width?: string;
  textAlign?: string; // Text alignment for the input field
  isLocked?: boolean; // New prop to replace useWatch
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void; // Optional custom key handler
  'data-testid'?: string; // Test ID for testing
}

/**
 * A self-contained text field with functionality to enter hour & minute data
 * Takes in value as number in seconds, outputs value as number in seconds
 * Internally to this component, the seconds are converted to 0:00 format text and back
 * This component is independent of React Hook Form
 *
 * @param value - duration in seconds
 * @param onChange - callback when value changes (receives seconds)
 * @param label - field label
 * @param errorText - error text to display
 * @param setError - callback to set error state
 * @param isLocked - whether the field is read-only
 * @param isBreakField - whether this is a break field (auto-focus)
 * @param width - field width
 * @param onKeyDown - optional custom key handler
 */
export const DurationFieldStandalone = ({
  name = '',
  value,
  onChange,
  label,
  errorText,
  setError,
  billableStatus,
  isBreakField = false,
  width,
  textAlign,
  isLocked = false,
  onKeyDown,
  'data-testid': dataTestId,
}: DurationFieldStandaloneProps) => {
  const intl = useIntl();
  const formattedValue =
    value !== null ? secondsToDurationTimestamp(value) : '';

  const [internalValue, setInternalValue] = useState(formattedValue);
  const prevValue = useRef('');
  const durationRef = useRef<HTMLInputElement | null>(null);
  const { addRefToKeyboardNavigationMap, onArrowKeyDown } = useContext(
    KeyboardNavigationContext,
  );

  // Update internal value when external value changes
  useEffect(() => {
    setInternalValue(formattedValue);
  }, [formattedValue]);

  // Auto-focus for break fields
  useEffect(() => {
    if (isBreakField) {
      durationRef.current?.focus();
    }
  }, [isBreakField]);

  // Register with keyboard navigation if name contains row/col pattern
  useEffect(() => {
    const regex = /(\d+)\D+(\d+)/;
    const [_, rowId, colId] = regex.exec(name) || [];
    if (name && durationRef.current && rowId && colId) {
      addRefToKeyboardNavigationMap({
        rowId: Number(rowId),
        colId: Number(colId),
        ref: durationRef,
      });
    }
  }, [addRefToKeyboardNavigationMap, name]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(event.target.value);
  };

  const handleValueChange = () => {
    if (internalValue === '') {
      setError(undefined);
      prevValue.current = '';
      onChange(null);
      return;
    }

    const formattedDuration = formatDuration(internalValue);
    if (formattedDuration && isValidDurationFormat(formattedDuration)) {
      if (exceedsMaxDuration(formattedDuration)) {
        setError(
          intl.formatMessage({
            id: 'work.max.duration',
          }),
        );
      } else {
        setError(undefined);
        setInternalValue(formattedDuration);
        prevValue.current = formattedDuration;
        onChange(hourMinStringToSecondsNumber(formattedDuration));
      }
    } else {
      // Only show internal validation error if no errorText is provided
      // eslint-disable-next-line no-lonely-if
      if (!errorText) {
        setError(
          intl.formatMessage({
            id: 'duration.format.error',
          }),
        );
      }
    }
  };

  const handleFocus = () => {
    if (!prevValue.current) {
      prevValue.current = internalValue;
    }
  };

  const handleBlur = () => {
    handleValueChange();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Call custom key handler if provided
    if (onKeyDown) {
      onKeyDown(event);
    }

    // Handle arrow key navigation
    if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
      const regex = /(\d+)\D+(\d+)/;
      const [_, rowId, colId] = regex.exec(name) || [];
      if (rowId && colId) {
        onArrowKeyDown(
          event.key as AllowedEventKey,
          Number(rowId),
          Number(colId),
        );
      }
    }
  };

  return (
    <FilteredTextField
      ref={durationRef}
      label={label}
      aria-label={
        label ||
        intl.formatMessage({
          id: 'duration',
        })
      }
      readOnly={isLocked}
      value={internalValue}
      placeholder="hh:mm"
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      errorText={errorText}
      onKeyDown={handleKeyDown}
      width={width}
      textAlign={textAlign}
      data-testid={dataTestId}
    />
  );
};
