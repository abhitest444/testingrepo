import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import {
  OnKeyDownInfoType,
  ReactEvent,
} from '@ids-ts/dropdown-typeahead/dist/types';
import dayjs, { Dayjs } from 'dayjs';
import React, {
  ChangeEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';
import {
  createDateTimeFromParts,
  formatTime,
  isValidTime,
  timeStringToDayjs,
  findNearestTimeOptionIndex,
} from 'src/js/common/DateAndTimeUtils';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import { LOCALS } from '../../../common/constants';

export interface TimeDropdownProps {
  name: string;
  width?: number;
  disabled?: boolean;
  labelKey?: string;
  trackingPoint: TrackingPoint;
  billableStatus?: TimeTracking_BillableStatus;
}

interface TimeFormValues {
  [key: string]: Dayjs;
}
interface DropdownTypeaheadOption {
  value: string;
  label: string;
}

export const generateTimeOptions = (
  timeFormat: string,
): DropdownTypeaheadOption[] => {
  const startOfDay = dayjs().startOf('day');
  return Array.from({ length: 24 * 4 }, (_, i) => {
    const time = startOfDay.add(i * 15, 'minute').format(timeFormat);
    return { value: time, label: time };
  });
};

export const TimeDropdown = ({
  name,
  disabled: disabledProp,
  labelKey,
  trackingPoint,
  billableStatus,
}: TimeDropdownProps) => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const track = useTracking();
  const { setError, setValue, getValues, clearErrors } =
    useFormContext<TimeFormValues>();
  const dropdownRef = useRef<any>(null);
  const prevValue = useRef<string>('');

  // Watch isLocked from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  // Get locale and set time format
  const { locale = '' } = sandbox.appContext.getLocalizationInfo();
  const isUKLocale = locale.toLowerCase() === LOCALS.UK;
  const timeFormat = isUKLocale ? 'HH:mm' : 'h:mm A';

  // Generate time options and set up state
  const timeOptions = useMemo(
    () => generateTimeOptions(timeFormat),
    [timeFormat],
  );
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [filteredOptions, setFilteredOptions] = useState(timeOptions);
  const [timeAlreadyBilledModalOpen, setTimeAlreadyBilledModalOpen] =
    useState(false);

  // Helper function to convert string to Dayjs
  const convertStrToDayjs = (value: string) =>
    timeStringToDayjs(formatTime(value));

  // Helper functions for accessing the input element
  const getInputElement = useCallback(() => dropdownRef.current?.inputRef, []);

  // Get current input value from ref
  const getCurrentInputValue = useCallback(
    (): string => getInputElement()?.value || '',
    [getInputElement],
  );

  // Focus the input field
  const focusInput = useCallback((): void => {
    getInputElement()?.focus();
  }, [getInputElement]);

  // Validate time order
  const validateTimeOrder = (time: Dayjs) => {
    const startTime =
      name === 'startTime' && time ? time : getValues('startTime');
    const endTime = name === 'endTime' && time ? time : getValues('endTime');
    const startDate = getValues('startDate');
    const endDate = getValues('endDate');
    const isExported = getValues('isExported');

    if (!startTime || !endTime || !startDate) {
      return undefined;
    }

    // Create combined datetimes for validation using the utility function
    // This ensures all comparisons happen in consistent local timezone
    const finalStartTime = createDateTimeFromParts(startDate, startTime);
    const finalEndTime = createDateTimeFromParts(endDate || startDate, endTime);

    const isEndTimeSameOrBeforeStartTime =
      finalEndTime.isSame(finalStartTime) ||
      finalEndTime.isBefore(finalStartTime);

    const errorMessage = intl.formatMessage({
      id: 'time.tracking.validation.end.before.start',
    });

    // If end time <= start time and endDate is absent, it is to be considered as an overnight entry
    if (isEndTimeSameOrBeforeStartTime && endDate) {
      // Skip validation for time activities as time activities (isExported = true) don't have endDate and support overlapping midnight entries
      if (isExported) {
        return undefined;
      }
      if (name === 'endTime') {
        return errorMessage;
      }
      setError('endTime', { type: 'custom', message: errorMessage });
    } else {
      clearErrors('endTime');
    }

    return undefined;
  };

  // Modal handlers
  const handleTimeAlreadyBilledConfirm = () => {
    setTimeAlreadyBilledModalOpen(false);
    prevValue.current = getCurrentInputValue();
    focusInput();
  };

  const handleTimeAlreadyBilledNo = () => {
    setTimeAlreadyBilledModalOpen(false);
    setValue(name, convertStrToDayjs(prevValue.current));
    setInputValue(undefined);
    focusInput();
  };

  // Input handlers
  const handleTimeInput = (value: string, onChange: Function) => {
    track(trackingPoint);
    const newTime = convertStrToDayjs(value);
    const validationError = validateTimeOrder(newTime);

    if (validationError) {
      setError(name, { type: 'custom', message: validationError });
    }

    onChange(newTime);
    setInputValue(undefined);
    setFilteredOptions(timeOptions);
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
      const timeOption = filteredOptions[info.highlightedIndex ?? -1];
      if (timeOption) {
        handleTimeInput(timeOption.value, onChange);
      }
    }
  };

  const handleFocus = () => {
    if (!prevValue.current) {
      prevValue.current = getCurrentInputValue();
    }
    // Auto-scroll to nearest option when dropdown opens
    scrollToNearestOption();
  };

  // Auto-scroll to nearest option when dropdown opens
  const scrollToNearestOption = () => {
    const currentValue = getValues(name);
    const nearestIndex = findNearestTimeOptionIndex(currentValue, 15);

    // Use setTimeout to ensure the dropdown menu is rendered and scroll behavior is smooth
    setTimeout(() => {
      const menuElement = document.querySelector('[role="listbox"]');
      if (menuElement) {
        const menuItems = menuElement.querySelectorAll('[role="option"]');
        if (menuItems[nearestIndex]) {
          menuItems[nearestIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      }
    }, 100);
  };

  const handleBlur = (e: ReactEvent, onChange: Function) => {
    const currentValue = getCurrentInputValue();

    // Check if time has been billed
    if (
      billableStatus === TimeTracking_BillableStatus.HasBeenBilled &&
      prevValue.current !== currentValue
    ) {
      setTimeAlreadyBilledModalOpen(true);
      return;
    }

    // Process time input
    const value = (e.target as HTMLInputElement)?.value || '';
    const formattedValue = formatTime(value);

    if (isValidTime(formattedValue)) {
      const newTime = timeStringToDayjs(formattedValue);
      const validationError = validateTimeOrder(newTime);

      if (validationError) {
        setError(name, { type: 'custom', message: validationError });
        onChange(newTime);
        setInputValue(undefined);
        return;
      }

      clearErrors(name);
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
    <>
      <Controller
        name={name}
        rules={{
          validate: (value: Dayjs) => {
            if (!value || !value.isValid()) {
              return intl.formatMessage({ id: 'drawer.field.required' });
            }
            return validateTimeOrder(value);
          },
        }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <DropdownTypeahead
            ref={dropdownRef}
            addNew={false}
            dataSource={filteredOptions}
            inputValue={inputValue ?? value?.format(timeFormat)}
            readOnly={disabledProp || isLocked}
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
            value={value?.format(timeFormat) || ''}
            errorText={error?.message}
            label={intl.formatMessage({
              id: labelKey || 'drawer.form.duration.label',
            })}
            renderItem={(dropdownItem, index) => (
              <MenuItem key={`${index}`} value={dropdownItem.value}>
                {dropdownItem.label}
              </MenuItem>
            )}
            style={{
              minWidth: 'unset',
            }}
          />
        )}
      />
      <ConfirmationModal
        title={intl.formatMessage({
          id: 'closed.books.time.already.billed.title',
        })}
        open={timeAlreadyBilledModalOpen}
        setOpen={setTimeAlreadyBilledModalOpen}
        onYesClick={handleTimeAlreadyBilledConfirm}
        onNoClick={handleTimeAlreadyBilledNo}
      >
        <>
          {intl.formatMessage({
            id: 'closed.books.time.already.billed.content',
          })}
        </>
      </ConfirmationModal>
    </>
  );
};
