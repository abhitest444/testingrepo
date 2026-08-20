import { renderHook } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { V3ApiConnector } from 'src/js/service/rest/V3ApiConnector';
import useGetPreferences from 'src/js/service/hooks/preferenceces/useGetPreferences';
import { PREFERENCES_ENDPOINT } from 'src/js/common/constants';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('src/js/service/rest/V3ApiConnector', () => ({
  V3ApiConnector: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

const sandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

describe('useGetPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(sandbox);
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
  });

  it('should fetch data successfully', async () => {
    const responseData = { data: 'test data' };
    (V3ApiConnector as jest.Mock).mockResolvedValue(responseData);

    const { result, waitForNextUpdate } = renderHook(() => useGetPreferences());

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(responseData);
    expect(result.current.error).toBe(false);
    expect(sandbox.logger.info).toHaveBeenCalledWith(
      `Component: useGetPreferences Endpoint ${PREFERENCES_ENDPOINT} API responded with data`,
    );
  });

  it('should handle API error response', async () => {
    const error = new Error('Request failed with status code 400');
    (V3ApiConnector as jest.Mock).mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => useGetPreferences());

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toEqual(true);
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      `Component: useGetPreferences Endpoint ${PREFERENCES_ENDPOINT} error fetching preferences data: ${error}`,
    );
  });

  it('should retry on API error and then fail', async () => {
    const error = new Error('Request failed with status code 400');
    (V3ApiConnector as jest.Mock).mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => useGetPreferences());

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toEqual(true);
    expect(sandbox.logger.warn).toHaveBeenCalledWith(
      `Component: useGetPreferences Endpoint ${PREFERENCES_ENDPOINT} retrying... Attempts left: 1`,
    );
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      `Component: useGetPreferences Endpoint ${PREFERENCES_ENDPOINT} error fetching preferences data: ${error}`,
    );
  });

  it('should return workforce preferences when isWorkforceEnvironment is true', async () => {
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

    const { result, waitFor } = renderHook(() => useGetPreferences());

    // Wait for loading to become false
    await waitFor(() => expect(result.current.loading).toBe(false));

    // After effect, loading should be false and data should be set
    expect(result.current.data).toEqual({
      Preferences: {
        AccountingInfoPrefs: {
          DepartmentTerminology: 'Department',
          CustomerTerminology: 'Customer',
        },
      },
    });
    expect(result.current.error).toBe(false);
    expect(V3ApiConnector).not.toHaveBeenCalled();
  });
});
