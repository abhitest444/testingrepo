import { renderHook } from '@testing-library/react-hooks';
import { useLandingPageTrackingPoints } from 'src/js/widgets/timeProject/hooks/useLandingPageTrackingPoints';
import {
  LANDING_PAGE_TRACKING_POINTS,
  WFS_LANDING_PAGE_TRACKING_POINTS,
} from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

const mockIsWorkforceEnvironment =
  isWorkforceEnvironment as jest.MockedFunction<typeof isWorkforceEnvironment>;

describe('useLandingPageTrackingPoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return QBO tracking points when not in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    const { result } = renderHook(() => useLandingPageTrackingPoints());

    expect(result.current).toBe(LANDING_PAGE_TRACKING_POINTS);
    expect(result.current.CLICK_MANAGE_PROJECTS.scope_area).toBe(
      'Time projects',
    );
  });

  it('should return WFS tracking points when in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    const { result } = renderHook(() => useLandingPageTrackingPoints());

    expect(result.current).toBe(WFS_LANDING_PAGE_TRACKING_POINTS);
    expect(result.current.CLICK_MANAGE_PROJECTS.scope_area).toBe('workforce');
  });

  it('should memoize the result based on isWorkforce value', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    const { result, rerender } = renderHook(() =>
      useLandingPageTrackingPoints(),
    );
    const firstResult = result.current;

    rerender();
    expect(result.current).toBe(firstResult);
  });
});
