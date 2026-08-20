import React from 'react';
import styled from 'styled-components';
import { Checkbox } from '@ids-ts/checkbox';
import { TextField } from '@ids-ts/text-field';
import { useIntl, useTracking } from '@payroll/quicksand';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import { useAppDispatch, useAppSelector, useAppStore } from '../../store';
import {
  selectTimesheetRows,
  selectSelectedCell,
  selectWeeklyTimeEntriesMap,
  selectCompanySettings,
  selectTeamMember,
} from '../../store/selectors';
import { updateCell } from '../../store/timeEntryGridSlice';
import { isBreakRow, resolveBillableRate } from '../../utils/helpers';

const BillableContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
`;

const BillableRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  & > label {
    margin: 0 !important;
  }
`;

interface WeeklyBillableFieldProps {
  disabled?: boolean;
  error?: string;
  displayCell?: any;
  /** @deprecated No assignment logic for bill rate. Rate visibility uses only company setting. Kept for backwards compat. */
  showBillRateWhenBillable?: boolean;
}

export const WeeklyBillableField: React.FC<WeeklyBillableFieldProps> = ({
  disabled = false,
  error,
  displayCell,
}) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const intl = useIntl();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const selectedCell = useAppSelector(selectSelectedCell);
  const weeklyTimeEntriesMap = useAppSelector(selectWeeklyTimeEntriesMap);
  const companySettings = useAppSelector(selectCompanySettings);
  const liveTeamMember = useAppSelector(selectTeamMember);
  const track = useTracking();

  // Use selected cell or display cell using hashmap approach
  const cell = selectedCell
    ? weeklyTimeEntriesMap[selectedCell.rowId]?.timeEntries[selectedCell.dayIdx]
    : displayCell;

  if (!cell) return null;

  const handleBillableChange = (event: {
    target?: { checked?: boolean };
    checked?: boolean;
  }) => {
    // Support both standard React event (event.target.checked) and IDS/custom (event.checked)
    const checked = (event?.target as any)?.checked ?? (event as any)?.checked;
    if (!selectedCell || checked === undefined) return;

    // Check if this is a break row to prevent setting billable info
    // Break entries (PAID/UNPAID time categories) should not have billable information
    const currentRow = selectedCell
      ? weeklyTimeEntriesMap[selectedCell.rowId]
      : null;
    const isCurrentRowBreak = isBreakRow(currentRow?.timeAgainst);

    // Don't allow setting billable info for break entries
    // This prevents users from manually setting billable information on break entries
    if (isCurrentRowBreak) return;

    // Track with appropriate ui_action based on checkbox state
    track({
      ...trackingPoints.BILLABLE,
      ui_action: checked ? 'enabled' : 'disabled',
    });

    // When rechecking, restore the rate. The rate is preserved on uncheck
    // (just hidden since the field isn't shown). Fall back to service price
    // or employee rate if the stored rate is missing/zero.
    let rate = cell.billableInfo?.billableRate || '0';
    if (checked && rate === '0') {
      const currentTeamMember = selectTeamMember(store.getState());
      rate = resolveBillableRate(
        currentTeamMember,
        cell.metaInfo?.service?.price,
      );
    }

    dispatch(
      updateCell({
        rowId: selectedCell.rowId,
        dayIdx: selectedCell.dayIdx,
        value: {
          billableInfo:
            rate !== '0'
              ? { billable: checked, billableRate: rate }
              : { billable: checked },
        },
      }),
    );
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCell) return;

    // Check if this is a break row to prevent setting billable info
    // Break entries (PAID/UNPAID time categories) should not have billable information
    const currentRow = selectedCell
      ? weeklyTimeEntriesMap[selectedCell.rowId]
      : null;
    const isCurrentRowBreak = isBreakRow(currentRow?.timeAgainst);

    // Don't allow setting billable info for break entries
    // This prevents users from manually setting billable rates on break entries
    if (isCurrentRowBreak) return;

    // Prevent negative values by capping to 0
    const inputValue = e.target.value;
    const numValue = Number(inputValue);

    // If the input is empty, allow it (for clearing the field)
    if (inputValue === '') {
      dispatch(
        updateCell({
          rowId: selectedCell.rowId,
          dayIdx: selectedCell.dayIdx,
          value: {
            billableInfo: {
              billable: true,
              billableRate: undefined,
            },
          },
        }),
      );
      track(trackingPoints.BILL_RATE);
      return;
    }

    // If it's a valid number, cap negative values to 0
    if (!Number.isNaN(numValue)) {
      const cappedValue = Math.max(0, numValue);
      dispatch(
        updateCell({
          rowId: selectedCell.rowId,
          dayIdx: selectedCell.dayIdx,
          value: {
            billableInfo: {
              billable: true,
              billableRate: cappedValue.toString(),
            },
          },
        }),
      );
      track(trackingPoints.BILL_RATE);
    }
  };

  const cellHasDefaultBillable =
    !cell.billableInfo ||
    (!cell.metaInfo?.service &&
      !cell.billableInfo.billable &&
      (!cell.billableInfo.billableRate ||
        cell.billableInfo.billableRate === '0'));
  const useTeamMemberDefault =
    cellHasDefaultBillable &&
    !cell.timeEntryId &&
    !!liveTeamMember &&
    (liveTeamMember.billable === true ||
      (liveTeamMember.billableRate ?? 0) > 0);
  const isBillable = useTeamMemberDefault
    ? liveTeamMember!.billable ?? false
    : cell.billableInfo?.billable ?? false;
  const rateValue = useTeamMemberDefault
    ? String(liveTeamMember!.billableRate ?? 0)
    : cell.billableInfo?.billableRate || '';
  // Show bill rate when billable is checked and company has bill rate enabled. No assignment logic (same as time clock, STE).
  const isBillRateEnabled =
    companySettings?.billingRateForTimeEnabled === true ||
    companySettings?.billingRateForTimeEnabled === undefined;
  const showRateField = isBillable && isBillRateEnabled;

  return (
    <BillableContainer data-testid="billable-field">
      <BillableRow>
        <Checkbox
          checked={isBillable}
          onChange={handleBillableChange}
          disabled={disabled}
        >
          {intl.formatMessage({
            id: 'weekly.time.entry.billable.label',
          })}
        </Checkbox>
      </BillableRow>
      {showRateField && (
        <TextField
          type="text"
          width="70px"
          value={rateValue}
          onChange={handleRateChange}
          disabled={disabled}
          errorText={error}
          aria-label={intl.formatMessage({
            id: 'weekly.time.entry.billable.rate.aria.label',
          })}
        />
      )}
    </BillableContainer>
  );
};
