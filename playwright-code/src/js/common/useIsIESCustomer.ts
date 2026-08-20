import { useEffect } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { VARIABILITY_DECISIONS } from 'src/js/common/constants';

/**
 * Resolves the IES check for the current company once on mount and exposes
 * the boolean result.
 *
 * Backed by the QbTime variability SDK (`sdk.evaluateDecision`) keyed by
 * `VARIABILITY_DECISIONS.IS_IES_COMPANY`. Fails closed — if the variability
 * call throws or returns no value, the company is treated as non-IES so we
 * don't accidentally unlock IES-only UI on error.
 */
export const useIsIESCustomer = (): { isIES: boolean; isLoading: boolean } => {
  const sandbox = useSandbox();
  const { data, error } = useQbTimeSdk<boolean, [string]>(
    (sdk) => sdk.evaluateDecision,
    {
      executeOnMount: true,
      args: [VARIABILITY_DECISIONS.IS_IES_COMPANY],
    },
  );

  useEffect(() => {
    if (data !== undefined) {
      sandbox.logger.log(`Event=IES check result - isIES: ${data}`);
    }
  }, [data, sandbox]);

  useEffect(() => {
    if (!error) return;
    sandbox.logger.logException('variability.is_ies_company.error', error, {
      event: 'variability.error',
      decision: VARIABILITY_DECISIONS.IS_IES_COMPANY,
      failClosed: true,
    });
  }, [error, sandbox]);

  // `useQbTimeSdk` reports `loading: false` until its first `execute` fires
  // (which only happens in a `useEffect` after the initial render). Derive
  // "settling" from the data/error state instead so first-render consumers
  // see `isLoading: true` and don't briefly flash non-IES UI to IES users.
  const isLoading = data === undefined && error === undefined;

  return { isIES: Boolean(data), isLoading };
};
