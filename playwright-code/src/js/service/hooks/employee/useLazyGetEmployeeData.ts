import { useCallback, useEffect, useState, useRef } from 'react';

import { useIntl, useSandbox } from '@payroll/quicksand';
import { LazyQueryExecFunction } from '@apollo/client';
import {
  ApolloClientNames,
  getRegion,
} from 'src/js/service/ApolloClientBuilderUtils';
import {
  GetEmployeeByIdQuery_company_Company_employee_Employee as Employee,
  GetEmployeeDataForTimeEntriesQuery_Query,
  useGetEmployeeByIdLazyQuery,
} from 'src/__generated__/gas/graphql';
import { mapError } from 'src/js/service/utils/mapError';
import { Exact } from 'src/__generated__/timeTracking/graphql';
import { useGetEmployeeJobCostingLazyQuery } from 'src/__generated__/oigql/graphql';

type QueryType = LazyQueryExecFunction<
  GetEmployeeDataForTimeEntriesQuery_Query,
  Exact<{
    employeeId: string;
    shouldFetchTimeOffPolicies: boolean;
  }>
>;

interface UseLazySearchTimeEntriesResult {
  query: QueryType;
  fetchJobCosting: (variables: { employeeId: string }) => void;
  loading: boolean;
  error?: string;
  data?: Employee;
  resetData: () => void;
}

export const useLazyGetEmployeeData = (
  hasPayroll: Boolean,
  timeTrackingOnlyId: string | undefined,
): UseLazySearchTimeEntriesResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  // Store the current employee ID for job costing query
  const employeeIdRef = useRef<string | null>(null);

  // Store the last query options to potentially re-run queries
  const lastOptionsRef = useRef<any>(null);

  // Query for employee data from GAS
  const [
    employeeQuery,
    { loading: gasLoading, error: gasError, data: queryData },
  ] = useGetEmployeeByIdLazyQuery({
    context: {
      clientName: ApolloClientNames.GAS,
      hasPayroll,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all', // Allow partial data even when errors occur
  });

  // Query for job costing data from OIGQL
  const [
    fetchJobCosting,
    { loading: oigqlLoading, error: oigqlError, data: jobCostingData },
  ] = useGetEmployeeJobCostingLazyQuery({
    context: {
      clientName: ApolloClientNames.OIGQL,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const [data, setData] = useState<Employee>();

  // Combined loading state from both queries
  const loading = gasLoading || oigqlLoading;

  // Combined error state (prioritize OIGQL error)
  const error = oigqlError || gasError;

  // Update the combined data whenever either query updates
  const updateCombinedData = useCallback(() => {
    const employee = queryData?.company?.employee;
    const jobCosting = jobCostingData?.workerManagementEmployeeJobCosting;

    // If we have employee data, combine it with job costing data
    if (employee) {
      // Create a new employee object with updated job costing data
      const employeeWithJobCosting: Employee = {
        ...employee,
        employmentDetail: {
          ...employee.employmentDetail,
          jobCosting: {
            ...employee.employmentDetail?.jobCosting,
            // Override with OIGQL data if available
            billRate:
              jobCosting?.billRate?.value ||
              employee.employmentDetail?.jobCosting?.billRate,
            billable:
              jobCosting?.billable ||
              employee.employmentDetail?.jobCosting?.billable ||
              false,
          },
        },
      };

      setData(employeeWithJobCosting);
    }
    // If we only have job costing data but no employee data, create a minimal employee object
    else if (jobCosting && !employee) {
      // Create a minimal employee object with just the job costing data
      const minimalEmployee = {
        id: employeeIdRef.current || '',
        displayName: '',
        employmentDetail: {
          jobCosting: {
            billRate: jobCosting.billRate?.value,
            billable: jobCosting.billable,
          },
        },
      } as Employee;

      setData(minimalEmployee);
    }
  }, [queryData, jobCostingData, setData]);

  // Effect to update data when employee data changes
  useEffect(() => {
    if (!gasLoading && queryData?.company?.employee) {
      // Always update the combined data when employee data changes
      updateCombinedData();
    }
  }, [queryData, gasLoading, updateCombinedData]);

  // Effect to update data when job costing data changes
  useEffect(() => {
    if (!oigqlLoading && jobCostingData) {
      // Update data regardless of whether we have employee data or not
      updateCombinedData();
    }
  }, [jobCostingData, oigqlLoading, updateCombinedData]);

  // Effect to handle job costing query errors
  useEffect(() => {
    if (oigqlError) {
      sandbox.logger.error('Event=Error while fetching job costing data', {
        error: oigqlError,
      });
    }
  }, [oigqlError, sandbox.logger]);

  const handleFailure = (
    timeTrackingOnlyId: string | undefined,
  ): string | undefined => {
    // TimeTrackingOnly users don't have permission to call this API but our code can handle that,
    // so just swallow this error
    if (timeTrackingOnlyId) {
      return undefined;
    }
    return mapError({
      sourceComponent: 'useLazyGetEmployeeData',
      sandbox,
      intl,
      error,
    });
  };

  // Wrap the query to maintain the expected interface while enabling parallel execution
  const wrappedQuery: QueryType = useCallback(
    (options) => {
      // Store the options for potential re-use
      lastOptionsRef.current = options;

      // Extract the employee ID from the options if available
      const employeeId = options?.variables?.employeeId;

      if (employeeId) {
        employeeIdRef.current = employeeId;
        // Run getEmployeeJobCosting (OIGQL) in parallel with GAS employee query below
        fetchJobCosting({ variables: { employeeId } });
      }

      const region = getRegion(sandbox);

      // Modify options if region is AU and we have variables
      const modifiedOptions =
        region === 'AU' && options?.variables
          ? {
              ...options,
              variables: {
                ...options.variables,
                shouldFetchTimeOffPolicies: false,
              },
            }
          : options;

      // Execute the employee query and return its promise
      return employeeQuery(modifiedOptions);
    },
    [employeeQuery, fetchJobCosting, sandbox],
  );

  // Function to reset the data state
  const resetData = useCallback(() => {
    setData(undefined);
    employeeIdRef.current = null;
  }, []);

  return {
    query: wrappedQuery,
    fetchJobCosting: (variables: { employeeId: string }) => {
      employeeIdRef.current = variables.employeeId;
      fetchJobCosting({ variables });
    },
    loading,
    error: handleFailure(timeTrackingOnlyId),
    data,
    resetData,
  };
};
