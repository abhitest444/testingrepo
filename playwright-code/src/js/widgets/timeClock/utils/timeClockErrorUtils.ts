// Handles error logic for clock in catch block
import { set } from 'date-fns';
import dayjs from 'dayjs';
import { useIntl } from '@payroll/quicksand';
import { getBrowserTimezone } from 'src/js/common/DateAndTimeUtils';

// Handles error for createTimeEntry mutation
import { mapTimeTrackingMutationError } from 'src/js/service/errors/timeTrackingErrors';
import {
  processTSheetSyncError,
  createTSheetSyncErrorHandler,
} from 'src/js/service/utils/tsheetErrorUtils';

type IntlShape = ReturnType<typeof useIntl>;

// Mirrors how STE (`useCreateTimeEntry`/`useUpdateTimeEntry`) and WTE
// (`useSaveWeeklyTimeEntries`) translate a TSheet sync error response into a
// user-facing message: first try to surface the cleaned `Details:` section,
// then fall back to the standard subCode/errorCode mapping (which itself
// falls back to the generic "Something went wrong" copy).
export function mapTSheetSyncErrorToMessage(
  errorResponse: {
    errorCode: string;
    message?: string | null;
    subCode?: string | null;
  },
  intl: IntlShape,
): string {
  const processed = processTSheetSyncError(errorResponse);
  const details = processed?.cleanedDetails || '';
  const handler = createTSheetSyncErrorHandler(intl, details);
  return handler(errorResponse.errorCode, errorResponse.subCode || undefined);
}

// Utility to extract and format required fields error message
export function extractRequiredFieldsErrorMessage(
  errorMessage: string,
): string | null {
  // Extract content after "Details:" including the required fields section
  const detailsPattern = /Details:\s*([\s\S]*)/i;
  const match = errorMessage.match(detailsPattern);

  if (match) {
    const detailsContent = match[1].replace('\\n', ' ').trim();
    // Clean up the content - replace newlines with <br> and normalize spacing
    const cleanedContent = detailsContent
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanedContent;
  }

  return null;
}

export function handleClockInError({
  error,
  formValues,
  sandbox,
  setShowSaveError,
}: any) {
  const errorMessage =
    error instanceof Error
      ? error?.message || 'Failed to clock in'
      : 'Failed to clock in';
  sandbox.logger.logException(
    '[ClockIn Flow] - TimeClockHOC - Error clocking in',
    new Error(`${errorMessage} and Payload is :${JSON.stringify(formValues)}`),
  );
  if (typeof setShowSaveError === 'function') setShowSaveError(errorMessage);
  // Optionally, add more error handling here if needed
}

export function handleClockOutSaveError({
  error,
  formValues,
  sandbox,
  showConfirmation,
  handleCancelClose,
  setShowConfirmation,
  setShowSaveError,
}: any) {
  const errorMessage =
    error instanceof Error ? error.message : 'Failed to save time entry';
  sandbox.logger.logException(
    '[ClockOut Flow] - TimeClockHOC - Error saving time entry',
    new Error(`${errorMessage} and Payload is :${JSON.stringify(formValues)}`),
  );
  if (typeof showConfirmation !== 'undefined' && showConfirmation) {
    if (typeof handleCancelClose === 'function') handleCancelClose();
    if (typeof setShowConfirmation === 'function') setShowConfirmation(false);
  }
  // Only show save error for unhandled errors
  if (areUnhandledErrors(errorMessage)) {
    if (typeof setShowSaveError === 'function') setShowSaveError(errorMessage);
  }
}

// Handles error logic for clock out catch block
export function handleClockOutError({
  error,
  formValues,
  sandbox,
  setShowSaveError,
}: any) {
  const errorMessage =
    error instanceof Error ? error.message : 'Failed to clock out';
  sandbox.logger.logException(
    '[ClockOut Flow] - TimeClockHOC - Error clocking out',
    new Error(`${errorMessage} and Payload is :${JSON.stringify(formValues)}`),
  );
  // Only show save error for unhandled errors
  if (areUnhandledErrors(errorMessage)) {
    if (typeof setShowSaveError === 'function') setShowSaveError(errorMessage);
  }
}

// Handles error logic for switch job catch block
export function handleSwitchJobError({
  error,
  formValues,
  sandbox,
  intl,
  timeClockFormMethods,
  setShowSaveError,
}: any) {
  const errorMessage =
    error instanceof Error ? error.message : 'Failed to switch jobs';
  sandbox.logger.logException(
    '[New Job Selected Flow] - TimeClockHOC - Error switching jobs',
    new Error(`${errorMessage} and Payload is :${JSON.stringify(formValues)}`),
  );
  let inlineError = false;
  // Check for specific error types and set form errors accordingly
  if (
    error instanceof Error &&
    error.message.includes(ERROR_FIELDS.SERVICE_ITEM)
  ) {
    if (notFoundPattern.test(errorMessage)) {
      timeClockFormMethods.setError('service', {
        type: 'custom',
        message: intl.formatMessage(
          { id: 'timeclock.error.field.not.found' },
          {
            field: intl.formatMessage({
              id: 'timeclock.field.service.item',
            }),
          },
        ),
      });
      inlineError = true;
    }
  }
  if (error instanceof Error && error.message.includes(ERROR_FIELDS.CLASS)) {
    if (notFoundPattern.test(errorMessage)) {
      timeClockFormMethods.setError('class', {
        type: 'custom',
        message: intl.formatMessage(
          { id: 'timeclock.error.field.not.found' },
          { field: intl.formatMessage({ id: 'timeclock.field.class' }) },
        ),
      });
      inlineError = true;
    }
  }
  if (
    error instanceof Error &&
    (error.message.includes(ERROR_CODES.CONFLICTING_START_END_TIME_ENTRY) ||
      error.message.includes(ERROR_CODES.CONFLICTING_TIME_ENTRY))
  ) {
    timeClockFormMethods.setError('startTime', {
      type: 'custom',
      message: intl.formatMessage({
        id: 'timeclock.error.future.time.conflict',
      }),
    });
    inlineError = true;
  }
  // For all other error cases, show mapped error at top of drawer
  if (!inlineError && typeof setShowSaveError === 'function') {
    const requiredFieldsMsg = extractRequiredFieldsErrorMessage(errorMessage);
    if (requiredFieldsMsg) {
      setShowSaveError(requiredFieldsMsg);
      throw new Error(requiredFieldsMsg);
    } else {
      // If not matching required fields pattern, fallback to generic error
      setShowSaveError(
        error.message === ERROR_CODES.CONFLICTING_END_TIME_ENTRY_MESSAGE
          ? intl.formatMessage({
              id: 'timeclock.error.conflictingEndTimeEntry',
            })
          : mapTimeTrackingMutationError(
              intl,
              error?.errorCode,
              error?.subCode,
            ),
      );
    }
  } else {
    setShowSaveError('');
  }
}

// Handles error logic for break end operations
export function handleBreakEndTimeError({
  error,
  intl,
  sandbox,
  setShowSaveError,
}: any) {
  sandbox.logger.logException(
    '[Break Flow] - TimeClockHOC - Error ending break',
    error as Error,
  );

  // Check if this is a CONFLICTING_END_TIME_ENTRY error
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = (error as Error).message;
    if (
      errorMessage.includes('CONFLICTING_END_TIME_ENTRY') ||
      errorMessage === 'timeclock.error.conflictingEndTimeEntry' ||
      errorMessage.includes('End time conflicts with other timesheets')
    ) {
      setShowSaveError(
        intl.formatMessage({
          id: 'timeclock.error.conflictingEndTimeEntry',
        }),
      );
    } else {
      // For other errors, show the actual error message or fallback
      setShowSaveError(
        errorMessage ||
          intl.formatMessage({ id: 'timeclock.error.break.end.failed' }),
      );
    }
  } else {
    setShowSaveError(
      intl.formatMessage({ id: 'timeclock.error.break.end.failed' }),
    );
  }
}

// Checks if the selected start time is in the future
export function checkIfStartTimeIsInFuture(
  timeClockFormMethods: any,
  sandbox: any,
  intl: any,
): boolean {
  const startDate = timeClockFormMethods.watch('startDate');
  const startTime = timeClockFormMethods.watch('startTime');
  if (startDate && startTime) {
    const selectedDateTime = startDate
      .tz(getBrowserTimezone())
      .hour(startTime.hour())
      .minute(startTime.minute());
    const now = dayjs().tz(getBrowserTimezone());
    if (selectedDateTime.isAfter(now)) {
      sandbox.logger.logException(
        '[CLOCK_IN_FLOW] - ClockInView - Selected date time is in future',
        new Error(JSON.stringify({ selectedDateTime, now })),
      );
      timeClockFormMethods.setError('startTime', {
        type: 'custom',
        message: intl.formatMessage({
          id: 'timeclock.error.future.time',
        }),
      });
      return true;
    }
  }
  return false;
}
// Regex for not found error
export const notFoundPattern = /(.+?) with id:\s*\d+\s*not found/i;

// Checks if error message is an unhandled error
export function areUnhandledErrors(errorMessage: string, intl?: any) {
  // If intl is provided, use it for i18n error messages
  const conflicting = intl
    ? intl.formatMessage({ id: 'timeclock.error.conflictingTimeEntry' })
    : 'timeclock.error.conflictingTimeEntry';
  const required = intl
    ? intl.formatMessage({ id: 'timeclock.error.required.fields' })
    : 'timeclock.error.required.fields';
  return (
    errorMessage !== conflicting &&
    errorMessage !== required &&
    errorMessage !== ERROR_FIELDS.CLASS &&
    errorMessage !== ERROR_FIELDS.SERVICE_ITEM
  );
}

// Handles generic error details for UI (moved from HOC)
export function getErrorDetails(
  employeeError: any,
  timeEntriesError: any,
  todayError: any,
  weekError: any,
  settingsError: any,
  v3PreferencesError: any,
) {
  if (employeeError) {
    return {
      title: 'timeclock.error.employee.load.title',
      message: 'timeclock.error.employee.load.message',
    };
  }
  if (timeEntriesError) {
    return {
      title: 'timeclock.error.timeentries.load.title',
      message: 'timeclock.error.timeentries.load.message',
    };
  }
  if (todayError || weekError) {
    return {
      title: 'timeclock.error.duration.load.title',
      message: 'timeclock.error.duration.load.message',
    };
  }
  if (settingsError) {
    return {
      title: 'timeclock.error.settings.load.title',
      message: 'timeclock.error.settings.load.message',
    };
  }
  if (v3PreferencesError) {
    return {
      title: 'timeclock.error.v3preferences.load.title',
      message: 'timeclock.error.v3preferences.load.message',
    };
  }
  return {
    title: 'timeclock.error.generic.error.header',
    message: 'timeclock.error.generic.error.details',
  };
}
// timeClockErrorUtils.ts
// Utility functions for error handling in TimeClockHOC

export const ERROR_CODES = {
  CONFLICTING_TIME_ENTRY: 'CONFLICTING_TIME_ENTRY',
  CONFLICTING_START_END_TIME_ENTRY: 'CONFLICTING_START_END_TIME_ENTRY',
  CONFLICTING_END_TIME_ENTRY: 'CONFLICTING_END_TIME_ENTRY',
  ALREADY_CLOCKED_IN: 'ALREADY_CLOCKED_IN',
  ALREADY_CLOCKED_IN_OR_CONFLICTING_TIME_ENTRY_OR_TIME_IN_FUTURE:
    'ALREADY_CLOCKED_IN_OR_CONFLICTING_TIME_ENTRY_OR_TIME_IN_FUTURE',
  TSHEET_SYNC_FAILED_FOR_UPDATE_TIMESHEET:
    'TSHEET_SYNC_FAILED_FOR_UPDATE_TIMESHEET',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  CONFLICTING_END_TIME_ENTRY_MESSAGE:
    'End time conflicts with other timesheets.',
};

export const ERROR_FIELDS = {
  CLASS: 'Class',
  SERVICE_ITEM: 'Service Item',
};

export const ERROR_MESSAGES = {
  FAILED_TO_CLOCK_IN: 'Failed to clock in',
  FAILED_TO_UPDATE: 'Failed to update time entry',
  FAILED_TO_SAVE: 'Failed to save time entry',
  FAILED_TO_CLOCK_OUT: 'Failed to clock out',
  FAILED_TO_SWITCH_JOBS: 'Failed to switch jobs',
  FAILED_TO_CREATE_ENTRY: 'Failed to create new time entry',
  NO_TIME_ENTRIES: 'No time entries found after creation',
  FAILED_TO_FETCH: 'Failed to fetch time entries',
};

export function handleCreateTimeEntryError(
  error: any,
  intl: any,
  timeClockFormMethods: any,
  showToastMessage: (msg: string) => void,
  sandbox: any,
  formValues: any,
  setErrorMessage?: (msg: string) => void,
) {
  if (!error) return;
  if ('errorCode' in error) {
    if (
      error.errorCode === ERROR_CODES.CONFLICTING_TIME_ENTRY ||
      error.errorCode === ERROR_CODES.CONFLICTING_START_END_TIME_ENTRY ||
      error.errorCode ===
        ERROR_CODES.ALREADY_CLOCKED_IN_OR_CONFLICTING_TIME_ENTRY_OR_TIME_IN_FUTURE
    ) {
      sandbox.logger.logException(
        '[CLOCK_IN_FLOW] - ClockInView - Conflicting time entry',
        new Error(JSON.stringify({ error })),
      );
      timeClockFormMethods.setError('startTime', {
        type: 'custom',
        message: intl.formatMessage({
          id: 'timeclock.error.future.time.conflict',
        }),
      });
      throw new Error(
        intl.formatMessage({ id: 'timeclock.error.conflictingTimeEntry' }),
      );
    }
    if (error.errorCode === ERROR_CODES.ALREADY_CLOCKED_IN) {
      showToastMessage(
        formValues?.startTime?.format
          ? formValues.startTime.format('h:mm A')
          : intl.formatMessage({ id: 'timeclock.error.alreadyClockedIn' }),
      );
      sandbox.logger.logException(
        '[CLOCK_IN_FLOW] - ClockInView - Already clocked in',
        new Error(JSON.stringify({ error })),
      );
      throw new Error(error.errorCode);
    }
    // For all other error codes, show mapped error at top of drawer
    if (typeof setErrorMessage === 'function') {
      const requiredFieldsMsg = extractRequiredFieldsErrorMessage(
        error?.message,
      );
      if (requiredFieldsMsg) {
        setErrorMessage(requiredFieldsMsg);
        throw new Error(requiredFieldsMsg);
      }
      const mappedMessage =
        error.message === ERROR_CODES.CONFLICTING_END_TIME_ENTRY_MESSAGE
          ? intl.formatMessage({
              id: 'timeclock.error.conflictingEndTimeEntry',
            })
          : mapTSheetSyncErrorToMessage(error, intl);
      setErrorMessage(mappedMessage);
      throw new Error(mappedMessage);
    }
    throw new Error(error.errorCode);
  }
  // If error is not an object with errorCode, show generic error
  // if (typeof setErrorMessage === 'function') {
  //   setErrorMessage(mapTimeTrackingMutationError(intl, error?.message || 'GENERAL_ERROR', error?.subCode));
  // }
}

// Handles error for updateTimeEntry mutation
export function handleUpdateTimeEntryError(
  result: any,
  intl: any,
  timeClockFormMethods: any,
  sandbox: any,
  setShowSaveError: (v: string) => void,
) {
  if (!result) return;
  if ('errorCode' in result) {
    if (
      result.errorCode === ERROR_CODES.CONFLICTING_TIME_ENTRY ||
      result.errorCode === ERROR_CODES.CONFLICTING_START_END_TIME_ENTRY
    ) {
      sandbox.logger.logException(
        '[CLOCK_IN_FLOW] - ClockInView - Conflicting time entry',
        new Error(JSON.stringify(result)),
      );
      timeClockFormMethods.setError('startTime', {
        type: 'custom',
        message: intl.formatMessage({
          id: 'timeclock.error.future.time.conflict',
        }),
      });
      throw new Error(
        intl.formatMessage({ id: 'timeclock.error.conflictingTimeEntry' }),
      );
    }
    if (result.errorCode === ERROR_CODES.CONFLICTING_END_TIME_ENTRY) {
      sandbox.logger.logException(
        '[CLOCK_IN_FLOW] - ClockInView - Conflicting time entry',
        new Error(JSON.stringify(result)),
      );
      throw new Error(
        intl.formatMessage({ id: 'timeclock.error.conflictingEndTimeEntry' }),
      );
    }
    if (
      result.errorCode ===
        ERROR_CODES.TSHEET_SYNC_FAILED_FOR_UPDATE_TIMESHEET &&
      result.message
    ) {
      sandbox.logger.logException(
        '[CLOCK_IN_FLOW] - ClockInView - Missing required fields',
        new Error(JSON.stringify(result)),
      );
      const errorMessage = result.message;
      const notFoundPattern = /(.+?) with id:\s*\d+\s*not found/i;

      // Handle "not found" errors
      if (errorMessage.includes(ERROR_FIELDS.CLASS)) {
        if (notFoundPattern.test(errorMessage)) {
          timeClockFormMethods.setError('class', {
            type: 'custom',
            message: intl.formatMessage(
              { id: 'timeclock.error.field.not.found' },
              {
                field: intl.formatMessage({ id: 'timeclock.field.class' }),
              },
            ),
          });
          setShowSaveError('');
        }
      }
      if (errorMessage.includes(ERROR_FIELDS.SERVICE_ITEM)) {
        if (notFoundPattern.test(errorMessage)) {
          timeClockFormMethods.setError('service', {
            type: 'custom',
            message: intl.formatMessage(
              { id: 'timeclock.error.field.not.found' },
              {
                field: intl.formatMessage({ id: 'timeclock.field.service' }),
              },
            ),
          });
          setShowSaveError('');
        }
      }

      // Handle "Missing required fields" errors
      if (errorMessage.includes('Missing required fields:')) {
        timeClockFormMethods.setError('class', {
          type: 'custom',
          message: errorMessage,
        });
        timeClockFormMethods.setError('service', {
          type: 'custom',
          message: errorMessage,
        });
        setShowSaveError('');
        return;
      }

      // Only check for the required fields pattern
      const requiredFieldsMsg = extractRequiredFieldsErrorMessage(errorMessage);
      if (requiredFieldsMsg) {
        setShowSaveError(requiredFieldsMsg);
        throw new Error(requiredFieldsMsg);
      }
      const mappedMessage =
        result.message === ERROR_CODES.CONFLICTING_END_TIME_ENTRY_MESSAGE
          ? intl.formatMessage({
              id: 'timeclock.error.conflictingEndTimeEntry',
            })
          : mapTSheetSyncErrorToMessage(result, intl);
      setShowSaveError(mappedMessage);
      throw new Error(mappedMessage);
    }
    throw new Error(result?.message);
  }
}

// Handles generic error details for UI
export function getTimeClockErrorDetails(
  employeeError: any,
  timeEntriesError: any,
  todayError: any,
  weekError: any,
  settingsError: any,
  v3PreferencesError: any,
) {
  if (employeeError) {
    return {
      title: 'timeclock.error.employee.error.header',
      message: 'timeclock.error.employee.error.details',
    };
  }
  if (timeEntriesError) {
    return {
      title: 'timeclock.error.timeentries.error.header',
      message: 'timeclock.error.timeentries.error.details',
    };
  }
  if (todayError || weekError) {
    return {
      title: 'timeclock.error.duration.error.header',
      message: 'timeclock.error.duration.error.details',
    };
  }
  if (settingsError) {
    return {
      title: 'timeclock.error.settings.error.header',
      message: 'timeclock.error.settings.error.details',
    };
  }
  if (v3PreferencesError) {
    return {
      title: 'timeclock.error.preferences.error.header',
      message: 'timeclock.error.preferences.error.details',
    };
  }
  return {
    title: 'timeclock.error.generic.error.header',
    message: 'timeclock.error.generic.error.details',
  };
}
