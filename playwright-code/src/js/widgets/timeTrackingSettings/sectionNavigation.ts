import { BreaksInitialViewOptions } from 'src/js/widgets/breaks/types';
import {
  OvertimeInitialViewOptions,
  WizardStepId,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/types/Overtime.types';
import { TimeEntriesFormType } from './constants';

// Re-export types for consumers of this module
export type { BreaksInitialViewOptions, OvertimeInitialViewOptions };

/**
 * Section Navigation Utilities
 *
 * Provides utilities for deep-linking to specific sections in Time Tracking Settings
 * via query parameters. Supports multilevel nesting using hyphen (-) delimiter.
 *
 * Example URLs:
 * - ?s=notifications           -> Open notifications in edit mode
 * - ?s=notifications-overtime  -> Open notifications edit, scroll to overtime
 * - ?s=breaks-edit-abc123      -> Open breaks trowser, edit break abc123
 * - ?s=overtime-policysetup-3  -> Open overtime policy setup wizard at step 3
 */

// ==========================================
// Section Key Constants
// ==========================================

export const SECTION_KEYS = {
  TIMETRACKING: 'timetracking',
  TIMESHEET: 'timesheet',
  CUSTOM_FIELDS: 'customfields',
  NOTIFICATIONS: 'notifications',
  APPROVALS: 'approvals',
  SCHEDULES: 'schedules',
  GEO_LOCATION: 'geolocation',
  BREAKS: 'breaks',
  OVERTIME: 'overtime',
  KIOSK: 'kiosk',
  TIMEOFF: 'timeoff',
} as const;

export type SectionKey = (typeof SECTION_KEYS)[keyof typeof SECTION_KEYS];

export const NOTIFICATIONS_SUBSECTION_KEYS = {
  TIMETRACKING: 'timetracking',
  APPROVALS: 'approvals',
  SUBMISSIONS: 'submissions',
  GEOFENCE: 'geofence',
  OVERTIME: 'overtime',
} as const;

export type NotificationsSubsectionKey =
  (typeof NOTIFICATIONS_SUBSECTION_KEYS)[keyof typeof NOTIFICATIONS_SUBSECTION_KEYS];

export const BREAKS_VIEW_KEYS = {
  LIST: 'list',
  CREATE: 'create',
  EDIT: 'edit',
  ASSIGN: 'assign',
} as const;

export type BreaksViewKey =
  (typeof BREAKS_VIEW_KEYS)[keyof typeof BREAKS_VIEW_KEYS];

export const OVERTIME_VIEW_KEYS = {
  LIST: 'list',
  DETAILS: 'details',
  POLICY_SETUP: 'policysetup',
  EDIT: 'edit',
  ASSIGN: 'assign',
} as const;

export type OvertimeViewKey =
  (typeof OVERTIME_VIEW_KEYS)[keyof typeof OVERTIME_VIEW_KEYS];

// ==========================================
// DOM Element ID Mappings
// ==========================================

const SECTION_TO_ELEMENT_ID: Record<string, string> = {
  [SECTION_KEYS.TIMETRACKING]: 'timetracking-settings',
  [SECTION_KEYS.TIMESHEET]: 'timeSheet-settings',
  [SECTION_KEYS.NOTIFICATIONS]: 'notifications-settings',
  [SECTION_KEYS.APPROVALS]: 'approvals-settings',
  [SECTION_KEYS.SCHEDULES]: 'schedules-settings',
  [SECTION_KEYS.TIMEOFF]: 'timeoff-settings',
  [SECTION_KEYS.KIOSK]: 'kiosk-settings',
};

const NOTIFICATIONS_SUBSECTION_TO_ELEMENT_ID: Record<string, string> = {
  [NOTIFICATIONS_SUBSECTION_KEYS.TIMETRACKING]: 'notifications-settings', // Same as main notifications section
  [NOTIFICATIONS_SUBSECTION_KEYS.APPROVALS]:
    'notifications-approvals-subsection',
  [NOTIFICATIONS_SUBSECTION_KEYS.SUBMISSIONS]:
    'notifications-submissions-subsection',
  [NOTIFICATIONS_SUBSECTION_KEYS.GEOFENCE]: 'notifications-geofence-subsection',
  [NOTIFICATIONS_SUBSECTION_KEYS.OVERTIME]: 'notifications-overtime-subsection',
};

// ==========================================
// Form Type Mappings
// ==========================================

const SECTION_TO_FORM_TYPE: Record<string, TimeEntriesFormType> = {
  [SECTION_KEYS.TIMETRACKING]: TimeEntriesFormType.TIMETRACKING,
  [SECTION_KEYS.TIMESHEET]: TimeEntriesFormType.TIMESHEET,
  [SECTION_KEYS.NOTIFICATIONS]: TimeEntriesFormType.NOTIFICATION,
  [SECTION_KEYS.APPROVALS]: TimeEntriesFormType.APPROVALS,
};

// ==========================================
// Initial View Options Types
// ==========================================

// Types are imported from their canonical widget locations and re-exported above

export interface GeoLocationsInitialViewOptions {
  openTrowser: boolean;
}

// ==========================================
// Parsed Section Path Interface
// ==========================================

export interface ParsedSectionPath {
  segments: string[];
  section: string | null;
  subsection: string | null;
  entityId: string | null;
  extraParam: string | null;
}

// ==========================================
// Parser Functions
// ==========================================

/**
 * Parse section query param into structured path
 * Example: "notifications-overtime" -> { section: "notifications", subsection: "overtime", ... }
 */
export const parseSectionParam = (
  sectionParam: string | null,
): ParsedSectionPath => {
  if (!sectionParam) {
    return {
      segments: [],
      section: null,
      subsection: null,
      entityId: null,
      extraParam: null,
    };
  }

  const segments = sectionParam
    .toLowerCase()
    .split('-')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    segments,
    section: segments[0] || null,
    subsection: segments[1] || null,
    entityId: segments[2] || null,
    extraParam: segments[3] || null,
  };
};

// ==========================================
// Validation Functions
// ==========================================

const ALL_SECTION_KEYS = Object.values(SECTION_KEYS);
const ALL_NOTIFICATIONS_SUBSECTION_KEYS = Object.values(
  NOTIFICATIONS_SUBSECTION_KEYS,
);
const ALL_BREAKS_VIEW_KEYS = Object.values(BREAKS_VIEW_KEYS);
const ALL_OVERTIME_VIEW_KEYS = Object.values(OVERTIME_VIEW_KEYS);

/**
 * Validate if the parsed section path is valid
 */
export const isValidSectionPath = (path: ParsedSectionPath): boolean => {
  if (!path.section) return false;

  // Check if section key is valid
  if (!ALL_SECTION_KEYS.includes(path.section as SectionKey)) {
    return false;
  }

  // Validate subsection based on section type
  if (path.subsection) {
    switch (path.section) {
      case SECTION_KEYS.NOTIFICATIONS:
        if (
          !ALL_NOTIFICATIONS_SUBSECTION_KEYS.includes(
            path.subsection as NotificationsSubsectionKey,
          )
        ) {
          return false;
        }
        break;
      case SECTION_KEYS.BREAKS:
        if (!ALL_BREAKS_VIEW_KEYS.includes(path.subsection as BreaksViewKey)) {
          return false;
        }
        // edit and assign require entityId
        if (
          (path.subsection === BREAKS_VIEW_KEYS.EDIT ||
            path.subsection === BREAKS_VIEW_KEYS.ASSIGN) &&
          !path.entityId
        ) {
          return false;
        }
        break;
      case SECTION_KEYS.OVERTIME:
        if (
          !ALL_OVERTIME_VIEW_KEYS.includes(path.subsection as OvertimeViewKey)
        ) {
          return false;
        }
        // details, edit, and assign require entityId (policyId)
        if (
          (path.subsection === OVERTIME_VIEW_KEYS.DETAILS ||
            path.subsection === OVERTIME_VIEW_KEYS.EDIT ||
            path.subsection === OVERTIME_VIEW_KEYS.ASSIGN) &&
          !path.entityId
        ) {
          return false;
        }
        break;
      default:
        // Other sections don't support subsections
        return false;
    }
  }

  return true;
};

// ==========================================
// Section Type Check Functions
// ==========================================

/**
 * Check if section is a trowser-based widget (breaks/overtime/geolocations/customfields)
 */
export const isTrowserSection = (section: string | null): boolean =>
  section === SECTION_KEYS.BREAKS ||
  section === SECTION_KEYS.OVERTIME ||
  section === SECTION_KEYS.GEO_LOCATION ||
  section === SECTION_KEYS.CUSTOM_FIELDS;

/**
 * Check if section supports inline edit mode
 */
export const isInlineEditSection = (section: string | null): boolean =>
  section === SECTION_KEYS.TIMETRACKING ||
  section === SECTION_KEYS.TIMESHEET ||
  section === SECTION_KEYS.NOTIFICATIONS ||
  section === SECTION_KEYS.APPROVALS;

/**
 * Check if section is view-only (no edit, just scroll to)
 */
export const isViewOnlySection = (section: string | null): boolean =>
  section === SECTION_KEYS.SCHEDULES ||
  section === SECTION_KEYS.TIMEOFF ||
  section === SECTION_KEYS.KIOSK;

// ==========================================
// Mapping Functions
// ==========================================

/**
 * Map section key to TimeEntriesFormType for inline edit sections
 */
export const sectionToFormType = (
  section: string | null,
): TimeEntriesFormType | null => {
  if (!section) return null;
  return SECTION_TO_FORM_TYPE[section] || null;
};

/**
 * Map section key to DOM element ID
 */
export const sectionToElementId = (section: string | null): string | null => {
  if (!section) return null;
  return SECTION_TO_ELEMENT_ID[section] || null;
};

/**
 * Get subsection element ID for notifications section
 */
export const getSubsectionElementId = (
  section: string | null,
  subsection: string | null,
): string | null => {
  if (!section || !subsection) return null;

  if (section === SECTION_KEYS.NOTIFICATIONS) {
    return NOTIFICATIONS_SUBSECTION_TO_ELEMENT_ID[subsection] || null;
  }

  return null;
};

// ==========================================
// Widget Options Builders
// ==========================================

/**
 * Build initial view options for Breaks widget based on parsed path
 */
export const buildBreaksWidgetOptions = (
  path: ParsedSectionPath,
): BreaksInitialViewOptions | null => {
  if (path.section !== SECTION_KEYS.BREAKS) return null;

  const view = path.subsection as BreaksViewKey | null;

  switch (view) {
    case BREAKS_VIEW_KEYS.CREATE:
      return { view: 'create' };
    case BREAKS_VIEW_KEYS.EDIT:
      return path.entityId ? { view: 'edit', breakId: path.entityId } : null;
    case BREAKS_VIEW_KEYS.ASSIGN:
      return path.entityId ? { view: 'assign', breakId: path.entityId } : null;
    case BREAKS_VIEW_KEYS.LIST:
    default:
      return { view: 'list' };
  }
};

/**
 * Build initial view options for Overtime widget based on parsed path
 */
export const buildOvertimeWidgetOptions = (
  path: ParsedSectionPath,
): OvertimeInitialViewOptions | null => {
  if (path.section !== SECTION_KEYS.OVERTIME) return null;

  const view = path.subsection as OvertimeViewKey | null;

  switch (view) {
    case OVERTIME_VIEW_KEYS.DETAILS:
      return path.entityId
        ? { view: 'details', policyId: path.entityId }
        : null;

    case OVERTIME_VIEW_KEYS.POLICY_SETUP: {
      // entityId here is the wizard step (1-4)
      const step = parseWizardStep(path.entityId);
      return { view: 'wizard', wizardStep: step };
    }

    case OVERTIME_VIEW_KEYS.EDIT: {
      if (!path.entityId) return null;
      // extraParam here is the optional wizard step
      const step = parseWizardStep(path.extraParam);
      return { view: 'edit', policyId: path.entityId, wizardStep: step };
    }

    case OVERTIME_VIEW_KEYS.ASSIGN:
      return path.entityId
        ? {
            view: 'assign',
            policyId: path.entityId,
            wizardStep: WizardStepId.POLICY_MEMBERS,
          }
        : null;

    case OVERTIME_VIEW_KEYS.LIST:
    default:
      return { view: 'list' };
  }
};

/**
 * Build initial view options for Geo Locations based on parsed path
 */
export const buildGeoLocationsOptions = (
  path: ParsedSectionPath,
): GeoLocationsInitialViewOptions | null => {
  if (path.section !== SECTION_KEYS.GEO_LOCATION) return null;
  return { openTrowser: true };
};

// ==========================================
// Helper Functions
// ==========================================

/**
 * Parse wizard step from string, returning valid WizardStepId or undefined
 */
const parseWizardStep = (stepStr: string | null): WizardStepId | undefined => {
  if (!stepStr) return undefined;

  const step = parseInt(stepStr, 10);
  if (
    Number.isNaN(step) ||
    step < WizardStepId.POLICY_NAME ||
    step > WizardStepId.REVIEW
  ) {
    return undefined;
  }

  return step as WizardStepId;
};

/**
 * Scroll to element using a React ref with smooth behavior
 * This is the preferred method - avoids document.getElementById anti-pattern
 */
export const scrollToElementRef = (
  elementRef: React.RefObject<HTMLElement> | null,
  delay: number = 300,
): void => {
  if (!elementRef?.current) return;

  setTimeout(() => {
    elementRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, delay);
};

/**
 * Scroll to element by ID with smooth behavior
 * @deprecated Use scrollToElementRef with a React ref instead
 */
export const scrollToElement = (
  elementId: string | null,
  delay: number = 300,
): void => {
  if (!elementId) return;

  setTimeout(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, delay);
};
