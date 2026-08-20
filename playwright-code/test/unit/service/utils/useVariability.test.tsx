import { buildSandbox } from '@payroll/quicksand';
import { useVariability } from 'src/js/service/utils/useVariability';
import { Sandbox } from 'src/js/common/sandbox';
import { renderHookWithQuicksandProvider } from '../../testUtils';

describe('useVariability', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = buildSandbox();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load initially', async () => {
    const { result } = renderHookWithQuicksandProvider(() =>
      useVariability({ decision: 'hasTimeTracking' }),
    );

    expect(result.current.loading).toBe(true);
  });

  it('should set data correctly when fetch is successful', async () => {
    sandbox.variability.fetchVariabilityDecision = jest
      .fn()
      .mockResolvedValue({ value: true });

    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
      () => useVariability({ decision: 'hasTimeTracking' }),
      sandbox,
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ value: true });
    expect(result.current.error).toBeUndefined();
  });

  it('should set error correctly when fetch fails', async () => {
    sandbox.variability.fetchVariabilityDecision = jest
      .fn()
      .mockRejectedValue(new Error());

    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
      () => useVariability({ decision: 'hasTimeTracking' }),
      sandbox,
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ value: false });
    expect(result.current.error).toEqual('An error occurred');
  });

  it('should handle fetch result with error property', async () => {
    const error = new Error('Fetch error');
    sandbox.variability.fetchVariabilityDecision = jest
      .fn()
      .mockResolvedValue({ error });

    const { result, waitForNextUpdate } = renderHookWithQuicksandProvider(
      () => useVariability({ decision: 'hasTimeTracking' }),
      sandbox,
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ value: false });
    expect(result.current.error).toEqual(error);
  });
});
