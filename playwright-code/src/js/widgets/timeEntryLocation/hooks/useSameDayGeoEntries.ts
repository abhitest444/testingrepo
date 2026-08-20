import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  TimeTracking_TimeEntry,
  TimeTracking_TimeEntriesInput,
  TimeTracking_TimeEntryOrderOn,
} from 'src/__generated__/timeTracking/graphql';
import { Common_SortOrder } from 'src/__generated__/oigql/graphql';
import { useLazySearchTimeEntries } from 'src/js/service/hooks/timeEntries/useLazySearchTimeEntries';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  getTimeEntryLocalDateForApi,
  buildGeoSameDayEntryTimeRangeMapById,
} from '../utils/locationPointUtils';

interface UseSameDayGeoEntriesArgs {
  timeEntry: TimeTracking_TimeEntry | null;
  loading: boolean;
  timeEntryId: string;
  nowLabel: string;
}

interface UseSameDayGeoEntriesResult {
  /** Map of time entry id → localized time range for same-day entries with geo data */
  sameDayGeoEntryTimeRangesById: Record<string, string>;
}

export const useSameDayGeoEntries = ({
  timeEntry,
  loading,
  timeEntryId,
  nowLabel,
}: UseSameDayGeoEntriesArgs): UseSameDayGeoEntriesResult => {
  const sandbox = useSandbox();
  // Tracks which original timeEntryId has already triggered the same-day search,
  // so dropdown-driven entry switches (which change timeEntry/loading) don't re-fire it.
  const searchedForTimeEntryIdRef = useRef<string | null>(null);

  const {
    query: searchSameDayTimeEntries,
    data: sameDayTimeEntries,
    resetData,
  } = useLazySearchTimeEntries();

  const timeForId = timeEntry?.timeForContactDAS?.id;
  const entryDateForSearch = useMemo(
    () => getTimeEntryLocalDateForApi(timeEntry),
    [timeEntry],
  );

  const searchTimeEntries = useCallback(async () => {
    if (!timeForId || !entryDateForSearch) {
      return;
    }

    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.ACTIVE_TIME_ENTRY_READ,
    );

    const input: TimeTracking_TimeEntriesInput = {
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Asc,
        },
      ],
      timeEntryFilter: {
        isExported: false,
        date: {
          onOrAfter: entryDateForSearch,
          onOrBefore: entryDateForSearch,
        },
        timeForEntityId: { equals: timeForId },
      },
    };

    const logContext = { timeForId, entryDateForSearch, timeEntryId };

    try {
      const { data: queryData } = await searchSameDayTimeEntries({
        variables: { input },
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      });
      const timeEntriesCount =
        queryData?.timeTrackingTimeEntries?.edges?.length ?? 0;
      sandbox.logger.info(
        `Component=useSameDayGeoEntries Event=Successfully searched same-day time entries timeEntryId=${timeEntryId} timeForId=${timeForId} entryDateForSearch=${entryDateForSearch} timeEntriesCount=${timeEntriesCount}`,
        { ...logContext, timeEntriesCount },
      );
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.ACTIVE_TIME_ENTRY_READ,
      );
    } catch (err) {
      sandbox.logger.error(
        `Component=useSameDayGeoEntries Event=Error searching same-day time entries timeEntryId=${timeEntryId} timeForId=${timeForId} entryDateForSearch=${entryDateForSearch}`,
        { error: err },
      );
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.ACTIVE_TIME_ENTRY_READ,
        'QUERY_ERROR',
        err as Error,
      );
    }
  }, [
    timeForId,
    entryDateForSearch,
    timeEntryId,
    sandbox,
    searchSameDayTimeEntries,
  ]);

  // Search only once per original timeEntryId. Dropdown-driven switches update
  // activeTimeEntryId in the container, which changes timeEntry/loading here, but
  // timeEntryId (the original prop) stays the same — so the guard below prevents
  // re-firing the search on every subsequent loading→false cycle.
  useEffect(() => {
    if (loading || !timeForId || !entryDateForSearch) {
      return;
    }
    if (searchedForTimeEntryIdRef.current === timeEntryId) {
      return;
    }
    searchedForTimeEntryIdRef.current = timeEntryId;
    resetData();
    searchTimeEntries().catch(undefined);
  }, [
    loading,
    timeEntryId,
    timeForId,
    entryDateForSearch,
    resetData,
    searchTimeEntries,
  ]);

  const normalizedEntries = useMemo(
    () =>
      sameDayTimeEntries?.map(
        (entry) =>
          ({
            id: entry.id,
            startTime: entry.startTime,
            endTime: entry.endTime,
            isOpen: entry.isOpen,
            timeZone: entry.timeZone,
            hasGeoLocationPoints: entry.hasGeoLocationPoints,
            date: entry.date,
          } as Pick<
            TimeTracking_TimeEntry,
            | 'id'
            | 'startTime'
            | 'endTime'
            | 'isOpen'
            | 'timeZone'
            | 'hasGeoLocationPoints'
            | 'date'
          >),
      ),
    [sameDayTimeEntries],
  );

  const sameDayGeoEntryTimeRangesById = useMemo(
    () =>
      buildGeoSameDayEntryTimeRangeMapById(
        normalizedEntries as TimeTracking_TimeEntry[],
        entryDateForSearch,
        nowLabel,
      ),
    [normalizedEntries, entryDateForSearch, nowLabel],
  );

  return { sameDayGeoEntryTimeRangesById };
};
