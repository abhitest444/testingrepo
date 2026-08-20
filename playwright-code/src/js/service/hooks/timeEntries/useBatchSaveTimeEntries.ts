import { useCallback, useRef } from 'react';
import { ApolloError } from '@apollo/client';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  BatchSaveTimeEntriesMutation,
  BatchSaveTimeEntriesMutationHookResult,
  TimeTracking_BatchManageTimeEntriesPayload,
  useBatchSaveTimeEntriesMutation,
} from 'src/__generated__/timeTracking/graphql';
import {
  TIME_SUMMARY_API_OPERATION,
  TIME_SUMMARY_API_STATUS,
  TIME_TRACKING_HEADERS,
  type TimeSummaryApiOperation,
  type TimeSummaryApiStatus,
} from 'src/js/common/constants';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import {
  logTimeSummaryTimeActivityApiConsumption,
  TIME_SUMMARY_API_NAMES,
} from 'src/js/service/utils/timeSummaryHeaderUtils';
import {
  endInteractionWithFailure,
  endInteractionWithSuccess,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  isExpectedError,
  mapTimeTrackingMutationError,
} from 'src/js/service/errors/timeTrackingErrors';

const TIME_SUMMARY_TA_HEADER_SENTINEL: Record<string, string> = {
  [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
};

// maps the interaction to the corresponding time summary api operation
function timeSummaryOperationFromInteraction(
  interaction?: TimeCustomerInteraction,
): TimeSummaryApiOperation | null {
  switch (interaction) {
    case TimeCustomerInteraction.SINGLE_TIME_CREATE:
      return TIME_SUMMARY_API_OPERATION.CREATE;
    case TimeCustomerInteraction.SINGLE_TIME_UPDATE:
      return TIME_SUMMARY_API_OPERATION.UPDATE;
    case TimeCustomerInteraction.SINGLE_TIME_DELETE:
      return TIME_SUMMARY_API_OPERATION.DELETE;
    case TimeCustomerInteraction.WEEKLY_TIME_SAVE:
      return TIME_SUMMARY_API_OPERATION.UPDATE;
    default:
      return null;
  }
}

export interface UseBatchSaveTimeEntriesArgs {
  onSuccess: (data: TimeTracking_BatchManageTimeEntriesPayload) => void;
  onError: (
    error: string,
    element?: string,
    meta?: {
      errorCode?: string;
      subCode?: string;
      message?: string;
      details?: string;
    },
  ) => void;
  // Interaction to trace the result to or undefined to not track an interaction
  interaction?: TimeCustomerInteraction;
}

export const useBatchSaveTimeEntries = ({
  onSuccess,
  onError,
  interaction,
}: UseBatchSaveTimeEntriesArgs): BatchSaveTimeEntriesMutationHookResult => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const loggingConfigLogger = useLoggingConfig();
  // If two mutates execute at the same time, this reflects the latest call when onCompleted/onError runs (batch save is normally sequential).
  const timeSummaryHeaderOnRequest = useRef(false);

  const emitTimeSummaryConsumptionLog = (
    status: TimeSummaryApiStatus,
    errorMessage?: string,
  ) => {
    const hadHeader = timeSummaryHeaderOnRequest.current;
    timeSummaryHeaderOnRequest.current = false;
    if (!hadHeader) {
      return;
    }
    const operation = timeSummaryOperationFromInteraction(interaction);
    if (!operation) {
      return;
    }
    logTimeSummaryTimeActivityApiConsumption(
      loggingConfigLogger,
      TIME_SUMMARY_TA_HEADER_SENTINEL,
      {
        api: TIME_SUMMARY_API_NAMES.TIME_TRACKING_BATCH_MANAGE_TIME_ENTRIES,
        operation,
        status,
        errorMessage,
      },
    );
  };

  const handleSuccess = (
    payload: TimeTracking_BatchManageTimeEntriesPayload,
  ) => {
    sandbox.logger.info(
      'Component=useBatchSaveTimeEntries Event=Successfully saved time activities',
    );
    emitTimeSummaryConsumptionLog(TIME_SUMMARY_API_STATUS.SUCCESS);
    if (interaction) {
      endInteractionWithSuccess(sandbox, interaction);
    }
    onSuccess(payload);
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(error);
  };

  const handleError = (
    errorCode: string | ApolloError | undefined,
    message = '',
    details = '',
    subCode = '',
    element = '',
  ) => {
    const errorMessageForLog =
      errorCode instanceof ApolloError
        ? errorCode.message
        : [errorCode, message].filter(Boolean).join(' ');
    emitTimeSummaryConsumptionLog(
      TIME_SUMMARY_API_STATUS.FAILED,
      errorMessageForLog || undefined,
    );
    sandbox.logger.error(
      `Component=useBatchSaveTimeEntries Event=Error saving time activities: ${errorCode}`,
    );
    if (interaction && errorCode) {
      if (isExpectedError(errorCode)) {
        endInteractionWithSuccess(sandbox, interaction);
      } else {
        endInteractionWithFailure(
          sandbox,
          interaction,
          (errorCode instanceof ApolloError
            ? errorCode.message
            : errorCode) as string,
        );
      }
    }

    const customErrorHandler = (error: string) => {
      // if subCode is not present it might not be a general error where customer has to take any action
      if (
        (error === 'GENERAL_V3_ERROR' || error === 'GENERAL_V1_ERROR') &&
        subCode.trim()?.length > 0
      ) {
        return `${message} ${details}`;
      }
      return mapTimeTrackingMutationError(intl, error);
    };

    const mappedError = mapError({
      sourceComponent: 'useBatchSaveTimeEntries',
      sandbox,
      intl,
      error: errorCode,
      customErrorHandler,
    });

    if (mappedError) {
      onError(mappedError, element, {
        errorCode:
          typeof errorCode === 'string' ? errorCode : errorCode?.message,
        subCode,
        message,
        details,
      });
    }
  };

  const handleCompleted = (result: BatchSaveTimeEntriesMutation) => {
    if (!result.timeTrackingBatchManageTimeEntries) {
      handleError('Null Response');
      return;
    }
    if (
      result.timeTrackingBatchManageTimeEntries.__typename ===
      'TimeTracking_BatchManageTimeEntriesError'
    ) {
      handleError(
        result.timeTrackingBatchManageTimeEntries.errorCode,
        result.timeTrackingBatchManageTimeEntries.message,
        result.timeTrackingBatchManageTimeEntries.details,
        result.timeTrackingBatchManageTimeEntries.subCode,
        result.timeTrackingBatchManageTimeEntries.element,
      );
    } else if (
      result.timeTrackingBatchManageTimeEntries.__typename ===
      'TimeTracking_BatchManageTimeEntriesPayload'
    ) {
      handleSuccess(
        result.timeTrackingBatchManageTimeEntries as TimeTracking_BatchManageTimeEntriesPayload,
      );
    } else {
      handleError('Unexpected response type');
    }
  };

  const [baseMutate, mutationResult] = useBatchSaveTimeEntriesMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });

  const batchSaveMutate = useCallback(
    (options: Parameters<typeof baseMutate>[0]) => {
      const headers = options?.context?.headers as
        | Record<string, string | undefined>
        | undefined;
      timeSummaryHeaderOnRequest.current =
        headers?.[TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW] ===
        'true';
      return baseMutate(options);
    },
    [baseMutate],
  );

  return [
    batchSaveMutate,
    mutationResult,
  ] as BatchSaveTimeEntriesMutationHookResult;
};
