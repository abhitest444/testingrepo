import { useCallback, useMemo } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  useGetTimesheetFieldsDataLazyQuery,
  GetTimesheetFieldsDataQueryVariables,
  GetTimesheetFieldsDataQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node,
  GetTimesheetFieldsDataQuery_dataAccessProducts_DataAccess_ProductConnection_edges_DataAccess_ProductEdge_node,
  GetTimesheetFieldsDataQuery_dataAccessKlasses_DataAccess_KlassConnection_edges_DataAccess_KlassEdge_node_DataAccess_Klass,
  GetTimesheetFieldsDataQuery_dataAccessDepartments_DataAccess_DepartmentConnection_edges_DataAccess_DepartmentEdge_node_DataAccess_Department,
  DataAccess_ContactType,
} from 'src/__generated__/oigql/graphql';
import { mapError } from 'src/js/service/utils/mapError';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

export interface UseGetTimesheetFieldsDataArgs {
  first: number;
  offset?: number;
}

export interface UseGetTimesheetFieldsDataResult {
  customers: GetTimesheetFieldsDataQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node[];
  products: GetTimesheetFieldsDataQuery_dataAccessProducts_DataAccess_ProductConnection_edges_DataAccess_ProductEdge_node[];
  classes: GetTimesheetFieldsDataQuery_dataAccessKlasses_DataAccess_KlassConnection_edges_DataAccess_KlassEdge_node_DataAccess_Klass[];
  departments: GetTimesheetFieldsDataQuery_dataAccessDepartments_DataAccess_DepartmentConnection_edges_DataAccess_DepartmentEdge_node_DataAccess_Department[];
  loading: boolean;
  error?: string;
  loadTimesheetFieldsData: (
    args: UseGetTimesheetFieldsDataArgs,
  ) => Promise<void>;
}

export const useGetTimesheetFieldsData =
  (): UseGetTimesheetFieldsDataResult => {
    const sandbox = useSandbox();
    const intl = useIntl();

    // Set up the lazy query without context/headers
    const [loadQuery, { data, loading, error }] =
      useGetTimesheetFieldsDataLazyQuery({
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: () => {
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.WORKER_READ,
          );
        },
        onError: () => {
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.WORKER_READ,
            'QUERY_ERROR',
            { message: error },
          );
        },
      });

    const loadTimesheetFieldsData = useCallback(
      ({ first, offset }: UseGetTimesheetFieldsDataArgs): Promise<any> => {
        createCustomerInteraction(sandbox, TimeCustomerInteraction.WORKER_READ);
        return loadQuery({
          variables: { first, offset },
          context: {
            clientName: ApolloClientNames.OIGQL,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.WORKER_READ,
            ),
          },
        });
      },
      [sandbox, loadQuery],
    );

    // Transform and filter contacts data
    const contacts = useMemo(
      () => (data?.dataAccessContacts?.edges || []).map((edge) => edge.node),
      [data],
    );

    const customers = useMemo(
      () =>
        contacts.filter(
          (node) => node?.type === DataAccess_ContactType.Customer,
        ),
      [contacts],
    );

    // Transform products data
    const products = useMemo(
      () => (data?.dataAccessProducts?.edges || []).map((edge) => edge.node),
      [data],
    );

    // Transform classes data
    const classes = useMemo(
      () => (data?.dataAccessKlasses?.edges || []).map((edge) => edge.node),
      [data],
    );

    // Transform departments data
    const departments = useMemo(
      () => (data?.dataAccessDepartments?.edges || []).map((edge) => edge.node),
      [data],
    );

    return {
      customers,
      products,
      classes,
      departments,
      loading,
      error: error
        ? mapError({
            sourceComponent: 'useGetTimesheetFieldsData',
            sandbox,
            intl,
            error,
          })
        : undefined,
      loadTimesheetFieldsData,
    };
  };
