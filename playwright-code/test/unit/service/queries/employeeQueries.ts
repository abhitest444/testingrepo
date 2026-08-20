import { MockedResponse } from '@apollo/client/testing';
import { GetEmployeeByIdDocument } from 'src/__generated__/gas/graphql';
import {
  GetEmployeeJobCostingDocument,
  Common_CurrencyCode,
} from 'src/__generated__/oigql/graphql';

// Mock for successful employee data fetch
export const EMPLOYEE_SUCCESS_MOCKS: MockedResponse[] = [
  {
    request: {
      query: GetEmployeeByIdDocument,
      variables: {
        employeeId: '1',
        shouldFetchTimeOffPolicies: false,
      },
    },
    result: {
      data: {
        company: {
          __typename: 'Company',
          id: '123',
          employee: {
            __typename: 'Employee',
            id: '1',
            displayName: 'John Doe',
            employmentDetail: {
              __typename: 'Payroll_Employee_EmploymentDetail',
              jobCosting: {
                __typename: 'EmployeeJobCosting',
                billRate: 50,
                costRate: 25,
              },
            },
          },
        },
      },
    },
  },
];

// Mock for successful job costing data fetch
export const JOB_COSTING_SUCCESS_MOCKS: MockedResponse[] = [
  {
    request: {
      query: GetEmployeeJobCostingDocument,
      variables: {
        employeeId: '1',
      },
    },
    result: {
      data: {
        workerManagementEmployeeJobCosting: {
          billable: true,
          billRate: {
            currency: Common_CurrencyCode.Usd,
            value: 75,
          },
          costRate: {
            currency: Common_CurrencyCode.Usd,
            value: 35,
          },
        },
      },
    },
  },
];

// Combined mocks for both successful queries
export const EMPLOYEE_AND_JOB_COSTING_SUCCESS_MOCKS: MockedResponse[] = [
  ...EMPLOYEE_SUCCESS_MOCKS,
  ...JOB_COSTING_SUCCESS_MOCKS,
];

// Mock for employee query error
export const EMPLOYEE_APOLLO_ERROR_MOCKS: MockedResponse[] = [
  {
    request: {
      query: GetEmployeeByIdDocument,
      variables: {
        employeeId: '1',
        shouldFetchTimeOffPolicies: false,
      },
    },
    error: new Error('Test error'),
  },
];

// Mock for job costing query error
export const JOB_COSTING_APOLLO_ERROR_MOCKS: MockedResponse[] = [
  {
    request: {
      query: GetEmployeeJobCostingDocument,
      variables: {
        employeeId: '1',
      },
    },
    error: new Error('Job costing fetch error'),
  },
];

// Mock for employee error but job costing success
export const EMPLOYEE_ERROR_JOB_COSTING_SUCCESS_MOCKS: MockedResponse[] = [
  ...EMPLOYEE_APOLLO_ERROR_MOCKS,
  ...JOB_COSTING_SUCCESS_MOCKS,
];

// Mock for employee success but job costing error
export const EMPLOYEE_SUCCESS_JOB_COSTING_ERROR_MOCKS: MockedResponse[] = [
  ...EMPLOYEE_SUCCESS_MOCKS,
  ...JOB_COSTING_APOLLO_ERROR_MOCKS,
];
