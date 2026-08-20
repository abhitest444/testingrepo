import TextField from '@ids-ts/text-field';
import { useIntl, useTracking } from '@payroll/quicksand';
import React, { useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useWatch } from 'react-hook-form';
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
import { TrackingPoint } from 'src/js/common/useClickTracking';

const StyledTextField = styled(TextField)<{ width?: string }>`
  input {
    text-align: right;
    ${(props) =>
      props.width === '60px' ? '&::placeholder { font-size: 13px; }' : ''}
  }
  & {
    & {
      width: ${(props) => props.width || 'auto !important'};
    }
  }
`;

export interface DurationFieldProps {
  name?: string;
  value: number | null; // duration in seconds
  onChange: (value: number | null) => void; // duration in seconds
  disabled?: boolean;
  label?: string;
  errorText?: string;
  setError: (error?: string) => void;
  billableStatus?: TimeTracking_BillableStatus;
  isBreakField?: boolean;
  width?: string;
  trackingPoint?: TrackingPoint;
}

/**
 * A text field with functionality to enter hour & minute data
 * Takes in value as number in seconds, outputs value as number in seconds
 * Internally to this component, the seconds are converted to 0:00 format text and back
 *
 * @param value
 * @param onChange
 * @param label
 * @param errorText
 * @param setError
 * @constructor
 */
export const DurationField = ({
  name = '',
  value,
  onChange,
  disabled: disabledProp,
  label,
  errorText,
  setError,
  billableStatus,
  isBreakField = false,
  width,
  trackingPoint,
}: DurationFieldProps) => {
  const intl = useIntl();
  const track = useTracking();
  const formattedValue =
    value !== null ? secondsToDurationTimestamp(value) : '';

  const [internalValue, setInternalValue] = useState(formattedValue);
  // Watch isApproved from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });
  const prevValue = useRef('');
  const durationRef = useRef<HTMLInputElement | null>(null);
  const { addRefToKeyboardNavigationMap, onArrowKeyDown } = useContext(
    KeyboardNavigationContext,
  );

  useEffect(() => {
    setInternalValue(formattedValue);
  }, [formattedValue]);

  useEffect(() => {
    if (isBreakField) {
      durationRef.current?.focus();
    }
  }, [isBreakField]);

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
      setError(
        intl.formatMessage({
          id: 'duration.format.error',
        }),
      );
    }
  };

  const handleFocus = () => {
    if (!prevValue.current) {
      prevValue.current = internalValue;
    }
  };

  const handleBlur = () => {
    if (trackingPoint) {
      track(trackingPoint);
    }
    handleValueChange();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
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
    <>
      <StyledTextField
        ref={durationRef}
        label={label}
        aria-label={
          label ||
          intl.formatMessage({
            id: 'duration',
          })
        }
        readOnly={disabledProp || isLocked}
        value={internalValue}
        placeholder="hh:mm"
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        errorText={errorText}
        onKeyDown={handleKeyDown}
        width={width}
      />
    </>
  );
};
