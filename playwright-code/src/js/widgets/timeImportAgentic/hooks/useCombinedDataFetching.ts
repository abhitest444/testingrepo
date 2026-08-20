import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setUxPreferencesData } from '../store/uxPreferencesSlice';
import { selectUploadId } from '../store/selectors';
import {
  useUxPreferences,
  UxPreferenceKey,
} from '../../../service/utils/useUXPreferences';

/**
 * Combined data fetching hook - loads REALM-scoped UX preferences
 *
 * IMPORTANT: This hook now only loads REALM-scoped preferences:
 * - Preferences seen (company-wide setting)
 * - Skip field mapping (company-wide setting)
 *
 * USER-scoped preferences are now loaded from sandbox storage:
 * - Column mappings (see useAIImportPreferences)
 * - Employee mappings (see useAIImportPreferences)
 * - 8-hour limit toggle (see useAIImportPreferences)
 */
export const useCombinedDataFetching = () => {
  const dispatch = useAppDispatch();
  const uploadId = useAppSelector(selectUploadId);
  const hasInitializedRef = useRef(false);

  // Fetch UX preferences using the hook (REALM-scoped only)
  const {
    data: uxPreferencesData,
    loading: uxPreferencesLoading,
    error: uxPreferencesError,
    getPreference,
  } = useUxPreferences();

  // Function to fetch REALM-scoped preferences
  const fetchPreferences = useCallback(() => {
    getPreference(UxPreferenceKey.TIME_SHEET_GEN_AI_PREFERENCES_SEEN);
    getPreference(UxPreferenceKey.TIME_SHEET_GEN_AI_SKIP_FIELD_MAPPING);
  }, [getPreference]);

  // Load UX preferences on mount - only run once
  useEffect(() => {
    if (!hasInitializedRef.current) {
      fetchPreferences();
      hasInitializedRef.current = true;
    }
  }, [fetchPreferences]);

  // Track if we've already synced data to prevent redundant dispatches
  const hasSyncedDataRef = useRef(false);
  const prevLoadingRef = useRef(uxPreferencesLoading);
  const prevUploadIdRef = useRef<string>('');

  // Sync loaded data to Redux - run when data changes
  useEffect(() => {
    if (!uxPreferencesLoading && uxPreferencesData) {
      // Use uploadId for comparison
      if (uploadId !== prevUploadIdRef.current || !hasSyncedDataRef.current) {
        dispatch(setUxPreferencesData(uxPreferencesData));
        prevUploadIdRef.current = uploadId;
        hasSyncedDataRef.current = true;
      }
    }

    // Reset sync flag if loading state changes (for refetch scenarios)
    if (
      prevLoadingRef.current !== uxPreferencesLoading &&
      uxPreferencesLoading
    ) {
      hasSyncedDataRef.current = false;
    }
    prevLoadingRef.current = uxPreferencesLoading;
  }, [uxPreferencesData, uxPreferencesLoading, uploadId, dispatch]);

  // Refetch function for "Start Over" - forces a fresh fetch
  const refetch = useCallback(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    uxPreferencesData,
    uxPreferencesLoading,
    uxPreferencesError,
    refetch,
  };
};
