import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  useBatchSaveTimeEntriesMutation,
  TimeTracking_PartialBatchManageTimeEntriesPayload,
  TimeTracking_BatchManageTimeEntriesResult,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import { mapTimeTrackingMutationError } from 'src/js/service/errors/timeTrackingErrors';
import { formatDateForAPI, formatDateForError } from '../utils/timezoneUtils';
// Note: Customer interaction imports removed for demo widget
import { useAppDispatch } from '../store';
import {
  setSaveError,
  clearSaveError,
  setFailedEntries,
  clearFailedEntries,
  setSaveResult,
} from '../store/reviewSlice';

/**
 * Interface for time entry data from demo
 */
interface DemoTimeEntry {
  id?: string; // Optional for new entries
  employee: string;
  timeForId: string; // The employee/vendor ID for timeFor
  employeeType?: string; // The type of employee (EMPLOYEE, VENDOR, etc.)
  date: string;
  hours: number;
  notes?: string;
  serviceItem?: string;
  class?: string;
  location?: string;
  customer?: string;
  [key: string]: any; // For custom fields
}

/**
 * Interface for the hook's return value
 */
interface UseSaveDemoTimeEntriesResult {
  /** Function to trigger the save operation for demo time entries */
  saveDemoTimeEntries: (
    timeEntries: DemoTimeEntry[],
    employeeMappings?: any,
    customers?: any[],
    services?: any[],
    classes?: any[],
    locations?: any[],
    columnMappings?: any,
    customFields?: any[],
    importMode?: 'add' | 'replace',
    existingTimeEntries?: any[],
  ) => Promise<void>;
  /** Boolean indicating if the save operation is currently in progress */
  loading: boolean;
  /** The saved time entries data from the last successful operation */
  savedData: TimeTracking_BatchManageTimeEntriesResult | undefined;
  /** Boolean indicating if there are any time entries to save */
  hasDataToSave: boolean;
  /** Array of failed entries for partial success scenarios */
  failedEntries: Array<{
    index: number;
    date: string;
    duration: number;
    errorCode: string;
    message: string;
    subCode?: string;
  }>;
}

/**
 * Interface for the hook's input parameters
 */
interface UseSaveDemoTimeEntriesParams {
  /** Optional callback to trigger after successful save */
  onSaveSuccess?: () => void;
  /** Optional callback to trigger after partial success */
  onPartialSuccess?: (failedEntries: any[]) => void;
  /** Optional callback to trigger after save failure */
  onSaveFailure?: (error: string) => void;
}

/**
 * Utility function to format detailed error messages for failed time entries
 */
const formatDetailedErrorMessages = (
  detailedErrors: Array<{
    index: number;
    date: string;
    duration: number;
    errorCode: string;
    message: string;
    subCode?: string;
  }>,
  intl: any,
): string => {
  if (!detailedErrors || detailedErrors.length === 0) {
    return intl.formatMessage({
      id: 'demo.time.entry.save.error.general',
      defaultMessage: 'Something went wrong',
    });
  }

  const errorMessages = detailedErrors.map((error, index) => {
    const hours = Math.round((error.duration / 3600) * 100) / 100; // Convert seconds to hours
    const formattedDate = formatDateForError(error.date);

    let errorMessage = error.message;
    if (errorMessage) {
      errorMessage = errorMessage
        .replace(/.*Details:\\n/, '')
        .replace(/\\n/g, '<br>')
        .replace(
          /^The following fields are required:/,
          'the following fields are required:',
        )
        .trim();
    }

    if (!errorMessage || errorMessage.trim() === '') {
      const mappedError = mapTimeTrackingMutationError(
        intl,
        error.errorCode,
        error.subCode,
      );
      if (mappedError && mappedError !== 'catch.all.error.content') {
        errorMessage = mappedError;
      } else {
        errorMessage = intl.formatMessage({
          id: 'demo.time.entry.save.error.unknown',
          defaultMessage: 'Unknown error occurred',
        });
      }
    }

    return intl.formatMessage(
      {
        id: 'demo.time.entry.save.error.detail',
        defaultMessage:
          '{index}. date {date} for {hours} hours failed due to: {errorMessage}',
      },
      {
        index: index + 1,
        date: formattedDate,
        hours,
        errorMessage,
      },
    );
  });

  return intl.formatMessage(
    {
      id: 'demo.time.entry.save.error.header',
      defaultMessage: 'Time entries(s) failed to save:<br>{errorMessages}',
    },
    {
      errorMessages: errorMessages.join('<br>'),
    },
  );
};

/**
 * Transform demo time entries to the format expected by the GraphQL mutation
 */
const transformDemoTimeEntries = (
  demoEntries: DemoTimeEntry[],
  employeeMappings: any = {},
  customers: any[] = [],
  services: any[] = [],
  classes: any[] = [],
  locations: any[] = [],
  columnMappings: any = {},
  customFields: any[] = [],
) =>
  demoEntries.map((entry) => {
    // Use timezone-safe date formatting for API
    const formatDate = (dateStr: string): string => formatDateForAPI(dateStr);

    // Get employee type from employee mappings
    const employeeMapping = employeeMappings[entry.employee] || {};
    const employeeType = employeeMapping.type || 'EMPLOYEE';

    const transformedEntry: any = {
      date: formatDate(entry.date),
      // Convert hours to seconds and round to avoid floating point precision issues
      duration: Math.round(entry.hours * 3600),
      timeFor: {
        id: entry.timeForId,
        timeForType: employeeType, // Use employee type from mappings
      },
    };

    // Only add fields that are mapped and have values
    if (entry.notes) {
      transformedEntry.notes = entry.notes;
    }

    // Check for different possible field names for service item ID
    const serviceItemId =
      entry.serviceItemId ||
      entry.serviceItemID ||
      entry['service item id'] ||
      entry.serviceItemId;

    if (serviceItemId) {
      transformedEntry.serviceItemID = serviceItemId;
    } else if (entry.serviceItem || entry['service item']) {
      const serviceName = entry.serviceItem || entry['service item'];
      // Look up service by name to get ID (case-insensitive)
      const service = services.find(
        (s) =>
          s.fullName &&
          s.fullName.toLowerCase().trim() === serviceName?.toLowerCase().trim(),
      );
      if (service) {
        transformedEntry.serviceItemID = service.id;
      }
    }

    // Check for different possible field names for class ID
    const classId =
      entry.classId || entry.classID || entry['class id'] || entry.classId;

    if (classId) {
      transformedEntry.classID = classId;
    } else if (entry.class) {
      // Look up class by name to get ID (case-insensitive)
      const classItem = classes.find(
        (c) =>
          c.fullName &&
          c.fullName.toLowerCase().trim() ===
            entry?.class?.toLowerCase().trim(),
      );
      if (classItem) {
        transformedEntry.classID = classItem.id;
      }
    }

    // Check for different possible field names for location ID
    const locationId =
      entry.locationId ||
      entry.locationID ||
      entry['location id'] ||
      entry.locationId;

    if (locationId) {
      transformedEntry.departmentID = locationId;
      // Also set department label if we have the location data
      const location = locations.find((l) => l.id === locationId);
      if (location && location.fullName) {
        transformedEntry.departmentLabel = location.fullName;
      }
    } else if (entry.location) {
      // Look up location by name to get ID and label (case-insensitive)
      const location = locations.find(
        (l) =>
          l.fullName &&
          l.fullName.toLowerCase().trim() ===
            entry?.location?.toLowerCase().trim(),
      );
      if (location) {
        transformedEntry.departmentID = location.id;
        transformedEntry.departmentLabel = location.fullName;
      }
    }

    // Handle customer - check for direct ID first, then lookup by name
    if (entry.customerId) {
      transformedEntry.timeAgainst = {
        customerId: entry.customerId,
      };
    } else if (entry.customer) {
      const customer = customers.find(
        (c) =>
          c.displayName &&
          c.displayName.toLowerCase().trim() ===
            entry?.customer?.toLowerCase().trim(),
      );
      if (customer) {
        transformedEntry.timeAgainst = {
          customerId: customer?.id,
        };
      }
    }

    // Use pre-processed custom fields from Redux (already structured)
    if (
      entry.customFields &&
      Array.isArray(entry.customFields) &&
      entry.customFields.length > 0
    ) {
      transformedEntry.customFields = entry.customFields;
    }
    return transformedEntry;
  });

/**
 * Custom hook for saving demo time entries
 */
export const useSaveBulkTimeEntries = (
  params: UseSaveDemoTimeEntriesParams = {},
): UseSaveDemoTimeEntriesResult => {
  const { onSaveSuccess, onPartialSuccess, onSaveFailure } = params;
  const sandbox = useSandbox();
  const intl = useIntl();
  const dispatch = useAppDispatch();

  // Get failed entries from Redux state
  const failedEntries = useSelector(
    (state: any) => state.review.failedEntries || [],
  );

  /**
   * Error handler for Apollo mutations and general error processing
   */
  const handleError = useCallback(
    (
      errorCode: string | ApolloError | undefined,
      message = '',
      details = '',
      subCode = '',
    ) => {
      sandbox.logger.error('TimeImportAgentic time entries save failed', {
        errorCode,
      });

      const customErrorHandler = (error: string) => {
        if (
          (error === 'GENERAL_V3_ERROR' || error === 'GENERAL_V1_ERROR') &&
          subCode.trim()?.length > 0
        ) {
          return `${message} ${details}`;
        }
        if (
          error === 'TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET' &&
          details.trim()?.length > 0
        ) {
          const cleanedDetails = details.replace(/.*Details:\\n/, '');
          const htmlDetails = cleanedDetails.replace(/\\n/g, '<br>');
          return htmlDetails;
        }
        return mapTimeTrackingMutationError(intl, error);
      };

      const mappedError = mapError({
        sourceComponent: 'useSaveDemoTimeEntries',
        sandbox,
        intl,
        error: errorCode,
        customErrorHandler,
      });

      if (mappedError) {
        sandbox.logger.error(mappedError);
        dispatch(setSaveError(mappedError));
        if (onSaveFailure) {
          onSaveFailure(mappedError);
        }
      } else if (onSaveFailure) {
        onSaveFailure('Save operation failed');
      }
    },
    [sandbox, intl, dispatch, onSaveFailure],
  );

  /**
   * Apollo GraphQL mutation hook configuration
   */
  const [saveTimeEntries, { loading: saveLoading, error: saveError, data }] =
    useBatchSaveTimeEntriesMutation({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
      },
      onError: (error) => {
        handleError(error);
      },
    });

  /**
   * Main save function for demo time entries
   */
  const saveDemoTimeEntries = useCallback(
    async (
      timeEntries: DemoTimeEntry[],
      employeeMappings: any = {},
      customers: any[] = [],
      services: any[] = [],
      classes: any[] = [],
      locations: any[] = [],
      columnMappings: any = {},
      customFields: any[] = [],
      importMode: 'add' | 'replace' = 'add',
      existingTimeEntries: any[] = [],
    ) => {
      // Clear any previous save errors
      dispatch(clearSaveError());
      dispatch(clearFailedEntries());

      if (!timeEntries || timeEntries.length === 0) {
        sandbox.logger.warn('No time entries to save');
        return;
      }

      // Note: Customer interaction tracking removed for demo widget

      try {
        // Filter out entries for locked/approved dates before transformation
        const lockedDatesSet = new Set<string>();
        if (existingTimeEntries.length > 0) {
          existingTimeEntries.forEach((existing) => {
            const isLocked = existing.locked === true;
            const isApproved = existing.approvalStatus === 'APPROVED';
            const isSubmitted = existing.approvalStatus === 'SUBMITTED';

            if (isLocked || isApproved || isSubmitted) {
              const key = `${existing.timeForId}-${existing.date}`;
              lockedDatesSet.add(key);
            }
          });
        }

        // Filter out entries for locked dates
        const entriesToSave = timeEntries.filter((entry) => {
          const dateKey = formatDateForAPI(entry.date);
          const key = `${entry.timeForId}-${dateKey}`;

          if (lockedDatesSet.has(key)) {
            sandbox.logger.warn('Skipping entry for locked/approved date', {
              employeeId: entry.timeForId,
              date: dateKey,
            });
            return false;
          }
          return true;
        });

        if (entriesToSave.length === 0) {
          handleError(
            'All entries are for locked or approved dates and cannot be saved',
          );
          return;
        }

        // Transform demo entries to the expected format
        const transformedEntries = transformDemoTimeEntries(
          entriesToSave,
          employeeMappings,
          customers,
          services,
          classes,
          locations,
          columnMappings,
          customFields,
        );

        // Prepare time entries to delete when import mode is 'replace'
        const timeEntriesToDelete: any[] = [];

        if (importMode === 'replace' && existingTimeEntries.length > 0) {
          // Group uploaded entries by employee ID and date for quick lookup
          const uploadedEntriesMap = new Map<string, Set<string>>();
          timeEntries.forEach((entry) => {
            if (entry.timeForId) {
              const dateKey = formatDateForAPI(entry.date);
              const key = `${entry.timeForId}-${dateKey}`;
              if (!uploadedEntriesMap.has(entry.timeForId)) {
                uploadedEntriesMap.set(entry.timeForId, new Set());
              }
              uploadedEntriesMap.get(entry.timeForId)?.add(dateKey);
            }
          });

          // Find existing entries that match the employee ID and date of uploaded entries
          existingTimeEntries.forEach((existing) => {
            const employeeDates = uploadedEntriesMap.get(existing.timeForId);
            if (employeeDates && employeeDates.has(existing.date)) {
              // Skip deleting locked or approved entries - they cannot be deleted
              const isLocked = existing.locked === true;
              const isApproved = existing.approvalStatus === 'APPROVED';
              const isSubmitted = existing.approvalStatus === 'SUBMITTED';

              if (isLocked || isApproved || isSubmitted) {
                sandbox.logger.warn(
                  'Skipping deletion of locked/approved entry',
                  {
                    entryId: existing.timeEntryId,
                    date: existing.date,
                    employeeId: existing.timeForId,
                    approvalStatus: existing.approvalStatus,
                    locked: existing.locked,
                  },
                );
                return; // Skip this entry
              }

              // This existing entry should be deleted because we're replacing it
              timeEntriesToDelete.push({
                id: existing.timeEntryId,
              });
            }
          });

          sandbox.logger.info(
            'Replace mode: marking existing entries for deletion',
            {
              entriesToDelete: timeEntriesToDelete.length,
            },
          );
        }

        const inputData = {
          timeEntries: transformedEntries,
          timeEntriesToDelete,
          isExported: false,
        };

        sandbox.logger.info('Initiating time entries save', {
          entriesCount: transformedEntries.length,
          deletionsCount: timeEntriesToDelete.length,
        });

        // Execute the GraphQL mutation
        const result = await saveTimeEntries({
          variables: {
            input: inputData,
          },
        });

        if (!result.data?.timeTrackingBatchManageTimeEntries) {
          handleError('Null Response');
          // Note: Customer interaction tracking removed for demo widget
          return;
        }

        // Check if the result contains an error
        if (
          result.data.timeTrackingBatchManageTimeEntries.__typename ===
          'TimeTracking_BatchManageTimeEntriesError'
        ) {
          handleError(
            result.data.timeTrackingBatchManageTimeEntries.errorCode,
            result.data.timeTrackingBatchManageTimeEntries.message,
            result.data.timeTrackingBatchManageTimeEntries.details,
            result.data.timeTrackingBatchManageTimeEntries.subCode,
          );
          // Note: Customer interaction tracking removed for demo widget
          return;
        }

        // Handle success case - check for partial success first
        const response = result.data.timeTrackingBatchManageTimeEntries;

        // Check for partial success first (has errors in timeEntries array)
        if (
          response?.__typename ===
          'TimeTracking_PartialBatchManageTimeEntriesPayload'
        ) {
          // Check if there are any errors in the timeEntries array
          const hasErrors = response.timeEntries?.some(
            (entry: any) =>
              entry.__typename === 'TimeTracking_UpdateTimeEntryError',
          );

          if (hasErrors) {
            // Partial success case
            const partialPayload =
              result.data.timeTrackingBatchManageTimeEntries;
            const detailedErrors: Array<{
              index: number;
              date: string;
              duration: number;
              errorCode: string;
              message: string;
              subCode?: string;
            }> = [];

            partialPayload.timeEntries?.forEach(
              (responseEntry: any, index: number) => {
                if (
                  responseEntry.__typename ===
                  'TimeTracking_UpdateTimeEntryError'
                ) {
                  const payloadEntry = transformedEntries[index];
                  const entry = entriesToSave[index];
                  if (payloadEntry) {
                    detailedErrors.push({
                      index,
                      entryId: entry?.id,
                      date: payloadEntry.date,
                      duration: payloadEntry.duration || 0,
                      errorCode: responseEntry.errorCode,
                      message: responseEntry.message,
                      subCode: responseEntry.subCode,
                    });
                  }
                }
              },
            );

            sandbox.logger.info(
              'TimeImportAgentic time entries partial success',
              {
                totalEntriesProcessed: transformedEntries.length,
                successfulEntries:
                  (partialPayload.timeEntries?.length || 0) -
                  detailedErrors.length,
                failedEntries: detailedErrors.length,
              },
            );

            // Note: Customer interaction tracking removed for demo widget

            // Store detailed errors in Redux
            dispatch(setFailedEntries(detailedErrors));

            const errorMessage = formatDetailedErrorMessages(
              detailedErrors,
              intl,
            );
            dispatch(setSaveError(errorMessage));

            // Set save result for partial success
            const successfulCount =
              (partialPayload.timeEntries?.length || 0) - detailedErrors.length;
            const failedEntryIds = new Set(
              detailedErrors.map((e) => e.entryId).filter(Boolean),
            ) as Set<number>;
            const savedEntryIds = entriesToSave
              .map((e) => e.id)
              .filter((id) => !failedEntryIds.has(id));
            dispatch(
              setSaveResult({
                success: true,
                message: 'Some time entries saved successfully',
                savedEntries: successfulCount,
                failedEntries: detailedErrors.length,
                savedEntryIds,
              }),
            );

            if (onPartialSuccess) {
              onPartialSuccess(detailedErrors);
            }
            return; // Exit early for partial success
          }
        }

        // Handle complete success case
        const isCompleteSuccess =
          response?.__typename ===
            'TimeTracking_BatchManageTimeEntriesPayload' ||
          response?.__typename ===
            'TimeTracking_PartialBatchManageTimeEntriesPayload';

        if (isCompleteSuccess) {
          // Note: Customer interaction tracking removed for demo widget

          dispatch(clearSaveError());
          dispatch(clearFailedEntries());

          // Set save result with success data
          // Use the original timeEntries length (the checked entries from Step 5)
          const savedEntryIds = entriesToSave.map((e) => e.id);
          dispatch(
            setSaveResult({
              success: true,
              message: 'Time entries saved successfully',
              savedEntries: timeEntries.length,
              failedEntries: 0,
              savedEntryIds,
            }),
          );

          if (onSaveSuccess) {
            onSaveSuccess();
          }
        }
      } catch (error) {
        handleError(error as ApolloError);
        // Note: Customer interaction tracking removed for demo widget
        // Don't re-throw the error - let the error handling complete
      }
    },
    [
      saveTimeEntries,
      handleError,
      sandbox,
      intl,
      dispatch,
      onSaveSuccess,
      onPartialSuccess,
    ],
  );

  return {
    saveDemoTimeEntries,
    loading: saveLoading,
    savedData:
      data?.timeTrackingBatchManageTimeEntries as TimeTracking_PartialBatchManageTimeEntriesPayload,
    hasDataToSave: true, // Always true for demo entries
    failedEntries,
  };
};
