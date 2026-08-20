/**
 * Overtime table column configuration
 */
import type { OvertimeTableColumn } from '../types/Overtime.types';

// Re-export type for backward compatibility
export type { OvertimeTableColumn } from '../types/Overtime.types';

export const OVERTIME_TABLE_COLUMNS: OvertimeTableColumn[] = [
  {
    key: 'policy',
    translationId: 'overtime.table.column.policy',
    defaultMessage: 'Policy',
  },
  {
    key: 'workers',
    translationId: 'overtime.table.column.workers',
    defaultMessage: 'Assigned to',
  },
  {
    key: 'rules',
    translationId: 'overtime.table.column.rules',
    defaultMessage: 'Rules',
  },
  {
    key: 'actions',
    translationId: 'overtime.table.column.actions',
    defaultMessage: 'Actions',
  },
];

/**
 * Overtime table action values
 */
export const OVERTIME_TABLE_ACTIONS = {
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

/**
 * Overtime pagination configuration
 * Note: Page size is defined in useOvertimePolicies hook as OVERTIME_POLICIES_PAGE_SIZE
 */
export const OVERTIME_PAGINATION_CONFIG = {
  LABEL_TRANSLATION_ID: 'overtime.pagination.label',
  LABEL_DEFAULT_MESSAGE: 'policies',
} as const;

export const OVERTIME_URLS = {
  LEARN_MORE:
    'https://quickbooks.intuit.com/learn-support/en-us/help-article/feature-preferences/configure-change-advanced-overtime-settings-time/L7vozE5kS_US_en_US',
  CHECK_LAWS_BY_STATE: 'https://www.dol.gov/agencies/whd/state',
} as const;
