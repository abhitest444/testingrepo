import { useCallback, useMemo } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import {
  useGetTimeTrackingCustomFieldsAssignmentsLazyQuery,
  GetTimeTrackingCustomFieldsAssignmentsQueryVariables,
} from 'src/__generated__/timeTracking/graphql';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';

export interface CustomFieldForAssignments {
  id: string;
  name: string;
  type: string;
  deleted: boolean;
  required: boolean;
}

export interface UseGetCustomFieldsForAssignmentsResult {
  customFields: CustomFieldForAssignments[];
  loading: boolean;
  error?: string;
  loadCustomFieldsForAssignments: () => void;
}

/**
 * Hook to fetch custom field metadata for assignments UI
 * Returns custom field essential information (id, name, type, deleted, required)
 * without the heavy options array and assignment counts
 */
export const useGetCustomFieldsForAssignments =
  (): UseGetCustomFieldsForAssignmentsResult => {
    const sandbox = useSandbox();
    const intl = useIntl();

    const [loadQuery, { data, loading, error }] =
      useGetTimeTrackingCustomFieldsAssignmentsLazyQuery({
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
        },
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: () => {
          sandbox.logger.info(
            'Component=useGetCustomFieldsForAssignments Event=Successfully fetched custom fields for assignments',
          );
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_READ,
          );
        },
        onError: (err) => {
          sandbox.logger.error(
            'Component=useGetCustomFieldsForAssignments Event=Error fetching custom fields for assignments',
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

    const loadCustomFieldsForAssignments = useCallback((): void => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_READ,
      );

      loadQuery({
        variables: {
          filter: {},
        } as GetTimeTrackingCustomFieldsAssignmentsQueryVariables,
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_READ,
          ),
        },
      });
    }, [sandbox, loadQuery]);

    const transformedData = useMemo(() => {
      if (!data?.timeTrackingCustomFields?.edges) {
        return [];
      }

      return data.timeTrackingCustomFields.edges.map((edge) => ({
        id: edge.node.id,
        name: edge.node.name,
        type: edge.node.type,
        deleted: edge.node.deleted,
        required: edge.node.required,
      }));
    }, [data]);

    const mappedError = mapError({
      sourceComponent: 'useGetCustomFieldsForAssignments',
      sandbox,
      intl,
      error,
    });

    return {
      customFields: transformedData,
      loading,
      error: mappedError,
      loadCustomFieldsForAssignments,
    };
  };
