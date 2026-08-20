import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useFeatureFlag } from '../../../../src/js/common/hooks/useFeatureFlag';

// Mock dependencies
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: mockLogger,
  }),
}));

const mockIsIXPFeatureFlagEnabled = jest.fn();
jest.mock('../../../../src/js/service/utils/featureFlags', () => ({
  isIXPFeatureFlagEnabled: (...args: any[]) =>
    mockIsIXPFeatureFlagEnabled(...args),
}));

describe('useFeatureFlag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return default value initially', () => {
    mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useFeatureFlag('TEST_FEATURE_FLAG', false),
    );

    // Should return default value before async check completes
    expect(result.current).toBe(false);
  });

  it('should check feature flag and update state when enabled', async () => {
    mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useFeatureFlag('TEST_FEATURE_FLAG', false),
    );

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);
    expect(mockLogger.log).toHaveBeenCalledWith(
      'Event=Evaluation result for feature flag - TEST_FEATURE_FLAG Result=true',
    );
  });

  it('should check feature flag and update state when disabled', async () => {
    mockIsIXPFeatureFlagEnabled.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useFeatureFlag('TEST_FEATURE_FLAG', true),
    );

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);
    expect(mockLogger.log).toHaveBeenCalledWith(
      'Event=Evaluation result for feature flag - TEST_FEATURE_FLAG Result=false',
    );
  });

  it('should only check feature flag once per component instance', async () => {
    mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

    const { result, rerender } = renderHook(() =>
      useFeatureFlag('TEST_FEATURE_FLAG', false),
    );

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // Clear mocks to verify no additional calls
    mockIsIXPFeatureFlagEnabled.mockClear();
    mockLogger.log.mockClear();

    // Rerender the hook
    rerender();

    // Should not make additional API calls
    expect(mockIsIXPFeatureFlagEnabled).not.toHaveBeenCalled();
    expect(mockLogger.log).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully and return default value', async () => {
    const testError = new Error('Feature flag service unavailable');
    mockIsIXPFeatureFlagEnabled.mockRejectedValue(testError);

    const { result } = renderHook(() =>
      useFeatureFlag('TEST_FEATURE_FLAG', false),
    );

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to check feature flag: TEST_FEATURE_FLAG',
      {
        error: testError.toString(),
      },
    );
  });

  it('should use provided default value when error occurs', async () => {
    mockIsIXPFeatureFlagEnabled.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() =>
      useFeatureFlag('TEST_FEATURE_FLAG', true),
    );

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should handle different feature flag names', async () => {
    mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

    const { result: result1 } = renderHook(() =>
      useFeatureFlag('FEATURE_FLAG_1', false),
    );
    const { result: result2 } = renderHook(() =>
      useFeatureFlag('FEATURE_FLAG_2', false),
    );

    await waitFor(() => {
      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
    });

    expect(mockLogger.log).toHaveBeenCalledWith(
      'Event=Evaluation result for feature flag - FEATURE_FLAG_1 Result=true',
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      'Event=Evaluation result for feature flag - FEATURE_FLAG_2 Result=true',
    );
  });

  it('should mark as initialized even on error to prevent retry loops', async () => {
    mockIsIXPFeatureFlagEnabled.mockRejectedValue(new Error('API Error'));

    const { result, rerender } = renderHook(() =>
      useFeatureFlag('TEST_FEATURE_FLAG', false),
    );

    await waitFor(() => {
      expect(mockLogger.error).toHaveBeenCalled();
    });

    // Clear mocks
    mockIsIXPFeatureFlagEnabled.mockClear();
    mockLogger.error.mockClear();

    // Rerender - should not retry
    rerender();

    expect(mockIsIXPFeatureFlagEnabled).not.toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('should handle undefined/null errors gracefully', async () => {
    mockIsIXPFeatureFlagEnabled.mockRejectedValue(null);

    const { result } = renderHook(() =>
      useFeatureFlag('TEST_FEATURE_FLAG', false),
    );

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    expect(mockLogger.error).toHaveBeenCalled();
  });
});
