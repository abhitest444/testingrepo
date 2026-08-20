import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  EmployerCompensation,
  useGetFilteredWageItemsDataForTimeEntriesQuery,
} from 'src/__generated__/gas/graphql';
import { mapError } from 'src/js/service/utils/mapError';

export interface UseGetFilteredWageItemsArgs {
  wageItemIds: string[];
}

export interface UseGetFilteredWageItemsResult {
  data: EmployerCompensation[];
  error?: string;
  loading: boolean;
}

export const useGetFilteredWageItems = ({
  wageItemIds,
}: UseGetFilteredWageItemsArgs): UseGetFilteredWageItemsResult => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const { data, loading, error } =
    useGetFilteredWageItemsDataForTimeEntriesQuery({
      variables: {
        filterBy: {
          id: {
            in: wageItemIds, // , ["01020000-0368-0000-4300-00DD10A9555A"]
          },
        },
      },
      context: {
        clientName: ApolloClientNames.GAS,
      },
      fetchPolicy: 'cache-and-network',
      skip: wageItemIds.length === 0,
    });

  return {
    data: data?.company?.companyInfo?.employerInfo?.employerCompensations ?? [],
    loading,
    error: mapError({
      sourceComponent: 'updateTimeEntry',
      sandbox,
      intl,
      error,
      customErrorHandler: (customError) => {
        if (customError === 'The company you were looking for does not exist') {
          return undefined;
        }
        return intl.formatMessage({
          id: 'catch.all.error.content',
        });
      },
    }),
  };
};
