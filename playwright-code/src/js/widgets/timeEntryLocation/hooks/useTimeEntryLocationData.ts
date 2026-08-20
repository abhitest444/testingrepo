import { useQuery } from '@apollo/client';
import { useEffect, useRef, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  TimeTracking_LocationDetail,
  TimeTracking_LocationPoint,
  TimeTracking_TimeEntry,
} from 'src/__generated__/timeTracking/graphql';
import {
  TimeCustomerInteraction,
  endInteractionWithSuccess,
  setInteractionDegraded,
  endInteractionWithFailure,
} from 'src/js/common/CustomerInteraction';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { TIME_TRACKING_LOCATION_DETAIL_QUERY } from 'src/js/service/queries/timeEntryLocationQueries';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

export interface UseTimeEntryLocationDataArgs {
  timeEntryId: string;
  /** Pre-computed trace propagation headers from the active customer interaction. */
  traceHeaders: Record<string, string | number>;
}

export interface UseTimeEntryLocationDataResult {
  loading: boolean;
  timeEntry: TimeTracking_TimeEntry | null;
  locationPoints: TimeTracking_LocationPoint[];
  error: Error | null;
  /** Refetch data for the current timeEntryId */
  refetch: () => void;
}

export const useTimeEntryLocationData = ({
  timeEntryId,
  traceHeaders,
}: UseTimeEntryLocationDataArgs): UseTimeEntryLocationDataResult => {
  const sandbox = useSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);
  // Ref to track if the time entry has been processed
  const processedTimeEntryRef = useRef<string | null>(null);
  // Note: Customer interaction is created in TimeEntryLocationWidget componentDidMount/componentDidUpdate

  // Reset processed flag when timeEntryId changes
  useEffect(() => {
    processedTimeEntryRef.current = null;
  }, [timeEntryId]);

  // Single query for both time entry and location details
  // useQuery auto-fetches on mount and when variables change
  const {
    loading,
    data,
    error: queryError,
    refetch: apolloRefetch,
  } = useQuery(TIME_TRACKING_LOCATION_DETAIL_QUERY, {
    variables: {
      input: {
        timeEntryId,
      },
    },
    // Disable cache to avoid Apollo normalization issues with stub types
    // Location data is time-sensitive, so fresh data is preferred always
    fetchPolicy: 'no-cache',
    // Allow partial errors (e.g., DAS timeout for some fields) while still returning data
    errorPolicy: 'all',
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
      headers: {
        ...(isWorkforceUser && {
          'intuit-is-workforce-user': 'true',
        }),
        ...traceHeaders,
      },
    },
    skip: !timeEntryId,
  });

  // Extract data from response
  const locationDetail =
    data?.timeTrackingLocationDetail as TimeTracking_LocationDetail;

  const timeEntry =
    (locationDetail?.timeEntry as TimeTracking_TimeEntry) ?? null;

  // Memoized because it creates a new array via .map(), which would cause unnecessary re-renders if passed to child components
  const locationPoints = useMemo(
    () =>
      locationDetail?.locationDetail?.edges?.map(
        (edge: { node: TimeTracking_LocationPoint }) => edge.node,
      ) ?? [],
    [locationDetail],
  );

  // Memoized because it performs multiple property checks and is used in multiple places
  // essential data is timeEntry related important details and location points
  const hasEssentialData = useMemo(
    () =>
      !!(
        locationDetail?.timeEntry &&
        locationDetail?.locationDetail?.edges &&
        locationDetail?.locationDetail?.edges.length > 0 &&
        locationDetail?.timeEntry?.timeForContactDAS?.id &&
        locationDetail?.timeEntry?.timeAgainstContactDAS?.customer?.id
      ),
    [locationDetail],
  );

  // If there is an error and we don't have the essential data, show the error
  const shouldShowError = queryError && !hasEssentialData;

  // Wrapper for refetch to match expected signature
  // TODO: add functionality to refetch data for a different time entry as well
  const refetch = () => {
    apolloRefetch();
  };

  // Logging and customer interaction logic:
  // Only process when query is complete (not loading) and hasn't been processed yet
  // 1. Complete failure: error exists AND missing essential data → Fail interaction
  // 2. Partial success (degraded): error exists BUT we have essential data → Degrade interaction
  // 3. Success: no error AND all essential data is present → Success interaction
  // 4. Success with warning: no error BUT missing essential data → Success interaction (warn in logs only)
  if (
    !loading &&
    timeEntryId &&
    processedTimeEntryRef.current !== timeEntryId
  ) {
    const interactionType = TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ;
    const logContext = {
      locationPointsCount: locationPoints.length,
      hasTimeEntry: !!timeEntry,
    };

    if (queryError && shouldShowError) {
      // Case 1: Complete failure - error exists and missing essential data
      sandbox.logger.error(
        `Component=useTimeEntryLocationData Event=Failed to fetch time entry location data timeEntryId=${timeEntryId}`,
        { error: queryError },
      );
      endInteractionWithFailure(
        sandbox,
        interactionType,
        queryError.message || 'Failed to fetch time entry location data',
        queryError,
      );
    } else if (queryError && hasEssentialData) {
      // Case 2: Partial success - error exists but we have essential data
      sandbox.logger.warn(
        `Component=useTimeEntryLocationData Event=Partial error while fetching data timeEntryId=${timeEntryId}`,
        { error: queryError },
      );
      setInteractionDegraded(
        sandbox,
        interactionType,
        queryError.message || 'Partial error while fetching data',
      );
    }
    // If no errors, we end interaction with success
    else {
      if (hasEssentialData) {
        // Case 3: Success - no error AND all essential data is present
        sandbox.logger.info(
          `Component=useTimeEntryLocationData Event=Successfully fetched time entry location data timeEntryId=${timeEntryId}`,
          logContext,
        );
      } else {
        // Case 4: No error but missing essential data (could be no location points or missing other data)
        const hasNoLocationPoints = locationPoints.length === 0;
        const degradationReason = hasNoLocationPoints
          ? 'No location points available'
          : 'Missing essential data';
        // Log such cases to help in analytics
        sandbox.logger.warn(
          `Component=useTimeEntryLocationData Event=${degradationReason} timeEntryId=${timeEntryId}`,
          logContext,
        );
      }
      endInteractionWithSuccess(sandbox, interactionType);
    }

    // Mark as processed after handling any case
    processedTimeEntryRef.current = timeEntryId;
  }

  return {
    loading,
    timeEntry,
    locationPoints,
    error: shouldShowError ? queryError || null : null,
    refetch,
  };
};
