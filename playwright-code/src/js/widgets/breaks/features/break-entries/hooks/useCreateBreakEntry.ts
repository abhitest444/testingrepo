import { useIntl, useSandbox } from '@payroll/quicksand';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useDispatch } from 'react-redux';
import { useCreateTimeEntry } from 'src/js/service/hooks/timeEntries/useCreateTimeEntry';
import {
  TimeTracking_TimeForType,
  TimeTracking_CreateTimeEntryInput,
} from 'src/__generated__/timeTracking/graphql';
import { Payroll_Break } from 'src/__generated__/oigql/graphql';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  mapQBTimezoneToDayjsTimezone,
  combineTimeAndDayjsForTimeEntries,
} from 'src/js/common/DateAndTimeUtils';
import { saveTimeEntryInput } from '../../../store/breakEntriesSlice';
import { BreakEntry } from '../../../types';
import { BREAK_LOGGING_CONSTANTS } from '../../../constants';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface UseCreateBreakEntryArgs {
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

export const useCreateBreakEntry = ({
  onSuccess,
  onError,
}: UseCreateBreakEntryArgs) => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const dispatch = useDispatch();
  const logger = useLoggingConfig();

  const handleSuccess = (timeEntries: any[]) => {
    logger.info(BREAK_LOGGING_CONSTANTS.SUCCESS.CREATE_BREAK_ENTRY_SUCCESS);
    onSuccess(timeEntries);
  };

  const handleError = (error: string) => {
    logger.error(BREAK_LOGGING_CONSTANTS.API_ERRORS.CREATE_BREAK_ENTRY_FAILED, {
      error,
    });
    onError(error);
  };

  const [createTimeEntry, { loading, error }] = useCreateTimeEntry({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const createBreakEntry = (breakEntryData: BreakEntry, assigneeId: string) => {
    const {
      breakRule,
      startDate,
      endDate,
      startTime,
      endTime,
      description,
      timezone,
      contact,
      useStartEndTime,
      duration,
      currentlyWorking,
    } = breakEntryData;

    // Convert form data to time entry format
    const timeEntryInput: TimeTracking_CreateTimeEntryInput = {
      // Required field
      timeFor: {
        id: assigneeId,
        timeForType: TimeTracking_TimeForType.Employee,
      },

      // Break-specific fields
      timeBreakId: breakRule,

      // Date field (always required)
      date: startDate.format('YYYY-MM-DD'),

      // Conditional fields based on mode and currentlyWorking status
      ...(useStartEndTime
        ? {
            // Start/End time mode: send startTime and endTime (only if not currently working)
            startTime: timezone
              ? combineTimeAndDayjsForTimeEntries(
                  startDate,
                  startTime || dayjs().hour(0).minute(0),
                  mapQBTimezoneToDayjsTimezone(timezone),
                )
              : dayjs(startDate)
                  .hour(startTime?.hour() || 0)
                  .minute(startTime?.minute() || 0)
                  .second(0)
                  .set('millisecond', 0)
                  .format('YYYY-MM-DDTHH:mm:ssZ'),
            ...(!currentlyWorking && {
              endTime: timezone
                ? combineTimeAndDayjsForTimeEntries(
                    endDate || startDate, // use endDate if it exists, otherwise use startDate
                    endTime || dayjs().hour(0).minute(0),
                    mapQBTimezoneToDayjsTimezone(timezone),
                  )
                : dayjs(endDate)
                    .hour(endTime?.hour() || 0)
                    .minute(endTime?.minute() || 0)
                    .second(0)
                    .set('millisecond', 0)
                    .format('YYYY-MM-DDTHH:mm:ssZ'),
            }),
          }
        : {
            // Duration mode: send duration (only if not currently working)
            ...(!currentlyWorking && {
              duration: duration || 0,
            }),
          }),
      isExported: false,
      // Optional fields
      notes: description,
      timeZone: timezone,
    };

    dispatch(saveTimeEntryInput(timeEntryInput));

    logger.info(
      BREAK_LOGGING_CONSTANTS.FORM_STATE.BREAK_ENTRY_FORM_SUBMISSION_STARTED,
      {
        breakEntryData,
        timeEntryInput,
        contact: contact
          ? { id: contact.id, name: contact.name, type: contact.type }
          : undefined,
      },
    );

    createTimeEntry({
      variables: {
        input: timeEntryInput,
      },
    });
  };

  return {
    createBreakEntry,
    loading,
    error,
  };
};
