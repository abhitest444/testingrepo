import { renderHook } from '@testing-library/react-hooks';
import { useDetailsPageTrackingPoints } from 'src/js/widgets/timeProject/hooks/useDetailsPageTrackingPoints';
import {
  DETAILS_PAGE_TRACKING_POINTS,
  WFS_DETAILS_PAGE_TRACKING_POINTS,
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

describe('useDetailsPageTrackingPoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return QBO tracking points when not in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    const { result } = renderHook(() => useDetailsPageTrackingPoints());

    expect(result.current).toBe(DETAILS_PAGE_TRACKING_POINTS);
    expect(result.current.CLICK_ASSIGN.scope_area).toBe('Time projects');
  });

  it('should return WFS tracking points when in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    const { result } = renderHook(() => useDetailsPageTrackingPoints());

    expect(result.current).toBe(WFS_DETAILS_PAGE_TRACKING_POINTS);
    expect(result.current.CLICK_ASSIGN.scope_area).toBe('workforce');
  });
});
