/* eslint-disable camelcase */
import { ApolloError } from '@apollo/client';
import { getDecision } from '@core-app/variability-sync-sdk';
import { useGetPayTypes } from 'src/js/service/hooks/paytypes/useGetPayTypes';
import {
  computeIsPayTypeEnabled,
  SUPPORTED_PAYROLL_REGIONS,
} from 'src/js/service/hooks/paytypes/payTypeUtils';
import {
  GetPayrollEmployeeCompensationsQuery,
  useGetPayrollEmployeeCompensationsQuery,
} from 'src/__generated__/oigql/graphql';
import { renderHookWithApolloProvider } from '../../../testUtils';

// TODO should use apollo query mocking, don't mock hook directly
jest.mock('src/__generated__/oigql/graphql', () => ({
  useGetPayrollEmployeeCompensationsQuery: jest.fn(),
}));

jest.mock('@core-app/variability-sync-sdk', () => ({
  getDecision: jest.fn(
    (_key: string, options: { defaultValue: boolean }) => options.defaultValue,
  ),
}));

const mockData: GetPayrollEmployeeCompensationsQuery = {
  payrollEmployeeCompensations: {
    edges: [
      {
        node: {
          id: '1',
          active: true,
          employerCompensation: {
            name: 'Compensation 1',
            type: {
              value: 'HOURLY_PAY',
            },
          },
        },
      },
      {
        node: {
          id: '2',
          active: true,
          employerCompensation: {
            name: 'Compensation 2',
            type: {
              value: 'SICK_PAY',
            },
          },
        },
      },
    ],
  },
};

describe('useGetPayTypes', () => {
  const employeeId = '123';
  it('should return data, loading, and error states correctly', async () => {
    (useGetPayrollEmployeeCompensationsQuery as jest.Mock).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
    });

    const { result, waitFor } = renderHookWithApolloProvider(() =>
      useGetPayTypes({ employeeId }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([
      {
        id: '1',
        active: true,
        employerCompensation: {
          name: 'Compensation 1',
          type: {
            value: 'HOURLY_PAY',
          },
        },
      },
      {
        id: '2',
        active: true,
        employerCompensation: {
          name: 'Compensation 2',
          type: {
            value: 'SICK_PAY',
          },
        },
      },
    ]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state', async () => {
    (useGetPayrollEmployeeCompensationsQuery as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    const { result } = renderHookWithApolloProvider(() =>
      useGetPayTypes({ employeeId }),
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle error state', async () => {
    const mockError = new ApolloError({ errorMessage: 'An error occurred' });

    (useGetPayrollEmployeeCompensationsQuery as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
    });

    const { result } = renderHookWithApolloProvider(() =>
      useGetPayTypes({ employeeId }),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });
});

describe('computeIsPayTypeEnabled', () => {
  beforeEach(() => {
    (getDecision as jest.Mock).mockImplementation(
      (_key: string, options: { defaultValue: boolean }) =>
        options.defaultValue,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each(SUPPORTED_PAYROLL_REGIONS)(
    'should return true for supported region %s',
    (region) => {
      expect(computeIsPayTypeEnabled(region)).toBe(true);
    },
  );

  it.each(['AU', 'IN', 'NZ', 'SG'])(
    'should return false for unsupported region %s',
    (region) => {
      expect(computeIsPayTypeEnabled(region)).toBe(false);
    },
  );

  it('should return false when region is undefined', () => {
    expect(computeIsPayTypeEnabled(undefined)).toBe(false);
  });

  it('should call getDecision with isPayTypeEnabled key', () => {
    computeIsPayTypeEnabled('US');

    expect(getDecision).toHaveBeenCalledWith('isPayTypeEnabled', {
      defaultValue: true,
    });
  });

  it('should respect variability override over default', () => {
    (getDecision as jest.Mock).mockReturnValue(false);

    expect(computeIsPayTypeEnabled('US')).toBe(false);
    expect(getDecision).toHaveBeenCalledWith('isPayTypeEnabled', {
      defaultValue: true,
    });
  });
});
