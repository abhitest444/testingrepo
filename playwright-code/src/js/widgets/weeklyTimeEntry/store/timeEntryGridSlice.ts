import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { TimeForType } from '../types';
import { DataAccess_ContactType } from '../../../../__generated__/oigql/graphql';
import {
  isBreakType,
  isBreakRow,
  processTimeCategoryChange,
} from '../utils/helpers';

/**
 * Type definition for different types of time tracking targets
 * Represents what time can be tracked against (customers, projects, breaks, etc.)
 */

/**
 * Interface representing the details of a single day's time entry
 * Contains all the data needed for a specific day in the weekly grid
 */
export interface timeEntryDetails {
  timeEntryId: string; // Unique identifier for the time entry
  date: string; // Date in YYYY-MM-DD format

  // New time range fields and entry method
  startTime?: string; // Start time in HH:mm or ISO string
  endTime?: string; // End time in HH:mm or ISO string

  // Approval Status for the time entry
  isApproved: boolean;

  // Whether this is an external time off entry (isTimeOffEntry with timeOffRequestExternalId)
  // These entries should be excluded from the max approved date calculation
  isExternalTimeOff?: boolean;

  // Time tracking
  hours?: number; // Hours worked on this day

  // Metadata for service, class, and location information
  metaInfo?: {
    service?: {
      id: string;
      name: string;
      price?: number;
      description?: string;
    }; // Service item associated with the entry
    class?: { id: string; name: string }; // Class/category for the entry
    location?: { id: string; name: string }; // Department/location for the entry
  };

  // Billing information for billable time entries
  billableInfo?: {
    billable: boolean; // Whether this time is billable
    billableRate?: string; // Hourly rate for billing calculations
  };

  // Notes
  notes?: string; // Additional notes for the time entry

  // Custom fields - values for this specific time entry
  customFields?: Array<{
    id: string;
    name: string;
    value?: string;
    optionID?: string; // For dropdown fields - the selected option's ID
  }>;

  // Custom dimensions - selected option per dimension definition for this entry
  dimensions?: Array<{
    id: string; // Dimension definition id
    name?: string; // Dimension display label (for change tracking / payload)
    value?: string; // Selected option's display label
    optionID?: string; // Selected option's id (dimensionValueId on save)
    // The value active at load-time was the worker default. Preserved so an
    // unchanged removed-default (optionID '') echoes back as ['-1'] rather than
    // degrading to []. Mirrors DimensionValue.activeValueIsDefault.
    activeValueIsDefault?: boolean;
  }>;

  // Change tracking
  operation?: 'CREATE' | 'UPDATE' | 'DELETE'; // CRUD operation type

  // Original values tracking - stores the values when loaded from backend
  originalValues?: {
    hours?: number;
    notes?: string;
    startTime?: string;
    endTime?: string;
    metaInfo?: {
      service?: { id: string; name: string };
      class?: { id: string; name: string };
      location?: { id: string; name: string };
    };
    billableInfo?: {
      billable: boolean;
      billableRate?: string;
    };
    customFields?: Array<{
      id: string;
      name: string;
      value?: string;
      optionID?: string; // For dropdown fields - the selected option's ID
    }>;
    dimensions?: Array<{
      id: string;
      name?: string;
      value?: string;
      optionID?: string;
      activeValueIsDefault?: boolean;
    }>;
  };
}

/**
 * Interface representing what time is being tracked against
 * Can be a customer, project, break, time off, or other time tracking target
 */
export interface TimeAgainst {
  type:
    | DataAccess_ContactType
    | 'PROJECT'
    | 'PAID'
    | 'UNPAID'
    | 'TIME_OFF'
    | null; // Type of tracking target
  id: string | null; // Unique identifier for the target
  displayName?: string | null;
}

/**
 * Interface representing a complete row in the timesheet grid
 * Contains all days for a week and calculated totals
 */
export interface TimesheetRow {
  rowId: string; // Unique identifier for this specific row
  timeAgainst: TimeAgainst; // What this row tracks time against
  timeEntries: {
    [dayIndex: number]: timeEntryDetails; // 0-6 for Mon-Sun, maps day index to day details
  };
  totalHours: number; // Total hours for the week across all days
  billableTotal: number; // Total billable amount for the week
  hasApprovedEntries: boolean; // Whether any time entries in this row have approval status 'APPROVED'
  isTimeOffRow?: boolean; // Whether this row represents a time off entry (always locked, not editable)
  deleted?: boolean; // Flag to mark row as deleted but keep in state for save operations
}

/**
 * Interface representing a team member (employee or vendor)
 * Used for tracking time for different team members
 */
export interface TeamMember {
  id: string; // Unique identifier for the team member
  name: string; // Display name of the team member
  type: TimeForType; // Type of team member
  billable?: boolean;
  billableRate?: number;
}

/**
 * Interface representing a date range for the weekly view
 * Defines the start and end dates for the current week
 */
interface DateRange {
  start: string; // Start date in YYYY-MM-DD format
  end: string; // End date in YYYY-MM-DD format
}

/**
 * Main state interface for the time entry grid using object-based approach
 * Contains all data and UI state for the weekly time entry widget
 */
export interface TimeEntryGridState {
  // Data state - Object-based storage for better serialization and stable identification
  weeklyTimeEntries: { [rowId: string]: TimesheetRow }; // Object of rowId to TimesheetRow
  rowOrder: string[]; // Array of rowIds in display order
  teamMember: TeamMember | null; // Currently selected team member
  dateRange: DateRange; // Current week's date range

  // Loading and error state
  loading: boolean; // Loading state for time entry operations
  error: string | null; // Error message if any operation fails

  // UI state
  selected: { rowId: string; dayIdx: number } | null; // Currently selected cell using rowId
  firstEditedCells: {
    [rowId: string]: {
      dayIndex: number;
      cellState: timeEntryDetails;
    };
  }; // Tracks the first edited cell in each row for auto-population

  // Tooltip state
  showSelectTeamMemberTooltip: boolean; // Controls visibility of team member selection tooltip

  // Team member dropdown ready state
  isTeamMemberDropdownReady: boolean; // Indicates when the team member dropdown is ready for tour
  isTimeCategorySelectorReady?: boolean; // Indicates when time category selector is rendered for tour

  // Feature flag state - QB_TIME_TRACKING_UI_R2_RELEASE (controls team member dropdown)
  isQuickFindEnabled: boolean; // Indicates if QuickFind feature is enabled for team member dropdown
  isQuickFindSettled: boolean; // Indicates if QuickFind feature flag has settled

  // State for modal seeking confirmation of conversion of start-end time entry to duration time entry
  confirmTimeEntryConversionModal: {
    isOpen: boolean;
    rowId: string | null;
    dayIdx: number | null;
  };
}

/**
 * Helper function to create an empty row with proper structure
 * Initializes all 7 days with default values for a new timesheet row
 *
 * @param index - Index for generating unique row identifiers
 * @param startDate - Optional start date for the week, defaults to current week
 * @returns A new TimesheetRow with empty day details
 */
const createEmptyRow = (index: number, startDate?: string): TimesheetRow => {
  const timeEntries: { [dayIndex: number]: timeEntryDetails } = {};
  const weekStart = startDate ? dayjs(startDate) : dayjs().startOf('week');
  for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
    timeEntries[dayIdx] = {
      timeEntryId: '',
      date: weekStart.add(dayIdx, 'day').format('YYYY-MM-DD'),
      startTime: undefined,
      endTime: undefined,
      hours: 0,
      notes: '',
      metaInfo: undefined,
      billableInfo: undefined,
      isApproved: false,
      customFields: [],
    };
  }
  return {
    rowId: crypto.randomUUID(),
    timeAgainst: {
      type: null,
      id: null,
      displayName: null,
    },
    timeEntries,
    totalHours: 0,
    billableTotal: 0,
    hasApprovedEntries: false,
  };
};

/**
 * Helper function to create an empty row with proper structure,
 * but only for visible days.
 *
 * @param index - Index for generating unique row identifiers
 * @param startDate - Optional start date for the week, defaults to current week
 * @param visibleDays - Array of visible day indices to create
 * @returns A new TimesheetRow with empty day details for visible days
 */
const createEmptyRowForVisibleDays = (
  index: number,
  startDate?: string,
  visibleDays?: number[],
  teamMember?: TeamMember | null,
): TimesheetRow => {
  const timeEntries: { [dayIndex: number]: timeEntryDetails } = {};
  const weekStart = startDate ? dayjs(startDate) : dayjs().startOf('week');

  // Use visible days if provided, otherwise default to all days for backward compatibility
  const daysToCreate = visibleDays || [0, 1, 2, 3, 4, 5, 6];

  const teamBillable =
    teamMember?.billableRate != null
      ? {
          billable: teamMember.billable ?? false,
          billableRate: teamMember.billableRate.toString(),
        }
      : undefined;

  daysToCreate.forEach((dayIdx) => {
    timeEntries[dayIdx] = {
      timeEntryId: '',
      date: weekStart.add(dayIdx, 'day').format('YYYY-MM-DD'),
      startTime: undefined,
      endTime: undefined,
      hours: 0,
      notes: '',
      metaInfo: undefined,
      billableInfo: teamBillable,
      isApproved: false,
      customFields: [],
    };
  });

  return {
    rowId: crypto.randomUUID(),
    timeAgainst: {
      type: null,
      id: null,
      displayName: null,
    },
    timeEntries,
    totalHours: 0,
    billableTotal: 0,
    hasApprovedEntries: false,
  };
};

/**
 * Back-fills team-member billable info onto cells that don't have a complete
 * billable rate yet. Used both right after `setTeamBillableDetails` resolves
 * (in case `mergeTimeEntries` ran first and seeded incomplete cells) and
 * right after `mergeTimeEntries` itself (in case `setTeamBillableDetails`
 * resolved first). Skips break rows, saved entries, and cells with their own
 * service rate — those must never inherit the team member's rate.
 */
const backfillTeamBillable = (state: TimeEntryGridState) => {
  if (!state.teamMember) return;

  Object.keys(state.weeklyTimeEntries).forEach((rowId) => {
    const row = state.weeklyTimeEntries[rowId];
    if (!row?.timeEntries || isBreakRow(row.timeAgainst)) return;
    Object.keys(row.timeEntries).forEach((dayIdx) => {
      const dayIndex = parseInt(dayIdx, 10);
      const cell = row.timeEntries[dayIndex];
      if (
        cell &&
        !cell.timeEntryId &&
        !cell.metaInfo?.service &&
        (!cell.billableInfo ||
          cell.billableInfo.billable === undefined ||
          !cell.billableInfo.billableRate ||
          cell.billableInfo.billableRate === '0')
      ) {
        row.timeEntries[dayIndex] = {
          ...cell,
          billableInfo: {
            ...cell.billableInfo,
            billable: state.teamMember?.billable ?? false,
            billableRate: state.teamMember?.billableRate?.toString(),
          },
        };
      }
    });
  });
};

// Initial state with 6 default empty rows using object-based approach
const initialState: TimeEntryGridState = {
  weeklyTimeEntries: {},
  rowOrder: [],
  teamMember: null,
  dateRange: { start: '', end: '' },
  selected: null, // No cell selected by default
  firstEditedCells: {},
  error: null,
  loading: false,
  showSelectTeamMemberTooltip: false,
  isTeamMemberDropdownReady: false,
  isTimeCategorySelectorReady: false,
  isQuickFindEnabled: false,
  isQuickFindSettled: false,
  confirmTimeEntryConversionModal: {
    isOpen: false,
    rowId: null,
    dayIdx: null,
  },
};

// Initialize with 6 default rows - use all days for initial state since visible days aren't set yet
for (let i = 0; i < 6; i += 1) {
  const row = createEmptyRow(i);
  initialState.weeklyTimeEntries[row.rowId] = row;
  initialState.rowOrder.push(row.rowId);
}

/**
 * Utility function to calculate row totals for hours and billable amounts
 * Only calculates totals for visible days to match UI display
 * Excludes cells marked for deletion from calculations
 *
 * @param timeentries - Object containing day details for all 7 days
 * @param visibleDays - Array of visible day indices (optional - defaults to all days for backward compatibility)
 * @returns Object with total hours and billable total
 */
const calculateRowTotals = (
  timeentries: { [dayIndex: number]: timeEntryDetails },
  visibleDays?: number[],
) => {
  let total = 0;
  let billableTotal = 0;

  // If visibleDays is provided, only calculate for those days
  // Otherwise, use all days for backward compatibility
  const daysToCalculate = visibleDays || [0, 1, 2, 3, 4, 5, 6];

  daysToCalculate.forEach((dayIdx) => {
    const day = timeentries[dayIdx];
    if (!day) return;

    // Skip cells marked for deletion
    if (day.operation === 'DELETE') {
      return;
    }

    const hours = day.hours || 0;
    total += hours;

    if (day.billableInfo?.billable && day.billableInfo?.billableRate) {
      const rate = parseFloat(day.billableInfo.billableRate) || 0;
      billableTotal += hours * rate;
    }
  });

  return { total, billableTotal };
};

/**
 * Redux slice for managing time entry grid state using hashmap-based approach
 * Contains all actions for manipulating time entries, UI state, and grid operations
 */
const timeEntryGridSlice = createSlice({
  name: 'timeEntryGrid',
  initialState,
  reducers: {
    /**
     * Sets the currently selected team member
     * @param state - Current grid state
     * @param action - Payload containing team member information
     */
    setTeamMember(state, action: PayloadAction<TeamMember>) {
      const prev = state.teamMember;
      const isSameMember = prev && prev.id === action.payload.id;
      state.teamMember = isSameMember
        ? { ...prev, ...action.payload }
        : action.payload;
      // Hide the tooltip when a team member is selected
      state.showSelectTeamMemberTooltip = false;
    },

    setTeamBillableDetails(
      state,
      action: PayloadAction<{ billable: boolean; billableRate: number }>,
    ) {
      if (state.teamMember) {
        state.teamMember = {
          ...state.teamMember,
          ...action.payload,
        };

        // Re-seed empty cells that mergeTimeEntries may have missed due to
        // a timing race: if mergeTimeEntries ran before this fetch resolved,
        // cells were seeded with incomplete billable info (e.g. {billable: false}
        // with no rate). Now that we have the real billable details, back-fill
        // any cell that still lacks a complete billable rate.
        backfillTeamBillable(state);
      }
    },

    /**
     * Sets the team member dropdown ready state
     * @param state - Current grid state
     * @param action - Payload containing ready state boolean
     */
    setTeamMemberDropdownReady(state, action: PayloadAction<boolean>) {
      state.isTeamMemberDropdownReady = action.payload;
    },

    /**
     * Sets the time category selector ready state
     * @param state - Current grid state
     * @param action - Payload containing ready state boolean
     */
    setTimeCategorySelectorReady(state, action: PayloadAction<boolean>) {
      state.isTimeCategorySelectorReady = action.payload;
    },

    /**
     * Sets the QuickFind feature flag enabled state
     * @param state - Current grid state
     * @param action - Payload containing enabled state boolean
     */
    setQuickFindEnabled(state, action: PayloadAction<boolean>) {
      state.isQuickFindEnabled = action.payload;
    },

    /**
     * Sets the QuickFind feature flag settled state
     * @param state - Current grid state
     * @param action - Payload containing settled state boolean
     */
    setQuickFindSettled(state, action: PayloadAction<boolean>) {
      state.isQuickFindSettled = action.payload;
    },

    /**
     * Sets the date range for the current week
     * @param state - Current grid state
     * @param action - Payload containing start and end dates
     */
    setDateRange(state, action: PayloadAction<DateRange>) {
      state.dateRange = action.payload;
    },

    /**
     * Toggles the confirm time entry conversion modal with optional data
     * @param state - Current grid state
     * @param action - Payload containing modal state and optional data
     */
    toggleConfirmTimeEntryConversionModal(
      state,
      action: PayloadAction<{
        isOpen: boolean;
        rowId?: string;
        dayIdx?: number;
      }>,
    ) {
      state.confirmTimeEntryConversionModal.isOpen = action.payload.isOpen;
      state.confirmTimeEntryConversionModal.rowId =
        action.payload.rowId || null;
      state.confirmTimeEntryConversionModal.dayIdx =
        action.payload.dayIdx !== undefined ? action.payload.dayIdx : null;
    },

    /**
     * Selects a specific cell in the grid using rowId
     * @param state - Current grid state
     * @param action - Payload containing rowId and day index
     */
    selectCell(
      state,
      action: PayloadAction<{ rowId: string; dayIdx: number }>,
    ) {
      state.selected = action.payload;
    },

    /**
     * Navigates to an adjacent cell based on direction
     * Handles wrapping around rows and columns
     * @param state - Current grid state
     * @param action - Payload containing direction and grid boundaries
     */
    navigateCell(
      state,
      action: PayloadAction<{
        direction: 'up' | 'down' | 'left' | 'right';
        visibleDays: number[];
        rowOrder: string[];
      }>,
    ) {
      const { direction, visibleDays, rowOrder } = action.payload;
      const currentSelected = state.selected;

      if (!currentSelected) {
        // If no cell is selected, select the first cell
        if (rowOrder.length > 0 && visibleDays.length > 0) {
          state.selected = {
            rowId: rowOrder[0],
            dayIdx: visibleDays[0],
          };
        }
        return;
      }

      const { rowId: currentRowId, dayIdx: currentDayIdx } = currentSelected;
      const currentRowIndex = rowOrder.indexOf(currentRowId);
      const currentDayIndex = visibleDays.indexOf(currentDayIdx);

      if (currentRowIndex === -1 || currentDayIndex === -1) {
        return; // Invalid current selection
      }

      let newRowIndex = currentRowIndex;
      let newDayIndex = currentDayIndex;

      switch (direction) {
        case 'up':
          newRowIndex = Math.max(0, currentRowIndex - 1);
          break;
        case 'down':
          newRowIndex = Math.min(rowOrder.length - 1, currentRowIndex + 1);
          break;
        case 'left':
          newDayIndex = Math.max(0, currentDayIndex - 1);
          break;
        case 'right':
          // If we're at the last day of the current row, move to the first day of the next row
          if (currentDayIndex === visibleDays.length - 1) {
            newRowIndex = Math.min(rowOrder.length - 1, currentRowIndex + 1);
            newDayIndex = 0; // First day of the next row
          } else {
            // Otherwise, just move to the next day in the same row
            newDayIndex = Math.min(visibleDays.length - 1, currentDayIndex + 1);
          }
          break;
        default:
          // Invalid direction, don't move
          return;
      }

      // Only update if the position actually changed
      if (newRowIndex !== currentRowIndex || newDayIndex !== currentDayIndex) {
        state.selected = {
          rowId: rowOrder[newRowIndex],
          dayIdx: visibleDays[newDayIndex],
        };
      }
    },

    /**
     * Updates a specific cell with new values
     * Handles auto-population of fields across visible days
     * Recalculates row totals after updates
     *
     * @param state - Current grid state
     * @param action - Payload containing rowId, day index, and new values
     */
    updateCell(
      state,
      action: PayloadAction<{
        rowId: string;
        dayIdx: number;
        value: Partial<timeEntryDetails>;
      }>,
    ) {
      const { rowId, dayIdx, value } = action.payload;

      const row = state.weeklyTimeEntries[rowId];
      if (!row) return;

      // Determine operation type based on timeEntryId
      const hasExistingId =
        row.timeEntries[dayIdx].timeEntryId &&
        row.timeEntries[dayIdx].timeEntryId.trim() !== '';

      // Update current cell with new values first
      const updatedCell = {
        ...row.timeEntries[dayIdx],
        ...value,
      };

      // Check if there are actual meaningful changes by comparing with original values
      const originalCell = row.timeEntries[dayIdx];
      const hasMeaningfulChanges = (() => {
        // If explicitly deleting, always consider it a change
        if (value.operation === 'DELETE') {
          return true;
        }

        // If no original values, check for meaningful data in new values
        if (!originalCell.originalValues) {
          return !!(
            (value.hours !== undefined && value.hours > 0) ||
            (value.notes !== undefined && value.notes.trim() !== '') ||
            (value.startTime !== undefined &&
              (value.startTime || '').trim() !== '') ||
            (value.endTime !== undefined &&
              (value.endTime || '').trim() !== '') ||
            (value.metaInfo &&
              (value.metaInfo.service?.id ||
                value.metaInfo.class?.id ||
                value.metaInfo.location?.id)) ||
            (value.billableInfo && value.billableInfo.billable !== undefined) ||
            (value.customFields && value.customFields.length > 0) ||
            (value.dimensions && value.dimensions.some((d) => !!d.optionID))
          );
        }

        // Compare with original values
        const original = originalCell.originalValues;

        if (value.hours !== undefined && original.hours !== value.hours) {
          return true;
        }
        if (
          value.startTime !== undefined &&
          original.startTime !== value.startTime
        ) {
          return true;
        }
        if (value.endTime !== undefined && original.endTime !== value.endTime) {
          return true;
        }

        // Compare notes
        if (value.notes !== undefined && original.notes !== value.notes) {
          return true;
        }

        // Compare metaInfo - only check id fields, not name fields
        if (value.metaInfo) {
          if (!original.metaInfo) {
            // metaInfo added where none existed (e.g. class added to entry saved without one)
            if (
              value.metaInfo.service?.id ||
              value.metaInfo.class?.id ||
              value.metaInfo.location?.id
            ) {
              return true;
            }
          } else {
            if (value.metaInfo.service?.id !== original.metaInfo.service?.id) {
              return true;
            }
            if (value.metaInfo.class?.id !== original.metaInfo.class?.id) {
              return true;
            }
            if (
              value.metaInfo.location?.id !== original.metaInfo.location?.id
            ) {
              return true;
            }
          }
        }

        // Compare billableInfo
        if (value.billableInfo) {
          if (!original.billableInfo) {
            if (value.billableInfo.billable !== undefined) {
              return true;
            }
          } else if (
            value.billableInfo.billable !== original.billableInfo.billable ||
            value.billableInfo.billableRate !==
              original.billableInfo.billableRate
          ) {
            return true;
          }
        }

        // Compare customFields
        if (value.customFields) {
          if (!original.customFields) {
            if (value.customFields.length > 0) {
              return true;
            }
          } else {
            if (value.customFields.length !== original.customFields.length) {
              return true;
            }

            for (let i = 0; i < value.customFields.length; i += 1) {
              const current = value.customFields[i];
              const originalField = original.customFields[i];
              if (
                current.id !== originalField.id ||
                current.name !== originalField.name ||
                current.value !== originalField.value
              ) {
                return true;
              }
            }
          }
        }

        // Compare dimensions (by definition id + selected option id)
        if (value.dimensions) {
          const originalDims = original.dimensions || [];
          const selected = value.dimensions.filter((d) => !!d.optionID);
          const originalSelected = originalDims.filter((d) => !!d.optionID);
          if (selected.length !== originalSelected.length) {
            return true;
          }
          for (let i = 0; i < selected.length; i += 1) {
            const current = selected[i];
            const match = originalSelected.find((d) => d.id === current.id);
            if (!match || match.optionID !== current.optionID) {
              return true;
            }
          }
        }

        return false;
      })();

      // Handle operation type - only set operation if there are actual changes
      if (value.operation === 'DELETE') {
        // User explicitly marked for deletion
        updatedCell.operation = 'DELETE';
      } else if (hasExistingId && hasMeaningfulChanges) {
        updatedCell.operation = 'UPDATE';
      } else if (hasMeaningfulChanges && value?.hours && value.hours > 0) {
        // For CREATE, require both meaningful changes AND hours > 0
        updatedCell.operation = 'CREATE';
      }

      row.timeEntries[dayIdx] = updatedCell;
      const currentCell = updatedCell;

      // Save/update the first edited cell in the row for future copying
      if (hasMeaningfulChanges) {
        const existingFirstEdit = state.firstEditedCells[rowId];

        if (!existingFirstEdit) {
          // No first edit yet, set this as the first edited cell
          state.firstEditedCells[rowId] = {
            dayIndex: dayIdx,
            cellState: { ...currentCell },
          };
        } else if (existingFirstEdit.dayIndex === dayIdx) {
          // User is editing the first edited cell, update the snapshot
          // This ensures that additional edits (like checking billable or entering rate) are captured
          state.firstEditedCells[rowId] = {
            dayIndex: dayIdx,
            cellState: { ...currentCell },
          };
        }
        // If editing a different cell, keep the existing first edit snapshot
      }

      // Update row totals after cell changes
      const { total, billableTotal } = calculateRowTotals(row.timeEntries);
      row.totalHours = total;
      row.billableTotal = billableTotal;
    },

    /**
     * Updates the time against information for a specific row
     * When time category changes, this action handles:
     * 1. Clearing fields for break entries (service, class, location, billable info, notes, custom fields)
     * 2. Marking cells with appropriate operations (CREATE/UPDATE) based on whether they have timeEntryId
     * 3. Recalculating row totals after changes
     *
     * @param state - Current grid state
     * @param action - Payload containing rowId and time against information
     */
    updateTimeAgainst(
      state,
      action: PayloadAction<{
        rowId: string;
        timeAgainst: TimeAgainst;
      }>,
    ) {
      const { rowId, timeAgainst } = action.payload;

      const row = state.weeklyTimeEntries[rowId];
      if (!row) return;

      const previousTimeAgainst = row.timeAgainst;
      row.timeAgainst = timeAgainst;

      // Check if the time category type has changed (e.g., from CUSTOMER to PAID)
      const previousType = previousTimeAgainst?.type;
      const newType = timeAgainst?.type;
      const typeChanged = previousType !== newType;

      // Check if the time against ID has changed (even within same type)
      // This handles cases like changing from one customer to another customer
      const previousId = previousTimeAgainst?.id;
      const newId = timeAgainst?.id;
      const idChanged = previousId !== newId;

      // Only process changes if either type or ID has changed
      if (typeChanged || idChanged) {
        // Determine if the new time category is a break type (PAID or UNPAID)
        const isNewBreakType = isBreakType(newType);

        // Process all cells with hours > 0 using the utility function
        Object.keys(row.timeEntries).forEach((dayIdx) => {
          const dayIndex = parseInt(dayIdx, 10);
          const cell = row.timeEntries[dayIndex];

          if (cell.hours && cell.hours > 0) {
            // Use the utility function to handle all the complex logic
            const processedCell = processTimeCategoryChange(
              cell,
              isNewBreakType,
              state.teamMember,
            );

            // Update the cell with the processed result
            row.timeEntries[dayIndex] = processedCell;
          } else if (isNewBreakType && cell.billableInfo) {
            // Cells with no hours skip processTimeCategoryChange (it only acts
            // on hours > 0), so team-member billable info seeded by addRow/
            // mergeTimeEntries would otherwise survive the switch to a break
            // type and get counted once hours are later entered.
            row.timeEntries[dayIndex] = {
              ...cell,
              billableInfo: undefined,
            };
          }
        });

        // Recalculate row totals after clearing fields or changing operations
        // This ensures the UI reflects the correct totals after time category changes
        const { total, billableTotal } = calculateRowTotals(row.timeEntries);
        row.totalHours = total;
        row.billableTotal = billableTotal;
      }
    },

    /**
     * Clears all data from a specific cell
     * Resets hours, notes, meta info, and billable info to defaults
     * Recalculates row totals after clearing
     *
     * @param state - Current grid state
     * @param action - Payload containing rowId and day index
     */
    clearCell(state, action: PayloadAction<{ rowId: string; dayIdx: number }>) {
      const { rowId, dayIdx } = action.payload;

      const row = state.weeklyTimeEntries[rowId];
      if (!row) return;

      const cell = row.timeEntries[dayIdx];
      if (!cell) return;

      // Check if this cell has a valid time entry ID (was saved to backend)
      const hasExistingId = cell.timeEntryId && cell.timeEntryId.trim() !== '';

      if (hasExistingId) {
        // Mark for deletion using operation field
        cell.operation = 'DELETE';
      } else {
        // Clear operation for unsaved entries
        cell.operation = undefined;
      }

      // Always reset cell values to defaults for UI display
      cell.hours = 0;
      cell.notes = '';
      cell.metaInfo = undefined;
      cell.billableInfo = undefined;
      cell.startTime = undefined;
      cell.endTime = undefined;
      cell.customFields = undefined;
      cell.dimensions = undefined;

      // Keep timeEntryId for saved entries so DELETE operation can be processed
      if (!hasExistingId) {
        cell.timeEntryId = '';
      }

      // Clear the selected cell state so the UI shows the static view with cleared values
      state.selected = null;

      // Update row totals after clearing
      const { total, billableTotal } = calculateRowTotals(row.timeEntries);
      row.totalHours = total;
      row.billableTotal = billableTotal;
    },

    /**
     * Adds a new row to the grid
     * Ensures all 7 days exist in the new row with proper dates
     * Can insert at a specific position or append to the end
     *
     * @param state - Current grid state
     * @param action - Payload containing the new row and optional insertion position
     */
    addRow(
      state,
      action: PayloadAction<{ row: TimesheetRow; afterRowId?: string }>,
    ) {
      const newRow = action.payload.row;
      const { afterRowId } = action.payload;

      // Ensure all 7 days exist in the timeentries object with proper dates
      const completeTimeentries = { ...newRow.timeEntries };
      const startDate = state.dateRange.start
        ? dayjs(state.dateRange.start)
        : dayjs().startOf('week');

      const teamBillable =
        state.teamMember?.billableRate != null
          ? {
              billable: state.teamMember.billable ?? false,
              billableRate: state.teamMember.billableRate.toString(),
            }
          : undefined;
      const rowBillable = isBreakRow(newRow.timeAgainst)
        ? undefined
        : teamBillable;

      for (let i = 0; i < 7; i += 1) {
        if (!completeTimeentries[i]) {
          completeTimeentries[i] = {
            timeEntryId: '',
            date: startDate.add(i, 'day').format('YYYY-MM-DD'),
            startTime: undefined,
            endTime: undefined,
            hours: 0,
            notes: '',
            metaInfo: undefined,
            billableInfo: rowBillable,
            isApproved: false,
          };
        }
      }

      const rowWithCompleteTimeentries = {
        ...newRow,
        rowId: newRow.rowId || crypto.randomUUID(),
        timeEntries: completeTimeentries,
      };

      // Add to hashmap
      state.weeklyTimeEntries[rowWithCompleteTimeentries.rowId] =
        rowWithCompleteTimeentries;

      // Update row order
      if (afterRowId && state.rowOrder.includes(afterRowId)) {
        const afterIndex = state.rowOrder.indexOf(afterRowId);
        state.rowOrder.splice(
          afterIndex + 1,
          0,
          rowWithCompleteTimeentries.rowId,
        );
      } else {
        state.rowOrder.push(rowWithCompleteTimeentries.rowId);
      }
    },

    /**
     * Deletes a row from the grid
     * Marks all entries in the row for deletion but keeps the row in state
     * so that the save process can find the DELETE operations
     *
     * @param state - Current grid state
     * @param action - Payload containing the rowId to delete
     */
    deleteRow(state, action: PayloadAction<{ rowId: string }>) {
      const { rowId } = action.payload;

      const rowToDelete = state.weeklyTimeEntries[rowId];
      if (!rowToDelete) return;

      // Determine if any entry in the row has a valid persisted timeEntryId
      const hasAnyPersistedEntries = Object.values(
        rowToDelete.timeEntries,
      ).some((entry) => entry.timeEntryId && entry.timeEntryId.trim() !== '');

      if (hasAnyPersistedEntries) {
        // Mark all persisted entries for deletion
        Object.values(rowToDelete.timeEntries).forEach((entry) => {
          if (entry.timeEntryId && entry.timeEntryId.trim() !== '') {
            entry.operation = 'DELETE';
          }
        });

        // Mark the row as deleted for UI purposes but keep it in state for save operations
        rowToDelete.deleted = true;
      } else {
        // No persisted entries; remove the row entirely from state
        delete state.weeklyTimeEntries[rowId];
        const orderIndex = state.rowOrder.indexOf(rowId);
        if (orderIndex !== -1) {
          state.rowOrder.splice(orderIndex, 1);
        }
      }

      // Clear any first edited cells tracking for this row
      delete state.firstEditedCells[rowId];

      // If the currently selected cell belongs to this row, clear it
      if (state.selected && state.selected.rowId === rowId) {
        state.selected = null;
      }
    },

    /**
     * Clears all operations from time entries and removes deleted rows
     * This is useful when switching weeks or after successful save
     */
    clearDeletedTimeEntryIds(state) {
      // Remove rows that were marked as deleted and have been processed
      const deletedRowIds: string[] = [];
      Object.entries(state.weeklyTimeEntries).forEach(([rowId, row]) => {
        if (row.deleted) {
          deletedRowIds.push(rowId);
        }
      });

      // Remove deleted rows from hashmap and order
      deletedRowIds.forEach((rowId) => {
        delete state.weeklyTimeEntries[rowId];
        const orderIndex = state.rowOrder.indexOf(rowId);
        if (orderIndex !== -1) {
          state.rowOrder.splice(orderIndex, 1);
        }
      });

      // Then clear any remaining DELETE operations from entries
      Object.entries(state.weeklyTimeEntries).forEach(([rowId, row]) => {
        Object.values(row.timeEntries).forEach((entry) => {
          if (entry.operation === 'DELETE') {
            entry.operation = undefined;
          }
        });
      });
    },

    /**
     * Marks all time entries as saved by clearing the operation field
     * Used after successful save to reset change tracking
     * Also updates originalValues to reflect the newly saved state
     */
    markAllEntriesAsSaved(state) {
      Object.entries(state.weeklyTimeEntries).forEach(([rowId, row]) => {
        Object.values(row.timeEntries).forEach((dayEntry) => {
          if (dayEntry.operation) {
            delete dayEntry.operation;

            // Update original values to reflect the newly saved state
            if (dayEntry.timeEntryId && dayEntry.timeEntryId.trim() !== '') {
              dayEntry.originalValues = {
                hours: dayEntry.hours,
                notes: dayEntry.notes,
                startTime: dayEntry.startTime,
                endTime: dayEntry.endTime,
                metaInfo: dayEntry.metaInfo,
                billableInfo: dayEntry.billableInfo,
                dimensions: dayEntry.dimensions,
              };
            }
          }
        });
      });
    },

    /**
     * Clears all data from all rows in the grid
     * Resets hours, notes, meta info, and billable info for all cells
     * Clears first edited cells tracking
     */
    clearAllLines(state) {
      Object.entries(state.weeklyTimeEntries).forEach(([rowId, row]) => {
        Object.keys(row.timeEntries).forEach((dayIndex) => {
          const dayIdx = parseInt(dayIndex, 10);
          row.timeEntries[dayIdx].hours = 0;
          row.timeEntries[dayIdx].notes = '';
          row.timeEntries[dayIdx].metaInfo = undefined;
          row.timeEntries[dayIdx].billableInfo = undefined;
          row.timeEntries[dayIdx].startTime = undefined;
          row.timeEntries[dayIdx].endTime = undefined;
          row.timeEntries[dayIdx].operation = undefined;
        });
        row.totalHours = 0;
        row.billableTotal = 0;
      });
      state.firstEditedCells = {};
      // Clear selected cell state when clearing all lines
      state.selected = null;
    },

    /**
     * Sets the complete time entries array
     * Replaces all existing time entries with new data
     * Clears any existing errors
     * Ensures all rows have unique rowId and only visible days exist with proper dates
     *
     * @param state - Current grid state
     * @param action - Payload containing array of timesheet rows and visible days
     */
    setTimeEntries(
      state,
      action: PayloadAction<{
        entries: TimesheetRow[];
        visibleDays?: number[];
      }>,
    ) {
      const { entries, visibleDays } = action.payload;

      // Clear existing data
      Object.keys(state.weeklyTimeEntries).forEach(
        (k) => delete state.weeklyTimeEntries[k],
      );
      state.rowOrder = [];

      // Ensure all rows have unique rowId using UUID
      const entriesWithRowId = entries.map((entry) => ({
        ...entry,
        rowId: entry.rowId || crypto.randomUUID(),
      }));

      // Add to hashmap and update order, ensuring only visible days exist with proper dates
      entriesWithRowId.forEach((entry) => {
        // Only create time entries for visible days, not all 7 days
        const completeTimeentries = { ...entry.timeEntries };
        const startDate = state.dateRange.start
          ? dayjs(state.dateRange.start)
          : dayjs().startOf('week');

        // Use visible days if provided, otherwise default to all days for backward compatibility
        const daysToCreate = visibleDays || [0, 1, 2, 3, 4, 5, 6];

        daysToCreate.forEach((dayIdx) => {
          if (!completeTimeentries[dayIdx]) {
            completeTimeentries[dayIdx] = {
              timeEntryId: '',
              date: startDate.add(dayIdx, 'day').format('YYYY-MM-DD'),
              startTime: undefined,
              endTime: undefined,
              hours: 0,
              notes: '',
              metaInfo: undefined,
              billableInfo: undefined,
              isApproved: false,
              customFields: [],
            };
          }
        });

        const entryWithCompleteTimeentries = {
          ...entry,
          timeEntries: completeTimeentries,
        };

        state.weeklyTimeEntries[entryWithCompleteTimeentries.rowId] =
          entryWithCompleteTimeentries;
        state.rowOrder.push(entryWithCompleteTimeentries.rowId);
      });

      state.error = null;
      // Clear selected cell state when setting new time entries
      state.selected = null;
    },

    /**
     * Sets an error message in the grid state
     * @param state - Current grid state
     * @param action - Payload containing error message or null
     */
    setError(state, action: PayloadAction<{ error: string | null }>) {
      state.error = action.payload.error;
    },

    /**
     * Sets the loading state for time entry operations
     * @param state - Current grid state
     * @param action - Payload containing loading boolean
     */
    setLoading(state, action: PayloadAction<{ loading: boolean }>) {
      state.loading = action.payload.loading;
    },

    /**
     * Recalculates totals for all rows based on visible days
     * Called when visible days change to update totals accordingly
     * @param state - Current grid state
     * @param action - Payload containing visible days array
     */
    recalculateTotalsForVisibleDays(
      state,
      action: PayloadAction<{ visibleDays: number[] }>,
    ) {
      const { visibleDays } = action.payload;

      Object.values(state.weeklyTimeEntries).forEach((row) => {
        const { total, billableTotal } = calculateRowTotals(
          row.timeEntries,
          visibleDays,
        );
        row.totalHours = total;
        row.billableTotal = billableTotal;
      });
    },

    /**
     * Populates dates in existing rows based on a start date
     * Updates all day dates in all rows to match the week starting from the given date
     * Ensures all 7 days exist with proper dates, creating empty entries for missing days
     *
     * @param state - Current grid state
     * @param action - Payload containing the start date for the week
     */
    populateRowDates(state, action: PayloadAction<{ startDate: string }>) {
      const { startDate } = action.payload;
      const start = dayjs(startDate);

      Object.entries(state.weeklyTimeEntries).forEach(([rowId, row]) => {
        // Ensure all 7 days exist with proper dates
        for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
          const newDate = start.add(dayIdx, 'day').format('YYYY-MM-DD');

          // Create empty entry if it doesn't exist
          if (!row.timeEntries[dayIdx]) {
            row.timeEntries[dayIdx] = {
              timeEntryId: '',
              date: newDate,
              startTime: undefined,
              endTime: undefined,
              hours: 0,
              notes: '',
              metaInfo: undefined,
              billableInfo: undefined,
              isApproved: false,
              customFields: [],
            };
          } else {
            // Update existing entry with new date
            row.timeEntries[dayIdx].date = newDate;
          }
        }
      });
    },

    /**
     * Merges time entries with existing rows instead of replacing
     * Uses hashmap approach for row management
     * Ensures unique rowId for each entry
     * Always maintains minimum 6 rows for consistent UI layout
     * Allows unlimited rows based on actual data
     * Only creates time entries for visible days to match UI display
     *
     * @param state - Current grid state
     * @param action - Payload containing array of timesheet rows to merge and visible days
     */
    mergeTimeEntries(
      state,
      action: PayloadAction<{
        entries: TimesheetRow[];
        visibleDays?: number[];
      }>,
    ) {
      const { entries, visibleDays } = action.payload;

      // Clear existing data
      Object.keys(state.weeklyTimeEntries).forEach(
        (k) => delete state.weeklyTimeEntries[k],
      );
      state.rowOrder = [];

      // Always ensure minimum 6 rows for consistent UI layout
      const MIN_ROWS = 6;

      const teamBillable =
        state.teamMember?.billableRate != null
          ? {
              billable: state.teamMember.billable ?? false,
              billableRate: state.teamMember.billableRate.toString(),
            }
          : undefined;

      if (entries && entries.length > 0) {
        // Ensure incoming entries have unique rowId using UUID
        const entriesWithRowId = entries.map((entry) => ({
          ...entry,
          rowId: entry.rowId || crypto.randomUUID(),
        }));

        // Add entries to hashmap and order, ensuring only visible days exist with proper dates
        entriesWithRowId.forEach((entry) => {
          // Only create time entries for visible days, not all 7 days
          const completeTimeentries = { ...entry.timeEntries };
          const startDate = state.dateRange.start
            ? dayjs(state.dateRange.start)
            : dayjs().startOf('week');

          // Use visible days if provided, otherwise default to all days for backward compatibility
          const daysToCreate = visibleDays || [0, 1, 2, 3, 4, 5, 6];

          const rowBillable = isBreakRow(entry.timeAgainst)
            ? undefined
            : teamBillable;

          daysToCreate.forEach((dayIdx) => {
            if (!completeTimeentries[dayIdx]) {
              completeTimeentries[dayIdx] = {
                timeEntryId: '',
                date: startDate.add(dayIdx, 'day').format('YYYY-MM-DD'),
                startTime: undefined,
                endTime: undefined,
                hours: 0,
                notes: '',
                metaInfo: undefined,
                billableInfo: rowBillable,
                isApproved: false,
                customFields: [],
              };
            }
          });

          const entryWithCompleteTimeentries = {
            ...entry,
            timeEntries: completeTimeentries,
          };

          state.weeklyTimeEntries[entryWithCompleteTimeentries.rowId] =
            entryWithCompleteTimeentries;
          state.rowOrder.push(entryWithCompleteTimeentries.rowId);
        });

        // Add additional empty rows to reach minimum if needed
        const currentRowCount = entriesWithRowId.length;
        if (currentRowCount < MIN_ROWS) {
          const additionalRowsNeeded = MIN_ROWS - currentRowCount;
          for (let i = 0; i < additionalRowsNeeded; i += 1) {
            const row = createEmptyRowForVisibleDays(
              currentRowCount + i,
              state.dateRange.start,
              visibleDays,
              state.teamMember,
            );
            state.weeklyTimeEntries[row.rowId] = row;
            state.rowOrder.push(row.rowId);
          }
        }
      } else {
        // Create 6 default rows if no entries for consistent UI layout
        for (let i = 0; i < MIN_ROWS; i += 1) {
          const row = createEmptyRowForVisibleDays(
            i,
            state.dateRange.start,
            visibleDays,
            state.teamMember,
          );
          state.weeklyTimeEntries[row.rowId] = row;
          state.rowOrder.push(row.rowId);
        }
      }

      // Apply team member billable info to empty cells after merging entries
      backfillTeamBillable(state);

      state.error = null;
      // Clear selected cell state when merging time entries
      state.selected = null;
    },

    /**
     * Clears the currently selected cell
     * @param state - Current grid state
     */
    clearSelectedCell(state) {
      state.selected = null;
    },

    /**
     * Toggles the visibility of the team member selection tooltip
     * @param state - Current grid state
     * @param action - Payload containing boolean indicating visibility
     */
    toggleSelectTeamMemberTooltip(state, action: PayloadAction<boolean>) {
      state.showSelectTeamMemberTooltip = action.payload;
    },
  },
});

// Export all actions for use in components
export const {
  updateCell,
  clearCell,
  addRow,
  deleteRow,
  clearAllLines,
  setTimeEntries,
  setError,
  populateRowDates,
  mergeTimeEntries,
  setTeamMember,
  setTeamBillableDetails,
  setDateRange,
  toggleConfirmTimeEntryConversionModal,
  selectCell,
  navigateCell,
  updateTimeAgainst,
  setLoading,
  clearDeletedTimeEntryIds,
  markAllEntriesAsSaved,
  clearSelectedCell,
  toggleSelectTeamMemberTooltip,
  recalculateTotalsForVisibleDays,
  setTeamMemberDropdownReady,
  setTimeCategorySelectorReady,
  setQuickFindEnabled,
  setQuickFindSettled,
} = timeEntryGridSlice.actions;

// Export the reducer for store configuration
export { timeEntryGridSlice };
export default timeEntryGridSlice.reducer;
