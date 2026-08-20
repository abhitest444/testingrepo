import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { B2 } from '@ids-ts/typography';
import { IconControl } from '@ids-ts/icon-control';
import { MenuItem } from '@ids-ts/menu';
import { Copy, Paste, Plus, Delete, Refresh } from '@design-systems/icons';
import { useTracking } from '@payroll/quicksand';
import { useSubmitTimeDatesContext } from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';
import { useAppDispatch, useAppSelector } from '../../store';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import { setClipboard } from '../../store/contextMenuSlice';
import {
  updateCell,
  addRow,
  deleteRow,
  clearCell,
} from '../../store/timeEntryGridSlice';
import type {
  ContextMenuContext,
  ContextMenuState,
} from '../../store/contextMenuSlice';
import {
  selectTimesheetRows,
  selectWeeklyTimeEntriesMap,
  selectMaxApprovedDate,
} from '../../store/selectors';
import {
  createEmptyRow,
  isWeeklyCellLocked,
  isWeeklyRowLocked,
} from '../../utils/helpers';
import WeeklySuperSearch from './WeeklySuperSearch';

// Detect operating system for cross-platform keyboard shortcuts
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const TOUR_POPOVER_SELECTOR = '[data-tour-popover="true"]';

interface WeeklyTimeEntryContextMenuProps {
  visible: boolean;
  context: ContextMenuContext | null;
  onClose: () => void;
  currentWeek: any;
}

const StyledContextMenu = styled.div<{ y: number; x?: number }>`
  position: fixed;
  top: ${({ y }) => y}px;
  left: ${({ x }) => x}px;
  z-index: 9999;
  min-width: 300px;
  background: var(--color-container-background-primary);
  border-radius: var(
    --radius-container-overlay
  ); /* (SemanticContextMatchOnly) */
  box-shadow: var(--elevation-level-2) var(--color-shadow);
  border: 1px solid var(--color-container-border-tertiary);
  padding: 0;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const StyledMenuItem = styled(MenuItem)`
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 100%;
  padding: 5px !important;

  &:hover {
    background: var(
      --color-action-passive-subtle-hover
    ); /* (SemanticContextMatchOnly) */
  }

  &:active {
    background: var(
      --color-action-passive-subtle-active
    ); /* (SemanticContextMatchOnly) */
  }

  &[disabled] {
    color: var(--color-text-disabled); /* (SemanticContextMatchOnly) */
    cursor: not-allowed;
    background: none;
  }

  & li {
    display: flex !important;
    flex-direction: row;
    flex: 1;
  }
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
`;

const Label = styled(B2)`
  color: var(--color-text-primary);
`;

const Shortcut = styled.span`
  color: var(--color-text-secondary); /* (SemanticContextMatchOnly) */
  margin-left: auto;
  align-self: center;
`;

export const WeeklyTimeEntryContextMenu: React.FC<
  WeeklyTimeEntryContextMenuProps
> = ({ visible, context, onClose, currentWeek }) => {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const rows = useAppSelector(selectTimesheetRows);
  const weeklyTimeEntriesMap = useAppSelector(selectWeeklyTimeEntriesMap);
  const maxApprovedDate = useAppSelector(selectMaxApprovedDate);
  const { minSelectableDate, isSubmitTimeEnabled } =
    useSubmitTimeDatesContext();
  const clipboard = useAppSelector(
    (state) => (state.contextMenu as ContextMenuState).clipboard,
  );

  useEffect(() => {
    if (!visible) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (ref.current && ref.current.contains(target)) return;
      const tourPopover = document.querySelector(TOUR_POPOVER_SELECTOR);
      if (tourPopover && tourPopover.contains(target)) return;
      onClose();
    };

    document.addEventListener('mousedown', handleClick);
    // eslint-disable-next-line consistent-return
    return () => document.removeEventListener('mousedown', handleClick);
  }, [visible, onClose]);

  if (!visible || !context) return null;

  const { rowId, dayIdx, x, y, menuType } = context;

  if (menuType === 'superSearch') {
    const safeRowId = rowId || '';
    const row = weeklyTimeEntriesMap[safeRowId];
    return (
      <StyledContextMenu
        ref={ref}
        y={y + 10}
        onContextMenu={(e) => e.preventDefault()}
        data-testid="super-search-context-menu"
      >
        <WeeklySuperSearch
          rowId={safeRowId}
          value={row?.timeAgainst || { type: null, id: null }}
          onSelect={onClose}
        />
      </StyledContextMenu>
    );
  }

  // Check if the current cell is locked (on or before the week's max approved date)
  const row = rowId ? weeklyTimeEntriesMap[rowId] : null;
  const cell = row && dayIdx != null ? row.timeEntries[dayIdx] : null;
  const isRowLocked = row
    ? isWeeklyRowLocked(
        row.hasApprovedEntries,
        row.isTimeOffRow,
        row.timeEntries,
        minSelectableDate,
        isSubmitTimeEnabled,
      )
    : false;
  const isCellLockedStatus = isWeeklyCellLocked(
    cell?.date,
    maxApprovedDate,
    row?.isTimeOffRow,
    minSelectableDate,
    isSubmitTimeEnabled,
  );

  const menuItems = [
    {
      icon: Copy,
      label: 'Copy entry',
      shortcut: isMac ? 'Cmd + C' : 'Ctrl + C',
      onClick: () => {
        track(trackingPoints.COPY);
        if (rowId == null || dayIdx == null) return;
        const row = weeklyTimeEntriesMap[rowId];
        const cell = row?.timeEntries[dayIdx];
        if (cell) {
          // Copy cell data but exclude fields that shouldn't be copied
          const {
            timeEntryId,
            date,
            operation,
            originalValues,
            ...copyableData
          } = cell;
          dispatch(setClipboard({ value: copyableData }));
        }
        onClose();
      },
    },
    {
      icon: Paste,
      label: 'Paste entry',
      shortcut: isMac ? 'Cmd + V' : 'Ctrl + V',
      disabled: !clipboard || isCellLockedStatus, // Disable paste for locked cells
      onClick: () => {
        track(trackingPoints.PASTE);
        if (rowId == null || dayIdx == null || !clipboard) return;
        dispatch(updateCell({ rowId, dayIdx, value: { ...clipboard.value } }));
        onClose();
      },
    },
    {
      icon: Plus,
      label: 'Insert 1 row below',
      shortcut: isMac ? 'Cmd + Shift + +' : 'Ctrl + Shift + +',
      onClick: () => {
        track(trackingPoints.INSERT_ROW_BELOW);
        if (rowId == null) return;
        const newRow = createEmptyRow(currentWeek);
        dispatch(addRow({ row: newRow, afterRowId: rowId }));
        onClose();
      },
    },
    {
      icon: Delete,
      label: 'Delete 1 row',
      shortcut: 'Shift + Delete',
      disabled: isRowLocked, // Disable row deletion for locked rows
      onClick: () => {
        track(trackingPoints.CLEAR_ROW);
        if (rowId == null) return;
        dispatch(deleteRow({ rowId }));
        onClose();
      },
    },
    {
      icon: Refresh,
      label: 'Clear cell',
      shortcut: 'Delete',
      disabled: isCellLockedStatus, // Disable clear for locked cells
      onClick: () => {
        track(trackingPoints.CLEAR_CELL);
        if (dayIdx == null || rowId == null) return;
        dispatch(clearCell({ rowId, dayIdx }));
        onClose();
      },
    },
  ];

  return (
    <StyledContextMenu
      ref={ref}
      onContextMenu={(e) => e.preventDefault()}
      y={y}
      x={x}
    >
      {menuItems.map(({ icon: Icon, label, shortcut, disabled, onClick }) => (
        <StyledMenuItem key={label} onClick={onClick} disabled={disabled}>
          <LeftGroup>
            <IconControl size="medium">
              <Icon />
            </IconControl>
            <Label>{label}</Label>
          </LeftGroup>
          <Shortcut>{shortcut}</Shortcut>
        </StyledMenuItem>
      ))}
    </StyledContextMenu>
  );
};
