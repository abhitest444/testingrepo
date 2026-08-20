import { useEffect, useState, useCallback } from 'react';
import {
  useLazyQuery,
  useApolloClient,
  LazyQueryHookOptions,
  ApolloError,
  QueryResult,
} from '@apollo/client';
import { useSandbox } from '@payroll/quicksand';
import gql from 'graphql-tag';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  hasAnyGraphQLError,
  extractGraphQLError,
} from 'src/js/service/utils/apolloErrorUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import {
  FEATURE_FLAGS,
  TIME_SUMMARY_API_OPERATION,
  TIME_SUMMARY_API_STATUS,
} from 'src/js/common/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  computeHasTSheets,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import {
  buildTimeSummaryTimeActivityHeaders,
  logTimeSummaryTimeActivityApiConsumption,
  TIME_SUMMARY_API_NAMES,
} from 'src/js/service/utils/timeSummaryHeaderUtils';
import {
  SingleTimeEntryLazyQueryHookResult,
  SingleTimeEntryQueryData,
  SingleTimeEntry,
  SingleTimeEntryQueryVariables,
} from '../types/singleTimeEntryQueryTypes';

const TIME_ENTRY_FRAGMENT = gql`
  fragment TimeEntryParts on TimeTracking_TimeEntry {
    id
    alternateIds {
      id
      nameSpace
    }
    timeForType
    timeForContactDAS {
      id
      firstName
      lastName
    }
    timeAgainstContactDAS {
      customer {
        id
        fullName
      }
    }
    serviceItemDAS {
      id
      fullName
    }
    classDAS {
      id
      fullName
    }
    departmentDAS {
      id
      fullName
    }
    timeFor {
      ... on WorkerManagement_Employee {
        id
      }
      ... on Commerce_Vendor {
        id
      }
      ... on TimeTracking_LegacyQboUser {
        id
      }
    }
    date
    startTime
    endTime
    v3StartTime
    v3EndTime
    duration
    v3DurationDetails {
      hours
      minutes
      seconds
    }
    v3BreakDuration
    v3BreakDurationDetails {
      hours
      minutes
      seconds
    }
    timeAgainst {
      project {
        id
      }
      customer {
        id
      }
    }
    class {
      id
    }
    serviceItem {
      id
    }
    payrollItem {
      id
    }
    department {
      id
    }
    billableRate
    costRate
    notes
    taxable
    billableStatus
    v3TransactionLocationType
    isOpen
    isSubmitted
    approvalStatus
    isExported
    timeZone
    attachmentsCount
    locked
    lockedReason
    invoiceId
    meta {
      createdAt
      updatedAt
      createdBy
      version
    }
    legacyCustomFields {
      id
      name
      value
    }
    customExtensions {
      dimensions {
        definition {
          id
        }
        values
      }
    }
    timeBreakId
    distanceTracking {
      autoCalculatedMeters
      manualMeters
    }
  }
`;

// GraphQL query for fetching a single time entry
const GET_TIME_ENTRY_QUERY = gql`
  query getTimeEntry($input: TimeTracking_TimeEntryInput!) {
    timeTrackingTimeEntry(input: $input) {
      ...TimeEntryParts
    }
  }
  ${TIME_ENTRY_FRAGMENT}
`;

export interface UseSingleTimeEntryQueryArgs {
  id?: string;
  isExported?: boolean;
}

type QueryFunctionType = (options?: {
  variables?: { input: { id: string; isExported?: boolean } };
  context?: { headers?: Record<string, string> };
}) => Promise<
  QueryResult<SingleTimeEntryQueryData, SingleTimeEntryQueryVariables>
>;

export interface UseSingleTimeEntryQueryResult {
  query: QueryFunctionType;
  loading: boolean;
  error?: string;
  data?: SingleTimeEntry;
  resetData: () => void;
}

// Custom hook to fetch a single time entry with similar interface as useGetTimeEntry
export const useSingleTimeEntryQuery = ({
  id,
  isExported = true,
}: UseSingleTimeEntryQueryArgs = {}): UseSingleTimeEntryQueryResult => {
  const client = useApolloClient();
  const sandbox = useSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);
  const loggingConfigLogger = useLoggingConfig();
  const { isEnabled: isTimeEntryPrimaryDataSourceEnabled, settled } =
    useIXPFeatureFlag({
      flagName:
        FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_ENTRY_PRIMARY_DATA_SOURCE,
    });

  const { data: entitlementGrants, loading: entitlementsLoading } =
    useGetEntitlements();

  const entitlementsIncludeTSheets = computeHasTSheets(entitlementGrants);

  const [getTimeEntry, { loading }] = useLazyQuery<
    SingleTimeEntryQueryData,
    SingleTimeEntryQueryVariables
  >(GET_TIME_ENTRY_QUERY, {
    client,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const [localData, setLocalData] = useState<SingleTimeEntry | undefined>(
    undefined,
  );
  const [localError, setLocalError] = useState<string | undefined>(undefined);

  // Determine customer interaction type based on isExported flag
  // isExported = true (default) → Time Activity → SINGLE_TIME_READ
  // isExported = false → Time Entry → SINGLE_TIME_SHEET_READ
  const customerInteractionType = isExported
    ? TimeCustomerInteraction.SINGLE_TIME_READ
    : TimeCustomerInteraction.SINGLE_TIME_SHEET_READ;

  const resetData = useCallback(() => {
    sandbox.logger.info(
      'Component=useSingleTimeEntryQuery Event=Resetting time entry data',
    );
    setLocalData(undefined);
    setLocalError(undefined);
  }, [sandbox]);

  const handleSuccess = useCallback(
    (timeEntry: SingleTimeEntry | undefined) => {
      const entryType =
        isExported === false ? 'single time entry' : 'time entry';
      sandbox.logger.info(
        `Component=useSingleTimeEntryQuery Event=Successfully fetched ${entryType} for timeEntryId=${id}`,
      );
      endInteractionWithSuccess(sandbox, customerInteractionType);
      setLocalData(timeEntry);
      setLocalError(undefined);
    },
    [sandbox, isExported, customerInteractionType, id],
  );

  const handleFailure = useCallback(
    (error: ApolloError | Error | { message: string; name: string }) => {
      if (error) {
        const entryType =
          isExported === false ? 'single time entry' : 'time entry';
        const errorMessage = error.message || 'Unknown error occurred';

        sandbox.logger.error(
          `Component=useSingleTimeEntryQuery Event=Error fetching ${entryType} for timeEntryId=${id}`,
          {
            error: errorMessage,
          },
        );
        endInteractionWithFailure(
          sandbox,
          customerInteractionType,
          errorMessage,
          error,
        );
        setLocalError(errorMessage);
      }
    },
    [sandbox, isExported, customerInteractionType, id],
  );

  // Auto-fetch when id is available
  useEffect(() => {
    // If the feature flag is not settled or the time entry ID is not provided, return early
    // This makes sure that the query is not executed until we know how to proceed with the request
    if (!settled || !id) {
      return;
    }
    const isTimeActivityRequest = isExported !== false;
    if (
      isTimeEntryPrimaryDataSourceEnabled &&
      isTimeActivityRequest &&
      entitlementsLoading
    ) {
      return;
    }
    sandbox.logger.info(
      `Component=useSingleTimeEntryQuery Event=Executing GraphQL query with timeEntryId=${id} and isExported=${isExported}`,
    );
    createCustomerInteraction(sandbox, customerInteractionType);
    // TIME SUMMARY WORKFLOW - for time activities, use header instead of variable
    const input = isExported !== false ? { id } : { id, isExported: false };
    const timeSummaryTAHeaders = buildTimeSummaryTimeActivityHeaders({
      isTimeEntryPrimaryDataSourceEnabled,
      isTimeActivityRequest,
      entitlementGrants,
      entitlementsReady: !entitlementsLoading,
    });
    const headers = {
      ...getCustomerInteractionPropagationHeaders(
        sandbox,
        customerInteractionType,
      ),
      ...(isWorkforceUser && {
        'intuit-is-workforce-user': 'true',
      }),
      ...timeSummaryTAHeaders,
    };
    getTimeEntry({
      variables: {
        input,
      },
      context: {
        headers,
      },
    })
      .then((response) => {
        if (hasAnyGraphQLError(response)) {
          const errorToHandle = extractGraphQLError(response)!;
          logTimeSummaryTimeActivityApiConsumption(
            loggingConfigLogger,
            timeSummaryTAHeaders,
            {
              api: TIME_SUMMARY_API_NAMES.GET_TIME_ENTRY,
              operation: TIME_SUMMARY_API_OPERATION.READ,
              status: TIME_SUMMARY_API_STATUS.FAILED,
              errorMessage: errorToHandle.message,
            },
          );
          handleFailure(errorToHandle);
        } else if (response.data?.timeTrackingTimeEntry) {
          logTimeSummaryTimeActivityApiConsumption(
            loggingConfigLogger,
            timeSummaryTAHeaders,
            {
              api: TIME_SUMMARY_API_NAMES.GET_TIME_ENTRY,
              operation: TIME_SUMMARY_API_OPERATION.READ,
              status: TIME_SUMMARY_API_STATUS.SUCCESS,
            },
          );
          handleSuccess(response.data.timeTrackingTimeEntry as SingleTimeEntry);
        } else {
          logTimeSummaryTimeActivityApiConsumption(
            loggingConfigLogger,
            timeSummaryTAHeaders,
            {
              api: TIME_SUMMARY_API_NAMES.GET_TIME_ENTRY,
              operation: TIME_SUMMARY_API_OPERATION.READ,
              status: TIME_SUMMARY_API_STATUS.FAILED,
              errorMessage: 'No data returned from server',
            },
          );
          sandbox.logger.warn(
            `Component=useSingleTimeEntryQuery Event=No data returned from server for timeEntryId=${id}`,
          );
          handleFailure({
            message: 'No data returned from server',
            name: 'NoDataError',
          });
        }
      })
      .catch((err) => {
        logTimeSummaryTimeActivityApiConsumption(
          loggingConfigLogger,
          timeSummaryTAHeaders,
          {
            api: TIME_SUMMARY_API_NAMES.GET_TIME_ENTRY,
            operation: TIME_SUMMARY_API_OPERATION.READ,
            status: TIME_SUMMARY_API_STATUS.FAILED,
            errorMessage:
              err instanceof Error ? err.message : String(err ?? ''),
          },
        );
        handleFailure(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    isExported,
    getTimeEntry,
    loggingConfigLogger,
    sandbox,
    handleSuccess,
    handleFailure,
    customerInteractionType,
    isWorkforceUser,
    isTimeEntryPrimaryDataSourceEnabled,
    settled,
    entitlementsLoading,
    entitlementsIncludeTSheets,
  ]);

  // Wrap the query to handle manual calls with proper success/failure handling
  const query: QueryFunctionType = useCallback(
    (options) => {
      const inputId = options?.variables?.input?.id;
      const providedIsExported = options?.variables?.input?.isExported;
      const effectiveIsExported =
        providedIsExported !== undefined ? providedIsExported : isExported;

      if (inputId) {
        createCustomerInteraction(sandbox, customerInteractionType);
      }

      // TIME SUMMARY WORKFLOW - for time activities, use header instead of variable
      const input =
        effectiveIsExported !== false
          ? { id: inputId! }
          : { id: inputId!, isExported: false };
      const baseHeaders = getCustomerInteractionPropagationHeaders(
        sandbox,
        customerInteractionType,
      );
      const manualIsTimeActivityRequest = effectiveIsExported !== false;
      const timeSummaryTAHeaders = buildTimeSummaryTimeActivityHeaders({
        isTimeEntryPrimaryDataSourceEnabled,
        isTimeActivityRequest: manualIsTimeActivityRequest,
        entitlementGrants,
        entitlementsReady: !entitlementsLoading,
      });
      const headers = {
        ...baseHeaders,
        ...(isWorkforceUser && {
          'intuit-is-workforce-user': 'true',
        }),
        ...timeSummaryTAHeaders,
      };

      return getTimeEntry({
        ...options,
        variables: {
          ...options?.variables,
          input,
        },
        context: {
          ...options?.context,
          headers: {
            ...options?.context?.headers,
            ...headers,
          },
        },
      })
        .then((response) => {
          if (hasAnyGraphQLError(response)) {
            const errorToHandle = extractGraphQLError(response)!;
            logTimeSummaryTimeActivityApiConsumption(
              loggingConfigLogger,
              timeSummaryTAHeaders,
              {
                api: TIME_SUMMARY_API_NAMES.GET_TIME_ENTRY,
                operation: TIME_SUMMARY_API_OPERATION.READ,
                status: TIME_SUMMARY_API_STATUS.FAILED,
                errorMessage: errorToHandle.message,
              },
            );
            handleFailure(errorToHandle);
          } else if (response.data?.timeTrackingTimeEntry) {
            logTimeSummaryTimeActivityApiConsumption(
              loggingConfigLogger,
              timeSummaryTAHeaders,
              {
                api: TIME_SUMMARY_API_NAMES.GET_TIME_ENTRY,
                operation: TIME_SUMMARY_API_OPERATION.READ,
                status: TIME_SUMMARY_API_STATUS.SUCCESS,
              },
            );
            handleSuccess(
              response.data.timeTrackingTimeEntry as SingleTimeEntry,
            );
          } else {
            logTimeSummaryTimeActivityApiConsumption(
              loggingConfigLogger,
              timeSummaryTAHeaders,
              {
                api: TIME_SUMMARY_API_NAMES.GET_TIME_ENTRY,
                operation: TIME_SUMMARY_API_OPERATION.READ,
                status: TIME_SUMMARY_API_STATUS.FAILED,
                errorMessage: 'No data returned from server',
              },
            );
            handleFailure({
              message: 'No data returned from server',
              name: 'NoDataError',
            });
          }
          return response;
        })
        .catch((error) => {
          logTimeSummaryTimeActivityApiConsumption(
            loggingConfigLogger,
            timeSummaryTAHeaders,
            {
              api: TIME_SUMMARY_API_NAMES.GET_TIME_ENTRY,
              operation: TIME_SUMMARY_API_OPERATION.READ,
              status: TIME_SUMMARY_API_STATUS.FAILED,
              errorMessage:
                error instanceof Error ? error.message : String(error ?? ''),
            },
          );
          handleFailure(error);
          throw error;
        });
    },
    // entitlementGrants omitted: Apollo returns new array refs on cache-and-network; entitlementsIncludeTSheets tracks header-relevant changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      getTimeEntry,
      handleSuccess,
      handleFailure,
      loggingConfigLogger,
      sandbox,
      customerInteractionType,
      isExported,
      isWorkforceUser,
      isTimeEntryPrimaryDataSourceEnabled,
      entitlementsIncludeTSheets,
      entitlementsLoading,
    ],
  );

  return {
    query,
    loading,
    error: localError,
    data: localData,
    resetData,
  };
};

export const mapSingleTimeEntryResult = (
  data?: SingleTimeEntryQueryData,
): SingleTimeEntry | undefined =>
  data?.timeTrackingTimeEntry as SingleTimeEntry;

// Re-export types for external use
export type {
  SingleTimeEntryQueryData,
  SingleTimeEntryQueryVariables,
  SingleTimeEntry,
  SingleTimeEntryLazyQueryHookResult,
} from '../types/singleTimeEntryQueryTypes';
