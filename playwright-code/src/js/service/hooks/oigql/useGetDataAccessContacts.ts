import { useCallback, useMemo } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  useGetEmployeesAndVendorsLazyQuery,
  GetEmployeesAndVendorsQueryVariables,
  GetEmployeesAndVendorsQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node,
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

export interface UseGetDataAccessArgs {
  filter: GetEmployeesAndVendorsQueryVariables['filter'];
  first: number;
  offset?: number;
  orderBy?: GetEmployeesAndVendorsQueryVariables['orderBy'];
}

export interface UseGetEmployeesAndVendorsResult {
  employees: GetEmployeesAndVendorsQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node[];
  vendors: GetEmployeesAndVendorsQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node[];
  customers: GetEmployeesAndVendorsQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node[];
  loading: boolean;
  error?: string;
  totalCount: number;
  loadDataAccessContacts: (args: UseGetDataAccessArgs) => void;
}

export const useGetDataAccessContacts = (): UseGetEmployeesAndVendorsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  // Set up the lazy query without context/headers
  const [loadQuery, { data, loading, error }] =
    useGetEmployeesAndVendorsLazyQuery({
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
      onCompleted: () => {
        endInteractionWithSuccess(sandbox, TimeCustomerInteraction.WORKER_READ);
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

  const loadEmployeesAndVendors = useCallback(
    ({ filter, first, offset, orderBy }: UseGetDataAccessArgs) => {
      createCustomerInteraction(sandbox, TimeCustomerInteraction.WORKER_READ);
      loadQuery({
        variables: { filter, first, offset, orderBy },
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

  const employees = useMemo(
    () =>
      (data?.dataAccessContacts?.edges || [])
        .map((edge) => edge.node)
        .filter((node) => node?.type === DataAccess_ContactType.Employee),
    [data],
  );
  const vendors = useMemo(
    () =>
      (data?.dataAccessContacts?.edges || [])
        .map((edge) => edge.node)
        .filter((node) => node?.type === DataAccess_ContactType.Vendor),
    [data],
  );
  const customers = useMemo(
    () =>
      (data?.dataAccessContacts?.edges || [])
        .map((edge) => edge.node)
        .filter((node) => node?.type === DataAccess_ContactType.Customer),
    [data],
  );
  const totalCount = data?.dataAccessContacts?.totalCount || 0;

  return {
    employees,
    vendors,
    customers,
    loading,
    error: error
      ? mapError({
          sourceComponent: 'useGetEmployeesAndVendors',
          sandbox,
          intl,
          error,
        })
      : undefined,
    totalCount,
    loadDataAccessContacts: loadEmployeesAndVendors,
  };
};
