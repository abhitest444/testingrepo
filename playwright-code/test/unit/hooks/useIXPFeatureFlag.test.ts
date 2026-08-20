import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { isIXPFeatureFlagEnabled } from 'src/js/service/utils/featureFlags';
import {
  isPayrollFirstCompany,
  isIESCustomer,
  isWorkforceEnvironment,
} from 'src/js/service/utils/sandboxUtils';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('src/js/service/utils/featureFlags', () => ({
  isIXPFeatureFlagEnabled: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isPayrollFirstCompany: jest.fn(),
  isIESCustomer: jest.fn(),
  isWorkforceEnvironment: jest.fn(),
}));

const mockUseSandbox = useSandbox as jest.MockedFunction<typeof useSandbox>;
const mockIsIXPFeatureFlagEnabled =
  isIXPFeatureFlagEnabled as jest.MockedFunction<
    typeof isIXPFeatureFlagEnabled
  >;
const mockIsPayrollFirstCompany = isPayrollFirstCompany as jest.MockedFunction<
  typeof isPayrollFirstCompany
>;
const mockIsIESCustomer = isIESCustomer as jest.MockedFunction<
  typeof isIESCustomer
>;
const mockIsWorkforceEnvironment =
  isWorkforceEnvironment as jest.MockedFunction<typeof isWorkforceEnvironment>;

describe('useIXPFeatureFlag', () => {
  const mockSandbox = {
    logger: {
      error: jest.fn(),
      log: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSandbox.mockReturnValue(mockSandbox as any);
    mockIsPayrollFirstCompany.mockReturnValue(false);
    mockIsIESCustomer.mockResolvedValue(false); // Default: not an IES customer
    mockIsWorkforceEnvironment.mockReturnValue(false); // Default: non-workforce environment
  });

  describe('initial state', () => {
    it('should return default values on initial render', () => {
      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag' }),
      );

      expect(result.current).toEqual({
        isEnabled: false,
        isLoading: true,
        error: null,
        settled: false,
      });
    });

    it('should use custom default value when provided', () => {
      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag', defaultValue: true }),
      );

      expect(result.current).toEqual({
        isEnabled: true,
        isLoading: true,
        error: null,
        settled: false,
      });
    });
  });

  describe('successful feature flag check', () => {
    it('should set isEnabled to true when feature flag is enabled', async () => {
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag' }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        mockSandbox,
        'test-flag',
      );
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(2);
      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Evaluation result for feature flag - test-flag Result=true',
      );
    });

    it('should set isEnabled to false when feature flag is disabled', async () => {
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag' }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({
        isEnabled: false,
        isLoading: false,
        error: null,
        settled: true,
      });

      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        mockSandbox,
        'test-flag',
      );
      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Evaluation result for feature flag - test-flag Result=false',
      );
    });

    it('should only check feature flag once even if dependencies change', async () => {
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result, rerender } = renderHook(
        ({ defaultValue }) =>
          useIXPFeatureFlag({ flagName: 'test-flag', defaultValue }),
        {
          initialProps: { defaultValue: false },
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender({ defaultValue: true });

      // Should only have been called twice due to hasChecked ref (PayrollFirst check + actual flag check)
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(2);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        mockSandbox,
        'test-flag',
      );
    });
  });

  describe('error handling', () => {
    it('should handle errors and set error state', async () => {
      const errorMessage = 'Feature flag check failed';
      const error = new Error(errorMessage);
      mockIsIXPFeatureFlagEnabled.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag' }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({
        isEnabled: false, // Should fall back to default value
        isLoading: false,
        error: errorMessage,
        settled: true,
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Failed to check feature flag:',
        {
          flagName: 'test-flag',
          error: errorMessage,
        },
      );
      expect(mockSandbox.logger.log).not.toHaveBeenCalled();
    });

    it('should handle non-Error objects and convert to string', async () => {
      const errorObject = { message: 'Custom error object' };
      mockIsIXPFeatureFlagEnabled.mockRejectedValue(errorObject);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag' }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({
        isEnabled: false,
        isLoading: false,
        error: 'Unknown error',
        settled: true,
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Failed to check feature flag:',
        {
          flagName: 'test-flag',
          error: 'Unknown error',
        },
      );
      expect(mockSandbox.logger.log).not.toHaveBeenCalled();
    });

    it('should fall back to default value when error occurs', async () => {
      const error = new Error('Feature flag check failed');
      mockIsIXPFeatureFlagEnabled.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag', defaultValue: true }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({
        isEnabled: true, // Should fall back to custom default value
        isLoading: false,
        error: 'Feature flag check failed',
        settled: true,
      });
    });
  });

  describe('loading state', () => {
    it('should set loading to true initially and false after completion', async () => {
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag' }),
      );

      // Initially loading should be true
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading to false even when error occurs', async () => {
      const error = new Error('Feature flag check failed');
      mockIsIXPFeatureFlagEnabled.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag' }),
      );

      // Initially loading should be true
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('multiple instances', () => {
    it('should handle multiple hook instances independently', async () => {
      mockIsIXPFeatureFlagEnabled
        .mockResolvedValueOnce(true) // PayrollFirst check for instance 1
        .mockResolvedValueOnce(true) // flag-1 check
        .mockResolvedValueOnce(true) // PayrollFirst check for instance 2
        .mockResolvedValueOnce(false); // flag-2 check

      const { result: result1 } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'flag-1' }),
      );

      const { result: result2 } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'flag-2' }),
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result1.current.isEnabled).toBe(true);
      expect(result2.current.isEnabled).toBe(false);

      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        mockSandbox,
        'flag-1',
      );
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        mockSandbox,
        'flag-2',
      );
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(4);

      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Evaluation result for feature flag - flag-1 Result=true',
      );
      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Evaluation result for feature flag - flag-2 Result=false',
      );
    });
  });

  describe('sandbox dependency', () => {
    it('should use the sandbox from useSandbox hook', async () => {
      const customSandbox = {
        logger: {
          error: jest.fn(),
          log: jest.fn(),
        },
      };
      mockUseSandbox.mockReturnValue(customSandbox as any);
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag' }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        customSandbox,
        'test-flag',
      );
    });
  });

  describe('flag name parameter', () => {
    it('should pass the correct flag name to the feature flag service', async () => {
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'my-custom-flag' }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        mockSandbox,
        'my-custom-flag',
      );
      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Evaluation result for feature flag - my-custom-flag Result=true',
      );
    });
  });

  describe('logging functionality', () => {
    it('should log successful feature flag evaluations', async () => {
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag' }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Evaluation result for feature flag - test-flag Result=true',
      );
    });

    it('should not log when feature flag check fails', async () => {
      const error = new Error('Feature flag check failed');
      mockIsIXPFeatureFlagEnabled.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({ flagName: 'test-flag' }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSandbox.logger.log).not.toHaveBeenCalled();
      expect(mockSandbox.logger.error).toHaveBeenCalled();
    });
  });

  describe('excludePayrollFirst parameter', () => {
    it('should return false immediately for PayrollFirst companies when PayrollFirst feature flag is disabled', async () => {
      mockIsPayrollFirstCompany.mockReturnValue(true);
      // When FEATURE_FLAG_PAYROLL_FIRST_ENABLED returns false, shouldExcludePayrollFirst becomes true
      mockIsIXPFeatureFlagEnabled.mockResolvedValueOnce(false);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({
          flagName: 'test-flag',
          excludePayrollFirst: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({
        isEnabled: false,
        isLoading: false,
        error: null,
        settled: true,
      });

      expect(mockIsPayrollFirstCompany).toHaveBeenCalledWith(mockSandbox);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);
      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Feature flag test-flag disabled for PayrollFirst customer',
      );
    });

    it('should proceed normally for non-PayrollFirst companies when excludePayrollFirst is true', async () => {
      mockIsPayrollFirstCompany.mockReturnValue(false);
      mockIsIXPFeatureFlagEnabled
        .mockResolvedValueOnce(true) // PayrollFirst check
        .mockResolvedValueOnce(true); // actual flag check

      const { result } = renderHook(() =>
        useIXPFeatureFlag({
          flagName: 'test-flag',
          excludePayrollFirst: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
      expect(mockIsPayrollFirstCompany).toHaveBeenCalledWith(mockSandbox);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalled();
    });

    it('should check PayrollFirst status regardless of excludePayrollFirst parameter', async () => {
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({
          flagName: 'test-flag',
          excludePayrollFirst: false,
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
      // PayrollFirst is always checked in the logging statement
      expect(mockIsPayrollFirstCompany).toHaveBeenCalledWith(mockSandbox);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(2);
    });

    it('should not block PayrollFirst customers in workforce environment', async () => {
      mockIsWorkforceEnvironment.mockReturnValue(true);
      mockIsPayrollFirstCompany.mockReturnValue(true);
      mockIsIXPFeatureFlagEnabled
        .mockResolvedValueOnce(false) // PayrollFirst check would normally exclude
        .mockResolvedValueOnce(true); // actual flag check should still run in workforce

      const { result } = renderHook(() =>
        useIXPFeatureFlag({
          flagName: 'test-flag',
          excludePayrollFirst: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenNthCalledWith(
        2,
        mockSandbox,
        'test-flag',
      );
      expect(mockSandbox.logger.log).not.toHaveBeenCalledWith(
        'Event=Feature flag test-flag disabled for PayrollFirst customer',
      );
    });
  });

  describe('checkIESMasterFlag parameter (IES master flag check removed)', () => {
    it('ignores checkIESMasterFlag and evaluates the actual flag directly', async () => {
      // Even for an IES customer, the IES master flag branch no longer runs.
      mockIsIESCustomer.mockResolvedValue(true);
      mockIsIXPFeatureFlagEnabled
        .mockResolvedValueOnce(true) // PayrollFirst check
        .mockResolvedValueOnce(true); // actual flag check

      const { result } = renderHook(() =>
        useIXPFeatureFlag({
          flagName: 'test-flag',
          checkIESMasterFlag: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
      // IES helper is never consulted anymore.
      expect(mockIsIESCustomer).not.toHaveBeenCalled();
      // Only the PayrollFirst check + the actual flag are evaluated.
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(2);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        mockSandbox,
        'test-flag',
      );
      expect(mockIsIXPFeatureFlagEnabled).not.toHaveBeenCalledWith(
        mockSandbox,
        'SBSEG-QBO-ENABLE-QL-FOR-IES',
      );
      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Evaluation result for feature flag - test-flag Result=true',
      );
    });
  });

  describe('combined parameters', () => {
    it('excludes PayrollFirst customers before evaluating the flag (checkIESMasterFlag is a no-op)', async () => {
      mockIsPayrollFirstCompany.mockReturnValue(true);
      // When FEATURE_FLAG_PAYROLL_FIRST_ENABLED returns false, shouldExcludePayrollFirst becomes true
      mockIsIXPFeatureFlagEnabled.mockResolvedValueOnce(false);

      const { result } = renderHook(() =>
        useIXPFeatureFlag({
          flagName: 'test-flag',
          excludePayrollFirst: true,
          checkIESMasterFlag: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(mockIsPayrollFirstCompany).toHaveBeenCalled();
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);
      expect(mockIsIESCustomer).not.toHaveBeenCalled();
      expect(mockSandbox.logger.log).toHaveBeenCalledWith(
        'Event=Feature flag test-flag disabled for PayrollFirst customer',
      );
    });

    it('evaluates the actual flag when PayrollFirst passes, ignoring checkIESMasterFlag', async () => {
      mockIsIESCustomer.mockResolvedValue(true);
      mockIsPayrollFirstCompany.mockReturnValue(false);
      mockIsIXPFeatureFlagEnabled
        .mockResolvedValueOnce(true) // PayrollFirst check
        .mockResolvedValueOnce(true); // actual flag check

      const { result } = renderHook(() =>
        useIXPFeatureFlag({
          flagName: 'test-flag',
          excludePayrollFirst: true,
          checkIESMasterFlag: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
      expect(mockIsPayrollFirstCompany).toHaveBeenCalled();
      expect(mockIsIESCustomer).not.toHaveBeenCalled();
      // PayrollFirst check + actual flag (no IES master flag call).
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(2);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        mockSandbox,
        'test-flag',
      );
    });
  });
});
