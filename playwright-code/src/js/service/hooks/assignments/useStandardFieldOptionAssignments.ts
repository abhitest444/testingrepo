import { useCallback, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useLazyQuery } from '@apollo/client';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { PageInfo } from 'src/js/service/types/assignmentTypes';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';
import { STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY } from 'src/js/service/queries/timeTrackingAssignmentQueries';

export type StandardFieldLabel = 'SERVICE_ITEM' | 'CLASS' | 'LOCATION';

export interface UseStandardFieldOptionAssignmentsArgs {
  first?: number;
  after?: string;
  input: {
    standardFieldLabel: StandardFieldLabel;
    timeForEntityId?: string;
    customerId?: string;
    projectId?: string;
  };
  filter?: {
    assigned?: boolean | null;
    active?: boolean;
    /** Pass null when no text; assigned/active remain same as first call when re-calling with search */
    searchText?: string | null;
  };
}

export interface StandardFieldOptionAssignment {
  id: string;
  name: string;
  assigned: boolean;
  active: boolean;
  standardFieldLabel: string;
  fullName?: string;
  parentId?: string | null;
  level?: number | null;
  numberOfChildren?: number;
  /** From saleDetails when standardFieldLabel is SERVICE_ITEM */
  price?: number | null;
  description?: string | null;
  taxable?: boolean;
}

export interface UseStandardFieldOptionAssignmentsResult {
  loading: boolean;
  data: StandardFieldOptionAssignment[];
  error: string | null;
  loadStandardFieldOptionAssignments: (
    args: UseStandardFieldOptionAssignmentsArgs,
  ) => void;
  pageInfo: PageInfo | null;
}

/**
 * Hook to fetch standard field option assignments (Service, Class, Location)
 *
 * PURPOSE: Filters STANDARD FIELD VALUES/OPTIONS based on WORKER ID and/or CUSTOMER ID
 *
 * When to use:
 * - When WORKER (timeFor) changes - to determine which dropdown OPTIONS a worker can select
 * - When CUSTOMER (timeAgainst) changes - to determine which dropdown OPTIONS are available for customer
 * - Can combine both for intersection (options valid for BOTH worker AND customer)
 *
 * What it returns:
 * - List of standard field options/values (Service Items, Classes, Locations) and which ones are assigned
 * - Only assigned options should be shown in the dropdown when filtering is enabled
 *
 * Example:
 * Standard Field: "Service Items"
 * Worker A + Customer X: Can select ["Consulting", "Design"] (intersection of both assignments)
 * Worker B: Can select ["Development", "Testing"] (worker assignments only)
 * Customer Y: Can select ["Consulting", "Support"] (customer assignments only)
 *
 * Fetches 100 records by default. User can manually handle pagination using pageInfo.
 */
export const useStandardFieldOptionAssignments =
  (): UseStandardFieldOptionAssignmentsResult => {
    const sandbox = useSandbox();

    // Get assignment Apollo client that removes __typename
    const assignmentClient = getAssignmentApolloClient(sandbox);

    const [loadQuery, { data, loading, error }] = useLazyQuery(
      STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY,
      {
        client: assignmentClient ?? undefined,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: () => {
          sandbox.logger.info(
            'Component=useStandardFieldOptionAssignments Event=Successfully fetched standard field option assignments',
          );
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.STANDARD_FIELD_OPTION_ASSIGNMENT_READ,
          );
        },
        onError: (err) => {
          sandbox.logger.error(
            'Component=useStandardFieldOptionAssignments Event=Error fetching standard field option assignments',
            { error: err.message },
          );
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.STANDARD_FIELD_OPTION_ASSIGNMENT_READ,
            err.message,
            err,
          );
        },
      },
    );

    const loadStandardFieldOptionAssignments = useCallback(
      ({
        first = 100,
        after,
        input,
        filter,
      }: UseStandardFieldOptionAssignmentsArgs): void => {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.STANDARD_FIELD_OPTION_ASSIGNMENT_READ,
        );

        loadQuery({
          variables: {
            first,
            after,
            input,
            filter: {
              ...filter,
              searchText: filter?.searchText?.trim() || null,
            } as {
              assigned?: boolean;
              active?: boolean;
              searchText?: string | null;
            },
          },
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.STANDARD_FIELD_OPTION_ASSIGNMENT_READ,
            ),
          },
        });
      },
      [sandbox, loadQuery],
    );

    const transformedData = useMemo(() => {
      if (!data?.timeTrackingStandardFieldOptionAssignments?.edges) {
        return [];
      }

      return data.timeTrackingStandardFieldOptionAssignments.edges
        .map((edge: any) => {
          const node = edge?.node;
          if (!node) return null;

          const base = {
            id: node.id || '',
            name: node.name || '',
            assigned: node.assigned || false,
            active: node.active ?? true,
            standardFieldLabel: node.standardFieldLabel || '',
            fullName: node.fullName,
            parentId: node.parentId,
            level: node.level,
            numberOfChildren: node.numberOfChildren || 0,
          };

          if (node.standardFieldLabel === 'SERVICE_ITEM') {
            return {
              ...base,
              price: node.saleDetails?.price ?? null,
              description: node.saleDetails?.description ?? null,
              taxable: node.taxable ?? false,
            };
          }

          return base;
        })
        .filter(
          (
            item: StandardFieldOptionAssignment | null,
          ): item is StandardFieldOptionAssignment => item !== null,
        );
    }, [data]);

    const pageInfo = useMemo(() => {
      if (!data?.timeTrackingStandardFieldOptionAssignments?.pageInfo) {
        return null;
      }

      return {
        hasNextPage:
          data.timeTrackingStandardFieldOptionAssignments.pageInfo
            .hasNextPage || false,
        hasPreviousPage:
          data.timeTrackingStandardFieldOptionAssignments.pageInfo
            .hasPreviousPage || false,
        startCursor:
          data.timeTrackingStandardFieldOptionAssignments.pageInfo
            .startCursor || undefined,
        endCursor:
          data.timeTrackingStandardFieldOptionAssignments.pageInfo.endCursor ||
          undefined,
      };
    }, [data]);

    return {
      loading,
      data: transformedData,
      error: error?.message || null,
      loadStandardFieldOptionAssignments,
      pageInfo,
    };
  };
