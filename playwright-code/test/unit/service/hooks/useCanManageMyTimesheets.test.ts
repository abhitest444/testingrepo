import { renderHook, act } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useGetQbTimeSdk } from 'src/js/service/hooks/useGetQbTimeSdk';
import { useCanManageMyTimesheets } from 'src/js/service/hooks/useCanManageMyTimesheets';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));
jest.mock('src/js/service/hooks/useGetQbTimeSdk', () => ({
  useGetQbTimeSdk: jest.fn(),
}));
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(),
}));

const mockUseSandbox = useSandbox as jest.MockedFunction<typeof useSandbox>;
const mockUseGetQbTimeSdk = useGetQbTimeSdk as jest.MockedFunction<
  typeof useGetQbTimeSdk
>;
const mockUseIXPFeatureFlag = useIXPFeatureFlag as jest.MockedFunction<
  typeof useIXPFeatureFlag
>;

const mockCanManageMyTimesheets = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

describe('useCanManageMyTimesheets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSandbox.mockReturnValue({ logger: mockLogger } as any);
    mockUseGetQbTimeSdk.mockReturnValue({
      permissions: { canManageMyTimesheets: mockCanManageMyTimesheets },
    } as any);
    // Default: permissions flag enabled and settled so the ACL check runs.
    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: true,
      isLoading: false,
      error: null,
      settled: true,
    } as any);
  });

  it('returns null before the permission resolves', () => {
    mockCanManageMyTimesheets.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCanManageMyTimesheets());

    expect(result.current).toBeNull();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Resolving canManageMyTimesheets permission'),
    );
  });

  it('returns true and skips the ACL check when the permissions flag is disabled', () => {
    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: false,
      error: null,
      settled: true,
    } as any);

    const { result } = renderHook(() => useCanManageMyTimesheets());

    expect(result.current).toBe(true);
    expect(mockCanManageMyTimesheets).not.toHaveBeenCalled();
  });

  it('returns null while the permissions flag is still loading', () => {
    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: true,
      error: null,
      settled: false,
    } as any);

    const { result } = renderHook(() => useCanManageMyTimesheets());

    expect(result.current).toBeNull();
    expect(mockCanManageMyTimesheets).not.toHaveBeenCalled();
  });

  it('returns true and logs when the permission resolves to true', async () => {
    mockCanManageMyTimesheets.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useCanManageMyTimesheets(),
    );
    await waitForNextUpdate();

    expect(result.current).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Resolved canManageMyTimesheets permission'),
      { canManageMyTimesheets: true },
    );
  });

  it('returns false when the permission resolves to false', async () => {
    mockCanManageMyTimesheets.mockResolvedValue(false);

    const { result, waitForNextUpdate } = renderHook(() =>
      useCanManageMyTimesheets(),
    );
    await waitForNextUpdate();

    expect(result.current).toBe(false);
  });

  it('returns false and logs the error message when the check throws an Error', async () => {
    mockCanManageMyTimesheets.mockRejectedValue(new Error('boom'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useCanManageMyTimesheets(),
    );
    await waitForNextUpdate();

    expect(result.current).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to resolve canManageMyTimesheets permission',
      ),
      { error: 'boom' },
    );
  });

  it('returns false and logs "Unknown error" when the check throws a non-Error', async () => {
    mockCanManageMyTimesheets.mockRejectedValue('string failure');

    const { result, waitForNextUpdate } = renderHook(() =>
      useCanManageMyTimesheets(),
    );
    await waitForNextUpdate();

    expect(result.current).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to resolve canManageMyTimesheets permission',
      ),
      { error: 'Unknown error' },
    );
  });

  it('does not update state after unmount when the success path resolves', async () => {
    let resolvePermission: (value: boolean) => void = () => {};
    mockCanManageMyTimesheets.mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolvePermission = resolve;
      }),
    );

    const { result, unmount } = renderHook(() => useCanManageMyTimesheets());
    unmount();

    await act(async () => {
      resolvePermission(true);
      await Promise.resolve();
    });

    expect(result.current).toBeNull();
  });

  it('does not update state after unmount when the error path rejects', async () => {
    let rejectPermission: (reason?: unknown) => void = () => {};
    mockCanManageMyTimesheets.mockReturnValue(
      new Promise<boolean>((_resolve, reject) => {
        rejectPermission = reject;
      }),
    );

    const { result, unmount } = renderHook(() => useCanManageMyTimesheets());
    unmount();

    await act(async () => {
      rejectPermission(new Error('late error'));
      await Promise.resolve();
    });

    expect(result.current).toBeNull();
  });
});
