import { useCallback } from 'react';
import { useLazyQuery } from '@apollo/client';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import { TIME_PROJECT_LOGGING_CONSTANTS } from '../constants';
import { TimeProjectRow } from '../types';
import { escapeFilterValue } from '../utils/projectIdUtils';
import {
  GET_WORKFLOW_PROJECT_BY_ID,
  GET_PROJECT_CUSTOMERS_VIA_CONTACTS,
} from '../graphql/queries';
import { mapResponseToRows } from '../utils/projectRowMapper';

// One project at a time — a single contacts page is more than enough.
const CONTACTS_PAGE_SIZE = 10;

interface UseFetchProjectByIdOptions {
  isAccountant?: boolean;
}

export const useFetchProjectById = ({
  isAccountant,
}: UseFetchProjectByIdOptions = {}) => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);

  const [fetchProjectQuery] = useLazyQuery(GET_WORKFLOW_PROJECT_BY_ID, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const [fetchContactsQuery] = useLazyQuery(
    GET_PROJECT_CUSTOMERS_VIA_CONTACTS,
    {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  );

  const fetchProjectById = useCallback(
    async (projectId: string): Promise<TimeProjectRow | null> => {
      const { data, error } = await withLoggedOperation({
        logger,
        sandbox,
        interactionName: TimeCustomerInteraction.TIME_PROJECT_FETCH_BY_ID,
        event: {
          start: TIME_PROJECT_LOGGING_CONSTANTS.READS.FETCH_PROJECT_BY_ID_START,
          success:
            TIME_PROJECT_LOGGING_CONSTANTS.READS.FETCH_PROJECT_BY_ID_SUCCESS,
          failure:
            TIME_PROJECT_LOGGING_CONSTANTS.READS.FETCH_PROJECT_BY_ID_FAILURE,
        },
        extraProps: { projectId },
        isFailure: (res) => res.error?.message ?? null,
        run: () =>
          fetchProjectQuery({
            variables: {
              filter: `deleted='false' && inServiceToType in ('CONTACT') && id='${escapeFilterValue(
                projectId,
              )}'`,
            },
            context: {
              clientName: ApolloClientNames.WORKFLOW,
              headers: {
                ...(isWorkforceUser && {
                  'intuit-is-workforce-user': 'true',
                }),
                ...(sandbox
                  ? getCustomerInteractionPropagationHeaders(
                      sandbox,
                      TimeCustomerInteraction.TIME_PROJECT_FETCH_BY_ID,
                    )
                  : {}),
              },
            },
          }),
      });
      if (error) throw error;

      const edges = data?.company?.projects?.edges ?? [];
      if (!edges.length) return null;

      const [row] = mapResponseToRows(edges, {
        isAccountant,
        onUnknownStatus: (status) =>
          logger.warn(
            'Component=useFetchProjectById Event=unknown_project_status',
            { status },
          ),
      });
      if (!row) return null;

      // The Workflow API returns `client { id }` only — no customer name
      // is available inline. Perform a targeted OIGQL contacts lookup to
      // resolve the customer's display name so the project summary can
      // render it correctly (without this step, customerName is '' and
      // the summary shows "—").
      //
      // We use a direct useLazyQuery here (not fetchCustomersForProjects)
      // to deliberately avoid touching the Redux projectRefs / projectParents
      // maps — those belong to the current page's dataset and must not be
      // cleared while the user navigates to a summary.
      if (row.customerId) {
        try {
          const contactsResult = await fetchContactsQuery({
            variables: {
              timeAgainstIds: [row.customerId],
              pageSize: CONTACTS_PAGE_SIZE,
            },
            context: {
              clientName: ApolloClientNames.OIGQL,
              ...(isWorkforceUser && {
                headers: { 'intuit-is-workforce-user': 'true' },
              }),
            },
          });

          if (contactsResult.error) {
            logger.error(
              'Component=useFetchProjectById Event=Contacts Name Lookup Failure',
              {
                errorMessage: contactsResult.error.message,
                errorName: contactsResult.error.name,
                projectId,
              },
            );
          }

          const contactEdges =
            contactsResult.data?.dataAccessContacts?.edges ?? [];

          // All returned contacts share the same parent customer because
          // the query filters by `parentId: { matchesAny: [customerId] }`.
          // We don't need to match by project ID — any edge's
          // `node.parent.displayName` gives the correct customer name.
          const firstEdgeWithName = contactEdges.find(
            (edge: any) =>
              edge?.node?.parent?.displayName || edge?.node?.parent?.fullName,
          );

          const customerName =
            firstEdgeWithName?.node?.parent?.displayName ||
            firstEdgeWithName?.node?.parent?.fullName ||
            '';

          if (customerName) {
            return { ...row, customerName };
          }
        } catch (err) {
          // Customer name resolution is best-effort; return the row
          // without a name rather than blocking navigation entirely.
          logger.error(
            'Component=useFetchProjectById Event=Contacts Name Lookup Threw',
            {
              ...(err instanceof Error
                ? { errorMessage: err.message, errorName: err.name }
                : { errorMessage: String(err) }),
              projectId,
            },
          );
        }
      }

      return row;
    },
    [fetchProjectQuery, fetchContactsQuery, logger, sandbox, isWorkforceUser],
  );

  return { fetchProjectById };
};
