import React, { useState, ChangeEvent } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import TextArea from '@ids-ts/textarea';
import { B2 } from '@ids-ts/typography';
import { MAX_NOTES_LENGTH } from 'src/js/common/constants';
import { useSubmitTimeDatesContext } from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';
import { useWeeklyTimeTrackingPoints } from '../hooks/useWeeklyTimeTrackingPoints';
import { WeeklyServiceField } from './commons/WeeklyServiceField';
import { WeeklyClassField } from './commons/WeeklyClassField';
import { WeeklyLocationField } from './commons/WeeklyLocationField';
import { WeeklyBillableField } from './commons/WeeklyBillableField';
import { WeeklyDateNavigation } from './commons/WeeklyDateNavigation';
import { WeeklyCustomFields } from './commons/WeeklyCustomFields';
import { WeeklyDimensions } from './commons/WeeklyDimensions';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectTimesheetRows,
  selectSelectedCell,
  selectHideTimeEntryFields,
  selectWeeklyTimeEntriesMap,
  selectRowOrder,
  selectCompanySettings,
  selectMaxApprovedDate,
  selectTeamMember,
  selectCustomFields,
} from '../store/selectors';
import { updateCell } from '../store/timeEntryGridSlice';
import { labelPreferenceRef } from '../../common/types';
import { isBreakRow, isWeeklyCellLocked } from '../utils/helpers';
import { useWTERowFieldVisibility } from '../hooks/useWTERowFieldVisibility';

const NotesTextArea = styled(TextArea)`
  width: 100% !important;
  && textarea {
    resize: none !important;
    min-height: 80px;
    min-width: 200px;
  }
`;

const StyledPannelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  height: 100%;

  & .qbo-widgets-ui-baseQuickfill {
    width: 100% !important;
  }
`;

const NoSelectionOverlay = styled.div`
  position: absolute;
  inset: 0px;
  background: var(--color-container-background-primary);
  display: flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  z-index: 2;
`;

interface WeeklyTimeEntryPanelContentProps {
  fieldErrors?: {
    [cellKey: string]: {
      service?: string;
      class?: string;
      location?: string;
      notes?: string;
      customFields?: { [fieldId: string]: string };
      dimensions?: { [definitionId: string]: string };
    };
  };
  labelPreference?: labelPreferenceRef;
}

export const WeeklyTimeEntryPanelContent: React.FC<
  WeeklyTimeEntryPanelContentProps
> = ({ fieldErrors = {}, labelPreference }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const selectedCell = useAppSelector(selectSelectedCell);
  const weeklyTimeEntriesMap = useAppSelector(selectWeeklyTimeEntriesMap);
  const companySettings = useAppSelector(selectCompanySettings);
  const maxApprovedDate = useAppSelector(selectMaxApprovedDate);
  const { minSelectableDate, isSubmitTimeEnabled } =
    useSubmitTimeDatesContext();
  const teamMember = useAppSelector(selectTeamMember);
  const allCustomFields = useAppSelector(selectCustomFields);
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const [notesError, setNotesError] = useState<string | null>(null);

  // For WTE, we always treat as OTX (true) for consistency with existing quickfills
  const isOTX = true;

  // Get the current row data to check if it's a break
  const currentRow = selectedCell
    ? weeklyTimeEntriesMap[selectedCell.rowId]
    : null;

  // Check if the current row is a break (PAID or UNPAID time category)
  const isCurrentRowBreak = isBreakRow(currentRow?.timeAgainst);

  // Use selected cell or display cell using hashmap approach
  const displayCell = selectedCell
    ? weeklyTimeEntriesMap[selectedCell.rowId]?.timeEntries[selectedCell.dayIdx]
    : null;

  // Check if the CURRENT CELL is locked (not the entire row)
  const isCurrentCellLocked = isWeeklyCellLocked(
    displayCell?.date,
    maxApprovedDate,
    currentRow?.isTimeOffRow,
    minSelectableDate,
    isSubmitTimeEnabled,
  );

  // Get current cell errors
  const currentCellErrors = selectedCell
    ? fieldErrors[`${selectedCell.rowId}-${selectedCell.dayIdx}`] || {}
    : {};

  // Get customer id from the current row (WTE uses customer id only, even when type is project)
  const customerId = currentRow?.timeAgainst?.id || null;
  const projectId = null;
  const workerId = teamMember?.id || null;

  // Get field visibility and options for the current row
  // This reads from Redux state populated by WTEAssignmentManager
  const {
    standardFieldsVisibility,
    visibleCustomFieldIds,
    getServiceOptions,
    getCustomFieldOptions,
    shouldUseAssignments,
  } = useWTERowFieldVisibility({
    rowId: selectedCell?.rowId || '',
    companySettings: companySettings || {},
  });

  const handleNotesChange = (value: string) => {
    if (!selectedCell) return;

    // Clear error if notes are within limit
    if (value.length <= MAX_NOTES_LENGTH) {
      setNotesError(null);
    }

    if (value.length > MAX_NOTES_LENGTH) {
      setNotesError(intl.formatMessage({ id: 'max.length.error' }));
      return;
    }

    dispatch(
      updateCell({
        rowId: selectedCell.rowId,
        dayIdx: selectedCell.dayIdx,
        value: { notes: value },
      }),
    );
  };

  return (
    <StyledPannelWrapper data-testid="weekly-time-entry-details">
      {!selectedCell ? (
        <NoSelectionOverlay>
          <B2>
            {intl.formatMessage({
              id: 'weekly.time.entry.panel.select.cell.message',
            })}
          </B2>
        </NoSelectionOverlay>
      ) : (
        <>
          <WeeklyDateNavigation displayCell={displayCell} />

          {/* Only show fields other than notes if it's not a break row */}
          {!isCurrentRowBreak && (
            <>
              {/* Service Field - controlled by assignments (if enabled) or company settings */}
              {standardFieldsVisibility.service && (
                <WeeklyServiceField
                  disabled={isCurrentCellLocked}
                  displayCell={displayCell}
                  error={currentCellErrors.service}
                  isOTX={isOTX}
                />
              )}

              {/* Class Field - controlled by assignments (if enabled) or company settings */}
              {standardFieldsVisibility.class && (
                <WeeklyClassField
                  disabled={isCurrentCellLocked}
                  displayCell={displayCell}
                  error={currentCellErrors.class}
                  isOTX={isOTX}
                />
              )}

              {/* Location Field - controlled by assignments (if enabled) or company settings */}
              {standardFieldsVisibility.location && (
                <WeeklyLocationField
                  disabled={isCurrentCellLocked}
                  displayCell={displayCell}
                  error={currentCellErrors.location}
                  labelPreference={labelPreference}
                  isOTX={isOTX}
                />
              )}

              {/* Billable Field - row visibility by assignments/settings; bill rate = billable checked + company setting only (no assignment) */}
              {standardFieldsVisibility.billable && (
                <WeeklyBillableField
                  disabled={isCurrentCellLocked}
                  displayCell={displayCell}
                />
              )}

              {/* Custom Fields - filtered by assignments (if enabled) */}
              <WeeklyCustomFields
                disabled={isCurrentCellLocked}
                displayCell={displayCell}
                fieldErrors={currentCellErrors.customFields}
                visibleCustomFieldIds={visibleCustomFieldIds}
                getCustomFieldOptions={getCustomFieldOptions}
                shouldUseAssignments={shouldUseAssignments}
              />

              {/* Custom Dimensions - gated (IES + Time Elite + flag/experiment) */}
              <WeeklyDimensions
                disabled={isCurrentCellLocked}
                displayCell={displayCell}
                fieldErrors={currentCellErrors.dimensions}
              />
            </>
          )}

          {/* Notes field - always shown, even for breaks */}
          <NotesTextArea
            data-testid="notes-field"
            label={
              intl.formatMessage({
                id: 'weekly.time.entry.panel.notes.label',
              }) +
              (companySettings?.timeSheetEntryMakesNotesRequiredEnabled &&
              !isCurrentRowBreak
                ? '*'
                : '')
            }
            placeholder=""
            value={displayCell?.notes || ''}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              track(trackingPoints.NOTES);
              handleNotesChange(e.target.value);
            }}
            disabled={!selectedCell || isCurrentCellLocked}
            errorText={notesError || currentCellErrors.notes}
            maxLength={MAX_NOTES_LENGTH}
          />
        </>
      )}
    </StyledPannelWrapper>
  );
};

export default WeeklyTimeEntryPanelContent;
