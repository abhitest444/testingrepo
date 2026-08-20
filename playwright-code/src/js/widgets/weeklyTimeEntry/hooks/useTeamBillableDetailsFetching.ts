import { useCallback, useMemo } from 'react';
import { useLazyGetVendorData } from 'src/js/service/hooks/vendor/useLazyGetVendorData';
import { useGetEmployeeJobCostingLazyQuery } from 'src/__generated__/oigql/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { useAppSelector } from '../store';
import { selectTeamMember } from '../store/selectors';
import { TimeForType } from '../types';

export interface TeamBillableDetails {
  billable: boolean;
  billableRate: number;
}

export const useTeamBillableDetailsFetching = () => {
  const teamMember = useAppSelector(selectTeamMember);
  const isEmployee = teamMember?.type === TimeForType.EMPLOYEE;

  const [
    fetchJobCosting,
    {
      loading: jobCostingLoading,
      error: jobCostingError,
      data: jobCostingData,
    },
  ] = useGetEmployeeJobCostingLazyQuery({
    context: {
      clientName: ApolloClientNames.OIGQL,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const {
    getVendorCallback: getVendorData,
    loading: vendorLoading,
    data: vendorData,
    error: vendorError,
  } = useLazyGetVendorData();

  const { billable, billableRate } = isEmployee
    ? {
        billable:
          jobCostingData?.workerManagementEmployeeJobCosting?.billable || false,
        billableRate:
          jobCostingData?.workerManagementEmployeeJobCosting?.billRate?.value,
      }
    : {
        billable: !!vendorData?.Vendor?.BillRate,
        billableRate: vendorData?.Vendor?.BillRate,
      };

  const data: TeamBillableDetails = useMemo(
    () => ({
      billable,
      billableRate: !billableRate ? 0 : billableRate,
    }),
    [billable, billableRate],
  );

  const fetchTeamBillableDetails = useCallback(() => {
    if (!teamMember?.id) {
      return;
    }

    if (isEmployee) {
      fetchJobCosting({
        variables: {
          employeeId: teamMember.id,
        },
      });
    } else {
      getVendorData(teamMember.id);
    }
  }, [teamMember?.id, isEmployee, fetchJobCosting, getVendorData]);

  return {
    fetchTeamBillableDetails,
    isLoading: jobCostingLoading || vendorLoading,
    data,
    error: isEmployee ? jobCostingError : vendorError,
  };
};
