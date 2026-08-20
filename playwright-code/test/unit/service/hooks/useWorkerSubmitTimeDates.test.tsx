// @ts-nocheck
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useWorkerSubmitTimeDates } from 'src/js/service/hooks/useWorkerSubmitTimeDates';

const mockLogException = jest.fn();
const STABLE_SANDBOX = { logger: { logException: mockLogException } };
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: () => STABLE_SANDBOX,
}));

const mockGetTSheetsCurrentUser = jest.fn();
jest.mock('src/js/service/rest/TSheetsApiClient', () => ({
  getTSheetsCurrentUser: (...args: unknown[]) =>
    mockGetTSheetsCurrentUser(...args),
}));

describe('useWorkerSubmitTimeDates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads current_user and derives minSelectableDate (submittedTo + 1 day)', async () => {
    mockGetTSheetsCurrentUser.mockResolvedValue({
      id: 1,
      submittedTo: '2026-06-15',
      approvedTo: '2026-06-10',
    });

    const { result } = renderHook(() => useWorkerSubmitTimeDates());

    await waitFor(() => {
      expect(result.current.submittedTo).toBe('2026-06-15');
    });

    expect(mockGetTSheetsCurrentUser).toHaveBeenCalledWith(STABLE_SANDBOX);
    expect(result.current.minSelectableDate?.format('YYYY-MM-DD')).toBe(
      '2026-06-16',
    );
  });

  it('does not call the API when skipped', () => {
    renderHook(() => useWorkerSubmitTimeDates({ skip: true }));
    expect(mockGetTSheetsCurrentUser).not.toHaveBeenCalled();
  });

  it('returns nulls and no min date when there is no submitted date', async () => {
    mockGetTSheetsCurrentUser.mockResolvedValue({
      id: 1,
      submittedTo: null,
      approvedTo: null,
    });

    const { result } = renderHook(() => useWorkerSubmitTimeDates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockGetTSheetsCurrentUser).toHaveBeenCalled();
    expect(result.current.submittedTo).toBeNull();
    expect(result.current.minSelectableDate).toBeUndefined();
  });

  it('captures and logs an error from a failed request', async () => {
    mockGetTSheetsCurrentUser.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useWorkerSubmitTimeDates());

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    expect(result.current.loading).toBe(false);
    expect(mockLogException).toHaveBeenCalledWith(
      expect.stringContaining('Failed to fetch submit-time dates'),
      expect.any(Error),
    );
  });

  it('wraps a non-Error rejection in an Error before surfacing it', async () => {
    mockGetTSheetsCurrentUser.mockRejectedValue('string failure');

    const { result } = renderHook(() => useWorkerSubmitTimeDates());

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });
    expect(result.current.error?.message).toBe('string failure');
  });

  it('retries on a later effect run after a failed fetch (ref is reset)', async () => {
    mockGetTSheetsCurrentUser.mockRejectedValue(new Error('boom'));

    const { rerender } = renderHook(
      ({ skip }) => useWorkerSubmitTimeDates({ skip }),
      { initialProps: { skip: false } },
    );

    await waitFor(() => {
      expect(mockGetTSheetsCurrentUser).toHaveBeenCalledTimes(1);
    });

    // Toggling skip re-runs the effect; because the ref was reset in the catch,
    // the failed fetch is retried instead of being permanently blocked.
    rerender({ skip: true });
    rerender({ skip: false });

    await waitFor(() => {
      expect(mockGetTSheetsCurrentUser).toHaveBeenCalledTimes(2);
    });
  });
});
