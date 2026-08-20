import { useState, useCallback, useEffect } from 'react';
import { AllowedStoredValueType } from '@appfabric/sandbox-spec/lib/extensions/quickbooks-online/web-storage/types';
import { useSandbox } from '@payroll/quicksand';
import { createStorageMethods } from '../utils/localStorageUtils';
import { isWorkforceEnvironment } from '../service/utils/sandboxUtils';

export const STORAGE_EVENT_NAME = 'storage';
const ERROR_PREFIX = '[time-tracking-ui - useStorage]';

export enum StorageScope {
  LOCAL = 'local',
  SESSION = 'session',
  PERSISTENT = 'persistent',
}

interface StorageOptions {
  scope: StorageScope;
}

export const useStorage = (
  key: string,
  options: StorageOptions = { scope: StorageScope.LOCAL },
) => {
  const sandbox = useSandbox();

  // Use webStorage extension if available, otherwise fallback to localStorage/sessionStorage
  let { setItemByCompanyId, getItemByCompanyId, removeItemByCompanyId } =
    sandbox.extensions?.qbo?.webStorage?.[options.scope]?.() || {};

  if (isWorkforceEnvironment(sandbox)) {
    // Create fallback storage methods using localStorage/sessionStorage
    // This provides a robust fallback when webStorage extension is not available
    const fallbackStorage = createStorageMethods(
      sandbox.logger,
      options.scope === StorageScope.SESSION ? 'session' : 'local',
    );

    getItemByCompanyId = fallbackStorage.getItem;
    setItemByCompanyId = fallbackStorage.setItem;
    removeItemByCompanyId = fallbackStorage.removeItem;
  }

  const [item, setItem] = useState<AllowedStoredValueType>(() => {
    try {
      return getItemByCompanyId(key);
    } catch (e) {
      sandbox.logger.error(
        `${ERROR_PREFIX} Error getting ${options.scope} storage item for key ${key}: ${e}`,
      );
      return null;
    }
  });

  const setStorageItem = useCallback(
    (value: AllowedStoredValueType) => {
      try {
        if (value === null) {
          removeItemByCompanyId(key);
        } else {
          setItemByCompanyId(key, value);
        }

        setItem(value);
        window.dispatchEvent(
          new StorageEvent(STORAGE_EVENT_NAME, {
            key,
            newValue: JSON.stringify(value),
            oldValue: JSON.stringify(item),
          }),
        );
      } catch (e) {
        sandbox.logger.error(
          `${ERROR_PREFIX} Error setting ${options.scope} storage item for key ${key}: ${e}`,
        );
      }
    },
    [key],
  );

  useEffect(() => {
    const handleStorageUpdate = (event: StorageEvent) => {
      // stay in sync if the storage value is changed elsewhere
      if (event.key === key) {
        if (event.newValue === null) {
          setItem(null);
        } else {
          try {
            const parsedValue = JSON.parse(event.newValue);
            setItem(parsedValue);
          } catch (e) {
            setItem(null);
            sandbox.logger.error(
              `${ERROR_PREFIX} Error syncing ${options.scope} storage item for key ${key}: ${e}`,
            );
          }
        }
      }
    };
    window.addEventListener(STORAGE_EVENT_NAME, handleStorageUpdate);
    return () => {
      window.removeEventListener(STORAGE_EVENT_NAME, handleStorageUpdate);
    };
  }, [key, setItem]);

  return [item, setStorageItem] as const;
};
