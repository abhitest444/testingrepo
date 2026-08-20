import { useCallback, useMemo, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  useGetStandardFieldAssignmentsLazyQuery,
  GetStandardFieldAssignmentsQueryVariables,
} from 'src/__generated__/timeTracking/graphql';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { PageInfo } from 'src/js/service/types/assignmentTypes';

export interface UseStandardFieldAssignmentsArgs {
  first?: number;
  after?: string;
  input: {
    customerId?: string;
    projectId?: string;
  };
  filter?: {
    assigned?: boolean | null;
  };
  /** Called when the query completes with transformed data (so caller can store in Redux immediately) */
  onSuccess?: (data: StandardFieldAssignment[]) => void;
}

export interface StandardFieldAssignment {
  name: string;
  assigned: boolean;
}

export interface UseStandardFieldAssignmentsResult {
  loading: boolean;
  data: StandardFieldAssignment[];
  error: string | null;
  loadStandardFieldAssignments: (args: UseStandardFieldAssignmentsArgs) => void;
  pageInfo: PageInfo | null;
}

/**
 * Hook to fetch standard field assignments
 *
 * PURPOSE: Determines WHICH STANDARD FIELDS (SF) are VISIBLE based on CUSTOMER/PROJECT ID
 *
 * When to use:
 * - When CUSTOMER/PROJECT (timeAgainst) changes
 * - To determine which standard fields (Service, Class, Location, Billable) should be shown or hidden
 *
 * What it returns:
 * - List of standard field names and whether they're assigned to this customer/project
 * - If assigned=true: Show the field
 * - If assigned=false: Hide the field (even if enabled in settings)
 *
 * Example:
 * Customer A: Service assigned → SHOW, Class NOT assigned → HIDE
 * Customer B: Service NOT assigned → HIDE, Class assigned → SHOW
 *
 * Standard Fields: Service, Class, Location, Billable
 *
 * Fetches 100 records by default. User can manually handle pagination using pageInfo.
 */
function transformSFResponse(data: any): StandardFieldAssignment[] {
  if (!data?.timeTrackingStandardFieldAssignments?.edges) return [];
  return data.timeTrackingStandardFieldAssignments.edges
    .map((edge: any) => {
      const assignment = edge?.node;
      if (!assignment) return null;
      const label = assignment.standardFieldLabel;
      const name =
        typeof label === 'string'
          ? label
          : (label as { name?: string } | null)?.name ?? '';
      return { name: name || '', assigned: assignment.assigned || false };
    })
    .filter(
      (item: StandardFieldAssignment | null): item is StandardFieldAssignment =>
        item !== null,
    );
}

export const useStandardFieldAssignments =
  (): UseStandardFieldAssignmentsResult => {
    const sandbox = useSandbox();
    const onSuccessRef = useRef<
      ((data: StandardFieldAssignment[]) => void) | null
    >(null);

    const [loadQuery, { data, loading, error }] =
      useGetStandardFieldAssignmentsLazyQuery({
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: (responseData) => {
          sandbox.logger.info(
            'Component=useStandardFieldAssignments Event=Successfully fetched standard field assignments data',
          );
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_READ,
          );
          const cb = onSuccessRef.current;
          onSuccessRef.current = null;
          if (cb && responseData) cb(transformSFResponse(responseData));
        },
        onError: (err) => {
          sandbox.logger.error(
            'Component=useStandardFieldAssignments Event=Error fetching standard field assignments data',
            { error: err.message },
          );
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_READ,
            err.message,
            err,
          );
        },
      });

    const loadStandardFieldAssignments = useCallback(
      ({
        first = 100,
        after,
        input,
        filter,
        onSuccess,
      }: UseStandardFieldAssignmentsArgs): void => {
        onSuccessRef.current = onSuccess ?? null;
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_READ,
        );

        loadQuery({
          variables: {
            first,
            after,
            input,
            filter,
          } as GetStandardFieldAssignmentsQueryVariables,
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_READ,
            ),
          },
        });
      },
      [sandbox, loadQuery],
    );

    const transformedData = useMemo(() => transformSFResponse(data), [data]);

    const pageInfo = useMemo(() => {
      if (!data?.timeTrackingStandardFieldAssignments?.pageInfo) {
        return null;
      }

      return {
        hasNextPage:
          data.timeTrackingStandardFieldAssignments.pageInfo.hasNextPage ||
          false,
        hasPreviousPage:
          data.timeTrackingStandardFieldAssignments.pageInfo.hasPreviousPage ||
          false,
        startCursor:
          data.timeTrackingStandardFieldAssignments.pageInfo.startCursor ||
          undefined,
        endCursor:
          data.timeTrackingStandardFieldAssignments.pageInfo.endCursor ||
          undefined,
      };
    }, [data]);

    return {
      loading,
      data: transformedData,
      error: error?.message || null,
      loadStandardFieldAssignments,
      pageInfo,
    };
  };
