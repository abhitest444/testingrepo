import { useEffect, useCallback, useRef } from 'react';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCompanySettings,
  setCompanySettingsLoading,
  setCompanySettingsError,
} from '../store/companySettingsSlice';

/**
 * Hook for fetching and managing company settings data
 * Similar to useCombinedDataFetching in weeklyTimeEntry
 */
export const useCompanySettingsData = () => {
  const dispatch = useAppDispatch();

  // Get current state
  const { settings, loading, error } = useAppSelector(
    (state) => state.companySettings,
  );

  // Fetch company settings using the existing hook
  const {
    settingsData: companySettings,
    loading: companySettingsLoading,
    error: companySettingsError,
    qlSettings,
  } = useCompanySettings();

  // Helper function to extract error message
  const getErrorMessage = useCallback((error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return String(error.message);
    }
    return 'An error occurred while fetching company settings';
  }, []);

  // Track previous values to prevent unnecessary dispatches
  const prevLoadingRef = useRef(companySettingsLoading);
  const prevErrorRef = useRef<any>(companySettingsError);
  const prevQlSettingsRef = useRef<any>(null);

  // Batched update: combine all Redux dispatches into a single effect
  useEffect(() => {
    const loadingChanged = prevLoadingRef.current !== companySettingsLoading;
    const errorChanged = prevErrorRef.current !== companySettingsError;

    // Check if qlSettings have changed (to handle delayed loading of qlSettings)
    const qlSettingsChanged =
      JSON.stringify(prevQlSettingsRef.current) !== JSON.stringify(qlSettings);
    const settingsChanged =
      companySettings && (qlSettings || qlSettingsChanged);

    if (loadingChanged) {
      dispatch(setCompanySettingsLoading(companySettingsLoading));
      prevLoadingRef.current = companySettingsLoading;
    }

    if (errorChanged) {
      if (companySettingsError) {
        const errorMessage = getErrorMessage(companySettingsError);
        dispatch(setCompanySettingsError(errorMessage));
      } else {
        dispatch(setCompanySettingsError(null));
      }
      prevErrorRef.current = companySettingsError;
    }

    if (settingsChanged) {
      const newSettings = {
        isServiceFieldEnabled: companySettings.isServiceFieldEnabled,
        isBillingFieldEnabled: companySettings.isBillingFieldEnabled,
        firstDayOfWeek: companySettings.firstDayOfWeek,
        isClassEnabled: companySettings.isClassEnabled,
        isLocationEnabled: companySettings.isLocationEnabled,
        classRequired: qlSettings?.classRequired?.value ?? false,
        locationRequired: qlSettings?.locationRequired?.value ?? false,
        serviceItemRequired: qlSettings?.serviceItemRequired?.value ?? false,
        requireBillable: qlSettings?.requireBillable?.value ?? false,
        timeSheetEntryMakesNotesRequiredEnabled:
          qlSettings?.timeSheetEntryMakesNotesRequiredEnabled?.value ?? false,
      };

      dispatch(setCompanySettings(newSettings));

      // Update the previous qlSettings ref
      prevQlSettingsRef.current = qlSettings;
    }
  }, [
    companySettings,
    qlSettings,
    companySettingsLoading,
    companySettingsError,
    dispatch,
    getErrorMessage,
  ]);

  return {
    settings,
    loading,
    error,
  };
};
