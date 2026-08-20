import { act } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import {
  EMPLOYEE_APOLLO_ERROR_MOCKS,
  EMPLOYEE_SUCCESS_MOCKS,
  EMPLOYEE_AND_JOB_COSTING_SUCCESS_MOCKS,
  EMPLOYEE_ERROR_JOB_COSTING_SUCCESS_MOCKS,
  EMPLOYEE_SUCCESS_JOB_COSTING_ERROR_MOCKS,
} from 'test/unit/service/queries/employeeQueries';
import { useLazyGetEmployeeData } from 'src/js/service/hooks/employee/useLazyGetEmployeeData';
import { GetEmployeeByIdDocument } from 'src/__generated__/gas/graphql';
import { GetEmployeeJobCostingDocument } from 'src/__generated__/oigql/graphql';

// Mock the useSandbox hook
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: jest.fn(),
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn().mockReturnValue('Formatted error message'),
  })),
}));

describe('useLazyGetEmployeeData', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockSandbox = {
    logger: mockLogger,
    extensions: {
      qbo: {
        context: {
          getCompanyL10nInfo: jest.fn().mockReturnValue({ region: 'US' }),
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
  });
  it('should return loading state initially', () => {
    const { result } = renderHookWithApolloProvider(
      () => useLazyGetEmployeeData(true, undefined),
      EMPLOYEE_SUCCESS_MOCKS,
    );

    expect(result.current.loading).toBe(false); // since lazy, will not load on hook render
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual(undefined);
  });

  it('should return combined data from both employee and job costing queries', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useLazyGetEmployeeData(false, undefined),
      EMPLOYEE_AND_JOB_COSTING_SUCCESS_MOCKS,
    );

    act(() => {
      result.current.query({
        variables: {
          employeeId: '1',
          shouldFetchTimeOffPolicies: false,
        },
      });
    });

    await waitForNextUpdate();

    // Wait for both queries to complete
    if (result.current.loading) {
      await waitForNextUpdate();
    }

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();

    // Check that the data contains employee info and job costing data from OIGQL
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toEqual('1');
    expect(result.current.data?.displayName).toEqual('John Doe');
    expect(result.current.data?.employmentDetail?.jobCosting?.billRate).toEqual(
      75,
    ); // From OIGQL
    expect(result.current.data?.employmentDetail?.jobCosting?.billable).toEqual(
      true,
    ); // From OIGQL
  });

  it('should return job costing data even if employee query fails', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useLazyGetEmployeeData(false, undefined),
      EMPLOYEE_ERROR_JOB_COSTING_SUCCESS_MOCKS,
    );

    act(() => {
      result.current.query({
        variables: {
          employeeId: '1',
          shouldFetchTimeOffPolicies: false,
        },
      });
    });

    await waitForNextUpdate();

    // There might be multiple updates as queries resolve
    if (result.current.loading) {
      await waitForNextUpdate();
    }

    // We expect an error since the employee query failed
    expect(result.current.error).toBeDefined();

    // But we should still have a minimal employee object with job costing data
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toEqual('1');
    expect(result.current.data?.employmentDetail?.jobCosting?.billRate).toEqual(
      75,
    );
    expect(result.current.data?.employmentDetail?.jobCosting?.billable).toEqual(
      true,
    );
  });

  it('should return error if both queries fail', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useLazyGetEmployeeData(false, undefined),
      EMPLOYEE_APOLLO_ERROR_MOCKS, // Only employee error mock, no job costing mock
    );

    act(() => {
      result.current.query({
        variables: {
          employeeId: '1',
          shouldFetchTimeOffPolicies: false,
        },
      });
    });

    await waitForNextUpdate();

    // expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.data).toEqual(undefined);
  });

  it('should reset data when resetData is called', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useLazyGetEmployeeData(false, undefined),
      EMPLOYEE_AND_JOB_COSTING_SUCCESS_MOCKS,
    );

    act(() => {
      result.current.query({
        variables: {
          employeeId: '1',
          shouldFetchTimeOffPolicies: false,
        },
      });
    });

    await waitForNextUpdate();

    // Wait for both queries to complete
    if (result.current.loading) {
      await waitForNextUpdate();
    }

    // Ensure data is populated
    expect(result.current.data).not.toEqual(undefined);

    // Call resetData to clear the data
    act(() => {
      result.current.resetData();
    });

    // Check if data is reset to undefined
    expect(result.current.data).toEqual(undefined);
  });

  it('should properly handle billable flag with default value', async () => {
    // Create custom mocks that don't include a billable field in either response
    const MOCK_WITHOUT_BILLABLE = [
      // Employee mock (GAS)
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
                    // billable field is intentionally omitted
                  },
                },
              },
            },
          },
        },
      },
      // Job costing mock (OIGQL) - also need to mock this to avoid error
      {
        request: {
          query: GetEmployeeJobCostingDocument,
          variables: {
            employeeId: '1',
          },
        },
        result: {
          data: {
            // No billable field here either
            workerManagementEmployeeJobCosting: null,
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useLazyGetEmployeeData(false, undefined),
      MOCK_WITHOUT_BILLABLE,
    );

    act(() => {
      result.current.query({
        variables: {
          employeeId: '1',
          shouldFetchTimeOffPolicies: false,
        },
      });
    });

    await waitForNextUpdate();

    // Wait for any additional loading to complete
    if (result.current.loading) {
      await waitForNextUpdate();
    }

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();

    // When billable is not defined in either GAS or OIGQL response, it should default to false
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.employmentDetail?.jobCosting?.billable).toEqual(
      false,
    );
  });

  it('should log error message when job costing fetch fails', async () => {
    // Create a spy on the mockLogger.error to track calls
    const errorSpy = jest.spyOn(mockLogger, 'error');

    // Create a custom mock that will cause the job costing query to fail
    const CUSTOM_ERROR_MOCKS = [
      // Employee mock (GAS) - this should work fine
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
      // Job costing mock (OIGQL) - this will fail
      {
        request: {
          query: GetEmployeeJobCostingDocument,
          variables: {
            employeeId: '1',
          },
        },
        error: new Error('Job costing fetch failed'),
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useLazyGetEmployeeData(false, undefined),
      CUSTOM_ERROR_MOCKS,
    );

    act(() => {
      result.current.query({
        variables: {
          employeeId: '1',
          shouldFetchTimeOffPolicies: false,
        },
      });
    });

    await waitForNextUpdate();

    // Wait for the error to be processed by the useEffect hook
    if (result.current.loading) {
      await waitForNextUpdate();
    }

    // Verify that the error log message was called with the correct parameters
    // The error logging now happens through the useEffect hook that monitors oigqlError
    expect(errorSpy).toHaveBeenCalledWith(
      'Event=Error while fetching job costing data',
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Job costing fetch failed',
        }),
      }),
    );
  });
});
