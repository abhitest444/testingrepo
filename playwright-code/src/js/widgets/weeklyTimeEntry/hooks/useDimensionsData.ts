import { useEffect, useRef } from 'react';
import { useGetDimensions } from 'src/js/service/hooks/dimensions/useGetDimensions';
import { useDimensionVisibility } from 'src/js/common/useDimensionVisibility';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setDimensions,
  setDimensionsEnabled,
  setDimensionsLoading,
  setDimensionsError,
  selectDimensionsState,
} from '../store/dimensionsSlice';
import { selectTeamMember, selectTimeEntryTimeFor } from '../store/selectors';

/**
 * Hook to manage custom dimensions data fetching and Redux state for weekly
 * time entry.
 *
 * Only the dimension *definitions* are fetched here (id + label + active /
 * required / enabledForTimeTracking flags) via `useGetDimensions`. The
 * per-dimension option lists are NOT fetched — the quickfills widget
 * (`type="dimension"`) rendered by `WeeklyDimensions` resolves its own options,
 * mirroring how Single Time consumes dimensions.
 *
 * The fetch is gated by `useDimensionVisibility` so dimensions data is only
 * loaded for eligible customers.
 */
export const useDimensionsData = () => {
  const { isVisible } = useDimensionVisibility();
  const dispatch = useAppDispatch();
  // Tracks the worker id we last fetched definitions for, so a change of the
  // selected worker re-hits the query with the new default option ids. The
  // boolean flag distinguishes "never queried" from "queried for no worker"
  // (null) without a third sentinel value.
  const hasQueriedRef = useRef(false);
  const queriedForTimeForIdRef = useRef<string | null>(null);

  const dimensionsState = useAppSelector(selectDimensionsState);
  const { dimensions, enabled, loading, error } = dimensionsState;

  // Worker currently selected in the weekly header. Passed to the definitions
  // query so the backend resolves each dimension's worker default option.
  //
  // Prefer `teamMember` (updated by the header dropdown on every worker change,
  // and the source every other weekly data-fetch hook reads) and fall back to
  // `timeEntryTimeFor` (the default worker seeded on init) only until the
  // dropdown selection lands. Reading `timeEntryTimeFor` alone would pin the
  // query to the first worker, since that slice is never updated on a switch.
  const teamMember = useAppSelector(selectTeamMember);
  const defaultTimeFor = useAppSelector(selectTimeEntryTimeFor);
  const timeForId = teamMember?.id ?? defaultTimeFor?.id ?? null;

  const {
    dimensions: fetchedDimensions,
    loading: definitionsLoading,
    error: definitionsError,
    query: queryDefinitions,
  } = useGetDimensions();
  // Resolve dimension definitions when dimensions become visible, and re-resolve
  // whenever the selected worker changes so worker defaults stay in sync.
  useEffect(() => {
    if (!isVisible) return;
    if (hasQueriedRef.current && queriedForTimeForIdRef.current === timeForId)
      return;
    hasQueriedRef.current = true;
    queriedForTimeForIdRef.current = timeForId;
    // useGetDimensions already logs the failure and marks the FCI degraded;
    // just drop the "queried" flag so the next render can retry.
    queryDefinitions({ timeForId }).catch(() => {
      hasQueriedRef.current = false;
    });
  }, [isVisible, queryDefinitions, timeForId]);

  useEffect(() => {
    dispatch(setDimensionsEnabled(isVisible));
  }, [isVisible, dispatch]);

  // Persist definitions to Redux as they resolve.
  useEffect(() => {
    if (fetchedDimensions.length > 0) {
      dispatch(setDimensions(fetchedDimensions));
      dispatch(setDimensionsEnabled(true));
    }
  }, [fetchedDimensions, dispatch]);

  // Sync loading state to Redux.
  useEffect(() => {
    dispatch(setDimensionsLoading(definitionsLoading));
  }, [definitionsLoading, dispatch]);

  // Sync error state to Redux.
  useEffect(() => {
    if (definitionsError) {
      dispatch(setDimensionsError(definitionsError));
    }
  }, [definitionsError, dispatch]);

  return {
    dimensions,
    enabled,
    loading,
    error,
    isVisible,
  };
};
