import { Sandbox } from 'src/js/common/sandbox';

/**
 * Storage keys for AI import preferences using sandbox persistent storage
 *
 * ALL AI import preferences are now stored in sandbox storage (persona-scoped).
 * UX Preferences API is no longer used for AI import - only for other features.
 */
export const AI_IMPORT_STORAGE_KEYS = {
  COLUMN_MAPPING: 'time-import-ai-column-mapping',
  /** Step 3 value mappings: unrecognized value → QB id/name (services, customers, employees, classes, locations, custom fields) */
  STEP3_VALUE_MAPPINGS: 'time-import-ai-step3-value-mappings',
  EMPLOYEE_MAPPING: 'time-import-ai-employee-mapping',
  CUSTOMER_MAPPING: 'time-import-ai-customer-mapping',
  CLASS_MAPPING: 'time-import-ai-class-mapping',
  SERVICE_MAPPING: 'time-import-ai-service-mapping',
  LOCATION_MAPPING: 'time-import-ai-location-mapping',
  CUSTOM_FIELD_MAPPING: 'time-import-ai-custom-field-mapping',
  IMPOSE_8_HOUR_LIMIT: 'time-import-ai-impose-8-hour-limit',
  PREFERENCES_SEEN: 'time-import-ai-preferences-seen',
  SKIP_FIELD_MAPPING: 'time-import-ai-skip-field-mapping',
} as const;

/**
 * Type for allowed storage values (must match sandbox spec)
 */
type AllowedStoredValueType = string | number | boolean | null;

/**
 * Save AI import preference using sandbox persistent storage
 * This replaces the UX preferences API for USER-scoped AI import preferences
 *
 * @param sandbox - AppFabric sandbox instance
 * @param key - Storage key from AI_IMPORT_STORAGE_KEYS
 * @param value - Value to store (string, number, boolean, or null)
 */
export function setAIImportPreference(
  sandbox: Sandbox,
  key: string,
  value: AllowedStoredValueType,
): void {
  try {
    sandbox.extensions.qbo.webStorage
      .persistent()
      .setItemByPersonaId(key, value);
    sandbox.logger.info(`[AI Import] Saved preference: ${key}`, {
      valueType: typeof value,
    });
  } catch (error) {
    sandbox.logger.error(`[AI Import] Failed to save preference: ${key}`, {
      error,
    });
    throw error;
  }
}

/**
 * Get AI import preference using sandbox persistent storage (async)
 *
 * @param sandbox - AppFabric sandbox instance
 * @param key - Storage key from AI_IMPORT_STORAGE_KEYS
 * @returns Promise resolving to stored value or undefined
 */
export async function getAIImportPreference(
  sandbox: Sandbox,
  key: string,
): Promise<AllowedStoredValueType | undefined> {
  try {
    const value = await sandbox.extensions.qbo.webStorage
      .persistent()
      .getItemByPersonaIdAsync(key);
    sandbox.logger.info(`[AI Import] Retrieved preference: ${key}`, {
      hasValue: value !== undefined,
      valueType: typeof value,
    });
    return value;
  } catch (error) {
    sandbox.logger.error(`[AI Import] Failed to retrieve preference: ${key}`, {
      error,
    });
    return undefined;
  }
}

/**
 * Get AI import preference using sandbox persistent storage (sync)
 *
 * @param sandbox - AppFabric sandbox instance
 * @param key - Storage key from AI_IMPORT_STORAGE_KEYS
 * @returns Stored value or undefined
 */
export function getAIImportPreferenceSync(
  sandbox: Sandbox,
  key: string,
): AllowedStoredValueType | undefined {
  try {
    const value = sandbox.extensions.qbo.webStorage
      .persistent()
      .getItemByPersonaId(key);
    return value;
  } catch (error) {
    sandbox.logger.error(
      `[AI Import] Failed to retrieve preference (sync): ${key}`,
      {
        error,
      },
    );
    return undefined;
  }
}

/**
 * Remove AI import preference using sandbox persistent storage
 *
 * @param sandbox - AppFabric sandbox instance
 * @param key - Storage key from AI_IMPORT_STORAGE_KEYS
 */
export function removeAIImportPreference(sandbox: Sandbox, key: string): void {
  try {
    sandbox.extensions.qbo.webStorage.persistent().removeItemByPersonaId(key);
    sandbox.logger.info(`[AI Import] Removed preference: ${key}`);
  } catch (error) {
    sandbox.logger.error(`[AI Import] Failed to remove preference: ${key}`, {
      error,
    });
  }
}

/**
 * Clear all AI import preferences
 * Useful for reset functionality
 *
 * This clears ALL AI import preferences stored in sandbox storage.
 *
 * @param sandbox - AppFabric sandbox instance
 */
export function clearAllAIImportPreferences(sandbox: Sandbox): void {
  Object.values(AI_IMPORT_STORAGE_KEYS).forEach((key) => {
    removeAIImportPreference(sandbox, key);
  });
  sandbox.logger.info('[AI Import] Cleared all preferences');
}
