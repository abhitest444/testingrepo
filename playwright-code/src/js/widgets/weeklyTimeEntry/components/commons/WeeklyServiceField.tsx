import React, { useMemo, useState } from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';
import styled from 'styled-components';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
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
import {
  TeamMember,
  timeEntryDetails,
  updateCell,
} from '../../store/timeEntryGridSlice';
import { DropdownOverlayContainer } from '../../styles/WeeklyTimeEntry.styles';
import { TimeForType } from '../../types';
import {
  getLiveCellMetaInfo,
  isBreakRow,
  resolveBillableRate,
} from '../../utils/helpers';

const StyledDescriptionConfirmationMessage = styled.div`
  font-size: var(--font-size-heading-5);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-heading);
  font-style: normal;
  margin: 0;
  padding: 0;
`;

interface WeeklyServiceFieldProps {
  disabled?: boolean;
  error?: string;
  width?: number;
  updateLabel?: (field: string, value: string) => void;
  displayCell?: any;
  isOTX?: boolean;
  /** When provided, QuickFind uses these options and skips SFO fetch */
  preloadedServiceOptions?: any[] | null;
  /** When provided, QuickFind calls API with search text instead of client-side filter */
  onSearchService?: (searchText: string | null) => void;
  hasMoreService?: boolean;
  loadMoreService?: () => void;
}

/**
 * WeeklyServiceField Component
 *
 * Renders a QuickFind widget for selecting a service item with assignment-based filtering.
 *
 * Assignment Logic:
 * - If Service field is DISABLED in company settings → Use assigned: true filter
 * - If Service field is ENABLED in company settings → Use assigned: null filter (show all)
 *
 * Uses Redux store for state management.
 * Service initialization is handled in the Redux store.
 * Value and inputValue are derived from the Redux store.
 */
export const WeeklyServiceField: React.FC<WeeklyServiceFieldProps> = ({
  disabled = false,
  error,
  width,
  updateLabel,
  displayCell,
  isOTX = false,
  preloadedServiceOptions,
  onSearchService,
  hasMoreService,
  loadMoreService,
}) => {
  const [notesToOverride, setNotesToOverride] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const intl = useIntl();
  const sandbox = useSandbox();
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );
  const rows = useAppSelector(selectTimesheetRows);
  const selectedCell = useAppSelector(selectSelectedCell);
  const weeklyTimeEntriesMap = useAppSelector(selectWeeklyTimeEntriesMap);
  const companySettings = useAppSelector(selectCompanySettings);
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const teamMember = useAppSelector(selectTeamMember);

  // Get the current cell's service data using hashmap approach
  const currentCell = selectedCell
    ? weeklyTimeEntriesMap[selectedCell.rowId]?.timeEntries[selectedCell.dayIdx]
    : displayCell || null;

  // Get customer id from the current row (WTE uses customer id only, even when type is project)
  const currentRow = selectedCell
    ? weeklyTimeEntriesMap[selectedCell.rowId]
    : null;
  const customerId = currentRow?.timeAgainst?.id || null;
  const projectId = null;
  const workerId = teamMember?.id || null;

  const serviceValue = currentCell?.metaInfo?.service?.id || '';
  const serviceName = currentCell?.metaInfo?.service?.name || '';
  const currentCellNotes = currentCell?.notes || '';
  const currentCellServiceDescription =
    currentCell?.metaInfo?.service?.description || '';
  const isServiceRequired = companySettings?.serviceItemRequired ?? false;

  // Calculate assignment filters for QuickFind (object shape expected by QuickFind)
  const assignmentFilters = useMemo(() => {
    if (!isOTX) {
      return undefined;
    }
    const assigned = getQuickFindAssignmentFilter('service', companySettings);
    return { assigned };
  }, [companySettings, isOTX]);

  const getBillableInfo = (
    servicePrice: number,
    teamMember?: TeamMember | null,
  ) => {
    const billableRate = resolveBillableRate(teamMember, servicePrice);
    if (servicePrice && servicePrice > 0) {
      return { billable: true, billableRate };
    }
    const isBillable =
      teamMember?.type === TimeForType.EMPLOYEE ? teamMember?.billable : false;
    return {
      billable: isBillable || Number(billableRate) > 0,
      billableRate,
    };
  };

  // QuickFind passes (selectedId: string, selectedItem?: { id, name, price?, description?, ... } from SFO or traits.sale); legacy quickfills pass e.selectedItem
  const handleServiceChange = (
    valueOrEvent:
      | string
      | {
          selectedItem?: {
            localId: string;
            fullName: string;
            traits?: {
              sale?: {
                billable?: boolean;
                price?: number;
                description?: string;
              };
            };
          };
        },
    selectedItem?: {
      id?: string;
      name?: string;
      fullName?: string;
      price?: number | null;
      description?: string | null;
      traits?: { sale?: { price?: number; description?: string } };
    },
  ) => {
    const isQuickFindSignature = typeof valueOrEvent === 'string';
    const id = isQuickFindSignature
      ? valueOrEvent
      : valueOrEvent?.selectedItem?.localId;
    const name = isQuickFindSignature
      ? selectedItem?.name ?? selectedItem?.fullName ?? ''
      : valueOrEvent?.selectedItem?.fullName ?? '';
    const price = isQuickFindSignature
      ? selectedItem?.price ?? selectedItem?.traits?.sale?.price ?? 0
      : valueOrEvent?.selectedItem?.traits?.sale?.price ?? 0;
    const description = isQuickFindSignature
      ? selectedItem?.description ??
        selectedItem?.traits?.sale?.description ??
        ''
      : valueOrEvent?.selectedItem?.traits?.sale?.description ?? '';

    track(trackingPoints.SERVICE);
    const isCurrentRowBreak = isBreakRow(currentRow?.timeAgainst);
    // Read live teamMember at dispatch time to avoid stale closures —
    // setTeamBillableDetails may have updated billable/billableRate after
    // this component last rendered.
    const liveTeamMember = selectTeamMember(store.getState());
    // Service with a price → use service rate.
    // Service with no price (or clearing service) → fall back to employee rate.
    const billableInfo =
      id && price && price > 0
        ? { billable: true, billableRate: String(price) }
        : getBillableInfo(price, liveTeamMember);

    const baseMetaInfo = getLiveCellMetaInfo(
      selectWeeklyTimeEntriesMap(store.getState()),
      selectedCell,
      currentCell,
    );

    const newValue: Partial<timeEntryDetails> = id
      ? {
          metaInfo: {
            ...baseMetaInfo,
            service: {
              id,
              name,
              price,
              description,
            },
          },
          ...(isCurrentRowBreak ? {} : { billableInfo }),
        }
      : {
          metaInfo: {
            ...baseMetaInfo,
            service: undefined,
          },
          ...(isCurrentRowBreak ? {} : { billableInfo }),
        };

    if (
      currentCellNotes &&
      currentCellServiceDescription !== currentCellNotes
    ) {
      setNotesToOverride(description || '');
    } else if (id) {
      newValue.notes = description || '';
    } else {
      newValue.notes = '';
    }

    if (selectedCell) {
      dispatch(
        updateCell({
          rowId: selectedCell.rowId,
          dayIdx: selectedCell.dayIdx,
          value: newValue,
        }),
      );
    }

    updateLabel?.('service', name || '');
  };

  const handleOverwriteNotesChanges = () => {
    if (selectedCell) {
      dispatch(
        updateCell({
          rowId: selectedCell.rowId,
          dayIdx: selectedCell.dayIdx,
          value: { notes: notesToOverride || '' },
        }),
      );
    }
    setNotesToOverride(null);
  };

  const widgetId = isOTX
    ? 'time-tracking-ui/quickFind'
    : 'qbo-quickfills-ui/quickfills';

  return (
    <DropdownOverlayContainer data-testid="service-field">
      {isOTX ? (
        <Widget
          widgetId={widgetId}
          dropdownType="service"
          value={serviceValue}
          displayName={serviceName}
          disabled={disabled}
          addNew={!isWorkforceUser}
          onChange={handleServiceChange}
          placeholder={intl.formatMessage({
            id: 'weekly.time.entry.service.placeholder',
          })}
          label={
            intl.formatMessage({
              id: 'weekly.time.entry.service.label',
            }) + (isServiceRequired ? '*' : '')
          }
          autoSelect={isServiceRequired}
          autoSelectKey={
            selectedCell && `${selectedCell.rowId}-${selectedCell.dayIdx}`
          }
          width={width}
          errorText={error}
          sandbox={sandbox}
          assignmentFilters={assignmentFilters}
          customerId={customerId}
          projectId={projectId}
          timeForEntityId={workerId}
          preloadedServiceOptions={preloadedServiceOptions}
          onSearchService={onSearchService}
          hasMoreService={hasMoreService}
          loadMoreService={loadMoreService}
        />
      ) : (
        <Widget
          widgetId={widgetId}
          type="productService"
          subTypes={['SERVICE', 'NONINVENTORY']}
          value={serviceValue}
          inputValue={serviceName}
          disabled={disabled}
          addNew={!isWorkforceUser}
          onChange={handleServiceChange}
          placeholder={intl.formatMessage({
            id: 'weekly.time.entry.service.placeholder',
          })}
          label={
            intl.formatMessage({
              id: 'weekly.time.entry.service.label',
            }) + (companySettings?.serviceItemRequired ? '*' : '')
          }
          width={width}
          errorText={error}
        />
      )}
      <ConfirmationModal
        open={notesToOverride !== null}
        setOpen={() => setNotesToOverride(null)}
        onYesClick={handleOverwriteNotesChanges}
      >
        <StyledDescriptionConfirmationMessage>
          {intl.formatMessage({
            id: 'weekly.time.entry.notes.description.changes.content',
          })}
        </StyledDescriptionConfirmationMessage>
      </ConfirmationModal>
    </DropdownOverlayContainer>
  );
};
