import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { QbTimeSdkFactory } from '@work-timecapture/qbtime-sdk';
import { useIsIESCustomer } from 'src/js/common/useIsIESCustomer';
import { VARIABILITY_DECISIONS } from 'src/js/common/constants';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('@work-timecapture/qbtime-sdk', () => ({
  QbTimeSdkFactory: { create: jest.fn() },
}));

const mockUseSandbox = useSandbox as jest.MockedFunction<typeof useSandbox>;
const mockCreateSdk = QbTimeSdkFactory.create as jest.MockedFunction<
  typeof QbTimeSdkFactory.create
>;

const buildSandbox = () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    logException: jest.fn(),
  },
});

const installSdk = (evaluateDecision: jest.Mock) => {
  const sdk = { evaluateDecision } as any;
  mockCreateSdk.mockReturnValue(sdk);
  return sdk;
};

describe('useIsIESCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns isIES=false and isLoading=true on initial render', () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      installSdk(jest.fn(() => new Promise(() => {})));

      const { result } = renderHook(() => useIsIESCustomer());

      expect(result.current).toEqual({ isIES: false, isLoading: true });
    });
  });

  describe('successful resolution', () => {
    it('calls sdk.evaluateDecision with the IS_IES_COMPANY decision name on mount', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      const evaluateDecision = jest.fn().mockResolvedValue(true);
      installSdk(evaluateDecision);

      const { result } = renderHook(() => useIsIESCustomer());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(evaluateDecision).toHaveBeenCalledWith(
        VARIABILITY_DECISIONS.IS_IES_COMPANY,
      );
      expect(evaluateDecision).toHaveBeenCalledTimes(1);
    });

    it('sets isIES=true and isLoading=false when the decision resolves true', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      installSdk(jest.fn().mockResolvedValue(true));

      const { result } = renderHook(() => useIsIESCustomer());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({ isIES: true, isLoading: false });
      expect(sandbox.logger.log).toHaveBeenCalledWith(
        'Event=IES check result - isIES: true',
      );
    });

    it('sets isIES=false and isLoading=false when the decision resolves false', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      installSdk(jest.fn().mockResolvedValue(false));

      const { result } = renderHook(() => useIsIESCustomer());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({ isIES: false, isLoading: false });
      expect(sandbox.logger.log).toHaveBeenCalledWith(
        'Event=IES check result - isIES: false',
      );
    });
  });

  describe('error handling', () => {
    it('falls back to isIES=false and logs an exception when the SDK call rejects', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      const error = new Error('variability service unavailable');
      installSdk(jest.fn().mockRejectedValue(error));

      const { result } = renderHook(() => useIsIESCustomer());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({ isIES: false, isLoading: false });
      expect(sandbox.logger.logException).toHaveBeenCalledWith(
        'variability.is_ies_company.error',
        error,
        {
          event: 'variability.error',
          decision: VARIABILITY_DECISIONS.IS_IES_COMPANY,
          failClosed: true,
        },
      );
    });

    it('does not emit the success log when the SDK call rejects', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      installSdk(jest.fn().mockRejectedValue(new Error('boom')));

      const { result } = renderHook(() => useIsIESCustomer());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(sandbox.logger.log).not.toHaveBeenCalled();
    });
  });

  describe('mount lifecycle', () => {
    it('only invokes the SDK once across stable rerenders', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      const evaluateDecision = jest.fn().mockResolvedValue(true);
      installSdk(evaluateDecision);

      const { result, rerender } = renderHook(() => useIsIESCustomer());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender();
      rerender();

      expect(evaluateDecision).toHaveBeenCalledTimes(1);
    });
  });
});
