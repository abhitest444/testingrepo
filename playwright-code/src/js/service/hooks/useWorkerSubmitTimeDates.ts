import { useEffect, useMemo, useRef, useState } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { Dayjs } from 'dayjs';
import { getTSheetsCurrentUser } from 'src/js/service/rest/TSheetsApiClient';
import { getFirstUnsubmittedDate } from 'src/js/common/submitTimeDates';

export interface UseWorkerSubmitTimeDatesArgs {
  /** Caller-controlled gate (e.g. behind the Workforce check). */
  skip?: boolean;
}

export interface UseWorkerSubmitTimeDatesResult {
  submittedTo: string | null;
  /**
   * First selectable calendar date (`submittedTo + 1 day`), or `undefined` when
   * nothing is locked. Pass straight into a date picker's `minDate`.
   */
  minSelectableDate?: Dayjs;
  loading: boolean;
  error?: Error;
}

/**
 * Shared source of the current worker's TSheets submit-time dates.
 *
 * Reuses the existing TSheets REST surface (`GET /api/v1/current_user`) rather
 * than a dedicated GraphQL query. Fetches once per hook instance; mount it once
 * per widget (via SubmitTimeDatesProvider) so the call is made a single time and
 * shared with every consumer.
 *
 * The calendar lock keys purely on `submitted_to` per the product decision for
 * this workstream, so `approved_to` is intentionally not surfaced here (the
 * low-level client still maps it for other callers).
 */
export const useWorkerSubmitTimeDates = ({
  skip,
}: UseWorkerSubmitTimeDatesArgs = {}): UseWorkerSubmitTimeDatesResult => {
  const sandbox = useSandbox();
  const [submittedTo, setSubmittedTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (skip || hasFetchedRef.current) {
      return undefined;
    }
    hasFetchedRef.current = true;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const user = await getTSheetsCurrentUser(sandbox);
        if (!cancelled) {
          setSubmittedTo(user.submittedTo);
        }
      } catch (e) {
        // Allow a later re-render (e.g. reopening the widget) to retry instead
        // of the ref permanently pinning us to the failed state.
        hasFetchedRef.current = false;
        const err = e instanceof Error ? e : new Error(String(e));
        sandbox.logger.logException(
          'Component=useWorkerSubmitTimeDates Event=Failed to fetch submit-time dates',
          err,
        );
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [sandbox, skip]);

  const minSelectableDate = useMemo(
    () => getFirstUnsubmittedDate(submittedTo),
    [submittedTo],
  );

  return { submittedTo, minSelectableDate, loading, error };
};

export default useWorkerSubmitTimeDates;
