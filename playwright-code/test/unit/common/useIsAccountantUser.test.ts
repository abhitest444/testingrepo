import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { QbTimeSdkFactory } from '@work-timecapture/qbtime-sdk';
import { useIsAccountantUser } from 'src/js/common/useIsAccountantUser';
import { VARIABILITY_DECISIONS, ERROR_IDS } from 'src/js/common/constants';

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
    warn: jest.fn(),
    logException: jest.fn(),
  },
});

const installSdk = (evaluateDecision: jest.Mock) => {
  const sdk = { evaluateDecision } as any;
  mockCreateSdk.mockReturnValue(sdk);
  return sdk;
};

describe('useIsAccountantUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns isAccountant=false and isLoading=true on initial render', () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      installSdk(jest.fn(() => new Promise(() => {})));

      const { result } = renderHook(() => useIsAccountantUser());

      expect(result.current).toEqual({ isAccountant: false, isLoading: true });
    });

    it('reports isLoading=true on the very first render before the SDK useEffect fires (useRef guard)', () => {
      // useQbTimeSdk initialises with loading=false before its own useEffect
      // fires and transitions sdkLoading to true. Without the sdkStartedRef guard
      // the hook would expose isLoading=false on that first render, allowing
      // consumers to see an apparently-resolved (isAccountant=false) state before
      // the SDK has made any call — causing incorrect user-type context on first load.
      //
      // result.all[0] is the hook's return value from the very first synchronous
      // render, captured before act() flushes the SDK's useEffect. At that point
      // sdkLoading===false; only the sdkStartedRef guard can make isLoading===true.
      // If someone replaces the ref with a bare sdkLoading check this test fails.
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      installSdk(jest.fn(() => new Promise(() => {})));

      const { result } = renderHook(() => useIsAccountantUser());

      const firstRenderState = result.all[0] as {
        isAccountant: boolean;
        isLoading: boolean;
      };
      expect(firstRenderState.isLoading).toBe(true);
    });
  });

  describe('successful resolution', () => {
    it('calls sdk.evaluateDecision with IS_QBOA decision name on mount', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      const evaluateDecision = jest.fn().mockResolvedValue(true);
      installSdk(evaluateDecision);

      const { result } = renderHook(() => useIsAccountantUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(evaluateDecision).toHaveBeenCalledWith(
        VARIABILITY_DECISIONS.IS_QBOA,
      );
      expect(evaluateDecision).toHaveBeenCalledTimes(1);
    });

    it('sets isAccountant=true and isLoading=false when decision resolves true', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      installSdk(jest.fn().mockResolvedValue(true));

      const { result } = renderHook(() => useIsAccountantUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({ isAccountant: true, isLoading: false });
    });

    it('sets isAccountant=false and isLoading=false when decision resolves false', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      installSdk(jest.fn().mockResolvedValue(false));

      const { result } = renderHook(() => useIsAccountantUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({ isAccountant: false, isLoading: false });
    });

    it('treats undefined resolution as non-accountant (fail-closed)', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      installSdk(jest.fn().mockResolvedValue(undefined));

      const { result } = renderHook(() => useIsAccountantUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAccountant).toBe(false);
    });
  });

  describe('error handling', () => {
    it('falls back to isAccountant=false and logs exception when SDK rejects', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      const error = new Error('variability service unavailable');
      installSdk(jest.fn().mockRejectedValue(error));

      const { result } = renderHook(() => useIsAccountantUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toEqual({
        isAccountant: false,
        isLoading: false,
      });

      // Splunk event — emitted first so failure rate can be tracked proactively
      // on a dashboard without waiting for a Sentry alert to fire.
      expect(sandbox.logger.warn).toHaveBeenCalledWith(
        'Component=useIsAccountantUser Event=variability_evaluation_failed',
        expect.objectContaining({
          event: ERROR_IDS.VARIABILITY_IS_QBOA_FAILED,
          decision: VARIABILITY_DECISIONS.IS_QBOA,
          failClosed: true,
          errorMessage: error.message,
        }),
      );

      // Sentry exception — tagged with stable error ID for alert thresholds
      // and cross-session correlation in the Sentry dashboard.
      expect(sandbox.logger.logException).toHaveBeenCalledWith(
        ERROR_IDS.VARIABILITY_IS_QBOA_FAILED,
        error,
        {
          event: 'variability.error',
          decision: VARIABILITY_DECISIONS.IS_QBOA,
          failClosed: true,
        },
      );
    });
  });

  describe('mount lifecycle', () => {
    it('only invokes the SDK once across stable rerenders', async () => {
      const sandbox = buildSandbox();
      mockUseSandbox.mockReturnValue(sandbox as any);
      const evaluateDecision = jest.fn().mockResolvedValue(true);
      installSdk(evaluateDecision);

      const { result, rerender } = renderHook(() => useIsAccountantUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender();
      rerender();

      expect(evaluateDecision).toHaveBeenCalledTimes(1);
    });
  });
});
