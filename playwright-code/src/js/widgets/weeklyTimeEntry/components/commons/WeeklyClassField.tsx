import React, { useMemo } from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { getQuickFindAssignmentFilter } from 'src/js/common/assignmentFieldUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
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
import { DropdownOverlayContainer } from '../../styles/WeeklyTimeEntry.styles';
import { getLiveCellMetaInfo } from '../../utils/helpers';

interface WeeklyClassFieldProps {
  disabled?: boolean;
  error?: string;
  width?: number;
  updateLabel?: (field: string, value: string) => void;
  displayCell?: any;
  isOTX?: boolean;
}

/**
 * WeeklyClassField Component
 *
 * Renders a QuickFind widget for selecting a class with assignment-based filtering.
 *
 * Assignment Logic:
 * - If Class field is DISABLED in company settings → Use assigned: true filter
 * - If Class field is ENABLED in company settings → Use assigned: null filter (show all)
 *
 * Uses Redux store for state management.
 * Class initialization is handled in the Redux store.
 * Value and inputValue are derived from the Redux store.
 */
export const WeeklyClassField: React.FC<WeeklyClassFieldProps> = ({
  disabled = false,
  error,
  width,
  updateLabel,
  displayCell,
  isOTX = false,
}) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const intl = useIntl();
  const sandbox = useSandbox();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );
  const rows = useAppSelector(selectTimesheetRows);
  const selectedCell = useAppSelector(selectSelectedCell);
  const weeklyTimeEntriesMap = useAppSelector(selectWeeklyTimeEntriesMap);
  const companySettings = useAppSelector(selectCompanySettings);
  const track = useTracking();
  const teamMember = useAppSelector(selectTeamMember);

  // Get the current cell's class data using hashmap approach
  const currentCell = selectedCell
    ? weeklyTimeEntriesMap[selectedCell.rowId]?.timeEntries[selectedCell.dayIdx]
    : displayCell || null;

  // Get customer/project from the current row
  const currentRow = selectedCell
    ? weeklyTimeEntriesMap[selectedCell.rowId]
    : null;
  // WTE uses customer id only, even when type is project
  const customerId = currentRow?.timeAgainst?.id || null;
  const projectId = null;
  const workerId = teamMember?.id || null;

  const classValue = currentCell?.metaInfo?.class?.id || '';
  const className = currentCell?.metaInfo?.class?.name || '';
  const isClassRequired = companySettings?.classRequired ?? false;

  // Calculate assignment filters for QuickFind (object shape expected by QuickFind)
  // Memoized to prevent infinite loops
  const assignmentFilters = useMemo(() => {
    if (!isOTX) {
      return null;
    }
    const assigned = getQuickFindAssignmentFilter('class', companySettings);
    return { assigned };
  }, [companySettings, isOTX]);

  // QuickFind passes (selectedId: string, selectedItem?: { id, name }); legacy quickfills pass e.selectedItem
  const handleClassChange = (
    valueOrEvent:
      | string
      | { selectedItem?: { id: string; displayName: string } },
    selectedItem?: { id?: string; name?: string; displayName?: string },
  ) => {
    const isQuickFindSignature = typeof valueOrEvent === 'string';
    const id = isQuickFindSignature
      ? valueOrEvent
      : valueOrEvent?.selectedItem?.id;
    const name = isQuickFindSignature
      ? selectedItem?.name ?? selectedItem?.displayName ?? ''
      : valueOrEvent?.selectedItem?.displayName ?? '';

    track(trackingPoints.CLASS);
    const baseMetaInfo = getLiveCellMetaInfo(
      selectWeeklyTimeEntriesMap(store.getState()),
      selectedCell,
      currentCell,
    );

    const newValue = id
      ? {
          metaInfo: {
            ...baseMetaInfo,
            class: { id, name },
          },
        }
      : {
          metaInfo: {
            ...baseMetaInfo,
            class: undefined,
          },
        };

    if (selectedCell) {
      dispatch(
        updateCell({
          rowId: selectedCell.rowId,
          dayIdx: selectedCell.dayIdx,
          value: newValue,
        }),
      );
    }

    updateLabel?.('class', name || '');
  };

  const widgetId = isOTX
    ? 'time-tracking-ui/quickFind'
    : 'qbo-quickfills-ui/quickfills';

  return (
    <DropdownOverlayContainer data-testid="class-field">
      {isOTX ? (
        <Widget
          widgetId={widgetId}
          dropdownType="class"
          value={classValue}
          displayName={className}
          disabled={disabled}
          addNew={!isWorkforceUser}
          onChange={handleClassChange}
          placeholder={intl.formatMessage({
            id: 'weekly.time.entry.class.placeholder',
          })}
          label={
            intl.formatMessage({
              id: 'weekly.time.entry.class.label',
            }) + (isClassRequired ? '*' : '')
          }
          autoSelect={isClassRequired}
          autoSelectKey={
            selectedCell && `${selectedCell.rowId}-${selectedCell.dayIdx}`
          }
          errorText={error}
          width={width}
          sandbox={sandbox}
          assignmentFilters={assignmentFilters}
          customerId={customerId}
          projectId={projectId}
          timeForEntityId={workerId}
        />
      ) : (
        <Widget
          widgetId={widgetId}
          type="klass"
          value={classValue}
          inputValue={className}
          disabled={disabled}
          addNew={!isWorkforceUser}
          onChange={handleClassChange}
          placeholder={intl.formatMessage({
            id: 'weekly.time.entry.class.placeholder',
          })}
          label={
            intl.formatMessage({
              id: 'weekly.time.entry.class.label',
            }) + (companySettings?.classRequired ? '*' : '')
          }
          errorText={error}
          width={width}
        />
      )}
    </DropdownOverlayContainer>
  );
};
