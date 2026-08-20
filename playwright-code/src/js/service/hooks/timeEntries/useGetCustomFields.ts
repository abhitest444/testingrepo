import { useIntl, useSandbox } from '@payroll/quicksand';
import {
  TimeTracking_CustomFieldDefinition,
  TimeTracking_CustomFieldsInputFilter,
  useGetTimeTrackingCustomFieldsLazyQuery,
  GetTimeTrackingCustomFieldsLazyQueryHookResult,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';

export interface UseGetCustomFieldsResult {
  customFields: TimeTracking_CustomFieldDefinition[];
  loading: boolean;
  error?: string;
  query: GetTimeTrackingCustomFieldsLazyQueryHookResult[0];
  totalCustomerCount: number;
  totalWorkerCount: number;
}

export const mapCustomFields = (
  data?: any,
): TimeTracking_CustomFieldDefinition[] =>
  data?.timeTrackingCustomFields?.edges?.map((edge: any) => edge.node) || [];

export const useGetCustomFields = (): UseGetCustomFieldsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const [query, { data, loading, error }] =
    useGetTimeTrackingCustomFieldsLazyQuery({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
      },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        if (data?.timeTrackingCustomFields?.edges) {
          sandbox.logger.info(
            'Component=useGetCustomFields, Message=Custom Fields Data Fetched Successfully',
            {
              noOfCustomFields: data.timeTrackingCustomFields.edges.length,
            },
          );
        }
      },
      onError: (error) => {
        sandbox.logger.error(
          'Component=useGetCustomFields, Message=Failed to fetch custom fields',
          {
            error: error.message,
          },
        );
      },
    });

  const mappedError = mapError({
    sourceComponent: 'useGetCustomFields',
    sandbox,
    intl,
    error,
  });

  return {
    customFields: mapCustomFields(data),
    loading,
    error: mappedError,
    query,
    totalCustomerCount: data?.timeTrackingCustomFields?.totalCustomerCount || 0,
    totalWorkerCount: data?.timeTrackingCustomFields?.totalWorkerCount || 0,
  };
};
