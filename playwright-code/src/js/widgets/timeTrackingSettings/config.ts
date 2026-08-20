import type { Identity_EntitlementGrant } from 'src/__generated__/oigql/graphql';
import { Sandbox } from '../../common/sandbox';
import { isPayrollFirstCompany } from '../../service/utils/sandboxUtils';
import {
  FEATURE_FLAGS,
  TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE,
} from '../../common/constants';
import { computeHasTimeElite } from '../../service/hooks/entitlements/useGetEntitlements';

// Returns false only when the company is payroll-first AND the
// FEATURE_FLAG_PAYROLL_FIRST_ENABLED IXP flag is off. Non-payroll-first
// companies are always treated as not blocked.
const isNotBlockedByPayrollFirstGate = (sandbox: Sandbox) =>
  !isPayrollFirstCompany(sandbox) ||
  sandbox.featureFlags.isFeatureEnabled(
    FEATURE_FLAGS.FEATURE_FLAG_PAYROLL_FIRST_ENABLED,
  );

export const TIME_ENTRY_SETTINGS_CONFIG = {
  GENERAL_TIME: {
    id: 'general-time',
    isEnabled: (sandbox: Sandbox) => isNotBlockedByPayrollFirstGate(sandbox),
    supportedLists: [
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST,
    ],
    name: 'time-entries.section.title.time-tracking',
    isNew: true,
  },
  TIME_OFF: {
    id: 'time-off',
    enabled: true,
    name: 'time-entries.section.title.time-off',
    isNew: true,
  },
  MANAGE_KIOSK: {
    id: 'manage-kiosk',
    enabled: true,
    supportedLists: [
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST,
    ],
  },
  TIMESHEET_FIELDS: {
    id: 'timesheet-fields',
    isEnabled: (sandbox: Sandbox) => isNotBlockedByPayrollFirstGate(sandbox),
    supportedLists: [
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST,
    ],
    name: 'time-entries.section.title.time-sheet',
    isNew: true,
  },
  SCHEDULES: {
    id: 'schedules',
    name: 'time-entries.section.title.schedules',
    enabled: true, // build-time toggle; runtime gating is via QB_TIME_ENABLE_SCHEDULE_SETTINGS IXP flag
    isNew: true,
  },
  CUSTOM_FIELDS: {
    id: 'custom-fields',
    isEnabled: (sandbox: Sandbox) => isNotBlockedByPayrollFirstGate(sandbox),
    supportedLists: [
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK,
      TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST,
    ],
    name: 'time-entries.section.title.custom-fields',
    isNew: true,
  },
  NOTIFICATION: {
    id: 'notification',
    name: 'time-entries.section.title.notifications',
    isNew: true,
  },
  BREAKS: {
    id: 'breaks',
    name: 'time-entries.section.title.breaks',
    isNew: false,
    enabled: true,
  },
  OVERTIME: {
    id: 'overtime',
    name: 'time-entries.section.title.overtime',
    isNew: true,
    enabled: true,
  },
  GEO_LOCATIONS: {
    id: 'geo-locations',
    name: 'time-entries.section.title.geo-locations',
    isNew: false,
    enabled: true,
  },
  APPROVALS: {
    id: 'approvals',
    name: 'time-entries.section.title.approvals',
    isNew: true,
    enabled: true,
  },
};
