import { buildSandbox } from '@payroll/quicksand';
import { UserProfileInfo } from '@appfabric/sandbox-spec/lib/core/SandboxAppContext';
import { Sandbox } from 'src/js/common/sandbox';
import { useGetUserInfo } from 'src/js/service/utils/useGetUserInfo';
import { renderHookWithQuicksandProvider } from '../../testUtils';

describe('useGetUserInfo', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = buildSandbox();
    jest.spyOn(sandbox.appContext, 'getUserProfile').mockResolvedValue({
      name: 'John Doe',
      email: 'john.doe@example.com',
    } as unknown as UserProfileInfo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading as true initially', () => {
    const { result } = renderHookWithQuicksandProvider(
      () => useGetUserInfo(),
      sandbox,
    );
    expect(result.current.loading).toBe(true);
  });

  it('should return user info after fetching data', async () => {
    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
      () => useGetUserInfo(),
      sandbox,
    );

    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual({
      name: 'John Doe',
      email: 'john.doe@example.com',
    });
  });

  it('should handle error during data fetching', async () => {
    jest
      .spyOn(sandbox.appContext, 'getUserProfile')
      .mockRejectedValue('Error fetching user info');
    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
      () => useGetUserInfo(),
      sandbox,
    );

    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Error fetching user info');
    expect(result.current.data).toBeUndefined();
  });

  it('should not fetch user info when skip is true', () => {
    const getUserProfileSpy = jest.spyOn(sandbox.appContext, 'getUserProfile');
    const { result } = renderHookWithQuicksandProvider(
      () => useGetUserInfo(true),
      sandbox,
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(getUserProfileSpy).not.toHaveBeenCalled();
  });

  it('should fetch user info when skip is false', async () => {
    const getUserProfileSpy = jest.spyOn(sandbox.appContext, 'getUserProfile');
    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
      () => useGetUserInfo(false),
      sandbox,
    );

    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({
      name: 'John Doe',
      email: 'john.doe@example.com',
    });
    expect(getUserProfileSpy).toHaveBeenCalledTimes(1);
  });

  it('should use default value (false) for skip parameter when not provided', async () => {
    const getUserProfileSpy = jest.spyOn(sandbox.appContext, 'getUserProfile');
    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
      () => useGetUserInfo(),
      sandbox,
    );

    await waitForNextUpdate();
    expect(getUserProfileSpy).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeDefined();
  });
});
