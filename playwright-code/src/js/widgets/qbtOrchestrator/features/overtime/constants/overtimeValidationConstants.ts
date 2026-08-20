/**
 * Validation constants for overtime policy forms
 */

export const POLICY_NAME_VALIDATION = {
  MAX_LENGTH: 255,
  ERROR_TOO_LONG: {
    id: 'max.length.error',
    defaultMessage: 'Exceeds max length',
  },
} as const;

/**
 * Status codes returned by overtime mutation responses that should be treated
 * as degraded (user-actionable) rather than outright failures.
 * Keys are stringified because GraphQL may deliver them as numbers at runtime.
 */
export const OVERTIME_DEGRADED_STATUS_CODES = new Set<string>([
  '9403',
  '9404',
  '9410',
  '9411',
  '9412',
  '9413',
  '9420',
  '9421',
  '9422',
  '9423',
  '9424',
  '9426',
  '9427',
  '9430',
  '9431',
  '9432',
  '9433',
  '9440',
  '9441',
  '9442',
  '9450',
  '9451',
  '9460',
  '9461',
  '9462',
  '9463',
  '9470',
]);

const GENERIC_DEGRADED_MESSAGE = {
  id: 'overtime.api.error.generic',
  defaultMessage: 'Something went wrong. Please try again.',
} as const;

const OVERTIME_CUSTOM_STATUS_CODE_MESSAGES: Record<
  string,
  { id: string; defaultMessage: string }
> = {
  '9463': {
    id: 'overtime.error.missing_payroll_item',
    defaultMessage:
      'Create a "Double Overtime Pay" pay type before setting up an overtime policy.',
  },
};

/**
 * Returns the user-facing i18n message descriptor for a given overtime
 * mutation status code. Known codes with custom messages get their specific
 * descriptor; all other degraded codes fall back to the generic message.
 */
export function getOvertimeStatusCodeMessage(statusCode: string): {
  id: string;
  defaultMessage: string;
} {
  return (
    OVERTIME_CUSTOM_STATUS_CODE_MESSAGES[statusCode] ?? GENERIC_DEGRADED_MESSAGE
  );
}
