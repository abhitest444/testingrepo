import { Sandbox } from 'src/js/common/sandbox';
import { AllowedStoredValueType } from '../types';
/**
 * Sets an item in persistent storage by persona ID
 * PersonaId ensures data is tied to the specific user across sessions
 *
 * @param sandbox - AppFabric sandbox instance
 * @param key - Storage key
 * @param value - Value to store
 */
export function setItemByPersonaId(
  sandbox: Sandbox,
  key: string,
  value: AllowedStoredValueType,
): void {
  sandbox.extensions.qbo.webStorage.persistent().setItemByPersonaId(key, value);
}

/**
 * Gets an item from persistent storage by persona ID (synchronous)
 *
 * @param sandbox - AppFabric sandbox instance
 * @param key - Storage key
 * @returns Stored value or undefined
 */
export function getItemByPersonaId(
  sandbox: Sandbox,
  key: string,
): AllowedStoredValueType | undefined {
  return sandbox.extensions.qbo.webStorage.persistent().getItemByPersonaId(key);
}

/**
 * Gets an item from persistent storage by persona ID (async)
 * Use this when you need to ensure the value is fully loaded
 *
 * @param sandbox - AppFabric sandbox instance
 * @param key - Storage key
 * @returns Promise resolving to stored value or undefined
 */
export async function getItemByPersonaIdAsync(
  sandbox: Sandbox,
  key: string,
): Promise<AllowedStoredValueType | undefined> {
  return sandbox.extensions.qbo.webStorage
    .persistent()
    .getItemByPersonaIdAsync(key);
}

/**
 * Removes an item from persistent storage by persona ID
 *
 * @param sandbox - AppFabric sandbox instance
 * @param key - Storage key to remove
 */
export function removeItemByPersonaId(sandbox: Sandbox, key: string): void {
  sandbox.extensions.qbo.webStorage.persistent().removeItemByPersonaId(key);
}
