import {
  getPendingSaveBannerMessageForEditDeleteError,
  getPendingSaveBannerMessageFromEntries,
  PendingSaveBannerAction,
} from 'src/js/common/timeEntryLockUtils';
import {
  TIME_ACTIVITY_EDIT_BLOCKED_ERROR_CODE,
  TIMECHARGE_PENDING_LOCK_REASON,
} from 'src/js/common/constants';

describe('timeEntryLockUtils', () => {
  describe('getPendingSaveBannerMessageFromEntries', () => {
    it('returns edit-pending message when at least one entry is locked with TIMECHARGE_PENDING', () => {
      const result = getPendingSaveBannerMessageFromEntries([
        {
          locked: false,
          lockedReason: TIMECHARGE_PENDING_LOCK_REASON,
        } as any,
        {
          locked: true,
          lockedReason: TIMECHARGE_PENDING_LOCK_REASON,
        } as any,
      ]);

      expect(result).toEqual({
        type: 'info',
        titleKey: 'single.time.pending.save.title',
        messageKey: 'single.time.pending.save.message',
      });
    });

    it('returns locked-fallback message when only locked is true', () => {
      const result = getPendingSaveBannerMessageFromEntries([
        {
          locked: true,
          lockedReason: 'SOME_OTHER_REASON',
        } as any,
      ]);

      expect(result).toEqual({
        type: 'warn',
        titleKey: 'single.time.pending.save.locked.fallback.title',
        messageKey: 'single.time.pending.save.locked.fallback.message',
      });
    });

    it('returns null when no entries are locked', () => {
      const result = getPendingSaveBannerMessageFromEntries([
        {
          locked: false,
          lockedReason: TIMECHARGE_PENDING_LOCK_REASON,
        } as any,
        {
          locked: false,
          lockedReason: null,
        } as any,
      ]);

      expect(result).toBeNull();
    });

    it('returns null for an empty entries array', () => {
      const result = getPendingSaveBannerMessageFromEntries([]);

      expect(result).toBeNull();
    });

    it('returns null when entry is undefined', () => {
      const result = getPendingSaveBannerMessageFromEntries([undefined as any]);

      expect(result).toBeNull();
    });

    it('returns edit-pending message when pending lock exists with nullish entries', () => {
      const result = getPendingSaveBannerMessageFromEntries([
        null as any,
        undefined as any,
        {
          locked: true,
          lockedReason: TIMECHARGE_PENDING_LOCK_REASON,
        } as any,
      ]);

      expect(result).toEqual({
        type: 'info',
        titleKey: 'single.time.pending.save.title',
        messageKey: 'single.time.pending.save.message',
      });
    });
  });

  describe('getPendingSaveBannerMessageForEditDeleteError', () => {
    it('returns edit-pending message for update action', () => {
      const result = getPendingSaveBannerMessageForEditDeleteError(
        TIME_ACTIVITY_EDIT_BLOCKED_ERROR_CODE,
        TIMECHARGE_PENDING_LOCK_REASON,
        PendingSaveBannerAction.UPDATE,
      );

      expect(result).toEqual({
        type: 'info',
        titleKey: 'single.time.pending.save.title',
        messageKey: 'single.time.pending.save.message',
      });
    });

    it('returns delete-specific message for delete action', () => {
      const result = getPendingSaveBannerMessageForEditDeleteError(
        TIME_ACTIVITY_EDIT_BLOCKED_ERROR_CODE,
        TIMECHARGE_PENDING_LOCK_REASON,
        PendingSaveBannerAction.DELETE,
      );

      expect(result).toEqual({
        type: 'info',
        titleKey: 'single.time.pending.save.title',
        messageKey: 'single.time.pending.save.delete.message',
      });
    });

    it('returns null when errorCode does not match', () => {
      const result = getPendingSaveBannerMessageForEditDeleteError(
        'SOME_OTHER_ERROR',
        TIMECHARGE_PENDING_LOCK_REASON,
        PendingSaveBannerAction.UPDATE,
      );

      expect(result).toBeNull();
    });

    it('returns null when subCode does not match', () => {
      const result = getPendingSaveBannerMessageForEditDeleteError(
        TIME_ACTIVITY_EDIT_BLOCKED_ERROR_CODE,
        'OTHER_SUB_CODE',
        PendingSaveBannerAction.UPDATE,
      );

      expect(result).toBeNull();
    });

    it('returns edit-pending message for sequence mismatch when cached pending lock context matches entry id', () => {
      const result = getPendingSaveBannerMessageForEditDeleteError(
        'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
        undefined,
        PendingSaveBannerAction.UPDATE,
        {
          cachedLockContext: {
            entryId: 'entry-1',
            locked: true,
            lockedReason: TIMECHARGE_PENDING_LOCK_REASON,
          },
          currentEntryId: 'entry-1',
        },
      );

      expect(result).toEqual({
        type: 'info',
        titleKey: 'single.time.pending.save.title',
        messageKey: 'single.time.pending.save.message',
      });
    });

    it('returns delete-specific message for sequence mismatch when cached pending lock has no entry id', () => {
      const result = getPendingSaveBannerMessageForEditDeleteError(
        'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
        undefined,
        PendingSaveBannerAction.DELETE,
        {
          cachedLockContext: {
            locked: true,
            lockedReason: TIMECHARGE_PENDING_LOCK_REASON,
          },
          currentEntryId: 'entry-1',
        },
      );

      expect(result).toEqual({
        type: 'info',
        titleKey: 'single.time.pending.save.title',
        messageKey: 'single.time.pending.save.delete.message',
      });
    });

    it('returns null for sequence mismatch when cached context entry id does not match current entry id', () => {
      const result = getPendingSaveBannerMessageForEditDeleteError(
        'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
        undefined,
        PendingSaveBannerAction.UPDATE,
        {
          cachedLockContext: {
            entryId: 'entry-a',
            locked: true,
            lockedReason: TIMECHARGE_PENDING_LOCK_REASON,
          },
          currentEntryId: 'entry-b',
        },
      );

      expect(result).toBeNull();
    });

    it('returns null for sequence mismatch when cached context is not pending lock', () => {
      const result = getPendingSaveBannerMessageForEditDeleteError(
        'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
        undefined,
        PendingSaveBannerAction.UPDATE,
        {
          cachedLockContext: {
            entryId: 'entry-1',
            locked: false,
            lockedReason: TIMECHARGE_PENDING_LOCK_REASON,
          },
          currentEntryId: 'entry-1',
        },
      );

      expect(result).toBeNull();
    });

    it('returns edit-pending message for sequence mismatch when cached entry id exists but current entry id is missing', () => {
      const result = getPendingSaveBannerMessageForEditDeleteError(
        'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
        undefined,
        PendingSaveBannerAction.UPDATE,
        {
          cachedLockContext: {
            entryId: 'entry-1',
            locked: true,
            lockedReason: TIMECHARGE_PENDING_LOCK_REASON,
          },
        },
      );

      expect(result).toEqual({
        type: 'info',
        titleKey: 'single.time.pending.save.title',
        messageKey: 'single.time.pending.save.message',
      });
    });

    it('returns null for sequence mismatch when cached context options are not provided', () => {
      const result = getPendingSaveBannerMessageForEditDeleteError(
        'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
        undefined,
        PendingSaveBannerAction.UPDATE,
      );

      expect(result).toBeNull();
    });
  });
});
