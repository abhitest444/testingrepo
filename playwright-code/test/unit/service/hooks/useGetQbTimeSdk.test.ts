import { renderHook } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { QbTimeSdkFactory } from '@work-timecapture/qbtime-sdk';
import { useGetQbTimeSdk } from 'src/js/service/hooks/useGetQbTimeSdk';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('@work-timecapture/qbtime-sdk', () => ({
  QbTimeSdkFactory: {
    getInstance: jest.fn(),
  },
}));

const mockUseSandbox = useSandbox as jest.MockedFunction<typeof useSandbox>;
const mockGetInstance = QbTimeSdkFactory.getInstance as jest.MockedFunction<
  typeof QbTimeSdkFactory.getInstance
>;

describe('useGetQbTimeSdk', () => {
  const mockSandbox = {
    logger: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    },
  };
  const mockSdk = { isApprovalTabEnabled: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSandbox.mockReturnValue(mockSandbox as any);
    mockGetInstance.mockReturnValue(mockSdk as any);
  });

  it('returns the sdk instance from the factory built with the sandbox', () => {
    const { result } = renderHook(() => useGetQbTimeSdk());

    expect(mockGetInstance).toHaveBeenCalledTimes(1);
    expect(mockGetInstance).toHaveBeenCalledWith(mockSandbox, undefined);
    expect(result.current).toBe(mockSdk);
  });

  it('forwards the optional config to the factory', () => {
    const config = { subscription: { baseUrl: 'https://mock' } } as any;

    renderHook(() => useGetQbTimeSdk(config));

    expect(mockGetInstance).toHaveBeenCalledWith(mockSandbox, config);
  });

  it('memoizes the sdk across rerenders when sandbox and config are stable', () => {
    const config = {} as any;
    const { result, rerender } = renderHook(() => useGetQbTimeSdk(config));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(mockGetInstance).toHaveBeenCalledTimes(1);
  });

  it('rebuilds the sdk when the config reference changes', () => {
    const { rerender } = renderHook(({ cfg }) => useGetQbTimeSdk(cfg), {
      initialProps: { cfg: {} as any },
    });

    rerender({ cfg: {} as any });

    expect(mockGetInstance).toHaveBeenCalledTimes(2);
  });
});
