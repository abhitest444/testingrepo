import { ApolloError } from '@apollo/client';

export type TimeTrackingErrors = {
  [key: string]: string;
};

// list of error codes that can be returned
// but should not end in customer interaction failure
export const EXPECTED_USER_ERRORS: string[] = [
  'BILLABLE_REQUIRES_CUSTOMER',
  'START_AND_END_TIME_REQUIRED_WHEN_ONE_PRESENT',
  'START_TIME_MUST_BE_BEFORE_END_TIME',
  'CUSTOMER_CURRENCY_MUST_MATCH_COMPANY_CURRENCY',
  'SALES_MUST_HAVE_CUSTOMER',
  'NO_SERVICE_ITEM',
  'TT_DURATION_NOT_MATCHED',
  'TT_BREAK_DURATION_INVALID',
  'START_END_TIME_AND_DURATION_CANNOT_BE_PROVIDED_TOGETHER',
  'START_END_TIME_OR_DURATION_REQUIRED',
  'DURATION_MUST_BE_LESS_THAN_9999_HOURS',
  'DURATION_MUST_BE_LESS_THAN_24_HOURS',
  'BREAK_DURATION_MUST_BE_LESS_THAN_9999',
  'BREAK_DURATION_INVALID_OR_LESS_THAN_ZERO',
  'CONFLICTING_TIME_ENTRY',
  'CONFLICTING_END_TIME_ENTRY',
  'TIME_FOR_ID_MISSING',
  'START_END_TIME_OR_DURATION_MISSING',
  'MANUAL_RULE_NOT_DEFINED',
  'INVALID_BREAK_DURATION',
  'UNEXPECTED_NUMBER_OF_PROFILES',
  'ACTIVITY_DATE_BEFORE_CLOSEDBOOKSDATE_PASSWORD_REQUIRED',
  'ACTIVITY_DATE_BEFORE_CLOSEDBOOKSDATE_WARNING',
  'ACTIVITY_DATE_BEFORE_CLOSEDBOOKSDATE_PASSWORD_INCORRECT',
  'SERVICE_ITEM_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
  'SERVICE_ITEM_NOT_FOUND',
  'CUSTOMER_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
  'CUSTOMER_NOT_FOUND',
  'VENDOR_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
  'VENDOR_NOT_FOUND',
  'EMPLOYEE_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE',
  'EMPLOYEE_NOT_FOUND',
  'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
  'RATE_MUST_BE_ZERO',
  'TIME_ACTIVITY_NOT_FOUND_ID_',
  'You need to add a service item to this time entry. Click on the settings gear and select Service to access the field.',
  'You must choose a employee or vendor that uses local currency when time is billable.',
  'Start time must be before End time.',
  'START_OR_END_TIME_IN_FUTURE',
  'END_TIME_IN_FUTURE',
  'CONFLICTING_START_TIME_ENTRY',
  'CONFLICTING_START_END_TIME_ENTRY',
  'GENERAL_V3_ERROR',
  'GENERAL_V1_ERROR',
  'TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET',
];

export const TIME_TRACKING_MUTATION_ERRORS: TimeTrackingErrors = {
  GENERAL_ERROR: 'catch.all.error.content',
  WORKER_NOT_FOUND: 'permissions.error.workerNotFound',
  PERMISSION_DENIED: 'permissions.error.permissionDenied',
  INVALID_INPUT: 'permissions.error.invalidInput',
  BILLABLE_REQUIRES_CUSTOMER: 'time.tracking.validation.customer.required',
  START_AND_END_TIME_REQUIRED_WHEN_ONE_PRESENT:
    'time.tracking.validation.start.and.end.required',
  START_TIME_MUST_BE_BEFORE_END_TIME:
    'time.tracking.validation.start.before.end',
  CUSTOMER_CURRENCY_MUST_MATCH_COMPANY_CURRENCY:
    'time.tracking.validation.same.currency',
  SALES_MUST_HAVE_CUSTOMER: 'time.tracking.validation.customer.required',
  NO_SERVICE_ITEM: 'time.tracking.validation.service.item.required',
  TT_DURATION_NOT_MATCHED: 'time.tracking.validation.duration.required',
  CONFLICTING_START_TIME_ENTRY:
    'time.tracking.validation.conflicting.start.end.time.entry',
  CONFLICTING_START_END_TIME_ENTRY:
    'time.tracking.validation.conflicting.start.end.time.entry',
  START_OR_END_TIME_IN_FUTURE:
    'time.tracking.validation.start.or.end.time.in.future',
  END_TIME_IN_FUTURE: 'time.tracking.validation.end.time.in.future',
  TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH:
    'time.tracking.validation.edit.sequence.mismatch',
  ACTIVITY_DATE_BEFORE_CLOSEDBOOKSDATE_PASSWORD_INCORRECT:
    'time.tracking.validation.closed.books.password.incorrect',
  SERVICE_ITEM_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE:
    'time.tracking.validation.service.item.deleted',
  SERVICE_ITEM_NOT_FOUND: 'time.tracking.validation.service.item.deleted',
  CUSTOMER_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE:
    'time.tracking.validation.customer.deleted',
  CUSTOMER_NOT_FOUND: 'time.tracking.validation.customer.deleted',
  VENDOR_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE:
    'time.tracking.validation.worker.deleted',
  VENDOR_NOT_FOUND: 'time.tracking.validation.worker.deleted',
  EMPLOYEE_ASSIGNED_IS_DELETED_AND_TIME_ACTIVITY_IS_BILLABLE:
    'time.tracking.validation.worker.deleted',
  EMPLOYEE_NOT_FOUND: 'time.tracking.validation.worker.deleted',
  INVOICED_TIME_ACTIVITY_DELETE: 'time.tracking.validation.invoiced.delete',
  ALREADY_CLOCKED_IN: 'time.tracking.validation.already.clocked.in.user',
  CLOCKIN_START_TIME_IN_FUTURE:
    'time.tracking.validation.clockin.start.time.in.future',
  PARTIAL_SUCCESS: 'time-entries.validation.partial.success',
  MUTATION_FAILED: 'time-entries.validation.mutation.fail',
  TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET:
    'time.tracking.validation.tsheet.sync.failed',
  TSHEET_SYNC_FAILED_FOR_CREATE_UPDATE_TIMESHEET:
    'time.tracking.validation.tsheet.sync.failed',
  TSHEET_SYNC_FAILED_FOR_DELETE_TIMESHEET:
    'time.tracking.validation.tsheet.sync.failed',
  MANUAL_MODE_NOT_ALLOWED: 'create.break.entry.manual.not.allowed',
  BREAK_RULE_NOT_FOUND: 'time.tracking.validation.break.rule.not.found',
  TT_BREAK_DURATION_INVALID: 'time.tracking.validation.break.duration.invalid',
  START_END_TIME_AND_DURATION_CANNOT_BE_PROVIDED_TOGETHER:
    'time.tracking.validation.start.end.time.and.duration.cannot.be.provided.together',
  START_END_TIME_OR_DURATION_REQUIRED:
    'time.tracking.validation.start.end.time.or.duration.required',
  DURATION_MUST_BE_LESS_THAN_9999_HOURS:
    'time.tracking.validation.duration.must.be.less.than.9999.hours',
  BREAK_DURATION_MUST_BE_LESS_THAN_9999:
    'time.tracking.validation.break.duration.must.be.less.than.9999',
  BREAK_DURATION_INVALID_OR_LESS_THAN_ZERO:
    'time.tracking.validation.break.duration.invalid.or.less.than.zero',
  CONFLICTING_TIME_ENTRY: 'time.tracking.validation.conflicting.time.entry',
  CONFLICTING_END_TIME_ENTRY:
    'time.tracking.validation.conflicting.end.time.entry',
  TIME_FOR_ID_MISSING: 'time.tracking.validation.time.for.id.missing',
  START_END_TIME_OR_DURATION_MISSING:
    'time.tracking.validation.start.end.time.or.duration.missing',
  MANUAL_RULE_NOT_DEFINED: 'time.tracking.validation.manual.rule.not.defined',
  INVALID_BREAK_DURATION: 'time.tracking.validation.invalid.break.duration',
  DURATION_MUST_BE_LESS_THAN_24_HOURS:
    'time.tracking.validation.total.duration.exceeds.24.hours',
  NOTES_UPDATE_NOT_ALLOWED: 'time.tracking.validation.notes.update.not.allowed',
  INVALID_SUBMIT_MESSAGE_LENGTH:
    'time.tracking.validation.invalid.submit.message.length',
  BLANK_SUBMIT_MESSAGE: 'time.tracking.validation.blank.submit.message',

  // SubError codes - To be removed once we have a proper mapping for all subError codes in quantum leap
  9403: 'time.entry.error.user.not.allowed.to.track.time',
  9406: 'time.entry.error.time.entry.create.in.approved.timerange',
  9409: 'time.entry.error.timesheet.locked',
  9417: 'time.tracking.validation.required.fields.missing',
  // ------------------------------------------------------------
};

export const isExpectedError = (error: string | ApolloError | undefined) => {
  const errorMsg = error instanceof ApolloError ? error.message : error;
  return EXPECTED_USER_ERRORS.some((expectedError) =>
    String(errorMsg).includes(expectedError),
  );
};

export const mapTimeTrackingMutationError = (
  intl: any,
  error: string,
  subCode?: string,
): string => {
  // First try to map the main error code
  const errorMapping = TIME_TRACKING_MUTATION_ERRORS[error];
  if (errorMapping) {
    return intl.formatMessage({ id: errorMapping });
  }

  // If no mapping found for errorCode and subCode is provided, try to map against subCode
  if (subCode && TIME_TRACKING_MUTATION_ERRORS[subCode]) {
    return intl.formatMessage({ id: TIME_TRACKING_MUTATION_ERRORS[subCode] });
  }

  // Default to general error if no mapping found
  return intl.formatMessage({
    id: TIME_TRACKING_MUTATION_ERRORS.GENERAL_ERROR,
  });
};
