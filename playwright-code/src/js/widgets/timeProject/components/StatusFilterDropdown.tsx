import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import { useIntl, useTracking } from '@payroll/quicksand';
import {
  STATUS_FILTER_OPTIONS,
  WORKFLOW_STATUS_FILTER_OPTIONS,
  QBO_WORKFLOW_STATUS_FILTER_OPTIONS,
} from '../constants';
import { useLandingPageTrackingPoints } from '../hooks/useLandingPageTrackingPoints';
import { FilterItem } from './TimeProjectFilters.styled';

interface StatusFilterDropdownProps {
  value: string;
  onChange: (status: string) => void;
  isWorkflowApiEnabled?: boolean;
  isAccountant?: boolean;
}

const StatusFilterDropdown: React.FC<StatusFilterDropdownProps> = ({
  value,
  onChange,
  isWorkflowApiEnabled = false,
  isAccountant = false,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const text = useCallback((id: string) => intl.formatMessage({ id }), [intl]);
  const [inputValue, setInputValue] = useState('');
  const trackingPoints = useLandingPageTrackingPoints();

  // Mirrors projects-plugin's QbaStatus / QboStatus split:
  // - Workflow disabled  → OIGQL path; both "Not started" and "To do" are
  //   distinct API values so both options are shown.
  // - Workflow enabled + QBOA → "To do" is the accountant label for an
  //   open/unstarted project; "Not started" is hidden.
  // - Workflow enabled + QBO  → "Not started" is the non-accountant label;
  //   "To do" is hidden.
  let statusOptions: { value: string; nlsKey: string }[];
  if (!isWorkflowApiEnabled) {
    statusOptions = STATUS_FILTER_OPTIONS;
  } else if (isAccountant) {
    statusOptions = WORKFLOW_STATUS_FILTER_OPTIONS;
  } else {
    statusOptions = QBO_WORKFLOW_STATUS_FILTER_OPTIONS;
  }

  // On the Workflow path the active filter value (from Redux) may refer to an
  // option that is hidden for the current user type. For example, a value of
  // "Not started" is not present in WORKFLOW_STATUS_FILTER_OPTIONS (QBOA), and
  // "To do" is not present in QBO_WORKFLOW_STATUS_FILTER_OPTIONS (QBO). Without
  // normalization, selectedLabel would silently fall back to "All statuses"
  // while the underlying filter is still active, creating a UI/state mismatch.
  //
  // Normalization maps the hidden value to its visible equivalent:
  //   QBOA: "Not started" → "To do"
  //   QBO:  "To do"       → "Not started"
  // The OIGQL path (workflow disabled) never needs normalization because both
  // options are visible simultaneously.
  const normalizedValue = useMemo(() => {
    if (!isWorkflowApiEnabled || !value || value === 'ALL') return value;
    if (isAccountant && value === 'Not started') return 'To do';
    if (!isAccountant && value === 'To do') return 'Not started';
    return value;
  }, [isWorkflowApiEnabled, isAccountant, value]);

  // Sync Redux store when normalization changes the active value so downstream
  // filter state stays consistent with what the dropdown displays.
  useEffect(() => {
    if (normalizedValue !== value) {
      onChange(normalizedValue);
    }
  }, [normalizedValue, value, onChange]);

  const selectedLabel = useMemo(() => {
    const option = statusOptions.find(
      (opt) => opt.value === (normalizedValue || 'ALL'),
    );
    return option
      ? text(option.nlsKey)
      : text('timeProject.filter.allStatuses');
  }, [normalizedValue, statusOptions, text]);

  const dataSource = useMemo(() => {
    const search = inputValue.toLowerCase();
    return statusOptions
      .filter((opt) => text(opt.nlsKey).toLowerCase().includes(search))
      .map((opt) => ({ value: opt.value, label: text(opt.nlsKey) }));
  }, [inputValue, statusOptions, text]);

  const handleChange = useCallback(
    (event: any) => {
      const selected = event?.target?.value;
      if (selected !== undefined) {
        track(trackingPoints.SELECT_STATUS_DROPDOWN);
        onChange(selected);
        setInputValue('');
      }
    },
    [onChange, track, trackingPoints],
  );

  const handleSearch = useCallback((event: any) => {
    setInputValue(event?.target?.value || '');
  }, []);

  const renderItem = useCallback(
    (item: Record<string, any>, index?: number) => (
      <MenuItem key={`status-${index}`} value={item.value}>
        {item.label}
      </MenuItem>
    ),
    [],
  );

  // Show the active selection as the filled-in `inputValue` (rendered
  // in primary text color) rather than as `placeholder` (rendered in
  // ghost / grey). Once the user starts typing, `inputValue` switches
  // to whatever they're searching for so the typeahead still works.
  const displayValue = inputValue || selectedLabel;

  return (
    <FilterItem data-testid="time-project-status-filter">
      <DropdownTypeahead
        label={text('timeProject.filter.statusLabel')}
        value={normalizedValue || 'ALL'}
        inputValue={displayValue}
        onChange={handleChange}
        onSearch={handleSearch}
        onFocus={() => track(trackingPoints.CLICK_STATUS_DROPDOWN)}
        dataSource={dataSource}
        placeholder={text('timeProject.filter.allStatuses')}
        width="100%"
        renderItem={renderItem}
      />
    </FilterItem>
  );
};

export default StatusFilterDropdown;
