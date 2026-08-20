import { renderHook } from '@testing-library/react-hooks';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { useIsSubmitTimeEnabled } from 'src/js/service/hooks/useIsSubmitTimeEnabled';

jest.mock('src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: jest.fn(),
}));

const mockUseQbTimeSdk = useQbTimeSdk as jest.MockedFunction<
  typeof useQbTimeSdk
>;

describe('useIsSubmitTimeEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when sdk data is true', () => {
    mockUseQbTimeSdk.mockReturnValue({
      data: true,
      loading: false,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    } as any);

    const { result } = renderHook(() => useIsSubmitTimeEnabled());

    expect(result.current).toBe(true);
  });

  it('returns false when sdk data is false', () => {
    mockUseQbTimeSdk.mockReturnValue({
      data: false,
      loading: false,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    } as any);

    const { result } = renderHook(() => useIsSubmitTimeEnabled());

    expect(result.current).toBe(false);
  });

  it('returns undefined when sdk data is undefined', () => {
    mockUseQbTimeSdk.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    } as any);

    const { result } = renderHook(() => useIsSubmitTimeEnabled());

    expect(result.current).toBeUndefined();
  });

  it('calls useQbTimeSdk with submit-time method and executeOnMount', () => {
    mockUseQbTimeSdk.mockReturnValue({
      data: true,
      loading: false,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    } as any);

    renderHook(() => useIsSubmitTimeEnabled());

    expect(mockUseQbTimeSdk).toHaveBeenCalledWith(expect.any(Function), {
      executeOnMount: true,
    });

    const sdkMethodSelector = mockUseQbTimeSdk.mock.calls[0][0] as (
      sdk: any,
    ) => any;
    const mockIsSubmitTimeEnabled = jest.fn();
    const mockSdk = {
      submitTimeService: {
        isSubmitTimeEnabled: mockIsSubmitTimeEnabled,
      },
    };

    expect(sdkMethodSelector(mockSdk)).toBe(mockIsSubmitTimeEnabled);
  });
});
