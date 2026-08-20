import { v4 as uuidv4 } from 'uuid';
import { Sandbox } from 'src/js/common/sandbox';
import { buildHeaders } from 'src/js/service/ApolloClientBuilderUtils';

const BASE_BREAK_URL =
  'https://policiesweb-e2e.api.intuit.com/v2/company/{company_account_id}/policies/breaks';
/**
 * Enum for break types
 */
export enum BreakType {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
}

/**
 * Enum for duration units
 */
export enum DurationUnit {
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
  minutes = 'minutes',
  hours = 'hours',
}

/**
 * Enum for break position
 */
export enum BreakPosition {
  START = 'START',
  MIDDLE = 'MIDDLE',
  END = 'END',
}

/**
 * Enum for work days
 */
export enum WorkDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

/**
 * Interface for Auto Break Rule
 */
export interface AutoRule {
  shiftThresholdLimit: number;
  durationUnit: DurationUnit.minutes | DurationUnit.hours;
  repeatBreak: boolean;
  breakPosition: BreakPosition;
  workDays: WorkDay[];
}

/**
 * Interface for Manual Break Rule
 */
export interface ManualRule {
  durationUnit: DurationUnit.MINUTES | DurationUnit.HOURS;
  autoEndBreak: boolean;
  allowEndBreakEarly: boolean;
  minRequiredBreakMinutes: number;
  breakEndingReminder: boolean;
  breakEndingReminderTime: number;
}

/**
 * Interface for Create Break Rule Payload
 * At least one of autoRule or manualRule must be present.
 */
export type CreateBreakRulePayload =
  | (BaseCreateBreakRulePayload & {
      autoRule: AutoRule;
      manualRule?: ManualRule;
    })
  | (BaseCreateBreakRulePayload & {
      manualRule: ManualRule;
      autoRule?: AutoRule;
    });

export interface BaseCreateBreakRulePayload {
  companyAccountId: string;
  ruleName: string;
  active: boolean;
  breakType: BreakType;
  isManualBreak: boolean;
  isAutoBreak: boolean;
  noSetDuration: boolean;
  breakDuration: number;
  durationUnit: DurationUnit;
}

export interface BreakRuleManualRule {
  durationUnit: 'MINUTES' | 'HOURS';
  autoEndBreak: boolean;
  allowEndBreakEarly: boolean;
  minRequiredBreakMinutes: number;
  breakEndingReminder: boolean;
  breakEndingReminderTime: number;
}

export interface BreakRuleAutoRule {
  shiftThresholdLimit: number;
  durationUnit: 'minutes' | 'hours';
  repeatBreak: boolean;
  breakPosition: 'START' | 'MIDDLE' | 'END';
  specificTime: string | null;
  workDays: string[];
}

export interface EmployerBreakRule {
  companyAccountId: string;
  breakRuleId: string;
  ruleName: string;
  active: boolean;
  breakType: 'PAID' | 'UNPAID';
  isManualBreak: boolean;
  isAutoBreak: boolean;
  noSetDuration: boolean;
  breakDuration: number;
  durationUnit: 'minutes' | 'hours';
  manualRule?: BreakRuleManualRule;
  autoRule?: BreakRuleAutoRule;
  version: number | null;
  creatorId: string;
  createdDate: string;
  modifierId: string;
  modifiedDate: string;
  manualBreak: boolean;
  autoBreak: boolean;
}

export interface PageableSort {
  orders: any[];
  empty: boolean;
  unsorted: boolean;
  sorted: boolean;
}

export interface Pageable {
  page: number;
  size: number;
  sort: PageableSort;
  offset: number;
  pageSize: number;
  pageNumber: number;
  paged: boolean;
  unpaged: boolean;
}

export interface GetAllEmployerBreakRulesResponse {
  data: {
    content: EmployerBreakRule[];
    pageable: Pageable;
    total: number;
    last: boolean;
    totalPages: number;
    totalElements: number;
    first: boolean;
    size: number;
    number: number;
    sort: PageableSort;
    numberOfElements: number;
    empty: boolean;
  };
  errors: any;
}

/**
 * Replaces '{company_account_id}' in the given URL with the actual company id from the sandbox.
 * @param baseUrl The URL containing '{company_account_id}'
 * @param sandbox The sandbox object to extract the company id from
 * @returns The URL with the company id substituted
 */
export function createBaseBreaksApiUrl(sandbox: Sandbox): {
  url: string;
  options: RequestInit;
} {
  const realmId = sandbox.appContext.getRealmInfo()?.realmId || 'DEFAULT_REALM';
  const intuit_tid = uuidv4().toString();
  const options: RequestInit = {
    method: 'GET',
    headers: {
      ...buildHeaders(sandbox),
      intuit_tid,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };
  return {
    url: BASE_BREAK_URL.replace('{company_account_id}', realmId),
    options,
  };
}

export const getAllEmployerBreakRules = async (
  sandbox: Sandbox,
): Promise<GetAllEmployerBreakRulesResponse> => {
  const { url, options } = createBaseBreaksApiUrl(sandbox);
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch break rules: ${response.status} ${response.statusText}`,
    );
  }
  const data = await response.json();
  return data;
};

/**
 * Creates a new break policy for a company.
 * @param sandbox The sandbox object to extract the company id from
 * @param breakPolicy The EmployerBreakDTO object containing policy details
 * @returns The created EmployerBreakDTO with its newly generated employer_break_id
 */
export const createBreakPolicy = async (
  sandbox: Sandbox,
  createEmployerBreakPolicyPayload: CreateBreakRulePayload,
) => {
  const { url, options } = createBaseBreaksApiUrl(sandbox);
  const postOptions: RequestInit = {
    ...options,
    method: 'POST',
    body: JSON.stringify(createEmployerBreakPolicyPayload),
  };
  const response = await fetch(url, postOptions);
  if (!response.ok) {
    throw new Error(`Failed to create break policy: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};
