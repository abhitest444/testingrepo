import { useState, useEffect, useRef, useCallback } from 'react';
import { TimeTracking_OvertimeNotificationRule } from 'src/__generated__/timeTracking/graphql';

export interface UseEmployerOvertimeNotificationsResult {
  /** Rules last confirmed from the API (source of truth). */
  savedRules: TimeTracking_OvertimeNotificationRule[];
  /** In-flight edits; mirrors savedRules until the user starts editing. */
  draftRules: TimeTracking_OvertimeNotificationRule[];
  setDraftRules: (rules: TimeTracking_OvertimeNotificationRule[]) => void;
  /** Reset draftRules back to savedRules (e.g. on Cancel). */
  cancelDraft: () => void;
  /**
   * Call on successful mutation.
   * Pass `returnedRules` if the mutation response includes the updated rules;
   * omit/null to fall back to the current draftRules (optimistic update).
   */
  syncFromMutation: (
    returnedRules?: TimeTracking_OvertimeNotificationRule[] | null,
  ) => void;
  /** False until the first successful API load completes. */
  hasLoadedFromApi: boolean;
}

/**
 * Manages employer-level overtime notification rules with a saved/draft split,
 * mirroring the Redux pattern used in user settings but using local React state
 * (suitable for form-based settings pages where Redux is not in use).
 */
export const useEmployerOvertimeNotifications = (
  apiRules: TimeTracking_OvertimeNotificationRule[] | undefined,
  isLoading: boolean,
): UseEmployerOvertimeNotificationsResult => {
  const [savedRules, setSavedRules] = useState<
    TimeTracking_OvertimeNotificationRule[]
  >([]);
  const [draftRules, setDraftRules] = useState<
    TimeTracking_OvertimeNotificationRule[]
  >([]);
  const [hasLoadedFromApi, setHasLoadedFromApi] = useState(false);

  const prevLoadingRef = useRef(isLoading);

  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = isLoading;

    if (wasLoading && !isLoading && apiRules !== undefined) {
      setSavedRules(apiRules);
      setDraftRules([...apiRules]);
      setHasLoadedFromApi(true);
    }
  }, [isLoading, apiRules]);

  useEffect(() => {
    if (!isLoading && apiRules !== undefined && !hasLoadedFromApi) {
      setSavedRules(apiRules);
      setDraftRules([...apiRules]);
      setHasLoadedFromApi(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiRules]);

  const cancelDraft = useCallback(() => {
    setDraftRules([...savedRules]);
  }, [savedRules]);

  const syncFromMutation = useCallback(
    (returnedRules?: TimeTracking_OvertimeNotificationRule[] | null) => {
      const next = returnedRules ?? draftRules;
      setSavedRules([...next]);
      setDraftRules([...next]);
    },
    [draftRules],
  );

  return {
    savedRules,
    draftRules,
    setDraftRules,
    cancelDraft,
    syncFromMutation,
    hasLoadedFromApi,
  };
};
