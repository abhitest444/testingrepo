import { renderHook } from '@testing-library/react-hooks';
import { useTimeClockTrackingPoints } from 'src/js/widgets/timeClock/hooks/useTimeClockTrackingPoints';
import { getTimeClockTrackingPoints } from 'src/js/common/useClickTracking';
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

jest.mock('src/js/common/useClickTracking', () => ({
  getTimeClockTrackingPoints: jest.fn(),
}));

describe('useTimeClockTrackingPoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return QBO tracking points when not in workforce environment', () => {
    const mockTrackingPoints = {
      ON_MOUNT: { scope: 'time' },
      CLOCK_IN: { scope: 'time_clock' },
    };

    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
    (getTimeClockTrackingPoints as jest.Mock).mockReturnValue(
      mockTrackingPoints,
    );

    const { result } = renderHook(() => useTimeClockTrackingPoints());

    expect(isWorkforceEnvironment).toHaveBeenCalledTimes(1);
    expect(getTimeClockTrackingPoints).toHaveBeenCalledWith({
      isWorkforce: false,
    });
    expect(result.current).toBe(mockTrackingPoints);
  });

  it('should return WFS tracking points when in workforce environment', () => {
    const mockWFSTrackingPoints = {
      ON_MOUNT: { scope: 'time_clock', scope_area: 'workforce' },
      CLOCK_IN: { scope: 'time_clock', scope_area: 'workforce' },
    };

    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
    (getTimeClockTrackingPoints as jest.Mock).mockReturnValue(
      mockWFSTrackingPoints,
    );

    const { result } = renderHook(() => useTimeClockTrackingPoints());

    expect(isWorkforceEnvironment).toHaveBeenCalledTimes(1);
    expect(getTimeClockTrackingPoints).toHaveBeenCalledWith({
      isWorkforce: true,
    });
    expect(result.current).toBe(mockWFSTrackingPoints);
  });

  it('should memoize tracking points and not recalculate on re-render with same isWorkforce value', () => {
    const mockTrackingPoints = {
      ON_MOUNT: { scope: 'time' },
    };

    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
    (getTimeClockTrackingPoints as jest.Mock).mockReturnValue(
      mockTrackingPoints,
    );

    const { result, rerender } = renderHook(() => useTimeClockTrackingPoints());

    const firstResult = result.current;

    // Clear mocks to verify no additional calls
    (getTimeClockTrackingPoints as jest.Mock).mockClear();

    // Rerender the hook
    rerender();

    // Should return the same memoized value
    expect(result.current).toBe(firstResult);
    expect(getTimeClockTrackingPoints).not.toHaveBeenCalled();
  });

  it('should recalculate tracking points when isWorkforce changes', () => {
    const mockQBOTrackingPoints = {
      ON_MOUNT: { scope: 'time' },
    };
    const mockWFSTrackingPoints = {
      ON_MOUNT: { scope: 'time_clock', scope_area: 'workforce' },
    };

    // Start with QBO environment
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
    (getTimeClockTrackingPoints as jest.Mock).mockReturnValue(
      mockQBOTrackingPoints,
    );

    const { result, rerender } = renderHook(() => useTimeClockTrackingPoints());

    expect(result.current).toBe(mockQBOTrackingPoints);

    // Change to workforce environment
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
    (getTimeClockTrackingPoints as jest.Mock).mockReturnValue(
      mockWFSTrackingPoints,
    );

    rerender();

    // Should call getTimeClockTrackingPoints again with new value
    expect(getTimeClockTrackingPoints).toHaveBeenCalledWith({
      isWorkforce: true,
    });
    expect(result.current).toBe(mockWFSTrackingPoints);
  });
});
