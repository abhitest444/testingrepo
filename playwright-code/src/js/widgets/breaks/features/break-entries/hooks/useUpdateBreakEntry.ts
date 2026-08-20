import { useIntl, useSandbox } from '@payroll/quicksand';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useUpdateTimeEntry } from 'src/js/service/hooks/timeEntries/useUpdateTimeEntry';
import { TimeTracking_UpdateTimeEntryInput } from 'src/__generated__/timeTracking/graphql';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  mapQBTimezoneToDayjsTimezone,
  combineTimeAndDayjsForTimeEntries,
} from 'src/js/common/DateAndTimeUtils';
import { BreakEntry } from '../../../types';
import { BREAK_LOGGING_CONSTANTS } from '../../../constants';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface UseUpdateBreakEntryArgs {
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

export const useUpdateBreakEntry = ({
  onSuccess,
  onError,
}: UseUpdateBreakEntryArgs) => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const logger = useLoggingConfig();

  const handleSuccess = (timeEntries: any[]) => {
    logger.info(BREAK_LOGGING_CONSTANTS.SUCCESS.UPDATE_BREAK_ENTRY_SUCCESS);
    onSuccess(timeEntries);
  };

  const handleError = (error: string) => {
    logger.error(BREAK_LOGGING_CONSTANTS.API_ERRORS.UPDATE_BREAK_ENTRY_FAILED, {
      error,
    });
    onError(error);
  };

  const [updateTimeEntry, { loading, error }] = useUpdateTimeEntry({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const updateBreakEntry = (
    breakEntryData: BreakEntry,
    timeEntryId: string,
    version?: string,
  ) => {
    const {
      breakRule,
      startDate,
      startTime,
      endTime,
      description,
      timezone,
      contact,
      useStartEndTime,
      duration,
      currentlyWorking,
      endDate,
    } = breakEntryData;

    // Convert form data to time entry update format
    const timeEntryInput: TimeTracking_UpdateTimeEntryInput = {
      sparse: true,
      isExported: false,
      // Required field for update
      id: timeEntryId,
      // Break-specific fields
      ...(breakRule && { timeBreakId: breakRule }),

      // Date field (always required) - must be in YYYY-MM-DD format
      ...(startDate && { date: startDate.format('YYYY-MM-DD') }),

      // Conditional fields based on mode and currentlyWorking status
      ...(startTime && {
        // Start/End time mode: send startTime and endTime (only if not currently working)
        startTime: timezone
          ? combineTimeAndDayjsForTimeEntries(
              startDate,
              startTime,
              mapQBTimezoneToDayjsTimezone(timezone),
            )
          : dayjs(startDate)
              .hour(startTime.hour())
              .minute(startTime.minute())
              .second(0)
              .set('millisecond', 0)
              .format('YYYY-MM-DDTHH:mm:ssZ'),
        ...(!currentlyWorking &&
          endTime && {
            endTime: timezone
              ? combineTimeAndDayjsForTimeEntries(
                  endDate || startDate, // use endDate if it exists, otherwise use startDate
                  endTime,
                  mapQBTimezoneToDayjsTimezone(timezone),
                )
              : dayjs(endDate || startDate)
                  .hour(endTime.hour())
                  .minute(endTime.minute())
                  .second(0)
                  .set('millisecond', 0)
                  .format('YYYY-MM-DDTHH:mm:ssZ'),
          }),
      }),

      ...(!currentlyWorking &&
        duration &&
        !startTime && {
          // Duration mode: send duration (only if not currently working and there is no start time)
          duration,
        }),

      // Optional fields - only include if they have values
      ...(description && { notes: description }),
      ...(timezone && { timeZone: timezone }),
    };

    logger.info(
      BREAK_LOGGING_CONSTANTS.FORM_STATE
        .BREAK_ENTRY_EDIT_FORM_SUBMISSION_STARTED,
      {
        breakEntryData,
        timeEntryInput,
        contact: contact
          ? { id: contact.id, name: contact.name, type: contact.type }
          : undefined,
      },
    );

    updateTimeEntry({
      variables: {
        input: timeEntryInput,
      },
    });
  };

  return {
    updateBreakEntry,
    loading,
    error,
  };
};
