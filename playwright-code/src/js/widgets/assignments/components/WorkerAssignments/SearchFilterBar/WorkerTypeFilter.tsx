import React, { KeyboardEvent, MouseEvent } from 'react';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import type { WorkerTypeFilterProps, WorkerType } from './types';
import { GROUPS_LIST_TRACKING_POINTS } from '../../../utils/groupsTrackingPoints';

/**
 * WorkerTypeFilter Component
 *
 * Dropdown filter for selecting worker type
 * Options: All, Employee, User, Vendor
 * Uses IDS Dropdown component
 */
export const WorkerTypeFilter: React.FC<WorkerTypeFilterProps> = ({
  value,
  onChange,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();

  const handleChange = (event: KeyboardEvent | MouseEvent) => {
    // @ts-ignore - event.target.value exists on dropdown
    const selectedValue = event.target.value as WorkerType;

    // Map worker type to user-friendly label
    const workerTypeLabel =
      {
        ALL: 'all',
        EMPLOYEE: 'employee',
        LEGACY_QBO_USER: 'user',
        VENDOR: 'vendor',
      }[selectedValue] || selectedValue.toLowerCase();

    // Track worker type dropdown selection with selected value
    track({
      ...GROUPS_LIST_TRACKING_POINTS.WORKERS_LIST_CLICKED,
      worker_type: workerTypeLabel,
    });

    onChange(selectedValue);
  };

  return (
    <Dropdown
      value={value}
      onChange={handleChange}
      label={intl.formatMessage({
        id: 'workers.filter.label',
        defaultMessage: 'Workers',
      })}
      aria-label={intl.formatMessage({
        id: 'workers.filter.ariaLabel',
        defaultMessage: 'Filter by worker type',
      })}
      data-testid="worker-type-filter"
    >
      <MenuItem key="ALL" value="ALL">
        {intl.formatMessage({
          id: 'workers.filter.all',
          defaultMessage: 'All',
        })}
      </MenuItem>
      <MenuItem key="EMPLOYEE" value="EMPLOYEE">
        {intl.formatMessage({
          id: 'workers.type.employee',
          defaultMessage: 'Employee',
        })}
      </MenuItem>
      <MenuItem key="LEGACY_QBO_USER" value="LEGACY_QBO_USER">
        {intl.formatMessage({
          id: 'workers.type.user',
          defaultMessage: 'User',
        })}
      </MenuItem>
      <MenuItem key="VENDOR" value="VENDOR">
        {intl.formatMessage({
          id: 'workers.filter.vendor',
          defaultMessage: 'Vendor',
        })}
      </MenuItem>
    </Dropdown>
  );
};
