import { PageMessageType } from '@ids-ts/page-message/dist/types';
import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';
import {
  TIMECHARGE_PENDING_LOCK_REASON,
  TIME_ACTIVITY_EDIT_BLOCKED_ERROR_CODE,
} from 'src/js/common/constants';

const TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH_ERROR_CODE =
  'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH';

export enum PendingSaveBannerVariant {
  EDIT_PENDING = 'EDIT_PENDING',
  LOCKED_FALLBACK = 'LOCKED_FALLBACK',
}

export enum PendingSaveBannerAction {
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export interface PendingSaveBannerMessage {
  type: PageMessageType;
  titleKey: string;
  messageKey: string;
}

export interface CachedPendingSaveLockContext {
  entryId?: string;
  locked?: boolean;
  lockedReason?: string;
}

interface SubmittedTimeEntryLike {
  isSubmitted?: boolean | null;
  isExported?: boolean | null;
}

const PENDING_SAVE_BANNER_COPY: Record<
  PendingSaveBannerVariant,
  PendingSaveBannerMessage
> = {
  [PendingSaveBannerVariant.EDIT_PENDING]: {
    type: 'info',
    titleKey: 'single.time.pending.save.title',
    messageKey: 'single.time.pending.save.message',
  },
  [PendingSaveBannerVariant.LOCKED_FALLBACK]: {
    type: 'warn',
    titleKey: 'single.time.pending.save.locked.fallback.title',
    messageKey: 'single.time.pending.save.locked.fallback.message',
  },
};

export const getPendingSaveBannerVariantFromEntries = (
  timeEntries: TimeTracking_TimeEntry[],
): PendingSaveBannerVariant | null => {
  let hasLockedEntry = false;

  const hasPendingLock = timeEntries.some((entry) => {
    if (entry?.locked === true) {
      if (entry.lockedReason === TIMECHARGE_PENDING_LOCK_REASON) {
        return true;
      }
      hasLockedEntry = true;
    }
    return false;
  });

  if (hasPendingLock) {
    return PendingSaveBannerVariant.EDIT_PENDING;
  }

  if (hasLockedEntry) {
    return PendingSaveBannerVariant.LOCKED_FALLBACK;
  }

  return null;
};

export const getPendingSaveBannerMessageFromEntries = (
  timeEntries: TimeTracking_TimeEntry[],
): PendingSaveBannerMessage | null => {
  const variant = getPendingSaveBannerVariantFromEntries(timeEntries);
  return variant ? PENDING_SAVE_BANNER_COPY[variant] : null;
};

export const isSubmittedTimeEntry = (
  entry: SubmittedTimeEntryLike | null | undefined,
  isSubmitTimeEnabled?: boolean,
): boolean =>
  (isSubmitTimeEnabled ?? true) &&
  entry?.isSubmitted === true &&
  entry?.isExported === false;

export const getPendingSaveBannerMessageForEditDeleteError = (
  errorCode: string | undefined,
  subCode: string | undefined,
  action: PendingSaveBannerAction,
  pendingSaveContext?: {
    cachedLockContext?: CachedPendingSaveLockContext | null;
    currentEntryId?: string;
  },
): PendingSaveBannerMessage | null => {
  const isEditBlockedPendingError =
    errorCode === TIME_ACTIVITY_EDIT_BLOCKED_ERROR_CODE &&
    subCode === TIMECHARGE_PENDING_LOCK_REASON;

  const cachedEntryId = pendingSaveContext?.cachedLockContext?.entryId;
  const currentEntryId = pendingSaveContext?.currentEntryId;
  /**
   * We treat missing IDs as a match to preserve backward compatibility and support
   * both STA and WTA usage patterns:
   * - STA can pass both cached entry id and current entry id for strict matching.
   * - WTA can intentionally skip entry-id matching and rely on cached lock context
   *   + errorCode only (single weekly context), so this check remains permissive.
   */
  const isMatchingEntry =
    !cachedEntryId || !currentEntryId || cachedEntryId === currentEntryId;

  const isSequenceMismatchWithPendingCreateContext =
    errorCode === TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH_ERROR_CODE &&
    pendingSaveContext?.cachedLockContext?.locked === true &&
    pendingSaveContext.cachedLockContext.lockedReason ===
      TIMECHARGE_PENDING_LOCK_REASON &&
    isMatchingEntry;

  if (
    !isEditBlockedPendingError &&
    !isSequenceMismatchWithPendingCreateContext
  ) {
    return null;
  }

  if (action === PendingSaveBannerAction.DELETE) {
    return {
      ...PENDING_SAVE_BANNER_COPY[PendingSaveBannerVariant.EDIT_PENDING],
      messageKey: 'single.time.pending.save.delete.message',
    };
  }

  return PENDING_SAVE_BANNER_COPY[PendingSaveBannerVariant.EDIT_PENDING];
};
