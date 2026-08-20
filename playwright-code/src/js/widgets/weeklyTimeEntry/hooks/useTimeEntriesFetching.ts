import { useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { useReadWeeklyTimeEntries } from 'src/js/service/hooks/weeklyTimeEntries/useReadWeeklyTimeEntries';
import {
  transformTimeEntriesToTimesheetRows,
  deriveCustomFieldOptionIds,
} from '../store/timeEntryTransformer';
import { useAppDispatch, useAppSelector } from '../store';
import {
  mergeTimeEntries,
  setLoading,
  setError,
  setTeamBillableDetails,
  setTeamMember,
} from '../store/timeEntryGridSlice';
import {
  setTimeEntriesError,
  clearTimeEntriesError,
} from '../store/validationSlice';
import {
  selectDateRange,
  selectTeamMember,
  selectVisibleDays,
  selectActiveBreaks,
  selectCustomFields,
} from '../store/selectors';
import type { Week } from './useCombinedDataFetching';
import { useTeamBillableDetailsFetching } from './useTeamBillableDetailsFetching';

/**
 * Interface for the time entries fetching state
 * Provides loading, error, and data state for time entries operations
 */
export interface TimeEntriesFetchingState {
  loading: boolean; // Loading state for time entries fetching
  error: string | null; // Error message if fetching fails
  timeEntries: any[] | undefined; // Raw time entries data from API
  currentWeek: Week; // Current week object with start and end dates
  hasData: boolean; // Whether we have any time entries data
  fetchKey: string; // Unique key for the current fetch parameters
  refetch: () => void; // Function to refetch time entries data
}

/**
 * Time entries fetching hook
 * Only runs after combined data fetching is complete
 * Handles time entries data fetching and transformation
 */
export const useTimeEntriesFetching = (
  combinedDataReady: boolean = true,
): TimeEntriesFetchingState => {
  const dispatch = useAppDispatch();

  // Get all required data from Redux store
  const dateRange = useAppSelector(selectDateRange);
  const teamMember = useAppSelector(selectTeamMember);
  const visibleDays = useAppSelector(selectVisibleDays);
  const breaks = useAppSelector(selectActiveBreaks);
  const customFields = useAppSelector(selectCustomFields);

  // Memoize the current week based on Redux date range
  const currentWeek: Week = useMemo(() => {
    const startDate = dayjs(dateRange.start);
    const endDate = dayjs(dateRange.end);
    return {
      startDate,
      endDate,
    };
  }, [dateRange.start, dateRange.end]);

  // Create a unique key for the current fetch parameters (purely from Redux state)
  const currentFetchKey = useMemo(() => {
    if (!teamMember?.id || !dateRange.start || !dateRange.end) return '';
    return `${teamMember.id}-${dateRange.start}-${dateRange.end}`;
  }, [teamMember?.id, dateRange.start, dateRange.end]);

  // Determine if we should fetch time entries (only when combined data is ready)
  const shouldFetchTimeEntries = useMemo(
    () =>
      combinedDataReady &&
      !!(teamMember?.id && dateRange.start && dateRange.end),
    [combinedDataReady, teamMember?.id, dateRange.start, dateRange.end],
  );

  // Get the nameId for the API call (only when we should fetch)
  const nameId = useMemo(
    () => (shouldFetchTimeEntries && teamMember ? teamMember.id : ''),
    [shouldFetchTimeEntries, teamMember],
  );

  // Fetch time entries using Redux-driven parameters
  // Note: This hook is always called, but it internally prevents API calls when nameId is empty (no team member selected)
  const {
    entries,
    loading: timeEntriesLoading,
    error: timeEntriesError,
    refetch,
  } = useReadWeeklyTimeEntries(nameId, currentWeek);

  const {
    fetchTeamBillableDetails,
    data: teamBillableDetails,
    isLoading: teamBillableDetailsLoading,
  } = useTeamBillableDetailsFetching();

  useEffect(() => {
    if (teamMember?.id) {
      fetchTeamBillableDetails();
    }
  }, [teamMember?.id, fetchTeamBillableDetails]);

  // Fill the team member dropdown name from the readWeekly response.
  //
  // When the team member is seeded with only an id — e.g. a Workforce
  // deep-link that passes `employeeId` (see useCombinedDataFetching) — its
  // display name is empty. The readWeekly response already carries the worker
  // identity in `timeForContactDAS`, so we resolve the name from there instead
  // of issuing a separate by-id worker lookup. The merge in `setTeamMember`
  // keys on a matching id, so this only back-fills the name and leaves the rest
  // of the team member state untouched. Guarded on an empty name so it never
  // clobbers a name the user (or preferences) already provided.
  useEffect(() => {
    if (
      !teamMember?.id ||
      teamMember.name ||
      !entries ||
      entries.length === 0
    ) {
      return;
    }
    const contact =
      entries.find((entry) => entry?.timeForContactDAS?.id === teamMember.id)
        ?.timeForContactDAS ??
      entries.find((entry) => entry?.timeForContactDAS)?.timeForContactDAS;
    if (!contact) {
      return;
    }
    const resolvedName = `${contact.firstName ?? ''} ${
      contact.lastName ?? ''
    }`.trim();
    if (resolvedName) {
      dispatch(setTeamMember({ ...teamMember, name: resolvedName }));
    }
  }, [entries, teamMember, dispatch]);

  useEffect(() => {
    dispatch(setTeamBillableDetails(teamBillableDetails));
  }, [teamBillableDetails, teamMember?.type, dispatch]);

  // Simple: sync loading state to Redux
  useEffect(() => {
    dispatch(
      setLoading({ loading: timeEntriesLoading || teamBillableDetailsLoading }),
    );
  }, [timeEntriesLoading, teamBillableDetailsLoading, dispatch]);

  // Content signature of the fetched entries. Apollo can hand back a NEW array
  // reference holding structurally-identical data — e.g. when an unrelated
  // request on the shared TIME_TRACKING client (per-customer assignment fetch)
  // resolves and re-renders this hook. Keying the merge on reference identity
  // would treat that new-but-equal array as fresh data and re-merge.
  //
  // We serialize the whole payload (keyed by fetch params) rather than a
  // hand-picked subset of fields: the transformer reads many fields off each
  // entry (date, duration, start/end time, service/class/location, customer/
  // project, notes, custom fields, break), so any subset risks silently
  // dropping a real server change. The week's payload is small, so a full
  // JSON.stringify is the cheap, correct "did anything change" check.
  const entriesSignature = useMemo(() => {
    if (entries === undefined) return undefined;
    return `${currentFetchKey}|${JSON.stringify(entries)}`;
  }, [entries, currentFetchKey]);

  // Process and merge time entries when fresh data arrives.
  //
  // Merging is destructive: it wipes the grid in Redux and rebuilds from the
  // server snapshot. It must only fire when the time-entry data itself changes —
  // NOT when its co-dependencies (visibleDays, breaks, customFields, currentWeek)
  // tick, and NOT when Apollo hands back a new-but-equal `entries` array. If it
  // ran on an unrelated re-render it would overwrite anything the user has typed
  // with the last server snapshot — the mid-interaction "flash then re-render"
  // customers reported when selecting a customer triggered downstream fetches.
  //
  // We bail out when the content signature is unchanged. The other deps are
  // still listed so transforms stay correct when fresh data does arrive after
  // they've changed.
  const lastMergedSignatureRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (entries === undefined) {
      return;
    }
    if (lastMergedSignatureRef.current === entriesSignature) {
      return;
    }
    lastMergedSignatureRef.current = entriesSignature;

    // Transform entries and derive optionID in a single pass for better performance
    let transformedRows = entries
      ? transformTimeEntriesToTimesheetRows(
          entries,
          currentWeek,
          visibleDays,
          breaks,
          customFields, // Pass custom fields for inline optionID derivation
        )
      : [];

    // Fallback: If any entries still need optionID derivation (edge cases)
    if (transformedRows.length > 0 && customFields && customFields.length > 0) {
      transformedRows = deriveCustomFieldOptionIds(
        transformedRows,
        customFields,
      );
    }

    dispatch(mergeTimeEntries({ entries: transformedRows, visibleDays }));
    // Trigger only on a real content change (entriesSignature). entries/currentWeek/
    // visibleDays/breaks/customFields are read inside but intentionally omitted from
    // the trigger list so a new-but-equal entries array (or an unrelated co-dependency
    // tick) does not cause a destructive re-merge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entriesSignature, dispatch]);

  // Handle error states
  useEffect(() => {
    if (timeEntriesError) {
      dispatch(setError({ error: timeEntriesError }));
      dispatch(setTimeEntriesError(timeEntriesError));
    } else {
      dispatch(clearTimeEntriesError());
    }
  }, [timeEntriesError, dispatch]);

  // Memoize the return state to prevent unnecessary re-renders
  return useMemo(
    () => ({
      loading: timeEntriesLoading,
      error: timeEntriesError,
      timeEntries: entries,
      currentWeek,
      hasData: entries && entries.length > 0,
      fetchKey: currentFetchKey,
      refetch,
    }),
    [
      timeEntriesLoading,
      timeEntriesError,
      entries,
      currentWeek,
      currentFetchKey,
      refetch,
    ],
  );
};
