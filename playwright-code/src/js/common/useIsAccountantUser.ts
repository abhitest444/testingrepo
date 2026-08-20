import { useEffect, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { VARIABILITY_DECISIONS, ERROR_IDS } from 'src/js/common/constants';

/**
 * Resolves whether the current user is a QBOA accountant once on mount.
 *
 * Backed by the QbTime variability SDK (`sdk.evaluateDecision`) keyed by
 * `VARIABILITY_DECISIONS.IS_QBOA` (`isQBOAccountantAttached`). Fails closed —
 * if the variability call throws, returns no value, or is unavailable the user
 * is treated as non-accountant so `inServiceToType` falls back to
 * `CONTACT`-only filtering.
 *
 * `isLoading` is derived from `useQbTimeSdk`'s `loading` flag combined with a
 * "has-started" ref. `useQbTimeSdk` initialises `loading` to `false` before
 * its first `useEffect` fires, so using `loading` alone would briefly report
 * "not loading" on the very first render. The ref guards that window and also
 * prevents `isLoading` from staying `true` indefinitely if `evaluateDecision`
 * resolves to `undefined` at runtime (e.g. malformed variability response).
 */
export const useIsAccountantUser = (): {
  isAccountant: boolean;
  isLoading: boolean;
} => {
  const sandbox = useSandbox();
  const {
    data,
    loading: sdkLoading,
    error,
  } = useQbTimeSdk<boolean, [string]>((sdk) => sdk.evaluateDecision, {
    executeOnMount: true,
    args: [VARIABILITY_DECISIONS.IS_QBOA],
  });

  // Tracks whether the SDK call has ever transitioned to loading=true.
  // Required because useQbTimeSdk initialises loading=false — without this,
  // isLoading would briefly be false on the first render before the SDK
  // useEffect fires, potentially allowing downstream queries to start with
  // the wrong isAccountant value.
  const sdkStartedRef = useRef(false);
  if (sdkLoading) sdkStartedRef.current = true;

  // Loading until the SDK call has both started and completed.
  const isLoading = sdkLoading || !sdkStartedRef.current;

  // Explicit equality check: treats undefined (runtime edge-case where
  // evaluateDecision returns no value) and false identically — both are
  // non-accountant. This makes the fail-closed behaviour explicit rather
  // than relying on Boolean(undefined) === false as an implicit default.
  const isAccountant = data === true;

  useEffect(() => {
    if (!error) return;
    // Splunk event — queryable by `event=variability.is_qboa.failed` so failure
    // rate can be graphed on a dashboard without waiting for an alert to fire.
    sandbox.logger.warn(
      'Component=useIsAccountantUser Event=variability_evaluation_failed',
      {
        event: ERROR_IDS.VARIABILITY_IS_QBOA_FAILED,
        decision: VARIABILITY_DECISIONS.IS_QBOA,
        failClosed: true,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    );
    // Sentry exception — tagged with a stable error ID so it can be assigned
    // an alert threshold and correlated across sessions in the Sentry dashboard.
    sandbox.logger.logException(ERROR_IDS.VARIABILITY_IS_QBOA_FAILED, error, {
      event: 'variability.error',
      decision: VARIABILITY_DECISIONS.IS_QBOA,
      failClosed: true,
    });
  }, [error, sandbox]);

  return { isAccountant, isLoading };
};
