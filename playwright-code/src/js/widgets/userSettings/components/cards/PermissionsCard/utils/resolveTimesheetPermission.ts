/** Company SDK grant locks the row on; when off, use the per-worker permissions API value. */
export const resolveTimesheetPermission = (
  companySdkEnabled: boolean,
  workerApiValue: boolean,
): boolean => (companySdkEnabled ? true : workerApiValue);

/** True when a company-level SDK grant owns the row (checkbox locked). */
export const isLockedByCompanySdk = (companySdkEnabled: boolean): boolean =>
  companySdkEnabled;
