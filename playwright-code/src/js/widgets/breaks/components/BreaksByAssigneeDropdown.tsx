import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import { ReactEvent } from '@ids-ts/dropdown-typeahead/dist/types';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { BREAK_LOGGING_CONSTANTS } from 'src/js/widgets/breaks/constants';
import { useTimeClockTrackingPoints } from 'src/js/widgets/timeClock/hooks/useTimeClockTrackingPoints';
import useBreaksCrud from '../hooks/useBreaksCrud';
import useGetBreakById from '../hooks/useGetBreakById';
import { useQuickfills } from '../store/hooks';
import { BreakRule } from '../types';
import { formatBreakType } from '../utils';

export interface BreaksByAssigneeDropdownProps {
  assigneeId: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  errorText?: string;
  width?: number | string;
  disabled?: boolean;
  showActiveOnly?: boolean;
  onBreaksLoaded?: (breaks: BreakRule[]) => void;
  includeDeleted?: boolean;
}

export const BreaksByAssigneeDropdown: React.FC<
  BreaksByAssigneeDropdownProps
> = ({
  assigneeId,
  value,
  onChange,
  label,
  placeholder,
  errorText,
  width,
  disabled = false,
  showActiveOnly = true,
  onBreaksLoaded,
  includeDeleted = false,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const clockInTrackingPoints = useTimeClockTrackingPoints();
  const { getBreaksByAssigneeId } = useBreaksCrud();
  const { getBreakByIdPolicy } = useGetBreakById();
  const {
    getBreaksForAssignee,
    getBreaksByAssigneeLoading,
    getBreaksByAssigneeError,
    getFilteredBreaksForAssignee,
  } = useQuickfills();

  // State for input value
  const [inputValue, setInputValue] = useState<string>('');
  // State to track additional break from getBreakById
  const [additionalBreak, setAdditionalBreak] = useState<BreakRule | null>(
    null,
  );
  // Ref to track the first assigneeId
  const firstAssigneeIdRef = useRef<string | null>(null);
  const logger = useLoggingConfig();
  // Get breaks from Redux state
  const breaks = getBreaksForAssignee(assigneeId);
  const filteredBreaks = getFilteredBreaksForAssignee(assigneeId);
  const loading = getBreaksByAssigneeLoading(assigneeId);
  const errorCode = getBreaksByAssigneeError(assigneeId);

  // Combine breaks from assignee query with additional break from getBreakById
  const combinedBreaks = useMemo(() => {
    const baseBreaks = filteredBreaks !== undefined ? filteredBreaks : breaks;

    if (!additionalBreak) {
      return baseBreaks;
    }

    // Create a Set to avoid duplicates based on break ID
    const breakMap = new Map<string, BreakRule>();

    // Add all base breaks
    baseBreaks.forEach((breakRule) => {
      breakMap.set(breakRule.id, breakRule);
    });

    // Add additional break (will overwrite if duplicate)
    breakMap.set(additionalBreak.id, additionalBreak);

    return Array.from(breakMap.values());
  }, [breaks, filteredBreaks, additionalBreak]);

  // Use combinedBreaks instead of breaksToRender
  const breaksToRender = combinedBreaks;

  // Compute input value based on selected value and breaks data
  const displayInputValue = useMemo(() => {
    if (value && breaksToRender.length > 0) {
      const selectedBreak = breaksToRender.find(
        (breakRule) => breakRule.id === value,
      );
      if (selectedBreak) {
        const formattedBreakType = formatBreakType(
          selectedBreak.breakType,
          intl,
        );
        return `${formattedBreakType}: ${selectedBreak.breakName}`;
      }
    }
    return inputValue;
  }, [value, breaksToRender, inputValue, intl]);

  // Fetch breaks when component mounts or assigneeId/value changes
  useEffect(() => {
    const fetchBreaks = async () => {
      if (!assigneeId) return;

      // Store the first assigneeId if not already set
      if (firstAssigneeIdRef.current === null) {
        firstAssigneeIdRef.current = assigneeId;
      }

      try {
        // Prepare both API calls
        const assigneePromise = getBreaksByAssigneeId(
          assigneeId,
          showActiveOnly,
        );
        const breakByIdPromise = value
          ? getBreakByIdPolicy(value, includeDeleted)
          : Promise.resolve(null);

        // Execute both calls in parallel
        const [, breakById] = await Promise.all([
          assigneePromise,
          breakByIdPromise,
        ]);

        // Set the additional break only if current assigneeId matches the first one
        if (assigneeId === firstAssigneeIdRef.current) {
          setAdditionalBreak(breakById || null);
        } else {
          setAdditionalBreak(null);
        }
      } catch (error) {
        // If any call fails, just log and continue
        logger.error(
          BREAK_LOGGING_CONSTANTS.API_ERRORS.GET_BREAK_BY_ID_FAILED,
          {
            breakId: value,
            error: error instanceof Error ? error.message : error,
            response: error,
          },
        );
        setAdditionalBreak(null);
      }
    };

    fetchBreaks();
  }, [
    assigneeId,
    value,
    showActiveOnly,
    getBreaksByAssigneeId,
    getBreakByIdPolicy,
  ]);

  // Call onBreaksLoaded callback when breaks are loaded
  useEffect(() => {
    if (breaksToRender.length > 0 && onBreaksLoaded) {
      onBreaksLoaded(breaksToRender);
    }
  }, [breaksToRender, onBreaksLoaded]);

  // Handle dropdown change
  const handleChange = useCallback(
    (event: ReactEvent) => {
      const selectedId = (event.target as HTMLInputElement).value;
      track(clockInTrackingPoints.SELECT_BREAK_TYPE_DRAWER);
      onChange(selectedId);
      setInputValue('');
    },
    [onChange, clockInTrackingPoints, track],
  );

  // Handle input change for search
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setInputValue(newValue);
    },
    [],
  );

  // Handle search
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = event.target.value;
      setInputValue(searchValue);
    },
    [],
  );

  // Generate data source for DropdownTypeahead
  const dataSource = useMemo(() => {
    if (loading) {
      return [
        {
          value: '',
          label: intl.formatMessage(
            { id: 'breaks.dropdown.loading' },
            { defaultValue: 'Loading...' },
          ),
        },
      ];
    }

    if (errorCode) {
      return [
        {
          value: '',
          label: intl.formatMessage(
            { id: `breaks.api.error.${errorCode}` },
            { defaultValue: 'Something went wrong. Please try again.' },
          ),
        },
      ];
    }

    if (breaksToRender.length === 0) {
      return [
        {
          value: '',
          label: intl.formatMessage(
            { id: 'breaks.dropdown.no-breaks' },
            { defaultValue: 'No breaks available' },
          ),
        },
      ];
    }

    // Filter breaks based on input value
    const filteredBreaks = breaksToRender.filter((breakRule) => {
      if (!inputValue) return true;
      const formattedBreakType = formatBreakType(breakRule.breakType, intl);
      const searchText =
        `${formattedBreakType}: ${breakRule.breakName}`.toLowerCase();
      return searchText.includes(inputValue.toLowerCase());
    });

    return filteredBreaks.map((breakRule) => ({
      value: breakRule.id,
      label: `${formatBreakType(breakRule.breakType, intl)}: ${
        breakRule.breakName
      }`,
    }));
  }, [breaksToRender, loading, errorCode, intl, inputValue]);

  const defaultLabel = intl.formatMessage(
    { id: 'breaks.dropdown.label' },
    { defaultValue: 'Select Break' },
  );

  const defaultPlaceholder = intl.formatMessage(
    { id: 'breaks.dropdown.placeholder' },
    { defaultValue: 'Choose a break...' },
  );

  // Format error text for display
  const formattedErrorText = useMemo(() => {
    if (errorText) return errorText;
    if (errorCode) {
      return intl.formatMessage(
        { id: `breaks.api.error.${errorCode}` },
        { defaultValue: 'Something went wrong. Please try again.' },
      );
    }
    return undefined;
  }, [errorText, errorCode, intl]);

  return (
    <DropdownTypeahead
      value={value || ''}
      inputValue={displayInputValue}
      onChange={handleChange}
      onSearch={handleSearch}
      dataSource={dataSource}
      label={label || defaultLabel}
      placeholder={placeholder || defaultPlaceholder}
      errorText={formattedErrorText}
      disabled={disabled || loading}
      aria-label={label || defaultLabel}
      width={width as string}
      renderItem={(item, index) => (
        <MenuItem key={`${index}`} value={item.value}>
          {item.label}
        </MenuItem>
      )}
    />
  );
};

export default BreaksByAssigneeDropdown;
