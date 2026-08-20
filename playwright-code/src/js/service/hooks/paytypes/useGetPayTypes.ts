import { ApolloError } from '@apollo/client';
import {
  GetPayrollEmployeeCompensationsQuery,
  Payroll_EmployeeCompensation,
  useGetPayrollEmployeeCompensationsQuery,
} from 'src/__generated__/oigql/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';

export const mapPayTypesData = (
  data?: GetPayrollEmployeeCompensationsQuery,
): Payroll_EmployeeCompensation[] =>
  data?.payrollEmployeeCompensations?.edges
    ?.map((edge) => edge.node as Payroll_EmployeeCompensation)
    .sort((a, b) =>
      a.employerCompensation.name.localeCompare(b.employerCompensation.name),
    ) || [];

export interface UseGetPayTypesState {
  data: Payroll_EmployeeCompensation[];
  error?: ApolloError;
  loading: boolean;
}

export interface UseGetPayTypesArg {
  employeeId: string;
}

// TODO - query response is limited to 50 results ?
export const useGetPayTypes = ({
  employeeId,
}: UseGetPayTypesArg): UseGetPayTypesState => {
  const { data, loading, error } = useGetPayrollEmployeeCompensationsQuery({
    variables: {
      filter: {
        employeeId,
        active: true,
      },
    },
    context: {
      clientName: ApolloClientNames.OIGQL,
    },
    skip: !employeeId,
  });

  return {
    data: mapPayTypesData(data),
    loading,
    error,
  };
};
