import { useCallback, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { useAppDispatch } from '../store';
import {
  setProjectRefs,
  clearProjectRefs,
  setProjectParents,
  clearProjectParents,
  backfillCustomerNames,
} from '../store/projectsSlice';
import { ProjectRef } from '../types';
import { GET_PROJECT_CUSTOMERS_VIA_CONTACTS } from '../graphql/queries';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
} from '../utils/timeProjectLogging';

interface ContactNode {
  id: string;
  projectId?: string | null;
  // OIGQL `DataAccess_Project.parentId` — the contact id of the
  // project's parent customer in the contacts id space. Surfaced as
  // a top-level field even though `parent { id }` returns the same
  // value, because some tenants return one but not the other.
  parentId?: string | null;
  parent?: {
    id?: string | null;
    displayName?: string | null;
    fullName?: string | null;
  } | null;
}

interface ContactsResponse {
  dataAccessContacts?: {
    edges?: Array<{ node?: ContactNode | null } | null> | null;
  } | null;
}

// Single-page request size. Sized to comfortably exceed the largest
// page of work-project ids the listing surfaces in one go (~200);
// pagination on the contacts side is intentionally NOT used because
// we never send more parent ids than fit in a single response.
const CONTACTS_PAGE_SIZE = 200;

/**
 * `dataAccessContacts` returns each project's `projectId` as a
 * path-style URN (e.g. `/work/Project;djQuMTo5MzQxNDU0NzE5NTE0OTAyOjY4ZDAxMTQ3ZGQ:793400145`).
 * The bare numeric segment after the FINAL colon is the same id we
 * carry as `dataAccessWorkProjects.node.id`, so that's the join key.
 *
 * Returns `null` for falsy / colonless inputs so the caller can skip
 * unmatchable entries instead of producing junk map keys.
 */
export const stripProjectIdUrn = (
  urn: string | null | undefined,
): string | null => {
  if (!urn) return null;
  // Trim defensively before AND after slicing — observed responses
  // include literal whitespace AFTER the leading scheme prefix
  // (e.g. `/work/Project; djQu...`). Trim is cheap and removes any
  // possibility of a leading/trailing stray char making the join fail.
  const cleaned = urn.trim();
  const idx = cleaned.lastIndexOf(':');
  if (idx === -1) return cleaned;
  const tail = cleaned.slice(idx + 1).trim();
  return tail.length > 0 ? tail : null;
};

/**
 * Resolves the canonical customer id for each work-project on the
 * current page in a single OIGQL `dataAccessContacts` round-trip and
 * joins each contact's stripped `projectId` URN against the
 * work-projects ids on the table.
 *
 * Output stored in Redux via `setProjectRefs` / `setProjectParents`:
 *   - `projectRefs[workProjectId]   = { projectId, customerId }`
 *   - `projectParents[workProjectId] = <parent customer contact id>`
 *
 * Concurrency: rapid filter / page-change toggles can launch multiple
 * lookups before earlier ones settle. We monotonically bump
 * `requestSeqRef` on every invocation and treat the reservation that
 * was the LATEST at completion time as authoritative — earlier
 * completions are dropped without writing to Redux. This prevents an
 * older lookup's result from clobbering a newer page's `projectRefs`.
 */
export const useProjectCustomerLookup = () => {
  const dispatch = useAppDispatch();
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);

  // Monotonic request id — incremented on every call. The completing
  // call only commits its refs to Redux if it's still the most recent
  // request when its network roundtrip resolves.
  const requestSeqRef = useRef(0);

  const [fetchContacts] = useLazyQuery(GET_PROJECT_CUSTOMERS_VIA_CONTACTS, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  // If the component unmounts mid-flight, abandon any in-progress
  // lookup so it doesn't dispatch into a torn-down store.
  useEffect(
    () => () => {
      requestSeqRef.current += 1;
    },
    [],
  );

  const fetchCustomersForProjects = useCallback(
    async (
      workProjectIds: string[],
      parentCustomerIds: string[],
      options?: { shouldBackfillCustomerNames?: boolean },
    ): Promise<Record<string, ProjectRef>> => {
      // Always wipe the previous maps first — we never want to leak
      // a stale entry from the prior filter context into the new one.
      // `projectParents` is wiped alongside `projectRefs` because
      // both are populated from the same contacts response and the
      // assignment-save flow reads them in lockstep.
      dispatch(clearProjectRefs());
      dispatch(clearProjectParents());

      if (workProjectIds.length === 0 || parentCustomerIds.length === 0) {
        return {};
      }

      // Reserve a request id BEFORE the network call — any request
      // that started after us will bump this further, and our
      // completion path will see a mismatch and skip the dispatch.
      requestSeqRef.current += 1;
      const seq = requestSeqRef.current;
      const isStale = () => seq !== requestSeqRef.current;

      try {
        const result = await fetchContacts({
          variables: {
            timeAgainstIds: parentCustomerIds,
            pageSize: CONTACTS_PAGE_SIZE,
          },
          context: {
            clientName: ApolloClientNames.OIGQL,
            ...(isWorkforceUser
              ? { headers: { 'intuit-is-workforce-user': 'true' } }
              : {}),
          },
        });

        if (isStale()) return {};

        const data = result.data as ContactsResponse | undefined;
        const { error } = result;
        if (error) {
          logger.error(
            'Component=useProjectCustomerLookup Event=Contacts Lookup Failure',
            {
              errorMessage: error.message,
              errorName: error.name,
              parentCustomerCount: parentCustomerIds.length,
            },
          );
          return {};
        }

        const edges = data?.dataAccessContacts?.edges;
        if (!Array.isArray(edges) || edges.length === 0) {
          // No contacts matched — leave refs cleared and bail.
          return {};
        }

        // Build a set of "match keys" derived from BOTH the bare id and
        // the URN-stripped id of every work-project we asked about.
        // `dataAccessWorkProjects.node.id` can come back either as a
        // bare numeric id (e.g. `793400145`) OR as a URN
        // (`/work/Project;...:793400145`) depending on the tenant /
        // supergraph shape — so we normalise on both sides before
        // comparing.
        const workProjectIdMatchKeys = new Set<string>();
        const workProjectStrippedToOriginal = new Map<string, string>();
        workProjectIds.forEach((rawId) => {
          if (!rawId) return;
          workProjectIdMatchKeys.add(rawId);
          const stripped = stripProjectIdUrn(rawId);
          if (stripped) {
            workProjectIdMatchKeys.add(stripped);
            workProjectStrippedToOriginal.set(stripped, rawId);
          }
          workProjectStrippedToOriginal.set(rawId, rawId);
        });

        const refs: Record<string, ProjectRef> = {};
        // Side-channel map populated from the SAME contacts response,
        // keyed by the same redux key. Lives separately from
        // `ProjectRef` because it's only consumed by the assignment-
        // save flow — every other downstream caller (estimates, user
        // tab, etc.) only needs the project's own `customerId`.
        const parents: Record<string, string> = {};
        // Customer display names resolved from each project contact's
        // parent — the parent contact IS the customer. Dispatched after
        // projectRefs so the table can update customerName once the
        // contacts round-trip completes (Workflow API does not return
        // customer names inline on the project list response).
        const customerNames: Record<string, string> = {};

        edges.forEach((edge) => {
          const node = edge?.node;
          if (!node) return;
          const bareProjectId = stripProjectIdUrn(node.projectId);
          if (!bareProjectId) return;
          const candidateKeys = [bareProjectId, node.projectId].filter(
            (k): k is string => !!k,
          );
          const hit = candidateKeys.find((k) => workProjectIdMatchKeys.has(k));
          if (!hit) return;
          const reduxKey =
            workProjectStrippedToOriginal.get(hit) || bareProjectId;
          refs[reduxKey] = {
            projectId: reduxKey,
            customerId: node.id,
          };
          // Prefer the resolved `parent.id` over the raw `parentId`
          // string — the resolved form is guaranteed to be a real
          // contact id. Drop self-loops defensively (never observed
          // in practice but would produce a duplicate
          // `timeAgainstList` entry on save).
          const rawParentId = node.parentId ?? node.parent?.id ?? null;
          if (rawParentId && rawParentId !== node.id) {
            parents[reduxKey] = rawParentId;
          }
          // Capture the parent contact's display name as the customer
          // name. `parent.displayName` is preferred; `fullName` is the
          // fallback for tenants where displayName is not populated.
          const name = node.parent?.displayName || node.parent?.fullName || '';
          if (name) {
            customerNames[reduxKey] = name;
          }
        });

        // Final stale check before committing — prevents a slow
        // earlier request from overwriting a newer one's already-
        // dispatched refs.
        if (isStale()) return {};

        dispatch(setProjectRefs(refs));
        dispatch(setProjectParents(parents));
        if (options?.shouldBackfillCustomerNames) {
          dispatch(backfillCustomerNames(customerNames));
        }
        return refs;
      } catch (err) {
        logger.error(
          'Component=useProjectCustomerLookup Event=Contacts Lookup Threw',
          {
            errorMessage: err instanceof Error ? err.message : String(err),
            errorName: err instanceof Error ? err.name : undefined,
          },
        );
        return {};
      }
    },
    [dispatch, fetchContacts, isWorkforceUser, logger],
  );

  return { fetchCustomersForProjects };
};
