import { renderHook } from '@testing-library/react-hooks';
import { useCurrentWorker } from 'src/js/widgets/timeProject/hooks/useCurrentWorker';

const mockGetWorkerById = jest.fn();
const mockGetUserAuthInfo = jest.fn();
const mockError = jest.fn();

// STABLE sandbox reference across renders — `resolve` depends on `sandbox`,
// so a fresh object each render would re-fire the mount effect forever (OOM).
jest.mock('@payroll/quicksand', () => {
  const sandbox = {
    appContext: { getUserAuthInfo: () => mockGetUserAuthInfo() },
  };
  return { useSandbox: () => sandbox };
});

jest.mock('src/js/service/hooks/employee/useLazyGetTSheetsWorkerById', () => ({
  useLazyGetTSheetsWorkerById: () => ({ query: mockGetWorkerById }),
}));

// IMPORTANT: return a STABLE logger object across renders. `useCurrentWorker`'s
// `resolve` callback depends on `logger`; a fresh object each render would
// recreate `resolve`, re-fire the mount effect, and loop forever (OOM).
jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => {
  const logger = { error: (...a: any[]) => mockError(...a), info: () => {} };
  return { __esModule: true, useTimeProjectLogger: () => logger };
});

const employeeResult = {
  data: {
    timeTrackingWorkerById: {
      employeeId: '6',
      vendorId: null,
      isEmployee: true,
      isVendor: false,
    },
  },
};

// Render and wait until the hook has finished resolving (ready === true).
const renderResolved = async (workerIdProp?: string | null) => {
  const hook = renderHook(() => useCurrentWorker(workerIdProp));
  await hook.waitFor(() => hook.result.current.ready === true);
  return hook;
};

describe('useCurrentWorker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserAuthInfo.mockReturnValue({ authId: 'auth-123' });
  });

  it('resolves employee worker id + type from the auth id', async () => {
    mockGetWorkerById.mockResolvedValueOnce(employeeResult);
    const { result } = await renderResolved();

    expect(mockGetWorkerById).toHaveBeenCalledWith({
      variables: { id: 'auth-123' },
    });
    expect(result.current.workerId).toBe('6');
    expect(result.current.workerType).toBe('EMPLOYEE');
    expect(result.current.ready).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('resolves vendor type and vendor id', async () => {
    mockGetWorkerById.mockResolvedValueOnce({
      data: {
        timeTrackingWorkerById: {
          employeeId: null,
          vendorId: 'v-9',
          isEmployee: false,
          isVendor: true,
        },
      },
    });
    const { result } = await renderResolved();

    expect(result.current.workerId).toBe('v-9');
    expect(result.current.workerType).toBe('VENDOR');
  });

  it('prefers the shell-provided workerId prop over the resolved id', async () => {
    mockGetWorkerById.mockResolvedValueOnce(employeeResult);
    const { result } = await renderResolved('prop-99');

    expect(result.current.workerId).toBe('prop-99');
    // Type still comes from the resolution.
    expect(result.current.workerType).toBe('EMPLOYEE');
  });

  it('falls back to the prop when there is no auth id (no API call)', async () => {
    mockGetUserAuthInfo.mockReturnValue(null);
    const { result } = await renderResolved('prop-7');

    expect(mockGetWorkerById).not.toHaveBeenCalled();
    expect(result.current.workerId).toBe('prop-7');
    expect(result.current.workerType).toBeNull();
  });

  it('resolves QBO-only user with profileId and LEGACY_QBO_USER type', async () => {
    mockGetWorkerById.mockResolvedValueOnce({
      data: {
        timeTrackingWorkerById: {
          employeeId: null,
          vendorId: null,
          profileId: '9341455842075210',
          isEmployee: false,
          isVendor: false,
          isQboUser: true,
        },
      },
    });
    const { result } = await renderResolved();

    expect(result.current.workerId).toBe('9341455842075210');
    expect(result.current.workerType).toBe('LEGACY_QBO_USER');
  });

  it('prefers shell prop over profileId for QBO-only user', async () => {
    mockGetWorkerById.mockResolvedValueOnce({
      data: {
        timeTrackingWorkerById: {
          employeeId: null,
          vendorId: null,
          profileId: '9341455842075210',
          isEmployee: false,
          isVendor: false,
          isQboUser: true,
        },
      },
    });
    const { result } = await renderResolved('shell-id-42');

    expect(result.current.workerId).toBe('shell-id-42');
    expect(result.current.workerType).toBe('LEGACY_QBO_USER');
  });

  it('falls back to the prop when the worker lookup returns no data', async () => {
    mockGetWorkerById.mockResolvedValueOnce({ data: {} });
    const { result } = await renderResolved('prop-3');

    expect(result.current.workerId).toBe('prop-3');
    expect(result.current.workerType).toBeNull();
  });

  it('logs and falls back to the prop when the lookup throws', async () => {
    mockGetWorkerById.mockRejectedValueOnce(new Error('boom'));
    const { result } = await renderResolved('prop-5');

    expect(mockError).toHaveBeenCalled();
    expect(result.current.workerId).toBe('prop-5');
    expect(result.current.ready).toBe(true);
  });
});
