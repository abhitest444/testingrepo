import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { debounce } from 'src/js/service/utils/debounce';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import {
  TIME_PROJECT_LOGGING_CONSTANTS,
  SEARCH_DEBOUNCE_MS,
} from '../constants';
import { GET_PROJECTS_SEARCH_VIA_CONTACTS } from '../graphql/queries';
import { extractWorkflowIdFromUrn } from '../utils/projectIdUtils';
import { WorkflowGlobalId } from '../types';

const SEARCH_PAGE_SIZE = 50;

// Shape of a single edge from GET_PROJECTS_SEARCH_VIA_CONTACTS.
// Typed explicitly so that accesses to node.projectId / node.id / node.displayName
// are checked rather than silently typed as `any`.  Without this interface the
// branded-type guard on WorkflowGlobalId provides no protection here — both
// extractWorkflowIdFromUrn(node.projectId) and the raw node.id fallback would
// compile equally against `any`.
interface ContactsSearchEdge {
  node?: {
    id: string;
    projectId: string | null;
    displayName: string | null;
  };
}

export interface ProjectNameSearchResult {
  projectId: WorkflowGlobalId;
  displayName: string;
}

export const useProjectNameSearch = () => {
  const sandbox = useTimeProjectSandbox();
  const logger = useTimeProjectLogger();
  const [searchQuery, { data, loading, error }] = useLazyQuery(
    GET_PROJECTS_SEARCH_VIA_CONTACTS,
    { fetchPolicy: 'network-only' },
  );
  // Tracks the last text that produced `data` so results are only shown
  // when there is an active, non-empty search term.
  const [lastSearchText, setLastSearchText] = useState('');

  const results: ProjectNameSearchResult[] = useMemo(() => {
    if (!lastSearchText.trim()) return [];
    return (
      data?.dataAccessContacts?.edges
        ?.map((edge: ContactsSearchEdge) => {
          const node = edge?.node;
          if (!node) return null;
          // `DataAccess_Project.projectId` is a path-style URN:
          //   `/work/Project; djQuMTo5...:767655383`
          // The segment after the semicolon is the Workflow API global `id`
          // (e.g. `djQuMTo5...:767655383`), used directly in the
          // `id in (...)` Workflow filter.
          //
          // The previous `|| node.id` fallback was removed: `node.id` is
          // the OIGQL short internal integer — it is NOT a WorkflowGlobalId
          // and cannot be used in a Workflow API filter.  If no valid URN
          // is present we skip the result rather than passing the wrong ID.
          const projectId = extractWorkflowIdFromUrn(node.projectId);
          if (!projectId) return null;
          return { projectId, displayName: node.displayName || '' };
        })
        .filter(Boolean) ?? []
    );
  }, [data, lastSearchText]);

  // Keep a stable ref to the latest searchQuery so the debounced callback
  // always calls the current execute function without needing to be recreated.
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  // Mirror the searchQueryRef pattern: keep a ref so the stable debounce
  // closure always reads the current workforce flag without needing to be
  // recreated when the sandbox resolves on the first render.
  const isWorkforceUserRef = useRef(isWorkforceEnvironment(sandbox));
  isWorkforceUserRef.current = isWorkforceEnvironment(sandbox);

  // Keep refs to logger and sandbox so the single stable debounce closure
  // always captures their current values (both can change after the first
  // render once QuicksandProvider / LoggingConfigProvider resolve).
  const loggerRef = useRef(logger);
  loggerRef.current = logger;
  const sandboxRef = useRef(sandbox);
  sandboxRef.current = sandbox;

  // useRef guarantees a single debounce closure for the component's lifetime.
  // useMemo is only a performance hint — React can discard it — so any render
  // that produces a new closure would give that closure a fresh timeoutId,
  // orphaning any in-flight timer and causing multiple API calls per burst.
  const debouncedSearch = useRef(
    debounce(async (text: string) => {
      setLastSearchText(text);
      if (!text.trim()) return;
      try {
        // withLoggedOperation fires start/success/failure Splunk events and
        // creates/resolves a Failed Customer Interaction so search backend
        // errors are visible in both Splunk and the FCI dashboard.  Without
        // this wrapper a network or GraphQL failure is indistinguishable
        // from "no results" — the Apollo reactive `error` state updates but
        // nothing is ever emitted to Splunk.
        await withLoggedOperation({
          logger: loggerRef.current,
          event: {
            start: TIME_PROJECT_LOGGING_CONSTANTS.READS.PROJECT_SEARCH_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.PROJECT_SEARCH_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.READS.PROJECT_SEARCH_FAILURE,
          },
          extraProps: { searchTextLength: text.trim().length },
          sandbox: sandboxRef.current,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_NAME_SEARCH,
          // Apollo resolves GraphQL errors in `result.error` when
          // errorPolicy is the default; treat a non-empty message as a
          // failure so withLoggedOperation records them correctly.
          isFailure: (res: { error?: { message: string } } | unknown) =>
            (res as { error?: { message: string } })?.error?.message ?? null,
          run: () =>
            searchQueryRef.current({
              variables: { searchText: text, pageSize: SEARCH_PAGE_SIZE },
              context: {
                headers: {
                  ...(sandboxRef.current
                    ? getCustomerInteractionPropagationHeaders(
                        sandboxRef.current,
                        TimeCustomerInteraction.TIME_PROJECT_NAME_SEARCH,
                      )
                    : undefined),
                  ...(isWorkforceUserRef.current && {
                    'intuit-is-workforce-user': 'true',
                  }),
                },
              },
            }),
        });
      } catch {
        // withLoggedOperation has already logged the failure and fired the
        // FCI.  Apollo's reactive `error` state surfaces the outcome to
        // callers via the `searchError` return value below.
      }
    }, SEARCH_DEBOUNCE_MS),
  ).current;

  // Cancel any pending debounced call on unmount so no stale state updates
  // or unnecessary network requests fire after the component tears down.
  useEffect(
    () => () => {
      debouncedSearch.cancel();
    },
    [debouncedSearch],
  );

  // Cancels the pending timer before clearing state so a slow keystroke
  // can't override the cleared lastSearchText and re-show stale results.
  const clearResults = useCallback(() => {
    debouncedSearch.cancel();
    setLastSearchText('');
  }, [debouncedSearch]);

  return {
    results,
    isLoading: loading,
    searchError: error ?? null,
    debouncedSearch,
    clearResults,
  };
};
