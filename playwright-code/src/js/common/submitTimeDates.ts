import dayjs, { Dayjs } from 'dayjs';

/**
 * Helpers for locking the calendar based on a worker's TSheets `submittedTo`
 * date. Product rule: a worker may not edit time on or before `submittedTo`,
 * so the first selectable calendar day is `submittedTo + 1 day`.
 *
 * Boundary semantics (intentional): the TSheets field is documented as an
 * *exclusive* end (`date < submittedTo`), but the agreed product behaviour for
 * this workstream is an *inclusive* lock (`date <= submittedTo`) — the
 * `submittedTo` day itself is not editable. The client is therefore one day
 * stricter than the raw field, which is safe: it only ever blocks more than the
 * server would, never less. If a server-side check is later wired to the same
 * field, align it to this inclusive boundary to avoid an off-by-one drift.
 */

/**
 * First calendar date the worker may still edit.
 * Returns `undefined` when there is no submitted date (nothing to lock).
 */
export const getFirstUnsubmittedDate = (
  submittedTo?: string | null,
): Dayjs | undefined => {
  if (!submittedTo) return undefined;
  const parsed = dayjs(submittedTo);
  if (!parsed.isValid()) return undefined;
  return parsed.add(1, 'day').startOf('day');
};

/** Returns the later (more restrictive) of two optional min dates. */
export const pickLaterDate = (a?: Dayjs, b?: Dayjs): Dayjs | undefined => {
  if (!a) return b;
  if (!b) return a;
  return a.isAfter(b) ? a : b;
};
