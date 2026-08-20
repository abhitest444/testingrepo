import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useCombinedDataFetching } from '../hooks/useCombinedDataFetching';
import { useGridInitialization } from '../hooks/useGridInitialization';
import { useTimeEntriesFetching } from '../hooks/useTimeEntriesFetching';
import { useIXPFeatureFlag } from '../../../common/useIXPFeatureFlag';
import { useAppDispatch } from '../store';
import {
  setQuickFindEnabled,
  setQuickFindSettled,
  setDateRange,
} from '../store/timeEntryGridSlice';
import { WeeklyTimeEntryTrowser } from './WeeklyTimeEntryTrowser';
import { KeyboardShortcutsWrapper } from './KeyboardShortcutsWrapper';
import { clearValidationError } from '../store/validationSlice';
import { WTEAssignmentManager } from '../hooks/WTEAssignmentManager';
import { WTEAssignmentsProvider } from '../context/WTEAssignmentsContext';
import { SubmitTimeDatesProvider } from '../../common/submitTimeDates/SubmitTimeDatesProvider';

interface WeeklyTimeEntryDataProviderProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  employeeId?: string | null;
}

export const WeeklyTimeEntryDataProvider: React.FC<WeeklyTimeEntryDataProviderProps> =
  React.memo(({ isOpen, setOpen, employeeId = null }) => {
    const dispatch = useAppDispatch();
    const hasInitializedRef = useRef(false);
    // Step 1: Call combined data fetching first (settings, preferences, custom fields)
    const {
      settings: settingsData,
      currentWeek,
      loading: combinedLoading,
      error: combinedError,
    } = useCombinedDataFetching(employeeId);

    // Resolve feature flags before useGridInitialization so we can pass the
    // settle/enabled values in directly. Reading them from Redux inside the
    // hook would lag one render (Redux is updated via useEffect), which lets
    // the UI become interactive before the flag-dependent fetches have
    // started — exactly the race this PR is fixing.
    const {
      isEnabled: isPostR2ReleaseTimeExperienceEnabled,
      settled: isPostR2ReleaseTimeExperienceEnabledSettled,
    } = useIXPFeatureFlag({
      flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_R2_RELEASE,
      defaultValue: false,
    });

    // Step 2: Start grid initialization immediately (don't wait for combined data)
    const { isLoading: gridLoading } = useGridInitialization();

    // Step 3: Get time entries data and refetch function (only after combined data is ready)
    const {
      loading: timeEntriesLoading,
      error: timeEntriesError,
      refetch,
    } = useTimeEntriesFetching(!combinedLoading && !combinedError);

    // Dispatch feature flag values to Redux when they change
    useEffect(() => {
      dispatch(setQuickFindEnabled(isPostR2ReleaseTimeExperienceEnabled));
    }, [dispatch, isPostR2ReleaseTimeExperienceEnabled]);

    useEffect(() => {
      dispatch(
        setQuickFindSettled(isPostR2ReleaseTimeExperienceEnabledSettled),
      );
    }, [dispatch, isPostR2ReleaseTimeExperienceEnabledSettled]);

    // Show loading spinner until ALL data is ready.
    // Why: rendering the UI before the R2 feature flag settles causes the
    // field tree to swap on flag arrival, which remounts the grid and
    // re-fetches time entries — wiping anything the user typed. Wait for the
    // flag to settle along with the data so the form only becomes interactive
    // once the tree is stable. Errors are not gated here; individual hooks
    // still surface their own errors below the loading state.
    const isLoading = useMemo(
      () =>
        combinedLoading ||
        gridLoading ||
        (timeEntriesLoading && !combinedLoading) ||
        !isPostR2ReleaseTimeExperienceEnabledSettled,
      [
        combinedLoading,
        gridLoading,
        timeEntriesLoading,
        isPostR2ReleaseTimeExperienceEnabledSettled,
      ],
    );

    // Memoize data objects to prevent unnecessary re-renders
    const memoizedSettingsData = useMemo(() => settingsData, [settingsData]);

    // Pass currentWeek directly without memoization
    const memoizedCurrentWeek = currentWeek;

    // Memoize refetch function to prevent unnecessary re-renders
    const memoizedRefetch = useCallback(() => {
      if (refetch) {
        refetch();
      }
    }, [refetch]);

    // Create week change handler for keyboard shortcuts
    const handleWeekChange = useCallback(
      (newDateRange: { start: string; end: string }) => {
        dispatch(setDateRange(newDateRange));
        // Clear validation errors when changing weeks
        dispatch(clearValidationError());
      },
      [dispatch],
    );

    // Mark as initialized after first data load - optimize to prevent unnecessary re-runs
    useEffect(() => {
      // Early return if already initialized
      if (hasInitializedRef.current) {
        return;
      }

      // Mark as initialized when we have data and no errors
      if (!isLoading && !timeEntriesError) {
        hasInitializedRef.current = true;
      }
    }, [isLoading, timeEntriesError]);

    return (
      <KeyboardShortcutsWrapper
        currentWeek={memoizedCurrentWeek}
        onWeekChange={handleWeekChange}
        setOpen={setOpen}
      >
        {/* Fetch customer/project list on worker change; provide loadMore via context */}
        <WTEAssignmentsProvider>
          {/* Assignment Manager - monitors rows and fetches assignments; provides SFO refetch context for search */}
          <WTEAssignmentManager>
            <SubmitTimeDatesProvider>
              <WeeklyTimeEntryTrowser
                isOpen={isOpen}
                setOpen={setOpen}
                // Pass memoized data as props to prevent unnecessary re-renders
                settingsData={memoizedSettingsData}
                currentWeek={memoizedCurrentWeek}
                isLoading={isLoading}
                error={timeEntriesError}
                refetch={memoizedRefetch}
              />
            </SubmitTimeDatesProvider>
          </WTEAssignmentManager>
        </WTEAssignmentsProvider>
      </KeyboardShortcutsWrapper>
    );
  });
