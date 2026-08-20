/**
 * Approvals Feature Type Definitions
 * Type definitions for the time submission approvals feature
 */

// ==========================================
// Daily / Weekly Time Entry Types
// ==========================================

export type DayEntryStatus = 'pending' | 'submitted';

/**
 * A single day's time summary within a week group
 */
export interface DayTimeEntry {
  id: string;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Total minutes worked on this day (0 if no timesheets) */
  minutes: number;
  /** Number of timesheets for the day */
  timesheetCount: number;
  status: DayEntryStatus;
}

/**
 * A weekly grouping of daily entries (e.g. "September 11 - 15 (this week)")
 */
export interface WeekTimeGroup {
  id: string;
  /** ISO date string for the first day of the week (YYYY-MM-DD) */
  weekStart: string;
  /** ISO date string for the last day of the week (YYYY-MM-DD) */
  weekEnd: string;
  /** Total minutes for the week (sum of day minutes) */
  totalMinutes: number;
  /** True when every day in this week is already submitted */
  isSubmitted: boolean;
  /** True when this week contains "today" */
  isCurrentWeek: boolean;
  /** Daily breakdown rows shown when the week is expanded */
  days: DayTimeEntry[];
}

// ==========================================
// Submit Time Panel State
// ==========================================

export interface SubmitTimePanelState {
  isOpen: boolean;
  /** "Submit through" date selected by the user (ISO YYYY-MM-DD) */
  submitThroughDate: string | null;
  /** Start of the unapproved period being summarized (ISO YYYY-MM-DD) */
  periodStartDate: string | null;
  /** Weekly groups with daily breakdown shown in the table */
  weekGroups: WeekTimeGroup[];
  /** IDs of week groups currently expanded */
  expandedWeekIds: string[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

// ==========================================
// Redux State Types
// ==========================================

export interface ApprovalsState {
  submitTimePanel: SubmitTimePanelState;
}

// ==========================================
// Component Props Types
// ==========================================

export interface SubmitTimePanelProps {
  title?: string;
  submitThroughDate: string | null;
  summaryThroughDate?: string | null;
  showFullWeekSubmissionText?: boolean;
  periodStartDate: string | null;
  weekGroups: WeekTimeGroup[];
  expandedWeekIds: string[];
  totalUnapprovedMinutes: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmitThroughDateChange: (date: string) => void;
  onToggleWeekExpanded: (weekId: string) => void;
  onOpenSubmitConfirmation: () => void;
  onSubmit: () => void;
  submitConfirmationMessage?: string | null;
  onDismissError?: () => void;
}

export interface SubmitTimePanelContainerProps {
  onClose?: () => void;
  onSubmitSuccess?: (submittedMinutes?: number) => void;
}
