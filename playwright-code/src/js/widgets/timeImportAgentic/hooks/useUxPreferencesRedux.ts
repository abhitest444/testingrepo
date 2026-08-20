import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { UxPreferenceKey } from '../../../service/utils/useUXPreferences';
import { RootState } from '../store';

/**
 * Simplified hook that only reads UX preferences from Redux
 * Loading happens ONLY in Step 1 (timeImportAgentic.tsx)
 * This hook is just for reading the cached data
 */
export const useUxPreferencesRedux = (): {
  data: any;
  loading: boolean;
  error: string | null;
  lastLoaded: number | null;
  getPreference: (key: UxPreferenceKey) => any;
  getColumnMappings: () => Record<string, any>;
  getEmployeeMappings: () => Record<string, any>;
} => {
  // Redux state (read-only)
  const uxPreferencesState = useSelector(
    (state: RootState) => state.uxPreferences,
  );

  // Helper function to get a specific preference
  const getPreference = useCallback(
    (key: UxPreferenceKey) => uxPreferencesState.data[key],
    [uxPreferencesState.data],
  );

  // Helper function to get employee mappings
  const getEmployeeMappings = useCallback(() => {
    const mappings = getPreference(
      UxPreferenceKey.TIME_SHEET_GEN_AI_EMPLOYEE_MAPPING,
    );

    // Handle empty or null values
    if (
      !mappings ||
      mappings === '' ||
      mappings === 'null' ||
      mappings === 'undefined'
    ) {
      return {};
    }

    if (typeof mappings === 'string') {
      try {
        const parsed = JSON.parse(mappings);
        return parsed || {};
      } catch (error) {
        return {};
      }
    }

    return mappings || {};
  }, [getPreference]);

  // Helper function to get column mappings
  const getColumnMappings = useCallback(() => {
    const mappings = getPreference(
      UxPreferenceKey.TIME_SHEET_GEN_AI_COLUMN_MAPPING,
    );

    // Handle empty or null values
    if (
      !mappings ||
      mappings === '' ||
      mappings === 'null' ||
      mappings === 'undefined'
    ) {
      return {};
    }

    if (typeof mappings === 'string') {
      try {
        const parsed = JSON.parse(mappings);
        return parsed || {};
      } catch (error) {
        return {};
      }
    }

    return mappings || {};
  }, [getPreference]);

  return {
    // Redux state
    data: uxPreferencesState.data,
    loading: uxPreferencesState.loading,
    error: uxPreferencesState.error,
    lastLoaded: uxPreferencesState.lastLoaded,

    // Helper functions (read-only)
    getPreference,
    getEmployeeMappings,
    getColumnMappings,
  };
};
