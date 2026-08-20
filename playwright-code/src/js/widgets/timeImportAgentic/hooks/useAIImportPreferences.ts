import { useCallback, useEffect, useRef } from 'react';
import { Sandbox } from 'src/js/common/sandbox';
import { useAppDispatch } from '../store';
import {
  setColumnMappings as setColumnMappingsRedux,
  setImpose8HourLimit as setImpose8HourLimitRedux,
  setPreferencesSeen as setPreferencesSeenRedux,
  setSkipFieldMapping as setSkipFieldMappingRedux,
  setAllAIPreferences,
  setAIPreferencesLoading,
  setAIPreferencesError,
} from '../store/aiImportPreferencesSlice';
import {
  AI_IMPORT_STORAGE_KEYS,
  getAIImportPreference,
  getAIImportPreferenceSync,
  setAIImportPreference,
  clearAllAIImportPreferences,
} from '../utils/sandboxPreferencesStorage';

/** Step 3 value mappings: unrecognized value (key) → { mappedId, mappedName } for each category */
export interface Step3ValueMappingsPayload {
  services?: Record<string, { mappedId: string; mappedName: string }>;
  customers?: Record<string, { mappedId: string; mappedName: string }>;
  employees?: Record<string, { mappedId: string; mappedName: string }>;
  classes?: Record<string, { mappedId: string; mappedName: string }>;
  locations?: Record<string, { mappedId: string; mappedName: string }>;
  customFieldDropdownValues?: Record<
    string,
    { mappedId: string; mappedName: string }
  >;
}

/**
 * Hook for managing AI import preferences using sandbox persistent storage
 *
 * Stores ONLY UI/UX preferences in sandbox storage:
 * - Column mappings (user's personal column mapping choices)
 * - Step 3 value mappings (unrecognized value → QB id/name so we can skip step 3 when all match)
 * - 8-hour limit toggle (user's personal preference)
 * - Preferences seen (whether user has seen preferences screen)
 * - Skip field mapping (whether to skip field mapping step)
 *
 * @param sandbox - AppFabric sandbox instance
 */
export const useAIImportPreferences = (sandbox: Sandbox) => {
  const dispatch = useAppDispatch();
  const hasLoadedRef = useRef(false);

  // Load all preferences from sandbox storage on mount and sync to Redux
  useEffect(() => {
    if (!sandbox || hasLoadedRef.current) return;

    hasLoadedRef.current = true;
    dispatch(setAIPreferencesLoading(true));

    const loadAllPreferences = async () => {
      try {
        // Load all preferences from sandbox storage
        const columnMappingsStr = await getAIImportPreference(
          sandbox,
          AI_IMPORT_STORAGE_KEYS.COLUMN_MAPPING,
        );
        const impose8HourLimitStr = await getAIImportPreference(
          sandbox,
          AI_IMPORT_STORAGE_KEYS.IMPOSE_8_HOUR_LIMIT,
        );
        const preferencesSeenStr = await getAIImportPreference(
          sandbox,
          AI_IMPORT_STORAGE_KEYS.PREFERENCES_SEEN,
        );
        const skipFieldMappingStr = await getAIImportPreference(
          sandbox,
          AI_IMPORT_STORAGE_KEYS.SKIP_FIELD_MAPPING,
        );

        // Parse and sync to Redux
        dispatch(
          setAllAIPreferences({
            columnMappings: columnMappingsStr
              ? JSON.parse(String(columnMappingsStr))
              : {},
            impose8HourLimit: impose8HourLimitStr
              ? Number(impose8HourLimitStr) === 1
              : true, // Default to true
            preferencesSeen: preferencesSeenStr === 'true',
            skipFieldMapping: skipFieldMappingStr === 'true',
            loading: false,
            error: null,
          }),
        );
      } catch (error) {
        dispatch(
          setAIPreferencesError(
            error instanceof Error ? error.message : String(error),
          ),
        );
      }
    };

    loadAllPreferences();
  }, [sandbox, dispatch]);
  /**
   * Save column mappings to sandbox storage AND Redux
   * @param mappings - Object mapping Excel columns to QB fields
   */
  /**
   * Save column mappings to sandbox storage (USER-scoped)
   * Merges with existing mappings instead of overwriting
   * @param mappings - Column mappings to save (will be merged with existing)
   */
  const saveColumnMappings = useCallback(
    (mappings: Record<string, string>) => {
      // Get existing mappings from sandbox storage (source of truth)
      const existingValue = getAIImportPreferenceSync(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.COLUMN_MAPPING,
      );

      let existingMappings: Record<string, string> = {};
      if (existingValue && typeof existingValue === 'string') {
        try {
          existingMappings = JSON.parse(existingValue);
        } catch {
          // Invalid JSON, start fresh
        }
      }

      // Merge: new mappings take precedence over existing ones
      const mergedMappings = {
        ...existingMappings,
        ...mappings,
      };

      const mappingsString = JSON.stringify(mergedMappings);
      setAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.COLUMN_MAPPING,
        mappingsString,
      );
      // Sync to Redux immediately
      dispatch(setColumnMappingsRedux(mergedMappings));
    },
    [sandbox, dispatch],
  );

  /**
   * Get column mappings (async) (USER-scoped)
   * @returns Promise resolving to column mappings or empty object
   */
  const getColumnMappings = useCallback(async (): Promise<
    Record<string, string>
  > => {
    const value = await getAIImportPreference(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.COLUMN_MAPPING,
    );

    if (!value || typeof value !== 'string') {
      return {};
    }

    try {
      return JSON.parse(value);
    } catch {
      sandbox.logger.warn('[AI Import] Failed to parse column mappings');
      return {};
    }
  }, [sandbox]);

  /**
   * Get column mappings (sync) (USER-scoped)
   * @returns Column mappings or empty object
   */
  const getColumnMappingsSync = useCallback((): Record<string, string> => {
    const value = getAIImportPreferenceSync(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.COLUMN_MAPPING,
    );

    if (!value || typeof value !== 'string') {
      return {};
    }

    try {
      return JSON.parse(value);
    } catch {
      sandbox.logger.warn('[AI Import] Failed to parse column mappings (sync)');
      return {};
    }
  }, [sandbox]);

  /**
   * Save Step 3 value mappings to sandbox storage (USER-scoped).
   * Merges with existing so we can skip Step 3 when all unrecognized values were previously mapped.
   */
  const saveStep3ValueMappings = useCallback(
    (payload: Step3ValueMappingsPayload) => {
      const existingValue = getAIImportPreferenceSync(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.STEP3_VALUE_MAPPINGS,
      );
      let existing: Step3ValueMappingsPayload = {};
      if (existingValue && typeof existingValue === 'string') {
        try {
          existing = JSON.parse(existingValue);
        } catch {
          // invalid JSON, start fresh
        }
      }
      const merged: Step3ValueMappingsPayload = {
        services: { ...existing.services, ...payload.services },
        customers: { ...existing.customers, ...payload.customers },
        employees: { ...existing.employees, ...payload.employees },
        classes: { ...existing.classes, ...payload.classes },
        locations: { ...existing.locations, ...payload.locations },
        customFieldDropdownValues: {
          ...existing.customFieldDropdownValues,
          ...payload.customFieldDropdownValues,
        },
      };
      setAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.STEP3_VALUE_MAPPINGS,
        JSON.stringify(merged),
      );
    },
    [sandbox],
  );

  /**
   * Get Step 3 value mappings from sandbox storage (USER-scoped).
   */
  const getStep3ValueMappings =
    useCallback(async (): Promise<Step3ValueMappingsPayload> => {
      const value = await getAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.STEP3_VALUE_MAPPINGS,
      );
      if (!value || typeof value !== 'string') return {};
      try {
        return JSON.parse(value);
      } catch {
        sandbox.logger.warn('[AI Import] Failed to parse step3 value mappings');
        return {};
      }
    }, [sandbox]);

  const getStep3ValueMappingsSync =
    useCallback((): Step3ValueMappingsPayload => {
      const value = getAIImportPreferenceSync(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.STEP3_VALUE_MAPPINGS,
      );
      if (!value || typeof value !== 'string') return {};
      try {
        return JSON.parse(value);
      } catch {
        sandbox.logger.warn(
          '[AI Import] Failed to parse step3 value mappings (sync)',
        );
        return {};
      }
    }, [sandbox]);

  /**
   * Save employee mappings to sandbox storage AND Redux
   * @param mappings - Object mapping Excel employee names to QB employee IDs
   */
  /**
   * Save employee mappings to sandbox storage (USER-scoped)
   * Merges with existing mappings instead of overwriting
   * @param mappings - Employee mappings to save (will be merged with existing)
   */
  const saveEmployeeMappings = useCallback(
    (
      mappings: Record<string, { employeeId: string; employeeName: string }>,
    ) => {
      // Get existing mappings from sandbox storage (source of truth)
      const existingValue = getAIImportPreferenceSync(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.EMPLOYEE_MAPPING,
      );

      let existingMappings: Record<
        string,
        { employeeId: string; employeeName: string }
      > = {};
      if (existingValue && typeof existingValue === 'string') {
        try {
          existingMappings = JSON.parse(existingValue);
        } catch {
          // Invalid JSON, start fresh
        }
      }

      // Merge: new mappings take precedence over existing ones
      const mergedMappings = {
        ...existingMappings,
        ...mappings,
      };

      const mappingsString = JSON.stringify(mergedMappings);
      setAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.EMPLOYEE_MAPPING,
        mappingsString,
      );
      // Sync to Redux immediately
      // dispatch(setEmployeeMappingsRedux(mergedMappings)); // DEPRECATED
    },
    [sandbox, dispatch],
  );

  /**
   * Get employee mappings (async) (USER-scoped)
   * @returns Promise resolving to employee mappings or empty object
   */
  const getEmployeeMappings = useCallback(async (): Promise<
    Record<string, { employeeId: string; employeeName: string }>
  > => {
    const value = await getAIImportPreference(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.EMPLOYEE_MAPPING,
    );

    if (!value || typeof value !== 'string') {
      return {};
    }

    try {
      return JSON.parse(value);
    } catch {
      sandbox.logger.warn('[AI Import] Failed to parse employee mappings');
      return {};
    }
  }, [sandbox]);

  /**
   * Get employee mappings (sync) (USER-scoped)
   * @returns Employee mappings or empty object
   */
  const getEmployeeMappingsSync = useCallback((): Record<
    string,
    { employeeId: string; employeeName: string }
  > => {
    const value = getAIImportPreferenceSync(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.EMPLOYEE_MAPPING,
    );

    if (!value || typeof value !== 'string') {
      return {};
    }

    try {
      return JSON.parse(value);
    } catch {
      sandbox.logger.warn(
        '[AI Import] Failed to parse employee mappings (sync)',
      );
      return {};
    }
  }, [sandbox]);

  /**
   * Save customer mappings (USER-scoped) - merges with existing
   */
  const saveCustomerMappings = useCallback(
    (mappings: Record<string, { mappedId: string; mappedName: string }>) => {
      const existingValue = getAIImportPreferenceSync(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.CUSTOMER_MAPPING,
      );

      let existingMappings: Record<
        string,
        { mappedId: string; mappedName: string }
      > = {};
      if (existingValue && typeof existingValue === 'string') {
        try {
          existingMappings = JSON.parse(existingValue);
        } catch {
          // Invalid JSON, start fresh
        }
      }

      const mergedMappings = {
        ...existingMappings,
        ...mappings,
      };

      const mappingsString = JSON.stringify(mergedMappings);
      setAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.CUSTOMER_MAPPING,
        mappingsString,
      );
      // dispatch(setCustomerMappingsRedux(mergedMappings)); // DEPRECATED
    },
    [sandbox, dispatch],
  );

  /**
   * Save class mappings (USER-scoped) - merges with existing
   */
  const saveClassMappings = useCallback(
    (mappings: Record<string, { mappedId: string; mappedName: string }>) => {
      const existingValue = getAIImportPreferenceSync(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.CLASS_MAPPING,
      );

      let existingMappings: Record<
        string,
        { mappedId: string; mappedName: string }
      > = {};
      if (existingValue && typeof existingValue === 'string') {
        try {
          existingMappings = JSON.parse(existingValue);
        } catch {
          // Invalid JSON, start fresh
        }
      }

      const mergedMappings = {
        ...existingMappings,
        ...mappings,
      };

      const mappingsString = JSON.stringify(mergedMappings);
      setAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.CLASS_MAPPING,
        mappingsString,
      );
      // dispatch(setClassMappingsRedux(mergedMappings)); // DEPRECATED
    },
    [sandbox, dispatch],
  );

  /**
   * Save service mappings (USER-scoped) - merges with existing
   */
  const saveServiceMappings = useCallback(
    (mappings: Record<string, { mappedId: string; mappedName: string }>) => {
      const existingValue = getAIImportPreferenceSync(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.SERVICE_MAPPING,
      );

      let existingMappings: Record<
        string,
        { mappedId: string; mappedName: string }
      > = {};
      if (existingValue && typeof existingValue === 'string') {
        try {
          existingMappings = JSON.parse(existingValue);
        } catch {
          // Invalid JSON, start fresh
        }
      }

      const mergedMappings = {
        ...existingMappings,
        ...mappings,
      };

      const mappingsString = JSON.stringify(mergedMappings);
      setAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.SERVICE_MAPPING,
        mappingsString,
      );
      // dispatch(setServiceMappingsRedux(mergedMappings)); // DEPRECATED
    },
    [sandbox, dispatch],
  );

  /**
   * Save location mappings (USER-scoped) - merges with existing
   */
  const saveLocationMappings = useCallback(
    (mappings: Record<string, { mappedId: string; mappedName: string }>) => {
      const existingValue = getAIImportPreferenceSync(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.LOCATION_MAPPING,
      );

      let existingMappings: Record<
        string,
        { mappedId: string; mappedName: string }
      > = {};
      if (existingValue && typeof existingValue === 'string') {
        try {
          existingMappings = JSON.parse(existingValue);
        } catch {
          // Invalid JSON, start fresh
        }
      }

      const mergedMappings = {
        ...existingMappings,
        ...mappings,
      };

      const mappingsString = JSON.stringify(mergedMappings);
      setAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.LOCATION_MAPPING,
        mappingsString,
      );
      // dispatch(setLocationMappingsRedux(mergedMappings)); // DEPRECATED
    },
    [sandbox, dispatch],
  );

  /**
   * Save custom field mappings (USER-scoped) - merges with existing
   */
  const saveCustomFieldMappings = useCallback(
    (mappings: Record<string, { mappedId: string; mappedName: string }>) => {
      const existingValue = getAIImportPreferenceSync(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.CUSTOM_FIELD_MAPPING,
      );

      let existingMappings: Record<
        string,
        { mappedId: string; mappedName: string }
      > = {};
      if (existingValue && typeof existingValue === 'string') {
        try {
          existingMappings = JSON.parse(existingValue);
        } catch {
          // Invalid JSON, start fresh
        }
      }

      const mergedMappings = {
        ...existingMappings,
        ...mappings,
      };

      const mappingsString = JSON.stringify(mergedMappings);
      setAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.CUSTOM_FIELD_MAPPING,
        mappingsString,
      );
      // dispatch(setCustomFieldMappingsRedux(mergedMappings)); // DEPRECATED
    },
    [sandbox, dispatch],
  );

  /**
   * Set whether to impose 8-hour limit (USER-scoped)
   * @param impose - Boolean flag
   */
  const setImpose8HourLimit = useCallback(
    (impose: boolean) => {
      setAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.IMPOSE_8_HOUR_LIMIT,
        impose,
      );
      // Sync to Redux immediately
      dispatch(setImpose8HourLimitRedux(impose));
    },
    [sandbox, dispatch],
  );

  /**
   * Get whether to impose 8-hour limit (async) (USER-scoped)
   * @returns Promise resolving to boolean
   */
  const getImpose8HourLimit = useCallback(async (): Promise<boolean> => {
    const value = await getAIImportPreference(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.IMPOSE_8_HOUR_LIMIT,
    );
    return value === true;
  }, [sandbox]);

  /**
   * Get whether to impose 8-hour limit (sync) (USER-scoped)
   * @returns Boolean
   */
  const getImpose8HourLimitSync = useCallback((): boolean => {
    const value = getAIImportPreferenceSync(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.IMPOSE_8_HOUR_LIMIT,
    );
    return value === true;
  }, [sandbox]);

  /**
   * Mark preferences as seen
   */
  const markPreferencesSeen = useCallback(() => {
    setAIImportPreference(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.PREFERENCES_SEEN,
      'true',
    );
    // Sync to Redux immediately
    dispatch(setPreferencesSeenRedux(true));
  }, [sandbox, dispatch]);

  /**
   * Check if preferences were seen (async)
   * @returns Promise resolving to boolean
   */
  const werePreferencesSeen = useCallback(async (): Promise<boolean> => {
    const value = await getAIImportPreference(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.PREFERENCES_SEEN,
    );
    return value === 'true';
  }, [sandbox]);

  /**
   * Check if preferences were seen (sync)
   * @returns Boolean
   */
  const werePreferencesSeenSync = useCallback((): boolean => {
    const value = getAIImportPreferenceSync(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.PREFERENCES_SEEN,
    );
    return value === 'true';
  }, [sandbox]);

  /**
   * Set skip field mapping preference
   * @param skip - Boolean flag
   */
  const setSkipFieldMapping = useCallback(
    (skip: boolean) => {
      setAIImportPreference(
        sandbox,
        AI_IMPORT_STORAGE_KEYS.SKIP_FIELD_MAPPING,
        skip ? 'true' : 'false',
      );
      // Sync to Redux immediately
      dispatch(setSkipFieldMappingRedux(skip));
    },
    [sandbox, dispatch],
  );

  /**
   * Get skip field mapping preference (async)
   * @returns Promise resolving to boolean
   */
  const getSkipFieldMapping = useCallback(async (): Promise<boolean> => {
    const value = await getAIImportPreference(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.SKIP_FIELD_MAPPING,
    );
    return value === 'true';
  }, [sandbox]);

  /**
   * Get skip field mapping preference (sync)
   * @returns Boolean
   */
  const getSkipFieldMappingSync = useCallback((): boolean => {
    const value = getAIImportPreferenceSync(
      sandbox,
      AI_IMPORT_STORAGE_KEYS.SKIP_FIELD_MAPPING,
    );
    return value === 'true';
  }, [sandbox]);

  /**
   * Clear all AI import preferences
   * Useful for testing or reset scenarios
   */
  const clearAll = useCallback(() => {
    clearAllAIImportPreferences(sandbox);
  }, [sandbox]);

  /**
   * Load all AI Import preferences from sandbox storage into Redux on mount
   * This ensures Redux state is in sync with persisted sandbox data
   */
  useEffect(() => {
    const loadAllPreferences = async () => {
      try {
        dispatch(setAIPreferencesLoading(true));

        // Load all preferences in parallel
        const [
          columnMappings,
          employeeMappings,
          impose8Hour,
          prefSeen,
          skipMapping,
        ] = await Promise.all([
          getColumnMappings(),
          getEmployeeMappings(),
          getImpose8HourLimit(),
          werePreferencesSeen(),
          getSkipFieldMapping(),
        ]);

        // Sync to Redux
        dispatch(setColumnMappingsRedux(columnMappings));
        // dispatch(setEmployeeMappingsRedux(employeeMappings)); // DEPRECATED
        dispatch(setImpose8HourLimitRedux(impose8Hour));
        dispatch(setPreferencesSeenRedux(prefSeen));
        dispatch(setSkipFieldMappingRedux(skipMapping));

        dispatch(setAIPreferencesLoading(false));
      } catch (error) {
        sandbox.logger.error(
          '[AI Import] Failed to load preferences:',
          error as any,
        );
        dispatch(setAIPreferencesError('Failed to load AI import preferences'));
        dispatch(setAIPreferencesLoading(false));
      }
    };

    loadAllPreferences();
    // Only run on mount - we don't want to reload on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // Column mappings
    saveColumnMappings,
    getColumnMappings,
    getColumnMappingsSync,

    // Step 3 value mappings (so we can skip step 3 when all values were previously mapped)
    saveStep3ValueMappings,
    getStep3ValueMappings,
    getStep3ValueMappingsSync,

    // 8-hour limit
    setImpose8HourLimit,
    getImpose8HourLimit,
    getImpose8HourLimitSync,

    // Preferences seen
    markPreferencesSeen,
    werePreferencesSeen,
    werePreferencesSeenSync,

    // Skip field mapping
    setSkipFieldMapping,
    getSkipFieldMapping,
    getSkipFieldMappingSync,

    // Clear all
    clearAll,

    // DEPRECATED: Field mappings are no longer saved to sandbox (kept for backward compatibility)
    // These are no-op functions that won't break existing code but don't do anything
    saveEmployeeMappings: async () => {},
    getEmployeeMappings: async () => ({}),
    getEmployeeMappingsSync: () => ({}),
    saveCustomerMappings: async () => {},
    saveClassMappings: async () => {},
    saveServiceMappings: async () => {},
    saveLocationMappings: async () => {},
    saveCustomFieldMappings: async () => {},
  };
};
