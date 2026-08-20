import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';

import {
  DataAccess_ContactType,
  DataAccess_Customer,
  DataAccess_Employee,
  DataAccess_Project,
  DataAccess_Vendor,
  GetCustomerDataForTimeEntriesQuery,
  useGetCustomerDataForTimeEntriesQuery,
} from 'src/__generated__/oigql/graphql';
import { mapError } from 'src/js/service/utils/mapError';

export interface UseGetCustomerDataArgs {
  customerIds: string[];
}

export type CustomerDataArray = (
  | DataAccess_Customer
  | DataAccess_Project
  | DataAccess_Employee
  | DataAccess_Vendor
)[];

export interface UseGetCustomerDataResult {
  data: CustomerDataArray;
  error?: string;
  loading: boolean;
}

export const mapCustomerData = (
  data?: GetCustomerDataForTimeEntriesQuery,
): CustomerDataArray =>
  data?.dataAccessContacts?.edges
    ?.map((edge) => edge.node)
    .filter(
      (
        node,
      ): node is
        | DataAccess_Customer
        | DataAccess_Project
        | DataAccess_Employee
        | DataAccess_Vendor =>
        [
          'DataAccess_Project',
          'DataAccess_Customer',
          'DataAccess_Employee',
          'DataAccess_Vendor',
        ].includes(node.__typename || ''),
    ) || [];

export const useGetCustomerData = ({
  customerIds,
}: UseGetCustomerDataArgs): UseGetCustomerDataResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const { data, loading, error } = useGetCustomerDataForTimeEntriesQuery({
    context: {
      clientName: ApolloClientNames.OIGQL,
    },
    variables: {
      filter: {
        or: [
          {
            and: [
              {
                id: {
                  matchesAny: customerIds,
                },
              },
              {
                type: {
                  matchesAny: [DataAccess_ContactType.Customer],
                },
              },
            ],
          },
        ],
      },
    },
    skip: customerIds.length === 0,
  });

  const mappedError = mapError({
    sourceComponent: 'useGetCustomerData',
    sandbox,
    intl,
    error,
  });

  return {
    data: mapCustomerData(data) as DataAccess_Customer[],
    loading,
    error: mappedError,
  };
};
