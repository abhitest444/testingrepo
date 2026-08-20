import { renderHook } from '@testing-library/react-hooks';
import { useBreakEntryTrackingPoints } from 'src/js/widgets/breaks/features/break-entries/hooks/useBreakEntryTrackingPoints';
import {
  BREAKS_TRACKING_POINTS,
  WFS_BREAKS_TRACKING_POINTS,
} from 'src/js/widgets/breaks/constants';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({
    appContext: {
      getAppInfo: jest.fn().mockReturnValue({
        appId: 'qbo-web-app',
      }),
    },
  })),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

describe('useBreakEntryTrackingPoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return QBO tracking points when not in workforce environment', () => {
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useBreakEntryTrackingPoints());

    expect(isWorkforceEnvironment).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(BREAKS_TRACKING_POINTS);
  });

  it('should return WFS tracking points when in workforce environment', () => {
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useBreakEntryTrackingPoints());

    expect(isWorkforceEnvironment).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(WFS_BREAKS_TRACKING_POINTS);
  });

  it('should memoize tracking points and not recalculate on re-render with same isWorkforce value', () => {
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);

    const { result, rerender } = renderHook(() =>
      useBreakEntryTrackingPoints(),
    );

    const firstResult = result.current;

    // Rerender the hook
    rerender();

    // Should return the same memoized value
    expect(result.current).toBe(firstResult);
    expect(result.current).toBe(BREAKS_TRACKING_POINTS);
  });

  it('should recalculate tracking points when isWorkforce changes', () => {
    // Start with QBO environment
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);

    const { result, rerender } = renderHook(() =>
      useBreakEntryTrackingPoints(),
    );

    expect(result.current).toBe(BREAKS_TRACKING_POINTS);

    // Change to workforce environment
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

    rerender();

    // Should return WFS tracking points
    expect(result.current).toBe(WFS_BREAKS_TRACKING_POINTS);
  });

  it('should return different tracking point objects for QBO vs WFS', () => {
    // Get QBO points
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
    const { result: qboResult } = renderHook(() =>
      useBreakEntryTrackingPoints(),
    );

    // Get WFS points
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
    const { result: wfsResult } = renderHook(() =>
      useBreakEntryTrackingPoints(),
    );

    expect(qboResult.current).not.toBe(wfsResult.current);
  });
});
