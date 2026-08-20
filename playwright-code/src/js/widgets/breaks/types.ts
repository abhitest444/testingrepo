import { Dayjs } from 'dayjs';
import {
  Payroll_Break,
  Payroll_EmployerBreak,
  Payroll_EmployerBreakInput,
} from 'src/__generated__/oigql/graphql';

export type BREAK_SETTINGS_FEATURE = 'breaks-settings';
export type BREAK_SETTINGS_FUNCTIONALITY =
  | 'settings-handle'
  | 'breaks-preferences';

export type BREAK_SETTINGS_PREFERENCES_TROWSER_PROPS = {
  open: boolean;
  onClose: () => void;
};

/**
 * Initial view options for deep-linking into the breaks widget
 * Used when navigating via query params like ?section=breaks|edit|{breakId}
 */
export interface BreaksInitialViewOptions {
  view: 'list' | 'create' | 'edit' | 'assign';
  breakId?: string;
}

export interface BreakEntry {
  name: string;
  breakRule: string;
  startDate: Dayjs;
  endDate?: Dayjs;
  startTime?: Dayjs;
  endTime?: Dayjs;
  description?: string;
  timezone?: string;
  contact?: any; // Store the full contact object
  useStartEndTime?: boolean; // Toggle for start/end time vs duration
  duration?: number; // Duration in seconds when useStartEndTime is false
  currentlyWorking?: boolean; // Currently working checkbox
  selectedBreakRule?: BreakRule; // Store the full break rule object
  timeEntryId?: string; // Original time entry ID for updates
  version?: string; // Version for optimistic locking
  isTimeOffEntry?: boolean;
}

export interface BreakRule extends Payroll_EmployerBreak {}
export interface BreakRuleInput extends Payroll_EmployerBreakInput {}

export interface TeamMember {
  id: string;
  name: string;
  workerType: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export const BREAK_TYPE_DISPLAY = {
  PAID: 'Paid',
  UNPAID: 'Unpaid',
} as const;

export type BREAK_ENTRIES_FEATURE = 'break-entries';
export type BREAK_ENTRIES_FUNCTIONALITY =
  | 'create-break-entry'
  | 'edit-break-entry';

export type BREAK_SELECTOR_QUICKFILL_FEATURE = 'breaks-quickfills';
export type BREAK_SELECTOR_QUICKFILL_FUNCTIONALITY =
  'breaks-selector-quickfill';

export type BREAKS_WIDGET_FEATURE =
  | BREAK_SETTINGS_FEATURE
  | BREAK_ENTRIES_FEATURE
  | BREAK_SELECTOR_QUICKFILL_FEATURE;
export type BREAKS_WIDGET_FUNCTIONALITY =
  | BREAK_SETTINGS_FUNCTIONALITY
  | BREAK_ENTRIES_FUNCTIONALITY
  | BREAK_SELECTOR_QUICKFILL_FUNCTIONALITY;

export type BreaksWidgetOptions =
  | {
      feature: BREAK_SETTINGS_FEATURE;
      functionality: BREAK_SETTINGS_FUNCTIONALITY;
      isNewBadgeVisibleTillDate?: string;
      isEditable?: boolean;
      props?: BREAK_SETTINGS_PREFERENCES_TROWSER_PROPS;
      /** Initial view for deep-linking navigation */
      initialView?: BreaksInitialViewOptions | null;
    }
  | {
      feature: BREAK_ENTRIES_FEATURE;
      functionality: BREAK_ENTRIES_FUNCTIONALITY;
      props?: {
        open?: boolean;
        onSave?: (data: BreakEntry) => void;
        onClose?: () => void;
        [key: string]: any;
      }; // You can type this more strictly if needed
    }
  | {
      feature: BREAK_SELECTOR_QUICKFILL_FEATURE;
      functionality: BREAK_SELECTOR_QUICKFILL_FUNCTIONALITY;
      props: {
        assigneeId: string;
        width?: number;
        onBreakSelected?: (breakId: string, breakRule: BreakRule) => void;
        filter?: {
          isActive?: boolean;
          isDefaultPolicy?: boolean;
          // includeDeleted to be sent to get deleted breaks by id  - this flag goes in getEmployerBreaks filter
          includeDeleted?: boolean;
          allowAuto?: boolean;
          allowManual?: boolean;
          breakType?: Payroll_Break;
        };
        errorText?: string;
        breakId?: string; // Optional breakId to load as default value
        [key: string]: any;
      };
    };
