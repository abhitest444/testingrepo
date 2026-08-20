import { AllowedStoredValueType } from '@appfabric/sandbox-spec/lib/extensions/quickbooks-online/web-storage/types';

const ERROR_PREFIX = '[LocalStorage Utils]';

interface Logger {
  error: (message: string, context?: any) => void;
}

/**
 * Utility class for managing localStorage operations with company-scoped keys
 */
export class LocalStorageUtils {
  private logger: Logger;

  private storage: Storage;

  constructor(logger: Logger, storageType: 'local' | 'session' = 'local') {
    this.logger = logger;
    this.storage = storageType === 'session' ? sessionStorage : localStorage;
  }

  /**
   * Sets an item in storage with the given key
   * @param key - The storage key
   * @param value - The value to store
   */
  setItem(key: string, value: AllowedStoredValueType): void {
    try {
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(key, serializedValue);
    } catch (e) {
      this.logger.error(
        `${ERROR_PREFIX} Error setting storage item for key ${key}`,
        {
          error: e,
          key,
        },
      );
      throw e;
    }
  }

  /**
   * Gets an item from storage by key
   * @param key - The storage key
   * @returns The stored value or null if not found
   */
  getItem(key: string): AllowedStoredValueType {
    try {
      const item = this.storage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item);
    } catch (e) {
      this.logger.error(
        `${ERROR_PREFIX} Error getting storage item for key ${key}`,
        {
          error: e,
          key,
        },
      );
      return null;
    }
  }

  /**
   * Removes an item from storage by key
   * @param key - The storage key
   */
  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (e) {
      this.logger.error(
        `${ERROR_PREFIX} Error removing storage item for key ${key}`,
        {
          error: e,
          key,
        },
      );
      throw e;
    }
  }

  /**
   * Clears all items from storage
   */
  clear(): void {
    try {
      this.storage.clear();
    } catch (e) {
      this.logger.error(`${ERROR_PREFIX} Error clearing storage`, {
        error: e,
      });
      throw e;
    }
  }

  /**
   * Gets all keys from storage
   * @returns Array of storage keys
   */
  getAllKeys(): string[] {
    try {
      return Object.keys(this.storage);
    } catch (e) {
      this.logger.error(`${ERROR_PREFIX} Error getting all keys`, {
        error: e,
      });
      return [];
    }
  }
}

/**
 * Creates storage utility methods with generic names
 * @param logger - Logger instance for error logging
 * @param storageType - Type of storage ('local' or 'session')
 * @returns Object with generic storage methods
 */
export const createStorageMethods = (
  logger: Logger,
  storageType: 'local' | 'session' = 'local',
) => {
  const storageUtils = new LocalStorageUtils(logger, storageType);

  return {
    setItem: (key: string, value: AllowedStoredValueType) =>
      storageUtils.setItem(key, value),
    getItem: (key: string) => storageUtils.getItem(key),
    removeItem: (key: string) => storageUtils.removeItem(key),
  };
};
