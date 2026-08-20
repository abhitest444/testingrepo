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
import { GET_CUSTOM_FIELD_OPTION_ASSIGNMENTS_QUERY } from 'src/js/service/queries/timeTrackingAssignmentQueries';

export interface UseCustomFieldOptionAssignmentsArgs {
  first?: number;
  after?: string;
  input: {
    timeForEntityId?: string | number | null;
    timeAgainstEntityId?: string | number | null;
    customFieldIds: string | string[]; // Accept both single string and array
  };
  filter?: {
    assigned?: boolean | null;
    active?: boolean;
  };
}

export interface CustomFieldOptionAssignment {
  id: string;
  name: string;
  assigned: boolean;
  customFieldId: string; // Added to track which CF this option belongs to
}

export interface UseCustomFieldOptionAssignmentsResult {
  loading: boolean;
  data: CustomFieldOptionAssignment[];
  error: string | null;
  loadCustomFieldOptionAssignments: (
    args: UseCustomFieldOptionAssignmentsArgs,
  ) => void;
  pageInfo: PageInfo | null;
}

/**
 * Hook to fetch custom field option assignments
 *
 * PURPOSE: Filters CUSTOM FIELD VALUES/OPTIONS based on WORKER and/or CUSTOMER
 *
 * When to use:
 * - When WORKER (timeFor) or CUSTOMER (timeAgainst) changes
 * - To determine which dropdown OPTIONS are available for custom fields
 * - The field itself is already visible (determined by field assignments)
 *
 * What it returns:
 * - List of custom field options/values and which ones are assigned
 * - Only assigned options should be shown in the dropdown (when filter.assigned is true)
 *
 * Example:
 * Custom Field: "Department"
 * Worker A + Customer X: Can select ["Engineering", "Sales"] (these are assigned)
 * Worker B + Customer X: Can select ["Marketing", "HR"] (these are assigned)
 *
 * Note: This is DIFFERENT from field visibility (which is customer-based).
 * Customer determines IF the field shows, Worker determines WHICH VALUES are available.
 *
 * Input parameters:
 * - timeForEntityId: Worker/Employee ID (optional)
 * - timeAgainstEntityId: Customer ID (optional)
 * - customFieldIds: Comma-separated custom field IDs (required)
 *
 * Filter parameters:
 * - assigned: true (only assigned options), null (all options), false (non-assigned)
 * - active: true (only active options), false (inactive options), null (all)
 *
 * Fetches 100 records by default. User can manually handle pagination using pageInfo.
 */
export const useCustomFieldOptionAssignments =
  (): UseCustomFieldOptionAssignmentsResult => {
    const sandbox = useSandbox();

    // Get assignment Apollo client that removes __typename
    const assignmentClient = getAssignmentApolloClient(sandbox);

    const [loadQuery, { data, loading, error }] = useLazyQuery(
      GET_CUSTOM_FIELD_OPTION_ASSIGNMENTS_QUERY,
      {
        client: assignmentClient ?? undefined,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: () => {
          sandbox.logger.info(
            'Component=useCustomFieldOptionAssignments Event=Successfully fetched custom field option assignments',
          );
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_READ,
          );
        },
        onError: (err) => {
          sandbox.logger.error(
            'Component=useCustomFieldOptionAssignments Event=Error fetching custom field option assignments',
            { error: err.message },
          );
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_READ,
            err.message,
            err,
          );
        },
      },
    );

    const loadCustomFieldOptionAssignments = useCallback(
      ({
        first = 100,
        after,
        input,
        filter,
      }: UseCustomFieldOptionAssignmentsArgs): void => {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_READ,
        );

        loadQuery({
          variables: {
            first,
            after,
            input,
            filter,
          },
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_READ,
            ),
          },
        });
      },
      [sandbox, loadQuery],
    );

    const transformedData = useMemo(() => {
      if (!data?.timeTrackingCustomFieldOptionAssignments?.edges) {
        return [];
      }

      return data.timeTrackingCustomFieldOptionAssignments.edges.flatMap(
        (edge: any) => {
          const node = edge?.node;
          if (!node || !node.customFieldOptions) return [];

          const customFieldId = node.customField?.id || '';

          return node.customFieldOptions
            .map((option: any) => {
              if (!option || !option.customFieldOption) return null;

              return {
                id: option.customFieldOption.id || '',
                name:
                  option.customFieldOption.name ||
                  option.customFieldOption.id ||
                  '',
                assigned: option.assigned || false,
                customFieldId, // Include the CF ID
              };
            })
            .filter(
              (
                item: CustomFieldOptionAssignment | null,
              ): item is CustomFieldOptionAssignment => item !== null,
            );
        },
      );
    }, [data]);

    const pageInfo = useMemo(() => {
      if (!data?.timeTrackingCustomFieldOptionAssignments?.pageInfo) {
        return null;
      }

      return {
        hasNextPage:
          data.timeTrackingCustomFieldOptionAssignments.pageInfo.hasNextPage ||
          false,
        hasPreviousPage:
          data.timeTrackingCustomFieldOptionAssignments.pageInfo
            .hasPreviousPage || false,
        startCursor:
          data.timeTrackingCustomFieldOptionAssignments.pageInfo.startCursor ||
          undefined,
        endCursor:
          data.timeTrackingCustomFieldOptionAssignments.pageInfo.endCursor ||
          undefined,
      };
    }, [data]);

    return {
      loading,
      data: transformedData,
      error: error?.message || null,
      loadCustomFieldOptionAssignments,
      pageInfo,
    };
  };
