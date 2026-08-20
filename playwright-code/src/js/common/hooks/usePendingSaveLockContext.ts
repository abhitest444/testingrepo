import { useCallback, useRef } from 'react';
import { TimeTracking_BatchManageTimeEntriesPayload } from 'src/__generated__/timeTracking/graphql';
import { TIMECHARGE_PENDING_LOCK_REASON } from 'src/js/common/constants';
import {
  CachedPendingSaveLockContext,
  getPendingSaveBannerMessageForEditDeleteError,
  PendingSaveBannerAction,
  PendingSaveBannerMessage,
} from 'src/js/common/timeEntryLockUtils';

interface UsePendingSaveLockContextArgs {
  isCachingEnabled: boolean;
  /**
   * Optional mapper for caller-specific payload parsing.
   * Memoize custom mappers with useCallback in callers to keep callback identity stable.
   * Passing an inline function each render will recreate updateCachedLockContextFromPayload.
   */
  mapPayloadToLockContext?: (
    payload: TimeTracking_BatchManageTimeEntriesPayload,
  ) => CachedPendingSaveLockContext | null;
}

// Default mapper for STA behavior: cache the first entry only when it is
// locked due to time charge generation being in progress.
const defaultMapPayloadToLockContext = (
  payload: TimeTracking_BatchManageTimeEntriesPayload,
): CachedPendingSaveLockContext | null => {
  const entry = payload.timeEntries?.[0];
  if (
    entry?.locked === true &&
    entry.lockedReason === TIMECHARGE_PENDING_LOCK_REASON
  ) {
    return {
      entryId: entry.id,
      locked: true,
      lockedReason: entry.lockedReason,
    };
  }
  return null;
};

// Weekly mapper: cache a single truthy lock context when any row is locked due
// to time charge generation being in progress.
export const mapWeeklyPayloadToLockContext = (
  payload: TimeTracking_BatchManageTimeEntriesPayload,
): CachedPendingSaveLockContext | null => {
  const hasPendingLockContext = payload.timeEntries?.some(
    (entry) =>
      entry?.locked === true &&
      entry.lockedReason === TIMECHARGE_PENDING_LOCK_REASON,
  );
  return hasPendingLockContext
    ? {
        locked: true,
        lockedReason: TIMECHARGE_PENDING_LOCK_REASON,
      }
    : null;
};

export const usePendingSaveLockContext = ({
  isCachingEnabled,
  mapPayloadToLockContext = defaultMapPayloadToLockContext,
}: UsePendingSaveLockContextArgs) => {
  // Keep lock context in a ref so we can reuse it across callbacks without re-rendering.
  const cachedLockContextRef = useRef<CachedPendingSaveLockContext | null>(
    null,
  );

  // Clear cached context when the STA session is intentionally reset
  // (close, select recent time activity, save-and-new, save-and-copy).
  // This avoids carrying lock context into a different user flow.
  const clearCachedLockContext = useCallback(() => {
    cachedLockContextRef.current = null;
  }, []);

  // Cache lock context from the latest create/update payload when caching is enabled.
  // If payload is not locked due to time charge generation being in progress,
  // or caching is disabled, the cached value is reset to null.
  // NOTE: If callers pass a custom mapper, they should memoize it via useCallback.
  const updateCachedLockContextFromPayload = useCallback(
    (payload: TimeTracking_BatchManageTimeEntriesPayload) => {
      cachedLockContextRef.current = isCachingEnabled
        ? mapPayloadToLockContext(payload)
        : null;
    },
    [isCachingEnabled, mapPayloadToLockContext],
  );

  // Resolve pending banner for edit/delete errors using the latest cached lock context.
  const resolvePendingMessageForError = useCallback(
    (
      errorCode: string | undefined,
      subCode: string | undefined,
      action: PendingSaveBannerAction = PendingSaveBannerAction.UPDATE,
      currentEntryId?: string,
    ): PendingSaveBannerMessage | null =>
      getPendingSaveBannerMessageForEditDeleteError(
        errorCode,
        subCode,
        action,
        {
          cachedLockContext: cachedLockContextRef.current,
          currentEntryId,
        },
      ),
    [],
  );

  return {
    cachedLockContextRef,
    clearCachedLockContext,
    updateCachedLockContextFromPayload,
    resolvePendingMessageForError,
  };
};
