import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useSandbox } from '@payroll/quicksand';
import { QbTimeSdkFactory } from '@work-timecapture/qbtime-sdk';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('@work-timecapture/qbtime-sdk', () => ({
  QbTimeSdkFactory: {
    create: jest.fn(),
  },
}));

const mockUseSandbox = useSandbox as jest.MockedFunction<typeof useSandbox>;
const mockQbTimeSdkFactoryCreate =
  QbTimeSdkFactory.create as jest.MockedFunction<
    typeof QbTimeSdkFactory.create
  >;

describe('useQbTimeSdk', () => {
  const mockSandbox = {
    logger: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSandbox.mockReturnValue(mockSandbox as any);
  });

  it('returns initial state when mounted', () => {
    const sdk = {
      getDecision: jest.fn(),
    };
    mockQbTimeSdkFactoryCreate.mockReturnValue(sdk as any);

    const { result } = renderHook(() =>
      useQbTimeSdk<string, []>((sdkInstance: any) => sdkInstance.getDecision),
    );

    expect(mockQbTimeSdkFactoryCreate).toHaveBeenCalledWith(mockSandbox);
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('executes sdk method and stores successful result', async () => {
    const sdk = {
      getDecision: jest.fn().mockResolvedValue('allowed'),
    };
    mockQbTimeSdkFactoryCreate.mockReturnValue(sdk as any);

    const { result } = renderHook(() =>
      useQbTimeSdk<string, []>((sdkInstance: any) => sdkInstance.getDecision),
    );

    await act(async () => {
      const response = await result.current.execute();
      expect(response).toBe('allowed');
    });

    expect(sdk.getDecision).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('allowed');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('captures sdk errors and returns undefined', async () => {
    const sdkError = new Error('sdk-failure');
    const sdk = {
      getDecision: jest.fn().mockRejectedValue(sdkError),
    };
    mockQbTimeSdkFactoryCreate.mockReturnValue(sdk as any);

    const { result } = renderHook(() =>
      useQbTimeSdk<string, []>((sdkInstance: any) => sdkInstance.getDecision),
    );

    await act(async () => {
      const response = await result.current.execute();
      expect(response).toBeUndefined();
    });

    expect(sdk.getDecision).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(sdkError);
    expect(mockSandbox.logger.error).toHaveBeenCalledWith(
      'useQbTimeSdk: SDK method call failed',
      { error: sdkError.message },
    );
  });

  it('resets state after data/error updates', async () => {
    const sdkError = new Error('sdk-failure');
    const sdk = {
      getDecision: jest.fn().mockRejectedValue(sdkError),
    };
    mockQbTimeSdkFactoryCreate.mockReturnValue(sdk as any);

    const { result } = renderHook(() =>
      useQbTimeSdk<string, []>((sdkInstance: any) => sdkInstance.getDecision),
    );

    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.error).toBe(sdkError);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('executes automatically on mount when enabled and args are provided', async () => {
    const sdk = {
      evaluateWithArg: jest.fn().mockResolvedValue('mounted-value'),
    };
    mockQbTimeSdkFactoryCreate.mockReturnValue(sdk as any);

    const { result } = renderHook(() =>
      useQbTimeSdk<string, [string]>(
        (sdkInstance: any) => sdkInstance.evaluateWithArg,
        {
          executeOnMount: true,
          args: ['worker-123'],
        },
      ),
    );

    await waitFor(() => {
      expect(sdk.evaluateWithArg).toHaveBeenCalledWith('worker-123');
    });

    expect(result.current.data).toBe('mounted-value');
    expect(result.current.error).toBeUndefined();
  });
});
