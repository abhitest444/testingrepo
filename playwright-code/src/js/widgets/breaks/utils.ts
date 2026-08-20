import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import {
  Payroll_DurationUnit,
  Payroll_BreakAssignmentType,
  Payroll_EmployerBreakInput,
  Payroll_AutoBreakRuleInput,
  Payroll_ManualBreakRuleInput,
  Payroll_BreakPosition,
  Payroll_Break,
} from 'src/__generated__/oigql/graphql';
import { TeamMember, BreakRule } from './types';
import { WORKER_TYPES, BREAK_LOCATIONS, BREAK_TYPE_NLS_MAP } from './constants';

export const getThemeFromSandbox = (sandbox: QuickbooksOnlineSandbox) => {
  const appName = sandbox?.appContext?.getAppInfo()?.appName?.toLowerCase();

  if (appName === 'quickbooks' || appName?.match(/^qb.*/i)) {
    return 'quickbooks';
  }
  return 'intuit'; // Default fallback theme
};

/**
 * Formats a break type to sentence case using NLS localization
 * @param breakType - The break type enum value
 * @param intl - The internationalization object from useIntl hook
 * @returns The localized and properly cased break type string
 */
export const formatBreakType = (
  breakType: Payroll_Break,
  intl: any,
): string => {
  const nlsKey = BREAK_TYPE_NLS_MAP[breakType];

  if (!nlsKey) {
    // Fallback to the enum value if no NLS key is found
    return breakType.charAt(0).toUpperCase() + breakType.slice(1).toLowerCase();
  }

  return intl.formatMessage({ id: nlsKey });
};

export const formatBreakDuration = (
  duration: number | null | undefined,
  durationUnit: Payroll_DurationUnit | null | undefined,
  intl: any,
): string | null => {
  if (duration === null || duration === undefined || duration === 0) {
    return null;
  }

  // Convert duration to minutes based on duration unit
  let totalMinutes: number;

  if (durationUnit === Payroll_DurationUnit.Hours) {
    totalMinutes = duration * 60;
  } else if (durationUnit === Payroll_DurationUnit.Minutes) {
    totalMinutes = duration;
  } else {
    // Fallback to minutes for unknown units
    totalMinutes = duration;
  }

  // If less than 60 minutes, show only minutes
  if (totalMinutes < 60) {
    return totalMinutes === 1
      ? intl.formatMessage(
          { id: 'breaks.create.duration.minute.lowercase' },
          { minute: totalMinutes },
        )
      : intl.formatMessage(
          { id: 'breaks.create.duration.minutes.lowercase' },
          { minutes: totalMinutes },
        );
  }

  // Convert to hours and minutes
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const hoursLabel =
    hours === 1
      ? intl.formatMessage(
          { id: 'breaks.create.duration.hour.lowercase' },
          { hour: hours },
        )
      : intl.formatMessage(
          { id: 'breaks.create.duration.hours.lowercase' },
          { hours },
        );

  // If no remaining minutes, show only hours
  if (remainingMinutes === 0) {
    return hoursLabel;
  }

  const minutesLabel =
    remainingMinutes === 1
      ? intl.formatMessage(
          { id: 'breaks.create.duration.minute.lowercase' },
          { minute: remainingMinutes },
        )
      : intl.formatMessage(
          { id: 'breaks.create.duration.minutes.lowercase' },
          { minutes: remainingMinutes },
        );

  return `${hoursLabel} ${minutesLabel}`;
};

export const formatFrequencyDisplay = (frequency: string): string => {
  if (!frequency || !frequency.includes(':')) {
    return frequency;
  }

  const [hours, minutes] = frequency.split(':').map(Number);
  const totalMinutes = (hours || 0) * 60 + (minutes || 0);

  if (totalMinutes === 0) {
    return frequency;
  }

  // Convert to hours and minutes for display
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;

  if (displayHours > 0 && displayMinutes > 0) {
    return `${displayHours}h ${displayMinutes}m`;
  }
  if (displayHours > 0) {
    return `${displayHours}h`;
  }
  return `${displayMinutes}m`;
};

/**
 * Derives the break assignment type from a team member's worker type
 * @param member - The team member object containing workerType
 * @returns The corresponding Payroll_BreakAssignmentType enum value
 */
export const deriveAssignmentTypeFromWorkerType = (
  member: TeamMember,
): Payroll_BreakAssignmentType => {
  switch (member.workerType.toLowerCase()) {
    case WORKER_TYPES.EMPLOYEE.toLowerCase():
      return Payroll_BreakAssignmentType.Employee;
    case WORKER_TYPES.VENDOR.toLowerCase():
      return Payroll_BreakAssignmentType.Vendor;
    default:
      // Default to Employee for unknown worker types
      return Payroll_BreakAssignmentType.Employee;
  }
};

/**
 * Helper function to compare values treating null and undefined as equal
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are equal (including null == undefined)
 */
export const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null && b == null) return true; // null == undefined is true
  return false;
};

/**
 * Compares basic break rule fields and returns modified ones
 * @param originalBreakRule - The original break rule object
 * @param updatedBreakRuleInput - The updated break rule input object
 * @returns Object containing modified basic fields
 */
export const getModifiedBasicFields = (
  originalBreakRule: BreakRule,
  updatedBreakRuleInput: Payroll_EmployerBreakInput,
): Partial<Payroll_EmployerBreakInput> => {
  const modifiedFields: Partial<Payroll_EmployerBreakInput> = {};

  if (!isEqual(originalBreakRule.breakName, updatedBreakRuleInput.breakName)) {
    modifiedFields.breakName = updatedBreakRuleInput.breakName;
  }

  if (!isEqual(originalBreakRule.breakType, updatedBreakRuleInput.breakType)) {
    modifiedFields.breakType = updatedBreakRuleInput.breakType;
  }

  if (!isEqual(originalBreakRule.allowAuto, updatedBreakRuleInput.allowAuto)) {
    modifiedFields.allowAuto = updatedBreakRuleInput.allowAuto;
  }

  if (
    !isEqual(originalBreakRule.allowManual, updatedBreakRuleInput.allowManual)
  ) {
    modifiedFields.allowManual = updatedBreakRuleInput.allowManual;
  }

  if (
    !isEqual(
      originalBreakRule.noSetDuration,
      updatedBreakRuleInput.noSetDuration,
    )
  ) {
    modifiedFields.noSetDuration = updatedBreakRuleInput.noSetDuration;
  }

  if (!isEqual(originalBreakRule.isActive, updatedBreakRuleInput.isActive)) {
    modifiedFields.isActive = updatedBreakRuleInput.isActive;
  }

  return modifiedFields;
};

/**
 * Compares duration and durationUnit fields with dependency handling
 * @param originalBreakRule - The original break rule object
 * @param updatedBreakRuleInput - The updated break rule input object
 * @returns Object containing modified duration fields
 */
export const getModifiedDurationFields = (
  originalBreakRule: BreakRule,
  updatedBreakRuleInput: Payroll_EmployerBreakInput,
): Partial<Payroll_EmployerBreakInput> => {
  const modifiedFields: Partial<Payroll_EmployerBreakInput> = {};

  const durationChanged = !isEqual(
    originalBreakRule.breakDuration,
    updatedBreakRuleInput.breakDuration,
  );
  const durationUnitChanged = !isEqual(
    originalBreakRule.durationUnit,
    updatedBreakRuleInput.durationUnit,
  );

  if (durationChanged) {
    modifiedFields.breakDuration = updatedBreakRuleInput.breakDuration;
    // If duration changed, also include durationUnit if it's provided
    if (updatedBreakRuleInput.durationUnit !== undefined) {
      modifiedFields.durationUnit = updatedBreakRuleInput.durationUnit;
    }
  } else if (durationUnitChanged) {
    modifiedFields.durationUnit = updatedBreakRuleInput.durationUnit;
    // If durationUnit changed, also include duration if it's provided
    if (updatedBreakRuleInput.breakDuration !== undefined) {
      modifiedFields.breakDuration = updatedBreakRuleInput.breakDuration;
    }
  }

  return modifiedFields;
};

/**
 * Compares auto rule fields and returns modified ones
 * @param originalAutoRule - The original auto rule object
 * @param updatedAutoRule - The updated auto rule input object
 * @returns Object containing modified auto rule fields
 */
export const getModifiedAutoRuleFields = (
  originalAutoRule: any,
  updatedAutoRule: Payroll_AutoBreakRuleInput | undefined,
): Payroll_AutoBreakRuleInput | undefined => {
  if (!originalAutoRule && updatedAutoRule) {
    return updatedAutoRule;
  }

  if (originalAutoRule && !updatedAutoRule) {
    return undefined;
  }

  if (originalAutoRule && updatedAutoRule) {
    const modifiedAutoRule: Payroll_AutoBreakRuleInput = {};
    let hasAutoRuleChanges = false;

    if (
      !isEqual(originalAutoRule.breakPosition, updatedAutoRule.breakPosition)
    ) {
      modifiedAutoRule.breakPosition = updatedAutoRule.breakPosition;
      hasAutoRuleChanges = true;
    }

    if (!isEqual(originalAutoRule.durationUnit, updatedAutoRule.durationUnit)) {
      modifiedAutoRule.durationUnit = updatedAutoRule.durationUnit;
      hasAutoRuleChanges = true;
    }

    if (!isEqual(originalAutoRule.repeatBreak, updatedAutoRule.repeatBreak)) {
      modifiedAutoRule.repeatBreak = updatedAutoRule.repeatBreak;
      hasAutoRuleChanges = true;
    }

    // Handle shiftThresholdLimit (frequency) and related fields together
    const thresholdChanged = !isEqual(
      originalAutoRule.shiftThresholdLimit,
      updatedAutoRule.shiftThresholdLimit,
    );
    const specificTimeChanged = !isEqual(
      originalAutoRule.specificTime,
      updatedAutoRule.specificTime,
    );

    if (thresholdChanged) {
      modifiedAutoRule.shiftThresholdLimit =
        updatedAutoRule.shiftThresholdLimit;
      hasAutoRuleChanges = true;
      // If threshold changed, also include durationUnit if it's provided
      if (updatedAutoRule.durationUnit !== undefined) {
        modifiedAutoRule.durationUnit = updatedAutoRule.durationUnit;
      }
      // If threshold changed, also include specificTime if it's provided
      if (updatedAutoRule.specificTime !== undefined) {
        modifiedAutoRule.specificTime = updatedAutoRule.specificTime;
      }
    } else if (specificTimeChanged) {
      modifiedAutoRule.specificTime = updatedAutoRule.specificTime;
      // If specificTime is changed, also include breakPosition if it's provided
      if (updatedAutoRule.breakPosition !== undefined) {
        modifiedAutoRule.breakPosition = updatedAutoRule.breakPosition;
      }
      // If specificTime is being set and breakPosition is not SPECIFIC, ensure it's set to SPECIFIC
      if (
        updatedAutoRule.specificTime &&
        originalAutoRule.breakPosition !== Payroll_BreakPosition.Specific
      ) {
        modifiedAutoRule.breakPosition = Payroll_BreakPosition.Specific;
      }
      hasAutoRuleChanges = true;
    }

    // Compare workDays arrays
    const originalWorkDays = originalAutoRule.workDays || [];
    const updatedWorkDays = updatedAutoRule.workDays || [];
    if (
      originalWorkDays.length !== updatedWorkDays.length ||
      !originalWorkDays.every(
        (day: any, index: number) => day === updatedWorkDays[index],
      )
    ) {
      modifiedAutoRule.workDays = updatedAutoRule.workDays;
      hasAutoRuleChanges = true;
    }

    return hasAutoRuleChanges ? modifiedAutoRule : undefined;
  }

  return undefined;
};

/**
 * Compares manual rule fields and returns modified ones
 * @param originalManualRule - The original manual rule object
 * @param updatedManualRule - The updated manual rule input object
 * @returns Object containing modified manual rule fields
 */
export const getModifiedManualRuleFields = (
  originalManualRule: any,
  updatedManualRule: Payroll_ManualBreakRuleInput | undefined,
): Payroll_ManualBreakRuleInput | undefined => {
  if (!originalManualRule && updatedManualRule) {
    return updatedManualRule;
  }

  if (originalManualRule && !updatedManualRule) {
    return undefined;
  }

  if (originalManualRule && updatedManualRule) {
    const modifiedManualRule: Payroll_ManualBreakRuleInput = {};
    let hasManualRuleChanges = false;

    if (
      !isEqual(
        originalManualRule.allowEarlyEndBreak,
        updatedManualRule.allowEarlyEndBreak,
      )
    ) {
      modifiedManualRule.allowEarlyEndBreak =
        updatedManualRule.allowEarlyEndBreak;
      hasManualRuleChanges = true;
    }

    if (
      !isEqual(originalManualRule.autoEndBreak, updatedManualRule.autoEndBreak)
    ) {
      modifiedManualRule.autoEndBreak = updatedManualRule.autoEndBreak;
      hasManualRuleChanges = true;
    }

    if (
      !isEqual(
        originalManualRule.breakEndingReminder,
        updatedManualRule.breakEndingReminder,
      )
    ) {
      modifiedManualRule.breakEndingReminder =
        updatedManualRule.breakEndingReminder;
      hasManualRuleChanges = true;
    }

    if (
      !isEqual(
        originalManualRule.breakEndingReminderTime,
        updatedManualRule.breakEndingReminderTime,
      )
    ) {
      modifiedManualRule.breakEndingReminderTime =
        updatedManualRule.breakEndingReminderTime;
      hasManualRuleChanges = true;
    }

    // minRequiredBreakMinutes only exists in input type, not in the original rule
    // So we only need to check if it's being set in the updated input
    // Only consider minRequiredBreakMinutes if cantEndEarly is true (allowEarlyEndBreak is false)
    if (
      updatedManualRule.minRequiredBreakMinutes !== undefined &&
      updatedManualRule.allowEarlyEndBreak === false
    ) {
      modifiedManualRule.minRequiredBreakMinutes =
        updatedManualRule.minRequiredBreakMinutes;
      hasManualRuleChanges = true;
    }

    return hasManualRuleChanges ? modifiedManualRule : undefined;
  }

  return undefined;
};

/**
 * Compares two break rule objects and returns only the fields that have changed
 * @param originalBreakRule - The original break rule object
 * @param updatedBreakRuleInput - The updated break rule input object
 * @returns A Payroll_EmployerBreakInput object containing only the modified fields
 */
export const getModifiedBreakRuleFields = (
  originalBreakRule: BreakRule,
  updatedBreakRuleInput: Payroll_EmployerBreakInput,
): Payroll_EmployerBreakInput => {
  const modifiedFields: Payroll_EmployerBreakInput = {};

  // Compare basic fields
  Object.assign(
    modifiedFields,
    getModifiedBasicFields(originalBreakRule, updatedBreakRuleInput),
  );

  // Compare duration fields with dependencies
  Object.assign(
    modifiedFields,
    getModifiedDurationFields(originalBreakRule, updatedBreakRuleInput),
  );

  // Compare autoRule if it exists
  if (originalBreakRule.autoRule || updatedBreakRuleInput.autoRule) {
    const modifiedAutoRule = getModifiedAutoRuleFields(
      originalBreakRule.autoRule,
      updatedBreakRuleInput.autoRule,
    );

    if (modifiedAutoRule !== undefined) {
      modifiedFields.autoRule = modifiedAutoRule;
      // Include allowAuto when auto rule is modified
      if (updatedBreakRuleInput.allowAuto !== undefined) {
        modifiedFields.allowAuto = updatedBreakRuleInput.allowAuto;
      }
    } else if (
      updatedBreakRuleInput.autoRule === undefined &&
      originalBreakRule.autoRule
    ) {
      // Auto rule was removed
      modifiedFields.autoRule = undefined;
      if (updatedBreakRuleInput.allowAuto !== undefined) {
        modifiedFields.allowAuto = updatedBreakRuleInput.allowAuto;
      }
    }
  }

  // Compare manualRule if it exists
  if (originalBreakRule.manualRule || updatedBreakRuleInput.manualRule) {
    const modifiedManualRule = getModifiedManualRuleFields(
      originalBreakRule.manualRule,
      updatedBreakRuleInput.manualRule,
    );

    if (modifiedManualRule !== undefined) {
      modifiedFields.manualRule = modifiedManualRule;
      // Include allowManual when manual rule is modified
      if (updatedBreakRuleInput.allowManual !== undefined) {
        modifiedFields.allowManual = updatedBreakRuleInput.allowManual;
      }
    }
  }

  return modifiedFields;
};

/**
 * Maps error codes to NLS keys for break entry errors
 * @param errorCode - The error code from the API response
 * @returns The corresponding NLS key for the error message
 */
export const mapErrorCodeToNls = (errorCode: string): string => {
  const errorCodeMap: Record<string, string> = {
    MANUAL_MODE_NOT_ALLOWED: 'create.break.entry.manual.not.allowed',
    // Add more error codes here as needed
  };

  return errorCodeMap[errorCode] || 'breaks.api.create.save.error.title';
};
