import { useCallback, useMemo, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  useGetCustomFieldAssignmentsLazyQuery,
  GetCustomFieldAssignmentsQueryVariables,
} from 'src/__generated__/timeTracking/graphql';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { PageInfo } from 'src/js/service/types/assignmentTypes';

export interface UseCustomFieldAssignmentsArgs {
  first?: number;
  after?: string;
  input: {
    customerId?: string | null;
    projectId?: string | null;
  };
  filter?: {
    assigned?: boolean | null;
  };
  /** Called when the query completes with transformed data (so caller can store in Redux immediately) */
  onSuccess?: (data: CustomFieldAssignment[]) => void;
}

export interface CustomFieldAssignment {
  id: string;
  assigned: boolean;
  assignedToAll: boolean;
}

export interface UseCustomFieldAssignmentsResult {
  loading: boolean;
  data: CustomFieldAssignment[];
  error: string | null;
  loadCustomFieldAssignments: (args: UseCustomFieldAssignmentsArgs) => void;
  pageInfo: PageInfo | null;
}

/**
 * Hook to fetch custom field assignments
 *
 * PURPOSE: Determines WHICH CUSTOM FIELDS (CF) are VISIBLE based on CUSTOMER/PROJECT ID
 *
 * When to use:
 * - When CUSTOMER/PROJECT (timeAgainst) changes
 * - To determine which custom fields should be shown or hidden
 *
 * What it returns:
 * - List of custom field IDs and whether they're assigned to this customer/project
 * - If assigned=true: Show the field
 * - If assigned=false: Hide the field (even if enabled in settings)
 *
 * Example:
 * Customer A: Custom Field "Department" assigned → SHOW
 * Customer B: Custom Field "Department" NOT assigned → HIDE
 *
 * Note: This controls FIELD VISIBILITY, not the options within the field.
 * For filtering dropdown VALUES, use useCustomFieldOptionAssignments (worker-based).
 *
 * Fetches 100 records by default. User can manually handle pagination using pageInfo.
 */
function transformCFResponse(data: any): CustomFieldAssignment[] {
  if (!data?.timeTrackingCustomFieldAssignments?.edges) return [];
  return data.timeTrackingCustomFieldAssignments.edges
    .map((edge: any) => {
      const assignment = edge?.node;
      if (!assignment) return null;
      return {
        id: assignment.customFieldDefinition?.id || '',
        assigned: assignment.assigned || false,
        assignedToAll: assignment.assignedToAll || false,
      };
    })
    .filter(
      (item: CustomFieldAssignment | null): item is CustomFieldAssignment =>
        item !== null,
    );
}

export const useCustomFieldAssignments =
  (): UseCustomFieldAssignmentsResult => {
    const sandbox = useSandbox();
    const onSuccessRef = useRef<
      ((data: CustomFieldAssignment[]) => void) | null
    >(null);

    const [loadQuery, { data, loading, error }] =
      useGetCustomFieldAssignmentsLazyQuery({
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: (responseData) => {
          sandbox.logger.info(
            'Component=useCustomFieldAssignments Event=Successfully fetched custom field assignments',
          );
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_READ,
          );
          const cb = onSuccessRef.current;
          onSuccessRef.current = null;
          if (cb && responseData) cb(transformCFResponse(responseData));
        },
        onError: (err) => {
          sandbox.logger.error(
            'Component=useCustomFieldAssignments Event=Error fetching custom field assignments',
            { error: err.message },
          );
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_READ,
            err.message,
            err,
          );
        },
      });

    const loadCustomFieldAssignments = useCallback(
      ({
        first = 100,
        after,
        input,
        filter,
        onSuccess,
      }: UseCustomFieldAssignmentsArgs): void => {
        onSuccessRef.current = onSuccess ?? null;
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_READ,
        );

        loadQuery({
          variables: {
            first,
            after,
            input,
            filter,
          } as GetCustomFieldAssignmentsQueryVariables,
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_READ,
            ),
          },
        });
      },
      [sandbox, loadQuery],
    );

    const transformedData = useMemo(() => transformCFResponse(data), [data]);

    const pageInfo = useMemo(() => {
      if (!data?.timeTrackingCustomFieldAssignments?.pageInfo) {
        return null;
      }

      return {
        hasNextPage:
          data.timeTrackingCustomFieldAssignments.pageInfo.hasNextPage || false,
        hasPreviousPage:
          data.timeTrackingCustomFieldAssignments.pageInfo.hasPreviousPage ||
          false,
        startCursor:
          data.timeTrackingCustomFieldAssignments.pageInfo.startCursor ||
          undefined,
        endCursor:
          data.timeTrackingCustomFieldAssignments.pageInfo.endCursor ||
          undefined,
      };
    }, [data]);

    return {
      loading,
      data: transformedData,
      error: error?.message || null,
      loadCustomFieldAssignments,
      pageInfo,
    };
  };
