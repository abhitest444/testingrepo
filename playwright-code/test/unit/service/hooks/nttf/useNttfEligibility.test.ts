import { renderHook, act } from '@testing-library/react-hooks';

import { useNttfEligibility } from 'src/js/service/hooks/nttf/useNttfEligibility';

// Mock execute function and logger
let mockExecute = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: () => ({
    execute: mockExecute,
  }),
}));

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({
    logger: mockLogger,
  })),
}));

describe('useNttfEligibility', () => {
  beforeEach(() => {
    mockExecute = jest.fn();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.debug.mockClear();
  });

  test('starts with loading true and isNttfEligible false', () => {
    const { result } = renderHook(() => useNttfEligibility());

    expect(result.current.isNttfEligible).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  test('returns true when SDK resolves with true', async () => {
    mockExecute.mockResolvedValueOnce(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useNttfEligibility(),
    );

    await waitForNextUpdate();

    expect(result.current.isNttfEligible).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  test('returns false when SDK resolves with false', async () => {
    mockExecute.mockResolvedValueOnce(false);

    const { result, waitForNextUpdate } = renderHook(() =>
      useNttfEligibility(),
    );

    await waitForNextUpdate();

    expect(result.current.isNttfEligible).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  test('returns false when SDK rejects with error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('Network error'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useNttfEligibility(),
    );

    await waitForNextUpdate();

    expect(result.current.isNttfEligible).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  test('returns false when SDK resolves with undefined', async () => {
    mockExecute.mockResolvedValueOnce(undefined);

    const { result, waitForNextUpdate } = renderHook(() =>
      useNttfEligibility(),
    );

    await waitForNextUpdate();

    expect(result.current.isNttfEligible).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  test('refetch function calls execute again', async () => {
    mockExecute.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useNttfEligibility(),
    );

    await waitForNextUpdate();

    expect(mockExecute).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  test('logs error messages when SDK fails', async () => {
    const errorMessage = 'Network timeout';
    mockExecute.mockRejectedValueOnce(new Error(errorMessage));

    const { waitForNextUpdate } = renderHook(() => useNttfEligibility());

    await waitForNextUpdate();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'useNttfEligibility: NTTF eligibility check failed',
      {
        error: errorMessage,
      },
    );
  });
});
