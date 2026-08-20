import { renderHook } from '@testing-library/react-hooks';
import { useDimensionVisibility } from 'src/js/common/useDimensionVisibility';

jest.mock('src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: jest.fn(),
}));

const { useQbTimeSdk } = jest.requireMock('src/js/service/hooks/useQbTimeSdk');

type SdkOverrides = {
  data?: boolean;
  loading?: boolean;
  error?: Error;
};

const setupMocks = ({
  data = false,
  loading = false,
  error = undefined,
}: SdkOverrides = {}) => {
  useQbTimeSdk.mockReturnValue({ data, loading, error });
};

describe('useDimensionVisibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it('initializes with dimensions hidden when the SDK decision is off', () => {
    const { result } = renderHook(() => useDimensionVisibility());

    expect(result.current).toEqual({ isVisible: false, loading: false });
  });

  describe('loading', () => {
    it('is true while the SDK decision has not resolved', () => {
      setupMocks({ data: undefined, loading: true });

      const { result } = renderHook(() => useDimensionVisibility());

      expect(result.current.loading).toBe(true);
    });

    it('is false once the SDK decision resolves', () => {
      setupMocks({ data: true, loading: false });

      const { result } = renderHook(() => useDimensionVisibility());

      expect(result.current.loading).toBe(false);
    });

    it('is false when the SDK decision resolves with an error', () => {
      setupMocks({
        data: undefined,
        loading: false,
        error: new Error('sdk failure'),
      });

      const { result } = renderHook(() => useDimensionVisibility());

      expect(result.current.loading).toBe(false);
    });
  });

  describe('isVisible', () => {
    it('is true when the SDK decision resolves true with no error', () => {
      setupMocks({ data: true, loading: false });

      const { result } = renderHook(() => useDimensionVisibility());

      expect(result.current).toEqual({ isVisible: true, loading: false });
    });

    it('is false when the SDK decision resolves false', () => {
      setupMocks({ data: false, loading: false });

      const { result } = renderHook(() => useDimensionVisibility());

      expect(result.current.isVisible).toBe(false);
    });

    it('is false when the SDK decision errors, even if data is truthy', () => {
      setupMocks({
        data: true,
        loading: false,
        error: new Error('sdk failure'),
      });

      const { result } = renderHook(() => useDimensionVisibility());

      expect(result.current.isVisible).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('surface options', () => {
    it('suppresses visibility when isTimeEntry is false', () => {
      setupMocks({ data: true, loading: false });

      const { result } = renderHook(() =>
        useDimensionVisibility({ isTimeEntry: false }),
      );

      expect(result.current.isVisible).toBe(false);
    });

    it('suppresses visibility when isOTX is false', () => {
      setupMocks({ data: true, loading: false });

      const { result } = renderHook(() =>
        useDimensionVisibility({ isOTX: false }),
      );

      expect(result.current.isVisible).toBe(false);
    });

    it('is visible when both isTimeEntry and isOTX default to true', () => {
      setupMocks({ data: true, loading: false });

      const { result } = renderHook(() => useDimensionVisibility({}));

      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('dependency wiring', () => {
    it('evaluates the SDK isDimensionEnabled decision on mount', () => {
      renderHook(() => useDimensionVisibility());

      expect(useQbTimeSdk).toHaveBeenCalledWith(expect.any(Function), {
        executeOnMount: true,
      });
    });

    it('selects isDimensionEnabled from the SDK instance', () => {
      renderHook(() => useDimensionVisibility());

      const selector = useQbTimeSdk.mock.calls[0][0];
      const fakeSdk = { isDimensionEnabled: 'sentinel-value' };

      expect(selector(fakeSdk)).toBe('sentinel-value');
    });
  });
});
