import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useSearchTimeEntriesLazyQuery,
  TimeTracking_TimeEntriesInput,
  TimeTracking_TimeEntryOrderOn,
  TimeTracking_ApprovalStatusType,
} from 'src/__generated__/timeTracking/graphql';
import { Common_SortOrder } from 'src/__generated__/oigql/graphql';
import { parseDate, formatDateForAPI } from '../utils/timezoneUtils';
import { RootState } from '../store';
import {
  setLoading,
  setError,
  setTimeEntries,
  setLockedDates,
  LockedDateInfo,
} from '../store/timeEntriesSlice';

export interface Week {
  startDate: any; // dayjs object
  endDate: any; // dayjs object
}

export const getReadWeeklyTimeEntriesInput = (
  nameIds: string[],
  minDate?: string,
  maxDate?: string,
): TimeTracking_TimeEntriesInput => {
  const baseFilter: any = {
    isExported: false,
  };

  // Add date filter only if min/max dates are provided
  if (minDate && maxDate) {
    baseFilter.date = {
      onOrAfter: minDate,
      onOrBefore: maxDate,
    };
  }

  // Always add timeForEntityId filter with array of employee IDs
  return {
    orderBy: [
      {
        orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
        orderDirection: Common_SortOrder.Asc,
      },
    ],
    timeEntryFilter: {
      ...baseFilter,
      timeForEntityId: {
        matchesAny: nameIds,
      },
    },
  };
};

export const useTimeEntriesQuery = () => {
  const dispatch = useDispatch();

  const { timeEntries, loading, error } = useSelector(
    (state: RootState) => state.timeEntries,
  );

  // Use the existing lazy query hook
  const [searchTimeEntries, { loading: queryLoading, error: queryError }] =
    useSearchTimeEntriesLazyQuery();

  const fetchTimeEntries = useCallback(
    async (nameIds: string[], uploadedTimeEntries?: any[]) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        // Calculate min/max dates from uploaded time entries if provided
        let minDate: string | undefined;
        let maxDate: string | undefined;

        if (uploadedTimeEntries && uploadedTimeEntries.length > 0) {
          const dates = uploadedTimeEntries
            .map((entry) => entry.date)
            .filter((date) => date)
            .map((date) =>
              // Convert date to YYYY-MM-DD format for GraphQL query using timezone-safe parsing
              formatDateForAPI(date),
            )
            .filter((date) => date && typeof date === 'string')
            .sort();

          if (dates.length > 0) {
            [minDate] = dates;
            maxDate = dates[dates.length - 1];
          }
        }

        const input = getReadWeeklyTimeEntriesInput(nameIds, minDate, maxDate);

        const { data } = await searchTimeEntries({
          variables: { input },
          fetchPolicy: 'network-only',
        });

        if (data?.timeTrackingTimeEntries?.edges) {
          const timeEntries = data.timeTrackingTimeEntries.edges.map((edge) => {
            // Convert duration from seconds to hours
            const durationInSeconds = edge.node.duration || 0;
            const durationInHours = durationInSeconds / 3600; // Convert seconds to hours

            return {
              timeEntryId: edge.node.id,
              timeForId: (edge.node.timeFor as any)?.id || '',
              duration: durationInHours, // Store as hours
              date: edge.node.date,
              isExported: edge.node.isExported || false,
              approvalStatus: edge.node.approvalStatus,
              locked: edge.node.locked,
            };
          });
          dispatch(setTimeEntries(timeEntries));

          // Detect locked/approved dates
          const lockedDates: LockedDateInfo[] = [];
          const processedKeys = new Set<string>(); // Track unique employee-date combinations

          data.timeTrackingTimeEntries.edges.forEach((edge) => {
            const employeeId = (edge.node.timeFor as any)?.id;
            const { date } = edge.node;
            const { approvalStatus } = edge.node;
            const { locked } = edge.node;

            // Create a unique key for this employee-date combination
            const key = `${employeeId}-${date}`;

            // Only process each unique employee-date once
            if (employeeId && date && !processedKeys.has(key)) {
              processedKeys.add(key);

              // Check if this entry is locked or approved
              const isApproved =
                approvalStatus === TimeTracking_ApprovalStatusType.Approved;
              const isSubmitted =
                approvalStatus === TimeTracking_ApprovalStatusType.Submitted;
              const isLocked = locked === true;

              if (isApproved || isSubmitted || isLocked) {
                let reason = 'locked';
                if (isApproved) {
                  reason = 'approved';
                } else if (isSubmitted) {
                  reason = 'submitted';
                }

                lockedDates.push({
                  employeeId,
                  date,
                  approvalStatus: approvalStatus || '',
                  reason,
                });
              }
            }
          });

          // Store locked dates
          if (lockedDates.length > 0) {
            dispatch(setLockedDates(lockedDates));
          }
        } else {
          dispatch(setTimeEntries([]));
        }
      } catch (err) {
        dispatch(
          setError(
            err instanceof Error ? err.message : 'Failed to fetch time entries',
          ),
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, searchTimeEntries],
  );

  return {
    timeEntries,
    loading,
    error,
    fetchTimeEntries,
  };
};
