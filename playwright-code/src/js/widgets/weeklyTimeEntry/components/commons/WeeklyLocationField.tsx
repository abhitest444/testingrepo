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

interface LabelPreference {
  DepartmentTerminology: string;
  CustomerTerminology: string;
}

interface WeeklyLocationFieldProps {
  disabled?: boolean;
  error?: string;
  width?: number;
  updateLabel?: (field: string, value: string) => void;
  labelPreference?: LabelPreference;
  displayCell?: any;
  isOTX?: boolean;
}

/**
 * WeeklyLocationField Component
 *
 * Renders a QuickFind widget for selecting a location with assignment-based filtering.
 *
 * Assignment Logic:
 * - If Location field is DISABLED in company settings → Use assigned: true filter
 * - If Location field is ENABLED in company settings → Use assigned: null filter (show all)
 *
 * Uses Redux store for state management.
 * Location initialization is handled in the Redux store.
 * Value and inputValue are derived from the Redux store.
 */
export const WeeklyLocationField: React.FC<WeeklyLocationFieldProps> = ({
  disabled = false,
  error,
  width,
  updateLabel,
  labelPreference = { DepartmentTerminology: '', CustomerTerminology: '' },
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

  // Get the current cell's location data using hashmap approach
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

  const locationValue = currentCell?.metaInfo?.location?.id || '';
  const locationName = currentCell?.metaInfo?.location?.name || '';
  const isLocationRequired = companySettings?.locationRequired ?? false;

  // Calculate assignment filters for QuickFind (object shape expected by QuickFind)
  // Memoized to prevent infinite loops
  const assignmentFilters = useMemo(() => {
    if (!isOTX) {
      return null;
    }
    const assigned = getQuickFindAssignmentFilter('location', companySettings);
    return { assigned };
  }, [companySettings, isOTX]);

  // QuickFind passes (selectedId: string, selectedItem?: { id, name }); legacy quickfills pass e.selectedItem
  const handleLocationChange = (
    valueOrEvent:
      | string
      | { selectedItem?: { localId: string; fullName: string } },
    selectedItem?: { id?: string; name?: string; fullName?: string },
  ) => {
    const isQuickFindSignature = typeof valueOrEvent === 'string';
    const id = isQuickFindSignature
      ? valueOrEvent
      : valueOrEvent?.selectedItem?.localId;
    const name = isQuickFindSignature
      ? selectedItem?.name ?? selectedItem?.fullName ?? ''
      : valueOrEvent?.selectedItem?.fullName ?? '';

    const baseMetaInfo = getLiveCellMetaInfo(
      selectWeeklyTimeEntriesMap(store.getState()),
      selectedCell,
      currentCell,
    );

    const newValue = id
      ? {
          metaInfo: {
            ...baseMetaInfo,
            location: { id, name },
          },
        }
      : {
          metaInfo: {
            ...baseMetaInfo,
            location: undefined,
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

    if (id) {
      track(trackingPoints.LOCATION);
    }

    updateLabel?.('location', name || '');
  };

  const widgetId = isOTX
    ? 'time-tracking-ui/quickFind'
    : 'qbo-quickfills-ui/quickfills';

  return (
    <DropdownOverlayContainer data-testid="location-field">
      {isOTX ? (
        <Widget
          widgetId={widgetId}
          dropdownType="location"
          value={locationValue}
          displayName={locationName}
          disabled={disabled}
          addNew={!isWorkforceUser}
          onChange={handleLocationChange}
          placeholder={intl.formatMessage({
            id: 'weekly.time.entry.location.placeholder',
          })}
          label={
            (labelPreference.DepartmentTerminology ||
              intl.formatMessage({
                id: 'weekly.time.entry.location.label',
              })) + (isLocationRequired ? '*' : '')
          }
          autoSelect={isLocationRequired}
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
          type="locationV2"
          addNew={!isWorkforceUser}
          value={locationValue}
          inputValue={locationName}
          disabled={disabled}
          onChange={handleLocationChange}
          placeholder={intl.formatMessage({
            id: 'weekly.time.entry.location.placeholder',
          })}
          label={
            (labelPreference.DepartmentTerminology ||
              intl.formatMessage({
                id: 'weekly.time.entry.location.label',
              })) + (companySettings?.locationRequired ? '*' : '')
          }
          errorText={error}
          width={width}
        />
      )}
    </DropdownOverlayContainer>
  );
};
