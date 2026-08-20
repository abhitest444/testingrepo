import React from 'react';
import { ChevronDown } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import { useTracking } from '@payroll/quicksand';
import { useSubmitTimeDatesContext } from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';
import { getCustomerName, isWeeklyRowLocked } from '../../utils/helpers';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import type { TimesheetRow } from '../../store/timeEntryGridSlice';
import { openContextMenu } from '../../store/contextMenuSlice';
import {
  CustomerNameColumn,
  DropdownColumn,
  SuperSearchCell,
} from '../styles/WeeklySuperSerach.styles';

interface CustomerCellProps {
  row: TimesheetRow;
  rowIndex: number;
  cellIdx: number;
  customers: any[];
  breaks: any[];
  dispatch: any;
  fieldErrors?: {
    service?: string;
    class?: string;
    location?: string;
    notes?: string;
    customerProject?: string;
    customFields?: { [fieldId: string]: string };
    dimensions?: { [definitionId: string]: string };
  };
}

/**
 * CustomerCell Component
 * Renders the first column (customer/project/break/time off selector) for a row.
 * Handles display label logic and opens the super search context menu on click.
 */
export const CustomerCell: React.FC<CustomerCellProps> = ({
  row,
  rowIndex,
  cellIdx,
  customers,
  breaks,
  dispatch,
  fieldErrors = {},
}) => {
  const displayLabel = getCustomerName(row, customers, breaks);
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const { minSelectableDate, isSubmitTimeEnabled } =
    useSubmitTimeDatesContext();
  const { hasApprovedEntries: isRowHavingApprovedTimeEntries, isTimeOffRow } =
    row;
  const isRowLocked = isWeeklyRowLocked(
    isRowHavingApprovedTimeEntries,
    isTimeOffRow,
    row.timeEntries,
    minSelectableDate,
    isSubmitTimeEnabled,
  );

  // Check if there are validation errors for this cell
  const hasErrors =
    Object.values(fieldErrors).some(
      (error) => typeof error === 'string' && error.length > 0,
    ) ||
    (fieldErrors.customFields &&
      Object.keys(fieldErrors.customFields).length > 0) ||
    (fieldErrors.dimensions &&
      Object.keys(fieldErrors.dimensions).length > 0) ||
    fieldErrors.customerProject;

  let className = '';

  if (isRowLocked) {
    className = 'has-approved-entries';
  } else if (hasErrors) {
    className = 'has-validation-errors';
  }

  return (
    <SuperSearchCell
      className={className}
      data-testid="weekly-time-category-selector"
      aria-label="weekly-time-category-selector"
    >
      <CustomerNameColumn>{displayLabel}</CustomerNameColumn>
      {!isRowLocked && (
        <DropdownColumn
          onClick={(e) => {
            e.preventDefault();
            track(trackingPoints.CUSTOMER);
            dispatch(
              openContextMenu({
                x: e.clientX,
                y: e.clientY,
                rowId: row.rowId,
                dayIdx: cellIdx,
                menuType: 'superSearch',
              }),
            );
          }}
          style={{ cursor: 'pointer' }}
        >
          <IconControl>
            <ChevronDown />
          </IconControl>
        </DropdownColumn>
      )}
    </SuperSearchCell>
  );
};
