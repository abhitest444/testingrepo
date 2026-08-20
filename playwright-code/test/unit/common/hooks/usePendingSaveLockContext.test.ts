import { renderHook, act } from '@testing-library/react-hooks';
import * as timeEntryLockUtils from 'src/js/common/timeEntryLockUtils';
import { PendingSaveBannerAction } from 'src/js/common/timeEntryLockUtils';
import {
  mapWeeklyPayloadToLockContext,
  usePendingSaveLockContext,
} from 'src/js/common/hooks/usePendingSaveLockContext';

describe('usePendingSaveLockContext', () => {
  const pendingLockedPayload = {
    timeEntries: [
      {
        id: 'entry-1',
        locked: true,
        lockedReason: 'TIMECHARGE_PENDING',
      },
    ],
  } as any;

  const nonPendingPayload = {
    timeEntries: [
      {
        id: 'entry-1',
        locked: true,
        lockedReason: 'INVOICED',
      },
    ],
  } as any;
  const unlockedPayload = {
    timeEntries: [
      {
        id: 'entry-1',
        locked: false,
        lockedReason: 'TIMECHARGE_PENDING',
      },
    ],
  } as any;

  it('initializes with null lock context', () => {
    const { result } = renderHook(() =>
      usePendingSaveLockContext({ isCachingEnabled: true }),
    );

    expect(result.current.cachedLockContextRef.current).toBeNull();
  });

  it('caches lock context from payload when caching is enabled and entry is pending-locked', () => {
    const { result } = renderHook(() =>
      usePendingSaveLockContext({ isCachingEnabled: true }),
    );

    act(() => {
      result.current.updateCachedLockContextFromPayload(pendingLockedPayload);
    });

    expect(result.current.cachedLockContextRef.current).toEqual({
      entryId: 'entry-1',
      locked: true,
      lockedReason: 'TIMECHARGE_PENDING',
    });
  });

  it('clears lock context when payload does not represent pending lock', () => {
    const { result } = renderHook(() =>
      usePendingSaveLockContext({ isCachingEnabled: true }),
    );

    act(() => {
      result.current.updateCachedLockContextFromPayload(pendingLockedPayload);
      result.current.updateCachedLockContextFromPayload(nonPendingPayload);
    });

    expect(result.current.cachedLockContextRef.current).toBeNull();
  });

  it('does not cache when first entry is not locked even if lock reason is TIMECHARGE_PENDING', () => {
    const { result } = renderHook(() =>
      usePendingSaveLockContext({ isCachingEnabled: true }),
    );

    act(() => {
      result.current.updateCachedLockContextFromPayload(unlockedPayload);
    });

    expect(result.current.cachedLockContextRef.current).toBeNull();
  });

  it('does not cache when payload has no time entries', () => {
    const { result } = renderHook(() =>
      usePendingSaveLockContext({ isCachingEnabled: true }),
    );

    act(() => {
      result.current.updateCachedLockContextFromPayload({} as any);
    });

    expect(result.current.cachedLockContextRef.current).toBeNull();
  });

  it('does not cache lock context when caching is disabled', () => {
    const { result } = renderHook(() =>
      usePendingSaveLockContext({ isCachingEnabled: false }),
    );

    act(() => {
      result.current.updateCachedLockContextFromPayload(pendingLockedPayload);
    });

    expect(result.current.cachedLockContextRef.current).toBeNull();
  });

  it('clears cached lock context explicitly', () => {
    const { result } = renderHook(() =>
      usePendingSaveLockContext({ isCachingEnabled: true }),
    );

    act(() => {
      result.current.updateCachedLockContextFromPayload(pendingLockedPayload);
      result.current.clearCachedLockContext();
    });

    expect(result.current.cachedLockContextRef.current).toBeNull();
  });

  it('supports custom payload mapping for future weekly reuse', () => {
    const { result } = renderHook(() =>
      usePendingSaveLockContext({
        isCachingEnabled: true,
        mapPayloadToLockContext: (payload: any) => {
          const hasPendingLockedEntry = (payload.timeEntries || []).some(
            (entry: any) =>
              entry?.locked === true &&
              entry?.lockedReason === 'TIMECHARGE_PENDING',
          );
          return hasPendingLockedEntry
            ? {
                locked: true,
                lockedReason: 'TIMECHARGE_PENDING',
              }
            : null;
        },
      }),
    );

    act(() => {
      result.current.updateCachedLockContextFromPayload({
        timeEntries: [
          { id: 'entry-a', locked: false },
          { id: 'entry-b', locked: true, lockedReason: 'TIMECHARGE_PENDING' },
        ],
      } as any);
    });

    expect(result.current.cachedLockContextRef.current).toEqual({
      locked: true,
      lockedReason: 'TIMECHARGE_PENDING',
    });
  });

  it('resolves pending message for sequence mismatch using cached context', () => {
    const { result } = renderHook(() =>
      usePendingSaveLockContext({ isCachingEnabled: true }),
    );

    act(() => {
      result.current.updateCachedLockContextFromPayload(pendingLockedPayload);
    });

    const resolvedMessage = result.current.resolvePendingMessageForError(
      'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
      undefined,
      PendingSaveBannerAction.UPDATE,
      'entry-1',
    );

    expect(resolvedMessage).toEqual({
      type: 'info',
      titleKey: 'single.time.pending.save.title',
      messageKey: 'single.time.pending.save.message',
    });
  });

  it('returns null when resolving pending message without cached context', () => {
    const { result } = renderHook(() =>
      usePendingSaveLockContext({ isCachingEnabled: true }),
    );

    const resolvedMessage = result.current.resolvePendingMessageForError(
      'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
      undefined,
      PendingSaveBannerAction.UPDATE,
      'entry-1',
    );

    expect(resolvedMessage).toBeNull();
  });

  it('uses default UPDATE action when action is not provided', () => {
    const pendingMessageSpy = jest
      .spyOn(
        timeEntryLockUtils,
        'getPendingSaveBannerMessageForEditDeleteError',
      )
      .mockReturnValue(null);
    const { result } = renderHook(() =>
      usePendingSaveLockContext({ isCachingEnabled: true }),
    );

    result.current.resolvePendingMessageForError(
      'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
      undefined,
      undefined,
      'entry-1',
    );

    expect(pendingMessageSpy).toHaveBeenCalledWith(
      'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
      undefined,
      PendingSaveBannerAction.UPDATE,
      {
        cachedLockContext: null,
        currentEntryId: 'entry-1',
      },
    );
    pendingMessageSpy.mockRestore();
  });
});

describe('mapWeeklyPayloadToLockContext', () => {
  it('returns weekly lock context when any row is locked due to time charge generation', () => {
    expect(
      mapWeeklyPayloadToLockContext({
        timeEntries: [
          { id: 'row-1', locked: false, lockedReason: '' },
          { id: 'row-2', locked: true, lockedReason: 'TIMECHARGE_PENDING' },
        ],
      } as any),
    ).toEqual({
      locked: true,
      lockedReason: 'TIMECHARGE_PENDING',
    });
  });

  it('returns null when no row has pending lock context', () => {
    expect(
      mapWeeklyPayloadToLockContext({
        timeEntries: [{ id: 'row-1', locked: true, lockedReason: 'INVOICED' }],
      } as any),
    ).toBeNull();
  });

  it('returns null when payload has no rows', () => {
    expect(mapWeeklyPayloadToLockContext({} as any)).toBeNull();
  });

  it('returns null when rows contain undefined entries', () => {
    expect(
      mapWeeklyPayloadToLockContext({
        timeEntries: [undefined],
      } as any),
    ).toBeNull();
  });
});
