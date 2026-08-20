import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { Activity } from '@ids-ts/loader';
import { useIxpExperiment } from 'src/js/service/hooks/ixp/useIxpExperiment';
import { WEEKLY_IMPORT_PRICING_NAMESPACE } from 'src/js/common/ixpExperimentConfigs';
import {
  UxPreferenceKey,
  useUxPreferences,
} from 'src/js/service/utils/useUXPreferences';
import { WeeklyImportExperimentProvider } from './WeeklyImportExperimentContext';

interface WeeklyTimeEntryExperimentGateProps {
  // eslint-disable-next-line no-unused-vars
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
}

/** Max wait (ms) for IPS to hydrate before assuming "not yet seen". */
const IPS_INIT_TIMEOUT_MS = 1500;

const isManualBypass = (): boolean => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('manual') === 'true';
  } catch {
    return false;
  }
};

/**
 * Experiment gate for weekly timesheet widgets.
 *
 * Checks IXP experiment 602269 (TIME-AGENT-IMPORT-WEEKLY-TIMESHEET-PRICING-TEST).
 * The config treatmentKey is set to the CONTROL key, so:
 *   - isInTreatment=true  -> user is in CONTROL -> render children (normal weekly timesheet)
 *   - isInTreatment=false -> user is in a pricing treatment -> redirect to time-agent import
 *     the FIRST time only; subsequent visits show the children with the
 *     "Import time with AI" CTA so the user can opt back in voluntarily.
 *   - isInTreatment=false + ?manual=true -> show weekly timesheet with import CTA
 *
 * The "redirect once" behavior is persisted via IPS user preference
 * `timeagent.weeklyRedirect.shown`.
 */
export const WeeklyTimeEntryExperimentGate: React.FC<
  WeeklyTimeEntryExperimentGateProps
> = ({ setOpen, children }) => {
  const sandbox = useSandbox();
  const hasRedirected = useRef(false);
  const manual = useMemo(() => isManualBypass(), []);

  const { isInTreatment, treatmentKey, settled } = useIxpExperiment(sandbox, {
    experimentNamespace: WEEKLY_IMPORT_PRICING_NAMESPACE,
    namespace: 'timecapture-timeentries-ui',
    businessUnit: 'SBSEG',
  });

  const isInPricingTreatment = settled && !isInTreatment && !!treatmentKey;

  // IPS-backed "have we redirected this user before?" check.
  const {
    data: prefData,
    getPreference: getUxPreference,
    setPreference: setUxPreference,
    initialized: prefsInitialized,
  } = useUxPreferences();
  const [prefsTimedOut, setPrefsTimedOut] = useState(false);
  // Tracks whether we've actually awaited the redirect-shown read.
  // `prefsInitialized` only means the store is built; the key-specific
  // value is hydrated asynchronously by `getPreference`. Without this
  // flag the gate would race the read and redirect on every refresh.
  const [redirectKeyLoaded, setRedirectKeyLoaded] = useState(false);

  // Read the redirect-shown pref once IPS is ready. The pref's default is
  // `false` so an unset preference behaves as "never redirected yet".
  useEffect(() => {
    if (!prefsInitialized) return;
    let cancelled = false;
    getUxPreference(UxPreferenceKey.WEEKLY_REDIRECT_SHOWN).finally(() => {
      if (!cancelled) setRedirectKeyLoaded(true);
    });
    // eslint-disable-next-line consistent-return
    return () => {
      cancelled = true;
    };
  }, [prefsInitialized, getUxPreference]);

  // Cap how long we hold the spinner waiting for IPS — never block the UI
  // forever on a slow preference service. Falls through as "not seen" on
  // timeout, which is the same as a fresh user. Covers both the
  // store-init phase and the key-read phase.
  useEffect(() => {
    if (prefsInitialized && redirectKeyLoaded) return undefined;
    const t = setTimeout(() => setPrefsTimedOut(true), IPS_INIT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [prefsInitialized, redirectKeyLoaded]);

  const redirectShown = !!prefData[UxPreferenceKey.WEEKLY_REDIRECT_SHOWN];
  const prefsReady = (prefsInitialized && redirectKeyLoaded) || prefsTimedOut;
  const shouldRedirect =
    isInPricingTreatment && !manual && prefsReady && !redirectShown;

  useEffect(() => {
    if (shouldRedirect && !hasRedirected.current) {
      hasRedirected.current = true;
      sandbox.logger.log(
        `WeeklyTimeEntry: Redirecting to time-agent import (treatment=${treatmentKey})`,
      );
      // Mark this user as having seen the redirect before we navigate so the
      // next visit falls through to the CTA path. Fire-and-forget — failures
      // are non-fatal and just mean we'll redirect once more next session.
      setUxPreference(UxPreferenceKey.WEEKLY_REDIRECT_SHOWN, true).catch(
        (err: unknown) => {
          sandbox.logger.warn(
            'WeeklyTimeEntry: failed to persist weekly-redirect pref',
            { error: err },
          );
        },
      );
      sandbox.navigation.navigate(
        `app/time-agent-ui-plugin/timeagent?from=payroll_weekly_timesheet&treatment=${encodeURIComponent(
          treatmentKey!,
        )}`,
      );
      setOpen(false);
    }
  }, [shouldRedirect, treatmentKey, sandbox, setOpen, setUxPreference]);

  // Still measuring: hold the spinner until IXP settles. For CONTROL users
  // we don't need the IPS pref at all (no redirect ever happens), so we
  // only block on IPS when we're actually in a pricing treatment.
  if (!settled) {
    return <Activity shape="dots" />;
  }
  if (isInPricingTreatment && !prefsReady) {
    return <Activity shape="dots" />;
  }

  // While the navigate() call is in flight, keep the spinner up — returning
  // null left the panel blank if navigation was async.
  if (shouldRedirect) {
    return <Activity shape="dots" />;
  }

  // Pricing treatment + already-redirected (or manual bypass): render the
  // normal timesheet and show the "Import time with AI" CTA so the user
  // can opt back in voluntarily.
  const showImportCTA = isInPricingTreatment && (manual || redirectShown);

  return (
    <WeeklyImportExperimentProvider
      showImportCTA={showImportCTA}
      treatmentKey={treatmentKey}
    >
      {children}
    </WeeklyImportExperimentProvider>
  );
};
