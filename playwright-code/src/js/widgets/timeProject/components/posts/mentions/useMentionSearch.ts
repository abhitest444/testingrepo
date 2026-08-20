import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTimeForAssignments } from 'src/js/service/hooks/assignments/useTimeForAssignments';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';
import { debounce } from 'src/js/service/utils/debounce';
import { TimeForAssignment } from 'src/js/service/types/assignmentTypes';
import { MENTION_MENU_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../../../constants';

export interface UseMentionSearchResult {
  workers: TimeForAssignment[];
  loading: boolean;
  /** Run a (debounced) search for workers matching `query`. */
  search: (query: string) => void;
  /** Cancel any pending debounced search (e.g. when the menu closes). */
  cancel: () => void;
}

/**
 * Searches workers assigned to a project / customer for the @-mention menu.
 * Thin wrapper over `useTimeForAssignments` that adds a 300ms debounce and
 * scopes the query to the post's project / customer with `assigned: true`, so
 * only people actually assigned to this work surface as suggestions.
 */
export const useMentionSearch = (
  projectId?: string,
  customerId?: string,
): UseMentionSearchResult => {
  // @-mention search is a secondary, non-blocking read: if it fails the user
  // simply can't tag someone (the post still works), so report DEGRADED under
  // a mention-specific interaction rather than failing the shared assignment
  // read used by the assignment-management flows.
  const { loading, data, loadTimeForAssignments } = useTimeForAssignments({
    interactionName: TimeCustomerInteraction.TIME_PROJECT_POST_MENTION_SEARCH,
    degradeOnFailure: true,
  });
  const [active, setActive] = useState(false);

  // Keep the scope in a ref so the debounced fn doesn't need re-creating (and
  // cancelling) every time the parent re-renders with the same ids.
  const scopeRef = useRef({ projectId, customerId });
  scopeRef.current = { projectId, customerId };

  const runSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      loadTimeForAssignments({
        first: MENTION_MENU_PAGE_SIZE,
        input: {
          projectId: scopeRef.current.projectId,
          customerId: scopeRef.current.customerId,
        },
        filter: { searchText: trimmed || undefined, assigned: true },
      });
    },
    [loadTimeForAssignments],
  );

  const debounced = useMemo(
    () => debounce(runSearch, SEARCH_DEBOUNCE_MS),
    [runSearch],
  );

  useEffect(() => () => debounced.cancel(), [debounced]);

  const search = useCallback(
    (query: string) => {
      setActive(true);
      debounced(query);
    },
    [debounced],
  );

  const cancel = useCallback(() => {
    debounced.cancel();
    setActive(false);
  }, [debounced]);

  // Until a search has been kicked off, surface nothing — `useTimeForAssignments`
  // may hold stale data from another caller sharing the Apollo cache.
  const workers = active ? data : [];

  return { workers, loading: active && loading, search, cancel };
};
