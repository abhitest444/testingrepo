import React, { useCallback, useMemo, useRef, useState } from 'react';
import DropdownTypeahead, {
  MenuItem,
  DropdownTypeaheadStateProps,
} from '@ids-ts/dropdown-typeahead';
import { PopoverActions, PopoverContent } from '@ids-ts/popover';
import DateRangePicker from '@ids-ts/date-range-picker';
import { ChangeEventType } from '@ids-ts/date-picker';
import { useIntl } from '@payroll/quicksand';
import moment from 'moment';
import {
  DueDateFilterType,
  DueDateRange,
  DUE_DATE_FILTER_OPTIONS,
  DATE_RANGE_MONTHS_LIMIT,
  DATE_DISPLAY_FORMAT,
  getFilterDateRange,
  getCustomDateRange,
  isInvalidDateRange,
} from '../utils/dateFilterUtils';
import {
  CustomRangePopover,
  CustomRangeApplyButton,
} from './TimeProjectFilters.styled';
import { DueDateFilterItem } from './DueDateFilterDropdown.styled';

interface DueDateFilterDropdownProps {
  dueDateRange: DueDateRange | null;
  onChange: (range: DueDateRange) => void;
}

const DueDateFilterDropdown: React.FC<DueDateFilterDropdownProps> = ({
  dueDateRange,
  onChange,
}) => {
  const intl = useIntl();
  const text = useCallback((id: string) => intl.formatMessage({ id }), [intl]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showCustomRangePicker, setShowCustomRangePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customEndDateError, setCustomEndDateError] = useState('');

  const isApplyDisabled = useMemo(() => {
    const isoStart = customStartDate
      ? moment(customStartDate, DATE_DISPLAY_FORMAT).format('YYYY-MM-DD')
      : '';
    const isoEnd = customEndDate
      ? moment(customEndDate, DATE_DISPLAY_FORMAT).format('YYYY-MM-DD')
      : '';
    if (isInvalidDateRange(isoStart, isoEnd)) return true;
    return (
      moment(isoEnd, 'YYYY-MM-DD').diff(
        moment(isoStart, 'YYYY-MM-DD'),
        'months',
        true,
      ) > DATE_RANGE_MONTHS_LIMIT
    );
  }, [customStartDate, customEndDate]);

  const validateCustomRange = useCallback(
    (start: string, end: string) => {
      const startMoment = moment(start, DATE_DISPLAY_FORMAT, true);
      const endMoment = moment(end, DATE_DISPLAY_FORMAT, true);
      if (!startMoment.isValid() || !endMoment.isValid()) {
        setCustomEndDateError('');
        return;
      }
      const diffInMonths = endMoment.diff(startMoment, 'months', true);
      if (diffInMonths > DATE_RANGE_MONTHS_LIMIT) {
        setCustomEndDateError(text('timeProject.filter.dueDate.rangeError'));
      } else {
        setCustomEndDateError('');
      }
    },
    [text],
  );

  const handleStartDateChange = useCallback(
    (e: ChangeEventType) => {
      const val = (e?.target as HTMLInputElement)?.value ?? '';
      setCustomStartDate(val);
      validateCustomRange(val, customEndDate);
    },
    [customEndDate, validateCustomRange],
  );

  const handleEndDateChange = useCallback(
    (e: ChangeEventType) => {
      const val = (e?.target as HTMLInputElement)?.value ?? '';
      setCustomEndDate(val);
      validateCustomRange(customStartDate, val);
    },
    [customStartDate, validateCustomRange],
  );

  const handleApplyCustomRange = useCallback(() => {
    const fromDate = moment(customStartDate, DATE_DISPLAY_FORMAT).format(
      'YYYY-MM-DD',
    );
    const toDate = moment(customEndDate, DATE_DISPLAY_FORMAT).format(
      'YYYY-MM-DD',
    );
    onChange(getCustomDateRange(fromDate, toDate));
    setShowCustomRangePicker(false);
    setInputValue('');
  }, [customStartDate, customEndDate, onChange]);

  // `customStartDate` and `customEndDate` are intentionally not reset here.
  // `openCustomRangePicker` re-seeds them from the confirmed `dueDateRange`
  // on the next open, so any half-typed values the user discarded are
  // always overwritten before the picker is shown again.
  const handleClosePopover = useCallback(() => {
    setShowCustomRangePicker(false);
    setCustomEndDateError('');
  }, []);

  // Mirrors projects-plugin's DateFilterPopover initialisation:
  // always seed the picker with whatever range is currently active —
  // whether that is a named preset or a previous custom range — so
  // switching from "Due today" back to "Custom range" pre-fills the
  // picker with today's dates rather than showing empty fields.
  const openCustomRangePicker = useCallback(() => {
    setCustomStartDate(
      dueDateRange?.fromDate
        ? moment(dueDateRange.fromDate, 'YYYY-MM-DD').format(
            DATE_DISPLAY_FORMAT,
          )
        : '',
    );
    setCustomEndDate(
      dueDateRange?.toDate
        ? moment(dueDateRange.toDate, 'YYYY-MM-DD').format(DATE_DISPLAY_FORMAT)
        : '',
    );
    setCustomEndDateError('');
    setShowCustomRangePicker(true);
  }, [dueDateRange]);

  const handleChange = useCallback(
    // IDS declares onChange as (ReactEvent), but passes { target: { value } }
    // at runtime. React.ChangeEvent<any> accepts ReactEvent and types .target
    // as `any`, matching the actual contract without defeating type-checking.
    (event: React.ChangeEvent<any>) => {
      const selected = event?.target?.value as string | undefined;
      if (selected === undefined) return;

      if (selected === DueDateFilterType.CUSTOM_RANGE) {
        openCustomRangePicker();
        return;
      }

      onChange(getFilterDateRange(selected as DueDateFilterType));
      setInputValue('');
    },
    [onChange, openCustomRangePicker],
  );

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event?.target?.value || '');
    },
    [],
  );

  // Mirrors projects-plugin's getCustomDateLabel: shows "fromDate – toDate"
  // when a custom range is active, else the plain "Custom range" NLS label.
  const getCustomRangeLabel = useCallback(() => {
    if (
      dueDateRange?.filterType === DueDateFilterType.CUSTOM_RANGE &&
      dueDateRange.fromDate &&
      dueDateRange.toDate
    ) {
      const from = moment(dueDateRange.fromDate, 'YYYY-MM-DD').format(
        DATE_DISPLAY_FORMAT,
      );
      const to = moment(dueDateRange.toDate, 'YYYY-MM-DD').format(
        DATE_DISPLAY_FORMAT,
      );
      return `${from} - ${to}`;
    }
    return text('timeProject.filter.dueDate.customRange');
  }, [dueDateRange, text]);

  // List items always show the static NLS label (mirrors projects-plugin's
  // MenuItemWrapper children={label}). The formatted date range only appears
  // in the closed trigger via selectedLabel / inputValue (see below).
  const dataSource = useMemo(() => {
    const search = inputValue.toLowerCase();
    return DUE_DATE_FILTER_OPTIONS.map((opt) => ({
      value: opt.value,
      label: text(opt.nlsKey),
    })).filter(({ label }) => label.toLowerCase().includes(search));
  }, [inputValue, text]);

  // Defensive fallback: on the QBOA Workflow path (the only context that
  // renders this component), `dueDateRange` is always initialised before
  // mount. The null guard is a safety net in case the component is ever
  // rendered outside that contract, ensuring the dropdown never displays
  // an empty / uncontrolled value.
  const selectedValue =
    dueDateRange?.filterType ?? DueDateFilterType.CUSTOM_RANGE;

  const selectedLabel = useMemo(() => {
    if (
      !dueDateRange ||
      dueDateRange.filterType === DueDateFilterType.CUSTOM_RANGE
    ) {
      return getCustomRangeLabel();
    }
    const opt = DUE_DATE_FILTER_OPTIONS.find(
      (o) => o.value === dueDateRange.filterType,
    );
    return opt ? text(opt.nlsKey) : getCustomRangeLabel();
  }, [dueDateRange, text, getCustomRangeLabel]);

  const displayValue = inputValue || selectedLabel;

  const renderItem = useCallback(
    (
      item: DropdownTypeaheadStateProps & Record<string, unknown>,
      index?: number,
    ) => (
      <MenuItem
        key={`due-date-${index}`}
        value={item.value as DueDateFilterType}
      >
        {item.label as string}
      </MenuItem>
    ),
    [],
  );

  return (
    <DueDateFilterItem
      ref={containerRef}
      data-testid="time-project-due-date-filter"
    >
      <DropdownTypeahead
        label={text('timeProject.filter.dueDate.label')}
        value={selectedValue}
        inputValue={displayValue}
        onChange={handleChange}
        onSearch={handleSearch}
        dataSource={dataSource}
        placeholder={text('timeProject.filter.dueDate.customRange')}
        width="100%"
        renderItem={renderItem}
      />
      {showCustomRangePicker && (
        <CustomRangePopover
          open
          position="bottom"
          alignment="left"
          targetElement={containerRef.current}
          onClose={handleClosePopover}
        >
          <PopoverContent>
            <DateRangePicker
              startingDate={customStartDate}
              endingDate={customEndDate}
              startDateLabel={text('timeProject.filter.dueDate.startDate')}
              endDateLabel={text('timeProject.filter.dueDate.endDate')}
              onStartingDateChange={handleStartDateChange}
              onEndingDateChange={handleEndDateChange}
              onStartingDateInputChange={handleStartDateChange}
              onEndingDateInputChange={handleEndDateChange}
              dateFormat={DATE_DISPLAY_FORMAT}
              placeholder={DATE_DISPLAY_FORMAT}
              errorTextEndDate={customEndDateError}
            />
          </PopoverContent>
          <PopoverActions>
            <CustomRangeApplyButton
              onClick={handleApplyCustomRange}
              disabled={isApplyDisabled}
              $hasError={!!customEndDateError}
            >
              {text('timeProject.filter.dueDate.apply')}
            </CustomRangeApplyButton>
          </PopoverActions>
        </CustomRangePopover>
      )}
    </DueDateFilterItem>
  );
};

export default DueDateFilterDropdown;
