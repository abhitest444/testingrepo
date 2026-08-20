import React, { createContext, useContext, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { Dayjs } from 'dayjs';
import { useIsSubmitTimeEnabled } from 'src/js/service/hooks/useIsSubmitTimeEnabled';
import { useWorkerSubmitTimeDates } from 'src/js/service/hooks/useWorkerSubmitTimeDates';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

export interface SubmitTimeDatesContextValue {
  /** First calendar date the worker may still edit (`submittedTo + 1 day`). */
  minSelectableDate?: Dayjs;
  isSubmitTimeEnabled: boolean;
  submittedTo: string | null;
  loading: boolean;
  /**
   * Set when the submit-time fetch failed. Exposed for observability/logging.
   * By design the calendar consumers (Date, WeekNavigator, ClockInFooterButton)
   * do NOT block on `error` — they fail open and rely on server-side rejection
   * of submitted days, so a transient current_user failure never locks a worker
   * out of an otherwise-editable day.
   */
  error?: Error;
}

const DEFAULT_VALUE: SubmitTimeDatesContextValue = {
  minSelectableDate: undefined,
  isSubmitTimeEnabled: false,
  submittedTo: null,
  loading: false,
  error: undefined,
};

const SubmitTimeDatesContext =
  createContext<SubmitTimeDatesContextValue>(DEFAULT_VALUE);

/**
 * Reads the shared submit-time lock. Safe to call anywhere — returns a no-op
 * default (no min date) when no provider is mounted above, so shared date
 * components stay unaffected in trees that don't opt in.
 */
export const useSubmitTimeDatesContext = (): SubmitTimeDatesContextValue =>
  useContext(SubmitTimeDatesContext);

export interface SubmitTimeDatesProviderProps {
  /** Gate the fetch (combined with the Workforce check below). */
  skip?: boolean;
  children: React.ReactNode;
}

/**
 * Inner provider mounted only once we know we're in Workforce. Evaluates the
 * submit-time SDK capability and, when it's on, fetches the worker's
 * submit-time dates and shares the derived calendar lock with descendants.
 */
const WorkforceSubmitTimeDatesProvider: React.FC<
  SubmitTimeDatesProviderProps
> = ({ skip, children }) => {
  const isSubmitTimeEnabled = useIsSubmitTimeEnabled() === true;

  // Both gates are required: Workforce (established by the outer provider) AND
  // submit-time capability. While it is still resolving, `isSubmitTimeEnabled`
  // remains false, so the fetch is skipped until it settles on.
  const { minSelectableDate, submittedTo, loading, error } =
    useWorkerSubmitTimeDates({
      skip: skip || !isSubmitTimeEnabled,
    });

  const value = useMemo<SubmitTimeDatesContextValue>(
    () => ({
      minSelectableDate,
      isSubmitTimeEnabled,
      submittedTo,
      loading,
      error,
    }),
    [minSelectableDate, isSubmitTimeEnabled, submittedTo, loading, error],
  );

  return (
    <SubmitTimeDatesContext.Provider value={value}>
      {children}
    </SubmitTimeDatesContext.Provider>
  );
};

/**
 * Fetches the current worker's submit-time dates once (via the existing TSheets
 * REST hook) and shares the derived calendar lock with descendants. Mount one
 * per widget; the shared `Date` component reads `minSelectableDate` from here
 * automatically.
 *
 * Gated by TWO checks, both required:
 *   1. Workforce environment — evaluated here first, so outside Workforce we
 *      render children with the no-op default context and make zero extra calls
 *      (neither submit-time capability evaluation nor the current_user fetch
 *      run).
 *   2. Submit-time capability from `SubmitTimeService.isSubmitTimeEnabled` —
 *      evaluated by the inner provider only within Workforce.
 *
 * As a result QBO (and any non-Workforce) surfaces are completely unaffected.
 */
export const SubmitTimeDatesProvider: React.FC<
  SubmitTimeDatesProviderProps
> = ({ skip, children }) => {
  const sandbox = useSandbox();
  const isWorkforce = isWorkforceEnvironment(sandbox);

  // Outside Workforce: no provider, no flag check, no fetch — consumers fall
  // back to the no-op default context (no lock applied).
  if (!isWorkforce) {
    return <>{children}</>;
  }

  return (
    <WorkforceSubmitTimeDatesProvider skip={skip}>
      {children}
    </WorkforceSubmitTimeDatesProvider>
  );
};

export default SubmitTimeDatesProvider;
